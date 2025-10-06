import React from 'react';
import Icon from '../Icon';

interface ShortcutsHelpButtonProps {
  onClick: () => void;
}

export const ShortcutsHelpButton: React.FC<ShortcutsHelpButtonProps> = ({ onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '150px', // Position to the left of the 2D/3D toggle button
    padding: '12px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    color: 'white',
    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    boxShadow: isHovered
      ? '0 8px 25px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      : '0 4px 15px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    transform: isHovered ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    width: '48px',
    height: '48px',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
    userSelect: 'none'
  };

  return (
    <button
      onClick={onClick}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Keyboard Shortcuts (?)"
      aria-label="Show keyboard shortcuts"
    >
      <Icon name="help" color="white" size={24} />
    </button>
  );
};

export default ShortcutsHelpButton;
