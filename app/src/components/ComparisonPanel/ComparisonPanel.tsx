import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { REFERENCE_OBJECTS } from '../../data/referenceObjects';
import { ObjectList } from './ObjectList';
import { CalculationsSection } from './CalculationsSection';
import { SearchSection } from './SearchSection';
import { CategoryTabs } from './CategoryTabs';
import { MobileComparisonPanel } from './MobileComparisonPanel';
import { tokens } from '../../styles/tokens';
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
          e.currentTarget.style.backgroundColor = tokens.colors.neutral[100];
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

// Styles following Canva design system with design tokens
const styles = {
  panel: {
    position: 'fixed' as const,
    right: tokens.spacing[4],
    top: '120px',
    width: '360px',
    maxHeight: 'calc(100vh - 140px)',
    backgroundColor: tokens.colors.background.primary,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadows.xl,
    overflow: 'hidden',
    transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.easeOut}`,
    fontFamily: tokens.typography.fontFamily.primary,
    zIndex: tokens.zIndex.panel,
    display: 'flex',
    flexDirection: 'column' as const
  },

  inlinePanel: {
    height: '100%',
    backgroundColor: tokens.colors.background.primary,
    overflow: 'hidden',
    fontFamily: tokens.typography.fontFamily.primary,
    display: 'flex',
    flexDirection: 'column' as const
  },

  collapsedPanel: {
    position: 'fixed' as const,
    right: tokens.spacing[4],
    top: '280px',
    width: '60px',
    height: '60px',
    backgroundColor: tokens.colors.background.primary,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadows.md,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.easeOut}`,
    zIndex: tokens.zIndex.panel,
    gap: tokens.spacing[1]
  },

  collapsedIcon: {
    fontSize: tokens.typography.h3.size
  },

  collapsedText: {
    fontSize: tokens.typography.caption.size,
    fontWeight: tokens.typography.label.weight,
    color: tokens.colors.neutral[500]
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing[4]} ${tokens.spacing[5]}`,
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
    backgroundColor: tokens.colors.neutral[50],
    flexShrink: 0
  },

  title: {
    margin: 0,
    fontSize: tokens.typography.body.size,
    fontWeight: tokens.typography.h1.weight,
    color: tokens.colors.neutral[700],
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2]
  },

  titleIcon: {
    color: tokens.colors.neutral[500],
    flexShrink: 0
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: tokens.typography.h1.size,
    cursor: 'pointer',
    color: tokens.colors.neutral[500],
    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
    borderRadius: tokens.radius.sm,
    transition: `all ${tokens.animation.timing.smooth} ease`,
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