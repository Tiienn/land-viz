/**
 * Test suite for ConversionService
 */

import { ConversionService } from '../conversionService';
import type { AreaUnit } from '../../types/conversion';

describe('ConversionService', () => {
  beforeEach(() => {
    // Clear cache before each test
    ConversionService.clearCache();
  });

  describe('convertFromSquareMeters', () => {
    it('should return the same value for square meters', () => {
      expect(ConversionService.convertFromSquareMeters(100, 'sqm')).toBe(100);
    });

    it('should convert square meters to square feet correctly', () => {
      const result = ConversionService.convertFromSquareMeters(100, 'sqft');
      expect(result).toBeCloseTo(1076.39, 2);
    });

    it('should convert square meters to acres correctly', () => {
      const result = ConversionService.convertFromSquareMeters(4047, 'acres');
      expect(result).toBeCloseTo(1, 3);
    });

    it('should convert square meters to hectares correctly', () => {
      const result = ConversionService.convertFromSquareMeters(10000, 'hectares');
      expect(result).toBeCloseTo(1, 3);
    });

    it('should convert square meters to square kilometers correctly', () => {
      const result = ConversionService.convertFromSquareMeters(1000000, 'sqkm');
      expect(result).toBeCloseTo(1, 6);
    });

    it('should convert square meters to square miles correctly', () => {
      const result = ConversionService.convertFromSquareMeters(2589988, 'sqmi');
      expect(result).toBeCloseTo(1, 3);
    });

    it('should handle zero values', () => {
      expect(ConversionService.convertFromSquareMeters(0, 'sqft')).toBe(0);
    });

    it('should handle invalid values gracefully', () => {
      expect(ConversionService.convertFromSquareMeters(NaN, 'sqft')).toBe(0);
      expect(ConversionService.convertFromSquareMeters(Infinity, 'sqft')).toBe(0);
    });
  });

  describe('convertToSquareMeters', () => {
    it('should return the same value for square meters', () => {
      expect(ConversionService.convertToSquareMeters(100, 'sqm')).toBe(100);
    });

    it('should convert square feet to square meters correctly', () => {
      const result = ConversionService.convertToSquareMeters(1076.39, 'sqft');
      expect(result).toBeCloseTo(100, 1);
    });

    it('should convert acres to square meters correctly', () => {
      const result = ConversionService.convertToSquareMeters(1, 'acres');
      expect(result).toBeCloseTo(4047, 0);
    });

    it('should convert hectares to square meters correctly', () => {
      const result = ConversionService.convertToSquareMeters(1, 'hectares');
      expect(result).toBeCloseTo(10000, 0);
    });

    it('should handle invalid values gracefully', () => {
      expect(ConversionService.convertToSquareMeters(NaN, 'sqft')).toBe(0);
      expect(ConversionService.convertToSquareMeters(Infinity, 'sqft')).toBe(0);
    });
  });

  describe('convertBetweenUnits', () => {
    it('should return the same value for same units', () => {
      expect(ConversionService.convertBetweenUnits(100, 'sqft', 'sqft')).toBe(100);
    });

    it('should convert between different units correctly', () => {
      const result = ConversionService.convertBetweenUnits(1, 'acres', 'hectares');
      expect(result).toBeCloseTo(0.4047, 3);
    });

    it('should be bidirectional', () => {
      const forward = ConversionService.convertBetweenUnits(100, 'sqft', 'sqm');
      const backward = ConversionService.convertBetweenUnits(forward, 'sqm', 'sqft');
      expect(backward).toBeCloseTo(100, 1);
    });

    it('should handle edge cases', () => {
      expect(ConversionService.convertBetweenUnits(0, 'sqft', 'sqm')).toBe(0);
      expect(ConversionService.convertBetweenUnits(NaN, 'sqft', 'sqm')).toBe(0);
    });
  });

  describe('validateInput', () => {
    it('should validate empty input as zero', () => {
      const result = ConversionService.validateInput('');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should validate whitespace as zero', () => {
      const result = ConversionService.validateInput('   ');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should validate positive numbers', () => {
      const result = ConversionService.validateInput('123.45');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(123.45);
    });

    it('should validate scientific notation', () => {
      const result = ConversionService.validateInput('1.23e5');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(123000);
    });

    it('should reject negative numbers', () => {
      const result = ConversionService.validateInput('-123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Area cannot be negative');
    });

    it('should reject invalid characters', () => {
      const result = ConversionService.validateInput('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid number');
    });

    it('should reject very large numbers', () => {
      const result = ConversionService.validateInput('1e15');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value too large');
    });

    it('should reject NaN', () => {
      const result = ConversionService.validateInput('NaN');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid number');
    });

    it('should reject Infinity', () => {
      const result = ConversionService.validateInput('Infinity');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid number');
    });
  });

  describe('isInValidRange', () => {
    it('should accept valid positive numbers', () => {
      expect(ConversionService.isInValidRange(100)).toBe(true);
      expect(ConversionService.isInValidRange(0.01)).toBe(true);
      expect(ConversionService.isInValidRange(1000000)).toBe(true);
    });

    it('should accept zero', () => {
      expect(ConversionService.isInValidRange(0)).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(ConversionService.isInValidRange(-1)).toBe(false);
    });

    it('should reject very large numbers', () => {
      expect(ConversionService.isInValidRange(1e15)).toBe(false);
    });

    it('should reject invalid numbers', () => {
      expect(ConversionService.isInValidRange(NaN)).toBe(false);
      expect(ConversionService.isInValidRange(Infinity)).toBe(false);
      expect(ConversionService.isInValidRange(-Infinity)).toBe(false);
    });
  });

  describe('formatValue', () => {
    it('should format small numbers with appropriate precision', () => {
      expect(ConversionService.formatValue(123.456, 'sqm')).toBe('123.46');
    });

    it('should remove trailing zeros', () => {
      expect(ConversionService.formatValue(123.0, 'sqm')).toBe('123');
    });

    it('should handle very small numbers with scientific notation', () => {
      const result = ConversionService.formatValue(0.0000123, 'sqm');
      expect(result).toMatch(/1\.23e-5/i);
    });

    it('should handle zero correctly', () => {
      expect(ConversionService.formatValue(0, 'sqm')).toBe('0');
    });

    it('should handle invalid numbers', () => {
      expect(ConversionService.formatValue(NaN, 'sqm')).toBe('0');
      expect(ConversionService.formatValue(Infinity, 'sqm')).toBe('0');
    });
  });

  describe('formatConversionResult', () => {
    it('should format with unit symbol', () => {
      const result = ConversionService.formatConversionResult(123.45, 'sqm');
      expect(result).toBe('123.45 m²');
    });

    it('should format different units correctly', () => {
      expect(ConversionService.formatConversionResult(100, 'sqft')).toBe('100 ft²');
      expect(ConversionService.formatConversionResult(2.5, 'acres')).toBe('2.5 ac');
      expect(ConversionService.formatConversionResult(1.5, 'hectares')).toBe('1.5 ha');
    });
  });

  describe('convertToAllUnits', () => {
    it('should convert to all other units except source', () => {
      const results = ConversionService.convertToAllUnits(100, 'sqm');

      expect(results).toHaveLength(11); // 12 total units - 1 source unit

      const units = results.map(r => r.unit);
      expect(units).toContain('sqft');
      expect(units).toContain('acres');
      expect(units).toContain('hectares');
      expect(units).toContain('sqkm');
      expect(units).toContain('sqmi');
      expect(units).not.toContain('sqm');
    });

    it('should return empty array for invalid values', () => {
      expect(ConversionService.convertToAllUnits(NaN, 'sqm')).toEqual([]);
      expect(ConversionService.convertToAllUnits(Infinity, 'sqm')).toEqual([]);
      expect(ConversionService.convertToAllUnits(-1, 'sqm')).toEqual([]);
    });

    it('should include formatted strings', () => {
      const results = ConversionService.convertToAllUnits(100, 'sqm');

      results.forEach(result => {
        expect(result.formatted).toMatch(/^[\d.]+(\.\d+)?(e[+-]?\d+)?\s+[\w\-]+²?$/);
        expect(result.value).toBeGreaterThan(0);
        expect(typeof result.isApproximate).toBe('boolean');
      });
    });
  });

  describe('caching', () => {
    it('should cache conversion results', () => {
      // First call
      const start1 = performance.now();
      const result1 = ConversionService.convertBetweenUnits(100, 'sqm', 'sqft');
      const time1 = performance.now() - start1;

      // Second call (should be cached)
      const start2 = performance.now();
      const result2 = ConversionService.convertBetweenUnits(100, 'sqm', 'sqft');
      const time2 = performance.now() - start2;

      expect(result1).toBe(result2);
      // Second call should be significantly faster (cached)
      expect(time2).toBeLessThan(time1);
    });

    it('should provide cache statistics', () => {
      ConversionService.convertBetweenUnits(100, 'sqm', 'sqft');
      ConversionService.convertBetweenUnits(200, 'sqm', 'acres');

      const stats = ConversionService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.maxSize).toBe(100);
    });

    it('should clear cache properly', () => {
      ConversionService.convertBetweenUnits(100, 'sqm', 'sqft');
      let stats = ConversionService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      ConversionService.clearCache();
      stats = ConversionService.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('precision and accuracy', () => {
    it('should maintain precision for common conversions', () => {
      // 1 acre = 43,560 sq ft (exact)
      const acreToSqft = ConversionService.convertBetweenUnits(1, 'acres', 'sqft');
      expect(acreToSqft).toBeCloseTo(43560, 0);

      // 1 hectare = 10,000 sq m (exact)
      const hectareToSqm = ConversionService.convertBetweenUnits(1, 'hectares', 'sqm');
      expect(hectareToSqm).toBeCloseTo(10000, 0);
    });

    it('should handle very small values', () => {
      const result = ConversionService.convertBetweenUnits(0.0001, 'sqm', 'sqft');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should handle large values', () => {
      const result = ConversionService.convertBetweenUnits(1000000, 'sqm', 'sqkm');
      expect(result).toBeCloseTo(1, 6);
    });
  });
});