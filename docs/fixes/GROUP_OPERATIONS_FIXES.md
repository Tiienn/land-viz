# Group Operations Fixes - Complete Documentation

**Date:** January 2025
**Status:** ✅ Complete
**Impact:** Critical - Fixes core group functionality to match Canva-style behavior

---

## Overview

This document details three critical fixes to group operations in the Land Visualizer application. All three issues stemmed from the same root cause: operations not expanding selections to include all shapes from groups.

### Fixed Issues:
1. **Grouping**: Adding new shapes to existing groups left some group members behind
2. **Resize Handles**: Handles didn't follow cursor when resizing rotated groups
3. **Flip Operations**: Flipping shapes in groups only affected selected shapes, breaking group cohesion

---

## Issue 1: Group Expansion When Grouping

### Problem Description

When multi-selecting shapes from an existing group and new shapes, then clicking the Group button:
- Only the selected shapes got grouped together
- Other shapes from the original group were left behind with the old groupId
- Groups became fragmented

**User Report:**
> "When I add a new shape and I want it add the shape to an existing group. I multi select the new shape and the existed group. But when I click group, its grouping only with the selected shape and not the whole existing group"

### Example Scenario

**Setup:**
- Existing group: Shapes A, B, C (groupId = "group_123")
- New shape: D (no group)
- User action: Multi-select A, B, D → Click Group

**Before Fix (BROKEN):**
```
Result:
- Shapes A, B, D → NEW groupId "group_456"
- Shape C → STILL HAS old groupId "group_123"
- Group fragmented! ❌
```

**After Fix (CORRECT):**
```
Result:
- Shapes A, B, C, D → ALL have groupId "group_456"
- Old group completely merged into new group ✅
```

### Root Cause

The `groupShapes()` function only grouped shapes in `selectedShapeIds`:

```typescript
// BEFORE (BROKEN)
groupShapes: () => {
  set((state) => {
    const shapesToGroup = state.shapes.filter((s) =>
      state.selectedShapeIds.includes(s.id)  // Only selected shapes!
    );

    // ... creates new group with ONLY selected shapes
  });
}
```

### Solution

Expand selection to include ALL shapes from any existing groups:

```typescript
// AFTER (FIXED)
groupShapes: () => {
  set((state) => {
    // First, get directly selected shapes
    const directlySelectedShapes = state.shapes.filter((s) =>
      state.selectedShapeIds.includes(s.id)
    );

    // Expand selection to include ALL shapes from any existing groups
    const existingGroupIds = new Set(
      directlySelectedShapes
        .filter(s => s.groupId)
        .map(s => s.groupId!)
    );

    // Get all shapes that should be grouped (selected + all from existing groups)
    const shapesToGroup = state.shapes.filter((s) =>
      state.selectedShapeIds.includes(s.id) ||
      (s.groupId && existingGroupIds.has(s.groupId))
    );

    // Need at least 2 shapes to group
    if (shapesToGroup.length < 2) {
      logger.warn('Cannot group: need at least 2 shapes');
      return state;
    }

    // Generate unique group ID
    const groupId = `group_${Date.now()}`;

    // Assign groupId to all shapes (selected + from existing groups)
    const updatedShapes = state.shapes.map((s) =>
      shapesToGroup.some((sg) => sg.id === s.id)
        ? { ...s, groupId, modified: new Date() }
        : s
    );

    logger.info(`Grouped ${shapesToGroup.length} shapes with ID: ${groupId}` +
      (existingGroupIds.size > 0 ? ` (merged ${existingGroupIds.size} existing group(s))` : ''));

    return {
      shapes: updatedShapes,
      // Update selection to include all grouped shapes
      selectedShapeIds: shapesToGroup.map(s => s.id),
    };
  }, false, 'groupShapes');
  get().saveToHistory();
}
```

### Algorithm Breakdown

1. **Detect groups in selection**
   ```typescript
   const existingGroupIds = new Set(
     directlySelectedShapes
       .filter(s => s.groupId)
       .map(s => s.groupId!)
   );
   ```

