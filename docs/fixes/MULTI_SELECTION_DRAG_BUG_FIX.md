# Multi-Selection Drag Bug - Implementation Fix

## Fix Summary
**File:** `app/src/components/Scene/ShapeRenderer.tsx`
**Lines to Modify:** Line 1003
**Change Type:** Replace 1 line with 3 lines
**Risk Level:** Very Low
**Estimated Time:** 2 minutes

## Code Changes

### Location
Find this code in the `completedShapes` useMemo, around line 1003:

```typescript
return visibleShapes.map((shape: Shape, index) => {
  if (!shape.points || shape.points.length < 2) return null;

  const geometry = shapeGeometries[index]?.geometry;
  const transform = shapeTransforms[index];
  const material = shapeMaterials[index];

  // ... validation code ...

  // Line 1003: THIS IS THE BUGGY LINE ❌
  const isSelected = shape.id === selectedShapeId;
  const isHovered = shape.id === hoveredShapeId && activeTool === 'select';
  const shapeElevation = layerElevations.get(shape.layerId) || elevation;

  // ... rest of the function
});
```

### The Change

**BEFORE (Line 1003):**
```typescript
const isSelected = shape.id === selectedShapeId;
```

**AFTER (Lines 1003-1006):**
```typescript
const isPrimarySelected = shape.id === selectedShapeId;
const isMultiSelected = selectedShapeIds && selectedShapeIds.includes(shape.id) && !isPrimarySelected;
const isSelected = isPrimarySelected || isMultiSelected;
```

### Full Context (Lines 995-1010)

```typescript
      // Close polyline if needed
      if (shape.type === 'polyline' && points3D.length > 2) {
        const firstPoint = points3D[0];
        const lastPoint = points3D[points3D.length - 1];
        if (firstPoint.distanceTo(lastPoint) > 0.001) {
          points3D = [...points3D, points3D[0]];
        }
      }

      // ✅ FIXED: Calculate isSelected correctly for multi-selection
      const isPrimarySelected = shape.id === selectedShapeId;
      const isMultiSelected = selectedShapeIds && selectedShapeIds.includes(shape.id) && !isPrimarySelected;
      const isSelected = isPrimarySelected || isMultiSelected;
      const isHovered = shape.id === hoveredShapeId && activeTool === 'select';
      const shapeElevation = layerElevations.get(shape.layerId) || elevation;


      return (
```

## Why This Fix Works

### Before Fix ❌
```typescript
const isSelected = shape.id === selectedShapeId;
```

This only checks if the shape is the **primary** selected shape (the one stored in `selectedShapeId`).

**Problem:** When you multi-select shapes using Shift+Click:
- `selectedShapeId` = "shape-B" (the last one you clicked)
- `selectedShapeIds` = ["shape-A", "shape-B"] (all selected shapes)

When rendering shape-A:
- `"shape-A" === "shape-B"` → **FALSE**
- `isSelected` = **FALSE**
- `onPointerDown` handler = **undefined** (not attached!)
- **Can't drag shape-A!**

### After Fix ✅
```typescript
const isPrimarySelected = shape.id === selectedShapeId;
const isMultiSelected = selectedShapeIds && selectedShapeIds.includes(shape.id) && !isPrimarySelected;
const isSelected = isPrimarySelected || isMultiSelected;
```

Now it checks BOTH:
1. Is this the primary selected shape? (`isPrimarySelected`)
2. Is this in the multi-selection array? (`isMultiSelected`)

When rendering shape-A:
- `isPrimarySelected` = FALSE ("shape-A" ≠ "shape-B")
- `isMultiSelected` = TRUE (selectedShapeIds.includes("shape-A"))
- `isSelected` = TRUE (FALSE || TRUE)
- `onPointerDown` handler = **handlePointerDown()** (attached!)
- **Can drag shape-A!** ✅

## Implementation Steps

### 1. Open the File
```bash
code app/src/components/Scene/ShapeRenderer.tsx
```

### 2. Find Line 1003
Use Ctrl+G (or Cmd+G on Mac) and type `1003` to jump to the line.

Or search for this exact text:
```
const isSelected = shape.id === selectedShapeId;
      const isHovered = shape.id === hoveredShapeId
```

### 3. Replace the Code
Delete this line (1003):
```typescript
const isSelected = shape.id === selectedShapeId;
```

Add these three lines:
```typescript
const isPrimarySelected = shape.id === selectedShapeId;
const isMultiSelected = selectedShapeIds && selectedShapeIds.includes(shape.id) && !isPrimarySelected;
const isSelected = isPrimarySelected || isMultiSelected;
```

