import { describe, test, expect } from 'vitest';
import { useAppStore } from '../useAppStore';
import type { Point2D } from '@/types';

describe('Measurement Store Actions', () => {
  // Create helper function to get current store state
  const getStore = () => useAppStore.getState();

  // Reset store before each test
  beforeEach(() => {
    getStore().clearAll();
  });

  describe('Tool Activation', () => {
    test('activateMeasurementTool sets active tool and measurement state', () => {
      let store = getStore();
      expect(store.drawing.activeTool).toBe('select');
      expect(store.drawing.measurement.isActive).toBe(false);

      store.activateMeasurementTool();

      store = getStore(); // Get updated state
      expect(store.drawing.activeTool).toBe('measure');
      expect(store.drawing.measurement.isActive).toBe(true);
    });

    test('deactivateMeasurementTool resets measurement state', () => {
      // First activate and start a measurement
      store.activateMeasurementTool();
      store.startMeasurement({ x: 0, y: 0 });

      expect(store.drawing.measurement.isActive).toBe(true);
      expect(store.drawing.measurement.isMeasuring).toBe(true);
      expect(store.drawing.measurement.startPoint).not.toBeNull();

      store.deactivateMeasurementTool();

      expect(store.drawing.measurement.isActive).toBe(false);
      expect(store.drawing.measurement.isMeasuring).toBe(false);
      expect(store.drawing.measurement.startPoint).toBeNull();
      expect(store.drawing.measurement.previewEndPoint).toBeNull();
    });
  });

  describe('Measurement Process', () => {
    beforeEach(() => {
      store.activateMeasurementTool();
    });

    test('startMeasurement creates start point and sets measuring state', () => {
      const startPoint: Point2D = { x: 10, y: 20 };

      expect(store.drawing.measurement.isMeasuring).toBe(false);
      expect(store.drawing.measurement.startPoint).toBeNull();

      store.startMeasurement(startPoint);

      expect(store.drawing.measurement.isMeasuring).toBe(true);
      expect(store.drawing.measurement.startPoint).not.toBeNull();
      expect(store.drawing.measurement.startPoint?.position).toEqual(startPoint);
      expect(store.drawing.measurement.previewEndPoint).toBeNull();
    });

    test('updateMeasurementPreview updates preview point', () => {
      const startPoint: Point2D = { x: 0, y: 0 };
      const previewPoint: Point2D = { x: 5, y: 5 };

      store.startMeasurement(startPoint);
      store.updateMeasurementPreview(previewPoint);

      expect(store.drawing.measurement.previewEndPoint).toEqual(previewPoint);
    });

    test('completeMeasurement creates measurement and resets state', () => {
      const startPoint: Point2D = { x: 0, y: 0 };
      const endPoint: Point2D = { x: 3, y: 4 };

      store.startMeasurement(startPoint);
      store.completeMeasurement(endPoint);

      // Check measurement was created
      expect(store.drawing.measurement.measurements).toHaveLength(1);

      const measurement = store.drawing.measurement.measurements[0];
      expect(measurement.startPoint.position).toEqual(startPoint);
      expect(measurement.endPoint.position).toEqual(endPoint);
      expect(measurement.distance).toBe(5); // 3-4-5 triangle
      expect(measurement.unit).toBe('metric');
      expect(measurement.visible).toBe(true);

      // Check state was reset
      expect(store.drawing.measurement.isMeasuring).toBe(false);
      expect(store.drawing.measurement.startPoint).toBeNull();
      expect(store.drawing.measurement.previewEndPoint).toBeNull();
      expect(store.drawing.measurement.selectedMeasurementId).toBe(measurement.id);
    });

    test('cancelMeasurement resets measuring state without creating measurement', () => {
      const startPoint: Point2D = { x: 0, y: 0 };

      store.startMeasurement(startPoint);
      expect(store.drawing.measurement.isMeasuring).toBe(true);
      expect(store.drawing.measurement.startPoint).not.toBeNull();

      store.cancelMeasurement();

      expect(store.drawing.measurement.isMeasuring).toBe(false);
      expect(store.drawing.measurement.startPoint).toBeNull();
      expect(store.drawing.measurement.previewEndPoint).toBeNull();
      expect(store.drawing.measurement.measurements).toHaveLength(0);
    });

    test('completeMeasurement validates points and rejects invalid measurements', () => {
      const samePoint: Point2D = { x: 0, y: 0 };

      store.startMeasurement(samePoint);
      store.completeMeasurement(samePoint); // Same point

      // Should not create measurement
      expect(store.drawing.measurement.measurements).toHaveLength(0);
      // Should remain in measuring state since measurement failed
      expect(store.drawing.measurement.isMeasuring).toBe(true);
    });
  });

  describe('Measurement Management', () => {
    beforeEach(() => {
      store.activateMeasurementTool();
      // Create a test measurement
      store.startMeasurement({ x: 0, y: 0 });
      store.completeMeasurement({ x: 3, y: 4 });
    });

    test('toggleMeasurementVisibility toggles visibility', () => {
      const measurementId = store.drawing.measurement.measurements[0].id;

      expect(store.drawing.measurement.measurements[0].visible).toBe(true);

      store.toggleMeasurementVisibility(measurementId);
      expect(store.drawing.measurement.measurements[0].visible).toBe(false);

      store.toggleMeasurementVisibility(measurementId);
      expect(store.drawing.measurement.measurements[0].visible).toBe(true);
    });

    test('deleteMeasurement removes measurement', () => {
      const measurementId = store.drawing.measurement.measurements[0].id;

      expect(store.drawing.measurement.measurements).toHaveLength(1);
      expect(store.drawing.measurement.selectedMeasurementId).toBe(measurementId);

      store.deleteMeasurement(measurementId);

      expect(store.drawing.measurement.measurements).toHaveLength(0);
      expect(store.drawing.measurement.selectedMeasurementId).toBeNull();
    });

    test('clearAllMeasurements removes all measurements and resets state', () => {
      // Create another measurement
      store.startMeasurement({ x: 10, y: 10 });
      store.completeMeasurement({ x: 20, y: 20 });

      expect(store.drawing.measurement.measurements).toHaveLength(2);

      store.clearAllMeasurements();

      expect(store.drawing.measurement.measurements).toHaveLength(0);
      expect(store.drawing.measurement.selectedMeasurementId).toBeNull();
      expect(store.drawing.measurement.isMeasuring).toBe(false);
      expect(store.drawing.measurement.startPoint).toBeNull();
      expect(store.drawing.measurement.previewEndPoint).toBeNull();
    });

    test('selectMeasurement sets selected measurement', () => {
      const measurementId = store.drawing.measurement.measurements[0].id;

      store.selectMeasurement(null);
      expect(store.drawing.measurement.selectedMeasurementId).toBeNull();

      store.selectMeasurement(measurementId);
      expect(store.drawing.measurement.selectedMeasurementId).toBe(measurementId);
    });
  });

  describe('Settings', () => {
    test('setMeasurementUnit changes unit preference', () => {
      expect(store.drawing.measurement.unit).toBe('metric');

      store.setMeasurementUnit('imperial');
      expect(store.drawing.measurement.unit).toBe('imperial');

      store.setMeasurementUnit('metric');
      expect(store.drawing.measurement.unit).toBe('metric');
    });

    test('toggleMeasurementDisplay toggles measurement visibility', () => {
      expect(store.drawing.measurement.showMeasurements).toBe(true);

      store.toggleMeasurementDisplay();
      expect(store.drawing.measurement.showMeasurements).toBe(false);

      store.toggleMeasurementDisplay();
      expect(store.drawing.measurement.showMeasurements).toBe(true);
    });
  });

  describe('Integration with Store State', () => {
    test('measurement state is properly initialized', () => {
      const initialState = store.drawing.measurement;

      expect(initialState.isActive).toBe(false);
      expect(initialState.isMeasuring).toBe(false);
      expect(initialState.startPoint).toBeNull();
      expect(initialState.previewEndPoint).toBeNull();
      expect(initialState.measurements).toEqual([]);
      expect(initialState.selectedMeasurementId).toBeNull();
      expect(initialState.showMeasurements).toBe(true);
      expect(initialState.unit).toBe('metric');
    });

    test('measurements are included in store serialization', () => {
      store.activateMeasurementTool();
      store.startMeasurement({ x: 0, y: 0 });
      store.completeMeasurement({ x: 10, y: 0 });

      // Force save to history to test serialization
      store.saveToHistory();

      // Check that the measurement is preserved in history
      expect(store.canUndo()).toBe(true);
    });
  });
});