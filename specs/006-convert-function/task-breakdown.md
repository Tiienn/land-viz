# Task Breakdown: Convert Function - Production Implementation
**Spec ID**: 006-enhanced-tasks
**Feature**: Unit Conversion Tool
**Generated**: 2025-01-21
**Total Estimated Time**: 21 hours

## Prerequisites Checklist

### Environment Setup
- [ ] Development server running (`npm run dev`)
- [ ] TypeScript compilation working (`npx tsc --noEmit`)
- [ ] Existing Zustand store accessible
- [ ] Left sidebar system operational
- [ ] Git branch created: `feature/convert-function`

### Current State Validation
- [ ] `app/src/store/useAppStore.ts` exists and is functional
- [ ] `app/src/components/Layout/LeftSidebar.tsx` exists
- [ ] `app/src/App.tsx` toolbar section identified
- [ ] No existing conversion-related types or services
- [ ] Mobile responsive system working at 768px breakpoint

---

## Phase 1: Foundation & Service Layer (4 hours)

### Task 1.1: Create Type Definitions
**File:** `app/src/types/conversion.ts`
**Estimated Time:** 45 minutes
**Dependencies:** None
**Priority:** Critical

**Implementation:**
```typescript
// app/src/types/conversion.ts
export type AreaUnit = 'sqm' | 'sqft' | 'acres' | 'hectares' | 'sqkm' | 'sqmi';

export interface ValidationRules {
  readonly minValue: number;
  readonly maxValue: number;
  readonly maxPrecision: number;
  readonly allowScientific: boolean;
}

export interface ConversionConfig {
  readonly factors: Record<AreaUnit, number>;
  readonly displayNames: Record<AreaUnit, string>;
  readonly precision: Record<AreaUnit, number>;
  readonly validationRules: ValidationRules;
}

export interface ConversionResult {
  readonly value: number;
  readonly unit: AreaUnit;
  readonly formatted: string;
  readonly displayName: string;
  readonly precision: number;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
  readonly normalizedValue?: number;
  readonly warnings?: string[];
}

export interface ConversionOptions {
  readonly precision?: number;
  readonly format?: 'standard' | 'scientific';
}

export interface ConversionState {
  panelExpanded: boolean;
  currentInputValue: string;
  currentInputUnit: AreaUnit;
  lastValidValue: number | null;
  conversionResults: ConversionResult[];
  preferences: ConversionPreferences;
  isCalculating: boolean;
  lastError: string | null;
  performanceMetrics: ConversionMetrics;
}

export interface ConversionPreferences {
  defaultUnit: AreaUnit;
  autoClipboard: boolean;
  showTooltips: boolean;
  precisionMode: 'adaptive' | 'fixed';
}

export interface ConversionMetrics {
  averageCalculationTime: number;
  totalConversions: number;
  cacheHitRate: number;
}
```

**Validation Checklist:**
- [ ] All types compile without TypeScript errors
- [ ] Readonly properties prevent mutations
- [ ] All interfaces exported properly
- [ ] No circular dependencies
- [ ] Types align with existing project patterns

### Task 1.2: Create Conversion Service Core
**File:** `app/src/services/conversionService.ts`
**Estimated Time:** 2 hours
**Dependencies:** Task 1.1
**Priority:** Critical

