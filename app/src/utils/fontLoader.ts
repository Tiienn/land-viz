/**
 * Font Loader with Fallbacks
 *
 * Detects font loading status and provides fallback fonts.
 * Ensures text renders correctly even if custom fonts fail to load.
 */

import { logger } from './logger';

// Font definitions with fallbacks
const FONT_DEFINITIONS = {
  'Nunito Sans': {
    family: 'Nunito Sans',
    fallback: 'system-ui, -apple-system, sans-serif',
    weight: [400, 600, 700],
    style: ['normal', 'italic']
  },
  'Roboto': {
    family: 'Roboto',
    fallback: 'Arial, sans-serif',
    weight: [400, 500, 700],
    style: ['normal', 'italic']
  },
  'Open Sans': {
    family: 'Open Sans',
    fallback: 'Arial, sans-serif',
    weight: [400, 600, 700],
    style: ['normal', 'italic']
  },
  'Montserrat': {
    family: 'Montserrat',
    fallback: 'Arial, sans-serif',
    weight: [400, 600, 700],
    style: ['normal']
  },
  'Lato': {
    family: 'Lato',
    fallback: 'Arial, sans-serif',
    weight: [400, 700],
    style: ['normal', 'italic']
  },
  'Courier New': {
    family: 'Courier New',
    fallback: 'monospace',
    weight: [400, 700],
    style: ['normal']
  }
} as const;

// Font loading cache
const fontLoadingCache = new Map<string, boolean>();
let fontsLoaded = false;

/**
 * Check if a font is loaded
 *
 * @param fontFamily - Font family name
 * @returns True if font is loaded
 */
export function isFontLoaded(fontFamily: string): boolean {
  // Check cache first
  if (fontLoadingCache.has(fontFamily)) {
    return fontLoadingCache.get(fontFamily)!;
  }

  // Use Font Loading API if available
  if ('fonts' in document) {
    try {
      const loaded = document.fonts.check(`16px "${fontFamily}"`);
      fontLoadingCache.set(fontFamily, loaded);
      return loaded;
    } catch (error) {
      logger.warn('[FontLoader] Error checking font', { fontFamily, error });
      return false;
    }
  }

  // Fallback: assume font is loaded after page load
  return fontsLoaded;
}

/**
 * Get font stack with fallbacks
 *
 * @param fontFamily - Primary font family
 * @returns Complete font stack including fallbacks
 */
export function getFontStack(fontFamily: string): string {
  const font = FONT_DEFINITIONS[fontFamily as keyof typeof FONT_DEFINITIONS];

  if (!font) {
    logger.warn('[FontLoader] Unknown font family, using system default', { fontFamily });
    return 'system-ui, -apple-system, sans-serif';
  }

  const isLoaded = isFontLoaded(fontFamily);

  if (!isLoaded) {
    logger.info('[FontLoader] Font not loaded, using fallback', { fontFamily });
  }

  return `"${font.family}", ${font.fallback}`;
}

/**
 * Wait for fonts to load with timeout
 *
 * @param timeout - Maximum wait time in ms (default: 3000)
 * @returns Promise that resolves when fonts are ready or timeout
 */
export async function waitForFonts(timeout: number = 3000): Promise<void> {
  if (fontsLoaded) {
    return Promise.resolve();
  }

  if (!('fonts' in document)) {
    logger.info('[FontLoader] Font Loading API not available, skipping wait');
    fontsLoaded = true;
    return Promise.resolve();
  }

  try {
    // Race between fonts.ready and timeout
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => setTimeout(() => resolve(), timeout))
    ]);

    fontsLoaded = true;
    logger.info('[FontLoader] Fonts loaded successfully');
  } catch (error) {
    logger.warn('[FontLoader] Error waiting for fonts', { error });
    fontsLoaded = true; // Mark as loaded anyway to prevent blocking
  }
}

/**
 * Preload specific font
 *
 * @param fontFamily - Font family to preload
 * @param weight - Font weight (default: 400)
 * @param style - Font style (default: 'normal')
 * @returns Promise that resolves when font is loaded
 */
export async function preloadFont(
  fontFamily: string,
  weight: number = 400,
  style: string = 'normal'
): Promise<boolean> {
  if (!('fonts' in document)) {
    logger.info('[FontLoader] Font Loading API not available');
    return false;
  }

  const font = FONT_DEFINITIONS[fontFamily as keyof typeof FONT_DEFINITIONS];

  if (!font) {
    logger.warn('[FontLoader] Unknown font family for preload', { fontFamily });
    return false;
  }

  try {
    // Load font with specific weight and style
    const fontDescriptor = `${style} ${weight} 16px "${fontFamily}"`;
    await document.fonts.load(fontDescriptor);

    fontLoadingCache.set(fontFamily, true);
    logger.info('[FontLoader] Font preloaded', { fontFamily, weight, style });
    return true;
  } catch (error) {
    logger.warn('[FontLoader] Error preloading font', { fontFamily, error });
    return false;
  }
}

/**
 * Get all available fonts with their loading status
 *
 * @returns Array of fonts with loading status
 */
export function getAvailableFontsWithStatus(): Array<{
  name: string;
  loaded: boolean;
  fallback: string;
}> {
  return Object.entries(FONT_DEFINITIONS).map(([name, def]) => ({
    name,
    loaded: isFontLoaded(name),
    fallback: def.fallback
  }));
}

/**
 * Validate font family and provide fallback if invalid
 *
 * @param fontFamily - Font family to validate
 * @returns Valid font family or fallback
 */
export function validateFontFamily(fontFamily: string): string {
  const validFonts = Object.keys(FONT_DEFINITIONS);

  if (validFonts.includes(fontFamily)) {
    return fontFamily;
  }

  logger.warn('[FontLoader] Invalid font family, using default', { fontFamily });
  return 'Nunito Sans';
}

/**
 * Initialize font loader
 * Should be called once when app loads
 */
export function initializeFontLoader(): void {
  if ('fonts' in document) {
    // Listen for font loading events
    document.fonts.addEventListener('loadingdone', () => {
      fontsLoaded = true;
      logger.info('[FontLoader] All fonts loaded');

      // Update cache
      Object.keys(FONT_DEFINITIONS).forEach(fontFamily => {
        fontLoadingCache.set(fontFamily, isFontLoaded(fontFamily));
      });
    });

    document.fonts.addEventListener('loadingerror', (event) => {
      logger.warn('[FontLoader] Font loading error', { event });
    });
  }

  // Start loading fonts
  waitForFonts().catch((error) => {
    logger.warn('[FontLoader] Error during initialization', { error });
  });
}
