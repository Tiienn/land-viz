import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    console.error('Land Visualizer Error Boundary caught an error:', error, errorInfo);
    
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
        <div className="min-h-screen bg-gradient-to-br from-neutral-25 to-neutral-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-strong border border-neutral-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">
                  Land Visualizer Error
                </h1>
                <p className="text-neutral-600">
                  Something went wrong while loading the application
                </p>
              </div>
            </div>

            {/* Error Details */}
            {this.state.error && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg border">
                <h3 className="font-medium text-neutral-900 mb-2">Error Details:</h3>
                <p className="text-sm text-red-600 font-mono mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-neutral-700 hover:text-neutral-900">
                      View Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs text-neutral-600 font-mono whitespace-pre-wrap bg-white p-2 rounded border max-h-32 overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Component Stack */}
            {this.state.errorInfo && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg border">
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-neutral-700 hover:text-neutral-900">
                    Component Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs text-neutral-600 font-mono whitespace-pre-wrap bg-white p-2 rounded border max-h-32 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}

            {/* Troubleshooting Steps */}
            <div className="mb-6 p-4 bg-blue-25 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Troubleshooting Steps:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Check the browser console for additional error details</li>
                <li>• Try refreshing the page</li>
                <li>• Clear browser cache and reload</li>
                <li>• Check if all dependencies are properly installed</li>
                <li>• Verify that the development server is running</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Page</span>
              </button>
            </div>

            {/* Development Info */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-500">
                Land Visualizer v1.0.0 • Development Mode
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