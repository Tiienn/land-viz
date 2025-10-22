# Multi-Selection Drag Bug - Root Cause Analysis

## Bug Report
**Date:** January 20, 2025
**Severity:** High
**Component:** ShapeRenderer.tsx
**Issue:** Cannot drag multi-selected shapes - only the primary selected shape can be dragged

## User Report
User reports that when multiple shapes are selected using Shift+Click, they cannot drag the shapes. The multi-selection appears to work visually (shapes are highlighted), but dragging functionality does not work.

## Root Cause

### The Problem
There's an **inconsistent calculation of `isSelected`** in the `ShapeRenderer.tsx` component. The `isSelected` variable is calculated differently in two locations:

#### Location 1: `shapeMaterials` useMemo (Line 620) - CORRECT ✅
```typescript
const materials = visibleShapes.map((shape, index) => {
  const isPrimarySelected = shape.id === selectedShapeId;
  const isMultiSelected = selectedShapeIds && selectedShapeIds.includes(shape.id) && !isPrimarySelected;
  const isSelected = isPrimarySelected || isMultiSelected; // ✅ CORRECT: Checks both primary AND multi-selection
  // ...
});
```

This correctly identifies a shape as selected if it's either:
- The primary selected shape (`selectedShapeId`)
- OR part of the multi-selection array (`selectedShapeIds`)

#### Location 2: `completedShapes` useMemo (Line 1003) - INCORRECT ❌
```typescript
return visibleShapes.map((shape: Shape, index) => {
  // ...
  const isSelected = shape.id === selectedShapeId; // ❌ WRONG: Only checks primary selection!
  const isHovered = shape.id === hoveredShapeId && activeTool === 'select';
  // ...
});
```

This ONLY checks if the shape is the primary selected shape, completely ignoring multi-selected shapes.

### Impact on Drag Functionality

The `isSelected` variable from Location 2 (Line 1003) is used to determine whether to attach the `onPointerDown` handler:

```typescript
// Line 1022
onPointerDown={activeTool === 'select' && isSelected ? handlePointerDown(shape.id) : undefined}
```

**Result:** Only the primary selected shape gets the drag handler attached. All other multi-selected shapes don't have the handler, so they can't be dragged.

## The Fix

### Solution
Update the `isSelected` calculation in the `completedShapes` useMemo (Line 1003) to match the correct logic from `shapeMaterials`:

```typescript
// BEFORE (Line 1003) ❌
const isSelected = shape.id === selectedShapeId;

// AFTER ✅
const isPrimarySelected = shape.id === selectedShapeId;
const isMultiSelected = selectedShapeIds && selectedShapeIds.includes(shape.id) && !isPrimarySelected;
const isSelected = isPrimarySelected || isMultiSelected;
```

### File to Modify
- **File:** `app/src/components/Scene/ShapeRenderer.tsx`
- **Lines:** 1003-1005 (add the correct calculation)

### Expected Behavior After Fix
1. User Shift+Clicks to select multiple shapes
2. Both/all shapes are highlighted (this already works)
3. User clicks on ANY of the selected shapes (without Shift)
4. Multi-selection is preserved (this already works via handleShapeClick logic at lines 758-763)
5. User can drag ANY of the selected shapes
6. ALL selected shapes move together (this already works via the drag store logic)

## Code Flow Analysis

### Current Working Parts ✅
1. **Multi-selection state management:** Works correctly
   - `selectedShapeIds` array properly maintains all selected shape IDs
   - `selectedShapeId` maintains the primary selection

2. **Click handling preserves multi-selection:** Works correctly (Lines 758-763)
   ```typescript
   if (isAlreadySelected && isMultiSelection) {
     useAppStore.setState({
       selectedShapeId: shapeId,
       // selectedShapeIds stays unchanged - multi-selection preserved!
     });
   }
   ```

3. **Drag logic handles multiple shapes:** Works correctly (Lines 1847-1860)
   ```typescript
   const selectedIds = state.selectedShapeIds || [];
   const shapesToDrag = selectedIds.length > 0 ? selectedIds : [shapeId];
   const originalShapesData = new Map();
   shapesToDrag.forEach(id => { /* stores all shapes */ });
   ```

4. **finishDragging applies movement to all shapes:** Works correctly (Lines 2091-2112)
   ```typescript
   if (originalShapesData && originalShapesData.has(shape.id)) {
     // Moves all shapes in the multi-selection
   }
   ```

### Broken Part ❌
Only the **handler attachment** is broken due to the incorrect `isSelected` calculation at line 1003.

## Testing Steps

### Reproduction Steps
1. Open the application at http://localhost:5176
2. Click Rectangle tool
3. Draw rectangle #1
4. Click Rectangle tool again
5. Draw rectangle #2
6. Hold Shift and click rectangle #1 (it gets highlighted)
7. Keep holding Shift and click rectangle #2 (both are now highlighted)
8. Release Shift
9. Click on rectangle #2 (without Shift)
   - **Expected:** Both stay selected, rectangle #2 becomes primary
   - **Actual:** Both stay selected ✅ (this works)
10. Try to drag rectangle #2
    - **Expected:** Both rectangles move together
    - **Actual:** Nothing happens ❌ (BUG - no drag handler attached)
11. Try to drag rectangle #1
    - **Expected:** Both rectangles move together
    - **Actual:** Both rectangles move together ✅ (works because rectangle #1 is the primary selection)

### Verification After Fix
After applying the fix, repeat steps 1-11:
- Step 10 should now work: Dragging rectangle #2 should move both rectangles
- Step 11 should still work: Dragging rectangle #1 should move both rectangles
- **Both selected shapes should be draggable**

## Technical Details

### State Structure
```typescript
interface AppStore {
  selectedShapeId: string | null;      // Primary selection
  selectedShapeIds: string[];          // All selected shapes (for multi-selection)
  dragState: {
    isDragging: boolean;
    draggedShapeId: string | null;
    originalShapesData: Map<string, { points: Point2D[]; rotation?: Rotation }>;
  };
}
```

### Handler Attachment Logic
```typescript
// This condition determines if drag handler is attached
onPointerDown={
  activeTool === 'select' && isSelected
    ? handlePointerDown(shape.id)
    : undefined
}
```

If `isSelected` is false for multi-selected (non-primary) shapes, they get `undefined` as the handler, so pointer down events are ignored.

## Priority
**HIGH** - This breaks a core feature (multi-selection drag) that users expect to work. The fix is straightforward (3 lines of code) and low-risk since it just aligns two calculations that should have been identical.

## Related Code
- **Store drag logic:** `app/src/store/useAppStore.ts` lines 1831-2165 (startDragging, updateDragPosition, finishDragging)
- **Click handler:** `app/src/components/Scene/ShapeRenderer.tsx` lines 714-787 (handleShapeClick)
- **Pointer down handler:** `app/src/components/Scene/ShapeRenderer.tsx` lines 856-917 (handlePointerDown)

## Additional Notes
The drag system is well-designed and already supports multi-shape dragging. The bug is purely in the UI event handler attachment logic, not in the actual drag functionality. This makes it a simple fix with minimal risk.
