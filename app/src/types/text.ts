/**
 * Text Feature Type Definitions
 *
 * Defines types for text annotations and shape labels in the Land Visualizer.
 * Supports floating text objects and labels attached to shapes.
 */

/**
 * Type of text object
 */
export type TextType = 'floating' | 'label';

/**
 * Text alignment options
 */
export type TextAlignment = 'left' | 'center' | 'right';

/**
 * 3D position in space
 */
export interface TextPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Text styling properties
 */
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: TextAlignment;
  letterSpacing: number;
  lineHeight: number;
  backgroundColor?: string;
  backgroundOpacity: number;
  rotation: number;
}

/**
 * Complete text object with all properties
 */
export interface TextObject {
  // Identity
  id: string;
  type: TextType;
  content: string;

  // Position
  position: TextPosition;

  // Typography
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: TextAlignment;
  opacity: number; // Text opacity (0-1)

  // Text formatting
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;

  // Advanced formatting
  letterSpacing: number;
  lineHeight: number;
  backgroundColor?: string;
  backgroundOpacity: number;

  // Transform
  rotation: number;

  // Label-specific (for shape labels)
  attachedToShapeId?: string;
  offset?: {
    x: number;
    y: number;
  };

  // Metadata
  layerId: string;
  locked: boolean;
  visible: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Partial text object for updates
 */
export type TextObjectUpdate = Partial<Omit<TextObject, 'id' | 'createdAt'>>;

/**
 * Text creation input (without generated fields)
 */
export type TextObjectInput = Omit<TextObject, 'id' | 'createdAt' | 'updatedAt'>;
