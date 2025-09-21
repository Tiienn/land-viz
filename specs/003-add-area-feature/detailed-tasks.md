# Detailed Task Breakdown: Add Area Feature

**Spec ID**: 003
**Feature Name**: Add Area Feature
**Tasks Version**: 3.0
**Generated**: 2025-09-17
**Total Estimated Time**: 18-22 hours

## Prerequisites Checklist

### **Environment Setup** ✅
- [ ] Development server running: `cd app && npm run dev`
- [ ] TypeScript compilation working: `npm run type-check`
- [ ] Tests executable: `npm test`
- [ ] Linting operational: `npm run lint`

### **Current State Validation** ✅
- [ ] Existing `createShapeFromArea` action works in store
- [ ] `InsertAreaModal` component exists as reference pattern
- [ ] Area calculation utilities available in `areaCalculations.ts`
- [ ] Toolbar ribbon accepts new buttons in `App.tsx`

### **Development Tools Ready** ✅
- [ ] Browser dev tools available for testing
- [ ] VS Code or preferred editor configured for TypeScript
- [ ] Git working directory clean for commits

---

## Phase 1: Foundation Enhancement (4-6 hours)

### **Task 1.1: Extend Area Calculation Utilities**
**File**: `app/src/utils/areaCalculations.ts`
**Estimated Time**: 2 hours
**Priority**: Critical (Foundation)
**Dependencies**: None

#### **Implementation Steps**
- [ ] Add shape generation functions to existing file
- [ ] Implement precise mathematical calculations for each shape type
- [ ] Add preview calculation helpers
- [ ] Write comprehensive unit tests
- [ ] Validate area accuracy to 4 decimal places

#### **Code Implementation**
```typescript
// Add to existing areaCalculations.ts file
export const generateShapeFromArea = (
  area: number,
  unit: AreaUnit,
  shapeType: 'square' | 'rectangle' | 'circle',
  options: {
    aspectRatio?: number;
    position?: Point2D;
    useGridAlignment?: boolean;
  } = {}
): Point2D[] => {
  const areaInSquareMeters = convertToSquareMeters(area, unit);
  const position = options.position || { x: 0, y: 0 };

  // Use existing grid alignment if enabled
  const finalPosition = options.useGridAlignment
    ? calculateSmartGridPosition(position)
    : position;

  switch (shapeType) {
    case 'square':
      return generateSquarePoints(areaInSquareMeters, finalPosition);
    case 'rectangle':
      return generateRectanglePoints(areaInSquareMeters, options.aspectRatio || 1.5, finalPosition);
    case 'circle':
      return generateCirclePoints(areaInSquareMeters, finalPosition);
    default:
      throw new Error(`Unsupported shape type: ${shapeType}`);
  }
};

const generateSquarePoints = (area: number, center: Point2D): Point2D[] => {
  const side = Math.sqrt(area);
  const half = side / 2;
  return [
    { x: center.x - half, y: center.y - half },
    { x: center.x + half, y: center.y - half },
    { x: center.x + half, y: center.y + half },
    { x: center.x - half, y: center.y + half }
  ];
};

const generateRectanglePoints = (area: number, aspectRatio: number, center: Point2D): Point2D[] => {
  const width = Math.sqrt(area * aspectRatio);
  const height = area / width;
  const halfW = width / 2;
  const halfH = height / 2;
  return [
    { x: center.x - halfW, y: center.y - halfH },
    { x: center.x + halfW, y: center.y - halfH },
    { x: center.x + halfW, y: center.y + halfH },
    { x: center.x - halfW, y: center.y + halfH }
  ];
};

const generateCirclePoints = (area: number, center: Point2D, segments: number = 32): Point2D[] => {
  const radius = Math.sqrt(area / Math.PI);
  const points: Point2D[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  }
  return points;
};

export const calculateShapePreview = (
  area: number,
  unit: AreaUnit,
  shapeType: 'square' | 'rectangle' | 'circle',
  aspectRatio?: number
): { width: number; height: number; radius?: number } => {
  const areaInSquareMeters = convertToSquareMeters(area, unit);

  switch (shapeType) {
    case 'square':
      const side = Math.sqrt(areaInSquareMeters);
      return { width: side, height: side };
    case 'rectangle':
      const ratio = aspectRatio || 1.5;
      const width = Math.sqrt(areaInSquareMeters * ratio);
      const height = areaInSquareMeters / width;
      return { width, height };
    case 'circle':
      const radius = Math.sqrt(areaInSquareMeters / Math.PI);
      return { width: radius * 2, height: radius * 2, radius };
    default:
      throw new Error(`Unsupported shape type: ${shapeType}`);
  }
};

export const validateAreaInput = (
  area: number,
  unit: AreaUnit
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (area <= 0) {
    errors.push('Area must be positive');
  }

  const minArea = unit === 'sqkm' ? 0.000001 : 0.01;
  const maxArea = unit === 'sqkm' ? 1000 : convertToSquareMeters(1000, 'sqkm');

  if (area < minArea) {
    errors.push(`Area too small (minimum: ${minArea} ${unit})`);
  }

  if (area > maxArea) {
    errors.push('Area too large for rendering');
  }

  return { isValid: errors.length === 0, errors };
};
```

