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
    
    // Manage cache size
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }
    
    this.cache.set(cacheKey, geometry.clone());
    console.log('💾 GeometryCache: Stored new geometry for', shape.id, 'cache size:', this.cache.size);
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
    const geometry = new BufferGeometry();
    
    // Handle both 2-point and 4-point rectangle formats
    let rectPoints: Point2D[];
    
    if (points.length === 2) {
      // Convert 2-point format to 4-point format
      const [topLeft, bottomRight] = points;
      rectPoints = [
        { x: topLeft.x, y: topLeft.y },
        { x: bottomRight.x, y: topLeft.y },
        { x: bottomRight.x, y: bottomRight.y },
        { x: topLeft.x, y: bottomRight.y }
      ];
    } else {
      rectPoints = points.slice(0, 4);
    }

    // Create vertices for fill
    const vertices: number[] = [];
    rectPoints.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    // Create indices for two triangles
    const indices = [0, 1, 2, 0, 2, 3];

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

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

    if (!isLine && points.length >= 3) {
      // For filled polygons, use fan triangulation
      for (let i = 1; i < points.length - 1; i++) {
        indices.push(0, i, i + 1);
      }
      
      geometry.setIndex(indices);
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    
    if (indices.length > 0) {
      geometry.computeVertexNormals();
    }

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
    const cacheKey = this.generateCacheKey(
      shape.type,
      shape.points || [],
      { elevation, rotation: shape.rotation }
    );
    
    const geometry = this.cache.get(cacheKey);
    if (geometry) {
      geometry.dispose();
      this.cache.delete(cacheKey);
    }
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
}