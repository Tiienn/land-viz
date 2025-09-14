/**
 * Coordinate System Analysis
 * 
 * Understanding how 2D shape coordinates map to 3D Three.js coordinates
 * and how edge angles should be calculated.
 */

import { describe, it, expect } from 'vitest';

describe('Coordinate System Analysis', () => {
  
  it('should understand 2D to 3D coordinate mapping', () => {
    // 2D coordinate system (like in drawing canvas)
    // X-axis: left to right (positive is right)
    // Y-axis: top to bottom (positive is down) 
    
    // 3D coordinate system (Three.js with position=[point.x, elevation, point.y])
    // X-axis: left to right (same as 2D)
    // Y-axis: down to up (height/elevation)
    // Z-axis: back to front (corresponds to 2D Y-axis)
    
    const shape2D = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 10, y: 0 },
      bottomRight: { x: 10, y: 10 },
      bottomLeft: { x: 0, y: 10 }
    };
    
    // In 3D with elevation = 0
    const shape3D = {
      topLeft: [0, 0, 0],      // [x, y, z] = [point.x, elevation, point.y]
      topRight: [10, 0, 0],    
      bottomRight: [10, 0, 10],
      bottomLeft: [0, 0, 10]
    };
    
    expect(shape3D.topLeft).toEqual([shape2D.topLeft.x, 0, shape2D.topLeft.y]);
    expect(shape3D.topRight).toEqual([shape2D.topRight.x, 0, shape2D.topRight.y]);
  });

  it('should calculate correct edge vectors in 2D', () => {
    const corners2D = [
      { x: 0, y: 0 },   // Top left
      { x: 10, y: 0 },  // Top right  
      { x: 10, y: 10 }, // Bottom right
      { x: 0, y: 10 }   // Bottom left
    ];
    
    // Edge 0: Top edge (from top-left to top-right)
    const edge0Vector = {
      x: corners2D[1].x - corners2D[0].x,  // 10 - 0 = 10
      y: corners2D[1].y - corners2D[0].y   // 0 - 0 = 0
    };
    expect(edge0Vector).toEqual({ x: 10, y: 0 });
    
    // Edge angle for horizontal line pointing right should be 0°
    const edge0Angle = Math.atan2(edge0Vector.y, edge0Vector.x);
    expect(edge0Angle).toBe(0); // 0 radians = 0°
    
    // Edge 1: Right edge (from top-right to bottom-right)
    const edge1Vector = {
      x: corners2D[2].x - corners2D[1].x,  // 10 - 10 = 0  
      y: corners2D[2].y - corners2D[1].y   // 10 - 0 = 10
    };
    expect(edge1Vector).toEqual({ x: 0, y: 10 });
    
    // Edge angle for vertical line pointing down should be 90°
    const edge1Angle = Math.atan2(edge1Vector.y, edge1Vector.x);
    expect(edge1Angle).toBeCloseTo(Math.PI / 2, 5); // π/2 radians = 90°
  });

  it('should understand Three.js Box default orientation', () => {
    // Three.js Box geometry by default:
    // - Is oriented along X-axis (width)
    // - Has its length along X when no rotation is applied
    // 
    // Box args=[width, height, depth] corresponds to [X, Y, Z] dimensions
    // For edge handles: [1.5, 0.3, 0.4] = long along X, thin on Y and Z
    
    // No rotation [0, 0, 0] = Box aligned with X-axis (horizontal)
    // Y-rotation [0, π/2, 0] = Box rotated 90° around Y-axis (now aligned with Z-axis)
    
    const horizontalBoxRotation = [0, 0, 0];        // Aligned with X-axis
    const verticalBoxRotation = [0, Math.PI/2, 0]; // Aligned with Z-axis (90° around Y)
    
    expect(horizontalBoxRotation[1]).toBe(0);
    expect(verticalBoxRotation[1]).toBeCloseTo(Math.PI/2);
  });

  it('should understand the coordinate system rotation issue', () => {
    // THE ISSUE: We calculate 2D edge angles but apply them as 3D Y-axis rotations
    
    // In 2D: Horizontal edge = {x: 10, y: 0} = angle 0° (pointing right)
    // In 3D: This becomes an edge along X-axis [10, 0, 0] 
    // To align a Box with X-axis in 3D, we need rotation [0, 0, 0]
    // So 2D angle 0° should map to 3D Y-rotation 0°. ✓ This is correct.
    
    // In 2D: Vertical edge = {x: 0, y: 10} = angle 90° (pointing down)  
    // In 3D: This becomes an edge along Z-axis [0, 0, 10]
    // To align a Box with Z-axis in 3D, we need rotation [0, 90°, 0]
    // So 2D angle 90° should map to 3D Y-rotation 90°. ✓ This should be correct too.
    
    const horizontal2D = Math.atan2(0, 10);   // 0 radians
    const vertical2D = Math.atan2(10, 0);     // π/2 radians
    
    expect(horizontal2D).toBe(0);
    expect(vertical2D).toBeCloseTo(Math.PI/2);
    
    // The mapping seems mathematically correct...
    // The issue might be elsewhere!
  });

  it('should check rotated rectangle edge calculations', () => {
    // Let's test with a 45° rotated rectangle
    const sin45 = Math.sin(Math.PI / 4);
    const cos45 = Math.cos(Math.PI / 4);
    
    // Original rectangle (0,0) to (10,10) rotated 45° around center (5,5)
    const center = { x: 5, y: 5 };
    const corners = [
      { 
        x: center.x + (-5 * cos45 - (-5) * sin45), 
        y: center.y + (-5 * sin45 + (-5) * cos45) 
      }, // Top left rotated
      { 
        x: center.x + (5 * cos45 - (-5) * sin45), 
        y: center.y + (5 * sin45 + (-5) * cos45) 
      }, // Top right rotated
      { 
        x: center.x + (5 * cos45 - 5 * sin45), 
        y: center.y + (5 * sin45 + 5 * cos45) 
      }, // Bottom right rotated
      { 
        x: center.x + (-5 * cos45 - 5 * sin45), 
        y: center.y + (-5 * sin45 + 5 * cos45) 
      }  // Bottom left rotated
    ];
    
    // Edge 0: Top edge (should be rotated 45° from horizontal)
    const edge0Vector = {
      x: corners[1].x - corners[0].x,
      y: corners[1].y - corners[0].y
    };
    
    const edge0Angle = Math.atan2(edge0Vector.y, edge0Vector.x);
    expect(edge0Angle).toBeCloseTo(Math.PI / 4, 2); // Should be 45°
    
    // This angle should be applied as Y-rotation in 3D
    // But wait... is this the issue?
  });
});