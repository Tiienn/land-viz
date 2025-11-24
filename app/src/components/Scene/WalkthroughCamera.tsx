import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';
import { PointerLockControls } from '@react-three/drei';
import { Vector3, Euler } from 'three';
import { useAppStore } from '@/store/useAppStore';
import type { Point3D } from '@/types';
import {
  calculateBoundingBox,
  constrainToBoundary,
  constrainToWalkableBoundary,
  getDistanceToBoundaryEdge,
  type BoundingBox
} from '@/utils/boundaryCollision';
import { loadWalkthroughSettings, type WalkthroughAccessibilitySettings } from '../UI/WalkthroughAccessibilityPanel';

export interface WalkthroughCameraProps {
  /**
   * Walking speed in meters per second (default: 1.5 m/s)
   */
  walkSpeed?: number;

  /**
   * Sprint speed multiplier (default: 2.0x)
   */
  sprintMultiplier?: number;

  /**
   * Jump initial velocity in m/s (default: 5.0 m/s)
   */
  jumpVelocity?: number;

  /**
   * Gravity acceleration in m/s² (default: 9.8 m/s²)
   */
  gravity?: number;

  /**
   * Character eye height in meters (default: 1.7m)
   */
  eyeHeight?: number;

  /**
   * Ground level Y coordinate (default: 0)
   */
  groundLevel?: number;
}

/**
 * WalkthroughCamera - First-person camera with WASD controls and physics
 *
 * Controls:
 * - WASD: Move forward/left/backward/right
 * - Space: Jump
 * - Shift: Sprint (2x speed)
 * - Mouse: Look around (requires pointer lock - click canvas to activate)
 * - ESC: Exit walkthrough mode and return to 3D orbit view
 * - Alt+Tab: Unlocks pointer (stays in walkthrough - click to re-activate)
 *
 * Features:
 * - Physics-based movement (velocity, gravity)
 * - Collision detection with site boundaries
 * - Smooth camera motion
 * - 60 FPS target
 * - Persistent walkthrough mode (survives focus loss)
 */
