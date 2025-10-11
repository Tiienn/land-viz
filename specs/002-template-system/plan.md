# Implementation Plan: Template System
**Spec ID:** 002
**Plan Version:** 1.0
**Created:** October 2025
**Status:** Ready for Implementation

---

## 1. Technical Architecture

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Toolbar      │  │ Template     │  │ Save Template│          │
│  │ Button       │─▶│ Gallery      │◀─│ Dialog       │          │
│  └──────────────┘  │ Modal        │  └──────────────┘          │
│                     └───────┬──────┘                             │
└─────────────────────────────┼────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                      Business Logic Layer                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TemplateService (Orchestration)                          │   │
│  │  - saveTemplate()                                        │   │
│  │  - loadTemplate()                                        │   │
│  │  - deleteTemplate()                                      │   │
│  │  - importTemplate() / exportTemplate()                  │   │
│  └─────────┬────────────────────────────────┬───────────────┘   │
│            │                                │                    │
│  ┌─────────▼──────────┐          ┌─────────▼──────────┐        │
│  │ ThumbnailGenerator │          │ TemplateValidator  │        │
│  │ (Canvas 2D API)    │          │ (Schema Validation)│        │
│  └────────────────────┘          └────────────────────┘        │
└──────────────────────────────────────┬─────────────────────────┘
                                       │
┌──────────────────────────────────────▼─────────────────────────┐
│                     Storage Layer                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ TemplateStorageService (Abstraction)                     │  │
│  │  - save() / load() / delete() / getAll()                │  │
│  └─────────┬──────────────────────────────┬─────────────────┘  │
│            │                              │                     │
│  ┌─────────▼────────┐          ┌─────────▼────────┐           │
│  │ IndexedDB        │          │ localStorage     │           │
│  │ (Primary)        │          │ (Fallback)       │           │
│  └──────────────────┘          └──────────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Hierarchy

```
App.tsx
├── Toolbar.tsx
│   └── TemplateButton.tsx (NEW)
│
├── TemplateGalleryModal.tsx (NEW)
│   ├── TemplateGalleryHeader.tsx (NEW)
│   │   ├── SearchBar.tsx (NEW)
│   │   └── CategoryTabs.tsx (NEW)
│   │
│   ├── TemplateGrid.tsx (NEW)
│   │   └── TemplateCard.tsx (NEW)
│   │       ├── TemplateThumbnail.tsx (NEW)
│   │       ├── TemplateInfo.tsx (NEW)
│   │       └── TemplateActions.tsx (NEW)
│   │
│   └── TemplateGalleryFooter.tsx (NEW)
│       └── CreateTemplateButton.tsx (NEW)
│
└── SaveTemplateDialog.tsx (NEW)
    ├── TemplateFormFields.tsx (NEW)
    └── ThumbnailPreview.tsx (NEW)
```

### 1.3 Data Flow

**Template Creation Flow:**
```
User clicks "Save as Template"
  ↓
SaveTemplateDialog opens
  ↓
User fills form (name, description, category, tags)
  ↓
ThumbnailGenerator captures canvas snapshot
  ↓
TemplateService.saveTemplate()
  ↓
TemplateValidator validates structure
  ↓
TemplateStorageService.save()
  ↓
IndexedDB persists template
  ↓
Update Zustand store (templateStore)
  ↓
UI refreshes showing new template
```

**Template Loading Flow:**
```
User clicks template card
  ↓
Check for unsaved changes → Confirmation dialog
  ↓
TemplateService.loadTemplate(id)
  ↓
TemplateStorageService.load(id)
  ↓
IndexedDB retrieves template
  ↓
TemplateValidator validates data
  ↓
Load shapes into drawingStore
  ↓
Load layers into layerStore
  ↓
Apply metadata (grid, units)
  ↓
Add to undo history
  ↓
Update usageCount
  ↓
SceneManager re-renders
```

---

## 2. File Structure

### 2.1 New Files to Create

