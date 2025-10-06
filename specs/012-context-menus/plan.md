# Implementation Plan: Context Menu System

**Spec**: 012-context-menus
**Created**: 2025-10-05
**Estimated Effort**: 6-8 hours

## Technical Approach

### Architecture Decision

**Decision**: Build a custom context menu system using React portals and inline styles, integrated with existing keyboard shortcuts.

**Rationale**:
- Full control over styling to match Canva design system
- No external dependencies (lightweight, faster bundle)
- Direct integration with existing shortcutManager
- Portal rendering for proper z-index layering
- Reusable component for all context types (canvas, shape, multi-selection)

**Alternatives Considered**:
1. **Use react-contexify library**: Adds ~15KB dependency, limited styling control, learning curve
2. **Native browser context menu**: No styling options, inconsistent cross-browser
3. **Radix UI Context Menu**: Better accessibility, but heavy dependency (50KB+)

### State Management

#### New Store State (useAppStore.ts)

```typescript
// Add to store state
interface AppStore {
  // ... existing state ...

  // Context menu state
  contextMenu: {
    isOpen: boolean;
    type: 'canvas' | 'shape' | 'multi-selection' | null;
    position: { x: number; y: number };
    targetShapeId?: string | null;
  };

  // New actions
  openContextMenu: (type: 'canvas' | 'shape' | 'multi-selection', position: { x: number; y: number }, targetShapeId?: string) => void;
  closeContextMenu: () => void;
}
```

**Why**:
- `isOpen`: Track menu visibility globally
- `type`: Determine which menu items to show
- `position`: Cursor coordinates for menu placement
- `targetShapeId`: Which shape was right-clicked (for shape/multi-selection menus)

#### Component State (ContextMenu.tsx)

```typescript
// Local state for submenu management
const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
const menuRef = useRef<HTMLDivElement>(null);
```

### Component Architecture

#### New Files

1. **`components/ContextMenu/ContextMenu.tsx`** (Main component)
   - Renders menu based on context type
   - Handles positioning and bounds checking
   - Manages submenu state
   - Portal rendering for z-index control

2. **`components/ContextMenu/ContextMenuItem.tsx`** (Menu item component)
   - Reusable menu item with icon, label, shortcut
   - Hover states and disabled states
   - Click handler

3. **`components/ContextMenu/ContextMenuDivider.tsx`** (Divider component)
   - Simple horizontal line separator

4. **`components/ContextMenu/useContextMenuActions.ts`** (Custom hook)
   - Defines all menu actions
   - Connects to store actions
   - Returns action handlers

5. **`types/contextMenu.ts`** (Type definitions)
   - MenuItemType interface
   - ContextMenuType enum
   - Action handler types

#### Modified Files

1. **`App.tsx`** (Lines ~100-200, ~700-800)
   - Add ContextMenu component to render tree
   - Add right-click prevention on canvas
   - Add context menu trigger on shapes

2. **`components/Scene/SceneManager.tsx`** (Lines ~50-100)
   - Add onContextMenu handler for canvas right-clicks
   - Prevent default browser context menu

3. **`components/Scene/ShapeRenderer.tsx`** (Lines ~200-300)
   - Add onContextMenu handler for shape right-clicks
   - Pass shape ID to context menu

4. **`components/Icon.tsx`** (Add new icons)
   - Add context menu icons: `copy`, `trash`, `lock`, `unlock`, `layer`, `align-left`, `align-right`, `align-top`, `align-bottom`, `align-center-h`, `align-center-v`, `distribute-h`, `distribute-v`, `group`

### Implementation Flow

#### 1. Canvas Right-Click Detection

```typescript
// In SceneManager.tsx
const handleCanvasContextMenu = (event: React.MouseEvent) => {
  event.preventDefault();

  // Check if click was on empty space (not a shape)
  const { raycaster, camera, shapes } = useAppStore.getState();
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length === 0) {
    // Empty canvas - show canvas menu
    openContextMenu('canvas', { x: event.clientX, y: event.clientY });
  }
};

// Add to canvas div
<div
  onContextMenu={handleCanvasContextMenu}
  style={{ width: '100%', height: '100%' }}
>
  <Canvas />
</div>
```

