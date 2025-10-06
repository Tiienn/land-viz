# Implementation Tasks: Shape Snapping System

**Spec ID**: 007
**Tasks Version**: 1.0
**Created**: 2025-10-02
**Total Estimated Time**: 2-3 hours

---

## Task Overview

This document provides step-by-step implementation tasks for enabling the shape snapping system. Each task includes code examples, validation criteria, and time estimates.

---

## Phase 1: Enable Core Snap System

### Task 1.1: Enable Snap Configuration in Store
**File**: `app/src/store/useDrawingStore.ts`
**Lines**: 75-95
**Estimated Time**: 10 minutes
**Priority**: CRITICAL

**Current State**:
```typescript
snapping: {
  config: {
    enabled: false,  // ← DISABLED
    snapRadius: 10,
    activeTypes: new Set([]),  // ← EMPTY
    visual: { ... },
    performance: {
      maxSnapPoints: 100,  // ← TOO HIGH
      updateInterval: 16,
    },
  },
  availableSnapPoints: [],
  activeSnapPoint: null,
  snapPreviewPosition: null,
},
```

**Target State**:
```typescript
snapping: {
  config: {
    enabled: true,  // ✅ ENABLE SNAP SYSTEM
    snapRadius: 5,  // ✅ BALANCED DEFAULT
    activeTypes: new Set<SnapType>([  // ✅ TYPE ANNOTATION + ENABLED TYPES
      'endpoint',  // Blue circles at corners
      'midpoint',  // Orange squares at edge centers
      'center',    // Green crosshairs at shape centers
      'grid'       // Gray diamonds at grid intersections
    ]),
    visual: {
      showIndicators: true,
      showSnapLines: true,
      indicatorColor: '#00ff00',
      snapLineColor: '#00ff00',
      indicatorSize: 8,
    },
    performance: {
      maxSnapPoints: 25,  // ✅ REDUCE FOR PERFORMANCE
      updateInterval: 16,
    },
  },
  availableSnapPoints: [],
  activeSnapPoint: null,
  snapPreviewPosition: null,
},
```

**Step-by-Step**:

1. **Open file**: `app/src/store/useDrawingStore.ts`

2. **Locate line 75-95** in the `getDefaultDrawingState()` function

3. **Replace the snapping configuration**:
   ```typescript
   // Line 75-95: Replace entire snapping object
   snapping: {
     config: {
       enabled: true,
       snapRadius: 5,
       activeTypes: new Set<SnapType>([
         'endpoint',
         'midpoint',
         'center',
         'grid'
       ]),
       visual: {
         showIndicators: true,
         showSnapLines: true,
         indicatorColor: '#00ff00',
         snapLineColor: '#00ff00',
         indicatorSize: 8,
       },
       performance: {
         maxSnapPoints: 25,
         updateInterval: 16,
       },
     },
     availableSnapPoints: [],
     activeSnapPoint: null,
     snapPreviewPosition: null,
   },
   ```

4. **Verify imports at top of file**:
   ```typescript
   // Should already have:
   import type { DrawingTool, Point2D, Shape, ShapeType, DrawingState, SnapPoint, AlignmentGuide } from '../types';

   // If SnapType not imported, add it:
   import type { ..., SnapType } from '../types';
   ```

5. **Save the file**

**Validation**:
- [ ] TypeScript compiles without errors
- [ ] `Set<SnapType>` has proper type annotation
- [ ] All 4 snap types included: endpoint, midpoint, center, grid
- [ ] `maxSnapPoints` set to 25
- [ ] `enabled` set to true

**Testing**:
```bash
# Terminal
cd app
npm run type-check

# Expected output:
# No TypeScript errors
```

**Time Checkpoint**: ⏱️ Should complete in 10 minutes

---

### Task 1.2: Verify SnapIndicator Component Rendering
**File**: `app/src/components/Scene/SceneManager.tsx`
**Estimated Time**: 5 minutes
**Priority**: MEDIUM

**Action**: Verify `<SnapIndicator />` is rendered in the scene

**Step-by-Step**:

1. **Open file**: `app/src/components/Scene/SceneManager.tsx`

2. **Search for** "SnapIndicator" (Ctrl+F)

