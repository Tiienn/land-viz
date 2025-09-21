import { describe, test, expect } from 'vitest';
import { MeasurementUtils, MEASUREMENT_CONSTANTS } from '../measurementUtils';
import type { Point2D } from '@/types';

describe('MeasurementUtils', () => {
  describe('calculateDistance', () => {
    test('calculates distance correctly for simple coordinates', () => {
      const p1: Point2D = { x: 0, y: 0 };
      const p2: Point2D = { x: 3, y: 4 };

      expect(MeasurementUtils.calculateDistance(p1, p2)).toBe(5);
    });

    test('calculates distance correctly for negative coordinates', () => {
      const p1: Point2D = { x: -1, y: -1 };
      const p2: Point2D = { x: 2, y: 3 };

      expect(MeasurementUtils.calculateDistance(p1, p2)).toBe(5);
    });

    test('returns 0 for same points', () => {
      const p1: Point2D = { x: 5, y: 10 };
      const p2: Point2D = { x: 5, y: 10 };

      expect(MeasurementUtils.calculateDistance(p1, p2)).toBe(0);
    });
  });

  describe('convertDistance', () => {
    test('converts meters to feet correctly', () => {
      const meters = 10;
      const feet = MeasurementUtils.convertDistance(meters, 'metric', 'imperial');

      expect(feet).toBeCloseTo(32.8084, 4);
    });

    test('converts feet to meters correctly', () => {
      const feet = 10;
      const meters = MeasurementUtils.convertDistance(feet, 'imperial', 'metric');

      expect(meters).toBeCloseTo(3.048, 3);
    });

    test('returns same value for same units', () => {
      const distance = 15.5;

      expect(MeasurementUtils.convertDistance(distance, 'metric', 'metric')).toBe(distance);
      expect(MeasurementUtils.convertDistance(distance, 'imperial', 'imperial')).toBe(distance);
    });
  });

  describe('formatDistance', () => {
    test('formats metric distances correctly', () => {
      const distance = 15.12345;
      const formatted = MeasurementUtils.formatDistance(distance, 'metric');

      expect(formatted).toBe('15.12 m');
    });

    test('formats imperial distances correctly', () => {
      const distance = 15.12345;
      const formatted = MeasurementUtils.formatDistance(distance, 'imperial');

      expect(formatted).toBe('15.123 ft');
    });
  });

  describe('validateMeasurementPoints', () => {
    test('validates different points as valid', () => {
      const p1: Point2D = { x: 0, y: 0 };
      const p2: Point2D = { x: 1, y: 1 };

      const result = MeasurementUtils.validateMeasurementPoints(p1, p2);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('invalidates same points', () => {
      const p1: Point2D = { x: 0, y: 0 };
      const p2: Point2D = { x: 0, y: 0 };

      const result = MeasurementUtils.validateMeasurementPoints(p1, p2);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Start and end points must be different');
    });

    test('invalidates points outside bounds', () => {
      const p1: Point2D = { x: 0, y: 0 };
      const p2: Point2D = { x: 20000, y: 0 }; // Outside 10000 bound

      const result = MeasurementUtils.validateMeasurementPoints(p1, p2);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Measurement points are outside reasonable bounds');
    });

    test('invalidates points with invalid coordinates', () => {
      const p1: Point2D = { x: NaN, y: 0 };
      const p2: Point2D = { x: 1, y: 1 };

      const result = MeasurementUtils.validateMeasurementPoints(p1, p2);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Measurement points contain invalid coordinates');
    });
  });

  describe('createMeasurementPoint', () => {
    test('creates measurement point with required properties', () => {
      const position: Point2D = { x: 10, y: 20 };
      const point = MeasurementUtils.createMeasurementPoint(position);

      expect(point.id).toBeDefined();
      expect(point.position).toEqual(position);
      expect(point.timestamp).toBeInstanceOf(Date);
      expect(point.snapPoint).toBeUndefined();
    });
  });

  describe('createMeasurement', () => {
    test('creates measurement with correct properties', () => {
      const startPoint = MeasurementUtils.createMeasurementPoint({ x: 0, y: 0 });
      const endPoint = MeasurementUtils.createMeasurementPoint({ x: 3, y: 4 });

      const measurement = MeasurementUtils.createMeasurement(startPoint, endPoint, 'metric');

      expect(measurement.id).toBeDefined();
      expect(measurement.startPoint).toBe(startPoint);
      expect(measurement.endPoint).toBe(endPoint);
      expect(measurement.distance).toBe(5);
      expect(measurement.unit).toBe('metric');
      expect(measurement.visible).toBe(true);
      expect(measurement.created).toBeInstanceOf(Date);
    });
  });

  describe('getMeasurementMidpoint', () => {
    test('calculates midpoint correctly', () => {
      const startPoint = MeasurementUtils.createMeasurementPoint({ x: 0, y: 0 });
      const endPoint = MeasurementUtils.createMeasurementPoint({ x: 10, y: 20 });
      const measurement = MeasurementUtils.createMeasurement(startPoint, endPoint);

      const midpoint = MeasurementUtils.getMeasurementMidpoint(measurement);

      expect(midpoint).toEqual({ x: 5, y: 10 });
    });
  });

  describe('getMeasurementAngle', () => {
    test('calculates angle correctly for horizontal line', () => {
      const startPoint = MeasurementUtils.createMeasurementPoint({ x: 0, y: 0 });
      const endPoint = MeasurementUtils.createMeasurementPoint({ x: 10, y: 0 });
      const measurement = MeasurementUtils.createMeasurement(startPoint, endPoint);

      const angle = MeasurementUtils.getMeasurementAngle(measurement);

      expect(angle).toBe(0);
    });

    test('calculates angle correctly for vertical line', () => {
      const startPoint = MeasurementUtils.createMeasurementPoint({ x: 0, y: 0 });
      const endPoint = MeasurementUtils.createMeasurementPoint({ x: 0, y: 10 });
      const measurement = MeasurementUtils.createMeasurement(startPoint, endPoint);

      const angle = MeasurementUtils.getMeasurementAngle(measurement);

      expect(angle).toBe(90);
    });
  });

  describe('getTotalLength', () => {
    test('calculates total length for multiple measurements', () => {
      const measurements = [
        MeasurementUtils.createMeasurement(
          MeasurementUtils.createMeasurementPoint({ x: 0, y: 0 }),
          MeasurementUtils.createMeasurementPoint({ x: 3, y: 4 }),
          'metric'
        ),
        MeasurementUtils.createMeasurement(
          MeasurementUtils.createMeasurementPoint({ x: 0, y: 0 }),
          MeasurementUtils.createMeasurementPoint({ x: 6, y: 8 }),
          'metric'
        )
      ];

      const total = MeasurementUtils.getTotalLength(measurements, 'metric');

      expect(total).toBe(15); // 5 + 10
    });
  });
});

describe('MEASUREMENT_CONSTANTS', () => {
  test('has correct default values', () => {
    expect(MEASUREMENT_CONSTANTS.DEFAULT_UNIT).toBe('metric');
    expect(MEASUREMENT_CONSTANTS.MAX_MEASUREMENTS).toBe(100);
    expect(MEASUREMENT_CONSTANTS.MIN_MEASUREMENT_DISTANCE).toBe(0.001);
    expect(MEASUREMENT_CONSTANTS.METERS_TO_FEET).toBeCloseTo(3.28084);
    expect(MEASUREMENT_CONSTANTS.FEET_TO_METERS).toBeCloseTo(0.3048);
  });
});