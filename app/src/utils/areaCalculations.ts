import type { AreaUnit, AreaValidation, Point2D } from '../types';

// Conversion factors to square meters
const CONVERSIONS: Record<AreaUnit, number> = {
  sqm: 1,
  sqft: 0.092903,
  acres: 4046.86,
  hectares: 10000,
  sqkm: 1000000,
  toise: 3.8,
  perches: 25.29285264,
  'arpent-na': 3419,
  'arpent-paris': 5107
};

export function convertToSquareMeters(area: number, unit: AreaUnit): number {
  return area * CONVERSIONS[unit];
}

export function calculateSquareDimensions(areaInSqM: number): { width: number; height: number } {
  const side = Math.sqrt(areaInSqM);
  return { width: side, height: side };
}

export function calculateGridAwareDimensions(
  targetAreaInSqM: number,
  _gridSize: number,
  _snapToGrid: boolean
): { width: number; height: number } {
  // Always return exact dimensions for the target area
  // Smart Grid Positioning: We maintain exact area and optimize positioning instead
  return calculateSquareDimensions(targetAreaInSqM);
}

export interface SmartGridPosition {
  center: { x: number; y: number };
  gridAlignmentScore: number;
  description: string;
}

export function calculateSmartGridPosition(
  width: number,
  height: number,
  gridSize: number,
  snapToGrid: boolean
): SmartGridPosition {
  // If grid snapping is disabled, use center position
  if (!snapToGrid) {
    return {
      center: { x: 0, y: 0 },
      gridAlignmentScore: 0,
      description: 'Centered at origin (grid snapping disabled)'
    };
  }

  // For square shapes, find the center position that minimizes
  // the total distance from all corners to nearest grid lines
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Test different center positions within one grid cell
  let bestCenter = { x: 0, y: 0 };
  let bestScore = Infinity;
  let bestDescription = '';

  // Sample positions within a grid cell around origin
  const samples = 20; // Test 20x20 grid of positions
  for (let i = 0; i < samples; i++) {
    for (let j = 0; j < samples; j++) {
      const centerX = (i / samples) * gridSize - gridSize / 2;
      const centerY = (j / samples) * gridSize - gridSize / 2;

      // Calculate corners for this center position
      const corners = [
        { x: centerX - halfWidth, y: centerY - halfHeight },
        { x: centerX + halfWidth, y: centerY - halfHeight },
        { x: centerX + halfWidth, y: centerY + halfHeight },
        { x: centerX - halfWidth, y: centerY + halfHeight }
      ];

      // Calculate total distance to nearest grid lines
      let totalDistance = 0;
      for (const corner of corners) {
        const distToGridX = Math.abs(corner.x % gridSize);
        const distToGridY = Math.abs(corner.y % gridSize);
        const distX = Math.min(distToGridX, gridSize - distToGridX);
        const distY = Math.min(distToGridY, gridSize - distToGridY);
        totalDistance += Math.sqrt(distX * distX + distY * distY);
      }

      if (totalDistance < bestScore) {
        bestScore = totalDistance;
        bestCenter = { x: centerX, y: centerY };
      }
    }
  }

  // Snap the best center to a reasonable precision (0.01m)
  bestCenter.x = Math.round(bestCenter.x * 100) / 100;
  bestCenter.y = Math.round(bestCenter.y * 100) / 100;

  // Calculate alignment quality
  const maxPossibleDistance = 4 * Math.sqrt(2) * (gridSize / 2); // Max distance if corners are at grid cell centers
  const alignmentScore = Math.max(0, 1 - bestScore / maxPossibleDistance);

  // Generate description
  if (alignmentScore > 0.95) {
    bestDescription = 'Excellent grid alignment achieved';
  } else if (alignmentScore > 0.8) {
    bestDescription = 'Good grid alignment with exact area preserved';
  } else if (alignmentScore > 0.5) {
    bestDescription = 'Moderate grid alignment, exact area maintained';
  } else {
    bestDescription = 'Exact area preserved, limited grid alignment possible';
  }

  return {
    center: bestCenter,
    gridAlignmentScore: alignmentScore,
    description: bestDescription
  };
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
    sqkm: 'km²',
    toise: 'T',
    perches: 'perch',
    'arpent-na': 'arp-na',
    'arpent-paris': 'arp-pa'
  };
  return labels[unit];
}

export interface GridSnapImpact {
  hasSignificantImpact: boolean;
  originalArea: number;
  snappedArea: number;
  areaLoss: number;
  percentageChange: number;
  recommendDisableSnapping: boolean;
  gridAlignment?: {
    score: number;
    description: string;
  };
}

