/**
 * useRAFThrottle Hook
 *
 * React hook for throttling callbacks using the shared RAF scheduler.
 * Automatically handles cleanup on unmount.
 *
 * @example
 * ```typescript
 * // Simple usage
 * const throttledUpdate = useRAFThrottle('my-component', (timestamp) => {
 *   console.log('Frame update:', timestamp);
 * });
 *
 * // Call this from your event handler
 * const handleMouseMove = (e: MouseEvent) => {
 *   throttledUpdate(() => {
 *     setPosition({ x: e.clientX, y: e.clientY });
 *   });
 * };
 * ```
 *
 * @example
 * ```typescript
 * // With priority
 * const throttledUpdate = useRAFThrottle(
 *   'critical-animation',
 *   (timestamp) => updateAnimation(timestamp),
 *   'high'
 * );
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import { RAFScheduler } from '../utils/RAFScheduler';
import type { RAFPriority, RAFCallback } from '../utils/RAFScheduler';

export interface RAFThrottleCallback<T = void> {
  (): T;
}

/**
 * Hook for throttling callbacks to RAF
 *
 * @param id Unique identifier for this task (should be stable across renders)
 * @param callback Callback to execute on RAF (receives timestamp)
 * @param priority Execution priority (default: 'normal')
 * @returns Throttle function to call from event handlers
 */
export function useRAFThrottle<T = void>(
  id: string,
  callback: RAFCallback<T>,
  priority: RAFPriority = 'normal'
): (pendingCallback?: RAFThrottleCallback<T>) => void {
  const callbackRef = useRef(callback);
  const pendingCallbackRef = useRef<RAFThrottleCallback<T> | null>(null);
  const hasPendingRef = useRef(false);

  // Update callback ref when it changes (don't re-subscribe)
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Subscribe to RAF scheduler
  useEffect(() => {
    const rafCallback: RAFCallback = (timestamp: number) => {
      // Execute callback if we have pending work
      if (hasPendingRef.current) {
        hasPendingRef.current = false;

        // If there's a pending callback, execute it first
        if (pendingCallbackRef.current) {
          try {
            pendingCallbackRef.current();
          } finally {
            pendingCallbackRef.current = null;
          }
        }

        // Then execute the main callback
        callbackRef.current(timestamp);
      }
    };

    const unsubscribe = RAFScheduler.subscribe(id, rafCallback, priority);

    return () => {
      unsubscribe();
      hasPendingRef.current = false;
      pendingCallbackRef.current = null;
    };
  }, [id, priority]);

  // Return throttle function
  const throttle = useCallback((pendingCallback?: RAFThrottleCallback<T>) => {
    if (pendingCallback) {
      pendingCallbackRef.current = pendingCallback;
    }
    hasPendingRef.current = true;
  }, []);

  return throttle;
}

/**
 * Simpler version that just schedules the RAF callback without pending work
 *
 * @example
 * ```typescript
 * useRAFSchedule('my-task', (timestamp) => {
 *   // This runs on every frame
 *   updateAnimation(timestamp);
 * });
 * ```
 */
export function useRAFSchedule(
  id: string,
  callback: RAFCallback,
  priority: RAFPriority = 'normal'
): void {
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Subscribe to RAF scheduler
  useEffect(() => {
    const rafCallback: RAFCallback = (timestamp: number) => {
      callbackRef.current(timestamp);
    };

    const unsubscribe = RAFScheduler.subscribe(id, rafCallback, priority);
    return unsubscribe;
  }, [id, priority]);
}

/**
 * Hook for throttling event handlers with RAF
 * Stores pending data and processes it on next frame
 *
 * @example
 * ```typescript
 * const handleMouseMove = useRAFEventThrottle(
 *   'mouse-tracker',
 *   (e: MouseEvent) => {
 *     setPosition({ x: e.clientX, y: e.clientY });
 *   },
 *   'normal'
 * );
 *
 * // Use in JSX
 * <div onMouseMove={handleMouseMove}>...</div>
 * ```
 */
export function useRAFEventThrottle<E extends Event>(
  id: string,
  handler: (event: E) => void,
  priority: RAFPriority = 'normal'
): (event: E) => void {
  const handlerRef = useRef(handler);
  const pendingEventRef = useRef<E | null>(null);

  // Update handler ref
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Use the throttle hook
  const throttle = useRAFThrottle(
    id,
    () => {
      if (pendingEventRef.current) {
        const event = pendingEventRef.current;
        pendingEventRef.current = null;
        handlerRef.current(event);
      }
    },
    priority
  );

  // Return event handler
  return useCallback((event: E) => {
    pendingEventRef.current = event;
    throttle();
  }, [throttle]);
}
