/**
 * Professional alignment detection service for Land Visualizer
 * Provides Canva/CAD-style alignment guides during shape manipulation
 */

import type { Point2D, Shape } from '../types';

export interface AlignmentGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  start: Point2D;
  end: Point2D;
  sourceShapeId: string;
  targetShapeIds: string[];
  alignmentType: 'center' | 'edge-start' | 'edge-end' | 'equal-spacing';
  strength: number;
  metadata?: {
    description?: string;
    offset?: number;
    spacing?: number;
  };
}

export interface ShapeBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export interface AlignmentConfig {
  enabled: boolean;
  alignmentThreshold: number; // Distance in pixels to trigger alignment
  snapStrength: number; // Strength of magnetic snapping (0-1)
  showCenterGuides: boolean;
  showEdgeGuides: boolean;
  showSpacingGuides: boolean;
  maxGuides: number; // Maximum number of guides to show simultaneously
}

export class AlignmentService {
  private boundsCache = new Map<string, ShapeBounds>();
  private alignmentThreshold = 5; // Default 5px threshold
  
  /**
   * Calculate bounds for a shape
   */
  calculateShapeBounds(shape: Shape): ShapeBounds {
    const cacheKey = `${shape.id}_${shape.points.length}_${shape.rotation || 0}`;
    const cached = this.boundsCache.get(cacheKey);
    if (cached) return cached;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // Get all points considering shape type
    const points = this.getShapePoints(shape);
    
    // Apply rotation if exists
    const rotatedPoints = shape.rotation 
      ? this.rotatePoints(points, shape.rotation, this.getShapeCenter(shape))
      : points;

    for (const point of rotatedPoints) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    const bounds: ShapeBounds = {
      left: minX,
      right: maxX,
      top: maxY,
      bottom: minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };

    this.boundsCache.set(cacheKey, bounds);
    return bounds;
  }

  /**
   * Get all effective points for a shape
   */
  private getShapePoints(shape: Shape): Point2D[] {
    switch (shape.type) {
      case 'rectangle':
        return this.getRectanglePoints(shape);
      case 'circle':
        return this.getCirclePoints(shape);
      case 'line':
      case 'polygon':
        return shape.points;
      default:
        return shape.points;
    }
  }

  /**
   * Get rectangle corner points
   */
  private getRectanglePoints(shape: Shape): Point2D[] {
    if (shape.points.length === 2) {
      const [p1, p2] = shape.points;
      return [
        p1,
        { x: p2.x, y: p1.y },
        p2,
        { x: p1.x, y: p2.y }
      ];
    }
    return shape.points.slice(0, 4);
  }

  /**
   * Get circle bounding points
   */
  private getCirclePoints(shape: Shape): Point2D[] {
    if (shape.points.length < 2) return shape.points;
    
    const [center, radiusPoint] = shape.points;
    const radius = Math.sqrt(
      Math.pow(radiusPoint.x - center.x, 2) + 
      Math.pow(radiusPoint.y - center.y, 2)
    );

    // Return bounding box corners for circle
    return [
      { x: center.x - radius, y: center.y - radius },
      { x: center.x + radius, y: center.y - radius },
      { x: center.x + radius, y: center.y + radius },
      { x: center.x - radius, y: center.y + radius }
    ];
  }

  /**
   * Get shape center point
   */
  private getShapeCenter(shape: Shape): Point2D {
    const bounds = this.calculateShapeBounds(shape);
    return { x: bounds.centerX, y: bounds.centerY };
  }

