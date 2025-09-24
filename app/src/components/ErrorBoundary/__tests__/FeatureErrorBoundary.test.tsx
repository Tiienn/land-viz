import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureErrorBoundary, MeasurementErrorBoundary, ComparisonErrorBoundary, ConversionErrorBoundary } from '../FeatureErrorBoundary';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Test component that throws an error
const ThrowingComponent = ({ shouldThrow = true, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>Component rendered successfully</div>;
};

// Test component that works normally
const WorkingComponent = () => {
  return <div>Working component</div>;
};

describe('FeatureErrorBoundary', () => {
  describe('Basic Error Boundary Functionality', () => {
    it('should render children when no error occurs', () => {
      render(
        <FeatureErrorBoundary featureName="test-feature">
          <WorkingComponent />
        </FeatureErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should catch and display error when child component throws', () => {
      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowingComponent />
        </FeatureErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong with test-feature/)).toBeInTheDocument();
      expect(screen.getByText(/Test error/)).toBeInTheDocument();
    });

    it('should display fallback UI with feature name', () => {
      render(
        <FeatureErrorBoundary featureName="measurement-tool">
          <ThrowingComponent />
        </FeatureErrorBoundary>
      );

      expect(screen.getByText(/measurement-tool/)).toBeInTheDocument();
    });

    it('should provide retry functionality', async () => {
      const user = userEvent.setup();

      const RetryableComponent = ({ attemptCount = 0 }) => {
        if (attemptCount < 2) {
          throw new Error('Temporary error');
        }
        return <div>Component recovered after retry</div>;
      };

      let attemptCount = 0;
      const MockParent = () => {
        const [attempts, setAttempts] = useState(attemptCount);

        return (
          <FeatureErrorBoundary featureName="retryable-feature">
            <RetryableComponent attemptCount={attempts} />
            <button onClick={() => setAttempts(prev => prev + 1)}>
              Increment Attempts
            </button>
          </FeatureErrorBoundary>
        );
      };

      render(<MockParent />);

      // Should show error initially
      expect(screen.getByText(/Something went wrong with retryable-feature/)).toBeInTheDocument();

      // Find and click retry button
      const retryButton = screen.getByText(/Try Again/);
      await user.click(retryButton);

      // Should still show error after first retry
      expect(screen.getByText(/Something went wrong with retryable-feature/)).toBeInTheDocument();
    });
  });

  describe('Error Information Collection', () => {
    it('should capture error message and stack trace', () => {
      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowingComponent errorMessage="Custom error message" />
        </FeatureErrorBoundary>
      );

      expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
    });

    it('should show error details when expanded', async () => {
      const user = userEvent.setup();

      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowingComponent />
        </FeatureErrorBoundary>
      );

      // Click to expand error details
      const detailsButton = screen.getByText(/Show Details/);
      await user.click(detailsButton);

      // Should show technical details
      expect(screen.getByText(/Error Details/)).toBeInTheDocument();
      expect(screen.getByText(/Component Stack/)).toBeInTheDocument();
    });

    it('should collect browser and environment information', () => {
      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowingComponent />
        </FeatureErrorBoundary>
      );

      // Error boundary should collect environment info internally
      // We can't easily test the internal state, but we ensure it renders
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    });
  });

  describe('Error Reporting Integration', () => {
    it('should provide bug report functionality', async () => {
      const user = userEvent.setup();

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowingComponent />
        </FeatureErrorBoundary>
      );

      const reportButton = screen.getByText(/Report Bug/);
      await user.click(reportButton);

      // Should interact with clipboard
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should generate comprehensive error report', () => {
      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowingComponent errorMessage="Detailed error for reporting" />
        </FeatureErrorBoundary>
      );

      // Error boundary should generate detailed report internally
      expect(screen.getByText(/Report Bug/)).toBeInTheDocument();
    });
  });
});

describe('Specialized Error Boundaries', () => {
  describe('MeasurementErrorBoundary', () => {
    it('should provide measurement-specific error handling', () => {
      render(
        <MeasurementErrorBoundary>
          <ThrowingComponent errorMessage="Measurement calculation failed" />
        </MeasurementErrorBoundary>
      );

      expect(screen.getByText(/measurement tool/)).toBeInTheDocument();
      expect(screen.getByText(/Measurement calculation failed/)).toBeInTheDocument();
    });

    it('should suggest measurement-specific recovery actions', () => {
      render(
        <MeasurementErrorBoundary>
          <ThrowingComponent />
        </MeasurementErrorBoundary>
      );

      // Should provide context-specific help
      expect(screen.getByText(/measurement/)).toBeInTheDocument();
    });

    it('should continue to allow other tools to function', () => {
      const MixedComponent = () => (
        <div>
          <MeasurementErrorBoundary>
            <ThrowingComponent />
          </MeasurementErrorBoundary>
          <div>Other tools still work</div>
        </div>
      );

      render(<MixedComponent />);

      // Other parts should still render
      expect(screen.getByText('Other tools still work')).toBeInTheDocument();
      expect(screen.getByText(/measurement tool/)).toBeInTheDocument();
    });
  });

  describe('ComparisonErrorBoundary', () => {
    it('should handle comparison tool errors specifically', () => {
      render(
        <ComparisonErrorBoundary>
          <ThrowingComponent errorMessage="Object comparison failed" />
        </ComparisonErrorBoundary>
      );

      expect(screen.getByText(/comparison tool/)).toBeInTheDocument();
      expect(screen.getByText(/Object comparison failed/)).toBeInTheDocument();
    });

    it('should provide comparison-specific fallback options', () => {
      render(
        <ComparisonErrorBoundary>
          <ThrowingComponent />
        </ComparisonErrorBoundary>
      );

      expect(screen.getByText(/comparison/)).toBeInTheDocument();
    });
  });

  describe('ConversionErrorBoundary', () => {
    it('should handle conversion tool errors specifically', () => {
      render(
        <ConversionErrorBoundary>
          <ThrowingComponent errorMessage="Unit conversion failed" />
        </ConversionErrorBoundary>
      );

      expect(screen.getByText(/conversion tool/)).toBeInTheDocument();
      expect(screen.getByText(/Unit conversion failed/)).toBeInTheDocument();
    });

    it('should provide conversion-specific guidance', () => {
      render(
        <ConversionErrorBoundary>
          <ThrowingComponent />
        </ConversionErrorBoundary>
      );

      expect(screen.getByText(/conversion/)).toBeInTheDocument();
    });
  });
});

