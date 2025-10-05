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
import { convertToSquareMeters, calculateGridAwareDimensions, getUnitLabel, calculateSmartGridPosition, generateShapeFromArea } from '../utils/areaCalculations';
import { SimpleAlignment, type SpacingMeasurement } from '../services/simpleAlignment';
import { SnapGrid } from '../utils/SnapGrid';
import { MeasurementUtils, MEASUREMENT_CONSTANTS } from '../utils/measurementUtils';
import { calculateDirection, applyDistance, parseDistance } from '../utils/precisionMath';
import { defaultAreaPresets } from '../data/areaPresets';
import { loadCustomPresets, saveCustomPresets } from '../utils/presetStorage';
import type { AppState, Shape, Layer, DrawingTool, Point2D, ShapeType, DrawingState, SnapPoint, SnapType, AlignmentGuide, AreaUnit, AddAreaConfig, Measurement, MeasurementPoint, MeasurementState, LineSegment } from '../types';
import type { AreaPreset, PresetsState, PresetCategory } from '../types/presets';
import type { ConversionActions } from '../types/conversion';

interface AppStore extends AppState {
  // Layer actions
  createLayer: (name: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  moveShapeToLayer: (shapeId: string, layerId: string) => void;
  moveLayerToFront: (layerId: string) => void;
  moveLayerForward: (layerId: string) => void;
  moveLayerBackward: (layerId: string) => void;
  moveLayerToBack: (layerId: string) => void;
  
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

  // Shape actions
  addShape: (shape: Omit<Shape, 'id' | 'created' | 'modified'>) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  selectMultipleShapes: (ids: string[]) => void;
  toggleShapeSelection: (id: string) => void;
  clearSelection: () => void;
  hoverShape: (id: string | null) => void;
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

  // Rotation mode actions (only available in 'select' mode)
  enterRotateMode: (shapeId: string) => void;
  exitRotateMode: () => void;
  rotateShapeLive: (shapeId: string, angle: number, center: Point2D) => void;
  rotateShape: (shapeId: string, angle: number, center: Point2D) => void;

  // Cursor rotation mode actions (hover-to-rotate mode)
  enterCursorRotationMode: (shapeId: string) => void;
  exitCursorRotationMode: () => void;
  applyCursorRotation: (shapeId: string, angle: number, center: Point2D) => void;

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

  // View Mode actions (2D/3D)
  setViewMode: (mode: '2D' | '3D') => void;
  toggleViewMode: () => void;
  setZoom2D: (zoom: number) => void;
  saveCurrentView: () => void;
  restorePerspectiveView: () => void;

  // Task 4.2: Shift key override for snapping
  setShiftKey: (pressed: boolean) => void;
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
      snapRadius: 15,
      mode: 'adaptive',  // Default to adaptive mode for better UX
      screenSpacePixels: 75,  // Default screen-space distance (75px)
      activeTypes: new Set(['grid']),
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
  }
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
  const defaultShape = createDefaultShape();
  const baseState = {
    shapes: [defaultShape],
    layers: [defaultLayer],
    selectedShapeId: null, // Don't auto-select default shape on page load
    selectedShapeIds: [] as string[], // For multi-selection support
    hoveredShapeId: null,
    dragState: {
      isDragging: false,
      draggedShapeId: null,
      startPosition: null,
      currentPosition: null,
      originalShapePoints: null,
    },
    activeLayerId: defaultLayer.id,
    drawing: getDefaultDrawingState(),
    measurements: {},
    history: {
      past: [],
      present: '',
      future: [],
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
    },
    shiftKeyPressed: false, // Task 4.2: Shift key state for disabling snapping
  };
  
