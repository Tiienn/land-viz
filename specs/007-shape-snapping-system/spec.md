# Feature Specification: Shape Snapping System

**Spec ID**: 007
**Feature Name**: Professional CAD-Style Shape Snapping
**Created**: 2025-10-02
**Status**: Approved
**Priority**: High
**Complexity**: Medium

---

## Executive Summary

Enable professional CAD-style shape snapping in Land Visualizer to provide precision drawing and editing capabilities. The system will detect and snap to geometric features of existing shapes (corners, edge centers, shape centers) as well as grid intersections, providing visual feedback through colored indicators.

**User Value**: Dramatically improves precision when drawing new shapes or editing existing ones by automatically aligning to meaningful geometric points.

**Technical Value**: Leverages existing snap infrastructure (SnapGrid, snapService, SnapIndicator) that's already built but disabled by default.

---

## Problem Statement

### Current State
- Grid snapping works but has no visual feedback (indicators removed)
- Shape snapping system is fully implemented but **disabled** (`enabled: false` in store)
- Users cannot snap to shape corners, edges, or centers
- No visual indication of where snapping will occur
- Drawing precision relies entirely on manual cursor placement

### Target State
- Professional snap indicators appear when cursor is near snap points
- Snap to corners (blue circles), edge midpoints (orange squares), centers (green crosshairs)
- Configurable snap types and sensitivity
- Adaptive behavior for 2D vs 3D modes
- User control via Properties Panel toggle
- Maintains 60 FPS performance with up to 25 indicators

---

## User Stories

### Story 1: Precision Drawing
**As a** land surveyor
**I want to** snap new shapes to existing shape corners
**So that** I can create perfectly aligned property boundaries

**Acceptance Criteria**:
- [ ] Blue circle indicator appears at shape corners when cursor is within 5cm (2D) or 1.5m (3D)
- [ ] Cursor automatically snaps to corner position when indicator is visible
- [ ] Drawing new shape starts exactly at snapped corner point
- [ ] Indicator disappears when cursor moves away

---

### Story 2: Edge Alignment
**As a** urban planner
**I want to** snap to edge midpoints of existing buildings
**So that** I can align pathways or extensions precisely

**Acceptance Criteria**:
- [ ] Orange square indicator appears at edge midpoints
- [ ] Midpoint calculated correctly for all edge types (straight, curved)
- [ ] Snap priority: corners take precedence over midpoints when both are nearby
- [ ] Works for all shape types (rectangle, circle, polyline)

---

### Story 3: Center Snapping
**As a** architect
**I want to** snap to shape centers
**So that** I can create concentric or symmetrical layouts

**Acceptance Criteria**:
- [ ] Green crosshair indicator appears at shape geometric centers
- [ ] Center calculated correctly for irregular polygons (centroid)
- [ ] Center snapping works for circles (returns circle center point)
- [ ] Indicator has lower priority than corners and edges

---

### Story 4: User Control
**As a** power user
**I want to** toggle shape snapping on/off
**So that** I can enable it only when needed for precision work

**Acceptance Criteria**:
- [ ] Properties Panel has "Enable Shape Snapping" checkbox
- [ ] Snap state persists during session (not across page reload)
- [ ] Keyboard shortcut 'S' temporarily enables snap while held (future enhancement)
- [ ] Clear visual indication in UI when snap is active

---

### Story 5: Grid + Shape Snapping
**As a** land developer
**I want to** use grid and shape snapping together
**So that** I can align to both grid and existing shapes

**Acceptance Criteria**:
- [ ] Both grid snap and shape snap can be enabled simultaneously
- [ ] Shape snap takes priority when both are available at same location
- [ ] Gray diamond indicators show grid points (if grid snap enabled)
- [ ] No performance degradation with both systems active

---

## Functional Requirements

### FR-1: Snap Type Configuration
**Requirement**: System must support multiple snap types with configurable priority

**Essential Snap Types** (Phase 1):
1. **Endpoint** (Priority: 1.0) - Shape corners/vertices
   - Visual: Blue circles (0.2m radius)
   - All shape types: rectangle, circle, polyline, polygon

2. **Midpoint** (Priority: 0.8) - Edge centers
   - Visual: Orange squares (rotated 45° for diamonds)
   - Calculated as midpoint of each edge segment

3. **Center** (Priority: 0.7) - Shape centers
   - Visual: Green crosshairs (two perpendicular lines)
   - Geometric centroid for polygons, circle center for circles

4. **Grid** (Priority: 0.4) - Grid intersections
   - Visual: Gray diamonds (rotated squares)
   - Only when grid snap is also enabled

