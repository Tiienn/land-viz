# Task Breakdown: Add Area Feature

**Spec ID**: 003
**Feature Name**: Add Area Feature
**Tasks Version**: 1.0
**Created**: 2025-09-17

## Development Phases

### Phase 1: Foundation (6 hours)
Core utilities, types, and basic modal infrastructure

### Phase 2: Modal Implementation (8 hours)
Complete modal interface with validation and UX

### Phase 3: Integration (4 hours)
Toolbar integration and state management

### Phase 4: Testing & Polish (4 hours)
Comprehensive testing and final refinements

**Total Estimated Time**: 22 hours

---

## Phase 1: Foundation (6 hours)

### Task 1.1: Create TypeScript Definitions (1 hour)
**File**: `app/src/types/addArea.ts`
**Priority**: High
**Dependencies**: None

```typescript
// Create new type definitions
export interface AddAreaConfig {
  area: number;
  unit: AreaUnit;
  shapeType: 'square' | 'rectangle' | 'circle';
  aspectRatio?: number;
}

export interface AddAreaValidation {
  isValid: boolean;
  errors: AddAreaError[];
}

export interface AddAreaError {
  field: string;
  message: string;
  code: string;
}

export interface AddAreaModalState {
  isOpen: boolean;
  config: Partial<AddAreaConfig>;
  validation: AddAreaValidation;
  isLoading: boolean;
}
```

**Validation Criteria**:
- [ ] All types compile without errors
- [ ] Types integrate with existing AreaUnit type
- [ ] Proper JSDoc documentation

### Task 1.2: Unit Conversion Utilities (1.5 hours)
**File**: `app/src/utils/unitConversions.ts`
**Priority**: High
**Dependencies**: Task 1.1

```typescript
// Area unit conversion constants and functions
const AREA_CONVERSIONS = {
  'sqm': 1,
  'sqft': 0.092903,
  'acres': 4046.86,
  'hectares': 10000,
  'sqkm': 1000000
};

export const convertToSquareMeters = (value: number, unit: AreaUnit): number => {
  return value * AREA_CONVERSIONS[unit];
};

export const convertFromSquareMeters = (value: number, unit: AreaUnit): number => {
  return value / AREA_CONVERSIONS[unit];
};

export const formatAreaValue = (value: number, unit: AreaUnit): string => {
  const decimals = unit === 'sqm' ? 2 : unit === 'sqft' ? 0 : 4;
  return `${value.toFixed(decimals)} ${unit}`;
};
```

**Validation Criteria**:
- [ ] All unit conversions accurate to 6 decimal places
- [ ] Handles edge cases (zero, negative, very large numbers)
- [ ] Includes comprehensive unit tests

### Task 1.3: Area-to-Shape Generator (2 hours)
**File**: `app/src/utils/areaShapeGenerator.ts`
**Priority**: High
**Dependencies**: Task 1.2

```typescript
import type { Point2D, AreaUnit } from '@/types';
import { convertToSquareMeters } from './unitConversions';

export const generateShapeFromArea = (
  area: number,
  unit: AreaUnit,
  shapeType: 'square' | 'rectangle' | 'circle',
  options: { aspectRatio?: number; position?: Point2D } = {}
): Point2D[] => {
  const areaInSquareMeters = convertToSquareMeters(area, unit);
  const position = options.position || { x: 0, y: 0 };

  switch (shapeType) {
    case 'square':
      return generateSquare(areaInSquareMeters, position);
    case 'rectangle':
      return generateRectangle(areaInSquareMeters, options.aspectRatio || 1.5, position);
    case 'circle':
      return generateCircle(areaInSquareMeters, position);
    default:
      throw new Error(`Unsupported shape type: ${shapeType}`);
  }
};

const generateSquare = (area: number, center: Point2D): Point2D[] => {
  const side = Math.sqrt(area);
  const half = side / 2;
  return [
    { x: center.x - half, y: center.y - half },
    { x: center.x + half, y: center.y - half },
    { x: center.x + half, y: center.y + half },
    { x: center.x - half, y: center.y + half }
  ];
};

const generateRectangle = (area: number, aspectRatio: number, center: Point2D): Point2D[] => {
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

const generateCircle = (area: number, center: Point2D, segments: number = 32): Point2D[] => {
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

export const calculateShapeDimensions = (
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
```

