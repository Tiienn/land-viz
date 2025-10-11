/**
 * Tesseract.js OCR Worker Setup
 *
 * Singleton service for initializing and managing Tesseract.js OCR worker.
 *
 * FEATURES:
 * - Web Worker based (non-blocking)
 * - Multi-language support (English + French)
 * - Configured for dimension text recognition
 * - Character whitelist for accuracy
 * - Progress callbacks
 *
 * NOTES:
 * - Language data is ~2MB per language (downloaded on first use)
 * - Worker runs in background thread
 * - Must terminate worker when done to free resources
 *
 * @example
 * ```typescript
 * import { tesseract } from './tesseractSetup';
 *
 * // Initialize
 * await tesseract.initialize(['eng', 'fra']);
 *
 * // Recognize text
 * const result = await tesseract.recognize(imageFile);
 * console.log(result.data.text);
 *
 * // Cleanup when done
 * await tesseract.terminate();
 * ```
 */

import { createWorker, Worker, PSM, OEM } from 'tesseract.js';
import { logger } from '../../utils/logger';
import type { OcrConfig } from '../../types/imageImport';

/**
 * Tesseract initialization states
 */
type TesseractState = 'not_initialized' | 'initializing' | 'ready' | 'terminated' | 'error';

/**
 * Singleton class for Tesseract.js worker management
 */
export class TesseractSetup {
  private static instance: TesseractSetup;
  private worker: Worker | null = null;
  private state: TesseractState = 'not_initialized';
  private initPromise: Promise<void> | null = null;
  private currentLanguages: string[] = [];
  private errorMessage: string | null = null;

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TesseractSetup {
    if (!TesseractSetup.instance) {
      TesseractSetup.instance = new TesseractSetup();
    }
    return TesseractSetup.instance;
  }

