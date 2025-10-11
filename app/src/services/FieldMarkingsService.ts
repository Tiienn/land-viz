/**
 * Service for generating sports field marking textures
 * Uses HTML Canvas API to draw markings and converts to Three.js textures
 */

import * as THREE from 'three';
import { FIELD_MARKING_CONFIGS } from '../data/fieldMarkingsConfig';
import { TextureCache, getTextureCacheInstance } from '../utils/TextureCache';
import { logger } from '../utils/logger';
import type {
  SportType,
  FieldDimensions,
  FieldMarkingConfig,
  LineMarking,
  CircleMarking,
  ArcMarking,
  RectangleMarking
} from '../types/fieldMarkings';

export class FieldMarkingsService {
  private cache: TextureCache;
  private defaultResolution: number = 2048;

  constructor() {
    this.cache = getTextureCacheInstance();
  }

  /**
   * Generate field texture with markings
   */
  generateFieldTexture(
    sport: SportType,
    dimensions?: FieldDimensions,
    resolution?: number
  ): THREE.Texture | null {
    const config = FIELD_MARKING_CONFIGS[sport];
    if (!config) {
      logger.warn(`[FieldMarkingsService] No marking configuration found for sport: ${sport}`);
      return null;
    }

    // Use provided dimensions or standard dimensions
    const fieldDimensions = dimensions || config.standardDimensions;

    // Check cache first
    const cacheKey = TextureCache.generateKey(
      sport,
      fieldDimensions.length,
      fieldDimensions.width
    );

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate new texture
    const texture = this.createFieldTexture(
      config,
      fieldDimensions,
      resolution || this.defaultResolution
    );

    // Add to cache
    if (texture) {
      this.cache.set(cacheKey, texture);
    }

    return texture;
  }

  /**
   * Create field texture from configuration
   */
  private createFieldTexture(
    config: FieldMarkingConfig,
    dimensions: FieldDimensions,
    resolution: number
  ): THREE.Texture {
    // Calculate canvas dimensions maintaining aspect ratio
    const aspectRatio = dimensions.length / dimensions.width;
    let canvasWidth: number;
    let canvasHeight: number;

    if (aspectRatio > 1) {
      canvasWidth = resolution;
      canvasHeight = Math.round(resolution / aspectRatio);
    } else {
      canvasHeight = resolution;
      canvasWidth = Math.round(resolution * aspectRatio);
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background if specified
    if (config.colors.background) {
      ctx.fillStyle = config.colors.background;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw markings
    this.drawFieldMarkings(ctx, config, canvasWidth, canvasHeight);

    // Create Three.js texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Draw all field markings on canvas
   */
  private drawFieldMarkings(
    ctx: CanvasRenderingContext2D,
    config: FieldMarkingConfig,
    width: number,
    height: number
  ): void {
    // Set drawing styles
    ctx.strokeStyle = config.colors.lines;
    ctx.fillStyle = config.colors.fill || config.colors.lines;
    ctx.lineWidth = config.lineWidth * width;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw rectangles first (including boundary)
    config.markings.rectangles.forEach(rect => {
      this.drawRectangle(ctx, rect, width, height);
    });

    // Draw lines
    config.markings.lines.forEach(line => {
      this.drawLine(ctx, line, width, height);
    });

    // Draw circles
    config.markings.circles.forEach(circle => {
      this.drawCircle(ctx, circle, width, height);
    });

    // Draw arcs last
    config.markings.arcs.forEach(arc => {
      this.drawArc(ctx, arc, width, height);
    });
  }

  /**
   * Draw a line marking
   */
  private drawLine(
    ctx: CanvasRenderingContext2D,
    line: LineMarking,
    width: number,
    height: number
  ): void {
    const startX = line.start.x * width;
    const startY = line.start.y * height;
    const endX = line.end.x * width;
    const endY = line.end.y * height;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);

    if (line.width) {
      const oldWidth = ctx.lineWidth;
      ctx.lineWidth = line.width * width;
      ctx.stroke();
      ctx.lineWidth = oldWidth;
    } else {
      ctx.stroke();
    }
  }

  /**
   * Draw a circle marking
   */
  private drawCircle(
    ctx: CanvasRenderingContext2D,
    circle: CircleMarking,
    width: number,
    height: number
  ): void {
    const centerX = circle.center.x * width;
    const centerY = circle.center.y * height;
    // Use the smaller dimension for radius to maintain circle shape
    const radiusScale = Math.min(width, height);
    const radius = circle.radius * radiusScale;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    if (circle.filled) {
      ctx.fill();
    } else {
      if (circle.strokeWidth) {
        const oldWidth = ctx.lineWidth;
        ctx.lineWidth = circle.strokeWidth * width;
        ctx.stroke();
        ctx.lineWidth = oldWidth;
      } else {
        ctx.stroke();
      }
    }
  }

  /**
   * Draw an arc marking
   */
  private drawArc(
    ctx: CanvasRenderingContext2D,
    arc: ArcMarking,
    width: number,
    height: number
  ): void {
    const centerX = arc.center.x * width;
    const centerY = arc.center.y * height;
    const radiusScale = Math.min(width, height);
    const radius = arc.radius * radiusScale;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, arc.startAngle, arc.endAngle);

    if (arc.strokeWidth) {
      const oldWidth = ctx.lineWidth;
      ctx.lineWidth = arc.strokeWidth * width;
      ctx.stroke();
      ctx.lineWidth = oldWidth;
    } else {
      ctx.stroke();
    }
  }

  /**
   * Draw a rectangle marking
   */
  private drawRectangle(
    ctx: CanvasRenderingContext2D,
    rect: RectangleMarking,
    width: number,
    height: number
  ): void {
    const x = rect.topLeft.x * width;
    const y = rect.topLeft.y * height;
    const rectWidth = (rect.bottomRight.x - rect.topLeft.x) * width;
    const rectHeight = (rect.bottomRight.y - rect.topLeft.y) * height;

    if (rect.filled) {
      ctx.fillRect(x, y, rectWidth, rectHeight);
    } else {
      if (rect.strokeWidth) {
        const oldWidth = ctx.lineWidth;
        ctx.lineWidth = rect.strokeWidth * width;
        ctx.strokeRect(x, y, rectWidth, rectHeight);
        ctx.lineWidth = oldWidth;
      } else {
        ctx.strokeRect(x, y, rectWidth, rectHeight);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Preload common field textures
   */
  preloadCommonFields(): void {
    const commonFields: Array<{ sport: SportType; dimensions?: FieldDimensions }> = [
      { sport: 'soccer' },
      { sport: 'basketball' },
      { sport: 'tennis' }
    ];

    commonFields.forEach(field => {
      this.generateFieldTexture(field.sport, field.dimensions);
    });
  }

  /**
   * Check if a sport has field markings available
   */
  static hasFieldMarkings(sport: string): boolean {
    return sport in FIELD_MARKING_CONFIGS;
  }

  /**
   * Get available sports with markings
   */
  static getAvailableSports(): SportType[] {
    return Object.keys(FIELD_MARKING_CONFIGS) as SportType[];
  }
}

// Singleton instance
let serviceInstance: FieldMarkingsService | null = null;

export function getFieldMarkingsService(): FieldMarkingsService {
  if (!serviceInstance) {
    serviceInstance = new FieldMarkingsService();
  }
  return serviceInstance;
}

export function clearFieldMarkingsService(): void {
  if (serviceInstance) {
    serviceInstance.clearCache();
    serviceInstance = null;
  }
}