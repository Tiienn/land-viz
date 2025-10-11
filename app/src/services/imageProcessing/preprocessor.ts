/**
 * Image Preprocessing Service
 *
 * Prepares images for shape detection using OpenCV.js
 *
 * PIPELINE:
 * 1. Load image file → OpenCV Mat
 * 2. Convert to grayscale
 * 3. Apply bilateral filter (noise reduction + edge preservation)
 * 4. Canny edge detection
 * 5. Morphological closing (fill small gaps)
 *
 * CRITICAL: All cv.Mat objects MUST be deleted after use!
 * Use safeDelete() or try-finally blocks to ensure cleanup.
 *
 * @example
 * ```typescript
 * import { preprocessor } from './preprocessor';
 * import { opencv } from './opencvSetup';
 *
 * await opencv.initialize();
 *
 * const preprocessed = await preprocessor.prepareImage(imageFile, 'high');
 * try {
 *   // Use preprocessed.mat for shape detection
 * } finally {
 *   preprocessed.mat.delete(); // ALWAYS cleanup!
 * }
 * ```
 */

import { opencv, safeDelete, safeDeleteAll } from './opencvSetup';
import { logger } from '../../utils/logger';
import type { PreprocessedImage, PreprocessingConfig } from '../../types/imageImport';

// ============================================================================
// Configuration Presets
// ============================================================================

/**
 * Preprocessing intensity levels
 */
const PREPROCESSING_PRESETS: Record<'low' | 'medium' | 'high', PreprocessingConfig> = {
  // Low - Fast, minimal processing
  low: {
    bilateralD: 5,
    bilateralSigmaColor: 50,
    bilateralSigmaSpace: 50,
    cannyThreshold1: 50,
    cannyThreshold2: 150,
    morphKernelSize: 3,
    morphIterations: 1,
  },

  // Medium - Balanced (default)
  medium: {
    bilateralD: 7,
    bilateralSigmaColor: 75,
    bilateralSigmaSpace: 75,
    cannyThreshold1: 30,
    cannyThreshold2: 100,
    morphKernelSize: 5,
    morphIterations: 2,
  },

  // High - Aggressive, for poor quality images
  high: {
    bilateralD: 9,
    bilateralSigmaColor: 100,
    bilateralSigmaSpace: 100,
    cannyThreshold1: 20,
    cannyThreshold2: 80,
    morphKernelSize: 7,
    morphIterations: 3,
  },
};

// ============================================================================
// Image Preprocessor Class
// ============================================================================

export class ImagePreprocessor {
  /**
   * Load and preprocess image for shape detection
   *
   * @param imageFile - Image file to process
   * @param level - Preprocessing intensity level
   * @param maxSize - Maximum dimension (will downscale if larger)
   * @returns PreprocessedImage with cv.Mat (MUST be deleted after use!)
   */
  async prepareImage(
    imageFile: File,
    level: 'low' | 'medium' | 'high' = 'medium',
    maxSize: number = 2000
  ): Promise<PreprocessedImage> {
    if (!opencv.isReady()) {
      throw new Error('OpenCV not initialized. Call opencv.initialize() first.');
    }

    logger.info('[Preprocessor] Starting image preprocessing...');
    const startTime = Date.now();

    // Get configuration
    const config = PREPROCESSING_PRESETS[level];

    // Load image
    const { mat: originalMat, width, height } = await this.loadImage(imageFile);

    try {
      // Downscale if too large
      let workingMat = originalMat;
      if (Math.max(width, height) > maxSize) {
        logger.info(`[Preprocessor] Downscaling from ${width}x${height} to fit ${maxSize}px`);
        workingMat = this.downscaleImage(originalMat, maxSize);
        originalMat.delete(); // Delete original, use downscaled
      }

      // Track operations
      const operations: string[] = [];

      // Step 1: Convert to grayscale
      const grayMat = this.convertToGrayscale(workingMat);
      operations.push('grayscale');
      workingMat.delete(); // Done with working mat

      // Step 2: Bilateral filter (noise reduction + edge preservation)
      const filteredMat = this.applyBilateralFilter(grayMat, config);
      operations.push('bilateral_filter');
      grayMat.delete(); // Done with gray

      // Step 3: Canny edge detection
      const edgesMat = this.detectEdges(filteredMat, config);
      operations.push('canny_edges');
      filteredMat.delete(); // Done with filtered

      // Step 4: Morphological closing (fill small gaps)
      const closedMat = this.morphologicalClose(edgesMat, config);
      operations.push('morphological_close');
      edgesMat.delete(); // Done with edges

      const elapsed = Date.now() - startTime;
      logger.info(`[Preprocessor] Preprocessing complete in ${elapsed}ms`);

      return {
        mat: closedMat, // Caller must delete this!
        originalWidth: width,
        originalHeight: height,
        operations,
      };
    } catch (error) {
      // Cleanup on error
      originalMat.delete();
      logger.error('[Preprocessor] Error during preprocessing:', error);
      throw new Error(`Image preprocessing failed: ${error}`);
    }
  }

