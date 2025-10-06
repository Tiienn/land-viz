/**
 * Direct Dimension Input System - Type Definitions
 * Spec 013: Direct Dimension Input
 */

/**
 * Represents a parsed dimension input
 */
export interface ParsedDimension {
  width: number;
  height: number;
  unit: string;
  valid: boolean;
  error?: string;
}

/**
 * Precision settings for dimension input and display
 */
export interface PrecisionSettings {
  snapPrecision: number;      // Snap precision in meters (0.1, 0.5, 1, 5)
  displayPrecision: number;    // Number of decimal places (0-4)
  preferredUnit: string;       // 'm', 'ft', 'yd'
  angleSnap: number;          // Angle snap in degrees (15, 30, 45, 90)
}

/**
 * State for dimension input toolbar
 */
export interface DimensionInputState {
  isDimensionInputActive: boolean;
  inputWidth: string;
  inputHeight: string;
  inputRadius: string;
  inputUnit: string;
  inputRadiusMode: 'r' | 'd'; // 'r' for radius, 'd' for diameter
  inputError: string | null;
}

/**
 * State for inline dimension editing
 */
export interface InlineEditState {
  isEditingDimension: boolean;
  editingShapeId: string | null;
  editingDimensionType: 'width' | 'height' | 'radius' | null;
  editingValue: string;
  editingError: string | null;
}

/**
 * State for live distance display during dragging
 */
export interface LiveDistanceState {
  isShowingDistance: boolean;
  distanceFromStart: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Formatted dimension string
 */
export type FormattedDimension = string;

/**
 * Parsed polar coordinate (distance@angle format)
 */
export interface ParsedPolarCoordinate {
  distance: number;
  angle: number;
  unit: string;
  valid: boolean;
  error?: string;
}
