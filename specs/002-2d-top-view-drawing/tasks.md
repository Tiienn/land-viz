# Task Breakdown: 2D Top View Drawing Mode

## Feature ID: 002
## Document Type: Task Breakdown
## Version: 1.0
## Date: 2025-01-26
## Total Estimated Time: 14 hours

---

## Phase 1: Core Camera System (4 hours)

### Task 1.1: Create Camera2DToggle Component
**Time Estimate**: 1.5 hours
**Priority**: Critical
**Dependencies**: None

#### Description
Create a new component that manages both PerspectiveCamera and OrthographicCamera instances, switching between them based on view mode state.

#### Implementation Steps
1. Create `app/src/components/Scene/Camera2DToggle.tsx`
2. Import camera components from `@react-three/drei`
3. Connect to useAppStore for view state
4. Calculate orthographic frustum bounds
5. Implement makeDefault switching logic

#### Code Example
```typescript
// app/src/components/Scene/Camera2DToggle.tsx
import React, { useMemo } from 'react';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';

export const Camera2DToggle: React.FC = () => {
  const { is2DMode, zoom2D } = useAppStore(state => ({
    is2DMode: state.viewState.is2DMode,
    zoom2D: state.viewState.zoom2D
  }));

  const viewport = useThree(state => state.viewport);

  const orthoBounds = useMemo(() => {
    const aspect = viewport.width / viewport.height;
    const viewSize = 100;
    const zoom = zoom2D || 1;

    return {
      left: -aspect * viewSize / (2 * zoom),
      right: aspect * viewSize / (2 * zoom),
      top: viewSize / (2 * zoom),
      bottom: -viewSize / (2 * zoom),
      near: -1000,
      far: 1000
    };
  }, [viewport, zoom2D]);

  return (
    <>
      <PerspectiveCamera
        makeDefault={!is2DMode}
        position={[0, 80, 80]}
        fov={75}
        near={0.1}
        far={10000}
      />
      <OrthographicCamera
        makeDefault={is2DMode}
        position={[0, 100, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        zoom={1}
        {...orthoBounds}
      />
    </>
  );
};
```

#### Validation Criteria
- [ ] Both cameras render correctly
- [ ] Switching between cameras works smoothly
- [ ] Orthographic frustum calculated correctly
- [ ] No console errors or warnings
- [ ] TypeScript types properly defined

---

### Task 1.2: Update State Management
**Time Estimate**: 1 hour
**Priority**: Critical
**Dependencies**: None

#### Description
Add view state management to the Zustand store, including actions for toggling between 2D and 3D modes.

#### Implementation Steps
1. Open `app/src/store/useAppStore.ts`
2. Add ViewState interface
3. Add view-related actions
4. Initialize default view state
5. Implement state persistence

#### Code Example
```typescript
// Add to app/src/store/useAppStore.ts

interface ViewState {
  is2DMode: boolean;
  cameraType: 'perspective' | 'orthographic';
  viewAngle: 'top' | '3d';
  zoom2D: number;
  lastPerspectivePosition?: Point3D;
  lastPerspectiveTarget?: Point3D;
  transition: {
    isAnimating: boolean;
    startTime: number;
    duration: number;
  };
}

// In the store implementation
viewState: {
  is2DMode: false,
  cameraType: 'perspective',
  viewAngle: '3d',
  zoom2D: 1,
  transition: {
    isAnimating: false,
    startTime: 0,
    duration: 300
  }
},

// Actions
setViewMode: (mode: '2D' | '3D') => set((state) => ({
  viewState: {
    ...state.viewState,
    is2DMode: mode === '2D',
    cameraType: mode === '2D' ? 'orthographic' : 'perspective',
    viewAngle: mode === '2D' ? 'top' : '3d'
  }
})),

toggleViewMode: () => set((state) => ({
  viewState: {
    ...state.viewState,
    is2DMode: !state.viewState.is2DMode,
    cameraType: state.viewState.is2DMode ? 'perspective' : 'orthographic',
    viewAngle: state.viewState.is2DMode ? '3d' : 'top'
  }
})),

setZoom2D: (zoom: number) => set((state) => ({
  viewState: {
    ...state.viewState,
    zoom2D: Math.max(0.1, Math.min(10, zoom))
  }
}))
```

