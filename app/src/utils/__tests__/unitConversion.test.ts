/**
 * Unit Tests for Unit Conversion Utilities
 *
 * Tests conversion functions for length and area measurements
 * across meters, feet, and yards.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  convertLength,
  convertArea,
  convertLengths,
  formatLength,
  formatArea,
  normalizeDimensions,
  normalizeArea,
  getConversionFactor,
  getAreaConversionFactor,
  parseDimension,
  LENGTH_CONVERSIONS,
  AREA_CONVERSIONS,
  UNIT_LABELS,
  AREA_UNIT_LABELS,
  type LengthUnit,
  type AreaUnit,
} from '../unitConversion';

describe('Unit Conversion Utilities', () => {
  // ============================================================================
  // Conversion Constants
  // ============================================================================

  describe('Conversion Constants', () => {
    it('should have correct length conversion factors', () => {
      expect(LENGTH_CONVERSIONS.m_to_m).toBe(1);
      expect(LENGTH_CONVERSIONS.ft_to_m).toBeCloseTo(0.3048, 4);
      expect(LENGTH_CONVERSIONS.yd_to_m).toBeCloseTo(0.9144, 4);
      expect(LENGTH_CONVERSIONS.m_to_ft).toBeCloseTo(3.28084, 5);
      expect(LENGTH_CONVERSIONS.m_to_yd).toBeCloseTo(1.09361, 5);
    });

    it('should have correct area conversion factors', () => {
      expect(AREA_CONVERSIONS['m²_to_m²']).toBe(1);
      expect(AREA_CONVERSIONS['ft²_to_m²']).toBeCloseTo(0.092903, 6);
      expect(AREA_CONVERSIONS['yd²_to_m²']).toBeCloseTo(0.836127, 6);
      expect(AREA_CONVERSIONS['m²_to_ft²']).toBeCloseTo(10.7639, 4);
      expect(AREA_CONVERSIONS['m²_to_yd²']).toBeCloseTo(1.19599, 5);
    });

    it('should have unit labels for display', () => {
      expect(UNIT_LABELS.m).toBe('meters');
      expect(UNIT_LABELS.ft).toBe('feet');
      expect(UNIT_LABELS.yd).toBe('yards');

      expect(AREA_UNIT_LABELS['m²']).toBe('square meters');
      expect(AREA_UNIT_LABELS['ft²']).toBe('square feet');
      expect(AREA_UNIT_LABELS['yd²']).toBe('square yards');
    });
  });

  // ============================================================================
  // Length Conversion
  // ============================================================================

  describe('convertLength', () => {
    describe('Same Unit (No Conversion)', () => {
      it('should return same value when units match', () => {
        expect(convertLength(10, 'm', 'm')).toBe(10);
        expect(convertLength(50, 'ft', 'ft')).toBe(50);
        expect(convertLength(25, 'yd', 'yd')).toBe(25);
      });
    });

    describe('Meters to Other Units', () => {
      it('should convert meters to feet', () => {
        expect(convertLength(1, 'm', 'ft')).toBeCloseTo(3.28084, 3);
        expect(convertLength(10, 'm', 'ft')).toBeCloseTo(32.8084, 3);
        expect(convertLength(100, 'm', 'ft')).toBeCloseTo(328.084, 2);
      });

      it('should convert meters to yards', () => {
        expect(convertLength(1, 'm', 'yd')).toBeCloseTo(1.09361, 3);
        expect(convertLength(10, 'm', 'yd')).toBeCloseTo(10.9361, 3);
        expect(convertLength(100, 'm', 'yd')).toBeCloseTo(109.361, 2);
      });
    });

    describe('Feet to Other Units', () => {
      it('should convert feet to meters', () => {
        expect(convertLength(1, 'ft', 'm')).toBeCloseTo(0.3048, 4);
        expect(convertLength(10, 'ft', 'm')).toBeCloseTo(3.048, 3);
        expect(convertLength(100, 'ft', 'm')).toBeCloseTo(30.48, 2);
      });

      it('should convert feet to yards', () => {
        expect(convertLength(3, 'ft', 'yd')).toBeCloseTo(1, 2);
        expect(convertLength(9, 'ft', 'yd')).toBeCloseTo(3, 2);
        expect(convertLength(30, 'ft', 'yd')).toBeCloseTo(10, 2);
      });
    });

    describe('Yards to Other Units', () => {
      it('should convert yards to meters', () => {
        expect(convertLength(1, 'yd', 'm')).toBeCloseTo(0.9144, 4);
        expect(convertLength(10, 'yd', 'm')).toBeCloseTo(9.144, 3);
        expect(convertLength(100, 'yd', 'm')).toBeCloseTo(91.44, 2);
      });

      it('should convert yards to feet', () => {
        expect(convertLength(1, 'yd', 'ft')).toBeCloseTo(3, 2);
        expect(convertLength(5, 'yd', 'ft')).toBeCloseTo(15, 2);
        expect(convertLength(10, 'yd', 'ft')).toBeCloseTo(30, 2);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero value', () => {
        expect(convertLength(0, 'm', 'ft')).toBe(0);
        expect(convertLength(0, 'ft', 'yd')).toBe(0);
      });

      it('should handle decimal values', () => {
        expect(convertLength(1.5, 'm', 'ft')).toBeCloseTo(4.92126, 3);
        expect(convertLength(2.5, 'yd', 'm')).toBeCloseTo(2.286, 3);
      });

      it('should handle very large values', () => {
        expect(convertLength(1000, 'm', 'ft')).toBeCloseTo(3280.84, 2);
        expect(convertLength(10000, 'ft', 'm')).toBeCloseTo(3048, 1);
      });

      it('should handle very small values', () => {
        expect(convertLength(0.01, 'm', 'ft')).toBeCloseTo(0.0328084, 5);
        expect(convertLength(0.1, 'ft', 'm')).toBeCloseTo(0.03048, 5);
      });
    });

    describe('Bidirectional Conversions', () => {
      it('should be reversible for m ↔ ft', () => {
        const original = 10;
        const converted = convertLength(original, 'm', 'ft');
        const backToOriginal = convertLength(converted, 'ft', 'm');
        expect(backToOriginal).toBeCloseTo(original, 2);
      });

      it('should be reversible for m ↔ yd', () => {
        const original = 25;
        const converted = convertLength(original, 'm', 'yd');
        const backToOriginal = convertLength(converted, 'yd', 'm');
        expect(backToOriginal).toBeCloseTo(original, 2);
      });

      it('should be reversible for ft ↔ yd', () => {
        const original = 30;
        const converted = convertLength(original, 'ft', 'yd');
        const backToOriginal = convertLength(converted, 'yd', 'ft');
        expect(backToOriginal).toBeCloseTo(original, 2);
      });
    });
  });

  // ============================================================================
  // Area Conversion
  // ============================================================================

  describe('convertArea', () => {
    describe('Same Unit (No Conversion)', () => {
      it('should return same value when units match', () => {
        expect(convertArea(100, 'm²', 'm²')).toBe(100);
        expect(convertArea(500, 'ft²', 'ft²')).toBe(500);
        expect(convertArea(250, 'yd²', 'yd²')).toBe(250);
      });
    });

    describe('Square Meters to Other Units', () => {
      it('should convert square meters to square feet', () => {
        expect(convertArea(1, 'm²', 'ft²')).toBeCloseTo(10.7639, 3);
        expect(convertArea(10, 'm²', 'ft²')).toBeCloseTo(107.639, 2);
        expect(convertArea(100, 'm²', 'ft²')).toBeCloseTo(1076.39, 2);
      });

      it('should convert square meters to square yards', () => {
        expect(convertArea(1, 'm²', 'yd²')).toBeCloseTo(1.19599, 3);
        expect(convertArea(10, 'm²', 'yd²')).toBeCloseTo(11.9599, 3);
        expect(convertArea(100, 'm²', 'yd²')).toBeCloseTo(119.599, 2);
      });
    });

    describe('Square Feet to Other Units', () => {
      it('should convert square feet to square meters', () => {
        expect(convertArea(1, 'ft²', 'm²')).toBeCloseTo(0.092903, 5);
        expect(convertArea(100, 'ft²', 'm²')).toBeCloseTo(9.2903, 3);
        expect(convertArea(1000, 'ft²', 'm²')).toBeCloseTo(92.903, 2);
      });

      it('should convert square feet to square yards', () => {
        expect(convertArea(9, 'ft²', 'yd²')).toBeCloseTo(1, 2);
        expect(convertArea(90, 'ft²', 'yd²')).toBeCloseTo(10, 2);
        expect(convertArea(900, 'ft²', 'yd²')).toBeCloseTo(100, 2);
      });
    });

    describe('Square Yards to Other Units', () => {
      it('should convert square yards to square meters', () => {
        expect(convertArea(1, 'yd²', 'm²')).toBeCloseTo(0.836127, 5);
        expect(convertArea(10, 'yd²', 'm²')).toBeCloseTo(8.36127, 4);
        expect(convertArea(100, 'yd²', 'm²')).toBeCloseTo(83.6127, 3);
      });

      it('should convert square yards to square feet', () => {
        expect(convertArea(1, 'yd²', 'ft²')).toBeCloseTo(9, 2);
        expect(convertArea(5, 'yd²', 'ft²')).toBeCloseTo(45, 2);
        expect(convertArea(10, 'yd²', 'ft²')).toBeCloseTo(90, 2);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero area', () => {
        expect(convertArea(0, 'm²', 'ft²')).toBe(0);
        expect(convertArea(0, 'ft²', 'yd²')).toBe(0);
      });

      it('should handle decimal areas', () => {
        expect(convertArea(1.5, 'm²', 'ft²')).toBeCloseTo(16.14585, 3);
        expect(convertArea(2.5, 'yd²', 'm²')).toBeCloseTo(2.090318, 3);
      });

      it('should handle very large areas', () => {
        expect(convertArea(10000, 'm²', 'ft²')).toBeCloseTo(107639, 1);
        expect(convertArea(100000, 'ft²', 'm²')).toBeCloseTo(9290.3, 1);
      });
    });

    describe('Bidirectional Conversions', () => {
      it('should be reversible for m² ↔ ft²', () => {
        const original = 100;
        const converted = convertArea(original, 'm²', 'ft²');
        const backToOriginal = convertArea(converted, 'ft²', 'm²');
        expect(backToOriginal).toBeCloseTo(original, 2);
      });

      it('should be reversible for m² ↔ yd²', () => {
        const original = 50;
        const converted = convertArea(original, 'm²', 'yd²');
        const backToOriginal = convertArea(converted, 'yd²', 'm²');
        expect(backToOriginal).toBeCloseTo(original, 2);
      });
    });
  });

  // ============================================================================
  // Batch Conversions
  // ============================================================================

  describe('convertLengths', () => {
    it('should convert multiple lengths at once', () => {
      const values = [10, 20, 30];
      const converted = convertLengths(values, 'm', 'ft');

      expect(converted).toHaveLength(3);
      expect(converted[0]).toBeCloseTo(32.8084, 2);
      expect(converted[1]).toBeCloseTo(65.6168, 2);
      expect(converted[2]).toBeCloseTo(98.4252, 2);
    });

    it('should handle empty array', () => {
      const converted = convertLengths([], 'm', 'ft');
      expect(converted).toEqual([]);
    });

    it('should handle single value', () => {
      const converted = convertLengths([5], 'yd', 'm');
      expect(converted).toHaveLength(1);
      expect(converted[0]).toBeCloseTo(4.572, 3);
    });

    it('should preserve same units', () => {
      const values = [1, 2, 3, 4, 5];
      const converted = convertLengths(values, 'm', 'm');
      expect(converted).toEqual(values);
    });
  });

  // ============================================================================
  // Formatting
  // ============================================================================

  describe('formatLength', () => {
    it('should format length with default 2 decimals', () => {
      expect(formatLength(10.5, 'm')).toBe('10.50m');
      expect(formatLength(32.8084, 'ft')).toBe('32.81ft');
      expect(formatLength(25.123, 'yd')).toBe('25.12yd');
    });

    it('should format with custom decimal places', () => {
      expect(formatLength(10.12345, 'm', 0)).toBe('10m');
      expect(formatLength(10.12345, 'm', 1)).toBe('10.1m');
      expect(formatLength(10.12345, 'm', 3)).toBe('10.123m');
      expect(formatLength(10.12345, 'm', 5)).toBe('10.12345m');
    });

    it('should format zero correctly', () => {
      expect(formatLength(0, 'm')).toBe('0.00m');
      expect(formatLength(0, 'ft', 0)).toBe('0ft');
    });

    it('should format large numbers', () => {
      expect(formatLength(1000000, 'm', 0)).toBe('1000000m');
    });

    it('should format negative numbers', () => {
      expect(formatLength(-10.5, 'm')).toBe('-10.50m');
    });
  });

  describe('formatArea', () => {
    it('should format area with default 2 decimals', () => {
      expect(formatArea(100.5, 'm²')).toBe('100.50m²');
      expect(formatArea(1076.39, 'ft²')).toBe('1076.39ft²');
      expect(formatArea(50.789, 'yd²')).toBe('50.79yd²');
    });

    it('should format with custom decimal places', () => {
      expect(formatArea(100.456, 'm²', 0)).toBe('100m²');
      expect(formatArea(100.456, 'm²', 1)).toBe('100.5m²');
      expect(formatArea(100.456, 'm²', 3)).toBe('100.456m²');
    });

    it('should format zero correctly', () => {
      expect(formatArea(0, 'm²')).toBe('0.00m²');
      expect(formatArea(0, 'ft²', 0)).toBe('0ft²');
    });
  });

  // ============================================================================
  // Normalization
  // ============================================================================

  describe('normalizeDimensions', () => {
    it('should normalize mixed units to meters', () => {
      const dimensions = [
        { value: 10, unit: 'm' as LengthUnit },
        { value: 50, unit: 'ft' as LengthUnit },
        { value: 20, unit: 'yd' as LengthUnit },
      ];

      const normalized = normalizeDimensions(dimensions);

      expect(normalized).toHaveLength(3);
      expect(normalized[0]).toBeCloseTo(10, 2); // 10m → 10m
      expect(normalized[1]).toBeCloseTo(15.24, 2); // 50ft → 15.24m
      expect(normalized[2]).toBeCloseTo(18.288, 2); // 20yd → 18.288m
    });

    it('should handle all same units', () => {
      const dimensions = [
        { value: 10, unit: 'm' as LengthUnit },
        { value: 20, unit: 'm' as LengthUnit },
        { value: 30, unit: 'm' as LengthUnit },
      ];

      const normalized = normalizeDimensions(dimensions);

      expect(normalized).toEqual([10, 20, 30]);
    });

    it('should handle empty array', () => {
      const normalized = normalizeDimensions([]);
      expect(normalized).toEqual([]);
    });
  });

  describe('normalizeArea', () => {
    it('should normalize area to square meters', () => {
      expect(normalizeArea(100, 'm²')).toBeCloseTo(100, 2);
      expect(normalizeArea(100, 'ft²')).toBeCloseTo(9.2903, 3);
      expect(normalizeArea(100, 'yd²')).toBeCloseTo(83.6127, 3);
    });

    it('should handle zero area', () => {
      expect(normalizeArea(0, 'ft²')).toBe(0);
    });
  });

  // ============================================================================
  // Conversion Factors
  // ============================================================================

  describe('getConversionFactor', () => {
    it('should return conversion factor', () => {
      expect(getConversionFactor('m', 'ft')).toBeCloseTo(3.28084, 5);
      expect(getConversionFactor('ft', 'm')).toBeCloseTo(0.3048, 4);
      expect(getConversionFactor('yd', 'm')).toBeCloseTo(0.9144, 4);
    });

    it('should return 1 for same units', () => {
      expect(getConversionFactor('m', 'm')).toBe(1);
      expect(getConversionFactor('ft', 'ft')).toBe(1);
      expect(getConversionFactor('yd', 'yd')).toBe(1);
    });

    it('should be usable for manual conversion', () => {
      const factor = getConversionFactor('m', 'ft');
      const meters = 10;
      const feet = meters * factor;

      expect(feet).toBeCloseTo(32.8084, 3);
    });
  });

  describe('getAreaConversionFactor', () => {
    it('should return area conversion factor', () => {
      expect(getAreaConversionFactor('m²', 'ft²')).toBeCloseTo(10.7639, 4);
      expect(getAreaConversionFactor('ft²', 'm²')).toBeCloseTo(0.092903, 6);
      expect(getAreaConversionFactor('yd²', 'm²')).toBeCloseTo(0.836127, 6);
    });

    it('should return 1 for same units', () => {
      expect(getAreaConversionFactor('m²', 'm²')).toBe(1);
      expect(getAreaConversionFactor('ft²', 'ft²')).toBe(1);
      expect(getAreaConversionFactor('yd²', 'yd²')).toBe(1);
    });
  });

  // ============================================================================
  // Parsing
  // ============================================================================

  describe('parseDimension', () => {
    describe('Valid Inputs', () => {
      it('should parse dimension with no space', () => {
        expect(parseDimension('10m')).toEqual({ value: 10, unit: 'm' });
        expect(parseDimension('50ft')).toEqual({ value: 50, unit: 'ft' });
        expect(parseDimension('25yd')).toEqual({ value: 25, unit: 'yd' });
      });

      it('should parse dimension with space', () => {
        expect(parseDimension('10 m')).toEqual({ value: 10, unit: 'm' });
        expect(parseDimension('50 ft')).toEqual({ value: 50, unit: 'ft' });
        expect(parseDimension('25 yd')).toEqual({ value: 25, unit: 'yd' });
      });

      it('should parse decimal values', () => {
        expect(parseDimension('10.5m')).toEqual({ value: 10.5, unit: 'm' });
        expect(parseDimension('32.8ft')).toEqual({ value: 32.8, unit: 'ft' });
        expect(parseDimension('15.25 yd')).toEqual({ value: 15.25, unit: 'yd' });
      });

      it('should be case-insensitive', () => {
        expect(parseDimension('10M')).toEqual({ value: 10, unit: 'm' });
        expect(parseDimension('50FT')).toEqual({ value: 50, unit: 'ft' });
        expect(parseDimension('25YD')).toEqual({ value: 25, unit: 'yd' });
        expect(parseDimension('10 Ft')).toEqual({ value: 10, unit: 'ft' });
      });

      it('should handle extra whitespace', () => {
        expect(parseDimension('  10m  ')).toEqual({ value: 10, unit: 'm' });
        expect(parseDimension('  50  ft  ')).toEqual({ value: 50, unit: 'ft' });
      });

      it('should parse zero value', () => {
        expect(parseDimension('0m')).toEqual({ value: 0, unit: 'm' });
        expect(parseDimension('0.0ft')).toEqual({ value: 0, unit: 'ft' });
      });
    });

    describe('Invalid Inputs', () => {
      it('should return null for invalid format', () => {
        expect(parseDimension('invalid')).toBeNull();
        expect(parseDimension('10')).toBeNull(); // Missing unit
        expect(parseDimension('m')).toBeNull(); // Missing value
        expect(parseDimension('')).toBeNull(); // Empty string
      });

      it('should return null for unsupported units', () => {
        expect(parseDimension('10cm')).toBeNull();
        expect(parseDimension('50km')).toBeNull();
        expect(parseDimension('25in')).toBeNull();
      });

      it('should return null for malformed numbers', () => {
        expect(parseDimension('abc m')).toBeNull();
        expect(parseDimension('NaN ft')).toBeNull();
        expect(parseDimension('Infinity m')).toBeNull();
      });

      it('should return null for negative values (treated as invalid format)', () => {
        expect(parseDimension('-10m')).toBeNull();
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete workflow: parse → convert → format', () => {
      // Parse input
      const parsed = parseDimension('10m');
      expect(parsed).not.toBeNull();

      // Convert to feet
      const inFeet = convertLength(parsed!.value, parsed!.unit, 'ft');
      expect(inFeet).toBeCloseTo(32.8084, 3);

      // Format result
      const formatted = formatLength(inFeet, 'ft', 1);
      expect(formatted).toBe('32.8ft');
    });

    it('should normalize mixed dimensions for calculations', () => {
      const dimensions = [
        { value: 10, unit: 'm' as LengthUnit },
        { value: 32.8084, unit: 'ft' as LengthUnit },
      ];

      const normalized = normalizeDimensions(dimensions);

      // Both should be ~10 meters
      expect(normalized[0]).toBeCloseTo(10, 2);
      expect(normalized[1]).toBeCloseTo(10, 2);
    });

    it('should calculate perimeter with mixed units', () => {
      const sides = [
        { value: 10, unit: 'm' as LengthUnit },
        { value: 50, unit: 'ft' as LengthUnit },
        { value: 10, unit: 'm' as LengthUnit },
        { value: 50, unit: 'ft' as LengthUnit },
      ];

      const normalized = normalizeDimensions(sides);
      const perimeter = normalized.reduce((sum, val) => sum + val, 0);

      // Should be (10 + 10) + (15.24 + 15.24) ≈ 50.48 meters
      expect(perimeter).toBeCloseTo(50.48, 2);
    });

    it('should convert rectangle area correctly', () => {
      // 10m × 20m rectangle
      const width = 10; // meters
      const height = 20; // meters
      const areaM2 = width * height; // 200m²

      // Convert to square feet
      const areaFt2 = convertArea(areaM2, 'm²', 'ft²');
      expect(areaFt2).toBeCloseTo(2152.78, 2); // 200 × 10.7639

      // Format result
      const formatted = formatArea(areaFt2, 'ft²', 0);
      expect(formatted).toBe('2153ft²');
    });
  });

  // ============================================================================
  // Precision Tests
  // ============================================================================

  describe('Precision Tests', () => {
    it('should maintain reasonable precision through multiple conversions', () => {
      const original = 100;

      // m → ft → yd → m
      const step1 = convertLength(original, 'm', 'ft');
      const step2 = convertLength(step1, 'ft', 'yd');
      const result = convertLength(step2, 'yd', 'm');

      expect(result).toBeCloseTo(original, 1); // Within 0.05m
    });

    it('should handle very precise calculations', () => {
      const precise = 12.3456789;
      const converted = convertLength(precise, 'm', 'ft');
      const backToOriginal = convertLength(converted, 'ft', 'm');

      expect(backToOriginal).toBeCloseTo(precise, 5); // 5 decimal places
    });
  });
});
