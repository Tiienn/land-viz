/**
 * Test suite for conversion utilities
 */

import { vi } from 'vitest';
import {
  CONVERSION_FACTORS,
  UNIT_CONFIGS,
  validateInput,
  sanitizeInput,
  formatValue,
  formatConversionResult,
  isResultApproximate,
  getDisplayPrecision,
  debounce
} from '../conversionUtils';
import type { AreaUnit } from '../../types/conversion';

describe('conversionUtils', () => {
  describe('CONVERSION_FACTORS', () => {
    it('should have all required units', () => {
      const expectedUnits: AreaUnit[] = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm', 'sqmi'];
      expectedUnits.forEach(unit => {
        expect(CONVERSION_FACTORS[unit]).toBeDefined();
        expect(typeof CONVERSION_FACTORS[unit]).toBe('number');
        expect(CONVERSION_FACTORS[unit]).toBeGreaterThan(0);
      });
    });

    it('should have square meters as base unit (factor = 1)', () => {
      expect(CONVERSION_FACTORS.sqm).toBe(1);
    });

    it('should have realistic conversion factors', () => {
      // Square feet per square meter (approximately 10.76)
      expect(CONVERSION_FACTORS.sqft).toBeCloseTo(10.7639, 4);

      // Acres per square meter (very small number)
      expect(CONVERSION_FACTORS.acres).toBeLessThan(0.001);
      expect(CONVERSION_FACTORS.acres).toBeGreaterThan(0.0001);

      // Hectares per square meter
      expect(CONVERSION_FACTORS.hectares).toBe(0.0001);

      // Square kilometers per square meter
      expect(CONVERSION_FACTORS.sqkm).toBe(0.000001);

      // Square miles per square meter (very small number)
      expect(CONVERSION_FACTORS.sqmi).toBeLessThan(0.000001);
    });
  });

  describe('UNIT_CONFIGS', () => {
    it('should have all required units', () => {
      const expectedUnits: AreaUnit[] = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm', 'sqmi'];
      expectedUnits.forEach(unit => {
        expect(UNIT_CONFIGS[unit]).toBeDefined();
        expect(UNIT_CONFIGS[unit].name).toBeDefined();
        expect(UNIT_CONFIGS[unit].symbol).toBeDefined();
        expect(UNIT_CONFIGS[unit].precision).toBeDefined();
      });
    });

    it('should have correct symbols', () => {
      expect(UNIT_CONFIGS.sqm.symbol).toBe('m²');
      expect(UNIT_CONFIGS.sqft.symbol).toBe('ft²');
      expect(UNIT_CONFIGS.acres.symbol).toBe('ac');
      expect(UNIT_CONFIGS.hectares.symbol).toBe('ha');
      expect(UNIT_CONFIGS.sqkm.symbol).toBe('km²');
      expect(UNIT_CONFIGS.sqmi.symbol).toBe('mi²');
    });

    it('should have reasonable precision values', () => {
      Object.values(UNIT_CONFIGS).forEach(config => {
        expect(config.precision).toBeGreaterThanOrEqual(2);
        expect(config.precision).toBeLessThanOrEqual(8);
      });
    });
  });

  describe('validateInput', () => {
    it('should validate empty string as zero', () => {
      const result = validateInput('');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should validate whitespace as zero', () => {
      const result = validateInput('  \t\n  ');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should validate positive integers', () => {
      const result = validateInput('123');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(123);
    });

    it('should validate positive decimals', () => {
      const result = validateInput('123.456');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(123.456);
    });

    it('should validate scientific notation', () => {
      const result = validateInput('1.23e5');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(123000);
    });

    it('should validate negative scientific notation', () => {
      const result = validateInput('1.23e-5');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0.0000123);
    });

    it('should reject negative numbers', () => {
      const result = validateInput('-123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Area cannot be negative');
    });

    it('should reject invalid characters', () => {
      const testCases = ['abc', '12a3', '12.3.4', '12+34', '12*34'];
      testCases.forEach(input => {
        const result = validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Please enter a valid number');
      });
    });

    it('should reject very large numbers', () => {
      const result = validateInput('1e15');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value too large');
    });

    it('should reject NaN', () => {
      const result = validateInput('NaN');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid number');
    });

    it('should reject Infinity', () => {
      const result = validateInput('Infinity');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid number');
    });
  });

  describe('sanitizeInput', () => {
    it('should keep valid numeric characters', () => {
      expect(sanitizeInput('123.456')).toBe('123.456');
      expect(sanitizeInput('1.23e-5')).toBe('1.23e-5');
      expect(sanitizeInput('-123.45')).toBe('-123.45');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeInput('12a3b4')).toBe('1234');
      expect(sanitizeInput('12.3$4')).toBe('12.34');
      expect(sanitizeInput('12,345.67')).toBe('12345.67');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });

    it('should preserve scientific notation', () => {
      expect(sanitizeInput('1.23E+5')).toBe('1.23E+5');
      expect(sanitizeInput('1.23e-5')).toBe('1.23e-5');
    });
  });

  describe('formatValue', () => {
    it('should format with correct precision', () => {
      expect(formatValue(123.456, 'sqm')).toBe('123.46');
      expect(formatValue(123.456789, 'acres')).toBe('123.4568');
    });

    it('should remove trailing zeros', () => {
      expect(formatValue(123.0, 'sqm')).toBe('123');
      expect(formatValue(123.10, 'sqm')).toBe('123.1');
      expect(formatValue(123.00, 'sqm')).toBe('123');
    });

    it('should handle very small numbers with scientific notation', () => {
      const result = formatValue(0.0000123, 'sqm');
      expect(result).toMatch(/1\.23e-5/i);
    });

    it('should handle very large numbers with scientific notation', () => {
      const result = formatValue(12300000, 'sqm');
      expect(result).toMatch(/1\.23e\+7/i);
    });

    it('should handle zero', () => {
      expect(formatValue(0, 'sqm')).toBe('0');
    });

    it('should handle invalid numbers', () => {
      expect(formatValue(NaN, 'sqm')).toBe('0');
      expect(formatValue(Infinity, 'sqm')).toBe('0');
      expect(formatValue(-Infinity, 'sqm')).toBe('0');
    });

    it('should handle integer values without decimals', () => {
      expect(formatValue(123, 'sqm')).toBe('123');
      expect(formatValue(1000, 'sqm')).toBe('1000');
    });
  });

  describe('formatConversionResult', () => {
    it('should include unit symbol', () => {
      expect(formatConversionResult(123.45, 'sqm')).toBe('123.45 m²');
      expect(formatConversionResult(100, 'sqft')).toBe('100 ft²');
      expect(formatConversionResult(2.5, 'acres')).toBe('2.5 ac');
    });

    it('should handle all unit types', () => {
      const units: AreaUnit[] = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm', 'sqmi'];
      units.forEach(unit => {
        const result = formatConversionResult(100, unit);
        expect(result).toContain(UNIT_CONFIGS[unit].symbol);
        expect(result).toMatch(/^\d+(\.\d+)?\s+\w+²?$/);
      });
    });
  });

  describe('isResultApproximate', () => {
    it('should mark very small results as approximate', () => {
      expect(isResultApproximate(100, 0.0001, 'sqm')).toBe(true);
      expect(isResultApproximate(100, 0.00001, 'sqft')).toBe(true);
    });

    it('should mark very large results as approximate when configured', () => {
      expect(isResultApproximate(100, 10000000, 'sqm')).toBe(true);
    });

    it('should not mark normal results as approximate', () => {
      expect(isResultApproximate(100, 1076.39, 'sqft')).toBe(false);
      expect(isResultApproximate(100, 0.1, 'sqm')).toBe(false);
    });
  });

  describe('getDisplayPrecision', () => {
    it('should return base precision for normal values', () => {
      expect(getDisplayPrecision(100, 'sqm')).toBe(2);
      expect(getDisplayPrecision(1000, 'acres')).toBe(4);
    });

    it('should increase precision for very small values', () => {
      const precision = getDisplayPrecision(0.001, 'sqm');
      expect(precision).toBeGreaterThan(2);
      expect(precision).toBeLessThanOrEqual(8);
    });

    it('should not exceed maximum precision', () => {
      const precision = getDisplayPrecision(0.0000001, 'sqm');
      expect(precision).toBeLessThanOrEqual(8);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      vi.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should handle multiple arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('arg1', 'arg2', 123);
      vi.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });
  });
});