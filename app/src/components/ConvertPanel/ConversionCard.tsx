/**
 * Conversion Card Component - Professional individual card for displaying converted values
 * Redesigned with modern styling, smooth interactions, and accessibility improvements
 */

import React, { useState, useCallback, useEffect } from 'react';
import { UNIT_CONFIGS } from '../../utils/conversionUtils';
import type { AreaUnit, ConversionResult } from '../../types/conversion';

interface ConversionCardProps {
  /** Conversion result to display */
  conversion: ConversionResult;
  /** Whether this card's value was recently copied */
  isCopied: boolean;
  /** Callback when copy button is clicked */
  onCopy: (value: string, unit: AreaUnit) => void;
}

// Professional styles with modern design patterns
const styles = {
  // Enhanced card design with subtle shadows and modern borders
  card: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid #e5e7eb',
    position: 'relative' as const,
    minHeight: '120px',
    maxHeight: '120px',
    height: '120px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  } as const,

  // Sophisticated hover effects
  cardHover: {
    backgroundColor: '#fafbff',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    borderColor: '#3b82f6'
  } as const,

  // Success state for copied cards
  cardCopied: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.1), 0 4px 12px rgba(16, 185, 129, 0.15)'
  } as const,

  // Warning state for approximate values
  cardApproximate: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b'
  } as const,

  // Enhanced typography hierarchy
  value: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0',
    wordBreak: 'break-all' as const,
    lineHeight: '1.2',
    fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif'
  } as const,

  valueHighlight: {
    color: '#3b82f6'
  } as const,

  // Professional unit display
  unit: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    margin: '0',
    letterSpacing: '0.025em'
  } as const,

  // Unit name with subtle styling
  unitName: {
    fontSize: '11px',
    color: '#9ca3af',
    margin: '0',
    fontStyle: 'italic',
    fontWeight: '400'
  } as const,

  // Enhanced copy feedback with animation
  copyFeedback: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#ffffff',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #10b981',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
    animation: 'copyFeedback 2s ease-in-out',
    zIndex: 10
  } as const,

  // Professional approximate indicator
  approximateIndicator: {
    position: 'absolute' as const,
    top: '8px',
    left: '8px',
    fontSize: '10px',
    color: '#f59e0b',
    fontWeight: '600',
    backgroundColor: '#ffffff',
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid #f59e0b',
    boxShadow: '0 1px 3px rgba(245, 158, 11, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  } as const,

  // Invisible overlay button for accessibility
  copyButton: {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 200ms ease'
  } as const,

  // Focus ring for accessibility
  copyButtonFocus: {
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1), inset 0 0 0 2px #3b82f6'
  } as const,

  // Loading shimmer effect
  loadingShimmer: {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  } as const,

  // Value container for better alignment
  valueContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    width: '100%'
  },

  // Icon for copy action hint
  copyHint: {
    position: 'absolute' as const,
    bottom: '8px',
    right: '8px',
    width: '16px',
    height: '16px',
    color: '#9ca3af',
    opacity: '0',
    transition: 'opacity 200ms ease',
    pointerEvents: 'none' as const
  }
};

// Enhanced CSS animations
const injectCardAnimations = () => {
  if (document.getElementById('conversion-card-animations')) return;

  const style = document.createElement('style');
  style.id = 'conversion-card-animations';
  style.textContent = `
    @keyframes copyFeedback {
      0% { opacity: 0; transform: scale(0.8) translateY(10px); }
      15% { opacity: 1; transform: scale(1) translateY(0); }
      85% { opacity: 1; transform: scale(1) translateY(0); }
      100% { opacity: 0; transform: scale(0.9) translateY(-5px); }
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .conversion-card:hover .copy-hint {
      opacity: 1 !important;
    }

    .conversion-card:focus-within .copy-hint {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Conversion Card - Professional card component with smooth interactions and accessibility
 */
export function ConversionCard({ conversion, isCopied, onCopy }: ConversionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Inject CSS animations on mount
  useEffect(() => {
    injectCardAnimations();
  }, []);

  /**
   * Handle copy action with enhanced feedback
   */
  const handleCopy = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Format the value for copying (just the number)
    const valueForCopy = conversion.value.toString();
    onCopy(valueForCopy, conversion.unit);
  }, [conversion, onCopy]);

  /**
   * Handle keyboard interactions
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const valueForCopy = conversion.value.toString();
      onCopy(valueForCopy, conversion.unit);
    }
  }, [conversion, onCopy]);

  /**
   * Get card styles based on current state
   */
  const getCardStyles = () => {
    let cardStyles = { ...styles.card };

    if (isCopied) {
      cardStyles = { ...cardStyles, ...styles.cardCopied };
    } else if (conversion.isApproximate) {
      cardStyles = { ...cardStyles, ...styles.cardApproximate };
    }

    if ((isHovered || isFocused) && !isCopied) {
      cardStyles = { ...cardStyles, ...styles.cardHover };
    }

    return cardStyles;
  };

  /**
   * Get value styles based on state
   */
  const getValueStyles = () => {
    const baseStyles = { ...styles.value };

    if (isHovered && !isCopied) {
      return { ...baseStyles, ...styles.valueHighlight };
    }

    return baseStyles;
  };

  /**
   * Get copy button styles based on focus state
   */
  const getCopyButtonStyles = () => {
    const baseStyles = { ...styles.copyButton };

    if (isFocused) {
      return { ...baseStyles, ...styles.copyButtonFocus };
    }

    return baseStyles;
  };

  const unitConfig = UNIT_CONFIGS[conversion.unit];
  const formattedParts = conversion.formatted.split(' ');
  const valueText = formattedParts[0];

  return (
    <div
      className="conversion-card"
      style={getCardStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      aria-label={`Copy ${conversion.formatted} to clipboard`}
      title={`Click to copy ${conversion.formatted}`}
    >
      {/* Interactive overlay button */}
      <button
        style={getCopyButtonStyles()}
        onClick={handleCopy}
        aria-label={`Copy ${conversion.formatted} to clipboard`}
        tabIndex={-1}
      />

      {/* Approximate value indicator */}
      {conversion.isApproximate && (
        <div style={styles.approximateIndicator} title="Approximate value due to precision limits">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
          ~
        </div>
      )}

      {/* Copy success feedback */}
      {isCopied && (
        <div style={styles.copyFeedback}>
          <span>Copied!</span>
        </div>
      )}

      {/* Value display */}
      <div style={styles.valueContainer}>
        <div style={getValueStyles()}>
          {valueText}
        </div>

        <div style={styles.unit}>
          {unitConfig.symbol}
        </div>

        <div style={styles.unitName}>
          {unitConfig.name}
        </div>
      </div>

      {/* Copy hint icon */}
      <svg
        className="copy-hint"
        style={styles.copyHint}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    </div>
  );
}