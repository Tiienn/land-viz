/**
 * Unit Tests for TextResizeControls
 *
 * Tests the scaling formulas for corner and edge handles
 * as specified in plan.md lines 1418-1550
 */

import { describe, it, expect } from 'vitest';

// Font size constraints from spec
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 200;

interface Point2D {
  x: number;
  y: number;
}

interface TextBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  center: { x: number; y: number };
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculate text bounds (same logic as TextResizeControls)
 */
function calculateTextBounds(
  position: Point2D,
  fontSize: number,
  content: string,
  lineHeight: number
): TextBounds {
  const estimatedWidth = fontSize * content.length * 0.6;
  const estimatedHeight = fontSize * lineHeight;

  const left = position.x - estimatedWidth / 2;
  const top = position.y - estimatedHeight / 2;

  return {
    left,
    top,
    width: estimatedWidth,
    height: estimatedHeight,
    center: {
      x: position.x,
      y: position.y,
    },
    minX: left,
    minY: top,
    maxX: left + estimatedWidth,
    maxY: top + estimatedHeight,
  };
}

/**
 * Corner Handle Scaling (Proportional)
 * Formula from plan.md lines 1431-1456
 */
function calculateCornerScaleFactor(dragPoint: Point2D, originalBounds: TextBounds): number {
  // Calculate diagonal distance from center to drag position
  const dragDiagonal = Math.sqrt(
    Math.pow(dragPoint.x - originalBounds.center.x, 2) +
    Math.pow(dragPoint.y - originalBounds.center.y, 2)
  );

  // Calculate original diagonal
  const originalDiagonal = Math.sqrt(
    Math.pow(originalBounds.width / 2, 2) +
    Math.pow(originalBounds.height / 2, 2)
  );

  // Scale factor
  return dragDiagonal / originalDiagonal;
}

/**
 * Edge Handle Scaling (Dimensional)
 * Formula from plan.md lines 1458-1510
 */
function calculateEdgeScaleFactor(
  dragPoint: Point2D,
  handleIndex: number,
  originalBounds: TextBounds
): number {
  // handleIndex: 0=Top, 1=Right, 2=Bottom, 3=Left
  if (handleIndex === 0 || handleIndex === 2) {
    // North/South handles - adjust height
    const newHeight =
      handleIndex === 0
        ? originalBounds.height + (originalBounds.top - dragPoint.y) // North: dragging upward increases height
        : dragPoint.y - originalBounds.top; // South: dragging downward increases height

    return newHeight / originalBounds.height;
  } else {
    // East/West handles - adjust width
    const newWidth =
      handleIndex === 1
        ? dragPoint.x - originalBounds.left // East: dragging rightward increases width
        : originalBounds.width + (originalBounds.left - dragPoint.x); // West: dragging leftward increases width

    return newWidth / originalBounds.width;
  }
}

