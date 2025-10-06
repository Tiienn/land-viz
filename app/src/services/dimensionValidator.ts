/**
 * Dimension Validator Service
 * Spec 013: Direct Dimension Input
 *
 * Validates dimension values against constraints
 */

import type { ValidationResult } from '@/types';

// Validation constraints
export const DIMENSION_CONSTRAINTS = {
  MIN_VALUE: 0.1, // Minimum 0.1m (10cm)
  MAX_VALUE: 1000, // Maximum 1000m (1km)
  MIN_RADIUS: 0.1, // Minimum radius 0.1m
  MAX_RADIUS: 500, // Maximum radius 500m (1km diameter)
  VALID_UNITS: ['m', 'ft', 'yd'],
} as const;

/**
 * Validate a single dimension value
 *
 * @param value - Dimension value to validate
 * @returns Validation result with error message if invalid
 */
export const validateDimension = (value: number): ValidationResult => {
  // Check for NaN or Infinity
  if (!isFinite(value) || isNaN(value)) {
    return {
      valid: false,
      error: 'Invalid number'
    };
  }

  // Check for positive value
  if (value <= 0) {
    return {
      valid: false,
      error: 'Dimension must be positive'
    };
  }

  // Check minimum size
  if (value < DIMENSION_CONSTRAINTS.MIN_VALUE) {
    return {
      valid: false,
      error: `Dimension too small (minimum ${DIMENSION_CONSTRAINTS.MIN_VALUE}m)`
    };
  }

  // Check maximum size
  if (value > DIMENSION_CONSTRAINTS.MAX_VALUE) {
    return {
      valid: false,
      error: `Dimension too large (maximum ${DIMENSION_CONSTRAINTS.MAX_VALUE}m)`
    };
  }

  return { valid: true };
};

/**
 * Validate a dimension within a specific range
 *
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validation result with error message if invalid
 */
export const validateDimensionRange = (
  value: number,
  min: number,
  max: number
): ValidationResult => {
  // First validate as a normal dimension
  const baseValidation = validateDimension(value);
  if (!baseValidation.valid) {
    return baseValidation;
  }

  // Check custom range
  if (value < min) {
    return {
      valid: false,
      error: `Value too small (minimum ${min})`
    };
  }

  if (value > max) {
    return {
      valid: false,
      error: `Value too large (maximum ${max})`
    };
  }

  return { valid: true };
};

/**
 * Validate a radius value for circles
 *
 * @param radius - Radius value to validate
 * @returns Validation result with error message if invalid
 */
export const validateRadius = (radius: number): ValidationResult => {
  // Check for NaN or Infinity
  if (!isFinite(radius) || isNaN(radius)) {
    return {
      valid: false,
      error: 'Invalid radius number'
    };
  }

  // Check for positive value
  if (radius <= 0) {
    return {
      valid: false,
      error: 'Radius must be positive'
    };
  }

  // Check minimum radius
  if (radius < DIMENSION_CONSTRAINTS.MIN_RADIUS) {
    return {
      valid: false,
      error: `Radius too small (minimum ${DIMENSION_CONSTRAINTS.MIN_RADIUS}m)`
    };
  }

  // Check maximum radius
  if (radius > DIMENSION_CONSTRAINTS.MAX_RADIUS) {
    return {
      valid: false,
      error: `Radius too large (maximum ${DIMENSION_CONSTRAINTS.MAX_RADIUS}m)`
    };
  }

  return { valid: true };
};

/**
 * Validate a unit string
 *
 * @param unit - Unit string to validate ('m', 'ft', 'yd')
 * @returns Validation result with error message if invalid
 */
export const isValidUnit = (unit: string): ValidationResult => {
  const normalizedUnit = unit.toLowerCase().trim();

  if (!normalizedUnit) {
    return {
      valid: false,
      error: 'Unit cannot be empty'
    };
  }

  if (!DIMENSION_CONSTRAINTS.VALID_UNITS.includes(normalizedUnit)) {
    return {
      valid: false,
      error: `Invalid unit "${unit}". Use m, ft, or yd`
    };
  }

  return { valid: true };
};

/**
 * Validate a dimension pair (width and height)
 *
 * @param width - Width value
 * @param height - Height value
 * @returns Validation result with error message if invalid
 */
export const validateDimensionPair = (
  width: number,
  height: number
): ValidationResult => {
  // Validate width
  const widthValidation = validateDimension(width);
  if (!widthValidation.valid) {
    return {
      valid: false,
      error: `Width: ${widthValidation.error}`
    };
  }

  // Validate height
  const heightValidation = validateDimension(height);
  if (!heightValidation.valid) {
    return {
      valid: false,
      error: `Height: ${heightValidation.error}`
    };
  }

  return { valid: true };
};

/**
 * Validate an angle value
 *
 * @param angle - Angle value in degrees
 * @returns Validation result with error message if invalid
 */
export const validateAngle = (angle: number): ValidationResult => {
  // Check for NaN or Infinity
  if (!isFinite(angle) || isNaN(angle)) {
    return {
      valid: false,
      error: 'Invalid angle number'
    };
  }

  // Angles are normalized to 0-360, so any finite number is valid
  return { valid: true };
};

/**
 * Validate precision setting
 *
 * @param precision - Precision value (number of decimal places)
 * @returns Validation result with error message if invalid
 */
export const validatePrecision = (precision: number): ValidationResult => {
  // Check for integer
  if (!Number.isInteger(precision)) {
    return {
      valid: false,
      error: 'Precision must be an integer'
    };
  }

  // Check range (0-4 decimal places)
  if (precision < 0 || precision > 4) {
    return {
      valid: false,
      error: 'Precision must be between 0 and 4'
    };
  }

  return { valid: true };
};

/**
 * Validate snap precision setting
 *
 * @param snapPrecision - Snap precision value in meters
 * @returns Validation result with error message if invalid
 */
export const validateSnapPrecision = (snapPrecision: number): ValidationResult => {
  const validSnapValues = [0.1, 0.5, 1, 5];

  if (!validSnapValues.includes(snapPrecision)) {
    return {
      valid: false,
      error: 'Snap precision must be 0.1, 0.5, 1, or 5'
    };
  }

  return { valid: true };
};

/**
 * Validate angle snap setting
 *
 * @param angleSnap - Angle snap value in degrees
 * @returns Validation result with error message if invalid
 */
export const validateAngleSnap = (angleSnap: number): ValidationResult => {
  const validAngleSnaps = [15, 30, 45, 90];

  if (!validAngleSnaps.includes(angleSnap)) {
    return {
      valid: false,
      error: 'Angle snap must be 15°, 30°, 45°, or 90°'
    };
  }

  return { valid: true };
};

/**
 * Validate aspect ratio
 *
 * @param aspectRatio - Aspect ratio value (width/height)
 * @returns Validation result with error message if invalid
 */
export const validateAspectRatio = (aspectRatio: number): ValidationResult => {
  // Check for NaN or Infinity
  if (!isFinite(aspectRatio) || isNaN(aspectRatio)) {
    return {
      valid: false,
      error: 'Invalid aspect ratio'
    };
  }

  // Check for positive value
  if (aspectRatio <= 0) {
    return {
      valid: false,
      error: 'Aspect ratio must be positive'
    };
  }

  // Check reasonable range (0.1 to 10)
  if (aspectRatio < 0.1 || aspectRatio > 10) {
    return {
      valid: false,
      error: 'Aspect ratio must be between 0.1 and 10'
    };
  }

  return { valid: true };
};
