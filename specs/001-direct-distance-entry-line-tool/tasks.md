# Direct Distance Entry Line Tool - Task Breakdown

**Spec ID:** 001
**Tasks Version:** 1.0
**Date:** 2025-09-26
**Total Estimated Time:** 12-16 hours
**Developer:** Senior Full-Stack Developer

## Task Overview

This document provides a detailed, actionable task breakdown for implementing the Direct Distance Entry Line Tool. Each task includes specific code examples, validation criteria, and time estimates to enable efficient development execution.

## Phase 1: Core Infrastructure (4-5 hours)

### Task 1.1: Add Line Button to Ribbon Toolbar
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** None

**Description:**
Add a new "Line" button to the existing ribbon toolbar in App.tsx, positioned between current drawing tools with consistent styling and behavior.

**Implementation Steps:**
1. Open `app/src/App.tsx`
2. Locate the ribbon toolbar section (around lines 89-120)
3. Add Line button after existing tools

**Code Example:**
```typescript
// In App.tsx, add to ribbon toolbar
<button
  style={{
    background: activeTool === 'line' ?
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 16px',
    margin: '0 4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'Nunito Sans, sans-serif',
    fontWeight: '500',
    color: activeTool === 'line' ? '#ffffff' : '#374151',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}
  onClick={() => setActiveTool('line')}
  onMouseEnter={(e) => {
    if (activeTool !== 'line') {
      e.currentTarget.style.background = '#f3f4f6';
    }
  }}
  onMouseLeave={(e) => {
    if (activeTool !== 'line') {
      e.currentTarget.style.background = '#f8f9fa';
    }
  }}
  title="Precision Line Tool (L)"
>
  📏 Line
</button>
```

**Validation Criteria:**
- [ ] Line button appears in ribbon toolbar
- [ ] Button shows active state when selected
- [ ] Hover effects work correctly
- [ ] Tooltip displays "Precision Line Tool (L)"
- [ ] Clicking activates line tool mode

**Files Modified:**
- `app/src/App.tsx`

---

### Task 1.2: Create DistanceInput Component
**Estimated Time:** 1.5 hours
**Priority:** High
**Dependencies:** None

**Description:**
Create a floating input component that appears near the cursor for precision distance entry.

**Implementation Steps:**
1. Create directory `app/src/components/DistanceInput/`
2. Create `DistanceInput.tsx` main component
3. Create `DistanceInput.types.ts` for TypeScript definitions

**Code Example:**
```typescript
// app/src/components/DistanceInput/DistanceInput.types.ts
export interface DistanceInputProps {
  position: { x: number; y: number };
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
}

// app/src/components/DistanceInput/DistanceInput.tsx
import React, { useRef, useEffect, KeyboardEvent } from 'react';
import { DistanceInputProps } from './DistanceInput.types';

export const DistanceInput: React.FC<DistanceInputProps> = ({
  position,
  value,
  onChange,
  onConfirm,
  onCancel,
  visible
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [visible]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow numbers, decimal point, and backspace
    if (/^\d*\.?\d*$/.test(inputValue) || inputValue === '') {
      onChange(inputValue);
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x + 10,
        top: position.y - 35,
        background: 'rgba(255, 255, 255, 0.98)',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        fontFamily: 'Nunito Sans, sans-serif',
        minWidth: '120px',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Distance (m)"
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: '14px',
          fontFamily: 'inherit',
          width: '80px',
          textAlign: 'center',
          fontWeight: '500',
        }}
      />
      <div style={{
        fontSize: '11px',
        color: '#6b7280',
        textAlign: 'center',
        marginTop: '4px',
        lineHeight: '1.2',
      }}>
        Enter ✓ ESC ✕
      </div>
    </div>
  );
};

export default DistanceInput;
```

**Validation Criteria:**
- [ ] Component renders at specified position
- [ ] Input auto-focuses when visible
- [ ] Only accepts numeric input with decimals
- [ ] Enter key triggers onConfirm
- [ ] ESC key triggers onCancel
- [ ] Styling matches design system

**Files Created:**
- `app/src/components/DistanceInput/DistanceInput.tsx`
- `app/src/components/DistanceInput/DistanceInput.types.ts`

---

### Task 1.3: Enhance Drawing Store with Line Tool State
**Estimated Time:** 1.5 hours
**Priority:** High
**Dependencies:** None

**Description:**
Extend the existing useDrawingStore with line tool-specific state management following established Zustand patterns.

**Implementation Steps:**
1. Open `app/src/store/useDrawingStore.ts`
2. Add line tool interfaces to existing types
3. Add line tool state to store
4. Add line tool actions

