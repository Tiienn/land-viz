/**
 * RAFScheduler Unit Tests
 *
 * Tests the shared RAF scheduler service including:
 * - Task subscription/unsubscription
 * - Priority-based execution
 * - Performance monitoring
 * - Error handling
 * - Edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RAFSchedulerClass } from '../RAFScheduler';
import type { RAFCallback } from '../RAFScheduler';

// Helper to wait for next RAF frame
function waitForRAF(): Promise<number> {
  return new Promise(resolve => {
    requestAnimationFrame(resolve);
  });
}

// Helper to wait for multiple RAF frames
async function waitForFrames(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await waitForRAF();
  }
}

describe('RAFScheduler', () => {
  let scheduler: RAFSchedulerClass;

  beforeEach(() => {
    scheduler = new RAFSchedulerClass();
  });

  afterEach(() => {
    scheduler.clear();
  });

  describe('subscribe/unsubscribe', () => {
    it('should subscribe a task and add it to the scheduler', () => {
      const callback = vi.fn();

      scheduler.subscribe('test-task', callback, 'normal');

      expect(scheduler.has('test-task')).toBe(true);
    });

    it('should return an unsubscribe function', () => {
      const callback = vi.fn();

      const unsubscribe = scheduler.subscribe('test-task', callback);
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(scheduler.has('test-task')).toBe(false);
    });

    it('should unsubscribe a task by ID', () => {
      const callback = vi.fn();

      scheduler.subscribe('test-task', callback);
      expect(scheduler.has('test-task')).toBe(true);

      scheduler.unsubscribe('test-task');
      expect(scheduler.has('test-task')).toBe(false);
    });

    it('should warn when subscribing duplicate task ID', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      scheduler.subscribe('duplicate', callback1);
      scheduler.subscribe('duplicate', callback2);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Task "duplicate" already exists')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should warn when unsubscribing non-existent task', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      scheduler.unsubscribe('non-existent');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Task "non-existent" not found')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should replace existing task when subscribing with same ID', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      scheduler.subscribe('task', callback1);
      scheduler.subscribe('task', callback2);

      const tasks = scheduler.getTaskInfo('task');
      expect(tasks.length).toBe(1);
      expect(tasks[0].callback).toBe(callback2);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('task execution', () => {
    it('should execute subscribed task on next frame', async () => {
      const callback = vi.fn();

      scheduler.subscribe('test-task', callback);

      await waitForRAF();

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should execute task with timestamp parameter', async () => {
      let receivedTimestamp = 0;
      const callback: RAFCallback = (timestamp: number) => {
        receivedTimestamp = timestamp;
      };

      scheduler.subscribe('test-task', callback);

      await waitForRAF();

      expect(receivedTimestamp).toBeGreaterThan(0);
      expect(typeof receivedTimestamp).toBe('number');
    });

    it('should execute task multiple times', async () => {
      const callback = vi.fn();

      scheduler.subscribe('test-task', callback);

      await waitForFrames(3);

      // RAF timing may vary, expect at least 3 calls
      expect(callback.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('should not execute task after unsubscribe', async () => {
      const callback = vi.fn();

      const unsubscribe = scheduler.subscribe('test-task', callback);

      await waitForRAF();
      const callsBeforeUnsubscribe = callback.mock.calls.length;
      expect(callsBeforeUnsubscribe).toBeGreaterThanOrEqual(1);

      unsubscribe();
      callback.mockClear();

      await waitForRAF();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('priority execution', () => {
    it('should execute tasks in priority order (high, normal, low)', async () => {
      // Create fresh scheduler for this test
      const testScheduler = new RAFSchedulerClass();
      const executionOrder: string[] = [];

      testScheduler.subscribe('low-task', () => executionOrder.push('low'), 'low');
      testScheduler.subscribe('high-task', () => executionOrder.push('high'), 'high');
      testScheduler.subscribe('normal-task', () => executionOrder.push('normal'), 'normal');

      await waitForRAF();

      // Check that all tasks executed and high priority executed before normal and low
      expect(executionOrder.includes('high')).toBe(true);
      expect(executionOrder.includes('normal')).toBe(true);
      expect(executionOrder.includes('low')).toBe(true);

      const highIndex = executionOrder.indexOf('high');
      const normalIndex = executionOrder.indexOf('normal');
      const lowIndex = executionOrder.indexOf('low');

      expect(highIndex).toBeGreaterThanOrEqual(0);
      expect(normalIndex).toBeGreaterThan(highIndex);
      expect(lowIndex).toBeGreaterThan(normalIndex);

      testScheduler.clear();
    });

    it('should execute multiple high-priority tasks before normal', async () => {
      const executionOrder: string[] = [];

      scheduler.subscribe('high-1', () => executionOrder.push('high-1'), 'high');
      scheduler.subscribe('normal-1', () => executionOrder.push('normal-1'), 'normal');
      scheduler.subscribe('high-2', () => executionOrder.push('high-2'), 'high');
      scheduler.subscribe('normal-2', () => executionOrder.push('normal-2'), 'normal');

      await waitForRAF();

      // All high priority tasks should execute before any normal priority
      const highIndex1 = executionOrder.indexOf('high-1');
      const highIndex2 = executionOrder.indexOf('high-2');
      const normalIndex1 = executionOrder.indexOf('normal-1');
      const normalIndex2 = executionOrder.indexOf('normal-2');

      expect(highIndex1).toBeLessThan(normalIndex1);
      expect(highIndex1).toBeLessThan(normalIndex2);
      expect(highIndex2).toBeLessThan(normalIndex1);
      expect(highIndex2).toBeLessThan(normalIndex2);
    });

    it('should default to normal priority when not specified', async () => {
      const callback = vi.fn();

      scheduler.subscribe('test-task', callback);

      const stats = scheduler.getStats();
      expect(stats.tasksByPriority.normal).toBe(1);
      expect(stats.tasksByPriority.high).toBe(0);
      expect(stats.tasksByPriority.low).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should catch and log errors in task execution', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback: RAFCallback = () => {
        throw new Error('Test error');
      };
      const normalCallback = vi.fn();

      scheduler.subscribe('error-task', errorCallback);
      scheduler.subscribe('normal-task', normalCallback);

      await waitForRAF();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in task "error-task"'),
        expect.any(Error)
      );

      // Other tasks should still execute
      expect(normalCallback).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should continue scheduler after task error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback: RAFCallback = () => {
        throw new Error('Test error');
      };
      const callback = vi.fn();

      scheduler.subscribe('error-task', errorCallback);
      scheduler.subscribe('test-task', callback);

      await waitForFrames(2);

      // Should execute on second frame despite error on first
      expect(callback).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('performance monitoring', () => {
    it('should track total tasks in stats', () => {
      scheduler.subscribe('task-1', vi.fn());
      scheduler.subscribe('task-2', vi.fn());
      scheduler.subscribe('task-3', vi.fn());

      const stats = scheduler.getStats();
      expect(stats.totalTasks).toBe(3);
    });

    it('should track tasks by priority in stats', () => {
      scheduler.subscribe('high-1', vi.fn(), 'high');
      scheduler.subscribe('high-2', vi.fn(), 'high');
      scheduler.subscribe('normal-1', vi.fn(), 'normal');
      scheduler.subscribe('low-1', vi.fn(), 'low');

      const stats = scheduler.getStats();
      expect(stats.tasksByPriority.high).toBe(2);
      expect(stats.tasksByPriority.normal).toBe(1);
      expect(stats.tasksByPriority.low).toBe(1);
    });

    it('should track frame count after execution', async () => {
      scheduler.subscribe('test-task', vi.fn());

      await waitForFrames(3);

      const stats = scheduler.getStats();
      expect(stats.totalFrames).toBeGreaterThanOrEqual(3);
    });

    it('should report isRunning true when tasks are active', async () => {
      scheduler.subscribe('test-task', vi.fn());

      await waitForRAF();

      const stats = scheduler.getStats();
      expect(stats.isRunning).toBe(true);
    });

    it('should report isRunning false after all tasks unsubscribed', async () => {
      const unsubscribe = scheduler.subscribe('test-task', vi.fn());

      await waitForRAF();

      unsubscribe();

      const stats = scheduler.getStats();
      expect(stats.isRunning).toBe(false);
    });

    it('should warn about slow tasks exceeding 16ms', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create a task that actually takes time
      const slowCallback: RAFCallback = () => {
        // Simulate slow task with a loop
        const start = performance.now();
        while (performance.now() - start < 20) {
          // Busy wait
        }
      };

      scheduler.subscribe('slow-task', slowCallback);

      await waitForRAF();

      // The warning may not always trigger in test environment
      // Just verify the task executed
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should track task execution count', async () => {
      scheduler.subscribe('test-task', vi.fn());

      await waitForFrames(5);

      const tasks = scheduler.getTaskInfo('test-task');
      // RAF timing may vary, expect at least 5 calls
      expect(tasks[0].executionCount).toBeGreaterThanOrEqual(5);
    });

    it('should calculate average FPS', async () => {
      scheduler.subscribe('test-task', vi.fn());

      // Wait for at least 1 second for FPS calculation
      await new Promise(resolve => setTimeout(resolve, 1100));

      const stats = scheduler.getStats();
      expect(stats.currentFPS).toBeGreaterThan(0);
      expect(stats.currentFPS).toBeLessThanOrEqual(60);
    });
  });

  describe('task information', () => {
    it('should return task info by ID', () => {
      const callback = vi.fn();
      scheduler.subscribe('test-task', callback, 'high');

      const tasks = scheduler.getTaskInfo('test-task');

      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBe('test-task');
      expect(tasks[0].priority).toBe('high');
      expect(tasks[0].callback).toBe(callback);
    });

    it('should return all tasks when no ID specified', () => {
      scheduler.subscribe('task-1', vi.fn(), 'high');
      scheduler.subscribe('task-2', vi.fn(), 'normal');
      scheduler.subscribe('task-3', vi.fn(), 'low');

      const tasks = scheduler.getTaskInfo();

      expect(tasks.length).toBe(3);
      expect(tasks.map(t => t.id)).toContain('task-1');
      expect(tasks.map(t => t.id)).toContain('task-2');
      expect(tasks.map(t => t.id)).toContain('task-3');
    });

    it('should return empty array for non-existent task', () => {
      const tasks = scheduler.getTaskInfo('non-existent');

      expect(tasks).toEqual([]);
    });

    it('should include task metadata', async () => {
      scheduler.subscribe('test-task', vi.fn(), 'normal');

      await waitForRAF();

      const tasks = scheduler.getTaskInfo('test-task');
      const task = tasks[0];

      expect(task.createdAt).toBeGreaterThan(0);
      expect(task.executionCount).toBeGreaterThan(0);
      expect(task.totalExecutionTime).toBeGreaterThanOrEqual(0);
      expect(task.lastExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('has()', () => {
    it('should return true for subscribed task', () => {
      scheduler.subscribe('test-task', vi.fn());

      expect(scheduler.has('test-task')).toBe(true);
    });

    it('should return false for non-existent task', () => {
      expect(scheduler.has('non-existent')).toBe(false);
    });

    it('should return false after task is unsubscribed', () => {
      const unsubscribe = scheduler.subscribe('test-task', vi.fn());

      expect(scheduler.has('test-task')).toBe(true);

      unsubscribe();

      expect(scheduler.has('test-task')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should remove all tasks', () => {
      scheduler.subscribe('task-1', vi.fn());
      scheduler.subscribe('task-2', vi.fn());
      scheduler.subscribe('task-3', vi.fn());

      scheduler.clear();

      const stats = scheduler.getStats();
      expect(stats.totalTasks).toBe(0);
      expect(scheduler.has('task-1')).toBe(false);
      expect(scheduler.has('task-2')).toBe(false);
      expect(scheduler.has('task-3')).toBe(false);
    });

    it('should stop scheduler after clearing', () => {
      scheduler.subscribe('test-task', vi.fn());
      scheduler.clear();

      const stats = scheduler.getStats();
      expect(stats.isRunning).toBe(false);
    });

    it('should not execute tasks after clear', async () => {
      const callback = vi.fn();
      scheduler.subscribe('test-task', callback);

      // Wait a moment for subscription to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      scheduler.clear();

      const callsBefore = callback.mock.calls.length;

      await waitForRAF();

      // No new calls should be made after clear
      expect(callback.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('edge cases', () => {
    it('should handle empty task list', () => {
      const stats = scheduler.getStats();

      expect(stats.totalTasks).toBe(0);
      expect(stats.isRunning).toBe(false);
    });

    it('should handle rapid subscribe/unsubscribe', () => {
      const callback = vi.fn();

      const unsubscribe = scheduler.subscribe('test-task', callback);
      unsubscribe();

      expect(scheduler.has('test-task')).toBe(false);
    });

    it('should handle multiple unsubscribes of same task', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const unsubscribe = scheduler.subscribe('test-task', vi.fn());
      unsubscribe();
      unsubscribe(); // Second unsubscribe

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Task "test-task" not found')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should start scheduler automatically on first subscribe', () => {
      scheduler.subscribe('test-task', vi.fn());

      const stats = scheduler.getStats();
      expect(stats.isRunning).toBe(true);
    });

    it('should stop scheduler automatically when last task unsubscribed', () => {
      const unsubscribe1 = scheduler.subscribe('task-1', vi.fn());
      const unsubscribe2 = scheduler.subscribe('task-2', vi.fn());

      unsubscribe1();
      expect(scheduler.getStats().isRunning).toBe(true);

      unsubscribe2();
      expect(scheduler.getStats().isRunning).toBe(false);
    });
  });
});
