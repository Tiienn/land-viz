# Specification: Screen-Space Adaptive Snap Radius

**Spec ID:** 009
**Feature:** Screen-Space Adaptive Snap Radius (AutoCAD-Style)
**Status:** Draft
**Created:** 2025-10-04
**Author:** Land Visualizer Team

---

## 1. Executive Summary

### Problem Statement
Current snap detection uses a fixed world-space radius (default 15m). This creates inconsistent user experience:
- **Zoomed Out**: Indicators appear too early, cluttering the view
- **Zoomed In**: Users must move cursor very close to see indicators, feeling unresponsive
- **User Complaint**: "I want as Snap indicator detect my crosshair. And when I click. Thats the distance it should snap. As soon as the snap indicator appear, I left click, it SNAP"

### Solution Overview
Implement **screen-space adaptive snap radius** that automatically adjusts based on camera distance, similar to AutoCAD/Revit professional CAD systems:
- **Constant screen-space perception**: Indicators always appear at the same visual distance from cursor
- **Automatic zoom adaptation**: Far zoom = larger world radius, close zoom = smaller world radius
- **Professional workflow**: Matches industry-standard CAD behavior

### Success Metrics
- ✅ Indicators appear at consistent screen distance (50-100 pixels) at all zoom levels
- ✅ Click-to-snap works immediately when indicator is visible
- ✅ No performance degradation (maintain 60 FPS)
- ✅ Backward compatible with existing snap system

---

## 2. User Stories

### US-001: Consistent Snap Detection at All Zoom Levels
**As a** land designer
**I want** snap indicators to appear at a consistent visual distance from my cursor
**So that** the tool feels responsive regardless of zoom level

**Acceptance Criteria:**
- [ ] Indicators appear ~50-100px from cursor (screen space) at all zoom levels
- [ ] Clicking immediately snaps when indicator is visible
- [ ] Zoom in/out doesn't change perceived snap sensitivity
- [ ] Smooth transition when zoom changes

### US-002: Professional CAD Experience
**As a** professional CAD user
**I want** snap behavior similar to AutoCAD/Revit
**So that** I can work efficiently without adjusting settings

**Acceptance Criteria:**
- [ ] Screen-space radius feels natural and predictable
- [ ] No manual radius adjustment needed
- [ ] Works for all snap types (endpoint, midpoint, center)
- [ ] Maintains precision at all zoom levels

### US-003: Performance Optimization
**As a** user working on complex scenes
**I want** snap detection to remain fast
**So that** my workflow isn't interrupted by lag

**Acceptance Criteria:**
- [ ] Maintain 60 FPS during cursor movement
- [ ] Snap calculation completes within 16ms
- [ ] No frame drops when many shapes are present
- [ ] Efficient radius recalculation on zoom

---

## 3. Functional Requirements

### FR-001: Screen-Space to World-Space Conversion
**Priority:** High
**Description:** Convert screen-space pixel radius to world-space distance based on camera position

**Details:**
- Calculate world-space radius from screen pixels using camera distance
- Update radius dynamically on camera zoom/pan
- Cache calculation to avoid redundant computations
- Handle orthographic vs perspective projection differences

**Dependencies:**
- Three.js camera API
- Current camera distance to target
- Viewport dimensions

### FR-002: Dynamic Radius Updates
**Priority:** High
**Description:** Recalculate snap radius whenever camera changes

**Details:**
- Listen to camera movement events
- Throttle updates to 60 FPS (16ms)
- Smooth radius transitions to avoid jarring changes
- Update both indicator detection and click-snap radius

**Dependencies:**
- Camera controller events
- Throttling utility
- Snap configuration system

### FR-003: Backward Compatibility
**Priority:** Medium
**Description:** Maintain compatibility with existing snap system

**Details:**
- Preserve manual radius override option
- Allow toggling between fixed and adaptive modes
- Keep existing snap point detection logic
- Maintain current UI controls

**Dependencies:**
- useDrawingStore snap configuration
- Properties panel controls
- Existing snap service

### FR-004: Configurable Screen-Space Distance
**Priority:** Low
**Description:** Allow users to configure screen-space pixel distance

**Details:**
- Default: 75 pixels (balanced for most users)
- Range: 30-150 pixels
- UI slider in Properties panel
- Persist setting in local storage

**Dependencies:**
- Properties panel UI
- Local storage service
- Configuration persistence

---

## 4. Technical Requirements

### TR-001: Camera Distance Calculation
```typescript
// Calculate world-space radius from screen-space pixels
function screenSpaceToWorldSpace(
  screenPixels: number,
  camera: Camera,
  targetPoint: Vector3
): number {
  const cameraDistance = camera.position.distanceTo(targetPoint);
  const fov = camera.fov * (Math.PI / 180); // Convert to radians
  const heightAtDistance = 2 * Math.tan(fov / 2) * cameraDistance;
  const pixelWorldRatio = heightAtDistance / viewport.height;
  return screenPixels * pixelWorldRatio;
}
```

### TR-002: Throttled Update System
```typescript
// Update radius on camera changes with throttling
const updateSnapRadius = throttle(() => {
  const worldRadius = screenSpaceToWorldSpace(
    screenSpacePixels,
    camera,
    cursorWorldPosition
  );
  setSnapRadius(worldRadius);
}, 16); // 60 FPS
```

### TR-003: Integration Points
**Files to Modify:**
- `DrawingCanvas.tsx`: Update snap radius calculation
- `SnapIndicator.tsx`: Use dynamic radius for display
- `useDrawingStore.ts`: Add adaptive mode configuration
- `PropertiesPanel.tsx`: Add screen-space pixel control

---

## 5. UI/UX Requirements

