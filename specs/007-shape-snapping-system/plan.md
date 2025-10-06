# Implementation Plan: Shape Snapping System

**Spec ID**: 007
**Plan Version**: 1.0
**Created**: 2025-10-02
**Implementation Time**: 2-3 hours

---

## Overview

This plan details the technical implementation for enabling the professional CAD-style shape snapping system. The core infrastructure already exists but is disabled by default. Implementation focuses on **configuration changes**, **UI integration**, and **optimization** rather than building new systems.

---

## Architecture Analysis

### Current State

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction                         │
└────────────────────────┬────────────────────────────────────┘
                         │ Mouse Move
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DrawingCanvas.tsx                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ handlePointerMove()                                    │ │
│  │   ├─> getWorldPosition() (raycasting)                 │ │
│  │   ├─> performSnapDetection()  ⚠️ SKIPPED if disabled │ │
│  │   └─> performAlignmentDetection()                     │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ if (snapConfig.enabled)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  SnapGrid.ts                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ updateSnapPoints(shapes, cursor)                       │ │
│  │   ├─> extractSnapPoints() for each shape              │ │
│  │   ├─> Spatial indexing (10m cells)                    │ │
│  │   └─> Cache results                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ findSnapPointsInRadius(cursor, radius)                │ │
│  │   ├─> getNearbyGridKeys() (spatial lookup)            │ │
│  │   ├─> Filter by distance                              │ │
│  │   └─> Sort by strength & proximity                    │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ Snap Points Array
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Zustand Store (useDrawingStore)                 │
│  snapping: {                                                 │
│    config: { enabled: FALSE ← BLOCKING EXECUTION },          │
│    availableSnapPoints: [],                                  │
│    activeSnapPoint: null                                     │
│  }                                                            │
└────────────────────────┬────────────────────────────────────┘
                         │ React Re-render
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               SnapIndicator.tsx                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ limitedSnapPoints (proximity filter)                   │ │
│  │   └─> Max 25 indicators                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ snapMeshes (create Three.js geometry)                  │ │
│  │   ├─> endpoint → CircleGeometry (blue)                │ │
│  │   ├─> midpoint → RingGeometry (orange)                │ │
│  │   ├─> center → LineSegments (green)                   │ │
│  │   └─> grid → PlaneGeometry (gray)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ useFrame() (distance culling & fade)                   │ │
│  │   └─> Hide indicators > 100m from camera              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Bottleneck**: Line 77 in `useDrawingStore.ts`
```typescript
enabled: false  // ← BLOCKING ALL SNAP DETECTION
```

---

## Implementation Phases

### Phase 1: Enable Core Snap System (15 minutes)

#### Step 1.1: Enable Snap Configuration
**File**: `app/src/store/useDrawingStore.ts`
**Lines**: 75-95

**Current Code**:
```typescript
snapping: {
  config: {
    enabled: false,  // ← CHANGE THIS
    snapRadius: 10,
    activeTypes: new Set([]),  // ← POPULATE THIS
    visual: {
      showIndicators: true,
      showSnapLines: true,
      indicatorColor: '#00ff00',
      snapLineColor: '#00ff00',
      indicatorSize: 8,
    },
    performance: {
      maxSnapPoints: 100,  // ← REDUCE TO 25
      updateInterval: 16,
    },
  },
  availableSnapPoints: [],
  activeSnapPoint: null,
  snapPreviewPosition: null,
},
```