3. **Verify component is imported**:
   ```typescript
   // Should be near top of file
   import { SnapIndicator } from './SnapIndicator';
   import { ActiveSnapIndicator } from './ActiveSnapIndicator';
   ```

4. **Verify component is rendered** in the Canvas:
   ```typescript
   <Canvas>
     {/* Other components */}
     <ShapeRenderer />
     <SnapIndicator maxDistance={100} />  {/* ← SHOULD BE HERE */}
     <ActiveSnapIndicator />
     {/* Other components */}
   </Canvas>
   ```

5. **If missing**, add it after `<ShapeRenderer />`:
   ```typescript
   <ShapeRenderer
     shapes={shapes}
     selectedShapeId={selectedShapeId}
     hoveredShapeId={hoveredShapeId}
     showDimensions={showDimensions}
     onShapeClick={handleShapeClick}
     onShapeHover={setHoveredShapeId}
   />

   {/* ADD THIS IF MISSING */}
   <SnapIndicator maxDistance={100} />
   <ActiveSnapIndicator />
   ```

**Validation**:
- [ ] SnapIndicator imported
- [ ] SnapIndicator rendered in Canvas
- [ ] maxDistance prop set to 100
- [ ] Placed after ShapeRenderer (correct render order)

**Testing**:
```bash
# Start dev server
npm run dev

# Open browser DevTools
# React Components tab
# Search for "SnapIndicator"
# Should see component in tree
```

**Time Checkpoint**: ⏱️ Should complete in 5 minutes

---

### Task 1.3: Initial Visual Test
**Estimated Time**: 5 minutes
**Priority**: CRITICAL

**Action**: Verify snap indicators appear

**Step-by-Step**:

1. **Start dev server** (if not already running):
   ```bash
   cd app
   npm run dev
   ```

2. **Open browser**: http://localhost:5173

3. **Draw a rectangle**:
   - Click Rectangle tool
   - Click two corners on canvas
   - Rectangle appears

4. **Select different tool** (e.g., Circle)

5. **Move cursor near rectangle corner**:
   - Expected: Blue circle indicator appears
   - Expected: Cursor snaps to corner

6. **Move cursor along rectangle edge**:
   - Expected: Orange square appears at midpoint

7. **Move cursor to rectangle center**:
   - Expected: Green crosshair appears

**Validation Checklist**:
- [ ] Blue circles appear at 4 corners
- [ ] Orange squares appear at 4 edge midpoints
- [ ] Green crosshair appears at center
- [ ] Total: 9 indicators for one rectangle
- [ ] Indicators only appear when cursor is nearby
- [ ] Cursor snaps to indicator positions

**If indicators NOT appearing**:
- Check browser console for errors
- Verify snap config enabled in React DevTools:
  - Components → useDrawingStore → drawing.snapping.config.enabled = true
- Verify SnapIndicator component mounted:
  - Components → SnapIndicator → should be present

**Time Checkpoint**: ⏱️ Should complete in 5 minutes

---

## Phase 2: Visual Optimization for 2D Mode

### Task 2.1: Increase Grid Indicator Size in 2D
**File**: `app/src/components/Scene/SnapIndicator.tsx`
**Lines**: 8-11
**Estimated Time**: 5 minutes
**Priority**: MEDIUM

**Current State**:
```typescript
const INDICATOR_SIZES = {
  GRID_3D: 0.03,
  GRID_2D: 0.003  // ← TOO SMALL
} as const;
```

**Target State**:
```typescript
const INDICATOR_SIZES = {
  GRID_3D: 0.03,  // 3cm in 3D mode
  GRID_2D: 0.01   // ✅ 1cm in 2D mode (10x larger)
} as const;
```

**Step-by-Step**:

1. **Open file**: `app/src/components/Scene/SnapIndicator.tsx`

2. **Locate lines 8-11** (INDICATOR_SIZES constant)

3. **Change GRID_2D value**:
   ```typescript
   const INDICATOR_SIZES = {
     GRID_3D: 0.03,
     GRID_2D: 0.01  // Changed from 0.003 to 0.01
   } as const;
   ```

4. **Save the file**

