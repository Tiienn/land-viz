import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Land Visualizer Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            maxWidth: '672px',
            width: '100%',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '8px'
              }}>
                <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Land Visualizer Error
                </h1>
                <p style={{
                  color: '#6b7280',
                  margin: '4px 0 0 0',
                  fontSize: '16px'
                }}>
                  Something went wrong while loading the application
                </p>
              </div>
            </div>

            {/* Error Details */}
            {this.state.error && (
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: '8px',
                  fontSize: '16px'
                }}>Error Details:</h3>
                <p style={{
                  fontSize: '14px',
                  color: '#dc2626',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  marginBottom: '8px'
                }}>
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      ':hover': { color: '#111827' }
                    }}>
                      View Stack Trace
                    </summary>
                    <pre style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      whiteSpace: 'pre-wrap',
                      background: 'white',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb',
                      maxHeight: '128px',
                      overflow: 'auto'
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Component Stack */}
            {this.state.errorInfo && (
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <details>
                  <summary style={{
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Component Stack Trace
                  </summary>
                  <pre style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6b7280',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    whiteSpace: 'pre-wrap',
                    background: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                    maxHeight: '128px',
                    overflow: 'auto'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}

            {/* Troubleshooting Steps */}
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <h3 style={{
                fontWeight: '500',
                color: '#1e3a8a',
                marginBottom: '8px',
                fontSize: '16px'
              }}>Troubleshooting Steps:</h3>
              <ul style={{
                fontSize: '14px',
                color: '#1e40af',
                lineHeight: '1.5',
                margin: 0,
                paddingLeft: '16px'
              }}>
                <li style={{ marginBottom: '4px' }}>• Check the browser console for additional error details</li>
                <li style={{ marginBottom: '4px' }}>• Try refreshing the page</li>
                <li style={{ marginBottom: '4px' }}>• Clear browser cache and reload</li>
                <li style={{ marginBottom: '4px' }}>• Check if all dependencies are properly installed</li>
                <li>• Verify that the development server is running</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
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
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                <span>Reload Page</span>
              </button>
            </div>

            {/* Development Info */}
            <div style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                lineHeight: '1.5',
                margin: 0
              }}>
                Land Visualizer v1.0.0 • {import.meta.env.DEV ? 'Development' : 'Production'} Mode
                <br />
                If this error persists, please check the development console for more details.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}