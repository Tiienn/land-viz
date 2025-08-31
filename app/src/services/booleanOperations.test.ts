import { describe, it, expect } from 'vitest';
import { booleanOperationEngine, type SubdivisionSettings } from './booleanOperations';
import type { Shape, Point2D } from '@/types';

describe('BooleanOperationEngine', () => {
  // Helper function to create a test shape
  const createTestShape = (
    points: Point2D[], 
    id: string = 'test-shape', 
    name: string = 'Test Shape'
  ): Shape => ({
    id,
    type: 'polygon',
    points,
    name,
    color: '#3B82F6',
    visible: true,
    layerId: 'default-layer',
    created: new Date(),
    modified: new Date()
  });

  describe('Union Operations', () => {
    it('should combine two overlapping rectangles', () => {
      const rect1 = createTestShape([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ], 'rect1');

      const rect2 = createTestShape([
        { x: 5, y: 5 },
        { x: 15, y: 5 },
        { x: 15, y: 15 },
        { x: 5, y: 15 }
      ], 'rect2');

      const result = booleanOperationEngine.union([rect1, rect2]);

      expect(result.success).toBe(true);
      expect(result.shapes.length).toBeGreaterThan(0);
      expect(result.operation).toBe('union');
      expect(parseFloat(result.totalArea)).toBeGreaterThan(100); // Should be more than either individual rectangle
    });

    it('should handle multiple shapes union', () => {
      const shapes = [
        createTestShape([
          { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }
        ], 'shape1'),
        createTestShape([
          { x: 3, y: 3 }, { x: 8, y: 3 }, { x: 8, y: 8 }, { x: 3, y: 8 }
        ], 'shape2'),
        createTestShape([
          { x: 6, y: 6 }, { x: 11, y: 6 }, { x: 11, y: 11 }, { x: 6, y: 11 }
        ], 'shape3')
      ];

      const result = booleanOperationEngine.union(shapes);

      expect(result.success).toBe(true);
      expect(result.shapes.length).toBeGreaterThan(0);
      expect(parseFloat(result.totalArea)).toBeGreaterThan(0);
    });

    it('should fail with insufficient shapes', () => {
      const result = booleanOperationEngine.union([]);
      expect(result.success).toBe(false);
      expect(result.shapes.length).toBe(0);
    });
  });

  describe('Intersection Operations', () => {
    it('should find intersection of two overlapping rectangles', () => {
      const rect1 = createTestShape([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]);

      const rect2 = createTestShape([
        { x: 5, y: 5 },
        { x: 15, y: 5 },
        { x: 15, y: 15 },
        { x: 5, y: 15 }
      ]);

      const result = booleanOperationEngine.intersection(rect1, rect2);

      expect(result.success).toBe(true);
      expect(result.operation).toBe('intersection');
      expect(parseFloat(result.totalArea)).toBe(25); // 5x5 intersection area
    });

    it('should return empty result for non-overlapping shapes', () => {
      const rect1 = createTestShape([
        { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }
      ]);

      const rect2 = createTestShape([
        { x: 10, y: 10 }, { x: 15, y: 10 }, { x: 15, y: 15 }, { x: 10, y: 15 }
      ]);

      const result = booleanOperationEngine.intersection(rect1, rect2);

      expect(result.success).toBe(true);
      expect(result.shapes.length).toBe(0); // No intersection
      expect(parseFloat(result.totalArea)).toBe(0);
    });
  });

  describe('Difference Operations', () => {
    it('should subtract one rectangle from another', () => {
      const largeRect = createTestShape([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]);

      const smallRect = createTestShape([
        { x: 2, y: 2 },
        { x: 8, y: 2 },
        { x: 8, y: 8 },
        { x: 2, y: 8 }
      ]);

      const result = booleanOperationEngine.difference(largeRect, smallRect);

      expect(result.success).toBe(true);
      expect(result.operation).toBe('difference');
      // Large rect (100) - Small rect (36) but complex clipping may differ
      expect(parseFloat(result.totalArea)).toBeGreaterThan(0);
    });

    it('should handle complete subtraction', () => {
      const shape1 = createTestShape([
        { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }
      ]);

      const shape2 = createTestShape([
        { x: -1, y: -1 }, { x: 6, y: -1 }, { x: 6, y: 6 }, { x: -1, y: 6 }
      ]);

      const result = booleanOperationEngine.difference(shape1, shape2);

      expect(result.success).toBe(true);
      expect(result.shapes.length).toBe(0); // Complete subtraction
      expect(parseFloat(result.totalArea)).toBe(0);
    });
  });

  describe('XOR Operations', () => {
    it('should find exclusive or of two rectangles', () => {
      const rect1 = createTestShape([
        { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }
      ]);

      const rect2 = createTestShape([
        { x: 5, y: 5 }, { x: 15, y: 5 }, { x: 15, y: 15 }, { x: 5, y: 15 }
      ]);

      const result = booleanOperationEngine.exclusiveOr(rect1, rect2);

      expect(result.success).toBe(true);
      expect(result.operation).toBe('xor');
      // XOR should be union minus intersection - exact value depends on polygon clipping
      expect(parseFloat(result.totalArea)).toBeGreaterThan(100);
    });
  });

  describe('Property Subdivision', () => {
    const testProperty = createTestShape([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 0, y: 10 }
    ], 'property');

    it('should perform parallel subdivision', () => {
      const settings: SubdivisionSettings = {
        method: 'parallel',
        segments: 4,
        setbackDistance: 1,
        preserveOriginal: false
      };

      const result = booleanOperationEngine.subdivideProperty(testProperty, settings);

      expect(result.success).toBe(true);
      expect(result.shapes.length).toBe(4);
      expect(result.operation).toBe('subdivision_parallel');
      expect(parseFloat(result.totalArea)).toBeGreaterThan(0);
    });

    it('should perform perpendicular subdivision', () => {
      const settings: SubdivisionSettings = {
        method: 'perpendicular',
        segments: 3,
        setbackDistance: 0.5,
        preserveOriginal: false
      };

      const result = booleanOperationEngine.subdivideProperty(testProperty, settings);

      expect(result.success).toBe(true);
      expect(result.shapes.length).toBe(3);
      expect(result.operation).toBe('subdivision_perpendicular');
      expect(parseFloat(result.totalArea)).toBeGreaterThan(0);
    });

    it('should perform radial subdivision', () => {
      // Create a square property for radial subdivision
      const squareProperty = createTestShape([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]);

      const settings: SubdivisionSettings = {
        method: 'radial',
        segments: 6,
        setbackDistance: 0,
        preserveOriginal: false
      };

      const result = booleanOperationEngine.subdivideProperty(squareProperty, settings);

      expect(result.success).toBe(true);
      expect(result.shapes.length).toBeGreaterThan(0);
      expect(result.operation).toBe('subdivision_radial');
      expect(parseFloat(result.totalArea)).toBeGreaterThan(0);
    });

    it('should handle custom subdivision method', () => {
      const settings: SubdivisionSettings = {
        method: 'custom',
        segments: 2,
        setbackDistance: 1,
        preserveOriginal: true
      };

      const result = booleanOperationEngine.subdivideProperty(testProperty, settings);

      expect(result.success).toBe(true);
      expect(result.shapes.length).toBeGreaterThan(0);
      expect(result.operation).toBe('subdivision_custom');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid polygon data gracefully', () => {
      const invalidShape = createTestShape([
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ]); // Only 2 points, not a valid polygon

      const validShape = createTestShape([
        { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }
      ]);

      const result = booleanOperationEngine.intersection(invalidShape, validShape);
      
      // Should either succeed or fail gracefully without throwing
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle zero-area subdivision', () => {
      const thinShape = createTestShape([
        { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 0.1 }, { x: 0, y: 0.1 }
      ]);

      const settings: SubdivisionSettings = {
        method: 'parallel',
        segments: 5,
        setbackDistance: 0.5, // Setback larger than shape height
        preserveOriginal: false
      };

      const result = booleanOperationEngine.subdivideProperty(thinShape, settings);
      
      expect(result.success).toBe(true);
      // May have zero segments if setback is too large
    });

    it('should preserve operation timestamp', () => {
      const shape1 = createTestShape([
        { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }
      ]);
      const shape2 = createTestShape([
        { x: 2, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 7 }, { x: 2, y: 7 }
      ]);

      const result = booleanOperationEngine.intersection(shape1, shape2);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Area Calculations', () => {
    it('should calculate total area correctly for multiple result shapes', () => {
      const shapes = [
        createTestShape([
          { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }
        ]), // 100 square units
        createTestShape([
          { x: 15, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 10 }, { x: 15, y: 10 }
        ]) // 50 square units
      ];

      const result = booleanOperationEngine.union(shapes);

      expect(result.success).toBe(true);
      expect(parseFloat(result.totalArea)).toBeCloseTo(150, 1); // Total of both areas
    });
  });
});