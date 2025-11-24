/**
 * Boundary Detection Service
 *
 * Core service for detecting property boundaries from uploaded site plan images
 * using OpenCV.js computer vision techniques.
 *
 * Features:
 * - Image preprocessing (grayscale, blur, threshold, morphology)
 * - Contour detection and filtering
 * - Polygon approximation (Douglas-Peucker)
 * - Confidence scoring
 *
 * Performance: <3 seconds for typical 2000x2000px images
 */

import { loadOpenCV, getOpenCV } from '../../utils/opencvLoader';
import type {
  DetectedBoundary,
  BoundaryDetectionResult,
  DetectionConfig,
} from './types';
import { DEFAULT_DETECTION_CONFIG } from './types';

export class BoundaryDetectionService {
  private cv: any = null;
  private initialized = false;

  /**
   * Initialize OpenCV.js
   * Must be called before using any detection methods
   *
   * @throws Error if OpenCV.js fails to load
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await loadOpenCV();
      this.cv = getOpenCV();
      this.initialized = true;
      console.log('[BoundaryDetection] OpenCV.js initialized successfully');
    } catch (error) {
      console.error('[BoundaryDetection] Failed to initialize OpenCV.js:', error);
      throw new Error('Failed to initialize boundary detection. Please try again.');
    }
  }

  /**
   * Detect boundaries from uploaded image
   *
   * @param image - HTML image element
   * @param config - Detection configuration (optional)
   * @returns Detection result with boundaries and metadata
   */
  async detectBoundaries(
    image: HTMLImageElement,
    config: DetectionConfig = DEFAULT_DETECTION_CONFIG
  ): Promise<BoundaryDetectionResult> {
    if (!this.initialized || !this.cv) {
      throw new Error('Service not initialized. Call init() first.');
    }

    const startTime = performance.now();

    try {
      // Step 1: Load image into OpenCV Mat
      const src = this.imageToMat(image);

      // Step 2: Preprocess image
      const processed = this.preprocessImage(src, config.preprocessing);

      // Step 3: Extract contours
      const contours = this.extractContours(processed, config.contour);

      // Step 4: Approximate polygons
      const boundaries = this.approximatePolygons(
        contours,
        config.polygonApproximation
      );

      // Step 5: Get processed image data for preview
      const processedImageData = this.matToImageData(processed);

      // Cleanup OpenCV matrices
      src.delete();
      processed.delete();
      contours.delete();

      const processingTime = performance.now() - startTime;

      console.log(
        `[BoundaryDetection] Detected ${boundaries.length} boundaries in ${processingTime.toFixed(0)}ms`
      );

      return {
        boundaries,
        scale: null,
        originalImage: image,
        processedImageData,
        metadata: {
          imageWidth: image.width,
          imageHeight: image.height,
          processingTime,
          opencvVersion: this.cv.getBuildInformation?.() || 'unknown',
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error('[BoundaryDetection] Detection failed:', error);
      throw new Error('Boundary detection failed. Please try a different image.');
    }
  }

  /**
   * Convert HTML image to OpenCV Mat
   */
  private imageToMat(image: HTMLImageElement): any {
    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);

    // Convert to OpenCV Mat
    return this.cv.imread(canvas);
  }

  /**
   * Convert OpenCV Mat to ImageData for preview
   */
  private matToImageData(mat: any): ImageData {
    const canvas = document.createElement('canvas');
    this.cv.imshow(canvas, mat);
    const ctx = canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Preprocess image for edge detection
   *
   * Pipeline:
   * 1. Convert to grayscale
   * 2. Apply Gaussian blur (noise reduction)
   * 3. Apply adaptive threshold (handle varying lighting)
   * 4. Apply morphological operations (close gaps, remove artifacts)
   */
  private preprocessImage(src: any, config: any): any {
    const cv = this.cv;

    // Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Gaussian blur (noise reduction)
    let blurred = gray;
    if (config.gaussianBlur) {
      blurred = new cv.Mat();
      const ksize = new cv.Size(config.blurKernelSize, config.blurKernelSize);
      cv.GaussianBlur(gray, blurred, ksize, 0);
      gray.delete();
    }

    // Adaptive threshold
    let thresholded = blurred;
    if (config.adaptiveThreshold) {
      thresholded = new cv.Mat();
      cv.adaptiveThreshold(
        blurred,
        thresholded,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY_INV,
        config.thresholdBlockSize,
        config.thresholdConstant
      );
      if (blurred !== gray) blurred.delete();
    }

    // Morphological operations
    let morphed = thresholded;
    if (config.morphology) {
      morphed = new cv.Mat();
      const kernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(config.morphologyKernelSize, config.morphologyKernelSize)
      );

      const morphOp =
        config.morphologyType === 'close'
          ? cv.MORPH_CLOSE
          : config.morphologyType === 'open'
          ? cv.MORPH_OPEN
          : config.morphologyType === 'dilate'
          ? cv.MORPH_DILATE
          : cv.MORPH_ERODE;

      cv.morphologyEx(thresholded, morphed, morphOp, kernel);
      kernel.delete();
      if (thresholded !== blurred) thresholded.delete();
    }

    return morphed;
  }

  /**
   * Extract contours from preprocessed image
   *
   * Finds all closed boundaries and filters by area/point count
   */
  private extractContours(processed: any, config: any): any {
    const cv = this.cv;

    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      processed,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL, // Only external contours
      cv.CHAIN_APPROX_SIMPLE // Compress horizontal/vertical segments
    );

    hierarchy.delete();

    // Filter contours
    const filtered = new cv.MatVector();
    const imageArea = processed.rows * processed.cols;
    const maxArea = config.maxArea > 0 ? config.maxArea : imageArea * 0.9;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      const points = contour.data32S.length / 2;

      // Filter by area and point count
      if (
        area >= config.minArea &&
        area <= maxArea &&
        points >= config.minPoints
      ) {
        filtered.push_back(contour);
      }
    }

