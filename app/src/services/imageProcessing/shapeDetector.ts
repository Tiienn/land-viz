/**
 * Shape Detector Service
 *
 * Detects property boundaries from preprocessed images using contour extraction
 * and polygon approximation (Douglas-Peucker algorithm).
 *
 * ALGORITHM:
 * 1. Find all contours in preprocessed image
 * 2. Select largest closed contour (assumed to be property boundary)
 * 3. Approximate contour to polygon with cv.approxPolyDP()
 * 4. Extract vertices
 * 5. Calculate confidence score
 *
 * MEMORY MANAGEMENT:
 * - All cv.Mat and cv.MatVector objects must be deleted
 * - Use try-finally blocks for cleanup
 * - Call safeDeleteAll() for batch cleanup
 *
 * @example
 * ```typescript
 * import { shapeDetector } from './shapeDetector';
 * import { preprocessor } from './preprocessor';
 *
 * const preprocessed = await preprocessor.prepareImage(file);
 * try {
 *   const boundary = shapeDetector.detectBoundary(preprocessed.mat);
 *   console.log('Found', boundary.vertices.length, 'vertices');
 * } finally {
 *   preprocessed.mat.delete();
 * }
 * ```
 */

import { opencv, safeDelete, safeDeleteAll } from './opencvSetup';
import { logger } from '../../utils/logger';
import type { DetectedBoundary, Point2D, SimpleBoundaryDetection } from '../../types/imageImport';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default epsilon for polygon approximation
 * Lower = more vertices (more accurate)
 * Higher = fewer vertices (simpler polygon)
 */
const DEFAULT_EPSILON = 0.05; // 5% of perimeter (balanced for clean boundaries)

/**
 * Minimum contour area (pixels) to consider
 * Filters out noise and small shapes
 */
const MIN_CONTOUR_AREA = 500;

/**
 * Maximum vertices in approximated polygon
 * Prevents overly complex shapes
 */
const MAX_VERTICES = 20;

/**
 * Minimum vertices in approximated polygon
 * Property boundaries should have at least 3 vertices
 */
const MIN_VERTICES = 3;

// ============================================================================
// Shape Detector Class
// ============================================================================

