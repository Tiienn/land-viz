import React, { useState } from 'react';
import { CATEGORY_DISPLAY_NAMES, CATEGORY_ICONS } from '../../data/referenceObjects';
import type { ReferenceCategory, ReferenceObject } from '../../types/referenceObjects';

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
                displayName={CATEGORY_DISPLAY_NAMES[category]}
                icon={CATEGORY_ICONS[category]}
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
        </div>
      )}
    </div>
  );
}

function filteredObjectCount(
  objectsByCategory: Record<ReferenceCategory, ReferenceObject[]>,
  categories: ReferenceCategory[]
): number {
  return categories.reduce((sum, cat) => sum + objectsByCategory[cat].length, 0);
}

function CategoryHeader({
  displayName,
  icon,
  isExpanded,
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
    <div
      style={styles.categoryHeader}
      onClick={onToggle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f3f4f6';
      }}
    >
      <div style={styles.categoryInfo}>
        <span style={styles.categoryName}>{displayName}</span>
        {visibleCount > 0 && (
          <span style={styles.categoryCount}>
            ({visibleCount} active)
          </span>
        )}
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.objectCard,
        backgroundColor: isHovered ? '#f9fafb' : '#ffffff'
      }}
      onClick={onToggleVisibility}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.objectInfo}>
        <div style={styles.objectMain}>
          <div style={styles.objectName}>{object.name}</div>
          <div style={styles.objectDetails}>
            {object.area.toLocaleString()} m² • {object.dimensions.length}×{object.dimensions.width}m
          </div>
          {isHovered && (
            <div style={styles.objectDescription}>
              {object.metadata.description}
            </div>
          )}
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
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      aria-label={ariaLabel}
      aria-pressed={checked}
    >
      <div style={{
        ...styles.toggleKnob,
        transform: checked ? 'translateX(16px)' : 'translateX(0px)'
      }} />
    </button>
  );
}

const styles = {
  objectList: {
    flex: 1,
    overflowY: 'auto' as const,
    minHeight: '200px'
  },

  categorySection: {
    borderBottom: '1px solid #f3f4f6'
  },

  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'background-color 200ms ease',
    backgroundColor: '#f3f4f6',
    userSelect: 'none' as const
  },

  categoryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1
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
    color: '#3b82f6',
    fontWeight: 500
  },

  expandIcon: {
    fontSize: '10px',
    color: '#6b7280',
    transition: 'transform 200ms ease'
  },

  categoryContent: {
    backgroundColor: '#ffffff'
  },

  objectCard: {
    padding: '8px 12px',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 200ms ease',
    cursor: 'pointer'
  },

  objectInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px'
  },

  objectMain: {
    flex: 1
  },

  objectName: {
    fontSize: '14px',
    fontWeight: 600,
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
    lineHeight: 1.4,
    marginTop: '4px'
  },

  toggle: {
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'background-color 200ms ease',
    outline: 'none',
    flexShrink: 0
  },

  toggleKnob: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    transition: 'transform 200ms ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
  },

  emptyState: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: '#9ca3af'
  },

  emptyIcon: {
    fontSize: '32px',
    marginBottom: '8px',
    opacity: 0.5
  },

  emptyText: {
    fontSize: '14px'
  }
};