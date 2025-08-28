import { useState } from 'react';
import {
  MousePointer,
  Pentagon,
  Square,
  Circle,
  Edit3,
  Layers,
  Settings,
  ChevronDown,
  ChevronRight,
  Grid,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  RotateCcw,
  Zap,
  Target,
  Plus,
  Grid3x3,
  CornerDownLeft,
  CornerDownRight,
  Mountain,
  Download,
} from 'lucide-react';
import type { DrawingTool } from '@/types';

interface SidebarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  snapToGrid: boolean;
  onSnapToggle: () => void;
}

interface ToolCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tools: Array<{
    id: DrawingTool;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    shortcut?: string;
  }>;
}

interface Shape {
  id: string;
  name: string;
  type: string;
  area?: number;
  visible: boolean;
  selected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTool,
  onToolChange,
  snapToGrid,
  onSnapToggle,
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'layers' | 'properties'>('tools');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['drawing', 'measurement'])
  );

  // Mock shape data - in real app, this would come from store
  const [shapes] = useState<Shape[]>([
    { id: '1', name: 'Property Boundary', type: 'polygon', area: 2500, visible: true, selected: true },
    { id: '2', name: 'Building Footprint', type: 'rectangle', area: 180, visible: true, selected: false },
    { id: '3', name: 'Setback Zone', type: 'polygon', area: 450, visible: false, selected: false },
  ]);

  const toolCategories: ToolCategory[] = [
    {
      id: 'selection',
      label: 'Selection & Navigation',
      icon: MousePointer,
      tools: [
        {
          id: 'select',
          icon: MousePointer,
          label: 'Select',
          description: 'Select and modify shapes',
          shortcut: 'V',
        },
        {
          id: 'edit',
          icon: Edit3,
          label: 'Edit Points',
          description: 'Edit individual vertices',
          shortcut: 'E',
        },
      ],
    },
    {
      id: 'drawing',
      label: 'Drawing & Surveying',
      icon: Pentagon,
      tools: [
        {
          id: 'polygon',
          icon: Pentagon,
          label: 'Polygon',
          description: 'Draw property boundaries',
          shortcut: 'P',
        },
        {
          id: 'rectangle',
          icon: Square,
          label: 'Rectangle',
          description: 'Draw buildings and structures',
          shortcut: 'R',
        },
        {
          id: 'circle',
          icon: Circle,
          label: 'Circle',
          description: 'Draw buffer zones and curves',
          shortcut: 'C',
        },
      ],
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const formatArea = (area: number) => {
    return area >= 1000 ? `${(area / 1000).toFixed(1)}k m²` : `${area} m²`;
  };

  return (
    <div className="w-full bg-white border-b border-neutral-200 shadow-soft">
      {/* 🎯 RIBBON TOOLBAR - Tools & Functions */}
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

      {/* 🎯 RIBBON TOOLS - Horizontal Layout */}
      <div className="px-4 py-3">
        <div className="flex items-start space-x-8">
          {/* Area Configuration */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-neutral-600 mb-2 px-1">
              Area Configuration
            </div>
            <div className="flex items-center space-x-1">
              <button className="ribbon-tool-btn">
                <Plus className="h-5 w-5 mb-1" />
                <span className="text-xs">Insert Area</span>
              </button>
              <button className="ribbon-tool-btn">
                <Plus className="h-5 w-5 mb-1" />
                <span className="text-xs">Add Area</span>
              </button>
              <button className="ribbon-tool-btn">
                <Grid3x3 className="h-5 w-5 mb-1" />
                <span className="text-xs">Presets</span>
              </button>
            </div>
          </div>

          {/* Drawing Tools */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-neutral-600 mb-2 px-1">
              Drawing Tools
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => onToolChange('select')}
                className={`ribbon-tool-btn ${activeTool === 'select' ? 'bg-primary-100 text-primary-700' : ''}`}
              >
                <MousePointer className="h-5 w-5 mb-1" />
                <span className="text-xs">Select</span>
              </button>
              <button 
                onClick={() => onToolChange('rectangle')}
                className={`ribbon-tool-btn ${activeTool === 'rectangle' ? 'bg-primary-100 text-primary-700' : ''}`}
              >
                <Square className="h-5 w-5 mb-1" />
                <span className="text-xs">Rectangle</span>
              </button>
              <button 
                onClick={() => onToolChange('polygon')}
                className={`ribbon-tool-btn ${activeTool === 'polygon' ? 'bg-primary-100 text-primary-700' : ''}`}
              >
                <Pentagon className="h-5 w-5 mb-1" />
                <span className="text-xs">Polyline</span>
              </button>
            </div>
          </div>

          {/* Corner Controls */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-neutral-600 mb-2 px-1">
              Corner Controls
            </div>
            <div className="flex items-center space-x-1">
              <button className="ribbon-tool-btn">
                <CornerDownLeft className="h-5 w-5 mb-1" />
                <span className="text-xs">Add Corner</span>
              </button>
              <button className="ribbon-tool-btn">
                <CornerDownRight className="h-5 w-5 mb-1" />
                <span className="text-xs">Delete Corner</span>
              </button>
            </div>
          </div>

          {/* Terrain Elevation */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-neutral-600 mb-2 px-1">
              Terrain Elevation
            </div>
            <div className="flex items-center space-x-1">
              <button className="ribbon-tool-btn">
                <Mountain className="h-5 w-5 mb-1" />
                <span className="text-xs">Terrain</span>
              </button>
            </div>
          </div>

          {/* Export */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-neutral-600 mb-2 px-1">
              Export
            </div>
            <div className="flex items-center space-x-1">
              <button className="ribbon-tool-btn">
                <Download className="h-5 w-5 mb-1" />
                <span className="text-xs">Excel Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OLD TABS SECTION - Now Hidden */}
      <div className="hidden">
        <nav className="tab-nav">
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`tab-button ${
              activeTab === 'tools' ? 'tab-button-active' : 'tab-button-inactive'
            }`}
          >
            Tools
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('layers')}
            className={`tab-button ${
              activeTab === 'layers' ? 'tab-button-active' : 'tab-button-inactive'
            }`}
          >
            Layers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`tab-button ${
              activeTab === 'properties' ? 'tab-button-active' : 'tab-button-inactive'
            }`}
          >
            Properties
          </button>
        </nav>
      </div>

      {/* OLD CONTENT - Now Hidden */}
      <div className="hidden panel-content flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'tools' && (
          <div className="space-y-6">
            {/* Tool Categories */}
            {toolCategories.map(category => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories.has(category.id);

              return (
                <div key={category.id} className="card">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="card-header w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <CategoryIcon className="h-4 w-4 text-neutral-600" />
                      <span className="text-sm font-medium text-neutral-900">{category.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="card-content pt-0">
                      <div className="grid gap-2">
                        {category.tools.map(tool => {
                          const ToolIcon = tool.icon;
                          const isActive = activeTool === tool.id;

                          return (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => onToolChange(tool.id)}
                              className={`tool-btn ${
                                isActive ? 'tool-btn-active' : 'tool-btn-inactive'
                              }`}
                              title={tool.description}
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <ToolIcon className="h-5 w-5" />
                                  <div className="text-left">
                                    <div className="text-sm font-medium">{tool.label}</div>
                                    <div className="text-xs text-neutral-500">{tool.description}</div>
                                  </div>
                                </div>
                                {tool.shortcut && (
                                  <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                                    {tool.shortcut}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Drawing Options */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-900">Drawing Options</span>
                </div>
              </div>
              <div className="card-content space-y-4">
                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Grid className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm text-neutral-700">Snap to Grid</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={onSnapToggle}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">Grid Size</span>
                  <select className="input-field text-sm">
                    <option>1 meter</option>
                    <option>5 meters</option>
                    <option>10 meters</option>
                    <option>Custom</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">Measurement Units</span>
                  <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                    <button
                      type="button"
                      className="flex-1 px-3 py-2 text-xs font-medium bg-primary-50 text-primary-700 border-r border-neutral-200"
                    >
                      Metric
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                    >
                      Imperial
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="card bg-primary-25 border-primary-200">
              <div className="card-header">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-900">Quick Tips</span>
                </div>
              </div>
              <div className="card-content">
                <ul className="space-y-2 text-xs text-primary-700">
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-0.5 text-primary-500" />
                    <span>Click to add polygon points</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-0.5 text-primary-500" />
                    <span>Double-click to finish shape</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-0.5 text-primary-500" />
                    <span>Press Escape to cancel</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-0.5 text-primary-500" />
                    <span>Hold Shift for straight lines</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-900">Shape Layers</h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="btn-ghost p-1.5"
                  title="Layer Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <Layers className="h-4 w-4 text-neutral-400" />
              </div>
            </div>

            {shapes.length > 0 ? (
              <div className="space-y-2">
                {shapes.map(shape => (
                  <div
                    key={shape.id}
                    className={`card p-3 cursor-pointer transition-colors ${
                      shape.selected ? 'ring-2 ring-primary-200 bg-primary-25' : 'hover:bg-neutral-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          className="text-neutral-400 hover:text-neutral-600"
                          title={shape.visible ? 'Hide layer' : 'Show layer'}
                        >
                          {shape.visible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{shape.name}</div>
                          <div className="text-xs text-neutral-500 capitalize">
                            {shape.type} · {shape.area && formatArea(shape.area)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          className="btn-ghost p-1"
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost p-1 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Layers className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                <div className="text-sm">No shapes created yet</div>
                <div className="text-xs">Start by selecting a drawing tool</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-4">
            {shapes.find(s => s.selected) ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-900">Property Details</h3>
                
                <div className="card">
                  <div className="card-header">
                    <span className="text-sm font-medium">Property Boundary</span>
                  </div>
                  <div className="card-content space-y-3">
                    <div>
                      <label className="input-label">Name</label>
                      <input
                        type="text"
                        className="input-field"
                        defaultValue="Property Boundary"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="input-label">Area</label>
                        <div className="coordinate-display">{formatArea(2500)}</div>
                      </div>
                      <div>
                        <label className="input-label">Perimeter</label>
                        <div className="coordinate-display">210 m</div>
                      </div>
                    </div>

                    <div>
                      <label className="input-label">Color</label>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded border border-neutral-200 bg-primary-500"></div>
                        <input
                          type="text"
                          className="input-field flex-1"
                          defaultValue="#22c55e"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="input-label mb-0">Visible</span>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button type="button" className="btn-secondary flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </button>
                  <button type="button" className="btn-primary flex-1">
                    Apply
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Settings className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                <div className="text-sm">No shape selected</div>
                <div className="text-xs">Select a shape to view properties</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};