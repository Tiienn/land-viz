import React, { useState, useEffect, useCallback } from 'react';
import type { AreaUnit, AreaValidation } from '../../types';
import { validateAreaInput, getUnitLabel, analyzeGridSnapImpact, type GridSnapImpact } from '../../utils/areaCalculations';
import { useAppStore } from '../../store/useAppStore';

interface InsertAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (area: number, unit: AreaUnit) => void;
}

const UNITS: AreaUnit[] = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm', 'toise', 'perches', 'perches-mauritius', 'arpent-na', 'arpent-paris', 'arpent-mauritius'];

const InsertAreaModal: React.FC<InsertAreaModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [areaValue, setAreaValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<AreaUnit>('sqm');
  const [validation, setValidation] = useState<AreaValidation>({ isValid: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gridSnapImpact, setGridSnapImpact] = useState<GridSnapImpact | null>(null);

  // Get grid settings from store
  const { drawing } = useAppStore();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAreaValue('');
      setSelectedUnit('sqm');
      setValidation({ isValid: true });
      setIsSubmitting(false);
      setGridSnapImpact(null);
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

  // Analyze grid snapping impact in real-time
  useEffect(() => {
    if (areaValue.trim() && validation.isValid && validation.numValue) {
      const impact = analyzeGridSnapImpact(
        validation.numValue,
        selectedUnit,
        drawing.gridSize,
        drawing.snapToGrid
      );
      setGridSnapImpact(impact);
    } else {
      setGridSnapImpact(null);
    }
  }, [areaValue, selectedUnit, validation, drawing.gridSize, drawing.snapToGrid]);

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
        zIndex: 999999
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
            margin: '0 0 20px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1F2937',
            fontFamily: 'Nunito Sans, sans-serif'
          }}
        >
          Insert Area
        </h2>

        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#6B7280',
            fontFamily: 'Nunito Sans, sans-serif'
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
                  fontFamily: 'Nunito Sans, sans-serif'
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
                  fontFamily: 'Nunito Sans, sans-serif',
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
                    fontFamily: 'Nunito Sans, sans-serif'
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
                  fontFamily: 'Nunito Sans, sans-serif'
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
                  fontFamily: 'Nunito Sans, sans-serif',
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

        {/* Grid Snapping Warning */}
        {gridSnapImpact?.hasSignificantImpact && (
          <div
            style={{
              backgroundColor: gridSnapImpact.recommendDisableSnapping ? '#FEF2F2' : '#FEF3C7',
              border: `1px solid ${gridSnapImpact.recommendDisableSnapping ? '#FECACA' : '#FCD34D'}`,
              borderRadius: '8px',
              padding: '12px',
              margin: '16px 0',
              fontSize: '13px',
              fontFamily: 'Nunito Sans, sans-serif'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{
                fontSize: '16px',
                color: gridSnapImpact.recommendDisableSnapping ? '#EF4444' : '#F59E0B'
              }}>
                {gridSnapImpact.recommendDisableSnapping ? '⚠️' : 'ℹ️'}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontWeight: '500',
                  color: gridSnapImpact.recommendDisableSnapping ? '#991B1B' : '#92400E'
                }}>
                  Grid Snapping Impact
                </p>
                <p style={{
                  margin: '0 0 8px 0',
                  color: gridSnapImpact.recommendDisableSnapping ? '#7F1D1D' : '#78350F',
                  lineHeight: '1.4'
                }}>
                  Grid snapping will {gridSnapImpact.areaLoss > 0 ? 'reduce' : 'increase'} your area by{' '}
                  <strong>{Math.abs(gridSnapImpact.areaLoss).toFixed(0)} m²</strong>{' '}
                  ({gridSnapImpact.percentageChange.toFixed(1)}%).
                  Final area: <strong>{gridSnapImpact.snappedArea.toFixed(0)} m²</strong>
                </p>
                {gridSnapImpact.recommendDisableSnapping && (
                  <p style={{
                    margin: '0',
                    fontSize: '12px',
                    color: '#7F1D1D',
                    fontStyle: 'italic'
                  }}>
                    Consider disabling grid snapping in Properties panel for precise area.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Nunito Sans, sans-serif',
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
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              background: canSubmit
                ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                : '#9CA3AF',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Nunito Sans, sans-serif',
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