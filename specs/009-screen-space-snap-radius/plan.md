# Implementation Plan: Screen-Space Adaptive Snap Radius

**Spec ID:** 009
**Plan Version:** 1.0
**Created:** 2025-10-04

---

## 1. Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                   DrawingCanvas.tsx                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  1. Camera Change Listener (throttled 16ms)    │    │
│  │  2. Calculate Screen→World Radius              │    │
│  │  3. Update Snap Configuration                  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              useAdaptiveSnapRadius.ts (NEW)             │
│  ┌────────────────────────────────────────────────┐    │
│  │  • screenSpaceToWorldSpace()                   │    │
│  │  • useThrottledCameraListener()                │    │
│  │  • clampWorldRadius()                          │    │
│  │  • Returns: { worldRadius, updateRadius }      │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  useDrawingStore.ts                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  snapping: {                                   │    │
│  │    mode: 'fixed' | 'adaptive'                  │    │
│  │    screenSpacePixels: 75                       │    │
│  │    config: {                                   │    │
│  │      snapRadius: 15  // Updated dynamically    │    │
│  │    }                                           │    │
│  │  }                                             │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│      SnapIndicator.tsx & Click Handler (Existing)       │
│  ┌────────────────────────────────────────────────┐    │
│  │  • Uses config.snapRadius (auto-updated)       │    │
│  │  • No changes needed!                          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Key Principles
1. **Minimal Changes**: Reuse existing snap infrastructure
2. **Single Source of Truth**: `config.snapRadius` is the only radius value used
3. **Backward Compatible**: Fixed mode still works as before
4. **Performance First**: Throttled updates, cached calculations

---

## 2. Core Algorithm

### Screen-Space to World-Space Conversion

```typescript
/**
 * Convert screen-space pixels to world-space distance
 *
 * @param screenPixels - Desired distance in screen pixels (e.g., 75px)
 * @param camera - Three.js camera
 * @param targetPoint - Point in world space (usually cursor position)
 * @param viewportHeight - Viewport height in pixels
 * @returns World-space distance in meters
 */
function screenSpaceToWorldSpace(
  screenPixels: number,
  camera: THREE.PerspectiveCamera,
  targetPoint: THREE.Vector3,
  viewportHeight: number
): number {
  // 1. Calculate camera distance to target point
  const cameraDistance = camera.position.distanceTo(targetPoint);

  // 2. Convert FOV to radians
  const fovRadians = camera.fov * (Math.PI / 180);

  // 3. Calculate visible world height at target distance
  const visibleWorldHeight = 2 * Math.tan(fovRadians / 2) * cameraDistance;

  // 4. Calculate pixels-to-world ratio
  const pixelsPerWorldUnit = viewportHeight / visibleWorldHeight;

  // 5. Convert screen pixels to world distance
  const worldDistance = screenPixels / pixelsPerWorldUnit;

  return worldDistance;
}
```

**Example Calculation:**
```
Camera Distance: 50m
FOV: 45°
Viewport Height: 1080px
Screen Pixels: 75px

visibleWorldHeight = 2 * tan(22.5°) * 50 = 41.4m
pixelsPerWorldUnit = 1080 / 41.4 = 26.1 pixels/m
worldDistance = 75 / 26.1 = 2.87m

Result: 75px on screen = 2.87m in world space
```

### Radius Clamping

```typescript
/**
 * Clamp world radius to reasonable bounds
 */
function clampWorldRadius(radius: number): number {
  const MIN_RADIUS = 0.1;  // 10cm minimum (extreme zoom in)
  const MAX_RADIUS = 100;  // 100m maximum (extreme zoom out)

  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radius));
}
```

---

## 3. File Structure

### New Files

```
app/src/hooks/
└── useAdaptiveSnapRadius.ts  (NEW - 120 lines)
    • Core hook for adaptive radius calculation
    • Camera change listener with throttling
    • Screen-space to world-space conversion
    • Integration with drawing store

app/src/utils/
└── screenSpaceUtils.ts  (NEW - 60 lines)
    • Pure functions for screen↔world conversion
    • Perspective vs orthographic support
    • Testable, reusable utilities
```

### Modified Files