#### **Testing Requirements**
- [ ] Unit test for each shape type with known area values
- [ ] Test edge cases (very small/large areas)
- [ ] Validate precision requirements (±0.01%)
- [ ] Test aspect ratio variations for rectangles
- [ ] Verify grid alignment integration

#### **Validation Criteria**
- [ ] All functions export correctly without TypeScript errors
- [ ] Generated shapes have exact specified area (±0.01%)
- [ ] Grid alignment respects existing snap behavior
- [ ] Performance acceptable (<10ms per shape generation)
- [ ] All edge cases handled gracefully

---

### **Task 1.2: Enhance Type Definitions**
**File**: `app/src/types/index.ts`
**Estimated Time**: 45 minutes
**Priority**: High (Enables Development)
**Dependencies**: None

#### **Implementation Steps**
- [ ] Add AddAreaConfig interface to existing types
- [ ] Add AddAreaModalState interface
- [ ] Extend DrawingState if needed for modal state
- [ ] Ensure compatibility with existing AreaUnit type
- [ ] Add JSDoc documentation

#### **Code Implementation**
```typescript
// Add to existing types/index.ts
export interface AddAreaConfig {
  area: number;
  unit: AreaUnit;
  shapeType: 'square' | 'rectangle' | 'circle';
  aspectRatio?: number;
}

export interface AddAreaValidation {
  isValid: boolean;
  errors: string[];
}

export interface AddAreaModalState {
  isOpen: boolean;
  config: Partial<AddAreaConfig>;
  validation: AddAreaValidation;
  isLoading: boolean;
}

// If needed, extend DrawingState (optional)
export interface DrawingState {
  // ... existing properties
  addAreaModal?: AddAreaModalState;
}
```

#### **Validation Criteria**
- [ ] All types compile without errors
- [ ] Types integrate seamlessly with existing AreaUnit
- [ ] JSDoc documentation complete
- [ ] No breaking changes to existing type system

---

