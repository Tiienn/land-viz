import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../../utils/logger';
import { errorReporting } from '../../utils/errorReporting';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showMinimalError?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Specialized error boundary for UI components
 * Handles form errors, user interactions, and component rendering issues
 */
export class UIErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'UI Component';
    logger.error(`${componentName} Error:`, error, errorInfo);
    
    // Report to error reporting service
    errorReporting.reportError(error, errorInfo, {
      type: 'UI_COMPONENT',
      componentName,
      additionalData: {
        isFormError: this.isFormError(error),
        isRenderError: this.isRenderError(error),
        showMinimalError: this.props.showMinimalError
      }
    });
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private isFormError = (error: Error): boolean => {
    const formKeywords = ['form', 'input', 'validation', 'submit', 'field'];
    const errorMessage = error.message.toLowerCase();
    return formKeywords.some(keyword => errorMessage.includes(keyword));
  };

  private isRenderError = (error: Error): boolean => {
    const renderKeywords = ['render', 'hook', 'state', 'props', 'jsx'];
    const errorMessage = error.message.toLowerCase();
    return renderKeywords.some(keyword => errorMessage.includes(keyword));
  };

  private getErrorAdvice = (): string[] => {
    if (!this.state.error) return [];
    
    if (this.isFormError(this.state.error)) {
      return [
        '• Check that all required fields are filled correctly',
        '• Verify that input values are in the expected format',
        '• Try clearing the form and starting over',
        '• Ensure your browser allows form submissions'
      ];
    }

    if (this.isRenderError(this.state.error)) {
      return [
        '• The component failed to render properly',
        '• This might be due to invalid data or state',
        '• Try refreshing the page to reset the component',
        '• Check if any browser extensions are interfering'
      ];
    }

    return [
      '• An unexpected error occurred in the user interface',
      '• Try the action again or refresh the page',
      '• Clear your browser cache if the problem persists',
      '• Disable browser extensions temporarily to test'
    ];
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Show minimal error for less critical components
      if (this.props.showMinimalError) {
        return (
          <div style={{
            padding: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#dc2626',
                fontWeight: '500'
              }}>
                {this.props.componentName || 'Component'} temporarily unavailable
              </p>
              <button
                onClick={this.handleRetry}
                style={{
                  marginTop: '4px',
                  padding: '2px 6px',
                  background: 'transparent',
                  color: '#dc2626',
                  border: '1px solid #dc2626',
                  borderRadius: '3px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#dc2626';
                }}
              >
                Retry
              </button>
            </div>
          </div>
        );
      }

      return (
        <div style={{
          width: '100%',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #fdba74'
        }}>
          <div style={{
            maxWidth: '450px',
            width: '100%',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fed7aa',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px',
                background: '#fff7ed',
                borderRadius: '50%',
                border: '2px solid #fdba74'
              }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: '#ea580c' }} />
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {this.props.componentName || 'Interface'} Error
              </h3>
            </div>

            <p style={{
              color: '#6b7280',
              marginBottom: '16px',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              This part of the interface encountered an error. You can try again or continue using other features.
            </p>

            {/* Error-specific advice */}
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #7dd3fc',
              textAlign: 'left'
            }}>
              <h4 style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#0369a1',
                margin: '0 0 6px 0'
              }}>What you can try:</h4>
              <ul style={{
                fontSize: '12px',
                color: '#0c4a6e',
                margin: 0,
                paddingLeft: '14px',
                lineHeight: '1.3'
              }}>
                {this.getErrorAdvice().map((advice, index) => (
                  <li key={index} style={{ marginBottom: '2px' }}>{advice}</li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#ea580c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#c2410c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ea580c';
                }}
              >
                <RefreshCw style={{ width: '14px', height: '14px' }} />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
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
                <Home style={{ width: '14px', height: '14px' }} />
                <span>Reload App</span>
              </button>
            </div>

            {/* Development error details */}
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                marginTop: '14px',
                padding: '10px',
                background: '#f9fafb',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                textAlign: 'left'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#6b7280'
                }}>
                  Developer Details
                </summary>
                <pre style={{
                  marginTop: '6px',
                  fontSize: '9px',
                  color: '#dc2626',
                  fontFamily: 'Monaco, Menlo, monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '80px',
                  overflow: 'auto'
                }}>
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack.slice(0, 300)}...`}
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

export default UIErrorBoundary;