**New Code**:
```typescript
snapping: {
  config: {
    enabled: true,  // ✅ ENABLE SNAP SYSTEM
    snapRadius: 5,  // ✅ BALANCED DEFAULT (was 10)
    activeTypes: new Set<SnapType>([  // ✅ ENABLE ESSENTIAL TYPES
      'endpoint',  // Blue circles at corners
      'midpoint',  // Orange squares at edge centers
      'center',    // Green crosshairs at shape centers
      'grid'       // Gray diamonds at grid intersections
    ]),
    visual: {
      showIndicators: true,  // Keep existing
      showSnapLines: true,   // Keep existing
      indicatorColor: '#00ff00',  // Keep existing (unused by SnapIndicator)
      snapLineColor: '#00ff00',   // Keep existing (unused by SnapIndicator)
      indicatorSize: 8,  // Keep existing (unused by SnapIndicator)
    },
    performance: {
      maxSnapPoints: 25,  // ✅ REDUCE FOR PERFORMANCE (was 100)
      updateInterval: 16,  // Keep 60fps throttle
    },
  },
  availableSnapPoints: [],
  activeSnapPoint: null,
  snapPreviewPosition: null,
},
```

**Why These Values**:
- `enabled: true` - Activates snap detection in DrawingCanvas.tsx:137
- `snapRadius: 5` - Balanced default (DrawingCanvas applies mode-specific overrides: 0.05m in 2D, 1.5m in 3D)
- `activeTypes: Set<SnapType>` - TypeScript type annotation needed for proper typing
- Essential types: endpoint, midpoint, center, grid (excludes advanced types for simplicity)
- `maxSnapPoints: 25` - Performance optimization (SnapIndicator already enforces this)

**Testing**:
```bash
# After change, verify snap detection runs
# Open DevTools console
# Mouse over canvas → should see snap detection logs
```

---

#### Step 1.2: Verify SnapIndicator Rendering
**File**: `app/src/components/Scene/SceneManager.tsx`

**Action**: Check if `<SnapIndicator />` is already rendered
**Expected**: Should be present (already implemented)

If missing, add after `<ShapeRenderer />`:
```typescript
<ShapeRenderer />
<SnapIndicator maxDistance={100} />  {/* ← ADD IF MISSING */}
<ActiveSnapIndicator />
```

**Testing**:
```bash
# Start dev server
npm run dev

# Open browser DevTools → React Components
# Search for "SnapIndicator"
# Should see component in tree
```

---

### Phase 2: Visual Optimization for 2D Mode (20 minutes)

#### Step 2.1: Increase Grid Indicator Size in 2D
**File**: `app/src/components/Scene/SnapIndicator.tsx`
**Lines**: 8-11

**Current Code**:
```typescript
const INDICATOR_SIZES = {
  GRID_3D: 0.03,
  GRID_2D: 0.003  // ← TOO SMALL
} as const;
```

**New Code**:
```typescript
const INDICATOR_SIZES = {
  GRID_3D: 0.03,  // 3cm in 3D mode (good)
  GRID_2D: 0.01   // ✅ 1cm in 2D mode (10x larger, more visible)
} as const;
```

**Why**: In 2D top-down view, camera is farther away, so indicators need to be larger for visibility.

**Testing**:
```bash
# In app:
# 1. Enable "Snap to Grid" in Properties Panel
# 2. Click "2D View" button (bottom right)
# 3. Select Rectangle tool
# 4. Move cursor over canvas
# 5. Gray diamond indicators should be clearly visible
```

---

#### Step 2.2: Adjust Opacity for 2D Clarity (Optional)
**File**: `app/src/components/Scene/SnapIndicator.tsx`
**Lines**: 91-144 (materials definition)

**Current Opacity Values**:
```typescript
endpoint: { opacity: 0.8 }
midpoint: { opacity: 0.8 }
center: { opacity: 0.9 }
grid: { opacity: 0.6 }
```

**Potential Adjustment** (if needed after testing):
```typescript
// Make indicators slightly more prominent in 2D mode
const baseOpacity = is2DMode ? 1.0 : 0.8;

const materials = useMemo(() => ({
  endpoint: new THREE.MeshBasicMaterial({
    color: '#3B82F6',
    transparent: true,
    opacity: baseOpacity  // ✅ Dynamic opacity
  }),
  // ... other materials
}), [is2DMode]);  // ✅ Add dependency
```

