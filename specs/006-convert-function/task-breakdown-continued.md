### Task 3.2: Create ConversionCard Component
**File:** `app/src/components/ConvertPanel/ConversionCard.tsx`
**Estimated Time:** 2 hours
**Dependencies:** Task 3.1, Utilities
**Priority:** Critical

**Implementation:**
```typescript
// app/src/components/ConvertPanel/ConversionCard.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ConversionUtils } from '../../utils/conversionUtils';
import type { ConversionResult } from '../../types/conversion';

interface ConversionCardProps {
  conversion: ConversionResult;
  onCopy?: (value: string, unit: string) => void;
  disabled?: boolean;
  highlight?: boolean;
}

export const ConversionCard: React.FC<ConversionCardProps> = ({
  conversion,
  onCopy,
  disabled = false,
  highlight = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  const handleCopy = useCallback(async () => {
    if (disabled) return;

    try {
      const success = await ConversionUtils.copyToClipboard(conversion.formatted);

      if (success) {
        setCopied(true);
        onCopy?.(conversion.formatted, conversion.unit);

        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.warn('Copy failed:', error);
    }
  }, [conversion.formatted, conversion.unit, onCopy, disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsPressed(true);
      handleCopy();
    }
  }, [handleCopy]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setIsPressed(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const accessibleLabel = ConversionUtils.generateAccessibleLabel(
    conversion.formatted,
    conversion.displayName,
    'copy'
  );

  const styles = {
    card: {
      backgroundColor: copied
        ? '#ecfdf5'
        : highlight
          ? '#eff6ff'
          : isHovered && !disabled
            ? '#f9fafb'
            : '#ffffff',
      border: copied
        ? '2px solid #10b981'
        : highlight
          ? '2px solid #3b82f6'
          : '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      textAlign: 'center' as const,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '60px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      position: 'relative' as const,
      transform: isPressed && !disabled ? 'translateY(1px)' : 'translateY(0)',
      opacity: disabled ? 0.6 : 1,
      boxShadow: isHovered && !disabled ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
    },

    value: {
      fontSize: '18px',
      fontWeight: 700,
      color: disabled ? '#9ca3af' : '#1f2937',
      marginBottom: '4px',
      fontFamily: '"Nunito Sans", sans-serif',
      wordBreak: 'break-word' as const
    },

    unit: {
      fontSize: '12px',
      color: disabled ? '#d1d5db' : '#6b7280',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      fontFamily: '"Nunito Sans", sans-serif'
    },

    copyFeedback: {
      position: 'absolute' as const,
      top: '4px',
      right: '4px',
      fontSize: '10px',
      color: '#10b981',
      fontWeight: 600,
      opacity: copied ? 1 : 0,
      transition: 'opacity 0.3s ease',
      fontFamily: '"Nunito Sans", sans-serif'
    }
  };

  return (
    <div
      style={styles.card}
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={accessibleLabel}
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
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

**Validation Checklist:**
- [ ] Copy functionality works in all browsers
- [ ] Visual feedback clear (hover, pressed, copied states)
- [ ] Keyboard activation works (Enter, Space)
- [ ] Accessibility attributes complete
- [ ] Mobile haptic feedback works
- [ ] Copy timeout clears properly

### Task 3.3: Create ConversionGrid Component
**File:** `app/src/components/ConvertPanel/ConversionGrid.tsx`
**Estimated Time:** 1 hour
**Dependencies:** Task 3.2
**Priority:** High

**Implementation:**
```typescript
// app/src/components/ConvertPanel/ConversionGrid.tsx
import React, { useMemo } from 'react';
import { ConversionCard } from './ConversionCard';
import { ConversionUtils } from '../../utils/conversionUtils';
import type { ConversionResult } from '../../types/conversion';

interface ConversionGridProps {
  conversions: ConversionResult[];
  onCopy?: (value: string, unit: string) => void;
  disabled?: boolean;
  highlightUnit?: string;
}

