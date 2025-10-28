/**
 * Design Token System - Phase 3: Design System Enhancement
 *
 * Canva-inspired design tokens for Land Visualizer.
 * Based on documented design system in docs/project/canva-design-system.md
 *
 * Usage:
 * import { tokens } from './styles/tokens';
 * style={{ color: tokens.colors.brand.teal }}
 */

export const tokens = {
  /**
   * Color Palette
   * Canva-inspired brand colors with semantic meanings
   */
  colors: {
    // Brand Colors (Canva-inspired)
    brand: {
      teal: '#00C4CC',      // Primary brand color (Canva's signature)
      purple: '#7C3AED',    // Creative accent
      pink: '#EC4899',      // Playful highlight
      gradient: {
        tealPurple: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)',
        lightTealPurple: 'linear-gradient(135deg, #ECFEFF 0%, #F3E8FF 100%)',
        tealPink: 'linear-gradient(135deg, #00C4CC 0%, #EC4899 100%)',
      }
    },

    // Semantic Colors (Functional meanings)
    semantic: {
      success: '#22C55E',   // Positive actions, confirmations
      warning: '#F59E0B',   // Cautions, attention needed
      error: '#EF4444',     // Errors, destructive actions
      info: '#3B82F6',      // Informational messages
    },

    // Neutral Scale (Grays)
    neutral: {
      50: '#FAFAFA',        // Lightest - light backgrounds
      100: '#F4F4F5',       // Very light - section backgrounds
      200: '#E4E4E7',       // Light - borders
      300: '#D4D4D8',       // Medium light - disabled elements
      400: '#A1A1AA',       // Medium - placeholder text
      500: '#71717A',       // Medium dark - secondary text
      600: '#52525B',       // Dark - icons
      700: '#3F3F46',       // Darker - primary text
      800: '#27272A',       // Very dark - emphasis
      900: '#18181B',       // Darkest - headings
    },

    // Background Colors
    background: {
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      tertiary: '#F4F4F5',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Interactive States
    interactive: {
      hover: '#F9FAFB',
      active: '#EFF6FF',
      focus: '#DBEAFE',
      disabled: '#F4F4F5',
    }
  },

  /**
   * Spacing System
   * Base unit: 4px
   * All spacing should use these values for consistency
   */
  spacing: {
    0: '0',
    1: '4px',      // Tight spacing
    2: '8px',      // Small gaps
    3: '12px',     // Default spacing
    4: '16px',     // Medium spacing
    5: '20px',     // Large spacing
    6: '24px',     // Section spacing
    8: '32px',     // Page margins
    10: '40px',    // Major sections
    12: '48px',    // Hero spacing
    16: '64px',    // Extra large spacing
  },

  /**
   * Typography System
   * Modular scale with consistent sizing and weights
   */
  typography: {
    fontFamily: {
      primary: '"Nunito Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"Courier New", Courier, monospace',
    },

    // Type Scale
    display: {
      size: '32px',
      weight: 800,
      lineHeight: 1.2,
    },
    h1: {
      size: '24px',
      weight: 700,
      lineHeight: 1.3,
    },
    h2: {
      size: '20px',
      weight: 600,
      lineHeight: 1.4,
    },
    h3: {
      size: '18px',
      weight: 600,
      lineHeight: 1.4,
    },
    bodyLarge: {
      size: '16px',
      weight: 400,
      lineHeight: 1.6,
    },
    body: {
      size: '14px',
      weight: 400,
      lineHeight: 1.5,
    },
    bodySmall: {
      size: '12px',
      weight: 400,
      lineHeight: 1.4,
    },
    button: {
      size: '14px',
      weight: 500,
      lineHeight: 1.2,
    },
    label: {
      size: '12px',
      weight: 500,
      lineHeight: 1.3,
    },
    caption: {
      size: '11px',
      weight: 400,
      lineHeight: 1.3,
    },
  },

  /**
   * Border Radius System
   * Consistent rounded corners throughout the app
   */
  radius: {
    none: '0',
    sm: '6px',     // Small elements (inputs, small buttons)
    md: '8px',     // Buttons, cards
    lg: '12px',    // Panels, modals
    xl: '16px',    // Large containers
    full: '9999px', // Pills, badges, circular elements
  },

  /**
   * Shadow System
   * Elevation and depth
   */
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.08)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.1)',
    brand: '0 4px 12px rgba(0, 196, 204, 0.2)', // Teal glow
    brandHover: '0 8px 16px rgba(0, 196, 204, 0.3)', // Enhanced teal glow
  },

  /**
   * Animation Timing
   * Consistent animation durations
   */
  animation: {
    timing: {
      quick: '100ms',      // Immediate feedback
      smooth: '200ms',     // Standard transitions
      noticeable: '300ms', // Noticeable but not slow
      celebration: '600ms', // Memorable animations
    },
    easing: {
      default: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bouncy
    },
  },

  /**
   * Z-Index Scale
   * Consistent layering
   */
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
    toast: 1600,
  },

  /**
   * Breakpoints
   * Responsive design breakpoints
   */
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    large: '1440px',
  },
} as const;

/**
 * Helper function to generate rgba color with opacity
 */
export const rgba = (color: string, opacity: number): string => {
  // Convert hex to rgb
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Helper function to get responsive value
 */
export const responsive = {
  mobile: (styles: React.CSSProperties): string => {
    return `@media (max-width: ${tokens.breakpoints.mobile}) { ${JSON.stringify(styles)} }`;
  },
  tablet: (styles: React.CSSProperties): string => {
    return `@media (max-width: ${tokens.breakpoints.tablet}) { ${JSON.stringify(styles)} }`;
  },
  desktop: (styles: React.CSSProperties): string => {
    return `@media (min-width: ${tokens.breakpoints.desktop}) { ${JSON.stringify(styles)} }`;
  },
};

/**
 * Type exports for TypeScript support
 */
export type ColorToken = typeof tokens.colors;
export type SpacingToken = typeof tokens.spacing;
export type TypographyToken = typeof tokens.typography;
export type RadiusToken = typeof tokens.radius;
export type ShadowToken = typeof tokens.shadows;
export type AnimationToken = typeof tokens.animation;