#### Validation Criteria
- [ ] State updates correctly on toggle
- [ ] Zoom constraints enforced (0.1 - 10)
- [ ] State persists across sessions
- [ ] No state mutations
- [ ] Actions work as expected

---

### Task 1.3: Modify CameraController
**Time Estimate**: 1.5 hours
**Priority**: High
**Dependencies**: Task 1.2

#### Description
Update the CameraController component to handle different control behaviors based on the current view mode.

#### Implementation Steps
1. Open `app/src/components/Scene/CameraController.tsx`
2. Import view state from store
3. Add conditional control props
4. Implement 2D-specific behaviors
5. Test control restrictions

#### Code Example
```typescript
// Modifications to CameraController.tsx

const CameraController = forwardRef<CameraControllerRef, CameraControllerProps>(
  ({ enableControls = true, ...props }, ref) => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { camera, gl } = useThree();
    const { is2DMode } = useAppStore(state => state.viewState);

    // Dynamic control configuration based on mode
    const controlConfig = useMemo(() => {
      if (is2DMode) {
        return {
          enableRotate: false,     // No rotation in 2D
          enablePan: true,
          enableZoom: true,
          panSpeed: 2.0,          // Faster pan in 2D
          zoomSpeed: 3.0,         // Faster zoom in 2D
          mouseButtons: {
            LEFT: undefined,       // Disable left click
            MIDDLE: 2,            // Pan with middle
            RIGHT: undefined      // Disable right click
          },
          touches: {
            ONE: 2,               // Pan with one finger
            TWO: 3                // Zoom with two fingers
          }
        };
      }

      // Existing 3D configuration
      return {
        enableRotate: true,
        enablePan: true,
        enableZoom: true,
        panSpeed: 1.5,
        zoomSpeed: 2.0,
        rotateSpeed: 1.0,
        mouseButtons: {
          LEFT: undefined,
          MIDDLE: 2,
          RIGHT: 0
        }
      };
    }, [is2DMode]);

    // Add zoom handling for orthographic camera
    useEffect(() => {
      if (is2DMode && controlsRef.current) {
        const handleZoom = () => {
          const zoom = camera.zoom;
          useAppStore.getState().setZoom2D(zoom);
        };

        controlsRef.current.addEventListener('change', handleZoom);
        return () => {
          controlsRef.current?.removeEventListener('change', handleZoom);
        };
      }
    }, [is2DMode, camera]);

    return (
      <OrbitControls
        ref={controlsRef}
        {...controlConfig}
        {...props}
      />
    );
  }
);
```

#### Validation Criteria
- [ ] Controls behave correctly in 2D mode
- [ ] No rotation possible in 2D
- [ ] Pan and zoom work smoothly
- [ ] Touch controls work on mobile
- [ ] 3D controls unaffected

---

## Phase 2: UI Integration (3 hours)

### Task 2.1: Create Toggle Button Component
**Time Estimate**: 1 hour
**Priority**: Critical
**Dependencies**: Task 1.2

#### Description
Design and implement the 2D/3D toggle button for the ribbon toolbar with proper styling and state indication.

#### Implementation Steps
1. Create `app/src/components/UI/View2DToggleButton.tsx`
2. Design button with inline styles
3. Add icon components or SVGs
4. Connect to store actions
5. Implement visual feedback

