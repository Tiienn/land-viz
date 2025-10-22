# Text Feature Documentation

## Overview

The Text feature enables users to add floating text labels and annotations to their 3D land visualizations using **Canva-style inline editing**. Text objects are rendered as billboards that always face the camera, ensuring readability from any viewing angle.

**Status**: ✅ ALL PHASES COMPLETE (1-12) - Production Ready with Inline Editing
**Version**: 3.0.0
**Last Updated**: October 2025

## 🎉 Production-Ready Summary

The Text feature is **complete and production-ready**! All 12 phases have been implemented and tested:

- ✅ **52 tests passing** (32 unit + 20 integration)
- ✅ **Canva-style inline editing** - Type directly at click position
- ✅ **Live formatting controls** in properties panel
- ✅ **Full CRUD operations** with undo/redo support
- ✅ **Shape label attachment** via double-click
- ✅ **Context menu** with all text operations
- ✅ **Layer integration** with visual hierarchy
- ✅ **Performance monitoring** with automatic warnings
- ✅ **Font loading system** with graceful fallbacks
- ✅ **0 TypeScript errors** - fully type-safe

**What You Can Do:**
- **Create text instantly** - Click → Type immediately (no modal interruption)
- **Format in real-time** - Change font, size, color while typing
- Edit text properties (font, size, color, alignment, rotation)
- Lock/unlock and show/hide text
- Duplicate, delete, and manage text in layers
- Full undo/redo support for all text operations
- Context menu for quick actions
- Keyboard shortcuts for productivity

---

## Table of Contents

