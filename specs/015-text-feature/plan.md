# Text Feature Implementation Plan

**Spec ID:** 015
**Feature:** Text Annotations and Shape Labels
**Version:** 1.0
**Date:** January 12, 2025

## Technical Context

### Current Architecture
- **Frontend:** React 18 + TypeScript + Vite
- **3D Engine:** Three.js + React Three Fiber + Drei
- **State Management:** Zustand (domain-specific stores)
- **Styling:** Inline styles only (no CSS files)
- **Testing:** Vitest + React Testing Library

### Existing Patterns to Follow
- Measurement overlay pattern (`MeasurementOverlay.tsx`) for HTML overlays
- Dimension overlay fix pattern for modal conflicts (`DIMENSION_OVERLAY_FIX.md`)
- Domain-specific Zustand stores (`useDrawingStore`, `useMeasurementStore`)
- Modal design system (`InsertAreaModal`, `AddAreaModal`, etc.)
- Properties panel integration (`Properties.tsx`)

### Dependencies

**External (to be added):**
- Google Fonts CDN (preconnect + link in `index.html`)

**Internal (already available):**
- `@react-three/drei` - Html component for 3D-to-2D rendering
- `@react-three/fiber` - React Three Fiber
- `zustand` - State management
- `three` - Three.js library

**New Dependencies:**
- None required

## Implementation Approach

### Phase 1: Foundation (4-6 hours)
Set up the core text infrastructure

**Deliverables:**
- Type definitions for text objects
- Zustand text store with actions
- Google Fonts integration
- Basic text data model

**Key Decisions:**
- Store structure: Separate `useTextStore` (not merged into useAppStore)
- Font loading: Preconnect + link in index.html for performance
- Text positioning: Z = 0.1 minimum (above grid)

### Phase 2: Text Creation Modal (5-7 hours)
Build the modal interface for text creation/editing

**Deliverables:**
- TextModal component
- Character counter with validation
- Font family dropdown with preview
- Font size slider with manual input
- Color picker integration
- Alignment buttons
- Advanced section (collapsed by default)
- Modal open/close logic with data-modal-open pattern

**Key Decisions:**
- Reuse existing modal design patterns
- Apply dimension overlay fix pattern
- Default to Nunito Sans 18px black centered
- 500 character limit enforced client-side

### Phase 3: Text Rendering (6-8 hours)
Implement 3D text rendering with camera-facing billboards

**Deliverables:**
- TextRenderer component using drei Html
- Camera-facing billboard logic
- Multi-line text support with wrapping
- Text styling (font, size, color, alignment)
- Background color with opacity
- Letter spacing and line height
- Performance optimization (throttled updates)

**Key Decisions:**
- Use drei `<Html>` with `transform` and `distanceFactor`
- Render in separate `<group>` in scene
- Max-width: 400px for text wrapping
- Z-index: Always above 3D geometry

### Phase 4: Text Tool & Selection (4-6 hours)
Add text tool to ribbon and implement selection logic

**Deliverables:**
- Text tool button in ribbon
- "T" keyboard shortcut
- Text cursor (IBeam) when tool active
- Click canvas to open modal
- Text selection logic
- Bounding box visualization
- Rotation handle
- Drag to move text