#### 2. Shape Right-Click Detection

```typescript
// In ShapeRenderer.tsx - for each shape
const handleShapeContextMenu = (event: ThreeEvent<MouseEvent>, shapeId: string) => {
  event.stopPropagation();

  const { selectedShapeIds } = useAppStore.getState();

  if (selectedShapeIds.length > 1 && selectedShapeIds.includes(shapeId)) {
    // Multi-selection menu
    openContextMenu('multi-selection', { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY }, shapeId);
  } else {
    // Single shape menu
    openContextMenu('shape', { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY }, shapeId);
  }
};

// Add to mesh
<mesh
  onContextMenu={(e) => handleShapeContextMenu(e, shape.id)}
>
  {/* shape geometry */}
</mesh>
```

#### 3. Context Menu Rendering

```tsx
// ContextMenu.tsx
export const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu } = useAppStore();
  const { isOpen, type, position, targetShapeId } = contextMenu;

  const menuItems = useContextMenuItems(type, targetShapeId);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position adjustment to keep menu in viewport
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontally if overflow
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 10;
    }

    // Adjust vertically if overflow
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 10;
    }

    setAdjustedPosition({ x, y });
  }, [isOpen, position]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, closeContextMenu]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeContextMenu]);

  if (!isOpen || !type) return null;

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: adjustedPosition.y,
        left: adjustedPosition.x,
        background: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        padding: '8px 0',
        minWidth: '200px',
        zIndex: 9999,
        userSelect: 'none',
      }}
    >
      {menuItems.map((item, index) => (
        item.type === 'divider' ? (
          <ContextMenuDivider key={index} />
        ) : (
          <ContextMenuItem
            key={item.id}
            item={item}
            onClose={closeContextMenu}
          />
        )
      ))}
    </div>,
    document.body
  );
};
```

#### 4. Menu Items Configuration

