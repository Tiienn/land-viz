/**
 * Dimension Extractor Service
 *
 * Extracts dimension measurements from site plan images using Tesseract.js OCR.
 *
 * FEATURES:
 * - OCR text recognition
 * - Dimension pattern matching (regex)
 * - Unit parsing (m, ft, yd, meters, feet, yards)
 * - Position extraction for edge matching
 * - Confidence filtering
 *
 * PATTERNS RECOGNIZED:
 * - "21.45m", "21.45 m", "21.45 meters"
 * - "50ft", "50 ft", "50 feet"
 * - "30yd", "30 yd", "30 yards"
 * - Decimal numbers: "39.49", "21.5"
 *
 * @example
 * ```typescript
 * import { dimensionExtractor } from './dimensionExtractor';
 * import { tesseract } from './tesseractSetup';
 *
 * await tesseract.initialize(['eng', 'fra']);
 *
 * const dimensions = await dimensionExtractor.extractDimensions(imageFile);
 * console.log(`Found ${dimensions.length} dimensions`);
 * dimensions.forEach(dim => {
 *   console.log(`${dim.value}${dim.unit} at (${dim.position.x}, ${dim.position.y})`);
 * });
 *
 * await tesseract.terminate();
 * ```
 */

import { tesseract } from './tesseractSetup';
import { preprocessor } from './preprocessor';
import { safeDelete } from './opencvSetup';
import { logger } from '../../utils/logger';
import type { ExtractedDimension, ExtractedLabel, Point2D, BoundingBox } from '../../types/imageImport';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Minimum OCR confidence threshold (0-100)
 * Text below this confidence is ignored
 */
const MIN_CONFIDENCE = 70;

/**
 * Dimension regex patterns
 * Matches various formats of numbers + units
 */
const DIMENSION_PATTERNS = [
  // Meters: "21.45m", "21.45 m", "21.45 meters", "21.45 metre"
  {
    regex: /(\d+(?:\.\d+)?)\s*(m|meters?|metres?)\b/gi,
    unit: 'm' as const,
  },
  // Feet: "50ft", "50 ft", "50 feet", "50 foot"
  {
    regex: /(\d+(?:\.\d+)?)\s*(ft|feet|foot)\b/gi,
    unit: 'ft' as const,
  },
  // Yards: "30yd", "30 yd", "30 yards", "30 yard"
  {
    regex: /(\d+(?:\.\d+)?)\s*(yd|yards?)\b/gi,
    unit: 'yd' as const,
  },
];

/**
 * Keywords that indicate non-dimension labels
 */
const LABEL_KEYWORDS = [
  'chemin', 'route', 'road', 'street', 'avenue', 'lot', 'parcel',
  'propriété', 'property', 'terrain', 'land', 'north', 'south', 'east', 'west',
  'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
];

// ============================================================================
// Types
// ============================================================================

/**
 * Raw OCR result for internal processing
 */
interface OcrWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  center: Point2D;
}

// ============================================================================
// Dimension Extractor Class
// ============================================================================

