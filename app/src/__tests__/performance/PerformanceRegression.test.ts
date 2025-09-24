import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'perf_hooks';
import { useDrawingStore } from '../../store/useDrawingStore';
import { useComparisonStore } from '../../store/useComparisonStore';
import { useConversionStore } from '../../store/useConversionStore';
import { useMeasurementStore } from '../../store/useMeasurementStore';
import { GeometryLoader } from '../../utils/GeometryLoader';
import { performanceMonitor } from '../../utils/PerformanceMonitor';
import { validationService } from '../../utils/ValidationService';

// Performance benchmarks - these represent acceptable performance thresholds
const PERFORMANCE_BUDGETS = {
  storeOperations: {
    addShape: 5, // ms
    updateShape: 3, // ms
    deleteShape: 2, // ms
    selectShape: 1, // ms
  },
  calculations: {
    areaCalculation: 10, // ms
    distanceCalculation: 2, // ms
    conversionCalculation: 5, // ms
    validationCheck: 3, // ms
  },
  batchOperations: {
    add100Shapes: 100, // ms
    perform50Conversions: 200, // ms
    validate100Items: 50, // ms
  },
  memoryUsage: {
    maxShapes: 1000, // shapes before performance degradation
    maxMeasurements: 500, // measurements before cleanup
    maxConversions: 100, // conversion history limit
  },
};

describe('Performance Regression Tests', () => {
  beforeEach(() => {
    // Reset all stores to clean state
    useDrawingStore.getState().shapes.forEach(shape => {
      useDrawingStore.getState().deleteShape(shape.id);
    });
    useComparisonStore.getState().hidePanel();
    useConversionStore.getState().hidePanel();
    useConversionStore.getState().clearHistory();
    useMeasurementStore.getState().clearMeasurements();

    // Clear performance monitoring
    performanceMonitor.resetPerformanceStats();
  });

  afterEach(() => {
    // Cleanup
    performanceMonitor.stopMonitoring();
  });

  describe('Store Operations Performance', () => {
    it('should add shapes within performance budget', () => {
      const store = useDrawingStore.getState();

      const startTime = performance.now();

      const shapeId = store.addShape({
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        center: { x: 5, y: 5 },
        rotation: 0,
        layerId: 'main',
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.storeOperations.addShape);
      expect(shapeId).toBeTruthy();
    });

    it('should update shapes within performance budget', () => {
      const store = useDrawingStore.getState();

      // Add a shape first
      const shapeId = store.addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 5, y: 5 }],
        center: { x: 2.5, y: 2.5 },
        rotation: 0,
        layerId: 'main',
      });

      const startTime = performance.now();

      store.updateShape(shapeId, {
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        center: { x: 5, y: 5 },
        rotation: 45,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.storeOperations.updateShape);
    });

    it('should delete shapes within performance budget', () => {
      const store = useDrawingStore.getState();

      // Add a shape first
      const shapeId = store.addShape({
        type: 'circle',
        points: [{ x: 0, y: 0 }, { x: 5, y: 5 }],
        center: { x: 2.5, y: 2.5 },
        rotation: 0,
        layerId: 'main',
      });

      const startTime = performance.now();

      store.deleteShape(shapeId);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.storeOperations.deleteShape);
      expect(store.shapes).toHaveLength(0);
    });

    it('should select shapes within performance budget', () => {
      const store = useDrawingStore.getState();

      // Add a shape first
      const shapeId = store.addShape({
        type: 'polyline',
        points: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 0 }],
        center: { x: 5, y: 3.33 },
        rotation: 0,
        layerId: 'main',
      });

      const startTime = performance.now();

      store.selectShape(shapeId);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.storeOperations.selectShape);
      expect(store.selectedShapeId).toBe(shapeId);
    });
  });

  describe('Calculation Performance', () => {
    it('should calculate area within performance budget', () => {
      const store = useDrawingStore.getState();

      // Create a complex polygon
      const complexPolygon = Array.from({ length: 100 }, (_, i) => ({
        x: Math.cos(i * 0.1) * 10,
        y: Math.sin(i * 0.1) * 10,
      }));

      const startTime = performance.now();

      const shapeId = store.addShape({
        type: 'polyline',
        points: complexPolygon,
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.calculations.areaCalculation);
    });

    it('should calculate distance within performance budget', () => {
      const measurementStore = useMeasurementStore.getState();

      const startTime = performance.now();

      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.setEndPoint({ x: 1000, y: 1000 });
      measurementStore.completeMeasurement();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.calculations.distanceCalculation);
      expect(measurementStore.measurements).toHaveLength(1);
    });

    it('should perform unit conversions within performance budget', () => {
      const conversionStore = useConversionStore.getState();

      conversionStore.setInputValue('1000');
      conversionStore.setSelectedUnit('sqm');

      const startTime = performance.now();

      conversionStore.performConversion();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.calculations.conversionCalculation);
      expect(conversionStore.results.length).toBeGreaterThan(0);
    });

    it('should validate input within performance budget', () => {
      const startTime = performance.now();

      const result = validationService.validate('area-value', 1000);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.calculations.validationCheck);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Batch Operations Performance', () => {
    it('should add 100 shapes within performance budget', () => {
      const store = useDrawingStore.getState();

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        store.addShape({
          type: 'rectangle',
          points: [
            { x: i, y: i },
            { x: i + 1, y: i },
            { x: i + 1, y: i + 1 },
            { x: i, y: i + 1 },
          ],
          center: { x: i + 0.5, y: i + 0.5 },
          rotation: 0,
          layerId: 'main',
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.batchOperations.add100Shapes);
      expect(store.shapes).toHaveLength(100);
    });

    it('should perform 50 conversions within performance budget', () => {
      const conversionStore = useConversionStore.getState();

      const startTime = performance.now();

      for (let i = 1; i <= 50; i++) {
        conversionStore.setInputValue(i.toString());
        conversionStore.setSelectedUnit('sqm');
        conversionStore.performConversion();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.batchOperations.perform50Conversions);
      expect(conversionStore.history.length).toBeGreaterThan(0);
    });

    it('should validate 100 items within performance budget', () => {
      const values = Array.from({ length: 100 }, (_, i) => ({
        category: 'area-value',
        value: (i + 1) * 10,
        id: `item-${i}`,
      }));

      const startTime = performance.now();

      const result = validationService.validateBatch(values);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.batchOperations.validate100Items);
      expect(result.results).toHaveLength(100);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle maximum shapes without performance degradation', () => {
      const store = useDrawingStore.getState();

      // Add shapes up to the limit
      const startTime = performance.now();

      for (let i = 0; i < PERFORMANCE_BUDGETS.memoryUsage.maxShapes; i++) {
        store.addShape({
          type: 'rectangle',
          points: [
            { x: i % 100, y: Math.floor(i / 100) },
            { x: (i % 100) + 1, y: Math.floor(i / 100) },
            { x: (i % 100) + 1, y: Math.floor(i / 100) + 1 },
            { x: i % 100, y: Math.floor(i / 100) + 1 },
          ],
          center: { x: (i % 100) + 0.5, y: Math.floor(i / 100) + 0.5 },
          rotation: 0,
          layerId: 'main',
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time even with max shapes
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(store.shapes).toHaveLength(PERFORMANCE_BUDGETS.memoryUsage.maxShapes);

      // Test that operations are still fast with max shapes
      const selectStartTime = performance.now();
      store.selectShape(store.shapes[500].id);
      const selectEndTime = performance.now();
      const selectDuration = selectEndTime - selectStartTime;

      expect(selectDuration).toBeLessThan(10); // Should still be fast
    });

    it('should manage measurement history efficiently', () => {
      const measurementStore = useMeasurementStore.getState();

      // Add measurements up to the limit
      for (let i = 0; i < PERFORMANCE_BUDGETS.memoryUsage.maxMeasurements; i++) {
        measurementStore.startMeasurement();
        measurementStore.setStartPoint({ x: i, y: i });
        measurementStore.setEndPoint({ x: i + 1, y: i + 1 });
        measurementStore.completeMeasurement();
      }

      expect(measurementStore.measurements.length).toBeLessThanOrEqual(
        PERFORMANCE_BUDGETS.memoryUsage.maxMeasurements
      );

      // Test that new measurements still work efficiently
      const startTime = performance.now();

      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 1000, y: 1000 });
      measurementStore.setEndPoint({ x: 1001, y: 1001 });
      measurementStore.completeMeasurement();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.calculations.distanceCalculation);
    });

    it('should manage conversion history efficiently', () => {
      const conversionStore = useConversionStore.getState();

      // Add conversions up to the limit
      for (let i = 0; i < PERFORMANCE_BUDGETS.memoryUsage.maxConversions + 10; i++) {
        conversionStore.setInputValue((i + 1).toString());
        conversionStore.setSelectedUnit('sqm');
        conversionStore.performConversion();
      }

      // Should limit history size
      expect(conversionStore.history.length).toBeLessThanOrEqual(
        PERFORMANCE_BUDGETS.memoryUsage.maxConversions
      );

      // New conversions should still be fast
      const startTime = performance.now();

      conversionStore.setInputValue('9999');
      conversionStore.performConversion();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.calculations.conversionCalculation);
    });
  });

  describe('Geometry Loading Performance', () => {
    it('should load geometries within reasonable time', async () => {
      const geometryLoader = new GeometryLoader();

      const startTime = performance.now();

      try {
        // This would load actual geometry in real implementation
        // For test, we just measure the loader setup
        const cacheKey = geometryLoader.getCacheKey('test-geometry', {});

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(10); // Very fast operation
        expect(typeof cacheKey).toBe('string');
      } finally {
        geometryLoader.dispose();
      }
    });

    it('should manage geometry cache efficiently', async () => {
      const geometryLoader = new GeometryLoader(10); // Small cache for testing

      try {
        // Test cache performance with multiple geometries
        const startTime = performance.now();

        for (let i = 0; i < 20; i++) {
          const cacheKey = geometryLoader.getCacheKey(`geometry-${i}`, { version: 1 });
          // Simulate cache operations
          expect(typeof cacheKey).toBe('string');
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(50); // Should be very fast
      } finally {
        geometryLoader.dispose();
      }
    });
  });

  describe('Performance Monitoring Overhead', () => {
    it('should add minimal overhead when monitoring performance', () => {
      // Test performance monitoring overhead
      const testFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      // Without monitoring
      const startTimeWithout = performance.now();
      const resultWithout = testFunction();
      const endTimeWithout = performance.now();
      const durationWithout = endTimeWithout - startTimeWithout;

      // With monitoring
      const startTimeWith = performance.now();
      const resultWith = performanceMonitor.measureFunction('test-function', testFunction);
      const endTimeWith = performance.now();
      const durationWith = endTimeWith - startTimeWith;

      expect(resultWith).toBe(resultWithout);

      // Monitoring should add less than 50% overhead
      const overhead = (durationWith - durationWithout) / durationWithout;
      expect(overhead).toBeLessThan(0.5);
    });

    it('should record metrics efficiently', () => {
      const startTime = performance.now();

      // Record many metrics
      for (let i = 0; i < 1000; i++) {
        performanceMonitor.recordMetric({
          name: `test-metric-${i % 10}`,
          value: i,
          timestamp: Date.now(),
          category: 'interaction',
          unit: 'ms',
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should record 1000 metrics very quickly
      expect(duration).toBeLessThan(100);

      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.metrics.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Performance Under Load', () => {
    it('should validate complex polygons efficiently', () => {
      // Create a very complex polygon
      const complexPolygon = Array.from({ length: 500 }, (_, i) => ({
        x: Math.cos(i * 0.1) * 100 + Math.random() * 10,
        y: Math.sin(i * 0.1) * 100 + Math.random() * 10,
      }));

      const startTime = performance.now();

      const result = validationService.validate('polygon', complexPolygon);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should handle complex polygons quickly
      expect(result.isValid).toBe(true);
    });

    it('should handle validation rule cascades efficiently', () => {
      // Add multiple rules to same category
      for (let i = 0; i < 10; i++) {
        validationService.addRule('performance-test', {
          name: `rule-${i}`,
          validate: (value: number) => ({
            isValid: value > i,
            errors: value <= i ? [`Failed rule ${i}`] : [],
            warnings: [],
          }),
          priority: 'error',
        });
      }

      const startTime = performance.now();

      // This will trigger all 10 rules
      const result = validationService.validate('performance-test', 15);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(20); // Should handle multiple rules quickly
      expect(result.isValid).toBe(true);
    });
  });

  describe('Real-World Performance Scenarios', () => {
    it('should maintain performance with realistic workload', () => {
      // Simulate a realistic user session
      const drawingStore = useDrawingStore.getState();
      const measurementStore = useMeasurementStore.getState();
      const comparisonStore = useComparisonStore.getState();
      const conversionStore = useConversionStore.getState();

      const startTime = performance.now();

      // User draws 20 shapes
      for (let i = 0; i < 20; i++) {
        drawingStore.addShape({
          type: i % 2 === 0 ? 'rectangle' : 'circle',
          points: [
            { x: i * 5, y: i * 3 },
            { x: i * 5 + 3, y: i * 3 + 2 },
          ],
          center: { x: i * 5 + 1.5, y: i * 3 + 1 },
          rotation: i * 10,
          layerId: 'main',
        });
      }

      // User makes 10 measurements
      for (let i = 0; i < 10; i++) {
        measurementStore.startMeasurement();
        measurementStore.setStartPoint({ x: i, y: i });
        measurementStore.setEndPoint({ x: i + 5, y: i + 3 });
        measurementStore.completeMeasurement();
      }

      // User performs 15 conversions
      for (let i = 1; i <= 15; i++) {
        conversionStore.setInputValue((i * 100).toString());
        conversionStore.setSelectedUnit('sqm');
        conversionStore.performConversion();
      }

      // User uses comparison tool
      comparisonStore.setLandArea(500, 'sqm');
      comparisonStore.toggleObjectSelection('soccer-field');
      comparisonStore.toggleObjectSelection('tennis-court');
      comparisonStore.toggleObjectSelection('basketball-court');

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Entire realistic session should complete quickly
      expect(totalDuration).toBeLessThan(500); // Half a second for full workflow

      // Verify all operations completed correctly
      expect(drawingStore.shapes).toHaveLength(20);
      expect(measurementStore.measurements).toHaveLength(10);
      expect(conversionStore.history.length).toBeGreaterThan(0);
      expect(comparisonStore.comparisons).toHaveLength(3);
    });

    it('should handle concurrent operations efficiently', async () => {
      const drawingStore = useDrawingStore.getState();
      const conversionStore = useConversionStore.getState();

      const startTime = performance.now();

      // Simulate concurrent operations
      const shapePromises = Array.from({ length: 50 }, (_, i) =>
        Promise.resolve(drawingStore.addShape({
          type: 'rectangle',
          points: [{ x: i, y: i }, { x: i + 1, y: i + 1 }],
          center: { x: i + 0.5, y: i + 0.5 },
          rotation: 0,
          layerId: 'main',
        }))
      );

      const conversionPromises = Array.from({ length: 25 }, (_, i) =>
        Promise.resolve().then(() => {
          conversionStore.setInputValue((i * 50).toString());
          conversionStore.setSelectedUnit('sqm');
          conversionStore.performConversion();
        })
      );

      await Promise.all([...shapePromises, ...conversionPromises]);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Should handle concurrent operations quickly
      expect(drawingStore.shapes).toHaveLength(50);
      expect(conversionStore.history.length).toBeGreaterThan(0);
    });
  });
});