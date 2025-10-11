/**
 * Import Template Service
 *
 * Manages saved dimension templates for the hybrid image import feature.
 * These templates are simpler than the main template system - they only store
 * edge dimensions, areas, and edge counts for common parcel shapes.
 *
 * FEATURES:
 * - Save dimension sets as reusable templates
 * - Load templates to pre-fill manual entry form
 * - Built-in templates for common shapes (Rectangle, L-Shape, Triangle)
 * - CRUD operations with localStorage persistence
 * - Template categories and tags
 *
 * @example
 * ```typescript
 * // Save current dimensions as template
 * await importTemplateService.saveTemplate({
 *   name: 'My 100x50 Lot',
 *   dimensions: [...],
 *   area: 5000,
 * });
 *
 * // Load template
 * const template = await importTemplateService.getTemplate('template-id');
 * ```
 */

import { logger } from '../../utils/logger';
import type { SavedTemplate, DimensionInput } from '../../types/imageImport';

const STORAGE_KEY = 'land-viz-import-templates';

/**
 * Built-in templates for common parcel shapes
 */
const BUILT_IN_TEMPLATES: SavedTemplate[] = [
  {
    id: 'built-in-rectangle-1',
    name: 'Standard Rectangle (100m × 50m)',
    description: 'Common residential lot dimensions',
    edgeCount: 4,
    dimensions: [
      { edgeIndex: 0, value: 100, unit: 'm' },
      { edgeIndex: 1, value: 50, unit: 'm' },
      { edgeIndex: 2, value: 100, unit: 'm' },
      { edgeIndex: 3, value: 50, unit: 'm' },
    ],
    area: 5000,
    areaUnit: 'm²',
    category: 'built-in',
    tags: ['rectangle', 'residential', 'standard'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'built-in-rectangle-2',
    name: 'Wide Lot (150m × 40m)',
    description: 'Wider residential lot',
    edgeCount: 4,
    dimensions: [
      { edgeIndex: 0, value: 150, unit: 'm' },
      { edgeIndex: 1, value: 40, unit: 'm' },
      { edgeIndex: 2, value: 150, unit: 'm' },
      { edgeIndex: 3, value: 40, unit: 'm' },
    ],
    area: 6000,
    areaUnit: 'm²',
    category: 'built-in',
    tags: ['rectangle', 'residential', 'wide'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'built-in-triangle-1',
    name: 'Triangle (50m × 40m × 30m)',
    description: 'Triangular corner lot',
    edgeCount: 3,
    dimensions: [
      { edgeIndex: 0, value: 50, unit: 'm' },
      { edgeIndex: 1, value: 40, unit: 'm' },
      { edgeIndex: 2, value: 30, unit: 'm' },
    ],
    area: 600,
    areaUnit: 'm²',
    category: 'built-in',
    tags: ['triangle', 'corner', 'irregular'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'built-in-pentagon-1',
    name: 'Pentagon (40m sides)',
    description: 'Regular pentagon lot',
    edgeCount: 5,
    dimensions: [
      { edgeIndex: 0, value: 40, unit: 'm' },
      { edgeIndex: 1, value: 40, unit: 'm' },
      { edgeIndex: 2, value: 40, unit: 'm' },
      { edgeIndex: 3, value: 40, unit: 'm' },
      { edgeIndex: 4, value: 40, unit: 'm' },
    ],
    area: 2752,
    areaUnit: 'm²',
    category: 'built-in',
    tags: ['pentagon', 'regular', 'unique'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'built-in-l-shape-1',
    name: 'L-Shape (100m, 50m, 60m, 30m, 40m, 20m)',
    description: 'Common L-shaped lot',
    edgeCount: 6,
    dimensions: [
      { edgeIndex: 0, value: 100, unit: 'm' },
      { edgeIndex: 1, value: 50, unit: 'm' },
      { edgeIndex: 2, value: 60, unit: 'm' },
      { edgeIndex: 3, value: 30, unit: 'm' },
      { edgeIndex: 4, value: 40, unit: 'm' },
      { edgeIndex: 5, value: 20, unit: 'm' },
    ],
    area: 3800,
    areaUnit: 'm²',
    category: 'built-in',
    tags: ['l-shape', 'irregular', 'commercial'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * Template creation input
 */
export interface CreateImportTemplateInput {
  name: string;
  description?: string;
  dimensions: DimensionInput[];
  area: number | null;
  areaUnit?: 'm²' | 'ft²' | 'yd²';
  tags?: string[];
}

class ImportTemplateService {
  /**
   * Get all templates (built-in + user-created)
   */
  async getAllTemplates(): Promise<SavedTemplate[]> {
    const userTemplates = this.loadUserTemplates();
    return [...BUILT_IN_TEMPLATES, ...userTemplates];
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<SavedTemplate | null> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.find((t) => t.id === id) || null;
  }

  /**
   * Get templates filtered by edge count
   */
  async getTemplatesByEdgeCount(edgeCount: number): Promise<SavedTemplate[]> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.filter((t) => t.edgeCount === edgeCount);
  }

  /**
   * Get templates filtered by category
   */
  async getTemplatesByCategory(
    category: 'built-in' | 'user'
  ): Promise<SavedTemplate[]> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.filter((t) => t.category === category);
  }

  /**
   * Search templates by name or tags
   */
  async searchTemplates(query: string): Promise<SavedTemplate[]> {
    const allTemplates = await this.getAllTemplates();
    const lowerQuery = query.toLowerCase();

    return allTemplates.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(lowerQuery);
      const descMatch = t.description?.toLowerCase().includes(lowerQuery);
      const tagMatch = t.tags?.some((tag) =>
        tag.toLowerCase().includes(lowerQuery)
      );

      return nameMatch || descMatch || tagMatch;
    });
  }

  /**
   * Save a new template
   */
  async saveTemplate(input: CreateImportTemplateInput): Promise<SavedTemplate> {
    // Validate input
    if (!input.name.trim()) {
      throw new Error('Template name is required');
    }

    if (input.dimensions.length === 0) {
      throw new Error('Template must have at least one dimension');
    }

    // Check for duplicate name
    const userTemplates = this.loadUserTemplates();
    const nameExists = userTemplates.some(
      (t) => t.name.toLowerCase() === input.name.toLowerCase()
    );

    if (nameExists) {
      throw new Error(
        `A template named "${input.name}" already exists. Please choose a different name.`
      );
    }

    // Create template object
    const template: SavedTemplate = {
      id: `user-${crypto.randomUUID()}`,
      name: input.name.trim(),
      description: input.description?.trim() || '',
      edgeCount: input.dimensions.length,
      dimensions: input.dimensions,
      area: input.area,
      areaUnit: input.areaUnit || 'm²',
      category: 'user',
      tags: input.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save to localStorage
    userTemplates.push(template);
    this.saveUserTemplates(userTemplates);

    logger.info(`[ImportTemplateService] Saved template: ${template.name}`);
    return template;
  }

  /**
   * Update an existing user template
   */
  async updateTemplate(
    id: string,
    updates: Partial<CreateImportTemplateInput>
  ): Promise<SavedTemplate> {
    const userTemplates = this.loadUserTemplates();
    const index = userTemplates.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error('Template not found');
    }

    const template = userTemplates[index];

    // Cannot update built-in templates
    if (template.category === 'built-in') {
      throw new Error('Cannot update built-in templates');
    }

    // Apply updates
    if (updates.name !== undefined) template.name = updates.name.trim();
    if (updates.description !== undefined)
      template.description = updates.description.trim();
    if (updates.dimensions !== undefined) {
      template.dimensions = updates.dimensions;
      template.edgeCount = updates.dimensions.length;
    }
    if (updates.area !== undefined) template.area = updates.area;
    if (updates.areaUnit !== undefined) template.areaUnit = updates.areaUnit;
    if (updates.tags !== undefined) template.tags = updates.tags;

    template.updatedAt = Date.now();

    // Save to localStorage
    userTemplates[index] = template;
    this.saveUserTemplates(userTemplates);

    logger.info(`[ImportTemplateService] Updated template: ${template.name}`);
    return template;
  }

  /**
   * Delete a user template
   */
  async deleteTemplate(id: string): Promise<void> {
    const userTemplates = this.loadUserTemplates();
    const template = userTemplates.find((t) => t.id === id);

    if (!template) {
      throw new Error('Template not found');
    }

    // Cannot delete built-in templates
    if (template.category === 'built-in') {
      throw new Error('Cannot delete built-in templates');
    }

    // Remove from array
    const filtered = userTemplates.filter((t) => t.id !== id);
    this.saveUserTemplates(filtered);

    logger.info(`[ImportTemplateService] Deleted template: ${template.name}`);
  }

  /**
   * Duplicate a template (creates a user copy)
   */
  async duplicateTemplate(id: string): Promise<SavedTemplate> {
    const template = await this.getTemplate(id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create new template with copied data
    const newTemplate: SavedTemplate = {
      ...template,
      id: `user-${crypto.randomUUID()}`,
      name: `${template.name} (Copy)`,
      category: 'user',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save to localStorage
    const userTemplates = this.loadUserTemplates();
    userTemplates.push(newTemplate);
    this.saveUserTemplates(userTemplates);

    logger.info(
      `[ImportTemplateService] Duplicated template: ${newTemplate.name}`
    );
    return newTemplate;
  }

  /**
   * Export templates as JSON
   */
  async exportTemplates(ids: string[]): Promise<string> {
    const allTemplates = await this.getAllTemplates();
    const templates = allTemplates.filter((t) => ids.includes(t.id));

    return JSON.stringify(templates, null, 2);
  }

  /**
   * Import templates from JSON
   */
  async importTemplates(jsonString: string): Promise<SavedTemplate[]> {
    try {
      const imported = JSON.parse(jsonString) as SavedTemplate[];

      if (!Array.isArray(imported)) {
        throw new Error('Invalid template data: must be an array');
      }

      const userTemplates = this.loadUserTemplates();
      const newTemplates: SavedTemplate[] = [];

      imported.forEach((template) => {
        // Generate new ID
        const newTemplate: SavedTemplate = {
          ...template,
          id: `user-${crypto.randomUUID()}`,
          category: 'user',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        userTemplates.push(newTemplate);
        newTemplates.push(newTemplate);
      });

      this.saveUserTemplates(userTemplates);

      logger.info(
        `[ImportTemplateService] Imported ${newTemplates.length} templates`
      );
      return newTemplates;
    } catch (error) {
      throw new Error(`Failed to import templates: ${error}`);
    }
  }

  /**
   * Load user templates from localStorage
   */
  private loadUserTemplates(): SavedTemplate[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const templates = JSON.parse(stored) as SavedTemplate[];
      return Array.isArray(templates) ? templates : [];
    } catch (error) {
      logger.error('[ImportTemplateService] Failed to load templates:', error);
      return [];
    }
  }

  /**
   * Save user templates to localStorage
   */
  private saveUserTemplates(templates: SavedTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      logger.error('[ImportTemplateService] Failed to save templates:', error);
      throw new Error('Failed to save template to storage');
    }
  }

  /**
   * Clear all user templates (for testing)
   */
  async clearUserTemplates(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    logger.info('[ImportTemplateService] Cleared all user templates');
  }
}

// Export singleton instance
export const importTemplateService = new ImportTemplateService();