export class DimensionExtractor {
  /**
   * Extract dimensions from image using OCR
   *
   * @param imageFile - Image file to process
   * @param minConfidence - Minimum OCR confidence (default: 70)
   * @param usePreprocessing - Apply OCR-specific preprocessing (default: false)
   * @returns Array of extracted dimensions with positions
   */
  async extractDimensions(
    imageFile: File,
    minConfidence: number = MIN_CONFIDENCE,
    usePreprocessing: boolean = false
  ): Promise<ExtractedDimension[]> {
    if (!tesseract.isReady()) {
      throw new Error('Tesseract not initialized. Call tesseract.initialize() first.');
    }

    logger.info('[DimensionExtractor] Starting dimension extraction...');
    logger.info(`[DimensionExtractor] Using preprocessing: ${usePreprocessing}`);
    const startTime = Date.now();

    let preprocessedMat: any = null;
    let ocrInput: File | HTMLCanvasElement = imageFile;

    try {
      // Step 1: Preprocess image for OCR if enabled
      if (usePreprocessing) {
        logger.info('[DimensionExtractor] Applying OCR-specific preprocessing...');
        preprocessedMat = await preprocessor.prepareImageForOCR(imageFile);

        // Convert Mat to canvas for Tesseract
        ocrInput = preprocessor.matToCanvas(preprocessedMat);

        logger.info('[DimensionExtractor] Preprocessing complete, using enhanced image');
      } else {
        logger.info('[DimensionExtractor] Using original image (Tesseract built-in preprocessing)');
      }

      // Step 2: Perform OCR
      const result = await tesseract.recognize(ocrInput);

      // Debug: Log what we got from Tesseract
      logger.info('[DimensionExtractor] OCR result keys:', Object.keys(result));
      logger.info('[DimensionExtractor] OCR data keys:', Object.keys(result.data || {}));
      logger.info('[DimensionExtractor] Full text detected:', result.data.text);
      logger.info('[DimensionExtractor] Words array exists?', !!result.data.words);
      logger.info('[DimensionExtractor] Lines array exists?', !!result.data.lines);

      // Log full structure
      if (result.data.lines) {
        logger.info(`[DimensionExtractor] Found ${result.data.lines.length} lines`);
        result.data.lines.forEach((line: any, i: number) => {
          logger.info(`[DimensionExtractor]   Line ${i}: "${line.text}" (${line.words?.length || 0} words)`);
        });
      }

      // Check if we have word data
      if (!result.data.words || !Array.isArray(result.data.words)) {
        logger.warn('[DimensionExtractor] No word data in OCR result, trying to extract from lines');

        // Try to get words from lines
        if (result.data.lines && Array.isArray(result.data.lines)) {
          logger.info('[DimensionExtractor] Extracting words from lines');
          const wordsFromLines: any[] = [];
          for (const line of result.data.lines) {
            if (line.words && Array.isArray(line.words)) {
              logger.info(`[DimensionExtractor]   Extracting ${line.words.length} words from line: "${line.text}"`);
              wordsFromLines.push(...line.words);
            } else {
              logger.warn(`[DimensionExtractor]   Line has no words array: "${line.text}"`);
            }
          }
          logger.info(`[DimensionExtractor] Total words extracted from lines: ${wordsFromLines.length}`);
          // Inject words into result for processing
          result.data.words = wordsFromLines;
        } else {
          logger.error('[DimensionExtractor] No lines data either! OCR completely failed.');
        }
      }

      const wordCount = result.data.words?.length || 0;
      const confidence = result.data.confidence || 0;

      logger.info(
        `[DimensionExtractor] OCR complete. Found ${wordCount} words ` +
        `(confidence: ${confidence.toFixed(1)}%)`
      );

      // Step 2: Convert to internal format
      const words = this.convertOcrWords(result.data.words || [], minConfidence);

      logger.debug(`[DimensionExtractor] ${words.length} words passed confidence threshold`);

      // Step 3: Extract dimensions using regex patterns
      const dimensions = this.parseDimensions(words);

      const elapsed = Date.now() - startTime;
      logger.info(
        `[DimensionExtractor] Extraction complete in ${elapsed}ms. ` +
        `Found ${dimensions.length} dimensions`
      );

      return dimensions;

    } catch (error) {
      logger.error('[DimensionExtractor] Error during extraction:', error);
      throw new Error(`Dimension extraction failed: ${error}`);
    } finally {
      // Cleanup preprocessed Mat if created
      if (preprocessedMat) {
        safeDelete(preprocessedMat);
      }
    }
  }