**Key Decisions:**
- Follow existing tool pattern (select, rectangle, circle, etc.)
- Selection stored in useTextStore
- Bounding box: 2px blue (#3B82F6)
- Rotation handle: 16px green circle (#10B981)

### Phase 5: Shape Label Attachment (5-7 hours)
Implement double-click shape to add labels

**Deliverables:**
- Double-click detection on shapes
- Label attachment logic
- Offset calculation and storage
- Label movement with shape
- Label rotation with shape
- Label duplication with shape (Ctrl+D)
- Drag handle for offset adjustment

**Key Decisions:**
- Store label in shape metadata: `shape.label?: TextLabel`
- Offset stored as vector from center
- Rotation: label.rotation + shape.rotation
- Transform offset vector when shape rotates

### Phase 6: Properties Panel Integration (3-4 hours)
Add text properties to right panel

**Deliverables:**
- TEXT PROPERTIES section in Properties panel
- "Edit Text Content" button
- Font, size, color controls with live update
- Alignment buttons
- Advanced section (expandable)
- Position display (X, Y)
- Delete text button

**Key Decisions:**
- Show when text selected
- Live updates (no need to close/reopen)
- Follow existing properties panel patterns
- Advanced section collapsed by default

### Phase 7: Context Menu & Shortcuts (2-3 hours)
Add text-specific context menu and keyboard shortcuts

**Deliverables:**
- Right-click text context menu
- Edit, Duplicate, Delete options
- Bring to Front / Send to Back
- Lock / Unlock
- Detach from Shape (labels only)
- Keyboard shortcuts (T, Delete, Ctrl+D, Esc)

**Key Decisions:**
- Extend existing context menu system
- Follow existing shortcut patterns
- Show shortcuts in context menu

### Phase 8: Undo/Redo Integration (2-3 hours)
Integrate text operations with history system

**Deliverables:**
- Create text → history entry
- Edit text → history entry
- Move text → history entry
- Rotate text → history entry
- Delete text → history entry
- Attach/detach label → history entry

**Key Decisions:**
- Follow existing undo/redo pattern
- Store full text object in history
- Batch rapid updates (throttle)

### Phase 9: Layer Integration (2-3 hours)
Integrate text with layer management

**Deliverables:**
- Floating text in active layer
- Shape labels nested under parent shape
- Layer visibility affects text
- Layer locking affects text
- Layer reordering affects text

**Key Decisions:**
- Floating text: stored in layer.textIds[]
- Shape labels: rendered as sub-items in layer tree
- Hidden layer = hidden text
- Locked layer = locked text (can't edit/move)

### Phase 10: Testing (6-8 hours)
Comprehensive test coverage

**Deliverables:**
- Unit tests for useTextStore (actions, state)
- Unit tests for text utilities (positioning, rotation)
- Component tests for TextModal
- Component tests for TextRenderer
- Integration tests for text tool workflow
- Integration tests for shape label workflow
- Performance tests (100-200 text objects)
- Edge case tests (empty, max chars, etc.)
- Accessibility tests (keyboard nav, focus)

**Key Decisions:**
- Target: 70%+ coverage
- Mock Three.js dependencies
- Test critical paths thoroughly
- Performance regression tests

### Phase 11: Polish & Edge Cases (3-4 hours)
Handle edge cases and polish UX

**Deliverables:**
- Empty text validation
- Max character validation with warning
- Font loading error handling
- Shape deletion → label orphan handling
- Text overlap handling
- Performance warning (75+ objects)
- Hard limit (200 objects)
- Tooltip additions
- Error messages
- Loading states

**Key Decisions:**
- Graceful degradation for font failures
- User-friendly error messages
- Performance warnings at 75 objects
- Hard limit at 200 objects

## File Structure

```
app/src/
├── components/
│   ├── Text/
│   │   ├── TextModal.tsx                 # Modal for text creation/editing
│   │   ├── TextRenderer.tsx              # Renders all text objects in 3D
│   │   ├── TextObject.tsx                # Individual text rendering (Html)
│   │   ├── TextSelectionControls.tsx     # Bounding box + rotation handle
│   │   ├── ShapeLabelRenderer.tsx        # Renders shape labels
│   │   └── TextPropertiesPanel.tsx       # Properties panel section
│   ├── Scene/
│   │   └── DrawingCanvas.tsx             # Add text tool click handling (edit)
│   ├── UI/
│   │   └── Ribbon.tsx                    # Add text tool button (edit)
│   └── Properties.tsx                     # Integrate text properties (edit)
├── store/
│   └── useTextStore.ts                   # Text state management
├── types/
│   └── text.ts                           # Text type definitions
├── utils/
│   ├── textUtils.ts                      # Text positioning, rotation logic
│   └── fontLoader.ts                     # Font loading utilities
├── hooks/
│   └── useTextSelection.ts               # Text selection hook
└── __tests__/
    ├── store/
    │   └── useTextStore.test.ts
    ├── utils/
    │   └── textUtils.test.ts
    └── components/
        ├── TextModal.test.tsx
        └── TextRenderer.test.tsx
```

## Data Flow

### Creating Floating Text
```
1. User presses "T" → useAppStore.setTool('text')
2. User clicks canvas → TextModal opens
3. User enters text + formatting → modal state
4. User clicks "Add Text" → useTextStore.addText(textObject)
5. TextRenderer detects new text → renders with Html
6. Text appears at clicked position
```

### Creating Shape Label
```
1. User double-clicks shape → detectDoubleClick()
2. TextModal opens with attachedToShapeId set
3. User enters text + formatting → modal state
4. User clicks "Add Label" → useTextStore.addLabel(labelObject)
5. ShapeLabelRenderer detects new label → calculates position
6. Label appears at shape center
7. User drags label → offset stored
```

### Editing Text
```
1. User double-clicks text → TextModal opens with currentText
2. Modal populated with existing values
3. User edits → modal state updates
4. User clicks "Update Text" → useTextStore.updateText(id, updates)
5. TextRenderer re-renders with new values
```

### Moving Text
```
1. User drags text → onPointerMove
2. Calculate new position from raycaster
3. useTextStore.updateTextPosition(id, position)
4. Add to undo/redo history (throttled)
5. TextRenderer updates position
```

### Shape Label Following Shape
```
1. Shape moves/rotates → useAppStore.updateShape()
2. ShapeLabelRenderer detects shape change
3. Calculate new label position:
   labelPos = shapeCenter + rotateVector(offset, shapeRotation)
   labelRot = shape.rotation + label.rotation
4. Update label transform
```

## Testing Strategy

### Unit Tests (Target: 80%+ coverage)
- `useTextStore` actions and state mutations
- Text positioning calculations (offset, rotation)
- Font loading utilities
- Character limit validation
- Text wrapping logic

### Component Tests (Target: 70%+ coverage)
- TextModal rendering and interactions
- Form validation (empty, max chars)
- Font dropdown selection
- Color picker integration
- Slider interactions
- Advanced section toggle

### Integration Tests (Target: 60%+ coverage)
- End-to-end text creation workflow
- End-to-end label attachment workflow
- Text selection and editing
- Undo/redo operations
- Layer visibility/locking
- Context menu actions

### Performance Tests
- Render 100 text objects at 60 FPS
- Modal open time < 100ms
- Text creation time < 50ms
- Camera movement with 100 texts
- Memory usage with 200 texts

### Accessibility Tests
- Keyboard navigation (Tab, Enter, Esc)
- Focus indicators visible
- Color contrast WCAG 2.1 AA
- Screen reader compatibility

## Performance Considerations

### Optimization Strategies
1. **Throttle position updates** to 16ms (60 FPS)
2. **Lazy render off-screen text** (future optimization)
3. **Memoize text components** with React.memo
4. **Batch store updates** to reduce re-renders
5. **Use useMemo for calculations** (rotation, positioning)
6. **Debounce modal inputs** (300ms for sliders)

### Performance Budgets
- Text tool activation: < 50ms
- Modal open: < 100ms
- Text creation: < 50ms
- Position update: < 16ms (60 FPS)
- 100 text objects: 60 FPS maintained
- 200 text objects: 30 FPS minimum

### Monitoring
- Performance.mark() for key operations
- Console warnings for slow operations (dev only)
- User warning at 75 objects
- Hard limit at 200 objects

## Security Considerations

### Input Validation
- Sanitize text content (prevent XSS)
- Limit character count (500 max)
- Validate font family (whitelist only)
- Validate numeric inputs (size, spacing, rotation)
- Validate color format (hex only)

### XSS Prevention
- Use React's built-in XSS protection
- No dangerouslySetInnerHTML
- Escape special characters in text content
- Validate all user inputs

### Client-Side Only
- No external API calls
- No data sent to servers
- Fonts loaded from Google Fonts CDN (trusted)
- No localStorage for sensitive data

## Constitution Compliance Checklist

- ✅ **Article 1:** All styling via inline styles (no CSS files)
- ✅ **Article 2:** TypeScript strict mode, explicit types
- ✅ **Article 3:** Zustand store (useTextStore)
- ✅ **Article 4:** Functional components with hooks
- ✅ **Article 5:** 60 FPS target, Three.js + R3F
- ✅ **Article 6:** 70% test coverage target
- ✅ **Article 7:** Client-side only, environment-based logging
- ✅ **Article 8:** Edit existing files (Ribbon, Properties, DrawingCanvas)
- ✅ **Article 9:** Canva-inspired design, Nunito Sans, 200ms transitions
- ✅ **Article 10:** Proper file organization (components, store, types)

## Risk Assessment

### High Risks
1. **R-5: Dimension Overlay Conflict** (Impact: High)
   - **Mitigation:** Apply `data-modal-open` pattern
   - **Validation:** Test with all modals and dropdowns

2. **R-2: Text Rendering Performance** (Impact: High)
   - **Mitigation:** Throttle updates, test with 200 objects
   - **Validation:** Performance tests in CI/CD

### Medium Risks
3. **R-4: Label Attachment Logic** (Impact: Medium)
   - **Mitigation:** Comprehensive unit tests, edge cases
   - **Validation:** Manual testing with rotations

4. **R-1: Font Loading Performance** (Impact: Medium)
   - **Mitigation:** Preconnect, display=swap
   - **Validation:** Lighthouse performance score

### Low Risks
5. **R-3: Modal Complexity** (Impact: Low)
   - **Mitigation:** Collapse advanced section, tooltips
   - **Validation:** User testing

## Implementation Checklist

### Prerequisites
- ✅ Specification approved
- ✅ Technical approach reviewed
- ✅ Dependencies identified
- ✅ File structure planned
- ✅ Constitution compliance verified

### Phase Completion Criteria
Each phase must meet:
- All deliverables completed
- Unit tests written (if applicable)
- Lint passes (npm run lint)
- Build succeeds (npm run build)
- Tests pass (npm test)
- Manual testing complete

### Definition of Done
- All 11 phases complete
- 70%+ test coverage achieved
- All edge cases handled
- Performance targets met (60 FPS)
- Constitution compliant
- No P0/P1 bugs
- Code reviewed
- Documentation updated

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Foundation | 4-6 hours | None |
| 2. Text Modal | 5-7 hours | Phase 1 |
| 3. Text Rendering | 6-8 hours | Phase 1, 2 |
| 4. Text Tool & Selection | 4-6 hours | Phase 3 |
| 5. Shape Label Attachment | 5-7 hours | Phase 3, 4 |
| 6. Properties Panel | 3-4 hours | Phase 3, 4 |
| 7. Context Menu & Shortcuts | 2-3 hours | Phase 4 |
| 8. Undo/Redo | 2-3 hours | Phase 1 |
| 9. Layer Integration | 2-3 hours | Phase 1, 4 |
| 10. Testing | 6-8 hours | All phases |
| 11. Polish & Edge Cases | 3-4 hours | All phases |

**Total Estimate:** 42-59 hours (~1-1.5 weeks full-time)

**Critical Path:** Phase 1 → 2 → 3 → 4 → 5 → 10 → 11

**Parallel Work Opportunities:**
- Phase 6, 7, 8, 9 can be done in parallel after Phase 4 completes

## Next Steps

1. Review this plan with team
2. Run `/speckit.tasks` to generate detailed task breakdown
3. Run `/speckit.checklist` to generate quality checklists
4. Run `/speckit.analyze` to verify consistency (target score: 85+)
5. Begin implementation with `/speckit.implement`

## References

- Specification: `specs/015-text-feature/spec.md`
- Constitution: `memory/constitution.md`
- Dimension overlay fix: `docs/technical/DIMENSION_OVERLAY_FIX.md`
- Measurement overlay pattern: `app/src/components/MeasurementOverlay.tsx`
- Existing modal patterns: `app/src/components/InsertArea/InsertAreaModal.tsx`
