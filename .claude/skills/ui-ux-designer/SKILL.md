---
name: "UI/UX Designer"
description: "Design, review, and improve user interfaces and user experiences for the Land Visualizer project. Implements Canva-inspired design system with modern aesthetics, WCAG 2.1 AA accessibility, responsive layouts, and S-Tier SaaS quality (rivals Canva, Figma, Linear)"
version: "1.0.0"
---

# UI/UX Design Specialist for Land Visualizer

## Overview

This skill provides expertise in UI/UX design specifically for the Land Visualizer project, which features a Canva-inspired modern design system while maintaining professional CAD functionality. Focus on creating delightful, accessible, and responsive interfaces that make complex land visualization feel simple.

## When to Use This Skill

- Designing new UI components
- Implementing the Canva-inspired design system
- Ensuring WCAG 2.1 AA accessibility compliance
- Creating responsive layouts (375/768/1024/1440px breakpoints)
- Designing animations and micro-interactions
- Reviewing design consistency
- Optimizing user workflows

## Design Philosophy

### Core Principle
**"Make the Complex Feel Simple"**

Every design decision should reduce cognitive load while maintaining professional capability. If a feature requires explanation, it needs redesign.

### 10 Design Principles

1. **Immediate Understanding**: Users grasp land size within 10 seconds
2. **Progressive Disclosure**: Complexity reveals when needed
3. **Visual First, Numbers Second**: Every number has a visual representation
4. **Zero to Hero**: First success within 30 seconds
5. **Mobile-First**: Every feature works on phones
6. **Forgiveness by Design**: Every action is reversible
7. **Performance as Feature**: 60 FPS minimum
8. **Accessibility is Not Optional**: WCAG 2.1 AA compliance required
9. **Delight in Details**: Smooth animations, satisfying micro-interactions
10. **Context Over Configuration**: Smart defaults eliminate settings

## Canva-Inspired Design System

### Brand Colors

```typescript
const COLORS = {
  // Primary palette
  teal: {
    50: '#E6F9FA',
    100: '#CCF3F5',
    500: '#00C4CC', // Primary
    600: '#00A8B0',
    700: '#008B93'
  },

  purple: {
    50: '#F3E8FF',
    100: '#E9D5FF',
    500: '#7C3AED', // Secondary
    600: '#6D28D9',
    700: '#5B21B6'
  },

  pink: {
    50: '#FCE7F3',
    100: '#FBD5E5',
    500: '#EC4899', // Accent
    600: '#DB2777',
    700: '#BE185D'
  },

  // Semantic colors
  green: {
    500: '#22C55E', // Success
    600: '#16A34A',
    700: '#15803D'
  },

  orange: {
    500: '#F59E0B', // Warning
    600: '#D97706',
    700: '#B45309'
  },

  red: {
    500: '#EF4444', // Error
    600: '#DC2626',
    700: '#B91C1C'
  },

  // Neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
};
```

### Typography

```typescript
// Nunito Sans font family (Google Fonts)
const TYPOGRAPHY = {
  fontFamily: "'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  sizes: {
    micro: '11px',
    caption: '12px',
    body: '14px',
    bodyLarge: '16px',
    title: '20px',
    heading: '24px',
    display: '32px'
  },

  weights: {
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  }
};
```

### Spacing System

```typescript
// 8px base unit grid
const SPACING = {
  0: '0',
  1: '4px',   // 0.5 unit
  2: '8px',   // 1 unit
  3: '12px',  // 1.5 units
  4: '16px',  // 2 units
  5: '20px',  // 2.5 units
  6: '24px',  // 3 units
  8: '32px',  // 4 units
  10: '40px', // 5 units
  12: '48px', // 6 units
  16: '64px', // 8 units
  20: '80px', // 10 units
  24: '96px'  // 12 units
};
```

### Border Radius

```typescript
const BORDER_RADIUS = {
  none: '0',
  sm: '4px',
  md: '8px',    // Standard
  lg: '12px',   // Cards, panels
  xl: '16px',
  full: '9999px' // Pills, circles
};
```

### Shadows

