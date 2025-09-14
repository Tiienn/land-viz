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