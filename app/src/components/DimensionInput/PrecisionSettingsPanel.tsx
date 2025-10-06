/**
 * Precision Settings Panel Component
 * Spec 013: Direct Dimension Input
 *
 * Settings panel for precision, units, and snapping configuration
 */

import React, { useCallback } from 'react';
import { useDimensionStore } from '@/store/useDimensionStore';

const PrecisionSettingsPanel: React.FC = () => {
  const { precision, setPrecision } = useDimensionStore();

  const handleSnapPrecisionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPrecision({ snapPrecision: Number(e.target.value) });
    },
    [setPrecision]
  );

  const handleDisplayPrecisionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      if (value >= 0 && value <= 4) {
        setPrecision({ displayPrecision: value });
      }
    },
    [setPrecision]
  );

  const handlePreferredUnitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPrecision({ preferredUnit: e.target.value });
    },
    [setPrecision]
  );

  const handleAngleSnapChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPrecision({ angleSnap: Number(e.target.value) });
    },
    [setPrecision]
  );

  // Canva-inspired styling
  const panelStyle: React.CSSProperties = {
    padding: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    fontFamily: 'Nunito Sans, sans-serif'
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const settingRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '12px'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#6B7280',
    flex: '1'
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'Nunito Sans, sans-serif',
    color: '#374151',
    minWidth: '100px',
    transition: 'border-color 200ms'
  };

  const numberInputStyle: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    width: '60px',
    textAlign: 'center',
    outline: 'none',
    fontFamily: 'Nunito Sans, sans-serif',
    color: '#374151',
    transition: 'border-color 200ms'
  };

  const unitTextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9CA3AF',
    marginLeft: '4px'
  };

  const dividerStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: '#E5E7EB',
    margin: '12px 0'
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span>⚙️</span>
        <span>Precision Settings</span>
      </div>

      <div style={settingRowStyle}>
        <label style={labelStyle}>Snap Precision:</label>
        <select
          value={precision.snapPrecision}
          onChange={handleSnapPrecisionChange}
          style={selectStyle}
          onFocus={(e) => {
            e.target.style.borderColor = '#3B82F6';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D1D5DB';
          }}
        >
          <option value={0.1}>0.1m</option>
          <option value={0.5}>0.5m</option>
          <option value={1}>1m</option>
          <option value={5}>5m</option>
        </select>
      </div>

      <div style={settingRowStyle}>
        <label style={labelStyle}>Display Precision:</label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            min={0}
            max={4}
            value={precision.displayPrecision}
            onChange={handleDisplayPrecisionChange}
            style={numberInputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB';
            }}
          />
          <span style={unitTextStyle}>decimals</span>
        </div>
      </div>

      <div style={settingRowStyle}>
        <label style={labelStyle}>Preferred Unit:</label>
        <select
          value={precision.preferredUnit}
          onChange={handlePreferredUnitChange}
          style={selectStyle}
          onFocus={(e) => {
            e.target.style.borderColor = '#3B82F6';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D1D5DB';
          }}
        >
          <option value="m">Meters (m)</option>
          <option value="ft">Feet (ft)</option>
          <option value="yd">Yards (yd)</option>
        </select>
      </div>

      <div style={dividerStyle} />

      <div style={settingRowStyle}>
        <label style={labelStyle}>Angle Snap:</label>
        <select
          value={precision.angleSnap}
          onChange={handleAngleSnapChange}
          style={selectStyle}
          onFocus={(e) => {
            e.target.style.borderColor = '#3B82F6';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D1D5DB';
          }}
        >
          <option value={15}>15°</option>
          <option value={30}>30°</option>
          <option value={45}>45°</option>
          <option value={90}>90°</option>
        </select>
      </div>

      {/* Info text */}
      <div
        style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#F3F4F6',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#6B7280',
          lineHeight: '1.4'
        }}
      >
        💡 These settings are saved automatically and persist between sessions.
      </div>
    </div>
  );
};

export default PrecisionSettingsPanel;
