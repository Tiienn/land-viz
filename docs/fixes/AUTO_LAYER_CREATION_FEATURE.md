# Auto-Layer Creation Feature (Figma/Canva Style)

**Date**: January 9, 2025
**Priority**: ⭐⭐⭐ (Critical)
**Status**: ✅ Implemented

## Problem

When drawing multiple shapes, they were all added to the same layer (e.g., "Main Layer"). The Layers panel only displayed the first shape in each layer, causing subsequent shapes to be invisible in the layer management UI. This created confusion and made it difficult to manage individual shapes.

### Example of the Issue:
```
Draw Line 1 → Goes into "Main Layer" → Shows in panel ✅
Draw Line Shape 1 → Also goes into "Main Layer" → Doesn't show (only first shape displayed) ❌
Draw Rectangle 1 → Also goes into "Main Layer" → Doesn't show ❌
```

## Root Cause

The `addShape` function in `useAppStore.ts` was using a shared layer system where:
1. All shapes were added to `activeLayerId` (typically "Layer 1" or "Main Layer")
2. The `LayerPanel.tsx` only rendered the first shape per layer: `const shape = layerShapes[0];`
3. This created a one-to-many relationship (1 layer : N shapes) but UI only showed 1:1

## Solution

### Architecture Change

Changed from **shared layers** to **auto-created individual layers** (Figma/Canva pattern):
- Each shape automatically gets its own dedicated layer
- Layer name matches the shape name
- One-to-one relationship: 1 layer = 1 shape

### Implementation

**File**: `app/src/store/useAppStore.ts`
**Lines**: 1469-1507

**Before:**
```typescript
addShape: shape => {
  const state = get();
  if (state.layers.length === 0 || !state.activeLayerId) {
    get().createLayer('Layer 1');
  }
  const currentLayerId = get().activeLayerId; // Reuses existing layer
  // ...
}
```

**After:**
```typescript
addShape: shape => {
  get().saveToHistory();

  // Auto-create a new layer for each shape (Figma/Canva style)
  const layerName = shape.name || 'Layer';
  get().createLayer(layerName); // NEW LAYER FOR EACH SHAPE

  const currentLayerId = get().activeLayerId; // Use the newly created layer

  const newShape: Shape = {
    id: generateId(),
    created: new Date(),
    modified: new Date(),
    ...shape,
    layerId: currentLayerId, // Assign to new layer
  };

  set(state => ({
    shapes: [...state.shapes, newShape],
  }), false, 'addShape');
}
```

## Result

### New Behavior:
```
Draw Line 1 → Creates layer "Line 1" → Shows in panel ✅
Draw Line Shape 2 → Creates layer "Line Shape 2" → Shows in panel ✅
Draw Rectangle 3 → Creates layer "Rectangle 3" → Shows in panel ✅
```

### Benefits:
- ✅ Every shape visible in Layers panel
- ✅ Individual layer controls per shape (visibility, lock, opacity)
- ✅ Better organization and management
- ✅ Matches industry-standard behavior (Figma, Canva, Adobe)
- ✅ Easier to rename, reorder, and group shapes

## Files Modified

- `app/src/store/useAppStore.ts` (lines 1469-1507) - `addShape` function

## Testing

1. Draw multiple shapes using different tools (Rectangle, Circle, Line, Polyline)
2. Open Layers panel
3. Verify each shape has its own layer entry
4. Verify layer names match shape names
5. Test visibility toggle, lock, and opacity controls work independently

## Related Features

- Layer management system
- Shape-to-layer mapping
- Layer naming conventions
- Multi-selection support

## Future Considerations

- **Layer Merging**: Add ability to merge multiple layers
- **Shared Layers**: Option to add shapes to existing layer (optional mode)
- **Layer Groups**: Organize auto-created layers into folders
- **Batch Operations**: Select and modify multiple auto-created layers

## Migration Notes

**Existing Projects**: Projects created before this change may have multiple shapes on one layer. These will continue to work but only the first shape will be visible in the Layers panel. Users should:
1. Use "Clear All" to start fresh, OR
2. Manually create new layers and move shapes using drag-and-drop
