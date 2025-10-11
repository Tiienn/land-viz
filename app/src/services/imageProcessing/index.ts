/**
 * Image Processing Services
 *
 * Barrel export for all computer vision and OCR services.
 *
 * @example
 * ```typescript
 * import {
 *   opencv,
 *   tesseract,
 *   preprocessor,
 *   shapeDetector,
 *   safeDelete
 * } from './imageProcessing';
 *
 * // Initialize libraries
 * await opencv.initialize();
 * await tesseract.initialize(['eng']);
 *
 * // Process image
 * const preprocessed = await preprocessor.prepareImage(imageFile);
 * try {
 *   const boundary = shapeDetector.detectBoundary(preprocessed.mat);
 *   console.log('Found boundary with', boundary.vertices.length, 'vertices');
 * } finally {
 *   safeDelete(preprocessed.mat); // ALWAYS cleanup!
 * }
 *
 * // Cleanup
 * await tesseract.terminate();
 * ```
 */

// ============================================================================
// Library Initialization
// ============================================================================

export {
  opencv,
  OpenCVSetup,
  safeDelete,
  safeDeleteAll,
} from './opencvSetup';

export {
  tesseract,
  TesseractSetup,
  PSM,
  OEM,
  type RecognizeResult,
  type Word,
  type Line,
  type Block,
  type Page,
} from './tesseractSetup';

// ============================================================================
// Processing Services
// ============================================================================

export {
  preprocessor,
  ImagePreprocessor,
} from './preprocessor';

export {
  shapeDetector,
  ShapeDetector,
} from './shapeDetector';

export {
  dimensionExtractor,
  DimensionExtractor,
} from './dimensionExtractor';

export {
  dimensionMatcher,
  DimensionMatcher,
} from './dimensionMatcher';

export {
  scaleCalculator,
  ScaleCalculator,
} from './scaleCalculator';
