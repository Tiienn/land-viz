# Task Breakdown: Context Menu System

**Spec**: 012-context-menus
**Total Estimated Time**: 8 hours

---

## Phase 1: Type Definitions & Store Setup (30 minutes)

### Task 1.1: Create Context Menu Type Definitions
**File**: `app/src/types/contextMenu.ts` (new file)
**Estimated Time**: 15 minutes

```typescript
/**
 * Context Menu Type Definitions
 * Defines types for the context menu system
 */

export type ContextMenuType = 'canvas' | 'shape' | 'multi-selection';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  disabledReason?: string;
  destructive?: boolean; // For delete actions (red color)
  action?: () => void;
  submenu?: MenuItem[];
  type?: 'item' | 'divider';
}

export interface ContextMenuState {
  isOpen: boolean;
  type: ContextMenuType | null;
  position: { x: number; y: number };
  targetShapeId?: string | null;
}
```

**Validation**:
- [ ] File compiles without TypeScript errors
- [ ] Types exported correctly

---

### Task 1.2: Add Context Menu State to Store
**File**: `app/src/store/useAppStore.ts`
**Estimated Time**: 15 minutes
**Location**: Add to interface around line 200

```typescript
import type { ContextMenuState, ContextMenuType } from '../types/contextMenu';

// Add to AppStore interface (around line 200)
interface AppStore {
  // ... existing state ...

  // Context menu state
  contextMenu: ContextMenuState;

  // Context menu actions
  openContextMenu: (
    type: ContextMenuType,
    position: { x: number; y: number },
    targetShapeId?: string
  ) => void;
  closeContextMenu: () => void;
}

// Initialize in createSlice (around line 500)
const createAppSlice = (set: SetState, get: GetState) => ({
  // ... existing state ...

  contextMenu: {
    isOpen: false,
    type: null,
    position: { x: 0, y: 0 },
    targetShapeId: null,
  },

  // Add actions around line 2900
  openContextMenu: (type, position, targetShapeId) => {
    set({
      contextMenu: {
        isOpen: true,
        type,
        position,
        targetShapeId: targetShapeId || null,
      },
    });
  },

  closeContextMenu: () => {
    set({
      contextMenu: {
        isOpen: false,
        type: null,
        position: { x: 0, y: 0 },
        targetShapeId: null,
      },
    });
  },
});
```

**Validation**:
- [ ] Store compiles without errors
- [ ] Actions work correctly

**Test**:
```typescript
// Test in browser console
const store = useAppStore.getState();
store.openContextMenu('canvas', { x: 100, y: 200 });
console.log(store.contextMenu.isOpen); // Should be true
store.closeContextMenu();
console.log(store.contextMenu.isOpen); // Should be false
```

---

## Phase 2: Context Menu Components (2 hours)

### Task 2.1: Create Context Menu Main Component
**File**: `app/src/components/ContextMenu/ContextMenu.tsx` (new file)
**Estimated Time**: 45 minutes

```tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { ContextMenuItem } from './ContextMenuItem';
import { ContextMenuDivider } from './ContextMenuDivider';
import { useContextMenuItems } from './useContextMenuItems';

export const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu } = useAppStore();
  const { isOpen, type, position, targetShapeId } = contextMenu;

  const menuItems = useContextMenuItems(type, targetShapeId);
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontally if overflow
    if (x + menuRect.width > viewportWidth) {
      x = Math.max(10, viewportWidth - menuRect.width - 10);
    }

    // Adjust vertically if overflow
    if (y + menuRect.height > viewportHeight) {
      y = Math.max(10, viewportHeight - menuRect.height - 10);
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

    // Use timeout to avoid immediate close on open
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, closeContextMenu]);

  // Close on ESC key
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
      role="menu"
      aria-orientation="vertical"
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
        fontFamily: '"Nunito Sans", sans-serif',
      }}
    >
      {menuItems.map((item, index) =>
        item.type === 'divider' ? (
          <ContextMenuDivider key={`divider-${index}`} />
        ) : (
          <ContextMenuItem key={item.id} item={item} onClose={closeContextMenu} />
        )
      )}
    </div>,
    document.body
  );
};

export default ContextMenu;
```

