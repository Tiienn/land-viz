import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  shapeToElement,
  textToElement,
  elementToShape,
  elementToText,
  migrateToElements,
  hasMigrated,
  setMigrated,
  backupBeforeMigration,
  restoreFromBackup,
} from '../elementMigration';
import type { Shape, TextObject } from '../../types';
import type { TextObject as TextObjectType } from '../../types/text';

describe('elementMigration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('shapeToElement', () => {
    it('should convert Shape to ShapeElement without data loss', () => {
      const shape: Shape = {
        id: 'shape-1',
        name: 'Rectangle 1',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        type: 'rectangle',
        color: '#3B82F6',
        visible: true,
        layerId: 'layer-1',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-15'),
        rotation: { angle: 45, center: { x: 5, y: 5 } },
        locked: false,
        groupId: 'group-1',
      };

      const element = shapeToElement(shape);

      expect(element.elementType).toBe('shape');
      expect(element.id).toBe(shape.id);
      expect(element.name).toBe(shape.name);
      expect(element.shapeType).toBe(shape.type);
      expect(element.points).toEqual(shape.points);
      expect(element.color).toBe(shape.color);
      expect(element.rotation).toEqual(shape.rotation);
      expect(element.groupId).toBe(shape.groupId);
      expect(element.locked).toBe(false);
      expect(element.visible).toBe(true);
      expect(element.layerId).toBe('layer-1');
    });

    it('should handle locked property defaulting to false when undefined', () => {
      const shape: Shape = {
        id: 'shape-1',
        name: 'Test',
        points: [{ x: 0, y: 0 }],
        type: 'rectangle',
        color: '#000000',
        visible: true,
        layerId: 'layer-1',
        created: new Date(),
        modified: new Date(),
        // locked is undefined
      };

      const element = shapeToElement(shape);
      expect(element.locked).toBe(false);
    });
  });

  describe('textToElement', () => {
    it('should convert TextObject to TextElement without data loss', () => {
      const text: TextObjectType = {
        id: 'text-1',
        type: 'floating',
        content: 'Hello World',
        position: { x: 10, y: 20, z: 0 },
        fontFamily: 'Nunito Sans',
        fontSize: 24,
        color: '#000000',
        alignment: 'center',
        opacity: 1,
        bold: true,
        italic: false,
        underline: false,
        uppercase: false,
        letterSpacing: 0,
        lineHeight: 1.2,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'layer-1',
        locked: false,
        visible: true,
        createdAt: new Date('2025-01-01').getTime(),
        updatedAt: new Date('2025-01-15').getTime(),
      };

      const element = textToElement(text);

      expect(element.elementType).toBe('text');
      expect(element.id).toBe(text.id);
      expect(element.content).toBe(text.content);
      expect(element.position).toEqual({ x: 10, y: 20 });
      expect(element.z).toBe(0);
      expect(element.fontSize).toBe(24);
      expect(element.bold).toBe(true);
      expect(element.created).toEqual(new Date('2025-01-01'));
      expect(element.modified).toEqual(new Date('2025-01-15'));
    });

    it('should truncate long text content in name', () => {
      const longText: TextObjectType = {
        id: 'text-1',
        type: 'floating',
        content: 'This is a very long text content that should be truncated in the name',
        position: { x: 0, y: 0, z: 0 },
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: '#000000',
        alignment: 'left',
        opacity: 1,
        bold: false,
        italic: false,
        underline: false,
        uppercase: false,
        letterSpacing: 0,
        lineHeight: 1,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'layer-1',
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const element = textToElement(longText);
      expect(element.name).toContain('...');
      expect(element.name.length).toBeLessThan(longText.content.length + 10);
    });
  });

  describe('round-trip conversions', () => {
    it('should preserve Shape data through round-trip conversion', () => {
      const originalShape: Shape = {
        id: 'shape-1',
        name: 'Test Shape',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        type: 'rectangle',
        color: '#FF0000',
        visible: true,
        layerId: 'layer-1',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-15'),
        locked: true,
        groupId: 'group-1',
      };

      const element = shapeToElement(originalShape);
      const roundTrip = elementToShape(element);

      expect(roundTrip).toEqual(originalShape);
    });

    it('should preserve TextObject data through round-trip conversion', () => {
      const originalText: TextObjectType = {
        id: 'text-1',
        type: 'floating',
        content: 'Test Text',
        position: { x: 5, y: 10, z: 0 },
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: '#000000',
        alignment: 'left',
        opacity: 1,
        bold: false,
        italic: false,
        underline: false,
        uppercase: false,
        letterSpacing: 0,
        lineHeight: 1,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'layer-1',
        locked: false,
        visible: true,
        createdAt: 1704067200000,
        updatedAt: 1705276800000,
      };

      const element = textToElement(originalText);
      const roundTrip = elementToText(element);

      expect(roundTrip).toEqual(originalText);
    });
  });

  describe('migrateToElements', () => {
    it('should merge and sort shapes and text by creation date', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          name: 'Shape 1',
          points: [],
          type: 'rectangle',
          color: '#000000',
          visible: true,
          layerId: 'layer-1',
          created: new Date('2025-01-03'),
          modified: new Date('2025-01-03'),
        },
      ];

      const texts: TextObjectType[] = [
        {
          id: 'text-1',
          type: 'floating',
          content: 'Text 1',
          position: { x: 0, y: 0, z: 0 },
          fontFamily: 'Nunito Sans',
          fontSize: 16,
          color: '#000000',
          alignment: 'left',
          opacity: 1,
          bold: false,
          italic: false,
          underline: false,
          uppercase: false,
          letterSpacing: 0,
          lineHeight: 1,
          backgroundOpacity: 0,
          rotation: 0,
          layerId: 'layer-1',
          locked: false,
          visible: true,
          createdAt: new Date('2025-01-01').getTime(),
          updatedAt: new Date('2025-01-01').getTime(),
        },
      ];

      const elements = migrateToElements(shapes, texts);

      expect(elements.length).toBe(2);
      expect(elements[0].id).toBe('text-1'); // Created first (Jan 1)
      expect(elements[1].id).toBe('shape-1'); // Created second (Jan 3)
    });

    it('should handle empty arrays', () => {
      const elements = migrateToElements([], []);
      expect(elements.length).toBe(0);
    });

    it('should handle only shapes', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          name: 'Shape',
          points: [],
          type: 'rectangle',
          color: '#000000',
          visible: true,
          layerId: 'layer-1',
          created: new Date(),
          modified: new Date(),
        },
      ];

      const elements = migrateToElements(shapes, []);
      expect(elements.length).toBe(1);
      expect(elements[0].elementType).toBe('shape');
    });

    it('should handle only texts', () => {
      const texts: TextObjectType[] = [
        {
          id: 'text-1',
          type: 'floating',
          content: 'Text',
          position: { x: 0, y: 0, z: 0 },
          fontFamily: 'Nunito Sans',
          fontSize: 16,
          color: '#000000',
          alignment: 'left',
          opacity: 1,
          bold: false,
          italic: false,
          underline: false,
          uppercase: false,
          letterSpacing: 0,
          lineHeight: 1,
          backgroundOpacity: 0,
          rotation: 0,
          layerId: 'layer-1',
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const elements = migrateToElements([], texts);
      expect(elements.length).toBe(1);
      expect(elements[0].elementType).toBe('text');
    });
  });

  describe('migration state', () => {
    it('should track migration status', () => {
      expect(hasMigrated()).toBe(false);

      setMigrated();

      expect(hasMigrated()).toBe(true);
      expect(localStorage.getItem('land-viz:elements-migrated')).toBe('true');
      expect(localStorage.getItem('land-viz:elements-migrated-timestamp')).toBeTruthy();
    });

    it('should persist migration status across checks', () => {
      setMigrated();
      const firstCheck = hasMigrated();
      const secondCheck = hasMigrated();

      expect(firstCheck).toBe(true);
      expect(secondCheck).toBe(true);
    });
  });

  describe('backup and restore', () => {
    it('should create and restore backup', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          name: 'Shape',
          points: [],
          type: 'rectangle',
          color: '#000000',
          visible: true,
          layerId: 'layer-1',
          created: new Date(),
          modified: new Date(),
        },
      ];

      const texts: TextObjectType[] = [];

      backupBeforeMigration(shapes, texts);

      const backup = restoreFromBackup();

      expect(backup).not.toBeNull();
      expect(backup!.shapes.length).toBe(1);
      expect(backup!.texts.length).toBe(0);
      expect(backup!.shapes[0].id).toBe('shape-1');
    });

    it('should return null if no backup exists', () => {
      const backup = restoreFromBackup();
      expect(backup).toBeNull();
    });

    it('should store timestamp and version in backup', () => {
      const shapes: Shape[] = [];
      const texts: TextObjectType[] = [];

      backupBeforeMigration(shapes, texts);

      const backupStr = localStorage.getItem('land-viz:pre-migration-backup');
      expect(backupStr).toBeTruthy();

      const backup = JSON.parse(backupStr!);
      expect(backup.timestamp).toBeTruthy();
      expect(backup.version).toBe('1.0');
    });

    it('should handle corrupted backup gracefully', () => {
      localStorage.setItem('land-viz:pre-migration-backup', 'invalid json');

      const backup = restoreFromBackup();
      expect(backup).toBeNull();
    });
  });
});
