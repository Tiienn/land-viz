/**
 * Geometric transformation utilities
 * Provides functions for rotating, scaling, and transforming points
 */

import type { Point2D } from '../types';

/**
 * Apply rotation transform to a set of points
 * @param points - Array of 2D points to transform
 * @param rotation - Rotation metadata containing angle and center point
 * @returns Transformed points in world coordinates
 */
export const applyRotationTransform = (
  points: Point2D[],
  rotation?: { angle: number; center: Point2D }
): Point2D[] => {
  if (!rotation || rotation.angle === 0) return points;

  const { angle, center } = rotation;
  const angleRadians = (angle * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return points.map(point => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: center.x + (dx * cos - dy * sin),
      y: center.y + (dx * sin + dy * cos)
    };
  });
};

/**
 * Get world-space points for a shape (applies rotation if present)
 * @param shape - Shape with points and optional rotation metadata
 * @returns Points in world coordinate system
 */
export const getWorldPoints = (shape: { points: Point2D[]; rotation?: { angle: number; center: Point2D } }): Point2D[] => {
  return applyRotationTransform(shape.points, shape.rotation);
};

/**
 * Calculate axis-aligned bounding box for a set of points
 * @param points - Array of 2D points
 * @returns Bounding box with min/max coordinates
 */
export const calculateBoundingBox = (points: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number } => {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxX = Math.max(...points.map(p => p.x));
  const maxY = Math.max(...points.map(p => p.y));

  return { minX, minY, maxX, maxY };
};
