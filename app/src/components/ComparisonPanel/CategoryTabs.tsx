import React from 'react';
import Icon from '../Icon';
import type { ReferenceCategory } from '../../types/referenceObjects';

interface CategoryTabsProps {
  selected: ReferenceCategory | 'all';
  onChange: (category: ReferenceCategory | 'all') => void;
  counts: Record<ReferenceCategory | 'all', number>;
}

// Map categories to SVG icon names
const categoryIconNames: Record<ReferenceCategory | 'all', string> = {
  all: 'all',
  sports: 'sports',
  buildings: 'building',
  landmarks: 'landmark',
  nature: 'nature'
};

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
        const iconName = categoryIconNames[category];
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
            aria-label={`Filter by ${label}`}
            aria-pressed={isSelected}
          >
            <span style={styles.tabIcon}>
              <Icon
                name={iconName}
                size={18}
                color={isSelected ? '#ffffff' : '#6b7280'}
                strokeWidth={2}
              />
            </span>
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
    gap: '8px',
    padding: '12px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    overflowX: 'auto' as const,
    scrollbarWidth: 'thin' as const
  },

  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px', // Balanced padding for readability
    minHeight: '44px',    // WCAG 2.1 minimum touch target
    border: '1.5px solid transparent',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    fontSize: '14px',     // Larger text
    fontWeight: 600,      // Bolder for better readability
    color: '#6b7280',
    whiteSpace: 'nowrap' as const,
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', // Subtle depth
    flexShrink: 0         // Prevent tabs from shrinking below content size
  },

  selectedTab: {
    background: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)', // Canva teal-purple gradient
    color: '#ffffff',
    borderColor: 'transparent',
    boxShadow: '0 4px 12px rgba(0, 196, 204, 0.3)', // Brand glow
    transform: 'translateY(-1px)' // Subtle lift effect
  },

  tabIcon: {
    fontSize: '18px',     // Larger icons
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  tabLabel: {
    fontSize: '14px',     // Larger label text
    fontWeight: 600,
    letterSpacing: '0.3px'
  },

  tabCount: {
    fontSize: '12px',     // Slightly larger count
    padding: '3px 8px',   // More padding
    borderRadius: '12px', // More rounded (pill shape)
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    minWidth: '24px',
    textAlign: 'center' as const,
    fontWeight: 700       // Bolder count
  },

  selectedCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    color: '#ffffff',
    fontWeight: 700
  }
};