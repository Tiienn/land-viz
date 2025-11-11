# Task Breakdown: Shift-Constrained Drawing & Dragging

**Feature ID**: 017
**Created**: 2025-11-09
**Updated**: 2025-11-09 (Added drag constraints)
**Total Estimated Time**: 10.5 hours
**Developer**: Assigned

---

## Task 1: Create Constraint Utility Functions ⏱️ 2 hours

**Priority**: P0 (Critical - Foundation)
**Dependencies**: None
**Files**:
- `app/src/utils/shapeConstraints.ts` (NEW)
- `app/src/utils/__tests__/shapeConstraints.test.ts` (NEW)

### Subtasks

#### 1.1: Create `shapeConstraints.ts` file ⏱️ 30 min
- [ ] Create new file: `app/src/utils/shapeConstraints.ts`
- [ ] Add imports: `import type { Point2D } from '@/types';`
- [ ] Add file-level JSDoc comment explaining purpose

#### 1.2: Implement `applySquareConstraint()` ⏱️ 30 min
- [ ] Function signature: `applySquareConstraint(firstPoint: Point2D, cursorPoint: Point2D): Point2D`
- [ ] Calculate `deltaX` and `deltaY`
- [ ] Find `maxDimension = Math.max(Math.abs(deltaX), Math.abs(deltaY))`
- [ ] Preserve quadrant direction with `signX` and `signY`
- [ ] Return constrained point: `{x: firstPoint.x + maxDimension * signX, y: firstPoint.y + maxDimension * signY}`
- [ ] Add JSDoc with @example showing usage

**Test Cases to Consider**:
```typescript
// Top-right quadrant: (0,0) → (10,5) should become (10,10)
// Bottom-left quadrant: (0,0) → (-7,-10) should become (-10,-10)
// Already square: (0,0) → (5,5) should stay (5,5)
// Zero dimension: (0,0) → (0,5) should become (5,5)
```

#### 1.3: Implement `roundToNearestAngle()` ⏱️ 15 min
- [ ] Function signature: `roundToNearestAngle(angleDegrees: number, angleStep: number = 45): number`
- [ ] Normalize to [0, 360): `normalized = angleDegrees % 360; if (normalized < 0) normalized += 360;`
- [ ] Round to nearest step: `rounded = Math.round(normalized / angleStep) * angleStep`
- [ ] Wrap 360° to 0°: `return rounded % 360`
- [ ] Add JSDoc with @example

**Test Cases to Consider**:
```typescript
// 17° → 0° (nearest is 0°)
// 67° → 90° (nearest is 90°)
// 350° → 0° (wrap around)
// -30° → 315° (negative wrap)
```

#### 1.4: Implement `applyAngleConstraint()` ⏱️ 30 min
- [ ] Function signature: `applyAngleConstraint(startPoint: Point2D, cursorPoint: Point2D, angleStep: number = 45): Point2D`
- [ ] Calculate deltas and distance: `distance = Math.sqrt(deltaX**2 + deltaY**2)`
- [ ] Calculate current angle: `angleRad = Math.atan2(deltaY, deltaX); angleDeg = angleRad * (180 / Math.PI)`
- [ ] Get constrained angle: `constrainedAngleDeg = roundToNearestAngle(angleDeg, angleStep)`
- [ ] Convert back to radians: `constrainedAngleRad = constrainedAngleDeg * (Math.PI / 180)`
- [ ] Apply constrained angle: `{x: startX + distance * cos(angle), y: startY + distance * sin(angle)}`
- [ ] Add JSDoc with @example

**Test Cases to Consider**:
```typescript
// (0,0) → (10,2) should snap to 0° horizontal: (~10.2, 0)
// (0,0) → (2,10) should snap to 90° vertical: (0, ~10.2)
// (0,0) → (10,9) should snap to 45° diagonal
```

#### 1.5: Write Unit Tests ⏱️ 45 min
- [ ] Create test file: `app/src/utils/__tests__/shapeConstraints.test.ts`
- [ ] Import Vitest: `import { describe, it, expect } from 'vitest';`
- [ ] Import functions: `import { applySquareConstraint, applyAngleConstraint, roundToNearestAngle } from '../shapeConstraints';`

