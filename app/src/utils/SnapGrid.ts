// Vector3 and Vector2 imports removed as they're not used in the current implementation
import type { Shape, Point2D, SnapPoint } from '@/types';

/**
 * Spatial grid system for efficient snap point lookup and detection
 */
export class SnapGrid {
  private grid: Map<string, SnapPoint[]> = new Map();
  private cellSize: number;
  private snapDistance: number;

  constructor(cellSize = 10, snapDistance = 1.5) {
    this.cellSize = cellSize;
    this.snapDistance = snapDistance;
  }

  /**
   * Generate grid key from world coordinates
   */
  private getGridKey(x: number, z: number): string {
    const gridX = Math.floor(x / this.cellSize);
    const gridZ = Math.floor(z / this.cellSize);
    return `${gridX},${gridZ}`;
  }

  /**
   * Extract snap points from a shape based on its type
   */
  private extractSnapPoints(shape: Shape): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (!shape.points || shape.points.length === 0) return snapPoints;

    // Apply rotation if exists
    const points = this.applyRotation(shape.points, shape.rotation);

    // Endpoint snapping
    points.forEach((point, index) => {
      snapPoints.push({
        id: `${shape.id}_endpoint_${index}`,
        position: { x: point.x, y: point.y },
        type: 'endpoint',
        strength: 1.0,
        shapeId: shape.id,
        metadata: { description: `Endpoint ${index + 1}` }
      });
    });

    // Midpoint snapping for line segments
    // For closed shapes (rectangle, polygon), include the closing segment
    const isClosedShape = shape.type === 'rectangle' || shape.type === 'polygon';
    const segmentCount = isClosedShape ? points.length : points.length - 1;

    for (let i = 0; i < segmentCount; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length]; // Wraps around for closed shapes
      const midpoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
      };

      snapPoints.push({
        id: `${shape.id}_midpoint_${i}`,
        position: midpoint,
        type: 'midpoint',
        strength: 0.8,
        shapeId: shape.id,
        metadata: {
          description: `Segment ${i + 1} midpoint`,
          edgeIndex: i
        }
      });
    }

    // Center point snapping for closed shapes
    if (shape.type === 'rectangle' || shape.type === 'circle' || shape.type === 'polygon') {
      const center = this.calculateCenter(points);
      snapPoints.push({
        id: `${shape.id}_center`,
        position: center,
        type: 'center',
        strength: 0.7,
        shapeId: shape.id,
        metadata: { description: 'Shape center' }
      });
    }

    // Grid intersection points (if enabled)
    snapPoints.forEach(snapPoint => {
      const gridX = Math.round(snapPoint.position.x);
      const gridZ = Math.round(snapPoint.position.y);
      
      // Add grid snap if close to grid intersection
      if (Math.abs(snapPoint.position.x - gridX) < 0.1 && 
          Math.abs(snapPoint.position.y - gridZ) < 0.1) {
        snapPoints.push({
          id: `grid_${gridX}_${gridZ}`,
          position: { x: gridX, y: gridZ },
          type: 'grid',
          strength: 0.4,
          shapeId: 'grid',
          metadata: { description: `Grid point (${gridX}, ${gridZ})` }
        });
      }
    });

    return snapPoints;
  }

  /**
   * Apply rotation transform to points
   */
  private applyRotation(points: Point2D[], rotation?: { angle: number; center: Point2D }): Point2D[] {
    if (!rotation || rotation.angle === 0) return points;

    const { angle, center } = rotation;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return points.map(point => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;

      return {
        x: center.x + (dx * cos - dy * sin),
        y: center.y + (dx * sin + dy * cos)
      };
    });
  }

  /**
   * Calculate center point of a shape
   */
  private calculateCenter(points: Point2D[]): Point2D {
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
   * Get nearby grid keys for efficient spatial lookup
   */
  private getNearbyGridKeys(position: Point2D, searchRadius = 1): string[] {
    const keys: string[] = [];
    const baseX = Math.floor(position.x / this.cellSize);
    const baseZ = Math.floor(position.y / this.cellSize);

    // Check grid cells within search radius
    for (let x = baseX - searchRadius; x <= baseX + searchRadius; x++) {
      for (let z = baseZ - searchRadius; z <= baseZ + searchRadius; z++) {
        keys.push(`${x},${z}`);
      }
    }

    return keys;
  }

  /**
   * Update snap points from shapes array
   */
  updateSnapPoints(shapes: Shape[]): void {
    // Clear existing grid
    this.grid.clear();

    // Process each shape
    shapes.forEach(shape => {
      const snapPoints = this.extractSnapPoints(shape);
      
      snapPoints.forEach(snapPoint => {
        const key = this.getGridKey(snapPoint.position.x, snapPoint.position.y);
        
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        
        this.grid.get(key)!.push(snapPoint);
      });
    });

    // Sort snap points by strength within each cell
    this.grid.forEach(snapPoints => {
      snapPoints.sort((a, b) => b.strength - a.strength);
    });
  }

  /**
   * Find nearest snap point to given position
   */
  findNearestSnapPoint(position: Point2D, maxDistance?: number): SnapPoint | null {
    const searchDistance = maxDistance || this.snapDistance;
    const nearbyKeys = this.getNearbyGridKeys(position, Math.ceil(searchDistance / this.cellSize));
    
    let nearestSnapPoint: SnapPoint | null = null;
    let nearestDistance = searchDistance;

    nearbyKeys.forEach(key => {
      const snapPoints = this.grid.get(key) || [];
      
      snapPoints.forEach(snapPoint => {
        const distance = Math.sqrt(
          Math.pow(position.x - snapPoint.position.x, 2) +
          Math.pow(position.y - snapPoint.position.y, 2)
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestSnapPoint = snapPoint;
        }
      });
    });

    return nearestSnapPoint;
  }

  /**
   * Find all snap points within given radius
   */
  findSnapPointsInRadius(position: Point2D, radius: number): SnapPoint[] {
    const nearbyKeys = this.getNearbyGridKeys(position, Math.ceil(radius / this.cellSize));
    const foundSnapPoints: SnapPoint[] = [];

    nearbyKeys.forEach(key => {
      const snapPoints = this.grid.get(key) || [];
      
      snapPoints.forEach(snapPoint => {
        const distance = Math.sqrt(
          Math.pow(position.x - snapPoint.position.x, 2) +
          Math.pow(position.y - snapPoint.position.y, 2)
        );

        if (distance <= radius) {
          foundSnapPoints.push({
            ...snapPoint,
            // Store distance temporarily for sorting (not part of metadata interface)
            _distance: distance
          } as SnapPoint & { _distance: number });
        }
      });
    });

    // Sort by distance and strength
    return foundSnapPoints.sort((a, b) => {
      const distanceA = (a as any)._distance || 0;
      const distanceB = (b as any)._distance || 0;

      if (Math.abs(distanceA - distanceB) < 0.01) {
        return b.strength - a.strength; // Higher strength first
      }

      return distanceA - distanceB; // Closer distance first
    });
  }

  /**
   * Get statistics about current snap grid state
   */
  getStats() {
    const totalSnapPoints = Array.from(this.grid.values()).reduce(
      (sum, points) => sum + points.length, 
      0
    );
    
    return {
      gridCells: this.grid.size,
      totalSnapPoints,
      cellSize: this.cellSize,
      snapDistance: this.snapDistance
    };
  }

  /**
   * Set snap distance
   */
  setSnapDistance(distance: number): void {
    this.snapDistance = distance;
  }

  /**
   * Clear all snap points
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clear();
  }
}