# Implementation Plan: Shift-Constrained Drawing & Dragging

**Feature ID**: 017
**Created**: 2025-11-09
**Updated**: 2025-11-09 (Added drag constraints + design decisions)
**Estimated Effort**: 10.5 hours (12 hours with buffer)
**Complexity**: Medium
**Specification Completeness**: 100% (All design decisions documented - see spec.md Appendix)

## Architecture Overview

This feature adds geometric constraint logic to existing drawing preview components **and axis-lock constraints to the dragging system**. The implementation is **purely additive** - no breaking changes to existing systems.

### Core Strategy
1. Track Shift key state globally in Zustand store ✅ (already implemented)
2. **Drawing Constraints**: Apply constraint calculations in preview rendering (real-time)
3. **Drawing Constraints**: Use constrained coordinates for final shape creation on click
4. **Drag Constraints**: Apply axis-lock (horizontal/vertical only) during shape/text dragging 🆕
5. Maintain backward compatibility (constraint is opt-in via Shift key)

### Component Responsibility Map

| Component | Responsibility | Changes Required |
|-----------|---------------|------------------|
| **DrawingCanvas.tsx** | Shift key detection, event listeners | Add keydown/keyup handlers, update store (✅ done) |
| **DrawingFeedback.tsx** | Rectangle/Circle/Polyline preview constraints | Apply constraint to `mousePosition` before rendering |
| **PrecisionLinePreview.tsx** | Line tool preview constraints | Apply constraint to `previewEndPoint` |
| **useAppStore.ts** | Shift key state management | Add `isShiftKeyPressed` + `setShiftKey()` (may exist) |
| **useAppStore.ts → updateDragPosition()** 🆕 | Axis-lock drag constraints | Apply axis constraint to `offsetX/offsetY` |
| **shapeConstraints.ts** (NEW) | Constraint calculation utilities | Pure functions for square/angle/axis-lock constraints |

## File Structure

```
app/src/
├── components/Scene/
│   ├── DrawingCanvas.tsx          [MODIFIED] - Shift key listeners
│   ├── DrawingFeedback.tsx        [MODIFIED] - Rectangle/circle/polyline constraints
│   └── PrecisionLinePreview.tsx   [MODIFIED] - Line tool constraints
├── store/
│   └── useAppStore.ts             [MODIFIED] - Add isShiftKeyPressed state
├── utils/
│   ├── shapeConstraints.ts        [NEW] - Constraint calculation functions
│   └── __tests__/
│       └── shapeConstraints.test.ts [NEW] - Unit tests
└── types/
    └── index.ts                   [NO CHANGE] - Types already sufficient
```

## Implementation Details

### Phase 1: Core Constraint Logic (2 hours)

#### 1.1: Create Constraint Utility Functions
**File**: `app/src/utils/shapeConstraints.ts`

