import React, { useState } from 'react';
import { useCategoryData } from '../../hooks/useCategoryData';
import type { ReferenceCategory, ReferenceObject } from '../../types/referenceObjects';
import Icon from '../Icon';

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
  const { categoryDisplayNames, categoryIcons, loading } = useCategoryData();
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

  // If a specific category is selected, only show that category
  const categoriesToShow = selectedCategory === 'all'
    ? (['sports', 'buildings', 'landmarks', 'nature'] as ReferenceCategory[])
    : [selectedCategory as ReferenceCategory];

  if (loading) {
    return (
      <div style={{...styles.objectList, ...styles.loadingContainer}}>
        <div style={styles.loadingText}>Loading objects...</div>
      </div>
    );
  }

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
                icon={categoryIcons[category]}
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
  icon: string;
  isExpanded: boolean;
  objectCount: number;
  visibleCount: number;
  onToggle: () => void;
}

function CategoryHeader({
  displayName,
  icon,
  isExpanded,
  objectCount,
  visibleCount,
  onToggle
}: CategoryHeaderProps) {
  return (
    <button
      style={styles.categoryHeader}
      onClick={onToggle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div style={styles.categoryLeft}>
        <span style={{
          ...styles.categoryIcon,
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>
          <Icon name="chevron-right" size={14} />
        </span>
        <span style={styles.categoryName}>{displayName}</span>
      </div>
      <div style={styles.categoryStats}>
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
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    fontFamily: 'inherit',
    outline: 'none'
  },

  categoryLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  categoryIcon: {
    fontSize: '10px',
    color: '#6b7280',
    transition: 'transform 200ms ease'
  },

  categoryEmoji: {
    fontSize: '16px'
  },

  categoryName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937'
  },

  categoryStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: '12px'
  },

  visibleCount: {
    color: '#3b82f6',
    fontWeight: 600
  },

  divider: {
    color: '#d1d5db'
  },

  totalCount: {
    color: '#6b7280'
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
    width: '44px',
    height: '24px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#f3f4f6',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
    outline: 'none',
    position: 'relative' as const
  },

  visibilityButtonActive: {
    backgroundColor: '#3b82f6'
  },

  toggleCircle: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    transition: 'all 200ms ease',
    transform: 'translateX(0px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },

  toggleCircleActive: {
    transform: 'translateX(20px)'
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