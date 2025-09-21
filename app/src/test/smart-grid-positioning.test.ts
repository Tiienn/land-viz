import { describe, it, expect } from 'vitest';
import {
  calculateGridAwareDimensions,
  calculateSmartGridPosition,
  analyzeGridSnapImpact,
  convertToSquareMeters,
  calculateSquareDimensions
} from '../utils/areaCalculations';
import type { AreaUnit } from '../types';

describe('Smart Grid Positioning', () => {
  describe('calculateGridAwareDimensions', () => {
    it('should return exact dimensions regardless of grid settings', () => {
      const targetArea = 4000; // 4000 m²
      const gridSize = 1;

      // Test with grid snapping enabled
      const withSnapping = calculateGridAwareDimensions(targetArea, gridSize, true);

      // Test with grid snapping disabled
      const withoutSnapping = calculateGridAwareDimensions(targetArea, gridSize, false);

      // Both should return exact dimensions
      const expectedSide = Math.sqrt(targetArea); // ≈ 63.25 meters

      expect(withSnapping.width).toBeCloseTo(expectedSide, 5);
      expect(withSnapping.height).toBeCloseTo(expectedSide, 5);
      expect(withoutSnapping.width).toBeCloseTo(expectedSide, 5);
      expect(withoutSnapping.height).toBeCloseTo(expectedSide, 5);

      // Both should be identical (no more grid-based adjustment)
      expect(withSnapping.width).toBe(withoutSnapping.width);
      expect(withSnapping.height).toBe(withoutSnapping.height);
    });

    it('should preserve exact area for various input sizes', () => {
      const testCases = [1000, 2500, 4000, 5678, 10000];

      testCases.forEach(area => {
        const dimensions = calculateGridAwareDimensions(area, 1, true);
        const actualArea = dimensions.width * dimensions.height;

        expect(actualArea).toBeCloseTo(area, 5);
      });
    });
  });

  describe('calculateSmartGridPosition', () => {
    it('should return origin when grid snapping is disabled', () => {
      const width = 63.25;
      const height = 63.25;
      const gridSize = 1;

      const position = calculateSmartGridPosition(width, height, gridSize, false);

      expect(position.center.x).toBe(0);
      expect(position.center.y).toBe(0);
      expect(position.gridAlignmentScore).toBe(0);
      expect(position.description).toContain('grid snapping disabled');
    });

    it('should find optimal center position for grid alignment', () => {
      const width = 63.25; // From 4000 m²
      const height = 63.25;
      const gridSize = 1;

      const position = calculateSmartGridPosition(width, height, gridSize, true);

      // Center should be within reasonable bounds
      expect(Math.abs(position.center.x)).toBeLessThanOrEqual(gridSize);
      expect(Math.abs(position.center.y)).toBeLessThanOrEqual(gridSize);

      // Alignment score should be between 0 and 1
      expect(position.gridAlignmentScore).toBeGreaterThanOrEqual(0);
      expect(position.gridAlignmentScore).toBeLessThanOrEqual(1);

      // Should have a meaningful description
      expect(position.description).toBeTruthy();
      expect(position.description.length).toBeGreaterThan(10);
    });

    it('should provide better alignment for grid-friendly dimensions', () => {
      const gridSize = 1;

      // Grid-friendly dimensions (perfect square on grid)
      const gridFriendly = calculateSmartGridPosition(64, 64, gridSize, true);

      // Non-grid-friendly dimensions (fractional)
      const nonGridFriendly = calculateSmartGridPosition(63.25, 63.25, gridSize, true);

      // Grid-friendly should have better or equal alignment score
      expect(gridFriendly.gridAlignmentScore).toBeGreaterThanOrEqual(nonGridFriendly.gridAlignmentScore);
    });

    it('should return precise center coordinates (0.01m precision)', () => {
      const position = calculateSmartGridPosition(63.25, 63.25, 1, true);

      // Check precision (should be rounded to 0.01m)
      // Use toBeCloseTo to handle floating point precision issues (-0 vs +0)
      expect(position.center.x * 100 % 1).toBeCloseTo(0, 10);
      expect(position.center.y * 100 % 1).toBeCloseTo(0, 10);
    });
  });

  describe('analyzeGridSnapImpact', () => {
    it('should show no area impact with smart grid positioning', () => {
      const targetArea = 4000;
      const unit: AreaUnit = 'sqm';
      const gridSize = 1;

      const impact = analyzeGridSnapImpact(targetArea, unit, gridSize, true);

      // With smart positioning, area should be preserved
      expect(impact.hasSignificantImpact).toBe(false);
      expect(impact.originalArea).toBe(targetArea);
      expect(impact.snappedArea).toBe(targetArea);
      expect(impact.areaLoss).toBe(0);
      expect(impact.percentageChange).toBe(0);
      expect(impact.recommendDisableSnapping).toBe(false);
    });

    it('should include grid alignment information', () => {
      const impact = analyzeGridSnapImpact(4000, 'sqm', 1, true);

      expect(impact.gridAlignment).toBeDefined();
      expect(impact.gridAlignment?.score).toBeGreaterThanOrEqual(0);
      expect(impact.gridAlignment?.score).toBeLessThanOrEqual(1);
      expect(impact.gridAlignment?.description).toBeTruthy();
    });

    it('should work correctly with different units', () => {
      const testCases: { area: number; unit: AreaUnit }[] = [
        { area: 4000, unit: 'sqm' },
        { area: 1000, unit: 'sqft' }, // More reasonable test value
        { area: 1, unit: 'acres' },
        { area: 0.4, unit: 'hectares' },
      ];

      testCases.forEach(({ area, unit }) => {
        const impact = analyzeGridSnapImpact(area, unit, 1, true);

        // Convert expected area to square meters for validation
        const expectedSqM = convertToSquareMeters(area, unit);

        expect(impact.originalArea).toBeCloseTo(expectedSqM, 2);
        expect(impact.snappedArea).toBeCloseTo(expectedSqM, 2);
        expect(impact.areaLoss).toBe(0);
        expect(impact.percentageChange).toBe(0);
      });
    });

    it('should behave consistently when grid snapping is disabled', () => {
      const impact = analyzeGridSnapImpact(4000, 'sqm', 1, false);

      expect(impact.hasSignificantImpact).toBe(false);
      expect(impact.originalArea).toBe(4000);
      expect(impact.snappedArea).toBe(4000);
      expect(impact.areaLoss).toBe(0);
      expect(impact.percentageChange).toBe(0);
      expect(impact.recommendDisableSnapping).toBe(false);
    });
  });

  describe('Integration: Complete Smart Grid Flow', () => {
    it('should create exactly 4000 m² shape with smart positioning', () => {
      const targetArea = 4000;
      const unit: AreaUnit = 'sqm';
      const gridSize = 1;
      const snapToGrid = true;

      // Step 1: Get exact dimensions
      const dimensions = calculateGridAwareDimensions(targetArea, gridSize, snapToGrid);

      // Step 2: Get smart position
      const position = calculateSmartGridPosition(
        dimensions.width,
        dimensions.height,
        gridSize,
        snapToGrid
      );

      // Step 3: Calculate final points
      const center = position.center;
      const finalPoints = [
        { x: center.x - dimensions.width/2, y: center.y - dimensions.height/2 },
        { x: center.x + dimensions.width/2, y: center.y - dimensions.height/2 },
        { x: center.x + dimensions.width/2, y: center.y + dimensions.height/2 },
        { x: center.x - dimensions.width/2, y: center.y + dimensions.height/2 }
      ];

      // Verify exact area preservation
      const width = finalPoints[1].x - finalPoints[0].x;
      const height = finalPoints[2].y - finalPoints[1].y;
      const actualArea = width * height;

      expect(actualArea).toBeCloseTo(targetArea, 5);

      // Verify grid impact analysis
      const impact = analyzeGridSnapImpact(targetArea, unit, gridSize, snapToGrid);
      expect(impact.hasSignificantImpact).toBe(false);
      expect(impact.snappedArea).toBe(targetArea);
    });

    it('should provide consistent results for repeated calls', () => {
      const targetArea = 4000;
      const gridSize = 1;

      // Call multiple times with same parameters
      const results = Array.from({ length: 5 }, () => {
        const dimensions = calculateGridAwareDimensions(targetArea, gridSize, true);
        const position = calculateSmartGridPosition(dimensions.width, dimensions.height, gridSize, true);
        const impact = analyzeGridSnapImpact(targetArea, 'sqm', gridSize, true);

        return { dimensions, position, impact };
      });

      // All results should be identical
      const first = results[0];
      results.slice(1).forEach(result => {
        expect(result.dimensions.width).toBe(first.dimensions.width);
        expect(result.dimensions.height).toBe(first.dimensions.height);
        expect(result.position.center.x).toBe(first.position.center.x);
        expect(result.position.center.y).toBe(first.position.center.y);
        expect(result.position.gridAlignmentScore).toBe(first.position.gridAlignmentScore);
        expect(result.impact.snappedArea).toBe(first.impact.snappedArea);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle very small areas', () => {
      const smallArea = 1; // 1 m²
      const dimensions = calculateGridAwareDimensions(smallArea, 1, true);
      const position = calculateSmartGridPosition(dimensions.width, dimensions.height, 1, true);

      expect(dimensions.width * dimensions.height).toBeCloseTo(smallArea, 5);
      expect(position.center).toBeDefined();
      expect(position.gridAlignmentScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large areas', () => {
      const largeArea = 100000; // 100,000 m²
      const dimensions = calculateGridAwareDimensions(largeArea, 1, true);
      const position = calculateSmartGridPosition(dimensions.width, dimensions.height, 1, true);

      expect(dimensions.width * dimensions.height).toBeCloseTo(largeArea, 3);
      expect(position.center).toBeDefined();
      expect(position.gridAlignmentScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle different grid sizes', () => {
      const targetArea = 4000;
      const gridSizes = [0.5, 1, 2, 5, 10];

      gridSizes.forEach(gridSize => {
        const dimensions = calculateGridAwareDimensions(targetArea, gridSize, true);
        const position = calculateSmartGridPosition(dimensions.width, dimensions.height, gridSize, true);

        expect(dimensions.width * dimensions.height).toBeCloseTo(targetArea, 5);
        expect(Math.abs(position.center.x)).toBeLessThanOrEqual(gridSize);
        expect(Math.abs(position.center.y)).toBeLessThanOrEqual(gridSize);
      });
    });
  });
});