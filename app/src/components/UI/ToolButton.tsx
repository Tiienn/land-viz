/**
 * ToolButton Component
 *
 * Enhanced tool button with Canva-inspired micro-interactions:
 * - Hover elevation effect
 * - Selection pulse animation
 * - Keyboard focus states
 * - ARIA accessibility
 */

import React, { useRef } from 'react';
import { applyButtonHover, removeButtonHover, animateToolSelection } from '../../utils/animations';
import { tokens } from '../../styles/tokens';

interface ToolButtonProps {
  /** Tool identifier */
  toolId: string;
  /** Whether this tool is currently active */
  isActive: boolean;
  /** Click handler */
  onClick: () => void;
  /** Button label */
  label: string;
  /** SVG icon element */
  icon: React.ReactNode;
  /** Keyboard shortcut (for tooltip) */
  shortcut?: string;
}

export const ToolButton: React.FC<ToolButtonProps> = ({
  toolId,
  isActive,
  onClick,
  label,
  icon,
  shortcut,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    // Trigger pulse animation on selection
    if (buttonRef.current && !isActive) {
      animateToolSelection(buttonRef.current);
    }
    onClick();
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isActive) {
      applyButtonHover(e.currentTarget);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isActive) {
      removeButtonHover(e.currentTarget);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`${label} tool${shortcut ? ` (${shortcut})` : ''}`}
      aria-pressed={isActive}
      title={shortcut ? `${label} (${shortcut})` : label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: tokens.radius.sm,
        minWidth: '65px',
        height: '60px',
        border: `1px solid ${isActive ? tokens.colors.brand.teal : tokens.colors.neutral[200]}`,
        cursor: 'pointer',
        background: isActive ? tokens.colors.brand.gradient.lightTealPurple : tokens.colors.background.primary,
        color: isActive ? tokens.colors.brand.teal : tokens.colors.neutral[900],
        transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.default}`,
        fontSize: tokens.typography.caption.size,
        fontWeight: tokens.typography.button.weight.toString(),
        boxShadow: isActive ? tokens.shadows.brand : 'none',
        outline: 'none',
        position: 'relative',
      }}
      // Enhanced focus state for keyboard navigation
      onFocus={(e) => {
        e.currentTarget.style.outline = `2px solid ${tokens.colors.brand.teal}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
        e.currentTarget.style.outlineOffset = '0';
      }}
    >
      <div style={{ width: '20px', height: '20px' }}>
        {icon}
      </div>
      <span style={{ marginTop: '4px' }}>{label}</span>
      {shortcut && (
        <span
          style={{
            position: 'absolute',
            top: tokens.spacing[1],
            right: tokens.spacing[1],
            fontSize: '8px',
            color: isActive ? tokens.colors.brand.teal : tokens.colors.neutral[400],
            fontWeight: '600',
            background: isActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.05)',
            padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
            borderRadius: tokens.radius.sm,
          }}
        >
          {shortcut}
        </span>
      )}
    </button>
  );
};

export default ToolButton;
