/**
 * Convert Panel Component - Professional unit conversion tool for area measurements
 * Redesigned to match the modern design standards of Compare and Layers panels
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ConversionService } from '../../services/conversionService';
import { debounce } from '../../utils/conversionUtils';
import { logger } from '../../utils/logger';
import type { AreaUnit, ConversionResult } from '../../types/conversion';
import { ConversionInput } from './ConversionInput';
import { ConversionGrid } from './ConversionGrid';

interface ConvertPanelProps {
  /** Whether the panel is expanded */
  expanded: boolean;
  /** Callback when panel toggle is triggered */
  onToggle: () => void;
  /** Whether the panel is displayed inline (in sidebar) */
  inline?: boolean;
}

// Modern styles following Compare/Layers panel design standards
const styles = {
  // Main panel container with modern design
  panel: {
    height: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const
  },

  // Professional header matching Compare/Layers panels
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fafafa',
    flexShrink: 0
  },

  // Title with icon and consistent typography
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  // Icon styling matching other panels
  titleIcon: {
    color: '#6b7280',
    flexShrink: 0
  },

  // Close button with professional styling
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 200ms ease',
    lineHeight: 1,
    fontWeight: 300
  },

  // Content area with proper scrolling
  content: {
    overflow: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '20px'
  },

  // Improved content sections
  section: {
    marginBottom: '24px'
  },

  // Modern error styling
  errorMessage: {
    color: '#ef4444',
    fontSize: '14px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  // Results section header
  resultsHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  // Action buttons area
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
    marginTop: '24px'
  },

  // Modern clear button
  clearButton: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },

  // Help text with modern styling
  helpText: {
    fontSize: '13px',
    color: '#6b7280',
    textAlign: 'center' as const,
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px dashed #d1d5db',
    fontStyle: 'italic'
  },

  // Status indicator
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#6b7280',
    padding: '8px 0'
  },

  // Empty state styling
  emptyState: {
    textAlign: 'center' as const,
    padding: '32px 16px',
    color: '#6b7280'
  },

  emptyStateIcon: {
    fontSize: '32px',
    marginBottom: '12px',
    opacity: 0.6
  },

  emptyStateText: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '4px'
  },

  emptyStateSubtext: {
    fontSize: '12px',
    opacity: 0.8
  }
};

/**
 * Convert Panel - Professional unit conversion tool with modern design
 * Matches the visual standards of Compare and Layers panels
 */
export function ConvertPanel({ expanded, onToggle, inline = true }: ConvertPanelProps) {
  // Store state
  const {
    conversion,
    setInputValue,
    setInputUnit,
    clearConversion,
    setInputError,
  } = useAppStore();

  // Local state for enhanced functionality
  const [conversions, setConversions] = useState<ConversionResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copiedUnit, setCopiedUnit] = useState<AreaUnit | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  /**
   * Debounced conversion calculation to avoid excessive computations
   */
  const debouncedCalculateConversions = useCallback(
    debounce((value: string, unit: AreaUnit) => {
      setIsCalculating(true);

      try {
        const validation = ConversionService.validateInput(value);

        if (!validation.isValid) {
          setInputError(validation.error || 'Invalid input');
          setConversions([]);
          return;
        }

        if (validation.value === 0) {
          setConversions([]);
          setInputError(null);
          return;
        }

        const results = ConversionService.convertToAllUnits(validation.value!, unit);
        setConversions(results);
        setInputError(null);

        logger.debug(`Calculated conversions for ${validation.value} ${unit}:`, results);
      } catch (error) {
        logger.error('Error calculating conversions:', error);
        setInputError('Calculation error occurred');
        setConversions([]);
      } finally {
        setIsCalculating(false);
      }
    }, 300),
    []
  );

  /**
   * Effect to trigger conversions when input changes
   */
  useEffect(() => {
    if (conversion.currentInputValue.trim()) {
      debouncedCalculateConversions(conversion.currentInputValue, conversion.currentInputUnit);
    } else {
      setConversions([]);
      setInputError(null);
    }
  }, [conversion.currentInputValue, conversion.currentInputUnit, debouncedCalculateConversions]);

  /**
   * Handle input value changes
   */
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, [setInputValue]);

  /**
   * Handle input unit changes
   */
  const handleUnitChange = useCallback((unit: AreaUnit) => {
    setInputUnit(unit);
  }, [setInputUnit]);

  /**
   * Handle clear button click
   */
  const handleClear = useCallback(() => {
    clearConversion();
    setConversions([]);
    setCopiedUnit(null);
  }, [clearConversion]);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = useCallback(async (value: string, unit: AreaUnit) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedUnit(unit);

      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedUnit(null), 2000);

      logger.debug(`Copied to clipboard: ${value}`);
    } catch (error) {
      logger.warn('Failed to copy to clipboard:', error);

      // Fallback for browsers without clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedUnit(unit);
        setTimeout(() => setCopiedUnit(null), 2000);
      } catch (fallbackError) {
        logger.error('Clipboard fallback failed:', fallbackError);
      }
    }
  }, []);

  if (!expanded) {
    return null;
  }

  const hasInput = conversion.currentInputValue.trim();
  const hasResults = conversions.length > 0;

  return (
    <div style={styles.panel}>
      {/* Professional Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>
          Unit Converter
        </h3>
        <button
          style={styles.closeButton}
          onClick={onToggle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={inline ? "Collapse converter panel" : "Close converter panel"}
        >
          {inline ? '◀' : '×'}
        </button>
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {/* Input Section */}
        <div style={styles.section}>
          <ConversionInput
            value={conversion.currentInputValue}
            unit={conversion.currentInputUnit}
            error={conversion.inputError}
            isCalculating={isCalculating}
            onChange={handleInputChange}
            onUnitChange={handleUnitChange}
          />


          {/* Error Message */}
          {conversion.inputError && (
            <div style={styles.errorMessage} role="alert" aria-live="polite">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {conversion.inputError}
            </div>
          )}
        </div>

        {/* Results Section */}
        {hasResults ? (
          <div style={styles.section}>
            <div style={styles.resultsHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11H1l2-2m0 4l-2-2"/>
                <path d="M23 12H15l2-2m0 4l-2-2"/>
                <path d="M8 3H3l2-2m0 4L3 3"/>
                <path d="M21 21h-5l2-2m0 4l-2-2"/>
              </svg>
              Converted Values ({conversions.length} units)
            </div>
            <ConversionGrid
              conversions={conversions}
              copiedUnit={copiedUnit}
              onCopy={handleCopy}
            />
          </div>
        ) : hasInput && !isCalculating ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>🔄</div>
            <div style={styles.emptyStateText}>Processing conversion...</div>
            <div style={styles.emptyStateSubtext}>Please wait a moment</div>
          </div>
        ) : null}

        {/* Actions Section */}
        {hasInput && (
          <div style={styles.actions}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              All conversions are calculated instantly
            </div>
            <button
              style={{
                ...styles.clearButton,
                ...(isHovered ? {
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                } : {})
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleClear}
              aria-label="Clear all input and results"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConvertPanel;