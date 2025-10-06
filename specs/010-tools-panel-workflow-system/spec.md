# Feature Specification: Tools Panel with Smart Workflow System

**Feature Name:** Tools Panel with Smart Workflow System
**Spec Number:** 010
**Date:** 2025-01-05
**Status:** Draft
**Priority:** High
**Estimated Effort:** 3-4 weeks

---

## Executive Summary

Transform the currently inactive "Tools" button in the left sidebar into an intelligent command center that tracks tool usage, enables one-click workflow automation, and dramatically improves user productivity through smart action recording and playback.

---

## User Stories

### Primary User Story
**As a** land surveyor or property professional
**I want** quick access to my frequently-used tools and automated workflows
**So that** I can complete repetitive tasks in seconds instead of minutes

### Supporting User Stories

1. **As a** new user
   **I want** pre-built workflows for common tasks
   **So that** I can accomplish complex operations without learning every tool

2. **As a** power user
   **I want** to record and save my custom workflows
   **So that** I can automate my unique processes

3. **As a** team lead
   **I want** to share workflows with my team
   **So that** everyone follows standardized procedures

---

## Acceptance Criteria

### Must Have (Phase 1)
- [x] Panel activates when "Tools" button is clicked
- [x] Shows last 5-8 tool/action uses in chronological order
- [x] Displays top 3 frequently-used tools with usage counts
- [x] Includes 5 pre-built workflows ready to execute
- [x] One-click execution of workflows
- [x] Proper panel expand/collapse behavior matching other sidebar panels

### Should Have (Phase 2)
- [x] Workflow recording mode (manual start/stop)
- [x] Visual workflow editor with step management
- [x] Save/load custom workflows to localStorage
- [x] Workflow naming and organization
- [x] Delete/edit workflow functionality

### Could Have (Phase 3)
- [ ] Parametric workflows (ask for user input during execution)
- [ ] Conditional workflow logic (if/then)
- [ ] Workflow chaining (sub-workflows)
- [ ] Import/export workflows as JSON files
- [ ] Workflow execution history/logs

### Won't Have (Future)
- [ ] Cloud sync for workflows
- [ ] Workflow marketplace/sharing
- [ ] AI-suggested workflows
- [ ] Voice command execution
- [ ] Workflow analytics dashboard

---

## Functional Requirements

### 1. **Recent Actions Tracking**

**Core Functionality:**
- Track the last 5-8 tool activations and feature uses
- Store action type, timestamp, and relevant parameters
- Display in reverse chronological order (newest first)
- One-click to re-activate that tool/action

**Tracked Actions:**
- Drawing tools: select, line, rectangle, circle, polyline
- Editing actions: rotate, resize, edit mode, measure
- Panel opens: compare, convert, calculator, layers
- Shape operations: duplicate, delete, add corner
- View changes: 2D/3D toggle, grid toggle

**Edge Cases:**
- Maximum 8 recent actions (FIFO queue)
- Duplicate consecutive actions only counted once
- Clear history option
- Persist to localStorage for session continuity

**AMBIGUITY:** Should panel opens (like "Compare panel") count as actions, or only tool activations?
**RESOLUTION:** Yes, track all user-initiated actions including panel opens.

---

### 2. **Frequently Used Tools**

**Core Functionality:**
- Track cumulative usage count for each tool/action
- Display top 3 most-used with usage counts
- Pin/unpin capability for frequently-used items
- Reset statistics option

**Calculation:**
- Increment counter on each tool activation
- Sort by usage count (descending)
- Persist counts to localStorage
- Show visual indicator (⭐) for pinned items

**Edge Cases:**
- Tie-breaking: alphabetical order if same usage count
- Pin limit: maximum 3 pinned items
- Unpinning removes from "Frequently Used" but retains count

---

### 3. **Pre-built Workflows**

**Default Workflows (5 included):**

#### 3.1 Quick Property Survey
```yaml
Name: "Quick Property Survey"
Description: "Complete property analysis in one click"
Icon: "⚡"
Steps:
  1. Prompt user for area (number + unit)
  2. Create rectangle with specified area
  3. Activate measurement tool
  4. Auto-measure all 4 sides
  5. Open Compare panel
  6. Auto-select "House" comparison
  7. Show notification with summary
```

