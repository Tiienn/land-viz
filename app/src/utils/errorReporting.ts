import { logger } from './logger';

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  context: string;
  operationType?: string;
  componentName?: string;
  userAgent: string;
  url: string;
  timestamp: string;
  buildInfo: {
    version: string;
    environment: string;
  };
  sessionId: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  sampleRate?: number; // 0.0 - 1.0
  enableLocalStorage?: boolean;
  maxQueueSize?: number;
  batchSize?: number;
  flushInterval?: number; // milliseconds
}

class ErrorReportingService {
  private config: ErrorReportingConfig;
  private errorQueue: ErrorReport[] = [];
  private sessionId: string;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enabled: !import.meta.env.DEV,
      sampleRate: 1.0,
      enableLocalStorage: true,
      maxQueueSize: 50,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config
    };

    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled) {
      this.startPeriodicFlush();
      this.attachGlobalErrorHandlers();
    }
  }

  /**
   * Report an error from error boundaries
   */
  public reportError(error: Error, errorInfo?: { componentStack?: string }, context?: {
    type?: string;
    operationType?: string;
    componentName?: string;
    additionalData?: Record<string, unknown>;
  }): void {
    if (!this.config.enabled || !this.shouldSampleError()) {
      return;
    }

    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      context: context?.type || 'unknown',
      operationType: context?.operationType,
      componentName: context?.componentName,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      buildInfo: {
        version: '1.0.0',
        environment: import.meta.env.MODE || 'production'
      },
      sessionId: this.sessionId,
      additionalData: context?.additionalData
    };

    this.queueError(errorReport);
  }

  /**
   * Report a custom event or non-error issue
   */
  public reportEvent(message: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, unknown>): void {
    if (!this.config.enabled) {
      return;
    }

    const errorReport: ErrorReport = {
      message,
      context: `event_${level}`,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      buildInfo: {
        version: '1.0.0',
        environment: import.meta.env.MODE || 'production'
      },
      sessionId: this.sessionId,
      additionalData: data
    };

    this.queueError(errorReport);
  }

  /**
   * Set user context for better error tracking
   */
  public setUser(userId: string, userData?: Record<string, unknown>): void {
    if (this.config.enableLocalStorage) {
      try {
        localStorage.setItem('landviz_user_id', userId);
        if (userData) {
          localStorage.setItem('landviz_user_data', JSON.stringify(userData));
        }
      } catch (e) {
        logger.warn('Failed to store user context:', e);
      }
    }
  }

  /**
   * Add custom context to all future error reports
   */
  public setContext(key: string, value: unknown): void {
    if (this.config.enableLocalStorage) {
      try {
        const existingContext = localStorage.getItem('landviz_context');
        const context = existingContext ? JSON.parse(existingContext) : {};
        context[key] = value;
        localStorage.setItem('landviz_context', JSON.stringify(context));
      } catch (e) {
        logger.warn('Failed to store context:', e);
      }
    }
  }

  /**
   * Manually flush error queue
   */
  public async flush(): Promise<void> {
    if (this.errorQueue.length === 0) {
      return;
    }

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    await this.sendErrors(errors);
  }

  /**
   * Update configuration
   */
  public configure(newConfig: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.flushTimer) {
      this.startPeriodicFlush();
      this.attachGlobalErrorHandlers();
    } else if (!this.config.enabled && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSampleError(): boolean {
    return Math.random() <= (this.config.sampleRate || 1.0);
  }

  private queueError(errorReport: ErrorReport): void {
    // Add user context if available
    try {
      const userId = localStorage.getItem('landviz_user_id');
      const userData = localStorage.getItem('landviz_user_data');
      const context = localStorage.getItem('landviz_context');

      if (userId) {
        errorReport.userId = userId;
      }

      if (userData || context) {
        errorReport.additionalData = {
          ...errorReport.additionalData,
          ...(userData ? { user: JSON.parse(userData) } : {}),
          ...(context ? { context: JSON.parse(context) } : {})
        };
      }
    } catch {
      // Ignore storage errors
    }

    this.errorQueue.push(errorReport);
    logger.debug('Queued error report:', errorReport);

    // Trim queue if too large
    if (this.errorQueue.length > (this.config.maxQueueSize || 50)) {
      this.errorQueue = this.errorQueue.slice(-this.config.maxQueueSize!);
    }

    // Immediate flush for critical errors
    if (errorReport.context === 'critical' || errorReport.context === '3D_SCENE') {
      this.flush().catch(e => logger.warn('Failed to flush critical error:', e));
    }
  }

  private async sendErrors(errors: ErrorReport[]): Promise<void> {
    if (errors.length === 0) return;

    // Send to multiple endpoints/services
    const promises = [];

    // Custom endpoint
    if (this.config.endpoint) {
      promises.push(this.sendToEndpoint(errors));
    }

    // Console logging for development/debugging
    promises.push(this.logToConsole(errors));

    // Browser's built-in reporting (if available)
    if ('reportError' in window) {
      promises.push(this.sendToBrowserReporting(errors));
    }

    try {
      await Promise.allSettled(promises);
      logger.debug(`Successfully reported ${errors.length} errors`);
    } catch (e) {
      logger.warn('Some error reports failed to send:', e);
    }
  }

  private async sendToEndpoint(errors: ErrorReport[]): Promise<void> {
    if (!this.config.endpoint) return;

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {})
        },
        body: JSON.stringify({
          errors,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (e) {
      logger.warn('Failed to send errors to endpoint:', e);
    }
  }

  private async logToConsole(errors: ErrorReport[]): Promise<void> {
    if (import.meta.env.DEV) {
      logger.error('Error Reports:', errors);
    } else {
      // In production, log minimal info
      errors.forEach(error => {
        logger.error(`[${error.context}] ${error.message}`, {
          timestamp: error.timestamp,
          session: error.sessionId
        });
      });
    }
  }

  private async sendToBrowserReporting(errors: ErrorReport[]): Promise<void> {
    try {
      errors.forEach(error => {
        if ('reportError' in window && error.stack) {
          const syntheticError = new Error(error.message);
          syntheticError.stack = error.stack;
          (window as { reportError?: (error: Error) => void }).reportError?.(syntheticError);
        }
      });
    } catch (e) {
      logger.warn('Failed to send to browser reporting:', e);
    }
  }

  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.errorQueue.length >= (this.config.batchSize || 10)) {
        this.flush().catch(e => logger.warn('Failed to flush errors:', e));
      }
    }, this.config.flushInterval || 30000);
  }

  private attachGlobalErrorHandlers(): void {
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), undefined, {
        type: 'javascript_error',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.reportError(error, undefined, {
        type: 'unhandled_promise_rejection'
      });
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliable delivery on page unload
      if (this.errorQueue.length > 0 && this.config.endpoint && navigator.sendBeacon) {
        const data = JSON.stringify({
          errors: this.errorQueue,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId
        });
        navigator.sendBeacon(this.config.endpoint, data);
      }
    });
  }
}

// Global instance
export const errorReporting = new ErrorReportingService();

/**
 * Quick helper for reporting errors from components
 */
export const reportError = (
  error: Error, 
  context?: string, 
  additionalData?: Record<string, unknown>
) => {
  errorReporting.reportError(error, undefined, {
    type: context || 'component_error',
    additionalData
  });
};

/**
 * Quick helper for reporting events
 */
export const reportEvent = (
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
) => {
  errorReporting.reportEvent(message, level, data);
};

export default errorReporting;