```typescript
const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  focus: '0 0 0 3px rgba(0, 196, 204, 0.5)' // Teal focus ring
};
```

### Transitions

```typescript
const TRANSITIONS = {
  duration: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms'
  },

  timing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
};
```

## Component Library

### Button Component

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  onClick,
  disabled = false
}) => {
  const styles = {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING[2],
      fontFamily: TYPOGRAPHY.fontFamily,
      fontWeight: TYPOGRAPHY.weights.semiBold,
      borderRadius: BORDER_RADIUS.md,
      transition: TRANSITIONS.default,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      border: 'none',
      outline: 'none'
    },

    variants: {
      primary: {
        background: `linear-gradient(135deg, ${COLORS.teal[500]} 0%, ${COLORS.purple[500]} 100%)`,
        color: 'white',
        boxShadow: SHADOWS.md
      },
      secondary: {
        background: COLORS.gray[100],
        color: COLORS.gray[900],
        boxShadow: SHADOWS.sm
      },
      danger: {
        background: COLORS.red[500],
        color: 'white',
        boxShadow: SHADOWS.md
      },
      ghost: {
        background: 'transparent',
        color: COLORS.gray[700]
      }
    },

    sizes: {
      sm: {
        padding: `${SPACING[1]} ${SPACING[3]}`,
        fontSize: TYPOGRAPHY.sizes.caption,
        minHeight: '32px'
      },
      md: {
        padding: `${SPACING[2]} ${SPACING[4]}`,
        fontSize: TYPOGRAPHY.sizes.body,
        minHeight: '40px'
      },
      lg: {
        padding: `${SPACING[3]} ${SPACING[6]}`,
        fontSize: TYPOGRAPHY.sizes.bodyLarge,
        minHeight: '48px'
      }
    }
  };

  return (
    <button
      style={{
        ...styles.base,
        ...styles.variants[variant],
        ...styles.sizes[size]
      }}
      onClick={onClick}
      disabled={disabled}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
```

### Toast Component

```tsx
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  const typeStyles = {
    success: {
      background: COLORS.green[50],
      border: `2px solid ${COLORS.green[500]}`,
      color: COLORS.green[700],
      icon: '✓'
    },
    error: {
      background: COLORS.red[50],
      border: `2px solid ${COLORS.red[500]}`,
      color: COLORS.red[700],
      icon: '✕'
    },
    warning: {
      background: COLORS.orange[50],
      border: `2px solid ${COLORS.orange[500]}`,
      color: COLORS.orange[700],
      icon: '⚠'
    },
    info: {
      background: COLORS.teal[50],
      border: `2px solid ${COLORS.teal[500]}`,
      color: COLORS.teal[700],
      icon: 'ℹ'
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: SPACING[6],
        right: SPACING[6],
        minWidth: '320px',
        padding: SPACING[4],
        borderRadius: BORDER_RADIUS.lg,
        boxShadow: SHADOWS.xl,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING[3],
        animation: 'slideIn 200ms ease-out',
        ...typeStyles[type]
      }}
      role="alert"
      aria-live="polite"
    >
      <span style={{ fontSize: '20px' }}>{typeStyles[type].icon}</span>
      <span style={{ flex: 1, fontSize: TYPOGRAPHY.sizes.body }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          padding: SPACING[1]
        }}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};
```

### Loading Spinner

```tsx
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '32px'
  };

  return (
    <div
      style={{
        width: sizes[size],
        height: sizes[size],
        border: `3px solid ${COLORS.gray[200]}`,
        borderTop: `3px solid ${COLORS.teal[500]}`,
        borderRadius: '50%',
        animation: 'spin 600ms linear infinite'
      }}
      role="status"
      aria-label="Loading"
    />
  );
};

// Add to CSS
const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
```

## Animation Library

### Success Pulse Animation

```typescript
// Green glow on achievements
const successPulse = (element: HTMLElement) => {
  element.style.animation = 'successPulse 600ms ease-out';
  element.style.boxShadow = `0 0 20px ${COLORS.green[500]}`;

  setTimeout(() => {
    element.style.animation = '';
    element.style.boxShadow = '';
  }, 600);
};

