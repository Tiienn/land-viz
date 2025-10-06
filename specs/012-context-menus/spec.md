# Spec 012: Context Menu System

**Status**: Draft
**Created**: 2025-10-05
**Author**: SmartDraw Feature Analysis
**Priority**: High (Phase 1 - Must Have)

## Overview

Implement a comprehensive right-click context menu system for the Land Visualizer, providing quick access to common actions based on what the user right-clicks (canvas, shape, or multi-selection). This feature dramatically improves productivity by reducing clicks and providing contextual actions.

## Problem Statement

Currently, users must:
1. Navigate to the ribbon toolbar to find actions
2. Use keyboard shortcuts (if they know them)
3. Click through multiple panels to access features

This slows down workflows, especially for common operations like duplicate, delete, align, and property editing. Industry-standard tools (SmartDraw, Figma, AutoCAD) all provide context menus for quick access.

## User Stories

### Primary User Story
**As a** land planner
**I want to** right-click on shapes or canvas to see relevant actions
**So that** I can quickly perform common operations without hunting through menus

### Secondary User Story
**As a** power user
**I want to** see keyboard shortcuts in context menus
**So that** I can learn and remember shortcuts for faster workflows

### Acceptance Criteria
- [ ] Right-clicking on empty canvas shows canvas-specific actions
- [ ] Right-clicking on a shape shows shape-specific actions
- [ ] Right-clicking on multi-selection shows multi-selection actions
- [ ] Context menus appear at cursor position
- [ ] Menus show icons for visual recognition
- [ ] Menus show keyboard shortcuts for learning
- [ ] Disabled items are grayed out with tooltip explanation
- [ ] Clicking outside menu closes it
- [ ] ESC key closes menu
- [ ] Selecting an action closes menu and executes action
- [ ] Submenus work for Align and Distribute options
- [ ] Menu appearance follows Canva-style design (rounded, smooth)
- [ ] Menu prevents default browser context menu

## Functional Requirements

### FR1: Canvas Context Menu
**Trigger**: Right-click on empty canvas (no shape under cursor)

**Actions**:
1. **Paste** (if clipboard has shape data)
   - Icon: clipboard
   - Shortcut: Ctrl+V
   - Disabled if: No shape in clipboard
2. **Add Shape** (submenu)
   - Rectangle (R)
   - Circle (C)
   - Polyline (P)
   - Line (L)
   - Each adds shape at cursor position
3. **Grid Settings**
   - Toggle Grid (shows current state)
   - Set Grid Size (opens input dialog)
4. **View Options**
   - Reset Camera (0)
   - Toggle 2D/3D (V)
   - Zoom to Fit

### FR2: Shape Context Menu
**Trigger**: Right-click on a single shape

**Actions**:
1. **Edit Dimensions** (Enter)
   - Opens inline dimension input
   - Shortcut: Enter or Double-click
2. **Duplicate** (Ctrl+D)
   - Creates copy at offset position
3. **Delete** (Del)
   - Removes shape from scene
4. **Layer Management** (submenu)
   - Move to Layer → (list of layers)
   - Bring to Front
   - Send to Back
   - Bring Forward
   - Send Backward
5. **Lock Position** (toggle)
   - Prevents accidental movement
   - Icon changes when locked
6. **Convert to Template**
   - Saves shape as reusable template
   - Opens template name dialog
7. **Properties**
   - Opens Properties panel
   - Highlights this shape's properties

### FR3: Multi-Selection Context Menu
**Trigger**: Right-click on one of multiple selected shapes

**Actions**:
1. **Group** (Ctrl+G)
   - Creates group from selection
2. **Align** (submenu)
   - Align Left (Ctrl+L)
   - Align Right (Ctrl+R)
   - Align Top (Ctrl+T)
   - Align Bottom (Ctrl+B)
   - Align Center Horizontal
   - Align Center Vertical
