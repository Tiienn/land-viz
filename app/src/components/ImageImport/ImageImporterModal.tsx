/**
 * Image Importer Modal
 *
 * Main UI component for site plan image import feature.
 *
 * VIEWS:
 * - Upload: File selection with drag-and-drop
 * - Processing: Progress indicator with step-by-step status
 * - Review: Preview and correction of imported shape (future)
 * - Error: Clear error messages with retry option
 *
 * FEATURES:
 * - Keyboard shortcuts (Escape to close, Enter to confirm)
 * - Focus management
 * - Progress tracking
 * - Error handling
 * - Automatic canvas integration
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <ImageImporterModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useImportStore } from '../../store/useImportStore';
import { importService, geometryReconstructor } from '../../services/imageImport';
import { UploadZone } from './UploadZone';
import { EdgePreview } from './EdgePreview';
import { ManualEntryForm } from './ManualEntryForm';
import { TemplateLibrary } from './TemplateLibrary';
import { GeometryPreview } from './GeometryPreview';
import type { ImportResult, DimensionInput, SavedTemplate, ReconstructedShape } from '../../types/imageImport';
import { logger } from '../../utils/logger';

interface ImageImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState =
  | 'upload'           // Initial file selection
  | 'processing'       // Running boundary detection + OCR
  | 'ocr_review'       // OCR succeeded, review detected dimensions
  | 'manual_entry'     // OCR failed/timeout, manual dimension input
  | 'preview'          // Preview reconstructed shape
  | 'manual_scale'     // Legacy manual scale (kept for backward compatibility)
  | 'error'            // Error state
  | 'success';         // Import complete

export const ImageImporterModal: React.FC<ImageImporterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [view, setView] = useState<ViewState>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualDimension, setManualDimension] = useState('');
  const [manualUnit, setManualUnit] = useState<'m' | 'ft' | 'yd'>('m');
  const [selectedEdgeIndex, setSelectedEdgeIndex] = useState(0);

  // Hybrid import state
  const [hybridResult, setHybridResult] = useState<{
    boundary: any;
    ocr: any;
    requiresManualEntry: boolean;
    imageUrl?: string;
  } | null>(null);

  // Template library state
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  // Preview state
  const [reconstructedShape, setReconstructedShape] = useState<ReconstructedShape | null>(null);

  const addShape = useAppStore((state) => state.addShape);
  const setBoundaryDetection = useImportStore((state) => state.setBoundaryDetection);
  const setOcrDetection = useImportStore((state) => state.setOcrDetection);
  const resetImportStore = useImportStore((state) => state.reset);

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('upload');
      setSelectedFile(null);
      setProgress(0);
      setStatusMessage('');
      setImportResult(null);
      setIsProcessing(false);
      setShowTemplateLibrary(false);
      setReconstructedShape(null);
      resetImportStore();
    }
  }, [isOpen, resetImportStore]);

  /**
   * Handle retry
   */
  const handleRetry = useCallback(() => {
    setView('upload');
    setSelectedFile(null);
    setImportResult(null);
  }, []);

  /**
   * Handle preview edit (go back to manual entry)
   */
  const handlePreviewEdit = useCallback(() => {
    logger.info('[ImageImporterModal] Editing dimensions from preview');
    setView('manual_entry');
  }, []);

  /**
   * Handle preview cancel
   */
  const handlePreviewCancel = useCallback(() => {
    logger.info('[ImageImporterModal] Cancelling preview');
    handleRetry();
  }, [handleRetry]);

  /**
   * Handle manual scale confirmation
   */
  const handleManualScaleConfirm = useCallback(() => {
    if (!importResult || !importResult.shape || !manualDimension) {
      logger.error('[ImageImporterModal] Cannot apply manual scale - missing data');
      return;
    }

    const dimensionValue = parseFloat(manualDimension);
    if (isNaN(dimensionValue) || dimensionValue <= 0) {
      logger.error('[ImageImporterModal] Invalid dimension value:', manualDimension);
      return;
    }

    logger.info('[ImageImporterModal] Applying manual scale:', dimensionValue, manualUnit);
    logger.info('[ImageImporterModal] Selected edge index:', selectedEdgeIndex);

    // Use original pixel coordinates from boundary detection
    const originalVertices = importResult.metadata?.originalBoundaryVertices;

    // Log all vertices and edges for debugging
    if (originalVertices) {
      logger.info('[ImageImporterModal] All original vertices:', originalVertices);
      originalVertices.forEach((v, i) => {
        const nextV = originalVertices[(i + 1) % originalVertices.length];
        const edgeLength = Math.sqrt(
          Math.pow(nextV.x - v.x, 2) + Math.pow(nextV.y - v.y, 2)
        );
        logger.info(`[ImageImporterModal] Edge ${i}: vertex ${i} (${v.x}, ${v.y}) → vertex ${(i+1) % originalVertices.length} (${nextV.x}, ${nextV.y}), length: ${edgeLength.toFixed(2)}px`);
      });
    }

    if (!originalVertices || originalVertices.length === 0) {
      logger.error('[ImageImporterModal] No original boundary vertices in metadata');
      return;
    }

    // Calculate edge lengths in ORIGINAL PIXELS (not the scaled points)
    const edgeLengths: number[] = [];

    for (let i = 0; i < originalVertices.length; i++) {
      const p1 = originalVertices[i];
      const p2 = originalVertices[(i + 1) % originalVertices.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      edgeLengths.push(length);
    }

    // Get selected edge length in pixels
    const selectedEdgePixels = edgeLengths[selectedEdgeIndex];

    logger.info('[ImageImporterModal] Selected edge', selectedEdgeIndex, 'length:', selectedEdgePixels.toFixed(2), 'px (from original boundary)');

    // Convert manual dimension to meters
    let dimensionInMeters = dimensionValue;
    if (manualUnit === 'ft') {
      dimensionInMeters = dimensionValue * 0.3048;
    } else if (manualUnit === 'yd') {
      dimensionInMeters = dimensionValue * 0.9144;
    }

    // Calculate pixels per meter
    const pixelsPerMeter = selectedEdgePixels / dimensionInMeters;

    logger.info('[ImageImporterModal] Pixels per meter:', pixelsPerMeter.toFixed(2));

    // Convert original pixel vertices to meters, centered at origin
    const metersPerPixel = 1 / pixelsPerMeter;

    // Calculate centroid of original vertices
    const centerX = originalVertices.reduce((sum, v) => sum + v.x, 0) / originalVertices.length;
    const centerY = originalVertices.reduce((sum, v) => sum + v.y, 0) / originalVertices.length;

    // Convert to meters and center at origin
    // DO NOT flip Y - keep image orientation as-is
    // The shape will maintain the same visual orientation as the uploaded image
    const rescaledPoints = originalVertices.map(v => ({
      x: (v.x - centerX) * metersPerPixel,
      y: (v.y - centerY) * metersPerPixel, // Keep Y without flip
      z: 0,
    }));

    logger.info('[ImageImporterModal] Rescaled points from original pixels:', rescaledPoints);

    // Log final edge lengths for verification
    rescaledPoints.forEach((p, i) => {
      const nextP = rescaledPoints[(i + 1) % rescaledPoints.length];
      const edgeLength = Math.sqrt(
        Math.pow(nextP.x - p.x, 2) + Math.pow(nextP.y - p.y, 2)
      );
      logger.info(`[ImageImporterModal] Final Edge ${i}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) → (${nextP.x.toFixed(2)}, ${nextP.y.toFixed(2)}), length: ${edgeLength.toFixed(2)}m`);
    });

    // Create shape with rescaled points
    const rescaledShape = {
      ...importResult.shape,
      points: rescaledPoints,
    };

    // Convert and add to canvas
    const shapeData = importService.convertToDrawingStoreShape(
      rescaledShape,
      {
        layerId: 'main',
        color: '#3B82F6',
      }
    );

    addShape(shapeData);

    logger.info('[ImageImporterModal] Shape added with manual scale');

    setView('success');

    // Auto-close after success
    setTimeout(() => {
      onClose();
    }, 2000);
  }, [importResult, manualDimension, manualUnit, selectedEdgeIndex, addShape, onClose]);

  /**
   * Handle preview confirmation (final import)
   */
  const handlePreviewConfirm = useCallback(() => {
    if (!reconstructedShape) {
      logger.error('[ImageImporterModal] No reconstructed shape to import');
      return;
    }

    try {
      logger.info('[ImageImporterModal] Confirming preview and adding to canvas');

      // Convert to drawing store shape
      const shapeData = importService.convertToDrawingStoreShape(
        {
          type: 'polygon',
          points: reconstructedShape.vertices,
        },
        {
          layerId: 'main',
          color: '#3B82F6',
          name: selectedFile ? `Imported: ${selectedFile.name}` : 'Manual Entry',
        }
      );

      // Add to canvas
      addShape(shapeData);

      // Show success
      setView('success');
      setImportResult({
        success: true,
        warnings: reconstructedShape.warnings.map((w) => w.message),
      });

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      logger.error('[ImageImporterModal] Failed to add shape to canvas:', error);
      setView('error');
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add shape to canvas',
        warnings: [],
      });
    }
  }, [reconstructedShape, selectedFile, addShape, onClose]);

  // Comprehensive keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC - Cancel/Close based on current view
      if (e.key === 'Escape') {
        e.preventDefault();

        if (isProcessing) {
          // Don't allow closing during processing
          return;
        }

        // Navigate back or close based on view
        if (view === 'preview') {
          handlePreviewEdit(); // Go back to manual entry
        } else if (view === 'manual_entry') {
          if (showTemplateLibrary) {
            setShowTemplateLibrary(false); // Close template library
          } else {
            handleRetry(); // Go back to upload
          }
        } else if (view === 'manual_scale') {
          handleRetry(); // Go back to upload
        } else {
          onClose(); // Close modal
        }
      }

      // Enter - Submit/Confirm based on current view
      if (e.key === 'Enter' && !e.shiftKey) {
        if (view === 'preview' && reconstructedShape) {
          e.preventDefault();
          handlePreviewConfirm(); // Confirm and add to canvas
        } else if (view === 'manual_scale' && manualDimension && parseFloat(manualDimension) > 0) {
          e.preventDefault();
          handleManualScaleConfirm(); // Apply manual scale
        }
        // Note: ManualEntryForm handles its own Enter submission
      }

      // Ctrl+S - Save as template (when in preview view)
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && view === 'preview' && reconstructedShape) {
        e.preventDefault();
        // TODO: Implement save template dialog
        logger.info('[ImageImporterModal] Ctrl+S pressed - save template feature pending');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    isProcessing,
    view,
    showTemplateLibrary,
    reconstructedShape,
    manualDimension,
    onClose,
    handlePreviewEdit,
    handlePreviewConfirm,
    handleRetry,
    handleManualScaleConfirm,
  ]);

  /**
   * Handle file selection using hybrid approach
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      setSelectedFile(file);

      // Validate file
      const validationError = importService.validateImageFile(file);
      if (validationError) {
        setView('error');
        setImportResult({
          success: false,
          error: validationError.message,
          warnings: [],
        });
        return;
      }

      // Start hybrid import process
      setView('processing');
      setIsProcessing(true);
      setProgress(0);
      setStatusMessage('Detecting boundary and dimensions...');

      try {
        logger.info('[ImageImporterModal] Starting hybrid import for file:', file.name);

        // Use hybrid import method (boundary detection + OCR with timeout)
        const result = await importService.importSitePlanHybrid(file, {
          preprocessing: 'medium',
        });

        setHybridResult(result);

        logger.info('[ImageImporterModal] Hybrid import result:', {
          boundaryStatus: result.boundary.status,
          edgeCount: result.boundary.edgeCount,
          ocrStatus: result.ocr.status,
          dimensionsFound: result.ocr.dimensions.length,
          requiresManualEntry: result.requiresManualEntry
        });

        // Populate import store with results
        if (result.boundary.status === 'success') {
          setBoundaryDetection(result.boundary);
        }
        if (result.ocr.status === 'success' || result.ocr.status === 'failed' || result.ocr.status === 'timeout') {
          setOcrDetection(result.ocr);
        }

        // Route based on result
        if (result.requiresManualEntry) {
          // OCR failed or timed out → Manual entry required
          logger.info('[ImageImporterModal] Routing to manual entry');
          setView('manual_entry');
        } else {
          // OCR succeeded → Show review (future feature)
          logger.info('[ImageImporterModal] OCR succeeded, routing to review');
          setView('ocr_review');
        }

      } catch (error) {
        logger.error('[ImageImporterModal] Hybrid import failed:', error);
        setView('error');
        setImportResult({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          warnings: [],
        });
      } finally {
        setIsProcessing(false);
        setProgress(100);
        setStatusMessage('Detection complete');
      }
    },
    [onClose]
  );

  /**
   * Handle manual entry form submission
   * Shows preview instead of immediately adding to canvas
   */
  const handleManualEntrySubmit = useCallback(
    (dimensions: DimensionInput[], area: number | null) => {
      try {
        logger.info('[ImageImporterModal] Manual entry submitted:', { dimensions, area });

        // Convert DimensionInput[] to number[] (extract values in meters)
        const dimensionValues = dimensions.map((dim) => {
          let valueInMeters = dim.value;

          // Convert to meters if needed
          if (dim.unit === 'ft') {
            valueInMeters = dim.value * 0.3048;
          } else if (dim.unit === 'yd') {
            valueInMeters = dim.value * 0.9144;
          }

          return valueInMeters;
        });

        // Reconstruct shape from dimensions
        const result = geometryReconstructor.reconstruct(dimensionValues, area);

        logger.info('[ImageImporterModal] Shape reconstructed:', {
          vertices: result.vertices.length,
          area: result.area,
          warnings: result.warnings.length,
        });

        // Store reconstructed shape and show preview
        setReconstructedShape(result);
        setView('preview');

      } catch (error) {
        logger.error('[ImageImporterModal] Failed to reconstruct shape:', error);
        setView('error');
        setImportResult({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to reconstruct shape',
          warnings: [],
        });
      }
    },
    []
  );

  /**
   * Handle manual entry cancellation
   */
  const handleManualEntryCancel = useCallback(() => {
    handleRetry();
  }, [handleRetry]);

  /**
   * Handle template loading from library
   */
  const handleLoadTemplate = useCallback(
    (template: SavedTemplate) => {
      logger.info('[ImageImporterModal] Loading template:', template.name);

      // Populate import store with template data
      useImportStore.setState({
        dimensions: template.dimensions,
        area: template.area,
        areaUnit: template.areaUnit,
      });

      // Close template library
      setShowTemplateLibrary(false);
    },
    []
  );

  if (!isOpen) return null;

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
        zIndex: 999999,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => !isProcessing && e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width:
            view === 'preview'
              ? hybridResult?.imageUrl
                ? '900px'  // Preview with image comparison
                : '650px'  // Preview without image
              : view === 'manual_scale' || view === 'manual_entry'
              ? showTemplateLibrary
                ? '800px'  // Template library needs more width
                : '600px'  // Manual entry form
              : '500px',  // Upload, processing, success, error views
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          animation: 'slideIn 0.2s ease-out',
          position: 'relative',
          transition: 'width 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '700',
              color: '#1F2937',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            Import Plan
          </h2>

          {!isProcessing && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#6B7280',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Close (Esc)"
            >
              ×
            </button>
          )}
        </div>

        {/* Upload View */}
        {view === 'upload' && (
          <div>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              Upload a site plan image (JPG, PNG, or PDF) with dimension labels. The app
              will automatically detect the boundary and extract measurements.
            </p>

            <UploadZone
              onFileSelect={handleFileSelect}
              maxSize={10 * 1024 * 1024}
              acceptedFormats={['image/jpeg', 'image/png', 'application/pdf']}
            />

            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#374151',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '8px' }}>Tips:</strong>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Use high-quality images for best results</li>
                <li>Ensure dimension labels are clearly visible</li>
                <li>Supported units: meters (m), feet (ft), yards (yd)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Processing View */}
        {view === 'processing' && (
          <div>
            <div
              style={{
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              {/* Spinner */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid #E5E7EB',
                  borderTop: '4px solid #3B82F6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px',
                }}
              />

              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#3B82F6',
                    transition: 'width 0.3s ease-out',
                  }}
                />
              </div>

              {/* Progress text */}
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1F2937',
                  marginBottom: '8px',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                {progress}%
              </div>

              <div
                style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                {statusMessage}
              </div>
            </div>

            {selectedFile && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#374151',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                <strong>Processing:</strong> {selectedFile.name}
              </div>
            )}
          </div>
        )}

        {/* Success View */}
        {view === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {/* Success icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#10B981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '32px',
                color: 'white',
              }}
            >
              ✓
            </div>

            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
                fontWeight: '700',
                color: '#1F2937',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              Import Successful!
            </h3>

            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              Your site plan has been added to the canvas.
            </p>

            {importResult?.warnings && importResult.warnings.length > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#92400E',
                  fontFamily: 'Nunito Sans, sans-serif',
                  textAlign: 'left',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '8px' }}>
                  Warnings:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {importResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Manual Scale Input View */}
        {view === 'manual_scale' && (
          <div>
            <div
              style={{
                padding: '16px',
                backgroundColor: '#FEF3C7',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#92400E',
                fontFamily: 'Nunito Sans, sans-serif',
                marginBottom: '20px',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '8px' }}>
                ⚠️ No Dimensions Detected
              </strong>
              <p style={{ margin: 0 }}>
                The OCR couldn't find dimension labels in the image. Please manually
                enter the length of one edge to establish the scale.
              </p>
            </div>

            {/* Visual Edge Preview */}
            {importResult?.metadata?.originalBoundaryVertices && (
              <div style={{ marginBottom: '20px' }}>
                <EdgePreview
                  vertices={importResult.metadata.originalBoundaryVertices}
                  selectedEdgeIndex={selectedEdgeIndex}
                  width={400}
                  height={300}
                />
              </div>
            )}

            <div
              style={{
                marginBottom: '20px',
                fontFamily: 'Nunito Sans, sans-serif',
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
                Select Edge to Measure:
              </label>
              <select
                value={selectedEdgeIndex}
                onChange={(e) => setSelectedEdgeIndex(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '2px solid #D1D5DB',
                  borderRadius: '8px',
                  fontFamily: 'Nunito Sans, sans-serif',
                  color: '#374151',
                  backgroundColor: 'white',
                }}
              >
                {(() => {
                  const vertices = importResult?.metadata?.originalBoundaryVertices;

                  if (!vertices || vertices.length === 0) {
                    return (
                      <option value={0}>
                        Error: No edge data available
                      </option>
                    );
                  }

                  // Calculate bounding box center for direction detection
                  const minX = Math.min(...vertices.map(v => v.x));
                  const maxX = Math.max(...vertices.map(v => v.x));
                  const minY = Math.min(...vertices.map(v => v.y));
                  const maxY = Math.max(...vertices.map(v => v.y));
                  const centerX = (minX + maxX) / 2;
                  const centerY = (minY + maxY) / 2;

                  return vertices.map((_, index) => {
                    const p1 = vertices[index];
                    const p2 = vertices[(index + 1) % vertices.length];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const lengthPx = Math.sqrt(dx * dx + dy * dy);

                    // Calculate direction based on position and orientation
                    const edgeMidY = (p1.y + p2.y) / 2;
                    const isHorizontal = Math.abs(dx) > Math.abs(dy);

                    let direction = '';
                    if (isHorizontal) {
                      // Horizontal edge: check if above or below center
                      direction = edgeMidY < centerY ? 'Top' : 'Bottom';
                    } else {
                      // Vertical edge: based on edge direction (dy)
                      // Positive dy (going down) = Left side
                      // Negative dy (going up) = Right side
                      direction = dy > 0 ? 'Left' : 'Right';
                    }

                    return (
                      <option key={index} value={index}>
                        Edge {index + 1} - {direction} ({lengthPx.toFixed(0)}px)
                      </option>
                    );
                  });
                })()}
              </select>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '12px',
                  color: '#6B7280',
                  fontStyle: 'italic',
                }}
              >
                Tip: Directions (Top/Bottom/Left/Right) show where the edge will appear on the final canvas
              </p>
            </div>

            <div
              style={{
                marginBottom: '20px',
                fontFamily: 'Nunito Sans, sans-serif',
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
                Enter Dimension:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  value={manualDimension}
                  onChange={(e) => setManualDimension(e.target.value)}
                  placeholder="e.g., 21.45"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #D1D5DB',
                    borderRadius: '8px',
                    fontFamily: 'Nunito Sans, sans-serif',
                    color: '#374151',
                  }}
                  step="0.01"
                  min="0"
                />
                <select
                  value={manualUnit}
                  onChange={(e) => setManualUnit(e.target.value as 'm' | 'ft' | 'yd')}
                  style={{
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #D1D5DB',
                    borderRadius: '8px',
                    fontFamily: 'Nunito Sans, sans-serif',
                    color: '#374151',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="m">meters (m)</option>
                  <option value="ft">feet (ft)</option>
                  <option value="yd">yards (yd)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleManualScaleConfirm}
                disabled={!manualDimension || parseFloat(manualDimension) <= 0}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: !manualDimension || parseFloat(manualDimension) <= 0 ? '#9CA3AF' : '#3B82F6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !manualDimension || parseFloat(manualDimension) <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (manualDimension && parseFloat(manualDimension) > 0) {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (manualDimension && parseFloat(manualDimension) > 0) {
                    e.currentTarget.style.backgroundColor = '#3B82F6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Apply Scale
              </button>

              <button
                onClick={handleRetry}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#F3F4F6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                Try Another Image
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry View (Hybrid Approach) */}
        {view === 'manual_entry' && !showTemplateLibrary && hybridResult && (
          <div>
            {/* Info banner */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#EFF6FF',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#1E40AF',
                fontFamily: 'Nunito Sans, sans-serif',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ display: 'block', marginBottom: '8px' }}>
                  ℹ️ Manual Entry Required
                </strong>
                <p style={{ margin: 0 }}>
                  {hybridResult.boundary.status === 'success'
                    ? `Detected ${hybridResult.boundary.edgeCount}-sided shape. `
                    : 'Could not detect boundary. '}
                  {hybridResult.ocr.status === 'timeout'
                    ? 'OCR timed out after 5 seconds. '
                    : hybridResult.ocr.status === 'failed'
                    ? 'OCR failed. '
                    : 'No dimensions found. '}
                  Please enter dimensions manually.
                </p>
              </div>

              {/* Template Library Button */}
              <button
                onClick={() => setShowTemplateLibrary(true)}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#3B82F6',
                  backgroundColor: 'white',
                  border: '2px solid #3B82F6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                📚 Templates
              </button>
            </div>

            {/* Manual Entry Form */}
            <ManualEntryForm
              edgeCount={
                hybridResult.boundary.status === 'success'
                  ? hybridResult.boundary.edgeCount
                  : 4 // Default to rectangle if boundary detection failed
              }
              roughOutline={
                hybridResult.boundary.status === 'success'
                  ? hybridResult.boundary.roughOutline
                  : []
              }
              onSubmit={handleManualEntrySubmit}
              onCancel={handleManualEntryCancel}
            />
          </div>
        )}

        {/* Template Library View */}
        {view === 'manual_entry' && showTemplateLibrary && hybridResult && (
          <TemplateLibrary
            edgeCount={
              hybridResult.boundary.status === 'success'
                ? hybridResult.boundary.edgeCount
                : undefined
            }
            onLoadTemplate={handleLoadTemplate}
            onClose={() => setShowTemplateLibrary(false)}
          />
        )}

        {/* Geometry Preview View */}
        {view === 'preview' && reconstructedShape && (
          <GeometryPreview
            imageUrl={hybridResult?.imageUrl}
            reconstructedShape={reconstructedShape}
            onConfirm={handlePreviewConfirm}
            onEdit={handlePreviewEdit}
            onCancel={handlePreviewCancel}
          />
        )}

        {/* OCR Review View - Placeholder for future */}
        {view === 'ocr_review' && (
          <div>
            <div
              style={{
                padding: '16px',
                backgroundColor: '#D1FAE5',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#065F46',
                fontFamily: 'Nunito Sans, sans-serif',
                marginBottom: '20px',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '8px' }}>
                ✓ Dimensions Detected
              </strong>
              <p style={{ margin: 0 }}>
                Found {hybridResult?.ocr.dimensions.length} dimensions. Review and confirm below.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '20px' }}>
                OCR review interface will be available in a future update
              </p>
              <button
                onClick={handleRetry}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#3B82F6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                Try Another Image
              </button>
            </div>
          </div>
        )}

        {/* Error View */}
        {view === 'error' && (
          <div>
            {/* Error icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#EF4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '32px',
                color: 'white',
              }}
            >
              ✕
            </div>

            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
                fontWeight: '700',
                color: '#1F2937',
                fontFamily: 'Nunito Sans, sans-serif',
                textAlign: 'center',
              }}
            >
              Import Failed
            </h3>

            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#FEE2E2',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#991B1B',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              {importResult?.error || 'An unknown error occurred'}
            </div>

            {/* Retry button */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                onClick={handleRetry}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#3B82F6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563EB';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Try Again
              </button>

              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#F3F4F6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageImporterModal;
