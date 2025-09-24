import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Measurement, MeasurementPoint, MeasurementState, Point2D } from '../types';
import { MeasurementUtils } from '../utils/measurementUtils';
import { logger } from '../utils/logger';

interface MeasurementStore {
  // State
  measurement: MeasurementState;

  // Measurement actions
  startMeasurement: () => void;
  stopMeasurement: () => void;
  setStartPoint: (point: Point2D) => void;
  setPreviewEndPoint: (point: Point2D | null) => void;
  completeMeasurement: (endPoint: Point2D) => void;
  clearMeasurements: () => void;
  deleteMeasurement: (id: string) => void;
  selectMeasurement: (id: string | null) => void;
  toggleMeasurementVisibility: () => void;
  setMeasurementUnit: (unit: 'metric' | 'imperial' | 'toise') => void;
  updateMeasurementLabel: (id: string, label: string) => void;

  // Utility methods
  getMeasurementById: (id: string) => Measurement | undefined;
  getAllMeasurements: () => Measurement[];
  getVisibleMeasurements: () => Measurement[];
  calculateDistance: (start: Point2D, end: Point2D) => number;
}

const generateMeasurementId = (): string => {
  return `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateMeasurementPointId = (): string => {
  return `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createMeasurementPoint = (position: Point2D): MeasurementPoint => ({
  id: generateMeasurementPointId(),
  position,
  timestamp: new Date(),
});

const getInitialMeasurementState = (): MeasurementState => ({
  isActive: false,
  isMeasuring: false,
  startPoint: null,
  previewEndPoint: null,
  measurements: [],
  selectedMeasurementId: null,
  showMeasurements: true,
  unit: 'metric',
});

export const useMeasurementStore = create<MeasurementStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      measurement: getInitialMeasurementState(),

      // Measurement actions
      startMeasurement: () => {
        set((state) => {
          logger.info('Starting measurement mode');

          return {
            measurement: {
              ...state.measurement,
              isActive: true,
              isMeasuring: false,
              startPoint: null,
              previewEndPoint: null,
            },
          };
        });
      },

      stopMeasurement: () => {
        set((state) => {
          logger.info('Stopping measurement mode');

          return {
            measurement: {
              ...state.measurement,
              isActive: false,
              isMeasuring: false,
              startPoint: null,
              previewEndPoint: null,
            },
          };
        });
      },

      setStartPoint: (point: Point2D) => {
        set((state) => {
          const startPoint = createMeasurementPoint(point);

          logger.info('Setting measurement start point', { point });

          return {
            measurement: {
              ...state.measurement,
              isMeasuring: true,
              startPoint,
              previewEndPoint: null,
            },
          };
        });
      },

      setPreviewEndPoint: (point: Point2D | null) => {
        set((state) => ({
          measurement: {
            ...state.measurement,
            previewEndPoint: point,
          },
        }));
      },

      completeMeasurement: (endPoint: Point2D) => {
        set((state) => {
          if (!state.measurement.startPoint) {
            logger.warn('Cannot complete measurement without start point');
            return state;
          }

          const endMeasurementPoint = createMeasurementPoint(endPoint);
          const distance = get().calculateDistance(
            state.measurement.startPoint.position,
            endPoint
          );

          const newMeasurement: Measurement = {
            id: generateMeasurementId(),
            startPoint: state.measurement.startPoint,
            endPoint: endMeasurementPoint,
            distance,
            unit: state.measurement.unit,
            created: new Date(),
            visible: true,
          };

          logger.info('Completing measurement', { measurement: newMeasurement });

          return {
            measurement: {
              ...state.measurement,
              measurements: [...state.measurement.measurements, newMeasurement],
              isMeasuring: false,
              startPoint: null,
              previewEndPoint: null,
              selectedMeasurementId: newMeasurement.id,
            },
          };
        });
      },

      clearMeasurements: () => {
        set((state) => {
          logger.info('Clearing all measurements');

          return {
            measurement: {
              ...state.measurement,
              measurements: [],
              selectedMeasurementId: null,
            },
          };
        });
      },

      deleteMeasurement: (id: string) => {
        set((state) => {
          const measurementExists = state.measurement.measurements.some((m) => m.id === id);
          if (!measurementExists) {
            logger.warn('Measurement not found for deletion', { id });
            return state;
          }

          logger.info('Deleting measurement', { id });

          return {
            measurement: {
              ...state.measurement,
              measurements: state.measurement.measurements.filter((m) => m.id !== id),
              selectedMeasurementId:
                state.measurement.selectedMeasurementId === id
                  ? null
                  : state.measurement.selectedMeasurementId,
            },
          };
        });
      },

      selectMeasurement: (id: string | null) => {
        set((state) => {
          if (id && !state.measurement.measurements.some((m) => m.id === id)) {
            logger.warn('Measurement not found for selection', { id });
            return state;
          }

          return {
            measurement: {
              ...state.measurement,
              selectedMeasurementId: id,
            },
          };
        });
      },

      toggleMeasurementVisibility: () => {
        set((state) => {
          const newVisibility = !state.measurement.showMeasurements;

          logger.info('Toggling measurement visibility', { visible: newVisibility });

          return {
            measurement: {
              ...state.measurement,
              showMeasurements: newVisibility,
            },
          };
        });
      },

      setMeasurementUnit: (unit: 'metric' | 'imperial' | 'toise') => {
        set((state) => {
          logger.info('Setting measurement unit', { unit });

          return {
            measurement: {
              ...state.measurement,
              unit,
            },
          };
        });
      },

      updateMeasurementLabel: (id: string, label: string) => {
        set((state) => {
          const measurementIndex = state.measurement.measurements.findIndex((m) => m.id === id);
          if (measurementIndex === -1) {
            logger.warn('Measurement not found for label update', { id });
            return state;
          }

          const updatedMeasurements = [...state.measurement.measurements];
          updatedMeasurements[measurementIndex] = {
            ...updatedMeasurements[measurementIndex],
            label: label.trim() || undefined,
          };

          logger.info('Updating measurement label', { id, label });

          return {
            measurement: {
              ...state.measurement,
              measurements: updatedMeasurements,
            },
          };
        });
      },

      // Utility methods
      getMeasurementById: (id: string) => {
        return get().measurement.measurements.find((m) => m.id === id);
      },

      getAllMeasurements: () => {
        return get().measurement.measurements;
      },

      getVisibleMeasurements: () => {
        const state = get();
        if (!state.measurement.showMeasurements) {
          return [];
        }
        return state.measurement.measurements.filter((m) => m.visible);
      },

      calculateDistance: (start: Point2D, end: Point2D) => {
        return MeasurementUtils.calculateDistance(start, end);
      },
    }),
    {
      name: 'measurement-store',
    }
  )
);