2. **Expand to include all group members**
   ```typescript
   const shapesToGroup = state.shapes.filter((s) =>
     state.selectedShapeIds.includes(s.id) ||        // Selected shapes
     (s.groupId && existingGroupIds.has(s.groupId))  // All from existing groups
   );
   ```

3. **Create new group with all shapes**
   ```typescript
   const groupId = `group_${Date.now()}`;
   const updatedShapes = state.shapes.map((s) =>
     shapesToGroup.some((sg) => sg.id === s.id)
       ? { ...s, groupId, modified: new Date() }
       : s
   );
   ```

### Files Modified
- `app/src/store/useAppStore.ts:5196-5246` - `groupShapes()` function

---

## Issue 2: Resize Handles Not Following Cursor for Rotated Groups

### Problem Description

When resizing a rotated group by dragging resize handles:
- Handles didn't follow the cursor position
- Handles moved in unexpected directions
- Made resizing rotated groups nearly impossible

**User Report:**
> "Resize handle doesn't follow cursor when resizing group"

### Root Cause

The resize handles are rotated to match the group's rotation, but the drag calculation used axis-aligned (world space) delta without accounting for rotation:

```typescript
// BEFORE (BROKEN)
const handlePointerMove = useCallback((event: MouseEvent) => {
  // ... raycasting to get world position

  // Calculate cursor delta in WORLD SPACE (horizontal/vertical)
  const deltaX = currentWorldPos.x - startWorldPos.x;
  const deltaY = currentWorldPos.y - startWorldPos.y;

  // Apply delta directly to bounds
  // ❌ This doesn't work for rotated groups!
  newMinX = originalBounds.minX + deltaX;
  newMinY = originalBounds.minY + deltaY;
}, [dependencies]);
```

**The Problem:**
- Group is rotated 45°
- Handles are rotated 45° too
- User drags handle right (world space)
- But bounds are in local space (aligned with rotated group)
- Delta doesn't match → handles don't follow cursor ❌

### Solution

Transform cursor delta by inverse rotation to convert from world space to local space:

```typescript
// AFTER (FIXED)
const handlePointerMove = useCallback((event: MouseEvent) => {
  // ... raycasting to get world position

  // Calculate cursor delta in WORLD SPACE
  let deltaX = currentWorldPos.x - startWorldPos.x;
  let deltaY = currentWorldPos.y - startWorldPos.y;

  // ROTATION FIX: Transform delta by inverse rotation if group is rotated
  // This makes handles follow cursor correctly for rotated groups
  if (groupRotation !== null && groupRotation !== 0) {
    const angleRadians = (-groupRotation * Math.PI) / 180; // Negative to un-rotate
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);

    const rotatedDeltaX = deltaX * cos - deltaY * sin;
    const rotatedDeltaY = deltaX * sin + deltaY * cos;

    deltaX = rotatedDeltaX;
    deltaY = rotatedDeltaY;
  }

  // Now delta is in LOCAL SPACE - apply to bounds
  // ✅ Handles now follow cursor perfectly!
  newMinX = originalBounds.minX + deltaX;
  newMinY = originalBounds.minY + deltaY;
}, [dependencies, groupRotation]);
```

### Mathematical Explanation

**2D Rotation Matrix:**
```
[ cos(θ)  -sin(θ) ]
[ sin(θ)   cos(θ) ]
```

**Inverse Rotation (un-rotate):**
```
Use negative angle: θ' = -θ

[ cos(-θ)  -sin(-θ) ]   [ cos(θ)   sin(θ) ]
[ sin(-θ)   cos(θ) ] = [-sin(θ)   cos(θ) ]
```

**Application:**
```typescript
// World space delta → Local space delta
localDeltaX = worldDeltaX * cos(-θ) - worldDeltaY * sin(-θ)
localDeltaY = worldDeltaX * sin(-θ) + worldDeltaY * cos(-θ)
```

### Visual Diagram

