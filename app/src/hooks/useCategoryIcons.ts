import { useState, useEffect } from 'react';
import type { ReferenceCategory } from '../types/referenceObjects';
import { logger } from '../utils/logger';

/**
 * Hook for lazy loading category icons to prevent mixed import issues
 */
export function useCategoryIcons() {
  const [categoryIcons, setCategoryIcons] = useState<Record<ReferenceCategory, string>>({
    sports: '⚽',
    buildings: '🏢',
    landmarks: '🗽',
    nature: '🌳'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoryIcons = async () => {
      try {
        const { CATEGORY_ICONS } = await import('../data/referenceObjects');
        setCategoryIcons(CATEGORY_ICONS);
      } catch (error) {
        logger.error('[useCategoryIcons]', 'Failed to load category icons:', error);
        // Keep fallback icons
      } finally {
        setLoading(false);
      }
    };

    loadCategoryIcons();
  }, []);

  return { categoryIcons, loading };
}