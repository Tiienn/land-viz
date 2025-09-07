/**
 * Professional CAD-style snap detection service for Land Visualizer
 * Provides accurate geometric snapping for professional precision
 */

import type { Point2D, Shape, SnapPoint, SnapConfig, SnapType } from '../types';

// Temporary local GridConfig interface until import issue is resolved
interface GridConfig {
  enabled: boolean;
  primarySpacing: number;
  secondarySpacing: number;
  origin: { x: number; y: number };
}

export class SnapService {
  private shapeSnapCache = new Map<string, SnapPoint[]>();
  private gridSnapCache = new Map<string, SnapPoint[]>();

  /**
   * Detect all available snap points within tolerance of cursor
   */
  detectSnapPoints(cursor: Point2D, shapes: Shape[], config: SnapConfig, gridConfig: GridConfig): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];

    // Get grid snap points if enabled
    if (config.activeTypes.has('grid')) {
      const gridSnaps = this.getGridSnapPoints(cursor, gridConfig, config.snapRadius);
      snapPoints.push(...gridSnaps);
    }

    // Get shape snap points if any shape types are enabled
    const shapeSnaps = this.getShapeSnapPoints(shapes, cursor, config);
    snapPoints.push(...shapeSnaps);

    // Filter by distance tolerance
    return snapPoints.filter(snap => 
      this.calculateDistance(cursor, snap.position) <= config.snapRadius
    );
  }

  /**
   * Find the best snap point from available options
   */
  findBestSnapPoint(cursor: Point2D, availableSnaps: SnapPoint[]): SnapPoint | null {
    if (availableSnaps.length === 0) return null;

    // Sort by snap strength (higher is better) and distance (lower is better)
    const sortedSnaps = availableSnaps.sort((a, b) => {
      const strengthDiff = b.strength - a.strength;
      if (Math.abs(strengthDiff) > 0.1) return strengthDiff;
      
      const distanceA = this.calculateDistance(cursor, a.position);
      const distanceB = this.calculateDistance(cursor, b.position);
      return distanceA - distanceB;
    });

    return sortedSnaps[0];
  }

  /**
   * Calculate snap strength based on distance and snap type priority
   */
  calculateSnapStrength(distance: number, tolerance: number, snapType: SnapType): number {
    // Base strength from inverse distance (closer = stronger)
    const distanceStrength = Math.max(0, 1 - (distance / tolerance));
    
    // Type priority multiplier
    const typePriority = {
      'endpoint': 1.0,
      'grid': 0.9,
      'midpoint': 0.8,
      'center': 0.7,
      'intersection': 0.6,
      'perpendicular': 0.5,
      'extension': 0.4,
      'tangent': 0.4,
      'quadrant': 0.8,
      'edge': 0.5
    };

    return distanceStrength * (typePriority[snapType] || 0.5);
  }

  /**
   * Get grid intersection snap points near cursor (performance optimized)
   */
  getGridSnapPoints(cursor: Point2D, gridConfig: GridConfig, tolerance: number): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];

    if (!gridConfig.enabled) return snapPoints;
    
    // Performance optimization: limit grid search area
    const maxGridPoints = 9; // 3x3 grid around cursor

    // Use primary grid spacing for snapping
    const spacing = gridConfig.primarySpacing;
    
    // Performance optimized: Only check nearest 3x3 grid area
    const centerGridX = Math.round(cursor.x / spacing);
    const centerGridY = Math.round(cursor.y / spacing);
    
    let pointCount = 0;
    for (let offsetX = -1; offsetX <= 1 && pointCount < maxGridPoints; offsetX++) {
      for (let offsetY = -1; offsetY <= 1 && pointCount < maxGridPoints; offsetY++) {
        const x = (centerGridX + offsetX) * spacing;
        const y = (centerGridY + offsetY) * spacing;
        const gridPoint: Point2D = { x, y };
        const distance = this.calculateDistance(cursor, gridPoint);
        
        if (distance <= tolerance) {
          snapPoints.push({
            id: `grid_${x}_${y}`,
            type: 'grid',
            position: gridPoint,
            strength: this.calculateSnapStrength(distance, tolerance, 'grid'),
            metadata: {
              description: `Grid intersection at (${x}, ${y})`,
              gridX: x / spacing,
              gridY: y / spacing,
              spacing
            }
          });
          pointCount++;
        }
      }
    }

    return snapPoints;
  }

  /**
   * Get shape-based snap points (endpoints, midpoints, centers)
   */
  getShapeSnapPoints(shapes: Shape[], cursor: Point2D, config: SnapConfig): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];

    for (const shape of shapes) {
      const shapeId = shape.id;
      
      // Check cache first
      const cacheKey = `${shapeId}_${shape.points.length}`;
      let shapeSnaps = this.shapeSnapCache.get(cacheKey);
      
      if (!shapeSnaps) {
        shapeSnaps = this.calculateShapeSnapPoints(shape);
        this.shapeSnapCache.set(cacheKey, shapeSnaps);
      }

      // Filter by enabled snap types and tolerance
      for (const snap of shapeSnaps) {
        const distance = this.calculateDistance(cursor, snap.position);
        
        if (distance <= config.snapRadius) {
          const shouldInclude = config.activeTypes.has(snap.type);

          if (shouldInclude) {
            snapPoints.push({
              ...snap,
              strength: this.calculateSnapStrength(distance, config.snapRadius, snap.type)
            });
          }
        }
      }
    }

    return snapPoints;
  }

  /**
   * Calculate all snap points for a single shape
   */
  private calculateShapeSnapPoints(shape: Shape): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    switch (shape.type) {
      case 'rectangle':
        snapPoints.push(...this.getRectangleSnapPoints(shape));
        break;
      case 'circle':
        snapPoints.push(...this.getCircleSnapPoints(shape));
        break;
      case 'line': // polyline
        snapPoints.push(...this.getPolylineSnapPoints(shape));
        break;
      case 'polygon':
        snapPoints.push(...this.getPolygonSnapPoints(shape));
        break;
    }

    return snapPoints;
  }

  /**
   * Get snap points for rectangle shapes
   */
  private getRectangleSnapPoints(shape: Shape): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (shape.points.length < 2) return snapPoints;

    // Support both 2-point and 4-point rectangle formats
    let corners: Point2D[];
    if (shape.points.length === 2) {
      const [p1, p2] = shape.points;
      corners = [
        p1,
        { x: p2.x, y: p1.y },
        p2,
        { x: p1.x, y: p2.y }
      ];
    } else {
      corners = shape.points.slice(0, 4);
    }

    // Endpoint snaps (corners)
    corners.forEach((corner, index) => {
      snapPoints.push({
        id: `${shape.id}_corner_${index}`,
        position: corner,
        type: 'endpoint',
        strength: 1.0,
        metadata: {
          description: `Rectangle corner ${index + 1}`,
          shapeId: shape.id,
          shapeType: shape.type,
          cornerIndex: index
        }
      });
    });

    // Midpoint snaps (edge centers)
    for (let i = 0; i < corners.length; i++) {
      const current = corners[i];
      const next = corners[(i + 1) % corners.length];
      const midpoint = this.calculateMidpoint(current, next);
      
      snapPoints.push({
        id: `${shape.id}_edge_${i}`,
        position: midpoint,
        type: 'midpoint',
        strength: 0.8,
        metadata: {
          description: `Rectangle edge ${i + 1} midpoint`,
          shapeId: shape.id,
          shapeType: shape.type,
          edgeIndex: i
        }
      });
    }

    // Center snap
    const center = this.calculatePolygonCenter(corners);
    snapPoints.push({
      id: `${shape.id}_center`,
      position: center,
      type: 'center',
      strength: 0.7,
      metadata: {
        description: 'Rectangle center',
        shapeId: shape.id,
        shapeType: shape.type
      }
    });

    return snapPoints;
  }

  /**
   * Get snap points for circle shapes
   */
  private getCircleSnapPoints(shape: Shape): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (shape.points.length < 2) return snapPoints;

    const [center, radiusPoint] = shape.points;
    const radius = this.calculateDistance(center, radiusPoint);

    // Center snap
    snapPoints.push({
      id: `${shape.id}_center`,
      position: center,
      type: 'center',
      strength: 1.0,
      metadata: {
        description: 'Circle center',
        shapeId: shape.id,
        shapeType: shape.type,
        radius
      }
    });

    // Quadrant points (N, E, S, W)
    const quadrants = [
      { x: center.x, y: center.y + radius }, // North
      { x: center.x + radius, y: center.y }, // East
      { x: center.x, y: center.y - radius }, // South
      { x: center.x - radius, y: center.y }  // West
    ];

    quadrants.forEach((point, index) => {
      const directions = ['north', 'east', 'south', 'west'];
      snapPoints.push({
        id: `${shape.id}_quad_${index}`,
        position: point,
        type: 'quadrant',
        strength: 0.9,
        metadata: {
          description: `Circle ${directions[index]} quadrant`,
          shapeId: shape.id,
          shapeType: shape.type,
          quadrant: directions[index],
          angle: index * 90
        }
      });
    });

    return snapPoints;
  }

  /**
   * Get snap points for polyline shapes
   */
  private getPolylineSnapPoints(shape: Shape): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (shape.points.length < 2) return snapPoints;

    // Endpoint snaps (vertices)
    shape.points.forEach((point, index) => {
      snapPoints.push({
        id: `${shape.id}_vertex_${index}`,
        position: point,
        type: 'endpoint',
        strength: 1.0,
        metadata: {
          description: `Polyline vertex ${index + 1}`,
          shapeId: shape.id,
          shapeType: shape.type,
          vertexIndex: index
        }
      });
    });

    // Midpoint snaps (segment centers)
    for (let i = 0; i < shape.points.length - 1; i++) {
      const current = shape.points[i];
      const next = shape.points[i + 1];
      const midpoint = this.calculateMidpoint(current, next);
      
      snapPoints.push({
        id: `${shape.id}_segment_${i}`,
        position: midpoint,
        type: 'midpoint',
        strength: 0.8,
        metadata: {
          description: `Polyline segment ${i + 1} midpoint`,
          shapeId: shape.id,
          shapeType: shape.type,
          segmentIndex: i
        }
      });
    }

    return snapPoints;
  }

  /**
   * Get snap points for polygon shapes
   */
  private getPolygonSnapPoints(shape: Shape): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (shape.points.length < 3) return snapPoints;

    // Endpoint snaps (vertices)
    shape.points.forEach((point, index) => {
      snapPoints.push({
        id: `${shape.id}_vertex_${index}`,
        position: point,
        type: 'endpoint',
        strength: 1.0,
        metadata: {
          description: `Polygon vertex ${index + 1}`,
          shapeId: shape.id,
          shapeType: shape.type,
          vertexIndex: index
        }
      });
    });

    // Midpoint snaps (edge centers)
    for (let i = 0; i < shape.points.length; i++) {
      const current = shape.points[i];
      const next = shape.points[(i + 1) % shape.points.length];
      const midpoint = this.calculateMidpoint(current, next);
      
      snapPoints.push({
        id: `${shape.id}_edge_${i}`,
        position: midpoint,
        type: 'midpoint',
        strength: 0.8,
        metadata: {
          description: `Polygon edge ${i + 1} midpoint`,
          shapeId: shape.id,
          shapeType: shape.type,
          edgeIndex: i
        }
      });
    }

    // Center snap (geometric centroid)
    const center = this.calculatePolygonCenter(shape.points);
    snapPoints.push({
      id: `${shape.id}_center`,
      position: center,
      type: 'center',
      strength: 0.7,
      metadata: {
        description: 'Polygon center',
        shapeId: shape.id,
        shapeType: shape.type
      }
    });

    return snapPoints;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(p1: Point2D, p2: Point2D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate midpoint between two points
   */
  private calculateMidpoint(p1: Point2D, p2: Point2D): Point2D {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }

  /**
   * Calculate geometric center of a polygon
   */
  private calculatePolygonCenter(points: Point2D[]): Point2D {
    if (points.length === 0) return { x: 0, y: 0 };
    
    let totalX = 0;
    let totalY = 0;
    
    for (const point of points) {
      totalX += point.x;
      totalY += point.y;
    }
    
    return {
      x: totalX / points.length,
      y: totalY / points.length
    };
  }

  /**
   * Clear shape snap cache for specific shape or all shapes
   */
  clearShapeCache(shapeId?: string): void {
    if (shapeId) {
      // Clear cache entries for specific shape
      for (const key of this.shapeSnapCache.keys()) {
        if (key.startsWith(shapeId)) {
          this.shapeSnapCache.delete(key);
        }
      }
    } else {
      this.shapeSnapCache.clear();
    }
  }

  /**
   * Clear grid snap cache
   */
  clearGridCache(): void {
    this.gridSnapCache.clear();
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.shapeSnapCache.clear();
    this.gridSnapCache.clear();
  }

  /**
   * Get debug information about snap detection
   */
  getDebugInfo(cursor: Point2D, shapes: Shape[], config: SnapConfig, gridConfig: GridConfig): {
    totalSnapPoints: number;
    snapsByType: Record<SnapType, number>;
    closestSnap: SnapPoint | null;
    cacheStats: {
      shapeCacheSize: number;
      gridCacheSize: number;
    };
  } {
    const snapPoints = this.detectSnapPoints(cursor, shapes, config, gridConfig);
    const snapsByType = snapPoints.reduce((acc, snap) => {
      acc[snap.type] = (acc[snap.type] || 0) + 1;
      return acc;
    }, {} as Record<SnapType, number>);

    return {
      totalSnapPoints: snapPoints.length,
      snapsByType,
      closestSnap: this.findBestSnapPoint(cursor, snapPoints),
      cacheStats: {
        shapeCacheSize: this.shapeSnapCache.size,
        gridCacheSize: this.gridSnapCache.size
      }
    };
  }
}

// Export singleton instance
export const snapService = new SnapService();