```
app/src/
├── components/
│   ├── TemplateGallery/
│   │   ├── TemplateGalleryModal.tsx       # Main modal component
│   │   ├── TemplateGalleryHeader.tsx      # Search + tabs
│   │   ├── TemplateGrid.tsx               # Grid layout
│   │   ├── TemplateCard.tsx               # Individual card
│   │   ├── TemplateThumbnail.tsx          # Image preview
│   │   ├── TemplateContextMenu.tsx        # Right-click menu
│   │   ├── SaveTemplateDialog.tsx         # Save form
│   │   └── index.ts                        # Exports
│   │
│   └── Toolbar/
│       └── TemplateButton.tsx              # Toolbar integration
│
├── services/
│   ├── templateStorage.ts                  # Storage abstraction
│   ├── templateService.ts                  # Business logic
│   ├── thumbnailGenerator.ts               # Canvas rendering
│   └── templateValidator.ts                # Schema validation
│
├── store/
│   └── useTemplateStore.ts                 # Template state management
│
├── types/
│   └── template.ts                         # TypeScript interfaces
│
├── data/
│   └── builtInTemplates.ts                 # 5 built-in templates
│
└── utils/
    └── templateUtils.ts                    # Helper functions
```

### 2.2 Files to Modify

```
app/src/
├── App.tsx
│   └── Add TemplateGalleryModal integration
│
├── components/Toolbar/Toolbar.tsx
│   └── Add Template button
│
├── hooks/
│   └── useKeyboardShortcuts.ts
│       └── Add Ctrl+Shift+T shortcut
│
└── types/index.ts
    └── Export template types
```

---

## 3. Detailed Implementation

### 3.1 Type Definitions

**File:** `app/src/types/template.ts`

```typescript
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
```

### 3.2 Built-in Templates

**File:** `app/src/data/builtInTemplates.ts`

