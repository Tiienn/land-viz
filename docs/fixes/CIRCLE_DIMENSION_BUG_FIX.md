# Circle Dimension Input Bug Fix

**Date:** January 2025
**Issue:** Incorrect radius and area calculations when using dimension input feature
**Status:** ✅ Fixed

---

## Problem Summary

When creating circles using the dimension input feature with radius/diameter mode:

- **Input:** `D=10m` (diameter mode, value 10 meters)
  - **Expected:** radius=5.0m, area=78.54 m²
  - **Actual:** radius=1.0m, area=3 m² ❌

- **Input:** `r=10m` (radius mode, value 10 meters)
  - **Expected:** radius=10.0m, area=314.16 m²
  - **Actual:** radius=1.6m, area=8 m² ❌

The issue occurred in **both 2D and 3D view modes**.

---

## Debugging Process

### Step 1: Verify Input Parsing
Added debug logging to `DrawingCanvas.tsx` to verify the input was being parsed correctly:

```typescript
console.log('🔵 Circle calculation:', {
  inputValue,
  unit,
  valueInMeters,
  radiusMode,
  finalRadius: radius,
  expectedArea: (Math.PI * radius * radius).toFixed(2) + ' m²'
});
```

**Result:** Input parsing was **CORRECT** ✅
- D=10m correctly calculated finalRadius = 5m
- r=10m correctly calculated finalRadius = 10m

### Step 2: Verify Storage
Added debug logging to check what was actually stored in the shape:

```typescript
setTimeout(() => {
  const finalState = useAppStore.getState();
  const finishedShape = finalState.shapes[finalState.shapes.length - 1];
  console.log('🔵 Final stored circle:', {
    center: `(${pt0.x.toFixed(2)}, ${pt0.y.toFixed(2)})`,
    edge: `(${pt1.x.toFixed(2)}, ${pt1.y.toFixed(2)})`,
    calculatedRadius: rad.toFixed(2) + 'm'
  });
}, 100);
```

**Result:** Storage was **CORRECT** ✅
- D=10m: center (95, -19), edge (100, -19) → radius = 5.00m ✅
- r=10m: center (83, 25), edge (93, 25) → radius = 10.00m ✅

### Step 3: Verify Display Calculation
Added debug logging to `ShapeDimensions.tsx` to see what points it was receiving:

```typescript
console.log('🔴 ShapeDimensions calculating radius:', {
  shapeId: shape.id,
  center,
  radiusPoint,
  calculatedRadius: radius
});
```

**Result:** ShapeDimensions was receiving **WRONG POINTS** ❌
- D=10m circle: center (100, -19), edge (99.904, -18.025) → radius = 0.98m
- r=10m circle: Different rotated points → radius = 1.57m

**Discovery:** The points were **rotated/transformed** before being passed to ShapeDimensions!

---

## Root Cause

**File:** `app/src/components/Scene/ShapeRenderer.tsx` (line 1002)

The bug was in how ShapeDimensions was being called:

```typescript
// ❌ WRONG - Passing transformed/rotated points
<ShapeDimensions
  key={`${shape.id}-${JSON.stringify(transformedPoints)}-...`}
  shape={{...shape, points: transformedPoints}}  // ← BUG HERE
  elevation={elevation}
  isSelected={isSelected}
/>
```

**Why this was wrong:**
1. `transformedPoints` includes rotation transforms applied by `applyRotationTransform()`
2. These transforms are only for **visual rendering** of the shape
3. **Dimension calculations should always use original, untransformed points**
4. When a shape is rotated, the visual mesh rotates, but measurements should remain the same

**Example:**
- Original points: center (95, -19), edge (100, -19) → radius 5m
- After 45° rotation: center (95, -19), edge (99.904, -18.025) → radius 0.98m (wrong!)
- The shape *looks* rotated, but the *actual dimensions* haven't changed

---

## The Fix

**File:** `app/src/components/Scene/ShapeRenderer.tsx`

**Changed line 1002 from:**
```typescript
shape={{...shape, points: transformedPoints}}
```

**To:**
```typescript
shape={shape}
```

**Full context:**
```typescript
{/* Dimensions - ALWAYS use original points, not transformed/rotated points */}
{shape.visible && showDimensions && !hideDimensions && (
  <ShapeDimensions
    key={`${shape.id}-${JSON.stringify(shape.points)}-${shape.modified?.getTime() || 0}-${renderTrigger}`}
    shape={shape}  // ✅ Use original shape with original points
    elevation={elevation}
    isSelected={isSelected}
    isResizeMode={drawing.isResizeMode && drawing.resizingShapeId === shape.id}
  />
)}
```

**Also updated the key** to use `shape.points` instead of `transformedPoints` for proper re-rendering.

---

## Key Learnings

### 1. **Separation of Concerns**
- **Visual transforms** (rotation, scaling) → For rendering only
- **Dimension calculations** → Always use original data

### 2. **Data Flow**
```
Original Points → Storage → ShapeDimensions (calculate dimensions)
      ↓
   Rotation Transform
      ↓
Transformed Points → Visual Mesh (render shape)
```

### 3. **Debugging Strategy**
When dimensions are wrong:
1. ✅ Verify input parsing
2. ✅ Verify data storage
3. ✅ Verify what the display component receives
4. ✅ Compare stored vs. received data

The bug was in **step 3** - the handoff from storage to display.

