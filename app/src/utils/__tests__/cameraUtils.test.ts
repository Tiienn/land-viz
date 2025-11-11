/**
 * Camera Utilities Unit Tests
 *
 * Tests for camera bounds validation and comparison utilities.
 * These functions are critical for the 2D camera restoration fix.
 */

import { describe, it, expect } from 'vitest';
import {
  areBoundsValid,
  boundsMatch,
  getMaxBoundsDelta,
  CAMERA_THRESHOLDS,
  type CameraBounds,
} from '../cameraUtils';

describe('cameraUtils', () => {
  describe('areBoundsValid', () => {
    it('should return true for valid bounds', () => {
      const validBounds: CameraBounds = {
        left: -50,
        right: 50,
        top: 50,
        bottom: -50,
      };

      expect(areBoundsValid(validBounds)).toBe(true);
    });

    it('should return false if left is NaN', () => {
      const invalidBounds: CameraBounds = {
        left: NaN,
        right: 50,
        top: 50,
        bottom: -50,
      };

      expect(areBoundsValid(invalidBounds)).toBe(false);
    });

    it('should return false if right is NaN', () => {
      const invalidBounds: CameraBounds = {
        left: -50,
        right: NaN,
        top: 50,
        bottom: -50,
      };

      expect(areBoundsValid(invalidBounds)).toBe(false);
    });

    it('should return false if top is NaN', () => {
      const invalidBounds: CameraBounds = {
        left: -50,
        right: 50,
        top: NaN,
        bottom: -50,
      };

      expect(areBoundsValid(invalidBounds)).toBe(false);
    });

    it('should return false if bottom is NaN', () => {
      const invalidBounds: CameraBounds = {
        left: -50,
        right: 50,
        top: 50,
        bottom: NaN,
      };

      expect(areBoundsValid(invalidBounds)).toBe(false);
    });

    it('should return false if multiple values are NaN', () => {
      const invalidBounds: CameraBounds = {
        left: NaN,
        right: NaN,
        top: NaN,
        bottom: NaN,
      };

      expect(areBoundsValid(invalidBounds)).toBe(false);
    });

    it('should return true for zero bounds', () => {
      const zeroBounds: CameraBounds = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      };

      expect(areBoundsValid(zeroBounds)).toBe(true);
    });

    it('should return true for negative bounds', () => {
      const negativeBounds: CameraBounds = {
        left: -100,
        right: -10,
        top: -20,
        bottom: -80,
      };

      expect(areBoundsValid(negativeBounds)).toBe(true);
    });

    it('should return true for very large bounds', () => {
      const largeBounds: CameraBounds = {
        left: -10000,
        right: 10000,
        top: 10000,
        bottom: -10000,
      };

      expect(areBoundsValid(largeBounds)).toBe(true);
    });

    it('should return true for decimal bounds', () => {
      const decimalBounds: CameraBounds = {
        left: -50.123,
        right: 50.456,
        top: 50.789,
        bottom: -50.012,
      };

      expect(areBoundsValid(decimalBounds)).toBe(true);
    });

    it('should return false for Infinity values', () => {
      const infinityBounds: CameraBounds = {
        left: -Infinity,
        right: 50,
        top: 50,
        bottom: -50,
      };

      expect(areBoundsValid(infinityBounds)).toBe(false);
    });

    it('should return false for -Infinity values', () => {
      const infinityBounds: CameraBounds = {
        left: -50,
        right: 50,
        top: 50,
        bottom: -Infinity,
      };

      expect(areBoundsValid(infinityBounds)).toBe(false);
    });
  });

  describe('boundsMatch', () => {
    it('should return true for identical bounds', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };

      expect(boundsMatch(a, b, 0.1)).toBe(true);
    });

    it('should return true for bounds within epsilon', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = {
        left: -50.05,
        right: 50.05,
        top: 50.05,
        bottom: -50.05,
      };

      expect(boundsMatch(a, b, 0.1)).toBe(true);
    });

    it('should return false for bounds outside epsilon', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = {
        left: -50.2,
        right: 50.2,
        top: 50.2,
        bottom: -50.2,
      };

      expect(boundsMatch(a, b, 0.1)).toBe(false);
    });

    it('should return false if any bound exceeds epsilon', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = {
        left: -50.05,
        right: 50.05,
        top: 50.2, // Exceeds epsilon
        bottom: -50.05,
      };

      expect(boundsMatch(a, b, 0.1)).toBe(false);
    });

    it('should work with very small epsilon', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = {
        left: -50.005,
        right: 50.005,
        top: 50.005,
        bottom: -50.005,
      };

      expect(boundsMatch(a, b, 0.01)).toBe(true);
      expect(boundsMatch(a, b, 0.001)).toBe(false);
    });

    it('should work with very large epsilon', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -45, right: 55, top: 55, bottom: -45 };

      expect(boundsMatch(a, b, 10)).toBe(true);
      expect(boundsMatch(a, b, 1)).toBe(false);
    });

    it('should handle very small epsilon (near-exact match)', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const c: CameraBounds = {
        left: -50.0001,
        right: 50,
        top: 50,
        bottom: -50,
      };

      expect(boundsMatch(a, b, 0.00001)).toBe(true);
      expect(boundsMatch(a, c, 0.00001)).toBe(false);
    });

    it('should handle negative deltas correctly', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = {
        left: -49.95, // Positive delta
        right: 49.95, // Negative delta
        top: 50.05, // Positive delta
        bottom: -49.95, // Negative delta
      };

      expect(boundsMatch(a, b, 0.1)).toBe(true);
    });

    it('should use CAMERA_THRESHOLDS.BOUNDS_EPSILON constant', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = {
        left: -50.05,
        right: 50.05,
        top: 50.05,
        bottom: -50.05,
      };

      expect(boundsMatch(a, b, CAMERA_THRESHOLDS.BOUNDS_EPSILON)).toBe(true);
    });
  });

  describe('getMaxBoundsDelta', () => {
    it('should return 0 for identical bounds', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };

      expect(getMaxBoundsDelta(a, b)).toBe(0);
    });

    it('should return max delta when all deltas are equal', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -52, right: 52, top: 52, bottom: -52 };

      expect(getMaxBoundsDelta(a, b)).toBe(2);
    });

    it('should return max delta when one delta is larger', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -55, right: 51, top: 51, bottom: -51 };

      expect(getMaxBoundsDelta(a, b)).toBe(5);
    });

    it('should return max delta from any bound', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -50, right: 60, top: 50, bottom: -50 };

      expect(getMaxBoundsDelta(a, b)).toBe(10);
    });

    it('should handle negative deltas (absolute value)', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -45, right: 45, top: 45, bottom: -45 };

      expect(getMaxBoundsDelta(a, b)).toBe(5);
    });

    it('should handle decimal deltas', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = {
        left: -50.123,
        right: 50.456,
        top: 50.789,
        bottom: -50.234,
      };

      expect(getMaxBoundsDelta(a, b)).toBeCloseTo(0.789, 3);
    });

    it('should compare to CAMERA_THRESHOLDS.SIGNIFICANT_BOUNDS_CHANGE', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -52, right: 52, top: 52, bottom: -52 };

      const delta = getMaxBoundsDelta(a, b);
      expect(delta).toBeGreaterThan(CAMERA_THRESHOLDS.SIGNIFICANT_BOUNDS_CHANGE);
    });

    it('should handle very small deltas', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = {
        left: -50.001,
        right: 50.002,
        top: 50.001,
        bottom: -50.001,
      };

      expect(getMaxBoundsDelta(a, b)).toBeCloseTo(0.002, 3);
    });

    it('should handle very large deltas', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = {
        left: -1000,
        right: 1000,
        top: 1000,
        bottom: -1000,
      };

      expect(getMaxBoundsDelta(a, b)).toBe(950);
    });

    it('should work with asymmetric deltas', () => {
      const a: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const b: CameraBounds = { left: -60, right: 51, top: 52, bottom: -48 };

      // Deltas: left=10, right=1, top=2, bottom=2
      expect(getMaxBoundsDelta(a, b)).toBe(10);
    });
  });

  describe('CAMERA_THRESHOLDS', () => {
    it('should have correct ZOOM_EPSILON value', () => {
      expect(CAMERA_THRESHOLDS.ZOOM_EPSILON).toBe(0.01);
    });

    it('should have correct BOUNDS_EPSILON value', () => {
      expect(CAMERA_THRESHOLDS.BOUNDS_EPSILON).toBe(0.1);
    });

    it('should have correct SIGNIFICANT_BOUNDS_CHANGE value', () => {
      expect(CAMERA_THRESHOLDS.SIGNIFICANT_BOUNDS_CHANGE).toBe(1);
    });

    // Note: TypeScript enforces readonly at compile time via 'as const'
    // Runtime modification prevention would require Object.freeze()
  });

  describe('integration scenarios', () => {
    it('should detect valid viewport resize', () => {
      const before: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const after: CameraBounds = { left: -60, right: 60, top: 60, bottom: -60 };

      // Viewport resized significantly
      expect(areBoundsValid(after)).toBe(true);
      expect(
        boundsMatch(before, after, CAMERA_THRESHOLDS.BOUNDS_EPSILON)
      ).toBe(false);
      expect(
        getMaxBoundsDelta(before, after) >
          CAMERA_THRESHOLDS.SIGNIFICANT_BOUNDS_CHANGE
      ).toBe(true);
    });

    it('should detect jitter (insignificant change)', () => {
      const before: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };
      const after: CameraBounds = {
        left: -50.05,
        right: 50.05,
        top: 50.05,
        bottom: -50.05,
      };

      // Jitter - bounds changed slightly
      expect(areBoundsValid(after)).toBe(true);
      expect(
        boundsMatch(before, after, CAMERA_THRESHOLDS.BOUNDS_EPSILON)
      ).toBe(true);
      expect(
        getMaxBoundsDelta(before, after) <
          CAMERA_THRESHOLDS.SIGNIFICANT_BOUNDS_CHANGE
      ).toBe(true);
    });

    it('should detect React Three Fiber reset (back to orthoBounds)', () => {
      const orthoBounds: CameraBounds = {
        left: -50,
        right: 50,
        top: 50,
        bottom: -50,
      };
      const zoomed: CameraBounds = { left: -25, right: 25, top: 25, bottom: -25 };
      const reset: CameraBounds = { left: -50, right: 50, top: 50, bottom: -50 };

      // Camera was zoomed, then reset back to orthoBounds
      expect(areBoundsValid(reset)).toBe(true);
      expect(
        boundsMatch(zoomed, reset, CAMERA_THRESHOLDS.BOUNDS_EPSILON)
      ).toBe(false);
      expect(
        boundsMatch(orthoBounds, reset, CAMERA_THRESHOLDS.BOUNDS_EPSILON)
      ).toBe(true);
    });

    it('should handle invalid bounds from React Three Fiber', () => {
      const invalidBounds: CameraBounds = {
        left: NaN,
        right: NaN,
        top: NaN,
        bottom: NaN,
      };

      // Should skip restoration for invalid bounds
      expect(areBoundsValid(invalidBounds)).toBe(false);
    });
  });
});
