# Smart Alignment Guide System - Implementation Plan

## Overview
Implementation of a Canva-inspired smart alignment guide system for the Land Visualizer project, featuring real-time alignment detection, visual guides, and smart spacing indicators.

## Motivation
The current alignment system uses basic button controls without visual feedback. This new system will provide:
- Real-time visual alignment guides during shape manipulation
- Automatic spacing detection and measurement display
- Smart snapping to maintain consistent layouts
- Professional visual feedback matching modern design tools

## Reference Design
Based on Canva's alignment system which shows:
- Purple dashed alignment lines
- Spacing measurements between objects (e.g., "66" badges)
- Smart detection of equal spacing patterns
- Clean, non-intrusive visual feedback

---

## Phase 1: Core Infrastructure

### 1.1 Alignment Detection Engine
**File**: `app/src/services/AlignmentGuideService.ts`

#### Responsibilities:
- Calculate shape boundaries and centers
- Detect alignment conditions between shapes
- Measure spacing between objects
- Return guide metadata for rendering

#### Detection Types:
```typescript
enum AlignmentType {
  LEFT_EDGE = 'left',
  RIGHT_EDGE = 'right',
  TOP_EDGE = 'top',
  BOTTOM_EDGE = 'bottom',
  HORIZONTAL_CENTER = 'h-center',
  VERTICAL_CENTER = 'v-center',
  EQUAL_SPACING = 'spacing'
}
```

#### Core Functions:
- `detectAlignments(activeShape, otherShapes, threshold)` - Find all alignments
- `calculateSpacing(shapes)` - Measure gaps between shapes
- `findEqualSpacing(shapes)` - Detect consistent spacing patterns
- `getSnapPosition(shape, alignments)` - Calculate snap coordinates

### 1.2 Visual Guide Renderer
**File**: `app/src/components/Scene/AlignmentGuides.tsx`

#### Components:
- **Guide Lines**: Three.js Line2 with dashed material
- **Spacing Badges**: HTML overlay elements positioned in 3D space
- **Extension Lines**: Show alignment beyond shape boundaries

#### Visual Properties:
```javascript
const guideStyles = {
  color: '#8B5CF6',        // Purple for alignment
  dashSize: 5,             // Dash pattern size
  gapSize: 5,              // Gap between dashes
  opacity: 0.8,            // Semi-transparent
  lineWidth: 2,            // Visible but not intrusive
  animationDuration: 200   // Smooth fade in/out
}
```

---

## Phase 2: Real-time Detection

### 2.1 Drag Integration
**Update**: `app/src/components/Scene/DrawingCanvas.tsx`

#### Integration Points:
```typescript
// In handlePointerMove during drag operations
const alignments = AlignmentGuideService.detectAlignments(
  draggedShape,
  allShapes,
  snapThreshold
);

// Update guide display
setActiveAlignments(alignments);

// Apply snapping if within threshold
if (alignments.length > 0) {
  const snapPos = AlignmentGuideService.getSnapPosition(
    draggedShape,
    alignments
  );
  updateShapePosition(snapPos);
}
```

### 2.2 Smart Snapping

#### Snap Behavior:
- **Threshold**: 0.5 meters (adjustable based on zoom level)
- **Priority**: Edge alignment > Center alignment > Spacing
- **Visual Feedback**: Highlight snap zones before engaging
- **Smooth Transition**: Ease-in animation when snapping

#### Configuration:
```typescript
interface SnapConfig {
  enabled: boolean;
  threshold: number;        // In world units (meters)
  edgePriority: number;     // 1.0 highest
  centerPriority: number;   // 0.8
  spacingPriority: number;  // 0.6
  visualFeedback: boolean;  // Show snap zones
}
```

---

## Phase 3: Visual Feedback System

### 3.1 Guide Types

#### Alignment Lines
- **Appearance**: Dashed purple lines
- **Behavior**: Appear when shapes align within threshold
- **Duration**: Persist during drag, fade out after 500ms

#### Spacing Indicators
- **Appearance**: Purple badges with distance text
- **Format**: "66m" or "66'" depending on unit settings
- **Position**: Centered between shapes
- **Smart Grouping**: Combine multiple equal spacings

#### Extension Lines
- **Purpose**: Show alignment extends beyond visible shapes
- **Style**: Lighter, thinner dashed lines
- **Length**: Extend 20% beyond shape boundaries

### 3.2 Performance Optimization

#### Spatial Indexing
```typescript
class SpatialIndex {
  private grid: Map<string, Shape[]>;

  // Quick proximity queries
  getNearbyShapes(shape: Shape, radius: number): Shape[]

  // Update on shape movement
  updateShapePosition(shape: Shape): void
}
```

#### Optimization Strategies:
- Cache alignment calculations during continuous drag
- Use requestAnimationFrame for 60fps updates
- Debounce guide recalculation (16ms intervals)
- Limit detection to visible viewport shapes

---

## Phase 4: Enhanced Features

