import type { PropertyTemplate, TemplateValidationResult } from '../types/template';

/**
 * Template Validator Service
 * Validates template data integrity and structure
 */

/**
 * Validate a complete template
 */
export function validateTemplate(template: PropertyTemplate): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (template.name && template.name.length > 50) {
    errors.push('Template name must be 50 characters or less');
  }

  if (template.description && template.description.length > 200) {
    errors.push('Template description must be 200 characters or less');
  }

  // Category validation
  const validCategories = ['residential', 'commercial', 'agricultural', 'industrial', 'custom'];
  if (!validCategories.includes(template.category)) {
    errors.push(`Invalid category: ${template.category}`);
  }

  // Tags validation
  if (template.tags && template.tags.length > 5) {
    warnings.push('Template has more than 5 tags - only first 5 will be used');
  }

  // Shapes validation
  if (!template.data || !template.data.shapes) {
    errors.push('Template must have shapes data');
  } else if (template.data.shapes.length === 0) {
    errors.push('Template must contain at least 1 shape');
  }

  // Layers validation
  if (!template.data || !template.data.layers) {
    errors.push('Template must have layers data');
  } else if (template.data.layers.length === 0) {
    errors.push('Template must contain at least 1 layer');
  }

  // Metadata validation
  if (!template.data || !template.data.metadata) {
    errors.push('Template must have metadata');
  } else {
    const metadata = template.data.metadata;

    if (!metadata.defaultUnit) {
      errors.push('Template metadata must include defaultUnit');
    }

    if (typeof metadata.gridSize !== 'number' || metadata.gridSize <= 0) {
      errors.push('Template metadata must have valid gridSize > 0');
    }

    if (!metadata.bounds || !metadata.bounds.width || !metadata.bounds.height) {
      errors.push('Template metadata must have valid bounds (width, height)');
    }
  }

  // Thumbnail size check
  if (template.thumbnail && template.thumbnail.length > 500000) {
    warnings.push('Thumbnail is large (>500KB) - may affect performance');
  }

  // Author validation
  if (template.author !== 'built-in' && template.author !== 'user') {
    errors.push('Invalid author - must be "built-in" or "user"');
  }

  // Version validation
  if (typeof template.version !== 'number' || template.version < 1) {
    errors.push('Invalid version - must be a number >= 1');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate template name
 */
export function validateTemplateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Template name is required' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Template name must be 50 characters or less' };
  }

  return { valid: true };
}

/**
 * Validate template description
 */
export function validateTemplateDescription(description: string): { valid: boolean; error?: string } {
  if (description.length > 200) {
    return { valid: false, error: 'Description must be 200 characters or less' };
  }

  return { valid: true };
}

/**
 * Validate template tags
 */
export function validateTemplateTags(tags: string[]): { valid: boolean; error?: string } {
  if (tags.length > 5) {
    return { valid: false, error: 'Maximum 5 tags allowed' };
  }

  const invalidTags = tags.filter(tag => tag.length === 0 || tag.length > 20);
  if (invalidTags.length > 0) {
    return { valid: false, error: 'Each tag must be between 1 and 20 characters' };
  }

  return { valid: true };
}

/**
 * Check if template import data is valid
 */
export function validateImportData(data: any): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: 'No data provided' };
  }

  if (data.version !== '1.0') {
    return { valid: false, error: 'Unsupported template version' };
  }

  if (!data.template) {
    return { valid: false, error: 'Missing template data' };
  }

  const validation = validateTemplate(data.template);
  if (!validation.valid) {
    return {
      valid: false,
      error: `Invalid template: ${validation.errors.join(', ')}`
    };
  }

  return { valid: true };
}
