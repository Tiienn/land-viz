# Rotation and Resize Distortion Bug Fix

**Date**: October 20, 2025
**Issue**: After rotating a rectangle, using resize handles causes distortion. After resizing, rotation causes distortion.
**Status**: ✅ RESOLVED

---

## Executive Summary

Fixed critical coordinate space mismatch bug in the Land Visualizer application that caused shape distortion when performing resize operations after rotation, or rotation operations after resize.

**Root Cause**: The `validateShapeIntegrity()` function was converting all 2-point rectangles to 4-point format during undo/redo operations, breaking the single-selection rotation model which relies on 2-point format + rotation metadata.

**Impact**: All rotation and resize operations now work correctly without distortion for both single-selection and multi-selection scenarios.

---

## Problem Analysis

### User-Reported Issues

1. **After rotating a rectangle, resize causes distortion**: Dragging resize handles on a rotated rectangle would stretch/skew the shape instead of resizing it properly.

2. **After resizing a rectangle, rotation causes distortion**: Rotating a resized rectangle would distort the shape instead of rotating it smoothly.

3. **Console logs showed 4-point rectangles**: After rotation, rectangles were being stored with 4 points instead of the expected 2 points for single selection.

### Coordinate Space Model

The application uses two different coordinate space models:

#### Single-Selection Model (2-point format + metadata)
- **Points**: Stored in LOCAL space (unrotated) as `[topLeft, bottomRight]`
- **Rotation**: Stored as metadata `{ angle: number, center: Point2D }`
- **Rendering**: ShapeRenderer applies rotation transform during rendering
- **Advantages**: Efficient, preserves original geometry, easy undo/redo

#### Multi-Selection Model (4-point format)
- **Points**: Stored in WORLD space (already rotated) as `[topLeft, topRight, bottomRight, bottomLeft]`
- **Rotation**: Each shape has rotation metadata for its own rotation around group center
- **Rendering**: Points are already in final positions
- **Advantages**: Supports group rotation around collective center (Canva-style)

### Root Cause

The bug was caused by `validateShapeIntegrity()` function in `useAppStore.ts` (lines 2505-2516):

```typescript
// BUGGY CODE (REMOVED):
} else if (validatedShape.points.length === 2) {
  // Convert 2-point format to 4-point format for consistency
  const [topLeft, bottomRight] = validatedShape.points;
  return {
    ...validatedShape,
    points: [
      { x: topLeft.x, y: topLeft.y },      // Top left
      { x: bottomRight.x, y: topLeft.y },  // Top right
      { x: bottomRight.x, y: bottomRight.y }, // Bottom right
      { x: topLeft.x, y: bottomRight.y }   // Bottom left
    ]
  };
}
```

**Why this was problematic:**
1. After rotation, the shape correctly had 2 points + rotation metadata
2. When undo/redo occurred, `validateShapeIntegrity()` ran on history restore
3. It converted the 2-point format to 4-point format "for consistency"
4. This broke the coordinate space model - now we had 4 points (LOCAL space) + rotation metadata
5. ResizableShapeControls didn't know if 4-point format meant:
   - Multi-selection (WORLD space, no inverse rotation needed)
   - Or corrupted single-selection (LOCAL space, inverse rotation needed)
6. Wrong assumptions led to applying or not applying inverse rotation incorrectly
7. Result: distortion during resize or rotation

---

## The Fix

### 1. Remove Point Format Conversion (PRIMARY FIX)

**File**: `app/src/store/useAppStore.ts`
**Lines**: 2491-2508

```typescript
// FIXED CODE:
// Handle rectangles - ensure they have the correct structure
if (validatedShape.type === 'rectangle') {
  // CRITICAL FIX: DO NOT convert between 2-point and 4-point formats
  // - Single-selection rotation uses 2-point format + rotation metadata
  // - Multi-selection rotation uses 4-point format (points already transformed)
  // - Converting between formats breaks coordinate space assumptions

  if (validatedShape.points.length === 4) {
    // Keep 4-point format as-is (multi-selection case)
    return {
      ...validatedShape,
      points: validatedShape.points.slice(0, 4)
    };
  } else if (validatedShape.points.length === 2) {
    // Keep 2-point format as-is (single-selection case)
    return validatedShape;
  }
}
```

**Why this works:**
- Preserves the intended coordinate space model for each selection type
- Single-selection shapes keep 2-point format forever
- Multi-selection shapes keep 4-point format forever
- No more ambiguity about what point format means

### 2. Enhanced Inverse Rotation Logic

**File**: `app/src/components/Scene/ResizableShapeControls.tsx`
**Lines**: 685-717 (handlePointerMove) and 851-871 (handlePointerUp)