const successPulseKeyframes = `
  @keyframes successPulse {
    0% { transform: scale(1); box-shadow: 0 0 0 ${COLORS.green[500]}; }
    50% { transform: scale(1.05); box-shadow: 0 0 20px ${COLORS.green[500]}; }
    100% { transform: scale(1); box-shadow: 0 0 0 ${COLORS.green[500]}; }
  }
`;
```

### Error Shake Animation

```typescript
// Red shake on errors
const errorShake = (element: HTMLElement) => {
  element.style.animation = 'errorShake 400ms ease-in-out';

  setTimeout(() => {
    element.style.animation = '';
  }, 400);
};

const errorShakeKeyframes = `
  @keyframes errorShake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
    20%, 40%, 60%, 80% { transform: translateX(8px); }
  }
`;
```

### Shimmer Loading Effect

```typescript
const shimmerStyles = {
  background: `linear-gradient(
    90deg,
    ${COLORS.gray[200]} 0%,
    ${COLORS.gray[100]} 50%,
    ${COLORS.gray[200]} 100%
  )`,
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite'
};

const shimmerKeyframes = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
```

## Accessibility (WCAG 2.1 AA)

### Focus Indicators

```typescript
const focusStyles = {
  outline: `2px solid ${COLORS.teal[500]}`,
  outlineOffset: '2px',
  borderRadius: BORDER_RADIUS.md
};

// Apply to all focusable elements
const accessibleButton = {
  ...buttonStyles,
  ':focus-visible': focusStyles
};
```

### ARIA Labels

```tsx
// Always provide accessible labels
<button
  aria-label="Add new rectangle shape"
  aria-pressed={isActive}
  aria-disabled={isDisabled}
>
  <RectangleIcon />
</button>

// For dynamic content
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {shapes.length} shapes created
</div>
```

### Keyboard Navigation

```tsx
const handleKeyPress = (event: React.KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ': // Space
      event.preventDefault();
      handleClick();
      break;
    case 'Escape':
      handleCancel();
      break;
    case 'Tab':
      // Allow default tab behavior
      break;
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyPress}
  aria-label="Interactive element"
>
  Content
</div>
```

### Color Contrast

```typescript
// Ensure 4.5:1 contrast ratio for text
const contrastCheck = (foreground: string, background: string) => {
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= 4.5;
};

// Safe color combinations
const safeContrasts = {
  tealOnWhite: contrastCheck(COLORS.teal[500], '#FFFFFF'), // ✓ Pass
  grayOnWhite: contrastCheck(COLORS.gray[700], '#FFFFFF'), // ✓ Pass
  whiteOnTeal: contrastCheck('#FFFFFF', COLORS.teal[500])  // ✓ Pass
};
```

### Screen Reader Support

```tsx
// Hidden but accessible to screen readers
const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
};

<span style={srOnly}>
  Currently selected: Rectangle tool
</span>
```

## Responsive Design

### Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: '375px',   // Small phones
  tablet: '768px',   // Tablets
  laptop: '1024px',  // Laptops
  desktop: '1440px'  // Large screens
};

// Media queries
const mediaQueries = {
  mobile: `@media (min-width: ${BREAKPOINTS.mobile})`,
  tablet: `@media (min-width: ${BREAKPOINTS.tablet})`,
  laptop: `@media (min-width: ${BREAKPOINTS.laptop})`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop})`
};
```

### Responsive Component

```tsx
const ResponsiveLayout: React.FC = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: SPACING[4],
      padding: isMobile ? SPACING[4] : SPACING[8]
    }}>
      {children}
    </div>
  );
};
```

### Touch Targets

```typescript
// Minimum 44x44px for touch targets (WCAG 2.1)
const touchTarget = {
  minWidth: '44px',
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
};

// Tool button example
const ToolButton = styled.button({
  ...touchTarget,
  padding: SPACING[3],
  // Ensure visual size even if content is smaller
});
```

## User Experience Patterns

### Progressive Disclosure

```tsx
// Expandable panels - collapsed by default
const [expanded, setExpanded] = useState(false);

