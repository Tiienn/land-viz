import { describe, test, expect } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('Measurement Store Integration', () => {
  test('store has measurement actions available', () => {
    const store = useAppStore.getState();

    // Verify measurement actions exist
    expect(typeof store.activateMeasurementTool).toBe('function');
    expect(typeof store.deactivateMeasurementTool).toBe('function');
    expect(typeof store.startMeasurement).toBe('function');
    expect(typeof store.updateMeasurementPreview).toBe('function');
    expect(typeof store.completeMeasurement).toBe('function');
    expect(typeof store.cancelMeasurement).toBe('function');
    expect(typeof store.toggleMeasurementVisibility).toBe('function');
    expect(typeof store.deleteMeasurement).toBe('function');
    expect(typeof store.clearAllMeasurements).toBe('function');
    expect(typeof store.selectMeasurement).toBe('function');
    expect(typeof store.setMeasurementUnit).toBe('function');
    expect(typeof store.toggleMeasurementDisplay).toBe('function');
  });

  test('store has measurement state initialized', () => {
    const store = useAppStore.getState();

    expect(store.drawing.measurement).toBeDefined();
    expect(store.drawing.measurement.isActive).toBe(false);
    expect(store.drawing.measurement.isMeasuring).toBe(false);
    expect(store.drawing.measurement.startPoint).toBeNull();
    expect(store.drawing.measurement.previewEndPoint).toBeNull();
    expect(Array.isArray(store.drawing.measurement.measurements)).toBe(true);
    expect(store.drawing.measurement.measurements).toHaveLength(0);
    expect(store.drawing.measurement.selectedMeasurementId).toBeNull();
    expect(store.drawing.measurement.showMeasurements).toBe(true);
    expect(store.drawing.measurement.unit).toBe('metric');
  });

  test('measure tool is included in DrawingTool type', () => {
    const store = useAppStore.getState();

    // Verify that we can set the active tool to 'measure'
    store.setActiveTool('measure');
    expect(store.drawing.activeTool).toBe('measure');
  });
});