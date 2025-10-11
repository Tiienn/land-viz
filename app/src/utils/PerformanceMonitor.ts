import { logger } from './logger';

/**
 * Performance monitoring service for tracking application metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'load' | 'render' | 'interaction' | 'memory' | 'bundle';
  unit: 'ms' | 'bytes' | 'fps' | 'count' | 'percent';
  metadata?: Record<string, any>;
}

export interface PerformanceBudget {
  metric: string;
  target: number;
  warning: number;
  critical: number;
  unit: string;
}

class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private budgets = new Map<string, PerformanceBudget>();
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  constructor() {
    this.initializeDefaultBudgets();
    this.setupPerformanceObservers();
  }

  /**
   * Initialize performance budgets based on project requirements
   */
  private initializeDefaultBudgets(): void {
    const budgets: PerformanceBudget[] = [
      // Loading performance
      { metric: 'page-load', target: 2000, warning: 3000, critical: 5000, unit: 'ms' },
      { metric: 'first-contentful-paint', target: 1000, warning: 1500, critical: 2500, unit: 'ms' },
      { metric: 'largest-contentful-paint', target: 2000, warning: 2500, critical: 4000, unit: 'ms' },
      { metric: 'cumulative-layout-shift', target: 0.1, warning: 0.15, critical: 0.25, unit: 'score' },

      // Rendering performance
      { metric: 'frame-rate', target: 60, warning: 45, critical: 30, unit: 'fps' },
      { metric: 'render-time', target: 16, warning: 33, critical: 50, unit: 'ms' },
      { metric: 'geometry-load-time', target: 500, warning: 1000, critical: 2000, unit: 'ms' },

      // Memory usage
      { metric: 'memory-usage', target: 50, warning: 75, critical: 90, unit: 'percent' },
      { metric: 'geometry-cache-size', target: 100, warning: 150, critical: 200, unit: 'MB' },

      // Bundle size
      { metric: 'bundle-size', target: 3, warning: 4, critical: 5, unit: 'MB' },
      { metric: 'chunk-size', target: 500, warning: 750, critical: 1000, unit: 'KB' },

      // Interaction responsiveness
      { metric: 'click-response', target: 100, warning: 200, critical: 500, unit: 'ms' },
      { metric: 'tool-switch-time', target: 50, warning: 100, critical: 200, unit: 'ms' },
    ];

    budgets.forEach(budget => {
      this.budgets.set(budget.metric, budget);
    });
  }

  /**
   * Setup performance observers for automatic metric collection
   */
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      logger.warn('Performance Observer not supported');
      return;
    }

    try {
      // Observe paint metrics
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric({
            name: entry.name,
            value: entry.startTime,
            timestamp: Date.now(),
            category: 'load',
            unit: 'ms',
          });
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe layout shift metrics
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          this.recordMetric({
            name: 'cumulative-layout-shift',
            value: entry.value,
            timestamp: Date.now(),
            category: 'render',
            unit: 'percent',
          });
        });
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(layoutShiftObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric({
            name: 'largest-contentful-paint',
            value: entry.startTime,
            timestamp: Date.now(),
            category: 'load',
            unit: 'ms',
          });
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

    } catch (error) {
      logger.error('Error setting up performance observers', { error });
    }
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.recordPageLoadMetrics();
    this.startMemoryMonitoring();
    this.startFrameRateMonitoring();

    logger.info('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    logger.info('Performance monitoring stopped');
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Check against budget
    this.checkBudget(metric);

    // Log significant metrics
    if (metric.category === 'load' || metric.value > 1000) {
      logger.info('Performance metric recorded', metric);
    }

    // Limit metrics array size
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  /**
   * Measure and record function execution time
   */
  measureFunction<T>(name: string, fn: () => T, category: PerformanceMetric['category'] = 'interaction'): T {
    const startTime = performance.now();

    try {
      const result = fn();

      // Handle async functions
      if (result instanceof Promise) {
        return result.then((value) => {
          const endTime = performance.now();
          this.recordMetric({
            name,
            value: endTime - startTime,
            timestamp: Date.now(),
            category,
            unit: 'ms',
          });
          return value;
        }) as T;
      }

      const endTime = performance.now();
      this.recordMetric({
        name,
        value: endTime - startTime,
        timestamp: Date.now(),
        category,
        unit: 'ms',
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric({
        name: `${name}-error`,
        value: endTime - startTime,
        timestamp: Date.now(),
        category,
        unit: 'ms',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
  }

  /**
   * Record page load metrics
   */
  private recordPageLoadMetrics(): void {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    // Record key load metrics
    this.recordMetric({
      name: 'page-load',
      value: navigation.loadEventEnd - navigation.fetchStart,
      timestamp: Date.now(),
      category: 'load',
      unit: 'ms',
    });

    this.recordMetric({
      name: 'dom-content-loaded',
      value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      timestamp: Date.now(),
      category: 'load',
      unit: 'ms',
    });

    this.recordMetric({
      name: 'first-byte',
      value: navigation.responseStart - navigation.requestStart,
      timestamp: Date.now(),
      category: 'load',
      unit: 'ms',
    });
  }

  /**
   * Monitor memory usage
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !(performance as any).memory) return;

    const checkMemory = () => {
      if (!this.isMonitoring) return;

      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      this.recordMetric({
        name: 'memory-usage',
        value: usagePercent,
        timestamp: Date.now(),
        category: 'memory',
        unit: 'percent',
        metadata: {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        },
      });

      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };

    checkMemory();
  }

  /**
   * Monitor frame rate
   */
  private startFrameRateMonitoring(): void {
    if (typeof window === 'undefined') return;

    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrameRate = () => {
      if (!this.isMonitoring) return;

      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) { // Every second
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        this.recordMetric({
          name: 'frame-rate',
          value: fps,
          timestamp: Date.now(),
          category: 'render',
          unit: 'fps',
        });
      }

      requestAnimationFrame(measureFrameRate);
    };

    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Check metric against budget and issue warnings
   */
  private checkBudget(metric: PerformanceMetric): void {
    const budget = this.budgets.get(metric.name);
    if (!budget) return;

    const value = metric.value;

    if (value > budget.critical) {
      logger.error('Performance budget critical violation', {
        metric: metric.name,
        value,
        budget: budget.critical,
        unit: budget.unit,
      });
    } else if (value > budget.warning) {
      logger.warn('Performance budget warning', {
        metric: metric.name,
        value,
        budget: budget.warning,
        unit: budget.unit,
      });
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    metrics: PerformanceMetric[];
    budgetViolations: Array<{ metric: string; value: number; budget: number; severity: 'warning' | 'critical' }>;
    averages: Record<string, number>;
  } {
    const recent = this.metrics.filter(m => Date.now() - m.timestamp < 300000); // Last 5 minutes

    // Calculate averages
    const averages: Record<string, number> = {};
    const metricGroups = recent.reduce((groups, metric) => {
      if (!groups[metric.name]) groups[metric.name] = [];
      groups[metric.name].push(metric.value);
      return groups;
    }, {} as Record<string, number[]>);

    Object.entries(metricGroups).forEach(([name, values]) => {
      averages[name] = values.reduce((sum, v) => sum + v, 0) / values.length;
    });

    // Check budget violations
    const budgetViolations: Array<{ metric: string; value: number; budget: number; severity: 'warning' | 'critical' }> = [];

    Object.entries(averages).forEach(([metricName, avgValue]) => {
      const budget = this.budgets.get(metricName);
      if (budget) {
        if (avgValue > budget.critical) {
          budgetViolations.push({
            metric: metricName,
            value: avgValue,
            budget: budget.critical,
            severity: 'critical',
          });
        } else if (avgValue > budget.warning) {
          budgetViolations.push({
            metric: metricName,
            value: avgValue,
            budget: budget.warning,
            severity: 'warning',
          });
        }
      }
    });

    return {
      metrics: recent,
      budgetViolations,
      averages,
    };
  }

  /**
   * Export performance data
   */
  exportPerformanceData(): string {
    const summary = this.getPerformanceSummary();

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      budgets: Object.fromEntries(this.budgets),
      ...summary,
    }, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitorService();

// Convenience functions
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  return performanceMonitor.measureFunction(name, fn);
};

export const recordMetric = (metric: Omit<PerformanceMetric, 'timestamp'>): void => {
  performanceMonitor.recordMetric({
    ...metric,
    timestamp: Date.now(),
  });
};

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  performanceMonitor.startMonitoring();
}