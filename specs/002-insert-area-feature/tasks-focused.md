# Task Breakdown: Insert Area Feature (Focused Implementation)

**Feature:** Insert Area with Shape Generation
**Total Estimated Time:** 2-3 hours (streamlined approach)
**Target:** Core functionality only, minimal complexity

## Prerequisites Checklist

Before starting implementation:
- [ ] Development server running (`cd app && npm run dev`)
- [ ] No TypeScript errors in current codebase
- [ ] All existing tests passing
- [ ] Git working directory clean (recommended)

## Task Overview

| Phase | Tasks | Time | Files |
|-------|-------|------|-------|
| Foundation | 3 tasks | 30min | types, utils, store |
| Components | 2 tasks | 60min | Button, Modal |
| Integration | 1 task | 30min | App.tsx |

---

## Phase 1: Foundation (30 minutes)

### Task 1.1: Add Area Unit Types
**File:** `app/src/types/index.ts`
**Estimated Time:** 5 minutes

**Add to existing types:**
```typescript
// Add after existing types
export type AreaUnit = 'sqm' | 'sqft' | 'acres' | 'hectares' | 'sqkm';

export interface AreaValidation {
  isValid: boolean;
  error?: string;
  numValue?: number;
}
```

**Validation:**
- [ ] TypeScript compiles without errors
- [ ] Types can be imported in other files

---

### Task 1.2: Create Area Calculation Utilities
**File:** `app/src/utils/areaCalculations.ts`
**Estimated Time:** 15 minutes

**Create new file:**
```typescript
import type { AreaUnit, AreaValidation } from '../types';

// Conversion factors to square meters
const CONVERSIONS: Record<AreaUnit, number> = {
  sqm: 1,
  sqft: 0.092903,
  acres: 4046.86,
  hectares: 10000,
  sqkm: 1000000
};

export function convertToSquareMeters(area: number, unit: AreaUnit): number {
  return area * CONVERSIONS[unit];
}

export function calculateSquareDimensions(areaInSqM: number): { width: number; height: number } {
  const side = Math.sqrt(areaInSqM);
  return { width: side, height: side };
}

export function validateAreaInput(value: string): AreaValidation {
  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (numValue <= 0) {
    return { isValid: false, error: 'Area must be greater than zero' };
  }

  if (numValue > 1000000) {
    return { isValid: false, error: 'Area too large (max: 1,000,000)' };
  }

  return { isValid: true, numValue };
}

export function getUnitLabel(unit: AreaUnit): string {
  const labels = {
    sqm: 'm²',
    sqft: 'ft²',
    acres: 'acres',
    hectares: 'ha',
    sqkm: 'km²'
  };
  return labels[unit];
}
```

**Validation:**
- [ ] All conversion factors are mathematically correct
- [ ] Validation catches edge cases (negative, zero, too large)
- [ ] Functions return proper TypeScript types

---

### Task 1.3: Add Store Action
**File:** `app/src/store/useAppStore.ts`
**Estimated Time:** 10 minutes

**Add import:**
```typescript
import { convertToSquareMeters, calculateSquareDimensions, getUnitLabel } from '../utils/areaCalculations';
import type { AreaUnit } from '../types';
```

**Add to AppStore interface:**
```typescript
interface AppStore extends AppState {
  // ... existing actions ...
  createShapeFromArea: (area: number, unit: AreaUnit) => void;
}
```

**Add implementation in create() function:**
```typescript
createShapeFromArea: (area, unit) => {
  set((state) => {
    // Convert and calculate
    const areaInSqM = convertToSquareMeters(area, unit);
    const { width, height } = calculateSquareDimensions(areaInSqM);

    // Create rectangle at center
    const center = { x: 0, y: 0 };
    const points = [
      { x: center.x - width/2, y: center.y - height/2 },
      { x: center.x + width/2, y: center.y - height/2 },
      { x: center.x + width/2, y: center.y + height/2 },
      { x: center.x - width/2, y: center.y + height/2 }
    ];

    // Apply grid snapping if enabled
    const finalPoints = state.drawing.snapToGrid
      ? points.map(p => ({
          x: Math.round(p.x / state.drawing.gridSize) * state.drawing.gridSize,
          y: Math.round(p.y / state.drawing.gridSize) * state.drawing.gridSize
        }))
      : points;

    // Create shape
    const newShape = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: `Area ${area} ${getUnitLabel(unit)}`,
      points: finalPoints,
      type: 'rectangle' as const,
      color: '#3B82F6',
      visible: true,
      layerId: state.activeLayerId,
      created: new Date(),
      modified: new Date()
    };

    // Add and select shape
    state.shapes.push(newShape);
    state.selectedShapeId = newShape.id;
    state.drawing.activeTool = 'select';

    return state;
  });
},
```

