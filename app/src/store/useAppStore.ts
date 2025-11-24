import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { precisionCalculator, type PrecisionMeasurement } from '../services/precisionCalculations';
import { booleanOperationEngine, type BooleanResult, type SubdivisionSettings } from '../services/booleanOperations';
import { professionalExportEngine, type ExportOptions, type ExportResult } from '../services/professionalExport';
import { alignmentService } from '../services/alignmentService';
import { useToolHistoryStore } from './useToolHistoryStore';
// import { AlignmentGuideService } from '../services/AlignmentGuideService';
// import { useAlignmentStore } from './useAlignmentStore';
import { GeometryCache } from '../utils/GeometryCache';
import { logger } from '../utils/logger';
import { getWorldPoints, calculateBoundingBox } from '../utils/geometryTransforms';
import { flipPointsHorizontally, flipPointsVertically } from '../utils/flipUtils';
import { convertToSquareMeters, calculateGridAwareDimensions, getUnitLabel, calculateSmartGridPosition, generateShapeFromArea } from '../utils/areaCalculations';
import { SimpleAlignment, type SpacingMeasurement } from '../services/simpleAlignment';
import { SnapGrid } from '../utils/SnapGrid';
import { MeasurementUtils, MEASUREMENT_CONSTANTS } from '../utils/measurementUtils';
import { calculateDirection, applyDistance, parseDistance } from '../utils/precisionMath';
import { applySquareConstraint, applyAngleConstraint, applyAxisLockConstraint } from '../utils/shapeConstraints';
import { defaultAreaPresets } from '../data/areaPresets';
import { loadCustomPresets, saveCustomPresets } from '../utils/presetStorage';
import type { AppState, Shape, Layer, DrawingTool, Point2D, ShapeType, DrawingState, SnapPoint, SnapType, AlignmentGuide, AreaUnit, AddAreaConfig, Measurement, MeasurementPoint, MeasurementState, LineSegment } from '../types';
import type { AreaPreset, PresetsState, PresetCategory } from '../types/presets';
import type { ConversionActions } from '../types/conversion';
import type { ContextMenuState, ContextMenuType } from '../types/contextMenu';
import { useTextStore } from './useTextStore'; // Phase 4: Import for text grouping
import { invalidateLayerThumbnail } from '../services/thumbnailService'; // Phase 3: Thumbnail invalidation
import type { WalkableBoundary, TerrainType, FenceStyle } from '../services/boundaryDetection/types'; // Phase 1: Walkable boundaries

