/**
 * Type definitions for boundary detection system
 */

// ================================
// WALKABLE BOUNDARY TYPES (Phase 1)
// ================================

/**
 * Terrain type for walkthrough mode
 */
export type TerrainType = 'grass' | 'concrete' | 'dirt' | 'gravel' | 'sand';

/**
 * Fence style for boundary visualization
 */
export type FenceStyle = 'wooden' | 'metal' | 'stone' | 'hedge' | 'none';

/**
 * Walkable boundary configuration for 3D world generation
 */
export interface WalkableBoundary {
  /** Unique identifier (matches DetectedBoundary.id) */
  id: string;

  /** Boundary points in world coordinates (meters) */
  points: Array<{ x: number; y: number }>;

  /** Area in square meters */
  area: number;

  /** Perimeter in meters */
  perimeter: number;

  /** Terrain type for ground texture */
  terrainType: TerrainType;

  /** Fence style for boundary visualization */
  fenceStyle: FenceStyle;

  /** Fence height in meters */
  fenceHeight: number;

  /** Whether AI texture generation is enabled (Phase 3) */
  enableAITexture: boolean;

  /** Custom AI prompt for texture generation (Phase 3) */
  aiTexturePrompt?: string;

  /** Original detected boundary reference */
  sourceDetectedBoundaryId?: string;

  /** Creation timestamp */
  created: Date;
}

/**
 * Configuration for 3D world generation from boundaries
 */
export interface WorldGenerationConfig {
  /** Selected boundaries to make walkable */
  selectedBoundaryIds: string[];

  /** Default terrain type */
  terrainType: TerrainType;

  /** Default fence style */
  fenceStyle: FenceStyle;

  /** Default fence height in meters */
  fenceHeight: number;

  /** Whether to auto-enter walkthrough mode after generation */
  autoEnterWalkthrough: boolean;

  /** Whether AI texture generation is enabled (Phase 3) */
  enableAITexture: boolean;
}

/**
 * Default world generation configuration
 */
export const DEFAULT_WORLD_GENERATION_CONFIG: WorldGenerationConfig = {
  selectedBoundaryIds: [],
  terrainType: 'grass',
  fenceStyle: 'wooden',
  fenceHeight: 1.5,
  autoEnterWalkthrough: true,
  enableAITexture: false,
};

// ================================
// BOUNDARY DETECTION TYPES
// ================================

/**
 * Detected boundary from image processing
 */
export interface DetectedBoundary {
  /** Unique identifier */
  id: string;

  /** Boundary shape type */
  type: 'polygon' | 'rectangle' | 'circle';

  /** Points in image coordinates (pixels from top-left) */
  points: [number, number][];

  /** Area in pixels squared */
  area: number;

  /** Confidence score (0-1, higher is better) */
  confidence: number;

  /** Whether polygon simplification was applied */
  simplified: boolean;

  /** Original contour before simplification (for refinement) */
  originalPoints?: [number, number][];
}

/**
 * Scale calibration data for converting pixels to real-world units
 */
export interface ScaleCalibration {
  /** First reference point in image coordinates (pixels) */
  imagePoint1: [number, number];

  /** Second reference point in image coordinates (pixels) */
  imagePoint2: [number, number];

  /** Known real-world distance between points (in meters) */
  realWorldDistance: number;

  /** Calculated conversion factor (pixels per meter) */
  pixelsPerMeter: number;

  /** User-provided unit for display purposes */
  unit: string; // e.g., "feet", "meters", "yards"
}

/**
 * Complete boundary detection result
 */
export interface BoundaryDetectionResult {
  /** All detected boundaries */
  boundaries: DetectedBoundary[];

  /** Scale calibration (required for import) */
  scale: ScaleCalibration | null;

  /** Original uploaded image */
  originalImage: HTMLImageElement;

  /** Processed image (after preprocessing) */
  processedImageData: ImageData | null;

  /** Metadata */
  metadata: {
    /** Original image dimensions */
    imageWidth: number;
    imageHeight: number;

    /** Processing time in milliseconds */
    processingTime: number;

    /** OpenCV.js version */
    opencvVersion?: string;

    /** Timestamp */
    timestamp: number;
  };
}

/**
 * Preprocessing configuration
 */
export interface PreprocessingConfig {
  /** Apply Gaussian blur for noise reduction */
  gaussianBlur: boolean;

  /** Gaussian blur kernel size (must be odd) */
  blurKernelSize: number;

  /** Apply adaptive thresholding */
  adaptiveThreshold: boolean;

  /** Adaptive threshold block size */
  thresholdBlockSize: number;

  /** Adaptive threshold constant */
  thresholdConstant: number;

  /** Apply morphological operations */
  morphology: boolean;

  /** Morphological operation type */
  morphologyType: 'close' | 'open' | 'dilate' | 'erode';

  /** Morphological kernel size */
  morphologyKernelSize: number;
}

/**
 * Contour detection configuration
 */
export interface ContourConfig {
  /** Minimum contour area (pixels squared) */
  minArea: number;

  /** Maximum contour area (pixels squared, 0 = no limit) */
  maxArea: number;

  /** Minimum number of points in contour */
  minPoints: number;

  /** Maximum number of contours to return */
  maxContours: number;

  /** Sort contours by area (largest first) */
  sortByArea: boolean;
}

/**
 * Polygon approximation configuration
 */
export interface PolygonApproximationConfig {
  /** Enable polygon simplification */
  enabled: boolean;

  /** Epsilon factor (percentage of perimeter, 0.01 = 1%) */
  epsilonFactor: number;

  /** Close polygons (connect last point to first) */
  closed: boolean;
}

/**
 * Complete detection configuration
 */
export interface DetectionConfig {
  preprocessing: PreprocessingConfig;
  contour: ContourConfig;
  polygonApproximation: PolygonApproximationConfig;
}

/**
 * Default preprocessing configuration
 */
export const DEFAULT_PREPROCESSING: PreprocessingConfig = {
  gaussianBlur: true,
  blurKernelSize: 5,
  adaptiveThreshold: true,
  thresholdBlockSize: 11,
  thresholdConstant: 2,
  morphology: true,
  morphologyType: 'close',
  morphologyKernelSize: 3,
};

/**
 * Default contour configuration
 */
export const DEFAULT_CONTOUR: ContourConfig = {
  minArea: 100,
  maxArea: 0, // No limit
  minPoints: 3,
  maxContours: 50,
  sortByArea: true,
};

/**
 * Default polygon approximation configuration
 */
export const DEFAULT_POLYGON_APPROXIMATION: PolygonApproximationConfig = {
  enabled: true,
  epsilonFactor: 0.02, // 2% of perimeter
  closed: true,
};

/**
 * Default detection configuration
 */
export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  preprocessing: DEFAULT_PREPROCESSING,
  contour: DEFAULT_CONTOUR,
  polygonApproximation: DEFAULT_POLYGON_APPROXIMATION,
};
