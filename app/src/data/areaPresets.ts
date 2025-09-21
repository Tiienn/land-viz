import type { AreaPreset } from '../types/presets';

/**
 * Default area presets organized by category
 * Includes common lot sizes for residential, commercial, agricultural, and mixed use
 */
export const defaultAreaPresets: AreaPreset[] = [
  // ================================
  // RESIDENTIAL CATEGORY
  // ================================
  {
    id: 'res-small-suburban',
    name: 'Small Suburban Lot',
    area: 0.25,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.5,
    description: 'Typical small suburban residential lot',
    category: 'residential',
  },
  {
    id: 'res-standard-suburban',
    name: 'Standard Suburban Lot',
    area: 0.5,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.8,
    description: 'Standard suburban residential lot',
    category: 'residential',
  },
  {
    id: 'res-large-lot',
    name: 'Large Residential Lot',
    area: 1,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 2.0,
    description: 'Large residential property',
    category: 'residential',
  },
  {
    id: 'res-european-standard',
    name: 'European Residential',
    area: 2000,
    unit: 'sqm',
    shapeType: 'rectangle',
    aspectRatio: 1.4,
    description: 'European residential standard',
    category: 'residential',
  },
  {
    id: 'res-urban-townhouse',
    name: 'Urban Townhouse Lot',
    area: 5000,
    unit: 'sqft',
    shapeType: 'rectangle',
    aspectRatio: 3.0,
    description: 'Narrow urban townhouse lot',
    category: 'residential',
  },
  {
    id: 'res-estate-lot',
    name: 'Estate Lot',
    area: 2,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.6,
    description: 'Large estate property',
    category: 'residential',
  },

  // ================================
  // COMMERCIAL CATEGORY
  // ================================
  {
    id: 'com-small-retail',
    name: 'Small Retail Space',
    area: 5000,
    unit: 'sqft',
    shapeType: 'rectangle',
    aspectRatio: 2.5,
    description: 'Small retail or office space',
    category: 'commercial',
  },
  {
    id: 'com-medium-commercial',
    name: 'Medium Commercial Plot',
    area: 10000,
    unit: 'sqft',
    shapeType: 'rectangle',
    aspectRatio: 1.8,
    description: 'Medium commercial development',
    category: 'commercial',
  },
  {
    id: 'com-large-development',
    name: 'Large Commercial Site',
    area: 1,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.5,
    description: 'Large commercial development',
    category: 'commercial',
  },
  {
    id: 'com-shopping-center',
    name: 'Shopping Center Plot',
    area: 2500,
    unit: 'sqm',
    shapeType: 'rectangle',
    aspectRatio: 2.2,
    description: 'Shopping center or mall site',
    category: 'commercial',
  },
  {
    id: 'com-warehouse',
    name: 'Warehouse Site',
    area: 50000,
    unit: 'sqft',
    shapeType: 'rectangle',
    aspectRatio: 3.0,
    description: 'Industrial warehouse site',
    category: 'commercial',
  },
  {
    id: 'com-office-park',
    name: 'Office Park',
    area: 5,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.4,
    description: 'Corporate office park',
    category: 'commercial',
  },

  // ================================
  // AGRICULTURAL CATEGORY
  // ================================
  {
    id: 'agr-small-farm-plot',
    name: 'Small Farm Plot',
    area: 1,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.6,
    description: 'Small agricultural plot',
    category: 'agricultural',
  },
  {
    id: 'agr-medium-farm',
    name: 'Medium Farm Parcel',
    area: 5,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 2.0,
    description: 'Medium farm parcel',
    category: 'agricultural',
  },
  {
    id: 'agr-large-farm',
    name: 'Large Agricultural Plot',
    area: 10,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.8,
    description: 'Large agricultural development',
    category: 'agricultural',
  },
  {
    id: 'agr-quarter-section',
    name: 'Quarter Section',
    area: 40,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.0,
    description: 'US agricultural quarter section',
    category: 'agricultural',
  },
  {
    id: 'agr-vineyard',
    name: 'Vineyard Plot',
    area: 3,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 2.5,
    description: 'Wine vineyard plot',
    category: 'agricultural',
  },
  {
    id: 'agr-orchard',
    name: 'Orchard Plot',
    area: 2,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.8,
    description: 'Fruit orchard plot',
    category: 'agricultural',
  },

  // ================================
  // MIXED USE CATEGORY
  // ================================
  {
    id: 'mix-planned-community',
    name: 'Planned Community',
    area: 25,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.4,
    description: 'Mixed-use planned community',
    category: 'mixed',
  },
  {
    id: 'mix-transit-development',
    name: 'Transit-Oriented Development',
    area: 15,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.6,
    description: 'Transit-oriented mixed development',
    category: 'mixed',
  },
  {
    id: 'mix-downtown-block',
    name: 'Downtown City Block',
    area: 3,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.2,
    description: 'Urban downtown city block',
    category: 'mixed',
  },
  {
    id: 'mix-neighborhood-center',
    name: 'Neighborhood Center',
    area: 8,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.5,
    description: 'Local neighborhood commercial center',
    category: 'mixed',
  },
  {
    id: 'mix-rural-subdivision',
    name: 'Rural Subdivision',
    area: 50,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.8,
    description: 'Rural residential subdivision',
    category: 'mixed',
  },
];

/**
 * Get presets filtered by category
 */
export const getPresetsByCategory = (category: AreaPreset['category']): AreaPreset[] => {
  return defaultAreaPresets.filter(preset => preset.category === category);
};

/**
 * Find preset by ID
 */
export const getPresetById = (id: string): AreaPreset | undefined => {
  return defaultAreaPresets.find(preset => preset.id === id);
};

/**
 * Get all available categories
 */
export const getAvailableCategories = (): AreaPreset['category'][] => {
  const categories = new Set(defaultAreaPresets.map(preset => preset.category));
  return Array.from(categories).sort();
};

/**
 * Search presets by name or description
 */
export const searchPresets = (query: string, presets: AreaPreset[] = defaultAreaPresets): AreaPreset[] => {
  if (!query.trim()) return presets;

  const searchTerm = query.toLowerCase().trim();
  return presets.filter(preset =>
    preset.name.toLowerCase().includes(searchTerm) ||
    preset.description.toLowerCase().includes(searchTerm) ||
    preset.area.toString().includes(searchTerm)
  );
};