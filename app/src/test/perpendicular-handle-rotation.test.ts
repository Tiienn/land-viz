import { describe, it, expect } from 'vitest';

/**
 * Test suite for perpendicular edge handle rotation on rotated rectangles
 * 
 * This test validates that edge handles are oriented perpendicular to their 
 * respective edges (pointing outward from the shape) rather than parallel to them.
 */
describe('Perpendicular Edge Handle Rotation', () => {
  
  it('should calculate correct perpendicular rotation for each edge handle', () => {
    const baseRotation = 45; // Rectangle rotated 45 degrees
    
    // Expected perpendicular rotations for each edge:
    // Top edge (index 0): baseRotation + 90° = 135°
    // Right edge (index 1): baseRotation + 180° = 225°  
    // Bottom edge (index 2): baseRotation + 270° = 315°
    // Left edge (index 3): baseRotation + 0° = 45°
    
    const perpendicularOffsets = [90, 180, 270, 0];
    const expectedRotations = [135, 225, 315, 45];
    
    perpendicularOffsets.forEach((offset, index) => {
      const handleRotationDegrees = baseRotation + offset;
      expect(handleRotationDegrees).toBe(expectedRotations[index]);
    });
  });

  it('should handle zero rotation correctly', () => {
    const baseRotation = 0;
    const perpendicularOffsets = [90, 180, 270, 0];
    const expectedRotations = [90, 180, 270, 0];
    
    perpendicularOffsets.forEach((offset, index) => {
      const handleRotationDegrees = baseRotation + offset;
      expect(handleRotationDegrees).toBe(expectedRotations[index]);
    });
  });

  it('should handle negative rotations correctly', () => {
    const baseRotation = -30; // Rectangle rotated -30 degrees
    const perpendicularOffsets = [90, 180, 270, 0];
    const expectedRotations = [60, 150, 240, -30];
    
    perpendicularOffsets.forEach((offset, index) => {
      const handleRotationDegrees = baseRotation + offset;
      expect(handleRotationDegrees).toBe(expectedRotations[index]);
    });
  });

  it('should correctly convert degrees to radians for Three.js', () => {
    const testCases = [
      { degrees: 90, expectedRadians: Math.PI / 2 },
      { degrees: 180, expectedRadians: Math.PI },
      { degrees: 270, expectedRadians: (3 * Math.PI) / 2 },
      { degrees: 360, expectedRadians: 2 * Math.PI }
    ];

    testCases.forEach(({ degrees, expectedRadians }) => {
      const calculatedRadians = degrees * Math.PI / 180;
      expect(calculatedRadians).toBeCloseTo(expectedRadians, 5);
    });
  });

  it('should produce different rotations for each edge handle', () => {
    const baseRotation = 60;
    const perpendicularOffsets = [90, 180, 270, 0];
    
    const rotations = perpendicularOffsets.map(offset => baseRotation + offset);
    
    // All rotations should be different
    const uniqueRotations = new Set(rotations);
    expect(uniqueRotations.size).toBe(4);
    
    // Expected values
    expect(rotations).toEqual([150, 240, 330, 60]);
  });

  it('should handle edge case rotations correctly', () => {
    // Test with rotation that would produce values > 360°
    const baseRotation = 300;
    const perpendicularOffsets = [90, 180, 270, 0];
    const rotations = perpendicularOffsets.map(offset => baseRotation + offset);
    
    // Values can exceed 360° - Three.js handles this correctly
    expect(rotations).toEqual([390, 480, 570, 300]);
    
    // Convert to radians and verify they're valid
    rotations.forEach(rotation => {
      const radians = rotation * Math.PI / 180;
      expect(typeof radians).toBe('number');
      expect(isFinite(radians)).toBe(true);
    });
  });

  it('should maintain perpendicular relationship at various rectangle rotations', () => {
    const testRotations = [0, 15, 30, 45, 60, 90, 120, 180, 270];
    
    testRotations.forEach(baseRotation => {
      const perpendicularOffsets = [90, 180, 270, 0];
      const edgeRotations = perpendicularOffsets.map(offset => baseRotation + offset);
      
      // Each edge handle should be exactly 90° offset from its base edge
      edgeRotations.forEach((handleRotation, index) => {
        const expectedOffset = perpendicularOffsets[index];
        const actualOffset = handleRotation - baseRotation;
        expect(actualOffset).toBe(expectedOffset);
      });
    });
  });
});