export const ConversionGrid: React.FC<ConversionGridProps> = ({
  conversions,
  onCopy,
  disabled = false,
  highlightUnit
}) => {
  const isMobile = useMemo(() => ConversionUtils.isMobileViewport(), []);

  const handleCardCopy = (value: string, unit: string) => {
    onCopy?.(value, unit);
  };

  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile
        ? '1fr'
        : 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: isMobile ? '6px' : '8px',
      marginTop: '12px'
    },

    emptyState: {
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: '14px',
      padding: '20px',
      fontStyle: 'italic',
      fontFamily: '"Nunito Sans", sans-serif'
    }
  };

  if (conversions.length === 0) {
    return (
      <div style={styles.emptyState}>
        Enter a value above to see conversions
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {conversions.map((conversion) => (
        <ConversionCard
          key={conversion.unit}
          conversion={conversion}
          onCopy={handleCardCopy}
          disabled={disabled}
          highlight={conversion.unit === highlightUnit}
        />
      ))}
    </div>
  );
};
```

**Validation Checklist:**
- [ ] Grid layout responsive on all screen sizes
- [ ] Cards arrange properly with varying content lengths
- [ ] Empty state displays when no conversions
- [ ] Copy callbacks propagate correctly
- [ ] Mobile layout single column

### Task 3.4: Create Main ConvertPanel Component
**File:** `app/src/components/ConvertPanel/ConvertPanel.tsx`
**Estimated Time:** 2.5 hours
**Dependencies:** Tasks 3.1-3.3
**Priority:** Critical

**Implementation:**
```typescript
// app/src/components/ConvertPanel/ConvertPanel.tsx
import React, { useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ConversionInput } from './ConversionInput';
import { ConversionGrid } from './ConversionGrid';

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
    conversion,
    setConversionInput,
    clearConversion
  } = useAppStore();

  const {
    currentInputValue,
    currentInputUnit,
    conversionResults,
    lastError,
    isCalculating
  } = conversion;

  const handleInputChange = useCallback((value: string, unit: string) => {
    setConversionInput(value, unit as any);
  }, [setConversionInput]);

  const handleCopy = useCallback((value: string, unit: string) => {
    // Optional: Analytics tracking
    console.log(`Copied ${value} ${unit}`);
  }, []);

  const hasResults = useMemo(() => {
    return conversionResults.length > 0 && !lastError;
  }, [conversionResults.length, lastError]);

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
      cursor: 'pointer',
      padding: '4px 0'
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
      display: expanded ? 'block' : 'none',
      animation: expanded ? 'fadeIn 0.2s ease' : 'none'
    },

    loadingState: {
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: '14px',
      padding: '20px',
      fontFamily: '"Nunito Sans", sans-serif'
    },

    errorState: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      padding: '12px',
      marginTop: '8px',
      fontSize: '14px',
      color: '#dc2626',
      fontFamily: '"Nunito Sans", sans-serif'
    }
  };

  if (!expanded) {
    return (
      <div style={styles.panel}>
        <div
          style={styles.header}
          onClick={onToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          }}
          aria-expanded={false}
          aria-label="Expand convert panel"
        >
          <div style={styles.title}>Convert</div>
          <div style={styles.toggleIcon}>▼</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div
        style={styles.header}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={true}
        aria-label="Collapse convert panel"
      >
        <div style={styles.title}>Convert Areas</div>
        <div style={styles.toggleIcon}>▼</div>
      </div>

      <div style={styles.content}>
        <ConversionInput
          value={currentInputValue}
          unit={currentInputUnit}
          onChange={handleInputChange}
          onClear={clearConversion}
          disabled={isCalculating}
          autoFocus={expanded}
        />

        {isCalculating && (
          <div style={styles.loadingState}>
            Calculating conversions...
          </div>
        )}

        {lastError && (
          <div style={styles.errorState} role="alert">
            {lastError}
          </div>
        )}

        {hasResults && (
          <ConversionGrid
            conversions={conversionResults}
            onCopy={handleCopy}
            disabled={isCalculating}
          />
        )}
      </div>
    </div>
  );
};
```

**Validation Checklist:**
- [ ] Panel expands/collapses smoothly
- [ ] Header click and keyboard activation work
- [ ] Input changes trigger conversion updates
- [ ] Loading state shows during calculations
- [ ] Error state displays validation errors
- [ ] Results grid shows when conversions available
- [ ] Auto-focus works when panel expands

### Task 3.5: Create Component Barrel Export
**File:** `app/src/components/ConvertPanel/index.ts`
**Estimated Time:** 10 minutes
**Dependencies:** Tasks 3.1-3.4
**Priority:** Low

**Implementation:**
```typescript
// app/src/components/ConvertPanel/index.ts
export { ConvertPanel } from './ConvertPanel';
export { ConversionInput } from './ConversionInput';
export { ConversionCard } from './ConversionCard';
export { ConversionGrid } from './ConversionGrid';
```

**Validation Checklist:**
- [ ] All exports work correctly
- [ ] No circular dependencies
- [ ] Import paths resolve properly

---

## Phase 4: Integration & Polish (4 hours)

### Task 4.1: Integrate with Left Sidebar
**File:** `app/src/components/Layout/LeftSidebar.tsx`
**Estimated Time:** 1 hour
**Dependencies:** Phase 3 complete
**Priority:** Critical

**Implementation:**
First, examine the existing left sidebar structure, then add:

```typescript
// Add to existing app/src/components/Layout/LeftSidebar.tsx
import { ConvertPanel } from '../ConvertPanel';
import { useAppStore } from '../../store/useAppStore';

