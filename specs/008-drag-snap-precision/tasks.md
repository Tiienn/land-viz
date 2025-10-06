# Task Breakdown: Drag Snap Precision

**Spec**: 008-drag-snap-precision
**Total Estimated Time**: 8-12 hours
**Complexity**: Medium-High

## Task Organization

Tasks are organized into 4 phases for incremental delivery and testing.

---

## Phase 1: Core Snap Detection (2-3 hours)

### Task 1.1: Add Snap Detection to Drag System
**Estimated Time**: 1 hour
**Priority**: High
**File**: `app/src/store/useAppStore.ts`

**Description**: Integrate SnapGrid snap detection into the `updateDragPosition` function.

**Implementation**:

```typescript
// In updateDragPosition(), after line 1743 (after tempShape creation)

// Get snap configuration
const snapConfig = state.drawing.snapping?.config;

if (snapConfig?.enabled) {
  // Update snap grid with shapes (excluding dragged shape)
  const otherShapes = state.shapes.filter(s => s.id !== state.dragState.draggedShapeId);

  // Use drag-specific snap radius (2m for precision)
  const dragSnapRadius = 2; // meters
  dragSnapGrid.setSnapDistance(dragSnapRadius);
  dragSnapGrid.updateSnapPoints(otherShapes, currentPosition);

  // Find nearby snap points within radius
  const nearbySnapPoints = dragSnapGrid.findSnapPointsInRadius(currentPosition, dragSnapRadius);

  // Filter by enabled snap types
  const filteredSnapPoints = nearbySnapPoints.filter(snap =>
    snapConfig.activeTypes?.has?.(snap.type)
  );

  // Find nearest snap point for active snapping
  const nearestSnapPoint = dragSnapGrid.findNearestSnapPoint(currentPosition, dragSnapRadius);

  // Update store with snap points (for indicators)
  set((prevState) => ({
    drawing: {
      ...prevState.drawing,
      snapping: {
        ...prevState.drawing.snapping,
        availableSnapPoints: filteredSnapPoints,
        activeSnapPoint: nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type) ? nearestSnapPoint : null,
        snapPreviewPosition: nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type) ? nearestSnapPoint.position : null
      }
    }
  }), false, 'updateDragSnapping');
}
```

**Validation**:
- Drag a shape near another shape
- Console log `availableSnapPoints` - should contain snap points
- No visual change yet (indicators come next)

**Dependencies**: None (dragSnapGrid already created)

---

### Task 1.2: Enable Snap Indicators During Drag
**Estimated Time**: 30 minutes
**Priority**: High
**File**: `app/src/components/Scene/SnapIndicator.tsx`

**Description**: Modify SnapIndicator component to show indicators during dragging, not just drawing.

**Implementation**:

```typescript
// Find the line that checks isDrawing (around line 50)
// Change from:
const isDrawing = store.drawing.isDrawing;
const shouldShow = isDrawing && snapping?.config?.enabled;

// To:
const isDrawing = store.drawing.isDrawing;
const isDragging = store.dragState.isDragging;
const shouldShow = (isDrawing || isDragging) && snapping?.config?.enabled;
```

**Validation**:
- Drag shape near another shape
- See snap indicators appear (blue circles, orange squares, green crosshairs)
- Indicators should match snap points from Task 1.1

**Dependencies**: Task 1.1 must be complete

---

### Task 1.3: Test Basic Detection
**Estimated Time**: 30 minutes
**Priority**: Medium
**File**: Manual testing

**Test Cases**:
1. **Corner Detection**:
   - Drag rectangle near another rectangle's corner
   - Expected: Blue circle indicator at corner when within 2m

2. **Edge Detection**:
   - Drag rectangle near another rectangle's edge midpoint
   - Expected: Orange square indicator at edge center when within 2m

3. **Center Detection**:
   - Drag small rectangle near large rectangle's center
   - Expected: Green crosshair at center when within 2m

4. **Multiple Indicators**:
   - Drag between two shapes
   - Expected: See indicators for both shapes simultaneously

5. **Snap Types Toggle**:
   - Disable "Endpoint" in Properties panel
   - Drag near corner
   - Expected: No blue circle indicator

**Validation**: All test cases pass

**Dependencies**: Tasks 1.1 and 1.2 must be complete

---

## Phase 2: Sticky Snap Behavior (2-3 hours)

### Task 2.1: Implement Edge Snap Position Lock
**Estimated Time**: 1.5 hours
**Priority**: High
**File**: `app/src/store/useAppStore.ts`

**Description**: When near a snap point, lock the dragged shape's position to exactly align with that snap point.

**Implementation**:

First, add helper function above `updateDragPosition`:

```typescript
// Helper function to find closest point on dragged shape to snap target
function findClosestShapePoint(shape: Shape, target: Point2D): Point2D {
  if (!shape.points || shape.points.length === 0) {
    return target;
  }

  // Apply rotation if shape is rotated
  const points = shape.rotation
    ? shape.points.map(p => {
        const angle = shape.rotation!.angle;
        const cx = shape.rotation!.center.x;
        const cy = shape.rotation!.center.y;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = p.x - cx;
        const dy = p.y - cy;
        return {
          x: cx + dx * cos - dy * sin,
          y: cy + dx * sin + dy * cos
        };
      })
    : shape.points;

  // Find closest point to target
  let closestPoint = points[0];
  let minDist = Infinity;

  for (const point of points) {
    const dist = Math.sqrt(
      Math.pow(point.x - target.x, 2) +
      Math.pow(point.y - target.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closestPoint = point;
    }
  }

  // Also check midpoints
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const midpoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
    const dist = Math.sqrt(
      Math.pow(midpoint.x - target.x, 2) +
      Math.pow(midpoint.y - target.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closestPoint = midpoint;
    }
  }

  return closestPoint;
}
```

Then, in `updateDragPosition`, after snap detection (around line 1800):

```typescript
// Apply edge snapping if active snap point detected
if (nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type)) {
  const distanceToSnap = Math.sqrt(
    Math.pow(nearestSnapPoint.position.x - currentPosition.x, 2) +
    Math.pow(nearestSnapPoint.position.y - currentPosition.y, 2)
  );

  // If within very close range (0.5m), apply precise edge snap
  if (distanceToSnap <= 0.5) {
    // Find which point on dragged shape is closest to snap target
    const closestDraggedPoint = findClosestShapePoint(tempShape, nearestSnapPoint.position);

    // Calculate offset to align closest point with snap point
    const snapOffsetX = nearestSnapPoint.position.x - closestDraggedPoint.x;
    const snapOffsetY = nearestSnapPoint.position.y - closestDraggedPoint.y;

    // Adjust final position to achieve snap
    finalPosition = {
      x: currentPosition.x + snapOffsetX,
      y: currentPosition.y + snapOffsetY
    };
  }
}
```

**Validation**:
- Drag shape to within 0.5m of another shape's corner
- Shape should "jump" to perfectly align with corner (0.000m spacing)
- Measure distance in app - should show 0.000m

**Dependencies**: Tasks 1.1-1.3 must be complete

---

### Task 2.2: Smooth Snap Transition (Optional Polish)
**Estimated Time**: 30 minutes
**Priority**: Low
**File**: `app/src/store/useAppStore.ts`

**Description**: Add smooth interpolation instead of instant "jump" to snap position.

**Implementation**:

```typescript
// Replace instant snap with lerp (linear interpolation)
const snapOffsetX = nearestSnapPoint.position.x - closestDraggedPoint.x;
const snapOffsetY = nearestSnapPoint.position.y - closestDraggedPoint.y;

// Smooth snap: 70% towards snap position each frame
const snapStrength = 0.7;
finalPosition = {
  x: currentPosition.x + snapOffsetX * snapStrength,
  y: currentPosition.y + snapOffsetY * snapStrength
};
```

**Validation**:
- Snap should feel smooth, not jarring
- Still achieves 0.000m spacing when drag ends

**Dependencies**: Task 2.1 must be complete

---

### Task 2.3: Test Snap Precision
**Estimated Time**: 30 minutes
**Priority**: High
**File**: Manual testing + unit test

**Test Cases**:

1. **Perfect Edge Alignment**:
   ```typescript
   // Drag rect A to touch rect B's right edge
   // Measure distance between edges
   // Expected: 0.000m
   ```

2. **Corner to Corner**:
   ```typescript
   // Drag rect A's corner to rect B's corner
   // Expected: Corners overlap exactly
   ```

3. **Rotated Shapes**:
   ```typescript
   // Rotate rect A by 45°
   // Drag to snap to rect B
   // Expected: Rotated corner snaps precisely
   ```

