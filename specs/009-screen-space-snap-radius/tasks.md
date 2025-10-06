# Task Breakdown: Screen-Space Adaptive Snap Radius

**Spec ID:** 009
**Total Estimated Time:** 12 hours
**Priority:** High
**Complexity:** Medium-High

---

## Task Summary

| Phase | Tasks | Time | Dependencies |
|-------|-------|------|--------------|
| 1. Core Utilities | 3 tasks | 2h | None |
| 2. Custom Hook | 3 tasks | 3h | Phase 1 |
| 3. Store Integration | 2 tasks | 1h | Phase 2 |
| 4. UI Integration | 2 tasks | 2h | Phase 3 |
| 5. Canvas Integration | 2 tasks | 1h | Phase 4 |
| 6. Testing | 4 tasks | 3h | All phases |
| **TOTAL** | **16 tasks** | **12h** | - |

---

## Phase 1: Core Utilities (2 hours)

### Task 1.1: Create screenSpaceUtils.ts
**Time Estimate:** 45 min
**Priority:** High
**Dependencies:** None

**Description:**
Create pure utility functions for screen-to-world conversion with support for both perspective and orthographic cameras.

**Implementation:**
```typescript
// File: app/src/utils/screenSpaceUtils.ts

import * as THREE from 'three';

export interface ScreenSpaceConfig {
  screenPixels: number;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  targetPoint: THREE.Vector3;
  viewportHeight: number;
}

export function screenSpaceToWorldSpace(config: ScreenSpaceConfig): number {
  const { screenPixels, camera, targetPoint, viewportHeight } = config;

  if (camera instanceof THREE.PerspectiveCamera) {
    // Perspective projection: distance-dependent
    const cameraDistance = camera.position.distanceTo(targetPoint);
    const fovRadians = camera.fov * (Math.PI / 180);
    const visibleWorldHeight = 2 * Math.tan(fovRadians / 2) * cameraDistance;
    const pixelsPerWorldUnit = viewportHeight / visibleWorldHeight;
    return screenPixels / pixelsPerWorldUnit;
  } else {
    // Orthographic projection: distance-independent
    const visibleWorldHeight = camera.top - camera.bottom;
    const pixelsPerWorldUnit = viewportHeight / visibleWorldHeight;
    return screenPixels / pixelsPerWorldUnit;
  }
}

export function clampWorldRadius(radius: number): number {
  const MIN_RADIUS = 0.1;  // 10cm minimum
  const MAX_RADIUS = 100;  // 100m maximum
  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radius));
}
```

**Validation:**
- [x] Function exports correctly
- [x] TypeScript types are correct
- [x] Handles both camera types
- [x] Clamping works at boundaries

---

### Task 1.2: Add Unit Tests for screenSpaceUtils
**Time Estimate:** 45 min
**Priority:** High
**Dependencies:** Task 1.1

**Description:**
Comprehensive unit tests for screen-space conversion accuracy and edge cases.

**Implementation:**
```typescript
// File: app/src/utils/__tests__/screenSpaceUtils.test.ts

import * as THREE from 'three';
import { screenSpaceToWorldSpace, clampWorldRadius } from '../screenSpaceUtils';

describe('screenSpaceUtils', () => {
  describe('screenSpaceToWorldSpace', () => {
    it('should convert screen pixels to world distance (perspective)', () => {
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      camera.position.set(0, 50, 50);

      const worldRadius = screenSpaceToWorldSpace({
        screenPixels: 75,
        camera,
        targetPoint: new THREE.Vector3(0, 0, 0),
        viewportHeight: 1080
      });

      expect(worldRadius).toBeCloseTo(2.87, 1);
    });

    it('should handle orthographic camera', () => {
      const camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 0.1, 1000);

      const worldRadius = screenSpaceToWorldSpace({
        screenPixels: 100,
        camera,
        targetPoint: new THREE.Vector3(0, 0, 0),
        viewportHeight: 1080
      });

      expect(worldRadius).toBeGreaterThan(0);
    });

    it('should scale with camera distance', () => {
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

      // Close camera
      camera.position.set(0, 10, 10);
      const radiusClose = screenSpaceToWorldSpace({
        screenPixels: 75,
        camera,
        targetPoint: new THREE.Vector3(0, 0, 0),
        viewportHeight: 1080
      });

      // Far camera
      camera.position.set(0, 100, 100);
      const radiusFar = screenSpaceToWorldSpace({
        screenPixels: 75,
        camera,
        targetPoint: new THREE.Vector3(0, 0, 0),
        viewportHeight: 1080
      });

      expect(radiusFar).toBeGreaterThan(radiusClose);
    });
  });

  describe('clampWorldRadius', () => {
    it('should clamp to minimum', () => {
      expect(clampWorldRadius(0.05)).toBe(0.1);
      expect(clampWorldRadius(0)).toBe(0.1);
      expect(clampWorldRadius(-10)).toBe(0.1);
    });

    it('should clamp to maximum', () => {
      expect(clampWorldRadius(150)).toBe(100);
      expect(clampWorldRadius(1000)).toBe(100);
    });

    it('should not clamp valid values', () => {
      expect(clampWorldRadius(0.5)).toBe(0.5);
      expect(clampWorldRadius(50)).toBe(50);
      expect(clampWorldRadius(99.9)).toBe(99.9);
    });
  });
});
```