### **Task 1.3: Create Input Validation Utility**
**File**: `app/src/utils/validation.ts` (create if doesn't exist, or add to existing)
**Estimated Time**: 1.5 hours
**Priority**: Medium (Used by Modal)
**Dependencies**: Task 1.2

#### **Implementation Steps**
- [ ] Create comprehensive validation functions
- [ ] Add input sanitization for security
- [ ] Implement range validation based on unit type
- [ ] Add user-friendly error messages
- [ ] Write validation tests

#### **Code Implementation**
```typescript
// Create or extend utils/validation.ts
import type { AddAreaConfig, AddAreaValidation, AreaUnit } from '@/types';

const AREA_LIMITS = {
  sqm: { min: 0.01, max: 1000000 },
  sqft: { min: 0.1, max: 10763910 },
  acres: { min: 0.000001, max: 247 },
  hectares: { min: 0.0001, max: 100 },
  sqkm: { min: 0.000001, max: 1000 }
};

export const validateAddAreaConfig = (config: Partial<AddAreaConfig>): AddAreaValidation => {
  const errors: string[] = [];

  // Validate area value
  if (!config.area || config.area <= 0) {
    errors.push('Area must be a positive number');
  } else if (config.unit && config.area) {
    const limits = AREA_LIMITS[config.unit];
    if (config.area < limits.min) {
      errors.push(`Area must be at least ${limits.min} ${config.unit}`);
    }
    if (config.area > limits.max) {
      errors.push(`Area cannot exceed ${limits.max} ${config.unit}`);
    }
  }

  // Validate unit
  const validUnits = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm'];
  if (!config.unit || !validUnits.includes(config.unit)) {
    errors.push('Please select a valid unit');
  }

  // Validate shape type
  const validShapes = ['square', 'rectangle', 'circle'];
  if (!config.shapeType || !validShapes.includes(config.shapeType)) {
    errors.push('Please select a valid shape type');
  }

  // Validate aspect ratio for rectangles
  if (config.shapeType === 'rectangle') {
    if (config.aspectRatio && (config.aspectRatio < 0.1 || config.aspectRatio > 10)) {
      errors.push('Aspect ratio must be between 0.1 and 10');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeAreaInput = (input: string): number => {
  // Remove non-numeric characters except decimal point
  const cleaned = input.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num) || num <= 0) return 0;

  // Prevent extremely large values that could cause performance issues
  return Math.min(num, 1000000);
};

export const formatAreaDisplay = (area: number, unit: AreaUnit): string => {
  const decimals = unit === 'sqm' ? 2 : unit === 'sqft' ? 0 : 4;
  return `${area.toFixed(decimals)} ${unit}`;
};
```

#### **Testing Requirements**
- [ ] Test all validation rules with valid/invalid inputs
- [ ] Test sanitization with malicious input
- [ ] Test edge cases (boundary values)
- [ ] Performance test with large datasets

#### **Validation Criteria**
- [ ] All validation rules work correctly
- [ ] Sanitization prevents injection attacks
- [ ] Error messages are user-friendly
- [ ] Performance acceptable for real-time validation

---

## Phase 2: Modal Component Development (6-8 hours)

### **Task 2.1: Create Base Modal Component**
**File**: `app/src/components/AddArea/AddAreaModal.tsx`
**Estimated Time**: 3 hours
**Priority**: Critical (User Interface)
**Dependencies**: Phase 1 complete

#### **Implementation Steps**
- [ ] Create modal following InsertAreaModal pattern
- [ ] Implement form state management
- [ ] Add real-time validation
- [ ] Include keyboard shortcuts (Enter/Esc)
- [ ] Add loading states and animations
- [ ] Implement preview calculations

#### **Code Implementation**
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { validateAddAreaConfig, calculateShapePreview } from '@/utils';
import type { AddAreaConfig, AreaUnit } from '@/types';

interface AddAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAreaModal: React.FC<AddAreaModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<Partial<AddAreaConfig>>({
    unit: 'sqm',
    shapeType: 'square',
    aspectRatio: 1.5
  });

  const [isLoading, setIsLoading] = useState(false);
  const createAreaShape = useAppStore(state => state.createAreaShapeAdvanced);

  // Real-time validation
  const validation = React.useMemo(() => {
    return validateAddAreaConfig(config);
  }, [config]);

  // Preview calculations
  const preview = React.useMemo(() => {
    if (!validation.isValid || !config.area || !config.unit || !config.shapeType) {
      return null;
    }
    try {
      return calculateShapePreview(config.area, config.unit, config.shapeType, config.aspectRatio);
    } catch {
      return null;
    }
  }, [config, validation.isValid]);

  const handleSubmit = useCallback(async () => {
    if (!validation.isValid) return;

    setIsLoading(true);
    try {
      await createAreaShape(config as AddAreaConfig);
      onClose();
    } catch (error) {
      console.error('Failed to create area shape:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config, validation.isValid, createAreaShape, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && validation.isValid && !isLoading) {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, validation.isValid, isLoading, handleSubmit, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      const firstInput = document.querySelector('.add-area-modal input') as HTMLElement;
      firstInput?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="add-area-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '420px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideIn 0.2s ease-out'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: '#1F2937',
          fontFamily: 'Nunito Sans, sans-serif'
        }}>
          Add Area Shape
        </h2>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <AreaInput
            value={config.area}
            onChange={(area) => setConfig(prev => ({ ...prev, area }))}
            errors={validation.errors.filter(e => e.includes('Area'))}
          />

          <UnitSelector
            value={config.unit}
            onChange={(unit) => setConfig(prev => ({ ...prev, unit }))}
          />

          <ShapeTypeSelector
            value={config.shapeType}
            aspectRatio={config.aspectRatio}
            onChange={(shapeType, aspectRatio) =>
              setConfig(prev => ({ ...prev, shapeType, aspectRatio }))
            }
          />

          {preview && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#F3F4F6',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#374151'
            }}>
              <strong>Preview:</strong>
              {config.shapeType === 'circle' ? (
                <div>Radius: {preview.radius?.toFixed(2)}m</div>
              ) : (
                <div>
                  {preview.width.toFixed(2)}m × {preview.height.toFixed(2)}m
                </div>
              )}
            </div>
          )}

          {validation.errors.length > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#FEF2F2',
              borderRadius: '6px',
              border: '1px solid #FECACA'
            }}>
              {validation.errors.map((error, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#DC2626' }}>
                  {error}
                </div>
              ))}
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: '2px solid #D1D5DB',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Nunito Sans, sans-serif'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!validation.isValid || isLoading}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: validation.isValid && !isLoading
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : '#D1D5DB',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: validation.isValid && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.7 : 1,
                fontFamily: 'Nunito Sans, sans-serif'
              }}
            >
              {isLoading ? 'Creating...' : 'Create Shape'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateY(-20px) scale(0.95); }
          to { transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AddAreaModal;
```

#### **Testing Requirements**
- [ ] Modal opens/closes with smooth animations
- [ ] Form validation updates in real-time
- [ ] Keyboard shortcuts work correctly
- [ ] Loading states display properly
- [ ] Preview calculations are accurate

#### **Validation Criteria**
- [ ] Modal follows existing design patterns
- [ ] Accessibility features work (keyboard navigation, focus management)
- [ ] Performance is smooth (animations, calculations)
- [ ] Error handling is graceful

---

### **Task 2.2: Create Area Input Component**
**File**: `app/src/components/AddArea/AreaInput.tsx`
**Estimated Time**: 1.5 hours
**Priority**: High (Core Input)
**Dependencies**: Task 2.1

#### **Implementation Steps**
- [ ] Create controlled input with validation
- [ ] Add real-time formatting and sanitization
- [ ] Implement error state styling
- [ ] Add proper labeling and accessibility
- [ ] Include helpful placeholder and hints

#### **Code Implementation**
```typescript
import React from 'react';
import { sanitizeAreaInput } from '@/utils/validation';

interface AreaInputProps {
  value?: number;
  onChange: (value: number) => void;
  errors: string[];
}

export const AreaInput: React.FC<AreaInputProps> = ({ value, onChange, errors }) => {
  const [displayValue, setDisplayValue] = React.useState(value?.toString() || '');
  const [isFocused, setIsFocused] = React.useState(false);
  const hasError = errors.length > 0;

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value?.toString() || '');
    }
  }, [value, isFocused]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    setDisplayValue(rawValue);

    const sanitized = sanitizeAreaInput(rawValue);
    if (sanitized !== value) {
      onChange(sanitized);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format display value on blur if valid
    if (value && value > 0) {
      setDisplayValue(value.toString());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '6px',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Area Value *
      </label>

      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="Enter area value (e.g., 3000)"
        autoComplete="off"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: `2px solid ${hasError ? '#EF4444' : isFocused ? '#3B82F6' : '#D1D5DB'}`,
          fontSize: '16px',
          fontFamily: 'Nunito Sans, sans-serif',
          backgroundColor: hasError ? '#FEF2F2' : 'white',
          transition: 'all 0.2s ease',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        aria-invalid={hasError}
        aria-describedby={hasError ? 'area-input-error' : undefined}
      />

      {hasError && (
        <div
          id="area-input-error"
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#EF4444',
            fontFamily: 'Nunito Sans, sans-serif'
          }}
        >
          {errors[0]}
        </div>
      )}

      <div style={{
        marginTop: '4px',
        fontSize: '12px',
        color: '#6B7280',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Enter a positive number for the desired area
      </div>
    </div>
  );
};

