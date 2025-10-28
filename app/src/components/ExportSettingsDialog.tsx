import React, { useState } from 'react';

export interface ExportSettings {
  format: 'excel' | 'dxf' | 'geojson' | 'pdf';
  coordinateSystem: 'local' | 'utm' | 'wgs84';
  units: 'metric' | 'imperial';
  precision: number;
  includeCalculations: boolean;
  includeMeasurements: boolean;
  includeMetadata: boolean;
  paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
}

interface ExportSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
  initialFormat: ExportSettings['format'];
}

const ExportSettingsDialog: React.FC<ExportSettingsDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  initialFormat
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: initialFormat,
    coordinateSystem: initialFormat === 'geojson' ? 'wgs84' : 'local',
    units: 'metric',
    precision: initialFormat === 'geojson' ? 6 : initialFormat === 'dxf' ? 3 : 2,
    includeCalculations: true,
    includeMeasurements: true,
    includeMetadata: true,
    paperSize: 'A4',
    orientation: 'landscape'
  });

  const handleSettingChange = <K extends keyof ExportSettings>(
    key: K, 
    value: ExportSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExport = () => {
    onExport(settings);
    onClose();
  };

  const formatDetails = {
    excel: {
      name: 'Excel Spreadsheet',
      extension: '.xlsx',
      icon: 'file',
      description: 'Comprehensive data export with measurements and calculations'
    },
    dxf: {
      name: 'AutoCAD Drawing',
      extension: '.dxf',
      icon: 'file',
      description: 'CAD format compatible with AutoCAD and other design software'
    },
    geojson: {
      name: 'GeoJSON Geographic Data',
      extension: '.geojson',
      icon: 'globe',
      description: 'Geographic data format for GIS applications and mapping'
    },
    pdf: {
      name: 'PDF Survey Report',
      extension: '.pdf',
      icon: 'file',
      description: 'Professional survey report with visualizations and data'
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        width: '640px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{formatDetails[settings.format].icon}</span>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                margin: 0, 
                color: '#111827' 
              }}>
                Export Settings
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                margin: '4px 0 0',
                fontWeight: '400'
              }}>
                {formatDetails[settings.format].name} ({formatDetails[settings.format].extension})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflow: 'auto',
          flex: 1
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Format Selection */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Export Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Object.entries(formatDetails).map(([format, details]) => (
                  <button
                    key={format}
                    onClick={() => handleSettingChange('format', format as ExportSettings['format'])}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      border: `2px solid ${settings.format === format ? '#3b82f6' : '#e5e5e5'}`,
                      borderRadius: '8px',
                      background: settings.format === format ? '#dbeafe' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: '10px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{details.icon}</span>
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: settings.format === format ? '#1d4ed8' : '#374151'
                      }}>
                        {details.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        marginTop: '2px'
                      }}>
                        {details.extension}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinate System */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Coordinate System
              </label>
              <select
                value={settings.coordinateSystem}
                onChange={(e) => handleSettingChange('coordinateSystem', e.target.value as ExportSettings['coordinateSystem'])}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="local">Local Coordinates (Project Origin)</option>
                <option value="utm">UTM (Universal Transverse Mercator)</option>
                <option value="wgs84">WGS84 (World Geodetic System)</option>
              </select>
            </div>

            {/* Units and Precision */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Units
                </label>
                <select
                  value={settings.units}
                  onChange={(e) => handleSettingChange('units', e.target.value as ExportSettings['units'])}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="metric">Metric (m, m², ha)</option>
                  <option value="imperial">Imperial (ft, ft², acres)</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Precision (decimal places)
                </label>
                <select
                  value={settings.precision}
                  onChange={(e) => handleSettingChange('precision', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value={1}>1 decimal place</option>
                  <option value={2}>2 decimal places</option>
                  <option value={3}>3 decimal places</option>
                  <option value={4}>4 decimal places</option>
                  <option value={6}>6 decimal places (GPS)</option>
                </select>
              </div>
            </div>

            {/* PDF-specific settings */}
            {settings.format === 'pdf' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Paper Size
                  </label>
                  <select
                    value={settings.paperSize}
                    onChange={(e) => handleSettingChange('paperSize', e.target.value as ExportSettings['paperSize'])}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="A3">A3 (297 × 420 mm)</option>
                    <option value="Letter">Letter (8.5 × 11 in)</option>
                    <option value="Legal">Legal (8.5 × 14 in)</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Orientation
                  </label>
                  <select
                    value={settings.orientation}
                    onChange={(e) => handleSettingChange('orientation', e.target.value as ExportSettings['orientation'])}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
              </div>
            )}

            {/* Content Options */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                Include in Export
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.includeCalculations}
                    onChange={(e) => handleSettingChange('includeCalculations', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>Area and perimeter calculations</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.includeMeasurements}
                    onChange={(e) => handleSettingChange('includeMeasurements', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>Detailed measurements and dimensions</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.includeMetadata}
                    onChange={(e) => handleSettingChange('includeMetadata', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>Shape metadata (names, creation dates, etc.)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e5e5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: 0
          }}>
            {formatDetails[settings.format].description}
          </p>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              Cancel
            </button>
            
            <button
              onClick={handleExport}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              <span>{formatDetails[settings.format].icon}</span>
              Export {formatDetails[settings.format].extension}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSettingsDialog;