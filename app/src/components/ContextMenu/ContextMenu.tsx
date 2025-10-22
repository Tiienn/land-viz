import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { ContextMenuItem } from './ContextMenuItem';
import { ContextMenuDivider } from './ContextMenuDivider';
import { useContextMenuItems } from './useContextMenuItems';

export const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu } = useAppStore();
  const { isOpen, type, position, targetShapeId, targetTextId } = contextMenu; // Phase 7: Added targetTextId

  const menuItems = useContextMenuItems(type, targetShapeId, targetTextId); // Phase 7: Pass targetTextId
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