**Test Suite Structure**:
```typescript
describe('shapeConstraints', () => {
  describe('applySquareConstraint', () => {
    it('should create square in top-right quadrant', () => { /* ... */ });
    it('should create square in bottom-left quadrant', () => { /* ... */ });
    it('should create square in all four quadrants', () => { /* ... */ });
    it('should handle equal dimensions (already square)', () => { /* ... */ });
    it('should handle zero width', () => { /* ... */ });
    it('should handle zero height', () => { /* ... */ });
  });

  describe('roundToNearestAngle', () => {
    it('should round to nearest 45° increment', () => { /* test 0°, 45°, 90°, etc. */ });
    it('should handle negative angles', () => { /* test -30°, -90° */ });
    it('should wrap 360° to 0°', () => { /* ... */ });
    it('should handle custom angle steps', () => { /* test 30°, 15° steps */ });
  });

  describe('applyAngleConstraint', () => {
    it('should constrain to 0° (horizontal right)', () => { /* ... */ });
    it('should constrain to 90° (vertical up)', () => { /* ... */ });
    it('should constrain to 180° (horizontal left)', () => { /* ... */ });
    it('should constrain to 270° (vertical down)', () => { /* ... */ });
    it('should constrain to 45° (diagonal NE)', () => { /* ... */ });
    it('should constrain to 135° (diagonal NW)', () => { /* ... */ });
    it('should maintain distance when constraining', () => { /* ... */ });
  });
});
```

- [ ] Run tests: `npm run test:unit -- shapeConstraints.test.ts`
- [ ] Verify 100% code coverage for `shapeConstraints.ts`

**Validation Criteria**:
- ✅ All test cases pass (15+ tests)
- ✅ Coverage >70% (aim for 100%)
- ✅ No TypeScript errors
- ✅ Functions are pure (no side effects)

---

## Task 2: Add Shift Key State to Store ⏱️ 1 hour

**Priority**: P0 (Critical - Foundation)
**Dependencies**: None
**Files**:
- `app/src/store/useAppStore.ts` (MODIFY)

### Subtasks

#### 2.1: Verify Shift Key State Exists ⏱️ 15 min
- [ ] Search for `isShiftKeyPressed` in `useAppStore.ts`
- [ ] If it exists: ✅ Skip to Task 3
- [ ] If not: Continue with 2.2

#### 2.2: Add `isShiftKeyPressed` to DrawingState ⏱️ 15 min
- [ ] Locate `DrawingState` interface definition (search for `interface DrawingState`)
- [ ] Add field: `isShiftKeyPressed: boolean;  // Tracks Shift key state for constraint mode`
- [ ] Add JSDoc comment explaining usage

#### 2.3: Initialize State ⏱️ 10 min
- [ ] Locate store initialization (search for `drawing: {`)
- [ ] Add to default state: `isShiftKeyPressed: false,`
- [ ] Verify placement (should be with other drawing state)

#### 2.4: Add `setShiftKey` Action ⏱️ 15 min
- [ ] Locate drawing actions section (search for `setActiveTool:` or similar)
- [ ] Add new action:
```typescript
setShiftKey: (pressed: boolean) => {
  set((state) => ({
    drawing: {
      ...state.drawing,
      isShiftKeyPressed: pressed
    }
  }));
},
```
- [ ] Add JSDoc comment explaining purpose

#### 2.5: Validate Store Changes ⏱️ 10 min
- [ ] Run TypeScript compiler: `npx tsc --noEmit` (no errors expected)
- [ ] Start dev server: `npm run dev`
- [ ] Open browser console
- [ ] Test store access: `useAppStore.getState().drawing.isShiftKeyPressed` (should return `false`)
- [ ] Test action: `useAppStore.getState().setShiftKey(true)` then re-check state (should return `true`)

**Validation Criteria**:
- ✅ No TypeScript compilation errors
- ✅ Store state accessible via `useAppStore.getState().drawing.isShiftKeyPressed`
- ✅ Action callable via `useAppStore.getState().setShiftKey(true/false)`
- ✅ State updates reflected in store

---

## Task 3: Verify Shift Key Event Handlers ⏱️ 30 min

**Priority**: P0 (Critical - Foundation)
**Dependencies**: Task 2
**Files**:
- `app/src/components/Scene/DrawingCanvas.tsx` (VERIFY + MODIFY)

### Subtasks

#### 3.1: Verify Existing Implementation ⏱️ 15 min
- [ ] Open `DrawingCanvas.tsx`
- [ ] Search for "Shift key event listeners" (line ~883)
- [ ] Confirm existing implementation matches spec:
```typescript
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
    setShiftKey(false);
  };
}, []);
```
- [ ] If exists and correct: ✅ Proceed to 3.2
- [ ] If missing/incorrect: Implement above code

#### 3.2: Add Defensive Blur Handler ⏱️ 15 min
**Purpose**: Reset Shift state if window loses focus (prevents "stuck" Shift key)

- [ ] Add new useEffect after existing Shift listeners:
```typescript
// Defensive cleanup: Reset Shift state if window loses focus
useEffect(() => {
  const handleBlur = () => {
    const setShiftKey = useAppStore.getState().setShiftKey;
    setShiftKey(false);
  };

  window.addEventListener('blur', handleBlur);
  return () => window.removeEventListener('blur', handleBlur);
}, []);
```
- [ ] Add comment explaining purpose

