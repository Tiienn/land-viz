# Feature Specification: Shift-Constrained Drawing

**Feature ID**: 017
**Feature Name**: Shift-Constrained Drawing
**Status**: Draft
**Created**: 2025-11-09
**Last Updated**: 2025-11-09

## Overview

Add Shift-key constraint functionality across all drawing tools (Rectangle, Circle, Polyline, Line) **and when dragging/moving shapes** to enable users to create perfectly proportioned shapes, straight lines, and axis-locked movement. This is a standard CAD/design tool feature found in applications like AutoCAD, Figma, Canva, and Adobe Illustrator.

**Includes:**
1. **Drawing Constraints**: Hold Shift while drawing to create squares, straight lines, or constrained angles
2. **Dragging Constraints**: Hold Shift while dragging shapes/text to lock movement to horizontal or vertical axis only (Canva/Figma behavior)

## Problem Statement

Currently, users cannot easily:
- Draw perfect squares from rectangles
- Draw perfectly horizontal/vertical lines
- Create constrained polyline segments at 0°, 45°, or 90° angles
- Draw circles with perfectly horizontal/vertical radius indicators
- **Move shapes in perfectly horizontal or vertical paths (axis-locked dragging)**
- **Align text boxes horizontally or vertically while dragging**

This makes it difficult to create precise, professional drawings aligned to cardinal directions and maintain alignment when repositioning elements.

## User Stories

### US-017.1: Square Drawing (Rectangle Tool + Shift)
**As a** land planner
**I want to** hold Shift while drawing rectangles
**So that** I can create perfect squares quickly without manual measurement

**Acceptance Criteria:**
- When Shift is held during rectangle drawing (after first click), the rectangle maintains equal width and height
- The square dimensions follow the larger of the two cursor distances (width vs height)
- Visual preview updates in real-time showing the constrained square shape
- Dimension overlay shows identical width × height values (e.g., "10m × 10m")
- Releasing Shift reverts to normal rectangle drawing behavior
- Snapping still works while Shift is held

### US-017.2: Straight Line Drawing (Line Tool + Shift)
**As a** property surveyor
**I want to** hold Shift while drawing lines
**So that** I can create perfectly horizontal, vertical, or 45° angled lines

