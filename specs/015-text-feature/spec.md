# Text Feature Specification

**Spec ID:** 015
**Feature:** Text Annotations and Shape Labels
**Version:** 1.0
**Date:** January 12, 2025
**Status:** Draft

## Executive Summary

Add comprehensive text annotation capabilities to the Land Visualizer, enabling users to add floating text labels anywhere on the canvas and attach labels to shapes. The feature will support professional typography with multiple fonts, sizes, colors, and formatting options, all accessible through a modal-based interface consistent with the existing Canva-inspired design system.

## Problem Statement

Users need to annotate their land visualizations with text to:
- Label different areas (e.g., "Front Yard", "Parking Area", "Garden")
- Add notes and measurements to specific locations
- Create documentation for planning and presentations
- Communicate design intent to stakeholders

Currently, the Land Visualizer lacks any text annotation capability, forcing users to export designs and add labels in external tools.

## Target Users

1. **Land Planners** - Need to label zones and areas for professional plans
2. **Property Developers** - Document lot assignments and development phases
3. **Homeowners** - Annotate personal property plans with notes
4. **Landscapers** - Label plant locations, features, and zones

## User Stories

### US-1: Add Floating Text
**As a** land planner
**I want to** add text labels anywhere on the canvas
**So that** I can annotate my design with notes and labels

**Acceptance Criteria:**
- Press "T" keyboard shortcut or click Text tool button in ribbon
- Click on canvas to place text
- Modal opens for text entry and formatting
- Text appears at clicked location
- Text always faces camera (billboard effect)
- Can select, move, rotate, and delete text
- Full undo/redo support

### US-2: Attach Labels to Shapes
**As a** property developer
**I want to** attach text labels to shapes
**So that** labels move with shapes and maintain context

**Acceptance Criteria:**
- Double-click shape to add/edit label
- Modal opens for label entry and formatting
- Label appears at shape center
- Can drag label to adjust offset from center
- Label moves when shape moves
- Label rotates when shape rotates
- Label duplicates when shape duplicates (Ctrl+D)
- Full undo/redo support

### US-3: Format Text
**As a** user
**I want to** customize text appearance
**So that** my annotations are readable and professional

**Acceptance Criteria:**
- Choose from 6 font families (Nunito Sans, Roboto, Open Sans, Montserrat, Lato, Courier New)
- Adjust font size (12-72px via slider + manual input)
- Select text color (color picker)
- Choose text alignment (left, center, right)
- Adjust letter spacing (-50 to 200)
- Adjust line height (0.8 to 3.0)
- Add background color with opacity (0-100%)
- Rotate text independently (-180° to 180°)

### US-4: Edit Existing Text
**As a** user
**I want to** edit text after creation
**So that** I can correct mistakes and update labels

**Acceptance Criteria:**
- Double-click text to reopen modal with current values
- Edit content, formatting, or both
- Changes apply immediately
- Can cancel to revert changes
- Full undo/redo support

### US-5: Manage Text in Layers
**As a** land planner
**I want to** organize text within layers
**So that** I can manage visibility and structure

**Acceptance Criteria:**
- Floating text appears in current active layer
- Shape labels appear nested under parent shape in layer panel
- Can show/hide all text by hiding layer
- Can lock/unlock text via layer panel
- Can reorder text within layer

### US-6: Properties Panel Integration
**As a** user
**I want to** adjust text properties without reopening modal
**So that** I can quickly tweak appearance

**Acceptance Criteria:**
- Selecting text shows properties in right panel
- Can adjust font, size, color, alignment via panel
- Can adjust advanced properties (spacing, background, rotation)
- "Edit Text Content" button reopens modal
- Position (X, Y) displayed and editable
- Delete button removes text

## Functional Requirements

### FR-1: Text Tool
- Text tool button in ribbon toolbar with "T" icon
- Keyboard shortcut: "T" activates text tool
- Tool shows in active state when selected
- Cursor changes to text cursor (IBeam) when active
- Click on 3D canvas opens text creation modal
- ESC cancels tool without creating text

