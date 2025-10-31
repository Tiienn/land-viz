import React, { useMemo, useEffect, useRef } from 'react';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';
import * as THREE from 'three';

export const Camera2DToggle: React.FC = () => {
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);
  const zoom2D = useAppStore(state => state.viewState?.zoom2D || 1);

  const viewport = useThree(state => state.viewport);
  const camera = useThree(state => state.camera);
  const controls = useThree(state => state.controls);

  // Track previous mode to detect switches
  const prevModeRef = useRef(is2DMode);

  // Track the current zoom to restore it after React re-renders
  const currentZoomRef = useRef(1);

  // Track the current bounds to restore them after React re-renders
  const currentBoundsRef = useRef<{
    left: number;
    right: number;
    top: number;
    bottom: number;
  } | null>(null);

  // Removed debug logging - issue fixed!

  // Calculate orthographic camera bounds based on viewport
  // Keep bounds constant - zoom is handled by camera.zoom property via OrbitControls
  const orthoBounds = useMemo(() => {
    const aspect = viewport.width / viewport.height;
    const viewSize = 100; // Base view size in world units

    return {
      left: -aspect * viewSize / 2,
      right: aspect * viewSize / 2,
      top: viewSize / 2,
      bottom: -viewSize / 2,
      near: -1000,
      far: 1000
    };
  }, [viewport.width, viewport.height]);

  // Reset camera ONLY on mode switches (not on every zoom2D change)
  // CRITICAL: Do NOT include zoom2D in deps to prevent useEffect from running on scroll
  useEffect(() => {
    const modeChanged = prevModeRef.current !== is2DMode;
    prevModeRef.current = is2DMode;

    // Only reset camera when actually switching TO 2D mode
    if (modeChanged && is2DMode && camera && 'zoom' in camera) {
      // Reset position to top-down view (directly above origin)
      camera.position.set(0, 100, 0.1);

      // Reset rotation to look straight down (top-down view)
      camera.rotation.set(-Math.PI / 2, 0, 0);

      // Reset OrbitControls target to origin
      if (controls && 'target' in controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }

      // Apply zoom from store (only on mode switch)
      // Read zoom2D directly from store to avoid adding it to deps
      const currentZoom2D = useAppStore.getState().viewState?.zoom2D || 1;
      camera.zoom = currentZoom2D;
      currentZoomRef.current = currentZoom2D;

      // Reset the bounds ref when switching to 2D mode
      // It will be populated on the next render by the restoration useEffect
      currentBoundsRef.current = null;

      camera.updateProjectionMatrix();
    }
  }, [is2DMode, camera, controls]); // REMOVED zoom2D from deps - this is KEY!

  // CRITICAL FIX: Restore zoom AND bounds on every render to prevent React Three Fiber from resetting them
  // This runs after EVERY render to ensure they are preserved when shapes are added/removed
  useEffect(() => {
    if (is2DMode && camera && 'zoom' in camera) {
      const orthoCamera = camera as THREE.OrthographicCamera;
      let needsUpdate = false;

      // 1. Check and restore ZOOM
      const currentCameraZoom = camera.zoom;

      // If camera zoom was reset to 1 (default), restore it from our ref
      if (Math.abs(currentCameraZoom - 1.0) < 0.01 && Math.abs(currentZoomRef.current - 1.0) > 0.01) {
        camera.zoom = currentZoomRef.current;
        needsUpdate = true;
      } else if (Math.abs(currentCameraZoom - currentZoomRef.current) > 0.01) {
        currentZoomRef.current = currentCameraZoom;
      }

      // 2. Check and restore BOUNDS (THIS IS THE KEY FIX!)
      const currentBounds = {
        left: orthoCamera.left,
        right: orthoCamera.right,
        top: orthoCamera.top,
        bottom: orthoCamera.bottom
      };

      // Validate that currentBounds has valid numbers
      const boundsAreValid =
        typeof currentBounds.left === 'number' && !isNaN(currentBounds.left) &&
        typeof currentBounds.right === 'number' && !isNaN(currentBounds.right) &&
        typeof currentBounds.top === 'number' && !isNaN(currentBounds.top) &&
        typeof currentBounds.bottom === 'number' && !isNaN(currentBounds.bottom);

      // If we have a previous bounds reference, check if they've changed unexpectedly
      if (currentBoundsRef.current && boundsAreValid) {
        const leftDelta = Math.abs(currentBounds.left - currentBoundsRef.current.left);
        const rightDelta = Math.abs(currentBounds.right - currentBoundsRef.current.right);

        // If bounds changed significantly (more than 1 unit), restore from ref
        if (!isNaN(leftDelta) && !isNaN(rightDelta) && (leftDelta > 1 || rightDelta > 1)) {
          orthoCamera.left = currentBoundsRef.current.left;
          orthoCamera.right = currentBoundsRef.current.right;
          orthoCamera.top = currentBoundsRef.current.top;
          orthoCamera.bottom = currentBoundsRef.current.bottom;
          needsUpdate = true;
        }
      } else if (boundsAreValid) {
        // First time or ref was invalid, store the bounds if they're valid
        currentBoundsRef.current = currentBounds;
      }

      // Update projection matrix if anything changed
      if (needsUpdate) {
        camera.updateProjectionMatrix();
      }
    }
  }); // No dependencies - runs after EVERY render

  return (
    <>
      <PerspectiveCamera
        makeDefault={!is2DMode}
        position={[0, 80, 80]}
        fov={75}
        near={0.1}
        far={10000}
      />
      <OrthographicCamera
        makeDefault={is2DMode}
        position={[0, 100, 0.1]} // Slightly offset Z to avoid z-fighting
        rotation={[-Math.PI / 2, 0, 0]} // Look straight down
        // Don't control zoom via prop - let OrbitControls handle it
        // and sync back via CameraController
        {...orthoBounds}
      />
    </>
  );
};

export default Camera2DToggle;