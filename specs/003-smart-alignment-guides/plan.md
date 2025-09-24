# Implementation Plan: Smart Alignment Guide System

**Specification ID**: 003
**Feature Name**: Smart Alignment Guide System
**Created**: September 2025
**Estimated Duration**: 4 weeks

## Technical Overview

### Architecture Approach

The Smart Alignment Guide System will be implemented as a modular addition to the existing 3D visualization infrastructure. The system will leverage Three.js for rendering guides, React for UI components, and Zustand for state management.

#### Key Architectural Decisions
1. **Service-based detection**: Separate alignment logic from rendering
2. **Real-time calculation**: Compute guides during pointer move events
3. **HTML/WebGL hybrid**: Use Three.js for guides, HTML for measurements
4. **Performance-first**: Spatial indexing and viewport culling
5. **Constitution compliance**: All inline styles, no CSS files

### System Components

```
┌─────────────────────────────────────────────┐
│                   User Input                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│            DrawingCanvas.tsx                 │
│         (Drag Event Handler)                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        AlignmentGuideService.ts             │
│        (Detection & Calculation)             │
└─────────┬───────────────────┬───────────────┘
          │                   │
          ▼                   ▼
┌──────────────────┐ ┌───────────────────────┐
│ useAlignmentStore│ │    Spatial Index      │
│  (State Mgmt)    │ │    (Performance)      │
└─────────┬────────┘ └───────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│         AlignmentGuides.tsx                 │
│         (Visual Rendering)                  │
├─────────────────────────────────────────────┤
│  • Guide Lines (Three.js)                   │
│  • Spacing Badges (HTML)                    │
│  • Extension Lines                          │
└─────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Create AlignmentGuideService
**File**: `app/src/services/AlignmentGuideService.ts`

```typescript
class AlignmentGuideService {
  private spatialIndex: SpatialIndex;
  private cache: Map<string, AlignmentResult>;

  detectAlignments(
    activeShape: Shape,
    shapes: Shape[],
    threshold: number
  ): AlignmentGuide[];

  calculateSpacing(shapes: Shape[]): SpacingMeasurement[];

  getSnapPosition(
    shape: Shape,
    alignments: AlignmentGuide[]
  ): Vector3;
}
```

#### 1.2 Implement Spatial Indexing
**File**: `app/src/utils/SpatialIndex.ts`

```typescript
class SpatialIndex {
  private grid: Map<string, Set<string>>;
  private cellSize: number;

  insert(shape: Shape): void;
  remove(shapeId: string): void;
  getNearby(shape: Shape, radius: number): Shape[];
  update(shape: Shape): void;
}
```

#### 1.3 Create Alignment Store
**File**: `app/src/store/useAlignmentStore.ts`

```typescript
interface AlignmentStore {
  guides: AlignmentGuide[];
  measurements: SpacingMeasurement[];
  snapEnabled: boolean;
  snapThreshold: number;

