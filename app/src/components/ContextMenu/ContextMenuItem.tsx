import React, { useState, useRef, useEffect } from 'react';
import Icon from '../Icon';
import type { MenuItem } from '@/types/contextMenu';
import { ContextMenuDivider } from './ContextMenuDivider';

interface ContextMenuItemProps {
  item: MenuItem;
  onClose: () => void;
}

export const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ item, onClose }) => {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (item.submenu && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
        left: rect.right + 4,
      });
      setShowSubmenu(true);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    setIsHovered(false);

    if (item.submenu) {
      // Only close if not moving to submenu
      // Add a delay to allow smooth mouse movement
      closeTimeoutRef.current = setTimeout(() => {
        setShowSubmenu(false);
      }, 200);
    }
  };

  const handleSubmenuMouseEnter = () => {
    // Cancel close timeout when entering submenu
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowSubmenu(true);
  };

  const handleSubmenuMouseLeave = () => {
    // Close submenu when leaving it
    setShowSubmenu(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

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
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
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