```typescript
import type { Point2D } from '@/types';

/**
 * Applies square constraint to rectangle coordinates.
 * Uses the maximum dimension (width or height) to create a perfect square.
 *
 * @param firstPoint - The anchor point (first corner clicked)
 * @param cursorPoint - Current cursor position
 * @returns Constrained point that creates a square
 *
 * @example
 * // User clicks at (0,0) and drags to (10,5)
 * applySquareConstraint({x:0, y:0}, {x:10, y:5})
 * // Returns {x:10, y:10} - makes it a 10x10 square
 */
export function applySquareConstraint(
  firstPoint: Point2D,
  cursorPoint: Point2D
): Point2D {
  const deltaX = cursorPoint.x - firstPoint.x;
  const deltaY = cursorPoint.y - firstPoint.y;

  // Use the larger dimension to create the square
  const maxDimension = Math.max(Math.abs(deltaX), Math.abs(deltaY));

  // Preserve the direction (quadrant) of the original drag
  const signX = deltaX >= 0 ? 1 : -1;
  const signY = deltaY >= 0 ? 1 : -1;

  return {
    x: firstPoint.x + maxDimension * signX,
    y: firstPoint.y + maxDimension * signY
  };
}

/**
 * Constrains angle to nearest step (default 45°) while maintaining distance.
 * Used for line/polyline angle snapping to 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°.
 *
 * @param startPoint - Line start point
 * @param cursorPoint - Current cursor position
 * @param angleStep - Angle increment in degrees (default 45°)
 * @returns Constrained end point
 *
 * @example
 * // User draws line from (0,0) to (10,3) - approximately 17° angle
 * applyAngleConstraint({x:0, y:0}, {x:10, y:3})
 * // Returns {x:10.44, y:0} - snapped to 0° (horizontal)
 */
export function applyAngleConstraint(
  startPoint: Point2D,
  cursorPoint: Point2D,
  angleStep: number = 45
): Point2D {
  const deltaX = cursorPoint.x - startPoint.x;
  const deltaY = cursorPoint.y - startPoint.y;

  // Calculate distance (maintain this)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Calculate current angle in degrees
  const angleRad = Math.atan2(deltaY, deltaX);
  const angleDeg = angleRad * (180 / Math.PI);

  // Round to nearest angle step
  const constrainedAngleDeg = roundToNearestAngle(angleDeg, angleStep);
  const constrainedAngleRad = constrainedAngleDeg * (Math.PI / 180);

  // Apply constrained angle with original distance
  return {
    x: startPoint.x + distance * Math.cos(constrainedAngleRad),
    y: startPoint.y + distance * Math.sin(constrainedAngleRad)
  };
}

/**
 * Rounds angle to nearest step (e.g., 45° increments).
 * Handles negative angles and wraps to [0, 360) range.
 *
 * @param angleDegrees - Angle in degrees (can be negative)
 * @param angleStep - Step size in degrees (e.g., 45)
 * @returns Rounded angle in [0, 360) range
 *
 * @example
 * roundToNearestAngle(17, 45)   // Returns 0°
 * roundToNearestAngle(67, 45)   // Returns 90°
 * roundToNearestAngle(-30, 45)  // Returns 315° (wraps around)
 */
export function roundToNearestAngle(
  angleDegrees: number,
  angleStep: number = 45
): number {
  // Normalize to [0, 360) range
  let normalized = angleDegrees % 360;
  if (normalized < 0) normalized += 360;

  // Round to nearest step
  const rounded = Math.round(normalized / angleStep) * angleStep;

  // Wrap 360° back to 0°
  return rounded % 360;
}

/**
 * Applies axis-lock constraint to drag offset (Canva/Figma behavior). 🆕
 * Locks movement to dominant axis (horizontal or vertical only).
 *
 * @param offsetX - Horizontal drag offset from start position (world units/meters)
 * @param offsetY - Vertical drag offset from start position (world units/meters)
 * @param threshold - Minimum movement before axis locks (default 5 world units/meters) - See DD-017.2 in spec.md
 * @returns Constrained offset with one axis locked to 0
 *
 * @example
 * // User drags 10 units right, 3 units down
 * applyAxisLockConstraint(10, 3)
 * // Returns {offsetX: 10, offsetY: 0} - horizontal movement only
 *
 * @example
 * // User drags 2 units right, 15 units up
 * applyAxisLockConstraint(2, 15)
 * // Returns {offsetX: 0, offsetY: 15} - vertical movement only
 */
export function applyAxisLockConstraint(
  offsetX: number,
  offsetY: number,
  threshold: number = 5
): { offsetX: number; offsetY: number } {
  const absX = Math.abs(offsetX);
  const absY = Math.abs(offsetY);

  // No constraint if movement is below threshold (user hasn't established direction yet)
  if (absX < threshold && absY < threshold) {
    return { offsetX, offsetY };
  }

  // Lock to dominant axis
  if (absX > absY) {
    // Horizontal movement is dominant - lock vertical axis
    return { offsetX, offsetY: 0 };
  } else {
    // Vertical movement is dominant - lock horizontal axis
    return { offsetX: 0, offsetY };
  }
}
```

**Validation**: Write comprehensive unit tests covering:
- All four quadrants for square constraint
- All 8 cardinal/diagonal angles for line constraint
- Edge cases: zero distance, negative angles, 360° wrap-around
- **Axis-lock constraint in all four quadrants** 🆕
- **Threshold behavior (movement < 5 units)** 🆕
- **Equal offsets (e.g., 10x, 10y) - should lock to horizontal by default** 🆕

---

