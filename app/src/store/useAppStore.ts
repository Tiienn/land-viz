import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppState, Shape, DrawingTool, Point2D, ShapeType } from '@/types';

interface AppStore extends AppState {
  // Drawing actions
  setActiveTool: (tool: DrawingTool) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  startDrawing: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;

  // Shape actions
  addShape: (shape: Omit<Shape, 'id' | 'created' | 'modified'>) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  duplicateShape: (id: string) => void;

  // Point manipulation
  addPoint: (point: Point2D) => void;
  updatePoint: (index: number, point: Point2D) => void;
  removePoint: (index: number) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Utility actions
  clearAll: () => void;
  exportShapes: () => Shape[];
  importShapes: (shapes: Shape[]) => void;
}

const generateId = (): string => {
  return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDefaultDrawingState = () => ({
  activeTool: 'select' as DrawingTool,
  isDrawing: false,
  currentShape: null,
  snapToGrid: true,
  gridSize: 10,
});

const createInitialState = (): AppState => {
  const baseState = {
    shapes: [],
    selectedShapeId: null,
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
    selectedShapeId: baseState.selectedShapeId,
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

      // Drawing actions
      setActiveTool: (tool: DrawingTool) => {
        set(
          state => ({
            drawing: {
              ...state.drawing,
              activeTool: tool,
              isDrawing: false,
              currentShape: null,
            },
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

            return {
              drawing: {
                ...state.drawing,
                isDrawing: true,
                currentShape: {
                  points: [],
                  type: getShapeType(state.drawing.activeTool),
                  color: '#3B82F6',
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
          const newShape: Shape = {
            id: generateId(),
            created: new Date(),
            modified: new Date(),
            ...(state.drawing.currentShape as Omit<Shape, 'id' | 'created' | 'modified'>),
          };

          set(
            prevState => ({
              shapes: [...prevState.shapes, newShape],
              drawing: {
                ...prevState.drawing,
                isDrawing: false,
                currentShape: null,
              },
              selectedShapeId: newShape.id,
            }),
            false,
            'finishDrawing',
          );
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

      // Shape actions
      addShape: shape => {
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
        set({ selectedShapeId: id }, false, 'selectShape');
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

      // History actions (simplified implementation)
      undo: () => {
        // TODO: Implement proper undo/redo with history management
        console.log('Undo action - to be implemented');
      },

      redo: () => {
        // TODO: Implement proper undo/redo with history management
        console.log('Redo action - to be implemented');
      },

      canUndo: () => {
        return false; // TODO: Implement proper history check
      },

      canRedo: () => {
        return false; // TODO: Implement proper history check
      },

      // Utility actions
      clearAll: () => {
        set(
          {
            shapes: [],
            selectedShapeId: null,
            drawing: getDefaultDrawingState(),
            measurements: {},
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
    }),
    {
      name: 'land-visualizer-store',
    },
  ),
);