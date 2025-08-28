import { useRef, useImperativeHandle, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { Point3D } from '@/types';

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
      maxDistance = 200,
      minDistance = 5,
      maxPolarAngle = Math.PI / 2.1,
      dampingFactor = 0.05,
      onCameraChange,
    },
    ref
  ) => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { camera } = useThree();
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

    const handleChange = () => {
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
    };

    if (!enableControls) {
      return null;
    }

    return (
      <OrbitControls
        ref={controlsRef}
        maxDistance={maxDistance}
        minDistance={minDistance}
        maxPolarAngle={maxPolarAngle}
        dampingFactor={dampingFactor}
        enableDamping
        enablePan
        enableZoom
        enableRotate
        zoomSpeed={2.0}
        panSpeed={1.5}
        rotateSpeed={1.0}
        mouseButtons={{
          LEFT: null, // Left-click does nothing
          MIDDLE: 2,  // Middle-click for PAN (THREE.MOUSE.PAN = 2)
          RIGHT: 0    // Right-click for ROTATE/orbit (THREE.MOUSE.ROTATE = 0)
        }}
        onChange={handleChange}
      />
    );
  }
);

CameraController.displayName = 'CameraController';

export default CameraController;