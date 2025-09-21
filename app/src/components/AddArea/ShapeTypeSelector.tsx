import React from 'react';

interface ShapeTypeSelectorProps {
  value?: 'square' | 'rectangle' | 'circle';
  aspectRatio?: number;
  onChange: (shapeType: 'square' | 'rectangle' | 'circle', aspectRatio?: number) => void;
}

const SHAPE_TYPES = [
  {
    value: 'square',
    label: 'Square',
    description: 'Equal sides, perfect symmetry',
    icon: '⬜',
    preview: '□'
  },
  {
    value: 'rectangle',
    label: 'Rectangle',
    description: 'Customizable proportions',
    icon: '▭',
    preview: '▬'
  },
  {
    value: 'circle',
    label: 'Circle',
    description: 'Circular boundary',
    icon: '⭕',
    preview: '○'
  }
] as const;

export const ShapeTypeSelector: React.FC<ShapeTypeSelectorProps> = ({
  value = 'square',
  aspectRatio = 1.5,
  onChange
}) => {
  const handleShapeChange = (shapeType: typeof value) => {
    onChange(shapeType, shapeType === 'rectangle' ? aspectRatio : undefined);
  };

  const handleAspectRatioChange = (newRatio: number) => {
    if (value === 'rectangle') {
      onChange(value, newRatio);
    }
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
        Shape Type *
      </label>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: value === 'rectangle' ? '16px' : '0'
      }}>
        {SHAPE_TYPES.map(shape => {
          const isSelected = value === shape.value;

          return (
            <button
              key={shape.value}
              type="button"
              onClick={() => handleShapeChange(shape.value)}
              style={{
                padding: '16px 12px',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? '#3B82F6' : '#D1D5DB'}`,
                backgroundColor: isSelected ? '#EBF8FF' : 'white',
                color: isSelected ? '#1E40AF' : '#374151',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Nunito Sans, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#9CA3AF';
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <span style={{ fontSize: '24px', lineHeight: 1 }}>{shape.icon}</span>
              <div>
                <div style={{ fontWeight: '600' }}>{shape.label}</div>
                <div style={{
                  fontSize: '11px',
                  color: isSelected ? '#3B82F6' : '#6B7280',
                  marginTop: '2px'
                }}>
                  {shape.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {value === 'rectangle' && (
        <div style={{
          padding: '16px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0'
        }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
            fontFamily: 'Nunito Sans, sans-serif'
          }}>
            Aspect Ratio (Width : Height)
          </label>

          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            {[1, 1.5, 2, 3].map(ratio => (
              <button
                key={ratio}
                type="button"
                onClick={() => handleAspectRatioChange(ratio)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${aspectRatio === ratio ? '#3B82F6' : '#D1D5DB'}`,
                  backgroundColor: aspectRatio === ratio ? '#EBF8FF' : 'white',
                  color: aspectRatio === ratio ? '#1E40AF' : '#374151',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Nunito Sans, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {ratio === 1 ? '1:1' : `${ratio}:1`}
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '12px',
              color: '#6B7280',
              fontFamily: 'Nunito Sans, sans-serif',
              minWidth: '40px'
            }}>
              Custom:
            </span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={aspectRatio}
              onChange={(e) => handleAspectRatioChange(parseFloat(e.target.value))}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor: '#D1D5DB',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '12px',
              color: '#374151',
              fontFamily: 'Nunito Sans, sans-serif',
              minWidth: '40px',
              fontWeight: '600'
            }}>
              {aspectRatio.toFixed(1)}:1
            </span>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '4px',
        fontSize: '12px',
        color: '#6B7280',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Choose the shape that best fits your needs
      </div>
    </div>
  );
};

export default ShapeTypeSelector;