#### 3.2 Subdivision Planner
```yaml
Name: "Subdivision Planner"
Description: "Create subdivision layout from existing parcel"
Icon: "🏘️"
Steps:
  1. Verify shape is selected (error if not)
  2. Duplicate shape 4 times
  3. Arrange in 2×2 grid with equal spacing
  4. Measure each subdivision
  5. Auto-label: Lot A, B, C, D
```

#### 3.3 Before & After Comparison
```yaml
Name: "Before & After"
Description: "Compare current vs. proposed sizes"
Icon: "📊"
Steps:
  1. Verify shape is selected
  2. Duplicate shape
  3. Move duplicate 20m to right
  4. Prompt for new area
  5. Resize duplicate to new area
  6. Add labels: "Current" and "Proposed"
  7. Calculate difference percentage
```

#### 3.4 Export Package
```yaml
Name: "Export Package"
Description: "Generate complete deliverable package"
Icon: "📦"
Steps:
  1. Take screenshot of current view
  2. Export shapes to Excel
  3. Export shapes to DXF
  4. Generate PDF report
  5. Bundle into ZIP file
  6. Download automatically
```

#### 3.5 Precision Setup
```yaml
Name: "Precision Setup"
Description: "Configure CAD-style precision environment"
Icon: "🎯"
Steps:
  1. Enable grid snapping (1m)
  2. Show dimensions
  3. Activate measurement tool
  4. Set units to meters
  5. Switch to 2D top view
  6. Show notification: "Precision mode active"
```

**Edge Cases:**
- Workflow fails if prerequisites not met (e.g., no shape selected)
- Show clear error messages for failed steps
- Option to continue or abort on errors
- Undo entire workflow with one click

---

### 4. **Workflow Recording**

**Core Functionality:**
- Manual record start/stop button
- Track user actions during recording
- Auto-generate workflow name suggestion
- Save recorded workflow to library

**Recorded Actions:**
- All tool activations
- Shape creation with parameters
- Panel opens/closes
- Setting changes (grid, units, view mode)
- NOT recorded: camera movements, selections, hovers

**Recording UI:**
```
┌─────────────────────────────────────┐
│ 🔴 Recording Workflow...            │
│ Name: [Auto-generated / Editable]   │
├─────────────────────────────────────┤
│ Steps Recorded:                     │
│ 1. ✓ Activated Line Tool            │
│ 2. ✓ Drew line (10m)                │
│ 3. ✓ Opened Compare panel           │
│ 4. ✓ Selected "Basketball Court"    │
│                                     │
│ [⏸️ Pause]  [⏹️ Stop]  [🗑️ Delete Last]│
└─────────────────────────────────────┘
```

**Edge Cases:**
- Maximum 20 steps per workflow
- Cancel recording discards all steps
- Auto-save on stop
- Duplicate workflow names get "(2)" suffix

**AMBIGUITY:** Should we auto-suggest starting recording after detecting repeated action patterns?
**RESOLUTION:** Phase 3 feature - keep manual for now.

---

### 5. **Workflow Editor**

**Core Functionality:**
- Edit existing workflows (custom or pre-built duplicates)
- Add/remove/reorder steps
- Configure step parameters
- Test workflow execution
- Save changes

**Editor UI:**
```
┌─────────────────────────────────────┐
│ Edit Workflow: "Quick Property"    │
├─────────────────────────────────────┤
│ Step 1: Draw Rectangle              │
│   ⚙️ Prompt for area? [✓]           │
│   ⚙️ Default area: 1000 m²          │
│   [✏️ Edit] [🗑️ Delete] [▲] [▼]     │
│                                     │
│ Step 2: Measure Perimeter           │
│   ⚙️ Auto-measure all sides [✓]     │
│   [✏️ Edit] [🗑️ Delete] [▲] [▼]     │
│                                     │
│ [+ Add Step]                        │
│                                     │
│ [💾 Save]  [▶️ Test Run]  [❌ Cancel]│
└─────────────────────────────────────┘
```

**Constraints:**
- Pre-built workflows can be duplicated but not modified directly
- Custom workflows can be fully edited
- Step reordering via drag-and-drop (Phase 2) or arrow buttons (Phase 1)

---

## Technical Constraints

### Constitutional Compliance

✅ **Article 1:** Inline styles only - all UI components use inline styling
✅ **Article 2:** TypeScript strict mode - full type safety
✅ **Article 3:** Zustand state management - new `useToolHistoryStore`
✅ **Article 4:** React best practices - functional components, hooks
✅ **Article 5:** 3D rendering standards - no 3D changes
✅ **Article 6:** 70% test coverage - comprehensive testing
✅ **Article 7:** Security first - validate workflow inputs, no XSS
✅ **Article 8:** Prefer editing existing files - minimal new files
✅ **Article 9:** Canva-inspired UX - modern, polished design

