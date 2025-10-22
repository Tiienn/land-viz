/**
 * GroupBoundary - Logic Test
 * Verifies the boundary calculation logic for rotated groups
 * Tests the actual math without rendering to DOM
 */

import { describe, it, expect } from 'vitest';
import type { ShapeElement } from '../../../types';

describe('GroupBoundary - Boundary Calculation Logic', () => {
  /**
   * Simulates the bounds calculation from GroupBoundary.tsx (lines 262-380)
   */
  function calculateGroupBounds(elements: ShapeElement[]) {
    // Detect if all shapes have the same rotation
    let groupRotation: number | null = null;

    if (elements.length > 0) {
      const firstShape = elements[0];
      if (firstShape.rotation) {
        const firstAngle = firstShape.rotation.angle;
        const allSameRotation = elements.every(shape =>
          shape.rotation && Math.abs(shape.rotation.angle - firstAngle) < 0.1
        );
        if (allSameRotation) {
          groupRotation = firstAngle;
        }
      }
    }

    const shouldUnrotate = groupRotation !== null && groupRotation !== 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let rotationCenter: { x: number; y: number } | null = null;

    if (shouldUnrotate) {
      // Transform all points to world space (apply individual shape rotations)
      const transformedPointsPerShape = elements.map(element => {
        if (!element.rotation || element.rotation.angle === 0) {
          return element.points;
        }

        const shapeAngle = element.rotation.angle;
        const shapeCenter = element.rotation.center;
        const angleRad = (shapeAngle * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        return element.points.map(point => {
          const dx = point.x - shapeCenter.x;
          const dy = point.y - shapeCenter.y;
          return {
            x: shapeCenter.x + (dx * cos - dy * sin),
            y: shapeCenter.y + (dx * sin + dy * cos)
          };
        });
      });

      // Calculate centroid from transformed points
      let sumX = 0, sumY = 0, count = 0;
      transformedPointsPerShape.forEach(points => {
        points.forEach(point => {
          sumX += point.x;
          sumY += point.y;
          count++;
        });
      });
      rotationCenter = { x: sumX / count, y: sumY / count };

      // Un-rotate transformed points around centroid to get tight local bounds
      const angleRadians = (-groupRotation * Math.PI) / 180;
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);

      transformedPointsPerShape.forEach(points => {
        points.forEach(point => {
          const dx = point.x - rotationCenter!.x;
          const dy = point.y - rotationCenter!.y;
          const unrotatedX = rotationCenter!.x + (dx * cos - dy * sin);
          const unrotatedY = rotationCenter!.y + (dx * sin + dy * cos);

          minX = Math.min(minX, unrotatedX);
          minY = Math.min(minY, unrotatedY);
          maxX = Math.max(maxX, unrotatedX);
          maxY = Math.max(maxY, unrotatedY);
        });
      });
    } else {
      // No rotation: use normal axis-aligned bounds
      elements.forEach(element => {
        element.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });
    }

    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      return null;
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      groupRotation,
      rotationCenter
    };
  }

  it('should calculate rotation center for rotated group', () => {
    const rotatedRects: ShapeElement[] = [
      {
        id: 'rect1',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ],
        color: '#FF0000',
        layerId: 'layer1',
        rotation: {
          angle: 45,
          center: { x: 10, y: 10 }
        }
      },
      {
        id: 'rect2',
        type: 'rectangle',
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 }
        ],
        color: '#00FF00',
        layerId: 'layer1',
        rotation: {
          angle: 45,
          center: { x: 10, y: 10 }
        }
      }
    ];

    const bounds = calculateGroupBounds(rotatedRects);

    expect(bounds).not.toBeNull();
    expect(bounds?.groupRotation).toBe(45);
    expect(bounds?.rotationCenter).toBeDefined();
    expect(bounds?.rotationCenter).not.toBeNull();
  });

  it('should have valid rotation center coordinates', () => {
    const rotatedRects: ShapeElement[] = [
      {
        id: 'rect1',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ],
        color: '#FF0000',
        layerId: 'layer1',
        rotation: {
          angle: 30,
          center: { x: 5, y: 5 }
        }
      },
      {
        id: 'rect2',
        type: 'rectangle',
        points: [
          { x: 20, y: 20 },
          { x: 30, y: 30 }
        ],
        color: '#00FF00',
        layerId: 'layer1',
        rotation: {
          angle: 30,
          center: { x: 25, y: 25 }
        }
      }
    ];

    const bounds = calculateGroupBounds(rotatedRects);

    expect(bounds?.rotationCenter).toBeDefined();
    expect(typeof bounds?.rotationCenter?.x).toBe('number');
    expect(typeof bounds?.rotationCenter?.y).toBe('number');
    expect(isFinite(bounds?.rotationCenter?.x!)).toBe(true);
    expect(isFinite(bounds?.rotationCenter?.y!)).toBe(true);
  });

  it('should set rotation center to null for non-rotated shapes', () => {
    const nonRotatedRects: ShapeElement[] = [
      {
        id: 'rect1',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ],
        color: '#FF0000',
        layerId: 'layer1'
      },
      {
        id: 'rect2',
        type: 'rectangle',
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 }
        ],
        color: '#00FF00',
        layerId: 'layer1'
      }
    ];

    const bounds = calculateGroupBounds(nonRotatedRects);

    expect(bounds?.groupRotation).toBeNull();
    expect(bounds?.rotationCenter).toBeNull();
  });

  it('should set rotation center to null for mixed rotation angles', () => {
    const mixedRotationRects: ShapeElement[] = [
      {
        id: 'rect1',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ],
        color: '#FF0000',
        layerId: 'layer1',
        rotation: {
          angle: 45,
          center: { x: 5, y: 5 }
        }
      },
      {
        id: 'rect2',
        type: 'rectangle',
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 }
        ],
        color: '#00FF00',
        layerId: 'layer1',
        rotation: {
          angle: 90,
          center: { x: 15, y: 15 }
        }
      }
    ];

    const bounds = calculateGroupBounds(mixedRotationRects);

    expect(bounds?.groupRotation).toBeNull();
    expect(bounds?.rotationCenter).toBeNull();
  });

  it('should calculate valid bounding box dimensions', () => {
    const rotatedRects: ShapeElement[] = [
      {
        id: 'rect1',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ],
        color: '#FF0000',
        layerId: 'layer1',
        rotation: {
          angle: 45,
          center: { x: 5, y: 5 }
        }
      }
    ];

    const bounds = calculateGroupBounds(rotatedRects);

    expect(bounds).not.toBeNull();
    expect(isFinite(bounds!.minX)).toBe(true);
    expect(isFinite(bounds!.minY)).toBe(true);
    expect(isFinite(bounds!.maxX)).toBe(true);
    expect(isFinite(bounds!.maxY)).toBe(true);
    expect(bounds!.maxX).toBeGreaterThan(bounds!.minX);
    expect(bounds!.maxY).toBeGreaterThan(bounds!.minY);
  });
});
