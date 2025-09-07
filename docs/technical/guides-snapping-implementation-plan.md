# CAD/Canva-Style Guides & Snapping Implementation Plan
## Land Visualizer Professional Enhancement

**Version**: 1.0  
**Date**: January 2025  
**Status**: Planning Phase  
**Author**: Technical Architecture Team  
**Review Status**: 🔄 Pending Review

---

## 📋 Executive Summary

This document outlines the implementation plan for adding professional CAD-style snapping and Canva-style visual guides to the Land Visualizer application. The system will enhance precision and user experience while maintaining the application's modern, approachable design philosophy.

### Key Objectives
- ✨ Implement smart alignment guides (Canva-style)
- 🧲 Add professional snapping system (CAD-style)
- 📏 Create ruler and measurement overlay
- 🎯 Maintain 60 FPS performance
- 🔄 Seamlessly integrate with existing features

---

## 🔍 Research Findings

### Analyzed Repositories
| Project | Key Features | Technology | Relevance |
|---------|-------------|------------|-----------|
| **[OpenWebCAD](https://github.com/bertyhell/openwebcad)** | Professional CAD snapping, endpoints, midpoints | React, Canvas | ⭐⭐⭐⭐⭐ |
| **[SnappyRect](https://github.com/dinesh-rawat-dev/fabricjs-prodeasy-snappy-rect)** | Smart guides for Fabric.js | Fabric.js | ⭐⭐⭐⭐ |
| **[Tldraw](https://github.com/tldraw/tldraw)** | Velocity-based snapping, custom geometries | React, Canvas | ⭐⭐⭐⭐⭐ |
| **[Excalidraw](https://github.com/excalidraw/excalidraw)** | Hand-drawn aesthetic, discussing snapping | React, Canvas | ⭐⭐⭐ |
| **[Polotno](https://polotno.com)** | Professional ruler system | Konva.js | ⭐⭐⭐⭐ |
| **[React Design Editor](https://github.com/salgum1114/react-design-editor)** | Complete Fabric.js implementation | React, Fabric.js | ⭐⭐⭐⭐ |

### Key Insights
1. **Tldraw** has the most mature snapping implementation with customizable geometries
2. **Fabric.js** requires custom extensions for snapping (no built-in support)
3. **Konva.js** has native snapping support out-of-the-box
4. Most implementations use **spatial indexing** for performance
5. **Visual feedback** is critical for user experience

---

## 🏗️ System Architecture

### Component Structure
```
src/components/Scene/
├── 📁 SnapSystem/                    # Snapping Engine
│   ├── SnapEngine.tsx               # Core snapping logic & calculations
│   ├── SnapPointDetector.tsx        # Detects available snap points
│   ├── SnapIndicator.tsx            # Visual feedback for active snaps
│   └── SnapSettings.tsx             # User configuration panel
│
├── 📁 Guides/                        # Guide System
│   ├── GuideManager.tsx             # Central guide management
│   ├── AlignmentGuides.tsx          # Dynamic alignment detection
│   ├── StaticGuides.tsx             # User-created persistent guides
│   ├── GuideRenderer.tsx            # Three.js guide visualization
│   └── GuideControls.tsx            # UI for guide manipulation
│
├── 📁 Rulers/                        # Measurement System
│   ├── RulerOverlay.tsx             # Main ruler component
│   ├── RulerTicks.tsx               # Tick marks and labels
│   ├── RulerMarkers.tsx             # Current position indicators
│   ├── MeasurementDisplay.tsx       # Coordinate readout
│   └── UnitConverter.tsx            # Metric/Imperial conversion
│
└── 📁 Grid/                          # Grid System
    ├── GridOverlay.tsx               # Visual grid rendering
    ├── GridSettings.tsx              # Grid configuration
    └── GridSnapping.tsx              # Grid-based snap logic
```

### Service Architecture
```typescript
// src/services/snapping/
├── snapService.ts                    // Main snapping service
├── snapGeometry.ts                   // Geometric calculations
├── snapSpatialIndex.ts              // Spatial data structure
└── snapTypes.ts                      // TypeScript definitions

// src/services/guides/
├── guideService.ts                   // Guide management
├── guideDetection.ts                 // Alignment detection algorithms
├── guideStorage.ts                   // Persistent guide storage
└── guideTypes.ts                     // TypeScript definitions
```

---

## 🎯 Feature Specifications

### 1. Smart Guides (Canva-Style)

#### Visual Design
```typescript
interface GuideStyle {
  alignmentColor: '#FF00FF';      // Pink/Purple
  alignmentWidth: 2;               // pixels
  alignmentOpacity: 0.8;           
  fadeInDuration: 200;             // ms
  fadeOutDelay: 500;               // ms after snap released
  dashPattern: [5, 5];             // Dashed line pattern
}
```

#### Detection Triggers
- **Center Alignment**: Horizontal and vertical center matching
- **Edge Alignment**: Top, bottom, left, right edge matching
- **Equal Spacing**: Detect equal distances between 3+ objects
- **Margin Matching**: Same distance from container edges

#### Implementation Priority
1. ✅ Center alignment guides
2. ✅ Edge alignment guides
3. ⏳ Equal spacing detection
4. ⏳ Smart distribution guides

---

### 2. Snapping System (CAD-Style)

#### Snap Point Types
| Type | Description | Symbol | Priority |
|------|-------------|---------|----------|
| **Grid** | Snap to grid intersections | ⊞ | High |
| **Endpoint** | Shape corners | ● | High |
| **Midpoint** | Edge centers | ◐ | Medium |
| **Center** | Shape center | ⊕ | Medium |
| **Intersection** | Line/shape crossings | × | Low |
| **Perpendicular** | 90° angles | ⊥ | Low |
| **Tangent** | Circle touch points | ⊙ | Low |
| **Nearest** | Closest point on edge | ◦ | Low |

#### Snap Configuration
```typescript
interface SnapConfig {
  enabled: boolean;
  threshold: 10;                    // pixels
  magnetStrength: 0.8;              // 0-1 attraction force
  gridSize: 25;                     // pixels
  snapTypes: {
    grid: true,
    endpoint: true,
    midpoint: true,
    center: true,
    intersection: false,
    perpendicular: false,
    tangent: false,
    nearest: false
  };
  modifierKeys: {
    temporary_disable: 'Shift',     // Hold to disable
    show_all_points: 'Alt',         // Hold to visualize
    cycle_snap_types: 'Tab'         // Cycle through types
  };
}
```

#### Snap Detection Algorithm
```typescript
class SnapEngine {
  detectSnapPoints(movingShape: Shape, viewport: Viewport): SnapPoint[] {
    const candidates: SnapPoint[] = [];
    const threshold = this.config.threshold * viewport.zoomLevel;
    
    // 1. Use spatial index for efficient proximity search
    const nearbyShapes = this.spatialIndex.query(
      movingShape.bounds.expand(threshold)
    );
    
    // 2. Check each snap type in priority order
    for (const shape of nearbyShapes) {
      if (this.config.snapTypes.endpoint) {
        candidates.push(...this.getEndpoints(shape));
      }
      if (this.config.snapTypes.midpoint) {
        candidates.push(...this.getMidpoints(shape));
      }
      // ... other snap types
    }
    
    // 3. Calculate distances and strengths
    return candidates
      .map(point => ({
        ...point,
        distance: this.calculateDistance(movingShape, point),
        strength: this.calculateMagnetStrength(distance, threshold)
      }))
      .filter(p => p.distance < threshold)
      .sort((a, b) => b.strength - a.strength);
  }
}
```

---

### 3. Ruler System

#### Features
- **Persistent Rulers**: Always visible on top and left edges
- **Dynamic Markers**: Follow cursor position
- **Click-to-Add Guides**: Create guides by clicking on ruler
- **Unit Display**: Toggle between pixels, meters, feet
- **Zoom-Aware**: Scale adjusts with viewport zoom

#### Visual Specifications
```typescript
interface RulerStyle {
  backgroundColor: '#F5F5F5';
  borderColor: '#CCCCCC';
  tickColor: '#666666';
  textColor: '#333333';
  markerColor: '#00C4CC';
  guideIndicatorColor: '#FF00FF';
  
  dimensions: {
    width: 30;                      // pixels
    majorTickLength: 10;           // pixels
    minorTickLength: 5;            // pixels
    fontSize: 11;                  // pixels
  };
  
  intervals: {
    majorTickEvery: 100;            // units
    minorTickEvery: 10;            // units
    labelEvery: 100;                // units
  };
}
```

---

## 🔄 Integration with Existing Systems

### Compatibility Matrix
| Existing Feature | Integration Approach | Priority |
|-----------------|---------------------|----------|
| **Rotation System** | Snap to 15° increments during rotation | High |
| **Resize System** | Snap to grid sizes, aspect ratios | High |
| **Drawing Tools** | Snap while creating new shapes | High |
| **Corner Editing** | Snap corner positions to guides | Medium |
| **Pan/Zoom** | Update ruler scales, maintain guide positions | Medium |
| **Undo/Redo** | Track guide creation/deletion | Low |

### State Management Updates
```typescript
// Additions to useAppStore.ts
interface AppStore {
  // Existing state...
  
  // New snapping state
  snapSettings: SnapConfig;
  activeSnapPoints: SnapPoint[];
  snapEnabled: boolean;
  
  // Guide state
  guides: {
    horizontal: Guide[];
    vertical: Guide[];
    active: Guide | null;
  };
  guideSettings: GuideConfig;
  showGuides: boolean;
  
  // Ruler state
  rulerSettings: RulerConfig;
  showRulers: boolean;
  rulerUnit: 'px' | 'm' | 'ft';
  
  // Grid state
  gridSettings: GridConfig;
  showGrid: boolean;
  
  // Actions
  toggleSnapping: () => void;
  updateSnapSettings: (settings: Partial<SnapConfig>) => void;
  addGuide: (guide: Guide) => void;
  removeGuide: (id: string) => void;
  clearGuides: () => void;
  toggleRulers: () => void;
  toggleGrid: () => void;
}
```

---

## 📊 Implementation Phases

### Phase 1: Grid System (Week 1)
**Goal**: Basic grid snapping foundation

#### Tasks
- [ ] Create GridOverlay component with Three.js
- [ ] Implement configurable grid spacing
- [ ] Add grid snapping logic (round to nearest)
- [ ] Create grid toggle UI button
- [ ] Add grid settings panel
- [ ] Write unit tests for grid snapping

#### Success Criteria
- Grid visible at all zoom levels
- Smooth snapping to grid points
- Performance: <1ms snap calculation
- Settings persist across sessions

---

### Phase 2: Object Snapping (Week 2)
**Goal**: Snap to shape features

#### Tasks
- [ ] Implement spatial indexing system
- [ ] Create snap point detection for shapes
- [ ] Add visual snap indicators
- [ ] Implement snap priority system
- [ ] Create snap type toggle controls
- [ ] Performance optimization for many shapes

#### Success Criteria
- Detect all major snap points
- Clear visual feedback
- <5ms detection for 100 shapes
- Smooth interaction at 60 FPS

---

### Phase 3: Smart Guides (Week 3)
**Goal**: Dynamic alignment guides

#### Tasks
- [ ] Create alignment detection algorithm
- [ ] Implement guide rendering with Three.js
- [ ] Add fade in/out animations
- [ ] Create equal spacing detection
- [ ] Add smart distribution logic
- [ ] Optimize guide calculations

#### Success Criteria
- Instant guide appearance (<16ms)
- Smooth animations
- Accurate alignment detection
- No performance impact

---

### Phase 4: Ruler System (Week 4)
**Goal**: Professional measurement tools

#### Tasks
- [ ] Create ruler overlay components
- [ ] Implement zoom-aware scaling
- [ ] Add click-to-create guides
- [ ] Create position markers
- [ ] Add unit conversion system
- [ ] Implement ruler settings

#### Success Criteria
- Accurate measurements
- Responsive to zoom/pan
- Easy guide creation
- Clear visual hierarchy

---

## 🚀 Performance Optimization

### Strategies
1. **Spatial Indexing**: Use R-tree or quadtree for O(log n) proximity queries
2. **Viewport Culling**: Only process visible shapes
3. **Level of Detail**: Reduce snap points at low zoom levels
4. **Debouncing**: Throttle calculations during rapid movement
5. **Web Workers**: Offload heavy calculations to background threads
6. **Caching**: Store frequently accessed snap points

### Performance Targets
| Metric | Target | Critical |
|--------|--------|----------|
| Snap calculation | <5ms | <10ms |
| Guide detection | <10ms | <20ms |
| Render update | <16ms (60 FPS) | <33ms (30 FPS) |
| Memory usage | <50MB | <100MB |
| Initial load | <100ms | <200ms |

---

## 🎨 User Interface Design

### Control Panel Layout
```
┌─────────────────────────┐
│ 🎯 Snapping & Guides    │
├─────────────────────────┤
│ ☐ Enable Snapping   [S] │
│ ☐ Show Grid        [G] │
│ ☐ Show Rulers      [R] │
│ ☐ Show Guides      [H] │
├─────────────────────────┤
│ Snap Settings      ⚙️   │
│ ├─ Threshold: [10px] ▼  │
│ ├─ Grid Size: [25px] ▼  │
│ └─ Snap Types:          │
│     ☑ Grid              │
│     ☑ Corners           │
│     ☑ Midpoints         │
│     ☐ Intersections     │
├─────────────────────────┤
│ Guide Settings     ⚙️   │
│ ├─ Color: [#FF00FF] 🎨  │
│ └─ Clear All Guides 🗑️  │
└─────────────────────────┘
```

### Keyboard Shortcuts
| Key | Action | Context |
|-----|--------|---------|
| `S` | Toggle snapping | Global |
| `G` | Toggle grid | Global |
| `R` | Toggle rulers | Global |
| `H` | Toggle guides | Global |
| `Shift` (hold) | Disable snapping | During drag |
| `Alt` (hold) | Show all snap points | During drag |
| `Ctrl+;` | Add horizontal guide | At cursor |
| `Ctrl+'` | Add vertical guide | At cursor |
| `Delete` | Remove selected guide | Guide selected |
| `Ctrl+Alt+G` | Clear all guides | Global |

---

## 🧪 Testing Strategy

### Unit Tests
- Snap point detection algorithms
- Guide alignment calculations
- Spatial indexing operations
- Grid snapping mathematics
- Unit conversion accuracy

### Integration Tests
- Snapping during shape creation
- Guide persistence across sessions
- Ruler interaction with zoom/pan
- Performance with multiple shapes
- State management updates

### E2E Tests
- Complete drawing workflow with snapping
- Guide creation and deletion
- Settings persistence
- Keyboard shortcut functionality
- Cross-browser compatibility

### Performance Tests
- Stress test with 1000+ shapes
- Rapid movement snap detection
- Memory leak detection
- Frame rate monitoring
- Load time benchmarks

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance degradation with many shapes | High | Medium | Implement spatial indexing, viewport culling |
| Complex integration with existing systems | High | Medium | Phased rollout, extensive testing |
| Three.js rendering conflicts | Medium | Low | Use separate render layer, careful z-ordering |
| Browser compatibility issues | Medium | Low | Progressive enhancement, fallbacks |
| User confusion with many options | Low | Medium | Smart defaults, progressive disclosure |

---

## 🎯 Alignment Guides Implementation Strategy

### Research-Based Insights
Based on comprehensive research of leading implementations:

1. **react-alignment-guides** (Rocketium) - Complete reference for 2D draggable elements with smart guides
2. **Konva.js** - Mature snapping with edge detection and visual guide lines
3. **Fabric.js** - Custom extensions required (no built-in support)
4. **Figma/Canva** - WebGL-based, pink/purple alignment lines for visual clarity

### Core Architecture

#### Alignment Detection Service
```typescript
// src/services/alignmentService.ts
interface AlignmentGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number; // x or y coordinate
  sourceShapeId: string;
  targetShapeId: string;
  alignmentType: 'center' | 'edge-start' | 'edge-end' | 'equal-spacing';
  strength: number; // 0-1 for magnetic pull
}

class AlignmentService {
  private readonly THRESHOLD = 5; // pixels for alignment detection
  private boundsCache = new Map<string, Bounds>();
  private spatialIndex: RTree; // For performance
  
  detectAlignments(movingShape: Shape, staticShapes: Shape[]): AlignmentGuide[] {
    const guides: AlignmentGuide[] = [];
    const movingBounds = this.getShapeBounds(movingShape);
    
    // Use spatial index for efficient proximity queries
    const nearbyShapes = this.spatialIndex.search(
      movingBounds.expand(this.THRESHOLD)
    );
    
    nearbyShapes.forEach(targetShape => {
      const targetBounds = this.getShapeBounds(targetShape);
      
      // Check all alignment types
      guides.push(...this.checkHorizontalAlignments(movingBounds, targetBounds));
      guides.push(...this.checkVerticalAlignments(movingBounds, targetBounds));
      guides.push(...this.checkEqualSpacing(movingShape, targetShape, staticShapes));
    });
    
    return this.filterStrongestGuides(guides);
  }
  
  private checkHorizontalAlignments(source: Bounds, target: Bounds): AlignmentGuide[] {
    const guides: AlignmentGuide[] = [];
    const threshold = this.THRESHOLD;
    
    // Center alignment
    if (Math.abs(source.centerY - target.centerY) < threshold) {
      guides.push({
        type: 'horizontal',
        position: target.centerY,
        alignmentType: 'center',
        strength: 1 - (Math.abs(source.centerY - target.centerY) / threshold)
      });
    }
    
    // Edge alignments
    if (Math.abs(source.top - target.top) < threshold) {
      guides.push({
        type: 'horizontal',
        position: target.top,
        alignmentType: 'edge-start',
        strength: 1 - (Math.abs(source.top - target.top) / threshold)
      });
    }
    
    if (Math.abs(source.bottom - target.bottom) < threshold) {
      guides.push({
        type: 'horizontal',
        position: target.bottom,
        alignmentType: 'edge-end',
        strength: 1 - (Math.abs(source.bottom - target.bottom) / threshold)
      });
    }
    
    return guides;
  }
}
```

#### Visual Guide Component
```typescript
// src/components/Scene/AlignmentGuides.tsx
import React, { useMemo, useEffect } from 'react';
import { Line } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { useAppStore } from '../../store/useAppStore';

export const AlignmentGuides: React.FC = () => {
  const { dragState, shapes } = useAppStore();
  const alignmentService = useMemo(() => new AlignmentService(), []);
  
  const guides = useMemo(() => {
    if (!dragState.isDragging || !dragState.draggingShapeId) return [];
    
    const movingShape = shapes.find(s => s.id === dragState.draggingShapeId);
    if (!movingShape) return [];
    
    const otherShapes = shapes.filter(s => s.id !== dragState.draggingShapeId);
    return alignmentService.detectAlignments(movingShape, otherShapes);
  }, [dragState, shapes]);
  
  return (
    <>
      {guides.map(guide => (
        <AnimatedGuideLine key={guide.id} guide={guide} />
      ))}
    </>
  );
};

const AnimatedGuideLine: React.FC<{ guide: AlignmentGuide }> = ({ guide }) => {
  // Smooth fade in/out animation
  const { opacity } = useSpring({
    opacity: 0.8,
    from: { opacity: 0 },
    config: { tension: 300, friction: 20 }
  });
  
  const points = useMemo(() => {
    if (guide.type === 'horizontal') {
      return [[-1000, 0.1, guide.position], [1000, 0.1, guide.position]];
    } else {
      return [[guide.position, 0.1, -1000], [guide.position, 0.1, 1000]];
    }
  }, [guide]);
  
  return (
    <animated.group>
      <Line
        points={points}
        color={GUIDE_STYLES[guide.alignmentType].color}
        lineWidth={2}
        dashed
        dashScale={5}
        opacity={opacity}
        renderOrder={999}
      />
    </animated.group>
  );
};
```

### Visual Design Specifications

Based on Canva/Figma research, implement these visual styles:

```typescript
const GUIDE_STYLES = {
  // Center alignment - Cyan
  center: {
    color: '#06B6D4',
    width: 2,
    opacity: 0.9,
    style: 'solid',
    priority: 1
  },
  
  // Edge alignment - Pink (Canva-style)
  'edge-start': {
    color: '#EC4899',
    width: 2,
    opacity: 0.8,
    style: 'dashed',
    dashArray: [5, 5],
    priority: 2
  },
  
  'edge-end': {
    color: '#EC4899',
    width: 2,
    opacity: 0.8,
    style: 'dashed',
    dashArray: [5, 5],
    priority: 2
  },
  
  // Equal spacing - Purple
  'equal-spacing': {
    color: '#8B5CF6',
    width: 1.5,
    opacity: 0.6,
    style: 'dotted',
    priority: 3
  }
};
```

### Magnetic Snapping Integration

```typescript
// src/hooks/useAlignmentSnapping.ts
export const useAlignmentSnapping = () => {
  const alignmentService = useMemo(() => new AlignmentService(), []);
  const { shapes } = useAppStore();
  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);
  
  const applySnapping = useCallback((
    movingShape: Shape,
    proposedPosition: Point2D
  ): { snappedPosition: Point2D; guides: AlignmentGuide[] } => {
    const tempShape = { ...movingShape, position: proposedPosition };
    const guides = alignmentService.detectAlignments(tempShape, shapes);
    
    let snappedPosition = { ...proposedPosition };
    const snapThreshold = 0.8; // Minimum strength to trigger snap
    
    // Apply horizontal snapping
    const horizontalGuide = guides.find(
      g => g.type === 'horizontal' && g.strength > snapThreshold
    );
    if (horizontalGuide) {
      const offset = this.getAlignmentOffset(movingShape, horizontalGuide);
      snappedPosition.y = horizontalGuide.position - offset.y;
    }
    
    // Apply vertical snapping
    const verticalGuide = guides.find(
      g => g.type === 'vertical' && g.strength > snapThreshold
    );
    if (verticalGuide) {
      const offset = this.getAlignmentOffset(movingShape, verticalGuide);
      snappedPosition.x = verticalGuide.position - offset.x;
    }
    
    return { snappedPosition, guides };
  }, [shapes, alignmentService]);
  
  return { applySnapping, activeGuides };
};
```

### Performance Optimizations

#### 1. Spatial Indexing with R-tree
```typescript
import RBush from 'rbush';

class SpatialIndex {
  private tree: RBush;
  
  constructor() {
    this.tree = new RBush();
  }
  
  update(shapes: Shape[]) {
    this.tree.clear();
    const items = shapes.map(shape => ({
      minX: shape.bounds.left,
      minY: shape.bounds.top,
      maxX: shape.bounds.right,
      maxY: shape.bounds.bottom,
      data: shape
    }));
    this.tree.load(items);
  }
  
  search(bounds: Bounds): Shape[] {
    return this.tree.search({
      minX: bounds.left - THRESHOLD,
      minY: bounds.top - THRESHOLD,
      maxX: bounds.right + THRESHOLD,
      maxY: bounds.bottom + THRESHOLD
    }).map(item => item.data);
  }
}
```

#### 2. Throttled Detection
```typescript
const throttledDetection = useMemo(
  () => throttle(alignmentService.detectAlignments, 16), // 60fps
  [alignmentService]
);
```

#### 3. Bounds Caching
```typescript
private boundsCache = new Map<string, { bounds: Bounds; timestamp: number }>();
private readonly CACHE_TTL = 1000; // 1 second

private getShapeBounds(shape: Shape): Bounds {
  const cached = this.boundsCache.get(shape.id);
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
    return cached.bounds;
  }
  
  const bounds = this.calculateBounds(shape);
  this.boundsCache.set(shape.id, { bounds, timestamp: Date.now() });
  return bounds;
}
```

### Implementation Roadmap

#### Phase 1: Core Services (3-4 hours)
- [ ] Create `alignmentService.ts` with detection algorithms
- [ ] Implement bounds calculation for all shape types
- [ ] Add spatial indexing for performance
- [ ] Create center, edge, and spacing detection

#### Phase 2: Visual Components (2-3 hours)
- [ ] Create `AlignmentGuides.tsx` component
- [ ] Implement Three.js line rendering
- [ ] Add fade animations with react-spring
- [ ] Style guides based on alignment type

#### Phase 3: Integration (2-3 hours)
- [ ] Modify drag handlers in `ShapeRenderer.tsx`
- [ ] Integrate magnetic snapping
- [ ] Update store with active guides
- [ ] Handle guide lifecycle (show/hide)

#### Phase 4: UI Controls (1-2 hours)
- [ ] Add alignment toggle in Tools ribbon
- [ ] Add sensitivity slider
- [ ] Add guide color customization
- [ ] Add keyboard shortcuts

### Testing Strategy

```typescript
// src/services/__tests__/alignmentService.test.ts
describe('AlignmentService', () => {
  let service: AlignmentService;
  
  beforeEach(() => {
    service = new AlignmentService();
  });
  
  describe('Horizontal Alignments', () => {
    it('should detect center alignment within threshold', () => {
      const shape1 = createRectangle(0, 0, 100, 50);
      const shape2 = createRectangle(150, 0, 100, 50);
      
      const guides = service.detectAlignments(shape1, [shape2]);
      
      expect(guides).toContainEqual(
        expect.objectContaining({
          type: 'horizontal',
          alignmentType: 'center',
          position: 25,
          strength: expect.any(Number)
        })
      );
    });
    
    it('should detect edge alignments', () => {
      const shape1 = createRectangle(0, 0, 100, 50);
      const shape2 = createRectangle(150, 0, 100, 50);
      
      const guides = service.detectAlignments(shape1, [shape2]);
      
      // Should detect top edge alignment
      expect(guides).toContainEqual(
        expect.objectContaining({
          type: 'horizontal',
          alignmentType: 'edge-start',
          position: 0
        })
      );
      
      // Should detect bottom edge alignment
      expect(guides).toContainEqual(
        expect.objectContaining({
          type: 'horizontal',
          alignmentType: 'edge-end',
          position: 50
        })
      );
    });
  });
  
  describe('Equal Spacing', () => {
    it('should detect equal spacing between three shapes', () => {
      const shape1 = createRectangle(0, 0, 50, 50);
      const shape2 = createRectangle(100, 0, 50, 50);
      const shape3 = createRectangle(200, 0, 50, 50);
      
      const guides = service.detectAlignments(shape2, [shape1, shape3]);
      
      expect(guides).toContainEqual(
        expect.objectContaining({
          alignmentType: 'equal-spacing'
        })
      );
    });
  });
  
  describe('Performance', () => {
    it('should handle 100+ shapes efficiently', () => {
      const shapes = Array.from({ length: 100 }, (_, i) => 
        createRectangle(i * 10, i * 10, 50, 50)
      );
      
      const start = performance.now();
      service.detectAlignments(shapes[0], shapes);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(16); // 60fps requirement
    });
  });
});
```

### Accessibility Considerations

#### Keyboard Support
- `Alt` key to preview all available alignments
- `Shift` to temporarily disable snapping
- Arrow keys for fine positioning (1px increments)

#### Visual Feedback
- High contrast guide colors
- Configurable guide thickness
- Sound feedback option for snap events

#### Screen Reader Support
- Announce alignment type when snapping occurs
- Provide textual feedback for guide positions

### Integration with Existing Features

#### Compatibility Matrix
| Feature | Impact | Integration Approach |
|---------|--------|---------------------|
| Grid Snapping | Low | Complementary - guides have priority |
| Shape Rotation | Medium | Calculate rotated bounds for alignment |
| Edit Mode | Low | Disable during corner editing |
| Multi-select | High | Show guides for selection bounds |
| Undo/Redo | Medium | Track guide state in history |

#### Migration Strategy
1. **Phase 1**: Basic edge and center alignment
2. **Phase 2**: Equal spacing detection
3. **Phase 3**: Smart distribution guides
4. **Phase 4**: Advanced CAD alignments

---

## 📝 Open Questions

1. **Should snapping be enabled by default?**
   - Pros: Immediate precision benefit
   - Cons: May surprise existing users
   - Recommendation: Default OFF with prominent toggle

2. **How many snap types should be enabled initially?**
   - Too many: Overwhelming, performance impact
   - Too few: Limited usefulness
   - Recommendation: Grid, corners, midpoints only

3. **Should guides persist between sessions?**
   - Pros: Workflow continuity
   - Cons: Storage requirements, potential confusion
   - Recommendation: Optional with clear save/load

4. **Integration with future Chili3D precision mode?**
   - Consider: API compatibility
   - Plan for: Enhanced snap precision
   - Recommendation: Abstract snap calculations

5. **Mobile/touch support priority?**
   - Current: Desktop-first approach
   - Consider: Touch gestures for snapping
   - Recommendation: Phase 2 enhancement

---

## ✅ Acceptance Criteria

### Minimum Viable Product (MVP)
- [ ] Grid snapping functional
- [ ] Basic object snapping (corners, centers)
- [ ] Visual snap indicators
- [ ] Toggle controls in UI
- [ ] 60 FPS performance maintained
- [ ] No breaking changes to existing features

### Full Implementation
- [ ] All snap types implemented
- [ ] Smart guides fully functional
- [ ] Ruler system complete
- [ ] Keyboard shortcuts working
- [ ] Settings persistence
- [ ] Comprehensive test coverage
- [ ] Documentation complete
- [ ] Performance optimized

---

## 📚 References

### Technical Resources
- [Three.js Line Rendering](https://threejs.org/docs/#api/en/objects/Line)
- [Spatial Indexing with R-trees](https://github.com/mourner/rbush)
- [Fabric.js Snapping Examples](http://fabricjs.com/events)
- [Konva.js Snapping Demo](https://konvajs.org/docs/sandbox/Objects_Snapping.html)

### Design Inspiration
- [Canva Editor](https://www.canva.com) - Guide system
- [Adobe Illustrator](https://www.adobe.com/products/illustrator.html) - Smart Guides
- [Figma](https://www.figma.com) - Snapping behavior
- [AutoCAD Web](https://web.autocad.com) - CAD snapping

### Implementation Examples
- [OpenWebCAD Source](https://github.com/bertyhell/openwebcad)
- [Tldraw Snapping](https://github.com/tldraw/tldraw/tree/main/packages/tldraw/src/lib/shapes)
- [Excalidraw Discussions](https://github.com/excalidraw/excalidraw/issues/6135)

---

## 🤝 Approval & Sign-off

### Stakeholders
- [ ] **Technical Lead**: Architecture approval
- [ ] **UX Designer**: Interface design approval
- [ ] **Product Owner**: Feature scope approval
- [ ] **QA Lead**: Testing strategy approval

### Next Steps
1. Review and refine this plan
2. Approve implementation phases
3. Assign development resources
4. Begin Phase 1 implementation
5. Set up progress tracking

---

**Document Status**: 🔄 Ready for Review  
**Last Updated**: January 2025  
**Next Review**: Before Phase 1 start