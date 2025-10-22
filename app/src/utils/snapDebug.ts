import type { SnapPoint, Point2D } from '../types';

interface SnapDebugInfo {
  snapPointsGenerated: number;
  snapPointsFiltered: number;
  cursorPosition: Point2D | null;
  activeSnapPoint: SnapPoint | null;
  performanceMetrics: {
    updateTime: number;
    renderTime: number;
    cacheHits: number;
  };
}

/**
 * Debug utility for snap detection system
 * Provides performance monitoring and troubleshooting tools
 */
export class SnapDebugger {
  private static instance: SnapDebugger;
  private debugMode = false;
  private metrics: SnapDebugInfo = {
    snapPointsGenerated: 0,
    snapPointsFiltered: 0,
    cursorPosition: null,
    activeSnapPoint: null,
    performanceMetrics: {
      updateTime: 0,
      renderTime: 0,
      cacheHits: 0
    }
  };

  static getInstance(): SnapDebugger {
    if (!SnapDebugger.instance) {
      SnapDebugger.instance = new SnapDebugger();
    }
    return SnapDebugger.instance;
  }

  /**
   * Enable debug mode with console logging
   */
  enable(): void {
    this.debugMode = true;
  }

  /**
   * Disable debug mode
   */
  disable(): void {
    this.debugMode = false;
  }

  /**
   * Log snap detection information
   */
  logSnapDetection(info: Partial<SnapDebugInfo>): void {
    if (!this.debugMode) return;

    this.metrics = { ...this.metrics, ...info };
  }

  /**
   * Log performance timing
   */
  logPerformance(operation: string, duration: number): void {
    if (!this.debugMode) return;
  }

  /**
   * Log cache operations
   */
  logCache(operation: 'hit' | 'miss' | 'clear', key?: string): void {
    if (!this.debugMode) return;

    if (operation === 'hit') {
      this.metrics.performanceMetrics.cacheHits++;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): SnapDebugInfo {
    return { ...this.metrics };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      snapPointsGenerated: 0,
      snapPointsFiltered: 0,
      cursorPosition: null,
      activeSnapPoint: null,
      performanceMetrics: {
        updateTime: 0,
        renderTime: 0,
        cacheHits: 0
      }
    };
  }

  /**
   * Log snap radius information
   */
  logSnapRadius(mode: '2D' | '3D', radius: number): void {
    if (!this.debugMode) return;
  }

  /**
   * Log grid generation details
   */
  logGridGeneration(generated: number, cached: number): void {
    if (!this.debugMode) return;
  }
}

// Global debug access
if (typeof window !== 'undefined') {
  (window as any).snapDebug = SnapDebugger.getInstance();
}

export const snapDebugger = SnapDebugger.getInstance();