**Validation Criteria**:
- [ ] Generated shapes have exact specified area (±0.01%)
- [ ] All shape types supported
- [ ] Proper positioning around center point
- [ ] Edge cases handled (very small/large areas)

### Task 1.4: Input Validation Logic (1.5 hours)
**File**: `app/src/utils/addAreaValidation.ts`
**Priority**: Medium
**Dependencies**: Task 1.1, 1.2

```typescript
import type { AddAreaConfig, AddAreaValidation, AddAreaError } from '@/types/addArea';

const MIN_AREA = 0.01; // 0.01 m² minimum
const MAX_AREA = 1000000; // 1 km² maximum

export const validateAddAreaConfig = (config: Partial<AddAreaConfig>): AddAreaValidation => {
  const errors: AddAreaError[] = [];

  // Validate area value
  if (!config.area || config.area <= 0) {
    errors.push({
      field: 'area',
      message: 'Area must be a positive number',
      code: 'INVALID_AREA'
    });
  } else if (config.area < MIN_AREA) {
    errors.push({
      field: 'area',
      message: `Area must be at least ${MIN_AREA} square meters`,
      code: 'AREA_TOO_SMALL'
    });
  } else if (config.area > MAX_AREA) {
    errors.push({
      field: 'area',
      message: 'Area is too large',
      code: 'AREA_TOO_LARGE'
    });
  }

  // Validate unit
  const validUnits = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm'];
  if (!config.unit || !validUnits.includes(config.unit)) {
    errors.push({
      field: 'unit',
      message: 'Please select a valid unit',
      code: 'INVALID_UNIT'
    });
  }

  // Validate shape type
  const validShapes = ['square', 'rectangle', 'circle'];
  if (!config.shapeType || !validShapes.includes(config.shapeType)) {
    errors.push({
      field: 'shapeType',
      message: 'Please select a valid shape type',
      code: 'INVALID_SHAPE'
    });
  }

  // Validate aspect ratio for rectangles
  if (config.shapeType === 'rectangle') {
    if (config.aspectRatio && (config.aspectRatio < 0.1 || config.aspectRatio > 10)) {
      errors.push({
        field: 'aspectRatio',
        message: 'Aspect ratio must be between 0.1 and 10',
        code: 'INVALID_ASPECT_RATIO'
      });
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
  return isNaN(num) ? 0 : Math.max(0, Math.min(num, MAX_AREA));
};
```

**Validation Criteria**:
- [ ] All validation rules work correctly
- [ ] Error messages are user-friendly
- [ ] Sanitization prevents injection attacks
- [ ] Performance acceptable for real-time validation

---

## Phase 2: Modal Implementation (8 hours)

### Task 2.1: Base Modal Component (2 hours)
**File**: `app/src/components/AddArea/AddAreaModal.tsx`
**Priority**: High
**Dependencies**: Phase 1 complete

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import type { AddAreaConfig, AddAreaValidation } from '@/types/addArea';
import { validateAddAreaConfig } from '@/utils/addAreaValidation';
import { calculateShapeDimensions } from '@/utils/areaShapeGenerator';
import AreaInput from './AreaInput';
import UnitSelector from './UnitSelector';
import ShapeTypeSelector from './ShapeTypeSelector';

interface AddAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: AddAreaConfig) => void;
}