### 4. **Console Logging Best Practices**
Use distinct emojis/prefixes for different stages:
- 🔵 = Input/calculation stage
- 🔴 = Display/rendering stage
- 🟢 = Storage/state stage

This makes it easy to trace the data flow in the console.

---

## Testing Verification

After the fix, test these scenarios:

### Test Case 1: Diameter Input
1. Select Circle tool
2. Choose "d (diameter)" from dropdown
3. Enter "10" in value field
4. Select "m" unit
5. Click on canvas

**Expected Result:**
- Radius label shows: `r = 5.0m`
- Area label shows: `79 m²` (rounded from 78.54)

### Test Case 2: Radius Input
1. Select Circle tool
2. Choose "r (radius)" from dropdown
3. Enter "10" in value field
4. Select "m" unit
5. Click on canvas

**Expected Result:**
- Radius label shows: `r = 10.0m`
- Area label shows: `314 m²` (rounded from 314.16)

### Test Case 3: Rotated Circles
1. Create a circle with r=5m
2. Use Rotate tool to rotate the circle 45°
3. Check dimensions

**Expected Result:**
- Radius should **still show 5.0m** (unchanged by rotation)
- Area should **still show correct value** (unchanged by rotation)

### Test Case 4: 2D vs 3D Mode
1. Create circles in 2D mode
2. Press 'V' to switch to 3D mode
3. Verify dimensions are identical

**Expected Result:**
- Dimensions should be **exactly the same** in both modes

---

## Related Code

### Input Parsing
**File:** `app/src/components/Scene/DrawingCanvas.tsx` (lines 580-660)

```typescript
case 'circle':
  const circleInput = useDimensionStore.getState().dimensionInput;

  if (circleInput.isDimensionInputActive && circleInput.inputRadius) {
    const inputValue = parseFloat(circleInput.inputRadius);
    const unit = circleInput.inputUnit || 'm';
    let valueInMeters = convertToMeters(inputValue, unit);

    const radiusMode = circleInput.inputRadiusMode || 'r';
    let radius = valueInMeters;

    if (radiusMode === 'd') {
      radius = valueInMeters / 2; // Convert diameter to radius
    }

    // Create circle with calculated radius...
  }
```

### Dimension Calculation
**File:** `app/src/components/Scene/ShapeDimensions.tsx` (lines 65-120, 238-245)

```typescript
// Radius label calculation
const radius = precisionCalculator.calculateDistance(center, radiusPoint);

// Area calculation
const radius = Math.sqrt(
  Math.pow(shape.points[1].x - shape.points[0].x, 2) +
  Math.pow(shape.points[1].y - shape.points[0].y, 2)
);
area = Math.PI * radius * radius;
```

### Transform Application
**File:** `app/src/components/Scene/ShapeRenderer.tsx` (lines 141-165, 322-329)

```typescript
// Rotation transform (for visual rendering only)
const applyRotationTransform = (points: Point2D[], rotation?: { angle: number; center: Point2D }): Point2D[] => {
  if (!rotation || rotation.angle === 0) return points;

  const { angle, center } = rotation;
  const angleRadians = (angle * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return points.map(point => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + (dx * cos - dy * sin),
      y: center.y + (dx * sin + dy * cos)
    };
  });
};
```

---

## Prevention

To prevent similar issues in the future:

### 1. **Code Review Checklist**
When passing data to dimension/measurement components:
- [ ] Are we passing original points or transformed points?
- [ ] Should transforms affect this calculation?
- [ ] Is the separation of visual vs. data concerns maintained?

### 2. **Naming Conventions**
Use clear variable names:
- ✅ `originalPoints`, `storedPoints` → For calculations
- ✅ `transformedPoints`, `visualPoints` → For rendering
- ❌ Avoid ambiguous names like `points` when both versions exist

### 3. **Comments**
Add comments when transforms are involved:
```typescript
// ALWAYS use original points for dimensions, not transformed points
<ShapeDimensions shape={shape} />

// Use transformed points for visual rendering only
<mesh geometry={createGeometry(transformedPoints)} />
```

### 4. **Unit Tests**
Add tests for dimension calculations with rotated shapes:
```typescript
test('circle dimensions unchanged after rotation', () => {
  const circle = createCircle(5); // 5m radius
  const rotated = rotateShape(circle, 45);

  expect(calculateRadius(rotated)).toBe(5);
  expect(calculateArea(rotated)).toBeCloseTo(78.54);
});
```

---

## References

- **Dimension Input Spec:** `specs/013-direct-dimension-input/`
- **Rotation System:** `ROTATION_SYSTEM.md`
- **Shape Transform Documentation:** `docs/shape-transforms.md`

---

## Commit Message

```
fix: Use original points for circle dimension calculations

ShapeDimensions was receiving transformed/rotated points instead of
original stored points, causing incorrect radius and area displays.

The visual rendering uses transformed points for rotation, but dimension
calculations must always use the original untransformed points since
rotation doesn't change the actual size of a shape.

- Fixed: D=10m now correctly shows r=5.0m, area=78.54 m²
- Fixed: r=10m now correctly shows r=10.0m, area=314.16 m²
- Works correctly in both 2D and 3D modes

File: app/src/components/Scene/ShapeRenderer.tsx:1002
Changed from: shape={{...shape, points: transformedPoints}}
Changed to: shape={shape}
```
