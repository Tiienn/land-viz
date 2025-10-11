/**
 * Import Service - Main Orchestrator
 *
 * Coordinates the complete site plan import pipeline from image upload to 3D shape creation.
 *
 * PIPELINE FLOW:
 * 1. Initialize libraries (OpenCV.js, Tesseract.js)
 * 2. Preprocess image (edge detection)
 * 3. Detect boundary shape (contours, polygon approximation)
 * 4. Extract dimensions (OCR + regex parsing)
 * 5. Match dimensions to edges (geometric matching)
 * 6. Calculate scale (average multiple dimensions)
 * 7. Convert to 3D coordinates (pixels → meters → 3D)
 * 8. Create shape in drawing store
 *
 * PROGRESS CALLBACKS:
 * - Each step reports progress percentage and status message
 * - UI can show progress bar and current operation
 *
 * ERROR HANDLING:
 * - Graceful failures with descriptive error messages
 * - Partial results when possible (e.g., boundary without dimensions)
 * - Automatic cleanup of resources
 *
 * @example
 * ```typescript
 * import { importService } from './importService';
 *
 * const result = await importService.importSitePlan(imageFile, {
 *   onProgress: (percent, message) => {
 *     console.log(`${percent}%: ${message}`);
 *   },
 *   preprocessing: 'medium',
 *   minOcrConfidence: 70,
 *   autoAddToCanvas: true
 * });
 *
 * if (result.success) {
 *   console.log('Imported shape:', result.shape);
 * } else {
 *   console.error('Import failed:', result.error);
 * }
 * ```
 */

import { logger } from '../../utils/logger';
import {
  opencv,
  tesseract,
  preprocessor,
  shapeDetector,
  dimensionExtractor,
  dimensionMatcher,
  scaleCalculator,
  safeDelete,
} from '../imageProcessing';
import type {
  ImportOptions,
  ImportResult,
  ImportProgress,
  ImportMetadata,
  DetectedBoundary,
  ExtractedDimension,
  DimensionMatch,
  ScaleInfo,
  Point3D,
  ImportError,
  SimpleBoundaryDetection,
  OcrDetectionResult,
} from '../../types/imageImport';
import type { Point2D } from '../../types';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default import options
 */
const DEFAULT_OPTIONS: ImportOptions = {
  preprocessing: 'medium',
  minOcrConfidence: 70,
  maxDimensionDistance: 200,
  minScaleDimensions: 2,
  maxScaleVariance: 15,
  centerAtOrigin: true,
  autoAddToCanvas: false,
  onProgress: undefined,
};

// ============================================================================
// Import Service Class
// ============================================================================

export class ImportService {
  /**
   * Import a site plan image and convert to 3D shape
   *
   * @param imageFile - Image file to import (JPG, PNG, PDF)
   * @param options - Import configuration options
   * @returns Import result with shape or error
   */
  async importSitePlan(
    imageFile: File,
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    logger.info('[ImportService] Starting site plan import...');
    logger.info(`[ImportService] File: ${imageFile.name} (${(imageFile.size / 1024).toFixed(1)}KB)`);

    const warnings: string[] = [];
    let preprocessedMat: any = null;

    try {
      // ========================================================================
      // STEP 1: Initialize Libraries (10%)
      // ========================================================================

      this.reportProgress(opts, 5, 'Initializing computer vision libraries...');

      await this.initializeLibraries();

      this.reportProgress(opts, 10, 'Libraries initialized');

      // ========================================================================
      // STEP 2: Preprocess Image (20%)
      // ========================================================================

      this.reportProgress(opts, 15, 'Preprocessing image...');

      const preprocessed = await preprocessor.prepareImage(
        imageFile,
        opts.preprocessing
      );
      preprocessedMat = preprocessed.mat;

      this.reportProgress(opts, 20, 'Image preprocessed');

      // ========================================================================
      // STEP 3: Detect Boundary Shape (35%)
      // ========================================================================

      this.reportProgress(opts, 25, 'Detecting property boundary...');

      const boundary = shapeDetector.detectBoundary(preprocessedMat);

      logger.info(
        `[ImportService] Detected boundary with ${boundary.vertices.length} vertices ` +
        `(confidence: ${boundary.confidence.toFixed(1)}%)`
      );
      logger.info('[ImportService] Boundary vertices:', boundary.vertices);

      if (boundary.confidence < 60) {
        warnings.push(
          `Low boundary detection confidence (${boundary.confidence.toFixed(1)}%). ` +
          `Shape may be inaccurate.`
        );
      }

      this.reportProgress(opts, 35, `Found ${boundary.vertices.length}-sided boundary`);

      // ========================================================================
      // STEP 4: Extract Dimensions (50%)
      // ========================================================================

      this.reportProgress(opts, 40, 'Extracting dimensions with OCR...');

      const dimensions = await dimensionExtractor.extractDimensions(
        imageFile,
        30, // Lowered from opts.minOcrConfidence (70) to catch more text
        true // Enable OCR preprocessing (CLAHE, sharpening, thresholding)
      );

      logger.info(`[ImportService] Extracted ${dimensions.length} dimensions`);

      if (dimensions.length === 0) {
        warnings.push(
          'No dimensions found in image. Shape will be created without scale information.'
        );
      }

      this.reportProgress(opts, 50, `Found ${dimensions.length} dimensions`);

      // ========================================================================
      // STEP 5: Match Dimensions to Edges (65%)
      // ========================================================================

      let matches: DimensionMatch[] = [];
      let scaleInfo: ScaleInfo | undefined;

      if (dimensions.length > 0) {
        this.reportProgress(opts, 55, 'Matching dimensions to edges...');

        matches = dimensionMatcher.matchDimensionsToEdges(
          boundary.vertices,
          dimensions,
          opts.maxDimensionDistance
        );

        logger.info(`[ImportService] Matched ${matches.length}/${dimensions.length} dimensions`);

        if (matches.length < dimensions.length) {
          warnings.push(
            `Only ${matches.length} of ${dimensions.length} dimensions could be matched to edges.`
          );
        }

        this.reportProgress(opts, 65, `Matched ${matches.length} dimensions`);

        // ======================================================================
        // STEP 6: Calculate Scale (80%)
        // ======================================================================

        if (matches.length >= opts.minScaleDimensions!) {
          this.reportProgress(opts, 70, 'Calculating scale...');

          const edges = dimensionMatcher['calculateEdges'](boundary.vertices);
          scaleInfo = scaleCalculator.calculateScale(edges, matches);

          logger.info(
            `[ImportService] Scale: ${scaleInfo.pixelsPerMeter.toFixed(2)} px/m ` +
            `(confidence: ${scaleInfo.confidence.toFixed(1)}%, ` +
            `variance: ${scaleInfo.variance.toFixed(1)}%)`
          );

          if (scaleInfo.variance > opts.maxScaleVariance!) {
            warnings.push(
              `High scale variance (${scaleInfo.variance.toFixed(1)}%). ` +
              `Dimensions may be inconsistent.`
            );
          }

          const quality = scaleCalculator.getScaleQuality(scaleInfo);
          logger.info(`[ImportService] Scale quality: ${quality}`);

          this.reportProgress(opts, 80, 'Scale calculated');
        } else {
          warnings.push(
            `Insufficient matched dimensions (${matches.length}/${opts.minScaleDimensions}). ` +
            `Cannot calculate accurate scale.`
          );

          this.reportProgress(opts, 80, 'Scale calculation skipped');
        }
      }

      // ========================================================================
      // STEP 7: Convert to 3D Coordinates (90%)
      // ========================================================================

      this.reportProgress(opts, 85, 'Converting to 3D coordinates...');

      let vertices3D: Point3D[];

      if (scaleInfo) {
        // Full conversion: pixels → meters → 3D
        vertices3D = scaleCalculator.convertPixelsTo3D(
          boundary.vertices,
          scaleInfo,
          opts.centerAtOrigin
        );
      } else {
        // Fallback: treat pixels as meters (1:1 scale)
        warnings.push(
          'Using 1:1 pixel-to-meter scale. Real-world dimensions are unknown.'
        );

        const metersPerPixel = 0.01; // 1 pixel = 1 cm (arbitrary)
        const realWorld = boundary.vertices.map((v) => ({
          x: v.x * metersPerPixel,
          y: v.y * metersPerPixel,
        }));

        // Center and flip Y
        const centerX = opts.centerAtOrigin
          ? realWorld.reduce((sum, v) => sum + v.x, 0) / realWorld.length
          : 0;
        const centerY = opts.centerAtOrigin
          ? realWorld.reduce((sum, v) => sum + v.y, 0) / realWorld.length
          : 0;

        vertices3D = realWorld.map((v) => ({
          x: v.x - centerX,
          y: -(v.y - centerY),
          z: 0,
        }));
      }

      this.reportProgress(opts, 90, '3D coordinates ready');

      // ========================================================================
      // STEP 8: Create Metadata (95%)
      // ========================================================================

      logger.info('[ImportService] About to create metadata...');
      logger.info('[ImportService] Boundary vertices still available?', !!boundary.vertices);
      if (boundary.vertices) {
        logger.info('[ImportService] Boundary vertices count:', boundary.vertices.length);
        logger.info('[ImportService] First vertex:', boundary.vertices[0]);
      }

      const metadata: ImportMetadata = {
        originalFileName: imageFile.name,
        importDate: new Date().toISOString(),
        boundaryConfidence: boundary.confidence,
        dimensionsFound: dimensions.length,
        dimensionsMatched: matches.length,
        scaleInfo,
        warnings,
        processingTime: Date.now() - startTime,
        // Store original pixel coordinates for manual scaling
        originalBoundaryVertices: boundary.vertices,
      };

      logger.info('[ImportService] Metadata created. Has originalBoundaryVertices?', !!metadata.originalBoundaryVertices);
      if (metadata.originalBoundaryVertices) {
        logger.info('[ImportService] Metadata originalBoundaryVertices count:', metadata.originalBoundaryVertices.length);
      }

      // ========================================================================
      // STEP 9: Create Shape (100%)
      // ========================================================================

      this.reportProgress(opts, 95, 'Creating shape...');

      const shape = {
        id: crypto.randomUUID(),
        type: 'polygon' as const,
        points: vertices3D,
        metadata,
        imported: true,
        importedAt: metadata.importDate,
      };

      // Note: autoAddToCanvas flag is available but the actual adding
      // must be done by the React component that has access to the store.
      // See: convertToDrawingStoreShape() helper method below.

      this.reportProgress(opts, 100, 'Import complete!');

      const elapsed = Date.now() - startTime;
      logger.info(`[ImportService] Import successful in ${elapsed}ms`);

      return {
        success: true,
        shape,
        warnings,
        metadata,
      };
    } catch (error) {
      // Handle errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('[ImportService] Import failed:', error);

      return {
        success: false,
        error: errorMessage,
        warnings,
      };
    } finally {
      // ========================================================================
      // Cleanup
      // ========================================================================

      if (preprocessedMat) {
        safeDelete(preprocessedMat);
      }

      // Note: We don't terminate Tesseract here as it may be reused
      // The calling code can manage library lifecycle
    }
  }

  /**
   * Hybrid import with OCR timeout and manual entry fallback
   *
   * This method implements the hybrid approach:
   * 1. Run simplified boundary detection (fast, 2s timeout)
   * 2. Run OCR with 5s timeout (non-blocking)
   * 3. If OCR fails/times out, proceed to manual entry
   * 4. Return boundary + OCR status for UI to handle
   *
   * @param imageFile - Image file to import
   * @param options - Import configuration
   * @returns Boundary detection + OCR status (may require manual entry)
   */
  async importSitePlanHybrid(
    imageFile: File,
    options: Partial<ImportOptions> = {}
  ): Promise<{
    boundary: SimpleBoundaryDetection;
    ocr: OcrDetectionResult;
    requiresManualEntry: boolean;
    imageUrl?: string;
  }> {
    const startTime = Date.now();
    logger.info('[ImportService] Starting hybrid import...');

    let preprocessedMat: any = null;

    try {
      // Initialize libraries
      await this.initializeLibraries();

      // Preprocess image
      const preprocessed = await preprocessor.prepareImage(
        imageFile,
        options.preprocessing || 'medium'
      );
      preprocessedMat = preprocessed.mat;

      // Start both detection and OCR in parallel
      const boundaryPromise = shapeDetector.detectBoundarySimple(preprocessedMat, 2000);

      // OCR with 5-second timeout
      const ocrStartTime = Date.now();
      const ocrPromise = (async (): Promise<OcrDetectionResult> => {
        try {
          const dimensions = await dimensionExtractor.extractDimensions(
            imageFile,
            30, // Lower confidence threshold
            true // Enable preprocessing
          );

          const elapsed = Date.now() - ocrStartTime;

          return {
            status: 'success',
            dimensions,
            confidence: dimensions.length > 0
              ? dimensions.reduce((sum, d) => sum + d.confidence, 0) / dimensions.length
              : 0,
            processingTime: elapsed
          };
        } catch (error) {
          const elapsed = Date.now() - ocrStartTime;
          logger.error('[ImportService] OCR error:', error);

          return {
            status: 'failed',
            dimensions: [],
            confidence: 0,
            processingTime: elapsed,
            error: error instanceof Error ? error.message : 'OCR failed'
          };
        }
      })();

      // Wait for boundary detection (should be fast)
      const boundary = await boundaryPromise;

      logger.info(`[ImportService] Boundary detection: ${boundary.status}, ${boundary.edgeCount} edges`);

      // OCR with 5-second timeout
      const ocrTimeoutPromise = new Promise<OcrDetectionResult>((resolve) => {
        setTimeout(() => {
          logger.warn('[ImportService] OCR timeout after 5 seconds');
          resolve({
            status: 'timeout',
            dimensions: [],
            confidence: 0,
            processingTime: 5000
          });
        }, 5000);
      });

      const ocr = await Promise.race([ocrPromise, ocrTimeoutPromise]);

      logger.info(`[ImportService] OCR result: ${ocr.status}, ${ocr.dimensions.length} dimensions found`);

      // Determine if manual entry is required
      const requiresManualEntry =
        boundary.status !== 'success' ||
        ocr.status === 'timeout' ||
        ocr.status === 'failed' ||
        ocr.dimensions.length === 0;

      // Create image URL for preview
      const imageUrl = URL.createObjectURL(imageFile);

      const elapsed = Date.now() - startTime;
      logger.info(`[ImportService] Hybrid import completed in ${elapsed}ms, manual entry: ${requiresManualEntry}`);

      return {
        boundary,
        ocr,
        requiresManualEntry,
        imageUrl
      };

    } catch (error) {
      logger.error('[ImportService] Hybrid import error:', error);

      // Return failure state
      return {
        boundary: {
          edgeCount: 0,
          roughOutline: [],
          confidence: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Detection failed'
        },
        ocr: {
          status: 'failed',
          dimensions: [],
          confidence: 0,
          error: error instanceof Error ? error.message : 'OCR failed'
        },
        requiresManualEntry: true
      };

    } finally {
      // Cleanup
      if (preprocessedMat) {
        safeDelete(preprocessedMat);
      }
    }
  }