interface AppStore extends AppState {
  // Layer actions
  createLayer: (name: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  selectLayer: (id: string, multiSelect: boolean) => void;
  selectLayerRange: (startId: string, endId: string) => void;
  moveShapeToLayer: (shapeId: string, layerId: string) => void;
  moveLayerToFront: (layerId: string) => void;
  moveLayerForward: (layerId: string) => void;
  moveLayerBackward: (layerId: string) => void;
  moveLayerToBack: (layerId: string) => void;

  // Folder actions (Phase 3)
  createFolder: (name: string) => void;
  moveToFolder: (layerId: string, folderId: string) => void;
  deleteFolder: (folderId: string, deleteContents?: boolean) => void;
  toggleFolderCollapse: (folderId: string) => void;
  getFolderDepth: (folderId: string) => number;
  folderContains: (folderId: string, targetLayerId: string) => boolean;
  
  // Drawing actions
  setActiveTool: (tool: DrawingTool) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  toggleShowDimensions: () => void;
  triggerRender: () => void;
  startDrawing: () => void;
  removeLastPoint: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  setShiftKey: (pressed: boolean) => void;

  // Shape actions
  addShape: (shape: Omit<Shape, 'id' | 'created' | 'modified'>) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  selectMultipleShapes: (ids: string[]) => void;
  toggleShapeSelection: (id: string) => void;
  clearSelection: () => void;
  hoverShape: (id: string | null) => void;
  setHoveredGroupId: (groupId: string | null) => void;
  setHighlightedShapeId: (shapeId: string | null) => void;
  duplicateShape: (id: string) => void;
  createShapeFromArea: (area: number, unit: AreaUnit) => void;

  // Add Area Modal Actions
  addAreaModalOpen: boolean;
  openAddAreaModal: () => void;
  closeAddAreaModal: () => void;
  createAreaShapeAdvanced: (config: AddAreaConfig) => void;

  // Presets Modal Actions
  openPresetsModal: () => void;
  closePresetsModal: () => void;
  setSelectedCategory: (category: PresetCategory) => void;
  setSearchQuery: (query: string) => void;
  selectPreset: (presetId: string | null) => void;
  createShapeFromPreset: (preset: AreaPreset) => void;
  customizePreset: (preset: AreaPreset) => void;
  saveCustomPreset: (preset: Omit<AreaPreset, 'id' | 'isCustom' | 'created'>) => void;
  deleteCustomPreset: (presetId: string) => void;
  addToRecentPresets: (presetId: string) => void;
  toggleFavoritePreset: (presetId: string) => void;
  loadCustomPresetsFromStorage: () => void;

  // Drag actions
  startDragging: (shapeId: string, startPosition: Point2D) => void;
  updateDragPosition: (currentPosition: Point2D) => void;
  finishDragging: () => void;
  cancelDragging: () => void;

  // Element drag actions (Phase 4A: Element-aware dragging)
  startElementDrag: (elementId: string, elementType: 'shape' | 'text', startPosition: Point2D) => void;
  updateElementDragPosition: (currentPosition: Point2D) => void;
  finishElementDrag: () => void;

  // Point manipulation
  addPoint: (point: Point2D) => void;
  updatePoint: (index: number, point: Point2D) => void;
  removePoint: (index: number) => void;

  // Edit mode actions
  enterEditMode: (shapeId: string) => void;
  exitEditMode: () => void;
  selectCorner: (cornerIndex: number | null) => void;
  updateShapePoint: (shapeId: string, pointIndex: number, point: Point2D) => void;
  updateShapePointLive: (shapeId: string, pointIndex: number, point: Point2D) => void;
  addShapeCorner: (shapeId: string, pointIndex: number, point: Point2D) => void;
  deleteShapeCorner: (shapeId: string, pointIndex: number) => void;
  convertRectangleToPolygon: (shapeId: string, newPoints: Point2D[]) => void;
  convertRectangleToPolygonLive: (shapeId: string, newPoints: Point2D[]) => void;

  // Resize mode actions (only available in 'select' mode)
  enterResizeMode: (shapeId: string) => void;
  exitResizeMode: () => void;
  setResizeHandle: (handleType: 'corner' | 'edge', handleIndex: number) => void;
  setMaintainAspectRatio: (maintain: boolean) => void;
  resizeShape: (shapeId: string, newPoints: Point2D[]) => void;
  resizeShapeLive: (shapeId: string, newPoints: Point2D[]) => void;

  // Multi-selection resize actions
  resizeMultiSelection: (
    shapeIds: string[],
    originalBounds: { minX: number; minY: number; maxX: number; maxY: number },
    newBounds: { minX: number; minY: number; maxX: number; maxY: number },
    scaleX: number,
    scaleY: number,
    translateX: number,
    translateY: number
  ) => void;
  resizeMultiSelectionLive: (
    shapeIds: string[],
    originalBounds: { minX: number; minY: number; maxX: number; maxY: number },
    newBounds: { minX: number; minY: number; maxX: number; maxY: number },
    scaleX: number,
    scaleY: number,
    translateX: number,
    translateY: number
  ) => void;

  // Rotation mode actions (only available in 'select' mode)
  enterRotateMode: (shapeId: string) => void;
  exitRotateMode: () => void;
  rotateShapeLive: (shapeId: string, angle: number, center: Point2D) => void;
  rotateShape: (shapeId: string, angle: number, center: Point2D) => void;

  // Cursor rotation mode actions (hover-to-rotate mode)
  enterCursorRotationMode: (shapeId: string) => void;
  exitCursorRotationMode: (cancel?: boolean) => void;
  applyCursorRotation: (shapeId: string, angle: number, center: Point2D) => void;

  // Flip actions (available in 'select' mode)
  flipShapes: (shapeIds: string[], direction: 'horizontal' | 'vertical') => void;
  flipSelectedShapes: (direction: 'horizontal' | 'vertical') => void;

  // Measurement actions (only available in 'measure' mode)
  activateMeasurementTool: () => void;
  deactivateMeasurementTool: () => void;
  startMeasurement: (point: Point2D, snapPoint?: SnapPoint) => void;
  updateMeasurementPreview: (point: Point2D) => void;
  completeMeasurement: (point: Point2D, snapPoint?: SnapPoint) => void;
  cancelMeasurement: () => void;
  toggleMeasurementVisibility: (id: string) => void;
  deleteMeasurement: (id: string) => void;
  clearAllMeasurements: () => void;
  selectMeasurement: (id: string | null) => void;
  setMeasurementUnit: (unit: 'metric' | 'imperial' | 'toise') => void;
  toggleMeasurementDisplay: () => void;

  // Line tool actions (only available in 'line' mode)
  activateLineTool: () => void;
  deactivateLineTool: () => void;
  startLineDrawing: (point: Point2D) => void;
  updateLinePreview: (point: Point2D) => void;
  updateDistanceInput: (value: string) => void;
  showDistanceInput: () => void;
  hideDistanceInput: () => void;
  confirmLineDistance: () => void;
  cancelLineDrawing: () => void;
  completeLine: () => void;
  enableMultiSegmentMode: () => void;
  clearAllLineSegments: () => void;
  removeLastLineSegment: () => void;
  toggleMultiSegmentMode: () => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  validateShapeIntegrity: (shape: Shape) => Shape;

  // Utility actions
  clearAll: () => void;
  exportShapes: () => Shape[];
  importShapes: (shapes: Shape[]) => void;

  // Precision calculation actions
  calculateShapeMeasurements: (shapeId: string) => PrecisionMeasurement | null;
  getTotalArea: () => string;
  getShapeCount: () => number;
  getAverageArea: () => string;

  // Boolean operation actions
  unionShapes: (shapeIds: string[]) => BooleanResult;
  intersectShapes: (shapeIdA: string, shapeIdB: string) => BooleanResult;
  subtractShapes: (minuendId: string, subtrahendId: string) => BooleanResult;
  xorShapes: (shapeIdA: string, shapeIdB: string) => BooleanResult;
  subdivideProperty: (shapeId: string, settings: SubdivisionSettings) => BooleanResult;
  addBooleanResults: (result: BooleanResult) => void;

  // Professional export actions
  exportToExcel: (options?: Partial<ExportOptions>) => Promise<ExportResult>;
  exportToDXF: (options?: Partial<ExportOptions>) => Promise<ExportResult>;
  exportToGeoJSON: (options?: Partial<ExportOptions>) => Promise<ExportResult>;
  exportToPDF: (options?: Partial<ExportOptions>) => Promise<ExportResult>;
  downloadExport: (result: ExportResult) => void;

  // Universal cancel action (ESC key)
  cancelAll: () => void;

  // Alignment and snapping system methods
  updateDrawingState: (updates: Partial<DrawingState>) => void;
  setCursorPosition: (position: Point2D | null) => void;
  updateSnapPoints: (snapPoints: SnapPoint[], activeSnapPoint?: SnapPoint | null) => void;
  updateAlignmentGuides: (guides: AlignmentGuide[], draggingShapeId?: string | null) => void;
  updateAlignmentSpacings: (spacings: SpacingMeasurement[]) => void;
  updateAlignmentSnapPosition: (snapPosition: { x: number; y: number } | null) => void;
  clearAlignmentGuides: () => void;
  setSnapping: (updates: Partial<DrawingState['snapping']>) => void;
  setSnapMode: (mode: 'fixed' | 'adaptive') => void;
  setScreenSpacePixels: (pixels: number) => void;

  // Visual Comparison Tool actions
  toggleComparisonPanel: () => void;
  toggleObjectVisibility: (objectId: string) => void;
  setComparisonSearch: (query: string) => void;
  setComparisonCategory: (category: import('../types/referenceObjects').ReferenceCategory | 'all') => void;
  calculateComparisons: () => Promise<void>;
  resetComparison: () => void;

  // Unit Conversion Tool actions
  toggleConvertPanel: () => void;
  setInputValue: (value: string) => void;
  setInputUnit: (unit: AreaUnit) => void;
  clearConversion: () => void;
  setInputError: (error: string | null) => void;

  // View Mode actions (2D/3D/Walkthrough)
  setViewMode: (mode: '2D' | '3D') => void;
  toggleViewMode: () => void;
  setZoom2D: (zoom: number) => void;
  saveCurrentView: () => void;
  restorePerspectiveView: () => void;

  // Walkthrough mode actions
  updateWalkthroughPosition: (position: Point3D) => void;
  updateWalkthroughRotation: (rotation: { x: number; y: number }) => void;
  updateWalkthroughVelocity: (velocity: Point3D) => void;
  setWalkthroughMoving: (isMoving: boolean) => void;
  setWalkthroughJumping: (isJumping: boolean) => void;
  toggleWalkthroughPerspective: () => void;
  setWalkthroughPointerLocked: (locked: boolean) => void;

  // Walkable boundary actions (Phase 1: AI Walkthrough Terrain Generation)
  walkableBoundaries: WalkableBoundary[];
  addWalkableBoundary: (boundary: Omit<WalkableBoundary, 'id' | 'created'>) => void;
  removeWalkableBoundary: (id: string) => void;
  updateWalkableBoundary: (id: string, updates: Partial<WalkableBoundary>) => void;
  clearWalkableBoundaries: () => void;
  getActiveWalkableBoundary: () => WalkableBoundary | null;
  setActiveWalkableBoundaryId: (id: string | null) => void;
  activeWalkableBoundaryId: string | null;

  // Context menu actions
  openContextMenu: (
    type: ContextMenuType,
    position: { x: number; y: number },
    targetShapeId?: string
  ) => void;
  closeContextMenu: () => void;

  // Keyboard shortcuts - Shape manipulation
  nudgeShape: (shapeId: string, direction: 'up' | 'down' | 'left' | 'right', distance: number) => void;
  selectAllShapes: () => void;

  // Keyboard shortcuts - Grouping
  groupShapes: () => void;
  ungroupShapes: () => void;

  // Keyboard shortcuts - Alignment
  alignShapesLeft: (shapeIds: string[]) => void;
  alignShapesRight: (shapeIds: string[]) => void;
  alignShapesTop: (shapeIds: string[]) => void;
  alignShapesBottom: (shapeIds: string[]) => void;
  alignShapesCenter: (shapeIds: string[]) => void;
  alignShapesMiddle: (shapeIds: string[]) => void;

  // Keyboard shortcuts - Distribution
  distributeShapesHorizontally: (shapeIds: string[]) => void;
  distributeShapesVertically: (shapeIds: string[]) => void;

  // Keyboard shortcuts - Z-order
  bringShapeToFront: (shapeId: string) => void;
  sendShapeToBack: (shapeId: string) => void;
  bringShapeForward: (shapeId: string) => void;
  sendShapeBackward: (shapeId: string) => void;

  // Element management (unified system for shapes + text)
  addElement: (element: Omit<import('../types').Element, 'id' | 'created' | 'modified'>) => import('../types').Element;
  updateElement: (id: string, updates: Partial<import('../types').Element>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  selectElement: (id: string | null) => void;
  selectMultipleElements: (ids: string[]) => void;
  toggleElementSelection: (id: string) => void;
  clearElementSelection: () => void;
  hoverElement: (id: string | null) => void;
  getElementById: (id: string) => import('../types').Element | undefined;
  getElementsByLayer: (layerId: string) => import('../types').Element[];
  getElementsByGroup: (groupId: string) => import('../types').Element[];
  getSelectedElements: () => import('../types').Element[];
  getVisibleElements: () => import('../types').Element[];
  groupSelectedElements: () => void;
  ungroupSelectedElements: () => void;
  runMigration: () => void;
  rollbackMigration: () => void;
}

const generateId = (): string => {
  return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDefaultDrawingState = () => ({
  activeTool: 'select' as DrawingTool,
  isDrawing: false,
  currentShape: null,
  snapToGrid: true,
  gridSize: 1, // Changed from 10 to 1 meter grid for more reasonable dimensions
  showDimensions: true,
  isEditMode: false,
  editingShapeId: null,
  selectedCornerIndex: null,
  // Resize mode state
  isResizeMode: false,
  resizingShapeId: null,
  resizeHandleType: null,
  resizeHandleIndex: null,
  maintainAspectRatio: false,
  liveResizePoints: null,
  // Rotation mode state
  isRotateMode: false,
  rotatingShapeId: null,
  rotationStartAngle: 0,
  rotationCenter: null,
  originalRotation: null,
  // Cursor rotation mode state (hover-to-rotate)
  cursorRotationMode: false,
  cursorRotationShapeId: null,
  // Enhanced snapping and guides system
  snapping: {
    config: {
      enabled: true,
      snapRadius: 25,  // ENHANCED: Increased from 15 to 25 for more magnetic feel
      mode: 'adaptive',  // Default to adaptive mode for better UX
      screenSpacePixels: 75,  // Default screen-space distance (75px)
      activeTypes: new Set(['grid', 'endpoint', 'midpoint', 'center', 'edge', 'perpendicular']),  // ENHANCED: Added edge and perpendicular
      visual: {
        showIndicators: true,
        showSnapLines: true,
        indicatorColor: '#00C4CC',
        snapLineColor: '#FF0000',
        indicatorSize: 8
      },
      performance: {
        maxSnapPoints: 1000,
        updateInterval: 16
      }
    },
    availableSnapPoints: [],
    activeSnapPoint: null,
    snapPreviewPosition: null
  },
  snapConfirmation: null,  // Visual snap confirmation flash
  cursorPosition: null,
  guides: {
    staticGuides: [],
    activeAlignmentGuides: [],
    config: {
      enabled: true,
      showStaticGuides: true,
      showAlignmentGuides: true,
      snapToGuides: true,
      guideSnapRadius: 10,
      visual: {
        staticGuideColor: '#00C4CC',
        alignmentGuideColor: '#EC4899',
        guideThickness: 1,
        guideOpacity: 0.7,
        alignmentGuideOpacity: 0.8
      },
      behavior: {
        autoCreateAlignmentGuides: true,
        showGuideLabels: true,
        maxAlignmentGuides: 10
      }
    },
    creatingGuide: false
  },
  rulers: {
    config: {
      enabled: true,
      showRulers: true,
      unit: 'meters',
      precision: 2,
      visual: {
        backgroundColor: '#f8fafc',
        textColor: '#374151',
        lineColor: '#d1d5db',
        majorTickColor: '#6b7280',
        minorTickColor: '#d1d5db',
        fontSize: 10,
        padding: 20
      },
      behavior: {
        showTooltip: true,
        snapToTicks: false,
        adaptiveScale: true
      }
    },
    mousePosition: { x: 0, y: 0 }
  },
  // Professional alignment system
  alignment: {
    config: {
      enabled: false,
      alignmentThreshold: 15,
      snapStrength: 0.8,
      showCenterGuides: true,
      showEdgeGuides: true,
      showSpacingGuides: true,
      maxGuides: 8
    },
    activeGuides: [],
    activeSpacings: [],
    draggingShapeId: null,
    snapPosition: null
  },
  grid: {
    config: {
      enabled: true,
      primarySpacing: 1,
      secondarySpacing: 0.5,
      origin: { x: 0, y: 0 },
      style: {
        primaryColor: '#000000',
        secondaryColor: '#cccccc',
        primaryThickness: 1,
        secondaryThickness: 0.5,
        opacity: 0.5
      },
      behavior: {
        showLabels: false,
        adaptive: true,
        fadeAtZoom: true
      }
    }
  },
  // Measurement system state
  measurement: {
    isActive: false,
    isMeasuring: false,
    startPoint: null,
    previewEndPoint: null,
    measurements: [],
    selectedMeasurementId: null,
    showMeasurements: true,
    unit: MEASUREMENT_CONSTANTS.DEFAULT_UNIT
  },
  // Line tool state
  lineTool: {
    isActive: false,
    isDrawing: false,
    startPoint: null,
    inputValue: '',
    currentDistance: null,
    previewEndPoint: null,
    segments: [],
    isWaitingForInput: false,
    inputPosition: { x: 0, y: 0 },
    showInput: false,
    isMultiSegment: false
  },
  // Shift-key constraint mode (Feature 017)
  isShiftKeyPressed: false
});

const createDefaultLayer = (): Layer => {
  return {
    id: 'default-layer',
    name: 'Main Layer',
    visible: true,
    locked: false,
    color: '#3b82f6',
    opacity: 1,
    created: new Date(),
    modified: new Date()
  };
};

const createDefaultShape = (): Shape => {
  // Create a default 5000 m² square (70.7m x 70.7m) centered at origin
  const sideLength = Math.sqrt(5000); // ≈ 70.71 meters
  const half = sideLength / 2;
  
  return {
    id: 'default-land-area',
    type: 'rectangle',
    name: 'Default Land Area (Edit Me)',
    points: [
      { x: -half, y: -half },  // Top-left
      { x: half, y: -half },   // Top-right  
      { x: half, y: half },    // Bottom-right
      { x: -half, y: half }    // Bottom-left
    ],
    color: '#3B82F6', // Blue highlight
    visible: true,
    layerId: 'default-layer',
    created: new Date(),
    modified: new Date()
  };
};

const createInitialState = (): AppState => {
  const defaultLayer = createDefaultLayer();
  // Removed default shape - start with empty canvas
  const baseState = {
    // Unified element system
    elements: [],
    selectedElementIds: [],
    hoveredElementId: null,

    // Legacy systems (for backward compatibility)
    shapes: [],
    layers: [defaultLayer],
    selectedShapeId: null, // Don't auto-select default shape on page load
    selectedShapeIds: [] as string[], // For multi-selection support
    hoveredShapeId: null,
    hoveredGroupId: null, // Canva-style grouping: track hovered group
    highlightedShapeId: null, // Canva-style grouping: track highlighted shape in group
    dragState: {
      isDragging: false,
      draggedShapeId: null,
      startPosition: null,
      currentPosition: null,
      originalShapePoints: null,
      originalShapesData: undefined,
    },
    activeLayerId: defaultLayer.id,
    drawing: getDefaultDrawingState(),
    measurements: {},
    history: {
      past: [],
      present: '',
      future: [],
    },
    migrations: {
      snappingTypesV1: false,
    },
    renderTrigger: 0,
    presets: {
      presetsModal: {
        isOpen: false,
        selectedCategory: 'residential' as PresetCategory,
        searchQuery: '',
        selectedPreset: null,
        isLoading: false,
      },
      defaultPresets: defaultAreaPresets,
      customPresets: loadCustomPresets(),
      recentPresets: [],
      favoritePresets: [],
    },
    comparison: {
      panelExpanded: false,
      visibleObjects: new Set(),
      searchQuery: '',
      selectedCategory: 'all',
      calculations: null,
    },
    conversion: {
      convertPanelExpanded: false,
      currentInputValue: '',
      currentInputUnit: 'sqm',
      lastValidValue: null,
      inputError: null,
    },
    viewState: {
      is2DMode: false,
      viewMode: '3d-orbit' as const, // Default to 3D orbit view
      cameraType: 'perspective' as const,
      viewAngle: '3d' as const,
      zoom2D: 1,
      lastPerspectivePosition: undefined,
      lastPerspectiveTarget: undefined,
      transition: {
        isAnimating: false,
        startTime: 0,
        duration: 300,
      },
      walkthroughState: {
        position: { x: 0, y: 1.7, z: 5 }, // Eye level (1.7m) above ground, 5m from origin
        rotation: { x: 0, y: 0 }, // Pitch and yaw
        velocity: { x: 0, y: 0, z: 0 },
        isMoving: false,
        isJumping: false,
        perspectiveMode: 'first-person' as const, // Default to first-person view
        pointerLocked: false, // Track if pointer lock is active
      },
    },
    shiftKeyPressed: false, // Task 4.2: Shift key state for disabling snapping
    contextMenu: {
      isOpen: false,
      type: null,
      position: { x: 0, y: 0 },
      targetShapeId: null,
    },
    // Phase 1: Walkable boundaries for AI Walkthrough Terrain Generation
    walkableBoundaries: [] as WalkableBoundary[],
    activeWalkableBoundaryId: null as string | null,
  };
  
  // Set the present state to JSON representation of the base state
  baseState.history.present = JSON.stringify({
    shapes: baseState.shapes,
    layers: baseState.layers,
    selectedShapeId: baseState.selectedShapeId,
    selectedShapeIds: baseState.selectedShapeIds,
    hoveredShapeId: baseState.hoveredShapeId,
    hoveredGroupId: baseState.hoveredGroupId,
    highlightedShapeId: baseState.highlightedShapeId,
    dragState: baseState.dragState,
    activeLayerId: baseState.activeLayerId,
    drawing: baseState.drawing,
    measurements: baseState.measurements,
    presets: baseState.presets,
    comparison: {
      ...baseState.comparison,
      visibleObjects: Array.from(baseState.comparison.visibleObjects) // Convert Set to Array for JSON serialization
    },
    conversion: baseState.conversion,
  });
  
  return baseState;
};

const initialState: AppState = createInitialState();

// Create SnapGrid instance for drag operations
const dragSnapGrid = new SnapGrid(10, 2); // 10m cell size, 2m default snap radius

/**
 * Helper function to find the closest point on a shape to a target position
 * Used for precise edge snapping during drag operations
 * @param shape - The shape being dragged
 * @param target - The target snap point position
 * @returns The closest point on the shape to the target
 */
function findClosestShapePoint(shape: Shape, target: Point2D): Point2D {
  let closestPoint = shape.points[0];
  let minDist = Infinity;

  // Check all shape points (corners)
  for (const point of shape.points) {
    const dist = Math.sqrt(
      Math.pow(point.x - target.x, 2) +
      Math.pow(point.y - target.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closestPoint = point;
    }
  }

  return closestPoint;
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Add Area Modal State
      addAreaModalOpen: false,

      // Layer actions
      createLayer: (name: string) => {
        const newLayer: Layer = {
          id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          visible: true,
          locked: false,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
          opacity: 1,
          created: new Date(),
          modified: new Date()
        };
        
        set(
          state => ({
            layers: [...state.layers, newLayer],
            activeLayerId: newLayer.id
          }),
          false,
          'createLayer'
        );
      },

      updateLayer: (id: string, updates: Partial<Layer>) => {
        set(
          state => {
            const updatedLayers = state.layers.map(layer =>
              layer.id === id ? { ...layer, ...updates, modified: new Date() } : layer
            );

            // If color is being updated, also update all shapes in this layer
            let updatedShapes = state.shapes;
            if (updates.color && updates.color !== state.layers.find(l => l.id === id)?.color) {
              updatedShapes = state.shapes.map(shape =>
                shape.layerId === id ? { ...shape, color: updates.color!, modified: new Date() } : shape
              );
            }

            return {
              layers: updatedLayers,
              shapes: updatedShapes,
            };
          },
          false,
          'updateLayer'
        );

        // Invalidate thumbnail cache when layer is modified
        // This ensures thumbnails regenerate with updated colors/properties
        invalidateLayerThumbnail(id);
      },

      deleteLayer: (id: string) => {
        const state = get();
        if (state.layers.length <= 1) return; // Don't delete the last layer
        
        // Delete all shapes that belong to this layer
        const remainingLayers = state.layers.filter(layer => layer.id !== id);
        const targetLayerId = remainingLayers[0].id;
        
        set(
          prevState => ({
            layers: remainingLayers,
            shapes: prevState.shapes.filter(shape => shape.layerId !== id), // DELETE shapes instead of moving them
            activeLayerId: prevState.activeLayerId === id ? targetLayerId : prevState.activeLayerId,
            selectedShapeId: prevState.shapes.some(shape => shape.id === prevState.selectedShapeId && shape.layerId === id) 
              ? null : prevState.selectedShapeId // Deselect if selected shape was deleted
          }),
          false,
          'deleteLayer'
        );
        
        // Save state to history AFTER deleting layer and its shapes (like finishDrawing does)
        get().saveToHistory();
      },

      setActiveLayer: (id: string) => {
        set({ activeLayerId: id }, false, 'setActiveLayer');
      },

      selectLayer: (id: string, multiSelect: boolean) => {
        set(
          (state) => {
            if (multiSelect) {
              // Multi-select: toggle the layer in the selection
              const isSelected = state.selectedLayerIds?.includes(id);
              const newSelection = isSelected
                ? (state.selectedLayerIds || []).filter((layerId) => layerId !== id)
                : [...(state.selectedLayerIds || []), id];

              return {
                selectedLayerIds: newSelection,
                activeLayerId: id // Set as active layer
              };
            } else {
              // Single select: clear all and select only this one
              return {
                selectedLayerIds: [id],
                activeLayerId: id // Set as active layer
              };
            }
          },
          false,
          'selectLayer'
        );
      },

      selectLayerRange: (startId: string, endId: string) => {
        set(
          (state) => {
            const layers = state.layers;
            const startIndex = layers.findIndex((l) => l.id === startId);
            const endIndex = layers.findIndex((l) => l.id === endId);

            if (startIndex === -1 || endIndex === -1) {
              return state; // Invalid range, don't change anything
            }

            // Get all layer IDs in the range (inclusive)
            const minIndex = Math.min(startIndex, endIndex);
            const maxIndex = Math.max(startIndex, endIndex);
            const rangeIds = layers
              .slice(minIndex, maxIndex + 1)
              .map((l) => l.id);

            return {
              selectedLayerIds: rangeIds,
              activeLayerId: endId // Set the end layer as active
            };
          },
          false,
          'selectLayerRange'
        );
      },

      moveShapeToLayer: (shapeId: string, layerId: string) => {
        set(
          state => ({
            shapes: state.shapes.map(shape =>
              shape.id === shapeId ? { ...shape, layerId, modified: new Date() } : shape
            ),
          }),
          false,
          'moveShapeToLayer'
        );
      },

      moveLayerToFront: (layerId: string) => {
        set(
          state => {
            const layerIndex = state.layers.findIndex(l => l.id === layerId);
            if (layerIndex === -1 || layerIndex === state.layers.length - 1) return state;
            
            const newLayers = [...state.layers];
            const layer = newLayers.splice(layerIndex, 1)[0];
            newLayers.push(layer); // Move to end (front in rendering order)
            
            return { layers: newLayers };
          },
          false,
          'moveLayerToFront'
        );
      },

      moveLayerForward: (layerId: string) => {
        set(
          state => {
            const layerIndex = state.layers.findIndex(l => l.id === layerId);
            if (layerIndex === -1 || layerIndex === state.layers.length - 1) return state;
            
            const newLayers = [...state.layers];
            [newLayers[layerIndex], newLayers[layerIndex + 1]] = [newLayers[layerIndex + 1], newLayers[layerIndex]];
            
            return { layers: newLayers };
          },
          false,
          'moveLayerForward'
        );
      },

      moveLayerBackward: (layerId: string) => {
        set(
          state => {
            const layerIndex = state.layers.findIndex(l => l.id === layerId);
            if (layerIndex === -1 || layerIndex === 0) return state;
            
            const newLayers = [...state.layers];
            [newLayers[layerIndex], newLayers[layerIndex - 1]] = [newLayers[layerIndex - 1], newLayers[layerIndex]];
            
            return { layers: newLayers };
          },
          false,
          'moveLayerBackward'
        );
      },

      moveLayerToBack: (layerId: string) => {
        set(
          state => {
            const layerIndex = state.layers.findIndex(l => l.id === layerId);
            if (layerIndex === -1 || layerIndex === 0) return state;

            const newLayers = [...state.layers];
            const layer = newLayers.splice(layerIndex, 1)[0];
            newLayers.unshift(layer); // Move to beginning (back in rendering order)

            return { layers: newLayers };
          },
          false,
          'moveLayerToBack'
        );
      },

      // Folder actions (Phase 3)
      createFolder: (name: string) => {
        const newFolder: Layer = {
          id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          type: 'folder',
          visible: true,
          locked: false,
          color: '#6b7280', // Gray color for folders
          opacity: 1,
          collapsed: false, // Folders start expanded
          created: new Date(),
          modified: new Date()
        };

        set(
          state => ({
            layers: [...state.layers, newFolder],
            activeLayerId: newFolder.id
          }),
          false,
          'createFolder'
        );

        logger.info('Folder created', { folderId: newFolder.id, name });
      },

      moveToFolder: (layerId: string, folderId: string) => {
        set(
          state => {
            // Validate folder exists and is actually a folder
            const folder = state.layers.find(l => l.id === folderId);
            if (!folder || folder.type !== 'folder') {
              logger.warn('Invalid folder', { folderId });
              return state;
            }

            // Prevent circular nesting (folder containing itself)
            if (layerId === folderId) {
              logger.warn('Cannot move folder into itself', { layerId, folderId });
              return state;
            }

            // Check if moving a folder that would create circular dependency
            const layer = state.layers.find(l => l.id === layerId);
            if (layer?.type === 'folder') {
              // Check if target folder is a descendant of the layer being moved
              const isCircular = get().folderContains(layerId, folderId);
              if (isCircular) {
                logger.warn('Circular folder nesting prevented', { layerId, folderId });
                return state;
              }
            }

            const updatedLayers = state.layers.map(l =>
              l.id === layerId ? { ...l, parentId: folderId, modified: new Date() } : l
            );

            return { layers: updatedLayers };
          },
          false,
          'moveToFolder'
        );

        logger.info('Layer moved to folder', { layerId, folderId });
      },

      deleteFolder: (folderId: string, deleteContents: boolean = false) => {
        set(
          state => {
            const folder = state.layers.find(l => l.id === folderId);
            if (!folder || folder.type !== 'folder') {
              logger.warn('Invalid folder for deletion', { folderId });
              return state;
            }

            let updatedLayers = state.layers.filter(l => l.id !== folderId);
            const children = state.layers.filter(l => l.parentId === folderId);

            if (deleteContents) {
              // Delete all children recursively
              const getAllDescendants = (parentId: string): string[] => {
                const directChildren = state.layers.filter(l => l.parentId === parentId);
                let allDescendants: string[] = directChildren.map(c => c.id);

                directChildren.forEach(child => {
                  if (child.type === 'folder') {
                    allDescendants = allDescendants.concat(getAllDescendants(child.id));
                  }
                });

                return allDescendants;
              };

              const descendantIds = getAllDescendants(folderId);
              updatedLayers = updatedLayers.filter(l => !descendantIds.includes(l.id));

              // Also delete shapes in deleted layers
              const deletedLayerIds = [folderId, ...descendantIds];
              const updatedShapes = state.shapes.filter(s => !deletedLayerIds.includes(s.layerId));

              logger.info('Folder and contents deleted', { folderId, deletedCount: deletedLayerIds.length });

              return {
                layers: updatedLayers,
                shapes: updatedShapes
              };
            } else {
              // Move children to the parent's level (folder's parent)
              updatedLayers = updatedLayers.map(l =>
                l.parentId === folderId
                  ? { ...l, parentId: folder.parentId, modified: new Date() }
                  : l
              );

              logger.info('Folder deleted, children moved to parent', { folderId, childrenCount: children.length });

              return { layers: updatedLayers };
            }
          },
          false,
          'deleteFolder'
        );

        get().saveToHistory();
      },

      toggleFolderCollapse: (folderId: string) => {
        set(
          state => {
            const folder = state.layers.find(l => l.id === folderId);
            if (!folder || folder.type !== 'folder') {
              return state;
            }

            const updatedLayers = state.layers.map(l =>
              l.id === folderId
                ? { ...l, collapsed: !l.collapsed, modified: new Date() }
                : l
            );

            return { layers: updatedLayers };
          },
          false,
          'toggleFolderCollapse'
        );

        logger.info('Folder collapse toggled', { folderId });
      },

      getFolderDepth: (folderId: string): number => {
        const state = get();
        const folder = state.layers.find(l => l.id === folderId);

        if (!folder) return 0;

        let depth = 0;
        let currentId: string | undefined = folder.parentId;

        while (currentId) {
          depth++;
          const parent = state.layers.find(l => l.id === currentId);
          currentId = parent?.parentId;

          // Prevent infinite loop in case of circular reference
          if (depth > 100) {
            logger.error('Circular folder reference detected', { folderId });
            break;
          }
        }

        return depth;
      },

      folderContains: (folderId: string, targetLayerId: string): boolean => {
        const state = get();

        let currentId: string | undefined = targetLayerId;
        let iterations = 0;

        while (currentId) {
          if (currentId === folderId) {
            return true;
          }

          const layer = state.layers.find(l => l.id === currentId);
          currentId = layer?.parentId;

          // Prevent infinite loop
          iterations++;
          if (iterations > 100) {
            logger.error('Circular folder reference detected in folderContains', { folderId, targetLayerId });
            break;
          }
        }

        return false;
      },

      // Drawing actions
      setActiveTool: (tool: DrawingTool) => {
        const state = get();
        
        logger.log('🔧 ==> TOOL SWITCH DEBUG START <==');
        logger.log('🔧 Switching from', state.drawing.activeTool, 'to', tool);
        logger.log('🔧 Current resize state:', {
          isResizeMode: state.drawing.isResizeMode,
          resizingShapeId: state.drawing.resizingShapeId,
          liveResizePoints: state.drawing.liveResizePoints ? `${state.drawing.liveResizePoints.length} points` : 'null'
        });
        
        // Check if we need to clear resize state
        const isLeavingSelectTool = state.drawing.activeTool === 'select' && tool !== 'select';
        const needsResizeCleanup = isLeavingSelectTool && (state.drawing.isResizeMode || state.drawing.liveResizePoints);
        
        if (needsResizeCleanup) {
          logger.log('🔧 CRITICAL FIX: Tool switch requires resize cleanup');
          logger.log('🔧 Clearing liveResizePoints and geometry cache');
          
          // Clear geometry cache for shapes with live resize state
          if (state.drawing.resizingShapeId) {
            const resizingShape = state.shapes.find(s => s.id === state.drawing.resizingShapeId);
            if (resizingShape) {
              GeometryCache.invalidateShape(resizingShape);
            }
          }
        }
        
        // Configure snap types based on the active tool
        const getSnapTypesForTool = (tool: DrawingTool): Set<SnapType> => {
          const baseTypes = new Set<SnapType>(['grid']);

          switch (tool) {
            case 'rectangle':
            case 'circle':
            case 'polyline':
              // Add shape snapping for drawing tools
              baseTypes.add('endpoint');
              baseTypes.add('midpoint');
              baseTypes.add('center');
              break;
            case 'measure':
              // Enable all snap types for measurement tool
              baseTypes.add('endpoint');
              baseTypes.add('midpoint');
              baseTypes.add('center');
              baseTypes.add('intersection');
              break;
            case 'select':
              // Keep basic snapping for selection tool
              baseTypes.add('endpoint');
              baseTypes.add('center');
              break;
            default:
              // For other tools, keep just grid snapping
              break;
          }

          return baseTypes;
        };

        set(
          prevState => ({
            drawing: {
              ...prevState.drawing,
              activeTool: tool,
              isDrawing: false,
              currentShape: null,
              // Update snap configuration based on tool
              snapping: {
                ...prevState.drawing.snapping,
                config: {
                  ...prevState.drawing.snapping.config,
                  activeTypes: getSnapTypesForTool(tool)
                }
              },
              // CRITICAL FIX: Comprehensive state clearing when leaving select tool
              isResizeMode: tool === 'select' ? prevState.drawing.isResizeMode : false,
              resizingShapeId: tool === 'select' ? prevState.drawing.resizingShapeId : null,
              resizeHandleType: tool === 'select' ? prevState.drawing.resizeHandleType : null,
              resizeHandleIndex: tool === 'select' ? prevState.drawing.resizeHandleIndex : null,
              maintainAspectRatio: tool === 'select' ? prevState.drawing.maintainAspectRatio : false,
              // ATOMIC CLEAR: Always clear liveResizePoints when leaving select tool
              liveResizePoints: tool === 'select' ? prevState.drawing.liveResizePoints : null,
              // Line tool activation/deactivation
              lineTool: tool === 'line'
                ? { ...prevState.drawing.lineTool, isActive: true }
                : prevState.drawing.activeTool === 'line'
                  ? {
                      isActive: false,
                      isDrawing: false,
                      startPoint: null,
                      inputValue: '',
                      currentDistance: null,
                      previewEndPoint: null,
                      segments: prevState.drawing.lineTool.segments,
                      isWaitingForInput: false,
                      inputPosition: { x: 0, y: 0 },
                      showInput: false,
                      isMultiSegment: false
                    }
                  : prevState.drawing.lineTool,
            },
            // Clear hover state when switching away from select tool
            hoveredShapeId: tool === 'select' ? prevState.hoveredShapeId : null,
            // CRITICAL FIX: Deselect shape when leaving resize mode via tool switch
            selectedShapeId: needsResizeCleanup ? null : prevState.selectedShapeId,
          }),
          false,
          'setActiveTool',
        );
        
        const finalState = get();
        logger.log('🔧 Final state after tool switch:', {
          activeTool: finalState.drawing.activeTool,
          selectedShapeId: finalState.selectedShapeId,
          isResizeMode: finalState.drawing.isResizeMode,
          liveResizePoints: finalState.drawing.liveResizePoints ? `${finalState.drawing.liveResizePoints.length} points` : 'null'
        });
        logger.log('🔧 ==> TOOL SWITCH DEBUG END <==');
        logger.log('');

        // Track tool activation in Tool History
        // Type-safe conversion: DrawingTool -> ActionType
        const actionType = `tool:${tool}` as const;
        useToolHistoryStore.getState().trackAction({
          id: `action-${Date.now()}`,
          type: actionType as ActionType,
          timestamp: Date.now(),
          label: `${tool.charAt(0).toUpperCase() + tool.slice(1)} Tool`,
          icon: tool,
        });
      },

      toggleSnapToGrid: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              snapToGrid: !state.drawing.snapToGrid,
            },
          }),
          false,
          'toggleSnapToGrid',
        );
      },

      toggleShowDimensions: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              showDimensions: !state.drawing.showDimensions,
            },
          }),
          false,
          'toggleShowDimensions',
        );
      },

      setGridSize: (size: number) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              gridSize: size,
            },
          }),
          false,
          'setGridSize',
        );
      },

      // Force immediate render trigger for geometry updates
      triggerRender: () => {
        set(
          state => ({
            renderTrigger: state.renderTrigger + 1,
          }),
          false,
          'triggerRender',
        );
      },

      startDrawing: () => {
        set(
          state => {
            // Map drawing tool to shape type
            const getShapeType = (tool: DrawingTool): ShapeType => {
              switch (tool) {
                case 'polygon':
                  return 'polygon';
                case 'polyline':
                  return 'polyline';
                case 'rectangle':
                  return 'rectangle';
                case 'circle':
                  return 'circle';
                case 'select':
                case 'edit':
                default:
                  return 'polygon';
              }
            };

            // Get preview color based on shape type
            const getPreviewColor = (type: ShapeType): string => {
              switch (type) {
                case 'rectangle':
                  return '#3B82F6'; // Blue for rectangles
                case 'circle':
                  return '#10B981'; // Green for circles  
                case 'line': // polyline
                  return '#F59E0B'; // Orange/Yellow for polylines
                case 'polygon':
                  return '#8B5CF6'; // Purple for polygons
                default:
                  return '#3B82F6'; // Default blue
              }
            };

            const shapeType = getShapeType(state.drawing.activeTool);

            return {
              drawing: {
                ...state.drawing,
                isDrawing: true,
                currentShape: {
                  id: generateId(),  // CRITICAL FIX: Add ID for snap point generation during drawing
                  points: [],
                  type: shapeType,
                  color: getPreviewColor(shapeType),
                  visible: true,
                  name: `${state.drawing.activeTool} ${state.shapes.length + 1}`,
                },
              },
            };
          },
          false,
          'startDrawing',
        );
      },

      finishDrawing: () => {
        const state = get();
        if (state.drawing.currentShape && state.drawing.currentShape.points?.length) {
          // Save state to history AFTER the shape is added, not before
          // Create a new layer for this shape
          const shapeType = state.drawing.currentShape.type || 'polygon';
          const existingShapesOfType = state.shapes.filter(s => s.type === shapeType).length;
          
          // Get color based on shape type
          const getShapeColor = (type: ShapeType): string => {
            switch (type) {
              case 'rectangle':
                return '#3B82F6'; // Blue for rectangles
              case 'circle':
                return '#10B981'; // Green for circles  
              case 'polyline':
                return '#F59E0B'; // Orange/Yellow for polylines
              case 'polygon':
                return '#8B5CF6'; // Purple for polygons
              default:
                return '#3B82F6'; // Default blue
            }
          };
          
          const shapeColor = getShapeColor(shapeType);
          
          // Calculate measurements for the layer name
          const tempShape: Shape = {
            id: 'temp',
            created: new Date(),
            modified: new Date(),
            layerId: 'temp',
            ...state.drawing.currentShape,
            color: shapeColor
          };
          const measurements = precisionCalculator.calculateShapeMeasurements(tempShape);
          
          let layerName = `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} ${existingShapesOfType + 1}`;
          if (measurements) {
            if (shapeType === 'rectangle' && measurements.dimensions) {
              layerName += ` (${measurements.dimensions.width}×${measurements.dimensions.height}m, ${measurements.area.squareMeters}m²)`;
            } else if (shapeType === 'circle' && measurements.radius) {
              layerName += ` (r=${measurements.radius.meters}m, ${measurements.area.squareMeters}m²)`;
            } else if (measurements.area && shapeType !== 'polyline') {
              // Don't add area for polylines - they show path length instead
              layerName += ` (${measurements.area.squareMeters}m²)`;
            }
          }
          
          const newLayer: Layer = {
            id: generateId(),
            name: layerName,
            visible: true,
            locked: false,
            color: shapeColor,
            opacity: 1,
            created: new Date(),
            modified: new Date()
          };

          const newShape: Shape = {
            id: generateId(),
            created: new Date(),
            modified: new Date(),
            layerId: newLayer.id, // Assign to the new layer
            ...(state.drawing.currentShape as Omit<Shape, 'id' | 'created' | 'modified' | 'layerId'>),
            color: shapeColor, // Apply the type-specific color
          };

          set(
            prevState => ({
              layers: [...prevState.layers, newLayer],
              shapes: [...prevState.shapes, newShape],
              activeLayerId: newLayer.id, // Set the new layer as active
              drawing: {
                ...prevState.drawing,
                activeTool: 'select', // Switch back to select tool after drawing
                isDrawing: false,
                currentShape: null,
              },
              // Auto-select the newly created shape so user can immediately rotate/edit it
              selectedShapeId: newShape.id,
              selectedShapeIds: [newShape.id] // CRITICAL FIX: Update array for multi-selection support
            }),
            false,
            'finishDrawing',
          );
          
          // Now save to history AFTER the shape has been added to the state
          get().saveToHistory();
        }
      },

      cancelDrawing: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              isDrawing: false,
              currentShape: null,
            },
          }),
          false,
          'cancelDrawing',
        );
      },

      removeLastPoint: () => {
        set(
          state => {
            if (!state.drawing.isDrawing || !state.drawing.currentShape?.points) {
              return state; // No change if not drawing or no points
            }

            const currentPoints = state.drawing.currentShape.points;
            
            // Don't allow removing the last point if we only have one point
            if (currentPoints.length <= 1) {
              // If only one point, cancel the entire drawing
              return {
                drawing: {
                  ...state.drawing,
                  isDrawing: false,
                  currentShape: null,
                },
              };
            }

            // Remove the last point
            const newPoints = currentPoints.slice(0, -1);

            return {
              drawing: {
                ...state.drawing,
                currentShape: {
                  ...state.drawing.currentShape,
                  points: newPoints,
                },
              },
            };
          },
          false,
          'removeLastPoint',
        );
      },

      // Shape actions
      addShape: shape => {
        logger.info('[useAppStore] addShape called with:', {
          type: shape.type,
          points: shape.points?.length,
          layerId: shape.layerId
        });

        get().saveToHistory(); // Save state before adding shape

        // Auto-create a new layer for each shape (Figma/Canva style)
        // Use the shape's name as the layer name
        const layerName = shape.name || 'Layer';
        get().createLayer(layerName);

        // Use the newly created layer
        const currentLayerId = get().activeLayerId;

        const newShape: Shape = {
          id: generateId(),
          created: new Date(),
          modified: new Date(),
          ...shape,
          layerId: currentLayerId, // Use the new layer
        };

        logger.info('[useAppStore] Created new shape with ID:', newShape.id);
        logger.info('[useAppStore] Created new layer:', layerName);
        logger.info('[useAppStore] Total shapes before add:', get().shapes.length);

        set(
          state => ({
            shapes: [...state.shapes, newShape],
          }),
          false,
          'addShape',
        );

        logger.info('[useAppStore] Total shapes after add:', get().shapes.length);
      },

      createShapeFromArea: (area: number, unit: AreaUnit) => {
        get().saveToHistory(); // Save state before modifying shape

        // Convert area and calculate exact dimensions (Smart Grid Positioning)
        const areaInSqM = convertToSquareMeters(area, unit);
        const state = get();
        const { width, height } = calculateGridAwareDimensions(
          areaInSqM,
          state.drawing.gridSize,
          state.drawing.snapToGrid
        );

        // Use Smart Grid Positioning to find optimal center
        const smartPosition = calculateSmartGridPosition(
          width,
          height,
          state.drawing.gridSize,
          state.drawing.snapToGrid
        );

        // Create rectangle with exact dimensions at smart center position
        const center = smartPosition.center;
        const finalPoints = [
          { x: center.x - width/2, y: center.y - height/2 },
          { x: center.x + width/2, y: center.y - height/2 },
          { x: center.x + width/2, y: center.y + height/2 },
          { x: center.x - width/2, y: center.y + height/2 }
        ];

        // Always create a new layer for each Insert Area shape
        // Count how many layers are named "Layer X" to determine next number
        const layerNumbers = state.layers
          .map(l => l.name.match(/^Layer (\d+)$/))
          .filter(match => match !== null)
          .map(match => parseInt(match![1]));
        const nextLayerNumber = layerNumbers.length > 0 ? Math.max(...layerNumbers) + 1 : 1;
        const newLayerName = `Layer ${nextLayerNumber}`;

        // Create the layer first
        get().createLayer(newLayerName);

        // Get the newly created layer ID (it's now the active layer)
        const newLayerId = get().activeLayerId;

        // Create a new shape on the new layer
        const newShapeId = `land-area-${Date.now()}`;
        const newShape: Shape = {
          id: newShapeId,
          name: `Land Area ${area} ${getUnitLabel(unit)}`,
          points: finalPoints,
          type: 'rectangle',
          color: '#3B82F6',
          visible: true,
          layerId: newLayerId, // Use the newly created layer
          created: new Date(),
          modified: new Date()
        };

        set(
          state => ({
            shapes: [...state.shapes, newShape],
            selectedShapeId: newShapeId,
            selectedShapeIds: [newShapeId], // Clear multi-selection, select only new shape
            drawing: {
              ...state.drawing,
              activeTool: 'select'
            }
          }),
          false,
          'createShapeFromArea',
        );

        // Invalidate geometry cache for visual update
        GeometryCache.invalidateShape(newShape);
        get().triggerRender(); // Force immediate re-render

        // Invalidate layer thumbnail so it updates in the layer panel
        invalidateLayerThumbnail(newShape.layerId);
      },

      // Add Area Modal Actions
      openAddAreaModal: () => {
        set(state => ({
          ...state,
          addAreaModalOpen: true
        }), false, 'openAddAreaModal');
      },

      closeAddAreaModal: () => {
        set(state => ({
          ...state,
          addAreaModalOpen: false
        }), false, 'closeAddAreaModal');
      },

      createAreaShapeAdvanced: (config: AddAreaConfig) => {
        try {
          const { area, unit, shapeType, aspectRatio } = config;

          // Generate shape points using enhanced utilities
          const points = generateShapeFromArea(area, unit, shapeType, {
            aspectRatio,
            position: { x: 0, y: 0 }, // Scene center
            useGridAlignment: get().drawing.snapToGrid
          });

          // Create layer with descriptive name
          const layerName = `Area: ${area} ${getUnitLabel(unit)}`;
          const newLayer: Layer = {
            id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: layerName,
            visible: true,
            locked: false,
            color: '#22C55E', // Green for area shapes
            opacity: 1,
            created: new Date(),
            modified: new Date()
          };

          // Create shape with proper type mapping
          const shapeTypeMap: Record<string, ShapeType> = {
            'square': 'rectangle',
            'rectangle': 'rectangle',
            'circle': 'circle'
          };

          const newShape: Shape = {
            id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} - ${area} ${getUnitLabel(unit)}`,
            points,
            type: shapeTypeMap[shapeType],
            color: newLayer.color,
            visible: true,
            layerId: newLayer.id,
            created: new Date(),
            modified: new Date()
          };

          // Update store with batched changes for performance
          set(state => ({
            ...state,
            layers: [...state.layers, newLayer],
            shapes: [...state.shapes, newShape],
            activeLayerId: newLayer.id,
            selectedShapeId: newShape.id,
            selectedShapeIds: [newShape.id], // Clear multi-selection, select only new shape
            addAreaModalOpen: false
          }), false, 'createAreaShapeAdvanced');

          // Save to history using existing action
          get().saveToHistory();

          // Trigger render for immediate visual feedback
          get().triggerRender();

          // Invalidate geometry cache for new shape
          GeometryCache.invalidateShape(newShape);

          logger.log('Area shape created successfully', {
            area,
            unit,
            shapeType: shapeType,
            layerId: newLayer.id,
            shapeId: newShape.id
          });

        } catch (error) {
          logger.error('Failed to create area shape', error);
          throw error;
        }
      },

      // Presets Modal Actions
      openPresetsModal: () => {
        set(state => ({
          presets: {
            ...state.presets,
            presetsModal: {
              ...state.presets.presetsModal,
              isOpen: true
            }
          }
        }), false, 'openPresetsModal');
      },

      closePresetsModal: () => {
        set(state => ({
          presets: {
            ...state.presets,
            presetsModal: {
              ...state.presets.presetsModal,
              isOpen: false,
              selectedPreset: null
            }
          }
        }), false, 'closePresetsModal');
      },

      setSelectedCategory: (category: PresetCategory) => {
        set(state => ({
          presets: {
            ...state.presets,
            presetsModal: {
              ...state.presets.presetsModal,
              selectedCategory: category,
              selectedPreset: null
            }
          }
        }), false, 'setSelectedCategory');
      },

      setSearchQuery: (query: string) => {
        set(state => ({
          presets: {
            ...state.presets,
            presetsModal: {
              ...state.presets.presetsModal,
              searchQuery: query,
              selectedPreset: null
            }
          }
        }), false, 'setSearchQuery');
      },

      selectPreset: (presetId: string | null) => {
        set(state => ({
          presets: {
            ...state.presets,
            presetsModal: {
              ...state.presets.presetsModal,
              selectedPreset: presetId
            }
          }
        }), false, 'selectPreset');
      },

      createShapeFromPreset: (preset: AreaPreset) => {
        try {
          // Convert preset to AddAreaConfig
          const config: AddAreaConfig = {
            area: preset.area,
            unit: preset.unit,
            shapeType: preset.shapeType,
            aspectRatio: preset.aspectRatio
          };

          // Use existing createAreaShapeAdvanced action
          get().createAreaShapeAdvanced(config);

          // Update recent presets
          get().addToRecentPresets(preset.id);

          // Close presets modal
          get().closePresetsModal();

          logger.log('Shape created from preset', { presetId: preset.id, preset });

        } catch (error) {
          logger.error('Failed to create shape from preset', error);
          throw error;
        }
      },

      customizePreset: (preset: AreaPreset) => {
        try {
          // Pre-fill AddArea modal with preset values
          const config: AddAreaConfig = {
            area: preset.area,
            unit: preset.unit,
            shapeType: preset.shapeType,
            aspectRatio: preset.aspectRatio
          };

          // Close presets modal
          get().closePresetsModal();

          // Open AddArea modal with preset values
          get().openAddAreaModal();

          // Update recent presets
          get().addToRecentPresets(preset.id);

          logger.log('Customizing preset', { presetId: preset.id });

        } catch (error) {
          logger.error('Failed to customize preset', error);
          throw error;
        }
      },

      saveCustomPreset: (preset: Omit<AreaPreset, 'id' | 'isCustom' | 'created'>) => {
        try {
          const customPreset: AreaPreset = {
            ...preset,
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isCustom: true,
            created: new Date(),
            category: 'custom'
          };

          set(state => ({
            presets: {
              ...state.presets,
              customPresets: [...state.presets.customPresets, customPreset]
            }
          }), false, 'saveCustomPreset');

          // Persist to localStorage
          const customPresets = [...get().presets.customPresets, customPreset];
          const success = saveCustomPresets(customPresets);
          if (!success) {
            logger.error('Failed to persist custom preset to localStorage');
          }

          logger.log('Custom preset saved', { presetId: customPreset.id });

        } catch (error) {
          logger.error('Failed to save custom preset', error);
          throw error;
        }
      },

      deleteCustomPreset: (presetId: string) => {
        try {
          set(state => ({
            presets: {
              ...state.presets,
              customPresets: state.presets.customPresets.filter(p => p.id !== presetId),
              recentPresets: state.presets.recentPresets.filter(id => id !== presetId),
              favoritePresets: state.presets.favoritePresets.filter(id => id !== presetId)
            }
          }), false, 'deleteCustomPreset');

          // Update localStorage
          const customPresets = get().presets.customPresets.filter(p => p.id !== presetId);
          const success = saveCustomPresets(customPresets);
          if (!success) {
            logger.error('Failed to update localStorage after preset deletion');
          }

          logger.log('Custom preset deleted', { presetId });

        } catch (error) {
          logger.error('Failed to delete custom preset', error);
          throw error;
        }
      },

      addToRecentPresets: (presetId: string) => {
        set(state => {
          const filtered = state.presets.recentPresets.filter(id => id !== presetId);
          const updated = [presetId, ...filtered].slice(0, 5); // Keep only last 5

          return {
            presets: {
              ...state.presets,
              recentPresets: updated
            }
          };
        }, false, 'addToRecentPresets');
      },

      toggleFavoritePreset: (presetId: string) => {
        set(state => {
          const isFavorite = state.presets.favoritePresets.includes(presetId);
          const updated = isFavorite
            ? state.presets.favoritePresets.filter(id => id !== presetId)
            : [...state.presets.favoritePresets, presetId];

          return {
            presets: {
              ...state.presets,
              favoritePresets: updated
            }
          };
        }, false, 'toggleFavoritePreset');
      },

      loadCustomPresetsFromStorage: () => {
        try {
          const customPresets = loadCustomPresets();
          set(state => ({
            presets: {
              ...state.presets,
              customPresets
            }
          }), false, 'loadCustomPresetsFromStorage');

          logger.log('Custom presets reloaded from storage', {
            count: customPresets.length
          });

        } catch (error) {
          logger.error('Failed to reload custom presets from storage', error);
        }
      },

      updateShape: (id: string, updates: Partial<Shape>) => {
        get().saveToHistory(); // Save state before updating shape
        
        // Invalidate geometry cache for the shape being updated
        const existingShape = get().shapes.find(shape => shape.id === id);
        if (existingShape) {
          GeometryCache.invalidateShape(existingShape);
        }
        
        set(
          state => ({
            shapes: state.shapes.map(shape =>
              shape.id === id ? { ...shape, ...updates, modified: new Date() } : shape,
            ),
          }),
          false,
          'updateShape',
        );
      },

      deleteShape: (id: string) => {
        get().saveToHistory(); // Save state before deleting shape

        const state = get();
        const targetShape = state.shapes.find(s => s.id === id);

        // Canva-style grouping: Check if deleting a grouped shape with other selected shapes
        const selectedIds = state.selectedShapeIds || [];
        const shapesToDelete = (targetShape?.groupId && selectedIds.length > 1)
          ? selectedIds  // Delete all selected shapes in group
          : [id];  // Delete single shape

        set(
          state => ({
            shapes: state.shapes.filter(shape => !shapesToDelete.includes(shape.id)),
            selectedShapeId: shapesToDelete.includes(state.selectedShapeId || '') ? null : state.selectedShapeId,
            selectedShapeIds: state.selectedShapeIds?.filter(sid => !shapesToDelete.includes(sid)) || [],
          }),
          false,
          'deleteShape',
        );

        logger.info(`Deleted ${shapesToDelete.length} shape(s)`);
      },

      selectShape: (id: string | null) => {
        const state = get();
        
        logger.log('🎯 ==> SELECTSHAPE DEBUG START <==');
        logger.log('🎯 Selecting shape:', id);
        logger.log('🎯 Previous selectedShapeId:', state.selectedShapeId);
        logger.log('🎯 Current resize state:', {
          isResizeMode: state.drawing.isResizeMode,
          resizingShapeId: state.drawing.resizingShapeId,
          liveResizePoints: state.drawing.liveResizePoints ? `${state.drawing.liveResizePoints.length} points` : 'null'
        });
        logger.log('🎯 Current rotation state:', {
          isRotateMode: state.drawing.isRotateMode,
          rotatingShapeId: state.drawing.rotatingShapeId
        });
        
        // CRITICAL FIX: Always clear liveResizePoints FIRST to prevent corruption
        const shouldClearResizeMode = state.drawing.isResizeMode && state.drawing.resizingShapeId !== id;
        const shouldClearRotateMode = state.drawing.isRotateMode && state.drawing.rotatingShapeId !== id;
        
        if (shouldClearResizeMode || shouldClearRotateMode) {
          logger.log('🎯 CLEARING RESIZE/ROTATE STATE - switching from', state.drawing.resizingShapeId || state.drawing.rotatingShapeId, 'to', id);
          logger.log('🎯 Previous liveResizePoints:', state.drawing.liveResizePoints);
          
          // Clear geometry cache before state change to prevent stale geometry usage
          if (state.drawing.resizingShapeId) {
            const resizingShape = state.shapes.find(s => s.id === state.drawing.resizingShapeId);
            if (resizingShape) {
              GeometryCache.invalidateShape(resizingShape);
            }
          }
          
          set(
            prevState => ({
              selectedShapeId: id,
              selectedShapeIds: id ? [id] : [], // Update multi-selection array
              drawing: {
                ...prevState.drawing,
                isResizeMode: false,
                resizingShapeId: null,
                resizeHandleType: null,
                resizeHandleIndex: null,
                maintainAspectRatio: false,
                liveResizePoints: null, // ALWAYS clear first
                // ROTATION FIX: Clear rotation mode when switching shapes
                isRotateMode: false,
                rotatingShapeId: null,
                rotationStartAngle: 0,
                rotationCenter: null,
                originalRotation: null,
              },
            }),
            false,
            'selectShape'
          );
          
          logger.log('🎯 RESIZE/ROTATE STATE CLEARED - modes reset to false');
        } else {
          logger.log('🎯 CLEARING LIVE RESIZE POINTS AND ROTATION STATE - selection change requires cleanup');
          
          // CRITICAL FIX: Always clear liveResizePoints on ANY selection change
          // This is the ROOT CAUSE fix - prevents geometry corruption across selections
          set(
            prevState => ({
              selectedShapeId: id,
              selectedShapeIds: id ? [id] : [], // Update multi-selection array
              drawing: {
                ...prevState.drawing,
                // ATOMIC CLEAR: Clear all live state to prevent cross-contamination
                liveResizePoints: null,
                // Also clear any lingering resize state markers
                resizeHandleType: prevState.drawing.resizingShapeId === id ? prevState.drawing.resizeHandleType : null,
                resizeHandleIndex: prevState.drawing.resizingShapeId === id ? prevState.drawing.resizeHandleIndex : null,
                // ROTATION FIX: Clear rotation mode when changing selection
                isRotateMode: prevState.drawing.rotatingShapeId !== id ? false : prevState.drawing.isRotateMode,
                rotatingShapeId: prevState.drawing.rotatingShapeId !== id ? null : prevState.drawing.rotatingShapeId,
                rotationStartAngle: prevState.drawing.rotatingShapeId !== id ? 0 : prevState.drawing.rotationStartAngle,
                rotationCenter: prevState.drawing.rotatingShapeId !== id ? null : prevState.drawing.rotationCenter,
                originalRotation: prevState.drawing.rotatingShapeId !== id ? null : prevState.drawing.originalRotation,
              }
            }),
            false,
            'selectShape'
          );
        }
        
        // Log final state
        const finalState = get();
        logger.log('🎯 Final state after selectShape:', {
          selectedShapeId: finalState.selectedShapeId,
          isResizeMode: finalState.drawing.isResizeMode,
          resizingShapeId: finalState.drawing.resizingShapeId,
          liveResizePoints: finalState.drawing.liveResizePoints ? `${finalState.drawing.liveResizePoints.length} points` : 'null',
          isRotateMode: finalState.drawing.isRotateMode,
          rotatingShapeId: finalState.drawing.rotatingShapeId
        });
        logger.log('🎯 ==> SELECTSHAPE DEBUG END <==');
        logger.log('');
        
        // Auto-enter resize mode for polylines when selected
        if (id && state.drawing.activeTool === 'select') {
          const selectedShape = state.shapes.find(shape => shape.id === id);
          if (selectedShape && selectedShape.type === 'polyline') {
            setTimeout(() => {
              get().enterResizeMode(id);
            }, 50);
          }
        }
      },

      selectMultipleShapes: (ids: string[]) => {
        set((state) => ({
          selectedShapeIds: [...ids],
          selectedShapeId: ids.length === 1 ? ids[0] : null, // Keep single selection for compatibility
        }), false, 'selectMultipleShapes');
      },

      toggleShapeSelection: (id: string) => {
        set((state) => {
          const currentIds = state.selectedShapeIds || [];
          const isSelected = currentIds.includes(id);

          let newIds: string[];
          if (isSelected) {
            // Remove from selection
            newIds = currentIds.filter(shapeId => shapeId !== id);
          } else {
            // Add to selection
            newIds = [...currentIds, id];
          }

          // CRITICAL: Exit resize mode when creating multi-selection
          const isMultiSelection = newIds.length > 1;
          const shouldExitResizeMode = isMultiSelection && state.drawing.isResizeMode;

          return {
            selectedShapeIds: newIds,
            selectedShapeId: newIds.length === 1 ? newIds[0] : null,
            // Exit resize mode for multi-selection
            drawing: shouldExitResizeMode ? {
              ...state.drawing,
              isResizeMode: false,
              resizingShapeId: null,
              resizeHandleType: null,
              resizeHandleIndex: null,
              liveResizePoints: null,
            } : state.drawing,
          };
        }, false, 'toggleShapeSelection');
      },

      clearSelection: () => {
        // CRITICAL FIX: Exit resize mode when clearing selection
        // This prevents resize handles from staying visible after deselection
        get().exitResizeMode();

        set({
          selectedShapeId: null,
          selectedShapeIds: [],
        }, false, 'clearSelection');
      },

      hoverShape: (id: string | null) => {
        set({ hoveredShapeId: id }, false, 'hoverShape');
      },

      setHoveredGroupId: (groupId: string | null) => {
        set({ hoveredGroupId: groupId }, false, 'setHoveredGroupId');
      },

      setHighlightedShapeId: (shapeId: string | null) => {
        set({ highlightedShapeId: shapeId }, false, 'setHighlightedShapeId');
      },

      // Drag actions
      startDragging: (shapeId: string, startPosition: Point2D) => {
        const state = get();
        const shape = state.shapes.find(s => s.id === shapeId);

        // CRITICAL: Don't allow dragging locked shapes
        if (shape?.locked) {
          return; // Silently ignore drag attempts on locked shapes
        }

        // Set alignment to active
        // const alignmentStore = useAlignmentStore.getState();
        // alignmentStore.setIsAligning(true);

        // Store the current shape points as they are (may include rotation already applied)
        const currentPoints = shape?.points ? [...shape.points] : null;

        // Canva-style grouping: Store original data for ALL selected shapes (for group move)
        const selectedIds = state.selectedShapeIds || [];
        const shapesToDrag = selectedIds.length > 0 ? selectedIds : [shapeId];

        const originalShapesData = new Map<string, { points: Point2D[]; rotation?: { angle: number; center: Point2D } }>();
        shapesToDrag.forEach(id => {
          const s = state.shapes.find(shape => shape.id === id);
          if (s && !s.locked) {
            originalShapesData.set(id, {
              points: [...s.points],
              rotation: s.rotation ? { ...s.rotation, center: { ...s.rotation.center } } : undefined
            });
          }
        });

        set({
          dragState: {
            isDragging: true,
            draggedShapeId: shapeId,
            startPosition,
            currentPosition: startPosition,
            originalShapePoints: currentPoints, // Legacy: keep for backward compatibility
            originalShapesData, // Canva-style grouping: store all selected shapes
            lockedAxis: null, // Feature 017: Initialize axis-lock state (will be determined during drag)
          }
        }, false, 'startDragging');
      },

      updateDragPosition: (currentPosition: Point2D) => {
        const state = get();
        if (!state.dragState.isDragging ||
            !state.dragState.draggedShapeId ||
            !state.dragState.startPosition ||
            !state.dragState.originalShapePoints) {
          return;
        }

        // PERFORMANCE FIX: Update position immediately, do heavy computation async
        // This prevents blocking the UI thread and eliminates drag lag

        // Feature 017: Apply axis-lock constraint BEFORE immediate update
        let effectivePosition = currentPosition;
        let lockedAxis = state.dragState.lockedAxis; // Preserve existing locked axis

        if (state.drawing.isShiftKeyPressed) {
          const offsetX = currentPosition.x - state.dragState.startPosition.x;
          const offsetY = currentPosition.y - state.dragState.startPosition.y;
          const absX = Math.abs(offsetX);
          const absY = Math.abs(offsetY);

          // Determine locked axis ONCE when movement exceeds threshold
          // After that, use the stored axis for the entire drag operation (Canva/Figma behavior)
          const threshold = 5; // 5 world units (meters)
          if (lockedAxis === null && (absX >= threshold || absY >= threshold)) {
            // First time exceeding threshold - determine which axis to lock
            lockedAxis = absX >= absY ? 'horizontal' : 'vertical';
          }

          // Apply axis-lock based on the stored locked axis
          let constrainedOffsetX = offsetX;
          let constrainedOffsetY = offsetY;

          if (lockedAxis === 'horizontal') {
            // Horizontal movement - lock vertical axis
            constrainedOffsetY = 0;
          } else if (lockedAxis === 'vertical') {
            // Vertical movement - lock horizontal axis
            constrainedOffsetX = 0;
          }

          effectivePosition = {
            x: state.dragState.startPosition.x + constrainedOffsetX,
            y: state.dragState.startPosition.y + constrainedOffsetY
          };
        }

        // Step 1: Immediately update drag position (smooth cursor tracking)
        set({
          dragState: {
            ...state.dragState,
            currentPosition: effectivePosition,
            lockedAxis, // Feature 017: Store locked axis for entire drag operation
          }
        }, false, 'updateDragPosition_immediate');

        // Step 2: Schedule snap/alignment computation asynchronously
        if (!window._dragComputationScheduled) {
          window._dragComputationScheduled = true;
          requestAnimationFrame(() => {
            const currentState = get();

            // Only proceed if still dragging same shape
            if (!currentState.dragState.isDragging ||
                currentState.dragState.draggedShapeId !== state.dragState.draggedShapeId) {
              window._dragComputationScheduled = false;
              return;
            }

            try {
              const draggedShape = currentState.shapes.find(s => s.id === currentState.dragState.draggedShapeId);
              if (!draggedShape || !currentState.dragState.originalShapePoints || !currentState.dragState.startPosition) {
                window._dragComputationScheduled = false;
                return;
              }

              // Use current position from state (may have advanced from when this was scheduled)
              const latestPosition = currentState.dragState.currentPosition || currentPosition;

              // Create temporary shape with current position for snap detection
              let offsetX = latestPosition.x - currentState.dragState.startPosition.x;
              let offsetY = latestPosition.y - currentState.dragState.startPosition.y;

              // Feature 017: Apply axis-lock constraint if Shift is held
              // Use the stored locked axis from dragState (determined once at start)
              if (currentState.drawing.isShiftKeyPressed && currentState.dragState.lockedAxis) {
                if (currentState.dragState.lockedAxis === 'horizontal') {
                  // Horizontal movement - lock vertical axis
                  offsetY = 0;
                } else if (currentState.dragState.lockedAxis === 'vertical') {
                  // Vertical movement - lock horizontal axis
                  offsetX = 0;
                }
              }

              // Calculate constrained position (before magnetic snap)
              const constrainedPosition = {
                x: currentState.dragState.startPosition.x + offsetX,
                y: currentState.dragState.startPosition.y + offsetY
              };

              const tempShape = {
                ...draggedShape,
                points: currentState.dragState.originalShapePoints.map(p => ({
                  x: p.x + offsetX,
                  y: p.y + offsetY
                }))
              };

              const otherShapes = currentState.shapes.filter(s => s.id !== currentState.dragState.draggedShapeId);

              // MAGNETIC SNAP: Apply real-time snap correction during drag
              const snapConfig = currentState.drawing.snapping?.config;
              const snapActive = snapConfig?.enabled && !currentState.shiftKeyPressed;
              let snapDetectionResults = null;
              let magneticSnapOffset = { x: 0, y: 0 }; // Track snap correction to apply to drag position

              if (snapActive) {
                const dragSnapRadius = snapConfig?.snapRadius || 25;
                dragSnapGrid.setSnapDistance(dragSnapRadius);

                // Update snap grid with other shapes
                dragSnapGrid.updateSnapPoints(otherShapes, undefined);

                // IMPROVED: Find closest snap point pair (dragged shape feature → target shape feature)
                // This enables edge-to-edge and corner-to-corner snapping
                let bestSnapMatch: { draggedPoint: Point2D; targetPoint: Point2D; distance: number } | null = null;

                // Generate snap points from the dragged shape
                const draggedShapePoints: Point2D[] = [];

                // Add corners (endpoints)
                tempShape.points.forEach(p => draggedShapePoints.push({ x: p.x, y: p.y }));

                // Add midpoints
                for (let i = 0; i < tempShape.points.length; i++) {
                  const p1 = tempShape.points[i];
                  const p2 = tempShape.points[(i + 1) % tempShape.points.length];
                  draggedShapePoints.push({
                    x: (p1.x + p2.x) / 2,
                    y: (p1.y + p2.y) / 2
                  });
                }

                // Add center
                const bounds = SimpleAlignment.getShapeBounds(tempShape);
                draggedShapePoints.push({ x: bounds.centerX, y: bounds.centerY });

                // Find the closest snap point pair
                for (const draggedPoint of draggedShapePoints) {
                  const nearestTargetSnap = dragSnapGrid.findNearestSnapPoint(draggedPoint, dragSnapRadius);

                  if (nearestTargetSnap && snapConfig.activeTypes?.has?.(nearestTargetSnap.type)) {
                    const distance = Math.sqrt(
                      Math.pow(nearestTargetSnap.position.x - draggedPoint.x, 2) +
                      Math.pow(nearestTargetSnap.position.y - draggedPoint.y, 2)
                    );

                    if (!bestSnapMatch || distance < bestSnapMatch.distance) {
                      bestSnapMatch = {
                        draggedPoint,
                        targetPoint: nearestTargetSnap.position,
                        distance
                      };
                    }
                  }
                }

                // Apply magnetic snap if we found a good match
                if (bestSnapMatch) {
                  magneticSnapOffset = {
                    x: bestSnapMatch.targetPoint.x - bestSnapMatch.draggedPoint.x,
                    y: bestSnapMatch.targetPoint.y - bestSnapMatch.draggedPoint.y
                  };
                }

                // Update snap points for visual indicators
                const shapeCenter = { x: bounds.centerX, y: bounds.centerY };
                const nearbySnapPoints = dragSnapGrid.findSnapPointsInRadius(shapeCenter, dragSnapRadius);
                const filteredSnapPoints = nearbySnapPoints.filter(snap =>
                  snapConfig.activeTypes?.has?.(snap.type)
                );

                const nearestSnapPoint = bestSnapMatch ? { position: bestSnapMatch.targetPoint, type: 'endpoint' as const, id: 'snap', strength: 1.0, shapeId: 'target' } : null;

                snapDetectionResults = {
                  filteredSnapPoints,
                  activeSnapPoint: nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type) ? nearestSnapPoint : null,
                  snapPreviewPosition: nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type) ? nearestSnapPoint.position : null
                };
              }

              // Phase 6: Alignment Detection with Text Support (visual guides only, no snapping during drag)
              // Convert shapes to ShapeElement objects
              const draggedShapeElement: import('../types').ShapeElement = {
                id: tempShape.id,
                elementType: 'shape',
                shapeType: tempShape.type,
                name: tempShape.name || `${tempShape.type} ${tempShape.id}`,
                visible: tempShape.visible ?? true,
                locked: tempShape.locked ?? false,
                layerId: tempShape.layerId || 'main',
                groupId: tempShape.groupId,
                points: tempShape.points,
                color: tempShape.color || '#3b82f6',
                rotation: tempShape.rotation,
                created: tempShape.created || new Date(),
                modified: tempShape.modified || new Date()
              };

              const otherShapeElements: import('../types').ShapeElement[] = otherShapes.map(shape => ({
                id: shape.id,
                elementType: 'shape' as const,
                shapeType: shape.type,
                name: shape.name || `${shape.type} ${shape.id}`,
                visible: shape.visible ?? true,
                locked: shape.locked ?? false,
                layerId: shape.layerId || 'main',
                groupId: shape.groupId,
                points: shape.points,
                color: shape.color || '#3b82f6',
                rotation: shape.rotation,
                created: shape.created || new Date(),
                modified: shape.modified || new Date()
              }));

              // Phase 6: Get text objects and convert to TextElement objects
              const allTextObjects = useTextStore.getState().texts;
              const textElements: import('../types').TextElement[] = allTextObjects.map(text => ({
                id: text.id,
                elementType: 'text' as const,
                name: text.content.substring(0, 30) || 'Text',
                visible: text.visible ?? true,
                locked: text.locked ?? false,
                layerId: text.layerId || 'main',
                groupId: text.groupId,
                position: text.position,
                z: text.z,
                content: text.content,
                fontSize: text.fontSize,
                fontFamily: text.fontFamily,
                color: text.color,
                alignment: text.alignment,
                opacity: text.opacity,
                bold: text.bold,
                italic: text.italic,
                underline: text.underline,
                uppercase: text.uppercase,
                letterSpacing: text.letterSpacing,
                lineHeight: text.lineHeight,
                backgroundColor: text.backgroundColor,
                backgroundOpacity: text.backgroundOpacity,
                rotation: text.rotation,
                attachedToShapeId: text.attachedToShapeId,
                offset: text.offset,
                created: text.created || new Date(),
                modified: text.updatedAt || new Date()
              }));

              // Phase 6: Combine all elements for alignment detection
              const otherElements: import('../types').Element[] = [...otherShapeElements, ...textElements];

              // Phase 6: Use element-based alignment detection to include text
              const result = SimpleAlignment.detectElementAlignments(draggedShapeElement, otherElements);

              // MAGNETIC SNAP: Apply snap correction to drag position in real-time
              // This creates the "magnetic pull" feeling users expect from Figma/Canva
              // Feature 017: Use constrainedPosition (not latestPosition) so axis-lock is preserved
              if (magneticSnapOffset.x !== 0 || magneticSnapOffset.y !== 0) {
                const correctedPosition = {
                  x: constrainedPosition.x + magneticSnapOffset.x,
                  y: constrainedPosition.y + magneticSnapOffset.y
                };

                // Update drag state with snapped position
                set({
                  dragState: {
                    ...currentState.dragState,
                    currentPosition: correctedPosition,
                  }
                }, false, 'applyMagneticSnap');
              } else if (currentState.drawing.isShiftKeyPressed) {
                // Feature 017: Even without snap, update position if constrained by Shift
                set({
                  dragState: {
                    ...currentState.dragState,
                    currentPosition: constrainedPosition,
                  }
                }, false, 'applyAxisLockConstraint');
              }

              // Update visual indicators
              currentState.updateAlignmentGuides(result.guides, currentState.dragState.draggedShapeId);
              if (result.spacings && result.spacings.length > 0) {
                currentState.updateAlignmentSpacings(result.spacings);
              } else {
                currentState.updateAlignmentSpacings([]);
              }
              currentState.updateAlignmentSnapPosition(result.snapPosition || null);

              if (snapDetectionResults) {
                set((prevState) => ({
                  drawing: {
                    ...prevState.drawing,
                    snapping: {
                      ...prevState.drawing.snapping,
                      availableSnapPoints: snapDetectionResults.filteredSnapPoints,
                      activeSnapPoint: snapDetectionResults.activeSnapPoint,
                      snapPreviewPosition: snapDetectionResults.snapPreviewPosition
                    }
                  }
                }), false, 'updateDragSnapping');
              }

            } catch (error) {
              // Silently handle snap/alignment detection errors
            }

            window._dragComputationScheduled = false;
          });
        }

        // Use complex alignment system - temporarily disabled
        /* if (alignmentStore.snapConfig.enabled) {
          try {
            // Get the dragged shape
            const draggedShape = state.shapes.find(s => s.id === state.dragState.draggedShapeId);
            if (draggedShape) {
              // Create a temporary shape with the new position
              const offsetX = currentPosition.x - state.dragState.startPosition.x;
              const offsetY = currentPosition.y - state.dragState.startPosition.y;

              // Create a temporary shape with updated points for alignment detection
              const tempShape = {
                ...draggedShape,
                points: state.dragState.originalShapePoints!.map(p => ({
                  x: p.x + offsetX,
                  y: p.y + offsetY
                }))
              };

              // Get alignment service instance
              // const alignmentService = AlignmentGuideService.getInstance();

              // Update spatial index with all shapes
              alignmentService.updateSpatialIndex(state.shapes);

              // Detect alignments
              const result = alignmentService.detectAlignments(
                tempShape,
                state.shapes.filter(s => s.id !== state.dragState.draggedShapeId),
                alignmentStore.snapConfig.threshold
              );

              // Update alignment store with detected guides
              alignmentStore.setGuides(result.guides);
              alignmentStore.setMeasurements(result.measurements);
              alignmentStore.setIsAligning(true);

              // Apply snapping if alignments detected
              if (result.hasSnap && result.guides.length > 0) {
                const snapPos = alignmentService.getSnapPosition(tempShape, result.guides);

                // Calculate current shape center
                const currentCenter = alignmentService.getShapeCenter ?
                  alignmentService.getShapeCenter(tempShape) :
                  { x: 0, z: 0 }; // fallback if method not available

                // Calculate the offset from current center to snap position
                const snapOffsetX = snapPos.x - currentCenter.x;
                const snapOffsetY = snapPos.z - currentCenter.z;

                finalPosition = {
                  x: currentPosition.x + snapOffsetX,
                  y: currentPosition.y + snapOffsetY
                };
              }
            }
          } catch (error) {
            logger.warn('Alignment detection failed:', error);
          }
        } */
      },

      finishDragging: () => {
        const state = get();

        // Task 4.1: Clear alignment guides, spacings, and snap indicators
        set(prevState => ({
          drawing: {
            ...prevState.drawing,
            alignment: {
              ...prevState.drawing.alignment,
              activeGuides: [],
              activeSpacings: [],
              snapPosition: null
            },
            snapping: {
              ...prevState.drawing.snapping,
              availableSnapPoints: [],
              activeSnapPoint: null,
              snapPreviewPosition: null
            }
          }
        }), false, 'clearAllSnapStates');

        if (state.dragState.isDragging && state.dragState.currentPosition && state.dragState.startPosition) {
          // Apply final transformation to shape points
          // Note: Snap corrections are now applied in real-time during drag (updateDragPosition)
          // so currentPosition already includes magnetic snap offsets
          let offsetX = state.dragState.currentPosition.x - state.dragState.startPosition.x;
          let offsetY = state.dragState.currentPosition.y - state.dragState.startPosition.y;

          // VISUAL FEEDBACK: Show snap confirmation flash if snapped
          const activeSnapPoint = state.drawing.snapping?.activeSnapPoint;
          if (activeSnapPoint) {
            set((prevState) => ({
              drawing: {
                ...prevState.drawing,
                snapConfirmation: {
                  position: activeSnapPoint.position,
                  color: '#00C4CC',  // Brand teal color
                  timestamp: performance.now()
                }
              }
            }), false, 'snapConfirmationFlash');

            // Clear snap confirmation after animation duration
            setTimeout(() => {
              set((prevState) => ({
                drawing: {
                  ...prevState.drawing,
                  snapConfirmation: null
                }
              }), false, 'clearSnapConfirmation');
            }, 500);  // 500ms = 0.5s animation

            logger.info('✨ Magnetic snap applied:', {
              snapType: activeSnapPoint.type
            });
          }

          // Canva-style grouping: Move ALL selected shapes if originalShapesData exists
          const originalShapesData = state.dragState.originalShapesData;

          const updatedShapes = state.shapes.map(shape => {
            // If we have multi-shape data (group drag), use that
            if (originalShapesData && originalShapesData.has(shape.id)) {
              const originalData = originalShapesData.get(shape.id)!;
              const newPoints = originalData.points.map(point => ({
                x: point.x + offsetX,
                y: point.y + offsetY,
              }));

              // Also update rotation center if shape is rotated
              let newRotation = shape.rotation;
              if (originalData.rotation) {
                newRotation = {
                  ...originalData.rotation,
                  center: {
                    x: originalData.rotation.center.x + offsetX,
                    y: originalData.rotation.center.y + offsetY
                  }
                };
              }

              return { ...shape, points: newPoints, rotation: newRotation, modified: new Date() };
            }
            // Legacy: fallback to single shape drag for backward compatibility
            else if (shape.id === state.dragState.draggedShapeId && state.dragState.originalShapePoints) {
              const newPoints = state.dragState.originalShapePoints.map(point => ({
                x: point.x + offsetX,
                y: point.y + offsetY,
              }));

              // Also update rotation center if shape is rotated
              let newRotation = shape.rotation;
              if (newRotation) {
                newRotation = {
                  ...newRotation,
                  center: {
                    x: newRotation.center.x + offsetX,
                    y: newRotation.center.y + offsetY
                  }
                };
              }

              return { ...shape, points: newPoints, rotation: newRotation, modified: new Date() };
            }
            return shape;
          });

          set({
            shapes: updatedShapes,
            dragState: {
              isDragging: false,
              draggedShapeId: null,
              startPosition: null,
              currentPosition: null,
              originalShapePoints: null,
              originalShapesData: undefined,
              lockedAxis: null, // Feature 017: Reset axis-lock state
            }
          }, false, 'finishDragging');

          // Save to history after drag is complete
          get().saveToHistory();
        } else {
          // Just clear drag state if no valid drag occurred
          set({
            dragState: {
              isDragging: false,
              draggedShapeId: null,
              startPosition: null,
              currentPosition: null,
              originalShapePoints: null,
              originalShapesData: undefined,
              lockedAxis: null, // Feature 017: Reset axis-lock state
            }
          }, false, 'finishDragging');
        }
      },

      cancelDragging: () => {
        // Task 4.1: Clear alignment guides, spacings, and snap indicators
        set(prevState => ({
          drawing: {
            ...prevState.drawing,
            alignment: {
              ...prevState.drawing.alignment,
              activeGuides: [],
              activeSpacings: [],
              snapPosition: null
            },
            snapping: {
              ...prevState.drawing.snapping,
              availableSnapPoints: [],
              activeSnapPoint: null,
              snapPreviewPosition: null
            }
          }
        }), false, 'clearAllSnapStates');

        set({
          dragState: {
            isDragging: false,
            draggedShapeId: null,
            startPosition: null,
            currentPosition: null,
            originalShapePoints: null,
            originalShapesData: undefined,
            lockedAxis: null, // Feature 017: Reset axis-lock state
          }
        }, false, 'cancelDragging');
      },

      // ====================
      // ELEMENT DRAG ACTIONS (Phase 4A)
      // ====================

      startElementDrag: (elementId: string, elementType: 'shape' | 'text', startPosition: Point2D) => {
        const state = get();

        // Find the element
        const element = state.elements.find(e => e.id === elementId);
        if (!element || element.locked) {
          return;
        }

        // Store original element data
        const originalElementData = elementType === 'text'
          ? { position: (element as any).position } // TextElement position
          : {
              points: (element as any).points, // ShapeElement points
              rotation: (element as any).rotation // ShapeElement rotation (if any)
            };

        set({
          dragState: {
            isDragging: true,
            draggedShapeId: null, // Legacy: not using for element drag
            draggedElementId: elementId, // New: element ID
            draggedElementIds: undefined, // Single element drag (no multi-select support yet)
            elementType, // 'shape' or 'text'
            startPosition,
            currentPosition: startPosition,
            originalShapePoints: null, // Legacy: not using for element drag
            originalShapesData: undefined, // Legacy: not using for element drag
            originalElementData, // New: element data
            lockedAxis: null, // Feature 017: Initialize axis-lock state
          }
        }, false, 'startElementDrag');
      },

      updateElementDragPosition: (currentPosition: Point2D) => {
        const state = get();

        if (!state.dragState.isDragging || !state.dragState.draggedElementId) {
          return;
        }

        // Feature 017: Apply axis-lock constraint BEFORE immediate update
        let effectivePosition = currentPosition;
        let lockedAxis = state.dragState.lockedAxis; // Preserve existing locked axis

        if (state.drawing.isShiftKeyPressed) {
          const offsetX = currentPosition.x - state.dragState.startPosition!.x;
          const offsetY = currentPosition.y - state.dragState.startPosition!.y;
          const absX = Math.abs(offsetX);
          const absY = Math.abs(offsetY);

          // Determine locked axis ONCE when movement exceeds threshold
          const threshold = 5; // 5 world units (meters)
          if (lockedAxis === null && (absX >= threshold || absY >= threshold)) {
            // First time exceeding threshold - determine which axis to lock
            lockedAxis = absX >= absY ? 'horizontal' : 'vertical';
          }

          // Apply axis-lock based on the stored locked axis
          let constrainedOffsetX = offsetX;
          let constrainedOffsetY = offsetY;

          if (lockedAxis === 'horizontal') {
            // Horizontal movement - lock vertical axis
            constrainedOffsetY = 0;
          } else if (lockedAxis === 'vertical') {
            // Vertical movement - lock horizontal axis
            constrainedOffsetX = 0;
          }

          effectivePosition = {
            x: state.dragState.startPosition!.x + constrainedOffsetX,
            y: state.dragState.startPosition!.y + constrainedOffsetY
          };
        }

        set({
          dragState: {
            ...state.dragState,
            currentPosition: effectivePosition,
            lockedAxis, // Feature 017: Store locked axis for entire drag operation
          }
        }, false, 'updateElementDragPosition');
      },

      finishElementDrag: () => {
        const state = get();

        if (!state.dragState.isDragging || !state.dragState.currentPosition || !state.dragState.startPosition) {
          return;
        }

        const offsetX = state.dragState.currentPosition.x - state.dragState.startPosition.x;
        const offsetY = state.dragState.currentPosition.y - state.dragState.startPosition.y;

        // Update the element
        const elementId = state.dragState.draggedElementId;
        if (elementId && state.dragState.elementType === 'text') {
          // Update text element position
          const originalPosition = state.dragState.originalElementData?.position;
          if (originalPosition) {
            get().updateElement(elementId, {
              position: {
                x: originalPosition.x + offsetX,
                y: originalPosition.y + offsetY,
                z: originalPosition.z, // Preserve elevation
              }
            });
          }
        } else if (elementId && state.dragState.elementType === 'shape') {
          // Update shape element points
          const originalPoints = state.dragState.originalElementData?.points;
          const originalRotation = state.dragState.originalElementData?.rotation;

          if (originalPoints) {
            const newPoints = originalPoints.map((point: Point2D) => ({
              x: point.x + offsetX,
              y: point.y + offsetY,
            }));

            // Also update rotation center if shape is rotated
            let newRotation = originalRotation;
            if (originalRotation) {
              newRotation = {
                ...originalRotation,
                center: {
                  x: originalRotation.center.x + offsetX,
                  y: originalRotation.center.y + offsetY,
                }
              };
            }

            get().updateElement(elementId, {
              points: newPoints,
              rotation: newRotation,
            });
          }
        }

        // Clear drag state
        set({
          dragState: {
            isDragging: false,
            draggedShapeId: null,
            draggedElementId: null,
            draggedElementIds: undefined,
            elementType: undefined,
            startPosition: null,
            currentPosition: null,
            originalShapePoints: null,
            originalShapesData: undefined,
            originalElementData: undefined,
            lockedAxis: null, // Feature 017: Reset axis-lock state
          }
        }, false, 'finishElementDrag');

        // Save to history
        get().saveToHistory();
      },

      duplicateShape: (id: string) => {
        const state = get();
        const originalShape = state.shapes.find(shape => shape.id === id);

        if (!originalShape) return;

        // Canva-style grouping: Check if duplicating a grouped shape with other selected shapes
        const selectedIds = state.selectedShapeIds || [];
        const shapesToDuplicate = (originalShape.groupId && selectedIds.length > 1)
          ? state.shapes.filter(s => selectedIds.includes(s.id))  // Duplicate all selected shapes in group
          : [originalShape];  // Duplicate single shape

        // Generate new groupId for duplicated shapes (if they were grouped)
        const newGroupId = (shapesToDuplicate.length > 1 && shapesToDuplicate.some(s => s.groupId))
          ? `group_${Date.now()}`
          : undefined;

        // Create new layers for each duplicated shape
        const newLayersAndShapes: { layer: Layer; shape: Shape }[] = shapesToDuplicate.map(shape => {
          // Find the original layer
          const originalLayer = state.layers.find(l => l.id === shape.layerId);

          // Create a new layer with " copy" suffix
          const newLayer: Layer = {
            id: generateId(),
            name: `${originalLayer?.name || 'Shape'} copy`,
            visible: true,
            locked: false,
            color: originalLayer?.color || shape.color,
            opacity: originalLayer?.opacity || 1,
            created: new Date(),
            modified: new Date()
          };

          // Create duplicated shape assigned to new layer
          const duplicatedShape: Shape = {
            ...shape,
            id: generateId(),
            name: `${shape.name} Copy`,
            layerId: newLayer.id, // Assign to new layer
            points: shape.points.map(p => ({ x: p.x + 20, y: p.y + 20 })), // Offset slightly
            groupId: newGroupId, // Assign new groupId or undefined
            created: new Date(),
            modified: new Date(),
            // Preserve rotation metadata if present
            rotation: shape.rotation ? {
              angle: shape.rotation.angle,
              center: {
                x: shape.rotation.center.x + 20,
                y: shape.rotation.center.y + 20
              }
            } : undefined
          };

          return { layer: newLayer, shape: duplicatedShape };
        });

        const newLayers = newLayersAndShapes.map(item => item.layer);
        const duplicatedShapes = newLayersAndShapes.map(item => item.shape);

        set(
          prevState => ({
            layers: [...prevState.layers, ...newLayers],
            shapes: [...prevState.shapes, ...duplicatedShapes],
          }),
          false,
          'duplicateShape',
        );

        logger.info(`Duplicated ${duplicatedShapes.length} shape(s) with ${newLayers.length} new layer(s)${newGroupId ? ` with new group ID: ${newGroupId}` : ''}`);
      },

      // Point manipulation
      addPoint: (point: Point2D) => {
        const state = get();
        if (state.drawing.currentShape) {
          let constrainedPoint = point;

          // Feature 017: Apply constraints if Shift is held
          // Note: Rectangle and Circle constraints are handled in DrawingCanvas.tsx
          // because those tools don't use addPoint() for the final geometry
          if (state.drawing.isShiftKeyPressed) {
            const currentPoints = state.drawing.currentShape.points || [];
            const shapeType = state.drawing.currentShape.type;

            if ((shapeType === 'polyline' || shapeType === 'polygon') && currentPoints.length > 0) {
              // Polyline/Polygon: Apply angle constraint to each segment
              const lastPoint = currentPoints[currentPoints.length - 1];
              constrainedPoint = applyAngleConstraint(lastPoint, point);
            }
          }

          set(
            prevState => ({
              drawing: {
                ...prevState.drawing,
                currentShape: {
                  ...prevState.drawing.currentShape!,
                  points: [...(prevState.drawing.currentShape!.points || []), constrainedPoint],
                },
              },
            }),
            false,
            'addPoint',
          );
        }
      },

      updatePoint: (index: number, point: Point2D) => {
        const state = get();
        if (state.drawing.currentShape?.points) {
          const newPoints = [...state.drawing.currentShape.points];
          newPoints[index] = point;

          set(
            prevState => ({
              drawing: {
                ...prevState.drawing,
                currentShape: {
                  ...prevState.drawing.currentShape!,
                  points: newPoints,
                },
              },
            }),
            false,
            'updatePoint',
          );
        }
      },

      removePoint: (index: number) => {
        const state = get();
        if (state.drawing.currentShape?.points) {
          const newPoints = [...state.drawing.currentShape.points];
          newPoints.splice(index, 1);

          set(
            prevState => ({
              drawing: {
                ...prevState.drawing,
                currentShape: {
                  ...prevState.drawing.currentShape!,
                  points: newPoints,
                },
              },
            }),
            false,
            'removePoint',
          );
        }
      },

      // History actions
      undo: () => {
        const state = get();
        const { past, present, future } = state.history;
        
        if (past.length === 0) {
          return; // Nothing to undo
        }

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        
        try {
          const previousState = JSON.parse(previous);
          
          // Restore Set objects that were serialized as arrays
          if (previousState.drawing?.snapping?.config?.activeTypes && Array.isArray(previousState.drawing.snapping.config.activeTypes)) {
            previousState.drawing.snapping.config.activeTypes = new Set(previousState.drawing.snapping.config.activeTypes);
          }
          
          // Validate and fix shape integrity after undo
          if (previousState.shapes) {
            previousState.shapes = previousState.shapes.map((shape: Shape) =>
              get().validateShapeIntegrity(shape)
            );
          }

          // Restore Date objects in layers
          if (previousState.layers) {
            previousState.layers = previousState.layers.map((layer: Layer) => ({
              ...layer,
              created: typeof layer.created === 'string' ? new Date(layer.created) : layer.created,
              modified: typeof layer.modified === 'string' ? new Date(layer.modified) : layer.modified,
            }));
          }
          
          // Preserve current UI settings that shouldn't be affected by undo
          const currentActiveTool = state.drawing.activeTool;
          const currentSnappingConfig = state.drawing.snapping; // Preserve entire snapping config (includes Grid)
          const currentDimensionsState = state.drawing.showDimensions;

          // Restore text store state if it exists in the previous state
          if (previousState.texts !== undefined) {
            useTextStore.setState({
              texts: previousState.texts,
              selectedTextId: previousState.selectedTextId || null,
            });
          }

          set(
            {
              ...previousState,
              drawing: {
                ...previousState.drawing,
                activeTool: currentActiveTool, // Keep current tool
                snapping: currentSnappingConfig, // Preserve snapping settings (including Grid)
                showDimensions: currentDimensionsState, // Preserve Dimensions setting
                isDrawing: false, // Reset drawing state
                currentShape: null, // Clear current shape
              },
              history: {
                past: newPast,
                present: previous,
                future: [present, ...future],
              },
            },
            false,
            'undo'
          );
        } catch (error) {
          logger.error('Failed to undo:', error);
        }
      },

      redo: () => {
        const state = get();
        const { past, present, future } = state.history;
        
        if (future.length === 0) {
          return; // Nothing to redo
        }

        const next = future[0];
        const newFuture = future.slice(1);
        
        try {
          const nextState = JSON.parse(next);
          
          // Restore Set objects that were serialized as arrays
          if (nextState.drawing?.snapping?.config?.activeTypes && Array.isArray(nextState.drawing.snapping.config.activeTypes)) {
            nextState.drawing.snapping.config.activeTypes = new Set(nextState.drawing.snapping.config.activeTypes);
          }
          
          // Validate and fix shape integrity after redo
          if (nextState.shapes) {
            nextState.shapes = nextState.shapes.map((shape: Shape) =>
              get().validateShapeIntegrity(shape)
            );
          }

          // Restore Date objects in layers
          if (nextState.layers) {
            nextState.layers = nextState.layers.map((layer: Layer) => ({
              ...layer,
              created: typeof layer.created === 'string' ? new Date(layer.created) : layer.created,
              modified: typeof layer.modified === 'string' ? new Date(layer.modified) : layer.modified,
            }));
          }
          
          // Preserve current UI settings that shouldn't be affected by redo
          const currentActiveTool = state.drawing.activeTool;
          const currentSnappingConfig = state.drawing.snapping; // Preserve entire snapping config (includes Grid)
          const currentDimensionsState = state.drawing.showDimensions;

          // Restore text store state if it exists in the next state
          if (nextState.texts !== undefined) {
            useTextStore.setState({
              texts: nextState.texts,
              selectedTextId: nextState.selectedTextId || null,
            });
          }

          set(
            {
              ...nextState,
              drawing: {
                ...nextState.drawing,
                activeTool: currentActiveTool, // Keep current tool
                snapping: currentSnappingConfig, // Preserve snapping settings (including Grid)
                showDimensions: currentDimensionsState, // Preserve Dimensions setting
                isDrawing: false, // Reset drawing state
                currentShape: null, // Clear current shape
              },
              history: {
                past: [...past, present],
                present: next,
                future: newFuture,
              },
            },
            false,
            'redo'
          );
        } catch (error) {
          logger.error('Failed to redo:', error);
        }
      },

      canUndo: () => {
        const state = get();
        return state.history.past.length > 0;
      },

      canRedo: () => {
        const state = get();
        return state.history.future.length > 0;
      },

      // Validate and fix shape integrity after undo/redo
      validateShapeIntegrity: (shape: Shape): Shape => {
        if (!shape.points || shape.points.length === 0) {
          return shape;
        }

        // Restore Date objects that were serialized to strings during JSON operations
        const validatedShape = { ...shape };
        if (typeof shape.created === 'string') {
          validatedShape.created = new Date(shape.created);
        }
        if (typeof shape.modified === 'string') {
          validatedShape.modified = new Date(shape.modified);
        }

        // Handle rectangles - ensure they have the correct structure
        if (validatedShape.type === 'rectangle') {
          // CRITICAL FIX: DO NOT convert between 2-point and 4-point formats
          // - Single-selection rotation uses 2-point format + rotation metadata
          // - Multi-selection rotation uses 4-point format (points already transformed)
          // - Converting between formats breaks coordinate space assumptions

          if (validatedShape.points.length === 4) {
            // Keep 4-point format as-is (multi-selection case)
            return {
              ...validatedShape,
              points: validatedShape.points.slice(0, 4)
            };
          } else if (validatedShape.points.length === 2) {
            // Keep 2-point format as-is (single-selection case)
            return validatedShape;
          }
        }
        
        // Handle polylines and polygons - preserve their structure
        if (validatedShape.type === 'polygon' || validatedShape.type === 'polyline') {
          // Don't modify the points - they should be preserved as-is
          // The closing behavior is handled at render time, not storage time
          return validatedShape;
        }

        // Handle circles - ensure they have proper structure
        if (validatedShape.type === 'circle' && validatedShape.points.length > 2) {
          // Circles should maintain their generated points structure
          return validatedShape;
        }

        return validatedShape;
      },

      // Save state to history (internal helper)
      saveToHistory: () => {
        const state = get();
        const currentStateToSave = {
          shapes: state.shapes,
          layers: state.layers,
          selectedShapeId: state.selectedShapeId,
          hoveredShapeId: null, // Don't persist hover state in history
          dragState: { // Don't persist drag state in history
            isDragging: false,
            draggedShapeId: null,
            startPosition: null,
            currentPosition: null,
            originalShapePoints: null,
            originalShapesData: undefined,
          },
          activeLayerId: state.activeLayerId,
          drawing: {
            ...state.drawing,
            // Convert Set to Array for serialization
            snapping: state.drawing.snapping ? {
              ...state.drawing.snapping,
              config: {
                ...state.drawing.snapping.config,
                activeTypes: Array.from(state.drawing.snapping.config.activeTypes)
              }
            } : state.drawing.snapping
          },
          measurements: state.measurements,
          // Include text store state in history
          texts: useTextStore.getState().texts,
          selectedTextId: useTextStore.getState().selectedTextId,
        };

        const stateString = JSON.stringify(currentStateToSave);
        
        // Only save if the state has actually changed
        if (stateString !== state.history.present) {
          set(
            prevState => ({
              history: {
                past: [...prevState.history.past, prevState.history.present],
                present: stateString,
                future: [], // Clear future when new action is performed
              },
            }),
            false,
            'saveToHistory'
          );
        }
      },

      // Edit mode actions
      enterEditMode: (shapeId: string) => {
        const state = get();
        const shape = state.shapes.find(s => s.id === shapeId);

        // CRITICAL: Don't allow editing locked shapes
        if (shape?.locked) {
          return; // Silently ignore edit attempts on locked shapes
        }

        set(
          {
            drawing: {
              ...state.drawing,
              activeTool: 'edit',
              isEditMode: true,
              editingShapeId: shapeId,
              selectedCornerIndex: null,
              // Reset resize mode when entering edit mode
              isResizeMode: false,
              resizingShapeId: null,
              resizeHandleType: null,
              resizeHandleIndex: null,
              maintainAspectRatio: false,
            },
            selectedShapeId: shapeId,
          },
          false,
          'enterEditMode',
        );
      },

      exitEditMode: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              activeTool: 'select',
              isEditMode: false,
              editingShapeId: null,
              selectedCornerIndex: null,
            },
          }),
          false,
          'exitEditMode',
        );
      },

      selectCorner: (cornerIndex: number | null) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              selectedCornerIndex: cornerIndex,
            },
          }),
          false,
          'selectCorner',
        );
      },

      updateShapePoint: (shapeId: string, pointIndex: number, point: Point2D) => {
        get().saveToHistory(); // Save state before updating point
        
        // Clear entire geometry cache to ensure changes are reflected immediately
        GeometryCache.dispose();
        
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId && shape.points) {
                const newPoints = [...shape.points];
                newPoints[pointIndex] = point;
                return {
                  ...shape,
                  points: newPoints,
                  modified: new Date(),
                };
              }
              return shape;
            }),
          }),
          false,
          'updateShapePoint',
        );
      },

      updateShapePointLive: (shapeId: string, pointIndex: number, point: Point2D) => {
        // Live update without history saving - for real-time dragging
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId && shape.points) {
                const newPoints = [...shape.points];
                newPoints[pointIndex] = point;
                return {
                  ...shape,
                  points: newPoints,
                  modified: new Date(),
                };
              }
              return shape;
            }),
          }),
          false,
          'updateShapePointLive',
        );
      },

      addShapeCorner: (shapeId: string, pointIndex: number, point: Point2D) => {
        get().saveToHistory(); // Save state before adding corner
        
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId && shape.points) {
                let newPoints = [...shape.points];
                
                // For rectangles with 2 points, first convert to 4 corners
                if (shape.type === 'rectangle' && shape.points.length === 2) {
                  const [topLeft, bottomRight] = shape.points;
                  newPoints = [
                    { x: topLeft.x, y: topLeft.y },      // Top left (0)
                    { x: bottomRight.x, y: topLeft.y },  // Top right (1)
                    { x: bottomRight.x, y: bottomRight.y }, // Bottom right (2)
                    { x: topLeft.x, y: bottomRight.y }   // Bottom left (3)
                  ];
                }
                
                newPoints.splice(pointIndex + 1, 0, point); // Insert after the specified index
                
                return {
                  ...shape,
                  type: shape.type === 'rectangle' ? 'polygon' : shape.type, // Convert rectangles to polygons
                  points: newPoints,
                  modified: new Date(),
                };
              }
              return shape;
            }),
          }),
          false,
          'addShapeCorner',
        );
      },

      deleteShapeCorner: (shapeId: string, pointIndex: number) => {
        get().saveToHistory(); // Save state before deleting corner
        
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId && shape.points && shape.points.length > 3) {
                // Don't allow deleting if it would result in less than 3 points
                const newPoints = [...shape.points];
                newPoints.splice(pointIndex, 1);
                return {
                  ...shape,
                  points: newPoints,
                  modified: new Date(),
                };
              }
              return shape;
            }),
          }),
          false,
          'deleteShapeCorner',
        );
      },

      convertRectangleToPolygon: (shapeId: string, newPoints: Point2D[]) => {
        get().saveToHistory(); // Save state before converting rectangle
        
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId) {
                return {
                  ...shape,
                  type: 'polygon' as ShapeType,
                  points: newPoints,
                  modified: new Date(),
                };
              }
              return shape;
            }),
          }),
          false,
          'convertRectangleToPolygon',
        );
      },

      convertRectangleToPolygonLive: (shapeId: string, newPoints: Point2D[]) => {
        // Live update without history saving - for real-time dragging
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId) {
                return {
                  ...shape,
                  type: 'polygon' as ShapeType,
                  points: newPoints,
                  modified: new Date(),
                };
              }
              return shape;
            }),
          }),
          false,
          'convertRectangleToPolygonLive',
        );
      },

      // Resize mode actions (only available in 'select' mode)
      enterResizeMode: (shapeId: string) => {
        const state = get();

        // Only allow resize mode when in 'select' mode and not in edit mode
        if (state.drawing.activeTool !== 'select' || state.drawing.isEditMode) {
          return;
        }

        // CRITICAL: Don't enter resize mode for multi-selection (use MultiSelectionBoundary instead)
        const isMultiSelection = state.selectedShapeIds && state.selectedShapeIds.length > 1;
        if (isMultiSelection) {
          return;
        }

        set(
          prevState => ({
            drawing: {
              ...prevState.drawing,
              isResizeMode: true,
              resizingShapeId: shapeId,
              resizeHandleType: null,
              resizeHandleIndex: null,
              maintainAspectRatio: false,
            },
            selectedShapeId: shapeId,
          }),
          false,
          'enterResizeMode',
        );
      },

      exitResizeMode: () => {
        const currentState = get();
        const wasResizingShapeId = currentState.drawing.resizingShapeId;

        set(
          state => ({
            drawing: {
              ...state.drawing,
              isResizeMode: false,
              resizingShapeId: null,
              resizeHandleType: null,
              resizeHandleIndex: null,
              maintainAspectRatio: false,
              liveResizePoints: null,
            },
          }),
          false,
          'exitResizeMode',
        );

        // MULTI-SELECTION FIX: Preserve multi-selection when exiting resize mode
        // Don't call selectShape() as it clears selectedShapeIds!
        // Only update selectedShapeId if needed, keep selectedShapeIds unchanged
        if (wasResizingShapeId && currentState.selectedShapeId !== wasResizingShapeId) {
          // Check if we have a multi-selection
          const hasMultiSelection = currentState.selectedShapeIds && currentState.selectedShapeIds.length > 1;

          if (hasMultiSelection) {
            // Preserve multi-selection, just update primary shape
            set({
              selectedShapeId: wasResizingShapeId,
              // Keep selectedShapeIds unchanged
            }, false, 'exitResizeMode-preserveMultiSelection');
          } else {
            // Single selection - use selectShape
            get().selectShape(wasResizingShapeId);
          }
        }
      },

      setResizeHandle: (handleType: 'corner' | 'edge', handleIndex: number) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              resizeHandleType: handleType,
              resizeHandleIndex: handleIndex,
            },
          }),
          false,
          'setResizeHandle',
        );
      },

      setMaintainAspectRatio: (maintain: boolean) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              maintainAspectRatio: maintain,
            },
          }),
          false,
          'setMaintainAspectRatio',
        );
      },

      resizeShape: (shapeId: string, newPoints: Point2D[]) => {
        document.title = 'RESIZE CALLED ' + new Date().toLocaleTimeString();
        logger.log('🔧 ResizeShape called for:', shapeId, 'with points:', JSON.stringify(newPoints));
        logger.log('🔧 Current shapes before resize:', get().shapes.map(s => ({id: s.id, points: s.points})));
        get().saveToHistory(); // Save state before resizing
        
        // First invalidate the specific shape from cache BEFORE clearing everything
        const shape = get().shapes.find(s => s.id === shapeId);
        if (shape) {
          GeometryCache.invalidateShape(shape);
          logger.log('🎯 Invalidated specific shape from cache:', shapeId);
        }
        
        // Then clear entire geometry cache to ensure resize is reflected immediately
        GeometryCache.dispose();
        logger.log('🧹 GeometryCache disposed');

        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId) {
                // CRITICAL FIX: Ensure rectangles are always stored in 2-point format
                let normalizedPoints = newPoints;
                if (shape.type === 'rectangle' && newPoints.length > 2) {
                  // Convert any multi-point format to 2-point format
                  const minX = Math.min(...newPoints.map(p => p.x));
                  const maxX = Math.max(...newPoints.map(p => p.x));
                  const minY = Math.min(...newPoints.map(p => p.y));
                  const maxY = Math.max(...newPoints.map(p => p.y));
                  normalizedPoints = [
                    { x: minX, y: minY },
                    { x: maxX, y: maxY }
                  ];
                  logger.log('📦 Normalized rectangle to 2-point format:', normalizedPoints);
                }

                // CRITICAL FIX: When resizing a rotated shape, recalculate the rotation center
                // based on the NEW resized points (in local space)
                let updatedRotation = shape.rotation;
                if (shape.rotation && normalizedPoints.length >= 2) {
                  // Calculate new center based on new points
                  if (shape.type === 'rectangle' && normalizedPoints.length === 2) {
                    // 2-point rectangle format
                    const [topLeft, bottomRight] = normalizedPoints;
                    updatedRotation = {
                      angle: shape.rotation.angle, // Keep the same angle
                      center: {
                        x: (topLeft.x + bottomRight.x) / 2,
                        y: (topLeft.y + bottomRight.y) / 2
                      }
                    };
                  } else {
                    // Multi-point format (calculate centroid)
                    const center = {
                      x: normalizedPoints.reduce((sum, p) => sum + p.x, 0) / normalizedPoints.length,
                      y: normalizedPoints.reduce((sum, p) => sum + p.y, 0) / normalizedPoints.length
                    };
                    updatedRotation = {
                      angle: shape.rotation.angle,
                      center
                    };
                  }
                  logger.log('🔄 Updated rotation center:', updatedRotation);
                }

                const updatedShape = {
                  ...shape,
                  points: normalizedPoints,
                  rotation: updatedRotation,
                  modified: new Date(),
                };
                logger.log('✅ Updated shape in store:', updatedShape);
                return updatedShape;
              }
              return shape;
            }),
            drawing: {
              ...state.drawing,
              liveResizePoints: null,
            },
          }),
          false,
          'resizeShape',
        );
        
        logger.log('🔧 Shapes after resize:', get().shapes.map(s => ({id: s.id, points: s.points, modified: s.modified})));
      },

      // Live resize (for real-time updates without history pollution)
      resizeShapeLive: (shapeId: string, newPoints: Point2D[]) => {
        const currentState = get();

        // CRITICAL VALIDATION: Only proceed if this shape is actively being resized
        // Silent return to avoid console spam from timing issues when resize mode exits
        if (!currentState.drawing.isResizeMode || currentState.drawing.resizingShapeId !== shapeId) {
          return;
        }

        // VALIDATION: Ensure newPoints is valid
        if (!newPoints || !Array.isArray(newPoints) || newPoints.length === 0) {
          logger.error('❌ Invalid newPoints for live resize:', newPoints);
          return;
        }

        // Validate and sanitize points atomically
        const validPoints = newPoints.filter(point =>
          point &&
          typeof point.x === 'number' && typeof point.y === 'number' &&
          !isNaN(point.x) && !isNaN(point.y) &&
          isFinite(point.x) && isFinite(point.y)
        );

        if (validPoints.length === 0) {
          logger.error('❌ No valid points in live resize');
          return;
        }

        // Find target shape for cache invalidation
        const shape = currentState.shapes.find(s => s.id === shapeId);
        if (!shape) {
          logger.error('❌ Shape not found for live resize:', shapeId);
          return;
        }

        // ENHANCED: Additional geometry bounds validation for rectangles
        if (shape.type === 'rectangle' && validPoints.length >= 2) {
          let minX, maxX, minY, maxY;

          if (validPoints.length === 2) {
            // 2-point format validation
            [minX, maxX] = [Math.min(validPoints[0].x, validPoints[1].x), Math.max(validPoints[0].x, validPoints[1].x)];
            [minY, maxY] = [Math.min(validPoints[0].y, validPoints[1].y), Math.max(validPoints[0].y, validPoints[1].y)];
          } else {
            // Multi-point format validation
            const xCoords = validPoints.map(p => p.x);
            const yCoords = validPoints.map(p => p.y);
            minX = Math.min(...xCoords);
            maxX = Math.max(...xCoords);
            minY = Math.min(...yCoords);
            maxY = Math.max(...yCoords);
          }

          const width = maxX - minX;
          const height = maxY - minY;

          // Prevent degenerate rectangles that cause diagonal line artifacts
          if (width < 0.001 || height < 0.001) {
            logger.warn('⚠️ Degenerate rectangle bounds detected in live resize, skipping:', { width, height });
            return; // Skip this live update to prevent visual artifacts
          }

          // Additional sanity check: ensure aspect ratio is reasonable (prevent extreme distortion)
          const aspectRatio = width / height;
          if (aspectRatio < 0.001 || aspectRatio > 1000) {
            logger.warn('⚠️ Extreme aspect ratio detected in live resize, skipping:', aspectRatio);
            return; // Skip this live update to prevent rendering issues
          }
        }

        // ATOMIC UPDATE: Only update liveResizePoints during live operations
        // The actual shape points will be updated when resize is finalized
        try {
          // Invalidate geometry cache before state update
          GeometryCache.invalidateShape(shape);

          // Atomic state update - only update liveResizePoints during live operations
          set(
            state => ({
              ...state,
              drawing: {
                ...state.drawing,
                liveResizePoints: validPoints, // This is the authoritative source during resize
              },
            }),
            false,
            'resizeShapeLive'
          );

          logger.log('✅ Live resize updated successfully:', {
            shapeId,
            pointCount: validPoints.length
          });
        } catch (error) {
          logger.error('❌ Failed to update live resize state:', error);
        }
      },

      // Multi-selection resize actions
      resizeMultiSelection: (
        shapeIds: string[],
        originalBounds: { minX: number; minY: number; maxX: number; maxY: number },
        newBounds: { minX: number; minY: number; maxX: number; maxY: number },
        scaleX: number,
        scaleY: number,
        translateX: number,
        translateY: number
      ) => {
        const currentState = get();

        // Filter out locked shapes
        const validShapeIds = shapeIds.filter(id => {
          const shape = currentState.shapes.find(s => s.id === id);
          return shape && !shape.locked;
        });

        if (validShapeIds.length === 0) return;

        // Check if this is uniform scaling (aspect ratio preservation)
        const isUniformScaling = Math.abs(scaleX - scaleY) < 0.001;

        // Calculate original center for transformation
        const originalCenterX = (originalBounds.minX + originalBounds.maxX) / 2;
        const originalCenterY = (originalBounds.minY + originalBounds.maxY) / 2;

        // Apply transformation to all selected shapes
        const updatedShapes = currentState.shapes.map(shape => {
          if (!validShapeIds.includes(shape.id)) return shape;

          // Transform each point based on scaling type
          const newPoints = shape.points.map(point => {
            if (isUniformScaling) {
              // UNIFORM SCALING (Canva/Figma style): Scale the entire bounding box INCLUDING spacing
              // Calculate normalized position within original bounds (0-1)
              const normalizedX = (point.x - originalBounds.minX) / (originalBounds.maxX - originalBounds.minX);
              const normalizedY = (point.y - originalBounds.minY) / (originalBounds.maxY - originalBounds.minY);

              // Apply uniform scale to the bounding box dimensions
              const newWidth = (originalBounds.maxX - originalBounds.minX) * scaleX;
              const newHeight = (originalBounds.maxY - originalBounds.minY) * scaleX;

              // Place point at the same normalized position within the new bounds
              return {
                x: originalBounds.minX + normalizedX * newWidth + translateX,
                y: originalBounds.minY + normalizedY * newHeight + translateY
              };
            } else {
              // NON-UNIFORM SCALING: Use bounds interpolation (allows distortion)
              const relativeX = (point.x - originalBounds.minX) / (originalBounds.maxX - originalBounds.minX);
              const relativeY = (point.y - originalBounds.minY) / (originalBounds.maxY - originalBounds.minY);

              const newX = newBounds.minX + relativeX * (newBounds.maxX - newBounds.minX);
              const newY = newBounds.minY + relativeY * (newBounds.maxY - newBounds.minY);

              return { x: newX, y: newY };
            }
          });

          // Invalidate geometry cache
          GeometryCache.invalidateShape(shape);

          return {
            ...shape,
            points: newPoints,
            modified: new Date(),
          };
        });

        set(
          state => ({
            ...state,
            shapes: updatedShapes,
            drawing: {
              ...state.drawing,
              liveResizePoints: null,
            },
          }),
          false,
          'resizeMultiSelection'
        );
      },

      resizeMultiSelectionLive: (
        shapeIds: string[],
        originalBounds: { minX: number; minY: number; maxX: number; maxY: number },
        newBounds: { minX: number; minY: number; maxX: number; maxY: number },
        scaleX: number,
        scaleY: number,
        translateX: number,
        translateY: number
      ) => {
        const currentState = get();

        // Filter out locked shapes
        const validShapeIds = shapeIds.filter(id => {
          const shape = currentState.shapes.find(s => s.id === id);
          return shape && !shape.locked;
        });

        if (validShapeIds.length === 0) return;

        // Check if this is uniform scaling (aspect ratio preservation)
        const isUniformScaling = Math.abs(scaleX - scaleY) < 0.001;

        // Apply transformation to all selected shapes
        const updatedShapes = currentState.shapes.map(shape => {
          if (!validShapeIds.includes(shape.id)) return shape;

          // Transform each point based on scaling type
          const newPoints = shape.points.map(point => {
            if (isUniformScaling) {
              // UNIFORM SCALING (Canva/Figma style): Scale the entire bounding box INCLUDING spacing
              // Calculate normalized position within original bounds (0-1)
              const normalizedX = (point.x - originalBounds.minX) / (originalBounds.maxX - originalBounds.minX);
              const normalizedY = (point.y - originalBounds.minY) / (originalBounds.maxY - originalBounds.minY);

              // Apply uniform scale to the bounding box dimensions
              const newWidth = (originalBounds.maxX - originalBounds.minX) * scaleX;
              const newHeight = (originalBounds.maxY - originalBounds.minY) * scaleX;

              // Place point at the same normalized position within the new bounds
              return {
                x: originalBounds.minX + normalizedX * newWidth + translateX,
                y: originalBounds.minY + normalizedY * newHeight + translateY
              };
            } else {
              // NON-UNIFORM SCALING: Use bounds interpolation (allows distortion)
              const relativeX = (point.x - originalBounds.minX) / (originalBounds.maxX - originalBounds.minX);
              const relativeY = (point.y - originalBounds.minY) / (originalBounds.maxY - originalBounds.minY);

              const newX = newBounds.minX + relativeX * (newBounds.maxX - newBounds.minX);
              const newY = newBounds.minY + relativeY * (newBounds.maxY - newBounds.minY);

              return { x: newX, y: newY };
            }
          });

          // Invalidate geometry cache
          GeometryCache.invalidateShape(shape);

          return {
            ...shape,
            points: newPoints,
          };
        });

        set(
          state => ({
            ...state,
            shapes: updatedShapes,
          }),
          false,
          'resizeMultiSelectionLive'
        );
      },

      // Rotation mode actions
      enterRotateMode: (shapeId: string) => {
        // PERFORMANCE FIX: Defer history save to avoid blocking UI during drag start
        // History will be saved when rotation completes (in rotateShape)
        // This eliminates the freeze when starting rotation drag

        // Defensive programming: Ensure we exit resize mode if currently active
        const currentState = get();
        if (currentState.drawing.isResizeMode) {
          get().exitResizeMode();
        }

        // CRITICAL: Cancel any ongoing drag operations when entering rotation mode
        if (currentState.dragState.isDragging) {
          get().cancelDragging();
        }

        // Capture the current rotation state of the shape being rotated
        const currentShape = get().shapes.find(shape => shape.id === shapeId);
        const originalRotation = currentShape?.rotation || { angle: 0, center: { x: 0, y: 0 } };

        // MULTI-SELECTION FIX: Preserve existing multi-selection or use group members
        // Priority: 1) Existing multi-selection 2) Group members 3) Single shape
        let shapesToRotate: string[] = [shapeId];

        // Check if there's already a multi-selection active
        const existingSelection = currentState.selectedShapeIds || [];

        if (existingSelection.length > 1 && existingSelection.includes(shapeId)) {
          // Preserve the existing multi-selection
          shapesToRotate = existingSelection;
        } else if (currentShape?.groupId) {
          // Canva-style grouping: If shape is part of a group, select ALL group members
          const groupMembers = currentState.shapes.filter(s => s.groupId === currentShape.groupId);
          shapesToRotate = groupMembers.map(s => s.id);
          logger.info(`Entering rotate mode for group: ${currentShape.groupId} (${shapesToRotate.length} shapes)`);
        }

        set(
          state => ({
            drawing: {
              ...state.drawing,
              isRotateMode: true,
              rotatingShapeId: shapeId,
              rotationStartAngle: 0,
              rotationCenter: null,
              originalRotation: originalRotation,
              // Exit other modes when entering rotation
              isEditMode: false,
              editingShapeId: null,
              selectedCornerIndex: null,
              isResizeMode: false,
              resizingShapeId: null,
              resizeHandleType: null,
              resizeHandleIndex: null,
              maintainAspectRatio: false,
            },
            // Preserve multi-selection, group selection, or single shape
            selectedShapeId: shapeId,
            selectedShapeIds: shapesToRotate,
          }),
          false,
          'enterRotateMode',
        );
      },

      exitRotateMode: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              isRotateMode: false,
              rotatingShapeId: null,
              rotationStartAngle: 0,
              rotationCenter: null,
              originalRotation: null,
            },
          }),
          false,
          'exitRotateMode',
        );
      },

      // Live rotation (for real-time updates without history pollution)
      rotateShapeLive: (shapeId: string, angle: number, center: Point2D) => {
        const state = get();

        // MULTI-SELECTION FIX: Rotate all selected shapes together
        const selectedIds = state.selectedShapeIds || [];
        const shapesToRotate = (selectedIds.length > 1)
          ? selectedIds  // Rotate all selected shapes together
          : [shapeId];   // Rotate single shape

        // Invalidate geometry cache for all shapes being rotated
        shapesToRotate.forEach(id => {
          const existingShape = state.shapes.find(shape => shape.id === id);
          if (existingShape) {
            GeometryCache.invalidateShape(existingShape);
          }
        });

        // Helper: Calculate shape center
        const calculateShapeCenter = (points: Point2D[]): Point2D => {
          if (points.length === 0) return { x: 0, y: 0 };
          return {
            x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
            y: points.reduce((sum, p) => sum + p.y, 0) / points.length
          };
        };

        // Helper: Rotate a point around a center
        const rotatePoint = (point: Point2D, center: Point2D, angleDegrees: number): Point2D => {
          const angleRadians = (angleDegrees * Math.PI) / 180;
          const cos = Math.cos(angleRadians);
          const sin = Math.sin(angleRadians);
          const dx = point.x - center.x;
          const dy = point.y - center.y;
          return {
            x: center.x + (dx * cos - dy * sin),
            y: center.y + (dx * sin + dy * cos)
          };
        };

        // For multi-selection: rotate each shape around the group center
        // For single selection: apply rotation metadata
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (!shapesToRotate.includes(shape.id)) return shape;

              if (shapesToRotate.length > 1) {
                // MULTI-SELECTION: Calculate new points by rotating around group center
                const originalPoints = shape.rotation?.center
                  ? shape.points // Points are already in world space if shape was previously rotated
                  : shape.points;

                // Calculate the shape's center
                const shapeCenter = calculateShapeCenter(originalPoints);

                // Rotate the shape's center around the group center
                const newShapeCenter = rotatePoint(shapeCenter, center, angle);

                // Calculate offset to move shape
                const offsetX = newShapeCenter.x - shapeCenter.x;
                const offsetY = newShapeCenter.y - shapeCenter.y;

                // Move all points by the offset and store rotation metadata
                const newPoints = originalPoints.map(p => ({
                  x: p.x + offsetX,
                  y: p.y + offsetY
                }));

                return {
                  ...shape,
                  points: newPoints,
                  rotation: { angle, center: newShapeCenter }, // Rotate around new center
                  modified: new Date(),
                };
              } else {
                // SINGLE SELECTION: Just apply rotation metadata (rendering handles transform)
                return {
                  ...shape,
                  rotation: { angle, center },
                  modified: new Date(),
                };
              }
            }),
          }),
          false,
          'rotateShapeLive',
        );
      },

      rotateShape: (shapeId: string, angle: number, center: Point2D) => {
        const state = get();

        // MULTI-SELECTION FIX: Rotate all selected shapes together
        const selectedIds = state.selectedShapeIds || [];
        const shapesToRotate = (selectedIds.length > 1)
          ? selectedIds  // Rotate all selected shapes together
          : [shapeId];   // Rotate single shape

        // Invalidate geometry cache for all shapes being rotated
        shapesToRotate.forEach(id => {
          const existingShape = state.shapes.find(shape => shape.id === id);
          if (existingShape) {
            GeometryCache.invalidateShape(existingShape);
          }
        });

        // Helper: Calculate shape center
        const calculateShapeCenter = (points: Point2D[]): Point2D => {
          if (points.length === 0) return { x: 0, y: 0 };
          return {
            x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
            y: points.reduce((sum, p) => sum + p.y, 0) / points.length
          };
        };

        // Helper: Rotate a point around a center
        const rotatePoint = (point: Point2D, center: Point2D, angleDegrees: number): Point2D => {
          const angleRadians = (angleDegrees * Math.PI) / 180;
          const cos = Math.cos(angleRadians);
          const sin = Math.sin(angleRadians);
          const dx = point.x - center.x;
          const dy = point.y - center.y;
          return {
            x: center.x + (dx * cos - dy * sin),
            y: center.y + (dx * sin + dy * cos)
          };
        };

        // For multi-selection: rotate each shape around the group center
        // For single selection: apply rotation metadata
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (!shapesToRotate.includes(shape.id)) return shape;

              if (shapesToRotate.length > 1) {
                // MULTI-SELECTION: Calculate new points by rotating around group center
                const originalPoints = shape.rotation?.center
                  ? shape.points // Points are already in world space if shape was previously rotated
                  : shape.points;

                // Calculate the shape's center
                const shapeCenter = calculateShapeCenter(originalPoints);

                // Rotate the shape's center around the group center
                const newShapeCenter = rotatePoint(shapeCenter, center, angle);

                // Calculate offset to move shape
                const offsetX = newShapeCenter.x - shapeCenter.x;
                const offsetY = newShapeCenter.y - shapeCenter.y;

                // Move all points by the offset and store rotation metadata
                const newPoints = originalPoints.map(p => ({
                  x: p.x + offsetX,
                  y: p.y + offsetY
                }));

                return {
                  ...shape,
                  points: newPoints,
                  rotation: { angle, center: newShapeCenter }, // Rotate around new center
                  modified: new Date(),
                };
              } else {
                // SINGLE SELECTION: Just apply rotation metadata (rendering handles transform)
                return {
                  ...shape,
                  rotation: { angle, center },
                  modified: new Date(),
                };
              }
            }),
          }),
          false,
          'rotateShape',
        );

        // CRITICAL FIX: Save to history AFTER rotation completes
        // This captures the rotated state so the rotation persists
        // History was saved BEFORE rotation in enterRotateMode (pre-rotation state)
        // Now we save AFTER to capture post-rotation state
        get().saveToHistory();
      },

      // Cursor rotation mode actions (hover-to-rotate)
      enterCursorRotationMode: (shapeId: string) => {
        const state = get();

        // Validate shape exists (skip validation for text objects - they're in useTextStore)
        const shape = state.shapes.find(s => s.id === shapeId);

        // Save current state to history before entering mode
        state.saveToHistory();

        // MULTI-SELECTION FIX: Preserve existing multi-selection or use group members
        // Priority: 1) Existing multi-selection 2) Group members 3) Single shape
        let shapesToRotate: string[] = [shapeId];

        if (shape) {
          // Only apply shape-specific logic if it's actually a shape
          // Check if there's already a multi-selection active
          const existingSelection = state.selectedShapeIds || [];

          if (existingSelection.length > 1 && existingSelection.includes(shapeId)) {
            // Preserve the existing multi-selection
            shapesToRotate = existingSelection;
          } else if (shape.groupId) {
            // Canva-style grouping: If shape is part of a group, select ALL group members
            const groupMembers = state.shapes.filter(s => s.groupId === shape.groupId);
            shapesToRotate = groupMembers.map(s => s.id);
            logger.info(`Entering cursor rotation mode for group: ${shape.groupId} (${shapesToRotate.length} shapes)`);
          }
        }

        // Enter cursor rotation mode (keep current tool as 'select')
        set(
          state => ({
            drawing: {
              ...state.drawing,
              cursorRotationMode: true,
              cursorRotationShapeId: shapeId,
            },
            // Only update selectedShapeIds if it's a shape (not text)
            ...(shape ? { selectedShapeIds: shapesToRotate } : {}),
          }),
          false,
          'enterCursorRotationMode'
        );

        logger.info(`Entered cursor rotation mode for ${shape ? 'shape' : 'text'} ${shapeId}`);
      },

      exitCursorRotationMode: (cancel: boolean = false) => {
        const state = get();

        if (cancel) {
          // Cancel: Undo to restore original rotation (before entering mode)
          state.undo();
          logger.info('Canceled cursor rotation mode - restored original rotation');
        } else {
          // Confirm: Save final state
          if (state.drawing.cursorRotationShapeId) {
            state.saveToHistory();
          }
          logger.info('Exited cursor rotation mode');
        }

        set(
          state => ({
            drawing: {
              ...state.drawing,
              cursorRotationMode: false,
              cursorRotationShapeId: null,
            },
          }),
          false,
          'exitCursorRotationMode'
        );
      },

      applyCursorRotation: (shapeId: string, angle: number, center: Point2D) => {
        const state = get();

        // Apply rotation using existing rotateShape action
        // This already saves to history at the end
        state.rotateShape(shapeId, angle, center);

        logger.info(`Cursor rotation applied: ${Math.round(angle)}°`);
      },

      // Flip actions
      flipShapes: (shapeIds: string[], direction: 'horizontal' | 'vertical') => {
        const state = get();

        logger.info(`[Store] Flipping ${shapeIds.length} shapes ${direction}ly`);

        // Validate inputs
        if (shapeIds.length === 0) {
          logger.warn('[Store] No shapes to flip');
          return;
        }

        // Invalidate geometry cache for all shapes being flipped
        shapeIds.forEach(id => {
          const existingShape = state.shapes.find(shape => shape.id === id);
          if (existingShape) {
            GeometryCache.invalidateShape(existingShape);
          }
        });

        // Flip each shape around its own center
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (!shapeIds.includes(shape.id)) return shape;

              // Skip locked shapes silently
              if (shape.locked) {
                logger.info(`[Store] Skipping locked shape ${shape.id}`);
                return shape;
              }

              // Calculate flipped points
              const flippedPoints = direction === 'horizontal'
                ? flipPointsHorizontally(shape.points)
                : flipPointsVertically(shape.points);

              logger.info(`[Store] Flipped shape ${shape.id}:`, {
                originalPoints: shape.points.length,
                flippedPoints: flippedPoints.length,
                direction
              });

              return {
                ...shape,
                points: flippedPoints,
                modified: new Date()
              };
            }),
            renderTrigger: state.renderTrigger + 1
          }),
          false,
          'flipShapes'
        );

        // Save to history after flip completes
        get().saveToHistory();

        logger.info(`[Store] Flip complete: ${shapeIds.length} shapes flipped ${direction}ly`);
      },

      flipSelectedShapes: (direction: 'horizontal' | 'vertical') => {
        const { selectedShapeIds, shapes, flipShapes } = get();
        if (selectedShapeIds.length === 0) {
          logger.warn('[Store] No shapes selected for flip');
          return;
        }

        // Expand selection to include ALL shapes from any groups
        const directlySelectedShapes = shapes.filter(s =>
          selectedShapeIds.includes(s.id)
        );

        // Get all group IDs from selected shapes
        const groupIds = new Set(
          directlySelectedShapes
            .filter(s => s.groupId)
            .map(s => s.groupId!)
        );

        // Get all shapes that should be flipped (selected + all from groups)
        const shapesToFlip = shapes.filter(s =>
          selectedShapeIds.includes(s.id) ||
          (s.groupId && groupIds.has(s.groupId))
        );

        const shapeIdsToFlip = shapesToFlip.map(s => s.id);

        if (groupIds.size > 0) {
          logger.info(`[Store] Expanding flip to include ${shapesToFlip.length} shapes from ${groupIds.size} group(s)`);
        }

        flipShapes(shapeIdsToFlip, direction);
      },

      // Measurement actions
      activateMeasurementTool: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              activeTool: 'measure',
              measurement: {
                ...state.drawing.measurement,
                isActive: true
              }
            }
          }),
          false,
          'activateMeasurementTool'
        );
      },

      deactivateMeasurementTool: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                isActive: false,
                isMeasuring: false,
                startPoint: null,
                previewEndPoint: null
              }
            }
          }),
          false,
          'deactivateMeasurementTool'
        );
      },

      startMeasurement: (point: Point2D, snapPoint?: SnapPoint) => {
        const measurementPoint = MeasurementUtils.createMeasurementPoint(point, snapPoint);

        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                isMeasuring: true,
                startPoint: measurementPoint,
                previewEndPoint: null
              }
            }
          }),
          false,
          'startMeasurement'
        );
      },

      updateMeasurementPreview: (point: Point2D) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                previewEndPoint: point
              }
            }
          }),
          false,
          'updateMeasurementPreview'
        );
      },

      completeMeasurement: (point: Point2D, snapPoint?: SnapPoint) => {
        const state = get();
        const startPoint = state.drawing.measurement.startPoint;

        if (!startPoint) {
          logger.warn('Cannot complete measurement: no start point');
          return;
        }

        // Validate measurement points
        const validation = MeasurementUtils.validateMeasurementPoints(startPoint.position, point);
        if (!validation.isValid) {
          logger.warn(`Cannot complete measurement: ${validation.error}`);
          return;
        }

        const endPoint = MeasurementUtils.createMeasurementPoint(point, snapPoint);
        const measurement = MeasurementUtils.createMeasurement(
          startPoint,
          endPoint,
          state.drawing.measurement.unit
        );

        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                isMeasuring: false,
                startPoint: null,
                previewEndPoint: null,
                measurements: [...state.drawing.measurement.measurements, measurement],
                selectedMeasurementId: measurement.id
              }
            }
          }),
          false,
          'completeMeasurement'
        );

        // Save to history after completing measurement
        get().saveToHistory();
      },

      cancelMeasurement: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                isMeasuring: false,
                startPoint: null,
                previewEndPoint: null
              }
            }
          }),
          false,
          'cancelMeasurement'
        );
      },

      toggleMeasurementVisibility: (id: string) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                measurements: state.drawing.measurement.measurements.map(m =>
                  m.id === id ? { ...m, visible: !m.visible } : m
                )
              }
            }
          }),
          false,
          'toggleMeasurementVisibility'
        );
      },

      deleteMeasurement: (id: string) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                measurements: state.drawing.measurement.measurements.filter(m => m.id !== id),
                selectedMeasurementId: state.drawing.measurement.selectedMeasurementId === id ? null : state.drawing.measurement.selectedMeasurementId
              }
            }
          }),
          false,
          'deleteMeasurement'
        );

        // Save to history after deleting measurement
        get().saveToHistory();
      },

      clearAllMeasurements: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                measurements: [],
                selectedMeasurementId: null,
                isMeasuring: false,
                startPoint: null,
                previewEndPoint: null
              }
            }
          }),
          false,
          'clearAllMeasurements'
        );

        // Save to history after clearing all measurements
        get().saveToHistory();
      },

      selectMeasurement: (id: string | null) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                selectedMeasurementId: id
              }
            }
          }),
          false,
          'selectMeasurement'
        );
      },

      setMeasurementUnit: (unit: 'metric' | 'imperial' | 'toise') => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                unit
              }
            }
          }),
          false,
          'setMeasurementUnit'
        );
      },

      toggleMeasurementDisplay: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              measurement: {
                ...state.drawing.measurement,
                showMeasurements: !state.drawing.measurement.showMeasurements
              }
            }
          }),
          false,
          'toggleMeasurementDisplay'
        );
      },

      // Line tool actions
      activateLineTool: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              activeTool: 'line',
              lineTool: {
                ...state.drawing.lineTool,
                isActive: true
              }
            }
          }),
          false,
          'activateLineTool'
        );
      },

      deactivateLineTool: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                isActive: false,
                isDrawing: false,
                startPoint: null,
                inputValue: '',
                currentDistance: null,
                previewEndPoint: null,
                isWaitingForInput: false,
                showInput: false,
                inputPosition: { x: 0, y: 0 }
              }
            }
          }),
          false,
          'deactivateLineTool'
        );
      },

      startLineDrawing: (point: Point2D) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                isDrawing: true,
                startPoint: point,
                isWaitingForInput: true,
                inputPosition: point,
                showInput: true,
                inputValue: '',
                currentDistance: null,
                previewEndPoint: null
              }
            }
          }),
          false,
          'startLineDrawing'
        );
      },

      updateLinePreview: (point: Point2D) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                previewEndPoint: point
              }
            }
          }),
          false,
          'updateLinePreview'
        );
      },

      updateDistanceInput: (value: string) => {
        const parsedDistance = parseDistance(value);

        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                inputValue: value,
                currentDistance: parsedDistance
              }
            }
          }),
          false,
          'updateDistanceInput'
        );
      },

      showDistanceInput: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                showInput: true
              }
            }
          }),
          false,
          'showDistanceInput'
        );
      },

      hideDistanceInput: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                showInput: false,
                inputPosition: { x: 0, y: 0 },
                inputValue: '',
                currentDistance: null
              }
            }
          }),
          false,
          'hideDistanceInput'
        );
      },

      confirmLineDistance: () => {
        const state = get();
        const { lineTool } = state.drawing;

        if (lineTool.startPoint && lineTool.currentDistance && lineTool.currentDistance > 0 && lineTool.previewEndPoint) {
          // Feature 017: Apply angle constraint if Shift is held
          let effectivePreviewPoint = lineTool.previewEndPoint;
          if (state.drawing.isShiftKeyPressed) {
            effectivePreviewPoint = applyAngleConstraint(lineTool.startPoint, lineTool.previewEndPoint);
          }

          // Calculate precise end point using direction and distance
          const direction = calculateDirection(lineTool.startPoint, effectivePreviewPoint);
          const preciseEndPoint = applyDistance(lineTool.startPoint, direction, lineTool.currentDistance);

          if (lineTool.isMultiSegment) {
            // Multi-segment mode: Create segment and continue to next
            const segment: LineSegment = {
              id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              startPoint: lineTool.startPoint,
              endPoint: preciseEndPoint,
              distance: lineTool.currentDistance,
              created: new Date()
            };

            // Check if we're close to the first point to close the shape
            const firstPoint = lineTool.segments.length > 0 ? lineTool.segments[0].startPoint : lineTool.startPoint;
            const distanceToFirst = Math.sqrt(
              Math.pow(preciseEndPoint.x - firstPoint.x, 2) + Math.pow(preciseEndPoint.y - firstPoint.y, 2)
            );

            const closeThreshold = 4.0; // 4 meters threshold for closing

            if (lineTool.segments.length >= 2 && distanceToFirst < closeThreshold) {
              // Close the shape - create a polyline from all segments
              const allPoints: Point2D[] = [];

              // Add all segment points (don't add preciseEndPoint - it creates a gap)
              // Just use the existing segments to create a proper closed loop
              if (lineTool.segments.length > 0) {
                allPoints.push(lineTool.segments[0].startPoint);
                lineTool.segments.forEach(seg => {
                  allPoints.push(seg.endPoint);
                });
              }
              // Close the loop by adding the first point at the end
              allPoints.push(firstPoint);

              // Create polyline shape (closed)
              const polylineShape: Omit<Shape, 'id' | 'created' | 'modified'> = {
                name: `Line Shape ${state.shapes.length + 1}`,
                points: allPoints,
                type: 'polyline',
                color: '#3b82f6',
                visible: true,
                layerId: state.activeLayerId
              };

              get().addShape(polylineShape);

              // Reset line tool
              set(
                state => ({
                  drawing: {
                    ...state.drawing,
                    lineTool: {
                      ...state.drawing.lineTool,
                      isDrawing: false,
                      isMultiSegment: false,
                      segments: [],
                      startPoint: null,
                      inputValue: '',
                      currentDistance: null,
                      previewEndPoint: null,
                      isWaitingForInput: false,
                      showInput: false,
                      inputPosition: { x: 0, y: 0 }
                    }
                  }
                }),
                false,
                'confirmLineDistance_closeShape'
              );
            } else {
              // Continue multi-segment drawing
              set(
                state => ({
                  drawing: {
                    ...state.drawing,
                    lineTool: {
                      ...state.drawing.lineTool,
                      segments: [...state.drawing.lineTool.segments, segment],
                      startPoint: preciseEndPoint, // Next segment starts where this one ended
                      inputValue: '',
                      currentDistance: null,
                      previewEndPoint: null,
                      isWaitingForInput: true, // Wait for next distance input
                      showInput: true,
                      inputPosition: preciseEndPoint,
                      // Explicitly preserve multi-segment state
                      isMultiSegment: true,
                      isDrawing: true
                    }
                  }
                }),
                false,
                'confirmLineDistance_multiSegment'
              );

            }
          } else {
            // Single segment mode: Create line shape and complete
            const lineShape: Omit<Shape, 'id' | 'created' | 'modified'> = {
              name: `Line ${state.shapes.length + 1}`,
              points: [lineTool.startPoint, preciseEndPoint],
              type: 'line',
              color: '#3b82f6',
              visible: true,
              layerId: state.activeLayerId
            };

            get().addShape(lineShape);

            set(
              state => ({
                drawing: {
                  ...state.drawing,
                  lineTool: {
                    ...state.drawing.lineTool,
                    isDrawing: false,
                    startPoint: null,
                    inputValue: '',
                    currentDistance: null,
                    previewEndPoint: null,
                    isWaitingForInput: false,
                    showInput: false,
                    inputPosition: { x: 0, y: 0 }
                  }
                }
              }),
              false,
              'confirmLineDistance_single'
            );
          }
        }
      },

      cancelLineDrawing: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                isDrawing: false,
                startPoint: null,
                inputValue: '',
                currentDistance: null,
                previewEndPoint: null,
                isWaitingForInput: false,
                showInput: false,
                inputPosition: { x: 0, y: 0 }
              }
            }
          }),
          false,
          'cancelLineDrawing'
        );
      },

      completeLine: () => {
        const state = get();
        const { lineTool } = state.drawing;

        if (lineTool.segments.length > 0) {
          // Convert segments to polyline shape
          const allPoints: Point2D[] = [];

          // Add start point of first segment
          const firstPoint = lineTool.segments[0].startPoint;
          allPoints.push(firstPoint);

          // Add end point of each segment
          lineTool.segments.forEach(segment => {
            allPoints.push(segment.endPoint);
          });

          // Close the loop by adding the first point at the end
          allPoints.push(firstPoint);

          // Create line shape from segments (use 'polyline' type for closed shapes with 3+ segments)
          const lineShape: Omit<Shape, 'id' | 'created' | 'modified'> = {
            name: `Line Shape ${state.shapes.length + 1}`,
            points: allPoints,
            type: lineTool.segments.length >= 2 ? 'polyline' : 'line',
            color: '#3b82f6',
            visible: true,
            layerId: state.activeLayerId
          };

          get().addShape(lineShape);

          // Clear line tool state
          set(
            state => ({
              drawing: {
                ...state.drawing,
                lineTool: {
                  ...state.drawing.lineTool,
                  isDrawing: false,
                  isMultiSegment: false,
                  startPoint: null,
                  inputValue: '',
                  currentDistance: null,
                  previewEndPoint: null,
                  segments: [],
                  isWaitingForInput: false,
                  showInput: false,
                inputPosition: { x: 0, y: 0 }
                }
              }
            }),
            false,
            'completeLine_multiSegment'
          );
        } else {
          // Single segment, just confirm the current distance
          get().confirmLineDistance();
        }
      },

      clearAllLineSegments: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                segments: []
              }
            }
          }),
          false,
          'clearAllLineSegments'
        );
      },

      removeLastLineSegment: () => {
        set(
          state => {
            const { lineTool } = state.drawing;
            if (lineTool.segments.length === 0) {
              return state; // No segments to remove
            }

            const newSegments = lineTool.segments.slice(0, -1);

            // Update the start point for the next segment
            let newStartPoint = lineTool.startPoint;
            if (newSegments.length > 0) {
              // If there are remaining segments, start from the last segment's end point
              const lastSegment = newSegments[newSegments.length - 1];
              newStartPoint = lastSegment.endPoint;
            }

            return {
              drawing: {
                ...state.drawing,
                lineTool: {
                  ...lineTool,
                  segments: newSegments,
                  startPoint: newStartPoint,
                  // Clear current input to start fresh
                  inputValue: '',
                  currentDistance: null,
                  // Keep modal open if in multi-segment mode and we still have segments OR if we're starting fresh
                  isWaitingForInput: lineTool.isMultiSegment,
                  showInput: lineTool.isMultiSegment
                }
              }
            };
          },
          false,
          'removeLastLineSegment'
        );
      },

      toggleMultiSegmentMode: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                isMultiSegment: !state.drawing.lineTool.isMultiSegment
              }
            }
          }),
          false,
          'toggleMultiSegmentMode'
        );
      },

      enableMultiSegmentMode: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              lineTool: {
                ...state.drawing.lineTool,
                isMultiSegment: true
              }
            }
          }),
          false,
          'enableMultiSegmentMode'
        );
      },

      // Utility actions
      clearAll: () => {
        // Clear all text objects
        useTextStore.getState().clearTexts();

        set(
          state => {
            // Keep only the default shape (preserve it from deletion)
            const defaultShape = state.shapes.find(shape => shape.id === 'default-land-area');
            const preservedShapes = defaultShape ? [defaultShape] : [];

            // Keep only the default layer (preserve it from deletion)
            const defaultLayer = state.layers.find(layer => layer.id === 'default-layer');
            const preservedLayers = defaultLayer ? [defaultLayer] : [];

            return {
              shapes: preservedShapes,
              layers: preservedLayers,
              selectedShapeId: defaultShape?.id || null,
              hoveredShapeId: null,
              dragState: {
                isDragging: false,
                draggedShapeId: null,
                startPosition: null,
                currentPosition: null,
                originalShapePoints: null,
                originalShapesData: undefined,
              },
              activeLayerId: defaultLayer?.id || 'default-layer',
              drawing: getDefaultDrawingState(),
              measurements: {},
            };
          },
          false,
          'clearAll',
        );
      },

      exportShapes: () => {
        return get().shapes;
      },

      importShapes: (shapes: Shape[]) => {
        set({ shapes }, false, 'importShapes');
      },

      // Precision calculation actions
      calculateShapeMeasurements: (shapeId: string) => {
        const state = get();
        const shape = state.shapes.find(s => s.id === shapeId);
        if (!shape) return null;
        
        return precisionCalculator.calculateShapeMeasurements(shape);
      },

      getTotalArea: () => {
        const state = get();
        let totalArea = 0;

        state.shapes.forEach(shape => {
          // Exclude line shapes from total area calculation since lines don't have area
          if (shape.type !== 'line') {
            const measurements = precisionCalculator.calculateShapeMeasurements(shape);
            totalArea += parseFloat(measurements.area.squareMeters);
          }
        });

        return totalArea.toFixed(2);
      },

      getShapeCount: () => {
        const state = get();
        return state.shapes.length;
      },

      getAverageArea: () => {
        const state = get();

        // Count only shapes that have area (exclude lines)
        const shapesWithArea = state.shapes.filter(shape => shape.type !== 'line');
        if (shapesWithArea.length === 0) return '0.00';

        const totalArea = parseFloat(get().getTotalArea());
        const averageArea = totalArea / shapesWithArea.length;

        return averageArea.toFixed(2);
      },

      // Boolean operation actions
      unionShapes: (shapeIds: string[]) => {
        const state = get();
        const shapes = state.shapes.filter(shape => shapeIds.includes(shape.id));
        return booleanOperationEngine.union(shapes);
      },

      intersectShapes: (shapeIdA: string, shapeIdB: string) => {
        const state = get();
        const shapeA = state.shapes.find(s => s.id === shapeIdA);
        const shapeB = state.shapes.find(s => s.id === shapeIdB);
        
        if (!shapeA || !shapeB) {
          return {
            success: false,
            shapes: [],
            totalArea: '0',
            operation: 'intersection',
            timestamp: new Date()
          };
        }
        
        return booleanOperationEngine.intersection(shapeA, shapeB);
      },

      subtractShapes: (minuendId: string, subtrahendId: string) => {
        const state = get();
        const minuend = state.shapes.find(s => s.id === minuendId);
        const subtrahend = state.shapes.find(s => s.id === subtrahendId);
        
        if (!minuend || !subtrahend) {
          return {
            success: false,
            shapes: [],
            totalArea: '0',
            operation: 'difference',
            timestamp: new Date()
          };
        }
        
        return booleanOperationEngine.difference(minuend, subtrahend);
      },

      xorShapes: (shapeIdA: string, shapeIdB: string) => {
        const state = get();
        const shapeA = state.shapes.find(s => s.id === shapeIdA);
        const shapeB = state.shapes.find(s => s.id === shapeIdB);
        
        if (!shapeA || !shapeB) {
          return {
            success: false,
            shapes: [],
            totalArea: '0',
            operation: 'xor',
            timestamp: new Date()
          };
        }
        
        return booleanOperationEngine.exclusiveOr(shapeA, shapeB);
      },

      subdivideProperty: (shapeId: string, settings: SubdivisionSettings) => {
        const state = get();
        const shape = state.shapes.find(s => s.id === shapeId);
        
        if (!shape) {
          return {
            success: false,
            shapes: [],
            totalArea: '0',
            operation: 'subdivision',
            timestamp: new Date()
          };
        }
        
        return booleanOperationEngine.subdivideProperty(shape, settings);
      },

      addBooleanResults: (result: BooleanResult) => {
        if (result.success && result.shapes.length > 0) {
          set(
            state => ({
              shapes: [...state.shapes, ...result.shapes]
            }),
            false,
            'addBooleanResults'
          );
        }
      },

      // Professional export actions
      exportToExcel: async (options?: Partial<ExportOptions>) => {
        const state = get();
        const defaultOptions: ExportOptions = {
          format: 'excel',
          includeCalculations: true,
          coordinateSystem: 'local',
          units: 'metric',
          precision: 2
        };
        
        const exportOptions = { ...defaultOptions, ...options };
        return await professionalExportEngine.exportToExcel(state.shapes, exportOptions);
      },

      exportToDXF: async (options?: Partial<ExportOptions>) => {
        const state = get();
        const defaultOptions: ExportOptions = {
          format: 'dxf',
          includeCalculations: true,
          coordinateSystem: 'local',
          units: 'metric',
          precision: 3
        };
        
        const exportOptions = { ...defaultOptions, ...options };
        return await professionalExportEngine.exportToDXF(state.shapes, exportOptions);
      },

      exportToGeoJSON: async (options?: Partial<ExportOptions>) => {
        const state = get();
        const defaultOptions: ExportOptions = {
          format: 'geojson',
          includeCalculations: true,
          coordinateSystem: 'wgs84',
          units: 'metric',
          precision: 6
        };
        
        const exportOptions = { ...defaultOptions, ...options };
        return await professionalExportEngine.exportToGeoJSON(state.shapes, exportOptions);
      },

      exportToPDF: async (options?: Partial<ExportOptions>) => {
        const state = get();
        const defaultOptions: ExportOptions = {
          format: 'pdf',
          includeCalculations: true,
          coordinateSystem: 'local',
          units: 'metric',
          precision: 2
        };
        
        const exportOptions = { ...defaultOptions, ...options };
        return await professionalExportEngine.exportToPDF(state.shapes, exportOptions);
      },

      downloadExport: (result: ExportResult) => {
        if (result.success) {
          professionalExportEngine.downloadFile(result);
        }
      },

      // Universal cancel function (ESC key)
      cancelAll: () => {
        set(
          state => ({
            // Cancel any active drawing
            drawing: {
              ...state.drawing,
              isDrawing: false,
              currentShape: null,
              isEditMode: false,
              editingShapeId: null,
              selectedCornerIndex: null,
              isResizeMode: false,
              resizingShapeId: null,
              resizeHandleType: null,
              resizeHandleIndex: null,
              maintainAspectRatio: false,
              isRotateMode: false,
              rotatingShapeId: null,
              rotationStartAngle: 0,
              rotationCenter: null,
              originalRotation: null,
              activeTool: 'select', // Reset to select tool
              // Reset line tool state
              lineTool: {
                isActive: false,
                isDrawing: false,
                startPoint: null,
                inputValue: '',
                currentDistance: null,
                previewEndPoint: null,
                segments: state.drawing.lineTool.segments, // Keep existing segments
                isWaitingForInput: false,
                showInput: false,
                inputPosition: { x: 0, y: 0 },
                isMultiSegment: false
              }
            },
            // Clear selections and hover states
            selectedShapeId: null,
            hoveredShapeId: null,
            // Cancel any drag operations
            dragState: {
              isDragging: false,
              draggedShapeId: null,
              startPosition: null,
              currentPosition: null,
              originalShapePoints: null,
              originalShapesData: undefined,
            }
          }),
          false,
          'cancelAll - ESC key pressed'
        );
      },

      // Alignment and snapping system methods
      updateDrawingState: (updates: Partial<DrawingState>) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              ...updates
            }
          }),
          false,
          'updateDrawingState'
        );
      },

      setCursorPosition: (position: Point2D | null) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              cursorPosition: position
            }
          }),
          false,
          'setCursorPosition'
        );
      },

      updateSnapPoints: (snapPoints: SnapPoint[], activeSnapPoint: SnapPoint | null = null) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              snapping: {
                ...state.drawing.snapping,
                availableSnapPoints: snapPoints,
                activeSnapPoint
              }
            }
          }),
          false,
          'updateSnapPoints'
        );
      },

      setSnapping: (updates: Partial<DrawingState['snapping']>) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              snapping: {
                ...state.drawing.snapping,
                ...updates,
                config: {
                  ...state.drawing.snapping.config,
                  ...(updates.config || {}),
                },
              },
            },
          }),
          false,
          'setSnapping'
        );
      },

      setSnapMode: (mode: 'fixed' | 'adaptive') => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              snapping: {
                ...state.drawing.snapping,
                config: {
                  ...state.drawing.snapping.config,
                  mode,
                },
              },
            },
          }),
          false,
          'setSnapMode'
        );
      },

      setScreenSpacePixels: (pixels: number) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              snapping: {
                ...state.drawing.snapping,
                config: {
                  ...state.drawing.snapping.config,
                  screenSpacePixels: pixels,
                },
              },
            },
          }),
          false,
          'setScreenSpacePixels'
        );
      },

      updateAlignmentGuides: (guides: AlignmentGuide[], draggingShapeId: string | null = null) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              alignment: {
                ...state.drawing.alignment,
                activeGuides: guides,
                draggingShapeId
              }
            }
          }),
          false,
          'updateAlignmentGuides'
        );
      },

      updateAlignmentSpacings: (spacings: SpacingMeasurement[]) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              alignment: {
                ...state.drawing.alignment,
                activeSpacings: spacings
              }
            }
          }),
          false,
          'updateAlignmentSpacings'
        );
      },

      updateAlignmentSnapPosition: (snapPosition: { x: number; y: number } | null) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              alignment: {
                ...state.drawing.alignment,
                snapPosition
              }
            }
          }),
          false,
          'updateAlignmentSnapPosition'
        );
      },

      clearAlignmentGuides: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              alignment: {
                ...state.drawing.alignment,
                activeGuides: [],
                activeSpacings: [],
                draggingShapeId: null,
                snapPosition: null
              }
            }
          }),
          false,
          'clearAlignmentGuides'
        );
      },

      // Visual Comparison Tool actions
      toggleComparisonPanel: () => {
        set(
          state => ({
            comparison: {
              ...state.comparison,
              panelExpanded: !state.comparison.panelExpanded
            }
          }),
          false,
          'toggleComparisonPanel'
        );
      },

      toggleObjectVisibility: (objectId: string) => {
        set(
          state => {
            const newVisibleObjects = new Set(state.comparison.visibleObjects);
            if (newVisibleObjects.has(objectId)) {
              newVisibleObjects.delete(objectId);
            } else {
              newVisibleObjects.add(objectId);
            }

            return {
              comparison: {
                ...state.comparison,
                visibleObjects: newVisibleObjects
              }
            };
          },
          false,
          'toggleObjectVisibility'
        );

        // Trigger calculations after visibility change
        setTimeout(() => get().calculateComparisons(), 0);
      },

      setComparisonSearch: (query: string) => {
        set(
          state => ({
            comparison: {
              ...state.comparison,
              searchQuery: query
            }
          }),
          false,
          'setComparisonSearch'
        );
      },

      setComparisonCategory: (category: import('../types/referenceObjects').ReferenceCategory | 'all') => {
        set(
          state => ({
            comparison: {
              ...state.comparison,
              selectedCategory: category
            }
          }),
          false,
          'setComparisonCategory'
        );
      },

      calculateComparisons: async () => {
        const state = get();
        const { shapes, comparison } = state;

        // Don't calculate if no objects visible
        if (comparison.visibleObjects.size === 0) {
          set(
            state => ({
              comparison: {
                ...state.comparison,
                calculations: null
              }
            }),
            false,
            'calculateComparisons'
          );
          return;
        }

        // Import calculation utility
        const { ComparisonCalculator } = await import('../utils/comparisonCalculations');
        const { REFERENCE_OBJECTS } = await import('../data/referenceObjects');

        const visibleReferenceObjects = Array.from(comparison.visibleObjects)
          .map(id => REFERENCE_OBJECTS.find(obj => obj.id === id))
          .filter(Boolean);

        const calculations = ComparisonCalculator.calculate(shapes, visibleReferenceObjects);

        set(
          state => ({
            comparison: {
              ...state.comparison,
              calculations
            }
          }),
          false,
          'calculateComparisons'
        );
      },

      resetComparison: () => {
        set(
          state => ({
            comparison: {
              panelExpanded: false,
              visibleObjects: new Set(),
              searchQuery: '',
              selectedCategory: 'all',
              calculations: null
            }
          }),
          false,
          'resetComparison'
        );
      },

      // Unit Conversion Tool actions
      toggleConvertPanel: () => {
        set(
          state => ({
            conversion: {
              ...state.conversion,
              convertPanelExpanded: !state.conversion.convertPanelExpanded
            }
          }),
          false,
          'toggleConvertPanel'
        );
      },

      setInputValue: (value: string) => {
        set(
          state => ({
            conversion: {
              ...state.conversion,
              currentInputValue: value,
              inputError: null // Clear error when value changes
            }
          }),
          false,
          'setInputValue'
        );
      },

      setInputUnit: (unit: AreaUnit) => {
        set(
          state => ({
            conversion: {
              ...state.conversion,
              currentInputUnit: unit
            }
          }),
          false,
          'setInputUnit'
        );
      },

      clearConversion: () => {
        set(
          state => ({
            conversion: {
              ...state.conversion,
              currentInputValue: '',
              lastValidValue: null,
              inputError: null
            }
          }),
          false,
          'clearConversion'
        );
      },

      setInputError: (error: string | null) => {
        set(
          state => ({
            conversion: {
              ...state.conversion,
              inputError: error
            }
          }),
          false,
          'setInputError'
        );
      },

      // View Mode actions (2D/3D)
      setViewMode: (mode: '2D' | '3D') => {
        set(
          state => ({
            viewState: {
              ...state.viewState,
              is2DMode: mode === '2D',
              cameraType: mode === '2D' ? 'orthographic' : 'perspective',
              viewAngle: mode === '2D' ? 'top' : '3d'
            }
          }),
          false,
          'setViewMode'
        );
      },

      toggleViewMode: () => {
        set(
          state => {
            // Cycle through view modes: 2d → 3d-orbit → 2d
            // Note: Walkthrough mode is accessed via "3D World" button only
            const nextMode = (() => {
              switch (state.viewState.viewMode) {
                case '2d':
                  return '3d-orbit';
                case '3d-orbit':
                  return '2d';
                case '3d-walkthrough':
                  return '2d'; // Exit walkthrough back to 2D
                default:
                  return '3d-orbit';
              }
            })();

            // When entering walkthrough mode, position camera to see all shapes
            let walkthroughState = state.viewState.walkthroughState;
            if (nextMode === '3d-walkthrough' && state.shapes.length > 0) {
              // Calculate center of all shapes
              let minX = Infinity, maxX = -Infinity;
              let minZ = Infinity, maxZ = -Infinity;

              state.shapes.forEach(shape => {
                shape.points.forEach(point => {
                  minX = Math.min(minX, point.x);
                  maxX = Math.max(maxX, point.x);
                  minZ = Math.min(minZ, point.z || point.y || 0); // Handle 2D points
                  maxZ = Math.max(maxZ, point.z || point.y || 0); // Handle 2D points
                });
              });

              // Calculate center and offset camera to view the scene
              const centerX = (minX + maxX) / 2;
              const centerZ = (minZ + maxZ) / 2;
              const sceneWidth = maxX - minX;
              const sceneDepth = maxZ - minZ;

              console.log('[toggleViewMode] Scene bounds:', { minX, maxX, minZ, maxZ });
              console.log('[toggleViewMode] Scene center:', { centerX, centerZ });
              console.log('[toggleViewMode] Scene dimensions:', { sceneWidth, sceneDepth });

              // Position camera closer for first-person view (not overview distance)
              // For walkthrough, we want to be 10-20m back to see buildings clearly
              const offsetDistance = 15; // Fixed 15m distance for first-person view
              const cameraZ = centerZ + offsetDistance; // Behind the shapes
              const cameraY = 1.7; // Eye level

              console.log('[toggleViewMode] Camera position:', { x: centerX, y: cameraY, z: cameraZ });
              console.log('[toggleViewMode] Offset distance:', offsetDistance);

              walkthroughState = {
                ...walkthroughState!,
                position: { x: centerX, y: cameraY, z: cameraZ },
                rotation: { x: 0, y: 0 }, // Look down -Z axis (default forward direction)
                velocity: { x: 0, y: 0, z: 0 },
              };
            }

            return {
              viewState: {
                ...state.viewState,
                viewMode: nextMode,
                is2DMode: nextMode === '2d', // Keep for backward compatibility
                cameraType: nextMode === '2d' ? 'orthographic' : 'perspective',
                viewAngle: nextMode === '2d' ? 'top' : '3d',
                walkthroughState,
              }
            };
          },
          false,
          'toggleViewMode'
        );
      },

      setZoom2D: (zoom: number) => {
        set(
          state => ({
            viewState: {
              ...state.viewState,
              zoom2D: Math.max(0.1, Math.min(10, zoom))
            }
          }),
          false,
          'setZoom2D'
        );
      },

      saveCurrentView: () => {
        // This will be implemented when we have camera access
        // For now, just a placeholder
        set(
          state => ({
            viewState: {
              ...state.viewState,
              lastPerspectivePosition: { x: 0, y: 80, z: 80 },
              lastPerspectiveTarget: { x: 0, y: 0, z: 0 }
            }
          }),
          false,
          'saveCurrentView'
        );
      },

      restorePerspectiveView: () => {
        set(
          state => ({
            viewState: {
              ...state.viewState,
              is2DMode: false,
              cameraType: 'perspective',
              viewAngle: '3d'
            }
          }),
          false,
          'restorePerspectiveView'
        );
      },

      // Walkthrough mode state management
      updateWalkthroughPosition: (position: Point3D) => {
        set(
          state => ({
            viewState: {
              ...state.viewState,
              walkthroughState: {
                ...state.viewState.walkthroughState!,
                position
              }
            }
          }),
          false,
          'updateWalkthroughPosition'
        );
      },

      updateWalkthroughRotation: (rotation: { x: number; y: number }) => {
        set(
          state => ({
            viewState: {
              ...state.viewState,
              walkthroughState: {
                ...state.viewState.walkthroughState!,
                rotation
              }
            }
          }),
          false,
          'updateWalkthroughRotation'
        );
      },

      updateWalkthroughVelocity: (velocity: Point3D) => {
        set(
          state => ({
            viewState: {
              ...state.viewState,
              walkthroughState: {
                ...state.viewState.walkthroughState!,
                velocity
              }
            }
          }),
          false,
          'updateWalkthroughVelocity'
        );
      },

      setWalkthroughMoving: (isMoving: boolean) => {
        set(
          state => ({
            viewState: {
              ...state.viewState,
              walkthroughState: {
                ...state.viewState.walkthroughState!,
                isMoving
              }
            }
          }),
          false,
          'setWalkthroughMoving'
        );
      },

      setWalkthroughJumping: (isJumping: boolean) => {
        set(
          state => ({
            viewState: {
              ...state.viewState,
              walkthroughState: {
                ...state.viewState.walkthroughState!,
                isJumping
              }
            }
          }),
          false,
          'setWalkthroughJumping'
        );
      },

      toggleWalkthroughPerspective: () => {
        set(
          state => {
            const currentMode = state.viewState.walkthroughState?.perspectiveMode || 'first-person';
            const newMode = currentMode === 'first-person' ? 'third-person' : 'first-person';

            return {
              viewState: {
                ...state.viewState,
                walkthroughState: {
                  ...state.viewState.walkthroughState!,
                  perspectiveMode: newMode
                }
              }
            };
          },
          false,
          'toggleWalkthroughPerspective'
        );
      },

      setWalkthroughPointerLocked: (locked: boolean) => {
        set(
          state => ({
            viewState: {
              ...state.viewState,
              walkthroughState: {
                ...state.viewState.walkthroughState!,
                pointerLocked: locked
              }
            }
          }),
          false,
          'setWalkthroughPointerLocked'
        );
      },

      // Phase 1: Walkable boundary actions (AI Walkthrough Terrain Generation)
      addWalkableBoundary: (boundary) => {
        const id = `walkable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newBoundary: WalkableBoundary = {
          ...boundary,
          id,
          created: new Date(),
        };
        set(
          state => ({
            walkableBoundaries: [...state.walkableBoundaries, newBoundary],
            activeWalkableBoundaryId: id, // Auto-activate the new boundary
          }),
          false,
          'addWalkableBoundary'
        );
      },

      removeWalkableBoundary: (id) => {
        set(
          state => ({
            walkableBoundaries: state.walkableBoundaries.filter(b => b.id !== id),
            activeWalkableBoundaryId: state.activeWalkableBoundaryId === id ? null : state.activeWalkableBoundaryId,
          }),
          false,
          'removeWalkableBoundary'
        );
      },

      updateWalkableBoundary: (id, updates) => {
        set(
          state => ({
            walkableBoundaries: state.walkableBoundaries.map(b =>
              b.id === id ? { ...b, ...updates } : b
            ),
          }),
          false,
          'updateWalkableBoundary'
        );
      },

      clearWalkableBoundaries: () => {
        set(
          {
            walkableBoundaries: [],
            activeWalkableBoundaryId: null,
          },
          false,
          'clearWalkableBoundaries'
        );
      },

      getActiveWalkableBoundary: () => {
        const state = get();
        if (!state.activeWalkableBoundaryId) return null;
        return state.walkableBoundaries.find(b => b.id === state.activeWalkableBoundaryId) || null;
      },

      setActiveWalkableBoundaryId: (id) => {
        set(
          { activeWalkableBoundaryId: id },
          false,
          'setActiveWalkableBoundaryId'
        );
      },

      // Feature 017: Shift-key constraint mode
      setShiftKey: (pressed: boolean) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              isShiftKeyPressed: pressed
            }
          }),
          false,
          'setShiftKey'
        );
      },

      // Context menu actions
      openContextMenu: (type, position, targetShapeId) => {
        set(
          {
            contextMenu: {
              isOpen: true,
              type,
              position,
              targetShapeId: targetShapeId || null,
            },
          },
          false,
          'openContextMenu'
        );
      },

      closeContextMenu: () => {
        set(
          {
            contextMenu: {
              isOpen: false,
              type: null,
              position: { x: 0, y: 0 },
              targetShapeId: null,
            },
          },
          false,
          'closeContextMenu'
        );
      },