export class ShapeDetector {
  /**
   * Detect property boundary from preprocessed image
   *
   * @param preprocessedMat - Preprocessed cv.Mat (binary edge image)
   * @param epsilon - Polygon approximation epsilon (default: 0.02)
   * @returns Detected boundary with vertices and confidence
   * @throws {Error} If no valid boundary found
   */
  detectBoundary(
    preprocessedMat: any,
    epsilon: number = DEFAULT_EPSILON
  ): DetectedBoundary {
    if (!opencv.isReady()) {
      throw new Error('OpenCV not initialized');
    }

    logger.info('[ShapeDetector] Starting boundary detection...');
    const startTime = Date.now();

    const cv = opencv.getCV();
    let contours: any = null;
    let hierarchy: any = null;
    let largestContour: any = null;
    let approxPoly: any = null;

    try {
      // Step 1: Find all contours
      contours = new cv.MatVector();
      hierarchy = new cv.Mat();

      cv.findContours(
        preprocessedMat,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL, // Only external contours
        cv.CHAIN_APPROX_SIMPLE // Compress contours
      );

      logger.info(`[ShapeDetector] Found ${contours.size()} contours`);

      if (contours.size() === 0) {
        throw new Error('No contours detected in image');
      }

      // Step 2: Find largest contour
      const { contour: maxContour, area: maxArea, index: maxIndex } =
        this.findLargestContour(contours);

      if (!maxContour) {
        throw new Error('No valid contours found (all below minimum area threshold)');
      }

      logger.info(`[ShapeDetector] Selected contour ${maxIndex} with area ${maxArea.toFixed(0)}px²`);
      largestContour = maxContour;

      // Step 3: Approximate to polygon (Douglas-Peucker)
      const perimeter = cv.arcLength(largestContour, true);
      let epsilonValue = epsilon * perimeter;

      approxPoly = new cv.Mat();
      cv.approxPolyDP(largestContour, approxPoly, epsilonValue, true);

      let vertexCount = approxPoly.rows;
      logger.info(`[ShapeDetector] Approximated to ${vertexCount} vertices (epsilon=${epsilonValue.toFixed(2)})`);

      // Adaptive epsilon: If we get 5-12 vertices, try more aggressive simplification
      // Site plans are usually 4-sided (quadrilaterals), but may have a few extra corners
      if (vertexCount >= 5 && vertexCount <= 12) {
        logger.info(`[ShapeDetector] Attempting more aggressive simplification for cleaner polygon...`);

        // Try multiple epsilon multipliers: 1.5x, 2x, 2.5x, 3x, 4x
        const multipliers = [1.5, 2.0, 2.5, 3.0, 4.0];
        let bestPoly = approxPoly;
        let bestVertexCount = vertexCount;
        let bestEpsilon = epsilonValue;

        for (const mult of multipliers) {
          const testEpsilon = epsilonValue * mult;
          const testPoly = new cv.Mat();
          cv.approxPolyDP(largestContour, testPoly, testEpsilon, true);

          const newVertexCount = testPoly.rows;
          logger.info(`[ShapeDetector] Epsilon ${mult}x (${testEpsilon.toFixed(2)}): ${newVertexCount} vertices`);

          // If we get 4 vertices (perfect quadrilateral), use it immediately
          if (newVertexCount === 4) {
            logger.info(`[ShapeDetector] ✓ Found clean 4-vertex quadrilateral at ${mult}x epsilon`);

            // Delete previous best if different
            if (bestPoly !== approxPoly) {
              bestPoly.delete();
            }

            bestPoly = testPoly;
            bestVertexCount = newVertexCount;
            bestEpsilon = testEpsilon;
            break; // Found ideal shape, stop trying
          } else {
            testPoly.delete();
          }
        }

        // Accept if we found a better result
        if (bestPoly !== approxPoly) {
          approxPoly.delete();
          approxPoly = bestPoly;
          vertexCount = bestVertexCount;
          epsilonValue = bestEpsilon;
          logger.info(`[ShapeDetector] Using simplified ${vertexCount}-vertex polygon`);
        } else {
          logger.info(`[ShapeDetector] No better simplification found, keeping ${vertexCount} vertices`);
        }
      }

      // Validate vertex count
      if (vertexCount < MIN_VERTICES) {
        throw new Error(`Too few vertices (${vertexCount}). Minimum is ${MIN_VERTICES}.`);
      }

      if (vertexCount > MAX_VERTICES) {
        throw new Error(
          `Too many vertices (${vertexCount}). Maximum is ${MAX_VERTICES}. ` +
          `Try increasing preprocessing level or manually trace boundary.`
        );
      }

      // Step 4: Extract vertices
      const vertices = this.extractVertices(approxPoly);

      // Step 5: Calculate confidence
      const confidence = this.calculateConfidence(approxPoly, largestContour, maxArea);

      const elapsed = Date.now() - startTime;
      logger.info(`[ShapeDetector] Boundary detection complete in ${elapsed}ms (confidence: ${confidence.toFixed(1)}%)`);

      return {
        vertices,
        confidence,
        area: maxArea,
        perimeter,
      };

    } catch (error) {
      logger.error('[ShapeDetector] Error during detection:', error);
      throw error;

    } finally {
      // CRITICAL: Cleanup all OpenCV objects
      safeDelete(contours);
      safeDelete(hierarchy);
      safeDelete(largestContour);
      safeDelete(approxPoly);
    }
  }

  /**
   * Find largest contour by area
   *
   * @returns Largest contour, its area, and index
   */
  private findLargestContour(contours: any): {
    contour: any | null;
    area: number;
    index: number;
  } {
    const cv = opencv.getCV();

    let maxArea = 0;
    let maxContourIndex = -1;
    let maxContour: any = null;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);

