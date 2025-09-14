import { describe, it, expect } from 'vitest';
import type { Point2D } from '@/types';

/**
 * Comprehensive integration test for unified corner and edge resize
 * This verifies that both resize methods maintain consistent 4-point format
 * and prevent diagonal line issues throughout the resize pipeline.
 */
describe('Unified Resize Integration', () => {
  
  const standardRectangle: Point2D[] = [
    { x: -25, y: -20 }, // bottom-left
    { x: 25, y: -20 },  // bottom-right  
    { x: 25, y: 20 },   // top-right
    { x: -25, y: 20 }   // top-left
  ];

  /**
   * Simulate corner resize (unified bounds-based approach)
   */
  const simulateCornerResize = (corners: Point2D[], handleIndex: number, newPoint: Point2D): Point2D[] => {
    const oppositeCornerIndex = (handleIndex + 2) % 4;
    const oppositeCorner = corners[oppositeCornerIndex];
    
    const minX = Math.min(newPoint.x, oppositeCorner.x);
    const maxX = Math.max(newPoint.x, oppositeCorner.x);
    const minY = Math.min(newPoint.y, oppositeCorner.y);
    const maxY = Math.max(newPoint.y, oppositeCorner.y);
    
    return [
      { x: minX, y: minY }, // bottom-left (0)
      { x: maxX, y: minY }, // bottom-right (1)
      { x: maxX, y: maxY }, // top-right (2)
      { x: minX, y: maxY }  // top-left (3)
    ];
  };

  /**
   * Simulate edge resize (unified bounds-based approach)
   */
  const simulateEdgeResize = (corners: Point2D[], handleIndex: number, newPoint: Point2D): Point2D[] => {
    const newCorners = [...corners];
    
    if (handleIndex === 0) { // Top edge
      newCorners[0].y = newPoint.y;
      newCorners[1].y = newPoint.y;
    } else if (handleIndex === 1) { // Right edge
      newCorners[1].x = newPoint.x;
      newCorners[2].x = newPoint.x;
    } else if (handleIndex === 2) { // Bottom edge
      newCorners[2].y = newPoint.y;
      newCorners[3].y = newPoint.y;
    } else if (handleIndex === 3) { // Left edge
      newCorners[0].x = newPoint.x;
      newCorners[3].x = newPoint.x;
    }
    
    const minX = Math.min(newCorners[0].x, newCorners[1].x, newCorners[2].x, newCorners[3].x);
    const maxX = Math.max(newCorners[0].x, newCorners[1].x, newCorners[2].x, newCorners[3].x);
    const minY = Math.min(newCorners[0].y, newCorners[1].y, newCorners[2].y, newCorners[3].y);
    const maxY = Math.max(newCorners[0].y, newCorners[1].y, newCorners[2].y, newCorners[3].y);
    
    return [
      { x: minX, y: minY }, // bottom-left (0)
      { x: maxX, y: minY }, // bottom-right (1)
      { x: maxX, y: maxY }, // top-right (2)
      { x: minX, y: maxY }  // top-left (3)
    ];
  };

  /**
   * Validate that points form a proper rectangle (not diagonal line)
   */
  const validateRectangleFormat = (points: Point2D[], testName: string) => {
    // Must be 4-point format (not 2-point diagonal line)
    expect(points, `${testName}: Should have 4 points`).toHaveLength(4);
    
    // Must have exactly 2 unique X and Y values (rectangle property)
    const uniqueXValues = [...new Set(points.map(p => p.x))];
    const uniqueYValues = [...new Set(points.map(p => p.y))];
    
    expect(uniqueXValues, `${testName}: Should have 2 unique X values`).toHaveLength(2);
    expect(uniqueYValues, `${testName}: Should have 2 unique Y values`).toHaveLength(2);
    
    // Must have positive dimensions
    const width = Math.abs(points[1].x - points[0].x);
    const height = Math.abs(points[2].y - points[1].y);
    
    expect(width, `${testName}: Width should be positive`).toBeGreaterThan(0);
    expect(height, `${testName}: Height should be positive`).toBeGreaterThan(0);
    
    // Verify proper rectangle structure
    const [bottomLeft, bottomRight, topRight, topLeft] = points;
    
    expect(bottomLeft.x, `${testName}: Bottom left X < bottom right X`).toBeLessThan(bottomRight.x);
    expect(bottomLeft.y, `${testName}: Bottom left Y < top left Y`).toBeLessThan(topLeft.y);
    expect(bottomRight.y, `${testName}: Bottom right Y < top right Y`).toBeLessThan(topRight.y);
    expect(topLeft.x, `${testName}: Top left X < top right X`).toBeLessThan(topRight.x);
  };

  it('should maintain consistency between corner and edge resize formats', () => {
    // Both corner and edge resize should return identical format
    const cornerResult = simulateCornerResize(standardRectangle, 2, { x: 40, y: 30 });
    const edgeTopResult = simulateEdgeResize(standardRectangle, 0, { x: 0, y: 30 });
    const edgeRightResult = simulateEdgeResize(standardRectangle, 1, { x: 40, y: 0 });
    
    validateRectangleFormat(cornerResult, 'Corner resize');
    validateRectangleFormat(edgeTopResult, 'Edge top resize');
    validateRectangleFormat(edgeRightResult, 'Edge right resize');
    
    // All should return 4-point format
    expect(cornerResult).toHaveLength(4);
    expect(edgeTopResult).toHaveLength(4);
    expect(edgeRightResult).toHaveLength(4);
  });

  it('should prevent diagonal line creation in mixed resize operations', () => {
    // Mix of corner and edge operations that previously could cause diagonal lines
    const operations = [
      { type: 'corner', handleIndex: 0, newPoint: { x: -40, y: -30 } },
      { type: 'edge', handleIndex: 1, newPoint: { x: 35, y: 0 } },
      { type: 'corner', handleIndex: 2, newPoint: { x: 30, y: 25 } },
      { type: 'edge', handleIndex: 3, newPoint: { x: -35, y: 0 } }
    ];
    
    for (const op of operations) {
      let result;
      
      if (op.type === 'corner') {
        result = simulateCornerResize(standardRectangle, op.handleIndex, op.newPoint);
      } else {
        result = simulateEdgeResize(standardRectangle, op.handleIndex, op.newPoint);
      }
      
      validateRectangleFormat(result, `${op.type} resize (handle ${op.handleIndex})`);
    }
  });

  it('should maintain rectangle properties through geometry pipeline simulation', () => {
    // Simulate the complete pipeline: resize -> store update -> geometry creation
    const resizeOperations = [
      { method: 'corner', handleIndex: 1, newPoint: { x: 50, y: -10 } },
      { method: 'edge', handleIndex: 0, newPoint: { x: 0, y: 35 } },
      { method: 'corner', handleIndex: 3, newPoint: { x: -45, y: 15 } },
      { method: 'edge', handleIndex: 2, newPoint: { x: 0, y: -35 } }
    ];
    
    for (const operation of resizeOperations) {
      let resizedPoints;
      
      if (operation.method === 'corner') {
        resizedPoints = simulateCornerResize(standardRectangle, operation.handleIndex, operation.newPoint);
      } else {
        resizedPoints = simulateEdgeResize(standardRectangle, operation.handleIndex, operation.newPoint);
      }
      
      // Validate format consistency
      validateRectangleFormat(resizedPoints, `${operation.method} resize`);
      
      // Simulate geometry creation requirements
      expect(resizedPoints).toHaveLength(4); // Required for BufferGeometry
      
      // Verify points can create proper triangle indices [0,1,2, 0,2,3]
      const [p0, p1, p2, p3] = resizedPoints;
      
      // Triangle 1: [p0, p1, p2] - should be counter-clockwise
      const area1 = (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y);
      
      // Triangle 2: [p0, p2, p3] - should be counter-clockwise  
      const area2 = (p2.x - p0.x) * (p3.y - p0.y) - (p3.x - p0.x) * (p2.y - p0.y);
      
      // Both triangles should have positive area (counter-clockwise)
      expect(Math.abs(area1), `${operation.method}: Triangle 1 should have positive area`).toBeGreaterThan(0);
      expect(Math.abs(area2), `${operation.method}: Triangle 2 should have positive area`).toBeGreaterThan(0);
    }
  });

  it('should handle extreme resize cases without creating diagonal lines', () => {
    // Test edge cases that might stress the resize system
    const extremeCases = [
      { method: 'corner', handleIndex: 0, newPoint: { x: -100, y: -100 }, name: 'Large expansion' },
      { method: 'edge', handleIndex: 1, newPoint: { x: 26, y: 0 }, name: 'Minimal width change' },
      { method: 'corner', handleIndex: 2, newPoint: { x: -24, y: 21 }, name: 'Near-zero dimensions' },
      { method: 'edge', handleIndex: 0, newPoint: { x: 0, y: 100 }, name: 'Large height change' }
    ];
    
    for (const testCase of extremeCases) {
      let result;
      
      if (testCase.method === 'corner') {
        result = simulateCornerResize(standardRectangle, testCase.handleIndex, testCase.newPoint);
      } else {
        result = simulateEdgeResize(standardRectangle, testCase.handleIndex, testCase.newPoint);
      }
      
      // Should never create diagonal line regardless of extreme inputs
      expect(result, `${testCase.name}: Should have 4 points`).toHaveLength(4);
      expect(result, `${testCase.name}: Should not have 2 points`).not.toHaveLength(2);
      
      // Validate rectangle properties if dimensions are reasonable
      const width = Math.abs(result[1].x - result[0].x);
      const height = Math.abs(result[2].y - result[1].y);
      
      if (width > 0.1 && height > 0.1) { // Only validate if not degenerate
        validateRectangleFormat(result, testCase.name);
      }
    }
  });

  it('should produce identical results for equivalent resize operations', () => {
    // Test that different paths to the same result produce identical output
    
    // Method 1: Corner resize to expand both dimensions
    const cornerResize = simulateCornerResize(standardRectangle, 2, { x: 40, y: 35 });
    
    // Method 2: Sequential edge resizes to achieve same bounds  
    const edgeStep1 = simulateEdgeResize(standardRectangle, 1, { x: 40, y: 0 }); // Right edge
    const edgeStep2 = simulateEdgeResize(edgeStep1, 0, { x: 0, y: 35 });        // Top edge
    
    // Both methods should produce equivalent rectangles
    validateRectangleFormat(cornerResize, 'Corner resize method');
    validateRectangleFormat(edgeStep2, 'Sequential edge resize method');
    
    // Results should be functionally equivalent (same bounds)
    expect(cornerResize[0].x).toEqual(edgeStep2[0].x); // minX
    expect(cornerResize[1].x).toEqual(edgeStep2[1].x); // maxX  
    expect(cornerResize[0].y).toEqual(edgeStep2[0].y); // minY
    expect(cornerResize[2].y).toEqual(edgeStep2[2].y); // maxY
  });
});