**Code Example:**
```typescript
// Add to existing interfaces in useDrawingStore.ts
import { Vector3 } from 'three';

export interface LineSegment {
  id: string;
  type: 'line';
  startPoint: Vector3;
  endPoint: Vector3;
  length: number;
  createdAt: Date;
}

interface LineToolState {
  isActive: boolean;
  startPoint: Vector3 | null;
  inputValue: string;
  currentDistance: number | null;
  segments: LineSegment[];
  isWaitingForInput: boolean;
  inputPosition: { x: number; y: number };
  showInput: boolean;
  previewEndPoint: Vector3 | null;
}

// Add to main DrawingStore interface
interface DrawingStore {
  // ... existing properties
  lineTool: LineToolState;

  // Line tool actions
  setLineToolActive: (active: boolean) => void;
  setLineStartPoint: (point: Vector3 | null) => void;
  setLineInputValue: (value: string) => void;
  setLineInputPosition: (position: { x: number; y: number }) => void;
  setShowLineInput: (show: boolean) => void;
  setPreviewEndPoint: (point: Vector3 | null) => void;
  addLineSegment: (segment: LineSegment) => void;
  clearLineSegments: () => void;
  finishLineDrawing: () => void;
}

// Add to useDrawingStore implementation
export const useDrawingStore = create<DrawingStore>((set, get) => ({
  // ... existing state
  lineTool: {
    isActive: false,
    startPoint: null,
    inputValue: '',
    currentDistance: null,
    segments: [],
    isWaitingForInput: false,
    inputPosition: { x: 0, y: 0 },
    showInput: false,
    previewEndPoint: null,
  },

  // Line tool actions
  setLineToolActive: (active) =>
    set((state) => ({
      lineTool: { ...state.lineTool, isActive: active }
    })),

  setLineStartPoint: (point) =>
    set((state) => ({
      lineTool: { ...state.lineTool, startPoint: point }
    })),

  setLineInputValue: (value) => {
    const numericValue = parseFloat(value);
    set((state) => ({
      lineTool: {
        ...state.lineTool,
        inputValue: value,
        currentDistance: isNaN(numericValue) ? null : numericValue
      }
    }));
  },

  setLineInputPosition: (position) =>
    set((state) => ({
      lineTool: { ...state.lineTool, inputPosition: position }
    })),

  setShowLineInput: (show) =>
    set((state) => ({
      lineTool: { ...state.lineTool, showInput: show }
    })),

  setPreviewEndPoint: (point) =>
    set((state) => ({
      lineTool: { ...state.lineTool, previewEndPoint: point }
    })),

  addLineSegment: (segment) =>
    set((state) => ({
      lineTool: {
        ...state.lineTool,
        segments: [...state.lineTool.segments, segment]
      }
    })),

  clearLineSegments: () =>
    set((state) => ({
      lineTool: { ...state.lineTool, segments: [] }
    })),

  finishLineDrawing: () =>
    set((state) => ({
      lineTool: {
        ...state.lineTool,
        startPoint: null,
        inputValue: '',
        currentDistance: null,
        isWaitingForInput: false,
        showInput: false,
        previewEndPoint: null,
      }
    })),
}));
```

**Validation Criteria:**
- [ ] Store compiles without TypeScript errors
- [ ] Line tool state initializes correctly
- [ ] All actions update state as expected
- [ ] State updates trigger component re-renders
- [ ] Store maintains existing functionality

**Files Modified:**
- `app/src/store/useDrawingStore.ts`

---

### Task 1.4: Add Keyboard Shortcut and Tool Activation
**Estimated Time:** 1 hour
**Priority:** Medium
**Dependencies:** Task 1.1, Task 1.3

**Description:**
Implement keyboard shortcut "L" for line tool activation and ensure proper tool state management.

**Implementation Steps:**
1. Add keyboard event listener in App.tsx
2. Connect line tool activation to state management
3. Add cursor change logic

**Code Example:**
```typescript
// In App.tsx, add useEffect for keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Prevent shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement) return;

    switch (event.key.toLowerCase()) {
      case 'l':
        event.preventDefault();
        setActiveTool('line');
        setLineToolActive(true);
        break;
      case 'escape':
        if (activeTool === 'line') {
          setActiveTool('select');
          setLineToolActive(false);
          finishLineDrawing();
        }
        break;
      // ... existing shortcuts
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [activeTool, setLineToolActive, finishLineDrawing]);

// Add cursor style logic
useEffect(() => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.cursor = activeTool === 'line' ? 'crosshair' : 'default';
  }
}, [activeTool]);
```

**Validation Criteria:**
- [ ] "L" key activates line tool
- [ ] ESC cancels line tool when active
- [ ] Cursor changes to crosshair in line mode
- [ ] Shortcuts don't interfere with input fields
- [ ] Tool activation updates state correctly

**Files Modified:**
- `app/src/App.tsx`

---

## Phase 2: Drawing Logic (4-5 hours)

### Task 2.1: Implement First Point Placement with Raycasting
**Estimated Time:** 1.5 hours
**Priority:** High
**Dependencies:** Phase 1 complete

**Description:**
Add raycasting logic to detect clicks on the ground plane and place the first point of the line.

**Implementation Steps:**
1. Open `app/src/components/Scene/DrawingCanvas.tsx`
2. Extend handleClick function with line tool logic
3. Add raycasting for ground plane intersection

**Code Example:**
```typescript
// In DrawingCanvas.tsx, enhance handleClick function
import { useDrawingStore } from '../../store/useDrawingStore';

const {
  activeTool,
  lineTool,
  setLineStartPoint,
  setLineInputPosition,
  setShowLineInput,
} = useDrawingStore();

const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
  if (activeTool === 'line') {
    handleLineClick(event);
    return;
  }
  // ... existing click handling
}, [activeTool, /* other deps */]);

const handleLineClick = useCallback((event: ThreeEvent<MouseEvent>) => {
  event.stopPropagation();

  // Get intersection point on ground plane
  raycaster.setFromCamera(mouse, camera);
  const groundIntersection = raycaster.intersectObject(groundPlane);

  if (groundIntersection.length === 0) return;

  const point = groundIntersection[0].point.clone();

  // Apply grid snapping if enabled
  const snappedPoint = gridSnapEnabled ? applyGridSnapping(point) : point;

  if (!lineTool.startPoint) {
    // First click - set start point
    setLineStartPoint(snappedPoint);

    // Position input field near cursor
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setLineInputPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
      setShowLineInput(true);
    }
  } else {
    // Second click would create line segment
    // This will be handled in distance confirmation
    handleDistanceConfirmation();
  }
}, [
  raycaster, mouse, camera, groundPlane,
  lineTool.startPoint, gridSnapEnabled,
  setLineStartPoint, setLineInputPosition, setShowLineInput
]);

// Add visual feedback for start point
const renderStartPointMarker = () => {
  if (!lineTool.startPoint) return null;

  return (
    <mesh position={lineTool.startPoint}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshBasicMaterial color="#3b82f6" />
    </mesh>
  );
};
```

