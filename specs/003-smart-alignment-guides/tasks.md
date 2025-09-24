# Task Breakdown: Smart Alignment Guide System

**Specification ID**: 003
**Feature Name**: Smart Alignment Guide System
**Total Estimated Time**: 160 hours (4 weeks)

## Task Overview

This document provides a detailed, actionable task breakdown for implementing the Smart Alignment Guide System. Each task includes code examples, acceptance criteria, and time estimates.

## Week 1: Core Infrastructure (40 hours)

### Task 1.1: Create AlignmentGuideService Class
**Time**: 8 hours
**File**: `app/src/services/AlignmentGuideService.ts`

```typescript
// Implementation skeleton
export class AlignmentGuideService {
  private static instance: AlignmentGuideService;
  private spatialIndex: SpatialIndex;
  private cache: Map<string, AlignmentResult>;

  static getInstance(): AlignmentGuideService {
    if (!this.instance) {
      this.instance = new AlignmentGuideService();
    }
    return this.instance;
  }

  detectAlignments(
    activeShape: Shape,
    shapes: Shape[],
    threshold: number = 0.5
  ): AlignmentResult {
    const cacheKey = this.getCacheKey(activeShape, shapes);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const guides: AlignmentGuide[] = [];
    const measurements: SpacingMeasurement[] = [];

    // Detect edge alignments
    shapes.forEach(shape => {
      const alignments = this.detectEdgeAlignments(activeShape, shape, threshold);
      guides.push(...alignments);
    });

    // Detect center alignments
    const centerAlignments = this.detectCenterAlignments(activeShape, shapes, threshold);
    guides.push(...centerAlignments);

    // Calculate spacing
    const spacingData = this.calculateSpacing(activeShape, shapes);
    measurements.push(...spacingData);

    const result = { guides, measurements, hasSnap: guides.length > 0 };
    this.cache.set(cacheKey, result);
    return result;
  }
}
```

**Acceptance Criteria**:
- [ ] Service singleton pattern implemented
- [ ] Alignment detection returns guides within 5ms
- [ ] Cache system prevents redundant calculations
- [ ] Unit tests pass with 100% coverage

### Task 1.2: Implement Edge Alignment Detection
**Time**: 6 hours
**File**: `app/src/services/AlignmentGuideService.ts`

```typescript
private detectEdgeAlignments(
  shape1: Shape,
  shape2: Shape,
  threshold: number
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const bounds1 = this.getShapeBounds(shape1);
  const bounds2 = this.getShapeBounds(shape2);

  // Check left edge alignment
  if (Math.abs(bounds1.left - bounds2.left) < threshold) {
    guides.push({
      id: `${shape1.id}-${shape2.id}-left`,
      type: AlignmentType.LEFT_EDGE,
      position: new Vector3(bounds1.left, 0, 0),
      start: new Vector3(bounds1.left, 0, Math.min(bounds1.top, bounds2.top)),
      end: new Vector3(bounds1.left, 0, Math.max(bounds1.bottom, bounds2.bottom)),
      shapes: [shape1.id, shape2.id],
      strength: 1 - (Math.abs(bounds1.left - bounds2.left) / threshold)
    });
  }

  // Repeat for right, top, bottom edges
  // ...

  return guides;
}
```

**Acceptance Criteria**:
- [ ] Detects all four edge alignments
- [ ] Handles rotated shapes correctly
- [ ] Returns strength value for snapping priority
- [ ] Performance < 1ms per shape pair

### Task 1.3: Implement Center Alignment Detection
**Time**: 4 hours
**File**: `app/src/services/AlignmentGuideService.ts`

```typescript
private detectCenterAlignments(
  activeShape: Shape,
  shapes: Shape[],
  threshold: number
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const activeCenter = this.getShapeCenter(activeShape);

  shapes.forEach(shape => {
    const center = this.getShapeCenter(shape);

    // Horizontal center alignment
    if (Math.abs(activeCenter.x - center.x) < threshold) {
      guides.push({
        id: `${activeShape.id}-${shape.id}-hcenter`,
        type: AlignmentType.HORIZONTAL_CENTER,
        position: new Vector3(center.x, 0, 0),
        start: new Vector3(center.x, 0, -10),
        end: new Vector3(center.x, 0, 10),
        shapes: [activeShape.id, shape.id],
        strength: 1 - (Math.abs(activeCenter.x - center.x) / threshold)
      });
    }

    // Vertical center alignment
    // ...
  });

  return guides;
}
```