```typescript
import type { PropertyTemplate, TemplateCategory } from '../types/template';
import { v4 as uuidv4 } from 'uuid';

/**
 * Built-in template definitions
 * These templates are pre-loaded and cannot be deleted
 */

const createBuiltInTemplate = (
  name: string,
  description: string,
  category: TemplateCategory,
  tags: string[],
  shapes: any[],
  width: number,
  height: number
): PropertyTemplate => ({
  id: uuidv4(),
  name,
  description,
  category,
  author: 'built-in',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
  tags,
  thumbnail: '', // Generated on first render
  usageCount: 0,
  isFavorite: false,
  data: {
    shapes,
    layers: [
      {
        id: 'main',
        name: 'Main Layer',
        visible: true,
        locked: false,
        color: '#3B82F6',
        order: 0,
      },
    ],
    metadata: {
      defaultUnit: 'meters',
      gridSize: 1,
      gridEnabled: true,
      bounds: { width, height },
    },
  },
});

/**
 * 1. Residential Standard Lot (25m × 40m)
 */
export const residentialStandardTemplate = createBuiltInTemplate(
  'Residential Standard Lot',
  'Typical single-family home lot with standard dimensions',
  'residential',
  ['residential', 'standard', 'house', 'lot'],
  [
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -12.5, y: -20, z: 0 },
        { x: 12.5, y: -20, z: 0 },
        { x: 12.5, y: 20, z: 0 },
        { x: -12.5, y: 20, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
  ],
  25,
  40
);

/**
 * 2. Corner Lot with Setbacks (30m × 35m)
 */
export const cornerLotTemplate = createBuiltInTemplate(
  'Corner Lot with Setbacks',
  'L-shaped corner lot with building setback lines',
  'residential',
  ['corner', 'setback', 'residential', 'L-shape'],
  [
    // Lot boundary
    {
      id: uuidv4(),
      type: 'polyline',
      layerId: 'main',
      points: [
        { x: -15, y: -17.5, z: 0 },
        { x: 15, y: -17.5, z: 0 },
        { x: 15, y: 17.5, z: 0 },
        { x: 5, y: 17.5, z: 0 },
        { x: 5, y: 5, z: 0 },
        { x: -15, y: 5, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
    // Setback line (inner)
    {
      id: uuidv4(),
      type: 'polyline',
      layerId: 'main',
      points: [
        { x: -12, y: -14.5, z: 0 },
        { x: 12, y: -14.5, z: 0 },
        { x: 12, y: 14.5, z: 0 },
        { x: 2, y: 14.5, z: 0 },
        { x: 2, y: 2, z: 0 },
        { x: -12, y: 2, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
  ],
  30,
  35
);

/**
 * 3. Commercial Parking Layout (50m × 80m)
 */
export const commercialParkingTemplate = createBuiltInTemplate(
  'Commercial Parking Layout',
  'Retail store with parking lot layout',
  'commercial',
  ['commercial', 'parking', 'retail', 'store'],
  [
    // Building footprint
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -15, y: 25, z: 0 },
        { x: 15, y: 25, z: 0 },
        { x: 15, y: 40, z: 0 },
        { x: -15, y: 40, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
    // Parking spaces (simplified - 3 rows)
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -20, y: -5, z: 0 },
        { x: -15, y: -5, z: 0 },
        { x: -15, y: 3, z: 0 },
        { x: -20, y: 3, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -10, y: -5, z: 0 },
        { x: -5, y: -5, z: 0 },
        { x: -5, y: 3, z: 0 },
        { x: -10, y: 3, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
    // ... more parking spaces (total ~20)
  ],
  50,
  80
);

/**
 * 4. Farm Property (200m × 300m)
 */
export const farmPropertyTemplate = createBuiltInTemplate(
  'Farm Property',
  'Large agricultural plot with building areas',
  'agricultural',
  ['farm', 'agriculture', 'barn', 'field'],
  [
    // Property boundary
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -100, y: -150, z: 0 },
        { x: 100, y: -150, z: 0 },
        { x: 100, y: 150, z: 0 },
        { x: -100, y: 150, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
    // Farmhouse
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -80, y: 120, z: 0 },
        { x: -60, y: 120, z: 0 },
        { x: -60, y: 140, z: 0 },
        { x: -80, y: 140, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
    // Barn
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: 60, y: 100, z: 0 },
        { x: 85, y: 100, z: 0 },
        { x: 85, y: 130, z: 0 },
        { x: 60, y: 130, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
  ],
  200,
  300
);

/**
 * 5. Subdivision Block (100m × 150m)
 */
export const subdivisionBlockTemplate = createBuiltInTemplate(
  'Subdivision Block',
  '6-lot subdivision with shared access road',
  'residential',
  ['subdivision', 'lots', 'development', 'road'],
  [
    // Outer boundary
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -50, y: -75, z: 0 },
        { x: 50, y: -75, z: 0 },
        { x: 50, y: 75, z: 0 },
        { x: -50, y: 75, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
    // Access road (center)
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -5, y: -75, z: 0 },
        { x: 5, y: -75, z: 0 },
        { x: 5, y: 75, z: 0 },
        { x: -5, y: 75, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
    // Left lots (3 lots)
    {
      id: uuidv4(),
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -50, y: -75, z: 0 },
        { x: -5, y: -75, z: 0 },
        { x: -5, y: -25, z: 0 },
        { x: -50, y: -25, z: 0 },
      ],
      rotation: 0,
      isTemporary: false,
    },
    // ... more lots (total 6)
  ],
  100,
  150
);

/**
 * Export all built-in templates
 */
export const builtInTemplates: PropertyTemplate[] = [
  residentialStandardTemplate,
  cornerLotTemplate,
  commercialParkingTemplate,
  farmPropertyTemplate,
  subdivisionBlockTemplate,
];

/**
 * Get built-in template by category
 */
export const getBuiltInTemplatesByCategory = (
  category: TemplateCategory
): PropertyTemplate[] => {
  return builtInTemplates.filter((t) => t.category === category);
};
```

### 3.3 Storage Service

**File:** `app/src/services/templateStorage.ts`

```typescript
import localforage from 'localforage';
import type { PropertyTemplate } from '../types/template';

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

        console.log('Initialized template storage with built-in templates');
      }
    } catch (error) {
      console.error('Failed to initialize template storage:', error);
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

      console.log(`Template saved: ${template.name} (${template.id})`);
    } catch (error) {
      console.error('Failed to save template:', error);
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
        console.warn(`Template not found: ${id}`);
        return null;
      }

      // Increment usage count
      template.usageCount++;
      await this.saveTemplate(template);

      return template;
    } catch (error) {
      console.error('Failed to load template:', error);
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
      console.error('Failed to get templates:', error);
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
      console.log(`Template deleted: ${id}`);
    } catch (error) {
      console.error('Failed to delete template:', error);
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
    } catch (error) {
      console.error('Failed to update template metadata:', error);
      throw error;
    }
  }

  /**
   * Export template as JSON
   */
  exportTemplate(template: PropertyTemplate): void {
    const exportData = {
      version: '1.0',
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
        } catch (error) {
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
```

