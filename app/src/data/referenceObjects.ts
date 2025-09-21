import type { ReferenceObject } from '../types/referenceObjects';

// Comprehensive database of reference objects for visual comparisons
export const REFERENCE_OBJECTS: ReferenceObject[] = [
  // ============= SPORTS VENUES =============
  {
    id: 'soccer-field-fifa',
    name: 'Soccer Field (FIFA)',
    category: 'sports',
    area: 7140, // 105m x 68m
    dimensions: { length: 105, width: 68, height: 0.1 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#2d8f47',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'FIFA regulation soccer field (105m × 68m)',
      source: 'FIFA Laws of the Game',
      accuracy: 'exact',
      popularity: 10
    }
  },
  {
    id: 'basketball-court-fiba',
    name: 'Basketball Court',
    category: 'sports',
    area: 420, // 28m x 15m
    dimensions: { length: 28, width: 15, height: 0.1 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#8b4513',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'FIBA regulation basketball court (28m × 15m)',
      source: 'FIBA Official Basketball Rules',
      accuracy: 'exact',
      popularity: 9
    }
  },
  {
    id: 'tennis-court-itf',
    name: 'Tennis Court',
    category: 'sports',
    area: 261, // 23.77m x 10.97m
    dimensions: { length: 23.77, width: 10.97, height: 0.1 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#4169e1',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'ITF regulation tennis court (23.77m × 10.97m)',
      source: 'International Tennis Federation',
      accuracy: 'exact',
      popularity: 8
    }
  },
  {
    id: 'american-football-field',
    name: 'American Football Field',
    category: 'sports',
    area: 5351, // 109.7m x 48.8m
    dimensions: { length: 109.7, width: 48.8, height: 0.1 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#228b22',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'NFL regulation football field (109.7m × 48.8m)',
      source: 'NFL Rule Book',
      accuracy: 'exact',
      popularity: 7
    }
  },
  {
    id: 'olympic-swimming-pool',
    name: 'Olympic Swimming Pool',
    category: 'sports',
    area: 1250, // 50m x 25m
    dimensions: { length: 50, width: 25, height: 2 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#00bfff',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'Olympic-size swimming pool (50m × 25m)',
      source: 'FINA Standards',
      accuracy: 'exact',
      popularity: 6
    }
  },

  // ============= BUILDINGS =============
  {
    id: 'average-house-us',
    name: 'Average House (US)',
    category: 'buildings',
    area: 200, // Approximate square footprint
    dimensions: { length: 14.14, width: 14.14, height: 8 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#cd853f',
      opacity: 0.8,
      wireframe: false
    },
    metadata: {
      description: 'Typical US single-family home footprint (~2,150 sq ft total)',
      source: 'US Census Bureau',
      accuracy: 'approximate',
      popularity: 10
    }
  },
  {
    id: 'parking-space',
    name: 'Parking Space',
    category: 'buildings',
    area: 12.5, // 5m x 2.5m
    dimensions: { length: 5, width: 2.5, height: 0.05 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#696969',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'Standard car parking space (5m × 2.5m)',
      source: 'International Building Code',
      accuracy: 'exact',
      popularity: 9
    }
  },
  {
    id: 'city-block-manhattan',
    name: 'City Block (Manhattan)',
    category: 'buildings',
    area: 8000, // Typical Manhattan block
    dimensions: { length: 100, width: 80, height: 50 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#708090',
      opacity: 0.6,
      wireframe: false
    },
    metadata: {
      description: 'Typical Manhattan city block (100m × 80m)',
      source: 'NYC Department of City Planning',
      accuracy: 'approximate',
      popularity: 7
    }
  },
  {
    id: 'apartment-building',
    name: 'Apartment Building',
    category: 'buildings',
    area: 1500, // Medium apartment building footprint
    dimensions: { length: 50, width: 30, height: 20 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#8b7d6b',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'Medium apartment building footprint (50m × 30m)',
      source: 'Urban Planning Standards',
      accuracy: 'approximate',
      popularity: 6
    }
  },

  // ============= FAMOUS LANDMARKS =============
  {
    id: 'eiffel-tower-base',
    name: 'Eiffel Tower Base',
    category: 'landmarks',
    area: 15625, // 125m x 125m
    dimensions: { length: 125, width: 125, height: 1 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#8b4513',
      opacity: 0.6,
      wireframe: false
    },
    metadata: {
      description: 'Base area of the Eiffel Tower (125m × 125m)',
      source: 'Official Eiffel Tower website',
      accuracy: 'exact',
      popularity: 8
    }
  },
  {
    id: 'eiffel-tower-3d',
    name: 'Eiffel Tower (3D)',
    category: 'landmarks',
    area: 15625, // 125m x 125m
    dimensions: { length: 125, width: 125, height: 50 }, // Scaled height for visualization
    geometry: {
      type: 'eiffel-tower',
      parameters: {
        detailLevel: 'medium',
        segments: 20
      }
    },
    material: {
      color: '#8b4513', // Iron/bronze color
      opacity: 0.8,
      wireframe: false
    },
    metadata: {
      description: '3D model of the Eiffel Tower with lattice structure (scaled height)',
      source: 'Mathematical model based on official dimensions',
      accuracy: 'exact',
      popularity: 10
    }
  },
  {
    id: 'times-square',
    name: 'Times Square',
    category: 'landmarks',
    area: 26000, // Approximate area
    dimensions: { length: 200, width: 130, height: 1 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#ffd700',
      opacity: 0.5,
      wireframe: false
    },
    metadata: {
      description: 'Times Square pedestrian plaza area',
      source: 'NYC Department of Transportation',
      accuracy: 'approximate',
      popularity: 8
    }
  },
  {
    id: 'statue-of-liberty-base',
    name: 'Statue of Liberty Base',
    category: 'landmarks',
    area: 4047, // Star-shaped base
    dimensions: { length: 65, width: 65, height: 47 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#2e8b57',
      opacity: 0.6,
      wireframe: false
    },
    metadata: {
      description: 'Statue of Liberty pedestal base area',
      source: 'National Park Service',
      accuracy: 'exact',
      popularity: 7
    }
  },
  {
    id: 'statue-of-liberty-3d',
    name: 'Statue of Liberty (3D)',
    category: 'landmarks',
    area: 4047, // 65m x 65m base
    dimensions: { length: 65, width: 65, height: 47 }, // Scaled height for visualization
    geometry: {
      type: 'statue-of-liberty',
      parameters: {
        detailLevel: 'medium',
        segments: 16
      }
    },
    material: {
      color: '#2e8b57', // Sea green patina color
      opacity: 0.8,
      wireframe: false
    },
    metadata: {
      description: '3D model of the Statue of Liberty with pedestal, crown, torch, and tablet (scaled height)',
      source: 'Mathematical model based on National Park Service specifications',
      accuracy: 'exact',
      popularity: 10
    }
  },

  // ============= NATURAL REFERENCES =============
  {
    id: 'garden-plot',
    name: 'Garden Plot',
    category: 'nature',
    area: 100, // 10m x 10m
    dimensions: { length: 10, width: 10, height: 0.3 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#8fbc8f',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'Community garden plot (10m × 10m)',
      source: 'Community Garden Standards',
      accuracy: 'approximate',
      popularity: 8
    }
  },
  {
    id: 'playground',
    name: 'Playground',
    category: 'nature',
    area: 900, // 30m x 30m
    dimensions: { length: 30, width: 30, height: 0.5 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#f4a460',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'Standard playground area (30m × 30m)',
      source: 'Parks & Recreation Guidelines',
      accuracy: 'approximate',
      popularity: 7
    }
  },
  {
    id: 'small-farm-field',
    name: 'Small Farm Field',
    category: 'nature',
    area: 10000, // 1 hectare
    dimensions: { length: 100, width: 100, height: 0.1 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#8b7355',
      opacity: 0.6,
      wireframe: false
    },
    metadata: {
      description: '1 hectare farm field (100m × 100m)',
      source: 'Agricultural Standards',
      accuracy: 'exact',
      popularity: 6
    }
  },
  {
    id: 'golf-hole-green',
    name: 'Golf Hole (Green)',
    category: 'nature',
    area: 600, // Average golf green
    dimensions: { length: 30, width: 20, height: 0.1 },
    geometry: {
      type: 'box',
      parameters: { segments: 1 }
    },
    material: {
      color: '#00ff00',
      opacity: 0.7,
      wireframe: false
    },
    metadata: {
      description: 'Average golf putting green (30m × 20m)',
      source: 'USGA Standards',
      accuracy: 'approximate',
      popularity: 5
    }
  }
];

