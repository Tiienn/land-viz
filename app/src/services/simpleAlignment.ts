/**
 * Simple Alignment System for Land Visualizer
 * Provides Canva-style alignment guides without complex dependencies
 */

import type { Shape } from '../types/index';

export interface AlignmentGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number; // x for vertical, y for horizontal
  start: number;    // start coordinate
  end: number;      // end coordinate
  shapes: string[]; // IDs of shapes involved
}

export interface SpacingMeasurement {
  id: string;
  distance: number;
  position: { x: number; y: number }; // Position for the label
  direction: 'horizontal' | 'vertical';
  fromShape: string;
  toShape: string;
  isEqualDistribution?: boolean; // True when part of equal spacing
  targetSpacing?: number; // The target spacing for equal distribution
  isSnappable?: boolean; // True when close to achieving equal spacing
}

export interface ShapeSequence {
  id: string;
  shapes: string[]; // Ordered shape IDs
  direction: 'horizontal' | 'vertical';
  spacings: number[]; // Distances between consecutive shapes
  isEquallySpaced: boolean;
  patternSpacing?: number; // Target spacing for equal distribution
  bounds: { left: number; right: number; top: number; bottom: number };
}

export interface AlignmentResult {
  guides: AlignmentGuide[];
  spacings: SpacingMeasurement[];
  snapPosition?: { x: number; y: number };
  sequences?: ShapeSequence[]; // New property for shape sequences
}

export class SimpleAlignment {
  private static readonly THRESHOLD = 5; // pixels
  private static readonly SEQUENCE_ALIGNMENT_THRESHOLD = 15; // pixels for sequence detection
  private static readonly EQUAL_SPACING_TOLERANCE = 3; // meters tolerance for equal spacing

  /**
   * Calculate bounds for a shape
   */
  static getShapeBounds(shape: Shape) {
    if (!shape.points || shape.points.length === 0) {
      return { left: 0, right: 0, top: 0, bottom: 0, centerX: 0, centerY: 0 };
    }

    const xs = shape.points.map(p => p.x);
    const ys = shape.points.map(p => p.y);

    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);