#### Code Example
```typescript
// app/src/components/UI/View2DToggleButton.tsx
import React from 'react';
import { useAppStore } from '@/store/useAppStore';

// SVG Icons
const Cube3DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const Square2DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const View2DToggleButton: React.FC = () => {
  const { is2DMode, toggleViewMode } = useAppStore(state => ({
    is2DMode: state.viewState.is2DMode,
    toggleViewMode: state.toggleViewMode
  }));

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    background: is2DMode
      ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
      : 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    fontFamily: 'Nunito Sans, sans-serif'
  };

  return (
    <button
      onClick={toggleViewMode}
      style={buttonStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      }}
      title={`Switch to ${is2DMode ? '3D' : '2D'} View (V)`}
    >
      {is2DMode ? <Square2DIcon /> : <Cube3DIcon />}
      <span>{is2DMode ? '2D View' : '3D View'}</span>
    </button>
  );
};
```

#### Validation Criteria
- [ ] Button renders with correct initial state
- [ ] Visual feedback on hover
- [ ] Icon changes based on mode
- [ ] Tooltip shows keyboard shortcut
- [ ] Smooth color transitions

---

### Task 2.2: Add Button to Ribbon
**Time Estimate**: 0.5 hours
**Priority**: High
**Dependencies**: Task 2.1

#### Description
Integrate the toggle button into the existing ribbon toolbar in the appropriate section.

#### Implementation Steps
1. Open `app/src/components/Layout/Ribbon.tsx` or `app/src/App.tsx`
2. Import View2DToggleButton
3. Add to view controls section
4. Ensure proper spacing and alignment
5. Test responsive layout

#### Code Example
```typescript
// In Ribbon component or App.tsx toolbar section

import { View2DToggleButton } from '@/components/UI/View2DToggleButton';

// In the toolbar JSX, add to view controls section:
<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
  {/* Existing view controls */}
  <View2DToggleButton />
  {/* Other controls */}
</div>
```

#### Validation Criteria
- [ ] Button appears in correct location
- [ ] Proper spacing with other buttons
- [ ] Responsive on different screen sizes
- [ ] Doesn't break existing layout
- [ ] Accessible tab order

---

### Task 2.3: Implement Keyboard Shortcut
**Time Estimate**: 1 hour
**Priority**: High
**Dependencies**: Task 1.2

#### Description
Add global keyboard shortcut 'V' to toggle between 2D and 3D views, with proper conflict prevention.

#### Implementation Steps
1. Create keyboard event handler
2. Add to App.tsx or use global hook
3. Prevent conflicts with input fields
4. Add visual feedback (optional toast)
5. Document shortcut

#### Code Example
```typescript
// In App.tsx or a custom hook

useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    // Ignore if user is typing in an input field
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Check for 'V' key (case insensitive)
    if (event.key === 'v' || event.key === 'V') {
      event.preventDefault();

      const store = useAppStore.getState();
      store.toggleViewMode();

      // Optional: Show toast notification
      showToast(`Switched to ${store.viewState.is2DMode ? '2D' : '3D'} view`);
    }
  };

  window.addEventListener('keydown', handleKeyPress);

  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, []);
```

#### Validation Criteria
- [ ] 'V' key toggles view mode
- [ ] Doesn't trigger in input fields
- [ ] Works with caps lock on
- [ ] No conflicts with other shortcuts
- [ ] Optional toast shows briefly

---

### Task 2.4: Update Status Bar
**Time Estimate**: 0.5 hours
**Priority**: Medium
**Dependencies**: Task 1.2

#### Description
Add view mode indicator to the status bar showing current mode and zoom level in 2D.

#### Implementation Steps
1. Open status bar component
2. Add view mode display
3. Show zoom level for 2D mode
4. Style consistently
5. Update in real-time

#### Code Example
```typescript
// In StatusBar component

const StatusBar: React.FC = () => {
  const { is2DMode, zoom2D } = useAppStore(state => ({
    is2DMode: state.viewState.is2DMode,
    zoom2D: state.viewState.zoom2D
  }));

  return (
    <div style={statusBarStyle}>
      {/* Existing status items */}

      <div style={{
        padding: '4px 8px',
        borderRadius: '4px',
        background: 'rgba(255, 255, 255, 0.1)',
        fontSize: '12px',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        <span style={{ fontWeight: 600 }}>
          {is2DMode ? '2D' : '3D'} View
        </span>
        {is2DMode && (
          <span style={{ marginLeft: '8px', opacity: 0.8 }}>
            Zoom: {(zoom2D * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};
```