**Acceptance Criteria**:
- [ ] Detects horizontal and vertical center alignment
- [ ] Works with different shape types
- [ ] Handles multiple alignments gracefully

### Task 1.4: Create Spatial Index
**Time**: 6 hours
**File**: `app/src/utils/SpatialIndex.ts`

```typescript
export class SpatialIndex {
  private grid: Map<string, Set<string>> = new Map();
  private shapePositions: Map<string, Vector3> = new Map();
  private cellSize: number = 10; // 10 meters

  private getCellKey(position: Vector3): string {
    const x = Math.floor(position.x / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${z}`;
  }

  insert(shape: Shape): void {
    const position = this.getShapePosition(shape);
    const cellKey = this.getCellKey(position);

    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, new Set());
    }

    this.grid.get(cellKey)!.add(shape.id);
    this.shapePositions.set(shape.id, position);
  }

  getNearby(shape: Shape, radius: number): Shape[] {
    const position = this.getShapePosition(shape);
    const nearby: Set<string> = new Set();

    // Check surrounding cells
    const cellRadius = Math.ceil(radius / this.cellSize);
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const checkPos = new Vector3(
          position.x + dx * this.cellSize,
          0,
          position.z + dz * this.cellSize
        );
        const cellKey = this.getCellKey(checkPos);

        if (this.grid.has(cellKey)) {
          this.grid.get(cellKey)!.forEach(id => nearby.add(id));
        }
      }
    }

    // Filter by actual distance
    return Array.from(nearby)
      .filter(id => {
        const pos = this.shapePositions.get(id)!;
        return position.distanceTo(pos) <= radius;
      })
      .map(id => this.getShapeById(id));
  }
}
```

**Acceptance Criteria**:
- [ ] O(1) insertion time
- [ ] Fast proximity queries
- [ ] Handles shape updates efficiently
- [ ] Memory efficient for 1000+ shapes

### Task 1.5: Create Alignment Store
**Time**: 4 hours
**File**: `app/src/store/useAlignmentStore.ts`

```typescript
import { create } from 'zustand';

interface AlignmentStore {
  guides: AlignmentGuide[];
  measurements: SpacingMeasurement[];
  snapEnabled: boolean;
  snapThreshold: number;
  snapPriority: {
    edge: number;
    center: number;
    spacing: number;
  };

  setGuides: (guides: AlignmentGuide[]) => void;
  setMeasurements: (measurements: SpacingMeasurement[]) => void;
  updateSnapConfig: (config: Partial<SnapConfig>) => void;
  clearAlignments: () => void;
}

