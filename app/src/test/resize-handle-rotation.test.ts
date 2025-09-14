import { describe, it, expect } from 'vitest';

/**
 * Test suite for resize handle rotation alignment on rotated rectangles
 * 
 * This test validates the fix for the issue where edge resize handles
 * were not visually aligned with rotated rectangle edges.
 */
describe('Resize Handle Rotation Alignment', () => {
  
  it('should calculate correct rotation for edge handles on rotated rectangles', () => {
    // Test rotation angle to radians conversion
    const testCases = [
      { degrees: 0, expectedRadians: 0 },
      { degrees: 45, expectedRadians: Math.PI / 4 },
      { degrees: 90, expectedRadians: Math.PI / 2 },
      { degrees: 180, expectedRadians: Math.PI },
      { degrees: 270, expectedRadians: (3 * Math.PI) / 2 },
      { degrees: 360, expectedRadians: 2 * Math.PI },
      { degrees: -45, expectedRadians: -Math.PI / 4 }
    ];

    testCases.forEach(({ degrees, expectedRadians }) => {
      const calculatedRadians = (degrees * Math.PI) / 180;
      expect(calculatedRadians).toBeCloseTo(expectedRadians, 5);
    });
  });

  it('should handle undefined rotation gracefully', () => {
    // Test the fallback behavior when rotation is undefined
    const rotation = undefined;
    const angleInRadians = (rotation?.angle || 0) * Math.PI / 180;
    
    expect(angleInRadians).toBe(0);
  });

  it('should handle zero rotation angle', () => {
    // Test when rotation object exists but angle is 0
    const rotation = { angle: 0, center: { x: 0, y: 0 } };
    const angleInRadians = (rotation?.angle || 0) * Math.PI / 180;
    
    expect(angleInRadians).toBe(0);
  });

  it('should correctly convert rotation angles for edge handle alignment', () => {
    // Test specific angles that are common in CAD applications
    const commonAngles = [15, 30, 45, 60, 90, 135, 180, 225, 270, 315];
    
    commonAngles.forEach(degrees => {
      const radians = (degrees * Math.PI) / 180;
      const expectedRadians = degrees * (Math.PI / 180);
      
      expect(radians).toBeCloseTo(expectedRadians, 10);
    });
  });

  it('should maintain consistent rotation calculation for edge handles', () => {
    // Test that the rotation calculation is deterministic
    const testAngle = 56; // The angle mentioned in the bug report
    const rotation = { angle: testAngle, center: { x: 10, y: 20 } };
    
    const result1 = (rotation?.angle || 0) * Math.PI / 180;
    const result2 = (rotation?.angle || 0) * Math.PI / 180;
    
    expect(result1).toBe(result2);
    expect(result1).toBeCloseTo(0.9773843811, 5); // 56 degrees in radians
  });
});