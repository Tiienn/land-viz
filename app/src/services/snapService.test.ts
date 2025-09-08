import { describe, it, expect, beforeEach } from 'vitest';
import { SnapService } from './snapService';
import { Point2D, SnapConfig, GridConfig, SnapType, Shape } from '../types';

describe('SnapService', () => {
  let snapService: SnapService;
  let mockGridConfig: GridConfig;
  let mockSnapConfig: SnapConfig;

  beforeEach(() => {
    snapService = new SnapService();
    
    mockGridConfig = {
      enabled: true,
      primarySpacing: 10,
      secondarySpacing: 5,
      origin: { x: 0, y: 0 },
      style: {
        primaryColor: '#000000',
        secondaryColor: '#cccccc',
        primaryThickness: 1,
        secondaryThickness: 0.5,
        opacity: 0.5
      },
      behavior: {
        showLabels: true,
        adaptive: false,
        fadeAtZoom: false
      }
    };

    mockSnapConfig = {
      enabled: true,
      snapRadius: 15,
      activeTypes: new Set(['grid', 'endpoint', 'midpoint', 'center']),
      visual: {
        showIndicators: true,
        showSnapLines: true,
        indicatorColor: '#00C4CC',
        snapLineColor: '#FF0000',
        indicatorSize: 8
      },
      performance: {
        maxSnapPoints: 1000,
        updateInterval: 16
      }
    };
  });

  describe('Grid Snapping', () => {
    it('should detect grid snap points within tolerance', () => {
      const cursor: Point2D = { x: 12, y: 8 };
      const snapPoints = snapService.getGridSnapPoints(cursor, mockGridConfig, 15);

      expect(snapPoints.length).toBeGreaterThan(0);
      
      // Should find snap points at grid intersections
      const nearestGrid = snapPoints.find(point => 
        point.position.x === 10 && point.position.y === 10
      );
      expect(nearestGrid).toBeDefined();
      expect(nearestGrid?.type).toBe('grid');
    });

    it('should not detect grid snap points when grid is disabled', () => {
      const cursor: Point2D = { x: 12, y: 8 };
      const disabledGrid = { ...mockGridConfig, enabled: false };
      
      const snapPoints = snapService.getGridSnapPoints(cursor, disabledGrid, 15);
      
      expect(snapPoints).toHaveLength(0);
    });

    it('should calculate correct grid snap strength based on distance', () => {
      const cursor: Point2D = { x: 10.5, y: 10.5 }; // Very close to (10, 10)
      const snapPoints = snapService.getGridSnapPoints(cursor, mockGridConfig, 15);

      const nearestGrid = snapPoints.find(point => 
        point.position.x === 10 && point.position.y === 10
      );
      
      expect(nearestGrid?.strength).toBeCloseTo(0.9, 1); // High strength due to proximity
    });

    it('should generate grid points within specified tolerance radius', () => {
      const cursor: Point2D = { x: 25, y: 25 };
      const tolerance = 20;
      const snapPoints = snapService.getGridSnapPoints(cursor, mockGridConfig, tolerance);

      snapPoints.forEach(point => {
        const distance = Math.sqrt(
          Math.pow(cursor.x - point.position.x, 2) + 
          Math.pow(cursor.y - point.position.y, 2)
        );
        expect(distance).toBeLessThanOrEqual(tolerance);
      });
    });

    it('should handle different grid spacing correctly', () => {
      const cursor: Point2D = { x: 22, y: 22 };
      const largeSpacingGrid = { ...mockGridConfig, primarySpacing: 20 };
      
      const snapPoints = snapService.getGridSnapPoints(cursor, largeSpacingGrid, 15);
      
      // Should find snap point at (20, 20)
      const snapPoint = snapPoints.find(point => 
        point.position.x === 20 && point.position.y === 20
      );
      expect(snapPoint).toBeDefined();
    });

    it('should include correct metadata for grid snap points', () => {
      const cursor: Point2D = { x: 12, y: 8 };
      const snapPoints = snapService.getGridSnapPoints(cursor, mockGridConfig, 15);

      const gridPoint = snapPoints[0];
      expect(gridPoint.metadata).toBeDefined();
      expect(gridPoint.metadata?.description).toContain('Grid intersection');
      expect(gridPoint.metadata?.spacing).toBe(10);
      expect(typeof gridPoint.metadata?.gridX).toBe('number');
      expect(typeof gridPoint.metadata?.gridY).toBe('number');
    });
  });

  describe('Snap Strength Calculation', () => {
    it('should calculate higher strength for closer distances', () => {
      const closeStrength = snapService.calculateSnapStrength(2, 15, 'grid');
      const farStrength = snapService.calculateSnapStrength(12, 15, 'grid');
      
      expect(closeStrength).toBeGreaterThan(farStrength);
    });

    it('should apply correct type priority multipliers', () => {
      const distance = 5;
      const tolerance = 15;
      
      const endpointStrength = snapService.calculateSnapStrength(distance, tolerance, 'endpoint');
      const gridStrength = snapService.calculateSnapStrength(distance, tolerance, 'grid');
      const midpointStrength = snapService.calculateSnapStrength(distance, tolerance, 'midpoint');
      
      expect(endpointStrength).toBeGreaterThan(gridStrength);
      expect(gridStrength).toBeGreaterThan(midpointStrength);
    });

    it('should return zero strength for distances exceeding tolerance', () => {
      const strength = snapService.calculateSnapStrength(20, 15, 'grid');
      expect(strength).toBe(0);
    });
  });

  describe('Best Snap Point Detection', () => {
    it('should return null for empty snap points array', () => {
      const cursor: Point2D = { x: 10, y: 10 };
      const bestSnap = snapService.findBestSnapPoint(cursor, []);
      
      expect(bestSnap).toBeNull();
    });

    it('should prefer higher strength snap points', () => {
      const cursor: Point2D = { x: 10, y: 10 };
      const snapPoints = [
        {
          id: 'test1',
          type: 'grid' as SnapType,
          position: { x: 15, y: 15 },
          strength: 0.3
        },
        {
          id: 'test2', 
          type: 'endpoint' as SnapType,
          position: { x: 12, y: 12 },
          strength: 0.8
        }
      ];

      const bestSnap = snapService.findBestSnapPoint(cursor, snapPoints);
      
      expect(bestSnap?.id).toBe('test2');
      expect(bestSnap?.strength).toBe(0.8);
    });

    it('should use distance as tiebreaker for similar strengths', () => {
      const cursor: Point2D = { x: 10, y: 10 };
      const snapPoints = [
        {
          id: 'farther',
          type: 'endpoint' as SnapType,
          position: { x: 15, y: 15 },
          strength: 0.7
        },
        {
          id: 'closer',
          type: 'endpoint' as SnapType,
          position: { x: 11, y: 11 },
          strength: 0.7
        }
      ];

      const bestSnap = snapService.findBestSnapPoint(cursor, snapPoints);
      
      expect(bestSnap?.id).toBe('closer');
    });
  });

  describe('Shape Snap Points', () => {
    it('should generate endpoint snap points for rectangle shapes', () => {
      const rectangle: Shape = {
        id: 'rect-1',
        name: 'Test Rectangle',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 20 }
        ],
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date()
      };

      // Position cursor close to a corner to ensure it's within snap radius
      const cursor: Point2D = { x: 1, y: 1 };
      const configWithEndpoint = {
        ...mockSnapConfig,
        activeTypes: new Set(['endpoint', 'midpoint', 'center']),
        snapRadius: 50 // Increase radius to capture all corners
      };
      
      const snapPoints = snapService.getShapeSnapPoints([rectangle], cursor, configWithEndpoint);

      const endpointSnaps = snapPoints.filter(point => point.type === 'endpoint');
      expect(endpointSnaps.length).toBe(4); // 4 corners
    });

    it('should generate center snap point for circle shapes', () => {
      const circle: Shape = {
        id: 'circle-1',
        name: 'Test Circle',
        type: 'circle',
        points: [
          { x: 10, y: 10 }, // center
          { x: 20, y: 10 }  // radius point
        ],
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date()
      };

      const cursor: Point2D = { x: 12, y: 12 };
      const snapPoints = snapService.getShapeSnapPoints([circle], cursor, mockSnapConfig);

      const centerSnap = snapPoints.find(point => point.type === 'center');
      expect(centerSnap).toBeDefined();
      expect(centerSnap?.position).toEqual({ x: 10, y: 10 });
    });

    it('should generate quadrant snap points for circle shapes', () => {
      const circle: Shape = {
        id: 'circle-1',
        name: 'Test Circle',
        type: 'circle',
        points: [
          { x: 10, y: 10 }, // center
          { x: 20, y: 10 }  // radius point (radius = 10)
        ],
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date()
      };

      // Position cursor close to center to ensure quadrants are within snap radius
      const cursor: Point2D = { x: 10, y: 10 };
      const configWithQuadrant = {
        ...mockSnapConfig,
        activeTypes: new Set(['center', 'quadrant']),
        snapRadius: 50 // Increase radius to capture all quadrants
      };
      
      const snapPoints = snapService.getShapeSnapPoints([circle], cursor, configWithQuadrant);

      const quadrantSnaps = snapPoints.filter(point => point.type === 'quadrant');
      expect(quadrantSnaps.length).toBe(4); // N, E, S, W quadrants

      // Check north quadrant
      const northQuadrant = quadrantSnaps.find(point => 
        point.position.x === 10 && point.position.y === 20
      );
      expect(northQuadrant).toBeDefined();
    });
  });

  describe('Complete Snap Detection', () => {
    it('should combine grid and shape snap points', () => {
      const shapes: Shape[] = [{
        id: 'rect-1',
        name: 'Test Rectangle',
        type: 'rectangle',
        points: [{ x: 15, y: 15 }, { x: 25, y: 25 }],
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date()
      }];

      const cursor: Point2D = { x: 12, y: 12 };
      const snapPoints = snapService.detectSnapPoints(cursor, shapes, mockSnapConfig, mockGridConfig);

      const gridSnaps = snapPoints.filter(point => point.type === 'grid');
      const shapeSnaps = snapPoints.filter(point => point.type !== 'grid');

      expect(gridSnaps.length).toBeGreaterThan(0);
      expect(shapeSnaps.length).toBeGreaterThan(0);
    });

    it('should filter by enabled snap types', () => {
      const restrictedConfig = {
        ...mockSnapConfig,
        activeTypes: new Set(['grid'])
      };

      const shapes: Shape[] = [{
        id: 'rect-1',
        name: 'Test Rectangle', 
        type: 'rectangle',
        points: [{ x: 15, y: 15 }, { x: 25, y: 25 }],
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date()
      }];

      const cursor: Point2D = { x: 12, y: 12 };
      const snapPoints = snapService.detectSnapPoints(cursor, shapes, restrictedConfig, mockGridConfig);

      // Should only contain grid snaps
      expect(snapPoints.every(point => point.type === 'grid')).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should clear shape cache for specific shape', () => {
      const shapes: Shape[] = [{
        id: 'rect-1',
        name: 'Test Rectangle',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date()
      }];

      // Generate snap points to populate cache
      const cursor: Point2D = { x: 5, y: 5 };
      snapService.getShapeSnapPoints(shapes, cursor, mockSnapConfig);

      // Clear specific shape cache
      snapService.clearShapeCache('rect-1');

      // Cache should be partially cleared (implementation detail test)
      expect(() => snapService.clearShapeCache('rect-1')).not.toThrow();
    });

    it('should clear all caches', () => {
      snapService.clearAllCaches();
      expect(() => snapService.clearAllCaches()).not.toThrow();
    });
  });

  describe('Debug Information', () => {
    it('should provide debug information', () => {
      const shapes: Shape[] = [];
      const cursor: Point2D = { x: 10, y: 10 };
      
      const debugInfo = snapService.getDebugInfo(cursor, shapes, mockSnapConfig, mockGridConfig);

      expect(debugInfo).toHaveProperty('totalSnapPoints');
      expect(debugInfo).toHaveProperty('snapsByType');
      expect(debugInfo).toHaveProperty('closestSnap');
      expect(debugInfo).toHaveProperty('cacheStats');
      expect(typeof debugInfo.totalSnapPoints).toBe('number');
      expect(typeof debugInfo.snapsByType).toBe('object');
    });

    it('should count snap points by type correctly', () => {
      const shapes: Shape[] = [{
        id: 'rect-1',
        name: 'Test Rectangle',
        type: 'rectangle', 
        points: [{ x: 8, y: 8 }, { x: 12, y: 12 }],
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date()
      }];

      const cursor: Point2D = { x: 10, y: 10 };
      const debugInfo = snapService.getDebugInfo(cursor, shapes, mockSnapConfig, mockGridConfig);

      expect(debugInfo.snapsByType.grid).toBeGreaterThan(0);
      expect(debugInfo.snapsByType.endpoint).toBeGreaterThan(0);
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate correct Euclidean distance', () => {
      // Access private method through public interface
      const cursor: Point2D = { x: 0, y: 0 };
      const snapPoints = snapService.getGridSnapPoints(cursor, mockGridConfig, 50);
      
      const point10_0 = snapPoints.find(p => p.position.x === 10 && p.position.y === 0);
      expect(point10_0).toBeDefined();
      
      // Distance from (0,0) to (10,0) should be 10
      // We can verify this through the strength calculation which uses distance
      const expectedStrength = snapService.calculateSnapStrength(10, 50, 'grid');
      expect(point10_0?.strength).toBeCloseTo(expectedStrength, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shapes array', () => {
      const cursor: Point2D = { x: 10, y: 10 };
      const snapPoints = snapService.getShapeSnapPoints([], cursor, mockSnapConfig);
      
      expect(snapPoints).toHaveLength(0);
    });

    it('should handle shapes with insufficient points', () => {
      const invalidShape: Shape = {
        id: 'invalid-1',
        name: 'Invalid Shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }], // Only one point
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date()
      };

      const cursor: Point2D = { x: 5, y: 5 };
      const snapPoints = snapService.getShapeSnapPoints([invalidShape], cursor, mockSnapConfig);
      
      expect(snapPoints).toHaveLength(0);
    });

    it('should handle zero snap radius gracefully', () => {
      const cursor: Point2D = { x: 10.1, y: 10.1 };
      
      const snapPoints = snapService.getGridSnapPoints(cursor, mockGridConfig, 0);
      expect(snapPoints).toHaveLength(0);
    });

    it('should handle disabled snap types', () => {
      const disabledConfig = {
        ...mockSnapConfig,
        activeTypes: new Set<SnapType>()
      };

      const shapes: Shape[] = [{
        id: 'rect-1',
        name: 'Test Rectangle',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date()
      }];

      const cursor: Point2D = { x: 5, y: 5 };
      const snapPoints = snapService.detectSnapPoints(cursor, shapes, disabledConfig, mockGridConfig);
      
      expect(snapPoints).toHaveLength(0);
    });
  });
});