  /**
   * Initialize OpenCV and Tesseract libraries
   *
   * This is called automatically by importSitePlan(), but can be called
   * earlier to preload libraries and reduce import time.
   */
  async initializeLibraries(): Promise<void> {
    // Initialize OpenCV
    if (!opencv.isReady()) {
      logger.info('[ImportService] Initializing OpenCV.js...');
      await opencv.initialize();
    }

    // Initialize Tesseract
    if (!tesseract.isReady()) {
      logger.info('[ImportService] Initializing Tesseract.js...');
      await tesseract.initialize(['eng', 'fra']);
    }
  }

  /**
   * Terminate libraries to free resources
   *
   * Call this when completely done with imports (e.g., on app unmount)
   */
  async terminateLibraries(): Promise<void> {
    if (tesseract.isReady()) {
      logger.info('[ImportService] Terminating Tesseract worker...');
      await tesseract.terminate();
    }
  }

  // ==========================================================================
  // Internal Helpers
  // ==========================================================================

  /**
   * Report progress to callback if provided
   */
  private reportProgress(
    options: Partial<ImportOptions>,
    percent: number,
    message: string
  ): void {
    if (options.onProgress) {
      options.onProgress(percent, message);
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): ImportError | null {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return {
        type: 'validation',
        message: 'Invalid file type. Please use JPG, PNG, or PDF.',
        severity: 'error',
      };
    }

    if (file.size > maxSize) {
      return {
        type: 'validation',
        message: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`,
        severity: 'error',
      };
    }

    return null;
  }

  /**
   * Convert imported shape to drawing store format
   *
   * Converts 3D vertices to 2D by dropping the Z coordinate.
   * The drawing store uses 2D points, and the 3D rendering is handled separately.
   *
   * @param importedShape - Shape returned from importSitePlan()
   * @param options - Conversion options
   * @returns Shape data ready for useDrawingStore.addShape()
   *
   * @example
   * ```typescript
   * const result = await importService.importSitePlan(file);
   * if (result.success && result.shape) {
   *   const drawingStore = useDrawingStore.getState();
   *   const shapeData = importService.convertToDrawingStoreShape(
   *     result.shape,
   *     { layerId: 'main', color: '#3B82F6' }
   *   );
   *   drawingStore.addShape(shapeData);
   * }
   * ```
   */
  convertToDrawingStoreShape(
    importedShape: any, // ImportedShape from import result
    options: {
      layerId?: string;
      color?: string;
      name?: string;
    } = {}
  ): Omit<any, 'id' | 'created' | 'modified'> {
    // Convert 3D points to 2D by dropping Z coordinate
    const points2D: Point2D[] = importedShape.points.map((p: Point3D) => ({
      x: p.x,
      y: p.y,
    }));

    // Generate name from filename if available
    const defaultName = importedShape.metadata?.originalFileName
      ? `Imported: ${importedShape.metadata.originalFileName.replace(/\.[^.]+$/, '')}`
      : 'Imported Shape';

    return {
      name: options.name || defaultName,
      points: points2D,
      type: importedShape.type || 'polygon',
      color: options.color || '#3B82F6', // Blue
      visible: true,
      layerId: options.layerId || 'main',
      locked: false,
      // Store import metadata in a custom field (optional)
      // metadata: importedShape.metadata,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton import service instance
 */
export const importService = new ImportService();

/**
 * Export class for testing
 */
export default ImportService;
