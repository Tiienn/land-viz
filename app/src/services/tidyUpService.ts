/**
 * TidyUp Service - Canva-inspired automatic distribution and alignment
 * Implements smart distribution algorithms for seamless element organization
 */

import type { Point2D, Shape } from '../types';
import { AlignmentService, type ShapeBounds } from './alignmentService';

export interface TidyUpResult {
  success: boolean;
  distributedShapes: Array<{
    shapeId: string;
    originalPosition: Point2D;
    newPosition: Point2D;
    adjustmentVector: Point2D;
  }>;
  distributionType: 'horizontal' | 'vertical' | 'grid' | 'none';
  metadata: {
    totalAdjustments: number;
    averageSpacing: number;
    boundingArea: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      width: number;
      height: number;
    };
  };
}

export interface TidyUpOptions {
  preserveOverallBounds?: boolean; // Keep the overall arrangement within original bounds
  minimumSpacing?: number; // Minimum spacing between elements
  respectAspectRatio?: boolean; // Maintain relative positioning ratios
  preferredDirection?: 'horizontal' | 'vertical' | 'auto'; // Distribution preference
  alignToGrid?: boolean; // Snap final positions to grid
  smoothTransition?: boolean; // Enable animation-friendly positioning
}

export class TidyUpService {
  private alignmentService: AlignmentService;

  constructor() {
    this.alignmentService = new AlignmentService();
  }

  /**
   * Main TidyUp function - Canva's signature feature
   * Automatically distributes and aligns selected shapes
   */
  tidyUp(shapes: Shape[], options: TidyUpOptions = {}): TidyUpResult {
    if (shapes.length < 3) {
      return {
        success: false,
        distributedShapes: [],
        distributionType: 'none',
        metadata: {
          totalAdjustments: 0,
          averageSpacing: 0,
          boundingArea: { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }
        }
      };
    }

    // Step 1: Calculate current bounds for all shapes
    const shapeBounds = shapes.map(shape => ({
      shape,
      bounds: this.alignmentService.calculateShapeBounds(shape)
    }));

    // Step 2: Determine optimal distribution strategy
    const distributionType = this.determineDistributionType(shapeBounds, options);

    // Step 3: Calculate new positions based on strategy
    const distributedShapes = this.calculateDistributedPositions(
      shapeBounds,
      distributionType,
      options
    );

    // Step 4: Generate result metadata
    const metadata = this.calculateDistributionMetadata(distributedShapes, shapeBounds);

    return {
      success: true,
      distributedShapes,
      distributionType,
      metadata
    };
  }

  /**
   * Smart distribution type detection - mimics Canva's intelligence
   */
  private determineDistributionType(
    shapeBounds: Array<{ shape: Shape; bounds: ShapeBounds }>,
    options: TidyUpOptions
  ): 'horizontal' | 'vertical' | 'grid' {
    if (options.preferredDirection && options.preferredDirection !== 'auto') {
      return options.preferredDirection;
    }

    // Calculate overall arrangement dimensions
    const allBounds = shapeBounds.map(sb => sb.bounds);
    const minX = Math.min(...allBounds.map(b => b.left));
    const maxX = Math.max(...allBounds.map(b => b.right));
    const minY = Math.min(...allBounds.map(b => b.top));
    const maxY = Math.max(...allBounds.map(b => b.bottom));

    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;
    const aspectRatio = totalWidth / totalHeight;

    // Canva's heuristic: if arrangement is wider than it is tall, distribute horizontally
    if (aspectRatio > 1.5) {
      return 'horizontal';
    } else if (aspectRatio < 0.67) {
      return 'vertical';
    }

    // For square-ish arrangements, check element distribution pattern
    const horizontalVariance = this.calculatePositionVariance(allBounds.map(b => b.centerX));
    const verticalVariance = this.calculatePositionVariance(allBounds.map(b => b.centerY));

    // If elements are more spread out horizontally, distribute horizontally
    return horizontalVariance > verticalVariance ? 'horizontal' : 'vertical';
  }

