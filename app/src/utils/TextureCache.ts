/**
 * Texture caching system for field markings
 * Implements LRU cache with memory management
 */

import * as THREE from 'three';
import type { CachedTexture } from '../types/fieldMarkings';

export class TextureCache {
  private cache: Map<string, CachedTexture>;
  private maxSize: number;
  private maxAge: number; // in milliseconds

  constructor(maxSize = 20, maxAge = 3600000) {
    // 1 hour default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  /**
   * Generate a cache key from sport type and dimensions
   */
  static generateKey(sport: string, width: number, height: number): string {
    return `${sport}_${Math.round(width)}x${Math.round(height)}`;
  }

  /**
   * Get texture from cache
   */
  get(key: string): THREE.Texture | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if texture is expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.delete(key);
      return null;
    }

    // Update usage count and move to end (LRU)
    cached.usage++;
    this.cache.delete(key);
    this.cache.set(key, cached);

    return cached.texture;
  }

  /**
   * Add texture to cache
   */
  set(key: string, texture: THREE.Texture): void {
    // If cache is full, remove least recently used
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.delete(firstKey);
      }
    }

    this.cache.set(key, {
      texture,
      timestamp: Date.now(),
      usage: 1
    });
  }

  /**
   * Remove texture from cache and dispose it
   */
  delete(key: string): void {
    const cached = this.cache.get(key);
    if (cached) {
      // Dispose of Three.js texture to free memory
      cached.texture.dispose();
      this.cache.delete(key);
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    // Dispose all textures
    this.cache.forEach(cached => {
      cached.texture.dispose();
    });
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hits: number;
    memoryUsage: number;
  } {
    let totalHits = 0;
    let memoryUsage = 0;

    this.cache.forEach(cached => {
      totalHits += cached.usage;
      // Estimate memory usage (width * height * 4 bytes for RGBA)
      if (cached.texture.image) {
        memoryUsage +=
          (cached.texture.image.width || 0) *
          (cached.texture.image.height || 0) *
          4;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: totalHits,
      memoryUsage: memoryUsage / (1024 * 1024) // Convert to MB
    };
  }

  /**
   * Clean up expired textures
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((cached, key) => {
      if (now - cached.timestamp > this.maxAge) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    // Check if expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Preload common textures
   */
  preload(generateTexture: (sport: string, width: number, height: number) => THREE.Texture): void {
    const commonFields = [
      { sport: 'soccer', width: 105, height: 68 },
      { sport: 'basketball', width: 28, height: 15 },
      { sport: 'tennis', width: 23.77, height: 10.97 }
    ];

    commonFields.forEach(field => {
      const key = TextureCache.generateKey(field.sport, field.width, field.height);
      if (!this.has(key)) {
        const texture = generateTexture(field.sport, field.width, field.height);
        this.set(key, texture);
      }
    });
  }
}

// Singleton instance for the application
let instance: TextureCache | null = null;

export function getTextureCacheInstance(): TextureCache {
  if (!instance) {
    instance = new TextureCache();
  }
  return instance;
}

export function clearTextureCacheInstance(): void {
  if (instance) {
    instance.clear();
    instance = null;
  }
}