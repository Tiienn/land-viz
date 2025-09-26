# Technical Implementation Plan: 2D Top View Drawing Mode

## Feature ID: 002
## Document Type: Implementation Plan
## Version: 1.0
## Date: 2025-01-26

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                       │
├─────────────────────────────────────────────────┤
│  Ribbon Toolbar  │  Status Bar  │  Keyboard     │
│  Toggle Button   │  View Mode   │  Shortcuts     │
├─────────────────────────────────────────────────┤
│                State Management                  │
├─────────────────────────────────────────────────┤
│     useAppStore (Zustand)                        │
│     - viewState: {is2DMode, cameraType}         │
│     - cameraConfig: {zoom2D, viewAngle}         │
├─────────────────────────────────────────────────┤
│              Camera System                       │
├─────────────────────────────────────────────────┤
│  CameraController │ Camera2DToggle │ ViewManager│
│  OrthographicCam  │ PerspectiveCam │ Transitions│
├─────────────────────────────────────────────────┤
│              3D Scene (Three.js)                 │
├─────────────────────────────────────────────────┤
│  React Three Fiber Canvas                        │
│  Shapes │ Grid │ Measurements │ Controls        │
└─────────────────────────────────────────────────┘
```

### 1.2 Component Hierarchy

```
App.tsx
├── Ribbon.tsx
│   └── View2DToggleButton.tsx (NEW)
├── SceneManager.tsx
│   ├── Camera2DToggle.tsx (NEW)
│   ├── CameraController.tsx (MODIFIED)
│   ├── DrawingCanvas.tsx (MODIFIED)
│   └── GridBackground.tsx (MODIFIED)
└── StatusBar.tsx (MODIFIED)
```

### 1.3 Data Flow

1. **User Action**: Click toggle button or press 'V'
2. **State Update**: useAppStore.setViewMode(mode)
3. **Camera Switch**: Camera2DToggle responds to state
4. **Control Update**: CameraController adjusts behaviors
5. **UI Feedback**: Button and status bar reflect change

---

## 2. Technical Design

### 2.1 State Management Schema

```typescript
// Add to useAppStore.ts
interface ViewState {
  is2DMode: boolean;
  cameraType: 'perspective' | 'orthographic';
  viewAngle: 'top' | '3d' | 'front' | 'side';
  zoom2D: number; // Orthographic zoom level
  lastPerspectivePosition?: Point3D;
  lastPerspectiveTarget?: Point3D;
  transition: {
    isAnimating: boolean;
    startTime: number;
    duration: number;
  };
}

interface ViewActions {
  setViewMode: (mode: '2D' | '3D') => void;
  toggleViewMode: () => void;
  setZoom2D: (zoom: number) => void;
  saveCurrentView: () => void;
  restorePerspectiveView: () => void;
}
```

### 2.2 Camera Configuration

```typescript
// Orthographic Camera Setup
const calculateOrthographicBounds = (viewport: Size) => {
  const aspect = viewport.width / viewport.height;
  const viewSize = 100; // Base view size in world units
  const zoom = store.viewState.zoom2D || 1;

  return {
    left: -aspect * viewSize / (2 * zoom),
    right: aspect * viewSize / (2 * zoom),
    top: viewSize / (2 * zoom),
    bottom: -viewSize / (2 * zoom),
    near: -1000,
    far: 1000
  };
};
```

### 2.3 New Components

#### Camera2DToggle.tsx
```typescript
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';