  /**
   * Calculate optimal distributed positions
   */
  private calculateDistributedPositions(
    shapeBounds: Array<{ shape: Shape; bounds: ShapeBounds }>,
    distributionType: 'horizontal' | 'vertical' | 'grid',
    options: TidyUpOptions
  ): TidyUpResult['distributedShapes'] {
    const result: TidyUpResult['distributedShapes'] = [];

    if (distributionType === 'horizontal') {
      return this.distributeHorizontally(shapeBounds, options);
    } else if (distributionType === 'vertical') {
      return this.distributeVertically(shapeBounds, options);
    } else {
      return this.distributeInGrid(shapeBounds, options);
    }
  }

  /**
   * Horizontal distribution - Canva's most common use case
   */
  private distributeHorizontally(
    shapeBounds: Array<{ shape: Shape; bounds: ShapeBounds }>,
    options: TidyUpOptions
  ): TidyUpResult['distributedShapes'] {
    const result: TidyUpResult['distributedShapes'] = [];

    // Sort shapes by their current X position (left to right)
    const sortedShapes = [...shapeBounds].sort((a, b) => a.bounds.centerX - b.bounds.centerX);

    // Calculate available space and optimal spacing
    const leftmostBound = Math.min(...sortedShapes.map(sb => sb.bounds.left));
    const rightmostBound = Math.max(...sortedShapes.map(sb => sb.bounds.right));
    const totalOccupiedWidth = sortedShapes.reduce((sum, sb) => sum + sb.bounds.width, 0);
    const availableSpace = rightmostBound - leftmostBound - totalOccupiedWidth;
    const gaps = sortedShapes.length - 1;
    const optimalSpacing = Math.max(availableSpace / gaps, options.minimumSpacing || 8);

    // Align all shapes to the same Y position (center them vertically)
    const averageY = sortedShapes.reduce((sum, sb) => sum + sb.bounds.centerY, 0) / sortedShapes.length;

    // Calculate new positions
    let currentX = leftmostBound;

    for (const shapeData of sortedShapes) {
      const { shape, bounds } = shapeData;

      // Calculate center position for this shape
      const newCenterX = currentX + bounds.width / 2;
      const newCenterY = averageY;

      // Convert center position back to shape's coordinate system
      const newPosition = this.centerToShapePosition(
        { x: newCenterX, y: newCenterY },
        shape,
        bounds
      );

      const originalCenter = { x: bounds.centerX, y: bounds.centerY };
      const newCenter = { x: newCenterX, y: newCenterY };

      result.push({
        shapeId: shape.id,
        originalPosition: this.centerToShapePosition(originalCenter, shape, bounds),
        newPosition,
        adjustmentVector: {
          x: newCenter.x - originalCenter.x,
          y: newCenter.y - originalCenter.y
        }
      });

      currentX += bounds.width + optimalSpacing;
    }

    return result;
  }

  /**
   * Vertical distribution
   */
  private distributeVertically(
    shapeBounds: Array<{ shape: Shape; bounds: ShapeBounds }>,
    options: TidyUpOptions
  ): TidyUpResult['distributedShapes'] {
    const result: TidyUpResult['distributedShapes'] = [];

    // Sort shapes by their current Y position (top to bottom)
    const sortedShapes = [...shapeBounds].sort((a, b) => a.bounds.centerY - b.bounds.centerY);

    // Calculate available space and optimal spacing
    const topmostBound = Math.min(...sortedShapes.map(sb => sb.bounds.top));
    const bottommostBound = Math.max(...sortedShapes.map(sb => sb.bounds.bottom));
    const totalOccupiedHeight = sortedShapes.reduce((sum, sb) => sum + sb.bounds.height, 0);
    const availableSpace = bottommostBound - topmostBound - totalOccupiedHeight;
    const gaps = sortedShapes.length - 1;
    const optimalSpacing = Math.max(availableSpace / gaps, options.minimumSpacing || 8);

    // Align all shapes to the same X position (center them horizontally)
    const averageX = sortedShapes.reduce((sum, sb) => sum + sb.bounds.centerX, 0) / sortedShapes.length;

    // Calculate new positions
    let currentY = topmostBound;

    for (const shapeData of sortedShapes) {
      const { shape, bounds } = shapeData;

      // Calculate center position for this shape
      const newCenterX = averageX;
      const newCenterY = currentY + bounds.height / 2;

      // Convert center position back to shape's coordinate system
      const newPosition = this.centerToShapePosition(
        { x: newCenterX, y: newCenterY },
        shape,
        bounds
      );

      const originalCenter = { x: bounds.centerX, y: bounds.centerY };
      const newCenter = { x: newCenterX, y: newCenterY };

      result.push({
        shapeId: shape.id,
        originalPosition: this.centerToShapePosition(originalCenter, shape, bounds),
        newPosition,
        adjustmentVector: {
          x: newCenter.x - originalCenter.x,
          y: newCenter.y - originalCenter.y
        }
      });

      currentY += bounds.height + optimalSpacing;
    }

    return result;
  }

