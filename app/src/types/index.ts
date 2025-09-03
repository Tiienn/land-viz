// Core geometry types
export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Layer types
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  opacity: number;
  created: Date;
  modified: Date;
}

// Rotation metadata for shapes
export interface ShapeRotation {
  angle: number;    // degrees
  center: Point2D;  // rotation pivot point
}

// Shape types
export interface Shape {
  id: string;
  name: string;
  points: Point2D[];
  type: ShapeType;
  color: string;
  visible: boolean;
  layerId: string;
  created: Date;
  modified: Date;
  rotation?: ShapeRotation;
}

export type ShapeType = 'polygon' | 'rectangle' | 'circle' | 'line';

// Drawing tool types
export type DrawingTool = 'polygon' | 'rectangle' | 'circle' | 'select' | 'edit' | 'polyline' | 'rotate';

export interface DrawingState {
  activeTool: DrawingTool;
  isDrawing: boolean;
  currentShape: Partial<Shape> | null;
  snapToGrid: boolean;
  gridSize: number;
  showDimensions: boolean;
  isEditMode: boolean;
  editingShapeId: string | null;
  selectedCornerIndex: number | null;
  // Resize mode state (only available in 'select' mode)
  isResizeMode: boolean;
  resizingShapeId: string | null;
  resizeHandleType: 'corner' | 'edge' | null;
  resizeHandleIndex: number | null;
  maintainAspectRatio: boolean;
  // Rotation mode state (only available in 'select' mode)
  isRotateMode: boolean;
  rotatingShapeId: string | null;
  rotationStartAngle: number;
  rotationCenter: Point2D | null;
}

// Measurement types
export interface Measurements {
  area: number;
  perimeter: number;
  units: 'metric' | 'imperial';
}

// Application state
export interface AppState {
  shapes: Shape[];
  layers: Layer[];
  selectedShapeId: string | null;
  hoveredShapeId: string | null;
  dragState: DragState;
  activeLayerId: string;
  drawing: DrawingState;
  measurements: Record<string, Measurements>;
  history: HistoryState;
}

export interface DragState {
  isDragging: boolean;
  draggedShapeId: string | null;
  startPosition: Point2D | null;
  currentPosition: Point2D | null;
  originalShapePoints: Point2D[] | null;
}

export interface HistoryState {
  past: string[]; // JSON strings of past states
  present: string; // JSON string of current state
  future: string[]; // JSON strings of future states
}

export interface CameraSettings {
  position: Point3D;
  target: Point3D;
  zoom: number;
}

export interface SceneSettings {
  gridSize: number;
  gridDivisions: number;
  showGrid: boolean;
  backgroundColor: string;
  cameraPosition: Point3D;
  cameraTarget: Point3D;
  enableOrbitControls: boolean;
  maxPolarAngle: number;
  minDistance: number;
  maxDistance: number;
}