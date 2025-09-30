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
    console.log('🔍 Snap Debug Mode: ENABLED');
    console.log('Available commands:');
    console.log('- snapDebug.getMetrics() - View current metrics');
    console.log('- snapDebug.disable() - Disable debug mode');
  }

  /**
   * Disable debug mode
   */
  disable(): void {
    this.debugMode = false;
    console.log('🔍 Snap Debug Mode: DISABLED');
  }

  /**
   * Log snap detection information
   */
  logSnapDetection(info: Partial<SnapDebugInfo>): void {
    if (!this.debugMode) return;

    this.metrics = { ...this.metrics, ...info };

    console.group('🎯 Snap Detection Update');
    console.log('Generated Points:', this.metrics.snapPointsGenerated);
    console.log('Filtered Points:', this.metrics.snapPointsFiltered);
    console.log('Cursor Position:', this.metrics.cursorPosition);
    console.log('Active Snap:', this.metrics.activeSnapPoint?.type || 'none');
    console.log('Performance:', this.metrics.performanceMetrics);
    console.groupEnd();
  }

  /**
   * Log performance timing
   */
  logPerformance(operation: string, duration: number): void {
    if (!this.debugMode) return;

    console.log(`⚡ ${operation}: ${duration.toFixed(2)}ms`);
  }

  /**
   * Log cache operations
   */
  logCache(operation: 'hit' | 'miss' | 'clear', key?: string): void {
    if (!this.debugMode) return;

    if (operation === 'hit') {
      this.metrics.performanceMetrics.cacheHits++;
      console.log(`🎯 Cache HIT: ${key}`);
    } else if (operation === 'miss') {
      console.log(`❌ Cache MISS: ${key}`);
    } else if (operation === 'clear') {
      console.log('🧹 Cache CLEARED');
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

    if (this.debugMode) {
      console.log('📊 Snap Debug Metrics Reset');
    }
  }

  /**
   * Log snap radius information
   */
  logSnapRadius(mode: '2D' | '3D', radius: number): void {
    if (!this.debugMode) return;

    console.log(`📏 Snap Radius (${mode} mode): ${radius}m`);
  }

  /**
   * Log grid generation details
   */
  logGridGeneration(generated: number, cached: number): void {
    if (!this.debugMode) return;

    console.log(`🔲 Grid Points - Generated: ${generated}, From Cache: ${cached}`);
  }
}

// Global debug access
if (typeof window !== 'undefined') {
  (window as any).snapDebug = SnapDebugger.getInstance();
}

export const snapDebugger = SnapDebugger.getInstance();