### 3.4 Thumbnail Generator

**File:** `app/src/services/thumbnailGenerator.ts`

```typescript
import type { Shape } from '../types';

/**
 * Thumbnail Generator Service
 * Creates preview images of templates using Canvas 2D API
 */

export class ThumbnailGenerator {
  private readonly THUMBNAIL_WIDTH = 200;
  private readonly THUMBNAIL_HEIGHT = 150;
  private readonly PADDING = 10;

  /**
   * Generate thumbnail from shapes
   */
  generateFromShapes(shapes: Shape[]): string {
    if (shapes.length === 0) {
      return this.generateEmptyThumbnail();
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.THUMBNAIL_WIDTH;
    canvas.height = this.THUMBNAIL_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return this.generateEmptyThumbnail();
    }

    // Set background
    ctx.fillStyle = '#F9FAFB'; // Light gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate bounding box of all shapes
    const bounds = this.calculateBounds(shapes);

    // Calculate scale to fit shapes in thumbnail
    const scaleX = (this.THUMBNAIL_WIDTH - 2 * this.PADDING) / bounds.width;
    const scaleY = (this.THUMBNAIL_HEIGHT - 2 * this.PADDING) / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    // Center the shapes
    const offsetX = this.THUMBNAIL_WIDTH / 2 - (bounds.centerX * scale);
    const offsetY = this.THUMBNAIL_HEIGHT / 2 - (bounds.centerY * scale);

    // Draw each shape
    ctx.strokeStyle = '#3B82F6'; // Blue outline
    ctx.fillStyle = '#3B82F610'; // Light blue fill
    ctx.lineWidth = 2;

    shapes.forEach((shape) => {
      this.drawShape(ctx, shape, scale, offsetX, offsetY);
    });

    // Convert to data URL
    return canvas.toDataURL('image/png');
  }

  /**
   * Generate thumbnail from current canvas
   */
  generateFromCanvas(canvas: HTMLCanvasElement): string {
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.THUMBNAIL_WIDTH;
      tempCanvas.height = this.THUMBNAIL_HEIGHT;

      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        return this.generateEmptyThumbnail();
      }

      // Draw scaled version of source canvas
      ctx.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        this.THUMBNAIL_WIDTH,
        this.THUMBNAIL_HEIGHT
      );

      return tempCanvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to generate thumbnail from canvas:', error);
      return this.generateEmptyThumbnail();
    }
  }

  /**
   * Draw individual shape on canvas
   */
  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void {
    ctx.beginPath();

    const points = shape.points.map((p) => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    }));

    if (shape.type === 'circle') {
      const center = points[0];
      const radius = Math.hypot(
        points[1].x - center.x,
        points[1].y - center.y
      );
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    } else {
      // Rectangle or polyline
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
    }

    ctx.fill();
    ctx.stroke();
  }

  /**
   * Calculate bounding box of shapes
   */
  private calculateBounds(shapes: Shape[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  } {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    shapes.forEach((shape) => {
      shape.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    });

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  /**
   * Generate placeholder thumbnail
   */
  private generateEmptyThumbnail(): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.THUMBNAIL_WIDTH;
    canvas.height = this.THUMBNAIL_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Gray background
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Placeholder icon (simple house shape)
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#E5E7EB';

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw simple house
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 30);
    ctx.lineTo(centerX + 30, centerY);
    ctx.lineTo(centerX + 30, centerY + 30);
    ctx.lineTo(centerX - 30, centerY + 30);
    ctx.lineTo(centerX - 30, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    return canvas.toDataURL('image/png');
  }
}

// Export singleton instance
export const thumbnailGenerator = new ThumbnailGenerator();
```

---

## 4. Zustand Store Integration

**File:** `app/src/store/useTemplateStore.ts`