**Implementation:**
```typescript
// app/src/services/conversionService.ts
import type {
  AreaUnit,
  ConversionConfig,
  ConversionResult,
  ConversionOptions,
  ValidationResult
} from '../types/conversion';

const CONVERSION_CONFIG: ConversionConfig = {
  factors: {
    sqm: 1,                    // Base unit (meters squared)
    sqft: 10.7639104167097,   // NIST certified conversion
    acres: 0.0002471053814672, // Exact US survey acre
    hectares: 0.0001,         // Metric definition
    sqkm: 0.000001,           // Metric definition
    sqmi: 3.861021585424458e-7 // US survey mile squared
  },

  displayNames: {
    sqm: 'm²',
    sqft: 'ft²',
    acres: 'acres',
    hectares: 'ha',
    sqkm: 'km²',
    sqmi: 'mi²'
  },

  precision: {
    sqm: 2,
    sqft: 1,
    acres: 3,
    hectares: 4,
    sqkm: 6,
    sqmi: 8
  },

  validationRules: {
    minValue: 0.0001,        // 0.1 cm²
    maxValue: 1e12,          // 1 million km²
    maxPrecision: 8,
    allowScientific: true
  }
};

export class ConversionService {
  private static readonly config = CONVERSION_CONFIG;
  private static cache = new Map<string, ConversionResult[]>();
  private static performanceMetrics = {
    calculationCount: 0,
    totalTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  static convertFromSquareMeters(
    value: number,
    targetUnit: AreaUnit,
    options: ConversionOptions = {}
  ): ConversionResult {
    const startTime = performance.now();

    try {
      this.validateNumericInput(value);

      const factor = this.config.factors[targetUnit];
      const convertedValue = value * factor;
      const precision = options.precision ?? this.getOptimalPrecision(convertedValue, targetUnit);

      const result: ConversionResult = {
        value: convertedValue,
        unit: targetUnit,
        formatted: this.formatValue(convertedValue, precision, options.format),
        displayName: this.config.displayNames[targetUnit],
        precision
      };

      this.updatePerformanceMetrics(performance.now() - startTime);
      return result;
    } catch (error) {
      console.error('Conversion error:', error);
      throw error;
    }
  }

  static convertToSquareMeters(value: number, sourceUnit: AreaUnit): number {
    this.validateNumericInput(value);
    return value / this.config.factors[sourceUnit];
  }

  static getAllConversions(
    value: number,
    sourceUnit: AreaUnit,
    options: ConversionOptions = {}
  ): ConversionResult[] {
    const cacheKey = `${value}-${sourceUnit}-${JSON.stringify(options)}`;

    if (this.cache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++;
      return this.cache.get(cacheKey)!;
    }

    this.performanceMetrics.cacheMisses++;

    const squareMeters = this.convertToSquareMeters(value, sourceUnit);
    const results = Object.keys(this.config.factors).map(unit => {
      return this.convertFromSquareMeters(squareMeters, unit as AreaUnit, options);
    });

    // LRU cache management
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, results);

    return results;
  }

  static validateInput(input: string): ValidationResult {
    const trimmed = input.trim();

    if (!trimmed) {
      return { isValid: false, error: 'Please enter a value' };
    }

    const numeric = this.parseNumericInput(trimmed);

    if (isNaN(numeric)) {
      return { isValid: false, error: 'Please enter a valid number' };
    }

    if (numeric < 0) {
      return { isValid: false, error: 'Value must be positive' };
    }

    const { minValue, maxValue } = this.config.validationRules;

    if (numeric < minValue) {
      return {
        isValid: false,
        error: `Value too small (minimum: ${minValue} m²)`
      };
    }

    if (numeric > maxValue) {
      return {
        isValid: false,
        error: `Value too large (maximum: ${maxValue.toExponential(2)} m²)`
      };
    }

    const warnings: string[] = [];
    if (numeric > 1e9) {
      warnings.push('Very large area - consider using km² or mi²');
    }

    return {
      isValid: true,
      normalizedValue: numeric,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private static parseNumericInput(input: string): number {
    const normalized = input
      .replace(/,/g, '')
      .replace(/\s/g, '')
      .toLowerCase();

    return parseFloat(normalized);
  }

  private static getOptimalPrecision(value: number, unit: AreaUnit): number {
    const basePrecision = this.config.precision[unit];

    if (value >= 1000) return Math.max(0, basePrecision - 2);
    if (value >= 100) return Math.max(0, basePrecision - 1);
    if (value >= 10) return basePrecision;
    if (value >= 1) return basePrecision + 1;

    return Math.min(8, basePrecision + 2);
  }

  private static formatValue(
    value: number,
    precision: number,
    format: 'standard' | 'scientific' = 'standard'
  ): string {
    if (format === 'scientific' || value >= 1e6) {
      return value.toExponential(precision);
    }

    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision
    });
  }

  private static validateNumericInput(value: number): void {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid numeric input: ${value}`);
    }
  }

  private static updatePerformanceMetrics(duration: number): void {
    this.performanceMetrics.calculationCount++;
    this.performanceMetrics.totalTime += duration;
  }

  static getPerformanceMetrics() {
    const { calculationCount, totalTime, cacheHits, cacheMisses } = this.performanceMetrics;
    return {
      averageCalculationTime: calculationCount > 0 ? totalTime / calculationCount : 0,
      totalCalculations: calculationCount,
      cacheHitRate: (cacheHits + cacheMisses) > 0 ? cacheHits / (cacheHits + cacheMisses) : 0,
      cacheSize: this.cache.size
    };
  }

  static clearCache(): void {
    this.cache.clear();
  }
}
```

**Validation Checklist:**
- [ ] All conversions accurate to 0.01% (test with known values)
- [ ] Input validation handles all edge cases
- [ ] Performance under 10ms per conversion
- [ ] Cache working properly (hit rate >80% with repeated values)
- [ ] Error handling graceful for all failure modes
- [ ] No memory leaks in cache implementation

### Task 1.3: Create Utility Functions
**File:** `app/src/utils/conversionUtils.ts`
**Estimated Time:** 45 minutes
**Dependencies:** Task 1.1, Task 1.2
**Priority:** High

**Implementation:**
```typescript
// app/src/utils/conversionUtils.ts
import type { AreaUnit } from '../types/conversion';
import { ConversionService } from '../services/conversionService';