#### Validation Criteria
- [ ] Shows current view mode
- [ ] Displays zoom in 2D mode
- [ ] Updates immediately on change
- [ ] Consistent with status bar style
- [ ] Readable font size

---

## Phase 3: 2D Mode Optimizations (4 hours)

### Task 3.1: Enhance Grid Display
**Time Estimate**: 1.5 hours
**Priority**: High
**Dependencies**: Task 1.1

#### Description
Improve grid visibility and add measurement indicators when in 2D mode.

#### Implementation Steps
1. Modify `GridBackground.tsx`
2. Detect 2D mode state
3. Increase line opacity/thickness
4. Add measurement labels
5. Show axis indicators

#### Code Example
```typescript
// In GridBackground.tsx

const GridBackground: React.FC = () => {
  const { is2DMode, gridSize } = useAppStore(state => ({
    is2DMode: state.viewState.is2DMode,
    gridSize: state.drawing.gridSize
  }));

  // Adjust grid appearance for 2D mode
  const gridConfig = useMemo(() => {
    if (is2DMode) {
      return {
        majorLineOpacity: 0.4,    // More visible in 2D
        minorLineOpacity: 0.2,
        majorLineWidth: 2,
        minorLineWidth: 1,
        showLabels: true,         // Show measurements
        showAxes: true            // Show X/Y axes
      };
    }

    return {
      majorLineOpacity: 0.2,     // Standard 3D visibility
      minorLineOpacity: 0.1,
      majorLineWidth: 1,
      minorLineWidth: 0.5,
      showLabels: false,
      showAxes: false
    };
  }, [is2DMode]);

  // Render grid with conditional styling
  return (
    <group>
      {/* Grid implementation with gridConfig */}
      {gridConfig.showAxes && (
        <>
          {/* X-axis indicator */}
          <line>
            <bufferGeometry />
            <lineBasicMaterial color="#ff0000" linewidth={2} />
          </line>
          {/* Y-axis indicator */}
          <line>
            <bufferGeometry />
            <lineBasicMaterial color="#00ff00" linewidth={2} />
          </line>
        </>
      )}
    </group>
  );
};
```

#### Validation Criteria
- [ ] Grid more visible in 2D
- [ ] Axes shown in 2D only
- [ ] Labels display correctly
- [ ] Performance maintained
- [ ] Smooth transition

---

### Task 3.2: Adapt Drawing Controls
**Time Estimate**: 1.5 hours
**Priority**: High
**Dependencies**: Task 1.3

#### Description
Modify drawing behavior to enhance precision in 2D mode with stronger snapping and simplified controls.

#### Implementation Steps
1. Update `DrawingCanvas.tsx`
2. Implement stronger snap in 2D
3. Hide 3D-only controls
4. Add orthogonal constraints
5. Test drawing accuracy

#### Code Example
```typescript
// In DrawingCanvas.tsx

const DrawingCanvas: React.FC = () => {
  const { is2DMode, snapToGrid, gridSize } = useAppStore(state => ({
    is2DMode: state.viewState.is2DMode,
    snapToGrid: state.drawing.snapToGrid,
    gridSize: state.drawing.gridSize
  }));

  const getSnappedPoint = useCallback((point: Point2D): Point2D => {
    if (!snapToGrid) return point;

    // Stronger snapping in 2D mode
    const snapStrength = is2DMode ? 1.0 : 0.5;
    const snapThreshold = gridSize * (is2DMode ? 0.4 : 0.2);

    const snappedX = Math.round(point.x / gridSize) * gridSize;
    const snappedY = Math.round(point.y / gridSize) * gridSize;

    // Apply snap if within threshold
    const deltaX = Math.abs(point.x - snappedX);
    const deltaY = Math.abs(point.y - snappedY);

    return {
      x: deltaX < snapThreshold ? snappedX : point.x,
      y: deltaY < snapThreshold ? snappedY : point.y
    };
  }, [is2DMode, snapToGrid, gridSize]);

  // Orthogonal constraint with Shift key
  const applyOrthogonalConstraint = useCallback((
    point: Point2D,
    lastPoint: Point2D,
    isShiftPressed: boolean
  ): Point2D => {
    if (!is2DMode || !isShiftPressed || !lastPoint) return point;

    const deltaX = Math.abs(point.x - lastPoint.x);
    const deltaY = Math.abs(point.y - lastPoint.y);

    // Constrain to horizontal or vertical
    if (deltaX > deltaY) {
      return { x: point.x, y: lastPoint.y };  // Horizontal
    } else {
      return { x: lastPoint.x, y: point.y };  // Vertical
    }
  }, [is2DMode]);

  // Rest of drawing logic...
};
```

