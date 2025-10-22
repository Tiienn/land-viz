# Feature Specification: Text as Layers

**Spec ID:** 016
**Feature Name:** Text as Layers
**Status:** Draft
**Created:** 2025-01-17
**Author:** Land Visualizer Team
**Priority:** High

---

## Executive Summary

Elevate text objects to first-class elements in the Land Visualizer by integrating them into the unified layer system. Text will gain full shape capabilities including move, resize, rotate, grouping, smart alignment, and layer panel management—enabling professional design workflows where text and shapes work seamlessly together.

---

## Problem Statement

### Current Limitations

**Text is isolated from core features:**
- Text stored separately in `useTextStore`, not integrated with shapes
- Cannot be moved, resized, or rotated like shapes
- No layer panel visibility or management
- Cannot participate in groups with shapes
- Missing from smart alignment/spacing features
- No unified selection system (can't multi-select text + shapes)
- Transform controls (resize handles, rotation controls) unavailable

**User Impact:**
- Cannot create mixed layouts (text + shapes aligned together)
- No visual layer hierarchy management for text
- Friction switching between text editing and shape manipulation
- Professional design workflows blocked (e.g., creating annotated site plans)

### Target Users

1. **Professional Land Planners** - Need annotated site plans with text and shapes aligned
2. **Real Estate Professionals** - Create visual presentations mixing shapes and labels
3. **Designers** - Expect Canva-style text manipulation (resize, rotate, align)
4. **General Users** - Want intuitive text management via layer panel

---

## Solution Overview

### Core Concept

**Unified Element System:** Merge shapes and text into a single `elements[]` array where both types share common capabilities (selection, transform, grouping, layer management) while preserving text-specific features (inline editing, rich formatting).

### Key Features

1. **Text as Elements**
   - Text objects become `TextElement` type (parallel to `ShapeElement`)
   - Stored in unified `elements[]` array in `useAppStore`
   - Share common properties: `id`, `visible`, `locked`, `layerId`, `groupId`

2. **Full Transform Capabilities**
   - **Move:** Drag to reposition (updates `position: Point2D`)
   - **Resize:** Handles scale both fontSize AND text box dimensions
   - **Rotate:** Visual rotation handle (same as shapes)
   - **Aspect Ratio Lock:** Shift+Drag maintains text proportions

3. **Mixed Groups**
   - Group shapes + text together (shared `groupId`)
   - Unified transform: Rotate/resize group affects all members
   - Layer order determines visual stacking in groups

4. **Layer Panel Integration**
   - Text displayed mixed with shapes (ordered by layer/creation time)
   - Text icon (📝 SVG) for visual differentiation
   - Full layer controls: Visibility toggle, lock/unlock, reorder

5. **Smart Alignment**
   - Text participates in equal spacing calculations
   - Purple badges show spacing between text and shapes
   - Snap to text bounding boxes (edges/center)

6. **Preserved Editing**
   - Double-click text → Inline editor (existing behavior)
   - Auto-save on tool switch (e.g., switch to rectangle mid-edit)
   - Properties Panel integration maintained

---

## User Stories

### US-1: Layer Panel Management
**As a** land planner
**I want** to see text objects in the layer panel alongside shapes
**So that** I can manage visibility, locking, and ordering in one place

**Acceptance Criteria:**
- [ ] Text objects appear in layer panel with 📝 icon
- [ ] Clicking eye icon toggles text visibility
- [ ] Lock icon prevents text from being moved/edited
- [ ] Drag to reorder text in layer hierarchy
- [ ] Text and shapes intermixed by creation order

### US-2: Text Transform
**As a** designer
**I want** to resize and rotate text using visual handles
**So that** I can position text precisely like I do with shapes

**Acceptance Criteria:**
- [ ] Selecting text shows 8 resize handles (corners + edges)
- [ ] Dragging handle scales fontSize AND text box proportionally
- [ ] Shift+Drag maintains aspect ratio during resize
- [ ] Rotation handle appears above selected text
- [ ] Drag rotation handle to rotate text (Shift for 45° snapping)
- [ ] Text rotation updates `rotation` property (0-360°)

### US-3: Mixed Groups
**As a** real estate professional
**I want** to group property shapes with their labels
**So that** I can move/rotate them as a single unit

**Acceptance Criteria:**
- [ ] Can select 2 shapes + 1 text and click "Group"
- [ ] Grouped elements show unified purple boundary on hover
- [ ] Moving group moves all shapes and text together
- [ ] Rotating group rotates all elements around group center
- [ ] Resizing group scales all elements proportionally
- [ ] Ungroup returns elements to individual control

### US-4: Smart Alignment
**As a** designer
**I want** text to participate in alignment and spacing tools
**So that** I can create evenly distributed layouts mixing text and shapes

**Acceptance Criteria:**
- [ ] Selecting 3 shapes + 1 text → Equal spacing works
- [ ] Purple badges show distances including text elements
- [ ] Magnetic snapping detects text bounding boxes
- [ ] Green snap indicators appear at text edges/center
- [ ] "SNAP" confirmation when aligning to text

### US-5: Seamless Editing
**As a** user
**I want** text editing to work naturally even when text is in groups
**So that** I can edit content without ungrouping first

**Acceptance Criteria:**
- [ ] Double-clicking grouped text opens inline editor
- [ ] Editing doesn't break the group
- [ ] ESC or clicking away saves edits and closes editor
- [ ] Switching tools (e.g., to Rectangle) auto-saves text
- [ ] Properties Panel shows text formatting controls

---

## Functional Requirements

### FR-1: Unified Element Type System
**Priority:** P0 (Critical)

Create type-safe element system supporting both shapes and text:

```typescript
type Element = ShapeElement | TextElement;

interface BaseElement {
  id: string;
  elementType: 'shape' | 'text';
  name: string;
  visible: boolean;
  locked: boolean;
  layerId: string;
  groupId?: string;
  created: Date;
  modified: Date;
}

interface TextElement extends BaseElement {
  elementType: 'text';
  position: Point2D;  // { x, y }
  z: number;          // Height above ground
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;   // 0-360 degrees
  // ... full text properties
}
```

**Validation:**
- Type guards: `isShapeElement()`, `isTextElement()`
- Runtime type checking for element operations
- TypeScript strict mode compliance

### FR-2: Transform Operations
**Priority:** P0 (Critical)

**Move:**
- Click-drag updates `TextElement.position`
- Snaps to grid if enabled
- Multi-select moves multiple text elements together
- Undo/redo support

**Resize:**
- 8 handles: 4 corners (NW, NE, SW, SE) + 4 edges (N, E, S, W)
- Proportional scaling: fontSize and text box dimensions scale together
- Formula: `newFontSize = originalFontSize * scaleFactor`
- Shift+Drag locks aspect ratio
- Minimum fontSize: 8px
- Maximum fontSize: 200px

**Rotate:**
- Visual rotation handle (green circle above text, same as shapes)
- Drag to rotate around text center
- Shift key snaps to 45° increments
- Live preview during rotation
- Stores rotation in `TextElement.rotation`

### FR-3: Grouping System
**Priority:** P0 (Critical)

**Group Creation:**
- Select multiple elements (any mix of shapes/text)
- Right-click → "Group" OR Ctrl+G
- Assign unique `groupId` to all selected elements
- Show purple group boundary on hover

**Group Transform:**
- **Move:** Translate all elements by same offset
- **Rotate:** Rotate all elements around group's collective center
- **Resize:** Scale all elements from group center (fontSize scales for text)

**Group Hierarchy:**
- Layer order determines visual stacking
- Text Z-position respected within group
- Ungrouping preserves element positions

### FR-4: Layer Panel Integration
**Priority:** P0 (Critical)

**Display:**
- Show all elements in single list (intermixed shapes + text)
- Sort by: Layer order, then creation time
- Text icon: 📝 SVG (custom icon matching design system)
- Shape icons: Existing (rectangle, circle, etc.)

**Controls:**
- **Visibility:** Eye icon toggle (hides/shows text in 3D scene)
- **Lock:** Padlock icon (prevents move/resize/rotate/edit)
- **Reorder:** Drag element up/down to change layer order
- **Rename:** Click name to edit
- **Delete:** Right-click → Delete

**Group Display:**
- Grouped elements indented beneath group header
- Group header: "Group 1" with expand/collapse toggle
- Member count badge: "3 items"

### FR-5: Smart Alignment Integration
**Priority:** P1 (High)

**Equal Spacing:**
- Include text bounding boxes in spacing calculations
- Text treated same as shapes for distribution
- Purple badges show measured distances

**Magnetic Snapping:**
- Detect text edges: left, right, top, bottom
- Detect text center: horizontal and vertical
- Green snap indicators when within threshold (5px)
- "SNAP" confirmation badge

**Snap Points:**
- Add text corner points to snap point array
- Add text center point
- Priority: Same as shape snap points

### FR-6: Editing Workflow
**Priority:** P1 (High)

**Double-Click Edit:**
- Works for both grouped and individual text
- Opens inline editor at text position
- RichTextEditor component (existing)
- Properties Panel shows formatting controls

**Auto-Save on Tool Switch:**
- Switching from Text tool → Rectangle tool
- Automatically calls `finishInlineEdit()`
- Saves current content to element
- Closes inline editor
- Activates new tool

**ESC Handling:**
- ESC while editing → Save and close editor
- ESC while selecting → Deselect text

---

## Non-Functional Requirements

### NFR-1: Performance
- Rendering 100 text elements: 60 FPS
- Group transform (10 elements): < 50ms
- Layer panel update: < 100ms
- No dropped frames during rotation

### NFR-2: Compatibility
- Backward compatible with existing text objects
- Auto-migration on app load (one-time)
- No data loss during migration
- Legacy `useTextStore` deprecated gracefully (2 releases)

### NFR-3: Accessibility
- Keyboard navigation in layer panel (Tab, Arrow keys)
- Screen reader announces text element selection
- WCAG 2.1 AA compliance for layer panel controls

### NFR-4: Testing
- Unit tests: 80% coverage for element system
- Integration tests for group operations
- E2E tests for layer panel interactions
- Performance regression tests

---

## UI/UX Requirements

### Layer Panel Design

**Layout:**
```
┌─ Layers ────────────────────┐
│ 🟦 Rectangle 1       👁 🔓 │
│ 📝 Title Text        👁 🔓 │  <- Text with icon
│ 🟢 Circle 1          👁 🔒 │  <- Locked
│ ▼ Group 1 (3 items) 👁 🔓 │  <- Group header
│   🟦 Rectangle 2     👁 🔓 │
│   📝 Label Text      👁 🔓 │
│   🔵 Circle 2        👁 🔓 │
└─────────────────────────────┘
```

**Text Icon (SVG):**
- 16x16px viewBox
- Matches existing icon style (outlined, 2px stroke)
- Color: #6B7280 (medium gray)
- Accessibility: `aria-label="Text element"`

### Transform Handles

**Resize Handles:**
- Corner handles: 8px × 8px squares
- Edge handles: 8px × 20px rectangles
- Color: #3B82F6 (blue)
- Hover: #2563EB (darker blue)
- Cursor: Directional resize cursors (nwse-resize, nesw-resize, etc.)

**Rotation Handle:**
- Position: 20px above text bounding box
- Visual: Green circle (12px diameter) connected to center by dashed line
- Cursor: `url('rotate-cursor.svg')`
- Same as existing shape rotation

### Group Boundary

**Visual:**
- Purple dashed border (#A855F7)
- 2px stroke width
- 8px dash, 4px gap
- Corner radius: 4px
- Opacity: 0.6

**Behavior:**
- Appears on hover (group or any member)
- Shows for 500ms after grouping
- Encompasses all element bounding boxes + 8px padding

---

## Edge Cases & Error Handling

### EC-1: Empty Text Content
**Scenario:** User creates text but leaves content empty
**Behavior:** Auto-delete text element on blur/tool switch
**Reason:** Prevents invisible/zero-width elements cluttering layers

### EC-2: Text Rotation Overflow
**Scenario:** Text rotated 90° extends beyond canvas bounds
**Behavior:** Allow rotation, but show warning badge if out of viewport
**Reason:** User may intentionally position for later cropping

### EC-3: Extreme Font Size
**Scenario:** User resizes text to 1px or 500px
**Behavior:** Clamp fontSize to 8px minimum, 200px maximum
**Reason:** Prevent rendering issues and performance degradation

### EC-4: Group with Locked Elements
**Scenario:** Group contains 2 unlocked shapes + 1 locked text
**Behavior:** Cannot group (show error: "Unlock all elements to group")
**Reason:** Prevents inconsistent group behavior

### EC-5: Layer Order Conflicts
**Scenario:** Text and shape have same layer order and creation time
**Behavior:** Text renders above shape (tie-breaker: text wins)
**Reason:** Text is typically annotation, should be visible

### EC-6: Migration Failure
**Scenario:** Corrupted `useTextStore` data during migration
**Behavior:** Skip corrupted entries, log errors, continue migration
**Reason:** Partial migration better than complete failure

---

## Success Metrics

### Adoption Metrics
- **Target:** 80% of users create at least 1 text element within 7 days
- **Measure:** Track text element creation events

### Usage Metrics
- **Target:** 50% of groups include at least 1 text element
- **Measure:** Analyze group composition on save

### Performance Metrics
- **Target:** < 50ms for group transform with 10 elements
- **Measure:** Performance monitoring telemetry

### Quality Metrics
- **Target:** < 5 bug reports per 1000 users in first 30 days
- **Measure:** GitHub issues + user feedback

---

## Out of Scope

### V1 Release

The following features are **NOT** included in the initial release:

1. **Text-Specific Resize Modes**
   - Text box resize without fontSize scaling
   - Multi-line text wrapping during resize
   - *Reason:* Adds complexity; Option C (scale both) is simpler for V1

2. **Advanced Text Effects**
   - Drop shadows for text
   - Stroke/outline for text
   - Gradient fills for text
   - *Reason:* Focus on core layer integration first

3. **Text Auto-Sizing**
   - Auto-fit text to bounding box
   - Shrink-to-fit algorithms
   - *Reason:* Manual control sufficient for V1

4. **Group Templates**
   - Save/load group presets (e.g., "Property Label Group")
   - *Reason:* Future enhancement after core grouping works

5. **Text-to-Shape Conversion**
   - Convert text outline to vector shape
   - *Reason:* Requires complex path tracing, defer to V2

### Future Considerations

- **V2:** Text box resize without fontSize scaling
- **V3:** Advanced text effects (shadows, strokes)
- **V4:** Group templates and presets

---

## Dependencies

### Internal Dependencies
- `useAppStore` - Add `elements[]` array
- `ShapeRenderer.tsx` - Extend to render `TextElement`
- `LayerPanel.tsx` - Show mixed elements
- `GroupBoundary.tsx` - Calculate bounds including text
- `ResizableShapeControls.tsx` - Extend for text resize
- `RotationControls.tsx` - Extend for text rotation
- `SimpleAlignmentGuides.tsx` - Include text in calculations

### External Dependencies
- None (all features use existing Three.js, React, Zustand)

### Breaking Changes
- `useTextStore` deprecated (backward compatible for 2 releases)
- History state format changes (auto-migration on load)

---

## Risks & Mitigations

### Risk 1: Migration Data Loss
**Risk:** Existing text objects lost during migration
**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- Create full backup of `useTextStore` before migration
- Store backup in localStorage with timestamp
- Provide rollback mechanism in dev tools
- Extensive pre-release testing with production data

### Risk 2: Performance Degradation
**Risk:** Rendering 100+ text elements causes lag
**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- Implement virtualization for layer panel (render only visible)
- Use React.memo for TextElement components
- Throttle transform updates to 60 FPS
- Performance monitoring with automatic alerts

### Risk 3: Complex Transform Math
**Risk:** Group rotation/resize math errors cause visual bugs
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Comprehensive unit tests for transform calculations
- Visual regression tests for group operations
- Reuse proven shape transform logic where possible

### Risk 4: User Confusion
**Risk:** Users don't understand text as layers concept
**Likelihood:** Medium
**Impact:** Low
**Mitigation:**
- In-app tooltip: "Text now works like shapes!"
- Changelog with visual examples
- Video tutorial showing new capabilities

---

## Open Questions

### Q1: Text Bounding Box Calculation
**Question:** How to calculate text bounding box before font loads?
**Options:**
- A) Use placeholder dimensions, recalculate on font load
- B) Block rendering until font ready
- C) Use system fallback font dimensions

