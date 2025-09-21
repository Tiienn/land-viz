# Task Breakdown: Convert Function
**Spec ID**: 006
**Feature**: Unit Conversion Tool
**Date**: 2025-01-21
**Total Estimated Time**: 16-20 hours

## Task Overview

This breakdown provides actionable tasks with time estimates, code examples, and validation criteria for implementing the Convert function feature.

## Phase 1: Foundation & Types (3-4 hours)

### Task 1.1: Create Type Definitions
**Time Estimate**: 1 hour
**Priority**: High
**Complexity**: Low

**Description**: Define TypeScript interfaces for conversion system

**Implementation**:
```typescript
// app/src/types/conversion.ts
export type AreaUnit = 'sqm' | 'sqft' | 'acres' | 'hectares' | 'sqkm' | 'sqmi';

export interface ConversionResult {
  value: number;
  unit: AreaUnit;
  formatted: string;
  displayName: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedValue?: number;
}

export interface ConversionState {
  convertPanelExpanded: boolean;
  currentInputValue: string;
  currentInputUnit: AreaUnit;
  lastValidValue: number | null;
}

export interface ConversionConfig {
  maxValue: number;
  minValue: number;
  precision: Record<AreaUnit, number>;
  displayNames: Record<AreaUnit, string>;
}
```

**Validation Criteria**:
- [ ] All types compile without errors
- [ ] Types align with existing project patterns
- [ ] JSDoc comments added for complex interfaces

### Task 1.2: Create Conversion Service
**Time Estimate**: 2-3 hours
**Priority**: High
**Complexity**: Medium

**Description**: Implement core conversion logic with comprehensive testing

**Implementation**:
```typescript
// app/src/services/conversionService.ts
const CONVERSION_FACTORS: Record<AreaUnit, number> = {
  sqm: 1,                    // Base unit
  sqft: 10.7639,            // Square feet per square meter
  acres: 0.000247105,       // Acres per square meter
  hectares: 0.0001,         // Hectares per square meter
  sqkm: 0.000001,           // Square kilometers per square meter
  sqmi: 3.861e-7            // Square miles per square meter
};

const DISPLAY_NAMES: Record<AreaUnit, string> = {
  sqm: 'm²',
  sqft: 'ft²',
  acres: 'acres',
  hectares: 'hectares',
  sqkm: 'km²',
  sqmi: 'mi²'
};

export class ConversionService {
  static convertFromSquareMeters(value: number, targetUnit: AreaUnit): number {
    if (value < 0 || !isFinite(value)) return 0;
    return value * CONVERSION_FACTORS[targetUnit];
  }

  static convertToSquareMeters(value: number, sourceUnit: AreaUnit): number {
    if (value < 0 || !isFinite(value)) return 0;
    return value / CONVERSION_FACTORS[sourceUnit];
  }

  static validateInput(input: string): ValidationResult {
    const trimmed = input.trim();
    if (!trimmed) return { isValid: false, error: 'Please enter a value' };

    const numeric = parseFloat(trimmed);
    if (isNaN(numeric)) return { isValid: false, error: 'Please enter a valid number' };
    if (numeric < 0.01) return { isValid: false, error: 'Value too small (minimum 0.01)' };
    if (numeric > 1e9) return { isValid: false, error: 'Value too large (maximum 1 billion)' };

    return { isValid: true, normalizedValue: numeric };
  }

  static formatValue(value: number, unit: AreaUnit): string {
    const precision = this.getDisplayPrecision(value, unit);
    return value.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  }

  private static getDisplayPrecision(value: number, unit: AreaUnit): number {
    if (value >= 1000) return 0;
    if (value >= 100) return 1;
    if (value >= 10) return 2;
    return 3;
  }

  static getAllConversions(value: number, sourceUnit: AreaUnit): ConversionResult[] {
    const squareMeters = this.convertToSquareMeters(value, sourceUnit);

    return Object.keys(CONVERSION_FACTORS).map(unit => {
      const targetUnit = unit as AreaUnit;
      const convertedValue = this.convertFromSquareMeters(squareMeters, targetUnit);

      return {
        value: convertedValue,
        unit: targetUnit,
        formatted: this.formatValue(convertedValue, targetUnit),
        displayName: DISPLAY_NAMES[targetUnit]
      };
    });
  }
}
```

