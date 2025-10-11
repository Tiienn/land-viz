/**
 * TypeScript type definitions for the Site Plan Image Import feature
 *
 * This module defines all interfaces and types used throughout the image import pipeline:
 * - Geometry primitives (points, boundaries, edges)
 * - OCR results (dimensions, labels)
 * - Processing results (matches, scale, import results)
 * - Configuration and metadata
 */

// ============================================================================
// Geometry Primitives
// ============================================================================

/**
 * 2D point in image space (pixels)
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * 3D point in world space (meters)
 * Used for integration with existing 3D canvas
 */
export interface Point3D extends Point2D {
  z: number;
}

/**
 * Bounding box for text/regions in image
 */
export interface BoundingBox {
  x0: number; // Top-left X
  y0: number; // Top-left Y
  x1: number; // Bottom-right X
  y1: number; // Bottom-right Y
}

// ============================================================================
// Shape Detection Results
// ============================================================================

/**
 * Result from OpenCV boundary detection
 */
export interface DetectedBoundary {
  /** Vertices of the detected polygon in image space */
  vertices: Point2D[];

  /** Confidence score (0-100) indicating detection quality */
  confidence: number;

  /** Area of detected shape in pixels (optional) */
  area?: number;

  /** Perimeter of detected shape in pixels (optional) */
  perimeter?: number;
}

/**
 * Simplified boundary detection for hybrid approach
 * Only counts edges and provides rough outline (not precise vertices)
 */
export interface SimpleBoundaryDetection {
  /** Number of edges detected (3, 4, 5, 6+) */
  edgeCount: number;

  /** Rough outline vertices for preview only (not precise) */
  roughOutline: Point2D[];

  /** Basic confidence score (0-100) */
  confidence: number;

  /** Status of detection */
  status: 'success' | 'failed' | 'timeout';

  /** Error message if failed */
  error?: string;
}

/**
 * Edge of a polygon with geometric properties
 * Used for dimension matching
 */
export interface Edge {
  /** Index of this edge in the polygon */
  index: number;

  /** Start vertex */
  start: Point2D;

  /** End vertex */
  end: Point2D;

  /** Midpoint of the edge */
  midpoint: Point2D;

  /** Length in pixels */
  length: number;

  /** Angle in radians */
  angle: number;
}

// ============================================================================
// OCR Results
// ============================================================================

/**
 * Dimension text extracted from image via OCR
 */
export interface ExtractedDimension {
  /** Numeric value (e.g., 21.45) */
  value: number;

  /** Unit of measurement */
  unit: 'm' | 'ft' | 'yd' | 'meters' | 'feet' | 'yards';

  /** Center position of text in image */
  position: Point2D;

  /** Bounding box of text */
  bbox: BoundingBox;

  /** OCR confidence score (0-100) */
  confidence: number;

  /** Raw text recognized by OCR (optional) */
  text?: string;
}

/**
 * Non-dimension text (labels, notes, street names)
 */
export interface ExtractedLabel {
  /** Label text content */
  text: string;

  /** Classification of label type */
  type: 'street' | 'lot_number' | 'note' | 'unknown';

  /** Position in image */
  position: Point2D;

  /** Bounding box */
  bbox: BoundingBox;

  /** OCR confidence */
  confidence: number;
}

// ============================================================================
// Matching Results
// ============================================================================

/**
 * A matched dimension-to-edge pair
 */
export interface DimensionMatch {
  /** Index of the edge this dimension belongs to */
  edgeIndex: number;

  /** The dimension that was matched */
  dimension: ExtractedDimension;

  /** Distance from dimension text to edge (pixels) */
  distance: number;

  /** Confidence in this match (0-100) */
  matchConfidence?: number;
}

/**
 * Conflict when multiple dimensions match the same edge
 */
export interface DimensionConflict {
  /** Edge index with conflict */
  edgeIndex: number;

  /** All dimensions claiming this edge */
  dimensions: ExtractedDimension[];

  /** Variance between dimension values */
  variance: number;
}

// ============================================================================
// Scale Calculation
// ============================================================================

/**
 * Scale information for pixel-to-meter conversion
 */
export interface ScaleInfo {
  /** Pixels per meter ratio */
  pixelsPerMeter: number;

  /** Confidence in scale calculation (0-100) */
  confidence: number;

  /** Variance between different scale calculations (%) */
  variance: number;

  /** Number of dimensions used for calculation */
  matchCount: number;

  /** Individual scale calculations per dimension */
  scaleCalculations?: Array<{
    edgeIndex: number;
    pixelLength: number;
    meterLength: number;
    scale: number;
  }>;
}

// ============================================================================
// Processing Pipeline
// ============================================================================

/**
 * Progress update during import processing
 */
export interface ImportProgress {
  /** Current processing step */
  step: 'upload' | 'preprocess' | 'detect' | 'ocr' | 'match' | 'scale' | 'convert' | 'complete';

  /** Progress percentage (0-100) */
  progress: number;

  /** Human-readable message */
  message: string;

  /** Current step number (1-based) */
  stepNumber?: number;

  /** Total steps */
  totalSteps?: number;
}

