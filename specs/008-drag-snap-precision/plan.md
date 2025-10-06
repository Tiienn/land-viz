# Implementation Plan: Drag Snap Precision

**Spec**: 008-drag-snap-precision
**Status**: Ready for Implementation
**Estimated Effort**: 8-12 hours
**Complexity**: Medium-High

## Architecture Overview

### Current State

```
Drag System (useAppStore.ts)
├── startDragging() - Initiates drag
├── updateDragPosition() - Handles mouse movement
│   └── SimpleAlignment.detectAlignments() - Purple guides only
└── finishDragging() - Commits position

Drawing System (DrawingCanvas.tsx)
├── performSnapDetection() - Snap points during drawing
│   └── SnapGrid.findSnapPointsInRadius()
└── Shows SnapIndicator components
```

**Gap**: Snap detection only happens during drawing, not dragging.

### Target State

```
Drag System (useAppStore.ts)
├── startDragging() - Initiates drag
├── updateDragPosition() - Handles mouse movement
│   ├── SimpleAlignment.detectAlignments() - Purple guides
│   ├── dragSnapGrid.updateSnapPoints() - NEW: Edge snapping
│   ├── dragSnapGrid.findSnapPointsInRadius() - NEW
│   └── applyStickySnahttp://localhost:5173/pBehavior() - NEW: Canva effect
└── finishDragging() - Commits position

Snap System (Enhanced)
├── SnapGrid instance for drag context
├── SnapIndicator shows during drag (not just drawing)
└── Store updates: availableSnapPoints during drag
```

## Technical Approach

### Phase 1: Snap Detection During Drag

**Goal**: Detect snap points while dragging, just like during drawing.

**Changes**:
1. Import SnapGrid into useAppStore.ts ✅ (Already done)
2. Create dragSnapGrid instance ✅ (Already done)
3. In `updateDragPosition()`, add snap detection:

```typescript
// After line 1743 in useAppStore.ts
// Add snap point detection
if (snapConfig?.enabled) {
  // Update snap grid with all shapes except dragged one
  const otherShapes = state.shapes.filter(s => s.id !== state.dragState.draggedShapeId);
  dragSnapGrid.updateSnapPoints(otherShapes, currentPosition);

  // Get drag-specific snap radius (2m for precision)
  const dragSnapRadius = 2; // Configurable later

  // Find nearby snap points
  const nearbySnapPoints = dragSnapGrid.findSnapPointsInRadius(currentPosition, dragSnapRadius);

  // Filter by enabled snap types
  const filteredSnapPoints = nearbySnapPoints.filter(snap =>
    snapConfig.activeTypes?.has?.(snap.type)
  );

  // Find nearest snap point
  const nearestSnapPoint = dragSnapGrid.findNearestSnapPoint(currentPosition, dragSnapRadius);

  // Update store to show indicators
  set((prevState) => ({
    drawing: {
      ...prevState.drawing,
      snapping: {
        ...prevState.drawing.snapping,
        availableSnapPoints: filteredSnapPoints,
        activeSnapPoint: nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type) ? nearestSnapPoint : null
      }
    }
  }), false, 'updateDragSnapping');
}
```

**Files Modified**:
- `app/src/store/useAppStore.ts` (updateDragPosition function)

### Phase 2: Sticky Snap Behavior

**Goal**: Implement Canva-style magnetic locking with tactile feedback.

**Approach**: When snap is active, modify finalPosition to lock to snap point exactly.

```typescript
// After snap detection in updateDragPosition()
let finalPosition = currentPosition;

// Apply edge snapping if active
if (nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type)) {
  const distanceToSnap = Math.sqrt(
    Math.pow(nearestSnapPoint.position.x - currentPosition.x, 2) +
    Math.pow(nearestSnapPoint.position.y - currentPosition.y, 2)
  );

  // Within snap zone (0.5m = very close)
  if (distanceToSnap <= 0.5) {
    // Calculate offset to snap shape edge/corner to snap point
    // Need to account for which part of shape is snapping
    const bounds = SimpleAlignment.getShapeBounds(tempShape);

    // Find which corner/edge of dragged shape is closest to snap point
    const closestPoint = findClosestShapePoint(tempShape, nearestSnapPoint.position);

    // Calculate offset to align that point with snap point
    const snapOffsetX = nearestSnapPoint.position.x - closestPoint.x;
    const snapOffsetY = nearestSnapPoint.position.y - closestPoint.y;

    finalPosition = {
      x: currentPosition.x + snapOffsetX,
      y: currentPosition.y + snapOffsetY
    };

    // Store snap state for "sticky" release behavior
    set({
      _activeEdgeSnap: nearestSnapPoint,
      _snapActivatedTime: Date.now()
    }, false, 'activateEdgeSnap');
  }
}
```