**Recommendation:** Option A (placeholder + recalculate)
**Rationale:** Non-blocking, graceful degradation

### Q2: Multi-Line Text Handling
**Question:** Should text elements support multi-line content in V1?
**Current:** Text is single-line, wraps visually in 3D
**Impact:** Affects resize behavior and bounding box calculations

**Recommendation:** Keep single-line for V1, add multi-line in V2
**Rationale:** Reduces complexity, ships faster

### Q3: Text Z-Position in Groups
**Question:** When grouping, should text Z-position be preserved or flattened?
**Scenario:** Shape at z=0, text at z=2, grouped together
**Options:**
- A) Preserve relative Z (text stays 2 units above shape)
- B) Flatten all to group's average Z

**Recommendation:** Option A (preserve relative Z)
**Rationale:** Maintains 3D spatial relationships

---

## Clarifications (Added: 2025-01-17)

### P0 Clarifications - Critical Decisions Before Implementation

#### C1: Text Resize Handle Configuration
**Question:** Should text have all 8 resize handles like shapes, and how should they behave?

**Decision (Q1.1):** Text has **8 resize handles** (4 corners + 4 edges) - consistent with shapes for unified UX

**Decision (Q1.2):** **Edge handles work differently than corners:**
- **Corner handles (NW, NE, SW, SE):** Scale both fontSize AND text box dimensions proportionally (same as shapes)
- **Edge handles (N, S, E, W):** Scale text box in one dimension only (width OR height), fontSize adjusts to fit
  - **North/South handles:** Adjust height, fontSize scales vertically
  - **East/West handles:** Adjust width, fontSize scales horizontally

**Rationale:** Provides precise control - corners for proportional scaling, edges for dimensional adjustments. Matches professional design tool patterns (Figma, Sketch).

**Implementation Notes:**
- Corner handles use existing shape scaling logic
- Edge handles require new text-specific scaling calculation
- All handles respect 8px min / 200px max fontSize constraints

---

#### C2: Auto-Save Behavior on Tool Switch
**Question:** What happens when user switches tools while editing text?

**Decision (Q2.1):** **Auto-delete empty text** when switching tools
- If text content is empty string (`""`) → Delete text element automatically
- Matches EC-1: "Auto-delete text element on blur/tool switch"
- No confirmation dialog (clean, prevents clutter)

**Decision (Q2.2):** **Save ALL changes** including formatting-only changes
- Even if content unchanged but formatting changed (e.g., made text bold) → Save formatting
- Update `modified` timestamp
- Add to undo history

**Rationale:**
- Auto-delete empty: Prevents invisible elements cluttering layer panel
- Save all changes: User expects formatting changes to persist, matches Canva/Figma behavior

**Implementation Notes:**
- Check `content.trim() === ''` before auto-delete
- Compare both `content` and formatting properties to detect changes
- Call `saveToHistory()` only if changes detected

---

#### C3: Migration Failure Strategy
**Question:** How should migration handle partial failures and user interaction?

