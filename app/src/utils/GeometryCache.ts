import { BufferGeometry, BufferAttribute } from 'three';
import type { Point2D, Shape } from '@/types';

/**
 * Geometry cache for efficient BufferGeometry reuse and management
 */
export class GeometryCache {
  private static cache = new Map<string, BufferGeometry>();
  private static maxCacheSize = 100;
  private static cacheHits = 0;
  private static cacheMisses = 0;

  /**
   * Generate cache key from shape data
   */
  private static generateCacheKey(type: string, points: Point2D[], metadata?: Record<string, unknown>): string {
    const pointsHash = points
      .map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)
      .join('|');
    
    const metadataHash = metadata ? JSON.stringify(metadata) : '';
    return `${type}_${pointsHash}_${metadataHash}`;
  }

  /**
   * Get or create geometry from cache
   */
  static getGeometry(shape: Shape, elevation = 0): BufferGeometry {
    if (!shape.points || shape.points.length < 2) {
      console.log('⚠️ GeometryCache: Invalid points for shape', shape.id);
      return new BufferGeometry();
    }

    // Check if shape was recently modified (within last 2 seconds) - bypass cache
    const now = new Date().getTime();
    const modifiedTime = shape.modified?.getTime?.() || 0;
    const isRecentlyModified = (now - modifiedTime) < 2000; // 2 seconds
    
    document.title = `CACHE CHECK: modified=${isRecentlyModified} time=${modifiedTime}`;
    
    if (isRecentlyModified) {
      console.log('🔥 GeometryCache: Shape', shape.id, 'recently modified, bypassing cache');
      document.title = `BYPASSING CACHE ${shape.id} ${Date.now()}`;
      this.cacheMisses++;
      return this.createGeometry(shape, elevation);
    }

    const cacheKey = this.generateCacheKey(
      shape.type, 
      shape.points, 
      { elevation, rotation: shape.rotation }
    );
    
    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      console.log('🎯 GeometryCache: Cache HIT for', shape.id, 'key:', cacheKey.substring(0, 50) + '...');
      // Return a clone to prevent shared state issues
      return this.cache.get(cacheKey)!.clone();
    }

    this.cacheMisses++;
    console.log('❌ GeometryCache: Cache MISS for', shape.id, 'key:', cacheKey.substring(0, 50) + '...');
    const geometry = this.createGeometry(shape, elevation);
    
    // Only cache if not recently modified
    if (!isRecentlyModified) {
      // Manage cache size
      if (this.cache.size >= this.maxCacheSize) {
        this.evictLRU();
      }
      
      this.cache.set(cacheKey, geometry.clone());
      console.log('💾 GeometryCache: Stored new geometry for', shape.id, 'cache size:', this.cache.size);
    } else {
      console.log('🚫 GeometryCache: Not caching recently modified shape', shape.id);
    }
    
    return geometry;
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
      case 'line':
        return this.createPolygonGeometry(shape.points, elevation, shape.type === 'line');
      default:
        return new BufferGeometry();
    }
  }

  /**
   * Create optimized rectangle geometry
   */
  private static createRectangleGeometry(points: Point2D[], elevation: number): BufferGeometry {
    console.log('🔵 createRectangleGeometry called with points:', JSON.stringify(points));
    document.title = `CREATE RECT GEOM: ${points.length}pts ${Date.now()}`;
    const geometry = new BufferGeometry();
    
    // Validate input points
    if (points.length < 2) {
      console.error('❌ Invalid rectangle points - need at least 2 points');
      return geometry;
    }
    
    // Handle both 2-point and 4-point rectangle formats
    let rectPoints: Point2D[];
    
    if (points.length === 2) {
      // Convert 2-point format to 4-point format
      const [p1, p2] = points;
      console.log('🔵 Converting 2-point to 4-point:', { p1, p2 });
      
      // Ensure we correctly identify topLeft and bottomRight regardless of drag direction
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
      console.log('🔵 Converted rectPoints (normalized):', JSON.stringify(rectPoints));
    } else if (points.length >= 4) {
      // Handle rectangles with 4+ points (may occur during live editing)
      rectPoints = points.slice(0, 4);
      console.log('🔵 Using 4-point format (truncated from', points.length, 'points):', JSON.stringify(rectPoints));
    } else {
      console.error('❌ Invalid rectangle points count:', points.length);
      rectPoints = points.slice(0, 4);
    }

    // Validate rectangle points are not degenerate
    const width = Math.abs(rectPoints[1].x - rectPoints[0].x);
    const height = Math.abs(rectPoints[3].y - rectPoints[0].y);
    
    if (width < 0.001 || height < 0.001) {
      console.warn('⚠️ Degenerate rectangle detected:', { width, height });
      // Return empty geometry for degenerate rectangles
      return geometry;
    }

    // Create vertices for fill
    const vertices: number[] = [];
    rectPoints.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    // Create indices for two triangles forming a proper rectangle
    // Triangle 1: bottom-left → bottom-right → top-right (0, 1, 2)
    // Triangle 2: bottom-left → top-right → top-left (0, 2, 3)  
    const indices = [0, 1, 2, 0, 2, 3];

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // Essential for Three.js raycasting - compute bounds for click detection
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    console.log('✅ Rectangle geometry created successfully with', vertices.length/3, 'vertices');
    return geometry;
  }

  /**
   * Create optimized circle geometry
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

    // Create triangular faces from center to perimeter
    for (let i = 1; i < points.length; i++) {
      indices.push(0, i, i + 1);
    }
    // Close the circle
    indices.push(0, points.length, 1);

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // Essential for Three.js raycasting - compute bounds for click detection
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }

  /**
   * Create polygon/line geometry
   */
  private static createPolygonGeometry(points: Point2D[], elevation: number, isLine = false): BufferGeometry {
    const geometry = new BufferGeometry();
    
    if (points.length < 2) return geometry;

    const vertices: number[] = [];
    const indices: number[] = [];

    // Add vertices
    points.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    // Create triangulated fill for both polygons and polylines with 3+ points
    // Only skip triangulation for true 2-point lines
    if (points.length >= 3) {
      // Use proper triangulation for polygons and polylines
      if (points.length === 3) {
        // Simple triangle
        indices.push(0, 1, 2);
      } else if (points.length === 4) {
        // Quadrilateral - create two triangles
        // Check if we should use diagonal 0-2 or 1-3
        const area1 = this.calculateTriangleArea(points[0], points[1], points[2]) + 
                     this.calculateTriangleArea(points[0], points[2], points[3]);
        const area2 = this.calculateTriangleArea(points[0], points[1], points[3]) + 
                     this.calculateTriangleArea(points[1], points[2], points[3]);
        
        if (Math.abs(area1) > Math.abs(area2)) {
          // Use diagonal 0-2
          indices.push(0, 1, 2, 0, 2, 3);
        } else {
          // Use diagonal 1-3
          indices.push(0, 1, 3, 1, 2, 3);
        }
      } else {
        // For polygons with 5+ points, use ear clipping triangulation
        const triangulatedIndices = this.triangulatePolygon(points);
        indices.push(...triangulatedIndices);
      }
      
      geometry.setIndex(indices);
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    
    if (indices.length > 0) {
      geometry.computeVertexNormals();
    }
    
    // Essential for Three.js raycasting - compute bounds for click detection
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }

  /**
   * Calculate center point of shape
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

  /**
   * Evict least recently used items from cache
   */
  private static evictLRU(): void {
    // Simple eviction: remove first (oldest) entries
    const keysToRemove = Array.from(this.cache.keys()).slice(0, 10);
    keysToRemove.forEach(key => {
      const geometry = this.cache.get(key);
      if (geometry) {
        geometry.dispose();
      }
      this.cache.delete(key);
    });
  }

  /**
   * Preload geometries for given shapes
   */
  static preloadShapes(shapes: Shape[], elevation = 0): void {
    shapes.forEach(shape => {
      this.getGeometry(shape, elevation);
    });
  }

  /**
   * Clear specific geometry from cache
   */
  static invalidateShape(shape: Shape, elevation = 0): void {
    console.log('🎯 Invalidating shape:', shape.id, 'type:', shape.type);
    
    // Generate all possible cache keys for this shape (different elevations, rotations)
    const baseKey = this.generateCacheKey(
      shape.type,
      shape.points || [],
      { elevation, rotation: shape.rotation }
    );
    
    // Also try to invalidate with different elevation and rotation values
    const keysToInvalidate = [];
    keysToInvalidate.push(baseKey);
    
    // Try common elevation values
    for (let elev = 0; elev <= 0.1; elev += 0.001) {
      const key = this.generateCacheKey(
        shape.type,
        shape.points || [],
        { elevation: elev, rotation: shape.rotation }
      );
      keysToInvalidate.push(key);
    }
    
    // Invalidate all matching keys
    let invalidatedCount = 0;
    keysToInvalidate.forEach(key => {
      const geometry = this.cache.get(key);
      if (geometry) {
        geometry.dispose();
        this.cache.delete(key);
        invalidatedCount++;
      }
    });
    
    console.log('🧹 Invalidated', invalidatedCount, 'cache entries for shape', shape.id);
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    const hitRate = this.cacheHits + this.cacheMisses > 0 
      ? (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(1)
      : '0';
    
    return {
      cacheSize: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Set maximum cache size
   */
  static setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
    
    // Trim cache if needed
    while (this.cache.size > this.maxCacheSize) {
      this.evictLRU();
    }
  }

  /**
   * Clear entire cache and dispose geometries
   */
  static dispose(): void {
    console.log('🧹 GeometryCache: Disposing entire cache, size:', this.cache.size);
    this.cache.forEach(geometry => {
      geometry.dispose();
    });
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('✅ GeometryCache: Cache cleared');
  }

  /**
   * Batch dispose of geometries by keys
   */
  static disposeByKeys(keys: string[]): void {
    keys.forEach(key => {
      const geometry = this.cache.get(key);
      if (geometry) {
        geometry.dispose();
        this.cache.delete(key);
      }
    });
  }

  /**
   * Calculate triangle area using cross product
   */
  private static calculateTriangleArea(p1: Point2D, p2: Point2D, p3: Point2D): number {
    return 0.5 * ((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y));
  }

  /**
   * Triangulate polygon using ear clipping algorithm
   */
  private static triangulatePolygon(points: Point2D[]): number[] {
    if (points.length < 3) return [];
    if (points.length === 3) return [0, 1, 2];

    const indices: number[] = [];
    const vertices = [...points];
    const vertexIndices = points.map((_, i) => i);

    // Remove ears iteratively
    while (vertexIndices.length > 3) {
      let earFound = false;

      for (let i = 0; i < vertexIndices.length; i++) {
        const prevIndex = (i - 1 + vertexIndices.length) % vertexIndices.length;
        const currIndex = i;
        const nextIndex = (i + 1) % vertexIndices.length;

        const prev = vertices[vertexIndices[prevIndex]];
        const curr = vertices[vertexIndices[currIndex]];
        const next = vertices[vertexIndices[nextIndex]];

        // Check if this forms a valid ear
        if (this.isEar(prev, curr, next, vertices, vertexIndices)) {
          // Add triangle to indices
          indices.push(
            vertexIndices[prevIndex],
            vertexIndices[currIndex],
            vertexIndices[nextIndex]
          );

          // Remove the ear vertex
          vertexIndices.splice(currIndex, 1);
          earFound = true;
          break;
        }
      }

      // Fallback: if no ear found, break to prevent infinite loop
      if (!earFound) {
        console.warn('⚠️ Could not triangulate polygon, using fallback triangulation');
        // Use simple fan triangulation as fallback
        for (let i = 1; i < vertexIndices.length - 1; i++) {
          indices.push(vertexIndices[0], vertexIndices[i], vertexIndices[i + 1]);
        }
        break;
      }
    }

    // Add the final triangle
    if (vertexIndices.length === 3) {
      indices.push(vertexIndices[0], vertexIndices[1], vertexIndices[2]);
    }

    return indices;
  }

  /**
   * Check if three consecutive vertices form an ear
   */
  private static isEar(prev: Point2D, curr: Point2D, next: Point2D, allVertices: Point2D[], vertexIndices: number[]): boolean {
    // Check if the angle is convex (cross product > 0 for counter-clockwise)
    const crossProduct = (curr.x - prev.x) * (next.y - prev.y) - (curr.y - prev.y) * (next.x - prev.x);
    if (crossProduct <= 0) return false; // Not convex

    // Check if any other vertex is inside this triangle
    for (const idx of vertexIndices) {
      const vertex = allVertices[idx];
      if (vertex === prev || vertex === curr || vertex === next) continue;

      if (this.isPointInTriangle(vertex, prev, curr, next)) {
        return false; // Another vertex is inside, not an ear
      }
    }

    return true;
  }

  /**
   * Check if point is inside triangle using barycentric coordinates
   */
  private static isPointInTriangle(point: Point2D, a: Point2D, b: Point2D, c: Point2D): boolean {
    const denom = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(denom) < 1e-10) return false; // Degenerate triangle

    const alpha = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denom;
    const beta = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denom;
    const gamma = 1 - alpha - beta;

    return alpha > 0 && beta > 0 && gamma > 0;
  }
}