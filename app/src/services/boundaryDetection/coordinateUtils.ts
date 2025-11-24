/**
 * Coordinate Transformation Utilities
 *
 * Convert between image pixel coordinates and world coordinates (meters).
 * Handles scaling, rotation, and origin transformation.
 */

import type { ScaleCalibration, DetectedBoundary } from './types';
import type { Shape, Point2D } from '../../types';

/**
 * Transform point from image coordinates to world coordinates
 *
 * @param imagePoint - Point in image coordinates (pixels from top-left)
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @param scale - Scale calibration data
 * @returns Point in world coordinates (meters from center)
 */
export function imageToWorldCoordinates(
  imagePoint: [number, number],
  imageWidth: number,
  imageHeight: number,
  scale: ScaleCalibration
): [number, number, number] {
  const [imageX, imageY] = imagePoint;

  // Validate inputs
  if (!Number.isFinite(imageX) || !Number.isFinite(imageY)) {
    console.warn(`[BoundaryDetection] Invalid image point: [${imageX}, ${imageY}]`);
    return [0, 0, 0];
  }

  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
    console.warn(`[BoundaryDetection] Invalid image dimensions: ${imageWidth}x${imageHeight}`);
    return [0, 0, 0];
  }

  if (!Number.isFinite(scale.pixelsPerMeter) || scale.pixelsPerMeter <= 0) {
    console.warn(`[BoundaryDetection] Invalid scale: ${scale.pixelsPerMeter} pixels per meter`);
    return [0, 0, 0];
  }

  // Calculate image center
  const centerX = imageWidth / 2;
  const centerY = imageHeight / 2;

  // Translate to center-origin coordinates
  const centeredX = imageX - centerX;
  const centeredY = imageY - centerY;

  // Convert pixels to meters
  const worldX = centeredX / scale.pixelsPerMeter;
  const worldZ = centeredY / scale.pixelsPerMeter; // Z in 3D (Y is up)

  // In 3D: X=horizontal, Y=vertical (elevation), Z=depth
  // For 2D ground plane, Y=0
  return [worldX, 0, worldZ];
}

/**
 * Calculate scale from two reference points
 *
 * @param point1 - First reference point in image coordinates
 * @param point2 - Second reference point in image coordinates
 * @param realWorldDistance - Known distance between points (in meters)
 * @param unit - User-provided unit (for display only)
 * @returns Scale calibration data
 */
export function calculateScale(
  point1: [number, number],
  point2: [number, number],
  realWorldDistance: number,
  unit: string = 'meters'
): ScaleCalibration {
  // Calculate pixel distance
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);

  // Calculate pixels per meter
  const pixelsPerMeter = pixelDistance / realWorldDistance;

  return {
    imagePoint1: point1,
    imagePoint2: point2,
    realWorldDistance,
    pixelsPerMeter,
    unit,
  };
}

/**
 * Convert detected boundary to drawable shape
 *
 * @param boundary - Detected boundary from OpenCV processing
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @param scale - Scale calibration
 * @returns Shape object for scene rendering
 */
