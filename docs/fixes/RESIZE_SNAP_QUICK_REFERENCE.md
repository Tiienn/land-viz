# Resize Snap - Quick Reference Guide

**Last Updated:** January 8, 2025

## Quick Diagnosis

### Symptom: No snap indicators during resize
**Cause:** Snap grid not connected to resize operations
**Fix:** Integrate snap detection in `handlePointerMove` (see main doc)
**File:** `ResizableShapeControls.tsx`

---

### Symptom: Snap works on first resize, fails on second
**Cause:** 16ms throttle blocking snap grid updates
**Fix:** Call `resizeSnapGrid.forceUpdate()` at resize start
**Files:** `SnapGrid.ts` (add `forceUpdate()` method), `ResizableShapeControls.tsx` (call it in `onPointerDown`)

**Code snippet:**
```typescript
// In onPointerDown handler (all resize handle types)
const shapes = useAppStore.getState().shapes;
const otherShapes = shapes.filter(s => s.id !== resizingShape.id);
resizeSnapGrid.forceUpdate(otherShapes);
```

---

### Symptom: Snaps to edges instead of corners
**Cause:** Distance-only algorithm, ignoring snap strength
**Fix:** Prioritize higher-strength points when distances similar
**File:** `SnapGrid.ts` - `findNearestSnapPoint()`

**Code snippet:**
```typescript
const distanceDiff = Math.abs(distance - nearestDistance);

if (distanceDiff < 3.0) {
  // Prefer higher strength (corners=1.0 over edges=0.6)
  if (snapPoint.strength > nearestSnapPoint.strength) {
    nearestSnapPoint = snapPoint;
  }
}
```

---

### Symptom: Only 2 rectangle corners snap, not 4
**Cause:** 2-point format only creates 2 endpoint snap points
**Fix:** Expand to 4 corners before creating endpoints
**File:** `SnapGrid.ts` - `extractSnapPoints()`

**Code snippet:**
```typescript
if (shape.type === 'rectangle' && points.length === 2) {
  const [topLeft, bottomRight] = points;
  points = [
    { x: topLeft.x, y: topLeft.y },        // Top-left
    { x: bottomRight.x, y: topLeft.y },    // Top-right
    { x: bottomRight.x, y: bottomRight.y }, // Bottom-right
    { x: topLeft.x, y: bottomRight.y }      // Bottom-left
  ];
}
```

---

## Snap Point Strengths

Use these to understand priority:

| Type | Strength | Priority | Example |
|------|----------|----------|---------|
| Endpoint (corners) | 1.0 | Highest | Rectangle corners |
| Midpoint | 0.8 | High | Edge midpoints |
| Center | 0.7 | Medium | Shape center |
| Edge | 0.6 | Medium-low | Closest point on edge |
| Perpendicular | 0.5 | Low | 90° angle detection |
| Grid | 0.4 | Lowest | Grid intersections |

**Rule:** When two snap points are within 3 units, choose the higher-strength one.

---

## Key Files & Lines

### SnapGrid.ts
- `forceUpdate()`: Lines 411-419 (bypass throttle)
- `performUpdate()`: Lines 424-447 (shared update logic)
- `findNearestSnapPoint()`: Lines 449-493 (strength-based priority)
- `extractSnapPoints()`: Lines 43-67 (expand rectangles to 4 corners)

### ResizableShapeControls.tsx
- Magnetic snap during drag: Lines 807-920 (handlePointerMove)
- Snap-on-release: Lines 1137-1220 (handlePointerUp)
- Force update calls:
  - Rectangle corners: Lines 1416-1420
  - Rectangle edges: Lines 1566-1570
  - Circle corners: Lines 1666-1670
  - Circle edges: Lines 1782-1786
  - Polyline: Lines 1867-1871

---

## Testing Commands

```bash
# Start dev server
cd app && npm run dev

# Quick visual test
# 1. Draw two rectangles
# 2. Resize corner toward another corner
# 3. Should see blue circles (all 4 corners)
# 4. Should snap with magnetic pull
# 5. Final position should stay snapped
```

---

## Common Mistakes to Avoid

### ❌ Don't: Use `updateSnapPoints()` at resize start
```typescript
// This will be throttled and fail on quick resizes
resizeSnapGrid.updateSnapPoints(otherShapes);
```

### ✅ Do: Use `forceUpdate()` at resize start
```typescript
// This bypasses throttle, always works
resizeSnapGrid.forceUpdate(otherShapes);
```

---

### ❌ Don't: Assume rectangle has 4 points
```typescript
// This only works for 4-point format (not stored format)
const handlePos = rectangle.points[handleIndex];
```

### ✅ Do: Convert 2-point to 4-corner first
```typescript
if (rectangle.type === 'rectangle' && points.length === 2) {
  const [topLeft, bottomRight] = points;
  const fourCorners = [
    { x: topLeft.x, y: topLeft.y },
    { x: bottomRight.x, y: topLeft.y },
    { x: bottomRight.x, y: bottomRight.y },
    { x: topLeft.x, y: bottomRight.y }
  ];
  const handlePos = fourCorners[handleIndex];
}
```

---

### ❌ Don't: Only check distance
```typescript
if (distance < nearestDistance) {
  nearestSnapPoint = snapPoint;
}
```

### ✅ Do: Check strength when distances similar
```typescript
const distanceDiff = Math.abs(distance - nearestDistance);
if (distanceDiff < 3.0) {
  if (snapPoint.strength > nearestSnapPoint.strength) {
    nearestSnapPoint = snapPoint;
  }
}
```

---

## Debug Checklist

If snap isn't working during resize:

- [ ] Check `resizeSnapGrid.forceUpdate()` is called in `onPointerDown`
- [ ] Verify snap config has all 6 types: grid, endpoint, midpoint, center, edge, perpendicular
- [ ] Check handle position calculation (2-point to 4-corner conversion)
- [ ] Verify snap detection in `handlePointerMove` (lines 807-920)
- [ ] Check snap-on-release in `handlePointerUp` (lines 1137-1220)
- [ ] Confirm `extractSnapPoints()` expands rectangles to 4 corners
- [ ] Verify no console errors (check browser console)

---

## Performance Notes

- Force update: <1ms overhead (negligible)
- Real-time snap: 14-16ms frame time (60 FPS locked)
- Memory: No additional allocations (reuses grid)
- Throttle still active during drag (60fps updates)
- Only bypasses throttle at resize operation start

---

## See Also

- **Full Documentation:** `RESIZE_SNAP_COMPLETE_FIX.md`
- **Drag Snap:** Already working (resize now matches it)
- **Known Issues:** `docs/known-issues/` (separate issues)