export class ConversionUtils {
  /**
   * Debounce function with proper typing
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Copy to clipboard with comprehensive fallback
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        return this.fallbackCopyToClipboard(text);
      }
    } catch (error) {
      console.warn('Clipboard copy failed:', error);
      return this.fallbackCopyToClipboard(text);
    }
  }

  private static fallbackCopyToClipboard(text: string): boolean {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-9999px';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textArea);

      return success;
    } catch (error) {
      console.error('Fallback clipboard copy failed:', error);
      return false;
    }
  }

  /**
   * Format area value with unit
   */
  static formatArea(area: number, unit: AreaUnit): string {
    const conversion = ConversionService.convertFromSquareMeters(area, unit);
    return `${conversion.formatted} ${conversion.displayName}`;
  }

  /**
   * Mobile detection utility
   */
  static detectMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Generate accessible labels for screen readers
   */
  static generateAccessibleLabel(
    value: string,
    unit: string,
    action: 'copy' | 'display' = 'display'
  ): string {
    const actionText = action === 'copy' ? 'Copy' : 'Area is';
    return `${actionText} ${value} ${unit}`;
  }

  /**
   * Validate if viewport is mobile-sized
   */
  static isMobileViewport(): boolean {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  /**
   * Throttle function for performance-critical operations
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}
```

**Validation Checklist:**
- [ ] Debounce function works correctly with different delays
- [ ] Clipboard functionality works in all target browsers
- [ ] Fallback clipboard works when main API fails
- [ ] Mobile detection accurate across devices
- [ ] Accessible labels generate properly
- [ ] All utility functions have proper TypeScript types

### Task 1.4: Create Unit Tests for Foundation
**File:** `app/src/services/__tests__/conversionService.test.ts`
**Estimated Time:** 30 minutes
**Dependencies:** Tasks 1.1-1.3
**Priority:** High

**Implementation:**
```typescript
// app/src/services/__tests__/conversionService.test.ts
import { ConversionService } from '../conversionService';

describe('ConversionService', () => {
  beforeEach(() => {
    ConversionService.clearCache();
  });

  describe('convertFromSquareMeters', () => {
    it('converts square meters to square feet correctly', () => {
      const result = ConversionService.convertFromSquareMeters(1, 'sqft');
      expect(result.value).toBeCloseTo(10.7639, 4);
      expect(result.unit).toBe('sqft');
      expect(result.displayName).toBe('ft²');
    });

    it('converts square meters to acres correctly', () => {
      const result = ConversionService.convertFromSquareMeters(4047, 'acres');
      expect(result.value).toBeCloseTo(1, 3);
    });

    it('handles edge cases properly', () => {
      expect(() => ConversionService.convertFromSquareMeters(Infinity, 'sqft')).toThrow();
      expect(() => ConversionService.convertFromSquareMeters(NaN, 'sqft')).toThrow();
    });
  });

  describe('validateInput', () => {
    it('validates positive numbers', () => {
      const result = ConversionService.validateInput('100');
      expect(result.isValid).toBe(true);
      expect(result.normalizedValue).toBe(100);
    });

    it('rejects invalid inputs', () => {
      expect(ConversionService.validateInput('abc').isValid).toBe(false);
      expect(ConversionService.validateInput('-1').isValid).toBe(false);
      expect(ConversionService.validateInput('').isValid).toBe(false);
    });

    it('handles scientific notation', () => {
      const result = ConversionService.validateInput('1.5e4');
      expect(result.isValid).toBe(true);
      expect(result.normalizedValue).toBe(15000);
    });

    it('detects values outside bounds', () => {
      expect(ConversionService.validateInput('0.00001').isValid).toBe(false);
      expect(ConversionService.validateInput('1e15').isValid).toBe(false);
    });
  });

  describe('performance and caching', () => {
    it('caches conversion results', () => {
      const value1 = ConversionService.getAllConversions(1000, 'sqm');
      const value2 = ConversionService.getAllConversions(1000, 'sqm');

      const metrics = ConversionService.getPerformanceMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });

    it('completes conversions under time limit', () => {
      const start = performance.now();
      ConversionService.getAllConversions(1000, 'sqm');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // 50ms limit
    });
  });
});
```

**Validation Checklist:**
- [ ] All tests pass consistently
- [ ] Performance tests verify <50ms calculation time
- [ ] Edge cases covered (infinity, NaN, bounds)
- [ ] Cache functionality tested
- [ ] Error handling tested

---

## Phase 2: State Management Integration (2 hours)

### Task 2.1: Extend Zustand Store
**File:** `app/src/store/useAppStore.ts`
**Estimated Time:** 1.5 hours
**Dependencies:** Phase 1 complete
**Priority:** Critical

**Implementation:**
First, check the existing store structure:
```typescript
// Add to existing app/src/store/useAppStore.ts

import type {
  ConversionState,
  AreaUnit,
  ConversionPreferences
} from '../types/conversion';
import { ConversionService } from '../services/conversionService';

// Add to existing AppState interface
interface AppState {
  // ... existing state properties

  // Conversion state
  conversion: ConversionState;

  // Conversion actions
  toggleConvertPanel: () => void;
  setConversionInput: (value: string, unit?: AreaUnit) => void;
  clearConversion: () => void;
  updateConversionPreferences: (preferences: Partial<ConversionPreferences>) => void;
}

// Add to existing store implementation
const useAppStore = create<AppState>()((set, get) => ({
  // ... existing state and actions

  // Conversion state initialization
  conversion: {
    panelExpanded: false,
    currentInputValue: '',
    currentInputUnit: 'sqm',
    lastValidValue: null,
    conversionResults: [],
    preferences: {
      defaultUnit: 'sqm',
      autoClipboard: false,
      showTooltips: true,
      precisionMode: 'adaptive'
    },
    isCalculating: false,
    lastError: null,
    performanceMetrics: {
      averageCalculationTime: 0,
      totalConversions: 0,
      cacheHitRate: 0
    }
  },

  // Conversion actions
  toggleConvertPanel: () => {
    set((state) => ({
      conversion: {
        ...state.conversion,
        panelExpanded: !state.conversion.panelExpanded
      }
    }));
  },

  setConversionInput: (value: string, unit: AreaUnit = 'sqm') => {
    const startTime = performance.now();

    set((state) => {
      try {
        const validation = ConversionService.validateInput(value);
        const conversionResults = validation.isValid && validation.normalizedValue
          ? ConversionService.getAllConversions(validation.normalizedValue, unit)
          : [];

        const calculationTime = performance.now() - startTime;
        const currentMetrics = state.conversion.performanceMetrics;

        return {
          conversion: {
            ...state.conversion,
            currentInputValue: value,
            currentInputUnit: unit,
            lastValidValue: validation.normalizedValue || null,
            conversionResults,
            lastError: validation.error || null,
            isCalculating: false,
            performanceMetrics: {
              averageCalculationTime: currentMetrics.totalConversions > 0
                ? (currentMetrics.averageCalculationTime + calculationTime) / 2
                : calculationTime,
              totalConversions: currentMetrics.totalConversions + 1,
              cacheHitRate: ConversionService.getPerformanceMetrics().cacheHitRate
            }
          }
        };
      } catch (error) {
        console.error('Conversion state update error:', error);
        return {
          conversion: {
            ...state.conversion,
            currentInputValue: value,
            lastError: 'Calculation error occurred',
            isCalculating: false
          }
        };
      }
    });
  },

  clearConversion: () => {
    set((state) => ({
      conversion: {
        ...state.conversion,
        currentInputValue: '',
        lastValidValue: null,
        conversionResults: [],
        lastError: null
      }
    }));
  },

  updateConversionPreferences: (preferences: Partial<ConversionPreferences>) => {
    set((state) => ({
      conversion: {
        ...state.conversion,
        preferences: {
          ...state.conversion.preferences,
          ...preferences
        }
      }
    }));
  }
}));
```

**Validation Checklist:**
- [ ] Store compiles without TypeScript errors
- [ ] State updates trigger component re-renders
- [ ] No state mutations outside of actions
- [ ] Performance metrics update correctly
- [ ] Error handling doesn't break store
- [ ] Actions follow existing store patterns

### Task 2.2: Create Store Unit Tests
**File:** `app/src/store/__tests__/conversionStore.test.ts`
**Estimated Time:** 30 minutes
**Dependencies:** Task 2.1
**Priority:** Medium

**Implementation:**
```typescript
// app/src/store/__tests__/conversionStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../useAppStore';

describe('Conversion Store', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      conversion: {
        panelExpanded: false,
        currentInputValue: '',
        currentInputUnit: 'sqm',
        lastValidValue: null,
        conversionResults: [],
        preferences: {
          defaultUnit: 'sqm',
          autoClipboard: false,
          showTooltips: true,
          precisionMode: 'adaptive'
        },
        isCalculating: false,
        lastError: null,
        performanceMetrics: {
          averageCalculationTime: 0,
          totalConversions: 0,
          cacheHitRate: 0
        }
      }
    });
  });

  it('toggles convert panel correctly', () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.conversion.panelExpanded).toBe(false);

    act(() => {
      result.current.toggleConvertPanel();
    });

    expect(result.current.conversion.panelExpanded).toBe(true);
  });

  it('processes valid input correctly', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setConversionInput('1000', 'sqm');
    });

    expect(result.current.conversion.currentInputValue).toBe('1000');
    expect(result.current.conversion.lastValidValue).toBe(1000);
    expect(result.current.conversion.conversionResults.length).toBeGreaterThan(0);
    expect(result.current.conversion.lastError).toBeNull();
  });

  it('handles invalid input gracefully', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setConversionInput('invalid');
    });

    expect(result.current.conversion.lastValidValue).toBeNull();
    expect(result.current.conversion.conversionResults).toHaveLength(0);
    expect(result.current.conversion.lastError).toBeTruthy();
  });

  it('clears conversion state', () => {
    const { result } = renderHook(() => useAppStore());

    // Set some data first
    act(() => {
      result.current.setConversionInput('1000');
    });

    // Clear it
    act(() => {
      result.current.clearConversion();
    });

    expect(result.current.conversion.currentInputValue).toBe('');
    expect(result.current.conversion.lastValidValue).toBeNull();
    expect(result.current.conversion.conversionResults).toHaveLength(0);
  });
});
```

**Validation Checklist:**
- [ ] All store tests pass
- [ ] State mutations work correctly
- [ ] Error handling tested
- [ ] Performance metrics update during tests

---

## Phase 3: Component Implementation (8 hours)

### Task 3.1: Create ConversionInput Component
**File:** `app/src/components/ConvertPanel/ConversionInput.tsx`
**Estimated Time:** 2.5 hours
**Dependencies:** Phase 1, 2 complete
**Priority:** Critical

**Implementation:**
```typescript
// app/src/components/ConvertPanel/ConversionInput.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ConversionService } from '../../services/conversionService';
import { ConversionUtils } from '../../utils/conversionUtils';
import type { AreaUnit, ValidationResult } from '../../types/conversion';

interface ConversionInputProps {
  value: string;
  unit: AreaUnit;
  onChange: (value: string, unit: AreaUnit) => void;
  onClear: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const ConversionInput: React.FC<ConversionInputProps> = ({
  value,
  unit,
  onChange,
  onClear,
  disabled = false,
  autoFocus = false
}) => {
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced validation
  const debouncedValidation = useCallback(
    ConversionUtils.debounce((inputValue: string) => {
      const result = ConversionService.validateInput(inputValue);
      setValidation(result);
    }, 300),
    []
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Immediate UI update
    onChange(inputValue, unit);

    // Debounced validation
    if (!isComposing) {
      debouncedValidation(inputValue);
    }
  }, [onChange, unit, debouncedValidation, isComposing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClear();
        inputRef.current?.blur();
        break;
      case 'Enter':
        inputRef.current?.blur();
        break;
    }
  }, [onClear]);

  // Auto-focus management
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const styles = {
    container: {
      marginBottom: '16px',
      position: 'relative' as const
    },

    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 600,
      color: disabled ? '#9ca3af' : '#374151',
      marginBottom: '8px',
      fontFamily: '"Nunito Sans", sans-serif'
    },

    inputWrapper: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center'
    },

    input: {
      width: '100%',
      padding: '12px 16px',
      paddingRight: '80px',
      fontSize: '16px',
      fontFamily: '"Nunito Sans", sans-serif',
      border: `2px solid ${
        disabled
          ? '#e5e7eb'
          : validation.isValid
            ? (isFocused ? '#3b82f6' : '#e5e7eb')
            : '#ef4444'
      }`,
      borderRadius: '8px',
      backgroundColor: disabled ? '#f9fafb' : '#ffffff',
      outline: 'none',
      transition: 'all 0.2s ease',
      opacity: disabled ? 0.6 : 1
    },

    unitLabel: {
      position: 'absolute' as const,
      right: '44px',
      color: disabled ? '#9ca3af' : '#6b7280',
      fontSize: '14px',
      fontWeight: 500,
      pointerEvents: 'none' as const,
      userSelect: 'none' as const
    },

    clearButton: {
      position: 'absolute' as const,
      right: '8px',
      padding: '4px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      color: disabled ? '#d1d5db' : '#6b7280',
      fontSize: '16px',
      opacity: (value && !disabled) ? 1 : 0,
      transition: 'all 0.2s ease'
    },

    errorMessage: {
      marginTop: '4px',
      fontSize: '12px',
      color: '#ef4444',
      display: validation.isValid ? 'none' : 'block',
      fontFamily: '"Nunito Sans", sans-serif'
    }
  };

  return (
    <div style={styles.container}>
      <label style={styles.label} htmlFor="conversion-input">
        Enter Area Value
      </label>

      <div style={styles.inputWrapper}>
        <input
          ref={inputRef}
          id="conversion-input"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="Enter area value..."
          style={styles.input}
          disabled={disabled}
          aria-describedby={!validation.isValid ? "input-error" : undefined}
          aria-invalid={!validation.isValid}
          autoComplete="off"
          spellCheck={false}
        />

        <span style={styles.unitLabel}>m²</span>

        <button
          type="button"
          onClick={onClear}
          style={styles.clearButton}
          aria-label="Clear input"
          tabIndex={value && !disabled ? 0 : -1}
          disabled={disabled}
        >
          ✕
        </button>
      </div>

      {!validation.isValid && (
        <div id="input-error" style={styles.errorMessage} role="alert">
          {validation.error}
        </div>
      )}
    </div>
  );
};
```

**Validation Checklist:**
- [ ] Input accepts only valid numeric values
- [ ] Validation errors display immediately and clearly
- [ ] Clear button works and has proper accessibility
- [ ] Keyboard navigation (Tab, Enter, Escape) works
- [ ] Auto-focus works when enabled
- [ ] Component follows inline styling requirements
- [ ] ARIA attributes are correct
- [ ] Mobile input type optimized

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Generate task breakdown from enhanced implementation plan", "status": "completed", "activeForm": "Generating task breakdown from enhanced implementation plan"}, {"content": "Create detailed tasks with code examples and validation criteria", "status": "in_progress", "activeForm": "Creating detailed tasks with code examples and validation criteria"}, {"content": "Add time estimates and dependency mapping", "status": "pending", "activeForm": "Adding time estimates and dependency mapping"}]