```typescript
import { create } from 'zustand';
import type { PropertyTemplate, TemplateFilter, TemplateCategory } from '../types/template';
import { templateStorage } from '../services/templateStorage';

/**
 * Template Store
 * Manages template state and user interactions
 */

interface TemplateState {
  // Data
  templates: PropertyTemplate[];
  activeFilter: TemplateFilter;
  isGalleryOpen: boolean;
  isSaveDialogOpen: boolean;
  selectedTemplateId: string | null;
  searchQuery: string;

  // Actions
  loadAllTemplates: () => Promise<void>;
  openGallery: () => void;
  closeGallery: () => void;
  openSaveDialog: () => void;
  closeSaveDialog: () => void;
  selectTemplate: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: Partial<TemplateFilter>) => void;
  toggleFavorite: (id: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  // Initial state
  templates: [],
  activeFilter: {
    showBuiltIn: true,
    showUserTemplates: true,
    showFavorites: false,
  },
  isGalleryOpen: false,
  isSaveDialogOpen: false,
  selectedTemplateId: null,
  searchQuery: '',

  // Load all templates from storage
  loadAllTemplates: async () => {
    try {
      const templates = await templateStorage.getAllTemplates();
      set({ templates });
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  },

  // Gallery control
  openGallery: () => {
    get().loadAllTemplates(); // Refresh on open
    set({ isGalleryOpen: true });
  },

  closeGallery: () => {
    set({ isGalleryOpen: false, selectedTemplateId: null });
  },

  // Save dialog control
  openSaveDialog: () => {
    set({ isSaveDialogOpen: true });
  },

  closeSaveDialog: () => {
    set({ isSaveDialogOpen: false });
  },

  // Template selection
  selectTemplate: (id) => {
    set({ selectedTemplateId: id });
  },

  // Search
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // Filter
  setFilter: (filter) => {
    set((state) => ({
      activeFilter: { ...state.activeFilter, ...filter },
    }));
  },

  // Toggle favorite
  toggleFavorite: async (id) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return;

    try {
      await templateStorage.updateTemplateMetadata(id, {
        isFavorite: !template.isFavorite,
      });
      await get().loadAllTemplates();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  },

  // Delete template
  deleteTemplate: async (id) => {
    try {
      await templateStorage.deleteTemplate(id);
      await get().loadAllTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  },
}));
```

---

## 5. UI Component Implementation

### 5.1 Template Gallery Modal

**File:** `app/src/components/TemplateGallery/TemplateGalleryModal.tsx`

