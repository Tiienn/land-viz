import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { validateAddAreaConfig } from '@/utils/validation';
import { calculateShapePreview } from '@/utils/areaCalculations';
import type { AddAreaConfig, AreaUnit } from '@/types';
import { logger } from '@/utils/logger';
import AreaInput from './AreaInput';
import UnitSelector from './UnitSelector';
import ShapeTypeSelector from './ShapeTypeSelector';

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
      logger.error('[AddAreaModal]', 'Failed to create area shape:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config, validation.isValid, createAreaShape, onClose]);

  // Set data attribute for ShapeDimensions to hide when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-modal-open', 'true');
    } else {
      document.body.removeAttribute('data-modal-open');
    }

    return () => {
      document.body.removeAttribute('data-modal-open');
    };
  }, [isOpen]);

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
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
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
        animation: 'slideIn 0.2s ease-out',
        position: 'relative'
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
                  ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddAreaModal;