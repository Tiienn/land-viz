import React, { useEffect, useRef } from 'react';
import { ExportFilterPanel } from './ExportFilterPanel';
import type { ExportFilters } from '../../types/export';
import { DEFAULT_EXPORT_FILTERS } from '../../types/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: ExportFilters) => Promise<void>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [filters, setFilters] = React.useState<ExportFilters>(DEFAULT_EXPORT_FILTERS);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };

    if (isOpen) {
      // Set data attribute to signal modal is open (closes dropdowns)
      document.body.setAttribute('data-modal-open', 'true');

      document.addEventListener('keydown', handleEscape);
      // Focus trap - focus first focusable element
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.removeAttribute('data-modal-open');
      };
    }
  }, [isOpen, onClose, isExporting]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(filters);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      // Error will be shown via toast in App.tsx
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isExporting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2
            id="export-modal-title"
            style={{
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'Nunito Sans, sans-serif',
              color: '#1A1A1A',
              margin: 0,
            }}
          >
            Export to PDF
          </h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              color: '#666666',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close modal"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        {/* Filter panel */}
        <div style={{ marginBottom: '24px' }}>
          <ExportFilterPanel filters={filters} onChange={setFilters} />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
          }}
        >
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              backgroundColor: '#F5F5F5',
              color: '#333333',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'Nunito Sans, sans-serif',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              opacity: isExporting ? 0.5 : 1,
            }}
            aria-label="Cancel export"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              backgroundColor: '#00C4CC',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'Nunito Sans, sans-serif',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              opacity: isExporting ? 0.7 : 1,
            }}
            aria-label={isExporting ? 'Exporting PDF...' : 'Export to PDF'}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};