// Keyboard shortcuts - Shape manipulation
nudgeShape: (shapeId: string, direction: 'up' | 'down' | 'left' | 'right', distance: number) => {
  set(
    (state) => {
      const shape = state.shapes.find((s) => s.id === shapeId);
      if (!shape) return state;

      // Canva-style grouping: Check if nudging a grouped shape with other selected shapes
      const selectedIds = state.selectedShapeIds || [];
      const shapesToNudge = (shape.groupId && selectedIds.length > 1)
        ? selectedIds  // Nudge all selected shapes in group
        : [shapeId];   // Nudge single shape

      const nudgeVector: Point2D = {
        x: direction === 'right' ? distance : direction === 'left' ? -distance : 0,
        y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      };

      return {
        shapes: state.shapes.map((s) => {
          if (shapesToNudge.includes(s.id)) {
            const nudgedPoints = s.points.map((point) => ({
              x: point.x + nudgeVector.x,
              y: point.y + nudgeVector.y,
            }));

            // Also nudge rotation center if shape is rotated
            const nudgedRotation = s.rotation ? {
              ...s.rotation,
              center: {
                x: s.rotation.center.x + nudgeVector.x,
                y: s.rotation.center.y + nudgeVector.y,
              }
            } : undefined;

            return { ...s, points: nudgedPoints, rotation: nudgedRotation, modified: new Date() };
          }
          return s;
        }),
      };
    },
    false,
    'nudgeShape'
  );
  get().saveToHistory();
},

