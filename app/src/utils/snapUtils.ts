/**
 * Shared snap utility functions for reusable snap detection logic
 * Prevents code duplication across components
 */

import type { Point2D, SnapPoint } from '../types';

/**
 * Calculate Euclidean distance between two 2D points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance in world units
 *
 * @example
 * const dist = calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 }); // Returns 5
 */
export function calculateDistance(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Validate if a snap point is within proximity radius of cursor
 *
 * @param snapPoint - Snap point to check
 * @param cursor - Current cursor position
 * @param radius - Maximum snap radius in world units
 * @returns true if snap point is within radius
 *
 * @example
 * const isNear = validateSnapPointProximity(
 *   { type: 'endpoint', position: { x: 1, y: 1 }, ... },
 *   { x: 1.5, y: 1.5 },
 *   1.0
 * ); // Returns true (distance ~0.71 < 1.0)
 */
export function validateSnapPointProximity(
  snapPoint: SnapPoint,
  cursor: Point2D,
  radius: number
): boolean {
  const distance = calculateDistance(cursor, snapPoint.position);
  return distance <= radius;
}

/**
 * Calculate midpoint between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Midpoint coordinates
 */
export function calculateMidpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}

/**
 * Calculate geometric center (centroid) of a polygon
 *
 * @param points - Array of polygon vertices
 * @returns Center point coordinates
 */
export function calculatePolygonCenter(points: Point2D[]): Point2D {
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
 * Filter snap points by proximity to cursor
 *
 * @param snapPoints - Array of snap points to filter
 * @param cursor - Current cursor position
 * @param radius - Maximum snap radius
 * @returns Filtered array of nearby snap points
 */
export function filterSnapPointsByProximity(
  snapPoints: SnapPoint[],
  cursor: Point2D,
  radius: number
): SnapPoint[] {
  return snapPoints.filter(point =>
    validateSnapPointProximity(point, cursor, radius)
  );
}

/**
 * Find closest snap point to cursor
 *
 * @param snapPoints - Array of snap points
 * @param cursor - Current cursor position
 * @returns Closest snap point or null if array is empty
 */
export function findClosestSnapPoint(
  snapPoints: SnapPoint[],
  cursor: Point2D
): SnapPoint | null {
  if (snapPoints.length === 0) return null;

  let closest = snapPoints[0];
  let minDistance = calculateDistance(cursor, closest.position);

  for (let i = 1; i < snapPoints.length; i++) {
    const distance = calculateDistance(cursor, snapPoints[i].position);
    if (distance < minDistance) {
      minDistance = distance;
      closest = snapPoints[i];
    }
  }

  return closest;
}
