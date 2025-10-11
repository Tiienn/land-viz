# Feature Specification: Shape Flip Operation

**Spec ID**: 014
**Feature Name**: Shape Flip (Horizontal & Vertical)
**Status**: Draft
**Created**: 2025-01-12
**Last Updated**: 2025-01-12

---

## Executive Summary

Add flip functionality to the Land Visualizer, allowing users to mirror shapes horizontally or vertically. This feature complements the existing rotation and resize tools, providing complete 2D transformation capabilities commonly found in professional CAD and design applications.

---

## Problem Statement

Users currently have rotation and resize tools but lack the ability to flip/mirror shapes. This is a fundamental transformation operation needed for:
- Creating symmetrical designs
- Mirroring property layouts
- Duplicating and reversing patterns
- Professional CAD-style editing workflows

---

## User Stories

### Primary Users: Land Planners & Designers

1. **As a land planner**, I want to flip a building footprint horizontally so I can create a mirrored layout on the opposite side of the property.

2. **As a designer**, I want to flip multiple shapes at once so I can quickly create symmetrical designs without manual repositioning.

3. **As a CAD user**, I want keyboard shortcuts for flipping so I can work efficiently without reaching for the mouse.

4. **As a professional user**, I want flip operations to support undo/redo so I can experiment freely and revert mistakes.

5. **As a user editing grouped shapes**, I want flips to work on groups so my grouped elements maintain their relationships.

---

## Functional Requirements

### FR1: Flip Operations
- **FR1.1**: System shall provide horizontal flip (mirror across vertical axis)
- **FR1.2**: System shall provide vertical flip (mirror across horizontal axis)
- **FR1.3**: Each shape shall flip around its own geometric center
- **FR1.4**: Flip operation shall be instant (no preview mode required)

### FR2: User Interface
- **FR2.1**: Toolbar shall display a "Flip" button with dropdown menu
- **FR2.2**: Dropdown shall show "Flip Horizontally" and "Flip Vertically" options
- **FR2.3**: Context menu shall include flip options for selected shapes
- **FR2.4**: Keyboard shortcuts: Shift+H (horizontal), Shift+V (vertical)
- **FR2.5**: Button shall be disabled when no shapes are selected
- **FR2.6**: Dropdown items shall display keyboard shortcuts

### FR3: Multi-Selection Support
- **FR3.1**: System shall support flipping multiple selected shapes
- **FR3.2**: Each shape shall flip around its own center (not group center)
- **FR3.3**: Shapes shall maintain their relative positions after flip
- **FR3.4**: Grouped shapes shall flip individually while maintaining group membership

### FR4: Shape Type Support
- **FR4.1**: Shall support rectangle (2-point and 4-point formats)
- **FR4.2**: Shall support circle (center + edge point format)
- **FR4.3**: Shall support polyline (all vertices)
- **FR4.4**: Shall support polygon (all vertices)

### FR5: State Management
- **FR5.1**: Flip operations shall update shape.modified timestamp
- **FR5.2**: Flip operations shall be added to undo/redo history
- **FR5.3**: Undo shall reverse the flip operation
- **FR5.4**: System shall preserve shape rotation angles during flip

### FR6: Visual Feedback
- **FR6.1**: Shape shall update immediately after flip
- **FR6.2**: No animation or transition required
- **FR6.3**: Selection shall remain on flipped shapes

---

## Non-Functional Requirements

### NFR1: Performance
- Flip operation shall complete in < 50ms for single shape
- Flip operation shall complete in < 200ms for 50 shapes
- No perceivable lag on user interaction

### NFR2: Usability
- Keyboard shortcuts shall follow CAD software conventions
- Icons shall be clear and universally recognizable
- No learning curve for users familiar with design tools

### NFR3: Compatibility
- Shall work with all existing shape types
- Shall integrate with undo/redo system
- Shall not conflict with existing keyboard shortcuts

### NFR4: Constitution Compliance
- Article 1: Use inline styles only (no CSS files)
- Article 2: TypeScript strict mode
- Article 3: Zustand state management
- Article 6: 70% test coverage minimum
- Article 8: Prefer editing existing files
- Article 9: Canva-inspired professional UX