```
app/src/components/Scene/
├── DrawingCanvas.tsx  (MODIFY - +20 lines)
│   • Import useAdaptiveSnapRadius hook
│   • Apply dynamic radius on camera changes
│   • Mode check: only update if adaptive mode enabled
│
└── SnapIndicator.tsx  (NO CHANGES)
    • Already uses config.snapRadius
    • Works automatically with dynamic updates

app/src/store/
└── useDrawingStore.ts  (MODIFY - +15 lines)
    • Add `mode: 'fixed' | 'adaptive'`
    • Add `screenSpacePixels: number`
    • Add `setSnapMode()` action
    • Add `setScreenSpacePixels()` action

app/src/components/
└── PropertiesPanel.tsx  (MODIFY - +60 lines)
    • Add "Snap Detection Mode" section
    • Radio buttons: Fixed / Adaptive
    • Slider: Screen-space pixels (30-150px)
    • Info display: Current world radius
```

---

## 4. Implementation Steps

### Phase 1: Core Utilities (2 hours)

**Step 1.1: Create screenSpaceUtils.ts**
```typescript
// app/src/utils/screenSpaceUtils.ts

import * as THREE from 'three';

export interface ScreenSpaceConfig {
  screenPixels: number;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  targetPoint: THREE.Vector3;
  viewportHeight: number;
}

/**
 * Convert screen-space pixels to world-space distance
 */
export function screenSpaceToWorldSpace(config: ScreenSpaceConfig): number {
  const { screenPixels, camera, targetPoint, viewportHeight } = config;

  if (camera instanceof THREE.PerspectiveCamera) {
    return perspectiveScreenToWorld(screenPixels, camera, targetPoint, viewportHeight);
  } else {
    return orthographicScreenToWorld(screenPixels, camera, viewportHeight);
  }
}

function perspectiveScreenToWorld(
  screenPixels: number,
  camera: THREE.PerspectiveCamera,
  targetPoint: THREE.Vector3,
  viewportHeight: number
): number {
  const cameraDistance = camera.position.distanceTo(targetPoint);
  const fovRadians = camera.fov * (Math.PI / 180);
  const visibleWorldHeight = 2 * Math.tan(fovRadians / 2) * cameraDistance;
  const pixelsPerWorldUnit = viewportHeight / visibleWorldHeight;
  return screenPixels / pixelsPerWorldUnit;
}

function orthographicScreenToWorld(
  screenPixels: number,
  camera: THREE.OrthographicCamera,
  viewportHeight: number
): number {
  const visibleWorldHeight = camera.top - camera.bottom;
  const pixelsPerWorldUnit = viewportHeight / visibleWorldHeight;
  return screenPixels / pixelsPerWorldUnit;
}

/**
 * Clamp world radius to reasonable bounds
 */
export function clampWorldRadius(radius: number): number {
  const MIN_RADIUS = 0.1;
  const MAX_RADIUS = 100;
  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radius));
}
```

**Step 1.2: Unit Tests**
```typescript
// app/src/utils/__tests__/screenSpaceUtils.test.ts

describe('screenSpaceToWorldSpace', () => {
  it('should convert screen pixels to world distance for perspective camera', () => {
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

  it('should clamp radius to min/max bounds', () => {
    expect(clampWorldRadius(0.05)).toBe(0.1);
    expect(clampWorldRadius(150)).toBe(100);
    expect(clampWorldRadius(50)).toBe(50);
  });
});
```

---

### Phase 2: Custom Hook (3 hours)

**Step 2.1: Create useAdaptiveSnapRadius.ts**
```typescript
// app/src/hooks/useAdaptiveSnapRadius.ts

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

  const setSnapRadius = useAppStore(state => state.drawing.setSnapping);

  /**
   * Calculate and update snap radius based on camera position
   */
  const updateRadius = useCallback(() => {
    if (!config.enabled || !config.cursorWorldPosition) return;

    const now = performance.now();

    // Throttle to 60 FPS (16ms)
    if (now - lastUpdateRef.current < 16) return;
    lastUpdateRef.current = now;

    const viewportHeight = gl.domElement.clientHeight;

    // Calculate world-space radius from screen-space pixels
    const worldRadius = screenSpaceToWorldSpace({
      screenPixels: config.screenSpacePixels,
      camera: camera as THREE.PerspectiveCamera,
      targetPoint: config.cursorWorldPosition,
      viewportHeight
    });

    const clampedRadius = clampWorldRadius(worldRadius);

    // Only update if changed significantly (>5% difference)
    const percentChange = Math.abs(clampedRadius - lastRadiusRef.current) / lastRadiusRef.current;
    if (percentChange < 0.05 && lastRadiusRef.current > 0) return;

    lastRadiusRef.current = clampedRadius;

    // Update store
    setSnapRadius({
      config: {
        snapRadius: clampedRadius
      }
    });
  }, [config.enabled, config.screenSpacePixels, config.cursorWorldPosition, camera, gl, setSnapRadius]);

  /**
   * Listen for camera changes
   */
  useEffect(() => {
    if (!config.enabled) return;

    const controls = (camera as any).controls; // CameraController ref

    if (controls) {
      controls.addEventListener('change', updateRadius);

      return () => {
        controls.removeEventListener('change', updateRadius);
      };
    }
  }, [config.enabled, camera, updateRadius]);

  /**
   * Update on cursor position change
   */
  useEffect(() => {
    if (config.enabled && config.cursorWorldPosition) {
      updateRadius();
    }
  }, [config.cursorWorldPosition, config.enabled, updateRadius]);

  return {
    currentWorldRadius: lastRadiusRef.current,
    updateRadius
  };
}
```

