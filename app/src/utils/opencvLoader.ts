/**
 * OpenCV.js Loader
 *
 * Lazy loads OpenCV.js library (WebAssembly) on first use.
 * Uses CDN for easy deployment without npm package issues.
 *
 * Performance: ~2 seconds initial load, cached afterwards
 */

// Global type declaration for OpenCV
declare global {
  interface Window {
    cv: any; // OpenCV.js exposes global 'cv' object
  }
}

let opencvLoadPromise: Promise<void> | null = null;
let opencvLoaded = false;

/**
 * Load OpenCV.js from CDN
 *
 * @returns Promise that resolves when OpenCV.js is ready
 * @throws Error if OpenCV.js fails to load
 *
 * @example
 * ```typescript
 * await loadOpenCV();
 * const img = cv.imread(canvas);
 * ```
 */
export async function loadOpenCV(): Promise<void> {
  // Return existing promise if already loading
  if (opencvLoadPromise) {
    return opencvLoadPromise;
  }

  // Return immediately if already loaded
  if (opencvLoaded && window.cv) {
    return Promise.resolve();
  }

  opencvLoadPromise = new Promise((resolve, reject) => {
    // Check if OpenCV is already loaded
    if (window.cv && window.cv.Mat) {
      opencvLoaded = true;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/opencv.js@1.2.1/opencv.js';
    script.async = true;

    // Success callback
    script.onload = () => {
      // OpenCV.js requires onRuntimeInitialized callback
      if (window.cv) {
        // Check if already initialized
        if (window.cv.Mat) {
          opencvLoaded = true;
          resolve();
        } else {
          // Wait for runtime initialization
          window.cv.onRuntimeInitialized = () => {
            opencvLoaded = true;
            resolve();
          };
        }
      } else {
        reject(new Error('OpenCV.js loaded but cv object not found'));
      }
    };

    // Error callback
    script.onerror = () => {
      opencvLoadPromise = null;
      reject(new Error('Failed to load OpenCV.js from CDN'));
    };

    // Append script to document
    document.head.appendChild(script);
  });

  return opencvLoadPromise;
}

/**
 * Check if OpenCV.js is loaded and ready
 *
 * @returns true if OpenCV.js is ready to use
 */
export function isOpenCVReady(): boolean {
  return opencvLoaded && !!window.cv && !!window.cv.Mat;
}

/**
 * Get OpenCV.js instance
 *
 * @returns OpenCV.js cv object
 * @throws Error if OpenCV.js is not loaded
 */
export function getOpenCV(): any {
  if (!isOpenCVReady()) {
    throw new Error('OpenCV.js is not loaded. Call loadOpenCV() first.');
  }
  return window.cv;
}

/**
 * Unload OpenCV.js (for testing or cleanup)
 * WARNING: This removes the global cv object
 */
export function unloadOpenCV(): void {
  if (window.cv) {
    // Clean up OpenCV.js resources
    delete window.cv;
    opencvLoaded = false;
    opencvLoadPromise = null;

    // Remove script tag
    const script = document.querySelector('script[src*="opencv.js"]');
    if (script) {
      script.remove();
    }
  }
}
