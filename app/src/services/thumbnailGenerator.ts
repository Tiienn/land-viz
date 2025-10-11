import type { Shape } from '../types';
import { logger } from '../utils/logger';

/**
 * Thumbnail Generator Service
 * Creates preview images of templates using Canvas 2D API
 */

export class ThumbnailGenerator {
  private readonly THUMBNAIL_WIDTH = 200;
  private readonly THUMBNAIL_HEIGHT = 150;
  private readonly PADDING = 10;

  /**
   * Generate thumbnail from shapes
   */
  generateFromShapes(shapes: Shape[]): string {
    if (shapes.length === 0) {
      return this.generateEmptyThumbnail();
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.THUMBNAIL_WIDTH;
    canvas.height = this.THUMBNAIL_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return this.generateEmptyThumbnail();
    }

    // Set background
    ctx.fillStyle = '#F9FAFB'; // Light gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate bounding box of all shapes
    const bounds = this.calculateBounds(shapes);

    // Calculate scale to fit shapes in thumbnail
    const scaleX = (this.THUMBNAIL_WIDTH - 2 * this.PADDING) / bounds.width;
    const scaleY = (this.THUMBNAIL_HEIGHT - 2 * this.PADDING) / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    // Center the shapes
    const offsetX = this.THUMBNAIL_WIDTH / 2 - (bounds.centerX * scale);
    const offsetY = this.THUMBNAIL_HEIGHT / 2 - (bounds.centerY * scale);

    // Draw each shape
    ctx.strokeStyle = '#3B82F6'; // Blue outline
    ctx.fillStyle = '#3B82F610'; // Light blue fill
    ctx.lineWidth = 2;

    shapes.forEach((shape) => {
      this.drawShape(ctx, shape, scale, offsetX, offsetY);
    });

    // Convert to data URL
    return canvas.toDataURL('image/png');
  }

  /**
   * Generate thumbnail from current canvas
   */
  generateFromCanvas(canvas: HTMLCanvasElement): string {
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.THUMBNAIL_WIDTH;
      tempCanvas.height = this.THUMBNAIL_HEIGHT;

      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        return this.generateEmptyThumbnail();
      }

      // Draw scaled version of source canvas
      ctx.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        this.THUMBNAIL_WIDTH,
        this.THUMBNAIL_HEIGHT
      );

      return tempCanvas.toDataURL('image/png');
    } catch (error) {
      logger.error('[ThumbnailGenerator] Failed to generate from canvas:', error);
      return this.generateEmptyThumbnail();
    }
  }

  /**
   * Draw individual shape on canvas
   */
  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void {
    ctx.beginPath();

    const points = shape.points.map((p) => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    }));

    if (shape.type === 'circle') {
      const center = points[0];
      const radius = Math.hypot(
        points[1].x - center.x,
        points[1].y - center.y
      );
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    } else {
      // Rectangle or polyline
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
    }

    ctx.fill();
    ctx.stroke();
  }

  /**
   * Calculate bounding box of shapes
   */
  private calculateBounds(shapes: Shape[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  } {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    shapes.forEach((shape) => {
      shape.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    });

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  /**
   * Generate placeholder thumbnail
   */
  private generateEmptyThumbnail(): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.THUMBNAIL_WIDTH;
    canvas.height = this.THUMBNAIL_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Gray background
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Placeholder icon (simple house shape)
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#E5E7EB';

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw simple house
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 30);
    ctx.lineTo(centerX + 30, centerY);
    ctx.lineTo(centerX + 30, centerY + 30);
    ctx.lineTo(centerX - 30, centerY + 30);
    ctx.lineTo(centerX - 30, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    return canvas.toDataURL('image/png');
  }
}

// Export singleton instance
export const thumbnailGenerator = new ThumbnailGenerator();
