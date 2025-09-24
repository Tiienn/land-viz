import { logger } from './logger';
import type { AreaUnit, Point2D } from '../types';

/**
 * Comprehensive validation service for edge cases in measurement and conversion systems
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedValue?: any;
}

export interface ValidationRule<T> {
  name: string;
  validate: (value: T) => ValidationResult;
  priority: 'error' | 'warning';
}

class ValidationService {
  private rules = new Map<string, ValidationRule<any>[]>();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules for common use cases
   */
  private initializeDefaultRules() {
    // Area value validation rules
    this.addRule('area-value', {
      name: 'positive-number',
      validate: (value: number) => {
        if (isNaN(value)) {
          return { isValid: false, errors: ['Value must be a valid number'], warnings: [] };
        }
        if (value <= 0) {
          return { isValid: false, errors: ['Area must be positive'], warnings: [] };
        }
        if (value > 1e12) {
          return { isValid: false, errors: ['Area value is too large (max: 1 trillion m²)'], warnings: [] };
        }
        if (value < 1e-6) {
          return { isValid: true, errors: [], warnings: ['Very small area may not be visible'] };
        }
        return { isValid: true, errors: [], warnings: [] };
      },
      priority: 'error',
    });

    this.addRule('area-value', {
      name: 'precision-check',
      validate: (value: number) => {
        const decimalPlaces = (value.toString().split('.')[1] || '').length;
        if (decimalPlaces > 10) {
          return {
            isValid: true,
            errors: [],
            warnings: ['Excessive decimal precision may be rounded'],
            normalizedValue: parseFloat(value.toFixed(10)),
          };
        }
        return { isValid: true, errors: [], warnings: [] };
      },
      priority: 'warning',
    });

    // Point validation rules
    this.addRule('point', {
      name: 'finite-coordinates',
      validate: (point: Point2D) => {
        const errors: string[] = [];

        if (!isFinite(point.x)) {
          errors.push('X coordinate must be finite');
        }
        if (!isFinite(point.y)) {
          errors.push('Y coordinate must be finite');
        }

        if (Math.abs(point.x) > 1e8) {
          errors.push('X coordinate is too large');
        }
        if (Math.abs(point.y) > 1e8) {
          errors.push('Y coordinate is too large');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings: [],
        };
      },
      priority: 'error',
    });

    // Distance validation rules
    this.addRule('distance', {
      name: 'valid-distance',
      validate: (distance: number) => {
        if (isNaN(distance) || !isFinite(distance)) {
          return { isValid: false, errors: ['Distance must be finite'], warnings: [] };
        }
        if (distance < 0) {
          return { isValid: false, errors: ['Distance cannot be negative'], warnings: [] };
        }
        if (distance === 0) {
          return { isValid: true, errors: [], warnings: ['Zero distance measurement'] };
        }
        if (distance > 1e8) {
          return { isValid: false, errors: ['Distance is too large'], warnings: [] };
        }
        if (distance < 1e-3) {
          return { isValid: true, errors: [], warnings: ['Very small distance may not be accurate'] };
        }
        return { isValid: true, errors: [], warnings: [] };
      },
      priority: 'error',
    });

    // Unit conversion validation rules
    this.addRule('unit-conversion', {
      name: 'valid-units',
      validate: ({ value, fromUnit, toUnit }: { value: number; fromUnit: AreaUnit; toUnit: AreaUnit }) => {
        const validUnits: AreaUnit[] = [
          'sqm', 'sqft', 'acres', 'hectares', 'sqkm', 'toise',
          'perches', 'perches-mauritius', 'arpent-na', 'arpent-paris', 'arpent-mauritius'
        ];

        const errors: string[] = [];
        const warnings: string[] = [];

        if (!validUnits.includes(fromUnit)) {
          errors.push(`Invalid source unit: ${fromUnit}`);
        }
        if (!validUnits.includes(toUnit)) {
          errors.push(`Invalid target unit: ${toUnit}`);
        }

        // Warn about precision loss in certain conversions
        const highPrecisionUnits = ['sqm', 'sqft'];
        const lowPrecisionUnits = ['acres', 'hectares', 'sqkm'];

        if (highPrecisionUnits.includes(fromUnit) && lowPrecisionUnits.includes(toUnit) && value < 100) {
          warnings.push('Converting small areas to large units may lose precision');
        }

        // Warn about historical unit accuracy
        const historicalUnits = ['toise', 'perches', 'perches-mauritius', 'arpent-na', 'arpent-paris', 'arpent-mauritius'];
        if (historicalUnits.includes(fromUnit) || historicalUnits.includes(toUnit)) {
          warnings.push('Historical units are approximations based on regional standards');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      },
      priority: 'error',
    });

    // Geometry validation rules
    this.addRule('polygon', {
      name: 'valid-polygon',
      validate: (points: Point2D[]) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (points.length < 3) {
          errors.push('Polygon must have at least 3 points');
          return { isValid: false, errors, warnings };
        }

        if (points.length > 1000) {
          errors.push('Polygon has too many points (max: 1000)');
          return { isValid: false, errors, warnings };
        }

        // Check for duplicate consecutive points
        for (let i = 0; i < points.length; i++) {
          const current = points[i];
          const next = points[(i + 1) % points.length];

          const distance = Math.sqrt(
            Math.pow(current.x - next.x, 2) + Math.pow(current.y - next.y, 2)
          );

          if (distance < 1e-6) {
            warnings.push(`Duplicate points detected at index ${i}`);
          }
        }

        // Check for self-intersections (simplified)
        if (points.length > 3) {
          const area = this.calculatePolygonArea(points);
          if (Math.abs(area) < 1e-6) {
            warnings.push('Polygon may be self-intersecting or degenerate');
          }
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      },
      priority: 'error',
    });
  }

  /**
   * Add a validation rule for a specific category
   */
  addRule<T>(category: string, rule: ValidationRule<T>): void {
    if (!this.rules.has(category)) {
      this.rules.set(category, []);
    }
    this.rules.get(category)!.push(rule);
  }

  /**
   * Validate a value against all rules in a category
   */
  validate(category: string, value: any): ValidationResult {
    const rules = this.rules.get(category) || [];

    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let normalizedValue = value;
    let isValid = true;

    for (const rule of rules) {
      try {
        const result = rule.validate(value);

        if (!result.isValid) {
          isValid = false;
        }

        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);

        if (result.normalizedValue !== undefined) {
          normalizedValue = result.normalizedValue;
        }

        // Log validation details
        if (result.errors.length > 0 || result.warnings.length > 0) {
          logger.info('Validation result', {
            category,
            rule: rule.name,
            isValid: result.isValid,
            errors: result.errors,
            warnings: result.warnings,
          });
        }

      } catch (error) {
        logger.error('Validation rule error', {
          category,
          rule: rule.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        allErrors.push(`Validation error in ${rule.name}`);
        isValid = false;
      }
    }

    return {
      isValid,
      errors: [...new Set(allErrors)], // Remove duplicates
      warnings: [...new Set(allWarnings)], // Remove duplicates
      normalizedValue,
    };
  }

  /**
   * Specialized validation methods for common use cases
   */

  /**
   * Validate area input for conversion
   */
  validateAreaInput(value: string, unit: AreaUnit): ValidationResult {
    const numericValue = parseFloat(value);

    // First validate the numeric value
    const valueResult = this.validate('area-value', numericValue);
    if (!valueResult.isValid) {
      return valueResult;
    }

    // Then validate the unit context
    const unitResult = this.validate('unit-conversion', {
      value: numericValue,
      fromUnit: unit,
      toUnit: 'sqm', // dummy target for validation
    });

    return {
      isValid: valueResult.isValid && unitResult.isValid,
      errors: [...valueResult.errors, ...unitResult.errors],
      warnings: [...valueResult.warnings, ...unitResult.warnings],
      normalizedValue: valueResult.normalizedValue ?? numericValue,
    };
  }

  /**
   * Validate measurement points
   */
  validateMeasurementPoints(start: Point2D, end: Point2D): ValidationResult {
    const startResult = this.validate('point', start);
    const endResult = this.validate('point', end);

    if (!startResult.isValid || !endResult.isValid) {
      return {
        isValid: false,
        errors: [...startResult.errors, ...endResult.errors],
        warnings: [...startResult.warnings, ...endResult.warnings],
      };
    }

    // Calculate and validate distance
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );

    const distanceResult = this.validate('distance', distance);

    return {
      isValid: distanceResult.isValid,
      errors: distanceResult.errors,
      warnings: [...startResult.warnings, ...endResult.warnings, ...distanceResult.warnings],
      normalizedValue: distance,
    };
  }

  /**
   * Validate polygon shape
   */
  validatePolygon(points: Point2D[]): ValidationResult {
    // Validate individual points first
    for (let i = 0; i < points.length; i++) {
      const pointResult = this.validate('point', points[i]);
      if (!pointResult.isValid) {
        return {
          isValid: false,
          errors: [`Point ${i + 1}: ${pointResult.errors.join(', ')}`],
          warnings: [],
        };
      }
    }

    // Then validate as polygon
    return this.validate('polygon', points);
  }

  /**
   * Batch validation for multiple values
   */
  validateBatch(validations: Array<{ category: string; value: any; id?: string }>): {
    isValid: boolean;
    results: Array<ValidationResult & { id?: string }>;
    summary: { errorCount: number; warningCount: number };
  } {
    const results = validations.map(({ category, value, id }) => ({
      id,
      ...this.validate(category, value),
    }));

    const errorCount = results.reduce((count, result) => count + result.errors.length, 0);
    const warningCount = results.reduce((count, result) => count + result.warnings.length, 0);
    const isValid = results.every(result => result.isValid);

    return {
      isValid,
      results,
      summary: { errorCount, warningCount },
    };
  }

  /**
   * Utility methods
   */
  private calculatePolygonArea(points: Point2D[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    categories: string[];
    totalRules: number;
    rulesByCategory: Record<string, number>;
  } {
    const categories = Array.from(this.rules.keys());
    const totalRules = Array.from(this.rules.values()).reduce(
      (total, rules) => total + rules.length,
      0
    );
    const rulesByCategory = Object.fromEntries(
      categories.map(category => [category, this.rules.get(category)?.length || 0])
    );

    return {
      categories,
      totalRules,
      rulesByCategory,
    };
  }
}

// Singleton instance
export const validationService = new ValidationService();

/**
 * Convenience functions for common validations
 */

export const validateAreaInput = (value: string, unit: AreaUnit): ValidationResult => {
  return validationService.validateAreaInput(value, unit);
};

export const validateMeasurement = (start: Point2D, end: Point2D): ValidationResult => {
  return validationService.validateMeasurementPoints(start, end);
};

export const validatePolygon = (points: Point2D[]): ValidationResult => {
  return validationService.validatePolygon(points);
};

export const validateNumber = (value: number): ValidationResult => {
  return validationService.validate('area-value', value);
};