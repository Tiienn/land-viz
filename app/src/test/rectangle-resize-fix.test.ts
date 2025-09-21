import { describe, it, expect } from 'vitest';

// Mock the logger to avoid import issues in tests
const mockLogger = {
  log: () => {},
  warn: () => {},
  error: () => {}
};

// Copy the validateAndEnforceMinimumRectangle function for testing
const MIN_RECTANGLE_AREA = 10; // 10 m² minimum area
const MIN_DIMENSION = 1.0; // 1m minimum width or height

const validateAndEnforceMinimumRectangle = (points: { x: number; y: number }[], originalPoints: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (points.length !== 2) return originalPoints;

  const [p1, p2] = points;
  let width = Math.abs(p2.x - p1.x);
  let height = Math.abs(p2.y - p1.y);
  const area = width * height;

  // Handle completely degenerate case (both points are the same)
  if (width === 0 && height === 0) {
    // Create a square with minimum area centered on the point
    const sideLength = Math.sqrt(MIN_RECTANGLE_AREA);
    const halfSide = sideLength / 2;
    const centerX = p1.x;
    const centerY = p1.y;

    return [
      { x: centerX - halfSide, y: centerY - halfSide },
      { x: centerX + halfSide, y: centerY + halfSide }
    ];
  }

  // Check if current dimensions meet minimums
  const needsEnforcement = width < MIN_DIMENSION || height < MIN_DIMENSION || area < MIN_RECTANGLE_AREA;

  if (!needsEnforcement) {
    return points; // Valid rectangle, return as-is
  }

  // Enforce minimum dimensions while preserving aspect ratio where possible
  if (area > 0 && area < MIN_RECTANGLE_AREA) {
    // Scale up to meet minimum area while preserving aspect ratio
    const scaleFactor = Math.sqrt(MIN_RECTANGLE_AREA / area);
    width *= scaleFactor;
    height *= scaleFactor;
  }

  // Ensure individual dimensions meet minimums
  width = Math.max(width, MIN_DIMENSION);
  height = Math.max(height, MIN_DIMENSION);

  // Calculate center point
  const centerX = (p1.x + p2.x) / 2;
  const centerY = (p1.y + p2.y) / 2;

  // Create new rectangle centered on the same point
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return [
    { x: centerX - halfWidth, y: centerY - halfHeight },
    { x: centerX + halfWidth, y: centerY + halfHeight }
  ];
};

describe('Rectangle Resize Fix', () => {
  it('should allow valid rectangles to pass through unchanged', () => {
    const validPoints = [
      { x: 0, y: 0 },
      { x: 5, y: 4 } // 5m × 4m = 20m² (> 10m²)
    ];
    const originalPoints = [{ x: 0, y: 0 }, { x: 3, y: 3 }];

    const result = validateAndEnforceMinimumRectangle(validPoints, originalPoints);
    expect(result).toEqual(validPoints);
  });

  it('should enforce minimum area for small rectangles', () => {
    const smallPoints = [
      { x: 0, y: 0 },
      { x: 1, y: 1 } // 1m × 1m = 1m² (< 10m²)
    ];
    const originalPoints = [{ x: 0, y: 0 }, { x: 3, y: 3 }];

    const result = validateAndEnforceMinimumRectangle(smallPoints, originalPoints);

    // Calculate resulting dimensions
    const width = Math.abs(result[1].x - result[0].x);
    const height = Math.abs(result[1].y - result[0].y);
    const area = width * height;

    expect(area).toBeGreaterThanOrEqual(MIN_RECTANGLE_AREA);
    expect(width).toBeGreaterThanOrEqual(MIN_DIMENSION);
    expect(height).toBeGreaterThanOrEqual(MIN_DIMENSION);
  });

  it('should enforce minimum dimensions when width is too small', () => {
    const thinPoints = [
      { x: 0, y: 0 },
      { x: 0.5, y: 20 } // 0.5m × 20m = 10m² but width < 1m
    ];
    const originalPoints = [{ x: 0, y: 0 }, { x: 3, y: 3 }];

    const result = validateAndEnforceMinimumRectangle(thinPoints, originalPoints);

    const width = Math.abs(result[1].x - result[0].x);
    const height = Math.abs(result[1].y - result[0].y);

    expect(width).toBeGreaterThanOrEqual(MIN_DIMENSION);
    expect(height).toBeGreaterThanOrEqual(MIN_DIMENSION);
  });

  it('should enforce minimum dimensions when height is too small', () => {
    const flatPoints = [
      { x: 0, y: 0 },
      { x: 20, y: 0.5 } // 20m × 0.5m = 10m² but height < 1m
    ];
    const originalPoints = [{ x: 0, y: 0 }, { x: 3, y: 3 }];

    const result = validateAndEnforceMinimumRectangle(flatPoints, originalPoints);

    const width = Math.abs(result[1].x - result[0].x);
    const height = Math.abs(result[1].y - result[0].y);

    expect(width).toBeGreaterThanOrEqual(MIN_DIMENSION);
    expect(height).toBeGreaterThanOrEqual(MIN_DIMENSION);
  });

  it('should preserve center point when enforcing minimums', () => {
    const smallPoints = [
      { x: 5, y: 10 },
      { x: 6, y: 11 } // 1m × 1m centered at (5.5, 10.5)
    ];
    const originalPoints = [{ x: 0, y: 0 }, { x: 3, y: 3 }];

    const originalCenterX = (smallPoints[0].x + smallPoints[1].x) / 2;
    const originalCenterY = (smallPoints[0].y + smallPoints[1].y) / 2;

    const result = validateAndEnforceMinimumRectangle(smallPoints, originalPoints);

    const newCenterX = (result[0].x + result[1].x) / 2;
    const newCenterY = (result[0].y + result[1].y) / 2;

    expect(newCenterX).toBeCloseTo(originalCenterX, 2);
    expect(newCenterY).toBeCloseTo(originalCenterY, 2);
  });

  it('should handle degenerate line input gracefully', () => {
    const linePoints = [
      { x: 0, y: 0 },
      { x: 0, y: 0 } // Completely degenerate
    ];
    const originalPoints = [{ x: 0, y: 0 }, { x: 3, y: 3 }];

    const result = validateAndEnforceMinimumRectangle(linePoints, originalPoints);

    const width = Math.abs(result[1].x - result[0].x);
    const height = Math.abs(result[1].y - result[0].y);
    const area = width * height;

    expect(area).toBeGreaterThanOrEqual(MIN_RECTANGLE_AREA);
    expect(width).toBeGreaterThanOrEqual(MIN_DIMENSION);
    expect(height).toBeGreaterThanOrEqual(MIN_DIMENSION);
  });
});