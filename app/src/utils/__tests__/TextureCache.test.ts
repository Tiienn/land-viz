/**
 * Tests for TextureCache
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TextureCache } from '../TextureCache';

// Mock THREE.Texture
class MockTexture {
  disposed: boolean = false;
  image: { width: number; height: number } | null = null;

  constructor(width = 1024, height = 1024) {
    this.image = { width, height };
  }

  dispose() {
    this.disposed = true;
  }
}

describe('TextureCache', () => {
  let cache: TextureCache;

  beforeEach(() => {
    cache = new TextureCache(3, 1000); // Max 3 items, 1 second expiry for testing
  });

  describe('basic operations', () => {
    it('should store and retrieve textures', () => {
      const texture = new MockTexture() as any;
      const key = TextureCache.generateKey('soccer', 105, 68);

      cache.set(key, texture);
      const retrieved = cache.get(key);

      expect(retrieved).toBe(texture);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should generate consistent cache keys', () => {
      const key1 = TextureCache.generateKey('soccer', 105.4, 68.2);
      const key2 = TextureCache.generateKey('soccer', 105.1, 68.3);

      expect(key1).toBe(key2); // Both round to 105x68
      expect(key1).toBe('soccer_105x68');
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when cache is full', () => {
      const texture1 = new MockTexture() as any;
      const texture2 = new MockTexture() as any;
      const texture3 = new MockTexture() as any;
      const texture4 = new MockTexture() as any;

      cache.set('key1', texture1);
      cache.set('key2', texture2);
      cache.set('key3', texture3);

      // Cache is full (max 3), adding key4 should evict key1
      cache.set('key4', texture4);

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeTruthy();
      expect(cache.get('key3')).toBeTruthy();
      expect(cache.get('key4')).toBeTruthy();
    });

    it('should update LRU order on access', () => {
      const texture1 = new MockTexture() as any;
      const texture2 = new MockTexture() as any;
      const texture3 = new MockTexture() as any;
      const texture4 = new MockTexture() as any;

      cache.set('key1', texture1);
      cache.set('key2', texture2);
      cache.set('key3', texture3);

      // Access key1, making it most recently used
      cache.get('key1');

      // Now key2 should be evicted instead of key1
      cache.set('key4', texture4);

      expect(cache.get('key1')).toBeTruthy();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeTruthy();
      expect(cache.get('key4')).toBeTruthy();
    });
  });

  describe('expiration', () => {
    it('should expire old textures', async () => {
      const texture = new MockTexture() as any;
      cache.set('key1', texture);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(cache.get('key1')).toBeNull();
    });

    it('should clean up expired textures', async () => {
      const texture1 = new MockTexture() as any;
      const texture2 = new MockTexture() as any;

      cache.set('key1', texture1);
      await new Promise(resolve => setTimeout(resolve, 500));
      cache.set('key2', texture2);

      // Wait for key1 to expire
      await new Promise(resolve => setTimeout(resolve, 600));

      cache.cleanup();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });

  describe('disposal', () => {
    it('should dispose texture when deleted', () => {
      const texture = new MockTexture() as any;
      cache.set('key1', texture);

      cache.delete('key1');

      expect(texture.disposed).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should dispose all textures when cleared', () => {
      const texture1 = new MockTexture() as any;
      const texture2 = new MockTexture() as any;

      cache.set('key1', texture1);
      cache.set('key2', texture2);

      cache.clear();

      expect(texture1.disposed).toBe(true);
      expect(texture2.disposed).toBe(true);
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should track cache statistics', () => {
      const texture1 = new MockTexture(2048, 2048) as any;
      const texture2 = new MockTexture(1024, 1024) as any;

      cache.set('key1', texture1);
      cache.set('key2', texture2);

      // Access key1 twice
      cache.get('key1');
      cache.get('key1');

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.hits).toBe(4); // 2 initial + 2 gets
      expect(stats.memoryUsage).toBeCloseTo(20, 0); // ~20MB
    });
  });

  describe('preloading', () => {
    it('should preload common textures', () => {
      const mockGenerateTexture = vi.fn((sport, width, height) => {
        return new MockTexture(width, height) as any;
      });

      cache.preload(mockGenerateTexture);

      expect(mockGenerateTexture).toHaveBeenCalledWith('soccer', 105, 68);
      expect(mockGenerateTexture).toHaveBeenCalledWith('basketball', 28, 15);
      expect(mockGenerateTexture).toHaveBeenCalledWith('tennis', 23.77, 10.97);

      expect(cache.getStats().size).toBe(3);
    });

    it('should not preload if already cached', () => {
      const mockGenerateTexture = vi.fn((sport, width, height) => {
        return new MockTexture(width, height) as any;
      });

      // Pre-cache soccer
      const soccerKey = TextureCache.generateKey('soccer', 105, 68);
      cache.set(soccerKey, new MockTexture() as any);

      cache.preload(mockGenerateTexture);

      // Should only generate basketball and tennis
      expect(mockGenerateTexture).toHaveBeenCalledTimes(2);
      expect(mockGenerateTexture).not.toHaveBeenCalledWith('soccer', 105, 68);
    });
  });
});