// In the render method, add ConvertPanel to the existing panels:
const { conversion, toggleConvertPanel } = useAppStore();

// Add to the appropriate location in the sidebar:
{conversion.panelExpanded && (
  <ConvertPanel
    expanded={conversion.panelExpanded}
    onToggle={toggleConvertPanel}
    inline={true}
  />
)}
```

**Validation Checklist:**
- [ ] Panel integrates without breaking existing panels
- [ ] Panel positioning correct in sidebar
- [ ] No layout conflicts with other components
- [ ] Inline styling consistent with existing panels

### Task 4.2: Add Toolbar Button
**File:** `app/src/App.tsx`
**Estimated Time:** 45 minutes
**Dependencies:** Task 4.1
**Priority:** High

**Implementation:**
Add to the existing toolbar section in App.tsx:

```typescript
// Add to existing app/src/App.tsx toolbar section
const { conversion, toggleConvertPanel } = useAppStore();

// Add Convert button to toolbar (find existing button pattern):
<button
  style={{
    padding: '8px 12px',
    backgroundColor: conversion.panelExpanded ? '#eff6ff' : 'transparent',
    border: conversion.panelExpanded ? '2px solid #3b82f6' : '2px solid transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: '"Nunito Sans", sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    color: conversion.panelExpanded ? '#1e40af' : '#374151',
    transition: 'all 0.2s ease'
  }}
  onClick={toggleConvertPanel}
  title="Unit conversion tool"
  aria-label="Toggle unit conversion panel"
>
  🔄 Convert
</button>
```

**Validation Checklist:**
- [ ] Button appears in correct toolbar position
- [ ] Active state toggles correctly
- [ ] Button styling matches existing toolbar buttons
- [ ] Tooltip and accessibility work
- [ ] Icon and text display properly

### Task 4.3: Mobile Optimization
**File:** Various components
**Estimated Time:** 1.5 hours
**Dependencies:** Tasks 4.1-4.2
**Priority:** Medium

**Implementation:**
Review and optimize for mobile:

1. **ConversionGrid mobile layout** (already implemented)
2. **Touch targets minimum 44px**
3. **Viewport adjustments**
4. **Mobile keyboard handling**

**Mobile-specific optimizations:**
```typescript
// Add to ConvertPanel for mobile-specific behavior
const isMobile = ConversionUtils.isMobileViewport();

// Adjust padding for mobile
const mobileStyles = isMobile ? {
  panel: { ...styles.panel, padding: '12px' },
  input: { ...styles.input, fontSize: '16px' }, // Prevent zoom on iOS
} : {};
```

**Validation Checklist:**
- [ ] All touch targets meet 44px minimum
- [ ] Layout adapts properly to mobile screens (375px+)
- [ ] Keyboard doesn't interfere with UI
- [ ] Copy functionality works on mobile browsers
- [ ] Panel sizing appropriate for mobile
- [ ] No horizontal scrolling on mobile

### Task 4.4: Performance Optimization
**File:** Hook creation
**Estimated Time:** 45 minutes
**Dependencies:** All components
**Priority:** Medium

**Implementation:**
```typescript
// app/src/hooks/useConversionPerformance.ts
import { useCallback, useRef } from 'react';

