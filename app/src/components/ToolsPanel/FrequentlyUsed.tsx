import React from 'react';
import { useToolHistoryStore } from '../../store/useToolHistoryStore';
import { useAppStore } from '../../store/useAppStore';
import type { ActionType, DrawingTool } from '../../types';
import Icon from '../Icon';

// Valid drawing tools for type safety
const VALID_DRAWING_TOOLS: DrawingTool[] = ['select', 'rectangle', 'polyline', 'circle', 'line', 'measure', 'rotate', 'polygon', 'edit'];

export const FrequentlyUsed: React.FC = () => {
  const usageStats = useToolHistoryStore((state) => state.usageStats);
  const pinTool = useToolHistoryStore((state) => state.pinTool);
  const unpinTool = useToolHistoryStore((state) => state.unpinTool);
  const setActiveTool = useAppStore((state) => state.setActiveTool);

  // Get top 3 most used OR all pinned (up to 5 total)
  const topTools = Object.entries(usageStats)
    .sort((a, b) => {
      // Pinned first, then by count
      if (a[1].isPinned && !b[1].isPinned) return -1;
      if (!a[1].isPinned && b[1].isPinned) return 1;
      return b[1].count - a[1].count;
    })
    .slice(0, 5);

  const handleToolClick = (actionType: ActionType) => {
    if (actionType.startsWith('tool:')) {
      const toolName = actionType.replace('tool:', '');

      // Type-safe validation before activating tool
      if (VALID_DRAWING_TOOLS.includes(toolName as DrawingTool)) {
        setActiveTool(toolName as DrawingTool);
      } else {
        console.warn('Invalid tool type:', toolName);
      }
    }
    // Panel actions and other actions will be handled in Phase 3
  };

  const handlePinToggle = (actionType: ActionType, isPinned: boolean) => {
    if (isPinned) {
      unpinTool(actionType);
    } else {
      pinTool(actionType);
    }
  };

  if (topTools.length === 0) {
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
          <Icon name="star" size={14} color="#f59e0b" />
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
            Frequently Used
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
          Use tools to see frequently used
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
        <Icon name="star" size={14} color="#f59e0b" />
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
          Frequently Used (Top {topTools.length})
        </h3>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {topTools.map(([actionType, stats]) => (
          <div
            key={actionType}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              background: stats.isPinned
                ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                : '#f9fafb',
              border: '1px solid',
              borderColor: stats.isPinned ? '#fbbf24' : '#e5e7eb',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <button
              onClick={() => handleToolClick(stats.actionType)}
              aria-label={`Activate ${actionType.split(':')[1]} tool, used ${stats.count} times${stats.isPinned ? ', pinned' : ''}`}
              role="button"
              tabIndex={0}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.style.transform = 'translateX(2px)';
                }
              }}
              onMouseLeave={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.style.transform = 'translateX(0)';
                }
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
                  background: stats.isPinned
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={actionType.replace('tool:', '')}
                  size={16}
                  color="#ffffff"
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: '#1f2937',
                    fontWeight: '500',
                    fontSize: '13px',
                  }}
                >
                  {actionType.split(':')[1]?.charAt(0).toUpperCase() +
                    actionType.split(':')[1]?.slice(1)}
                </div>
                <div
                  style={{
                    color: '#6b7280',
                    fontSize: '11px',
                    marginTop: '2px',
                  }}
                >
                  {stats.count} use{stats.count !== 1 ? 's' : ''}
                </div>
              </div>
            </button>
            <button
              onClick={() => handlePinToggle(stats.actionType, stats.isPinned)}
              aria-label={stats.isPinned ? `Unpin ${actionType.split(':')[1]} tool` : `Pin ${actionType.split(':')[1]} tool`}
              aria-pressed={stats.isPinned}
              role="button"
              tabIndex={0}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid #3b82f6';
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
              title={stats.isPinned ? 'Unpin' : 'Pin'}
            >
              <Icon
                name="pin"
                size={16}
                color={stats.isPinned ? '#f59e0b' : '#9ca3af'}
                style={{
                  transform: stats.isPinned ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
