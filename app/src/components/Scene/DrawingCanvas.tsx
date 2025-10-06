import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { useThree, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Vector2, Vector3, type Mesh } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { useDimensionStore } from '@/store/useDimensionStore';
import type { Point2D } from '@/types';
import { RaycastManager } from '../../utils/RaycastManager';
import { SnapGrid } from '../../utils/SnapGrid';
import { alignmentService } from '../../services/alignmentService';
import { useAdaptiveSnapRadius } from '../../hooks/useAdaptiveSnapRadius';
import { parseDimension, convertToMeters } from '@/services/dimensionParser';

interface DrawingCanvasProps {
  onCoordinateChange?: (worldPos: Point2D, screenPos: Point2D) => void;
  gridSnap?: boolean;
  gridSize?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onCoordinateChange,
  gridSnap = true,
  gridSize = 2,
}) => {
  const { camera, gl } = useThree();
  const planeRef = useRef<Mesh>(null);
  
  // Performance-optimized managers
  const raycastManager = useRef(new RaycastManager());
  const snapGrid = useRef(new SnapGrid(gridSize * 5, gridSize * 1.5));

  // PERFORMANCE FIX: RAF throttling for alignment detection
  const alignmentRafRef = useRef<number | null>(null);

  // Cached vectors for performance
  const mousePosition = useRef(new Vector2());
  const worldPosition = useRef(new Vector3());
  const lastValidPosition = useRef<Point2D>({ x: 0, y: 0 });
  
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);
  const currentShape = useAppStore(state => state.drawing.currentShape);
  const shapes = useAppStore(state => state.shapes);
  const snapConfig = useAppStore(state => state.drawing.snapping?.config);
  const snapMode = useAppStore(state => state.drawing.snapping?.config?.mode || 'adaptive');
  const screenSpacePixels = useAppStore(state => state.drawing.snapping?.config?.screenSpacePixels || 75);

  // Note: Measurement and line tool state is accessed via useAppStore.getState() in callbacks
  // to avoid stale closures. Do not create selectors here.

  const startDrawing = useAppStore(state => state.startDrawing);
  const addPoint = useAppStore(state => state.addPoint);
  const finishDrawing = useAppStore(state => state.finishDrawing);
  const cancelDrawing = useAppStore(state => state.cancelDrawing);
  const selectShape = useAppStore(state => state.selectShape);
  const clearSelection = useAppStore(state => state.clearSelection);
  const hoverShape = useAppStore(state => state.hoverShape);
  const exitRotateMode = useAppStore(state => state.exitRotateMode);

  // Measurement actions
  const startMeasurement = useAppStore(state => state.startMeasurement);
  const updateMeasurementPreview = useAppStore(state => state.updateMeasurementPreview);
  const completeMeasurement = useAppStore(state => state.completeMeasurement);
  const cancelMeasurement = useAppStore(state => state.cancelMeasurement);

  // Line tool actions
  const startLineDrawing = useAppStore(state => state.startLineDrawing);
  const updateLinePreview = useAppStore(state => state.updateLinePreview);
  const showDistanceInput = useAppStore(state => state.showDistanceInput);
  const cancelLineDrawing = useAppStore(state => state.cancelLineDrawing);

  // Cursor position tracking
  const setCursorPosition = useAppStore(state => state.setCursorPosition);

  // Get the entire store for updating state
  const store = useAppStore;

  // Track cursor world position for adaptive snap radius
  const [cursorWorldPos, setCursorWorldPos] = useState<Vector3 | null>(null);

  // Use adaptive snap radius hook
  useAdaptiveSnapRadius({
    enabled: snapMode === 'adaptive',
    screenSpacePixels,
    cursorWorldPosition: cursorWorldPos
  });

  // This old function has been removed - using the optimized version below

  // PERFORMANCE FIX: RAF-throttled alignment detection function
  const performAlignmentDetection = useCallback((worldPos2D: Point2D) => {
    const alignmentConfig = useAppStore.getState().drawing.alignment?.config;

    if (!alignmentConfig?.enabled) return;

    // Cancel any pending alignment detection
    if (alignmentRafRef.current !== null) {
      cancelAnimationFrame(alignmentRafRef.current);
    }

    // Schedule alignment detection on next animation frame (60fps throttle)
    alignmentRafRef.current = requestAnimationFrame(() => {
      alignmentRafRef.current = null;

      // Create a temporary shape at the current cursor position for alignment detection
      let tempShape;
      if (currentShape) {
        // During drawing mode
        tempShape = {
          ...currentShape,
          points: currentShape.points ? [...currentShape.points, worldPos2D] : [worldPos2D],
          id: 'temp_drawing_shape'
        };
      } else {
        // When no shape is being drawn, create a small cursor shape for alignment detection
        tempShape = {
          id: 'temp_cursor_shape',
          name: 'Cursor',
          type: 'circle' as const,
          color: '#3b82f6',
          visible: true,
          layerId: 'main',
          created: new Date(),
          modified: new Date(),
          points: [
            worldPos2D, // Center point
            { x: worldPos2D.x + 2, y: worldPos2D.y } // Small radius for detection
          ]
        };
      }

      // Get other shapes for alignment detection (limit for performance)
      const otherShapes = shapes.slice(0, 8); // Limit to 8 shapes for performance

      // Detect alignment guides with performance limits
      const guides = alignmentService.detectAlignmentGuides(
        tempShape,
        otherShapes,
        alignmentConfig
      ).slice(0, 4); // Limit to 4 guides max for performance


      // Update the store with alignment guides
      store.setState((state) => ({
        ...state,
        drawing: {
          ...state.drawing,
          alignment: {
            ...state.drawing.alignment,
            activeGuides: guides,
            draggingShapeId: tempShape.id
          }
        }
      }));
    });
  }, [shapes, store, currentShape]);

  // Optimized snap detection function
  const performSnapDetection = useCallback((worldPos2D: Point2D) => {
    const snapConfig = useAppStore.getState().drawing.snapping?.config;

    if (!snapConfig?.enabled) {
      // Clear snap points when snapping is disabled
      store.setState((state) => ({
        ...state,
        drawing: {
          ...state.drawing,
          snapping: {
            ...state.drawing.snapping,
            availableSnapPoints: [],
            activeSnapPoint: null,
            snapPreviewPosition: null,
            lastHoverWorldPos: null,
            lastActiveSnapPoint: null,
          }
        }
      }));
      return worldPos2D;
    }

    // Update snap grid with current shapes, including active drawing shape with preview
    let allShapes = shapes;

    if (isDrawing && currentShape) {
      // For polyline, include the preview segment from last point to current cursor
      if (activeTool === 'polyline' && currentShape.points && currentShape.points.length > 0) {
        const enhancedPolyline = {
          ...currentShape,
          points: [...currentShape.points, worldPos2D] // Add cursor position as preview point
        };
        allShapes = [...shapes, enhancedPolyline];
      } else {
        allShapes = [...shapes, currentShape];
      }
    }

    // Calculate snap radius first
    const viewState = useAppStore.getState().viewState;
    const is2DMode = viewState?.is2DMode || false;
    const baseSnapRadius = snapConfig.snapRadius || 15;
    // Use user's snap radius setting directly (respect UI controls)
    const snapRadius = baseSnapRadius;

    // Synchronize SnapGrid's internal snap distance with the actual radius being used
    snapGrid.current.setSnapDistance(snapRadius);

    snapGrid.current.updateSnapPoints(allShapes, worldPos2D);
    const nearbySnapPoints = snapGrid.current.findSnapPointsInRadius(worldPos2D, snapRadius);

    // Filter by enabled snap types
    const filteredSnapPoints = nearbySnapPoints.filter(snap =>
      snapConfig.activeTypes?.has?.(snap.type)
    );

    // Find nearest snap point from filtered points
    const nearestSnapPoint = snapGrid.current.findNearestSnapPoint(
      worldPos2D,
      snapRadius
    );

    // Determine the final active snap point
    // EXCLUDE grid type from active indicator (grid is everywhere, too distracting)
    const finalActiveSnapPoint = nearestSnapPoint &&
                                   nearestSnapPoint.type !== 'grid' &&
                                   snapConfig.activeTypes?.has?.(nearestSnapPoint.type) ? nearestSnapPoint : null;

    // Update store with both available snap points (for indicators) and active snap point
    // Also store sticky snap data for accurate click behavior
    store.setState((state) => ({
      ...state,
      drawing: {
        ...state.drawing,
        snapping: {
          ...state.drawing.snapping,
          availableSnapPoints: filteredSnapPoints, // Show indicators for all nearby snap points
          activeSnapPoint: finalActiveSnapPoint,
          snapPreviewPosition: finalActiveSnapPoint ? finalActiveSnapPoint.position : null,
          // Sticky snap: Store last hover position and active snap point
          lastHoverWorldPos: worldPos2D,
          lastActiveSnapPoint: finalActiveSnapPoint,
        }
      }
    }));

    // Return snap position if we have an active snap point
    if (finalActiveSnapPoint) {
      return finalActiveSnapPoint.position;
    }

    return worldPos2D;
  }, [shapes, store]);

  // Old throttled functions removed - now using adaptive frequency in RaycastManager

  const snapToGridPoint = useCallback((point: Vector3): Vector3 => {
    if (!gridSnap) return point;
    
    const snappedX = Math.round(point.x / gridSize) * gridSize;
    const snappedZ = Math.round(point.z / gridSize) * gridSize;
    
    return new Vector3(snappedX, 0, snappedZ);
  }, [gridSnap, gridSize]);

  // Get raw world position WITHOUT grid snapping (for smart snap priority)
  const getRawWorldPosition = useCallback((event: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>): Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new Vector2();

    // Calculate normalized device coordinates
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Use RaycastManager for optimized ground plane intersection
    return raycastManager.current.intersectGroundPlane(camera, mouse, 0);
  }, [camera, gl.domElement]);

  // Get world position WITH grid snapping (for hover/move operations)
  const getWorldPosition = useCallback((event: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>): Vector3 | null => {
    const intersection = getRawWorldPosition(event);

    if (intersection) {
      return snapToGridPoint(intersection);
    }

    return null;
  }, [getRawWorldPosition, snapToGridPoint]);

  const worldPositionToScreenPosition = useCallback((worldPos: Vector3): Point2D => {
    // Project 3D world position to screen coordinates
    const projected = worldPos.clone().project(camera);
    const rect = gl.domElement.getBoundingClientRect();

    return {
      x: (projected.x * 0.5 + 0.5) * rect.width,
      y: (-projected.y * 0.5 + 0.5) * rect.height
    };
  }, [camera, gl.domElement]);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const worldPos = getWorldPosition(event);

    if (worldPos) {
      // Update cursor world position for adaptive snap radius
      setCursorWorldPos(worldPos);

      const rect = gl.domElement.getBoundingClientRect();
      const screenPos: Point2D = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      const worldPos2D: Point2D = {
        x: worldPos.x,
        y: worldPos.z, // Using Z as Y for 2D mapping
      };

      // Update cursor position in store for render-time filtering
      setCursorPosition(worldPos2D);

      // Use optimized snap detection and alignment detection for better performance
      const snappedPos = performSnapDetection(worldPos2D);
      performAlignmentDetection(snappedPos);

      // Get fresh state to avoid stale closures
      const currentState = useAppStore.getState();
      const isMeasuring = currentState.drawing.measurement.isMeasuring;
      const isLineDrawing = currentState.drawing.lineTool.isDrawing;

      // Handle measurement preview when measuring
      if (activeTool === 'measure' && isMeasuring) {
        updateMeasurementPreview(snappedPos);
      }

      // Handle line tool preview when drawing line
      if (activeTool === 'line' && isLineDrawing) {
        updateLinePreview(snappedPos);
      }

      if (onCoordinateChange) {
        onCoordinateChange(worldPos2D, screenPos);
      }
    }
  }, [getWorldPosition, onCoordinateChange, gl.domElement, performSnapDetection, performAlignmentDetection, activeTool, updateMeasurementPreview, updateLinePreview, setCursorPosition]);

  const handlePointerLeave = useCallback(() => {
    // Clear cursor position when leaving canvas
    setCursorPosition(null);
    setCursorWorldPos(null);

    // Clear hover state when mouse leaves the drawing area
    if (activeTool === 'select') {
      hoverShape(null);
    }

    // Clear snap grid to prevent persistent indicators
    snapGrid.current.clear();

    // Clear snap points and alignment guides when leaving the drawing area
    store.setState((state) => ({
      ...state,
      drawing: {
        ...state.drawing,
        snapping: {
          ...state.drawing.snapping,
          availableSnapPoints: [],
          activeSnapPoint: null,
          snapPreviewPosition: null,
          lastHoverWorldPos: null,
          lastActiveSnapPoint: null,
        },
        alignment: {
          ...state.drawing.alignment,
          activeGuides: [],
          activeSpacings: [],
          draggingShapeId: null,
          snapPosition: null
        }
      }
    }));
  }, [activeTool, hoverShape, store, setCursorPosition]);

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {

    // Handle deselection when select tool is active and clicking empty space
    if (activeTool === 'select') {
      // Clear all selections when clicking empty space
      if (!event.shiftKey) {
        clearSelection();
        exitRotateMode(); // Clear rotation handles when clicking empty space
      }
      return;
    }

    // Get RAW world position (without grid snapping) for smart snap priority
    const rawWorldPos = getRawWorldPosition(event);
    if (!rawWorldPos) return;

    const rawPoint2D: Point2D = {
      x: rawWorldPos.x,
      y: rawWorldPos.z, // Using Z as Y for 2D mapping
    };

    // STICKY SNAP SYSTEM:
    // Use the snap point shown during hover if the click is close to the hover position
    // This ensures clicking on a visible SNAP indicator actually snaps to it
    let snappedPos: Point2D;

    // Get sticky snap data from the last hover
    const currentState = useAppStore.getState();
    const lastHoverPos = currentState.drawing.snapping.lastHoverWorldPos;
    const lastSnapPoint = currentState.drawing.snapping.lastActiveSnapPoint;

    // Calculate distance between click position and last hover position
    const clickToHoverDistance = lastHoverPos ? Math.sqrt(
      Math.pow(rawPoint2D.x - lastHoverPos.x, 2) +
      Math.pow(rawPoint2D.y - lastHoverPos.y, 2)
    ) : Infinity;

    // Sticky snap threshold: 0.5 meters in world space
    // This allows for slight mouse movement between hover and click
    const stickySnapThreshold = 0.5;

    if (lastSnapPoint && clickToHoverDistance < stickySnapThreshold) {
      // STICKY SNAP: Use the snap point that was shown during hover
      // This is what the user expects - clicking on the SNAP indicator snaps to it
      snappedPos = lastSnapPoint.position;
    } else {
      // Either no snap point during hover, or mouse moved significantly
      // Recalculate snap detection at the actual click position
      const shapeSnappedPos = performSnapDetection(rawPoint2D);

      // Check if shape snap was found (position changed from raw)
      const hasShapeSnap =
        shapeSnappedPos.x !== rawPoint2D.x ||
        shapeSnappedPos.y !== rawPoint2D.y;

      if (hasShapeSnap) {
        // Shape snap found - use it
        snappedPos = shapeSnappedPos;
      } else {
        // No shape snap - apply grid snap as fallback
        const gridSnappedPos = snapToGridPoint(rawWorldPos);
        snappedPos = {
          x: gridSnappedPos.x,
          y: gridSnappedPos.z
        };
      }
    }

    switch (activeTool) {
      case 'line':
        // Direct Distance Entry line tool
        // Get fresh state to avoid stale selector issues
        const freshState = useAppStore.getState();
        const freshLineToolState = freshState.drawing.lineTool;

        if (!freshLineToolState.isDrawing) {
          // Start line drawing - place first point
          startLineDrawing(snappedPos);
          // Show distance input (positioned beside mouse position indicator)
          showDistanceInput();
        } else {
          // Line tool is active and drawing (using fresh state from above)
          // Check if we're in multi-segment mode and can close the shape
          if (freshLineToolState.isMultiSegment && freshLineToolState.segments && freshLineToolState.segments.length >= 2) {
            // Get the first point of the multi-line shape
            const firstPoint = freshLineToolState.segments[0].startPoint;

            if (firstPoint) {
              const distance = Math.sqrt(
                Math.pow(snappedPos.x - firstPoint.x, 2) + Math.pow(snappedPos.y - firstPoint.y, 2)
              );

              const closeThreshold = Math.max(gridSize * 2.0, 4.0); // Ensure minimum threshold

              if (distance < closeThreshold) {
                // First hide the distance input if it's showing
                const hideDistanceInput = useAppStore.getState().hideDistanceInput;
                hideDistanceInput();

                // Then complete the multi-line shape
                const completeMultiLine = useAppStore.getState().completeLine;
                completeMultiLine();
                return;
              }
            }
          }

          // For other cases during line drawing, let normal flow handle it
          // This allows the distance input workflow to work normally
        }
        break;

      case 'measure':
        // Get fresh state from store directly to avoid stale selector issues
        const currentState = useAppStore.getState();
        const currentlyMeasuring = currentState.drawing.measurement.isMeasuring;

        if (!currentlyMeasuring) {
          // Start measurement - use snapped position for precision
          const snapPoint = snapGrid.current.findNearestSnapPoint(snappedPos, snapConfig?.distance || 5);
          startMeasurement(snappedPos, snapPoint || undefined);
        } else {
          // Complete measurement - use snapped position for precision
          const snapPoint = snapGrid.current.findNearestSnapPoint(snappedPos, snapConfig?.distance || 5);
          completeMeasurement(snappedPos, snapPoint || undefined);
        }
        break;

      case 'polyline': // Multi-point line drawing
        if (!isDrawing) {
          startDrawing();
          addPoint(snappedPos); // Use snapped position for 0.000m precision
        } else {
          // Check if clicking close to the first point to close polyline (3+ points required)
          if (currentShape?.points && currentShape.points.length >= 3) {
            const firstPoint = currentShape.points[0];
            const distance = Math.sqrt(
              Math.pow(snappedPos.x - firstPoint.x, 2) + Math.pow(snappedPos.y - firstPoint.y, 2)
            );

            const closeThreshold = gridSize * 2.0; // Same threshold as cursor change
            if (distance < closeThreshold) {
              finishDrawing();
              return;
            }
          }

          addPoint(snappedPos); // Use snapped position for 0.000m precision
        }
        break;

      case 'rectangle':
        // Check if dimension input is active
        const { dimensionInput, clearDimensionInput, setInputError } = useDimensionStore.getState();

        if (!isDrawing && dimensionInput.isDimensionInputActive && dimensionInput.inputWidth && dimensionInput.inputHeight) {
          // Create rectangle with exact dimensions from input
          const inputStr = `${dimensionInput.inputWidth}x${dimensionInput.inputHeight}`;
          const parsed = parseDimension(inputStr);

          if (parsed.valid) {
            // Use the dropdown unit (inputUnit) instead of parsed unit
            // This ensures "33" with "ft" dropdown correctly uses feet
            const unit = dimensionInput.inputUnit || parsed.unit;
            const width = convertToMeters(parsed.width, unit);
            const height = convertToMeters(parsed.height, unit);

            // Create rectangle centered at click position
            const halfWidth = width / 2;
            const halfHeight = height / 2;

            // Start drawing and add all 4 points
            startDrawing();
            addPoint({ x: snappedPos.x - halfWidth, y: snappedPos.y - halfHeight });  // Top-left
            addPoint({ x: snappedPos.x + halfWidth, y: snappedPos.y - halfHeight });  // Top-right
            addPoint({ x: snappedPos.x + halfWidth, y: snappedPos.y + halfHeight });  // Bottom-right
            addPoint({ x: snappedPos.x - halfWidth, y: snappedPos.y + halfHeight });  // Bottom-left
            finishDrawing();

            // Clear dimension input after creation
            clearDimensionInput();
          } else {
            // Show error
            setInputError(parsed.error || 'Invalid input');
          }
        } else if (!isDrawing) {
          // Normal rectangle drawing (no dimension input)
          startDrawing();
          addPoint(snappedPos); // First corner - use snapped position for 0.000m precision
        } else if (currentShape?.points && currentShape.points.length === 1) {
          const firstPoint = currentShape.points[0];
          // Add the remaining 3 points to complete rectangle - use snapped position
          addPoint({ x: snappedPos.x, y: firstPoint.y });     // Top-right
          addPoint({ x: snappedPos.x, y: snappedPos.y });     // Bottom-right
          addPoint({ x: firstPoint.x, y: snappedPos.y });     // Bottom-left
          finishDrawing();
        }
        break;

      case 'circle':
        // Check if dimension input is active for circle radius
        const circleStore = useDimensionStore.getState();
        const circleInput = circleStore.dimensionInput;


        if (!isDrawing && circleInput.isDimensionInputActive && circleInput.inputRadius) {
          // Create circle with exact value from input
          const inputValue = parseFloat(circleInput.inputRadius);

          if (!isNaN(inputValue) && inputValue > 0) {
            // Get unit from dropdown
            const unit = circleInput.inputUnit || 'm';

            // Convert to meters first
            let valueInMeters = convertToMeters(inputValue, unit);

            // Apply radius/diameter mode
            const radiusMode = circleInput.inputRadiusMode || 'r';
            let radius = valueInMeters;

            if (radiusMode === 'd') {
              // User input is diameter, convert to radius
              radius = valueInMeters / 2;
            }


            // Start drawing and add center point
            startDrawing();
            addPoint(snappedPos); // Center point

            // Generate circle points with adaptive segment count for performance
            const circlePoints: Point2D[] = [];
            const segments = Math.max(16, Math.min(64, Math.floor(radius * 2))); // Adaptive segments

            for (let i = 0; i <= segments; i++) {
              const angle = (i / segments) * Math.PI * 2;
              circlePoints.push({
                x: snappedPos.x + Math.cos(angle) * radius,
                y: snappedPos.y + Math.sin(angle) * radius,
              });
            }

            // Store center as first point, edge point as second (for radius calculation)
            // This matches the format expected by ShapeDimensions
            const freshState = useAppStore.getState();
            const freshShape = freshState.drawing.currentShape;
            if (freshShape) {
              const edgePoint = { x: snappedPos.x + radius, y: snappedPos.y };
              freshShape.points = [
                snappedPos, // Center point
                edgePoint // Edge point for radius
              ];
            }

            finishDrawing();


            // Clear dimension input after creation
            circleStore.clearDimensionInput();
          } else {
            // Show error
            circleStore.setInputError('Invalid number');
          }
        } else if (!isDrawing) {
          // Normal circle drawing (no dimension input)
          startDrawing();
          addPoint(snappedPos); // Center point - use snapped position for 0.000m precision
        } else if (currentShape?.points && currentShape.points.length === 1) {
          const center = currentShape.points[0];
          const radius = Math.sqrt(
            Math.pow(snappedPos.x - center.x, 2) + Math.pow(snappedPos.y - center.y, 2)
          );


          // Store center and edge point (not full circle points for now)
          // This matches dimension calculation expectations
          currentShape.points = [
            center, // Center point
            snappedPos // Edge point
          ];
          finishDrawing();
        }
        break;
    }
  }, [
    activeTool,
    isDrawing,
    currentShape,
    gridSize,
    getRawWorldPosition,
    snapToGridPoint,
    startDrawing,
    addPoint,
    finishDrawing,
    clearSelection,
    exitRotateMode,
    performSnapDetection,
    startMeasurement,
    completeMeasurement,
    updateMeasurementPreview,
    startLineDrawing,
    showDistanceInput,
    // Note: isMeasuring and isLineDrawing removed - using fresh state via useAppStore.getState()
  ]);

  const handleDoubleClick = useCallback(() => {
    // Double-click handler removed for polylines - now use single-click near start point
    // Keep this function in case other tools need double-click in the future
  }, []);

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.nativeEvent.preventDefault();
    event.stopPropagation(); // Prevent event from bubbling to parent handlers

    // Get fresh state to avoid stale selector issues
    const freshState = useAppStore.getState();
    const freshIsDrawing = freshState.drawing.isDrawing;
    const freshIsMeasuring = freshState.drawing.measurement.isMeasuring;
    const freshIsLineDrawing = freshState.drawing.lineTool.isDrawing;

    // Cancel any active drawing/measurement operations
    if (freshIsDrawing) {
      cancelDrawing();
    } else if (freshIsMeasuring) {
      cancelMeasurement();
    } else if (freshIsLineDrawing) {
      cancelLineDrawing();
    }

    // Open canvas context menu (empty space right-click)
    const { openContextMenu } = useAppStore.getState();
    openContextMenu('canvas', {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
    });
  }, [cancelDrawing, cancelMeasurement, cancelLineDrawing]);

  // Clear snap state when tool changes (defensive state clearing)
  useEffect(() => {
    // Clear cursor position and snap grid
    setCursorPosition(null);
    snapGrid.current.clear();

    // Clear all snap state
    store.setState((state) => ({
      ...state,
      drawing: {
        ...state.drawing,
        snapping: {
          ...state.drawing.snapping,
          availableSnapPoints: [],
          activeSnapPoint: null,
          snapPreviewPosition: null,
          lastHoverWorldPos: null,
          lastActiveSnapPoint: null,
        }
      }
    }));
  }, [activeTool, store, setCursorPosition]);

  // Task 4.2: Add Shift key event listeners for snap override
  useEffect(() => {
    const setShiftKey = useAppStore.getState().setShiftKey;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKey(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKey(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Reset shift key state on cleanup
      setShiftKey(false);
    };
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      raycastManager.current.dispose();
      snapGrid.current.dispose();
    };
  }, []);

  // PERFORMANCE FIX: Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (alignmentRafRef.current !== null) {
        cancelAnimationFrame(alignmentRafRef.current);
      }
    };
  }, []);

  return (
    <mesh
      ref={planeRef}
      position={[0, -0.001, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      visible={false}
    >
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export default DrawingCanvas;