      // Skip small contours (noise)
      if (area < MIN_CONTOUR_AREA) {
        logger.debug(`[ShapeDetector] Skipping contour ${i} (area ${area.toFixed(0)}px² < ${MIN_CONTOUR_AREA}px²)`);
        continue;
      }

      if (area > maxArea) {
        // Delete previous max if exists
        if (maxContour) {
          maxContour.delete();
        }

        maxArea = area;
        maxContourIndex = i;
        maxContour = contour.clone();
      }
    }

    return {
      contour: maxContour,
      area: maxArea,
      index: maxContourIndex,
    };
  }

  /**
   * Extract vertices from approximated polygon
   *
   * @param approxPoly - cv.Mat from approxPolyDP
   * @returns Array of Point2D vertices
   */
  private extractVertices(approxPoly: any): Point2D[] {
    const vertices: Point2D[] = [];

    // approxPoly is a Mat with shape (N, 1, 2) where N is vertex count
    // data32S is int32 array: [x0, y0, x1, y1, ...]
    for (let i = 0; i < approxPoly.rows; i++) {
      const x = approxPoly.data32S[i * 2];
      const y = approxPoly.data32S[i * 2 + 1];

      vertices.push({ x, y });
    }

    return vertices;
  }

  /**
   * Calculate confidence score for detected boundary
   *
   * Confidence is based on:
   * - How well approximation matches original contour
   * - Area relative to image size
   * - Shape regularity
   *
   * @returns Confidence score (0-100)
   */
  private calculateConfidence(
    approxPoly: any,
    originalContour: any,
    area: number
  ): number {
    const cv = opencv.getCV();

    try {
      // Factor 1: Approximation accuracy (how close to original)
      const approxArea = cv.contourArea(approxPoly);
      const originalArea = cv.contourArea(originalContour);
      const areaRatio = Math.min(approxArea, originalArea) / Math.max(approxArea, originalArea);
      const approximationScore = areaRatio * 100; // 0-100

      // Factor 2: Contour solidity (area / convex hull area)
      // Higher solidity = more regular shape
      const hull = new cv.Mat();
      cv.convexHull(approxPoly, hull);
      const hullArea = cv.contourArea(hull);
      const solidity = hullArea > 0 ? (approxArea / hullArea) : 0;
      const solidityScore = solidity * 100; // 0-100
      hull.delete();

      // Factor 3: Vertex count (prefer 4-8 vertices)
      const vertexCount = approxPoly.rows;
      let vertexScore = 100;
      if (vertexCount === 4) vertexScore = 100; // Rectangle - perfect
      else if (vertexCount <= 6) vertexScore = 90; // Quadrilateral, pentagon, hexagon
      else if (vertexCount <= 10) vertexScore = 75; // Complex but reasonable
      else vertexScore = 60; // Very complex

      // Weighted average
      const confidence =
        approximationScore * 0.5 + // 50% weight
        solidityScore * 0.3 +      // 30% weight
        vertexScore * 0.2;         // 20% weight

      return Math.min(Math.max(confidence, 0), 100); // Clamp to 0-100

    } catch (error) {
      logger.error('[ShapeDetector] Error calculating confidence:', error);
      return 50; // Default confidence on error
    }
  }

  /**
   * Simplified boundary detection for hybrid approach
   * Only counts edges and provides rough outline (not precise)
   *
   * @param preprocessedMat - Preprocessed cv.Mat (binary edge image)
   * @param timeout - Maximum time in milliseconds (default: 2000)
   * @returns Simplified boundary detection with edge count
   */
  detectBoundarySimple(
    preprocessedMat: any,
    timeout: number = 2000
  ): SimpleBoundaryDetection {
    if (!opencv.isReady()) {
      return {
        edgeCount: 0,
        roughOutline: [],
        confidence: 0,
        status: 'failed',
        error: 'OpenCV not initialized'
      };
    }

    logger.info('[ShapeDetector] Starting simplified boundary detection...');
    const startTime = Date.now();

    const cv = opencv.getCV();
    let contours: any = null;
    let hierarchy: any = null;
    let largestContour: any = null;
    let approxPoly: any = null;

    try {
      // Step 1: Find all contours
      contours = new cv.MatVector();
      hierarchy = new cv.Mat();

      cv.findContours(
        preprocessedMat,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      logger.info(`[ShapeDetector] Found ${contours.size()} contours`);

      if (contours.size() === 0) {
        return {
          edgeCount: 0,
          roughOutline: [],
          confidence: 0,
          status: 'failed',
          error: 'No contours detected in image'
        };
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        logger.warn('[ShapeDetector] Simplified detection timeout');
        return {
          edgeCount: 0,
          roughOutline: [],
          confidence: 0,
          status: 'timeout',
          error: 'Detection timeout'
        };
      }

      // Step 2: Find largest contour
      const { contour: maxContour, area: maxArea, index: maxIndex } =
        this.findLargestContour(contours);

      if (!maxContour) {
        return {
          edgeCount: 0,
          roughOutline: [],
          confidence: 0,
          status: 'failed',
          error: 'No valid contours found (all below minimum area threshold)'
        };
      }

      logger.info(`[ShapeDetector] Selected contour ${maxIndex} with area ${maxArea.toFixed(0)}px²`);
      largestContour = maxContour;

      // Step 3: Adaptive approximation to find optimal vertex count
      // Most site plans are 4-sided quadrilaterals
      const perimeter = cv.arcLength(largestContour, true);

      // Try multiple epsilon values to find best vertex count
      // Target: 4 vertices (most common), accept 3-6
      const epsilonTests = [
        0.03, // 3% - conservative
        0.04, // 4%
        0.05, // 5%
        0.06, // 6% - balanced
        0.07, // 7%
        0.08, // 8% - aggressive
        0.10, // 10% - very aggressive
      ];

      let bestPoly: any = null;
      let bestVertexCount = 0;
      let bestEpsilon = 0;

      logger.info(`[ShapeDetector] Testing multiple epsilon values to find optimal shape...`);

      for (const epsilon of epsilonTests) {
        const testEpsilon = epsilon * perimeter;
        const testPoly = new cv.Mat();
        cv.approxPolyDP(largestContour, testPoly, testEpsilon, true);

        const vertexCount = testPoly.rows;
        logger.info(`[ShapeDetector] Epsilon ${(epsilon * 100).toFixed(0)}% (${testEpsilon.toFixed(2)}px): ${vertexCount} vertices`);

        // Priority: 4 vertices (quadrilateral) > 3, 5, 6 > other
        let score = 0;
        if (vertexCount === 4) score = 100; // Perfect
        else if (vertexCount === 5) score = 80; // Pentagon - good
        else if (vertexCount === 3) score = 75; // Triangle - acceptable
        else if (vertexCount === 6) score = 70; // Hexagon - acceptable
        else if (vertexCount >= 7 && vertexCount <= 10) score = 50; // Complex but valid
        else score = 0; // Too simple (< 3) or too complex (> 10)

        // If this is the best score so far, use it
        if (score > 0 && (bestPoly === null || score > (bestVertexCount === 4 ? 100 : bestVertexCount === 5 ? 80 : bestVertexCount === 3 ? 75 : bestVertexCount === 6 ? 70 : 50))) {
          // Delete previous best
          if (bestPoly !== null) {
            bestPoly.delete();
          }

          bestPoly = testPoly;
          bestVertexCount = vertexCount;
          bestEpsilon = testEpsilon;

          // If we found 4 vertices, that's ideal - stop searching
          if (vertexCount === 4) {
            logger.info(`[ShapeDetector] ✓ Found ideal 4-sided quadrilateral, stopping search`);
            break;
          }
        } else {
          testPoly.delete();
        }
      }

      // Use best result
      if (bestPoly === null) {
        throw new Error('Failed to find valid polygon approximation');
      }

      approxPoly = bestPoly;
      const vertexCount = bestVertexCount;
      logger.info(`[ShapeDetector] Final result: ${vertexCount} vertices (epsilon=${bestEpsilon.toFixed(2)}px)`)

      // Extract rough outline vertices
      const roughOutline = this.extractVertices(approxPoly);

      // Determine edge count category
      let edgeCount: number;
      if (vertexCount === 3) edgeCount = 3; // Triangle
      else if (vertexCount === 4) edgeCount = 4; // Quadrilateral
      else if (vertexCount === 5) edgeCount = 5; // Pentagon
      else if (vertexCount === 6) edgeCount = 6; // Hexagon
      else edgeCount = vertexCount; // Complex shape

      // Basic confidence (simplified)
      const confidence = vertexCount >= 3 && vertexCount <= 8 ? 80 : 60;

      const elapsed = Date.now() - startTime;
      logger.info(`[ShapeDetector] Simplified detection complete in ${elapsed}ms (${edgeCount} edges)`);

      return {
        edgeCount,
        roughOutline,
        confidence,
        status: 'success'
      };

    } catch (error) {
      logger.error('[ShapeDetector] Error during simplified detection:', error);
      return {
        edgeCount: 0,
        roughOutline: [],
        confidence: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

    } finally {
      // CRITICAL: Cleanup all OpenCV objects
      safeDelete(contours);
      safeDelete(hierarchy);
      safeDelete(largestContour);
      safeDelete(approxPoly);
    }
  }

  /**
   * Detect multiple boundaries (for multi-parcel support)
   *
   * @param preprocessedMat - Preprocessed cv.Mat
   * @param minArea - Minimum area threshold (default: MIN_CONTOUR_AREA)
   * @returns Array of detected boundaries, sorted by area (largest first)
   */
  detectMultipleBoundaries(
    preprocessedMat: any,
    minArea: number = MIN_CONTOUR_AREA
  ): DetectedBoundary[] {
    if (!opencv.isReady()) {
      throw new Error('OpenCV not initialized');
    }

    const cv = opencv.getCV();
    const boundaries: DetectedBoundary[] = [];
    let contours: any = null;
    let hierarchy: any = null;

    try {
      // Find contours
      contours = new cv.MatVector();
      hierarchy = new cv.Mat();

      cv.findContours(
        preprocessedMat,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      // Process each contour
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        // Skip small contours
        if (area < minArea) continue;

        try {
          // Approximate to polygon
          const perimeter = cv.arcLength(contour, true);
          const approxPoly = new cv.Mat();
          cv.approxPolyDP(contour, approxPoly, DEFAULT_EPSILON * perimeter, true);

          const vertexCount = approxPoly.rows;

          // Validate vertex count
          if (vertexCount >= MIN_VERTICES && vertexCount <= MAX_VERTICES) {
            const vertices = this.extractVertices(approxPoly);
            const confidence = this.calculateConfidence(approxPoly, contour, area);

            boundaries.push({
              vertices,
              confidence,
              area,
              perimeter,
            });
          }

          approxPoly.delete();

        } catch (error) {
          logger.warn(`[ShapeDetector] Failed to process contour ${i}:`, error);
        }
      }

      // Sort by area (largest first)
      boundaries.sort((a, b) => (b.area || 0) - (a.area || 0));

      logger.info(`[ShapeDetector] Detected ${boundaries.length} valid boundaries`);

      return boundaries;

    } finally {
      safeDelete(contours);
      safeDelete(hierarchy);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton shape detector instance
 */
export const shapeDetector = new ShapeDetector();

/**
 * Export class for testing
 */
export default ShapeDetector;