export const useConversionPerformance = () => {
  const metricsRef = useRef({
    calculationTimes: [] as number[],
    renderTimes: [] as number[]
  });

  const trackCalculation = useCallback((fn: () => void) => {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;

    metricsRef.current.calculationTimes.push(duration);

    if (metricsRef.current.calculationTimes.length > 100) {
      metricsRef.current.calculationTimes.shift();
    }

    // Alert if performance degrades
    if (duration > 50) {
      console.warn(`Slow conversion calculation: ${duration}ms`);
    }
  }, []);

  const getAverageCalculationTime = useCallback(() => {
    const times = metricsRef.current.calculationTimes;
    return times.reduce((a, b) => a + b, 0) / times.length || 0;
  }, []);

  return {
    trackCalculation,
    getAverageCalculationTime
  };
};
```

**Validation Checklist:**
- [ ] Conversion calculations under 50ms
- [ ] No memory leaks detected over 10 minutes
- [ ] UI remains responsive during calculations
- [ ] Performance monitoring hooks work correctly

---

## Phase 5: Testing & Quality Assurance (3 hours)

### Task 5.1: Component Unit Tests
**File:** `app/src/components/ConvertPanel/__tests__/`
**Estimated Time:** 1.5 hours
**Dependencies:** All components complete
**Priority:** High

**Implementation:**
```typescript
// app/src/components/ConvertPanel/__tests__/ConvertPanel.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvertPanel } from '../ConvertPanel';
import { useAppStore } from '../../../store/useAppStore';

// Mock the store
jest.mock('../../../store/useAppStore');

