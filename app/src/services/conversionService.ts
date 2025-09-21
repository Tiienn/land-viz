/**
 * Service for performing unit conversions with high precision
 */

import type { AreaUnit, ValidationResult, ConversionResult } from '../types/conversion';
import {
  CONVERSION_FACTORS,
  UNIT_CONFIGS,
  validateInput,
  formatValue,
  formatConversionResult,
  isResultApproximate
} from '../utils/conversionUtils';
import { logger } from '../utils/logger';

/**
 * LRU Cache for conversion results to improve performance
 */
class ConversionCache {
  private cache = new Map<string, number>();
  private maxSize = 100;

  private generateKey(value: number, fromUnit: AreaUnit, toUnit: AreaUnit): string {
    return `${value}_${fromUnit}_${toUnit}`;
  }

  get(value: number, fromUnit: AreaUnit, toUnit: AreaUnit): number | undefined {
    const key = this.generateKey(value, fromUnit, toUnit);
    const result = this.cache.get(key);

    if (result !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, result);
    }

    return result;
  }

  set(value: number, fromUnit: AreaUnit, toUnit: AreaUnit, result: number): void {
    const key = this.generateKey(value, fromUnit, toUnit);

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Conversion service with caching and high precision calculations
 */
export class ConversionService {
  private static cache = new ConversionCache();

  /**
   * Convert a value from square meters to target unit
   */
  static convertFromSquareMeters(value: number, targetUnit: AreaUnit): number {
    if (!isFinite(value) || isNaN(value)) {
      logger.warn('Invalid value passed to convertFromSquareMeters:', value);
      return 0;
    }

    if (targetUnit === 'sqm') {
      return value;
    }

    // Check cache first
    const cached = this.cache.get(value, 'sqm', targetUnit);
    if (cached !== undefined) {
      return cached;
    }

    const factor = CONVERSION_FACTORS[targetUnit];
    const result = value * factor;

    // Cache the result
    this.cache.set(value, 'sqm', targetUnit, result);

    logger.debug(`Converted ${value} sqm to ${result} ${targetUnit}`);
    return result;
  }

  /**
   * Convert a value from source unit to square meters
   */
  static convertToSquareMeters(value: number, sourceUnit: AreaUnit): number {
    if (!isFinite(value) || isNaN(value)) {
      logger.warn('Invalid value passed to convertToSquareMeters:', value);
      return 0;
    }

    if (sourceUnit === 'sqm') {
      return value;
    }

    // Check cache first
    const cached = this.cache.get(value, sourceUnit, 'sqm');
    if (cached !== undefined) {
      return cached;
    }

    const factor = CONVERSION_FACTORS[sourceUnit];
    const result = value / factor;

    // Cache the result
    this.cache.set(value, sourceUnit, 'sqm', result);

    logger.debug(`Converted ${value} ${sourceUnit} to ${result} sqm`);
    return result;
  }

  /**
   * Convert between any two units
   */
  static convertBetweenUnits(value: number, fromUnit: AreaUnit, toUnit: AreaUnit): number {
    if (!isFinite(value) || isNaN(value)) {
      logger.warn('Invalid value passed to convertBetweenUnits:', value);
      return 0;
    }

    if (fromUnit === toUnit) {
      return value;
    }

    // Check cache first
    const cached = this.cache.get(value, fromUnit, toUnit);
    if (cached !== undefined) {
      return cached;
    }

    // Convert through square meters for precision
    const squareMeters = this.convertToSquareMeters(value, fromUnit);
    const result = this.convertFromSquareMeters(squareMeters, toUnit);

    // Cache the result
    this.cache.set(value, fromUnit, toUnit, result);

    logger.debug(`Converted ${value} ${fromUnit} to ${result} ${toUnit}`);
    return result;
  }

  /**
   * Validate input string and return validation result
   */
  static validateInput(input: string): ValidationResult {
    return validateInput(input);
  }

  /**
   * Check if a value is within valid range for conversion
   */
  static isInValidRange(value: number): boolean {
    return isFinite(value) && !isNaN(value) && value >= 0 && value <= 1e9;
  }

  /**
   * Format a value for display
   */
  static formatValue(value: number, unit: AreaUnit): string {
    return formatValue(value, unit);
  }

  /**
   * Format a complete conversion result
   */
  static formatConversionResult(value: number, unit: AreaUnit): string {
    return formatConversionResult(value, unit);
  }

  /**
   * Get display precision for a value and unit
   */
  static getDisplayPrecision(value: number, unit: AreaUnit): number {
    const config = UNIT_CONFIGS[unit];

    // For very small values, use more precision
    if (value < 0.01 && value > 0) {
      return Math.min(config.precision + 2, 8);
    }

    return config.precision;
  }

  /**
   * Convert input value to all supported units
   */
  static convertToAllUnits(value: number, sourceUnit: AreaUnit): ConversionResult[] {
    if (!this.isInValidRange(value)) {
      logger.warn('Value out of range for conversion:', value);
      return [];
    }

    const results: ConversionResult[] = [];
    const allUnits: AreaUnit[] = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm', 'sqmi', 'toise', 'perches', 'perches-mauritius', 'arpent-na', 'arpent-paris', 'arpent-mauritius'];

    for (const targetUnit of allUnits) {
      if (targetUnit === sourceUnit) continue;

      const convertedValue = this.convertBetweenUnits(value, sourceUnit, targetUnit);
      const formatted = this.formatConversionResult(convertedValue, targetUnit);
      const isApproximate = isResultApproximate(value, convertedValue, targetUnit);

      results.push({
        value: convertedValue,
        unit: targetUnit,
        formatted,
        isApproximate
      });
    }

    return results;
  }

  /**
   * Clear the conversion cache
   */
  static clearCache(): void {
    this.cache.clear();
    logger.debug('Conversion cache cleared');
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache['cache'].size,
      maxSize: this.cache['maxSize']
    };
  }
}