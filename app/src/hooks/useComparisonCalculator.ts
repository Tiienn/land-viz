import { useState, useEffect } from 'react';

/**
 * Hook for lazy loading comparison calculator to prevent mixed import issues
 */
export function useComparisonCalculator() {
  const [ComparisonCalculator, setComparisonCalculator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCalculator = async () => {
      try {
        const { ComparisonCalculator: Calculator } = await import('../utils/comparisonCalculations');
        setComparisonCalculator(() => Calculator);
      } catch (error) {
        console.error('Failed to load comparison calculator:', error);
        setComparisonCalculator(null);
      } finally {
        setLoading(false);
      }
    };

    loadCalculator();
  }, []);

  return { ComparisonCalculator, loading };
}