selectAllShapes: () => {
  set(
    (state) => ({
      selectedShapeIds: state.shapes.map((s) => s.id),
    }),
    false,
    'selectAllShapes'
  );
},

// Keyboard shortcuts - Grouping
groupShapes: () => {
  // Phase 4: Also handle text objects from useTextStore
  const { selectText: selectTextFn, updateText: updateTextFn, selectedTextId, texts } = useTextStore.getState();

  set(
    (state) => {
      // DEBUG: Log selection state before grouping
      logger.info('[groupShapes] Selection state:', {
        selectedShapeIds: state.selectedShapeIds,
        selectedTextId,
        totalShapes: state.shapes.length,
        totalTexts: texts.length
      });

      // First, get directly selected shapes
      const directlySelectedShapes = state.shapes.filter((s) =>
        state.selectedShapeIds.includes(s.id)
      );

      // Phase 4: Get selected text (if any)
      const selectedText = selectedTextId ? texts.find(t => t.id === selectedTextId) : null;

      logger.info('[groupShapes] Found elements:', {
        shapesCount: directlySelectedShapes.length,
        hasText: !!selectedText,
        textId: selectedText?.id
      });

      // Expand selection to include ALL shapes from any existing groups
      const existingGroupIds = new Set(
        directlySelectedShapes
          .filter(s => s.groupId)
          .map(s => s.groupId!)
      );

      // Phase 4: Also check text for existing group
      if (selectedText?.groupId) {
        existingGroupIds.add(selectedText.groupId);
      }

      // Get all shapes that should be grouped (selected + all from existing groups)
      const shapesToGroup = state.shapes.filter((s) =>
        state.selectedShapeIds.includes(s.id) ||
        (s.groupId && existingGroupIds.has(s.groupId))
      );

      // Phase 4: Get text objects that should be grouped
      const textsToGroup = texts.filter((t) =>
        (selectedTextId === t.id) ||
        (t.groupId && existingGroupIds.has(t.groupId))
      );

      // Phase 4: Need at least 2 elements total (shapes + text)
      const totalElements = shapesToGroup.length + textsToGroup.length;
      if (totalElements < 2) {
        logger.warn(`Cannot group: need at least 2 elements (found ${shapesToGroup.length} shapes + ${textsToGroup.length} text)`);
        return state;
      }

      // Generate unique group ID
      const groupId = `group_${Date.now()}`;

      // Assign groupId to all shapes (selected + from existing groups)
      const updatedShapes = state.shapes.map((s) =>
        shapesToGroup.some((sg) => sg.id === s.id)
          ? { ...s, groupId, modified: new Date() }
          : s
      );

      // Phase 4: Also assign groupId to text objects
      textsToGroup.forEach((text) => {
        updateTextFn(text.id, { groupId, updatedAt: Date.now() });
      });

      logger.info(`Grouped ${totalElements} elements (${shapesToGroup.length} shapes + ${textsToGroup.length} text) with ID: ${groupId}` +
        (existingGroupIds.size > 0 ? ` (merged ${existingGroupIds.size} existing group(s))` : ''));

      return {
        shapes: updatedShapes,
        // Update selection to include all grouped shapes
        selectedShapeIds: shapesToGroup.map(s => s.id),
      };
    },
    false,
    'groupShapes'
  );
  get().saveToHistory();
},