**Validation Criteria**:
- [ ] All conversion calculations accurate to 0.1% precision
- [ ] Input validation handles edge cases properly
- [ ] Formatting displays appropriate decimal places
- [ ] Unit tests achieve >90% coverage
- [ ] Performance benchmarks < 10ms per conversion

## Phase 2: State Management (2 hours)

### Task 2.1: Extend Zustand Store
**Time Estimate**: 2 hours
**Priority**: High
**Complexity**: Medium

**Description**: Add conversion state to existing store

**Implementation**:
```typescript
// app/src/store/useAppStore.ts - Add to existing store

interface AppState {
  // ... existing state

  // Conversion state
  convertPanelExpanded: boolean;
  currentInputValue: string;
  currentInputUnit: AreaUnit;
  lastValidValue: number | null;
}

// Add to store actions
const useAppStore = create<AppState>()((set, get) => ({
  // ... existing state and actions

  // Conversion state
  convertPanelExpanded: false,
  currentInputValue: '',
  currentInputUnit: 'sqm',
  lastValidValue: null,

  // Conversion actions
  toggleConvertPanel: () => {
    set((state) => ({
      convertPanelExpanded: !state.convertPanelExpanded
    }));
  },

  setConversionInput: (value: string, unit: AreaUnit = 'sqm') => {
    set((state) => ({
      currentInputValue: value,
      currentInputUnit: unit,
      lastValidValue: ConversionService.validateInput(value).normalizedValue || null
    }));
  },

  clearConversion: () => {
    set((state) => ({
      currentInputValue: '',
      lastValidValue: null
    }));
  }
}));
```

**Validation Criteria**:
- [ ] State updates trigger re-renders correctly
- [ ] No state mutations outside of actions
- [ ] State persists during component re-mounts
- [ ] Actions follow existing store patterns

## Phase 3: Core Components (6-8 hours)

### Task 3.1: Create ConversionInput Component
**Time Estimate**: 2 hours
**Priority**: High
**Complexity**: Medium

**Description**: Input field with validation and clear functionality

**Implementation**:
```typescript
// app/src/components/ConvertPanel/ConversionInput.tsx
import React, { useState, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ConversionService } from '../../services/conversionService';
import type { AreaUnit, ValidationResult } from '../../types/conversion';

interface ConversionInputProps {
  value: string;
  unit: AreaUnit;
  onChange: (value: string, unit: AreaUnit) => void;
  onClear: () => void;
}

export const ConversionInput: React.FC<ConversionInputProps> = ({
  value,
  unit,
  onChange,
  onClear
}) => {
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const validationResult = ConversionService.validateInput(inputValue);

    setValidation(validationResult);
    onChange(inputValue, unit);
  }, [onChange, unit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClear();
    }
  }, [onClear]);

  const styles = {
    container: {
      marginBottom: '16px'
    },

    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 600,
      color: '#374151',
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
      border: `2px solid ${validation.isValid ? (isFocused ? '#3b82f6' : '#e5e7eb') : '#ef4444'}`,
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      outline: 'none',
      transition: 'all 0.2s ease'
    },

    unitLabel: {
      position: 'absolute' as const,
      right: '44px',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: 500,
      pointerEvents: 'none' as const
    },

    clearButton: {
      position: 'absolute' as const,
      right: '8px',
      padding: '4px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      color: '#6b7280',
      fontSize: '16px',
      opacity: value ? 1 : 0,
      transition: 'all 0.2s ease'
    },

    errorMessage: {
      marginTop: '4px',
      fontSize: '12px',
      color: '#ef4444',
      display: validation.isValid ? 'none' : 'block'
    }
  };

  return (
    <div style={styles.container}>
      <label style={styles.label} htmlFor="conversion-input">
        Enter Area Value
      </label>

      <div style={styles.inputWrapper}>
        <input
          id="conversion-input"
          type="number"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter area value..."
          style={styles.input}
          aria-describedby={!validation.isValid ? "input-error" : undefined}
          aria-invalid={!validation.isValid}
        />

        <span style={styles.unitLabel}>m²</span>

        <button
          type="button"
          onClick={onClear}
          style={styles.clearButton}
          aria-label="Clear input"
          tabIndex={value ? 0 : -1}
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

**Validation Criteria**:
- [ ] Input accepts numeric values only
- [ ] Validation errors display immediately
- [ ] Clear button works correctly
- [ ] Keyboard navigation functions properly
- [ ] ARIA attributes for accessibility

### Task 3.2: Create ConversionCard Component
**Time Estimate**: 1.5 hours
**Priority**: High
**Complexity**: Low

**Description**: Individual unit display with copy functionality

**Implementation**:
```typescript
// app/src/components/ConvertPanel/ConversionCard.tsx
import React, { useState, useCallback } from 'react';
import type { ConversionResult } from '../../types/conversion';