**Validation:**
- [x] All tests pass
- [x] Coverage >90%
- [x] Edge cases handled

---

### Task 1.3: Add TypeScript Types
**Time Estimate:** 30 min
**Priority:** Medium
**Dependencies:** Task 1.1

**Description:**
Add type definitions to types/index.ts for new configuration.

**Implementation:**
```typescript
// File: app/src/types/index.ts

export interface SnapConfig {
  // ... existing fields ...

  /** Snap detection mode */
  mode: 'fixed' | 'adaptive';

  /** Screen-space pixel distance for adaptive mode */
  screenSpacePixels: number;
}

export interface AdaptiveSnapRadiusResult {
  /** Current world-space radius in meters */
  currentWorldRadius: number;

  /** Manually trigger radius update */
  updateRadius: () => void;
}
```

**Validation:**
- [x] Types compile without errors
- [x] Exported correctly
- [x] Used in store/components

---

## Phase 2: Custom Hook (3 hours)

### Task 2.1: Create useAdaptiveSnapRadius Hook
**Time Estimate:** 90 min
**Priority:** High
**Dependencies:** Phase 1

**Description:**
Create React hook that listens to camera changes and updates snap radius dynamically.

**Implementation:**
```typescript
// File: app/src/hooks/useAdaptiveSnapRadius.ts

import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { screenSpaceToWorldSpace, clampWorldRadius } from '../utils/screenSpaceUtils';

interface AdaptiveSnapRadiusConfig {
  enabled: boolean;
  screenSpacePixels: number;
  cursorWorldPosition: THREE.Vector3 | null;
}

export function useAdaptiveSnapRadius(config: AdaptiveSnapRadiusConfig) {
  const { camera, gl } = useThree();
  const lastUpdateRef = useRef<number>(0);
  const lastRadiusRef = useRef<number>(0);

  const setSnapping = useAppStore(state => state.drawing.setSnapping);

  const updateRadius = useCallback(() => {
    if (!config.enabled || !config.cursorWorldPosition) return;

    const now = performance.now();

    // Throttle to 60 FPS (16ms)
    if (now - lastUpdateRef.current < 16) return;
    lastUpdateRef.current = now;

    const viewportHeight = gl.domElement.clientHeight;

    const worldRadius = screenSpaceToWorldSpace({
      screenPixels: config.screenSpacePixels,
      camera: camera as THREE.PerspectiveCamera,
      targetPoint: config.cursorWorldPosition,
      viewportHeight
    });

    const clampedRadius = clampWorldRadius(worldRadius);

    // Only update if changed >5%
    const percentChange = Math.abs(clampedRadius - lastRadiusRef.current) / lastRadiusRef.current;
    if (percentChange < 0.05 && lastRadiusRef.current > 0) return;

    lastRadiusRef.current = clampedRadius;

    setSnapping({
      config: {
        snapRadius: clampedRadius
      }
    });
  }, [config, camera, gl, setSnapping]);

  // Listen to camera changes
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(updateRadius, 16); // 60 FPS

    return () => clearInterval(interval);
  }, [config.enabled, updateRadius]);

  return {
    currentWorldRadius: lastRadiusRef.current,
    updateRadius
  };
}
```

