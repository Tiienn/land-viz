import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validationService, validateAreaInput, validateMeasurement, validatePolygon, validateNumber } from '../ValidationService';
import type { Point2D, AreaUnit } from '../../types';

describe('ValidationService', () => {
  beforeEach(() => {
    // Reset any state if needed
    vi.clearAllMocks();
  });

  describe('Area Value Validation', () => {
    it('should validate positive numbers', () => {
      const result = validationService.validate('area-value', 100);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject NaN values', () => {
      const result = validationService.validate('area-value', NaN);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Value must be a valid number');
    });

    it('should reject negative values', () => {
      const result = validationService.validate('area-value', -50);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Area must be positive');
    });

    it('should reject zero values', () => {
      const result = validationService.validate('area-value', 0);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Area must be positive');
    });

    it('should reject extremely large values', () => {
      const result = validationService.validate('area-value', 1e15);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Area value is too large (max: 1 trillion m²)');
    });

    it('should warn about very small values', () => {
      const result = validationService.validate('area-value', 1e-7);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Very small area may not be visible');
    });

    it('should handle precision issues', () => {
      const result = validationService.validate('area-value', 1.123456789012345);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Excessive decimal precision may be rounded');
      expect(result.normalizedValue).toBeCloseTo(1.123456789, 10);
    });
  });

  describe('Point Validation', () => {
    it('should validate valid points', () => {
      const point: Point2D = { x: 10, y: 20 };
      const result = validationService.validate('point', point);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject points with infinite coordinates', () => {
      const pointInfiniteX: Point2D = { x: Infinity, y: 10 };
      const resultX = validationService.validate('point', pointInfiniteX);

      expect(resultX.isValid).toBe(false);
      expect(resultX.errors).toContain('X coordinate must be finite');

      const pointInfiniteY: Point2D = { x: 10, y: -Infinity };
      const resultY = validationService.validate('point', pointInfiniteY);

      expect(resultY.isValid).toBe(false);
      expect(resultY.errors).toContain('Y coordinate must be finite');
    });

    it('should reject points with NaN coordinates', () => {
      const point: Point2D = { x: NaN, y: 10 };
      const result = validationService.validate('point', point);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('X coordinate must be finite');
    });

    it('should reject extremely large coordinates', () => {
      const point: Point2D = { x: 1e9, y: 10 };
      const result = validationService.validate('point', point);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('X coordinate is too large');
    });
  });

  describe('Distance Validation', () => {
    it('should validate positive distances', () => {
      const result = validationService.validate('distance', 100);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject NaN distances', () => {
      const result = validationService.validate('distance', NaN);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Distance must be finite');
    });

    it('should reject negative distances', () => {
      const result = validationService.validate('distance', -10);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Distance cannot be negative');
    });

    it('should warn about zero distance', () => {
      const result = validationService.validate('distance', 0);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Zero distance measurement');
    });

    it('should reject extremely large distances', () => {
      const result = validationService.validate('distance', 1e9);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Distance is too large');
    });

    it('should warn about very small distances', () => {
      const result = validationService.validate('distance', 0.0001);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Very small distance may not be accurate');
    });
  });

  describe('Unit Conversion Validation', () => {
    it('should validate known units', () => {
      const conversionData = {
        value: 100,
        fromUnit: 'sqm' as AreaUnit,
        toUnit: 'sqft' as AreaUnit,
      };

      const result = validationService.validate('unit-conversion', conversionData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject unknown source units', () => {
      const conversionData = {
        value: 100,
        fromUnit: 'unknown-unit' as AreaUnit,
        toUnit: 'sqft' as AreaUnit,
      };

      const result = validationService.validate('unit-conversion', conversionData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid source unit: unknown-unit');
    });

    it('should reject unknown target units', () => {
      const conversionData = {
        value: 100,
        fromUnit: 'sqm' as AreaUnit,
        toUnit: 'unknown-unit' as AreaUnit,
      };

      const result = validationService.validate('unit-conversion', conversionData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid target unit: unknown-unit');
    });

    it('should warn about precision loss in conversions', () => {
      const conversionData = {
        value: 50, // Small value
        fromUnit: 'sqm' as AreaUnit,
        toUnit: 'hectares' as AreaUnit,
      };

      const result = validationService.validate('unit-conversion', conversionData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Converting small areas to large units may lose precision');
    });

    it('should warn about historical unit accuracy', () => {
      const conversionData = {
        value: 100,
        fromUnit: 'toise' as AreaUnit,
        toUnit: 'sqm' as AreaUnit,
      };

      const result = validationService.validate('unit-conversion', conversionData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Historical units are approximations based on regional standards');
    });

    it('should handle all supported units', () => {
      const supportedUnits: AreaUnit[] = [
        'sqm', 'sqft', 'acres', 'hectares', 'sqkm',
        'toise', 'perches', 'perches-mauritius',
        'arpent-na', 'arpent-paris', 'arpent-mauritius'
      ];

      supportedUnits.forEach(unit => {
        const conversionData = {
          value: 100,
          fromUnit: unit,
          toUnit: 'sqm' as AreaUnit,
        };

        const result = validationService.validate('unit-conversion', conversionData);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Polygon Validation', () => {
    it('should validate simple triangles', () => {
      const triangle: Point2D[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0.5, y: 1 },
      ];

      const result = validationService.validate('polygon', triangle);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate simple rectangles', () => {
      const rectangle: Point2D[] = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 0, y: 1 },
      ];

      const result = validationService.validate('polygon', rectangle);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject polygons with too few points', () => {
      const invalidPolygon: Point2D[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ];

      const result = validationService.validate('polygon', invalidPolygon);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Polygon must have at least 3 points');
    });

    it('should reject polygons with too many points', () => {
      const tooManyPoints: Point2D[] = Array.from({ length: 1001 }, (_, i) => ({
        x: i,
        y: i,
      }));

      const result = validationService.validate('polygon', tooManyPoints);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Polygon has too many points (max: 1000)');
    });

    it('should warn about duplicate consecutive points', () => {
      const duplicatePoints: Point2D[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 0 }, // Duplicate
        { x: 0, y: 1 },
      ];

      const result = validationService.validate('polygon', duplicatePoints);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Duplicate points detected'))).toBe(true);
    });

    it('should warn about degenerate polygons', () => {
      const degeneratePolygon: Point2D[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 }, // Same as first point
      ];

      const result = validationService.validate('polygon', degeneratePolygon);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('self-intersecting or degenerate'))).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    describe('validateAreaInput', () => {
      it('should validate valid area input', () => {
        const result = validateAreaInput('100.5', 'sqm');

        expect(result.isValid).toBe(true);
        expect(result.normalizedValue).toBe(100.5);
      });

      it('should reject invalid numeric input', () => {
        const result = validateAreaInput('abc', 'sqm');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Value must be a valid number');
      });

      it('should combine area and unit validation', () => {
        const result = validateAreaInput('100', 'invalid-unit' as AreaUnit);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Invalid source unit'))).toBe(true);
      });
    });

    describe('validateMeasurement', () => {
      it('should validate valid measurement points', () => {
        const start: Point2D = { x: 0, y: 0 };
        const end: Point2D = { x: 3, y: 4 };

        const result = validateMeasurement(start, end);

        expect(result.isValid).toBe(true);
        expect(result.normalizedValue).toBe(5); // Distance = sqrt(3² + 4²) = 5
      });

      it('should reject invalid points', () => {
        const start: Point2D = { x: NaN, y: 0 };
        const end: Point2D = { x: 3, y: 4 };

        const result = validateMeasurement(start, end);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('coordinate must be finite'))).toBe(true);
      });

      it('should warn about zero distance measurements', () => {
        const start: Point2D = { x: 1, y: 1 };
        const end: Point2D = { x: 1, y: 1 };

        const result = validateMeasurement(start, end);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Zero distance measurement');
      });
    });

    describe('validatePolygon', () => {
      it('should validate valid polygon', () => {
        const points: Point2D[] = [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0.5, y: 1 },
        ];

        const result = validatePolygon(points);

        expect(result.isValid).toBe(true);
      });

      it('should reject polygon with invalid points', () => {
        const points: Point2D[] = [
          { x: 0, y: 0 },
          { x: NaN, y: 0 },
          { x: 0.5, y: 1 },
        ];

        const result = validatePolygon(points);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Point 2'))).toBe(true);
      });
    });

    describe('validateNumber', () => {
      it('should validate positive numbers', () => {
        const result = validateNumber(42);

        expect(result.isValid).toBe(true);
      });

      it('should reject invalid numbers', () => {
        const result = validateNumber(NaN);

        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Custom Rules', () => {
    it('should allow adding custom validation rules', () => {
      validationService.addRule('custom-category', {
        name: 'custom-rule',
        validate: (value: number) => {
          if (value % 2 === 0) {
            return { isValid: true, errors: [], warnings: [] };
          } else {
            return { isValid: false, errors: ['Value must be even'], warnings: [] };
          }
        },
        priority: 'error',
      });

      const evenResult = validationService.validate('custom-category', 4);
      expect(evenResult.isValid).toBe(true);

      const oddResult = validationService.validate('custom-category', 3);
      expect(oddResult.isValid).toBe(false);
      expect(oddResult.errors).toContain('Value must be even');
    });

    it('should handle multiple rules for same category', () => {
      validationService.addRule('multi-rule-category', {
        name: 'positive-rule',
        validate: (value: number) => {
          return value > 0
            ? { isValid: true, errors: [], warnings: [] }
            : { isValid: false, errors: ['Must be positive'], warnings: [] };
        },
        priority: 'error',
      });

      validationService.addRule('multi-rule-category', {
        name: 'max-value-rule',
        validate: (value: number) => {
          return value <= 100
            ? { isValid: true, errors: [], warnings: [] }
            : { isValid: false, errors: ['Must be <= 100'], warnings: [] };
        },
        priority: 'error',
      });

      const validResult = validationService.validate('multi-rule-category', 50);
      expect(validResult.isValid).toBe(true);

      const negativeResult = validationService.validate('multi-rule-category', -10);
      expect(negativeResult.isValid).toBe(false);
      expect(negativeResult.errors).toContain('Must be positive');

      const tooLargeResult = validationService.validate('multi-rule-category', 150);
      expect(tooLargeResult.isValid).toBe(false);
      expect(tooLargeResult.errors).toContain('Must be <= 100');
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple values', () => {
      const validations = [
        { category: 'area-value', value: 100, id: 'area1' },
        { category: 'area-value', value: -50, id: 'area2' },
        { category: 'distance', value: 25, id: 'distance1' },
      ];

      const result = validationService.validateBatch(validations);

      expect(result.isValid).toBe(false); // Because area2 is invalid
      expect(result.results).toHaveLength(3);
      expect(result.results[0].isValid).toBe(true);
      expect(result.results[1].isValid).toBe(false);
      expect(result.results[2].isValid).toBe(true);
      expect(result.summary.errorCount).toBeGreaterThan(0);
    });

    it('should provide summary statistics', () => {
      const validations = [
        { category: 'area-value', value: 100 },
        { category: 'area-value', value: 1e-7 }, // Will generate warning
        { category: 'area-value', value: -50 }, // Will generate error
      ];

      const result = validationService.validateBatch(validations);

      expect(result.summary.errorCount).toBeGreaterThan(0);
      expect(result.summary.warningCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle rule execution errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      validationService.addRule('error-prone-category', {
        name: 'throwing-rule',
        validate: () => {
          throw new Error('Rule execution failed');
        },
        priority: 'error',
      });

      const result = validationService.validate('error-prone-category', 'any-value');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Validation error in throwing-rule');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle missing categories gracefully', () => {
      const result = validationService.validate('non-existent-category', 'any-value');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should validate large batches efficiently', () => {
      const largeBatch = Array.from({ length: 1000 }, (_, i) => ({
        category: 'area-value',
        value: i + 1,
        id: `item-${i}`,
      }));

      const startTime = performance.now();
      const result = validationService.validateBatch(largeBatch);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(result.results).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle complex validation rules efficiently', () => {
      const complexPoints: Point2D[] = Array.from({ length: 500 }, (_, i) => ({
        x: Math.cos(i * 0.1) * 100,
        y: Math.sin(i * 0.1) * 100,
      }));

      const startTime = performance.now();
      const result = validationService.validate('polygon', complexPoints);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(50); // Should handle complex polygons quickly
    });
  });

  describe('Statistics and Introspection', () => {
    it('should provide validation statistics', () => {
      const stats = validationService.getValidationStats();

      expect(stats.categories).toContain('area-value');
      expect(stats.categories).toContain('point');
      expect(stats.categories).toContain('distance');
      expect(stats.categories).toContain('unit-conversion');
      expect(stats.categories).toContain('polygon');

      expect(stats.totalRules).toBeGreaterThan(0);
      expect(stats.rulesByCategory['area-value']).toBeGreaterThan(0);
    });

    it('should track rules by category', () => {
      const stats = validationService.getValidationStats();

      Object.entries(stats.rulesByCategory).forEach(([category, count]) => {
        expect(count).toBeGreaterThan(0);
        expect(stats.categories).toContain(category);
      });
    });
  });
});