    contours.delete();

    // Sort by area (largest first) if requested
    if (config.sortByArea && filtered.size() > 1) {
      const sortedContours = this.sortContoursByArea(filtered);
      filtered.delete();
      return sortedContours;
    }

    // Limit number of contours
    if (filtered.size() > config.maxContours) {
      const limited = new cv.MatVector();
      for (let i = 0; i < config.maxContours; i++) {
        limited.push_back(filtered.get(i));
      }
      filtered.delete();
      return limited;
    }

    return filtered;
  }

  /**
   * Sort contours by area (largest first)
   */
  private sortContoursByArea(contours: any): any {
    const cv = this.cv;
    const contoursWithArea: { contour: any; area: number }[] = [];

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      contoursWithArea.push({ contour, area });
    }

    contoursWithArea.sort((a, b) => b.area - a.area);

    const sorted = new cv.MatVector();
    contoursWithArea.forEach(({ contour }) => sorted.push_back(contour));

    return sorted;
  }

  /**
   * Approximate contours to simplified polygons
   *
   * Uses Douglas-Peucker algorithm to reduce point count
   * while preserving overall shape
   */
  private approximatePolygons(contours: any, config: any): DetectedBoundary[] {
    const cv = this.cv;
    const boundaries: DetectedBoundary[] = [];

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);

      // Original points
      const originalPoints: [number, number][] = [];
      for (let j = 0; j < contour.data32S.length; j += 2) {
        originalPoints.push([contour.data32S[j], contour.data32S[j + 1]]);
      }

      // Approximate polygon
      let points = originalPoints;
      let simplified = false;

      if (config.enabled) {
        const perimeter = cv.arcLength(contour, config.closed);
        const epsilon = config.epsilonFactor * perimeter;
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon, config.closed);

        points = [];
        for (let j = 0; j < approx.data32S.length; j += 2) {
          points.push([approx.data32S[j], approx.data32S[j + 1]]);
        }

        simplified = points.length < originalPoints.length;
        approx.delete();
      }

      // Detect shape type
      const type = this.detectShapeType(points);

      // Calculate confidence score (0-1)
      const confidence = this.calculateConfidence(points, area, simplified);

      boundaries.push({
        id: `boundary-${Date.now()}-${i}`,
        type,
        points,
        area,
        confidence,
        simplified,
        originalPoints: simplified ? originalPoints : undefined,
      });
    }

    return boundaries;
  }

  /**
   * Detect shape type from points
   */
  private detectShapeType(
    points: [number, number][]
  ): 'polygon' | 'rectangle' | 'circle' {
    if (points.length === 4) {
      // Check if it's a rectangle (4 ~90° angles)
      const isRectangle = this.isRectangle(points);
      if (isRectangle) {
        return 'rectangle';
      }
    }

    // TODO: Detect circles using Hough Circle Transform
    // For now, all non-rectangles are polygons
    return 'polygon';
  }

  /**
   * Check if 4 points form a rectangle (all angles ~90°)
   */
  private isRectangle(points: [number, number][]): boolean {
    if (points.length !== 4) return false;

    const angleThreshold = 15; // degrees

    for (let i = 0; i < 4; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % 4];
      const p3 = points[(i + 2) % 4];

      const angle = this.calculateAngle(p1, p2, p3);
      const diff = Math.abs(angle - 90);

      if (diff > angleThreshold) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate angle between three points (in degrees)
   */
  private calculateAngle(
    p1: [number, number],
    p2: [number, number],
    p3: [number, number]
  ): number {
    const v1 = [p1[0] - p2[0], p1[1] - p2[1]];
    const v2 = [p3[0] - p2[0], p3[1] - p2[1]];

    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    const mag1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
    const mag2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);

    const cos = dot / (mag1 * mag2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cos)));
    return (angleRad * 180) / Math.PI;
  }

  /**
   * Calculate confidence score for detected boundary
   *
   * Factors:
   * - Point count (simpler is better)
   * - Area (larger is more likely property boundary)
   * - Simplification success (good fit = high confidence)
   */
  private calculateConfidence(
    points: [number, number][],
    area: number,
    simplified: boolean
  ): number {
    let confidence = 0.5; // Base confidence

    // Simpler shapes = higher confidence
    if (points.length <= 6) {
      confidence += 0.2;
    } else if (points.length <= 12) {
      confidence += 0.1;
    }

    // Larger areas = higher confidence (likely main boundary)
    if (area > 10000) {
      confidence += 0.2;
    } else if (area > 1000) {
      confidence += 0.1;
    }

    // Successful simplification = higher confidence
    if (simplified) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.initialized = false;
    this.cv = null;
  }
}

// Singleton instance
let serviceInstance: BoundaryDetectionService | null = null;

/**
 * Get singleton instance of boundary detection service
 */
export function getBoundaryDetectionService(): BoundaryDetectionService {
  if (!serviceInstance) {
    serviceInstance = new BoundaryDetectionService();
  }
  return serviceInstance;
}