**Validation**:
- [ ] Component compiles without errors
- [ ] Menu appears at cursor position
- [ ] Menu stays within viewport bounds
- [ ] Clicks outside close menu
- [ ] ESC key closes menu

---

### Task 2.2: Create Context Menu Item Component
**File**: `app/src/components/ContextMenu/ContextMenuItem.tsx` (new file)
**Estimated Time**: 45 minutes

```tsx
import React, { useState, useRef, useEffect } from 'react';
import Icon from '../Icon';
import type { MenuItem } from '@/types/contextMenu';

interface ContextMenuItemProps {
  item: MenuItem;
  onClose: () => void;
}

export const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ item, onClose }) => {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

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
    if (item.submenu && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
        left: rect.right + 4,
      });
      setShowSubmenu(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (item.submenu) {
      // Keep submenu open briefly to allow mouse movement
      setTimeout(() => setShowSubmenu(false), 300);
    }
  };

  return (
    <>
      <div
        ref={itemRef}
        role="menuitem"
        aria-disabled={item.disabled}
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
          <Icon
            name={item.icon}
            size={16}
            color={item.destructive ? '#ef4444' : '#6b7280'}
          />
        )}

        {/* Label */}
        <span
          style={{
            marginLeft: item.icon ? '8px' : '0',
            fontSize: '14px',
            color: item.destructive ? '#ef4444' : '#1f2937',
            flex: 1,
            fontWeight: '400',
          }}
        >
          {item.label}
        </span>

        {/* Shortcut or Submenu Arrow */}
        {item.shortcut && !item.submenu && (
          <kbd
            style={{
              marginLeft: '16px',
              padding: '2px 6px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '3px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#9ca3af',
            }}
          >
            {item.shortcut}
          </kbd>
        )}
        {item.submenu && (
          <Icon
            name="chevron-right"
            size={12}
            color="#9ca3af"
            style={{ marginLeft: '8px' }}
          />
        )}
      </div>

      {/* Submenu */}
      {item.submenu && showSubmenu && (
        <div
          role="menu"
          aria-orientation="vertical"
          style={{
            position: 'fixed',
            top: submenuPosition.top,
            left: submenuPosition.left,
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            padding: '8px 0',
            minWidth: '200px',
            zIndex: 10000,
          }}
          onMouseEnter={() => setShowSubmenu(true)}
          onMouseLeave={() => setShowSubmenu(false)}
        >
          {item.submenu.map((subItem, index) =>
            subItem.type === 'divider' ? (
              <ContextMenuDivider key={`divider-${index}`} />
            ) : (
              <ContextMenuItem key={subItem.id} item={subItem} onClose={onClose} />
            )
          )}
        </div>
      )}
    </>
  );
};

export default ContextMenuItem;
```

**Validation**:
- [ ] Menu items render correctly
- [ ] Icons and shortcuts display properly
- [ ] Hover states work
- [ ] Disabled items show tooltip
- [ ] Destructive items are red
- [ ] Submenus open on hover

---

### Task 2.3: Create Context Menu Divider Component
**File**: `app/src/components/ContextMenu/ContextMenuDivider.tsx` (new file)
**Estimated Time**: 5 minutes

```tsx
import React from 'react';

export const ContextMenuDivider: React.FC = () => {
  return (
    <div
      role="separator"
      style={{
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '4px 0',
      }}
    />
  );
};

export default ContextMenuDivider;
```

**Validation**:
- [ ] Divider renders as a line
- [ ] Proper spacing above and below

---

### Task 2.4: Create Menu Items Configuration Hook
**File**: `app/src/components/ContextMenu/useContextMenuItems.ts` (new file)
**Estimated Time**: 25 minutes