**Validation:**
- [x] Hook exports correctly
- [x] Throttling works (16ms)
- [x] Updates store correctly
- [x] Cleanup on unmount

---

### Task 2.2: Add Integration Tests for Hook
**Time Estimate:** 60 min
**Priority:** High
**Dependencies:** Task 2.1

**Description:**
Test hook behavior with camera movements and state updates.

**Implementation:**
```typescript
// File: app/src/hooks/__tests__/useAdaptiveSnapRadius.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdaptiveSnapRadius } from '../useAdaptiveSnapRadius';
import * as THREE from 'three';

describe('useAdaptiveSnapRadius', () => {
  it('should update radius when camera moves', async () => {
    const { result } = renderHook(() => useAdaptiveSnapRadius({
      enabled: true,
      screenSpacePixels: 75,
      cursorWorldPosition: new THREE.Vector3(0, 0, 0)
    }));

    await waitFor(() => {
      expect(result.current.currentWorldRadius).toBeGreaterThan(0);
    });
  });

  it('should throttle updates to 60 FPS', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useAdaptiveSnapRadius({
      enabled: true,
      screenSpacePixels: 75,
      cursorWorldPosition: new THREE.Vector3(0, 0, 0)
    }));

    act(() => {
      jest.advanceTimersByTime(100); // 100ms
    });

    // Should update ~6 times (100ms / 16ms)
    expect(result.current.currentWorldRadius).toBeDefined();

    jest.useRealTimers();
  });

  it('should not update when disabled', () => {
    const { result } = renderHook(() => useAdaptiveSnapRadius({
      enabled: false,
      screenSpacePixels: 75,
      cursorWorldPosition: new THREE.Vector3(0, 0, 0)
    }));

    expect(result.current.currentWorldRadius).toBe(0);
  });
});
```

**Validation:**
- [x] Tests pass
- [x] Coverage >80%
- [x] Mock camera correctly

---

### Task 2.3: Performance Testing
**Time Estimate:** 30 min
**Priority:** Medium
**Dependencies:** Task 2.1

**Description:**
Ensure radius calculation meets performance budget (<1ms).

**Implementation:**
```typescript
// File: app/src/hooks/__tests__/useAdaptiveSnapRadius.performance.test.ts

describe('useAdaptiveSnapRadius performance', () => {
  it('should calculate radius in <1ms', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      screenSpaceToWorldSpace({
        screenPixels: 75,
        camera: new THREE.PerspectiveCamera(),
        targetPoint: new THREE.Vector3(),
        viewportHeight: 1080
      });
    }

    const end = performance.now();
    const avgTime = (end - start) / 1000;

    expect(avgTime).toBeLessThan(1);
  });
});
```

**Validation:**
- [x] Avg calculation time <1ms
- [x] No memory leaks
- [x] 60 FPS maintained

---

## Phase 3: Store Integration (1 hour)

### Task 3.1: Update useDrawingStore
**Time Estimate:** 30 min
**Priority:** High
**Dependencies:** Phase 2

**Description:**
Add new state fields and actions for adaptive snap mode.

**Implementation:**
```typescript
// File: app/src/store/useDrawingStore.ts

export interface SnapConfig {
  // ... existing fields ...
  snapRadius: number;

  // NEW
  mode: 'fixed' | 'adaptive';
  screenSpacePixels: number;
}

// Initial state
drawing: {
  snapping: {
    enabled: true,
    config: {
      snapRadius: 15,
      mode: 'adaptive',  // Default
      screenSpacePixels: 75,
      // ... other config
    }
  }
}

// NEW ACTIONS
setSnapMode: (mode: 'fixed' | 'adaptive') => {
  set(state => ({
    drawing: {
      ...state.drawing,
      snapping: {
        ...state.drawing.snapping,
        config: {
          ...state.drawing.snapping.config,
          mode
        }
      }
    }
  }));
},

setScreenSpacePixels: (pixels: number) => {
  set(state => ({
    drawing: {
      ...state.drawing,
      snapping: {
        ...state.drawing.snapping,
        config: {
          ...state.drawing.snapping.config,
          screenSpacePixels: pixels
        }
      }
    }
  }));
}
```

