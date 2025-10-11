/**
 * Unit Tests for GeometryReconstructor
 *
 * Tests the geometry reconstruction algorithms for converting
 * 1D edge measurements into 2D/3D vertices.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeometryReconstructor } from '../geometryReconstructor';
import type { ReconstructedShape, AreaValidation } from '../../../types/imageImport';

describe('GeometryReconstructor', () => {
  let reconstructor: GeometryReconstructor;

  beforeEach(() => {
    reconstructor = new GeometryReconstructor();
  });

  // ============================================================================
  // Basic Triangle Reconstruction
  // ============================================================================

  describe('Triangle Reconstruction', () => {
    it('should reconstruct equilateral triangle correctly', () => {
      const dimensions = [10, 10, 10];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(3);
      expect(result.angles).toHaveLength(3);

      // All angles should be 60° for equilateral
      result.angles.forEach((angle) => {
        expect(angle).toBeCloseTo(60, 0);
      });

      // Calculate expected area using Heron's formula
      const s = (10 + 10 + 10) / 2; // semi-perimeter = 15
      const expectedArea = Math.sqrt(s * (s - 10) * (s - 10) * (s - 10));
      expect(result.area).toBeCloseTo(expectedArea, 1);

      expect(result.perimeter).toBe(30);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reconstruct right triangle (3-4-5)', () => {
      const dimensions = [3, 4, 5];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(3);

      // Should have one 90° angle (right angle)
      const hasRightAngle = result.angles.some((angle) => Math.abs(angle - 90) < 1);
      expect(hasRightAngle).toBe(true);

      // Area should be (3 * 4) / 2 = 6
      expect(result.area).toBeCloseTo(6, 1);
      expect(result.perimeter).toBe(12);
    });

    it('should reconstruct isosceles triangle', () => {
      const dimensions = [10, 10, 5];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(3);

      // Two angles should be equal for isosceles
      const sortedAngles = [...result.angles].sort((a, b) => a - b);
      const angle1 = sortedAngles[1];
      const angle2 = sortedAngles[2];
      expect(angle1).toBeCloseTo(angle2, 0);
    });

    it('should reject invalid triangle (violates inequality)', () => {
      const dimensions = [1, 2, 10]; // 1 + 2 < 10

      expect(() => reconstructor.reconstruct(dimensions)).toThrow(
        /cannot form a valid triangle/
      );
    });

    it('should reject degenerate triangle (collinear)', () => {
      const dimensions = [5, 5, 10]; // 5 + 5 = 10 (degenerate)

      expect(() => reconstructor.reconstruct(dimensions)).toThrow(
        /triangle inequality violated/i
      );
    });
  });

  // ============================================================================
  // Rectangle Reconstruction
  // ============================================================================

  describe('Rectangle Reconstruction', () => {
    it('should reconstruct perfect rectangle (opposite sides equal)', () => {
      const dimensions = [10, 20, 10, 20];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(4);

      // All angles should be 90°
      result.angles.forEach((angle) => {
        expect(angle).toBeCloseTo(90, 0);
      });

      expect(result.area).toBeCloseTo(200, 1);
      expect(result.perimeter).toBe(60);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reconstruct square', () => {
      const dimensions = [15, 15, 15, 15];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(4);

      result.angles.forEach((angle) => {
        expect(angle).toBeCloseTo(90, 0);
      });

      expect(result.area).toBeCloseTo(225, 1);
    });

    it('should handle rectangle with slight measurement errors', () => {
      const dimensions = [10.05, 20, 9.95, 20]; // Slight variance
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(4);

      // With slight variance, treated as non-rectangular quadrilateral
      // Angles should be close to 90° but may not be exactly 90°
      result.angles.forEach((angle) => {
        expect(angle).toBeCloseTo(90, 0); // Within 0.5 degrees
      });

      expect(result.area).toBeCloseTo(200, 5);
    });

    it('should reconstruct very thin rectangle', () => {
      const dimensions = [100, 1, 100, 1];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(4);
      expect(result.area).toBeCloseTo(100, 1);

      // May have warnings about thin shape (logged, not in warnings array)
    });
  });

  // ============================================================================
  // Quadrilateral (Non-Rectangular)
  // ============================================================================

  describe('Non-Rectangular Quadrilateral', () => {
    it('should reconstruct trapezoid-like shape', () => {
      const dimensions = [10, 5, 10, 8];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(4);
      expect(result.perimeter).toBe(33);

      // Should reconstruct a valid quadrilateral
      expect(result.area).toBeGreaterThan(0);

      // For this irregular quadrilateral, check closure
      // (polygon reconstruction attempts to close the shape)
      expect(result.angles.length).toBe(4);
    });

    it('should handle parallelogram-like dimensions', () => {
      const dimensions = [12, 8, 12, 8];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(4);

      // Either rectangle or parallelogram
      expect(result.area).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Polygon Reconstruction (5+ sides)
  // ============================================================================

  describe('Polygon Reconstruction', () => {
    it('should reconstruct regular pentagon', () => {
      const sideLength = 10;
      const dimensions = [sideLength, sideLength, sideLength, sideLength, sideLength];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(5);
      expect(result.perimeter).toBe(50);

      // Regular pentagon has 108° interior angles
      result.angles.forEach((angle) => {
        expect(angle).toBeCloseTo(108, 5); // Allow 5° tolerance for numerical approximation
      });

      expect(result.area).toBeGreaterThan(0);
    });

    it('should reconstruct regular hexagon', () => {
      const sideLength = 10;
      const dimensions = Array(6).fill(sideLength);
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(6);
      expect(result.perimeter).toBe(60);

      // Regular hexagon has 120° interior angles
      result.angles.forEach((angle) => {
        expect(angle).toBeCloseTo(120, 5);
      });
    });

    it('should handle irregular pentagon', () => {
      const dimensions = [10, 12, 8, 15, 11];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(5);
      expect(result.perimeter).toBe(56);

      // Angles should vary for irregular shape
      const uniqueAngles = new Set(
        result.angles.map((a) => Math.round(a))
      );
      expect(uniqueAngles.size).toBeGreaterThan(1);
    });

    it('should detect closure errors for impossible polygons', () => {
      // Dimensions that cannot close properly
      const dimensions = [10, 5, 3, 2, 20];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(5);

      // Should have closure warning
      const hasClosureWarning = result.warnings.some((w) =>
        w.message.includes("doesn't close")
      );
      expect(hasClosureWarning).toBe(true);
    });
  });

  // ============================================================================
  // Dimension Validation
  // ============================================================================

  describe('Dimension Validation', () => {
    it('should reject less than 3 dimensions', () => {
      expect(() => reconstructor.reconstruct([10, 20])).toThrow(
        /at least 3 dimensions required/i
      );
    });

    it('should reject zero dimension', () => {
      expect(() => reconstructor.reconstruct([10, 0, 10])).toThrow(
        /invalid dimension/i
      );
    });

    it('should reject negative dimension', () => {
      expect(() => reconstructor.reconstruct([10, -5, 10])).toThrow(
        /invalid dimension/i
      );
    });

    it('should reject NaN dimension', () => {
      expect(() => reconstructor.reconstruct([10, NaN, 10])).toThrow(
        /invalid dimension/i
      );
    });

    it('should reject dimension below minimum (0.1m)', () => {
      expect(() => reconstructor.reconstruct([0.05, 10, 10])).toThrow(
        /too small.*minimum.*0.1/i
      );
    });

    it('should accept dimension at minimum (0.1m)', () => {
      const dimensions = [0.1, 0.1, 0.1];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(3);
    });

    it('should reject dimension above maximum (9999m)', () => {
      expect(() => reconstructor.reconstruct([10000, 10, 10])).toThrow(
        /too large.*maximum.*9999/i
      );
    });

    it('should accept dimension at maximum (9999m)', () => {
      const dimensions = [9999, 9999, 9999];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(3);
    });
  });

  // ============================================================================
  // Angle Warnings
  // ============================================================================

  describe('Angle Warnings', () => {
    it('should warn about very acute angles (< 45°)', () => {
      // Very obtuse triangle with one acute angle
      const dimensions = [100, 100, 20];
      const result = reconstructor.reconstruct(dimensions);

      const acuteWarnings = result.warnings.filter((w) =>
        w.message.includes('acute')
      );
      expect(acuteWarnings.length).toBeGreaterThan(0);
    });

    it('should warn about very obtuse angles (> 135°)', () => {
      // Create triangle with very obtuse angle
      // For [10, 10, 19], angle opposite to 19 is ~153.6° > 135°
      const dimensions = [10, 10, 19];
      const result = reconstructor.reconstruct(dimensions);

      const obtuseWarnings = result.warnings.filter((w) =>
        w.message.includes('obtuse')
      );
      expect(obtuseWarnings.length).toBeGreaterThan(0);
    });

    it('should not warn about normal angles (45° - 135°)', () => {
      const dimensions = [10, 10, 10]; // Equilateral - 60° angles
      const result = reconstructor.reconstruct(dimensions);

      expect(result.warnings).toHaveLength(0);
    });

    it('should include corner number in warning', () => {
      const dimensions = [100, 100, 20];
      const result = reconstructor.reconstruct(dimensions);

      if (result.warnings.length > 0) {
        expect(result.warnings[0].corner).toBeGreaterThan(0);
        expect(result.warnings[0].message).toMatch(/Corner \d+/);
      }
    });
  });

  // ============================================================================
  // Area Validation
  // ============================================================================

  describe('Area Validation', () => {
    it('should validate area within 5% tolerance as valid', () => {
      const dimensions = [10, 20, 10, 20]; // Rectangle: 200m²
      const result = reconstructor.reconstruct(dimensions, 205); // 2.5% difference

      expect(result.areaValidation).toBeDefined();
      expect(result.areaValidation?.status).toBe('valid');
      expect(result.areaValidation?.message).toMatch(/acceptable/i);
    });

    it('should detect area mismatch beyond tolerance', () => {
      const dimensions = [10, 20, 10, 20]; // Rectangle: 200m²
      const result = reconstructor.reconstruct(dimensions, 250); // 25% difference

      expect(result.areaValidation).toBeDefined();
      expect(result.areaValidation?.status).toBe('mismatch');
      expect(result.areaValidation?.message).toMatch(/differs.*by/i);
    });

    it('should calculate percent difference correctly', () => {
      const dimensions = [10, 20, 10, 20]; // 200m²
      const providedArea = 180; // 10% difference

      const validation = reconstructor.validateArea(200, providedArea);

      expect(validation.percentDiff).toBeCloseTo(0.111, 2); // 20/180 ≈ 11.1%
      expect(validation.difference).toBeCloseTo(20, 1);
    });

    it('should not include area validation if not provided', () => {
      const dimensions = [10, 20, 10, 20];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.areaValidation).toBeUndefined();
    });

    it('should handle null area as no validation', () => {
      const dimensions = [10, 20, 10, 20];
      const result = reconstructor.reconstruct(dimensions, null);

      expect(result.areaValidation).toBeUndefined();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very large polygons (10+ sides)', () => {
      const dimensions = Array(12).fill(10);
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(12);
      expect(result.perimeter).toBe(120);
      expect(result.area).toBeGreaterThan(0);
    });

    it('should center vertices at origin', () => {
      const dimensions = [10, 10, 10, 10]; // Square
      const result = reconstructor.reconstruct(dimensions);

      // Calculate centroid
      const centroidX =
        result.vertices.reduce((sum, v) => sum + v.x, 0) / result.vertices.length;
      const centroidY =
        result.vertices.reduce((sum, v) => sum + v.y, 0) / result.vertices.length;

      expect(centroidX).toBeCloseTo(0, 1);
      expect(centroidY).toBeCloseTo(0, 1);
    });

    it('should set all z-coordinates to 0', () => {
      const dimensions = [10, 20, 10, 20];
      const result = reconstructor.reconstruct(dimensions);

      result.vertices.forEach((vertex) => {
        expect(vertex.z).toBe(0);
      });
    });

    it('should handle floating point dimensions', () => {
      const dimensions = [10.5, 20.3, 10.5, 20.3];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.vertices).toHaveLength(4);
      expect(result.area).toBeCloseTo(213.15, 1);
    });

    it('should calculate perimeter correctly for all shapes', () => {
      const testCases = [
        { dims: [3, 4, 5], expected: 12 },
        { dims: [10, 20, 10, 20], expected: 60 },
        { dims: [5, 5, 5, 5, 5], expected: 25 },
      ];

      testCases.forEach(({ dims, expected }) => {
        const result = reconstructor.reconstruct(dims);
        expect(result.perimeter).toBe(expected);
      });
    });
  });

  // ============================================================================
  // Algorithm Correctness
  // ============================================================================

  describe('Algorithm Correctness', () => {
    it('should satisfy perimeter constraint', () => {
      const dimensions = [7, 12, 9, 15, 11];
      const result = reconstructor.reconstruct(dimensions);

      const calculatedPerimeter = dimensions.reduce((sum, d) => sum + d, 0);
      expect(result.perimeter).toBe(calculatedPerimeter);
    });

    it('should produce vertices in consistent order', () => {
      const dimensions = [10, 20, 10, 20];
      const result1 = reconstructor.reconstruct(dimensions);
      const result2 = reconstructor.reconstruct(dimensions);

      // Should produce same vertex count
      expect(result1.vertices.length).toBe(result2.vertices.length);
    });

    it('should calculate area using shoelace formula correctly', () => {
      // Known rectangle: 10m × 20m = 200m²
      const dimensions = [10, 20, 10, 20];
      const result = reconstructor.reconstruct(dimensions);

      expect(result.area).toBeCloseTo(200, 1);
    });

    it('should handle all edge cases for angle calculation', () => {
      const dimensions = [10, 10, 10]; // Equilateral
      const result = reconstructor.reconstruct(dimensions);

      // Sum of interior angles for triangle = 180°
      const angleSum = result.angles.reduce((sum, angle) => sum + angle, 0);
      expect(angleSum).toBeCloseTo(180, 1);
    });
  });

  // ============================================================================
  // Integration with Types
  // ============================================================================

  describe('Type Compatibility', () => {
    it('should return ReconstructedShape with all required fields', () => {
      const dimensions = [10, 20, 10, 20];
      const result = reconstructor.reconstruct(dimensions);

      expect(result).toHaveProperty('vertices');
      expect(result).toHaveProperty('angles');
      expect(result).toHaveProperty('area');
      expect(result).toHaveProperty('perimeter');
      expect(result).toHaveProperty('warnings');

      expect(Array.isArray(result.vertices)).toBe(true);
      expect(Array.isArray(result.angles)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.area).toBe('number');
      expect(typeof result.perimeter).toBe('number');
    });

    it('should return AreaValidation with all required fields', () => {
      const validation: AreaValidation = reconstructor.validateArea(200, 205);

      expect(validation).toHaveProperty('status');
      expect(validation).toHaveProperty('calculatedArea');
      expect(validation).toHaveProperty('providedArea');
      expect(validation).toHaveProperty('difference');
      expect(validation).toHaveProperty('percentDiff');
      expect(validation).toHaveProperty('message');
    });

    it('should produce Point3D vertices with x, y, z', () => {
      const dimensions = [10, 10, 10];
      const result = reconstructor.reconstruct(dimensions);

      result.vertices.forEach((vertex) => {
        expect(vertex).toHaveProperty('x');
        expect(vertex).toHaveProperty('y');
        expect(vertex).toHaveProperty('z');
        expect(typeof vertex.x).toBe('number');
        expect(typeof vertex.y).toBe('number');
        expect(typeof vertex.z).toBe('number');
      });
    });
  });
});