### 4.1 Multi-Selection Alignment

#### Features:
- **Distribute Horizontally/Vertically**: Equal spacing between multiple shapes
- **Align to Selection**: Align all selected to first/last/center
- **Smart Arrange**: Auto-layout with consistent spacing

#### UI Integration:
- Update alignment panel with smart distribution options
- Show preview of arrangement before applying
- Undo/redo support for alignment operations

### 4.2 Persistent Guidelines

#### User-Defined Guides:
- Allow locking important alignment guides
- Create reference lines independent of shapes
- Save/load guide configurations

#### Implementation:
```typescript
interface PersistentGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  locked: boolean;
  visible: boolean;
  color?: string;
  label?: string;
}
```

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Create AlignmentGuideService.ts with core detection
- [ ] Build AlignmentGuides.tsx component
- [ ] Set up useAlignmentStore for state management

### Week 2: Integration
- [ ] Integrate with DrawingCanvas drag operations
- [ ] Implement smart snapping logic
- [ ] Add visual feedback animations

### Week 3: Polish
- [ ] Add spacing indicators and badges
- [ ] Optimize performance for many shapes
- [ ] Implement multi-selection alignment

### Week 4: Enhancement
- [ ] Add persistent guidelines feature
- [ ] Create alignment presets
- [ ] Write comprehensive tests

---

## Technical Architecture

### Store Structure
**File**: `app/src/store/useAlignmentStore.ts`

```typescript
interface AlignmentStore {
  // Active alignment guides
  activeGuides: AlignmentGuide[];

  // Spacing measurements
  spacingMeasurements: SpacingMeasurement[];

  // Snap configuration
  snapConfig: SnapConfig;

  // Actions
  setActiveGuides: (guides: AlignmentGuide[]) => void;
  updateSnapConfig: (config: Partial<SnapConfig>) => void;
  clearGuides: () => void;
}
```

### Component Hierarchy
```
App.tsx
└── SceneManager.tsx
    ├── DrawingCanvas.tsx (detect alignments)
    ├── AlignmentGuides.tsx (render guides)
    └── AlignmentOverlay.tsx (HTML measurements)
```

### Data Flow
1. User drags shape in DrawingCanvas
2. AlignmentGuideService detects alignments
3. Store updates with active guides
4. AlignmentGuides renders visual feedback
5. DrawingCanvas applies snapping if enabled

---

## Testing Strategy

### Unit Tests
- AlignmentGuideService detection algorithms
- Spacing calculation accuracy
- Snap position calculations

### Integration Tests
- Drag operation with alignment guides
- Multi-shape selection and distribution
- Performance with 100+ shapes

### Visual Tests
- Guide appearance and animations
- Spacing badge positioning
- Mobile responsiveness

---

## Success Criteria

### Performance Metrics
- Guide detection < 5ms for 50 shapes
- Smooth 60fps during drag operations
- Memory usage < 50MB with guides active

### User Experience
- Guides appear instantly (< 16ms) when alignment detected
- Snapping feels natural and predictable
- Spacing measurements accurate to 0.01m
- Clear visual hierarchy (guides don't obstruct shapes)

### Feature Completeness
- All alignment types detected accurately
- Equal spacing recognition works with 3+ shapes
- Multi-selection distribution functions correctly
- Mobile touch interactions supported

---

## Migration Path

### Phase 1: Parallel Implementation
- Keep existing AlignmentControls.tsx functional
- Add new guide system alongside current implementation
- Allow users to toggle between old/new systems

### Phase 2: Testing & Refinement
- Gather user feedback on guide behavior
- Adjust thresholds and visual styles
- Optimize performance based on real usage

### Phase 3: Full Migration
- Replace old alignment system entirely
- Remove deprecated alignment code
- Update documentation and tutorials

---

## References

### Similar Implementations
- **Canva**: Visual alignment guides with spacing indicators
- **Figma**: Smart alignment and distribution tools
- **Adobe XD**: Responsive alignment with measurements
- **Sketch**: Alignment guides with snap zones

### Technical Resources
- Three.js Line2 for dashed lines
- React Three Fiber for 3D integration
- Zustand for state management
- Performance optimization techniques

---

## Notes for Developers

### Key Considerations
1. **Coordinate Systems**: Convert between 3D world space and screen space correctly
2. **Performance**: Profile with Chrome DevTools for smooth 60fps
3. **Accessibility**: Ensure guides are visible with different color themes
4. **Precision**: Maintain accuracy for professional surveying requirements

### Common Pitfalls
- Don't recalculate guides on every frame - use debouncing
- Cache spatial queries to avoid O(n²) complexity
- Test with rotated shapes - alignment should work at any angle
- Consider zoom level when setting snap thresholds

### Future Enhancements
- AI-powered layout suggestions
- Alignment to imported CAD drawings
- Custom alignment grids and patterns
- Voice commands for alignment operations

---

*Document Version: 1.0*
*Last Updated: September 2025*
*Author: Land Visualizer Development Team*