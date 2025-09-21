// Reference object types for Visual Comparison Tool
export type ReferenceCategory = 'sports' | 'buildings' | 'landmarks' | 'nature';

export interface ReferenceObject {
  id: string;
  name: string;
  category: ReferenceCategory;
  area: number; // square meters
  dimensions: {
    length: number; // meters
    width: number;  // meters
    height?: number; // optional for 3D visualization
  };
  geometry: {
    type: 'box' | 'cylinder' | 'custom' | 'eiffel-tower' | 'statue-of-liberty';
    parameters?: Record<string, unknown>;
    modelPath?: string; // for custom 3D models
  };
  material: {
    color: string;
    opacity: number;
    wireframe?: boolean;
  };
  metadata: {
    description: string;
    source: string;
    accuracy: 'exact' | 'approximate';
    popularity: number; // for sorting recommendations
  };
}

export interface ObjectComparison {
  objectId: string;
  objectName: string;
  quantityThatFits: number;
  sizeRatio: number;
  description: string;
  percentage: number; // what % of land this object represents
}

export interface ComparisonCalculations {
  totalLandArea: number;
  objectComparisons: ObjectComparison[];
  lastCalculated: Date;
}

export interface ObjectPosition {
  objectId: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
}

export interface BoundingBox {
  min: { x: number; y: number };
  max: { x: number; y: number };
}

// State management for comparison tool
export interface ComparisonState {
  panelExpanded: boolean;
  visibleObjects: Set<string>; // IDs of visible reference objects
  searchQuery: string;
  selectedCategory: ReferenceCategory | 'all';
  calculations: ComparisonCalculations | null;
}