ungroupShapes: () => {
  // Phase 4: Also handle text objects from useTextStore
  const { selectText: selectTextFn, updateText: updateTextFn, selectedTextId, texts } = useTextStore.getState();

  set(
    (state) => {
      const shapesToUngroup = state.shapes.filter((s) =>
        state.selectedShapeIds.includes(s.id) && s.groupId
      );

      // Phase 4: Get selected text with groupId
      const selectedText = selectedTextId ? texts.find(t => t.id === selectedTextId && t.groupId) : null;

      // Phase 4: Check if we have any grouped elements to ungroup
      if (shapesToUngroup.length === 0 && !selectedText) {
        logger.warn('Cannot ungroup: no grouped elements selected');
        return state;
      }

      // Collect all group IDs to ungroup
      const groupIds = new Set(shapesToUngroup.map((s) => s.groupId));
      if (selectedText?.groupId) {
        groupIds.add(selectedText.groupId);
      }

      // Remove groupId from all selected shapes
      const updatedShapes = state.shapes.map((s) =>
        shapesToUngroup.some((su) => su.id === s.id)
          ? { ...s, groupId: undefined, modified: new Date() }
          : s
      );

      // Phase 4: Also remove groupId from all text objects in these groups
      texts.forEach((text) => {
        if (text.groupId && groupIds.has(text.groupId)) {
          updateTextFn(text.id, { groupId: undefined, updatedAt: Date.now() });
        }
      });

      logger.info(`Ungrouped ${groupIds.size} group(s)`);

      return {
        shapes: updatedShapes,
        // Keep shapes selected
        selectedShapeIds: state.selectedShapeIds,
      };
    },
    false,
    'ungroupShapes'
  );
  get().saveToHistory();
},

