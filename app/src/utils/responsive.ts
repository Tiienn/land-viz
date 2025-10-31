/**
 * Responsive Design Utilities - Phase 3 Week 4
 *
 * Mobile-first responsive design system for Land Visualizer
 * - Breakpoints (375px, 768px, 1024px, 1440px)
 * - Media query helpers
 * - Touch-friendly sizes
 * - Responsive layouts
 */

import { tokens } from '../styles/tokens';

/**
 * Breakpoints
 * Mobile-first approach: styles apply upward from each breakpoint
 */
export const breakpoints = {
  mobile: 375, // Small phones
  tablet: 768, // Tablets and large phones
  desktop: 1024, // Desktop and laptops
  large: 1440, // Large desktops
  xlarge: 1920, // Extra large displays
} as const;

/**
 * Media Query Strings
 * Use in CSS-in-JS or matchMedia
 */
export const mediaQueries = {
  mobile: `(min-width: ${breakpoints.mobile}px)`,
  tablet: `(min-width: ${breakpoints.tablet}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px)`,
  large: `(min-width: ${breakpoints.large}px)`,
  xlarge: `(min-width: ${breakpoints.xlarge}px)`,

  // Max-width queries (for mobile-first approach)
  maxMobile: `(max-width: ${breakpoints.tablet - 1}px)`,
  maxTablet: `(max-width: ${breakpoints.desktop - 1}px)`,
  maxDesktop: `(max-width: ${breakpoints.large - 1}px)`,

  // Touch device detection
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
} as const;

/**
 * Check if currently on mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.tablet;
};

/**
 * Check if currently on tablet
 */
export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.tablet && window.innerWidth < breakpoints.desktop;
};

/**
 * Check if currently on desktop
 */
export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.desktop;
};

/**
 * Check if touch device
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(mediaQueries.touch).matches;
};

/**
 * Responsive spacing scale
 * Smaller spacing on mobile, larger on desktop
 */
export const responsiveSpacing = {
  small: {
    mobile: tokens.spacing[2],
    tablet: tokens.spacing[3],
    desktop: tokens.spacing[4],
  },
  medium: {
    mobile: tokens.spacing[3],
    tablet: tokens.spacing[4],
    desktop: tokens.spacing[6],
  },
  large: {
    mobile: tokens.spacing[4],
    tablet: tokens.spacing[6],
    desktop: tokens.spacing[8],
  },
};

/**
 * Responsive font sizes
 * Adjust typography for different screen sizes
 */
export const responsiveFontSize = {
  display: {
    mobile: '24px',
    tablet: '28px',
    desktop: '32px',
  },
  h1: {
    mobile: '20px',
    tablet: '22px',
    desktop: '24px',
  },
  h2: {
    mobile: '18px',
    tablet: '19px',
    desktop: '20px',
  },
  body: {
    mobile: '14px',
    tablet: '14px',
    desktop: '14px',
  },
};

/**
 * Touch target sizes
 * Ensure interactive elements are touch-friendly
 */
export const touchTarget = {
  minimum: {
    width: 44,
    height: 44,
  },
  recommended: {
    width: 48,
    height: 48,
  },
  comfortable: {
    width: 56,
    height: 56,
  },
};

/**
 * Responsive container widths
 */
export const containerWidths = {
  mobile: '100%',
  tablet: '720px',
  desktop: '960px',
  large: '1200px',
  xlarge: '1400px',
};

/**
 * Create responsive styles based on current viewport
 */
export const getResponsiveStyles = (
  styles: {
    mobile: React.CSSProperties;
    tablet?: React.CSSProperties;
    desktop?: React.CSSProperties;
  }
): React.CSSProperties => {
  if (isDesktop() && styles.desktop) {
    return { ...styles.mobile, ...styles.tablet, ...styles.desktop };
  }
  if (isTablet() && styles.tablet) {
    return { ...styles.mobile, ...styles.tablet };
  }
  return styles.mobile;
};

/**
 * useResponsive hook helper
 * Returns current breakpoint
 */
export const getCurrentBreakpoint = (): 'mobile' | 'tablet' | 'desktop' | 'large' | 'xlarge' => {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width >= breakpoints.xlarge) return 'xlarge';
  if (width >= breakpoints.large) return 'large';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
};

/**
 * Responsive layout helpers
 */
export const layouts = {
  // Flex layout that stacks on mobile
  stackOnMobile: (gap: string = tokens.spacing[4]): React.CSSProperties => ({
    display: 'flex',
    flexDirection: isMobile() ? 'column' : 'row',
    gap,
    alignItems: isMobile() ? 'stretch' : 'center',
  }),

  // Grid that reduces columns on mobile
  responsiveGrid: (columns: {
    mobile: number;
    tablet?: number;
    desktop?: number;
  }): React.CSSProperties => {
    let gridTemplateColumns = `repeat(${columns.mobile}, 1fr)`;

    if (isDesktop() && columns.desktop) {
      gridTemplateColumns = `repeat(${columns.desktop}, 1fr)`;
    } else if (isTablet() && columns.tablet) {
      gridTemplateColumns = `repeat(${columns.tablet}, 1fr)`;
    }

    return {
      display: 'grid',
      gridTemplateColumns,
      gap: tokens.spacing[4],
    };
  },

  // Center content with max width
  container: (size: keyof typeof containerWidths = 'desktop'): React.CSSProperties => ({
    width: '100%',
    maxWidth: containerWidths[size],
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: isMobile() ? tokens.spacing[4] : tokens.spacing[6],
    paddingRight: isMobile() ? tokens.spacing[4] : tokens.spacing[6],
  }),
};

/**
 * Responsive visibility helpers
 */
export const visibility = {
  // Hide on mobile
  hideOnMobile: (): React.CSSProperties => ({
    display: isMobile() ? 'none' : 'block',
  }),

  // Show only on mobile
  showOnMobile: (): React.CSSProperties => ({
    display: isMobile() ? 'block' : 'none',
  }),

  // Hide on desktop
  hideOnDesktop: (): React.CSSProperties => ({
    display: isDesktop() ? 'none' : 'block',
  }),
};

/**
 * Panel sizing for responsive sidebars
 */
export const panelSizes = {
  sidebar: {
    mobile: '100%',
    tablet: '300px',
    desktop: '320px',
  },
  toolbar: {
    mobile: '60px',
    tablet: '70px',
    desktop: '80px',
  },
};

export default {
  breakpoints,
  mediaQueries,
  isMobile,
  isTablet,
  isDesktop,
  isTouchDevice,
  responsiveSpacing,
  responsiveFontSize,
  touchTarget,
  containerWidths,
  getResponsiveStyles,
  getCurrentBreakpoint,
  layouts,
  visibility,
  panelSizes,
};