export const Camera2DToggle: React.FC = () => {
  const { is2DMode, zoom2D } = useAppStore(state => state.viewState);
  const viewport = useThree(state => state.viewport);

  const orthoBounds = calculateOrthographicBounds(viewport);

  return (
    <>
      <PerspectiveCamera
        makeDefault={!is2DMode}
        position={[0, 80, 80]}
        fov={75}
      />
      <OrthographicCamera
        makeDefault={is2DMode}
        position={[0, 100, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        {...orthoBounds}
      />
    </>
  );
};
```

#### View2DToggleButton.tsx
```typescript
export const View2DToggleButton: React.FC = () => {
  const { is2DMode, toggleViewMode } = useAppStore();

  return (
    <button
      onClick={toggleViewMode}
      style={{
        ...buttonStyles,
        background: is2DMode
          ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
          : 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
      }}
      title="Toggle 2D/3D View (V)"
    >
      {is2DMode ? <Square2DIcon /> : <Cube3DIcon />}
      <span>{is2DMode ? '2D' : '3D'}</span>
    </button>
  );
};
```

### 2.4 Modified Components

#### CameraController.tsx Modifications
```typescript
// Add 2D mode handling
const CameraController = forwardRef<CameraControllerRef, CameraControllerProps>(
  (props, ref) => {
    const { is2DMode } = useAppStore(state => state.viewState);

    // Adjust controls based on mode
    const controlProps = is2DMode ? {
      enableRotate: false,      // Lock rotation in 2D
      enablePan: true,
      enableZoom: true,
      panSpeed: 2.0,           // Faster pan in 2D
      zoomSpeed: 3.0,          // Faster zoom in 2D
      mouseButtons: {
        LEFT: undefined,
        MIDDLE: 2,  // Pan
        RIGHT: undefined  // No rotate in 2D
      }
    } : {
      // Existing 3D controls
    };

    return <OrbitControls {...controlProps} />;
  }
);
```

#### DrawingCanvas.tsx Modifications
```typescript
// Enhanced snapping in 2D mode
const getSnapPoint = (point: Point2D): Point2D => {
  const { is2DMode, snapToGrid, gridSize } = useAppStore.getState();

  if (!snapToGrid) return point;

  // Stronger snapping in 2D mode
  const snapStrength = is2DMode ? 1.0 : 0.5;
  const snapThreshold = is2DMode ? gridSize * 0.4 : gridSize * 0.2;

  // Calculate snapped position
  return snapToGridPoint(point, gridSize, snapThreshold, snapStrength);
};
```

### 2.5 Animation System

```typescript
// Smooth camera transition
const animateViewTransition = (
  fromProjection: 'perspective' | 'orthographic',
  toProjection: 'perspective' | 'orthographic',
  duration: number = 300
) => {
  const startTime = performance.now();

  const animate = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    // Interpolate camera properties
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Complete transition
      completeTransition();
    }
  };

  animate();
};
```

---

## 3. Implementation Strategy

### 3.1 Phase 1: Core Camera System (4 hours)

**Step 1.1**: Create Camera2DToggle component
- Implement dual camera setup
- Add makeDefault switching logic
- Configure orthographic frustum

**Step 1.2**: Update CameraController
- Add 2D mode detection
- Implement control restrictions
- Adjust pan/zoom speeds

**Step 1.3**: State Management
- Add viewState to store
- Implement toggle actions
- Add persistence logic

### 3.2 Phase 2: UI Integration (3 hours)

**Step 2.1**: Create Toggle Button
- Design button component
- Add to ribbon toolbar
- Implement visual states

**Step 2.2**: Keyboard Shortcuts
- Add 'V' key handler
- Prevent conflicts with inputs
- Show toast feedback

**Step 2.3**: Status Bar Update
- Display current mode
- Show zoom level in 2D
- Add coordinate display

### 3.3 Phase 3: 2D Optimizations (4 hours)

**Step 3.1**: Grid Enhancements
- Increase visibility in 2D
- Add measurement labels
- Show axis indicators

**Step 3.2**: Drawing Adaptations
- Enhance snap behavior
- Hide 3D-only controls
- Simplify resize handles

**Step 3.3**: Measurement Display
- Always show in 2D mode
- Improve label positioning
- Add coordinate readout

### 3.4 Phase 4: Testing & Polish (3 hours)

**Step 4.1**: Unit Tests
- Camera switching logic
- State management
- Control behaviors

**Step 4.2**: Integration Tests
- Full workflow testing
- Tool compatibility
- Performance validation

**Step 4.3**: Polish
- Smooth animations
- Edge case handling
- Documentation

---

## 4. File Structure Changes

```
app/src/
├── components/
│   ├── Scene/
│   │   ├── Camera2DToggle.tsx (NEW)
│   │   ├── CameraController.tsx (MODIFIED)
│   │   ├── DrawingCanvas.tsx (MODIFIED)
│   │   ├── GridBackground.tsx (MODIFIED)
│   │   └── SceneManager.tsx (MODIFIED)
│   ├── UI/
│   │   └── View2DToggleButton.tsx (NEW)
│   └── Layout/
│       ├── Ribbon.tsx (MODIFIED)
│       └── StatusBar.tsx (MODIFIED)
├── store/
│   └── useAppStore.ts (MODIFIED)
├── hooks/
│   └── useViewMode.ts (NEW)
├── utils/
│   └── cameraUtils.ts (NEW)
└── __tests__/
    └── view2D.test.tsx (NEW)
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