#### Validation Criteria
- [ ] Stronger snapping in 2D
- [ ] Orthogonal constraints work
- [ ] Shift key enables constraints
- [ ] Drawing precision improved
- [ ] No 3D controls in 2D mode

---

### Task 3.3: Update Shape Controls
**Time Estimate**: 1 hour
**Priority**: Medium
**Dependencies**: Task 3.2

#### Description
Simplify shape manipulation controls in 2D mode by hiding rotation handles and adjusting resize behavior.

#### Implementation Steps
1. Modify resize/rotation controls
2. Hide rotation in 2D mode
3. Simplify resize handles
4. Update visual feedback
5. Test shape editing

#### Code Example
```typescript
// In ResizableShapeControls.tsx

const ResizableShapeControls: React.FC<Props> = ({ shape }) => {
  const { is2DMode } = useAppStore(state => state.viewState.is2DMode);

  // Don't show rotation handle in 2D mode
  const showRotationHandle = !is2DMode;

  // Simplified handle configuration for 2D
  const handleConfig = useMemo(() => {
    if (is2DMode) {
      return {
        corners: true,
        edges: true,
        rotation: false,
        handleSize: 10,    // Larger for easier selection
        handleColor: '#3B82F6'
      };
    }

    return {
      corners: true,
      edges: true,
      rotation: true,
      handleSize: 8,
      handleColor: '#10B981'
    };
  }, [is2DMode]);

  return (
    <group>
      {/* Render handles based on config */}
      {handleConfig.corners && renderCornerHandles()}
      {handleConfig.edges && renderEdgeHandles()}
      {handleConfig.rotation && renderRotationHandle()}
    </group>
  );
};
```

#### Validation Criteria
- [ ] No rotation handle in 2D
- [ ] Resize handles work correctly
- [ ] Visual feedback appropriate
- [ ] Easy to select handles
- [ ] Maintains functionality

---

## Phase 4: Integration & Testing (3 hours)

### Task 4.1: Integration with SceneManager
**Time Estimate**: 1 hour
**Priority**: Critical
**Dependencies**: Task 1.1

#### Description
Integrate the Camera2DToggle component into SceneManager and ensure proper scene updates.

#### Implementation Steps
1. Update `SceneManager.tsx`
2. Add Camera2DToggle component
3. Remove/modify existing camera
4. Test scene rendering
5. Verify all tools work

#### Code Example
```typescript
// In SceneManager.tsx

import { Camera2DToggle } from './Camera2DToggle';

const SceneContent: React.FC<SceneContentProps> = (props) => {
  const { is2DMode } = useAppStore(state => state.viewState.is2DMode);

  return (
    <>
      {/* Replace existing camera with */}
      <Camera2DToggle />

      {/* Conditionally render based on mode */}
      <CameraController
        enableControls={true}
        // Pass mode-specific props
      />

      {/* Existing scene content */}
      <DrawingCanvas />
      <ShapeRenderer />

      {/* Enhanced grid for 2D */}
      <GridBackground enhanced={is2DMode} />

      {/* Conditional 3D-only elements */}
      {!is2DMode && <Lighting />}
    </>
  );
};
```

#### Validation Criteria
- [ ] Scene renders in both modes
- [ ] Smooth camera transitions
- [ ] All tools functional
- [ ] No rendering errors
- [ ] Performance maintained

