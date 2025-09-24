# Testing Guide - Land Visualizer

This document provides comprehensive guidance for testing the Land Visualizer application, covering all testing methodologies implemented.

## 📋 Overview

The Land Visualizer testing suite addresses the critical gaps identified in our code review and implements comprehensive coverage across multiple dimensions:

- **Unit Tests** - Individual component and function testing
- **Integration Tests** - Complex user workflow testing
- **Performance Tests** - Regression testing for performance budgets
- **Accessibility Tests** - WCAG 2.1 AA compliance verification
- **Error Boundary Tests** - Feature isolation and graceful degradation

## 🚀 Quick Start

```bash
# Run all tests
npm run test:all

# Run specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:performance   # Performance regression tests
npm run test:accessibility # Accessibility compliance tests

# Development mode (watch for changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📁 Test Organization

```
src/
├── __tests__/
│   ├── integration/         # Complex user workflow tests
│   ├── performance/         # Performance regression tests
│   └── accessibility/       # WCAG compliance tests
├── store/
│   └── __tests__/          # Store-specific unit tests
├── utils/
│   └── __tests__/          # Utility function tests
├── components/
│   └── ErrorBoundary/
│       └── __tests__/      # Error boundary tests
└── test/                   # Legacy test files
```

## 🔧 Testing Architecture

### New Store Architecture Tests

Our refactored domain-specific stores have comprehensive test coverage:

#### Drawing Store (`useDrawingStore.test.ts`)
- **Tool Management**: Active tool switching, edit mode toggling
- **Shape Management**: Add, update, delete, select operations
- **Drawing Process**: Rectangle, polyline, circle drawing workflows
- **Grid and Snapping**: Grid visibility, snap distance controls
- **Performance**: Large shape handling, rapid tool switching

#### Comparison Store (`useComparisonStore.test.ts`)
- **Panel Visibility**: Show/hide comparison panel
- **Object Selection**: Toggle reference objects, selection limits
- **Area Calculations**: Land area setting, unit conversions
- **Display Options**: Scale, arrangement, label controls
- **Integration**: External data handling, realistic scenarios

#### Conversion Store (`useConversionStore.test.ts`)
- **Input Management**: Value setting, validation, error handling
- **Unit Support**: All 12 area units including historical measurements
- **History Management**: Conversion history, size limits
- **Favorites**: Favorite conversions, management features
- **Performance**: Rapid conversions, large number handling

### GeometryLoader Tests (`GeometryLoader.test.ts`)

Tests for our dynamic import system:

- **Basic Loading**: Eiffel Tower, Statue of Liberty geometry loading
- **Caching System**: LRU cache behavior, cache key generation
- **Error Handling**: Import failures, construction errors
- **Memory Management**: Geometry disposal, cache cleanup
- **Performance Tracking**: Load times, cache hit ratios
- **Concurrent Loading**: Simultaneous geometry requests

### Error Boundary Tests (`FeatureErrorBoundary.test.tsx`)

Comprehensive error isolation testing:

- **Basic Functionality**: Error catching, fallback UI display
- **Specialized Boundaries**: Measurement, comparison, conversion boundaries
- **Error Recovery**: Retry functionality, state preservation
- **Edge Cases**: Error boundary failures, multiple simultaneous errors
- **Performance**: Error handling overhead, memory leak prevention

### Performance Monitor Tests (`PerformanceMonitor.test.ts`)

Real-time performance monitoring validation:

- **Basic Monitoring**: Start/stop monitoring, metric recording
- **Performance Budgets**: Budget violation detection, threshold checking
- **Function Measurement**: Sync/async function timing
- **Memory Management**: Metric array size limits, memory monitoring
- **Export Functionality**: Performance data export, JSON formatting

### Validation Service Tests (`ValidationService.test.ts`)

Edge case validation comprehensive coverage:

- **Area Validation**: Positive numbers, NaN/Infinity handling, precision
- **Point Validation**: Coordinate validation, bounds checking
- **Distance Validation**: Distance calculations, edge cases
- **Unit Conversion**: All supported units, precision warnings
- **Polygon Validation**: Shape validation, self-intersection detection
- **Batch Operations**: Multiple validation, performance optimization

## 🔄 Integration Testing

### User Workflow Tests (`UserWorkflows.test.tsx`)

Real-world usage scenarios:

#### Complete Land Planning Workflow
1. Draw property boundary (rectangle)
2. Measure distances within property
3. Compare area to reference objects
4. Convert to different units
5. Verify data persistence across tool switches

#### Professional Survey Workflow
1. Create precise property corners
2. Measure all boundaries
3. Calculate total area
4. Convert to surveying units (acres, hectares)
5. Generate measurement documentation

#### Real Estate Development
1. Create development area
2. Subdivide into individual lots
3. Analyze lot sizes against reference objects
4. Calculate development density
5. Plan mixed-use zones

#### Error Recovery Testing
- Invalid measurements gracefully handled
- Rapid tool switching without data loss
- Large dataset performance maintenance

## ⚡ Performance Testing

### Performance Budgets (`PerformanceRegression.test.ts`)

Defined performance thresholds:

```javascript
const PERFORMANCE_BUDGETS = {
  storeOperations: {
    addShape: 5,      // ms
    updateShape: 3,   // ms
    deleteShape: 2,   // ms
    selectShape: 1,   // ms
  },
  calculations: {
    areaCalculation: 10,      // ms
    distanceCalculation: 2,   // ms
    conversionCalculation: 5, // ms
    validationCheck: 3,       // ms
  },
  batchOperations: {
    add100Shapes: 100,        // ms
    perform50Conversions: 200, // ms
    validate100Items: 50,     // ms
  },
  memoryUsage: {
    maxShapes: 1000,      // shapes before degradation
    maxMeasurements: 500, // measurements before cleanup
    maxConversions: 100,  // conversion history limit
  }
};
```

### Test Categories
- **Store Operations**: Individual CRUD operation timing
- **Calculations**: Area, distance, conversion computation speed
- **Batch Operations**: Large dataset handling performance
- **Memory Management**: Memory usage limits, cleanup efficiency
- **Real-World Scenarios**: Complete user session performance

## ♿ Accessibility Testing

### WCAG 2.1 AA Compliance (`AccessibilityTests.test.tsx`)

Comprehensive accessibility validation:

#### Compliance Areas
- **No Violations**: Automated axe-core testing
- **Heading Hierarchy**: Proper h1-h6 structure
- **Color Contrast**: Sufficient contrast ratios
- **Alt Text**: Meaningful image descriptions

#### Keyboard Navigation
- **Full Navigation**: Tab order, focus management
- **Modal Focus**: Focus trapping in dialogs
- **Key Activation**: Enter/Space key support

#### Screen Reader Support
- **ARIA Labels**: Proper labeling on interactive elements
- **Dynamic Content**: Live region announcements
- **Form Labels**: Input-label associations

#### Visual Accessibility
- **Zoom Support**: 200% zoom functionality
- **High Contrast**: High contrast mode support
- **Reduced Motion**: Motion preference respect

#### Mobile Accessibility
- **Touch Targets**: 44x44px minimum size
- **Gesture Alternatives**: Keyboard alternatives for gestures

## 🛠️ Development Workflow

### Running Tests During Development

```bash
# Watch mode for active development
npm run test:watch