<div style={{ width: expanded ? '300px' : '60px' }}>
  <button
    onClick={() => setExpanded(!expanded)}
    aria-expanded={expanded}
    aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
  >
    {expanded ? '◀' : '▶'}
  </button>
  {expanded && <PanelContent />}
</div>
```

### Visual Feedback

```tsx
// Immediate feedback on user actions
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

const handleAction = async () => {
  setStatus('loading');

  try {
    await performAction();
    setStatus('success');
    showToast({ type: 'success', message: 'Action completed!' });
  } catch (error) {
    setStatus('error');
    showToast({ type: 'error', message: 'Action failed' });
  }
};
```

### Empty States

```tsx
const EmptyState: React.FC<{ icon: string; title: string; description: string }> = ({
  icon,
  title,
  description
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[16],
    textAlign: 'center',
    color: COLORS.gray[500]
  }}>
    <div style={{ fontSize: '48px', marginBottom: SPACING[4] }}>
      {icon}
    </div>
    <h3 style={{
      fontSize: TYPOGRAPHY.sizes.title,
      fontWeight: TYPOGRAPHY.weights.semiBold,
      color: COLORS.gray[900],
      marginBottom: SPACING[2]
    }}>
      {title}
    </h3>
    <p style={{ fontSize: TYPOGRAPHY.sizes.body }}>
      {description}
    </p>
  </div>
);

// Usage
<EmptyState
  icon="📐"
  title="No shapes yet"
  description="Click a drawing tool to get started"
/>
```

## Design Checklist

### Before Shipping

- [ ] **Visual Hierarchy**: Clear hierarchy with typography and spacing
- [ ] **Consistency**: Colors, spacing, typography follow design system
- [ ] **Responsiveness**: Works at 375/768/1024/1440px
- [ ] **Accessibility**: WCAG 2.1 AA compliant
- [ ] **Performance**: Animations at 60 FPS
- [ ] **Error Handling**: Error states designed and implemented
- [ ] **Empty States**: Meaningful empty states
- [ ] **Loading States**: Smooth loading indicators
- [ ] **Touch Targets**: Minimum 44x44px
- [ ] **Focus Indicators**: Visible keyboard focus
- [ ] **Color Contrast**: 4.5:1 minimum ratio
- [ ] **ARIA Labels**: All interactive elements labeled

## Testing Design Quality

### Visual Regression Testing

```typescript
// Ensure designs don't regress
import { test, expect } from '@playwright/test';

test('button maintains design system', async ({ page }) => {
  await page.goto('/');

  const button = page.locator('[data-testid="primary-button"]');

  // Check colors
  const bgColor = await button.evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  );
  expect(bgColor).toContain('rgb(0, 196, 204)');

  // Check spacing
  const padding = await button.evaluate(el =>
    window.getComputedStyle(el).padding
  );
  expect(padding).toBe('8px 16px');
});
```

### Accessibility Testing

```typescript
import { axe } from 'jest-axe';

test('component is accessible', async () => {
  const { container } = render(<Button>Click me</Button>);

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Best Practices

1. **Use Design Tokens**: Always reference COLORS, SPACING, TYPOGRAPHY constants
2. **Inline Styles Only**: Avoid CSS files (project requirement)
3. **Mobile-First**: Design for mobile, enhance for desktop
4. **Test Accessibility**: Use jest-axe and manual keyboard testing
5. **Smooth Animations**: 200ms default, easing functions
6. **Provide Feedback**: Every action gets visual/audio response
7. **Enable Undo**: Make everything reversible
8. **Show Progress**: Loading states for async operations
9. **Handle Errors**: Graceful error states with recovery options
10. **Document Patterns**: Maintain component library documentation

## Summary

This skill provides comprehensive UI/UX design expertise for the Land Visualizer project. Use it when designing new components, implementing the Canva-inspired design system, ensuring accessibility, or creating responsive layouts. Always prioritize simplicity, accessibility, and delightful micro-interactions. The goal is S-Tier SaaS quality that rivals Canva, Figma, and Linear.
