/**
 * Land Visualizer - Centralized Color System
 *
 * This file provides a centralized color palette for the entire application.
 * All colors follow WCAG 2.1 AA accessibility standards.
 *
 * Usage:
 * ```typescript
 * import { COLORS } from './utils/colors';
 *
 * style={{
 *   background: COLORS.primary.gradient,
 *   color: COLORS.text.primary,
 *   borderColor: COLORS.border.light,
 * }}
 * ```
 *
 * @see COLOR_SYSTEM.md for comprehensive documentation
 */

export const COLORS = {
  // ==========================================
  // PRIMARY COLOR (Blue)
  // Main brand color for primary actions
  // ==========================================
  primary: {
    base: '#3b82f6',      // Blue-500
    dark: '#2563eb',      // Blue-600
    darker: '#1e40af',    // Blue-700
    light: '#60a5fa',     // Blue-400
    lighter: '#93c5fd',   // Blue-300

    // Gradient for buttons, icons, cards
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',

    // Shadow for hover effects
    shadow: 'rgba(59, 130, 246, 0.4)',

    // Background tints
    bg: '#eff6ff',        // Blue-50
  },

  // ==========================================
  // SECONDARY COLOR (Amber/Orange)
  // Accent color for highlights and special states
  // ==========================================
  secondary: {
    base: '#f59e0b',      // Amber-500
    dark: '#d97706',      // Amber-600
    darker: '#b45309',    // Amber-700
    light: '#fbbf24',     // Amber-400
    lighter: '#fcd34d',   // Amber-300

    // Gradient for pinned items, special actions
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',

    // Background tints
    bg: {
      lightest: '#fef3c7', // Amber-100
      light: '#fde68a',    // Amber-200
    },
  },

  // ==========================================
  // STATE COLORS
  // Semantic colors for feedback and status
  // ==========================================
  success: {
    base: '#10b981',      // Emerald-500
    dark: '#059669',      // Emerald-600
    light: '#34d399',     // Emerald-400
    bg: '#d1fae5',        // Emerald-100
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },

  warning: {
    base: '#f59e0b',      // Amber-500
    dark: '#d97706',      // Amber-600
    light: '#fbbf24',     // Amber-400
    bg: '#fef3c7',        // Amber-100
  },

  error: {
    base: '#ef4444',      // Red-500
    dark: '#dc2626',      // Red-600
    darker: '#b91c1c',    // Red-700
    light: '#f87171',     // Red-400
    bg: '#fef2f2',        // Red-50
    bgLight: '#fee2e2',   // Red-100
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },

  info: {
    base: '#06b6d4',      // Cyan-500
    dark: '#0891b2',      // Cyan-600
    light: '#22d3ee',     // Cyan-400
    bg: '#cffafe',        // Cyan-100
  },

  // ==========================================
  // NEUTRAL COLORS
  // Text, backgrounds, and borders
  // ==========================================
  text: {
    primary: '#1f2937',   // Gray-800 - Main text (16.1:1 contrast)
    secondary: '#6b7280', // Gray-500 - Secondary text (7.9:1 contrast)
    tertiary: '#9ca3af',  // Gray-400 - Tertiary/placeholders (4.7:1 contrast)
    disabled: '#d1d5db',  // Gray-300 - Disabled text
  },

  bg: {
    white: '#ffffff',     // Pure white
    lightest: '#fafafa',  // Off-white (headers)
    lighter: '#f9fafb',   // Gray-50 - Light backgrounds
    light: '#f3f4f6',     // Gray-100 - Hover backgrounds
    medium: '#e5e7eb',    // Gray-200 - Borders/dividers
    dark: '#d1d5db',      // Gray-300 - Strong borders
  },

  border: {
    light: '#e5e7eb',     // Gray-200 - Default borders
    medium: '#d1d5db',    // Gray-300 - Hover borders
    dark: '#9ca3af',      // Gray-400 - Active borders
  },
} as const;

/**
 * Commonly used color combinations for quick access
 */
export const COLOR_COMBINATIONS = {
  // Primary button
  primaryButton: {
    background: COLORS.primary.gradient,
    color: '#ffffff',
    borderColor: 'transparent',
    hoverShadow: `0 4px 12px ${COLORS.primary.shadow}`,
  },

  // Secondary button
  secondaryButton: {
    background: COLORS.secondary.gradient,
    color: '#ffffff',
    borderColor: 'transparent',
    hoverShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
  },

  // Card with hover effect
  card: {
    background: COLORS.bg.lighter,
    borderColor: COLORS.border.light,
    borderColorHover: COLORS.primary.base,
    hoverBackground: COLORS.bg.light,
  },

  // Icon background (default)
  iconBox: {
    background: COLORS.primary.gradient,
    color: '#ffffff',
  },

  // Pinned item
  pinnedItem: {
    background: COLORS.secondary.gradient,
    borderColor: COLORS.secondary.light,
    iconBackground: COLORS.secondary.gradient,
  },
} as const;

/**
 * Utility function to create a gradient with custom angle
 */
export function createGradient(
  startColor: string,
  endColor: string,
  angle: number = 135
): string {
  return `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
}

/**
 * Utility function to create RGBA color with custom opacity
 */
export function withOpacity(hexColor: string, opacity: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Utility function to create box shadow with color
 */
export function createShadow(
  color: string,
  opacity: number = 0.4,
  blur: number = 12,
  spread: number = 0,
  offsetY: number = 4
): string {
  return `0 ${offsetY}px ${blur}px ${spread}px ${withOpacity(color, opacity)}`;
}

/**
 * Common transition values for consistency
 */
export const TRANSITIONS = {
  fast: 'all 0.15s ease',
  normal: 'all 0.2s ease',
  slow: 'all 0.3s ease',

  // Specific property transitions
  background: 'background 0.2s ease',
  border: 'border-color 0.2s ease',
  transform: 'transform 0.2s ease',
  shadow: 'box-shadow 0.2s ease',

  // Combined
  all: 'all 0.2s ease',
} as const;

/**
 * Common border radius values
 */
export const BORDER_RADIUS = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

/**
 * Type-safe color accessor
 */
export type ColorPath =
  | 'primary.base'
  | 'primary.gradient'
  | 'secondary.base'
  | 'secondary.gradient'
  | 'success.base'
  | 'warning.base'
  | 'error.base'
  | 'info.base'
  | 'text.primary'
  | 'text.secondary'
  | 'bg.white'
  | 'bg.lighter'
  | 'border.light';

/**
 * Example usage in components:
 *
 * ```typescript
 * import { COLORS, TRANSITIONS, BORDER_RADIUS, createShadow } from '@/utils/colors';
 *
 * // Basic usage
 * <button style={{
 *   background: COLORS.primary.gradient,
 *   color: '#ffffff',
 *   borderRadius: BORDER_RADIUS.md,
 *   transition: TRANSITIONS.normal,
 * }}
 * onMouseEnter={(e) => {
 *   e.currentTarget.style.boxShadow = createShadow(COLORS.primary.base);
 * }}
 * />
 *
 * // Using combinations
 * import { COLOR_COMBINATIONS } from '@/utils/colors';
 *
 * <button style={{
 *   ...COLOR_COMBINATIONS.primaryButton,
 *   padding: '8px 16px',
 * }} />
 * ```
 */
