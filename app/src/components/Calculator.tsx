import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from './UI/Card';
import { Button } from './UI/Button';
import { tokens } from '@/styles/tokens';

interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: string | null;
  waitingForNewValue: boolean;
}

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
}

export const Calculator: React.FC = () => {
  const [state, setState] = useState<CalculatorState>({
    display: '0',
    previousValue: null,
    operation: null,
    waitingForNewValue: false,
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const displayRef = useRef<HTMLDivElement>(null);

  // Animation helpers
  const triggerSuccessAnimation = useCallback(() => {
    if (displayRef.current) {
      displayRef.current.style.animation = 'none';
      setTimeout(() => {
        if (displayRef.current) {
          displayRef.current.style.animation = 'successPulse 600ms ease-out';
          setTimeout(() => {
            if (displayRef.current) {
              displayRef.current.style.animation = '';
            }
          }, 600);
        }
      }, 10);
    }
  }, []);

  const triggerErrorAnimation = useCallback(() => {
    if (displayRef.current) {
      displayRef.current.style.animation = 'none';
      setTimeout(() => {
        if (displayRef.current) {
          displayRef.current.style.animation = 'errorShake 400ms ease-in-out';
          setTimeout(() => {
            if (displayRef.current) {
              displayRef.current.style.animation = '';
            }
          }, 400);
        }
      }, 10);
    }
  }, []);

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
          const resultFormatted = formatDisplay(result);

          // Add to history with unique ID (timestamp + random for HMR safety)
          const expression = `${formatDisplay(prev.previousValue)} ${prev.operation} ${formatDisplay(currentValue)}`;
          setHistory(prevHistory => {
            // Prevent duplicate consecutive entries (for React StrictMode)
            const lastEntry = prevHistory[0];
            if (lastEntry && lastEntry.expression === expression && lastEntry.result === resultFormatted) {
              return prevHistory; // Don't add duplicate
            }

            return [
              {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                expression,
                result: resultFormatted,
                timestamp: new Date(),
              },
              ...prevHistory.slice(0, 49), // Keep last 50 entries
            ];
          });

          // Trigger success animation
          triggerSuccessAnimation();

          return {
            display: resultFormatted,
            previousValue: null,
            operation: null,
            waitingForNewValue: true,
          };
        } catch {
          // Trigger error animation
          triggerErrorAnimation();

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
  }, [formatDisplay, triggerSuccessAnimation, triggerErrorAnimation]);

  const handleClear = useCallback(() => {
    setState({
      display: '0',
      previousValue: null,
      operation: null,
      waitingForNewValue: false,
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleUseHistoryEntry = useCallback((entry: HistoryEntry) => {
    setState({
      display: entry.result,
      previousValue: null,
      operation: null,
      waitingForNewValue: true,
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
      const resultFormatted = formatDisplay(result);

      // Add to history with unique ID (timestamp + random for HMR safety)
      const expression = `${formatDisplay(currentValue)}²`;
      setHistory(prevHistory => {
        // Prevent duplicate consecutive entries (for React StrictMode)
        const lastEntry = prevHistory[0];
        if (lastEntry && lastEntry.expression === expression && lastEntry.result === resultFormatted) {
          return prevHistory; // Don't add duplicate
        }

        return [
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            expression,
            result: resultFormatted,
            timestamp: new Date(),
          },
          ...prevHistory.slice(0, 49), // Keep last 50 entries
        ];
      });

      // Trigger success animation
      triggerSuccessAnimation();

      return {
        ...prev,
        display: resultFormatted,
        waitingForNewValue: true,
      };
    });
  }, [formatDisplay, triggerSuccessAnimation]);

  const handleSquareRoot = useCallback(() => {
    setState(prev => {
      const currentValue = parseFloat(prev.display);
      if (currentValue < 0) {
        // Trigger error animation for negative square root
        triggerErrorAnimation();

        return {
          ...prev,
          display: 'Error',
          waitingForNewValue: true,
        };
      }
      const result = Math.sqrt(currentValue);
      const resultFormatted = formatDisplay(result);

      // Add to history with unique ID (timestamp + random for HMR safety)
      const expression = `√${formatDisplay(currentValue)}`;
      setHistory(prevHistory => {
        // Prevent duplicate consecutive entries (for React StrictMode)
        const lastEntry = prevHistory[0];
        if (lastEntry && lastEntry.expression === expression && lastEntry.result === resultFormatted) {
          return prevHistory; // Don't add duplicate
        }

        return [
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            expression,
            result: resultFormatted,
            timestamp: new Date(),
          },
          ...prevHistory.slice(0, 49), // Keep last 50 entries
        ];
      });

      // Trigger success animation
      triggerSuccessAnimation();

      return {
        ...prev,
        display: resultFormatted,
        waitingForNewValue: true,
      };
    });
  }, [formatDisplay, triggerErrorAnimation, triggerSuccessAnimation]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = event.key;

      // Numbers (0-9) from main keyboard and numpad
      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        handleNumber(key);
        return;
      }

      // Operations
      switch (key) {
        case '+':
          event.preventDefault();
          handleOperation('+');
          break;
        case '-':
          event.preventDefault();
          handleOperation('-');
          break;
        case '*':
          event.preventDefault();
          handleOperation('×');
          break;
        case '/':
          event.preventDefault();
          handleOperation('÷');
          break;
        case '%':
          event.preventDefault();
          handleOperation('%');
          break;
        case '.':
        case ',': // Some keyboards use comma as decimal separator
          event.preventDefault();
          handleDecimal();
          break;
        case 'Enter':
        case '=':
          event.preventDefault();
          handleEquals();
          break;
        case 'Escape':
        case 'c':
        case 'C':
          event.preventDefault();
          handleClear();
          break;
        case 'Backspace':
        case 'Delete':
          event.preventDefault();
          handleBackspace();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleOperation, handleDecimal, handleEquals, handleClear, handleBackspace]);

  // Common button styles
  const buttonBaseStyle: React.CSSProperties = {
    height: '48px',
    minHeight: '44px', // WCAG touch target
    width: '100%',
    maxWidth: '100%', // Prevent expansion beyond container
    padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`, // Smaller padding for grid layout
    fontSize: tokens.typography.bodyLarge.size,
    fontWeight: 500,
    fontFamily: tokens.typography.fontFamily.primary,
    transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.default}`,
    cursor: 'pointer',
    boxSizing: 'border-box',
    overflow: 'hidden', // Prevent content overflow
  };

  return (
    <>
      {/* CSS Keyframes for animations */}
      <style>{`
        @keyframes successPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 ${tokens.colors.semantic.success}40;
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 20px ${tokens.colors.semantic.success}80;
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 ${tokens.colors.semantic.success}40;
          }
        }

        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
      `}</style>

      <Card
        className="mx-auto"
        padding="lg"
        shadow="medium"
        style={{
          width: '100%',
          maxWidth: '380px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing[4],
          width: '100%',
          boxSizing: 'border-box',
        }}>

          {/* Display */}
          <div
            ref={displayRef}
            style={{
              background: `linear-gradient(135deg, ${tokens.colors.background.secondary} 0%, ${tokens.colors.neutral[50]} 100%)`,
              border: `2px solid ${state.display === 'Error' ? tokens.colors.semantic.error : tokens.colors.neutral[200]}`,
              borderRadius: tokens.radius.lg,
              padding: tokens.spacing[4],
              minHeight: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
            }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: tokens.typography.bodySmall.size,
                color: tokens.colors.neutral[500],
                marginBottom: tokens.spacing[1],
                fontFamily: tokens.typography.fontFamily.mono,
                minHeight: '18px',
              }}>
                {state.previousValue !== null && state.operation && (
                  `${formatDisplay(state.previousValue)} ${state.operation}`
                )}
              </div>
              <div style={{
                fontSize: tokens.typography.display.size,
                fontFamily: tokens.typography.fontFamily.mono,
                fontWeight: 600,
                color: state.display === 'Error' ? tokens.colors.semantic.error : tokens.colors.neutral[900],
                wordBreak: 'break-all',
              }}>
                {state.display}
              </div>
            </div>
          </div>

        {/* Button Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing[2],
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Row 1: Function Buttons - Clear, Backspace, Square, Square Root */}
          <Button
            variant="ghost"
            style={buttonBaseStyle}
            onClick={handleClear}
            aria-label="Clear all"
          >
            C
          </Button>
          <Button
            variant="ghost"
            style={buttonBaseStyle}
            onClick={handleBackspace}
            aria-label="Backspace"
          >
            ⌫
          </Button>
          <Button
            variant="ghost"
            style={buttonBaseStyle}
            onClick={handleSquare}
            aria-label="Square"
          >
            x²
          </Button>
          <Button
            variant="ghost"
            style={buttonBaseStyle}
            onClick={handleSquareRoot}
            aria-label="Square root"
          >
            √
          </Button>

          {/* Row 2: 7, 8, 9, ÷ */}
          <Button variant="secondary" style={buttonBaseStyle} onClick={() => handleNumber('7')} aria-label="Number 7">7</Button>
          <Button variant="secondary" style={buttonBaseStyle} onClick={() => handleNumber('8')} aria-label="Number 8">8</Button>
          <Button variant="secondary" style={buttonBaseStyle} onClick={() => handleNumber('9')} aria-label="Number 9">9</Button>
          <Button variant="primary" style={buttonBaseStyle} onClick={() => handleOperation('÷')} aria-label="Divide">÷</Button>

          {/* Row 3: 4, 5, 6, × */}
          <Button variant="secondary" style={buttonBaseStyle} onClick={() => handleNumber('4')} aria-label="Number 4">4</Button>
          <Button variant="secondary" style={buttonBaseStyle} onClick={() => handleNumber('5')} aria-label="Number 5">5</Button>
          <Button variant="secondary" style={buttonBaseStyle} onClick={() => handleNumber('6')} aria-label="Number 6">6</Button>
          <Button variant="primary" style={buttonBaseStyle} onClick={() => handleOperation('×')} aria-label="Multiply">×</Button>

          {/* Row 4: 1, 2, 3, − */}
          <Button variant="secondary" style={buttonBaseStyle} onClick={() => handleNumber('1')} aria-label="Number 1">1</Button>
          <Button variant="secondary" style={buttonBaseStyle} onClick={() => handleNumber('2')} aria-label="Number 2">2</Button>
          <Button variant="secondary" style={buttonBaseStyle} onClick={() => handleNumber('3')} aria-label="Number 3">3</Button>
          <Button variant="primary" style={buttonBaseStyle} onClick={() => handleOperation('-')} aria-label="Subtract">−</Button>

          {/* Row 5: 0 (spans 2 columns), ., + */}
          <Button variant="secondary" style={{ ...buttonBaseStyle, gridColumn: 'span 2' }} onClick={() => handleNumber('0')} aria-label="Number 0">0</Button>
          <Button variant="secondary" style={buttonBaseStyle} onClick={handleDecimal} aria-label="Decimal point">.</Button>
          <Button variant="primary" style={buttonBaseStyle} onClick={() => handleOperation('+')} aria-label="Add">+</Button>

          {/* Row 6: Equals (spans full width) */}
          <Button
            variant="primary"
            style={{ ...buttonBaseStyle, gridColumn: 'span 4' }}
            onClick={handleEquals}
            aria-label="Equals"
          >
            =
          </Button>
        </div>

        {/* Live History Footer */}
        <div
          style={{
            marginTop: tokens.spacing[3],
            paddingTop: tokens.spacing[3],
            borderTop: `1px solid ${tokens.colors.neutral[200]}`,
          }}
          role="region"
          aria-label="Calculation history"
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: tokens.spacing[2],
            paddingLeft: tokens.spacing[2],
            paddingRight: tokens.spacing[2],
          }}>
            <span
              style={{
                fontSize: tokens.typography.bodySmall.size,
                fontWeight: 600,
                color: tokens.colors.neutral[600],
                fontFamily: tokens.typography.fontFamily.primary,
              }}
              aria-label={`${history.length} recent calculations`}
            >
              Recent ({history.length})
            </span>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                style={{
                  minHeight: '32px',
                  padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                  background: 'transparent',
                  color: tokens.colors.neutral[500],
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: tokens.radius.sm,
                  fontSize: tokens.typography.caption.size,
                  fontWeight: 500,
                  fontFamily: tokens.typography.fontFamily.primary,
                  cursor: 'pointer',
                  transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.default}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = tokens.colors.semantic.error;
                  e.currentTarget.style.borderColor = tokens.colors.semantic.error;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = tokens.colors.neutral[500];
                  e.currentTarget.style.borderColor = tokens.colors.neutral[300];
                }}
                aria-label="Clear calculation history"
              >
                Clear
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing[1.5],
              maxHeight: '120px',
              overflowY: 'auto',
              overflowX: 'hidden',
              width: '100%',
              boxSizing: 'border-box',
            }}
            role="list"
          >
            {history.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: `${tokens.spacing[3]} 0`,
                  color: tokens.colors.neutral[400],
                  fontSize: tokens.typography.bodySmall.size,
                  fontFamily: tokens.typography.fontFamily.primary,
                }}
                role="status"
              >
                No calculations yet
              </div>
            ) : (
              history.slice(0, 5).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleUseHistoryEntry(entry)}
                  style={{
                    padding: `${tokens.spacing[1.5]} ${tokens.spacing[2]}`,
                    background: tokens.colors.background.secondary,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                    transition: `all ${tokens.animation.timing.smooth} ${tokens.animation.easing.default}`,
                    textAlign: 'left',
                    width: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = tokens.colors.brand.teal;
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tokens.colors.background.secondary;
                    e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                  aria-label={`Use result: ${entry.expression} equals ${entry.result}`}
                  role="listitem"
                >
                  <div style={{
                    fontSize: tokens.typography.caption.size,
                    color: tokens.colors.neutral[500],
                    fontFamily: tokens.typography.fontFamily.mono,
                    marginBottom: tokens.spacing[0.5],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entry.expression}
                  </div>
                  <div style={{
                    fontSize: tokens.typography.bodySmall.size,
                    fontWeight: 600,
                    color: tokens.colors.neutral[800],
                    fontFamily: tokens.typography.fontFamily.mono,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    = {entry.result}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
    </>
  );
};