**Validation Criteria:**
- [ ] Click on ground places start point
- [ ] Start point renders as blue sphere
- [ ] Distance input appears near click location
- [ ] Grid snapping works with start point
- [ ] Input field auto-focuses

**Files Modified:**
- `app/src/components/Scene/DrawingCanvas.tsx`

---

### Task 2.2: Create Precision Math Utilities
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** None

**Description:**
Create utility functions for 3D vector mathematics required for precise distance calculations.

**Implementation Steps:**
1. Create `app/src/utils/precisionMath.ts`
2. Implement core mathematical functions
3. Add input validation and formatting

**Code Example:**
```typescript
// app/src/utils/precisionMath.ts
import { Vector3 } from 'three';

/**
 * Calculate normalized direction vector from start to target point
 */
export const calculateDirection = (
  startPoint: Vector3,
  targetPoint: Vector3
): Vector3 => {
  if (startPoint.equals(targetPoint)) {
    // Return default direction if points are identical
    return new Vector3(1, 0, 0);
  }
  return targetPoint.clone().sub(startPoint).normalize();
};

/**
 * Apply precise distance along direction vector
 */
export const applyDistance = (
  startPoint: Vector3,
  direction: Vector3,
  distance: number
): Vector3 => {
  return startPoint.clone().add(direction.multiplyScalar(distance));
};

/**
 * Calculate distance between two points
 */
export const calculateDistance = (
  pointA: Vector3,
  pointB: Vector3
): number => {
  return pointA.distanceTo(pointB);
};

/**
 * Format distance for display
 */
export const formatDistance = (distance: number): string => {
  if (distance < 0.01) return '0.00m';
  return `${distance.toFixed(2)}m`;
};

/**
 * Validate distance input
 */
export const validateDistance = (input: string): {
  isValid: boolean;
  value: number | null;
  error?: string;
} => {
  if (!input.trim()) {
    return { isValid: false, value: null, error: 'Distance required' };
  }

  const numValue = parseFloat(input);

  if (isNaN(numValue)) {
    return { isValid: false, value: null, error: 'Invalid number' };
  }

  if (numValue <= 0) {
    return { isValid: false, value: null, error: 'Distance must be positive' };
  }

  if (numValue > 1000) {
    return { isValid: false, value: null, error: 'Distance too large (max 1000m)' };
  }

  return { isValid: true, value: numValue };
};

/**
 * Create line segment data structure
 */
export const createLineSegment = (
  startPoint: Vector3,
  endPoint: Vector3
): {
  id: string;
  type: 'line';
  startPoint: Vector3;
  endPoint: Vector3;
  length: number;
  createdAt: Date;
} => {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'line',
    startPoint: startPoint.clone(),
    endPoint: endPoint.clone(),
    length: calculateDistance(startPoint, endPoint),
    createdAt: new Date(),
  };
};
```

**Validation Criteria:**
- [ ] Direction calculation returns normalized vectors
- [ ] Distance application maintains precision
- [ ] Input validation catches invalid cases
- [ ] Distance formatting displays correctly
- [ ] All functions handle edge cases

**Files Created:**
- `app/src/utils/precisionMath.ts`

---

### Task 2.3: Create Preview Line Rendering Component
**Estimated Time:** 1.5 hours
**Priority:** High
**Dependencies:** Task 2.2

**Description:**
Create a component that renders a preview line from the start point toward the cursor or to a precise distance.

**Implementation Steps:**
1. Create `app/src/components/Scene/PrecisionLinePreview.tsx`
2. Implement Three.js line geometry rendering
3. Add real-time updates based on cursor position

**Code Example:**
```typescript
// app/src/components/Scene/PrecisionLinePreview.tsx
import React, { useMemo } from 'react';
import { Vector3, BufferGeometry } from 'three';
import { Line } from '@react-three/drei';

interface PrecisionLinePreviewProps {
  startPoint: Vector3 | null;
  endPoint: Vector3 | null;
  visible: boolean;
}

export const PrecisionLinePreview: React.FC<PrecisionLinePreviewProps> = ({
  startPoint,
  endPoint,
  visible
}) => {
  const points = useMemo(() => {
    if (!startPoint || !endPoint || !visible) return [];
    return [startPoint, endPoint];
  }, [startPoint, endPoint, visible]);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const geometry = new BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  // Cleanup geometry on unmount
  React.useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (!visible || !startPoint || !endPoint || !geometry) {
    return null;
  }

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color="#3b82f6"
        linewidth={2}
        transparent={true}
        opacity={0.8}
      />
    </line>
  );
};

// Alternative implementation using Line from drei
export const PrecisionLinePreviewDrei: React.FC<PrecisionLinePreviewProps> = ({
  startPoint,
  endPoint,
  visible
}) => {
  const points = useMemo(() => {
    if (!startPoint || !endPoint || !visible) return [];
    return [startPoint.toArray(), endPoint.toArray()];
  }, [startPoint, endPoint, visible]);

  if (!visible || points.length === 0) {
    return null;
  }

  return (
    <Line
      points={points}
      color="#3b82f6"
      lineWidth={3}
      transparent={true}
      opacity={0.8}
    />
  );
};

export default PrecisionLinePreview;
```