export function analyzeGridSnapImpact(
  targetArea: number,
  unit: AreaUnit,
  gridSize: number,
  snapToGrid: boolean
): GridSnapImpact {
  const areaInSqM = convertToSquareMeters(targetArea, unit);

  // With Smart Grid Positioning, exact area is always preserved
  // Grid snapping now only affects positioning, not area
  if (!snapToGrid) {
    return {
      hasSignificantImpact: false,
      originalArea: areaInSqM,
      snappedArea: areaInSqM,
      areaLoss: 0,
      percentageChange: 0,
      recommendDisableSnapping: false
    };
  }

  // Calculate grid alignment quality for the exact area
  const { width, height } = calculateSquareDimensions(areaInSqM);
  const gridPosition = calculateSmartGridPosition(width, height, gridSize, snapToGrid);

  // Area is always preserved with smart positioning
  return {
    hasSignificantImpact: false, // No area impact with smart positioning
    originalArea: areaInSqM,
    snappedArea: areaInSqM, // Always exact area
    areaLoss: 0, // No area loss
    percentageChange: 0, // No percentage change
    recommendDisableSnapping: false,
    // Add grid alignment info for future use
    gridAlignment: {
      score: gridPosition.gridAlignmentScore,
      description: gridPosition.description
    }
  };
}

// ===== ADD AREA FEATURE EXTENSIONS =====

export const generateShapeFromArea = (
  area: number,
  unit: AreaUnit,
  shapeType: 'square' | 'rectangle' | 'circle',
  options: {
    aspectRatio?: number;
    position?: Point2D;
    useGridAlignment?: boolean;
  } = {}
): Point2D[] => {
  const areaInSquareMeters = convertToSquareMeters(area, unit);
  const position = options.position || { x: 0, y: 0 };

  // Use existing grid alignment if enabled
  const finalPosition = options.useGridAlignment
    ? calculateSmartGridPositionForShape(areaInSquareMeters, position, shapeType, options.aspectRatio)
    : position;

  switch (shapeType) {
    case 'square':
      return generateSquarePoints(areaInSquareMeters, finalPosition);
    case 'rectangle':
      return generateRectanglePoints(areaInSquareMeters, options.aspectRatio || 1.5, finalPosition);
    case 'circle':
      return generateCirclePoints(areaInSquareMeters, finalPosition);
    default:
      throw new Error(`Unsupported shape type: ${shapeType}`);
  }
};

const generateSquarePoints = (area: number, center: Point2D): Point2D[] => {
  const side = Math.sqrt(area);
  const half = side / 2;
  return [
    { x: center.x - half, y: center.y - half },
    { x: center.x + half, y: center.y - half },
    { x: center.x + half, y: center.y + half },
    { x: center.x - half, y: center.y + half }
  ];
};

const generateRectanglePoints = (area: number, aspectRatio: number, center: Point2D): Point2D[] => {
  const width = Math.sqrt(area * aspectRatio);
  const height = area / width;
  const halfW = width / 2;
  const halfH = height / 2;
  return [
    { x: center.x - halfW, y: center.y - halfH },
    { x: center.x + halfW, y: center.y - halfH },
    { x: center.x + halfW, y: center.y + halfH },
    { x: center.x - halfW, y: center.y + halfH }
  ];
};

const generateCirclePoints = (area: number, center: Point2D, segments: number = 32): Point2D[] => {
  const radius = Math.sqrt(area / Math.PI);
  const points: Point2D[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  }
  return points;
};

export const calculateShapePreview = (
  area: number,
  unit: AreaUnit,
  shapeType: 'square' | 'rectangle' | 'circle',
  aspectRatio?: number
): { width: number; height: number; radius?: number } => {
  const areaInSquareMeters = convertToSquareMeters(area, unit);

  switch (shapeType) {
    case 'square':
      const side = Math.sqrt(areaInSquareMeters);
      return { width: side, height: side };
    case 'rectangle':
      const ratio = aspectRatio || 1.5;
      const width = Math.sqrt(areaInSquareMeters * ratio);
      const height = areaInSquareMeters / width;
      return { width, height };
    case 'circle':
      const radius = Math.sqrt(areaInSquareMeters / Math.PI);
      return { width: radius * 2, height: radius * 2, radius };
    default:
      throw new Error(`Unsupported shape type: ${shapeType}`);
  }
};

const calculateSmartGridPositionForShape = (
  areaInSquareMeters: number,
  preferredPosition: Point2D,
  shapeType: 'square' | 'rectangle' | 'circle',
  aspectRatio?: number
): Point2D => {
  // For now, use the preferred position
  // This can be enhanced later to use actual grid snapping logic
  return preferredPosition;
};

