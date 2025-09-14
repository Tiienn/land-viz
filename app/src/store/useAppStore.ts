import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { precisionCalculator, type PrecisionMeasurement } from '@/services/precisionCalculations';
import { booleanOperationEngine, type BooleanResult, type SubdivisionSettings } from '@/services/booleanOperations';
import { professionalExportEngine, type ExportOptions, type ExportResult } from '@/services/professionalExport';
import { alignmentService } from '@/services/alignmentService';
import { GeometryCache } from '@/utils/GeometryCache';
import { logger } from '@/utils/logger';
import { convertToSquareMeters, calculateSquareDimensions, getUnitLabel } from '@/utils/areaCalculations';
import type { AppState, Shape, Layer, DrawingTool, Point2D, ShapeType, DrawingState, SnapPoint, AlignmentGuide, AreaUnit } from '@/types';

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
  startDrawing: () => void;
  removeLastPoint: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;

  // Shape actions
  addShape: (shape: Omit<Shape, 'id' | 'created' | 'modified'>) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  hoverShape: (id: string | null) => void;
  duplicateShape: (id: string) => void;
  createShapeFromArea: (area: number, unit: AreaUnit) => void;

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
  rotateShape: (shapeId: string, angle: number, center: Point2D) => void;

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
  updateSnapPoints: (snapPoints: SnapPoint[], activeSnapPoint?: SnapPoint | null) => void;
  updateAlignmentGuides: (guides: AlignmentGuide[], draggingShapeId?: string | null) => void;
  clearAlignmentGuides: () => void;
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
  // Enhanced snapping and guides system
  snapping: {
    config: {
      enabled: true,
      snapRadius: 15,
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
      alignmentThreshold: 5,
      snapStrength: 0.8,
      showCenterGuides: true,
      showEdgeGuides: true,
      showSpacingGuides: true,
      maxGuides: 8
    },
    activeGuides: [],
    draggingShapeId: null
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
  };
  
  // Set the present state to JSON representation of the base state
  baseState.history.present = JSON.stringify({
    shapes: baseState.shapes,
    layers: baseState.layers,
    selectedShapeId: baseState.selectedShapeId,
    hoveredShapeId: baseState.hoveredShapeId,
    dragState: baseState.dragState,
    activeLayerId: baseState.activeLayerId,
    drawing: baseState.drawing,
    measurements: baseState.measurements,
  });
  
  return baseState;
};

