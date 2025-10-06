/**
 * Keyboard Shortcut Help Overlay
 *
 * Displays all available keyboard shortcuts organized by category.
 * Triggered by pressing '?' or Ctrl+/
 */

import React from 'react';
import type { KeyboardShortcut, ShortcutCategory } from '../types/shortcuts';
import { shortcutManager } from '../services/keyboardShortcuts';
import Icon from './Icon';

interface KeyboardShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryTitles: Record<ShortcutCategory, string> = {
  tools: 'Drawing Tools',
  editing: 'Editing',
  view: 'View Controls',
  alignment: 'Alignment & Distribution',
  selection: 'Selection',
  drawing: 'Drawing Controls',
};

const categoryOrder: ShortcutCategory[] = [
  'tools',
  'drawing',
  'editing',
  'selection',
  'alignment',
  'view',
];

export function KeyboardShortcutHelp({ isOpen, onClose }: KeyboardShortcutHelpProps): React.JSX.Element | null {
  // Set a flag on document.body when modal is open so 3D overlays can hide
  React.useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-keyboard-help-open', 'true');
    } else {
      document.body.removeAttribute('data-keyboard-help-open');
    }

    return () => {
      document.body.removeAttribute('data-keyboard-help-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Get all shortcuts and group by category
  const allShortcuts = shortcutManager.getAll();
  const shortcutsByCategory = categoryOrder.reduce((acc, category) => {
    const shortcuts = allShortcuts.filter(s => s.category === category && s.enabled !== false);
    if (shortcuts.length > 0) {
      acc[category] = shortcuts;
    }
    return acc;
  }, {} as Record<ShortcutCategory, KeyboardShortcut[]>);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999999,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '800px',
          maxHeight: '85vh',
          width: '90%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="keyboard" color="#ffffff" size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                Keyboard Shortcuts
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Speed up your workflow with these shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Icon name="close" color="#6b7280" size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '32px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '32px',
            }}
          >
            {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
              <div key={category}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '16px',
                  }}
                >
                  {categoryTitles[category as ShortcutCategory]}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                      }}
                    >
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        {shortcut.description}
                      </span>
                      <kbd
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#1f2937',
                          fontFamily: 'monospace',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {shortcutManager.formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 32px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Icon name="info" color="#6b7280" size={16} />
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Press <kbd style={{ padding: '2px 6px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px', fontFamily: 'monospace' }}>?</kbd> or <kbd style={{ padding: '2px 6px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px', fontFamily: 'monospace' }}>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
