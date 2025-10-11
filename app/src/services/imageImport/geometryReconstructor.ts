/**
 * Geometry Reconstructor Service
 *
 * Reconstructs shape geometry from edge dimensions using constraint-based approach.
 * Builds valid 3D vertices from user-entered dimension measurements.
 *
 * ALGORITHMS:
 * - Rectangle: Simple 4-vertex construction with validation
 * - Triangle: Triangle inequality validation + vertex calculation
 * - Complex Polygons: Iterative placement with closure constraint
 *
 * VALIDATION:
 * - Triangle inequality (for 3-sided shapes)
 * - Closure validation (polygon must close within tolerance)
 * - Aspect ratio checks (very thin shapes)
 * - Angle validation (detect suspicious geometries)
 *
 * @example
 * ```typescript
 * import { geometryReconstructor } from './geometryReconstructor';
 *
 * // Build rectangle from 4 dimensions
 * const shape = geometryReconstructor.reconstruct([10, 20, 10, 20]);
 * console.log(shape.vertices); // 4 vertices
 * console.log(shape.angles);   // [90, 90, 90, 90]
 * console.log(shape.area);     // 200
 * ```
 */

import { logger } from '../../utils/logger';
import type {
  Point3D,
  ReconstructedShape,
  AngleWarning,
  AreaValidation,
} from '../../types/imageImport';

// ============================================================================
// Configuration
// ============================================================================

/** Minimum dimension value (meters) */
const MIN_DIMENSION = 0.1;

/** Maximum dimension value (meters) */
const MAX_DIMENSION = 9999;

/** Closure tolerance for polygon validation (meters) */
const CLOSURE_TOLERANCE = 0.1;

/** Aspect ratio threshold for "very thin" warning */
const THIN_SHAPE_RATIO = 100;

/** Angle thresholds for warnings */
const ANGLE_THRESHOLDS = {
  acute: 45,    // Less than 45° is very acute
  obtuse: 135,  // More than 135° is very obtuse
};

// ============================================================================
// Geometry Reconstructor Class
// ============================================================================

export class GeometryReconstructor {
  /**
   * Reconstruct shape from edge dimensions
   *
   * @param dimensions - Array of edge lengths (in meters)
   * @param providedArea - Optional known area for validation
   * @returns Reconstructed shape with vertices, angles, area
   * @throws {Error} If dimensions are invalid or geometry is impossible
   */
  reconstruct(
    dimensions: number[],
    providedArea?: number | null
  ): ReconstructedShape {
    logger.info(`[GeometryReconstructor] Reconstructing shape from ${dimensions.length} dimensions:`, dimensions);

    // Validate input
    this.validateDimensions(dimensions);

    // Choose reconstruction method based on edge count
    let shape: ReconstructedShape;

    if (dimensions.length === 3) {
      shape = this.reconstructTriangle(dimensions);
    } else if (dimensions.length === 4) {
      shape = this.reconstructQuadrilateral(dimensions);
    } else {
      shape = this.reconstructPolygon(dimensions);
    }

    // Add area validation if provided
    if (providedArea !== null && providedArea !== undefined) {
      shape.areaValidation = this.validateArea(shape.area, providedArea);
    }

    logger.info('[GeometryReconstructor] Reconstruction complete:', {
      vertices: shape.vertices.length,
      angles: shape.angles,
      area: shape.area.toFixed(2),
      warnings: shape.warnings.length,
    });

    return shape;
  }