**Validation**:
- [ ] GRID_2D value is 0.01
- [ ] GRID_3D value unchanged (0.03)
- [ ] TypeScript compiles

**Testing**:
```bash
# In app:
# 1. Enable "Snap to Grid" in Properties Panel
# 2. Click "2D View" button (bottom right)
# 3. Select Rectangle tool
# 4. Move cursor over canvas
# 5. Gray diamond indicators should be clearly visible
```

**Expected Result**: Grid indicators 10x more visible in 2D mode

**Time Checkpoint**: ⏱️ Should complete in 5 minutes

---

### Task 2.2: Test 2D Mode Visibility
**Estimated Time**: 5 minutes
**Priority**: HIGH

**Action**: Verify indicators are visible in 2D mode

**Step-by-Step**:

1. **Click "2D View" button** (bottom right of screen)

2. **Draw a rectangle** in 2D mode

3. **Enable "Snap to Grid"** in Properties Panel

4. **Move cursor near rectangle**:
   - Blue circles at corners should be visible
   - Orange squares at edges should be visible
   - Green crosshair at center should be visible
   - Gray diamonds at grid points should be visible

5. **Zoom in/out**:
   - Indicators should scale appropriately
   - Should remain visible at various zoom levels

**Validation Checklist**:
- [ ] All indicator types visible in 2D mode
- [ ] Indicators not too small
- [ ] Indicators not too large (overwhelming)
- [ ] Colors distinguishable against grass background
- [ ] Smooth appearance (no pixelation)

**If indicators too small or large**:
```typescript
// Adjust size in SnapIndicator.tsx if needed
const INDICATOR_SIZES = {
  GRID_3D: 0.03,
  GRID_2D: 0.015  // Try different values: 0.005, 0.01, 0.015, 0.02
} as const;
```

**Time Checkpoint**: ⏱️ Should complete in 5 minutes

---

## Phase 3: UI Control Integration

### Task 3.1: Add Snap State Selectors to PropertiesPanel
**File**: `app/src/components/PropertiesPanel.tsx`
**After Line**: 16 (after existing state selectors)
**Estimated Time**: 5 minutes
**Priority**: HIGH

**Step-by-Step**:

1. **Open file**: `app/src/components/PropertiesPanel.tsx`

2. **Add import for SnapType** at top of file:
   ```typescript
   // Near other imports (around line 2)
   import type { SnapType } from '@/types';
   ```

3. **Add snap state selectors** after line 16:
   ```typescript
   // After existing selectors (line 16)
   const snapEnabled = useAppStore(state => state.drawing.snapping.config.enabled);
   const snapRadius = useAppStore(state => state.drawing.snapping.config.snapRadius);
   const activeTypes = useAppStore(state => state.drawing.snapping.config.activeTypes);
   const updateDrawingState = useAppStore(state => state.updateDrawingState);
   ```

4. **Save the file**

**Validation**:
- [ ] SnapType imported from '@/types'
- [ ] 4 new state selectors added
- [ ] TypeScript compiles
- [ ] No runtime errors

**Testing**:
```bash
npm run type-check
# Should have no TypeScript errors
```

**Time Checkpoint**: ⏱️ Should complete in 5 minutes

---

### Task 3.2: Add Snap Toggle Functions
**File**: `app/src/components/PropertiesPanel.tsx`
**After**: Task 3.1 code
**Estimated Time**: 10 minutes
**Priority**: HIGH

**Step-by-Step**:

1. **Add toggle functions** after the selectors:
   ```typescript
   // Add these functions after state selectors
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

2. **Save the file**

**Validation**:
- [ ] toggleShapeSnap function added
- [ ] setSnapRadius function added
- [ ] toggleSnapType function added
- [ ] TypeScript compiles
- [ ] Functions properly typed

**Time Checkpoint**: ⏱️ Should complete in 10 minutes

---

### Task 3.3: Add Shape Snapping UI Section
**File**: `app/src/components/PropertiesPanel.tsx`
**After**: Existing Grid Settings section
**Estimated Time**: 15 minutes
**Priority**: HIGH

**Step-by-Step**:

1. **Locate the Grid Settings section** (around line 100+)

2. **Add Shape Snapping section** after Grid Settings:
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

3. **Save the file**

**Validation**:
- [ ] Section appears after Grid Settings
- [ ] Master toggle checkbox visible
- [ ] Snap radius slider visible (when enabled)
- [ ] 4 snap type checkboxes visible (when enabled)
- [ ] All interactive controls work
- [ ] Inline styles applied correctly

**Testing**:
```bash
# In browser:
# 1. Open Properties Panel (right sidebar)
# 2. Scroll to "Shape Snapping" section
# 3. Click "Enable Shape Snapping" checkbox
# 4. Verify controls appear
# 5. Adjust snap radius slider
# 6. Toggle snap type checkboxes
```

**Time Checkpoint**: ⏱️ Should complete in 15 minutes

---

### Task 3.4: Test UI Controls
**Estimated Time**: 10 minutes
**Priority**: HIGH

**Action**: Verify all UI controls work

**Test Cases**:

**Test 1: Master Toggle**
1. Uncheck "Enable Shape Snapping"
2. Expected: Snap indicators disappear
3. Expected: Snap radius and type controls disappear
4. Check box again
5. Expected: Indicators reappear
6. Expected: Controls reappear

**Test 2: Snap Radius Slider**
1. Set slider to 1m
2. Move cursor near shape
3. Expected: Must be very close for indicators to appear
4. Set slider to 20m
5. Expected: Indicators appear from farther away

**Test 3: Snap Type Toggles**
1. Uncheck "🔵 Corners"
2. Expected: Blue circles disappear
3. Expected: Other indicators remain
4. Uncheck all types
5. Expected: No indicators appear
6. Check all types again
7. Expected: All indicators return

**Test 4: State Persistence**
1. Toggle snap on
2. Adjust radius to 10m
3. Disable "Edges" snap type
4. Switch to different tool
5. Switch back
6. Expected: Snap still on, radius still 10m, edges still disabled

**Validation Checklist**:
- [ ] Master toggle works
- [ ] Slider adjusts radius correctly
- [ ] Individual type toggles work
- [ ] State persists across tool changes
- [ ] No console errors
- [ ] UI responsive (changes reflect immediately)

**Time Checkpoint**: ⏱️ Should complete in 10 minutes

---

## Phase 4: Comprehensive Testing

### Task 4.1: Test All Snap Types
**Estimated Time**: 15 minutes
**Priority**: CRITICAL

**Test Scenarios**:

**Scenario 1: Endpoint Snap (Corners)**
```
Setup:
- Draw a rectangle (10m × 10m)
- Select Circle tool

Steps:
1. Move cursor to top-left corner
2. Expected: Blue circle appears
3. Click to start circle
4. Verify: Circle center is exactly at rectangle corner

Validation:
- [ ] Blue circle indicator appears
- [ ] Indicator at exact corner position
- [ ] Cursor snaps when within range
- [ ] New shape starts at snapped position
```

**Scenario 2: Midpoint Snap (Edge Centers)**
```
Setup:
- Rectangle from Scenario 1
- Select Polyline tool

Steps:
1. Move cursor to top edge center
2. Expected: Orange square appears
3. Click to start polyline
4. Verify: First point is exactly at edge midpoint

Validation:
- [ ] Orange square appears
- [ ] Square at exact midpoint
- [ ] Works for all 4 edges
- [ ] Snap position mathematically correct
```

**Scenario 3: Center Snap**
```
Setup:
- Rectangle from Scenario 1
- Select Circle tool

Steps:
1. Move cursor to rectangle center
2. Expected: Green crosshair appears
3. Click to start circle
4. Verify: Circle center is at rectangle center

Validation:
- [ ] Green crosshair appears
- [ ] Crosshair at geometric center
- [ ] Crosshair is two perpendicular lines
- [ ] Snap to centroid for polygons
```

**Scenario 4: Grid Snap**
```
Setup:
- Enable "Snap to Grid" in Properties
- Grid size: 1m
- Enable "Shape Snapping"

Steps:
1. Move cursor to grid intersection (no shapes nearby)
2. Expected: Gray diamond appears
3. Move to corner that's also on grid
4. Expected: Blue circle appears (higher priority)

