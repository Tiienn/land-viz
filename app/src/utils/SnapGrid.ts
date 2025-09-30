// Vector3 and Vector2 imports removed as they're not used in the current implementation
import type { Shape, Point2D, SnapPoint } from '@/types';

/**
 * Spatial grid system for efficient snap point lookup and detection
 */
export class SnapGrid {
  private grid: Map<string, SnapPoint[]> = new Map();
  private cellSize: number;
  private snapDistance: number;
  private lastUpdateTime = 0;
  private readonly UPDATE_INTERVAL = 16; // ~60fps throttling
  private gridCache = new Map<string, SnapPoint[]>();
  private readonly CACHE_SIZE_LIMIT = 100;

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
  private extractSnapPoints(shape: Shape, cursorPosition?: Point2D): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];

    if (!shape.points || shape.points.length === 0) return snapPoints;

    // Skip snap point generation for incomplete shapes
    // Rectangle needs at least 2 points, circle needs 2 points, other shapes need at least 2 points for meaningful snapping
    const minPointsRequired = shape.type === 'polyline' ? 1 : 2;
    if (shape.points.length < minPointsRequired) return snapPoints;

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

    // Grid intersection points (cursor-proximity based)
    if (cursorPosition) {
      this.addNearbyGridPoints(snapPoints, cursorPosition);
    }

    return snapPoints;
  }

  /**
   * Smart validation for grid point generation
   */
  private shouldGenerateGridPoint(gridX: number, gridY: number, cursorPos: Point2D, snapRadius: number): boolean {
    const distance = Math.sqrt(
      Math.pow(cursorPos.x - gridX, 2) +
      Math.pow(cursorPos.y - gridY, 2)
    );
    return distance <= snapRadius;
  }

  /**
   * Generate cache key for grid region
   */
  private getGridCacheKey(cursorPosition: Point2D, radius: number): string {
    const cellX = Math.floor(cursorPosition.x / radius);
    const cellY = Math.floor(cursorPosition.y / radius);
    return `${cellX}_${cellY}_${radius}`;
  }

  /**
   * Add grid intersection points near cursor position with smart generation and caching
   */
  private addNearbyGridPoints(snapPoints: SnapPoint[], cursorPosition: Point2D): void {
    // OPTION 1 FIX: Use larger radius for grid generation (minimum 2m) to ensure grid points
    // are found, while keeping actual snap detection precise (handled by SnapIndicator proximity filtering)
    const searchRadius = Math.max(this.snapDistance, 2.0);
    const cacheKey = this.getGridCacheKey(cursorPosition, searchRadius);

    // Check cache first
    if (this.gridCache.has(cacheKey)) {
      const cachedPoints = this.gridCache.get(cacheKey)!;
      snapPoints.push(...cachedPoints);
      return;
    }

    // Generate new grid points
    const gridPoints: SnapPoint[] = [];
    const minX = Math.floor(cursorPosition.x - searchRadius);
    const maxX = Math.ceil(cursorPosition.x + searchRadius);
    const minY = Math.floor(cursorPosition.y - searchRadius);
    const maxY = Math.ceil(cursorPosition.y + searchRadius);

    for (let gridX = minX; gridX <= maxX; gridX++) {
      for (let gridY = minY; gridY <= maxY; gridY++) {
        // Only generate if actually close enough (smart generation)
        if (!this.shouldGenerateGridPoint(gridX, gridY, cursorPosition, searchRadius)) {
          continue;
        }
        // Create new grid point for caching
        gridPoints.push({
          id: `grid_${gridX}_${gridY}`,
          position: { x: gridX, y: gridY },
          type: 'grid',
          strength: 0.4,
          shapeId: 'grid',
          metadata: { description: `Grid point (${gridX}, ${gridY})` }
        });
      }
    }

    // Cache the results
    this.gridCache.set(cacheKey, gridPoints);

    // Limit cache size
    if (this.gridCache.size > this.CACHE_SIZE_LIMIT) {
      const firstKey = this.gridCache.keys().next().value;
      this.gridCache.delete(firstKey);
    }

    // Add generated points to snap points
    snapPoints.push(...gridPoints);
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
    if (points.length === 0) {
      // Return origin as fallback, though this should not happen due to earlier checks
      return { x: 0, y: 0 };
    }

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
  updateSnapPoints(shapes: Shape[], cursorPosition?: Point2D): void {
    // Throttle updates to 60fps for performance
    const now = performance.now();
    if (now - this.lastUpdateTime < this.UPDATE_INTERVAL) {
      return;
    }
    this.lastUpdateTime = now;

    // Clear existing grid
    this.grid.clear();

    // Process each shape
    shapes.forEach(shape => {
      const snapPoints = this.extractSnapPoints(shape, cursorPosition);

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