**Validation Criteria:**
- [ ] Preview line renders between two points
- [ ] Line updates in real-time with cursor movement
- [ ] Line disappears when not visible
- [ ] Geometry is properly disposed to prevent memory leaks
- [ ] Line styling matches design system

**Files Created:**
- `app/src/components/Scene/PrecisionLinePreview.tsx`

---

### Task 2.4: Add Cursor Tracking and Distance Input Integration
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** Task 2.1, Task 2.3

**Description:**
Integrate cursor tracking with distance input to update preview line in real-time.

**Implementation Steps:**
1. Add mouse move handler for cursor tracking
2. Connect distance input changes to preview updates
3. Implement real-time preview calculations

**Code Example:**
```typescript
// In DrawingCanvas.tsx, add mouse move handler
const handleMouseMove = useCallback((event: ThreeEvent<PointerEvent>) => {
  if (activeTool !== 'line' || !lineTool.startPoint) return;

  // Get current cursor position on ground plane
  raycaster.setFromCamera(mouse, camera);
  const groundIntersection = raycaster.intersectObject(groundPlane);

  if (groundIntersection.length === 0) return;

  let cursorPoint = groundIntersection[0].point.clone();

  // Apply grid snapping if enabled
  if (gridSnapEnabled) {
    cursorPoint = applyGridSnapping(cursorPoint);
  }

  // Calculate direction from start point to cursor
  const direction = calculateDirection(lineTool.startPoint, cursorPoint);

  // Use typed distance if available, otherwise cursor distance
  let endPoint: Vector3;
  if (lineTool.currentDistance && lineTool.currentDistance > 0) {
    // Use precise distance from input
    endPoint = applyDistance(lineTool.startPoint, direction, lineTool.currentDistance);
  } else {
    // Use cursor position
    endPoint = cursorPoint;
  }

  // Update preview end point
  setPreviewEndPoint(endPoint);

  // Update input field current distance display if no typed value
  if (!lineTool.inputValue) {
    const currentDistance = calculateDistance(lineTool.startPoint, cursorPoint);
    // Could show this in tooltip or status
  }
}, [
  activeTool, lineTool.startPoint, lineTool.currentDistance, lineTool.inputValue,
  raycaster, mouse, camera, groundPlane, gridSnapEnabled,
  setPreviewEndPoint
]);

// Add to JSX in DrawingCanvas
<mesh
  onPointerMove={handleMouseMove}
  // ... existing props
>
  {/* existing ground plane */}
</mesh>

// Connect distance input changes
const handleDistanceInputChange = useCallback((value: string) => {
  setLineInputValue(value);

  if (lineTool.startPoint && value) {
    const validation = validateDistance(value);
    if (validation.isValid && validation.value) {
      // Calculate direction based on current cursor position
      raycaster.setFromCamera(mouse, camera);
      const groundIntersection = raycaster.intersectObject(groundPlane);

      if (groundIntersection.length > 0) {
        const cursorPoint = groundIntersection[0].point.clone();
        const direction = calculateDirection(lineTool.startPoint, cursorPoint);
        const preciseEndPoint = applyDistance(
          lineTool.startPoint,
          direction,
          validation.value
        );

        setPreviewEndPoint(preciseEndPoint);
      }
    }
  }
}, [
  lineTool.startPoint, mouse, camera, groundPlane,
  setLineInputValue, setPreviewEndPoint
]);
```

**Validation Criteria:**
- [ ] Preview line follows cursor movement
- [ ] Typing distance updates preview to exact length
- [ ] Preview maintains direction toward cursor
- [ ] Grid snapping affects both cursor and precise positions
- [ ] Performance remains smooth during movement

**Files Modified:**
- `app/src/components/Scene/DrawingCanvas.tsx`

---

## Phase 3: Precision Features (3-4 hours)

### Task 3.1: Implement Distance Confirmation and Line Creation
**Estimated Time:** 1.5 hours
**Priority:** High
**Dependencies:** Phase 2 complete

**Description:**
Add functionality to confirm distance input and create actual line segments in the drawing.

**Implementation Steps:**
1. Implement distance confirmation handler
2. Add line segment creation logic
3. Integrate with existing shape system

