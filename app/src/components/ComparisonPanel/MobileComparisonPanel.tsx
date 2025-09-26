import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { REFERENCE_OBJECTS, searchReferenceObjects, filterByCategory } from '../../data/referenceObjects';
import type { ReferenceObject } from '../../types/referenceObjects';
import type { ReferenceCategory } from '../../types/referenceObjects';
import { ComparisonCalculator } from '../../utils/comparisonCalculations';

interface MobileComparisonPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileComparisonPanel({ isOpen, onClose }: MobileComparisonPanelProps) {
  const {
    comparison,
    shapes,
    toggleObjectVisibility,
    setComparisonSearch,
    setComparisonCategory,
    calculateComparisons
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'objects' | 'comparisons'>('objects');

  // Filter and search objects
  const filteredObjects = useMemo(() => {
    let objects = REFERENCE_OBJECTS;

    if (comparison.searchQuery) {
      objects = searchReferenceObjects(objects, comparison.searchQuery);
    }

    if (comparison.selectedCategory && comparison.selectedCategory !== 'all') {
      objects = filterByCategory(objects, comparison.selectedCategory);
    }

    return objects;
  }, [comparison.searchQuery, comparison.selectedCategory]);

  // Calculate comparisons when objects change
  React.useEffect(() => {
    calculateComparisons();
  }, [comparison.visibleObjects, shapes, calculateComparisons]);

  const handleToggleObject = (objectId: string) => {
    toggleObjectVisibility(objectId);
  };

  const categories: Array<{ id: ReferenceCategory | 'all'; label: string; emoji: string }> = [
    { id: 'all', label: 'All', emoji: '🌐' },
    { id: 'sports', label: 'Sports', emoji: '⚽' },
    { id: 'buildings', label: 'Buildings', emoji: '🏢' },
    { id: 'landmarks', label: 'Landmarks', emoji: '🗼' },
    { id: 'nature', label: 'Nature', emoji: '🌱' }
  ];

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>Compare Land Size</h3>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('objects')}
            style={{
              ...styles.tab,
              ...(activeTab === 'objects' ? styles.tabActive : {})
            }}
          >
            Reference Objects
          </button>
          <button
            onClick={() => setActiveTab('comparisons')}
            style={{
              ...styles.tab,
              ...(activeTab === 'comparisons' ? styles.tabActive : {}),
              ...(comparison.visibleObjects.size === 0 ? styles.tabDisabled : {})
            }}
            disabled={comparison.visibleObjects.size === 0}
          >
            Comparisons ({comparison.visibleObjects.size})
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'objects' ? (
            <>
              {/* Search */}
              <div style={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search objects..."
                  value={comparison.searchQuery}
                  onChange={(e) => setComparisonSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              {/* Categories */}
              <div style={styles.categories}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setComparisonCategory(cat.id)}
                    style={{
                      ...styles.categoryButton,
                      ...(comparison.selectedCategory === cat.id ? styles.categoryActive : {})
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Object List */}
              <div style={styles.objectList}>
                {filteredObjects.map(object => (
                  <div key={object.id} style={styles.objectItem}>
                    <div style={styles.objectInfo}>
                      <div style={styles.objectName}>{object.name}</div>
                      <div style={styles.objectArea}>{object.area.toLocaleString()} m²</div>
                    </div>
                    <button
                      onClick={() => handleToggleObject(object.id)}
                      style={{
                        ...styles.toggleButton,
                        ...(comparison.visibleObjects.has(object.id) ? styles.toggleActive : {})
                      }}
                    >
                      {comparison.visibleObjects.has(object.id) ? '✓' : '+'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={styles.comparisons}>
              {comparison.calculations && (
                <>
                  <div style={styles.totalArea}>
                    <div>Your Total Land</div>
                    <div style={styles.totalValue}>
                      {ComparisonCalculator.formatArea(comparison.calculations.totalLandArea)}
                    </div>
                  </div>

                  {comparison.calculations.objectComparisons.map(comp => (
                    <div key={comp.objectId} style={styles.comparisonItem}>
                      <div style={styles.comparisonHeader}>
                        <span>{comp.objectName}</span>
                        <span style={styles.fitCount}>{comp.quantityThatFits} fit</span>
                      </div>
                      <div style={styles.comparisonDesc}>{comp.description}</div>
                      <div style={styles.percentage}>
                        {comp.percentage < 1
                          ? 'Less than 1%'
                          : comp.percentage > 100
                            ? `${(comp.percentage / 100).toFixed(1)}x your land`
                            : `${comp.percentage.toFixed(1)}% of your land`
                        }
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'flex-end'
  },

  panel: {
    width: '100%',
    maxHeight: '80vh',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb'
  },

  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#1f2937'
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px'
  },

  tabs: {
    display: 'flex',
    padding: '0 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },

  tab: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    color: '#6b7280',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 200ms ease'
  },

  tabActive: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6'
  },

  tabDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },

  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px'
  },

  searchContainer: {
    marginBottom: '16px'
  },

  searchInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none'
  },

  categories: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto' as const,
    marginBottom: '16px',
    paddingBottom: '8px'
  },

  categoryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#6b7280',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 200ms ease'
  },

  categoryActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    color: '#ffffff'
  },

  objectList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },

  objectItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },

  objectInfo: {
    flex: 1
  },

  objectName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '2px'
  },

  objectArea: {
    fontSize: '12px',
    color: '#6b7280'
  },

  toggleButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid #e5e7eb',
    backgroundColor: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 200ms ease'
  },

  toggleActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    color: '#ffffff'
  },

  comparisons: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },

  totalArea: {
    backgroundColor: '#f3f4f6',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginBottom: '8px'
  },

  totalValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1f2937',
    marginTop: '4px'
  },

  comparisonItem: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px'
  },

  comparisonHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },

  fitCount: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: '#dcfce7',
    color: '#15803d'
  },

  comparisonDesc: {
    fontSize: '12px',
    color: '#4b5563',
    lineHeight: 1.4,
    marginBottom: '6px'
  },

  percentage: {
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'right' as const
  }
};