**Advanced Snap Types** (Future - Optional):
- Quadrant (0.9) - Circle N/E/S/W points
- Intersection (0.6) - Where shapes cross
- Perpendicular (0.5) - Right angles from edges
- Extension (0.4) - Beyond line endpoints
- Tangent (0.4) - Tangent to circles

---

### FR-2: Visual Feedback System
**Requirement**: Clear, color-coded visual indicators for each snap type

**Indicator Specifications**:
```typescript
SnapType      Color      Geometry           Size (3D)  Size (2D)  Opacity
-----------   --------   ----------------   ---------  ---------  -------
endpoint      #3B82F6    Circle             0.2m       0.2m       0.8
midpoint      #F59E0B    Square (45° rot)   0.2m       0.2m       0.8
center        #22C55E    Crosshair lines    0.5m       0.5m       0.9
grid          #9CA3AF    Square (45° rot)   0.03m      0.01m      0.6
```

**Visual Behavior**:
- Fade in/out smoothly (100ms transition)
- Scale with camera distance (larger when farther)
- Distance-based culling (hide beyond 100m)
- Max 25 indicators visible at once (performance limit)

---

### FR-3: Snap Detection & Prioritization
**Requirement**: Intelligent snap point detection with priority system

**Detection Algorithm**:
1. Get cursor world position (raycasting to ground plane)
2. Find all shapes within snap radius
3. Extract snap points from each shape (corners, midpoints, centers)
4. Filter by enabled snap types
5. Sort by distance to cursor
6. Apply priority weighting (endpoint > midpoint > center > grid)
7. Return highest-priority snap point within radius

**Snap Radius**:
- **2D Mode**: 0.05m (5cm) - Precision for technical drawing
- **3D Mode**: 1.5m - Easier targeting with orbital camera
- **Configurable**: User can adjust via UI (range: 0.01m - 5m)

---

### FR-4: Mode-Specific Behavior
**Requirement**: Adapt snap behavior for 2D and 3D viewing modes

**2D Mode** (Top-down technical view):
- Tighter snap radius (5cm default)
- Larger indicators for visibility
- Grid indicators more prominent
- Snap to grid more important

**3D Mode** (Orbital perspective view):
- Larger snap radius (1.5m default)
- Smaller indicators (less visual clutter)
- Shape snapping more important
- Grid secondary

**Adaptive Sizing**:
```typescript
const indicatorSize = is2DMode ? {
  grid: 0.01m,     // 10x larger than 3D
  endpoint: 0.2m,  // Same as 3D
  midpoint: 0.2m,  // Same as 3D
  center: 0.5m     // Same as 3D
} : {
  grid: 0.03m,
  endpoint: 0.2m,
  midpoint: 0.2m,
  center: 0.5m
};
```

---

### FR-5: Performance Optimization
**Requirement**: Maintain 60 FPS with snap system active

**Performance Targets**:
- Snap detection cycle: <16ms (60fps threshold)
- Indicator rendering: <5ms per frame
- Memory usage: <5MB for snap point cache
- Max indicators: 25 visible at once

**Optimization Strategies**:
1. **Spatial Indexing**: SnapGrid uses 10m cell size for efficient lookup
2. **Proximity Filtering**: Only process shapes within 10m of cursor
3. **Throttling**: Updates limited to 60fps (16ms interval)
4. **Caching**: Shape snap points cached until shape modified
5. **Distance Culling**: Hide indicators beyond 100m from camera
6. **Lazy Evaluation**: Only calculate snap points when snap enabled

---

### FR-6: User Interface Controls
**Requirement**: Intuitive UI for enabling and configuring snap system

**Properties Panel Integration**:
```
┌─────────────────────────────────────┐
│ Properties Panel                    │
├─────────────────────────────────────┤
│ Grid Settings                       │
│   [x] Snap to Grid                  │
│   Grid Size: 1m                     │
│                                     │
│ Shape Snapping                      │
│   [x] Enable Shape Snapping  ← NEW  │
│   Snap Radius: [====|====] 5m       │
│                                     │
│   Snap Types:                       │
│   [x] 🔵 Corners (endpoints)        │
│   [x] 🟠 Edges (midpoints)          │
│   [x] 🟢 Centers                    │
│   [x] ◇ Grid Points                 │
│                                     │
│   [?] What are these?  ← Tooltip    │
└─────────────────────────────────────┘
```

**Keyboard Shortcuts** (Future):
- `S` - Hold to temporarily enable snap
- `Ctrl+S` - Toggle snap on/off
- `Shift` - Disable snap while held (override)

---

