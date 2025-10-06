/**
 * Dimension Parser Service
 * Spec 013: Direct Dimension Input
 *
 * Parses various dimension input formats for shapes
 */

import type { ParsedDimension, ParsedPolarCoordinate } from '@/types';

/**
 * Parse rectangle dimension input (width x height format)
 *
 * Supported formats:
 * - "10x15" → { width: 10, height: 15, unit: 'm', valid: true }
 * - "10 x 15" → { width: 10, height: 15, unit: 'm', valid: true }
 * - "10m x 15m" → { width: 10, height: 15, unit: 'm', valid: true }
 * - "10.5 x 20.75" → { width: 10.5, height: 20.75, unit: 'm', valid: true }
 * - "33ft x 50ft" → { width: 33, height: 50, unit: 'ft', valid: true }
 */
export const parseDimension = (input: string): ParsedDimension => {
  // Trim and normalize input
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Input cannot be empty'
    };
  }

  // Regex pattern for dimension parsing
  // Matches: number [unit] x number [unit]
  // Examples: "10x15", "10 x 15", "10m x 15m", "10.5 x 20.75ft"
  const dimensionPattern = /^(\d+\.?\d*)\s*([a-z]*)\s*[x×]\s*(\d+\.?\d*)\s*([a-z]*)$/i;
  const match = trimmed.match(dimensionPattern);

  if (!match) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Invalid format. Use "width x height" (e.g., "10x15" or "10m x 15m")'
    };
  }

  const width = parseFloat(match[1]);
  const widthUnit = match[2] || 'm';
  const height = parseFloat(match[3]);
  const heightUnit = match[4] || widthUnit || 'm';

  // Validate numbers
  if (isNaN(width) || isNaN(height)) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Invalid numbers in dimension'
    };
  }

  if (width <= 0 || height <= 0) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Dimensions must be positive'
    };
  }

  // Validate minimum size (0.1m = 10cm)
  if (width < 0.1 || height < 0.1) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Dimensions too small (minimum 0.1m)'
    };
  }

  // Validate maximum size (1000m = 1km)
  if (width > 1000 || height > 1000) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Dimensions too large (maximum 1000m)'
    };
  }

  // Check if units match
  if (widthUnit !== heightUnit && heightUnit !== '' && widthUnit !== '') {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Width and height units must match'
    };
  }

  // Validate unit
  const unit = widthUnit || heightUnit;
  const validUnits = ['m', 'ft', 'yd', ''];
  if (!validUnits.includes(unit)) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: `Invalid unit "${unit}". Use m, ft, or yd`
    };
  }

  return {
    width,
    height,
    unit: unit || 'm',
    valid: true
  };
};

/**
 * Parse radius input for circles
 *
 * Supported formats:
 * - "5" → { width: 5, height: 5, unit: 'm', valid: true }
 * - "r5" → { width: 5, height: 5, unit: 'm', valid: true }
 * - "d10" → { width: 5, height: 5, unit: 'm', valid: true } (diameter → radius)
 * - "5m" → { width: 5, height: 5, unit: 'm', valid: true }
 */
export const parseRadius = (input: string): ParsedDimension => {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Input cannot be empty'
    };
  }

  // Pattern for radius/diameter: [r|d]number[unit]
  // Examples: "5", "r5", "d10", "5m", "r10ft"
  const radiusPattern = /^([rd]?)(\d+\.?\d*)\s*([a-z]*)$/i;
  const match = trimmed.match(radiusPattern);

  if (!match) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Invalid format. Use radius (e.g., "5" or "r5") or diameter (e.g., "d10")'
    };
  }

  const type = match[1] || 'r'; // Default to radius
  let value = parseFloat(match[2]);
  const unit = match[3] || 'm';

  // Convert diameter to radius
  if (type === 'd') {
    value = value / 2;
  }

  // Validate number
  if (isNaN(value)) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Invalid number in radius'
    };
  }

  if (value <= 0) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Radius must be positive'
    };
  }

  // Validate minimum size (0.1m = 10cm)
  if (value < 0.1) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Radius too small (minimum 0.1m)'
    };
  }

  // Validate maximum size (500m radius = 1km diameter)
  if (value > 500) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: 'Radius too large (maximum 500m)'
    };
  }

  // Validate unit
  const validUnits = ['m', 'ft', 'yd', ''];
  if (!validUnits.includes(unit)) {
    return {
      width: 0,
      height: 0,
      unit: 'm',
      valid: false,
      error: `Invalid unit "${unit}". Use m, ft, or yd`
    };
  }

  // Return width and height as the same value (radius)
  return {
    width: value,
    height: value,
    unit: unit || 'm',
    valid: true
  };
};

/**
 * Parse polar coordinate input (distance@angle format)
 *
 * Supported formats:
 * - "10@45" → { distance: 10, angle: 45, unit: 'm', valid: true }
 * - "10m@45" → { distance: 10, angle: 45, unit: 'm', valid: true }
 * - "15@90°" → { distance: 15, angle: 90, unit: 'm', valid: true }
 */
export const parsePolarCoordinate = (input: string): ParsedPolarCoordinate => {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return {
      distance: 0,
      angle: 0,
      unit: 'm',
      valid: false,
      error: 'Input cannot be empty'
    };
  }

  // Pattern for polar coordinates: distance[unit]@angle[°]
  // Examples: "10@45", "10m@45", "15@90°"
  const polarPattern = /^(\d+\.?\d*)\s*([a-z]*)\s*[@]\s*(\d+\.?\d*)\s*[°]?$/i;
  const match = trimmed.match(polarPattern);

  if (!match) {
    return {
      distance: 0,
      angle: 0,
      unit: 'm',
      valid: false,
      error: 'Invalid format. Use "distance@angle" (e.g., "10@45" or "10m@45°")'
    };
  }

  const distance = parseFloat(match[1]);
  const unit = match[2] || 'm';
  const angle = parseFloat(match[3]);

  // Validate numbers
  if (isNaN(distance) || isNaN(angle)) {
    return {
      distance: 0,
      angle: 0,
      unit: 'm',
      valid: false,
      error: 'Invalid numbers in polar coordinate'
    };
  }

  if (distance <= 0) {
    return {
      distance: 0,
      angle: 0,
      unit: 'm',
      valid: false,
      error: 'Distance must be positive'
    };
  }

  // Normalize angle to 0-360 range
  const normalizedAngle = ((angle % 360) + 360) % 360;

  // Validate unit
  const validUnits = ['m', 'ft', 'yd', ''];
  if (!validUnits.includes(unit)) {
    return {
      distance: 0,
      angle: 0,
      unit: 'm',
      valid: false,
      error: `Invalid unit "${unit}". Use m, ft, or yd`
    };
  }

  return {
    distance,
    angle: normalizedAngle,
    unit: unit || 'm',
    valid: true
  };
};

/**
 * Convert unit to meters
 */
export const convertToMeters = (value: number, unit: string): number => {
  switch (unit.toLowerCase()) {
    case 'm':
      return value;
    case 'ft':
      return value * 0.3048; // 1 foot = 0.3048 meters
    case 'yd':
      return value * 0.9144; // 1 yard = 0.9144 meters
    default:
      return value; // Default to meters
  }
};

/**
 * Convert meters to specified unit
 */
export const convertFromMeters = (meters: number, targetUnit: string): number => {
  switch (targetUnit.toLowerCase()) {
    case 'm':
      return meters;
    case 'ft':
      return meters / 0.3048; // meters to feet
    case 'yd':
      return meters / 0.9144; // meters to yards
    default:
      return meters; // Default to meters
  }
};