**Decision Point**: Test with current values first. Only adjust if indicators are hard to see.

---

### Phase 3: UI Control Integration (30 minutes)

#### Step 3.1: Add Snap Toggle to Properties Panel
**File**: `app/src/components/PropertiesPanel.tsx`
**After**: Line 16 (after grid controls)

**New Code to Add**:
```typescript
// After existing imports
import type { SnapType } from '@/types';

// In component body, after existing state selectors (line 16)
const snapEnabled = useAppStore(state => state.drawing.snapping.config.enabled);
const snapRadius = useAppStore(state => state.drawing.snapping.config.snapRadius);
const activeTypes = useAppStore(state => state.drawing.snapping.config.activeTypes);
const updateDrawingState = useAppStore(state => state.updateDrawingState);

// Add toggle functions
const toggleShapeSnap = () => {
  updateDrawingState({
    snapping: {
      ...useAppStore.getState().drawing.snapping,
      config: {
        ...useAppStore.getState().drawing.snapping.config,
        enabled: !snapEnabled
      }
    }
  });
};

const setSnapRadius = (radius: number) => {
  updateDrawingState({
    snapping: {
      ...useAppStore.getState().drawing.snapping,
      config: {
        ...useAppStore.getState().drawing.snapping.config,
        snapRadius: radius
      }
    }
  });
};

const toggleSnapType = (type: SnapType) => {
  const newTypes = new Set(activeTypes);
  if (newTypes.has(type)) {
    newTypes.delete(type);
  } else {
    newTypes.add(type);
  }

  updateDrawingState({
    snapping: {
      ...useAppStore.getState().drawing.snapping,
      config: {
        ...useAppStore.getState().drawing.snapping.config,
        activeTypes: newTypes
      }
    }
  });
};
```

**UI Section to Add** (after Grid Settings section):
```typescript
{/* Shape Snapping Section */}
<div style={{
  marginTop: '20px',
  paddingTop: '15px',
  borderTop: '1px solid #e5e7eb'
}}>
  <div style={{
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <span>Shape Snapping</span>
    <div
      title="Snap to corners, edges, and centers of existing shapes"
      style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: '#9CA3AF',
        color: 'white',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'help',
        fontWeight: 'bold'
      }}
    >
      ?
    </div>
  </div>

  {/* Master Toggle */}
  <label style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#4B5563',
    marginBottom: '12px',
    cursor: 'pointer'
  }}>
    <input
      type="checkbox"
      checked={snapEnabled}
      onChange={toggleShapeSnap}
      style={{
        width: '16px',
        height: '16px',
        cursor: 'pointer'
      }}
    />
    <span>Enable Shape Snapping</span>
  </label>

  {/* Snap Radius Slider */}
  {snapEnabled && (
    <>
      <div style={{
        marginBottom: '8px',
        fontSize: '12px',
        color: '#6B7280'
      }}>
        Snap Radius: <strong>{snapRadius}m</strong>
      </div>
      <input
        type="range"
        min="1"
        max="20"
        step="1"
        value={snapRadius}
        onChange={(e) => setSnapRadius(Number(e.target.value))}
        style={{
          width: '100%',
          marginBottom: '16px'
        }}
      />

      {/* Snap Type Checkboxes */}
      <div style={{
        fontSize: '12px',
        color: '#6B7280',
        marginBottom: '8px'
      }}>
        Snap Types:
      </div>

      {[
        { type: 'endpoint' as SnapType, label: '🔵 Corners', color: '#3B82F6' },
        { type: 'midpoint' as SnapType, label: '🟠 Edges', color: '#F59E0B' },
        { type: 'center' as SnapType, label: '🟢 Centers', color: '#22C55E' },
        { type: 'grid' as SnapType, label: '◇ Grid', color: '#9CA3AF' }
      ].map(({ type, label, color }) => (
        <label
          key={type}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#4B5563',
            marginBottom: '6px',
            cursor: 'pointer'
          }}
        >
          <input
            type="checkbox"
            checked={activeTypes.has(type)}
            onChange={() => toggleSnapType(type)}
            style={{
              width: '14px',
              height: '14px',
              cursor: 'pointer',
              accentColor: color
            }}
          />
          <span>{label}</span>
        </label>
      ))}
    </>
  )}
</div>
```