const AddAreaModal: React.FC<AddAreaModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [config, setConfig] = useState<Partial<AddAreaConfig>>({
    area: undefined,
    unit: 'sqm',
    shapeType: 'square',
    aspectRatio: 1.5
  });

  const [validation, setValidation] = useState<AddAreaValidation>({ isValid: false, errors: [] });
  const [isLoading, setIsLoading] = useState(false);

  // Validate config whenever it changes
  useEffect(() => {
    const newValidation = validateAddAreaConfig(config);
    setValidation(newValidation);
  }, [config]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validation.isValid) return;

    setIsLoading(true);
    try {
      await onSubmit(config as AddAreaConfig);
      onClose();
    } catch (error) {
      console.error('Failed to create area shape:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config, validation.isValid, onSubmit, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter' && validation.isValid) {
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, validation.isValid, handleSubmit, onClose]);

  // Calculate preview dimensions
  const previewDimensions = React.useMemo(() => {
    if (!config.area || !config.unit || !config.shapeType) return null;
    try {
      return calculateShapeDimensions(config.area, config.unit, config.shapeType, config.aspectRatio);
    } catch {
      return null;
    }
  }, [config]);

  if (!isOpen) return null;

  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
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
          color: '#1F2937'
        }}>
          Add Area Shape
        </h2>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <AreaInput
            value={config.area}
            onChange={(area) => setConfig(prev => ({ ...prev, area }))}
            errors={validation.errors.filter(e => e.field === 'area')}
          />

          <UnitSelector
            value={config.unit}
            onChange={(unit) => setConfig(prev => ({ ...prev, unit }))}
            errors={validation.errors.filter(e => e.field === 'unit')}
          />

          <ShapeTypeSelector
            value={config.shapeType}
            aspectRatio={config.aspectRatio}
            onChange={(shapeType, aspectRatio) => setConfig(prev => ({
              ...prev,
              shapeType,
              aspectRatio
            }))}
            errors={validation.errors.filter(e => ['shapeType', 'aspectRatio'].includes(e.field))}
          />

          {previewDimensions && (
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
                <div>Radius: {previewDimensions.radius?.toFixed(2)}m</div>
              ) : (
                <div>
                  Width: {previewDimensions.width.toFixed(2)}m ×
                  Height: {previewDimensions.height.toFixed(2)}m
                </div>
              )}
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
                transition: 'all 0.2s ease'
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
                background: validation.isValid
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : '#D1D5DB',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: validation.isValid ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.7 : 1
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

**Validation Criteria**:
- [ ] Modal opens/closes smoothly with animations
- [ ] Keyboard shortcuts work (Enter/Esc)
- [ ] Form validation updates in real-time
- [ ] Loading states handled properly
- [ ] Responsive design works on mobile

### Task 2.2: Area Input Component (1.5 hours)
**File**: `app/src/components/AddArea/AreaInput.tsx`
**Priority**: High
**Dependencies**: Task 2.1

```typescript
import React from 'react';
import type { AddAreaError } from '@/types/addArea';
import { sanitizeAreaInput } from '@/utils/addAreaValidation';

interface AreaInputProps {
  value?: number;
  onChange: (value: number) => void;
  errors: AddAreaError[];
}

const AreaInput: React.FC<AreaInputProps> = ({ value, onChange, errors }) => {
  const [displayValue, setDisplayValue] = React.useState(value?.toString() || '');
  const hasError = errors.length > 0;

  React.useEffect(() => {
    setDisplayValue(value?.toString() || '');
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    setDisplayValue(rawValue);

    const sanitized = sanitizeAreaInput(rawValue);
    onChange(sanitized);
  };

  const handleBlur = () => {
    // Format display value on blur
    if (value && value > 0) {
      setDisplayValue(value.toString());
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '6px'
      }}>
        Area Value *
      </label>

      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Enter area value"
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: `2px solid ${hasError ? '#EF4444' : '#D1D5DB'}`,
          fontSize: '16px',
          backgroundColor: hasError ? '#FEF2F2' : 'white',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = hasError ? '#EF4444' : '#3B82F6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = hasError ? '#EF4444' : '#D1D5DB';
          handleBlur();
        }}
      />

      {hasError && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#EF4444'
        }}>
          {errors[0].message}
        </div>
      )}
    </div>
  );
};

export default AreaInput;
```

