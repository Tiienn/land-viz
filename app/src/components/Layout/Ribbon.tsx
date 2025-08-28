import React from 'react';
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
    icon: React.ComponentType<{ className?: string }>;
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
        console.log(`Non-drawing tool clicked: ${toolId}`);
      }
    }
  };

  return (
    <div className="bg-white border-b border-neutral-200 shadow-soft">
      {/* Ribbon Header */}
      <div className="px-4 py-2 border-b border-neutral-100 bg-neutral-25">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600">Tools & Functions</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-neutral-500">
              <span>FPS: 60</span>
              <span>Quality: 100%</span>
              <span className="font-semibold text-neutral-700">5,000</span>
              <span className="text-neutral-500">SQUARE METERS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ribbon Tools */}
      <div className="px-4 py-3">
        <div className="flex items-start space-x-8">
          {toolGroups.map((group) => (
            <div key={group.id} className="flex flex-col">
              {group.label && (
                <div className="text-xs font-medium text-neutral-600 mb-2 px-1">
                  {group.label}
                </div>
              )}
              <div className="flex items-center space-x-1">
                {group.tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleToolClick(tool.id)}
                      className={`
                        flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] h-16 
                        transition-all duration-150 group relative
                        ${isActive 
                          ? 'bg-primary-100 text-primary-700 shadow-soft border border-primary-200' 
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800 border border-transparent'
                        }
                      `}
                      title={tool.label}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium leading-tight text-center">
                        {tool.label}
                      </span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                                    bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 
                                    transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                        {tool.label}
                        {tool.shortcut && (
                          <span className="ml-2 text-neutral-300">({tool.shortcut})</span>
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