### UX-001: Visual Consistency
- Indicators always appear at same visual distance from cursor
- No sudden jumps when zoom changes
- Smooth fade-in/out on radius changes
- Clear visual feedback at all zoom levels

### UX-002: Properties Panel Controls
**New Section: "Snap Detection Mode"**
```
┌─────────────────────────────────┐
│ Snap Detection Mode             │
├─────────────────────────────────┤
│ ○ Fixed Radius (Advanced)       │
│ ● Adaptive (Recommended)        │
│                                  │
│ Screen Distance: 75px           │
│ ────────●──────── [30-150px]   │
│                                  │
│ Current World Radius: 12.3m     │
└─────────────────────────────────┘
```

### UX-003: Visual Indicators
- Show current world radius as info text (for debugging/transparency)
- Subtle animation when radius changes
- Tooltip explaining adaptive mode benefits

---

## 6. Edge Cases & Constraints

### EC-001: Extreme Zoom Levels
**Scenario:** User zooms very far in/out
**Handling:**
- Clamp world radius between 0.1m and 100m
- Prevent excessively small/large snap areas
- Maintain usability at extremes

### EC-002: Perspective vs Orthographic
**Scenario:** Camera switches between projection modes
**Handling:**
- Detect projection type change
- Recalculate radius using appropriate formula
- Orthographic: simplified pixel-to-world conversion

### EC-003: Multiple Shapes Nearby
**Scenario:** Many snap points within adaptive radius
**Handling:**
- Prioritize closest snap point (existing behavior)
- Limit max visible indicators (existing: 50)
- Performance optimization for dense scenes

### EC-004: Rapid Camera Movement
**Scenario:** User quickly zooms/pans
**Handling:**
- Throttle radius updates to 16ms
- Debounce final radius calculation
- Avoid recalculation spam

---

## 7. Performance Considerations

### PC-001: Calculation Frequency
- **Target:** Recalculate only on camera change
- **Throttle:** 16ms (60 FPS)
- **Cache:** Store last calculated radius
- **Optimization:** Skip update if camera distance change < 1%

### PC-002: Memory Impact
- **New State:** ~2 variables (screenSpacePixels, lastCameraDistance)
- **Event Listeners:** 1 camera change listener
- **Overhead:** Negligible (<0.1% memory increase)

### PC-003: Render Impact
- **Frame Budget:** <1ms for radius calculation
- **Indicator Updates:** Reuse existing rendering pipeline
- **No Additional Draws:** Leverage current snap indicator system

---

## 8. Testing Strategy

### Unit Tests
- [ ] Screen-space to world-space conversion accuracy
- [ ] Radius clamping at extreme zoom levels
- [ ] Throttle/debounce behavior
- [ ] Orthographic vs perspective calculations

### Integration Tests
- [ ] Snap detection with adaptive radius
- [ ] Click-to-snap precision
- [ ] Camera zoom/pan triggers radius update
- [ ] Mode switching (fixed ↔ adaptive)

### Visual Regression Tests
- [ ] Indicators appear at consistent screen distance
- [ ] No visual glitches during zoom
- [ ] Smooth transitions on camera movement
- [ ] Properties panel controls work correctly

### Performance Tests
- [ ] 60 FPS maintained during cursor movement
- [ ] Radius calculation <1ms
- [ ] No memory leaks on repeated zoom
- [ ] Scales to 100+ shapes

---

## 9. Dependencies & Risks

### Dependencies
- Three.js camera API (existing)
- Throttle utility (lodash or custom)
- Zustand state management (existing)
- React hooks (existing)

### Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Complex camera math errors | High | Medium | Comprehensive unit tests, reference AutoCAD behavior |
| Performance degradation | High | Low | Throttling, caching, early performance testing |
| User confusion with new mode | Medium | Low | Default to adaptive, clear UI labels, tooltips |
| Backward compatibility issues | Medium | Low | Feature flag, gradual rollout, preserve old behavior |

---

## 10. Future Enhancements

### FE-001: Per-Tool Radius
- Different screen-space distances for different tools
- Line tool: 50px, Shape tools: 75px, etc.

### FE-002: Adaptive Sensitivity
- Learn from user behavior
- Increase radius if user frequently misses snaps
- Decrease if user prefers precision

### FE-003: Multi-Monitor Support
- Detect monitor DPI differences
- Adjust screen-space pixels per display
- Consistent experience across screens

---

## 11. Acceptance Criteria Summary

**Feature is complete when:**
- [ ] Indicators appear at consistent ~75px screen distance at all zoom levels
- [ ] Clicking always snaps when indicator is visible (0.000m precision)
- [ ] Performance maintains 60 FPS with adaptive radius
- [ ] Properties panel has mode toggle and screen-space pixel control
- [ ] Works for all snap types (endpoint, midpoint, center, grid)
- [ ] Backward compatible with manual radius mode
- [ ] All tests pass (unit, integration, performance, visual)
- [ ] Documentation updated with new feature

---

## 12. Open Questions

1. **AMBIGUITY:** Should adaptive mode be default for new users?
   - Recommendation: Yes, with option to switch to fixed mode

2. **AMBIGUITY:** What screen-space distance feels most natural?
   - Recommendation: 75px (test with users, adjust if needed)

3. **AMBIGUITY:** Should we animate radius changes or instant update?
   - Recommendation: Instant (simpler, matches CAD tools)

4. **AMBIGUITY:** How to handle touch devices with no hover?
   - Recommendation: Larger screen-space distance (100px) for touch

---

## 13. References

- [AutoCAD Object Snap Documentation](https://www.cadtutor.net/tutorials/autocad/object-snap.php)
- [Three.js Camera API](https://threejs.org/docs/#api/en/cameras/Camera)
- [Project Constitution](../../docs/project/CONSTITUTION.md)
- [Existing Snap System](../../app/src/services/snapService.ts)
