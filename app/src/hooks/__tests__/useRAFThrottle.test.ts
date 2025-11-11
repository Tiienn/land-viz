/**
 * useRAFThrottle Hooks Unit Tests
 *
 * Tests for RAF throttling React hooks:
 * - useRAFThrottle
 * - useRAFEventThrottle
 * - useRAFSchedule
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRAFThrottle, useRAFEventThrottle, useRAFSchedule } from '../useRAFThrottle';
import { RAFScheduler } from '../../utils/RAFScheduler';
import type { RAFCallback } from '../../utils/RAFScheduler';

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

describe('useRAFThrottle', () => {
  beforeEach(() => {
    RAFScheduler.clear();
  });

  afterEach(() => {
    RAFScheduler.clear();
  });

  describe('basic functionality', () => {
    it('should return a throttle function', () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useRAFThrottle('test-hook', callback, 'normal')
      );

      expect(typeof result.current).toBe('function');
    });

    it('should subscribe to RAF scheduler on mount', () => {
      const callback = vi.fn();

      renderHook(() => useRAFThrottle('test-hook', callback, 'normal'));

      expect(RAFScheduler.has('test-hook')).toBe(true);
    });

    it('should unsubscribe from RAF scheduler on unmount', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() =>
        useRAFThrottle('test-hook', callback, 'normal')
      );

      expect(RAFScheduler.has('test-hook')).toBe(true);

      unmount();

      expect(RAFScheduler.has('test-hook')).toBe(false);
    });

    it('should execute callback when throttle is called', async () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useRAFThrottle('test-hook', callback, 'normal')
      );

      result.current();

      await waitForRAF();

      expect(callback).toHaveBeenCalled();
    });

    it('should execute callback with timestamp', async () => {
      let receivedTimestamp = 0;
      const callback: RAFCallback = (timestamp: number) => {
        receivedTimestamp = timestamp;
      };

      const { result } = renderHook(() =>
        useRAFThrottle('test-hook', callback, 'normal')
      );

      result.current();

      await waitForRAF();

      expect(receivedTimestamp).toBeGreaterThan(0);
    });

    it('should execute pending callback before main callback', async () => {
      const executionOrder: string[] = [];
      const callback: RAFCallback = () => {
        executionOrder.push('main');
      };

      const { result } = renderHook(() =>
        useRAFThrottle('test-hook', callback, 'normal')
      );

      result.current(() => {
        executionOrder.push('pending');
      });

      await waitForRAF();

      expect(executionOrder).toEqual(['pending', 'main']);
    });

    it('should handle multiple throttle calls before RAF', async () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useRAFThrottle('test-hook', callback, 'normal')
      );

      // Multiple calls before RAF executes
      result.current();
      result.current();
      result.current();

      await waitForRAF();

      // Should only execute once per frame
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('priority handling', () => {
    it('should subscribe with high priority', () => {
      const callback = vi.fn();
      renderHook(() => useRAFThrottle('high-hook', callback, 'high'));

      const stats = RAFScheduler.getStats();
      expect(stats.tasksByPriority.high).toBe(1);
    });

    it('should subscribe with normal priority by default', () => {
      const callback = vi.fn();
      renderHook(() => useRAFThrottle('normal-hook', callback));

      const stats = RAFScheduler.getStats();
      expect(stats.tasksByPriority.normal).toBe(1);
    });

    it('should subscribe with low priority', () => {
      const callback = vi.fn();
      renderHook(() => useRAFThrottle('low-hook', callback, 'low'));

      const stats = RAFScheduler.getStats();
      expect(stats.tasksByPriority.low).toBe(1);
    });
  });

  describe('callback ref updates', () => {
    it('should update callback ref without re-subscribing', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ cb }) => useRAFThrottle('test-hook', cb, 'normal'),
        { initialProps: { cb: callback1 } }
      );

      result.current();
      waitForRAF();

      // Update callback
      rerender({ cb: callback2 });

      result.current();

      waitForRAF();

      // Should still have only one subscription
      expect(RAFScheduler.getStats().totalTasks).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should clear pending work on unmount', () => {
      const callback = vi.fn();
      const { result, unmount } = renderHook(() =>
        useRAFThrottle('test-hook', callback, 'normal')
      );

      result.current(() => {
        callback();
      });

      unmount();

      // Pending work should be cleared, callback should not execute
      waitForRAF();
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

describe('useRAFSchedule', () => {
  beforeEach(() => {
    RAFScheduler.clear();
  });

  afterEach(() => {
    RAFScheduler.clear();
  });

  describe('basic functionality', () => {
    it('should subscribe to RAF scheduler on mount', () => {
      const callback = vi.fn();

      renderHook(() => useRAFSchedule('test-schedule', callback, 'normal'));

      expect(RAFScheduler.has('test-schedule')).toBe(true);
    });

    it('should execute callback on every frame', async () => {
      const callback = vi.fn();

      renderHook(() => useRAFSchedule('test-schedule', callback, 'normal'));

      await waitForFrames(3);

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should execute callback with timestamp', async () => {
      let receivedTimestamp = 0;
      const callback: RAFCallback = (timestamp: number) => {
        receivedTimestamp = timestamp;
      };

      renderHook(() => useRAFSchedule('test-schedule', callback, 'normal'));

      await waitForRAF();

      expect(receivedTimestamp).toBeGreaterThan(0);
    });

    it('should unsubscribe on unmount', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() =>
        useRAFSchedule('test-schedule', callback, 'normal')
      );

      expect(RAFScheduler.has('test-schedule')).toBe(true);

      unmount();

      expect(RAFScheduler.has('test-schedule')).toBe(false);
    });
  });

  describe('priority handling', () => {
    it('should subscribe with specified priority', () => {
      const callback = vi.fn();
      renderHook(() => useRAFSchedule('high-schedule', callback, 'high'));

      const stats = RAFScheduler.getStats();
      expect(stats.tasksByPriority.high).toBe(1);
    });

    it('should default to normal priority', () => {
      const callback = vi.fn();
      renderHook(() => useRAFSchedule('normal-schedule', callback));

      const stats = RAFScheduler.getStats();
      expect(stats.tasksByPriority.normal).toBe(1);
    });
  });
});

describe('useRAFEventThrottle', () => {
  beforeEach(() => {
    RAFScheduler.clear();
  });

  afterEach(() => {
    RAFScheduler.clear();
  });

  describe('basic functionality', () => {
    it('should return an event handler function', () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useRAFEventThrottle<MouseEvent>('mouse-throttle', handler, 'normal')
      );

      expect(typeof result.current).toBe('function');
    });

    it('should subscribe to RAF scheduler on mount', () => {
      const handler = vi.fn();

      renderHook(() =>
        useRAFEventThrottle<MouseEvent>('mouse-throttle', handler, 'normal')
      );

      expect(RAFScheduler.has('mouse-throttle')).toBe(true);
    });

    it('should execute handler with event on next frame', async () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useRAFEventThrottle<MouseEvent>('mouse-throttle', handler, 'normal')
      );

      const mockEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      });

      result.current(mockEvent);

      await waitForRAF();

      expect(handler).toHaveBeenCalledWith(mockEvent);
    });

    it('should throttle multiple events to one per frame', async () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useRAFEventThrottle<MouseEvent>('mouse-throttle', handler, 'normal')
      );

      const event1 = new MouseEvent('mousemove', { clientX: 100, clientY: 200 });
      const event2 = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      const event3 = new MouseEvent('mousemove', { clientX: 200, clientY: 300 });

      // Multiple events before RAF
      result.current(event1);
      result.current(event2);
      result.current(event3);

      await waitForRAF();

      // Should only process last event
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event3);
    });

    it('should preserve event properties', async () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useRAFEventThrottle<MouseEvent>('mouse-throttle', handler, 'normal')
      );

      const mockEvent = new MouseEvent('mousemove', {
        clientX: 123,
        clientY: 456,
        bubbles: true,
      });

      result.current(mockEvent);

      await waitForRAF();

      const receivedEvent = handler.mock.calls[0][0] as MouseEvent;
      expect(receivedEvent.clientX).toBe(123);
      expect(receivedEvent.clientY).toBe(456);
    });

    it('should unsubscribe on unmount', () => {
      const handler = vi.fn();
      const { unmount } = renderHook(() =>
        useRAFEventThrottle<MouseEvent>('mouse-throttle', handler, 'normal')
      );

      expect(RAFScheduler.has('mouse-throttle')).toBe(true);

      unmount();

      expect(RAFScheduler.has('mouse-throttle')).toBe(false);
    });
  });

  describe('different event types', () => {
    it('should handle KeyboardEvent', async () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useRAFEventThrottle<KeyboardEvent>('keyboard-throttle', handler, 'normal')
      );

      const mockEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
      });

      result.current(mockEvent);

      await waitForRAF();

      expect(handler).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle custom Event', async () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useRAFEventThrottle<Event>('custom-throttle', handler, 'normal')
      );

      const mockEvent = new Event('custom');

      result.current(mockEvent);

      await waitForRAF();

      expect(handler).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('priority handling', () => {
    it('should subscribe with high priority', () => {
      const handler = vi.fn();
      renderHook(() =>
        useRAFEventThrottle<MouseEvent>('high-mouse', handler, 'high')
      );

      const stats = RAFScheduler.getStats();
      expect(stats.tasksByPriority.high).toBe(1);
    });

    it('should default to normal priority', () => {
      const handler = vi.fn();
      renderHook(() =>
        useRAFEventThrottle<MouseEvent>('normal-mouse', handler)
      );

      const stats = RAFScheduler.getStats();
      expect(stats.tasksByPriority.normal).toBe(1);
    });
  });

  describe('handler ref updates', () => {
    it('should update handler ref without re-subscribing', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ h }) => useRAFEventThrottle<MouseEvent>('mouse-throttle', h, 'normal'),
        { initialProps: { h: handler1 } }
      );

      const event = new MouseEvent('mousemove');
      result.current(event);
      await waitForRAF();

      expect(handler1).toHaveBeenCalled();
      handler1.mockClear();

      // Update handler
      rerender({ h: handler2 });

      result.current(event);
      await waitForRAF();

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();

      // Should still have only one subscription
      expect(RAFScheduler.getStats().totalTasks).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should clear pending event on unmount', async () => {
      const handler = vi.fn();
      const { result, unmount } = renderHook(() =>
        useRAFEventThrottle<MouseEvent>('mouse-throttle', handler, 'normal')
      );

      const mockEvent = new MouseEvent('mousemove');
      result.current(mockEvent);

      unmount();

      await waitForRAF();

      // Pending event should be cleared, handler should not execute
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe('integration scenarios', () => {
  beforeEach(() => {
    RAFScheduler.clear();
  });

  afterEach(() => {
    RAFScheduler.clear();
  });

  it('should coordinate multiple hooks through shared scheduler', async () => {
    const executionOrder: string[] = [];

    const { result: highResult } = renderHook(() =>
      useRAFThrottle(
        'high-task',
        () => executionOrder.push('high'),
        'high'
      )
    );

    const { result: normalResult } = renderHook(() =>
      useRAFThrottle(
        'normal-task',
        () => executionOrder.push('normal'),
        'normal'
      )
    );

    const { result: lowResult } = renderHook(() =>
      useRAFThrottle(
        'low-task',
        () => executionOrder.push('low'),
        'low'
      )
    );

    // Trigger all hooks
    highResult.current();
    normalResult.current();
    lowResult.current();

    await waitForRAF();

    // Should execute in priority order
    expect(executionOrder).toEqual(['high', 'normal', 'low']);
  });

  it('should handle rapid event throttling from multiple sources', async () => {
    const mouseHandler = vi.fn();
    const scrollHandler = vi.fn();

    const { result: mouseResult } = renderHook(() =>
      useRAFEventThrottle<MouseEvent>('mouse', mouseHandler, 'normal')
    );

    const { result: scrollResult } = renderHook(() =>
      useRAFEventThrottle<Event>('scroll', scrollHandler, 'normal')
    );

    // Simulate rapid events
    for (let i = 0; i < 10; i++) {
      mouseResult.current(new MouseEvent('mousemove', { clientX: i }));
      scrollResult.current(new Event('scroll'));
    }

    await waitForRAF();

    // Each handler should execute only once per frame
    expect(mouseHandler).toHaveBeenCalledTimes(1);
    expect(scrollHandler).toHaveBeenCalledTimes(1);
  });

  it('should maintain separate pending states for different hooks', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { result: result1 } = renderHook(() =>
      useRAFEventThrottle<MouseEvent>('handler1', handler1, 'normal')
    );

    const { result: result2 } = renderHook(() =>
      useRAFEventThrottle<MouseEvent>('handler2', handler2, 'normal')
    );

    const event1 = new MouseEvent('mousemove', { clientX: 100 });
    const event2 = new MouseEvent('mousemove', { clientX: 200 });

    result1.current(event1);
    result2.current(event2);

    await waitForRAF();

    expect(handler1).toHaveBeenCalledWith(event1);
    expect(handler2).toHaveBeenCalledWith(event2);
  });
});