  /**
   * Grid distribution for complex arrangements
   */
  private distributeInGrid(
    shapeBounds: Array<{ shape: Shape; bounds: ShapeBounds }>,
    options: TidyUpOptions
  ): TidyUpResult['distributedShapes'] {
    // For now, fall back to horizontal distribution
    // Grid distribution is complex and would require advanced layout algorithms
    return this.distributeHorizontally(shapeBounds, options);
  }

  /**
   * Convert center position to shape's coordinate system
   */
  private centerToShapePosition(
    center: Point2D,
    shape: Shape,
    bounds: ShapeBounds
  ): Point2D {
    // For most shapes, the first point represents the top-left or start position
    // Calculate offset from current center to new center
    const offsetX = center.x - bounds.centerX;
    const offsetY = center.y - bounds.centerY;

    // Apply offset to the first point (which is typically the reference point)
    const firstPoint = shape.points[0];
    return {
      x: firstPoint.x + offsetX,
      y: firstPoint.y + offsetY
    };
  }

  /**
   * Calculate position variance for distribution heuristics
   */
  private calculatePositionVariance(positions: number[]): number {
    const mean = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    const squaredDifferences = positions.map(pos => Math.pow(pos - mean, 2));
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / positions.length;
  }

  /**
   * Generate distribution metadata
   */
  private calculateDistributionMetadata(
    distributedShapes: TidyUpResult['distributedShapes'],
    originalShapeBounds: Array<{ shape: Shape; bounds: ShapeBounds }>
  ): TidyUpResult['metadata'] {
    // Calculate total adjustments made
    const totalAdjustments = distributedShapes.reduce((sum, ds) => {
      const adjustmentMagnitude = Math.sqrt(
        ds.adjustmentVector.x ** 2 + ds.adjustmentVector.y ** 2
      );
      return sum + adjustmentMagnitude;
    }, 0);

    // Calculate average spacing after distribution
    const bounds = originalShapeBounds.map(sb => sb.bounds);
    const minX = Math.min(...bounds.map(b => b.left));
    const maxX = Math.max(...bounds.map(b => b.right));
    const minY = Math.min(...bounds.map(b => b.top));
    const maxY = Math.max(...bounds.map(b => b.bottom));

    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;
    const shapeCount = bounds.length;

    // Estimate average spacing based on distribution area
    const averageSpacing = Math.min(totalWidth, totalHeight) / shapeCount;

    return {
      totalAdjustments,
      averageSpacing,
      boundingArea: {
        left: minX,
        right: maxX,
        top: minY,
        bottom: maxY,
        width: totalWidth,
        height: totalHeight
      }
    };
  }

  /**
   * Canva-style spacing presets
   */
  static getSpacingPresets() {
    return {
      tight: { minimumSpacing: 4 },
      normal: { minimumSpacing: 8 },
      relaxed: { minimumSpacing: 16 },
      loose: { minimumSpacing: 32 }
    };
  }

  /**
   * Quick access method for different Canva-style operations
   */
  spaceEvenly(shapes: Shape[], direction: 'horizontal' | 'vertical'): TidyUpResult {
    return this.tidyUp(shapes, {
      preferredDirection: direction,
      preserveOverallBounds: true,
      minimumSpacing: 8
    });
  }

  /**
   * One-click tidy up with smart detection (Canva's main feature)
   */
  autoTidyUp(shapes: Shape[]): TidyUpResult {
    return this.tidyUp(shapes, {
      preferredDirection: 'auto',
      preserveOverallBounds: true,
      minimumSpacing: 8,
      respectAspectRatio: true
    });
  }
}