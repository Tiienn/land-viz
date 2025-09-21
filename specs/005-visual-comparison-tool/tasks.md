# Task Breakdown: Visual Comparison Tool

**Spec ID**: 005
**Feature**: Visual Comparison Tool
**Created**: 2025-09-18
**Status**: Implementation Ready
**Total Estimated Duration**: 6 weeks

## Sprint Planning Overview

### Sprint 1 (Week 1-2): Foundation & Data Layer
**Goal**: Establish data structure, basic UI components, and state management

### Sprint 2 (Week 3-4): 3D Integration & Core Functionality
**Goal**: Implement 3D rendering, positioning, and calculations

### Sprint 3 (Week 5): Polish & Optimization
**Goal**: Performance optimization, mobile responsiveness, accessibility

### Sprint 4 (Week 6): Testing & Integration
**Goal**: Comprehensive testing, documentation, final integration

---

## Sprint 1: Foundation & Data Layer (Week 1-2)

### Task 1.1: Create Reference Object Data Structure
**Estimated Time**: 4 hours
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] TypeScript interfaces defined for ReferenceObject
- [ ] Initial object database with 15+ objects
- [ ] Data validation functions implemented
- [ ] Object categories properly structured

**Implementation**:

```typescript
// app/src/types/referenceObjects.ts
export interface ReferenceObject {
  id: string;
  name: string;
  category: ReferenceCategory;
  area: number; // square meters
  dimensions: {
    length: number;
    width: number;
    height?: number;
  };
  geometry: {
    type: 'box' | 'cylinder' | 'custom';
    parameters?: any;
    modelPath?: string;
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
    popularity: number;
  };
}

export type ReferenceCategory = 'sports' | 'buildings' | 'landmarks' | 'nature';
```

```typescript
// app/src/data/referenceObjects.ts
export const REFERENCE_OBJECTS: ReferenceObject[] = [
  {
    id: 'soccer-field-fifa',
    name: 'Soccer Field (FIFA)',
    category: 'sports',
    area: 7140,
    dimensions: { length: 105, width: 68, height: 0.1 },
    geometry: { type: 'box' },
    material: { color: '#2d8f47', opacity: 0.7 },
    metadata: {
      description: 'FIFA regulation soccer field (105m × 68m)',
      source: 'FIFA Laws of the Game',
      accuracy: 'exact',
      popularity: 10
    }
  },
  // Add 14+ more objects following this pattern
];
```

**Verification**:
- Run TypeScript compilation without errors
- Validate all object data using validation functions
- Confirm accurate real-world dimensions

---

### Task 1.2: Extend Zustand Store for Comparison State
**Estimated Time**: 3 hours
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] Comparison state added to useAppStore
- [ ] Actions for object visibility, search, filtering
- [ ] State persistence for user preferences
- [ ] Performance optimized with selectors

**Implementation**:

```typescript
// app/src/store/useAppStore.ts (extend existing)
interface ComparisonState {
  panelExpanded: boolean;
  visibleObjects: Set<string>;
  searchQuery: string;
  selectedCategory: ReferenceCategory | 'all';
  calculations: ComparisonCalculations | null;
}

interface AppStoreState {
  // ... existing state
  comparison: ComparisonState;
}

interface AppStoreActions {
  // ... existing actions

  // Comparison tool actions
  toggleComparisonPanel: () => void;
  toggleObjectVisibility: (objectId: string) => void;
  setComparisonSearch: (query: string) => void;
  setComparisonCategory: (category: ReferenceCategory | 'all') => void;
  calculateComparisons: () => void;
  resetComparison: () => void;
}

// Implementation in store
export const useAppStore = create<AppStoreState & AppStoreActions>()(
  devtools(
    persist(
      (set, get) => ({
        // ... existing state/actions

        comparison: {
          panelExpanded: false,
          visibleObjects: new Set(),
          searchQuery: '',
          selectedCategory: 'all',
          calculations: null
        },

        toggleComparisonPanel: () => set((state) => ({
          comparison: {
            ...state.comparison,
            panelExpanded: !state.comparison.panelExpanded
          }
        })),

        toggleObjectVisibility: (objectId: string) => set((state) => {
          const newVisibleObjects = new Set(state.comparison.visibleObjects);
          if (newVisibleObjects.has(objectId)) {
            newVisibleObjects.delete(objectId);
          } else {
            newVisibleObjects.add(objectId);
          }

          return {
            comparison: {
              ...state.comparison,
              visibleObjects: newVisibleObjects
            }
          };
        }),

        calculateComparisons: () => set((state) => {
          const calculations = ComparisonCalculator.calculate(
            state.shapes,
            Array.from(state.comparison.visibleObjects)
              .map(id => REFERENCE_OBJECTS.find(obj => obj.id === id))
              .filter(Boolean) as ReferenceObject[]
          );

          return {
            comparison: {
              ...state.comparison,
              calculations
            }
          };
        })
      }),
      {
        name: 'land-viz-store',
        partialize: (state) => ({
          // ... existing persistence
          comparison: {
            visibleObjects: Array.from(state.comparison.visibleObjects),
            selectedCategory: state.comparison.selectedCategory
          }
        })
      }
    )
  )
);
```

**Verification**:
- State updates trigger re-renders correctly
- Persistence works across browser sessions
- Performance profiling shows no unnecessary re-renders

---

### Task 1.3: Create Comparison Calculations Utility
**Estimated Time**: 4 hours
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] Accurate area calculations for irregular shapes
- [ ] Quantity calculations (how many objects fit)
- [ ] Size ratio calculations
- [ ] Human-readable descriptions

**Implementation**:

```typescript
// app/src/utils/comparisonCalculations.ts
interface ComparisonCalculations {
  totalLandArea: number;
  objectComparisons: ObjectComparison[];
  lastCalculated: Date;
}

interface ObjectComparison {
  objectId: string;
  objectName: string;
  quantityThatFits: number;
  sizeRatio: number;
  description: string;
  percentage: number; // what % of land this object represents
}

export class ComparisonCalculator {
  static calculate(
    landShapes: Shape[],
    referenceObjects: ReferenceObject[]
  ): ComparisonCalculations {
    const totalArea = this.calculateTotalLandArea(landShapes);

    const objectComparisons = referenceObjects.map(obj => {
      const quantity = totalArea / obj.area;
      const ratio = totalArea / obj.area;

      return {
        objectId: obj.id,
        objectName: obj.name,
        quantityThatFits: Math.floor(quantity * 10) / 10, // Round to 1 decimal
        sizeRatio: Math.floor(ratio * 100) / 100, // Round to 2 decimals
        description: this.generateDescription(totalArea, obj),
        percentage: Math.floor((obj.area / totalArea) * 1000) / 10 // Round to 1 decimal
      };
    });

    return {
      totalLandArea: totalArea,
      objectComparisons: objectComparisons.sort((a, b) => b.sizeRatio - a.sizeRatio),
      lastCalculated: new Date()
    };
  }

  private static calculateTotalLandArea(shapes: Shape[]): number {
    return shapes.reduce((total, shape) => {
      return total + this.calculateShapeArea(shape);
    }, 0);
  }

  private static calculateShapeArea(shape: Shape): number {
    switch (shape.type) {
      case 'rectangle':
        return this.calculateRectangleArea(shape.points);
      case 'circle':
        return this.calculateCircleArea(shape.points);
      case 'polygon':
      case 'polyline':
        return this.calculatePolygonArea(shape.points);
      default:
        return 0;
    }
  }

  private static generateDescription(
    landArea: number,
    object: ReferenceObject
  ): string {
    const ratio = landArea / object.area;

    if (ratio >= 1) {
      if (ratio >= 100) {
        return `Your land is ${Math.floor(ratio)}x larger than ${object.name.toLowerCase()}`;
      } else {
        return `Your land is ${Math.floor(ratio * 10) / 10}x larger than ${object.name.toLowerCase()}`;
      }
    } else {
      const inverseRatio = object.area / landArea;
      return `${object.name} is ${Math.floor(inverseRatio * 10) / 10}x larger than your land`;
    }
  }

  // Implement specific area calculation methods
  private static calculatePolygonArea(points: Point2D[]): number {
    // Shoelace formula implementation
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }
}
```