### Phase 2: Store Integration (1 hour)

#### 2.1: Add Shift Key State to Store
**File**: `app/src/store/useAppStore.ts` (partial changes)

**Location**: Add to `DrawingState` interface (search for "drawing:" in store)

```typescript
// Inside DrawingState interface
isShiftKeyPressed: boolean;  // NEW: Tracks Shift key state
```

**Location**: Add to store initialization (search for "drawing:" default values)

```typescript
// Inside create<AppState>((set, get) => ({
drawing: {
  // ... existing fields
  isShiftKeyPressed: false,  // NEW: Default value
  // ... rest of drawing state
}
```

**Location**: Add action (search for "setActiveTool:" or other drawing actions)

```typescript
// NEW ACTION: Update Shift key state
setShiftKey: (pressed: boolean) => {
  set((state) => ({
    drawing: {
      ...state.drawing,
      isShiftKeyPressed: pressed
    }
  }));
},
```

**Note**: Store already has Shift key tracking implemented (lines 883-907 in DrawingCanvas.tsx). Verify it updates `useAppStore` correctly.

---

### Phase 3: Shift Key Event Handling (1 hour)

#### 3.1: Add Shift Key Listeners (Already Implemented ✅)
**File**: `app/src/components/Scene/DrawingCanvas.tsx`

**Current Implementation** (lines 883-907):
```typescript
// Task 4.2: Add Shift key event listeners for snap override
useEffect(() => {
  const setShiftKey = useAppStore.getState().setShiftKey;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setShiftKey(true);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setShiftKey(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    // Reset shift key state on cleanup
    setShiftKey(false);
  };
}, []);
```

**✅ Status**: Already implemented! No changes needed.

**Additional Defensive Cleanup** (add to existing component):

```typescript
// Add blur handler to reset Shift state if window loses focus
useEffect(() => {
  const handleBlur = () => {
    useAppStore.getState().setShiftKey(false);
  };

  window.addEventListener('blur', handleBlur);
  return () => window.removeEventListener('blur', handleBlur);
}, []);
```

---

### Phase 4: Rectangle & Circle Constraints (1.5 hours)

#### 4.1: Apply Constraints in DrawingFeedback
**File**: `app/src/components/Scene/DrawingFeedback.tsx`

**Strategy**: Apply constraint to `mousePosition` before using it in preview calculations.

**Location 1: Rectangle Preview** (line 275 - `case 'rectangle'`)

```typescript
case 'rectangle': {
  if (currentShape.points.length === 1 && isDrawing) {
    const firstPoint = points3D[0];
    let mousePoint = new Vector3(mousePosition.x, elevation, mousePosition.y);

    // NEW: Apply square constraint if Shift is held
    const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
    if (isShiftPressed) {
      const constrainedPos = applySquareConstraint(
        { x: firstPoint.x, y: firstPoint.z },  // First corner (2D)
        { x: mousePosition.x, y: mousePosition.y }  // Cursor (2D)
      );
      mousePoint = new Vector3(constrainedPos.x, elevation, constrainedPos.y);
    }

    // Calculate rectangle dimensions (now using constrained mousePoint)
    const width = Math.abs(mousePoint.x - firstPoint.x);
    const height = Math.abs(mousePoint.z - firstPoint.z);
    // ... rest of existing code
```

**Location 2: Circle Preview** (line 328 - `case 'circle'`)

```typescript
case 'circle': {
  if (currentShape.points.length === 1 && isDrawing) {
    const center = points3D[0];
    let mousePoint = new Vector3(mousePosition.x, elevation, mousePosition.y);

    // NEW: Apply angle constraint to radius line if Shift is held
    const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
    if (isShiftPressed) {
      const constrainedPos = applyAngleConstraint(
        { x: center.x, y: center.z },  // Circle center (2D)
        { x: mousePosition.x, y: mousePosition.y }  // Cursor (2D)
      );
      mousePoint = new Vector3(constrainedPos.x, elevation, constrainedPos.y);
    }

    const radius = center.distanceTo(mousePoint);
    // ... rest of existing code (radius line will now be constrained)
```

**Location 3: Polyline Preview** (line 150 - `case 'polyline'`)