**Validation:**
- [ ] Store action creates shapes with correct area
- [ ] Grid snapping works when enabled
- [ ] New shapes are auto-selected

---

## Phase 2: Components (60 minutes)

### Task 2.1: Create Insert Area Button
**File:** `app/src/components/InsertArea/InsertAreaButton.tsx`
**Estimated Time:** 20 minutes

**Create new file:**
```typescript
import React from 'react';
import Icon from '../Icon';

interface InsertAreaButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const InsertAreaButton: React.FC<InsertAreaButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Insert Area"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        border: 'none',
        borderRadius: '8px',
        background: disabled
          ? '#9CA3AF'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 200ms ease',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      <Icon name="calculator" size={20} />
    </button>
  );
};

export default InsertAreaButton;
```

**Validation:**
- [ ] Button matches existing toolbar styling
- [ ] Hover effects work smoothly
- [ ] Disabled state renders correctly
- [ ] Icon displays properly

---

### Task 2.2: Create Insert Area Modal
**File:** `app/src/components/InsertArea/InsertAreaModal.tsx`
**Estimated Time:** 40 minutes

**Create new file:**
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import type { AreaUnit, AreaValidation } from '../../types';
import { validateAreaInput, getUnitLabel } from '../../utils/areaCalculations';

interface InsertAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (area: number, unit: AreaUnit) => void;
}

const UNITS: AreaUnit[] = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm'];

