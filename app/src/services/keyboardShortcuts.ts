/**
 * Centralized keyboard shortcut management system
 *
 * Provides a registry for keyboard shortcuts with conflict detection,
 * platform-specific handling (Ctrl vs. Cmd), and input field awareness.
 */

import type { KeyboardShortcut, ShortcutConfig } from '../types/shortcuts';

class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private config: ShortcutConfig = {
    ignoreWhenInputFocused: true,
    preventDefault: true,
    stopPropagation: false,
  };

  /**
   * Generate a unique key for a shortcut based on modifiers and key
   */
  private generateShortcutKey(shortcut: Omit<KeyboardShortcut, 'id' | 'description' | 'category' | 'action'>): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());

    return parts.join('+');
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.generateShortcutKey(shortcut);

    if (this.shortcuts.has(key)) {
      console.warn(`Shortcut conflict detected: ${key} is already registered`);
    }

    this.shortcuts.set(key, { ...shortcut, enabled: shortcut.enabled ?? true });
  }

  /**
   * Unregister a keyboard shortcut by ID
   */
  unregister(id: string): void {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (shortcut.id === id) {
        this.shortcuts.delete(key);
        break;
      }
    }
  }

  /**
   * Clear all shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
  }

  /**
   * Get all registered shortcuts
   */
  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getByCategory(category: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(s => s.category === category);
  }

  /**
   * Check if target element is an input field
   */
  private isInputField(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;

    const tagName = target.tagName;
    const contentEditable = target.contentEditable === 'true';

    return tagName === 'INPUT' || tagName === 'TEXTAREA' || contentEditable;
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    // Check if we should ignore this event (e.g., input field focused)
    if (this.config.ignoreWhenInputFocused && this.isInputField(event.target)) {
      return false;
    }

    // Build the key combination from the event
    const parts: string[] = [];
    const eventKey = event.key.toLowerCase();

    // Special characters that are already "shifted" - don't include Shift modifier
    const shiftedChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '?'];
    const isShiftedChar = shiftedChars.includes(event.key);

    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey && !isShiftedChar) parts.push('shift'); // Only add shift if not a shifted character
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    parts.push(eventKey);

    const key = parts.join('+');

    // Find matching shortcut
    const shortcut = this.shortcuts.get(key);

    if (shortcut && shortcut.enabled !== false) {
      // Execute the action
      if (shortcut.preventDefault ?? this.config.preventDefault) {
        event.preventDefault();
      }

      if (this.config.stopPropagation) {
        event.stopPropagation();
      }

      shortcut.action();
      return true;
    }

    return false;
  }

  /**
   * Update global config
   */
  setConfig(config: Partial<ShortcutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Format shortcut for display (e.g., "Ctrl+D" or "Cmd+D" on Mac)
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const parts: string[] = [];

    if (shortcut.ctrl || shortcut.meta) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shift) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.alt) {
      parts.push(isMac ? '⌥' : 'Alt');
    }

    // Format key name
    const keyName = shortcut.key.length === 1
      ? shortcut.key.toUpperCase()
      : shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1);

    parts.push(keyName);

    return parts.join('+');
  }
}

// Export singleton instance
export const shortcutManager = new KeyboardShortcutManager();
