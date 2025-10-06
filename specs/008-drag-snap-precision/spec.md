# Spec 008: Drag Snap Precision (Canva-Style Edge Snapping)

**Status**: Draft
**Created**: 2025-10-03
**Updated**: 2025-10-03
**Author**: AI Assistant
**Stakeholder**: User

## Executive Summary

Implement precise edge snapping during shape dragging operations that combines both CAD-style snap indicators (blue circles, orange squares) and Canva-style alignment guides (pink dotted lines) with magnetic "sticky" behavior for tactile feedback.

## Problem Statement

Currently, the Land Visualizer has two separate snapping systems:
1. **Shape snapping** (CAD-style) - Shows snap indicators during **drawing** only
2. **Alignment guides** (Canva-style) - Shows purple guides during **dragging** for equal spacing

**Gap**: When dragging shapes, there's no way to snap precisely to edges (0 spacing) of other shapes. Users cannot achieve perfect alignment or touching boundaries during drag operations.

## User Stories

### Primary User Stories

**US-1**: As a land surveyor, I want to drag a parcel shape until it touches another parcel perfectly (0 spacing) so that I can model adjacent properties accurately.

**US-2**: As a designer, I want to see both alignment guides AND snap indicators while dragging so that I can choose between equal spacing or precise edge alignment.

**US-3**: As a CAD user, I want drag movement to "stick" briefly when snapping occurs so that I can feel the magnetic lock through cursor behavior (Canva-style).

**US-4**: As a precision-focused user, I want edge snapping to be perfectly accurate (0.000m spacing) so that there are no gaps between shapes.

### Secondary User Stories

**US-5**: As a mobile user, I want the snap system to work smoothly on touch devices without performance lag.

**US-6**: As a power user, I want to control snap radius independently for drawing vs dragging contexts.

## Functional Requirements

### FR-1: Snap Point Detection During Drag
- **MUST** detect all snap points on nearby shapes during drag operations
- **MUST** support all snap types: endpoint, midpoint, center, edge
- **MUST** use precision radius of 0.5-2m for drag context (configurable)
- **MUST** detect snap points in real-time at 60 FPS (16ms throttle)

### FR-2: Visual Feedback System
- **MUST** show snap indicators during dragging (same visuals as drawing mode):
  - 🔵 Blue circles (1.0m radius) at endpoints (corners)
  - 🟠 Orange squares (0.7-1.1m) at midpoints (edges)
  - 🟢 Green crosshairs (1.2m) at centers
- **MUST** show alignment guides simultaneously:
  - 💗 Pink dotted lines for center alignment
  - 🟣 Purple spacing badges for equal distribution
- **MUST** render both systems without visual conflicts

### FR-3: Sticky Snap Behavior (Canva-Style)
- **MUST** implement "magnetic lock" when entering snap zone:
  - Drag movement slows down by 70-80% when snap activates
  - Position locks to exact snap point (0.000m precision)
  - Brief delay (50-100ms) before releasing from snap
- **MUST** provide tactile feedback through cursor behavior
- **MUST NOT** force snapping - user can drag through with continued force

### FR-4: Dual Snapping Logic
- **MUST** support both edge snapping AND alignment simultaneously
- **MUST** apply edge snap when within 0.5m of shape boundary
- **MUST** apply alignment guide when on center/spacing line
- **MUST** allow both snaps to be active at once (no priority system)

### FR-5: Precision Requirements
- **MUST** achieve 0.000m spacing for edge-to-edge snapping
- **MUST** snap to exact pixel coordinates in both 2D and 3D modes
- **MUST** maintain precision across zoom levels

### FR-6: Configuration
- **MUST** respect existing snap configuration in Properties panel:
  - Master toggle (SNAP ON/OFF)
  - Snap radius slider (1-20m)
  - Active snap types checkboxes
- **SHOULD** add separate "Drag Snap Radius" setting (default 2m)

## Non-Functional Requirements

### NFR-1: Performance
- **MUST** maintain 60 FPS during drag operations
- **MUST** throttle snap detection to 16ms cycles
- **MUST** use spatial indexing for efficient snap point lookup
- **MUST NOT** cause frame drops or jank on mid-range hardware

### NFR-2: Compatibility
- **MUST** work in both 2D and 3D view modes
- **MUST** support touch devices and mouse input
- **MUST** work with rotated shapes
- **MUST** integrate with existing undo/redo system

### NFR-3: Accessibility
- **SHOULD** provide audio feedback for snap activation (optional)
- **SHOULD** support keyboard modifiers for snap override (Shift to disable?)

## User Interface Requirements

