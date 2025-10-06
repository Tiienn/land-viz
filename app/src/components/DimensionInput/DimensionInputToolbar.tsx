/**
 * Dimension Input Toolbar Component
 * Spec 013: Direct Dimension Input
 *
 * Toolbar for typing exact dimensions before creating shapes
 */

import React, { useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useDimensionStore } from '@/store/useDimensionStore';
import { parseDimension, parseRadius } from '@/services/dimensionParser';

const DimensionInputToolbar: React.FC = () => {
  const activeTool = useAppStore(state => state.drawing.activeTool);

  const {
    dimensionInput,
    setDimensionInputWidth,
    setDimensionInputHeight,
    setDimensionInputRadius,
    setDimensionInputUnit,
    setDimensionInputRadiusMode,
    clearDimensionInput,
    setInputError,
    activateDimensionInput
  } = useDimensionStore();

  const {
    isDimensionInputActive,
    inputWidth,
    inputHeight,
    inputRadius,
    inputUnit,
    inputRadiusMode,
    inputError
  } = dimensionInput;

  // Only show for rectangle and circle tools
  const isCompatibleTool = activeTool === 'rectangle' || activeTool === 'circle';

  // Auto-activate when user types a number
  useEffect(() => {
    if (!isCompatibleTool) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate if:
      // 1. User types a number
      // 2. Dimension input not already active
      // 3. Focus is not in an input field
      if (
        /^\d$/.test(e.key) &&
        !isDimensionInputActive &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        // Activate dimension input and pre-fill first character
        if (activeTool === 'rectangle') {
          setDimensionInputWidth(e.key);
          activateDimensionInput();

          // Focus the width input
          setTimeout(() => {
            const inputField = document.querySelector(
              '[data-dimension-input="width"]'
            ) as HTMLInputElement;
            inputField?.focus();
            // Move cursor to end
            inputField?.setSelectionRange(inputField.value.length, inputField.value.length);
          }, 0);
        } else if (activeTool === 'circle') {
          setDimensionInputRadius(e.key);
          activateDimensionInput();

          // Focus the radius input
          setTimeout(() => {
            const inputField = document.querySelector(
              '[data-dimension-input="radius"]'
            ) as HTMLInputElement;
            inputField?.focus();
            // Move cursor to end
            inputField?.setSelectionRange(inputField.value.length, inputField.value.length);
          }, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, isDimensionInputActive, setDimensionInputWidth, setDimensionInputRadius, activateDimensionInput]);

  // Clear input when tool changes
  useEffect(() => {
    if (!isCompatibleTool) {
      clearDimensionInput();
    }
  }, [activeTool, isCompatibleTool, clearDimensionInput]);

  // Validate on input change
  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Allow only numbers, decimal point, and unit letters (m, ft, yd)
    // Allow: 10, 10.5, 10m, 10ft, 10yd
    const validPattern = /^[\d.]*[a-z]*$/i;
    if (!validPattern.test(value)) {
      return; // Reject invalid characters
    }

    setDimensionInputWidth(value);

    // Validate if both width and height are provided
    if (value && inputHeight) {
      const parsed = parseDimension(`${value}x${inputHeight}`);
      if (!parsed.valid) {
        setInputError(parsed.error || 'Invalid input');
      } else {
        setInputError(null);
      }
    } else {
      setInputError(null);
    }
  }, [inputHeight, setDimensionInputWidth, setInputError]);

  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Allow only numbers, decimal point, and unit letters
    const validPattern = /^[\d.]*[a-z]*$/i;
    if (!validPattern.test(value)) {
      return; // Reject invalid characters
    }

    setDimensionInputHeight(value);

    // Validate if both width and height are provided
    if (inputWidth && value) {
      const parsed = parseDimension(`${inputWidth}x${value}`);
      if (!parsed.valid) {
        setInputError(parsed.error || 'Invalid input');
      } else {
        setInputError(null);
      }
    } else {
      setInputError(null);
    }
  }, [inputWidth, setDimensionInputHeight, setInputError]);

  const handleRadiusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Allow only numbers and decimal point (NO r/d prefix since we have dropdown)
    const validPattern = /^[\d.]*$/;
    if (!validPattern.test(value)) {
      return; // Reject invalid characters
    }

    setDimensionInputRadius(value);

    // Validate radius - just check if it's a positive number
    if (value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setInputError('Must be a positive number');
      } else if (numValue < 0.1) {
        setInputError('Value too small (minimum 0.1)');
      } else if (numValue > 1000) {
        setInputError('Value too large (maximum 1000)');
      } else {
        setInputError(null);
      }
    } else {
      setInputError(null);
    }
  }, [setDimensionInputRadius, setInputError]);

  const handleUnitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDimensionInputUnit(e.target.value);
  }, [setDimensionInputUnit]);

  const handleRadiusModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDimensionInputRadiusMode(e.target.value as 'r' | 'd');
  }, [setDimensionInputRadiusMode]);

  const handleClear = useCallback(() => {
    clearDimensionInput();
  }, [clearDimensionInput]);

  // Don't render if tool is not compatible
  if (!isCompatibleTool) {
    return null;
  }

  // Canva-inspired styling
  const toolbarContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontFamily: 'Nunito Sans, sans-serif',
    fontSize: '14px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'all 200ms ease',
    opacity: isDimensionInputActive ? 1 : 0.7
  };

  const labelStyle: React.CSSProperties = {
    color: '#6B7280',
    fontWeight: 500,
    fontSize: '13px',
    whiteSpace: 'nowrap'
  };

  const inputFieldStyle: React.CSSProperties = {
    width: '80px',
    padding: '6px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center',
    transition: 'border-color 200ms',
    outline: 'none',
    fontFamily: 'Nunito Sans, sans-serif'
  };

  const inputFieldFocusStyle: React.CSSProperties = {
    ...inputFieldStyle,
    borderColor: '#3B82F6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'Nunito Sans, sans-serif'
  };

  const clearButtonStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: '1',
    transition: 'all 200ms',
    outline: 'none'
  };

  const clearButtonHoverStyle: React.CSSProperties = {
    ...clearButtonStyle,
    backgroundColor: '#E5E7EB',
    color: '#374151'
  };

  const errorStyle: React.CSSProperties = {
    color: '#EF4444',
    fontSize: '12px',
    marginLeft: '4px',
    fontWeight: 500
  };

  const separatorStyle: React.CSSProperties = {
    color: '#9CA3AF',
    fontWeight: 600,
    fontSize: '16px'
  };

  return (
    <div style={toolbarContainerStyle}>
      <label style={labelStyle}>📏 Dimensions:</label>

      {activeTool === 'rectangle' && (
        <>
          <input
            data-dimension-input="width"
            type="text"
            placeholder="Width"
            value={inputWidth}
            onChange={handleWidthChange}
            style={inputFieldStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              activateDimensionInput();
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB';
              e.target.style.boxShadow = 'none';
            }}
          />
          <span style={separatorStyle}>×</span>
          <input
            data-dimension-input="height"
            type="text"
            placeholder="Height"
            value={inputHeight}
            onChange={handleHeightChange}
            style={inputFieldStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              activateDimensionInput();
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB';
              e.target.style.boxShadow = 'none';
            }}
          />
        </>
      )}

      {activeTool === 'circle' && (
        <>
          <select
            value={inputRadiusMode}
            onChange={handleRadiusModeChange}
            style={selectStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB';
            }}
            title="Select radius or diameter"
          >
            <option value="r">r (radius)</option>
            <option value="d">d (diameter)</option>
          </select>
          <input
            data-dimension-input="radius"
            type="text"
            placeholder="Value"
            value={inputRadius}
            onChange={handleRadiusChange}
            style={inputFieldStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              activateDimensionInput();
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB';
              e.target.style.boxShadow = 'none';
            }}
          />
        </>
      )}

      <select
        value={inputUnit}
        onChange={handleUnitChange}
        style={selectStyle}
        onFocus={(e) => {
          e.target.style.borderColor = '#3B82F6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#D1D5DB';
        }}
      >
        <option value="m">m</option>
        <option value="ft">ft</option>
        <option value="yd">yd</option>
      </select>

      {isDimensionInputActive && (
        <button
          onClick={handleClear}
          style={clearButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E5E7EB';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F3F4F6';
            e.currentTarget.style.color = '#6B7280';
          }}
          title="Clear dimension input"
        >
          ✕
        </button>
      )}

      {inputError && <div style={errorStyle}>{inputError}</div>}
    </div>
  );
};

export default DimensionInputToolbar;