**Decision (Q3.1):** **Atomic rollback** on migration failure
- If ANY element fails to migrate → Rollback ALL changes
- Restore from localStorage backup
- Log detailed error for debugging
- Show user-friendly error message

**Decision (Q3.2):** **Silent background migration**
- No toast notification or progress bar
- Migration happens transparently on app load
- Only show message if migration fails (error case)

**Decision (Q3.3):** **Block UI entirely** during migration
- Show loading screen with message: "Loading your workspace..."
- Prevent all user interaction until migration complete
- Typically <500ms for normal data sizes

**Rationale:**
- Atomic rollback: Data integrity over partial migration - all-or-nothing approach
- Silent migration: Reduces user friction, migration is implementation detail
- Block UI: Prevents race conditions, ensures data consistency, migration is fast enough

**Implementation Notes:**
```typescript
runMigration: () => {
  if (hasMigrated()) return;

  // Show loading overlay
  setLoadingState({ isLoading: true, message: 'Loading your workspace...' });

  try {
    backupBeforeMigration(shapes, texts);
    const elements = migrateToElements(shapes, texts);
    set({ elements });
    setMigrated();
  } catch (error) {
    // Atomic rollback
    const backup = restoreFromBackup();
    if (backup) {
      set({ shapes: backup.shapes });
      useTextStore.setState({ texts: backup.texts });
    }

    // Show error to user
    showErrorToast('Failed to load workspace. Data has been restored.');
    logger.error('[Migration] Failed', error);
  } finally {
    setLoadingState({ isLoading: false });
  }
}
```

