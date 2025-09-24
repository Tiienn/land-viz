import React, { Suspense, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
// Removed Vector3 import to avoid type conflicts
import CameraController, { type CameraControllerRef } from './CameraController';
import DrawingCanvas from './DrawingCanvas';
import DrawingFeedback from './DrawingFeedback';
import ShapeRenderer from './ShapeRenderer';
import MeasurementRenderer from './MeasurementRenderer';
import InfiniteGrid from './GridBackground';
import BackgroundManager from './BackgroundManager';
import { SnapIndicator } from './SnapIndicator';
import { ActiveSnapIndicator } from './ActiveSnapIndicator';
// import AlignmentGuides from './AlignmentGuides';
import SimpleAlignmentGuides from './SimpleAlignmentGuides';
import DraggableShapes from './DraggableShapes';
import ResizableShapeControls from './ResizableShapeControls';
import RulerSystem from './RulerSystem';
import type { SceneSettings, Point3D, Point2D } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export interface SceneManagerRef {
  cameraController: React.RefObject<CameraControllerRef | null>;
  camera: any;
  canvas: HTMLCanvasElement | null;
}

interface SceneManagerProps {
  children?: React.ReactNode;
  settings?: Partial<SceneSettings>;
  onPointerMove?: (x: number, y: number, z: number) => void;
  onClick?: (x: number, y: number, z: number) => void;
  onCameraChange?: (position: Point3D, target: Point3D) => void;
  onCoordinateChange?: (worldPos: Point2D, screenPos: Point2D) => void;
  hideDimensions?: boolean;
  onDimensionChange?: (dimensions: {
    width?: number;
    height?: number;
    area?: number;
    radius?: number;
    length?: number;
  } | null) => void;
  onPolylineStartProximity?: (isNear: boolean) => void;
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
  minDistance: 0.1,
  maxDistance: Infinity,
};

interface SceneContentProps extends SceneManagerProps {
  cameraControllerRef: React.RefObject<CameraControllerRef | null>;
  onCameraCanvasReady?: (camera: any, canvas: HTMLCanvasElement) => void;
}

// Helper component to capture camera and canvas from useThree
const CameraCanvasCapture: React.FC<{ onReady?: (camera: any, canvas: HTMLCanvasElement) => void }> = ({ onReady }) => {
  const { camera, gl } = useThree();

  React.useEffect(() => {
    if (onReady && camera && gl.domElement) {
      onReady(camera, gl.domElement);
    }
  }, [camera, gl.domElement, onReady]);

  return null;
};

const SceneContent: React.FC<SceneContentProps> = ({
  children,
  settings,
  onCameraChange,
  onCoordinateChange,
  onDimensionChange,
  onPolylineStartProximity,
  cameraControllerRef,
  onCameraCanvasReady,
  hideDimensions = false
}) => {
  const finalSettings = { ...defaultSettings, ...settings };
  const alignmentGuides = useAppStore(state => state.drawing.alignment?.activeGuides || []);
  const alignmentConfig = useAppStore(state => state.drawing.alignment?.config);

  // Use new alignment store - temporarily disabled
  // const { showGuides } = useAlignmentStore();
  const showGuides = true; // Default fallback

  // Note: Click handling is now done by DrawingCanvas component
  // These callbacks are kept for backward compatibility if needed

  return (
    <>
      <CameraCanvasCapture onReady={onCameraCanvasReady} />
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
        color="#3b82f6"
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

      {/* Background manager handles scene background based on grid state */}
      <BackgroundManager showGrid={finalSettings.showGrid} gridOffColor="#f5f5f5" />

      {finalSettings.showGrid && (
        <InfiniteGrid
          size={10}
          divisions={10}
          colorGrid="#cccccc"
          colorCenterLine="#999999"
          distance={5000}
        />
      )}

      <DrawingCanvas
        onCoordinateChange={onCoordinateChange}
        gridSnap={finalSettings.showGrid}
        gridSize={1} // Use 1 meter grid for drawing, independent of visual grid
      />

      <DrawingFeedback elevation={0.05} onDimensionChange={onDimensionChange} onPolylineStartProximity={onPolylineStartProximity} />

      <ShapeRenderer elevation={0.01} hideDimensions={hideDimensions} />

      {/* Measurement visualization */}
      <MeasurementRenderer elevation={0.03} />

      {/* Resize handles for selected shapes */}
      <ResizableShapeControls elevation={0.02} />

      {/* Snap Indicators */}
      <SnapIndicator maxDistance={100} />
      <ActiveSnapIndicator />

      {/* Professional Alignment Guides - New Smart System */}
      {/* <AlignmentGuides /> */}

      {/* Simple Alignment Guides - Purple dashed lines */}
      <SimpleAlignmentGuides />

      {/* Draggable shapes with alignment guides */}
      <DraggableShapes />

      {/* Professional ruler system - temporarily disabled to find 'm' issue */}
      {/* <RulerSystem 
        visible={true}
        showMarkers={true}
        unit="m"
        precision={1}
      /> */}

      {/* Environment disabled temporarily due to CSP/HDR loading issues */}
      {/* <Environment preset="city" background={false} /> */}

      {children}
    </>
  );
};

export const SceneManager = React.forwardRef<SceneManagerRef, SceneManagerProps>((props, ref) => {
  const { settings, hideDimensions = false } = props;
  const cameraControllerRef = useRef<CameraControllerRef>(null);
  const cameraRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const finalSettings = { ...defaultSettings, ...settings };

  const handleCameraCanvasReady = useCallback((camera: any, canvas: HTMLCanvasElement) => {
    cameraRef.current = camera;
    canvasRef.current = canvas;
  }, []);

  React.useImperativeHandle(ref, () => ({
    cameraController: cameraControllerRef,
    camera: cameraRef.current,
    canvas: canvasRef.current,
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
      >
        <Suspense fallback={null}>
          <SceneContent {...props} cameraControllerRef={cameraControllerRef} onCameraCanvasReady={handleCameraCanvasReady} />
        </Suspense>
      </Canvas>
    </div>
  );
});

SceneManager.displayName = 'SceneManager';

export default SceneManager;