// Helper functions to work with reference objects
export function getReferenceObjectById(id: string): ReferenceObject | undefined {
  return REFERENCE_OBJECTS.find(obj => obj.id === id);
}

export function getReferenceObjectsByCategory(category: string): ReferenceObject[] {
  if (category === 'all') return REFERENCE_OBJECTS;
  return REFERENCE_OBJECTS.filter(obj => obj.category === category);
}

export function searchReferenceObjects(objects: ReferenceObject[], query: string): ReferenceObject[] {
  const lowercaseQuery = query.toLowerCase();
  return objects.filter(obj =>
    obj.name.toLowerCase().includes(lowercaseQuery) ||
    obj.metadata.description.toLowerCase().includes(lowercaseQuery) ||
    obj.category.includes(lowercaseQuery)
  );
}

export function filterByCategory(objects: ReferenceObject[], category: string): ReferenceObject[] {
  if (category === 'all') return objects;
  return objects.filter(obj => obj.category === category);
}

// Export category display names
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  sports: 'Sports Venues',
  buildings: 'Buildings',
  landmarks: 'Famous Landmarks',
  nature: 'Natural References'
};

// Export category icons
export const CATEGORY_ICONS: Record<string, string> = {
  sports: '⚽',
  buildings: '🏢',
  landmarks: '🗼',
  nature: '🌱'
};