```typescript
import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { MenuItem } from '@/types/contextMenu';
import type { ContextMenuType } from '@/types/contextMenu';

export const useContextMenuItems = (
  type: ContextMenuType | null,
  targetShapeId?: string | null
): MenuItem[] => {
  const { shapes, clipboard, selectedShapeIds, setCurrentTool } = useAppStore();

  return useMemo(() => {
    if (!type) return [];

    if (type === 'canvas') {
      return [
        {
          id: 'paste',
          label: 'Paste',
          icon: 'clipboard',
          shortcut: 'Ctrl+V',
          disabled: !clipboard,
          disabledReason: 'No shape to paste',
          action: () => {
            // TODO: Implement paste functionality
            console.log('Paste action');
          },
        },
        { type: 'divider' },
        {
          id: 'add-shape',
          label: 'Add Shape',
          icon: 'add',
          submenu: [
            {
              id: 'add-rectangle',
              label: 'Rectangle',
              icon: 'rectangle',
              shortcut: 'R',
              action: () => setCurrentTool('rectangle'),
            },
            {
              id: 'add-circle',
              label: 'Circle',
              icon: 'circle',
              shortcut: 'C',
              action: () => setCurrentTool('circle'),
            },
            {
              id: 'add-polyline',
              label: 'Polyline',
              icon: 'polyline',
              shortcut: 'P',
              action: () => setCurrentTool('polyline'),
            },
            {
              id: 'add-line',
              label: 'Line',
              icon: 'line',
              shortcut: 'L',
              action: () => setCurrentTool('line'),
            },
          ],
        },
        { type: 'divider' },
        {
          id: 'view',
          label: 'View',
          icon: 'view',
          submenu: [
            {
              id: 'reset-camera',
              label: 'Reset Camera',
              shortcut: '0',
              action: () => {
                // TODO: Implement reset camera
                console.log('Reset camera');
              },
            },
            {
              id: 'toggle-2d-3d',
              label: 'Toggle 2D/3D',
              shortcut: 'V',
              action: () => {
                // TODO: Implement toggle 2D/3D
                console.log('Toggle 2D/3D');
              },
            },
          ],
        },
      ];
    }

    if (type === 'shape') {
      const targetShape = shapes.find((s) => s.id === targetShapeId);

      return [
        {
          id: 'duplicate',
          label: 'Duplicate',
          icon: 'copy',
          shortcut: 'Ctrl+D',
          action: () => {
            // TODO: Implement duplicate
            console.log('Duplicate shape:', targetShapeId);
          },
        },
        { type: 'divider' },
        {
          id: 'lock',
          label: targetShape?.locked ? 'Unlock' : 'Lock Position',
          icon: targetShape?.locked ? 'unlock' : 'lock',
          action: () => {
            // TODO: Implement lock toggle
            console.log('Toggle lock:', targetShapeId);
          },
        },
        {
          id: 'properties',
          label: 'Properties',
          icon: 'settings',
          action: () => {
            // TODO: Open properties panel
            console.log('Open properties:', targetShapeId);
          },
        },
        { type: 'divider' },
        {
          id: 'delete',
          label: 'Delete',
          icon: 'trash',
          shortcut: 'Del',
          destructive: true,
          action: () => {
            // TODO: Implement delete
            console.log('Delete shape:', targetShapeId);
          },
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
          action: () => {
            // TODO: Implement group
            console.log('Group shapes:', selectedShapeIds);
          },
        },
        { type: 'divider' },
        {
          id: 'align',
          label: 'Align',
          icon: 'align',
          submenu: [
            {
              id: 'align-left',
              label: 'Left',
              icon: 'align-left',
              shortcut: 'Ctrl+L',
              action: () => console.log('Align left'),
            },
            {
              id: 'align-right',
              label: 'Right',
              icon: 'align-right',
              shortcut: 'Ctrl+R',
              action: () => console.log('Align right'),
            },
            {
              id: 'align-top',
              label: 'Top',
              icon: 'align-top',
              shortcut: 'Ctrl+T',
              action: () => console.log('Align top'),
            },
            {
              id: 'align-bottom',
              label: 'Bottom',
              icon: 'align-bottom',
              shortcut: 'Ctrl+B',
              action: () => console.log('Align bottom'),
            },
          ],
        },
        {
          id: 'distribute',
          label: 'Distribute',
          icon: 'distribute',
          submenu: [
            {
              id: 'distribute-h',
              label: 'Horizontally',
              icon: 'distribute-h',
              shortcut: 'Ctrl+H',
              action: () => console.log('Distribute horizontally'),
            },
            {
              id: 'distribute-v',
              label: 'Vertically',
              icon: 'distribute-v',
              shortcut: 'Alt+V',
              action: () => console.log('Distribute vertically'),
            },
          ],
        },
        { type: 'divider' },
        {
          id: 'delete-all',
          label: 'Delete All',
          icon: 'trash',
          shortcut: 'Del',
          destructive: true,
          action: () => {
            // TODO: Implement delete all
            console.log('Delete all shapes:', selectedShapeIds);
          },
        },
      ];
    }

    return [];
  }, [type, targetShapeId, shapes, clipboard, selectedShapeIds, setCurrentTool]);
};
```