  /**
   * Load image file into OpenCV Mat
   */
  private async loadImage(file: File): Promise<{ mat: any; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          try {
            const cv = opencv.getCV();

            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            ctx.drawImage(img, 0, 0);

            // Load into OpenCV Mat
            const mat = cv.imread(canvas);

            resolve({
              mat,
              width: img.width,
              height: img.height,
            });
          } catch (error) {
            reject(new Error(`Failed to load image into OpenCV: ${error}`));
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        if (event.target?.result) {
          img.src = event.target.result as string;
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Downscale image if larger than maxSize
   */
  private downscaleImage(src: any, maxSize: number): any {
    const cv = opencv.getCV();
    const { width, height } = { width: src.cols, height: src.rows };

    // Calculate new dimensions
    const scale = maxSize / Math.max(width, height);
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);

    // Create destination mat
    const dst = new cv.Mat();
    const dsize = new cv.Size(newWidth, newHeight);

    // Resize
    cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);

    return dst;
  }

  /**
   * Convert image to grayscale
   */
  private convertToGrayscale(src: any): any {
    const cv = opencv.getCV();
    const gray = new cv.Mat();

    // Check if already grayscale
    if (src.channels() === 1) {
      src.copyTo(gray);
      return gray;
    }

    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    return gray;
  }

  /**
   * Apply bilateral filter
   *
   * Reduces noise while preserving edges - critical for edge detection
   */
  private applyBilateralFilter(src: any, config: PreprocessingConfig): any {
    const cv = opencv.getCV();
    const filtered = new cv.Mat();

    cv.bilateralFilter(
      src,
      filtered,
      config.bilateralD || 7,
      config.bilateralSigmaColor || 75,
      config.bilateralSigmaSpace || 75
    );

    return filtered;
  }

  /**
   * Detect edges using Canny algorithm
   */
  private detectEdges(src: any, config: PreprocessingConfig): any {
    const cv = opencv.getCV();
    const edges = new cv.Mat();

    cv.Canny(
      src,
      edges,
      config.cannyThreshold1 || 30,
      config.cannyThreshold2 || 100,
      3, // Aperture size
      false // L2 gradient
    );

    return edges;
  }

  /**
   * Morphological closing
   *
   * Fills small gaps in edges - helps create closed contours
   */
  private morphologicalClose(src: any, config: PreprocessingConfig): any {
    const cv = opencv.getCV();
    const closed = new cv.Mat();

    // Create kernel
    const kernelSize = config.morphKernelSize || 5;
    const kernel = cv.getStructuringElement(
      cv.MORPH_RECT,
      new cv.Size(kernelSize, kernelSize)
    );

    // Closing = dilation followed by erosion
    cv.morphologyEx(
      src,
      closed,
      cv.MORPH_CLOSE,
      kernel,
      new cv.Point(-1, -1),
      config.morphIterations || 2
    );

    // Cleanup kernel
    kernel.delete();

    return closed;
  }

  /**
   * Invert binary image (white → black, black → white)
   *
   * Sometimes needed for contour detection
   */
  invertBinary(src: any): any {
    const cv = opencv.getCV();
    const inverted = new cv.Mat();

    cv.bitwise_not(src, inverted);

    return inverted;
  }

  /**
   * Apply threshold to create binary image
   */
  applyThreshold(src: any, threshold: number = 127): any {
    const cv = opencv.getCV();
    const binary = new cv.Mat();

    cv.threshold(src, binary, threshold, 255, cv.THRESH_BINARY);

    return binary;
  }

  /**
   * Preprocess image specifically for OCR text recognition
   *
   * Uses different techniques than boundary detection:
   * - Contrast enhancement instead of edge detection
   * - Adaptive thresholding for varying lighting
   * - Sharpening for better text clarity
   *
   * @param imageFile - Original image file
   * @returns Preprocessed cv.Mat optimized for text recognition
   */
  async prepareImageForOCR(imageFile: File): Promise<any> {
    if (!opencv.isReady()) {
      throw new Error('OpenCV not initialized');
    }

    logger.info('[Preprocessor] Starting OCR-specific preprocessing...');
    const startTime = Date.now();

    // Load original image
    const { mat: originalMat, width, height } = await this.loadImage(imageFile);

    try {
      // Step 1: Convert to grayscale
      const grayMat = this.convertToGrayscale(originalMat);
      originalMat.delete();

      // Step 2: Increase contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization)
      const contrastMat = this.applyCLAHE(grayMat);
      grayMat.delete();

      // Step 3: Sharpen text
      const sharpenedMat = this.sharpenImage(contrastMat);
      contrastMat.delete();

      // Step 4: Adaptive thresholding (handles varying lighting conditions)
      const binaryMat = this.applyAdaptiveThreshold(sharpenedMat);
      sharpenedMat.delete();

      const elapsed = Date.now() - startTime;
      logger.info(`[Preprocessor] OCR preprocessing complete in ${elapsed}ms`);

      return binaryMat;

    } catch (error) {
      originalMat.delete();
      logger.error('[Preprocessor] Error during OCR preprocessing:', error);
      throw error;
    }
  }

  /**
   * Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
   * Enhances local contrast, great for text with varying lighting
   */
  private applyCLAHE(src: any): any {
    const cv = opencv.getCV();
    const enhanced = new cv.Mat();

    // Create CLAHE object
    const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    clahe.apply(src, enhanced);
    clahe.delete();

    return enhanced;
  }

  /**
   * Sharpen image to make text edges clearer
   */
  private sharpenImage(src: any): any {
    const cv = opencv.getCV();
    const sharpened = new cv.Mat();

    // Sharpening kernel
    // [ 0, -1,  0]
    // [-1,  5, -1]
    // [ 0, -1,  0]
    const kernel = cv.matFromArray(3, 3, cv.CV_32F, [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ]);

    cv.filter2D(src, sharpened, cv.CV_8U, kernel);
    kernel.delete();

    return sharpened;
  }

  /**
   * Apply adaptive threshold
   * Better than simple threshold for images with varying lighting
   */
  private applyAdaptiveThreshold(src: any): any {
    const cv = opencv.getCV();
    const binary = new cv.Mat();

    cv.adaptiveThreshold(
      src,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11, // Block size
      2   // C constant
    );

    return binary;
  }

  /**
   * Convert cv.Mat to canvas element
   * Useful for passing preprocessed images to Tesseract.js
   */
  matToCanvas(mat: any): HTMLCanvasElement {
    const cv = opencv.getCV();
    const canvas = document.createElement('canvas');

    canvas.width = mat.cols;
    canvas.height = mat.rows;

    cv.imshow(canvas, mat);

    return canvas;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton preprocessor instance
 */
export const preprocessor = new ImagePreprocessor();

/**
 * Export class for testing
 */
export default ImagePreprocessor;
