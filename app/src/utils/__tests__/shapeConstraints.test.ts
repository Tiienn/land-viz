import { describe, it, expect } from 'vitest';
import {
  applySquareConstraint,
  applyAngleConstraint,
  roundToNearestAngle,
  applyAxisLockConstraint
} from '../shapeConstraints';

describe('shapeConstraints', () => {
  describe('applySquareConstraint', () => {
    it('should create square in top-right quadrant (positive X, positive Y)', () => {
      const result = applySquareConstraint({ x: 0, y: 0 }, { x: 10, y: 5 });
      expect(result).toEqual({ x: 10, y: 10 }); // Uses max dimension (10)
    });

    it('should create square in bottom-left quadrant (negative X, negative Y)', () => {
      const result = applySquareConstraint({ x: 0, y: 0 }, { x: -7, y: -10 });
      expect(result).toEqual({ x: -10, y: -10 }); // Uses max dimension (10)
    });

    it('should create square in top-left quadrant (negative X, positive Y)', () => {
      const result = applySquareConstraint({ x: 0, y: 0 }, { x: -8, y: 12 });
      expect(result).toEqual({ x: -12, y: 12 }); // Uses max dimension (12)
    });

    it('should create square in bottom-right quadrant (positive X, negative Y)', () => {
      const result = applySquareConstraint({ x: 0, y: 0 }, { x: 15, y: -6 });
      expect(result).toEqual({ x: 15, y: -15 }); // Uses max dimension (15)
    });

    it('should handle equal dimensions (already square)', () => {
      const result = applySquareConstraint({ x: 0, y: 0 }, { x: 5, y: 5 });
      expect(result).toEqual({ x: 5, y: 5 }); // Already a square
    });

    it('should handle zero width (vertical line)', () => {
      const result = applySquareConstraint({ x: 0, y: 0 }, { x: 0, y: 8 });
      expect(result).toEqual({ x: 8, y: 8 }); // Uses height for both
    });

    it('should handle zero height (horizontal line)', () => {
      const result = applySquareConstraint({ x: 0, y: 0 }, { x: 9, y: 0 });
      expect(result).toEqual({ x: 9, y: 9 }); // Uses width for both
    });

    it('should work with non-zero anchor points', () => {
      const result = applySquareConstraint({ x: 5, y: 10 }, { x: 15, y: 14 });
      // Delta: (10, 4), max = 10
      expect(result).toEqual({ x: 15, y: 20 }); // 5+10=15, 10+10=20
    });

    it('should handle negative anchor points', () => {
      const result = applySquareConstraint({ x: -5, y: -5 }, { x: 5, y: 2 });
      // Delta: (10, 7), max = 10
      expect(result).toEqual({ x: 5, y: 5 }); // -5+10=5, -5+10=5
    });
  });

  describe('roundToNearestAngle', () => {
    describe('45° increments', () => {
      it('should round to 0° for small positive angles', () => {
        expect(roundToNearestAngle(0, 45)).toBe(0);
        expect(roundToNearestAngle(10, 45)).toBe(0);
        expect(roundToNearestAngle(22, 45)).toBe(0);
      });

      it('should round to 45° for angles near 45°', () => {
        expect(roundToNearestAngle(23, 45)).toBe(45);
        expect(roundToNearestAngle(45, 45)).toBe(45);
        expect(roundToNearestAngle(60, 45)).toBe(45);
      });

      it('should round to 90° for angles near 90°', () => {
        expect(roundToNearestAngle(68, 45)).toBe(90);
        expect(roundToNearestAngle(90, 45)).toBe(90);
        expect(roundToNearestAngle(110, 45)).toBe(90);
      });

      it('should round to 135° for angles near 135°', () => {
        expect(roundToNearestAngle(113, 45)).toBe(135);
        expect(roundToNearestAngle(135, 45)).toBe(135);
        expect(roundToNearestAngle(155, 45)).toBe(135);
      });

      it('should round to 180° for angles near 180°', () => {
        expect(roundToNearestAngle(158, 45)).toBe(180);
        expect(roundToNearestAngle(180, 45)).toBe(180);
        expect(roundToNearestAngle(200, 45)).toBe(180);
      });

      it('should round to 225° for angles near 225°', () => {
        expect(roundToNearestAngle(203, 45)).toBe(225);
        expect(roundToNearestAngle(225, 45)).toBe(225);
        expect(roundToNearestAngle(245, 45)).toBe(225);
      });

      it('should round to 270° for angles near 270°', () => {
        expect(roundToNearestAngle(248, 45)).toBe(270);
        expect(roundToNearestAngle(270, 45)).toBe(270);
        expect(roundToNearestAngle(290, 45)).toBe(270);
      });

      it('should round to 315° for angles near 315°', () => {
        expect(roundToNearestAngle(293, 45)).toBe(315);
        expect(roundToNearestAngle(315, 45)).toBe(315);
        expect(roundToNearestAngle(337, 45)).toBe(315);
      });
    });

    describe('negative angles (wrap-around)', () => {
      it('should handle -30° → 315° (wraps around)', () => {
        expect(roundToNearestAngle(-30, 45)).toBe(315);
      });

      it('should handle -45° → 315°', () => {
        expect(roundToNearestAngle(-45, 45)).toBe(315);
      });

      it('should handle -90° → 270°', () => {
        expect(roundToNearestAngle(-90, 45)).toBe(270);
      });

      it('should handle -180° → 180°', () => {
        expect(roundToNearestAngle(-180, 45)).toBe(180);
      });
    });

    describe('360° wrap-around', () => {
      it('should wrap 360° to 0°', () => {
        expect(roundToNearestAngle(360, 45)).toBe(0);
      });

      it('should wrap 350° to 0° (rounds up)', () => {
        expect(roundToNearestAngle(350, 45)).toBe(0);
      });

      it('should wrap 405° to 45° (normalizes first)', () => {
        expect(roundToNearestAngle(405, 45)).toBe(45);
      });
    });

    describe('custom angle steps', () => {
      it('should work with 30° steps', () => {
        expect(roundToNearestAngle(10, 30)).toBe(0);
        expect(roundToNearestAngle(20, 30)).toBe(30);
        expect(roundToNearestAngle(50, 30)).toBe(60);
      });

      it('should work with 15° steps', () => {
        expect(roundToNearestAngle(7, 15)).toBe(0);
        expect(roundToNearestAngle(12, 15)).toBe(15);
        expect(roundToNearestAngle(20, 15)).toBe(15);
      });

      it('should work with 90° steps (orthogonal only)', () => {
        expect(roundToNearestAngle(45, 90)).toBe(90); // 45 rounds up to 90
        expect(roundToNearestAngle(70, 90)).toBe(90);
        expect(roundToNearestAngle(135, 90)).toBe(180); // 135 rounds up to 180
      });
    });
  });

  describe('applyAngleConstraint', () => {
    const tolerance = 0.1; // Allow small floating-point errors

    it('should constrain to 0° (horizontal right)', () => {
      const result = applyAngleConstraint({ x: 0, y: 0 }, { x: 10, y: 2 });
      const expectedDistance = Math.sqrt(10 * 10 + 2 * 2); // ~10.2
      expect(result.x).toBeCloseTo(expectedDistance, 1);
      expect(result.y).toBeCloseTo(0, 1);
    });

    it('should constrain to 90° (vertical up)', () => {
      const result = applyAngleConstraint({ x: 0, y: 0 }, { x: 2, y: 10 });
      const expectedDistance = Math.sqrt(2 * 2 + 10 * 10); // ~10.2
      expect(result.x).toBeCloseTo(0, 1);
      expect(result.y).toBeCloseTo(expectedDistance, 1);
    });

    it('should constrain to 180° (horizontal left)', () => {
      const result = applyAngleConstraint({ x: 0, y: 0 }, { x: -10, y: -2 });
      const expectedDistance = Math.sqrt(10 * 10 + 2 * 2); // ~10.2
      expect(result.x).toBeCloseTo(-expectedDistance, 1);
      expect(result.y).toBeCloseTo(0, 1);
    });

    it('should constrain to 270° (vertical down)', () => {
      const result = applyAngleConstraint({ x: 0, y: 0 }, { x: -2, y: -10 });
      const expectedDistance = Math.sqrt(2 * 2 + 10 * 10); // ~10.2
      expect(result.x).toBeCloseTo(0, 1);
      expect(result.y).toBeCloseTo(-expectedDistance, 1);
    });

    it('should constrain to 45° (diagonal NE)', () => {
      const result = applyAngleConstraint({ x: 0, y: 0 }, { x: 10, y: 9 });
      const distance = Math.sqrt(10 * 10 + 9 * 9); // ~13.45
      const expected45X = distance * Math.cos(45 * (Math.PI / 180));
      const expected45Y = distance * Math.sin(45 * (Math.PI / 180));
      expect(result.x).toBeCloseTo(expected45X, 1);
      expect(result.y).toBeCloseTo(expected45Y, 1);
    });

    it('should constrain to 135° (diagonal NW)', () => {
      const result = applyAngleConstraint({ x: 0, y: 0 }, { x: -10, y: 9 });
      const distance = Math.sqrt(10 * 10 + 9 * 9);
      const expected135X = distance * Math.cos(135 * (Math.PI / 180));
      const expected135Y = distance * Math.sin(135 * (Math.PI / 180));
      expect(result.x).toBeCloseTo(expected135X, 1);
      expect(result.y).toBeCloseTo(expected135Y, 1);
    });

    it('should constrain to 225° (diagonal SW)', () => {
      const result = applyAngleConstraint({ x: 0, y: 0 }, { x: -10, y: -9 });
      const distance = Math.sqrt(10 * 10 + 9 * 9);
      const expected225X = distance * Math.cos(225 * (Math.PI / 180));
      const expected225Y = distance * Math.sin(225 * (Math.PI / 180));
      expect(result.x).toBeCloseTo(expected225X, 1);
      expect(result.y).toBeCloseTo(expected225Y, 1);
    });

    it('should constrain to 315° (diagonal SE)', () => {
      const result = applyAngleConstraint({ x: 0, y: 0 }, { x: 10, y: -9 });
      const distance = Math.sqrt(10 * 10 + 9 * 9);
      const expected315X = distance * Math.cos(315 * (Math.PI / 180));
      const expected315Y = distance * Math.sin(315 * (Math.PI / 180));
      expect(result.x).toBeCloseTo(expected315X, 1);
      expect(result.y).toBeCloseTo(expected315Y, 1);
    });

    it('should maintain distance when constraining', () => {
      const start = { x: 0, y: 0 };
      const cursor = { x: 7, y: 5 };
      const originalDistance = Math.sqrt(7 * 7 + 5 * 5);
      const result = applyAngleConstraint(start, cursor);
      const constrainedDistance = Math.sqrt(result.x * result.x + result.y * result.y);
      expect(constrainedDistance).toBeCloseTo(originalDistance, 1);
    });

    it('should work with non-zero start points', () => {
      const result = applyAngleConstraint({ x: 5, y: 10 }, { x: 15, y: 12 });
      // Delta: (10, 2), should constrain to 0° (horizontal)
      const distance = Math.sqrt(10 * 10 + 2 * 2);
      expect(result.x).toBeCloseTo(5 + distance, 1);
      expect(result.y).toBeCloseTo(10, 1);
    });

    it('should handle zero distance (cursor at start point)', () => {
      const result = applyAngleConstraint({ x: 5, y: 5 }, { x: 5, y: 5 });
      expect(result).toEqual({ x: 5, y: 5 }); // Returns start point unchanged
    });

    it('should work with custom angle step (30°)', () => {
      const result = applyAngleConstraint({ x: 0, y: 0 }, { x: 10, y: 5 }, 30);
      // 10,5 is ~26.6°, should round to 30°
      const distance = Math.sqrt(10 * 10 + 5 * 5);
      const expected30X = distance * Math.cos(30 * (Math.PI / 180));
      const expected30Y = distance * Math.sin(30 * (Math.PI / 180));
      expect(result.x).toBeCloseTo(expected30X, 1);
      expect(result.y).toBeCloseTo(expected30Y, 1);
    });
  });

  describe('applyAxisLockConstraint', () => {
    describe('horizontal lock (dominant X movement)', () => {
      it('should lock to horizontal axis when X > Y', () => {
        const result = applyAxisLockConstraint(10, 3);
        expect(result).toEqual({ offsetX: 10, offsetY: 0 });
      });

      it('should lock to horizontal with negative X', () => {
        const result = applyAxisLockConstraint(-12, -4);
        expect(result).toEqual({ offsetX: -12, offsetY: 0 });
      });

      it('should lock to horizontal with mixed signs', () => {
        const result = applyAxisLockConstraint(15, -5);
        expect(result).toEqual({ offsetX: 15, offsetY: 0 });
      });
    });

    describe('vertical lock (dominant Y movement)', () => {
      it('should lock to vertical axis when Y > X', () => {
        const result = applyAxisLockConstraint(2, 15);
        expect(result).toEqual({ offsetX: 0, offsetY: 15 });
      });

      it('should lock to vertical with negative Y', () => {
        const result = applyAxisLockConstraint(-3, -18);
        expect(result).toEqual({ offsetX: 0, offsetY: -18 });
      });

      it('should lock to vertical with mixed signs', () => {
        const result = applyAxisLockConstraint(4, -20);
        expect(result).toEqual({ offsetX: 0, offsetY: -20 });
      });
    });

    describe('threshold behavior', () => {
      it('should NOT lock if movement is below threshold', () => {
        const result = applyAxisLockConstraint(2, 3, 5);
        expect(result).toEqual({ offsetX: 2, offsetY: 3 }); // No lock
      });

      it('should NOT lock if X below threshold', () => {
        const result = applyAxisLockConstraint(4, 4.5, 5);
        expect(result).toEqual({ offsetX: 4, offsetY: 4.5 }); // No lock
      });

      it('should lock if at least one axis exceeds threshold', () => {
        const result = applyAxisLockConstraint(7, 2, 5);
        expect(result).toEqual({ offsetX: 7, offsetY: 0 }); // Locks
      });

      it('should work with custom threshold', () => {
        const result = applyAxisLockConstraint(8, 3, 10);
        expect(result).toEqual({ offsetX: 8, offsetY: 3 }); // No lock (below 10)
      });

      it('should lock exactly at threshold boundary', () => {
        const result = applyAxisLockConstraint(5, 2, 5);
        expect(result).toEqual({ offsetX: 5, offsetY: 0 }); // Locks (X = threshold)
      });
    });

    describe('tie-breaker (equal X/Y offsets)', () => {
      it('should lock to horizontal when offsets are exactly equal (DD-017.6)', () => {
        const result = applyAxisLockConstraint(10, 10);
        expect(result).toEqual({ offsetX: 10, offsetY: 0 }); // Horizontal wins tie
      });

      it('should lock to horizontal with negative equal offsets', () => {
        const result = applyAxisLockConstraint(-8, -8);
        expect(result).toEqual({ offsetX: -8, offsetY: 0 }); // Horizontal wins tie
      });

      it('should lock to horizontal when absolute values are equal', () => {
        const result = applyAxisLockConstraint(7, -7);
        expect(result).toEqual({ offsetX: 7, offsetY: 0 }); // Horizontal wins tie
      });
    });

    describe('edge cases', () => {
      it('should handle zero offsets', () => {
        const result = applyAxisLockConstraint(0, 0);
        expect(result).toEqual({ offsetX: 0, offsetY: 0 }); // No lock
      });

      it('should handle very small non-zero offsets', () => {
        const result = applyAxisLockConstraint(0.1, 0.2, 5);
        expect(result).toEqual({ offsetX: 0.1, offsetY: 0.2 }); // No lock
      });

      it('should handle very large offsets', () => {
        const result = applyAxisLockConstraint(1000, 200);
        expect(result).toEqual({ offsetX: 1000, offsetY: 0 }); // Horizontal lock
      });

      it('should handle fractional offsets', () => {
        const result = applyAxisLockConstraint(7.5, 3.2);
        expect(result).toEqual({ offsetX: 7.5, offsetY: 0 }); // Horizontal lock
      });
    });
  });
});
