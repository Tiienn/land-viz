import React from 'react';
import Icon from '../Icon';

interface InsertAreaButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const InsertAreaButton: React.FC<InsertAreaButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Insert Area"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        border: 'none',
        borderRadius: '8px',
        background: disabled
          ? '#9CA3AF'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 200ms ease',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      <Icon name="calculator" size={20} />
    </button>
  );
};

export default InsertAreaButton;