**Error Message:** "Failed to load workspace. Your data has been restored to the previous state. Please refresh the page and try again."

---

### Clarification Summary

**Total Clarifications:** 3 critical decisions
**Impact:**
- ✅ Clear implementation path for resize handles
- ✅ Defined auto-save behavior eliminates edge case ambiguity
- ✅ Migration strategy ensures data safety and user experience

**Updated Requirements:**
- FR-2 (Transform Operations) - Updated resize handle behavior
- FR-6 (Editing Workflow) - Updated auto-save specification
- NFR-2 (Compatibility) - Updated migration error handling

**Ready for Implementation:** ✅ All P0 issues resolved

---

## Appendix

### A. Related Specifications
- Spec 014: Flip Feature (shows shape transform patterns to follow)
- Spec 015: Text Feature (original text implementation)

### B. Reference Materials
- Canva text manipulation: https://www.canva.com/learn/text-design/
- Figma grouping behavior: https://help.figma.com/hc/en-us/articles/360039832054

### C. Terminology
- **Element:** Unified type encompassing shapes and text
- **Layer Order:** Z-index determining visual stacking (higher = on top)
- **Mixed Group:** Group containing both shape and text elements
- **Transform:** Move, resize, or rotate operations

---

## Approval

**Product Owner:** _______________ Date: ___________
**Tech Lead:** _______________ Date: ___________
**UX Designer:** _______________ Date: ___________

---

**Document Version:** 1.1 (Clarifications Added)
**Last Updated:** 2025-01-17
**Clarifications Completed:** 2025-01-17
**Next Review:** Before implementation kickoff