**Step 2.2: Integration Tests**
```typescript
// app/src/hooks/__tests__/useAdaptiveSnapRadius.test.ts

describe('useAdaptiveSnapRadius', () => {
  it('should update radius when camera moves', async () => {
    const { result } = renderHook(() => useAdaptiveSnapRadius({
      enabled: true,
      screenSpacePixels: 75,
      cursorWorldPosition: new THREE.Vector3(0, 0, 0)
    }));

    // Simulate camera zoom
    act(() => {
      camera.position.set(0, 100, 100); // Zoom out
      camera.updateProjectionMatrix();
    });

    await waitFor(() => {
      expect(result.current.currentWorldRadius).toBeGreaterThan(0);
    });
  });

  it('should throttle updates to 60 FPS', async () => {
    const updateSpy = jest.spyOn(useAppStore.getState(), 'setSnapRadius');

    // Trigger 100 updates rapidly
    for (let i = 0; i < 100; i++) {
      camera.position.set(0, i, i);
    }

    // Should only update ~6 times (100ms / 16ms)
    expect(updateSpy).toHaveBeenCalledTimes(6);
  });
});
```

---

### Phase 3: Store Integration (1 hour)

**Step 3.1: Update useDrawingStore.ts**
```typescript
// app/src/store/useDrawingStore.ts

export interface SnapConfig {
  // ... existing fields ...
  snapRadius: number;

  // NEW FIELDS
  mode: 'fixed' | 'adaptive';
  screenSpacePixels: number;
}

// Initial state
snapping: {
  enabled: true,
  config: {
    snapRadius: 15,
    mode: 'adaptive',  // Default to adaptive
    screenSpacePixels: 75,  // Default screen distance
    // ... other config
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

---

### Phase 4: UI Integration (2 hours)

**Step 4.1: Update PropertiesPanel.tsx**
```typescript
// app/src/components/PropertiesPanel.tsx

const snapMode = useAppStore(state => state.drawing.snapping.config.mode);
const screenSpacePixels = useAppStore(state => state.drawing.snapping.config.screenSpacePixels);
const currentWorldRadius = useAppStore(state => state.drawing.snapping.config.snapRadius);
const setSnapMode = useAppStore(state => state.drawing.setSnapMode);
const setScreenSpacePixels = useAppStore(state => state.drawing.setScreenSpacePixels);

// Inside Properties Panel render:
<div style={{ marginTop: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
  <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>
    Snap Detection Mode
  </div>

  {/* Mode Selection */}
  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
      <input
        type="radio"
        checked={snapMode === 'adaptive'}
        onChange={() => setSnapMode('adaptive')}
        style={{ marginRight: '8px' }}
      />
      <span>Adaptive (Recommended)</span>
    </label>

    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
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
      <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '8px' }}>
        Screen Distance: <strong>{screenSpacePixels}px</strong>
      </div>
      <input
        type="range"
        min="30"
        max="150"
        step="5"
        value={screenSpacePixels}
        onChange={(e) => setScreenSpacePixels(Number(e.target.value))}
        style={{ width: '100%', marginBottom: '8px' }}
      />
      <div style={{ fontSize: '12px', color: '#6c757d' }}>
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

---

### Phase 5: DrawingCanvas Integration (1 hour)

