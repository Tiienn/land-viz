---
name: "Test Automation"
description: "Design and implement comprehensive testing strategies including unit tests, integration tests, end-to-end tests, performance tests, and accessibility tests. Expert in Jest, React Testing Library, Cypress, Playwright, and test-driven development for the Land Visualizer project"
version: "1.0.0"
dependencies:
  - "vitest@>=1.0.0"
  - "@testing-library/react@>=14.0.0"
  - "@testing-library/jest-dom@>=6.0.0"
  - "jest-axe@>=8.0.0"
---

# Test Automation Specialist

## Overview

This skill provides expertise in comprehensive testing strategies for the Land Visualizer project. Focus on unit tests, integration tests, performance tests, accessibility tests, and end-to-end tests to ensure code quality, reliability, and maintainability.

## When to Use This Skill

- Writing unit tests for components and utilities
- Creating integration tests for user workflows
- Implementing performance regression tests
- Ensuring WCAG 2.1 AA accessibility compliance
- Setting up end-to-end test suites
- Debugging test failures
- Improving test coverage

## Testing Philosophy

### Test Pyramid

```
         E2E Tests
        /    5%    \
       /            \
      Integration Tests
     /      15%        \
    /                   \
   Unit Tests & Component Tests
  /          80%                \
 /______________________________\
```

**Goals:**
- **Unit Tests**: >90% function coverage
- **Integration Tests**: 100% critical user workflow coverage
- **Performance Tests**: 100% performance budget coverage
- **Accessibility Tests**: 100% WCAG 2.1 AA compliance
- **E2E Tests**: Critical paths only

## Unit Testing

### Component Testing with React Testing Library

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  test('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  test('renders with icon', () => {
    render(
      <Button icon={<span data-testid="icon">🔧</span>}>
        With Icon
      </Button>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });
});
```

### Store Testing (Zustand)

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { useDrawingStore } from './useDrawingStore';

describe('Drawing Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useDrawingStore.setState({
      shapes: [],
      selectedShapeId: null,
      activeTool: 'select'
    });
  });

  test('adds a shape', () => {
    const { addShape, shapes } = useDrawingStore.getState();

    const newShape = {
      id: 'shape-1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 10,
      height: 10
    };

    addShape(newShape);

    expect(useDrawingStore.getState().shapes).toHaveLength(1);
    expect(useDrawingStore.getState().shapes[0]).toEqual(newShape);
  });

  test('updates a shape', () => {
    const { addShape, updateShape } = useDrawingStore.getState();

    addShape({ id: 'shape-1', x: 0, y: 0, width: 10, height: 10 });
    updateShape('shape-1', { width: 20 });

    const updated = useDrawingStore.getState().shapes[0];
    expect(updated.width).toBe(20);
    expect(updated.height).toBe(10); // Unchanged
  });

  test('deletes a shape', () => {
    const { addShape, deleteShape } = useDrawingStore.getState();

    addShape({ id: 'shape-1', x: 0, y: 0, width: 10, height: 10 });
    addShape({ id: 'shape-2', x: 10, y: 10, width: 15, height: 15 });

    expect(useDrawingStore.getState().shapes).toHaveLength(2);

    deleteShape('shape-1');

    expect(useDrawingStore.getState().shapes).toHaveLength(1);
    expect(useDrawingStore.getState().shapes[0].id).toBe('shape-2');
  });

  test('selects a shape', () => {
    const { addShape, selectShape, selectedShapeId } = useDrawingStore.getState();

    addShape({ id: 'shape-1', x: 0, y: 0, width: 10, height: 10 });
    selectShape('shape-1');

    expect(useDrawingStore.getState().selectedShapeId).toBe('shape-1');
  });
});
```

### Utility Function Testing

