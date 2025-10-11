import { BufferGeometry, BufferAttribute } from 'three';
import type { Point2D, Shape } from '@/types';
import { logger } from './logger';
import earcut from 'earcut';

/**
 * Simplified geometry cache - removed complex caching logic for easier debugging
 */
export class GeometryCache {
  /**
   * Create geometry for live resize scenarios with liveResizePoints
   */
  static getLiveResizeGeometry(shape: Shape, liveResizePoints: Point2D[], elevation = 0): BufferGeometry {
    if (!liveResizePoints || liveResizePoints.length < 2) {
      logger.warn('⚠️ GeometryCache: Invalid liveResizePoints, falling back to shape points');
      return this.getGeometry(shape, elevation);
    }


    // Validate points
    const validPoints = liveResizePoints.filter(point =>
      point &&
      typeof point.x === 'number' && typeof point.y === 'number' &&
      !isNaN(point.x) && !isNaN(point.y) &&
      isFinite(point.x) && isFinite(point.y)
    );

    if (validPoints.length < 2) {
      logger.error('❌ No valid points in live resize');
      return this.createFallbackGeometry(elevation);
    }

    // Create temporary shape with live points
    const liveShape: Shape = {
      ...shape,
      points: validPoints,
      modified: new Date()
    };

    return this.createGeometry(liveShape, elevation);
  }

  /**
   * Get geometry - simplified, no caching
   */
  static getGeometry(shape: Shape, elevation = 0): BufferGeometry {
    if (!shape.points || shape.points.length < 2) {
      logger.warn('⚠️ GeometryCache: Invalid points for shape', shape.id);
      return this.createFallbackGeometry(elevation);
    }

    return this.createGeometry(shape, elevation);
  }

  /**
   * Create geometry based on shape type
   */
  private static createGeometry(shape: Shape, elevation: number): BufferGeometry {
    switch (shape.type) {
      case 'rectangle':
        return this.createRectangleGeometry(shape.points, elevation);
      case 'circle':
        return this.createCircleGeometry(shape.points, elevation);
      case 'polygon':
      case 'polyline':
      case 'line':
        return this.createPolygonGeometry(shape.points, elevation);
      default:
        return new BufferGeometry();
    }
  }

  /**
   * Create rectangle geometry - simplified
   */
  private static createRectangleGeometry(points: Point2D[], elevation: number): BufferGeometry {

    const geometry = new BufferGeometry();

    if (!points || points.length < 2) {
      logger.error('❌ Invalid rectangle points');
      return this.createFallbackGeometry(elevation);
    }

    // Validate points
    const validPoints = points.filter(point =>
      point && typeof point.x === 'number' && typeof point.y === 'number' &&
      !isNaN(point.x) && !isNaN(point.y) && isFinite(point.x) && isFinite(point.y)
    );

    if (validPoints.length < 2) {
      logger.error('❌ No valid points found');
      return this.createFallbackGeometry(elevation);
    }

    // Convert to 4-point rectangle
    let rectPoints: Point2D[];

    if (validPoints.length === 2) {
      const [p1, p2] = validPoints;
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      rectPoints = [
        { x: minX, y: minY }, // bottom-left
        { x: maxX, y: minY }, // bottom-right
        { x: maxX, y: maxY }, // top-right
        { x: minX, y: maxY }  // top-left
      ];
    } else {
      rectPoints = validPoints.slice(0, 4);
    }

    // Check for degenerate rectangle - use proper calculation for both 2-point and 4-point formats
    const xCoords = rectPoints.map(p => p.x);
    const yCoords = rectPoints.map(p => p.y);
    const width = Math.max(...xCoords) - Math.min(...xCoords);
    const height = Math.max(...yCoords) - Math.min(...yCoords);

    if (width < 0.001 || height < 0.001) {
      logger.warn('⚠️ Degenerate rectangle detected');
      return this.createFallbackGeometry(elevation);
    }

    // Create vertices - ensure we have exactly 4 points
    if (rectPoints.length !== 4) {
      logger.error('❌ Rectangle must have exactly 4 points, got:', rectPoints.length);
      return this.createFallbackGeometry(elevation);
    }

    const vertices: number[] = [];
    rectPoints.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    // Create triangle indices - two triangles forming a rectangle
    // Triangle 1: bottom-left, bottom-right, top-right (0, 1, 2)
    // Triangle 2: bottom-left, top-right, top-left (0, 2, 3)
    const indices = [0, 1, 2, 0, 2, 3];

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }

  /**
   * Create fallback geometry
   */
  private static createFallbackGeometry(elevation: number): BufferGeometry {
    const geometry = new BufferGeometry();
    const size = 0.1;

    const vertices = new Float32Array([
      -size, elevation, -size, // bottom-left
       size, elevation, -size, // bottom-right
       size, elevation,  size, // top-right
      -size, elevation,  size  // top-left
    ]);

    const indices = [0, 1, 2, 0, 2, 3];

    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }

  /**
   * Create circle geometry
   */
  private static createCircleGeometry(points: Point2D[], elevation: number): BufferGeometry {
    const geometry = new BufferGeometry();

    if (points.length < 2) {
      logger.warn('⚠️ Circle needs at least 2 points (center and edge)');
      return this.createFallbackGeometry(elevation);
    }

    const vertices: number[] = [];
    const indices: number[] = [];

    // Handle 2-point format: [center, edge] -> generate circle perimeter
    let circlePoints: Point2D[];
    let center: Point2D;

    if (points.length === 2) {
      // Circle stored as [center, edge point]
      center = points[0];
      const edgePoint = points[1];
      const radius = Math.sqrt(
        Math.pow(edgePoint.x - center.x, 2) + Math.pow(edgePoint.y - center.y, 2)
      );

      // Generate circle perimeter points
      circlePoints = [];
      const segments = Math.max(32, Math.min(64, Math.floor(radius * 4))); // Adaptive segments

      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        circlePoints.push({
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        });
      }
    } else {
      // Circle with pre-generated points
      circlePoints = points;
      center = this.calculateCenter(points);
    }

    // Add center vertex
    vertices.push(center.x, elevation, center.y);

    // Add perimeter vertices
    circlePoints.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    // Create triangular faces (fan triangulation from center)
    for (let i = 1; i < circlePoints.length; i++) {
      indices.push(0, i, i + 1);
    }
    // Close the circle
    indices.push(0, circlePoints.length, 1);

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }

  /**
   * Create polygon geometry using Earcut triangulation
   *
   * Earcut handles both convex and concave polygons correctly,
   * making it perfect for imported site plan boundaries.
   */
  private static createPolygonGeometry(points: Point2D[], elevation: number): BufferGeometry {
    const geometry = new BufferGeometry();

    if (points.length < 2) return geometry;

    logger.info(`[GeometryCache] Creating polygon geometry with ${points.length} points`);
    logger.info(`[GeometryCache] Points:`, JSON.stringify(points));

    const vertices: number[] = [];

    // Add vertices for rendering (3D with elevation)
    points.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    logger.info(`[GeometryCache] Created ${vertices.length / 3} vertices`);

    // Create triangles for 3+ points
    let indices: number[] = [];

    if (points.length >= 3) {
      if (points.length === 3) {
        // Triangle - simple case
        indices.push(0, 1, 2);
        logger.info(`[GeometryCache] Triangle: using direct indices`);
      } else {
        // 4+ points: Use Earcut for robust triangulation
        // Earcut requires flat array of [x, y, x, y, ...]
        const flatCoords: number[] = [];
        points.forEach(point => {
          flatCoords.push(point.x, point.y);
        });

        logger.info(`[GeometryCache] Using Earcut triangulation for ${points.length}-point polygon`);

        try {
          // Earcut returns indices for the triangulation
          indices = earcut(flatCoords);
          logger.info(`[GeometryCache] Earcut created ${indices.length / 3} triangles`);
        } catch (error) {
          logger.error(`[GeometryCache] Earcut triangulation failed:`, error);

          // Fallback to simple fan triangulation
          logger.warn(`[GeometryCache] Falling back to fan triangulation`);
          for (let i = 1; i < points.length - 1; i++) {
            indices.push(0, i, i + 1);
          }
        }
      }

      geometry.setIndex(indices);
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));

    if (indices.length > 0) {
      geometry.computeVertexNormals();
    }

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    logger.info(`[GeometryCache] Polygon geometry created successfully with ${indices.length / 3} triangles`);

    return geometry;
  }

  /**
   * Calculate center point
   */
  private static calculateCenter(points: Point2D[]): Point2D {
    const sum = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  // Simplified cache methods - no actual caching for now
  static invalidateShape(shape: Shape, elevation = 0): void {
    logger.log('🎯 Shape invalidated:', shape.id);
  }

  static getStats() {
    return {
      cacheSize: 0,
      maxSize: 0,
      hits: 0,
      misses: 0,
      hitRate: '0%'
    };
  }

  static setMaxCacheSize(size: number): void {
    // No-op for simplified version
  }

  static dispose(): void {
    logger.log('🧹 GeometryCache: Dispose called');
  }

  static disposeByKeys(keys: string[]): void {
    // No-op for simplified version
  }

  static preloadShapes(shapes: Shape[], elevation = 0): void {
    // No-op for simplified version
  }
}