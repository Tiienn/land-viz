/**
 * Context Menu Type Definitions
 * Defines types for the context menu system
 */

export type ContextMenuType = 'canvas' | 'shape' | 'multi-selection' | 'text';

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
  targetTextId?: string | null; // Phase 7: Support for text context menu
}