```typescript
// useContextMenuItems.ts
export const useContextMenuItems = (
  type: 'canvas' | 'shape' | 'multi-selection' | null,
  targetShapeId?: string | null
): MenuItem[] => {
  const { shapes, clipboard, selectedShapeIds } = useAppStore();

  if (type === 'canvas') {
    return [
      {
        id: 'paste',
        label: 'Paste',
        icon: 'clipboard',
        shortcut: 'Ctrl+V',
        disabled: !clipboard,
        disabledReason: 'No shape to paste',
        action: () => pasteShape(),
      },
      { type: 'divider' },
      {
        id: 'add-shape',
        label: 'Add Shape',
        icon: 'add',
        submenu: [
          { id: 'add-rectangle', label: 'Rectangle', icon: 'rectangle', shortcut: 'R', action: () => setTool('rectangle') },
          { id: 'add-circle', label: 'Circle', icon: 'circle', shortcut: 'C', action: () => setTool('circle') },
          { id: 'add-polyline', label: 'Polyline', icon: 'polyline', shortcut: 'P', action: () => setTool('polyline') },
          { id: 'add-line', label: 'Line', icon: 'line', shortcut: 'L', action: () => setTool('line') },
        ],
      },
      { type: 'divider' },
      {
        id: 'grid-settings',
        label: 'Grid Settings',
        icon: 'grid',
        submenu: [
          { id: 'toggle-grid', label: 'Toggle Grid', action: () => toggleGrid() },
          { id: 'set-grid-size', label: 'Set Grid Size...', action: () => openGridSizeDialog() },
        ],
      },
      {
        id: 'view-options',
        label: 'View',
        icon: 'view',
        submenu: [
          { id: 'reset-camera', label: 'Reset Camera', shortcut: '0', action: () => resetCamera() },
          { id: 'toggle-2d-3d', label: 'Toggle 2D/3D', shortcut: 'V', action: () => toggle2D3D() },
          { id: 'zoom-fit', label: 'Zoom to Fit', action: () => zoomToFit() },
        ],
      },
    ];
  }

  if (type === 'shape') {
    const targetShape = shapes.find(s => s.id === targetShapeId);

    return [
      {
        id: 'edit-dimensions',
        label: 'Edit Dimensions',
        icon: 'edit',
        shortcut: 'Enter',
        action: () => editDimensions(targetShapeId),
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: 'copy',
        shortcut: 'Ctrl+D',
        action: () => duplicateShape(targetShapeId),
      },
      { type: 'divider' },
      {
        id: 'layer',
        label: 'Layer',
        icon: 'layer',
        submenu: [
          { id: 'bring-front', label: 'Bring to Front', action: () => bringToFront(targetShapeId) },
          { id: 'send-back', label: 'Send to Back', action: () => sendToBack(targetShapeId) },
          { id: 'bring-forward', label: 'Bring Forward', action: () => bringForward(targetShapeId) },
          { id: 'send-backward', label: 'Send Backward', action: () => sendBackward(targetShapeId) },
        ],
      },
      {
        id: 'lock',
        label: targetShape?.locked ? 'Unlock' : 'Lock Position',
        icon: targetShape?.locked ? 'unlock' : 'lock',
        action: () => toggleLock(targetShapeId),
      },
      { type: 'divider' },
      {
        id: 'convert-template',
        label: 'Convert to Template',
        icon: 'template',
        disabled: true, // TODO: Enable when template system is implemented
        disabledReason: 'Template system coming soon',
        action: () => convertToTemplate(targetShapeId),
      },
      {
        id: 'properties',
        label: 'Properties',
        icon: 'settings',
        action: () => openProperties(targetShapeId),
      },
      { type: 'divider' },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'trash',
        shortcut: 'Del',
        destructive: true,
        action: () => deleteShape(targetShapeId),
      },
    ];
  }

  if (type === 'multi-selection') {
    return [
      {
        id: 'group',
        label: 'Group',
        icon: 'group',
        shortcut: 'Ctrl+G',
        disabled: selectedShapeIds.length < 2,
        disabledReason: 'Select multiple shapes',
        action: () => groupShapes(selectedShapeIds),
      },
      { type: 'divider' },
      {
        id: 'align',
        label: 'Align',
        icon: 'align',
        submenu: [
          { id: 'align-left', label: 'Left', icon: 'align-left', shortcut: 'Ctrl+L', action: () => alignShapes('left') },
          { id: 'align-right', label: 'Right', icon: 'align-right', shortcut: 'Ctrl+R', action: () => alignShapes('right') },
          { id: 'align-top', label: 'Top', icon: 'align-top', shortcut: 'Ctrl+T', action: () => alignShapes('top') },
          { id: 'align-bottom', label: 'Bottom', icon: 'align-bottom', shortcut: 'Ctrl+B', action: () => alignShapes('bottom') },
          { type: 'divider' },
          { id: 'align-center-h', label: 'Center Horizontally', icon: 'align-center-h', action: () => alignShapes('center-h') },
          { id: 'align-center-v', label: 'Center Vertically', icon: 'align-center-v', action: () => alignShapes('center-v') },
        ],
      },
      {
        id: 'distribute',
        label: 'Distribute',
        icon: 'distribute',
        submenu: [
          { id: 'distribute-h', label: 'Horizontally', icon: 'distribute-h', shortcut: 'Ctrl+H', action: () => distributeShapes('horizontal') },
          { id: 'distribute-v', label: 'Vertically', icon: 'distribute-v', shortcut: 'Alt+V', action: () => distributeShapes('vertical') },
        ],
      },
      {
        id: 'match-size',
        label: 'Match Size',
        icon: 'resize',
        submenu: [
          { id: 'match-width', label: 'Match Width', action: () => matchSize('width') },
          { id: 'match-height', label: 'Match Height', action: () => matchSize('height') },
          { id: 'match-both', label: 'Match Both', action: () => matchSize('both') },
        ],
      },
      { type: 'divider' },
      {
        id: 'duplicate-all',
        label: 'Duplicate All',
        icon: 'copy',
        shortcut: 'Ctrl+D',
        action: () => duplicateShapes(selectedShapeIds),
      },
      {
        id: 'delete-all',
        label: 'Delete All',
        icon: 'trash',
        shortcut: 'Del',
        destructive: true,
        action: () => deleteShapes(selectedShapeIds),
      },
    ];
  }

  return [];
};
```