**Helper Function Needed**:
```typescript
// Add to useAppStore.ts
function findClosestShapePoint(shape: Shape, target: Point2D): Point2D {
  let closestPoint = shape.points[0];
  let minDist = Infinity;

  // Check all shape points (corners + midpoints + center)
  for (const point of shape.points) {
    const dist = Math.sqrt(
      Math.pow(point.x - target.x, 2) +
      Math.pow(point.y - target.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closestPoint = point;
    }
  }

  return closestPoint;
}
```

**Files Modified**:
- `app/src/store/useAppStore.ts` (updateDragPosition, add helper function)

### Phase 3: Priority Logic (Edge Snap + Alignment)

**Goal**: Both snapping systems work together without conflicts.

**Approach**: Apply edge snapping first, then check if alignment is still valid.

```typescript
// In updateDragPosition(), after both detections
let finalPosition = currentPosition;

// 1. Apply edge snapping (higher precision)
if (nearestSnapPoint) {
  finalPosition = applyEdgeSnap(finalPosition, nearestSnapPoint, tempShape);
}

// 2. Apply alignment snapping (if still valid at new position)
if (result.snapPosition && snapEnabled) {
  const distanceToAlignment = Math.sqrt(
    Math.pow(result.snapPosition.x - finalPosition.x, 2) +
    Math.pow(result.snapPosition.y - finalPosition.y, 2)
  );

  // If alignment is very close, apply it too
  if (distanceToAlignment <= 1.0) {
    finalPosition = result.snapPosition;
  }
}
```

**Files Modified**:
- `app/src/store/useAppStore.ts` (refactor snap logic)

### Phase 4: Clear Snap Points After Drag

**Goal**: Remove snap indicators when drag ends.

```typescript
// In finishDragging() and cancelDragging()
// Add snap point clearing
set(prevState => ({
  drawing: {
    ...prevState.drawing,
    snapping: {
      ...prevState.drawing.snapping,
      availableSnapPoints: [],
      activeSnapPoint: null,
      snapPreviewPosition: null
    },
    alignment: {
      ...prevState.drawing.alignment,
      activeGuides: [],
      activeSpacings: [],
      snapPosition: null
    }
  }
}), false, 'clearAllSnapStates');
```

**Files Modified**:
- `app/src/store/useAppStore.ts` (finishDragging, cancelDragging)

## State Management Changes

### New State Fields (Optional)

Add to AppState type if needed for sticky behavior:

```typescript
// In types/index.ts
export interface AppState {
  // ... existing fields
  _activeEdgeSnap?: SnapPoint | null; // Current edge snap active
  _snapActivatedTime?: number; // Timestamp for sticky release
}
```

### Existing State Used

- `drawing.snapping.config` - Snap configuration
- `drawing.snapping.availableSnapPoints` - For indicators
- `drawing.snapping.activeSnapPoint` - Active snap
- `drawing.alignment.activeGuides` - Purple guides
- `drawing.alignment.snapPosition` - Alignment snap

## Integration Points

### SnapIndicator Component

**Current**: Only shows during `isDrawing` mode
**Change**: Show during `isDragging` mode too

```typescript
// In SnapIndicator.tsx (around line 50)
const store = useAppStore();
const snapping = store.drawing.snapping;
const isDrawing = store.drawing.isDrawing;
const isDragging = store.dragState.isDragging; // NEW

// Show indicators if drawing OR dragging
const shouldShowIndicators = (isDrawing || isDragging) && snapping?.config?.enabled;
```

**Files Modified**:
- `app/src/components/Scene/SnapIndicator.tsx`

### SimpleAlignmentGuides Component

**Current**: Already shows during drag
**Change**: None needed (already works!)

## Performance Optimization

### Throttling Strategy

```typescript
// In updateDragPosition()
const now = Date.now();
if (now - lastSnapUpdate < 16) {
  // Skip this frame (60 FPS throttle)
  return;
}
lastSnapUpdate = now;
```

### Spatial Filtering

