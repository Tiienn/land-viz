import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { REFERENCE_OBJECTS } from '../../data/referenceObjects';
import { ObjectList } from './ObjectList';
import { CalculationsSection } from './CalculationsSection';
import { SearchSection } from './SearchSection';
import { CategoryTabs } from './CategoryTabs';
import { MobileComparisonPanel } from './MobileComparisonPanel';
import type { ReferenceCategory, ReferenceObject } from '../../types/referenceObjects';

interface ComparisonPanelProps {
  expanded: boolean;
  onToggle: () => void;
  inline?: boolean;
}

export function ComparisonPanel({ expanded, onToggle, inline = false }: ComparisonPanelProps) {
  const {
    comparison,
    toggleObjectVisibility,
    setComparisonSearch,
    setComparisonCategory,
    calculateComparisons
  } = useAppStore();

  const [searchDebounce, setSearchDebounce] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounced search
  useEffect(() => {
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

  // Auto-calculate when visible objects or shapes change
  useEffect(() => {
    if (comparison.visibleObjects.size > 0) {
      calculateComparisons();
    }
  }, [comparison.visibleObjects, calculateComparisons]);

  if (!expanded) {
    return (
      <div style={styles.collapsedPanel} onClick={onToggle}>
        <div style={styles.collapsedIcon}>📏</div>
        <div style={styles.collapsedText}>Compare</div>
      </div>
    );
  }

  // Render mobile version for mobile devices
  if (isMobile) {
    return (
      <MobileComparisonPanel
        isOpen={expanded}
        onClose={onToggle}
      />
    );
  }

  return (
    <div style={inline ? styles.inlinePanel : styles.panel}>
      <ComparisonPanelHeader onToggle={onToggle} inline={inline} />

      <div style={styles.content}>
        <SearchSection
          value={searchDebounce}
          onChange={setSearchDebounce}
          onReset={() => {
            setSearchDebounce('');
            setComparisonCategory('all');
          }}
        />

        <CategoryTabs
          selected={comparison.selectedCategory}
          onChange={setComparisonCategory}
          counts={{
            all: REFERENCE_OBJECTS.length,
            sports: REFERENCE_OBJECTS.filter(obj => obj.category === 'sports').length,
            buildings: REFERENCE_OBJECTS.filter(obj => obj.category === 'buildings').length,
            landmarks: REFERENCE_OBJECTS.filter(obj => obj.category === 'landmarks').length,
            nature: REFERENCE_OBJECTS.filter(obj => obj.category === 'nature').length
          }}
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

function ComparisonPanelHeader({ onToggle, inline = false }: { onToggle: () => void; inline?: boolean }) {
  return (
    <div style={styles.header}>
      <h3 style={styles.title}>
        Visual Comparison
      </h3>
      <button
        style={styles.closeButton}
        onClick={onToggle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title={inline ? "Collapse comparison panel" : "Close comparison panel"}
      >
        {inline ? '◀' : '×'}
      </button>
    </div>
  );
}

// Styles following Canva design system with inline styles
const styles = {
  panel: {
    position: 'fixed' as const,
    right: '16px',
    top: '120px',
    width: '360px',
    maxHeight: 'calc(100vh - 140px)',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    transition: 'all 200ms ease-out',
    fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column' as const
  },

  inlinePanel: {
    height: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const
  },

  collapsedPanel: {
    position: 'fixed' as const,
    right: '16px',
    top: '280px',
    width: '60px',
    height: '60px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
    zIndex: 1000,
    gap: '4px'
  },

  collapsedIcon: {
    fontSize: '20px'
  },

  collapsedText: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fafafa',
    flexShrink: 0
  },

  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  titleIcon: {
    color: '#6b7280',
    flexShrink: 0
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 200ms ease',
    lineHeight: 1,
    fontWeight: 300
  },

  content: {
    overflow: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const
  }
};

export default ComparisonPanel;