**Unit Test**:

```typescript
// app/src/__tests__/store/useAppStore.drag-snap.test.ts
import { useAppStore } from '@/store/useAppStore';

describe('Drag Snap Precision', () => {
  test('snaps to exact 0.000m spacing', () => {
    const store = useAppStore.getState();

    // Create two rectangles
    store.addShape({ type: 'rectangle', points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ]});

    store.addShape({ type: 'rectangle', points: [
      { x: 20, y: 0 },
      { x: 30, y: 0 },
      { x: 30, y: 10 },
      { x: 20, y: 10 }
    ]});

    const shapes = store.shapes;
    const shapeA = shapes[0];
    const shapeB = shapes[1];

    // Start dragging shape A
    store.startDragging(shapeA.id, { x: 5, y: 5 });

    // Drag towards shape B until snap activates
    store.updateDragPosition({ x: 14.7, y: 5 }); // Within 0.5m of edge at x=20

    // Finish drag
    store.finishDragging();

    // Get updated shape A position
    const updatedShapeA = store.shapes.find(s => s.id === shapeA.id)!;

    // Right edge of shape A should be at x=10 + offset
    const rightEdge = Math.max(...updatedShapeA.points.map(p => p.x));
    const leftEdgeB = Math.min(...shapeB.points.map(p => p.x));

    // Distance should be exactly 0.000m (touching)
    expect(rightEdge).toBeCloseTo(leftEdgeB, 3); // 3 decimal places
  });
});
```

**Validation**: All tests pass, precision verified

**Dependencies**: Task 2.1 must be complete

---

## Phase 3: Dual Snapping Integration (2-3 hours)

### Task 3.1: Coordinate Edge + Alignment Snaps
**Estimated Time**: 1 hour
**Priority**: High
**File**: `app/src/store/useAppStore.ts`

**Description**: Ensure edge snapping and alignment snapping work together without conflicts.

**Implementation**:

```typescript
// In updateDragPosition(), organize snap logic clearly
let finalPosition = currentPosition;

// Phase A: Check for edge snapping (within 0.5m of shape edges)
let edgeSnapApplied = false;
if (nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type)) {
  const distanceToSnap = Math.sqrt(
    Math.pow(nearestSnapPoint.position.x - currentPosition.x, 2) +
    Math.pow(nearestSnapPoint.position.y - currentPosition.y, 2)
  );

  if (distanceToSnap <= 0.5) {
    const closestDraggedPoint = findClosestShapePoint(tempShape, nearestSnapPoint.position);
    const snapOffsetX = nearestSnapPoint.position.x - closestDraggedPoint.x;
    const snapOffsetY = nearestSnapPoint.position.y - closestDraggedPoint.y;

    finalPosition = {
      x: currentPosition.x + snapOffsetX,
      y: currentPosition.y + snapOffsetY
    };
    edgeSnapApplied = true;
  }
}

// Phase B: Check for alignment snapping (equal spacing guides)
// This already exists in the code around line 1744-1775
// Keep this logic, it applies alignment snap to result.snapPosition

// Phase C: If both are close, prefer edge snap (already in finalPosition)
// If only alignment, use that
if (!edgeSnapApplied && result.snapPosition && snapEnabled) {
  const snapThreshold = 8;
  const distanceToSnap = Math.sqrt(
    Math.pow(result.snapPosition.x - tempShape.points[0].x, 2) +
    Math.pow(result.snapPosition.y - tempShape.points[0].y, 2)
  );

  if (distanceToSnap <= snapThreshold) {
    const bounds = SimpleAlignment.getShapeBounds(tempShape);
    const shapeCenterX = bounds.centerX;
    const shapeCenterY = bounds.centerY;
    const snapOffsetX = result.snapPosition.x - shapeCenterX;
    const snapOffsetY = result.snapPosition.y - shapeCenterY;

    finalPosition = {
      x: currentPosition.x + snapOffsetX,
      y: currentPosition.y + snapOffsetY
    };
  }
}
```

**Validation**:
- Drag shape between two shapes (alignment + edge snap both active)
- Both indicators visible: pink dotted line + blue circle
- Final position respects edge snap if closer, otherwise alignment

**Dependencies**: Phase 1 and Phase 2 complete

---

### Task 3.2: Test Dual Snapping Scenarios
**Estimated Time**: 1 hour
**Priority**: High
**File**: Manual testing