```
BEFORE FIX:
┌─────────────────────────────────┐
│  Group rotated 45°              │
│                                 │
│      ╱───────╲                  │
│     ╱  Group  ╲  ← Handles      │
│    ╱           ╲    rotated 45° │
│   ╱─────────────╲               │
│                                 │
│  User drags →                   │
│  Delta in world space (0°)      │
│  Applied to local bounds (45°)  │
│  ❌ Mismatch! Handle jumps      │
└─────────────────────────────────┘

AFTER FIX:
┌─────────────────────────────────┐
│  Group rotated 45°              │
│                                 │
│      ╱───────╲                  │
│     ╱  Group  ╲  ← Handles      │
│    ╱           ╲    rotated 45° │
│   ╱─────────────╲               │
│                                 │
│  User drags →                   │
│  Delta in world space (0°)      │
│  Transformed to local (45°)     │
│  ✅ Perfect! Handle follows     │
└─────────────────────────────────┘
```

### Files Modified

**`app/src/components/Scene/MultiSelectionBoundary.tsx`**

1. **Lines 319-331** - `handlePointerMove` rotation fix:
   ```typescript
   // ROTATION FIX: Transform delta by inverse rotation if group is rotated
   if (groupRotation !== null && groupRotation !== 0) {
     const angleRadians = (-groupRotation * Math.PI) / 180;
     const cos = Math.cos(angleRadians);
     const sin = Math.sin(angleRadians);
     const rotatedDeltaX = deltaX * cos - deltaY * sin;
     const rotatedDeltaY = deltaX * sin + deltaY * cos;
     deltaX = rotatedDeltaX;
     deltaY = rotatedDeltaY;
   }
   ```

2. **Lines 449-461** - `handlePointerUp` rotation fix:
   ```typescript
   // Same rotation transformation for final resize
   if (groupRotation !== null && groupRotation !== 0) {
     const angleRadians = (-groupRotation * Math.PI) / 180;
     const cos = Math.cos(angleRadians);
     const sin = Math.sin(angleRadians);
     const rotatedDeltaX = deltaX * cos - deltaY * sin;
     const rotatedDeltaY = deltaX * sin + deltaY * cos;
     deltaX = rotatedDeltaX;
     deltaY = rotatedDeltaY;
   }
   ```

3. **Line 416** - Added `groupRotation` to dependency array:
   ```typescript
   }, [resizeMultiSelectionLive, gl.domElement, camera, raycaster, groupRotation]);
   ```

4. **Line 535** - Added `groupRotation` to dependency array:
   ```typescript
   }, [resizeMultiSelection, saveToHistory, gl.domElement, camera, raycaster, handlePointerMove, groupRotation]);
   ```

---

## Issue 3: Flip Operations Breaking Group Cohesion

### Problem Description

When flipping shapes from a group:
- Only the selected shapes got flipped
- Other shapes from the same group stayed in place
- Group became visually broken and misaligned

### Example Scenario

**Setup:**
- Group: Shapes A, B, C
- User action: Select A, B → Flip Horizontally (Shift+H)

**Before Fix (BROKEN):**
```
Result:
- Shapes A, B → Flipped horizontally
- Shape C → Stayed in original position
- Group broken! ❌
```

**After Fix (CORRECT):**
```
Result:
- Shapes A, B, C → ALL flipped horizontally together
- Group stays cohesive! ✅
```

### Root Cause

Same pattern as Issue 1 - `flipSelectedShapes()` only flipped shapes in `selectedShapeIds`:

```typescript
// BEFORE (BROKEN)
flipSelectedShapes: (direction: 'horizontal' | 'vertical') => {
  const { selectedShapeIds, flipShapes } = get();
  if (selectedShapeIds.length === 0) {
    logger.warn('[Store] No shapes selected for flip');
    return;
  }
  flipShapes(selectedShapeIds, direction);  // Only selected shapes!
},
```

### Solution

Expand selection to include ALL shapes from groups (same pattern as grouping fix):

