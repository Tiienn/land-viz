# Testing Strategy
**Land Visualizer Quality Assurance Plan**  
*Version 1.0 | August 2025*

---

## 🎯 Testing Philosophy

> **"Test what matters, automate everything, fail fast"**

Our testing strategy prioritizes user-critical paths while maintaining high code coverage. We test for accuracy, performance, and user experience across all devices and browsers.

---

## 📊 Coverage Goals

| Test Type | Target Coverage | Current | Priority |
|-----------|----------------|---------|----------|
| Unit Tests | 80% | 45% | High |
| Integration Tests | 60% | 20% | Medium |
| E2E Tests | Critical Paths | 30% | High |
| Performance Tests | All Features | 10% | Medium |
| Accessibility Tests | WCAG 2.1 AA | 0% | High |

---

## 🏗️ Test Structure

```
tests/
├── unit/                    # Isolated component/function tests
│   ├── components/         # React component tests
│   ├── services/          # Service logic tests
│   ├── utils/             # Utility function tests
│   └── hooks/             # Custom hook tests
│
├── integration/            # Module interaction tests
│   ├── drawing-flow.test.ts
│   ├── calculation-pipeline.test.ts
│   ├── rotation-system.test.ts
│   ├── resize-system.test.ts
│   ├── drag-transform.test.ts
│   └── chili3d-integration.test.ts
│
├── e2e/                    # End-to-end user journeys
│   ├── user-journeys/
│   ├── mobile-flows/
│   └── cross-browser/
│
├── performance/            # Load and stress tests
│   ├── render-performance.test.ts
│   ├── calculation-speed.test.ts
│   └── memory-usage.test.ts
│
├── precision/              # Accuracy validation
│   ├── area-calculations.test.ts
│   ├── unit-conversions.test.ts
│   └── chili3d-accuracy.test.ts
│
├── accessibility/          # A11y compliance
│   ├── keyboard-navigation.test.ts
│   ├── screen-reader.test.ts
│   └── wcag-compliance.test.ts
│
└── fixtures/               # Test data
    ├── shapes/            # Sample polygons
    ├── calculations/      # Expected results
    └── mocks/            # Service mocks
```

---

## 🧪 Unit Testing

### Component Testing

```typescript
// tests/unit/components/ShapeDrawer.test.tsx
import { render, fireEvent, screen } from '@testing-library/react';
import { ShapeDrawer } from '@/components/drawing/ShapeDrawer';

describe('ShapeDrawer Component', () => {
  it('should complete shape after 3 points', () => {
    const onComplete = jest.fn();
    render(<ShapeDrawer onShapeComplete={onComplete} />);
    
    const canvas = screen.getByTestId('drawing-canvas');
    
    // Add 3 points
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(canvas, { clientX: 200, clientY: 100 });
    fireEvent.click(canvas, { clientX: 150, clientY: 200 });
    
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        points: expect.arrayContaining([
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 150, y: 200 }
        ]),
        closed: true
      })
    );
  });

  it('should handle invalid shapes gracefully', () => {
    render(<ShapeDrawer />);
    const canvas = screen.getByTestId('drawing-canvas');
    
    // Create self-intersecting shape
    fireEvent.click(canvas, { clientX: 0, clientY: 0 });
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(canvas, { clientX: 100, clientY: 0 });
    fireEvent.click(canvas, { clientX: 0, clientY: 100 });
    
    expect(screen.getByText(/Invalid shape/i)).toBeInTheDocument();
  });
});
```

### Service Testing

