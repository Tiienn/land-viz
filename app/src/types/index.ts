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

// Shape types
export interface Shape {
  id: string;
  name: string;
  points: Point2D[];
  type: ShapeType;
  color: string;
  visible: boolean;
  created: Date;
  modified: Date;
}

export type ShapeType = 'polygon' | 'rectangle' | 'circle' | 'line';

// Drawing tool types
export type DrawingTool = 'polygon' | 'rectangle' | 'circle' | 'select' | 'edit' | 'polyline';

export interface DrawingState {
  activeTool: DrawingTool;
  isDrawing: boolean;
  currentShape: Partial<Shape> | null;
  snapToGrid: boolean;
  gridSize: number;
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
  selectedShapeId: string | null;
  drawing: DrawingState;
  measurements: Record<string, Measurements>;
  history: HistoryState;
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