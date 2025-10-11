/**
 * Template System Type Definitions
 * Comprehensive types for template storage and management
 */

import type { Shape, Layer, UnitType } from './index';

/**
 * Template category classification
 */
export type TemplateCategory =
  | 'residential'
  | 'commercial'
  | 'agricultural'
  | 'industrial'
  | 'custom';

/**
 * Complete template data structure
 */
export interface PropertyTemplate {
  // Identity
  id: string;                      // UUID v4
  name: string;                    // Max 50 chars
  description: string;             // Max 200 chars, optional
  category: TemplateCategory;

  // Metadata
  author: 'built-in' | 'user';     // Source identifier
  createdAt: number;               // Unix timestamp
  updatedAt: number;               // Unix timestamp
  version: number;                 // Schema version (1)

  // Discovery
  tags: string[];                  // Max 5 tags
  thumbnail: string;               // Base64 PNG data URL
  usageCount: number;              // Times loaded
  isFavorite: boolean;             // User preference

  // Drawing state
  data: TemplateData;
}

/**
 * Captured drawing state
 */
export interface TemplateData {
  shapes: Shape[];                 // All shapes with full state
  layers: Layer[];                 // Layer configuration
  metadata: TemplateMetadata;
}

/**
 * Template configuration metadata
 */
export interface TemplateMetadata {
  defaultUnit: UnitType;           // Preferred measurement unit
  gridSize: number;                // Grid snap size (meters)
  gridEnabled: boolean;            // Grid visibility
  bounds: {
    width: number;                 // Template width (meters)
    height: number;                // Template height (meters)
  };
}

/**
 * Template creation input (from user)
 */
export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: TemplateCategory;
  tags?: string[];
}

/**
 * Template search/filter criteria
 */
export interface TemplateFilter {
  category?: TemplateCategory;
  searchQuery?: string;
  showBuiltIn?: boolean;
  showUserTemplates?: boolean;
  showFavorites?: boolean;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Template import/export format
 */
export interface TemplateExportFormat {
  version: '1.0';
  template: PropertyTemplate;
  exportedAt: number;
  exportedBy: string;
}