**Code Example:**
```typescript
// In DrawingCanvas.tsx, add confirmation handler
const handleDistanceConfirmation = useCallback(() => {
  if (!lineTool.startPoint || !lineTool.inputValue) return;

  const validation = validateDistance(lineTool.inputValue);
  if (!validation.isValid || !validation.value) {
    // Show error feedback
    console.warn('Invalid distance:', validation.error);
    return;
  }

  // Calculate final end point
  let endPoint: Vector3;
  if (lineTool.previewEndPoint) {
    endPoint = lineTool.previewEndPoint.clone();
  } else {
    // Fallback: use cursor direction with precise distance
    raycaster.setFromCamera(mouse, camera);
    const groundIntersection = raycaster.intersectObject(groundPlane);
    if (groundIntersection.length === 0) return;

    const cursorPoint = groundIntersection[0].point.clone();
    const direction = calculateDirection(lineTool.startPoint, cursorPoint);
    endPoint = applyDistance(lineTool.startPoint, direction, validation.value);
  }

  // Apply grid snapping to end point
  if (gridSnapEnabled) {
    endPoint = applyGridSnapping(endPoint);
  }

  // Create line segment
  const lineSegment = createLineSegment(lineTool.startPoint, endPoint);
  addLineSegment(lineSegment);

  // Add to main shapes array for rendering
  addShape({
    id: lineSegment.id,
    type: 'line',
    points: [lineTool.startPoint, endPoint],
    area: 0, // Lines have no area
    center: lineTool.startPoint.clone().add(endPoint).divideScalar(2),
  });

  // Continue drawing from end point or finish
  continueLineDrawing(endPoint);
}, [
  lineTool.startPoint, lineTool.inputValue, lineTool.previewEndPoint,
  gridSnapEnabled, addLineSegment, addShape
]);

const continueLineDrawing = useCallback((endPoint: Vector3) => {
  // Set end point as new start point for continued drawing
  setLineStartPoint(endPoint);
  setLineInputValue('');
  setPreviewEndPoint(null);

  // Keep input visible for next segment
  // Input position will be updated on next mouse move
}, [setLineStartPoint, setLineInputValue, setPreviewEndPoint]);

const finishLineDrawing = useCallback(() => {
  setLineStartPoint(null);
  setLineInputValue('');
  setShowLineInput(false);
  setPreviewEndPoint(null);

  // Optionally switch back to select tool
  // setActiveTool('select');
}, [
  setLineStartPoint, setLineInputValue,
  setShowLineInput, setPreviewEndPoint
]);
```

**Validation Criteria:**
- [ ] Enter key creates line segment
- [ ] Line segment appears in 3D scene
- [ ] Precise distance is maintained accurately
- [ ] Can continue drawing connected segments
- [ ] ESC cancels and finishes drawing

**Files Modified:**
- `app/src/components/Scene/DrawingCanvas.tsx`

---

### Task 3.2: Integrate Line Rendering with Shape System
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** Task 3.1

**Description:**
Ensure line segments render properly through the existing ShapeRenderer system.

**Implementation Steps:**
1. Extend ShapeRenderer to handle line type shapes
2. Add line-specific rendering logic
3. Ensure consistent material and styling

**Code Example:**
```typescript
// In ShapeRenderer.tsx, add line rendering support
const renderLineSegment = (shape: Shape) => {
  if (shape.type !== 'line' || !shape.points || shape.points.length < 2) {
    return null;
  }

  const [startPoint, endPoint] = shape.points;
  const geometry = useMemo(() => {
    const geometry = new BufferGeometry().setFromPoints([startPoint, endPoint]);
    return geometry;
  }, [startPoint, endPoint]);

  // Cleanup geometry
  useEffect(() => {
    return () => geometry?.dispose();
  }, [geometry]);

  return (
    <line key={shape.id} geometry={geometry}>
      <lineBasicMaterial
        color={shape.id === selectedShapeId ? '#ff6b35' : '#374151'}
        linewidth={3}
        transparent={true}
        opacity={0.9}
      />
    </line>
  );
};

// In main render function, add line case
const renderShape = (shape: Shape) => {
  switch (shape.type) {
    case 'rectangle':
      return renderRectangle(shape);
    case 'circle':
      return renderCircle(shape);
    case 'polyline':
      return renderPolyline(shape);
    case 'line':
      return renderLineSegment(shape);
    default:
      return null;
  }
};
```

**Validation Criteria:**
- [ ] Line segments render correctly in 3D scene
- [ ] Lines show selection state (color change)
- [ ] Line materials match design system
- [ ] Performance remains smooth with multiple lines
- [ ] Geometry cleanup prevents memory leaks

**Files Modified:**
- `app/src/components/Scene/ShapeRenderer.tsx`

---

### Task 3.3: Add Multi-segment Connected Drawing
**Estimated Time:** 1 hour
**Priority:** Medium
**Dependencies:** Task 3.1

**Description:**
Enable drawing multiple connected line segments in sequence.

**Implementation Steps:**
1. Modify confirmation handler to continue drawing
2. Add visual feedback for continued drawing
3. Implement proper termination conditions

**Code Example:**
```typescript
// Enhanced continuation logic in DrawingCanvas.tsx
const continueLineDrawing = useCallback((endPoint: Vector3) => {
  // Set end point as new start point for continued drawing
  setLineStartPoint(endPoint);
  setLineInputValue('');
  setPreviewEndPoint(null);

  // Keep input visible at new position
  const rect = canvasRef.current?.getBoundingClientRect();
  if (rect) {
    // Position input near the new start point
    const screenPoint = worldToScreen(endPoint, camera, rect);
    setLineInputPosition({
      x: screenPoint.x,
      y: screenPoint.y
    });
  }

  // Auto-focus input for next segment
  setTimeout(() => {
    const input = document.querySelector('.distance-input input') as HTMLInputElement;
    input?.focus();
  }, 50);
}, [setLineStartPoint, setLineInputValue, setPreviewEndPoint, camera]);

// Helper function to convert world coordinates to screen
const worldToScreen = (
  worldPoint: Vector3,
  camera: Camera,
  rect: DOMRect
): { x: number; y: number } => {
  const vector = worldPoint.clone().project(camera);
  return {
    x: (vector.x * 0.5 + 0.5) * rect.width,
    y: (-vector.y * 0.5 + 0.5) * rect.height
  };
};

// Add right-click to finish drawing
const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
  if (activeTool === 'line' && lineTool.startPoint) {
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    finishLineDrawing();
  }
}, [activeTool, lineTool.startPoint, finishLineDrawing]);

// Add to JSX
<mesh
  onContextMenu={handleContextMenu}
  // ... other handlers
>
```