```typescript
import { describe, test, expect } from 'vitest';
import { calculatePolygonArea, calculatePerimeter } from './geometryUtils';

describe('Geometry Utilities', () => {
  describe('calculatePolygonArea', () => {
    test('calculates area of a square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const area = calculatePolygonArea(square);
      expect(area).toBeCloseTo(100, 2);
    });

    test('calculates area of a triangle', () => {
      const triangle = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 }
      ];

      const area = calculatePolygonArea(triangle);
      expect(area).toBeCloseTo(50, 2);
    });

    test('handles clockwise and counter-clockwise winding', () => {
      const clockwise = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const counterClockwise = clockwise.reverse();

      expect(Math.abs(calculatePolygonArea(clockwise)))
        .toBeCloseTo(Math.abs(calculatePolygonArea(counterClockwise)), 2);
    });

    test('returns 0 for degenerate polygons', () => {
      const line = [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ];

      expect(calculatePolygonArea(line)).toBe(0);
    });
  });

  describe('calculatePerimeter', () => {
    test('calculates perimeter of a square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
        { x: 0, y: 0 } // Closed polygon
      ];

      const perimeter = calculatePerimeter(square);
      expect(perimeter).toBeCloseTo(40, 2);
    });
  });
});
```

## Integration Testing

### User Workflow Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { App } from './App';

describe('Complete Land Planning Workflow', () => {
  test('user can draw, measure, and compare property', async () => {
    render(<App />);

    // 1. Select rectangle tool
    const rectangleTool = screen.getByRole('button', { name: /rectangle/i });
    fireEvent.click(rectangleTool);

    // 2. Draw a rectangle
    const canvas = screen.getByRole('region', { name: /3d canvas/i });
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(canvas, { clientX: 200, clientY: 200 });

    // 3. Verify shape was created
    await waitFor(() => {
      expect(screen.getByText(/area:/i)).toBeInTheDocument();
    });

    // 4. Select measurement tool
    const measureTool = screen.getByRole('button', { name: /measure/i });
    fireEvent.click(measureTool);

    // 5. Measure distance
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(canvas, { clientX: 200, clientY: 100 });

    // 6. Verify measurement displays
    await waitFor(() => {
      expect(screen.getByText(/distance:/i)).toBeInTheDocument();
    });

    // 7. Open comparison panel
    const comparisonButton = screen.getByRole('button', { name: /compare/i });
    fireEvent.click(comparisonButton);

    // 8. Verify comparison objects shown
    await waitFor(() => {
      expect(screen.getByText(/soccer field/i)).toBeInTheDocument();
    });

    // 9. Convert units
    const unitSelector = screen.getByRole('combobox', { name: /unit/i });
    fireEvent.change(unitSelector, { target: { value: 'acres' } });

    // 10. Verify conversion displayed
    await waitFor(() => {
      expect(screen.getByText(/acres/i)).toBeInTheDocument();
    });
  });

  test('user can edit existing shape', async () => {
    render(<App />);

    // Create a shape first
    const rectangleTool = screen.getByRole('button', { name: /rectangle/i });
    fireEvent.click(rectangleTool);

    const canvas = screen.getByRole('region', { name: /3d canvas/i });
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(canvas, { clientX: 200, clientY: 200 });

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Verify edit handles appear
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /corner/i })).toHaveLength(4);
    });

    // Drag a corner
    const corner = screen.getAllByRole('button', { name: /corner/i })[0];
    fireEvent.pointerDown(corner);
    fireEvent.pointerMove(canvas, { clientX: 150, clientY: 150 });
    fireEvent.pointerUp(canvas);

    // Verify shape was modified
    await waitFor(() => {
      const areaText = screen.getByText(/area:/i);
      expect(areaText).toHaveTextContent(/[0-9]+\.?[0-9]*/);
    });
  });
});
```

### Error Recovery Testing

```typescript
describe('Error Recovery', () => {
  test('handles invalid measurements gracefully', async () => {
    render(<App />);

    const measureTool = screen.getByRole('button', { name: /measure/i });
    fireEvent.click(measureTool);

    // Try to measure with only one point
    const canvas = screen.getByRole('region', { name: /3d canvas/i });
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/need two points/i)).toBeInTheDocument();
    });

    // Error should not crash the app
    expect(screen.getByRole('button', { name: /measure/i })).toBeInTheDocument();
  });

  test('recovers from rapid tool switching', async () => {
    render(<App />);

    // Rapidly switch tools
    const tools = ['rectangle', 'circle', 'polyline', 'select'];

    for (const tool of tools) {
      const button = screen.getByRole('button', { name: new RegExp(tool, 'i') });
      fireEvent.click(button);
    }

    // App should still be functional
    const selectTool = screen.getByRole('button', { name: /select/i });
    expect(selectTool).toHaveAttribute('aria-pressed', 'true');
  });
});
```

## Performance Testing

### Performance Regression Tests

```typescript
import { describe, test, expect } from 'vitest';
import { performanceMonitor } from '../utils/PerformanceMonitor';