#### 5. MenuItem Component

```tsx
// ContextMenuItem.tsx
interface ContextMenuItemProps {
  item: MenuItem;
  onClose: () => void;
}

export const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ item, onClose }) => {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (item.disabled) return;
    if (item.submenu) {
      setShowSubmenu(!showSubmenu);
      return;
    }

    item.action?.();
    onClose();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (item.submenu) {
      setShowSubmenu(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Keep submenu open briefly
    setTimeout(() => setShowSubmenu(false), 300);
  };

  return (
    <div
      ref={itemRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        cursor: item.disabled ? 'not-allowed' : 'pointer',
        backgroundColor: isHovered && !item.disabled ? '#f3f4f6' : 'transparent',
        opacity: item.disabled ? 0.4 : 1,
        transition: 'background-color 150ms',
        position: 'relative',
      }}
      title={item.disabled ? item.disabledReason : undefined}
    >
      {/* Icon */}
      {item.icon && (
        <Icon name={item.icon} size={16} color={item.destructive ? '#ef4444' : '#6b7280'} />
      )}

      {/* Label */}
      <span style={{
        marginLeft: item.icon ? '8px' : '0',
        fontSize: '14px',
        color: item.destructive ? '#ef4444' : '#1f2937',
        flex: 1,
      }}>
        {item.label}
      </span>

      {/* Shortcut or Submenu Arrow */}
      {item.shortcut && (
        <kbd style={{
          marginLeft: '16px',
          padding: '2px 6px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '3px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#9ca3af',
        }}>
          {item.shortcut}
        </kbd>
      )}
      {item.submenu && (
        <Icon name="chevron-right" size={12} color="#9ca3af" style={{ marginLeft: '8px' }} />
      )}

      {/* Submenu */}
      {item.submenu && showSubmenu && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '100%',
            marginLeft: '4px',
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            padding: '8px 0',
            minWidth: '200px',
            zIndex: 10000,
          }}
        >
          {item.submenu.map((subItem, index) => (
            subItem.type === 'divider' ? (
              <ContextMenuDivider key={index} />
            ) : (
              <ContextMenuItem key={subItem.id} item={subItem} onClose={onClose} />
            )
          ))}
        </div>
      )}
    </div>
  );
};
```

### Data Flow Diagram

```
User right-clicks on canvas
  ↓
SceneManager: handleCanvasContextMenu(event)
  ↓
Raycast check: Is there a shape under cursor?
  ↓
No shape → openContextMenu('canvas', { x, y })
  ↓
useAppStore: Set contextMenu state
  ↓
ContextMenu component re-renders
  ↓
useContextMenuItems hook: Generate menu items based on type
  ↓
Render menu at cursor position with bounds check
  ↓
User hovers over item
  ↓
Item highlights (background: #f3f4f6)
  ↓
User clicks item
  ↓
Execute action (e.g., setTool('rectangle'))
  ↓
closeContextMenu()
  ↓
Menu disappears
```

### Testing Strategy

#### Unit Tests

1. **Store Actions** (`useAppStore.test.ts`)
   ```typescript
   describe('Context Menu Store', () => {
     it('should open canvas context menu', () => {
       const store = useAppStore.getState();
       store.openContextMenu('canvas', { x: 100, y: 200 });
       expect(store.contextMenu.isOpen).toBe(true);
       expect(store.contextMenu.type).toBe('canvas');
       expect(store.contextMenu.position).toEqual({ x: 100, y: 200 });
     });

     it('should close context menu', () => {
       const store = useAppStore.getState();
       store.openContextMenu('shape', { x: 150, y: 250 }, 'shape-1');
       store.closeContextMenu();
       expect(store.contextMenu.isOpen).toBe(false);
       expect(store.contextMenu.type).toBe(null);
     });
   });
   ```