**Validation Criteria:**
- [ ] Can draw multiple connected segments
- [ ] Input field repositions for each new segment
- [ ] Right-click finishes multi-segment drawing
- [ ] Each segment is created accurately
- [ ] Visual feedback clear for continued drawing

**Files Modified:**
- `app/src/components/Scene/DrawingCanvas.tsx`

---

### Task 3.4: Enhanced Keyboard Controls and Shortcuts
**Estimated Time:** 0.5 hours
**Priority:** Low
**Dependencies:** Task 3.3

**Description:**
Add comprehensive keyboard controls for efficient line drawing workflow.

**Implementation Steps:**
1. Add Tab key to focus distance input
2. Add Shift+Enter for finishing drawing
3. Add arrow keys for micro-adjustments

**Code Example:**
```typescript
// Enhanced keyboard handling in App.tsx
const handleLineToolKeydown = useCallback((event: KeyboardEvent) => {
  if (activeTool !== 'line') return;

  switch (event.key) {
    case 'Tab':
      event.preventDefault();
      // Focus distance input if visible
      const input = document.querySelector('.distance-input input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
      break;

    case 'Enter':
      if (event.shiftKey) {
        // Shift+Enter finishes drawing
        event.preventDefault();
        finishLineDrawing();
      }
      // Regular Enter handled by DistanceInput component
      break;

    case 'Escape':
      event.preventDefault();
      finishLineDrawing();
      setActiveTool('select');
      break;

    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ArrowUp':
    case 'ArrowDown':
      // Future: micro-adjustments to input value
      break;
  }
}, [activeTool, finishLineDrawing, setActiveTool]);

useEffect(() => {
  window.addEventListener('keydown', handleLineToolKeydown);
  return () => window.removeEventListener('keydown', handleLineToolKeydown);
}, [handleLineToolKeydown]);
```

**Validation Criteria:**
- [ ] Tab focuses distance input field
- [ ] Shift+Enter finishes multi-segment drawing
- [ ] ESC cancels and exits line tool
- [ ] Keyboard shortcuts don't interfere with other inputs
- [ ] All shortcuts work consistently

**Files Modified:**
- `app/src/App.tsx`

---

## Phase 4: Polish & Testing (2-3 hours)

### Task 4.1: Enhanced Visual Feedback
**Estimated Time:** 1 hour
**Priority:** Medium
**Dependencies:** Phase 3 complete

**Description:**
Add comprehensive visual feedback including distance labels, snap indicators, and state feedback.

**Implementation Steps:**
1. Add distance label display on preview line
2. Create snap indicators for grid alignment
3. Add visual state indicators

**Code Example:**
```typescript
// Create DistanceLabel component
// app/src/components/Scene/DistanceLabel.tsx
import React from 'react';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { formatDistance, calculateDistance } from '../../utils/precisionMath';

interface DistanceLabelProps {
  startPoint: Vector3;
  endPoint: Vector3;
  visible: boolean;
}

export const DistanceLabel: React.FC<DistanceLabelProps> = ({
  startPoint,
  endPoint,
  visible
}) => {
  if (!visible) return null;

  const midPoint = startPoint.clone().add(endPoint).divideScalar(2);
  const distance = calculateDistance(startPoint, endPoint);

  return (
    <Html position={midPoint} center>
      <div style={{
        background: 'rgba(59, 130, 246, 0.9)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'Nunito Sans, sans-serif',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}>
        {formatDistance(distance)}
      </div>
    </Html>
  );
};

// Enhanced PrecisionLinePreview with distance label
export const EnhancedPrecisionLinePreview: React.FC<PrecisionLinePreviewProps> = ({
  startPoint,
  endPoint,
  visible
}) => {
  return (
    <>
      <PrecisionLinePreview
        startPoint={startPoint}
        endPoint={endPoint}
        visible={visible}
      />
      {startPoint && endPoint && visible && (
        <DistanceLabel
          startPoint={startPoint}
          endPoint={endPoint}
          visible={visible}
        />
      )}
    </>
  );
};

// Grid snap indicator component
export const GridSnapIndicator: React.FC<{ position: Vector3; visible: boolean }> = ({
  position,
  visible
}) => {
  if (!visible) return null;

  return (
    <mesh position={position}>
      <ringGeometry args={[0.08, 0.12, 16]} />
      <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
    </mesh>
  );
};
```

**Validation Criteria:**
- [ ] Distance labels appear on preview lines
- [ ] Grid snap indicators show when snapping
- [ ] Visual feedback is clear and professional
- [ ] Labels don't interfere with interaction
- [ ] Performance remains smooth with visual elements

**Files Created:**
- `app/src/components/Scene/DistanceLabel.tsx`

**Files Modified:**
- `app/src/components/Scene/PrecisionLinePreview.tsx`

---

### Task 4.2: Error Handling and Edge Cases
**Estimated Time:** 0.5 hours
**Priority:** High
**Dependencies:** None

**Description:**
Implement comprehensive error handling for edge cases and invalid inputs.

**Implementation Steps:**
1. Add input validation with user feedback
2. Handle raycasting failures gracefully
3. Add error states and recovery

