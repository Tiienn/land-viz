import { BufferGeometry, BufferAttribute } from 'three';
import type { Point2D, Shape } from '@/types';
import { logger } from './logger';

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
   * Check if shape is in live resize mode (rapid point updates)
   */
  private static isInLiveResizeMode(shape: Shape): boolean {
    // Detect live resize by checking if points have very recent timestamps
    // or if modified time is within the last 100ms (indicating active resize)
    const now = new Date().getTime();
    const modifiedTime = shape.modified?.getTime?.() || 0;
    return (now - modifiedTime) < 100; // 100ms window for live operations
  }

  /**
   * ENHANCED: Create geometry specifically for live resize scenarios with liveResizePoints
   * This prevents diagonal line artifacts during rapid resize operations
   */
  static getLiveResizeGeometry(shape: Shape, liveResizePoints: Point2D[], elevation = 0): BufferGeometry {
    if (!liveResizePoints || liveResizePoints.length < 2) {
      logger.warn('⚠️ GeometryCache: Invalid liveResizePoints, falling back to shape points');
      return this.getGeometry(shape, elevation);
    }

    // CRITICAL: Always create fresh geometry for live resize to prevent artifacts
    logger.log('🔥 GeometryCache: Creating fresh geometry for live resize with', liveResizePoints.length, 'points');

    // ENHANCED VALIDATION: Pre-validate live resize points before creating geometry
    const validPoints = liveResizePoints.filter(point =>
      point &&
      typeof point.x === 'number' && typeof point.y === 'number' &&
      !isNaN(point.x) && !isNaN(point.y) &&
      isFinite(point.x) && isFinite(point.y)
    );

    if (validPoints.length < 2) {
      logger.error('❌ No valid points in live resize, using fallback');
      return this.createFallbackGeometry(elevation);
    }

    // RECTANGLE-SPECIFIC VALIDATION: Ensure proper bounds for rectangles
    if (shape.type === 'rectangle' && validPoints.length >= 2) {
      let minX, maxX, minY, maxY;

      if (validPoints.length === 2) {
        [minX, maxX] = [Math.min(validPoints[0].x, validPoints[1].x), Math.max(validPoints[0].x, validPoints[1].x)];
        [minY, maxY] = [Math.min(validPoints[0].y, validPoints[1].y), Math.max(validPoints[0].y, validPoints[1].y)];
      } else {
        const xCoords = validPoints.map(p => p.x);
        const yCoords = validPoints.map(p => p.y);
        minX = Math.min(...xCoords);
        maxX = Math.max(...xCoords);
        minY = Math.min(...yCoords);
        maxY = Math.max(...yCoords);
      }

      const width = maxX - minX;
      const height = maxY - minY;

      // CRITICAL: Prevent degenerate rectangles that cause diagonal line artifacts
      if (width < 0.001 || height < 0.001) {
        logger.warn('⚠️ Degenerate rectangle detected in live resize, using minimal geometry');
        return this.createMinimalRectangle({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, elevation);
      }

      // FORCE NORMALIZED ORDER: Always normalize rectangle points for consistent rendering
      // Using proper counter-clockwise winding for correct face normals
      const normalizedPoints = [
        { x: minX, y: minY }, // bottom-left (0)
        { x: maxX, y: minY }, // bottom-right (1)
        { x: maxX, y: maxY }, // top-right (2)
        { x: minX, y: maxY }  // top-left (3)
      ];

      logger.log('🎯 Normalized live resize points:', JSON.stringify(normalizedPoints));

      // Create geometry with normalized points and enhanced validation
      const liveShape: Shape = {
        ...shape,
        points: normalizedPoints,
        modified: new Date()
      };

      this.cacheMisses++;
      const geometry = this.createGeometry(liveShape, elevation);

      // ENHANCED VALIDATION: Comprehensive geometry validation before returning
      if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
        logger.warn('⚠️ Invalid geometry created for live resize, using fallback');
        return this.createFallbackGeometry(elevation);
      }

      // ADDITIONAL VALIDATION: Check for proper triangle count and indices
      if (!geometry.index || geometry.index.count !== 6) {
        logger.warn('⚠️ Invalid triangle indices in live resize geometry, using fallback');
        return this.createFallbackGeometry(elevation);
      }

      // VALIDATION: Ensure proper vertex count for rectangle (4 vertices)
      if (geometry.attributes.position.count !== 4) {
        logger.warn('⚠️ Invalid vertex count in live resize geometry, using fallback');
        return this.createFallbackGeometry(elevation);
      }

      logger.log('✅ Live resize geometry created successfully with', geometry.attributes.position.count, 'vertices');
      return geometry;
    }

    // For non-rectangle shapes, use standard approach
    const liveShape: Shape = {
      ...shape,
      points: validPoints,
      modified: new Date()
    };

    this.cacheMisses++;
    const geometry = this.createGeometry(liveShape, elevation);

    if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
      logger.warn('⚠️ Invalid geometry created for live resize, using fallback');
      return this.createFallbackGeometry(elevation);
    }

    logger.log('✅ Live resize geometry created successfully with', geometry.attributes.position.count, 'vertices');
    return geometry;
  }

  /**
   * Get or create geometry from cache
   */
  static getGeometry(shape: Shape, elevation = 0): BufferGeometry {
    if (!shape.points || shape.points.length < 2) {
      logger.warn('⚠️ GeometryCache: Invalid points for shape', shape.id);
      return this.createFallbackGeometry(elevation);
    }

    // Enhanced validation for live resize operations
    if (this.isInLiveResizeMode(shape)) {
      logger.log('🔥 GeometryCache: Live resize detected, creating fresh geometry');
      this.cacheMisses++;
      return this.createGeometry(shape, elevation);
    }

    // Check if shape was recently modified (within last 2 seconds) - bypass cache
    const now = new Date().getTime();
    const modifiedTime = shape.modified?.getTime?.() || 0;
    const isRecentlyModified = (now - modifiedTime) < 2000; // 2 seconds

    if (isRecentlyModified) {
      logger.log('🔥 GeometryCache: Shape', shape.id, 'recently modified, bypassing cache');
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
      logger.log('🎯 GeometryCache: Cache HIT for', shape.id, 'key:', cacheKey.substring(0, 50) + '...');
      // Return a clone to prevent shared state issues
      return this.cache.get(cacheKey)!.clone();
    }

    this.cacheMisses++;
    logger.log('❌ GeometryCache: Cache MISS for', shape.id, 'key:', cacheKey.substring(0, 50) + '...');
    const geometry = this.createGeometry(shape, elevation);
    
    // Only cache if not recently modified
    if (!isRecentlyModified) {
      // Manage cache size
      if (this.cache.size >= this.maxCacheSize) {
        this.evictLRU();
      }
      
      this.cache.set(cacheKey, geometry.clone());
      logger.log('💾 GeometryCache: Stored new geometry for', shape.id, 'cache size:', this.cache.size);
    } else {
      logger.log('🚫 GeometryCache: Not caching recently modified shape', shape.id);
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
      case 'polyline':
        return this.createPolygonGeometry(shape.points, elevation);
      default:
        return new BufferGeometry();
    }
  }

  /**
   * Create optimized rectangle geometry with enhanced validation and atomic updates
   */
  private static createRectangleGeometry(points: Point2D[], elevation: number): BufferGeometry {
    logger.log('🔵 createRectangleGeometry called with points:', JSON.stringify(points));
    
    // Create geometry with enhanced validation
    const geometry = new BufferGeometry();
    
    // CRITICAL FIX: Enhanced input validation with proper error handling
    if (!points || !Array.isArray(points) || points.length < 2) {
      logger.error('❌ Invalid rectangle points - need at least 2 valid points:', points);
      return this.createFallbackGeometry(elevation);
    }
    
    // Validate each point has valid coordinates
    const validPoints = points.filter(point => 
      point && typeof point.x === 'number' && typeof point.y === 'number' && 
      !isNaN(point.x) && !isNaN(point.y) && isFinite(point.x) && isFinite(point.y)
    );
    
    if (validPoints.length < 2) {
      logger.error('❌ No valid points found in rectangle data:', points);
      return this.createFallbackGeometry(elevation);
    }
    
    // CRITICAL FIX: Unified point format conversion with proper normalization
    let rectPoints: Point2D[];
    
    if (validPoints.length === 2) {
      // Convert 2-point format to 4-point format with proper ordering
      const [p1, p2] = validPoints;
      logger.log('🔵 Converting 2-point to 4-point:', { p1, p2 });
      
      // ENHANCED: Ensure correct point ordering regardless of drag direction
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      
      // Standard rectangle point order: bottom-left, bottom-right, top-right, top-left
      rectPoints = [
        { x: minX, y: minY }, // bottom-left (0)
        { x: maxX, y: minY }, // bottom-right (1)
        { x: maxX, y: maxY }, // top-right (2)
        { x: minX, y: maxY }  // top-left (3)
      ];
      logger.log('🔵 Converted rectPoints (normalized):', JSON.stringify(rectPoints));
    } else if (validPoints.length >= 4) {
      // Handle 4+ point format (live editing or polygon conversion)
      rectPoints = validPoints.slice(0, 4);
      logger.log('🔵 Using 4-point format (truncated from', validPoints.length, 'points):', JSON.stringify(rectPoints));
      
      // ENHANCED: Validate 4-point rectangle structure
      if (!this.validateRectangleStructure(rectPoints)) {
        logger.warn('⚠️ Invalid 4-point rectangle structure, normalizing...');
        rectPoints = this.normalizeRectanglePoints(rectPoints);
      }
    } else {
      // Invalid point count - create minimal rectangle
      logger.warn('⚠️ Invalid rectangle points count:', validPoints.length, '- creating minimal rectangle');
      const point = validPoints[0];
      rectPoints = [
        { x: point.x, y: point.y },
        { x: point.x + 1, y: point.y },
        { x: point.x + 1, y: point.y + 1 },
        { x: point.x, y: point.y + 1 }
      ];
    }

    // CRITICAL FIX: Enhanced degenerate rectangle detection with area validation
    const width = Math.abs(rectPoints[1].x - rectPoints[0].x);
    const height = Math.abs(rectPoints[3].y - rectPoints[0].y);
    const area = width * height;

    if (width < 0.001 || height < 0.001 || area < 0.000001) {
      logger.warn('⚠️ Degenerate rectangle detected:', { width, height, area });
      // Return minimal valid geometry instead of empty geometry
      return this.createMinimalRectangle(rectPoints[0] || { x: 0, y: 0 }, elevation);
    }

    // ENHANCED: Validate point ordering to prevent triangle artifacts
    const validatedPoints = this.validateAndNormalizeRectanglePoints(rectPoints);
    if (!validatedPoints) {
      logger.error('❌ Failed to validate rectangle points, using fallback');
      return this.createFallbackGeometry(elevation);
    }

    // ATOMIC UPDATE: Create all geometry data atomically with validated points
    const vertices: number[] = [];
    validatedPoints.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    logger.log('🔵 Final vertices array:', vertices);
    logger.log('🔵 validatedPoints for vertices:', JSON.stringify(validatedPoints));

    // CRITICAL FIX: Create proper triangle indices with consistent counter-clockwise winding
    // Rectangle vertices: 0=bottom-left, 1=bottom-right, 2=top-right, 3=top-left
    // Triangle 1: (0,1,2) - bottom-left → bottom-right → top-right
    // Triangle 2: (0,2,3) - bottom-left → top-right → top-left
    // This ensures proper face normals and prevents diagonal line artifacts
    const indices = [0, 1, 2, 0, 2, 3];
    logger.log('🔵 Triangle indices:', indices);

    // ATOMIC UPDATE: Apply all attributes in single operation
    try {
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      
      // Essential for Three.js raycasting - compute bounds for click detection
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      
      logger.log('✅ Rectangle geometry created successfully with', vertices.length/3, 'vertices');
    } catch (error) {
      logger.error('❌ Failed to create rectangle geometry:', error);
      return this.createFallbackGeometry(elevation);
    }

    return geometry;
  }
  
  /**
   * Create fallback geometry for error cases with proper rectangle structure
   */
  private static createFallbackGeometry(elevation: number): BufferGeometry {
    const geometry = new BufferGeometry();

    // Create a minimal valid rectangle centered at origin
    const size = 0.1;
    const vertices = new Float32Array([
      -size, elevation, -size, // bottom-left (0)
       size, elevation, -size, // bottom-right (1)
       size, elevation,  size, // top-right (2)
      -size, elevation,  size  // top-left (3)
    ]);

    // Use same triangle indices as main geometry for consistency
    const indices = [0, 1, 2, 0, 2, 3];

    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    logger.log('🛡️ Fallback geometry created with consistent triangle indices');
    return geometry;
  }
  
  /**
   * Create minimal rectangle geometry for degenerate cases with proper triangle indices
   */
  private static createMinimalRectangle(center: Point2D, elevation: number): BufferGeometry {
    const size = 0.1; // Minimal visible size

    // Create points in proper counter-clockwise order
    const rectPoints = [
      { x: center.x - size, y: center.y - size }, // bottom-left (0)
      { x: center.x + size, y: center.y - size }, // bottom-right (1)
      { x: center.x + size, y: center.y + size }, // top-right (2)
      { x: center.x - size, y: center.y + size }  // top-left (3)
    ];

    const geometry = new BufferGeometry();
    const vertices: number[] = [];
    rectPoints.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    // CONSISTENT INDICES: Use same triangle indices as main geometry
    const indices = [0, 1, 2, 0, 2, 3];
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    logger.log('🔧 Minimal rectangle created with consistent triangle indices');
    return geometry;
  }
  
  /**
   * Validate and normalize rectangle points to prevent rendering artifacts
   */
  private static validateAndNormalizeRectanglePoints(points: Point2D[]): Point2D[] | null {
    if (!points || points.length !== 4) {
      logger.error('❌ Invalid point count for rectangle:', points?.length || 0);
      return null;
    }

    // Check for valid numeric coordinates
    const validPoints = points.filter(point =>
      point &&
      typeof point.x === 'number' && typeof point.y === 'number' &&
      !isNaN(point.x) && !isNaN(point.y) &&
      isFinite(point.x) && isFinite(point.y)
    );

    if (validPoints.length !== 4) {
      logger.error('❌ Invalid coordinates in rectangle points');
      return null;
    }

    // Normalize to consistent ordering: bottom-left, bottom-right, top-right, top-left
    const minX = Math.min(...validPoints.map(p => p.x));
    const maxX = Math.max(...validPoints.map(p => p.x));
    const minY = Math.min(...validPoints.map(p => p.y));
    const maxY = Math.max(...validPoints.map(p => p.y));

    // Ensure minimum size to prevent degenerate triangles
    const deltaX = maxX - minX;
    const deltaY = maxY - minY;

    if (deltaX < 0.001 || deltaY < 0.001) {
      logger.warn('⚠️ Rectangle too small during validation:', { deltaX, deltaY });
      return null;
    }

    // CRITICAL FIX: Return normalized rectangle points with proper counter-clockwise ordering
    // This ordering ensures correct triangle winding and prevents diagonal line artifacts
    const normalizedPoints = [
      { x: minX, y: minY }, // bottom-left (0)
      { x: maxX, y: minY }, // bottom-right (1)
      { x: maxX, y: maxY }, // top-right (2)
      { x: minX, y: maxY }  // top-left (3)
    ];

    // VALIDATION: Double-check the points form a proper rectangle
    const area = deltaX * deltaY;
    if (area < 0.000001) {
      logger.warn('⚠️ Rectangle area too small during validation:', { area, deltaX, deltaY });
      return null;
    }

    logger.log('✅ Rectangle validation successful:', {
      deltaX: deltaX.toFixed(3),
      deltaY: deltaY.toFixed(3),
      area: area.toFixed(6),
      points: normalizedPoints.map(p => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(',')
    });

    return normalizedPoints;
  }

  /**
   * Validate rectangle structure integrity
   */
  private static validateRectangleStructure(points: Point2D[]): boolean {
    if (points.length !== 4) return false;

    // Basic validation: check if we have distinct points
    const tolerance = 0.001;
    const distinctPoints = points.filter((point, index) =>
      !points.slice(0, index).some(otherPoint =>
        Math.abs(point.x - otherPoint.x) < tolerance &&
        Math.abs(point.y - otherPoint.y) < tolerance
      )
    );
    
    return distinctPoints.length >= 3; // At least 3 distinct points for a valid shape
  }
  
  /**
   * Normalize rectangle points to standard format
   */
  private static normalizeRectanglePoints(points: Point2D[]): Point2D[] {
    if (points.length < 2) return points;
    
    // Find bounding box
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    
    // Return normalized rectangle
    return [
      { x: minX, y: minY }, // bottom-left
      { x: maxX, y: minY }, // bottom-right
      { x: maxX, y: maxY }, // top-right
      { x: minX, y: maxY }  // top-left
    ];
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
  private static createPolygonGeometry(points: Point2D[], elevation: number): BufferGeometry {
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
    logger.log('🎯 Invalidating shape:', shape.id, 'type:', shape.type);
    
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
    
    logger.log('🧹 Invalidated', invalidatedCount, 'cache entries for shape', shape.id);
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
    logger.log('🧹 GeometryCache: Disposing entire cache, size:', this.cache.size);
    this.cache.forEach(geometry => {
      geometry.dispose();
    });
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    logger.log('✅ GeometryCache: Cache cleared');
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
        logger.warn('⚠️ Could not triangulate polygon, using fallback triangulation');
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