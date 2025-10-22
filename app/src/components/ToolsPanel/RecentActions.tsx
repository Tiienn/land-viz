import React from 'react';
import { useToolHistoryStore } from '../../store/useToolHistoryStore';
import { useAppStore } from '../../store/useAppStore';
import type { TrackedAction, DrawingTool } from '../../types';
import Icon from '../Icon';
import { logger } from '../../utils/logger';

// Valid drawing tools for type safety
const VALID_DRAWING_TOOLS: DrawingTool[] = ['select', 'rectangle', 'polyline', 'circle', 'line', 'measure', 'rotate', 'polygon', 'edit'];

export const RecentActions: React.FC = () => {
  const recentActions = useToolHistoryStore((state) => state.recentActions);
  const setActiveTool = useAppStore((state) => state.setActiveTool);

  const handleActionClick = (action: TrackedAction) => {
    // Re-activate the tool/action based on type
    if (action.type.startsWith('tool:')) {
      const toolName = action.type.replace('tool:', '');

      // Type-safe validation before activating tool
      if (VALID_DRAWING_TOOLS.includes(toolName as DrawingTool)) {
        setActiveTool(toolName as DrawingTool);
      } else {
        logger.warn('[RecentActions]', 'Invalid tool type:', toolName);
      }
    }
    // Panel actions and other actions will be handled in Phase 3
  };

  if (recentActions.length === 0) {
    return (
      <div
        style={{
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
          }}
        >
          <Icon name="clock" size={14} color="#3b82f6" />
          <h3
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Recent Actions
          </h3>
        </div>
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '13px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px dashed #e5e7eb',
          }}
        >
          No recent actions yet.
          <br />
          Start using tools to see your history here.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '12px',
        }}
      >
        <Icon name="clock" size={14} color="#3b82f6" />
        <h3
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Recent Actions ({recentActions.length})
        </h3>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {recentActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            aria-label={`Activate ${action.label}`}
            role="button"
            tabIndex={0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '13px',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #3b82f6';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon
                name={action.type.startsWith('tool:') ? action.type.replace('tool:', '') : (action.icon || 'quickTools')}
                size={16}
                color="#ffffff"
              />
            </div>
            <span
              style={{
                flex: 1,
                color: '#1f2937',
                fontWeight: '500',
              }}
            >
              {action.label}
            </span>
            <Icon name="play" size={14} color="#9ca3af" />
          </button>
        ))}
      </div>
    </div>
  );
};