**Verification**:
- Test calculations against known geometric formulas
- Verify accuracy with complex polygon shapes
- Performance test with large numbers of shapes

---

### Task 1.4: Design Basic ComparisonPanel Component
**Estimated Time**: 6 hours
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] Responsive panel layout following Canva design system
- [ ] Category-based object organization
- [ ] Search functionality with debouncing
- [ ] Toggle switches for object visibility
- [ ] Calculations display section

**Implementation**:

```typescript
// app/src/components/ComparisonPanel/ComparisonPanel.tsx
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { REFERENCE_OBJECTS } from '../../data/referenceObjects';
import type { ReferenceCategory, ReferenceObject } from '../../types/referenceObjects';

interface ComparisonPanelProps {
  expanded: boolean;
  onToggle: () => void;
}

export function ComparisonPanel({ expanded, onToggle }: ComparisonPanelProps) {
  const {
    comparison,
    toggleObjectVisibility,
    setComparisonSearch,
    setComparisonCategory,
    calculateComparisons
  } = useAppStore();

  const [searchDebounce, setSearchDebounce] = useState('');

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setComparisonSearch(searchDebounce);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDebounce, setComparisonSearch]);

  // Filter objects based on search and category
  const filteredObjects = useMemo(() => {
    return REFERENCE_OBJECTS.filter(obj => {
      const matchesCategory = comparison.selectedCategory === 'all' ||
                             obj.category === comparison.selectedCategory;
      const matchesSearch = obj.name.toLowerCase().includes(
        comparison.searchQuery.toLowerCase()
      ) || obj.metadata.description.toLowerCase().includes(
        comparison.searchQuery.toLowerCase()
      );

      return matchesCategory && matchesSearch;
    });
  }, [comparison.selectedCategory, comparison.searchQuery]);

  // Group objects by category
  const objectsByCategory = useMemo(() => {
    const groups: Record<ReferenceCategory, ReferenceObject[]> = {
      sports: [],
      buildings: [],
      landmarks: [],
      nature: []
    };

    filteredObjects.forEach(obj => {
      groups[obj.category].push(obj);
    });

    // Sort by popularity within each category
    Object.keys(groups).forEach(category => {
      groups[category as ReferenceCategory].sort((a, b) => b.metadata.popularity - a.metadata.popularity);
    });

    return groups;
  }, [filteredObjects]);

  if (!expanded) {
    return (
      <div style={styles.collapsedPanel} onClick={onToggle}>
        <div style={styles.collapsedIcon}>📏</div>
        <div style={styles.collapsedText}>Compare</div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <ComparisonPanelHeader onToggle={onToggle} />

      <div style={styles.content}>
        <SearchSection
          value={searchDebounce}
          onChange={setSearchDebounce}
        />

        <CategoryTabs
          selected={comparison.selectedCategory}
          onChange={setComparisonCategory}
        />

        <ObjectList
          objectsByCategory={objectsByCategory}
          visibleObjects={comparison.visibleObjects}
          onToggleVisibility={toggleObjectVisibility}
          selectedCategory={comparison.selectedCategory}
        />

        <CalculationsSection
          calculations={comparison.calculations}
          onRecalculate={calculateComparisons}
        />
      </div>
    </div>
  );
}

// Subcomponents
function ComparisonPanelHeader({ onToggle }: { onToggle: () => void }) {
  return (
    <div style={styles.header}>
      <h3 style={styles.title}>Visual Comparison</h3>
      <button style={styles.closeButton} onClick={onToggle}>×</button>
    </div>
  );
}

function SearchSection({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div style={styles.searchSection}>
      <div style={styles.searchInput}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Find objects..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.input}
          aria-label="Search reference objects"
        />
      </div>
    </div>
  );
}

// Styling following Canva design system
const styles = {
  panel: {
    position: 'fixed' as const,
    right: '16px',
    top: '120px',
    width: '320px',
    maxHeight: 'calc(100vh - 140px)',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'all 200ms ease-out',
    fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    zIndex: 1000
  },

  collapsedPanel: {
    position: 'fixed' as const,
    right: '16px',
    top: '280px',
    width: '60px',
    height: '60px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
    zIndex: 1000
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa'
  },

  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937'
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background-color 200ms ease'
  },

  content: {
    overflow: 'auto',
    maxHeight: 'calc(100vh - 200px)'
  },

  searchSection: {
    padding: '16px',
    borderBottom: '1px solid #f1f3f4'
  },

  searchInput: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center'
  },

  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    fontSize: '14px',
    color: '#6b7280',
    zIndex: 1
  },

  input: {
    width: '100%',
    padding: '8px 12px 8px 36px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 200ms ease'
  }
};
```

**Verification**:
- Visual inspection matches Canva design system
- Responsive behavior on mobile devices
- Search functionality works with debouncing
- All interactions provide visual feedback

---

### Task 1.5: Implement Object List Component
**Estimated Time**: 5 hours
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] Category-based object grouping
- [ ] Expandable/collapsible categories
- [ ] Object cards with thumbnails and details
- [ ] Toggle switches for visibility
- [ ] Smooth animations and transitions

**Implementation**:

```typescript
// app/src/components/ComparisonPanel/ObjectList.tsx
interface ObjectListProps {
  objectsByCategory: Record<ReferenceCategory, ReferenceObject[]>;
  visibleObjects: Set<string>;
  onToggleVisibility: (objectId: string) => void;
  selectedCategory: ReferenceCategory | 'all';
}

export function ObjectList({
  objectsByCategory,
  visibleObjects,
  onToggleVisibility,
  selectedCategory
}: ObjectListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<ReferenceCategory>>(
    new Set(['sports', 'buildings']) // Default expanded
  );

  const toggleCategory = (category: ReferenceCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const categoryDisplayNames: Record<ReferenceCategory, string> = {
    sports: 'Sports Venues',
    buildings: 'Buildings',
    landmarks: 'Famous Landmarks',
    nature: 'Natural References'
  };

  const categoryIcons: Record<ReferenceCategory, string> = {
    sports: '⚽',
    buildings: '🏢',
    landmarks: '🗼',
    nature: '🌱'
  };

  return (
    <div style={styles.objectList}>
      {(Object.keys(objectsByCategory) as ReferenceCategory[]).map(category => {
        const objects = objectsByCategory[category];
        const isExpanded = expandedCategories.has(category);
        const visibleCount = objects.filter(obj => visibleObjects.has(obj.id)).length;

        // Skip empty categories unless showing all
        if (objects.length === 0 && selectedCategory === 'all') return null;

        return (
          <div key={category} style={styles.categorySection}>
            <CategoryHeader
              category={category}
              displayName={categoryDisplayNames[category]}
              icon={categoryIcons[category]}
              isExpanded={isExpanded}
              objectCount={objects.length}
              visibleCount={visibleCount}
              onToggle={() => toggleCategory(category)}
            />

            {isExpanded && (
              <div style={styles.categoryContent}>
                {objects.map(object => (
                  <ObjectCard
                    key={object.id}
                    object={object}
                    isVisible={visibleObjects.has(object.id)}
                    onToggleVisibility={() => onToggleVisibility(object.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CategoryHeader({
  category,
  displayName,
  icon,
  isExpanded,
  objectCount,
  visibleCount,
  onToggle
}: {
  category: ReferenceCategory;
  displayName: string;
  icon: string;
  isExpanded: boolean;
  objectCount: number;
  visibleCount: number;
  onToggle: () => void;
}) {
  return (
    <div style={styles.categoryHeader} onClick={onToggle}>
      <div style={styles.categoryInfo}>
        <span style={styles.categoryIcon}>{icon}</span>
        <span style={styles.categoryName}>{displayName}</span>
        <span style={styles.categoryCount}>
          ({visibleCount}/{objectCount} visible)
        </span>
      </div>
      <span style={{
        ...styles.expandIcon,
        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
      }}>
        ▶
      </span>
    </div>
  );
}

function ObjectCard({
  object,
  isVisible,
  onToggleVisibility
}: {
  object: ReferenceObject;
  isVisible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div style={styles.objectCard}>
      <div style={styles.objectInfo}>
        <div style={styles.objectMain}>
          <div style={styles.objectName}>{object.name}</div>
          <div style={styles.objectDetails}>
            {object.area.toLocaleString()} m² • {object.dimensions.length}×{object.dimensions.width}m
          </div>
          <div style={styles.objectDescription}>
            {object.metadata.description}
          </div>
        </div>

        <ToggleSwitch
          checked={isVisible}
          onChange={onToggleVisibility}
          aria-label={`Toggle ${object.name} visibility`}
        />
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  'aria-label': ariaLabel
}: {
  checked: boolean;
  onChange: () => void;
  'aria-label': string;
}) {
  return (
    <button
      style={{
        ...styles.toggle,
        backgroundColor: checked ? '#3b82f6' : '#d1d5db'
      }}
      onClick={onChange}
      aria-label={ariaLabel}
      aria-pressed={checked}
    >
      <div style={{
        ...styles.toggleKnob,
        transform: checked ? 'translateX(14px)' : 'translateX(0px)'
      }} />
    </button>
  );
}

const styles = {
  objectList: {
    paddingBottom: '16px'
  },

  categorySection: {
    borderBottom: '1px solid #f1f3f4'
  },

  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 200ms ease',
    backgroundColor: '#f8f9fa'
  },

  categoryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  categoryIcon: {
    fontSize: '16px'
  },

  categoryName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937'
  },

  categoryCount: {
    fontSize: '12px',
    color: '#6b7280'
  },

  expandIcon: {
    fontSize: '12px',
    color: '#6b7280',
    transition: 'transform 200ms ease'
  },

  categoryContent: {
    backgroundColor: '#ffffff'
  },

  objectCard: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f3f4',
    transition: 'background-color 200ms ease'
  },

  objectInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px'
  },

  objectMain: {
    flex: 1
  },

  objectName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1f2937',
    marginBottom: '4px'
  },

  objectDetails: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px'
  },

  objectDescription: {
    fontSize: '11px',
    color: '#9ca3af',
    lineHeight: '1.3'
  },

  toggle: {
    width: '32px',
    height: '18px',
    borderRadius: '9px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'background-color 200ms ease',
    outline: 'none'
  },

  toggleKnob: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    transition: 'transform 200ms ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
  }
};
```

**Verification**:
- Category expansion/collapse animations work smoothly
- Toggle switches provide immediate visual feedback
- Object cards display all required information
- Performance remains smooth with many objects

---

## Sprint 2: 3D Integration & Core Functionality (Week 3-4)

### Task 2.1: Create ReferenceObjectRenderer Component
**Estimated Time**: 8 hours
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] Renders 3D objects in scene with proper scaling
- [ ] Integrates with existing Three.js setup
- [ ] Handles multiple objects efficiently
- [ ] Visual distinction from user shapes

**Implementation**:

```typescript
// app/src/components/Scene/ReferenceObjectRenderer.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { REFERENCE_OBJECTS } from '../../data/referenceObjects';
import type { ReferenceObject } from '../../types/referenceObjects';

interface ReferenceObjectRendererProps {
  visibleObjectIds: string[];
  userLandBounds: BoundingBox;
  opacity?: number;
}

interface BoundingBox {
  min: { x: number; y: number };
  max: { x: number; y: number };
}

export function ReferenceObjectRenderer({
  visibleObjectIds,
  userLandBounds,
  opacity = 0.7
}: ReferenceObjectRendererProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Get visible objects
  const visibleObjects = useMemo(() => {
    return visibleObjectIds
      .map(id => REFERENCE_OBJECTS.find(obj => obj.id === id))
      .filter(Boolean) as ReferenceObject[];
  }, [visibleObjectIds]);

  // Calculate positions for objects
  const objectPositions = useMemo(() => {
    return ObjectPositioner.positionObjects(visibleObjects, userLandBounds);
  }, [visibleObjects, userLandBounds]);

  return (
    <group ref={groupRef} name="reference-objects">
      {visibleObjects.map((object, index) => {
        const position = objectPositions[index];

        return (
          <ReferenceObjectMesh
            key={object.id}
            object={object}
            position={position}
            opacity={opacity}
          />
        );
      })}
    </group>
  );
}

function ReferenceObjectMesh({
  object,
  position,
  opacity
}: {
  object: ReferenceObject;
  position: THREE.Vector3;
  opacity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Create geometry based on object type
  const geometry = useMemo(() => {
    return GeometryFactory.createObjectGeometry(object);
  }, [object]);

  // Create material with object-specific styling
  const material = useMemo(() => {
    return new THREE.MeshLambertMaterial({
      color: object.material.color,
      transparent: true,
      opacity: opacity,
      wireframe: false
    });
  }, [object.material.color, opacity]);

  // Hover effect
  useFrame(() => {
    if (meshRef.current) {
      const targetOpacity = hovered ? opacity * 1.3 : opacity;
      meshRef.current.material.opacity = THREE.MathUtils.lerp(
        meshRef.current.material.opacity,
        targetOpacity,
        0.1
      );
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        userData={{ objectId: object.id, type: 'reference-object' }}
      />

      {/* Object label */}
      <ObjectLabel
        object={object}
        visible={hovered}
      />

      {/* Outline for better visibility */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#ffffff"
          transparent={true}
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function ObjectLabel({
  object,
  visible
}: {
  object: ReferenceObject;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <Html position={[0, object.dimensions.height || 1, 0]}>
      <div style={labelStyles.container}>
        <div style={labelStyles.name}>{object.name}</div>
        <div style={labelStyles.details}>
          {object.area.toLocaleString()} m²
        </div>
      </div>
    </Html>
  );
}

// Geometry factory for different object types
class GeometryFactory {
  private static geometryCache = new Map<string, THREE.BufferGeometry>();

  static createObjectGeometry(object: ReferenceObject): THREE.BufferGeometry {
    const cacheKey = `${object.id}-${object.geometry.type}`;

    if (this.geometryCache.has(cacheKey)) {
      return this.geometryCache.get(cacheKey)!;
    }

    let geometry: THREE.BufferGeometry;

    switch (object.geometry.type) {
      case 'box':
        geometry = new THREE.BoxGeometry(
          object.dimensions.length,
          object.dimensions.height || 0.5,
          object.dimensions.width
        );
        break;

      case 'cylinder':
        const radius = Math.min(object.dimensions.length, object.dimensions.width) / 2;
        geometry = new THREE.CylinderGeometry(
          radius,
          radius,
          object.dimensions.height || 1,
          16
        );
        break;

      default:
        geometry = new THREE.BoxGeometry(
          object.dimensions.length,
          object.dimensions.height || 0.5,
          object.dimensions.width
        );
    }

    this.geometryCache.set(cacheKey, geometry);
    return geometry;
  }
}

// Object positioning utility
class ObjectPositioner {
  static positionObjects(
    objects: ReferenceObject[],
    userLandBounds: BoundingBox
  ): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const placedObjects: Array<{ position: THREE.Vector3; bounds: BoundingBox }> = [];

    // Calculate safe distance from user land
    const safeDistance = 20; // meters
    const gridSpacing = 15; // meters between objects

    objects.forEach((object, index) => {
      const position = this.findSafePosition(
        object,
        userLandBounds,
        placedObjects,
        safeDistance,
        gridSpacing,
        index
      );

      positions.push(position);

      // Add to placed objects for collision detection
      placedObjects.push({
        position,
        bounds: this.calculateObjectBounds(object, position)
      });
    });

    return positions;
  }

  private static findSafePosition(
    object: ReferenceObject,
    userLandBounds: BoundingBox,
    placedObjects: Array<{ position: THREE.Vector3; bounds: BoundingBox }>,
    safeDistance: number,
    gridSpacing: number,
    index: number
  ): THREE.Vector3 {
    // Try positions in a spiral pattern around the user land
    const centerX = (userLandBounds.min.x + userLandBounds.max.x) / 2;
    const centerZ = (userLandBounds.min.y + userLandBounds.max.y) / 2;

    // Start at safe distance and spiral outward
    let radius = safeDistance + Math.max(
      userLandBounds.max.x - userLandBounds.min.x,
      userLandBounds.max.y - userLandBounds.min.y
    ) / 2;

    const angleStep = Math.PI / 4; // 45 degree steps
    let angle = (index * angleStep) % (Math.PI * 2);

    for (let attempt = 0; attempt < 32; attempt++) {
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      const y = 0;

      const position = new THREE.Vector3(x, y, z);
      const objectBounds = this.calculateObjectBounds(object, position);

      // Check collision with user land and placed objects
      if (!this.intersectsUserLand(objectBounds, userLandBounds) &&
          !this.intersectsPlacedObjects(objectBounds, placedObjects)) {
        return position;
      }

      // Try next position
      angle += angleStep;
      if (angle >= Math.PI * 2) {
        angle = 0;
        radius += gridSpacing;
      }
    }

    // Fallback position if no safe spot found
    return new THREE.Vector3(
      centerX + radius * Math.cos(index),
      0,
      centerZ + radius * Math.sin(index)
    );
  }

  private static calculateObjectBounds(
    object: ReferenceObject,
    position: THREE.Vector3
  ): BoundingBox {
    const halfLength = object.dimensions.length / 2;
    const halfWidth = object.dimensions.width / 2;

    return {
      min: {
        x: position.x - halfLength,
        y: position.z - halfWidth
      },
      max: {
        x: position.x + halfLength,
        y: position.z + halfWidth
      }
    };
  }

  private static intersectsUserLand(
    objectBounds: BoundingBox,
    userLandBounds: BoundingBox
  ): boolean {
    return !(
      objectBounds.max.x < userLandBounds.min.x ||
      objectBounds.min.x > userLandBounds.max.x ||
      objectBounds.max.y < userLandBounds.min.y ||
      objectBounds.min.y > userLandBounds.max.y
    );
  }

  private static intersectsPlacedObjects(
    objectBounds: BoundingBox,
    placedObjects: Array<{ bounds: BoundingBox }>
  ): boolean {
    return placedObjects.some(placed =>
      this.intersectsUserLand(objectBounds, placed.bounds)
    );
  }
}

const labelStyles = {
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '8px 12px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    fontSize: '12px',
    fontFamily: '"Nunito Sans", sans-serif',
    textAlign: 'center' as const,
    minWidth: '120px'
  },

  name: {
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '2px'
  },

  details: {
    color: '#6b7280',
    fontSize: '11px'
  }
};
```