Validation:
- [ ] Gray diamond at grid intersections
- [ ] Shape snap takes priority over grid
- [ ] Grid snap works when shape snap unavailable
- [ ] Both systems can be active simultaneously
```

**Time Checkpoint**: ⏱️ Should complete in 15 minutes

---

### Task 4.2: Test Priority System
**Estimated Time**: 10 minutes
**Priority**: HIGH

**Test Overlapping Snap Points**:

```
Setup:
- Draw two rectangles with touching corners
- Select Circle tool

Test 1: Coincident Corners
1. Move cursor to touching point
2. Expected: Only ONE blue circle appears
3. Verify: Snaps to single point (not two overlapping)

Test 2: Corner Near Midpoint
1. Draw rectangle edge passing near another corner
2. Move cursor to area where both are nearby
3. Expected: Blue circle (corner) appears, not orange square
4. Verify: Priority: endpoint (1.0) > midpoint (0.8)

Test 3: Multiple Snap Types Same Shape
1. Draw very small rectangle (<1m)
2. Move cursor to area where corner and midpoint overlap
3. Expected: Corner indicator shows (higher priority)

Validation:
- [ ] Only one indicator when points coincident
- [ ] Endpoint priority > midpoint priority
- [ ] Midpoint priority > center priority
- [ ] Center priority > grid priority
- [ ] Smooth transition between priorities
```

**Time Checkpoint**: ⏱️ Should complete in 10 minutes

---

### Task 4.3: Test 2D/3D Mode Switching
**Estimated Time**: 10 minutes
**Priority**: MEDIUM

**Test Mode Transition**:

```
Setup:
- Draw rectangle in 3D mode
- Enable snap

Test 1: 3D to 2D
1. Note snap radius in 3D (1.5m effective)
2. Click "2D View" button
3. Expected: Snap radius becomes 5cm
4. Expected: Indicators resize (grid indicators larger)
5. Move cursor near shape
6. Expected: Must be closer for snap to trigger

Test 2: 2D to 3D
1. Start in 2D mode with snap enabled
2. Click "3D View" button (or exit 2D)
3. Expected: Snap radius becomes 1.5m
4. Expected: Indicators resize back
5. Expected: Easier to trigger snap from distance

Validation:
- [ ] Snap radius adjusts automatically
- [ ] Indicator sizes adapt to mode
- [ ] No visual glitches during transition
- [ ] Snap continues to work after switch
- [ ] State preserved across mode changes
```

**Time Checkpoint**: ⏱️ Should complete in 10 minutes

---

### Task 4.4: Performance Testing
**Estimated Time**: 15 minutes
**Priority**: HIGH

**Performance Benchmarks**:

```
Test 1: Single Shape Performance
Setup:
- Draw 1 rectangle
- Enable snap
- Open DevTools Performance tab

Steps:
1. Start performance recording
2. Move cursor rapidly around shape
3. Stop after 10 seconds
4. Analyze results

Expected:
- FPS: 58-60
- Frame time: <17ms
- Snap detection: <5ms per cycle
- No dropped frames

Test 2: Multiple Shapes Performance
Setup:
- Draw 10 rectangles in grid pattern
- Enable snap
- Record performance

Steps:
1. Move cursor over all shapes
2. Record for 20 seconds
3. Check FPS counter

Expected:
- FPS: 55-60 (slight drop acceptable)
- Frame time: <20ms
- Max 25 indicators visible
- Smooth cursor movement

Test 3: Stress Test
Setup:
- Draw 20 rectangles
- Enable all snap types
- Enable grid snap

Steps:
1. Move cursor rapidly
2. Monitor FPS
3. Check memory usage

Expected:
- FPS: >30 (acceptable under stress)
- Memory: <5MB increase over 5 minutes
- No crashes
- System remains responsive

Validation:
- [ ] 60 FPS with 1-5 shapes
- [ ] >50 FPS with 10 shapes
- [ ] >30 FPS with 20+ shapes
- [ ] Memory stable (no leaks)
- [ ] No jank or stuttering
```

**If Performance Issues**:
```typescript
// Reduce max indicators in useDrawingStore.ts
maxSnapPoints: 15  // Down from 25