```typescript
// ENHANCED CODE:
// COORDINATE SPACE FIX:
// - Mouse position is in WORLD space
// - For SINGLE-selection rotated shapes: points are in LOCAL space, rotation is metadata
// - For MULTI-selection rotated shapes: points are in WORLD space (already transformed)
// - We need to convert mouse WORLD position to LOCAL space for single-selection resizing
let newPoint: Point2D = { x: intersection.x, y: intersection.z };

// Apply inverse rotation ONLY if this is a single-selection rotated shape
if (dragState.current.shapeRotation && dragState.current.shapeRotation.angle !== 0) {
  const rotation = dragState.current.shapeRotation;

  // Check if this is single or multi-selection by looking at original points format
  // Single-selection: 2-point rectangle format with rotation metadata
  // Multi-selection: Points already transformed to world space
  const isSingleSelectionRotated = dragState.current.originalPoints.length === 2;

  if (isSingleSelectionRotated) {
    // Apply inverse rotation to convert mouse world position to shape's local space
    const angleRadians = (-rotation.angle * Math.PI) / 180; // Negative for inverse
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);

    const dx = newPoint.x - rotation.center.x;
    const dy = newPoint.y - rotation.center.y;

    newPoint = {
      x: rotation.center.x + (dx * cos - dy * sin),
      y: rotation.center.y + (dx * sin + dy * cos)
    };
  }
  // else: Multi-selection or no rotation - use world coordinates directly
}
```

**Why this works:**
- Detects single vs multi-selection by checking point array length (2 = single, 4 = multi)
- Only applies inverse rotation for single-selection case (LOCAL space points)
- Multi-selection uses mouse world coordinates directly (WORLD space points)
- No more distortion from incorrect coordinate space conversions

### 3. Cleanup Debug Statements

**File**: `app/src/components/Scene/ResizableShapeControls.tsx`

Removed console.log statements:
- Line 976-980: "🔍 4-point rectangle detected"
- Line 997: "📦 Final 2-point format"
- Line 1002-1007: "🎯 RESIZE START"

Added clear inline comments explaining coordinate spaces instead.

---

## Test Scenarios

All test scenarios now work correctly:

### ✅ Scenario 1: Create → Rotate → Resize
1. Create rectangle (2-point format)
2. Rotate 45° (2-point + rotation metadata)
3. Resize (inverse rotation applied, works in LOCAL space)
4. Result: **No distortion**, shape resizes correctly

### ✅ Scenario 2: Create → Resize → Rotate
1. Create rectangle (2-point format)
2. Resize to new dimensions (stays 2-point format)
3. Rotate 45° (2-point + rotation metadata, center recalculated)
4. Result: **No distortion**, shape rotates correctly

### ✅ Scenario 3: Create → Rotate → Resize → Rotate Again
1. Create rectangle (2-point format)
2. Rotate 45° (2-point + rotation metadata)
3. Resize (inverse rotation applied, stays 2-point format)
4. Rotate to 90° (rotation metadata updated, center recalculated)
5. Result: **No distortion**, all operations work smoothly

### ✅ Scenario 4: Multi-Selection Rotation → Resize
1. Select 2+ rectangles
2. Rotate group 45° (all shapes → 4-point WORLD space format)
3. Resize individual shape (NO inverse rotation, uses WORLD coordinates)
4. Result: **No distortion**, multi-selection works correctly

### ✅ Scenario 5: Undo/Redo After Rotation
1. Create and rotate rectangle
2. Press Ctrl+Z (undo)
3. Shape returns to pre-rotation state (validateShapeIntegrity preserves 2-point)
4. Press Ctrl+Y (redo)
5. Shape returns to rotated state (validateShapeIntegrity preserves 2-point)
6. Result: **No format conversion**, coordinate space preserved

---

## Technical Details

### Coordinate Space Transformation Math

For single-selection resizing of rotated shapes, we apply **inverse rotation** to convert mouse WORLD coordinates to shape LOCAL coordinates:

```typescript
// Forward rotation (rendering): LOCAL → WORLD
x_world = center.x + (x_local - center.x) * cos(θ) - (y_local - center.y) * sin(θ)
y_world = center.y + (x_local - center.x) * sin(θ) + (y_local - center.y) * cos(θ)

// Inverse rotation (resize input): WORLD → LOCAL
x_local = center.x + (x_world - center.x) * cos(-θ) - (y_world - center.y) * sin(-θ)
y_local = center.y + (x_world - center.x) * sin(-θ) + (y_world - center.y) * cos(-θ)

// Since cos(-θ) = cos(θ) and sin(-θ) = -sin(θ):
x_local = center.x + (x_world - center.x) * cos(θ) + (y_world - center.y) * sin(θ)
y_local = center.y - (x_world - center.x) * sin(θ) + (y_world - center.y) * cos(θ)
```

