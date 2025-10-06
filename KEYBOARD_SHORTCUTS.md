# Land Visualizer Keyboard Shortcuts

> Press **?** to view this help overlay anytime in the application.

## 🎨 Drawing Tools

| Shortcut | Action |
|----------|--------|
| **S** | Select tool |
| **R** | Rectangle tool |
| **C** | Circle tool |
| **P** | Polyline tool |
| **L** | Line tool |
| **M** | Measurement tool (toggle) |
| **E** | Edit mode (toggle) |

## ✏️ Editing

| Shortcut | Action |
|----------|--------|
| **Ctrl+Z** (⌘Z on Mac) | Undo |
| **Ctrl+Y** (⌘⇧Z on Mac) | Redo |
| **Ctrl+D** (⌘D on Mac) | Duplicate selected shape |
| **Delete** or **Backspace** | Delete selected shape/measurement |

## 🎬 Drawing Controls

| Shortcut | Action |
|----------|--------|
| **Esc** | Cancel current operation / Close help overlay |
| **Tab** | Toggle multi-segment mode (Line tool only) |
| **Space** | Complete multi-segment line (Line tool only) |

## 👁️ View Controls

| Shortcut | Action |
|----------|--------|
| **V** | Toggle 2D/3D view |
| **?** | Show keyboard shortcuts help |

## 📝 Implementation Details

### Architecture

The keyboard shortcut system is built with:

- **Type-safe shortcuts**: `types/shortcuts.ts` defines all shortcut types
- **Centralized manager**: `services/keyboardShortcuts.ts` handles registration and execution
- **React hooks**: `hooks/useKeyboardShortcuts.ts` provides easy integration
- **Help overlay**: `components/KeyboardShortcutHelp.tsx` displays interactive guide

### Features

✅ **Smart Input Detection**: Shortcuts are disabled when typing in input fields
✅ **Cross-platform**: Automatically uses Ctrl on Windows/Linux, ⌘ (Cmd) on Mac
✅ **Context-aware**: Some shortcuts only work in specific modes
✅ **Conflict-free**: Built-in conflict detection and warning system
✅ **Visual Feedback**: Beautiful help overlay with categorized shortcuts

### Adding New Shortcuts

To add a new keyboard shortcut:

1. **Define in App.tsx**:
```typescript
{
  id: 'unique-id',
  key: 'n',  // Single key
  ctrl: true,  // Optional: Ctrl/Cmd modifier
  shift: false,  // Optional: Shift modifier
  description: 'New feature',
  category: 'tools',  // tools | editing | view | drawing | selection | alignment
  action: () => {
    // Your action here
  },
}
```

2. **Add to shortcuts array** in the `useMemo` hook in `App.tsx`

3. **Test**:
   - Press the key combination
   - Press **?** to verify it appears in help overlay
   - Test that it doesn't conflict with existing shortcuts

### Example: Adding a "New Shape" Shortcut

```typescript
{
  id: 'new-shape',
  key: 'n',
  ctrl: true,
  description: 'Create new shape',
  category: 'editing',
  action: () => {
    openNewShapeDialog();
  },
}
```

## 🔧 Future Enhancements

Potential improvements from SmartDraw analysis:

- **Arrow keys**: Nudge selected shape (0.1m increments)
- **Shift+Arrows**: Large nudge (1m increments)
- **Ctrl+G**: Group shapes
- **Ctrl+Shift+G**: Ungroup
- **+/-**: Zoom in/out
- **0**: Reset camera to default view
- **Ctrl+A**: Select all
- **Ctrl+L/R/T/B**: Align left/right/top/bottom
- **Ctrl+H**: Distribute horizontally
- **Alt+V**: Distribute vertically

## 📚 Related Files

- `/app/src/types/shortcuts.ts` - TypeScript type definitions
- `/app/src/services/keyboardShortcuts.ts` - Shortcut manager service
- `/app/src/hooks/useKeyboardShortcuts.ts` - React hooks for shortcuts
- `/app/src/components/KeyboardShortcutHelp.tsx` - Help overlay component
- `/app/src/components/Icon.tsx` - Icons (keyboard, close, info, help)
- `/app/src/App.tsx` - Main shortcut registration (lines 161-405)
- `/SMARTDRAW_FEATURE_ANALYSIS.md` - SmartDraw feature comparison

---

**Last Updated**: October 2025
**Version**: 1.0.0
