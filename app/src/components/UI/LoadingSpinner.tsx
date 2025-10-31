/**
 * LoadingSpinner Component
 *
 * Canva-inspired loading indicators:
 * - Smooth rotation animation
 * - Multiple sizes (small, medium, large)
 * - Optional loading text
 * - Week 3: Enhanced shimmer effects
 * - Accessible with aria-label
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

export type SpinnerSize = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps {
  /** Size variant */
  size?: SpinnerSize;
  /** Optional loading message */
  message?: string;
  /** Color (defaults to brand gradient) */
  color?: string;
}

const getSizePixels = (size: SpinnerSize): number => {
  switch (size) {
    case 'small':
      return 16;
    case 'medium':
      return 24;
    case 'large':
      return 48;
    default:
      return 24;
  }
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  color = tokens.colors.brand.teal, // Week 3: Use brand color
}) => {
  const pixels = getSizePixels(size);

  return (
    <div
      role="status"
      aria-label={message || 'Loading'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <svg
        width={pixels}
        height={pixels}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60 40"
          opacity="0.25"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="15 85"
        />
      </svg>
      {message && (
        <p
          style={{
            margin: 0,
            fontSize: size === 'small' ? '12px' : '14px',
            color: '#6b7280',
            fontWeight: '500',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * LoadingOverlay Component
 *
 * Full-screen or container-level loading overlay
 * with backdrop blur effect
 */
interface LoadingOverlayProps {
  message?: string;
  /** If true, covers entire viewport. Otherwise, absolute positioned in parent */
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message,
  fullScreen = false,
}) => {
  return (
    <div
      style={{
        position: fullScreen ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      role="status"
      aria-label={message || 'Loading'}
    >
      <LoadingSpinner size="large" message={message} />
    </div>
  );
};

/**
 * SkeletonLoader Component
 *
 * Content placeholder for loading states
 * Usage: Replace actual content with skeleton while data loads
 */
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = tokens.radius.sm, // Week 3: Use design tokens
  style,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        // Week 3: Enhanced shimmer with brand colors
        background: `linear-gradient(90deg, ${tokens.colors.neutral[100]} 0%, ${tokens.colors.neutral[200]} 50%, ${tokens.colors.neutral[100]} 100%)`,
        backgroundSize: '200% 100%',
        animation: `shimmer 2s infinite linear`, // Week 3: Smoother shimmer
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

/**
 * SkeletonText Component
 *
 * Text placeholder with multiple lines
 */
interface SkeletonTextProps {
  lines?: number;
  gap?: number;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, gap = 8 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;
