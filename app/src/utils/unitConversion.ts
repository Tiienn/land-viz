/**
 * Unit Conversion Utilities
 *
 * Handles conversion between different units of measurement:
 * - Length: meters (m), feet (ft), yards (yd)
 * - Area: square meters (m²), square feet (ft²), square yards (yd²)
 *
 * CONVERSION FACTORS:
 * - 1 meter = 3.28084 feet
 * - 1 meter = 1.09361 yards
 * - 1 foot = 0.3048 meters
 * - 1 yard = 0.9144 meters
 *
 * @example
 * ```typescript
 * import { convertLength, convertArea } from './unitConversion';
 *
 * // Convert 10 meters to feet
 * const feet = convertLength(10, 'm', 'ft'); // 32.8084
 *
 * // Convert 100 square feet to square meters
 * const sqMeters = convertArea(100, 'ft²', 'm²'); // 9.2903
 * ```
 */

// ============================================================================
// Conversion Factors
// ============================================================================

/**
 * Length conversion factors
 * All values are relative to meters
 */
export const LENGTH_CONVERSIONS = {
  // To meters
  m_to_m: 1,
  ft_to_m: 0.3048,
  yd_to_m: 0.9144,

  // From meters
  m_to_ft: 3.28084,
  m_to_yd: 1.09361,

  // Cross conversions
  ft_to_yd: 0.333333,
  yd_to_ft: 3,
} as const;

/**
 * Area conversion factors
 * All values are relative to square meters
 */
export const AREA_CONVERSIONS = {
  // To square meters
  'm²_to_m²': 1,
  'ft²_to_m²': 0.092903,
  'yd²_to_m²': 0.836127,

  // From square meters
  'm²_to_ft²': 10.7639,
  'm²_to_yd²': 1.19599,

  // Cross conversions
  'ft²_to_yd²': 0.111111,
  'yd²_to_ft²': 9,
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/** Supported length units */
export type LengthUnit = 'm' | 'ft' | 'yd';

/** Supported area units */
export type AreaUnit = 'm²' | 'ft²' | 'yd²';

/** Unit labels for display */
export const UNIT_LABELS: Record<LengthUnit, string> = {
  m: 'meters',
  ft: 'feet',
  yd: 'yards',
};

/** Area unit labels for display */
export const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  'm²': 'square meters',
  'ft²': 'square feet',
  'yd²': 'square yards',
};

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert length between units
 *
 * @param value - Length value to convert
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Converted length value
 *
 * @example
 * ```typescript
 * convertLength(10, 'm', 'ft')  // 32.8084
 * convertLength(100, 'ft', 'm') // 30.48
 * convertLength(50, 'yd', 'ft') // 150
 * ```
 */
export function convertLength(
  value: number,
  fromUnit: LengthUnit,
  toUnit: LengthUnit
): number {
  if (fromUnit === toUnit) return value;

  // Convert to meters first (common base)
  let meters: number;
  if (fromUnit === 'm') {
    meters = value;
  } else if (fromUnit === 'ft') {
    meters = value * LENGTH_CONVERSIONS.ft_to_m;
  } else {
    // yd
    meters = value * LENGTH_CONVERSIONS.yd_to_m;
  }

  // Convert from meters to target unit
  if (toUnit === 'm') {
    return meters;
  } else if (toUnit === 'ft') {
    return meters * LENGTH_CONVERSIONS.m_to_ft;
  } else {
    // yd
    return meters * LENGTH_CONVERSIONS.m_to_yd;
  }
}

/**
 * Convert area between units
 *
 * @param value - Area value to convert
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Converted area value
 *
 * @example
 * ```typescript
 * convertArea(10, 'm²', 'ft²')  // 107.639
 * convertArea(100, 'ft²', 'm²') // 9.2903
 * convertArea(50, 'yd²', 'ft²') // 450
 * ```
 */
export function convertArea(
  value: number,
  fromUnit: AreaUnit,
  toUnit: AreaUnit
): number {
  if (fromUnit === toUnit) return value;

  // Convert to square meters first (common base)
  let sqMeters: number;
  if (fromUnit === 'm²') {
    sqMeters = value;
  } else if (fromUnit === 'ft²') {
    sqMeters = value * AREA_CONVERSIONS['ft²_to_m²'];
  } else {
    // yd²
    sqMeters = value * AREA_CONVERSIONS['yd²_to_m²'];
  }

  // Convert from square meters to target unit
  if (toUnit === 'm²') {
    return sqMeters;
  } else if (toUnit === 'ft²') {
    return sqMeters * AREA_CONVERSIONS['m²_to_ft²'];
  } else {
    // yd²
    return sqMeters * AREA_CONVERSIONS['m²_to_yd²'];
  }
}