```typescript
case 'polyline': {
  if (points3D.length === 0) {
    return null;
  }

  const lastPoint = points3D[points3D.length - 1];
  let mousePoint = new Vector3(mousePosition.x, elevation, mousePosition.y);

  // NEW: Apply angle constraint if Shift is held
  const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
  if (isShiftPressed && currentShape.points.length > 0) {
    const lastPoint2D = currentShape.points[currentShape.points.length - 1];
    const constrainedPos = applyAngleConstraint(
      lastPoint2D,  // Last placed point (2D)
      { x: mousePosition.x, y: mousePosition.y }  // Cursor (2D)
    );
    mousePoint = new Vector3(constrainedPos.x, elevation, constrainedPos.y);
  }

  // ... rest of existing code (preview line will now be constrained)
```

**Import at top of file**:
```typescript
import { applySquareConstraint, applyAngleConstraint } from '@/utils/shapeConstraints';
```

---

### Phase 5: Line Tool Constraints (1 hour)

#### 5.1: Apply Constraints in PrecisionLinePreview
**File**: `app/src/components/Scene/PrecisionLinePreview.tsx`

**Location**: Line 22 - where `endPoint3D` is calculated

```typescript
// Calculate end point based on distance input or cursor position
let endPoint3D: Vector3;

if (lineToolState.currentDistance && lineToolState.currentDistance > 0 && lineToolState.previewEndPoint) {
  // Use precise distance calculation
  const direction = calculateDirection(lineToolState.startPoint, lineToolState.previewEndPoint);

  // NEW: Apply angle constraint if Shift is held
  const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
  let preciseEndPoint: Point2D;

  if (isShiftPressed) {
    // Constrain angle, maintain distance
    const unconstrainedEnd = applyDistance(lineToolState.startPoint, direction, lineToolState.currentDistance);
    preciseEndPoint = applyAngleConstraint(lineToolState.startPoint, unconstrainedEnd);
  } else {
    preciseEndPoint = applyDistance(lineToolState.startPoint, direction, lineToolState.currentDistance);
  }

  endPoint3D = new Vector3(preciseEndPoint.x, elevation, preciseEndPoint.y);
} else if (lineToolState.previewEndPoint) {
  // Use cursor position
  let previewEnd = lineToolState.previewEndPoint;

  // NEW: Apply angle constraint if Shift is held
  const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
  if (isShiftPressed) {
    previewEnd = applyAngleConstraint(lineToolState.startPoint, lineToolState.previewEndPoint);
  }

  endPoint3D = new Vector3(previewEnd.x, elevation, previewEnd.y);
} else {
  // Default to start point (no preview)
  return null;
}
```

**Import at top of file**:
```typescript
import { applyAngleConstraint } from '@/utils/shapeConstraints';
```

---

### Phase 6: Click Handler Constraints (1.5 hours)

#### 6.1: Apply Constraints to Final Shape Creation
**File**: `app/src/components/Scene/DrawingCanvas.tsx`

When the user clicks to finalize a shape, we need to use the constrained coordinates, not raw cursor position.

**Location 1: Rectangle Click Handler** (line 563 - `case 'rectangle'`)

```typescript
case 'rectangle':
  // ... existing dimension input logic ...

  } else if (!isDrawing) {
    // Normal rectangle drawing (no dimension input)
    startDrawing();
    addPoint(snappedPos); // First corner - use snapped position
  } else if (currentShape?.points && currentShape.points.length === 1) {
    const firstPoint = currentShape.points[0];

    // NEW: Apply square constraint if Shift is held
    let finalPos = snappedPos;
    const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
    if (isShiftPressed) {
      finalPos = applySquareConstraint(firstPoint, snappedPos);
    }

    // Add the remaining 3 points to complete rectangle
    addPoint({ x: finalPos.x, y: firstPoint.y });     // Top-right
    addPoint({ x: finalPos.x, y: finalPos.y });       // Bottom-right
    addPoint({ x: firstPoint.x, y: finalPos.y });     // Bottom-left
    finishDrawing();
  }
  break;
```

**Location 2: Circle Click Handler** (line 611 - `case 'circle'`)