### Visual Design
- Follow existing snap indicator design (SnapIndicator.tsx)
- Use existing alignment guide design (SimpleAlignmentGuides.tsx)
- No new UI controls needed (use existing Properties panel)

### Interaction Flow

```
1. User clicks shape to select
2. User starts dragging shape
3. System detects nearby shapes (within 8m threshold)
4. System generates snap points from nearby shapes
5. System shows snap indicators (blue/orange/green) at valid snap points
6. System shows alignment guides (pink lines) when aligned
7. User drags near snap point (within 2m)
8. System applies "sticky" behavior:
   - Drag speed reduces by 80%
   - Position locks to snap point
   - Visual feedback intensifies (blink effect?)
9. User continues drag or releases to lock position
10. System finalizes shape position with exact coordinates
```

## Acceptance Criteria

### AC-1: Edge Snapping Works
```
GIVEN Shape A is selected and being dragged
AND Shape B exists nearby
AND SNAP is ON with "endpoint" type enabled
WHEN cursor moves within 2m of Shape B's corner
THEN blue circle indicator appears at corner
AND drag movement slows down
AND shape snaps to 0.000m distance from corner
```

### AC-2: Both Systems Work Together
```
GIVEN Shape A is being dragged between Shape B and Shape C
AND shapes are aligned for equal spacing
WHEN drag position creates alignment opportunity
THEN pink dotted alignment guide appears
AND orange square indicators appear at edge midpoints
AND both snapping behaviors are active simultaneously
```

### AC-3: Sticky Behavior
```
GIVEN drag snapping is active at a corner
WHEN user continues dragging away
THEN snap releases after 50-100ms delay
AND normal drag speed resumes
AND indicator fades out smoothly
```

### AC-4: Performance
```
GIVEN 50 shapes on canvas
AND complex shape being dragged
WHEN dragging across entire canvas
THEN FPS remains ≥ 60
AND snap detection completes within 16ms
AND no visual stuttering occurs
```

### AC-5: Precision
```
GIVEN Shape A is snapped to Shape B's edge
WHEN measuring distance between edges
THEN distance = 0.000m (perfect contact)
AND no gaps visible at any zoom level
```

## Edge Cases

1. **Rotated shapes**: Snap points must use rotated coordinates
2. **Overlapping shapes**: Snap to nearest valid point
3. **Multiple snap candidates**: Show all indicators, lock to nearest
4. **Snap disabled mid-drag**: Release snap immediately, resume normal drag
5. **Very small shapes**: Ensure indicators don't overwhelm shape visuals
6. **Extreme zoom levels**: Scale indicators appropriately
7. **Touch devices**: Adjust snap radius for finger precision (maybe 3m instead of 2m)

## Out of Scope

- Snap-to-angle during drag (separate feature)
- Snap history/replay
- Custom snap point creation
- Snap configuration profiles
- Distance-based snap strength falloff

## Dependencies

- Existing `SnapGrid` utility (C:\Users\Tien\Documents\land-viz\app\src\utils\SnapGrid.ts)
- Existing `SimpleAlignment` service (C:\Users\Tien\Documents\land-viz\app\src\services\simpleAlignment.ts)
- Existing `SnapIndicator` component (C:\Users\Tien\Documents\land-viz\app\src\components\Scene\SnapIndicator.tsx)
- Existing drag system in `useAppStore.ts` (lines 1717-1872)

## Success Metrics

- **Adoption**: 80%+ of drag operations use snapping
- **Precision**: 100% of edge snaps achieve 0.000m spacing
- **Performance**: 0 complaints about lag or stuttering
- **User Satisfaction**: Positive feedback on "feels like Canva"

## Open Questions / Ambiguities

1. **AMBIGUITY**: Should snap radius for dragging be user-configurable or hardcoded?
   - **Recommendation**: Start with hardcoded 2m, add config later if needed

2. **AMBIGUITY**: Should we add visual "SNAP" confirmation text when snap activates?
   - **Recommendation**: Yes, reuse existing green "SNAP" badge from equal spacing system

3. **AMBIGUITY**: What happens if user holds Shift while dragging? Disable snapping?
   - **Recommendation**: Shift disables snapping (standard CAD behavior)

4. **AMBIGUITY**: Should we log snap events for analytics/debugging?
   - **Recommendation**: Yes, use existing logger with 'debug' level

## References

- User screenshot showing desired behavior: [Provided in conversation]
- Canva drag behavior: https://www.canva.com
- Existing equal spacing system: `specs/007-shape-snapping-system/`
- Snap indicator sizes: Updated to 2x larger (Oct 2025)

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-03 | 0.1 | Initial draft | AI Assistant |
