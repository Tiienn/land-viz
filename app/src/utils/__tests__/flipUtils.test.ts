import { describe, it, expect } from 'vitest';
import {
  calculateBoundingBox,
  flipPointsHorizontally,
  flipPointsVertically
} from '../flipUtils';

describe('flipUtils', () => {
  describe('calculateBoundingBox', () => {
    it('should calculate center for rectangle', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const result = calculateBoundingBox(points);

      expect(result.centerX).toBe(5);
      expect(result.centerY).toBe(5);
      expect(result.minX).toBe(0);
      expect(result.maxX).toBe(10);
      expect(result.minY).toBe(0);
      expect(result.maxY).toBe(10);
    });

    it('should handle empty array', () => {
      const result = calculateBoundingBox([]);
      expect(result.centerX).toBe(0);
      expect(result.centerY).toBe(0);
      expect(result.minX).toBe(0);
      expect(result.maxX).toBe(0);
      expect(result.minY).toBe(0);
      expect(result.maxY).toBe(0);
    });

    it('should handle single point', () => {
      const points = [{ x: 5, y: 7 }];
      const result = calculateBoundingBox(points);
      expect(result.centerX).toBe(5);
      expect(result.centerY).toBe(7);
      expect(result.minX).toBe(5);
      expect(result.maxX).toBe(5);
      expect(result.minY).toBe(7);
      expect(result.maxY).toBe(7);
    });

    it('should handle negative coordinates', () => {
      const points = [
        { x: -5, y: -3 },
        { x: 5, y: 3 }
      ];
      const result = calculateBoundingBox(points);
      expect(result.centerX).toBe(0);
      expect(result.centerY).toBe(0);
      expect(result.minX).toBe(-5);
      expect(result.maxX).toBe(5);
      expect(result.minY).toBe(-3);
      expect(result.maxY).toBe(3);
    });

    it('should handle non-rectangular shapes', () => {
      // Triangle
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 8 }
      ];
      const result = calculateBoundingBox(points);
      expect(result.centerX).toBe(5);
      expect(result.centerY).toBe(4);
      expect(result.minX).toBe(0);
      expect(result.maxX).toBe(10);
      expect(result.minY).toBe(0);
      expect(result.maxY).toBe(8);
    });
  });

  describe('flipPointsHorizontally', () => {
    it('should mirror rectangle horizontally', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const result = flipPointsHorizontally(points);

      // Center is at x=5, so:
      // 0 → 10 (2*5 - 0), 10 → 0 (2*5 - 10)
      expect(result).toEqual([
        { x: 10, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: 10, y: 10 }
      ]);
    });

    it('should handle empty array', () => {
      const result = flipPointsHorizontally([]);
      expect(result).toEqual([]);
    });

    it('should handle single point (no change)', () => {
      const points = [{ x: 5, y: 7 }];
      const result = flipPointsHorizontally(points);
      expect(result).toEqual([{ x: 5, y: 7 }]);
    });

    it('should preserve Y coordinates', () => {
      const points = [
        { x: 0, y: 5 },
        { x: 10, y: 15 }
      ];
      const result = flipPointsHorizontally(points);
      expect(result[0].y).toBe(5);
      expect(result[1].y).toBe(15);
    });

    it('should flip asymmetric shape correctly', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
        { x: 4, y: 6 }
      ];
      // Center X is at (0+8)/2 = 4
      const result = flipPointsHorizontally(points);

      expect(result[0].x).toBe(8);  // 2*4 - 0 = 8
      expect(result[1].x).toBe(0);  // 2*4 - 8 = 0
      expect(result[2].x).toBe(4);  // 2*4 - 4 = 4 (center stays)

      // Y coordinates unchanged
      expect(result[0].y).toBe(0);
      expect(result[1].y).toBe(0);
      expect(result[2].y).toBe(6);
    });

    it('should handle negative coordinates', () => {
      const points = [
        { x: -10, y: 5 },
        { x: 10, y: 5 }
      ];
      // Center X is at 0
      const result = flipPointsHorizontally(points);

      expect(result[0].x).toBe(10);  // 2*0 - (-10) = 10
      expect(result[1].x).toBe(-10); // 2*0 - 10 = -10
    });
  });

  describe('flipPointsVertically', () => {
    it('should mirror rectangle vertically', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const result = flipPointsVertically(points);

      // Center is at y=5, so:
      // 0 → 10 (2*5 - 0), 10 → 0 (2*5 - 10)
      expect(result).toEqual([
        { x: 0, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
        { x: 0, y: 0 }
      ]);
    });

    it('should handle empty array', () => {
      const result = flipPointsVertically([]);
      expect(result).toEqual([]);
    });

    it('should handle single point (no change)', () => {
      const points = [{ x: 5, y: 7 }];
      const result = flipPointsVertically(points);
      expect(result).toEqual([{ x: 5, y: 7 }]);
    });

    it('should preserve X coordinates', () => {
      const points = [
        { x: 5, y: 0 },
        { x: 15, y: 10 }
      ];
      const result = flipPointsVertically(points);
      expect(result[0].x).toBe(5);
      expect(result[1].x).toBe(15);
    });

    it('should flip asymmetric shape correctly', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0, y: 8 },
        { x: 6, y: 4 }
      ];
      // Center Y is at (0+8)/2 = 4
      const result = flipPointsVertically(points);

      expect(result[0].y).toBe(8);  // 2*4 - 0 = 8
      expect(result[1].y).toBe(0);  // 2*4 - 8 = 0
      expect(result[2].y).toBe(4);  // 2*4 - 4 = 4 (center stays)

      // X coordinates unchanged
      expect(result[0].x).toBe(0);
      expect(result[1].x).toBe(0);
      expect(result[2].x).toBe(6);
    });

    it('should handle negative coordinates', () => {
      const points = [
        { x: 5, y: -10 },
        { x: 5, y: 10 }
      ];
      // Center Y is at 0
      const result = flipPointsVertically(points);

      expect(result[0].y).toBe(10);  // 2*0 - (-10) = 10
      expect(result[1].y).toBe(-10); // 2*0 - 10 = -10
    });
  });

  describe('edge cases', () => {
    it('should handle two-point line horizontally', () => {
      const points = [
        { x: 0, y: 5 },
        { x: 10, y: 5 }
      ];
      const result = flipPointsHorizontally(points);
      // Center X = 5, points should swap
      expect(result[0].x).toBe(10);
      expect(result[1].x).toBe(0);
    });

    it('should handle two-point line vertically', () => {
      const points = [
        { x: 5, y: 0 },
        { x: 5, y: 10 }
      ];
      const result = flipPointsVertically(points);
      // Center Y = 5, points should swap
      expect(result[0].y).toBe(10);
      expect(result[1].y).toBe(0);
    });

    it('should handle very small coordinates', () => {
      const points = [
        { x: 0.001, y: 0.002 },
        { x: 0.003, y: 0.004 }
      ];
      const result = flipPointsHorizontally(points);
      // Center X = 0.002
      expect(result[0].x).toBeCloseTo(0.003);
      expect(result[1].x).toBeCloseTo(0.001);
    });

    it('should handle very large coordinates', () => {
      const points = [
        { x: 1000000, y: 0 },
        { x: 2000000, y: 0 }
      ];
      const result = flipPointsHorizontally(points);
      // Center X = 1500000
      expect(result[0].x).toBe(2000000);
      expect(result[1].x).toBe(1000000);
    });
  });
});