describe('TextResizeControls - Scaling Formulas', () => {
  describe('Corner Handle Scaling (Proportional)', () => {
    it('should calculate correct scale factor for diagonal drag', () => {
      // Setup: Text at (0,0) with fontSize 24px, content "Hello World"
      const originalBounds = calculateTextBounds(
        { x: 0, y: 0 },
        24,
        'Hello World',
        1.2
      );

      const originalDiagonal = Math.sqrt(
        Math.pow(originalBounds.width / 2, 2) +
        Math.pow(originalBounds.height / 2, 2)
      );

      // Drag corner to 1.5x distance from center
      const dragPoint: Point2D = {
        x: originalBounds.center.x + (originalBounds.width / 2) * 1.5,
        y: originalBounds.center.y + (originalBounds.height / 2) * 1.5,
      };

      const scaleFactor = calculateCornerScaleFactor(dragPoint, originalBounds);

      // Should be ~1.5x scale factor
      expect(scaleFactor).toBeCloseTo(1.5, 1);

      // New font size should be 24 * 1.5 = 36px
      const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, 24 * scaleFactor));
      expect(newFontSize).toBeCloseTo(36, 1);
    });

    it('should enforce minimum font size constraint', () => {
      const originalBounds = calculateTextBounds({ x: 0, y: 0 }, 20, 'Test', 1.2);

      // Drag corner very close to center (0.1x scale)
      const dragPoint: Point2D = {
        x: originalBounds.center.x + 0.5,
        y: originalBounds.center.y + 0.5,
      };

      const scaleFactor = calculateCornerScaleFactor(dragPoint, originalBounds);
      const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, 20 * scaleFactor));

      // Should not go below 8px
      expect(newFontSize).toBeGreaterThanOrEqual(MIN_FONT_SIZE);
    });

    it('should enforce maximum font size constraint', () => {
      const originalBounds = calculateTextBounds({ x: 0, y: 0 }, 150, 'Test', 1.2);

      // Drag corner far from center (2x scale)
      const dragPoint: Point2D = {
        x: originalBounds.center.x + originalBounds.width,
        y: originalBounds.center.y + originalBounds.height,
      };

      const scaleFactor = calculateCornerScaleFactor(dragPoint, originalBounds);
      const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, 150 * scaleFactor));

      // Should not exceed 200px
      expect(newFontSize).toBeLessThanOrEqual(MAX_FONT_SIZE);
    });
  });

  describe('Edge Handle Scaling (Dimensional)', () => {
    it('should scale height when dragging North handle', () => {
      const originalBounds = calculateTextBounds({ x: 0, y: 0 }, 20, 'Test', 1.2);

      // Drag North handle upward 15 units (increases height)
      const dragPoint: Point2D = {
        x: originalBounds.center.x,
        y: originalBounds.top - 15,
      };

      const scaleFactor = calculateEdgeScaleFactor(dragPoint, 0, originalBounds);

      // New height = original + 15, so scale factor should be (original + 15) / original
      const expectedScale = (originalBounds.height + 15) / originalBounds.height;
      expect(scaleFactor).toBeCloseTo(expectedScale, 2);

      // New font size
      const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, 20 * scaleFactor));
      const expectedFontSize = 20 * expectedScale;
      expect(newFontSize).toBeCloseTo(expectedFontSize, 1);
    });

    it('should scale height when dragging South handle', () => {
      const originalBounds = calculateTextBounds({ x: 0, y: 0 }, 20, 'Test', 1.2);

      // Drag South handle downward (new height from top to drag position)
      const dragPoint: Point2D = {
        x: originalBounds.center.x,
        y: originalBounds.top + originalBounds.height * 1.5,
      };

      const scaleFactor = calculateEdgeScaleFactor(dragPoint, 2, originalBounds);

      // New height = drag position - top = 1.5x original
      expect(scaleFactor).toBeCloseTo(1.5, 1);

      const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, 20 * scaleFactor));
      expect(newFontSize).toBeCloseTo(30, 1);
    });

    it('should scale width when dragging East handle', () => {
      const originalBounds = calculateTextBounds({ x: 0, y: 0 }, 16, 'Hello', 1.2);

      // Drag East handle rightward 50 units
      const dragPoint: Point2D = {
        x: originalBounds.left + originalBounds.width * 1.5,
        y: originalBounds.center.y,
      };

      const scaleFactor = calculateEdgeScaleFactor(dragPoint, 1, originalBounds);

      // New width = drag position - left = 1.5x original
      expect(scaleFactor).toBeCloseTo(1.5, 1);

      const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, 16 * scaleFactor));
      expect(newFontSize).toBeCloseTo(24, 1);
    });

    it('should scale width when dragging West handle', () => {
      const originalBounds = calculateTextBounds({ x: 0, y: 0 }, 16, 'Hello', 1.2);

      // Drag West handle leftward
      const dragPoint: Point2D = {
        x: originalBounds.left - 20,
        y: originalBounds.center.y,
      };

      const scaleFactor = calculateEdgeScaleFactor(dragPoint, 3, originalBounds);

      // New width = original + 20
      const expectedScale = (originalBounds.width + 20) / originalBounds.width;
      expect(scaleFactor).toBeCloseTo(expectedScale, 2);
    });
  });

  describe('Font Size Constraints', () => {
    it('should clamp font size to 8px minimum', () => {
      const originalFontSize = 12;
      const scaleFactor = 0.5; // Would result in 6px

      const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, originalFontSize * scaleFactor));

      expect(newFontSize).toBe(8);
    });

    it('should clamp font size to 200px maximum', () => {
      const originalFontSize = 150;
      const scaleFactor = 2; // Would result in 300px

      const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, originalFontSize * scaleFactor));

      expect(newFontSize).toBe(200);
    });

    it('should allow font sizes within valid range', () => {
      const originalFontSize = 24;
      const scaleFactor = 1.5; // Results in 36px

      const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, originalFontSize * scaleFactor));

      expect(newFontSize).toBe(36);
    });
  });
});
