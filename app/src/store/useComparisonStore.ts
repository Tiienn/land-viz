import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ComparisonState, ReferenceCategory } from '../types/referenceObjects';
import { REFERENCE_OBJECTS } from '../data/referenceObjects';
import { logger } from '../utils/logger';

interface ComparisonStore {
  // State
  comparison: ComparisonState;

  // Comparison actions
  toggleComparisonPanel: () => void;
  toggleObjectVisibility: (objectId: string) => void;
  setComparisonSearch: (query: string) => void;
  setComparisonCategory: (category: ReferenceCategory | 'all') => void;
  calculateComparisons: () => Promise<void>;
  resetComparison: () => void;
  updateLandArea: (area: number) => void;
  setComparisonLoading: (loading: boolean) => void;

  // Utility methods
  getVisibleObjects: () => string[];
  getFilteredObjects: () => any[];
  getTotalLandArea: () => number;
}

const getInitialComparisonState = (): ComparisonState => ({
  isExpanded: false,
  isLoading: false,
  searchQuery: '',
  selectedCategory: 'all',
  visibleObjects: new Set(),
  landArea: 0,
  calculations: new Map(),
});

export const useComparisonStore = create<ComparisonStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      comparison: getInitialComparisonState(),

      // Comparison actions
      toggleComparisonPanel: () => {
        set((state) => {
          const isExpanded = !state.comparison.isExpanded;

          logger.info('Toggling comparison panel', { isExpanded });

          return {
            comparison: {
              ...state.comparison,
              isExpanded,
            },
          };
        });
      },

      toggleObjectVisibility: (objectId: string) => {
        set((state) => {
          const newVisibleObjects = new Set(state.comparison.visibleObjects);

          if (newVisibleObjects.has(objectId)) {
            newVisibleObjects.delete(objectId);
            logger.info('Hiding comparison object', { objectId });
          } else {
            newVisibleObjects.add(objectId);
            logger.info('Showing comparison object', { objectId });
          }

          return {
            comparison: {
              ...state.comparison,
              visibleObjects: newVisibleObjects,
            },
          };
        });
      },

      setComparisonSearch: (query: string) => {
        set((state) => ({
          comparison: {
            ...state.comparison,
            searchQuery: query.toLowerCase().trim(),
          },
        }));
      },

      setComparisonCategory: (category: ReferenceCategory | 'all') => {
        set((state) => {
          logger.info('Setting comparison category', { category });

          return {
            comparison: {
              ...state.comparison,
              selectedCategory: category,
            },
          };
        });
      },

      calculateComparisons: async () => {
        const state = get();

        if (state.comparison.landArea <= 0) {
          logger.warn('Cannot calculate comparisons with zero land area');
          return;
        }

        set((state) => ({
          comparison: {
            ...state.comparison,
            isLoading: true,
          },
        }));

        try {
          const calculations = new Map();

          // Calculate comparisons for all reference objects
          REFERENCE_OBJECTS.forEach((obj) => {
            const quantity = state.comparison.landArea / obj.dimensions.area;
            const fits = Math.floor(quantity);
            const percentage = (obj.dimensions.area / state.comparison.landArea) * 100;

            calculations.set(obj.id, {
              objectId: obj.id,
              landArea: state.comparison.landArea,
              objectArea: obj.dimensions.area,
              quantity: fits,
              exactQuantity: quantity,
              percentage: Math.min(percentage, 100),
              comparisonText: fits >= 1
                ? `${fits} ${obj.name}${fits !== 1 ? 's' : ''} fit in your land`
                : `Your land is ${percentage.toFixed(1)}% the size of a ${obj.name}`,
            });
          });

          set((state) => ({
            comparison: {
              ...state.comparison,
              calculations,
              isLoading: false,
            },
          }));

          logger.info('Comparison calculations completed', {
            calculationsCount: calculations.size,
            landArea: state.comparison.landArea
          });

        } catch (error) {
          logger.error('Error calculating comparisons', { error });

          set((state) => ({
            comparison: {
              ...state.comparison,
              isLoading: false,
            },
          }));
        }
      },

      resetComparison: () => {
        set((state) => {
          logger.info('Resetting comparison tool');

          return {
            comparison: {
              ...state.comparison,
              visibleObjects: new Set(),
              calculations: new Map(),
              searchQuery: '',
              selectedCategory: 'all',
            },
          };
        });
      },

      updateLandArea: (area: number) => {
        set((state) => {
          const roundedArea = Math.max(0, area);

          // Auto-calculate comparisons when land area changes
          if (roundedArea > 0) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
              get().calculateComparisons();
            }, 0);
          }

          return {
            comparison: {
              ...state.comparison,
              landArea: roundedArea,
            },
          };
        });
      },

      setComparisonLoading: (loading: boolean) => {
        set((state) => ({
          comparison: {
            ...state.comparison,
            isLoading: loading,
          },
        }));
      },

      // Utility methods
      getVisibleObjects: () => {
        return Array.from(get().comparison.visibleObjects);
      },

      getFilteredObjects: () => {
        const state = get();
        const { searchQuery, selectedCategory } = state.comparison;

        let filteredObjects = REFERENCE_OBJECTS;

        // Filter by category
        if (selectedCategory !== 'all') {
          filteredObjects = filteredObjects.filter(obj => obj.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery) {
          filteredObjects = filteredObjects.filter(obj =>
            obj.name.toLowerCase().includes(searchQuery) ||
            obj.metadata.description.toLowerCase().includes(searchQuery) ||
            obj.category.toLowerCase().includes(searchQuery)
          );
        }

        return filteredObjects;
      },

      getTotalLandArea: () => {
        return get().comparison.landArea;
      },
    }),
    {
      name: 'comparison-store',
    }
  )
);