**Testing**:
```bash
# In app:
# 1. Open Properties Panel (right sidebar)
# 2. Scroll to "Shape Snapping" section
# 3. Toggle "Enable Shape Snapping" checkbox
# 4. Adjust snap radius slider
# 5. Toggle individual snap types
# 6. Verify state updates in React DevTools
```

---

### Phase 4: Performance Validation & Testing (20 minutes)

#### Step 4.1: Performance Monitoring Setup
**Create Test Scenario**:
```typescript
// Test with multiple shapes
// 1. Draw 10 rectangles in a grid pattern
// 2. Enable snap
// 3. Move cursor around rapidly
// 4. Monitor FPS in DevTools Performance tab
```

**Expected Results**:
- FPS: 55-60 (maintains 60fps target)
- Snap detection: <16ms per cycle
- Memory: Stable (<5MB increase over 5 minutes)
- Max indicators: 25 visible at once

**Monitoring Code** (temporary - for testing):
```typescript
// Add to DrawingCanvas.tsx performSnapDetection()
const start = performance.now();
// ... existing snap detection code ...
const duration = performance.now() - start;
if (duration > 16) {
  console.warn(`Snap detection slow: ${duration.toFixed(2)}ms`);
}
```

---

#### Step 4.2: Test All Snap Types
**Test Cases**:

**Test 1: Endpoint Snap**
```
1. Draw a rectangle (creates 4 corners)
2. Select a different tool (e.g., Circle)
3. Move cursor near rectangle corner
4. Expected: Blue circle indicator appears
5. Click to start new shape at snapped position
6. Verify: New shape starts exactly at corner
```

**Test 2: Midpoint Snap**
```
1. With rectangle from Test 1
2. Move cursor to edge center
3. Expected: Orange square (diamond) appears at midpoint
4. Click to start new shape
5. Verify: Shape starts at exact edge midpoint
```

**Test 3: Center Snap**
```
1. Move cursor to rectangle center
2. Expected: Green crosshair appears
3. Verify: Crosshair is at geometric center
```

**Test 4: Grid Snap (with Grid enabled)**
```
1. Enable "Snap to Grid" in Properties Panel
2. Enable "Shape Snapping"
3. Move cursor to point that's both grid intersection AND corner
4. Expected: Blue circle (endpoint) appears (higher priority than grid)
5. Move cursor to grid-only location
6. Expected: Gray diamond appears
```

**Test 5: Priority System**
```
1. Draw two rectangles with touching corners
2. Move cursor to touching point
3. Expected: Only ONE blue circle appears (nearest shape)
4. Cursor should snap to single point
```

**Test 6: 2D Mode Visibility**
```
1. Click "2D View" button
2. Enable snap
3. Draw rectangle
4. Move cursor around shape
5. Expected: Indicators clearly visible (not too small)
6. Verify: Snap radius is 5cm (precise)
```

**Test 7: Distance Culling**
```
1. Draw shape
2. Zoom camera out >100m away
3. Expected: Indicators fade/disappear
4. Zoom back in
5. Expected: Indicators reappear
```

---

### Phase 5: Edge Case Handling (15 minutes)

#### Edge Case 1: No Shapes on Canvas
**Current Behavior**: Only grid snap points available (if grid enabled)
**Expected**: No crashes, system gracefully handles empty array
**Verification**: Already handled in SnapGrid.ts:242 (checks shapes array)

---

#### Edge Case 2: Cursor Outside Canvas
**Current Behavior**: `handlePointerLeave()` clears snap grid
**File**: `DrawingCanvas.tsx:294-307`
**Expected**: All indicators disappear when cursor exits
**Verification**: Already implemented via snapGrid.current.clear()

---

#### Edge Case 3: Very Small Shapes
**Scenario**: Rectangle <1m in 2D mode
**Potential Issue**: Endpoint and midpoint indicators overlap
**Current Mitigation**: Priority system (endpoint > midpoint)
**Additional Fix** (if needed):
```typescript
// In SnapIndicator.tsx limitedSnapPoints
// Add minimum distance filter between indicators
const MIN_INDICATOR_SPACING = 0.1; // 10cm
const filteredPoints = proximityFilteredPoints.filter((point, index, arr) => {
  // Check if too close to higher-priority indicator
  return !arr.slice(0, index).some(otherPoint => {
    const distance = Math.sqrt(
      Math.pow(point.position.x - otherPoint.position.x, 2) +
      Math.pow(point.position.y - otherPoint.position.y, 2)
    );
    return distance < MIN_INDICATOR_SPACING && otherPoint.strength > point.strength;
  });
});
```

**Decision**: Test first with current implementation. Add spacing filter only if overlapping indicators cause confusion.

---

#### Edge Case 4: Rotated Shapes
**Current Behavior**: SnapGrid.applyRotation() transforms snap points
**File**: `SnapGrid.ts:182-199`
**Expected**: Snap points rotate with shape
**Verification**: Already implemented and tested

---

#### Edge Case 5: FPS Degradation
**Trigger**: >50 shapes on canvas
**Auto-Mitigation**: 25-indicator limit already enforced
**Additional Protection** (future enhancement):
```typescript
// Monitor FPS and auto-disable if too low
let fpsCounter = 0;
let fpsSum = 0;

useFrame(({ clock }) => {
  const fps = 1 / clock.getDelta();
  fpsSum += fps;
  fpsCounter++;

  if (fpsCounter >= 60) { // Check every 60 frames
    const avgFps = fpsSum / fpsCounter;

    if (avgFps < 30 && snapEnabled) {
      console.warn('Auto-disabling snap for performance');
      toggleShapeSnap(); // Disable snap
      // TODO: Show notification to user
    }

    fpsCounter = 0;
    fpsSum = 0;
  }
});
```

**Decision**: Monitor in testing. Implement FPS auto-disable only if users experience performance issues.

---

## File Modification Summary

### Files to Modify

| File | Lines | Type | Changes |
|------|-------|------|---------|
| `useDrawingStore.ts` | 75-95 | Config | Enable snap, set defaults |
| `SnapIndicator.tsx` | 8-11 | Visual | Increase grid indicator size |
| `PropertiesPanel.tsx` | After 16 | UI | Add snap controls |
| `SceneManager.tsx` | N/A | Verify | Check SnapIndicator rendered |

### Files to Create
None (all infrastructure already exists)

### Files NOT to Modify
- `SnapGrid.ts` - Already optimized
- `snapService.ts` - Already functional
- `DrawingCanvas.tsx` - Snap detection already implemented
- `ActiveSnapIndicator.tsx` - Already working

---

## Testing Checklist

### Functional Testing
- [ ] Snap indicators appear when cursor near shapes
- [ ] Blue circles at corners
- [ ] Orange squares at edge midpoints
- [ ] Green crosshairs at shape centers
- [ ] Gray diamonds at grid points (if grid enabled)
- [ ] Cursor snaps to indicator positions
- [ ] Priority system works (endpoint > midpoint > center > grid)
- [ ] Toggle in Properties Panel enables/disables snap
- [ ] Snap radius slider adjusts detection range
- [ ] Individual snap type toggles work

### Performance Testing
- [ ] 60 FPS with 10 shapes on canvas
- [ ] <16ms snap detection cycle
- [ ] <5ms indicator rendering per frame
- [ ] Memory stable after 5 minutes
- [ ] Max 25 indicators enforced

