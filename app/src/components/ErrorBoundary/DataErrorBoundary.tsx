import { Component, type ReactNode, type ErrorInfo } from 'react';
import { FileX, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import { logger } from '../../utils/logger';
import { errorReporting } from '../../utils/errorReporting';

interface Props {
  children: ReactNode;
  operationType?: 'export' | 'import' | 'calculation' | 'general';
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  retryAction?: () => void;
  onCancel?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Specialized error boundary for data operations
 * Handles export/import errors, calculation failures, and file operations
 */
export class DataErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const operation = this.props.operationType || 'data operation';
    logger.error(`Data Operation Error (${operation}):`, error, errorInfo);
    
    // Report to error reporting service
    errorReporting.reportError(error, errorInfo, {
      type: 'DATA_OPERATION',
      operationType: operation,
      additionalData: {
        isFileError: this.isFileError(error),
        isNetworkError: this.isNetworkError(error),
        isCalculationError: this.isCalculationError(error),
        hasRetryAction: !!this.props.retryAction
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
    if (this.props.retryAction) {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      setTimeout(() => {
        this.props.retryAction?.();
      }, 100);
    } else {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  };

  private handleCancel = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onCancel?.();
  };

  private isFileError = (error: Error): boolean => {
    const fileKeywords = ['file', 'download', 'blob', 'export', 'import', 'permission'];
    const errorMessage = error.message.toLowerCase();
    return fileKeywords.some(keyword => errorMessage.includes(keyword));
  };

  private isNetworkError = (error: Error): boolean => {
    const networkKeywords = ['network', 'fetch', 'request', 'connection', 'timeout'];
    const errorMessage = error.message.toLowerCase();
    return networkKeywords.some(keyword => errorMessage.includes(keyword));
  };

  private isCalculationError = (error: Error): boolean => {
    const calcKeywords = ['calculation', 'math', 'compute', 'invalid', 'nan', 'infinity'];
    const errorMessage = error.message.toLowerCase();
    return calcKeywords.some(keyword => errorMessage.includes(keyword));
  };

  private getErrorIcon = () => {
    const { operationType } = this.props;
    switch (operationType) {
      case 'export':
      case 'import':
        return <Download style={{ width: '24px', height: '24px', color: '#dc2626' }} />;
      case 'calculation':
        return <AlertTriangle style={{ width: '24px', height: '24px', color: '#dc2626' }} />;
      default:
        return <FileX style={{ width: '24px', height: '24px', color: '#dc2626' }} />;
    }
  };

  private getErrorTitle = (): string => {
    const { operationType } = this.props;
    switch (operationType) {
      case 'export':
        return 'Export Failed';
      case 'import':
        return 'Import Failed';
      case 'calculation':
        return 'Calculation Error';
      default:
        return 'Data Operation Failed';
    }
  };

  private getErrorAdvice = (): string[] => {
    if (!this.state.error) return [];
    
    if (this.isFileError(this.state.error)) {
      return [
        '• Check that you have permission to download files',
        '• Ensure your browser allows file downloads from this site',
        '• Try using a different browser or incognito mode',
        '• Disable popup blockers that might interfere',
        '• Make sure you have enough disk space available'
      ];
    }

    if (this.isNetworkError(this.state.error)) {
      return [
        '• Check your internet connection',
        '• Try the operation again in a few moments',
        '• Disable VPN or proxy if you\'re using one',
        '• Check if your firewall is blocking the request'
      ];
    }

    if (this.isCalculationError(this.state.error)) {
      return [
        '• Check that your shape data is valid',
        '• Ensure shapes have at least 3 points for area calculations',
        '• Verify that coordinates are within reasonable ranges',
        '• Try simplifying complex shapes before calculating'
      ];
    }

    return [
      '• The data operation encountered an unexpected error',
      '• Try the operation again with different settings',
      '• Check that your data is in the correct format',
      '• Ensure all required fields are filled correctly'
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
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '8px',
                border: '2px solid #fecaca'
              }}>
                {this.getErrorIcon()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 4px 0'
                }}>
                  {this.getErrorTitle()}
                </h2>
                <p style={{
                  color: '#6b7280',
                  margin: 0,
                  fontSize: '14px'
                }}>
                  The operation could not be completed due to an error.
                </p>
              </div>
            </div>

            {/* Error message */}
            {this.state.error && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#dc2626',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {this.state.error.message || 'An unexpected error occurred'}
                </p>
              </div>
            )}

            {/* Error-specific advice */}
            <div style={{
              marginBottom: '20px',
              padding: '14px',
              background: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #7dd3fc'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#0369a1',
                margin: '0 0 8px 0'
              }}>Troubleshooting steps:</h4>
              <ul style={{
                fontSize: '13px',
                color: '#0c4a6e',
                margin: 0,
                paddingLeft: '16px',
                lineHeight: '1.4'
              }}>
                {this.getErrorAdvice().map((advice, index) => (
                  <li key={index} style={{ marginBottom: '3px' }}>{advice}</li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={this.handleCancel}
                style={{
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
                Cancel
              </button>
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
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
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                <span>Try Again</span>
              </button>
            </div>

            {/* Development error details */}
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                marginTop: '16px',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
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
                  color: '#dc2626',
                  fontFamily: 'Monaco, Menlo, monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '120px',
                  overflow: 'auto'
                }}>
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack.slice(0, 400)}...`}
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

export default DataErrorBoundary;