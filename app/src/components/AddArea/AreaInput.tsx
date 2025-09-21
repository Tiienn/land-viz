import React from 'react';
import { sanitizeAreaInput } from '@/utils/validation';

interface AreaInputProps {
  value?: number;
  onChange: (value: number) => void;
  errors: string[];
}

export const AreaInput: React.FC<AreaInputProps> = ({ value, onChange, errors }) => {
  const [displayValue, setDisplayValue] = React.useState(value?.toString() || '');
  const [isFocused, setIsFocused] = React.useState(false);
  const hasError = errors.length > 0;

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value?.toString() || '');
    }
  }, [value, isFocused]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    setDisplayValue(rawValue);

    const sanitized = sanitizeAreaInput(rawValue);
    if (sanitized !== value) {
      onChange(sanitized);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format display value on blur if valid
    if (value && value > 0) {
      setDisplayValue(value.toString());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '6px',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Area Value *
      </label>

      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="Enter area value (e.g., 3000)"
        autoComplete="off"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: `2px solid ${hasError ? '#EF4444' : isFocused ? '#3B82F6' : '#D1D5DB'}`,
          fontSize: '16px',
          fontFamily: 'Nunito Sans, sans-serif',
          backgroundColor: hasError ? '#FEF2F2' : 'white',
          transition: 'all 0.2s ease',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        aria-invalid={hasError}
        aria-describedby={hasError ? 'area-input-error' : undefined}
      />

      {hasError && (
        <div
          id="area-input-error"
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#EF4444',
            fontFamily: 'Nunito Sans, sans-serif'
          }}
        >
          {errors[0]}
        </div>
      )}

      <div style={{
        marginTop: '4px',
        fontSize: '12px',
        color: '#6B7280',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Enter a positive number for the desired area
      </div>
    </div>
  );
};

export default AreaInput;