### Performance Requirements
- Panel open/close: <100ms animation
- Workflow execution: <50ms per step
- Recording overhead: <5ms per action
- localStorage read/write: async, non-blocking
- Maximum workflow size: 5KB per workflow

### Browser Compatibility
- localStorage API (all modern browsers)
- JSON serialization (native support)
- No external dependencies required

---

## User Interface

### Visual Design

**Panel Structure:**
```
┌─────────────────────────────────────────┐
│ 🔧 Tools                          [×]   │
├─────────────────────────────────────────┤
│ 📝 Recent Actions (5)                   │
│ ┌─────────────────────────────────────┐ │
│ │ Line Tool                    [▶️]   │ │
│ │ Measure                      [▶️]   │ │
│ │ Compare (Soccer Field)       [▶️]   │ │
│ │ Rectangle                    [▶️]   │ │
│ │ Convert (m² → acres)         [▶️]   │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ⭐ Frequently Used (Top 3)              │
│ ┌─────────────────────────────────────┐ │
│ │ Select Tool    (127 uses)    [📌]  │ │
│ │ Rectangle      (89 uses)     [📌]  │ │
│ │ Measure        (56 uses)     [▶️]   │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ⚡ Quick Workflows               [+][🎬] │
│ ┌─────────────────────────────────────┐ │
│ │ ▶️ Quick Property Survey       [⋯] │ │
│ │ ▶️ Subdivision Planner         [⋯] │ │
│ │ ▶️ Before & After              [⋯] │ │
│ │ ▶️ Export Package              [⋯] │ │
│ │ ▶️ Precision Setup             [⋯] │ │
│ │ ▶️ My Custom Workflow          [⋯] │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ⚙️ Actions                              │
│ [Clear History] [Import] [Export]       │
└─────────────────────────────────────────┘
```

**Design Tokens:**
- Background: `#ffffff`
- Border: `#e5e7eb`
- Active item: `#3b82f6` (blue)
- Hover: `#f3f4f6` (light gray)
- Text: `#1f2937` (dark gray)
- Icons: `#6b7280` (medium gray)
- Font: Nunito Sans
- Border radius: `8px`
- Transition: `all 0.2s ease`

### User Flow

**Opening Tools Panel:**
```
1. User clicks "Tools" button in left sidebar
2. Panel slides open from left (200ms animation)
3. Other panels close if open
4. Recent actions load from localStorage
5. Panel displays with all sections
```

**Executing Pre-built Workflow:**
```
1. User clicks ▶️ on "Quick Property Survey"
2. Workflow dialog appears: "Enter property area"
3. User inputs: "2500 m²"
4. Workflow executes steps sequentially
5. Visual progress indicator (1/5, 2/5, etc.)
6. Success notification: "Workflow complete! ✓"
7. Result visible in 3D scene
```

**Recording Custom Workflow:**
```
1. User clicks 🎬 "Record" button
2. Recording mode activates (red indicator)
3. User performs actions (draw, measure, compare)
4. Each action appears in recording panel
5. User clicks ⏹️ "Stop"
6. Naming dialog appears
7. Workflow saved to "Quick Workflows" section
```

### Responsive Behavior

**Desktop (>1024px):**
- Full panel width: 320px
- All features visible
- Smooth animations

**Tablet (768px - 1024px):**
- Panel width: 280px
- Condensed spacing
- Maintained functionality

**Mobile (<768px):**
- Full-screen panel overlay
- Larger touch targets (44px minimum)
- Simplified UI, same functionality

---

## Testing Scenarios

### Happy Path Scenarios

**Test 1: Recent Actions Tracking**
```
GIVEN the user has just started the app
WHEN they activate: Line → Rectangle → Measure → Compare → Convert
THEN Recent Actions shows these 5 items in reverse order
AND clicking any item re-activates that tool
```

**Test 2: Workflow Execution**
```
GIVEN the user has no shapes on canvas
WHEN they click "Quick Property Survey" workflow
AND enter "1500 m²" when prompted
THEN a 38.7m × 38.7m rectangle appears
AND all 4 sides show measurement labels
AND Compare panel opens with "House" selected
AND notification shows "You can fit 15 houses"
```

