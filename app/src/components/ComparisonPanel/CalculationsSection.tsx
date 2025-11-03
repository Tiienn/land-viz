import React, { useState } from 'react';
import type { ComparisonCalculations, ObjectComparison } from '../../types/referenceObjects';
import { ComparisonCalculator } from '../../utils/comparisonCalculations';
import Icon from '../Icon';

interface CalculationsSectionProps {
  calculations: ComparisonCalculations | null;
  onRecalculate: () => void;
}

export function CalculationsSection({
  calculations,
  onRecalculate
}: CalculationsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed

  if (!calculations || calculations.objectComparisons.length === 0) {
    return null; // Hide completely when no objects selected
  }

  // Compact header when collapsed
  if (!isExpanded) {
    return (
      <div style={styles.collapsedSection}>
        <button
          style={styles.expandButton}
          onClick={() => setIsExpanded(true)}
          aria-label="Expand size comparisons"
          aria-expanded={false}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#00C4CC';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 196, 204, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          }}
        >
          <span style={styles.expandIcon}>
            <Icon name="bar-chart" size={20} color="#00C4CC" strokeWidth={2.5} />
          </span>
          <span style={styles.expandText}>
            Size Comparisons ({calculations.objectComparisons.length})
          </span>
          <span style={styles.chevron}>▼</span>
        </button>
      </div>
    );
  }

  return (
    <div style={styles.calculationsSection}>
      <div style={styles.sectionHeader}>
        <div style={styles.titleRow}>
          <h4 style={styles.sectionTitle}>Size Comparisons</h4>
          <button
            style={styles.collapseButton}
            onClick={() => setIsExpanded(false)}
            title="Collapse comparisons"
            aria-label="Collapse size comparisons"
            aria-expanded={true}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
              e.currentTarget.style.color = '#1f2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            ▲
          </button>
        </div>
        <button
          style={styles.refreshButton}
          onClick={onRecalculate}
          title="Recalculate comparisons"
          aria-label="Recalculate comparisons"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'rotate(180deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'rotate(0deg)';
          }}
        >
          <Icon name="refresh" size={16} color="#6b7280" strokeWidth={2} />
        </button>
      </div>

      <div style={styles.totalArea}>
        <div style={styles.totalLabel}>Your Total Land</div>
        <div style={styles.totalValue}>
          {ComparisonCalculator.formatArea(calculations.totalLandArea)}
        </div>
      </div>

      <div style={styles.comparisonsList}>
        {calculations.objectComparisons.map(comparison => (
          <ComparisonItem
            key={comparison.objectId}
            comparison={comparison}
            totalArea={calculations.totalLandArea}
          />
        ))}
      </div>

      <div style={styles.lastUpdated}>
        Updated {formatTime(calculations.lastCalculated)}
      </div>
    </div>
  );
}

function ComparisonItem({
  comparison
}: {
  comparison: ObjectComparison;
  totalArea: number;
}) {
  const isLarger = comparison.sizeRatio >= 1;
  const displayQuantity = comparison.quantityThatFits >= 1
    ? `${comparison.quantityThatFits}`
    : `<1`;

  // Calculate visual percentage (capped at 100%)
  const visualPercentage = Math.min(comparison.percentage, 100);

  return (
    <div style={styles.comparisonItem}>
      <div style={styles.comparisonHeader}>
        <span style={styles.objectName}>{comparison.objectName}</span>
        <span style={{
          ...styles.quantity,
          backgroundColor: isLarger ? '#dcfce7' : '#fef3c7',
          color: isLarger ? '#15803d' : '#92400e'
        }}>
          {displayQuantity} fit
        </span>
      </div>

      <div style={styles.comparisonDetails}>
        <div style={styles.description}>
          {comparison.description}
        </div>

        <div style={styles.visualBar}>
          <div
            style={{
              ...styles.progressBar,
              width: `${visualPercentage}%`,
              backgroundColor: isLarger ? '#10b981' : '#f59e0b'
            }}
          />
        </div>

        <div style={styles.percentage}>
          {comparison.percentage < 1
            ? 'Less than 1%'
            : comparison.percentage > 100
              ? `${(comparison.percentage / 100).toFixed(1)}x your land size`
              : `${comparison.percentage.toFixed(1)}% of your land`
          }
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

const styles = {
  // Collapsed state - compact single-line button
  collapsedSection: {
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb'
  },

  expandButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    minHeight: '48px', // Touch-friendly
    backgroundColor: '#f9fafb',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
  },

  expandIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1
  },

  expandText: {
    flex: 1,
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151'
  },

  chevron: {
    fontSize: '12px',
    color: '#9ca3af',
    transition: 'transform 200ms ease'
  },

  // Expanded state
  calculationsSection: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb'
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },

  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1
  },

  sectionTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 700,
    color: '#1f2937'
  },

  collapseButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#6b7280',
    transition: 'all 200ms ease',
    outline: 'none'
  },

  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    transition: 'transform 300ms ease',
    outline: 'none'
  },

  totalArea: {
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    padding: '8px',
    marginBottom: '10px',
    textAlign: 'center' as const,
    border: '1px solid #e5e7eb'
  },

  totalLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontWeight: 600
  },

  totalValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1f2937'
  },

  comparisonsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },

  comparisonItem: {
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    padding: '8px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb'
  },

  comparisonHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },

  objectName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1f2937'
  },

  quantity: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '4px'
  },

  comparisonDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },

  description: {
    fontSize: '12px',
    color: '#4b5563',
    lineHeight: 1.4
  },

  visualBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden'
  },

  progressBar: {
    height: '100%',
    transition: 'width 300ms ease',
    borderRadius: '3px'
  },

  percentage: {
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'right' as const
  },

  emptyState: {
    padding: '12px 16px',
    textAlign: 'center' as const,
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    marginTop: 'auto'
  },

  emptyIcon: {
    fontSize: '32px',
    marginBottom: '12px',
    opacity: 0.5
  },

  emptyText: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '4px'
  },

  emptyHint: {
    fontSize: '12px',
    color: '#9ca3af'
  },

  lastUpdated: {
    fontSize: '10px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb'
  }
};