### 4. Save the File
Press Ctrl+S (or Cmd+S on Mac)

### 5. Test the Fix
The dev server should auto-reload. Test the fix:

1. Create two rectangles
2. Shift+Click both to multi-select them
3. Click on the first rectangle (without Shift)
4. Try to drag it → **Should work now!** ✅
5. Click on the second rectangle (without Shift)
6. Try to drag it → **Should still work!** ✅

## Validation Checklist

After applying the fix, verify these scenarios:

- [ ] Single shape selection → Can drag
- [ ] Multi-select 2 shapes → Can drag the primary selection
- [ ] Multi-select 2 shapes → **Can drag the secondary selection** (this was broken)
- [ ] Multi-select 3+ shapes → Can drag any of them
- [ ] Grouped shapes → Can still drag
- [ ] Visual highlighting → Still works correctly
- [ ] No console errors → Should be clean

## What NOT to Change

### Don't Touch These:
1. **Line 620 in shapeMaterials** - This calculation is CORRECT and should remain as-is:
   ```typescript
   const isSelected = isPrimarySelected || isMultiSelected;
   ```

2. **The drag logic in useAppStore.ts** - This is working correctly and handles multi-shape dragging properly.

3. **The handleShapeClick function (Lines 714-787)** - This correctly preserves multi-selection on click.

### Why?
Those parts are already working correctly. The ONLY bug is in the event handler attachment logic at line 1003.

## Alternative Implementation (Not Recommended)

You could also check `selectedShapeIds` directly:
```typescript
const isSelected = shape.id === selectedShapeId ||
                   (selectedShapeIds && selectedShapeIds.includes(shape.id));
```

**Why not recommended:** This would mark the primary selection as BOTH primary AND multi-selected, which could cause edge cases. The recommended fix explicitly separates the two states.

## Regression Risk Analysis

### What Could Go Wrong? (Very Unlikely)
1. **Performance:** Adding 2 more variable assignments is negligible
2. **Logic errors:** The logic is identical to the working code at line 620
3. **Side effects:** The `isSelected` variable is only used for:
   - Attaching event handlers (the fix's purpose)
   - No other side effects

### Confidence Level: 99%
This fix is extremely safe because:
- It matches existing working code (line 620)
- It only affects event handler attachment
- The drag logic already handles multi-selection
- The change is isolated to one calculation

## Debugging Aid

If the fix doesn't work, add this console log to verify the calculation:

```typescript
const isPrimarySelected = shape.id === selectedShapeId;
const isMultiSelected = selectedShapeIds && selectedShapeIds.includes(shape.id) && !isPrimarySelected;
const isSelected = isPrimarySelected || isMultiSelected;

// DEBUG LOG (remove after verification)
console.log('Shape', shape.id, {
  isPrimarySelected,
  isMultiSelected,
  isSelected,
  selectedShapeId,
  selectedShapeIds
});
```

This will log for each shape during render, showing you exactly what's being calculated.

## Expected Output After Fix

When you multi-select shapes and try to drag:

**Console should show:**
```
🚀 MESH CLICKED DIRECTLY! shape-A activeTool: select
Starting drag for shape-A at {x: 5, y: 3}
Dragging shape-A... (and shape-B moves too!)
Finished dragging shape-A
```

**Visual result:**
Both/all selected shapes move together when you drag any of them.

## Commit Message Template

```
fix: Enable dragging of multi-selected (non-primary) shapes

The isSelected calculation in completedShapes useMemo only checked
the primary selection (selectedShapeId), ignoring multi-selected shapes
in the selectedShapeIds array. This caused onPointerDown handlers to
not attach to non-primary selected shapes, preventing drag operations.

Fixed by aligning the isSelected calculation with the correct logic
already used in shapeMaterials useMemo (line 620), which properly
checks both primary and multi-selection states.

Bug: Multi-selected shapes couldn't be dragged unless they were
the primary selection.

Fix: All selected shapes now have drag handlers attached.

File: app/src/components/Scene/ShapeRenderer.tsx
Lines: 1003 (changed from 1 line to 3 lines)
Risk: Very low - aligns with existing working code

Test: Multi-select 2+ shapes → drag any of them → all move together

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Documentation References
- Bug Analysis: `docs/fixes/MULTI_SELECTION_DRAG_BUG.md`
- Visual Diagram: `docs/fixes/MULTI_SELECTION_DRAG_BUG_DIAGRAM.md`
- This Fix Guide: `docs/fixes/MULTI_SELECTION_DRAG_BUG_FIX.md`