**Test 3: Workflow Recording**
```
GIVEN the user clicks "Record Workflow"
WHEN they perform: Rectangle → Measure → Compare (Basketball Court)
AND click "Stop Recording"
AND name it "My Survey Process"
THEN workflow appears in "Quick Workflows" section
AND clicking ▶️ repeats all actions automatically
```

### Error Cases

**Test 4: Workflow Prerequisites Not Met**
```
GIVEN no shape is selected
WHEN user runs "Before & After Comparison" workflow
THEN error dialog shows: "Please select a shape first"
AND workflow does not execute
AND user can retry after selecting shape
```

**Test 5: Storage Limit Exceeded**
```
GIVEN user has 50 custom workflows saved
WHEN they try to save workflow #51
THEN warning shows: "Maximum 50 workflows. Delete some first."
AND workflow is not saved
AND option to delete old workflows is presented
```

**Test 6: Invalid Workflow Data**
```
GIVEN user imports corrupted workflow JSON
WHEN import is attempted
THEN validation fails gracefully
AND error shows: "Invalid workflow format"
AND no app state is corrupted
```

### Edge Cases

**Test 7: Rapid Tool Switching**
```
GIVEN user quickly switches between 10 tools in 2 seconds
WHEN Recent Actions updates
THEN only shows last 8 unique tools
AND no duplicate consecutive entries
AND performance remains smooth (no lag)
```

**Test 8: Workflow Undo**
```
GIVEN user executes "Subdivision Planner" workflow
AND workflow creates 4 shapes
WHEN user presses Ctrl+Z
THEN all 4 shapes are undone together
AND history stack treats workflow as single operation
```

**Test 9: localStorage Full**
```
GIVEN browser localStorage is at capacity
WHEN user tries to save workflow
THEN graceful fallback to memory-only storage
AND warning: "Cannot persist workflows. Clear browser data."
AND workflows still work for current session
```

---

## Non-Functional Requirements

### Performance
- Panel render time: <100ms
- Workflow execution: <500ms for 10 steps
- Recording overhead: <2% CPU
- Memory footprint: <5MB for 50 workflows

### Usability
- One-click access to recent tools (max 2 clicks total)
- Clear visual feedback for all actions
- Helpful error messages with recovery guidance
- Keyboard shortcuts: Ctrl+T to toggle panel

### Accessibility
- Full keyboard navigation support
- Screen reader friendly (ARIA labels)
- High contrast mode compatibility
- Focus management in dialogs

### Reliability
- No crashes on invalid workflow data
- Graceful degradation if localStorage unavailable
- Workflow execution is atomic (all-or-nothing)
- Auto-recovery from interrupted recordings

---

## Security Considerations

### Input Validation
- Sanitize workflow names (no scripts)
- Validate imported JSON structure
- Limit workflow step count (max 20)
- Validate numeric inputs (area, distance)

### Data Integrity
- JSON schema validation on import
- Checksums for workflow data
- Version compatibility checking
- No code execution from workflows (declarative only)

### Privacy
- All data stored locally (no external calls)
- No PII in workflow data
- Clear data export for user control
- Option to clear all history

---

## Future Enhancements (Out of Scope)

### Phase 3+ Features
- [ ] Parametric workflows (variables, conditionals)
- [ ] Workflow templates marketplace
- [ ] AI-suggested workflows based on patterns
- [ ] Team workflow sharing (cloud sync)
- [ ] Workflow performance analytics
- [ ] Voice command integration
- [ ] Mobile gesture shortcuts
- [ ] Workflow versioning and branching

---

## Review Checklist

- [x] Requirements are clear and testable
- [x] All ambiguities are marked and resolved
- [x] Edge cases are comprehensively identified
- [x] Complies with all 9 constitutional articles
- [x] UI/UX follows Canva-inspired design system
- [x] Testing scenarios cover happy path, errors, and edge cases
- [x] Performance metrics are measurable
- [x] Security considerations addressed
- [x] Future enhancements clearly separated

---

## Approval

**Specification Status:** ✅ Ready for Implementation Plan

**Next Steps:**
1. Review specification with stakeholders
2. Create detailed implementation plan (`plan.md`)
3. Break down into actionable tasks (`tasks.md`)
4. Begin Phase 1 implementation

---

**Document Version:** 1.0
**Last Updated:** 2025-01-05
**Author:** Claude Code
**Reviewers:** [Pending]
