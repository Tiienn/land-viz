# Spec 003: Cursor-Based Rotation Mode

**Status**: Draft
**Created**: 2025-10-01
**Author**: User Request
**Priority**: High

## Overview

Add a cursor-based rotation mode where users can rotate shapes by simply moving their cursor after pressing the Rotate button, without holding and dragging. A single click locks in the rotation at the current angle.

## Problem Statement

Currently, users must:
1. Click the Rotate button
2. Click and hold on the rotation handle
3. Drag to rotate the shape

This requires precise mouse control and can be tiring for multiple rotations. Users want a more fluid "hover and click" workflow similar to CAD tools.

## User Stories

### Primary User Story
**As a** land surveyor
**I want to** rotate shapes by moving my cursor and clicking
**So that** I can quickly adjust orientations without precise dragging

### Acceptance Criteria
- [ ] Clicking Rotate button with a shape selected enters cursor rotation mode
- [ ] Shape rotates in real-time as cursor moves
- [ ] Rotation handle remains visible during cursor mode
- [ ] Single click locks in the rotation at current angle
- [ ] Shift key enables 45° angle snapping
- [ ] Current angle is displayed while rotating
- [ ] ESC key exits rotation mode
- [ ] Clicking Rotate button again exits rotation mode
- [ ] Selecting different tool/shape exits rotation mode
- [ ] Mode does NOT affect existing drag-to-rotate functionality
- [ ] Undo/redo works for cursor-based rotations

## Functional Requirements

### FR1: Mode Activation
- **Trigger**: User clicks Rotate button in ribbon with shape selected
- **State Change**: Enter cursor rotation mode
- **Visual Feedback**:
  - Rotation handle stays visible
  - Angle display appears (e.g., "45°")
  - Guide line from shape center to cursor
- **Mode Indicator**: Button highlight or active state

### FR2: Cursor-Based Rotation
- **Behavior**: Shape rotates to follow cursor position relative to shape center
- **Rotation Point**: Always shape center
- **Live Preview**: Shape updates in real-time as cursor moves
- **Angle Calculation**: Based on cursor position relative to shape center
- **Reference Point**: Initial cursor position when mode is entered

### FR3: Angle Snapping
- **Trigger**: Hold Shift key while moving cursor
- **Snap Angles**: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
- **Visual Feedback**: Snap indicator shows when angle is locked to snap point
- **Tolerance**: ±5° snap range

### FR4: Rotation Confirmation
- **Trigger**: Single left-click anywhere in the scene
- **Action**:
  - Lock in current rotation angle
  - Save to history for undo/redo
  - Stay in cursor rotation mode
- **Multiple Rotations**: User can continue rotating and clicking

### FR5: Mode Exit
- **Exit Methods**:
  - Click Rotate button again
  - Press ESC key
  - Select different tool from ribbon
  - Select different shape
- **Cleanup**:
  - Commit final rotation to history
  - Clear visual guides
  - Return to normal state

### FR6: Visual Feedback
- **Angle Display**: Show current angle (e.g., "127°" or "45° (snapped)")
- **Guide Line**: Line from shape center to cursor position
- **Live Preview**: Shape updates in real-time
- **Rotation Handle**: Remains visible throughout

### FR7: Compatibility
- **Existing Feature**: Drag-to-rotate on rotation handle still works
- **Mode Independence**: Cursor mode only active when explicitly enabled
- **No Conflicts**: Both rotation methods can be used interchangeably

## Non-Functional Requirements

### NFR1: Performance
- **Target**: 60 FPS during continuous cursor movement
- **Throttling**: Rotation calculations throttled to 16ms intervals
- **Optimization**: Use refs for immediate value access

### NFR2: Usability
- **Discoverability**: Tooltip or help text explains cursor mode
- **Intuitive**: Behavior matches user mental model
- **Forgiving**: Easy to exit mode and retry

### NFR3: Accessibility
- **Keyboard**: ESC key exits mode
- **Screen Readers**: Announce mode state changes
- **Visual Contrast**: Guides visible on all backgrounds

## Edge Cases

### EC1: Rapid Tool Switching
**Scenario**: User rapidly clicks between tools while in cursor rotation mode
**Expected**: Mode exits cleanly, no state corruption

### EC2: Multi-Shape Selection
**Scenario**: User enters cursor rotation mode with multiple shapes selected
**Expected**: Mode applies to primary/selected shape only, or shows error

### EC3: Shape Deletion
**Scenario**: User deletes shape while in cursor rotation mode
**Expected**: Mode exits gracefully, no crashes

### EC4: Cursor Outside Canvas
**Scenario**: Cursor moves outside 3D canvas while in rotation mode
**Expected**: Rotation continues based on last known position or freezes

### EC5: Rotation During Pan/Zoom
**Scenario**: User tries to pan/zoom camera while in rotation mode
**Expected**: Camera controls disabled or mode exits

## UI/UX Requirements

### Visual Design
- **Guide Line**: 2px purple dashed line from center to cursor
- **Angle Display**: Floating label near cursor, white text on semi-transparent background
- **Snap Indicator**: Green circle when snapped to 45° angle
- **Button State**: Rotate button highlighted when mode is active

### Interaction Flow
```
1. User selects rectangle shape
2. User clicks Rotate button in ribbon
   → Rotation handle appears
   → Guide line appears
   → Angle display shows "0°"
3. User moves cursor around shape
   → Shape rotates in real-time
   → Angle display updates (e.g., "37°")
4. User holds Shift
   → Angle snaps to nearest 45° (e.g., "45°")
   → Snap indicator appears
5. User clicks once
   → Rotation locked at 45°
   → History saved for undo
   → Mode remains active
6. User presses ESC
   → Mode exits
   → Guide line disappears
   → Button returns to normal state
```

### Error States
- **No Shape Selected**: Show tooltip "Select a shape first"
- **Multi-Shape Selection**: Show tooltip "Select a single shape to rotate"
- **Invalid Shape**: Show tooltip "This shape cannot be rotated"

## Success Metrics

- [ ] Users can rotate shapes 50% faster than drag method
- [ ] No performance degradation during cursor rotation
- [ ] Zero state corruption bugs
- [ ] Positive user feedback on usability

## Dependencies

- Existing rotation system (RotationControls.tsx)
- Zustand store (useAppStore.ts)
- Three.js raycasting for cursor position
- Pointer event handling system

## References

- Existing rotation implementation: `app/src/components/Scene/RotationControls.tsx`
- Store rotation actions: `app/src/store/useAppStore.ts:2816-2846`
- Similar cursor-based mode: Drawing tools in `DrawingCanvas.tsx`

## Open Questions

- Should camera controls (pan/zoom) be disabled during cursor rotation mode?
- Should there be a maximum rotation speed limit?
- Should the guide line have an arrowhead at the cursor end?

## Ambiguities

None identified - all requirements clarified with user.

---

**Next Steps**: Review this specification, then proceed to implementation plan.
