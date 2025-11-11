# RAF Throttling - Quick Reference Guide

**For Developers**: Copy-paste template for implementing RAF throttling in new components

## When to Use

Use RAF throttling when your component handles:
- `mousemove` events
- `scroll` events
- `resize` events
- Any event that fires 60+ times per second
- Effects that run on every render

## Quick Template

```typescript
import { useRef, useEffect } from 'react';

function MyComponent() {
  // 1. Setup RAF refs
  const rafIdRef = useRef<number | null>(null);
  const pendingDataRef = useRef<DataType | null>(null);

  useEffect(() => {
    // 2. Define processing function
    const processData = (data: DataType) => {
      // Your expensive operations here
      // setState calls, calculations, etc.
    };

    // 3. Create throttled handler
    const handleEvent = (data: DataType) => {
      // Store pending data
      pendingDataRef.current = data;

      // Skip if RAF already scheduled
      if (rafIdRef.current !== null) {
        return;
      }

      // Schedule processing on next frame
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;

        if (pendingDataRef.current) {
          processData(pendingDataRef.current);
          pendingDataRef.current = null;
        }
      });
    };

    // 4. Add event listener (with passive flag for scroll/touch events)
    element.addEventListener('eventname', handleEvent, { passive: true });

    // 5. Cleanup
    return () => {
      element.removeEventListener('eventname', handleEvent);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pendingDataRef.current = null;
    };
  }, [/* dependencies */]);

  return <div>Your JSX</div>;
}
```

## Real-World Example: Mouse Position Tracking

```typescript
import { useRef, useEffect, useState } from 'react';

function CursorTracker() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Store latest position
      pendingPosRef.current = { x: e.clientX, y: e.clientY };

      // Skip if already scheduled
      if (rafIdRef.current !== null) {
        return;
      }

      // Schedule update
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;

        if (pendingPosRef.current) {
          setCursorPos(pendingPosRef.current);
          pendingPosRef.current = null;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'fixed', left: cursorPos.x, top: cursorPos.y }}>
      Cursor at: {cursorPos.x}, {cursorPos.y}
    </div>
  );
}
```

## Common Mistakes to Avoid

### ❌ Don't: Forget to cancel RAF on cleanup
```typescript
return () => {
  element.removeEventListener('eventname', handler);
  // Missing: cancelAnimationFrame(rafIdRef.current)
};
```

### ✅ Do: Always cleanup RAF
```typescript
return () => {
  element.removeEventListener('eventname', handler);
  if (rafIdRef.current !== null) {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }
};
```

---

### ❌ Don't: Call setState directly in event handler
```typescript
const handleMouseMove = (e: MouseEvent) => {
  setState({ x: e.clientX, y: e.clientY }); // Updates 100+ times/sec
};
```

### ✅ Do: Throttle with RAF
```typescript
const handleMouseMove = (e: MouseEvent) => {
  pendingRef.current = { x: e.clientX, y: e.clientY };
  if (rafIdRef.current !== null) return;
  rafIdRef.current = requestAnimationFrame(() => {
    rafIdRef.current = null;
    if (pendingRef.current) {
      setState(pendingRef.current); // Updates max 60 times/sec
      pendingRef.current = null;
    }
  });
};
```

---

### ❌ Don't: Create new RAF on every call
```typescript
const handleEvent = () => {
  requestAnimationFrame(() => processData()); // Creates new RAF every time
};
```

### ✅ Do: Skip if RAF already scheduled
```typescript
const handleEvent = () => {
  if (rafIdRef.current !== null) return; // Skip if already scheduled
  rafIdRef.current = requestAnimationFrame(() => {
    rafIdRef.current = null;
    processData();
  });
};
```

---

### ❌ Don't: Forget passive flag for scroll/touch
```typescript
element.addEventListener('scroll', handler); // Blocks scroll performance
```

### ✅ Do: Add passive flag
```typescript
element.addEventListener('scroll', handler, { passive: true }); // Non-blocking
```

## Performance Comparison

### Without RAF Throttling
```
Mouse movements per second: 100+
State updates per second: 100+
Re-renders per second: 100+
CPU usage: High (20-30%)
```

### With RAF Throttling
```
Mouse movements per second: 100+ (unchanged)
State updates per second: 60 (max, throttled to frame rate)
Re-renders per second: 60 (max, throttled to frame rate)
CPU usage: Low (3-6%)
```

**Result**: ~80-90% reduction in CPU usage

## Debugging Tips

### Check if RAF is working
```typescript
const handleEvent = () => {
  console.log('Event fired');
  if (rafIdRef.current !== null) {
    console.log('Skipped - RAF already scheduled');
    return;
  }
  rafIdRef.current = requestAnimationFrame(() => {
    console.log('RAF executed');
    rafIdRef.current = null;
    processData();
  });
};
```

### Monitor frame rate
```typescript
let frameCount = 0;
let lastTime = performance.now();

rafIdRef.current = requestAnimationFrame(() => {
  frameCount++;
  const currentTime = performance.now();
  if (currentTime - lastTime >= 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = currentTime;
  }
});
```

## TypeScript Tips

```typescript
// Type your refs properly
const rafIdRef = useRef<number | null>(null);
const pendingDataRef = useRef<YourDataType | null>(null);

// Type your event handlers
const handleMouseMove = (e: MouseEvent) => { /* ... */ };
const handleScroll = (e: Event) => { /* ... */ };
const handleResize = (e: UIEvent) => { /* ... */ };
```

## Quick Checklist

Before committing RAF throttling implementation:

- [ ] RAF ref initialized: `useRef<number | null>(null)`
- [ ] Pending data ref initialized: `useRef<DataType | null>(null)`
- [ ] Check for existing RAF before scheduling: `if (rafIdRef.current !== null) return;`
- [ ] Clear RAF ref after execution: `rafIdRef.current = null;`
- [ ] Cleanup RAF on unmount: `cancelAnimationFrame(rafIdRef.current);`
- [ ] Add `{ passive: true }` for scroll/touch events
- [ ] Null out pending data after processing
- [ ] Test with rapid events (100+ events/sec)
- [ ] Verify no memory leaks (check DevTools)
- [ ] Document the optimization in comments

## Additional Resources

- **Full Documentation**: `docs/fixes/RAF_THROTTLING_OPTIMIZATION_SUMMARY.md`
- **Camera2D Example**: `app/src/components/Scene/Camera2DToggle.tsx`
- **LiveDistanceLabel Example**: `app/src/components/DimensionInput/LiveDistanceLabel.tsx`
- **DrawingFeedback Example**: `app/src/components/Scene/DrawingFeedback.tsx`

## Questions?

See full documentation at `docs/fixes/RAF_THROTTLING_OPTIMIZATION_SUMMARY.md` or review the three optimized components for real-world examples.