**Verification**:
- Objects render with correct scale and positioning
- No overlap with user shapes or each other
- Hover effects work smoothly
- Performance remains stable with multiple objects

---

### Task 2.2: Implement Calculations Display Component
**Estimated Time**: 4 hours
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] Real-time calculation updates
- [ ] Clear visual presentation of comparisons
- [ ] Percentage and ratio displays
- [ ] Responsive layout for all screen sizes

**Implementation**:

```typescript
// app/src/components/ComparisonPanel/CalculationsSection.tsx
interface CalculationsSectionProps {
  calculations: ComparisonCalculations | null;
  onRecalculate: () => void;
}

export function CalculationsSection({
  calculations,
  onRecalculate
}: CalculationsSectionProps) {
  if (!calculations || calculations.objectComparisons.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>📊</div>
        <div style={styles.emptyText}>
          Select objects to see size comparisons
        </div>
      </div>
    );
  }

  return (
    <div style={styles.calculationsSection}>
      <div style={styles.sectionHeader}>
        <h4 style={styles.sectionTitle}>Size Comparisons</h4>
        <button
          style={styles.refreshButton}
          onClick={onRecalculate}
          title="Recalculate comparisons"
        >
          🔄
        </button>
      </div>

      <div style={styles.totalArea}>
        <strong>Your Total Land: </strong>
        {calculations.totalLandArea.toLocaleString()} m²
      </div>

      <div style={styles.comparisonsList}>
        {calculations.objectComparisons.map(comparison => (
          <ComparisonItem
            key={comparison.objectId}
            comparison={comparison}
          />
        ))}
      </div>

      <div style={styles.lastUpdated}>
        Updated {formatTime(calculations.lastCalculated)}
      </div>
    </div>
  );
}

function ComparisonItem({ comparison }: { comparison: ObjectComparison }) {
  const percentage = comparison.percentage;
  const isLarger = comparison.sizeRatio >= 1;

  return (
    <div style={styles.comparisonItem}>
      <div style={styles.comparisonHeader}>
        <span style={styles.objectName}>{comparison.objectName}</span>
        <span style={styles.quantity}>
          {comparison.quantityThatFits >= 1
            ? `${comparison.quantityThatFits} fit`
            : `${(1/comparison.quantityThatFits).toFixed(1)}x larger`
          }
        </span>
      </div>

      <div style={styles.comparisonDetails}>
        <div style={styles.description}>
          {comparison.description}
        </div>

        <div style={styles.visualBar}>
          <div
            style={{
              ...styles.progressBar,
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: isLarger ? '#10b981' : '#f59e0b'
            }}
          />
        </div>

        <div style={styles.percentage}>
          {percentage < 1 ? '<1%' : `${percentage.toFixed(1)}%`} of your land
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return date.toLocaleTimeString();
}

const styles = {
  calculationsSection: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e9ecef'
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },

  sectionTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937'
  },

  refreshButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background-color 200ms ease'
  },

  totalArea: {
    fontSize: '13px',
    color: '#1f2937',
    marginBottom: '16px',
    padding: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    textAlign: 'center' as const
  },

  comparisonsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },

  comparisonItem: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  comparisonHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },

  objectName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1f2937'
  },

  quantity: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    padding: '2px 6px',
    borderRadius: '4px'
  },

  comparisonDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },

  description: {
    fontSize: '11px',
    color: '#6b7280',
    lineHeight: '1.4'
  },

  visualBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden'
  },

  progressBar: {
    height: '100%',
    transition: 'width 300ms ease'
  },

  percentage: {
    fontSize: '10px',
    color: '#9ca3af',
    textAlign: 'right' as const
  },

  emptyState: {
    padding: '32px 16px',
    textAlign: 'center' as const,
    color: '#6b7280'
  },

  emptyIcon: {
    fontSize: '32px',
    marginBottom: '8px'
  },

  emptyText: {
    fontSize: '14px'
  },

  lastUpdated: {
    fontSize: '10px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    marginTop: '12px'
  }
};
```

**Verification**:
- Calculations update in real-time when objects toggle
- Visual bars accurately represent proportions
- Responsive layout works on mobile
- Performance remains smooth with frequent updates

---

### Task 2.3: Add Comparison Tool to App Integration
**Estimated Time**: 3 hours
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] Comparison panel integrated into main App component
- [ ] Ribbon toolbar button added
- [ ] State management properly connected
- [ ] No conflicts with existing features

**Implementation**:

