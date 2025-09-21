import React from 'react';
import type { AreaPreset } from '../../types/presets';
import { getUnitLabel } from '../../utils/areaCalculations';

interface PresetCardProps {
  preset: AreaPreset;
  isSelected: boolean;
  onClick: () => void;
  onCustomize: () => void;
}

/**
 * Get shape icon based on shape type
 */
const getShapeIcon = (shapeType: AreaPreset['shapeType']) => {
  const iconStyle = {
    width: '16px',
    height: '16px',
    fill: 'currentColor',
  };

  switch (shapeType) {
    case 'square':
      return (
        <svg style={iconStyle} viewBox="0 0 16 16">
          <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'rectangle':
      return (
        <svg style={iconStyle} viewBox="0 0 16 16">
          <rect x="2" y="4" width="12" height="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'circle':
      return (
        <svg style={iconStyle} viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    default:
      return null;
  }
};

/**
 * Calculate preview dimensions for the preset
 */
const calculatePreviewDimensions = (preset: AreaPreset): string => {
  const { area, unit, shapeType, aspectRatio = 1 } = preset;

  // Convert area to square meters for calculation
  let areaInSqM = area;
  switch (unit) {
    case 'sqft':
      areaInSqM = area * 0.092903;
      break;
    case 'acres':
      areaInSqM = area * 4046.86;
      break;
    case 'hectares':
      areaInSqM = area * 10000;
      break;
    case 'sqkm':
      areaInSqM = area * 1000000;
      break;
  }

  if (shapeType === 'circle') {
    const radius = Math.sqrt(areaInSqM / Math.PI);
    return `Radius: ${radius.toFixed(1)}m`;
  } else {
    // Rectangle or square
    const width = Math.sqrt(areaInSqM * aspectRatio);
    const height = areaInSqM / width;
    return `${width.toFixed(1)}m × ${height.toFixed(1)}m`;
  }
};

/**
 * Format area value for display
 */
const formatAreaValue = (area: number, unit: AreaPreset['unit']): string => {
  // Format with appropriate decimal places
  const decimals = area >= 100 ? 0 : area >= 10 ? 1 : 2;
  return `${area.toFixed(decimals)} ${getUnitLabel(unit)}`;
};

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isSelected,
  onClick,
  onCustomize,
}) => {
  const cardStyle: React.CSSProperties = {
    border: `2px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`,
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
    transition: 'all 0.2s ease',
    minHeight: '140px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'relative',
    ':hover': {
      borderColor: '#3B82F6',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px',
  };

  const areaDisplayStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Nunito Sans, sans-serif',
  };

  const shapeTypeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    color: '#6B7280',
    fontSize: '14px',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Nunito Sans, sans-serif',
    marginBottom: '4px',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B7280',
    lineHeight: '1.4',
    flex: 1,
  };

  const dimensionsStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: '4px',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Nunito Sans, sans-serif',
  };

  const customizeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#F3F4F6',
    color: '#374151',
    ':hover': {
      backgroundColor: '#E5E7EB',
    },
  };

  const categoryBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: preset.isCustom ? '#EF4444' : '#10B981',
    color: 'white',
    textTransform: 'uppercase',
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement;
        if (actions) actions.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement;
        if (actions) actions.style.opacity = '0';
      }}
    >
      {/* Category Badge */}
      <div style={categoryBadgeStyle}>
        {preset.isCustom ? 'Custom' : preset.category}
      </div>

      {/* Header with Area and Shape Type */}
      <div style={headerStyle}>
        <div style={areaDisplayStyle}>
          {formatAreaValue(preset.area, preset.unit)}
        </div>
        <div style={shapeTypeStyle}>
          {getShapeIcon(preset.shapeType)}
        </div>
      </div>

      {/* Preset Name */}
      <div style={nameStyle}>{preset.name}</div>

      {/* Description */}
      <div style={descriptionStyle}>{preset.description}</div>

      {/* Preview Dimensions */}
      <div style={dimensionsStyle}>
        {calculatePreviewDimensions(preset)}
      </div>

      {/* Actions (shown on hover) */}
      <div style={actionsStyle} data-actions>
        <button
          style={customizeButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onCustomize();
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '#E5E7EB';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '#F3F4F6';
          }}
        >
          Customize
        </button>
      </div>
    </div>
  );
};