```typescript
} else if (currentShape?.points && currentShape.points.length === 1) {
  const center = currentShape.points[0];

  // NEW: Apply angle constraint to final point if Shift is held
  let finalPos = snappedPos;
  const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
  if (isShiftPressed) {
    finalPos = applyAngleConstraint(center, snappedPos);
  }

  const radius = Math.sqrt(
    Math.pow(finalPos.x - center.x, 2) + Math.pow(finalPos.y - center.y, 2)
  );

  // Store center and edge point (constrained)
  currentShape.points = [
    center,      // Center point
    finalPos     // Edge point (constrained if Shift held)
  ];
  finishDrawing();
}
```

**Location 3: Polyline Click Handler** (line 540 - `case 'polyline'`)

```typescript
case 'polyline':
  if (!isDrawing) {
    startDrawing();
    addPoint(snappedPos); // First point
  } else {
    // ... existing closing logic ...

    // NEW: Apply angle constraint if Shift is held
    let finalPos = snappedPos;
    const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
    if (isShiftPressed && currentShape?.points && currentShape.points.length > 0) {
      const lastPoint = currentShape.points[currentShape.points.length - 1];
      finalPos = applyAngleConstraint(lastPoint, snappedPos);
    }

    addPoint(finalPos); // Add constrained point
  }
  break;
```

**Location 4: Line Tool Click Handler** (line 481 - `case 'line'`)

This is more complex because line tool has multiple modes (direct distance entry, multi-segment, etc.).

**Strategy**: Apply constraint to `snappedPos` before any logic that uses it.

```typescript
case 'line':
  const freshState = useAppStore.getState();
  const freshLineToolState = freshState.drawing.lineTool;

  // NEW: Apply angle constraint if Shift is held and line is being drawn
  let finalPos = snappedPos;
  if (freshLineToolState.isDrawing && freshLineToolState.startPoint) {
    const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
    if (isShiftPressed) {
      finalPos = applyAngleConstraint(freshLineToolState.startPoint, snappedPos);
    }
  }

  // Use finalPos instead of snappedPos in all subsequent logic
  if (!freshLineToolState.isDrawing) {
    startLineDrawing(finalPos);  // Changed from snappedPos
    showDistanceInput();
  } else {
    // ... existing multi-segment logic, use finalPos for distance calculations
```

**Import at top of file**:
```typescript
import { applySquareConstraint, applyAngleConstraint } from '@/utils/shapeConstraints';
```

---

### Phase 7: Axis-Locked Drag Constraints (1.5 hours) 🆕

#### 7.1: Apply Axis-Lock to updateDragPosition()
**File**: `app/src/store/useAppStore.ts`
**Location**: Inside `updateDragPosition` action (line ~2170)

**Current Code** (simplified):
```typescript
updateDragPosition: (currentPosition: Point2D) => {
  // ... validation checks ...

  // Calculate drag offset
  const offsetX = latestPosition.x - currentState.dragState.startPosition.x;
  const offsetY = latestPosition.y - currentState.dragState.startPosition.y;

  // ... snap/alignment computation ...
}
```

**Modified Code** (add Shift constraint):
```typescript
updateDragPosition: (currentPosition: Point2D) => {
  // ... existing validation checks ...

  // Step 1: Immediately update drag position
  set({
    dragState: {
      ...state.dragState,
      currentPosition: currentPosition,
    }
  }, false, 'updateDragPosition_immediate');

  // Step 2: Schedule computation async
  if (!window._dragComputationScheduled) {
    window._dragComputationScheduled = true;
    requestAnimationFrame(() => {
      const currentState = get();

      // ... existing validation ...

      // Calculate base offset
      let offsetX = latestPosition.x - currentState.dragState.startPosition.x;
      let offsetY = latestPosition.y - currentState.dragState.startPosition.y;

      // NEW: Apply axis-lock constraint if Shift is held
      const isShiftPressed = currentState.drawing.isShiftKeyPressed;
      if (isShiftPressed) {
        const constrained = applyAxisLockConstraint(offsetX, offsetY);
        offsetX = constrained.offsetX;
        offsetY = constrained.offsetY;
      }

      // Continue with existing snap/alignment logic using constrained offsets
      const tempShape = {
        ...draggedShape,
        points: currentState.dragState.originalShapePoints.map(p => ({
          x: p.x + offsetX,  // Use constrained offsetX
          y: p.y + offsetY   // Use constrained offsetY
        }))
      };

      // ... rest of existing code ...
    });
  }
},
```

