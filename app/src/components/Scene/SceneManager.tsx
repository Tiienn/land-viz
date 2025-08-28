import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
// Removed Vector3 import to avoid type conflicts
import CameraController, { type CameraControllerRef } from './CameraController';
import DrawingCanvas from './DrawingCanvas';
import ShapeRenderer from './ShapeRenderer';
import GridBackground from './GridBackground';
import type { SceneSettings, Point3D, Point2D } from '@/types';

export interface SceneManagerRef {
  cameraController: React.RefObject<CameraControllerRef | null>;
}

interface SceneManagerProps {
  children?: React.ReactNode;
  settings?: Partial<SceneSettings>;
  onPointerMove?: (x: number, y: number, z: number) => void;
  onClick?: (x: number, y: number, z: number) => void;
  onCameraChange?: (position: Point3D, target: Point3D) => void;
  onCoordinateChange?: (worldPos: Point2D, screenPos: Point2D) => void;
}

const defaultSettings: SceneSettings = {
  gridSize: 1000,
  gridDivisions: 100,
  showGrid: true,
  backgroundColor: 'transparent',
  cameraPosition: { x: 0, y: 80, z: 80 },
  cameraTarget: { x: 0, y: 0, z: 0 },
  enableOrbitControls: true,
  maxPolarAngle: Math.PI / 2.05,
  minDistance: 20,
  maxDistance: 500,
};

interface SceneContentProps extends SceneManagerProps {
  cameraControllerRef: React.RefObject<CameraControllerRef | null>;
}

const SceneContent: React.FC<SceneContentProps> = ({ 
  children, 
  settings, 
  onCameraChange,
  onCoordinateChange,
  cameraControllerRef
}) => {
  const finalSettings = { ...defaultSettings, ...settings };

  // Note: Click handling is now done by DrawingCanvas component
  // These callbacks are kept for backward compatibility if needed

  return (
    <>
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight
        position={[10, 20, 8]}
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <hemisphereLight
        skyColor="#3b82f6"
        groundColor="#16a34a" 
        intensity={0.4}
      />

      <CameraController
        ref={cameraControllerRef}
        enableControls={finalSettings.enableOrbitControls}
        maxPolarAngle={finalSettings.maxPolarAngle}
        minDistance={finalSettings.minDistance}
        maxDistance={finalSettings.maxDistance}
        dampingFactor={0.05}
        onCameraChange={onCameraChange}
      />

      {finalSettings.showGrid && (
        <GridBackground
          cellSize={5}
          gridColor="#a3a3a3"
          sectionColor="#525252"
          backgroundColor="#16a34a"
        />
      )}

      <DrawingCanvas
        onCoordinateChange={onCoordinateChange}
        gridSnap={finalSettings.showGrid}
        gridSize={finalSettings.gridSize / finalSettings.gridDivisions}
      />

      <ShapeRenderer elevation={0.01} />

      <Environment preset="city" background={false} />

      {children}
    </>
  );
};

export const SceneManager = React.forwardRef<SceneManagerRef, SceneManagerProps>((props, ref) => {
  const { settings } = props;
  const cameraControllerRef = useRef<CameraControllerRef>(null);
  const finalSettings = { ...defaultSettings, ...settings };

  React.useImperativeHandle(ref, () => ({
    cameraController: cameraControllerRef,
  }));

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{
          position: [
            finalSettings.cameraPosition.x,
            finalSettings.cameraPosition.y,
            finalSettings.cameraPosition.z,
          ],
          fov: 75,
          near: 0.1,
          far: 10000,
        }}
        shadows
        style={{ width: '100%', height: '100%', display: 'block' }}
        gl={{ 
          antialias: true, 
          alpha: true,
          premultipliedAlpha: false,
        }}
        dpr={[1, 2]}
        style={{ background: '#3b82f6' }}
      >
        <Suspense fallback={null}>
          <SceneContent {...props} cameraControllerRef={cameraControllerRef} />
        </Suspense>
      </Canvas>
    </div>
  );
});

SceneManager.displayName = 'SceneManager';

export default SceneManager;