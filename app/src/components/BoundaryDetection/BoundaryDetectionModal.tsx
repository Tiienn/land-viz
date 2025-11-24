/**
 * Boundary Detection Modal
 *
 * Multi-step wizard for automatic boundary detection from site plan images.
 *
 * Steps:
 * 1. Upload image
 * 2. Preview and detect boundaries
 * 3. Refine detected boundaries (manual adjustment)
 * 4. Scale calibration (convert pixels to meters)
 * 5. Confirm and import to scene
 *
 * Performance: <3 seconds detection time for typical images
 */

import { useState, useEffect, useCallback } from 'react';
import { tokens } from '../../styles/tokens';
import ImageUploadStep from './ImageUploadStep';
import DetectionPreviewStep from './DetectionPreviewStep';
import ScaleCalibrationStep from './ScaleCalibrationStep';
import { getBoundaryDetectionService } from '../../services/boundaryDetection/BoundaryDetectionService';
import type {
  BoundaryDetectionResult,
  DetectedBoundary,
  ScaleCalibration,
  TerrainType,
  FenceStyle,
} from '../../services/boundaryDetection/types';

interface BoundaryDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (boundaries: DetectedBoundary[], scale: ScaleCalibration) => void;
  onGenerate3DWorld?: (
    boundaries: DetectedBoundary[],
    scale: ScaleCalibration,
    config: { terrainType: TerrainType; fenceStyle: FenceStyle; fenceHeight: number }
  ) => void;
}

type Step = 'upload' | 'detect' | 'refine' | 'scale' | 'confirm';