/**
 * Final result of image import pipeline
 */
export interface ImportResult {
  /** Whether import succeeded */
  success: boolean;

  /** Imported shape data (if successful) */
  shape?: ImportedShape;

  /** Error message (if failed) */
  error?: string;

  /** Warning messages (non-fatal issues) */
  warnings: string[];

  /** Metadata about the import */
  metadata?: ImportMetadata;
}

/**
 * Shape created from image import
 * Compatible with existing drawing store
 */
export interface ImportedShape {
  /** Unique identifier */
  id: string;

  /** Shape type */
  type: 'polyline' | 'polygon';

  /** Vertices in 3D world space */
  points: Point3D[];

  /** Whether shape is closed (defaults to true for polygons) */
  isClosed?: boolean;

  /** Metadata about the import */
  metadata?: ImportMetadata;

  /** Whether this shape was imported (for tracking) */
  imported?: boolean;

  /** Import timestamp */
  importedAt?: string;
}

/**
 * Metadata preserved with imported shape
 */
export interface ImportMetadata {
  /** Original filename */
  originalFileName?: string;

  /** Import date/time (ISO string) */
  importDate?: string;

  /** Boundary detection confidence (0-100) */
  boundaryConfidence?: number;

  /** Number of dimensions found */
  dimensionsFound?: number;

  /** Number of dimensions matched to edges */
  dimensionsMatched?: number;

  /** Scale information (if calculated) */
  scaleInfo?: ScaleInfo;

  /** Warning messages */
  warnings?: string[];

  /** Processing time in milliseconds */
  processingTime?: number;

  /** Original boundary vertices in pixel coordinates (for manual scaling) */
  originalBoundaryVertices?: Point2D[];

  // Legacy/alternative fields for compatibility
  /** Source of this shape */
  source?: 'image_import';

  /** Original filename (alternative spelling) */
  originalFilename?: string;

  /** Timestamp of import (alternative format) */
  timestamp?: number;

  /** Detected boundary from image */
  detectedBoundary?: DetectedBoundary;

  /** Matched dimensions */
  dimensions?: DimensionMatch[];

  /** Labels found in image */
  labels?: ExtractedLabel[];

  /** Scale information (alternative field name) */
  scale?: ScaleInfo;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Options for import processing
 */
export interface ProcessingOptions {
  /** Maximum image dimension (will downscale if larger) */
  maxImageSize?: number;

  /** Preprocessing intensity level */
  preprocessingLevel?: 'low' | 'medium' | 'high';

  /** OCR languages to use */
  ocrLanguages?: string[];

  /** Epsilon for polygon approximation (Douglas-Peucker) */
  polygonEpsilon?: number;

  /** Minimum confidence threshold (0-100) */
  minConfidence?: number;

  /** Maximum scale variance allowed (%) */
  maxScaleVariance?: number;

  /** Progress callback */
  onProgress?: (progress: ImportProgress) => void;
}

/**
 * Options for site plan import service
 * Used by ImportService.importSitePlan()
 */
export interface ImportOptions {
  /** Preprocessing intensity level */
  preprocessing?: 'low' | 'medium' | 'high';

  /** Minimum OCR confidence threshold (0-100) */
  minOcrConfidence?: number;

  /** Maximum distance from dimension text to edge (pixels) */
  maxDimensionDistance?: number;

  /** Minimum number of dimensions required for scale calculation */
  minScaleDimensions?: number;

  /** Maximum allowed scale variance (%) */
  maxScaleVariance?: number;

  /** Whether to center shape at origin (0,0,0) */
  centerAtOrigin?: boolean;

  /** Whether to automatically add shape to canvas after import */
  autoAddToCanvas?: boolean;

  /** Progress callback */
  onProgress?: (percent: number, message: string) => void;
}

/**
 * Validation result for uploaded file
 */
export interface FileValidationResult {
  /** Whether file is valid */
  valid: boolean;

  /** Error message if invalid */
  error?: string;

  /** File properties */
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    width?: number;
    height?: number;
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Classification of import errors
 */
export type ImportErrorType =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'IMAGE_TOO_SMALL'
  | 'NO_BOUNDARY_DETECTED'
  | 'BOUNDARY_TOO_COMPLEX'
  | 'DIMENSION_EXTRACTION_FAILED'
  | 'INSUFFICIENT_DIMENSIONS'
  | 'SCALE_INCONSISTENT'
  | 'SCALE_CALCULATION_FAILED'
  | 'OPENCV_INITIALIZATION_FAILED'
  | 'TESSERACT_INITIALIZATION_FAILED'
  | 'PROCESSING_TIMEOUT'
  | 'UNKNOWN_ERROR';

/**
 * Detailed error information
 */
export interface ImportError {
  /** Error type */
  type: ImportErrorType;

  /** Human-readable message */
  message: string;

  /** Technical details (for logging) */
  details?: string;

  /** Suggestions for user */
  suggestions?: string[];

  /** Can user retry with different settings? */
  retryable: boolean;
}

// ============================================================================
// Internal Processing Types
// ============================================================================

/**
 * Intermediate result from preprocessing
 * (Internal use - not exposed to components)
 */
export interface PreprocessedImage {
  /** OpenCV Mat object (must be deleted after use!) */
  mat: any; // cv.Mat