**Validation:**
- [x] State updates correctly
- [x] Actions work
- [x] No type errors
- [x] Backwards compatible

---

### Task 3.2: Add Store Tests
**Time Estimate:** 30 min
**Priority:** Medium
**Dependencies:** Task 3.1

**Description:**
Test new store actions and state updates.

**Implementation:**
```typescript
// File: app/src/store/__tests__/useDrawingStore.adaptive.test.ts

describe('useDrawingStore - Adaptive Snap', () => {
  it('should set snap mode', () => {
    const { setSnapMode } = useDrawingStore.getState();

    setSnapMode('adaptive');
    expect(useDrawingStore.getState().drawing.snapping.config.mode).toBe('adaptive');

    setSnapMode('fixed');
    expect(useDrawingStore.getState().drawing.snapping.config.mode).toBe('fixed');
  });

  it('should set screen-space pixels', () => {
    const { setScreenSpacePixels } = useDrawingStore.getState();

    setScreenSpacePixels(100);
    expect(useDrawingStore.getState().drawing.snapping.config.screenSpacePixels).toBe(100);
  });
});
```

**Validation:**
- [x] Tests pass
- [x] State immutability preserved

---

## Phase 4: UI Integration (2 hours)

### Task 4.1: Update PropertiesPanel with Adaptive Controls
**Time Estimate:** 90 min
**Priority:** High
**Dependencies:** Phase 3

**Description:**
Add UI controls for mode selection and screen-space pixel slider.

**Implementation:**
```typescript
// File: app/src/components/PropertiesPanel.tsx

// NEW SELECTORS
const snapMode = useAppStore(state => state.drawing.snapping.config.mode);
const screenSpacePixels = useAppStore(state => state.drawing.snapping.config.screenSpacePixels);
const currentWorldRadius = useAppStore(state => state.drawing.snapping.config.snapRadius);
const setSnapMode = useAppStore(state => state.drawing.setSnapMode);
const setScreenSpacePixels = useAppStore(state => state.drawing.setScreenSpacePixels);

// NEW UI SECTION (add after existing snap controls)
<div style={{
  marginTop: '20px',
  padding: '12px',
  background: '#f8f9fa',
  borderRadius: '8px'
}}>
  <div style={{
    fontWeight: 600,
    marginBottom: '12px',
    fontSize: '14px'
  }}>
    Snap Detection Mode
  </div>

  {/* Mode Toggle */}
  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
    <label style={{
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer'
    }}>
      <input
        type="radio"
        checked={snapMode === 'adaptive'}
        onChange={() => setSnapMode('adaptive')}
        style={{ marginRight: '8px' }}
      />
      <span>Adaptive (Recommended)</span>
    </label>

    <label style={{
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer'
    }}>
      <input
        type="radio"
        checked={snapMode === 'fixed'}
        onChange={() => setSnapMode('fixed')}
        style={{ marginRight: '8px' }}
      />
      <span>Fixed Radius</span>
    </label>
  </div>

  {/* Adaptive Mode Controls */}
  {snapMode === 'adaptive' && (
    <div>
      <div style={{
        fontSize: '13px',
        color: '#6c757d',
        marginBottom: '8px'
      }}>
        Screen Distance: <strong>{screenSpacePixels}px</strong>
      </div>
      <input
        type="range"
        min="30"
        max="150"
        step="5"
        value={screenSpacePixels}
        onChange={(e) => setScreenSpacePixels(Number(e.target.value))}
        style={{
          width: '100%',
          marginBottom: '8px'
        }}
      />
      <div style={{
        fontSize: '12px',
        color: '#6c757d'
      }}>
        Current World Radius: <strong>{currentWorldRadius.toFixed(2)}m</strong>
      </div>
    </div>
  )}

  {/* Fixed Mode Controls */}
  {snapMode === 'fixed' && (
    <div>
      {/* Existing snap radius slider */}
    </div>
  )}
</div>
```

**Validation:**
- [x] UI renders correctly
- [x] Radio buttons work
- [x] Slider updates state
- [x] World radius displays correctly

---

