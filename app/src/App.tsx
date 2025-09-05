import React, { useState, useEffect } from 'react';
import SceneManager from './components/Scene/SceneManager';
import { useAppStore } from './store/useAppStore';
import ExportSettingsDialog, { type ExportSettings } from './components/ExportSettingsDialog';
import PropertiesPanel from './components/PropertiesPanel';
import Icon from './components/Icon';
import type { Point2D } from './types';

function App(): React.JSX.Element {
  // Local UI state for performance (reduces re-renders)
  const [activeTool, setActiveTool] = useState('select');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportSettingsOpen, setExportSettingsOpen] = useState(false);
  const [exportSettingsFormat, setExportSettingsFormat] = useState<ExportSettings['format']>('excel');
  const [isProfessionalMode, setIsProfessionalMode] = useState(false);
  const [mousePosition, setMousePosition] = useState<Point2D>({ x: 0, y: 0 });
  const [isMouseOver3D, setIsMouseOver3D] = useState(false);
  const [currentDimensions, setCurrentDimensions] = useState<{
    width?: number;
    height?: number;
    area?: number;
    radius?: number;
    length?: number;
  } | null>(null);
  const [isNearPolylineStart, setIsNearPolylineStart] = useState(false);
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(false);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(false);
  const [propertiesExpanded, setPropertiesExpanded] = useState(false);
  const [layersExpanded, setLayersExpanded] = useState(false);
  
  // Connect to the 3D scene store
  const { 
    drawing, 
    setActiveTool: setStoreActiveTool, 
    toggleShowDimensions,
    clearAll,
    getTotalArea,
    getShapeCount,
    getAverageArea,
    exportToExcel,
    exportToDXF,
    exportToGeoJSON,
    exportToPDF,
    downloadExport,
    selectedShapeId,
    enterEditMode,
    exitEditMode,
    addShapeCorner,
    deleteShapeCorner,
    convertRectangleToPolygon,
    cancelAll,
    enterRotateMode,
    undo,
    redo,
    canUndo,
    canRedo,
    removeLastPoint,
    layers,
    shapes,
    activeLayerId,
    updateLayer
  } = useAppStore();

  // Sync local state with store state when store changes
  useEffect(() => {
    if (drawing.activeTool !== activeTool) {
      setActiveTool(drawing.activeTool);
    }
  }, [drawing.activeTool, activeTool]);


  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're not in an input field
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      
      if (isInputField) return;

      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        
        // Priority 1: If actively drawing a polyline with points, do point-level undo
        if (drawing.isDrawing && drawing.activeTool === 'polyline' && drawing.currentShape?.points && drawing.currentShape.points.length > 0) {
          removeLastPoint();
        } 
        // Priority 2: If not drawing polyline, or polyline has no points, do normal shape undo
        else if (canUndo()) {
          undo();
        }
        // Priority 3: If no undo available and drawing other tools, ignore silently
      }
      
      // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac) or Ctrl+Shift+Z
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
      }

      // ESC key: Cancel all active operations
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, removeLastPoint, cancelAll, drawing.isDrawing, drawing.activeTool, drawing.currentShape]);

  // 3D Scene event handlers
  const handleCoordinateChange = (worldPos: Point2D, screenPos: Point2D) => {
    setMousePosition(worldPos);
    setIsMouseOver3D(true);
  };

  const handleDimensionChange = (dimensions: {
    width?: number;
    height?: number;
    area?: number;
    radius?: number;
    length?: number;
  } | null) => {
    setCurrentDimensions(dimensions);
  };

  const handlePolylineStartProximity = (isNear: boolean) => {
    setIsNearPolylineStart(isNear);
  };

  const handleCameraChange = () => {
    // Handle camera changes if needed for UI updates
    // Could be used for camera presets or view saving
  };

  // Export handlers
  const handleQuickExport = async (format: 'excel' | 'dxf' | 'geojson' | 'pdf') => {
    try {
      let result;
      switch (format) {
        case 'excel':
          result = await exportToExcel();
          break;
        case 'dxf':
          result = await exportToDXF();
          break;
        case 'geojson':
          result = await exportToGeoJSON();
          break;
        case 'pdf':
          result = await exportToPDF();
          break;
        default:
          throw new Error(`Unknown export format: ${format}`);
      }
      
      if (result.success) {
        downloadExport(result);
        setExportDropdownOpen(false);
      } else {
        alert(`${format.toUpperCase()} export failed. Please try again.`);
      }
    } catch (error) {
      console.error(`${format} export error:`, error);
      alert(`${format.toUpperCase()} export failed. Please try again.`);
    }
  };

  const handleExportWithSettings = (settings: ExportSettings) => {
    const { format, ...exportOptions } = settings;
    
    const exportWithCustomSettings = async () => {
      try {
        let result;
        switch (format) {
          case 'excel':
            result = await exportToExcel(exportOptions);
            break;
          case 'dxf':
            result = await exportToDXF(exportOptions);
            break;
          case 'geojson':
            result = await exportToGeoJSON(exportOptions);
            break;
          case 'pdf':
            result = await exportToPDF(exportOptions);
            break;
          default:
            throw new Error(`Unknown export format: ${format}`);
        }
        
        if (result.success) {
          downloadExport(result);
        } else {
          alert(`${format.toUpperCase()} export failed. Please try again.`);
        }
      } catch (error) {
        console.error(`${format} export error:`, error);
        alert(`${format.toUpperCase()} export failed. Please try again.`);
      }
    };

    exportWithCustomSettings();
  };

  const openExportSettings = (format: ExportSettings['format']) => {
    setExportSettingsFormat(format);
    setExportSettingsOpen(true);
    setExportDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setExportDropdownOpen(false);
    };

    if (exportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [exportDropdownOpen]);

  // Remove scroll bars and ensure proper viewport handling
  React.useEffect(() => {
    // Remove scroll bars from body and html
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Ensure no margin/padding on body
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    return () => {
      // Restore default overflow on cleanup
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#fcfcfd',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      
      {/* Enhanced Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '20px 24px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src="/Land-Visualizer512.png" 
            alt="Land Visualizer Logo"
            style={{
              width: '40px', 
              height: '40px', 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              margin: 0, 
              color: '#000000'
            }}>
              Land Visualizer
            </h1>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
              {isProfessionalMode ? 'Create Professional Land Visualizations' : 'Create Beautiful Land Visualizations'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Professional Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '12px', 
              color: isProfessionalMode ? '#1d4ed8' : '#000000',
              fontWeight: '500'
            }}>
              {isProfessionalMode ? '🎯 Professional' : '👤 Standard'}
            </span>
            <button
              onClick={() => setIsProfessionalMode(!isProfessionalMode)}
              style={{
                position: 'relative',
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                background: isProfessionalMode ? '#3b82f6' : '#d1d5db',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                boxShadow: isProfessionalMode ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
              }}
              title={`Switch to ${isProfessionalMode ? 'Standard' : 'Professional'} Mode`}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '12px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transform: `translateX(${isProfessionalMode ? '24px' : '0px'})`,
                transition: 'transform 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px'
              }}>
                {isProfessionalMode ? '⚡' : '📊'}
              </div>
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#000000' }}>
            <span>FPS: 60</span> | <span>Quality: 100%</span> | <strong>{getTotalArea()} SQUARE METERS</strong>
          </div>
        </div>
      </div>

      {/* Enhanced Ribbon Toolbar */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
        borderBottom: '1px solid #e2e8f0', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
      }}>
        <div style={{ 
          padding: '12px 20px', 
          borderBottom: '1px solid #f1f5f9', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' 
        }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#000000' }}>
            {isProfessionalMode ? 'Professional CAD Tools & Functions' : 'Tools & Functions'}
          </span>
          {isProfessionalMode && (
            <span style={{ 
              fontSize: '10px', 
              color: '#059669', 
              marginLeft: '8px',
              background: '#dcfce7',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              ⚡ PRO MODE
            </span>
          )}
        </div>
        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
            {/* Area Configuration */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#64748b', 
                marginBottom: '8px',
                textAlign: 'center'
              }}>Area Configuration</div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  borderRadius: '4px', 
                  minWidth: '70px', 
                  height: '60px', 
                  color: '#000000', 
                  background: 'white', 
                  border: '1px solid #e5e7eb', 
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Insert Area</span>
                </button>
                <button style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  borderRadius: '4px', 
                  minWidth: '70px', 
                  height: '60px', 
                  color: '#000000', 
                  background: 'white', 
                  border: '1px solid #e5e7eb', 
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Add Area</span>
                </button>
                <button style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  borderRadius: '4px', 
                  minWidth: '70px', 
                  height: '60px', 
                  color: '#000000', 
                  background: 'white', 
                  border: '1px solid #e5e7eb', 
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Presets</span>
                </button>
              </div>
            </div>

            {/* Drawing Tools */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#64748b', 
                marginBottom: '8px',
                textAlign: 'center'
              }}>Drawing Tools</div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button 
                  onClick={() => {
                    setActiveTool('select');
                    setStoreActiveTool('select');
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '70px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: activeTool === 'select' 
                      ? '#dbeafe' 
                      : '#ffffff',
                    color: activeTool === 'select' ? '#1d4ed8' : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    boxShadow: activeTool === 'select' 
                      ? '0 0 0 2px rgba(59, 130, 246, 0.2)' 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTool !== 'select') {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTool !== 'select') {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                    <path d="m13 13 6 6"></path>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Select</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTool('rectangle');
                    setStoreActiveTool('rectangle');
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '70px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: activeTool === 'rectangle' 
                      ? '#dbeafe' 
                      : '#ffffff',
                    color: activeTool === 'rectangle' ? '#1d4ed8' : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    boxShadow: activeTool === 'rectangle' 
                      ? '0 0 0 2px rgba(59, 130, 246, 0.2)' 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTool !== 'rectangle') {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTool !== 'rectangle') {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Rectangle</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTool('polyline');
                    setStoreActiveTool('polyline');
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '70px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: activeTool === 'polyline' 
                      ? '#dbeafe' 
                      : '#ffffff',
                    color: activeTool === 'polyline' ? '#1d4ed8' : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    boxShadow: activeTool === 'polyline' 
                      ? '0 0 0 2px rgba(59, 130, 246, 0.2)' 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTool !== 'polyline') {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTool !== 'polyline') {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4,17 10,11 14,15 20,9"></polyline>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Polyline</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTool('circle');
                    setStoreActiveTool('circle');
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '70px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: activeTool === 'circle' 
                      ? '#dbeafe' 
                      : '#ffffff',
                    color: activeTool === 'circle' ? '#1d4ed8' : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    boxShadow: activeTool === 'circle' 
                      ? '0 0 0 2px rgba(59, 130, 246, 0.2)' 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTool !== 'circle') {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTool !== 'circle') {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"></circle>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Circle</span>
                </button>
              </div>
            </div>

            {/* Vertical Separator */}
            <div style={{ 
              width: '1px', 
              height: '70px', 
              background: '#e5e7eb', 
              margin: '0 8px' 
            }}></div>

            {/* Tools */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#64748b', 
                marginBottom: '8px',
                textAlign: 'center'
              }}>Tools</div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button 
                  onClick={toggleShowDimensions}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '80px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: drawing.showDimensions ? '#a5b4fc' : '#ffffff',
                    color: drawing.showDimensions ? '#312e81' : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 14H3l1.5-2h15z"></path>
                    <path d="M21 19H3l1.5-2h15z"></path>
                    <path d="M21 9H3l1.5-2h15z"></path>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Dimensions</span>
                </button>
                <button 
                  onClick={() => {
                    if (selectedShapeId && activeTool === 'select' && !drawing.isEditMode && !drawing.isResizeMode) {
                      enterRotateMode(selectedShapeId);
                    }
                  }}
                  disabled={!selectedShapeId || activeTool !== 'select' || drawing.isEditMode || drawing.isResizeMode || drawing.isDrawing}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '80px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: (!selectedShapeId || activeTool !== 'select' || drawing.isEditMode || drawing.isResizeMode || drawing.isDrawing) 
                      ? 'not-allowed' 
                      : 'pointer',
                    background: drawing.isRotateMode ? '#a5b4fc' : '#ffffff',
                    color: drawing.isRotateMode ? '#312e81' : 
                           (!selectedShapeId || activeTool !== 'select' || drawing.isEditMode || drawing.isResizeMode || drawing.isDrawing) 
                             ? '#9ca3af' 
                             : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    opacity: (!selectedShapeId || activeTool !== 'select' || drawing.isEditMode || drawing.isResizeMode || drawing.isDrawing) 
                      ? 0.5 
                      : 1
                  }}
                  onMouseEnter={(e) => {
                    if (selectedShapeId && activeTool === 'select' && !drawing.isEditMode && !drawing.isResizeMode && !drawing.isDrawing && !drawing.isRotateMode) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!drawing.isRotateMode) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 0 1-9 9c-4.97 0-9-4.03-9-9s4.03-9 9-9"></path>
                    <path d="M12 3l3 3-3 3"></path>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Rotate</span>
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all shapes? This action cannot be undone.')) {
                      clearAll();
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '80px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: '#ffffff',
                    color: '#dc2626',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fef2f2';
                    e.currentTarget.style.borderColor = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  title="Clear all shapes from the scene"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Clear All</span>
                </button>
                <button 
                  onClick={() => {
                    if (selectedShapeId) {
                      if (drawing.isEditMode && drawing.editingShapeId === selectedShapeId) {
                        exitEditMode();
                      } else {
                        enterEditMode(selectedShapeId);
                      }
                    }
                  }}
                  disabled={!selectedShapeId}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '60px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: selectedShapeId ? 'pointer' : 'not-allowed',
                    background: (drawing.isEditMode && drawing.editingShapeId === selectedShapeId) 
                      ? '#dbeafe' 
                      : selectedShapeId ? '#ffffff' : '#f9fafb',
                    color: (drawing.isEditMode && drawing.editingShapeId === selectedShapeId) 
                      ? '#1d4ed8' 
                      : selectedShapeId ? '#000000' : '#9ca3af',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    opacity: selectedShapeId ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (selectedShapeId && !(drawing.isEditMode && drawing.editingShapeId === selectedShapeId)) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedShapeId && !(drawing.isEditMode && drawing.editingShapeId === selectedShapeId)) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  title={
                    !selectedShapeId 
                      ? 'Select a shape first' 
                      : (drawing.isEditMode && drawing.editingShapeId === selectedShapeId) 
                        ? 'Exit Edit Mode' 
                        : 'Enter Edit Mode to modify shape corners'
                  }
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="m18.5 2.5-8.5 8.5-2 2v2h2l2-2 8.5-8.5a1.5 1.5 0 0 0 0-2.1v0a1.5 1.5 0 0 0-2.1 0z"></path>
                  </svg>
                  <span style={{ marginTop: '4px' }}>
                    {(drawing.isEditMode && drawing.editingShapeId === selectedShapeId) ? 'Exit Edit' : 'Edit'}
                  </span>
                </button>
                <button 
                  onClick={undo}
                  disabled={!canUndo()}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '60px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: canUndo() ? 'pointer' : 'not-allowed',
                    background: canUndo() ? '#ffffff' : '#f9fafb',
                    color: canUndo() ? '#000000' : '#9ca3af',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    opacity: canUndo() ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (canUndo()) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canUndo()) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  title={canUndo() ? 'Undo last action (Ctrl+Z)' : 'Nothing to undo'}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7v6h6"></path>
                    <path d="m21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Undo</span>
                </button>
                <button 
                  onClick={redo}
                  disabled={!canRedo()}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '60px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: canRedo() ? 'pointer' : 'not-allowed',
                    background: canRedo() ? '#ffffff' : '#f9fafb',
                    color: canRedo() ? '#000000' : '#9ca3af',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    opacity: canRedo() ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (canRedo()) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canRedo()) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  title={canRedo() ? 'Redo last undone action (Ctrl+Y)' : 'Nothing to redo'}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m21 7-6 6h6V7z"></path>
                    <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Redo</span>
                </button>
                <button 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '80px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: '#ffffff',
                    color: '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Enter Dimensions</span>
                </button>
              </div>
            </div>

            {/* Vertical Separator */}
            <div style={{ 
              width: '1px', 
              height: '70px', 
              background: '#e5e7eb', 
              margin: '0 8px' 
            }}></div>

            {/* Corner Controls */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#64748b', 
                marginBottom: '8px',
                textAlign: 'center'
              }}>Corner Controls</div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button 
                  onClick={() => {
                    if (drawing.isEditMode && selectedShapeId && drawing.selectedCornerIndex !== null) {
                      // Add corner logic
                      const state = useAppStore.getState();
                      const selectedShape = state.shapes.find(s => s.id === selectedShapeId);
                      
                      if (selectedShape && selectedShape.points) {
                        if (selectedShape.type === 'rectangle' && selectedShape.points.length === 2) {
                          const [topLeft, bottomRight] = selectedShape.points;
                          const rectangleCorners = [
                            { x: topLeft.x, y: topLeft.y },
                            { x: bottomRight.x, y: topLeft.y },
                            { x: bottomRight.x, y: bottomRight.y },
                            { x: topLeft.x, y: bottomRight.y }
                          ];
                          
                          convertRectangleToPolygon(selectedShapeId, rectangleCorners);
                          
                          const cornerIndex = drawing.selectedCornerIndex;
                          const currentCorner = rectangleCorners[cornerIndex];
                          const nextIndex = (cornerIndex + 1) % rectangleCorners.length;
                          const nextCorner = rectangleCorners[nextIndex];
                          
                          const midpoint = {
                            x: (currentCorner.x + nextCorner.x) / 2,
                            y: (currentCorner.y + nextCorner.y) / 2
                          };
                          
                          addShapeCorner(selectedShapeId, cornerIndex, midpoint);
                        } else {
                          const cornerIndex = drawing.selectedCornerIndex;
                          const currentCorner = selectedShape.points[cornerIndex];
                          const nextIndex = (cornerIndex + 1) % selectedShape.points.length;
                          const nextCorner = selectedShape.points[nextIndex];
                          
                          const midpoint = {
                            x: (currentCorner.x + nextCorner.x) / 2,
                            y: (currentCorner.y + nextCorner.y) / 2
                          };
                          
                          addShapeCorner(selectedShapeId, cornerIndex, midpoint);
                        }
                      }
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '60px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? 'pointer' : 'not-allowed',
                    background: '#ffffff',
                    color: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? '#000000' : '#9ca3af',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    opacity: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? 1 : 0.5
                  }}
                  title={drawing.isEditMode ? (drawing.selectedCornerIndex !== null ? 'Add Corner between selected and next corner' : 'Select a corner first') : 'Enter Edit Mode first'}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="12" y1="1" x2="12" y2="9"></line>
                    <line x1="23" y1="12" x2="15" y2="12"></line>
                    <line x1="12" y1="23" x2="12" y2="15"></line>
                    <line x1="1" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Add Corner</span>
                </button>
                <button 
                  onClick={() => {
                    if (drawing.isEditMode && selectedShapeId && drawing.selectedCornerIndex !== null) {
                      deleteShapeCorner(selectedShapeId, drawing.selectedCornerIndex);
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    minWidth: '60px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? 'pointer' : 'not-allowed',
                    background: '#ffffff',
                    color: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? '#ef4444' : '#9ca3af',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    opacity: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? 1 : 0.5
                  }}
                  title={drawing.isEditMode ? (drawing.selectedCornerIndex !== null ? 'Delete Selected Corner' : 'Select a corner to delete') : 'Enter Edit Mode first'}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Delete Corner</span>
                </button>
              </div>
            </div>

            {/* Vertical Separator */}
            <div style={{ 
              width: '1px', 
              height: '70px', 
              background: '#e5e7eb', 
              margin: '0 8px' 
            }}></div>


            {/* Export */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#64748b', 
                marginBottom: '8px',
                textAlign: 'center'
              }}>Export</div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      padding: '8px 12px', 
                      borderRadius: '4px', 
                      minWidth: '80px', 
                      height: '60px', 
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      background: exportDropdownOpen ? '#dbeafe' : '#ffffff',
                      color: exportDropdownOpen ? '#1d4ed8' : '#000000',
                      transition: 'all 0.2s ease',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    <span style={{ marginTop: '4px' }}>Excel Export</span>
                  </button>

                  {/* Simplified Export Dropdown */}
                  {exportDropdownOpen && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: '65px', 
                        left: '0', 
                        background: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '6px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        minWidth: '160px'
                      }}
                    >
                      <button
                        onClick={() => handleQuickExport('excel')}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#374151',
                          textAlign: 'left',
                          borderRadius: '6px 6px 0 0'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        📊 Excel (.xlsx)
                      </button>
                      <button
                        onClick={() => handleQuickExport('dxf')}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          borderTop: '1px solid #f3f4f6',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#374151',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        📐 DXF (.dxf)
                      </button>
                      <button
                        onClick={() => handleQuickExport('pdf')}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          borderTop: '1px solid #f3f4f6',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#374151',
                          textAlign: 'left',
                          borderRadius: '0 0 6px 6px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        📄 PDF (.pdf)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <div style={{ 
          width: layersExpanded ? '400px' : (leftPanelExpanded ? '160px' : '50px'), 
          background: 'white', 
          borderRight: '1px solid #e5e5e5', 
          display: 'flex', 
          flexDirection: 'row', 
          transition: 'width 0.3s ease',
          position: 'relative'
        }}>
          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => {
              if (layersExpanded) {
                // If layers are expanded, collapse them and return to thin default menu
                setLayersExpanded(false);
                setLeftPanelExpanded(false);
              } else {
                // Normal toggle behavior for left panel
                setLeftPanelExpanded(!leftPanelExpanded);
              }
            }}
            style={{
              position: 'absolute',
              top: '50%',
              right: '-12px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '2px solid #e5e5e5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#6b7280',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 10,
              transition: 'all 0.2s ease',
              transform: 'translateY(-50%)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#6b7280';
            }}
            title={leftPanelExpanded ? 'Collapse Panel' : 'Expand Panel'}
          >
            {leftPanelExpanded ? '◀' : '▶'}
          </button>

          {/* Main Navigation Section */}
          <div style={{
            width: leftPanelExpanded ? '160px' : '50px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}>
            <div style={{ 
              padding: '16px 0', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: leftPanelExpanded ? 'stretch' : 'center', 
              gap: '8px',
              paddingLeft: leftPanelExpanded ? '16px' : '0',
              paddingRight: leftPanelExpanded ? '16px' : '0'
            }}>
              <button style={{ 
                padding: leftPanelExpanded ? '12px 16px' : '8px', 
                borderRadius: '8px', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                color: '#374151'
              }} 
              title="Home"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
              >
                <Icon name="home" size={20} color="#000000" />
                <span style={{ 
                  fontSize: leftPanelExpanded ? '12px' : '10px', 
                  fontWeight: '500', 
                  color: '#374151',
                  lineHeight: '1'
                }}>
                  Home
                </span>
              </button>
            
              <button style={{ 
                padding: leftPanelExpanded ? '12px 16px' : '8px', 
                borderRadius: '8px', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                color: '#374151'
              }} 
              title="Visual Comparison"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
              >
                <Icon name="visualComparison" size={20} color="#000000" />
                <span style={{ 
                  fontSize: leftPanelExpanded ? '12px' : '10px', 
                  fontWeight: '500', 
                  color: '#374151',
                  lineHeight: '1'
                }}>
                  Visual
                </span>
              </button>
            
              <button style={{ 
                padding: leftPanelExpanded ? '12px 16px' : '8px', 
                borderRadius: '8px', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                color: '#374151'
              }} 
              title="Unit Converter"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
              >
                <Icon name="unitConverter" size={20} color="#000000" />
                <span style={{ 
                  fontSize: leftPanelExpanded ? '12px' : '10px', 
                  fontWeight: '500', 
                  color: '#374151',
                  lineHeight: '1'
                }}>
                  Convert
                </span>
              </button>
            
              <button style={{ 
                padding: leftPanelExpanded ? '12px 16px' : '8px', 
                borderRadius: '8px', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                color: '#374151'
              }} 
              title="Quick Tools"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
              >
                <Icon name="quickTools" size={20} color="#000000" />
                <span style={{ 
                  fontSize: leftPanelExpanded ? '12px' : '10px', 
                  fontWeight: '500', 
                  color: '#374151',
                  lineHeight: '1'
                }}>
                  Tools
                </span>
              </button>
            
            <button 
              onClick={() => {
                if (layersExpanded) {
                  // If layers are expanded, collapse them and return to thin default menu
                  setLayersExpanded(false);
                  setLeftPanelExpanded(false);
                } else {
                  // If layers are not expanded, expand the panel if needed and show layers
                  if (!leftPanelExpanded) {
                    setLeftPanelExpanded(true);
                  }
                  setLayersExpanded(true);
                }
              }}
              style={{ 
                padding: leftPanelExpanded ? '12px 16px' : '8px', 
                borderRadius: '8px', 
                background: layersExpanded ? '#dbeafe' : 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                color: layersExpanded ? '#1d4ed8' : '#374151'
              }} 
              title="Layers"
              onMouseEnter={(e) => {
                if (!layersExpanded) {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!layersExpanded) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }
              }}
            >
              <Icon name="layers" size={20} color="#000000" />
              <span style={{ 
                fontSize: leftPanelExpanded ? '12px' : '10px', 
                fontWeight: '500', 
                color: layersExpanded ? '#1d4ed8' : '#374151',
                lineHeight: '1'
              }}>
                Layers
              </span>
            </button>
            </div>
          </div>

          {/* Layers Expansion Panel */}
          {layersExpanded && (
            <div style={{
              width: '240px',
              background: '#f8fafc',
              borderLeft: '1px solid #e2e8f0',
              padding: '16px',
              overflowY: 'auto',
              maxHeight: '100vh'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                <div>{layers.length} Layer{layers.length !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                  {shapes.length} Shape{shapes.length !== 1 ? 's' : ''}
                </div>
              </div>

                {layers.map(layer => {
                  const isActive = layer.id === activeLayerId;
                  const layerShapes = shapes.filter(shape => shape.layerId === layer.id);
                  
                  return (
                  <div
                    key={layer.id}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      background: isActive ? '#e0f2fe' : 'white',
                      borderRadius: '6px',
                      border: isActive ? '1px solid #0ea5e9' : '1px solid #e5e7eb',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          background: layer.color,
                          borderRadius: '3px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                      <span style={{
                        fontWeight: '500',
                        color: '#374151',
                        fontSize: '12px',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {layer.name.length > 20 ? layer.name.substring(0, 20) + '...' : layer.name}
                      </span>
                      <button
                        onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          opacity: layer.visible ? 1 : 0.4,
                          padding: '2px'
                        }}
                        title={layer.visible ? 'Hide layer' : 'Show layer'}
                      >
                        👁️
                      </button>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: '#6b7280'
                    }}>
                      <span>{layerShapes.length} shape{layerShapes.length !== 1 ? 's' : ''}</span>
                      <span>
                        {Math.round(layer.opacity * 100)}% opacity
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* Central 3D Canvas */}
        <main style={{ 
          flex: 1, 
          position: 'relative', 
          background: '#3b82f6', 
          overflow: 'hidden',
          cursor: activeTool !== 'select' ? (isNearPolylineStart && activeTool === 'polyline' ? 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpath fill=\'white\' stroke=\'black\' stroke-width=\'2\' d=\'M16 4v24M4 16h24\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'10\' fill=\'none\' stroke=\'red\' stroke-width=\'2\'/%3E%3C/svg%3E") 16 16, crosshair' : 'crosshair') : 'default'
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            position: 'absolute', 
            top: 0, 
            left: 0,
            cursor: activeTool !== 'select' ? (isNearPolylineStart && activeTool === 'polyline' ? 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpath fill=\'white\' stroke=\'black\' stroke-width=\'2\' d=\'M16 4v24M4 16h24\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'10\' fill=\'none\' stroke=\'red\' stroke-width=\'2\'/%3E%3C/svg%3E") 16 16, crosshair' : 'crosshair') : 'default'
          }}>
            <SceneManager 
              onCoordinateChange={handleCoordinateChange}
              onCameraChange={handleCameraChange}
              onDimensionChange={handleDimensionChange}
              onPolylineStartProximity={handlePolylineStartProximity}
              settings={{
                gridSize: 100,
                gridDivisions: 50,
                showGrid: true,
                backgroundColor: 'transparent',
                cameraPosition: { x: 0, y: 30, z: 30 },
                cameraTarget: { x: 0, y: 0, z: 0 },
                enableOrbitControls: true,
                maxPolarAngle: Math.PI / 2.1,
                minDistance: 0.1,
                maxDistance: Infinity
              }}
            />
          </div>
          
          {/* Status overlay - shows active tool and current measurements */}
          <div style={{ 
            position: 'absolute', 
            bottom: '16px', 
            left: '16px', 
            background: isProfessionalMode ? 'rgba(59, 130, 246, 0.95)' : 'rgba(255,255,255,0.95)', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            color: isProfessionalMode ? 'white' : '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: isProfessionalMode ? '2px solid #3b82f6' : 'none'
          }}>
            {isProfessionalMode && (
              <>
                <span style={{ fontSize: '16px' }}>⚡</span>
                <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.3)' }}></div>
              </>
            )}
            <span><strong>Tool:</strong> {activeTool}</span>
            <div style={{ width: '1px', height: '16px', background: isProfessionalMode ? 'rgba(255,255,255,0.3)' : '#d1d5db' }}></div>
            <span><strong>Shapes:</strong> {drawing.isDrawing ? 'Drawing...' : `${getShapeCount()} total`}</span>
            <div style={{ width: '1px', height: '16px', background: isProfessionalMode ? 'rgba(255,255,255,0.3)' : '#d1d5db' }}></div>
            <span>
              <strong>Total Area:</strong> {isProfessionalMode ? parseFloat(getTotalArea()).toFixed(4) : getTotalArea()} m²
              {isProfessionalMode && (
                <span style={{ fontSize: '11px', marginLeft: '4px', opacity: 0.8 }}>
                  (Survey Grade ±0.01%)
                </span>
              )}
            </span>
            {getShapeCount() > 1 && (
              <>
                <div style={{ width: '1px', height: '16px', background: isProfessionalMode ? 'rgba(255,255,255,0.3)' : '#d1d5db' }}></div>
                <span>
                  <strong>Avg Area:</strong> {isProfessionalMode ? parseFloat(getAverageArea()).toFixed(4) : getAverageArea()} m²
                </span>
              </>
            )}
            {isProfessionalMode && (
              <>
                <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.3)' }}></div>
                <span style={{ fontSize: '11px', fontWeight: '600' }}>PRO MODE</span>
              </>
            )}
          </div>
          
          {/* Coordinate Display */}
          {activeTool !== 'select' && isMouseOver3D && (
            <div style={{
              position: 'absolute',
              bottom: '80px', // Above the status overlay
              left: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              zIndex: 100
            }}>
              {/* Mouse Position Display */}
              <div style={{
                background: 'rgba(30, 30, 30, 0.95)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                minWidth: '140px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>📍</span>
                  <span style={{ fontWeight: '600' }}>Mouse Position</span>
                </div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                  <div>X: {mousePosition.x.toFixed(1)}m, Z: {mousePosition.y.toFixed(1)}m</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                    Grid: {drawing.snapToGrid ? `${drawing.gridSize}m snap` : 'Free move'} 
                    {drawing.snapToGrid && <span style={{ color: '#22c55e', marginLeft: '4px' }}>📍</span>}
                  </div>
                </div>
              </div>

              {/* Current Dimensions Display - Show when drawing tools are active */}
              {(currentDimensions || (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'polyline')) && (
                <div style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  minWidth: '140px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px' }}>📐</span>
                    <span style={{ fontWeight: '600' }}>Dimensions</span>
                  </div>
                  
                  {currentDimensions ? (
                    <div style={{ fontSize: '11px', opacity: 0.9 }}>
                      {/* Rectangle dimensions */}
                      {currentDimensions.width !== undefined && currentDimensions.height !== undefined && currentDimensions.radius === undefined && (
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                            {currentDimensions.width.toFixed(1)}m × {currentDimensions.height.toFixed(1)}m
                          </div>
                          {currentDimensions.area !== undefined && (
                            <div style={{ fontSize: '10px', opacity: 0.7 }}>
                              Area: {currentDimensions.area.toFixed(1)} m²
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Circle dimensions */}
                      {currentDimensions.radius !== undefined && (
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                            Radius: {currentDimensions.radius.toFixed(1)}m
                          </div>
                          {currentDimensions.area !== undefined && (
                            <div style={{ fontSize: '10px', opacity: 0.7 }}>
                              Area: {currentDimensions.area.toFixed(1)} m²
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>
                      {activeTool === 'rectangle' && 'Click to place corners'}
                      {activeTool === 'circle' && 'Click to place center'}
                      {(activeTool !== 'rectangle' && activeTool !== 'circle') && 'Select a drawing tool'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Properties Expansion Panel - Positioned before right panel to expand to the left */}
        {propertiesExpanded && (
          <div style={{
            width: '240px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e5e5',
            borderRight: '1px solid #e5e5e5',
            padding: '16px',
            overflowY: 'auto',
            height: '100%'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Properties Panel
            </h3>
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Configure drawing properties and settings here.
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Stroke Width
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    defaultValue="2"
                    style={{
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Fill Opacity
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="20"
                    style={{
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar */}
        <div style={{ 
          width: rightPanelExpanded ? '160px' : '50px', 
          background: 'white', 
          borderLeft: '1px solid #e5e5e5', 
          display: 'flex', 
          flexDirection: 'column', 
          transition: 'width 0.3s ease',
          position: 'relative'
        }}>
          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => {
              if (propertiesExpanded) {
                // If properties are expanded, collapse them and return to thin default menu
                setPropertiesExpanded(false);
                setRightPanelExpanded(false);
              } else {
                // Normal toggle behavior for right panel
                setRightPanelExpanded(!rightPanelExpanded);
              }
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '-12px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '2px solid #e5e5e5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#6b7280',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 10,
              transition: 'all 0.2s ease',
              transform: 'translateY(-50%)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#6b7280';
            }}
            title={rightPanelExpanded ? 'Collapse Panel' : 'Expand Panel'}
          >
            {rightPanelExpanded ? '▶' : '◀'}
          </button>

          <div style={{ 
            padding: '16px 0', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: rightPanelExpanded ? 'stretch' : 'center', 
            gap: '8px',
            paddingLeft: rightPanelExpanded ? '16px' : '0',
            paddingRight: rightPanelExpanded ? '16px' : '0'
          }}>
            <button style={{ 
              padding: rightPanelExpanded ? '12px 8px' : '8px', 
              borderRadius: '8px', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              width: '100%',
              textAlign: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              color: '#374151',
              fontWeight: '500'
            }} 
            title="Land Metrics"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
            >
              <Icon name="landMetrics" size={20} color="#000000" />
              <span style={{ fontWeight: '500', color: '#374151' }}>Land Metrics</span>
            </button>
            
            <button style={{ 
              padding: rightPanelExpanded ? '12px 8px' : '8px', 
              borderRadius: '8px', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              width: '100%',
              textAlign: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              color: '#374151',
              fontWeight: '500'
            }} 
            title="Terrain"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
            >
              <Icon name="terrain" size={20} color="#000000" />
              <span style={{ fontWeight: '500', color: '#374151' }}>Terrain</span>
            </button>
            
            <button style={{ 
              padding: rightPanelExpanded ? '12px 8px' : '8px', 
              borderRadius: '8px', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              width: '100%',
              textAlign: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              color: '#374151',
              fontWeight: '500'
            }} 
            title="Dimensions"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
            >
              <Icon name="dimensions" size={20} color="#000000" />
              <span style={{ fontWeight: '500', color: '#374151' }}>Dimensions</span>
            </button>
            
            <button 
              onClick={() => {
                if (propertiesExpanded) {
                  // If properties are expanded, collapse them and return to thin default menu
                  setPropertiesExpanded(false);
                  setRightPanelExpanded(false);
                } else {
                  // If properties are not expanded, expand the panel if needed and show properties
                  if (!rightPanelExpanded) {
                    setRightPanelExpanded(true);
                  }
                  setPropertiesExpanded(true);
                }
              }}
              style={{ 
                padding: rightPanelExpanded ? '12px 8px' : '8px', 
                borderRadius: '8px', 
                background: propertiesExpanded ? '#dbeafe' : 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '11px',
                color: propertiesExpanded ? '#1d4ed8' : '#374151',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                textAlign: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                fontWeight: '500'
              }} 
              title="Properties"
              onMouseEnter={(e) => {
                if (!propertiesExpanded) {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!propertiesExpanded) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }
              }}
            >
              <Icon name="properties" size={20} color="#000000" />
              <span style={{ fontWeight: '500', color: propertiesExpanded ? '#1d4ed8' : '#374151' }}>Properties</span>
            </button>
          </div>
        </div>

      </div>

      {/* Export Settings Dialog */}
      <ExportSettingsDialog
        isOpen={exportSettingsOpen}
        onClose={() => setExportSettingsOpen(false)}
        onExport={handleExportWithSettings}
        initialFormat={exportSettingsFormat}
      />

      {/* Properties Panel - Now using horizontal expansion instead */}
      {/* <PropertiesPanel
        isOpen={propertiesPanelOpen}
        onClose={() => setPropertiesPanelOpen(false)}
      /> */}
    </div>
  );
}

export default App;