#### 3.3: Manual Testing ⏱️ 10 min
- [ ] Start dev server: `npm run dev`
- [ ] Open browser console
- [ ] Monitor store state: `useAppStore.subscribe(state => console.log('Shift:', state.drawing.isShiftKeyPressed))`
- [ ] Press Shift → Verify console shows `Shift: true`
- [ ] Release Shift → Verify console shows `Shift: false`
- [ ] Hold Shift, Alt+Tab away → Verify console shows `Shift: false` (blur handler)

**Validation Criteria**:
- ✅ Shift key press/release updates store in real-time
- ✅ Blur handler resets Shift state
- ✅ No console errors
- ✅ Cleanup functions prevent memory leaks

---

## Task 4: Apply Constraints to Rectangle & Circle Previews ⏱️ 1.5 hours

**Priority**: P0 (Critical - Core Feature)
**Dependencies**: Tasks 1, 2, 3
**Files**:
- `app/src/components/Scene/DrawingFeedback.tsx` (MODIFY)

### Subtasks

#### 4.1: Add Imports ⏱️ 5 min
- [ ] Open `DrawingFeedback.tsx`
- [ ] Add import at top:
```typescript
import { applySquareConstraint, applyAngleConstraint } from '@/utils/shapeConstraints';
```
- [ ] Verify no TypeScript errors

#### 4.2: Apply Square Constraint to Rectangle Preview ⏱️ 30 min
- [ ] Locate rectangle case (search for `case 'rectangle'`, line ~275)
- [ ] Find where `mousePoint` is created: `let mousePoint = new Vector3(mousePosition.x, elevation, mousePosition.y);`
- [ ] **Add constraint logic AFTER mousePoint creation, BEFORE dimensions calculation**:
```typescript
// NEW: Apply square constraint if Shift is held
const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
if (isShiftPressed) {
  const constrainedPos = applySquareConstraint(
    { x: firstPoint.x, y: firstPoint.z },  // First corner (2D)
    { x: mousePosition.x, y: mousePosition.y }  // Cursor (2D)
  );
  mousePoint = new Vector3(constrainedPos.x, elevation, constrainedPos.y);
}
```
- [ ] Verify rest of code uses `mousePoint` (it should already)
- [ ] Add comment explaining constraint

**Expected Behavior**: Rectangle preview shows square when Shift is held

#### 4.3: Apply Angle Constraint to Circle Radius ⏱️ 30 min
- [ ] Locate circle case (search for `case 'circle'`, line ~328)
- [ ] Find where `mousePoint` is created
- [ ] **Add constraint logic AFTER mousePoint creation, BEFORE radius calculation**:
```typescript
// NEW: Apply angle constraint to radius line if Shift is held
const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
if (isShiftPressed) {
  const constrainedPos = applyAngleConstraint(
    { x: center.x, y: center.z },  // Circle center (2D)
    { x: mousePosition.x, y: mousePosition.y }  // Cursor (2D)
  );
  mousePoint = new Vector3(constrainedPos.x, elevation, constrainedPos.y);
}
```
- [ ] Verify radius line (purple line) uses `mousePoint`
- [ ] Add comment explaining constraint

**Expected Behavior**: Purple radius line snaps to 45° angles when Shift is held

#### 4.4: Apply Angle Constraint to Polyline Preview ⏱️ 30 min
- [ ] Locate polyline case (search for `case 'polyline'`, line ~150)
- [ ] Find where `mousePoint` is created for preview line
- [ ] **Add constraint logic AFTER mousePoint creation**:
```typescript
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
```
- [ ] Verify preview line uses `mousePoint`
- [ ] Add comment explaining constraint

**Expected Behavior**: Dotted preview line snaps to 45° angles when Shift is held

#### 4.5: Visual Testing ⏱️ 15 min
- [ ] Start dev server: `npm run dev`
- [ ] Test Rectangle:
  - [ ] Select Rectangle tool (R)
  - [ ] Click first corner
  - [ ] Move cursor (should show normal rectangle)
  - [ ] Hold Shift (should instantly become square)
  - [ ] Release Shift (should revert to rectangle)
- [ ] Test Circle:
  - [ ] Select Circle tool (C)
  - [ ] Click center
  - [ ] Move cursor (radius line should follow cursor)
  - [ ] Hold Shift (radius line should snap to 0°, 45°, 90°, etc.)
- [ ] Test Polyline:
  - [ ] Select Polyline tool (P)
  - [ ] Click first point
  - [ ] Move cursor, hold Shift (preview line should snap to angles)

