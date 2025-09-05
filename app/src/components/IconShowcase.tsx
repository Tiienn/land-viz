import React from 'react';
import Icon from './Icon';

// Icon showcase component for testing and design documentation
const IconShowcase: React.FC = () => {
  const icons = [
    // Left Panel Icons
    { name: 'home', color: '#00C4CC', label: 'Home' },
    { name: 'visualComparison', color: '#7C3AED', label: 'Visual Comparison' },
    { name: 'unitConverter', color: '#EC4899', label: 'Unit Converter' },
    { name: 'quickTools', color: '#F59E0B', label: 'Quick Tools' },
    { name: 'layers', color: '#22C55E', label: 'Layers' },
    
    // Right Panel Icons
    { name: 'landMetrics', color: '#00C4CC', label: 'Land Metrics' },
    { name: 'terrain', color: '#7C3AED', label: 'Terrain' },
    { name: 'dimensions', color: '#EC4899', label: 'Dimensions' },
    { name: 'properties', color: '#F59E0B', label: 'Properties' }
  ];

  return (
    <div style={{
      padding: '40px',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          Land Visualizer Icon System
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          Professional SVG icons designed with Canva-inspired principles
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          marginBottom: '48px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Left Panel Icons
            </h2>
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {icons.slice(0, 5).map((icon) => (
                <div key={icon.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #f3f4f6'
                }}>
                  <Icon name={icon.name} size={24} color={icon.color} />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>
                      {icon.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {icon.name}
                    </div>
                  </div>
                  <div style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <Icon name={icon.name} size={18} color={icon.color} />
                    <Icon name={icon.name} size={20} color={icon.color} />
                    <Icon name={icon.name} size={24} color={icon.color} />
                    <Icon name={icon.name} size={28} color={icon.color} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Right Panel Icons
            </h2>
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {icons.slice(5).map((icon) => (
                <div key={icon.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #f3f4f6'
                }}>
                  <Icon name={icon.name} size={24} color={icon.color} />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>
                      {icon.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {icon.name}
                    </div>
                  </div>
                  <div style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <Icon name={icon.name} size={18} color={icon.color} />
                    <Icon name={icon.name} size={20} color={icon.color} />
                    <Icon name={icon.name} size={24} color={icon.color} />
                    <Icon name={icon.name} size={28} color={icon.color} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Design Specifications
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                Design Principles
              </h3>
              <ul style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, paddingLeft: '20px' }}>
                <li>24x24px viewBox for consistency</li>
                <li>Stroke-based design (not filled)</li>
                <li>2px stroke width for clarity</li>
                <li>Rounded line caps and joins</li>
                <li>Semantic and intuitive symbols</li>
                <li>Canva-inspired clean aesthetics</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                Color Palette
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { color: '#00C4CC', name: 'Primary Teal' },
                  { color: '#7C3AED', name: 'Secondary Purple' },
                  { color: '#EC4899', name: 'Accent Pink' },
                  { color: '#22C55E', name: 'Success Green' },
                  { color: '#F59E0B', name: 'Warning Orange' }
                ].map((colorInfo) => (
                  <div key={colorInfo.color} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      background: colorInfo.color,
                      border: '1px solid #e5e7eb'
                    }} />
                    {colorInfo.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconShowcase;