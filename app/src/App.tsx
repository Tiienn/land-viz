import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import SceneManager, { type SceneManagerRef } from './components/Scene/SceneManager';
import { EnhancedHeader } from './components/Layout/EnhancedHeader'; // Phase 3: Gradient logo header
import SceneErrorBoundary from './components/ErrorBoundary/SceneErrorBoundary';
import UIErrorBoundary from './components/ErrorBoundary/UIErrorBoundary';
import DataErrorBoundary from './components/ErrorBoundary/DataErrorBoundary';
import { useAppStore } from './store/useAppStore';
import ExportSettingsDialog, { type ExportSettings } from './components/ExportSettingsDialog';
import { InsertAreaModal } from './components/InsertArea';
import { AddAreaModal } from './components/AddArea';
import { PresetsModal } from './components/AddArea/PresetsModal';
import { MeasurementOverlay } from './components/MeasurementOverlay';
import { DistanceInput } from './components/DistanceInput/DistanceInput';

// Performance optimization: Lazy load heavy panel components
const LayerPanel = lazy(() => import('./components/LayerPanel'));
const PropertiesPanel = lazy(() => import('./components/PropertiesPanel'));
const CalculatorDemo = lazy(() => import('./components/CalculatorDemo').then(m => ({ default: m.CalculatorDemo })));
const ComparisonPanel = lazy(() => import('./components/ComparisonPanel'));
const ConvertPanel = lazy(() => import('./components/ConvertPanel').then(m => ({ default: m.ConvertPanel })));
const ToolsPanel = lazy(() => import('./components/ToolsPanel').then(m => ({ default: m.ToolsPanel })));
import ReferenceObjectRenderer from './components/Scene/ReferenceObjectRenderer';
import { ObjectPositioner } from './utils/objectPositioning';
import AlignmentControls from './components/UI/AlignmentControls';
import { View2DToggleButton, Generate3DWorldButton } from './components/UI/View2DToggleButton';
import { ShortcutsHelpButton } from './components/UI/ShortcutsHelpButton';
import { FlipButton } from './components/UI/FlipButton';
import Minimap from './components/UI/Minimap';
import WalkthroughControlsOverlay from './components/UI/WalkthroughControlsOverlay';
import WalkthroughAccessibilityPanel from './components/UI/WalkthroughAccessibilityPanel';
import WalkthroughClickPrompt from './components/UI/WalkthroughClickPrompt';
import BoundaryCollisionFeedback from './components/UI/BoundaryCollisionFeedback';
import WalkthroughTexturePanel from './components/UI/WalkthroughTexturePanel';
import WalkthroughSkyPanel from './components/UI/WalkthroughSkyPanel';
import { ExportButton } from './components/UI/ExportButton';
import { ExportModal } from './components/Modals/ExportModal';
import Icon from './components/Icon';
import logger from './utils/logger';
import { exportToPDF as exportToPDFBlob } from './services/pdfExportService';
import { downloadFile, generateFilename } from './utils/exportUtils';
import { captureSceneSnapshot, getSceneContainerElement, validateSceneContainer } from './utils/sceneExport';
import type { Point2D, AreaUnit } from './types';
import { useKeyboardShortcuts, useKeyboardShortcutListener } from './hooks/useKeyboardShortcuts';
import { KeyboardShortcutHelp } from './components/KeyboardShortcutHelp';
import type { KeyboardShortcut } from './types/shortcuts';
import { ContextMenu } from './components/ContextMenu/ContextMenu';
import LiveDistanceLabel from './components/DimensionInput/LiveDistanceLabel';
import { SaveTemplateDialog } from './components/TemplateGallery';
import { useTemplateStore } from './store/useTemplateStore';