  /** Original image dimensions */
  originalWidth: number;
  originalHeight: number;

  /** Processing applied */
  operations: string[];
}

/**
 * Configuration for OpenCV preprocessing
 */
export interface PreprocessingConfig {
  /** Bilateral filter parameters */
  bilateralD?: number;
  bilateralSigmaColor?: number;
  bilateralSigmaSpace?: number;

  /** Canny edge detection thresholds */
  cannyThreshold1?: number;
  cannyThreshold2?: number;

  /** Morphological operations */
  morphKernelSize?: number;
  morphIterations?: number;
}

/**
 * Configuration for Tesseract OCR
 */
export interface OcrConfig {
  /** Language data to use */
  languages: string[];

  /** Character whitelist */
  charWhitelist?: string;

  /** Page segmentation mode */
  pageSegMode?: number;

  /** Preserve inter-word spaces */
  preserveSpaces?: boolean;
}

// ============================================================================
// Review/Correction UI Types
// ============================================================================

/**
 * State for manual correction UI
 */
export interface ReviewState {
  /** Current view mode */
  mode: 'side-by-side' | 'overlay' | 'original-only' | 'detected-only';

  /** Whether user is editing */
  isEditing: boolean;

  /** Selected element for editing */
  selectedElement?: {
    type: 'vertex' | 'edge' | 'dimension';
    index: number;
  };

  /** Modified boundary (if user adjusted) */
  modifiedBoundary?: DetectedBoundary;

  /** Modified dimensions (if user adjusted) */
  modifiedDimensions?: DimensionMatch[];

  /** Modified scale (if user adjusted) */
  modifiedScale?: ScaleInfo;
}

/**
 * Action types for review UI
 */
export type ReviewAction =
  | { type: 'MOVE_VERTEX'; index: number; newPosition: Point2D }
  | { type: 'ADD_VERTEX'; position: Point2D; afterIndex: number }
  | { type: 'REMOVE_VERTEX'; index: number }
  | { type: 'EDIT_DIMENSION'; edgeIndex: number; newValue: number; newUnit: ExtractedDimension['unit'] }
  | { type: 'REASSIGN_DIMENSION'; dimensionIndex: number; newEdgeIndex: number }
  | { type: 'ADJUST_SCALE'; newScale: number }
  | { type: 'RESET_TO_ORIGINAL' }
  | { type: 'CONFIRM_IMPORT' }
  | { type: 'CANCEL_IMPORT' };

// ============================================================================
// Hybrid Import Types (Manual Entry System)
// ============================================================================

/**
 * Manual dimension input for a single edge
 */
export interface DimensionInput {
  /** Edge index */
  edgeIndex: number;

  /** Dimension value */
  value: number;

  /** Unit of measurement */
  unit: 'm' | 'ft' | 'yd';

  /** Optional custom label for this edge */
  label?: string;
}

/**
 * OCR detection result with timeout support
 */
export interface OcrDetectionResult {
  /** Status of OCR processing */
  status: 'pending' | 'success' | 'timeout' | 'failed';

  /** Extracted dimensions (if successful) */
  dimensions: ExtractedDimension[];

  /** Overall confidence score */
  confidence: number;

  /** Processing time in milliseconds */
  processingTime?: number;

  /** Error message if failed */
  error?: string;
}

/**
 * Shape reconstructed from manual dimension inputs
 */
export interface ReconstructedShape {
  /** Calculated vertices in 3D space */
  vertices: Point3D[];

  /** Calculated corner angles (degrees) */
  angles: number[];

  /** Calculated area (square meters) */
  area: number;

  /** Calculated perimeter (meters) */
  perimeter: number;

  /** Validation warnings */
  warnings: AngleWarning[];

  /** Area validation result (if user provided expected area) */
  areaValidation?: AreaValidation;
}

/**
 * Warning about unusual corner angles
 */
export interface AngleWarning {
  /** Corner index (0-based) */
  corner: number;

  /** Calculated angle in degrees */
  angle: number;

  /** Severity level */
  severity: 'warning' | 'error';

  /** Human-readable message */
  message: string;
}

/**
 * Area validation result
 */
export interface AreaValidation {
  /** Validation status */
  status: 'valid' | 'mismatch' | 'not_provided';

  /** Calculated area from dimensions */
  calculatedArea?: number;

  /** User-provided expected area */
  providedArea?: number;

  /** Absolute difference */
  difference?: number;

  /** Percentage difference */
  percentDiff?: number;

  /** Human-readable message */
  message: string;
}

/**
 * Saved template for common shapes
 */
export interface SavedTemplate {
  /** Unique template ID */
  id: string;

  /** User-friendly name */
  name: string;

  /** Number of edges */
  edgeCount: number;

  /** Dimension values (in meters) */
  dimensions: number[];

  /** Optional area */
  area?: number;

  /** Creation timestamp */
  createdAt: string;

  /** Whether this is a built-in template */
  builtIn?: boolean;
}
