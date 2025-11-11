/**
 * Shared RAF Scheduler
 *
 * Centralized RequestAnimationFrame scheduler that manages a single RAF loop
 * for all components. This reduces overhead from multiple RAF callbacks and
 * provides better performance monitoring.
 *
 * Features:
 * - Single RAF loop for entire application
 * - Priority-based execution (high, normal, low)
 * - Performance monitoring and statistics
 * - Automatic cleanup and memory management
 * - TypeScript support with generics
 *
 * Performance Benefits:
 * - Reduces RAF overhead (1 callback vs N callbacks)
 * - Better browser scheduling coordination
 * - Centralized performance monitoring
 * - Easier debugging and profiling
 *
 * @example
 * ```typescript
 * const unsubscribe = RAFScheduler.subscribe('my-task', () => {
 *   console.log('Executed on next frame');
 * }, 'normal');
 *
 * // Later...
 * unsubscribe();
 * ```
 */

export type RAFPriority = 'high' | 'normal' | 'low';

export interface RAFCallback<T = void> {
  (timestamp: number): T;
}

export interface RAFTask {
  id: string;
  callback: RAFCallback;
  priority: RAFPriority;
  createdAt: number;
  executionCount: number;
  totalExecutionTime: number;
  lastExecutionTime: number;
}

export interface RAFStats {
  /** Total number of registered tasks */
  totalTasks: number;
  /** Number of tasks by priority */
  tasksByPriority: Record<RAFPriority, number>;
  /** Total frames processed */
  totalFrames: number;
  /** Average frame time (ms) */
  averageFrameTime: number;
  /** Last frame time (ms) */
  lastFrameTime: number;
  /** Current FPS */
  currentFPS: number;
  /** Is scheduler running */
  isRunning: boolean;
}

class RAFSchedulerClass {
  private tasks: Map<string, RAFTask> = new Map();
  private rafId: number | null = null;
  private isRunning: boolean = false;

  // Performance tracking
  private frameCount: number = 0;
  private totalFrameTime: number = 0;
  private lastFrameTime: number = 0;
  private fpsUpdateTime: number = 0;
  private fpsFrameCount: number = 0;
  private currentFPS: number = 60;

  // Priority order (high -> normal -> low)
  private readonly priorityOrder: RAFPriority[] = ['high', 'normal', 'low'];

  /**
   * Subscribe a callback to the RAF scheduler
   *
   * @param id Unique identifier for this task
   * @param callback Function to execute on each frame
   * @param priority Execution priority (high, normal, low)
   * @returns Unsubscribe function
   */
  subscribe(
    id: string,
    callback: RAFCallback,
    priority: RAFPriority = 'normal'
  ): () => void {
    if (this.tasks.has(id)) {
      console.warn(`[RAFScheduler] Task "${id}" already exists. Replacing.`);
    }

    const task: RAFTask = {
      id,
      callback,
      priority,
      createdAt: performance.now(),
      executionCount: 0,
      totalExecutionTime: 0,
      lastExecutionTime: 0,
    };

    this.tasks.set(id, task);

    // Start scheduler if not already running
    if (!this.isRunning) {
      this.start();
    }

    // Return unsubscribe function
    return () => this.unsubscribe(id);
  }

  /**
   * Unsubscribe a task from the scheduler
   *
   * @param id Task identifier to remove
   */
  unsubscribe(id: string): void {
    const deleted = this.tasks.delete(id);

    if (!deleted) {
      console.warn(`[RAFScheduler] Task "${id}" not found.`);
    }

    // Stop scheduler if no tasks remain
    if (this.tasks.size === 0 && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Check if a task is subscribed
   *
   * @param id Task identifier
   * @returns True if task exists
   */
  has(id: string): boolean {
    return this.tasks.has(id);
  }

  /**
   * Get current scheduler statistics
   *
   * @returns Performance statistics
   */
  getStats(): RAFStats {
    const tasksByPriority: Record<RAFPriority, number> = {
      high: 0,
      normal: 0,
      low: 0,
    };

    for (const task of this.tasks.values()) {
      tasksByPriority[task.priority]++;
    }

    return {
      totalTasks: this.tasks.size,
      tasksByPriority,
      totalFrames: this.frameCount,
      averageFrameTime: this.frameCount > 0 ? this.totalFrameTime / this.frameCount : 0,
      lastFrameTime: this.lastFrameTime,
      currentFPS: this.currentFPS,
      isRunning: this.isRunning,
    };
  }

  /**
   * Get detailed task information (for debugging)
   *
   * @param id Optional task ID to get specific task info
   * @returns Array of task information
   */
  getTaskInfo(id?: string): RAFTask[] {
    if (id) {
      const task = this.tasks.get(id);
      return task ? [task] : [];
    }

    return Array.from(this.tasks.values());
  }

  /**
   * Clear all tasks and stop scheduler
   */
  clear(): void {
    this.tasks.clear();
    this.stop();
  }

  /**
   * Start the RAF scheduler loop
   */
  private start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.fpsUpdateTime = performance.now();
    this.fpsFrameCount = 0;
    this.loop(performance.now());
  }

  /**
   * Stop the RAF scheduler loop
   */
  private stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.isRunning = false;
  }

  /**
   * Main RAF loop - executes all tasks in priority order
   */
  private loop(timestamp: number): void {
    const frameStartTime = performance.now();

    // Execute tasks in priority order
    for (const priority of this.priorityOrder) {
      for (const task of this.tasks.values()) {
        if (task.priority === priority) {
          this.executeTask(task, timestamp);
        }
      }
    }

    // Update performance metrics
    const frameEndTime = performance.now();
    const frameTime = frameEndTime - frameStartTime;

    this.lastFrameTime = frameTime;
    this.totalFrameTime += frameTime;
    this.frameCount++;
    this.fpsFrameCount++;

    // Update FPS every second
    if (frameEndTime - this.fpsUpdateTime >= 1000) {
      this.currentFPS = Math.round(
        (this.fpsFrameCount * 1000) / (frameEndTime - this.fpsUpdateTime)
      );
      this.fpsUpdateTime = frameEndTime;
      this.fpsFrameCount = 0;
    }

    // Schedule next frame
    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  /**
   * Execute a single task with error handling and performance tracking
   */
  private executeTask(task: RAFTask, timestamp: number): void {
    const startTime = performance.now();

    try {
      task.callback(timestamp);

      const executionTime = performance.now() - startTime;
      task.executionCount++;
      task.totalExecutionTime += executionTime;
      task.lastExecutionTime = executionTime;

      // Warn about slow tasks (>16ms = missing 60fps target)
      if (executionTime > 16) {
        console.warn(
          `[RAFScheduler] Slow task "${task.id}" took ${executionTime.toFixed(2)}ms (priority: ${task.priority})`
        );
      }
    } catch (error) {
      console.error(`[RAFScheduler] Error in task "${task.id}":`, error);
    }
  }
}

// Export singleton instance
export const RAFScheduler = new RAFSchedulerClass();

// Export class for testing
export { RAFSchedulerClass };