**Code Example:**
```typescript
// Enhanced error handling in DrawingCanvas.tsx
const handleLineDrawingError = useCallback((error: string) => {
  console.warn('Line drawing error:', error);

  // Show temporary error message
  // This could be a toast notification or status message
  const showError = (message: string) => {
    // Implementation depends on existing notification system
    console.error(`Line Tool Error: ${message}`);
  };

  switch (error) {
    case 'INVALID_DISTANCE':
      showError('Please enter a valid distance');
      break;
    case 'RAYCAST_FAILED':
      showError('Unable to place point at this location');
      break;
    case 'GRID_SNAP_FAILED':
      showError('Grid snapping failed, using exact position');
      break;
    default:
      showError('An error occurred while drawing the line');
  }
}, []);

// Enhanced validation with error handling
const handleDistanceConfirmationWithValidation = useCallback(() => {
  if (!lineTool.startPoint) {
    handleLineDrawingError('NO_START_POINT');
    return;
  }

  if (!lineTool.inputValue) {
    handleLineDrawingError('NO_DISTANCE_INPUT');
    return;
  }

  const validation = validateDistance(lineTool.inputValue);
  if (!validation.isValid) {
    handleLineDrawingError('INVALID_DISTANCE');
    return;
  }

  try {
    // Proceed with line creation
    handleDistanceConfirmation();
  } catch (error) {
    handleLineDrawingError('CREATION_FAILED');
    console.error('Line creation failed:', error);
  }
}, [lineTool.startPoint, lineTool.inputValue, handleDistanceConfirmation]);

// Fallback for raycasting failures
const safeGetGroundIntersection = useCallback((event: ThreeEvent<MouseEvent>) => {
  try {
    raycaster.setFromCamera(mouse, camera);
    const intersections = raycaster.intersectObject(groundPlane);

    if (intersections.length === 0) {
      handleLineDrawingError('RAYCAST_FAILED');
      return null;
    }

    return intersections[0].point.clone();
  } catch (error) {
    handleLineDrawingError('RAYCAST_ERROR');
    console.error('Raycasting error:', error);
    return null;
  }
}, [raycaster, mouse, camera, groundPlane, handleLineDrawingError]);
```

**Validation Criteria:**
- [ ] Invalid distance inputs show clear error messages
- [ ] Raycasting failures are handled gracefully
- [ ] Error states don't break the application
- [ ] Users can recover from error states
- [ ] All edge cases are covered

**Files Modified:**
- `app/src/components/Scene/DrawingCanvas.tsx`
- `app/src/utils/precisionMath.ts`

---

### Task 4.3: Performance Optimization
**Estimated Time:** 0.5 hours
**Priority:** Medium
**Dependencies:** All previous tasks

**Description:**
Optimize performance for smooth real-time updates and memory efficiency.

**Implementation Steps:**
1. Implement throttling for mouse move updates
2. Optimize geometry creation and disposal
3. Add performance monitoring

**Code Example:**
```typescript
// Performance optimization utilities
// app/src/utils/performance.ts
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return ((...args: any[]) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};

// Optimized mouse move handler
const throttledMouseMove = useMemo(
  () => throttle(handleMouseMove, 16), // 60fps
  [handleMouseMove]
);

// Geometry pool for line segments
class GeometryPool {
  private static instance: GeometryPool;
  private pool: BufferGeometry[] = [];

  static getInstance(): GeometryPool {
    if (!GeometryPool.instance) {
      GeometryPool.instance = new GeometryPool();
    }
    return GeometryPool.instance;
  }

  getGeometry(): BufferGeometry {
    return this.pool.pop() || new BufferGeometry();
  }

  returnGeometry(geometry: BufferGeometry): void {
    geometry.setFromPoints([]);
    this.pool.push(geometry);
  }

  dispose(): void {
    this.pool.forEach(geometry => geometry.dispose());
    this.pool = [];
  }
}

// Use geometry pool in PrecisionLinePreview
const geometry = useMemo(() => {
  if (points.length === 0) return null;

  const pool = GeometryPool.getInstance();
  const geometry = pool.getGeometry();
  geometry.setFromPoints(points);

  return geometry;
}, [points]);

useEffect(() => {
  return () => {
    if (geometry) {
      const pool = GeometryPool.getInstance();
      pool.returnGeometry(geometry);
    }
  };
}, [geometry]);
```

**Validation Criteria:**
- [ ] Mouse movement updates maintain 60fps
- [ ] Memory usage remains stable during extended use
- [ ] Geometry objects are properly reused
- [ ] No memory leaks detected
- [ ] Performance metrics meet targets

**Files Created:**
- `app/src/utils/performance.ts`

**Files Modified:**
- `app/src/components/Scene/DrawingCanvas.tsx`
- `app/src/components/Scene/PrecisionLinePreview.tsx`

---

### Task 4.4: Comprehensive Testing Suite
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** All previous tasks

**Description:**
Create automated tests covering all functionality with >70% coverage target.

**Implementation Steps:**
1. Create unit tests for precision math utilities
2. Add component tests for UI interactions
3. Create integration tests for drawing workflow