  /**
   * Reconstruct triangle from 3 dimensions
   */
  private reconstructTriangle(dimensions: [number, number, number] | number[]): ReconstructedShape {
    const [a, b, c] = dimensions;

    logger.info('[GeometryReconstructor] Reconstructing triangle:', { a, b, c });

    // Validate triangle inequality: sum of any two sides > third side
    if (a + b <= c || a + c <= b || b + c <= a) {
      throw new Error(
        `These dimensions cannot form a valid triangle (${a}m, ${b}m, ${c}m). ` +
        `Triangle inequality violated.`
      );
    }

    // Place vertices using law of cosines
    // Place first vertex at origin, second along X-axis
    const v0: Point3D = { x: 0, y: 0, z: 0 };
    const v1: Point3D = { x: a, y: 0, z: 0 };

    // Calculate angle at v0 using law of cosines
    // c² = a² + b² - 2ab*cos(C)
    const cosAngle = (a * a + b * b - c * c) / (2 * a * b);
    const angle = Math.acos(cosAngle);

    // Place third vertex
    const v2: Point3D = {
      x: b * Math.cos(angle),
      y: b * Math.sin(angle),
      z: 0,
    };

    const vertices = [v0, v1, v2];

    // Center at origin
    const centeredVertices = this.centerVertices(vertices);

    // Calculate angles
    const angles = this.calculateAngles(centeredVertices);

    // Calculate area using Heron's formula
    const s = (a + b + c) / 2; // semi-perimeter
    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));

    // Check for warnings
    const warnings = this.checkAngleWarnings(angles);

    return {
      vertices: centeredVertices,
      angles,
      area,
      perimeter: a + b + c,
      warnings,
    };
  }

  /**
   * Reconstruct quadrilateral (4-sided shape)
   */
  private reconstructQuadrilateral(dimensions: number[]): ReconstructedShape {
    const [d1, d2, d3, d4] = dimensions;

    logger.info('[GeometryReconstructor] Reconstructing quadrilateral:', { d1, d2, d3, d4 });

    // Check if it's a rectangle (opposite sides equal within tolerance)
    const isRectangle =
      Math.abs(d1 - d3) < 0.1 && Math.abs(d2 - d4) < 0.1;

    if (isRectangle) {
      // Simple rectangle construction
      const width = (d1 + d3) / 2;
      const height = (d2 + d4) / 2;

      const vertices: Point3D[] = [
        { x: -width / 2, y: height / 2, z: 0 },   // Top-left
        { x: width / 2, y: height / 2, z: 0 },    // Top-right
        { x: width / 2, y: -height / 2, z: 0 },   // Bottom-right
        { x: -width / 2, y: -height / 2, z: 0 },  // Bottom-left
      ];

      return {
        vertices,
        angles: [90, 90, 90, 90],
        area: width * height,
        perimeter: 2 * (width + height),
        warnings: [],
      };
    } else {
      // Non-rectangular quadrilateral
      // Use iterative approach with equal angles as starting point
      return this.reconstructPolygon(dimensions);
    }
  }

  /**
   * Reconstruct arbitrary polygon from N dimensions
   */
  private reconstructPolygon(dimensions: number[]): ReconstructedShape {
    const n = dimensions.length;
    logger.info(`[GeometryReconstructor] Reconstructing ${n}-sided polygon`);

    // Calculate interior angle for regular polygon
    // This is our starting guess
    const regularAngle = ((n - 2) * 180) / n; // degrees
    const regularAngleRad = (regularAngle * Math.PI) / 180; // radians

    // Place vertices iteratively
    const vertices: Point3D[] = [];
    let currentPos = { x: 0, y: 0 };
    let currentAngle = 0; // Start pointing right (0°)

    // Place first vertex at origin
    vertices.push({ x: 0, y: 0, z: 0 });

    // Place subsequent vertices
    for (let i = 0; i < dimensions.length; i++) {
      const edgeLength = dimensions[i];

      // Move along current direction
      currentPos = {
        x: currentPos.x + edgeLength * Math.cos(currentAngle),
        y: currentPos.y + edgeLength * Math.sin(currentAngle),
      };

      // Add vertex (unless it's the last iteration, which should close)
      if (i < dimensions.length - 1) {
        vertices.push({ ...currentPos, z: 0 });
      }

      // Turn by exterior angle
      // For regular polygon: exterior angle = 360° / n
      const exteriorAngle = (2 * Math.PI) / n;
      currentAngle += exteriorAngle;
    }

    // Check closure error
    const closureError = Math.sqrt(currentPos.x ** 2 + currentPos.y ** 2);
    logger.info(`[GeometryReconstructor] Closure error: ${closureError.toFixed(4)}m`);

    if (closureError > CLOSURE_TOLERANCE) {
      // Polygon doesn't close properly
      const warnings: AngleWarning[] = [{
        corner: 0,
        angle: 0,
        severity: 'warning',
        message: `Shape doesn't close perfectly (gap: ${closureError.toFixed(2)}m). Dimensions may be inconsistent.`
      }];

      // Still return best-effort result
      const centeredVertices = this.centerVertices(vertices);
      const angles = this.calculateAngles(centeredVertices);
      const area = this.calculateArea(centeredVertices);

      return {
        vertices: centeredVertices,
        angles,
        area,
        perimeter: dimensions.reduce((sum, d) => sum + d, 0),
        warnings,
      };
    }

    // Center vertices
    const centeredVertices = this.centerVertices(vertices);

    // Calculate angles
    const angles = this.calculateAngles(centeredVertices);

    // Calculate area
    const area = this.calculateArea(centeredVertices);

    // Check for warnings
    const warnings = this.checkAngleWarnings(angles);

    return {
      vertices: centeredVertices,
      angles,
      area,
      perimeter: dimensions.reduce((sum, d) => sum + d, 0),
      warnings,
    };
  }

  /**
   * Calculate corner angles from vertices
   */
  private calculateAngles(vertices: Point3D[]): number[] {
    const angles: number[] = [];
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const prev = vertices[(i - 1 + n) % n];
      const current = vertices[i];
      const next = vertices[(i + 1) % n];

      // Vectors from current vertex
      const v1 = {
        x: prev.x - current.x,
        y: prev.y - current.y,
      };
      const v2 = {
        x: next.x - current.x,
        y: next.y - current.y,
      };

      // Calculate angle using dot product
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
      const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

      const cosAngle = dot / (mag1 * mag2);
      const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // Clamp for numerical stability
      const angleDeg = (angleRad * 180) / Math.PI;

      angles.push(angleDeg);
    }

    return angles;
  }

  /**
   * Calculate polygon area using shoelace formula
   */
  private calculateArea(vertices: Point3D[]): number {
    let area = 0;
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }

    return Math.abs(area) / 2;
  }

  /**
   * Center vertices at origin
   */
  private centerVertices(vertices: Point3D[]): Point3D[] {
    // Calculate centroid
    const centroid = {
      x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
      y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length,
    };

    // Translate to origin
    return vertices.map((v) => ({
      x: v.x - centroid.x,
      y: v.y - centroid.y,
      z: 0,
    }));
  }

  /**
   * Check for angle warnings
   */
  private checkAngleWarnings(angles: number[]): AngleWarning[] {
    const warnings: AngleWarning[] = [];

    angles.forEach((angle, index) => {
      if (angle < ANGLE_THRESHOLDS.acute) {
        warnings.push({
          corner: index + 1,
          angle,
          severity: 'warning',
          message: `Corner ${index + 1}: ${angle.toFixed(1)}° (very acute)`,
        });
      } else if (angle > ANGLE_THRESHOLDS.obtuse) {
        warnings.push({
          corner: index + 1,
          angle,
          severity: 'warning',
          message: `Corner ${index + 1}: ${angle.toFixed(1)}° (very obtuse)`,
        });
      }
    });

    return warnings;
  }

  /**
   * Validate area against provided value
   */
  validateArea(
    calculatedArea: number,
    providedArea: number,
    tolerance: number = 0.05 // 5%
  ): AreaValidation {
    const difference = Math.abs(calculatedArea - providedArea);
    const percentDiff = difference / providedArea;

    if (percentDiff <= tolerance) {
      return {
        status: 'valid',
        calculatedArea,
        providedArea,
        difference,
        percentDiff,
        message: `✓ ${(percentDiff * 100).toFixed(1)}% difference - acceptable`,
      };
    } else {
      return {
        status: 'mismatch',
        calculatedArea,
        providedArea,
        difference,
        percentDiff,
        message:
          `⚠️ Calculated area (${calculatedArea.toFixed(1)}m²) differs from provided area ` +
          `(${providedArea.toFixed(1)}m²) by ${(percentDiff * 100).toFixed(1)}%`,
      };
    }
  }

  /**
   * Validate dimension inputs
   */
  private validateDimensions(dimensions: number[]): void {
    if (dimensions.length < 3) {
      throw new Error('At least 3 dimensions required');
    }

    dimensions.forEach((dim, index) => {
      if (isNaN(dim) || dim <= 0) {
        throw new Error(`Invalid dimension at index ${index}: ${dim}`);
      }

      if (dim < MIN_DIMENSION) {
        throw new Error(
          `Dimension ${index + 1} too small: ${dim}m (minimum: ${MIN_DIMENSION}m)`
        );
      }

      if (dim > MAX_DIMENSION) {
        throw new Error(
          `Dimension ${index + 1} too large: ${dim}m (maximum: ${MAX_DIMENSION}m)`
        );
      }
    });

    // Check for very thin shapes
    const max = Math.max(...dimensions);
    const min = Math.min(...dimensions);
    const ratio = max / min;

    if (ratio > THIN_SHAPE_RATIO) {
      logger.warn(
        `[GeometryReconstructor] Very thin shape detected (${ratio.toFixed(0)}:1 ratio)`
      );
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton geometry reconstructor instance
 */
export const geometryReconstructor = new GeometryReconstructor();

/**
 * Export class for testing
 */
export default GeometryReconstructor;
