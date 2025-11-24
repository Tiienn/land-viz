import type { Shape, Point2D, Point3D } from '../types';
import type { WalkableBoundary } from '../services/boundaryDetection/types';

/**
 * Boundary collision detection utilities for walkthrough mode
 *
 * Phase 2: Point-in-polygon collision detection for walkable boundaries
 *
 * Prevents the user from walking beyond the site boundaries by:
 * 1. Calculating a bounding box from all shapes (legacy fallback)
 * 2. Point-in-polygon detection for accurate polygon boundaries
 * 3. Constraining camera movement within walkable areas
 * 4. Providing visual feedback when near boundary edges
 */

export interface BoundingBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
}

/**
 * Default boundary when no shapes exist (10x10 meter area)
 */
const DEFAULT_BOUNDARY: BoundingBox = {
  minX: -5,
  maxX: 5,
  minZ: -5,
  maxZ: 5,
  centerX: 0,
  centerZ: 0,
  width: 10,
  depth: 10,
};

/**
 * Buffer distance from boundary edge (in meters)
 * Prevents walking exactly on the edge for better UX
 */
const BOUNDARY_BUFFER = 0.5; // 0.5 meters

/**
 * Calculate bounding box from all shapes in the scene
 *
 * @param shapes - Array of shapes to calculate boundary from
 * @param bufferDistance - Additional buffer around the boundary (default: 2m)
 * @returns Bounding box with min/max coordinates
 */
export function calculateBoundingBox(
  shapes: Shape[],
  bufferDistance: number = 2.0
): BoundingBox {
  // If no shapes, return default boundary
  if (!shapes || shapes.length === 0) {
    return DEFAULT_BOUNDARY;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  // Iterate through all shapes and find extreme points
  // Use point.z || point.y || 0 to support shapes drawn in 2D mode (which only have x, y)
  shapes.forEach(shape => {
    shape.points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.z || point.y || 0);
      maxZ = Math.max(maxZ, point.z || point.y || 0);
    });
  });

  // Add buffer distance (extra walkable area around shapes)
  minX -= bufferDistance;
  maxX += bufferDistance;
  minZ -= bufferDistance;
  maxZ += bufferDistance;

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

/**
 * Check if a position is within the boundary
 *
 * @param position - 3D position to check (only X and Z are used)
 * @param boundary - Bounding box to check against
 * @returns true if position is within bounds
 */
export function isWithinBounds(
  position: Point3D,
  boundary: BoundingBox
): boolean {
  const z = position.z || 0; // Handle undefined z coordinate
  return (
    position.x >= boundary.minX + BOUNDARY_BUFFER &&
    position.x <= boundary.maxX - BOUNDARY_BUFFER &&
    z >= boundary.minZ + BOUNDARY_BUFFER &&
    z <= boundary.maxZ - BOUNDARY_BUFFER
  );
}

/**
 * Constrain a position to stay within boundaries
 *
 * @param position - Desired position
 * @param boundary - Bounding box to constrain to
 * @returns Constrained position that is guaranteed to be within bounds
 */
export function constrainToBoundary(
  position: Point3D,
  boundary: BoundingBox
): Point3D {
  const z = position.z || 0; // Handle undefined z coordinate
  return {
    x: Math.max(
      boundary.minX + BOUNDARY_BUFFER,
      Math.min(boundary.maxX - BOUNDARY_BUFFER, position.x)
    ),
    y: position.y, // Don't constrain Y (vertical movement)
    z: Math.max(
      boundary.minZ + BOUNDARY_BUFFER,
      Math.min(boundary.maxZ - BOUNDARY_BUFFER, z)
    ),
  };
}

/**
 * Check if a position is near the boundary edge (for visual feedback)
 *
 * @param position - Current position
 * @param boundary - Bounding box
 * @param threshold - Distance threshold for "near" detection (default: 1m)
 * @returns true if position is within threshold distance of boundary
 */
export function isNearBoundary(
  position: Point3D,
  boundary: BoundingBox,
  threshold: number = 1.0
): boolean {
  const z = position.z || 0; // Handle undefined z coordinate
  const distToMinX = Math.abs(position.x - (boundary.minX + BOUNDARY_BUFFER));
  const distToMaxX = Math.abs(position.x - (boundary.maxX - BOUNDARY_BUFFER));
  const distToMinZ = Math.abs(z - (boundary.minZ + BOUNDARY_BUFFER));
  const distToMaxZ = Math.abs(z - (boundary.maxZ - BOUNDARY_BUFFER));

  const minDist = Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ);

  return minDist <= threshold;
}

/**
 * Get the direction away from the nearest boundary (for subtle pushback)
 *
 * @param position - Current position
 * @param boundary - Bounding box
 * @returns Normalized vector pointing away from nearest boundary
 */
export function getBoundaryRepulsionVector(
  position: Point3D,
  boundary: BoundingBox
): { x: number; z: number } {
  const z = position.z || 0; // Handle undefined z coordinate
  const distToMinX = position.x - (boundary.minX + BOUNDARY_BUFFER);
  const distToMaxX = (boundary.maxX - BOUNDARY_BUFFER) - position.x;
  const distToMinZ = z - (boundary.minZ + BOUNDARY_BUFFER);
  const distToMaxZ = (boundary.maxZ - BOUNDARY_BUFFER) - z;

  // Find which boundary is closest
  const minDistX = Math.min(distToMinX, distToMaxX);
  const minDistZ = Math.min(distToMinZ, distToMaxZ);

  let repulsionX = 0;
  let repulsionZ = 0;

  // Apply repulsion from X boundaries
  if (minDistX < minDistZ) {
    repulsionX = distToMinX < distToMaxX ? 1 : -1;
  } else {
    repulsionZ = distToMinZ < distToMaxZ ? 1 : -1;
  }

  return { x: repulsionX, z: repulsionZ };
}

/**
 * Visual debug helper: Get boundary corners for rendering
 * (Useful for debugging in Phase 4)
 */
export function getBoundaryCorners(boundary: BoundingBox): Point2D[] {
  return [
    { x: boundary.minX, y: boundary.minZ },
    { x: boundary.maxX, y: boundary.minZ },
    { x: boundary.maxX, y: boundary.maxZ },
    { x: boundary.minX, y: boundary.maxZ },
  ];
}

// ============================================================================
// Phase 2: Point-in-Polygon Collision Detection for Walkable Boundaries
// ============================================================================

/**
 * Ray casting algorithm to check if a point is inside a polygon
 * Based on the even-odd rule: count ray intersections with polygon edges
 *
 * @param point - Point to test (x, z coordinates in world space)
 * @param polygon - Array of polygon vertices (x, y where y = world z)
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(
  point: { x: number; z: number },
  polygon: Array<{ x: number; y: number }>
): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const x = point.x;
  const z = point.z;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y; // y in polygon = z in world
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    // Check if ray from point crosses this edge
    const intersect = ((yi > z) !== (yj > z)) &&
      (x < (xj - xi) * (z - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a position is inside any of the walkable boundaries
 *
 * @param position - 3D position (uses x and z)
 * @param boundaries - Array of walkable boundaries
 * @returns true if position is inside at least one boundary
 */
export function isInsideWalkableBoundary(
  position: Point3D,
  boundaries: WalkableBoundary[]
): boolean {
  if (!boundaries || boundaries.length === 0) return true; // No boundaries = free roam

  const testPoint = { x: position.x, z: position.z || 0 };

  return boundaries.some(boundary =>
    isPointInPolygon(testPoint, boundary.points)
  );
}

/**
 * Find the nearest point on a polygon edge from a given point
 *
 * @param point - Point to find nearest edge point from
 * @param polygon - Polygon vertices
 * @returns Nearest point on polygon edge
 */
export function getNearestPointOnPolygon(
  point: { x: number; z: number },
  polygon: Array<{ x: number; y: number }>
): { x: number; z: number; distance: number; edgeIndex: number } {
  let nearestPoint = { x: point.x, z: point.z };
  let minDistance = Infinity;
  let nearestEdgeIndex = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const p1 = { x: polygon[i].x, z: polygon[i].y };
    const p2 = { x: polygon[j].x, z: polygon[j].y };

    // Find nearest point on edge segment
    const nearest = nearestPointOnSegment(point, p1, p2);
    const dist = Math.sqrt(
      (point.x - nearest.x) ** 2 + (point.z - nearest.z) ** 2
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearestPoint = nearest;
      nearestEdgeIndex = i;
    }
  }

  return { ...nearestPoint, distance: minDistance, edgeIndex: nearestEdgeIndex };
}

/**
 * Find the nearest point on a line segment
 */
function nearestPointOnSegment(
  point: { x: number; z: number },
  p1: { x: number; z: number },
  p2: { x: number; z: number }
): { x: number; z: number } {
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq === 0) return p1; // Segment is a point

  // Project point onto line, clamped to segment
  let t = ((point.x - p1.x) * dx + (point.z - p1.z) * dz) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  return {
    x: p1.x + t * dx,
    z: p1.z + t * dz,
  };
}

/**
 * Constrain a position to stay inside walkable boundaries
 * If position is outside, push it back to the nearest edge
 *
 * @param position - Desired position
 * @param boundaries - Walkable boundaries
 * @param pushbackDistance - How far inside the boundary to push (default: 0.3m)
 * @returns Constrained position
 */
export function constrainToWalkableBoundary(
  position: Point3D,
  boundaries: WalkableBoundary[],
  pushbackDistance: number = 0.3
): { position: Point3D; wasConstrained: boolean; nearestBoundaryId?: string } {
  // No boundaries = no constraint (legacy fallback)
  if (!boundaries || boundaries.length === 0) {
    return { position, wasConstrained: false };
  }

  const testPoint = { x: position.x, z: position.z || 0 };

  // Check if inside any boundary
  for (const boundary of boundaries) {
    if (isPointInPolygon(testPoint, boundary.points)) {
      // Inside this boundary - check if near edge
      const nearest = getNearestPointOnPolygon(testPoint, boundary.points);

      if (nearest.distance < pushbackDistance) {
        // Too close to edge - push slightly inward
        const dx = testPoint.x - nearest.x;
        const dz = testPoint.z - nearest.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.001) {
          const pushX = (dx / dist) * pushbackDistance;
          const pushZ = (dz / dist) * pushbackDistance;

          return {
            position: {
              x: nearest.x + pushX,
              y: position.y,
              z: nearest.z + pushZ,
            },
            wasConstrained: true,
            nearestBoundaryId: boundary.id,
          };
        }
      }

      // Safely inside boundary
      return { position, wasConstrained: false, nearestBoundaryId: boundary.id };
    }
  }

  // Outside all boundaries - find nearest boundary and push to edge
  let nearestBoundary: WalkableBoundary | null = null;
  let nearestPointResult: ReturnType<typeof getNearestPointOnPolygon> | null = null;
  let minDist = Infinity;

  for (const boundary of boundaries) {
    const nearest = getNearestPointOnPolygon(testPoint, boundary.points);
    if (nearest.distance < minDist) {
      minDist = nearest.distance;
      nearestBoundary = boundary;
      nearestPointResult = nearest;
    }
  }

  if (nearestBoundary && nearestPointResult) {
    // Push position to just inside the boundary edge
    const dx = testPoint.x - nearestPointResult.x;
    const dz = testPoint.z - nearestPointResult.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.001) {
      // Move to edge point, then push slightly inward
      const inwardX = -(dx / dist) * pushbackDistance;
      const inwardZ = -(dz / dist) * pushbackDistance;

      return {
        position: {
          x: nearestPointResult.x + inwardX,
          y: position.y,
          z: nearestPointResult.z + inwardZ,
        },
        wasConstrained: true,
        nearestBoundaryId: nearestBoundary.id,
      };
    }
  }

  // Fallback: return original position
  return { position, wasConstrained: false };
}

/**
 * Get distance to nearest boundary edge (for visual feedback)
 *
 * @param position - Current position
 * @param boundaries - Walkable boundaries
 * @returns Distance to nearest edge (negative if outside boundary)
 */
export function getDistanceToBoundaryEdge(
  position: Point3D,
  boundaries: WalkableBoundary[]
): { distance: number; isInside: boolean; boundaryId?: string } {
  if (!boundaries || boundaries.length === 0) {
    return { distance: Infinity, isInside: true };
  }

  const testPoint = { x: position.x, z: position.z || 0 };
  let minDistance = Infinity;
  let isInsideAny = false;
  let nearestBoundaryId: string | undefined;

  for (const boundary of boundaries) {
    const isInside = isPointInPolygon(testPoint, boundary.points);
    const nearest = getNearestPointOnPolygon(testPoint, boundary.points);

    if (isInside) {
      isInsideAny = true;
      if (nearest.distance < minDistance) {
        minDistance = nearest.distance;
        nearestBoundaryId = boundary.id;
      }
    } else {
      // Outside - track as negative distance
      if (nearest.distance < Math.abs(minDistance)) {
        minDistance = -nearest.distance;
        nearestBoundaryId = boundary.id;
      }
    }
  }

  return {
    distance: minDistance,
    isInside: isInsideAny,
    boundaryId: nearestBoundaryId,
  };
}
