import type { Point2D, Measurement, MeasurementPoint } from '@/types';

/**
 * Utility class for measurement calculations and operations
 */
export class MeasurementUtils {
  /**
   * Calculate Euclidean distance between two 2D points
   * @param p1 First point
   * @param p2 Second point
   * @returns Distance in the same units as the input coordinates
   */
  static calculateDistance(p1: Point2D, p2: Point2D): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Convert measurement distance between metric, imperial, and historical units
   * @param distance Distance value to convert
   * @param fromUnit Source unit system
   * @param toUnit Target unit system
   * @returns Converted distance value
   */
  static convertDistance(
    distance: number,
    fromUnit: 'metric' | 'imperial' | 'toise',
    toUnit: 'metric' | 'imperial' | 'toise'
  ): number {
    if (fromUnit === toUnit) return distance;

    // Convert to meters first (base unit)
    let meters = distance;
    if (fromUnit === 'imperial') {
      meters = distance * 0.3048; // feet to meters
    } else if (fromUnit === 'toise') {
      meters = distance * 1.949036; // toise to meters (exact historical conversion)
    }
    // fromUnit === 'metric' already in meters

    // Convert from meters to target unit
    if (toUnit === 'metric') {
      return meters;
    } else if (toUnit === 'imperial') {
      return meters * 3.28084; // meters to feet
    } else if (toUnit === 'toise') {
      return meters / 1.949036; // meters to toise
    }

    return meters; // fallback
  }

  /**
   * Format distance for display with appropriate precision
   * @param distance Distance value
   * @param unit Unit system for formatting
   * @returns Formatted string with appropriate precision and unit label
   */
  static formatDistance(distance: number, unit: 'metric' | 'imperial' | 'toise'): string {
    let precision: number;
    let unitLabel: string;

    switch (unit) {
      case 'metric':
        precision = 2;
        unitLabel = 'm';
        break;
      case 'imperial':
        precision = 3;
        unitLabel = 'ft';
        break;
      case 'toise':
        precision = 4; // Higher precision for historical unit
        unitLabel = 'T'; // Traditional symbol for toise
        break;
      default:
        precision = 2;
        unitLabel = 'm';
    }

    return `${distance.toFixed(precision)} ${unitLabel}`;
  }