**Validation Criteria**:
- [ ] Input sanitization works correctly
- [ ] Real-time validation with visual feedback
- [ ] Proper formatting on blur
- [ ] Error states display clearly
- [ ] Accessible with proper labels

### Task 2.3: Unit Selector Component (1 hour)
**File**: `app/src/components/AddArea/UnitSelector.tsx`
**Priority**: Medium
**Dependencies**: Task 2.1

```typescript
import React from 'react';
import type { AreaUnit } from '@/types';
import type { AddAreaError } from '@/types/addArea';

interface UnitSelectorProps {
  value?: AreaUnit;
  onChange: (unit: AreaUnit) => void;
  errors: AddAreaError[];
}

const AREA_UNITS = [
  { value: 'sqm', label: 'Square Meters (m²)', symbol: 'm²' },
  { value: 'sqft', label: 'Square Feet (ft²)', symbol: 'ft²' },
  { value: 'acres', label: 'Acres', symbol: 'acres' },
  { value: 'hectares', label: 'Hectares (ha)', symbol: 'ha' },
  { value: 'sqkm', label: 'Square Kilometers (km²)', symbol: 'km²' }
] as const;

const UnitSelector: React.FC<UnitSelectorProps> = ({ value, onChange, errors }) => {
  const hasError = errors.length > 0;

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '6px'
      }}>
        Unit *
      </label>

      <select
        value={value || 'sqm'}
        onChange={(e) => onChange(e.target.value as AreaUnit)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: `2px solid ${hasError ? '#EF4444' : '#D1D5DB'}`,
          fontSize: '16px',
          backgroundColor: hasError ? '#FEF2F2' : 'white',
          transition: 'all 0.2s ease',
          outline: 'none',
          cursor: 'pointer'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = hasError ? '#EF4444' : '#3B82F6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = hasError ? '#EF4444' : '#D1D5DB';
        }}
      >
        {AREA_UNITS.map(unit => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
          </option>
        ))}
      </select>

      {hasError && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#EF4444'
        }}>
          {errors[0].message}
        </div>
      )}
    </div>
  );
};

export default UnitSelector;
```

**Validation Criteria**:
- [ ] All unit options display correctly
- [ ] Selection updates parent state
- [ ] Error states handled properly
- [ ] Accessible dropdown behavior

### Task 2.4: Shape Type Selector Component (2 hours)
**File**: `app/src/components/AddArea/ShapeTypeSelector.tsx`
**Priority**: Medium
**Dependencies**: Task 2.1