// Increase update interval
updateInterval: 33  // 30fps instead of 60fps
```

**Time Checkpoint**: ⏱️ Should complete in 15 minutes

---

## Phase 5: Edge Case Testing & Polish

### Task 5.1: Test Edge Cases
**Estimated Time**: 10 minutes
**Priority**: MEDIUM

**Edge Case Tests**:

```
Test 1: Empty Canvas
Setup:
- Delete all shapes
- Enable snap

Steps:
1. Move cursor on canvas
2. Expected: Only grid indicators (if grid snap ON)
3. Expected: No crashes
4. Expected: No console errors

Validation:
- [ ] System handles empty shape array
- [ ] No errors in console
- [ ] Grid snap still works

Test 2: Cursor Outside Canvas
Setup:
- Draw shapes
- Enable snap

Steps:
1. Move cursor over shape (indicators appear)
2. Move cursor outside canvas (off to side)
3. Expected: Indicators disappear
4. Move cursor back
5. Expected: Indicators reappear

Validation:
- [ ] Indicators clear on pointer leave
- [ ] State resets cleanly
- [ ] No lingering indicators

Test 3: Very Small Shape
Setup:
- Draw rectangle 0.5m × 0.5m in 2D mode

Steps:
1. Move cursor near shape
2. Expected: Indicators may overlap
3. Verify: Priority system resolves
4. Verify: Only highest-priority indicator shows

Validation:
- [ ] No duplicate indicators
- [ ] Priority system works
- [ ] Visually clean

Test 4: Rapid Tool Switching
Setup:
- Enable snap
- Shapes on canvas

Steps:
1. Switch Rectangle → Circle → Polyline → Select rapidly
2. Expected: No errors
3. Expected: Snap state consistent
4. Expected: No visual artifacts

Validation:
- [ ] No crashes
- [ ] State remains valid
- [ ] Indicators update correctly
```

**Time Checkpoint**: ⏱️ Should complete in 10 minutes

---

### Task 5.2: Add Code Comments
**Estimated Time**: 10 minutes
**Priority**: LOW

**Files to Document**:

**1. useDrawingStore.ts (line 75)**
```typescript
/**
 * Default drawing state with shape snapping enabled
 *
 * Snap Configuration:
 * - enabled: true (activates snap detection system)
 * - snapRadius: 5m (balanced default, overridden by mode)
 *   - 2D mode: 0.05m (5cm) for precision
 *   - 3D mode: 1.5m for easier targeting
 * - activeTypes: endpoint, midpoint, center, grid
 * - maxSnapPoints: 25 (performance limit)
 *
 * Priority System (highest to lowest):
 * 1. endpoint (1.0) - Shape corners/vertices
 * 2. quadrant (0.9) - Circle quadrants (N/E/S/W)
 * 3. midpoint (0.8) - Edge centers
 * 4. center (0.7) - Shape centers
 * 5. grid (0.4) - Grid intersections
 *
 * @see SnapIndicator.tsx for visual rendering
 * @see SnapGrid.ts for snap detection algorithm
 */
