import { useState, useEffect } from 'react';
import type { ReferenceCategory } from '../types/referenceObjects';
import { logger } from '../utils/logger';

/**
 * Hook for lazy loading category data to prevent mixed import issues
 */
export function useCategoryData() {
  const [categoryDisplayNames, setCategoryDisplayNames] = useState<Record<ReferenceCategory, string>>({
    sports: 'Sports',
    buildings: 'Buildings',
    landmarks: 'Landmarks',
    nature: 'Nature'
  });
  const [categoryIcons, setCategoryIcons] = useState<Record<ReferenceCategory, string>>({
    sports: '⚽',
    buildings: '🏢',
    landmarks: '🗽',
    nature: '🌳'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        const { CATEGORY_DISPLAY_NAMES, CATEGORY_ICONS } = await import('../data/referenceObjects');
        setCategoryDisplayNames(CATEGORY_DISPLAY_NAMES);
        setCategoryIcons(CATEGORY_ICONS);
      } catch (error) {
        logger.error('[useCategoryData]', 'Failed to load category data:', error);
        // Keep fallback data
      } finally {
        setLoading(false);
      }
    };

    loadCategoryData();
  }, []);

  return { categoryDisplayNames, categoryIcons, loading };
}