```typescript
import React from 'react';
import type { AddAreaError } from '@/types/addArea';

interface ShapeTypeSelectorProps {
  value?: 'square' | 'rectangle' | 'circle';
  aspectRatio?: number;
  onChange: (shapeType: 'square' | 'rectangle' | 'circle', aspectRatio?: number) => void;
  errors: AddAreaError[];
}

const SHAPE_TYPES = [
  {
    value: 'square',
    label: 'Square',
    description: 'Perfect square with equal sides',
    icon: '⬜'
  },
  {
    value: 'rectangle',
    label: 'Rectangle',
    description: 'Rectangular shape with customizable proportions',
    icon: '▭'
  },
  {
    value: 'circle',
    label: 'Circle',
    description: 'Perfect circular shape',
    icon: '⭕'
  }
] as const;

const ShapeTypeSelector: React.FC<ShapeTypeSelectorProps> = ({
  value,
  aspectRatio,
  onChange,
  errors
}) => {
  const hasError = errors.length > 0;

  const handleShapeChange = (shapeType: 'square' | 'rectangle' | 'circle') => {
    onChange(shapeType, shapeType === 'rectangle' ? (aspectRatio || 1.5) : undefined);
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
        marginBottom: '6px'
      }}>
        Shape Type *
      </label>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: value === 'rectangle' ? '12px' : '0'
      }}>
        {SHAPE_TYPES.map(shape => {
          const isSelected = value === shape.value;

          return (
            <button
              key={shape.value}
              type="button"
              onClick={() => handleShapeChange(shape.value)}
              style={{
                padding: '12px 8px',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? '#3B82F6' : '#D1D5DB'}`,
                backgroundColor: isSelected ? '#EBF8FF' : 'white',
                color: isSelected ? '#1E40AF' : '#374151',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
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
              <span style={{ fontSize: '18px' }}>{shape.icon}</span>
              <span>{shape.label}</span>
            </button>
          );
        })}
      </div>

      {value === 'rectangle' && (
        <div style={{
          padding: '12px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          border: hasError ? '2px solid #EF4444' : 'none'
        }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Aspect Ratio (Width:Height)
          </label>

          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <button
              type="button"
              onClick={() => handleAspectRatioChange(1)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `2px solid ${aspectRatio === 1 ? '#3B82F6' : '#D1D5DB'}`,
                backgroundColor: aspectRatio === 1 ? '#EBF8FF' : 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              1:1
            </button>

            <button
              type="button"
              onClick={() => handleAspectRatioChange(1.5)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `2px solid ${aspectRatio === 1.5 ? '#3B82F6' : '#D1D5DB'}`,
                backgroundColor: aspectRatio === 1.5 ? '#EBF8FF' : 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              3:2
            </button>

            <button
              type="button"
              onClick={() => handleAspectRatioChange(2)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `2px solid ${aspectRatio === 2 ? '#3B82F6' : '#D1D5DB'}`,
                backgroundColor: aspectRatio === 2 ? '#EBF8FF' : 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              2:1
            </button>

            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={aspectRatio || 1.5}
              onChange={(e) => handleAspectRatioChange(parseFloat(e.target.value))}
              style={{
                flex: 1,
                marginLeft: '8px'
              }}
            />

            <span style={{
              fontSize: '12px',
              color: '#6B7280',
              minWidth: '40px'
            }}>
              {(aspectRatio || 1.5).toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {hasError && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#EF4444'
        }}>
          {errors[0].message}
        </div>
      )}
    </div>
  );
};

export default ShapeTypeSelector;
```

**Validation Criteria**:
- [ ] All shape types selectable
- [ ] Rectangle aspect ratio controls work
- [ ] Visual feedback for selections
- [ ] Error states properly displayed
- [ ] Responsive layout on mobile

### Task 2.5: Modal Testing (1.5 hours)
**File**: `app/src/test/AddAreaModal.test.tsx`
**Priority**: Medium
**Dependencies**: Tasks 2.1-2.4

```typescript
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddAreaModal from '../components/AddArea/AddAreaModal';

describe('AddAreaModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn()
  };

  test('renders when open', () => {
    render(<AddAreaModal {...defaultProps} />);
    expect(screen.getByText('Add Area Shape')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<AddAreaModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Add Area Shape')).not.toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    render(<AddAreaModal {...defaultProps} />);

    const createButton = screen.getByText('Create Shape');
    expect(createButton).toBeDisabled();

    // Fill valid form
    fireEvent.change(screen.getByPlaceholderText('Enter area value'), {
      target: { value: '1000' }
    });

    await waitFor(() => {
      expect(createButton).not.toBeDisabled();
    });
  });

  test('calls onSubmit with correct data', async () => {
    const onSubmit = vi.fn();
    render(<AddAreaModal {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Enter area value'), {
      target: { value: '3000' }
    });

    fireEvent.change(screen.getByDisplayValue('Square Meters (m²)'), {
      target: { value: 'sqft' }
    });

    fireEvent.click(screen.getByText('Rectangle'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Create Shape'));
    });

    expect(onSubmit).toHaveBeenCalledWith({
      area: 3000,
      unit: 'sqft',
      shapeType: 'rectangle',
      aspectRatio: 1.5
    });
  });

  test('handles keyboard shortcuts', () => {
    const onClose = vi.fn();
    render(<AddAreaModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  test('shows preview dimensions', async () => {
    render(<AddAreaModal {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Enter area value'), {
      target: { value: '100' }
    });

    await waitFor(() => {
      expect(screen.getByText(/Preview:/)).toBeInTheDocument();
      expect(screen.getByText(/Width.*Height/)).toBeInTheDocument();
    });
  });
});
```

**Validation Criteria**:
- [ ] All modal interactions tested
- [ ] Form validation tested
- [ ] Keyboard shortcuts tested
- [ ] Preview functionality tested
- [ ] 80%+ test coverage

---

## Phase 3: Integration (4 hours)

### Task 3.1: Store Integration (2 hours)
**File**: `app/src/store/useAppStore.ts`
**Priority**: High
**Dependencies**: Phase 1 & 2 complete

```typescript
// Add to AppState interface
interface AppState {
  // ... existing state
  ui: {
    // ... existing UI state
    addAreaModalOpen: boolean;
  };
  // ... existing actions
  openAddAreaModal: () => void;
  closeAddAreaModal: () => void;
  createAreaShape: (config: AddAreaConfig) => void;
}

// Add to store implementation
export const useAppStore = create<AppState>()((set, get) => ({
  // ... existing state
  ui: {
    addAreaModalOpen: false
  },

  // ... existing actions
  openAddAreaModal: () => {
    set(state => ({
      ui: { ...state.ui, addAreaModalOpen: true }
    }));
  },

  closeAddAreaModal: () => {
    set(state => ({
      ui: { ...state.ui, addAreaModalOpen: false }
    }));
  },

  createAreaShape: (config: AddAreaConfig) => {
    const { area, unit, shapeType, aspectRatio } = config;

    // Create new layer for the area shape
    const layerName = `Area: ${area} ${unit}`;
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: layerName,
      visible: true,
      locked: false,
      color: '#22C55E', // Green for area shapes
      opacity: 1,
      created: new Date(),
      modified: new Date()
    };

    // Generate shape points
    const shapePosition = { x: 0, y: 0 }; // TODO: Use last interaction or scene center
    const points = generateShapeFromArea(area, unit, shapeType, {
      aspectRatio,
      position: shapePosition
    });

    // Create new shape
    const newShape: Shape = {
      id: `shape-${Date.now()}`,
      name: `${shapeType} - ${area} ${unit}`,
      points,
      type: shapeType === 'circle' ? 'circle' : 'rectangle',
      color: newLayer.color,
      visible: true,
      layerId: newLayer.id,
      created: new Date(),
      modified: new Date()
    };

    // Update store
    set(state => ({
      layers: [...state.layers, newLayer],
      shapes: [...state.shapes, newShape],
      activeLayerId: newLayer.id,
      selectedShapeId: newShape.id,
      ui: { ...state.ui, addAreaModalOpen: false }
    }));

    // Save to history
    get().saveToHistory();
  }
}));
```

**Validation Criteria**:
- [ ] Modal state managed correctly
- [ ] Shape creation integrates with existing systems
- [ ] Layer creation works properly
- [ ] History saved correctly
- [ ] No type errors or warnings

### Task 3.2: Toolbar Integration (1.5 hours)
**File**: `app/src/App.tsx` (or relevant toolbar component)
**Priority**: High
**Dependencies**: Task 3.1

```typescript
// Add "Add Area" button to toolbar
import { useAppStore } from '@/store/useAppStore';

// In toolbar/ribbon component:
const openAddAreaModal = useAppStore(state => state.openAddAreaModal);

// Add button in Area Configuration section:
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
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  }}
  title="Create shape from specified area"
>
  <span>+</span>
  Add Area
</button>
```

**Validation Criteria**:
- [ ] Button appears in correct toolbar section
- [ ] Button styling matches design system
- [ ] Hover effects work properly
- [ ] Clicking opens modal
- [ ] Tooltip provides helpful information

### Task 3.3: App Component Integration (30 minutes)
**File**: `app/src/App.tsx`
**Priority**: High
**Dependencies**: Task 3.2

```typescript
import AddAreaModal from '@/components/AddArea/AddAreaModal';
import { useAppStore } from '@/store/useAppStore';

// In App component:
const addAreaModalOpen = useAppStore(state => state.ui.addAreaModalOpen);
const closeAddAreaModal = useAppStore(state => state.closeAddAreaModal);
const createAreaShape = useAppStore(state => state.createAreaShape);

// Add modal to render tree:
return (
  <div>
    {/* ... existing app content */}

    <AddAreaModal
      isOpen={addAreaModalOpen}
      onClose={closeAddAreaModal}
      onSubmit={createAreaShape}
    />
  </div>
);
```

**Validation Criteria**:
- [ ] Modal renders in app component
- [ ] State connections work properly
- [ ] No rendering conflicts with existing components
- [ ] Modal z-index is appropriate

---

## Phase 4: Testing & Polish (4 hours)

### Task 4.1: Integration Testing (2 hours)
**File**: `app/src/test/addAreaFeature.integration.test.tsx`
**Priority**: High
**Dependencies**: Phase 3 complete

```typescript
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { useAppStore } from '../store/useAppStore';

describe('Add Area Feature Integration', () => {
  test('complete workflow: button click to shape creation', async () => {
    render(<App />);

    // Click Add Area button
    const addAreaButton = screen.getByText('Add Area');
    fireEvent.click(addAreaButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Add Area Shape')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Enter area value'), {
      target: { value: '5000' }
    });

    fireEvent.change(screen.getByDisplayValue('Square Meters (m²)'), {
      target: { value: 'sqft' }
    });

    fireEvent.click(screen.getByText('Square'));

    // Submit form
    fireEvent.click(screen.getByText('Create Shape'));

    // Check results
    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.shapes).toHaveLength(1);
      expect(state.shapes[0].name).toContain('5000 sqft');
      expect(state.layers).toHaveLength(1);
      expect(state.layers[0].name).toBe('Area: 5000 sqft');
      expect(state.ui.addAreaModalOpen).toBe(false);
    });
  });

  test('handles different shape types correctly', async () => {
    render(<App />);

    // Test circle creation
    fireEvent.click(screen.getByText('Add Area'));

    await waitFor(() => {
      fireEvent.change(screen.getByPlaceholderText('Enter area value'), {
        target: { value: '1000' }
      });
      fireEvent.click(screen.getByText('Circle'));
      fireEvent.click(screen.getByText('Create Shape'));
    });

    await waitFor(() => {
      const state = useAppStore.getState();
      const circleShape = state.shapes.find(s => s.type === 'circle');
      expect(circleShape).toBeDefined();

      // Check if circle has appropriate number of points for smooth rendering
      expect(circleShape?.points.length).toBeGreaterThan(16);
    });
  });

  test('validates area calculations accuracy', async () => {
    render(<App />);

    fireEvent.click(screen.getByText('Add Area'));

    await waitFor(() => {
      fireEvent.change(screen.getByPlaceholderText('Enter area value'), {
        target: { value: '100' }
      });
      fireEvent.click(screen.getByText('Square'));
      fireEvent.click(screen.getByText('Create Shape'));
    });

    await waitFor(() => {
      const state = useAppStore.getState();
      const square = state.shapes[0];

      // Calculate area from points (should be close to 100 m²)
      const calculatedArea = calculateShapeArea(square.points);
      expect(calculatedArea).toBeCloseTo(100, 1); // Within 1 m²
    });
  });
});
```

**Validation Criteria**:
- [ ] End-to-end workflow tested
- [ ] Different shape types tested
- [ ] Area calculation accuracy verified
- [ ] Error scenarios covered
- [ ] Performance within acceptable limits

### Task 4.2: Performance Testing (1 hour)
**File**: `app/src/test/addAreaPerformance.test.ts`
**Priority**: Medium
**Dependencies**: Task 4.1

```typescript
import { describe, test, expect } from 'vitest';
import { generateShapeFromArea } from '../utils/areaShapeGenerator';
import { validateAddAreaConfig } from '../utils/addAreaValidation';

