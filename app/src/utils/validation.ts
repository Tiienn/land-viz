import type { AddAreaConfig, AddAreaValidation, AreaUnit } from '@/types';
import { convertToSquareMeters } from './areaCalculations';

const AREA_LIMITS = {
  sqm: { min: 0.01, max: 1000000 },
  sqft: { min: 0.1, max: 10763910 },
  acres: { min: 0.000001, max: 247 },
  hectares: { min: 0.0001, max: 100 },
  sqkm: { min: 0.000001, max: 1000 }
};

export const validateAddAreaConfig = (config: Partial<AddAreaConfig>): AddAreaValidation => {
  const errors: string[] = [];

  // Validate area value
  if (!config.area || config.area <= 0) {
    errors.push('Area must be a positive number');
  } else if (config.unit && config.area) {
    const limits = AREA_LIMITS[config.unit];
    if (config.area < limits.min) {
      errors.push(`Area must be at least ${limits.min} ${config.unit}`);
    }
    if (config.area > limits.max) {
      errors.push(`Area cannot exceed ${limits.max} ${config.unit}`);
    }
  }

  // Validate unit
  const validUnits = ['sqm', 'sqft', 'acres', 'hectares', 'sqkm'];
  if (!config.unit || !validUnits.includes(config.unit)) {
    errors.push('Please select a valid unit');
  }

  // Validate shape type
  const validShapes = ['square', 'rectangle', 'circle'];
  if (!config.shapeType || !validShapes.includes(config.shapeType)) {
    errors.push('Please select a valid shape type');
  }

  // Validate aspect ratio for rectangles
  if (config.shapeType === 'rectangle') {
    if (config.aspectRatio && (config.aspectRatio < 0.1 || config.aspectRatio > 10)) {
      errors.push('Aspect ratio must be between 0.1 and 10');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeAreaInput = (input: string): number => {
  // Remove non-numeric characters except decimal point
  const cleaned = input.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num) || num <= 0) return 0;

  // Prevent extremely large values that could cause performance issues
  return Math.min(num, 1000000);
};

export const formatAreaDisplay = (area: number, unit: AreaUnit): string => {
  const decimals = unit === 'sqm' ? 2 : unit === 'sqft' ? 0 : 4;
  return `${area.toFixed(decimals)} ${unit}`;
};