// Performance optimization: Lazy load template gallery, image importer, and boundary detection
const TemplateGalleryModal = lazy(() => import('./components/TemplateGallery').then(m => ({ default: m.TemplateGalleryModal })));
const ImageImporterModal = lazy(() => import('./components/ImageImport').then(m => ({ default: m.ImageImporterModal })));
const BoundaryDetectionModal = lazy(() => import('./components/BoundaryDetection/BoundaryDetectionModal').then(m => ({ default: m.default })));
import { TextModal } from './components/Text/TextModal';
import { InlineTextOverlay } from './components/Text/InlineTextOverlay';
import { useTextStore } from './store/useTextStore';
import { generateTextId, createDefaultTextObject } from './utils/textUtils';
import type { TextObject } from './types/text';
import { initializeFontLoader } from './utils/fontLoader'; // Phase 11: Font loading
import { ToastContainer, useToast } from './components/UI/Toast'; // Phase 2: Toast notifications
import { ToolButton } from './components/UI/ToolButton'; // Phase 2: Enhanced tool buttons
import { LoadingOverlay } from './components/UI/LoadingSpinner'; // Phase 2: Loading states
import { HelpModal } from './components/UI/HelpModal'; // Phase 2: Help modals
import { tokens } from './styles/tokens'; // Design tokens for consistent styling

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
  const [imageImportOpen, setImageImportOpen] = useState(false);
  const [boundaryDetectionOpen, setBoundaryDetectionOpen] = useState(false);
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
  // Phase 5: Label modal state
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelShapeId, setLabelShapeId] = useState<string | null>(null);
  const [labelPosition, setLabelPosition] = useState<{ x: number; y: number; z: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState<TextObject | undefined>(undefined);
  const [comparisonExpanded, setComparisonExpanded] = useState(false);
  const [convertExpanded, setConvertExpanded] = useState(false);
  const [tidyUpExpanded, setTidyUpExpanded] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);

  // Phase 2: Toast notification system
  const { toasts, showToast, dismissToast } = useToast();

  // Phase 2: Loading states
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string>('');

  // Phase 2: Help modals
  const [smartAlignHelpOpen, setSmartAlignHelpOpen] = useState(false);

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
    selectedShapeIds,
    selectedElementIds, // CRITICAL FIX: Import unified selection array
    enterEditMode,
    exitEditMode,
    addShapeCorner,
    deleteShapeCorner,
    convertRectangleToPolygon,
    cancelAll,
    exitResizeMode,
    enterCursorRotationMode,
    exitCursorRotationMode,
    createShapeFromArea,
    addAreaModalOpen,
    openAddAreaModal,
    closeAddAreaModal,
    isExportModalOpen,
    openExportModal,
    closeExportModal,
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
    duplicateShape,
    activateMeasurementTool,
    deactivateMeasurementTool,
    deleteMeasurement,
    comparison,
    // Line tool state and actions
    updateDistanceInput,
    hideDistanceInput,
    confirmLineDistance,
    cancelLineDrawing,
    toggleMultiSegmentMode,
    completeLine,
    enableMultiSegmentMode,
    removeLastLineSegment,
    shapes,
    updateShape, // Phase 5: For updating shape labels
    // layers,
    // activeLayerId,
    // updateLayer,
    // selectShape,
    // enterResizeMode
    // Keyboard shortcut functions
    nudgeShape,
    selectAllShapes,
    groupShapes, // Phase 4: Now supports text + shapes
    ungroupShapes, // Phase 4: Now supports text + shapes
    alignShapesLeft,
    alignShapesRight,
    alignShapesTop,
    alignShapesBottom,
    flipSelectedShapes,
    distributeShapesHorizontally,
    distributeShapesVertically,
    bringShapeToFront,
    sendShapeToBack,
    bringShapeForward,
    sendShapeBackward,
    // runMigration, // Phase 2: Auto-migration (TODO: Implement this function in useAppStore)
  } = useAppStore();

  // Migration v1.0: Ensure 'perpendicular', 'edge', and 'midpoint' snap types are enabled (fixes localStorage from older versions)
  useEffect(() => {
    const currentState = useAppStore.getState();

    // Check if this migration has already been applied
    if (currentState.migrations?.snappingTypesV1) {
      return; // Already migrated, skip
    }

    const activeTypes = currentState.drawing.snapping.config.activeTypes;

    // Check if perpendicular, edge, or midpoint are missing
    const hasPerpendicular = activeTypes.has('perpendicular');
    const hasEdge = activeTypes.has('edge');
    const hasMidpoint = activeTypes.has('midpoint');
    const needsMigration = !hasPerpendicular || !hasEdge || !hasMidpoint;

    if (needsMigration) {
      logger.info('[Migration v1.0] Applying snapping types migration (adding perpendicular, edge, midpoint)');

      // Update the store state
      useAppStore.setState(state => ({
        ...state,
        drawing: {
          ...state.drawing,
          snapping: {
            ...state.drawing.snapping,
            config: {
              ...state.drawing.snapping.config,
              activeTypes: new Set(['grid', 'endpoint', 'midpoint', 'center', 'edge', 'perpendicular'])
            }
          }
        },
        migrations: {
          ...state.migrations,
          snappingTypesV1: true, // Mark migration as complete
        }
      }));

      logger.info('[Migration v1.0] Snapping types migration completed');
    } else {
      // No migration needed, but mark as complete to prevent future checks
      useAppStore.setState(state => ({
        ...state,
        migrations: {
          ...state.migrations,
          snappingTypesV1: true,
        }
      }));
    }
  }, []); // Run once on mount

  // Line tool state
  const lineToolState = useAppStore(state => state.drawing.lineTool);

  // Text store actions
  const isInlineEditing = useTextStore(state => state.isInlineEditing);
  const inlineEditingTextId = useTextStore(state => state.inlineEditingTextId);
  const inlineEditScreenPosition = useTextStore(state => state.inlineEditScreenPosition);
  const selectedTextId = useTextStore(state => state.selectedTextId);

  // Calculate left panel offset for modals (smart positioning to avoid overlap)
  const leftPanelOffset = useMemo(() => {
    const isAnyLeftPanelExpanded = comparisonExpanded || convertExpanded || toolsPanelExpanded || calculatorExpanded || layersExpanded || tidyUpExpanded;
    if (isAnyLeftPanelExpanded) {
      return 300 + 16; // Panel width (300px) + gap (16px)
    }
    return 0;
  }, [comparisonExpanded, convertExpanded, toolsPanelExpanded, calculatorExpanded, layersExpanded, tidyUpExpanded]);

  // Sync local state with store state when store changes
  useEffect(() => {
    if (drawing.activeTool !== activeTool) {
      setActiveTool(drawing.activeTool);
    }
  }, [drawing.activeTool, activeTool]);

  // Listen for custom event to open Properties panel (from text double-click)
  useEffect(() => {
    const handleOpenPropertiesPanel = () => {
      setPropertiesExpanded(true);
      setRightPanelExpanded(true);
    };

    window.addEventListener('openPropertiesPanel', handleOpenPropertiesPanel);
    return () => window.removeEventListener('openPropertiesPanel', handleOpenPropertiesPanel);
  }, []);

  // Phase 2: Auto-migration - Run once on app load
  // TODO: Implement runMigration function in useAppStore before uncommenting
  // useEffect(() => {
  //   runMigration();
  // }, [runMigration]);

  // Global keyboard shortcut listener
  useKeyboardShortcutListener();

  // Define all keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    // Tool shortcuts
    {
      id: 'tool-select',
      key: 's',
      description: 'Select tool',
      category: 'tools',
      action: () => {
        // Don't activate tools in walkthrough mode
        if (viewState?.viewMode === '3d-walkthrough') return;
        setActiveTool('select');
        setStoreActiveTool('select');
      },
    },
    {
      id: 'tool-rectangle',
      key: 'r',
      description: 'Rectangle tool',
      category: 'tools',
      action: () => {
        // Don't activate tools in walkthrough mode
        if (viewState?.viewMode === '3d-walkthrough') return;
        setActiveTool('rectangle');
        setStoreActiveTool('rectangle');
      },
    },
    {
      id: 'tool-circle',
      key: 'c',
      description: 'Circle tool',
      category: 'tools',
      action: () => {
        // Don't activate tools in walkthrough mode
        if (viewState?.viewMode === '3d-walkthrough') return;
        setActiveTool('circle');
        setStoreActiveTool('circle');
      },
    },
    {
      id: 'tool-polyline',
      key: 'p',
      description: 'Polyline tool',
      category: 'tools',
      action: () => {
        // Don't activate tools in walkthrough mode
        if (viewState?.viewMode === '3d-walkthrough') return;
        setActiveTool('polyline');
        setStoreActiveTool('polyline');
      },
    },
    {
      id: 'tool-line',
      key: 'l',
      description: 'Line tool',
      category: 'tools',
      action: () => {
        // Don't activate tools in walkthrough mode
        if (viewState?.viewMode === '3d-walkthrough') return;
        setActiveTool('line');
        setStoreActiveTool('line');
      },
    },
    {
      id: 'tool-measure',
      key: 'm',
      description: 'Measurement tool',
      category: 'tools',
      action: () => {
        // Don't activate tools in walkthrough mode
        if (viewState?.viewMode === '3d-walkthrough') return;
        if (drawing.measurement?.isActive) {
          deactivateMeasurementTool();
        } else {
          activateMeasurementTool();
        }
      },
    },
    {
      id: 'tool-text',
      key: 't',
      description: 'Text tool',
      category: 'tools',
      action: () => {
        // Don't activate tools in walkthrough mode (T is used for texture panel)
        if (viewState?.viewMode === '3d-walkthrough') return;
        setActiveTool('text');
        setStoreActiveTool('text');
      },
    },
    {
      id: 'tool-edit',
      key: 'e',
      description: 'Toggle edit mode',
      category: 'tools',
      action: () => {
        // Don't activate tools in walkthrough mode
        if (viewState?.viewMode === '3d-walkthrough') return;
        if (selectedShapeId) {
          if (drawing.isEditMode) {
            exitEditMode();
          } else {
            enterEditMode(selectedShapeId);
          }
        }
      },
    },
    // Editing shortcuts
    {
      id: 'undo',
      key: 'z',
      ctrl: true,
      description: 'Undo',
      category: 'editing',
      action: () => {
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
      },
    },
    {
      id: 'redo',
      key: 'y',
      ctrl: true,
      description: 'Redo',
      category: 'editing',
      action: () => {
        if (canRedo()) {
          redo();
        }
      },
    },
    {
      id: 'duplicate',
      key: 'd',
      ctrl: true,
      description: 'Duplicate selected shape',
      category: 'editing',
      action: () => {
        // CRITICAL FIX: Check BOTH selectedElementIds (unified) and selectedShapeIds (legacy)
        const targetId = selectedElementIds && selectedElementIds.length > 0
          ? selectedElementIds[0]
          : (selectedShapeIds && selectedShapeIds.length > 0
            ? selectedShapeIds[0]
            : selectedShapeId);

        if (targetId) {
          duplicateShape(targetId);
        }
      },
    },
    {
      id: 'delete',
      key: 'Delete',
      description: 'Delete selected',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;

        if (targetId) {
          deleteShape(targetId);
        } else if (drawing.measurement?.selectedMeasurementId) {
          deleteMeasurement(drawing.measurement.selectedMeasurementId);
        }
      },
    },
    {
      id: 'delete-backspace',
      key: 'Backspace',
      description: 'Delete selected (alt)',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;

        if (targetId) {
          deleteShape(targetId);
        } else if (drawing.measurement?.selectedMeasurementId) {
          deleteMeasurement(drawing.measurement.selectedMeasurementId);
        }
      },
    },
    {
      id: 'flip-horizontal',
      key: 'h',
      shift: true,
      description: 'Flip Horizontally',
      category: 'editing',
      action: () => {
        if (selectedShapeIds && selectedShapeIds.length > 0) {
          flipSelectedShapes('horizontal');
        }
      },
    },
    {
      id: 'flip-vertical',
      key: 'v',
      shift: true,
      description: 'Flip Vertically',
      category: 'editing',
      action: () => {
        if (selectedShapeIds && selectedShapeIds.length > 0) {
          flipSelectedShapes('vertical');
        }
      },
    },
    // View shortcuts
    {
      id: 'toggle-view',
      key: 'v',
      description: 'Toggle 2D/3D view',
      category: 'view',
      action: () => {
        toggleViewMode();
      },
    },
    {
      id: 'open-template-gallery',
      key: 't',
      ctrl: true,
      shift: true,
      description: 'Open Template Gallery',
      category: 'view',
      action: () => {
        useTemplateStore.getState().openGallery();
      },
    },
    {
      id: 'export-pdf',
      key: 'e',
      ctrl: true,
      description: 'Export to PDF',
      category: 'view',
      action: () => {
        if (shapes.length > 0) {
          openExportModal();
        }
      },
    },
    {
      id: 'escape',
      key: 'Escape',
      description: 'Cancel operation',
      category: 'drawing',
      action: () => {
        // Check if keyboard help modal is currently open by checking the DOM
        const isHelpOpen = document.body.hasAttribute('data-keyboard-help-open');
        if (isHelpOpen) {
          setShortcutHelpOpen(false);
        } else {
          cancelAll();
        }
      },
    },
    // Line tool specific
    {
      id: 'line-toggle-multi',
      key: 'Tab',
      description: 'Toggle multi-segment mode (Line tool)',
      category: 'drawing',
      action: () => {
        if (drawing.activeTool === 'line') {
          toggleMultiSegmentMode();
        }
      },
      enabled: drawing.activeTool === 'line',
    },
    {
      id: 'line-complete',
      key: ' ',
      description: 'Complete line (Line tool)',
      category: 'drawing',
      action: () => {
        if (drawing.activeTool === 'line' && lineToolState.isMultiSegment && lineToolState.segments.length > 0) {
          completeLine();
        }
      },
      enabled: drawing.activeTool === 'line' && lineToolState.isMultiSegment && lineToolState.segments.length > 0,
    },
    // Arrow key nudging
    {
      id: 'nudge-up',
      key: 'ArrowUp',
      description: 'Nudge shape down (0.5m)',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;
        if (targetId) {
          nudgeShape(targetId, 'down', 0.5);
        }
      },
    },
    {
      id: 'nudge-down',
      key: 'ArrowDown',
      description: 'Nudge shape up (0.5m)',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;
        if (targetId) {
          nudgeShape(targetId, 'up', 0.5);
        }
      },
    },
    {
      id: 'nudge-left',
      key: 'ArrowLeft',
      description: 'Nudge shape left (0.5m)',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;
        if (targetId) {
          nudgeShape(targetId, 'left', 0.5);
        }
      },
    },
    {
      id: 'nudge-right',
      key: 'ArrowRight',
      description: 'Nudge shape right (0.5m)',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;
        if (targetId) {
          nudgeShape(targetId, 'right', 0.5);
        }
      },
    },
    // Shift + Arrow large nudge
    {
      id: 'nudge-up-large',
      key: 'ArrowUp',
      shift: true,
      description: 'Nudge shape down (1m)',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;
        if (targetId) {
          nudgeShape(targetId, 'down', 1);
        }
      },
    },
    {
      id: 'nudge-down-large',
      key: 'ArrowDown',
      shift: true,
      description: 'Nudge shape up (1m)',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;
        if (targetId) {
          nudgeShape(targetId, 'up', 1);
        }
      },
    },
    {
      id: 'nudge-left-large',
      key: 'ArrowLeft',
      shift: true,
      description: 'Nudge shape left (1m)',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;
        if (targetId) {
          nudgeShape(targetId, 'left', 1);
        }
      },
    },
    {
      id: 'nudge-right-large',
      key: 'ArrowRight',
      shift: true,
      description: 'Nudge shape right (1m)',
      category: 'editing',
      action: () => {
        // Check selectedShapeIds first (for groups), fallback to selectedShapeId
        const targetId = selectedShapeIds && selectedShapeIds.length > 0
          ? selectedShapeIds[0]
          : selectedShapeId;
        if (targetId) {
          nudgeShape(targetId, 'right', 1);
        }
      },
    },
    // Grouping shortcuts (Phase 4: Now supports text + shapes)
    {
      id: 'group',
      key: 'g',
      ctrl: true,
      description: 'Group selected elements',
      category: 'editing',
      action: () => {
        // Phase 4: groupShapes now supports both shapes and text
        groupShapes();
      },
    },
    {
      id: 'ungroup',
      key: 'g',
      ctrl: true,
      shift: true,
      description: 'Ungroup elements',
      category: 'editing',
      action: () => {
        // Phase 4: ungroupShapes now supports both shapes and text
        ungroupShapes();
      },
    },
    // Select all
    {
      id: 'select-all',
      key: 'a',
      ctrl: true,
      description: 'Select all shapes',
      category: 'selection',
      action: () => {
        selectAllShapes();
      },
    },
    // Zoom and camera controls
    {
      id: 'zoom-in',
      key: '=',
      description: 'Zoom in',
      category: 'view',
      action: () => {
        if (sceneManagerRef.current?.camera) {
          const camera = sceneManagerRef.current.camera;
          if (camera.isPerspectiveCamera) {
            camera.position.z = Math.max(camera.position.z * 0.9, 5);
          }
        }
      },
    },
    {
      id: 'zoom-out',
      key: '-',
      description: 'Zoom out',
      category: 'view',
      action: () => {
        if (sceneManagerRef.current?.camera) {
          const camera = sceneManagerRef.current.camera;
          if (camera.isPerspectiveCamera) {
            camera.position.z = Math.min(camera.position.z * 1.1, 200);
          }
        }
      },
    },
    {
      id: 'reset-camera',
      key: '0',
      description: 'Reset camera view',
      category: 'view',
      action: () => {
        if (sceneManagerRef.current?.cameraController?.current) {
          sceneManagerRef.current.cameraController.current.resetCamera(1000);
        }
      },
    },
    // Alignment shortcuts
    {
      id: 'align-left',
      key: 'l',
      ctrl: true,
      description: 'Align left edges',
      category: 'alignment',
      action: () => {
        if (selectedShapeIds && selectedShapeIds.length >= 2) {
          alignShapesLeft(selectedShapeIds);
        }
      },
    },
    {
      id: 'align-right',
      key: 'r',
      ctrl: true,
      shift: true,
      description: 'Align right edges',
      category: 'alignment',
      action: () => {
        if (selectedShapeIds && selectedShapeIds.length >= 2) {
          alignShapesRight(selectedShapeIds);
        }
      },
    },
    {
      id: 'align-top',
      key: 't',
      ctrl: true,
      description: 'Align top edges',
      category: 'alignment',
      action: () => {
        if (selectedShapeIds && selectedShapeIds.length >= 2) {
          alignShapesTop(selectedShapeIds);
        }
      },
    },
    {
      id: 'align-bottom',
      key: 'b',
      ctrl: true,
      description: 'Align bottom edges',
      category: 'alignment',
      action: () => {
        if (selectedShapeIds && selectedShapeIds.length >= 2) {
          alignShapesBottom(selectedShapeIds);
        }
      },
    },
    // Distribution shortcuts
    {
      id: 'distribute-horizontal',
      key: 'h',
      ctrl: true,
      shift: true,
      description: 'Distribute horizontally',
      category: 'alignment',
      action: () => {
        if (selectedShapeIds && selectedShapeIds.length >= 3) {
          distributeShapesHorizontally(selectedShapeIds);
        }
      },
    },
    {
      id: 'distribute-vertical',
      key: 'v',
      alt: true,
      description: 'Distribute vertically',
      category: 'alignment',
      action: () => {
        if (selectedShapeIds && selectedShapeIds.length >= 3) {
          distributeShapesVertically(selectedShapeIds);
        }
      },
    },
    // Z-order shortcuts
    {
      id: 'bring-to-front',
      key: ']',
      ctrl: true,
      description: 'Bring to front',
      category: 'editing',
      action: () => {
        if (selectedShapeId) {
          bringShapeToFront(selectedShapeId);
        }
      },
    },
    {
      id: 'send-to-back',
      key: '[',
      ctrl: true,
      description: 'Send to back',
      category: 'editing',
      action: () => {
        if (selectedShapeId) {
          sendShapeToBack(selectedShapeId);
        }
      },
    },
    {
      id: 'bring-forward',
      key: ']',
      ctrl: true,
      shift: true,
      description: 'Bring forward',
      category: 'editing',
      action: () => {
        if (selectedShapeId) {
          bringShapeForward(selectedShapeId);
        }
      },
    },
    {
      id: 'send-backward',
      key: '[',
      ctrl: true,
      shift: true,
      description: 'Send backward',
      category: 'editing',
      action: () => {
        if (selectedShapeId) {
          sendShapeBackward(selectedShapeId);
        }
      },
    },
    // Import Plan
    {
      id: 'import-plan',
      key: 'i',
      description: 'Open Import Plan dialog',
      category: 'tools',
      action: () => {
        setImageImportOpen(true);
      },
    },
    // Help overlay
    {
      id: 'help',
      key: '?',
      description: 'Toggle keyboard shortcuts',
      category: 'view',
      action: () => {
        // Check current state from DOM to avoid stale closure
        const isOpen = document.body.hasAttribute('data-keyboard-help-open');
        setShortcutHelpOpen(!isOpen);
      },
    },
  ], [
    drawing.activeTool,
    drawing.isEditMode,
    drawing.measurement?.isActive,
    drawing.measurement?.selectedMeasurementId,
    drawing.isDrawing,
    drawing.currentShape,
    selectedShapeId,
    selectedShapeIds,
    selectedElementIds,
    canUndo,
    canRedo,
    lineToolState.isMultiSegment,
    lineToolState.segments.length,
    // Store action functions
    setActiveTool,
    setStoreActiveTool,
    activateMeasurementTool,
    deactivateMeasurementTool,
    enterEditMode,
    exitEditMode,
    removeLastPoint,
    removeLastLineSegment,
    undo,
    redo,
    deleteShape,
    duplicateShape,
    deleteMeasurement,
    toggleViewMode,
    cancelAll,
    toggleMultiSegmentMode,
    completeLine,
    nudgeShape,
    groupShapes,
    ungroupShapes,
    selectAllShapes,
    flipSelectedShapes,
    alignShapesLeft,
    alignShapesRight,
    alignShapesTop,
    alignShapesBottom,
    distributeShapesHorizontally,
    distributeShapesVertically,
    bringShapeToFront,
    sendShapeToBack,
    bringShapeForward,
    sendShapeBackward,
    setShortcutHelpOpen,
    setImageImportOpen,
    sceneManagerRef,
    // Note: shortcutHelpOpen removed from deps - Esc handler checks DOM directly
  ]);

  // Register all shortcuts
  useKeyboardShortcuts(shortcuts);

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

  // PDF Export handler
  const handlePDFExport = async (filters: import('./types/export').ExportFilters) => {
    try {
      // Step 1: Capture scene snapshot
      showToast('info', 'Generating preview...');
      let sceneImageDataURL: string | undefined;

      try {
        const sceneContainer = getSceneContainerElement();
        if (sceneContainer && validateSceneContainer(sceneContainer)) {
          // Mark scene as exporting to hide controls
          sceneContainer.setAttribute('data-exporting', 'true');

          // Small delay to ensure controls are hidden before capture
          await new Promise(resolve => setTimeout(resolve, 100));

          // Capture scene with 10s timeout to prevent hanging
          const CAPTURE_TIMEOUT = 10000; // 10 seconds
          const capturePromise = captureSceneSnapshot(sceneContainer, 2); // 2x resolution
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Scene capture timeout (10s)')), CAPTURE_TIMEOUT)
          );

          sceneImageDataURL = await Promise.race([capturePromise, timeoutPromise]);
          logger.info('Scene snapshot captured successfully');

          // Remove exporting flag
          sceneContainer.removeAttribute('data-exporting');
        } else {
          logger.warn('Scene container not found or invalid, exporting without preview');
        }
      } catch (captureError) {
        logger.error('Scene capture failed, continuing without image:', captureError);

        // Ensure flag is removed even if capture fails
        const sceneContainer = getSceneContainerElement();
        if (sceneContainer) {
          sceneContainer.removeAttribute('data-exporting');
        }
        // Continue without image - graceful degradation
      }

      // Step 2: Generate PDF with scene image
      showToast('info', 'Generating PDF...');
      const blob = await exportToPDFBlob(shapes, filters, sceneImageDataURL);

      if (!blob || !(blob instanceof Blob)) {
        throw new Error('Invalid blob returned from exportToPDFBlob');
      }

      // Step 3: Download
      const filename = generateFilename();
      downloadFile(blob, filename);
      showToast('success', 'PDF exported successfully!');
    } catch (error) {
      logger.error('PDF export failed:', error);
      showToast('error', 'Export failed. Please try again.');
    }
  };

  // Export handlers
  const handleQuickExport = async (format: 'excel' | 'dxf' | 'geojson' | 'pdf') => {
    setIsExporting(true);
    setExportingFormat(format.toUpperCase());
    showToast('info', `Exporting to ${format.toUpperCase()}...`);

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
        showToast('success', `${format.toUpperCase()} file exported successfully!`);
      } else {
        showToast('error', `${format.toUpperCase()} export failed. Please try again.`);
      }
    } catch (error) {
      logger.error(`${format} export error:`, error);
      showToast('error', `${format.toUpperCase()} export failed. Please try again.`);
    } finally {
      setIsExporting(false);
      setExportingFormat('');
    }
  };

  const handleExportWithSettings = (settings: ExportSettings) => {
    const { format, ...exportOptions } = settings;

    const exportWithCustomSettings = async () => {
      setIsExporting(true);
      setExportingFormat(format.toUpperCase());
      showToast('info', `Exporting to ${format.toUpperCase()}...`);

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
          showToast('success', `${format.toUpperCase()} file exported successfully!`);
        } else {
          showToast('error', `${format.toUpperCase()} export failed. Please try again.`);
        }
      } catch (error) {
        logger.error(`${format} export error:`, error);
        showToast('error', `${format.toUpperCase()} export failed. Please try again.`);
      } finally {
        setIsExporting(false);
        setExportingFormat('');
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

  // Phase 11: Initialize font loader
  React.useEffect(() => {
    initializeFontLoader();
  }, []);

  // Listen for quickExport custom events from ExportButton
  useEffect(() => {
    const handleQuickExportEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ format: 'excel' | 'dxf' }>;
      if (customEvent.detail?.format) {
        handleQuickExport(customEvent.detail.format);
      }
    };

    window.addEventListener('quickExport', handleQuickExportEvent);
    return () => window.removeEventListener('quickExport', handleQuickExportEvent);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Prevent default browser context menu globally
  React.useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  // Reset camera event listener (triggered from context menu)
  React.useEffect(() => {
    const handleResetCamera = () => {
      // Access camera controller through scene manager ref
      if (sceneManagerRef.current?.cameraController?.current) {
        sceneManagerRef.current.cameraController.current.resetCamera(1000);
      }
    };

    window.addEventListener('resetCamera', handleResetCamera);

    return () => {
      window.removeEventListener('resetCamera', handleResetCamera);
    };
  }, []);

  // ============================================================
  // CANVA-STYLE INLINE TEXT EDITING
  // ============================================================
  // Modal-based text creation has been replaced with inline editing.
  // When clicking with the text tool, DrawingCanvas now:
  // 1. Creates a text object immediately
  // 2. Opens InlineTextEditor component (renders in 3D space)
  // 3. Shows live formatting controls in PropertiesPanel
  // 4. User types directly at the click position (no modal interruption)
  //
  // The modal system below is ONLY for label editing (shape labels via double-click)
  // ============================================================

  // Phase 5: Open label modal event listener
  React.useEffect(() => {
    const handleOpenLabelModal = (event: CustomEvent<{ shapeId: string; position: { x: number; y: number; z: number }; existingLabel?: TextObject }>) => {
      const { shapeId, position, existingLabel } = event.detail;
      setLabelShapeId(shapeId);
      setLabelPosition(position);
      setEditingLabel(existingLabel);
      setLabelModalOpen(true);
    };

    window.addEventListener('openLabelModal', handleOpenLabelModal);

    return () => {
      window.removeEventListener('openLabelModal', handleOpenLabelModal);
    };
  }, []);

  // Phase 5: Handle label modal save
  const handleLabelModalSave = (textData: Partial<TextObject>) => {
    if (!labelShapeId || !labelPosition) return;

    const shape = shapes.find(s => s.id === labelShapeId);
    if (!shape) return;

    // Create or update label
    const label: TextObject = {
      ...createDefaultTextObject(
        labelPosition,
        shape.layerId,
        'label'
      ),
      id: editingLabel?.id || generateTextId(),
      content: textData.content!,
      attachedToShapeId: labelShapeId,
      offset: { x: 0, y: 0 },
      ...textData
    };

    // Update shape with label using updateShape from store
    updateShape(labelShapeId, { label });

    // Close modal and reset state
    setLabelModalOpen(false);
    setLabelShapeId(null);
    setLabelPosition(null);
    setEditingLabel(undefined);
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: tokens.colors.neutral[50],
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      
      <UIErrorBoundary componentName="EnhancedHeader" showMinimalError={true}>
        <EnhancedHeader
          isProfessionalMode={isProfessionalMode}
          setIsProfessionalMode={setIsProfessionalMode}
          getTotalArea={getTotalArea}
        />
      </UIErrorBoundary>

      {/* Enhanced Ribbon Toolbar */}
      <div style={{
        background: `linear-gradient(135deg, ${tokens.colors.background.primary} 0%, ${tokens.colors.neutral[50]} 100%)`,
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        boxShadow: tokens.shadows.md,
        overflow: 'visible'
      }}>
        <div style={{
          padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
          overflowX: 'hidden',
          overflowY: 'visible'
        }}>
          <div style={{ display: 'flex', gap: tokens.spacing[1], alignItems: 'flex-start', flexWrap: 'nowrap', minWidth: 'fit-content' }}>
            {/* Drawing */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: tokens.typography.caption.size,
                fontWeight: tokens.typography.label.weight,
                color: tokens.colors.neutral[500],
                marginBottom: tokens.spacing[1],
                textAlign: 'center'
              }}>Drawing</div>
              <div style={{ display: 'flex', gap: tokens.spacing[0.5] /* TODO: Consider adding tokens.spacing[0] = '2px' */ }}>
                <ToolButton
                  toolId="select"
                  isActive={activeTool === 'select'}
                  onClick={() => {
                    setActiveTool('select');
                    setStoreActiveTool('select');
                  }}
                  label="Select"
                  shortcut="S"
                  icon={<Icon name="select" size={20} />}
                />
                <ToolButton
                  toolId="rectangle"
                  isActive={activeTool === 'rectangle'}
                  onClick={() => {
                    setActiveTool('rectangle');
                    setStoreActiveTool('rectangle');
                    // Auto-open Properties panel for dimension input
                    setPropertiesExpanded(true);
                    setRightPanelExpanded(true);
                  }}
                  label="Rectangle"
                  shortcut="R"
                  icon={<Icon name="rectangle" size={20} />}
                />
                <ToolButton
                  toolId="polyline"
                  isActive={activeTool === 'polyline'}
                  onClick={() => {
                    setActiveTool('polyline');
                    setStoreActiveTool('polyline');
                  }}
                  label="Polyline"
                  shortcut="P"
                  icon={<Icon name="polyline" size={20} />}
                />
                <ToolButton
                  toolId="circle"
                  isActive={activeTool === 'circle'}
                  onClick={() => {
                    setActiveTool('circle');
                    setStoreActiveTool('circle');
                    // Auto-open Properties panel for dimension input
                    setPropertiesExpanded(true);
                    setRightPanelExpanded(true);
                  }}
                  label="Circle"
                  shortcut="C"
                  icon={<Icon name="circle" size={20} />}
                />
                <ToolButton
                  toolId="line"
                  isActive={activeTool === 'line'}
                  onClick={() => {
                    setActiveTool('line');
                    setStoreActiveTool('line');
                  }}
                  label="Line"
                  shortcut="L"
                  icon={<Icon name="line" size={20} />}
                />
              </div>
            </div>

            {/* Precision */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: tokens.typography.caption.size,
                fontWeight: tokens.typography.label.weight,
                color: tokens.colors.neutral[500],
                marginBottom: tokens.spacing[1],
                textAlign: 'center'
              }}>Precision</div>
              <div style={{ display: 'flex', gap: tokens.spacing[0.5] /* TODO: Consider adding tokens.spacing[0] = '2px' */ }}>
                <ToolButton
                  toolId="measure"
                  isActive={activeTool === 'measure'}
                  onClick={() => {
                    setActiveTool('measure');
                    activateMeasurementTool();
                  }}
                  label="Measure"
                  shortcut="M"
                  icon={<Icon name="measure" size={20} />}
                />
                <ToolButton
                  toolId="text"
                  isActive={activeTool === 'text'}
                  onClick={() => {
                    setActiveTool('text');
                    setStoreActiveTool('text');
                  }}
                  label="Text"
                  shortcut="T"
                  icon={<Icon name="text" size={20} />}
                />
              </div>
            </div>

            {/* Geometry */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: tokens.typography.caption.size,
                fontWeight: tokens.typography.label.weight,
                color: tokens.colors.neutral[500],
                marginBottom: tokens.spacing[1],
                textAlign: 'center'
              }}>Geometry</div>
              <div style={{ display: 'flex', gap: tokens.spacing[0.5] /* TODO: Consider adding tokens.spacing[0] = '2px' */ }}>
                <button
                  onClick={() => setInsertAreaModalOpen(true)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    color: tokens.colors.neutral[900],
                    background: tokens.colors.background.primary,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: 'pointer',
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
                    transition: `all ${tokens.animation.timing.smooth} ease`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
                    e.currentTarget.style.borderColor = tokens.colors.neutral[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tokens.colors.background.primary;
                    e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Insert Area</span>
                </button>
                <button
                  onClick={openAddAreaModal}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    color: tokens.colors.neutral[900],
                    background: tokens.colors.background.primary,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: 'pointer',
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
                    transition: `all ${tokens.animation.timing.smooth} ease`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
                    e.currentTarget.style.borderColor = tokens.colors.neutral[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tokens.colors.background.primary;
                    e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                  }}
                  title="Create shape from specified area"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
                    <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
                    <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Add Area</span>
                </button>
                <button
                  onClick={openPresetsModal}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    color: tokens.colors.neutral[900],
                    background: tokens.colors.background.primary,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: 'pointer',
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
                    transition: `all ${tokens.animation.timing.smooth} ease`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
                    e.currentTarget.style.borderColor = tokens.colors.neutral[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tokens.colors.background.primary;
                    e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                  }}
                  title="Access area configuration presets"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Presets</span>
                </button>
              </div>
            </div>

            {/* Vertical Separator */}
            <div style={{
              width: tokens.sizing.separator,
              height: tokens.sizing.separatorHeight,
              background: tokens.colors.neutral[200],
              margin: '0 2px' /* 2px - consider adding tokens.spacing[0] = '2px' */
            }}></div>

            {/* Display */}
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'visible', position: 'relative' }}>
              <div style={{
                fontSize: tokens.typography.caption.size,
                fontWeight: tokens.typography.label.weight,
                color: tokens.colors.neutral[500],
                marginBottom: tokens.spacing[1],
                textAlign: 'center'
              }}>Display</div>
              <div style={{ display: 'flex', gap: tokens.spacing[0.5] /* TODO: Consider adding tokens.spacing[0] = '2px' */, overflow: 'visible', position: 'relative' }}>
                <button
                  onClick={toggleShowDimensions}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: 'pointer',
                    background: drawing.showDimensions ? tokens.colors.brand.purple : tokens.colors.background.primary,
                    color: drawing.showDimensions ? tokens.colors.background.primary : tokens.colors.neutral[900],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 14H3l1.5-2h15z"></path>
                    <path d="M21 19H3l1.5-2h15z"></path>
                    <path d="M21 9H3l1.5-2h15z"></path>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Dimensions</span>
                </button>
                <button
                  onClick={() => {
                    // Toggle cursor rotation mode on/off
                    if (drawing.cursorRotationMode) {
                      // Exit cursor rotation mode (confirm rotation)
                      exitCursorRotationMode(false);
                    } else {
                      // MULTI-SELECTION FIX: Support rotation for multi-selection and text
                      const hasSelection = selectedShapeId || (selectedShapeIds && selectedShapeIds.length > 0) || selectedTextId;
                      if (hasSelection && activeTool === 'select' && !drawing.isEditMode) {
                        // Exit resize mode if active
                        if (drawing.isResizeMode) {
                          exitResizeMode();
                        }
                        // Enter cursor rotation mode with primary shape, first selected shape, or selected text
                        const targetShapeId = selectedShapeId || (selectedShapeIds && selectedShapeIds[0]) || selectedTextId || '';
                        enterCursorRotationMode(targetShapeId);
                      }
                    }
                  }}
                  disabled={
                    (!selectedShapeId && (!selectedShapeIds || selectedShapeIds.length === 0) && !selectedTextId) ||
                    activeTool !== 'select' ||
                    drawing.isEditMode ||
                    drawing.isDrawing
                  }
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: (
                      (!selectedShapeId && (!selectedShapeIds || selectedShapeIds.length === 0) && !selectedTextId) ||
                      activeTool !== 'select' ||
                      drawing.isEditMode ||
                      drawing.isDrawing
                    )
                      ? 'not-allowed'
                      : 'pointer',
                    background: drawing.cursorRotationMode ? tokens.colors.brand.purple : tokens.colors.background.primary,
                    color: drawing.cursorRotationMode ? tokens.colors.background.primary :
                           (
                             (!selectedShapeId && (!selectedShapeIds || selectedShapeIds.length === 0) && !selectedTextId) ||
                             activeTool !== 'select' ||
                             drawing.isEditMode ||
                             drawing.isDrawing
                           )
                             ? tokens.colors.neutral[400]
                             : tokens.colors.neutral[900],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
                    opacity: (
                      (!selectedShapeId && (!selectedShapeIds || selectedShapeIds.length === 0) && !selectedTextId) ||
                      activeTool !== 'select' ||
                      drawing.isEditMode ||
                      drawing.isDrawing
                    )
                      ? 0.5
                      : 1
                  }}
                  onMouseEnter={(e) => {
                    const hasSelection = selectedShapeId || (selectedShapeIds && selectedShapeIds.length > 0) || selectedTextId;
                    if (hasSelection && activeTool === 'select' && !drawing.isEditMode && !drawing.isDrawing && !drawing.cursorRotationMode) {
                      e.currentTarget.style.background = tokens.colors.neutral[100];
                      e.currentTarget.style.borderColor = tokens.colors.neutral[300];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!drawing.cursorRotationMode) {
                      e.currentTarget.style.background = tokens.colors.background.primary;
                      e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 0 1-9 9c-4.97 0-9-4.03-9-9s4.03-9 9-9"></path>
                    <path d="M12 3l3 3-3 3"></path>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Rotate</span>
                </button>
                <div style={{ marginLeft: tokens.spacing[2] }}>
                  <FlipButton
                    disabled={selectedShapeIds.length === 0 || drawing.isEditMode}
                    onFlip={(direction) => flipSelectedShapes(direction)}
                  />
                </div>
                <div style={{ marginLeft: tokens.spacing[2] }}>
                  <ExportButton />
                </div>
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
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: 'pointer',
                    background: tokens.colors.background.primary,
                    color: tokens.colors.semantic.error,
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${tokens.colors.semantic.error}10`;
                    e.currentTarget.style.borderColor = `${tokens.colors.semantic.error}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tokens.colors.background.primary;
                    e.currentTarget.style.borderColor = tokens.colors.neutral[200];
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
                  <span style={{ marginTop: tokens.spacing[1] }}>Clear All</span>
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
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: selectedShapeId ? 'pointer' : 'not-allowed',
                    background: (drawing.isEditMode && drawing.editingShapeId === selectedShapeId)
                      ? `${tokens.colors.semantic.info}20`
                      : selectedShapeId ? tokens.colors.background.primary : tokens.colors.neutral[50],
                    color: (drawing.isEditMode && drawing.editingShapeId === selectedShapeId)
                      ? tokens.colors.semantic.info
                      : selectedShapeId ? tokens.colors.neutral[900] : tokens.colors.neutral[400],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
                    opacity: selectedShapeId ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (selectedShapeId && !(drawing.isEditMode && drawing.editingShapeId === selectedShapeId)) {
                      e.currentTarget.style.background = tokens.colors.neutral[100];
                      e.currentTarget.style.borderColor = tokens.colors.neutral[300];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedShapeId && !(drawing.isEditMode && drawing.editingShapeId === selectedShapeId)) {
                      e.currentTarget.style.background = tokens.colors.background.primary;
                      e.currentTarget.style.borderColor = tokens.colors.neutral[200];
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
                  <span style={{ marginTop: tokens.spacing[1] }}>
                    {(drawing.isEditMode && drawing.editingShapeId === selectedShapeId) ? 'Exit Edit' : 'Edit'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    // Check selectedShapeIds first (for groups), fallback to selectedShapeId
                    const targetId = selectedShapeIds && selectedShapeIds.length > 0
                      ? selectedShapeIds[0]
                      : selectedShapeId;

                    if (targetId) {
                      deleteShape(targetId);
                    } else if (drawing.measurement?.selectedMeasurementId) {
                      deleteMeasurement(drawing.measurement.selectedMeasurementId);
                    }
                  }}
                  disabled={!selectedShapeId && !selectedShapeIds?.length && !drawing.measurement?.selectedMeasurementId}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: (selectedShapeId || drawing.measurement?.selectedMeasurementId) ? 'pointer' : 'not-allowed',
                    background: (selectedShapeId || drawing.measurement?.selectedMeasurementId) ? tokens.colors.background.primary : tokens.colors.neutral[50],
                    color: (selectedShapeId || drawing.measurement?.selectedMeasurementId) ? tokens.colors.semantic.error : tokens.colors.neutral[400],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
                    opacity: (selectedShapeId || drawing.measurement?.selectedMeasurementId) ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (selectedShapeId || drawing.measurement?.selectedMeasurementId) {
                      e.currentTarget.style.background = `${tokens.colors.semantic.error}10`;
                      e.currentTarget.style.borderColor = `${tokens.colors.semantic.error}40`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedShapeId || drawing.measurement?.selectedMeasurementId) {
                      e.currentTarget.style.background = tokens.colors.background.primary;
                      e.currentTarget.style.borderColor = tokens.colors.neutral[200];
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
                  <span style={{ marginTop: tokens.spacing[1] }}>Delete</span>
                </button>
                <button
                  onClick={undo}
                  disabled={!canUndo()}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: canUndo() ? 'pointer' : 'not-allowed',
                    background: canUndo() ? tokens.colors.background.primary : tokens.colors.neutral[50],
                    color: canUndo() ? tokens.colors.neutral[900] : tokens.colors.neutral[400],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
                    opacity: canUndo() ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (canUndo()) {
                      e.currentTarget.style.background = tokens.colors.neutral[100];
                      e.currentTarget.style.borderColor = tokens.colors.neutral[300];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canUndo()) {
                      e.currentTarget.style.background = tokens.colors.background.primary;
                      e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                    }
                  }}
                  title={canUndo() ? 'Undo last action (Ctrl+Z)' : 'Nothing to undo'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7v6h6"></path>
                    <path d="m21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Undo</span>
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo()}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: canRedo() ? 'pointer' : 'not-allowed',
                    background: canRedo() ? tokens.colors.background.primary : tokens.colors.neutral[50],
                    color: canRedo() ? tokens.colors.neutral[900] : tokens.colors.neutral[400],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
                    opacity: canRedo() ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (canRedo()) {
                      e.currentTarget.style.background = tokens.colors.neutral[100];
                      e.currentTarget.style.borderColor = tokens.colors.neutral[300];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canRedo()) {
                      e.currentTarget.style.background = tokens.colors.background.primary;
                      e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                    }
                  }}
                  title={canRedo() ? 'Redo last undone action (Ctrl+Y)' : 'Nothing to redo'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m21 7-6 6h6V7z"></path>
                    <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Redo</span>
                </button>
              </div>
            </div>

            {/* Corner Controls */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: tokens.typography.caption.size,
                fontWeight: tokens.typography.label.weight,
                color: tokens.colors.neutral[500],
                marginBottom: tokens.spacing[1],
                textAlign: 'center'
              }}>Corner Controls</div>
              <div style={{ display: 'flex', gap: tokens.spacing[0.5] }}>
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
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? 'pointer' : 'not-allowed',
                    background: tokens.colors.background.primary,
                    color: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? tokens.colors.neutral[900] : tokens.colors.neutral[400],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
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
                  <span style={{ marginTop: tokens.spacing[1] }}>Add Corner</span>
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
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? 'pointer' : 'not-allowed',
                    background: tokens.colors.background.primary,
                    color: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? tokens.colors.semantic.error : tokens.colors.neutral[400],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight,
                    opacity: (drawing.isEditMode && drawing.selectedCornerIndex !== null) ? 1 : 0.5
                  }}
                  title={drawing.isEditMode ? (drawing.selectedCornerIndex !== null ? 'Delete Selected Corner' : 'Select a corner to delete') : 'Enter Edit Mode first'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Delete Corner</span>
                </button>
              </div>
            </div>

            {/* Vertical Separator */}
            <div style={{
              width: tokens.sizing.separator,
              height: tokens.sizing.separatorHeight,
              background: tokens.colors.neutral[200],
              margin: `0 ${tokens.spacing[1]}`
            }}></div>

            {/* Import */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: tokens.typography.caption.size,
                fontWeight: tokens.typography.label.weight,
                color: tokens.colors.neutral[500],
                marginBottom: tokens.spacing[2],
                textAlign: 'center'
              }}>Import</div>
              <div style={{ display: 'flex', gap: tokens.spacing[0.5] }}>
                <button
                  onClick={() => setImageImportOpen(true)}
                  title="Import Plan (I)"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: 'pointer',
                    background: tokens.colors.background.primary,
                    color: tokens.colors.neutral[900],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tokens.colors.background.primary;
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Import Plan</span>
                </button>
                <button
                  onClick={() => setBoundaryDetectionOpen(true)}
                  title="Auto-Detect Boundaries"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: 'pointer',
                    background: tokens.colors.background.primary,
                    color: tokens.colors.neutral[900],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tokens.colors.background.primary;
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                    <path d="M11 8v6"></path>
                    <path d="M8 11h6"></path>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Auto-Detect</span>
                </button>
              </div>
            </div>

            {/* Vertical Separator */}
            <div style={{
              width: tokens.sizing.separator,
              height: tokens.sizing.separatorHeight,
              background: tokens.colors.neutral[200],
              margin: `0 ${tokens.spacing[1]}`
            }}></div>

            {/* Templates */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: tokens.typography.caption.size,
                fontWeight: tokens.typography.label.weight,
                color: tokens.colors.neutral[500],
                marginBottom: tokens.spacing[2],
                textAlign: 'center'
              }}>Templates</div>
              <div style={{ display: 'flex', gap: tokens.spacing[0.5] }}>
                <button
                  onClick={() => useTemplateStore.getState().openGallery()}
                  title="Browse Templates (Ctrl+Shift+T)"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: 'pointer',
                    background: tokens.colors.background.primary,
                    color: tokens.colors.neutral[900],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tokens.colors.background.primary;
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Gallery</span>
                </button>

                <button
                  onClick={() => useTemplateStore.getState().openSaveDialog()}
                  title="Save as Template"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.radius.sm,
                    minWidth: tokens.sizing.buttonMinWidth,
                    height: tokens.sizing.buttonHeight,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    cursor: 'pointer',
                    background: tokens.colors.background.primary,
                    color: tokens.colors.neutral[900],
                    transition: `all ${tokens.animation.timing.smooth} ease`,
                    fontSize: tokens.typography.caption.size,
                    fontWeight: tokens.typography.label.weight
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tokens.colors.background.primary;
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  <span style={{ marginTop: tokens.spacing[1] }}>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left Sidebar - Fixed width */}
        <div style={{
          width: tokens.sizing.iconButton,
          background: tokens.colors.background.primary,
          borderRight: `1px solid ${tokens.colors.neutral[200]}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10
        }}>

          {/* Main Navigation Section */}
          <div style={{
            width: tokens.sizing.iconButton,
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}>
            <div style={{
              padding: '16px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: tokens.spacing[2],
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
                padding: tokens.spacing[2],
                borderRadius: tokens.radius.md,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: tokens.spacing[1],
                width: '100%',
                textAlign: 'center',
                transition: `all ${tokens.animation.timing.smooth} ease`,
                color: tokens.colors.neutral[700]
              }}
              title="Home"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = tokens.colors.neutral[100];
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
              >
                <Icon name="home" size={20} color={tokens.colors.neutral[900]} />
                <span style={{
                  fontSize: tokens.typography.caption.size,
                  fontWeight: tokens.typography.label.weight,
                  color: tokens.colors.neutral[700],
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
                  padding: tokens.spacing[2],
                  borderRadius: tokens.radius.md,
                  background: comparisonExpanded ? tokens.colors.semantic.info : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: tokens.spacing[1],
                  width: '100%',
                  textAlign: 'center',
                  transition: `all ${tokens.animation.timing.smooth} ease`,
                  color: comparisonExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700]
                }}
                title="Compare your land to familiar reference objects"
                onMouseEnter={(e) => {
                  if (!comparisonExpanded) {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={comparisonExpanded ? tokens.colors.background.primary : 'currentColor'} strokeWidth="2">
                  <rect x="2" y="2" width="9" height="9"></rect>
                  <rect x="13" y="2" width="9" height="9"></rect>
                  <rect x="2" y="13" width="9" height="9"></rect>
                  <rect x="13" y="13" width="9" height="9"></rect>
                </svg>
                <span style={{
                  fontSize: tokens.typography.caption.size,
                  fontWeight: tokens.typography.label.weight,
                  color: comparisonExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700],
                  lineHeight: '1'
                }}>
                  Compare
                </span>
              </button>

              <button style={{
                padding: leftPanelExpanded ? '12px 16px' : '8px',
                borderRadius: tokens.radius.md,
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: tokens.spacing[1],
                width: '100%',
                textAlign: 'center',
                transition: `all ${tokens.animation.timing.smooth} ease`,
                color: tokens.colors.neutral[700]
              }} 
              title="Visual Comparison"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = tokens.colors.neutral[100];
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
              >
                <Icon name="visualComparison" size={20} color={tokens.colors.neutral[900]} />
                <span style={{ 
                  fontSize: tokens.typography.caption.size, 
                  fontWeight: tokens.typography.label.weight, 
                  color: tokens.colors.neutral[700],
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
                  padding: tokens.spacing[2],
                  borderRadius: tokens.radius.md,
                  background: convertExpanded ? tokens.colors.semantic.info : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: tokens.spacing[1],
                  width: '100%',
                  textAlign: 'center',
                  transition: `all ${tokens.animation.timing.smooth} ease`,
                  color: convertExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700]
                }}
                title="Unit Converter"
                onMouseEnter={(e) => {
                  if (!convertExpanded) {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
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
                <Icon name="unitConverter" size={20} color={convertExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]} />
                <span style={{
                  fontSize: tokens.typography.caption.size,
                  fontWeight: tokens.typography.label.weight,
                  color: convertExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700],
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
                  borderRadius: tokens.radius.md,
                  background: toolsPanelExpanded ? tokens.colors.semantic.info : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: tokens.spacing[1],
                  width: '100%',
                  textAlign: 'center',
                  transition: `all ${tokens.animation.timing.smooth} ease`,
                  color: toolsPanelExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700]
                }}
                title="Quick Tools"
                onMouseEnter={(e) => {
                  if (!toolsPanelExpanded) {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
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
                <Icon name="quickTools" size={20} color={toolsPanelExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]} />
                <span style={{
                  fontSize: tokens.typography.caption.size,
                  fontWeight: tokens.typography.label.weight,
                  color: toolsPanelExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700],
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
                  padding: tokens.spacing[2], 
                  borderRadius: tokens.radius.md, 
                  background: calculatorExpanded ? tokens.colors.semantic.info : 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: tokens.spacing[1],
                  width: '100%',
                  textAlign: 'center',
                  transition: `all ${tokens.animation.timing.smooth} ease`,
                  color: calculatorExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700]
                }} 
                title="Calculator"
                onMouseEnter={(e) => {
                  if (!calculatorExpanded) {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
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
                <Icon name="calculator" size={20} color={calculatorExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]} />
                <span style={{ 
                  fontSize: tokens.typography.caption.size, 
                  fontWeight: tokens.typography.label.weight, 
                  color: calculatorExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700],
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
                borderRadius: tokens.radius.md, 
                background: layersExpanded ? tokens.colors.semantic.info : 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: tokens.spacing[1],
                width: '100%',
                textAlign: 'center',
                transition: `all ${tokens.animation.timing.smooth} ease`,
                color: layersExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700]
              }} 
              title="Layers"
              onMouseEnter={(e) => {
                if (!layersExpanded) {
                  e.currentTarget.style.background = tokens.colors.neutral[100];
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
              <Icon name="layers" size={20} color={layersExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]} />
              <span style={{ 
                fontSize: leftPanelExpanded ? '12px' : '10px', 
                fontWeight: tokens.typography.label.weight, 
                color: layersExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700],
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
                  padding: tokens.spacing[2],
                  borderRadius: tokens.radius.md,
                  background: tidyUpExpanded ? tokens.colors.semantic.info : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: tokens.spacing[1],
                  width: '100%',
                  textAlign: 'center',
                  transition: `all ${tokens.animation.timing.smooth} ease`,
                  color: tidyUpExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700]
                }}
                title="TidyUp - Organize and distribute shapes automatically"
                onMouseEnter={(e) => {
                  if (!tidyUpExpanded) {
                    e.currentTarget.style.background = tokens.colors.neutral[100];
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tidyUpExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]} strokeWidth="2">
                  <rect x="3" y="3" width="6" height="6" rx="1" stroke={tidyUpExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]}/>
                  <rect x="15" y="3" width="6" height="6" rx="1" stroke={tidyUpExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]}/>
                  <rect x="3" y="15" width="6" height="6" rx="1" stroke={tidyUpExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]}/>
                  <rect x="15" y="15" width="6" height="6" rx="1" stroke={tidyUpExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]}/>
                  <path d="M9 12h6" strokeDasharray="2 2" strokeWidth="2" stroke={tidyUpExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]}/>
                  <path d="M12 9v6" strokeDasharray="2 2" strokeWidth="2" stroke={tidyUpExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]}/>
                </svg>
                <span style={{
                  fontSize: tokens.typography.caption.size,
                  fontWeight: tokens.typography.label.weight,
                  color: tidyUpExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700],
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
            left: tokens.sizing.iconButton,
            top: 0,
            bottom: 0,
            width: tokens.sizing.panelMedium,
            background: tokens.colors.background.primary,
            borderRight: `1px solid ${tokens.colors.neutral[200]}`,
            boxShadow: tokens.shadows.md,
            overflowY: 'auto',
            zIndex: tokens.zIndex.panel
          }}>
            <UIErrorBoundary componentName="CalculatorDemo" showMinimalError={true}>
              <Suspense fallback={<div style={{ padding: tokens.spacing[5], textAlign: 'center', color: tokens.colors.neutral[500] }}>Loading...</div>}>
                <CalculatorDemo
                  inline={true}
                  onClose={() => {
                    setCalculatorExpanded(false);
                    setLeftPanelExpanded(false);
                  }}
                />
              </Suspense>
            </UIErrorBoundary>
          </div>
        )}

        {/* Layers Expansion Panel - Overlay */}
        {layersExpanded && (
          <div style={{
            position: 'absolute',
            left: tokens.sizing.iconButton,
            top: 0,
            bottom: 0,
            width: tokens.sizing.panelMedium,
            background: tokens.colors.background.primary,
            borderRight: `1px solid ${tokens.colors.neutral[200]}`,
            boxShadow: tokens.shadows.md,
            overflowY: 'auto',
            zIndex: tokens.zIndex.panel
          }}>
            <UIErrorBoundary componentName="LayerPanel" showMinimalError={true}>
              <Suspense fallback={<div style={{ padding: tokens.spacing[5], textAlign: 'center', color: tokens.colors.neutral[500] }}>Loading...</div>}>
                <LayerPanel
                  isOpen={true}
                  inline={true}
                  onClose={() => {
                    setLayersExpanded(false);
                    setLeftPanelExpanded(false);
                  }}
                />
              </Suspense>
            </UIErrorBoundary>
          </div>
        )}

        {/* Tools Expansion Panel - Inline */}
        {toolsPanelExpanded && (
          <div style={{
            position: 'absolute',
            left: tokens.sizing.iconButton,
            top: 0,
            bottom: 0,
            width: tokens.sizing.panelMedium,
            background: tokens.colors.background.primary,
            borderRight: `1px solid ${tokens.colors.neutral[200]}`,
            boxShadow: tokens.shadows.md,
            overflowY: 'auto',
            zIndex: tokens.zIndex.panel
          }}>
            <UIErrorBoundary componentName="ToolsPanel" showMinimalError={true}>
              <Suspense fallback={<div style={{ padding: tokens.spacing[5], textAlign: 'center', color: tokens.colors.neutral[500] }}>Loading...</div>}>
                <ToolsPanel
                  isExpanded={true}
                  onClose={() => {
                    setToolsPanelExpanded(false);
                    setLeftPanelExpanded(false);
                  }}
                  inline={true}
                />
              </Suspense>
            </UIErrorBoundary>
          </div>
        )}

        {/* Comparison Expansion Panel - Overlay */}
        {comparisonExpanded && (
          <div style={{
            position: 'absolute',
            left: tokens.sizing.iconButton,
            top: 0,
            bottom: 0,
            width: tokens.sizing.panelMedium,
            background: tokens.colors.background.primary,
            borderRight: `1px solid ${tokens.colors.neutral[200]}`,
            boxShadow: tokens.shadows.md,
            overflowY: 'auto',
            zIndex: tokens.zIndex.panel
          }}>
            <UIErrorBoundary componentName="ComparisonPanel" showMinimalError={true}>
              <Suspense fallback={<div style={{ padding: tokens.spacing[5], textAlign: 'center', color: tokens.colors.neutral[500] }}>Loading...</div>}>
                <ComparisonPanel
                  expanded={true}
                  onToggle={() => {
                    setComparisonExpanded(false);
                    setLeftPanelExpanded(false);
                  }}
                  inline={true}
                />
              </Suspense>
            </UIErrorBoundary>
          </div>
        )}

        {/* Convert Expansion Panel - Overlay */}
        {convertExpanded && (
          <div style={{
            position: 'absolute',
            left: tokens.sizing.iconButton,
            top: 0,
            bottom: 0,
            width: tokens.sizing.panelMedium,
            background: tokens.colors.background.primary,
            borderRight: `1px solid ${tokens.colors.neutral[200]}`,
            boxShadow: tokens.shadows.md,
            overflowY: 'auto',
            zIndex: tokens.zIndex.panel
          }}>
            <UIErrorBoundary componentName="ConvertPanel" showMinimalError={true}>
              <Suspense fallback={<div style={{ padding: tokens.spacing[5], textAlign: 'center', color: tokens.colors.neutral[500] }}>Loading...</div>}>
                <ConvertPanel
                  expanded={true}
                  onToggle={() => {
                    setConvertExpanded(false);
                    setLeftPanelExpanded(false);
                  }}
                  inline={true}
                />
              </Suspense>
            </UIErrorBoundary>
          </div>
        )}

        {/* TidyUp Expansion Panel - Overlay */}
        {tidyUpExpanded && (
          <div style={{
            position: 'absolute',
            left: tokens.sizing.iconButton,
            top: 0,
            bottom: 0,
            width: tokens.sizing.panelMedium,
            background: tokens.colors.background.primary,
            borderRight: `1px solid ${tokens.colors.neutral[200]}`,
            boxShadow: tokens.shadows.md,
            overflowY: 'auto',
            zIndex: tokens.zIndex.panel
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
          background: tokens.colors.semantic.info,
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

          {/* Live distance label for dimension input */}
          <LiveDistanceLabel />

          {/* Status overlay - shows active tool and current measurements */}
          <div style={{
            position: 'absolute',
            bottom: tokens.spacing[4],
            left: `${16 + leftPanelOffset}px`,
            background: isProfessionalMode ? 'rgba(59, 130, 246, 0.95)' : 'rgba(255,255,255,0.95)',
            padding: '12px 16px',
            borderRadius: tokens.radius.md,
            boxShadow: tokens.shadows.lg,
            fontSize: tokens.typography.body.size,
            color: isProfessionalMode ? 'white' : tokens.colors.neutral[700],
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing[3],
            border: isProfessionalMode ? `2px solid ${tokens.colors.semantic.info}` : 'none',
            transition: 'left 0.2s ease'
          }}>
            {isProfessionalMode && (
              <>
                <span style={{ fontSize: tokens.typography.body.size }}>⚡</span>
                <div style={{ width: tokens.sizing.separator, height: tokens.spacing[4], background: 'rgba(255,255,255,0.3)' }}></div>
              </>
            )}
            <span><strong>Tool:</strong> {activeTool}</span>
            <div style={{ width: tokens.sizing.separator, height: tokens.spacing[4], background: isProfessionalMode ? 'rgba(255,255,255,0.3)' : tokens.colors.neutral[300] }}></div>
            <span><strong>Shapes:</strong> {drawing.isDrawing ? 'Drawing...' : `${getShapeCount()} total`}</span>
            <div style={{ width: tokens.sizing.separator, height: tokens.spacing[4], background: isProfessionalMode ? 'rgba(255,255,255,0.3)' : tokens.colors.neutral[300] }}></div>
            <span>
              <strong>Total Area:</strong> {isProfessionalMode ? parseFloat(getTotalArea()).toFixed(4) : getTotalArea()} m²
              {isProfessionalMode && (
                <span style={{ fontSize: tokens.typography.caption.size, marginLeft: '4px', opacity: 0.8 }}>
                  (Survey Grade ±0.01%)
                </span>
              )}
            </span>
            {getShapeCount() > 1 && (
              <>
                <div style={{ width: tokens.sizing.separator, height: tokens.spacing[4], background: isProfessionalMode ? 'rgba(255,255,255,0.3)' : tokens.colors.neutral[300] }}></div>
                <span>
                  <strong>Avg Area:</strong> {isProfessionalMode ? parseFloat(getAverageArea()).toFixed(4) : getAverageArea()} m²
                </span>
              </>
            )}
            {isProfessionalMode && (
              <>
                <div style={{ width: tokens.sizing.separator, height: tokens.spacing[4], background: 'rgba(255,255,255,0.3)' }}></div>
                <span style={{ fontSize: tokens.typography.caption.size, fontWeight: tokens.typography.label.weight }}>PRO MODE</span>
              </>
            )}
          </div>
          
          {/* Coordinate Display */}
          {activeTool !== 'select' && isMouseOver3D && (
            <div style={{
              position: 'absolute',
              bottom: tokens.spacing[20], // Above the status overlay
              left: `${16 + leftPanelOffset}px`,
              display: 'flex',
              gap: tokens.spacing[3],
              alignItems: 'flex-start',
              zIndex: 100,
              transition: 'left 0.2s ease'
            }}>
              {/* Mouse Position Display */}
              <div style={{
                background: 'rgba(30, 30, 30, 0.95)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: tokens.radius.md,
                fontSize: tokens.typography.bodySmall.size,
                fontWeight: tokens.typography.label.weight,
                boxShadow: tokens.shadows.lg,
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                minWidth: tokens.sizing.elementMedium
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2], marginBottom: tokens.spacing[1] }}>
                  <span style={{ fontSize: tokens.typography.body.size }}>📍</span>
                  <span style={{ fontWeight: tokens.typography.label.weight }}>Mouse Position</span>
                </div>
                <div style={{ fontSize: tokens.typography.caption.size, opacity: 0.9 }}>
                  <div>X: {mousePosition.x.toFixed(1)}m, Z: {mousePosition.y.toFixed(1)}m</div>
                  <div style={{ fontSize: tokens.typography.caption.size, opacity: 0.7, marginTop: '2px' /* 2px - consider adding tokens.spacing[0] = '2px' */ }}>
                    Grid: {drawing.snapping?.config?.activeTypes?.has?.('grid') ? `${drawing.gridSize}m snap` : 'Free move'} 
                    {drawing.snapping?.config?.activeTypes?.has?.('grid') && <span style={{ color: tokens.colors.semantic.success, marginLeft: tokens.spacing[1] }}>📍</span>}
                  </div>
                </div>
              </div>

              {/* Current Dimensions Display - Show when drawing tools are active */}
              {(currentDimensions || (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'polyline')) && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.95)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: tokens.radius.md,
                  fontSize: tokens.typography.bodySmall.size,
                  fontWeight: tokens.typography.label.weight,
                  boxShadow: tokens.shadows.info,
                  border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  minWidth: tokens.sizing.elementMedium
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2], marginBottom: tokens.spacing[1] }}>
                    <Icon name="ruler" size={14} />
                    <span style={{ fontWeight: tokens.typography.label.weight }}>Dimensions</span>
                  </div>
                  
                  {currentDimensions ? (
                    <div style={{ fontSize: tokens.typography.caption.size, opacity: 0.9 }}>
                      {/* Rectangle dimensions */}
                      {currentDimensions.width !== undefined && currentDimensions.height !== undefined && currentDimensions.radius === undefined && (
                        <div>
                          <div style={{ fontWeight: tokens.typography.label.weight, marginBottom: '2px' }}>
                            {currentDimensions.width.toFixed(1)}m × {currentDimensions.height.toFixed(1)}m
                          </div>
                          {currentDimensions.area !== undefined && (
                            <div style={{ fontSize: tokens.typography.caption.size, opacity: 0.7 }}>
                              Area: {currentDimensions.area.toFixed(1)} m²
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Circle dimensions */}
                      {currentDimensions.radius !== undefined && (
                        <div>
                          <div style={{ fontWeight: tokens.typography.label.weight, marginBottom: '2px' }}>
                            Radius: {currentDimensions.radius.toFixed(1)}m
                          </div>
                          {currentDimensions.area !== undefined && (
                            <div style={{ fontSize: tokens.typography.caption.size, opacity: 0.7 }}>
                              Area: {currentDimensions.area.toFixed(1)} m²
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: tokens.typography.caption.size, opacity: 0.7 }}>
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
          width: tokens.sizing.iconButton,
          background: tokens.colors.background.primary,
          borderLeft: `1px solid ${tokens.colors.neutral[200]}`,
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
            gap: tokens.spacing[2],
            paddingLeft: '0',
            paddingRight: '0',
            flex: 1
          }}>
            <button style={{
              padding: tokens.spacing[2],
              borderRadius: tokens.radius.md,
              background: drawing.snapToGrid ? `${tokens.colors.semantic.info}20` : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: tokens.typography.caption.size,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: tokens.spacing[1],
              width: '100%',
              textAlign: 'center',
              justifyContent: 'center',
              transition: `all ${tokens.animation.timing.smooth} ease`,
              color: drawing.snapToGrid ? tokens.colors.semantic.info : tokens.colors.neutral[700],
              fontWeight: tokens.typography.label.weight
            }}
            title="Toggle Grid Snapping"
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
            onMouseEnter={(e) => {
              if (!drawing.snapToGrid) {
                e.currentTarget.style.background = tokens.colors.neutral[100];
              }
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              if (!drawing.snapToGrid) {
                e.currentTarget.style.background = 'transparent';
              } else {
                e.currentTarget.style.background = `${tokens.colors.semantic.info}20`;
              }
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span style={{ fontWeight: tokens.typography.label.weight }}>Grid</span>
            </button>

            <button style={{
              padding: tokens.spacing[2],
              borderRadius: tokens.radius.md,
              background: ['endpoint', 'midpoint', 'center'].some(type =>
                drawing.snapping?.config?.activeTypes?.has?.(type)
              ) ? `${tokens.colors.semantic.success}20` : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: tokens.typography.caption.size,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: tokens.spacing[1],
              width: '100%',
              textAlign: 'center',
              justifyContent: 'center',
              transition: `all ${tokens.animation.timing.smooth} ease`,
              color: ['endpoint', 'midpoint', 'center'].some(type =>
                drawing.snapping?.config?.activeTypes?.has?.(type)
              ) ? tokens.colors.semantic.success : tokens.colors.neutral[700],
              fontWeight: tokens.typography.label.weight
            }}
            title="Toggle Shape Snapping (corners, midpoints, centers)"
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
            onMouseEnter={(e) => {
              if (!['endpoint', 'midpoint', 'center'].some(type =>
                drawing.snapping?.config?.activeTypes?.has?.(type)
              )) {
                e.currentTarget.style.background = tokens.colors.neutral[100];
              }
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              if (!['endpoint', 'midpoint', 'center'].some(type =>
                drawing.snapping?.config?.activeTypes?.has?.(type)
              )) {
                e.currentTarget.style.background = 'transparent';
              } else {
                e.currentTarget.style.background = `${tokens.colors.semantic.success}20`;
              }
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="8"></circle>
                <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
                <circle cx="12" cy="4" r="2" fill="currentColor"></circle>
                <circle cx="12" cy="20" r="2" fill="currentColor"></circle>
                <circle cx="4" cy="12" r="2" fill="currentColor"></circle>
                <circle cx="20" cy="12" r="2" fill="currentColor"></circle>
              </svg>
              <span style={{ fontWeight: tokens.typography.label.weight }}>Snap</span>
            </button>

            <button style={{
              padding: tokens.spacing[2],
              borderRadius: tokens.radius.md,
              background: `${tokens.colors.semantic.info}10`,
              border: 'none',
              cursor: 'pointer',
              fontSize: tokens.typography.caption.size,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: tokens.spacing[1],
              width: '100%',
              textAlign: 'center',
              justifyContent: 'center',
              transition: `all ${tokens.animation.timing.smooth} ease`,
              color: tokens.colors.semantic.info,
              fontWeight: tokens.typography.label.weight
            }}
            title="Smart Align - Canva-style alignment system (Always Active)"
            onClick={() => {
              // Show alignment help modal
              setSmartAlignHelpOpen(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${tokens.colors.semantic.info}20`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${tokens.colors.semantic.info}10`;
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="6" width="4" height="4" fill="currentColor" opacity="0.3"></rect>
                <rect x="14" y="6" width="4" height="4" fill="currentColor" opacity="0.3"></rect>
                <line x1="8" y1="3" x2="8" y2="21" strokeDasharray="3 2" stroke={tokens.colors.brand.purple} strokeWidth="1.5"></line>
                <line x1="16" y1="3" x2="16" y2="21" strokeDasharray="3 2" stroke={tokens.colors.brand.purple} strokeWidth="1.5"></line>
                <circle cx="12" cy="14" r="2" fill={tokens.colors.brand.purple} opacity="0.8"></circle>
              </svg>
              <span style={{ fontWeight: tokens.typography.label.weight }}>Smart Align</span>
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
                padding: tokens.spacing[2], 
                borderRadius: tokens.radius.md, 
                background: propertiesExpanded ? tokens.colors.semantic.info : 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: tokens.typography.caption.size,
                color: propertiesExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700],
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: tokens.spacing[1],
                width: '100%',
                textAlign: 'center',
                justifyContent: 'center',
                transition: `all ${tokens.animation.timing.smooth} ease`,
                fontWeight: tokens.typography.label.weight
              }} 
              title="Properties"
              onMouseEnter={(e) => {
                if (!propertiesExpanded) {
                  e.currentTarget.style.background = tokens.colors.neutral[100];
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
              <Icon name="properties" size={20} color={propertiesExpanded ? tokens.colors.background.primary : tokens.colors.neutral[900]} />
              <span style={{ fontWeight: tokens.typography.label.weight, color: propertiesExpanded ? tokens.colors.background.primary : tokens.colors.neutral[700] }}>Properties</span>
            </button>

            {/* Reset Camera Button */}
            <button
              onClick={() => {
                if (sceneManagerRef.current?.cameraController?.current) {
                  sceneManagerRef.current.cameraController.current.resetCamera(1000);
                }
              }}
              style={{
                padding: tokens.spacing[2],
                borderRadius: tokens.radius.md,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: tokens.typography.caption.size,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: tokens.spacing[1],
                width: '100%',
                textAlign: 'center',
                justifyContent: 'center',
                transition: `all ${tokens.animation.timing.smooth} ease`,
                color: tokens.colors.neutral[700],
                fontWeight: tokens.typography.label.weight
              }}
              title="Reset Camera View (Shortcut: 0)"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = tokens.colors.neutral[100];
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              <span style={{ fontWeight: tokens.typography.label.weight, color: tokens.colors.neutral[700] }}>Reset View</span>
            </button>
          </div>

        </div>


        {/* Properties Panel - Inline */}
        {propertiesExpanded && (
          <div style={{
            position: 'absolute',
            right: tokens.sizing.iconButton,
            top: 0,
            bottom: 0,
            width: tokens.sizing.panelSmall,
            background: tokens.colors.background.primary,
            borderLeft: `1px solid ${tokens.colors.neutral[200]}`,
            boxShadow: tokens.shadows.md,
            overflowY: 'auto',
            zIndex: tokens.zIndex.panel
          }}>
            <UIErrorBoundary componentName="PropertiesPanel" showMinimalError={true}>
              <Suspense fallback={<div style={{ padding: tokens.spacing[5], textAlign: 'center', color: tokens.colors.neutral[500] }}>Loading...</div>}>
                <PropertiesPanel
                  isOpen={true}
                  onClose={() => {
                    setPropertiesExpanded(false);
                    setRightPanelExpanded(false);
                  }}
                />
              </Suspense>
            </UIErrorBoundary>
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

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
        onExport={handlePDFExport}
      />

      <PresetsModal
        isOpen={presets.presetsModal.isOpen}
        onClose={closePresetsModal}
        onSelectPreset={createShapeFromPreset}
        onCustomizePreset={customizePreset}
        customPresets={presets.customPresets}
        recentPresets={presets.recentPresets}
      />

      {/* Text Modal removed - now using Canva-style inline editing */}
      {/* See InlineTextEditor in TextRenderer and TextFormattingControls in PropertiesPanel */}

      {/* Phase 5: Label Modal for shape labels (still uses modal for advanced editing) */}
      <TextModal
        isOpen={labelModalOpen}
        onClose={() => {
          setLabelModalOpen(false);
          setLabelShapeId(null);
          setLabelPosition(null);
          setEditingLabel(undefined);
        }}
        onSave={handleLabelModalSave}
        initialData={editingLabel}
        mode={editingLabel ? 'edit' : 'create'}
        isLabel={true}
      />

      {/* Inline Text Overlay - shown when inline editing is active */}
      {isInlineEditing && inlineEditingTextId && inlineEditScreenPosition && (
        <InlineTextOverlay position={inlineEditScreenPosition} />
      )}

      {/* Floating 2D/3D Toggle Button */}
      <View2DToggleButton />

      {/* Generate 3D World Button - Test fence rendering with drawn shapes */}
      <Generate3DWorldButton />

      {/* Minimap - Only shown in walkthrough mode */}
      {viewState?.viewMode === '3d-walkthrough' && <Minimap />}

      {/* Walkthrough Click Prompt - Shows when entering walkthrough but pointer not locked */}
      {viewState?.viewMode === '3d-walkthrough' && !viewState.walkthroughState?.pointerLocked && (
        <WalkthroughClickPrompt />
      )}

      {/* Walkthrough Controls Overlay - Shows instructions in walkthrough mode */}
      <WalkthroughControlsOverlay />

      {/* Phase 2: Boundary collision visual feedback */}
      {viewState?.viewMode === '3d-walkthrough' && <BoundaryCollisionFeedback />}

      {/* Phase 3: AI Texture panel in walkthrough mode */}
      {viewState?.viewMode === '3d-walkthrough' && <WalkthroughTexturePanel />}

      {/* Walkthrough Sky Settings Panel */}
      {viewState?.viewMode === '3d-walkthrough' && <WalkthroughSkyPanel />}

      {/* Walkthrough Accessibility Settings - Comfort and speed controls */}
      <WalkthroughAccessibilityPanel />

      {/* Floating Help Button */}
      <ShortcutsHelpButton onClick={() => setShortcutHelpOpen(true)} />

      {/* Keyboard Shortcut Help Overlay */}
      <KeyboardShortcutHelp
        isOpen={shortcutHelpOpen}
        onClose={() => setShortcutHelpOpen(false)}
      />

      {/* Context Menu */}
      <ContextMenu />

      {/* Template Gallery Modal */}
      <Suspense fallback={null}>
        <TemplateGalleryModal />
      </Suspense>

      {/* Save Template Dialog */}
      <SaveTemplateDialog />

      {/* Image Import Modal */}
      <Suspense fallback={null}>
        <ImageImporterModal
          isOpen={imageImportOpen}
          onClose={() => setImageImportOpen(false)}
        />
      </Suspense>

      {/* Boundary Detection Modal */}
      <Suspense fallback={null}>
        <BoundaryDetectionModal
          isOpen={boundaryDetectionOpen}
          onClose={() => setBoundaryDetectionOpen(false)}
          onImport={async (boundaries, scale) => {
            // Import detected boundaries as shapes
            const { boundariesToShapes } = await import('./services/boundaryDetection/coordinateUtils');

            // Get detection result metadata (image dimensions)
            const imageWidth = boundaries[0]?.originalPoints?.[0]?.[0] ?
              Math.max(...boundaries.flatMap(b => b.points.map(p => p[0]))) : 2000;
            const imageHeight = boundaries[0]?.originalPoints?.[0]?.[1] ?
              Math.max(...boundaries.flatMap(b => b.points.map(p => p[1]))) : 2000;

            // Convert boundaries to shapes
            const newShapes = boundariesToShapes(boundaries, imageWidth, imageHeight, scale);

            // Add shapes to scene
            useAppStore.setState(state => ({
              shapes: [...state.shapes, ...newShapes]
            }));

            // Save to history
            useAppStore.getState().saveToHistory();

            // Show success toast
            showToast('success', `Imported ${newShapes.length} boundaries successfully!`);

            // Close modal
            setBoundaryDetectionOpen(false);
          }}
          onGenerate3DWorld={async (boundaries, scale, config) => {
            // Phase 1: Generate 3D walkable world from detected boundaries
            const { boundariesToShapes } = await import('./services/boundaryDetection/coordinateUtils');

            // Get detection result metadata (image dimensions)
            const imageWidth = boundaries[0]?.originalPoints?.[0]?.[0] ?
              Math.max(...boundaries.flatMap(b => b.points.map(p => p[0]))) : 2000;
            const imageHeight = boundaries[0]?.originalPoints?.[0]?.[1] ?
              Math.max(...boundaries.flatMap(b => b.points.map(p => p[1]))) : 2000;

            // Convert boundaries to shapes first (for 2D/3D orbit view)
            const newShapes = boundariesToShapes(boundaries, imageWidth, imageHeight, scale);

            // Add shapes to scene
            useAppStore.setState(state => ({
              shapes: [...state.shapes, ...newShapes]
            }));

            // Calculate perimeter for each boundary
            const calculatePerimeter = (points: Array<{ x: number; y: number }>) => {
              let perimeter = 0;
              for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                perimeter += Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
              }
              return perimeter;
            };

            // Create walkable boundaries from the detected boundaries
            const store = useAppStore.getState();
            const addWalkableBoundary = store.addWalkableBoundary;

            // Convert each boundary to a walkable area
            newShapes.forEach((shape, index) => {
              const points = shape.points.map(p => ({ x: p.x, y: p.y }));

              // Calculate area using shoelace formula
              let area = 0;
              for (let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length;
                area += points[i].x * points[j].y;
                area -= points[j].x * points[i].y;
              }
              area = Math.abs(area) / 2;

              addWalkableBoundary({
                points,
                area,
                perimeter: calculatePerimeter(points),
                terrainType: config.terrainType,
                fenceStyle: config.fenceStyle,
                fenceHeight: config.fenceHeight,
                enableAITexture: false,
                sourceDetectedBoundaryId: boundaries[index]?.id,
              });
            });

            // Save to history
            useAppStore.getState().saveToHistory();

            // Auto-enter walkthrough mode
            useAppStore.setState(state => ({
              viewState: {
                ...state.viewState,
                viewMode: '3d-walkthrough',
                is2DMode: false,
              }
            }));

            // Show success toast
            showToast('success', `Generated 3D world with ${newShapes.length} walkable areas! Use WASD to explore.`);

            // Close modal
            setBoundaryDetectionOpen(false);
          }}
        />
      </Suspense>

      {/* Phase 2: Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Phase 2: Loading Overlay for Exports */}
      {isExporting && (
        <LoadingOverlay
          message={`Exporting to ${exportingFormat}...`}
          fullScreen
        />
      )}

      {/* Phase 2: Smart Align Help Modal */}
      <HelpModal
        isOpen={smartAlignHelpOpen}
        onClose={() => setSmartAlignHelpOpen(false)}
        title="Smart Align Guide"
        icon="align"
        content={`Smart Align is always active!

Canva-style alignment guides will appear automatically when you drag shapes near each other:

• Purple dashed lines for edge & center alignment
• Purple badges showing spacing distances
• No configuration needed - just drag and align!

The system helps you create perfectly aligned designs with minimal effort.`}
      />
    </div>
  );
}

export default App;