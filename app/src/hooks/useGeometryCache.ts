import { useRef, useCallback } from 'react';

/**
 * Hook for lazy loading GeometryCache to reduce initial bundle size
 */
export function useGeometryCache() {
  const cacheRef = useRef<typeof import('../utils/GeometryCache').GeometryCache | null>(null);
  const loadingRef = useRef<Promise<typeof import('../utils/GeometryCache').GeometryCache> | null>(null);

  const getGeometryCache = useCallback(async () => {
    if (cacheRef.current) {
      return cacheRef.current;
    }

    if (loadingRef.current) {
      return loadingRef.current;
    }

    loadingRef.current = import('../utils/GeometryCache').then(module => {
      cacheRef.current = module.GeometryCache;
      loadingRef.current = null;
      return module.GeometryCache;
    });

    return loadingRef.current;
  }, []);

  return { getGeometryCache };
}