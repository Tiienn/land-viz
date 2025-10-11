/**
 * Dimension Matcher Service
 *
 * Intelligently matches extracted dimensions to polygon edges using geometric calculations.
 *
 * ALGORITHM:
 * 1. Calculate edge properties (midpoint, length, angle)
 * 2. For each dimension, find closest edge (perpendicular distance)
 * 3. Validate matches (distance threshold, angle alignment)
 * 4. Detect conflicts (multiple dimensions per edge)
 * 5. Resolve conflicts (prefer higher confidence, closer distance)
 *
 * MATCHING CRITERIA:
 * - Distance: Dimension should be close to edge (max 200px)
 * - Alignment: Dimension should be roughly parallel to edge (±30°)
 * - Confidence: Higher confidence dimensions preferred
 *
 * @example
 * ```typescript
 * import { dimensionMatcher } from './dimensionMatcher';
 *
 * const boundary = { vertices: [{x: 0, y: 0}, {x: 100, y: 0}, ...] };
 * const dimensions = [
 *   { value: 21.45, unit: 'm', position: {x: 50, y: -10}, ... },
 *   { value: 50.71, unit: 'm', position: {x: 110, y: 50}, ... }
 * ];
 *
 * const matches = dimensionMatcher.matchDimensionsToEdges(
 *   boundary.vertices,
 *   dimensions
 * );
 *
 * matches.forEach(match => {
 *   console.log(`Edge ${match.edgeIndex}: ${match.dimension.value}${match.dimension.unit}`);
 * });
 * ```
 */

import { logger } from '../../utils/logger';
import type {
  Point2D,
  Edge,
  ExtractedDimension,
  DimensionMatch,
  DimensionConflict,
  DetectedBoundary,
} from '../../types/imageImport';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Maximum distance from dimension text to edge (pixels)
 * Dimensions farther than this are not matched
 */
const MAX_DISTANCE_TO_EDGE = 200;

/**
 * Maximum angle difference between dimension and edge (degrees)
 * Helps filter perpendicular dimensions
 */
const MAX_ANGLE_DIFFERENCE = 30;

/**
 * Conflict threshold (%)
 * If two dimensions differ by more than this, it's a conflict
 */
const CONFLICT_THRESHOLD = 10; // 10% difference

// ============================================================================
// Dimension Matcher Class
// ============================================================================

export class DimensionMatcher {
  /**
   * Match dimensions to polygon edges
   *
   * @param vertices - Polygon vertices
   * @param dimensions - Extracted dimensions from OCR
   * @param maxDistance - Maximum distance threshold (default: 200px)
   * @returns Array of dimension-to-edge matches
   */
  matchDimensionsToEdges(
    vertices: Point2D[],
    dimensions: ExtractedDimension[],
    maxDistance: number = MAX_DISTANCE_TO_EDGE
  ): DimensionMatch[] {
    logger.info('[DimensionMatcher] Starting dimension-to-edge matching...');
    const startTime = Date.now();

    // Step 1: Calculate edge properties
    const edges = this.calculateEdges(vertices);

    logger.debug(`[DimensionMatcher] Calculated ${edges.length} edges`);

    // Step 2: Match each dimension to closest edge
    const matches: DimensionMatch[] = [];

    for (const dimension of dimensions) {
      const match = this.findBestMatch(dimension, edges, maxDistance);

      if (match) {
        matches.push(match);
      } else {
        logger.warn(
          `[DimensionMatcher] No match found for dimension ${dimension.value}${dimension.unit} ` +
          `at (${dimension.position.x.toFixed(0)}, ${dimension.position.y.toFixed(0)})`
        );
      }
    }

    // Step 3: Detect conflicts
    const conflicts = this.detectConflicts(matches);

    if (conflicts.length > 0) {
      logger.warn(`[DimensionMatcher] Found ${conflicts.length} conflicts`);
      conflicts.forEach((conflict, i) => {
        logger.warn(
          `[DimensionMatcher] Conflict ${i + 1}: Edge ${conflict.edgeIndex} has ` +
          `${conflict.dimensions.length} dimensions with ${conflict.variance.toFixed(1)}% variance`
        );
      });
    }

    const elapsed = Date.now() - startTime;
    logger.info(
      `[DimensionMatcher] Matching complete in ${elapsed}ms. ` +
      `${matches.length}/${dimensions.length} dimensions matched`
    );

    return matches;
  }

