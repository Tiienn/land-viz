/**
 * Manual Entry Form Component
 *
 * Main UI for manual dimension entry in hybrid import workflow.
 * Allows users to enter dimensions for each detected edge when OCR fails.
 *
 * FEATURES:
 * - One input field per detected edge
 * - Unit selection (m, ft, yd)
 * - Optional area input for validation
 * - Real-time validation
 * - Interactive edge preview
 * - Template loading support
 *
 * @example
 * ```tsx
 * <ManualEntryForm
 *   edgeCount={4}
 *   roughOutline={vertices}
 *   onSubmit={(dimensions, area) => handleSubmit(dimensions, area)}
 *   onCancel={() => handleCancel()}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { EdgePreview } from './EdgePreview';
import { EdgeReorderControl, type EdgeMapping } from './EdgeReorderControl';
import { useImportStore } from '../../store/useImportStore';
import { geometryReconstructor } from '../../services/imageImport/geometryReconstructor';
import type { Point2D, DimensionInput } from '../../types/imageImport';

interface ManualEntryFormProps {
  /** Number of edges detected */
  edgeCount: number;
  /** Rough outline vertices for preview */
  roughOutline: Point2D[];
  /** Callback when form is submitted */
  onSubmit: (dimensions: DimensionInput[], area: number | null) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

/**
 * Validation error for a dimension input
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a single dimension value
 */
function validateDimension(value: number): string | null {
  if (isNaN(value)) return 'Please enter a number';
  if (value <= 0) return 'Must be greater than 0';
  if (value < 0.1) return 'Too small (minimum: 0.1m)';
  if (value > 9999) return 'Too large (maximum: 9999m)';
  return null;
}

/**
 * Validate area value
 */
