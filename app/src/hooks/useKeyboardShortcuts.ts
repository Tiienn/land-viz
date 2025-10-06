/**
 * React hook for keyboard shortcuts
 *
 * Automatically registers shortcuts on mount and unregisters on unmount.
 * Provides helper functions for common shortcut patterns.
 */

import { useEffect } from 'react';
import { shortcutManager } from '../services/keyboardShortcuts';
import type { KeyboardShortcut } from '../types/shortcuts';

/**
 * Register keyboard shortcuts for a component
 *
 * @example
 * useKeyboardShortcuts([
 *   {
 *     id: 'save',
 *     key: 's',
 *     ctrl: true,
 *     description: 'Save document',
 *     category: 'editing',
 *     action: () => save()
 *   }
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  useEffect(() => {
    // Register all shortcuts
    shortcuts.forEach(shortcut => {
      shortcutManager.register(shortcut);
    });

    // Cleanup: unregister shortcuts when component unmounts
    return () => {
      shortcuts.forEach(shortcut => {
        shortcutManager.unregister(shortcut.id);
      });
    };
  }, []); // Empty deps - only register once on mount
}

/**
 * Hook to attach keyboard event listener to document
 */
export function useKeyboardShortcutListener(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcutManager.handleKeyDown(event);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

/**
 * Get all registered shortcuts (useful for help overlay)
 */
export function useShortcutList(): KeyboardShortcut[] {
  return shortcutManager.getAll();
}

/**
 * Format shortcut for display
 */
export function useShortcutFormatter() {
  return (shortcut: KeyboardShortcut): string => {
    return shortcutManager.formatShortcut(shortcut);
  };
}
