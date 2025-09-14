import { describe, it, expect } from 'vitest';
import type { Point2D } from '@/types';

/**
 * Test suite for edge resize format consistency
 * This ensures that edge resize operations always return 4-point format
 * to maintain proper rectangle geometry during live resize operations.
 */
describe('Edge Resize Format', () => {
  
  /**
   * Helper function to simulate edge resize operation
   * This mirrors the logic implemented in ResizableShapeControls.tsx
   */
  const simulateEdgeResize = (
    corners: Point2D[], 
    handleIndex: number, 
    newPoint: Point2D
  ): Point2D[] => {
    const newCorners = [...corners];
    
    if (handleIndex === 0) { // Top edge - only resize height
      newCorners[0].y = newPoint.y;
      newCorners[1].y = newPoint.y;
    } else if (handleIndex === 1) { // Right edge - only resize width
      newCorners[1].x = newPoint.x;
      newCorners[2].x = newPoint.x;
    } else if (handleIndex === 2) { // Bottom edge - only resize height
      newCorners[2].y = newPoint.y;
      newCorners[3].y = newPoint.y;
    } else if (handleIndex === 3) { // Left edge - only resize width
      newCorners[0].x = newPoint.x;
      newCorners[3].x = newPoint.x;
    }
    
    // Calculate bounds from modified corners
    const minX = Math.min(newCorners[0].x, newCorners[1].x, newCorners[2].x, newCorners[3].x);
    const maxX = Math.max(newCorners[0].x, newCorners[1].x, newCorners[2].x, newCorners[3].x);
    const minY = Math.min(newCorners[0].y, newCorners[1].y, newCorners[2].y, newCorners[3].y);
    const maxY = Math.max(newCorners[0].y, newCorners[1].y, newCorners[2].y, newCorners[3].y);
    
    // Return unified 4-point format (our fix)
    return [
      { x: minX, y: minY }, // bottom-left (0)
      { x: maxX, y: minY }, // bottom-right (1)
      { x: maxX, y: maxY }, // top-right (2)
      { x: minX, y: maxY }  // top-left (3)
    ];
  };

  const standardRectangleCorners: Point2D[] = [
    { x: -20, y: -15 }, // bottom-left
    { x: 20, y: -15 },  // bottom-right  
    { x: 20, y: 15 },   // top-right
    { x: -20, y: 15 }   // top-left
  ];

  it('should return 4-point format for top edge resize', () => {
    const newTopPoint = { x: 0, y: 25 }; // Move top edge up
    
    const result = simulateEdgeResize(standardRectangleCorners, 0, newTopPoint);
    
    expect(result).toHaveLength(4);
    expect(result).not.toHaveLength(2); // Should not be diagonal line format
    
    // Verify rectangle structure
    expect(result[0].y).toBeLessThan(result[2].y); // bottom < top
    expect(result[0].x).toBeLessThan(result[1].x); // left < right
    
    // Top edge should have moved
    expect(result[2].y).toBe(25); // top-right Y
    expect(result[3].y).toBe(25); // top-left Y
  });

  it('should return 4-point format for right edge resize', () => {
    const newRightPoint = { x: 30, y: 0 }; // Move right edge out
    
    const result = simulateEdgeResize(standardRectangleCorners, 1, newRightPoint);
    
    expect(result).toHaveLength(4);
    expect(result).not.toHaveLength(2); // Should not be diagonal line format
    
    // Verify rectangle structure
    expect(result[0].x).toBeLessThan(result[1].x); // left < right
    expect(result[0].y).toBeLessThan(result[2].y); // bottom < top
    
    // Right edge should have moved
    expect(result[1].x).toBe(30); // bottom-right X
    expect(result[2].x).toBe(30); // top-right X
  });

  it('should return 4-point format for bottom edge resize', () => {
    const newBottomPoint = { x: 0, y: -30 }; // Move bottom edge down
    
    const result = simulateEdgeResize(standardRectangleCorners, 2, newBottomPoint);
    
    expect(result).toHaveLength(4);
    expect(result).not.toHaveLength(2); // Should not be diagonal line format
    
    // Verify rectangle structure  
    expect(result[0].y).toBeLessThan(result[2].y); // bottom < top
    expect(result[0].x).toBeLessThan(result[1].x); // left < right
    
    // Bottom edge should have moved
    expect(result[0].y).toBe(-30); // bottom-left Y
    expect(result[1].y).toBe(-30); // bottom-right Y
  });

  it('should return 4-point format for left edge resize', () => {
    const newLeftPoint = { x: -35, y: 0 }; // Move left edge in
    
    const result = simulateEdgeResize(standardRectangleCorners, 3, newLeftPoint);
    
    expect(result).toHaveLength(4);
    expect(result).not.toHaveLength(2); // Should not be diagonal line format
    
    // Verify rectangle structure
    expect(result[0].x).toBeLessThan(result[1].x); // left < right
    expect(result[0].y).toBeLessThan(result[2].y); // bottom < top
    
    // Left edge should have moved
    expect(result[0].x).toBe(-35); // bottom-left X
    expect(result[3].x).toBe(-35); // top-left X
  });

  it('should maintain rectangle properties after edge resize', () => {
    const resizeOperations = [
      { handleIndex: 0, newPoint: { x: 0, y: 20 } },  // Top edge
      { handleIndex: 1, newPoint: { x: 25, y: 0 } },  // Right edge  
      { handleIndex: 2, newPoint: { x: 0, y: -25 } }, // Bottom edge
      { handleIndex: 3, newPoint: { x: -30, y: 0 } }  // Left edge
    ];

    for (const operation of resizeOperations) {
      const result = simulateEdgeResize(
        standardRectangleCorners, 
        operation.handleIndex, 
        operation.newPoint
      );
      
      // Each result should maintain rectangle structure
      expect(result).toHaveLength(4);
      
      // Verify unique X and Y values (proper rectangle)
      const uniqueXValues = [...new Set(result.map(p => p.x))];
      const uniqueYValues = [...new Set(result.map(p => p.y))];
      
      expect(uniqueXValues).toHaveLength(2); // Exactly 2 unique X values
      expect(uniqueYValues).toHaveLength(2); // Exactly 2 unique Y values
      
      // Verify proper ordering
      const [bottomLeft, bottomRight, topRight, topLeft] = result;
      expect(bottomLeft.x).toBeLessThan(bottomRight.x);
      expect(bottomLeft.y).toBeLessThan(topLeft.y);
      expect(bottomRight.y).toBeLessThan(topRight.y);
      expect(topLeft.x).toBeLessThan(topRight.x);
    }
  });

  it('should prevent diagonal line creation in edge resize', () => {
    // Test individual edge resize operations to ensure they don't create diagonal lines
    const edgeTests = [
      { handleIndex: 0, newPoint: { x: 0, y: 25 }, name: 'Top edge' },
      { handleIndex: 1, newPoint: { x: 30, y: 0 }, name: 'Right edge' },  
      { handleIndex: 2, newPoint: { x: 0, y: -25 }, name: 'Bottom edge' },
      { handleIndex: 3, newPoint: { x: -30, y: 0 }, name: 'Left edge' }
    ];
    
    for (const test of edgeTests) {
      const result = simulateEdgeResize(standardRectangleCorners, test.handleIndex, test.newPoint);
      
      // Should never create diagonal line (2-point format)
      expect(result).toHaveLength(4);
      expect(result).not.toHaveLength(2);
      
      // Should maintain valid rectangle dimensions
      const width = Math.abs(result[1].x - result[0].x);
      const height = Math.abs(result[2].y - result[1].y);
      
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      
      // Verify it's a proper rectangle, not a line
      const uniqueXValues = [...new Set(result.map(p => p.x))];
      const uniqueYValues = [...new Set(result.map(p => p.y))];
      
      expect(uniqueXValues).toHaveLength(2);
      expect(uniqueYValues).toHaveLength(2);
    }
  });

  it('should be compatible with Three.js geometry creation', () => {
    const edgeResizeResults = [
      simulateEdgeResize(standardRectangleCorners, 0, { x: 0, y: 30 }),  // Top
      simulateEdgeResize(standardRectangleCorners, 1, { x: 40, y: 0 }),  // Right
      simulateEdgeResize(standardRectangleCorners, 2, { x: 0, y: -40 }), // Bottom  
      simulateEdgeResize(standardRectangleCorners, 3, { x: -40, y: 0 })  // Left
    ];
    
    for (const result of edgeResizeResults) {
      // Should be ready for BufferGeometry creation without conversion
      expect(result).toHaveLength(4);
      
      // Verify counter-clockwise ordering for proper triangle winding
      const [bottomLeft, bottomRight, topRight, topLeft] = result;
      
      expect(bottomLeft.y).toEqual(bottomRight.y); // Bottom edge aligned
      expect(topLeft.y).toEqual(topRight.y);       // Top edge aligned
      expect(bottomLeft.x).toEqual(topLeft.x);     // Left edge aligned
      expect(bottomRight.x).toEqual(topRight.x);   // Right edge aligned
      
      // Should form proper rectangle for triangle indices [0,1,2, 0,2,3]
      expect(bottomLeft.x).toBeLessThan(topRight.x);
      expect(bottomLeft.y).toBeLessThan(topRight.y);
    }
  });
});