export const useAlignmentStore = create<AlignmentStore>((set) => ({
  guides: [],
  measurements: [],
  snapEnabled: true,
  snapThreshold: 0.5,
  snapPriority: {
    edge: 1.0,
    center: 0.8,
    spacing: 0.6
  },

  setGuides: (guides) => set({ guides }),
  setMeasurements: (measurements) => set({ measurements }),
  updateSnapConfig: (config) => set((state) => ({
    ...state,
    ...config
  })),
  clearAlignments: () => set({ guides: [], measurements: [] })
}));
```

**Acceptance Criteria**:
- [ ] Store follows existing patterns
- [ ] Immutable state updates
- [ ] TypeScript strict mode compliant
- [ ] Integrates with existing stores

### Task 1.6: Calculate Spacing Measurements
**Time**: 4 hours
**File**: `app/src/services/AlignmentGuideService.ts`

```typescript
private calculateSpacing(
  activeShape: Shape,
  shapes: Shape[]
): SpacingMeasurement[] {
  const measurements: SpacingMeasurement[] = [];
  const activeBounds = this.getShapeBounds(activeShape);

  // Sort shapes by position for spacing detection
  const sortedShapes = shapes
    .map(shape => ({
      shape,
      bounds: this.getShapeBounds(shape)
    }))
    .sort((a, b) => a.bounds.left - b.bounds.left);

  // Find equal spacing patterns
  for (let i = 0; i < sortedShapes.length - 1; i++) {
    const gap1 = sortedShapes[i + 1].bounds.left - sortedShapes[i].bounds.right;
    const activeGap = activeBounds.left - sortedShapes[i].bounds.right;

    if (Math.abs(gap1 - activeGap) < 0.1) {
      measurements.push({
        id: `spacing-${i}`,
        distance: gap1,
        unit: 'm',
        position: new Vector3(
          (sortedShapes[i].bounds.right + activeBounds.left) / 2,
          0,
          (sortedShapes[i].bounds.center.z + activeBounds.center.z) / 2
        ),
        shapes: [sortedShapes[i].shape.id, activeShape.id]
      });
    }
  }

  return measurements;
}
```

**Acceptance Criteria**:
- [ ] Detects equal spacing patterns
- [ ] Calculates correct distance
- [ ] Positions badge correctly
- [ ] Handles multiple spacing groups

### Task 1.7: Write Unit Tests for Service
**Time**: 8 hours
**File**: `app/src/__tests__/services/AlignmentGuideService.test.ts`

```typescript
describe('AlignmentGuideService', () => {
  let service: AlignmentGuideService;

  beforeEach(() => {
    service = AlignmentGuideService.getInstance();
  });

  describe('Edge Alignment Detection', () => {
    it('should detect left edge alignment within threshold', () => {
      const shape1 = createMockShape({ x: 0, z: 0 });
      const shape2 = createMockShape({ x: 0.3, z: 5 });

      const result = service.detectAlignments(shape1, [shape2], 0.5);

      expect(result.guides).toHaveLength(1);
      expect(result.guides[0].type).toBe(AlignmentType.LEFT_EDGE);
    });

    it('should not detect alignment outside threshold', () => {
      const shape1 = createMockShape({ x: 0, z: 0 });
      const shape2 = createMockShape({ x: 1, z: 5 });

      const result = service.detectAlignments(shape1, [shape2], 0.5);

      expect(result.guides).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should detect alignments in < 5ms for 50 shapes', () => {
      const shapes = Array.from({ length: 50 }, (_, i) =>
        createMockShape({ x: i * 2, z: i * 2 })
      );

      const start = performance.now();
      service.detectAlignments(shapes[0], shapes.slice(1), 0.5);
      const end = performance.now();

      expect(end - start).toBeLessThan(5);
    });
  });
});
```

**Acceptance Criteria**:
- [ ] 100% code coverage
- [ ] Tests all alignment types
- [ ] Performance tests included
- [ ] Edge cases covered

## Week 2: Visual Components (40 hours)

### Task 2.1: Create AlignmentGuides Component
**Time**: 8 hours
**File**: `app/src/components/Scene/AlignmentGuides.tsx`

```typescript
import React from 'react';
import { Html } from '@react-three/drei';
import { useAlignmentStore } from '../../store/useAlignmentStore';
import DashedLine from './DashedLine';
import SpacingBadge from '../UI/SpacingBadge';

export const AlignmentGuides: React.FC = () => {
  const { guides, measurements } = useAlignmentStore();

  return (
    <group name="alignment-guides">
      {/* Render guide lines in 3D space */}
      {guides.map(guide => (
        <DashedLine
          key={guide.id}
          start={guide.start}
          end={guide.end}
          color="#8B5CF6"
          opacity={0.8}
          linewidth={2}
          dashSize={5}
          gapSize={5}
        />
      ))}

      {/* Render spacing badges as HTML overlays */}
      {measurements.map(measurement => (
        <Html
          key={measurement.id}
          position={measurement.position}
          center
          style={{ pointerEvents: 'none' }}
        >
          <SpacingBadge
            distance={measurement.distance}
            unit={measurement.unit}
          />
        </Html>
      ))}
    </group>
  );
};
```

**Acceptance Criteria**:
- [ ] Renders all guides from store
- [ ] Badges positioned correctly
- [ ] Performance smooth with 20+ guides
- [ ] Proper layering (guides behind shapes)

### Task 2.2: Implement DashedLine Component
**Time**: 6 hours
**File**: `app/src/components/Scene/DashedLine.tsx`

```typescript
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

extend({ Line2, LineMaterial, LineGeometry });

interface DashedLineProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  opacity: number;
  linewidth: number;
  dashSize: number;
  gapSize: number;
}

