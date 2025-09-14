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

export type ShapeType = 'polygon' | 'rectangle' | 'circle' | 'polyline';

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
  liveResizePoints: Point2D[] | null;
  // Rotation mode state (only available in 'select' mode)
  isRotateMode: boolean;
  rotatingShapeId: string | null;
  rotationStartAngle: number;
  rotationCenter: Point2D | null;
  // Enhanced snapping and guides system
  snapping: {
    /** Current snap configuration */
    config: SnapConfig;
    /** Currently detected snap points */
    availableSnapPoints: SnapPoint[];
    /** Currently active snap point (being snapped to) */
    activeSnapPoint: SnapPoint | null;
    /** Snap preview position */
    snapPreviewPosition: Point2D | null;
  };
  guides: {
    /** Static user-created guides */
    staticGuides: Guide[];
    /** Currently visible alignment guides */
    activeAlignmentGuides: AlignmentGuide[];
    /** Guide system configuration */
    config: GuideConfig;
    /** Currently creating a new guide */
    isCreatingGuide: boolean;
    /** Guide creation preview */
    guidePreview: Partial<Guide> | null;
  };
  rulers: {
    /** Ruler system configuration */
    config: RulerConfig;
    /** Current mouse position for ruler indicators */
    mousePosition: Point2D | null;
  };
  grid: {
    /** Enhanced grid configuration */
    config: GridConfig;
  };
}

// Area unit types for Insert Area feature
export type AreaUnit = 'sqm' | 'sqft' | 'acres' | 'hectares' | 'sqkm';

