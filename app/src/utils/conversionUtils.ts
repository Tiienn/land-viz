/**
 * Utility functions for unit conversion
 */

import type { AreaUnit, UnitConfig, ValidationResult } from '../types/conversion';

/**
 * NIST-certified conversion factors to square meters
 * All conversions are based on official standards
 */
export const CONVERSION_FACTORS: Record<AreaUnit, number> = {
  sqm: 1,                        // Base unit (square meters)
  sqft: 10.7639,                // Square feet per square meter (NIST)
  acres: 0.000247105,           // Acres per square meter (NIST)
  hectares: 0.0001,             // Hectares per square meter (exact)
  sqkm: 0.000001,               // Square kilometers per square meter (exact)
  sqmi: 3.861e-7,               // Square miles per square meter (NIST)
  toise: 0.263158,              // Toise per square meter (1 / 3.8) - Historical French land measurement
  perches: 0.03953686,          // Perches per square meter (1 / 25.29285264) - Historical British land measurement
  'perches-mauritius': 0.02368, // Mauritius perches per square meter (1 / 42.21) - Mauritius land measurement
  'arpent-na': 0.0002925,       // North American arpent per square meter (1 / 3419) - North American standard
  'arpent-paris': 0.0001958,    // Parisian arpent per square meter (1 / 5107) - Historical Parisian standard
  'arpent-mauritius': 0.000237  // Mauritius arpent per square meter (1 / 4221) - Mauritius standard
} as const;

/**
 * Display configuration for each unit
 */
export const UNIT_CONFIGS: Record<AreaUnit, UnitConfig> = {
  sqm: {
    name: 'Square Meters',
    symbol: 'm²',
    precision: 2,
    useScientific: true,
    scientificThreshold: 1000000
  },
  sqft: {
    name: 'Square Feet',
    symbol: 'ft²',
    precision: 2,
    useScientific: true,
    scientificThreshold: 1000000
  },
  acres: {
    name: 'Acres',
    symbol: 'ac',
    precision: 4,
    useScientific: false
  },
  hectares: {
    name: 'Hectares',
    symbol: 'ha',
    precision: 4,
    useScientific: false
  },
  sqkm: {
    name: 'Square Kilometers',
    symbol: 'km²',
    precision: 6,
    useScientific: false
  },
  sqmi: {
    name: 'Square Miles',
    symbol: 'mi²',
    precision: 6,
    useScientific: false
  },
  toise: {
    name: 'Toise',
    symbol: 'T',
    precision: 4,
    useScientific: false
  },
  perches: {
    name: 'Perches (British)',
    symbol: 'perch',
    precision: 4,
    useScientific: false
  },
  'perches-mauritius': {
    name: 'Perches (Mauritius)',
    symbol: 'perch-mu',
    precision: 4,
    useScientific: false
  },
  'arpent-na': {
    name: 'Arpent (North America)',
    symbol: 'arp-na',
    precision: 4,
    useScientific: false
  },
  'arpent-paris': {
    name: 'Arpent (Paris)',
    symbol: 'arp-pa',
    precision: 4,
    useScientific: false
  },
  'arpent-mauritius': {
    name: 'Arpent (Mauritius)',
    symbol: 'arp-mu',
    precision: 4,
    useScientific: false
  }
} as const;

/**
 * Validates numeric input for conversion
 */
export function validateInput(input: string): ValidationResult {
  // Empty input is valid (shows 0)
  if (!input.trim()) {
    return { isValid: true, value: 0 };
  }

  // Remove leading/trailing whitespace
  const cleaned = input.trim();

  // Check for valid number format
  const numberRegex = /^-?\d*\.?\d+([eE][-+]?\d+)?$/;
  if (!numberRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Please enter a valid number'
    };
  }

  const value = parseFloat(cleaned);

  // Check for invalid numbers
  if (isNaN(value) || !isFinite(value)) {
    return {
      isValid: false,
      error: 'Please enter a valid number'
    };
  }

  // Check for negative values
  if (value < 0) {
    return {
      isValid: false,
      error: 'Area cannot be negative'
    };
  }

  // Check for reasonable range (up to 1 billion square meters)
  if (value > 1e9) {
    return {
      isValid: false,
      error: 'Value too large'
    };
  }

  return { isValid: true, value };
}

/**
 * Sanitizes input by removing invalid characters
 */
export function sanitizeInput(input: string): string {
  // Allow digits, decimal point, minus sign, and scientific notation
  return input.replace(/[^0-9.\-eE+]/g, '');
}

/**
 * Formats a number for display with appropriate precision
 */
export function formatValue(value: number, unit: AreaUnit): string {
  if (!isFinite(value) || isNaN(value)) {
    return '0';
  }

  const config = UNIT_CONFIGS[unit];

  // Use scientific notation for very large numbers if configured
  if (config.useScientific && config.scientificThreshold && value >= config.scientificThreshold) {
    return value.toExponential(2);
  }

  // For very small numbers, use more precision
  if (value < 0.0001 && value > 0) {
    return value.toExponential(2);
  }

  // Use appropriate decimal places
  const formatted = value.toFixed(config.precision);

  // Remove trailing zeros after decimal point
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Formats a complete conversion result with unit symbol
 */
export function formatConversionResult(value: number, unit: AreaUnit): string {
  const formatted = formatValue(value, unit);
  const symbol = UNIT_CONFIGS[unit].symbol;
  return `${formatted} ${symbol}`;
}

/**
 * Determines if a conversion result should be marked as approximate
 */
export function isResultApproximate(originalValue: number, convertedValue: number, unit: AreaUnit): boolean {
  const config = UNIT_CONFIGS[unit];

  // Very small numbers are often approximate due to floating point precision
  if (convertedValue < Math.pow(10, -config.precision)) {
    return true;
  }

  // Very large numbers may lose precision
  if (config.useScientific && config.scientificThreshold && convertedValue >= config.scientificThreshold) {
    return true;
  }

  return false;
}

/**
 * Gets the display precision for a given value and unit
 */
export function getDisplayPrecision(value: number, unit: AreaUnit): number {
  const config = UNIT_CONFIGS[unit];

  // For very small values, use more precision
  if (value < 0.01 && value > 0) {
    return Math.min(config.precision + 2, 8);
  }

  return config.precision;
}

/**
 * Creates a debounced function that delays execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}