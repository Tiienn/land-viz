import localforage from 'localforage';
import type { PropertyTemplate } from '../types/template';
import { logger } from '../utils/logger';

/**
 * Template Storage Service
 * Handles all IndexedDB operations with localStorage fallback
 */

class TemplateStorageService {
  private store: LocalForage;
  private readonly STORAGE_KEY = 'land-viz-templates';
  private readonly MAX_STORAGE_MB = 50;

  constructor() {
    // Initialize IndexedDB store
    this.store = localforage.createInstance({
      name: 'land-visualizer',
      storeName: 'templates',
      driver: [
        localforage.INDEXEDDB,
        localforage.LOCALSTORAGE,
      ],
      description: 'Template storage for Land Visualizer',
    });

    this.initializeStore();
  }

  /**
   * Initialize storage with built-in templates
   */
  private async initializeStore(): Promise<void> {
    try {
      const existingTemplates = await this.getAllTemplates();

      // If no templates exist, load built-ins
      if (existingTemplates.length === 0) {
        const { builtInTemplates } = await import('../data/builtInTemplates');

        for (const template of builtInTemplates) {
          await this.saveTemplate(template);
        }

        logger.info('[TemplateStorage] Initialized with built-in templates');
      }
    } catch (error) {
      logger.error('[TemplateStorage] Failed to initialize:', error);
    }
  }

  /**
   * Save or update a template
   */
  async saveTemplate(template: PropertyTemplate): Promise<void> {
    try {
      // Check storage quota
      await this.checkStorageQuota();

      // Update timestamp
      template.updatedAt = Date.now();

      // Save to IndexedDB
      await this.store.setItem(template.id, template);

      logger.info(`[TemplateStorage] Saved: ${template.name} (${template.id})`);
    } catch (error: any) {
      logger.error('[TemplateStorage] Failed to save:', error);
      throw new Error(`Template save failed: ${error.message}`);
    }
  }

  /**
   * Load a template by ID
   */
  async loadTemplate(id: string): Promise<PropertyTemplate | null> {
    try {
      const template = await this.store.getItem<PropertyTemplate>(id);

      if (!template) {
        logger.warn(`[TemplateStorage] Template not found: ${id}`);
        return null;
      }

      // Increment usage count
      template.usageCount++;
      await this.saveTemplate(template);

      return template;
    } catch (error) {
      logger.error('[TemplateStorage] Failed to load:', error);
      return null;
    }
  }

  /**
   * Get all templates
   */
  async getAllTemplates(): Promise<PropertyTemplate[]> {
    try {
      const templates: PropertyTemplate[] = [];

      await this.store.iterate<PropertyTemplate, void>((value) => {
        templates.push(value);
      });

      // Sort by category, then by name
      return templates.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      logger.error('[TemplateStorage] Failed to get templates:', error);
      return [];
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const template = await this.store.getItem<PropertyTemplate>(id);

      if (!template) {
        throw new Error('Template not found');
      }

      if (template.author === 'built-in') {
        throw new Error('Cannot delete built-in templates');
      }

      await this.store.removeItem(id);
      logger.info(`[TemplateStorage] Deleted: ${id}`);
    } catch (error: any) {
      logger.error('[TemplateStorage] Failed to delete:', error);
      throw error;
    }
  }

  /**
   * Update template metadata only
   */
  async updateTemplateMetadata(
    id: string,
    updates: Partial<Pick<PropertyTemplate, 'name' | 'description' | 'category' | 'tags' | 'isFavorite'>>
  ): Promise<void> {
    try {
      const template = await this.loadTemplate(id);

      if (!template) {
        throw new Error('Template not found');
      }

      Object.assign(template, updates);
      template.updatedAt = Date.now();

      await this.saveTemplate(template);
    } catch (error: any) {
      logger.error('[TemplateStorage] Failed to update metadata:', error);
      throw error;
    }
  }

  /**
   * Export template as JSON
   */
  exportTemplate(template: PropertyTemplate): void {
    const exportData = {
      version: '1.0' as const,
      template,
      exportedAt: Date.now(),
      exportedBy: 'Land Visualizer',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Import template from JSON file
   */
  async importTemplate(file: File): Promise<PropertyTemplate> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          // Validate format
          if (data.version !== '1.0' || !data.template) {
            throw new Error('Invalid template file format');
          }

          const template: PropertyTemplate = data.template;

          // Assign new ID to avoid conflicts
          template.id = crypto.randomUUID();
          template.author = 'user';
          template.createdAt = Date.now();
          template.updatedAt = Date.now();
          template.usageCount = 0;

          await this.saveTemplate(template);
          resolve(template);
        } catch (error: any) {
          reject(new Error(`Failed to import template: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Check storage quota and throw if exceeded
   */
  private async checkStorageQuota(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usageInMB = (estimate.usage || 0) / (1024 * 1024);

      if (usageInMB > this.MAX_STORAGE_MB) {
        throw new Error(
          `Storage quota exceeded (${usageInMB.toFixed(2)}MB / ${this.MAX_STORAGE_MB}MB). Please delete old templates.`
        );
      }
    }
  }

  /**
   * Clear all user templates (keep built-in)
   */
  async clearUserTemplates(): Promise<void> {
    const templates = await this.getAllTemplates();

    for (const template of templates) {
      if (template.author === 'user') {
        await this.deleteTemplate(template.id);
      }
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalTemplates: number;
    builtInCount: number;
    userCount: number;
    estimatedSizeMB: number;
  }> {
    const templates = await this.getAllTemplates();
    const builtInCount = templates.filter((t) => t.author === 'built-in').length;
    const userCount = templates.filter((t) => t.author === 'user').length;

    let estimatedSizeMB = 0;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      estimatedSizeMB = (estimate.usage || 0) / (1024 * 1024);
    }

    return {
      totalTemplates: templates.length,
      builtInCount,
      userCount,
      estimatedSizeMB,
    };
  }
}

// Export singleton instance
export const templateStorage = new TemplateStorageService();