interface ConversionCardProps {
  conversion: ConversionResult;
  onCopy?: (value: string) => void;
}

export const ConversionCard: React.FC<ConversionCardProps> = ({
  conversion,
  onCopy
}) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(conversion.formatted);
      setCopied(true);
      onCopy?.(conversion.formatted);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for browsers without clipboard API
      console.warn('Clipboard API not available');
    }
  }, [conversion.formatted, onCopy]);

  const styles = {
    card: {
      backgroundColor: copied ? '#ecfdf5' : (isHovered ? '#f9fafb' : '#ffffff'),
      border: copied ? '2px solid #10b981' : '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '60px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      position: 'relative' as const
    },

    value: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#1f2937',
      marginBottom: '4px',
      fontFamily: '"Nunito Sans", sans-serif'
    },

    unit: {
      fontSize: '12px',
      color: '#6b7280',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px'
    },

    copyFeedback: {
      position: 'absolute' as const,
      top: '4px',
      right: '4px',
      fontSize: '10px',
      color: '#10b981',
      fontWeight: 600,
      opacity: copied ? 1 : 0,
      transition: 'opacity 0.2s ease'
    }
  };

  return (
    <div
      style={styles.card}
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Copy ${conversion.formatted} ${conversion.displayName}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCopy();
        }
      }}
    >
      <div style={styles.copyFeedback}>
        Copied!
      </div>

      <div style={styles.value}>
        {conversion.formatted}
      </div>

      <div style={styles.unit}>
        {conversion.displayName}
      </div>
    </div>
  );
};
```

**Validation Criteria**:
- [ ] Copy functionality works in all browsers
- [ ] Hover states provide visual feedback
- [ ] Keyboard activation works correctly
- [ ] Copy feedback appears and disappears

### Task 3.3: Create ConversionGrid Component
**Time Estimate**: 1 hour
**Priority**: High
**Complexity**: Low

**Description**: Grid layout for conversion cards

**Implementation**:
```typescript
// app/src/components/ConvertPanel/ConversionGrid.tsx
import React from 'react';
import { ConversionCard } from './ConversionCard';
import type { ConversionResult } from '../../types/conversion';

interface ConversionGridProps {
  conversions: ConversionResult[];
  onCopy?: (value: string, unit: string) => void;
}

export const ConversionGrid: React.FC<ConversionGridProps> = ({
  conversions,
  onCopy
}) => {
  const handleCardCopy = (value: string) => {
    const conversion = conversions.find(c => c.formatted === value);
    if (conversion) {
      onCopy?.(value, conversion.unit);
    }
  };

  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '8px',
      marginTop: '12px'
    },

    // Responsive adjustments
    '@media (max-width: 768px)': {
      grid: {
        gridTemplateColumns: '1fr',
        gap: '6px'
      }
    }
  };

  return (
    <div style={styles.grid}>
      {conversions.map((conversion) => (
        <ConversionCard
          key={conversion.unit}
          conversion={conversion}
          onCopy={handleCardCopy}
        />
      ))}
    </div>
  );
};
```

**Validation Criteria**:
- [ ] Grid layout responsive across screen sizes
- [ ] Cards arrange properly with various content lengths
- [ ] Copy callbacks propagate correctly

### Task 3.4: Create Main ConvertPanel Component
**Time Estimate**: 2.5-3 hours
**Priority**: High
**Complexity**: High

**Description**: Main panel orchestrating all conversion functionality

**Implementation**:
```typescript
// app/src/components/ConvertPanel/ConvertPanel.tsx
import React, { useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ConversionService } from '../../services/conversionService';
import { ConversionInput } from './ConversionInput';
import { ConversionGrid } from './ConversionGrid';
import type { ConversionResult } from '../../types/conversion';