const initialState: AppState = createInitialState();

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

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
        
        set(
          prevState => ({
            drawing: {
              ...prevState.drawing,
              activeTool: tool,
              isDrawing: false,
              currentShape: null,
              // CRITICAL FIX: Comprehensive state clearing when leaving select tool
              isResizeMode: tool === 'select' ? prevState.drawing.isResizeMode : false,
              resizingShapeId: tool === 'select' ? prevState.drawing.resizingShapeId : null,
              resizeHandleType: tool === 'select' ? prevState.drawing.resizeHandleType : null,
              resizeHandleIndex: tool === 'select' ? prevState.drawing.resizeHandleIndex : null,
              maintainAspectRatio: tool === 'select' ? prevState.drawing.maintainAspectRatio : false,
              // ATOMIC CLEAR: Always clear liveResizePoints when leaving select tool
              liveResizePoints: tool === 'select' ? prevState.drawing.liveResizePoints : null,
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

        // Convert and calculate
        const areaInSqM = convertToSquareMeters(area, unit);
        const { width, height } = calculateSquareDimensions(areaInSqM);

        // Create rectangle at center
        const center = { x: 0, y: 0 };
        const points = [
          { x: center.x - width/2, y: center.y - height/2 },
          { x: center.x + width/2, y: center.y - height/2 },
          { x: center.x + width/2, y: center.y + height/2 },
          { x: center.x - width/2, y: center.y + height/2 }
        ];

        const state = get();

        // Apply grid snapping if enabled
        const finalPoints = state.drawing.snapToGrid
          ? points.map(p => ({
              x: Math.round(p.x / state.drawing.gridSize) * state.drawing.gridSize,
              y: Math.round(p.y / state.drawing.gridSize) * state.drawing.gridSize
            }))
          : points;

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
          }
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

      hoverShape: (id: string | null) => {
        set({ hoveredShapeId: id }, false, 'hoverShape');
      },

      // Drag actions
      startDragging: (shapeId: string, startPosition: Point2D) => {
        const state = get();
        const shape = state.shapes.find(s => s.id === shapeId);
        
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

        let finalPosition = currentPosition;
        let detectedGuides: AlignmentGuide[] = [];

        // Apply alignment detection and snapping if enabled
        if (state.drawing.alignment?.config?.enabled) {
          try {
            
            // Get the dragged shape
            const draggedShape = state.shapes.find(s => s.id === state.dragState.draggedShapeId);
            if (draggedShape) {
              // Create a temporary shape with the new position for alignment detection
              const offsetX = currentPosition.x - state.dragState.startPosition.x;
              const offsetY = currentPosition.y - state.dragState.startPosition.y;
              
              const tempShape = {
                ...draggedShape,
                points: state.dragState.originalShapePoints!.map(p => ({
                  x: p.x + offsetX,
                  y: p.y + offsetY
                }))
              };

              // Get other shapes for alignment detection
              const otherShapes = state.shapes.filter(s => s.id !== state.dragState.draggedShapeId);
              
              // Detect alignment guides
              const guides = alignmentService.detectAlignmentGuides(
                tempShape,
                otherShapes,
                state.drawing.alignment.config
              );

              // Apply magnetic snapping
              const snapResult = alignmentService.applyMagneticSnapping(
                currentPosition,
                guides,
                state.drawing.alignment.config.snapStrength
              );

              finalPosition = snapResult.snappedPosition;
              detectedGuides = guides;
            }
          } catch (error) {
            logger.warn('Alignment detection failed:', error);
          }
        }

        // Update drag state with snapped position and detected guides
        set({
          dragState: {
            ...state.dragState,
            currentPosition: finalPosition,
          },
          drawing: {
            ...state.drawing,
            alignment: {
              ...state.drawing.alignment,
              activeGuides: detectedGuides,
              draggingShapeId: state.dragState.draggedShapeId
            }
          }
        }, false, 'updateDragPosition');
      },

      finishDragging: () => {
        const state = get();
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

        // Handle rectangles - ensure they have the correct structure
        if (shape.type === 'rectangle') {
          // If rectangle has 4 points, ensure they form a proper rectangle
          if (shape.points.length === 4) {
            // Check if the rectangle is properly closed (4 distinct corners)
            const points = shape.points;
            
            // Ensure we have a proper rectangle structure
            // Rectangle should have: top-left, top-right, bottom-right, bottom-left
            const validRectangle = {
              ...shape,
              points: points.slice(0, 4) // Keep only first 4 points if there are more
            };
            return validRectangle;
          } else if (shape.points.length === 2) {
            // Convert 2-point format to 4-point format for consistency
            const [topLeft, bottomRight] = shape.points;
            return {
              ...shape,
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
        if (shape.type === 'polygon' || shape.type === 'polyline') {
          // Don't modify the points - they should be preserved as-is
          // The closing behavior is handled at render time, not storage time
          return shape;
        }
        
        // Handle circles - ensure they have proper structure
        if (shape.type === 'circle' && shape.points.length > 2) {
          // Circles should maintain their generated points structure
          return shape;
        }
        
        return shape;
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
        if (!currentState.drawing.isResizeMode || currentState.drawing.resizingShapeId !== shapeId) {
          logger.warn('⚠️ Live resize aborted - invalid state:', {
            shapeId,
            isResizeMode: currentState.drawing.isResizeMode,
            resizingShapeId: currentState.drawing.resizingShapeId
          });
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
        set(
          state => ({
            drawing: {
              ...state.drawing,
              isRotateMode: true,
              rotatingShapeId: shapeId,
              rotationStartAngle: 0,
              rotationCenter: null,
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
            },
          }),
          false,
          'exitRotateMode',
        );
      },

      rotateShape: (shapeId: string, angle: number, center: Point2D) => {
        // Invalidate geometry cache for the shape being rotated
        const existingShape = get().shapes.find(shape => shape.id === shapeId);
        if (existingShape) {
          GeometryCache.invalidateShape(existingShape);
        }
        
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
          const measurements = precisionCalculator.calculateShapeMeasurements(shape);
          totalArea += parseFloat(measurements.area.squareMeters);
        });
        
        return totalArea.toFixed(2);
      },

      getShapeCount: () => {
        const state = get();
        return state.shapes.length;
      },

      getAverageArea: () => {
        const state = get();
        if (state.shapes.length === 0) return '0.00';
        
        const totalArea = parseFloat(get().getTotalArea());
        const averageArea = totalArea / state.shapes.length;
        
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
              activeTool: 'select' // Reset to select tool
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

      clearAlignmentGuides: () => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              alignment: {
                ...state.drawing.alignment,
                activeGuides: [],
                draggingShapeId: null
              }
            }
          }),
          false,
          'clearAlignmentGuides'
        );
      },
    }),
    {
      name: 'land-visualizer-store',
    },
  ),
);