/**
 * Type definitions for unit conversion system
 */

/**
 * Supported area units for conversion
 */
export type AreaUnit = 'sqm' | 'sqft' | 'acres' | 'hectares' | 'sqkm' | 'sqmi' | 'toise' | 'perches' | 'perches-mauritius' | 'arpent-na' | 'arpent-paris' | 'arpent-mauritius';

/**
 * Display configuration for each unit
 */
export interface UnitConfig {
  /** Display name for the unit */
  name: string;
  /** Short symbol for the unit */
  symbol: string;
  /** Number of decimal places to show */
  precision: number;
  /** Whether to use scientific notation for very large numbers */
  useScientific?: boolean;
  /** Threshold for switching to scientific notation */
  scientificThreshold?: number;
}

/**
 * Result of input validation
 */
export interface ValidationResult {
  /** Whether the input is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Parsed numeric value if valid */
  value?: number;
}

/**
 * Conversion calculation result
 */
export interface ConversionResult {
  /** The converted value */
  value: number;
  /** The target unit */
  unit: AreaUnit;
  /** Formatted display string */
  formatted: string;
  /** Whether the value is approximate due to rounding */
  isApproximate: boolean;
}

/**
 * Configuration for conversion panel state
 */
export interface ConversionState {
  /** Whether the convert panel is expanded */
  convertPanelExpanded: boolean;
  /** Current input value as string */
  currentInputValue: string;
  /** Current input unit */
  currentInputUnit: AreaUnit;
  /** Last valid numeric value */
  lastValidValue: number | null;
  /** Error message for current input */
  inputError: string | null;
}

/**
 * Actions for managing conversion state
 */
export interface ConversionActions {
  /** Toggle convert panel expanded state */
  toggleConvertPanel: () => void;
  /** Set input value */
  setInputValue: (value: string) => void;
  /** Set input unit */
  setInputUnit: (unit: AreaUnit) => void;
  /** Clear conversion */
  clearConversion: () => void;
  /** Set input error */
  setInputError: (error: string | null) => void;
}

/**
 * Combined conversion state and actions
 */
export type ConversionStore = ConversionState & ConversionActions;