```typescript
import React, { useEffect, useMemo } from 'react';
import { useTemplateStore } from '../../store/useTemplateStore';
import { TemplateGrid } from './TemplateGrid';
import Icon from '../Icon';

export function TemplateGalleryModal(): React.JSX.Element | null {
  const {
    isGalleryOpen,
    closeGallery,
    templates,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setFilter,
    loadAllTemplates,
  } = useTemplateStore();

  // Load templates on mount
  useEffect(() => {
    if (isGalleryOpen) {
      loadAllTemplates();
    }
  }, [isGalleryOpen, loadAllTemplates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Filter by author type
    if (!activeFilter.showBuiltIn) {
      result = result.filter((t) => t.author !== 'built-in');
    }
    if (!activeFilter.showUserTemplates) {
      result = result.filter((t) => t.author !== 'user');
    }

    // Filter by favorites
    if (activeFilter.showFavorites) {
      result = result.filter((t) => t.isFavorite);
    }

    // Filter by category
    if (activeFilter.category) {
      result = result.filter((t) => t.category === activeFilter.category);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [templates, activeFilter, searchQuery]);

  if (!isGalleryOpen) return null;

  return (
    <div
      onClick={closeGallery}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '1000px',
          maxHeight: '85vh',
          width: '90%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="template" color="#ffffff" size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                Template Gallery
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                {filteredTemplates.length} templates available
              </p>
            </div>
          </div>
          <button
            onClick={closeGallery}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Icon name="close" color="#6b7280" size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 32px', borderBottom: '1px solid #e5e7eb' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon
              name="search"
              color="#9ca3af"
              size={18}
              style={{ position: 'absolute', left: '12px' }}
            />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            padding: '16px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {['all', 'residential', 'commercial', 'agricultural', 'industrial', 'custom'].map(
            (category) => (
              <button
                key={category}
                onClick={() =>
                  setFilter({
                    category: category === 'all' ? undefined : (category as any),
                  })
                }
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor:
                    activeFilter.category === category ||
                    (category === 'all' && !activeFilter.category)
                      ? '#3b82f6'
                      : '#f3f4f6',
                  color:
                    activeFilter.category === category ||
                    (category === 'all' && !activeFilter.category)
                      ? '#ffffff'
                      : '#374151',
                  transition: 'all 150ms',
                }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Template Grid */}
        <div
          style={{
            padding: '32px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <TemplateGrid templates={filteredTemplates} />
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Constitution Compliance Checklist

- ✅ **Article 1:** All styles implemented inline (no CSS files)
- ✅ **Article 2:** TypeScript strict mode enabled, comprehensive types defined
- ✅ **Article 3:** Zustand store (`useTemplateStore`) for state management
- ✅ **Article 4:** React functional components with proper hooks
- ✅ **Article 5:** No 3D rendering changes (templates store existing 3D data)
- ✅ **Article 6:** Unit tests planned for all services (70%+ coverage target)
- ✅ **Article 7:** Security: local storage only, no external APIs, input validation
- ✅ **Article 8:** Editing existing files (App.tsx, Toolbar.tsx) for integration
- ✅ **Article 9:** Canva-inspired UI matching existing design system

---

## 7. Testing Strategy

### 7.1 Unit Tests

**File:** `app/src/__tests__/unit/templateStorage.test.ts`

```typescript
describe('TemplateStorageService', () => {
  test('saves template to IndexedDB', async () => {
    const template = createMockTemplate();
    await templateStorage.saveTemplate(template);
    const loaded = await templateStorage.loadTemplate(template.id);
    expect(loaded).toEqual(template);
  });

  test('throws error when deleting built-in template', async () => {
    const builtIn = { ...createMockTemplate(), author: 'built-in' };
    await templateStorage.saveTemplate(builtIn);
    await expect(templateStorage.deleteTemplate(builtIn.id)).rejects.toThrow();
  });

  test('increments usageCount on load', async () => {
    const template = createMockTemplate();
    await templateStorage.saveTemplate(template);
    await templateStorage.loadTemplate(template.id);
    const updated = await templateStorage.loadTemplate(template.id);
    expect(updated.usageCount).toBe(2);
  });
});
```

### 7.2 Integration Tests

**File:** `app/src/__tests__/integration/templateWorkflow.test.tsx`

```typescript
describe('Template Workflow', () => {
  test('complete save and load workflow', async () => {
    render(<App />);

    // Open save dialog
    const saveButton = screen.getByLabelText('Save as Template');
    fireEvent.click(saveButton);

    // Fill form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Template' } });
    fireEvent.click(screen.getByText('Save'));

    // Open gallery
    const templatesButton = screen.getByLabelText('Templates');
    fireEvent.click(templatesButton);

    // Load template
    const templateCard = screen.getByText('Test Template');
    fireEvent.click(templateCard);

    // Verify shapes loaded
    await waitFor(() => {
      expect(screen.getByTestId('scene-manager')).toBeInTheDocument();
    });
  });
});
```

### 7.3 Performance Tests

- Load 100 templates in <500ms
- Search updates in <100ms
- Thumbnail generation in <200ms per template

---

## 8. Migration & Rollout Plan

### Phase 1: Foundation (Week 1)
- Implement types and storage service
- Create built-in templates
- Add thumbnail generator
- Unit tests for services

### Phase 2: UI Components (Week 2)
- Build template gallery modal
- Implement save dialog
- Add toolbar integration
- Integration tests

### Phase 3: Polish & Launch (Week 3)
- Performance optimization
- Error handling refinement
- User testing feedback
- Documentation
- Production deployment

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Storage quota exceeded | Medium | High | Implement quota monitoring, auto-cleanup |
| Template corruption | Low | High | Schema validation, version migration |
| Performance degradation (100+ templates) | Medium | Medium | Virtualized list, lazy thumbnail loading |
| Browser compatibility | Low | Medium | Polyfills for older browsers |
| User confusion (too many templates) | Medium | Low | Smart categorization, search, favorites |

---

**Plan Status:** ✅ Ready for Implementation
**Estimated Effort:** 16-20 hours (3 weeks part-time)
**Dependencies:** None (all existing systems compatible)
**Next Steps:** Review plan → Approve → Begin Phase 1
