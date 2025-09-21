import { describe, test, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';
import type { Point2D } from '@/types';

describe('Measurement Store - Basic Functionality', () => {
  beforeEach(() => {
    useAppStore.getState().clearAll();
  });

  test('activates measurement tool correctly', () => {
    const store = useAppStore.getState();

    expect(store.drawing.activeTool).toBe('select');
    expect(store.drawing.measurement.isActive).toBe(false);

    store.activateMeasurementTool();

    const updatedStore = useAppStore.getState();
    expect(updatedStore.drawing.activeTool).toBe('measure');
    expect(updatedStore.drawing.measurement.isActive).toBe(true);
  });

  test('creates measurement correctly', () => {
    const store = useAppStore.getState();
    const startPoint: Point2D = { x: 0, y: 0 };
    const endPoint: Point2D = { x: 3, y: 4 };

    store.activateMeasurementTool();
    store.startMeasurement(startPoint);
    store.completeMeasurement(endPoint);

    const finalStore = useAppStore.getState();
    expect(finalStore.drawing.measurement.measurements).toHaveLength(1);

    const measurement = finalStore.drawing.measurement.measurements[0];
    expect(measurement.distance).toBe(5); // 3-4-5 triangle
    expect(measurement.startPoint.position).toEqual(startPoint);
    expect(measurement.endPoint.position).toEqual(endPoint);
    expect(measurement.unit).toBe('metric');
    expect(measurement.visible).toBe(true);
  });

  test('cancels measurement correctly', () => {
    const store = useAppStore.getState();
    const startPoint: Point2D = { x: 0, y: 0 };

    store.activateMeasurementTool();
    store.startMeasurement(startPoint);

    let midStore = useAppStore.getState();
    expect(midStore.drawing.measurement.isMeasuring).toBe(true);
    expect(midStore.drawing.measurement.startPoint).not.toBeNull();

    store.cancelMeasurement();

    const finalStore = useAppStore.getState();
    expect(finalStore.drawing.measurement.isMeasuring).toBe(false);
    expect(finalStore.drawing.measurement.startPoint).toBeNull();
    expect(finalStore.drawing.measurement.measurements).toHaveLength(0);
  });

  test('manages measurement visibility correctly', () => {
    const store = useAppStore.getState();

    store.activateMeasurementTool();
    store.startMeasurement({ x: 0, y: 0 });
    store.completeMeasurement({ x: 10, y: 0 });

    const midStore = useAppStore.getState();
    const measurementId = midStore.drawing.measurement.measurements[0].id;
    expect(midStore.drawing.measurement.measurements[0].visible).toBe(true);

    store.toggleMeasurementVisibility(measurementId);

    const finalStore = useAppStore.getState();
    expect(finalStore.drawing.measurement.measurements[0].visible).toBe(false);
  });

  test('deletes measurement correctly', () => {
    const store = useAppStore.getState();

    store.activateMeasurementTool();
    store.startMeasurement({ x: 0, y: 0 });
    store.completeMeasurement({ x: 10, y: 0 });

    const midStore = useAppStore.getState();
    const measurementId = midStore.drawing.measurement.measurements[0].id;
    expect(midStore.drawing.measurement.measurements).toHaveLength(1);

    store.deleteMeasurement(measurementId);

    const finalStore = useAppStore.getState();
    expect(finalStore.drawing.measurement.measurements).toHaveLength(0);
  });

  test('changes measurement unit correctly', () => {
    const store = useAppStore.getState();

    expect(store.drawing.measurement.unit).toBe('metric');

    store.setMeasurementUnit('imperial');

    const updatedStore = useAppStore.getState();
    expect(updatedStore.drawing.measurement.unit).toBe('imperial');
  });

  test('validates measurement points', () => {
    const store = useAppStore.getState();
    const samePoint: Point2D = { x: 0, y: 0 };

    store.activateMeasurementTool();
    store.startMeasurement(samePoint);
    store.completeMeasurement(samePoint); // Same point should be invalid

    const finalStore = useAppStore.getState();
    expect(finalStore.drawing.measurement.measurements).toHaveLength(0);
  });

  test('initializes measurement state correctly', () => {
    const store = useAppStore.getState();
    const measurementState = store.drawing.measurement;

    expect(measurementState.isActive).toBe(false);
    expect(measurementState.isMeasuring).toBe(false);
    expect(measurementState.startPoint).toBeNull();
    expect(measurementState.previewEndPoint).toBeNull();
    expect(measurementState.measurements).toEqual([]);
    expect(measurementState.selectedMeasurementId).toBeNull();
    expect(measurementState.showMeasurements).toBe(true);
    expect(measurementState.unit).toBe('metric');
  });
});