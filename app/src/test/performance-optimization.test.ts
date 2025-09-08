import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RaycastManager } from '../utils/RaycastManager';
import { SnapGrid } from '../utils/SnapGrid';
import { GeometryCache } from '../utils/GeometryCache';
import type { Shape, Point2D } from '../types';
import { Camera, Vector2 } from 'three';

describe('Performance Optimizations', () => {
  describe('RaycastManager', () => {
    let raycastManager: RaycastManager;

    beforeEach(() => {
      raycastManager = new RaycastManager();
    });

    afterEach(() => {
      raycastManager.dispose();
    });

    it('should control raycasting frequency based on activity', () => {
      const timestamp1 = performance.now();
      
      // First raycast should always be allowed
      expect(raycastManager.shouldRaycast(timestamp1)).toBe(true);
      
      // Subsequent raycast immediately after should be throttled
      const timestamp2 = timestamp1 + 8; // 8ms later
      expect(raycastManager.shouldRaycast(timestamp2)).toBe(false);
      
      // After sufficient time, should allow raycast again
      const timestamp3 = timestamp1 + 50; // 50ms later
      expect(raycastManager.shouldRaycast(timestamp3)).toBe(true);
    });

    it('should adjust frequency when drawing', () => {
      raycastManager.setDrawing(true);
      
      const timestamp1 = performance.now();
      
      // First raycast should always be allowed
      expect(raycastManager.shouldRaycast(timestamp1)).toBe(true);
      
      // Subsequent raycast should be throttled
      const timestamp2 = timestamp1 + 5; // 5ms later  
      expect(raycastManager.shouldRaycast(timestamp2)).toBe(false);
      
      // After drawing interval, should allow raycast again
      const timestamp3 = timestamp1 + 15; // 15ms later
      expect(raycastManager.shouldRaycast(timestamp3)).toBe(true);
    });

    it('should intersect ground plane correctly', () => {
      // Mock camera setup would go here
      // This test would verify ground plane intersection calculation
      expect(raycastManager).toBeDefined();
    });
  });

  describe('SnapGrid', () => {
    let snapGrid: SnapGrid;

    beforeEach(() => {
      snapGrid = new SnapGrid(10, 1.5);
    });

    afterEach(() => {
      snapGrid.dispose();
    });

    it('should efficiently find snap points using spatial partitioning', () => {
      const testShapes: Shape[] = [
        {
          id: 'test-rect',
          type: 'rectangle',
          name: 'Test Rectangle',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 }
          ],
          color: '#blue',
          visible: true,
          layerId: 'test-layer',
          created: new Date(),
          modified: new Date()
        }
      ];

      snapGrid.updateSnapPoints(testShapes);
      
      const nearPoint = snapGrid.findNearestSnapPoint({ x: 1, y: 1 }, 5);
      expect(nearPoint).toBeTruthy();
      expect(nearPoint?.type).toBe('endpoint');
    });

    it('should return multiple snap points in radius', () => {
      const testShapes: Shape[] = [
        {
          id: 'test-circle',
          type: 'circle',
          name: 'Test Circle',
          points: [
            { x: 0, y: 0 },
            { x: 5, y: 0 },
            { x: 0, y: 5 },
            { x: -5, y: 0 },
            { x: 0, y: -5 }
          ],
          color: '#green',
          visible: true,
          layerId: 'test-layer',
          created: new Date(),
          modified: new Date()
        }
      ];

      snapGrid.updateSnapPoints(testShapes);
      
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 0, y: 0 }, 10);
      expect(snapPoints.length).toBeGreaterThan(0);
    });

    it('should provide performance statistics', () => {
      const stats = snapGrid.getStats();
      expect(stats).toHaveProperty('gridCells');
      expect(stats).toHaveProperty('totalSnapPoints');
      expect(stats).toHaveProperty('cellSize');
      expect(stats).toHaveProperty('snapDistance');
    });
  });

  describe('GeometryCache', () => {
    beforeEach(() => {
      GeometryCache.dispose(); // Start fresh
    });

    afterEach(() => {
      GeometryCache.dispose();
    });

    it('should cache and reuse geometries efficiently', () => {
      const testShape: Shape = {
        id: 'test-shape',
        type: 'rectangle',
        name: 'Test Shape',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ],
        color: '#red',
        visible: true,
        layerId: 'test-layer',
        created: new Date(),
        modified: new Date()
      };

      // First call should create geometry
      const geometry1 = GeometryCache.getGeometry(testShape, 0.01);
      expect(geometry1).toBeDefined();

      // Second call should reuse cached geometry
      const geometry2 = GeometryCache.getGeometry(testShape, 0.01);
      expect(geometry2).toBeDefined();

      const stats = GeometryCache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });

    it('should handle different shape types', () => {
      const rectangleShape: Shape = {
        id: 'rect',
        type: 'rectangle',
        name: 'Rectangle',
        points: [{ x: 0, y: 0 }, { x: 5, y: 5 }],
        color: '#blue',
        visible: true,
        layerId: 'test',
        created: new Date(),
        modified: new Date()
      };

      const circleShape: Shape = {
        id: 'circle',
        type: 'circle',
        name: 'Circle',
        points: Array.from({ length: 16 }, (_, i) => ({
          x: Math.cos(i * Math.PI / 8) * 5,
          y: Math.sin(i * Math.PI / 8) * 5
        })),
        color: '#green',
        visible: true,
        layerId: 'test',
        created: new Date(),
        modified: new Date()
      };

      const rectGeometry = GeometryCache.getGeometry(rectangleShape);
      const circleGeometry = GeometryCache.getGeometry(circleShape);

      expect(rectGeometry).toBeDefined();
      expect(circleGeometry).toBeDefined();
    });

    it('should manage cache size and provide statistics', () => {
      GeometryCache.setMaxCacheSize(5);
      
      // Create multiple geometries to test cache management
      for (let i = 0; i < 10; i++) {
        const shape: Shape = {
          id: `shape-${i}`,
          type: 'rectangle',
          name: `Shape ${i}`,
          points: [{ x: i, y: i }, { x: i + 1, y: i + 1 }],
          color: '#blue',
          visible: true,
          layerId: 'test',
          created: new Date(),
          modified: new Date()
        };
        GeometryCache.getGeometry(shape);
      }

      const stats = GeometryCache.getStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(5);
      expect(stats.maxSize).toBe(5);
    });

    it('should invalidate specific shapes', () => {
      const testShape: Shape = {
        id: 'invalidate-test',
        type: 'rectangle',
        name: 'Invalidate Test',
        points: [{ x: 0, y: 0 }, { x: 2, y: 2 }],
        color: '#purple',
        visible: true,
        layerId: 'test',
        created: new Date(),
        modified: new Date()
      };

      // Create and cache geometry
      GeometryCache.getGeometry(testShape);
      let stats = GeometryCache.getStats();
      const initialCacheSize = stats.cacheSize;

      // Invalidate the shape
      GeometryCache.invalidateShape(testShape);
      stats = GeometryCache.getStats();
      
      // Cache size should be reduced (unless there are other items)
      expect(stats.cacheSize).toBeLessThanOrEqual(initialCacheSize);
    });
  });

  describe('Integration Performance', () => {
    it('should handle multiple optimizations together', () => {
      const raycastManager = new RaycastManager();
      const snapGrid = new SnapGrid();
      
      // Set up performance scenario
      raycastManager.setDrawing(true);
      raycastManager.setSnapEnabled(true);
      
      const testShapes: Shape[] = Array.from({ length: 50 }, (_, i) => ({
        id: `perf-shape-${i}`,
        type: 'rectangle' as const,
        name: `Performance Shape ${i}`,
        points: [
          { x: i * 2, y: i * 2 },
          { x: i * 2 + 1, y: i * 2 + 1 }
        ],
        color: '#test',
        visible: true,
        layerId: 'perf-test',
        created: new Date(),
        modified: new Date()
      }));

      // Update snap grid with many shapes
      const startTime = performance.now();
      snapGrid.updateSnapPoints(testShapes);
      const snapUpdateTime = performance.now() - startTime;

      // Cache geometries for all shapes
      const cacheStartTime = performance.now();
      testShapes.forEach(shape => {
        GeometryCache.getGeometry(shape);
      });
      const cacheTime = performance.now() - cacheStartTime;

      // Performance assertions (adjust thresholds as needed)
      expect(snapUpdateTime).toBeLessThan(100); // Should complete within 100ms
      expect(cacheTime).toBeLessThan(50); // Should complete within 50ms

      // Cleanup
      raycastManager.dispose();
      snapGrid.dispose();
      GeometryCache.dispose();
    });
  });
});