**Validation Criteria**:
- ✅ All three tools show constrained previews when Shift is held
- ✅ Constraint applies/releases instantly (<16ms)
- ✅ No visual artifacts or flickering
- ✅ 60 FPS maintained

---

## Task 5: Apply Constraints to Line Tool Preview ⏱️ 1 hour

**Priority**: P0 (Critical - Core Feature)
**Dependencies**: Tasks 1, 2, 3
**Files**:
- `app/src/components/Scene/PrecisionLinePreview.tsx` (MODIFY)

### Subtasks

#### 5.1: Add Imports ⏱️ 5 min
- [ ] Open `PrecisionLinePreview.tsx`
- [ ] Add import:
```typescript
import { applyAngleConstraint } from '@/utils/shapeConstraints';
```

#### 5.2: Apply Constraint to Distance-Based Preview ⏱️ 20 min
**Location**: Line 25 - inside `if (lineToolState.currentDistance ...)`

- [ ] Locate: `const direction = calculateDirection(...)`
- [ ] **Modify logic to apply constraint**:
```typescript
if (lineToolState.currentDistance && lineToolState.currentDistance > 0 && lineToolState.previewEndPoint) {
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
}
```

**Expected Behavior**: Line with distance input respects Shift constraint

#### 5.3: Apply Constraint to Cursor-Based Preview ⏱️ 20 min
**Location**: Line 30 - inside `else if (lineToolState.previewEndPoint)`

- [ ] **Add constraint logic**:
```typescript
} else if (lineToolState.previewEndPoint) {
  let previewEnd = lineToolState.previewEndPoint;

  // NEW: Apply angle constraint if Shift is held
  const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
  if (isShiftPressed) {
    previewEnd = applyAngleConstraint(lineToolState.startPoint, lineToolState.previewEndPoint);
  }

  endPoint3D = new Vector3(previewEnd.x, elevation, previewEnd.y);
}
```

**Expected Behavior**: Line preview snaps to angles when Shift is held

#### 5.4: Visual Testing ⏱️ 15 min
- [ ] Start dev server: `npm run dev`
- [ ] Test Line Tool (Cursor Mode):
  - [ ] Select Line tool (L)
  - [ ] Click start point
  - [ ] Move cursor (line should follow freely)
  - [ ] Hold Shift (line should snap to 0°, 45°, 90°, etc.)
  - [ ] Release Shift (line should revert to free-form)
- [ ] Test Line Tool (Distance Input Mode):
  - [ ] Select Line tool (L)
  - [ ] Click start point
  - [ ] Enter distance (e.g., "10")
  - [ ] Move cursor direction, hold Shift (should snap to angles, maintain 10m distance)
- [ ] Test Multi-Segment Mode:
  - [ ] Continue clicking to create multi-segment line
  - [ ] Hold Shift for some segments, not others (verify constraint only affects current segment)

**Validation Criteria**:
- ✅ Line preview constrains to angles when Shift is held
- ✅ Distance input mode works with constraint
- ✅ Multi-segment mode: only current segment constrained
- ✅ No visual lag or stuttering

---

## Task 6: Apply Constraints to Click Handlers ⏱️ 1.5 hours

**Priority**: P0 (Critical - Final Behavior)
**Dependencies**: Tasks 1, 2, 3, 4, 5
**Files**:
- `app/src/components/Scene/DrawingCanvas.tsx` (MODIFY)

### Subtasks

#### 6.1: Add Imports ⏱️ 5 min
- [ ] Open `DrawingCanvas.tsx`
- [ ] Add import (if not already present):
```typescript
import { applySquareConstraint, applyAngleConstraint } from '@/utils/shapeConstraints';
```

#### 6.2: Apply Constraint to Rectangle Click Handler ⏱️ 20 min
**Location**: Line 563 - `case 'rectangle'` inside `handleClick`

- [ ] Find where second corner is processed: `} else if (currentShape?.points && currentShape.points.length === 1) {`
- [ ] **Add constraint before creating rectangle points**:
```typescript
} else if (currentShape?.points && currentShape.points.length === 1) {
  const firstPoint = currentShape.points[0];

  // NEW: Apply square constraint if Shift is held
  let finalPos = snappedPos;
  const isShiftPressed = useAppStore.getState().drawing.isShiftKeyPressed;
  if (isShiftPressed) {
    finalPos = applySquareConstraint(firstPoint, snappedPos);
  }

  // Add the remaining 3 points to complete rectangle (using finalPos)
  addPoint({ x: finalPos.x, y: firstPoint.y });     // Top-right
  addPoint({ x: finalPos.x, y: finalPos.y });       // Bottom-right
  addPoint({ x: firstPoint.x, y: finalPos.y });     // Bottom-left
  finishDrawing();
}
```

**Expected Behavior**: Clicking with Shift held creates perfect square