interface ConvertPanelProps {
  expanded: boolean;
  onToggle: () => void;
  inline?: boolean;
}

export const ConvertPanel: React.FC<ConvertPanelProps> = ({
  expanded,
  onToggle,
  inline = false
}) => {
  const {
    currentInputValue,
    currentInputUnit,
    lastValidValue,
    setConversionInput,
    clearConversion
  } = useAppStore();

  const conversions = useMemo((): ConversionResult[] => {
    if (!lastValidValue || lastValidValue <= 0) return [];

    return ConversionService.getAllConversions(lastValidValue, currentInputUnit);
  }, [lastValidValue, currentInputUnit]);

  const handleInputChange = useCallback((value: string, unit: string) => {
    setConversionInput(value, unit as any);
  }, [setConversionInput]);

  const handleCopy = useCallback((value: string, unit: string) => {
    // Optional: Track analytics
    console.log(`Copied ${value} ${unit}`);
  }, []);

  const styles = {
    panel: {
      backgroundColor: '#ffffff',
      borderRadius: inline ? '12px' : '0',
      padding: '16px',
      boxShadow: inline ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
      marginBottom: inline ? '8px' : '0',
      border: inline ? 'none' : '1px solid #e5e7eb'
    },

    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: expanded ? '16px' : '0',
      cursor: 'pointer'
    },

    title: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#1f2937',
      fontFamily: '"Nunito Sans", sans-serif'
    },

    toggleIcon: {
      fontSize: '12px',
      color: '#6b7280',
      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease'
    },

    content: {
      display: expanded ? 'block' : 'none'
    },

    emptyState: {
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: '14px',
      padding: '20px',
      fontStyle: 'italic'
    }
  };

  const collapsedView = (
    <div style={styles.panel}>
      <div style={styles.header} onClick={onToggle}>
        <div style={styles.title}>Convert</div>
        <div style={styles.toggleIcon}>▼</div>
      </div>
    </div>
  );

  if (!expanded) return collapsedView;

  return (
    <div style={styles.panel}>
      <div style={styles.header} onClick={onToggle}>
        <div style={styles.title}>Convert Areas</div>
        <div style={styles.toggleIcon}>▼</div>
      </div>

      <div style={styles.content}>
        <ConversionInput
          value={currentInputValue}
          unit={currentInputUnit}
          onChange={handleInputChange}
          onClear={clearConversion}
        />

        {conversions.length > 0 ? (
          <ConversionGrid
            conversions={conversions}
            onCopy={handleCopy}
          />
        ) : (
          <div style={styles.emptyState}>
            Enter a value above to see conversions
          </div>
        )}
      </div>
    </div>
  );
};
```

**Validation Criteria**:
- [ ] Panel expands/collapses smoothly
- [ ] Input changes trigger conversion updates
- [ ] Empty state displays when no input
- [ ] All interactions work on mobile

## Phase 4: Integration (3-4 hours)

### Task 4.1: Integrate with Left Sidebar
**Time Estimate**: 1.5 hours
**Priority**: High
**Complexity**: Medium

**Description**: Add ConvertPanel to existing left sidebar

**Implementation**:
```typescript
// app/src/components/Layout/LeftSidebar.tsx - Update existing component

import { ConvertPanel } from '../ConvertPanel';

// Add to render method
{convertPanelExpanded && (
  <ConvertPanel
    expanded={convertPanelExpanded}
    onToggle={toggleConvertPanel}
    inline={true}
  />
)}
```

**Validation Criteria**:
- [ ] Panel integrates without breaking existing panels
- [ ] State management works correctly
- [ ] No layout conflicts

### Task 4.2: Add Toolbar Button
**Time Estimate**: 1 hour
**Priority**: High
**Complexity**: Low

**Description**: Add Convert button to main toolbar

**Implementation**:
```typescript
// app/src/App.tsx - Add to toolbar section