1. [User Guide](#user-guide)
2. [Technical Implementation](#technical-implementation)
3. [Implementation Phases](#implementation-phases)
4. [API Reference](#api-reference)
5. [Future Enhancements](#future-enhancements)

---

## User Guide

### Creating Text (Canva-Style Inline Editing)

**New Workflow - Instant Text Creation:**

1. **Click the Text Tool** (T icon) in the ribbon toolbar, or press **T** on your keyboard
2. **Click anywhere** in the 3D scene where you want to place text
3. **Inline editor appears immediately** at the click position - no modal interruption!
4. **Start typing** - your text appears in real-time
5. **Format while typing** using the Properties Panel:
   - **Font**: Choose from 6 Google Fonts (Nunito Sans, Roboto, Open Sans, Montserrat, Lato, Courier New)
   - **Size**: Adjust with slider (8-72px) - updates live!
   - **Color**: Pick any color - updates live!
   - **Alignment**: Left, Center, or Right - updates live!
6. **Finish editing**:
   - Press **ESC** or **Ctrl+Enter** to save
   - Or **click away** from the editor
   - Empty text is automatically deleted

**Key Benefits:**
- ⚡ **3x faster** - 2 clicks instead of 6
- 🎨 **Live preview** - See all changes immediately
- 🎯 **No interruption** - Type exactly where you click
- ✨ **Industry standard** - Matches Canva, Figma, Photoshop

### Editing Text

1. **Click on any text object** in the scene to select it
2. **Use the Properties Panel** to edit text properties
3. For advanced editing, click "Edit Text Content" button in Properties Panel

### Selecting and Managing Text

- **Single Selection**: Click on a text object
- **Multi-Selection**: Hold Ctrl/Cmd and click multiple text objects
- **Delete Text**: Select text and press **Delete** or **Backspace**
- **Duplicate Text**: Select text and press **Ctrl+D** (Cmd+D on Mac)
- **Deselect**: Press **Escape** or click empty space

### Text Properties

Text objects support the following properties:

| Property | Description | Default | Range/Options |
|----------|-------------|---------|---------------|
| **Content** | The text to display | "New Text" | 1-500 characters |
| **Font Family** | Typography style | Nunito Sans | 6 Google Fonts |
| **Font Size** | Text size in pixels | 16px | 8-72px |
| **Color** | Text color | #000000 (black) | Any hex color |
| **Alignment** | Text alignment | center | left, center, right |
| **Bold** | Bold font weight | false | true/false |
| **Italic** | Italic font style | false | true/false |
| **Rotation** | Text rotation angle | 0° | 0-360° |
| **Opacity** | Text transparency | 100% | 0-100% |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **T** | Activate Text tool |
| **Escape** | Finish inline editing / Cancel / Deselect text |
| **Ctrl+Enter** | Force finish inline editing |
| **Enter** | New line (multiline text support) |
| **Delete** / **Backspace** | Delete selected text |
| **Ctrl+D** / **Cmd+D** | Duplicate selected text |
| **Ctrl+Z** / **Cmd+Z** | Undo text operation |
| **Ctrl+Y** / **Cmd+Y** | Redo text operation |

**Inline Editing Notes:**
- **ESC** while editing: Save text and close editor (or delete if empty)
- **Ctrl+Enter** while editing: Save text and close editor
- **Enter** while editing: Create new line (multiline support)
- **Click away**: Automatically saves and closes editor

---

## Technical Implementation

### Architecture Overview

The Text feature follows a modular architecture with clear separation of concerns:

```
Text Feature Architecture
│
├── State Management (Zustand)
│   └── useTextStore.ts - 11 actions, 5 selectors
│
├── UI Components (React)
│   ├── TextModal.tsx - Creation/editing modal (490 lines)
│   ├── TextObject.tsx - Individual text renderer (billboard)
│   └── TextRenderer.tsx - Scene-level text manager
│
├── Utilities
│   └── textUtils.ts - 12 utility functions
│
└── Types
    └── text.ts - TypeScript definitions
```

### Technology Stack

- **React 18**: Component framework
- **Three.js**: 3D rendering engine
- **React Three Fiber**: React renderer for Three.js
- **Drei**: Helper library for R3F (`<Html>` component for billboards)
- **Zustand**: Lightweight state management
- **Google Fonts**: Typography system
- **TypeScript**: Strict type safety

### Key Components

#### 1. Text Store (`useTextStore.ts`)

Zustand store managing text state with domain-specific actions:

**State:**
```typescript
{
  textObjects: TextObject[];        // All text objects
  selectedTextIds: string[];        // Currently selected text
  textModalOpen: boolean;           // Modal visibility
  editingTextId: string | null;     // ID of text being edited
}
```

**Actions:**
- `addTextObject(text)` - Create new text
- `updateTextObject(id, updates)` - Update existing text
- `deleteTextObject(id)` - Remove text
- `duplicateTextObject(id)` - Clone text
- `selectText(id, multiSelect)` - Select text object(s)
- `clearSelection()` - Clear selection
- `setTextModalOpen(open)` - Control modal visibility
- `setEditingTextId(id)` - Set text being edited
- `moveTextObject(id, position)` - Update text position
- `rotateTextObject(id, rotation)` - Update text rotation
- `updateTextOpacity(id, opacity)` - Update transparency

**Selectors:**
- `getTextObject(id)` - Get text by ID
- `getSelectedTextObjects()` - Get all selected text
- `getVisibleTextObjects()` - Filter by layer visibility
- `getTextObjectsByLayer(layerId)` - Get text in layer
- `hasSelection()` - Check if any text selected

#### 2. Text Modal Component (`TextModal.tsx`)

Full-featured modal for creating/editing text with real-time preview:

**Features:**
- Live text preview with formatting
- Font family selector (6 Google Fonts)
- Font size slider (8-72px)
- Color picker with hex input
- Text alignment buttons (left/center/right)
- Advanced options accordion:
  - Bold/italic toggles
  - Rotation slider (0-360°)
  - Opacity slider (0-100%)
- Character counter (500 max)
- Validation and error handling
- Responsive design

**Props:**
```typescript
interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: TextObject) => void;
  initialText?: TextObject;        // For editing existing text
  position?: TextPosition;         // Initial position
  isLabel?: boolean;               // Attached to shape
  attachedToShapeId?: string;      // Parent shape ID
}
```

#### 3. Text Object Renderer (`TextObject.tsx`)

Renders individual text in 3D using drei's `<Html>` component:

**Billboard Effect:**
```typescript
<Html
  position={[position.x, position.y, position.z]}
  center
  distanceFactor={10}
  style={{
    pointerEvents: isSelected ? 'auto' : 'none',
    transform: `rotate(${rotation}deg)`,
    opacity: opacity / 100,
    // ... other styles
  }}
>
  <div style={{ fontFamily, fontSize, color, textAlign }}>
    {content}
  </div>
</Html>
```

**Features:**
- Always faces camera (billboard behavior)
- Selection visual feedback
- Click/double-click handlers
- Layer visibility filtering
- Responsive to camera distance

#### 4. Text Renderer (`TextRenderer.tsx`)

Scene-level component managing all text objects:

```typescript
export function TextRenderer() {
  const textObjects = useTextStore(state => state.textObjects);
  const layers = useLayerStore(state => state.layers);

  const visibleTextObjects = textObjects.filter(text => {
    const layer = layers.find(l => l.id === text.layerId);
    return layer?.visible ?? true;
  });

  return (
    <>
      {visibleTextObjects.map(text => (
        <TextObject
          key={text.id}
          textObject={text}
          isSelected={/* selection logic */}
          onClick={/* click handler */}
          onDoubleClick={/* double-click handler */}
        />
      ))}
    </>
  );
}
```

### Utilities (`textUtils.ts`)

12 utility functions for text operations:

1. **`generateTextId()`**: Generate unique IDs with 'text-' prefix
2. **`createDefaultTextObject(position, layerId)`**: Create text with defaults
3. **`validateTextContent(content)`**: Validate text (1-500 chars)
4. **`formatTextContent(content)`**: Sanitize and format text
5. **`calculateTextBounds(text)`**: Calculate bounding box
6. **`isPointInTextBounds(point, text)`**: Hit detection
7. **`calculateLabelPosition(shape)`**: Position for shape labels
8. **`getTextColor(backgroundColor)`**: Auto contrast color
9. **`getFontSizeForDistance(distance)`**: Distance-based sizing
10. **`clampTextRotation(rotation)`**: Normalize rotation (0-360°)
11. **`interpolateTextColor(color1, color2, t)`**: Color interpolation
12. **`rotateVector(vector, rotation)`**: Vector rotation helper

### Type Definitions (`text.ts`)

Complete TypeScript type system:

```typescript
// Core text object
export interface TextObject {
  id: string;
  type: TextType;
  content: string;
  position: TextPosition;
  fontFamily: string;
  fontSize: number;
  color: string;
  textAlign: TextAlignment;
  bold: boolean;
  italic: boolean;
  rotation: number;
  opacity: number;
  layerId: string;
  visible: boolean;
  locked: boolean;
  created: Date;
  modified: Date;
  attachedToShapeId?: string;  // For shape labels (Phase 5+)
}

// 3D position
export interface TextPosition {
  x: number;
  y: number;
  z: number;
}

// Text types
export type TextType = 'floating' | 'label';
export type TextAlignment = 'left' | 'center' | 'right';
```

### Integration Points

#### App.tsx Integration

```typescript
// 1. State management
const [textModalOpen, setTextModalOpen] = useState(false);
const [textModalPosition, setTextModalPosition] = useState<TextPosition | undefined>();

// 2. Event listener for text tool clicks
useEffect(() => {
  const handleOpenTextModal = (event: Event) => {
    const customEvent = event as CustomEvent;
    setTextModalPosition(customEvent.detail.position);
    setTextModalOpen(true);
  };

  window.addEventListener('openTextModal', handleOpenTextModal);
  return () => window.removeEventListener('openTextModal', handleOpenTextModal);
}, []);

// 3. Save handler
const handleTextModalSave = (textObject: TextObject) => {
  useTextStore.getState().addTextObject(textObject);
  setTextModalOpen(false);
};

// 4. JSX rendering
<TextModal
  isOpen={textModalOpen}
  onClose={() => setTextModalOpen(false)}
  onSave={handleTextModalSave}
  position={textModalPosition}
/>
```

#### DrawingCanvas.tsx Integration

```typescript
// Text tool click handler
case 'text': {
  const raycaster = new Raycaster();
  raycaster.setFromCamera(mouseCoords, camera);
  const intersects = raycaster.intersectObject(ground);

  if (intersects.length > 0) {
    const { x, y, z } = intersects[0].point;

    // Emit custom event to open modal
    window.dispatchEvent(new CustomEvent('openTextModal', {
      detail: { position: { x, y, z } }
    }));
  }
  break;
}
```

#### SceneManager.tsx Integration

```typescript
<Canvas>
  <CameraController />
  <GridBackground />
  <DrawingCanvas />
  <ShapeRenderer />
  <TextRenderer />  {/* Add text rendering */}
</Canvas>
```

### Shape Label Integration (Phase 5)

**Shape Type Extension:**
```typescript
// types/index.ts
export interface Shape {
  // ... existing fields
  label?: import('./text').TextObject;  // Optional text label
}
```

**Planned Components (Phase 5):**
- `ShapeLabelRenderer.tsx` - Renders labels attached to shapes
- Double-click detection on shapes to add labels
- Label position inheritance from parent shape
- Label rotation/movement with parent shape

### Performance Considerations

1. **Efficient Rendering:**
   - Only visible text objects are rendered
   - Layer-based visibility filtering
   - Selective re-rendering based on state changes

2. **Memory Management:**
   - Text objects use lightweight data structures
   - No heavy Three.js geometries (using HTML billboards)
   - Proper cleanup on unmount

3. **Optimization Techniques:**
   - Zustand shallow comparison for selectors
   - React memo for TextObject components
   - Throttled position updates during drag (future)

4. **Scalability:**
   - Tested with 100+ text objects
   - Performance budget monitoring (future)
   - Virtualization for large text counts (future)

---

## Implementation Phases

### ✅ Phase 1: Foundation (Complete)

**Goals:**
- Set up type system and state management
- Create utility functions
- Establish architecture

**Deliverables:**
- `types/text.ts` - Complete type definitions
- `store/useTextStore.ts` - Zustand store with 11 actions
- `utils/textUtils.ts` - 12 utility functions

### ✅ Phase 2: Text Creation Modal (Complete)

**Goals:**
- Build full-featured text creation UI
- Implement real-time preview
- Add validation and formatting controls

**Deliverables:**
- `components/Text/TextModal.tsx` (490 lines)
- Font family selector (6 Google Fonts)
- Font size, color, alignment controls
- Advanced options (bold, italic, rotation, opacity)
- Character counter and validation

### ✅ Phase 3: 3D Text Rendering (Complete)

**Goals:**
- Render text as 3D billboards
- Implement selection system
- Layer visibility integration

**Deliverables:**
- `components/Text/TextObject.tsx` - Individual text renderer
- `components/Text/TextRenderer.tsx` - Scene manager
- Billboard effect using drei `<Html>`
- Selection visual feedback
- Layer visibility filtering

### ✅ Phase 4: Text Tool & Selection (Complete)

**Goals:**
- Integrate text tool into ribbon
- Implement click-to-create workflow
- Add text selection and management

**Deliverables:**
- Text tool button in `App.tsx` ribbon
- Text icon in `Icon.tsx`
- Click handler in `DrawingCanvas.tsx`
- Event system for modal opening
- Selection/deselection logic
- Delete and duplicate operations

### ✅ Phase 5: Shape Label Attachment (Complete)

**Goals:**
- Allow attaching text labels to shapes
- Inherit position/rotation from parent shape
- Implement double-click to add label

**Deliverables:**
- ✅ Added `label` field to Shape type
- ✅ Double-click detection on shapes (ShapeRenderer.tsx:807-834)
- ✅ ShapeLabelRenderer component for rendering labels
- ✅ Label duplication logic in useAppStore
- ✅ Label position calculation relative to shape center
- ✅ CustomEvent system for opening label modal

**Key Features:**
- Double-click any shape to add/edit label
- Labels automatically positioned at shape center
- Labels duplicated when parent shape is duplicated
- Labels rendered separately from floating texts

### ✅ Phase 6: Properties Panel Integration (Complete)

**Goals:**
- Add text editing to Properties panel
- Enable live text property updates
- Integrate with existing panel system

**Deliverables:**
- ✅ Created `TextPropertiesPanel.tsx` component (334 lines)
- ✅ Added "Edit Text Content" button to reopen modal
- ✅ Lock/Unlock toggle for text protection
- ✅ Show/Hide toggle for visibility control
- ✅ Delete button with locked protection
- ✅ Integrated into `PropertiesPanel.tsx`

**Key Features:**
- Text preview with actual font rendering
- Edit button reopens modal with current values
- Lock prevents accidental edits and deletion
- Visibility toggle hides text without deleting
- Special indicators for labels vs floating text
- Warning messages when text is locked

### ✅ Phase 7: Context Menu & Shortcuts (Complete)

**Goals:**
- Add text-specific context menu options
- Implement keyboard shortcuts
- Add lock/unlock functionality

**Deliverables:**
- ✅ Added 'text' to ContextMenuType (contextMenu.ts)
- ✅ Created complete text context menu (useContextMenuItems.ts)
- ✅ Added targetTextId to context menu state
- ✅ Integrated context menu into TextObject and TextRenderer
- ✅ Lock/unlock functionality implemented

**Context Menu Items:**
- Edit Text Content (Enter)
- Duplicate (Ctrl+D)
- Lock / Unlock
- Show / Hide
- Text Properties
- Delete (Del)

**Keyboard Shortcuts:**
- T - Activate text tool
- Enter - Edit selected text
- Ctrl+D - Duplicate text
- Delete - Delete text
- ESC - Cancel/Deselect

### ✅ Phase 8: Undo/Redo Integration (Complete)

**Goals:**
- Add text operations to history system
- Support undo/redo for all text actions

**Deliverables:**
- ✅ Modified `useAppStore.saveToHistory()` to include text state
- ✅ Modified `useAppStore.undo()` to restore text state
- ✅ Modified `useAppStore.redo()` to restore text state
- ✅ Added window-based bridge pattern for cross-store communication
- ✅ All text actions call saveToHistory before mutations

**Architecture:**
- Window bridge: `window.textStoreState` for state exposure
- Restore function: `window.restoreTextState()` for undo/redo
- All text operations (add, update, delete) save to history
- Complete bidirectional sync between stores

**What's Tracked:**
- Text creation
- Text content/style updates
- Text position changes
- Text deletion
- Text visibility/lock state

### ✅ Phase 9: Layer Integration (Complete)

**Goals:**
- Display text objects in layers panel
- Enable text reordering and organization
- Add per-layer text visibility

**Deliverables:**
- ✅ Modified `LayerPanel.tsx` to show text objects (lines 836-1006)
- ✅ Added text count to layer statistics
- ✅ Text objects displayed with type icons
- ✅ Click text in layer panel to select in scene
- ✅ Show lock and visibility indicators

**Key Features:**
- "Text Objects" section under each layer
- Shape Labels grouped with parent shapes
- Floating Texts listed separately
- Interactive selection from layer panel
- Visual indicators:
  - 🔒 Lock icon for locked text
  - 👁️ Hidden icon for invisible text
  - Blue highlight for selected text
- Updated statistics show text count and label count
- Updated delete confirmation includes text count

### ✅ Phase 10: Testing (Complete)

**Goals:**
- Comprehensive test coverage
- Unit, integration, and performance tests

**Deliverables:**
- ✅ Created `useTextStore.test.ts` (32 unit tests)
- ✅ Created `TextFeature.integration.test.tsx` (20 integration tests)
- ✅ All 52 tests passing (100% pass rate)
- ✅ Mock system for useAppStore integration
- ✅ Edge case testing (empty content, long content, boundaries)

**Test Coverage:**
- **Unit Tests (32)**:
  - Initial state verification
  - CRUD operations (add, update, delete, clear)
  - Selection management
  - Position & rotation updates
  - All selector functions

- **Integration Tests (20)**:
  - Text creation workflows
  - Selection and editing
  - Visibility and locking
  - Layer management
  - Undo/redo operations
  - Multi-text operations
  - Edge cases (empty, multiline, long content, boundaries)

**Test Results:**
- 52/52 tests passing
- 0 TypeScript errors
- Complete CRUD coverage
- History integration verified

### ✅ Phase 11: Polish & Edge Cases (Complete)

**Goals:**
- Performance monitoring
- Font loading with fallbacks
- Improved error handling
- Text wrapping improvements

**Deliverables:**
- ✅ Created `textPerformance.ts` - Performance monitoring system
- ✅ Created `fontLoader.ts` - Robust font loading with fallbacks
- ✅ Integrated performance monitoring into TextRenderer
- ✅ Integrated font stack system into TextObject
- ✅ Improved text wrapping with overflow handling
- ✅ Initialized font loader in App.tsx

**Performance Monitoring:**
- Checks text count (warning at 50, critical at 100)
- Monitors text length (warning at 200 chars, critical at 400)
- Provides performance recommendations
- Calculates text statistics (total, visible, average length)
- Automatic logging when thresholds exceeded

**Font Loading System:**
- 6 fonts with proper fallback stacks
- Font Loading API integration
- Caching for performance
- Graceful degradation when fonts fail
- Validation and error handling
- Automatic initialization on app load

**Text Wrapping:**
- `overflowWrap: 'break-word'`
- `wordBreak: 'break-word'`
- Handles long URLs and words gracefully
- Prevents container overflow

**Error Messages:**
- Already comprehensive in TextModal
- Real-time character counter
- Empty text validation with visual feedback
- Warning colors when approaching limits
- Disabled save for invalid input

### ✅ Phase 12: Canva-Style Inline Editing (Complete - October 2025)

**Goals:**
- Replace modal-based text creation with inline editing
- Implement direct manipulation like Canva, Figma, AutoCAD
- Add live formatting controls in properties panel
- Eliminate workflow interruption

**Deliverables:**
- ✅ Created `InlineTextEditor.tsx` (165 lines) - 3D inline text input component
- ✅ Created `TextFormattingControls.tsx` (234 lines) - Live formatting panel
- ✅ Updated `useTextStore.ts` - Added inline editing state management
- ✅ Updated `DrawingCanvas.tsx` - Creates text immediately, no modal
- ✅ Updated `TextRenderer.tsx` - Renders InlineTextEditor when editing
- ✅ Updated `PropertiesPanel.tsx` - Shows live formatting controls
- ✅ Updated `App.tsx` - Removed modal-based text creation

**Key Features:**
- **Instant Text Creation**: Click → Type immediately (no modal)
- **Live Formatting**: All changes apply in real-time
- **Auto-Focus**: Editor appears with cursor ready
- **Multiple Exit Options**: ESC, Ctrl+Enter, or click away
- **Smart Cancellation**: Empty text automatically deleted
- **Full Undo/Redo**: All inline edits saved to history

**Architecture:**
```typescript
// New inline editing state in useTextStore
interface TextStore {
  isInlineEditing: boolean;
  inlineEditingTextId: string | null;
  inlineEditPosition: TextPosition | null;
  draftTextContent: string;

  startInlineEdit: (textId, position, content) => void;
  updateDraftContent: (content) => void;
  finishInlineEdit: () => void;
  cancelInlineEdit: () => void;
}
```

**Workflow Comparison:**
- **Before (Modal)**: Click tool → Click canvas → Wait for modal → Type → Format → Click save (6 steps, ~3 seconds)
- **After (Inline)**: Click tool → Click canvas → Type (2 steps, instant)

**Performance:**
- 3x faster text creation
- 0 modal delay
- Real-time preview
- Industry-standard UX

**What Still Uses Modal:**
- Shape labels (double-click on shapes) - intentional design choice
- Advanced text editing from Properties Panel - optional for power users

---

## API Reference

### useTextStore API

#### State

```typescript
interface TextState {
  textObjects: TextObject[];
  selectedTextIds: string[];
  textModalOpen: boolean;
  editingTextId: string | null;
}
```

#### Actions

```typescript
// Create
addTextObject(textObject: TextObject): void

// Read
getTextObject(id: string): TextObject | undefined
getSelectedTextObjects(): TextObject[]
getVisibleTextObjects(): TextObject[]
getTextObjectsByLayer(layerId: string): TextObject[]

// Update
updateTextObject(id: string, updates: Partial<TextObject>): void
moveTextObject(id: string, position: TextPosition): void
rotateTextObject(id: string, rotation: number): void
updateTextOpacity(id: string, opacity: number): void

// Delete
deleteTextObject(id: string): void

// Selection
selectText(id: string, multiSelect?: boolean): void
clearSelection(): void
hasSelection(): boolean

// UI State
setTextModalOpen(open: boolean): void
setEditingTextId(id: string | null): void

// Utility
duplicateTextObject(id: string): void
```

### Text Utilities API

```typescript
// ID Generation
generateTextId(): string

// Object Creation
createDefaultTextObject(
  position: TextPosition,
  layerId: string
): TextObject

// Validation
validateTextContent(content: string): {
  valid: boolean;
  error?: string;
}

// Formatting
formatTextContent(content: string): string

// Geometry
calculateTextBounds(text: TextObject): BoundingBox
isPointInTextBounds(point: Point3D, text: TextObject): boolean
calculateLabelPosition(shape: Shape): TextPosition

// Visual Helpers
getTextColor(backgroundColor: string): string
getFontSizeForDistance(distance: number): number
interpolateTextColor(color1: string, color2: string, t: number): string

// Transforms
clampTextRotation(rotation: number): number
rotateVector(vector: Vector2, rotation: number): Vector2
```

### Component Props

#### TextModal Props

```typescript
interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: TextObject) => void;
  initialText?: TextObject;
  position?: TextPosition;
  isLabel?: boolean;
  attachedToShapeId?: string;
}
```

#### TextObject Props

```typescript
interface TextObjectProps {
  textObject: TextObject;
  isSelected: boolean;
  onClick: (id: string, multiSelect: boolean) => void;
  onDoubleClick?: (id: string) => void;
}
```

#### TextRenderer Props

```typescript
// No props - uses store state
```

---

## Future Enhancements

All planned features (Phases 1-11) are now complete! 🎉

### Possible Future Additions

1. **Rich Text Editor**: Multi-line formatting, markdown support
2. **Text Styles**: Predefined text styles and templates
3. **Callouts**: Text with leader lines pointing to shapes
4. **Dimensions**: Automatic dimension text for measurements
5. **Export**: Include text in DXF/Excel exports
6. **Import**: Import text from external files
7. **Text Search**: Find/replace text across all objects
8. **Batch Operations**: Bulk text updates
9. **Animation**: Fade in/out effects for text
10. **Accessibility**: Screen reader support, high contrast modes

---

## Best Practices

### For Users

1. **Use appropriate font sizes**: 14-24px for body text, 24-48px for headings
2. **Limit text length**: Keep labels concise (under 50 characters)
3. **Use contrast**: Ensure text is readable against background
4. **Group related text**: Use layers to organize text by purpose
5. **Lock important text**: Prevent accidental edits with lock feature

### For Developers

1. **Always use type-only imports**: `import type { TextObject }` for TypeScript types
2. **Follow inline styles**: No CSS files per Constitution Article 1
3. **Use Zustand selectors**: Avoid unnecessary re-renders with shallow comparison
4. **Test with many objects**: Verify performance with 100+ text objects
5. **Handle edge cases**: Empty strings, special characters, extreme rotations
6. **Document breaking changes**: Update this document when making API changes

---

## Troubleshooting

### Common Issues

**Text not appearing:**
- Check layer visibility in layers panel
- Verify text object exists in store: `useTextStore.getState().textObjects`
- Check opacity is not 0%
- Ensure text is not behind camera

**Text modal not opening:**
- Verify text tool is active: `currentTool === 'text'`
- Check event listener is attached in App.tsx
- Confirm raycasting is working in DrawingCanvas.tsx

**Selection not working:**
- Check `pointerEvents` style on text objects
- Verify selection logic in store
- Ensure text is not locked

**Font not loading:**
- Check Google Fonts link in index.html
- Verify font family name matches exactly
- Clear browser cache

**Performance issues:**
- Reduce number of text objects (< 100 recommended)
- Check for infinite render loops
- Use React DevTools Profiler to identify bottlenecks

---

## Contributing

### Adding New Features

1. Follow SpecKit methodology: specify → clarify → plan → tasks → implement
2. Update this documentation with new features
3. Add tests for all new functionality
4. Follow existing code patterns and architecture
5. Update type definitions if needed

### Code Style

- **TypeScript strict mode**: All code must pass strict checks
- **Inline styles only**: No CSS files or className props
- **Functional components**: Use React hooks, no class components
- **Zustand patterns**: Domain-specific stores with actions and selectors
- **Clear naming**: Descriptive variable and function names

### Testing Requirements

- Unit tests for utilities and store actions
- Component tests for UI components
- Integration tests for workflows
- Performance tests for scalability
- Accessibility tests (WCAG 2.1 AA)

---

## Version History

### v3.0.0 (October 2025) - **Canva-Style Inline Editing Release**

- ✅ **Phase 12**: Canva-Style Inline Editing complete
- **Breaking Change**: Text creation workflow completely redesigned
- Modal-based text creation replaced with inline editing
- Live formatting controls in properties panel
- 3x faster text creation workflow (2 clicks vs 6 clicks)
- Industry-standard UX matching Canva, Figma, Photoshop

**Summary:**
The Text feature now uses **Canva-style inline editing** for instant text creation:
- Click text tool → Click canvas → Type immediately!
- No modal interruption - type directly at click position
- Real-time formatting with live preview
- Properties panel shows formatting controls during editing
- ESC, Ctrl+Enter, or click away to finish
- Empty text automatically deleted
- Full undo/redo support maintained

**New Files Created (Phase 12):**
- `components/Text/InlineTextEditor.tsx` (165 lines) - 3D inline text input
- `components/Text/TextFormattingControls.tsx` (234 lines) - Live formatting panel

**Files Modified (Phase 12):**
- `store/useTextStore.ts` - Added inline editing state (4 new actions)
- `components/Scene/DrawingCanvas.tsx` - Creates text immediately (no modal event)
- `components/Text/TextRenderer.tsx` - Renders InlineTextEditor when editing
- `components/PropertiesPanel.tsx` - Integrated TextFormattingControls
- `App.tsx` - Removed modal-based text creation logic

**Migration Notes:**
- Text modal (TextModal.tsx) still used for shape labels (double-click feature)
- Advanced editing still available via Properties Panel button
- All existing text functionality preserved
- No breaking changes to text data structure

### v2.0.0 (January 2025) - **Production Release**
- ✅ **Phase 1**: Foundation complete
- ✅ **Phase 2**: Text Creation Modal complete
- ✅ **Phase 3**: 3D Text Rendering complete
- ✅ **Phase 4**: Text Tool & Selection complete
- ✅ **Phase 5**: Shape Label Attachment complete
- ✅ **Phase 6**: Properties Panel Integration complete
- ✅ **Phase 7**: Context Menu & Shortcuts complete
- ✅ **Phase 8**: Undo/Redo Integration complete
- ✅ **Phase 9**: Layer Integration complete
- ✅ **Phase 10**: Testing complete (52 tests, 100% pass rate)
- ✅ **Phase 11**: Polish & Edge Cases complete

**Summary:**
The Text feature is now **production-ready** with complete functionality:
- Full CRUD operations for text objects
- Shape label attachment with double-click
- Properties panel with lock/visibility controls
- Context menu with all text operations
- Complete undo/redo integration
- Layer panel showing all text objects
- Comprehensive test suite (52 tests passing)
- Performance monitoring and warnings
- Font loading with graceful fallbacks
- Improved text wrapping and error handling

**New Files Created (Phase 5-11):**
- `components/Text/TextPropertiesPanel.tsx` (334 lines)
- `components/Text/ShapeLabelRenderer.tsx`
- `utils/textPerformance.ts` (135 lines)
- `utils/fontLoader.ts` (268 lines)
- `store/__tests__/useTextStore.test.ts` (32 tests)
- `components/Text/__tests__/TextFeature.integration.test.tsx` (20 tests)

**Files Modified (Phase 5-11):**
- `components/Scene/ShapeRenderer.tsx` - Double-click detection
- `components/PropertiesPanel.tsx` - Text properties integration
- `components/ContextMenu/useContextMenuItems.ts` - Text context menu
- `components/Text/TextRenderer.tsx` - Performance monitoring
- `components/Text/TextObject.tsx` - Font loading integration
- `components/LayerPanel.tsx` - Text object display
- `store/useAppStore.ts` - Undo/redo integration
- `store/useTextStore.ts` - History integration
- `App.tsx` - Font loader initialization

### v1.0.0 (January 2025) - Initial Release
- ✅ Phase 1-4: Foundation and core functionality
- Basic text creation, editing, and rendering
- Integration with drawing canvas

---

## References

- **Project Documentation**: `CLAUDE.md`
- **SpecKit Methodology**: `specs/015-text-feature/`
- **Type Definitions**: `app/src/types/text.ts`
- **Store Implementation**: `app/src/store/useTextStore.ts`
- **Main Components**: `app/src/components/Text/`

---

**Questions or Issues?**
Contact the development team or file an issue in the project repository.
