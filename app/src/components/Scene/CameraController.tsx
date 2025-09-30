import { useRef, useImperativeHandle, forwardRef, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { Point3D } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export interface CameraControllerRef {
  focusOnPoint: (point: Point3D, duration?: number) => void;
  resetCamera: (duration?: number) => void;
  setViewpoint: (viewpoint: CameraViewpoint, duration?: number) => void;
  getCurrentPosition: () => Point3D;
  getCurrentTarget: () => Point3D;
}

export type CameraViewpoint = 'top' | 'front' | 'side' | 'isometric' | 'custom';

interface CameraControllerProps {
  enableControls?: boolean;
  maxDistance?: number;
  minDistance?: number;
  maxPolarAngle?: number;
  dampingFactor?: number;
  onCameraChange?: (position: Point3D, target: Point3D) => void;
}

const CameraController = forwardRef<CameraControllerRef, CameraControllerProps>(
  (
    {
      enableControls = true,
      maxDistance = Infinity,
      minDistance = 0.1,
      maxPolarAngle = Math.PI / 2.1,
      dampingFactor = 0.05,
      onCameraChange,
    },
    ref
  ) => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { camera, gl } = useThree();
    const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);
    const setZoom2D = useAppStore(state => state.setZoom2D);

    const animationRef = useRef<{
      isAnimating: boolean;
      startTime: number;
      duration: number;
      startPosition: Vector3;
      startTarget: Vector3;
      endPosition: Vector3;
      endTarget: Vector3;
    }>({
      isAnimating: false,
      startTime: 0,
      duration: 1000,
      startPosition: new Vector3(),
      startTarget: new Vector3(),
      endPosition: new Vector3(),
      endTarget: new Vector3(),
    });

    const viewpoints: Record<CameraViewpoint, { position: Point3D; target: Point3D }> = {
      top: { position: { x: 0, y: 50, z: 0 }, target: { x: 0, y: 0, z: 0 } },
      front: { position: { x: 0, y: 10, z: 50 }, target: { x: 0, y: 0, z: 0 } },
      side: { position: { x: 50, y: 10, z: 0 }, target: { x: 0, y: 0, z: 0 } },
      isometric: { position: { x: 30, y: 30, z: 30 }, target: { x: 0, y: 0, z: 0 } },
      custom: { position: { x: 0, y: 30, z: 30 }, target: { x: 0, y: 0, z: 0 } },
    };

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animateCamera = (
      endPosition: Vector3,
      endTarget: Vector3,
      duration: number = 1000
    ) => {
      if (!controlsRef.current) return;

      const animation = animationRef.current;
      animation.isAnimating = true;
      animation.startTime = performance.now();
      animation.duration = duration;
      animation.startPosition.copy(camera.position);
      animation.startTarget.copy(controlsRef.current.target);
      animation.endPosition.copy(endPosition);
      animation.endTarget.copy(endTarget);
    };

    useFrame(() => {
      const animation = animationRef.current;
      
      if (animation.isAnimating && controlsRef.current) {
        const elapsed = performance.now() - animation.startTime;
        const progress = Math.min(elapsed / animation.duration, 1);
        const easedProgress = easeInOutCubic(progress);

        camera.position.lerpVectors(animation.startPosition, animation.endPosition, easedProgress);
        controlsRef.current.target.lerpVectors(animation.startTarget, animation.endTarget, easedProgress);

        if (progress >= 1) {
          animation.isAnimating = false;
        }

        controlsRef.current.update();
      }
    });

    useImperativeHandle(ref, () => ({
      focusOnPoint: (point: Point3D, duration = 1000) => {
        const distance = camera.position.distanceTo(new Vector3(0, 0, 0));
        const direction = new Vector3(point.x, point.y, point.z).normalize();
        const newPosition = direction.multiplyScalar(distance).add(new Vector3(point.x, point.y, point.z));
        
        animateCamera(
          newPosition,
          new Vector3(point.x, point.y, point.z),
          duration
        );
      },

      resetCamera: (duration = 1000) => {
        const defaultViewpoint = viewpoints.isometric;
        animateCamera(
          new Vector3(defaultViewpoint.position.x, defaultViewpoint.position.y, defaultViewpoint.position.z),
          new Vector3(defaultViewpoint.target.x, defaultViewpoint.target.y, defaultViewpoint.target.z),
          duration
        );
      },

      setViewpoint: (viewpoint: CameraViewpoint, duration = 1000) => {
        const view = viewpoints[viewpoint];
        animateCamera(
          new Vector3(view.position.x, view.position.y, view.position.z),
          new Vector3(view.target.x, view.target.y, view.target.z),
          duration
        );
      },

      getCurrentPosition: (): Point3D => ({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      }),

      getCurrentTarget: (): Point3D => {
        if (!controlsRef.current) return { x: 0, y: 0, z: 0 };
        return {
          x: controlsRef.current.target.x,
          y: controlsRef.current.target.y,
          z: controlsRef.current.target.z,
        };
      },
    }));


    // Dynamic control configuration based on 2D/3D mode
    const controlConfig = useMemo(() => {
      if (is2DMode) {
        return {
          enableRotate: false,     // No rotation in 2D
          enablePan: true,
          enableZoom: true,
          panSpeed: 2.0,          // Faster pan in 2D
          zoomSpeed: 3.0,         // Faster zoom in 2D
          rotateSpeed: 0,         // No rotation
          mouseButtons: {
            LEFT: undefined,       // Disable left click
            MIDDLE: 2,            // Pan with middle (THREE.MOUSE.PAN = 2)
            RIGHT: undefined      // Disable right click in 2D
          },
          touches: {
            ONE: 2,               // Pan with one finger
            TWO: 3                // Zoom with two fingers
          }
        };
      }

      // Existing 3D configuration
      return {
        enableRotate: true,
        enablePan: true,
        enableZoom: true,
        panSpeed: 1.5,
        zoomSpeed: 2.0,
        rotateSpeed: 1.0,
        mouseButtons: {
          LEFT: undefined,        // Left-click does nothing
          MIDDLE: 2,             // Middle-click for PAN
          RIGHT: 0               // Right-click for ROTATE/orbit
        }
      };
    }, [is2DMode]);

    // Handle zoom changes in 2D mode
    useEffect(() => {
      if (is2DMode && controlsRef.current) {
        const handleZoomChange = () => {
          if (camera && 'zoom' in camera) {
            setZoom2D(camera.zoom);
          }
        };

        controlsRef.current.addEventListener('change', handleZoomChange);
        return () => {
          controlsRef.current?.removeEventListener('change', handleZoomChange);
        };
      }
    }, [is2DMode, camera, setZoom2D]);

    const handleChange = useCallback(() => {
      if (onCameraChange && controlsRef.current) {
        const position = {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        };
        const target = {
          x: controlsRef.current.target.x,
          y: controlsRef.current.target.y,
          z: controlsRef.current.target.z,
        };
        onCameraChange(position, target);
      }
    }, [camera.position.x, camera.position.y, camera.position.z, onCameraChange]);

    // Set up custom event listeners for middle mouse and context menu handling
    useEffect(() => {
      const canvas = gl.domElement;

      const handleMouseDown = (event: MouseEvent) => {
        // Prevent default behavior for middle mouse button (button 1)
        if (event.button === 1) {
          event.preventDefault();
        }
      };

      const handleMouseUp = (event: MouseEvent) => {
        // Prevent default behavior for middle mouse button (button 1)
        if (event.button === 1) {
          event.preventDefault();
        }
      };

      const handleContextMenu = (event: MouseEvent) => {
        // Prevent context menu on right-click to avoid interference with orbit controls
        event.preventDefault();
      };

      // Add event listeners
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('contextmenu', handleContextMenu);
      
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('contextmenu', handleContextMenu);
      };
    }, [gl.domElement]);

    if (!enableControls) {
      return null;
    }

    return (
      <OrbitControls
        ref={controlsRef}
        maxDistance={maxDistance}
        minDistance={minDistance}
        maxPolarAngle={is2DMode ? undefined : maxPolarAngle}
        minPolarAngle={is2DMode ? 0 : undefined}
        dampingFactor={dampingFactor}
        enableDamping
        {...controlConfig}
        onChange={handleChange}
      />
    );
  }
);

CameraController.displayName = 'CameraController';

export default CameraController;