### FR-7: Error Handling & Edge Cases
**Requirement**: Graceful handling of edge cases

**Edge Case 1: No Shapes**
- Condition: Canvas is empty
- Behavior: Only grid snap available (if grid enabled)
- Expected: No shape indicators, system remains responsive

**Edge Case 2: Overlapping Shapes**
- Condition: Multiple shapes with coincident points
- Behavior: Show indicator for nearest shape only
- Expected: No duplicate indicators, smooth transition

**Edge Case 3: Performance Degradation**
- Condition: FPS drops below 30
- Behavior: Auto-disable snap, notify user
- Expected: "Snap disabled for performance" message in UI

**Edge Case 4: Cursor Outside Canvas**
- Condition: Mouse leaves 3D canvas area
- Behavior: Clear all indicators, clear snap state
- Expected: Clean state, no lingering indicators

**Edge Case 5: Very Small Shapes**
- Condition: Shape <1m in 2D mode
- Behavior: Indicators may overlap (corner + midpoint)
- Expected: Priority system resolves (show corner only)

---

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Maintain 60 FPS during normal drawing operations
- [ ] Snap detection completes in <16ms
- [ ] No memory leaks after 30 minutes of use
- [ ] Max 25 indicators rendered simultaneously

### NFR-2: Usability
- [ ] Indicators clearly distinguishable by color
- [ ] Snap behavior predictable and consistent
- [ ] No false positives (snap only when intended)
- [ ] Smooth transitions (no flickering indicators)

### NFR-3: Compatibility
- [ ] Works in both 2D and 3D viewing modes
- [ ] Compatible with all drawing tools (rectangle, circle, polyline)
- [ ] No conflicts with existing grid snap system
- [ ] Mobile touch support (tap to snap)

### NFR-4: Accessibility
- [ ] Color-blind safe palette (verified with simulators)
- [ ] Indicator tooltips describe snap type
- [ ] Keyboard-only snap control (future)
- [ ] Screen reader announces snap events (future)

---

## UI/UX Requirements

### UX-1: Visual Hierarchy
**Requirement**: Indicators must be visible but not distracting

**Design Principles**:
- Professional CAD aesthetic (not playful/gamified)
- Subtle presence when idle, prominent when active
- Color-coded by snap type (industry standard colors)
- Consistent sizing and opacity

**Visual Feedback Layers**:
1. **Background**: Grid lines (subtle gray)
2. **Shapes**: Drawn land parcels (user content)
3. **Indicators**: Snap points (semi-transparent, color-coded)
4. **Active Snap**: Highlighted indicator (brighter, larger)
5. **Cursor**: Crosshair cursor (always on top)

---

### UX-2: Snap Confirmation
**Requirement**: Clear indication when snap is active

**Visual Confirmation**:
- Active snap indicator pulses gently
- Cursor position locks to snap point
- Tooltip shows snap type and coordinates (optional)

**Audio Confirmation** (Future):
- Subtle click sound when snapping
- Different tones for different snap types
- Can be disabled in settings

---

### UX-3: Progressive Disclosure
**Requirement**: Don't overwhelm beginners

**Default State**:
- Shape snap **disabled** by default
- User must explicitly enable via Properties Panel
- First-time user sees tooltip explaining feature

**Power User Mode** (Future):
- Advanced snap types hidden by default
- "Show Advanced Snap Types" checkbox reveals more options
- Keyboard shortcuts for expert users

---

## Technical Constraints

### TC-1: Architecture
- Must use Zustand store for state management
- Must use inline styles (no CSS imports)
- Must integrate with existing SnapGrid and snapService
- Must work with React Three Fiber rendering pipeline

### TC-2: Dependencies
- Three.js (existing)
- @react-three/fiber (existing)
- @react-three/drei (existing)
- No new external libraries required

### TC-3: Browser Support
- Modern browsers with WebGL support
- Desktop: Chrome 90+, Firefox 88+, Safari 14+
- Mobile: iOS Safari 14+, Chrome Android 90+

---

## Success Metrics

### Functional Metrics
- [ ] All 4 essential snap types working (endpoint, midpoint, center, grid)
- [ ] Visual indicators appear within 100ms of cursor movement
- [ ] Snap accuracy: ±0.01m precision
- [ ] Zero false positives in controlled testing

### Performance Metrics
- [ ] 60 FPS maintained with 10 shapes on canvas
- [ ] <5ms indicator render time per frame
- [ ] <16ms snap detection cycle time
- [ ] Memory stable after 30 minutes (<5MB increase)