export default AreaInput;
```

#### **Validation Criteria**
- [ ] Input accepts numeric values only
- [ ] Real-time validation with visual feedback
- [ ] Proper error state styling
- [ ] Accessibility features work correctly
- [ ] Sanitization prevents invalid inputs

---

### **Task 2.3: Create Unit Selector Component**
**File**: `app/src/components/AddArea/UnitSelector.tsx`
**Estimated Time**: 1 hour
**Priority**: Medium (User Choice)
**Dependencies**: Task 2.1

#### **Implementation Steps**
- [ ] Create dropdown with all supported units
- [ ] Add clear labels and descriptions
- [ ] Implement proper styling
- [ ] Add accessibility features
- [ ] Include unit conversion hints

#### **Code Implementation**
```typescript
import React from 'react';
import type { AreaUnit } from '@/types';

interface UnitSelectorProps {
  value?: AreaUnit;
  onChange: (unit: AreaUnit) => void;
}

const AREA_UNITS = [
  { value: 'sqm', label: 'Square Meters', symbol: 'm²', description: 'Metric standard' },
  { value: 'sqft', label: 'Square Feet', symbol: 'ft²', description: 'Imperial standard' },
  { value: 'acres', label: 'Acres', symbol: 'acres', description: 'Large land areas' },
  { value: 'hectares', label: 'Hectares', symbol: 'ha', description: 'Metric large areas' },
  { value: 'sqkm', label: 'Square Kilometers', symbol: 'km²', description: 'Very large areas' }
] as const;

export const UnitSelector: React.FC<UnitSelectorProps> = ({ value = 'sqm', onChange }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '6px',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Unit *
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AreaUnit)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '2px solid #D1D5DB',
          fontSize: '16px',
          fontFamily: 'Nunito Sans, sans-serif',
          backgroundColor: 'white',
          transition: 'all 0.2s ease',
          outline: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3B82F6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#D1D5DB';
        }}
      >
        {AREA_UNITS.map(unit => (
          <option key={unit.value} value={unit.value}>
            {unit.label} ({unit.symbol}) - {unit.description}
          </option>
        ))}
      </select>

      <div style={{
        marginTop: '4px',
        fontSize: '12px',
        color: '#6B7280',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Choose the unit for your area measurement
      </div>
    </div>
  );
};

export default UnitSelector;
```

#### **Validation Criteria**
- [ ] All unit options display correctly
- [ ] Selection updates parent state
- [ ] Styling matches design system
- [ ] Dropdown behavior works on all browsers

---

### **Task 2.4: Create Shape Type Selector Component**
**File**: `app/src/components/AddArea/ShapeTypeSelector.tsx`
**Estimated Time**: 2.5 hours
**Priority**: Medium (User Choice)
**Dependencies**: Task 2.1

#### **Implementation Steps**
- [ ] Create visual shape type selector
- [ ] Add aspect ratio controls for rectangles
- [ ] Implement interactive preview
- [ ] Add proper styling and animations
- [ ] Include accessibility features

#### **Code Implementation**
```typescript
import React from 'react';

interface ShapeTypeSelectorProps {
  value?: 'square' | 'rectangle' | 'circle';
  aspectRatio?: number;
  onChange: (shapeType: 'square' | 'rectangle' | 'circle', aspectRatio?: number) => void;
}

const SHAPE_TYPES = [
  {
    value: 'square',
    label: 'Square',
    description: 'Equal sides, perfect symmetry',
    icon: '⬜',
    preview: '□'
  },
  {
    value: 'rectangle',
    label: 'Rectangle',
    description: 'Customizable proportions',
    icon: '▭',
    preview: '▬'
  },
  {
    value: 'circle',
    label: 'Circle',
    description: 'Circular boundary',
    icon: '⭕',
    preview: '○'
  }
] as const;