**Validation**:
- [ ] Hook returns correct items for each type
- [ ] Disabled states work correctly
- [ ] Submenus are structured properly

---

## Phase 3: Add New Icons (30 minutes)

### Task 3.1: Add Context Menu Icons to Icon Component
**File**: `app/src/components/Icon.tsx`
**Estimated Time**: 30 minutes
**Location**: Add new icon cases

```typescript
// Add these new icon cases to the switch statement

case 'copy':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

case 'trash':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );

case 'lock':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

case 'unlock':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );

case 'group':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

case 'align-left':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  );

case 'align-right':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="12" x2="9" y2="12" />
      <line x1="21" y1="18" x2="6" y2="18" />
    </svg>
  );

case 'align-top':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <line x1="6" y1="3" x2="6" y2="21" transform="rotate(90 12 12)" />
      <line x1="12" y1="3" x2="12" y2="15" transform="rotate(90 12 12)" />
      <line x1="18" y1="3" x2="18" y2="18" transform="rotate(90 12 12)" />
    </svg>
  );

case 'align-bottom':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <line x1="6" y1="21" x2="6" y2="3" transform="rotate(90 12 12)" />
      <line x1="12" y1="21" x2="12" y2="9" transform="rotate(90 12 12)" />
      <line x1="18" y1="21" x2="18" y2="6" transform="rotate(90 12 12)" />
    </svg>
  );

case 'chevron-right':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

case 'clipboard':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );

case 'add':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

case 'view':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

case 'distribute-h':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <rect x="4" y="8" width="4" height="8" />
      <rect x="10" y="8" width="4" height="8" />
      <rect x="16" y="8" width="4" height="8" />
    </svg>
  );

case 'distribute-v':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <rect x="8" y="4" width="8" height="4" />
      <rect x="8" y="10" width="8" height="4" />
      <rect x="8" y="16" width="8" height="4" />
    </svg>
  );
```

**Validation**:
- [ ] All icons render correctly
- [ ] Icons have proper size and color
- [ ] Icons are visually consistent

---

## Phase 4: Canvas and Shape Integration (1 hour)

### Task 4.1: Add Canvas Context Menu Handler
**File**: `app/src/components/Scene/SceneManager.tsx`
**Estimated Time**: 20 minutes
**Location**: Add handler around line 80

```typescript
import { useAppStore } from '@/store/useAppStore';

// Add inside SceneManager component
const handleCanvasContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
  event.preventDefault();

  const { openContextMenu } = useAppStore.getState();

  // Open canvas context menu
  openContextMenu('canvas', {
    x: event.clientX,
    y: event.clientY,
  });
}, []);

// Add onContextMenu to the container div
return (
  <div
    style={{ width: '100%', height: '100%', position: 'relative' }}
    onContextMenu={handleCanvasContextMenu}
  >
    <Canvas>
      {/* ... existing canvas content ... */}
    </Canvas>
  </div>
);
```

**Validation**:
- [ ] Right-click on canvas opens menu
- [ ] Menu appears at cursor position
- [ ] Canvas menu items are shown

---

### Task 4.2: Add Shape Context Menu Handler
**File**: `app/src/components/Scene/ShapeRenderer.tsx`
**Estimated Time**: 20 minutes
**Location**: Add handler to each shape mesh

```typescript
import { useAppStore } from '@/store/useAppStore';
import type { ThreeEvent } from '@react-three/fiber';

// Add inside ShapeRenderer component
const handleShapeContextMenu = useCallback(
  (event: ThreeEvent<MouseEvent>, shapeId: string) => {
    event.stopPropagation();

    const { selectedShapeIds, openContextMenu } = useAppStore.getState();

    // Determine menu type based on selection
    const menuType =
      selectedShapeIds.length > 1 && selectedShapeIds.includes(shapeId)
        ? 'multi-selection'
        : 'shape';

    openContextMenu(menuType, {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
    }, shapeId);
  },
  []
);

// Add onContextMenu to mesh components
<mesh
  onClick={handleShapeClick}
  onContextMenu={(e) => handleShapeContextMenu(e, shape.id)}
  onPointerOver={handlePointerOver}
  onPointerOut={handlePointerOut}
>
  {/* ... mesh content ... */}
</mesh>
```

**Validation**:
- [ ] Right-click on shape opens shape menu
- [ ] Right-click on selected shape in multi-selection opens multi-selection menu
- [ ] Menu items are appropriate for context

---

### Task 4.3: Add Context Menu to App
**File**: `app/src/App.tsx`
**Estimated Time**: 10 minutes
**Location**: Add to render tree

```typescript
import { ContextMenu } from './components/ContextMenu/ContextMenu';

// Add to App component render (near KeyboardShortcutHelp)
return (
  <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
    {/* ... existing UI ... */}

    {/* Context Menu */}
    <ContextMenu />

    {/* Keyboard Shortcut Help */}
    <KeyboardShortcutHelp isOpen={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
  </div>
);
```

**Validation**:
- [ ] Context menu renders in app
- [ ] No layout issues
- [ ] Menu appears above other content

---

### Task 4.4: Prevent Default Browser Context Menu
**File**: `app/src/App.tsx`
**Estimated Time**: 10 minutes
**Location**: Add global handler

```typescript
// Add useEffect to prevent browser context menu globally
useEffect(() => {
  const preventContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  document.addEventListener('contextmenu', preventContextMenu);

  return () => {
    document.removeEventListener('contextmenu', preventContextMenu);
  };
}, []);
```

**Validation**:
- [ ] Browser context menu never appears
- [ ] Custom context menu always shows

---

## Phase 5: Connect Actions (1.5 hours)

### Task 5.1: Implement Canvas Menu Actions
**File**: `app/src/components/ContextMenu/useContextMenuItems.ts`
**Estimated Time**: 30 minutes

Update the canvas menu actions with real implementations:

```typescript
// Replace TODO comments with real implementations

// Paste action
action: () => {
  const { clipboard, pasteShape } = useAppStore.getState();
  if (clipboard) {
    pasteShape();
  }
},

// Reset camera action
action: () => {
  const { resetCamera } = useAppStore.getState();
  resetCamera();
},

// Toggle 2D/3D action
action: () => {
  const { is2DMode, toggle2D3D } = useAppStore.getState();
  toggle2D3D();
},
```

**Validation**:
- [ ] Paste works when clipboard has data
- [ ] Tool switching works
- [ ] View actions work

---

### Task 5.2: Implement Shape Menu Actions
**File**: `app/src/components/ContextMenu/useContextMenuItems.ts`
**Estimated Time**: 30 minutes

Update the shape menu actions:

```typescript
// Duplicate action
action: () => {
  const { duplicateShape } = useAppStore.getState();
  if (targetShapeId) {
    duplicateShape(targetShapeId);
  }
},

// Lock toggle action
action: () => {
  const { toggleShapeLock } = useAppStore.getState();
  if (targetShapeId) {
    toggleShapeLock(targetShapeId);
  }
},

// Delete action
action: () => {
  const { deleteShape } = useAppStore.getState();
  if (targetShapeId) {
    deleteShape(targetShapeId);
  }
},
```

**Validation**:
- [ ] Duplicate creates copy of shape
- [ ] Lock prevents shape movement
- [ ] Delete removes shape

---

### Task 5.3: Implement Multi-Selection Menu Actions
**File**: `app/src/components/ContextMenu/useContextMenuItems.ts`
**Estimated Time**: 30 minutes

Update the multi-selection menu actions:

```typescript
// Group action
action: () => {
  const { groupShapes } = useAppStore.getState();
  groupShapes(selectedShapeIds);
},

// Align actions
action: () => {
  const { alignShapes } = useAppStore.getState();
  alignShapes(selectedShapeIds, 'left');
},
// ... same for right, top, bottom, center-h, center-v

// Distribute actions
action: () => {
  const { distributeShapes } = useAppStore.getState();
  distributeShapes(selectedShapeIds, 'horizontal');
},
// ... same for vertical

// Delete all action
action: () => {
  const { deleteShapes } = useAppStore.getState();
  deleteShapes(selectedShapeIds);
},
```