export default function WalkthroughCamera({
  walkSpeed = 1.5, // m/s
  sprintMultiplier = 2.0,
  jumpVelocity = 5.0, // m/s
  gravity = 9.8, // m/s²
  eyeHeight = 1.7, // meters
  groundLevel = 0,
}: WalkthroughCameraProps) {
  const controlsRef = useRef<PointerLockControlsImpl>(null);
  const { camera, gl } = useThree();

  // Store hooks
  const walkthroughState = useAppStore(state => state.viewState.walkthroughState);
  const shapes = useAppStore(state => state.shapes); // Get shapes for bounding box fallback
  const walkableBoundaries = useAppStore(state => state.walkableBoundaries); // Phase 2: Polygon boundaries
  const updateWalkthroughPosition = useAppStore(state => state.updateWalkthroughPosition);
  const updateWalkthroughRotation = useAppStore(state => state.updateWalkthroughRotation);
  const updateWalkthroughVelocity = useAppStore(state => state.updateWalkthroughVelocity);
  const setWalkthroughMoving = useAppStore(state => state.setWalkthroughMoving);
  const setWalkthroughJumping = useAppStore(state => state.setWalkthroughJumping);
  const toggleViewMode = useAppStore(state => state.toggleViewMode);
  const toggleWalkthroughPerspective = useAppStore(state => state.toggleWalkthroughPerspective);
  const setWalkthroughPointerLocked = useAppStore(state => state.setWalkthroughPointerLocked);

  // Get current perspective mode (first-person or third-person)
  const perspectiveMode = walkthroughState?.perspectiveMode || 'first-person';

  // Accessibility settings (load from localStorage)
  const [accessibilitySettings, setAccessibilitySettings] = useState<WalkthroughAccessibilitySettings>(loadWalkthroughSettings());

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<WalkthroughAccessibilitySettings>;
      setAccessibilitySettings(customEvent.detail);
    };

    window.addEventListener('walkthrough-settings-change', handleSettingsChange);
    return () => window.removeEventListener('walkthrough-settings-change', handleSettingsChange);
  }, []);

  // Calculate site boundary from shapes (bounding box fallback when no walkable boundaries)
  const siteBoundary = useMemo(() => {
    return calculateBoundingBox(shapes, 3.0); // 3m buffer around shapes
  }, [shapes]);

  // Phase 2: Track boundary collision state for visual feedback
  const boundaryCollisionRef = useRef({
    wasConstrained: false,
    lastConstrainedTime: 0,
    distanceToEdge: Infinity,
  });

  // Movement state (local - high frequency updates)
  const movementStateRef = useRef({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isSprinting: false,
    velocity: new Vector3(0, 0, 0),
    isOnGround: true,
  });

  // Track if ESC key was pressed (to distinguish from focus loss unlocks)
  const escPressedRef = useRef(false);

  // CRITICAL: Track player position separately from camera position
  // In third-person, camera != player position (camera is behind/above player)
  const playerPositionRef = useRef(new Vector3(
    walkthroughState?.position.x || 0,
    walkthroughState?.position.y || eyeHeight,
    walkthroughState?.position.z || 0
  ));

  // Track if we've initialized from store yet
  const initializedRef = useRef(false);

  // Initialize camera position from store
  useEffect(() => {
    if (walkthroughState && controlsRef.current) {
      const { position, rotation } = walkthroughState;

      // Set player position
      playerPositionRef.current.set(position.x, position.y, position.z);

      // Set camera position (initially same as player in first-person)
      camera.position.set(position.x, position.y, position.z);

      // Set camera rotation (Euler angles: pitch, yaw, roll)
      // Use YXZ order (standard for FPS cameras)
      camera.rotation.order = 'YXZ';
      camera.rotation.set(rotation.x, rotation.y, 0);

      // Initialize velocity
      movementStateRef.current.velocity.set(
        walkthroughState.velocity.x,
        walkthroughState.velocity.y,
        walkthroughState.velocity.z
      );

      initializedRef.current = true;
    }
  }, [walkthroughState?.position.x, walkthroughState?.position.z]); // Re-run when position changes

  // Keyboard input handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const state = movementStateRef.current;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        state.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        state.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        state.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        state.moveRight = true;
        break;
      case 'Space':
        // Jump only if on ground
        if (state.isOnGround) {
          state.velocity.y = jumpVelocity * accessibilitySettings.jumpHeightMultiplier;
          state.isOnGround = false;
          setWalkthroughJumping(true);
        }
        event.preventDefault(); // Prevent page scroll
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        state.isSprinting = true;
        break;
      case 'Escape':
        // Mark that ESC was pressed (to distinguish from focus loss)
        escPressedRef.current = true;

        // Check if pointer is locked
        if (controlsRef.current && controlsRef.current.isLocked) {
          // Pointer locked → unlock will trigger 'unlock' event → handleUnlock will exit
          controlsRef.current.unlock();
        } else {
          // Pointer already unlocked (Alt+Tab or not activated) → directly exit
          escPressedRef.current = false; // Reset flag
          toggleViewMode(); // Exit walkthrough mode immediately
        }
        break;
      case 'KeyC':
        // Toggle between first-person and third-person perspective
        toggleWalkthroughPerspective();
        event.preventDefault(); // CRITICAL: Prevent C from unlocking pointer
        break;
    }

    // Update moving state
    const isMoving = state.moveForward || state.moveBackward || state.moveLeft || state.moveRight;
    setWalkthroughMoving(isMoving);
  }, [jumpVelocity, accessibilitySettings.jumpHeightMultiplier, setWalkthroughJumping, setWalkthroughMoving]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const state = movementStateRef.current;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        state.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        state.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        state.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        state.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        state.isSprinting = false;
        break;
    }

    // Update moving state
    const isMoving = state.moveForward || state.moveBackward || state.moveLeft || state.moveRight;
    setWalkthroughMoving(isMoving);
  }, [setWalkthroughMoving]);

  // Setup keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Pointer lock event handlers
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    let lastLockTime = 0;

    const handleLock = () => {
      lastLockTime = Date.now();

      // Log BEFORE pointer lock affects anything
      console.log('[WalkthroughCamera] BEFORE pointer lock. Camera state:', {
        position: { x: camera.position.x.toFixed(2), y: camera.position.y.toFixed(2), z: camera.position.z.toFixed(2) },
        rotation: { x: camera.rotation.x.toFixed(4), y: camera.rotation.y.toFixed(4), z: camera.rotation.z.toFixed(4) },
        playerPosition: {
          x: playerPositionRef.current.x.toFixed(2),
          y: playerPositionRef.current.y.toFixed(2),
          z: playerPositionRef.current.z.toFixed(2)
        }
      });

      setWalkthroughPointerLocked(true);

      // Log AFTER pointer lock is set (next frame)
      requestAnimationFrame(() => {
        console.log('[WalkthroughCamera] AFTER pointer lock (next frame). Camera state:', {
          position: { x: camera.position.x.toFixed(2), y: camera.position.y.toFixed(2), z: camera.position.z.toFixed(2) },
          rotation: { x: camera.rotation.x.toFixed(4), y: camera.rotation.y.toFixed(4), z: camera.rotation.z.toFixed(4) },
          playerPosition: {
            x: playerPositionRef.current.x.toFixed(2),
            y: playerPositionRef.current.y.toFixed(2),
            z: playerPositionRef.current.z.toFixed(2)
          }
        });
      });
    };

    const handleUnlock = () => {
      const timeSinceLock = Date.now() - lastLockTime;

      // GUARD: Ignore unlocks that happen immediately after locking (< 500ms)
      // This prevents false unlocks from React remounting or focus issues
      if (timeSinceLock < 500) {
        return;
      }

      setWalkthroughPointerLocked(false);

      // CRITICAL: Only exit walkthrough mode if ESC was pressed
      // Focus loss (Alt+Tab) should just unlock pointer, not exit walkthrough
      if (escPressedRef.current) {
        escPressedRef.current = false; // Reset flag
        toggleViewMode(); // Exit walkthrough mode
      }
      // Otherwise: pointer unlocked but still in walkthrough mode
      // User will see "Click to activate" prompt when they return
    };

    controls.addEventListener('lock', handleLock);
    controls.addEventListener('unlock', handleUnlock);

    return () => {
      controls.removeEventListener('lock', handleLock);
      controls.removeEventListener('unlock', handleUnlock);
    };
  }, [toggleViewMode, setWalkthroughPointerLocked]);

  // Block pointer lock when UI panels are open (texture panel, sky panel, etc.)
  // If pointer lock is acquired while a panel is open, immediately release it
  useEffect(() => {
    const handlePointerLockChange = () => {
      const isPanelOpen = document.body.hasAttribute('data-texture-panel-open') ||
                          document.body.hasAttribute('data-sky-panel-open');
      if (document.pointerLockElement && isPanelOpen) {
        console.log('[WalkthroughCamera] Releasing pointer lock - UI panel is open');
        document.exitPointerLock();
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  // Auto-lock pointer when entering walkthrough mode
  // DISABLED: Auto-lock is unreliable due to focus issues in React strict mode
  // User must click to activate pointer lock
  // useEffect(() => {
  //   const controls = controlsRef.current;
  //   if (controls && !controls.isLocked) {
  //     console.log('[WalkthroughCamera] Attempting auto-lock...');
  //     // Request pointer lock after a short delay to ensure rendering is stable
  //     const timer = setTimeout(() => {
  //       try {
  //         // Only lock if document has focus
  //         if (document.hasFocus()) {
  //           controls.lock();
  //           console.log('[WalkthroughCamera] Auto-lock called successfully');
  //         } else {
  //           console.warn('[WalkthroughCamera] Auto-lock skipped - document does not have focus');
  //         }
  //       } catch (error) {
  //         console.error('[WalkthroughCamera] Auto-lock failed:', error);
  //       }
  //     }, 100);

  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  // Manual click-to-lock (required for pointer lock activation)
  useEffect(() => {
    const handleCanvasClick = () => {
      const controls = controlsRef.current;
      if (controls && !controls.isLocked) {
        // Ensure document has focus before attempting lock
        if (!document.hasFocus()) {
          window.focus();
        }

        try {
          controls.lock();
        } catch (error) {
          console.error('[WalkthroughCamera] Pointer lock failed:', error);
        }
      }
    };

    // Add click listener to canvas
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [gl.domElement]);

  // Physics and movement update (runs every frame)
  useFrame((state, delta) => {
    if (!controlsRef.current || !controlsRef.current.isLocked) return;

    const moveState = movementStateRef.current;
    const { velocity } = moveState;

    // Read camera rotation (PointerLockControls updates this automatically)
    const currentYaw = camera.rotation.y;
    const currentPitch = camera.rotation.x;

    // CRITICAL FIX: Prevent camera tilting and flipping upside down
    // 1. Ensure roll (rotation.z) is always 0 (no tilted horizon)
    // 2. Clamp pitch to -89° to +89° (prevent upside down)
    const maxPitch = Math.PI / 2 - 0.1; // 84.3 degrees (safe margin)
    const minPitch = -Math.PI / 2 + 0.1; // -84.3 degrees

    // Always force roll to 0 and order to YXZ (yaw, pitch, roll)
    camera.rotation.order = 'YXZ'; // Standard FPS camera rotation order
    camera.rotation.z = 0; // No roll/tilt

    // Clamp pitch if it exceeds safe limits
    if (camera.rotation.x > maxPitch) {
      camera.rotation.x = maxPitch;
    } else if (camera.rotation.x < minPitch) {
      camera.rotation.x = minPitch;
    }

    // Log first few frames after pointer lock
    if (Math.random() < 0.05) { // 5% sample rate
      console.log('[WalkthroughCamera] Frame update:', {
        cameraPos: { x: camera.position.x.toFixed(1), y: camera.position.y.toFixed(1), z: camera.position.z.toFixed(1) },
        cameraRot: { x: currentPitch.toFixed(3), y: currentYaw.toFixed(3) },
        playerPos: { x: playerPositionRef.current.x.toFixed(1), y: playerPositionRef.current.y.toFixed(1), z: playerPositionRef.current.z.toFixed(1) }
      });
    }

    // Calculate movement direction
    const direction = new Vector3();
    const forward = new Vector3();
    const right = new Vector3();

    camera.getWorldDirection(forward);
    forward.y = 0; // Project onto XZ plane (ignore pitch)
    forward.normalize();

    right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

    if (moveState.moveForward) direction.add(forward);
    if (moveState.moveBackward) direction.sub(forward);
    if (moveState.moveRight) direction.add(right);
    if (moveState.moveLeft) direction.sub(right);

    direction.normalize();

    // Apply movement speed (with accessibility multiplier)
    const speed = walkSpeed * accessibilitySettings.movementSpeedMultiplier * (moveState.isSprinting ? sprintMultiplier : 1.0);
    const movementVector = direction.multiplyScalar(speed * delta);

    // Apply horizontal movement
    velocity.x = movementVector.x / delta; // Convert to velocity
    velocity.z = movementVector.z / delta;

    // Apply gravity
    if (!moveState.isOnGround) {
      velocity.y -= gravity * delta;
    }

    // CRITICAL FIX: Update position from PLAYER position, not camera position
    // This prevents double-offsetting in third-person mode
    const newPosition = new Vector3(
      playerPositionRef.current.x + velocity.x * delta,
      playerPositionRef.current.y + velocity.y * delta,
      playerPositionRef.current.z + velocity.z * delta
    );

    // Ground collision detection
    if (newPosition.y <= groundLevel + eyeHeight) {
      newPosition.y = groundLevel + eyeHeight;
      velocity.y = 0;
      moveState.isOnGround = true;
      setWalkthroughJumping(false);
    } else {
      moveState.isOnGround = false;
    }

    // Phase 2: Boundary collision detection
    // Use polygon-based collision for walkable boundaries, fall back to bounding box
    let constrainedPosition: Point3D;
    let wasConstrained = false;

    if (walkableBoundaries && walkableBoundaries.length > 0) {
      // Phase 2: Use polygon-based collision for walkable boundaries
      const result = constrainToWalkableBoundary(
        { x: newPosition.x, y: newPosition.y, z: newPosition.z },
        walkableBoundaries,
        0.3 // 30cm pushback from edge
      );
      constrainedPosition = result.position;
      wasConstrained = result.wasConstrained;

      // Track distance to boundary edge for visual feedback
      const edgeInfo = getDistanceToBoundaryEdge(
        { x: newPosition.x, y: newPosition.y, z: newPosition.z },
        walkableBoundaries
      );
      boundaryCollisionRef.current.distanceToEdge = edgeInfo.distance;
    } else {
      // Fallback: Use bounding box from shapes
      constrainedPosition = constrainToBoundary(
        { x: newPosition.x, y: newPosition.y, z: newPosition.z },
        siteBoundary
      );
      // Check if constrained
      wasConstrained = (
        constrainedPosition.x !== newPosition.x ||
        constrainedPosition.z !== newPosition.z
      );
    }

    // Track collision state for visual feedback
    if (wasConstrained) {
      boundaryCollisionRef.current.wasConstrained = true;
      boundaryCollisionRef.current.lastConstrainedTime = Date.now();

      // Dispatch event for UI components to show feedback
      window.dispatchEvent(new CustomEvent('walkthrough-boundary-collision', {
        detail: { wasConstrained: true }
      }));
    } else if (boundaryCollisionRef.current.wasConstrained) {
      // Clear collision state after a short delay
      const timeSinceCollision = Date.now() - boundaryCollisionRef.current.lastConstrainedTime;
      if (timeSinceCollision > 200) {
        boundaryCollisionRef.current.wasConstrained = false;
      }
    }

    // CRITICAL: Update player position ref (this is the true player position)
    playerPositionRef.current.set(
      constrainedPosition.x,
      constrainedPosition.y,
      constrainedPosition.z
    );

    // Apply constrained position
    // In first-person: camera is at player position (eye level)
    // In third-person: camera is behind and above player

    if (perspectiveMode === 'third-person') {
      // Third-person camera offset: 5m behind, 2m above
      const behindOffset = 5.0; // meters
      const aboveOffset = 2.0; // meters

      // Use current yaw from PointerLockControls (don't modify it!)
      const yaw = currentYaw;

      // Calculate camera position behind the player based on yaw
      const offsetX = Math.sin(yaw) * behindOffset;
      const offsetZ = Math.cos(yaw) * behindOffset;

      const cameraX = constrainedPosition.x - offsetX;
      const cameraY = constrainedPosition.y + aboveOffset;
      const cameraZ = constrainedPosition.z - offsetZ;

      // Position camera behind and above player
      camera.position.set(cameraX, cameraY, cameraZ);

      // CRITICAL: Make camera look at player position
      // In third-person, we WANT to override PointerLockControls rotation
      // The mouse controls orbit angle (yaw), camera always looks at player
      camera.lookAt(
        constrainedPosition.x,
        constrainedPosition.y, // Look at player's center (eye level)
        constrainedPosition.z
      );
    } else {
      // First-person: camera at eye level (PointerLockControls handles rotation)
      camera.position.set(
        constrainedPosition.x,
        constrainedPosition.y,
        constrainedPosition.z
      );
    }

    // Sync position to store (throttled - only update every ~10 frames to reduce re-renders)
    if (Math.random() < 0.1) {
      // Store the player position (constrained position, not camera position)
      const pos: Point3D = {
        x: constrainedPosition.x,
        y: constrainedPosition.y,
        z: constrainedPosition.z,
      };

      const rot = {
        x: currentPitch,
        y: currentYaw,
      };

      const vel: Point3D = {
        x: velocity.x,
        y: velocity.y,
        z: velocity.z,
      };

      updateWalkthroughPosition(pos);
      updateWalkthroughRotation(rot);
      updateWalkthroughVelocity(vel);
    }
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      // PointerLockControls handles mouse look automatically
    />
  );
}