  setGuides: (guides: AlignmentGuide[]) => void;
  setMeasurements: (measurements: SpacingMeasurement[]) => void;
  updateSnapConfig: (config: SnapConfig) => void;
}
```

### Phase 2: Visual Components (Week 2)

#### 2.1 Build AlignmentGuides Component
**File**: `app/src/components/Scene/AlignmentGuides.tsx`

```typescript
const AlignmentGuides: React.FC = () => {
  const { guides, measurements } = useAlignmentStore();

  return (
    <>
      {/* Three.js guide lines */}
      {guides.map(guide => (
        <DashedLine
          key={guide.id}
          start={guide.start}
          end={guide.end}
          color="#8B5CF6"
          dashSize={5}
          gapSize={5}
        />
      ))}

      {/* HTML measurement badges */}
      <Html>
        {measurements.map(measurement => (
          <SpacingBadge
            key={measurement.id}
            position={measurement.position}
            distance={measurement.distance}
            unit={measurement.unit}
          />
        ))}
      </Html>
    </>
  );
};
```

#### 2.2 Create DashedLine Component
**File**: `app/src/components/Scene/DashedLine.tsx`

```typescript
const DashedLine: React.FC<DashedLineProps> = ({
  start,
  end,
  color,
  dashSize,
  gapSize
}) => {
  const lineRef = useRef<Line2>();

  useEffect(() => {
    // Configure Line2 with dashed material
    const material = new LineMaterial({
      color: new THREE.Color(color),
      linewidth: 2,
      dashed: true,
      dashSize,
      gapSize,
      opacity: 0.8,
      transparent: true
    });

    // Update line geometry
  }, [start, end]);

  return <line2 ref={lineRef} />;
};
```

#### 2.3 Implement Spacing Badge
**File**: `app/src/components/UI/SpacingBadge.tsx`

```typescript
const SpacingBadge: React.FC<SpacingBadgeProps> = ({
  position,
  distance,
  unit
}) => {
  const style = {
    position: 'absolute',
    background: '#8B5CF6',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontFamily: 'Nunito Sans',
    fontWeight: 600,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none' as const,
    zIndex: 1000
  };

  return (
    <div style={style}>
      {distance.toFixed(2)}{unit}
    </div>
  );
};
```

### Phase 3: Integration (Week 3)

#### 3.1 Integrate with DrawingCanvas
**Update**: `app/src/components/Scene/DrawingCanvas.tsx`

```typescript
// In handlePointerMove
const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
  // Existing drag logic...

  if (isDragging && selectedShape) {
    // Detect alignments
    const alignments = AlignmentGuideService.detectAlignments(
      selectedShape,
      shapes.filter(s => s.id !== selectedShape.id),
      snapThreshold
    );

    // Update store
    setGuides(alignments.guides);
    setMeasurements(alignments.measurements);

    // Apply snapping if enabled
    if (snapEnabled && alignments.hasSnap) {
      const snapPos = AlignmentGuideService.getSnapPosition(
        selectedShape,
        alignments
      );
      updateShapePosition(selectedShape.id, snapPos);
    }
  }
};
```

#### 3.2 Add to SceneManager
**Update**: `app/src/components/Scene/SceneManager.tsx`

```typescript
// Add AlignmentGuides to scene
<AlignmentGuides />
```

#### 3.3 Update Alignment Panel
**Update**: `app/src/components/UI/AlignmentControls.tsx`

```typescript
// Add distribution controls
const distributeHorizontally = () => {
  const selected = getSelectedShapes();
  const distributed = AlignmentGuideService.distributeShapes(
    selected,
    'horizontal'
  );
  updateShapes(distributed);
};
```

### Phase 4: Optimization & Polish (Week 4)

#### 4.1 Performance Optimization
- Implement viewport culling
- Add debouncing to guide calculations
- Cache alignment results
- Profile and optimize hot paths

#### 4.2 Animation System
- Smooth fade in/out for guides
- Snap animation easing
- Badge appearance transitions

#### 4.3 Mobile Optimization
- Touch-specific thresholds
- Gesture handling
- Responsive guide thickness

## File Structure

```
app/src/
├── services/
│   └── AlignmentGuideService.ts       [NEW]
├── utils/
│   └── SpatialIndex.ts                [NEW]
├── store/
│   └── useAlignmentStore.ts           [NEW]
├── components/
│   ├── Scene/
│   │   ├── AlignmentGuides.tsx        [NEW]
│   │   ├── DashedLine.tsx             [NEW]
│   │   └── DrawingCanvas.tsx          [MODIFY]
│   └── UI/
│       ├── SpacingBadge.tsx           [NEW]
│       └── AlignmentControls.tsx      [MODIFY]
└── __tests__/
    ├── services/
    │   └── AlignmentGuideService.test.ts [NEW]
    └── components/
        └── AlignmentGuides.test.tsx    [NEW]
