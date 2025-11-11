/**
 * Export filter configuration
 * Defines which properties to include in PDF export
 */
export interface ExportFilters {
  // High-level categories
  basicInfo: boolean;       // Name, Type, ID
  dimensions: boolean;      // Width, Height, Area, Perimeter
  position: boolean;        // Coordinates
  visual: boolean;          // Color, Visibility
  metadata: boolean;        // Created, Modified, Layer, Group

  // Granular sub-filters (for future customization)
  includeShapeId: boolean;
  includeShapeName: boolean;
  includeShapeType: boolean;
  includeArea: boolean;
  includePerimeter: boolean;
  includeWidth: boolean;
  includeHeight: boolean;
  includeCoordinates: boolean;
  includeColor: boolean;
  includeVisibility: boolean;
  includeRotation: boolean;
  includeTimestamps: boolean;
  includeLayer: boolean;
  includeGroup: boolean;
  includeLocked: boolean;
}

/**
 * Default export filters (Basic Info + Dimensions enabled)
 */
export const DEFAULT_EXPORT_FILTERS: ExportFilters = {
  // Categories
  basicInfo: true,
  dimensions: true,
  position: false,
  visual: false,
  metadata: false,

  // Sub-filters
  includeShapeId: true,
  includeShapeName: true,
  includeShapeType: true,
  includeArea: true,
  includePerimeter: true,
  includeWidth: true,
  includeHeight: true,
  includeCoordinates: false,
  includeColor: false,
  includeVisibility: false,
  includeRotation: false,
  includeTimestamps: false,
  includeLayer: false,
  includeGroup: false,
  includeLocked: false,
};

/**
 * Filter category metadata for UI rendering
 */
export interface FilterCategory {
  key: keyof Pick<ExportFilters, 'basicInfo' | 'dimensions'>;
  label: string;
  description: string;
  subFilters: Array<{
    key: keyof ExportFilters;
    label: string;
  }>;
}

/**
 * Filter categories configuration
 */
export const FILTER_CATEGORIES: FilterCategory[] = [
  {
    key: 'basicInfo',
    label: 'Basic Information',
    description: 'Shape name, type, and ID',
    subFilters: [
      { key: 'includeShapeId', label: 'Shape ID' },
      { key: 'includeShapeName', label: 'Shape Name' },
      { key: 'includeShapeType', label: 'Shape Type' },
    ],
  },
  {
    key: 'dimensions',
    label: 'Dimensions',
    description: 'Size measurements and area calculations',
    subFilters: [
      { key: 'includeWidth', label: 'Width' },
      { key: 'includeHeight', label: 'Height' },
      { key: 'includeArea', label: 'Area' },
      { key: 'includePerimeter', label: 'Perimeter' },
    ],
  },
];
