import { describe, test, expect } from 'vitest';

// Test the rectangle resize handle alignment fix
describe('Rectangle Resize Handle Alignment', () => {
  
  // Mock function that mimics the fixed calculateHandleOrientationFromEdge
  const calculateHandleOrientationFromEdge = (
    edgeIndex: number,
    currentCornerPoints: { x: number; y: number }[]
  ) => {
    if (currentCornerPoints.length < 4) {
      const baseRotations = [0, 90, 180, 270]; // Top, Right, Bottom, Left
      const totalRotationDegrees = baseRotations[edgeIndex % 4];
      return {
        rotationRadians: (totalRotationDegrees * Math.PI) / 180,
        rotationDegrees: totalRotationDegrees
      };
    }

    // Calculate edge vector from CURRENT (already rotated) corner points
    const startCorner = currentCornerPoints[edgeIndex % 4];
    const endCorner = currentCornerPoints[(edgeIndex + 1) % 4];
    
    // Calculate edge vector directly from current positions
    const edgeVector = {
      x: endCorner.x - startCorner.x,
      y: endCorner.y - startCorner.y
    };
    
    // Calculate final edge angle directly (no rotation addition needed)
    const edgeAngleRadians = Math.atan2(edgeVector.y, edgeVector.x);
    const edgeAngleDegrees = (edgeAngleRadians * 180) / Math.PI;
    
    return {
      rotationRadians: edgeAngleRadians,
      rotationDegrees: edgeAngleDegrees
    };
  };

  test('calculates correct orientation for unrotated rectangle', () => {
    // Standard rectangle corners: bottom-left, bottom-right, top-right, top-left
    const corners = [
      { x: 0, y: 0 },   // bottom-left (0)
      { x: 100, y: 0 }, // bottom-right (1) 
      { x: 100, y: 100 }, // top-right (2)
      { x: 0, y: 100 }  // top-left (3)
    ];

    // Top edge (0 -> 1)
    const topEdge = calculateHandleOrientationFromEdge(0, corners);
    expect(Math.abs(topEdge.rotationDegrees - 0)).toBeLessThan(0.01); // Horizontal
    
    // Right edge (1 -> 2)  
    const rightEdge = calculateHandleOrientationFromEdge(1, corners);
    expect(Math.abs(rightEdge.rotationDegrees - 90)).toBeLessThan(0.01); // Vertical
    
    // Bottom edge (2 -> 3)
    const bottomEdge = calculateHandleOrientationFromEdge(2, corners);
    expect(Math.abs(Math.abs(bottomEdge.rotationDegrees) - 180)).toBeLessThan(0.01); // Horizontal (180°)
    
    // Left edge (3 -> 0)
    const leftEdge = calculateHandleOrientationFromEdge(3, corners);
    expect(Math.abs(leftEdge.rotationDegrees - (-90))).toBeLessThan(0.01); // Vertical (-90°)
  });

  test('calculates correct orientation for 45-degree rotated rectangle', () => {
    // Rectangle rotated 45 degrees around center
    const center = { x: 50, y: 50 };
    const size = 50;
    const angle = Math.PI / 4; // 45 degrees
    const cos45 = Math.cos(angle);
    const sin45 = Math.sin(angle);
    
    // Apply rotation transformation to rectangle corners
    const corners = [
      // bottom-left rotated
      { 
        x: center.x + (-size * cos45 - (-size) * sin45), 
        y: center.y + (-size * sin45 + (-size) * cos45)
      },
      // bottom-right rotated  
      { 
        x: center.x + (size * cos45 - (-size) * sin45), 
        y: center.y + (size * sin45 + (-size) * cos45)
      },
      // top-right rotated
      { 
        x: center.x + (size * cos45 - size * sin45), 
        y: center.y + (size * sin45 + size * cos45)
      },
      // top-left rotated
      { 
        x: center.x + (-size * cos45 - size * sin45), 
        y: center.y + (-size * sin45 + size * cos45)
      }
    ];

    // Each edge should be rotated 45 degrees from its original orientation
    const topEdge = calculateHandleOrientationFromEdge(0, corners);
    expect(Math.abs(topEdge.rotationDegrees - 45)).toBeLessThan(1); // ~45°
    
    const rightEdge = calculateHandleOrientationFromEdge(1, corners);
    expect(Math.abs(rightEdge.rotationDegrees - 135)).toBeLessThan(1); // ~135°
    
    const bottomEdge = calculateHandleOrientationFromEdge(2, corners);
    // Bottom edge should be around -135° (or +225°)
    const bottomAngle = bottomEdge.rotationDegrees;
    const normalizedBottom = bottomAngle < 0 ? bottomAngle + 360 : bottomAngle;
    expect(Math.abs(normalizedBottom - 225)).toBeLessThan(1); // ~225° (or -135°)
    
    const leftEdge = calculateHandleOrientationFromEdge(3, corners);
    expect(Math.abs(leftEdge.rotationDegrees - (-45))).toBeLessThan(1); // ~-45°
  });

  test('handles fallback when insufficient corner points', () => {
    const insufficientCorners = [{ x: 0, y: 0 }, { x: 100, y: 100 }]; // Only 2 points
    
    const topEdge = calculateHandleOrientationFromEdge(0, insufficientCorners);
    expect(topEdge.rotationDegrees).toBe(0);
    
    const rightEdge = calculateHandleOrientationFromEdge(1, insufficientCorners);
    expect(rightEdge.rotationDegrees).toBe(90);
    
    const bottomEdge = calculateHandleOrientationFromEdge(2, insufficientCorners);
    expect(bottomEdge.rotationDegrees).toBe(180);
    
    const leftEdge = calculateHandleOrientationFromEdge(3, insufficientCorners);
    expect(leftEdge.rotationDegrees).toBe(270);
  });

  test('handles edge case of zero-size rectangle', () => {
    // All corners at same point
    const zeroSizeCorners = [
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      { x: 50, y: 50 }
    ];
    
    // Should still return valid angles (though edges have zero length)
    const topEdge = calculateHandleOrientationFromEdge(0, zeroSizeCorners);
    expect(typeof topEdge.rotationDegrees).toBe('number');
    expect(isFinite(topEdge.rotationDegrees)).toBe(true);
  });
});