**Code Example:**
```typescript
// app/src/__tests__/LineDrawing.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Vector3 } from 'three';
import {
  calculateDirection,
  applyDistance,
  validateDistance,
  formatDistance,
  createLineSegment
} from '../utils/precisionMath';

describe('Precision Math Utilities', () => {
  test('calculateDirection returns normalized vector', () => {
    const start = new Vector3(0, 0, 0);
    const end = new Vector3(3, 0, 4);
    const direction = calculateDirection(start, end);

    expect(direction.length()).toBeCloseTo(1.0, 6);
    expect(direction.x).toBeCloseTo(0.6, 6);
    expect(direction.z).toBeCloseTo(0.8, 6);
  });

  test('calculateDirection handles identical points', () => {
    const point = new Vector3(5, 0, 5);
    const direction = calculateDirection(point, point);

    expect(direction.length()).toBe(1.0);
    expect(direction.x).toBe(1.0); // Default direction
  });

  test('applyDistance maintains precision', () => {
    const start = new Vector3(0, 0, 0);
    const direction = new Vector3(1, 0, 0);
    const distance = 5.5;

    const result = applyDistance(start, direction, distance);

    expect(result.x).toBe(5.5);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });

  test('validateDistance accepts valid inputs', () => {
    const tests = [
      { input: '5', expected: 5 },
      { input: '5.5', expected: 5.5 },
      { input: '0.01', expected: 0.01 },
      { input: '999.99', expected: 999.99 }
    ];

    tests.forEach(({ input, expected }) => {
      const result = validateDistance(input);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(expected);
    });
  });

  test('validateDistance rejects invalid inputs', () => {
    const invalidInputs = ['', 'abc', '-5', '0', '1001', '5.5.5'];

    invalidInputs.forEach(input => {
      const result = validateDistance(input);
      expect(result.isValid).toBe(false);
      expect(result.value).toBe(null);
    });
  });

  test('formatDistance displays correctly', () => {
    expect(formatDistance(0)).toBe('0.00m');
    expect(formatDistance(5)).toBe('5.00m');
    expect(formatDistance(5.555)).toBe('5.56m');
  });

  test('createLineSegment generates valid data', () => {
    const start = new Vector3(0, 0, 0);
    const end = new Vector3(5, 0, 0);

    const segment = createLineSegment(start, end);

    expect(segment.type).toBe('line');
    expect(segment.length).toBe(5);
    expect(segment.id).toMatch(/^line_\d+_[a-z0-9]+$/);
    expect(segment.startPoint.equals(start)).toBe(true);
    expect(segment.endPoint.equals(end)).toBe(true);
    expect(segment.createdAt).toBeInstanceOf(Date);
  });
});

// Component tests
import { render, screen, fireEvent } from '@testing-library/react';
import { DistanceInput } from '../components/DistanceInput/DistanceInput';

describe('DistanceInput Component', () => {
  const defaultProps = {
    position: { x: 100, y: 100 },
    value: '',
    onChange: vi.fn(),
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    visible: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders when visible', () => {
    render(<DistanceInput {...defaultProps} />);
    const input = screen.getByPlaceholderText('Distance (m)');
    expect(input).toBeInTheDocument();
  });

  test('does not render when not visible', () => {
    render(<DistanceInput {...defaultProps} visible={false} />);
    const input = screen.queryByPlaceholderText('Distance (m)');
    expect(input).not.toBeInTheDocument();
  });

  test('handles numeric input correctly', () => {
    render(<DistanceInput {...defaultProps} />);
    const input = screen.getByPlaceholderText('Distance (m)');

    fireEvent.change(input, { target: { value: '5.5' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('5.5');
  });

  test('rejects non-numeric input', () => {
    render(<DistanceInput {...defaultProps} />);
    const input = screen.getByPlaceholderText('Distance (m)');

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  test('handles Enter key', () => {
    render(<DistanceInput {...defaultProps} />);
    const input = screen.getByPlaceholderText('Distance (m)');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  test('handles Escape key', () => {
    render(<DistanceInput {...defaultProps} />);
    const input = screen.getByPlaceholderText('Distance (m)');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});

// Integration tests
describe('Line Drawing Integration', () => {
  test('complete drawing workflow', async () => {
    // This would test the complete workflow
    // Mock Three.js components and test user interactions
    // Due to complexity, this would be implemented incrementally
  });
});
```

**Validation Criteria:**
- [ ] All unit tests pass
- [ ] Component tests cover key interactions
- [ ] Integration tests validate workflows
- [ ] Test coverage >70%
- [ ] Tests run in CI/CD pipeline

**Files Created:**
- `app/src/__tests__/LineDrawing.test.tsx`
- `app/src/__tests__/DistanceInput.test.tsx`

---

## Summary

### Total Implementation Time: 12-16 hours

**Phase 1 (4-5 hours):** Core Infrastructure
- Line tool button and activation
- DistanceInput component
- Store state management
- Keyboard shortcuts

**Phase 2 (4-5 hours):** Drawing Logic
- First point placement with raycasting
- Precision math utilities
- Preview line rendering
- Cursor tracking integration

**Phase 3 (3-4 hours):** Precision Features
- Distance confirmation and line creation
- Shape system integration
- Multi-segment drawing
- Enhanced keyboard controls

**Phase 4 (2-3 hours):** Polish & Testing
- Visual feedback enhancements
- Error handling and edge cases
- Performance optimization
- Comprehensive testing suite

### Success Metrics

**Functional Requirements:**
- ✓ All acceptance criteria met
- ✓ AutoCAD-style workflow functional
- ✓ Precision maintained to 0.01m
- ✓ Grid snapping integration working

**Technical Requirements:**
- ✓ 60fps performance maintained
- ✓ Memory usage stable
- ✓ TypeScript strict mode compliance
- ✓ >70% test coverage

**User Experience:**
- ✓ Professional CAD-style interaction
- ✓ Clear visual feedback
- ✓ Intuitive keyboard shortcuts
- ✓ Graceful error handling

### Next Steps After Completion

1. **User Testing:** Validate with AutoCAD users
2. **Performance Testing:** Load testing with complex drawings
3. **Documentation:** User guide and developer documentation
4. **Future Enhancements:** Angle input, 3D lines, advanced snapping

---

**Status:** Ready for Implementation
**Priority:** High
**Assigned:** Senior Full-Stack Developer
**Review Required:** Technical Lead, UX Designer