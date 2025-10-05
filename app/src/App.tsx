import React, { useState, useEffect, useRef, useMemo } from 'react';
import SceneManager, { type SceneManagerRef } from './components/Scene/SceneManager';
import LayerPanel from './components/LayerPanel';
import AppHeader from './components/Layout/AppHeader';
import SceneErrorBoundary from './components/ErrorBoundary/SceneErrorBoundary';
import UIErrorBoundary from './components/ErrorBoundary/UIErrorBoundary';
import DataErrorBoundary from './components/ErrorBoundary/DataErrorBoundary';
import { useAppStore } from './store/useAppStore';
import ExportSettingsDialog, { type ExportSettings } from './components/ExportSettingsDialog';
import { CalculatorDemo } from './components/CalculatorDemo';
import { InsertAreaModal } from './components/InsertArea';
import { AddAreaModal } from './components/AddArea';
import { PresetsModal } from './components/AddArea/PresetsModal';
import { MeasurementOverlay } from './components/MeasurementOverlay';
import { DistanceInput } from './components/DistanceInput/DistanceInput';
import ComparisonPanel from './components/ComparisonPanel';
import { ConvertPanel } from './components/ConvertPanel';
import { ToolsPanel } from './components/ToolsPanel';
import ReferenceObjectRenderer from './components/Scene/ReferenceObjectRenderer';
import { ObjectPositioner } from './utils/objectPositioning';
import AlignmentControls from './components/UI/AlignmentControls';
import { View2DToggleButton } from './components/UI/View2DToggleButton';
import Icon from './components/Icon';
import logger from './utils/logger';
import type { Point2D, AreaUnit } from './types';

/**
 * Root React component for the Land Visualizer application.
 *
 * Renders the full UI (header, tool ribbon, side panels, 3D scene, status overlays)
 * and wires user interactions to the central scene store: tool selection, drawing/editing,
 * snapping/alignment controls, undo/redo, layer panel, and export flows (Excel/DXF/GeoJSON/PDF).
 *
 * Side effects:
 * - Attaches global keyboard handlers for undo/redo and escape (cancels operations).
 * - Adds/removes document-level mouse and mount-time styles (hides scrollbars).
 * - Registers SceneManager callbacks to track mouse world coordinates, drawing dimensions,
 *   and polyline start proximity.
 *
 * @returns The complete application JSX tree.
 */