const PERFORMANCE_BUDGETS = {
  addShape: 5, // ms
  updateShape: 3,
  deleteShape: 2,
  calculateArea: 10,
  renderShapes: 50
};

describe('Performance Regression Tests', () => {
  test('adding a shape should be fast', () => {
    const { addShape } = useDrawingStore.getState();

    const duration = performanceMonitor.measurePerformance(
      'add-shape',
      () => {
        addShape({
          id: 'test-shape',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 10,
          height: 10
        });
      }
    );

    expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.addShape);
  });

  test('area calculation should be fast', () => {
    const points = Array.from({ length: 100 }, (_, i) => ({
      x: Math.cos((i / 100) * Math.PI * 2) * 50,
      y: Math.sin((i / 100) * Math.PI * 2) * 50
    }));

    const duration = performanceMonitor.measurePerformance(
      'calculate-area',
      () => {
        calculatePolygonArea(points);
      }
    );

    expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.calculateArea);
  });

  test('handles large number of shapes efficiently', () => {
    const { addShape } = useDrawingStore.getState();

    // Add 1000 shapes
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      addShape({
        id: `shape-${i}`,
        type: 'rectangle',
        x: i,
        y: i,
        width: 10,
        height: 10
      });
    }

    const duration = performance.now() - start;

    // Should complete in reasonable time
    expect(duration).toBeLessThan(1000); // 1 second for 1000 shapes
  });
});
```

## Accessibility Testing

### WCAG 2.1 AA Compliance Tests

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, test, expect } from 'vitest';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('Button component has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  test('Navigation has proper ARIA labels', async () => {
    const { container } = render(<Navigation />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Form inputs have associated labels', async () => {
    const { container, getByLabelText } = render(
      <form>
        <label htmlFor="width">Width (m)</label>
        <input id="width" type="number" />
      </form>
    );

    expect(getByLabelText('Width (m)')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Interactive elements are keyboard accessible', () => {
    const { getByRole } = render(<ToolButton tool="rectangle" />);

    const button = getByRole('button');

    expect(button).toHaveAttribute('tabindex', '0');
    expect(button).toHaveAttribute('aria-label');
  });

  test('Color contrast meets WCAG AA standards', async () => {
    const { container } = render(
      <div style={{ color: '#374151', background: '#FFFFFF' }}>
        Text content
      </div>
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  test('Dynamic content has live regions', () => {
    const { getByRole } = render(
      <div role="status" aria-live="polite">
        5 shapes created
      </div>
    );

    expect(getByRole('status')).toBeInTheDocument();
  });
});
```

### Keyboard Navigation Tests

```typescript
describe('Keyboard Navigation', () => {
  test('can navigate through tools with Tab', async () => {
    render(<Toolbar />);

    const tools = screen.getAllByRole('button');

    // Tab through all tools
    tools[0].focus();
    expect(document.activeElement).toBe(tools[0]);

    userEvent.tab();
    expect(document.activeElement).toBe(tools[1]);

    userEvent.tab();
    expect(document.activeElement).toBe(tools[2]);
  });

  test('can activate tool with Enter/Space', async () => {
    const handleSelect = vi.fn();
    render(<ToolButton tool="rectangle" onSelect={handleSelect} />);

    const button = screen.getByRole('button');
    button.focus();

    // Press Enter
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledTimes(1);

    // Press Space
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleSelect).toHaveBeenCalledTimes(2);
  });

  test('Escape key cancels drawing', async () => {
    render(<App />);

    const rectangleTool = screen.getByRole('button', { name: /rectangle/i });
    fireEvent.click(rectangleTool);

    // Start drawing
    const canvas = screen.getByRole('region', { name: /3d canvas/i });
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Should return to select tool
    const selectTool = screen.getByRole('button', { name: /select/i });
    expect(selectTool).toHaveAttribute('aria-pressed', 'true');
  });
});
```

## Test Utilities

### Custom Render Function

