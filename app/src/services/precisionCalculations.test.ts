import { describe, it, expect } from 'vitest';
import { precisionCalculator } from './precisionCalculations';
import type { Shape, Point2D } from '@/types';

describe('PrecisionCalculationEngine', () => {
  describe('Basic Calculations', () => {
    it('should calculate square area correctly', () => {
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const area = precisionCalculator.calculatePolygonArea(points);
      expect(area).toBe('100.00');
    });

    it('should calculate rectangle area correctly', () => {
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 20, y: 10 }
      ];

      const area = precisionCalculator.calculateRectangleArea(points);
      expect(area).toBe('200.00');
    });

    it('should calculate distance between two points', () => {
      const p1: Point2D = { x: 0, y: 0 };
      const p2: Point2D = { x: 3, y: 4 };

      const distance = precisionCalculator.calculateDistance(p1, p2);
      expect(distance).toBe('5.00');
    });

    it('should calculate triangle perimeter correctly', () => {
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: 4 }
      ];

      const perimeter = precisionCalculator.calculatePolygonPerimeter(points);
      // 3 + 4 + 5 = 12
      expect(parseFloat(perimeter)).toBeCloseTo(12, 2);
    });
  });

  describe('Shape Measurements', () => {
    it('should calculate comprehensive polygon measurements', () => {
      const shape: Shape = {
        id: 'test-1',
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ],
        name: 'Test Square',
        color: '#3B82F6',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };

      const measurements = precisionCalculator.calculateShapeMeasurements(shape);

      expect(parseFloat(measurements.area.squareMeters)).toBe(100);
      expect(parseFloat(measurements.area.squareFeet)).toBeCloseTo(1076.39, 1);
      expect(parseFloat(measurements.area.acres)).toBeCloseTo(0.0247, 3);
      expect(parseFloat(measurements.perimeter.meters)).toBe(40);
      expect(measurements.centroid.x).toBeCloseTo(5, 1);
      expect(measurements.centroid.y).toBeCloseTo(5, 1);
    });

    it('should handle rectangle shape', () => {
      const shape: Shape = {
        id: 'test-2',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 15, y: 8 }
        ],
        name: 'Test Rectangle',
        color: '#3B82F6',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };

      const measurements = precisionCalculator.calculateShapeMeasurements(shape);
      expect(parseFloat(measurements.area.squareMeters)).toBe(120); // 15 * 8
      expect(parseFloat(measurements.perimeter.meters)).toBe(46); // 2 * (15 + 8)
    });

    it('should handle circle shape', () => {
      const shape: Shape = {
        id: 'test-3',
        type: 'circle',
        points: [
          { x: 0, y: 0 }, // center
          { x: 5, y: 0 }  // point on circumference (radius = 5)
        ],
        name: 'Test Circle',
        color: '#3B82F6',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };

      const measurements = precisionCalculator.calculateShapeMeasurements(shape);
      const expectedArea = Math.PI * 25; // π * r²
      const expectedPerimeter = 2 * Math.PI * 5; // 2 * π * r

      expect(parseFloat(measurements.area.squareMeters)).toBeCloseTo(expectedArea, 1);
      expect(parseFloat(measurements.perimeter.meters)).toBeCloseTo(expectedPerimeter, 1);
    });

    it('should return empty measurements for invalid shapes', () => {
      const shape: Shape = {
        id: 'test-4',
        type: 'polygon',
        points: [],
        name: 'Empty Shape',
        color: '#3B82F6',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };

      const measurements = precisionCalculator.calculateShapeMeasurements(shape);
      expect(measurements.area.squareMeters).toBe('0');
      expect(measurements.perimeter.meters).toBe('0');
    });
  });

  describe('High Precision Tests', () => {
    it('should maintain precision for very small areas', () => {
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 0.001, y: 0 },
        { x: 0.001, y: 0.001 },
        { x: 0, y: 0.001 }
      ];

      const area = precisionCalculator.calculatePolygonArea(points);
      expect(area).toBe('0.000001');
    });

    it('should maintain precision for large areas', () => {
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 1000000, y: 0 },
        { x: 1000000, y: 1000000 },
        { x: 0, y: 1000000 }
      ];

      const area = precisionCalculator.calculatePolygonArea(points);
      expect(area).toBe('1000000000000.00');
    });

    it('should validate accuracy claims', () => {
      const validation = precisionCalculator.validateAccuracy();
      expect(validation.accuracy).toBe('±0.01%');
      expect(validation.method).toContain('Decimal.js');
      expect(validation.method).toContain('28 decimal precision');
    });
  });

  describe('Unit Conversions', () => {
    it('should convert square meters to all units correctly', () => {
      const shape: Shape = {
        id: 'conversion-test',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 100 } // 10,000 m²
        ],
        name: 'Conversion Test',
        color: '#3B82F6',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };

      const measurements = precisionCalculator.calculateShapeMeasurements(shape);

      expect(parseFloat(measurements.area.squareMeters)).toBe(10000);
      expect(parseFloat(measurements.area.squareFeet)).toBeCloseTo(107639, 0);
      expect(parseFloat(measurements.area.acres)).toBeCloseTo(2.471, 3);
      expect(parseFloat(measurements.area.hectares)).toBe(1);
    });

    it('should convert meters to feet correctly', () => {
      const shape: Shape = {
        id: 'perimeter-test',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 } // Perimeter: 40m
        ],
        name: 'Perimeter Test',
        color: '#3B82F6',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };

      const measurements = precisionCalculator.calculateShapeMeasurements(shape);

      expect(parseFloat(measurements.perimeter.meters)).toBe(40);
      expect(parseFloat(measurements.perimeter.feet)).toBeCloseTo(131.23, 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle shapes with collinear points', () => {
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 }
      ];

      const area = precisionCalculator.calculatePolygonArea(points);
      expect(parseFloat(area)).toBe(0); // Collinear points have zero area
    });

    it('should handle single point', () => {
      const points: Point2D[] = [{ x: 5, y: 5 }];

      const area = precisionCalculator.calculatePolygonArea(points);
      const perimeter = precisionCalculator.calculatePolygonPerimeter(points);

      expect(area).toBe('0');
      expect(perimeter).toBe('0');
    });

    it('should handle duplicate points', () => {
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const area = precisionCalculator.calculatePolygonArea(points);
      expect(parseFloat(area)).toBe(100);
    });
  });
});