**Test Scenarios**:

1. **Edge Snap Only**:
   - Drag shape to touch edge of one shape
   - No alignment possible
   - Expected: Edge snap activates, no pink lines

2. **Alignment Only**:
   - Drag shape to align centers with two shapes
   - Not close to any edges
   - Expected: Pink dotted line visible, no edge indicators

3. **Both Active**:
   - Drag shape between two shapes
   - Position triggers both edge proximity AND center alignment
   - Expected: See both pink dotted line AND blue circle indicator
   - Expected: Final snap uses edge (closer)

4. **Alignment → Edge Transition**:
   - Start drag with alignment active
   - Continue towards edge of shape
   - Expected: Alignment guide stays visible, edge indicator appears
   - Expected: Smooth transition from alignment to edge snap

**Validation**: All scenarios work as expected, no visual conflicts

**Dependencies**: Task 3.1 complete

---

### Task 3.3: Performance Optimization
**Estimated Time**: 1 hour
**Priority**: Medium
**File**: `app/src/store/useAppStore.ts`

**Description**: Optimize snap detection to maintain 60 FPS with many shapes.

**Implementation**:

```typescript
// Add throttling to snap detection
let lastSnapCheckTime = 0;

// In updateDragPosition(), before snap detection
const now = performance.now();
if (now - lastSnapCheckTime < 16) {
  // Skip this frame (maintain 60 FPS)
  // Use previous snap state
  return;
}
lastSnapCheckTime = now;

// Add spatial filtering for large scenes
const MAX_SNAP_CHECK_DISTANCE = 10; // meters
const dragPosition = currentPosition;

const nearbyShapes = state.shapes.filter(shape => {
  if (shape.id === state.dragState.draggedShapeId) return false;

  const bounds = SimpleAlignment.getShapeBounds(shape);
  const dist = Math.sqrt(
    Math.pow(bounds.centerX - dragPosition.x, 2) +
    Math.pow(bounds.centerY - dragPosition.y, 2)
  );

  return dist <= MAX_SNAP_CHECK_DISTANCE;
});

// Use nearbyShapes instead of all shapes for snap detection
dragSnapGrid.updateSnapPoints(nearbyShapes, currentPosition);
```

**Validation**:
- Create 50+ shapes
- Drag one shape around
- Check FPS counter: Should stay at 60 FPS
- No stuttering or lag

**Dependencies**: Phase 1 and 2 complete

---

## Phase 4: Polish & Testing (2-3 hours)

### Task 4.1: Clear Snap State on Drag End
**Estimated Time**: 30 minutes
**Priority**: High
**Files**: `app/src/store/useAppStore.ts`

**Description**: Clear all snap indicators and guides when drag ends or is cancelled.

**Implementation**:

```typescript
// In finishDragging(), after line 1876 (after clearing alignment)
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

// Also update cancelDragging() with same logic (around line 1945)
```

**Validation**:
- Drag shape with snapping active
- Release mouse (finish drag)
- All indicators should disappear immediately
- Press ESC during drag (cancel drag)
- All indicators should disappear

**Dependencies**: None

---

### Task 4.2: Add Shift Key Override
**Estimated Time**: 45 minutes
**Priority**: Medium
**Files**: `app/src/store/useAppStore.ts`, `app/src/components/Scene/DrawingCanvas.tsx`

**Description**: Allow Shift key to temporarily disable snapping during drag.

**Implementation**:

1. Track Shift key state in DrawingCanvas:
```typescript
const [shiftPressed, setShiftPressed] = useState(false);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') setShiftPressed(true);
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') setShiftPressed(false);
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, []);
```

2. Pass to store:
```typescript
// Add to AppState
shiftKeyPressed: boolean;

// Add action
setShiftKey: (pressed: boolean) => {
  set({ shiftKeyPressed: pressed }, false, 'setShiftKey');
}
```

3. Check in updateDragPosition:
```typescript
const snapConfig = state.drawing.snapping?.config;
const snapEnabled = snapConfig?.enabled && !state.shiftKeyPressed;

if (snapEnabled) {
  // ... snap detection
}
```

**Validation**:
- Drag shape near edge - snapping works
- Hold Shift - snapping disabled, free drag
- Release Shift - snapping re-enables

**Dependencies**: None

---