**Validation**:
- [ ] Group creates group from selection
- [ ] Align moves shapes correctly
- [ ] Distribute spaces shapes evenly
- [ ] Delete all removes all selected shapes

---

## Phase 6: Testing (2 hours)

### Task 6.1: Unit Tests - Store Actions
**File**: `app/src/store/__tests__/useAppStore.contextMenu.test.ts` (new file)
**Estimated Time**: 30 minutes

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('Context Menu - Store Actions', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  describe('openContextMenu', () => {
    it('should open canvas context menu', () => {
      const store = useAppStore.getState();
      store.openContextMenu('canvas', { x: 100, y: 200 });

      expect(store.contextMenu.isOpen).toBe(true);
      expect(store.contextMenu.type).toBe('canvas');
      expect(store.contextMenu.position).toEqual({ x: 100, y: 200 });
    });

    it('should open shape context menu with target', () => {
      const store = useAppStore.getState();
      store.openContextMenu('shape', { x: 150, y: 250 }, 'shape-1');

      expect(store.contextMenu.isOpen).toBe(true);
      expect(store.contextMenu.type).toBe('shape');
      expect(store.contextMenu.targetShapeId).toBe('shape-1');
    });
  });

  describe('closeContextMenu', () => {
    it('should close context menu', () => {
      const store = useAppStore.getState();
      store.openContextMenu('canvas', { x: 100, y: 200 });
      store.closeContextMenu();

      expect(store.contextMenu.isOpen).toBe(false);
      expect(store.contextMenu.type).toBe(null);
    });
  });
});
```

**Validation**:
- [ ] All tests pass
- [ ] 100% coverage for context menu actions

---

### Task 6.2: Integration Tests - Menu Rendering
**File**: `app/src/components/ContextMenu/__tests__/ContextMenu.test.tsx` (new file)
**Estimated Time**: 45 minutes

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContextMenu } from '../ContextMenu';
import { useAppStore } from '../../../store/useAppStore';

describe('Context Menu - Integration', () => {
  it('should render canvas context menu', () => {
    const store = useAppStore.getState();
    store.openContextMenu('canvas', { x: 100, y: 200 });

    render(<ContextMenu />);

    expect(screen.getByText('Paste')).toBeInTheDocument();
    expect(screen.getByText('Add Shape')).toBeInTheDocument();
  });

  it('should close menu on outside click', async () => {
    const store = useAppStore.getState();
    store.openContextMenu('canvas', { x: 100, y: 200 });

    render(<ContextMenu />);

    fireEvent.click(document.body);

    expect(store.contextMenu.isOpen).toBe(false);
  });

  it('should close menu on ESC key', () => {
    const store = useAppStore.getState();
    store.openContextMenu('canvas', { x: 100, y: 200 });

    render(<ContextMenu />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(store.contextMenu.isOpen).toBe(false);
  });

  it('should execute action and close menu on item click', async () => {
    const store = useAppStore.getState();
    store.openContextMenu('canvas', { x: 100, y: 200 });

    render(<ContextMenu />);

    const addShapeItem = screen.getByText('Add Shape');
    fireEvent.mouseEnter(addShapeItem);

    const rectangleItem = await screen.findByText('Rectangle');
    fireEvent.click(rectangleItem);

    expect(store.currentTool).toBe('rectangle');
    expect(store.contextMenu.isOpen).toBe(false);
  });
});
```

**Validation**:
- [ ] All integration tests pass
- [ ] Menu renders correctly
- [ ] Actions execute properly

---

### Task 6.3: Accessibility Tests
**File**: `app/src/components/ContextMenu/__tests__/ContextMenu.a11y.test.tsx` (new file)
**Estimated Time**: 15 minutes

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ContextMenu } from '../ContextMenu';
import { useAppStore } from '../../../store/useAppStore';

expect.extend(toHaveNoViolations);