### Visual Testing
- [ ] Indicators visible in 2D mode
- [ ] Indicators appropriately sized in 3D mode
- [ ] Colors match specification
- [ ] No flickering or jitter
- [ ] Smooth fade in/out
- [ ] Distance culling works (>100m)

### Edge Case Testing
- [ ] Empty canvas (no crashes)
- [ ] Cursor outside canvas (indicators clear)
- [ ] Very small shapes (<1m)
- [ ] Rotated shapes (snap points rotate)
- [ ] Overlapping shapes (single indicator)
- [ ] Many shapes (performance maintained)

### Cross-Mode Testing
- [ ] Works in 2D mode
- [ ] Works in 3D mode
- [ ] Snap radius adjusts correctly (5cm vs 1.5m)
- [ ] Indicator sizes adapt
- [ ] Smooth transition between modes

---

## Rollback Strategy

### Quick Disable
If issues arise during testing:
```typescript
// In useDrawingStore.ts line 77
enabled: false  // ← Set back to false
```
Reverts to previous non-snap behavior immediately.

### Git Commits
Create checkpoints at each phase:
```bash
git add -A
git commit -m "Phase 1: Enable snap configuration"

git add -A
git commit -m "Phase 2: Optimize 2D indicators"

git add -A
git commit -m "Phase 3: Add UI controls"
```

Rollback if needed:
```bash
git revert HEAD  # Undo last commit
git reset --hard HEAD~1  # Delete last commit
```

### Feature Flag (Optional)
For safer deployment:
```typescript
// In useDrawingStore.ts
const ENABLE_SHAPE_SNAP = import.meta.env.VITE_ENABLE_SNAP === 'true';

snapping: {
  config: {
    enabled: ENABLE_SHAPE_SNAP,  // Controlled by environment
    // ...
  }
}
```

```bash
# .env.local
VITE_ENABLE_SNAP=true  # Enable in development
VITE_ENABLE_SNAP=false # Disable in production if issues
```

---

## Performance Optimization Notes

### Already Implemented ✅
- Spatial indexing (10m cells) for O(1) snap point lookup
- Proximity filtering (only process nearby shapes)
- 60fps throttling (16ms update interval)
- Distance culling (hide indicators >100m)
- 25-indicator limit
- Geometry/material caching
- Snap point caching (invalidates on shape change)

### No Additional Optimization Needed
The system is already highly optimized. Performance targets should be met with current implementation.

### Potential Future Optimizations
If performance issues arise:
1. Reduce maxSnapPoints from 25 to 15
2. Increase update interval from 16ms to 33ms (30fps)
3. Implement object pooling for geometries
4. Use instanced rendering for indicators (advanced)

---

## Accessibility Considerations

### Current Implementation
- Color-coded indicators (may be difficult for color-blind users)
- No audio feedback
- No keyboard control

### Future Enhancements
1. **Color-Blind Mode**:
   - Pattern-based indicators (dots, stripes, etc.)
   - Configurable color schemes

2. **Audio Feedback**:
   - Subtle click when snapping
   - Different tones for snap types
   - Can be disabled in settings

3. **Keyboard Control**:
   - Tab through snap points
   - Enter to snap to selected point
   - Arrow keys to cycle snap types

**Decision**: Implement basic visual system first. Add accessibility features based on user feedback.

---

## Documentation Requirements

### Code Documentation
Add JSDoc comments to modified functions:

```typescript
/**
 * Default drawing state with shape snapping enabled
 *
 * Snap Configuration:
 * - enabled: true (activates snap detection)
 * - snapRadius: 5m (balanced default, overridden by mode: 5cm in 2D, 1.5m in 3D)
 * - activeTypes: endpoint, midpoint, center, grid
 * - maxSnapPoints: 25 (performance limit)
 *
 * @returns {DrawingState} Complete drawing state with snap configuration
 */
const getDefaultDrawingState = (): DrawingState => ({
  // ...
});
```

