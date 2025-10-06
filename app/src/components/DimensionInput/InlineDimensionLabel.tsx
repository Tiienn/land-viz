/**
 * Inline Dimension Label Component
 * Spec 013: Direct Dimension Input
 *
 * Clickable dimension labels that can be edited inline
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useDimensionStore } from '@/store/useDimensionStore';
import { formatDimension } from '@/services/dimensionFormatter';
import { validateDimension } from '@/services/dimensionValidator';

interface InlineDimensionLabelProps {
  shapeId: string;
  dimension: 'width' | 'height' | 'radius';
  value: number;
  position: { x: number; y: number; z: number };
  camera: THREE.Camera;
  onEdit: (shapeId: string, dimension: string, newValue: number) => void;
}

const InlineDimensionLabel: React.FC<InlineDimensionLabelProps> = ({
  shapeId,
  dimension,
  value,
  position,
  camera,
  onEdit
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { precision } = useDimensionStore(state => state.precision);
  const {
    isEditingDimension,
    editingShapeId,
    editingDimensionType,
    editingValue,
    editingError
  } = useDimensionStore(state => state.inlineEdit);

  const {
    startEditingDimension,
    updateEditingValue,
    setEditingError,
    confirmDimensionEdit,
    cancelDimensionEdit
  } = useDimensionStore();

  const isEditing =
    isEditingDimension &&
    editingShapeId === shapeId &&
    editingDimensionType === dimension;

  // Convert 3D position to screen coordinates
  const screenPos = useMemo(() => {
    const vector = new THREE.Vector3(position.x, position.y, position.z);
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

    // Clamp to viewport bounds
    const clampedX = Math.max(10, Math.min(window.innerWidth - 100, x));
    const clampedY = Math.max(10, Math.min(window.innerHeight - 30, y));

    return { x: clampedX, y: clampedY };
  }, [position, camera]);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback(() => {
    if (!isEditing) {
      startEditingDimension(shapeId, dimension);
      updateEditingValue(value.toString());
    }
  }, [isEditing, shapeId, dimension, value, startEditingDimension, updateEditingValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      updateEditingValue(newValue);

      // Validate
      const numValue = parseFloat(newValue);
      const validation = validateDimension(numValue);

      if (!validation.valid) {
        setEditingError(validation.error || 'Invalid value');
      } else {
        setEditingError(null);
      }
    },
    [updateEditingValue, setEditingError]
  );

  const handleConfirm = useCallback(() => {
    const numValue = parseFloat(editingValue);
    const validation = validateDimension(numValue);

    if (validation.valid) {
      onEdit(shapeId, dimension, numValue);
      confirmDimensionEdit();
    } else {
      setEditingError(validation.error || 'Invalid value');
    }
  }, [editingValue, shapeId, dimension, onEdit, confirmDimensionEdit, setEditingError]);

  const handleCancel = useCallback(() => {
    cancelDimensionEdit();
  }, [cancelDimensionEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleConfirm, handleCancel]
  );

  // Canva-inspired styling
  const labelContainerStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${screenPos.x}px`,
    top: `${screenPos.y}px`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'auto',
    zIndex: 1000,
    fontFamily: 'Nunito Sans, sans-serif'
  };

  const labelStyle: React.CSSProperties = {
    padding: '4px 8px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 200ms',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    whiteSpace: 'nowrap',
    userSelect: 'none'
  };

  const labelHoverStyle: React.CSSProperties = {
    ...labelStyle,
    backgroundColor: '#F3F4F6',
    borderColor: '#3B82F6',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const inputStyle: React.CSSProperties = {
    width: '80px',
    padding: '4px 8px',
    border: '2px solid #3B82F6',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'center',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    fontFamily: 'Nunito Sans, sans-serif',
    backgroundColor: '#FFFFFF'
  };

  const errorTextStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '4px',
    padding: '2px 6px',
    backgroundColor: '#FEE2E2',
    border: '1px solid #EF4444',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#DC2626',
    whiteSpace: 'nowrap',
    zIndex: 1001
  };

  return (
    <div style={labelContainerStyle}>
      {isEditing ? (
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={editingValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleConfirm}
            style={inputStyle}
          />
          {editingError && <div style={errorTextStyle}>{editingError}</div>}
        </div>
      ) : (
        <div
          onClick={handleClick}
          style={labelStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F3F4F6';
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          title={`Click to edit ${dimension}`}
        >
          {formatDimension(value, precision.displayPrecision, precision.preferredUnit)}
        </div>
      )}
    </div>
  );
};

export default InlineDimensionLabel;