describe('Context Menu - Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const store = useAppStore.getState();
    store.openContextMenu('canvas', { x: 100, y: 200 });

    const { container } = render(<ContextMenu />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA roles', () => {
    const store = useAppStore.getState();
    store.openContextMenu('canvas', { x: 100, y: 200 });

    render(<ContextMenu />);

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThan(0);
  });
});
```

**Validation**:
- [ ] No accessibility violations
- [ ] Proper ARIA attributes

---

### Task 6.4: Manual Testing Checklist
**Estimated Time**: 30 minutes

#### Basic Functionality
- [ ] Right-click on canvas → canvas menu appears
- [ ] Right-click on shape → shape menu appears
- [ ] Right-click on multi-selection → multi-selection menu appears
- [ ] Menu appears at cursor position
- [ ] Menu stays within viewport

#### Visual Design
- [ ] Menu has rounded corners (8px)
- [ ] Menu has shadow
- [ ] Items have hover state
- [ ] Disabled items are grayed out
- [ ] Destructive items are red
- [ ] Icons are visible and aligned

#### Interactions
- [ ] Click item → executes action
- [ ] Click outside → closes menu
- [ ] Press ESC → closes menu
- [ ] Hover over submenu parent → submenu opens
- [ ] Hover away → submenu closes (with delay)

#### Actions
- [ ] Paste works (when clipboard has data)
- [ ] Add Shape switches tools
- [ ] Duplicate creates copy
- [ ] Lock prevents movement
- [ ] Delete removes shape
- [ ] Align moves shapes correctly
- [ ] Distribute spaces evenly

#### Edge Cases
- [ ] Menu repositions if near viewport edge
- [ ] Disabled items show tooltip
- [ ] Submenu positions correctly
- [ ] Browser context menu never appears

---

## Phase 7: Performance & Polish (30 minutes)

### Task 7.1: Optimize Menu Rendering
**File**: `app/src/components/ContextMenu/useContextMenuItems.ts`
**Estimated Time**: 15 minutes

```typescript
// Add useMemo to expensive operations
const menuItems = useMemo(() => {
  // ... existing menu generation logic ...
}, [type, targetShapeId, shapes.length, clipboard, selectedShapeIds.length]);
```

**Validation**:
- [ ] Menu opens instantly (<50ms)
- [ ] No performance regression

---

### Task 7.2: Add Loading States (if needed)
**File**: `app/src/components/ContextMenu/ContextMenuItem.tsx`
**Estimated Time**: 15 minutes

```typescript
// Add loading state for async actions
const [isLoading, setIsLoading] = useState(false);

const handleClick = async (e: React.MouseEvent) => {
  if (item.disabled || isLoading) return;

  setIsLoading(true);
  try {
    await item.action?.();
  } finally {
    setIsLoading(false);
    onClose();
  }
};
```

**Validation**:
- [ ] Loading state shows for async actions
- [ ] No double-clicks during loading

---

## Final Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console errors in browser
- [ ] Code follows existing patterns
- [ ] Comments explain complex logic
- [ ] No duplicate code

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Accessibility tests pass
- [ ] Manual testing checklist complete

### Documentation
- [ ] Code comments added
- [ ] CLAUDE.md updated

### Constitution Compliance
- [ ] Article 1: All styles inline ✓
- [ ] Article 2: TypeScript strict mode ✓
- [ ] Article 3: Zustand state management ✓
- [ ] Article 4: React best practices ✓
- [ ] Article 6: 70%+ test coverage
- [ ] Article 8: New files for context menu, edit existing for integration ✓
- [ ] Article 9: Canva-inspired visuals ✓

### User Acceptance
- [ ] Meets all acceptance criteria in spec
- [ ] No breaking changes
- [ ] Intuitive and easy to use
- [ ] Visually consistent with app

---

## Implementation Complete ✅

**Status**: Ready to begin implementation

### Estimated Timeline

| Phase | Time |
|-------|------|
| Phase 1: Type Definitions & Store | 30 min |
| Phase 2: Context Menu Components | 2 hours |
| Phase 3: Add New Icons | 30 min |
| Phase 4: Canvas & Shape Integration | 1 hour |
| Phase 5: Connect Actions | 1.5 hours |
| Phase 6: Testing | 2 hours |
| Phase 7: Performance & Polish | 30 min |
| **Total** | **8 hours** |

---

**Ready to implement!** Start with Phase 1 and proceed sequentially.