  // Set the present state to JSON representation of the base state
  baseState.history.present = JSON.stringify({
    shapes: baseState.shapes,
    layers: baseState.layers,
    selectedShapeId: baseState.selectedShapeId,
    selectedShapeIds: baseState.selectedShapeIds,
    hoveredShapeId: baseState.hoveredShapeId,
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
            } else if (measurements.area) {
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
              selectedShapeId: newShape.id
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
        get().saveToHistory(); // Save state before adding shape

        const newShape: Shape = {
          id: generateId(),
          created: new Date(),
          modified: new Date(),
          ...shape,
        };

        set(
          state => ({
            shapes: [...state.shapes, newShape],
          }),
          false,
          'addShape',
        );
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

        // Find the default land area shape (main square)
        const defaultShapeId = 'default-land-area';
        const defaultShapeExists = state.shapes.some(shape => shape.id === defaultShapeId);

        if (defaultShapeExists) {
          // Replace the default main square
          set(
            state => ({
              shapes: state.shapes.map(shape =>
                shape.id === defaultShapeId
                  ? {
                      ...shape,
                      name: `Land Area ${area} ${getUnitLabel(unit)}`,
                      points: finalPoints,
                      modified: new Date()
                    }
                  : shape
              ),
              selectedShapeId: defaultShapeId,
              drawing: {
                ...state.drawing,
                activeTool: 'select'
              }
            }),
            false,
            'createShapeFromArea',
          );

          // Invalidate geometry cache for visual update
          const updatedShape = get().shapes.find(shape => shape.id === defaultShapeId);
          if (updatedShape) {
            GeometryCache.invalidateShape(updatedShape);
            get().triggerRender(); // Force immediate re-render
          }
        } else {
          // If default shape doesn't exist, replace the first shape or create a new one
          if (state.shapes.length > 0) {
            // Replace the first shape
            const firstShapeId = state.shapes[0].id;
            set(
              state => ({
                shapes: state.shapes.map((shape, index) =>
                  index === 0
                    ? {
                        ...shape,
                        name: `Land Area ${area} ${getUnitLabel(unit)}`,
                        points: finalPoints,
                        type: 'rectangle' as const,
                        modified: new Date()
                      }
                    : shape
                ),
                selectedShapeId: firstShapeId,
                drawing: {
                  ...state.drawing,
                  activeTool: 'select'
                }
              }),
              false,
              'createShapeFromArea',
            );

            // Invalidate geometry cache for visual update
            const updatedShape = get().shapes.find(shape => shape.id === firstShapeId);
            if (updatedShape) {
              GeometryCache.invalidateShape(updatedShape);
              get().triggerRender(); // Force immediate re-render
            }
          } else {
            // No shapes exist, create a new one
            const newShape: Shape = {
              id: 'default-land-area',
              name: `Land Area ${area} ${getUnitLabel(unit)}`,
              points: finalPoints,
              type: 'rectangle',
              color: '#3B82F6',
              visible: true,
              layerId: state.activeLayerId,
              created: new Date(),
              modified: new Date()
            };

            set(
              state => ({
                shapes: [newShape],
                selectedShapeId: newShape.id,
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
          }
        }
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
        
        set(
          state => ({
            shapes: state.shapes.filter(shape => shape.id !== id),
            selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
          }),
          false,
          'deleteShape',
        );
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

          return {
            selectedShapeIds: newIds,
            selectedShapeId: newIds.length === 1 ? newIds[0] : null,
          };
        }, false, 'toggleShapeSelection');
      },

      clearSelection: () => {
        set({
          selectedShapeId: null,
          selectedShapeIds: [],
        }, false, 'clearSelection');
      },

      hoverShape: (id: string | null) => {
        set({ hoveredShapeId: id }, false, 'hoverShape');
      },

      // Drag actions
      startDragging: (shapeId: string, startPosition: Point2D) => {
        const state = get();
        const shape = state.shapes.find(s => s.id === shapeId);

        // Set alignment to active
        // const alignmentStore = useAlignmentStore.getState();
        // alignmentStore.setIsAligning(true);
        
        // Store the current shape points as they are (may include rotation already applied)
        const currentPoints = shape?.points ? [...shape.points] : null;
        
        set({
          dragState: {
            isDragging: true,
            draggedShapeId: shapeId,
            startPosition,
            currentPosition: startPosition,
            originalShapePoints: currentPoints,
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

        // Step 1: Immediately update drag position (smooth cursor tracking)
        set({
          dragState: {
            ...state.dragState,
            currentPosition: currentPosition,
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
              const offsetX = latestPosition.x - currentState.dragState.startPosition.x;
              const offsetY = latestPosition.y - currentState.dragState.startPosition.y;

              const tempShape = {
                ...draggedShape,
                points: currentState.dragState.originalShapePoints.map(p => ({
                  x: p.x + offsetX,
                  y: p.y + offsetY
                }))
              };

              const otherShapes = currentState.shapes.filter(s => s.id !== currentState.dragState.draggedShapeId);

              // Edge Snap Detection (visual indicators only, no position correction during drag)
              const snapConfig = currentState.drawing.snapping?.config;
              const snapActive = snapConfig?.enabled && !currentState.shiftKeyPressed;
              let snapDetectionResults = null;

              if (snapActive) {
                const dragSnapRadius = 2;
                dragSnapGrid.setSnapDistance(dragSnapRadius);

                // FIX: Use tempShape center for snap detection, not just cursor position
                // Calculate center of the dragged shape at current position
                const bounds = SimpleAlignment.getShapeBounds(tempShape);
                const shapeCenter = { x: bounds.centerX, y: bounds.centerY };

                dragSnapGrid.updateSnapPoints(otherShapes, shapeCenter);

                const nearbySnapPoints = dragSnapGrid.findSnapPointsInRadius(shapeCenter, dragSnapRadius);
                const filteredSnapPoints = nearbySnapPoints.filter(snap =>
                  snapConfig.activeTypes?.has?.(snap.type)
                );

                const nearestSnapPoint = dragSnapGrid.findNearestSnapPoint(shapeCenter, dragSnapRadius);

                snapDetectionResults = {
                  filteredSnapPoints,
                  activeSnapPoint: nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type) ? nearestSnapPoint : null,
                  snapPreviewPosition: nearestSnapPoint && snapConfig.activeTypes?.has?.(nearestSnapPoint.type) ? nearestSnapPoint.position : null
                };
              }

              // Alignment Detection (visual guides only, no snapping during drag)
              const result = SimpleAlignment.detectAlignments(tempShape, otherShapes);

              // PERFORMANCE FIX: DO NOT apply snap corrections during drag
              // This prevents jumping/jittering between snap points
              // Snap corrections will be applied on finishDragging() instead

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
              console.warn('Drag snap/alignment detection failed:', error);
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
          const offsetX = state.dragState.currentPosition.x - state.dragState.startPosition.x;
          const offsetY = state.dragState.currentPosition.y - state.dragState.startPosition.y;

          const updatedShapes = state.shapes.map(shape => {
            if (shape.id === state.dragState.draggedShapeId && state.dragState.originalShapePoints) {
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
          }
        }, false, 'cancelDragging');
      },

      duplicateShape: (id: string) => {
        const state = get();
        const originalShape = state.shapes.find(shape => shape.id === id);
        if (originalShape) {
          const duplicatedShape: Shape = {
            ...originalShape,
            id: generateId(),
            name: `${originalShape.name} Copy`,
            points: originalShape.points.map(p => ({ x: p.x + 20, y: p.y + 20 })), // Offset slightly
            created: new Date(),
            modified: new Date(),
          };

          set(
            prevState => ({
              shapes: [...prevState.shapes, duplicatedShape],
            }),
            false,
            'duplicateShape',
          );
        }
      },

      // Point manipulation
      addPoint: (point: Point2D) => {
        const state = get();
        if (state.drawing.currentShape) {
          set(
            prevState => ({
              drawing: {
                ...prevState.drawing,
                currentShape: {
                  ...prevState.drawing.currentShape!,
                  points: [...(prevState.drawing.currentShape!.points || []), point],
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
          // If rectangle has 4 points, ensure they form a proper rectangle
          if (validatedShape.points.length === 4) {
            // Check if the rectangle is properly closed (4 distinct corners)
            const points = validatedShape.points;

            // Ensure we have a proper rectangle structure
            // Rectangle should have: top-left, top-right, bottom-right, bottom-left
            const validRectangle = {
              ...validatedShape,
              points: points.slice(0, 4) // Keep only first 4 points if there are more
            };
            return validRectangle;
          } else if (validatedShape.points.length === 2) {
            // Convert 2-point format to 4-point format for consistency
            const [topLeft, bottomRight] = validatedShape.points;
            return {
              ...validatedShape,
              points: [
                { x: topLeft.x, y: topLeft.y },      // Top left
                { x: bottomRight.x, y: topLeft.y },  // Top right
                { x: bottomRight.x, y: bottomRight.y }, // Bottom right
                { x: topLeft.x, y: bottomRight.y }   // Bottom left
              ]
            };
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
        set(
          state => ({
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
          }),
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

        // Ensure the shape remains selected after resize
        if (wasResizingShapeId && currentState.selectedShapeId !== wasResizingShapeId) {
          get().selectShape(wasResizingShapeId);
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
                const updatedShape = {
                  ...shape,
                  points: newPoints,
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

      // Rotation mode actions
      enterRotateMode: (shapeId: string) => {
        // Save state to history BEFORE entering rotate mode
        // This captures the state the user started from
        get().saveToHistory();

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
            selectedShapeId: shapeId,
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
        // Invalidate geometry cache for the shape being rotated
        const existingShape = get().shapes.find(shape => shape.id === shapeId);
        if (existingShape) {
          GeometryCache.invalidateShape(existingShape);
        }

        // The angle parameter is already the final absolute angle we want to apply
        // (calculated from original rotation + delta in RotationControls)
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId) {
                return {
                  ...shape,
                  rotation: { angle, center },
                  modified: new Date(),
                };
              }
              return shape;
            }),
          }),
          false,
          'rotateShapeLive',
        );
      },

      rotateShape: (shapeId: string, angle: number, center: Point2D) => {
        // Invalidate geometry cache for the shape being rotated
        const existingShape = get().shapes.find(shape => shape.id === shapeId);
        if (existingShape) {
          GeometryCache.invalidateShape(existingShape);
        }

        // Apply the final rotation
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId) {
                return {
                  ...shape,
                  rotation: { angle, center },
                  modified: new Date(),
                };
              }
              return shape;
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

        // Validate shape exists
        const shape = state.shapes.find(s => s.id === shapeId);
        if (!shape) {
          logger.warn(`Cannot enter cursor rotation mode: shape ${shapeId} not found`);
          return;
        }

        // Save current state to history before entering mode
        state.saveToHistory();

        // Enter cursor rotation mode (keep current tool as 'select')
        set(
          state => ({
            drawing: {
              ...state.drawing,
              cursorRotationMode: true,
              cursorRotationShapeId: shapeId,
            },
            selectedShapeIds: [shapeId], // Ensure shape is selected
          }),
          false,
          'enterCursorRotationMode'
        );

        logger.info(`Entered cursor rotation mode for shape ${shapeId}`);
      },

      exitCursorRotationMode: () => {
        const state = get();

        // Save final state if a shape was being rotated
        if (state.drawing.cursorRotationShapeId) {
          state.saveToHistory();
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

        logger.info('Exited cursor rotation mode');
      },

      applyCursorRotation: (shapeId: string, angle: number, center: Point2D) => {
        const state = get();

        // Apply rotation using existing rotateShape action
        // This already saves to history at the end
        state.rotateShape(shapeId, angle, center);

        logger.info(`Cursor rotation applied: ${Math.round(angle)}°`);
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
          // Calculate precise end point using direction and distance
          const direction = calculateDirection(lineTool.startPoint, lineTool.previewEndPoint);
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

              // Add all segment points
              if (lineTool.segments.length > 0) {
                allPoints.push(lineTool.segments[0].startPoint);
                lineTool.segments.forEach(seg => {
                  allPoints.push(seg.endPoint);
                });
              }
              allPoints.push(preciseEndPoint);

              // Create polyline shape (closed)
              const polylineShape: Omit<Shape, 'id' | 'created' | 'modified'> = {
                name: `Multi-Line ${state.shapes.length + 1}`,
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
          allPoints.push(lineTool.segments[0].startPoint);

          // Add end point of each segment
          lineTool.segments.forEach(segment => {
            allPoints.push(segment.endPoint);
          });

          // Create polyline shape from segments
          const polylineShape: Omit<Shape, 'id' | 'created' | 'modified'> = {
            name: `Multi-Line ${state.shapes.length + 1}`,
            points: allPoints,
            type: 'polyline',
            color: '#3b82f6',
            visible: true,
            layerId: state.activeLayerId
          };

          get().addShape(polylineShape);

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
          state => ({
            viewState: {
              ...state.viewState,
              is2DMode: !state.viewState.is2DMode,
              cameraType: state.viewState.is2DMode ? 'perspective' : 'orthographic',
              viewAngle: state.viewState.is2DMode ? '3d' : 'top'
            }
          }),
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

      // Task 4.2: Shift key override for snapping
      setShiftKey: (pressed: boolean) => {
        set({ shiftKeyPressed: pressed }, false, 'setShiftKey');
      },
    }),
    {
      name: 'land-visualizer-store',
    },
  ),
);
