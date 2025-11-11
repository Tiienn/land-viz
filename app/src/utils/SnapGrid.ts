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
    const minPointsRequired = (shape.type === 'polyline' || shape.type === 'line') ? 1 : 2;
    if (shape.points.length < minPointsRequired) return snapPoints;

    // Apply rotation if exists
    let points = this.applyRotation(shape.points, shape.rotation);

    // CRITICAL FIX: For rectangles in 2-point format, expand to all 4 corners for endpoint snapping
    if (shape.type === 'rectangle' && points.length === 2) {
      const [topLeft, bottomRight] = points;
      points = [
        { x: topLeft.x, y: topLeft.y },        // 0: Top-left
        { x: bottomRight.x, y: topLeft.y },    // 1: Top-right
        { x: bottomRight.x, y: bottomRight.y }, // 2: Bottom-right
        { x: topLeft.x, y: bottomRight.y }      // 3: Bottom-left
      ];
    }

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
    // Also check if polyline forms a closed loop
    let isClosedShape = shape.type === 'rectangle' || shape.type === 'polygon';

    // For polylines and lines with 3+ points, check if they form a closed loop
    // Smart detection handles both precise closures and intentional "visual" closures
    if ((shape.type === 'polyline' || shape.type === 'line') && points.length >= 3) {
      const first = points[0];
      const last = points[points.length - 1];
      const distance = Math.sqrt(
        Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
      );

      // Calculate average edge length for better heuristic
      let totalEdgeLength = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        totalEdgeLength += Math.sqrt(dx * dx + dy * dy);
      }
      const avgEdgeLength = totalEdgeLength / (points.length - 1);

      // For small polylines (3-5 points, typical user-drawn shapes),
      // if the gap is smaller than the average edge, it's likely intentionally closed
      // For larger polylines (6+ points), use stricter threshold
      let threshold: number;
      if (points.length <= 5) {
        // Small polylines: generous threshold = 1.5x average edge length
        // This catches triangles/quads even with sloppy closures
        threshold = Math.max(5.0, avgEdgeLength * 1.5);
      } else {
        // Large polylines: stricter threshold = 50% of average edge
        threshold = Math.max(5.0, avgEdgeLength * 0.5);
      }

      if (distance < threshold) {
        isClosedShape = true;
      }
    }

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

    // Edge snapping: Find closest point on each edge (NEW FEATURE)
    if (cursorPosition) {
      const edgeSnapPoints = this.generateEdgeSnapPoints(shape, cursorPosition);
      snapPoints.push(...edgeSnapPoints);
    }

    // DISABLED: Grid points during shape-to-shape snapping
    // Grid intersection points flood the snap detection with thousands of points,
    // making it impossible to snap to actual shape features (endpoints, midpoints, centers).
    // Grid snapping is handled separately during drawing operations.
    /*
    if (cursorPosition) {
      this.addNearbyGridPoints(snapPoints, cursorPosition);
    }
    */

    return snapPoints;
  }

  /**
   * Generate edge snap points - snap to closest point ON an edge, not just endpoints/midpoints
   * This is a CAD-level feature for ultra-precise alignment
   */
  private generateEdgeSnapPoints(shape: Shape, cursorPosition: Point2D): SnapPoint[] {
    const edgeSnapPoints: SnapPoint[] = [];

    if (!shape.points || shape.points.length < 2) return edgeSnapPoints;

    // Apply rotation if exists
    const points = this.applyRotation(shape.points, shape.rotation);

    // For closed shapes (rectangle, polygon), include the closing segment
    // Also check if polyline forms a closed loop
    let isClosedShape = shape.type === 'rectangle' || shape.type === 'polygon';

    // For polylines and lines with 3+ points, check if they form a closed loop
    // Use adaptive threshold based on shape size for better detection
    if ((shape.type === 'polyline' || shape.type === 'line') && points.length >= 3) {
      const first = points[0];
      const last = points[points.length - 1];
      const distance = Math.sqrt(
        Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
      );

      // Calculate bounding box diagonal for adaptive threshold
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const diagonal = Math.sqrt(width * width + height * height);

      // Consider closed if endpoints are within 5% of the diagonal OR within 2 meters
      const adaptiveThreshold = Math.max(2.0, diagonal * 0.05);

      if (distance < adaptiveThreshold) {
        isClosedShape = true;
      }
    }

    const segmentCount = isClosedShape ? points.length : points.length - 1;

    for (let i = 0; i < segmentCount; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      // Find closest point on this edge segment
      const closestPoint = this.closestPointOnLineSegment(cursorPosition, p1, p2);
      const distance = Math.sqrt(
        Math.pow(closestPoint.x - cursorPosition.x, 2) +
        Math.pow(closestPoint.y - cursorPosition.y, 2)
      );

      // Only create edge snap if cursor is close to the edge (within snap distance)
      // and the closest point is not too close to endpoints (avoid duplicate with endpoint snaps)
      const distToP1 = Math.sqrt(Math.pow(closestPoint.x - p1.x, 2) + Math.pow(closestPoint.y - p1.y, 2));
      const distToP2 = Math.sqrt(Math.pow(closestPoint.x - p2.x, 2) + Math.pow(closestPoint.y - p2.y, 2));

      // Only add edge snap if it's not too close to endpoints (>0.5 units from endpoints)
      if (distance <= this.snapDistance && distToP1 > 0.5 && distToP2 > 0.5) {
        edgeSnapPoints.push({
          id: `${shape.id}_edge_snap_${i}`,
          position: closestPoint,
          type: 'edge',
          strength: 0.6,  // Lower than endpoint/midpoint but higher than extension
          shapeId: shape.id,
          metadata: {
            description: `Edge ${i + 1} snap`,
            edgeIndex: i,
            edgeStart: p1,
            edgeEnd: p2
          }
        });
      }

      // PERPENDICULAR SNAP: Detect if cursor is creating perpendicular angle with this edge
      const perpendicularPoint = this.findPerpendicularSnapPoint(cursorPosition, p1, p2, shape.id, i);
      if (perpendicularPoint) {
        edgeSnapPoints.push(perpendicularPoint);
      }
    }

    return edgeSnapPoints;
  }

  /**
   * Calculate closest point on a line segment to a given point
   * This is the core algorithm for edge snapping
   */
  private closestPointOnLineSegment(point: Point2D, lineStart: Point2D, lineEnd: Point2D): Point2D {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    // If line segment is a point, return that point
    if (dx === 0 && dy === 0) {
      return { x: lineStart.x, y: lineStart.y };
    }

    // Calculate parameter t for closest point on infinite line
    // t = 0 means lineStart, t = 1 means lineEnd
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);

    // Clamp t to [0, 1] to stay on line segment
    const clampedT = Math.max(0, Math.min(1, t));

    return {
      x: lineStart.x + clampedT * dx,
      y: lineStart.y + clampedT * dy
    };
  }

  /**
   * Find perpendicular snap point if cursor is creating ~90° angle with an edge
   * CAD-style perpendicular snapping for precise right angles
   */
  private findPerpendicularSnapPoint(
    cursorPosition: Point2D,
    edgeStart: Point2D,
    edgeEnd: Point2D,
    shapeId: string,
    edgeIndex: number
  ): SnapPoint | null {
    // Calculate vector from edge start to cursor
    const toCursor = {
      x: cursorPosition.x - edgeStart.x,
      y: cursorPosition.y - edgeStart.y
    };

    // Calculate edge vector
    const edgeVector = {
      x: edgeEnd.x - edgeStart.x,
      y: edgeEnd.y - edgeStart.y
    };

    // Calculate dot product to check angle
    const dotProduct = toCursor.x * edgeVector.x + toCursor.y * edgeVector.y;
    const edgeLengthSq = edgeVector.x * edgeVector.x + edgeVector.y * edgeVector.y;

    if (edgeLengthSq === 0) return null;

    // Calculate angle between vectors
    const cursorLengthSq = toCursor.x * toCursor.x + toCursor.y * toCursor.y;
    const cosAngle = dotProduct / Math.sqrt(edgeLengthSq * cursorLengthSq);
    const angleDegrees = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);

    // Check if angle is close to 90° (perpendicular) - within 5° tolerance
    if (Math.abs(angleDegrees - 90) < 5) {
      // Create perpendicular snap point at cursor position
      return {
        id: `${shapeId}_perpendicular_${edgeIndex}`,
        position: { x: cursorPosition.x, y: cursorPosition.y },
        type: 'perpendicular',
        strength: 0.5,  // Medium-low strength
        shapeId: shapeId,
        metadata: {
          description: `Perpendicular to edge ${edgeIndex + 1}`,
          angle: angleDegrees,
          edgeStart: edgeStart,
          edgeEnd: edgeEnd
        }
      };
    }

    return null;
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
      if (firstKey) {
        this.gridCache.delete(firstKey);
      }
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
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    if (timeSinceLastUpdate < this.UPDATE_INTERVAL) {
      return;
    }

    this.lastUpdateTime = now;
    this.performUpdate(shapes, cursorPosition);
  }

  /**
   * Force update snap points, bypassing throttle
   * Used when starting new operations that require fresh snap data
   */
  forceUpdate(shapes: Shape[], cursorPosition?: Point2D): void {
    this.lastUpdateTime = performance.now();
    this.performUpdate(shapes, cursorPosition);
  }

  /**
   * Perform the actual grid update (shared by updateSnapPoints and forceUpdate)
   */
  private performUpdate(shapes: Shape[], cursorPosition?: Point2D): void {
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
   * Prioritizes higher-strength snap points (corners/endpoints) when distances are similar
   */
  findNearestSnapPoint(position: Point2D, maxDistance?: number): SnapPoint | null {
    const searchDistance = maxDistance || this.snapDistance;
    const nearbyKeys = this.getNearbyGridKeys(position, Math.ceil(searchDistance / this.cellSize));

    let nearestSnapPoint: SnapPoint | null = null;
    let nearestDistance = Infinity;

    nearbyKeys.forEach(key => {
      const snapPoints = this.grid.get(key) || [];

      snapPoints.forEach(snapPoint => {
        const distance = Math.sqrt(
          Math.pow(position.x - snapPoint.position.x, 2) +
          Math.pow(position.y - snapPoint.position.y, 2)
        );

        // Only consider points within search distance
        if (distance <= searchDistance) {
          if (!nearestSnapPoint) {
            // First valid snap point found
            nearestSnapPoint = snapPoint;
            nearestDistance = distance;
          } else {
            // PRIORITY SNAP: If distances are similar (within 3 units), prefer higher strength
            const distanceDiff = Math.abs(distance - nearestDistance);

            if (distanceDiff < 3.0) {
              // Distances are similar, prefer higher-strength snap point (corners over edges)
              if (snapPoint.strength > nearestSnapPoint.strength) {
                nearestSnapPoint = snapPoint;
                nearestDistance = distance;
              }
              // If equal or lower strength, keep the current one
            } else if (distance < nearestDistance) {
              // New point is significantly closer (>3 units), use it regardless of strength
              nearestSnapPoint = snapPoint;
              nearestDistance = distance;
            }
          }
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