export function boundaryToShape(
  boundary: DetectedBoundary,
  imageWidth: number,
  imageHeight: number,
  scale: ScaleCalibration
): Shape {
  // Transform all points to world coordinates and filter out invalid points
  const worldPoints: Point2D[] = boundary.points
    .map((pt) => {
      const [x, y, z] = imageToWorldCoordinates(
        pt,
        imageWidth,
        imageHeight,
        scale
      );
      return { x, y: z }; // Point2D objects for shape (X, Z in world space becomes x, y)
    })
    .filter((pt) => Number.isFinite(pt.x) && Number.isFinite(pt.y));

  // Generate unique ID
  const id = `imported-${boundary.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Validate we have points
  if (worldPoints.length === 0) {
    console.warn(`[BoundaryDetection] Boundary ${boundary.id} has no points, skipping`);
    // Return a minimal valid shape that won't crash
    return {
      id,
      type: 'polyline',
      points: [{ x: 0, y: 0 }],
      closed: true,
      color: '#00C4CC',
    };
  }

  // Create shape based on detected type
  switch (boundary.type) {
    case 'rectangle': {
      // For rectangles, we need at least 3 points to extract dimensions
      if (worldPoints.length < 3) {
        console.warn(`[BoundaryDetection] Rectangle ${boundary.id} has insufficient points (${worldPoints.length}), converting to polyline`);
        return {
          id,
          type: 'polyline',
          points: worldPoints,
          closed: true,
          color: '#00C4CC',
        };
      }

      const [p1, p2, p3] = worldPoints;
      const width = Math.abs(p2.x - p1.x);
      const height = Math.abs(p3.y - p1.y);
      const centerX = (p1.x + p2.x) / 2;
      const centerY = (p1.y + p3.y) / 2;

      // Validate the calculated values
      if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(centerX) || !Number.isFinite(centerY)) {
        console.warn(`[BoundaryDetection] Rectangle ${boundary.id} has invalid dimensions, converting to polyline`);
        return {
          id,
          type: 'polyline',
          points: worldPoints,
          closed: true,
          color: '#00C4CC',
        };
      }

      return {
        id,
        type: 'rectangle',
        x: centerX,
        y: centerY,
        width,
        height,
        rotation: 0,
        color: '#00C4CC', // Brand teal
      };
    }

    case 'circle': {
      // For circles, calculate center and radius
      const centerX =
        worldPoints.reduce((sum, pt) => sum + pt.x, 0) / worldPoints.length;
      const centerY =
        worldPoints.reduce((sum, pt) => sum + pt.y, 0) / worldPoints.length;

      // Average distance from center to all points
      const radius =
        worldPoints.reduce((sum, pt) => {
          const dx = pt.x - centerX;
          const dy = pt.y - centerY;
          return sum + Math.sqrt(dx * dx + dy * dy);
        }, 0) / worldPoints.length;

      // Validate the calculated values
      if (!Number.isFinite(centerX) || !Number.isFinite(centerY) || !Number.isFinite(radius) || radius <= 0) {
        console.warn(`[BoundaryDetection] Circle ${boundary.id} has invalid dimensions, converting to polyline`);
        return {
          id,
          type: 'polyline',
          points: worldPoints,
          closed: true,
          color: '#00C4CC',
        };
      }

      return {
        id,
        type: 'circle',
        x: centerX,
        y: centerY,
        radius,
        color: '#00C4CC',
      };
    }

    case 'polygon':
    default: {
      // Polyline/polygon with all transformed points
      return {
        id,
        type: 'polyline',
        points: worldPoints,
        closed: true, // Property boundaries are closed
        color: '#00C4CC',
      };
    }
  }
}

/**
 * Batch convert multiple boundaries to shapes
 *
 * @param boundaries - Array of detected boundaries
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @param scale - Scale calibration
 * @returns Array of shape objects ready for import
 */
export function boundariesToShapes(
  boundaries: DetectedBoundary[],
  imageWidth: number,
  imageHeight: number,
  scale: ScaleCalibration
): Shape[] {
  const shapes = boundaries
    .map((boundary) =>
      boundaryToShape(boundary, imageWidth, imageHeight, scale)
    )
    .filter((shape) => {
      // Filter out invalid shapes
      if (shape.type === 'rectangle') {
        return (
          Number.isFinite(shape.x) &&
          Number.isFinite(shape.y) &&
          Number.isFinite(shape.width) &&
          Number.isFinite(shape.height) &&
          shape.width > 0 &&
          shape.height > 0
        );
      } else if (shape.type === 'circle') {
        return (
          Number.isFinite(shape.x) &&
          Number.isFinite(shape.y) &&
          Number.isFinite(shape.radius) &&
          shape.radius > 0
        );
      } else if (shape.type === 'polyline') {
        return (
          shape.points &&
          shape.points.length >= 2 &&
          shape.points.every((pt: any) => Number.isFinite(pt.x) && Number.isFinite(pt.y))
        );
      }
      return false;
    });

  console.log(`[BoundaryDetection] Converted ${shapes.length}/${boundaries.length} boundaries to valid shapes`);
  return shapes;
}

/**
 * Calculate bounding box for boundaries (in world coordinates)
 *
 * Useful for centering camera on imported boundaries
 *
 * @param boundaries - Array of shapes
 * @returns Bounding box { minX, maxX, minY, maxY, width, height }
 */
export function calculateBoundingBox(shapes: Shape[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  if (shapes.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    if (shape.type === 'rectangle') {
      const halfWidth = shape.width / 2;
      const halfHeight = shape.height / 2;
      minX = Math.min(minX, shape.x - halfWidth);
      maxX = Math.max(maxX, shape.x + halfWidth);
      minY = Math.min(minY, shape.y - halfHeight);
      maxY = Math.max(maxY, shape.y + halfHeight);
    } else if (shape.type === 'circle') {
      minX = Math.min(minX, shape.x - shape.radius);
      maxX = Math.max(maxX, shape.x + shape.radius);
      minY = Math.min(minY, shape.y - shape.radius);
      maxY = Math.max(maxY, shape.y + shape.radius);
    } else if (shape.type === 'polyline' && shape.points) {
      shape.points.forEach((pt: any) => {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
      });
    }
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return { minX, maxX, minY, maxY, width, height, centerX, centerY };
}

/**
 * Convert unit string to meters
 *
 * @param value - Numeric value
 * @param unit - Unit string (feet, meters, yards, etc.)
 * @returns Value in meters
 */
export function convertToMeters(value: number, unit: string): number {
  const lowerUnit = unit.toLowerCase().trim();

  switch (lowerUnit) {
    case 'meter':
    case 'meters':
    case 'm':
      return value;

    case 'foot':
    case 'feet':
    case 'ft':
      return value * 0.3048;

    case 'yard':
    case 'yards':
    case 'yd':
      return value * 0.9144;

    case 'inch':
    case 'inches':
    case 'in':
      return value * 0.0254;

    case 'mile':
    case 'miles':
    case 'mi':
      return value * 1609.34;

    case 'kilometer':
    case 'kilometers':
    case 'km':
      return value * 1000;

    case 'centimeter':
    case 'centimeters':
    case 'cm':
      return value * 0.01;

    default:
      console.warn(`Unknown unit "${unit}", assuming meters`);
      return value;
  }
}