  /**
   * Validate measurement points for creating a measurement
   * @param startPoint Starting point of the measurement
   * @param endPoint Ending point of the measurement
   * @returns Validation result with success status and optional error message
   */
  static validateMeasurementPoints(startPoint: Point2D, endPoint: Point2D): {
    isValid: boolean;
    error?: string;
  } {
    // Check for same point (within tolerance)
    const minDistance = 0.001; // minimum distance in coordinate units
    if (Math.abs(startPoint.x - endPoint.x) < minDistance &&
        Math.abs(startPoint.y - endPoint.y) < minDistance) {
      return {
        isValid: false,
        error: 'Start and end points must be different'
      };
    }

    // Check for reasonable coordinate bounds (within ±10000 units)
    const bounds = 10000;
    const points = [startPoint, endPoint];

    for (const point of points) {
      if (Math.abs(point.x) > bounds || Math.abs(point.y) > bounds) {
        return {
          isValid: false,
          error: 'Measurement points are outside reasonable bounds'
        };
      }
    }

    // Check for valid numbers
    for (const point of points) {
      if (!isFinite(point.x) || !isFinite(point.y) ||
          isNaN(point.x) || isNaN(point.y)) {
        return {
          isValid: false,
          error: 'Measurement points contain invalid coordinates'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Create a complete measurement object from two measurement points
   * @param startPoint Starting measurement point
   * @param endPoint Ending measurement point
   * @param unit Unit system for the measurement
   * @returns Complete measurement object
   */
  static createMeasurement(
    startPoint: MeasurementPoint,
    endPoint: MeasurementPoint,
    unit: 'metric' | 'imperial' | 'toise' = 'metric'
  ): Measurement {
    const distance = this.calculateDistance(startPoint.position, endPoint.position);

    return {
      id: `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startPoint,
      endPoint,
      distance,
      unit,
      created: new Date(),
      visible: true
    };
  }

  /**
   * Create a measurement point object
   * @param position 2D position of the point
   * @param snapPoint Optional associated snap point
   * @returns Measurement point object
   */
  static createMeasurementPoint(
    position: Point2D,
    snapPoint?: import('@/types').SnapPoint
  ): MeasurementPoint {
    return {
      id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position,
      snapPoint,
      timestamp: new Date()
    };
  }

  /**
   * Export measurements to CSV format
   * @param measurements Array of measurements to export
   * @returns CSV string with measurement data
   */
  static exportToCSV(measurements: Measurement[]): string {
    const headers = [
      'ID',
      'Start X',
      'Start Y',
      'End X',
      'End Y',
      'Distance',
      'Unit',
      'Created'
    ];

    const rows = measurements.map(m => [
      m.id,
      m.startPoint.position.x.toFixed(6),
      m.startPoint.position.y.toFixed(6),
      m.endPoint.position.x.toFixed(6),
      m.endPoint.position.y.toFixed(6),
      m.distance.toFixed(3),
      m.unit,
      m.created.toISOString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Calculate measurement bounds for viewport fitting
   * @param measurements Array of measurements
   * @returns Bounding box coordinates or null if no measurements
   */
  static calculateMeasurementBounds(measurements: Measurement[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null {
    if (measurements.length === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    measurements.forEach(m => {
      const points = [m.startPoint.position, m.endPoint.position];
      points.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    });

    return { minX, maxX, minY, maxY };
  }

  /**
   * Find measurement by ID
   * @param measurements Array of measurements to search
   * @param id Measurement ID to find
   * @returns Found measurement or undefined
   */
  static findMeasurementById(measurements: Measurement[], id: string): Measurement | undefined {
    return measurements.find(m => m.id === id);
  }

  /**
   * Get total length of all measurements
   * @param measurements Array of measurements
   * @param unit Unit system for the result
   * @returns Total length in specified units
   */
  static getTotalLength(measurements: Measurement[], unit: 'metric' | 'imperial' | 'toise' = 'metric'): number {
    return measurements.reduce((total, measurement) => {
      const distance = measurement.unit === unit
        ? measurement.distance
        : this.convertDistance(measurement.distance, measurement.unit, unit);
      return total + distance;
    }, 0);
  }

  /**
   * Check if a point is within a measurement line's proximity
   * @param point Point to check
   * @param measurement Measurement to check against
   * @param tolerance Proximity tolerance in coordinate units
   * @returns True if point is near the measurement line
   */
  static isPointNearMeasurement(point: Point2D, measurement: Measurement, tolerance: number = 0.5): boolean {
    const start = measurement.startPoint.position;
    const end = measurement.endPoint.position;

    // Calculate distance from point to line segment
    const lineLength = this.calculateDistance(start, end);
    if (lineLength === 0) return false;

    const distanceToLine = Math.abs(
      ((end.y - start.y) * point.x - (end.x - start.x) * point.y + end.x * start.y - end.y * start.x) / lineLength
    );

    return distanceToLine <= tolerance;
  }

  /**
   * Get the midpoint of a measurement
   * @param measurement Measurement to get midpoint from
   * @returns Midpoint coordinates
   */
  static getMeasurementMidpoint(measurement: Measurement): Point2D {
    const start = measurement.startPoint.position;
    const end = measurement.endPoint.position;

    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
  }

  /**
   * Calculate angle of measurement line relative to horizontal
   * @param measurement Measurement to calculate angle for
   * @returns Angle in degrees (0-360)
   */
  static getMeasurementAngle(measurement: Measurement): number {
    const start = measurement.startPoint.position;
    const end = measurement.endPoint.position;

    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);
    return angle < 0 ? angle + 360 : angle;
  }
}

/**
 * Default measurement settings and constants
 */
export const MEASUREMENT_CONSTANTS = {
  /** Default unit for new measurements */
  DEFAULT_UNIT: 'metric' as const,

  /** Maximum number of measurements to keep in memory */
  MAX_MEASUREMENTS: 100,

  /** Minimum distance between measurement points (coordinate units) */
  MIN_MEASUREMENT_DISTANCE: 0.001,

  /** Default coordinate bounds for validation */
  MAX_COORDINATE_BOUNDS: 10000,

  /** Default precision for metric measurements */
  METRIC_PRECISION: 2,

  /** Default precision for imperial measurements */
  IMPERIAL_PRECISION: 3,

  /** Conversion factor from meters to feet */
  METERS_TO_FEET: 3.28084,

  /** Conversion factor from feet to meters */
  FEET_TO_METERS: 0.3048,

  /** Conversion factor from toise to meters (exact historical value) */
  TOISE_TO_METERS: 1.949036,

  /** Conversion factor from meters to toise */
  METERS_TO_TOISE: 1 / 1.949036
} as const;