import type { ReferenceObject, BoundingBox } from '../types/referenceObjects';

interface ObjectPosition {
  x: number;
  y: number;
  z: number;
}

export class ObjectPositioner {
  /**
   * Position reference objects intelligently around user's land
   */
  static positionObjects(
    objects: ReferenceObject[],
    userLandBounds: BoundingBox
  ): ObjectPosition[] {
    const positions: ObjectPosition[] = [];
    const placedObjects: Array<{ position: ObjectPosition; bounds: BoundingBox }> = [];

    // Calculate safe distance from user land
    const landWidth = userLandBounds.max.x - userLandBounds.min.x;
    const landHeight = userLandBounds.max.y - userLandBounds.min.y;
    const landSize = Math.max(landWidth, landHeight);

    const safeDistance = Math.max(20, landSize * 0.2); // At least 20m or 20% of land size
    const gridSpacing = Math.max(15, landSize * 0.1); // Spacing between objects

    // Sort objects by size (largest first)
    const sortedObjects = [...objects].sort((a, b) => b.area - a.area);

    sortedObjects.forEach((object, index) => {
      const position = this.findSafePosition(
        object,
        userLandBounds,
        placedObjects,
        safeDistance,
        gridSpacing,
        index
      );

      positions.push(position);

      // Add to placed objects for collision detection
      placedObjects.push({
        position,
        bounds: this.calculateObjectBounds(object, position)
      });
    });

    // Map positions back to original object order
    const positionMap = new Map<string, ObjectPosition>();
    sortedObjects.forEach((obj, i) => {
      positionMap.set(obj.id, positions[i]);
    });

    return objects.map(obj => positionMap.get(obj.id)!);
  }

  /**
   * Find a safe position for an object that doesn't overlap with others
   */
  private static findSafePosition(
    object: ReferenceObject,
    userLandBounds: BoundingBox,
    placedObjects: Array<{ position: ObjectPosition; bounds: BoundingBox }>,
    safeDistance: number,
    gridSpacing: number,
    index: number
  ): ObjectPosition {
    // Calculate center of user land
    const centerX = (userLandBounds.min.x + userLandBounds.max.x) / 2;
    const centerZ = (userLandBounds.min.y + userLandBounds.max.y) / 2;

    // Calculate initial radius (distance from center)
    const landRadius = Math.max(
      userLandBounds.max.x - userLandBounds.min.x,
      userLandBounds.max.y - userLandBounds.min.y
    ) / 2;

    const radius = landRadius + safeDistance + object.dimensions.length / 2;

    // Use spiral pattern for positioning
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
    let angleOffset = index * goldenAngle;

    // Try different positions in a spiral pattern
    for (let attempt = 0; attempt < 50; attempt++) {
      // Calculate position
      const spiralFactor = attempt / 50;
      const currentRadius = radius + (spiralFactor * gridSpacing * 5);
      const angle = angleOffset + (spiralFactor * Math.PI * 2);

      const x = centerX + Math.cos(angle) * currentRadius;
      const z = centerZ + Math.sin(angle) * currentRadius;
      const y = 0; // Keep objects at ground level

      const position = { x, y, z };
      const objectBounds = this.calculateObjectBounds(object, position);

      // Check if position is valid (no collisions)
      if (!this.hasCollisions(objectBounds, userLandBounds, placedObjects)) {
        return position;
      }

      // Try next position
      angleOffset += Math.PI / 8; // Rotate by 22.5 degrees
    }

    // Fallback: position further out if no safe spot found
    const fallbackRadius = radius + gridSpacing * placedObjects.length;
    const fallbackAngle = index * (Math.PI * 2 / Math.max(placedObjects.length + 1, 8));

    return {
      x: centerX + Math.cos(fallbackAngle) * fallbackRadius,
      y: 0,
      z: centerZ + Math.sin(fallbackAngle) * fallbackRadius
    };
  }

  /**
   * Calculate bounding box for an object at a given position
   */
  private static calculateObjectBounds(
    object: ReferenceObject,
    position: ObjectPosition
  ): BoundingBox {
    const halfLength = object.dimensions.length / 2;
    const halfWidth = object.dimensions.width / 2;

    return {
      min: {
        x: position.x - halfLength,
        y: position.z - halfWidth
      },
      max: {
        x: position.x + halfLength,
        y: position.z + halfWidth
      }
    };
  }

  /**
   * Check if an object bounds has collisions
   */
  private static hasCollisions(
    objectBounds: BoundingBox,
    userLandBounds: BoundingBox,
    placedObjects: Array<{ bounds: BoundingBox }>
  ): boolean {
    // Check collision with user land (with buffer)
    const buffer = 10; // 10m buffer
    const expandedLandBounds = {
      min: { x: userLandBounds.min.x - buffer, y: userLandBounds.min.y - buffer },
      max: { x: userLandBounds.max.x + buffer, y: userLandBounds.max.y + buffer }
    };

    if (this.boundsIntersect(objectBounds, expandedLandBounds)) {
      return true;
    }

    // Check collision with other placed objects
    for (const placed of placedObjects) {
      if (this.boundsIntersect(objectBounds, placed.bounds)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if two bounding boxes intersect
   */
  private static boundsIntersect(bounds1: BoundingBox, bounds2: BoundingBox): boolean {
    return !(
      bounds1.max.x < bounds2.min.x ||
      bounds1.min.x > bounds2.max.x ||
      bounds1.max.y < bounds2.min.y ||
      bounds1.min.y > bounds2.max.y
    );
  }

  /**
   * Calculate the center of a bounding box
   */
  static getBoundsCenter(bounds: BoundingBox): { x: number; y: number } {
    return {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2
    };
  }

  /**
   * Calculate the size of a bounding box
   */
  static getBoundsSize(bounds: BoundingBox): { width: number; height: number } {
    return {
      width: bounds.max.x - bounds.min.x,
      height: bounds.max.y - bounds.min.y
    };
  }

  /**
   * Create a bounding box from shapes (for user land)
   */
  static createBoundsFromShapes(shapes: Array<{ points: Array<{ x: number; y: number }> }>): BoundingBox {
    if (shapes.length === 0) {
      return { min: { x: -50, y: -50 }, max: { x: 50, y: 50 } };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    shapes.forEach(shape => {
      shape.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    // Add some padding
    const padding = 10;
    return {
      min: { x: minX - padding, y: minY - padding },
      max: { x: maxX + padding, y: maxY + padding }
    };
  }
}