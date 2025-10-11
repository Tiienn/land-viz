import type { PropertyTemplate, TemplateCategory } from '../types/template';

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
  id: `built-in-${name.toLowerCase().replace(/\s+/g, '-')}`,
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
        opacity: 1,
        created: new Date(),
        modified: new Date(),
      },
    ],
    metadata: {
      defaultUnit: 'metric',
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
      id: crypto.randomUUID(),
      name: 'Property Boundary',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -12.5, y: -20 },
        { x: 12.5, y: -20 },
        { x: 12.5, y: 20 },
        { x: -12.5, y: 20 },
      ],
      color: '#3B82F6',
      visible: true,
      created: new Date(),
      modified: new Date(),
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
      id: crypto.randomUUID(),
      name: 'Lot Boundary',
      type: 'polyline',
      layerId: 'main',
      points: [
        { x: -15, y: -17.5 },
        { x: 15, y: -17.5 },
        { x: 15, y: 17.5 },
        { x: 5, y: 17.5 },
        { x: 5, y: 5 },
        { x: -15, y: 5 },
      ],
      color: '#3B82F6',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    // Setback line (inner)
    {
      id: crypto.randomUUID(),
      name: 'Building Setback',
      type: 'polyline',
      layerId: 'main',
      points: [
        { x: -12, y: -14.5 },
        { x: 12, y: -14.5 },
        { x: 12, y: 14.5 },
        { x: 2, y: 14.5 },
        { x: 2, y: 2 },
        { x: -12, y: 2 },
      ],
      color: '#10B981',
      visible: true,
      created: new Date(),
      modified: new Date(),
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
      id: crypto.randomUUID(),
      name: 'Building',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -15, y: 25 },
        { x: 15, y: 25 },
        { x: 15, y: 40 },
        { x: -15, y: 40 },
      ],
      color: '#6B7280',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    // Parking row 1
    {
      id: crypto.randomUUID(),
      name: 'Parking Space',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -20, y: -5 },
        { x: -15, y: -5 },
        { x: -15, y: 3 },
        { x: -20, y: 3 },
      ],
      color: '#3B82F6',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Parking Space',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -10, y: -5 },
        { x: -5, y: -5 },
        { x: -5, y: 3 },
        { x: -10, y: 3 },
      ],
      color: '#3B82F6',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Parking Space',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: 0, y: -5 },
        { x: 5, y: -5 },
        { x: 5, y: 3 },
        { x: 0, y: 3 },
      ],
      color: '#3B82F6',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Parking Space',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: 10, y: -5 },
        { x: 15, y: -5 },
        { x: 15, y: 3 },
        { x: 10, y: 3 },
      ],
      color: '#3B82F6',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
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
      id: crypto.randomUUID(),
      name: 'Property Boundary',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -100, y: -150 },
        { x: 100, y: -150 },
        { x: 100, y: 150 },
        { x: -100, y: 150 },
      ],
      color: '#3B82F6',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    // Farmhouse
    {
      id: crypto.randomUUID(),
      name: 'Farmhouse',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -80, y: 120 },
        { x: -60, y: 120 },
        { x: -60, y: 140 },
        { x: -80, y: 140 },
      ],
      color: '#EF4444',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    // Barn
    {
      id: crypto.randomUUID(),
      name: 'Barn',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: 60, y: 100 },
        { x: 85, y: 100 },
        { x: 85, y: 130 },
        { x: 60, y: 130 },
      ],
      color: '#7C3AED',
      visible: true,
      created: new Date(),
      modified: new Date(),
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
      id: crypto.randomUUID(),
      name: 'Block Boundary',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -50, y: -75 },
        { x: 50, y: -75 },
        { x: 50, y: 75 },
        { x: -50, y: 75 },
      ],
      color: '#3B82F6',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    // Access road (center)
    {
      id: crypto.randomUUID(),
      name: 'Access Road',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -5, y: -75 },
        { x: 5, y: -75 },
        { x: 5, y: 75 },
        { x: -5, y: 75 },
      ],
      color: '#6B7280',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    // Left lots (3 lots)
    {
      id: crypto.randomUUID(),
      name: 'Lot 1',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -50, y: -75 },
        { x: -5, y: -75 },
        { x: -5, y: -25 },
        { x: -50, y: -25 },
      ],
      color: '#10B981',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Lot 2',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -50, y: -25 },
        { x: -5, y: -25 },
        { x: -5, y: 25 },
        { x: -50, y: 25 },
      ],
      color: '#10B981',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Lot 3',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: -50, y: 25 },
        { x: -5, y: 25 },
        { x: -5, y: 75 },
        { x: -50, y: 75 },
      ],
      color: '#10B981',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    // Right lots (3 lots)
    {
      id: crypto.randomUUID(),
      name: 'Lot 4',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: 5, y: -75 },
        { x: 50, y: -75 },
        { x: 50, y: -25 },
        { x: 5, y: -25 },
      ],
      color: '#10B981',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Lot 5',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: 5, y: -25 },
        { x: 50, y: -25 },
        { x: 50, y: 25 },
        { x: 5, y: 25 },
      ],
      color: '#10B981',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Lot 6',
      type: 'rectangle',
      layerId: 'main',
      points: [
        { x: 5, y: 25 },
        { x: 50, y: 25 },
        { x: 50, y: 75 },
        { x: 5, y: 75 },
      ],
      color: '#10B981',
      visible: true,
      created: new Date(),
      modified: new Date(),
    },
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
