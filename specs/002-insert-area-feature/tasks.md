# Task Breakdown: Insert Area Feature

**Feature:** Insert Area with Shape Generation
**Total Estimated Time:** 8-12 hours
**Priority:** High - User-requested feature

## Task Overview

| Phase | Tasks | Estimated Time | Dependencies |
|-------|-------|----------------|--------------|
| Infrastructure | 3 tasks | 2-3 hours | None |
| UI Components | 4 tasks | 4-5 hours | Phase 1 |
| Business Logic | 2 tasks | 2-3 hours | Phase 1 |
| Integration | 3 tasks | 1-2 hours | All phases |

## Phase 1: Infrastructure Setup (2-3 hours)

### Task 1.1: Add Type Definitions
**Estimated Time:** 30 minutes
**Priority:** High
**Dependencies:** None

**Description:** Add area unit types and interfaces to support the Insert Area feature.

**Implementation:**
```typescript
// In app/src/types/index.ts

// Add area unit types
export type AreaUnit = 'sqm' | 'sqft' | 'acres' | 'hectares' | 'sqkm';

// Add area input interface
export interface AreaInput {
  value: number;
  unit: AreaUnit;
}

// Add area validation interface
export interface AreaValidation {
  isValid: boolean;
  error?: string;
  normalizedArea?: number; // in square meters
}
```

**Acceptance Criteria:**
- [ ] Types compile without errors
- [ ] Area units support common property measurements
- [ ] Validation interface supports error messaging
- [ ] All types are properly exported

**Validation:**
- Run TypeScript compiler to check for errors
- Verify types can be imported in other files

---

### Task 1.2: Create Area Calculation Utility
**Estimated Time:** 1.5 hours
**Priority:** High
**Dependencies:** Task 1.1

**Description:** Create utility functions for area conversions and rectangle dimension calculations.

**File:** `app/src/utils/areaCalculations.ts`

**Implementation:**
```typescript
import type { AreaUnit, AreaValidation, Point2D } from '../types';

// Conversion factors to square meters
const AREA_CONVERSIONS: Record<AreaUnit, number> = {
  sqm: 1,
  sqft: 0.092903,
  acres: 4046.86,
  hectares: 10000,
  sqkm: 1000000
};

// Convert area to square meters
export function convertAreaToSquareMeters(value: number, unit: AreaUnit): number {
  return value * AREA_CONVERSIONS[unit];
}

// Calculate rectangle dimensions from area (square aspect ratio)
export function calculateRectangleDimensions(areaInSquareMeters: number): {
  width: number;
  height: number;
} {
  const side = Math.sqrt(areaInSquareMeters);
  return { width: side, height: side };
}

// Validate area input
export function validateAreaInput(value: string, unit: AreaUnit): AreaValidation {
  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (numValue <= 0) {
    return { isValid: false, error: 'Area must be greater than zero' };
  }

  // Check reasonable ranges
  const maxArea = unit === 'sqkm' ? 1000 : unit === 'acres' ? 10000 : 1000000;
  if (numValue > maxArea) {
    return { isValid: false, error: `Area too large (max: ${maxArea} ${unit})` };
  }

  const normalizedArea = convertAreaToSquareMeters(numValue, unit);
  return { isValid: true, normalizedArea };
}

// Get unit display information
export function getUnitInfo(unit: AreaUnit) {
  const unitInfo = {
    sqm: { label: 'Square Meters', symbol: 'm²' },
    sqft: { label: 'Square Feet', symbol: 'ft²' },
    acres: { label: 'Acres', symbol: 'ac' },
    hectares: { label: 'Hectares', symbol: 'ha' },
    sqkm: { label: 'Square Kilometers', symbol: 'km²' }
  };
  return unitInfo[unit];
}
```

**Acceptance Criteria:**
- [ ] All unit conversions are mathematically accurate
- [ ] Rectangle dimensions calculation produces square shapes
- [ ] Input validation catches all edge cases
- [ ] Functions have proper TypeScript typing
- [ ] Unit conversion factors are correct to at least 6 decimal places

**Testing:**
- Test conversion for known area values
- Test validation with various invalid inputs
- Test dimension calculation for perfect squares
- Verify unit display information is correct

---