<ToolbarButton
  icon="🔄"
  label="Convert"
  active={convertPanelExpanded}
  onClick={toggleConvertPanel}
  tooltip="Unit conversion tool"
/>
```

**Validation Criteria**:
- [ ] Button appears in correct toolbar position
- [ ] Active state toggles correctly
- [ ] Tooltip displays properly

### Task 4.3: Mobile Optimization
**Time Estimate**: 1.5-2 hours
**Priority**: Medium
**Complexity**: Medium

**Description**: Ensure mobile usability and responsive design

**Implementation**:
- Optimize touch targets (minimum 44px)
- Adjust grid layout for mobile screens
- Handle mobile keyboard interactions
- Test viewport adjustments

**Validation Criteria**:
- [ ] All touch targets meet minimum size requirements
- [ ] Layout adapts properly to mobile screens
- [ ] Keyboard doesn't interfere with UI
- [ ] Copy functionality works on mobile browsers

## Phase 5: Testing & Polish (2-3 hours)

### Task 5.1: Unit Tests
**Time Estimate**: 1.5 hours
**Priority**: High
**Complexity**: Medium

**Description**: Comprehensive test coverage

**Implementation**:
```typescript
// app/src/services/__tests__/conversionService.test.ts
describe('ConversionService', () => {
  describe('convertFromSquareMeters', () => {
    it('converts square meters to square feet correctly', () => {
      expect(ConversionService.convertFromSquareMeters(1, 'sqft')).toBeCloseTo(10.7639, 4);
    });

    it('handles edge cases', () => {
      expect(ConversionService.convertFromSquareMeters(0, 'sqft')).toBe(0);
      expect(ConversionService.convertFromSquareMeters(-1, 'sqft')).toBe(0);
    });
  });

  describe('validateInput', () => {
    it('validates positive numbers', () => {
      expect(ConversionService.validateInput('100').isValid).toBe(true);
    });

    it('rejects invalid inputs', () => {
      expect(ConversionService.validateInput('abc').isValid).toBe(false);
      expect(ConversionService.validateInput('-1').isValid).toBe(false);
    });
  });
});
```

**Validation Criteria**:
- [ ] >70% test coverage achieved
- [ ] All edge cases covered
- [ ] Tests run without failures

### Task 5.2: Integration Testing
**Time Estimate**: 1 hour
**Priority**: Medium
**Complexity**: Medium

**Description**: Test component integration and user workflows

**Validation Criteria**:
- [ ] Complete user workflows tested
- [ ] Cross-browser compatibility verified
- [ ] Mobile functionality tested

### Task 5.3: Performance Optimization
**Time Estimate**: 30 minutes
**Priority**: Low
**Complexity**: Low

**Description**: Final performance tuning

**Validation Criteria**:
- [ ] Conversion calculations < 50ms
- [ ] No memory leaks detected
- [ ] Bundle size impact < 30KB

## Timeline Summary

| Phase | Tasks | Time Estimate | Dependencies |
|-------|-------|---------------|-------------|
| 1. Foundation | Types & Service | 3-4 hours | None |
| 2. State | Zustand Integration | 2 hours | Phase 1 |
| 3. Components | UI Components | 6-8 hours | Phase 1, 2 |
| 4. Integration | App Integration | 3-4 hours | Phase 3 |
| 5. Testing | Tests & Polish | 2-3 hours | All phases |

**Total: 16-20 hours**

## Risk Mitigation

### High Risk Items
- **Clipboard API compatibility**: Test across all browsers, implement fallbacks
- **Mobile keyboard interference**: Extensive mobile testing required
- **Performance with large numbers**: Implement bounds checking early

### Medium Risk Items
- **Integration conflicts**: Incremental testing during development
- **State management complexity**: Follow existing patterns strictly

## Success Criteria

- [ ] All tasks completed within time estimates
- [ ] Feature meets all acceptance criteria from spec
- [ ] Performance benchmarks achieved
- [ ] Test coverage targets met
- [ ] Mobile optimization complete
- [ ] Cross-browser compatibility verified

---

**Task Author**: Land Visualizer Development Team
**Estimate Reviewer**: Tech Lead
**Ready for Implementation**: ✅