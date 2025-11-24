import { logger } from './logger';

// Maximum canvas dimension to prevent memory issues (16+ megapixels = ~64MB RAM)
const MAX_CANVAS_DIMENSION = 4096;

/**
 * Captures the entire scene (WebGL canvas + HTML overlays) as high-resolution PNG
 * Uses direct canvas capture for WebGL content, then composites HTML overlays
 * Applies white background for professional technical drawing output
 *
 * Canvas dimensions are capped at 4096x4096 to prevent memory issues.
 * Resolution is automatically scaled down if needed.
 *
 * @param containerElement - The scene container DOM element (must include canvas and overlays)
 * @param resolution - Pixel ratio multiplier (2 = high quality, 4 = ultra quality)
 * @returns PNG data URL (base64 encoded)
 * @throws Error if capture fails
 */
export async function captureSceneSnapshot(
  containerElement: HTMLElement,
  resolution: number = 2
): Promise<string> {
  console.log('[Scene Export] Starting scene capture at resolution:', resolution);

  if (!containerElement) {
    throw new Error('Scene container element not found');
  }

  try {
    // Find the WebGL canvas
    const webglCanvas = containerElement.querySelector('canvas') as HTMLCanvasElement;
    if (!webglCanvas) {
      throw new Error('WebGL canvas not found in container');
    }

    console.log('[Scene Export] Found WebGL canvas:', webglCanvas.width, 'x', webglCanvas.height);

    // Get original dimensions
    const width = containerElement.offsetWidth;
    const height = containerElement.offsetHeight;

    // Calculate effective resolution with size limits
    // Cap canvas dimensions at MAX_CANVAS_DIMENSION to prevent memory issues
    const maxDimension = Math.max(width, height);
    const effectiveResolution = Math.min(
      resolution,
      MAX_CANVAS_DIMENSION / maxDimension
    );

    if (effectiveResolution < resolution) {
      console.log(`[Scene Export] Resolution capped from ${resolution}x to ${effectiveResolution.toFixed(2)}x (max dimension: ${MAX_CANVAS_DIMENSION}px)`);
    }

    // Calculate final canvas dimensions
    const finalWidth = Math.floor(width * effectiveResolution);
    const finalHeight = Math.floor(height * effectiveResolution);

    console.log(`[Scene Export] Canvas size: ${finalWidth}x${finalHeight} (${(finalWidth * finalHeight / 1000000).toFixed(1)}MP)`);

    // Create a new canvas for compositing
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = finalWidth;
    compositeCanvas.height = finalHeight;
    const ctx = compositeCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context for composite canvas');
    }

    // Scale for high resolution
    ctx.scale(effectiveResolution, effectiveResolution);

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw the WebGL canvas
    ctx.drawImage(webglCanvas, 0, 0, width, height);

    // 3. Draw HTML overlays (dimension labels)
    await drawHTMLOverlays(ctx, containerElement, width, height);

    // Convert to data URL
    const dataUrl = compositeCanvas.toDataURL('image/png', 0.95);

    console.log('[Scene Export] Capture complete! Data URL size:', Math.round(dataUrl.length / 1024), 'KB');

    return dataUrl;
  } catch (error) {
    logger.error('Failed to capture scene snapshot:', error);
    throw new Error(`Scene capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Draw HTML overlays (dimension labels) onto canvas context
 * Uses DOM-to-canvas rendering for text labels
 */
async function drawHTMLOverlays(
  ctx: CanvasRenderingContext2D,
  container: HTMLElement,
  width: number,
  height: number
): Promise<void> {
  // Find all HTML overlays (drei Html components render as divs)
  // Try multiple strategies to find dimension labels
  let htmlOverlays: Element[] = [];

  // Strategy 1: Look for divs with specific classes
  const dreiElements = container.querySelectorAll('[class*="drei"]');
  if (dreiElements.length > 0) {
    htmlOverlays = Array.from(dreiElements);
    console.log(`[Scene Export] Strategy 1: Found ${htmlOverlays.length} drei elements`);
  }

  // Strategy 2: If no drei elements, find all divs with text content
  if (htmlOverlays.length === 0) {
    const allDivs = container.querySelectorAll('div');
    htmlOverlays = Array.from(allDivs).filter(el => {
      const element = el as HTMLElement;
      const text = element.textContent?.trim();
      // Must have text and be positioned absolutely (typical for drei Html)
      const isPositioned = window.getComputedStyle(element).position === 'absolute';
      return text && text.length > 0 && isPositioned;
    });
    console.log(`[Scene Export] Strategy 2: Found ${htmlOverlays.length} positioned divs with text`);
  }

  console.log(`[Scene Export] Processing ${htmlOverlays.length} HTML overlays`);

  // Track drawn labels with position using spatial grid for O(1) duplicate detection
  // Spatial grid divides the scene into cells and only checks nearby cells
  const PROXIMITY_THRESHOLD = 30; // pixels - if same text within 30px, it's a duplicate
  const GRID_SIZE = PROXIMITY_THRESHOLD; // Grid cell size matches proximity threshold
  const spatialGrid = new Map<string, Array<{ text: string; x: number; y: number }>>();

  // Helper: Get grid key for a position
  const getGridKey = (x: number, y: number): string => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    return `${gridX},${gridY}`;
  };

  // Helper: Check if a label is a duplicate (O(1) average case)
  const isDuplicateLabel = (text: string, x: number, y: number): boolean => {
    const centerKey = getGridKey(x, y);
    const [centerX, centerY] = centerKey.split(',').map(Number);

    // Check 3x3 grid around the point (9 cells max)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${centerX + dx},${centerY + dy}`;
        const nearbyLabels = spatialGrid.get(key);

        if (nearbyLabels) {
          for (const label of nearbyLabels) {
            if (label.text === text) {
              const distance = Math.sqrt(Math.pow(label.x - x, 2) + Math.pow(label.y - y, 2));
              if (distance < PROXIMITY_THRESHOLD) {
                return true; // Duplicate found
              }
            }
          }
        }
      }
    }
    return false;
  };

  // Helper: Add label to spatial grid
  const addLabelToGrid = (text: string, x: number, y: number): void => {
    const key = getGridKey(x, y);
    const cell = spatialGrid.get(key) || [];
    cell.push({ text, x, y });
    spatialGrid.set(key, cell);
  };

  for (const overlay of htmlOverlays) {
    const element = overlay as HTMLElement;

    // Skip hidden elements
    if (element.style.display === 'none' || element.style.visibility === 'hidden') {
      continue;
    }

    // Get position and dimensions
    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Calculate relative position - use CENTER of element (matches drei Html positioning)
    const x = (rect.left + rect.width / 2) - containerRect.left;
    const y = (rect.top + rect.height / 2) - containerRect.top;

    // Get text content and styles
    const text = element.textContent || '';
    if (!text.trim()) continue;

    const trimmedText = text.trim();

    // Check if we've already drawn this text within proximity threshold (O(1) with spatial grid)
    if (isDuplicateLabel(trimmedText, x, y)) {
      console.log(`[Scene Export] Skipping duplicate: "${trimmedText.substring(0, 20)}..." at (${Math.round(x)}, ${Math.round(y)})`);
      continue;
    }

    // Record this label in spatial grid
    addLabelToGrid(trimmedText, x, y);
    console.log(`[Scene Export] Drawing label: "${trimmedText.substring(0, 20)}..." at (${Math.round(x)}, ${Math.round(y)})`);

    const computedStyle = window.getComputedStyle(element);
    let fontSize = parseInt(computedStyle.fontSize, 10) || 12;
    let fontFamily = computedStyle.fontFamily || 'Nunito Sans, sans-serif';
    let fontWeight = computedStyle.fontWeight || '600';
    let color = computedStyle.color;
    let backgroundColor = computedStyle.backgroundColor;
    let padding = parseInt(computedStyle.padding || '0', 10);
    let borderRadius = parseInt(computedStyle.borderRadius || '0', 10) || 4;

    // Apply default styling to match canvas appearance (from ShapeDimensions.tsx)
    if (!padding || padding === 0) {
      padding = 6; // Default padding (matches canvas)
    }

    // Default background if transparent
    if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      backgroundColor = 'rgba(30, 30, 30, 0.85)'; // Dark semi-transparent background (matches canvas)
      color = 'rgb(255, 255, 255)'; // Force white text with dark background
    } else {
      // If background is set, check if we need to override text color
      // Force white text for readability on dark backgrounds
      backgroundColor = 'rgba(30, 30, 30, 0.85)';
      color = 'rgb(255, 255, 255)';
    }

    console.log(`[Scene Export] Label "${trimmedText.substring(0, 10)}" - bg: ${backgroundColor}, color: ${color}, font: ${fontSize}px, padding: ${padding}px`);

    // Set font - use actual pixel size for better rendering
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'middle'; // Vertical center alignment
    ctx.textAlign = 'center'; // Horizontal center alignment (matches canvas)

    // Measure text
    const textMetrics = ctx.measureText(trimmedText);
    const textWidth = textMetrics.width;
    const textHeight = fontSize * 1.2; // Better height estimation

    // Calculate background rectangle centered around (x, y)
    const horizontalPadding = padding * 2; // More padding horizontally
    const verticalPadding = padding;
    const bgWidth = textWidth + horizontalPadding * 2;
    const bgHeight = textHeight + verticalPadding * 2;
    const bgX = x - bgWidth / 2; // Center background horizontally
    const bgY = y - bgHeight / 2; // Center background vertically

    // Always draw background to match canvas appearance
    ctx.fillStyle = backgroundColor;
    ctx.save();

    if (borderRadius > 0) {
      roundRect(ctx, bgX, bgY, bgWidth, bgHeight, borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
    }

    ctx.restore();

    // Draw text centered at (x, y)
    ctx.fillStyle = color;
    ctx.fillText(trimmedText, x, y);
  }
}

/**
 * Helper function to draw rounded rectangles
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Get the scene container element from the DOM
 * Looks for the element with id="scene-container"
 *
 * @returns The scene container HTMLElement or null if not found
 */
export function getSceneContainerElement(): HTMLElement | null {
  const container = document.getElementById('scene-container');

  if (!container) {
    logger.warn('Scene container element with id="scene-container" not found');
    return null;
  }

  return container;
}

/**
 * Validates that the scene container is ready for capture
 * Checks for canvas element and minimum dimensions
 *
 * @param container - The scene container element
 * @returns true if valid, false otherwise
 */
export function validateSceneContainer(container: HTMLElement): boolean {
  // Check if container has canvas
  const canvas = container.querySelector('canvas');
  if (!canvas) {
    logger.error('No canvas element found in scene container');
    return false;
  }

  // Check minimum dimensions
  if (container.offsetWidth < 100 || container.offsetHeight < 100) {
    logger.error('Scene container dimensions too small for capture');
    return false;
  }

  return true;
}