```typescript
import { render as rtlRender } from '@testing-library/react';
import { ReactElement } from 'react';

function render(ui: ReactElement, options = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider>
        <StoreProvider>
          {children}
        </StoreProvider>
      </ThemeProvider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { render };
```

### Mock Data Factories

```typescript
// Test data factories
export const createMockShape = (overrides = {}) => ({
  id: `shape-${Math.random()}`,
  type: 'rectangle',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  area: 100,
  perimeter: 40,
  rotation: 0,
  ...overrides
});

export const createMockMeasurement = (overrides = {}) => ({
  id: `measurement-${Math.random()}`,
  type: 'distance',
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 0 }
  ],
  distance: 10,
  ...overrides
});

// Usage
test('renders shape', () => {
  const shape = createMockShape({ width: 20, height: 15 });
  render(<ShapeRenderer shape={shape} />);
  // ...
});
```

### Performance Test Helper

```typescript
export const measurePerformance = <T>(
  name: string,
  fn: () => T
): { result: T; duration: number } => {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  console.log(`${name}: ${duration.toFixed(2)}ms`);

  return { result, duration };
};

// Usage
test('fast operation', () => {
  const { duration } = measurePerformance('my-operation', () => {
    expensiveCalculation();
  });

  expect(duration).toBeLessThan(10); // 10ms budget
});
```

## Test Coverage

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx'
      ],
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    }
  }
});
```

### Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# View in browser
npx vite preview --open dist/coverage/index.html
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad - tests implementation
test('calls setState with correct value', () => {
  const { setState } = useStore.getState();
  setState({ count: 5 });
  expect(setState).toHaveBeenCalledWith({ count: 5 });
});

// ✅ Good - tests behavior
test('increments count when button is clicked', () => {
  render(<Counter />);
  const button = screen.getByRole('button');

  fireEvent.click(button);

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 2. Use Data Test IDs Sparingly

```typescript
// ❌ Bad - relies on data-testid
<div data-testid="shape-area">Area: 100m²</div>
const area = screen.getByTestId('shape-area');

// ✅ Good - uses accessible queries
<div role="status" aria-label="Shape area">Area: 100m²</div>
const area = screen.getByRole('status', { name: /shape area/i });
```

### 3. Test Edge Cases

```typescript
describe('calculatePolygonArea', () => {
  test('handles normal polygon', () => {
    // Regular test case
  });

  test('handles very small polygon', () => {
    // Edge case: tiny area
  });

  test('handles very large polygon', () => {
    // Edge case: huge area
  });

  test('handles self-intersecting polygon', () => {
    // Edge case: invalid shape
  });

  test('handles null/undefined input', () => {
    // Edge case: missing data
  });
});
```

### 4. Keep Tests Isolated

```typescript
// ❌ Bad - tests depend on each other
test('creates shape', () => {
  addShape(shape1);
  expect(shapes).toHaveLength(1);
});

test('creates another shape', () => {
  // Assumes first test ran!
  addShape(shape2);
  expect(shapes).toHaveLength(2);
});

// ✅ Good - tests are independent
beforeEach(() => {
  resetStore();
});

test('creates shape', () => {
  addShape(shape1);
  expect(shapes).toHaveLength(1);
});

test('creates multiple shapes', () => {
  addShape(shape1);
  addShape(shape2);
  expect(shapes).toHaveLength(2);
});
```

### 5. Use Meaningful Descriptions

```typescript
// ❌ Bad
test('test 1', () => {});
test('it works', () => {});

// ✅ Good
test('calculates area of rectangle correctly', () => {});
test('shows error message when measurement is invalid', () => {});
```

## Testing Checklist

- [ ] Unit tests for all utilities
- [ ] Component tests for all UI components
- [ ] Integration tests for user workflows
- [ ] Performance tests for critical operations
- [ ] Accessibility tests for all interactive elements
- [ ] Error handling tests
- [ ] Edge case tests
- [ ] Keyboard navigation tests
- [ ] Mobile responsiveness tests
- [ ] Coverage > 90%

## Summary

This skill provides comprehensive testing expertise for the Land Visualizer project. Use it when writing unit tests, integration tests, performance tests, or accessibility tests. Always test behavior (not implementation), use accessible queries, keep tests isolated, and maintain high coverage. Testing ensures code quality, prevents regressions, and builds confidence in deployments.