/**
 * Convert multiple lengths at once
 *
 * @param values - Array of length values
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Array of converted values
 *
 * @example
 * ```typescript
 * convertLengths([10, 20, 30], 'm', 'ft')
 * // [32.8084, 65.6168, 98.4252]
 * ```
 */
export function convertLengths(
  values: number[],
  fromUnit: LengthUnit,
  toUnit: LengthUnit
): number[] {
  return values.map((v) => convertLength(v, fromUnit, toUnit));
}

/**
 * Format length with unit label
 *
 * @param value - Length value
 * @param unit - Unit of measurement
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with unit
 *
 * @example
 * ```typescript
 * formatLength(10.5, 'm')    // "10.50m"
 * formatLength(32.8, 'ft', 1) // "32.8ft"
 * ```
 */
export function formatLength(
  value: number,
  unit: LengthUnit,
  decimals: number = 2
): string {
  return `${value.toFixed(decimals)}${unit}`;
}

/**
 * Format area with unit label
 *
 * @param value - Area value
 * @param unit - Unit of measurement
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with unit
 *
 * @example
 * ```typescript
 * formatArea(100.5, 'm²')     // "100.50m²"
 * formatArea(1000, 'ft²', 0)  // "1000ft²"
 * ```
 */
export function formatArea(
  value: number,
  unit: AreaUnit,
  decimals: number = 2
): string {
  return `${value.toFixed(decimals)}${unit}`;
}

/**
 * Normalize dimension inputs to meters
 *
 * Converts all dimension inputs to meters for consistent calculations
 *
 * @param dimensions - Array of dimension inputs with mixed units
 * @returns Array of dimension values in meters
 *
 * @example
 * ```typescript
 * const dims = [
 *   { value: 10, unit: 'm' },
 *   { value: 50, unit: 'ft' },
 *   { value: 20, unit: 'yd' }
 * ];
 * normalizeDimensions(dims) // [10, 15.24, 18.288]
 * ```
 */
export function normalizeDimensions(
  dimensions: Array<{ value: number; unit: LengthUnit }>
): number[] {
  return dimensions.map((dim) => convertLength(dim.value, dim.unit, 'm'));
}

/**
 * Normalize area input to square meters
 *
 * @param area - Area value
 * @param unit - Area unit
 * @returns Area in square meters
 *
 * @example
 * ```typescript
 * normalizeArea(100, 'ft²') // 9.2903
 * normalizeArea(50, 'm²')   // 50
 * ```
 */
export function normalizeArea(area: number, unit: AreaUnit): number {
  return convertArea(area, unit, 'm²');
}

/**
 * Calculate conversion factor between two units
 *
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Conversion factor (multiply by this to convert)
 *
 * @example
 * ```typescript
 * const factor = getConversionFactor('m', 'ft'); // 3.28084
 * const feet = 10 * factor; // 32.8084
 * ```
 */
export function getConversionFactor(
  fromUnit: LengthUnit,
  toUnit: LengthUnit
): number {
  return convertLength(1, fromUnit, toUnit);
}

/**
 * Get area conversion factor between two units
 *
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Conversion factor (multiply by this to convert)
 */
export function getAreaConversionFactor(
  fromUnit: AreaUnit,
  toUnit: AreaUnit
): number {
  return convertArea(1, fromUnit, toUnit);
}

/**
 * Parse dimension string (e.g., "10m", "50ft", "20 yd")
 *
 * @param input - Dimension string
 * @returns Parsed value and unit, or null if invalid
 *
 * @example
 * ```typescript
 * parseDimension("10m")     // { value: 10, unit: 'm' }
 * parseDimension("50 ft")   // { value: 50, unit: 'ft' }
 * parseDimension("invalid") // null
 * ```
 */
export function parseDimension(
  input: string
): { value: number; unit: LengthUnit } | null {
  const trimmed = input.trim().toLowerCase();

  // Try to extract number and unit
  const match = trimmed.match(/^([\d.]+)\s*(m|ft|yd)$/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2] as LengthUnit;

  if (isNaN(value)) return null;

  return { value, unit };
}

export default {
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
  UNIT_LABELS,
  AREA_UNIT_LABELS,
};
