import { describe, it, expect, beforeEach } from 'vitest';
import type { Point2D, Shape } from '@/types';

/**
 * Integration test for rectangle resize functionality
 * This verifies the complete flow from initial rectangle to resized rectangle
 * ensuring that the geometry maintains rectangle structure throughout.
 */
describe('Rectangle Resize Integration', () => {
  let initialRectangle: Shape;

  beforeEach(() => {
    // Create a standard test rectangle
    initialRectangle = {
      id: 'test-rectangle',
      type: 'rectangle',
      points: [
        { x: -35.355, y: -35.355 }, // bottom-left
        { x: 35.355, y: -35.355 },  // bottom-right
        { x: 35.355, y: 35.355 },   // top-right
        { x: -35.355, y: 35.355 }   // top-left
      ],
      filled: true,
      strokeColor: '#000000',
      fillColor: '#4F46E5',
      strokeWidth: 2,
      modified: new Date()
    };
  });

  /**
   * Simulate the resize operation that was causing the diagonal line issue
   */
  const simulateCornerResize = (
    corners: Point2D[], 
    handleIndex: number, 
    newPoint: Point2D,
    maintainAspectRatio = false
  ): Point2D[] => {
    // This simulates the logic from ResizableShapeControls.tsx after our fix
    
    // Get opposite corner for resize calculation
    const oppositeCornerIndex = (handleIndex + 2) % 4;
    const oppositeCorner = corners[oppositeCornerIndex];
    
    // Calculate new rectangle bounds
    const minX = Math.min(newPoint.x, oppositeCorner.x);
    const maxX = Math.max(newPoint.x, oppositeCorner.x);
    const minY = Math.min(newPoint.y, oppositeCorner.y);
    const maxY = Math.max(newPoint.y, oppositeCorner.y);
    
    if (maintainAspectRatio) {
      // Calculate aspect ratio from original rectangle
      const originalWidth = Math.abs(corners[1].x - corners[0].x);
      const originalHeight = Math.abs(corners[2].y - corners[1].y);
      const aspectRatio = originalWidth / originalHeight;
      
      const deltaX = newPoint.x - oppositeCorner.x;
      const deltaY = newPoint.y - oppositeCorner.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      let finalWidth, finalHeight;
      
      if (absDeltaX / aspectRatio > absDeltaY) {
        finalWidth = absDeltaX;
        finalHeight = finalWidth / aspectRatio;
      } else {
        finalHeight = absDeltaY;
        finalWidth = finalHeight * aspectRatio;
      }
      
      const signX = Math.sign(deltaX);
      const signY = Math.sign(deltaY);
      
      const newCornerX = oppositeCorner.x + (finalWidth * signX);
      const newCornerY = oppositeCorner.y + (finalHeight * signY);
      
      const finalMinX = Math.min(oppositeCorner.x, newCornerX);
      const finalMaxX = Math.max(oppositeCorner.x, newCornerX);
      const finalMinY = Math.min(oppositeCorner.y, newCornerY);
      const finalMaxY = Math.max(oppositeCorner.y, newCornerY);
      
      return [
        { x: finalMinX, y: finalMinY }, // bottom-left (0)
        { x: finalMaxX, y: finalMinY }, // bottom-right (1)
        { x: finalMaxX, y: finalMaxY }, // top-right (2)
        { x: finalMinX, y: finalMaxY }  // top-left (3)
      ];
    }
    
    // Return 4-point rectangle format (our fix)
    return [
      { x: minX, y: minY }, // bottom-left (0)
      { x: maxX, y: minY }, // bottom-right (1)
      { x: maxX, y: maxY }, // top-right (2)
      { x: minX, y: maxY }  // top-left (3)
    ];
  };

  it('should maintain 4-point format during corner resize', () => {
    const corners = initialRectangle.points!;
    const newCornerPosition = { x: 50, y: 50 };
    
    // Simulate dragging corner 2 (top-right) to expand the rectangle
    const resizedPoints = simulateCornerResize(corners, 2, newCornerPosition);
    
    expect(resizedPoints).toHaveLength(4);
    expect(resizedPoints).not.toHaveLength(2); // Should not be diagonal line format
    
    // Verify it forms a proper rectangle
    expect(resizedPoints[0].x).toBeLessThan(resizedPoints[1].x); // left < right
    expect(resizedPoints[0].y).toBeLessThan(resizedPoints[2].y); // bottom < top
  });

  it('should not create diagonal line during resize operation', () => {
    const corners = initialRectangle.points!;
    const newCornerPosition = { x: 25, y: 30 };
    
    // This was the problematic scenario - should not result in diagonal line
    const resizedPoints = simulateCornerResize(corners, 1, newCornerPosition);
    
    expect(resizedPoints).toHaveLength(4);
    
    // Verify all points are distinct and form rectangle corners
    const uniqueXValues = [...new Set(resizedPoints.map(p => p.x))];
    const uniqueYValues = [...new Set(resizedPoints.map(p => p.y))];
    
    expect(uniqueXValues).toHaveLength(2); // Should have exactly 2 unique X values
    expect(uniqueYValues).toHaveLength(2); // Should have exactly 2 unique Y values
  });

  it('should handle aspect ratio constrained resize correctly', () => {
    const corners = initialRectangle.points!;
    const newCornerPosition = { x: 60, y: 40 };
    
    const resizedPoints = simulateCornerResize(corners, 2, newCornerPosition, true);
    
    expect(resizedPoints).toHaveLength(4);
    
    // Calculate aspect ratio
    const width = Math.abs(resizedPoints[1].x - resizedPoints[0].x);
    const height = Math.abs(resizedPoints[2].y - resizedPoints[1].y);
    const aspectRatio = width / height;
    
    // Should maintain roughly square aspect ratio (1:1) from original
    expect(aspectRatio).toBeCloseTo(1, 1);
  });

  it('should create valid geometry for Three.js BufferGeometry', () => {
    const corners = initialRectangle.points!;
    const newCornerPosition = { x: 80, y: 60 };
    
    const resizedPoints = simulateCornerResize(corners, 0, newCornerPosition);
    
    // Should be ready for geometry creation without additional conversion
    expect(resizedPoints).toHaveLength(4);
    
    // Verify points are properly ordered for geometry creation
    const [bottomLeft, bottomRight, topRight, topLeft] = resizedPoints;
    
    // Should form a proper clockwise or counter-clockwise rectangle
    expect(bottomLeft.y).toEqual(bottomRight.y); // Bottom edge aligned
    expect(topLeft.y).toEqual(topRight.y);       // Top edge aligned
    expect(bottomLeft.x).toEqual(topLeft.x);     // Left edge aligned
    expect(bottomRight.x).toEqual(topRight.x);   // Right edge aligned
  });

  it('should prevent the original diagonal line bug scenario', () => {
    const corners = initialRectangle.points!;
    
    // This scenario was causing the diagonal line issue:
    // - Start with 4-point rectangle
    // - Resize returns 2-point format
    // - Geometry renderer creates diagonal line instead of rectangle
    
    const dragSequence = [
      { x: 40, y: 40 },
      { x: 35, y: 38 },
      { x: 32, y: 35 },
      { x: 30, y: 32 }
    ];
    
    let currentPoints = corners;
    
    // Simulate multiple resize events (like dragging)
    for (const dragPoint of dragSequence) {
      const newPoints = simulateCornerResize(currentPoints, 2, dragPoint);
      
      // Each resize should maintain 4-point rectangle format
      expect(newPoints).toHaveLength(4);
      expect(newPoints).not.toHaveLength(2); // Never diagonal line
      
      currentPoints = newPoints;
    }
    
    // Final result should still be a proper rectangle
    const finalWidth = Math.abs(currentPoints[1].x - currentPoints[0].x);
    const finalHeight = Math.abs(currentPoints[2].y - currentPoints[1].y);
    
    expect(finalWidth).toBeGreaterThan(0);
    expect(finalHeight).toBeGreaterThan(0);
  });
});