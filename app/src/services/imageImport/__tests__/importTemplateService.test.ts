/**
 * Unit Tests for ImportTemplateService
 *
 * Tests the CRUD operations for dimension templates including:
 * - Built-in templates
 * - User template creation/update/delete
 * - Search and filtering
 * - Import/export functionality
 * - localStorage persistence
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { importTemplateService } from '../importTemplateService';
import type { SavedTemplate, DimensionInput } from '../../../types/imageImport';

describe('ImportTemplateService', () => {
  // ============================================================================
  // Test Setup
  // ============================================================================

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await importTemplateService.clearUserTemplates();
  });

  // ============================================================================
  // Built-in Templates
  // ============================================================================

  describe('Built-in Templates', () => {
    it('should provide 5 built-in templates', async () => {
      const templates = await importTemplateService.getAllTemplates();
      const builtIn = templates.filter((t) => t.category === 'built-in');

      expect(builtIn).toHaveLength(5);
    });

    it('should include Standard Rectangle template', async () => {
      const templates = await importTemplateService.getAllTemplates();
      const rectangle = templates.find((t) => t.id === 'built-in-rectangle-1');

      expect(rectangle).toBeDefined();
      expect(rectangle?.name).toBe('Standard Rectangle (100m × 50m)');
      expect(rectangle?.edgeCount).toBe(4);
      expect(rectangle?.area).toBe(5000);
      expect(rectangle?.dimensions).toHaveLength(4);
    });

    it('should include Wide Lot template', async () => {
      const templates = await importTemplateService.getAllTemplates();
      const wideLot = templates.find((t) => t.id === 'built-in-rectangle-2');

      expect(wideLot).toBeDefined();
      expect(wideLot?.name).toBe('Wide Lot (150m × 40m)');
      expect(wideLot?.area).toBe(6000);
    });

    it('should include Triangle template', async () => {
      const templates = await importTemplateService.getAllTemplates();
      const triangle = templates.find((t) => t.id === 'built-in-triangle-1');

      expect(triangle).toBeDefined();
      expect(triangle?.edgeCount).toBe(3);
      expect(triangle?.tags).toContain('triangle');
    });

    it('should include Pentagon template', async () => {
      const templates = await importTemplateService.getAllTemplates();
      const pentagon = templates.find((t) => t.id === 'built-in-pentagon-1');

      expect(pentagon).toBeDefined();
      expect(pentagon?.edgeCount).toBe(5);
    });

    it('should include L-Shape template', async () => {
      const templates = await importTemplateService.getAllTemplates();
      const lShape = templates.find((t) => t.id === 'built-in-l-shape-1');

      expect(lShape).toBeDefined();
      expect(lShape?.edgeCount).toBe(6);
      expect(lShape?.tags).toContain('l-shape');
    });
  });

  // ============================================================================
  // Get Templates
  // ============================================================================

  describe('getAllTemplates', () => {
    it('should return only built-in templates when no user templates exist', async () => {
      const templates = await importTemplateService.getAllTemplates();

      expect(templates).toHaveLength(5);
      expect(templates.every((t) => t.category === 'built-in')).toBe(true);
    });

    it('should combine built-in and user templates', async () => {
      // Create user template
      await importTemplateService.saveTemplate({
        name: 'My Custom Template',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 20, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      const templates = await importTemplateService.getAllTemplates();

      expect(templates).toHaveLength(6); // 5 built-in + 1 user
      expect(templates.filter((t) => t.category === 'built-in')).toHaveLength(5);
      expect(templates.filter((t) => t.category === 'user')).toHaveLength(1);
    });
  });

  describe('getTemplate', () => {
    it('should retrieve built-in template by ID', async () => {
      const template = await importTemplateService.getTemplate('built-in-rectangle-1');

      expect(template).toBeDefined();
      expect(template?.id).toBe('built-in-rectangle-1');
    });

    it('should retrieve user template by ID', async () => {
      const saved = await importTemplateService.saveTemplate({
        name: 'Test Template',
        dimensions: [
          { edgeIndex: 0, value: 50, unit: 'm' },
          { edgeIndex: 1, value: 50, unit: 'm' },
          { edgeIndex: 2, value: 50, unit: 'm' },
        ],
        area: 1000,
      });

      const retrieved = await importTemplateService.getTemplate(saved.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(saved.id);
      expect(retrieved?.name).toBe('Test Template');
    });

    it('should return null for non-existent ID', async () => {
      const template = await importTemplateService.getTemplate('non-existent-id');

      expect(template).toBeNull();
    });
  });

  // ============================================================================
  // Filter Templates
  // ============================================================================

  describe('getTemplatesByEdgeCount', () => {
    it('should filter templates by edge count', async () => {
      const rectangles = await importTemplateService.getTemplatesByEdgeCount(4);

      expect(rectangles.length).toBeGreaterThan(0);
      expect(rectangles.every((t) => t.edgeCount === 4)).toBe(true);
    });

    it('should return triangles (3 edges)', async () => {
      const triangles = await importTemplateService.getTemplatesByEdgeCount(3);

      expect(triangles).toHaveLength(1);
      expect(triangles[0].id).toBe('built-in-triangle-1');
    });

    it('should return empty array for edge count with no templates', async () => {
      const results = await importTemplateService.getTemplatesByEdgeCount(100);

      expect(results).toHaveLength(0);
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should filter built-in templates', async () => {
      const builtIn = await importTemplateService.getTemplatesByCategory('built-in');

      expect(builtIn).toHaveLength(5);
      expect(builtIn.every((t) => t.category === 'built-in')).toBe(true);
    });

    it('should filter user templates', async () => {
      // Create user template
      await importTemplateService.saveTemplate({
        name: 'User Template 1',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      const userTemplates = await importTemplateService.getTemplatesByCategory('user');

      expect(userTemplates).toHaveLength(1);
      expect(userTemplates[0].category).toBe('user');
    });

    it('should return empty array when no user templates exist', async () => {
      const userTemplates = await importTemplateService.getTemplatesByCategory('user');

      expect(userTemplates).toHaveLength(0);
    });
  });

  // ============================================================================
  // Search Templates
  // ============================================================================

  describe('searchTemplates', () => {
    it('should search by name', async () => {
      const results = await importTemplateService.searchTemplates('rectangle');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((t) => t.name.toLowerCase().includes('rectangle'))).toBe(
        true
      );
    });

    it('should search by description', async () => {
      const results = await importTemplateService.searchTemplates('residential');

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((t) => t.description?.toLowerCase().includes('residential'))
      ).toBe(true);
    });

    it('should search by tags', async () => {
      const results = await importTemplateService.searchTemplates('irregular');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((t) => t.tags?.includes('irregular'))).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const lower = await importTemplateService.searchTemplates('rectangle');
      const upper = await importTemplateService.searchTemplates('RECTANGLE');
      const mixed = await importTemplateService.searchTemplates('ReCtAnGlE');

      expect(lower).toEqual(upper);
      expect(lower).toEqual(mixed);
    });

    it('should return empty array for non-matching query', async () => {
      const results = await importTemplateService.searchTemplates(
        'nonexistentquerystringxyz'
      );

      expect(results).toHaveLength(0);
    });

    it('should search across all templates (built-in and user)', async () => {
      await importTemplateService.saveTemplate({
        name: 'My Custom Square',
        dimensions: [
          { edgeIndex: 0, value: 25, unit: 'm' },
          { edgeIndex: 1, value: 25, unit: 'm' },
          { edgeIndex: 2, value: 25, unit: 'm' },
          { edgeIndex: 3, value: 25, unit: 'm' },
        ],
        area: 625,
        tags: ['square', 'custom'],
      });

      const results = await importTemplateService.searchTemplates('custom');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('My Custom Square');
    });
  });

  // ============================================================================
  // Save Template
  // ============================================================================

  describe('saveTemplate', () => {
    it('should save a new user template', async () => {
      const template = await importTemplateService.saveTemplate({
        name: 'Test Save',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 20, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: 150,
      });

      expect(template.id).toMatch(/^user-/);
      expect(template.name).toBe('Test Save');
      expect(template.edgeCount).toBe(3);
      expect(template.area).toBe(150);
      expect(template.category).toBe('user');
      expect(template.createdAt).toBeDefined();
      expect(template.updatedAt).toBeDefined();
    });

    it('should trim template name', async () => {
      const template = await importTemplateService.saveTemplate({
        name: '  Trimmed Name  ',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      expect(template.name).toBe('Trimmed Name');
    });

    it('should set default area unit to m²', async () => {
      const template = await importTemplateService.saveTemplate({
        name: 'Default Unit',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: 100,
      });

      expect(template.areaUnit).toBe('m²');
    });

    it('should accept custom area unit', async () => {
      const template = await importTemplateService.saveTemplate({
        name: 'Custom Unit',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'ft' },
          { edgeIndex: 1, value: 10, unit: 'ft' },
          { edgeIndex: 2, value: 10, unit: 'ft' },
        ],
        area: 100,
        areaUnit: 'ft²',
      });

      expect(template.areaUnit).toBe('ft²');
    });

    it('should handle optional description', async () => {
      const withDesc = await importTemplateService.saveTemplate({
        name: 'With Description',
        description: 'Test description',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      expect(withDesc.description).toBe('Test description');

      const withoutDesc = await importTemplateService.saveTemplate({
        name: 'Without Description',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      expect(withoutDesc.description).toBe('');
    });

    it('should handle tags', async () => {
      const template = await importTemplateService.saveTemplate({
        name: 'Tagged Template',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
        tags: ['custom', 'test', 'triangle'],
      });

      expect(template.tags).toEqual(['custom', 'test', 'triangle']);
    });

    it('should reject empty name', async () => {
      await expect(
        importTemplateService.saveTemplate({
          name: '',
          dimensions: [
            { edgeIndex: 0, value: 10, unit: 'm' },
            { edgeIndex: 1, value: 10, unit: 'm' },
            { edgeIndex: 2, value: 10, unit: 'm' },
          ],
          area: null,
        })
      ).rejects.toThrow(/template name is required/i);
    });

    it('should reject whitespace-only name', async () => {
      await expect(
        importTemplateService.saveTemplate({
          name: '   ',
          dimensions: [
            { edgeIndex: 0, value: 10, unit: 'm' },
            { edgeIndex: 1, value: 10, unit: 'm' },
            { edgeIndex: 2, value: 10, unit: 'm' },
          ],
          area: null,
        })
      ).rejects.toThrow(/template name is required/i);
    });

    it('should reject empty dimensions array', async () => {
      await expect(
        importTemplateService.saveTemplate({
          name: 'Empty Dimensions',
          dimensions: [],
          area: null,
        })
      ).rejects.toThrow(/must have at least one dimension/i);
    });

    it('should reject duplicate name (case-insensitive)', async () => {
      await importTemplateService.saveTemplate({
        name: 'Duplicate Name',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      await expect(
        importTemplateService.saveTemplate({
          name: 'DUPLICATE NAME',
          dimensions: [
            { edgeIndex: 0, value: 20, unit: 'm' },
            { edgeIndex: 1, value: 20, unit: 'm' },
            { edgeIndex: 2, value: 20, unit: 'm' },
          ],
          area: null,
        })
      ).rejects.toThrow(/already exists/i);
    });

    it('should persist to localStorage', async () => {
      await importTemplateService.saveTemplate({
        name: 'Persisted Template',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      const stored = localStorage.getItem('land-viz-import-templates');
      expect(stored).toBeDefined();

      const templates = JSON.parse(stored!);
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Persisted Template');
    });
  });

  // ============================================================================
  // Update Template
  // ============================================================================

  describe('updateTemplate', () => {
    it('should update template name', async () => {
      const saved = await importTemplateService.saveTemplate({
        name: 'Original Name',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      // Wait 10ms to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await importTemplateService.updateTemplate(saved.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe(saved.id);
      expect(updated.updatedAt).toBeGreaterThan(saved.updatedAt);
    });

    it('should update template dimensions', async () => {
      const saved = await importTemplateService.saveTemplate({
        name: 'Test Update',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      const newDimensions: DimensionInput[] = [
        { edgeIndex: 0, value: 20, unit: 'm' },
        { edgeIndex: 1, value: 20, unit: 'm' },
        { edgeIndex: 2, value: 20, unit: 'm' },
        { edgeIndex: 3, value: 20, unit: 'm' },
      ];

      const updated = await importTemplateService.updateTemplate(saved.id, {
        dimensions: newDimensions,
      });

      expect(updated.dimensions).toEqual(newDimensions);
      expect(updated.edgeCount).toBe(4); // Should auto-update
    });

    it('should update multiple fields at once', async () => {
      const saved = await importTemplateService.saveTemplate({
        name: 'Original',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: 100,
        tags: ['old'],
      });

      const updated = await importTemplateService.updateTemplate(saved.id, {
        name: 'Updated',
        description: 'New description',
        area: 200,
        tags: ['new', 'updated'],
      });

      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('New description');
      expect(updated.area).toBe(200);
      expect(updated.tags).toEqual(['new', 'updated']);
    });

    it('should reject update for non-existent template', async () => {
      await expect(
        importTemplateService.updateTemplate('non-existent-id', {
          name: 'New Name',
        })
      ).rejects.toThrow(/template not found/i);
    });

    it('should reject update for built-in template', async () => {
      // Built-in templates are not in user templates array, so throws "Template not found"
      await expect(
        importTemplateService.updateTemplate('built-in-rectangle-1', {
          name: 'Modified Built-in',
        })
      ).rejects.toThrow(/template not found/i);
    });
  });

  // ============================================================================
  // Delete Template
  // ============================================================================

  describe('deleteTemplate', () => {
    it('should delete user template', async () => {
      const saved = await importTemplateService.saveTemplate({
        name: 'To Delete',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      await importTemplateService.deleteTemplate(saved.id);

      const retrieved = await importTemplateService.getTemplate(saved.id);
      expect(retrieved).toBeNull();
    });

    it('should reject delete for non-existent template', async () => {
      await expect(
        importTemplateService.deleteTemplate('non-existent-id')
      ).rejects.toThrow(/template not found/i);
    });

    it('should reject delete for built-in template', async () => {
      // Built-in templates are not in user templates array, so throws "Template not found"
      await expect(
        importTemplateService.deleteTemplate('built-in-rectangle-1')
      ).rejects.toThrow(/template not found/i);
    });

    it('should remove template from localStorage', async () => {
      const saved = await importTemplateService.saveTemplate({
        name: 'To Delete',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      await importTemplateService.deleteTemplate(saved.id);

      const stored = localStorage.getItem('land-viz-import-templates');
      const templates = stored ? JSON.parse(stored) : [];
      expect(templates.find((t: SavedTemplate) => t.id === saved.id)).toBeUndefined();
    });
  });

  // ============================================================================
  // Duplicate Template
  // ============================================================================

  describe('duplicateTemplate', () => {
    it('should duplicate user template', async () => {
      const original = await importTemplateService.saveTemplate({
        name: 'Original',
        description: 'Original description',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: 100,
        tags: ['test'],
      });

      const duplicate = await importTemplateService.duplicateTemplate(original.id);

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.name).toBe('Original (Copy)');
      expect(duplicate.description).toBe(original.description);
      expect(duplicate.dimensions).toEqual(original.dimensions);
      expect(duplicate.area).toBe(original.area);
      expect(duplicate.tags).toEqual(original.tags);
      expect(duplicate.category).toBe('user');
    });

    it('should duplicate built-in template as user template', async () => {
      const duplicate = await importTemplateService.duplicateTemplate(
        'built-in-rectangle-1'
      );

      expect(duplicate.id).toMatch(/^user-/);
      expect(duplicate.name).toBe('Standard Rectangle (100m × 50m) (Copy)');
      expect(duplicate.category).toBe('user');
    });

    it('should reject duplicate for non-existent template', async () => {
      await expect(
        importTemplateService.duplicateTemplate('non-existent-id')
      ).rejects.toThrow(/template not found/i);
    });

    it('should create new timestamps', async () => {
      const original = await importTemplateService.saveTemplate({
        name: 'Original',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      // Wait 10ms to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const duplicate = await importTemplateService.duplicateTemplate(original.id);

      expect(duplicate.createdAt).toBeGreaterThan(original.createdAt);
      expect(duplicate.updatedAt).toBeGreaterThan(original.updatedAt);
    });
  });

  // ============================================================================
  // Export/Import Templates
  // ============================================================================

  describe('exportTemplates', () => {
    it('should export templates as JSON string', async () => {
      const template1 = await importTemplateService.saveTemplate({
        name: 'Export Test 1',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      const template2 = await importTemplateService.saveTemplate({
        name: 'Export Test 2',
        dimensions: [
          { edgeIndex: 0, value: 20, unit: 'm' },
          { edgeIndex: 1, value: 20, unit: 'm' },
          { edgeIndex: 2, value: 20, unit: 'm' },
        ],
        area: null,
      });

      const jsonString = await importTemplateService.exportTemplates([
        template1.id,
        template2.id,
      ]);

      expect(jsonString).toBeDefined();

      const parsed = JSON.parse(jsonString);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Export Test 1');
      expect(parsed[1].name).toBe('Export Test 2');
    });

    it('should export built-in templates', async () => {
      const jsonString = await importTemplateService.exportTemplates([
        'built-in-rectangle-1',
      ]);

      const parsed = JSON.parse(jsonString);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('built-in-rectangle-1');
    });

    it('should handle empty export list', async () => {
      const jsonString = await importTemplateService.exportTemplates([]);

      expect(jsonString).toBe('[]');
    });
  });

  describe('importTemplates', () => {
    it('should import templates from JSON', async () => {
      const jsonData = JSON.stringify([
        {
          id: 'import-test-1',
          name: 'Imported Template 1',
          description: 'Test import',
          edgeCount: 3,
          dimensions: [
            { edgeIndex: 0, value: 15, unit: 'm' },
            { edgeIndex: 1, value: 15, unit: 'm' },
            { edgeIndex: 2, value: 15, unit: 'm' },
          ],
          area: 97,
          areaUnit: 'm²',
          category: 'user',
          tags: ['imported'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      const imported = await importTemplateService.importTemplates(jsonData);

      expect(imported).toHaveLength(1);
      expect(imported[0].name).toBe('Imported Template 1');
      expect(imported[0].id).toMatch(/^user-/); // Should generate new ID
      expect(imported[0].category).toBe('user');
    });

    it('should generate new IDs for imported templates', async () => {
      const originalId = 'original-id-123';
      const jsonData = JSON.stringify([
        {
          id: originalId,
          name: 'Imported',
          edgeCount: 3,
          dimensions: [
            { edgeIndex: 0, value: 10, unit: 'm' },
            { edgeIndex: 1, value: 10, unit: 'm' },
            { edgeIndex: 2, value: 10, unit: 'm' },
          ],
          area: null,
          areaUnit: 'm²',
          category: 'user',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      const imported = await importTemplateService.importTemplates(jsonData);

      expect(imported[0].id).not.toBe(originalId);
      expect(imported[0].id).toMatch(/^user-/);
    });

    it('should import multiple templates', async () => {
      const jsonData = JSON.stringify([
        {
          id: '1',
          name: 'Import 1',
          edgeCount: 3,
          dimensions: [
            { edgeIndex: 0, value: 10, unit: 'm' },
            { edgeIndex: 1, value: 10, unit: 'm' },
            { edgeIndex: 2, value: 10, unit: 'm' },
          ],
          area: null,
          areaUnit: 'm²',
          category: 'user',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'Import 2',
          edgeCount: 4,
          dimensions: [
            { edgeIndex: 0, value: 20, unit: 'm' },
            { edgeIndex: 1, value: 20, unit: 'm' },
            { edgeIndex: 2, value: 20, unit: 'm' },
            { edgeIndex: 3, value: 20, unit: 'm' },
          ],
          area: null,
          areaUnit: 'm²',
          category: 'user',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      const imported = await importTemplateService.importTemplates(jsonData);

      expect(imported).toHaveLength(2);
    });

    it('should reject invalid JSON', async () => {
      await expect(
        importTemplateService.importTemplates('invalid json{')
      ).rejects.toThrow(/failed to import/i);
    });

    it('should reject non-array data', async () => {
      const jsonData = JSON.stringify({ name: 'Not an array' });

      await expect(
        importTemplateService.importTemplates(jsonData)
      ).rejects.toThrow(/must be an array/i);
    });
  });

  // ============================================================================
  // localStorage Persistence
  // ============================================================================

  describe('localStorage Persistence', () => {
    it('should persist templates across service instances', async () => {
      await importTemplateService.saveTemplate({
        name: 'Persistent',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      // Simulate service restart by getting templates again
      const templates = await importTemplateService.getAllTemplates();
      const userTemplates = templates.filter((t) => t.category === 'user');

      expect(userTemplates).toHaveLength(1);
      expect(userTemplates[0].name).toBe('Persistent');
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Corrupt the localStorage
      localStorage.setItem('land-viz-import-templates', 'corrupted{data');

      // Should not throw, just return built-in templates
      const templates = await importTemplateService.getAllTemplates();

      expect(templates).toHaveLength(5); // Only built-in templates
    });
  });

  // ============================================================================
  // Clear User Templates
  // ============================================================================

  describe('clearUserTemplates', () => {
    it('should clear all user templates', async () => {
      await importTemplateService.saveTemplate({
        name: 'Template 1',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
        area: null,
      });

      await importTemplateService.saveTemplate({
        name: 'Template 2',
        dimensions: [
          { edgeIndex: 0, value: 20, unit: 'm' },
          { edgeIndex: 1, value: 20, unit: 'm' },
          { edgeIndex: 2, value: 20, unit: 'm' },
        ],
        area: null,
      });

      await importTemplateService.clearUserTemplates();

      const templates = await importTemplateService.getAllTemplates();
      const userTemplates = templates.filter((t) => t.category === 'user');

      expect(userTemplates).toHaveLength(0);
      expect(templates).toHaveLength(5); // Only built-in templates remain
    });

    it('should not affect built-in templates', async () => {
      await importTemplateService.clearUserTemplates();

      const templates = await importTemplateService.getAllTemplates();

      expect(templates).toHaveLength(5);
      expect(templates.every((t) => t.category === 'built-in')).toBe(true);
    });
  });
});
