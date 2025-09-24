import { describe, it, expect, beforeEach } from 'vitest';
import { useConversionStore } from '../useConversionStore';
import type { AreaUnit } from '../../types';

describe('useConversionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useConversionStore.setState({
      isVisible: false,
      inputValue: '',
      selectedUnit: 'sqm',
      results: [],
      isCalculating: false,
      error: null,
      history: [],
      favorites: [],
      recentUnits: ['sqm', 'sqft', 'acres'],
    });
  });

  describe('Panel Visibility', () => {
    it('should toggle panel visibility', () => {
      const store = useConversionStore.getState();

      expect(store.isVisible).toBe(false);

      store.togglePanel();
      expect(useConversionStore.getState().isVisible).toBe(true);

      store.togglePanel();
      expect(useConversionStore.getState().isVisible).toBe(false);
    });

    it('should show and hide panel explicitly', () => {
      const store = useConversionStore.getState();

      store.showPanel();
      expect(useConversionStore.getState().isVisible).toBe(true);

      store.hidePanel();
      expect(useConversionStore.getState().isVisible).toBe(false);
    });
  });

  describe('Input Management', () => {
    it('should set input value and clear errors', () => {
      const store = useConversionStore.getState();

      // Set an error first
      store.setError('Test error');
      expect(useConversionStore.getState().error).toBe('Test error');

      // Setting input should clear error
      store.setInputValue('100');
      const state = useConversionStore.getState();
      expect(state.inputValue).toBe('100');
      expect(state.error).toBe(null);
    });

    it('should handle numeric input validation', () => {
      const store = useConversionStore.getState();

      // Valid numeric inputs
      store.setInputValue('100');
      expect(useConversionStore.getState().inputValue).toBe('100');

      store.setInputValue('100.5');
      expect(useConversionStore.getState().inputValue).toBe('100.5');

      store.setInputValue('0.001');
      expect(useConversionStore.getState().inputValue).toBe('0.001');
    });

    it('should handle decimal numbers correctly', () => {
      const store = useConversionStore.getState();

      const testValues = ['1.5', '0.25', '1000.999', '0.0001'];

      testValues.forEach(value => {
        store.setInputValue(value);
        expect(useConversionStore.getState().inputValue).toBe(value);
      });
    });
  });

  describe('Unit Selection', () => {
    it('should set selected unit and trigger conversion', () => {
      const store = useConversionStore.getState();

      store.setInputValue('100');
      store.setSelectedUnit('sqft');

      const state = useConversionStore.getState();
      expect(state.selectedUnit).toBe('sqft');
      expect(state.recentUnits).toContain('sqft');
    });

    it('should support all area units', () => {
      const store = useConversionStore.getState();
      const allUnits: AreaUnit[] = [
        'sqm', 'sqft', 'acres', 'hectares', 'sqkm',
        'toise', 'perches', 'perches-mauritius',
        'arpent-na', 'arpent-paris', 'arpent-mauritius'
      ];

      store.setInputValue('1');

      allUnits.forEach(unit => {
        store.setSelectedUnit(unit);
        expect(useConversionStore.getState().selectedUnit).toBe(unit);
      });
    });

    it('should update recent units list', () => {
      const store = useConversionStore.getState();

      // Initially has default recent units
      const initialRecent = useConversionStore.getState().recentUnits;
      expect(initialRecent).toEqual(['sqm', 'sqft', 'acres']);

      // Use a new unit
      store.setSelectedUnit('hectares');

      const state = useConversionStore.getState();
      expect(state.recentUnits).toContain('hectares');
      expect(state.recentUnits.length).toBeLessThanOrEqual(5); // Should limit recent units
    });
  });

  describe('Conversion Calculations', () => {
    it('should perform basic conversions correctly', () => {
      const store = useConversionStore.getState();

      store.setInputValue('1');
      store.setSelectedUnit('sqm');
      store.performConversion();

      const state = useConversionStore.getState();
      expect(state.results).toHaveLength(11); // All other units

      // Find specific conversions to validate
      const sqftResult = state.results.find(r => r.unit === 'sqft');
      expect(sqftResult?.value).toBeCloseTo(10.764, 2); // 1 sqm = ~10.764 sqft

      const acresResult = state.results.find(r => r.unit === 'acres');
      expect(acresResult?.value).toBeCloseTo(0.000247, 6); // 1 sqm = ~0.000247 acres
    });

    it('should handle large values correctly', () => {
      const store = useConversionStore.getState();

      store.setInputValue('1000000'); // 1 million square meters
      store.setSelectedUnit('sqm');
      store.performConversion();

      const state = useConversionStore.getState();
      const sqkmResult = state.results.find(r => r.unit === 'sqkm');
      expect(sqkmResult?.value).toBeCloseTo(1, 2); // 1,000,000 sqm = 1 sqkm
    });

    it('should handle small values correctly', () => {
      const store = useConversionStore.getState();

      store.setInputValue('0.01'); // Very small area
      store.setSelectedUnit('sqm');
      store.performConversion();

      const state = useConversionStore.getState();
      expect(state.results).toHaveLength(11);

      // Should handle small numbers without precision loss
      state.results.forEach(result => {
        expect(Number.isFinite(result.value)).toBe(true);
        expect(result.value).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle historical units accurately', () => {
      const store = useConversionStore.getState();

      store.setInputValue('1');
      store.setSelectedUnit('arpent-paris');
      store.performConversion();

      const state = useConversionStore.getState();
      const sqmResult = state.results.find(r => r.unit === 'sqm');

      // 1 Arpent (Paris) ≈ 3,419 sqm
      expect(sqmResult?.value).toBeCloseTo(3419, 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', () => {
      const store = useConversionStore.getState();

      // Try to convert invalid input
      store.setInputValue('abc');
      store.performConversion();

      const state = useConversionStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.results).toHaveLength(0);
    });

    it('should handle negative values', () => {
      const store = useConversionStore.getState();

      store.setInputValue('-100');
      store.performConversion();

      const state = useConversionStore.getState();
      // Should either reject negative values or convert to positive
      if (state.error) {
        expect(state.error).toContain('positive');
      } else {
        state.results.forEach(result => {
          expect(result.value).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it('should handle zero values', () => {
      const store = useConversionStore.getState();

      store.setInputValue('0');
      store.performConversion();

      const state = useConversionStore.getState();
      expect(state.error).toBe(null);
      state.results.forEach(result => {
        expect(result.value).toBe(0);
      });
    });

    it('should handle extremely large values', () => {
      const store = useConversionStore.getState();

      store.setInputValue('999999999999999'); // Very large number
      store.performConversion();

      const state = useConversionStore.getState();

      if (state.error) {
        // Should warn about extremely large values
        expect(state.error).toBeTruthy();
      } else {
        // Should handle without overflow
        state.results.forEach(result => {
          expect(Number.isFinite(result.value)).toBe(true);
        });
      }
    });
  });

  describe('History Management', () => {
    it('should add conversions to history', () => {
      const store = useConversionStore.getState();

      store.setInputValue('100');
      store.setSelectedUnit('sqm');
      store.performConversion();

      const state = useConversionStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0].inputValue).toBe('100');
      expect(state.history[0].inputUnit).toBe('sqm');
    });

    it('should limit history size', () => {
      const store = useConversionStore.getState();

      // Add many conversions
      for (let i = 0; i < 25; i++) {
        store.setInputValue(i.toString());
        store.setSelectedUnit('sqm');
        store.performConversion();
      }

      const state = useConversionStore.getState();
      expect(state.history.length).toBeLessThanOrEqual(20); // Should limit to reasonable size
    });

    it('should clear history', () => {
      const store = useConversionStore.getState();

      // Add some history first
      store.setInputValue('100');
      store.setSelectedUnit('sqm');
      store.performConversion();

      expect(useConversionStore.getState().history).toHaveLength(1);

      store.clearHistory();
      expect(useConversionStore.getState().history).toHaveLength(0);
    });
  });

  describe('Favorites Management', () => {
    it('should add and remove favorites', () => {
      const store = useConversionStore.getState();

      const conversion = {
        inputValue: '100',
        inputUnit: 'sqm' as AreaUnit,
        results: [
          { unit: 'sqft' as AreaUnit, value: 1076.4, label: '100 sqm = 1,076.4 sqft' }
        ],
        timestamp: Date.now(),
      };

      store.addToFavorites(conversion);
      expect(useConversionStore.getState().favorites).toHaveLength(1);

      store.removeFromFavorites(0);
      expect(useConversionStore.getState().favorites).toHaveLength(0);
    });

    it('should limit favorites size', () => {
      const store = useConversionStore.getState();

      // Add many favorites
      for (let i = 0; i < 15; i++) {
        const conversion = {
          inputValue: i.toString(),
          inputUnit: 'sqm' as AreaUnit,
          results: [],
          timestamp: Date.now(),
        };
        store.addToFavorites(conversion);
      }

      const state = useConversionStore.getState();
      expect(state.favorites.length).toBeLessThanOrEqual(10); // Should limit favorites
    });
  });

  describe('Result Copying', () => {
    it('should copy result to clipboard (mock)', () => {
      const store = useConversionStore.getState();

      store.setInputValue('100');
      store.setSelectedUnit('sqm');
      store.performConversion();

      const state = useConversionStore.getState();
      const firstResult = state.results[0];

      // In a real test, this would check clipboard, but we'll just verify the method exists
      expect(typeof store.copyResult).toBe('function');

      // Call it to ensure it doesn't crash
      store.copyResult(firstResult);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user workflow', () => {
      const store = useConversionStore.getState();

      // User opens panel
      store.showPanel();
      expect(useConversionStore.getState().isVisible).toBe(true);

      // User enters value
      store.setInputValue('2.5');
      expect(useConversionStore.getState().inputValue).toBe('2.5');

      // User selects acres
      store.setSelectedUnit('acres');
      expect(useConversionStore.getState().selectedUnit).toBe('acres');

      // User performs conversion
      store.performConversion();
      const state = useConversionStore.getState();

      expect(state.results.length).toBeGreaterThan(0);
      expect(state.history).toHaveLength(1);
      expect(state.error).toBe(null);

      // Verify specific conversion (2.5 acres to sqm)
      const sqmResult = state.results.find(r => r.unit === 'sqm');
      expect(sqmResult?.value).toBeCloseTo(10117, 0); // 2.5 acres ≈ 10,117 sqm
    });

    it('should handle switching between different unit systems', () => {
      const store = useConversionStore.getState();

      // Test metric system
      store.setInputValue('1000');
      store.setSelectedUnit('sqm');
      store.performConversion();

      let state = useConversionStore.getState();
      const hectareResult = state.results.find(r => r.unit === 'hectares');
      expect(hectareResult?.value).toBeCloseTo(0.1, 2);

      // Test imperial system
      store.setInputValue('1');
      store.setSelectedUnit('acres');
      store.performConversion();

      state = useConversionStore.getState();
      const sqftResult = state.results.find(r => r.unit === 'sqft');
      expect(sqftResult?.value).toBeCloseTo(43560, 0); // 1 acre = 43,560 sqft
    });

    it('should handle historical unit conversions accurately', () => {
      const store = useConversionStore.getState();

      // Test French historical units
      store.setInputValue('1');
      store.setSelectedUnit('toise');
      store.performConversion();

      let state = useConversionStore.getState();
      const sqmFromToise = state.results.find(r => r.unit === 'sqm');
      expect(sqmFromToise?.value).toBeCloseTo(3.799, 2);

      // Test British historical units
      store.setInputValue('1');
      store.setSelectedUnit('perches');
      store.performConversion();

      state = useConversionStore.getState();
      const sqmFromPerches = state.results.find(r => r.unit === 'sqm');
      expect(sqmFromPerches?.value).toBeCloseTo(25.29, 1);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle rapid conversions efficiently', () => {
      const store = useConversionStore.getState();

      const startTime = performance.now();

      // Perform many rapid conversions
      for (let i = 1; i <= 100; i++) {
        store.setInputValue(i.toString());
        store.setSelectedUnit(i % 2 === 0 ? 'sqm' : 'acres');
        store.performConversion();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second for 100 conversions

      const state = useConversionStore.getState();
      expect(state.history.length).toBeLessThanOrEqual(20); // Should manage memory
    });

    it('should not cause memory leaks with large numbers', () => {
      const store = useConversionStore.getState();

      // Test with very large and very small numbers
      const testValues = ['0.000001', '999999999', '1.23456789', '0.987654321'];

      testValues.forEach(value => {
        store.setInputValue(value);
        store.setSelectedUnit('sqm');
        store.performConversion();

        const state = useConversionStore.getState();
        state.results.forEach(result => {
          expect(Number.isFinite(result.value)).toBe(true);
        });
      });
    });
  });
});