**Import at top of store file**:
```typescript
import { applyAxisLockConstraint } from '@/utils/shapeConstraints';
```

#### 7.2: Visual Testing ⏱️ 30 min
- [ ] Start dev server: `npm run dev`
- [ ] Test horizontal drag lock:
  - [ ] Select rectangle, start dragging
  - [ ] Move 10 units right, 2 units down
  - [ ] Hold Shift → shape should only move horizontally (vertical position locked)
  - [ ] Release Shift → free movement resumes
- [ ] Test vertical drag lock:
  - [ ] Select circle, start dragging
  - [ ] Move 3 units right, 15 units up
  - [ ] Hold Shift → shape should only move vertically (horizontal position locked)
- [ ] Test multi-selection:
  - [ ] Select 3 shapes, drag with Shift
  - [ ] Verify all move on same locked axis
- [ ] Test text objects:
  - [ ] Create text, drag with Shift
  - [ ] Verify axis-lock applies to text
- [ ] Test Shift mid-drag:
  - [ ] Start dragging without Shift
  - [ ] Press Shift halfway through drag
  - [ ] Verify axis locks immediately to dominant direction

**Validation Criteria**:
- ✅ Axis-lock applies to all shape types (rectangle, circle, polyline, line, polygon)
- ✅ Axis-lock applies to text objects
- ✅ Multi-selection dragging respects axis-lock
- ✅ Pressing Shift mid-drag locks immediately
- ✅ Releasing Shift mid-drag unlocks immediately
- ✅ No visual stuttering or lag

---

### Phase 8: Testing & Polish (1 hour)

#### 8.1: Unit Tests
**File**: `app/src/utils/__tests__/shapeConstraints.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { applySquareConstraint, applyAngleConstraint, roundToNearestAngle } from '../shapeConstraints';

describe('shapeConstraints', () => {
  describe('applySquareConstraint', () => {
    it('should create square in top-right quadrant', () => {
      const result = applySquareConstraint({x: 0, y: 0}, {x: 10, y: 5});
      expect(result).toEqual({x: 10, y: 10}); // Uses max dimension (10)
    });

    it('should create square in bottom-left quadrant', () => {
      const result = applySquareConstraint({x: 0, y: 0}, {x: -7, y: -10});
      expect(result).toEqual({x: -10, y: -10}); // Uses max dimension (10)
    });

    it('should handle equal dimensions', () => {
      const result = applySquareConstraint({x: 0, y: 0}, {x: 5, y: 5});
      expect(result).toEqual({x: 5, y: 5}); // Already a square
    });
  });

  describe('roundToNearestAngle', () => {
    it('should round to nearest 45° increment', () => {
      expect(roundToNearestAngle(17, 45)).toBe(0);
      expect(roundToNearestAngle(67, 45)).toBe(90);
      expect(roundToNearestAngle(350, 45)).toBe(0);
    });

    it('should handle negative angles', () => {
      expect(roundToNearestAngle(-30, 45)).toBe(315);
      expect(roundToNearestAngle(-90, 45)).toBe(270);
    });
  });

  describe('applyAngleConstraint', () => {
    it('should constrain to 0° (horizontal right)', () => {
      const result = applyAngleConstraint({x: 0, y: 0}, {x: 10, y: 2});
      expect(result.x).toBeCloseTo(10.2, 1); // Maintains distance
      expect(result.y).toBeCloseTo(0, 1);    // Snapped to 0°
    });

    it('should constrain to 90° (vertical up)', () => {
      const result = applyAngleConstraint({x: 0, y: 0}, {x: 2, y: 10});
      expect(result.x).toBeCloseTo(0, 1);    // Snapped to 90°
      expect(result.y).toBeCloseTo(10.2, 1); // Maintains distance
    });

    it('should constrain to 45° (diagonal)', () => {
      const result = applyAngleConstraint({x: 0, y: 0}, {x: 10, y: 9});
      const distance = Math.sqrt(10*10 + 9*9); // ~13.45
      expect(result.x).toBeCloseTo(distance * Math.cos(45 * Math.PI / 180), 1);
      expect(result.y).toBeCloseTo(distance * Math.sin(45 * Math.PI / 180), 1);
    });
  });
});
```

