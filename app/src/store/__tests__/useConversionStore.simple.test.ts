import { describe, it, expect, beforeEach } from 'vitest';
import { useConversionStore } from '../useConversionStore';

describe('useConversionStore - Simple Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    useConversionStore.setState({
      conversion: {
        isExpanded: false,
        inputValue: '',
        inputUnit: 'sqm',
        inputError: null,
        results: new Map(),
        lastCopied: null,
      }
    });
  });

  describe('Panel Toggle', () => {
    it('should toggle convert panel visibility', () => {
      const store = useConversionStore.getState();

      expect(store.conversion.isExpanded).toBe(false);

      store.toggleConvertPanel();
      expect(useConversionStore.getState().conversion.isExpanded).toBe(true);

      store.toggleConvertPanel();
      expect(useConversionStore.getState().conversion.isExpanded).toBe(false);
    });
  });

  describe('Input Management', () => {
    it('should set input value', () => {
      const store = useConversionStore.getState();

      store.setInputValue('100');
      expect(useConversionStore.getState().conversion.inputValue).toBe('100');
    });

    it('should set input unit', () => {
      const store = useConversionStore.getState();

      store.setInputUnit('sqft');
      expect(useConversionStore.getState().conversion.inputUnit).toBe('sqft');
    });

    it('should set input error', () => {
      const store = useConversionStore.getState();

      store.setInputError('Invalid input');
      expect(useConversionStore.getState().conversion.inputError).toBe('Invalid input');

      store.setInputError(null);
      expect(useConversionStore.getState().conversion.inputError).toBe(null);
    });
  });

  describe('Utility Methods', () => {
    it('should validate valid input', () => {
      const store = useConversionStore.getState();

      store.setInputValue('100');
      store.setInputError(null);

      expect(store.isValidInput()).toBe(true);
    });

    it('should invalidate input with error', () => {
      const store = useConversionStore.getState();

      store.setInputValue('100');
      store.setInputError('Invalid input');

      expect(store.isValidInput()).toBe(false);
    });

    it('should get numeric value from string input', () => {
      const store = useConversionStore.getState();

      store.setInputValue('100.5');
      expect(store.getNumericValue()).toBe(100.5);

      store.setInputValue('invalid');
      expect(store.getNumericValue()).toBe(0);
    });

    it('should get converted value from results map', () => {
      const store = useConversionStore.getState();

      // Manually set results
      const results = new Map();
      results.set('sqft', '1076.39 ft²');

      useConversionStore.setState({
        conversion: {
          ...store.conversion,
          results
        }
      });

      expect(store.getConvertedValue('sqft')).toBe('1076.39 ft²');
      expect(store.getConvertedValue('acres')).toBe('0'); // Returns '0' for missing values
    });
  });

  describe('Conversion Process', () => {
    it('should perform conversion with valid input', () => {
      const store = useConversionStore.getState();

      store.setInputValue('100');
      store.setInputUnit('sqm');
      store.performConversion();

      // Check that results map is populated
      const state = useConversionStore.getState();
      expect(state.conversion.results.size).toBeGreaterThan(0);
      expect(state.conversion.inputError).toBe(null);
    });

    it('should handle invalid input gracefully', () => {
      const store = useConversionStore.getState();

      store.setInputValue('invalid');
      store.performConversion();

      // Should set an error
      const state = useConversionStore.getState();
      expect(state.conversion.inputError).toBeTruthy();
    });
  });

  describe('Clear Conversion', () => {
    it('should clear conversion state', () => {
      const store = useConversionStore.getState();

      // Set some state
      store.setInputValue('100');
      store.setInputError('Test error');
      store.performConversion();

      // Clear
      store.clearConversion();

      const state = useConversionStore.getState();
      expect(state.conversion.inputValue).toBe('');
      expect(state.conversion.inputError).toBe(null);
      expect(state.conversion.results.size).toBe(0);
    });
  });
});