```

## Technical Specifications

### Performance Budget
- Guide detection: < 5ms for 50 shapes
- Render time: < 16ms per frame (60fps)
- Memory: < 50MB additional usage
- CPU: < 10% during drag operations

### Browser Compatibility
- Chrome 90+: Full support
- Firefox 88+: Full support
- Safari 14+: Full support
- Edge 90+: Full support
- Mobile browsers: Touch optimized

### Accessibility
- Keyboard navigation support
- Screen reader announcements
- High contrast mode compatible
- Reduced motion support

## Testing Strategy

### Unit Tests (70% coverage)
```typescript
describe('AlignmentGuideService', () => {
  it('detects edge alignment within threshold');
  it('calculates equal spacing correctly');
  it('returns correct snap position');
  it('handles rotated shapes');
});
```

### Integration Tests
```typescript
describe('Alignment Guide Integration', () => {
  it('shows guides during drag');
  it('snaps to alignment positions');
  it('displays spacing measurements');
  it('distributes shapes evenly');
});
```

### Performance Tests
```typescript
describe('Performance', () => {
  it('maintains 60fps with 100 shapes');
  it('detects alignments in < 5ms');
  it('uses < 50MB memory');
});
```

### Visual Regression Tests
- Guide appearance
- Badge positioning
- Animation smoothness
- Mobile responsiveness

## Constitution Compliance

### Article 1: Inline Styles Only ✅
- All components use inline styles
- No CSS files created
- Style objects defined in components

### Article 2: TypeScript Strict Mode ✅
- All new files in TypeScript
- Strict null checks
- No any types

### Article 3: Zustand State Management ✅
- New useAlignmentStore follows pattern
- Immutable updates
- Proper typing

### Article 4: React Best Practices ✅
- Functional components
- Custom hooks for logic
- Proper dependency arrays

### Article 5: 3D Rendering Standards ✅
- Uses Three.js primitives
- Integrates with React Three Fiber
- Performance optimized

### Article 6: Testing Requirements ✅
- Comprehensive test suite
- 70% coverage target
- Performance tests included

### Article 7: Security First ✅
- No external API calls
- Client-side only
- No data persistence

### Article 8: Prefer Editing ✅
- Modifies existing components
- Extends current functionality
- Minimal new files

### Article 9: Professional UX ✅
- Canva-inspired design
- Smooth animations
- Mobile optimized

## Risk Mitigation

### Performance Risks
- **Mitigation**: Spatial indexing, viewport culling
- **Monitoring**: Performance.now() measurements
- **Fallback**: Disable guides if FPS drops

### Compatibility Risks
- **Mitigation**: Progressive enhancement
- **Testing**: Cross-browser testing suite
- **Fallback**: Graceful degradation

### UX Risks
- **Mitigation**: User testing, A/B testing
- **Feedback**: Analytics tracking
- **Adjustment**: Configurable thresholds

## Rollout Plan

### Week 1: Alpha
- Internal testing
- Performance profiling
- Bug fixes

### Week 2: Beta
- Feature flag rollout (10% users)
- Gather feedback
- Adjust thresholds

### Week 3: General Availability
- 100% rollout
- Documentation update
- Training materials

### Week 4: Optimization
- Performance tuning
- Mobile improvements
- Feature enhancements

## Success Criteria

### Quantitative
- [ ] Guide detection < 5ms
- [ ] 60fps maintained
- [ ] 70% test coverage
- [ ] 0 critical bugs

### Qualitative
- [ ] Intuitive to use
- [ ] Visually appealing
- [ ] Mobile friendly
- [ ] Performance smooth

## Dependencies

### Required Before Start
- Three.js Line2 availability confirmed
- Zustand store patterns established
- Performance profiling tools ready

### External Dependencies
- Three.js (already installed)
- React Three Fiber (already installed)
- No new packages needed

## Next Steps

1. Review and approve specification
2. Set up feature branch
3. Begin Phase 1 implementation
4. Daily progress updates
5. Weekly demos

---

*This plan is subject to updates based on implementation discoveries.*