### FR-2: Text Creation Modal
- Modal title: "Add Text" for new, "Edit Text" for existing
- Text content textarea with character counter (0/500)
- Font family dropdown (searchable, 6 options)
- Font size slider (12-72px) with manual input field
- Color picker for text color
- Alignment buttons (L/C/R)
- Advanced section (collapsed by default):
  - Letter spacing slider (-50 to 200)
  - Line height slider (0.8 to 3.0)
  - Background color toggle + color picker
  - Background opacity slider (0-100%)
  - Text rotation slider (-180° to 180°)
- Character limit: 1-500 characters
- Cancel button (reverts changes, closes modal)
- "Add Text" / "Update Text" button (saves and closes)
- Modal follows existing design system (Canva-inspired)

### FR-3: Shape Label Attachment
- Double-click shape opens "Add Label to Shape" modal
- Same modal interface as text creation
- Label initially positioned at shape center
- Label has drag handles for offset adjustment
- Offset stored relative to shape center
- Label transforms with shape:
  - Moves when shape moves
  - Rotates when shape rotates (label rotation + shape rotation)
  - Offset vector rotates around center
- Label duplicates with shape (Ctrl+D)
- Only one label per shape (MVP)

### FR-4: Text Rendering
- Uses drei `<Html>` component for 3D-to-2D projection
- Always faces camera (billboard effect)
- Renders above all 3D geometry (HTML overlay)
- Google Fonts loaded in index.html
- CSS styles applied inline via style prop
- Text wraps at max-width (400px default)
- Supports multi-line text (Enter key for line breaks)
- Auto-wraps at max-width boundaries

### FR-5: Text Selection and Manipulation
- Click text to select
- Selected text shows:
  - Bounding box outline (blue)
  - Rotation handle (green circle)
  - Drag handles for movement
- Drag text to move freely on canvas
- Drag rotation handle to rotate
- Hold Shift while rotating for 45° snapping
- Delete key removes selected text
- Esc deselects text

### FR-6: Text State Management
- Create `useTextStore.ts` (Zustand)
- Stores floating text and shape label metadata
- Text objects include:
  - Unique ID
  - Type (floating | label)
  - Content (string)
  - Position (x, y, z)
  - Font family, size, color
  - Alignment
  - Letter spacing, line height
  - Background color, opacity
  - Rotation angle
  - For labels: attachedToShapeId, offset
- Full undo/redo integration
- Layer integration (text within layers)

### FR-7: Properties Panel
- Appears when text selected
- "TEXT PROPERTIES" section header
- "Edit Text Content" button (opens modal)
- Font dropdown (live update)
- Size input with stepper (live update)
- Color picker (live update)
- Alignment buttons (live update)
- Advanced section (expandable):
  - Letter spacing slider (live update)
  - Line height slider (live update)
  - Background toggle + color (live update)
  - Rotation slider (live update)
- Position section:
  - X coordinate (meters)
  - Y coordinate (meters)
- "Delete Text" button

### FR-8: Context Menu Integration
- Right-click on text shows menu:
  - Edit Text (opens modal)
  - Duplicate (floating text only)
  - Delete
  - Bring to Front
  - Send to Back
  - Lock / Unlock
  - For labels: "Detach from Shape" (converts to floating)

### FR-9: Keyboard Shortcuts
- T = Activate text tool
- Double-click text = Edit text (modal)
- Double-click shape = Add/edit label (modal)
- Delete / Backspace = Delete selected text
- Ctrl+D = Duplicate floating text
- Esc = Cancel text tool / deselect text

## Non-Functional Requirements

### NFR-1: Performance
- Text rendering at 60 FPS with up to 100 text objects
- Modal opens in < 100ms
- Text creation/update in < 50ms
- No visible lag during camera movement
- Throttle position updates to 16ms (60 FPS)

### NFR-2: Usability
- Modal follows Canva design principles
- Font preview in dropdown
- Real-time character count
- Clear visual feedback for all interactions
- Tooltips on all advanced controls
- Keyboard shortcuts discoverable via "?" help

### NFR-3: Accessibility
- Modal keyboard navigable (Tab, Enter, Esc)
- Color picker meets WCAG 2.1 AA contrast
- Font size minimum 12px for readability
- Focus indicators on all interactive elements
- Screen reader compatible labels

### NFR-4: Browser Support
- Chrome 90+ (primary)
- Firefox 88+ (supported)
- Edge 90+ (supported)
- Safari 14+ (supported)

### NFR-5: Responsive Design
- Modal responsive for tablet (768px+)
- Mobile support deferred to future phase
- Desktop-optimized workflow

