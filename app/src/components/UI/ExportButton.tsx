import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import { useAppStore } from '../../store/useAppStore';

export const ExportButton: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<'excel' | 'dxf' | 'pdf' | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openExportModal = useAppStore((state) => state.openExportModal);
  const shapes = useAppStore((state) => state.shapes);
  const hasShapes = shapes.length > 0;

  // Update dropdown position when opened
  useEffect(() => {
    if (dropdownOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [dropdownOpen]);

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
      const target = e.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
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

  // Close dropdown when modal opens
  useEffect(() => {
    if (!dropdownOpen) return;

    const observer = new MutationObserver(() => {
      if (document.body.hasAttribute('data-modal-open')) {
        setDropdownOpen(false);
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-modal-open'],
    });

    return () => observer.disconnect();
  }, [dropdownOpen]);

  const handleExportClick = (format: 'excel' | 'dxf' | 'pdf') => {
    setDropdownOpen(false);

    if (format === 'pdf') {
      // Open our new PDF export modal
      openExportModal();
    } else {
      // For Excel and DXF, use the existing export system
      // This will be handled by the parent App component's handleQuickExport
      const event = new CustomEvent('quickExport', { detail: { format } });
      window.dispatchEvent(event);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', zIndex: 5000 }}>
      {/* Main button */}
      <button
        disabled={!hasShapes}
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
          cursor: hasShapes ? 'pointer' : 'not-allowed',
          background: dropdownOpen ? '#f3f4f6' : '#ffffff',
          color: hasShapes ? '#000000' : '#9ca3af',
          transition: 'all 0.2s ease',
          fontSize: '11px',
          fontWeight: '500',
          opacity: hasShapes ? 1 : 0.5
        }}
        title="Export to various formats"
        onMouseEnter={(e) => {
          if (hasShapes && !dropdownOpen) {
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
        <span style={{ marginTop: '4px' }}>Export</span>
      </button>

      {/* Dropdown menu - rendered via Portal */}
      {dropdownOpen && hasShapes && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            backgroundColor: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 5001,
            minWidth: '220px',
            overflow: 'hidden',
            animation: 'fadeIn 200ms ease'
          }}>
          {/* Excel option */}
          <button
            onClick={() => handleExportClick('excel')}
            onMouseEnter={() => setHoveredItem('excel')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: hoveredItem === 'excel' ? '#F3F4F6' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              transition: 'background-color 200ms ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="file" size={18} />
              <span style={{ fontSize: '14px', color: '#1F2937' }}>Excel (.xlsx)</span>
            </div>
          </button>

          {/* DXF option */}
          <button
            onClick={() => handleExportClick('dxf')}
            onMouseEnter={() => setHoveredItem('dxf')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: hoveredItem === 'dxf' ? '#F3F4F6' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              transition: 'background-color 200ms ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="file" size={18} />
              <span style={{ fontSize: '14px', color: '#1F2937' }}>DXF (.dxf)</span>
            </div>
          </button>

          {/* PDF option */}
          <button
            onClick={() => handleExportClick('pdf')}
            onMouseEnter={() => setHoveredItem('pdf')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: hoveredItem === 'pdf' ? '#F3F4F6' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              transition: 'background-color 200ms ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="file" size={18} />
              <span style={{ fontSize: '14px', color: '#1F2937' }}>PDF (.pdf)</span>
            </div>
            <span style={{ color: '#6B7280', fontSize: '12px' }}>Ctrl+E</span>
          </button>
        </div>,
        document.body
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
