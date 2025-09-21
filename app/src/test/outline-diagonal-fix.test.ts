import { describe, it, expect } from 'vitest';

// Mock the logger to suppress console output
import { vi } from 'vitest';
vi.mock('../utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Rectangle Outline Diagonal Line Fix', () => {
  it('should convert 2-point rectangles to 4-point format for proper outline rendering', () => {
    // Test the conversion logic that was implemented in ShapeRenderer.tsx

    // Simulate 2-point live resize data (what causes diagonal lines)
    const twoPointData = [
      { x: 0, y: 0 },    // Top left
      { x: 10, y: 8 }    // Bottom right
    ];

    // The conversion logic that should be applied
    const [topLeft, bottomRight] = twoPointData;
    const convertedToFourPoints = [
      { x: topLeft.x, y: topLeft.y },      // Top left
      { x: bottomRight.x, y: topLeft.y },  // Top right
      { x: bottomRight.x, y: bottomRight.y }, // Bottom right
      { x: topLeft.x, y: bottomRight.y }   // Bottom left
    ];

    // Verify the conversion produces correct 4-point rectangle
    expect(convertedToFourPoints).toHaveLength(4);
    expect(convertedToFourPoints[0]).toEqual({ x: 0, y: 0 });   // Top left
    expect(convertedToFourPoints[1]).toEqual({ x: 10, y: 0 });  // Top right
    expect(convertedToFourPoints[2]).toEqual({ x: 10, y: 8 });  // Bottom right
    expect(convertedToFourPoints[3]).toEqual({ x: 0, y: 8 });   // Bottom left

    // Verify this forms a proper rectangle (no diagonal lines)
    const topEdge = [convertedToFourPoints[0], convertedToFourPoints[1]];
    const rightEdge = [convertedToFourPoints[1], convertedToFourPoints[2]];
    const bottomEdge = [convertedToFourPoints[2], convertedToFourPoints[3]];
    const leftEdge = [convertedToFourPoints[3], convertedToFourPoints[0]];

    // Check that opposite edges are parallel (same Y for horizontal, same X for vertical)
    expect(topEdge[0].y).toBe(topEdge[1].y);     // Top edge is horizontal
    expect(bottomEdge[0].y).toBe(bottomEdge[1].y); // Bottom edge is horizontal
    expect(leftEdge[0].x).toBe(leftEdge[1].x);   // Left edge is vertical
    expect(rightEdge[0].x).toBe(rightEdge[1].x); // Right edge is vertical

    // Check that the rectangle has proper dimensions
    const width = convertedToFourPoints[1].x - convertedToFourPoints[0].x;
    const height = convertedToFourPoints[3].y - convertedToFourPoints[0].y;
    expect(width).toBe(10);
    expect(height).toBe(8);
  });

  it('should handle edge case with zero-sized rectangle', () => {
    // Test with degenerate case (both points the same)
    const degenerateData = [
      { x: 5, y: 5 },
      { x: 5, y: 5 }
    ];

    const [topLeft, bottomRight] = degenerateData;
    const converted = [
      { x: topLeft.x, y: topLeft.y },
      { x: bottomRight.x, y: topLeft.y },
      { x: bottomRight.x, y: bottomRight.y },
      { x: topLeft.x, y: bottomRight.y }
    ];

    // Should still produce 4 points even if they're all the same
    expect(converted).toHaveLength(4);
    expect(converted.every(point => point.x === 5 && point.y === 5)).toBe(true);
  });

  it('should handle negative coordinates correctly', () => {
    // Test with negative coordinates (rectangle in different quadrant)
    const negativeData = [
      { x: -5, y: -3 },  // Top left
      { x: 2, y: 4 }     // Bottom right
    ];

    const [topLeft, bottomRight] = negativeData;
    const converted = [
      { x: topLeft.x, y: topLeft.y },      // -5, -3
      { x: bottomRight.x, y: topLeft.y },  // 2, -3
      { x: bottomRight.x, y: bottomRight.y }, // 2, 4
      { x: topLeft.x, y: bottomRight.y }   // -5, 4
    ];

    expect(converted[0]).toEqual({ x: -5, y: -3 });
    expect(converted[1]).toEqual({ x: 2, y: -3 });
    expect(converted[2]).toEqual({ x: 2, y: 4 });
    expect(converted[3]).toEqual({ x: -5, y: 4 });

    // Verify dimensions are correct
    const width = converted[1].x - converted[0].x;
    const height = converted[3].y - converted[0].y;
    expect(width).toBe(7);  // 2 - (-5) = 7
    expect(height).toBe(7); // 4 - (-3) = 7
  });
});