## Technical Constraints

### TC-1: Constitution Compliance
- **Article 1:** All styling via inline styles (no CSS files)
- **Article 2:** TypeScript strict mode, no `any` types
- **Article 3:** Zustand store for state management
- **Article 4:** Functional components, hooks only
- **Article 5:** Maintain 60 FPS performance
- **Article 6:** 70% minimum test coverage
- **Article 7:** Client-side only, no external APIs
- **Article 8:** Prefer editing existing files
- **Article 9:** Canva-inspired professional UX
- **Article 10:** Proper file organization

### TC-2: Dependency Requirements
- Google Fonts CDN for font loading
- drei `<Html>` for 3D-to-2D text rendering
- Existing color picker component
- React Three Fiber for 3D integration

### TC-3: Integration Points
- Ribbon toolbar (add Text tool button)
- Properties panel (add text properties section)
- Context menu (add text options)
- Keyboard shortcuts (add "T" and text-specific shortcuts)
- Undo/redo system
- Layer management system
- Selection system

## Edge Cases

### EC-1: Empty Text
- Minimum 1 character required
- Modal validates before allowing submission
- Show error message if empty

### EC-2: Maximum Characters
- 500 character limit enforced
- Character counter shows remaining: "450 / 500"
- Input disabled when limit reached
- Show warning at 90% (450 chars)

### EC-3: Long Text Lines
- Text wraps at 400px max-width
- Multi-line rendering with line height
- Bounding box expands vertically
- Performance: limit to 50 lines

### EC-4: Text Positioning
- Text cannot be placed at z=0 (ground level)
- Minimum z = 0.1 to render above grid
- Maximum bounds: -1000 to +1000 meters
- Out-of-bounds text clamped to view

### EC-5: Shape Label Without Shape
- If shape deleted, label becomes floating text
- Warn user: "Shape deleted, label is now floating"
- Label retains all formatting

### EC-6: Concurrent Editing
- Only one text modal open at a time
- Selecting another text while modal open shows warning
- "Close current edit to select another text"

### EC-7: Font Loading Failure
- Fallback to system font if Google Fonts fails
- Show warning: "Custom fonts unavailable, using system fonts"
- Graceful degradation

### EC-8: Special Characters
- Support Unicode characters
- Emoji rendering supported
- Line breaks preserved (Enter key)
- Tab characters converted to 4 spaces

### EC-9: Text Overlap
- Text objects can overlap (no collision)
- Z-index by creation order (newest on top)
- Context menu "Bring to Front" / "Send to Back"

### EC-10: Performance Degradation
- Show warning at 75 text objects: "Many text objects may affect performance"
- Recommend using layers to organize and hide unused text
- Hard limit: 200 text objects maximum

## UI/UX Requirements

### UI-1: Modal Design
- Width: 450px
- Centered on screen
- Backdrop: semi-transparent black (rgba(0,0,0,0.5))
- Close button (X) in top-right
- Smooth fade-in animation (200ms)
- 12px border radius
- White background
- Box shadow: 0 8px 32px rgba(0,0,0,0.2)

### UI-2: Text Rendering Style
- Default font: Nunito Sans 18px
- Default color: #000000 (black)
- Default alignment: center
- No background by default
- Anti-aliased text rendering
- Sub-pixel positioning

### UI-3: Selection Indicators
- Bounding box: 2px solid blue (#3B82F6)
- Rotation handle: 16px green circle (#10B981)
- Rotation handle positioned 40px above text center
- Drag cursor when hovering text
- Rotate cursor when hovering rotation handle

### UI-4: Properties Panel Layout
```
┌─────────────────────────┐
│ Properties         [△]  │
├─────────────────────────┤
│ TEXT PROPERTIES         │
│                         │
│ [Edit Text Content...]  │
│                         │
│ Font: Nunito Sans    ▼  │
│ Size: [18        ] px   │
│ Color: [●] #000000      │
│ Align: [L][C][R]        │
│                         │
│ ▼ Advanced              │
│   Letter Spacing: 0     │
│   Line Height: 1.5      │
│   Background: None      │
│   Rotation: 0°          │
│                         │
│ POSITION                │
│ X: 5.2m  Y: 3.1m        │
│                         │
│ [ Delete Text ]         │
└─────────────────────────┘
```

### UI-5: Context Menu
- Right-click text shows menu
- Same styling as existing context menus
- Icons for each action
- Keyboard shortcuts shown
- Disabled items grayed out

## Data Model

### Text Object Structure
```typescript
interface TextObject {
  id: string;                    // Unique identifier
  type: 'floating' | 'label';    // Text type
  content: string;               // Text content (1-500 chars)
  position: {                    // 3D position
    x: number;
    y: number;
    z: number;
  };

  // Typography
  fontFamily: string;            // Font name
  fontSize: number;              // 12-72px
  color: string;                 // Hex color
  alignment: 'left' | 'center' | 'right';

  // Advanced formatting
  letterSpacing: number;         // -50 to 200
  lineHeight: number;            // 0.8 to 3.0
  backgroundColor?: string;      // Optional hex color
  backgroundOpacity: number;     // 0-100

  // Transform
  rotation: number;              // -180 to 180 degrees

  // Label-specific
  attachedToShapeId?: string;    // Parent shape ID
  offset?: {                     // Offset from shape center
    x: number;
    y: number;
  };

  // Metadata
  layerId: string;               // Parent layer
  locked: boolean;               // Lock state
  visible: boolean;              // Visibility
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
}
```

## Success Metrics

### SM-1: Adoption
- 70% of users add at least one text annotation within first session
- Average 8-12 text objects per design

### SM-2: Performance
- Text tool activation < 50ms
- Modal open < 100ms
- No frame rate drops with 100 text objects
- Zero crashes related to text feature

### SM-3: Quality
- < 5 bug reports per 1000 users in first month
- 70%+ test coverage achieved
- Zero P0 bugs in production

### SM-4: User Satisfaction
- Text feature used in 80%+ of projects
- Positive feedback on font selection
- Positive feedback on modal workflow

## Out of Scope (Future Phases)

- Rich text formatting (bold, italic, underline)
- Text effects (shadows, outlines, glows)
- Text along paths or curves
- Automatic label positioning (smart placement)
- Text import from external files
- Text search and replace
- Spell checking
- Multiple labels per shape
- Text templates or presets
- 3D extruded text
- Text measurement tools
- Export text separately (text-only export)

## Dependencies

- Google Fonts CDN
- drei library (already installed)
- Existing Zustand store infrastructure
- Existing undo/redo system
- Existing layer management
- Existing selection system
- Existing context menu system

## Risks and Mitigations

### R-1: Font Loading Performance
**Risk:** Loading 6 Google Fonts may slow initial page load
**Impact:** Medium
**Mitigation:** Use `display=swap` to prevent blocking, preconnect to fonts.googleapis.com

### R-2: Text Rendering Performance
**Risk:** 100+ text objects may drop frame rate
**Impact:** High
**Mitigation:** Implement virtual scrolling for off-screen text, throttle updates, test with 200 objects

### R-3: Modal Complexity
**Risk:** Advanced options may overwhelm users
**Impact:** Low
**Mitigation:** Collapse advanced section by default, provide tooltips, use sensible defaults

### R-4: Label Attachment Logic
**Risk:** Complex rotation/offset math may have bugs
**Impact:** Medium
**Mitigation:** Comprehensive unit tests, manual testing with various rotations, edge case coverage

### R-5: Dimension Overlay Conflict
**Risk:** Text HTML overlays may appear above modals (known issue)
**Impact:** High
**Mitigation:** Apply `data-modal-open` pattern from dimension overlay fix (see DIMENSION_OVERLAY_FIX.md)

## Clarifications Needed

None - all requirements clarified through discussion.

## References

- Canva text feature (inspiration for UX)
- Existing dimension overlay fix: `docs/technical/DIMENSION_OVERLAY_FIX.md`
- Constitution: `memory/constitution.md`
- Existing measurement overlay pattern: `app/src/components/MeasurementOverlay.tsx`

## Approval

**Specification Author:** Claude
**Date Created:** January 12, 2025
**Status:** Ready for Planning

**Next Steps:**
1. Run `/speckit.clarify` if ambiguities arise
2. Create implementation plan with `/speckit.plan`
3. Generate task breakdown with `/speckit.tasks`
4. Validate with `/speckit.analyze` and `/speckit.checklist`
5. Implement with `/speckit.implement`