const getDefaultDrawingState = (): DrawingState => ({
```

**2. SnapIndicator.tsx (line 8)**
```typescript
/**
 * Indicator sizes for different view modes
 *
 * 2D mode uses larger grid indicators because camera is
 * farther away in top-down view. Other indicators (endpoint,
 * midpoint, center) use absolute world sizes (0.2m, 0.5m)
 * and don't need mode-specific adjustment.
 *
 * Values:
 * - GRID_3D: 0.03m (3cm) - Subtle in 3D perspective
 * - GRID_2D: 0.01m (1cm) - 10x larger for 2D visibility
 */
const INDICATOR_SIZES = {
```

**3. PropertiesPanel.tsx (before Shape Snapping section)**
```typescript
/**
 * Shape Snapping UI Controls
 *
 * Allows users to:
 * - Toggle snap system on/off
 * - Adjust snap detection radius (1-20m)
 * - Enable/disable individual snap types
 *
 * State managed via Zustand store (drawing.snapping.config)
 */
```

**Time Checkpoint**: ⏱️ Should complete in 10 minutes

---

### Task 5.3: Update Documentation
**File**: `README.md` or `CLAUDE.md`
**Estimated Time**: 10 minutes
**Priority**: LOW

**Add to README.md** (Controls Reference section):

```markdown
## Snap System

Land Visualizer includes professional CAD-style snapping for precision drawing.

### Snap Types
- **🔵 Corners** - Snap to shape vertices/corners (blue circles)
- **🟠 Edges** - Snap to edge midpoints (orange squares)
- **🟢 Centers** - Snap to shape geometric centers (green crosshairs)
- **◇ Grid** - Snap to grid intersections (gray diamonds)

### Usage
1. Open Properties Panel (right sidebar)
2. Scroll to "Shape Snapping" section
3. Check "Enable Shape Snapping"
4. Adjust snap radius (1-20m) if needed
5. Toggle individual snap types as desired
6. Move cursor near shapes to see indicators

### Snap Radius
- **2D Mode**: 5cm detection radius (precision)
- **3D Mode**: 1.5m detection radius (easier targeting)
- **Adjustable**: Use slider in Properties Panel

### Keyboard Shortcuts (Future)
- `S` - Hold to temporarily enable snap
- `Shift` - Hold to temporarily disable snap

### Priority System
When multiple snap points are nearby, the system prioritizes:
1. Corners (endpoints)
2. Edge centers (midpoints)
3. Shape centers
4. Grid intersections
```

**Add to CLAUDE.md** (Recent Major Changes section):

```markdown
**Shape Snapping System (October 2025):**
- **Professional CAD Snapping**: 4 essential snap types (endpoint, midpoint, center, grid)
- **Visual Feedback**: Color-coded indicators (blue, orange, green, gray)
- **Mode-Adaptive**: 5cm radius in 2D, 1.5m in 3D
- **User Controls**: Properties Panel toggle with radius adjustment
- **Performance Optimized**: 25-indicator limit, 60fps maintained
- **Priority System**: Intelligent snap point selection
```

**Time Checkpoint**: ⏱️ Should complete in 10 minutes

---

## Final Checklist

### Functional Completeness ✅
- [ ] Snap config enabled in store
- [ ] All 4 snap types working (endpoint, midpoint, center, grid)
- [ ] Visual indicators appear correctly
- [ ] Cursor snaps to indicator positions
- [ ] Priority system resolves overlapping snaps
- [ ] SnapIndicator component rendered
- [ ] UI controls in Properties Panel
- [ ] Master toggle works
- [ ] Snap radius slider works
- [ ] Individual type toggles work

### Visual Quality ✅
- [ ] Indicators visible in 2D mode
- [ ] Indicators appropriately sized in 3D mode
- [ ] Colors match specification
- [ ] No flickering or jitter
- [ ] Smooth transitions
- [ ] Professional appearance

### Performance ✅
- [ ] 60 FPS with 1-5 shapes
- [ ] >50 FPS with 10 shapes
- [ ] Memory stable (no leaks)
- [ ] Snap detection <16ms
- [ ] Max 25 indicators enforced

### Edge Cases ✅
- [ ] Empty canvas handled
- [ ] Cursor outside canvas handled
- [ ] Very small shapes handled
- [ ] Rapid tool switching works
- [ ] Mode switching works

### Code Quality ✅
- [ ] TypeScript compiles
- [ ] No console errors
- [ ] Inline styles only
- [ ] Proper type annotations
- [ ] Code commented

### Documentation ✅
- [ ] README.md updated
- [ ] CLAUDE.md updated
- [ ] Code comments added
- [ ] spec.md complete
- [ ] plan.md complete

---

## Time Tracking

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| Phase 1 | 20 min | ___ | ⏸️ |
| Phase 2 | 10 min | ___ | ⏸️ |
| Phase 3 | 40 min | ___ | ⏸️ |
| Phase 4 | 50 min | ___ | ⏸️ |
| Phase 5 | 30 min | ___ | ⏸️ |
| **Total** | **2.5 hrs** | ___ | ⏸️ |

---

## Troubleshooting

### Issue: Indicators Not Appearing

**Diagnosis**:
1. Check snap config enabled:
   ```typescript
   // In React DevTools
   useDrawingStore → drawing.snapping.config.enabled
   // Should be: true
   ```

2. Check active types not empty:
   ```typescript
   drawing.snapping.config.activeTypes
   // Should contain: endpoint, midpoint, center, grid
   ```

3. Check SnapIndicator mounted:
   ```typescript
   // In React DevTools
   // Search for "SnapIndicator" component
   ```

**Solutions**:
- Verify Task 1.1 completed (enabled: true)
- Verify Task 1.2 completed (SnapIndicator rendered)
- Check browser console for errors
- Hard refresh (Ctrl+Shift+R)

---

### Issue: TypeScript Errors

**Common Errors**:

**Error 1**: `Type 'Set<string>' is not assignable to type 'Set<SnapType>'`
```typescript
// WRONG
activeTypes: new Set(['endpoint', 'midpoint'])

// RIGHT
activeTypes: new Set<SnapType>(['endpoint', 'midpoint'])
```

**Error 2**: `Cannot find name 'SnapType'`
```typescript
// Add to imports in PropertiesPanel.tsx
import type { SnapType } from '@/types';
```

**Error 3**: `Property 'snapping' does not exist`
```typescript
// Verify types/index.ts has SnapType exported
export type { ..., SnapType } from './drawing';
```

---

### Issue: Performance Degradation

**If FPS < 30**:

1. **Reduce max indicators**:
   ```typescript
   // useDrawingStore.ts
   maxSnapPoints: 15  // Down from 25
   ```

2. **Increase update interval**:
   ```typescript
   // useDrawingStore.ts
   updateInterval: 33  // 30fps instead of 60fps
   ```

3. **Disable some snap types**:
   ```typescript
   // Remove 'grid' if not needed
   activeTypes: new Set<SnapType>(['endpoint', 'midpoint', 'center'])
   ```

---

### Issue: Indicators Too Small/Large in 2D

**Adjustment**:
```typescript
// SnapIndicator.tsx line 10
GRID_2D: 0.015  // Try values: 0.005, 0.01, 0.015, 0.02

// For other indicators (lines 69-86):
endpoint: new THREE.CircleGeometry(0.3, 12)  // Increase from 0.2
midpoint: new THREE.RingGeometry(0.2, 0.35, 4, 1)  // Increase from 0.15/0.25
```

---

## Success Criteria - Final Verification

**Before marking complete, verify**:

### Critical Must-Haves ✅
- [ ] Blue circles appear at corners
- [ ] Orange squares appear at edge midpoints
- [ ] Green crosshairs appear at centers
- [ ] Cursor snaps to indicator positions
- [ ] Properties Panel toggle controls snap
- [ ] 60 FPS maintained (with reasonable shape count)

### Nice-to-Haves ✅
- [ ] Gray diamonds at grid points
- [ ] Snap radius slider works
- [ ] Individual type toggles work
- [ ] Mode-adaptive sizing
- [ ] Code well-documented

**If all critical criteria met → Implementation complete! 🎉**

---

## Next Steps After Completion

1. **Create git commit**:
   ```bash
   git add -A
   git commit -m "feat: Enable professional CAD-style shape snapping system

   - Enabled snap configuration in drawing store
   - Optimized indicator sizes for 2D mode visibility
   - Added UI controls in Properties Panel
   - Comprehensive testing across all snap types
   - Maintains 60 FPS with 10+ shapes

   Implements spec 007-shape-snapping-system"
   ```

2. **Update CHANGELOG.md**:
   ```markdown
   ## [Unreleased]
   ### Added
   - Professional CAD-style shape snapping with 4 snap types
   - Visual snap indicators (corners, edges, centers, grid)
   - Properties Panel controls for snap configuration
   - Mode-adaptive snap radius (5cm in 2D, 1.5m in 3D)
   ```

3. **User testing**:
   - Share with beta testers
   - Collect feedback on snap radius defaults
   - Note any usability issues

4. **Future enhancements**:
   - Keyboard shortcuts ('S' to toggle)
   - Advanced snap types (intersection, perpendicular)
   - Audio feedback
   - Custom snap point creation

---

**Implementation complete! Proceed to testing and user feedback.** ✅
