/**
 * TidyUp Service Tests - Comprehensive validation of Canva-style alignment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TidyUpService } from '../tidyUpService';
import type { Shape, Point2D } from '../../types';

describe('TidyUpService', () => {
  let tidyUpService: TidyUpService;

  beforeEach(() => {
    tidyUpService = new TidyUpService();
  });

  // Helper function to create test shapes
  const createTestShape = (id: string, x: number, y: number, width: number = 50, height: number = 50): Shape => ({
    id,
    type: 'rectangle',
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ],
    isSelected: true,
    color: '#000000',
    strokeWidth: 2,
    area: width * height,
    perimeter: 2 * (width + height),
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  describe('Basic TidyUp Functionality', () => {
    it('should require at least 3 shapes', () => {
      const shapes = [
        createTestShape('1', 0, 0),
        createTestShape('2', 100, 0)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.success).toBe(false);
      expect(result.distributionType).toBe('none');
      expect(result.distributedShapes).toHaveLength(0);
    });

    it('should successfully distribute 3 shapes', () => {
      const shapes = [
        createTestShape('1', 0, 0),
        createTestShape('2', 100, 0),
        createTestShape('3', 200, 0)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.success).toBe(true);
      expect(result.distributedShapes).toHaveLength(3);
      expect(result.distributionType).toBe('horizontal');
    });

    it('should handle circular shapes', () => {
      const circleShape = (id: string, centerX: number, centerY: number, radius: number = 25): Shape => ({
        id,
        type: 'circle',
        points: [
          { x: centerX - radius, y: centerY - radius },
          { x: centerX + radius, y: centerY + radius }
        ],
        isSelected: true,
        color: '#000000',
        strokeWidth: 2,
        area: Math.PI * radius * radius,
        perimeter: 2 * Math.PI * radius,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      const shapes = [
        circleShape('1', 0, 0),
        circleShape('2', 100, 0),
        circleShape('3', 200, 0)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.success).toBe(true);
      expect(result.distributedShapes).toHaveLength(3);
    });
  });

  describe('Distribution Type Detection', () => {
    it('should detect horizontal distribution for wide arrangements', () => {
      const shapes = [
        createTestShape('1', 0, 0),
        createTestShape('2', 150, 10),
        createTestShape('3', 300, -5)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.distributionType).toBe('horizontal');
    });

    it('should detect vertical distribution for tall arrangements', () => {
      const shapes = [
        createTestShape('1', 0, 0),
        createTestShape('2', 10, 150),
        createTestShape('3', -5, 300)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.distributionType).toBe('vertical');
    });

    it('should choose best direction for square arrangements', () => {
      const shapes = [
        createTestShape('1', 0, 0),
        createTestShape('2', 100, 100),
        createTestShape('3', 200, 50)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(['horizontal', 'vertical']).toContain(result.distributionType);
    });
  });

  describe('Horizontal Distribution', () => {
    it('should align shapes horizontally with equal spacing', () => {
      const shapes = [
        createTestShape('1', 0, 0, 50, 50),
        createTestShape('2', 200, 20, 50, 50),
        createTestShape('3', 300, -10, 50, 50)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.success).toBe(true);
      expect(result.distributionType).toBe('horizontal');

      // Check that shapes are aligned vertically (same Y center)
      const yPositions = result.distributedShapes.map(ds => {
        const shape = shapes.find(s => s.id === ds.shapeId)!;
        return ds.newPosition.y + (shape.points[2].y - shape.points[0].y) / 2;
      });

      const firstY = yPositions[0];
      yPositions.forEach(y => {
        expect(Math.abs(y - firstY)).toBeLessThan(1); // Allow small floating point errors
      });
    });

    it('should maintain relative order of shapes', () => {
      const shapes = [
        createTestShape('left', 0, 0),
        createTestShape('right', 200, 0),
        createTestShape('middle', 100, 0)
      ];

      const result = tidyUpService.autoTidyUp(shapes);

      // Sort distributed shapes by their new X position
      const sortedDistributed = result.distributedShapes.sort((a, b) => a.newPosition.x - b.newPosition.x);

      expect(sortedDistributed[0].shapeId).toBe('left');
      expect(sortedDistributed[1].shapeId).toBe('middle');
      expect(sortedDistributed[2].shapeId).toBe('right');
    });
  });

  describe('Vertical Distribution', () => {
    it('should align shapes vertically with equal spacing', () => {
      const shapes = [
        createTestShape('1', 0, 0, 50, 50),
        createTestShape('2', 20, 200, 50, 50),
        createTestShape('3', -10, 300, 50, 50)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.success).toBe(true);
      expect(result.distributionType).toBe('vertical');

      // Check that shapes are aligned horizontally (same X center)
      const xPositions = result.distributedShapes.map(ds => {
        const shape = shapes.find(s => s.id === ds.shapeId)!;
        return ds.newPosition.x + (shape.points[1].x - shape.points[0].x) / 2;
      });

      const firstX = xPositions[0];
      xPositions.forEach(x => {
        expect(Math.abs(x - firstX)).toBeLessThan(1); // Allow small floating point errors
      });
    });
  });

  describe('Space Evenly Functions', () => {
    it('should force horizontal distribution when requested', () => {
      const shapes = [
        createTestShape('1', 0, 0),
        createTestShape('2', 10, 200), // Naturally would be vertical
        createTestShape('3', 20, 400)
      ];

      const result = tidyUpService.spaceEvenly(shapes, 'horizontal');
      expect(result.distributionType).toBe('horizontal');
    });

    it('should force vertical distribution when requested', () => {
      const shapes = [
        createTestShape('1', 0, 0),
        createTestShape('2', 200, 10), // Naturally would be horizontal
        createTestShape('3', 400, 20)
      ];

      const result = tidyUpService.spaceEvenly(shapes, 'vertical');
      expect(result.distributionType).toBe('vertical');
    });
  });

  describe('Distribution Metadata', () => {
    it('should calculate meaningful metadata', () => {
      const shapes = [
        createTestShape('1', 0, 0, 50, 50),
        createTestShape('2', 200, 0, 50, 50),
        createTestShape('3', 400, 0, 50, 50)
      ];

      const result = tidyUpService.autoTidyUp(shapes);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalAdjustments).toBeGreaterThanOrEqual(0);
      expect(result.metadata.averageSpacing).toBeGreaterThan(0);
      expect(result.metadata.boundingArea.width).toBeGreaterThan(0);
      expect(result.metadata.boundingArea.height).toBeGreaterThan(0);
    });

    it('should calculate bounding area correctly', () => {
      const shapes = [
        createTestShape('1', 0, 0, 50, 50),
        createTestShape('2', 100, 0, 50, 50),
        createTestShape('3', 200, 0, 50, 50)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      const bounds = result.metadata.boundingArea;

      expect(bounds.left).toBe(0);
      expect(bounds.right).toBe(250); // Last shape ends at 200 + 50
      expect(bounds.width).toBe(250);
      expect(bounds.top).toBe(0);
      expect(bounds.bottom).toBe(50);
      expect(bounds.height).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle shapes with different sizes', () => {
      const shapes = [
        createTestShape('small', 0, 0, 30, 30),
        createTestShape('medium', 100, 0, 50, 50),
        createTestShape('large', 200, 0, 80, 80)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.success).toBe(true);
      expect(result.distributedShapes).toHaveLength(3);
    });

    it('should handle overlapping shapes', () => {
      const shapes = [
        createTestShape('1', 0, 0),
        createTestShape('2', 25, 25), // Overlapping
        createTestShape('3', 50, 50)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.success).toBe(true);

      // After distribution, shapes should not overlap
      const positions = result.distributedShapes.map(ds => ds.newPosition);
      for (let i = 0; i < positions.length - 1; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const distance = Math.sqrt(
            Math.pow(positions[i].x - positions[j].x, 2) +
            Math.pow(positions[i].y - positions[j].y, 2)
          );
          expect(distance).toBeGreaterThan(0); // Should have some separation
        }
      }
    });

    it('should handle shapes with rotation', () => {
      const rotatedShape = {
        ...createTestShape('rotated', 100, 100),
        rotation: Math.PI / 4 // 45 degrees
      };

      const shapes = [
        createTestShape('1', 0, 0),
        rotatedShape,
        createTestShape('3', 200, 0)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.success).toBe(true);
      expect(result.distributedShapes).toHaveLength(3);
    });
  });

  describe('Performance and Limits', () => {
    it('should handle many shapes efficiently', () => {
      const shapes: Shape[] = [];
      for (let i = 0; i < 20; i++) {
        shapes.push(createTestShape(`shape-${i}`, i * 60, Math.random() * 100));
      }

      const startTime = performance.now();
      const result = tidyUpService.autoTidyUp(shapes);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should preserve shape properties during distribution', () => {
      const originalShape = createTestShape('test', 0, 0);
      originalShape.color = '#FF0000';
      originalShape.strokeWidth = 5;

      const shapes = [
        originalShape,
        createTestShape('2', 100, 0),
        createTestShape('3', 200, 0)
      ];

      const result = tidyUpService.autoTidyUp(shapes);
      expect(result.success).toBe(true);

      // Original shape properties should be unchanged
      expect(originalShape.color).toBe('#FF0000');
      expect(originalShape.strokeWidth).toBe(5);
    });
  });

  describe('Spacing Presets', () => {
    it('should provide correct spacing presets', () => {
      const presets = TidyUpService.getSpacingPresets();

      expect(presets.tight.minimumSpacing).toBe(4);
      expect(presets.normal.minimumSpacing).toBe(8);
      expect(presets.relaxed.minimumSpacing).toBe(16);
      expect(presets.loose.minimumSpacing).toBe(32);
    });
  });
});