### Files Modified

1. **`app/src/store/useAppStore.ts`**
   - Lines 2491-2508: Fixed `validateShapeIntegrity()` to preserve point formats
   - Impact: Prevents automatic 2-point → 4-point conversion

2. **`app/src/components/Scene/ResizableShapeControls.tsx`**
   - Lines 685-717: Enhanced `handlePointerMove()` with single-selection detection
   - Lines 851-871: Enhanced `handlePointerUp()` with single-selection detection
   - Lines 978-996: Removed debug console.log statements
   - Lines 998-1000: Removed debug console.log statements
   - Impact: Correct coordinate space handling for resize operations

---

## Key Learnings

### 1. Never Auto-Convert Coordinate Formats
**Lesson**: Format conversions should be explicit and intentional, never automatic in "validation" functions.

**Why**: Different formats represent different coordinate space models. Converting between them breaks semantic meaning.

### 2. Document Coordinate Space Assumptions
**Lesson**: Every point array should have a clear comment explaining what coordinate space it's in.

**Example**:
```typescript
// COORDINATE SPACE: LOCAL (unrotated, 2-point format for single-selection)
const originalPoints = [topLeft, bottomRight];

// COORDINATE SPACE: WORLD (already rotated, 4-point format for multi-selection)
const transformedPoints = [topLeft, topRight, bottomRight, bottomLeft];
```

### 3. Use Point Array Length as Signal
**Lesson**: Point array length can be a reliable signal for coordinate space:
- `length === 2`: Single-selection, LOCAL space
- `length === 4`: Multi-selection, WORLD space

**Why**: This creates a clear, testable contract that's easy to verify.

### 4. Inverse Transformations Need Context
**Lesson**: Before applying inverse transformations, always check if they're needed based on the coordinate space.

**Anti-pattern**: Always applying inverse rotation regardless of context
**Good pattern**: Check point format first, then decide if inverse rotation is needed

---

## Performance Impact

**Zero performance impact**:
- Removed unnecessary point conversions (performance gain)
- Added single conditional check (negligible cost)
- No new loops or heavy computations

---

## Backward Compatibility

**Fully backward compatible**:
- Existing 2-point rectangles continue to work (single-selection model)
- Existing 4-point rectangles continue to work (multi-selection model)
- No migration needed for existing user data
- Undo/redo history preserves original formats

---

## Future Recommendations

### 1. Type-Safe Coordinate Spaces

Consider using TypeScript discriminated unions to make coordinate spaces explicit:

```typescript
type LocalPoints = {
  space: 'local';
  format: '2-point';
  points: [Point2D, Point2D];
  rotation?: { angle: number; center: Point2D };
};

type WorldPoints = {
  space: 'world';
  format: '4-point';
  points: [Point2D, Point2D, Point2D, Point2D];
};

type RectanglePoints = LocalPoints | WorldPoints;
```

### 2. Unit Tests for Coordinate Transformations

Add comprehensive tests for:
- Forward rotation transformation (LOCAL → WORLD)
- Inverse rotation transformation (WORLD → LOCAL)
- Round-trip transformation (LOCAL → WORLD → LOCAL should equal original)
- Edge cases: 0°, 90°, 180°, 270°, 360° rotations

### 3. Visual Debugging Tool

Create a debug overlay that shows:
- Current point format (2-point vs 4-point)
- Coordinate space (LOCAL vs WORLD)
- Rotation metadata
- Bounding boxes in both coordinate spaces

---

## References

**Related Files**:
- `app/src/store/useAppStore.ts` - State management and validation
- `app/src/components/Scene/ResizableShapeControls.tsx` - Resize interaction
- `app/src/components/Scene/RotationControls.tsx` - Rotation interaction
- `app/src/components/Scene/ShapeRenderer.tsx` - Rendering with rotation transforms

**Related Documentation**:
- `CLAUDE.md` - Multi-selection rotation fix (January 20, 2025)
- `docs/fixes/MULTI_SELECTION_ROTATION_FIX.md` - Group rotation implementation

---

## Conclusion

This fix resolves a fundamental coordinate space mismatch that was causing distortion in rotation and resize operations. By preserving the intended point format for each selection type and applying inverse rotations only when needed, we ensure smooth, distortion-free shape transformations.

**Status**: ✅ Production-ready
**Testing**: Manual testing confirmed all scenarios work correctly
**Breaking Changes**: None
**Migration Required**: None

---

**Developer**: Claude Code (Sonnet 4.5)
**Review Status**: Ready for code review
**Deployment**: Ready for production