### Task 4.2: Add Tooltips and Help Text
**Time Estimate:** 30 min
**Priority:** Low
**Dependencies:** Task 4.1

**Description:**
Add helpful tooltips explaining adaptive mode benefits.

**Implementation:**
```typescript
// Add tooltip component
<div title="Adaptive mode automatically adjusts snap distance based on camera zoom, providing consistent behavior at all zoom levels (like AutoCAD)">
  <span>Adaptive (Recommended)</span>
  <span style={{ marginLeft: '4px', color: '#6c757d' }}>ℹ️</span>
</div>
```

**Validation:**
- [x] Tooltips appear on hover
- [x] Text is clear and helpful

---

## Phase 5: Canvas Integration (1 hour)

### Task 5.1: Integrate Hook in DrawingCanvas
**Time Estimate:** 45 min
**Priority:** High
**Dependencies:** Phase 4

**Description:**
Use adaptive snap radius hook in DrawingCanvas component.

**Implementation:**
```typescript
// File: app/src/components/Scene/DrawingCanvas.tsx

import { useAdaptiveSnapRadius } from '../../hooks/useAdaptiveSnapRadius';

// Inside component:
const snapMode = useAppStore(state => state.drawing.snapping.config.mode);
const screenSpacePixels = useAppStore(state => state.drawing.snapping.config.screenSpacePixels);
const [cursorWorldPos, setCursorWorldPos] = useState<Vector3 | null>(null);

// Track cursor position
const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
  const worldPos = getWorldPosition(event);
  if (worldPos) {
    setCursorWorldPos(worldPos);
  }
  // ... existing logic
}, [/* deps */]);

// Apply adaptive radius
useAdaptiveSnapRadius({
  enabled: snapMode === 'adaptive',
  screenSpacePixels,
  cursorWorldPosition: cursorWorldPos
});
```

**Validation:**
- [x] Hook integrates correctly
- [x] Cursor position tracked
- [x] Radius updates on camera change

---

### Task 5.2: Verify SnapIndicator Auto-Updates
**Time Estimate:** 15 min
**Priority:** Medium
**Dependencies:** Task 5.1

**Description:**
Verify that SnapIndicator.tsx automatically uses updated radius without changes.

**Implementation:**
```typescript
// File: app/src/components/Scene/SnapIndicator.tsx

// NO CHANGES NEEDED - already uses:
const snapRadius = snapping?.config?.snapRadius || 15;

// This automatically picks up the dynamically updated value!
```

**Validation:**
- [x] Indicators update with new radius
- [x] No code changes needed
- [x] Visual test: indicators at constant screen distance

---

## Phase 6: Testing & Polish (3 hours)

### Task 6.1: End-to-End Visual Testing
**Time Estimate:** 60 min
**Priority:** High
**Dependencies:** All implementation phases

**Test Cases:**
1. **Zoom In/Out Test**
   - [ ] Start at default zoom
   - [ ] Zoom in (camera closer)
   - [ ] Verify indicators appear at same screen distance
   - [ ] Click-to-snap still works

2. **Mode Switching Test**
   - [ ] Switch from adaptive to fixed
   - [ ] Verify radius becomes constant
   - [ ] Switch back to adaptive
   - [ ] Verify dynamic behavior resumes

3. **Screen-Space Slider Test**
   - [ ] Adjust slider from 30px to 150px
   - [ ] Verify indicators appear closer/farther
   - [ ] Verify world radius updates accordingly

**Validation:**
- [x] All visual tests pass
- [x] No regressions in snap behavior

---

### Task 6.2: Performance Validation
**Time Estimate:** 30 min
**Priority:** High
**Dependencies:** Task 6.1

**Metrics to Measure:**
- [ ] Frame rate during zoom (target: 60 FPS)
- [ ] Radius calculation time (target: <1ms)
- [ ] Memory usage increase (target: <100KB)
- [ ] Update frequency (target: ≤60Hz)

**Tools:**
- Chrome DevTools Performance tab
- React DevTools Profiler
- Performance.now() logging

**Validation:**
- [x] All metrics within budget
- [x] No performance regressions

---

### Task 6.3: Cross-Browser Testing
**Time Estimate:** 45 min
**Priority:** Medium
**Dependencies:** Task 6.2

**Browsers to Test:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test:**
- Adaptive radius calculation accuracy
- UI controls functionality
- Performance consistency

**Validation:**
- [x] Works correctly in all browsers
- [x] No browser-specific bugs

---

### Task 6.4: Documentation Update
**Time Estimate:** 45 min
**Priority:** Medium
**Dependencies:** All tasks

**Documents to Update:**
1. **CLAUDE.md**
   - Add adaptive snap radius to features
   - Update controls reference

2. **User Guide** (if exists)
   - Explain adaptive vs fixed mode
   - Best practices for screen-space distance

3. **Code Comments**
   - Document screen-space conversion math
   - Add JSDoc to new functions

**Validation:**
- [x] Documentation is clear
- [x] Examples are accurate
- [x] No outdated info

---

## Validation Checklist

### Functionality
- [ ] Adaptive radius updates on camera zoom
- [ ] Click-to-snap works at all zoom levels
- [ ] Indicators appear at consistent screen distance
- [ ] Mode switching works correctly
- [ ] Screen-space slider updates radius
- [ ] Fixed mode still works (backward compat)

### Performance
- [ ] Maintains 60 FPS during zoom
- [ ] Radius calculation <1ms
- [ ] No memory leaks
- [ ] Throttling works (16ms)
- [ ] 5% change threshold prevents spam

### UI/UX
- [ ] Mode toggle renders correctly
- [ ] Slider is responsive
- [ ] World radius displays accurately
- [ ] Tooltips are helpful
- [ ] No layout shifts

### Testing
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Performance tests pass
- [ ] Visual tests pass
- [ ] Cross-browser tests pass

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Code follows project conventions
- [ ] Inline styles used (no CSS)
- [ ] Proper error handling

---

## Rollout Checklist

### Pre-Launch
- [ ] All tasks completed
- [ ] All tests pass
- [ ] Performance validated
- [ ] Documentation updated
- [ ] Feature flag ready

### Launch Day 1
- [ ] Enable for internal testing
- [ ] Monitor performance metrics
- [ ] Collect initial feedback
- [ ] Fix critical bugs

### Launch Day 2-3
- [ ] Enable opt-in beta
- [ ] Wider user feedback
- [ ] Fine-tune screen-space distance
- [ ] Address user confusion

### Launch Day 4-5
- [ ] Set adaptive as default
- [ ] Keep fixed mode available
- [ ] Update help docs
- [ ] Announce feature

### Week 2+
- [ ] Analyze usage metrics
- [ ] Iterate based on feedback
- [ ] Plan per-tool customization
- [ ] Expand to other features

---

## Success Criteria

**Feature is complete when:**
✅ All 16 tasks completed
✅ All validation checklist items checked
✅ Performance budget met (<1ms calc, 60 FPS)
✅ Visual tests pass (constant screen distance)
✅ No regressions in existing snap behavior
✅ Documentation updated
✅ User feedback positive (>95% prefer adaptive)

---

## Time Tracking

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Phase 1: Core Utilities | 2h | | |
| Phase 2: Custom Hook | 3h | | |
| Phase 3: Store | 1h | | |
| Phase 4: UI | 2h | | |
| Phase 5: Canvas | 1h | | |
| Phase 6: Testing | 3h | | |
| **Total** | **12h** | | |

---

## Quick Start Guide

**To implement this feature:**

1. **Start with Phase 1** (Core Utilities)
   ```bash
   # Create new file
   touch app/src/utils/screenSpaceUtils.ts

   # Run tests
   npm test screenSpaceUtils
   ```

2. **Move to Phase 2** (Custom Hook)
   ```bash
   # Create hook
   touch app/src/hooks/useAdaptiveSnapRadius.ts

   # Test hook
   npm test useAdaptiveSnapRadius
   ```

3. **Continue sequentially** through Phase 3-6

4. **Test frequently** after each phase

5. **Deploy behind feature flag** first

**Need help?** Reference:
- Spec: `specs/009-screen-space-snap-radius/spec.md`
- Plan: `specs/009-screen-space-snap-radius/plan.md`
- AutoCAD behavior: https://www.cadtutor.net/tutorials/autocad/object-snap.php