export interface AreaValidation {
  isValid: boolean;
  error?: string;
  numValue?: number;
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

// ================================
// SNAPPING SYSTEM TYPES
// ================================

/**
 * Different types of snap points for precision drawing
 */
export type SnapType = 'grid' | 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'perpendicular' | 'extension' | 'tangent' | 'quadrant' | 'edge';

/**
 * Individual snap point with position and metadata
 */
export interface SnapPoint {
  /** Unique identifier for the snap point */
  id: string;
  /** Type of snap point */
  type: SnapType;
  /** World position of the snap point */
  position: Point2D;
  /** Visual priority (higher = more prominent display) */
  strength: number;
  /** ID of the shape this snap point belongs to (if any) */
  shapeId?: string;
  /** Additional metadata for the snap point */
  metadata?: {
    /** Human-readable description */
    description?: string;
    /** Related shape edge index (for midpoints, edges) */
    edgeIndex?: number;
    /** Angle for rotational snaps (degrees) */
    angle?: number;
  };
}

/**
 * Configuration for the snapping system behavior
 */
export interface SnapConfig {
  /** Global enable/disable for snapping */
  enabled: boolean;
  /** Snap detection radius in pixels */
  snapRadius: number;
  /** Which snap types are currently active */
  activeTypes: Set<SnapType>;
  /** Visual feedback settings */
  visual: {
    /** Show snap point indicators */
    showIndicators: boolean;
    /** Show snap lines/guides when snapping */
    showSnapLines: boolean;
    /** Color for snap point indicators */
    indicatorColor: string;
    /** Color for snap alignment lines */
    snapLineColor: string;
    /** Size of snap indicators in pixels */
    indicatorSize: number;
  };
  /** Performance settings */
  performance: {
    /** Maximum number of snap points to calculate */
    maxSnapPoints: number;
    /** Update frequency for dynamic snap points (ms) */
    updateInterval: number;
  };
}

// ================================
// GUIDE SYSTEM TYPES
// ================================

/**
 * Static guide line (user-created horizontal or vertical reference)
 */
export interface Guide {
  /** Unique identifier */
  id: string;
  /** Guide orientation */
  type: 'horizontal' | 'vertical';
  /** Position along the perpendicular axis */
  position: number;
  /** Guide label/name */
  label?: string;
  /** Visual styling */
  color: string;
  /** Line thickness in pixels */
  thickness: number;
  /** Whether the guide is currently visible */
  visible: boolean;
  /** Whether the guide is locked (prevents deletion/modification) */
  locked: boolean;
  /** Creation timestamp */
  created: Date;
}

/**
 * Dynamic alignment guide (appears during drawing/editing)
 */
export interface AlignmentGuide {
  /** Unique identifier for this alignment */
  id: string;
  /** Type of alignment */
  type: 'horizontal' | 'vertical' | 'angular';
  /** Reference points that created this alignment */
  referencePoints: Point2D[];
  /** The alignment line/angle */
  alignment: {
    /** For horizontal/vertical: the axis position */
    position?: number;
    /** For angular: the angle in degrees */
    angle?: number;
    /** Line start point */
    start: Point2D;
    /** Line end point */
    end: Point2D;
  };
  /** Visual styling for the alignment guide */
  style: {
    color: string;
    thickness: number;
    dashPattern?: number[];
  };
  /** Strength/priority of this alignment (0-1) */
  strength: number;
}

/**
 * Configuration for the guide system
 */
export interface GuideConfig {
  /** Static guides settings */
  staticGuides: {
    /** Enable static user guides */
    enabled: boolean;
    /** Default color for new guides */
    defaultColor: string;
    /** Default thickness for new guides */
    defaultThickness: number;
    /** Show guide labels */
    showLabels: boolean;
    /** Snap to guides */
    snapToGuides: boolean;
  };
  /** Dynamic alignment guides settings */
  alignmentGuides: {
    /** Enable dynamic alignment guides */
    enabled: boolean;
    /** Detection sensitivity (higher = more guides) */
    sensitivity: number;
    /** Colors for different alignment types */
    colors: {
      horizontal: string;
      vertical: string;
      angular: string;
    };
    /** Show alignment guides during drawing */
    showDuringDraw: boolean;
    /** Show alignment guides during editing */
    showDuringEdit: boolean;
  };
}

// ================================
// RULER SYSTEM TYPES
// ================================

/**
 * Position marker on ruler for measurements
 */
export interface RulerMarker {
  /** Unique identifier */
  id: string;
  /** Position along the ruler */
  position: number;
  /** Marker label */
  label: string;
  /** Marker color */
  color: string;
  /** Whether marker is draggable */
  draggable: boolean;
}

/**
 * Configuration for the ruler system
 */
export interface RulerConfig {
  /** Enable ruler display */
  enabled: boolean;
  /** Show horizontal ruler */
  showHorizontal: boolean;
  /** Show vertical ruler */
  showVertical: boolean;
  /** Units for ruler measurements */
  units: 'metric' | 'imperial';
  /** Ruler styling */
  style: {
    /** Background color */
    backgroundColor: string;
    /** Text color */
    textColor: string;
    /** Major tick color */
    majorTickColor: string;
    /** Minor tick color */
    minorTickColor: string;
    /** Ruler thickness in pixels */
    thickness: number;
    /** Font size for labels */
    fontSize: number;
  };
  /** Measurement precision */
  precision: {
    /** Decimal places for display */
    decimalPlaces: number;
    /** Major tick interval */
    majorTickInterval: number;
    /** Minor tick interval */
    minorTickInterval: number;
  };
  /** Custom markers on rulers */
  markers: RulerMarker[];
}

// ================================
// GRID SYSTEM TYPES
// ================================

/**
 * Enhanced grid configuration
 */
export interface GridConfig {
  /** Enable grid display */
  enabled: boolean;
  /** Primary grid spacing */
  primarySpacing: number;
  /** Secondary grid spacing (subdivisions) */
  secondarySpacing: number;
  /** Grid origin point */
  origin: Point2D;
  /** Visual styling */
  style: {
    /** Primary grid line color */
    primaryColor: string;
    /** Secondary grid line color */
    secondaryColor: string;
    /** Primary line thickness */
    primaryThickness: number;
    /** Secondary line thickness */
    secondaryThickness: number;
    /** Grid opacity (0-1) */
    opacity: number;
  };
  /** Grid behavior */
  behavior: {
    /** Show grid labels/coordinates */
    showLabels: boolean;
    /** Adaptive grid density based on zoom */
    adaptive: boolean;
    /** Fade grid at high zoom levels */
    fadeAtZoom: boolean;
  };
}

// ================================
// UTILITY AND HELPER TYPES
// ================================

/**
 * Geometric utilities for snapping calculations
 */
export interface GeometryUtils {
  /** Calculate distance between two points */
  distance: (p1: Point2D, p2: Point2D) => number;
  /** Find nearest point on line segment */
  nearestPointOnLine: (point: Point2D, lineStart: Point2D, lineEnd: Point2D) => Point2D;
  /** Check if two lines intersect */
  lineIntersection: (line1Start: Point2D, line1End: Point2D, line2Start: Point2D, line2End: Point2D) => Point2D | null;
  /** Calculate angle between three points */
  angleBetweenPoints: (center: Point2D, p1: Point2D, p2: Point2D) => number;
}

/**
 * Snapping result with additional context
 */
export interface SnapResult {
  /** Whether a snap was found */
  snapped: boolean;
  /** The snapped position */
  position: Point2D;
  /** The snap point that was used */
  snapPoint?: SnapPoint;
  /** Distance to the snap point */
  distance?: number;
  /** Additional visual indicators */
  indicators?: {
    /** Snap lines to draw */
    snapLines: Array<{ start: Point2D; end: Point2D; color: string }>;
    /** Additional guides to show */
    guides: AlignmentGuide[];
  };
}

/**
 * Drawing context for snap/guide calculations
 */
export interface DrawingContext {
  /** Current cursor position */
  cursorPosition: Point2D;
  /** Currently drawing shape (if any) */
  currentShape?: Partial<Shape>;
  /** All existing shapes for reference */
  shapes: Shape[];
  /** Current zoom level */
  zoomLevel: number;
  /** Camera viewport bounds */
  viewport: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

/**
 * Event types for snapping and guide system
 */
export type SnapGuideEvent = 'snap_activated' | 'snap_deactivated' | 'alignment_guide_created' | 'alignment_guide_removed' | 'static_guide_created' | 'static_guide_modified' | 'static_guide_deleted';

/**
 * Configuration presets for different use cases
 */
export interface SnapGuidePresets {
  /** Basic snapping (grid + endpoints only) */
  basic: {
    snap: Partial<SnapConfig>;
    guides: Partial<GuideConfig>;
    grid: Partial<GridConfig>;
  };
  /** Professional CAD-style (all snap types, alignment guides) */
  professional: {
    snap: Partial<SnapConfig>;
    guides: Partial<GuideConfig>;
    grid: Partial<GridConfig>;
    ruler: Partial<RulerConfig>;
  };
  /** Minimal (only grid snapping, no guides) */
  minimal: {
    snap: Partial<SnapConfig>;
    guides: Partial<GuideConfig>;
    grid: Partial<GridConfig>;
  };
}