---

### Task 4.2: Write Unit Tests
**Time Estimate**: 1 hour
**Priority**: High
**Dependencies**: All previous tasks

#### Description
Create comprehensive unit tests for view mode functionality.

#### Implementation Steps
1. Create test file `view2D.test.tsx`
2. Test state management
3. Test camera calculations
4. Test UI components
5. Achieve 80% coverage

#### Code Example
```typescript
// app/src/__tests__/view2D.test.tsx

import { renderHook, act } from '@testing-library/react-hooks';
import { render, fireEvent } from '@testing-library/react';
import { useAppStore } from '@/store/useAppStore';
import { View2DToggleButton } from '@/components/UI/View2DToggleButton';
import { calculateOrthographicBounds } from '@/utils/cameraUtils';

describe('2D View Mode', () => {
  beforeEach(() => {
    useAppStore.setState({
      viewState: {
        is2DMode: false,
        cameraType: 'perspective',
        viewAngle: '3d',
        zoom2D: 1
      }
    });
  });

  describe('State Management', () => {
    test('toggles view mode correctly', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.viewState.is2DMode).toBe(false);

      act(() => {
        result.current.toggleViewMode();
      });

      expect(result.current.viewState.is2DMode).toBe(true);
      expect(result.current.viewState.cameraType).toBe('orthographic');
    });

    test('sets zoom within constraints', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setZoom2D(0.05); // Below minimum
      });
      expect(result.current.viewState.zoom2D).toBe(0.1);

      act(() => {
        result.current.setZoom2D(15); // Above maximum
      });
      expect(result.current.viewState.zoom2D).toBe(10);

      act(() => {
        result.current.setZoom2D(5); // Valid value
      });
      expect(result.current.viewState.zoom2D).toBe(5);
    });
  });

  describe('UI Components', () => {
    test('toggle button reflects state', () => {
      const { getByText, rerender } = render(<View2DToggleButton />);

      expect(getByText('3D View')).toBeInTheDocument();

      act(() => {
        useAppStore.getState().toggleViewMode();
      });

      rerender(<View2DToggleButton />);
      expect(getByText('2D View')).toBeInTheDocument();
    });

    test('button click toggles mode', () => {
      const { getByRole } = render(<View2DToggleButton />);
      const button = getByRole('button');

      fireEvent.click(button);

      expect(useAppStore.getState().viewState.is2DMode).toBe(true);
    });
  });

  describe('Camera Calculations', () => {
    test('calculates orthographic bounds correctly', () => {
      const viewport = { width: 1920, height: 1080 };
      const zoom = 1;

      const bounds = calculateOrthographicBounds(viewport, zoom);

      expect(bounds.left).toBeCloseTo(-88.89, 2);
      expect(bounds.right).toBeCloseTo(88.89, 2);
      expect(bounds.top).toBe(50);
      expect(bounds.bottom).toBe(-50);
    });

    test('applies zoom to bounds', () => {
      const viewport = { width: 1920, height: 1080 };
      const zoom = 2;

      const bounds = calculateOrthographicBounds(viewport, zoom);

      expect(bounds.left).toBeCloseTo(-44.44, 2);
      expect(bounds.right).toBeCloseTo(44.44, 2);
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('V key toggles view mode', () => {
      const event = new KeyboardEvent('keydown', { key: 'v' });

      window.dispatchEvent(event);

      expect(useAppStore.getState().viewState.is2DMode).toBe(true);
    });

    test('ignores V in input fields', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'v',
        target: input
      });

      window.dispatchEvent(event);

      expect(useAppStore.getState().viewState.is2DMode).toBe(false);
    });
  });
});
```

#### Validation Criteria
- [ ] All tests pass
- [ ] 80% code coverage
- [ ] Edge cases covered
- [ ] Mocks work correctly
- [ ] No console errors

---

### Task 4.3: Performance Optimization
**Time Estimate**: 0.5 hours
**Priority**: Medium
**Dependencies**: Task 4.1

