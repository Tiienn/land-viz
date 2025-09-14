import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Monitor } from 'lucide-react';
import { logger } from '../../utils/logger';
import { errorReporting } from '../../utils/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Specialized error boundary for 3D scene components
 * Handles Three.js, WebGL, and rendering-related errors
 */
export class SceneErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('3D Scene Error:', error, errorInfo);
    
    // Report to error reporting service
    errorReporting.reportError(error, errorInfo, {
      type: '3D_SCENE',
      componentName: 'SceneErrorBoundary',
      additionalData: {
        isWebGLError: this.isWebGLError(error),
        userAgent: navigator.userAgent,
        webGLSupported: this.checkWebGLSupport()
      }
    });
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleResetScene = () => {
    // Clear any cached geometries, dispose Three.js resources
    try {
      // Import GeometryCache dynamically to avoid circular deps
      import('../../utils/GeometryCache').then(({ GeometryCache }) => {
        GeometryCache.dispose();
      });
    } catch (e) {
      logger.warn('Failed to dispose GeometryCache:', e);
    }

    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private isWebGLError = (error: Error): boolean => {
    const webglKeywords = [
      'webgl', 'gl context', 'context lost', 'shader', 'texture', 'buffer',
      'three.js', 'threejs', 'renderer', 'geometry', 'material'
    ];
    const errorMessage = error.message.toLowerCase();
    return webglKeywords.some(keyword => errorMessage.includes(keyword));
  };

  private checkWebGLSupport = (): boolean => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  };

  private getErrorSpecificAdvice = (): string[] => {
    if (!this.state.error) return [];
    
    if (this.isWebGLError(this.state.error)) {
      return [
        '• Your graphics card may not support WebGL',
        '• Try updating your graphics drivers',
        '• Switch to a different browser (Chrome/Firefox recommended)',
        '• Close other GPU-intensive applications',
        '• Check if hardware acceleration is enabled in browser settings'
      ];
    }

    return [
      '• The 3D scene encountered an unexpected error',
      '• Try resetting the scene to clear any corrupted state',
      '• If the issue persists, try clearing your browser cache',
      '• Ensure your browser supports modern JavaScript features'
    ];
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fecaca',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '50%',
                border: '2px solid #fca5a5'
              }}>
                <Monitor style={{ width: '24px', height: '24px', color: '#dc2626' }} />
              </div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                3D Scene Error
              </h2>
            </div>

            <p style={{
              color: '#6b7280',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              The 3D visualization encountered an error and needs to be reset.
            </p>

            {/* Error-specific advice */}
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              background: '#fef7ff',
              borderRadius: '6px',
              border: '1px solid #e9d5ff',
              textAlign: 'left'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#7c3aed',
                margin: '0 0 8px 0'
              }}>Troubleshooting:</h4>
              <ul style={{
                fontSize: '12px',
                color: '#6b46c1',
                margin: 0,
                paddingLeft: '16px',
                lineHeight: '1.4'
              }}>
                {this.getErrorSpecificAdvice().map((advice, index) => (
                  <li key={index} style={{ marginBottom: '2px' }}>{advice}</li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleResetScene}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                <RefreshCw style={{ width: '14px', height: '14px' }} />
                <span>Reset Scene</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
              >
                <AlertTriangle style={{ width: '14px', height: '14px' }} />
                <span>Reload App</span>
              </button>
            </div>

            {/* Development error details */}
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                marginTop: '16px',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                textAlign: 'left'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#6b7280'
                }}>
                  Developer Details
                </summary>
                <pre style={{
                  marginTop: '8px',
                  fontSize: '10px',
                  color: '#ef4444',
                  fontFamily: 'Monaco, Menlo, monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '100px',
                  overflow: 'auto'
                }}>
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack.slice(0, 500)}...`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SceneErrorBoundary;