// Keyboard shortcuts - Alignment
alignShapesLeft: (shapeIds: string[]) => {
  set(
    (state) => {
      const shapesToAlign = state.shapes.filter((s) => shapeIds.includes(s.id));
      if (shapesToAlign.length < 2) return state;

      // Find leftmost x coordinate
      const minX = Math.min(...shapesToAlign.flatMap((s) => s.points.map((p) => p.x)));

      return {
        shapes: state.shapes.map((shape) => {
          if (!shapeIds.includes(shape.id)) return shape;

          const currentMinX = Math.min(...shape.points.map((p) => p.x));
          const offsetX = minX - currentMinX;

          return {
            ...shape,
            points: shape.points.map((p) => ({ x: p.x + offsetX, y: p.y })),
            modified: new Date(),
          };
        }),
      };
    },
    false,
    'alignShapesLeft'
  );
  get().saveToHistory();
},

alignShapesRight: (shapeIds: string[]) => {
  set(
    (state) => {
      const shapesToAlign = state.shapes.filter((s) => shapeIds.includes(s.id));
      if (shapesToAlign.length < 2) return state;

      // Find rightmost x coordinate
      const maxX = Math.max(...shapesToAlign.flatMap((s) => s.points.map((p) => p.x)));

      return {
        shapes: state.shapes.map((shape) => {
          if (!shapeIds.includes(shape.id)) return shape;

          const currentMaxX = Math.max(...shape.points.map((p) => p.x));
          const offsetX = maxX - currentMaxX;

          return {
            ...shape,
            points: shape.points.map((p) => ({ x: p.x + offsetX, y: p.y })),
            modified: new Date(),
          };
        }),
      };
    },
    false,
    'alignShapesRight'
  );
  get().saveToHistory();
},