#### 6.3: Apply Constraint to Circle Click Handler ⏱️ 20 min
**Location**: Line 611 - `case 'circle'` inside `handleClick`

- [ ] Find where radius point is processed: `} else if (currentShape?.points && currentShape.points.length === 1) {`
- [ ] **Add constraint before calculating radius**:
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

**Expected Behavior**: Clicking with Shift held creates circle with radius at constrained angle

#### 6.4: Apply Constraint to Polyline Click Handler ⏱️ 20 min
**Location**: Line 540 - `case 'polyline'` inside `handleClick`

- [ ] Find where points are added: `addPoint(snappedPos);`
- [ ] **Add constraint before adding point**:
```typescript
case 'polyline':
  if (!isDrawing) {
    startDrawing();
    addPoint(snappedPos); // First point (no constraint)
  } else {
    // Check for closing logic first...
    if (currentShape?.points && currentShape.points.length >= 3) {
      const firstPoint = currentShape.points[0];
      const distance = Math.sqrt(/* ... */);
      if (distance < closeThreshold) {
        finishDrawing();
        return;
      }
    }

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

**Expected Behavior**: Clicking with Shift held adds polyline point at constrained angle

#### 6.5: Apply Constraint to Line Tool Click Handler ⏱️ 30 min
**Location**: Line 481 - `case 'line'` inside `handleClick`

This is complex due to multiple line modes (direct distance, multi-segment, closing).

- [ ] Find start of `case 'line':` block
- [ ] **Add constraint calculation at the beginning**:
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

  // Use finalPos instead of snappedPos in all subsequent logic below
  if (!freshLineToolState.isDrawing) {
    startLineDrawing(finalPos);  // Changed from snappedPos
    showDistanceInput();
  } else {
    // Multi-segment closing logic - use finalPos
    if (freshLineToolState.isMultiSegment && freshLineToolState.segments && freshLineToolState.segments.length >= 2) {
      const firstPoint = freshLineToolState.segments[0].startPoint;
      if (firstPoint) {
        const distance = Math.sqrt(
          Math.pow(finalPos.x - firstPoint.x, 2) + Math.pow(finalPos.y - firstPoint.y, 2)  // Use finalPos
        );
        // ... rest of closing logic
      }
    }
  }
  break;
```

**Expected Behavior**: Line tool clicks use constrained positions when Shift is held

#### 6.6: Integration Testing ⏱️ 15 min
- [ ] Test Rectangle: Draw square with Shift held, verify final shape is square
- [ ] Test Circle: Draw circle with Shift held, verify radius is at constrained angle
- [ ] Test Polyline: Draw polyline with alternating Shift on/off, verify correct segments are constrained
- [ ] Test Line: Draw line with Shift held, verify line is at constrained angle

**Validation Criteria**:
- ✅ All tools create constrained shapes when Shift is held during click
- ✅ Final shapes match preview exactly
- ✅ No coordinate drift or rounding errors
- ✅ Snapping still works with constraints

---

## Task 7: Testing & Polish ⏱️ 1 hour

**Priority**: P1 (High - Quality Assurance)
**Dependencies**: Tasks 1-6
**Files**: All modified files

### Subtasks

#### 7.1: Run Unit Tests ⏱️ 10 min
- [ ] Run constraint utility tests: `npm run test:unit -- shapeConstraints.test.ts`
- [ ] Verify all tests pass (15+ tests)
- [ ] Check coverage: `npm run test:coverage -- shapeConstraints`
- [ ] Verify coverage >70% (aim for 100%)

#### 7.2: Run Type Checking ⏱️ 5 min
- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Verify zero errors
- [ ] Fix any type issues found

#### 7.3: Run Linting ⏱️ 5 min
- [ ] Run ESLint: `npm run lint`
- [ ] Fix any warnings/errors
- [ ] Verify clean output

#### 7.4: Comprehensive Manual Testing ⏱️ 30 min

**Rectangle Tool Tests**:
- [ ] Draw square in top-right quadrant (Shift held)
- [ ] Draw square in top-left quadrant (Shift held)
- [ ] Draw square in bottom-left quadrant (Shift held)
- [ ] Draw square in bottom-right quadrant (Shift held)
- [ ] Toggle Shift on/off during drag (verify instant switch)
- [ ] Draw square with snapping enabled (verify both work together)
- [ ] Draw square in 2D mode (verify works in orthographic view)

**Circle Tool Tests**:
- [ ] Draw circle with radius at 0° (Shift held)
- [ ] Draw circle with radius at 45° (Shift held)
- [ ] Draw circle with radius at 90° (Shift held)
- [ ] Draw circle with radius at 135° (Shift held)
- [ ] Draw circle with radius at 180° (Shift held)
- [ ] Draw circle with radius at 225° (Shift held)
- [ ] Draw circle with radius at 270° (Shift held)
- [ ] Draw circle with radius at 315° (Shift held)
- [ ] Verify purple radius line snaps correctly
- [ ] Verify circle circumference remains perfectly round