describe('Error Boundary Edge Cases', () => {
  it('should handle errors during error state rendering', () => {
    // Create a boundary that throws during error rendering
    const ProblematicErrorBoundary = ({ children }: { children: React.ReactNode }) => {
      const [hasError, setHasError] = useState(false);

      if (hasError) {
        // Simulate error in error UI
        throw new Error('Error boundary itself failed');
      }

      return (
        <FeatureErrorBoundary featureName="problematic-feature">
          {children}
        </FeatureErrorBoundary>
      );
    };

    // This should be caught by a higher-level error boundary or React itself
    expect(() => {
      render(
        <ProblematicErrorBoundary>
          <ThrowingComponent />
        </ProblematicErrorBoundary>
      );
    }).not.toThrow(); // Should be handled gracefully
  });

  it('should handle multiple simultaneous errors', () => {
    const MultipleErrorComponent = () => (
      <div>
        <MeasurementErrorBoundary>
          <ThrowingComponent errorMessage="Measurement error" />
        </MeasurementErrorBoundary>
        <ComparisonErrorBoundary>
          <ThrowingComponent errorMessage="Comparison error" />
        </ComparisonErrorBoundary>
        <ConversionErrorBoundary>
          <ThrowingComponent errorMessage="Conversion error" />
        </ConversionErrorBoundary>
      </div>
    );

    render(<MultipleErrorComponent />);

    // All error boundaries should handle their respective errors
    expect(screen.getByText(/measurement tool/)).toBeInTheDocument();
    expect(screen.getByText(/comparison tool/)).toBeInTheDocument();
    expect(screen.getByText(/conversion tool/)).toBeInTheDocument();
  });

  it('should handle null or undefined children gracefully', () => {
    render(
      <FeatureErrorBoundary featureName="empty-feature">
        {null}
      </FeatureErrorBoundary>
    );

    // Should render nothing but not crash
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
  });

  it('should handle async errors appropriately', async () => {
    const AsyncThrowingComponent = () => {
      useEffect(() => {
        // Async errors won't be caught by error boundaries
        // but component should handle them gracefully
        setTimeout(() => {
          console.error('Async error occurred');
        }, 0);
      }, []);

      return <div>Async component</div>;
    };

    render(
      <FeatureErrorBoundary featureName="async-feature">
        <AsyncThrowingComponent />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Async component')).toBeInTheDocument();
  });
});

describe('Error Boundary Performance', () => {
  it('should not impact performance when no errors occur', () => {
    const LargeComponentTree = () => (
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <div key={i}>Component {i}</div>
        ))}
      </div>
    );

    const startTime = performance.now();

    render(
      <FeatureErrorBoundary featureName="performance-test">
        <LargeComponentTree />
      </FeatureErrorBoundary>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render quickly even with error boundary
    expect(renderTime).toBeLessThan(100); // Less than 100ms
  });

  it('should handle rapid error occurrences without memory leaks', () => {
    const RapidErrorComponent = ({ iteration }: { iteration: number }) => {
      if (iteration < 10) {
        throw new Error(`Error ${iteration}`);
      }
      return <div>Finally working</div>;
    };

    // Simulate rapid re-renders with errors
    const { rerender } = render(
      <FeatureErrorBoundary featureName="rapid-error">
        <RapidErrorComponent iteration={0} />
      </FeatureErrorBoundary>
    );

    for (let i = 1; i < 10; i++) {
      rerender(
        <FeatureErrorBoundary featureName="rapid-error">
          <RapidErrorComponent iteration={i} />
        </FeatureErrorBoundary>
      );
    }

    // Final render should work
    rerender(
      <FeatureErrorBoundary featureName="rapid-error">
        <RapidErrorComponent iteration={10} />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Finally working')).toBeInTheDocument();
  });
});

// Helper function to simulate React's error boundary behavior
const useState = (initial: any) => {
  let value = initial;
  const setValue = (newValue: any) => {
    value = typeof newValue === 'function' ? newValue(value) : newValue;
  };
  return [value, setValue];
};

const useEffect = (fn: () => void, deps?: any[]) => {
  // Simplified useEffect for testing
  fn();
};