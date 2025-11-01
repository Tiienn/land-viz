/**
 * Ribbon Component - Professional CAD-Style Toolbar
 *
 * REFACTORED: January 2025
 * - Converted from Tailwind classes to inline styles
 * - Uses design tokens for consistency
 * - Follows project inline-style architecture
 */

import React, { useState } from 'react';
import {
  Plus,
  Square,
  Grid3x3,
  MousePointer,
  Edit,
  Link,
  Type,
  Undo,
  Redo,
  CornerDownLeft,
  CornerDownRight,
  Mountain,
  Download,
} from 'lucide-react';

import { tokens } from '../../styles/tokens';
import { logger } from '../../utils/logger';
import type { DrawingTool } from '@/types';

interface RibbonProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onExport?: () => void;
}

interface ToolGroup {
  id: string;
  label: string;
  tools: Array<{
    id: DrawingTool | string;
    icon: React.ComponentType<{ style?: React.CSSProperties; size?: number }>;
    label: string;
    shortcut?: string;
  }>;
}

export const Ribbon: React.FC<RibbonProps> = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onExport,
}) => {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const toolGroups: ToolGroup[] = [
    {
      id: 'area-config',
      label: 'Area Configuration',
      tools: [
        { id: 'insert-area', icon: Plus, label: 'Insert Area' },
        { id: 'add-area', icon: Plus, label: 'Add Area' },
        { id: 'presets', icon: Grid3x3, label: 'Presets' },
      ],
    },
    {
      id: 'drawing-tools',
      label: 'Drawing Tools',
      tools: [
        { id: 'select', icon: MousePointer, label: 'Select' },
        { id: 'rectangle', icon: Square, label: 'Rectangle' },
        { id: 'polyline', icon: Edit, label: 'Polyline' },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      tools: [
        { id: 'dimensions', icon: Link, label: 'Dimensions' },
        { id: 'enter-dimensions', icon: Type, label: 'Enter Dimensions' },
      ],
    },
    {
      id: 'actions',
      label: '',
      tools: [
        { id: 'undo', icon: Undo, label: 'Undo' },
        { id: 'redo', icon: Redo, label: 'Redo' },
      ],
    },
    {
      id: 'corner-controls',
      label: 'Corner Controls',
      tools: [
        { id: 'add-corner', icon: CornerDownLeft, label: 'Add Corner' },
        { id: 'delete-corner', icon: CornerDownRight, label: 'Delete Corner' },
      ],
    },
    {
      id: 'terrain',
      label: 'Terrain Elevation',
      tools: [
        { id: 'terrain', icon: Mountain, label: 'Terrain' },
      ],
    },
    {
      id: 'export',
      label: 'Export',
      tools: [
        { id: 'excel-export', icon: Download, label: 'Excel Export' },
      ],
    },
  ];

  const handleToolClick = (toolId: DrawingTool | string) => {
    if (toolId === 'undo' && onUndo) {
      onUndo();
    } else if (toolId === 'redo' && onRedo) {
      onRedo();
    } else if (toolId === 'excel-export' && onExport) {
      onExport();
    } else {
      // Cast to DrawingTool for valid drawing tools
      const drawingTools: string[] = ['select', 'polygon', 'rectangle', 'circle', 'edit', 'polyline'];
      if (drawingTools.includes(toolId)) {
        onToolChange(toolId as DrawingTool);
      } else {
        logger.log(`Non-drawing tool clicked: ${toolId}`);
      }
    }
  };

  // Styles using design tokens
  const styles = {
    container: {
      background: tokens.colors.background.primary,
      borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
      boxShadow: tokens.shadows.sm,
      fontFamily: tokens.typography.fontFamily.primary,
    } as React.CSSProperties,

    header: {
      padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
      borderBottom: `1px solid ${tokens.colors.neutral[100]}`,
      background: tokens.colors.neutral[50],
    } as React.CSSProperties,

    headerRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as React.CSSProperties,

    headerTitle: {
      fontSize: tokens.typography.caption.size,
      fontWeight: tokens.typography.label.weight,
      color: tokens.colors.neutral[600],
    } as React.CSSProperties,

    headerStats: {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacing[4],
    } as React.CSSProperties,

    statsGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacing[2],
      fontSize: tokens.typography.caption.size,
      color: tokens.colors.neutral[500],
    } as React.CSSProperties,

    statsValue: {
      fontWeight: tokens.typography.button.weight,
      color: tokens.colors.neutral[700],
    } as React.CSSProperties,

    statsLabel: {
      color: tokens.colors.neutral[500],
    } as React.CSSProperties,

    toolsContainer: {
      padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
    } as React.CSSProperties,

    toolsRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: tokens.spacing[8],
    } as React.CSSProperties,

    toolGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
    } as React.CSSProperties,

    groupLabel: {
      fontSize: tokens.typography.caption.size,
      fontWeight: tokens.typography.label.weight,
      color: tokens.colors.neutral[600],
      marginBottom: tokens.spacing[2],
      paddingLeft: tokens.spacing[1],
    } as React.CSSProperties,

    groupTools: {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacing[1],
    } as React.CSSProperties,

    toolButton: (isActive: boolean, isHovered: boolean): React.CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokens.spacing[2],
      borderRadius: tokens.radius.md,
      minWidth: '60px',
      height: '64px',
      transition: `all ${tokens.animation.timing.smooth} ease`,
      cursor: 'pointer',
      position: 'relative',
      background: isActive
        ? `${tokens.colors.semantic.info}10` // 10% opacity
        : isHovered
        ? tokens.colors.neutral[50]
        : 'transparent',
      color: isActive
        ? tokens.colors.semantic.info
        : isHovered
        ? tokens.colors.neutral[800]
        : tokens.colors.neutral[600],
      border: isActive
        ? `1px solid ${tokens.colors.semantic.info}`
        : '1px solid transparent',
      boxShadow: isActive ? tokens.shadows.sm : 'none',
      outline: 'none',
    }),

    toolIcon: {
      marginBottom: tokens.spacing[1],
    } as React.CSSProperties,

    toolLabel: {
      fontSize: tokens.typography.caption.size,
      fontWeight: tokens.typography.label.weight,
      lineHeight: 1.2,
      textAlign: 'center' as const,
    } as React.CSSProperties,

    tooltip: (isVisible: boolean): React.CSSProperties => ({
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: tokens.spacing[2],
      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
      background: tokens.colors.neutral[800],
      color: 'white',
      fontSize: tokens.typography.caption.size,
      borderRadius: tokens.radius.sm,
      opacity: isVisible ? 1 : 0,
      transition: `opacity ${tokens.animation.timing.smooth} ease`,
      whiteSpace: 'nowrap' as const,
      pointerEvents: 'none' as const,
      zIndex: tokens.zIndex.tooltip,
    }),

    tooltipShortcut: {
      marginLeft: tokens.spacing[2],
      color: tokens.colors.neutral[300],
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      {/* Ribbon Header */}
      <div style={styles.header}>
        <div style={styles.headerRow}>
          <span style={styles.headerTitle}>Tools & Functions</span>
          <div style={styles.headerStats}>
            <div style={styles.statsGroup}>
              <span>FPS: 60</span>
              <span>Quality: 100%</span>
              <span style={styles.statsValue}>5,000</span>
              <span style={styles.statsLabel}>SQUARE METERS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ribbon Tools */}
      <div style={styles.toolsContainer}>
        <div style={styles.toolsRow}>
          {toolGroups.map((group) => (
            <div key={group.id} style={styles.toolGroup}>
              {group.label && (
                <div style={styles.groupLabel}>
                  {group.label}
                </div>
              )}
              <div style={styles.groupTools}>
                {group.tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  const isHovered = hoveredTool === tool.id;
                  const isTooltipVisible = hoveredTooltip === tool.id;

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleToolClick(tool.id)}
                      onMouseEnter={() => {
                        setHoveredTool(tool.id);
                        setHoveredTooltip(tool.id);
                      }}
                      onMouseLeave={() => {
                        setHoveredTool(null);
                        setHoveredTooltip(null);
                      }}
                      onFocus={() => {
                        setHoveredTooltip(tool.id);
                      }}
                      onBlur={() => {
                        setHoveredTooltip(null);
                      }}
                      style={styles.toolButton(isActive, isHovered)}
                      title={tool.label}
                      aria-label={tool.label}
                      aria-pressed={isActive}
                    >
                      <div style={styles.toolIcon}>
                        <Icon size={20} />
                      </div>
                      <span style={styles.toolLabel}>
                        {tool.label}
                      </span>

                      {/* Tooltip */}
                      <div style={styles.tooltip(isTooltipVisible)}>
                        {tool.label}
                        {tool.shortcut && (
                          <span style={styles.tooltipShortcut}>({tool.shortcut})</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