export const ShapeTypeSelector: React.FC<ShapeTypeSelectorProps> = ({
  value = 'square',
  aspectRatio = 1.5,
  onChange
}) => {
  const handleShapeChange = (shapeType: typeof value) => {
    onChange(shapeType, shapeType === 'rectangle' ? aspectRatio : undefined);
  };

  const handleAspectRatioChange = (newRatio: number) => {
    if (value === 'rectangle') {
      onChange(value, newRatio);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '6px',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Shape Type *
      </label>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: value === 'rectangle' ? '16px' : '0'
      }}>
        {SHAPE_TYPES.map(shape => {
          const isSelected = value === shape.value;

          return (
            <button
              key={shape.value}
              type="button"
              onClick={() => handleShapeChange(shape.value)}
              style={{
                padding: '16px 12px',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? '#3B82F6' : '#D1D5DB'}`,
                backgroundColor: isSelected ? '#EBF8FF' : 'white',
                color: isSelected ? '#1E40AF' : '#374151',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Nunito Sans, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#9CA3AF';
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <span style={{ fontSize: '24px', lineHeight: 1 }}>{shape.icon}</span>
              <div>
                <div style={{ fontWeight: '600' }}>{shape.label}</div>
                <div style={{
                  fontSize: '11px',
                  color: isSelected ? '#3B82F6' : '#6B7280',
                  marginTop: '2px'
                }}>
                  {shape.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {value === 'rectangle' && (
        <div style={{
          padding: '16px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0'
        }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
            fontFamily: 'Nunito Sans, sans-serif'
          }}>
            Aspect Ratio (Width : Height)
          </label>

          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            {[1, 1.5, 2, 3].map(ratio => (
              <button
                key={ratio}
                type="button"
                onClick={() => handleAspectRatioChange(ratio)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${aspectRatio === ratio ? '#3B82F6' : '#D1D5DB'}`,
                  backgroundColor: aspectRatio === ratio ? '#EBF8FF' : 'white',
                  color: aspectRatio === ratio ? '#1E40AF' : '#374151',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Nunito Sans, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {ratio === 1 ? '1:1' : `${ratio}:1`}
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '12px',
              color: '#6B7280',
              fontFamily: 'Nunito Sans, sans-serif',
              minWidth: '40px'
            }}>
              Custom:
            </span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={aspectRatio}
              onChange={(e) => handleAspectRatioChange(parseFloat(e.target.value))}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor: '#D1D5DB',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '12px',
              color: '#374151',
              fontFamily: 'Nunito Sans, sans-serif',
              minWidth: '40px',
              fontWeight: '600'
            }}>
              {aspectRatio.toFixed(1)}:1
            </span>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '4px',
        fontSize: '12px',
        color: '#6B7280',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Choose the shape that best fits your needs
      </div>
    </div>
  );
};

export default ShapeTypeSelector;
```

#### **Validation Criteria**
- [ ] All shape types selectable with visual feedback
- [ ] Rectangle aspect ratio controls work smoothly
- [ ] Styling matches design system
- [ ] Responsive design works on mobile
- [ ] Accessibility features functional

---

## Phase 3: Store Integration (4-6 hours)

### **Task 3.1: Enhance Store Actions**
**File**: `app/src/store/useAppStore.ts`
**Estimated Time**: 2.5 hours
**Priority**: Critical (Backend Logic)
**Dependencies**: Phase 1 complete

#### **Implementation Steps**
- [ ] Add modal state management to store
- [ ] Enhance existing createShapeFromArea action
- [ ] Add new createAreaShapeAdvanced action
- [ ] Integrate with existing layer management
- [ ] Add proper error handling

#### **Code Implementation**
```typescript
// Add to existing useAppStore.ts
interface AppStore extends AppState {
  // ... existing properties

  // Add Area Modal State
  addAreaModalOpen: boolean;

  // ... existing actions

  // Modal Actions
  openAddAreaModal: () => void;
  closeAddAreaModal: () => void;

  // Enhanced Area Shape Creation
  createAreaShapeAdvanced: (config: AddAreaConfig) => void;
}

