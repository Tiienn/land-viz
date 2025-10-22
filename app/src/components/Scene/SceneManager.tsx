import React, { Suspense, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
// Removed Vector3 import to avoid type conflicts
import CameraController, { type CameraControllerRef } from './CameraController';
import Camera2DToggle from './Camera2DToggle';
import DrawingCanvas from './DrawingCanvas';
import DrawingFeedback from './DrawingFeedback';
import ShapeRenderer from './ShapeRenderer';
import MeasurementRenderer from './MeasurementRenderer';
import PrecisionLinePreview from './PrecisionLinePreview';
import InfiniteGrid from './GridBackground';
import BackgroundManager from './BackgroundManager';
import { SnapIndicator } from './SnapIndicator';
import { ActiveSnapIndicator } from './ActiveSnapIndicator';
import { useAppStore } from '@/store/useAppStore';
// import AlignmentGuides from './AlignmentGuides';
import SimpleAlignmentGuides from './SimpleAlignmentGuides';
import DraggableShapes from './DraggableShapes';
import ResizableShapeControls from './ResizableShapeControls';
import TextResizeControls from './TextResizeControls'; // Phase 4B: Text resize controls
import TextRotationControls from './TextRotationControls'; // Phase 4C: Text rotation controls
import RulerSystem from './RulerSystem';
import { GroupBoundaryManager } from './GroupBoundaryManager';
import { MultiSelectionBoundary } from './MultiSelectionBoundary';
import { TextRenderer } from '../Text/TextRenderer';
import { ShapeLabelRenderer } from '../Text/ShapeLabelRenderer';
import { ElementRenderer } from './ElementRenderer'; // Phase 3: Unified element rendering
import type { SceneSettings, Point3D, Point2D } from '@/types';
import { isTextElement } from '@/types'; // Phase 4B: Type guard for text elements

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

  // Phase 4B: Get selected text elements for resize controls
  const selectedElementIds = useAppStore(state => state.selectedElementIds);
  const elements = useAppStore(state => state.elements);
  const selectedTextElements = React.useMemo(() => {
    // Safe fallback: elements might be undefined if migration hasn't run yet
    if (!elements) return [];
    return elements.filter(el =>
      selectedElementIds.includes(el.id) && isTextElement(el)
    ).filter(isTextElement); // Double filter to ensure TypeScript type narrowing
  }, [elements, selectedElementIds]);

  // Get current view mode to adjust snap indicator distance
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);

  // Calculate appropriate distance limits for snap indicators
  // 3D camera is at distance ~113 units, 2D camera is at ~100 units
  const snapIndicatorDistance = is2DMode ? 120 : 150;

  // Use new alignment store - temporarily disabled
  // const { showGuides } = useAlignmentStore();
  const showGuides = true; // Default fallback

  // Note: Click handling is now done by DrawingCanvas component
  // These callbacks are kept for backward compatibility if needed

  return (
    <>
      <CameraCanvasCapture onReady={onCameraCanvasReady} />
      <Camera2DToggle />
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

      {/* Text objects rendering */}
      <TextRenderer />

      {/* Phase 5: Shape labels rendering */}
      <ShapeLabelRenderer />

      {/* Phase 3: Unified element rendering (Text as Layers) */}
      {/* Note: Elements array empty until migration runs - backward compatible */}
      {/* CRITICAL FIX: Show dimensions here since ElementRenderer now renders all new shapes */}
      <ElementRenderer elevation={0.01} hideDimensions={hideDimensions} />

      {/* Group boundaries for Canva-style grouping */}
      <GroupBoundaryManager />

      {/* Multi-selection boundary with resize handles */}
      <MultiSelectionBoundary elevation={0.02} />

      {/* Measurement visualization */}
      <MeasurementRenderer elevation={0.03} />

      {/* Line tool preview */}
      <PrecisionLinePreview />

      {/* Resize handles for selected shapes */}
      <ResizableShapeControls elevation={0.02} />

      {/* Phase 4B: Resize handles for selected text elements */}
      {selectedTextElements.map(textElement => (
        <TextResizeControls
          key={`text-resize-${textElement.id}`}
          element={textElement}
          elevation={0.02}
        />
      ))}

      {/* Phase 4C: Rotation handles for selected text elements */}
      {selectedTextElements.map(textElement => (
        <TextRotationControls
          key={`text-rotation-${textElement.id}`}
          element={textElement}
          elevation={0.02}
        />
      ))}

      {/* Snap Indicators - Dynamic distance based on view mode */}
      <SnapIndicator maxDistance={snapIndicatorDistance} />
      {/* <ActiveSnapIndicator /> */} {/* Disabled - large pulsing indicator is too distracting */}

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