import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Layer } from '../types';
import { logger } from '../utils/logger';

interface LayerStore {
  // State
  layers: Layer[];
  activeLayerId: string;

  // Layer actions
  createLayer: (name: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  moveLayerToFront: (layerId: string) => void;
  moveLayerForward: (layerId: string) => void;
  moveLayerBackward: (layerId: string) => void;
  moveLayerToBack: (layerId: string) => void;

  // Utility methods
  getLayerById: (id: string) => Layer | undefined;
  getActiveLayer: () => Layer | undefined;
  getAllLayers: () => Layer[];
  getVisibleLayers: () => Layer[];
}

const generateLayerId = (): string => {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createDefaultLayer = (name: string): Layer => ({
  id: generateLayerId(),
  name,
  visible: true,
  locked: false,
  color: '#3b82f6',
  opacity: 1,
  created: new Date(),
  modified: new Date(),
});

const getInitialLayers = (): Layer[] => [
  {
    id: 'main',
    name: 'Main Layer',
    visible: true,
    locked: false,
    color: '#3b82f6',
    opacity: 1,
    created: new Date(),
    modified: new Date(),
  },
];

export const useLayerStore = create<LayerStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      layers: getInitialLayers(),
      activeLayerId: 'main',

      // Layer actions
      createLayer: (name: string) => {
        set((state) => {
          const newLayer = createDefaultLayer(name);

          logger.info('Creating layer', { layer: newLayer });

          return {
            layers: [...state.layers, newLayer],
            activeLayerId: newLayer.id,
          };
        });
      },

      updateLayer: (id: string, updates: Partial<Layer>) => {
        set((state) => {
          const layerIndex = state.layers.findIndex((l) => l.id === id);
          if (layerIndex === -1) {
            logger.warn('Layer not found for update', { id });
            return state;
          }

          const updatedLayers = [...state.layers];
          updatedLayers[layerIndex] = {
            ...updatedLayers[layerIndex],
            ...updates,
            modified: new Date(),
          };

          logger.info('Updating layer', { id, updates });

          return {
            layers: updatedLayers,
          };
        });
      },

      deleteLayer: (id: string) => {
        set((state) => {
          // Prevent deletion of the main layer
          if (id === 'main') {
            logger.warn('Cannot delete main layer');
            return state;
          }

          // Prevent deletion if it's the only layer
          if (state.layers.length <= 1) {
            logger.warn('Cannot delete the only remaining layer');
            return state;
          }

          const layerExists = state.layers.some((l) => l.id === id);
          if (!layerExists) {
            logger.warn('Layer not found for deletion', { id });
            return state;
          }

          logger.info('Deleting layer', { id });

          let newActiveLayerId = state.activeLayerId;

          // If deleting the active layer, switch to the main layer
          if (state.activeLayerId === id) {
            newActiveLayerId = 'main';
          }

          return {
            layers: state.layers.filter((l) => l.id !== id),
            activeLayerId: newActiveLayerId,
          };
        });
      },

      setActiveLayer: (id: string) => {
        set((state) => {
          const layerExists = state.layers.some((l) => l.id === id);
          if (!layerExists) {
            logger.warn('Layer not found for activation', { id });
            return state;
          }

          logger.info('Setting active layer', { id });

          return {
            activeLayerId: id,
          };
        });
      },

      moveLayerToFront: (layerId: string) => {
        set((state) => {
          const layerIndex = state.layers.findIndex((l) => l.id === layerId);
          if (layerIndex === -1 || layerIndex === state.layers.length - 1) {
            return state;
          }

          const updatedLayers = [...state.layers];
          const [layer] = updatedLayers.splice(layerIndex, 1);
          updatedLayers.push(layer);

          logger.info('Moving layer to front', { layerId });

          return {
            layers: updatedLayers,
          };
        });
      },

      moveLayerForward: (layerId: string) => {
        set((state) => {
          const layerIndex = state.layers.findIndex((l) => l.id === layerId);
          if (layerIndex === -1 || layerIndex === state.layers.length - 1) {
            return state;
          }

          const updatedLayers = [...state.layers];
          [updatedLayers[layerIndex], updatedLayers[layerIndex + 1]] =
          [updatedLayers[layerIndex + 1], updatedLayers[layerIndex]];

          logger.info('Moving layer forward', { layerId });

          return {
            layers: updatedLayers,
          };
        });
      },

      moveLayerBackward: (layerId: string) => {
        set((state) => {
          const layerIndex = state.layers.findIndex((l) => l.id === layerId);
          if (layerIndex === -1 || layerIndex === 0) {
            return state;
          }

          const updatedLayers = [...state.layers];
          [updatedLayers[layerIndex], updatedLayers[layerIndex - 1]] =
          [updatedLayers[layerIndex - 1], updatedLayers[layerIndex]];

          logger.info('Moving layer backward', { layerId });

          return {
            layers: updatedLayers,
          };
        });
      },

      moveLayerToBack: (layerId: string) => {
        set((state) => {
          const layerIndex = state.layers.findIndex((l) => l.id === layerId);
          if (layerIndex === -1 || layerIndex === 0) {
            return state;
          }

          const updatedLayers = [...state.layers];
          const [layer] = updatedLayers.splice(layerIndex, 1);
          updatedLayers.unshift(layer);

          logger.info('Moving layer to back', { layerId });

          return {
            layers: updatedLayers,
          };
        });
      },

      // Utility methods
      getLayerById: (id: string) => {
        return get().layers.find((l) => l.id === id);
      },

      getActiveLayer: () => {
        const state = get();
        return state.layers.find((l) => l.id === state.activeLayerId);
      },

      getAllLayers: () => {
        return get().layers;
      },

      getVisibleLayers: () => {
        return get().layers.filter((l) => l.visible);
      },
    }),
    {
      name: 'layer-store',
    }
  )
);