2. **Menu Items Generation** (`useContextMenuItems.test.ts`)
   ```typescript
   describe('useContextMenuItems', () => {
     it('should return canvas menu items', () => {
       const items = useContextMenuItems('canvas', null);
       expect(items).toContainEqual(expect.objectContaining({ id: 'paste' }));
       expect(items).toContainEqual(expect.objectContaining({ id: 'add-shape' }));
     });

     it('should disable paste when clipboard is empty', () => {
       const store = useAppStore.getState();
       store.clipboard = null;
       const items = useContextMenuItems('canvas', null);
       const pasteItem = items.find(item => item.id === 'paste');
       expect(pasteItem?.disabled).toBe(true);
     });
   });
   ```

#### Integration Tests

1. **Canvas Context Menu** (`ContextMenu.integration.test.tsx`)
   ```typescript
   it('should open canvas context menu on right-click', async () => {
     render(<App />);
     const canvas = screen.getByRole('canvas');

     fireEvent.contextMenu(canvas, { clientX: 200, clientY: 300 });

     expect(await screen.findByText('Paste')).toBeInTheDocument();
     expect(await screen.findByText('Add Shape')).toBeInTheDocument();
   });
   ```

2. **Shape Context Menu** (`ContextMenu.integration.test.tsx`)
   ```typescript
   it('should open shape context menu on shape right-click', async () => {
     render(<TestScene />);
     const shape = await screen.findByTestId('shape-rectangle-1');

     fireEvent.contextMenu(shape, { clientX: 150, clientY: 200 });

     expect(await screen.findByText('Edit Dimensions')).toBeInTheDocument();
     expect(await screen.findByText('Duplicate')).toBeInTheDocument();
     expect(await screen.findByText('Delete')).toBeInTheDocument();
   });
   ```

3. **Menu Action Execution** (`ContextMenu.integration.test.tsx`)
   ```typescript
   it('should execute action and close menu on click', async () => {
     render(<App />);
     const canvas = screen.getByRole('canvas');

     fireEvent.contextMenu(canvas);
     const rectangleItem = await screen.findByText('Rectangle');
     fireEvent.click(rectangleItem);

     expect(useAppStore.getState().currentTool).toBe('rectangle');
     expect(useAppStore.getState().contextMenu.isOpen).toBe(false);
   });
   ```

4. **Submenu Navigation** (`ContextMenu.integration.test.tsx`)
   ```typescript
   it('should open submenu on hover', async () => {
     render(<App />);
     const canvas = screen.getByRole('canvas');

     fireEvent.contextMenu(canvas);
     const addShapeItem = await screen.findByText('Add Shape');
     fireEvent.mouseEnter(addShapeItem);

     expect(await screen.findByText('Rectangle')).toBeVisible();
     expect(await screen.findByText('Circle')).toBeVisible();
   });
   ```

#### Accessibility Tests

1. **Keyboard Navigation** (`ContextMenu.a11y.test.tsx`)
   ```typescript
   it('should close menu on ESC key', async () => {
     render(<App />);
     const canvas = screen.getByRole('canvas');

     fireEvent.contextMenu(canvas);
     expect(await screen.findByText('Paste')).toBeInTheDocument();

     fireEvent.keyDown(document, { key: 'Escape' });
     expect(screen.queryByText('Paste')).not.toBeInTheDocument();
   });
   ```

2. **ARIA Attributes** (`ContextMenu.a11y.test.tsx`)
   ```typescript
   it('should have proper ARIA roles', async () => {
     const { container } = render(<ContextMenu />);
     useAppStore.getState().openContextMenu('canvas', { x: 100, y: 100 });

     const menu = await screen.findByRole('menu');
     expect(menu).toBeInTheDocument();

     const menuItems = screen.getAllByRole('menuitem');
     expect(menuItems.length).toBeGreaterThan(0);
   });
   ```

### Performance Considerations

