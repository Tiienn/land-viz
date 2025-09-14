import React, { useState, useCallback } from 'react';
import { Card } from './UI/Card';
import { Button } from './UI/Button';

interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: string | null;
  waitingForNewValue: boolean;
}

export const Calculator: React.FC = () => {
  const [state, setState] = useState<CalculatorState>({
    display: '0',
    previousValue: null,
    operation: null,
    waitingForNewValue: false,
  });

  const formatDisplay = useCallback((value: number): string => {
    // Handle very large or very small numbers
    if (Math.abs(value) >= 1e15 || (Math.abs(value) < 1e-10 && value !== 0)) {
      return value.toExponential(6);
    }
    
    // Format with appropriate decimal places
    const formatted = value.toString();
    if (formatted.includes('.')) {
      // Remove trailing zeros
      return formatted.replace(/\.?0+$/, '');
    }
    return formatted;
  }, []);

  const handleNumber = useCallback((num: string) => {
    setState(prev => {
      if (prev.waitingForNewValue) {
        return {
          ...prev,
          display: num,
          waitingForNewValue: false,
        };
      }
      
      const newDisplay = prev.display === '0' ? num : prev.display + num;
      return {
        ...prev,
        display: newDisplay,
      };
    });
  }, []);

  const handleOperation = useCallback((op: string) => {
    setState(prev => {
      const currentValue = parseFloat(prev.display);
      
      if (prev.previousValue === null) {
        return {
          ...prev,
          previousValue: currentValue,
          operation: op,
          waitingForNewValue: true,
        };
      }
      
      if (prev.operation && !prev.waitingForNewValue) {
        const result = calculate(prev.previousValue, currentValue, prev.operation);
        return {
          display: formatDisplay(result),
          previousValue: result,
          operation: op,
          waitingForNewValue: true,
        };
      }
      
      return {
        ...prev,
        operation: op,
        waitingForNewValue: true,
      };
    });
  }, [formatDisplay]);

  const calculate = (a: number, b: number, operation: string): number => {
    switch (operation) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        if (b === 0) {
          throw new Error('Division by zero');
        }
        return a / b;
      case '%':
        return a % b;
      default:
        return b;
    }
  };

  const handleEquals = useCallback(() => {
    setState(prev => {
      if (prev.operation && prev.previousValue !== null) {
        const currentValue = parseFloat(prev.display);
        try {
          const result = calculate(prev.previousValue, currentValue, prev.operation);
          return {
            display: formatDisplay(result),
            previousValue: null,
            operation: null,
            waitingForNewValue: true,
          };
        } catch (error) {
          return {
            display: 'Error',
            previousValue: null,
            operation: null,
            waitingForNewValue: true,
          };
        }
      }
      return prev;
    });
  }, [formatDisplay]);

  const handleClear = useCallback(() => {
    setState({
      display: '0',
      previousValue: null,
      operation: null,
      waitingForNewValue: false,
    });
  }, []);

  const handleDecimal = useCallback(() => {
    setState(prev => {
      if (prev.waitingForNewValue) {
        return {
          ...prev,
          display: '0.',
          waitingForNewValue: false,
        };
      }
      
      if (!prev.display.includes('.')) {
        return {
          ...prev,
          display: prev.display + '.',
        };
      }
      
      return prev;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setState(prev => {
      if (prev.display.length > 1) {
        return {
          ...prev,
          display: prev.display.slice(0, -1),
        };
      } else {
        return {
          ...prev,
          display: '0',
        };
      }
    });
  }, []);

  const handlePlusMinus = useCallback(() => {
    setState(prev => {
      const currentValue = parseFloat(prev.display);
      if (currentValue !== 0) {
        return {
          ...prev,
          display: formatDisplay(-currentValue),
        };
      }
      return prev;
    });
  }, [formatDisplay]);

  const handleSquare = useCallback(() => {
    setState(prev => {
      const currentValue = parseFloat(prev.display);
      const result = currentValue * currentValue;
      return {
        ...prev,
        display: formatDisplay(result),
        waitingForNewValue: true,
      };
    });
  }, [formatDisplay]);

  const handleSquareRoot = useCallback(() => {
    setState(prev => {
      const currentValue = parseFloat(prev.display);
      if (currentValue < 0) {
        return {
          ...prev,
          display: 'Error',
          waitingForNewValue: true,
        };
      }
      const result = Math.sqrt(currentValue);
      return {
        ...prev,
        display: formatDisplay(result),
        waitingForNewValue: true,
      };
    });
  }, [formatDisplay]);

  const buttonClasses = "h-12 w-full text-lg font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]";
  
  const numberButtonClasses = `${buttonClasses} btn-secondary`;
  const operationButtonClasses = `${buttonClasses} btn-accent`;
  const functionButtonClasses = `${buttonClasses} btn-ghost`;

  return (
    <Card className="w-80 mx-auto" padding="lg" shadow="medium">
      <div className="space-y-4">
        {/* Display */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[4rem] flex items-center justify-end">
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1 font-mono">
              {state.previousValue !== null && state.operation && (
                `${formatDisplay(state.previousValue)} ${state.operation}`
              )}
            </div>
            <div className="text-2xl font-mono font-semibold text-gray-900 break-all">
              {state.display}
            </div>
          </div>
        </div>

        {/* Button Grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1: Clear, Backspace, Functions */}
          <Button
            variant="ghost"
            className={functionButtonClasses}
            onClick={handleClear}
          >
            C
          </Button>
          <Button
            variant="ghost"
            className={functionButtonClasses}
            onClick={handleBackspace}
          >
            ⌫
          </Button>
          <Button
            variant="ghost"
            className={functionButtonClasses}
            onClick={handleSquare}
          >
            x²
          </Button>
          <Button
            variant="ghost"
            className={functionButtonClasses}
            onClick={handleSquareRoot}
          >
            √
          </Button>

          {/* Row 2: 7, 8, 9, ÷ */}
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('7')}
          >
            7
          </Button>
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('8')}
          >
            8
          </Button>
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('9')}
          >
            9
          </Button>
          <Button
            variant="accent"
            className={operationButtonClasses}
            onClick={() => handleOperation('÷')}
          >
            ÷
          </Button>

          {/* Row 3: 4, 5, 6, × */}
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('4')}
          >
            4
          </Button>
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('5')}
          >
            5
          </Button>
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('6')}
          >
            6
          </Button>
          <Button
            variant="accent"
            className={operationButtonClasses}
            onClick={() => handleOperation('×')}
          >
            ×
          </Button>

          {/* Row 4: 1, 2, 3, - */}
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('1')}
          >
            1
          </Button>
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('2')}
          >
            2
          </Button>
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('3')}
          >
            3
          </Button>
          <Button
            variant="accent"
            className={operationButtonClasses}
            onClick={() => handleOperation('-')}
          >
            −
          </Button>

          {/* Row 5: 0, ., ±, + */}
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={() => handleNumber('0')}
          >
            0
          </Button>
          <Button
            variant="secondary"
            className={numberButtonClasses}
            onClick={handleDecimal}
          >
            .
          </Button>
          <Button
            variant="ghost"
            className={functionButtonClasses}
            onClick={handlePlusMinus}
          >
            ±
          </Button>
          <Button
            variant="accent"
            className={operationButtonClasses}
            onClick={() => handleOperation('+')}
          >
            +
          </Button>

          {/* Row 6: Equals (spans 2 columns), % */}
          <Button
            variant="primary"
            className={`${buttonClasses} col-span-2`}
            onClick={handleEquals}
          >
            =
          </Button>
          <Button
            variant="accent"
            className={operationButtonClasses}
            onClick={() => handleOperation('%')}
          >
            %
          </Button>
        </div>
      </div>
    </Card>
  );
};