```typescript
// tests/unit/services/calculations.test.ts
import { CalculationService } from '@/services/core/calculations';

describe('CalculationService', () => {
  const calculator = new CalculationService();

  describe('Area Calculations', () => {
    it('calculates square area correctly', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];
      
      const area = calculator.calculateArea(square);
      expect(area).toBe(10000); // 100 * 100
    });

    it('calculates triangle area correctly', () => {
      const triangle = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 86.6 } // Equilateral triangle
      ];
      
      const area = calculator.calculateArea(triangle);
      expect(area).toBeCloseTo(4330, 0); // (base * height) / 2
    });

    it('handles complex polygons', () => {
      const complexShape = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 75, y: 25 },
        { x: 75, y: 75 },
        { x: 50, y: 100 },
        { x: 0, y: 100 },
        { x: -25, y: 50 }
      ];
      
      const area = calculator.calculateArea(complexShape);
      expect(area).toBeGreaterThan(0);
      expect(area).toBeLessThan(10000);
    });
  });

  describe('Perimeter Calculations', () => {
    it('calculates perimeter correctly', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];
      
      const perimeter = calculator.calculatePerimeter(square);
      expect(perimeter).toBe(400); // 4 * 100
    });
  });
});
```

### Hook Testing

```typescript
// tests/unit/hooks/useCalculations.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useCalculations } from '@/hooks/useCalculations';

describe('useCalculations Hook', () => {
  it('updates calculations when shape changes', () => {
    const { result } = renderHook(() => useCalculations());
    
    act(() => {
      result.current.setShape([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ]);
    });
    
    expect(result.current.area).toBe(10000);
    expect(result.current.perimeter).toBe(400);
  });

  it('converts units correctly', () => {
    const { result } = renderHook(() => useCalculations());
    
    act(() => {
      result.current.setShape(squareMeters(100));
      result.current.setUnit('acres');
    });
    
    expect(result.current.area).toBeCloseTo(0.0247, 4);
  });
});
```

---

## 🔗 Integration Testing

### Drawing to Calculation Pipeline

```typescript
// tests/integration/drawing-calculation-flow.test.ts
import { render } from '@testing-library/react';
import { App } from '@/App';

describe('Drawing to Calculation Integration', () => {
  it('completes full drawing and calculation flow', async () => {
    const { getByTestId, getByText } = render(<App />);
    
    // Draw shape
    const canvas = getByTestId('main-canvas');
    await drawShape(canvas, testSquare);
    
    // Check calculations appear
    expect(getByText(/Area: 10,000 m²/)).toBeInTheDocument();
    expect(getByText(/Perimeter: 400 m/)).toBeInTheDocument();
    
    // Add comparison
    const compareButton = getByText('Compare');
    fireEvent.click(compareButton);
  });
});
```

### Rotation System Integration

```typescript
// tests/integration/rotation-system.test.ts
import { render, fireEvent, waitFor } from '@testing-library/react';
import { App } from '@/App';

describe('Rotation System Integration', () => {
  it('completes full rotation workflow with snapping', async () => {
    const { getByTestId, getByTitle } = render(<App />);
    
    // Draw a rectangle first
    const canvas = getByTestId('main-canvas');
    await drawRectangle(canvas, { x: 0, y: 0 }, { x: 100, y: 100 });
    
    // Enter rotation mode
    const rotateHandle = await waitFor(() => getByTitle('Drag to rotate shape'));
    expect(rotateHandle).toBeInTheDocument();
    
    // Start rotation
    fireEvent.pointerDown(rotateHandle);
    fireEvent.pointerMove(rotateHandle, { clientX: 150, clientY: 50 });
    
    // Test dynamic shift snapping
    fireEvent.keyDown(document, { key: 'Shift' });
    fireEvent.pointerMove(rotateHandle, { clientX: 160, clientY: 60 });
    
    // Should snap to 45° increment
    const angleDisplay = getByText(/45°.*⇧.*45°/);
    expect(angleDisplay).toBeInTheDocument();
    
    // Complete rotation
    fireEvent.pointerUp(rotateHandle);
    fireEvent.keyUp(document, { key: 'Shift' });
    
    // Verify rotation metadata is stored
    const rotatedShape = store.getState().shapes.find(s => s.rotation?.angle === 45);
    expect(rotatedShape).toBeDefined();
  });

  it('handles drag after rotation correctly', async () => {
    const { getByTestId } = render(<App />);
    
    // Create and rotate a shape
    const canvas = getByTestId('main-canvas');
    const shape = await drawAndRotateShape(canvas, 45);
    
    // Now drag the rotated shape
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 100 });
    
    // Shape should follow cursor exactly (no offset due to rotation)
    const dragState = store.getState().dragState;
    expect(dragState.currentPosition).toEqual({ x: 100, y: 100 });
    
    fireEvent.pointerUp(canvas);
    
    // Verify final position is correct
    const finalShape = store.getState().shapes.find(s => s.id === shape.id);
    expect(finalShape?.points[0].x).toBeCloseTo(50, 1); // Moved by 50 units
  });
});
    
    // Verify comparison
    expect(getByText(/1.4 soccer fields/)).toBeInTheDocument();
  });
});
```

