import React, { useState, useRef, useEffect } from 'react';
import Icon from '../Icon';

interface FlipButtonProps {
  disabled: boolean;
  onFlip: (direction: 'horizontal' | 'vertical') => void;
}

export const FlipButton: React.FC<FlipButtonProps> = ({ disabled, onFlip }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<'horizontal' | 'vertical' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set data attribute to hide ShapeDimensions when dropdown is open
  useEffect(() => {
    if (dropdownOpen) {
      document.body.setAttribute('data-dropdown-open', 'true');
    } else {
      document.body.removeAttribute('data-dropdown-open');
    }

    return () => {
      document.body.removeAttribute('data-dropdown-open');
    };
  }, [dropdownOpen]);

  // Close on click outside
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close on ESC key
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [dropdownOpen]);

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    onFlip(direction);
    setDropdownOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Main button */}
      <button
        disabled={disabled}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '6px 10px',
          borderRadius: '4px',
          minWidth: '65px',
          height: '60px',
          border: '1px solid #e5e7eb',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: dropdownOpen ? '#f3f4f6' : '#ffffff',
          color: disabled ? '#9ca3af' : '#000000',
          transition: 'all 0.2s ease',
          fontSize: '11px',
          fontWeight: '500',
          opacity: disabled ? 0.5 : 1
        }}
        title="Flip shapes"
        onMouseEnter={(e) => {
          if (!disabled && !dropdownOpen) {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
          }
        }}
        onMouseLeave={(e) => {
          if (!dropdownOpen) {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }
        }}
      >
        <Icon name="flipHorizontal" size={20} />
        <span style={{ marginTop: '4px' }}>Flip</span>
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 9999,
          minWidth: '220px',
          overflow: 'hidden',
          animation: 'fadeIn 200ms ease'
        }}>
          {/* Horizontal option */}
          <button
            onClick={() => handleFlip('horizontal')}
            onMouseEnter={() => setHoveredItem('horizontal')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: hoveredItem === 'horizontal' ? '#F3F4F6' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              transition: 'background-color 200ms ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="flipHorizontal" size={18} />
              <span style={{ fontSize: '14px', color: '#1F2937' }}>Flip Horizontally</span>
            </div>
            <span style={{ color: '#6B7280', fontSize: '12px' }}>Shift+H</span>
          </button>

          {/* Vertical option */}
          <button
            onClick={() => handleFlip('vertical')}
            onMouseEnter={() => setHoveredItem('vertical')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: hoveredItem === 'vertical' ? '#F3F4F6' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              transition: 'background-color 200ms ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="flipVertical" size={18} />
              <span style={{ fontSize: '14px', color: '#1F2937' }}>Flip Vertically</span>
            </div>
            <span style={{ color: '#6B7280', fontSize: '12px' }}>Shift+V</span>
          </button>
        </div>
      )}

      {/* Inline fadeIn animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
