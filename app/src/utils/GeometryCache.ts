import { BufferGeometry, BufferAttribute } from 'three';
import type { Point2D, Shape } from '@/types';
import { logger } from './logger';

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

    if (points.length < 3) return geometry;

    const vertices: number[] = [];
    const indices: number[] = [];

    // Add center vertex
    const center = this.calculateCenter(points);
    vertices.push(center.x, elevation, center.y);

    // Add perimeter vertices
    points.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    // Create triangular faces
    for (let i = 1; i < points.length; i++) {
      indices.push(0, i, i + 1);
    }
    indices.push(0, points.length, 1);

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }

  /**
   * Create polygon geometry
   */
  private static createPolygonGeometry(points: Point2D[], elevation: number): BufferGeometry {
    const geometry = new BufferGeometry();

    if (points.length < 2) return geometry;

    const vertices: number[] = [];
    const indices: number[] = [];

    // Add vertices
    points.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    // Create triangles for 3+ points
    if (points.length >= 3) {
      if (points.length === 3) {
        indices.push(0, 1, 2);
      } else if (points.length === 4) {
        indices.push(0, 1, 2, 0, 2, 3);
      } else {
        // Simple fan triangulation for 5+ points
        for (let i = 1; i < points.length - 1; i++) {
          indices.push(0, i, i + 1);
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