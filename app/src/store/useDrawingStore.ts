import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DrawingTool, Point2D, Shape, ShapeType, DrawingState, SnapPoint, AlignmentGuide } from '../types';
import { logger } from '../utils/logger';
import { calculateGridAwareDimensions, generateShapeFromArea } from '../utils/areaCalculations';

interface DrawingStore {
  // State
  drawing: DrawingState;
  shapes: Shape[];
  selectedShapeId: string | null;
  hoveredShapeId: string | null;
  renderTrigger: number;

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
  hoverShape: (id: string | null) => void;
  duplicateShape: (id: string) => void;

  // Point manipulation
  addPoint: (point: Point2D) => void;
  updatePoint: (index: number, point: Point2D) => void;
  removePoint: (index: number) => void;

  // Alignment and snapping
  updateDrawingState: (updates: Partial<DrawingState>) => void;
  updateSnapPoints: (snapPoints: SnapPoint[], activeSnapPoint?: SnapPoint | null) => void;
  updateAlignmentGuides: (guides: AlignmentGuide[], draggingShapeId?: string | null) => void;
  clearAlignmentGuides: () => void;

  // Utility
  cancelAll: () => void;
  exportShapes: () => Shape[];
}

const generateId = (): string => {
  return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDefaultDrawingState = (): DrawingState => ({
  activeTool: 'select' as DrawingTool,
  isDrawing: false,
  currentShape: null,
  snapToGrid: false,
  gridSize: 1,
  showDimensions: true,
  isEditMode: false,
  editingShapeId: null,
  selectedCornerIndex: null,
  isResizeMode: false,
  resizingShapeId: null,
  resizeHandleType: null,
  resizeHandleIndex: null,
  maintainAspectRatio: false,
  liveResizePoints: null,
  isRotateMode: false,
  rotatingShapeId: null,
  rotationStartAngle: 0,
  rotationCenter: null,
  originalRotation: null,
  snapping: {
    config: {
      enabled: false,
      snapRadius: 10,
      activeTypes: new Set([]),
      visual: {
        showIndicators: true,
        showSnapLines: true,
        indicatorColor: '#00ff00',
        snapLineColor: '#00ff00',
        indicatorSize: 8,
      },
      performance: {
        maxSnapPoints: 100,
        updateInterval: 16,
      },
    },
    availableSnapPoints: [],
    activeSnapPoint: null,
    snapPreviewPosition: null,
  },
  guides: {
    staticGuides: [],
    activeAlignmentGuides: [],
    config: {
      staticGuides: {
        enabled: true,
        defaultColor: '#888888',
        defaultThickness: 1,
        showLabels: true,
        snapToGuides: true,
      },
      alignmentGuides: {
        enabled: true,
        sensitivity: 0.8,
        colors: {
          horizontal: '#00aaff',
          vertical: '#00aaff',
          angular: '#ff8800',
        },
        showDuringDraw: true,
        showDuringEdit: true,
      },
    },
    isCreatingGuide: false,
    guidePreview: null,
  },
  rulers: {
    config: {
      enabled: false,
      showHorizontal: true,
      showVertical: true,
      units: 'metric',
      style: {
        backgroundColor: '#f0f0f0',
        textColor: '#333333',
        majorTickColor: '#666666',
        minorTickColor: '#cccccc',
        thickness: 20,
        fontSize: 10,
      },
      precision: {
        decimalPlaces: 2,
        majorTickInterval: 1,
        minorTickInterval: 0.1,
      },
      markers: [],
    },
    mousePosition: null,
  },
  grid: {
    config: {
      enabled: true,
      primarySpacing: 1,
      secondarySpacing: 0.1,
      origin: { x: 0, y: 0 },
      style: {
        primaryColor: '#e0e0e0',
        secondaryColor: '#f0f0f0',
        primaryThickness: 1,
        secondaryThickness: 0.5,
        opacity: 0.7,
      },
      behavior: {
        showLabels: true,
        adaptive: true,
        fadeAtZoom: true,
      },
    },
  },
  measurement: {
    isActive: false,
    isMeasuring: false,
    startPoint: null,
    previewEndPoint: null,
    measurements: [],
    selectedMeasurementId: null,
    showMeasurements: true,
    unit: 'metric',
  },
});

export const useDrawingStore = create<DrawingStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      drawing: getDefaultDrawingState(),
      shapes: [],
      selectedShapeId: null,
      hoveredShapeId: null,
      renderTrigger: 0,

      // Drawing actions
      setActiveTool: (tool: DrawingTool) => {
        set((state) => {
          logger.info('Setting active tool', { tool });

          // Cancel any active operations when switching tools
          let updates: Partial<DrawingStore> = {
            drawing: {
              ...state.drawing,
              activeTool: tool,
              isDrawing: false,
              currentShape: null,
              isEditMode: false,
              editingShapeId: null,
              selectedCornerIndex: null,
              isResizeMode: false,
              resizingShapeId: null,
              resizeHandleType: null,
              resizeHandleIndex: null,
              liveResizePoints: null,
              isRotateMode: false,
              rotatingShapeId: null,
              rotationCenter: null,
              originalRotation: null,
            },
          };

          // Clear selection when switching from select tool
          if (state.drawing.activeTool === 'select' && tool !== 'select') {
            updates.selectedShapeId = null;
          }

          return updates;
        });
      },

      toggleSnapToGrid: () => {
        set((state) => ({
          drawing: {
            ...state.drawing,
            snapToGrid: !state.drawing.snapToGrid,
          },
        }));
      },

      setGridSize: (size: number) => {
        set((state) => ({
          drawing: {
            ...state.drawing,
            gridSize: Math.max(0.1, size),
          },
        }));
      },

      toggleShowDimensions: () => {
        set((state) => ({
          drawing: {
            ...state.drawing,
            showDimensions: !state.drawing.showDimensions,
          },
        }));
      },

      triggerRender: () => {
        set((state) => ({
          renderTrigger: state.renderTrigger + 1,
        }));
      },

      startDrawing: () => {
        set((state) => ({
          drawing: {
            ...state.drawing,
            isDrawing: true,
            currentShape: {
              name: `${state.drawing.activeTool} ${state.shapes.length + 1}`,
              points: [],
              type: state.drawing.activeTool === 'polyline' ? 'polyline' :
                    state.drawing.activeTool === 'rectangle' ? 'rectangle' :
                    state.drawing.activeTool === 'circle' ? 'circle' : 'polygon',
              color: '#3b82f6',
              visible: true,
              layerId: 'main',
            },
          },
        }));
      },

      removeLastPoint: () => {
        set((state) => {
          if (!state.drawing.currentShape?.points.length) return state;

          return {
            drawing: {
              ...state.drawing,
              currentShape: {
                ...state.drawing.currentShape,
                points: state.drawing.currentShape.points.slice(0, -1),
              },
            },
          };
        });
      },

      finishDrawing: () => {
        set((state) => {
          if (!state.drawing.currentShape || !state.drawing.currentShape.points?.length) {
            return {
              drawing: {
                ...state.drawing,
                isDrawing: false,
                currentShape: null,
              },
            };
          }

          const newShape: Shape = {
            id: generateId(),
            name: state.drawing.currentShape.name || 'New Shape',
            points: state.drawing.currentShape.points,
            type: state.drawing.currentShape.type || 'polygon',
            color: state.drawing.currentShape.color || '#3b82f6',
            visible: true,
            layerId: state.drawing.currentShape.layerId || 'main',
            created: new Date(),
            modified: new Date(),
            rotation: state.drawing.currentShape.rotation,
          };

          logger.info('Finishing drawing', { shape: newShape });

          return {
            shapes: [...state.shapes, newShape],
            selectedShapeId: newShape.id,
            drawing: {
              ...state.drawing,
              isDrawing: false,
              currentShape: null,
              activeTool: 'select',
            },
            renderTrigger: state.renderTrigger + 1,
          };
        });
      },

      cancelDrawing: () => {
        set((state) => ({
          drawing: {
            ...state.drawing,
            isDrawing: false,
            currentShape: null,
          },
        }));
      },

      // Shape actions
      addShape: (shapeData) => {
        set((state) => {
          const newShape: Shape = {
            id: generateId(),
            created: new Date(),
            modified: new Date(),
            ...shapeData,
          };

          logger.info('Adding shape', { shape: newShape });

          return {
            shapes: [...state.shapes, newShape],
            selectedShapeId: newShape.id,
            renderTrigger: state.renderTrigger + 1,
          };
        });
      },

      updateShape: (id: string, updates: Partial<Shape>) => {
        set((state) => {
          const shapeIndex = state.shapes.findIndex((s) => s.id === id);
          if (shapeIndex === -1) return state;

          const updatedShapes = [...state.shapes];
          updatedShapes[shapeIndex] = {
            ...updatedShapes[shapeIndex],
            ...updates,
            modified: new Date(),
          };

          logger.info('Updating shape', { id, updates });

          return {
            shapes: updatedShapes,
            renderTrigger: state.renderTrigger + 1,
          };
        });
      },

      deleteShape: (id: string) => {
        set((state) => {
          logger.info('Deleting shape', { id });

          return {
            shapes: state.shapes.filter((s) => s.id !== id),
            selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
            renderTrigger: state.renderTrigger + 1,
          };
        });
      },

      selectShape: (id: string | null) => {
        set((state) => {
          // Exit any active modes when changing selection
          const updates: Partial<DrawingStore> = {
            selectedShapeId: id,
            drawing: {
              ...state.drawing,
              isEditMode: false,
              editingShapeId: null,
              selectedCornerIndex: null,
              isResizeMode: false,
              resizingShapeId: null,
              resizeHandleType: null,
              resizeHandleIndex: null,
              liveResizePoints: null,
              isRotateMode: false,
              rotatingShapeId: null,
              rotationCenter: null,
              originalRotation: null,
            },
          };

          return updates;
        });
      },

      hoverShape: (id: string | null) => {
        set({ hoveredShapeId: id });
      },

      duplicateShape: (id: string) => {
        set((state) => {
          const originalShape = state.shapes.find((s) => s.id === id);
          if (!originalShape) return state;

          const duplicatedShape: Shape = {
            ...originalShape,
            id: generateId(),
            name: `${originalShape.name} Copy`,
            points: originalShape.points.map((p) => ({ x: p.x + 2, y: p.y + 2 })),
            created: new Date(),
            modified: new Date(),
          };

          logger.info('Duplicating shape', { originalId: id, duplicatedShape });

          return {
            shapes: [...state.shapes, duplicatedShape],
            selectedShapeId: duplicatedShape.id,
            renderTrigger: state.renderTrigger + 1,
          };
        });
      },

      // Point manipulation
      addPoint: (point: Point2D) => {
        set((state) => {
          if (!state.drawing.currentShape) return state;

          return {
            drawing: {
              ...state.drawing,
              currentShape: {
                ...state.drawing.currentShape,
                points: [...(state.drawing.currentShape.points || []), point],
              },
            },
          };
        });
      },

      updatePoint: (index: number, point: Point2D) => {
        set((state) => {
          if (!state.drawing.currentShape?.points?.[index]) return state;

          const updatedPoints = [...state.drawing.currentShape.points];
          updatedPoints[index] = point;

          return {
            drawing: {
              ...state.drawing,
              currentShape: {
                ...state.drawing.currentShape,
                points: updatedPoints,
              },
            },
          };
        });
      },

      removePoint: (index: number) => {
        set((state) => {
          if (!state.drawing.currentShape?.points?.[index]) return state;

          const updatedPoints = state.drawing.currentShape.points.filter((_, i) => i !== index);

          return {
            drawing: {
              ...state.drawing,
              currentShape: {
                ...state.drawing.currentShape,
                points: updatedPoints,
              },
            },
          };
        });
      },

      // Alignment and snapping
      updateDrawingState: (updates: Partial<DrawingState>) => {
        set((state) => ({
          drawing: {
            ...state.drawing,
            ...updates,
          },
        }));
      },

      updateSnapPoints: (snapPoints: SnapPoint[], activeSnapPoint?: SnapPoint | null) => {
        set((state) => ({
          drawing: {
            ...state.drawing,
            snapping: {
              ...state.drawing.snapping,
              availableSnapPoints: snapPoints,
              activeSnapPoint: activeSnapPoint || null,
            },
          },
        }));
      },

      updateAlignmentGuides: (guides: AlignmentGuide[], draggingShapeId?: string | null) => {
        set((state) => ({
          drawing: {
            ...state.drawing,
            guides: {
              ...state.drawing.guides,
              activeAlignmentGuides: guides,
            },
          },
        }));
      },

      clearAlignmentGuides: () => {
        set((state) => ({
          drawing: {
            ...state.drawing,
            guides: {
              ...state.drawing.guides,
              activeAlignmentGuides: [],
            },
          },
        }));
      },

      // Utility
      cancelAll: () => {
        set((state) => ({
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
            liveResizePoints: null,
            isRotateMode: false,
            rotatingShapeId: null,
            rotationCenter: null,
            originalRotation: null,
          },
          selectedShapeId: null,
        }));
      },

      exportShapes: () => {
        return get().shapes;
      },
    }),
    {
      name: 'drawing-store',
    }
  )
);