export const DashedLine: React.FC<DashedLineProps> = ({
  start,
  end,
  color,
  opacity,
  linewidth,
  dashSize,
  gapSize
}) => {
  const lineRef = useRef<Line2>();

  const geometry = useMemo(() => {
    const geometry = new LineGeometry();
    geometry.setPositions([
      start.x, start.y, start.z,
      end.x, end.y, end.z
    ]);
    return geometry;
  }, [start, end]);

  const material = useMemo(() => {
    return new LineMaterial({
      color: new THREE.Color(color),
      linewidth,
      opacity,
      transparent: true,
      dashed: true,
      dashSize,
      gapSize,
      dashScale: 1,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
    });
  }, [color, opacity, linewidth, dashSize, gapSize]);

  useFrame(() => {
    if (lineRef.current && material) {
      material.resolution.set(window.innerWidth, window.innerHeight);
    }
  });

  return <line2 ref={lineRef} geometry={geometry} material={material} />;
};
```

**Acceptance Criteria**:
- [ ] Renders dashed line correctly
- [ ] Smooth appearance at all zoom levels
- [ ] Responsive to window resize
- [ ] Memory efficient

### Task 2.3: Create SpacingBadge Component
**Time**: 4 hours
**File**: `app/src/components/UI/SpacingBadge.tsx`

```typescript
import React, { useState, useEffect } from 'react';

interface SpacingBadgeProps {
  distance: number;
  unit: string;
}