alignShapesTop: (shapeIds: string[]) => {
  set(
    (state) => {
      const shapesToAlign = state.shapes.filter((s) => shapeIds.includes(s.id));
      if (shapesToAlign.length < 2) return state;

      // Find topmost y coordinate (highest value in 3D space)
      const maxY = Math.max(...shapesToAlign.flatMap((s) => s.points.map((p) => p.y)));

      return {
        shapes: state.shapes.map((shape) => {
          if (!shapeIds.includes(shape.id)) return shape;

          const currentMaxY = Math.max(...shape.points.map((p) => p.y));
          const offsetY = maxY - currentMaxY;

          return {
            ...shape,
            points: shape.points.map((p) => ({ x: p.x, y: p.y + offsetY })),
            modified: new Date(),
          };
        }),
      };
    },
    false,
    'alignShapesTop'
  );
  get().saveToHistory();
},

alignShapesBottom: (shapeIds: string[]) => {
  set(
    (state) => {
      const shapesToAlign = state.shapes.filter((s) => shapeIds.includes(s.id));
      if (shapesToAlign.length < 2) return state;

      // Find bottommost y coordinate (lowest value in 3D space)
      const minY = Math.min(...shapesToAlign.flatMap((s) => s.points.map((p) => p.y)));

      return {
        shapes: state.shapes.map((shape) => {
          if (!shapeIds.includes(shape.id)) return shape;

          const currentMinY = Math.min(...shape.points.map((p) => p.y));
          const offsetY = minY - currentMinY;

          return {
            ...shape,
            points: shape.points.map((p) => ({ x: p.x, y: p.y + offsetY })),
            modified: new Date(),
          };
        }),
      };
    },
    false,
    'alignShapesBottom'
  );
  get().saveToHistory();
},