### Task 1.3: Add Store Actions
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** Task 1.1, 1.2

**Description:** Add area-based shape creation action to the Zustand store.

**File:** `app/src/store/useAppStore.ts` (modification)

**Implementation:**
```typescript
// Import new utilities
import { convertAreaToSquareMeters, calculateRectangleDimensions } from '../utils/areaCalculations';
import type { AreaUnit } from '../types';

// Add to store interface
interface AppStore extends AppState {
  // ... existing actions ...
  createShapeFromArea: (area: number, unit: AreaUnit, centerPoint?: Point2D) => void;
}

// Implement action
createShapeFromArea: (area: number, unit: AreaUnit, centerPoint?: Point2D) => {
  set((state) => {
    // Convert to square meters
    const areaInSquareMeters = convertAreaToSquareMeters(area, unit);

    // Calculate rectangle dimensions
    const { width, height } = calculateRectangleDimensions(areaInSquareMeters);

    // Use provided center or viewport center
    const center = centerPoint || { x: 0, y: 0 }; // Default center

    // Create rectangle points
    const points: Point2D[] = [
      { x: center.x - width/2, y: center.y - height/2 },
      { x: center.x + width/2, y: center.y - height/2 },
      { x: center.x + width/2, y: center.y + height/2 },
      { x: center.x - width/2, y: center.y + height/2 }
    ];

    // Apply grid snapping if enabled
    const snappedPoints = state.drawing.snapToGrid
      ? points.map(point => ({
          x: Math.round(point.x / state.drawing.gridSize) * state.drawing.gridSize,
          y: Math.round(point.y / state.drawing.gridSize) * state.drawing.gridSize
        }))
      : points;

    // Generate unique shape name
    const shapeCount = state.shapes.length + 1;
    const shapeName = `Area ${area} ${getUnitInfo(unit).symbol}`;

    // Create the shape
    const newShape: Shape = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: shapeName,
      points: snappedPoints,
      type: 'rectangle',
      color: '#3B82F6', // Default blue
      visible: true,
      layerId: state.activeLayerId,
      created: new Date(),
      modified: new Date()
    };

    // Add shape and select it
    state.shapes.push(newShape);
    state.selectedShapeId = newShape.id;

    // Switch to select tool for immediate editing
    state.drawing.activeTool = 'select';

    // Save to history
    const historyState = {
      shapes: state.shapes,
      layers: state.layers,
      selectedShapeId: state.selectedShapeId,
      activeLayerId: state.activeLayerId
    };

    state.history.past.push(state.history.present);
    state.history.present = JSON.stringify(historyState);
    state.history.future = [];

    return state;
  });
},
```

**Acceptance Criteria:**
- [ ] Action properly creates rectangular shapes
- [ ] Generated shapes have correct area (within 0.1% tolerance)
- [ ] Shapes are positioned at specified center point
- [ ] Grid snapping is applied when enabled
- [ ] New shapes are automatically selected
- [ ] Action is properly typed in TypeScript
- [ ] History system records the shape creation

**Validation:**
- Test with various area values and units
- Verify grid snapping behavior
- Check shape selection after creation
- Test undo/redo functionality

---

## Phase 2: UI Components (4-5 hours)

### Task 2.1: Create InsertAreaButton Component
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** None (can start in parallel)

**Description:** Create toolbar button component that triggers the Insert Area dialog.

**File:** `app/src/components/InsertArea/InsertAreaButton.tsx`

**Implementation:**
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 200ms ease',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        ...(disabled ? {} : {
          ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
          }
        })
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

**Acceptance Criteria:**
- [ ] Button matches existing toolbar button styling
- [ ] Hover effects work smoothly (200ms transitions)
- [ ] Proper disabled state styling
- [ ] Accessible tooltip and keyboard navigation
- [ ] Consistent with Canva-inspired design system
- [ ] Uses inline styles exclusively

**Testing:**
- Visual comparison with other toolbar buttons
- Test hover and disabled states
- Verify accessibility with keyboard navigation

---

### Task 2.2: Create UnitSelector Component
**Estimated Time:** 1 hour
**Priority:** Medium
**Dependencies:** Task 1.1

**Description:** Create dropdown component for selecting area units.

**File:** `app/src/components/InsertArea/UnitSelector.tsx`

