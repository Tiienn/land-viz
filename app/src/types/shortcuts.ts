/**
 * Keyboard shortcut system types
 */

export type ShortcutCategory =
  | 'tools'
  | 'editing'
  | 'view'
  | 'alignment'
  | 'selection'
  | 'drawing';

export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Command key on Mac
  description: string;
  category: ShortcutCategory;
  action: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

export interface ShortcutGroup {
  category: ShortcutCategory;
  title: string;
  shortcuts: KeyboardShortcut[];
}

export interface ShortcutConfig {
  ignoreWhenInputFocused?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}
