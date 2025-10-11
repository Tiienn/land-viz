import type { PropertyTemplate, CreateTemplateInput } from '../types/template';
import { templateStorage } from './templateStorage';
import { thumbnailGenerator } from './thumbnailGenerator';
import { validateTemplate } from './templateValidator';
import { useAppStore } from '../store/useAppStore';
import { useLayerStore } from '../store/useLayerStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { logger } from '../utils/logger';

/**
 * Template Service
 * Business logic layer for template operations
 */

class TemplateService {
  /**
   * Save current drawing as a template
   */
  async saveTemplate(input: CreateTemplateInput): Promise<PropertyTemplate> {
    // Get current drawing state from stores
    const shapes = useAppStore.getState().shapes;
    const layers = useLayerStore.getState().layers;
    const gridSize = useAppStore.getState().drawing.gridSize;
    const snapToGrid = useAppStore.getState().drawing.snapToGrid;

    // Generate thumbnail
    const thumbnail = thumbnailGenerator.generateFromShapes(shapes);

    // Create template object
    const template: PropertyTemplate = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description || '',
      category: input.category,
      author: 'user',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      tags: input.tags || [],
      thumbnail,
      usageCount: 0,
      isFavorite: false,
      data: {
        shapes: shapes.map(shape => ({
          ...shape,
          // Ensure dates are properly serialized
          created: shape.created,
          modified: shape.modified,
        })),
        layers: layers.map(layer => ({
          ...layer,
          // Ensure dates are properly serialized
          created: layer.created,
          modified: layer.modified,
        })),
        metadata: {
          defaultUnit: 'metric',
          gridSize,
          gridEnabled: snapToGrid,
          bounds: this.calculateBounds(shapes),
        },
      },
    };

    // Validate template
    const validation = validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // Save to storage
    await templateStorage.saveTemplate(template);

    // Reload templates in store
    await useTemplateStore.getState().loadAllTemplates();

    return template;
  }

  /**
   * Load a template into the scene
   */
  async loadTemplate(id: string): Promise<void> {
    // Check for unsaved changes
    const currentShapes = useAppStore.getState().shapes;
    if (currentShapes.length > 0) {
      const confirmed = window.confirm(
        'You have unsaved changes. Loading a template will discard them. Continue?'
      );
      if (!confirmed) {
        return;
      }
    }

    // Load template from storage
    const template = await templateStorage.loadTemplate(id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Clear current drawing
    useAppStore.getState().clearShapes();

    // Load shapes
    useAppStore.setState({ shapes: template.data.shapes });

    // Load layers
    useLayerStore.setState({ layers: template.data.layers });

    // Apply metadata
    useAppStore.setState({
      drawing: {
        ...useAppStore.getState().drawing,
        gridSize: template.data.metadata.gridSize,
        snapToGrid: template.data.metadata.gridEnabled,
      },
    });

    // Add to undo history
    // Note: This will be handled automatically by the store's middleware

    logger.info(`[TemplateService] Loaded: ${template.name}`);
  }

  /**
   * Duplicate an existing template
   */
  async duplicateTemplate(id: string): Promise<PropertyTemplate> {
    const template = await templateStorage.loadTemplate(id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create new template with copied data
    const newTemplate: PropertyTemplate = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
      author: 'user',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    };

    // Save duplicate
    await templateStorage.saveTemplate(newTemplate);

    // Reload templates
    await useTemplateStore.getState().loadAllTemplates();

    return newTemplate;
  }

  /**
   * Update an existing template with current drawing
   */
  async updateTemplate(id: string): Promise<void> {
    const template = await templateStorage.loadTemplate(id);
    if (!template) {
      throw new Error('Template not found');
    }

    if (template.author === 'built-in') {
      throw new Error('Cannot update built-in templates');
    }

    // Get current drawing state
    const shapes = useAppStore.getState().shapes;
    const layers = useLayerStore.getState().layers;
    const gridSize = useAppStore.getState().drawing.gridSize;
    const snapToGrid = useAppStore.getState().drawing.snapToGrid;

    // Regenerate thumbnail
    const thumbnail = thumbnailGenerator.generateFromShapes(shapes);

    // Update template data
    template.data = {
      shapes,
      layers,
      metadata: {
        defaultUnit: 'metric',
        gridSize,
        gridEnabled: snapToGrid,
        bounds: this.calculateBounds(shapes),
      },
    };
    template.thumbnail = thumbnail;
    template.updatedAt = Date.now();

    // Save updated template
    await templateStorage.saveTemplate(template);

    // Reload templates
    await useTemplateStore.getState().loadAllTemplates();
  }

  /**
   * Calculate bounding box of shapes
   */
  private calculateBounds(shapes: any[]): { width: number; height: number } {
    if (shapes.length === 0) {
      return { width: 100, height: 100 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    shapes.forEach((shape) => {
      shape.points.forEach((p: any) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    });

    return {
      width: Math.ceil(maxX - minX) + 20, // Add padding
      height: Math.ceil(maxY - minY) + 20,
    };
  }
}

// Export singleton instance
export const templateService = new TemplateService();