### User Documentation
Update README.md with snap feature:

```markdown
## Snap System

Land Visualizer includes professional CAD-style snapping for precision drawing.

### Snap Types
- **🔵 Corners** - Snap to shape vertices/corners
- **🟠 Edges** - Snap to edge midpoints
- **🟢 Centers** - Snap to shape centers
- **◇ Grid** - Snap to grid intersections

### Usage
1. Open Properties Panel (right sidebar)
2. Enable "Shape Snapping"
3. Adjust snap radius (1-20m)
4. Toggle individual snap types
5. Move cursor near shapes to see indicators

### Keyboard Shortcuts
- (Future) `S` - Hold to temporarily enable snap
- (Future) `Shift` - Hold to temporarily disable snap
```

---

## Constitution Compliance ✅

Verify compliance with Land Visualizer constitution:

| Article | Requirement | Status |
|---------|-------------|--------|
| 1 | Inline styles only | ✅ All UI uses inline styles |
| 2 | TypeScript strict mode | ✅ Proper type annotations |
| 3 | Zustand state management | ✅ Uses useDrawingStore |
| 4 | React best practices | ✅ Hooks, useMemo, useCallback |
| 5 | Three.js standards | ✅ Uses @react-three/fiber |
| 6 | Testing (70% coverage) | ⏸️ Add tests after implementation |
| 7 | Security first | ✅ No external dependencies |
| 8 | Prefer editing files | ✅ No new files created |
| 9 | Professional UX | ✅ CAD-inspired design |

**All articles satisfied** ✅

---

## Implementation Timeline

| Phase | Task | Time | Cumulative |
|-------|------|------|------------|
| 1 | Enable snap config | 15 min | 15 min |
| 1 | Verify rendering | 5 min | 20 min |
| 2 | Adjust indicator sizes | 10 min | 30 min |
| 2 | Test visual appearance | 10 min | 40 min |
| 3 | Add UI controls | 20 min | 60 min |
| 3 | Test UI integration | 10 min | 70 min |
| 4 | Performance testing | 15 min | 85 min |
| 4 | Test all snap types | 15 min | 100 min |
| 5 | Edge case testing | 15 min | 115 min |
| 5 | Documentation | 10 min | 125 min |

**Total: ~2 hours** (leaves 1 hour buffer for unexpected issues)

---

## Success Criteria

Implementation is complete when:

### Functional ✅
- [ ] All 4 snap types work (endpoint, midpoint, center, grid)
- [ ] Indicators appear within 100ms of cursor movement
- [ ] Cursor snaps to indicator positions
- [ ] Priority system resolves overlapping snaps
- [ ] Properties Panel toggle controls snap state
- [ ] Snap radius slider adjusts detection range
- [ ] Individual snap type toggles work

### Performance ✅
- [ ] 60 FPS maintained with 10 shapes
- [ ] <16ms snap detection cycle
- [ ] <5ms indicator rendering
- [ ] Memory stable (<5MB increase over 5 minutes)
- [ ] Max 25 indicators enforced

### Visual ✅
- [ ] Indicators visible in 2D mode
- [ ] Indicators appropriately sized in both modes
- [ ] Colors match specification
- [ ] No flickering or visual artifacts
- [ ] Smooth transitions

### UX ✅
- [ ] Snap behavior predictable
- [ ] No false positives
- [ ] Clear indication when snap is active
- [ ] Intuitive UI controls

---

## Next Steps

1. Review this plan with stakeholders
2. Create git branch: `feature/007-shape-snapping-system`
3. Implement Phase 1 (enable config)
4. Test immediately after each phase
5. Document any deviations from plan
6. Update tasks.md with actual time spent

**Proceed to `tasks.md` for step-by-step implementation tasks.**
