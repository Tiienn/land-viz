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
          background: '#fafafa',
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '700',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Tools Panel
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 200ms ease',
            lineHeight: 1,
            fontWeight: 300,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Collapse panel"
        >
          ◀
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
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={clearHistory}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          Clear History
        </button>
        <button
          onClick={handleImport}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          Import
        </button>
        <button
          onClick={handleExport}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          Export
        </button>
      </div>
    </div>
  );
};