3. **Distribute** (submenu)
   - Distribute Horizontally (Ctrl+H)
   - Distribute Vertically (Alt+V)
   - Equal Spacing (uses existing system)
4. **Match Size** (submenu)
   - Match Width
   - Match Height
   - Match Both
5. **Duplicate All** (Ctrl+D)
   - Duplicates entire selection
6. **Delete All** (Del)
   - Removes all selected shapes

### FR4: Menu Behavior
- **Positioning**: Menu appears at cursor position
- **Bounds Check**: If menu would overflow viewport, reposition to stay visible
- **Click Outside**: Closes menu without action
- **ESC Key**: Closes menu
- **Action Click**: Executes action and closes menu
- **Submenu**: Hover to open, hover away to close
- **Keyboard Navigation**: Arrow keys navigate, Enter selects, ESC closes
- **Prevent Default**: Blocks browser's native context menu

### FR5: Visual Design
- **Menu Container**:
  - White background (#ffffff)
  - Border radius: 8px
  - Box shadow: 0 4px 20px rgba(0,0,0,0.15)
  - Padding: 8px 0
  - Min width: 200px
- **Menu Items**:
  - Height: 32px
  - Padding: 8px 12px
  - Flex layout: [Icon] [Label] [Spacer] [Shortcut]
  - Hover: Background #f3f4f6
  - Active: Background #e5e7eb
- **Icons**:
  - Size: 16px
  - Color: #6b7280
  - Margin right: 8px
- **Shortcuts**:
  - Font: 11px monospace
  - Color: #9ca3af
  - Padding: 2px 6px
  - Background: #f9fafb
  - Border radius: 3px
- **Dividers**:
  - 1px solid #e5e7eb
  - Margin: 4px 0
- **Submenus**:
  - Right arrow icon (→) on parent
  - Submenu opens to right with slight overlap
  - Same styling as main menu

### FR6: Disabled States
- **Visual**: Opacity 0.4, cursor not-allowed
- **Behavior**: Cannot click, shows tooltip on hover explaining why
- **Examples**:
  - "Paste" disabled when clipboard empty → "No shape to paste"
  - "Group" disabled when <2 shapes selected → "Select multiple shapes"

## Non-Functional Requirements

### NFR1: Performance
- **Menu Open**: <50ms from right-click to menu display
- **Item Highlight**: Instant hover feedback
- **Action Execution**: Menu closes immediately, action executes in background

### NFR2: Usability
- **Discoverability**: Actions clearly labeled with icons
- **Learnability**: Keyboard shortcuts visible for learning
- **Consistency**: Same actions appear in same order across contexts
- **Accessibility**: Full keyboard navigation support

### NFR3: Accessibility
- **ARIA Roles**: menu, menuitem, menuitemcheckbox for toggles
- **Focus Management**: Trap focus within menu, restore on close
- **Screen Readers**: Announce menu open/close, selected items
- **Keyboard Navigation**: Tab, Arrow keys, Enter, ESC

### NFR4: Browser Compatibility
- **Prevent Default**: Block browser context menu on all supported browsers
- **Positioning**: Work correctly on Windows/Mac/Linux
- **Touch Support**: Long-press on touch devices opens context menu

## Edge Cases

### EC1: Menu Overflow
**Scenario**: Right-click near viewport edge, menu would overflow
**Expected**: Menu repositions to stay within viewport bounds

### EC2: Rapid Context Menu Opening
**Scenario**: User rapidly right-clicks multiple locations
**Expected**: Previous menu closes, new menu opens at new position

### EC3: Action While Menu Open
**Scenario**: User presses keyboard shortcut while context menu is open
**Expected**: Menu closes, action executes normally

### EC4: Shape Deleted While Menu Open
**Scenario**: User opens context menu on shape, another user/action deletes shape
**Expected**: Menu closes gracefully, action shows error if attempted

### EC5: Submenu Navigation
**Scenario**: User hovers over parent with submenu, then moves cursor away
**Expected**: Submenu remains open briefly (300ms), then closes

### EC6: Multi-Monitor Setup
**Scenario**: User right-clicks on secondary monitor
**Expected**: Menu appears on correct monitor at cursor position

## UI/UX Requirements

### Visual Hierarchy
1. **Most Common Actions First**: Delete, Duplicate at top
2. **Destructive Actions**: Red text for Delete
3. **Grouped Actions**: Dividers between logical groups
4. **Disabled Actions**: Grayed out with tooltip

### Interaction Flow - Canvas Menu
```
1. User right-clicks on empty canvas
   → Browser context menu prevented
   → Custom context menu appears at cursor
   → Menu shows: Paste (disabled), Add Shape →, Grid Settings, View Options
2. User hovers over "Add Shape"
   → Submenu appears to right
   → Shows: Rectangle (R), Circle (C), Polyline (P), Line (L)
3. User clicks "Rectangle"
   → Menu closes
   → Rectangle tool activates
   → Cursor changes to crosshair
   → Status shows "Click to place rectangle"
```

### Interaction Flow - Shape Menu
```
1. User selects rectangle shape
2. User right-clicks on shape
   → Context menu appears at cursor
   → Menu shows shape-specific actions
3. User sees "Duplicate (Ctrl+D)"
   → Learns keyboard shortcut
4. User clicks "Duplicate"
   → Menu closes
   → Shape duplicated at offset
   → New shape auto-selected
```

### Interaction Flow - Multi-Selection Menu
```
1. User selects 3 shapes
2. User right-clicks on one of them
   → Context menu appears
   → Shows multi-selection actions
3. User hovers over "Align"
   → Submenu opens showing alignment options
   → Shows: Left, Right, Top, Bottom, Center H, Center V
4. User clicks "Align Left"
   → Menu closes
   → All 3 shapes align to leftmost edge
   → Action saved to history
```

### Error States
- **No Clipboard Data**: "Paste" grayed out, tooltip "No shape to paste"
- **Single Selection**: "Group" grayed out, tooltip "Select multiple shapes"
- **Locked Shape**: Actions disabled, tooltip "Shape is locked"

## Success Metrics

- [ ] 70% reduction in ribbon clicks for common actions
- [ ] Context menu opens in <50ms
- [ ] Zero z-index conflicts with existing modals
- [ ] Positive user feedback on discoverability
- [ ] Keyboard shortcut retention increases by 40%

## Dependencies

- Existing keyboard shortcuts system (services/keyboardShortcuts.ts)
- Zustand stores (useDrawingStore, useLayerStore, useAppStore)
- Icon component (components/Icon.tsx)
- Existing actions (duplicate, delete, align, etc.)
- React event handling system
- Portal rendering for z-index control

## References

- SmartDraw analysis: `/SMARTDRAW_FEATURE_ANALYSIS.md` (lines 285-320)
- Keyboard shortcuts: `/app/src/services/keyboardShortcuts.ts`
- Icon system: `/app/src/components/Icon.tsx`
- Similar UI pattern: KeyboardShortcutHelp modal overlay
- Alignment system: `/app/src/services/simpleAlignment.ts`

## Open Questions

- Should context menus be configurable (users can add/remove items)?
- Should we log context menu usage for analytics?
- Should submenu open direction auto-detect available space?
- Should there be a "Recent Actions" section in canvas menu?

## Ambiguities

**AMBIGUITY**: "Convert to Template" functionality
- Is the template system implemented yet?
- If not, should we add this menu item but disable it?
- **Resolution Needed**: Check if template system exists before finalizing

**AMBIGUITY**: "Lock Position" implementation
- Does the store support locked shapes?
- How do locked shapes behave in edit mode?
- **Resolution Needed**: Verify shape locking architecture

---

**Next Steps**: Review this specification, then proceed to implementation plan (plan.md).