```typescript
// Only check shapes within reasonable distance
const MAX_SNAP_DISTANCE = 8; // meters
const nearbyShapes = otherShapes.filter(shape => {
  const bounds = SimpleAlignment.getShapeBounds(shape);
  const dist = Math.sqrt(
    Math.pow(bounds.centerX - currentPosition.x, 2) +
    Math.pow(bounds.centerY - currentPosition.y, 2)
  );
  return dist <= MAX_SNAP_DISTANCE;
});
```

## Testing Strategy

### Unit Tests

```typescript
// app/src/__tests__/store/useAppStore.drag-snap.test.ts
describe('Drag Snap Precision', () => {
  test('detects snap points during drag', () => {
    // Setup: Create two shapes
    // Drag shape A near shape B corner
    // Assert: availableSnapPoints populated
  });

  test('snaps to exact 0.000m spacing', () => {
    // Setup: Drag shape to edge
    // Finish drag
    // Assert: Distance between edges = 0.000
  });

  test('shows both edge and alignment snaps', () => {
    // Setup: 3 shapes in alignment
    // Drag to trigger both
    // Assert: Both guides and indicators visible
  });

  test('clears snap indicators after drag ends', () => {
    // Setup: Drag with snapping active
    // Finish drag
    // Assert: availableSnapPoints = []
  });
});
```

### Integration Tests

```typescript
// app/src/__tests__/integration/drag-snap.integration.test.ts
describe('Drag Snap Integration', () => {
  test('full drag-snap-release workflow', async () => {
    // Render scene with shapes
    // Simulate drag operation
    // Verify visual feedback
    // Complete drag
    // Verify final position
  });
});
```

### Manual Testing Checklist

- [ ] Drag shape near corner - see blue circle indicator
- [ ] Drag shape near edge - see orange square indicator
- [ ] Drag shape to alignment - see pink dotted line
- [ ] Both indicators visible simultaneously
- [ ] Snap achieves 0.000m spacing (measure in app)
- [ ] Performance: 60 FPS with 50 shapes
- [ ] Works in both 2D and 3D modes
- [ ] Works with rotated shapes
- [ ] Shift key disables snapping
- [ ] Touch devices work smoothly

## Rollout Plan

### Phase 1: Core Snap Detection (2-3 hours)
- Add snap detection to updateDragPosition
- Show indicators during drag
- Test basic functionality

### Phase 2: Sticky Behavior (2-3 hours)
- Implement magnetic locking
- Add helper functions
- Test precision

### Phase 3: Polish & Integration (2-3 hours)
- Ensure both systems work together
- Performance optimization
- Clear states properly

### Phase 4: Testing & Refinement (2-3 hours)
- Write unit tests
- Manual testing
- Fix bugs
- Documentation

## Rollback Plan

If critical issues arise:
1. Comment out snap detection code in updateDragPosition
2. Revert to alignment-only dragging
3. Fix issues offline
4. Re-deploy

## Success Criteria

- ✅ Snap indicators visible during drag
- ✅ Edge snapping achieves 0.000m precision
- ✅ Both edge and alignment snaps work together
- ✅ 60 FPS maintained
- ✅ User feedback: "Feels like Canva"
- ✅ All tests pass
- ✅ No regressions in existing drag behavior

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance degradation | Medium | High | Throttle to 60 FPS, spatial filtering |
| Snap conflicts (edge vs alignment) | Low | Medium | Test thoroughly, allow both simultaneously |
| Touch device issues | Medium | Medium | Adjust snap radius for touch (3m vs 2m) |
| Rotated shape bugs | Medium | Medium | Use SnapGrid's rotation handling |
| Breaking existing drag | Low | High | Comprehensive testing, rollback plan |

## Open Technical Questions

1. **Q**: Should we add a visual "damping" effect when sticky snap activates?
   **A**: Yes, reduce drag speed by 80% within 0.5m of snap point

2. **Q**: How to handle multiple snap candidates at same distance?
   **A**: Show all indicators, snap to first detected (deterministic)

3. **Q**: Should snap radius be different for 2D vs 3D?
   **A**: No, use same radius (2m) for consistency

## Dependencies

- No external dependencies needed
- All utilities exist: SnapGrid, SimpleAlignment, SnapIndicator

## Timeline

- **Day 1**: Phase 1-2 (Core detection + sticky behavior)
- **Day 2**: Phase 3-4 (Integration + testing)
- **Total**: 1-2 days for full implementation

## Next Steps

1. Review this plan with user
2. Get approval on approach
3. Start implementation (tasks.md)
4. Iterate based on testing

---

**Plan Approved By**: _____________
**Date**: _____________