---

## Acceptance Criteria

### AC1: Basic Flip Operations
- [ ] User can flip a rectangle horizontally using toolbar button
- [ ] User can flip a rectangle vertically using toolbar button
- [ ] User can flip a circle horizontally (center/edge points flip correctly)
- [ ] User can flip a polyline with multiple vertices
- [ ] Flipped shape maintains its original rotation angle

### AC2: Multi-Selection
- [ ] User can select 3 shapes and flip them all horizontally
- [ ] Each shape flips around its own center
- [ ] Shapes maintain their relative spatial relationships
- [ ] All selected shapes update simultaneously

### AC3: Grouped Shapes
- [ ] User can flip a grouped shape (group member flips individually)
- [ ] Group boundary updates to reflect flipped geometry
- [ ] Group membership is maintained after flip

### AC4: Keyboard Shortcuts
- [ ] Shift+H flips selected shape(s) horizontally
- [ ] Shift+V flips selected shape(s) vertically
- [ ] Shortcuts shown in dropdown menu and help dialog
- [ ] Shortcuts work when shape is selected

### AC5: Context Menu
- [ ] Right-click on shape shows "Flip Horizontally" option
- [ ] Right-click on shape shows "Flip Vertically" option
- [ ] Options disabled when no shapes selected
- [ ] Works for both single and multi-selection

### AC6: Undo/Redo
- [ ] Ctrl+Z after flip reverts shape to original position
- [ ] Ctrl+Y after undo re-applies the flip
- [ ] History shows "Flip Horizontal" or "Flip Vertical" action
- [ ] Multiple flips can be undone individually

### AC7: UI States
- [ ] Flip button disabled when no shapes selected
- [ ] Flip button enabled when 1+ shapes selected
- [ ] Tooltip shows "Flip shapes" on hover
- [ ] Dropdown closes after selecting an option

### AC8: Edge Cases
- [ ] Flipping a locked shape shows appropriate warning
- [ ] Flipping shape with 1 point has no effect (graceful handling)
- [ ] Flipping rotated shape works correctly in world space
- [ ] Flipping 50 shapes performs without lag

---

## Edge Cases & Error Handling

### E1: Empty Selection
**Scenario**: User presses Shift+H with no shapes selected
**Expected**: No action, button remains disabled

### E2: Locked Shapes
**Scenario**: User attempts to flip a locked shape
**Expected**: Skip locked shapes silently, flip unlocked ones
**AMBIGUITY**: Should we show a warning toast?

### E3: Single Point Shape
**Scenario**: Shape has only 1 point (degenerate case)
**Expected**: Flip has no visual effect, operation completes successfully

### E4: Rotated Shapes
**Scenario**: Rectangle rotated 45°, then flipped horizontally
**Expected**: Points flip in world space, rotation angle preserved at 45°

### E5: Mixed Selection (Locked + Unlocked)
**Scenario**: 3 shapes selected, 1 is locked
**Expected**: 2 unlocked shapes flip, locked shape unchanged
**AMBIGUITY**: Show warning or silent skip?

### E6: Very Large Selection
**Scenario**: User selects 100+ shapes and flips
**Expected**: All shapes flip, performance remains acceptable (<500ms)

### E7: Grouped Shapes Alternative
**Scenario**: User flips a group of 5 shapes
**Expected**: Each of 5 shapes flips around its own center
**AMBIGUITY**: Should we offer option to flip group as single unit?

---

## UI/UX Requirements

### Toolbar Button Design
```
┌─────────────────┐
│  ⇄  Flip  ▼    │  ← Icon + Label + Dropdown arrow
└─────────────────┘
```

**States:**
- Default: Enabled (shapes selected)
- Disabled: Grayed out (no selection)
- Hover: Subtle highlight
- Active: Dropdown menu visible

### Dropdown Menu
```
┌─────────────────────────────┐
│ ⇄  Flip Horizontally  Shift+H │
│ ⇅  Flip Vertically    Shift+V │
└─────────────────────────────┘
```

