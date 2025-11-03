/**
 * Conversion Grid Component - Professional grid layout for conversion cards
 * Redesigned with modern spacing and responsive layout matching the updated design system
 */

import React, { useState, useEffect } from 'react';
import type { AreaUnit, ConversionResult } from '../../types/conversion';
import { ConversionCard } from './ConversionCard';

interface ConversionGridProps {
  /** Array of conversion results to display */
  conversions: ConversionResult[];
  /** Unit that was recently copied (for visual feedback) */
  copiedUnit: AreaUnit | null;
  /** Callback when a value is copied */
  onCopy: (value: string, unit: AreaUnit) => void;
}

// Modern styles with enhanced layout and spacing
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },

  // Enhanced grid layout with 2x2 design
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    width: '100%'
  },

  // Single column for very narrow spaces
  gridSingle: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
    width: '100%'
  },

  // Professional grid for desktop
  gridDesktop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    width: '100%'
  },

  // Enhanced summary section
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
    marginBottom: '4px'
  },

  summaryIcon: {
    width: '14px',
    height: '14px',
    color: '#64748b'
  },

  // Improved approximate note styling
  approximateNote: {
    fontSize: '11px',
    color: '#f59e0b',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#fffbeb',
    borderRadius: '6px',
    border: '1px solid #fed7aa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },

  // Loading state
  loadingState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    color: '#6b7280',
    gap: '12px'
  },

  loadingIcon: {
    fontSize: '24px',
    animation: 'spin 1s linear infinite'
  },

  // Empty state styling
  emptyState: {
    textAlign: 'center' as const,
    padding: '24px 16px',
    color: '#9ca3af',
    fontSize: '13px',
    fontStyle: 'italic'
  },

  // Performance indicator
  performanceNote: {
    fontSize: '10px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  }
};

// CSS animation injection for loading spinner
const injectAnimations = () => {
  if (document.getElementById('conversion-grid-animations')) return;

  const style = document.createElement('style');
  style.id = 'conversion-grid-animations';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .conversion-grid-item {
      animation: fadeIn 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Conversion Grid - Professional responsive grid layout for displaying conversion results
 */
export function ConversionGrid({ conversions, copiedUnit, onCopy }: ConversionGridProps) {
  const [gridLayout, setGridLayout] = useState<'single' | 'double' | 'auto'>('auto');
  const [isLoading, setIsLoading] = useState(false);

  // Inject CSS animations on mount
  useEffect(() => {
    injectAnimations();
  }, []);

  /**
   * Handle responsive grid layout based on container width
   */
  useEffect(() => {
    const updateGridLayout = () => {
      const width = window.innerWidth;
      if (width < 400) {
        setGridLayout('single');
      } else {
        setGridLayout('double');
      }
    };

    updateGridLayout();
    window.addEventListener('resize', updateGridLayout);
    return () => window.removeEventListener('resize', updateGridLayout);
  }, []);

  /**
   * Simulate brief loading state for UX
   */
  useEffect(() => {
    if (conversions.length > 0) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 150);
      return () => clearTimeout(timer);
    }
  }, [conversions]);

  /**
   * Get grid styles based on layout
   */
  const getGridStyles = () => {
    switch (gridLayout) {
      case 'single':
        return styles.gridSingle;
      case 'double':
        return styles.gridDesktop;
      default:
        return styles.grid;
    }
  };

  /**
   * Check if any results are marked as approximate
   */
  const hasApproximateResults = conversions.some(result => result.isApproximate);
  const approximateCount = conversions.filter(result => result.isApproximate).length;

  // Handle empty state
  if (conversions.length === 0) {
    return (
      <div style={styles.emptyState}>
        No conversions available
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div style={styles.loadingState}>
        <div style={styles.loadingIcon}>⏳</div>
        <div>Generating conversions...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Results Summary */}
      <div style={styles.summary}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{conversions.length} units converted</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Real-time</span>
        </div>
      </div>

      {/* Conversion Cards Grid */}
      <div style={getGridStyles()}>
        {conversions.map((conversion, index) => (
          <div
            key={conversion.unit}
            className="conversion-grid-item"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ConversionCard
              conversion={conversion}
              isCopied={copiedUnit === conversion.unit}
              onCopy={onCopy}
            />
          </div>
        ))}
      </div>

      {/* Approximate Results Warning */}
      {hasApproximateResults && (
        <div style={styles.approximateNote} role="note" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {approximateCount} value{approximateCount !== 1 ? 's' : ''} may be approximate due to precision limits
        </div>
      )}

      {/* Performance Note */}
      <div style={styles.performanceNote}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
        Calculated in real-time with high precision
      </div>
    </div>
  );
}