  /**
   * Initialize Tesseract.js worker
   *
   * Downloads language data (if not cached) and sets up worker
   * with configuration optimized for dimension text recognition.
   *
   * @param languages - OCR languages to load (default: ['eng', 'fra'])
   * @param config - Optional OCR configuration
   * @throws {Error} If initialization fails
   */
  async initialize(
    languages: string[] = ['eng', 'fra'],
    config?: Partial<OcrConfig>
  ): Promise<void> {
    // Already ready with same languages
    if (this.state === 'ready' && this.arraysEqual(languages, this.currentLanguages)) {
      logger.info('[Tesseract] Already initialized with languages:', languages);
      return Promise.resolve();
    }

    // Currently initializing - wait for it
    if (this.state === 'initializing' && this.initPromise) {
      logger.info('[Tesseract] Already initializing, waiting...');
      return this.initPromise;
    }

    // Need to reinitialize with different languages
    if (this.state === 'ready' && !this.arraysEqual(languages, this.currentLanguages)) {
      logger.info('[Tesseract] Reinitializing with new languages:', languages);
      await this.terminate();
    }

    // Previous error - try again
    if (this.state === 'error') {
      logger.warn('[Tesseract] Previous initialization failed, retrying...');
      this.state = 'not_initialized';
      this.errorMessage = null;
    }

    // Start initialization
    this.state = 'initializing';
    this.currentLanguages = languages;
    this.initPromise = this.createWorker(languages, config);

    try {
      await this.initPromise;
      this.state = 'ready';
      logger.info('[Tesseract] Worker initialized successfully');
    } catch (error) {
      this.state = 'error';
      this.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Tesseract] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create and configure Tesseract worker
   */
  private async createWorker(
    languages: string[],
    config?: Partial<OcrConfig>
  ): Promise<void> {
    try {
      logger.info('[Tesseract] Creating worker for languages:', languages.join('+'));

      // Create worker with language(s)
      this.worker = await createWorker(languages.join('+'), 1, {
        logger: (m) => {
          // Log progress during initialization
          if (m.status === 'loading language traineddata') {
            logger.info(`[Tesseract] Loading language data: ${m.progress * 100}%`);
          } else if (m.status === 'initializing tesseract') {
            logger.info(`[Tesseract] Initializing: ${m.progress * 100}%`);
          }
        },
        // Use CDN for language files
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      });

      logger.info('[Tesseract] Worker created, configuring parameters...');

      // Get configuration
      const ocrConfig = this.getDefaultConfig(config);

      // Set parameters for dimension recognition
      await this.worker.setParameters({
        // Character whitelist - DISABLED to allow all characters (including accents, special chars)
        // The regex patterns will filter for dimensions later
        // tessedit_char_whitelist: ocrConfig.charWhitelist || '0123456789.,mftydMFTYD ',

        // Page segmentation mode
        // PSM.SPARSE_TEXT (11) - Find as much text as possible with no particular order
        // Perfect for scattered dimension labels on site plans
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,

        // OCR Engine Mode
        // OEM.LSTM_ONLY (1) - Neural nets LSTM only (more accurate, slower)
        oem: OEM.LSTM_ONLY,

        // Preserve inter-word spaces
        preserve_interword_spaces: ocrConfig.preserveSpaces ? '1' : '0',

        // Minimum word size (helps filter noise)
        tessedit_min_orientation_margin: 7,
      });

      logger.info('[Tesseract] Parameters configured');
    } catch (error) {
      logger.error('[Tesseract] Worker creation failed:', error);
      throw new Error(`Failed to create Tesseract worker: ${error}`);
    }
  }

  /**
   * Get default OCR configuration
   */
  private getDefaultConfig(override?: Partial<OcrConfig>): OcrConfig {
    return {
      languages: this.currentLanguages,
      charWhitelist: '0123456789.,mftydMFTYD ',
      pageSegMode: PSM.AUTO,
      preserveSpaces: true,
      ...override,
    };
  }

  /**
   * Recognize text from image file
   *
   * @param imageSource - Image file, path, or HTMLImageElement
   * @param options - Optional recognition options
   * @returns OCR result with text and bounding boxes
   */
  async recognize(
    imageSource: File | string | HTMLImageElement,
    options?: {
      rectangle?: { left: number; top: number; width: number; height: number };
      onProgress?: (progress: number) => void;
    }
  ): Promise<Tesseract.RecognizeResult> {
    if (this.state !== 'ready' || !this.worker) {
      throw new Error(
        `Tesseract not ready (state: ${this.state}). Call initialize() first.`
      );
    }

    try {
      logger.info('[Tesseract] Starting text recognition...');
      const startTime = Date.now();

      // Recognize with optional progress callback
      const result = await this.worker.recognize(imageSource, {
        rectangle: options?.rectangle,
      }, {
        logger: options?.onProgress
          ? (m) => {
              if (m.status === 'recognizing text') {
                options.onProgress!(m.progress);
              }
            }
          : undefined,
      });

      const elapsed = Date.now() - startTime;
      logger.info(`[Tesseract] Recognition complete in ${elapsed}ms`);
      logger.debug(`[Tesseract] Confidence: ${result.data.confidence}%`);

      return result;
    } catch (error) {
      logger.error('[Tesseract] Recognition failed:', error);
      throw new Error(`OCR recognition failed: ${error}`);
    }
  }

  /**
   * Get detected text as string
   *
   * Convenience method for simple text extraction
   */
  async getText(imageSource: File | string | HTMLImageElement): Promise<string> {
    const result = await this.recognize(imageSource);
    return result.data.text;
  }

  /**
   * Check if worker is ready
   */
  isReady(): boolean {
    return this.state === 'ready' && this.worker !== null;
  }

  /**
   * Get current state
   */
  getState(): TesseractState {
    return this.state;
  }

  /**
   * Get current languages
   */
  getLanguages(): string[] {
    return [...this.currentLanguages];
  }

  /**
   * Get error message from last failed initialization
   */
  getError(): string | null {
    return this.errorMessage;
  }

  /**
   * Terminate the worker
   *
   * IMPORTANT: Always call this when done to free resources!
   * Worker runs in separate thread and consumes memory.
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      try {
        logger.info('[Tesseract] Terminating worker...');
        await this.worker.terminate();
        this.worker = null;
        this.state = 'terminated';
        logger.info('[Tesseract] Worker terminated');
      } catch (error) {
        logger.error('[Tesseract] Error terminating worker:', error);
        throw error;
      }
    } else {
      logger.warn('[Tesseract] No worker to terminate');
    }
  }

  /**
   * Reinitialize with new configuration
   *
   * Terminates existing worker and creates new one
   */
  async reinitialize(
    languages?: string[],
    config?: Partial<OcrConfig>
  ): Promise<void> {
    logger.info('[Tesseract] Reinitializing...');
    await this.terminate();
    this.state = 'not_initialized';
    await this.initialize(languages || this.currentLanguages, config);
  }

  /**
   * Helper to compare arrays
   */
  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    logger.warn('[Tesseract] Resetting state');
    if (this.worker) {
      this.worker.terminate().catch((err) => {
        logger.error('[Tesseract] Error during reset termination:', err);
      });
      this.worker = null;
    }
    this.state = 'not_initialized';
    this.initPromise = null;
    this.currentLanguages = [];
    this.errorMessage = null;
  }
}

/**
 * Singleton instance export
 *
 * Usage:
 * ```typescript
 * import { tesseract } from './tesseractSetup';
 * await tesseract.initialize(['eng']);
 * const text = await tesseract.getText(imageFile);
 * await tesseract.terminate();
 * ```
 */
export const tesseract = TesseractSetup.getInstance();

/**
 * Type re-exports from Tesseract.js for convenience
 */
export type { RecognizeResult, Word, Line, Block, Page } from 'tesseract.js';
export { PSM, OEM } from 'tesseract.js';