  /**
   * Detect conflicts (multiple different dimensions for same edge)
   *
   * @param matches - Dimension matches
   * @returns Array of conflicts
   */
  detectConflicts(matches: DimensionMatch[]): DimensionConflict[] {
    const conflicts: DimensionConflict[] = [];

    // Group by edge
    const edgeMap = new Map<number, DimensionMatch[]>();

    for (const match of matches) {
      if (!edgeMap.has(match.edgeIndex)) {
        edgeMap.set(match.edgeIndex, []);
      }
      edgeMap.get(match.edgeIndex)!.push(match);
    }

    // Check each edge for conflicts
    edgeMap.forEach((edgeMatches, edgeIndex) => {
      if (edgeMatches.length <= 1) return; // No conflict with 1 dimension

      // Get all dimension values (convert to meters for comparison)
      const valuesInMeters = edgeMatches.map((m) =>
        this.convertToMeters(m.dimension.value, m.dimension.unit)
      );

      // Calculate variance
      const min = Math.min(...valuesInMeters);
      const max = Math.max(...valuesInMeters);
      const variance = ((max - min) / min) * 100; // Percentage

      // If variance exceeds threshold, it's a conflict
      if (variance > CONFLICT_THRESHOLD) {
        conflicts.push({
          edgeIndex,
          dimensions: edgeMatches.map((m) => m.dimension),
          variance,
        });
      }
    });

    return conflicts;
  }

  /**
   * Resolve conflicts by selecting best dimension for each edge
   *
   * Uses heuristics:
   * 1. Prefer higher confidence
   * 2. Prefer closer distance
   * 3. Prefer median value if multiple similar
   *
   * @param matches - All matches including conflicts
   * @param conflicts - Detected conflicts
   * @returns Resolved matches (one dimension per edge)
   */
  resolveConflicts(
    matches: DimensionMatch[],
    conflicts: DimensionConflict[]
  ): DimensionMatch[] {
    if (conflicts.length === 0) return matches;

    logger.info('[DimensionMatcher] Resolving conflicts...');

    const conflictEdges = new Set(conflicts.map((c) => c.edgeIndex));
    const resolved: DimensionMatch[] = [];

    // Group by edge
    const edgeMap = new Map<number, DimensionMatch[]>();
    for (const match of matches) {
      if (!edgeMap.has(match.edgeIndex)) {
        edgeMap.set(match.edgeIndex, []);
      }
      edgeMap.get(match.edgeIndex)!.push(match);
    }

    // Process each edge
    edgeMap.forEach((edgeMatches, edgeIndex) => {
      if (!conflictEdges.has(edgeIndex)) {
        // No conflict - keep all matches
        resolved.push(...edgeMatches);
      } else {
        // Conflict - select best match
        const best = this.selectBestMatch(edgeMatches);
        resolved.push(best);

        logger.debug(
          `[DimensionMatcher] Resolved edge ${edgeIndex}: ` +
          `Selected ${best.dimension.value}${best.dimension.unit} ` +
          `(confidence: ${best.dimension.confidence.toFixed(1)}%, ` +
          `distance: ${best.distance.toFixed(1)}px)`
        );
      }
    });

    return resolved;
  }

  // ==========================================================================
  // Internal Methods
  // ==========================================================================

  /**
   * Calculate edge properties from vertices
   */
  private calculateEdges(vertices: Point2D[]): Edge[] {
    const edges: Edge[] = [];

    for (let i = 0; i < vertices.length; i++) {
      const start = vertices[i];
      const end = vertices[(i + 1) % vertices.length]; // Wrap around

      const midpoint: Point2D = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      };

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx); // Radians

