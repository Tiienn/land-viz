/**
 * OpenCV.js Initialization Service
 *
 * Singleton service for loading and initializing OpenCV.js WASM module.
 *
 * CRITICAL NOTES:
 * - OpenCV.js is ~8MB - loaded lazily on first use
 * - WASM initialization takes 500ms-2s depending on connection
 * - All cv.Mat objects MUST be explicitly deleted to prevent memory leaks
 * - Memory leaks in WASM can crash the browser
 *
 * @example
 * ```typescript
 * import { opencv } from './opencvSetup';
 *
 * // Initialize before use
 * await opencv.initialize();
 *
 * // Use OpenCV
 * const cv = opencv.getCV();
 * const mat = new cv.Mat();
 * try {
 *   // ... use mat
 * } finally {
 *   mat.delete(); // ALWAYS cleanup!
 * }
 * ```
 */

import { logger } from '../../utils/logger';

// Declare global cv object from OpenCV.js
declare global {
  interface Window {
    cv: any; // OpenCV.js adds 'cv' to window
  }
}

/**
 * OpenCV.js initialization states
 */
type OpenCVState = 'not_loaded' | 'loading' | 'ready' | 'error';

/**
 * Singleton class for OpenCV.js initialization
 */
export class OpenCVSetup {
  private static instance: OpenCVSetup;
  private state: OpenCVState = 'not_loaded';
  private loadPromise: Promise<void> | null = null;
  private errorMessage: string | null = null;

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): OpenCVSetup {
    if (!OpenCVSetup.instance) {
      OpenCVSetup.instance = new OpenCVSetup();
    }
    return OpenCVSetup.instance;
  }

  /**
   * Initialize OpenCV.js WASM module
   *
   * This method:
   * 1. Checks if already loaded/loading
   * 2. Loads opencv.js script dynamically
   * 3. Waits for WASM initialization
   * 4. Sets up error handling
   * 5. Returns promise that resolves when ready
   *
   * @throws {Error} If loading fails or times out
   */
  async initialize(): Promise<void> {
    // Already ready - return immediately
    if (this.state === 'ready') {
      logger.info('[OpenCV] Already initialized');
      return Promise.resolve();
    }

    // Currently loading - return existing promise
    if (this.state === 'loading' && this.loadPromise) {
      logger.info('[OpenCV] Already loading, waiting...');
      return this.loadPromise;
    }

    // Previous error - try again
    if (this.state === 'error') {
      logger.warn('[OpenCV] Previous initialization failed, retrying...');
      this.state = 'not_loaded';
      this.errorMessage = null;
    }

    // Start loading
    this.state = 'loading';
    this.loadPromise = this.load();

    try {
      await this.loadPromise;
      this.state = 'ready';
      logger.info('[OpenCV] Initialization complete');
    } catch (error) {
      this.state = 'error';
      this.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[OpenCV] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Internal method to load OpenCV.js script
   */
  private async load(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if OpenCV is already loaded (e.g., by another instance)
      if (window.cv && window.cv.getBuildInformation) {
        logger.info('[OpenCV] Already loaded by external source');
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="opencv"]');
      if (existingScript) {
        logger.info('[OpenCV] Script already in DOM, waiting for initialization...');
        this.waitForInitialization(resolve, reject);
        return;
      }

      logger.info('[OpenCV] Loading opencv.js from package...');

      // Use the locally installed @techstark/opencv-js package
      // This is more reliable than CDN and works offline
      import('@techstark/opencv-js')
        .then((module) => {
          logger.info('[OpenCV] Package loaded, analyzing module structure...');
          logger.debug('[OpenCV] Module keys:', Object.keys(module));
          logger.debug('[OpenCV] Module.default type:', typeof module.default);

          // Try different ways to get the cv loader
          const cvLoader = module.default || module;

          // Check if it's already a promise
          if (cvLoader && typeof cvLoader.then === 'function') {
            logger.info('[OpenCV] Module is a promise, awaiting...');
            cvLoader
              .then((cv: any) => {
                logger.info('[OpenCV] Promise resolved, assigning to window.cv...');
                window.cv = cv;
                this.waitForInitialization(resolve, reject);
              })
              .catch((error: any) => {
                logger.error('[OpenCV] Promise rejection:', error);
                reject(new Error('Failed to initialize OpenCV WASM module'));
              });
          } else if (typeof cvLoader === 'function') {
            // Call the loader function to get the cv object
            logger.info('[OpenCV] Module is a function, calling it...');
            const result = cvLoader();

            if (result && typeof result.then === 'function') {
              logger.info('[OpenCV] Function returned promise, awaiting...');
              result
                .then((cv: any) => {
                  logger.info('[OpenCV] Promise resolved, assigning to window.cv...');
                  window.cv = cv;
                  this.waitForInitialization(resolve, reject);
                })
                .catch((error: any) => {
                  logger.error('[OpenCV] Promise rejection:', error);
                  reject(new Error('Failed to initialize OpenCV WASM module'));
                });
            } else {
              logger.info('[OpenCV] Function returned cv object directly');
              window.cv = result;
              this.waitForInitialization(resolve, reject);
            }
          } else {
            // Direct assignment - log what we're getting
            logger.warn('[OpenCV] Unexpected module structure, attempting direct assignment');
            logger.debug('[OpenCV] cvLoader type:', typeof cvLoader);
            logger.debug('[OpenCV] cvLoader keys:', cvLoader ? Object.keys(cvLoader).slice(0, 5) : 'null');
            window.cv = cvLoader;
            this.waitForInitialization(resolve, reject);
          }
        })
        .catch((error) => {
          logger.error('[OpenCV] Failed to load package:', error);
          reject(new Error('Failed to load OpenCV.js package. Try: npm install @techstark/opencv-js'));
        });
    });
  }

  /**
   * Wait for OpenCV WASM module to initialize
   *
   * After the script loads, the WASM module needs time to initialize.
   * We poll for cv.getBuildInformation() which indicates ready state.
   */
  private waitForInitialization(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    const startTime = Date.now();
    const timeout = 60000; // 60 second timeout (increased for slower connections)
    const pollInterval = 100; // Check every 100ms
    let lastLogTime = startTime;
    const logInterval = 5000; // Log every 5 seconds

    const checkReady = () => {
      const elapsed = Date.now() - startTime;

      // Periodic progress logging
      if (elapsed - (lastLogTime - startTime) >= logInterval) {
        logger.info(`[OpenCV] Still initializing... (${(elapsed / 1000).toFixed(1)}s elapsed)`);
        lastLogTime = Date.now();
      }

      // Check if cv is ready
      if (window.cv) {
        if (typeof window.cv.getBuildInformation === 'function') {
          try {
            const buildInfo = window.cv.getBuildInformation();
            logger.info('[OpenCV] WASM initialized successfully');
            logger.debug('[OpenCV] Build info:', buildInfo);
            resolve();
            return;
          } catch (error) {
            // getBuildInformation exists but throws - not ready yet
            logger.debug('[OpenCV] WASM not ready, continuing to poll...');
          }
        }
      } else {
        // cv object doesn't exist yet
        if (elapsed > 10000 && elapsed % 10000 < 200) {
          logger.warn('[OpenCV] window.cv still not defined after', (elapsed / 1000).toFixed(1), 'seconds');
        }
      }

      // Check timeout
      if (elapsed > timeout) {
        const message = `OpenCV initialization timeout after ${timeout / 1000} seconds. Try refreshing the page or check your internet connection.`;
        logger.error('[OpenCV]', message);
        logger.error('[OpenCV] Debug info:', {
          cvExists: !!window.cv,
          cvType: typeof window.cv,
          cvKeys: window.cv ? Object.keys(window.cv).slice(0, 10) : []
        });
        reject(new Error(message));
        return;
      }

      // Continue polling
      setTimeout(checkReady, pollInterval);
    };

    checkReady();
  }

  /**
   * Check if OpenCV is ready to use
   */
  isReady(): boolean {
    return this.state === 'ready';
  }

  /**
   * Get current state
   */
  getState(): OpenCVState {
    return this.state;
  }

  /**
   * Get error message from last failed initialization
   */
  getError(): string | null {
    return this.errorMessage;
  }

  /**
   * Get the cv object
   *
   * @throws {Error} If OpenCV not initialized
   */
  getCV(): any {
    if (this.state !== 'ready') {
      throw new Error(
        `OpenCV not ready (state: ${this.state}). Call initialize() first.`
      );
    }

    if (!window.cv) {
      throw new Error('OpenCV object not found on window');
    }

    return window.cv;
  }

  /**
   * Get OpenCV version information
   */
  getVersionInfo(): string | null {
    if (!this.isReady()) {
      return null;
    }

    try {
      return window.cv.getBuildInformation();
    } catch (error) {
      logger.error('[OpenCV] Failed to get version info:', error);
      return null;
    }
  }

  /**
   * Cleanup (for testing/hot reload)
   *
   * Note: This doesn't actually unload OpenCV WASM (not possible),
   * but resets the singleton state for re-initialization.
   */
  reset(): void {
    logger.warn('[OpenCV] Resetting initialization state');
    this.state = 'not_loaded';
    this.loadPromise = null;
    this.errorMessage = null;
  }
}

/**
 * Singleton instance export
 *
 * Usage:
 * ```typescript
 * import { opencv } from './opencvSetup';
 * await opencv.initialize();
 * const cv = opencv.getCV();
 * ```
 */
export const opencv = OpenCVSetup.getInstance();

/**
 * Helper function to safely delete OpenCV Mat objects
 *
 * Prevents errors if mat is null/undefined
 *
 * @example
 * ```typescript
 * const mat = new cv.Mat();
 * try {
 *   // ... use mat
 * } finally {
 *   safeDelete(mat);
 * }
 * ```
 */
export function safeDelete(mat: any): void {
  if (mat && typeof mat.delete === 'function') {
    try {
      mat.delete();
    } catch (error) {
      logger.error('[OpenCV] Error deleting Mat:', error);
    }
  }
}

/**
 * Helper function to safely delete multiple Mat objects
 *
 * @example
 * ```typescript
 * const mat1 = new cv.Mat();
 * const mat2 = new cv.Mat();
 * try {
 *   // ... use mats
 * } finally {
 *   safeDeleteAll(mat1, mat2);
 * }
 * ```
 */
export function safeDeleteAll(...mats: any[]): void {
  mats.forEach((mat) => safeDelete(mat));
}