**Acceptance Criteria:**
- When Shift is held during line drawing, the preview line snaps to nearest cardinal/diagonal angle (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
- The line maintains the exact distance from start point to cursor
- Visual preview shows the constrained line in real-time
- Angle snapping uses 45° increments (8 directions)
- Distance input still works with Shift constraint
- Releasing Shift allows free-form line drawing

### US-017.3: Constrained Polyline (Polyline Tool + Shift)
**As a** site designer
**I want to** hold Shift while drawing polyline segments
**So that** I can create precise architectural layouts with orthogonal/diagonal edges

**Acceptance Criteria:**
- When Shift is held during polyline drawing, each preview segment snaps to nearest cardinal/diagonal angle
- Constraint applies only to the current segment being drawn (from last point to cursor)
- Previously placed points remain unchanged
- The dotted preview line shows the constrained angle
- Point placement still uses snapping system
- Can toggle Shift on/off between different segments
- Closing the polyline (clicking near first point) still works with Shift held

### US-017.4: Straight Radius Circle (Circle Tool + Shift)
**As a** landscape architect
**I want to** hold Shift while drawing circles
**So that** the radius line stays perfectly horizontal, vertical, or diagonal

**Acceptance Criteria:**
- When Shift is held during circle drawing, the radius line (purple line from center to cursor) snaps to nearest cardinal/diagonal angle
- The circle radius follows the cursor distance (not constrained)
- Only the angle of the radius indicator is constrained to 45° increments
- Visual preview shows the constrained radius line
- Dimension input still works with Shift constraint
- The circle itself remains perfectly round (not an ellipse)

### US-017.5: Axis-Locked Shape Dragging (All Shapes + Shift) 🆕
**As a** designer
**I want to** hold Shift while dragging shapes
**So that** shapes only move horizontally OR vertically (not diagonally)

**Acceptance Criteria:**
- When Shift is held while dragging a shape, movement is locked to the dominant axis
- If horizontal movement (|deltaX|) is greater: shape only moves left/right (vertical position locked)
- If vertical movement (|deltaY|) is greater: shape only moves up/down (horizontal position locked)
- Axis locking applies to: rectangles, circles, polylines, lines, polygons
- Multi-selection dragging respects Shift constraint (all selected shapes move on locked axis)
- Pressing Shift mid-drag immediately locks to the current dominant axis
- Releasing Shift mid-drag immediately unlocks axis (free movement resumes)

### US-017.6: Axis-Locked Text Dragging (Text Objects + Shift) 🆕
**As a** content creator
**I want to** hold Shift while dragging text boxes
**So that** I can align text horizontally or vertically with other elements

**Acceptance Criteria:**
- When Shift is held while dragging text objects, movement is locked to dominant axis
- Same axis-locking behavior as shapes (horizontal or vertical only)
- Text dragging respects locked/unlocked state (locked text cannot be dragged even with Shift)
- Multi-selection with mixed shapes and text respects Shift constraint uniformly

## Functional Requirements

### FR-017.1: Shift Key Detection
- System must detect Shift key press/release globally during drawing operations
- Shift state must be tracked in application store
- Shift state must update in real-time without lag (<16ms)

### FR-017.2: Rectangle Constraint Logic
- Calculate the maximum dimension (width or height) based on cursor position
- Apply this dimension to both width and height to create a square
- Maintain the first corner point as the anchor
- Support all four quadrants (dragging in any direction from first point)

### FR-017.3: Line/Polyline Angle Constraint Logic
- Calculate angle from start point to cursor position
- Round angle to nearest 45° increment: [0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°]
- Maintain the original distance from start point to cursor
- Apply trigonometry to calculate constrained end point: `{x: startX + distance * cos(constrainedAngle), y: startY + distance * sin(constrainedAngle)}`

### FR-017.4: Circle Radius Angle Constraint Logic
- Calculate angle from center to cursor position
- Round angle to nearest 45° increment
- Maintain the original radius (distance from center to cursor)
- Apply constrained angle only to the visual radius indicator (purple line)
- Circle circumference remains perfectly round

### FR-017.5: Visual Feedback
- All preview visualizations (DrawingFeedback.tsx, PrecisionLinePreview.tsx) must show constrained shapes in real-time
- No visual lag or stuttering during constraint updates
- Constrained shapes must appear identical to unconstrained shapes (same colors, line styles)

### FR-017.6: Axis-Locked Drag Constraint Logic 🆕
- Detect when user starts dragging a shape or text object
- Calculate drag offset: `offsetX = currentX - startX`, `offsetY = currentY - startY`
- Determine dominant axis: `dominantAxis = Math.abs(offsetX) > Math.abs(offsetY) ? 'horizontal' : 'vertical'`
- Apply constraint when Shift is held:
  - If `dominantAxis === 'horizontal'`: Set `offsetY = 0` (only horizontal movement)
  - If `dominantAxis === 'vertical'`: Set `offsetX = 0` (only vertical movement)
- Apply constrained offset to shape/text position
- Update in real-time (<16ms) as drag continues
- **Threshold**: Axis lock activates only after movement exceeds 5 world units (meters) to prevent premature locking (See DD-017.2)

### FR-017.7: Multi-Selection Drag Constraint 🆕
- When multiple shapes/text objects are selected and dragged together
- Apply same axis constraint to all selected elements uniformly
- All elements move together on the locked axis (horizontal or vertical)
- Maintain relative positioning between selected elements

### FR-017.8: Interaction with Existing Systems
- Shift constraint must work seamlessly with:
  - Shape snapping system (snap points, endpoints, midpoints, intersections)
  - Grid snapping
  - Dimension input overlays
  - Alignment guides
  - Direct dimension input (pre-sized shapes)
  - **Shape dragging system (single and multi-selection)** 🆕
  - **Text dragging system** 🆕
- Shift constraint is purely geometric - it constrains shape proportions/angles/movement, not snap behavior

## Non-Functional Requirements

### NFR-017.1: Performance
- Constraint calculations must complete in <5ms per frame
- No impact on 60 FPS rendering performance
- No memory leaks from event listeners

### NFR-017.2: Usability
- Shift behavior must be intuitive and match industry standards (Figma, AutoCAD, Illustrator)
- Constraint must apply immediately when Shift is pressed
- Constraint must release immediately when Shift is released
- No "stuck" Shift state if window loses focus

### NFR-017.3: Accessibility
- Keyboard-only users can use Shift constraint
- Screen reader announces when constraint is active (via ARIA live region)
- Constraint works in both 2D and 3D camera modes

## Edge Cases & Constraints

### EDGE-017.1: Shift Press Timing
- **Scenario**: User presses Shift before starting to draw
- **Behavior**: Constraint should only apply after the first point is placed (during preview phase)

### EDGE-017.2: Shift with Snap Points
- **Scenario**: Constrained shape end point lands on a snap point
- **Behavior**: Apply snap **first**, then apply Shift constraint (Order: Cursor → Snap → Constraint)
- **Rationale**: See DD-017.3 - This allows users to snap to a point, then constrain from that snapped position
- **Example**: Cursor near endpoint → Snaps to endpoint (10.2, 3.7) → Shift constraint applied → Final (10.2, 10.2) for square
- **Note**: Constraint is the final transformation, ensuring geometric precision is maintained

### EDGE-017.3: Shift with Direct Dimension Input
- **Scenario**: User has entered dimensions (e.g., "10x15") and is placing a rectangle while holding Shift
- **Behavior**: Pre-sized shapes ignore Shift constraint (dimensions are already defined)
- **Rationale**: See DD-017.4 - Direct dimension input is explicit user intent, overrides automatic constraints
- **No Error**: Shift key is silently ignored (no toast or warning shown)

### EDGE-017.4: Shift Key Release During Drawing
- **Scenario**: User releases Shift while dragging
- **Behavior**: Shape immediately reverts to unconstrained mode, following cursor exactly

### EDGE-017.5: Window Focus Loss
- **Scenario**: User holds Shift, then Alt+Tab to another window
- **Behavior**: Shift state resets when canvas loses focus (defensive cleanup)

### EDGE-017.6: Polyline Closing with Shift
- **Scenario**: User holds Shift while clicking near the first point to close a polyline
- **Behavior**: Polyline closes normally. Shift constraint does not prevent closing behavior.

### EDGE-017.7: Multi-Segment Line Tool
- **Scenario**: User is drawing multi-segment lines (Line tool) and holds Shift
- **Behavior**: Current segment being previewed respects Shift constraint. Previously completed segments unchanged.

### EDGE-017.8: Shift Mid-Drag 🆕
- **Scenario**: User starts dragging a shape, then presses Shift halfway through the drag
- **Behavior**: Movement immediately locks to the current dominant axis. If user has moved 10px horizontally and 3px vertically, axis locks to horizontal.

### EDGE-017.9: Drag Start with Shift Already Held 🆕
- **Scenario**: User holds Shift, then starts dragging
- **Behavior**: Axis locking only activates after movement exceeds 5 world units (See DD-017.2)
- **Rationale**: Prevents immediate lock when user hasn't established a direction yet
- **Example**: Drag 3 units right, 2 units down → No lock (below threshold). Drag 7 units right, 2 units down → Locks to horizontal

### EDGE-017.10: Locked Shape Drag with Shift 🆕
- **Scenario**: User holds Shift and tries to drag a locked shape
- **Behavior**: Shape does not move (locked state takes precedence). No error message needed - locked shapes never move.

### EDGE-017.11: Multi-Selection with Mixed Locked/Unlocked 🆕
- **Scenario**: User selects 3 shapes (2 unlocked, 1 locked) and drags with Shift held
- **Behavior**: Only unlocked shapes move on locked axis. Locked shape remains in place.
- **Rationale**: See DD-017.5 - Matches Figma behavior (locked objects silently ignored)
- **No Error**: No toast or warning shown - locked shapes simply don't move

## UI/UX Requirements

### UI-017.1: Visual Indicators
- No additional UI indicators needed - constrained shapes are self-evident
- Existing dimension overlays show constrained dimensions (e.g., "10m × 10m" for square)
- Optional: Subtle icon/badge in Properties Panel showing "Shift: Constraint Active" (LOW PRIORITY)

### UI-017.2: Keyboard Shortcut Help
- Update keyboard shortcuts modal (press `?`) to document Shift constraint behavior
- Add one line per tool:
  - "Rectangle: Hold Shift for square"
  - "Circle: Hold Shift for straight radius"
  - "Line/Polyline: Hold Shift for 0°/45°/90° angles"

### UI-017.3: Properties Panel Documentation
- Add tooltip to each drawing tool button explaining Shift behavior
- Example: "Rectangle Tool (R) - Hold Shift while drawing for perfect square"

## Technical Architecture

### Component Changes
- **DrawingCanvas.tsx**: Add Shift key event listeners, track Shift state in store
- **DrawingFeedback.tsx**: Apply constraint logic to rectangle/circle/polyline previews
- **PrecisionLinePreview.tsx**: Apply constraint logic to line tool preview
- **useAppStore.ts**: Add `isShiftKeyPressed: boolean` to drawing state
- **useAppStore.ts → updateDragPosition()**: Apply axis-lock constraint to shape/text dragging 🆕

### Utility Functions (New File)
**File**: `app/src/utils/shapeConstraints.ts`

```typescript
/**
 * Applies square constraint to rectangle coordinates
 * Returns constrained second point that creates a perfect square
 */
export function applySquareConstraint(
  firstPoint: Point2D,
  cursorPoint: Point2D
): Point2D

/**
 * Constrains angle to nearest 45° increment
 * Returns constrained end point maintaining original distance
 */
export function applyAngleConstraint(
  startPoint: Point2D,
  cursorPoint: Point2D,
  angleStep: number = 45
): Point2D

/**
 * Rounds angle to nearest step (0°, 45°, 90°, etc.)
 */
export function roundToNearestAngle(
  angleDegrees: number,
  angleStep: number = 45
): number

/**
 * Applies axis-lock constraint to drag offset 🆕
 * Returns constrained offset locked to dominant axis (horizontal or vertical)
 */
export function applyAxisLockConstraint(
  offsetX: number,
  offsetY: number,
  threshold: number = 5
): { offsetX: number; offsetY: number }
```

### Store Changes
Add to `DrawingState` in useAppStore:
```typescript
isShiftKeyPressed: boolean;  // Tracks Shift key state
setShiftKey: (pressed: boolean) => void;  // Action to update Shift state
```

## Testing Strategy

### Unit Tests
- `shapeConstraints.test.ts`: Test constraint functions with various inputs
  - Square constraint in all four quadrants
  - Angle constraint at all 8 cardinal/diagonal directions
  - Edge cases: zero distance, negative coordinates, very large distances

### Integration Tests
- Test Shift key press/release updates store correctly
- Test constraint applies to each drawing tool (Rectangle, Circle, Line, Polyline)
- Test constraint interaction with snapping (Shift takes priority)
- Test constraint with direct dimension input (ignored for pre-sized shapes)

### Manual Testing Checklist

**Drawing Constraints:**
- [ ] Rectangle: Draw squares in all four quadrants
- [ ] Circle: Draw circles with radius at each 45° angle
- [ ] Line: Draw lines at 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
- [ ] Polyline: Draw polyline with mixed constrained/unconstrained segments
- [ ] Test Shift press/release during drawing (real-time toggle)

**Drag Constraints:** 🆕
- [ ] Rectangle: Drag horizontally with Shift (vertical position locked)
- [ ] Rectangle: Drag vertically with Shift (horizontal position locked)
- [ ] Circle: Drag with axis-lock constraint
- [ ] Polyline: Drag with axis-lock constraint
- [ ] Line: Drag with axis-lock constraint
- [ ] Text: Drag text object with axis-lock constraint
- [ ] Multi-selection: Drag 3 shapes with Shift (all lock to same axis)
- [ ] Press Shift mid-drag (axis locks immediately)
- [ ] Release Shift mid-drag (free movement resumes)
- [ ] Drag locked shape with Shift (no movement)

**Common:**
- [ ] Test window focus loss while holding Shift (cleanup)
- [ ] Test accessibility: keyboard-only workflow
- [ ] Test performance: 60 FPS maintained during constrained drawing/dragging

## Out of Scope

### Future Enhancements (Not Included)
- Custom angle constraints (e.g., 30° or 15° increments) - only 45° for now
- Constrained rotation for existing shapes - this feature is for drawing/dragging only
- Shift+Alt for center-based drawing (like Figma) - not requested
- Visual angle guides/protractor overlay - not needed (shape is self-evident)
- Diagonal axis locks (45° / 135° drag angles) - only horizontal/vertical for now 🆕

## Success Metrics

- Feature successfully implemented across all 4 drawing tools (Rectangle, Circle, Line, Polyline)
- Feature successfully implemented for dragging all shape types and text objects 🆕
- Zero performance regression (maintains 60 FPS)
- Shift constraint works seamlessly with existing snapping and alignment systems
- Shift constraint works seamlessly with dragging system (single and multi-selection) 🆕
- User testing confirms intuitive behavior matching industry standards (Figma, Canva)
- Zero critical bugs in production after 1 week

## Dependencies

- Existing drawing system (DrawingCanvas, DrawingFeedback, PrecisionLinePreview)
- Existing dragging system (useAppStore → startDragging, updateDragPosition, finishDragging) 🆕
- Zustand store (useAppStore)
- Snapping system (must not conflict with constraints)
- Keyboard event handling system

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Conflict with snapping system | High | Medium | Shift constraint takes priority over snapping. Clearly document precedence. |
| Performance impact on rendering | High | Low | Use memoized constraint calculations. Test with 60+ shapes on canvas. |
| Shift key "stuck" state | Medium | Medium | Add defensive cleanup on window blur, tool change, drawing cancel. |
| User confusion (when to use Shift) | Low | Medium | Clear documentation in keyboard shortcuts modal and tooltips. |

## Appendix

### Industry Standard Behavior Reference

**Figma**: Shift while drawing rectangle → square, Shift while drawing line → 0°/45°/90° angles
**AutoCAD**: Ortho mode (F8) → 0°/90° only, Polar tracking → user-defined angles
**Adobe Illustrator**: Shift while drawing → constrains to 45° increments for most tools
**Canva**: Shift while resizing → maintains aspect ratio (not for drawing, but similar concept)

**Our Implementation**: Follow Figma/Illustrator model (45° angle steps, square constraint)

### Design Decisions (Clarified: 2025-11-09)

**DD-017.1: Square Constraint Direction**
- **Decision**: Use **larger dimension** (max of width/height) when creating squares
- **Rationale**: Matches Figma/Illustrator standard behavior. Users expect squares to "grow" to the larger cursor distance.
- **Alternative Considered**: Smaller dimension (rejected - unintuitive)
- **Example**: Dragging from (0,0) to (10,5) creates 10×10 square, not 5×5

**DD-017.2: Axis-Lock Threshold Units**
- **Decision**: Threshold is in **world units** (meters), not screen pixels
- **Value**: 5 world units (5 meters in this app)
- **Rationale**: Simpler implementation, consistent with all other distance measurements in the app
- **Alternative Considered**: Screen pixels (rejected - requires viewport conversion, inconsistent at different zoom levels)
- **Trade-off**: May feel slightly different at extreme zoom levels, but testing shows 5 units works well in practice

**DD-017.3: Shift + Snap Interaction Precedence**
- **Decision**: Apply **snap first, then constraint** (Order: Cursor → Snap → Constraint)
- **Rationale**: Allows users to snap to a point, then constrain from that snapped position. More flexible.
- **Example**: Snap to endpoint (10.2, 3.7) → Apply square constraint → Final position (10.2, 10.2)
- **Alternative Considered**: Constraint first, then snap (rejected - less intuitive)
- **Implementation Note**: See plan.md lines 881-885 for order of operations

**DD-017.4: Direct Dimension Input + Shift**
- **Decision**: **Ignore Shift constraint** when user has entered explicit dimensions
- **Rationale**: Direct dimension input is explicit user intent, should override automatic constraints
- **Example**: User enters "10x15" → Rectangle is always 10×15, regardless of Shift key state
- **Alternative Considered**: Convert to square (rejected - violates explicit intent)
- **User Feedback**: If Shift is held with dimension input, no error message shown - simply ignored

**DD-017.5: Multi-Selection with Locked Shapes**
- **Decision**: Locked shapes **stay in place**, unlocked shapes move with constraint
- **Rationale**: Matches Figma behavior - locked objects are silently ignored during drag operations
- **Example**: Select 3 shapes (2 unlocked, 1 locked) → Drag with Shift → Only 2 unlocked shapes move
- **Alternative Considered**: Block entire selection if any shape is locked (rejected - too restrictive)
- **User Feedback**: No toast/warning shown - locked shapes simply don't move (silent behavior)

**DD-017.6: Equal Offsets Tie-Breaker**
- **Decision**: When horizontal and vertical movement are exactly equal, lock to **horizontal axis**
- **Rationale**: Consistent, predictable behavior. Horizontal bias matches most design tools.
- **Example**: Drag exactly 10 right, 10 down (45° diagonal) → Shift locks to horizontal (10 right, 0 down)
- **Alternative Considered**: No tie-breaker (rejected - ambiguous), vertical bias (rejected - less common)
- **Occurrence**: Rare in practice (users rarely drag at exact 45° angles)

**DD-017.7: Angle Steps (MVP Scope)**
- **Decision**: MVP supports **45° angle steps only** (8 directions: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
- **Rationale**: Covers 90% of use cases, matches Figma/Illustrator defaults
- **Future Enhancement**: Custom angle steps (15°, 30°) could be added with Shift+Alt modifier
- **Out of Scope**: Arbitrary angle input, protractor overlay, custom angle configuration

### Related Features
- **007-shape-snapping-system**: Snapping vs. constraint precedence
- **013-direct-dimension-input**: Pre-sized shapes ignore Shift constraint
- **001-direct-distance-entry-line-tool**: Distance input + Shift constraint

---

**Document Status**: ✅ Ready for Implementation (100% Complete)
**Completeness**: 100% - All ambiguities resolved (See "Design Decisions" in Appendix)
**Last Clarification**: 2025-11-09 - Added DD-017.1 through DD-017.7
**Next Step**: Begin implementation (Task 1 in `tasks.md`)
