// Custom hook for adaptive snap radius calculation
// Automatically adjusts snap radius based on camera zoom level

import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { screenSpaceToWorldSpace, clampWorldRadius } from '../utils/screenSpaceUtils';

interface AdaptiveSnapRadiusConfig {
  enabled: boolean;
  screenSpacePixels: number;
  cursorWorldPosition: THREE.Vector3 | null;
}

/**
 * Hook for managing adaptive snap radius based on camera position
 *
 * This hook automatically calculates the world-space snap radius from a fixed
 * screen-space pixel distance, adjusting as the camera zooms in/out.
 *
 * @param config - Configuration with enabled state, screen pixels, and cursor position
 * @returns Current world radius and manual update function
 *
 * @example
 * const { currentWorldRadius } = useAdaptiveSnapRadius({
 *   enabled: true,
 *   screenSpacePixels: 75,
 *   cursorWorldPosition: new THREE.Vector3(0, 0, 0)
 * });
 */
export function useAdaptiveSnapRadius(config: AdaptiveSnapRadiusConfig) {
  const { camera, gl } = useThree();
  const lastUpdateRef = useRef<number>(0);
  const lastRadiusRef = useRef<number>(0);

  // RACE CONDITION FIX: Track pending updates to prevent concurrent radius changes
  const pendingUpdateRef = useRef<number | null>(null);

  const setSnapping = useAppStore(state => state.setSnapping);

  /**
   * Calculate and update snap radius based on camera position
   * Throttled to 60 FPS (16ms) with 5% change threshold to avoid excessive updates
   * RACE CONDITION FIX: Uses RAF to ensure atomic updates
   */
  const updateRadius = useCallback(() => {
    if (!config.enabled || !config.cursorWorldPosition) return;

    const now = performance.now();

    // Throttle to 60 FPS (16ms)
    if (now - lastUpdateRef.current < 16) return;

    // RACE CONDITION FIX: Prevent concurrent updates
    if (pendingUpdateRef.current !== null) return;

    lastUpdateRef.current = now;

    // Schedule update on next animation frame for atomic execution
    pendingUpdateRef.current = requestAnimationFrame(() => {
      const viewportHeight = gl.domElement.clientHeight;

      // Calculate world-space radius from screen-space pixels
      const worldRadius = screenSpaceToWorldSpace({
        screenPixels: config.screenSpacePixels,
        camera: camera as THREE.PerspectiveCamera,
        targetPoint: config.cursorWorldPosition,
        viewportHeight
      });

      const clampedRadius = clampWorldRadius(worldRadius);

      // Only update if changed significantly (>5% difference)
      // This prevents excessive store updates and re-renders
      const percentChange = Math.abs(clampedRadius - lastRadiusRef.current) / lastRadiusRef.current;
      if (percentChange >= 0.05 || lastRadiusRef.current === 0) {
        // Update store with new radius
        setSnapping({
          config: {
            snapRadius: clampedRadius
          }
        });
        lastRadiusRef.current = clampedRadius;
      }

      // Clear pending flag after update completes
      pendingUpdateRef.current = null;
    });
  }, [config.enabled, config.screenSpacePixels, camera, gl]); // INFINITE LOOP FIX: Removed setSnapping (stable) and cursorWorldPosition (read from config)

  /**
   * Listen for camera changes (zoom, pan, rotate)
   * Uses camera controller's 'change' event for efficient updates
   */
  useEffect(() => {
    if (!config.enabled) return;

    // Access camera controls (OrbitControls or custom controller)
    const controls = (camera as any).controls;

    if (controls) {
      controls.addEventListener('change', updateRadius);

      return () => {
        controls.removeEventListener('change', updateRadius);
      };
    }
  }, [config.enabled, camera, updateRadius]);

  /**
   * Update radius when cursor position changes
   * This ensures radius is recalculated as cursor moves around the scene
   */
  useEffect(() => {
    if (config.enabled && config.cursorWorldPosition) {
      updateRadius();
    }
  }, [config.cursorWorldPosition, config.enabled, updateRadius]);

  /**
   * RACE CONDITION FIX: Cleanup pending RAF on unmount
   */
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current !== null) {
        cancelAnimationFrame(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }
    };
  }, []);

  return {
    currentWorldRadius: lastRadiusRef.current,
    updateRadius
  };
}
