import type { Point2D } from '../types';
import { logger } from './logger';

/**
 * Calculate the bounding box and center of a set of points
 */
export const calculateBoundingBox = (
  points: Point2D[]
): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
} => {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, centerX: 0, centerY: 0 };
  }

  // Find min/max X and Y coordinates
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  // Calculate center
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  logger.info('[FlipUtils] Bounding box calculated', { centerX, centerY });
  return { minX, maxX, minY, maxY, centerX, centerY };
};

/**
 * Flip points horizontally (mirror across vertical axis)
 * Each point is mirrored across a vertical line passing through the shape's center
 */
export const flipPointsHorizontally = (points: Point2D[]): Point2D[] => {
  if (points.length === 0) return points;

  const { centerX } = calculateBoundingBox(points);

  // Mirror each point across vertical axis at centerX
  // Formula: newX = 2 * centerX - oldX
  const flippedPoints = points.map(point => ({
    x: 2 * centerX - point.x,  // Mirror X coordinate
    y: point.y                  // Y unchanged
  }));

  logger.info('[FlipUtils] Flipped points horizontally', { count: points.length, centerX });
  return flippedPoints;
};

/**
 * Flip points vertically (mirror across horizontal axis)
 * Each point is mirrored across a horizontal line passing through the shape's center
 */
export const flipPointsVertically = (points: Point2D[]): Point2D[] => {
  if (points.length === 0) return points;

  const { centerY } = calculateBoundingBox(points);

  // Mirror each point across horizontal axis at centerY
  // Formula: newY = 2 * centerY - oldY
  const flippedPoints = points.map(point => ({
    x: point.x,                 // X unchanged
    y: 2 * centerY - point.y   // Mirror Y coordinate
  }));

  logger.info('[FlipUtils] Flipped points vertically', { count: points.length, centerY });
  return flippedPoints;
};