**Line Tool Tests**:
- [ ] Draw line at 0° (horizontal right, Shift held)
- [ ] Draw line at 45° (diagonal NE, Shift held)
- [ ] Draw line at 90° (vertical up, Shift held)
- [ ] Draw line at 135° (diagonal NW, Shift held)
- [ ] Draw line at 180° (horizontal left, Shift held)
- [ ] Draw line at 225° (diagonal SW, Shift held)
- [ ] Draw line at 270° (vertical down, Shift held)
- [ ] Draw line at 315° (diagonal SE, Shift held)
- [ ] Test with distance input: Enter "10", hold Shift, verify 10m line at constrained angle
- [ ] Test multi-segment: Draw 3 segments, hold Shift for 2nd segment only

**Polyline Tool Tests**:
- [ ] Draw polyline with 5 segments
- [ ] Hold Shift for segments 1, 3, 5 (alternating)
- [ ] Verify only constrained segments snap to angles
- [ ] Test closing polyline with Shift held (should work normally)
- [ ] Draw polyline near existing shapes (verify snapping + constraint work together)

**Edge Case Tests**:
- [ ] Hold Shift, Alt+Tab away, return (verify Shift resets)
- [ ] Hold Shift, switch tools (verify constraint doesn't carry over)
- [ ] Draw shape with dimension input active, hold Shift (verify pre-sized shapes ignore constraint)
- [ ] Press Shift before clicking first point (verify no effect until after first point)
- [ ] Draw with 60+ shapes on canvas (verify 60 FPS maintained)

#### 7.5: Performance Testing ⏱️ 10 min
- [ ] Open browser DevTools → Performance tab
- [ ] Start recording
- [ ] Draw 10 constrained shapes (holding Shift)
- [ ] Stop recording
- [ ] Verify:
  - [ ] FPS stays ≥58 (target: 60 FPS)
  - [ ] No long tasks (>50ms)
  - [ ] No memory leaks (heap size stable)
- [ ] Test with 60+ existing shapes on canvas
- [ ] Verify performance remains stable

**Validation Criteria**:
- ✅ All 40+ manual tests pass
- ✅ Zero console errors or warnings
- ✅ 60 FPS maintained in all scenarios
- ✅ Shift state never gets "stuck"
- ✅ Feature works seamlessly with existing systems (snapping, alignment, dimension input)

---

## Task 8: Documentation Updates ⏱️ 30 min

**Priority**: P2 (Medium - User-Facing)
**Dependencies**: Tasks 1-7
**Files**:
- `CLAUDE.md` (MODIFY)
- Keyboard shortcuts modal (if exists)
- Tool tooltips (if needed)

### Subtasks

#### 8.1: Update CLAUDE.md ⏱️ 15 min
- [ ] Open `CLAUDE.md`
- [ ] Find "Controls Reference" section
- [ ] Add new subsection:
```markdown
**Constrained Drawing (Shift Key):**
- Rectangle: Hold Shift while dragging to create perfect square
- Circle: Hold Shift to constrain radius line to 0°/45°/90° angles
- Line: Hold Shift to constrain to 0°/45°/90° angles (8 directions)
- Polyline: Hold Shift to constrain current segment to 0°/45°/90° angles
```
- [ ] Find "Keyboard Shortcuts" section
- [ ] Update description to mention Shift constraint

#### 8.2: Update Keyboard Shortcuts Modal (if exists) ⏱️ 15 min
- [ ] Search for keyboard shortcuts modal component
- [ ] If found: Add Shift constraint documentation
- [ ] If not found: Skip (will be added in future feature)

**Validation Criteria**:
- ✅ CLAUDE.md updated with Shift constraint documentation
- ✅ Documentation is clear and concise
- ✅ Examples provided for each tool

---

## Task 9: Axis-Locked Drag Constraints ⏱️ 1.5 hours 🆕

**Priority**: P0 (Critical - Core Feature)
**Dependencies**: Tasks 1, 2, 3
**Files**:
- `app/src/store/useAppStore.ts` (MODIFY - updateDragPosition action)
- `app/src/utils/shapeConstraints.ts` (already created in Task 1)

### Subtasks

#### 9.1: Add Axis-Lock Constraint Function ⏱️ 15 min
**Note**: This function should already be added in Task 1.4 when creating `shapeConstraints.ts`

- [ ] Verify `applyAxisLockConstraint()` function exists in `app/src/utils/shapeConstraints.ts`
- [ ] If missing: Add the function (see plan.md Phase 1 for implementation)
- [ ] Function should accept `(offsetX, offsetY, threshold)` and return `{ offsetX, offsetY }`
- [ ] Add unit tests for axis-lock constraint (see below)

**Test Cases** (add to `shapeConstraints.test.ts`):
```typescript
describe('applyAxisLockConstraint', () => {
  it('should lock to horizontal axis when X movement is dominant', () => {
    const result = applyAxisLockConstraint(10, 3);
    expect(result).toEqual({ offsetX: 10, offsetY: 0 });
  });

  it('should lock to vertical axis when Y movement is dominant', () => {
    const result = applyAxisLockConstraint(2, 15);
    expect(result).toEqual({ offsetX: 0, offsetY: 15 });
  });

  it('should not lock if movement is below threshold', () => {
    const result = applyAxisLockConstraint(2, 3, 5);
    expect(result).toEqual({ offsetX: 2, offsetY: 3 }); // No lock
  });

  it('should handle negative offsets', () => {
    const result = applyAxisLockConstraint(-12, -4);
    expect(result).toEqual({ offsetX: -12, offsetY: 0 }); // Horizontal lock
  });

  it('should lock to horizontal when offsets are equal', () => {
    const result = applyAxisLockConstraint(10, 10);
    expect(result).toEqual({ offsetX: 10, offsetY: 0 }); // Tie-breaker: horizontal
  });
});
```

- [ ] Run tests: `npm run test:unit -- shapeConstraints.test.ts`
- [ ] Verify all axis-lock tests pass

#### 9.2: Modify updateDragPosition() in Store ⏱️ 45 min
- [ ] Open `app/src/store/useAppStore.ts`
- [ ] Find `updateDragPosition` action (search for "updateDragPosition:", line ~2170)
- [ ] Add import at top of file:
```typescript
import { applyAxisLockConstraint } from '@/utils/shapeConstraints';
```

- [ ] Locate where drag offset is calculated:
```typescript
const offsetX = latestPosition.x - currentState.dragState.startPosition.x;
const offsetY = latestPosition.y - currentState.dragState.startPosition.y;
```

- [ ] **Add constraint logic AFTER offset calculation, BEFORE snap detection**:
```typescript
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
```

- [ ] Verify no TypeScript errors
- [ ] Save file

**Key Points**:
- Constraint applies to `offsetX/offsetY` variables used for all subsequent calculations
- Existing snap/alignment logic uses constrained offsets automatically
- Multi-selection dragging works automatically (all shapes use same constrained offset)

#### 9.3: Manual Testing - Horizontal Drag Lock ⏱️ 10 min
- [ ] Start dev server: `npm run dev`
- [ ] Create a rectangle
- [ ] Click to select rectangle
- [ ] Start dragging rectangle to the right (move ~10 units right, ~2 units down)
- [ ] Hold Shift → rectangle should instantly stop moving vertically (vertical position locked)
- [ ] Release Shift → rectangle should resume free movement
- [ ] Move mouse up/down while Shift is held → rectangle should NOT move vertically

**Expected**: Shape only moves horizontally (left/right) when Shift is held

#### 9.4: Manual Testing - Vertical Drag Lock ⏱️ 10 min
- [ ] Create a circle
- [ ] Click to select circle
- [ ] Start dragging circle upward (move ~3 units right, ~15 units up)
- [ ] Hold Shift → circle should instantly stop moving horizontally (horizontal position locked)
- [ ] Release Shift → circle should resume free movement
- [ ] Move mouse left/right while Shift is held → circle should NOT move horizontally

**Expected**: Shape only moves vertically (up/down) when Shift is held

#### 9.5: Manual Testing - Multi-Selection Drag ⏱️ 10 min
- [ ] Create 3 shapes (rectangle, circle, polyline)
- [ ] Select all 3 shapes (Shift+click or drag-select)
- [ ] Start dragging group to the right
- [ ] Hold Shift → all 3 shapes should lock to horizontal movement
- [ ] Release Shift → all 3 shapes resume free movement
- [ ] Try vertical drag with Shift → all 3 shapes lock to vertical movement

**Expected**: All selected shapes move together on locked axis

#### 9.6: Manual Testing - Text Object Drag ⏱️ 5 min
- [ ] Create a text object (Text tool, click on canvas, type "Test")
- [ ] Select text object
- [ ] Drag text horizontally with Shift held
- [ ] Verify text only moves horizontally
- [ ] Drag text vertically with Shift held
- [ ] Verify text only moves vertically

**Expected**: Text objects respect axis-lock constraints like shapes

#### 9.7: Manual Testing - Shift Mid-Drag ⏱️ 5 min
- [ ] Create and select a shape
- [ ] Start dragging WITHOUT Shift (free movement)
- [ ] Mid-drag: Press Shift
- [ ] Verify shape immediately locks to dominant axis
- [ ] Release Shift mid-drag
- [ ] Verify shape immediately resumes free movement

**Expected**: Axis lock applies/removes instantly when Shift is pressed/released during drag

#### 9.8: Edge Case Testing ⏱️ 10 min
- [ ] **Locked shape**: Create shape, lock it (if locking UI exists), try dragging with Shift
  - Expected: Shape does not move (locked state takes precedence)
- [ ] **Small movements**: Drag shape less than 5 units, hold Shift
  - Expected: No axis lock until movement exceeds threshold
- [ ] **Equal X/Y offsets**: Drag diagonally at exactly 45° (e.g., 10 right, 10 down), hold Shift
  - Expected: Locks to horizontal axis (tie-breaker behavior)

**Validation Criteria**:
- ✅ Axis-lock applies to all shape types
- ✅ Axis-lock applies to text objects
- ✅ Multi-selection dragging respects axis-lock
- ✅ Pressing Shift mid-drag locks immediately
- ✅ Releasing Shift mid-drag unlocks immediately
- ✅ Threshold prevents premature locking (< 5 units movement)
- ✅ No visual stuttering or performance issues

---

## Completion Checklist

### Functional Requirements ✅

**Drawing Constraints:**
- [ ] Rectangle tool creates perfect squares when Shift is held
- [ ] Circle tool constrains radius line angle when Shift is held
- [ ] Line tool constrains angle to 45° increments when Shift is held
- [ ] Polyline tool constrains current segment angle when Shift is held
- [ ] Constraints apply in real-time (<16ms latency)
- [ ] Constraints release immediately when Shift is released

**Drag Constraints:** 🆕
- [ ] All shape types (rectangle, circle, polyline, line, polygon) respect axis-lock when dragged with Shift
- [ ] Text objects respect axis-lock when dragged with Shift
- [ ] Multi-selection dragging respects axis-lock (all shapes move on same axis)
- [ ] Pressing Shift mid-drag locks axis immediately
- [ ] Releasing Shift mid-drag unlocks axis immediately
- [ ] Threshold prevents premature locking (< 5 units movement)

**Common:**
- [ ] Shift state resets on window blur (no "stuck" Shift)

### Integration Requirements ✅
- [ ] Constraints work with snapping system (no conflicts)
- [ ] Constraints work with alignment guides
- [ ] Constraints work with grid snapping
- [ ] Constraints work with dimension input overlays
- [ ] Pre-sized shapes (dimension input) ignore Shift constraint
- [ ] Constraints work in both 2D and 3D camera modes
- [ ] **Constraints work with shape dragging system (single and multi-selection)** 🆕

### Quality Requirements ✅
- [ ] Unit tests: 20+ tests pass (incl. axis-lock tests), >70% coverage 🆕
- [ ] TypeScript: Zero compilation errors
- [ ] ESLint: Zero warnings/errors
- [ ] Manual testing: 50+ scenarios pass (incl. drag tests) 🆕
- [ ] Performance: 60 FPS maintained (incl. during dragging)
- [ ] No console errors or warnings
- [ ] No memory leaks detected

### Documentation Requirements ✅
- [ ] CLAUDE.md updated with Shift constraint controls (drawing + dragging) 🆕
- [ ] Code comments added to all constraint logic
- [ ] JSDoc comments on all utility functions (incl. axis-lock) 🆕
- [ ] Keyboard shortcuts documentation updated

---

## Rollback Plan

If critical bugs are discovered after deployment:

1. **Immediate Rollback**:
   - Revert commits: `git revert <commit-hash>`
   - Redeploy previous stable version

2. **Temporary Disable**:
   - Set `isShiftKeyPressed` to always `false` in store
   - Comment out constraint logic in preview components
   - This disables feature without breaking existing functionality

3. **Debug & Fix**:
   - Reproduce bug in local environment
   - Fix issue, add regression test
   - Redeploy with fix

---

## Success Metrics

### Quantitative
- ✅ Zero performance regression (60 FPS maintained)
- ✅ Zero critical bugs in production (first week)
- ✅ Unit test coverage >70%
- ✅ All 50+ manual tests pass (incl. drag tests) 🆕

### Qualitative
- ✅ User feedback: "Intuitive and works as expected" (matches Figma/Canva)
- ✅ Code review: No critical feedback
- ✅ Team consensus: Ready for production

---

**Total Estimated Time**: 10.5 hours (incl. drag constraints) 🆕
**With Buffer (+15%)**: 12 hours
**Recommended Schedule**: 1.5 days (two 6-hour sessions)

---

**Document Status**: ✅ Ready for Implementation
**Next Step**: Begin Task 1 (Create Constraint Utility Functions)
