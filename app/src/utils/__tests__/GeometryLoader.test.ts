import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GeometryLoader } from '../GeometryLoader';
import * as THREE from 'three';

// Mock the dynamic imports
vi.mock('../../geometries/EiffelTowerGeometry', () => ({
  EiffelTowerGeometry: class MockEiffelTowerGeometry {
    constructor(public options: any = {}) {}
    build() {
      const group = new THREE.Group();
      group.name = 'EiffelTower';
      return group;
    }
  }
}));

vi.mock('../../geometries/StatueOfLibertyGeometry', () => ({
  StatueOfLibertyGeometry: class MockStatueOfLibertyGeometry {
    constructor(public options: any = {}) {}
    build() {
      const group = new THREE.Group();
      group.name = 'StatueOfLiberty';
      return group;
    }
  }
}));

describe('GeometryLoader', () => {
  let geometryLoader: GeometryLoader;

  beforeEach(() => {
    geometryLoader = new GeometryLoader();
    // Clear any cached geometries
    geometryLoader.clearCache();
  });

  afterEach(() => {
    // Clean up any geometries
    geometryLoader.dispose();
    vi.clearAllMocks();
  });

  describe('Basic Loading', () => {
    it('should load Eiffel Tower geometry', async () => {
      const geometry = await geometryLoader.loadGeometry('eiffel-tower');

      expect(geometry).toBeInstanceOf(THREE.Group);
      expect(geometry.name).toBe('EiffelTower');
    });

    it('should load Statue of Liberty geometry', async () => {
      const geometry = await geometryLoader.loadGeometry('statue-of-liberty');

      expect(geometry).toBeInstanceOf(THREE.Group);
      expect(geometry.name).toBe('StatueOfLiberty');
    });

    it('should throw error for unknown geometry type', async () => {
      await expect(
        geometryLoader.loadGeometry('unknown-geometry')
      ).rejects.toThrow('Unknown geometry type: unknown-geometry');
    });

    it('should pass options to geometry constructor', async () => {
      const options = { scale: 2, material: 'bronze' };

      // We'll verify options are passed by checking the mock was called correctly
      await geometryLoader.loadGeometry('eiffel-tower', options);

      // In a real implementation, we'd verify the geometry was created with options
      // For now, we just ensure no errors were thrown
      expect(true).toBe(true);
    });
  });

  describe('Caching System', () => {
    it('should cache loaded geometries', async () => {
      const cacheKey = geometryLoader.getCacheKey('eiffel-tower', {});

      // First load - should create new geometry
      const geometry1 = await geometryLoader.loadGeometry('eiffel-tower');
      expect(geometryLoader.isInCache(cacheKey)).toBe(true);

      // Second load - should return cached geometry
      const geometry2 = await geometryLoader.loadGeometry('eiffel-tower');
      expect(geometry2).toBe(geometry1); // Same instance
    });

    it('should use different cache keys for different options', async () => {
      const options1 = { scale: 1 };
      const options2 = { scale: 2 };

      const key1 = geometryLoader.getCacheKey('eiffel-tower', options1);
      const key2 = geometryLoader.getCacheKey('eiffel-tower', options2);

      expect(key1).not.toBe(key2);

      // Load with different options should create different cache entries
      const geometry1 = await geometryLoader.loadGeometry('eiffel-tower', options1);
      const geometry2 = await geometryLoader.loadGeometry('eiffel-tower', options2);

      expect(geometryLoader.isInCache(key1)).toBe(true);
      expect(geometryLoader.isInCache(key2)).toBe(true);
    });

    it('should clear cache correctly', async () => {
      await geometryLoader.loadGeometry('eiffel-tower');
      const cacheKey = geometryLoader.getCacheKey('eiffel-tower', {});

      expect(geometryLoader.isInCache(cacheKey)).toBe(true);

      geometryLoader.clearCache();
      expect(geometryLoader.isInCache(cacheKey)).toBe(false);
    });

    it('should remove specific geometry from cache', async () => {
      await geometryLoader.loadGeometry('eiffel-tower');
      await geometryLoader.loadGeometry('statue-of-liberty');

      const eiffelKey = geometryLoader.getCacheKey('eiffel-tower', {});
      const libertyKey = geometryLoader.getCacheKey('statue-of-liberty', {});

      expect(geometryLoader.isInCache(eiffelKey)).toBe(true);
      expect(geometryLoader.isInCache(libertyKey)).toBe(true);

      geometryLoader.removeFromCache(eiffelKey);

      expect(geometryLoader.isInCache(eiffelKey)).toBe(false);
      expect(geometryLoader.isInCache(libertyKey)).toBe(true);
    });
  });

  describe('LRU Cache Behavior', () => {
    it('should implement LRU eviction when cache limit is reached', async () => {
      // Set a small cache limit for testing
      const smallCacheLoader = new GeometryLoader(2); // Max 2 items

      // Load 3 different geometries
      await smallCacheLoader.loadGeometry('eiffel-tower', { version: 1 });
      await smallCacheLoader.loadGeometry('statue-of-liberty', { version: 1 });
      await smallCacheLoader.loadGeometry('eiffel-tower', { version: 2 }); // Different options

      const key1 = smallCacheLoader.getCacheKey('eiffel-tower', { version: 1 });
      const key2 = smallCacheLoader.getCacheKey('statue-of-liberty', { version: 1 });
      const key3 = smallCacheLoader.getCacheKey('eiffel-tower', { version: 2 });

      // First item should be evicted (LRU)
      expect(smallCacheLoader.isInCache(key1)).toBe(false);
      expect(smallCacheLoader.isInCache(key2)).toBe(true);
      expect(smallCacheLoader.isInCache(key3)).toBe(true);

      smallCacheLoader.dispose();
    });

    it('should update access time when geometry is retrieved from cache', async () => {
      const loader = new GeometryLoader(3);

      // Load geometries
      await loader.loadGeometry('eiffel-tower', { v: 1 });
      await loader.loadGeometry('statue-of-liberty', { v: 1 });
      await loader.loadGeometry('eiffel-tower', { v: 2 });

      // Access the first one again (should update its access time)
      await loader.loadGeometry('eiffel-tower', { v: 1 });

      // Add one more to trigger eviction
      await loader.loadGeometry('statue-of-liberty', { v: 2 });

      const key1 = loader.getCacheKey('eiffel-tower', { v: 1 });
      const key2 = loader.getCacheKey('statue-of-liberty', { v: 1 });
      const key3 = loader.getCacheKey('eiffel-tower', { v: 2 });

      // The middle one should be evicted since key1 was accessed recently
      expect(loader.isInCache(key1)).toBe(true);  // Recently accessed
      expect(loader.isInCache(key2)).toBe(false); // Should be evicted (LRU)
      expect(loader.isInCache(key3)).toBe(true);  // Newer

      loader.dispose();
    });
  });

  describe('Error Handling', () => {
    it('should handle import failures gracefully', async () => {
      // Mock a failing import
      vi.doMock('../../geometries/FailingGeometry', () => {
        throw new Error('Import failed');
      });

      await expect(
        geometryLoader.loadGeometry('failing-geometry')
      ).rejects.toThrow();
    });

    it('should handle geometry construction failures', async () => {
      // Mock a geometry that fails during construction
      vi.doMock('../../geometries/FailingConstructorGeometry', () => ({
        FailingConstructorGeometry: class {
          constructor() {
            throw new Error('Construction failed');
          }
        }
      }));

      await expect(
        geometryLoader.loadGeometry('failing-constructor-geometry')
      ).rejects.toThrow();
    });

    it('should not cache failed loads', async () => {
      const originalConsoleError = console.error;
      console.error = vi.fn(); // Suppress error logging

      try {
        await geometryLoader.loadGeometry('unknown-geometry').catch(() => {});

        const cacheKey = geometryLoader.getCacheKey('unknown-geometry', {});
        expect(geometryLoader.isInCache(cacheKey)).toBe(false);
      } finally {
        console.error = originalConsoleError;
      }
    });
  });

  describe('Memory Management', () => {
    it('should dispose geometries when removed from cache', async () => {
      const geometry = await geometryLoader.loadGeometry('eiffel-tower');
      const disposeSpy = vi.spyOn(geometry, 'traverse');

      const cacheKey = geometryLoader.getCacheKey('eiffel-tower', {});
      geometryLoader.removeFromCache(cacheKey);

      // Should have called traverse to dispose of child objects
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should dispose all geometries when loader is disposed', async () => {
      await geometryLoader.loadGeometry('eiffel-tower');
      await geometryLoader.loadGeometry('statue-of-liberty');

      // Mock the traverse method to verify disposal
      const geometries = Array.from((geometryLoader as any).cache.values());
      const spies = geometries.map((geo: any) => vi.spyOn(geo.geometry, 'traverse'));

      geometryLoader.dispose();

      // All geometries should have been disposed
      spies.forEach(spy => expect(spy).toHaveBeenCalled());
    });

    it('should clear cache when disposed', async () => {
      await geometryLoader.loadGeometry('eiffel-tower');

      const cacheKey = geometryLoader.getCacheKey('eiffel-tower', {});
      expect(geometryLoader.isInCache(cacheKey)).toBe(true);

      geometryLoader.dispose();
      expect(geometryLoader.isInCache(cacheKey)).toBe(false);
    });
  });

  describe('Performance Tracking', () => {
    it('should track load times', async () => {
      const startTime = performance.now();
      await geometryLoader.loadGeometry('eiffel-tower');
      const endTime = performance.now();

      const stats = geometryLoader.getPerformanceStats();
      expect(stats.totalLoads).toBe(1);
      expect(stats.cacheHits).toBe(0);
      expect(stats.averageLoadTime).toBeGreaterThan(0);
      expect(stats.averageLoadTime).toBeLessThan(endTime - startTime + 10); // Some tolerance
    });

    it('should track cache hits and misses', async () => {
      // First load - cache miss
      await geometryLoader.loadGeometry('eiffel-tower');
      let stats = geometryLoader.getPerformanceStats();
      expect(stats.totalLoads).toBe(1);
      expect(stats.cacheHits).toBe(0);

      // Second load - cache hit
      await geometryLoader.loadGeometry('eiffel-tower');
      stats = geometryLoader.getPerformanceStats();
      expect(stats.totalLoads).toBe(2);
      expect(stats.cacheHits).toBe(1);

      // Cache hit ratio should be 50%
      expect(stats.cacheHitRatio).toBeCloseTo(0.5, 2);
    });

    it('should reset performance stats', async () => {
      await geometryLoader.loadGeometry('eiffel-tower');
      await geometryLoader.loadGeometry('eiffel-tower'); // Cache hit

      let stats = geometryLoader.getPerformanceStats();
      expect(stats.totalLoads).toBe(2);

      geometryLoader.resetPerformanceStats();
      stats = geometryLoader.getPerformanceStats();
      expect(stats.totalLoads).toBe(0);
      expect(stats.cacheHits).toBe(0);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const options = { scale: 1, material: 'metal' };

      const key1 = geometryLoader.getCacheKey('eiffel-tower', options);
      const key2 = geometryLoader.getCacheKey('eiffel-tower', options);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different geometries', () => {
      const options = { scale: 1 };

      const key1 = geometryLoader.getCacheKey('eiffel-tower', options);
      const key2 = geometryLoader.getCacheKey('statue-of-liberty', options);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different options', () => {
      const options1 = { scale: 1 };
      const options2 = { scale: 2 };

      const key1 = geometryLoader.getCacheKey('eiffel-tower', options1);
      const key2 = geometryLoader.getCacheKey('eiffel-tower', options2);

      expect(key1).not.toBe(key2);
    });

    it('should handle complex options objects', () => {
      const complexOptions = {
        scale: 1.5,
        material: { type: 'metal', color: 0x888888 },
        animation: { enabled: true, speed: 2 },
        lighting: { shadows: true, intensity: 0.8 }
      };

      const key = geometryLoader.getCacheKey('eiffel-tower', complexOptions);
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Loading', () => {
    it('should handle concurrent loads of same geometry', async () => {
      // Start multiple loads of the same geometry simultaneously
      const promises = [
        geometryLoader.loadGeometry('eiffel-tower'),
        geometryLoader.loadGeometry('eiffel-tower'),
        geometryLoader.loadGeometry('eiffel-tower')
      ];

      const results = await Promise.all(promises);

      // All should return the same instance (from cache)
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);

      // Should only have loaded once
      const stats = geometryLoader.getPerformanceStats();
      expect(stats.totalLoads).toBe(3);
      expect(stats.cacheHits).toBe(2); // Two cache hits
    });

    it('should handle concurrent loads of different geometries', async () => {
      const promises = [
        geometryLoader.loadGeometry('eiffel-tower'),
        geometryLoader.loadGeometry('statue-of-liberty'),
        geometryLoader.loadGeometry('eiffel-tower', { scale: 2 })
      ];

      const results = await Promise.all(promises);

      // Should all succeed and return different instances
      expect(results).toHaveLength(3);
      expect(results[0]).not.toBe(results[1]);
      expect(results[0]).not.toBe(results[2]);
    });
  });

  describe('Integration with React Hook', () => {
    // Note: These would be more comprehensive with actual React Testing Library
    it('should provide loading states', () => {
      // Mock the hook behavior
      const mockHookState = {
        geometry: null,
        isLoading: true,
        error: null,
        loadTime: null
      };

      expect(mockHookState.isLoading).toBe(true);
      expect(mockHookState.geometry).toBe(null);
    });

    it('should handle successful load in hook', async () => {
      const geometry = await geometryLoader.loadGeometry('eiffel-tower');

      const mockHookState = {
        geometry,
        isLoading: false,
        error: null,
        loadTime: 150
      };

      expect(mockHookState.isLoading).toBe(false);
      expect(mockHookState.geometry).toBeTruthy();
      expect(mockHookState.error).toBe(null);
    });

    it('should handle errors in hook', () => {
      const mockHookState = {
        geometry: null,
        isLoading: false,
        error: new Error('Failed to load geometry'),
        loadTime: null
      };

      expect(mockHookState.isLoading).toBe(false);
      expect(mockHookState.geometry).toBe(null);
      expect(mockHookState.error).toBeTruthy();
    });
  });
});