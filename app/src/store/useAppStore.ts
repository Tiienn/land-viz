import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { precisionCalculator, type PrecisionMeasurement } from '@/services/precisionCalculations';
import { booleanOperationEngine, type BooleanResult, type SubdivisionSettings } from '@/services/booleanOperations';
import { professionalExportEngine, type ExportOptions, type ExportResult } from '@/services/professionalExport';
import { alignmentService } from '@/services/alignmentService';
import { GeometryCache } from '@/utils/GeometryCache';
import type { AppState, Shape, Layer, DrawingTool, Point2D, ShapeType, DrawingState, SnapPoint, AlignmentGuide } from '@/types';

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
  addShapeCorner: (shapeId: string, pointIndex: number, point: Point2D) => void;
  deleteShapeCorner: (shapeId: string, pointIndex: number) => void;
  convertRectangleToPolygon: (shapeId: string, newPoints: Point2D[]) => void;

  // Resize mode actions (only available in 'select' mode)
  enterResizeMode: (shapeId: string) => void;
  exitResizeMode: () => void;
  setResizeHandle: (handleType: 'corner' | 'edge', handleIndex: number) => void;
  setMaintainAspectRatio: (maintain: boolean) => void;
  resizeShape: (shapeId: string, newPoints: Point2D[]) => void;

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
      activeTypes: new Set(['grid', 'endpoint', 'midpoint', 'center']),
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
      enabled: true,
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
        set(
          state => ({
            drawing: {
              ...state.drawing,
              activeTool: tool,
              isDrawing: false,
              currentShape: null,
              // Reset resize mode when switching away from select tool
              isResizeMode: tool === 'select' ? state.drawing.isResizeMode : false,
              resizingShapeId: tool === 'select' ? state.drawing.resizingShapeId : null,
              resizeHandleType: tool === 'select' ? state.drawing.resizeHandleType : null,
              resizeHandleIndex: tool === 'select' ? state.drawing.resizeHandleIndex : null,
              maintainAspectRatio: tool === 'select' ? state.drawing.maintainAspectRatio : false,
            },
            // Clear hover state when switching away from select tool
            hoveredShapeId: tool === 'select' ? state.hoveredShapeId : null,
          }),
          false,
          'setActiveTool',
        );
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
                  return 'line';
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
              case 'line': // polyline
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
        // Exit resize mode when selecting a different shape
        if (state.drawing.isResizeMode && state.drawing.resizingShapeId !== id) {
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
              },
            }),
            false,
            'selectShape'
          );
        } else {
          set({ selectedShapeId: id }, false, 'selectShape');
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
            console.warn('Alignment detection failed:', error);
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
          
          // Preserve current drawing tool - don't change it during undo
          const currentActiveTool = state.drawing.activeTool;
          
          set(
            {
              ...previousState,
              drawing: {
                ...previousState.drawing,
                activeTool: currentActiveTool, // Keep current tool
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
          console.error('Failed to undo:', error);
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
          
          // Preserve current drawing tool - don't change it during redo
          const currentActiveTool = state.drawing.activeTool;
          
          set(
            {
              ...nextState,
              drawing: {
                ...nextState.drawing,
                activeTool: currentActiveTool, // Keep current tool
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
          console.error('Failed to redo:', error);
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
        if (shape.type === 'polygon' || shape.type === 'line') {
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

      addShapeCorner: (shapeId: string, pointIndex: number, point: Point2D) => {
        get().saveToHistory(); // Save state before adding corner
        
        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId && shape.points) {
                const newPoints = [...shape.points];
                newPoints.splice(pointIndex + 1, 0, point); // Insert after the specified index
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
        console.log('🔧 ResizeShape called for:', shapeId, 'with points:', newPoints);
        get().saveToHistory(); // Save state before resizing

        // Clear entire geometry cache to ensure resize is reflected immediately
        GeometryCache.dispose();

        set(
          state => ({
            shapes: state.shapes.map(shape => {
              if (shape.id === shapeId) {
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
          'resizeShape',
        );
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