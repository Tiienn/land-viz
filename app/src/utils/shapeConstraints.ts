/**
 * Shape Constraints Utility Functions
 *
 * Provides geometric constraint calculations for Shift-key constrained drawing and dragging.
 * Supports:
 * - Square constraints (rectangles → perfect squares)
 * - Angle constraints (lines/polylines → 0°/45°/90° angles)
 * - Axis-lock constraints (dragging → horizontal or vertical only)
 *
 * All functions are pure (no side effects) and designed for real-time use (<5ms per call).
 *
 * @see specs/017-shift-constrained-drawing/spec.md for design decisions
 */

import type { Point2D } from '@/types';

/**
 * Applies square constraint to rectangle coordinates.
 * Uses the maximum dimension (width or height) to create a perfect square.
 *
 * @param firstPoint - The anchor point (first corner clicked)
 * @param cursorPoint - Current cursor position
 * @returns Constrained point that creates a square
 *
 * @example
 * // User clicks at (0,0) and drags to (10,5)
 * applySquareConstraint({x:0, y:0}, {x:10, y:5})
 * // Returns {x:10, y:10} - makes it a 10×10 square (uses larger dimension)
 *
 * @example
 * // Bottom-left quadrant
 * applySquareConstraint({x:0, y:0}, {x:-7, y:-10})
 * // Returns {x:-10, y:-10} - uses larger dimension (10)
 *
 * Design Decision: DD-017.1 - Uses larger dimension (matches Figma/Illustrator)
 */
export function applySquareConstraint(
  firstPoint: Point2D,
  cursorPoint: Point2D
): Point2D {
  const deltaX = cursorPoint.x - firstPoint.x;
  const deltaY = cursorPoint.y - firstPoint.y;

  // Use the larger dimension to create the square
  const maxDimension = Math.max(Math.abs(deltaX), Math.abs(deltaY));

  // Preserve the direction (quadrant) of the original drag
  const signX = deltaX >= 0 ? 1 : -1;
  const signY = deltaY >= 0 ? 1 : -1;

  return {
    x: firstPoint.x + maxDimension * signX,
    y: firstPoint.y + maxDimension * signY
  };
}

/**
 * Constrains angle to nearest step (default 45°) while maintaining distance.
 * Used for line/polyline angle snapping to 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°.
 *
 * @param startPoint - Line start point
 * @param cursorPoint - Current cursor position
 * @param angleStep - Angle increment in degrees (default 45°)
 * @returns Constrained end point with angle snapped to nearest step
 *
 * @example
 * // User draws line from (0,0) to (10,3) - approximately 17° angle
 * applyAngleConstraint({x:0, y:0}, {x:10, y:3})
 * // Returns approximately {x:10.44, y:0} - snapped to 0° (horizontal)
 *
 * @example
 * // Vertical line
 * applyAngleConstraint({x:0, y:0}, {x:2, y:10})
 * // Returns approximately {x:0, y:10.2} - snapped to 90° (vertical)
 *
 * Design Decision: DD-017.7 - 45° angle steps only for MVP
 */
export function applyAngleConstraint(
  startPoint: Point2D,
  cursorPoint: Point2D,
  angleStep: number = 45
): Point2D {
  const deltaX = cursorPoint.x - startPoint.x;
  const deltaY = cursorPoint.y - startPoint.y;

  // Calculate distance (maintain this)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Handle zero distance (cursor at start point)
  if (distance < 0.001) {
    return startPoint;
  }

  // Calculate current angle in degrees
  const angleRad = Math.atan2(deltaY, deltaX);
  const angleDeg = angleRad * (180 / Math.PI);

  // Round to nearest angle step
  const constrainedAngleDeg = roundToNearestAngle(angleDeg, angleStep);
  const constrainedAngleRad = constrainedAngleDeg * (Math.PI / 180);

  // Apply constrained angle with original distance
  return {
    x: startPoint.x + distance * Math.cos(constrainedAngleRad),
    y: startPoint.y + distance * Math.sin(constrainedAngleRad)
  };
}

/**
 * Rounds angle to nearest step (e.g., 45° increments).
 * Handles negative angles and wraps to [0, 360) range.
 *
 * @param angleDegrees - Angle in degrees (can be negative)
 * @param angleStep - Step size in degrees (e.g., 45)
 * @returns Rounded angle in [0, 360) range
 *
 * @example
 * roundToNearestAngle(17, 45)   // Returns 0°
 * roundToNearestAngle(67, 45)   // Returns 90°
 * roundToNearestAngle(-30, 45)  // Returns 315° (wraps around)
 * roundToNearestAngle(350, 45)  // Returns 0° (wraps around)
 */
export function roundToNearestAngle(
  angleDegrees: number,
  angleStep: number = 45
): number {
  // Normalize to [0, 360) range
  let normalized = angleDegrees % 360;
  if (normalized < 0) normalized += 360;

  // Round to nearest step
  const rounded = Math.round(normalized / angleStep) * angleStep;

  // Wrap 360° back to 0°
  return rounded % 360;
}

/**
 * Applies axis-lock constraint to drag offset (Canva/Figma behavior).
 * Locks movement to dominant axis (horizontal or vertical only).
 *
 * @param offsetX - Horizontal drag offset from start position (world units/meters)
 * @param offsetY - Vertical drag offset from start position (world units/meters)
 * @param threshold - Minimum movement before axis locks (default 5 world units/meters)
 * @returns Constrained offset with one axis locked to 0
 *
 * @example
 * // User drags 10 units right, 3 units down
 * applyAxisLockConstraint(10, 3)
 * // Returns {offsetX: 10, offsetY: 0} - horizontal movement only
 *
 * @example
 * // User drags 2 units right, 15 units up
 * applyAxisLockConstraint(2, 15)
 * // Returns {offsetX: 0, offsetY: 15} - vertical movement only
 *
 * @example
 * // Small movement below threshold
 * applyAxisLockConstraint(2, 3, 5)
 * // Returns {offsetX: 2, offsetY: 3} - no lock (below threshold)
 *
 * Design Decision: DD-017.2 - Threshold is 5 world units (meters), not screen pixels
 * Design Decision: DD-017.6 - Horizontal axis wins on tie (equal X/Y offsets)
 */
export function applyAxisLockConstraint(
  offsetX: number,
  offsetY: number,
  threshold: number = 5
): { offsetX: number; offsetY: number } {
  const absX = Math.abs(offsetX);
  const absY = Math.abs(offsetY);

  // No constraint if movement is below threshold (user hasn't established direction yet)
  if (absX < threshold && absY < threshold) {
    return { offsetX, offsetY };
  }

  // Lock to dominant axis
  // DD-017.6: If equal, lock to horizontal (tie-breaker - use >= instead of >)
  if (absX >= absY) {
    // Horizontal movement is dominant (or equal) - lock vertical axis
    return { offsetX, offsetY: 0 };
  } else {
    // Vertical movement is dominant - lock horizontal axis
    return { offsetX: 0, offsetY };
  }
}