### User Satisfaction Metrics
- [ ] Users can snap to corners without zooming in
- [ ] Indicators visible but not distracting
- [ ] Snap priority system feels natural
- [ ] No user reports of "snap not working"

---

## Out of Scope (Phase 1)

The following features are **not included** in this specification:

❌ Advanced snap types (intersection, perpendicular, extension, tangent)
❌ Keyboard shortcuts ('S' to toggle snap)
❌ Audio feedback on snap
❌ Haptic feedback on mobile
❌ Snap history/undo
❌ Custom snap point creation
❌ Snap to imported reference images
❌ Snap angles (e.g., 45° increments)
❌ Smart guides (Figma-style alignment lines)

These features may be added in future iterations.

---

## Dependencies & Integration

### Existing Systems to Integrate With:
1. **Drawing Canvas** (`DrawingCanvas.tsx`)
   - Already calls `performSnapDetection()`
   - Just need to enable snap config

2. **Snap Grid** (`SnapGrid.ts`)
   - Fully functional spatial indexing system
   - Already extracts snap points from shapes

3. **Snap Service** (`snapService.ts`)
   - Professional snap detection logic
   - Already calculates priorities

4. **Snap Indicator** (`SnapIndicator.tsx`)
   - Visual rendering system
   - Already handles all snap types

5. **Properties Panel** (`PropertiesPanel.tsx`)
   - UI location for toggle controls
   - Needs new "Shape Snapping" section

### No Breaking Changes:
- Existing grid snap system unaffected
- All drawing tools continue to work
- Performance characteristics maintained

---

## Risks & Mitigation

### Risk 1: Visual Clutter
**Risk**: Too many indicators confuse users
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Limit to 25 indicators max
- Distance-based culling
- Priority filtering
- User can disable snap

### Risk 2: Performance Degradation
**Risk**: Snap detection slows down drawing
**Probability**: Low
**Impact**: High
**Mitigation**:
- 60fps throttling already implemented
- Spatial indexing for O(1) lookups
- Cached snap points
- Auto-disable if FPS < 30

### Risk 3: False Positives
**Risk**: Cursor snaps when user doesn't want it to
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Small snap radius (5cm in 2D)
- User can toggle snap off
- Future: Hold Shift to disable temporarily

### Risk 4: Indicator Visibility in 2D
**Risk**: Indicators too small in 2D top-down view
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Adaptive sizing (10x larger in 2D)
- User testing to validate sizes
- Configurable indicator size (future)

---

## Testing Strategy

### Unit Tests
- [ ] SnapGrid.findNearestSnapPoint() returns correct snap
- [ ] Snap priority sorting works correctly
- [ ] Mode-specific radius applied correctly
- [ ] Snap point caching invalidates on shape change

### Integration Tests
- [ ] Indicators appear when cursor near snap points
- [ ] Cursor actually snaps to indicator positions
- [ ] Performance maintained with 10 shapes
- [ ] Clean state when leaving canvas

### Visual Regression Tests
- [ ] Screenshot comparison of indicator appearance
- [ ] Verify colors match specification
- [ ] Verify sizes in both 2D and 3D modes
- [ ] Check indicator positioning accuracy

### User Acceptance Tests
- [ ] Draw rectangle snapping to existing corners
- [ ] Draw circle snapping to edge midpoints
- [ ] Enable/disable snap via Properties Panel
- [ ] Use grid + shape snap together

---

## Documentation Requirements

### Code Documentation
- [ ] JSDoc comments for new functions
- [ ] Inline comments explaining snap priority logic
- [ ] README section on snap system usage

### User Documentation
- [ ] Update user guide with snap feature
- [ ] Add tooltips to UI controls
- [ ] Create video tutorial (optional)

### Developer Documentation
- [ ] Architecture diagram of snap system
- [ ] Snap type priority table
- [ ] Performance optimization notes

---

## Approval & Sign-off

**Specification Created By**: Claude (AI Assistant)
**Approved By**: User
**Approval Date**: 2025-10-02
**Estimated Implementation Time**: 2-3 hours
**Target Completion**: 2025-10-02

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-02 | Claude | Initial specification based on approved recommendation |

---

## Related Documents

- `plan.md` - Technical implementation plan
- `tasks.md` - Step-by-step task breakdown
- `/app/src/utils/SnapGrid.ts` - Existing snap grid implementation
- `/app/src/services/snapService.ts` - Existing snap service
- `/app/src/components/Scene/SnapIndicator.tsx` - Existing indicator renderer
- `SNAP_INDICATOR_FIX_PLAN.md` - Previous snap optimization work

---

**Next Steps**: Proceed to `plan.md` for technical implementation details.
