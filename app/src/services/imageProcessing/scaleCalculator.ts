/**
 * Scale Calculator Service
 *
 * Calculates pixel-to-meter scale from matched dimensions and converts coordinates.
 *
 * ALGORITHM:
 * 1. For each matched dimension:
 *    - Calculate pixel length of edge
 *    - Calculate real-world length from dimension
 *    - Compute scale = pixelLength / realWorldLength
 * 2. Average all scale calculations
 * 3. Detect inconsistencies (outliers)
 * 4. Convert pixel coordinates to meters using scale
 * 5. Convert 2D coordinates to 3D world space
 *
 * SCALE FORMULA:
 * scale (pixels/meter) = pixel_edge_length / real_world_dimension
 *
 * Example:
 * - Edge is 500 pixels long
 * - Dimension says "21.45m"
 * - Scale = 500 / 21.45 = 23.31 pixels/meter
 *
 * @example
 * ```typescript
 * import { scaleCalculator } from './scaleCalculator';
 *
 * const edges = [...]; // From shapeDetector
 * const matches = [...]; // From dimensionMatcher
 *
 * const scaleInfo = scaleCalculator.calculateScale(edges, matches);
 * console.log(`Scale: ${scaleInfo.pixelsPerMeter.toFixed(2)} pixels/meter`);
 *
 * // Convert coordinates
 * const realWorldVertices = scaleCalculator.convertToRealWorld(
 *   pixelVertices,
 *   scaleInfo
 * );
 * ```
 */

import { logger } from '../../utils/logger';
import type {
  Point2D,
  Point3D,
  Edge,
  DimensionMatch,
  ScaleInfo,
  ExtractedDimension,
} from '../../types/imageImport';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Maximum allowed scale variance (%)
 * If variance exceeds this, scale calculation is considered unreliable
 */
const MAX_SCALE_VARIANCE = 15; // 15%

/**
 * Minimum number of dimensions required for reliable scale
 */
const MIN_DIMENSIONS_FOR_SCALE = 2;

/**
 * Outlier threshold (standard deviations)
 * Scale values beyond this are considered outliers
 */
const OUTLIER_THRESHOLD = 2.0;

// ============================================================================
// Scale Calculator Class
// ============================================================================

export class ScaleCalculator {
  /**
   * Calculate scale from matched dimensions
   *
   * @param edges - Polygon edges
   * @param matches - Matched dimensions
   * @returns Scale information with confidence and variance
   * @throws {Error} If insufficient dimensions or inconsistent scale
   */
  calculateScale(edges: Edge[], matches: DimensionMatch[]): ScaleInfo {
    logger.info('[ScaleCalculator] Calculating scale from dimensions...');
    const startTime = Date.now();

    // Validate inputs
    if (matches.length < MIN_DIMENSIONS_FOR_SCALE) {
      throw new Error(
        `Insufficient dimensions for scale calculation. ` +
        `Need at least ${MIN_DIMENSIONS_FOR_SCALE}, found ${matches.length}`
      );
    }

    // Step 1: Calculate individual scales
    const scaleCalculations = this.calculateIndividualScales(edges, matches);

    if (scaleCalculations.length === 0) {
      throw new Error('No valid scale calculations could be performed');
    }

    // Step 2: Filter outliers
    const filtered = this.filterOutliers(scaleCalculations);

    logger.debug(
      `[ScaleCalculator] Scale calculations: ${scaleCalculations.length} total, ` +
      `${filtered.length} after filtering outliers`
    );

    // Step 3: Calculate average scale
    const scales = filtered.map((calc) => calc.scale);
    const averageScale = this.calculateMean(scales);

    // Step 4: Calculate variance
    const variance = this.calculateVariance(scales);

    // Step 5: Calculate confidence
    const confidence = this.calculateConfidence(variance, filtered.length);

    const elapsed = Date.now() - startTime;
    logger.info(
      `[ScaleCalculator] Scale calculation complete in ${elapsed}ms. ` +
      `Scale: ${averageScale.toFixed(2)} px/m (variance: ${variance.toFixed(1)}%, ` +
      `confidence: ${confidence.toFixed(1)}%)`
    );

    // Warn if variance is high
    if (variance > MAX_SCALE_VARIANCE) {
      logger.warn(
        `[ScaleCalculator] High scale variance (${variance.toFixed(1)}%)! ` +
        `Dimensions may be inconsistent. Review matched dimensions.`
      );
    }

    return {
      pixelsPerMeter: averageScale,
      confidence,
      variance,
      matchCount: filtered.length,
      scaleCalculations: scaleCalculations,
    };
  }