### Chili3D Integration

```typescript
// tests/integration/chili3d-integration.test.ts
describe('Chili3D Precision Mode', () => {
  it('falls back gracefully when WASM unavailable', async () => {
    // Mock WASM failure
    jest.spyOn(WebAssembly, 'instantiate').mockRejectedValue(
      new Error('WASM not supported')
    );
    
    const calculator = new PrecisionCalculator();
    const result = await calculator.calculate(testShape);
    
    expect(result.precision).toBe('standard');
    expect(result.area).toBeCloseTo(expectedArea, 1);
  });

  it('uses precision mode when available', async () => {
    const calculator = new PrecisionCalculator();
    await calculator.initialize();
    
    const result = await calculator.calculate(testShape);
    
    expect(result.precision).toBe('professional');
    expect(result.area).toBeCloseTo(expectedArea, 4); // Higher precision
  });
});
```

---

## 🚀 E2E Testing

### Critical User Journeys

```typescript
// tests/e2e/user-journeys/first-time-user.cy.ts
describe('First Time User Journey', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('completes property visualization in 30 seconds', () => {
    // Start timer
    const startTime = Date.now();
    
    // Draw property boundary
    cy.get('[data-cy=draw-tool]').click();
    cy.get('[data-cy=canvas]')
      .click(100, 100)
      .click(300, 100)
      .click(300, 300)
      .click(100, 300);
    
    // Verify shape completed
    cy.contains('Area: 40,000 m²').should('be.visible');
    
    // Add comparison
    cy.get('[data-cy=compare-tool]').click();
    cy.get('[data-cy=soccer-field]').click();
    
    // Verify understanding
    cy.contains('5.6 soccer fields').should('be.visible');
    
    // Check time
    const duration = Date.now() - startTime;
    expect(duration).to.be.lessThan(30000); // Under 30 seconds
  });
});
```

### Mobile Testing

```typescript
// tests/e2e/mobile-flows/touch-gestures.cy.ts
describe('Mobile Touch Interactions', () => {
  beforeEach(() => {
    cy.viewport('iphone-12');
    cy.visit('/');
  });

  it('supports touch drawing', () => {
    cy.get('[data-cy=canvas]')
      .trigger('touchstart', { touches: [{ pageX: 50, pageY: 50 }] })
      .trigger('touchend');
    
    // Add more points
    cy.touchPoint(150, 50);
    cy.touchPoint(150, 150);
    cy.touchPoint(50, 150);
    
    cy.contains('Area').should('be.visible');
  });

  it('supports pinch zoom', () => {
    cy.get('[data-cy=canvas]')
      .trigger('touchstart', {
        touches: [
          { pageX: 100, pageY: 100 },
          { pageX: 200, pageY: 200 }
        ]
      })
      .trigger('touchmove', {
        touches: [
          { pageX: 50, pageY: 50 },
          { pageX: 250, pageY: 250 }
        ]
      })
      .trigger('touchend');
    
    cy.get('[data-cy=zoom-level]').should('contain', '150%');
  });
});
```

### Cross-Browser Testing

