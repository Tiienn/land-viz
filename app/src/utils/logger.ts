/**
 * Environment-based logging utility
 * Logs messages only in development mode, removes them in production
 */

interface Logger {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

const isDevelopment = import.meta.env.DEV;
const enableVerboseLogging = false; // Set to true to see detailed geometry/transform logs

export const logger: Logger = {
  log: (...args: any[]) => {
    if (isDevelopment && enableVerboseLogging) {
      console.log(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

export default logger;