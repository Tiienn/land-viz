/**
 * EnhancedHeader Component - Phase 3: Design System Enhancement
 *
 * Canva-inspired header with:
 * - Gradient circle logo (teal → purple)
 * - Gradient text branding
 * - Inspiring tagline
 * - Professional mode toggle
 * - Total area display
 *
 * This replaces the basic AppHeader with a more polished,
 * brand-focused design that makes a strong first impression.
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

interface EnhancedHeaderProps {
  isProfessionalMode: boolean;
  setIsProfessionalMode: (value: boolean) => void;
  getTotalArea: () => number;
}

export const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  isProfessionalMode,
  setIsProfessionalMode,
  getTotalArea,
}) => {
  const totalArea = Number(getTotalArea() || 0);

  return (
    <header
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        padding: `${tokens.spacing[5]} ${tokens.spacing[6]}`,
        boxShadow: tokens.shadows.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1920px',
          margin: '0 auto',
        }}
      >
        {/* Left: Logo and Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[4] }}>
          {/* Logo */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: tokens.radius.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: tokens.shadows.brand,
              transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.default}`,
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = tokens.shadows.brandHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = tokens.shadows.brand;
            }}
            title="Land Visualizer"
          >
            <img
              src="/Land-Visualizer192.png"
              alt="Land Visualizer Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Branding Text */}
          <div>
            <h1
              style={{
                fontSize: tokens.typography.h1.size,
                fontWeight: tokens.typography.h1.weight,
                margin: 0,
                background: tokens.colors.brand.gradient.tealPurple,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: tokens.typography.h1.lineHeight,
              }}
            >
              Land Visualizer
            </h1>
            <p
              style={{
                fontSize: tokens.typography.body.size,
                color: tokens.colors.neutral[500],
                margin: 0,
                fontWeight: tokens.typography.button.weight,
                lineHeight: tokens.typography.body.lineHeight,
              }}
            >
              Create Beautiful Land Visualizations
            </p>
          </div>
        </div>

        {/* Right: Stats and Professional Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[6] }}>
          {/* Total Area Display */}
          {totalArea > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                background: tokens.colors.background.secondary,
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.colors.neutral[200]}`,
              }}
            >
              <span
                style={{
                  fontSize: tokens.typography.bodySmall.size,
                  color: tokens.colors.neutral[500],
                  fontWeight: tokens.typography.label.weight,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Total Area
              </span>
              <span
                style={{
                  fontSize: tokens.typography.h2.size,
                  color: tokens.colors.brand.teal,
                  fontWeight: tokens.typography.h2.weight,
                  lineHeight: 1.2,
                }}
              >
                {totalArea.toFixed(2)} m²
              </span>
            </div>
          )}

          {/* Professional Mode Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[3],
              padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
              background: isProfessionalMode
                ? tokens.colors.brand.gradient.lightTealPurple
                : tokens.colors.background.primary,
              borderRadius: tokens.radius.md,
              border: `1px solid ${
                isProfessionalMode ? tokens.colors.brand.teal : tokens.colors.neutral[200]
              }`,
              transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.default}`,
            }}
          >
            <label
              style={{
                fontSize: tokens.typography.body.size,
                fontWeight: tokens.typography.button.weight,
                color: isProfessionalMode
                  ? tokens.colors.brand.teal
                  : tokens.colors.neutral[700],
                cursor: 'pointer',
                userSelect: 'none',
              }}
              htmlFor="professional-mode-toggle"
            >
              Professional Mode
            </label>

            {/* Toggle Switch */}
            <button
              id="professional-mode-toggle"
              role="switch"
              aria-checked={isProfessionalMode}
              onClick={() => setIsProfessionalMode(!isProfessionalMode)}
              style={{
                position: 'relative',
                width: '44px',
                height: '24px',
                borderRadius: tokens.radius.full,
                border: 'none',
                background: isProfessionalMode
                  ? tokens.colors.brand.gradient.tealPurple
                  : tokens.colors.neutral[300],
                cursor: 'pointer',
                transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.default}`,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `2px solid ${tokens.colors.brand.teal}`;
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.outlineOffset = '0';
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: isProfessionalMode ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: tokens.radius.full,
                  background: 'white',
                  boxShadow: tokens.shadows.md,
                  transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.spring}`,
                }}
              />
            </button>

            {/* Pro Badge */}
            {isProfessionalMode && (
              <span
                style={{
                  fontSize: '10px',
                  color: tokens.colors.brand.teal,
                  fontWeight: '700',
                  background: 'rgba(0, 196, 204, 0.1)',
                  padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                  borderRadius: tokens.radius.sm,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                ⚡ Pro
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default EnhancedHeader;