```typescript
// tests/e2e/cross-browser/compatibility.cy.ts
const browsers = ['chrome', 'firefox', 'safari', 'edge'];

browsers.forEach(browser => {
  describe(`${browser} Compatibility`, () => {
    it('renders 3D scene correctly', {
      browser: browser
    }, () => {
      cy.visit('/');
      cy.get('[data-cy=3d-canvas]').should('be.visible');
      cy.matchImageSnapshot(`${browser}-3d-scene`);
    });
    
    it('handles WebGL fallback', {
      browser: browser
    }, () => {
      // Disable WebGL
      cy.on('window:before:load', (win) => {
        delete win.WebGLRenderingContext;
      });
      
      cy.visit('/');
      cy.contains('2D Mode').should('be.visible');
    });
  });
});
```

---

## ⚡ Performance Testing

### Render Performance

```typescript
// tests/performance/render-performance.test.ts
import { measureFPS } from '@/utils/performance';

describe('Rendering Performance', () => {
  it('maintains 60 FPS during shape drawing', async () => {
    const fps = await measureFPS(async () => {
      // Simulate drawing complex shape
      for (let i = 0; i < 20; i++) {
        await addPoint(randomPoint());
        await wait(50); // Simulate user speed
      }
    });
    
    expect(fps.average).toBeGreaterThanOrEqual(60);
    expect(fps.min).toBeGreaterThanOrEqual(30);
  });

  it('handles 1000 comparison objects', async () => {
    const startTime = performance.now();
    
    // Add many comparison objects
    for (let i = 0; i < 1000; i++) {
      addComparisonObject('parking-space', { x: i * 10, y: i * 10 });
    }
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // Under 1 second
  });
});
```

### Memory Testing

```typescript
// tests/performance/memory-usage.test.ts
describe('Memory Management', () => {
  it('does not leak memory on shape redraws', async () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    
    // Repeatedly create and destroy shapes
    for (let i = 0; i < 100; i++) {
      const shape = createComplexShape(100); // 100 vertices
      drawShape(shape);
      clearCanvas();
    }
    
    // Force garbage collection
    await wait(100);
    
    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
  });
});
```

---

## 🎯 Precision Testing

### Accuracy Validation

```typescript
// tests/precision/area-calculations.test.ts
describe('Calculation Accuracy', () => {
  const testCases = [
    {
      name: 'Perfect Square',
      points: square(100),
      expectedArea: 10000,
      tolerance: 0.01
    },
    {
      name: 'Right Triangle',
      points: rightTriangle(100, 50),
      expectedArea: 2500,
      tolerance: 0.01
    },
    {
      name: 'Regular Pentagon',
      points: regularPolygon(5, 100),
      expectedArea: 17204.77,
      tolerance: 0.01
    },
    {
      name: 'Complex Concave',
      points: loadFixture('complex-concave.json'),
      expectedArea: 45678.9,
      tolerance: 0.01
    }
  ];

  testCases.forEach(testCase => {
    it(`calculates ${testCase.name} within ${testCase.tolerance}%`, () => {
      const result = calculator.calculateArea(testCase.points);
      const percentError = Math.abs(result - testCase.expectedArea) 
        / testCase.expectedArea * 100;
      
      expect(percentError).toBeLessThan(testCase.tolerance);
    });
  });
});
```

### Chili3D Precision Validation

```typescript
// tests/precision/chili3d-accuracy.test.ts
describe('Chili3D Precision Mode', () => {
  it('achieves survey-grade accuracy', async () => {
    const surveyData = loadFixture('survey-data.json');
    const calculator = new Chili3DCalculator();
    
    for (const parcel of surveyData.parcels) {
      const result = await calculator.calculate(parcel.points);
      
      // Survey-grade: ±0.01% accuracy
      const error = Math.abs(result.area - parcel.certifiedArea);
      const percentError = (error / parcel.certifiedArea) * 100;
      
      expect(percentError).toBeLessThan(0.01);
    }
  });
});
```

---

## ♿ Accessibility Testing

### Keyboard Navigation

```typescript
// tests/accessibility/keyboard-navigation.test.ts
describe('Keyboard Accessibility', () => {
  it('allows complete keyboard navigation', () => {
    render(<App />);
    
    // Tab through interface
    userEvent.tab(); // Focus on draw tool
    expect(screen.getByTestId('draw-tool')).toHaveFocus();
    
    userEvent.keyboard('{Enter}'); // Activate draw
    
    // Navigate canvas with arrows
    userEvent.keyboard('{ArrowRight}{ArrowRight}');
    userEvent.keyboard('{Space}'); // Place point
    
    // Continue tabbing
    userEvent.tab(); // Compare tool
    userEvent.tab(); // Export button
    
    // Verify all interactive elements reachable
    const interactiveElements = screen.getAllByRole('button');
    interactiveElements.forEach(element => {
      expect(element).toHaveAttribute('tabIndex');
    });
  });
});
```

### Screen Reader Compliance

```typescript
// tests/accessibility/screen-reader.test.ts
describe('Screen Reader Support', () => {
  it('provides meaningful ARIA labels', () => {
    render(<App />);
    
    expect(screen.getByRole('application')).toHaveAttribute(
      'aria-label', 'Land Visualizer Drawing Canvas'
    );
    
    expect(screen.getByRole('button', { name: /draw property boundary/i }))
      .toBeInTheDocument();
    
    // Dynamic announcements
    drawShape(testSquare);
    
    expect(screen.getByRole('status')).toHaveTextContent(
      'Shape completed. Area: 10,000 square meters'
    );
  });
});
```

---

## 🤖 Test Automation

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v2

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, edge]
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run test:e2e:${{ matrix.browser }}

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run test:performance
      - name: Upload metrics
        uses: actions/upload-artifact@v2
        with:
          name: performance-metrics
          path: metrics/
```

### Pre-commit Hooks

```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run fast tests before commit
npm run test:unit:changed
npm run lint
npm run type-check
```

---

## 📊 Test Metrics & Reporting

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Output
-------------------------|---------|----------|---------|---------|
File                     | % Stmts | % Branch | % Funcs | % Lines |
-------------------------|---------|----------|---------|---------|
All files                |   78.43 |    65.38 |   81.25 |   78.13 |
 components/             |   85.71 |    70.00 |   90.00 |   85.71 |
  ShapeDrawer.tsx       |   90.00 |    75.00 |  100.00 |   90.00 |
  Scene.tsx             |   82.35 |    66.67 |   85.71 |   82.35 |
 services/              |   72.73 |    60.00 |   75.00 |   72.73 |
  calculations.ts       |   95.00 |    85.00 |  100.00 |   95.00 |
  precision.ts          |   65.00 |    50.00 |   66.67 |   65.00 |
-------------------------|---------|----------|---------|---------|
```

### Performance Benchmarks

```typescript
// Automated performance tracking
const benchmarks = {
  'Shape Drawing': {
    target: '< 100ms',
    current: '87ms',
    trend: '↓ 5%'
  },
  'Area Calculation': {
    target: '< 50ms',
    current: '32ms',
    trend: '↓ 12%'
  },
  'WASM Load': {
    target: '< 500ms',
    current: '423ms',
    trend: '↑ 2%'
  }
};
```

---

## 🔄 Continuous Improvement

### Weekly Test Review
- Review failed tests
- Update flaky tests
- Add tests for new features
- Refactor test utilities

### Monthly Test Audit
- Coverage analysis
- Performance regression check
- Cross-browser validation
- Accessibility compliance review

### Quarterly Strategy Review
- Evaluate test effectiveness
- Update coverage goals
- Tool and framework assessment
- Team training needs

---

*This testing strategy ensures Land Visualizer maintains high quality, accuracy, and performance across all features and platforms. Regular testing and automation enable confident deployments and rapid iteration.*