describe('Add Area Performance', () => {
  test('shape generation performance', () => {
    const start = performance.now();

    // Generate 100 shapes
    for (let i = 0; i < 100; i++) {
      generateShapeFromArea(1000, 'sqm', 'square');
      generateShapeFromArea(1000, 'sqm', 'rectangle', { aspectRatio: 1.5 });
      generateShapeFromArea(1000, 'sqm', 'circle');
    }

    const end = performance.now();
    const duration = end - start;

    // Should complete 300 shape generations in under 100ms
    expect(duration).toBeLessThan(100);
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

    const end = performance.now();
    const duration = end - start;

    // Should complete 1000 validations in under 50ms
    expect(duration).toBeLessThan(50);
  });

  test('large area handling', () => {
    // Test very large areas don't cause performance issues
    const largeArea = 100000; // 100,000 m²

    const start = performance.now();
    const points = generateShapeFromArea(largeArea, 'sqm', 'circle');
    const end = performance.now();

    expect(end - start).toBeLessThan(10);
    expect(points.length).toBeLessThanOrEqual(64); // Reasonable polygon complexity
  });
});
```

**Validation Criteria**:
- [ ] Shape generation under 1ms per shape
- [ ] Validation under 0.05ms per validation
- [ ] Large areas handled efficiently
- [ ] Memory usage reasonable
- [ ] No performance regressions

### Task 4.3: Final Polish & Documentation (1 hour)
**Priority**: Medium
**Dependencies**: All previous tasks

```typescript
// Add JSDoc documentation to all public functions
/**
 * Generates shape points from a specified area and configuration
 * @param area - The target area value
 * @param unit - The unit of measurement
 * @param shapeType - The type of shape to generate
 * @param options - Additional options for shape generation
 * @returns Array of points defining the shape
 * @throws Error if shape type is unsupported or area is invalid
 */