  /**
   * Convert pixel coordinates to real-world meters
   *
   * @param pixelVertices - Vertices in pixel coordinates
   * @param scaleInfo - Scale information from calculateScale()
   * @returns Vertices in meters
   */
  convertToRealWorld(pixelVertices: Point2D[], scaleInfo: ScaleInfo): Point2D[] {
    const metersPerPixel = 1 / scaleInfo.pixelsPerMeter;

    return pixelVertices.map((vertex) => ({
      x: vertex.x * metersPerPixel,
      y: vertex.y * metersPerPixel,
    }));
  }

  /**
   * Convert 2D real-world coordinates to 3D world space
   *
   * Applies transformations to integrate with existing 3D canvas:
   * - Centers shape at origin
   * - Flips Y axis (image Y increases downward, 3D Y increases upward)
   * - Sets Z to 0 (flat on ground plane)
   *
   * @param realWorldVertices - Vertices in meters
   * @param centerAtOrigin - Whether to center shape at (0,0) (default: true)
   * @returns 3D vertices ready for canvas
   */
  convertTo3DSpace(
    realWorldVertices: Point2D[],
    centerAtOrigin: boolean = true
  ): Point3D[] {
    // Calculate centroid if centering
    let centerX = 0;
    let centerY = 0;

    if (centerAtOrigin && realWorldVertices.length > 0) {
      centerX = this.calculateMean(realWorldVertices.map((v) => v.x));
      centerY = this.calculateMean(realWorldVertices.map((v) => v.y));
    }

    // Convert to 3D
    return realWorldVertices.map((vertex) => ({
      x: vertex.x - centerX, // Center X
      y: -(vertex.y - centerY), // Flip Y and center
      z: 0, // Flat on ground
    }));
  }

  /**
   * Full conversion pipeline: pixels → meters → 3D
   *
   * Convenience method that combines convertToRealWorld and convertTo3DSpace
   *
   * @param pixelVertices - Vertices in pixel coordinates
   * @param scaleInfo - Scale information
   * @param centerAtOrigin - Whether to center at origin (default: true)
   * @returns 3D vertices ready for canvas
   */
  convertPixelsTo3D(
    pixelVertices: Point2D[],
    scaleInfo: ScaleInfo,
    centerAtOrigin: boolean = true
  ): Point3D[] {
    const realWorld = this.convertToRealWorld(pixelVertices, scaleInfo);
    return this.convertTo3DSpace(realWorld, centerAtOrigin);
  }

  // ==========================================================================
  // Internal Methods
  // ==========================================================================

