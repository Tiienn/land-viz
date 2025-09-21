# Rectangle Diagonal Line During Resize - Fix Documentation

## Issue Summary

**Problem**: When resizing rectangle shapes, the fill would immediately turn into diagonal lines instead of maintaining proper rectangle geometry.

**Severity**: High - Affected core functionality and user experience
**Date Fixed**: September 2025
**Files Modified**: `ShapeRenderer.tsx`, `GeometryCache.ts`

## Root Cause Analysis

### Initial Problem
When clicking resize handles, rectangles would show diagonal line artifacts before any dragging occurred.

### Deeper Issue
During active resizing (dragging), the rectangle outline would render as a diagonal line while the fill remained correct.

### Technical Root Cause
The issue stemmed from **inconsistent data format handling** between mesh rendering and outline rendering:

1. **Live Resize Data**: During resize operations, `liveResizePoints` contains 2-point format: `[{x:0, y:0}, {x:10, y:10}]`
2. **Mesh Rendering**: Properly converted 2-point data to 4-point rectangle geometry via `GeometryCache.getLiveResizeGeometry()`
3. **Outline Rendering**: Used raw 2-point data directly, creating a diagonal line between opposite corners

### Code Flow Problem
```javascript
// In ShapeRenderer.tsx - shape transforms
transformedPoints = drawing.liveResizePoints; // 2-point format

// Later in rendering...
// Mesh: Uses proper geometry conversion ✅
geometry = GeometryCache.getLiveResizeGeometry(shape, drawing.liveResizePoints, elevation);

// Outline: Uses raw transformed points ❌
<Line points={points3D} /> // Creates diagonal line from 2 points
```

## Fix Implementation

### Solution Strategy
Convert 2-point rectangle data to 4-point format **before** outline rendering, ensuring consistency between mesh and outline.

### Code Changes

#### File: `ShapeRenderer.tsx` (lines 772-789)

**Before:**
```javascript
// Ensure rectangle points are in the correct format for rendering
let renderPoints = shape.points;
if (shape.type === 'rectangle' && shape.points.length === 2) {
  // ... conversion logic that gets immediately overwritten
}

const transformedPoints = transform.points; // Raw 2-point data
```

**After:**
```javascript
// Get transformed points and ensure rectangles are in 4-point format for outline rendering
let transformedPoints = transform.points;

// CRITICAL FIX: Convert 2-point rectangles to 4-point format for proper outline rendering
if (shape.type === 'rectangle' && transformedPoints.length === 2) {
  const [topLeft, bottomRight] = transformedPoints;
  transformedPoints = [
    { x: topLeft.x, y: topLeft.y },      // Top left
    { x: bottomRight.x, y: topLeft.y },  // Top right
    { x: bottomRight.x, y: bottomRight.y }, // Bottom right
    { x: topLeft.x, y: bottomRight.y }   // Bottom left
  ];
  logger.log(`🔧 Converted 2-point rectangle to 4-point for outline rendering:`, {
    shapeId: shape.id,
    original: transform.points,
    converted: transformedPoints
  });
}
```

#### File: `GeometryCache.ts` (lines 114-142)

**Additional Improvements:**
- Fixed width/height calculation to work with both 2-point and 4-point formats
- Added validation for exactly 4 points before geometry creation
- Improved degenerate rectangle detection

## Testing

### Test Coverage
Created `outline-diagonal-fix.test.ts` with:
- 2-point to 4-point conversion validation
- Edge case handling (zero-sized rectangles)
- Negative coordinate support
- Dimension calculation verification

### Manual Testing
- ✅ Click resize handles - no diagonal lines
- ✅ Drag resize handles - proper rectangle outline
- ✅ Both fill and outline render consistently
- ✅ Works with all rectangle orientations

## Prevention Guidelines

### For Similar Issues

1. **Data Format Consistency**: Ensure all rendering paths use the same data format
2. **Outline vs Fill Alignment**: When mesh geometry is converted, outline points must also be converted
3. **Live State Handling**: Be careful when `liveResizePoints` or similar temporary state affects rendering

### Code Review Checklist

When modifying shape rendering:

- [ ] Does mesh rendering use converted geometry?
- [ ] Does outline rendering use the same converted points?
- [ ] Are temporary states (like `liveResizePoints`) handled consistently?
- [ ] Do both 2-point and 4-point formats work correctly?
- [ ] Are degenerate cases (zero-size shapes) handled gracefully?

## Related Files

- `ShapeRenderer.tsx` - Main rendering logic
- `GeometryCache.ts` - Geometry creation and caching
- `useAppStore.ts` - State management for resize operations
- `ResizableShapeControls.tsx` - Resize handle interactions

## Technical Notes

### Rectangle Data Formats

**2-Point Format** (storage): `[{x: 0, y: 0}, {x: 10, y: 10}]`
- Represents top-left and bottom-right corners
- Compact storage format
- Used in live resize operations

**4-Point Format** (rendering):
```javascript
[
  {x: 0, y: 0},   // Top left
  {x: 10, y: 0},  // Top right
  {x: 10, y: 10}, // Bottom right
  {x: 0, y: 10}   // Bottom left
]
```
- Required for proper outline rendering
- Used by Three.js Line component
- Prevents diagonal line artifacts

### Performance Impact
- Minimal: Conversion only occurs during active resize operations
- No impact on normal rendering or cached shapes
- Conversion is O(1) operation for rectangles

## Future Considerations

1. **Unified Conversion**: Consider creating a utility function for 2-point to 4-point conversion
2. **Type Safety**: Add TypeScript types to distinguish between 2-point and 4-point rectangle formats
3. **Other Shapes**: Monitor if similar issues occur with other shape types during live operations

## Lessons Learned

1. **Visual bugs often have data format inconsistencies as root cause**
2. **Live/temporary state requires careful handling across all rendering paths**
3. **Mesh geometry and outline rendering must use consistent data formats**
4. **Testing both static and dynamic (resize/drag) scenarios is crucial**