export const generateShapeFromArea = (
  area: number,
  unit: AreaUnit,
  shapeType: 'square' | 'rectangle' | 'circle',
  options: { aspectRatio?: number; position?: Point2D } = {}
): Point2D[] => {
  // Implementation...
};
```

**Additional Polish Tasks:**
- [ ] Add error boundary around modal
- [ ] Implement loading states and animations
- [ ] Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Optimize bundle size (lazy loading, tree shaking)
- [ ] Add analytics tracking for feature usage

**Validation Criteria**:
- [ ] All functions documented with JSDoc
- [ ] Error boundaries protect against crashes
- [ ] Accessibility audit passes
- [ ] Bundle size impact minimal
- [ ] Feature ready for production use

---

## Risk Mitigation

### High Priority Risks
1. **Area Calculation Accuracy**: Implement comprehensive unit tests with known values
2. **Performance Impact**: Profile shape generation and optimize polygon complexity
3. **UI Integration**: Test thoroughly with existing toolbar and modal systems

### Medium Priority Risks
1. **Mobile Responsiveness**: Test modal on various screen sizes
2. **Browser Compatibility**: Test across Chrome, Firefox, Safari, Edge
3. **State Management**: Ensure no conflicts with existing Zustand store

### Low Priority Risks
1. **Accessibility**: Follow WCAG guidelines for all interactive elements
2. **Error Handling**: Graceful degradation for edge cases
3. **User Experience**: Collect feedback and iterate on design

---

## Success Metrics

### Technical Metrics
- [ ] Feature implementation completed within 22 hour estimate
- [ ] Test coverage above 70%
- [ ] No performance regression in 3D scene
- [ ] Bundle size increase under 50KB

### User Experience Metrics
- [ ] Modal opens within 100ms
- [ ] Shape generation completes within 200ms
- [ ] Form validation provides immediate feedback
- [ ] Error messages are clear and actionable

### Quality Metrics
- [ ] Zero critical bugs in testing
- [ ] Accessibility audit score 95%+
- [ ] Code review approval
- [ ] Documentation complete and accurate

---

**Ready for Implementation**: All tasks defined with clear validation criteria and time estimates. Begin with Phase 1 foundation work.