  /**
   * Calculate scale for each matched dimension
   */
  private calculateIndividualScales(
    edges: Edge[],
    matches: DimensionMatch[]
  ): Array<{
    edgeIndex: number;
    pixelLength: number;
    meterLength: number;
    scale: number;
  }> {
    const calculations: Array<{
      edgeIndex: number;
      pixelLength: number;
      meterLength: number;
      scale: number;
    }> = [];

    for (const match of matches) {
      const edge = edges[match.edgeIndex];

      if (!edge) {
        logger.warn(`[ScaleCalculator] Edge ${match.edgeIndex} not found`);
        continue;
      }

      // Get pixel length from edge
      const pixelLength = edge.length;

      // Get real-world length from dimension (convert to meters)
      const meterLength = this.convertToMeters(
        match.dimension.value,
        match.dimension.unit
      );

      // Calculate scale
      const scale = pixelLength / meterLength;

      // Validate
      if (!isFinite(scale) || scale <= 0 || scale > 10000) {
        logger.warn(
          `[ScaleCalculator] Invalid scale ${scale} for edge ${match.edgeIndex} ` +
          `(${pixelLength}px / ${meterLength}m)`
        );
        continue;
      }

      calculations.push({
        edgeIndex: match.edgeIndex,
        pixelLength,
        meterLength,
        scale,
      });
    }

    return calculations;
  }

  /**
   * Filter outliers using standard deviation
   */
  private filterOutliers(
    calculations: Array<{ scale: number; [key: string]: any }>
  ): Array<{ scale: number; [key: string]: any }> {
    if (calculations.length <= 2) return calculations; // Not enough data

    const scales = calculations.map((c) => c.scale);
    const mean = this.calculateMean(scales);
    const stdDev = this.calculateStandardDeviation(scales, mean);

    // Filter values within threshold * stdDev of mean
    return calculations.filter((calc) => {
      const zScore = Math.abs((calc.scale - mean) / stdDev);
      const isOutlier = zScore > OUTLIER_THRESHOLD;

      if (isOutlier) {
        logger.warn(
          `[ScaleCalculator] Outlier detected: Edge ${calc.edgeIndex} ` +
          `scale ${calc.scale.toFixed(2)} (z-score: ${zScore.toFixed(2)})`
        );
      }

      return !isOutlier;
    });
  }

  /**
   * Calculate mean (average) of values
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[], mean?: number): number {
    if (values.length === 0) return 0;

    const avg = mean !== undefined ? mean : this.calculateMean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
    const variance = this.calculateMean(squaredDiffs);

    return Math.sqrt(variance);
  }

  /**
   * Calculate variance as percentage
   */
  private calculateVariance(scales: number[]): number {
    if (scales.length === 0) return 0;

    const min = Math.min(...scales);
    const max = Math.max(...scales);

    if (min === 0) return 100; // Avoid division by zero

    return ((max - min) / min) * 100;
  }

  /**
   * Calculate confidence score based on variance and sample size
   */
  private calculateConfidence(variance: number, sampleSize: number): number {
    // Variance score: lower variance = higher confidence
    const varianceScore = Math.max(0, 100 - variance * 2); // 15% variance = 70 score

    // Sample size score: more samples = higher confidence
    const sampleSizeScore = Math.min(100, 50 + sampleSize * 10); // 2 samples = 70, 5+ = 100

    // Weighted average
    const confidence = varianceScore * 0.7 + sampleSizeScore * 0.3;

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Convert dimension to meters
   */
  private convertToMeters(value: number, unit: ExtractedDimension['unit']): number {
    switch (unit) {
      case 'm':
      case 'meters':
        return value;
      case 'ft':
      case 'feet':
        return value * 0.3048;
      case 'yd':
      case 'yards':
        return value * 0.9144;
      default:
        return value;
    }
  }

  /**
   * Get scale quality assessment
   *
   * @param scaleInfo - Scale information
   * @returns Quality assessment string
   */
  getScaleQuality(scaleInfo: ScaleInfo): 'excellent' | 'good' | 'fair' | 'poor' {
    if (scaleInfo.confidence >= 90 && scaleInfo.variance <= 5) {
      return 'excellent';
    } else if (scaleInfo.confidence >= 75 && scaleInfo.variance <= 10) {
      return 'good';
    } else if (scaleInfo.confidence >= 60 && scaleInfo.variance <= 15) {
      return 'fair';
    } else {
      return 'poor';
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton scale calculator instance
 */
export const scaleCalculator = new ScaleCalculator();

/**
 * Export class for testing
 */
export default ScaleCalculator;
