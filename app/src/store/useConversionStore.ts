import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ConversionState, AreaUnit } from '../types/conversion';
import { conversionService } from '../services/conversionService';
import { logger } from '../utils/logger';

interface ConversionStore {
  // State
  conversion: ConversionState;

  // Conversion actions
  toggleConvertPanel: () => void;
  setInputValue: (value: string) => void;
  setInputUnit: (unit: AreaUnit) => void;
  clearConversion: () => void;
  setInputError: (error: string | null) => void;
  performConversion: () => void;
  copyResult: (unit: AreaUnit, value: string) => void;

  // Utility methods
  getConvertedValue: (unit: AreaUnit) => string;
  isValidInput: () => boolean;
  getNumericValue: () => number;
}

const getInitialConversionState = (): ConversionState => ({
  isExpanded: false,
  inputValue: '',
  inputUnit: 'sqm',
  inputError: null,
  results: new Map(),
  lastCopied: null,
});

export const useConversionStore = create<ConversionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      conversion: getInitialConversionState(),

      // Conversion actions
      toggleConvertPanel: () => {
        set((state) => {
          const isExpanded = !state.conversion.isExpanded;

          logger.info('Toggling conversion panel', { isExpanded });

          return {
            conversion: {
              ...state.conversion,
              isExpanded,
            },
          };
        });
      },

      setInputValue: (value: string) => {
        set((state) => {
          // Clear any previous error when user types
          const inputError = state.conversion.inputError ? null : state.conversion.inputError;

          const newState = {
            conversion: {
              ...state.conversion,
              inputValue: value,
              inputError,
            },
          };

          // Auto-perform conversion if input is valid
          if (value.trim() && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
              get().performConversion();
            }, 0);
          } else {
            // Clear results if input is invalid
            newState.conversion.results = new Map();
          }

          return newState;
        });
      },

      setInputUnit: (unit: AreaUnit) => {
        set((state) => {
          logger.info('Setting conversion input unit', { unit });

          const newState = {
            conversion: {
              ...state.conversion,
              inputUnit: unit,
            },
          };

          // Re-perform conversion with new unit if we have valid input
          const currentValue = parseFloat(state.conversion.inputValue);
          if (!isNaN(currentValue) && currentValue > 0) {
            setTimeout(() => {
              get().performConversion();
            }, 0);
          }

          return newState;
        });
      },

      clearConversion: () => {
        set((state) => {
          logger.info('Clearing conversion');

          return {
            conversion: {
              ...state.conversion,
              inputValue: '',
              inputError: null,
              results: new Map(),
              lastCopied: null,
            },
          };
        });
      },

      setInputError: (error: string | null) => {
        set((state) => ({
          conversion: {
            ...state.conversion,
            inputError: error,
          },
        }));
      },

      performConversion: () => {
        const state = get();
        const { inputValue, inputUnit } = state.conversion;

        const numericValue = parseFloat(inputValue);

        // Validate input
        if (!inputValue.trim()) {
          get().setInputError('Please enter a value');
          return;
        }

        if (isNaN(numericValue)) {
          get().setInputError('Please enter a valid number');
          return;
        }

        if (numericValue <= 0) {
          get().setInputError('Please enter a positive value');
          return;
        }

        if (numericValue > 1e12) {
          get().setInputError('Value is too large');
          return;
        }

        try {
          // Clear any previous error
          get().setInputError(null);

          // Convert to all other units
          const results = new Map<AreaUnit, string>();
          const allUnits: AreaUnit[] = [
            'sqm', 'sqft', 'acres', 'hectares', 'sqkm', 'toise',
            'perches', 'perches-mauritius', 'arpent-na', 'arpent-paris', 'arpent-mauritius'
          ];

          allUnits.forEach(targetUnit => {
            if (targetUnit !== inputUnit) {
              const convertedValue = conversionService.convert(numericValue, inputUnit, targetUnit);
              results.set(targetUnit, conversionService.formatValue(convertedValue, targetUnit));
            }
          });

          set((state) => ({
            conversion: {
              ...state.conversion,
              results,
            },
          }));

          logger.info('Conversion performed', {
            inputValue: numericValue,
            inputUnit,
            resultsCount: results.size
          });

        } catch (error) {
          logger.error('Error performing conversion', { error });
          get().setInputError('Error performing conversion');
        }
      },

      copyResult: (unit: AreaUnit, value: string) => {
        try {
          navigator.clipboard.writeText(value);

          set((state) => ({
            conversion: {
              ...state.conversion,
              lastCopied: unit,
            },
          }));

          // Clear the copy indicator after 2 seconds
          setTimeout(() => {
            set((state) => ({
              conversion: {
                ...state.conversion,
                lastCopied: null,
              },
            }));
          }, 2000);

          logger.info('Copied conversion result', { unit, value });

        } catch (error) {
          logger.error('Failed to copy to clipboard', { error });
        }
      },

      // Utility methods
      getConvertedValue: (unit: AreaUnit) => {
        const result = get().conversion.results.get(unit);
        return result || '0';
      },

      isValidInput: () => {
        const state = get();
        const numericValue = parseFloat(state.conversion.inputValue);
        return !isNaN(numericValue) && numericValue > 0 && state.conversion.inputError === null;
      },

      getNumericValue: () => {
        const inputValue = get().conversion.inputValue;
        const numericValue = parseFloat(inputValue);
        return isNaN(numericValue) ? 0 : numericValue;
      },
    }),
    {
      name: 'conversion-store',
    }
  )
);