    return {
      left,
      right,
      top,
      bottom,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2
    };
  }

  /**
   * Detect sequences of aligned shapes (3 or more)
   */
  static detectShapeSequences(shapes: Shape[]): ShapeSequence[] {
    const sequences: ShapeSequence[] = [];

    if (shapes.length < 3) return sequences;

    // Detect horizontal sequences
    const horizontalGroups = new Map<number, Shape[]>();

    shapes.forEach(shape => {
      const bounds = this.getShapeBounds(shape);
      const centerY = bounds.centerY;

      // Find existing group with similar Y position
      let foundGroup = false;
      horizontalGroups.forEach((group, groupY) => {
        if (Math.abs(centerY - groupY) < this.SEQUENCE_ALIGNMENT_THRESHOLD) {
          group.push(shape);
          foundGroup = true;
        }
      });

      if (!foundGroup) {
        horizontalGroups.set(centerY, [shape]);
      }
    });

    // Process horizontal groups
    horizontalGroups.forEach(group => {
      if (group.length >= 3) {
        // Sort shapes by X position (left to right)
        group.sort((a, b) => {
          const boundsA = this.getShapeBounds(a);
          const boundsB = this.getShapeBounds(b);
          return boundsA.centerX - boundsB.centerX;
        });

        // Calculate spacings between consecutive shapes
        const spacings: number[] = [];
        for (let i = 0; i < group.length - 1; i++) {
          const bounds1 = this.getShapeBounds(group[i]);
          const bounds2 = this.getShapeBounds(group[i + 1]);
          const spacing = bounds2.left - bounds1.right;
          spacings.push(spacing);
        }

        // Check if spacings are equal
        const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
        const isEquallySpaced = spacings.every(spacing =>
          Math.abs(spacing - avgSpacing) <= this.EQUAL_SPACING_TOLERANCE
        );

        // Calculate overall bounds
        const groupBounds = group.reduce((acc, shape) => {
          const bounds = this.getShapeBounds(shape);
          return {
            left: Math.min(acc.left, bounds.left),
            right: Math.max(acc.right, bounds.right),
            top: Math.min(acc.top, bounds.top),
            bottom: Math.max(acc.bottom, bounds.bottom)
          };
        }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });

        sequences.push({
          id: `hseq-${group.map(s => s.id).join('-')}`,
          shapes: group.map(s => s.id),
          direction: 'horizontal',
          spacings,
          isEquallySpaced,
          patternSpacing: isEquallySpaced ? avgSpacing : undefined,
          bounds: groupBounds
        });
      }
    });

    // Detect vertical sequences
    const verticalGroups = new Map<number, Shape[]>();

    shapes.forEach(shape => {
      const bounds = this.getShapeBounds(shape);
      const centerX = bounds.centerX;

      // Find existing group with similar X position
      let foundGroup = false;
      verticalGroups.forEach((group, groupX) => {
        if (Math.abs(centerX - groupX) < this.SEQUENCE_ALIGNMENT_THRESHOLD) {
          group.push(shape);
          foundGroup = true;
        }
      });

      if (!foundGroup) {
        verticalGroups.set(centerX, [shape]);
      }
    });

    // Process vertical groups
    verticalGroups.forEach(group => {
      if (group.length >= 3) {
        // Sort shapes by Y position (top to bottom)
        group.sort((a, b) => {
          const boundsA = this.getShapeBounds(a);
          const boundsB = this.getShapeBounds(b);
          return boundsA.centerY - boundsB.centerY;
        });

        // Calculate spacings between consecutive shapes
        const spacings: number[] = [];
        for (let i = 0; i < group.length - 1; i++) {
          const bounds1 = this.getShapeBounds(group[i]);
          const bounds2 = this.getShapeBounds(group[i + 1]);
          const spacing = bounds2.top - bounds1.bottom;
          spacings.push(spacing);
        }

        // Check if spacings are equal
        const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
        const isEquallySpaced = spacings.every(spacing =>
          Math.abs(spacing - avgSpacing) <= this.EQUAL_SPACING_TOLERANCE
        );

        // Calculate overall bounds
        const groupBounds = group.reduce((acc, shape) => {
          const bounds = this.getShapeBounds(shape);
          return {
            left: Math.min(acc.left, bounds.left),
            right: Math.max(acc.right, bounds.right),
            top: Math.min(acc.top, bounds.top),
            bottom: Math.max(acc.bottom, bounds.bottom)
          };
        }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });

        sequences.push({
          id: `vseq-${group.map(s => s.id).join('-')}`,
          shapes: group.map(s => s.id),
          direction: 'vertical',
          spacings,
          isEquallySpaced,
          patternSpacing: isEquallySpaced ? avgSpacing : undefined,
          bounds: groupBounds
        });
      }
    });

    return sequences;
  }

  /**
   * Calculate suggested snap position for equal distribution
   */
  static calculateSnapPosition(draggedShape: Shape, sequence: ShapeSequence, allShapes: Shape[]): { x: number; y: number } | undefined {
    const draggedIndex = sequence.shapes.indexOf(draggedShape.id);
    if (draggedIndex === -1 || sequence.spacings.length === 0) return undefined;

    // Get target spacing (average of other spacings or pattern spacing)
    let targetSpacing = sequence.patternSpacing;
    if (!targetSpacing) {
      targetSpacing = sequence.spacings.reduce((a, b) => a + b, 0) / sequence.spacings.length;
    }

    const draggedBounds = this.getShapeBounds(draggedShape);

    // Calculate snap position based on neighbor shapes
    if (sequence.direction === 'horizontal') {
      // If not first or last shape, calculate position based on neighbors
      if (draggedIndex > 0) {
        const prevShape = allShapes.find(s => s.id === sequence.shapes[draggedIndex - 1]);
        if (prevShape) {
          const prevBounds = this.getShapeBounds(prevShape);
          const suggestedX = prevBounds.right + targetSpacing + (draggedBounds.right - draggedBounds.left) / 2;
          return { x: suggestedX, y: draggedBounds.centerY };
        }
      }
      if (draggedIndex < sequence.shapes.length - 1) {
        const nextShape = allShapes.find(s => s.id === sequence.shapes[draggedIndex + 1]);
        if (nextShape) {
          const nextBounds = this.getShapeBounds(nextShape);
          const suggestedX = nextBounds.left - targetSpacing - (draggedBounds.right - draggedBounds.left) / 2;
          return { x: suggestedX, y: draggedBounds.centerY };
        }
      }
    } else {
      // Vertical sequence
      if (draggedIndex > 0) {
        const prevShape = allShapes.find(s => s.id === sequence.shapes[draggedIndex - 1]);
        if (prevShape) {
          const prevBounds = this.getShapeBounds(prevShape);
          const suggestedY = prevBounds.bottom + targetSpacing + (draggedBounds.bottom - draggedBounds.top) / 2;
          return { x: draggedBounds.centerX, y: suggestedY };
        }
      }
      if (draggedIndex < sequence.shapes.length - 1) {
        const nextShape = allShapes.find(s => s.id === sequence.shapes[draggedIndex + 1]);
        if (nextShape) {
          const nextBounds = this.getShapeBounds(nextShape);
          const suggestedY = nextBounds.top - targetSpacing - (draggedBounds.bottom - draggedBounds.top) / 2;
          return { x: draggedBounds.centerX, y: suggestedY };
        }
      }
    }

    return undefined;
  }

  /**
   * Detect alignment guides when dragging a shape
   */
  static detectAlignments(draggedShape: Shape, otherShapes: Shape[]): AlignmentResult {
    const guides: AlignmentGuide[] = [];
    const spacings: SpacingMeasurement[] = [];
    const draggedBounds = this.getShapeBounds(draggedShape);
    let snapPosition: { x: number; y: number } | undefined;

    // Check if we're dealing with a sequence
    const allShapes = [...otherShapes, draggedShape];
    const sequences = this.detectShapeSequences(allShapes);

    // If we have sequences, generate spacing measurements for all consecutive shapes
    if (sequences.length > 0) {
      sequences.forEach(sequence => {
        if (sequence.shapes.includes(draggedShape.id)) {
          // Calculate snap position for equal distribution
          if (!snapPosition) {
            snapPosition = this.calculateSnapPosition(draggedShape, sequence, allShapes);
          }
          // Calculate target spacing for equal distribution
          let targetSpacing: number | undefined;

          // If sequence already has equal spacing, maintain it
          if (sequence.isEquallySpaced && sequence.patternSpacing) {
            targetSpacing = sequence.patternSpacing;
          } else if (sequence.spacings.length > 0) {
            // Use the average of existing spacings as target
            targetSpacing = sequence.spacings.reduce((a, b) => a + b, 0) / sequence.spacings.length;
          }

          // Generate spacing measurements for all consecutive pairs in this sequence
          for (let i = 0; i < sequence.shapes.length - 1; i++) {
            const shape1 = allShapes.find(s => s.id === sequence.shapes[i]);
            const shape2 = allShapes.find(s => s.id === sequence.shapes[i + 1]);

            if (shape1 && shape2) {
              const bounds1 = this.getShapeBounds(shape1);
              const bounds2 = this.getShapeBounds(shape2);

              if (sequence.direction === 'horizontal') {
                const distance = bounds2.left - bounds1.right;
                if (distance > 10) {
                  const labelX = bounds1.right + distance / 2;
                  const labelY = (bounds1.centerY + bounds2.centerY) / 2;

                  // Check if this spacing is equal to target
                  const isEqualDistribution = targetSpacing ?
                    Math.abs(distance - targetSpacing) <= this.EQUAL_SPACING_TOLERANCE : false;

                  // Check if we're close to achieving equal spacing
                  const isSnappable = targetSpacing ?
                    Math.abs(distance - targetSpacing) <= this.THRESHOLD * 2 : false;

                  spacings.push({
                    id: `seq-hspacing-${shape1.id}-${shape2.id}`,
                    distance: Math.round(distance * 10) / 10,
                    position: { x: labelX, y: labelY },
                    direction: 'horizontal',
                    fromShape: shape1.id,
                    toShape: shape2.id,
                    isEqualDistribution,
                    targetSpacing: targetSpacing ? Math.round(targetSpacing * 10) / 10 : undefined,
                    isSnappable
                  });
                }
              } else {
                const distance = bounds2.top - bounds1.bottom;
                if (distance > 10) {
                  const labelX = (bounds1.centerX + bounds2.centerX) / 2;
                  const labelY = bounds1.bottom + distance / 2;

                  // Check if this spacing is equal to target
                  const isEqualDistribution = targetSpacing ?
                    Math.abs(distance - targetSpacing) <= this.EQUAL_SPACING_TOLERANCE : false;

                  // Check if we're close to achieving equal spacing
                  const isSnappable = targetSpacing ?
                    Math.abs(distance - targetSpacing) <= this.THRESHOLD * 2 : false;

                  spacings.push({
                    id: `seq-vspacing-${shape1.id}-${shape2.id}`,
                    distance: Math.round(distance * 10) / 10,
                    position: { x: labelX, y: labelY },
                    direction: 'vertical',
                    fromShape: shape1.id,
                    toShape: shape2.id,
                    isEqualDistribution,
                    targetSpacing: targetSpacing ? Math.round(targetSpacing * 10) / 10 : undefined,
                    isSnappable
                  });
                }
              }
            }
          }
        }
      });
    } else {
      // Normal pairwise detection when no sequence is found
      otherShapes.forEach(otherShape => {
        const otherBounds = this.getShapeBounds(otherShape);

        // Vertical alignments (left, right, center)
        this.checkVerticalAlignment(draggedBounds, otherBounds, draggedShape.id, otherShape.id, guides);

        // Horizontal alignments (top, bottom, center)
        this.checkHorizontalAlignment(draggedBounds, otherBounds, draggedShape.id, otherShape.id, guides);

        // Spacing measurements
        this.checkSpacingMeasurements(draggedBounds, otherBounds, draggedShape.id, otherShape.id, spacings);
      });
    }

    // Always generate alignment guides
    otherShapes.forEach(otherShape => {
      const otherBounds = this.getShapeBounds(otherShape);
      this.checkVerticalAlignment(draggedBounds, otherBounds, draggedShape.id, otherShape.id, guides);
      this.checkHorizontalAlignment(draggedBounds, otherBounds, draggedShape.id, otherShape.id, guides);
    });

    return { guides, spacings, sequences, snapPosition };
  }

  /**
   * Check for vertical alignment guides
   */
  private static checkVerticalAlignment(
    draggedBounds: any,
    otherBounds: any,
    draggedId: string,
    otherId: string,
    guides: AlignmentGuide[]
  ) {
    const threshold = this.THRESHOLD;

    // Left edge alignment
    if (Math.abs(draggedBounds.left - otherBounds.left) < threshold) {
      guides.push({
        id: `left-${draggedId}-${otherId}-${Date.now()}`,
        type: 'vertical',
        position: otherBounds.left,
        start: Math.min(draggedBounds.top, otherBounds.top) - 20,
        end: Math.max(draggedBounds.bottom, otherBounds.bottom) + 20,
        shapes: [draggedId, otherId]
      });
    }

    // Right edge alignment
    if (Math.abs(draggedBounds.right - otherBounds.right) < threshold) {
      guides.push({
        id: `right-${draggedId}-${otherId}-${Date.now()}`,
        type: 'vertical',
        position: otherBounds.right,
        start: Math.min(draggedBounds.top, otherBounds.top) - 20,
        end: Math.max(draggedBounds.bottom, otherBounds.bottom) + 20,
        shapes: [draggedId, otherId]
      });
    }

    // Center vertical alignment
    if (Math.abs(draggedBounds.centerX - otherBounds.centerX) < threshold) {
      guides.push({
        id: `vcenter-${draggedId}-${otherId}-${Date.now()}`,
        type: 'vertical',
        position: otherBounds.centerX,
        start: Math.min(draggedBounds.top, otherBounds.top) - 20,
        end: Math.max(draggedBounds.bottom, otherBounds.bottom) + 20,
        shapes: [draggedId, otherId]
      });
    }
  }

  /**
   * Check for horizontal alignment guides
   */
  private static checkHorizontalAlignment(
    draggedBounds: any,
    otherBounds: any,
    draggedId: string,
    otherId: string,
    guides: AlignmentGuide[]
  ) {
    const threshold = this.THRESHOLD;

    // Top edge alignment
    if (Math.abs(draggedBounds.top - otherBounds.top) < threshold) {
      guides.push({
        id: `top-${draggedId}-${otherId}-${Date.now()}`,
        type: 'horizontal',
        position: otherBounds.top,
        start: Math.min(draggedBounds.left, otherBounds.left) - 20,
        end: Math.max(draggedBounds.right, otherBounds.right) + 20,
        shapes: [draggedId, otherId]
      });
    }

    // Bottom edge alignment
    if (Math.abs(draggedBounds.bottom - otherBounds.bottom) < threshold) {
      guides.push({
        id: `bottom-${draggedId}-${otherId}-${Date.now()}`,
        type: 'horizontal',
        position: otherBounds.bottom,
        start: Math.min(draggedBounds.left, otherBounds.left) - 20,
        end: Math.max(draggedBounds.right, otherBounds.right) + 20,
        shapes: [draggedId, otherId]
      });
    }

    // Center horizontal alignment
    if (Math.abs(draggedBounds.centerY - otherBounds.centerY) < threshold) {
      guides.push({
        id: `hcenter-${draggedId}-${otherId}-${Date.now()}`,
        type: 'horizontal',
        position: otherBounds.centerY,
        start: Math.min(draggedBounds.left, otherBounds.left) - 20,
        end: Math.max(draggedBounds.right, otherBounds.right) + 20,
        shapes: [draggedId, otherId]
      });
    }
  }

  /**
   * Check for spacing measurements between shapes
   */
  private static checkSpacingMeasurements(
    draggedBounds: any,
    otherBounds: any,
    draggedId: string,
    otherId: string,
    spacings: SpacingMeasurement[]
  ) {
    const threshold = this.THRESHOLD;

    // Horizontal spacing (shapes side by side)
    // Check if shapes are roughly horizontally aligned (same vertical level)
    const verticalOverlap = Math.max(0,
      Math.min(draggedBounds.bottom, otherBounds.bottom) -
      Math.max(draggedBounds.top, otherBounds.top)
    );
    const minHeight = Math.min(draggedBounds.bottom - draggedBounds.top, otherBounds.bottom - otherBounds.top);

    if (verticalOverlap > minHeight * 0.5) { // 50% vertical overlap = side by side
      let horizontalDistance = 0;
      let labelX = 0;
      let labelY = (draggedBounds.centerY + otherBounds.centerY) / 2;

      if (draggedBounds.right < otherBounds.left) {
        // Dragged shape is to the left
        horizontalDistance = otherBounds.left - draggedBounds.right;
        labelX = draggedBounds.right + horizontalDistance / 2;
      } else if (otherBounds.right < draggedBounds.left) {
        // Other shape is to the left
        horizontalDistance = draggedBounds.left - otherBounds.right;
        labelX = otherBounds.right + horizontalDistance / 2;
      }

      if (horizontalDistance > 10) { // Only show meaningful spacing
        // Create ONE spacing measurement in the center (correct behavior)
        spacings.push({
          id: `hspacing-${draggedId}-${otherId}-${Date.now()}`,
          distance: Math.round(horizontalDistance * 10) / 10, // Round to 1 decimal
          position: { x: labelX, y: labelY },
          direction: 'horizontal',
          fromShape: draggedId,
          toShape: otherId
        });
      }
    }

    // Vertical spacing (shapes stacked)
    // Check if shapes are roughly vertically aligned (same horizontal level)
    const horizontalOverlap = Math.max(0,
      Math.min(draggedBounds.right, otherBounds.right) -
      Math.max(draggedBounds.left, otherBounds.left)
    );
    const minWidth = Math.min(draggedBounds.right - draggedBounds.left, otherBounds.right - otherBounds.left);

    if (horizontalOverlap > minWidth * 0.5) { // 50% horizontal overlap = stacked
      let verticalDistance = 0;
      let labelX = (draggedBounds.centerX + otherBounds.centerX) / 2;
      let labelY = 0;

      if (draggedBounds.bottom < otherBounds.top) {
        // Dragged shape is above
        verticalDistance = otherBounds.top - draggedBounds.bottom;
        labelY = draggedBounds.bottom + verticalDistance / 2;
      } else if (otherBounds.bottom < draggedBounds.top) {
        // Other shape is above
        verticalDistance = draggedBounds.top - otherBounds.bottom;
        labelY = otherBounds.bottom + verticalDistance / 2;
      }

      if (verticalDistance > 10) { // Only show meaningful spacing
        // Create ONE spacing measurement in the center (correct behavior)
        spacings.push({
          id: `vspacing-${draggedId}-${otherId}-${Date.now()}`,
          distance: Math.round(verticalDistance * 10) / 10, // Round to 1 decimal
          position: { x: labelX, y: labelY },
          direction: 'vertical',
          fromShape: draggedId,
          toShape: otherId
        });
      }
    }
  }
}