**Implementation:**
```typescript
import React from 'react';
import type { AreaUnit } from '../../types';
import { getUnitInfo } from '../../utils/areaCalculations';

interface UnitSelectorProps {
  value: AreaUnit;
  onChange: (unit: AreaUnit) => void;
  disabled?: boolean;
}

const UNIT_OPTIONS: AreaUnit[] = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm'];

const UnitSelector: React.FC<UnitSelectorProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          fontFamily: '"Nunito Sans", system-ui, sans-serif'
        }}
      >
        Unit
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AreaUnit)}
        disabled={disabled}
        style={{
          width: '120px',
          height: '40px',
          border: '1px solid #D1D5DB',
          borderRadius: '8px',
          padding: '0 12px',
          fontSize: '14px',
          fontFamily: '"Nunito Sans", system-ui, sans-serif',
          background: 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 200ms ease',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#3B82F6';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#D1D5DB';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {UNIT_OPTIONS.map((unit) => {
          const unitInfo = getUnitInfo(unit);
          return (
            <option key={unit} value={unit}>
              {unitInfo.label} ({unitInfo.symbol})
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default UnitSelector;
```

**Acceptance Criteria:**
- [ ] Dropdown includes all 5 area units
- [ ] Unit labels are clear and include symbols
- [ ] Proper focus/blur styling
- [ ] Disabled state handled correctly
- [ ] Consistent typography with form elements
- [ ] Keyboard accessible

**Testing:**
- Test all unit options display correctly
- Verify selection changes trigger onChange
- Test keyboard navigation (arrow keys, Enter)

---

### Task 2.3: Create AreaInputField Component
**Estimated Time:** 1.5 hours
**Priority:** High
**Dependencies:** Task 1.1, 1.2

**Description:** Create validated input field for area values with real-time validation.

**File:** `app/src/components/InsertArea/AreaInputField.tsx`

**Implementation:**
```typescript
import React, { useState, useEffect } from 'react';
import type { AreaUnit, AreaValidation } from '../../types';
import { validateAreaInput } from '../../utils/areaCalculations';

interface AreaInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  unit: AreaUnit;
  disabled?: boolean;
  autoFocus?: boolean;
}

const AreaInputField: React.FC<AreaInputFieldProps> = ({
  value,
  onChange,
  unit,
  disabled = false,
  autoFocus = false
}) => {
  const [validation, setValidation] = useState<AreaValidation>({ isValid: true });

  useEffect(() => {
    if (value.trim()) {
      const result = validateAreaInput(value, unit);
      setValidation(result);
    } else {
      setValidation({ isValid: true });
    }
  }, [value, unit]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          fontFamily: '"Nunito Sans", system-ui, sans-serif'
        }}
      >
        Area *
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter area..."
        autoFocus={autoFocus}
        disabled={disabled}
        min="0"
        step="0.01"
        style={{
          width: '200px',
          height: '40px',
          border: `1px solid ${validation.isValid ? '#D1D5DB' : '#EF4444'}`,
          borderRadius: '8px',
          padding: '0 12px',
          fontSize: '14px',
          fontFamily: '"Nunito Sans", system-ui, sans-serif',
          outline: 'none',
          transition: 'border-color 200ms ease',
          background: 'white',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.5 : 1
        }}
        onFocus={(e) => {
          if (!validation.isValid) return;
          e.currentTarget.style.borderColor = '#3B82F6';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = validation.isValid ? '#D1D5DB' : '#EF4444';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {!validation.isValid && validation.error && (
        <span
          style={{
            fontSize: '12px',
            color: '#EF4444',
            fontFamily: '"Nunito Sans", system-ui, sans-serif',
            marginTop: '2px'
          }}
        >
          {validation.error}
        </span>
      )}
    </div>
  );
};

export default AreaInputField;
```

**Acceptance Criteria:**
- [ ] Real-time validation with visual feedback
- [ ] Clear error messages for invalid input
- [ ] Proper number input with decimal support
- [ ] Focus state styling matches design system
- [ ] Disabled state handled correctly
- [ ] Auto-focus works when dialog opens
- [ ] Proper accessibility labels

**Testing:**
- Test validation with various invalid inputs
- Test decimal number support
- Verify error messages are helpful and clear
- Test keyboard navigation and accessibility