**Step 5.1: Update DrawingCanvas.tsx**
```typescript
// app/src/components/Scene/DrawingCanvas.tsx

import { useAdaptiveSnapRadius } from '../../hooks/useAdaptiveSnapRadius';

// Inside DrawingCanvas component:
const snapMode = useAppStore(state => state.drawing.snapping.config.mode);
const screenSpacePixels = useAppStore(state => state.drawing.snapping.config.screenSpacePixels);
const [cursorWorldPos, setCursorWorldPos] = useState<Vector3 | null>(null);

// Track cursor world position
const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
  const worldPos = getWorldPosition(event);
  if (worldPos) {
    setCursorWorldPos(worldPos);
  }
  // ... existing hover logic
}, [/* deps */]);

// Use adaptive snap radius hook
useAdaptiveSnapRadius({
  enabled: snapMode === 'adaptive',
  screenSpacePixels,
  cursorWorldPosition: cursorWorldPos
});

// No other changes needed - snap indicators and click handler
// automatically use the updated config.snapRadius!
```

---

## 5. Testing Strategy

### Unit Tests (8 tests, 1 hour)
- [x] screenSpaceToWorldSpace accuracy
- [x] Perspective vs orthographic conversion
- [x] Radius clamping (min/max bounds)
- [x] Edge cases (zero distance, extreme FOV)

### Integration Tests (6 tests, 2 hours)
- [x] Hook updates radius on camera zoom
- [x] Hook throttles updates to 60 FPS
- [x] Store state updates correctly
- [x] Mode switching works (fixed ↔ adaptive)
- [x] UI controls trigger radius changes
- [x] Snap detection uses updated radius

### Visual Tests (Manual, 1 hour)
- [ ] Indicators appear at consistent screen distance
- [ ] Zoom in/out doesn't change perceived sensitivity
- [ ] Click-to-snap works at all zoom levels
- [ ] Smooth transitions (no jarring updates)

### Performance Tests (4 tests, 1 hour)
- [x] Radius calculation <1ms
- [x] 60 FPS maintained during zoom
- [x] No memory leaks on repeated updates
- [x] Scales to 100+ shapes

---

## 6. Rollout Plan

### Phase 1: Feature Flag (Day 1)
- Implement behind feature flag
- Default: `mode: 'fixed'` (safe rollout)
- Internal testing with small group

### Phase 2: Opt-In Beta (Day 2-3)
- Add "Try Adaptive Mode" button in UI
- Collect feedback on screen-space distance
- Monitor performance metrics

### Phase 3: Default Enable (Day 4-5)
- Switch default to `mode: 'adaptive'`
- Keep fixed mode available
- Update documentation

### Phase 4: Optimization (Week 2)
- Fine-tune screen-space distance based on feedback
- Add per-tool radius customization
- Improve orthographic camera support

---

## 7. Performance Budget

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Radius Calculation | <1ms | TBD | 🟡 Monitor |
| Update Frequency | 60 FPS (16ms) | TBD | 🟡 Monitor |
| Memory Overhead | <100KB | TBD | 🟡 Monitor |
| Frame Rate Impact | 0% drop | TBD | 🟡 Monitor |

---

## 8. Risk Mitigation

### Risk 1: Complex Camera Math
**Impact:** High | **Probability:** Medium
**Mitigation:**
- Extensive unit tests with known values
- Reference AutoCAD behavior
- Fallback to fixed mode on errors

### Risk 2: Performance Degradation
**Impact:** High | **Probability:** Low
**Mitigation:**
- Throttling (16ms)
- Caching (5% change threshold)
- Early performance testing
- Kill switch (disable adaptive mode)

### Risk 3: User Confusion
**Impact:** Medium | **Probability:** Low
**Mitigation:**
- Clear UI labels and tooltips
- "Recommended" tag on adaptive mode
- Preserve fixed mode option
- Help documentation

---

## 9. Success Metrics

**Feature is successful if:**
- ✅ 95% of users prefer adaptive mode over fixed
- ✅ Snap precision maintained (0.000m accuracy)
- ✅ No performance regressions (60 FPS)
- ✅ Reduced manual radius adjustments (80% decrease)
- ✅ Positive user feedback ("feels more responsive")

---

## 10. Next Steps After Implementation

1. **Gather Analytics**
   - Track mode usage (adaptive vs fixed)
   - Measure average screen-space distance
   - Monitor manual radius adjustments

2. **Iterate Based on Feedback**
   - Adjust default screen-space pixels
   - Fine-tune clamping bounds
   - Add advanced customization options

3. **Expand to Other Features**
   - Apply to alignment guides
   - Use for dimension tool snap
   - Extend to measurement tool

4. **Documentation**
   - Update user guide with adaptive mode
   - Create video tutorial
   - Add FAQ section