const mockStore = {
  conversion: {
    panelExpanded: true,
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
  setConversionInput: jest.fn(),
  clearConversion: jest.fn(),
  toggleConvertPanel: jest.fn()
};

beforeEach(() => {
  (useAppStore as jest.Mock).mockReturnValue(mockStore);
});

describe('ConvertPanel', () => {
  it('renders correctly when expanded', () => {
    render(<ConvertPanel expanded={true} onToggle={jest.fn()} />);

    expect(screen.getByText('Convert Areas')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter Area Value')).toBeInTheDocument();
  });

  it('handles input changes', async () => {
    const user = userEvent.setup();
    render(<ConvertPanel expanded={true} onToggle={jest.fn()} />);

    const input = screen.getByLabelText('Enter Area Value');
    await user.type(input, '1000');

    expect(mockStore.setConversionInput).toHaveBeenCalledWith('1000', 'sqm');
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    mockStore.conversion.currentInputValue = '1000';

    render(<ConvertPanel expanded={true} onToggle={jest.fn()} />);

    const clearButton = screen.getByLabelText('Clear input');
    await user.click(clearButton);

    expect(mockStore.clearConversion).toHaveBeenCalled();
  });

  it('displays conversion results', () => {
    mockStore.conversion.conversionResults = [
      { value: 1000, unit: 'sqm', formatted: '1,000', displayName: 'm²', precision: 0 },
      { value: 10764, unit: 'sqft', formatted: '10,764', displayName: 'ft²', precision: 0 }
    ];

    render(<ConvertPanel expanded={true} onToggle={jest.fn()} />);

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('10,764')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockStore.conversion.lastError = 'Invalid input';

    render(<ConvertPanel expanded={true} onToggle={jest.fn()} />);

    expect(screen.getByText('Invalid input')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
```

**Validation Checklist:**
- [ ] All component tests pass
- [ ] User interactions tested (input, clear, copy)
- [ ] Error states tested
- [ ] Accessibility tested
- [ ] Mobile interactions tested

### Task 5.2: Integration Tests
**File:** `app/src/components/ConvertPanel/__tests__/integration.test.tsx`
**Estimated Time:** 1 hour
**Dependencies:** Task 5.1
**Priority:** Medium

**Implementation:**
```typescript
// Integration tests for complete user workflows
describe('Convert Panel Integration', () => {
  it('completes full conversion workflow', async () => {
    const user = userEvent.setup();

    render(<ConvertPanel expanded={true} onToggle={jest.fn()} />);

    // Enter value
    const input = screen.getByLabelText('Enter Area Value');
    await user.type(input, '1000');

    // Wait for calculations
    await waitFor(() => {
      expect(screen.getByText(/m²/)).toBeInTheDocument();
    });

    // Test copy functionality
    const copyButton = screen.getByLabelText(/copy/i);
    await user.click(copyButton);

    // Verify copy feedback
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();

    render(<ConvertPanel expanded={true} onToggle={jest.fn()} />);

    // Tab through interface
    await user.tab();
    expect(screen.getByLabelText('Enter Area Value')).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText('Clear input')).toHaveFocus();
  });
});
```

**Validation Checklist:**
- [ ] Complete user workflows tested
- [ ] Keyboard navigation works end-to-end
- [ ] Error recovery tested
- [ ] Performance acceptable during tests

### Task 5.3: Performance & Accessibility Testing
**File:** Manual testing and metrics
**Estimated Time:** 30 minutes
**Dependencies:** All tests complete
**Priority:** Medium

**Performance Testing:**
- [ ] Conversion calculations complete in <50ms
- [ ] UI updates in <100ms after input
- [ ] Memory usage stable over 10 minutes
- [ ] No console errors in development

**Accessibility Testing:**
- [ ] All interactive elements accessible via keyboard
- [ ] Screen reader announcements working
- [ ] Focus management proper
- [ ] ARIA attributes correct
- [ ] Color contrast meets WCAG 2.1 AA

**Browser Compatibility:**
- [ ] Chrome 90+ working correctly
- [ ] Firefox 88+ working correctly
- [ ] Safari 14+ working correctly
- [ ] Edge 90+ working correctly
- [ ] Mobile Safari working correctly
- [ ] Mobile Chrome working correctly

---

## Quick Test Commands

### Development Testing
```bash
# Start development server
npm run dev

# Type checking
npx tsc --noEmit

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Lint check
npm run lint
```

### Component-Specific Testing
```bash
# Test specific component
npm test -- ConvertPanel

# Test specific service
npm test -- conversionService

# Test with coverage
npm test -- --coverage
```

### Performance Testing
```bash
# Bundle size analysis
npm run build
npm run analyze

# Memory profiling (in Chrome DevTools)
# Performance > Memory tab > Take heap snapshot
```

## Final Validation Checklist

### ✅ Functional Requirements
- [ ] All user stories from specification completed
- [ ] All acceptance criteria met
- [ ] Error handling comprehensive
- [ ] Performance targets achieved

### ✅ Technical Requirements
- [ ] TypeScript strict mode compliance
- [ ] Inline styling only (no CSS files)
- [ ] Zustand state management integration
- [ ] React best practices followed
- [ ] No external dependencies added

### ✅ Quality Assurance
- [ ] Test coverage >70%
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console errors in production
- [ ] Accessibility compliance verified

### ✅ Integration Verification
- [ ] Left sidebar integration working
- [ ] Toolbar button functional
- [ ] Mobile layout optimized
- [ ] No conflicts with existing features
- [ ] State management clean

### ✅ Performance Verification
- [ ] Conversion calculations <50ms
- [ ] UI responsiveness maintained
- [ ] Memory usage acceptable
- [ ] Bundle size impact <30KB
- [ ] No memory leaks detected

---

## Risk Mitigation Strategies

### High-Priority Risks
1. **Clipboard API Compatibility**
   - **Risk**: Copy functionality fails in some browsers
   - **Mitigation**: Comprehensive fallback implementation tested
   - **Validation**: Test in all target browsers

2. **Mobile Keyboard Interference**
   - **Risk**: On-screen keyboard affects layout
   - **Mitigation**: Viewport adjustment and testing
   - **Validation**: Test on various mobile devices

3. **State Management Conflicts**
   - **Risk**: New state interferes with existing
   - **Mitigation**: Isolated state slice, incremental testing
   - **Validation**: Full app testing with conversion panel

### Medium-Priority Risks
1. **Performance Degradation**
   - **Risk**: Large number calculations slow UI
   - **Mitigation**: Input bounds, performance monitoring
   - **Validation**: Stress testing with edge cases

2. **Integration Layout Issues**
   - **Risk**: New panel breaks existing layout
   - **Mitigation**: Incremental integration, testing
   - **Validation**: Visual regression testing

## Implementation Notes

### Development Best Practices
- Create feature branch: `git checkout -b feature/convert-function`
- Commit frequently with descriptive messages
- Test each phase before proceeding to next
- Use TypeScript strict mode throughout
- Follow existing code patterns and conventions

### Code Review Checklist
- [ ] All inline styling requirements met
- [ ] TypeScript strict mode compliance
- [ ] No external dependencies added
- [ ] Performance requirements met
- [ ] Accessibility standards followed
- [ ] Test coverage adequate
- [ ] Error handling comprehensive

### Deployment Preparation
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete
- [ ] Documentation updated
- [ ] Feature ready for review

---

**Task Breakdown Complete**
**Total Estimated Time**: 21 hours
**Implementation Ready**: ✅
**Next Step**: Begin Phase 1 - Foundation & Service Layer