alignShapesCenter: (shapeIds: string[]) => {
  set(
    (state) => {
      const shapesToAlign = state.shapes.filter((s) => shapeIds.includes(s.id));
      if (shapesToAlign.length < 2) return state;

      // Calculate center x of all shapes
      const allPoints = shapesToAlign.flatMap((s) => s.points);
      const minX = Math.min(...allPoints.map((p) => p.x));
      const maxX = Math.max(...allPoints.map((p) => p.x));
      const centerX = (minX + maxX) / 2;

      return {
        shapes: state.shapes.map((shape) => {
          if (!shapeIds.includes(shape.id)) return shape;

          const shapeMinX = Math.min(...shape.points.map((p) => p.x));
          const shapeMaxX = Math.max(...shape.points.map((p) => p.x));
          const shapeCenterX = (shapeMinX + shapeMaxX) / 2;
          const offsetX = centerX - shapeCenterX;

          return {
            ...shape,
            points: shape.points.map((p) => ({ x: p.x + offsetX, y: p.y })),
            modified: new Date(),
          };
        }),
      };
    },
    false,
    'alignShapesCenter'
  );
  get().saveToHistory();
},

alignShapesMiddle: (shapeIds: string[]) => {
  set(
    (state) => {
      const shapesToAlign = state.shapes.filter((s) => shapeIds.includes(s.id));
      if (shapesToAlign.length < 2) return state;

      // Calculate middle y of all shapes
      const allPoints = shapesToAlign.flatMap((s) => s.points);
      const minY = Math.min(...allPoints.map((p) => p.y));
      const maxY = Math.max(...allPoints.map((p) => p.y));
      const middleY = (minY + maxY) / 2;

      return {
        shapes: state.shapes.map((shape) => {
          if (!shapeIds.includes(shape.id)) return shape;

          const shapeMinY = Math.min(...shape.points.map((p) => p.y));
          const shapeMaxY = Math.max(...shape.points.map((p) => p.y));
          const shapeMiddleY = (shapeMinY + shapeMaxY) / 2;
          const offsetY = middleY - shapeMiddleY;

          return {
            ...shape,
            points: shape.points.map((p) => ({ x: p.x, y: p.y + offsetY })),
            modified: new Date(),
          };
        }),
      };
    },
    false,
    'alignShapesMiddle'
  );
  get().saveToHistory();
},

// Keyboard shortcuts - Distribution
distributeShapesHorizontally: (shapeIds: string[]) => {
  set(
    (state) => {
      const shapesToDistribute = state.shapes.filter((s) => shapeIds.includes(s.id));
      if (shapesToDistribute.length < 3) return state;

      // Sort shapes by their center x position
      const shapesWithCenters = shapesToDistribute.map((shape) => {
        const minX = Math.min(...shape.points.map((p) => p.x));
        const maxX = Math.max(...shape.points.map((p) => p.x));
        const centerX = (minX + maxX) / 2;
        return { shape, centerX };
      });
      shapesWithCenters.sort((a, b) => a.centerX - b.centerX);

      // Calculate even spacing
      const firstCenterX = shapesWithCenters[0].centerX;
      const lastCenterX = shapesWithCenters[shapesWithCenters.length - 1].centerX;
      const totalDistance = lastCenterX - firstCenterX;
      const spacing = totalDistance / (shapesWithCenters.length - 1);

      return {
        shapes: state.shapes.map((shape) => {
          const index = shapesWithCenters.findIndex((s) => s.shape.id === shape.id);
          if (index === -1 || index === 0 || index === shapesWithCenters.length - 1) return shape;

          const targetCenterX = firstCenterX + index * spacing;
          const currentCenterX = shapesWithCenters[index].centerX;
          const offsetX = targetCenterX - currentCenterX;

          return {
            ...shape,
            points: shape.points.map((p) => ({ x: p.x + offsetX, y: p.y })),
            modified: new Date(),
          };
        }),
      };
    },
    false,
    'distributeShapesHorizontally'
  );
  get().saveToHistory();
},

distributeShapesVertically: (shapeIds: string[]) => {
  set(
    (state) => {
      const shapesToDistribute = state.shapes.filter((s) => shapeIds.includes(s.id));
      if (shapesToDistribute.length < 3) return state;

      // Sort shapes by their center y position
      const shapesWithCenters = shapesToDistribute.map((shape) => {
        const minY = Math.min(...shape.points.map((p) => p.y));
        const maxY = Math.max(...shape.points.map((p) => p.y));
        const centerY = (minY + maxY) / 2;
        return { shape, centerY };
      });
      shapesWithCenters.sort((a, b) => a.centerY - b.centerY);

      // Calculate even spacing
      const firstCenterY = shapesWithCenters[0].centerY;
      const lastCenterY = shapesWithCenters[shapesWithCenters.length - 1].centerY;
      const totalDistance = lastCenterY - firstCenterY;
      const spacing = totalDistance / (shapesWithCenters.length - 1);

      return {
        shapes: state.shapes.map((shape) => {
          const index = shapesWithCenters.findIndex((s) => s.shape.id === shape.id);
          if (index === -1 || index === 0 || index === shapesWithCenters.length - 1) return shape;

          const targetCenterY = firstCenterY + index * spacing;
          const currentCenterY = shapesWithCenters[index].centerY;
          const offsetY = targetCenterY - currentCenterY;

          return {
            ...shape,
            points: shape.points.map((p) => ({ x: p.x, y: p.y + offsetY })),
            modified: new Date(),
          };
        }),
      };
    },
    false,
    'distributeShapesVertically'
  );
  get().saveToHistory();
},

// Keyboard shortcuts - Z-order
bringShapeToFront: (shapeId: string) => {
  set(
    (state) => {
      const shapeIndex = state.shapes.findIndex((s) => s.id === shapeId);
      if (shapeIndex === -1 || shapeIndex === state.shapes.length - 1) return state;

      const shape = state.shapes[shapeIndex];
      const newShapes = [...state.shapes];
      newShapes.splice(shapeIndex, 1);
      newShapes.push(shape);

      return { shapes: newShapes };
    },
    false,
    'bringShapeToFront'
  );
  get().saveToHistory();
},

sendShapeToBack: (shapeId: string) => {
  set(
    (state) => {
      const shapeIndex = state.shapes.findIndex((s) => s.id === shapeId);
      if (shapeIndex === -1 || shapeIndex === 0) return state;

      const shape = state.shapes[shapeIndex];
      const newShapes = [...state.shapes];
      newShapes.splice(shapeIndex, 1);
      newShapes.unshift(shape);

      return { shapes: newShapes };
    },
    false,
    'sendShapeToBack'
  );
  get().saveToHistory();
},

bringShapeForward: (shapeId: string) => {
  set(
    (state) => {
      const shapeIndex = state.shapes.findIndex((s) => s.id === shapeId);
      if (shapeIndex === -1 || shapeIndex === state.shapes.length - 1) return state;

      const shape = state.shapes[shapeIndex];
      const newShapes = [...state.shapes];
      newShapes.splice(shapeIndex, 1);
      newShapes.splice(shapeIndex + 1, 0, shape);

      return { shapes: newShapes };
    },
    false,
    'bringShapeForward'
  );
  get().saveToHistory();
},

sendShapeBackward: (shapeId: string) => {
  set(
    (state) => {
      const shapeIndex = state.shapes.findIndex((s) => s.id === shapeId);
      if (shapeIndex === -1 || shapeIndex === 0) return state;

      const shape = state.shapes[shapeIndex];
      const newShapes = [...state.shapes];
      newShapes.splice(shapeIndex, 1);
      newShapes.splice(shapeIndex - 1, 0, shape);

      return { shapes: newShapes };
    },
    false,
    'sendShapeBackward'
  );
  get().saveToHistory();
},

      // ============================================================
      // ELEMENT MANAGEMENT (Unified System for Shapes + Text)
      // ============================================================

      /**
       * Add a new element to the unified elements array
       * Automatically generates ID and timestamps
       * Dual-writes to legacy stores (shapes or text) for backward compatibility
       */
      addElement: (element) => {
        const id = generateId();
        const now = new Date();
        const newElement = {
          ...element,
          id,
          created: now,
          modified: now,
        } as import('../types').Element;

        set((state) => ({
          elements: [...state.elements, newElement],
        }), false, 'addElement');

        // Dual-write to legacy stores
        if (newElement.elementType === 'shape') {
          const shapeElement = newElement as import('../types').ShapeElement;
          const legacyShape: Shape = {
            id: shapeElement.id,
            type: shapeElement.type,
            points: shapeElement.points,
            center: shapeElement.center,
            rotation: shapeElement.rotation,
            layerId: shapeElement.layerId,
            visible: shapeElement.visible,
            locked: shapeElement.locked,
            groupId: shapeElement.groupId,
            created: shapeElement.created,
            modified: shapeElement.modified,
            name: shapeElement.name,
          };
          set((state) => ({
            shapes: [...state.shapes, legacyShape],
          }), false, 'addElement:legacyShape');
        } else if (newElement.elementType === 'text') {
          const textElement = newElement as import('../types').TextElement;
          const legacyText: import('../types/text').TextObject = {
            id: textElement.id,
            type: 'floating',
            content: textElement.content,
            position: {
              x: textElement.position.x,
              y: textElement.position.y,
              z: textElement.z,
            },
            fontFamily: textElement.fontFamily,
            fontSize: textElement.fontSize,
            color: textElement.color,
            alignment: textElement.alignment,
            opacity: textElement.opacity || 1,
            bold: textElement.bold || false,
            italic: textElement.italic || false,
            underline: textElement.underline || false,
            uppercase: textElement.uppercase || false,
            letterSpacing: textElement.letterSpacing || 0,
            lineHeight: textElement.lineHeight || 1.2,
            backgroundOpacity: textElement.backgroundOpacity || 100,
            rotation: textElement.rotation,
            layerId: textElement.layerId,
            locked: textElement.locked,
            visible: textElement.visible,
            createdAt: textElement.created.getTime(),
            updatedAt: textElement.modified.getTime(),
          };
          import('../store/useTextStore').useTextStore.getState().addText(legacyText);
        }

        return newElement;
      },

      /**
       * Update an existing element
       * Syncs to legacy stores
       */
      updateElement: (id, updates) => {
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id
              ? { ...el, ...updates, modified: new Date() }
              : el
          ),
        }), false, 'updateElement');

        // Dual-write to legacy stores
        const element = get().elements.find(el => el.id === id);
        if (!element) return;

        if (element.elementType === 'shape') {
          get().updateShape(id, updates as Partial<Shape>);
        } else if (element.elementType === 'text') {
          import('../store/useTextStore').useTextStore.getState().updateText(id, updates as Partial<import('../types/text').TextObject>);
        }
      },

      /**
       * Delete an element by ID
       * Syncs to legacy stores and updates selection
       */
      deleteElement: (id) => {
        const element = get().elements.find(el => el.id === id);

        set((state) => ({
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementIds: state.selectedElementIds.filter((elId) => elId !== id),
          hoveredElementId: state.hoveredElementId === id ? null : state.hoveredElementId,
        }), false, 'deleteElement');

        // Dual-write to legacy stores
        if (element?.elementType === 'shape') {
          get().deleteShape(id);
        } else if (element?.elementType === 'text') {
          // Direct deletion from useTextStore without triggering deleteElement again
          import('../store/useTextStore').useTextStore.setState((state) => ({
            texts: state.texts.filter((t) => t.id !== id),
            selectedTextId: state.selectedTextId === id ? null : state.selectedTextId,
          }));
        }
      },

      /**
       * Delete multiple elements at once
       */
      deleteElements: (ids) => {
        ids.forEach((id) => get().deleteElement(id));
      },

      /**
       * Select a single element (or clear with null)
       */
      selectElement: (id) => {
        set(() => ({
          selectedElementIds: id ? [id] : [],
        }), false, 'selectElement');

        // Dual-write to legacy stores
        const element = id ? get().elements.find(el => el.id === id) : null;

        if (element?.elementType === 'shape') {
          get().selectShape(id);
        } else if (element?.elementType === 'text') {
          import('../store/useTextStore').then(module => {
            module.useTextStore.getState().selectText(id);
          });
        } else {
          // Clearing selection
          get().selectShape(null);
          import('../store/useTextStore').then(module => {
            module.useTextStore.getState().selectText(null);
          });
        }
      },

      /**
       * Select multiple elements
       */
      selectMultipleElements: (ids) => {
        set(() => ({
          selectedElementIds: ids,
        }), false, 'selectMultipleElements');

        // Dual-write to legacy stores
        const shapeIds = ids.filter((id) => {
          const element = get().elements.find(el => el.id === id);
          return element?.elementType === 'shape';
        });
        get().selectMultipleShapes(shapeIds);
      },

      /**
       * Toggle element selection (for shift-click)
       */
      toggleElementSelection: (id) => {
        set((state) => {
          const isSelected = state.selectedElementIds.includes(id);
          return {
            selectedElementIds: isSelected
              ? state.selectedElementIds.filter((elId) => elId !== id)
              : [...state.selectedElementIds, id],
          };
        }, false, 'toggleElementSelection');
      },

      /**
       * Clear all element selection
       */
      clearElementSelection: () => {
        set(() => ({
          selectedElementIds: [],
        }), false, 'clearElementSelection');

        // Dual-write to legacy stores
        get().selectShape(null);
        import('../store/useTextStore').useTextStore.getState().selectText(null);
      },

      /**
       * Set hovered element
       */
      hoverElement: (id) => {
        set(() => ({
          hoveredElementId: id,
        }), false, 'hoverElement');

        // Dual-write to legacy stores
        const element = id ? get().elements.find(el => el.id === id) : null;
        if (element?.elementType === 'shape') {
          get().hoverShape(id);
        }
      },

      /**
       * Get element by ID
       */
      getElementById: (id) => {
        return get().elements.find((el) => el.id === id);
      },

      /**
       * Get all elements in a layer
       */
      getElementsByLayer: (layerId) => {
        return get().elements.filter((el) => el.layerId === layerId);
      },

      /**
       * Get all elements in a group
       */
      getElementsByGroup: (groupId) => {
        return get().elements.filter((el) => el.groupId === groupId);
      },

      /**
       * Get all selected elements
       */
      getSelectedElements: () => {
        const { elements, selectedElementIds } = get();
        return elements.filter((el) => selectedElementIds.includes(el.id));
      },

      /**
       * Get all visible elements
       */
      getVisibleElements: () => {
        return get().elements.filter((el) => el.visible === true);
      },

      /**
       * Group selected elements
       */
      groupSelectedElements: () => {
        const { selectedElementIds, elements } = get();
        const selectedElements = elements.filter((el) => selectedElementIds.includes(el.id));

        // Filter out locked elements
        const unlocked = selectedElements.filter((el) => !el.locked);

        if (unlocked.length < 2) {
          logger.warn('[Store] Cannot group: need at least 2 unlocked elements');
          return;
        }

        const groupId = `group_${Date.now()}`;

        set((state) => ({
          elements: state.elements.map((el) =>
            unlocked.some((selected) => selected.id === el.id)
              ? { ...el, groupId, modified: new Date() }
              : el
          ),
        }), false, 'groupSelectedElements');

        logger.info(`[Store] Grouped ${unlocked.length} elements with ID: ${groupId}`);
      },

      /**
       * Ungroup selected elements
       */
      ungroupSelectedElements: () => {
        const { selectedElementIds, elements } = get();
        const selectedElements = elements.filter((el) => selectedElementIds.includes(el.id));

        const groupIds = new Set(
          selectedElements.filter((el) => el.groupId).map((el) => el.groupId!)
        );

        if (groupIds.size === 0) {
          logger.warn('[Store] No groups to ungroup');
          return;
        }

        set((state) => ({
          elements: state.elements.map((el) =>
            groupIds.has(el.groupId || '')
              ? { ...el, groupId: undefined, modified: new Date() }
              : el
          ),
        }), false, 'ungroupSelectedElements');

        logger.info(`[Store] Ungrouped ${groupIds.size} group(s)`);
      },

      /**
       * Run migration from legacy stores to unified elements
       */
      runMigration: () => {
        const migrated = localStorage.getItem('land-viz:elements-migrated');
        if (migrated === 'true') {
          logger.info('[Store] Migration already completed, skipping');
          return;
        }

        logger.info('[Store] Running migration: shapes + texts → elements');

        const { shapes } = get();
        const { texts } = import('../store/useTextStore').useTextStore.getState();

        // Backup before migration
        localStorage.setItem('land-viz:migration-backup:shapes', JSON.stringify(shapes));
        localStorage.setItem('land-viz:migration-backup:texts', JSON.stringify(texts));

        const migratedElements: import('../types').Element[] = [];

        // Migrate shapes
        shapes.forEach((shape) => {
          const shapeElement: import('../types').ShapeElement = {
            id: shape.id,
            elementType: 'shape',
            type: shape.type,
            points: shape.points,
            center: shape.center,
            rotation: shape.rotation,
            layerId: shape.layerId,
            visible: shape.visible,
            locked: shape.locked || false,
            groupId: shape.groupId,
            name: shape.name,
            created: shape.created,
            modified: shape.modified,
          };
          migratedElements.push(shapeElement);
        });

        // Migrate texts
        texts.forEach((text) => {
          const textElement: import('../types').TextElement = {
            id: text.id,
            elementType: 'text',
            content: text.content,
            position: { x: text.position.x, y: text.position.y },
            z: text.position.z,
            fontSize: text.fontSize,
            fontFamily: text.fontFamily,
            color: text.color,
            alignment: text.alignment,
            opacity: text.opacity,
            bold: text.bold,
            italic: text.italic,
            underline: text.underline,
            uppercase: text.uppercase,
            letterSpacing: text.letterSpacing,
            lineHeight: text.lineHeight,
            backgroundOpacity: text.backgroundOpacity,
            rotation: text.rotation,
            layerId: text.layerId,
            visible: text.visible,
            locked: text.locked,
            name: `Text: ${text.content.substring(0, 20)}${text.content.length > 20 ? '...' : ''}`,
            created: new Date(text.createdAt),
            modified: new Date(text.updatedAt),
          };
          migratedElements.push(textElement);
        });

        set(() => ({
          elements: migratedElements,
        }), false, 'runMigration');

        localStorage.setItem('land-viz:elements-migrated', 'true');
        logger.info(`[Store] Migration complete: ${migratedElements.length} elements created`);
      },

      /**
       * Rollback migration to legacy stores
       */
      rollbackMigration: () => {
        logger.warn('[Store] Rolling back migration');

        const shapesBackup = localStorage.getItem('land-viz:migration-backup:shapes');
        const textsBackup = localStorage.getItem('land-viz:migration-backup:texts');

        if (shapesBackup) {
          set(() => ({
            shapes: JSON.parse(shapesBackup),
          }), false, 'rollbackMigration:shapes');
        }

        if (textsBackup) {
          import('../store/useTextStore').useTextStore.setState({
            texts: JSON.parse(textsBackup),
          });
        }

        set(() => ({
          elements: [],
        }), false, 'rollbackMigration:elements');

        localStorage.removeItem('land-viz:elements-migrated');
        logger.info('[Store] Migration rolled back successfully');
      },
    }),
    {
      name: 'land-visualizer-store',
    },
  ),
);
