/**
 * HelpModal Component
 *
 * Modal for displaying help information and instructions
 * - Clean Canva-inspired design
 * - Responsive layout
 * - Keyboard accessible (ESC to close)
 */

import React, { useEffect } from 'react';
import Icon from '../Icon';

interface HelpModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Help content (can include newlines) */
  content: string;
  /** Optional icon name */
  icon?: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  icon = 'help',
}) => {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Parse content for bullet points and formatting
  const renderContent = () => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Check if line starts with • or - for bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        const text = line.trim().substring(1).trim();
        return (
          <li key={index} style={{
            marginBottom: '8px',
            lineHeight: '1.6',
          }}>
            {text}
          </li>
        );
      }
      // Empty line creates spacing
      if (line.trim() === '') {
        return <div key={index} style={{ height: '8px' }} />;
      }
      // Regular paragraph
      return (
        <p key={index} style={{
          margin: '0 0 12px 0',
          lineHeight: '1.6',
        }}>
          {line}
        </p>
      );
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out',
        }}
        role="presentation"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
          maxWidth: '560px',
          width: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 96px)',
          zIndex: 10001,
          animation: 'slideIn 0.2s ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ECFEFF 0%, #F3E8FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name={icon} size={20} color="#0891B2" />
            </div>
            <h2
              id="help-modal-title"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
              }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close help modal"
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'background 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <Icon name="x" size={20} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            color: '#374151',
            fontSize: '14px',
          }}
        >
          {/* Check if content has bullet points */}
          {(content.includes('•') || content.includes('- ')) ? (
            <ul style={{
              margin: 0,
              padding: '0 0 0 20px',
              listStyleType: 'disc',
            }}>
              {renderContent()}
            </ul>
          ) : (
            renderContent()
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 196, 204, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 196, 204, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 196, 204, 0.15)';
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
};

export default HelpModal;