---

### Task 2.4: Create InsertAreaDialog Component
**Estimated Time:** 1.5 hours
**Priority:** High
**Dependencies:** Task 2.2, 2.3

**Description:** Create modal dialog that contains the area input form.

**File:** `app/src/components/InsertArea/InsertAreaDialog.tsx`

**Implementation:**
```typescript
import React, { useState, useCallback, useEffect } from 'react';
import AreaInputField from './AreaInputField';
import UnitSelector from './UnitSelector';
import type { AreaUnit } from '../../types';
import { validateAreaInput } from '../../utils/areaCalculations';

interface InsertAreaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (area: number, unit: AreaUnit) => void;
}

const InsertAreaDialog: React.FC<InsertAreaDialogProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [areaValue, setAreaValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<AreaUnit>('sqm');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAreaValue('');
      setSelectedUnit('sqm');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    const validation = validateAreaInput(areaValue, selectedUnit);
    if (!validation.isValid || !validation.normalizedArea) return;

    setIsSubmitting(true);

    try {
      // Call the onSubmit handler
      await onSubmit(parseFloat(areaValue), selectedUnit);
      onClose();
    } catch (error) {
      console.error('Error creating shape:', error);
      // Could add error state here for user feedback
    } finally {
      setIsSubmitting(false);
    }
  }, [areaValue, selectedUnit, onSubmit, onClose]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSubmit]);

  if (!isOpen) return null;

  const validation = validateAreaInput(areaValue, selectedUnit);
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          animation: 'slideIn 200ms ease-out'
        }}
      >
        <style>
          {`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}
        </style>

        <h2
          style={{
            margin: '0 0 20px 0',
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
            fontFamily: '"Nunito Sans", system-ui, sans-serif',
            lineHeight: '1.4'
          }}
        >
          Enter the desired area and select units. A rectangle with the exact area will be created in the 3D scene.
        </p>

        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <AreaInputField
              value={areaValue}
              onChange={setAreaValue}
              unit={selectedUnit}
              disabled={isSubmitting}
              autoFocus
            />
            <UnitSelector
              value={selectedUnit}
              onChange={setSelectedUnit}
              disabled={isSubmitting}
            />
          </div>
        </form>

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
              opacity: isSubmitting ? 0.5 : 1,
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = 'white';
              }
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
              transition: 'all 200ms ease',
              opacity: isSubmitting ? 0.7 : 1
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

export default InsertAreaDialog;
```

**Acceptance Criteria:**
- [ ] Modal opens with proper backdrop blur
- [ ] Form validation prevents invalid submissions
- [ ] Keyboard shortcuts work (Escape, Enter)
- [ ] Smooth open/close animations
- [ ] Click outside to close functionality
- [ ] Loading state during shape creation
- [ ] Proper focus management
- [ ] Accessible modal structure

**Testing:**
- Test form submission with valid/invalid data
- Test keyboard navigation and shortcuts
- Test modal interactions (click outside, buttons)
- Verify animation timing and smoothness

---

## Phase 3: Business Logic (2-3 hours)

### Task 3.1: Create Component Barrel Export
**Estimated Time:** 15 minutes
**Priority:** Low
**Dependencies:** Task 2.1, 2.4

**Description:** Create index file for clean component imports.

**File:** `app/src/components/InsertArea/index.ts`

**Implementation:**
```typescript
export { default as InsertAreaButton } from './InsertAreaButton';
export { default as InsertAreaDialog } from './InsertAreaDialog';
export { default as AreaInputField } from './AreaInputField';
export { default as UnitSelector } from './UnitSelector';
```

**Acceptance Criteria:**
- [ ] All components properly exported
- [ ] Clean import paths for consuming components

---

### Task 3.2: Add Viewport Center Calculation
**Estimated Time:** 45 minutes
**Priority:** Medium
**Dependencies:** Task 1.2

**Description:** Add function to determine viewport center for shape positioning.

**File:** `app/src/utils/areaCalculations.ts` (addition)

**Implementation:**
```typescript
// Add to existing file

