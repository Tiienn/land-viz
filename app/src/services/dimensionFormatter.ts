/**
 * Dimension Formatter Service
 * Spec 013: Direct Dimension Input
 *
 * Formats dimension values for display with precision and units
 */

import type { FormattedDimension } from '@/types';

/**
 * Format a single dimension value with precision and unit
 *
 * @param value - Numeric value to format
 * @param precision - Number of decimal places (0-4)
 * @param unit - Unit suffix ('m', 'ft', 'yd')
 * @returns Formatted dimension string (e.g., "10.50m")
 */
export const formatDimension = (
  value: number,
  precision: number,
  unit: string
): FormattedDimension => {
  // Clamp precision to 0-4 range
  const safePrecision = Math.max(0, Math.min(4, precision));

  // Handle edge cases
  if (!isFinite(value)) {
    return `0${unit}`;
  }

  // Format with precision
  const formatted = value.toFixed(safePrecision);

  return `${formatted}${unit}`;
};

/**
 * Format a dimension pair (width × height) with precision and unit
 *
 * @param width - Width value
 * @param height - Height value
 * @param precision - Number of decimal places (0-4)
 * @param unit - Unit suffix ('m', 'ft', 'yd')
 * @returns Formatted dimension pair (e.g., "10.00m × 15.00m")
 */
export const formatDimensionPair = (
  width: number,
  height: number,
  precision: number,
  unit: string
): FormattedDimension => {
  const formattedWidth = formatDimension(width, precision, unit);
  const formattedHeight = formatDimension(height, precision, unit);

  return `${formattedWidth} × ${formattedHeight}`;
};

/**
 * Format a distance value with precision and unit
 *
 * @param distance - Distance value to format
 * @param precision - Number of decimal places (0-4)
 * @param unit - Unit suffix ('m', 'ft', 'yd')
 * @returns Formatted distance string (e.g., "25.50m")
 */
export const formatDistance = (
  distance: number,
  precision: number,
  unit: string
): FormattedDimension => {
  return formatDimension(distance, precision, unit);
};

/**
 * Format an area value with precision and unit
 *
 * @param area - Area value to format
 * @param precision - Number of decimal places (0-4)
 * @param unit - Unit suffix ('m', 'ft', 'yd')
 * @returns Formatted area string (e.g., "150.00m²")
 */
export const formatArea = (
  area: number,
  precision: number,
  unit: string
): FormattedDimension => {
  const safePrecision = Math.max(0, Math.min(4, precision));

  if (!isFinite(area)) {
    return `0${unit}²`;
  }

  const formatted = area.toFixed(safePrecision);

  return `${formatted}${unit}²`;
};

/**
 * Format an angle value with precision
 *
 * @param angle - Angle value in degrees
 * @param precision - Number of decimal places (0-2)
 * @returns Formatted angle string (e.g., "45.0°")
 */
export const formatAngle = (
  angle: number,
  precision: number = 1
): FormattedDimension => {
  const safePrecision = Math.max(0, Math.min(2, precision));

  // Normalize angle to 0-360 range
  const normalizedAngle = ((angle % 360) + 360) % 360;

  const formatted = normalizedAngle.toFixed(safePrecision);

  return `${formatted}°`;
};

/**
 * Format a radius value with precision and unit
 *
 * @param radius - Radius value to format
 * @param precision - Number of decimal places (0-4)
 * @param unit - Unit suffix ('m', 'ft', 'yd')
 * @returns Formatted radius string (e.g., "r5.00m")
 */
export const formatRadius = (
  radius: number,
  precision: number,
  unit: string
): FormattedDimension => {
  const formattedValue = formatDimension(radius, precision, unit);
  return `r${formattedValue}`;
};

/**
 * Format a diameter value with precision and unit
 *
 * @param diameter - Diameter value to format
 * @param precision - Number of decimal places (0-4)
 * @param unit - Unit suffix ('m', 'ft', 'yd')
 * @returns Formatted diameter string (e.g., "d10.00m")
 */
export const formatDiameter = (
  diameter: number,
  precision: number,
  unit: string
): FormattedDimension => {
  const formattedValue = formatDimension(diameter, precision, unit);
  return `d${formattedValue}`;
};

/**
 * Get the appropriate unit symbol for display
 *
 * @param unit - Unit code ('m', 'ft', 'yd')
 * @returns Unit symbol or full name
 */
export const getUnitDisplay = (unit: string): string => {
  switch (unit.toLowerCase()) {
    case 'm':
      return 'm';
    case 'ft':
      return 'ft';
    case 'yd':
      return 'yd';
    default:
      return 'm';
  }
};

/**
 * Format a coordinate pair
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param precision - Number of decimal places (0-4)
 * @param unit - Unit suffix ('m', 'ft', 'yd')
 * @returns Formatted coordinate string (e.g., "(10.00m, 15.00m)")
 */
export const formatCoordinate = (
  x: number,
  y: number,
  precision: number,
  unit: string
): FormattedDimension => {
  const formattedX = formatDimension(x, precision, unit);
  const formattedY = formatDimension(y, precision, unit);

  return `(${formattedX}, ${formattedY})`;
};