#### Description
Profile and optimize performance to ensure smooth 60 FPS in both modes.

#### Implementation Steps
1. Profile with React DevTools
2. Identify bottlenecks
3. Add memoization where needed
4. Optimize re-renders
5. Verify performance

#### Code Example
```typescript
// Performance optimizations

// Memoize expensive calculations
const orthoBounds = useMemo(() =>
  calculateOrthographicBounds(viewport, zoom2D),
  [viewport.width, viewport.height, zoom2D]
);

// Prevent unnecessary re-renders
const View2DToggleButton = React.memo(() => {
  // Component implementation
});

// Use callback for event handlers
const handleToggle = useCallback(() => {
  toggleViewMode();
}, [toggleViewMode]);

// Debounce zoom updates
const debouncedSetZoom = useMemo(
  () => debounce(setZoom2D, 16), // ~60 FPS
  [setZoom2D]
);
```

#### Validation Criteria
- [ ] 60 FPS maintained
- [ ] No unnecessary re-renders
- [ ] Smooth animations
- [ ] Memory usage stable
- [ ] Bundle size acceptable

---

### Task 4.4: Documentation
**Time Estimate**: 0.5 hours
**Priority**: Low
**Dependencies**: All tasks

#### Description
Document the feature for users and developers.

#### Implementation Steps
1. Update README.md
2. Add inline code comments
3. Create user guide
4. Document keyboard shortcuts
5. Add to changelog

#### Code Example
```markdown
## 2D/3D View Toggle

Switch between 2D top-down view and 3D perspective view for different workflows.

### Usage

**Toggle View:**
- Click the 2D/3D button in the toolbar
- Press 'V' key (keyboard shortcut)

**2D Mode Features:**
- Orthographic projection (no perspective distortion)
- Locked top-down view
- Enhanced grid snapping
- Simplified controls
- Precise measurements

**3D Mode Features:**
- Perspective projection
- Full orbit controls
- 3D rotation and manipulation
- Depth visualization

### Controls

| Mode | Left Mouse | Middle Mouse | Right Mouse | Scroll |
|------|-----------|--------------|-------------|---------|
| 2D   | Select    | Pan          | -           | Zoom    |
| 3D   | Select    | Pan          | Orbit       | Zoom    |

### Development

```typescript
// Access view state
const { is2DMode } = useAppStore(state => state.viewState);

// Toggle programmatically
useAppStore.getState().toggleViewMode();
```
```

#### Validation Criteria
- [ ] README updated
- [ ] Code well-commented
- [ ] User guide clear
- [ ] API documented
- [ ] Changelog entry added

---

## Summary

### Total Tasks: 14
### Total Time: 14 hours

### Priority Breakdown
- **Critical**: 5 tasks (35%)
- **High**: 6 tasks (43%)
- **Medium**: 2 tasks (14%)
- **Low**: 1 task (7%)

### Phase Timeline
- **Phase 1**: Core Camera System (4 hours)
- **Phase 2**: UI Integration (3 hours)
- **Phase 3**: 2D Optimizations (4 hours)
- **Phase 4**: Testing & Documentation (3 hours)

### Risk Factors
1. **Camera transition smoothness** - May need additional optimization
2. **Control behavior conflicts** - Thorough testing required
3. **Performance impact** - Monitor frame rate closely
4. **Mobile compatibility** - Test touch controls extensively

### Success Metrics
- [ ] Feature works as specified
- [ ] All tests passing
- [ ] Performance targets met
- [ ] No regression in existing features
- [ ] Positive user feedback

---

## Next Steps

After completing all tasks:

1. **Code Review** - Get peer review of implementation
2. **User Testing** - Gather feedback from CAD users
3. **Performance Audit** - Ensure targets are met
4. **Documentation Review** - Verify completeness
5. **Release Planning** - Coordinate deployment

---

## Notes

- Follow inline styling convention throughout
- Maintain TypeScript strict mode
- Use existing Zustand patterns
- Test on multiple browsers
- Consider accessibility requirements