```typescript
// app/src/App.tsx (extend existing)
import { ComparisonPanel } from './components/ComparisonPanel/ComparisonPanel';
import { ReferenceObjectRenderer } from './components/Scene/ReferenceObjectRenderer';

function App(): React.JSX.Element {
  // ... existing state

  const [comparisonPanelExpanded, setComparisonPanelExpanded] = useState(false);

  // Connect to store
  const {
    // ... existing store connections
    comparison,
    toggleComparisonPanel,
    calculateComparisons
  } = useAppStore();

  // Calculate user land bounds for object positioning
  const userLandBounds = useMemo(() => {
    if (shapes.length === 0) {
      return { min: { x: -50, y: -50 }, max: { x: 50, y: 50 } };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    shapes.forEach(shape => {
      shape.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    // Add padding
    const padding = 10;
    return {
      min: { x: minX - padding, y: minY - padding },
      max: { x: maxX + padding, y: maxY + padding }
    };
  }, [shapes]);

  // Auto-calculate when visible objects change
  useEffect(() => {
    if (comparison.visibleObjects.size > 0) {
      calculateComparisons();
    }
  }, [comparison.visibleObjects, shapes, calculateComparisons]);

  return (
    <div style={appStyles.container}>
      {/* ... existing components */}

      {/* Add comparison button to ribbon */}
      <div style={ribbonStyles.container}>
        {/* ... existing ribbon buttons */}

        <div style={ribbonStyles.toolGroup}>
          <button
            style={{
              ...ribbonStyles.toolButton,
              ...(comparisonPanelExpanded && ribbonStyles.activeButton)
            }}
            onClick={() => {
              setComparisonPanelExpanded(!comparisonPanelExpanded);
              toggleComparisonPanel();
            }}
            title="Visual Comparison Tool"
          >
            <Icon name="compare" size={20} />
            <span style={ribbonStyles.buttonLabel}>Compare</span>
          </button>
        </div>
      </div>

      {/* Comparison Panel */}
      <ComparisonPanel
        expanded={comparisonPanelExpanded}
        onToggle={() => setComparisonPanelExpanded(!comparisonPanelExpanded)}
      />

      {/* 3D Scene with Reference Objects */}
      <SceneErrorBoundary>
        <SceneManager ref={sceneManagerRef}>
          {/* ... existing scene components */}

          <ReferenceObjectRenderer
            visibleObjectIds={Array.from(comparison.visibleObjects)}
            userLandBounds={userLandBounds}
            opacity={0.6}
          />
        </SceneManager>
      </SceneErrorBoundary>
    </div>
  );
}
```

**Verification**:
- Comparison panel opens/closes correctly
- 3D objects render in scene without conflicts
- State updates propagate properly
- Existing functionality remains unaffected

---

## Sprint 3: Polish & Optimization (Week 5)

### Task 3.1: Performance Optimization
**Estimated Time**: 6 hours
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] Maintains 60 FPS with 10+ objects
- [ ] Efficient memory usage
- [ ] Optimized bundle size
- [ ] Smooth animations and transitions

**Implementation**:

```typescript
// app/src/utils/PerformanceOptimizations.ts

// 1. Object Pooling for Geometries
class GeometryPool {
  private static pools = new Map<string, THREE.BufferGeometry[]>();
  private static maxPoolSize = 20;

  static getGeometry(type: string, dimensions: any): THREE.BufferGeometry {
    const key = `${type}-${JSON.stringify(dimensions)}`;
    const pool = this.pools.get(key) || [];

    if (pool.length > 0) {
      return pool.pop()!;
    }

    return this.createGeometry(type, dimensions);
  }

  static returnGeometry(type: string, dimensions: any, geometry: THREE.BufferGeometry) {
    const key = `${type}-${JSON.stringify(dimensions)}`;
    const pool = this.pools.get(key) || [];

    if (pool.length < this.maxPoolSize) {
      pool.push(geometry);
      this.pools.set(key, pool);
    } else {
      geometry.dispose();
    }
  }
}

// 2. Frustum Culling for Reference Objects
function useFrustumCulling(objects: ReferenceObject[], camera: THREE.Camera) {
  const [culledObjects, setCulledObjects] = useState<ReferenceObject[]>([]);
  const frustum = useMemo(() => new THREE.Frustum(), []);

  useFrame(() => {
    frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
    );

    const visible = objects.filter(obj => {
      const sphere = new THREE.Sphere(
        new THREE.Vector3(obj.position.x, 0, obj.position.z),
        Math.max(obj.dimensions.length, obj.dimensions.width) / 2
      );
      return frustum.intersectsSphere(sphere);
    });

    setCulledObjects(visible);
  });

  return culledObjects;
}

// 3. LOD (Level of Detail) Implementation
function ReferenceObjectLOD({
  object,
  position,
  camera
}: {
  object: ReferenceObject;
  position: THREE.Vector3;
  camera: THREE.Camera;
}) {
  const [lodLevel, setLodLevel] = useState(0);

  useFrame(() => {
    const distance = camera.position.distanceTo(position);

    let newLodLevel = 0;
    if (distance > 100) newLodLevel = 2; // Low detail
    else if (distance > 50) newLodLevel = 1; // Medium detail
    else newLodLevel = 0; // High detail

    if (newLodLevel !== lodLevel) {
      setLodLevel(newLodLevel);
    }
  });

  const geometry = useMemo(() => {
    switch (lodLevel) {
      case 0: return createHighDetailGeometry(object);
      case 1: return createMediumDetailGeometry(object);
      case 2: return createLowDetailGeometry(object);
      default: return createMediumDetailGeometry(object);
    }
  }, [object, lodLevel]);

  return <mesh geometry={geometry} /* ... */ />;
}

// 4. Debounced State Updates
function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;
}

// 5. Memoized Calculations
const CalculationsMemo = React.memo(function CalculationsSection({
  calculations,
  onRecalculate
}: CalculationsSectionProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  return (
    prevProps.calculations?.lastCalculated === nextProps.calculations?.lastCalculated &&
    prevProps.calculations?.totalLandArea === nextProps.calculations?.totalLandArea
  );
});
```

**Verification**:
- Performance profiling shows consistent 60 FPS
- Memory usage remains stable over time
- Bundle size analysis shows minimal impact
- Visual quality maintained at all performance levels

---

### Task 3.2: Mobile Responsiveness
**Estimated Time**: 5 hours
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] Touch-friendly interface on mobile
- [ ] Responsive panel layout
- [ ] Optimized performance for mobile devices
- [ ] Gesture support for 3D scene

**Implementation**:

```typescript
// app/src/components/ComparisonPanel/MobileComparisonPanel.tsx
function MobileComparisonPanel({ expanded, onToggle }: ComparisonPanelProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragOffset(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - dragOffset;

    // Close if dragged down significantly
    if (diff > 100) {
      onToggle();
      setIsDragging(false);
    }
  }, [isDragging, dragOffset, onToggle]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!expanded) {
    return (
      <div style={mobileStyles.fab} onClick={onToggle}>
        <span style={mobileStyles.fabIcon}>📏</span>
      </div>
    );
  }

  return (
    <div
      style={mobileStyles.bottomSheet}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={mobileStyles.dragHandle} />

      <div style={mobileStyles.content}>
        <MobileSearchSection />
        <MobileCategoryTabs />
        <MobileObjectGrid />
        <MobileCalculations />
      </div>
    </div>
  );
}

// Mobile-optimized subcomponents
function MobileObjectGrid() {
  const { comparison, toggleObjectVisibility } = useAppStore();

  return (
    <div style={mobileStyles.grid}>
      {REFERENCE_OBJECTS.map(object => (
        <div
          key={object.id}
          style={mobileStyles.gridItem}
          onClick={() => toggleObjectVisibility(object.id)}
        >
          <div style={{
            ...mobileStyles.gridIcon,
            backgroundColor: comparison.visibleObjects.has(object.id)
              ? '#3b82f6' : '#f3f4f6'
          }}>
            {getCategoryIcon(object.category)}
          </div>
          <div style={mobileStyles.gridLabel}>
            {object.name}
          </div>
        </div>
      ))}
    </div>
  );
}

// Responsive hook for device detection
function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
}

// Main responsive wrapper
export function ResponsiveComparisonPanel(props: ComparisonPanelProps) {
  const deviceType = useDeviceType();

  if (deviceType === 'mobile') {
    return <MobileComparisonPanel {...props} />;
  }

  return <ComparisonPanel {...props} />;
}

const mobileStyles = {
  fab: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
    zIndex: 1000
  },

  fabIcon: {
    fontSize: '24px',
    color: '#ffffff'
  },

  bottomSheet: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70vh',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    zIndex: 1000
  },

  dragHandle: {
    width: '40px',
    height: '4px',
    backgroundColor: '#d1d5db',
    borderRadius: '2px',
    margin: '8px auto',
    cursor: 'grab'
  },

  content: {
    padding: '16px',
    overflow: 'auto',
    maxHeight: 'calc(70vh - 32px)'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '12px',
    padding: '16px 0'
  },

  gridItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },

  gridIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    transition: 'all 200ms ease'
  },

  gridLabel: {
    fontSize: '10px',
    textAlign: 'center' as const,
    color: '#6b7280',
    lineHeight: '1.2'
  }
};
```

