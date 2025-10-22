/**
 * Text Utilities
 *
 * Helper functions for text positioning, rotation, validation, and creation.
 */

import type { TextObject, TextPosition, TextType } from '../types/text';

/**
 * Calculate label position based on shape position, rotation, and offset
 *
 * @param shapeCenter - Center point of the shape
 * @param shapeRotation - Rotation of the shape in degrees
 * @param offset - Offset from shape center
 * @returns Calculated 3D position for the label
 */
export function calculateLabelPosition(
  shapeCenter: { x: number; y: number },
  shapeRotation: number,
  offset: { x: number; y: number }
): TextPosition {
  const rotatedOffset = rotateVector(offset, shapeRotation);
  return {
    x: shapeCenter.x + rotatedOffset.x,
    y: shapeCenter.y + rotatedOffset.y,
    z: 0.1 // Above grid
  };
}

/**
 * Rotate a 2D vector by angle in degrees
 *
 * @param vector - 2D vector to rotate
 * @param angleDegrees - Rotation angle in degrees
 * @returns Rotated 2D vector
 */
export function rotateVector(
  vector: { x: number; y: number },
  angleDegrees: number
): { x: number; y: number } {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos
  };
}

/**
 * Generate unique text ID with timestamp and random component
 *
 * @returns Unique text identifier
 */
export function generateTextId(): string {
  return `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate text content
 *
 * @param content - Text content to validate
 * @returns Validation result with error message if invalid
 */
export function validateTextContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (content.length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }
  if (content.length > 500) {
    return { valid: false, error: 'Text exceeds 500 character limit' };
  }
  return { valid: true };
}

/**
 * Create default text object with sensible defaults
 *
 * @param position - 3D position for the text
 * @param layerId - ID of the layer to place text in
 * @param type - Type of text (floating or label)
 * @returns Text object without ID and content (to be filled by caller)
 */
export function createDefaultTextObject(
  position: TextPosition,
  layerId: string,
  type: TextType = 'floating'
): Omit<TextObject, 'id' | 'content'> {
  return {
    type,
    position,
    fontFamily: 'Nunito Sans',
    fontSize: 18,
    color: '#000000',
    alignment: 'center',
    opacity: 1, // Text opacity (fully visible by default)
    bold: false,
    italic: false,
    underline: false,
    uppercase: false,
    letterSpacing: 0,
    lineHeight: 1.5,
    backgroundOpacity: 100,
    rotation: 0,
    layerId,
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * Clamp text position to valid bounds
 *
 * @param position - Position to clamp
 * @returns Clamped position within valid bounds
 */
export function clampTextPosition(position: TextPosition): TextPosition {
  const MIN_BOUND = -1000;
  const MAX_BOUND = 1000;
  const MIN_Z = 0.1; // Above grid

  return {
    x: Math.max(MIN_BOUND, Math.min(MAX_BOUND, position.x)),
    y: Math.max(MIN_BOUND, Math.min(MAX_BOUND, position.y)),
    z: Math.max(MIN_Z, position.z)
  };
}

/**
 * Convert letter spacing value to CSS em units
 *
 * @param letterSpacing - Letter spacing value (-50 to 200)
 * @returns CSS letter-spacing value in em
 */
export function letterSpacingToEm(letterSpacing: number): string {
  return `${letterSpacing / 100}em`;
}

/**
 * Check if text content contains special characters that need handling
 *
 * @param content - Text content to check
 * @returns True if content has special characters
 */
export function hasSpecialCharacters(content: string): boolean {
  // Check for emojis, Unicode, or special characters
  return /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(content);
}

/**
 * Sanitize text content for safe rendering
 *
 * @param content - Text content to sanitize
 * @returns Sanitized text content
 */
export function sanitizeTextContent(content: string): string {
  // Replace tabs with spaces
  let sanitized = content.replace(/\t/g, '    ');

  // Trim excessive whitespace but preserve intentional line breaks
  sanitized = sanitized.replace(/[ ]+/g, ' ');

  return sanitized;
}

/**
 * Get font families available for text
 *
 * @returns Array of font family names
 */
export function getAvailableFonts(): string[] {
  return [
    'Nunito Sans',
    'Roboto',
    'Open Sans',
    'Montserrat',
    'Lato',
    'Courier New'
  ];
}

/**
 * Get background color with opacity applied
 *
 * @param color - Hex color string
 * @param opacity - Opacity value (0-100)
 * @returns RGBA color string or undefined if no color
 */
export function getBackgroundColorWithOpacity(
  color: string | undefined,
  opacity: number
): string | undefined {
  if (!color) return undefined;

  // Convert opacity (0-100) to hex alpha (00-FF)
  const alpha = Math.round((opacity / 100) * 255);
  const alphaHex = alpha.toString(16).padStart(2, '0');

  return `${color}${alphaHex}`;
}
