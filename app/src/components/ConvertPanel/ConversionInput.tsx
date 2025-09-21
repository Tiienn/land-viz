/**
 * Conversion Input Component - Professional input field with unit selector
 * Redesigned with modern styling matching the updated Convert Panel design
 */

import React, { useState, useCallback } from 'react';
import { sanitizeInput, UNIT_CONFIGS } from '../../utils/conversionUtils';
import type { AreaUnit } from '../../types/conversion';

interface ConversionInputProps {
  /** Current input value */
  value: string;
  /** Current input unit */
  unit: AreaUnit;
  /** Error message to display */
  error: string | null;
  /** Whether conversion is being calculated */
  isCalculating: boolean;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Callback when unit changes */
  onUnitChange: (unit: AreaUnit) => void;
}

// Modern styles with improved visual hierarchy
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  // Section label with professional styling
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  labelIcon: {
    color: '#6b7280',
    flexShrink: 0
  },

  // Input row with improved layout
  inputRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },

  // Input container with relative positioning
  inputContainer: {
    flex: '1',
    position: 'relative' as const,
  },

  // Enhanced input field styling
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    outline: 'none',
    transition: 'all 200ms ease',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
    fontWeight: '500'
  } as const,

  inputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    backgroundColor: '#fafbff'
  } as const,

  inputError: {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    backgroundColor: '#fefbfb'
  } as const,

  inputCalculating: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  } as const,

  // Professional unit selector
  unitSelector: {
    padding: '14px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    backgroundColor: '#f8fafc',
    color: '#374151',
    fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 200ms ease',
    minWidth: '100px',
    boxSizing: 'border-box' as const
  } as const,

  unitSelectorFocus: {
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  } as const,

  // Status indicators
  statusIndicator: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '500',
    pointerEvents: 'none' as const
  },

  calculatingIndicator: {
    color: '#f59e0b',
  },

  validIndicator: {
    color: '#10b981',
  },

  // Help text for better UX
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },

  // Unit info display
  unitInfo: {
    fontSize: '11px',
    color: '#9ca3af',
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    marginTop: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  // Accessibility improvements
  visuallyHidden: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0'
  }
};

/**
 * Conversion Input - Professional input field with unit selector for area conversions
 */
export function ConversionInput({
  value,
  unit,
  error,
  isCalculating,
  onChange,
  onUnitChange,
}: ConversionInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isUnitFocused, setIsUnitFocused] = useState(false);

  /**
   * Handle input value changes with sanitization
   */
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const sanitizedValue = sanitizeInput(rawValue);
    onChange(sanitizedValue);
  }, [onChange]);

  /**
   * Handle unit selection changes
   */
  const handleUnitChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = event.target.value as AreaUnit;
    onUnitChange(newUnit);
  }, [onUnitChange]);

  /**
   * Get input styles based on current state
   */
  const getInputStyles = () => {
    const baseStyles = { ...styles.input };

    if (error) {
      return { ...baseStyles, ...styles.inputError };
    }

    if (isCalculating) {
      return { ...baseStyles, ...styles.inputCalculating };
    }

    if (isFocused) {
      return { ...baseStyles, ...styles.inputFocus };
    }

    return baseStyles;
  };

  /**
   * Get unit selector styles based on state
   */
  const getUnitSelectorStyles = () => {
    const baseStyles = { ...styles.unitSelector };

    if (isUnitFocused) {
      return { ...baseStyles, ...styles.unitSelectorFocus };
    }

    return baseStyles;
  };

  /**
   * Get status indicator based on current state
   */
  const getStatusIndicator = () => {
    if (isCalculating) {
      return (
        <div style={{ ...styles.statusIndicator, ...styles.calculatingIndicator }}>
          <span>⏳</span>
        </div>
      );
    }

    if (value.trim() && !error) {
      return (
        null
      );
    }

    return null;
  };

  const allUnits: AreaUnit[] = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm', 'sqmi', 'toise', 'perches', 'perches-mauritius', 'arpent-na', 'arpent-paris', 'arpent-mauritius'];
  const currentUnitConfig = UNIT_CONFIGS[unit];

  return (
    <div style={styles.container}>
      {/* Section Label */}
      <div style={styles.label}>
        Enter Area Value
      </div>

      {/* Input Row */}
      <div style={styles.inputRow}>
        <div style={styles.inputContainer}>
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={getInputStyles()}
            placeholder="Enter area value..."
            aria-label="Area value to convert"
            aria-describedby={error ? "conversion-error" : "conversion-help"}
            aria-invalid={!!error}
            min="0"
            step="any"
          />
          {getStatusIndicator()}
        </div>

        <select
          value={unit}
          onChange={handleUnitChange}
          onFocus={() => setIsUnitFocused(true)}
          onBlur={() => setIsUnitFocused(false)}
          style={getUnitSelectorStyles()}
          aria-label="Input unit"
        >
          {allUnits.map((unitOption) => (
            <option key={unitOption} value={unitOption}>
              {UNIT_CONFIGS[unitOption].symbol}
            </option>
          ))}
        </select>
      </div>



      {/* Screen reader helper text */}
      <div style={styles.visuallyHidden} id="conversion-error" aria-live="polite">
        {error ? `Error: ${error}` : ''}
      </div>
    </div>
  );
}