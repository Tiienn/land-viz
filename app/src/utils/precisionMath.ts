import { Vector3 } from 'three';

// Define Point2D interface locally to avoid import issues
interface Point2D {
  x: number;
  y: number;
}

/**
 * Calculate normalized direction vector between two points
 */
export const calculateDirection = (
  startPoint: Point2D,
  targetPoint: Point2D
): Point2D => {
  const dx = targetPoint.x - startPoint.x;
  const dy = targetPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return { x: 1, y: 0 }; // Default to positive X direction
  }

  return {
    x: dx / length,
    y: dy / length
  };
};

/**
 * Apply distance along direction vector from start point
 */
export const applyDistance = (
  startPoint: Point2D,
  direction: Point2D,
  distance: number
): Point2D => {
  return {
    x: startPoint.x + direction.x * distance,
    y: startPoint.y + direction.y * distance
  };
};

/**
 * Calculate distance between two points
 */
export const calculateDistance = (
  pointA: Point2D,
  pointB: Point2D
): number => {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Format distance for display
 */
export const formatDistance = (distance: number): string => {
  return `${distance.toFixed(2)}m`;
};

/**
 * Parse user input to distance number
 */
export const parseDistance = (input: string): number | null => {
  const cleaned = input.replace(/[^\d.-]/g, ''); // Remove non-numeric characters except decimal point and minus
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

/**
 * Validate distance input
 */
export const validateDistanceInput = (input: string): boolean => {
  if (input.trim() === '') return true; // Allow empty input

  const distance = parseDistance(input);
  return distance !== null && distance > 0 && distance <= 10000; // Max 10km for reasonable bounds
};

/**
 * Convert Vector3 to Point2D (dropping Z coordinate)
 */
export const vector3ToPoint2D = (vector: Vector3): Point2D => {
  return { x: vector.x, y: vector.z }; // Note: Z in 3D becomes Y in 2D plane
};

/**
 * Convert Point2D to Vector3 (setting Y to ground level)
 */
export const point2DToVector3 = (point: Point2D, groundY: number = 0): Vector3 => {
  return new Vector3(point.x, groundY, point.y); // Note: Y in 2D plane becomes Z in 3D
};