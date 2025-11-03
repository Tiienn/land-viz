import React, { useState } from 'react';
import type { ReferenceCategory, ReferenceObject } from '../../types/referenceObjects';
import Icon from '../Icon';

// Map categories to SVG icon names
const categoryIconNames: Record<ReferenceCategory, string> = {
  sports: 'sports',
  buildings: 'building',
  landmarks: 'landmark',
  nature: 'nature'
};

// Category display names
const categoryDisplayNames: Record<ReferenceCategory, string> = {
  sports: 'Sports Venues',
  buildings: 'Buildings',
  landmarks: 'Famous Landmarks',
  nature: 'Natural References'
};

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
    new Set() // All collapsed by default for cleaner UI
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

  // If a specific category is selected, only show that category
  const categoriesToShow = selectedCategory === 'all'
    ? (['sports', 'buildings', 'landmarks', 'nature'] as ReferenceCategory[])
    : [selectedCategory as ReferenceCategory];

  return (
    <div style={styles.objectList}>
      {categoriesToShow.map(category => {
        const objects = objectsByCategory[category];
        const isExpanded = expandedCategories.has(category) || selectedCategory !== 'all';
        const visibleCount = objects.filter(obj => visibleObjects.has(obj.id)).length;

        // Skip empty categories
        if (objects.length === 0) return null;

        return (
          <div key={category} style={styles.categorySection}>
            {selectedCategory === 'all' && (
              <CategoryHeader
                category={category}
                displayName={categoryDisplayNames[category]}
                iconName={categoryIconNames[category]}
                isExpanded={isExpanded}
                objectCount={objects.length}
                visibleCount={visibleCount}
                onToggle={() => toggleCategory(category)}
              />
            )}

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

      {filteredObjectCount(objectsByCategory, categoriesToShow) === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔍</div>
          <div style={styles.emptyText}>No objects found</div>
          <div style={styles.emptySubtext}>Try adjusting your search or category filter</div>
        </div>
      )}
    </div>
  );
}

// Helper Components
interface CategoryHeaderProps {
  category: ReferenceCategory;
  displayName: string;
  iconName: string;
  isExpanded: boolean;
  objectCount: number;
  visibleCount: number;
  onToggle: () => void;
}

function CategoryHeader({
  displayName,
  iconName,
  isExpanded,
  objectCount,
  visibleCount,
  onToggle
}: CategoryHeaderProps) {
  return (
    <button
      style={styles.categoryHeader}
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-label={`${displayName} category, ${objectCount} objects`}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f9fafb';
        e.currentTarget.style.borderColor = '#00C4CC';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div style={styles.categoryLeft}>
        <span style={{
          ...styles.categoryIcon,
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>
          <Icon name="chevron-right" size={16} />
        </span>
        <span style={styles.categoryIconWrapper}>
          <Icon
            name={iconName}
            size={18}
            color="#6b7280"
            strokeWidth={2}
          />
        </span>
        <span style={styles.categoryName}>{displayName}</span>
      </div>
      <div style={styles.categoryStats}>
        {visibleCount > 0 && (
          <>
            <span style={styles.visibleCount}>{visibleCount}</span>
            <span style={styles.divider}>/</span>
          </>
        )}
        <span style={styles.totalCount}>{objectCount}</span>
      </div>
    </button>
  );
}

interface ObjectCardProps {
  object: ReferenceObject;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

function ObjectCard({ object, isVisible, onToggleVisibility }: ObjectCardProps) {
  return (
    <div style={styles.objectCard}>
      <div style={styles.objectInfo}>
        <div style={styles.objectName}>{object.name}</div>
        <div style={styles.objectSize}>
          {object.dimensions ?
            `${object.dimensions.length}m × ${object.dimensions.width}m (${object.area.toLocaleString()} m²)` :
            object.metadata.description
          }
        </div>
      </div>

      <button
        style={{
          ...styles.visibilityButton,
          ...(isVisible ? styles.visibilityButtonActive : {})
        }}
        onClick={onToggleVisibility}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <div style={{
          ...styles.toggleCircle,
          ...(isVisible ? styles.toggleCircleActive : {})
        }} />
      </button>
    </div>
  );
}

// Helper function
function filteredObjectCount(
  objectsByCategory: Record<ReferenceCategory, ReferenceObject[]>,
  categories: ReferenceCategory[]
): number {
  return categories.reduce((total, category) => {
    return total + objectsByCategory[category].length;
  }, 0);
}

const styles = {
  objectList: {
    padding: '12px',
    maxHeight: '400px',
    overflowY: 'auto' as const,
    backgroundColor: '#ffffff'
  },

  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100px'
  },

  loadingText: {
    color: '#6b7280',
    fontSize: '14px'
  },

  categorySection: {
    marginBottom: '8px'
  },

  categoryHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',        // Increased padding for better touch targets
    minHeight: '44px',      // WCAG 2.1 minimum touch target
    border: '1.5px solid transparent',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    outline: 'none',
    marginBottom: '4px'     // Spacing between categories
  },

  categoryLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'             // Increased gap for better visual separation
  },

  categoryIcon: {
    fontSize: '14px',       // Larger chevron
    color: '#6b7280',
    transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',          // Fixed width for alignment
    height: '20px'
  },

  categoryIconWrapper: {
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',          // Fixed width for consistent alignment
    height: '20px'
  },

  categoryName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
    letterSpacing: '0.2px'
  },

  categoryStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',             // Better spacing
    fontSize: '12px',
    backgroundColor: '#f3f4f6',
    padding: '4px 10px',    // Pill-shaped badge
    borderRadius: '12px',
    fontWeight: 600
  },

  visibleCount: {
    color: '#00C4CC',       // Canva teal for active objects
    fontWeight: 700
  },

  divider: {
    color: '#d1d5db',
    fontWeight: 400
  },

  totalCount: {
    color: '#6b7280',
    fontWeight: 600
  },

  categoryContent: {
    paddingLeft: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },

  objectCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#f9fafb',
    transition: 'all 200ms ease'
  },

  objectInfo: {
    flex: 1
  },

  objectName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1f2937',
    marginBottom: '2px'
  },

  objectSize: {
    fontSize: '11px',
    color: '#6b7280'
  },

  visibilityButton: {
    width: '48px',          // Slightly wider for better usability
    height: '26px',         // Slightly taller
    border: 'none',
    borderRadius: '13px',
    backgroundColor: '#e5e7eb',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    padding: '3px',
    outline: 'none',
    position: 'relative' as const,
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  visibilityButtonActive: {
    background: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)', // Canva gradient
    boxShadow: '0 2px 6px rgba(0, 196, 204, 0.3)' // Brand glow
  },

  toggleCircle: {
    width: '20px',          // Larger circle
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'translateX(0px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
  },

  toggleCircleActive: {
    transform: 'translateX(22px)' // Adjusted for new button width
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center' as const
  },

  emptyIcon: {
    fontSize: '32px',
    marginBottom: '12px',
    opacity: 0.5
  },

  emptyText: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1f2937',
    marginBottom: '4px'
  },

  emptySubtext: {
    fontSize: '12px',
    color: '#6b7280'
  }
};