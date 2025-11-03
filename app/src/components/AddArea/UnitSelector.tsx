import React from 'react';
import type { AreaUnit } from '@/types';

interface UnitSelectorProps {
  value?: AreaUnit;
  onChange: (unit: AreaUnit) => void;
}

const AREA_UNITS = [
  { value: 'sqm', label: 'Square Meters', symbol: 'm²', description: 'Metric standard' },
  { value: 'sqft', label: 'Square Feet', symbol: 'ft²', description: 'Imperial standard' },
  { value: 'acres', label: 'Acres', symbol: 'acres', description: 'Large land areas' },
  { value: 'hectares', label: 'Hectares', symbol: 'ha', description: 'Metric large areas' },
  { value: 'sqkm', label: 'Square Kilometers', symbol: 'km²', description: 'Very large areas' },
  { value: 'toise', label: 'Toise', symbol: 'T', description: 'Historical French land unit (3.8 m²)' },
  { value: 'perches', label: 'Perches (British)', symbol: 'perch', description: 'Historical British land unit (25.29 m²)' },
  { value: 'arpent-na', label: 'Arpent (North America)', symbol: 'arp-na', description: 'North American land unit (3,419 m²)' },
  { value: 'arpent-paris', label: 'Arpent (Paris)', symbol: 'arp-pa', description: 'Historical Parisian unit (5,107 m²)' }
] as const;

export const UnitSelector: React.FC<UnitSelectorProps> = ({ value = 'sqm', onChange }) => {
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
        Unit *
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AreaUnit)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '2px solid #D1D5DB',
          fontSize: '16px',
          fontFamily: 'Nunito Sans, sans-serif',
          backgroundColor: 'white',
          transition: 'all 0.2s ease',
          outline: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3B82F6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#D1D5DB';
        }}
      >
        {AREA_UNITS.map(unit => (
          <option key={unit.value} value={unit.value}>
            {unit.label} ({unit.symbol}) - {unit.description}
          </option>
        ))}
      </select>

      <div style={{
        marginTop: '4px',
        fontSize: '12px',
        color: '#6B7280',
        fontFamily: 'Nunito Sans, sans-serif'
      }}>
        Choose the unit for your area measurement
      </div>
    </div>
  );
};

export default UnitSelector;