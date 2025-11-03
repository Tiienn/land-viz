/**
 * Environment-based logging utility
 * Logs messages only in development mode, removes them in production
 */

interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const isDevelopment = import.meta.env.DEV;
const enableVerboseLogging = false; // Set to true to see detailed geometry/transform logs
const enableDevLogging = false; // Set to true to see info/debug logs in development

export const logger: Logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment && enableVerboseLogging) {
      console.log(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment && enableDevLogging) {
      console.log(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment && enableDevLogging) {
      console.warn(...args);
    }
  },

  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args);
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment && enableDevLogging) {
      console.debug(...args);
    }
  }
};

export default logger;