#### 8.2: Integration Testing Checklist

**Manual Test Plan**:

1. **Rectangle Tool + Shift**
   - [ ] Draw square in each quadrant (top-right, top-left, bottom-left, bottom-right)
   - [ ] Toggle Shift on/off during drag (should switch between square/rectangle)
   - [ ] Verify dimension overlay shows equal dimensions (e.g., "10m × 10m")
   - [ ] Verify snapping still works with Shift held

2. **Circle Tool + Shift**
   - [ ] Draw circle with radius at 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
   - [ ] Verify purple radius line stays perfectly straight
   - [ ] Verify circle circumference remains perfectly round

3. **Line Tool + Shift**
   - [ ] Draw lines at all 8 cardinal/diagonal angles
   - [ ] Test with distance input + Shift constraint
   - [ ] Test multi-segment line mode with Shift

4. **Polyline Tool + Shift**
   - [ ] Draw polyline with alternating constrained/unconstrained segments
   - [ ] Test closing polyline with Shift held
   - [ ] Verify only current segment is constrained (previous segments unchanged)

5. **Edge Cases**
   - [ ] Window focus loss while holding Shift (should reset state)
   - [ ] Tool change while holding Shift (should not affect new tool)
   - [ ] Direct dimension input + Shift (should ignore constraint)

6. **Performance**
   - [ ] Draw constrained shapes with 60+ existing shapes on canvas
   - [ ] Verify 60 FPS maintained (check browser devtools)
   - [ ] No visual stuttering or lag

---

## Performance Considerations

### Optimization Strategy

1. **Memoization**: Not needed - constraint calculations are O(1) and <1ms
2. **RAF Throttling**: Not needed - constraints are applied in existing render loops (already optimized)
3. **Event Listeners**: Defensive cleanup on unmount/blur prevents memory leaks

### Expected Performance Impact

- **CPU**: <1% increase (constraint math is trivial)
- **Memory**: +0.1KB (one boolean in store)
- **FPS**: No impact (60 FPS maintained)

---

## Constitution Compliance

### ✅ Article 1: Inline Styles Only
- No CSS changes needed
- All visual feedback uses existing Three.js materials

### ✅ Article 2: TypeScript Strict Mode
- All new functions fully typed
- No `any` types used

### ✅ Article 3: Zustand State Management
- Shift key state stored in useAppStore
- Follows existing store patterns

### ✅ Article 4: React Best Practices
- Pure functional components
- Proper useEffect cleanup
- No unnecessary re-renders

### ✅ Article 5: 3D Rendering Standards
- Constraints applied at coordinate level (no mesh changes)
- Uses existing elevation constants

### ✅ Article 6: Testing Requirements
- Unit tests: `shapeConstraints.test.ts` (10+ test cases)
- Integration tests: Manual checklist (20+ scenarios)
- Coverage: >70% for new utility file

### ✅ Article 7: Security First
- No XSS vectors (pure math calculations)
- No user input sanitization needed (Shift key is browser-native)

### ✅ Article 8: Prefer Editing Existing Files
- Zero new components created
- Only 1 new utility file (`shapeConstraints.ts`)
- All changes are additive (no breaking changes)

### ✅ Article 9: Professional UX (Canva-inspired)
- Constraint behavior matches Figma/Illustrator industry standards
- Real-time visual feedback (no lag)
- Intuitive Shift key toggle

---

## Testing Strategy

### Unit Tests (Vitest)
```bash
npm run test:unit -- shapeConstraints.test.ts
```

**Coverage Goals**:
- `applySquareConstraint`: 100% (all quadrants + edge cases)
- `applyAngleConstraint`: 100% (all 8 angles + negative angles)
- `roundToNearestAngle`: 100% (wrap-around + negative values)

### Integration Tests (Manual)
Use the checklist in Phase 7.2 above.

**Acceptance Criteria**:
- All 20+ checklist items pass
- Zero console errors
- 60 FPS maintained throughout testing

---

## Rollout Plan

