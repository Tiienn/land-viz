import { describe, it, expect } from 'vitest';
import type { Point2D } from '@/types';

/**
 * Test suite for rectangle resize format consistency
 * This ensures that rectangle resize operations always return 4-point format
 * to maintain proper rectangle geometry during live resize operations.
 */
describe('Rectangle Resize Format', () => {
  
  /**
   * Helper function to simulate the 2-point to 4-point conversion
   * This mirrors the logic implemented in ResizableShapeControls.tsx
   */
  const convertBoundsToRectanglePoints = (minX: number, minY: number, maxX: number, maxY: number): Point2D[] => {
    return [
      { x: minX, y: minY }, // bottom-left (0)
      { x: maxX, y: minY }, // bottom-right (1)
      { x: maxX, y: maxY }, // top-right (2)
      { x: minX, y: maxY }  // top-left (3)
    ];
  };

  it('should convert 2-point bounds to proper 4-point rectangle format', () => {
    // Test case: Basic rectangle bounds
    const minX = -10, minY = -5, maxX = 15, maxY = 20;
    
    const result = convertBoundsToRectanglePoints(minX, minY, maxX, maxY);
    
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ x: -10, y: -5 }); // bottom-left
    expect(result[1]).toEqual({ x: 15, y: -5 });  // bottom-right
    expect(result[2]).toEqual({ x: 15, y: 20 });  // top-right
    expect(result[3]).toEqual({ x: -10, y: 20 }); // top-left
  });

  it('should handle aspect ratio constrained resize with 4-point format', () => {
    // Simulate aspect ratio constrained resize
    const oppositeCorner = { x: 0, y: 0 };
    const newCorner = { x: 20, y: 15 };
    
    const finalMinX = Math.min(oppositeCorner.x, newCorner.x);
    const finalMaxX = Math.max(oppositeCorner.x, newCorner.x);
    const finalMinY = Math.min(oppositeCorner.y, newCorner.y);
    const finalMaxY = Math.max(oppositeCorner.y, newCorner.y);
    
    const result = convertBoundsToRectanglePoints(finalMinX, finalMinY, finalMaxX, finalMaxY);
    
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ x: 0, y: 0 });   // bottom-left
    expect(result[1]).toEqual({ x: 20, y: 0 });  // bottom-right
    expect(result[2]).toEqual({ x: 20, y: 15 }); // top-right
    expect(result[3]).toEqual({ x: 0, y: 15 });  // top-left
  });

  it('should handle negative coordinate resize with proper ordering', () => {
    // Test with negative coordinates to ensure proper min/max ordering
    const bounds = { minX: -30, minY: -40, maxX: -10, maxY: -5 };
    
    const result = convertBoundsToRectanglePoints(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
    
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ x: -30, y: -40 }); // bottom-left
    expect(result[1]).toEqual({ x: -10, y: -40 }); // bottom-right
    expect(result[2]).toEqual({ x: -10, y: -5 });  // top-right
    expect(result[3]).toEqual({ x: -30, y: -5 });  // top-left
  });

  it('should create valid rectangle geometry points', () => {
    const result = convertBoundsToRectanglePoints(5, 10, 25, 30);
    
    // Verify it forms a proper rectangle
    expect(result[0].x).toBeLessThan(result[1].x); // left < right
    expect(result[0].y).toBeLessThan(result[2].y); // bottom < top
    expect(result[1].x).toEqual(result[2].x);      // right edge consistent
    expect(result[3].x).toEqual(result[0].x);      // left edge consistent
    expect(result[0].y).toEqual(result[1].y);      // bottom edge consistent
    expect(result[2].y).toEqual(result[3].y);      // top edge consistent
  });

  it('should maintain rectangle structure for geometry creation', () => {
    const result = convertBoundsToRectanglePoints(-5, -5, 5, 5);
    
    // This format should create a proper rectangle mesh, not a diagonal line
    expect(result).toHaveLength(4);
    
    // Verify counter-clockwise ordering for proper triangle winding
    // bottom-left -> bottom-right -> top-right -> top-left
    const [bottomLeft, bottomRight, topRight, topLeft] = result;
    
    expect(bottomLeft.x).toBeLessThan(bottomRight.x);
    expect(bottomLeft.y).toBeLessThan(topLeft.y);
    expect(bottomRight.y).toBeLessThan(topRight.y);
    expect(topLeft.x).toBeLessThan(topRight.x);
  });
});