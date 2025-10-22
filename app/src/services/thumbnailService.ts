/**
 * Thumbnail Service
 *
 * Generates and caches layer thumbnails for the Layer Panel.
 * - 40×40px thumbnails (80×80px retina)
 * - Base64 data URLs for easy storage
 * - Automatic caching with invalidation
 * - Queue-based generation to avoid UI blocking
 */

import type { Layer, Point2D, Element } from '../types';
import { isShapeElement, isTextElement } from '../types';
import { useAppStore } from '../store/useAppStore';

// ================================
// THUMBNAIL CACHE CLASS
// ================================

/**
 * In-memory cache for layer thumbnails with queue-based generation
 */
class ThumbnailCache {
  private cache = new Map<string, string>();
  private queue: string[] = [];
  private generating = false;
  private generationPromises = new Map<string, Promise<string>>();

  /**
   * Get cached thumbnail for a layer
   */
  get(layerId: string): string | null {
    return this.cache.get(layerId) || null;
  }

  /**
   * Check if thumbnail exists in cache
   */
  has(layerId: string): boolean {
    return this.cache.has(layerId);
  }

  /**
   * Generate thumbnail for a layer (async, queued)
   */
  async generate(layerId: string): Promise<string> {
    // Return cached if available
    if (this.cache.has(layerId)) {
      return this.cache.get(layerId)!;
    }

    // Return existing promise if already generating
    if (this.generationPromises.has(layerId)) {
      return this.generationPromises.get(layerId)!;
    }

    // Create new generation promise
    const promise = new Promise<string>((resolve, reject) => {
      // Add to queue
      this.queue.push(layerId);

      // Start processing if not already running
      if (!this.generating) {
        this.processQueue();
      }

      // Poll for result
      const checkInterval = setInterval(() => {
        if (this.cache.has(layerId)) {
          clearInterval(checkInterval);
          this.generationPromises.delete(layerId);
          resolve(this.cache.get(layerId)!);
        }
      }, 50); // Check every 50ms

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        this.generationPromises.delete(layerId);
        reject(new Error(`Thumbnail generation timeout for layer ${layerId}`));
      }, 5000);
    });

    this.generationPromises.set(layerId, promise);
    return promise;
  }

  /**
   * Process thumbnail generation queue
   */
  private async processQueue() {
    this.generating = true;

    while (this.queue.length > 0) {
      const layerId = this.queue.shift()!;

      try {
        // Generate thumbnail
        const dataUrl = await this.generateThumbnailInternal(layerId);

        // Cache it
        this.cache.set(layerId, dataUrl);
      } catch (error) {
        // Cache empty placeholder on error
        this.cache.set(layerId, this.generatePlaceholder());
      }

      // Small delay to avoid blocking UI (60 FPS = 16ms per frame)
      await new Promise(resolve => setTimeout(resolve, 16));
    }

    this.generating = false;
  }

  /**
   * Internal thumbnail generation (synchronous canvas rendering)
   */
  private async generateThumbnailInternal(layerId: string): Promise<string> {
    const canvas = document.createElement('canvas');
    const size = 80; // Retina resolution
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    // Draw checkerboard background
    this.drawCheckerboard(ctx, size, size, 8);

    // Get layer elements and shapes
    // Safe fallback: elements might be undefined if migration hasn't run yet
    const elements = (useAppStore.getState().elements || []).filter(el => el.layerId === layerId);
    const shapes = (useAppStore.getState().shapes || []).filter(s => s.layerId === layerId);

    if (elements.length === 0 && shapes.length === 0) {
      // Empty layer - draw placeholder icon
      return this.generatePlaceholder();
    }

    // Convert shapes to ShapeElements for rendering
    const shapeElements: import('../types').ShapeElement[] = shapes.map(shape => ({
      elementType: 'shape' as const,
      id: shape.id,
      name: shape.name || `${shape.type} ${shape.id}`,
      visible: shape.visible ?? true,
      locked: shape.locked ?? false,
      layerId: shape.layerId,
      created: shape.created,
      modified: shape.modified,
      position: shape.points[0] || { x: 0, y: 0 },
      shapeType: shape.type,
      points: shape.points,
      color: shape.color,
      rotation: shape.rotation
    }));

    // Combine elements and shape elements
    const allElements = [...elements, ...shapeElements];

    // Calculate bounding box for all elements
    const bounds = this.calculateBounds(allElements);

    if (!bounds) {
      return this.generatePlaceholder();
    }

    // Scale to fit in canvas (with 80% fill to add padding)
    const scale = Math.min(
      (size * 0.8) / bounds.width,
      (size * 0.8) / bounds.height
    );

    // Center in canvas
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.scale(scale, scale);
    ctx.translate(-bounds.centerX, -bounds.centerY);

    // Render each element
    allElements.forEach(element => {
      if (isShapeElement(element)) {
        this.renderShapeToCanvas(ctx, element);
      } else if (isTextElement(element)) {
        this.renderTextToCanvas(ctx, element);
      }
    });

    ctx.restore();

    // Convert to data URL
    return canvas.toDataURL('image/png');
  }

  /**
   * Draw checkerboard pattern for transparency
   */
  private drawCheckerboard(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    squareSize: number
  ) {
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Light gray squares
    ctx.fillStyle = '#f3f4f6';
    for (let y = 0; y < height; y += squareSize) {
      for (let x = 0; x < width; x += squareSize) {
        if ((x / squareSize + y / squareSize) % 2 === 0) {
          ctx.fillRect(x, y, squareSize, squareSize);
        }
      }
    }
  }

  /**
   * Calculate bounding box for elements
   */
  private calculateBounds(elements: Element[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  } | null {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      if (isShapeElement(element)) {
        // Special handling for circles - include full radius extent
        if (element.shapeType === 'circle' && element.points.length >= 2) {
          const center = element.points[0];
          const edge = element.points[element.points.length - 1];
          const radius = Math.sqrt(
            Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
          );

          minX = Math.min(minX, center.x - radius);
          minY = Math.min(minY, center.y - radius);
          maxX = Math.max(maxX, center.x + radius);
          maxY = Math.max(maxY, center.y + radius);
        } else {
          // For other shapes, use all points
          element.points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
        }
      } else if (isTextElement(element)) {
        // Approximate text bounds (rough estimate)
        const textWidth = element.fontSize * element.content.length * 0.6;
        const textHeight = element.fontSize * 1.2;

        minX = Math.min(minX, element.position.x);
        minY = Math.min(minY, element.position.y);
        maxX = Math.max(maxX, element.position.x + textWidth);
        maxY = Math.max(maxY, element.position.y + textHeight);
      }
    });

    if (!isFinite(minX)) {
      return null;
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  /**
   * Render shape to canvas
   */
  private renderShapeToCanvas(
    ctx: CanvasRenderingContext2D,
    element: import('../types').ShapeElement
  ) {
    if (element.points.length < 2) return;

    ctx.save();

    // Apply rotation if exists
    if (element.rotation) {
      ctx.translate(element.rotation.center.x, element.rotation.center.y);
      ctx.rotate((element.rotation.angle * Math.PI) / 180);
      ctx.translate(-element.rotation.center.x, -element.rotation.center.y);
    }

    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.color;
    ctx.lineWidth = 1.5; // Thinner line for cleaner thumbnails
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();

    // Draw shape based on type
    switch (element.shapeType) {
      case 'rectangle':
        this.drawRectangle(ctx, element.points);
        break;

      case 'circle':
        this.drawCircle(ctx, element.points);
        break;

      case 'polyline':
      case 'polygon':
      case 'line':
        this.drawPolyline(ctx, element.points, element.shapeType !== 'line');
        break;
    }

    // Fill for closed shapes
    if (element.shapeType === 'rectangle' || element.shapeType === 'circle' || element.shapeType === 'polygon') {
      ctx.globalAlpha = 0.3; // Semi-transparent fill
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw rectangle path
   */
  private drawRectangle(ctx: CanvasRenderingContext2D, points: Point2D[]) {
    if (points.length < 2) return;

    if (points.length === 2) {
      // 2-point rectangle (diagonal corners)
      const x = Math.min(points[0].x, points[1].x);
      const y = Math.min(points[0].y, points[1].y);
      const width = Math.abs(points[1].x - points[0].x);
      const height = Math.abs(points[1].y - points[0].y);
      ctx.rect(x, y, width, height);
    } else {
      // 4-point rectangle
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
    }
  }

  /**
   * Draw circle path
   */
  private drawCircle(ctx: CanvasRenderingContext2D, points: Point2D[]) {
    if (points.length < 2) return;

    const center = points[0];
    const edge = points[points.length - 1];
    const radius = Math.sqrt(
      Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
    );

    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  }

  /**
   * Draw polyline/polygon path
   */
  private drawPolyline(ctx: CanvasRenderingContext2D, points: Point2D[], closePath: boolean) {
    if (points.length < 2) return;

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    if (closePath) {
      ctx.closePath();
    }
  }

  /**
   * Render text to canvas
   */
  private renderTextToCanvas(
    ctx: CanvasRenderingContext2D,
    element: import('../types').TextElement
  ) {
    ctx.save();

    // Apply text properties
    ctx.font = `${element.bold ? 'bold' : ''} ${element.italic ? 'italic' : ''} ${element.fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.color;
    ctx.textAlign = element.alignment as CanvasTextAlign;
    ctx.globalAlpha = element.opacity;

    // Simple rotation (around text position)
    if (element.rotation !== 0) {
      ctx.translate(element.position.x, element.position.y);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-element.position.x, -element.position.y);
    }

    // Background if exists
    if (element.backgroundColor && element.backgroundOpacity > 0) {
      const metrics = ctx.measureText(element.content);
      const padding = 4;
      ctx.globalAlpha = element.backgroundOpacity / 100;
      ctx.fillStyle = element.backgroundColor;
      ctx.fillRect(
        element.position.x - padding,
        element.position.y - element.fontSize - padding,
        metrics.width + padding * 2,
        element.fontSize + padding * 2
      );
    }

    // Draw text
    ctx.globalAlpha = element.opacity;
    ctx.fillStyle = element.color;
    ctx.fillText(element.content, element.position.x, element.position.y);

    ctx.restore();
  }

  /**
   * Generate placeholder thumbnail for empty/error layers
   */
  private generatePlaceholder(): string {
    const canvas = document.createElement('canvas');
    const size = 80;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    // Light gray background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, size, size);

    // Draw simple square icon
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(size * 0.25, size * 0.25, size * 0.5, size * 0.5);

    return canvas.toDataURL('image/png');
  }

  /**
   * Invalidate (remove) cached thumbnail for a layer
   */
  invalidate(layerId: string) {
    this.cache.delete(layerId);
  }

  /**
   * Invalidate multiple layer thumbnails
   */
  invalidateMany(layerIds: string[]) {
    layerIds.forEach(id => this.cache.delete(id));
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.queue = [];
    this.generationPromises.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cached: this.cache.size,
      queued: this.queue.length,
      generating: this.generating,
    };
  }
}

// Singleton instance
export const thumbnailCache = new ThumbnailCache();

// ================================
// PUBLIC API
// ================================

/**
 * Get thumbnail for a layer (from cache or generate)
 */
export async function getLayerThumbnail(layerId: string): Promise<string> {
  return thumbnailCache.generate(layerId);
}

/**
 * Get thumbnail synchronously (cached only, returns null if not cached)
 */
export function getLayerThumbnailSync(layerId: string): string | null {
  return thumbnailCache.get(layerId);
}

/**
 * Invalidate thumbnail cache for a layer
 */
export function invalidateLayerThumbnail(layerId: string) {
  thumbnailCache.invalidate(layerId);
}

/**
 * Invalidate thumbnail cache for multiple layers
 */
export function invalidateLayerThumbnails(layerIds: string[]) {
  thumbnailCache.invalidateMany(layerIds);
}

/**
 * Clear all cached thumbnails
 */
export function clearThumbnailCache() {
  thumbnailCache.clear();
}

/**
 * Get cache statistics
 */
export function getThumbnailCacheStats() {
  return thumbnailCache.getStats();
}