const InsertAreaModal: React.FC<InsertAreaModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [areaValue, setAreaValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<AreaUnit>('sqm');
  const [validation, setValidation] = useState<AreaValidation>({ isValid: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAreaValue('');
      setSelectedUnit('sqm');
      setValidation({ isValid: true });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Validate input in real-time
  useEffect(() => {
    if (areaValue.trim()) {
      setValidation(validateAreaInput(areaValue));
    } else {
      setValidation({ isValid: true });
    }
  }, [areaValue]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validation.isValid || !validation.numValue) return;

    setIsSubmitting(true);
    try {
      await onSubmit(validation.numValue, selectedUnit);
      onClose();
    } catch (error) {
      console.error('Error creating shape:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validation, selectedUnit, onSubmit, onClose]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleSubmit();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSubmit]);

  if (!isOpen) return null;

  const canSubmit = validation.isValid && areaValue.trim() !== '' && !isSubmitting;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '400px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          animation: 'slideIn 200ms ease-out'
        }}
      >
        <style>
          {`
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(-20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}
        </style>

        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1F2937',
            fontFamily: '"Nunito Sans", system-ui, sans-serif'
          }}
        >
          Insert Area
        </h2>

        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#6B7280',
            fontFamily: '"Nunito Sans", system-ui, sans-serif'
          }}
        >
          Enter the desired area. A rectangle with exact area will be created.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            {/* Area Input */}
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                  fontFamily: '"Nunito Sans", system-ui, sans-serif'
                }}
              >
                Area *
              </label>
              <input
                type="number"
                value={areaValue}
                onChange={(e) => setAreaValue(e.target.value)}
                placeholder="Enter area..."
                autoFocus
                disabled={isSubmitting}
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  height: '40px',
                  border: `1px solid ${validation.isValid ? '#D1D5DB' : '#EF4444'}`,
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '14px',
                  fontFamily: '"Nunito Sans", system-ui, sans-serif',
                  outline: 'none',
                  transition: 'border-color 200ms ease'
                }}
                onFocus={(e) => {
                  if (validation.isValid) {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = validation.isValid ? '#D1D5DB' : '#EF4444';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {!validation.isValid && validation.error && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#EF4444',
                    margin: '4px 0 0 0',
                    fontFamily: '"Nunito Sans", system-ui, sans-serif'
                  }}
                >
                  {validation.error}
                </p>
              )}
            </div>

            {/* Unit Selector */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                  fontFamily: '"Nunito Sans", system-ui, sans-serif'
                }}
              >
                Unit
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value as AreaUnit)}
                disabled={isSubmitting}
                style={{
                  width: '120px',
                  height: '40px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '14px',
                  fontFamily: '"Nunito Sans", system-ui, sans-serif',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {getUnitLabel(unit)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: '"Nunito Sans", system-ui, sans-serif',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 200ms ease'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!canSubmit}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              background: canSubmit
                ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                : '#9CA3AF',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: '"Nunito Sans", system-ui, sans-serif',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
              if (canSubmit) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (canSubmit) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Shape'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsertAreaModal;
```

**Create barrel export file:** `app/src/components/InsertArea/index.ts`
```typescript
export { default as InsertAreaButton } from './InsertAreaButton';
export { default as InsertAreaModal } from './InsertAreaModal';
```

**Validation:**
- [ ] Modal opens with backdrop blur
- [ ] Form validation works in real-time
- [ ] Keyboard shortcuts work (Escape, Enter)
- [ ] Submit button enables/disables correctly
- [ ] Loading state prevents double submission

---

## Phase 3: Integration (30 minutes)

### Task 3.1: Integrate with App Component
**File:** `app/src/App.tsx`
**Estimated Time:** 30 minutes

**Add imports at top:**
```typescript
import { InsertAreaButton, InsertAreaModal } from './components/InsertArea';
import type { AreaUnit } from './types';
```

**Add state for modal (after other useState declarations):**
```typescript
const [insertAreaModalOpen, setInsertAreaModalOpen] = useState(false);
```

**Add handler function (after other handlers):**
```typescript
const handleInsertArea = useCallback((area: number, unit: AreaUnit) => {
  const { createShapeFromArea } = useAppStore.getState();
  createShapeFromArea(area, unit);
}, []);
```

**Add button to toolbar (find the toolbar section and add):**
```typescript
{/* Insert Area Button */}
<InsertAreaButton
  onClick={() => setInsertAreaModalOpen(true)}
  disabled={false}
/>
```

**Add modal at end of JSX (before closing div):**
```typescript
{/* Insert Area Modal */}
<InsertAreaModal
  isOpen={insertAreaModalOpen}
  onClose={() => setInsertAreaModalOpen(false)}
  onSubmit={handleInsertArea}
/>
```

**Validation:**
- [ ] Button appears in toolbar with correct styling
- [ ] Modal opens when button clicked
- [ ] Complete workflow creates shape in 3D scene
- [ ] Generated shapes have correct calculated area
- [ ] No layout disruption to existing UI

---

## Final Testing Checklist

### Manual Testing
- [ ] **Button Integration**
  - [ ] Button appears in toolbar
  - [ ] Hover effects work smoothly
  - [ ] Tooltip shows "Insert Area"

- [ ] **Modal Functionality**
  - [ ] Opens with backdrop blur
  - [ ] Input validation shows errors
  - [ ] Unit dropdown works
  - [ ] Escape key closes modal
  - [ ] Enter key submits form

- [ ] **Shape Creation**
  - [ ] Rectangles appear with correct area
  - [ ] Shapes are positioned at center
  - [ ] Grid snapping works when enabled
  - [ ] Created shapes are auto-selected
  - [ ] Shapes appear in layers panel

- [ ] **Edge Cases**
  - [ ] Large areas handled appropriately
  - [ ] Small areas create visible shapes
  - [ ] Invalid inputs rejected clearly

### Quick Commands
```bash
# Development
npm run dev

# Type checking
npx tsc --noEmit

# Test area calculations
node -e "
const { convertToSquareMeters, calculateSquareDimensions } = require('./app/src/utils/areaCalculations.ts');
console.log('100 sqft =', convertToSquareMeters(100, 'sqft'), 'sqm');
console.log('1000 sqm dims:', calculateSquareDimensions(1000));
"
```

### Success Criteria
- ✅ Feature works end-to-end in 2-3 user clicks
- ✅ Generated rectangles mathematically accurate
- ✅ No breaking changes to existing functionality
- ✅ Code follows project constitution (inline styles, TypeScript)
- ✅ Performance impact negligible

**Total Implementation Time: ~2 hours**
This streamlined task breakdown focuses on delivering core functionality quickly while maintaining code quality.