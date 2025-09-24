import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Feature-specific error boundary that gracefully handles errors
 * in individual feature areas without crashing the entire application
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { featureName, onError } = this.props;

    // Log error details
    logger.error(`${featureName} feature error`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to error tracking service (if available)
    if (typeof window !== 'undefined' && (window as any).errorTracker) {
      (window as any).errorTracker.captureException(error, {
        tags: {
          featureName,
          errorBoundary: true,
        },
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    logger.info(`Retrying ${this.props.featureName} feature`);
  };

  handleReportBug = () => {
    const { featureName } = this.props;
    const { error, errorInfo } = this.state;

    const bugReportData = {
      feature: featureName,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard for easy bug reporting
    navigator.clipboard.writeText(JSON.stringify(bugReportData, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please paste this when reporting the bug.');
      })
      .catch(() => {
        console.log('Bug report data:', bugReportData);
        alert('Please check the console for error details to include in your bug report.');
      });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, featureName, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            padding: '20px',
            margin: '10px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#c53030', fontSize: '16px' }}>
              ⚠️ {featureName} Error
            </h3>
            <p style={{ margin: '0', color: '#744210', fontSize: '14px' }}>
              The {featureName} feature encountered an error and has been temporarily disabled.
            </p>
          </div>

          {error && (
            <details style={{ marginBottom: '16px' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  color: '#744210',
                  fontSize: '12px',
                  marginBottom: '8px',
                }}
              >
                Error Details
              </summary>
              <pre
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  overflow: 'auto',
                  maxHeight: '150px',
                  color: '#444',
                }}
              >
                {error.message}
                {error.stack && `\n\nStack trace:\n${error.stack}`}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleReportBug}
              style={{
                padding: '8px 16px',
                backgroundColor: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Report Bug
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component for wrapping features with error boundaries
 */
export function withFeatureErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureName: string,
  options: {
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  } = {}
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <FeatureErrorBoundary
      featureName={featureName}
      fallback={options.fallback}
      onError={options.onError}
    >
      <WrappedComponent {...props} />
    </FeatureErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withFeatureErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithErrorBoundary;
}

/**
 * Specialized error boundaries for specific features
 */

// Measurement Tool Error Boundary
export const MeasurementErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary
    featureName="Measurement Tool"
    fallback={
      <div
        style={{
          padding: '12px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404',
        }}
      >
        📏 Measurement tool is temporarily unavailable. Drawing tools are still functional.
      </div>
    }
  >
    {children}
  </FeatureErrorBoundary>
);

// Visual Comparison Error Boundary
export const ComparisonErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary
    featureName="Visual Comparison"
    fallback={
      <div
        style={{
          padding: '12px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#1565c0',
        }}
      >
        📊 Comparison tool is temporarily unavailable. Other features are still working.
      </div>
    }
  >
    {children}
  </FeatureErrorBoundary>
);

// Unit Conversion Error Boundary
export const ConversionErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary
    featureName="Unit Conversion"
    fallback={
      <div
        style={{
          padding: '12px',
          backgroundColor: '#f3e5f5',
          border: '1px solid #e1bee7',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#6a1b9a',
        }}
      >
        🔄 Unit conversion is temporarily unavailable. You can still draw and measure shapes.
      </div>
    }
  >
    {children}
  </FeatureErrorBoundary>
);

// 3D Scene Error Boundary
export const SceneErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary
    featureName="3D Scene"
    fallback={
      <div
        style={{
          padding: '40px',
          backgroundColor: '#fafafa',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0' }}>🎮 3D Scene Error</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
          The 3D visualization is temporarily unavailable.
          <br />
          This may be due to WebGL compatibility issues.
        </p>
        <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
          Try refreshing the page or using a different browser.
        </p>
      </div>
    }
  >
    {children}
  </FeatureErrorBoundary>
);

// Layer Panel Error Boundary
export const LayerErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary
    featureName="Layer Management"
    fallback={
      <div
        style={{
          padding: '12px',
          backgroundColor: '#fff8e1',
          border: '1px solid #ffecb3',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#e65100',
        }}
      >
        📑 Layer panel is temporarily unavailable. Shapes will be added to the main layer.
      </div>
    }
  >
    {children}
  </FeatureErrorBoundary>
);