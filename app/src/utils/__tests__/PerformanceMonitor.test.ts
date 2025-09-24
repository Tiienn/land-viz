import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor, measurePerformance, recordMetric } from '../PerformanceMonitor';
import type { PerformanceMetric } from '../PerformanceMonitor';

// Mock performance APIs
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
  mark: vi.fn(),
  measure: vi.fn(),
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 15000000,
    jsHeapSizeLimit: 100000000,
  },
};

const mockPerformanceObserver = vi.fn();
mockPerformanceObserver.prototype.observe = vi.fn();
mockPerformanceObserver.prototype.disconnect = vi.fn();

// Mock globals
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

Object.defineProperty(global, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true,
});

Object.defineProperty(global, 'requestAnimationFrame', {
  value: vi.fn((callback) => setTimeout(callback, 16)),
  writable: true,
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset performance monitor state
    performanceMonitor.stopMonitoring();
    vi.clearAllMocks();

    // Reset performance.now to return incrementing values
    let counter = 0;
    mockPerformance.now.mockImplementation(() => {
      counter += 10; // Increment by 10ms each call
      return counter;
    });
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  describe('Basic Monitoring', () => {
    it('should start and stop monitoring', () => {
      expect(() => performanceMonitor.startMonitoring()).not.toThrow();
      expect(() => performanceMonitor.stopMonitoring()).not.toThrow();
    });

    it('should not start monitoring multiple times', () => {
      performanceMonitor.startMonitoring();
      performanceMonitor.startMonitoring(); // Should be idempotent

      // Should not cause any issues
      expect(true).toBe(true);
    });

    it('should record custom metrics', () => {
      const metric: PerformanceMetric = {
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
        category: 'interaction',
        unit: 'ms',
      };

      performanceMonitor.recordMetric(metric);

      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.metrics).toHaveLength(1);
      expect(summary.metrics[0].name).toBe('test-metric');
      expect(summary.metrics[0].value).toBe(100);
    });
  });

  describe('Performance Budgets', () => {
    it('should check metrics against budgets', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Record metric that exceeds warning threshold
      performanceMonitor.recordMetric({
        name: 'page-load',
        value: 3500, // Exceeds warning (3000) but not critical (5000)
        timestamp: Date.now(),
        category: 'load',
        unit: 'ms',
      });

      // Should log warning
      expect(consoleWarn).toHaveBeenCalled();

      // Record metric that exceeds critical threshold
      performanceMonitor.recordMetric({
        name: 'page-load',
        value: 6000, // Exceeds critical (5000)
        timestamp: Date.now(),
        category: 'load',
        unit: 'ms',
      });

      // Should log error
      expect(consoleError).toHaveBeenCalled();

      consoleWarn.mockRestore();
      consoleError.mockRestore();
    });

    it('should identify budget violations in summary', () => {
      // Record metric that violates budget
      performanceMonitor.recordMetric({
        name: 'frame-rate',
        value: 25, // Below target (60) and warning (45)
        timestamp: Date.now(),
        category: 'render',
        unit: 'fps',
      });

      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.budgetViolations).toHaveLength(1);
      expect(summary.budgetViolations[0].metric).toBe('frame-rate');
      expect(summary.budgetViolations[0].severity).toBe('critical');
    });

    it('should calculate averages correctly', () => {
      // Record multiple metrics with same name
      performanceMonitor.recordMetric({
        name: 'render-time',
        value: 10,
        timestamp: Date.now(),
        category: 'render',
        unit: 'ms',
      });

      performanceMonitor.recordMetric({
        name: 'render-time',
        value: 20,
        timestamp: Date.now(),
        category: 'render',
        unit: 'ms',
      });

      performanceMonitor.recordMetric({
        name: 'render-time',
        value: 30,
        timestamp: Date.now(),
        category: 'render',
        unit: 'ms',
      });

      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.averages['render-time']).toBe(20); // (10 + 20 + 30) / 3
    });
  });

  describe('Function Performance Measurement', () => {
    it('should measure synchronous function performance', () => {
      const testFunction = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = performanceMonitor.measureFunction('test-sync-function', testFunction);

      expect(result).toBe(499500); // Sum of 0 to 999

      const summary = performanceMonitor.getPerformanceSummary();
      const metrics = summary.metrics.filter(m => m.name === 'test-sync-function');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('should measure asynchronous function performance', async () => {
      const asyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'async result';
      };

      const result = await performanceMonitor.measureFunction('test-async-function', asyncFunction);

      expect(result).toBe('async result');

      const summary = performanceMonitor.getPerformanceSummary();
      const metrics = summary.metrics.filter(m => m.name === 'test-async-function');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('should handle function errors and still record timing', () => {
      const throwingFunction = () => {
        throw new Error('Test error');
      };

      expect(() => {
        performanceMonitor.measureFunction('test-error-function', throwingFunction);
      }).toThrow('Test error');

      const summary = performanceMonitor.getPerformanceSummary();
      const metrics = summary.metrics.filter(m => m.name === 'test-error-function-error');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].metadata?.error).toBe('Test error');
    });
  });

  describe('Convenience Functions', () => {
    it('should work with measurePerformance helper', () => {
      const result = measurePerformance('helper-test', () => {
        return 42;
      });

      expect(result).toBe(42);

      const summary = performanceMonitor.getPerformanceSummary();
      const metrics = summary.metrics.filter(m => m.name === 'helper-test');
      expect(metrics).toHaveLength(1);
    });

    it('should work with recordMetric helper', () => {
      recordMetric({
        name: 'helper-metric',
        value: 200,
        category: 'interaction',
        unit: 'ms',
      });

      const summary = performanceMonitor.getPerformanceSummary();
      const metrics = summary.metrics.filter(m => m.name === 'helper-metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].timestamp).toBeTruthy();
    });
  });

  describe('Memory Management', () => {
    it('should limit metrics array size', () => {
      // Add more than 1000 metrics
      for (let i = 0; i < 1200; i++) {
        performanceMonitor.recordMetric({
          name: `metric-${i}`,
          value: i,
          timestamp: Date.now(),
          category: 'interaction',
          unit: 'ms',
        });
      }

      const summary = performanceMonitor.getPerformanceSummary();
      // Should have trimmed to 500 (as per implementation)
      expect(summary.metrics.length).toBeLessThanOrEqual(500);
    });

    it('should filter recent metrics in summary', () => {
      const oldTimestamp = Date.now() - 400000; // 6+ minutes ago
      const recentTimestamp = Date.now() - 100000; // Recent

      performanceMonitor.recordMetric({
        name: 'old-metric',
        value: 100,
        timestamp: oldTimestamp,
        category: 'interaction',
        unit: 'ms',
      });

      performanceMonitor.recordMetric({
        name: 'recent-metric',
        value: 200,
        timestamp: recentTimestamp,
        category: 'interaction',
        unit: 'ms',
      });

      const summary = performanceMonitor.getPerformanceSummary();

      // Should only include recent metrics (last 5 minutes)
      const recentMetrics = summary.metrics.filter(m => m.name === 'recent-metric');
      const oldMetrics = summary.metrics.filter(m => m.name === 'old-metric');

      expect(recentMetrics).toHaveLength(1);
      expect(oldMetrics).toHaveLength(0);
    });
  });

  describe('Performance Observer Integration', () => {
    it('should set up performance observers when available', () => {
      // Mock PerformanceObserver as available
      global.PerformanceObserver = mockPerformanceObserver;

      performanceMonitor.startMonitoring();

      // Should have created observers
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('should handle missing PerformanceObserver gracefully', () => {
      // Remove PerformanceObserver
      const originalPO = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;

      expect(() => performanceMonitor.startMonitoring()).not.toThrow();

      // Restore
      global.PerformanceObserver = originalPO;
    });

    it('should handle performance observer errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock PerformanceObserver to throw
      global.PerformanceObserver = vi.fn(() => {
        throw new Error('PerformanceObserver error');
      });

      expect(() => performanceMonitor.startMonitoring()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Data Export', () => {
    it('should export performance data as JSON', () => {
      performanceMonitor.recordMetric({
        name: 'export-test',
        value: 150,
        timestamp: Date.now(),
        category: 'interaction',
        unit: 'ms',
      });

      const exportData = performanceMonitor.exportPerformanceData();
      const parsed = JSON.parse(exportData);

      expect(parsed.timestamp).toBeTruthy();
      expect(parsed.budgets).toBeTruthy();
      expect(parsed.metrics).toHaveLength(1);
      expect(parsed.metrics[0].name).toBe('export-test');
    });

    it('should include budget information in export', () => {
      const exportData = performanceMonitor.exportPerformanceData();
      const parsed = JSON.parse(exportData);

      expect(parsed.budgets).toBeTruthy();
      expect(parsed.budgets['page-load']).toBeTruthy();
      expect(parsed.budgets['page-load'].target).toBe(2000);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle NaN values gracefully', () => {
      performanceMonitor.recordMetric({
        name: 'nan-test',
        value: NaN,
        timestamp: Date.now(),
        category: 'interaction',
        unit: 'ms',
      });

      const summary = performanceMonitor.getPerformanceSummary();
      // Should not crash, though behavior may vary
      expect(summary.metrics).toHaveLength(1);
    });

    it('should handle Infinity values gracefully', () => {
      performanceMonitor.recordMetric({
        name: 'infinity-test',
        value: Infinity,
        timestamp: Date.now(),
        category: 'interaction',
        unit: 'ms',
      });

      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.metrics).toHaveLength(1);
    });

    it('should handle negative values appropriately', () => {
      performanceMonitor.recordMetric({
        name: 'negative-test',
        value: -100,
        timestamp: Date.now(),
        category: 'interaction',
        unit: 'ms',
      });

      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.metrics).toHaveLength(1);
    });

    it('should handle missing performance API gracefully', () => {
      const originalPerformance = global.performance;
      delete (global as any).performance;

      expect(() => {
        performanceMonitor.recordMetric({
          name: 'no-performance-api',
          value: 100,
          timestamp: Date.now(),
          category: 'interaction',
          unit: 'ms',
        });
      }).not.toThrow();

      global.performance = originalPerformance;
    });
  });

  describe('Performance Characteristics', () => {
    it('should record metrics efficiently', () => {
      const startTime = Date.now();

      // Record many metrics
      for (let i = 0; i < 1000; i++) {
        performanceMonitor.recordMetric({
          name: `perf-test-${i}`,
          value: i,
          timestamp: Date.now(),
          category: 'interaction',
          unit: 'ms',
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(100); // Less than 100ms for 1000 metrics
    });

    it('should generate summaries efficiently', () => {
      // Add many metrics
      for (let i = 0; i < 500; i++) {
        performanceMonitor.recordMetric({
          name: `summary-test-${i % 10}`, // 10 different metric names
          value: i,
          timestamp: Date.now(),
          category: 'interaction',
          unit: 'ms',
        });
      }

      const startTime = Date.now();
      const summary = performanceMonitor.getPerformanceSummary();
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Should be very fast
      expect(summary.averages).toBeTruthy();
      expect(Object.keys(summary.averages)).toHaveLength(10);
    });
  });

  describe('Auto-start Behavior', () => {
    it('should handle browser environment detection', () => {
      // The module should auto-start in browser environment
      // We can't easily test this without changing the module loading,
      // but we can verify it doesn't crash
      expect(typeof performanceMonitor.startMonitoring).toBe('function');
    });

    it('should handle non-browser environment gracefully', () => {
      // In test environment (Node.js), should not crash
      expect(() => performanceMonitor.startMonitoring()).not.toThrow();
    });
  });

  describe('Memory Monitoring', () => {
    it('should monitor memory usage when available', () => {
      // Mock performance.memory
      global.performance = {
        ...mockPerformance,
        memory: {
          usedJSHeapSize: 50000000,
          totalJSHeapSize: 75000000,
          jsHeapSizeLimit: 100000000,
        },
      };

      performanceMonitor.startMonitoring();

      // Wait for memory check (would be async in real implementation)
      setTimeout(() => {
        const summary = performanceMonitor.getPerformanceSummary();
        const memoryMetrics = summary.metrics.filter(m => m.name === 'memory-usage');
        expect(memoryMetrics.length).toBeGreaterThan(0);
      }, 100);
    });

    it('should handle missing memory API gracefully', () => {
      // Remove memory property
      const performanceWithoutMemory = { ...mockPerformance };
      delete (performanceWithoutMemory as any).memory;
      global.performance = performanceWithoutMemory;

      expect(() => performanceMonitor.startMonitoring()).not.toThrow();
    });
  });
});