function validateArea(value: number): string | null {
  if (isNaN(value)) return 'Please enter a number';
  if (value <= 0) return 'Must be greater than 0';
  if (value < 0.01) return 'Too small (minimum: 0.01m²)';
  if (value > 999999) return 'Too large (maximum: 999999m²)';
  return null;
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
  edgeCount,
  roughOutline,
  onSubmit,
  onCancel,
}) => {
  // Get store state and actions
  const dimensions = useImportStore((state) => state.dimensions);
  const area = useImportStore((state) => state.area);
  const areaUnit = useImportStore((state) => state.areaUnit);
  const setDimension = useImportStore((state) => state.setDimension);
  const setArea = useImportStore((state) => state.setArea);
  const setAreaUnit = useImportStore((state) => state.setAreaUnit);

  // Local state
  const [selectedEdgeIndex, setSelectedEdgeIndex] = useState(0);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [areaError, setAreaError] = useState<string | null>(null);
  const [geometryError, setGeometryError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<number, boolean>>({});
  const [showReorderControl, setShowReorderControl] = useState(false);
  const [edgeMapping, setEdgeMapping] = useState<EdgeMapping>(() => {
    // Initialize with default sequential mapping
    const mapping: EdgeMapping = {};
    for (let i = 0; i < edgeCount; i++) {
      mapping[i] = i;
    }
    return mapping;
  });

  // Initialize dimensions if empty
  useEffect(() => {
    if (dimensions.length === 0) {
      const initialDimensions: DimensionInput[] = Array.from(
        { length: edgeCount },
        (_, i) => ({
          edgeIndex: i,
          value: 0,
          unit: 'm',
        })
      );
      useImportStore.setState({ dimensions: initialDimensions });
    }
  }, [edgeCount, dimensions.length]);

  /**
   * Handle dimension value change
   */
  const handleDimensionChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;

    setDimension(index, {
      edgeIndex: index,
      value: numValue,
      unit: dimensions[index]?.unit || 'm',
    });

    // Mark as touched when user starts typing
    if (value !== '' && value !== '0') {
      setTouched({ ...touched, [index]: true });
    }

    // Validate immediately to show real-time feedback
    const error = validateDimension(numValue);
    if (error) {
      setErrors({ ...errors, [index]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  /**
   * Handle dimension unit change
   */
  const handleUnitChange = (index: number, unit: 'm' | 'ft' | 'yd') => {
    const current = dimensions[index];
    if (current) {
      setDimension(index, {
        ...current,
        unit,
      });
    }
  };

  /**
   * Handle area input change
   */
  const handleAreaChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setArea(numValue > 0 ? numValue : null);

    // Validate
    if (numValue > 0) {
      const error = validateArea(numValue);
      setAreaError(error);
    } else {
      setAreaError(null);
    }
  };

  /**
   * Handle input blur (mark as touched)
   */
  const handleBlur = (index: number) => {
    setTouched({ ...touched, [index]: true });

    // Validate on blur
    const dimension = dimensions[index];
    if (dimension) {
      const error = validateDimension(dimension.value);
      if (error) {
        setErrors({ ...errors, [index]: error });
      }
    }
  };

  /**
   * Check if form is valid
   */
  const isValid = (): boolean => {
    // Must have correct number of dimensions initialized
    // (prevents button from being enabled before useEffect runs)
    if (dimensions.length !== edgeCount) return false;

    // All dimensions must have values > 0
    const allFilled = dimensions.every((dim) => dim && dim.value > 0);
    if (!allFilled) return false;

    // No validation errors
    if (Object.keys(errors).length > 0) return false;

    // Area validation (if provided)
    if (area && areaError) return false;

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = () => {
    // Mark all as touched for validation display
    const allTouched: Record<number, boolean> = {};
    dimensions.forEach((_, i) => {
      allTouched[i] = true;
    });
    setTouched(allTouched);

    // Validate all dimensions
    const newErrors: Record<number, string> = {};
    dimensions.forEach((dim, i) => {
      const error = validateDimension(dim.value);
      if (error) {
        newErrors[i] = error;
      }
    });
    setErrors(newErrors);

    // Validate area if provided
    if (area) {
      const error = validateArea(area);
      setAreaError(error);
      if (error) return;
    }

    // Check if valid
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Validate geometry (triangle inequality, polygon closure)
    try {
      const dimensionValues = dimensions.map((dim) => dim.value);
      geometryReconstructor.reconstruct(dimensionValues, area);

      // Clear any previous geometry errors
      setGeometryError(null);
    } catch (error) {
      // Geometry validation failed (impossible shape)
      const errorMessage = error instanceof Error ? error.message : 'Invalid geometry';
      setGeometryError(errorMessage);
      return;
    }

    // Submit
    onSubmit(dimensions, area);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter - Submit form if valid
      if (e.key === 'Enter' && !e.shiftKey && isValid()) {
        e.preventDefault();
        handleSubmit();
      }

      // ESC - Cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dimensions, errors, area, areaError, onCancel]);

  return (
    <div style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
      {/* Instructions */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#EFF6FF',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1E40AF',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>
              📐 Enter Dimensions
            </strong>
            <p style={{ margin: 0 }}>
              Enter the length of each edge. Click on the preview below to select an edge.
            </p>
          </div>
          <button
            onClick={() => setShowReorderControl(!showReorderControl)}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: showReorderControl ? '#3B82F6' : '#6B7280',
              backgroundColor: showReorderControl ? '#EFF6FF' : 'white',
              border: `2px solid ${showReorderControl ? '#3B82F6' : '#D1D5DB'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 200ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!showReorderControl) {
                e.currentTarget.style.borderColor = '#9CA3AF';
              }
            }}
            onMouseLeave={(e) => {
              if (!showReorderControl) {
                e.currentTarget.style.borderColor = '#D1D5DB';
              }
            }}
          >
            {showReorderControl ? '✓ Reorder Edges' : '↕ Reorder Edges'}
          </button>
        </div>
      </div>

      {/* Edge Reorder Control (optional) */}
      {showReorderControl && (
        <EdgeReorderControl
          edgeCount={edgeCount}
          currentMapping={edgeMapping}
          onMappingChange={(newMapping) => {
            setEdgeMapping(newMapping);
          }}
          selectedEdgeIndex={selectedEdgeIndex}
          onSelectEdge={setSelectedEdgeIndex}
        />
      )}

      {/* Edge Preview */}
      {roughOutline.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <EdgePreview
            vertices={roughOutline}
            selectedEdgeIndex={selectedEdgeIndex}
            width={500}
            height={300}
          />
        </div>
      )}

      {/* Dimension Inputs */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
          }}
        >
          Edge Dimensions:
        </label>

        {dimensions.map((dim, index) => (
          <div
            key={index}
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor:
                selectedEdgeIndex === index ? '#EFF6FF' : '#F9FAFB',
              borderRadius: '8px',
              border: `2px solid ${
                selectedEdgeIndex === index ? '#3B82F6' : '#E5E7EB'
              }`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => setSelectedEdgeIndex(index)}
          >
            {/* Edge label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1F2937',
                  }}
                >
                  Edge {edgeMapping[index] + 1}
                </span>
                {showReorderControl && edgeMapping[index] !== index && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#6B7280',
                      backgroundColor: '#F3F4F6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    (Position {index + 1})
                  </span>
                )}
              </div>
              {selectedEdgeIndex === index && (
                <span
                  style={{
                    fontSize: '12px',
                    color: '#3B82F6',
                    fontWeight: '600',
                  }}
                >
                  Selected
                </span>
              )}
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                value={dim.value || ''}
                onChange={(e) => handleDimensionChange(index, e.target.value)}
                onBlur={() => handleBlur(index)}
                placeholder="0.00"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: `2px solid ${
                    errors[index] && touched[index] ? '#EF4444' : '#D1D5DB'
                  }`,
                  borderRadius: '8px',
                  color: '#374151',
                  outline: 'none',
                }}
                step="0.01"
                min="0"
              />
              <select
                value={dim.unit}
                onChange={(e) =>
                  handleUnitChange(index, e.target.value as 'm' | 'ft' | 'yd')
                }
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '2px solid #D1D5DB',
                  borderRadius: '8px',
                  color: '#374151',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="m">meters (m)</option>
                <option value="ft">feet (ft)</option>
                <option value="yd">yards (yd)</option>
              </select>
            </div>

            {/* Error message */}
            {errors[index] && touched[index] && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>⚠️</span>
                <span>{errors[index]}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Optional Area Input */}
      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          border: '2px solid #E5E7EB',
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
          }}
        >
          Total Area (optional):
        </label>
        <p
          style={{
            margin: '0 0 12px 0',
            fontSize: '12px',
            color: '#6B7280',
          }}
        >
          Enter the known area to validate the calculated result
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            value={area || ''}
            onChange={(e) => handleAreaChange(e.target.value)}
            placeholder="0.00"
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '14px',
              border: `2px solid ${areaError ? '#EF4444' : '#D1D5DB'}`,
              borderRadius: '8px',
              color: '#374151',
              outline: 'none',
            }}
            step="0.01"
            min="0"
          />
          <select
            value={areaUnit}
            onChange={(e) =>
              setAreaUnit(e.target.value as 'm²' | 'ft²' | 'yd²')
            }
            style={{
              padding: '10px 12px',
              fontSize: '14px',
              border: '2px solid #D1D5DB',
              borderRadius: '8px',
              color: '#374151',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="m²">m²</option>
            <option value="ft²">ft²</option>
            <option value="yd²">yd²</option>
          </select>
        </div>

        {/* Area error */}
        {areaError && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>⚠️</span>
            <span>{areaError}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            backgroundColor: '#F3F4F6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E5E7EB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F3F4F6';
          }}
        >
          ← Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={!isValid()}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: isValid() ? '#3B82F6' : '#9CA3AF',
            border: 'none',
            borderRadius: '8px',
            cursor: isValid() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (isValid()) {
              e.currentTarget.style.backgroundColor = '#2563EB';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (isValid()) {
              e.currentTarget.style.backgroundColor = '#3B82F6';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          Calculate Shape →
        </button>
      </div>

      {/* Form status hint */}
      {!isValid() && !geometryError && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#FEF3C7',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#92400E',
            textAlign: 'center',
          }}
        >
          Please fill in all edge dimensions to continue
        </div>
      )}

      {/* Geometry error */}
      {geometryError && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#FEE2E2',
            borderRadius: '8px',
            border: '2px solid #EF4444',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>❌</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#991B1B',
                  marginBottom: '8px',
                }}
              >
                Invalid Geometry
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#7F1D1D',
                  lineHeight: '1.5',
                }}
              >
                {geometryError}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualEntryForm;