export const SpacingBadge: React.FC<SpacingBadgeProps> = ({
  distance,
  unit
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const badgeStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    background: '#8B5CF6',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontFamily: 'Nunito Sans, sans-serif',
    fontWeight: 600,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    opacity: visible ? 1 : 0,
    transform: `scale(${visible ? 1 : 0.8})`,
    transition: 'all 200ms ease-out',
    userSelect: 'none',
    pointerEvents: 'none',
    whiteSpace: 'nowrap'
  };

  return (
    <div style={badgeStyle}>
      {distance.toFixed(2)}{unit}
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Shows formatted distance
- [ ] Smooth fade-in animation
- [ ] Consistent styling with design
- [ ] Handles different units

### Task 2.4: Add Animation System
**Time**: 6 hours
**File**: `app/src/hooks/useAlignmentAnimation.ts`

```typescript
import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/three';

export const useAlignmentAnimation = (visible: boolean) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const springs = useSpring({
    opacity: visible ? 0.8 : 0,
    scale: visible ? 1 : 0.9,
    config: {
      duration: 200,
      tension: 280,
      friction: 20
    }
  });

  useEffect(() => {
    if (!visible) {
      // Clear guides after delay
      timeoutRef.current = setTimeout(() => {
        // Clear from store
      }, 500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  return springs;
};
```

**Acceptance Criteria**:
- [ ] Smooth fade in/out
- [ ] No jarring transitions
- [ ] Cleans up properly
- [ ] Performance optimized

### Task 2.5: Integrate with SceneManager
**Time**: 4 hours
**File**: `app/src/components/Scene/SceneManager.tsx`

```typescript
// Add to SceneManager render
<Canvas>
  {/* Existing components */}
  <DrawingCanvas />
  <ShapeRenderer />

  {/* Add alignment guides layer */}
  <AlignmentGuides />

  {/* Other components */}
</Canvas>
```

**Acceptance Criteria**:
- [ ] Guides render in correct layer order
- [ ] No z-fighting with shapes
- [ ] Responsive to camera changes
- [ ] Integrates smoothly

### Task 2.6: Create Visual Tests
**Time**: 6 hours
**File**: `app/src/__tests__/components/AlignmentGuides.test.tsx`

```typescript
import { render } from '@testing-library/react';
import { AlignmentGuides } from '../../components/Scene/AlignmentGuides';

describe('AlignmentGuides Visual', () => {
  it('should render guides when present in store', () => {
    // Set up store with guides
    const { container } = render(<AlignmentGuides />);

    expect(container.querySelector('[name="alignment-guides"]')).toBeTruthy();
  });

  it('should position badges correctly', () => {
    // Test badge positioning logic
  });

  it('should apply correct styling', () => {
    // Test visual properties
  });
});
```

**Acceptance Criteria**:
- [ ] Visual regression tests pass
- [ ] Component renders correctly
- [ ] Animations tested
- [ ] Mobile responsiveness verified

### Task 2.7: Mobile Optimization
**Time**: 6 hours
**File**: Multiple files

```typescript
// Add touch-specific handling
const getTouchThreshold = (zoomLevel: number): number => {
  const baseThreshold = 0.5;
  const touchMultiplier = 1.5;
  const zoomFactor = Math.max(1, 2 - zoomLevel);

  return baseThreshold * touchMultiplier * zoomFactor;
};
```

**Acceptance Criteria**:
- [ ] Larger touch targets on mobile
- [ ] Adaptive thresholds
- [ ] Smooth on touch devices
- [ ] Tested on iOS/Android

## Week 3: Integration (40 hours)

### Task 3.1: Integrate with DrawingCanvas
**Time**: 8 hours
**File**: `app/src/components/Scene/DrawingCanvas.tsx`

```typescript
// Add to handlePointerMove
const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
  if (!isDragging || !selectedShape) return;

  // Get nearby shapes using spatial index
  const nearbyShapes = spatialIndex.getNearby(selectedShape, 10);

  // Detect alignments
  const alignmentResult = alignmentService.detectAlignments(
    selectedShape,
    nearbyShapes,
    snapEnabled ? snapThreshold : 0
  );

  // Update store with guides
  setGuides(alignmentResult.guides);
  setMeasurements(alignmentResult.measurements);

  // Apply snapping if enabled
  if (snapEnabled && alignmentResult.hasSnap) {
    const snapPos = alignmentService.getSnapPosition(
      selectedShape,
      alignmentResult.guides
    );

    // Smooth snap animation
    const currentPos = selectedShape.position;
    const lerpedPos = currentPos.lerp(snapPos, 0.3);

    updateShapePosition(selectedShape.id, lerpedPos);
  }
};
```

**Acceptance Criteria**:
- [ ] Guides appear during drag
- [ ] Snapping works smoothly
- [ ] No performance impact
- [ ] Clears guides after drag

### Task 3.2: Implement Smart Snapping
**Time**: 6 hours
**File**: `app/src/services/AlignmentGuideService.ts`

```typescript
getSnapPosition(
  shape: Shape,
  guides: AlignmentGuide[]
): Vector3 {
  if (guides.length === 0) {
    return shape.position.clone();
  }

  // Sort by priority and strength
  const sortedGuides = guides.sort((a, b) => {
    const priorityA = this.getTypePriority(a.type);
    const priorityB = this.getTypePriority(b.type);

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    return b.strength - a.strength;
  });

  // Apply strongest alignment
  const strongestGuide = sortedGuides[0];
  return this.calculateSnapFromGuide(shape, strongestGuide);
}
```

**Acceptance Criteria**:
- [ ] Respects priority settings
- [ ] Smooth snap transition
- [ ] Multiple alignment handling
- [ ] Predictable behavior

### Task 3.3: Update Alignment Controls
**Time**: 6 hours
**File**: `app/src/components/UI/AlignmentControls.tsx`

```typescript
// Add distribution controls
const AlignmentControls: React.FC = () => {
  const { selectedShapes } = useAppStore();
  const { distributeShapes, alignShapes } = useAlignmentService();

  const handleDistributeHorizontally = () => {
    const distributed = distributeShapes(selectedShapes, 'horizontal');
    updateShapes(distributed);
  };

  const handleDistributeVertically = () => {
    const distributed = distributeShapes(selectedShapes, 'vertical');
    updateShapes(distributed);
  };

  return (
    <div style={panelStyle}>
      <h3 style={headerStyle}>Alignment</h3>

      {/* Existing alignment buttons */}

      <div style={sectionStyle}>
        <h4 style={subheaderStyle}>Distribute</h4>
        <button
          onClick={handleDistributeHorizontally}
          style={buttonStyle}
        >
          Horizontal
        </button>
        <button
          onClick={handleDistributeVertically}
          style={buttonStyle}
        >
          Vertical
        </button>
      </div>

      <div style={sectionStyle}>
        <h4 style={subheaderStyle}>Snap Settings</h4>
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={snapEnabled}
            onChange={(e) => setSnapEnabled(e.target.checked)}
          />
          Enable Snapping
        </label>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={snapThreshold}
          onChange={(e) => setSnapThreshold(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Distribution works correctly
- [ ] Settings persist
- [ ] UI matches design system
- [ ] Responsive layout

### Task 3.4: Implement Distribution Algorithm
**Time**: 8 hours
**File**: `app/src/services/AlignmentGuideService.ts`

```typescript
distributeShapes(
  shapes: Shape[],
  direction: 'horizontal' | 'vertical'
): Shape[] {
  if (shapes.length < 3) return shapes;

  // Sort shapes by position
  const sorted = [...shapes].sort((a, b) => {
    if (direction === 'horizontal') {
      return a.position.x - b.position.x;
    }
    return a.position.z - b.position.z;
  });

  // Calculate total span
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan = direction === 'horizontal'
    ? last.position.x - first.position.x
    : last.position.z - first.position.z;

  // Calculate equal spacing
  const spacing = totalSpan / (shapes.length - 1);

  // Update positions
  return sorted.map((shape, index) => {
    const newPos = shape.position.clone();

    if (direction === 'horizontal') {
      newPos.x = first.position.x + (spacing * index);
    } else {
      newPos.z = first.position.z + (spacing * index);
    }

    return {
      ...shape,
      position: newPos
    };
  });
}
```

**Acceptance Criteria**:
- [ ] Equal spacing calculation correct
- [ ] Preserves first/last positions
- [ ] Works with different shape sizes
- [ ] Handles edge cases

### Task 3.5: Add Persistent Guidelines
**Time**: 6 hours
**File**: `app/src/components/UI/GuidelineManager.tsx`

```typescript
interface PersistentGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  locked: boolean;
  visible: boolean;
}

const GuidelineManager: React.FC = () => {
  const [guides, setGuides] = useState<PersistentGuide[]>([]);

  const addGuideline = (type: 'horizontal' | 'vertical') => {
    const newGuide: PersistentGuide = {
      id: generateId(),
      type,
      position: 0,
      locked: false,
      visible: true
    };

    setGuides([...guides, newGuide]);
  };

  return (
    <div style={managerStyle}>
      {/* UI for managing guidelines */}
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Can add/remove guidelines
- [ ] Guidelines persist during session
- [ ] Lock/unlock functionality
- [ ] Visual editing of position

### Task 3.6: Performance Optimization
**Time**: 6 hours
**File**: Multiple files

```typescript
// Add debouncing to guide calculation
const debouncedDetectAlignments = useMemo(
  () => debounce((shape, shapes, threshold) => {
    const result = alignmentService.detectAlignments(shape, shapes, threshold);
    setGuides(result.guides);
    setMeasurements(result.measurements);
  }, 16),
  []
);
```

**Acceptance Criteria**:
- [ ] Maintains 60fps
- [ ] No memory leaks
- [ ] Efficient with 100+ shapes
- [ ] Profiled and optimized

## Week 4: Polish & Testing (40 hours)

### Task 4.1: Comprehensive Integration Tests
**Time**: 8 hours
**File**: `app/src/__tests__/integration/AlignmentSystem.test.tsx`

```typescript
describe('Alignment System Integration', () => {
  it('should show guides during shape drag', async () => {
    const { container } = renderScene();

    // Create shapes
    const shape1 = createShape({ x: 0, z: 0 });
    const shape2 = createShape({ x: 5, z: 0 });

    // Start dragging shape1
    fireEvent.pointerDown(shape1);
    fireEvent.pointerMove(shape1, { x: 4.8, z: 0 });

    // Check for guides
    await waitFor(() => {
      expect(container.querySelector('.alignment-guide')).toBeTruthy();
    });

    // Check snapping occurred
    expect(shape1.position.x).toBeCloseTo(5, 1);
  });
});
```

**Acceptance Criteria**:
- [ ] All user flows tested
- [ ] Edge cases covered
- [ ] Performance validated
- [ ] Mobile scenarios tested

### Task 4.2: Performance Profiling
**Time**: 6 hours
**File**: `app/src/__tests__/performance/AlignmentPerformance.test.ts`

```typescript
describe('Alignment Performance', () => {
  it('should maintain 60fps with 100 shapes', () => {
    const shapes = createManyShapes(100);
    const frameTimings: number[] = [];

    // Simulate drag operation
    for (let i = 0; i < 60; i++) {
      const start = performance.now();

      // Perform alignment detection
      alignmentService.detectAlignments(shapes[0], shapes.slice(1), 0.5);

      const end = performance.now();
      frameTimings.push(end - start);
    }

    const averageFrameTime = frameTimings.reduce((a, b) => a + b) / frameTimings.length;
    expect(averageFrameTime).toBeLessThan(16.67); // 60fps = 16.67ms per frame
  });
});
```

**Acceptance Criteria**:
- [ ] Performance benchmarks met
- [ ] Memory usage acceptable
- [ ] No performance regressions
- [ ] Optimization opportunities identified

### Task 4.3: Accessibility Implementation
**Time**: 6 hours
**File**: Multiple files

```typescript
// Add ARIA labels and keyboard support
const AlignmentGuide: React.FC = () => {
  return (
    <div
      role="presentation"
      aria-label="Alignment guide"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Guide content */}
    </div>
  );
};

// Announce alignments to screen readers
const announceAlignment = (type: AlignmentType) => {
  const announcement = `Shape aligned to ${type}`;
  announceToScreenReader(announcement);
};
```

**Acceptance Criteria**:
- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] High contrast mode support
- [ ] WCAG 2.1 AA compliant

### Task 4.4: Documentation
**Time**: 4 hours
**Files**: `docs/features/alignment-guides.md`

```markdown
# Alignment Guides User Guide

## Overview
The Smart Alignment Guide System provides visual feedback...

## Features
- Real-time alignment detection
- Spacing measurements
- Smart snapping
- Distribution tools

## Usage
1. Enable guides in settings
2. Drag shapes to see alignments
3. Shapes snap when close to alignment

## Keyboard Shortcuts
- `G` - Toggle guides
- `Shift` - Disable snapping temporarily
- `Alt` - Show all guides
```

**Acceptance Criteria**:
- [ ] User documentation complete
- [ ] API documentation
- [ ] Code comments added
- [ ] Examples provided

### Task 4.5: Bug Fixes and Polish
**Time**: 8 hours
**File**: Various

Common issues to address:
- Guide flickering during rapid movement
- Spacing badges overlapping
- Snapping too aggressive/weak
- Performance degradation over time
- Mobile touch accuracy

**Acceptance Criteria**:
- [ ] All known bugs fixed
- [ ] Smooth user experience
- [ ] Edge cases handled
- [ ] Final testing passed

### Task 4.6: Feature Flag and Rollout
**Time**: 4 hours
**File**: `app/src/config/features.ts`

```typescript
export const FEATURES = {
  SMART_ALIGNMENT_GUIDES: {
    enabled: process.env.ENABLE_ALIGNMENT_GUIDES === 'true',
    rolloutPercentage: 10,
    testGroup: 'beta'
  }
};

// Usage in component
if (FEATURES.SMART_ALIGNMENT_GUIDES.enabled) {
  return <AlignmentGuides />;
}
```

**Acceptance Criteria**:
- [ ] Feature flag implemented
- [ ] Gradual rollout configured
- [ ] A/B testing setup
- [ ] Metrics tracking enabled

### Task 4.7: Final Review and Demo
**Time**: 4 hours

Preparation:
- Demo script prepared
- Test scenarios documented
- Performance metrics collected
- User feedback incorporated

**Acceptance Criteria**:
- [ ] Stakeholder demo successful
- [ ] Acceptance criteria met
- [ ] Ready for production
- [ ] Documentation complete

## Summary

### Total Time Breakdown
- Week 1 (Infrastructure): 40 hours
- Week 2 (Visual Components): 40 hours
- Week 3 (Integration): 40 hours
- Week 4 (Polish & Testing): 40 hours
- **Total**: 160 hours (4 weeks)

### Deliverables Checklist
- [ ] AlignmentGuideService implemented
- [ ] Visual components created
- [ ] Integration complete
- [ ] Testing comprehensive
- [ ] Documentation written
- [ ] Performance optimized
- [ ] Accessibility compliant
- [ ] Mobile optimized
- [ ] Feature flag ready
- [ ] Production ready

### Definition of Done
- Code review approved
- All tests passing (70% coverage)
- Performance benchmarks met
- Documentation complete
- Accessibility validated
- Mobile tested
- No critical bugs
- Stakeholder sign-off

### Risk Management
- **If behind schedule**: Focus on core features, defer persistent guides
- **If performance issues**: Implement progressive enhancement
- **If UX concerns**: A/B test different thresholds
- **If bugs found**: Hotfix process ready

---

*This task breakdown is a living document and will be updated as implementation progresses.*