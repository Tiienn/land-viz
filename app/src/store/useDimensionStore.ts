/**
 * Dimension Store
 * Spec 013: Direct Dimension Input
 *
 * Zustand store for dimension input, inline editing, and precision settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DimensionInputState,
  InlineEditState,
  LiveDistanceState,
  PrecisionSettings
} from '@/types';

interface DimensionStore {
  // State slices
  dimensionInput: DimensionInputState;
  inlineEdit: InlineEditState;
  liveDistance: LiveDistanceState;
  precision: PrecisionSettings;

  // Actions - Dimension Input
  setDimensionInput: (width: string, height: string) => void;
  setDimensionInputWidth: (width: string) => void;
  setDimensionInputHeight: (height: string) => void;
  setDimensionInputRadius: (radius: string) => void;
  setDimensionInputUnit: (unit: string) => void;
  setDimensionInputRadiusMode: (mode: 'r' | 'd') => void;
  clearDimensionInput: () => void;
  setInputError: (error: string | null) => void;
  activateDimensionInput: () => void;
  deactivateDimensionInput: () => void;

  // Actions - Inline Edit
  startEditingDimension: (
    shapeId: string,
    type: 'width' | 'height' | 'radius'
  ) => void;
  updateEditingValue: (value: string) => void;
  setEditingError: (error: string | null) => void;
  confirmDimensionEdit: () => void;
  cancelDimensionEdit: () => void;

  // Actions - Live Distance
  showDistance: (distance: number) => void;
  hideDistance: () => void;
  updateDistance: (distance: number) => void;

  // Actions - Precision
  setPrecision: (settings: Partial<PrecisionSettings>) => void;
  setSnapPrecision: (value: number) => void;
  setDisplayPrecision: (value: number) => void;
  setPreferredUnit: (unit: string) => void;
  setAngleSnap: (value: number) => void;
}

// Default precision settings
const DEFAULT_PRECISION: PrecisionSettings = {
  snapPrecision: 1, // 1m snap by default
  displayPrecision: 2, // 2 decimal places
  preferredUnit: 'm', // Meters
  angleSnap: 45 // 45° angle snap
};

export const useDimensionStore = create<DimensionStore>()(
  persist(
    (set, get) => ({
      // Initial state - Dimension Input
      dimensionInput: {
        isDimensionInputActive: false,
        inputWidth: '',
        inputHeight: '',
        inputRadius: '',
        inputUnit: 'm',
        inputRadiusMode: 'r', // Default to radius
        inputError: null
      },

      // Initial state - Inline Edit
      inlineEdit: {
        isEditingDimension: false,
        editingShapeId: null,
        editingDimensionType: null,
        editingValue: '',
        editingError: null
      },

      // Initial state - Live Distance
      liveDistance: {
        isShowingDistance: false,
        distanceFromStart: 0
      },

      // Initial state - Precision
      precision: DEFAULT_PRECISION,

      // ================================
      // DIMENSION INPUT ACTIONS
      // ================================

      setDimensionInput: (width: string, height: string) => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            inputWidth: width,
            inputHeight: height,
            isDimensionInputActive: true,
            inputError: null
          }
        }));
      },

      setDimensionInputWidth: (width: string) => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            inputWidth: width,
            inputError: null
          }
        }));
      },

      setDimensionInputHeight: (height: string) => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            inputHeight: height,
            inputError: null
          }
        }));
      },

      setDimensionInputRadius: (radius: string) => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            inputRadius: radius,
            inputError: null
          }
        }));
      },

      setDimensionInputUnit: (unit: string) => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            inputUnit: unit
          }
        }));
      },

      setDimensionInputRadiusMode: (mode: 'r' | 'd') => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            inputRadiusMode: mode
          }
        }));
      },

      clearDimensionInput: () => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            isDimensionInputActive: false,
            inputWidth: '',
            inputHeight: '',
            inputRadius: '',
            inputError: null
          }
        }));
      },

      setInputError: (error: string | null) => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            inputError: error
          }
        }));
      },

      activateDimensionInput: () => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            isDimensionInputActive: true
          }
        }));
      },

      deactivateDimensionInput: () => {
        set(state => ({
          dimensionInput: {
            ...state.dimensionInput,
            isDimensionInputActive: false,
            inputError: null
          }
        }));
      },

      // ================================
      // INLINE EDIT ACTIONS
      // ================================

      startEditingDimension: (
        shapeId: string,
        type: 'width' | 'height' | 'radius'
      ) => {
        set({
          inlineEdit: {
            isEditingDimension: true,
            editingShapeId: shapeId,
            editingDimensionType: type,
            editingValue: '',
            editingError: null
          }
        });
      },

      updateEditingValue: (value: string) => {
        set(state => ({
          inlineEdit: {
            ...state.inlineEdit,
            editingValue: value,
            editingError: null
          }
        }));
      },

      setEditingError: (error: string | null) => {
        set(state => ({
          inlineEdit: {
            ...state.inlineEdit,
            editingError: error
          }
        }));
      },

      confirmDimensionEdit: () => {
        // This will be called by components to apply the edit
        // The actual shape update happens in the component
        set({
          inlineEdit: {
            isEditingDimension: false,
            editingShapeId: null,
            editingDimensionType: null,
            editingValue: '',
            editingError: null
          }
        });
      },

      cancelDimensionEdit: () => {
        set({
          inlineEdit: {
            isEditingDimension: false,
            editingShapeId: null,
            editingDimensionType: null,
            editingValue: '',
            editingError: null
          }
        });
      },

      // ================================
      // LIVE DISTANCE ACTIONS
      // ================================

      showDistance: (distance: number) => {
        set({
          liveDistance: {
            isShowingDistance: true,
            distanceFromStart: distance
          }
        });
      },

      hideDistance: () => {
        set({
          liveDistance: {
            isShowingDistance: false,
            distanceFromStart: 0
          }
        });
      },

      updateDistance: (distance: number) => {
        set(state => ({
          liveDistance: {
            ...state.liveDistance,
            distanceFromStart: distance
          }
        }));
      },

      // ================================
      // PRECISION ACTIONS
      // ================================

      setPrecision: (settings: Partial<PrecisionSettings>) => {
        set(state => ({
          precision: {
            ...state.precision,
            ...settings
          }
        }));
      },

      setSnapPrecision: (value: number) => {
        set(state => ({
          precision: {
            ...state.precision,
            snapPrecision: value
          }
        }));
      },

      setDisplayPrecision: (value: number) => {
        set(state => ({
          precision: {
            ...state.precision,
            displayPrecision: value
          }
        }));
      },

      setPreferredUnit: (unit: string) => {
        set(state => ({
          precision: {
            ...state.precision,
            preferredUnit: unit
          }
        }));
      },

      setAngleSnap: (value: number) => {
        set(state => ({
          precision: {
            ...state.precision,
            angleSnap: value
          }
        }));
      }
    }),
    {
      name: 'dimension-settings', // LocalStorage key
      // Only persist precision settings, not input/edit state
      partialize: (state) => ({
        precision: state.precision
      })
    }
  )
);