#### Optimization Strategies
1. **Lazy Rendering**: Only render menu when `isOpen = true`
2. **Memoize Menu Items**: Use `useMemo` for menu item generation
3. **Portal Rendering**: Render outside React tree for better performance
4. **Event Delegation**: Use single event listener for all menu items

#### Memory Management
```typescript
// Clean up event listeners on unmount
useEffect(() => {
  if (!isOpen) return;

  const handleClickOutside = (e: MouseEvent) => { /* ... */ };
  const handleEscape = (e: KeyboardEvent) => { /* ... */ };

  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);

  return () => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
  };
}, [isOpen]);
```

### Security Considerations

- **XSS Prevention**: All text content is escaped by React
- **Event Validation**: Check event targets before executing actions
- **Input Sanitization**: Validate shape IDs before performing operations
- **CORS**: No external requests, client-side only

### Compatibility

#### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Context Menu API**: `onContextMenu` supported in all modern browsers
- **Portal API**: `ReactDOM.createPortal` widely supported

#### Existing Features
- **No Breaking Changes**: All existing functionality preserved
- **Keyboard Shortcuts**: Context menu shows shortcuts for discoverability
- **Toolbar Integration**: Context menu actions complement ribbon toolbar

### Risk Assessment

#### High Risk
- **Z-Index Conflicts**: Menu might appear behind other modals
  - **Mitigation**: Use z-index 9999, higher than keyboard help modal (9999999 is too high)

#### Medium Risk
- **Viewport Overflow**: Menu might render outside viewport
  - **Mitigation**: Bounds checking and repositioning logic

#### Low Risk
- **Performance**: Menu rendering might be slow
  - **Mitigation**: Lazy rendering, memoization, portal rendering

### Rollback Plan

If issues arise:
1. **Feature Flag**: Add `enableContextMenus` flag in config
2. **Graceful Degradation**: Fall back to keyboard shortcuts only
3. **Quick Disable**: Set `contextMenu.isOpen = false` in store

## Constitution Compliance

- ✅ **Article 1**: All styling inline (no CSS files)
- ✅ **Article 2**: TypeScript strict mode, full type safety
- ✅ **Article 3**: Zustand for context menu state
- ✅ **Article 4**: React hooks, proper cleanup in useEffect
- ✅ **Article 5**: Integration with Three.js raycasting
- ✅ **Article 6**: 70%+ test coverage planned
- ✅ **Article 7**: No external API calls, input validation
- ✅ **Article 8**: New files for context menu, edit existing for integration
- ✅ **Article 9**: Canva-style design (rounded, smooth, modern)

## Dependencies

### Existing Code
- `useAppStore.ts`: Store state and actions
- `Icon.tsx`: Icon component for menu items
- `services/keyboardShortcuts.ts`: Shortcut formatting
- `SceneManager.tsx`: Canvas event handling
- `ShapeRenderer.tsx`: Shape event handling

### External Libraries
- **React**: Hooks, Portal API
- **ReactDOM**: `createPortal` for z-index control
- **Zustand**: State management
- **Three.js**: Raycasting for click detection

### New Dependencies
None - all functionality uses existing libraries.

## Timeline Estimate

| Task | Estimated Time |
|------|----------------|
| Type definitions + store state | 0.5 hours |
| ContextMenu component | 1.5 hours |
| ContextMenuItem component | 1 hour |
| Menu items configuration hook | 1.5 hours |
| Integration with canvas/shapes | 1 hour |
| Add new icons to Icon.tsx | 0.5 hours |
| Testing (unit + integration + a11y) | 2 hours |
| **Total** | **8 hours** |

## Success Criteria

- [ ] Context menus work for canvas, shape, and multi-selection
- [ ] All acceptance criteria met from spec.md
- [ ] 70%+ test coverage
- [ ] No z-index conflicts
- [ ] No viewport overflow issues
- [ ] Keyboard shortcuts displayed correctly
- [ ] Proper ARIA attributes for accessibility
- [ ] Submenu navigation works smoothly

---

**Next Steps**: Review this plan, then proceed to task breakdown (tasks.md).
