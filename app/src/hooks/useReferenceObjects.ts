import { useState, useEffect } from 'react';
import type { ReferenceObject, ReferenceCategory } from '../types/referenceObjects';
import { logger } from '../utils/logger';

/**
 * Hook for lazy loading reference objects to prevent mixed import issues
 */
export function useReferenceObjects() {
  const [referenceObjects, setReferenceObjects] = useState<ReferenceObject[]>([]);
  const [searchReferenceObjects, setSearchFunction] = useState<((objects: ReferenceObject[], query: string) => ReferenceObject[]) | null>(null);
  const [filterByCategory, setFilterFunction] = useState<((objects: ReferenceObject[], category: ReferenceCategory) => ReferenceObject[]) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReferenceObjects = async () => {
      try {
        const module = await import('../data/referenceObjects');
        setReferenceObjects(module.REFERENCE_OBJECTS);
        setSearchFunction(() => module.searchReferenceObjects);
        setFilterFunction(() => module.filterByCategory);
      } catch (error) {
        logger.error('[useReferenceObjects]', 'Failed to load reference objects:', error);
        setReferenceObjects([]);
        setSearchFunction(null);
        setFilterFunction(null);
      } finally {
        setLoading(false);
      }
    };

    loadReferenceObjects();
  }, []);

  return {
    referenceObjects,
    searchReferenceObjects,
    filterByCategory,
    loading
  };
}