function App(): React.JSX.Element {
  // Local UI state for performance (reduces re-renders)
  const [activeTool, setActiveTool] = useState('select');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const sceneManagerRef = useRef<SceneManagerRef>(null);
  const [exportSettingsOpen, setExportSettingsOpen] = useState(false);
  const [exportSettingsFormat] = useState<ExportSettings['format']>('excel');
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
  const [calculatorExpanded, setCalculatorExpanded] = useState(false);
  const [toolsPanelExpanded, setToolsPanelExpanded] = useState(false);
  const [insertAreaModalOpen, setInsertAreaModalOpen] = useState(false);
  const [comparisonExpanded, setComparisonExpanded] = useState(false);
  const [convertExpanded, setConvertExpanded] = useState(false);
  const [tidyUpExpanded, setTidyUpExpanded] = useState(false);

  // Connect to the 3D scene store
  const {
    drawing,
    viewState,
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
    exitResizeMode,
    enterCursorRotationMode,
    exitCursorRotationMode,
    createShapeFromArea,
    addAreaModalOpen,
    openAddAreaModal,
    closeAddAreaModal,
    presets,
    openPresetsModal,
    closePresetsModal,
    createShapeFromPreset,
    customizePreset,
    toggleViewMode,
    triggerRender,
    undo,
    redo,
    canUndo,
    canRedo,
    removeLastPoint,
    deleteShape,
    activateMeasurementTool,
    deactivateMeasurementTool,
    deleteMeasurement,
    selectMeasurement,
    comparison,
    // Line tool state and actions
    startLineDrawing,
    updateDistanceInput,
    hideDistanceInput,
    confirmLineDistance,
    cancelLineDrawing,
    toggleMultiSegmentMode,
    completeLine,
    enableMultiSegmentMode,
    removeLastLineSegment,
    shapes,
    // layers,
    // activeLayerId,
    // updateLayer,
    // selectShape,
    // enterResizeMode
  } = useAppStore();

  // Line tool state
  const lineToolState = useAppStore(state => state.drawing.lineTool);

  // Calculate left panel offset for modals (smart positioning to avoid overlap)
  const leftPanelOffset = useMemo(() => {
    const isAnyLeftPanelExpanded = comparisonExpanded || convertExpanded || toolsPanelExpanded || calculatorExpanded || layersExpanded || tidyUpExpanded;
    if (isAnyLeftPanelExpanded) {
      return 380 + 16; // Panel width (380px) + gap (16px)
    }
    return 0;
  }, [comparisonExpanded, convertExpanded, toolsPanelExpanded, calculatorExpanded, layersExpanded, tidyUpExpanded]);

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
        // Priority 2: If actively drawing a line in multi-segment mode with segments, do segment-level undo
        else if (drawing.activeTool === 'line' && lineToolState.isMultiSegment && lineToolState.segments.length > 0) {
          removeLastLineSegment();
        }
        // Priority 3: If not drawing polyline or line, or no points/segments, do normal shape undo
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

      // Delete/Backspace key: Delete selected shape or measurement
      if ((event.key === 'Delete' || event.key === 'Backspace')) {
        if (selectedShapeId) {
          event.preventDefault();
          deleteShape(selectedShapeId);
        } else if (drawing.measurement?.selectedMeasurementId) {
          event.preventDefault();
          deleteMeasurement(drawing.measurement.selectedMeasurementId);
        }
      }
      // V key: Toggle 2D/3D view
      if (event.key === 'v' || event.key === 'V') {
        event.preventDefault();
        toggleViewMode();
      }

      // L key: Activate line tool
      if (event.key === 'l' || event.key === 'L') {
        event.preventDefault();
        setActiveTool('line');
        setStoreActiveTool('line');
      }

      // ESC key: Cancel all active operations
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelAll();
      }

      // Line tool specific shortcuts
      if (drawing.activeTool === 'line') {
        // Tab: Toggle multi-segment mode
        if (event.key === 'Tab') {
          event.preventDefault();
          toggleMultiSegmentMode();
        }

        // Space: Complete multi-segment line (if in multi-segment mode with segments)
        if (event.key === ' ' && lineToolState.isMultiSegment && lineToolState.segments.length > 0) {
          event.preventDefault();
          completeLine();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, removeLastPoint, removeLastLineSegment, deleteShape, selectedShapeId, deleteMeasurement, drawing.measurement?.selectedMeasurementId, cancelAll, drawing.isDrawing, drawing.activeTool, drawing.currentShape, startLineDrawing, toggleMultiSegmentMode, completeLine, lineToolState.isMultiSegment, lineToolState.segments]);

  // 3D Scene event handlers
  const handleCoordinateChange = (worldPos: Point2D) => {
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

  // Helper function to get appropriate cursor based on view mode and tool
  const getCursor = () => {
    if (activeTool === 'select') return 'default';

    const is2DMode = viewState?.is2DMode || false;

    if (is2DMode) {
      // Use simple cursors in 2D mode
      if (isNearPolylineStart && activeTool === 'polyline') {
        return 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 16 16\'%3E%3Cpath fill=\'white\' stroke=\'black\' stroke-width=\'1\' d=\'M8 2v12M2 8h12\'/%3E%3Ccircle cx=\'8\' cy=\'8\' r=\'4\' fill=\'none\' stroke=\'red\' stroke-width=\'1\'/%3E%3C/svg%3E") 8 8, crosshair';
      }
      return 'crosshair';
    } else {
      // Use larger cursors in 3D mode
      if (isNearPolylineStart && activeTool === 'polyline') {
        return 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpath fill=\'white\' stroke=\'black\' stroke-width=\'2\' d=\'M16 4v24M4 16h24\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'10\' fill=\'none\' stroke=\'red\' stroke-width=\'2\'/%3E%3C/svg%3E") 16 16, crosshair';
      }
      return 'crosshair';
    }
  };

  const handleCameraChange = () => {
    // Handle camera changes if needed for UI updates
    // Could be used for camera presets or view saving
  };

  // Insert Area handler
  const handleInsertArea = async (area: number, unit: AreaUnit) => {
    createShapeFromArea(area, unit);

    // Force a small delay to ensure state updates are processed
    // This prevents the issue where user needs to click on 3D scene to see rectangle update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Trigger an additional render to ensure the UI updates immediately
    // This ensures the rectangle appears with the correct area without requiring user interaction
    triggerRender();
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
      logger.error(`${format} export error:`, error);
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
        logger.error(`${format} export error:`, error);
        alert(`${format.toUpperCase()} export failed. Please try again.`);
      }
    };

    exportWithCustomSettings();
  };

  // const openExportSettings = (format: ExportSettings['format']) => {
  //   setExportSettingsFormat(format);
  //   setExportSettingsOpen(true);
  //   setExportDropdownOpen(false);
  // };

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
      
      <UIErrorBoundary componentName="AppHeader" showMinimalError={true}>
        <AppHeader 
          isProfessionalMode={isProfessionalMode}
          setIsProfessionalMode={setIsProfessionalMode}
          getTotalArea={getTotalArea}
        />
      </UIErrorBoundary>

      {/* Enhanced Ribbon Toolbar */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
        borderBottom: '1px solid #e2e8f0', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
      }}>
        <div style={{ 
          padding: '12px 24px', 
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
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            {/* Drawing */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '8px',
                textAlign: 'center'
              }}>Drawing</div>
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
                    minWidth: '80px', 
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    minWidth: '80px', 
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    minWidth: '80px', 
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    minWidth: '80px', 
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"></circle>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Circle</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTool('line');
                    setStoreActiveTool('line');
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
                    background: activeTool === 'line'
                      ? '#dbeafe'
                      : '#ffffff',
                    color: activeTool === 'line' ? '#1d4ed8' : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    boxShadow: activeTool === 'line'
                      ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTool !== 'line') {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTool !== 'line') {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  title="Precision Line Tool (L)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="6" y1="18" x2="18" y2="6"></line>
                    <circle cx="6" cy="18" r="1" fill="currentColor"></circle>
                    <circle cx="18" cy="6" r="1" fill="currentColor"></circle>
                    {/* Multi-segment mode indicator */}
                    {activeTool === 'line' && lineToolState.isMultiSegment && (
                      <circle cx="20" cy="4" r="2" fill="#10b981" stroke="#ffffff" strokeWidth="1"></circle>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4px' }}>
                    <span>Line</span>
                    {activeTool === 'line' && lineToolState.isMultiSegment && (
                      <span style={{
                        fontSize: '9px',
                        color: '#10b981',
                        fontWeight: '600',
                        marginTop: '-2px'
                      }}>
                        MULTI
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Precision */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '8px',
                textAlign: 'center'
              }}>Precision</div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  onClick={() => {
                    setActiveTool('measure');
                    activateMeasurementTool();
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
                    background: activeTool === 'measure'
                      ? '#dbeafe'
                      : '#ffffff',
                    color: activeTool === 'measure' ? '#1d4ed8' : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    boxShadow: activeTool === 'measure'
                      ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTool !== 'measure') {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTool !== 'measure') {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  title="Measure distances between points with precision"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 14H3l1.5-2h15z"></path>
                    <path d="M21 19H3l1.5-2h15z"></path>
                    <path d="M21 9H3l1.5-2h15z"></path>
                    <circle cx="6" cy="6" r="2"></circle>
                    <circle cx="18" cy="18" r="2"></circle>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Measure</span>
                </button>
              </div>
            </div>

            {/* Geometry */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '8px',
                textAlign: 'center'
              }}>Geometry</div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  onClick={() => setInsertAreaModalOpen(true)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    minWidth: '80px',
                    height: '60px',
                    color: '#000000',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Insert Area</span>
                </button>
                <button
                  onClick={openAddAreaModal}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    minWidth: '80px',
                    height: '60px',
                    color: '#000000',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  title="Create shape from specified area"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
                    <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
                    <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Add Area</span>
                </button>
                <button
                  onClick={openPresetsModal}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    minWidth: '80px',
                    height: '60px',
                    color: '#000000',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  title="Access area configuration presets"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Presets</span>
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

            {/* Display */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '8px',
                textAlign: 'center'
              }}>Display</div>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 14H3l1.5-2h15z"></path>
                    <path d="M21 19H3l1.5-2h15z"></path>
                    <path d="M21 9H3l1.5-2h15z"></path>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Dimensions</span>
                </button>
                <button
                  onClick={() => {
                    // Toggle cursor rotation mode on/off
                    if (drawing.cursorRotationMode) {
                      // Exit cursor rotation mode
                      exitCursorRotationMode();
                    } else if (selectedShapeId && activeTool === 'select' && !drawing.isEditMode) {
                      // Exit resize mode if active
                      if (drawing.isResizeMode) {
                        exitResizeMode();
                      }
                      // Enter cursor rotation mode
                      enterCursorRotationMode(selectedShapeId);
                    }
                  }}
                  disabled={!selectedShapeId || activeTool !== 'select' || drawing.isEditMode || drawing.isDrawing}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    minWidth: '80px',
                    height: '60px',
                    border: '1px solid #e5e7eb',
                    cursor: (!selectedShapeId || activeTool !== 'select' || drawing.isEditMode || drawing.isDrawing)
                      ? 'not-allowed'
                      : 'pointer',
                    background: drawing.cursorRotationMode ? '#a5b4fc' : '#ffffff',
                    color: drawing.cursorRotationMode ? '#312e81' :
                           (!selectedShapeId || activeTool !== 'select' || drawing.isEditMode || drawing.isDrawing)
                             ? '#9ca3af'
                             : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    opacity: (!selectedShapeId || activeTool !== 'select' || drawing.isEditMode || drawing.isDrawing)
                      ? 0.5
                      : 1
                  }}
                  onMouseEnter={(e) => {
                    if (selectedShapeId && activeTool === 'select' && !drawing.isEditMode && !drawing.isDrawing && !drawing.cursorRotationMode) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!drawing.cursorRotationMode) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="m18.5 2.5-8.5 8.5-2 2v2h2l2-2 8.5-8.5a1.5 1.5 0 0 0 0-2.1v0a1.5 1.5 0 0 0-2.1 0z"></path>
                  </svg>
                  <span style={{ marginTop: '4px' }}>
                    {(drawing.isEditMode && drawing.editingShapeId === selectedShapeId) ? 'Exit Edit' : 'Edit'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (selectedShapeId) {
                      deleteShape(selectedShapeId);
                    } else if (drawing.measurement?.selectedMeasurementId) {
                      deleteMeasurement(drawing.measurement.selectedMeasurementId);
                    }
                  }}
                  disabled={!selectedShapeId && !drawing.measurement?.selectedMeasurementId}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    minWidth: '60px',
                    height: '60px',
                    border: '1px solid #e5e7eb',
                    cursor: (selectedShapeId || drawing.measurement?.selectedMeasurementId) ? 'pointer' : 'not-allowed',
                    background: (selectedShapeId || drawing.measurement?.selectedMeasurementId) ? '#ffffff' : '#f9fafb',
                    color: (selectedShapeId || drawing.measurement?.selectedMeasurementId) ? '#ef4444' : '#9ca3af',
                    transition: 'all 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '500',
                    opacity: (selectedShapeId || drawing.measurement?.selectedMeasurementId) ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (selectedShapeId || drawing.measurement?.selectedMeasurementId) {
                      e.currentTarget.style.background = '#fef2f2';
                      e.currentTarget.style.borderColor = '#fecaca';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedShapeId || drawing.measurement?.selectedMeasurementId) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  title={
                    selectedShapeId
                      ? 'Delete selected shape (Delete key)'
                      : drawing.measurement?.selectedMeasurementId
                        ? 'Delete selected measurement (Delete key)'
                        : 'Select a shape or measurement to delete'
                  }
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Delete</span>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m21 7-6 6h6V7z"></path>
                    <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Redo</span>
                </button>
                
                {/* Snap Toggle Buttons */}
                <button
                  onClick={() => {
                    // Toggle snap to grid - update both systems synchronously
                    const currentState = useAppStore.getState();
                    const currentSnapToGrid = currentState.drawing.snapToGrid;
                    const newSnapToGrid = !currentSnapToGrid;

                    useAppStore.setState(state => ({
                      ...state,
                      drawing: {
                        ...state.drawing,
                        snapToGrid: newSnapToGrid, // Update legacy system
                        snapping: {
                          ...state.drawing.snapping,
                          config: {
                            ...state.drawing.snapping.config,
                            enabled: newSnapToGrid || state.drawing.snapping.config.activeTypes?.has?.('endpoint') || state.drawing.snapping.config.activeTypes?.has?.('midpoint') || state.drawing.snapping.config.activeTypes?.has?.('center'),
                            activeTypes: newSnapToGrid
                              ? new Set([...state.drawing.snapping.config.activeTypes, 'grid'])
                              : new Set([...state.drawing.snapping.config.activeTypes].filter(t => t !== 'grid'))
                          }
                        }
                      }
                    }));
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '6px 8px', 
                    borderRadius: '4px', 
                    minWidth: '60px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: drawing.snapToGrid ? '#dbeafe' : '#ffffff',
                    color: drawing.snapToGrid ? '#1d4ed8' : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    if (!drawing.snapToGrid) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!drawing.snapToGrid) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  title="Toggle Grid Snapping"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Grid</span>
                </button>
                
                <button 
                  onClick={() => {
                    // Toggle shape snapping (endpoints + midpoints + centers)
                    const currentState = useAppStore.getState();
                    const hasShapeSnaps = ['endpoint', 'midpoint', 'center'].some(type => 
                      currentState.drawing.snapping.config.activeTypes?.has?.(type)
                    );
                    const newTypes = new Set(currentState.drawing.snapping.config.activeTypes);
                    
                    if (hasShapeSnaps) {
                      // Remove shape snaps
                      ['endpoint', 'midpoint', 'center'].forEach(type => newTypes.delete(type));
                    } else {
                      // Add shape snaps
                      ['endpoint', 'midpoint', 'center'].forEach(type => newTypes.add(type));
                    }
                    
                    useAppStore.setState(state => ({
                      ...state,
                      drawing: {
                        ...state.drawing,
                        snapping: {
                          ...state.drawing.snapping,
                          config: {
                            ...state.drawing.snapping.config,
                            activeTypes: newTypes
                          }
                        }
                      }
                    }));
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '6px 8px', 
                    borderRadius: '4px', 
                    minWidth: '60px', 
                    height: '60px', 
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: ['endpoint', 'midpoint', 'center'].some(type => 
                      drawing.snapping?.config?.activeTypes?.has?.(type)
                    ) ? '#dcfce7' : '#ffffff',
                    color: ['endpoint', 'midpoint', 'center'].some(type => 
                      drawing.snapping?.config?.activeTypes?.has?.(type)
                    ) ? '#166534' : '#000000',
                    transition: 'all 0.2s ease',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    if (['endpoint', 'midpoint', 'center'].some(type => 
                      drawing.snapping?.config?.activeTypes?.has?.(type)
                    )) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (['endpoint', 'midpoint', 'center'].some(type => 
                      drawing.snapping?.config?.activeTypes?.has?.(type)
                    )) {
                      e.currentTarget.style.background = '#dcfce7';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  title="Toggle Shape Snapping (corners, midpoints, centers)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="8"></circle>
                    <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
                    <circle cx="12" cy="4" r="2" fill="currentColor"></circle>
                    <circle cx="12" cy="20" r="2" fill="currentColor"></circle>
                    <circle cx="4" cy="12" r="2" fill="currentColor"></circle>
                    <circle cx="20" cy="12" r="2" fill="currentColor"></circle>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Snap</span>
                </button>
                
                <button
                  onClick={() => {
                    // Show alignment status - our new system is always active
                    alert('✨ Smart Align is active!\n\nCanva-style alignment guides will appear automatically when you drag shapes near each other:\n\n• Purple dashed lines for edge & center alignment\n• Purple badges showing spacing distances\n• No configuration needed - just drag and align!');
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    minWidth: '60px',
                    height: '60px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: '#f0f9ff',
                    color: '#1e40af',
                    transition: 'all 0.2s ease',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dbeafe';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0f9ff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  title="Smart Align - Canva-style alignment system (Always Active)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="4" height="4" fill="currentColor" opacity="0.3"></rect>
                    <rect x="14" y="6" width="4" height="4" fill="currentColor" opacity="0.3"></rect>
                    <line x1="8" y1="3" x2="8" y2="21" strokeDasharray="3 2" stroke="#8B5CF6" strokeWidth="1.5"></line>
                    <line x1="16" y1="3" x2="16" y2="21" strokeDasharray="3 2" stroke="#8B5CF6" strokeWidth="1.5"></line>
                    <circle cx="12" cy="14" r="2" fill="#8B5CF6" opacity="0.8"></circle>
                  </svg>
                  <span style={{ marginTop: '4px' }}>Smart Align</span>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                        <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="21"/>
                            <line x1="8" y1="13" x2="16" y2="21"/>
                          </svg>
                          Excel (.xlsx)
                        </span>
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
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left Sidebar - Fixed width */}
        <div style={{
          width: '50px',
          background: 'white',
          borderRight: '1px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10
        }}>

          {/* Main Navigation Section */}
          <div style={{
            width: '50px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}>
            <div style={{
              padding: '16px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '0',
              paddingRight: '0',
              overflowY: 'auto',
              flex: 1,
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE/Edge
              // Hide scrollbar for Webkit browsers
            }}
            className="hide-scrollbar">
              <button style={{
                padding: '8px',
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
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#374151',
                  lineHeight: '1'
                }}>
                  Home
                </span>
              </button>

              <button
                onClick={() => {
                  if (comparisonExpanded) {
                    // If comparison is expanded, collapse it and return to thin default menu
                    setComparisonExpanded(false);
                    setLeftPanelExpanded(false);
                  } else {
                    // Close other overlays
                    setCalculatorExpanded(false);
                    setLayersExpanded(false);
                    setConvertExpanded(false);
                    setTidyUpExpanded(false);
                    setToolsPanelExpanded(false);

                    // If comparison is not expanded, expand the panel if needed and show comparison
                    if (!leftPanelExpanded) {
                      setLeftPanelExpanded(true);
                    }
                    setComparisonExpanded(true);
                  }
                }}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: comparisonExpanded ? '#3b82f6' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  color: comparisonExpanded ? '#ffffff' : '#374151'
                }}
                title="Compare your land to familiar reference objects"
                onMouseEnter={(e) => {
                  if (!comparisonExpanded) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!comparisonExpanded) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={comparisonExpanded ? '#ffffff' : 'currentColor'} strokeWidth="2">
                  <rect x="2" y="2" width="9" height="9"></rect>
                  <rect x="13" y="2" width="9" height="9"></rect>
                  <rect x="2" y="13" width="9" height="9"></rect>
                  <rect x="13" y="13" width="9" height="9"></rect>
                </svg>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: comparisonExpanded ? '#ffffff' : '#374151',
                  lineHeight: '1'
                }}>
                  Compare
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
                  fontSize: '10px', 
                  fontWeight: '500', 
                  color: '#374151',
                  lineHeight: '1'
                }}>
                  Visual
                </span>
              </button>
            
              <button
                onClick={() => {
                  if (convertExpanded) {
                    setConvertExpanded(false);
                    setLeftPanelExpanded(false);
                  } else {
                    // Close other overlays
                    setCalculatorExpanded(false);
                    setLayersExpanded(false);
                    setComparisonExpanded(false);
                    setTidyUpExpanded(false);
                    setToolsPanelExpanded(false);

                    // If convert is not expanded, expand the panel if needed and show convert
                    if (!leftPanelExpanded) {
                      setLeftPanelExpanded(true);
                    }
                    setConvertExpanded(true);
                  }
                }}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: convertExpanded ? '#3b82f6' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  color: convertExpanded ? '#ffffff' : '#374151'
                }}
                title="Unit Converter"
                onMouseEnter={(e) => {
                  if (!convertExpanded) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!convertExpanded) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }
                }}
              >
                <Icon name="unitConverter" size={20} color={convertExpanded ? "#ffffff" : "#000000"} />
                <span style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: convertExpanded ? '#ffffff' : '#374151',
                  lineHeight: '1'
                }}>
                  Convert
                </span>
              </button>
            
              <button
                onClick={() => {
                  if (toolsPanelExpanded) {
                    setToolsPanelExpanded(false);
                    setLeftPanelExpanded(false);
                  } else {
                    // Close other overlays
                    setLayersExpanded(false);
                    setComparisonExpanded(false);
                    setConvertExpanded(false);
                    setCalculatorExpanded(false);

                    if (!leftPanelExpanded) {
                      setLeftPanelExpanded(true);
                    }
                    setToolsPanelExpanded(true);
                  }
                }}
                style={{
                  padding: leftPanelExpanded ? '12px 16px' : '8px',
                  borderRadius: '8px',
                  background: toolsPanelExpanded ? '#3b82f6' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  color: toolsPanelExpanded ? '#ffffff' : '#374151'
                }}
                title="Quick Tools"
                onMouseEnter={(e) => {
                  if (!toolsPanelExpanded) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  if (!toolsPanelExpanded) {
                    e.currentTarget.style.background = 'transparent';
                  }
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                <Icon name="quickTools" size={20} color={toolsPanelExpanded ? "#ffffff" : "#000000"} />
                <span style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: toolsPanelExpanded ? '#ffffff' : '#374151',
                  lineHeight: '1'
                }}>
                  Tools
                </span>
              </button>
            
              <button 
                onClick={() => {
                  if (calculatorExpanded) {
                    setCalculatorExpanded(false);
                    setLeftPanelExpanded(false);
                  } else {
                    // Close other overlays
                    setLayersExpanded(false);
                    setComparisonExpanded(false);
                    setConvertExpanded(false);
                    setTidyUpExpanded(false);
                    setToolsPanelExpanded(false);

                    if (!leftPanelExpanded) {
                      setLeftPanelExpanded(true);
                    }
                    setCalculatorExpanded(true);
                  }
                }}
                style={{ 
                  padding: '8px', 
                  borderRadius: '8px', 
                  background: calculatorExpanded ? '#3b82f6' : 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  color: calculatorExpanded ? '#ffffff' : '#374151'
                }} 
                title="Calculator"
                onMouseEnter={(e) => {
                  if (!calculatorExpanded) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!calculatorExpanded) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }
                }}
              >
                <Icon name="calculator" size={20} color={calculatorExpanded ? "#ffffff" : "#000000"} />
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: '500', 
                  color: calculatorExpanded ? '#ffffff' : '#374151',
                  lineHeight: '1'
                }}>
                  Calculator
                </span>
              </button>
            
            <button 
              onClick={() => {
                if (layersExpanded) {
                  // If layers are expanded, collapse them and return to thin default menu
                  setLayersExpanded(false);
                  setLeftPanelExpanded(false);
                } else {
                  // Close other overlays
                  setCalculatorExpanded(false);
                  setComparisonExpanded(false);
                  setConvertExpanded(false);
                  setTidyUpExpanded(false);
                  setToolsPanelExpanded(false);

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
                background: layersExpanded ? '#3b82f6' : 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                color: layersExpanded ? '#ffffff' : '#374151'
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
              <Icon name="layers" size={20} color={layersExpanded ? "#ffffff" : "#000000"} />
              <span style={{ 
                fontSize: leftPanelExpanded ? '12px' : '10px', 
                fontWeight: '500', 
                color: layersExpanded ? '#ffffff' : '#374151',
                lineHeight: '1'
              }}>
                Layers
              </span>
            </button>

            <button
                onClick={() => {
                  if (tidyUpExpanded) {
                    // If TidyUp is expanded, collapse it and return to thin default menu
                    setTidyUpExpanded(false);
                    setLeftPanelExpanded(false);
                  } else {
                    // Close other overlays
                    setCalculatorExpanded(false);
                    setLayersExpanded(false);
                    setConvertExpanded(false);
                    setComparisonExpanded(false);
                    setToolsPanelExpanded(false);
                    // If TidyUp is not expanded, expand the panel if needed and show TidyUp
                    if (!leftPanelExpanded) {
                      setLeftPanelExpanded(true);
                    }
                    setTidyUpExpanded(true);
                  }
                }}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: tidyUpExpanded ? '#3b82f6' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  color: tidyUpExpanded ? '#ffffff' : '#374151'
                }}
                title="TidyUp - Organize and distribute shapes automatically"
                onMouseEnter={(e) => {
                  if (!tidyUpExpanded) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!tidyUpExpanded) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tidyUpExpanded ? "#ffffff" : "#000000"} strokeWidth="2">
                  <rect x="3" y="3" width="6" height="6" rx="1" stroke={tidyUpExpanded ? "#ffffff" : "#000000"}/>
                  <rect x="15" y="3" width="6" height="6" rx="1" stroke={tidyUpExpanded ? "#ffffff" : "#000000"}/>
                  <rect x="3" y="15" width="6" height="6" rx="1" stroke={tidyUpExpanded ? "#ffffff" : "#000000"}/>
                  <rect x="15" y="15" width="6" height="6" rx="1" stroke={tidyUpExpanded ? "#ffffff" : "#000000"}/>
                  <path d="M9 12h6" strokeDasharray="2 2" strokeWidth="2" stroke={tidyUpExpanded ? "#ffffff" : "#000000"}/>
                  <path d="M12 9v6" strokeDasharray="2 2" strokeWidth="2" stroke={tidyUpExpanded ? "#ffffff" : "#000000"}/>
                </svg>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: tidyUpExpanded ? '#ffffff' : '#374151',
                  lineHeight: '1'
                }}>
                  TidyUp
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Overlay Panels - Float over canvas */}
        {/* Calculator Expansion Panel - Overlay */}
        {calculatorExpanded && (
          <div style={{
            position: 'absolute',
            left: '50px',
            top: 0,
            bottom: 0,
            width: '420px',
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            zIndex: 20
          }}>
            <UIErrorBoundary componentName="CalculatorDemo" showMinimalError={true}>
              <CalculatorDemo
                inline={true}
                onClose={() => {
                  setCalculatorExpanded(false);
                  setLeftPanelExpanded(false);
                }}
              />
            </UIErrorBoundary>
          </div>
        )}

        {/* Layers Expansion Panel - Overlay */}
        {layersExpanded && (
          <div style={{
            position: 'absolute',
            left: '50px',
            top: 0,
            bottom: 0,
            width: '420px',
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            zIndex: 20
          }}>
            <UIErrorBoundary componentName="LayerPanel" showMinimalError={true}>
              <LayerPanel
                isOpen={true}
                inline={true}
                onClose={() => {
                  setLayersExpanded(false);
                  setLeftPanelExpanded(false);
                }}
              />
            </UIErrorBoundary>
          </div>
        )}

        {/* Tools Expansion Panel - Inline */}
        {toolsPanelExpanded && (
          <div style={{
            position: 'absolute',
            left: '50px',
            top: 0,
            bottom: 0,
            width: '420px',
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            zIndex: 20
          }}>
            <UIErrorBoundary componentName="ToolsPanel" showMinimalError={true}>
              <ToolsPanel
                isExpanded={true}
                onClose={() => {
                  setToolsPanelExpanded(false);
                  setLeftPanelExpanded(false);
                }}
                inline={true}
              />
            </UIErrorBoundary>
          </div>
        )}

        {/* Comparison Expansion Panel - Overlay */}
        {comparisonExpanded && (
          <div style={{
            position: 'absolute',
            left: '50px',
            top: 0,
            bottom: 0,
            width: '420px',
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            zIndex: 20
          }}>
            <UIErrorBoundary componentName="ComparisonPanel" showMinimalError={true}>
              <ComparisonPanel
                expanded={true}
                onToggle={() => {
                  setComparisonExpanded(false);
                  setLeftPanelExpanded(false);
                }}
                inline={true}
              />
            </UIErrorBoundary>
          </div>
        )}

        {/* Convert Expansion Panel - Overlay */}
        {convertExpanded && (
          <div style={{
            position: 'absolute',
            left: '50px',
            top: 0,
            bottom: 0,
            width: '420px',
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            zIndex: 20
          }}>
            <UIErrorBoundary componentName="ConvertPanel" showMinimalError={true}>
              <ConvertPanel
                expanded={true}
                onToggle={() => {
                  setConvertExpanded(false);
                  setLeftPanelExpanded(false);
                }}
                inline={true}
              />
            </UIErrorBoundary>
          </div>
        )}

        {/* TidyUp Expansion Panel - Overlay */}
        {tidyUpExpanded && (
          <div style={{
            position: 'absolute',
            left: '50px',
            top: 0,
            bottom: 0,
            width: '420px',
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            zIndex: 20
          }}>
            <UIErrorBoundary componentName="AlignmentControls" showMinimalError={true}>
              <AlignmentControls
                expanded={true}
                onToggle={() => {
                  setTidyUpExpanded(false);
                  setLeftPanelExpanded(false);
                }}
                inline={true}
              />
            </UIErrorBoundary>
          </div>
        )}

        {/* Central 3D Canvas */}
        <main style={{
          flex: 1,
          position: 'relative',
          background: '#3b82f6',
          overflow: 'hidden',
          cursor: getCursor()
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            cursor: getCursor()
          }}>
            <SceneErrorBoundary>
              <SceneManager
                onCoordinateChange={handleCoordinateChange}
                onCameraChange={handleCameraChange}
                onDimensionChange={handleDimensionChange}
                onPolylineStartProximity={handlePolylineStartProximity}
                hideDimensions={insertAreaModalOpen || addAreaModalOpen || presets.presetsModal.isOpen}
                settings={{
                  gridSize: 100,
                  gridDivisions: 50,
                  showGrid: drawing.snapping?.config?.activeTypes?.has?.('grid') ?? false,
                  backgroundColor: 'transparent',
                  cameraPosition: { x: 0, y: 30, z: 30 },
                  cameraTarget: { x: 0, y: 0, z: 0 },
                  enableOrbitControls: true,
                  maxPolarAngle: Math.PI / 2.1,
                  minDistance: 0.1,
                  maxDistance: Infinity
                }}
                ref={sceneManagerRef}
              >
                {/* Reference objects for visual comparison */}
                <ReferenceObjectRenderer
                  visibleObjectIds={Array.from(comparison.visibleObjects)}
                  userLandBounds={ObjectPositioner.createBoundsFromShapes(shapes)}
                  opacity={0.6}
                />
              </SceneManager>
            </SceneErrorBoundary>
          </div>

          {/* Measurement overlay for dimension labels */}
          <MeasurementOverlay
            camera={sceneManagerRef.current?.camera}
            canvas={sceneManagerRef.current?.canvas}
          />

          {/* Distance input for line tool */}
          <DistanceInput
            value={lineToolState.inputValue}
            onChange={updateDistanceInput}
            onConfirm={confirmLineDistance}
            onCancel={() => {
              hideDistanceInput();
              cancelLineDrawing();
            }}
            visible={lineToolState.showInput}
            isMultiSegment={lineToolState.isMultiSegment}
            segmentCount={lineToolState.segments.length}
            onEnableMultiSegment={enableMultiSegmentMode}
            onCompleteMultiSegment={completeLine}
            onUndoLastSegment={removeLastLineSegment}
          />

          {/* Status overlay - shows active tool and current measurements */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: `${16 + leftPanelOffset}px`,
            background: isProfessionalMode ? 'rgba(59, 130, 246, 0.95)' : 'rgba(255,255,255,0.95)',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            color: isProfessionalMode ? 'white' : '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: isProfessionalMode ? '2px solid #3b82f6' : 'none',
            transition: 'left 0.2s ease'
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
              left: `${16 + leftPanelOffset}px`,
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              zIndex: 100,
              transition: 'left 0.2s ease'
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
                    Grid: {drawing.snapping?.config?.activeTypes?.has?.('grid') ? `${drawing.gridSize}m snap` : 'Free move'} 
                    {drawing.snapping?.config?.activeTypes?.has?.('grid') && <span style={{ color: '#22c55e', marginLeft: '4px' }}>📍</span>}
                  </div>
                </div>
              </div>

              {/* Current Dimensions Display - Show when drawing tools are active */}
              {(currentDimensions || (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'polyline')) && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.95)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
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


        {/* Right Sidebar - Fixed width */}
        <div style={{
          width: '50px',
          background: 'white',
          borderLeft: '1px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10
        }}>

          <div style={{
            padding: '16px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '0',
            paddingRight: '0',
            flex: 1
          }}>
            <button style={{ 
              padding: '8px', 
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
              padding: '8px', 
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
              padding: '8px', 
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
                padding: '8px', 
                borderRadius: '8px', 
                background: propertiesExpanded ? '#3b82f6' : 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '11px',
                color: propertiesExpanded ? '#ffffff' : '#374151',
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
              <Icon name="properties" size={20} color={propertiesExpanded ? "#ffffff" : "#000000"} />
              <span style={{ fontWeight: '500', color: propertiesExpanded ? '#ffffff' : '#374151' }}>Properties</span>
            </button>
          </div>

        </div>

        {/* Properties Panel - Overlay from right */}
        {propertiesExpanded && (
          <div style={{
            position: 'absolute',
            right: '50px',
            top: 0,
            bottom: 0,
            width: '400px',
            background: 'white',
            borderLeft: '1px solid #e5e5e5',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#fafafa'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: '#1f2937'
              }}>
                Properties
              </h3>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
                onClick={() => {
                  setPropertiesExpanded(false);
                  setRightPanelExpanded(false);
                }}
              >
                ▶
              </button>
            </div>
            {/* Content */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {/* Current Tool Section */}
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>
                    {activeTool === 'rectangle' ? '⬜' :
                     activeTool === 'circle' ? '⭕' :
                     activeTool === 'polyline' ? '📐' :
                     activeTool === 'measure' ? '📏' :
                     activeTool === 'line' ? '📏' :
                     '↖'}
                  </span>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#0c4a6e'
                  }}>
                    {activeTool === 'rectangle' ? 'Rectangle Tool' :
                     activeTool === 'circle' ? 'Circle Tool' :
                     activeTool === 'polyline' ? 'Polyline Tool' :
                     activeTool === 'measure' ? 'Measure Tool' :
                     activeTool === 'line' ? 'Line Tool' :
                     'Select Tool'}
                  </h3>
                  {drawing.isDrawing && (
                    <span style={{
                      background: '#22c55e',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      DRAWING
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    How to Use:
                  </h4>
                  <ol style={{
                    margin: 0,
                    paddingLeft: '16px',
                    color: '#6b7280',
                    fontSize: '13px'
                  }}>
                    {activeTool === 'rectangle' && (
                      <>
                        <li style={{ marginBottom: '4px' }}>
                          {drawing.isDrawing
                            ? 'Click to set the opposite corner of your rectangle'
                            : 'Click on the 3D scene to set the first corner of your rectangle'}
                        </li>
                        <li style={{ marginBottom: '4px' }}>
                          The rectangle will be drawn with straight edges between the two corners
                        </li>
                      </>
                    )}
                    {activeTool === 'circle' && (
                      <>
                        <li style={{ marginBottom: '4px' }}>
                          {drawing.isDrawing
                            ? 'Click to set the radius of your circle'
                            : 'Click on the 3D scene to set the center of your circle'}
                        </li>
                        <li style={{ marginBottom: '4px' }}>
                          Move your mouse to adjust the radius
                        </li>
                      </>
                    )}
                    {activeTool === 'polyline' && (
                      <>
                        <li style={{ marginBottom: '4px' }}>
                          {drawing.isDrawing
                            ? 'Click to add more points to your line'
                            : 'Click on the 3D scene to start drawing your line'}
                        </li>
                        <li style={{ marginBottom: '4px' }}>
                          Continue clicking to add additional points
                        </li>
                        <li style={{ marginBottom: '4px' }}>
                          Click near the start point to close the shape
                        </li>
                      </>
                    )}
                    {activeTool === 'select' && (
                      <>
                        <li style={{ marginBottom: '4px' }}>
                          Click on shapes to select and edit them
                        </li>
                        <li style={{ marginBottom: '4px' }}>
                          Use the drawing tools above to create new shapes
                        </li>
                      </>
                    )}
                  </ol>
                </div>
              </div>

              {/* Grid Settings */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  Grid Settings
                </h3>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    <input
                      type="checkbox"
                      checked={drawing.snapToGrid}
                      onChange={() => {
                        const newValue = !drawing.snapToGrid;
                        useAppStore.setState((state) => ({
                          drawing: {
                            ...state.drawing,
                            snapToGrid: newValue
                          }
                        }));
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    Enable Grid Snap
                  </label>
                  <p style={{
                    margin: '4px 0 0 24px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    Snap cursor to grid points for precise measurements
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Grid Size: {drawing.gridSize}m
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={drawing.gridSize}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value);
                      useAppStore.setState((state) => ({
                        drawing: {
                          ...state.drawing,
                          gridSize: newValue
                        }
                      }));
                    }}
                    style={{
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#6b7280',
                    marginTop: '2px'
                  }}>
                    <span>0.5m</span>
                    <span>10m</span>
                  </div>
                </div>
              </div>

              {/* Shape Snapping Controls */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>Shape Snapping</span>
                  <div
                    title="Snap to corners, edges, and centers of existing shapes"
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#9CA3AF',
                      color: 'white',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'help',
                      fontWeight: 'bold'
                    }}
                  >
                    ?
                  </div>
                </div>

                {/* Master Toggle */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={drawing.snapping?.config?.enabled ?? true}
                    onChange={() => {
                      const currentEnabled = drawing.snapping?.config?.enabled ?? true;
                      useAppStore.setState((state) => ({
                        drawing: {
                          ...state.drawing,
                          snapping: {
                            ...state.drawing.snapping,
                            config: {
                              ...state.drawing.snapping.config,
                              enabled: !currentEnabled
                            }
                          }
                        }
                      }));
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  <span>Enable Shape Snapping</span>
                </label>

                {/* Snap Mode and Radius Controls */}
                {(drawing.snapping?.config?.enabled ?? true) && (
                  <>
                    {/* Snap Mode Selection - Adaptive vs Fixed */}
                    <div style={{
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#6B7280',
                        marginBottom: '8px'
                      }}>
                        Snap Detection Mode:
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '16px'
                      }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          color: '#4B5563'
                        }}>
                          <input
                            type="radio"
                            checked={(drawing.snapping?.config?.mode ?? 'adaptive') === 'adaptive'}
                            onChange={() => {
                              useAppStore.setState((state) => ({
                                drawing: {
                                  ...state.drawing,
                                  snapping: {
                                    ...state.drawing.snapping,
                                    config: {
                                      ...state.drawing.snapping.config,
                                      mode: 'adaptive'
                                    }
                                  }
                                }
                              }));
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>Adaptive</span>
                        </label>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          color: '#4B5563'
                        }}>
                          <input
                            type="radio"
                            checked={(drawing.snapping?.config?.mode ?? 'adaptive') === 'fixed'}
                            onChange={() => {
                              useAppStore.setState((state) => ({
                                drawing: {
                                  ...state.drawing,
                                  snapping: {
                                    ...state.drawing.snapping,
                                    config: {
                                      ...state.drawing.snapping.config,
                                      mode: 'fixed'
                                    }
                                  }
                                }
                              }));
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>Fixed</span>
                        </label>
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#9CA3AF',
                        marginTop: '6px',
                        fontStyle: 'italic'
                      }}>
                        {(drawing.snapping?.config?.mode ?? 'adaptive') === 'adaptive'
                          ? 'Auto-adjusts with zoom for consistent detection distance'
                          : 'Manual control of snap radius in meters'}
                      </div>
                    </div>

                    {/* Adaptive Mode Controls */}
                    {(drawing.snapping?.config?.mode ?? 'adaptive') === 'adaptive' && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          marginBottom: '8px'
                        }}>
                          Screen Distance: <strong>{drawing.snapping?.config?.screenSpacePixels ?? 75}px</strong>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="150"
                          step="5"
                          value={drawing.snapping?.config?.screenSpacePixels ?? 75}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            useAppStore.setState((state) => ({
                              drawing: {
                                ...state.drawing,
                                snapping: {
                                  ...state.drawing.snapping,
                                  config: {
                                    ...state.drawing.snapping.config,
                                    screenSpacePixels: newValue
                                  }
                                }
                              }
                            }));
                          }}
                          style={{
                            width: '100%',
                            marginBottom: '8px',
                            cursor: 'pointer'
                          }}
                        />
                        <div style={{
                          fontSize: '11px',
                          color: '#9CA3AF',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>Precise (30px)</span>
                          <span>Relaxed (150px)</span>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#6B7280',
                          marginTop: '8px',
                          padding: '6px 8px',
                          background: '#F3F4F6',
                          borderRadius: '4px'
                        }}>
                          World Radius: <strong>{(drawing.snapping?.config?.snapRadius ?? 5).toFixed(2)}m</strong>
                        </div>
                      </div>
                    )}

                    {/* Fixed Mode Controls */}
                    {(drawing.snapping?.config?.mode ?? 'adaptive') === 'fixed' && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          marginBottom: '8px'
                        }}>
                          Snap Radius: <strong>{drawing.snapping?.config?.snapRadius ?? 5}m</strong>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={drawing.snapping?.config?.snapRadius ?? 5}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            useAppStore.setState((state) => ({
                              drawing: {
                                ...state.drawing,
                                snapping: {
                                  ...state.drawing.snapping,
                                  config: {
                                    ...state.drawing.snapping.config,
                                    snapRadius: newValue
                                  }
                                }
                              }
                            }));
                          }}
                          style={{
                            width: '100%',
                            marginBottom: '8px',
                            cursor: 'pointer'
                          }}
                        />
                        <div style={{
                          fontSize: '11px',
                          color: '#9CA3AF',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>1m</span>
                          <span>20m</span>
                        </div>
                      </div>
                    )}

                    {/* Snap Type Checkboxes */}
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      marginBottom: '8px'
                    }}>
                      Snap Types:
                    </div>

                    {([
                      { type: 'endpoint' as const, label: '🔵 Corners', color: '#3B82F6' },
                      { type: 'midpoint' as const, label: '🟠 Edges', color: '#F59E0B' },
                      { type: 'center' as const, label: '🟢 Centers', color: '#22C55E' },
                      { type: 'grid' as const, label: '◇ Grid', color: '#9CA3AF' }
                    ] as const).map(({ type, label, color }) => (
                      <label
                        key={type}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: '#4B5563',
                          marginBottom: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={drawing.snapping?.config?.activeTypes?.has(type) ?? true}
                          onChange={() => {
                            const currentTypes = drawing.snapping?.config?.activeTypes ?? new Set(['endpoint', 'midpoint', 'center', 'grid']);
                            const newTypes = new Set(currentTypes);
                            if (newTypes.has(type)) {
                              newTypes.delete(type);
                            } else {
                              newTypes.add(type);
                            }
                            useAppStore.setState((state) => ({
                              drawing: {
                                ...state.drawing,
                                snapping: {
                                  ...state.drawing.snapping,
                                  config: {
                                    ...state.drawing.snapping.config,
                                    activeTypes: newTypes
                                  }
                                }
                              }
                            }));
                          }}
                          style={{
                            width: '14px',
                            height: '14px',
                            cursor: 'pointer',
                            accentColor: color
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </>
                )}
              </div>

              {/* Mouse Coordinates */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#15803d'
                }}>
                  Mouse Coordinates
                </h3>
                <div style={{ fontSize: '14px', color: '#166534' }}>
                  <p style={{ margin: '0 0 4px 0' }}>
                    Real-time coordinates are displayed in the 3D scene
                  </p>
                  <p style={{ margin: '0 0 8px 0' }}>
                    <strong>Format:</strong> X: [meters], Z: [meters]
                  </p>
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}>
                    Grid snap: {drawing.snapToGrid ? `ON (${drawing.gridSize}m)` : 'OFF'}
                    <br />
                    Shape snap: {drawing.snapping?.config?.enabled ? 'ON' : 'OFF'}
                    <br />
                    Units: Meters (m)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Export Settings Dialog */}
      <DataErrorBoundary 
        operationType="export"
        retryAction={() => {
          // Retry export with current settings
          if (exportSettingsFormat) {
            handleQuickExport(exportSettingsFormat);
          }
        }}
        onCancel={() => setExportSettingsOpen(false)}
      >
        <ExportSettingsDialog
          isOpen={exportSettingsOpen}
          onClose={() => setExportSettingsOpen(false)}
          onExport={handleExportWithSettings}
          initialFormat={exportSettingsFormat}
        />
      </DataErrorBoundary>

      {/* Insert Area Modal */}
      <InsertAreaModal
        isOpen={insertAreaModalOpen}
        onClose={() => setInsertAreaModalOpen(false)}
        onSubmit={handleInsertArea}
      />

      {/* Add Area Modal */}
      <AddAreaModal
        isOpen={addAreaModalOpen}
        onClose={closeAddAreaModal}
      />

      <PresetsModal
        isOpen={presets.presetsModal.isOpen}
        onClose={closePresetsModal}
        onSelectPreset={createShapeFromPreset}
        onCustomizePreset={customizePreset}
        customPresets={presets.customPresets}
        recentPresets={presets.recentPresets}
      />

      {/* Floating 2D/3D Toggle Button */}
      <View2DToggleButton />
    </div>
  );
}

export default App;