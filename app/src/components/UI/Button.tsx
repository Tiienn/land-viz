/**
 * Button Component Library - Phase 3: Design System Enhancement
 *
 * Canva-inspired button components with:
 * - Primary: Gradient background (teal → purple), hover lift
 * - Secondary: White background with border, subtle hover
 * - Danger: Red for destructive actions
 * - Ghost: Transparent, text-only
 *
 * All buttons include:
 * - Smooth hover animations
 * - Focus indicators for accessibility (Week 4)
 * - Loading states with ARIA support (Week 4)
 * - Icon support
 * - Disabled states
 * - WCAG 2.1 AA compliant (Week 4)
 */

import React, { useRef } from 'react';
import { tokens } from '../../styles/tokens';
import { loadingAria, touchTarget } from '../../utils/accessibility';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Icon to display before text */
  icon?: React.ReactNode;
  /** Icon to display after text */
  iconAfter?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Button children (text/elements) */
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  icon,
  iconAfter,
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  style,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Size styles
  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'small':
        return {
          padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
          fontSize: tokens.typography.bodySmall.size,
          height: '32px',
        };
      case 'large':
        return {
          padding: `${tokens.spacing[4]} ${tokens.spacing[6]}`,
          fontSize: tokens.typography.bodyLarge.size,
          height: '48px',
        };
      case 'medium':
      default:
        return {
          padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
          fontSize: tokens.typography.button.size,
          height: '40px',
        };
    }
  };

  // Variant styles
  const getVariantStyles = (): React.CSSProperties => {
    if (disabled || loading) {
      return {
        background: tokens.colors.neutral[200],
        color: tokens.colors.neutral[400],
        border: `1px solid ${tokens.colors.neutral[200]}`,
        cursor: 'not-allowed',
        boxShadow: 'none',
      };
    }

    switch (variant) {
      case 'primary':
        return {
          background: tokens.colors.brand.gradient.tealPurple,
          color: 'white',
          border: 'none',
          boxShadow: tokens.shadows.brand,
        };
      case 'secondary':
        return {
          background: tokens.colors.background.primary,
          color: tokens.colors.neutral[700],
          border: `1px solid ${tokens.colors.neutral[200]}`,
          boxShadow: tokens.shadows.sm,
        };
      case 'danger':
        return {
          background: tokens.colors.semantic.error,
          color: 'white',
          border: 'none',
          boxShadow: `0 2px 4px ${tokens.colors.semantic.error}40`,
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: tokens.colors.neutral[700],
          border: 'none',
          boxShadow: 'none',
        };
      default:
        return {};
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const target = e.currentTarget;

    switch (variant) {
      case 'primary':
        target.style.transform = 'translateY(-1px)';
        target.style.boxShadow = tokens.shadows.brandHover;
        break;
      case 'secondary':
        target.style.background = tokens.colors.neutral[50];
        target.style.borderColor = tokens.colors.neutral[300];
        target.style.transform = 'translateY(-1px)';
        target.style.boxShadow = tokens.shadows.md;
        break;
      case 'danger':
        target.style.transform = 'translateY(-1px)';
        target.style.boxShadow = `0 4px 8px ${tokens.colors.semantic.error}60`;
        break;
      case 'ghost':
        target.style.background = tokens.colors.neutral[100];
        break;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const target = e.currentTarget;
    const variantStyles = getVariantStyles();

    target.style.transform = 'translateY(0)';
    target.style.background = variantStyles.background as string;
    target.style.borderColor = variantStyles.border?.split(' ')[2] || '';
    target.style.boxShadow = variantStyles.boxShadow as string;
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
    borderRadius: tokens.radius.md,
    fontWeight: tokens.typography.button.weight,
    fontFamily: tokens.typography.fontFamily.primary,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.default}`,
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...getSizeStyles(),
    ...getVariantStyles(),
    ...style,
  };

  return (
    <button
      ref={buttonRef}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={(e) => {
        if (disabled || loading) return;
        e.currentTarget.style.outline = `2px solid ${tokens.colors.brand.teal}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
        e.currentTarget.style.outlineOffset = '0';
      }}
      style={baseStyles}
      // Week 4: Enhanced ARIA attributes
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...(loading ? loadingAria.loading : {})}
      {...props}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: `spin ${tokens.animation.timing.celebration} linear infinite`,
          }}
          role="status"
          aria-label="Loading"
          aria-live="polite"
        />
      )}
      {!loading && icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
      {!loading && iconAfter && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{iconAfter}</span>
      )}
    </button>
  );
};

/**
 * Convenience components for common button types
 */

export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
);

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="danger" {...props} />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
);

export default Button;