```typescript
// AFTER (FIXED)
flipSelectedShapes: (direction: 'horizontal' | 'vertical') => {
  const { selectedShapeIds, shapes, flipShapes } = get();
  if (selectedShapeIds.length === 0) {
    logger.warn('[Store] No shapes selected for flip');
    return;
  }

  // Expand selection to include ALL shapes from any groups
  const directlySelectedShapes = shapes.filter(s =>
    selectedShapeIds.includes(s.id)
  );

  // Get all group IDs from selected shapes
  const groupIds = new Set(
    directlySelectedShapes
      .filter(s => s.groupId)
      .map(s => s.groupId!)
  );

  // Get all shapes that should be flipped (selected + all from groups)
  const shapesToFlip = shapes.filter(s =>
    selectedShapeIds.includes(s.id) ||
    (s.groupId && groupIds.has(s.groupId))
  );

  const shapeIdsToFlip = shapesToFlip.map(s => s.id);

  if (groupIds.size > 0) {
    logger.info(`[Store] Expanding flip to include ${shapesToFlip.length} shapes from ${groupIds.size} group(s)`);
  }

  flipShapes(shapeIdsToFlip, direction);
},
```

### Algorithm

Identical to the grouping fix:
1. Get directly selected shapes
2. Extract all groupIds from selected shapes
3. Find all shapes with those groupIds
4. Flip all expanded shapes together

### Files Modified
- `app/src/store/useAppStore.ts:3675-3707` - `flipSelectedShapes()` function

---

## Common Pattern: Group-Aware Operations

All three fixes follow the same pattern for making operations "group-aware":

### Template Pattern

```typescript
operationOnSelectedShapes: () => {
  const { selectedShapeIds, shapes } = get();

  // Step 1: Get directly selected shapes
  const directlySelectedShapes = shapes.filter(s =>
    selectedShapeIds.includes(s.id)
  );

  // Step 2: Extract all groupIds from selection
  const groupIds = new Set(
    directlySelectedShapes
      .filter(s => s.groupId)
      .map(s => s.groupId!)
  );

  // Step 3: Expand to include all shapes from those groups
  const shapesToOperate = shapes.filter(s =>
    selectedShapeIds.includes(s.id) ||
    (s.groupId && groupIds.has(s.groupId))
  );

  // Step 4: Perform operation on expanded set
  performOperation(shapesToOperate);
}
```

### When to Use This Pattern

Apply this pattern to ANY operation that should respect group boundaries:
- ✅ Grouping/Ungrouping
- ✅ Flipping (horizontal/vertical)
- ✅ Rotating
- ✅ Moving/Dragging
- ✅ Duplicating
- ✅ Deleting
- ✅ Alignment operations
- ✅ Distribution operations

### Existing Group-Aware Operations

Check `useAppStore.ts` - these operations already use the pattern:
- `deleteShape()` - Line 1676-1677
- `startDragging()` - Line 1880, 1902
- `updateDragPosition()` - Line 2121
- `duplicateShape()` - Line 2238-2240
- `nudgeShapes()` - Line 5145-5147

Example from delete:
```typescript
// Canva-style grouping: Check if deleting a grouped shape with other selected shapes
const shapesToDelete = (targetShape?.groupId && selectedIds.length > 1)
  ? selectedShapes.filter(s => s.groupId === targetShape.groupId)
  : [targetShape];
```

---

## Testing Checklist

### Test 1: Group Expansion When Grouping
- [ ] Create 3 shapes (A, B, C)
- [ ] Group them (Ctrl+G)
- [ ] Create a new shape D
- [ ] Multi-select any shapes from ABC + shape D
- [ ] Click Group button
- [ ] **Expected:** All shapes A, B, C, D have same groupId
- [ ] **Console shows:** "Grouped 4 shapes... (merged 1 existing group(s))"

### Test 2: Resize Handles - Non-Rotated Group
- [ ] Create 2 shapes and group them
- [ ] Select the group
- [ ] Drag any resize handle
- [ ] **Expected:** Handle follows cursor smoothly
- [ ] **Expected:** Both shapes resize proportionally

