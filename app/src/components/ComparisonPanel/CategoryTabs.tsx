import React from 'react';
import { CATEGORY_ICONS } from '../../data/referenceObjects';
import type { ReferenceCategory } from '../../types/referenceObjects';

interface CategoryTabsProps {
  selected: ReferenceCategory | 'all';
  onChange: (category: ReferenceCategory | 'all') => void;
  counts: Record<ReferenceCategory | 'all', number>;
}

export function CategoryTabs({ selected, onChange, counts }: CategoryTabsProps) {
  const categories: (ReferenceCategory | 'all')[] = ['all', 'sports', 'buildings', 'landmarks', 'nature'];

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Enable horizontal scrolling with mouse wheel
    if (e.deltaY !== 0) {
      // Don't use preventDefault() in passive event listeners
      // Instead, just update scroll position
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  return (
    <div style={styles.container} onWheel={handleWheel}>
      {categories.map(category => {
        const isSelected = selected === category;
        const icon = category === 'all' ? '🌐' : CATEGORY_ICONS[category];
        const label = category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1);

        return (
          <button
            key={category}
            style={{
              ...styles.tab,
              ...(isSelected ? styles.selectedTab : {})
            }}
            onClick={() => onChange(category)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={styles.tabIcon}>{icon}</span>
            <span style={styles.tabLabel}>{label}</span>
            <span style={{
              ...styles.tabCount,
              ...(isSelected ? styles.selectedCount : {})
            }}>
              {counts[category]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '4px',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    overflowX: 'auto' as const
  },

  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    fontFamily: 'inherit',
    fontSize: '12px',
    fontWeight: 500,
    color: '#6b7280',
    whiteSpace: 'nowrap' as const,
    outline: 'none'
  },

  selectedTab: {
    backgroundColor: '#3b82f6',
    color: '#ffffff'
  },

  tabIcon: {
    fontSize: '14px'
  },

  tabLabel: {
    fontSize: '12px'
  },

  tabCount: {
    fontSize: '11px',
    padding: '2px 4px',
    borderRadius: '4px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    minWidth: '18px',
    textAlign: 'center' as const
  },

  selectedCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff'
  }
};