**Behavior:**
- Opens on click
- Closes on selection or outside click
- Shows icons + labels + shortcuts
- 200ms fade-in animation

### Context Menu Integration
```
┌────────────────────────────┐
│ Cut                Ctrl+X  │
│ Copy               Ctrl+C  │
│ Paste              Ctrl+V  │
│ ─────────────────────────  │
│ ⇄ Flip Horizontally Shift+H │ ← NEW
│ ⇅ Flip Vertically   Shift+V │ ← NEW
│ ─────────────────────────  │
│ Duplicate          Ctrl+D  │
│ Delete             Delete  │
└────────────────────────────┘
```

### Icon Design Requirements
- **Style**: Outlined SVG matching existing toolbar icons
- **Size**: 20x20px at 1x scale
- **Colors**: Match current icon color scheme (#1F2937)
- **Horizontal**: Two arrows pointing left and right (⇄)
- **Vertical**: Two arrows pointing up and down (⇅)

---

## Out of Scope

The following are explicitly **not** part of this specification:

1. **Flip Preview Mode**: No live preview, instant application only
2. **Flip Around Custom Point**: Always flips around shape center
3. **Flip Animation**: No transition effects or animations
4. **Flip History Panel**: Standard undo/redo is sufficient
5. **Group-As-Unit Flip**: Only individual shape flipping (for now)
6. **3D Flip/Rotation**: Only 2D plane flipping (X/Y axes)
7. **Flip Constraints**: No snap-to-grid or angle constraints during flip

---

## Dependencies

### Internal Dependencies
- `useAppStore.ts` - State management and actions
- `ShapeRenderer.tsx` - Shape visualization updates
- `App.tsx` - Toolbar integration
- `ContextMenu.tsx` - Right-click menu
- `useKeyboardShortcuts.ts` - Keyboard handler

### External Dependencies
- None (pure geometry calculations)

---

## Success Metrics

### Quantitative Metrics
- **Performance**: < 50ms flip time for single shape
- **Test Coverage**: ≥ 70% for flip-related code
- **Error Rate**: < 1% of flip operations fail

### Qualitative Metrics
- Users report flip feature is intuitive
- No user confusion about flip behavior
- Feature feels "professional" and "responsive"

---

## Timeline Estimate

**Total Effort**: 6-8 hours

- **Phase 1** (Core Logic): 1-2 hours
- **Phase 2** (Toolbar UI): 2-3 hours
- **Phase 3** (Integration): 2 hours
- **Phase 4** (Testing): 1-2 hours

---

## Risks & Mitigations

### Risk 1: Performance with Large Selections
**Impact**: High
**Probability**: Low
**Mitigation**: Benchmark with 100+ shapes, optimize if needed

### Risk 2: Undo/Redo Complexity
**Impact**: Medium
**Probability**: Low
**Mitigation**: Follow existing undo/redo patterns from rotation feature

### Risk 3: Keyboard Shortcut Conflicts
**Impact**: Medium
**Probability**: Very Low
**Mitigation**: Shift+H/V currently unused, verified in codebase

### Risk 4: Rotated Shape Edge Cases
**Impact**: Medium
**Probability**: Medium
**Mitigation**: Comprehensive testing with various rotation angles

---

## Open Questions

1. **Locked Shapes**: Silent skip or show warning toast?
   - **Recommendation**: Silent skip for consistency with other operations

2. **Visual Feedback**: Any brief highlight after flip?
   - **Recommendation**: No animation, instant feels more responsive

3. **Group-As-Unit Option**: Future enhancement?
   - **Recommendation**: Add in v2 if users request it

---

## Approval

**Product Owner**: _____________
**Technical Lead**: _____________
**Date**: _____________

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-12 | Claude | Initial specification |

---

## Related Documents

- `/specs/014-flip-feature/plan.md` - Technical implementation plan
- `/specs/014-flip-feature/tasks.md` - Detailed task breakdown
- `/docs/project/CLAUDE.md` - Project standards and constitution
