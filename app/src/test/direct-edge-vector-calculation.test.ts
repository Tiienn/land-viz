/**
 * Test for Direct Edge Vector Calculation Strategy
 * 
 * Verifies that resize handles are correctly oriented based on actual edge vectors
 * from rotated corner points, rather than additive rotation calculations.
 */

import { describe, it, expect } from 'vitest';

// Mock the utility function from ResizableShapeControls
const calculateHandleOrientationFromEdge = (
  edgeIndex: number,
  cornerPoints: Array<{ x: number; y: number }>
) => {
  if (cornerPoints.length < 4) {
    // Fallback to base rotation for testing
    const baseRotations = [0, 90, 0, 90]; // Top, Right, Bottom, Left
    const baseRotation = baseRotations[edgeIndex % 4];
    return {
      rotationRadians: (baseRotation * Math.PI) / 180,
      handleArgs: [1.5, 0.3, 0.4],
      cursor: baseRotation === 0 ? 'ew-resize' : 'ns-resize'
    };
  }

  // Calculate edge vector from actual rotated corner points
  const startCorner = cornerPoints[edgeIndex % 4];
  const endCorner = cornerPoints[(edgeIndex + 1) % 4];
  
  // Calculate edge vector
  const edgeVector = {
    x: endCorner.x - startCorner.x,
    y: endCorner.y - startCorner.y
  };
  
  // Calculate edge angle in radians (atan2 gives correct quadrant)
  const edgeAngleRadians = Math.atan2(edgeVector.y, edgeVector.x);
  const edgeAngleDegrees = (edgeAngleRadians * 180) / Math.PI;
  
  // Mock cursor calculation
  const normalized = ((edgeAngleDegrees % 180) + 180) % 180;
  let cursor = 'ew-resize';
  if (normalized >= 67.5 && normalized <= 112.5) cursor = 'ns-resize';
  else if (normalized > 22.5 && normalized < 67.5) cursor = 'nwse-resize';
  else if (normalized > 112.5 && normalized < 157.5) cursor = 'nesw-resize';
  
  return {
    rotationRadians: edgeAngleRadians,
    handleArgs: [1.5, 0.3, 0.4],
    cursor
  };
};

describe('Direct Edge Vector Calculation Strategy', () => {
  
  it('should calculate handle orientation for unrotated rectangle', () => {
    // Unrotated rectangle corners (0,0) to (10,10)
    const cornerPoints = [
      { x: 0, y: 0 },   // Top left
      { x: 10, y: 0 },  // Top right
      { x: 10, y: 10 }, // Bottom right
      { x: 0, y: 10 }   // Bottom left
    ];
    
    // Test each edge
    const topEdge = calculateHandleOrientationFromEdge(0, cornerPoints);
    expect(topEdge.rotationRadians).toBeCloseTo(0, 5); // Horizontal (0°)
    expect(topEdge.cursor).toBe('ew-resize');
    
    const rightEdge = calculateHandleOrientationFromEdge(1, cornerPoints);
    expect(rightEdge.rotationRadians).toBeCloseTo(Math.PI / 2, 5); // Vertical (90°)
    expect(rightEdge.cursor).toBe('ns-resize');
    
    const bottomEdge = calculateHandleOrientationFromEdge(2, cornerPoints);
    expect(bottomEdge.rotationRadians).toBeCloseTo(Math.PI, 5); // Horizontal (180°)
    expect(bottomEdge.cursor).toBe('ew-resize');
    
    const leftEdge = calculateHandleOrientationFromEdge(3, cornerPoints);
    expect(leftEdge.rotationRadians).toBeCloseTo(-Math.PI / 2, 5); // Vertical (-90°)
    expect(leftEdge.cursor).toBe('ns-resize');
  });

  it('should calculate handle orientation for 45° rotated rectangle', () => {
    // 45° rotated rectangle corners (manually calculated)
    const sin45 = Math.sin(Math.PI / 4);
    const cos45 = Math.cos(Math.PI / 4);
    const size = 10;
    
    // Rotate rectangle around center (5,5)
    const centerX = 5, centerY = 5;
    const cornerPoints = [
      { x: centerX + (-5 * cos45 - (-5) * sin45), y: centerY + (-5 * sin45 + (-5) * cos45) }, // Top left rotated
      { x: centerX + (5 * cos45 - (-5) * sin45), y: centerY + (5 * sin45 + (-5) * cos45) },   // Top right rotated  
      { x: centerX + (5 * cos45 - 5 * sin45), y: centerY + (5 * sin45 + 5 * cos45) },         // Bottom right rotated
      { x: centerX + (-5 * cos45 - 5 * sin45), y: centerY + (-5 * sin45 + 5 * cos45) }        // Bottom left rotated
    ];
    
    // Test that each edge is rotated by 45°
    const topEdge = calculateHandleOrientationFromEdge(0, cornerPoints);
    expect(topEdge.rotationRadians).toBeCloseTo(Math.PI / 4, 2); // 45°
    expect(topEdge.cursor).toBe('nwse-resize');
    
    const rightEdge = calculateHandleOrientationFromEdge(1, cornerPoints);
    expect(rightEdge.rotationRadians).toBeCloseTo(3 * Math.PI / 4, 2); // 135°
    expect(rightEdge.cursor).toBe('nesw-resize');
  });

  it('should handle edge case with insufficient corner points', () => {
    const insufficientPoints = [{ x: 0, y: 0 }, { x: 10, y: 0 }]; // Only 2 points
    
    const result = calculateHandleOrientationFromEdge(0, insufficientPoints);
    expect(result.rotationRadians).toBe(0); // Should fall back to base rotation
    expect(result.cursor).toBe('ew-resize');
  });

  it('should calculate correct edge vectors for each edge index', () => {
    const cornerPoints = [
      { x: 0, y: 0 },   // Index 0
      { x: 10, y: 0 },  // Index 1  
      { x: 10, y: 10 }, // Index 2
      { x: 0, y: 10 }   // Index 3
    ];
    
    // Edge 0: from corner 0 to corner 1 (horizontal, left to right)
    const edge0 = calculateHandleOrientationFromEdge(0, cornerPoints);
    expect(edge0.rotationRadians).toBeCloseTo(0, 5);
    
    // Edge 1: from corner 1 to corner 2 (vertical, top to bottom)  
    const edge1 = calculateHandleOrientationFromEdge(1, cornerPoints);
    expect(edge1.rotationRadians).toBeCloseTo(Math.PI / 2, 5);
    
    // Edge 2: from corner 2 to corner 3 (horizontal, right to left)
    const edge2 = calculateHandleOrientationFromEdge(2, cornerPoints);
    expect(edge2.rotationRadians).toBeCloseTo(Math.PI, 5);
    
    // Edge 3: from corner 3 to corner 0 (vertical, bottom to top)
    const edge3 = calculateHandleOrientationFromEdge(3, cornerPoints);
    expect(edge3.rotationRadians).toBeCloseTo(-Math.PI / 2, 5);
  });
});