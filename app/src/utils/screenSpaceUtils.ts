// Screen-Space to World-Space Conversion Utilities
// Converts screen pixels to world distance based on camera position

import * as THREE from 'three';

export interface ScreenSpaceConfig {
  screenPixels: number;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  targetPoint: THREE.Vector3;
  viewportHeight: number;
}

/**
 * Convert screen-space pixels to world-space distance
 *
 * @param config - Configuration with screen pixels, camera, target point, and viewport height
 * @returns World-space distance in meters
 *
 * @example
 * // At 50m camera distance, 75px on screen = ~2.87m in world space
 * const worldRadius = screenSpaceToWorldSpace({
 *   screenPixels: 75,
 *   camera: perspectiveCamera,
 *   targetPoint: new THREE.Vector3(0, 0, 0),
 *   viewportHeight: 1080
 * });
 */
export function screenSpaceToWorldSpace(config: ScreenSpaceConfig): number {
  const { screenPixels, camera, targetPoint, viewportHeight } = config;

  if (camera instanceof THREE.PerspectiveCamera) {
    return perspectiveScreenToWorld(screenPixels, camera, targetPoint, viewportHeight);
  } else {
    return orthographicScreenToWorld(screenPixels, camera, viewportHeight);
  }
}

/**
 * Convert screen pixels to world distance for perspective camera
 * Uses FOV and camera distance to calculate visible world height
 */
function perspectiveScreenToWorld(
  screenPixels: number,
  camera: THREE.PerspectiveCamera,
  targetPoint: THREE.Vector3,
  viewportHeight: number
): number {
  // 1. Calculate camera distance to target point
  const cameraDistance = camera.position.distanceTo(targetPoint);

  // 2. Convert FOV to radians
  const fovRadians = camera.fov * (Math.PI / 180);

  // 3. Calculate visible world height at target distance
  const visibleWorldHeight = 2 * Math.tan(fovRadians / 2) * cameraDistance;

  // 4. Calculate pixels-to-world ratio
  const pixelsPerWorldUnit = viewportHeight / visibleWorldHeight;

  // 5. Convert screen pixels to world distance
  const worldDistance = screenPixels / pixelsPerWorldUnit;

  return worldDistance;
}

/**
 * Convert screen pixels to world distance for orthographic camera
 * Uses camera bounds to calculate visible world height
 */
function orthographicScreenToWorld(
  screenPixels: number,
  camera: THREE.OrthographicCamera,
  viewportHeight: number
): number {
  const visibleWorldHeight = camera.top - camera.bottom;
  const pixelsPerWorldUnit = viewportHeight / visibleWorldHeight;
  return screenPixels / pixelsPerWorldUnit;
}

/**
 * Clamp world radius to reasonable bounds
 * Prevents excessively small or large snap areas at extreme zoom levels
 *
 * @param radius - World-space radius in meters
 * @returns Clamped radius between MIN_RADIUS and MAX_RADIUS
 *
 * @example
 * clampWorldRadius(0.05)  // Returns 0.1 (minimum)
 * clampWorldRadius(150)   // Returns 100 (maximum)
 * clampWorldRadius(50)    // Returns 50 (within bounds)
 */
export function clampWorldRadius(radius: number): number {
  const MIN_RADIUS = 0.1;  // 10cm minimum (extreme zoom in)
  const MAX_RADIUS = 100;  // 100m maximum (extreme zoom out)
  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radius));
}