**Verification**:
- Touch interactions work smoothly on mobile devices
- Bottom sheet behavior follows mobile design patterns
- Grid layout adapts to different screen sizes
- Performance remains acceptable on older mobile devices

---

### Task 3.3: Accessibility Implementation
**Estimated Time**: 4 hours
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader compatibility
- [ ] Keyboard navigation support
- [ ] High contrast mode support

**Implementation**:

```typescript
// app/src/components/ComparisonPanel/AccessibleComparisonPanel.tsx
function AccessibleComparisonPanel({ expanded, onToggle }: ComparisonPanelProps) {
  const [focusedObjectId, setFocusedObjectId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<string>('');

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        if (expanded) {
          onToggle();
          announceToScreenReader('Comparison panel closed');
        }
        break;

      case 'Enter':
      case ' ':
        if (focusedObjectId) {
          toggleObjectVisibility(focusedObjectId);
          const object = REFERENCE_OBJECTS.find(obj => obj.id === focusedObjectId);
          const isVisible = comparison.visibleObjects.has(focusedObjectId);
          announceToScreenReader(
            `${object?.name} ${isVisible ? 'shown' : 'hidden'} in scene`
          );
        }
        break;
    }
  }, [expanded, focusedObjectId, onToggle]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncements(message);
    setTimeout(() => setAnnouncements(''), 1000);
  }, []);

  return (
    <div
      role="complementary"
      aria-label="Visual comparison tool"
      aria-expanded={expanded}
      style={accessibleStyles.panel}
    >
      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={accessibleStyles.srOnly}
      >
        {announcements}
      </div>

      <AccessiblePanelHeader
        expanded={expanded}
        onToggle={onToggle}
      />

      {expanded && (
        <>
          <AccessibleSearchSection />
          <AccessibleObjectList
            onFocusChange={setFocusedObjectId}
          />
          <AccessibleCalculationsSection />
        </>
      )}
    </div>
  );
}

function AccessibleObjectList({
  onFocusChange
}: {
  onFocusChange: (objectId: string | null) => void;
}) {
  const { comparison, toggleObjectVisibility } = useAppStore();

  return (
    <div
      role="group"
      aria-label="Reference objects"
      style={accessibleStyles.objectList}
    >
      {REFERENCE_OBJECTS.map((object, index) => (
        <button
          key={object.id}
          role="switch"
          aria-checked={comparison.visibleObjects.has(object.id)}
          aria-label={`Toggle ${object.name} visibility. ${object.metadata.description}`}
          aria-describedby={`object-details-${object.id}`}
          onFocus={() => onFocusChange(object.id)}
          onBlur={() => onFocusChange(null)}
          onClick={() => toggleObjectVisibility(object.id)}
          style={{
            ...accessibleStyles.objectButton,
            backgroundColor: comparison.visibleObjects.has(object.id)
              ? '#3b82f6' : '#f3f4f6'
          }}
        >
          <span style={accessibleStyles.objectName}>
            {object.name}
          </span>

          <span
            id={`object-details-${object.id}`}
            style={accessibleStyles.objectDetails}
          >
            {object.area.toLocaleString()} square meters,
            {object.dimensions.length} by {object.dimensions.width} meters
          </span>
        </button>
      ))}
    </div>
  );
}

// High contrast mode detection and styles
function useHighContrast() {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return highContrast;
}

// Focus management hook
function useFocusManagement(expanded: boolean) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (expanded) {
      previousFocus.current = document.activeElement as HTMLElement;

      // Focus first interactive element in panel
      const firstButton = document.querySelector(
        '[role="complementary"] button, [role="complementary"] input'
      ) as HTMLElement;

      if (firstButton) {
        firstButton.focus();
      }
    } else {
      // Return focus to previous element
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    }
  }, [expanded]);

  // Trap focus within panel when expanded
  useEffect(() => {
    if (!expanded) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = document.querySelectorAll(
        '[role="complementary"] button:not([disabled]), ' +
        '[role="complementary"] input:not([disabled]), ' +
        '[role="complementary"] [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [expanded]);
}

const accessibleStyles = {
  panel: {
    // ... existing styles
    outline: 'none',
    border: '2px solid transparent'
  },

  srOnly: {
    position: 'absolute' as const,
    left: '-10000px',
    top: 'auto',
    width: '1px',
    height: '1px',
    overflow: 'hidden'
  },

  objectButton: {
    width: '100%',
    padding: '12px',
    border: '2px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    outline: 'none',
    textAlign: 'left' as const,

    // Focus styles
    ':focus': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
    }
  },

  objectName: {
    display: 'block',
    fontWeight: 600,
    fontSize: '14px',
    color: '#1f2937'
  },

  objectDetails: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  }
};
```

**Verification**:
- Screen reader testing with NVDA/JAWS
- Keyboard-only navigation testing
- High contrast mode verification
- Color contrast ratio validation (4.5:1 minimum)

---

## Sprint 4: Testing & Integration (Week 6)

### Task 4.1: Comprehensive Unit Testing
**Estimated Time**: 6 hours
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] 70%+ test coverage for comparison features
- [ ] All calculation logic thoroughly tested
- [ ] Component rendering tests
- [ ] State management tests

**Implementation**:

```typescript
// app/src/components/ComparisonPanel/__tests__/ComparisonCalculator.test.ts
describe('ComparisonCalculator', () => {
  const mockShapes: Shape[] = [
    {
      id: 'test-rect',
      type: 'rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 },
        { x: 0, y: 50 }
      ],
      // ... other properties
    }
  ];

  const mockObjects: ReferenceObject[] = [
    {
      id: 'soccer-field',
      name: 'Soccer Field',
      area: 7140,
      // ... other properties
    }
  ];

  test('calculates total land area correctly', () => {
    const result = ComparisonCalculator.calculate(mockShapes, []);
    expect(result.totalLandArea).toBe(5000); // 100 * 50
  });

  test('calculates object quantity that fits', () => {
    const result = ComparisonCalculator.calculate(mockShapes, mockObjects);
    const comparison = result.objectComparisons[0];

    expect(comparison.quantityThatFits).toBe(0.7); // 5000 / 7140 ≈ 0.7
  });

  test('generates appropriate descriptions', () => {
    const result = ComparisonCalculator.calculate(mockShapes, mockObjects);
    const comparison = result.objectComparisons[0];

    expect(comparison.description).toMatch(/soccer field.*larger/i);
  });

  test('handles edge cases', () => {
    const emptyShapes: Shape[] = [];
    const result = ComparisonCalculator.calculate(emptyShapes, mockObjects);

    expect(result.totalLandArea).toBe(0);
    expect(result.objectComparisons).toHaveLength(0);
  });

  test('calculates complex polygon areas', () => {
    const triangleShape: Shape = {
      id: 'triangle',
      type: 'polygon',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 }
      ],
      // ... other properties
    };

    const result = ComparisonCalculator.calculate([triangleShape], []);
    expect(result.totalLandArea).toBeCloseTo(50, 1); // Triangle area = 0.5 * base * height
  });
});

// app/src/components/ComparisonPanel/__tests__/ComparisonPanel.test.tsx
describe('ComparisonPanel', () => {
  const mockStore = {
    comparison: {
      panelExpanded: true,
      visibleObjects: new Set(['soccer-field']),
      searchQuery: '',
      selectedCategory: 'all' as const,
      calculations: null
    },
    toggleObjectVisibility: jest.fn(),
    setComparisonSearch: jest.fn(),
    calculateComparisons: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as jest.Mock).mockReturnValue(mockStore);
  });

  test('renders expanded panel correctly', () => {
    render(<ComparisonPanel expanded={true} onToggle={jest.fn()} />);

    expect(screen.getByText('Visual Comparison')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Find objects...')).toBeInTheDocument();
  });

  test('renders collapsed state', () => {
    render(<ComparisonPanel expanded={false} onToggle={jest.fn()} />);

    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.queryByText('Visual Comparison')).not.toBeInTheDocument();
  });

  test('filters objects by search query', async () => {
    render(<ComparisonPanel expanded={true} onToggle={jest.fn()} />);

    const searchInput = screen.getByPlaceholderText('Find objects...');
    fireEvent.change(searchInput, { target: { value: 'soccer' } });

    await waitFor(() => {
      expect(mockStore.setComparisonSearch).toHaveBeenCalledWith('soccer');
    });
  });

  test('toggles object visibility', () => {
    render(<ComparisonPanel expanded={true} onToggle={jest.fn()} />);

    const toggleButton = screen.getByLabelText(/toggle.*soccer field/i);
    fireEvent.click(toggleButton);

    expect(mockStore.toggleObjectVisibility).toHaveBeenCalledWith('soccer-field');
  });

  test('displays calculations when available', () => {
    const storeWithCalculations = {
      ...mockStore,
      comparison: {
        ...mockStore.comparison,
        calculations: {
          totalLandArea: 5000,
          objectComparisons: [
            {
              objectId: 'soccer-field',
              objectName: 'Soccer Field',
              quantityThatFits: 0.7,
              sizeRatio: 0.7,
              description: 'Soccer field is 1.4x larger than your land',
              percentage: 70
            }
          ],
          lastCalculated: new Date()
        }
      }
    };

    (useAppStore as jest.Mock).mockReturnValue(storeWithCalculations);

    render(<ComparisonPanel expanded={true} onToggle={jest.fn()} />);

    expect(screen.getByText('Your Total Land: 5,000 m²')).toBeInTheDocument();
    expect(screen.getByText('Soccer Field')).toBeInTheDocument();
  });
});

// app/src/store/__tests__/comparisonStore.test.ts
describe('Comparison Store', () => {
  test('toggles object visibility', () => {
    const store = useAppStore.getState();

    // Add object
    store.toggleObjectVisibility('soccer-field');
    expect(store.comparison.visibleObjects.has('soccer-field')).toBe(true);

    // Remove object
    store.toggleObjectVisibility('soccer-field');
    expect(store.comparison.visibleObjects.has('soccer-field')).toBe(false);
  });

  test('sets search query', () => {
    const store = useAppStore.getState();

    store.setComparisonSearch('basketball');
    expect(store.comparison.searchQuery).toBe('basketball');
  });

  test('calculates comparisons', () => {
    const store = useAppStore.getState();

    // Set up test state
    store.shapes = [mockRectangleShape];
    store.comparison.visibleObjects = new Set(['soccer-field']);

    store.calculateComparisons();

    expect(store.comparison.calculations).toBeTruthy();
    expect(store.comparison.calculations!.totalLandArea).toBeGreaterThan(0);
  });
});
```

**Verification**:
- All tests pass consistently
- Coverage report shows 70%+ coverage
- Edge cases and error conditions tested
- Performance tests for large datasets

---

### Task 4.2: Integration Testing
**Estimated Time**: 4 hours
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] End-to-end user workflows tested
- [ ] 3D scene integration verified
- [ ] Cross-component communication tested
- [ ] Performance under load verified

**Implementation**:

```typescript
// app/src/test/__tests__/comparison-integration.test.tsx
describe('Comparison Tool Integration', () => {
  test('complete user workflow: open panel → select objects → view calculations', async () => {
    const { user } = renderWithProviders(<App />);

    // 1. User opens comparison panel
    const compareButton = screen.getByTitle('Visual Comparison Tool');
    await user.click(compareButton);

    expect(screen.getByText('Visual Comparison')).toBeInTheDocument();

    // 2. User selects objects
    const soccerFieldToggle = screen.getByLabelText(/toggle.*soccer field/i);
    await user.click(soccerFieldToggle);

    const basketballCourtToggle = screen.getByLabelText(/toggle.*basketball court/i);
    await user.click(basketballCourtToggle);

    // 3. Calculations should update automatically
    await waitFor(() => {
      expect(screen.getByText(/Your Total Land:/)).toBeInTheDocument();
    });

    // 4. Objects should appear in 3D scene
    await waitFor(() => {
      const canvas = screen.getByRole('img'); // Three.js canvas
      expect(canvas).toBeInTheDocument();
    });
  });

  test('search functionality filters objects correctly', async () => {
    const { user } = renderWithProviders(<App />);

    // Open panel
    await user.click(screen.getByTitle('Visual Comparison Tool'));

    // Search for specific object
    const searchInput = screen.getByPlaceholderText('Find objects...');
    await user.type(searchInput, 'soccer');

    await waitFor(() => {
      expect(screen.getByText('Soccer Field')).toBeInTheDocument();
      expect(screen.queryByText('Basketball Court')).not.toBeInTheDocument();
    });
  });

  test('mobile responsive behavior', async () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    const { user } = renderWithProviders(<App />);

    // Should show FAB instead of panel button
    expect(screen.getByRole('button', { name: /compare/i })).toHaveStyle({
      position: 'fixed',
      bottom: '20px'
    });
  });

  test('keyboard navigation accessibility', async () => {
    const { user } = renderWithProviders(<App />);

    // Open panel with keyboard
    const compareButton = screen.getByTitle('Visual Comparison Tool');
    compareButton.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByText('Visual Comparison')).toBeInTheDocument();

    // Navigate with Tab key
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(screen.getByPlaceholderText('Find objects...'));

    // Close with Escape
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Visual Comparison')).not.toBeInTheDocument();
  });

  test('3D scene object rendering and interaction', async () => {
    const { user } = renderWithProviders(<App />);

    // Add a land shape first
    await user.click(screen.getByTitle('Rectangle Tool'));

    // Draw rectangle in scene (simulate canvas interactions)
    const canvas = screen.getByRole('img');
    await user.pointer([
      { target: canvas, coords: { x: 100, y: 100 } },
      { keys: '[MouseLeft>]' },
      { target: canvas, coords: { x: 200, y: 200 } },
      { keys: '[/MouseLeft]' }
    ]);

    // Open comparison panel and add object
    await user.click(screen.getByTitle('Visual Comparison Tool'));
    await user.click(screen.getByLabelText(/toggle.*soccer field/i));

    // Verify 3D object is rendered (check for specific object in scene)
    await waitFor(() => {
      // This would require Three.js scene inspection
      // In practice, we'd verify through DOM changes or state
      expect(screen.getByText('Soccer Field')).toBeInTheDocument();
    });
  });
});

// Performance integration test
describe('Comparison Tool Performance', () => {
  test('maintains performance with multiple objects', async () => {
    const startTime = performance.now();

    const { user } = renderWithProviders(<App />);

    // Open panel
    await user.click(screen.getByTitle('Visual Comparison Tool'));

    // Enable all objects quickly
    const allToggles = screen.getAllByRole('switch');
    for (const toggle of allToggles) {
      await user.click(toggle);
    }

    // Measure render time
    await waitFor(() => {
      expect(screen.getByText(/Your Total Land:/)).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should complete within reasonable time
    expect(renderTime).toBeLessThan(2000); // 2 seconds max
  });

  test('memory usage remains stable', async () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    const { user, unmount } = renderWithProviders(<App />);

    // Perform multiple operations
    for (let i = 0; i < 10; i++) {
      await user.click(screen.getByTitle('Visual Comparison Tool'));
      await user.click(screen.getByLabelText(/close/i));
    }

    unmount();

    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc();
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB max
  });
});
```

