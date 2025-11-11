/**
 * Camera Utility Functions
 *
 * Helper functions for camera bounds validation and comparison.
 * Extracted for testability and reusability.
 */

/** Camera bounds interface for type safety */
export interface CameraBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Constants for camera restoration logic */
export const CAMERA_THRESHOLDS = {
  /** Minimum zoom difference to trigger restoration (prevents jitter) */
  ZOOM_EPSILON: 0.01,
  /** Minimum bounds difference to trigger restoration (prevents jitter) */
  BOUNDS_EPSILON: 0.1,
  /** Minimum bounds change to consider it significant (units) */
  SIGNIFICANT_BOUNDS_CHANGE: 1,
} as const;

/**
 * Validates that all bounds values are valid finite numbers
 *
 * @param bounds - Camera bounds object to validate
 * @returns true if all bounds are valid numbers, false otherwise
 *
 * @example
 * ```ts
 * const valid = areBoundsValid({ left: -50, right: 50, top: 50, bottom: -50 });
 * // => true
 *
 * const invalid = areBoundsValid({ left: NaN, right: 50, top: 50, bottom: -50 });
 * // => false
 * ```
 */
export function areBoundsValid(bounds: CameraBounds): boolean {
  return (
    typeof bounds.left === 'number' &&
    isFinite(bounds.left) &&
    typeof bounds.right === 'number' &&
    isFinite(bounds.right) &&
    typeof bounds.top === 'number' &&
    isFinite(bounds.top) &&
    typeof bounds.bottom === 'number' &&
    isFinite(bounds.bottom)
  );
}

/**
 * Checks if two bounds are approximately equal within epsilon
 *
 * @param a - First bounds object
 * @param b - Second bounds object
 * @param epsilon - Maximum difference to consider equal
 * @returns true if bounds match within epsilon, false otherwise
 *
 * @example
 * ```ts
 * const a = { left: -50, right: 50, top: 50, bottom: -50 };
 * const b = { left: -50.05, right: 50.05, top: 50.05, bottom: -50.05 };
 *
 * boundsMatch(a, b, 0.1);  // => true
 * boundsMatch(a, b, 0.01); // => false
 * ```
 */
export function boundsMatch(
  a: CameraBounds,
  b: CameraBounds,
  epsilon: number
): boolean {
  return (
    Math.abs(a.left - b.left) < epsilon &&
    Math.abs(a.right - b.right) < epsilon &&
    Math.abs(a.top - b.top) < epsilon &&
    Math.abs(a.bottom - b.bottom) < epsilon
  );
}

/**
 * Calculates the maximum delta between two bounds
 *
 * @param a - First bounds object
 * @param b - Second bounds object
 * @returns Maximum difference across all bounds values
 *
 * @example
 * ```ts
 * const a = { left: -50, right: 50, top: 50, bottom: -50 };
 * const b = { left: -52, right: 51, top: 48, bottom: -51 };
 *
 * getMaxBoundsDelta(a, b); // => 2
 * ```
 */
export function getMaxBoundsDelta(a: CameraBounds, b: CameraBounds): number {
  const leftDelta = Math.abs(a.left - b.left);
  const rightDelta = Math.abs(a.right - b.right);
  const topDelta = Math.abs(a.top - b.top);
  const bottomDelta = Math.abs(a.bottom - b.bottom);

  return Math.max(leftDelta, rightDelta, topDelta, bottomDelta);
}