// Add to store implementation
export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // ... existing state
      addAreaModalOpen: false,

      // ... existing actions

      openAddAreaModal: () => {
        set(state => ({
          ...state,
          addAreaModalOpen: true
        }), false, 'openAddAreaModal');
      },

      closeAddAreaModal: () => {
        set(state => ({
          ...state,
          addAreaModalOpen: false
        }), false, 'closeAddAreaModal');
      },

      createAreaShapeAdvanced: (config: AddAreaConfig) => {
        try {
          const { area, unit, shapeType, aspectRatio } = config;

          // Generate shape points using enhanced utilities
          const points = generateShapeFromArea(area, unit, shapeType, {
            aspectRatio,
            position: { x: 0, y: 0 }, // Scene center
            useGridAlignment: get().drawing.snapToGrid
          });

          // Create layer with descriptive name
          const layerName = `Area: ${area} ${getUnitLabel(unit)}`;
          const newLayer: Layer = {
            id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: layerName,
            visible: true,
            locked: false,
            color: '#22C55E', // Green for area shapes
            opacity: 1,
            created: new Date(),
            modified: new Date()
          };

          // Create shape with proper type mapping
          const shapeType = config.shapeType === 'circle' ? 'circle' : 'rectangle';
          const newShape: Shape = {
            id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${config.shapeType.charAt(0).toUpperCase() + config.shapeType.slice(1)} - ${area} ${getUnitLabel(unit)}`,
            points,
            type: shapeType,
            color: newLayer.color,
            visible: true,
            layerId: newLayer.id,
            created: new Date(),
            modified: new Date()
          };

          // Update store with batched changes for performance
          set(state => ({
            ...state,
            layers: [...state.layers, newLayer],
            shapes: [...state.shapes, newShape],
            activeLayerId: newLayer.id,
            selectedShapeId: newShape.id,
            addAreaModalOpen: false
          }), false, 'createAreaShapeAdvanced');

          // Save to history using existing action
          get().saveToHistory();

          // Trigger render for immediate visual feedback
          get().triggerRender();

          // Invalidate geometry cache for new shape
          GeometryCache.invalidateShape(newShape);

          logger.log('Area shape created successfully', {
            area,
            unit,
            shapeType: config.shapeType,
            layerId: newLayer.id,
            shapeId: newShape.id
          });

        } catch (error) {
          logger.error('Failed to create area shape', error);
          throw error;
        }
      }
    }),
    {
      name: 'land-visualizer-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);
```

#### **Testing Requirements**
- [ ] Modal state management works correctly
- [ ] Shape creation integrates with existing systems
- [ ] Layer creation and naming functions properly
- [ ] History system records changes correctly
- [ ] Error handling works for edge cases

#### **Validation Criteria**
- [ ] No TypeScript errors
- [ ] Store actions work without side effects
- [ ] Performance remains smooth
- [ ] Integration with existing actions seamless

---

### **Task 3.2: Add Toolbar Button**
**File**: `app/src/App.tsx`
**Estimated Time**: 1 hour
**Priority**: Medium (User Access)
**Dependencies**: Task 3.1

#### **Implementation Steps**
- [ ] Locate appropriate toolbar section
- [ ] Add "Add Area" button with proper styling
- [ ] Connect to store actions
- [ ] Add hover effects and tooltips
- [ ] Ensure responsive behavior

#### **Code Implementation**
```typescript
// Add to App.tsx in the appropriate toolbar section
import { useAppStore } from './store/useAppStore';

// In the component, add these store connections:
const addAreaModalOpen = useAppStore(state => state.addAreaModalOpen);
const openAddAreaModal = useAppStore(state => state.openAddAreaModal);

// Add this button in the Area Configuration section of the toolbar:
<button
  onClick={openAddAreaModal}
  style={{
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #10B981, #059669)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'Nunito Sans, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
  }}
  title="Create shape from specified area"
>
  <Icon name="plus" size={16} />
  Add Area
</button>
```

#### **Validation Criteria**
- [ ] Button appears in correct toolbar location
- [ ] Styling matches existing design system
- [ ] Hover effects work smoothly
- [ ] Clicking opens modal correctly
- [ ] Responsive behavior on mobile

---

### **Task 3.3: Connect Modal to App**
**File**: `app/src/App.tsx`
**Estimated Time**: 30 minutes
**Priority**: High (Final Integration)
**Dependencies**: Task 3.2, Phase 2 complete

#### **Implementation Steps**
- [ ] Import AddAreaModal component
- [ ] Add modal to render tree
- [ ] Connect to store state
- [ ] Ensure proper z-index and positioning
- [ ] Test complete workflow

#### **Code Implementation**
```typescript
// Add to App.tsx imports
import { AddAreaModal } from './components/AddArea/AddAreaModal';

// In the component, add store connection:
const addAreaModalOpen = useAppStore(state => state.addAreaModalOpen);
const closeAddAreaModal = useAppStore(state => state.closeAddAreaModal);

// Add modal to render tree (near other modals):
return (
  <div>
    {/* ... existing app content */}

    {/* Add Area Modal */}
    <AddAreaModal
      isOpen={addAreaModalOpen}
      onClose={closeAddAreaModal}
    />

    {/* ... other modals */}
  </div>
);
```

#### **Validation Criteria**
- [ ] Modal renders correctly in app
- [ ] State connections work properly
- [ ] No z-index conflicts with other modals
- [ ] Complete workflow functions end-to-end

---

## Phase 4: Testing & Polish (4-6 hours)

### **Task 4.1: Create Comprehensive Test Suite**
**File**: `app/src/test/AddAreaFeature.test.tsx`
**Estimated Time**: 3 hours
**Priority**: High (Quality Assurance)
**Dependencies**: Phase 3 complete

#### **Implementation Steps**
- [ ] Create unit tests for all utilities
- [ ] Add component tests for modal and inputs
- [ ] Write integration tests for complete workflow
- [ ] Add performance tests for shape generation
- [ ] Include edge case testing

#### **Code Implementation**
```typescript
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddAreaModal } from '../components/AddArea/AddAreaModal';
import { generateShapeFromArea, calculateShapePreview, validateAddAreaConfig } from '../utils/areaCalculations';
import { useAppStore } from '../store/useAppStore';

describe('Add Area Feature', () => {
  describe('Area Calculations', () => {
    test('generates correct square from area', () => {
      const points = generateShapeFromArea(100, 'sqm', 'square');

      // Calculate area from generated points
      const calculatedArea = Math.abs(
        (points[0].x * (points[1].y - points[3].y) +
         points[1].x * (points[2].y - points[0].y) +
         points[2].x * (points[3].y - points[1].y) +
         points[3].x * (points[0].y - points[2].y)) / 2
      );

      expect(calculatedArea).toBeCloseTo(100, 2);
    });

    test('generates correct rectangle with aspect ratio', () => {
      const points = generateShapeFromArea(150, 'sqm', 'rectangle', { aspectRatio: 1.5 });

      const width = Math.abs(points[1].x - points[0].x);
      const height = Math.abs(points[2].y - points[1].y);
      const area = width * height;
      const aspectRatio = width / height;

      expect(area).toBeCloseTo(150, 2);
      expect(aspectRatio).toBeCloseTo(1.5, 2);
    });

    test('generates correct circle area', () => {
      const points = generateShapeFromArea(314.159, 'sqm', 'circle');

      // For circle, calculate area from radius
      const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      const radius = Math.sqrt(
        Math.pow(points[0].x - centerX, 2) + Math.pow(points[0].y - centerY, 2)
      );
      const calculatedArea = Math.PI * radius * radius;

      expect(calculatedArea).toBeCloseTo(314.159, 1);
    });

    test('handles unit conversions correctly', () => {
      const sqftPoints = generateShapeFromArea(1000, 'sqft', 'square');
      const sqmPoints = generateShapeFromArea(92.903, 'sqm', 'square');

      // Should generate approximately same size shapes
      const sqftSide = Math.abs(sqftPoints[1].x - sqftPoints[0].x);
      const sqmSide = Math.abs(sqmPoints[1].x - sqmPoints[0].x);

      expect(sqftSide).toBeCloseTo(sqmSide, 1);
    });
  });

  describe('Validation', () => {
    test('validates correct configuration', () => {
      const config = {
        area: 1000,
        unit: 'sqm' as const,
        shapeType: 'square' as const
      };

      const result = validateAddAreaConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects invalid area values', () => {
      const config = {
        area: -100,
        unit: 'sqm' as const,
        shapeType: 'square' as const
      };

      const result = validateAddAreaConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Area must be a positive number');
    });

    test('validates area limits by unit', () => {
      const config = {
        area: 0.001,
        unit: 'sqm' as const,
        shapeType: 'square' as const
      };

      const result = validateAddAreaConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too small'))).toBe(true);
    });
  });

  describe('Modal Component', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn()
    };

    test('renders when open', () => {
      render(<AddAreaModal {...defaultProps} />);
      expect(screen.getByText('Add Area Shape')).toBeInTheDocument();
    });

    test('does not render when closed', () => {
      render(<AddAreaModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Add Area Shape')).not.toBeInTheDocument();
    });

    test('validates form inputs in real-time', async () => {
      render(<AddAreaModal {...defaultProps} />);

      const createButton = screen.getByText('Create Shape');
      expect(createButton).toBeDisabled();

      const areaInput = screen.getByPlaceholderText(/Enter area value/);
      fireEvent.change(areaInput, { target: { value: '1000' } });

      await waitFor(() => {
        expect(createButton).not.toBeDisabled();
      });
    });

    test('shows preview when valid configuration entered', async () => {
      render(<AddAreaModal {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText(/Enter area value/), {
        target: { value: '100' }
      });

      await waitFor(() => {
        expect(screen.getByText(/Preview:/)).toBeInTheDocument();
      });
    });

    test('handles keyboard shortcuts', () => {
      const onClose = vi.fn();
      render(<AddAreaModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Store Integration', () => {
    test('modal state management works', () => {
      const store = useAppStore.getState();

      // Test opening modal
      store.openAddAreaModal();
      expect(useAppStore.getState().addAreaModalOpen).toBe(true);

      // Test closing modal
      store.closeAddAreaModal();
      expect(useAppStore.getState().addAreaModalOpen).toBe(false);
    });

    test('creates area shape correctly', () => {
      const store = useAppStore.getState();
      const initialShapeCount = store.shapes.length;
      const initialLayerCount = store.layers.length;

      const config = {
        area: 1000,
        unit: 'sqm' as const,
        shapeType: 'square' as const
      };

      store.createAreaShapeAdvanced(config);

      const newStore = useAppStore.getState();
      expect(newStore.shapes).toHaveLength(initialShapeCount + 1);
      expect(newStore.layers).toHaveLength(initialLayerCount + 1);
      expect(newStore.addAreaModalOpen).toBe(false);

      // Check new layer name
      const newLayer = newStore.layers[newStore.layers.length - 1];
      expect(newLayer.name).toContain('1000');
      expect(newLayer.name).toContain('m²');
    });
  });

  describe('Performance', () => {
    test('shape generation performance', () => {
      const start = performance.now();

      // Generate 100 shapes
      for (let i = 0; i < 100; i++) {
        generateShapeFromArea(1000, 'sqm', 'square');
        generateShapeFromArea(1000, 'sqm', 'rectangle', { aspectRatio: 1.5 });
        generateShapeFromArea(1000, 'sqm', 'circle');
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    test('validation performance', () => {
      const start = performance.now();

      // Validate 1000 configurations
      for (let i = 0; i < 1000; i++) {
        validateAddAreaConfig({
          area: 1000 + i,
          unit: 'sqm',
          shapeType: 'square'
        });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
    });
  });
});
```

#### **Validation Criteria**
- [ ] All tests pass consistently
- [ ] Test coverage above 70%
- [ ] Performance benchmarks met
- [ ] Edge cases properly covered

---

### **Task 4.2: Performance Optimization**
**File**: Various files
**Estimated Time**: 1.5 hours
**Priority**: Medium (User Experience)
**Dependencies**: Task 4.1

#### **Implementation Steps**
- [ ] Optimize shape generation algorithms
- [ ] Add memoization for expensive calculations
- [ ] Implement debouncing for real-time validation
- [ ] Optimize modal rendering performance
- [ ] Add loading states for better UX

#### **Optimization Areas**
```typescript
// Memoize expensive calculations
const memoizedShapeGeneration = React.useMemo(() => {
  if (!config.area || !config.unit || !config.shapeType) return null;
  return generateShapeFromArea(config.area, config.unit, config.shapeType, {
    aspectRatio: config.aspectRatio
  });
}, [config.area, config.unit, config.shapeType, config.aspectRatio]);

// Debounce validation for better performance
const debouncedValidation = useCallback(
  debounce((config: Partial<AddAreaConfig>) => {
    setValidation(validateAddAreaConfig(config));
  }, 150),
  []
);
```

#### **Validation Criteria**
- [ ] Modal opens within 100ms
- [ ] Shape generation completes within 200ms
- [ ] No performance regression in 3D scene
- [ ] Smooth animations and interactions

---

### **Task 4.3: User Experience Polish**
**File**: Various files
**Estimated Time**: 1.5 hours
**Priority**: Medium (Professional Finish)
**Dependencies**: Task 4.2

#### **Implementation Steps**
- [ ] Add loading animations and states
- [ ] Implement success feedback
- [ ] Enhance error handling and messages
- [ ] Add accessibility improvements
- [ ] Include helpful tooltips and hints

#### **UX Enhancements**
```typescript
// Loading states
{isLoading && (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px'
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid #E5E7EB',
      borderTop: '3px solid #3B82F6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  </div>
)}

// Success feedback
const showSuccessMessage = () => {
  // Brief toast or notification
  setTimeout(() => {
    // Remove success message
  }, 2000);
};
```

#### **Validation Criteria**
- [ ] All error states provide helpful guidance
- [ ] Loading states are smooth and informative
- [ ] Accessibility features work correctly
- [ ] Professional polish matches design system

---

## Validation Checklists

### **Before Starting Development**
- [ ] Development environment set up and running
- [ ] All existing functionality working correctly
- [ ] Git working directory clean
- [ ] Test suite executable

### **After Phase 1 (Foundation)**
- [ ] Area calculation utilities work correctly
- [ ] Type definitions compile without errors
- [ ] Validation functions handle all edge cases
- [ ] Unit tests pass for all utilities

### **After Phase 2 (Modal)**
- [ ] Modal opens/closes smoothly
- [ ] All form inputs work correctly
- [ ] Real-time validation provides immediate feedback
- [ ] Component tests pass

### **After Phase 3 (Integration)**
- [ ] Toolbar button appears and functions
- [ ] Store integration works seamlessly
- [ ] Complete workflow functional end-to-end
- [ ] Integration tests pass

### **Before Feature Completion**
- [ ] All acceptance criteria met
- [ ] Performance targets achieved
- [ ] Test coverage above 70%
- [ ] No TypeScript errors or warnings
- [ ] Constitution compliance verified
- [ ] User experience polished and professional

---

## Quick Test Commands

```bash
# Development server
cd app && npm run dev

# Type checking
npm run type-check

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build

# Run specific test file
npm test AddAreaFeature.test.tsx
```

---

## Implementation Timeline

### **Week 1: Foundation & Core (12-14 hours)**
- **Days 1-2**: Phase 1 - Foundation Enhancement (4-6 hours)
- **Days 3-4**: Phase 2 - Modal Development (6-8 hours)
- **Day 5**: Initial testing and debugging (2 hours)

### **Week 2: Integration & Polish (6-8 hours)**
- **Days 1-2**: Phase 3 - Store Integration (4-6 hours)
- **Days 3-4**: Phase 4 - Testing & Polish (4-6 hours)
- **Day 5**: Final validation and documentation (2 hours)

---

## Success Metrics

### **Technical Completion**
- [ ] All 12 tasks completed successfully
- [ ] Feature implemented within 18-22 hour estimate
- [ ] All acceptance criteria from specification met
- [ ] Performance targets achieved

### **Quality Standards**
- [ ] Test coverage above 70%
- [ ] All constitution compliance articles satisfied
- [ ] Code review approved
- [ ] No critical bugs in testing

### **User Experience**
- [ ] Users can create area shapes in under 30 seconds
- [ ] Generated areas match input within 0.01% tolerance
- [ ] Feature integrates seamlessly with existing workflows
- [ ] Professional polish and error handling

**Ready for Implementation**: All tasks defined with clear steps, code examples, and validation criteria. Begin with Phase 1, Task 1.1 (Area Calculation Utilities).