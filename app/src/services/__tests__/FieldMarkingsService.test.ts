/**
 * Tests for FieldMarkingsService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FieldMarkingsService } from '../FieldMarkingsService';
import { TextureCache } from '../../utils/TextureCache';
import * as THREE from 'three';

// Mock Canvas API
const mockContext2D = {
  clearRect: vi.fn(),
  strokeRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  lineCap: 'butt' as CanvasLineCap,
  lineJoin: 'miter' as CanvasLineJoin,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high' as ImageSmoothingQuality
};

global.document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext2D)
    } as any;
  }
  return {} as any;
});

// Mock Three.js Canvas Texture
class MockCanvasTexture {
  canvas: HTMLCanvasElement;
  minFilter: number;
  magFilter: number;
  format: number;
  needsUpdate: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.minFilter = THREE.LinearFilter;
    this.magFilter = THREE.LinearFilter;
    this.format = THREE.RGBAFormat;
    this.needsUpdate = false;
  }

  dispose() {
    // Mock dispose
  }
}

// Replace Three.js CanvasTexture with mock
(THREE as any).CanvasTexture = MockCanvasTexture;

describe('FieldMarkingsService', () => {
  let service: FieldMarkingsService;
  let cache: TextureCache;

  beforeEach(() => {
    service = new FieldMarkingsService();
    cache = new TextureCache();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('generateFieldTexture', () => {
    it('should generate a texture for soccer field', () => {
      const texture = service.generateFieldTexture('soccer');

      expect(texture).toBeDefined();
      expect(texture).toBeInstanceOf(MockCanvasTexture);
    });

    it('should generate a texture for basketball court', () => {
      const texture = service.generateFieldTexture('basketball');

      expect(texture).toBeDefined();
      expect(texture).toBeInstanceOf(MockCanvasTexture);
    });

    it('should generate a texture for tennis court', () => {
      const texture = service.generateFieldTexture('tennis');

      expect(texture).toBeDefined();
      expect(texture).toBeInstanceOf(MockCanvasTexture);
    });

    it('should use custom dimensions when provided', () => {
      const customDimensions = { length: 100, width: 50 };
      const texture = service.generateFieldTexture('soccer', customDimensions);

      expect(texture).toBeDefined();
    });

    it('should cache generated textures', () => {
      const texture1 = service.generateFieldTexture('soccer');
      const texture2 = service.generateFieldTexture('soccer');

      // Should return the same cached texture
      expect(texture1).toBe(texture2);
    });

    it('should return null for unknown sport type', () => {
      const texture = service.generateFieldTexture('unknown' as any);

      expect(texture).toBeNull();
    });
  });

  describe('hasFieldMarkings', () => {
    it('should return true for supported sports', () => {
      expect(FieldMarkingsService.hasFieldMarkings('soccer')).toBe(true);
      expect(FieldMarkingsService.hasFieldMarkings('basketball')).toBe(true);
      expect(FieldMarkingsService.hasFieldMarkings('tennis')).toBe(true);
    });

    it('should return false for unsupported sports', () => {
      expect(FieldMarkingsService.hasFieldMarkings('cricket')).toBe(false);
      expect(FieldMarkingsService.hasFieldMarkings('baseball')).toBe(false);
    });
  });

  describe('getAvailableSports', () => {
    it('should return list of available sports', () => {
      const sports = FieldMarkingsService.getAvailableSports();

      expect(sports).toContain('soccer');
      expect(sports).toContain('basketball');
      expect(sports).toContain('tennis');
      expect(sports.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('cache management', () => {
    it('should clear cache when requested', () => {
      service.generateFieldTexture('soccer');
      const stats1 = service.getCacheStats();
      expect(stats1.size).toBeGreaterThan(0);

      service.clearCache();
      const stats2 = service.getCacheStats();
      expect(stats2.size).toBe(0);
    });

    it('should preload common fields', () => {
      service.preloadCommonFields();
      const stats = service.getCacheStats();

      expect(stats.size).toBeGreaterThanOrEqual(3); // At least soccer, basketball, tennis
    });
  });

  describe('texture generation details', () => {
    it('should create texture with correct resolution', () => {
      const texture = service.generateFieldTexture('soccer', undefined, 2048);

      if (texture && texture instanceof MockCanvasTexture) {
        const canvas = texture.canvas;
        expect(Math.max(canvas.width, canvas.height)).toBe(2048);
      }
    });

    it('should maintain aspect ratio', () => {
      const texture = service.generateFieldTexture('soccer'); // 105:68 ratio

      if (texture && texture instanceof MockCanvasTexture) {
        const canvas = texture.canvas;
        const aspectRatio = canvas.width / canvas.height;
        const expectedRatio = 105 / 68;

        expect(aspectRatio).toBeCloseTo(expectedRatio, 1);
      }
    });
  });
});