export default function BoundaryDetectionModal({
  isOpen,
  onClose,
  onImport,
  onGenerate3DWorld,
}: BoundaryDetectionModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [detectionResult, setDetectionResult] = useState<BoundaryDetectionResult | null>(null);
  const [selectedBoundaryIds, setSelectedBoundaryIds] = useState<string[]>([]);
  const [scale, setScale] = useState<ScaleCalibration | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceReady, setServiceReady] = useState(false);

  // Initialize boundary detection service
  useEffect(() => {
    if (!isOpen) return;

    const initService = async () => {
      try {
        const service = getBoundaryDetectionService();
        await service.init();
        setServiceReady(true);
      } catch (err) {
        setError(
          'Failed to initialize boundary detection. Please refresh and try again.'
        );
      }
    };

    initService();
  }, [isOpen]);

  const handleImageLoaded = useCallback((image: HTMLImageElement, file: File) => {
    setUploadedImage(image);
    setUploadedFile(file);
    setError(null);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleDetect = useCallback(async () => {
    if (!uploadedImage || !serviceReady) return;

    setIsDetecting(true);
    setError(null);

    try {
      const service = getBoundaryDetectionService();
      const result = await service.detectBoundaries(uploadedImage);

      if (result.boundaries.length === 0) {
        setError(
          'No boundaries detected. Try adjusting the image contrast or upload a different image.'
        );
        setIsDetecting(false);
        return;
      }

      setDetectionResult(result);
      setSelectedBoundaryIds(result.boundaries.map(b => b.id));
      setCurrentStep('detect');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Detection failed. Please try again.'
      );
    } finally {
      setIsDetecting(false);
    }
  }, [uploadedImage, serviceReady]);

  const handleClose = useCallback(() => {
    // Reset state
    setCurrentStep('upload');
    setUploadedImage(null);
    setUploadedFile(null);
    setDetectionResult(null);
    setIsDetecting(false);
    setError(null);
    onClose();
  }, [onClose]);

  // Phase 1: Handle 3D World generation
  const handleGenerate3DWorld = useCallback((config: { terrainType: TerrainType; fenceStyle: FenceStyle; fenceHeight: number }) => {
    if (!scale || selectedBoundaryIds.length === 0 || !detectionResult) {
      setError('Please calibrate scale and select at least one boundary');
      return;
    }

    const selectedBoundaries = detectionResult.boundaries.filter(b =>
      selectedBoundaryIds.includes(b.id)
    );

    if (onGenerate3DWorld) {
      onGenerate3DWorld(selectedBoundaries, scale, config);
    }

    handleClose();
  }, [scale, selectedBoundaryIds, detectionResult, onGenerate3DWorld, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: tokens.colors.background.primary,
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${tokens.colors.brand.teal}, ${tokens.colors.brand.purple})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
                marginBottom: '4px',
              }}
            >
              Boundary Detection
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: tokens.colors.neutral[600],
                margin: 0,
              }}
            >
              Automatically detect property boundaries from site plan images
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: tokens.colors.background.tertiary,
              color: tokens.colors.neutral[600],
              fontSize: '20px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                tokens.colors.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                tokens.colors.background.tertiary;
            }}
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            padding: '16px',
            backgroundColor: tokens.colors.background.secondary,
            borderRadius: '12px',
          }}
        >
          {[
            { key: 'upload', label: '1. Upload', icon: '📁' },
            { key: 'detect', label: '2. Detect', icon: '🔍' },
            { key: 'refine', label: '3. Refine', icon: '✏️' },
            { key: 'scale', label: '4. Scale', icon: '📏' },
            { key: 'confirm', label: '5. Import', icon: '✓' },
          ].map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = ['upload', 'detect', 'refine', 'scale', 'confirm'].indexOf(currentStep) > index;

            return (
              <div
                key={step.key}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: isActive
                    ? tokens.colors.brand.teal
                    : isCompleted
                    ? 'rgba(0, 196, 204, 0.1)'
                    : 'transparent',
                  color: isActive
                    ? '#fff'
                    : isCompleted
                    ? tokens.colors.brand.teal
                    : tokens.colors.neutral[500],
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'center',
                  transition: 'all 200ms ease',
                }}
              >
                <div style={{ marginBottom: '4px' }}>{step.icon}</div>
                <div>{step.label}</div>
              </div>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '8px',
              color: tokens.colors.semantic.error,
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Service Loading */}
        {!serviceReady && (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px',
                animation: 'spin 1s linear infinite',
              }}
            >
              ⏳
            </div>
            <p
              style={{
                fontSize: '16px',
                color: tokens.colors.neutral[600],
                margin: 0,
              }}
            >
              Loading boundary detection engine...
            </p>
          </div>
        )}

        {/* Step Content */}
        {serviceReady && (
          <>
            {currentStep === 'upload' && (
              <ImageUploadStep
                onImageLoaded={handleImageLoaded}
                onError={handleError}
              />
            )}

            {currentStep === 'detect' && detectionResult && (
              <DetectionPreviewStep
                result={detectionResult}
                onSelectedBoundariesChange={setSelectedBoundaryIds}
                onNext={() => setCurrentStep('scale')}
                onBack={() => setCurrentStep('upload')}
              />
            )}

            {currentStep === 'scale' && detectionResult && (
              <ScaleCalibrationStep
                result={detectionResult}
                onScaleCalculated={setScale}
                onNext={() => {
                  if (!scale || selectedBoundaryIds.length === 0) {
                    setError('Please calibrate scale and select at least one boundary');
                    return;
                  }
                  const selectedBoundaries = detectionResult.boundaries.filter(b =>
                    selectedBoundaryIds.includes(b.id)
                  );
                  onImport(selectedBoundaries, scale);
                }}
                onBack={() => setCurrentStep('detect')}
                onGenerate3DWorld={onGenerate3DWorld ? handleGenerate3DWorld : undefined}
              />
            )}
          </>
        )}

        {/* Footer Actions */}
        {serviceReady && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: `1px solid ${tokens.colors.neutral[200]}`,
            }}
          >
            <button
              onClick={handleClose}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: tokens.colors.neutral[600],
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.neutral[200]}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  tokens.colors.background.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>

            {currentStep === 'upload' && uploadedImage && (
              <button
                onClick={handleDetect}
                disabled={isDetecting}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: isDetecting
                    ? tokens.colors.background.tertiary
                    : tokens.colors.brand.teal,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isDetecting ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms ease',
                  opacity: isDetecting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDetecting) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 196, 204, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isDetecting ? 'Detecting...' : 'Detect Boundaries →'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
