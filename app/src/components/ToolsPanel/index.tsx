import React from 'react';
import { useToolHistoryStore } from '../../store/useToolHistoryStore';
import { logger } from '../../utils/logger';
import { sanitizeJSON, sanitizeFilename } from '../../utils/inputSanitizer';
import Icon from '../Icon';
import { RecentActions } from './RecentActions';
import { FrequentlyUsed } from './FrequentlyUsed';
import { QuickWorkflows } from './QuickWorkflows';

// Maximum file size for imports: 5MB (must match useToolHistoryStore.ts)
const MAX_IMPORT_SIZE = 5 * 1024 * 1024;

interface ToolsPanelProps {
  isExpanded: boolean;
  onClose: () => void;
  inline?: boolean;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ isExpanded, onClose, inline = false }) => {
  const { clearHistory, exportWorkflows, importWorkflows } = useToolHistoryStore();

  const handleExport = () => {
    const data = exportWorkflows();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize filename to prevent path traversal
    const timestamp = Date.now();
    const filename = sanitizeFilename(`workflows-${timestamp}.json`);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    logger.log(`Workflows exported to ${filename}`);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // SECURITY: Check file size BEFORE reading to prevent DoS attacks
      if (file.size > MAX_IMPORT_SIZE) {
        const maxSizeMB = (MAX_IMPORT_SIZE / 1024 / 1024).toFixed(1);
        logger.error(`File too large: ${file.size} bytes (max: ${MAX_IMPORT_SIZE} bytes)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as string;

          // SECURITY: Sanitize JSON input with size validation
          const sanitized = sanitizeJSON(data, { maxSize: MAX_IMPORT_SIZE });
          if (!sanitized) {
            logger.error('Invalid JSON data or size exceeded');
            return;
          }

          // Re-stringify sanitized data for import
          const sanitizedJSON = JSON.stringify(sanitized);
          const success = importWorkflows(sanitizedJSON);

          if (success) {
            logger.log('Workflows imported successfully');
          } else {
            logger.error('Failed to import workflows: Invalid file format');
          }
        } catch (error) {
          logger.error('Import error:', error);
        }
      };
      reader.onerror = () => {
        logger.error('File read error');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!isExpanded) return null;

  return (
    <div
      style={{
        height: '100%',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '700',
            color: '#1f2937',
            letterSpacing: '0.2px',
          }}
        >
          Tools Panel
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '36px',
            minHeight: '36px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#1f2937';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
          title="Collapse panel"
          aria-label="Collapse Tools Panel"
        >
          <Icon name="chevron-left" size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          overflow: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
        }}
      >
        <RecentActions />
        <FrequentlyUsed />
        <QuickWorkflows />
      </div>

      {/* Footer with Actions */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={clearHistory}
          style={{
            flex: '1 1 auto',
            maxWidth: '120px',
            padding: '10px 14px',
            background: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '40px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.borderColor = '#EF4444';
            e.currentTarget.style.color = '#EF4444';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          }}
          aria-label="Clear all history"
        >
          <Icon name="trash" size={14} strokeWidth={2} />
          <span>Clear</span>
        </button>
        <button
          onClick={handleImport}
          style={{
            flex: '1 1 auto',
            maxWidth: '120px',
            padding: '10px 14px',
            background: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '40px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#eff6ff';
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.color = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          }}
          aria-label="Import workflows"
        >
          <Icon name="upload" size={14} strokeWidth={2} />
          <span>Import</span>
        </button>
        <button
          onClick={handleExport}
          style={{
            flex: '1 1 auto',
            maxWidth: '120px',
            padding: '10px 14px',
            background: '#3b82f6',
            border: '1.5px solid transparent',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '40px',
            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.4)';
            e.currentTarget.style.background = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.background = '#3b82f6';
          }}
          aria-label="Export workflows"
        >
          <Icon name="download" size={14} strokeWidth={2.5} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};