  /**
   * Rotate points around a center
   */
  private rotatePoints(points: Point2D[], angle: number, center: Point2D): Point2D[] {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return points.map(point => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos
      };
    });
  }

  /**
   * Detect alignment guides for a moving shape against static shapes
   */
  detectAlignmentGuides(
    movingShape: Shape,
    staticShapes: Shape[],
    config: AlignmentConfig
  ): AlignmentGuide[] {
    if (!config.enabled) return [];

    const guides: AlignmentGuide[] = [];
    const movingBounds = this.calculateShapeBounds(movingShape);

    for (const targetShape of staticShapes) {
      if (targetShape.id === movingShape.id) continue;
      
      const targetBounds = this.calculateShapeBounds(targetShape);

      // Check center alignments
      if (config.showCenterGuides) {
        guides.push(...this.detectCenterAlignments(
          movingShape, movingBounds, targetShape, targetBounds, config
        ));
      }

      // Check edge alignments
      if (config.showEdgeGuides) {
        guides.push(...this.detectEdgeAlignments(
          movingShape, movingBounds, targetShape, targetBounds, config
        ));
      }
    }

    // Check spacing alignments
    if (config.showSpacingGuides && staticShapes.length >= 2) {
      guides.push(...this.detectSpacingAlignments(
        movingShape, movingBounds, staticShapes, config
      ));
    }

    // Sort guides by strength and limit to maxGuides
    return guides
      .sort((a, b) => b.strength - a.strength)
      .slice(0, config.maxGuides);
  }

  /**
   * Detect center-to-center alignments
   */
  private detectCenterAlignments(
    movingShape: Shape,
    movingBounds: ShapeBounds,
    targetShape: Shape,
    targetBounds: ShapeBounds,
    config: AlignmentConfig
  ): AlignmentGuide[] {
    const guides: AlignmentGuide[] = [];

    // Vertical center alignment
    const vDiff = Math.abs(movingBounds.centerX - targetBounds.centerX);
    if (vDiff <= config.alignmentThreshold) {
      guides.push({
        id: `center_v_${movingShape.id}_${targetShape.id}`,
        type: 'vertical',
        position: targetBounds.centerX,
        start: { x: targetBounds.centerX, y: Math.min(movingBounds.bottom, targetBounds.bottom) },
        end: { x: targetBounds.centerX, y: Math.max(movingBounds.top, targetBounds.top) },
        sourceShapeId: movingShape.id,
        targetShapeIds: [targetShape.id],
        alignmentType: 'center',
        strength: 1 - (vDiff / config.alignmentThreshold),
        metadata: {
          description: 'Vertical center alignment'
        }
      });
    }

    // Horizontal center alignment
    const hDiff = Math.abs(movingBounds.centerY - targetBounds.centerY);
    if (hDiff <= config.alignmentThreshold) {
      guides.push({
        id: `center_h_${movingShape.id}_${targetShape.id}`,
        type: 'horizontal',
        position: targetBounds.centerY,
        start: { x: Math.min(movingBounds.left, targetBounds.left), y: targetBounds.centerY },
        end: { x: Math.max(movingBounds.right, targetBounds.right), y: targetBounds.centerY },
        sourceShapeId: movingShape.id,
        targetShapeIds: [targetShape.id],
        alignmentType: 'center',
        strength: 1 - (hDiff / config.alignmentThreshold),
        metadata: {
          description: 'Horizontal center alignment'
        }
      });
    }

    return guides;
  }

  /**
   * Detect edge-to-edge alignments
   */
  private detectEdgeAlignments(
    movingShape: Shape,
    movingBounds: ShapeBounds,
    targetShape: Shape,
    targetBounds: ShapeBounds,
    config: AlignmentConfig
  ): AlignmentGuide[] {
    const guides: AlignmentGuide[] = [];

    // Left edge alignments
    const leftDiff = Math.abs(movingBounds.left - targetBounds.left);
    if (leftDiff <= config.alignmentThreshold) {
      guides.push({
        id: `edge_left_${movingShape.id}_${targetShape.id}`,
        type: 'vertical',
        position: targetBounds.left,
        start: { x: targetBounds.left, y: Math.min(movingBounds.bottom, targetBounds.bottom) },
        end: { x: targetBounds.left, y: Math.max(movingBounds.top, targetBounds.top) },
        sourceShapeId: movingShape.id,
        targetShapeIds: [targetShape.id],
        alignmentType: 'edge-start',
        strength: 1 - (leftDiff / config.alignmentThreshold),
        metadata: {
          description: 'Left edge alignment'
        }
      });
    }

    // Right edge alignments
    const rightDiff = Math.abs(movingBounds.right - targetBounds.right);
    if (rightDiff <= config.alignmentThreshold) {
      guides.push({
        id: `edge_right_${movingShape.id}_${targetShape.id}`,
        type: 'vertical',
        position: targetBounds.right,
        start: { x: targetBounds.right, y: Math.min(movingBounds.bottom, targetBounds.bottom) },
        end: { x: targetBounds.right, y: Math.max(movingBounds.top, targetBounds.top) },
        sourceShapeId: movingShape.id,
        targetShapeIds: [targetShape.id],
        alignmentType: 'edge-end',
        strength: 1 - (rightDiff / config.alignmentThreshold),
        metadata: {
          description: 'Right edge alignment'
        }
      });
    }

    // Top edge alignments
    const topDiff = Math.abs(movingBounds.top - targetBounds.top);
    if (topDiff <= config.alignmentThreshold) {
      guides.push({
        id: `edge_top_${movingShape.id}_${targetShape.id}`,
        type: 'horizontal',
        position: targetBounds.top,
        start: { x: Math.min(movingBounds.left, targetBounds.left), y: targetBounds.top },
        end: { x: Math.max(movingBounds.right, targetBounds.right), y: targetBounds.top },
        sourceShapeId: movingShape.id,
        targetShapeIds: [targetShape.id],
        alignmentType: 'edge-end',
        strength: 1 - (topDiff / config.alignmentThreshold),
        metadata: {
          description: 'Top edge alignment'
        }
      });
    }

    // Bottom edge alignments
    const bottomDiff = Math.abs(movingBounds.bottom - targetBounds.bottom);
    if (bottomDiff <= config.alignmentThreshold) {
      guides.push({
        id: `edge_bottom_${movingShape.id}_${targetShape.id}`,
        type: 'horizontal',
        position: targetBounds.bottom,
        start: { x: Math.min(movingBounds.left, targetBounds.left), y: targetBounds.bottom },
        end: { x: Math.max(movingBounds.right, targetBounds.right), y: targetBounds.bottom },
        sourceShapeId: movingShape.id,
        targetShapeIds: [targetShape.id],
        alignmentType: 'edge-start',
        strength: 1 - (bottomDiff / config.alignmentThreshold),
        metadata: {
          description: 'Bottom edge alignment'
        }
      });
    }

    return guides;
  }

  /**
   * Detect equal spacing alignments
   */
  private detectSpacingAlignments(
    movingShape: Shape,
    movingBounds: ShapeBounds,
    staticShapes: Shape[],
    config: AlignmentConfig
  ): AlignmentGuide[] {
    const guides: AlignmentGuide[] = [];

    // Find pairs of shapes to check spacing against
    for (let i = 0; i < staticShapes.length - 1; i++) {
      const shape1 = staticShapes[i];
      const shape2 = staticShapes[i + 1];
      
      if (shape1.id === movingShape.id || shape2.id === movingShape.id) continue;

      const bounds1 = this.calculateShapeBounds(shape1);
      const bounds2 = this.calculateShapeBounds(shape2);

      // Check horizontal spacing
      const hSpacing1 = Math.abs(bounds1.centerX - movingBounds.centerX);
      const hSpacing2 = Math.abs(bounds2.centerX - movingBounds.centerX);
      const hSpacingDiff = Math.abs(hSpacing1 - hSpacing2);

      if (hSpacingDiff <= config.alignmentThreshold) {
        const avgSpacing = (hSpacing1 + hSpacing2) / 2;
        guides.push({
          id: `spacing_h_${movingShape.id}_${shape1.id}_${shape2.id}`,
          type: 'vertical',
          position: movingBounds.centerX,
          start: { x: movingBounds.centerX, y: Math.min(bounds1.bottom, bounds2.bottom, movingBounds.bottom) },
          end: { x: movingBounds.centerX, y: Math.max(bounds1.top, bounds2.top, movingBounds.top) },
          sourceShapeId: movingShape.id,
          targetShapeIds: [shape1.id, shape2.id],
          alignmentType: 'equal-spacing',
          strength: 1 - (hSpacingDiff / config.alignmentThreshold),
          metadata: {
            description: 'Equal horizontal spacing',
            spacing: avgSpacing
          }
        });
      }

      // Check vertical spacing
      const vSpacing1 = Math.abs(bounds1.centerY - movingBounds.centerY);
      const vSpacing2 = Math.abs(bounds2.centerY - movingBounds.centerY);
      const vSpacingDiff = Math.abs(vSpacing1 - vSpacing2);

      if (vSpacingDiff <= config.alignmentThreshold) {
        const avgSpacing = (vSpacing1 + vSpacing2) / 2;
        guides.push({
          id: `spacing_v_${movingShape.id}_${shape1.id}_${shape2.id}`,
          type: 'horizontal',
          position: movingBounds.centerY,
          start: { x: Math.min(bounds1.left, bounds2.left, movingBounds.left), y: movingBounds.centerY },
          end: { x: Math.max(bounds1.right, bounds2.right, movingBounds.right), y: movingBounds.centerY },
          sourceShapeId: movingShape.id,
          targetShapeIds: [shape1.id, shape2.id],
          alignmentType: 'equal-spacing',
          strength: 1 - (vSpacingDiff / config.alignmentThreshold),
          metadata: {
            description: 'Equal vertical spacing',
            spacing: avgSpacing
          }
        });
      }
    }

    return guides;
  }

  /**
   * Apply magnetic snapping based on alignment guides
   */
  applyMagneticSnapping(
    position: Point2D,
    guides: AlignmentGuide[],
    snapStrength: number
  ): { snappedPosition: Point2D; activeGuides: AlignmentGuide[] } {
    if (guides.length === 0) {
      return { snappedPosition: position, activeGuides: [] };
    }

    let snappedX = position.x;
    let snappedY = position.y;
    const activeGuides: AlignmentGuide[] = [];

    // Find strongest vertical guide
    const verticalGuides = guides.filter(g => g.type === 'vertical');
    if (verticalGuides.length > 0) {
      const strongestVertical = verticalGuides[0];
      const snapDistance = Math.abs(position.x - strongestVertical.position);
      
      if (snapDistance <= 5 * snapStrength) {
        snappedX = strongestVertical.position;
        activeGuides.push(strongestVertical);
      }
    }

    // Find strongest horizontal guide
    const horizontalGuides = guides.filter(g => g.type === 'horizontal');
    if (horizontalGuides.length > 0) {
      const strongestHorizontal = horizontalGuides[0];
      const snapDistance = Math.abs(position.y - strongestHorizontal.position);
      
      if (snapDistance <= 5 * snapStrength) {
        snappedY = strongestHorizontal.position;
        activeGuides.push(strongestHorizontal);
      }
    }

    return {
      snappedPosition: { x: snappedX, y: snappedY },
      activeGuides
    };
  }

  /**
   * Clear bounds cache for specific shape or all shapes
   */
  clearBoundsCache(shapeId?: string): void {
    if (shapeId) {
      for (const key of this.boundsCache.keys()) {
        if (key.startsWith(shapeId)) {
          this.boundsCache.delete(key);
        }
      }
    } else {
      this.boundsCache.clear();
    }
  }

  /**
   * Get debug information about alignment detection
   */
  getDebugInfo(): {
    boundsCacheSize: number;
    alignmentThreshold: number;
  } {
    return {
      boundsCacheSize: this.boundsCache.size,
      alignmentThreshold: this.alignmentThreshold
    };
  }
}

// Export singleton instance
export const alignmentService = new AlignmentService();