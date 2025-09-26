import React from 'react';
import { useAppStore } from '@/store/useAppStore';

// SVG Icons
const Cube3DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Square2DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const View2DToggleButton: React.FC = () => {
  const { is2DMode, toggleViewMode } = useAppStore(state => ({
    is2DMode: state.viewState?.is2DMode || false,
    toggleViewMode: state.toggleViewMode
  }));

  const [isHovered, setIsHovered] = React.useState(false);

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    background: is2DMode
      ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
      : 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
    boxShadow: isHovered ? '0 4px 8px rgba(0, 0, 0, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'all 0.2s ease',
    fontFamily: 'Nunito Sans, sans-serif',
    minWidth: '120px',
    justifyContent: 'center'
  };

  return (
    <button
      onClick={toggleViewMode}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`Switch to ${is2DMode ? '3D' : '2D'} View (V)`}
      aria-label={`Switch to ${is2DMode ? '3D' : '2D'} View`}
    >
      {is2DMode ? <Square2DIcon /> : <Cube3DIcon />}
      <span>{is2DMode ? '2D View' : '3D View'}</span>
    </button>
  );
};

export default View2DToggleButton;