# Quick unit test run
npm run test:unit

# Full test suite before committing
npm run test:all

# Check test coverage
npm run test:coverage
```

### Writing New Tests

#### For New Features
1. **Start with unit tests** for individual functions/components
2. **Add integration tests** for user workflows
3. **Include performance tests** if feature affects performance
4. **Add accessibility tests** for UI components

#### Test Structure
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Reset state
  });

  describe('Basic Functionality', () => {
    it('should handle normal use case', () => {
      // Test implementation
    });
  });

  describe('Edge Cases', () => {
    it('should handle error conditions', () => {
      // Error testing
    });
  });

  describe('Performance', () => {
    it('should complete within budget', () => {
      // Performance validation
    });
  });
});
```

## 📊 Coverage Metrics

### Current Coverage Goals
- **Unit Tests**: >90% function coverage
- **Integration Tests**: 100% critical user workflow coverage
- **Performance Tests**: 100% performance budget coverage
- **Accessibility Tests**: 100% WCAG 2.1 AA compliance

### Coverage Reports

```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage in browser
npx vite preview --open dist/coverage/index.html
```

## 🐛 Debugging Tests

### Common Issues

#### Test Environment Setup
```typescript
// Mock Three.js for component tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>
}));
```

#### Performance Test Variability
```typescript
// Use performance budgets with reasonable margins
expect(duration).toBeLessThan(BUDGET * 1.5); // 50% margin
```

#### Accessibility Test False Positives
```typescript
// Configure axe for specific contexts
const results = await axe(container, {
  rules: {
    'color-contrast': { enabled: false } // If testing in headless mode
  }
});
```

### Debugging Commands
```bash
# Run specific test with debug output
npm run test -- --reporter=verbose src/path/to/test.test.ts

# Run tests in browser for debugging
npm run test -- --ui

# Debug performance tests
npm run test:performance -- --reporter=verbose
```

## 🚀 Continuous Integration

### CI/CD Pipeline Integration

```yaml
# Example GitHub Actions workflow
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run test:all
    - run: npm run test:coverage
    - uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### Pre-commit Hooks
```bash
# Install husky for pre-commit testing
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test:unit"
```

## 📈 Performance Monitoring

### Real-time Monitoring

The PerformanceMonitor service provides real-time insights:

```typescript
import { performanceMonitor, measurePerformance } from '../utils/PerformanceMonitor';

// Measure function performance
const result = measurePerformance('feature-name', () => {
  return expensiveCalculation();
});

// Get performance summary
const summary = performanceMonitor.getPerformanceSummary();
console.log('Budget violations:', summary.budgetViolations);
```

### Performance Budgets in Development

Set up automatic warnings:

```typescript
// In development environment
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();

  // Warn when budgets are exceeded
  setInterval(() => {
    const summary = performanceMonitor.getPerformanceSummary();
    if (summary.budgetViolations.length > 0) {
      console.warn('Performance budget violations detected:', summary.budgetViolations);
    }
  }, 5000);
}
```

## 🎯 Best Practices

### Test Writing Guidelines

1. **Descriptive Names**: Use clear, descriptive test names
2. **Single Responsibility**: One assertion per test when possible
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Isolate units under test
5. **Clean Up**: Reset state between tests

### Performance Testing
1. **Consistent Environment**: Run performance tests in consistent conditions
2. **Multiple Runs**: Average results over multiple runs
3. **Realistic Data**: Use realistic dataset sizes
4. **Budget Margins**: Allow reasonable margins for variability

### Accessibility Testing
1. **Real User Testing**: Supplement automated tests with real user testing
2. **Multiple Screen Readers**: Test with different assistive technologies
3. **Keyboard Only**: Test complete workflows with keyboard only
4. **Color Blindness**: Test with color blindness simulators

## 🔍 Troubleshooting

### Common Test Failures

#### Memory Leaks in Tests
```typescript
// Clean up after tests
afterEach(() => {
  performanceMonitor.resetPerformanceStats();
  geometryLoader.dispose();
});
```

#### Timing-Sensitive Tests
```typescript
// Use fake timers for predictable timing
vi.useFakeTimers();
// ... test code ...
vi.useRealTimers();
```

#### Three.js Context Issues
```typescript
// Mock WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    // Mock WebGL context
  })
});
```

## 📚 Resources

### Testing Libraries
- **Vitest**: Modern test runner
- **React Testing Library**: Component testing utilities
- **jest-axe**: Accessibility testing
- **@axe-core/react**: React accessibility integration

### Performance Tools
- **Performance Observer API**: Browser performance monitoring
- **Performance.now()**: High-resolution timing
- **Memory API**: Memory usage monitoring

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Performance Best Practices](https://web.dev/performance/)

---

## 📝 Summary

The comprehensive testing suite addresses all critical gaps identified in our code review:

✅ **Store Architecture**: Domain-specific store testing
✅ **Bundle Optimization**: GeometryLoader and dynamic import testing
✅ **Error Boundaries**: Feature isolation and error recovery testing
✅ **Performance Monitoring**: Real-time performance tracking and budget enforcement
✅ **Edge Case Validation**: Comprehensive input validation testing
✅ **Integration Workflows**: Complete user workflow testing
✅ **Accessibility Compliance**: WCAG 2.1 AA compliance verification

This testing infrastructure ensures code quality, performance, and accessibility standards are maintained as the Land Visualizer project continues to grow and evolve.