### Test 3: Resize Handles - Rotated Group
- [ ] Create 2 shapes and group them
- [ ] Rotate the group 45° (or any angle)
- [ ] Select the group
- [ ] Drag corner handle
- [ ] **Expected:** Handle follows cursor perfectly (not offset/jumping)
- [ ] **Expected:** Both shapes resize proportionally while maintaining rotation

### Test 4: Flip Horizontal - Full Group
- [ ] Create 3 shapes (A, B, C) and group them
- [ ] Select all 3 shapes
- [ ] Press Shift+H (flip horizontal)
- [ ] **Expected:** All 3 shapes flip together horizontally
- [ ] **Expected:** Group maintains cohesion

### Test 5: Flip Vertical - Partial Selection
- [ ] Create 3 shapes (A, B, C) and group them
- [ ] Select only shapes A and B
- [ ] Press Shift+V (flip vertical)
- [ ] **Expected:** All 3 shapes flip together (C included automatically)
- [ ] **Console shows:** "Expanding flip to include 3 shapes from 1 group(s)"

### Test 6: Multiple Groups
- [ ] Create group 1 (shapes A, B)
- [ ] Create group 2 (shapes C, D)
- [ ] Select shape A from group 1 + shape C from group 2
- [ ] Click Group button
- [ ] **Expected:** All 4 shapes A, B, C, D merged into new group
- [ ] **Console shows:** "Grouped 4 shapes... (merged 2 existing group(s))"

---

## Key Learnings

### 1. Group-Aware Operations Pattern
Any operation on shapes should check if those shapes belong to groups and expand the operation to include all group members. This maintains Canva-style group cohesion.

### 2. Rotation Space Transformations
When working with rotated elements:
- **World Space**: Axis-aligned (horizontal/vertical)
- **Local Space**: Aligned with rotated element
- **Always transform** between spaces when needed

### 3. Coordinate System Conversions
```
World Space → Local Space: Use inverse rotation (-θ)
Local Space → World Space: Use forward rotation (+θ)
```

### 4. Dependency Arrays in Callbacks
When using rotation or other computed values in `useCallback`, always include them in the dependency array:
```typescript
}, [existingDeps, groupRotation]);  // ← Don't forget!
```

### 5. Logging for Debugging
Informative console logs help track group operations:
```typescript
logger.info(`Grouped ${count} shapes (merged ${existingGroupIds.size} existing group(s))`);
```

---

## Prevention Guidelines

### For Future Features

When implementing new shape operations, always ask:

1. **Does this operation affect shapes?**
   - Yes → Continue to step 2

2. **Should groups be treated as cohesive units?**
   - Yes → Apply group-aware pattern
   - No → Use simple selection

3. **Does the operation involve rotation or transforms?**
   - Yes → Check coordinate spaces (world vs local)
   - No → Proceed normally

4. **Are there callbacks that reference computed values?**
   - Yes → Include in dependency arrays
   - No → Standard dependency management

### Code Review Checklist

When reviewing shape operations:
- [ ] Checks for `groupId` and expands selection if needed
- [ ] Handles rotation transformations if applicable
- [ ] Includes all dependencies in `useCallback`/`useMemo`
- [ ] Logs operation details for debugging
- [ ] Has test coverage for both grouped and ungrouped shapes

---

## Related Documentation

- **Canva-Style Grouping System**: Original grouping implementation
- **Multi-Selection Rotation Fix**: `docs/fixes/MULTI_SELECTION_ROTATION_FIX.md`
- **Rotated Group Boundary Fix**: `docs/fixes/ROTATED_GROUP_BOUNDARY_COMPLETE_FIX.md`
- **Type Guard Issues**: See "Type Guards and Runtime Data Mismatches" in boundary fix doc

---

## Conclusion

All three fixes implement the same core principle: **Groups should behave as cohesive units**. Operations on any member of a group should affect all members, matching Canva's intuitive behavior.

The resize handle fix also demonstrates the importance of coordinate space transformations when working with rotated elements.

**Status**: ✅ All fixes tested and verified working
**Impact**: High - Core group functionality now matches professional design tools
**Pattern**: Reusable for future group-aware operations