  /**
   * Extract labels (non-dimension text) from image
   *
   * Useful for street names, lot numbers, notes, etc.
   *
   * @param imageFile - Image file to process
   * @param minConfidence - Minimum OCR confidence (default: 70)
   * @returns Array of extracted labels
   */
  async extractLabels(
    imageFile: File,
    minConfidence: number = MIN_CONFIDENCE
  ): Promise<ExtractedLabel[]> {
    if (!tesseract.isReady()) {
      throw new Error('Tesseract not initialized');
    }

    logger.info('[DimensionExtractor] Starting label extraction...');

    try {
      // Perform OCR
      const result = await tesseract.recognize(imageFile);

      // Convert words
      const words = this.convertOcrWords(result.data.words, minConfidence);

      // Extract labels
      const labels = this.parseLabels(words);

      logger.info(`[DimensionExtractor] Found ${labels.length} labels`);

      return labels;

    } catch (error) {
      logger.error('[DimensionExtractor] Error extracting labels:', error);
      throw new Error(`Label extraction failed: ${error}`);
    }
  }

  /**
   * Extract both dimensions and labels in one pass
   *
   * More efficient than calling both methods separately
   */
  async extractAll(
    imageFile: File,
    minConfidence: number = MIN_CONFIDENCE
  ): Promise<{
    dimensions: ExtractedDimension[];
    labels: ExtractedLabel[];
  }> {
    if (!tesseract.isReady()) {
      throw new Error('Tesseract not initialized');
    }

    logger.info('[DimensionExtractor] Starting full extraction...');
    const startTime = Date.now();

    try {
      // Single OCR pass
      const result = await tesseract.recognize(imageFile);

      // Convert words
      const words = this.convertOcrWords(result.data.words, minConfidence);

      // Extract both
      const dimensions = this.parseDimensions(words);
      const labels = this.parseLabels(words);

      const elapsed = Date.now() - startTime;
      logger.info(
        `[DimensionExtractor] Full extraction complete in ${elapsed}ms. ` +
        `Dimensions: ${dimensions.length}, Labels: ${labels.length}`
      );

      return { dimensions, labels };

    } catch (error) {
      logger.error('[DimensionExtractor] Error during full extraction:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Internal Methods
  // ==========================================================================

  /**
   * Convert Tesseract words to internal format
   * Filters by confidence and calculates centers
   */
  private convertOcrWords(
    tesseractWords: any[],
    minConfidence: number
  ): OcrWord[] {
    const words: OcrWord[] = [];

    for (const word of tesseractWords) {
      // Skip low confidence
      if (word.confidence < minConfidence) {
        continue;
      }

      const bbox: BoundingBox = {
        x0: word.bbox.x0,
        y0: word.bbox.y0,
        x1: word.bbox.x1,
        y1: word.bbox.y1,
      };

      const center: Point2D = {
        x: bbox.x0 + (bbox.x1 - bbox.x0) / 2,
        y: bbox.y0 + (bbox.y1 - bbox.y0) / 2,
      };

      words.push({
        text: word.text,
        confidence: word.confidence,
        bbox,
        center,
      });
    }

    return words;
  }

  /**
   * Parse dimensions from OCR words using regex patterns
   */
  private parseDimensions(words: OcrWord[]): ExtractedDimension[] {
    const dimensions: ExtractedDimension[] = [];

    for (const word of words) {
      // Try each pattern
      for (const pattern of DIMENSION_PATTERNS) {
        const matches = this.matchPattern(word.text, pattern.regex);

        for (const match of matches) {
          const value = parseFloat(match);

          // Validate value
          if (isNaN(value) || value <= 0 || value > 10000) {
            logger.warn(`[DimensionExtractor] Invalid dimension value: ${value}`);
            continue;
          }

          dimensions.push({
            value,
            unit: pattern.unit,
            position: word.center,
            bbox: word.bbox,
            confidence: word.confidence,
            text: word.text,
          });

          // Found match, don't try other patterns for this word
          break;
        }

        if (matches.length > 0) break;
      }
    }

    // Remove duplicates (same position, similar values)
    return this.deduplicateDimensions(dimensions);
  }

  /**
   * Parse labels (non-dimension text) from OCR words
   */
  private parseLabels(words: OcrWord[]): ExtractedLabel[] {
    const labels: ExtractedLabel[] = [];

    for (const word of words) {
      const text = word.text.trim();

      // Skip empty or very short text
      if (text.length < 2) continue;

      // Skip if it's a dimension
      if (this.isDimension(text)) continue;

      // Classify label type
      const type = this.classifyLabel(text);

      labels.push({
        text,
        type,
        position: word.center,
        bbox: word.bbox,
        confidence: word.confidence,
      });
    }

    return labels;
  }

  /**
   * Match text against regex pattern and extract numeric values
   */
  private matchPattern(text: string, regex: RegExp): string[] {
    const matches: string[] = [];
    let match;

    // Reset regex
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // First capture group is the number
      if (match[1]) {
        matches.push(match[1]);
      }
    }

    return matches;
  }

  /**
   * Check if text contains dimension pattern
   */
  private isDimension(text: string): boolean {
    for (const pattern of DIMENSION_PATTERNS) {
      pattern.regex.lastIndex = 0; // Reset
      if (pattern.regex.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Classify label type based on keywords
   */
  private classifyLabel(text: string): ExtractedLabel['type'] {
    const lowerText = text.toLowerCase();

    // Check for street/road
    if (
      lowerText.includes('chemin') ||
      lowerText.includes('route') ||
      lowerText.includes('road') ||
      lowerText.includes('street') ||
      lowerText.includes('avenue')
    ) {
      return 'street';
    }

    // Check for lot/parcel
    if (lowerText.includes('lot') || lowerText.includes('parcel')) {
      return 'lot_number';
    }

    // Check for note indicators
    if (
      lowerText.includes('note') ||
      lowerText.includes('see') ||
      lowerText.includes('ref')
    ) {
      return 'note';
    }

    return 'unknown';
  }

  /**
   * Remove duplicate dimensions
   * Duplicates = same position (within threshold) and similar values
   */
  private deduplicateDimensions(dimensions: ExtractedDimension[]): ExtractedDimension[] {
    if (dimensions.length === 0) return [];

    const unique: ExtractedDimension[] = [];
    const POSITION_THRESHOLD = 20; // pixels
    const VALUE_THRESHOLD = 0.1; // 10%

    for (const dim of dimensions) {
      let isDuplicate = false;

      for (const existing of unique) {
        // Check position similarity
        const dx = Math.abs(dim.position.x - existing.position.x);
        const dy = Math.abs(dim.position.y - existing.position.y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > POSITION_THRESHOLD) continue;

        // Check value similarity (convert to same unit)
        const dimValueInMeters = this.convertToMeters(dim.value, dim.unit);
        const existingValueInMeters = this.convertToMeters(existing.value, existing.unit);
        const valueDiff = Math.abs(dimValueInMeters - existingValueInMeters);
        const valueRatio = valueDiff / Math.max(dimValueInMeters, existingValueInMeters);

        if (valueRatio <= VALUE_THRESHOLD) {
          isDuplicate = true;

          // Keep the one with higher confidence
          if (dim.confidence > existing.confidence) {
            const index = unique.indexOf(existing);
            unique[index] = dim;
          }

          break;
        }
      }

      if (!isDuplicate) {
        unique.push(dim);
      }
    }

    logger.debug(
      `[DimensionExtractor] Deduplication: ${dimensions.length} → ${unique.length} dimensions`
    );

    return unique;
  }

  /**
   * Convert dimension to meters for comparison
   */
  private convertToMeters(value: number, unit: ExtractedDimension['unit']): number {
    switch (unit) {
      case 'm':
      case 'meters':
        return value;
      case 'ft':
      case 'feet':
        return value * 0.3048;
      case 'yd':
      case 'yards':
        return value * 0.9144;
      default:
        return value;
    }
  }

  /**
   * Normalize unit to standard form
   */
  normalizeUnit(unit: string): ExtractedDimension['unit'] {
    const lower = unit.toLowerCase();

    if (lower.includes('m') && !lower.includes('mile')) return 'm';
    if (lower.includes('ft') || lower.includes('feet') || lower.includes('foot')) return 'ft';
    if (lower.includes('yd') || lower.includes('yard')) return 'yd';

    return 'm'; // Default
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton dimension extractor instance
 */
export const dimensionExtractor = new DimensionExtractor();

/**
 * Export class for testing
 */
export default DimensionExtractor;