### Task 4.3: Visual Feedback Polish
**Estimated Time**: 30 minutes
**Priority**: Low
**Files**: `app/src/components/Scene/SnapIndicator.tsx`, `app/src/components/Scene/SimpleAlignmentGuides.tsx`

**Description**: Add visual polish when snap activates (blink effect, color intensity).

**Implementation**:

```typescript
// In SnapIndicator.tsx
const activeSnapPoint = snapping?.activeSnapPoint;

// Increase opacity when snap is active
const materials = useMemo(() => ({
  endpoint: new THREE.MeshBasicMaterial({
    color: '#3B82F6',
    transparent: true,
    opacity: activeSnapPoint?.type === 'endpoint' ? 1.0 : 0.9, // Brighter when active
    depthTest: false,
    depthWrite: false
  }),
  // ... same for other types
}), [activeSnapPoint]);

// Add pulsing effect
const pulseIntensity = activeSnapPoint ? Math.sin(Date.now() * 0.01) * 0.2 + 0.8 : 1.0;
```

**Validation**:
- Snap indicators pulse/brighten when snap is active
- Visual feedback helps user know snap is locked

**Dependencies**: Phase 1-3 complete

---

### Task 4.4: Comprehensive Testing
**Estimated Time**: 1.5 hours
**Priority**: High
**Files**: Test files + manual

**Test Suite**:

1. **Unit Tests** (`app/src/__tests__/store/useAppStore.drag-snap.test.ts`):
   ```typescript
   describe('Drag Snap System', () => {
     test('detects snap points during drag');
     test('snaps to 0.000m precision');
     test('respects snap type toggles');
     test('clears snap state on drag end');
     test('shift key disables snapping');
   });
   ```

2. **Integration Tests** (`app/src/__tests__/integration/drag-snap.integration.test.ts`):
   ```typescript
   describe('Drag Snap Integration', () => {
     test('full drag-snap-release workflow');
     test('multiple shapes with complex snapping');
     test('performance with 50+ shapes');
   });
   ```

3. **Manual Test Checklist**:
   - [ ] Corner snapping (blue circles)
   - [ ] Edge snapping (orange squares)
   - [ ] Center snapping (green crosshairs)
   - [ ] Alignment guides (pink lines)
   - [ ] Both systems simultaneously
   - [ ] 0.000m precision verified
   - [ ] Works in 2D mode
   - [ ] Works in 3D mode
   - [ ] Works with rotated shapes
   - [ ] Shift key disables snapping
   - [ ] 60 FPS maintained
   - [ ] Touch devices work
   - [ ] No visual glitches

**Validation**: All tests pass, no regressions

**Dependencies**: All previous tasks complete

---

## Task 4.5: Update Documentation
**Estimated Time**: 30 minutes
**Priority**: Low
**Files**: `CLAUDE.md`, spec docs

**Updates Needed**:

1. Update `CLAUDE.md`:
```markdown
## Recent Major Changes
**Drag Snap Precision (October 2025):**
- **Edge Snapping During Drag**: Snap to corners, edges, centers while dragging
- **Dual Snapping**: Edge snapping + alignment guides work together
- **Canva-Style Feel**: Magnetic locking with smooth transitions
- **Perfect Precision**: 0.000m spacing for edge-to-edge alignment
- **Performance**: 60 FPS with 50+ shapes
- **Full Control**: Shift key to disable, configurable snap radius
```

2. Update spec status:
```markdown
**Status**: Implemented ✅
**Implemented**: 2025-10-03
```

**Validation**: Documentation accurate and complete

**Dependencies**: All features implemented

---

## Summary

**Total Tasks**: 15
**Total Estimated Time**: 8-12 hours

**Critical Path**:
1. Task 1.1 → 1.2 → 1.3 (Detection)
2. Task 2.1 → 2.3 (Snapping)
3. Task 3.1 → 3.2 (Integration)
4. Task 4.1 → 4.4 (Testing)

**Optional Tasks** (can skip if time-constrained):
- Task 2.2 (Smooth transition)
- Task 4.2 (Shift key)
- Task 4.3 (Visual polish)
- Task 4.5 (Documentation)

**Success Metrics**:
- ✅ All 15 tasks completed
- ✅ All tests passing
- ✅ 60 FPS maintained
- ✅ 0.000m precision achieved
- ✅ User feedback: "Works like Canva!"

---

Ready to start? Begin with **Task 1.1**! 🚀