```typescript
// view2D.test.tsx
describe('2D View Mode', () => {
  test('toggles between 2D and 3D modes', () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.viewState.is2DMode).toBe(false);
    act(() => result.current.toggleViewMode());
    expect(result.current.viewState.is2DMode).toBe(true);
  });

  test('calculates orthographic bounds correctly', () => {
    const bounds = calculateOrthographicBounds({ width: 1920, height: 1080 });
    expect(bounds.left).toBeCloseTo(-88.89);
    expect(bounds.right).toBeCloseTo(88.89);
  });
});
```

### 5.2 Integration Tests

```typescript
describe('2D/3D Integration', () => {
  test('maintains shape selection when switching views', async () => {
    // Select a shape in 3D
    // Switch to 2D
    // Verify shape still selected
  });

  test('continues drawing across view switch', async () => {
    // Start drawing in 3D
    // Switch to 2D
    // Complete drawing
    // Verify shape created correctly
  });
});
```

### 5.3 E2E Tests

```typescript
describe('2D View E2E', () => {
  test('complete 2D drawing workflow', async () => {
    // Switch to 2D view
    // Draw rectangle with precise dimensions
    // Measure distance
    // Switch back to 3D
    // Verify all data preserved
  });
});
```

---

## 6. Performance Considerations

### 6.1 Optimization Strategies

1. **Frustum Culling**: More aggressive in 2D mode
2. **LOD Switching**: Simpler geometries in 2D
3. **Render Layers**: Disable unnecessary 3D effects
4. **State Memoization**: Prevent unnecessary re-renders

### 6.2 Performance Budget

- View switch: < 400ms
- Frame rate: 60 FPS maintained
- Memory: < 10MB additional
- Bundle size: < 15KB increase

### 6.3 Monitoring

```typescript
// Performance tracking
const measureViewSwitch = () => {
  performance.mark('view-switch-start');

  toggleViewMode();

  requestAnimationFrame(() => {
    performance.mark('view-switch-end');
    performance.measure('view-switch',
      'view-switch-start',
      'view-switch-end'
    );
  });
};
```

---

## 7. Security Considerations

### 7.1 Input Validation
- Validate zoom levels (0.1 - 10)
- Sanitize keyboard inputs
- Prevent rapid toggle abuse

### 7.2 State Security
- No sensitive data in view state
- Validate state transitions
- Prevent invalid camera positions

---

## 8. Constitution Compliance

### Article 1: Inline Styles ✅
- All new components use inline styles
- No CSS files created

### Article 2: TypeScript ✅
- Strict mode maintained
- Full type coverage

### Article 3: Zustand ✅
- View state in central store
- Actions follow patterns

### Article 4: React Best Practices ✅
- Functional components
- Proper hooks usage
- Memoization where needed

### Article 5: 3D Standards ✅
- React Three Fiber integration
- Three.js best practices

### Article 6: Testing ✅
- Comprehensive test coverage
- Unit, integration, E2E tests

### Article 7: Security ✅
- Input validation
- No data exposure

### Article 8: File Editing ✅
- Prefer modifying existing files
- Minimal new file creation

### Article 9: UX Design ✅
- Canva-inspired UI
- Smooth animations
- Professional appearance

---

## 9. Rollback Plan

If issues arise:

1. **Feature Flag**: Disable via environment variable
2. **Quick Revert**: Git revert of feature branch
3. **Gradual Rollback**: Disable for specific users
4. **Data Recovery**: No data changes, safe rollback

---

## 10. Documentation Requirements

### 10.1 Code Documentation
- JSDoc for all new functions
- Inline comments for complex logic
- README updates

### 10.2 User Documentation
- Feature announcement
- Tutorial video/GIF
- Keyboard shortcut guide

### 10.3 Developer Documentation
- Architecture decisions
- API changes
- Testing guide

---

## 11. Success Criteria

### Technical Success
- [ ] View toggle works smoothly
- [ ] No performance degradation
- [ ] All tests passing
- [ ] No console errors

### User Success
- [ ] Intuitive toggle mechanism
- [ ] Clear visual feedback
- [ ] Improved drawing precision
- [ ] Positive user feedback

### Business Success
- [ ] Increased CAD user adoption
- [ ] Reduced support tickets
- [ ] Feature usage > 50%
- [ ] Positive reviews

---

## 12. Timeline

### Week 1
- Day 1-2: Core camera system
- Day 3-4: UI integration
- Day 5: Initial testing

### Week 2
- Day 1-2: 2D optimizations
- Day 3-4: Comprehensive testing
- Day 5: Documentation

### Week 3
- Day 1-2: Bug fixes
- Day 3: Performance optimization
- Day 4-5: Release preparation

---

## Sign-off

- **Technical Lead**: _______________ Date: _______________
- **Frontend Lead**: _______________ Date: _______________
- **QA Lead**: _______________ Date: _______________