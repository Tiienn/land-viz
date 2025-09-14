import type { AreaUnit, AreaValidation } from '../types';

// Conversion factors to square meters
const CONVERSIONS: Record<AreaUnit, number> = {
  sqm: 1,
  sqft: 0.092903,
  acres: 4046.86,
  hectares: 10000,
  sqkm: 1000000
};

export function convertToSquareMeters(area: number, unit: AreaUnit): number {
  return area * CONVERSIONS[unit];
}

export function calculateSquareDimensions(areaInSqM: number): { width: number; height: number } {
  const side = Math.sqrt(areaInSqM);
  return { width: side, height: side };
}

export function validateAreaInput(value: string): AreaValidation {
  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (numValue <= 0) {
    return { isValid: false, error: 'Area must be greater than zero' };
  }

  if (numValue > 1000000) {
    return { isValid: false, error: 'Area too large (max: 1,000,000)' };
  }

  return { isValid: true, numValue };
}

export function getUnitLabel(unit: AreaUnit): string {
  const labels = {
    sqm: 'm²',
    sqft: 'ft²',
    acres: 'acres',
    hectares: 'ha',
    sqkm: 'km²'
  };
  return labels[unit];
}