// Get current viewport center based on camera position
export function getViewportCenter(
  cameraPosition?: Point3D,
  cameraTarget?: Point3D
): Point2D {
  // For now, use simple center at origin
  // This could be enhanced to use actual camera position/target
  return { x: 0, y: 0 };
}

// Get viewport bounds to ensure shape fits
export function getViewportBounds(
  cameraPosition?: Point3D,
  cameraDistance?: number
): { width: number; height: number; center: Point2D } {
  // Simple default bounds - could be enhanced with actual camera data
  const defaultSize = 100; // meters
  return {
    width: defaultSize,
    height: defaultSize,
    center: { x: 0, y: 0 }
  };
}

// Ensure shape fits within viewport
export function ensureShapeInViewport(
  points: Point2D[],
  viewportBounds: { width: number; height: number; center: Point2D }
): Point2D[] {
  // Calculate shape bounds
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  const shapeWidth = maxX - minX;
  const shapeHeight = maxY - minY;

  // If shape is larger than viewport, return as-is
  if (shapeWidth > viewportBounds.width || shapeHeight > viewportBounds.height) {
    return points;
  }

  // Center the shape in viewport
  const shapeCenter = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2
  };

  const offset = {
    x: viewportBounds.center.x - shapeCenter.x,
    y: viewportBounds.center.y - shapeCenter.y
  };

  return points.map(point => ({
    x: point.x + offset.x,
    y: point.y + offset.y
  }));
}
```

**Acceptance Criteria:**
- [ ] Functions properly calculate viewport positioning
- [ ] Shapes are centered appropriately
- [ ] Large shapes are handled gracefully
- [ ] Functions integrate with store actions

**Testing:**
- Test with various viewport sizes
- Test with shapes larger than viewport
- Verify centering calculation accuracy

---

## Phase 4: Integration & Polish (1-2 hours)

### Task 4.1: Integrate Button in Toolbar
**Estimated Time:** 30 minutes
**Priority:** High
**Dependencies:** Task 2.1, 2.4

**Description:** Add InsertAreaButton to the main application toolbar.

**File:** `app/src/App.tsx` (modification)

**Implementation:**
```typescript
// Add imports
import { InsertAreaButton, InsertAreaDialog } from './components/InsertArea';
import { useAppStore } from './store/useAppStore';

// Add state for dialog
const [insertAreaDialogOpen, setInsertAreaDialogOpen] = useState(false);

// Add handler
const handleInsertArea = useCallback((area: number, unit: AreaUnit) => {
  const createShapeFromArea = useAppStore.getState().createShapeFromArea;
  createShapeFromArea(area, unit);
}, []);

// Add button to toolbar JSX (in appropriate section)
<InsertAreaButton
  onClick={() => setInsertAreaDialogOpen(true)}
  disabled={false}
/>

// Add dialog to JSX (at end of component)
<InsertAreaDialog
  isOpen={insertAreaDialogOpen}
  onClose={() => setInsertAreaDialogOpen(false)}
  onSubmit={handleInsertArea}
/>
```

**Acceptance Criteria:**
- [ ] Button appears in logical position in toolbar
- [ ] Button styling matches existing toolbar buttons
- [ ] Dialog opens/closes properly
- [ ] Shape creation works end-to-end
- [ ] No layout disruption

**Testing:**
- Test button placement and styling
- Test complete workflow from button click to shape creation
- Verify no regression in existing toolbar functionality

---

### Task 4.2: Add Keyboard Shortcuts
**Estimated Time:** 30 minutes
**Priority:** Low
**Dependencies:** Task 4.1

**Description:** Add keyboard shortcut to open Insert Area dialog.

**File:** `app/src/App.tsx` (modification)

**Implementation:**
```typescript
// Add to existing keyboard handler useEffect
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // ... existing keyboard handlers ...

    // Ctrl/Cmd + I for Insert Area
    if ((e.ctrlKey || e.metaKey) && e.key === 'i' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      setInsertAreaDialogOpen(true);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [/* existing dependencies */]);
```

**Acceptance Criteria:**
- [ ] Ctrl+I (Windows) and Cmd+I (Mac) open dialog
- [ ] Shortcut works when 3D scene has focus
- [ ] Shortcut doesn't conflict with existing shortcuts
- [ ] Proper preventDefault to avoid browser conflicts

**Testing:**
- Test keyboard shortcut on Windows and Mac
- Verify no conflicts with browser shortcuts
- Test from different UI contexts

---

### Task 4.3: Add Success Feedback
**Estimated Time:** 30 minutes
**Priority:** Low
**Dependencies:** Task 4.1

**Description:** Add brief success feedback when shape is created.

**File:** `app/src/App.tsx` (modification)

**Implementation:**
```typescript
// Add success message state
const [successMessage, setSuccessMessage] = useState<string | null>(null);

// Modify handleInsertArea
const handleInsertArea = useCallback((area: number, unit: AreaUnit) => {
  const createShapeFromArea = useAppStore.getState().createShapeFromArea;
  createShapeFromArea(area, unit);

  // Show success message
  const unitInfo = getUnitInfo(unit);
  setSuccessMessage(`Created shape with area ${area} ${unitInfo.symbol}`);

  // Clear message after 3 seconds
  setTimeout(() => setSuccessMessage(null), 3000);
}, []);

// Add success message JSX
{successMessage && (
  <div
    style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#10B981',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: '"Nunito Sans", system-ui, sans-serif',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1001,
      animation: 'slideInRight 300ms ease-out'
    }}
  >
    ✓ {successMessage}
  </div>
)}
```

**Acceptance Criteria:**
- [ ] Success message appears briefly after shape creation
- [ ] Message includes created area and units
- [ ] Message disappears automatically after 3 seconds
- [ ] Smooth slide-in animation
- [ ] Proper z-index to appear above other UI

**Testing:**
- Test success message timing and content
- Verify animation smoothness
- Test with multiple rapid shape creations

---

## Testing & Validation

### Manual Testing Checklist
- [ ] **Button Integration**
  - [ ] Button appears in toolbar with correct styling
  - [ ] Button hover effects work smoothly
  - [ ] Tooltip shows "Insert Area"

- [ ] **Dialog Functionality**
  - [ ] Dialog opens with backdrop blur
  - [ ] Form fields work correctly
  - [ ] Validation shows appropriate error messages
  - [ ] Unit selector includes all options
  - [ ] Cancel and Create buttons work
  - [ ] Keyboard shortcuts work (Escape, Enter, Ctrl+I)

- [ ] **Shape Creation**
  - [ ] Shapes appear with correct area
  - [ ] Shapes are properly positioned and selected
  - [ ] Grid snapping works when enabled
  - [ ] Created shapes appear in layers panel
  - [ ] Undo/redo works with created shapes

- [ ] **Edge Cases**
  - [ ] Very large areas are handled appropriately
  - [ ] Very small areas create visible shapes
  - [ ] Invalid inputs are properly rejected
  - [ ] Dialog works on mobile/tablet viewports

### Unit Tests (Optional but Recommended)
- [ ] **Area Calculations**
  - [ ] Unit conversion accuracy
  - [ ] Rectangle dimension calculations
  - [ ] Input validation logic

- [ ] **Component Tests**
  - [ ] Form submission behavior
  - [ ] Validation error display
  - [ ] Keyboard event handling

### Performance Testing
- [ ] Dialog opens in < 100ms
- [ ] Shape creation completes in < 200ms
- [ ] No memory leaks with repeated use
- [ ] Smooth animations throughout

---

## Success Criteria

### Feature Complete When:
1. ✅ All tasks marked complete
2. ✅ Manual testing checklist passed
3. ✅ No breaking changes to existing functionality
4. ✅ Performance meets specified targets
5. ✅ Code follows project constitution (inline styles, TypeScript, etc.)
6. ✅ Feature works on desktop and tablet viewports
7. ✅ Accessibility requirements met (keyboard navigation, screen readers)

### Quality Standards:
- **Code Quality**: TypeScript strict mode, proper error handling
- **Performance**: Fast response times, smooth animations
- **UX Quality**: Intuitive workflow, clear feedback, professional styling
- **Accessibility**: WCAG 2.1 AA compliance for form elements
- **Mobile Support**: Functional on tablet devices (iPad-sized screens)

This task breakdown provides a comprehensive roadmap for implementing the Insert Area feature while maintaining the high quality standards established in the Land Visualizer project. Each task includes specific implementation details, acceptance criteria, and testing requirements to ensure successful delivery.