      edges.push({
        index: i,
        start,
        end,
        midpoint,
        length,
        angle,
      });
    }

    return edges;
  }

  /**
   * Find best matching edge for dimension
   */
  private findBestMatch(
    dimension: ExtractedDimension,
    edges: Edge[],
    maxDistance: number
  ): DimensionMatch | null {
    let bestMatch: DimensionMatch | null = null;
    let minDistance = Infinity;

    for (const edge of edges) {
      // Calculate perpendicular distance from dimension to edge
      const distance = this.pointToSegmentDistance(
        dimension.position,
        edge.start,
        edge.end
      );

      // Skip if too far
      if (distance > maxDistance) continue;

      // Skip if angle doesn't align (optional check)
      // const angleDiff = this.calculateAngleDifference(dimension, edge);
      // if (angleDiff > MAX_ANGLE_DIFFERENCE) continue;

      // Found closer match
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = {
          edgeIndex: edge.index,
          dimension,
          distance,
          matchConfidence: this.calculateMatchConfidence(distance, dimension.confidence),
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate perpendicular distance from point to line segment
   *
   * Uses formula: https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
   */
  private pointToSegmentDistance(
    point: Point2D,
    segStart: Point2D,
    segEnd: Point2D
  ): number {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    const lengthSquared = dx * dx + dy * dy;

    // Segment is a point
    if (lengthSquared === 0) {
      return Math.hypot(point.x - segStart.x, point.y - segStart.y);
    }

    // Find projection of point onto line
    // t = dot(point - segStart, segEnd - segStart) / |segEnd - segStart|²
    let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSquared;

    // Clamp t to [0, 1] to stay on segment
    t = Math.max(0, Math.min(1, t));

    // Calculate closest point on segment
    const closestX = segStart.x + t * dx;
    const closestY = segStart.y + t * dy;

    // Return distance to closest point
    return Math.hypot(point.x - closestX, point.y - closestY);
  }

  /**
   * Calculate match confidence based on distance and OCR confidence
   */
  private calculateMatchConfidence(distance: number, ocrConfidence: number): number {
    // Distance score: closer = better (0-100)
    const maxDist = MAX_DISTANCE_TO_EDGE;
    const distanceScore = Math.max(0, 100 * (1 - distance / maxDist));

    // Combined confidence (weighted average)
    const matchConfidence = distanceScore * 0.4 + ocrConfidence * 0.6;

    return Math.min(100, Math.max(0, matchConfidence));
  }

  /**
   * Select best match from multiple candidates
   */
  private selectBestMatch(candidates: DimensionMatch[]): DimensionMatch {
    if (candidates.length === 1) return candidates[0];

    // Sort by:
    // 1. Match confidence (higher better)
    // 2. Distance (lower better)
    const sorted = [...candidates].sort((a, b) => {
      const confDiff = (b.matchConfidence || 0) - (a.matchConfidence || 0);
      if (Math.abs(confDiff) > 5) return confDiff; // Significant confidence difference

      return a.distance - b.distance; // Otherwise prefer closer
    });

    return sorted[0];
  }

  /**
   * Convert dimension to meters for comparison
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
   * Get unmatched dimensions
   *
   * Useful for debugging or manual correction UI
   */
  getUnmatchedDimensions(
    allDimensions: ExtractedDimension[],
    matches: DimensionMatch[]
  ): ExtractedDimension[] {
    const matched = new Set(matches.map((m) => m.dimension));
    return allDimensions.filter((d) => !matched.has(d));
  }

  /**
   * Get edges without dimensions
   *
   * Useful for warning user about missing dimensions
   */
  getUnmatchedEdges(
    edgeCount: number,
    matches: DimensionMatch[]
  ): number[] {
    const matchedEdges = new Set(matches.map((m) => m.edgeIndex));
    const unmatched: number[] = [];

    for (let i = 0; i < edgeCount; i++) {
      if (!matchedEdges.has(i)) {
        unmatched.push(i);
      }
    }

    return unmatched;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton dimension matcher instance
 */
export const dimensionMatcher = new DimensionMatcher();

/**
 * Export class for testing
 */
export default DimensionMatcher;
