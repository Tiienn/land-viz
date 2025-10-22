import type { Shape, ShapeElement, TextElement, Element } from '../types';
import type { TextObject } from '../types/text';
import { logger } from './logger';

/**
 * Convert legacy Shape to ShapeElement
 */
export function shapeToElement(shape: Shape): ShapeElement {
  return {
    id: shape.id,
    elementType: 'shape',
    name: shape.name,
    visible: shape.visible,
    locked: shape.locked ?? false,
    layerId: shape.layerId,
    groupId: shape.groupId,
    created: shape.created,
    modified: shape.modified,
    shapeType: shape.type,
    points: shape.points,
    color: shape.color,
    rotation: shape.rotation,
    label: undefined, // Label feature not yet implemented for shapes
  };
}

/**
 * Convert TextObject to TextElement
 */
export function textToElement(text: TextObject): TextElement {
  return {
    id: text.id,
    elementType: 'text',
    name: `Text: ${text.content.substring(0, 20)}${text.content.length > 20 ? '...' : ''}`,
    visible: text.visible,
    locked: text.locked,
    layerId: text.layerId,
    groupId: undefined, // Text doesn't have groupId yet
    created: new Date(text.createdAt),
    modified: new Date(text.updatedAt),
    position: { x: text.position.x, y: text.position.y },
    z: text.position.z,
    content: text.content,
    fontSize: text.fontSize,
    fontFamily: text.fontFamily,
    color: text.color,
    alignment: text.alignment,
    opacity: text.opacity,
    bold: text.bold,
    italic: text.italic,
    underline: text.underline,
    uppercase: text.uppercase,
    letterSpacing: text.letterSpacing,
    lineHeight: text.lineHeight,
    backgroundColor: text.backgroundColor,
    backgroundOpacity: text.backgroundOpacity,
    rotation: text.rotation,
    attachedToShapeId: text.attachedToShapeId,
    offset: text.offset,
  };
}

/**
 * Convert ShapeElement back to Shape (backward compatibility)
 */
export function elementToShape(element: ShapeElement): Shape {
  return {
    id: element.id,
    name: element.name,
    points: element.points,
    type: element.shapeType,
    color: element.color,
    visible: element.visible,
    layerId: element.layerId,
    created: element.created,
    modified: element.modified,
    rotation: element.rotation,
    locked: element.locked,
    groupId: element.groupId,
    // Note: label property not included as it's not in legacy Shape interface
  };
}

/**
 * Convert TextElement back to TextObject
 */
export function elementToText(element: TextElement): TextObject {
  return {
    id: element.id,
    type: 'floating',
    content: element.content,
    position: {
      x: element.position.x,
      y: element.position.y,
      z: element.z,
    },
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    color: element.color,
    alignment: element.alignment,
    opacity: element.opacity,
    bold: element.bold,
    italic: element.italic,
    underline: element.underline,
    uppercase: element.uppercase,
    letterSpacing: element.letterSpacing,
    lineHeight: element.lineHeight,
    backgroundColor: element.backgroundColor,
    backgroundOpacity: element.backgroundOpacity,
    rotation: element.rotation,
    attachedToShapeId: element.attachedToShapeId,
    offset: element.offset,
    layerId: element.layerId,
    locked: element.locked,
    visible: element.visible,
    createdAt: element.created.getTime(),
    updatedAt: element.modified.getTime(),
  };
}

/**
 * One-time migration function
 */
export function migrateToElements(
  shapes: Shape[],
  texts: TextObject[]
): Element[] {
  logger.info('[Migration] Starting conversion', {
    shapeCount: shapes.length,
    textCount: texts.length,
  });

  const shapeElements = shapes.map(shapeToElement);
  const textElements = texts.map(textToElement);

  const allElements = [...shapeElements, ...textElements];

  // Sort by creation date to preserve order
  allElements.sort((a, b) => a.created.getTime() - b.created.getTime());

  logger.info('[Migration] Conversion complete', {
    elementCount: allElements.length,
  });

  return allElements;
}

/**
 * Check if migration has already run
 */
export function hasMigrated(): boolean {
  const flag = localStorage.getItem('land-viz:elements-migrated');
  return flag === 'true';
}

/**
 * Mark migration as complete
 */
export function setMigrated(): void {
  localStorage.setItem('land-viz:elements-migrated', 'true');
  localStorage.setItem('land-viz:elements-migrated-timestamp', Date.now().toString());
}

/**
 * Create backup before migration
 */
export function backupBeforeMigration(
  shapes: Shape[],
  texts: TextObject[]
): void {
  const backup = {
    timestamp: Date.now(),
    version: '1.0',
    shapes,
    texts,
  };

  localStorage.setItem('land-viz:pre-migration-backup', JSON.stringify(backup));

  logger.info('[Migration] Backup created', {
    shapeCount: shapes.length,
    textCount: texts.length,
  });
}

/**
 * Restore from backup (rollback)
 */
export function restoreFromBackup(): { shapes: Shape[]; texts: TextObject[] } | null {
  try {
    const backupStr = localStorage.getItem('land-viz:pre-migration-backup');
    if (!backupStr) {
      logger.error('[Migration] No backup found');
      return null;
    }

    const backup = JSON.parse(backupStr);
    logger.info('[Migration] Backup restored', {
      shapeCount: backup.shapes.length,
      textCount: backup.texts.length,
    });

    return {
      shapes: backup.shapes,
      texts: backup.texts,
    };
  } catch (error) {
    logger.error('[Migration] Backup restoration failed', error);
    return null;
  }
}