**Verification**:
- All integration tests pass consistently
- Performance benchmarks meet targets
- Cross-browser compatibility verified
- Memory leak detection passes

---

### Task 4.3: Documentation and Finalization
**Estimated Time**: 3 hours
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] Component documentation complete
- [ ] API documentation updated
- [ ] User guide sections added
- [ ] Developer setup instructions

**Implementation**:

```typescript
// app/src/components/ComparisonPanel/README.md
# Visual Comparison Tool

The Visual Comparison Tool allows users to understand land size by comparing their property to familiar reference objects like sports venues, buildings, and landmarks.

## Components

### ComparisonPanel
Main panel component that houses the comparison tool interface.

```tsx
<ComparisonPanel
  expanded={boolean}
  onToggle={() => void}
/>
```

**Props:**
- `expanded`: Whether the panel is currently expanded
- `onToggle`: Callback when panel expand/collapse state changes

### ReferenceObjectRenderer
3D scene component that renders reference objects in the Three.js scene.

```tsx
<ReferenceObjectRenderer
  visibleObjectIds={string[]}
  userLandBounds={BoundingBox}
  opacity={number}
/>
```

## Usage Example

```tsx
import { ComparisonPanel, ReferenceObjectRenderer } from './components/ComparisonPanel';
import { useAppStore } from './store/useAppStore';

function MyApp() {
  const [panelExpanded, setPanelExpanded] = useState(false);
  const { comparison } = useAppStore();

  return (
    <div>
      <ComparisonPanel
        expanded={panelExpanded}
        onToggle={() => setPanelExpanded(!panelExpanded)}
      />

      <Canvas>
        <ReferenceObjectRenderer
          visibleObjectIds={Array.from(comparison.visibleObjects)}
          userLandBounds={calculateBounds()}
        />
      </Canvas>
    </div>
  );
}
```

## State Management

The comparison tool uses Zustand store for state management:

```typescript
const {
  comparison: {
    panelExpanded,
    visibleObjects,
    searchQuery,
    selectedCategory,
    calculations
  },
  toggleComparisonPanel,
  toggleObjectVisibility,
  setComparisonSearch,
  calculateComparisons
} = useAppStore();
```

## Reference Objects

Objects are defined in `src/data/referenceObjects.ts`:

```typescript
const REFERENCE_OBJECTS: ReferenceObject[] = [
  {
    id: 'soccer-field',
    name: 'Soccer Field (FIFA)',
    category: 'sports',
    area: 7140,
    dimensions: { length: 105, width: 68 },
    // ... other properties
  }
];
```

## Performance Considerations

- Uses object pooling for 3D geometries
- Implements frustum culling for off-screen objects
- LOD (Level of Detail) for distant objects
- Debounced search input
- Memoized calculations

## Accessibility

- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support
- High contrast mode support
- Focus management

## Testing

Run the test suite:

```bash
npm test -- --testPathPattern="comparison"
```

Coverage report:
```bash
npm run test:coverage
```
```

```markdown
// docs/features/visual-comparison-tool.md
# Visual Comparison Tool Feature Guide

## Overview

The Visual Comparison Tool helps users understand land size by comparing their property to familiar reference objects. Users can visualize how many soccer fields, basketball courts, houses, or famous landmarks would fit on their land.

## Getting Started

### Opening the Tool

1. **Desktop**: Click the "Compare" button in the ribbon toolbar
2. **Mobile**: Tap the floating comparison button (📏) in the bottom-right corner

### Basic Usage

1. **Select Objects**: Browse categories (Sports, Buildings, Landmarks, Nature) and toggle objects on/off
2. **View in 3D**: Selected objects appear in the 3D scene alongside your land
3. **Read Calculations**: The bottom panel shows how many objects fit and size comparisons

## Features

### Object Categories

**Sports Venues**
- Soccer Field (FIFA regulation: 7,140 m²)
- Basketball Court (FIBA: 420 m²)
- Tennis Court (ITF: 261 m²)
- American Football Field (5,351 m²)

**Buildings**
- Average House (200 m² footprint)
- Parking Space (12.5 m²)
- City Block (varies: 6,000-10,000 m²)

**Famous Landmarks**
- Eiffel Tower Base (125m × 125m)
- Times Square (26,000 m²)

**Natural References**
- Garden Plot (100 m²)
- Golf Hole (1,200 m²)

### Search Functionality

Use the search box to quickly find specific objects:
- Type "soccer" to find soccer-related objects
- Search by size: "small", "large"
- Search by description content

### Calculations Display

The tool shows:
- **Total land area** in your preferred units
- **Quantity calculations**: How many objects fit
- **Size ratios**: Your land vs. object size
- **Percentage breakdowns**: What portion each object represents

## Tips and Best Practices

### For Accurate Comparisons

1. **Draw your land accurately**: Use the drawing tools to create shapes that match your actual property
2. **Consider multiple objects**: Compare to both smaller and larger references for better perspective
3. **Use familiar objects**: Start with objects you know well (like parking spaces or soccer fields)

### Performance Tips

- **Limit visible objects**: For best performance, show 5-10 objects at once
- **Mobile considerations**: Use fewer objects on mobile devices for smooth interaction

## Keyboard Shortcuts

- **Ctrl/Cmd + C**: Toggle comparison panel
- **Escape**: Close comparison panel
- **Tab**: Navigate between objects
- **Enter/Space**: Toggle object visibility

## Accessibility

The tool is fully accessible:
- **Screen readers**: All objects and calculations are announced
- **Keyboard navigation**: Complete functionality without mouse
- **High contrast**: Supports system high contrast modes
- **Focus management**: Clear focus indicators and logical tab order

## Troubleshooting

### Common Issues

**Objects not appearing in 3D scene**
- Ensure objects are toggled on (blue toggle switch)
- Check that your land shapes are drawn correctly
- Zoom out to see objects positioned around your land

**Performance issues**
- Reduce number of visible objects
- Close other browser tabs
- Update to latest browser version

**Calculations seem incorrect**
- Verify your land shapes are closed polygons
- Check unit settings in preferences
- Ensure shapes don't overlap incorrectly

### Technical Support

For technical issues:
1. Check browser console for errors
2. Verify WebGL support: visit `webglreport.com`
3. Update graphics drivers
4. Try in incognito/private browsing mode

## Advanced Usage

### Custom Workflows

**Real Estate Professionals**
1. Draw client's property accurately
2. Select relevant comparison objects for the market
3. Take screenshots for presentations
4. Export measurements for documentation

**Educators**
1. Use for teaching area and scale concepts
2. Compare historical landmarks to modern spaces
3. Demonstrate mathematical relationships visually

**Developers and Planners**
1. Visualize project scale early in planning
2. Communicate size to stakeholders
3. Compare to existing neighborhood features
```

**Verification**:
- Documentation is clear and comprehensive
- All code examples work correctly
- User guide covers common scenarios
- Developer documentation includes setup steps

---

## Summary

This comprehensive task breakdown provides:

1. **Complete implementation roadmap** with 6-week timeline
2. **Detailed code examples** for all major components
3. **Performance optimization strategies** for smooth operation
4. **Comprehensive testing approach** with 70%+ coverage target
5. **Full accessibility implementation** meeting WCAG 2.1 AA standards
6. **Mobile-responsive design** with touch-friendly interactions
7. **Integration with existing architecture** following project conventions

**Total Estimated Effort**: 6 weeks for 1 senior developer
**Risk Assessment**: Low risk - builds on established patterns
**Constitution Compliance**: ✅ All 9 articles followed

The specification is ready for implementation with clear acceptance criteria, detailed technical plans, and comprehensive testing strategies.