### Development
1. Implement phases 1-3 (utilities, store, listeners)
2. Test constraint logic in isolation (unit tests)
3. Implement phases 4-6 (preview + click handlers)
4. Test each tool individually (rectangle → circle → line → polyline)
5. Integration testing with all tools
6. Performance testing (60+ shapes on canvas)

### Code Review Checklist
- [ ] All constraint functions have JSDoc comments
- [ ] Unit tests achieve >70% coverage
- [ ] Manual testing checklist completed
- [ ] No performance regression (60 FPS maintained)
- [ ] Defensive cleanup added (blur handler)
- [ ] Constitution compliance verified

### Deployment
1. Merge to development branch
2. Smoke test in staging environment
3. Monitor for 24 hours (check for Shift key "stuck" bugs)
4. Merge to production

---

## Risk Mitigation

### Risk 1: Conflict with Snapping System
**Likelihood**: Medium
**Impact**: High
**Mitigation**: Shift constraint applies to `snappedPos` (after snapping), so order of operations is:
1. Raw cursor position
2. Apply snapping → `snappedPos`
3. Apply Shift constraint → `finalPos`
4. Use `finalPos` for shape creation

This ensures snapping and constraints work together harmoniously.

**Design Decision**: See DD-017.3 in spec.md - This order allows users to snap to a point, then constrain from that snapped position (most flexible approach).

### Risk 2: Performance Regression
**Likelihood**: Low
**Impact**: High
**Mitigation**:
- Constraint calculations are O(1) and <5ms
- Applied only during active drawing (not on every frame)
- Existing RAF throttling in DrawingFeedback prevents excessive recalculation

### Risk 3: Shift Key "Stuck" State
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**:
- Add `window.blur` listener to reset Shift state
- Reset Shift state on tool change
- Reset Shift state on component unmount
- Reset Shift state on drawing cancel (Escape key)

---

## Dependencies

### Internal Dependencies
- ✅ `useAppStore` (Zustand store)
- ✅ `DrawingCanvas.tsx` (already has Shift listeners)
- ✅ `DrawingFeedback.tsx` (preview rendering)
- ✅ `PrecisionLinePreview.tsx` (line tool preview)

### External Dependencies
- ✅ Three.js (no version change needed)
- ✅ React (no version change needed)
- ✅ TypeScript (no version change needed)

---

## Success Criteria

### Functional
- ✅ Shift constraint works for all 4 tools (Rectangle, Circle, Line, Polyline)
- ✅ Constraint applies in real-time (<16ms latency)
- ✅ Constraint releases immediately when Shift is released
- ✅ No conflicts with snapping, alignment, or dimension input systems

### Non-Functional
- ✅ Zero performance regression (60 FPS maintained)
- ✅ Zero console errors or warnings
- ✅ Shift state never gets "stuck"
- ✅ Keyboard-only users can access feature

### Quality
- ✅ Unit tests: >70% coverage
- ✅ Integration tests: 20+ scenarios pass
- ✅ Code review: No critical feedback
- ✅ Constitution compliance: All 9 articles satisfied

---

## Timeline Estimate

| Phase | Task | Estimated Time | Priority |
|-------|------|----------------|----------|
| 1 | Create constraint utilities (with axis-lock) 🆕 | 2 hours | P0 |
| 2 | Add Shift state to store | 1 hour | P0 |
| 3 | Verify Shift listeners (already done) | 0.5 hours | P0 |
| 4 | Apply constraints to drawing previews | 1.5 hours | P0 |
| 5 | Apply constraints to line tool | 1 hour | P0 |
| 6 | Apply constraints to click handlers | 1.5 hours | P0 |
| 7 | Apply axis-lock to drag system 🆕 | 1.5 hours | P0 |
| 8 | Testing & polish (incl. drag tests) 🆕 | 1.5 hours | P0 |
| **Total** | | **10.5 hours** | |

**Buffer**: +1.5 hours for unexpected issues (e.g., drag system quirks)
**Total with buffer**: **12 hours** (1.5 developer days)

---

## Next Steps

1. **Review this plan** with team
2. **Create task breakdown** (`tasks.md`)
3. **Begin implementation** (Phase 1: Constraint utilities)

---

**Document Status**: ✅ Ready for Task Breakdown
**Next Document**: `tasks.md` (detailed implementation checklist)
