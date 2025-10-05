/**
 * Standardized error handling utility for consistent error management
 * Provides type-safe error handling with proper logging and user feedback
 */

import { logger } from './logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  /** Low priority - informational messages */
  INFO = 'info',
  /** Medium priority - warnings that don't break functionality */
  WARNING = 'warning',
  /** High priority - errors that affect functionality */
  ERROR = 'error',
  /** Critical priority - fatal errors that break the application */
  CRITICAL = 'critical'
}

/**
 * Error context for better debugging
 */
export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** Operation that failed */
  operation?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Whether to show user-facing message */
  showToUser?: boolean;
  /** Custom user-facing message */
  userMessage?: string;
}

/**
 * Standardized error class with context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public severity: ErrorSeverity = ErrorSeverity.ERROR,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Handle errors with standardized logging and optional user feedback
 *
 * @param error - Error to handle
 * @param context - Additional context
 * @returns Standardized error message
 *
 * @example
 * try {
 *   // risky operation
 * } catch (err) {
 *   handleError(err, {
 *     component: 'DrawingCanvas',
 *     operation: 'createShape',
 *     showToUser: true,
 *     userMessage: 'Failed to create shape'
 *   });
 * }
 */
export function handleError(
  error: unknown,
  context?: ErrorContext
): string {
  const errorMessage = extractErrorMessage(error);
  const severity = error instanceof AppError ? error.severity : ErrorSeverity.ERROR;

  // Log to console with context
  const logMessage = formatErrorLog(errorMessage, context);

  switch (severity) {
    case ErrorSeverity.INFO:
      logger.log(logMessage);
      break;
    case ErrorSeverity.WARNING:
      logger.warn(logMessage);
      break;
    case ErrorSeverity.ERROR:
      logger.error(logMessage, error);
      break;
    case ErrorSeverity.CRITICAL:
      logger.error(`[CRITICAL] ${logMessage}`, error);
      break;
  }

  // Return user-facing message if needed
  if (context?.showToUser) {
    return context.userMessage || 'An error occurred. Please try again.';
  }

  return errorMessage;
}

/**
 * Extract error message from unknown error type
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown error occurred';
}

/**
 * Format error log message with context
 */
function formatErrorLog(message: string, context?: ErrorContext): string {
  const parts: string[] = [];

  if (context?.component) {
    parts.push(`[${context.component}]`);
  }

  if (context?.operation) {
    parts.push(`${context.operation}:`);
  }

  parts.push(message);

  if (context?.metadata) {
    parts.push(JSON.stringify(context.metadata));
  }

  return parts.join(' ');
}

/**
 * Safe async operation wrapper with error handling
 *
 * @param operation - Async operation to execute
 * @param context - Error context
 * @returns Result or null on error
 *
 * @example
 * const result = await safeAsync(
 *   async () => await fetchData(),
 *   { component: 'DataLoader', operation: 'fetchData' }
 * );
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

/**
 * Safe synchronous operation wrapper with error handling
 *
 * @param operation - Synchronous operation to execute
 * @param context - Error context
 * @returns Result or null on error
 *
 * @example
 * const result = safeSync(
 *   () => parseJSON(data),
 *   { component: 'Parser', operation: 'parseJSON' }
 * );
 */
export function safeSync<T>(
  operation: () => T,
  context?: ErrorContext
): T | null {
  try {
    return operation();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

/**
 * Assert condition and throw AppError if false
 *
 * @param condition - Condition to assert
 * @param message - Error message if assertion fails
 * @param context - Error context
 *
 * @example
 * assert(shape.points.length >= 3, 'Polygon must have at least 3 points', {
 *   component: 'ShapeValidator',
 *   metadata: { pointCount: shape.points.length }
 * });
 */
export function assert(
  condition: boolean,
  message: string,
  context?: ErrorContext
): asserts condition {
  if (!condition) {
    throw new AppError(message, ErrorSeverity.ERROR, context);
  }
}

/**
 * Create a validated error handler for specific component
 *
 * @param componentName - Component name for context
 * @returns Bound error handler
 *
 * @example
 * const handleComponentError = createErrorHandler('DrawingCanvas');
 * try {
 *   // operation
 * } catch (err) {
 *   handleComponentError(err, { operation: 'draw' });
 * }
 */
export function createErrorHandler(componentName: string) {
  return (error: unknown, additionalContext?: Partial<ErrorContext>): string => {
    return handleError(error, {
      component: componentName,
      ...additionalContext
    });
  };
}
