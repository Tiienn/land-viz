import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Html, Line } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import { useTextStore } from '@/store/useTextStore';
import type { Point2D } from '@/types';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { logger } from '@/utils/logger';
import { tokens } from '@/styles/tokens';

interface RotationControlsProps {
  elevation?: number;
}

// Utility functions for rotation math
const calculateAngle = (center: Point2D, point: Point2D): number => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

const snapAngleToIncrement = (angle: number, increment: number = 45): number => {
  return Math.round(angle / increment) * increment;
};

const normalizeAngle = (angle: number): number => {
  while (angle > 180) angle -= 360;
  while (angle <= -180) angle += 360;
  return angle;
};

/**
 * Normalize angle to 0-2π range (for cursor rotation mode)
 */
const normalizeAngleRadian = (angle: number): number => {
  let normalized = angle % (2 * Math.PI);
  if (normalized < 0) {
    normalized += 2 * Math.PI;
  }
  return normalized;
};

const calculateShapeCenter = (shape: any): Point2D => {
  if (!shape.points || shape.points.length === 0) return { x: 0, y: 0 };

  if (shape.type === 'circle') {
    // For circles, calculate center from all perimeter points
    return {
      x: shape.points.reduce((sum: number, p: Point2D) => sum + p.x, 0) / shape.points.length,
      y: shape.points.reduce((sum: number, p: Point2D) => sum + p.y, 0) / shape.points.length
    };
  }

  if (shape.type === 'rectangle' && shape.points.length === 2) {
    // For rectangles stored as 2 points, calculate center
    const [topLeft, bottomRight] = shape.points;
    return {
      x: (topLeft.x + bottomRight.x) / 2,
      y: (topLeft.y + bottomRight.y) / 2
    };
  }

  // For other shapes, use centroid
  return {
    x: shape.points.reduce((sum: number, p: Point2D) => sum + p.x, 0) / shape.points.length,
    y: shape.points.reduce((sum: number, p: Point2D) => sum + p.y, 0) / shape.points.length
  };
};

/**
 * Calculate the center of a group of shapes (bounding box center)
 * For Canva-style group rotation
 */
const calculateGroupCenter = (shapes: any[]): Point2D => {
  if (shapes.length === 0) return { x: 0, y: 0 };
  if (shapes.length === 1) return calculateShapeCenter(shapes[0]);

  // Collect all points from all shapes
  const allPoints: Point2D[] = [];
  shapes.forEach(shape => {
    let points = shape.points;

    // Expand rectangle format if needed
    if (shape.type === 'rectangle' && points.length === 2) {
      const [topLeft, bottomRight] = points;
      points = [
        topLeft,
        { x: bottomRight.x, y: topLeft.y },
        bottomRight,
        { x: topLeft.x, y: bottomRight.y }
      ];
    }

    allPoints.push(...points);
  });

  // Calculate bounding box center
  const minX = Math.min(...allPoints.map(p => p.x));
  const maxX = Math.max(...allPoints.map(p => p.x));
  const minY = Math.min(...allPoints.map(p => p.y));
  const maxY = Math.max(...allPoints.map(p => p.y));

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2
  };
};

const RotationControls: React.FC<RotationControlsProps> = ({ elevation = 0.01 }) => {
  const { camera, raycaster, gl } = useThree();

  // Get rotation state from store
  const drawing = useAppStore(state => state.drawing);
  const shapes = useAppStore(state => state.shapes);
  const elements = useAppStore(state => state.elements); // CRITICAL FIX: Also get elements array
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const selectedShapeId = useAppStore(state => state.selectedShapeId);
  const selectedShapeIds = useAppStore(state => state.selectedShapeIds); // For group rotation
  const originalRotation = useAppStore(state => state.drawing.originalRotation);
  const enterRotateMode = useAppStore(state => state.enterRotateMode);
  const rotateShape = useAppStore(state => state.rotateShape);
  const rotateShapeLive = useAppStore(state => state.rotateShapeLive);
  const exitCursorRotationMode = useAppStore(state => state.exitCursorRotationMode);
  const applyCursorRotation = useAppStore(state => state.applyCursorRotation);

  // Get global drag state to handle shape dragging transforms
  const globalDragState = useAppStore(state => state.dragState);

  // CRITICAL FIX: Get layers from useAppStore, not useLayerStore
  // useAppStore.layers is the source of truth (where finishDrawing() adds layers)
  const layers = useAppStore(state => state.layers);

  // Get text store for text rotation support
  const texts = useTextStore(state => state.texts);
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const updateText = useTextStore(state => state.updateText);
  const updateTextLive = useTextStore(state => state.updateTextLive);
  
  // Local state for rotation interaction
  const [isRotating, setIsRotating] = React.useState(false);
  const [currentAngle, setCurrentAngle] = React.useState(0);
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);
  const [cursorOverride, setCursorOverride] = React.useState<string | null>(null);
  
  // Use ref to track shift state immediately (avoids stale closure issues)
  const shiftPressedRef = useRef(false);

  // Use ref to track angle immediately (avoids stale closure issues)
  const angleRef = useRef(0);

  // Use ref to track if actual dragging occurred (prevents accidental clicks from applying rotation)
  const hasDraggedRef = useRef(false);

  // Cursor rotation mode state (hover-to-rotate)
  const cursorRotationMode = useAppStore(state => state.drawing.cursorRotationMode);
  const cursorRotationShapeId = useAppStore(state => state.drawing.cursorRotationShapeId);
  const [cursorAngle, setCursorAngle] = React.useState(0);
  const cursorPositionRef = useRef<THREE.Vector2 | null>(null);
  const cursorAngleRef = useRef(0); // For immediate access in callbacks
  const modeEnteredTimeRef = useRef(0); // Track when cursor rotation mode was entered

  // Dragging state
  const dragState = useRef({
    isDragging: false,
    startAngle: 0,
    startMouseAngle: 0,
    pointerId: null as number | null
  });
  
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  // Apply cursor to the canvas element
  useEffect(() => {
    if (cursorOverride) {
      gl.domElement.style.cursor = cursorOverride;
    } else {
      gl.domElement.style.cursor = '';
    }
  }, [cursorOverride, gl.domElement]);

  // Helper function to check if layer is visible (including parent folders)
  const isLayerVisible = useCallback((layerId: string): boolean => {
    const layer = layers.find(l => l.id === layerId);

    if (!layer) {
      return false;
    }

    // Layer itself must be visible
    if (layer.visible === false) {
      return false;
    }

    // If layer has a parent folder, check parent visibility recursively
    if (layer.parentId) {
      return isLayerVisible(layer.parentId);
    }

    // No parent or all parents are visible
    return true;
  }, [layers]);

  // Find the shape/text being rotated or show rotation handle for selected shape/text
  const targetShape = useMemo(() => {
    let shape = null;

    // CRITICAL FIX: Combine shapes, elements, and texts arrays to find shapes and text
    // During migration, new shapes are in elements array as ShapeElements
    // Safe fallback: elements might be undefined if migration hasn't run yet
    const allShapes = [
      ...shapes,
      ...(elements || []).filter(el => el.elementType === 'shape').map(el => ({
        id: el.id,
        type: el.shapeType,
        points: el.points,
        color: el.color,
        visible: el.visible,
        locked: el.locked,
        layerId: el.layerId,
        rotation: el.rotation,
        created: el.created,
        modified: el.modified
      })),
      // Add text objects as shape-like objects for rotation
      ...(texts || []).map(text => ({
        id: text.id,
        type: 'text' as const,
        points: [{ x: text.position.x, y: text.position.z }], // Convert text position to points format
        color: text.color,
        visible: text.visible !== false,
        locked: text.locked || false,
        layerId: text.layerId,
        rotation: { angle: text.rotation || 0, center: { x: text.position.x, y: text.position.z } },
        created: text.created,
        modified: text.modified,
        // Store original text object for updates
        _textObject: text
      }))
    ];

    // Cursor rotation mode: show handle for the shape/text being rotated
    if (cursorRotationMode && cursorRotationShapeId) {
      shape = allShapes.find(s => s.id === cursorRotationShapeId) || null;
    }
    else if (drawing.isRotateMode && drawing.rotatingShapeId) {
      shape = allShapes.find(s => s.id === drawing.rotatingShapeId) || null;
    }
    // Show rotation handle for selected shape OR multi-selection (when not in edit mode)
    // NOTE: Don't show for text in normal mode - TextTransformControls handles text rotation
    // Allow rotation handles to show even if just finished drawing or in resize mode
    else if (activeTool === 'select' && !drawing.isEditMode) {
      // MULTI-SELECTION FIX: Show handle for multi-selection or single selection
      if (selectedShapeIds && selectedShapeIds.length > 1) {
        // Multi-selection: use primary shape if available, otherwise first selected shape
        const targetId = selectedShapeId || selectedShapeIds[0];
        shape = allShapes.find(s => s.id === targetId) || null;
      } else if (selectedShapeId) {
        // Single selection: use primary selected shape
        shape = allShapes.find(s => s.id === selectedShapeId) || null;
      }
      // NOTE: Removed selectedTextId check here - text rotation handled by TextTransformControls
      // RotationControls only handles text during cursor rotation mode (checked above)
    }

    // Don't show rotation controls for locked shapes
    if (shape?.locked) {
      return null;
    }

    // Don't show rotation controls if shape's layer (or parent folders) are hidden
    if (shape && !isLayerVisible(shape.layerId)) {
      return null;
    }

    return shape;
  }, [shapes, elements, texts, cursorRotationMode, cursorRotationShapeId, drawing.isRotateMode, drawing.rotatingShapeId, selectedShapeId, selectedTextId, selectedShapeIds, activeTool, drawing.isEditMode, isLayerVisible]);

  // Calculate rotation handle position and rotation center
  const rotationHandlePosition = useMemo(() => {
    if (!targetShape) return null;

    // CRITICAL FIX: Combine shapes and elements for group rotation calculations
    // Safe fallback: elements might be undefined if migration hasn't run yet
    const allShapes = [
      ...shapes,
      ...(elements || []).filter(el => el.elementType === 'shape').map(el => ({
        id: el.id,
        type: el.shapeType,
        points: el.points,
        groupId: el.groupId,
        rotation: el.rotation
      }))
    ];

    // MULTI-SELECTION FIX: Check if we're rotating multiple shapes (grouped OR multi-selected)
    const isMultiRotation = selectedShapeIds && selectedShapeIds.length > 1;
    let originalCenter: Point2D;

    if (isMultiRotation) {
      // Multi-selection OR group: Get all selected shapes
      const selectedShapes = allShapes.filter(s => selectedShapeIds.includes(s.id));
      // Calculate group center (bounding box center) for rotation
      originalCenter = calculateGroupCenter(selectedShapes);
    } else {
      // Single shape rotation - use shape's own center
      let originalPoints = targetShape.points;
      if (targetShape.type === 'rectangle' && targetShape.points.length === 2) {
        // Convert 2-point format to 4-point format for center calculation
        const [topLeft, bottomRight] = targetShape.points;
        originalPoints = [
          { x: topLeft.x, y: topLeft.y },      // Top left
          { x: bottomRight.x, y: topLeft.y },  // Top right
          { x: bottomRight.x, y: bottomRight.y }, // Bottom right
          { x: topLeft.x, y: bottomRight.y }   // Bottom left
        ];
      }
      // Calculate original center without any transformations
      originalCenter = calculateShapeCenter({...targetShape, points: originalPoints});
    }

    // Calculate display position for handle (always use primary shape for handle position)
    let originalPoints = targetShape.points;
    if (targetShape.type === 'rectangle' && targetShape.points.length === 2) {
      const [topLeft, bottomRight] = targetShape.points;
      originalPoints = [
        { x: topLeft.x, y: topLeft.y },
        { x: bottomRight.x, y: topLeft.y },
        { x: bottomRight.x, y: bottomRight.y },
        { x: topLeft.x, y: bottomRight.y }
      ];
    }

    let transformedPoints = originalPoints;

    // Apply drag offset if shape is being dragged
    const isBeingDragged = globalDragState.isDragging && globalDragState.draggedShapeId === targetShape.id;
    if (isBeingDragged && globalDragState.startPosition && globalDragState.currentPosition) {
      const offsetX = globalDragState.currentPosition.x - globalDragState.startPosition.x;
      const offsetY = globalDragState.currentPosition.y - globalDragState.startPosition.y;

      // First apply rotation to original points (if any)
      let rotatedPoints = originalPoints;
      if (targetShape.rotation && targetShape.rotation.angle !== 0) {
        const { angle, center } = targetShape.rotation;
        const angleRadians = (angle * Math.PI) / 180;
        const cos = Math.cos(angleRadians);
        const sin = Math.sin(angleRadians);

        rotatedPoints = originalPoints.map(point => {
          const dx = point.x - center.x;
          const dy = point.y - center.y;

          return {
            x: center.x + (dx * cos - dy * sin),
            y: center.y + (dx * sin + dy * cos)
          };
        });
      }

      // Then apply drag offset to rotated points
      transformedPoints = rotatedPoints.map(point => ({
        x: point.x + offsetX,
        y: point.y + offsetY
      }));
    } else {
      // Normal case: just apply rotation to original points
      if (targetShape.rotation && targetShape.rotation.angle !== 0) {
        const { angle, center } = targetShape.rotation;
        const angleRadians = (angle * Math.PI) / 180;
        const cos = Math.cos(angleRadians);
        const sin = Math.sin(angleRadians);

        transformedPoints = originalPoints.map(point => {
          const dx = point.x - center.x;
          const dy = point.y - center.y;

          return {
            x: center.x + (dx * cos - dy * sin),
            y: center.y + (dx * sin + dy * cos)
          };
        });
      } else {
        transformedPoints = originalPoints;
      }
    }

    // CANVA-STYLE FIX: For multi-selection, display handle at group center, not primary shape
    let displayCenter: Point2D;
    if (isMultiRotation) {
      // Multi-selection: Use group center for handle display
      displayCenter = originalCenter;
    } else {
      // Single selection: Use shape's transformed center for handle display
      displayCenter = calculateShapeCenter({...targetShape, points: transformedPoints});
    }

    // Position handle below the shape/group and area text
    const handleOffset = 4.0; // Distance below center (increased to clear area text)
    return {
      x: displayCenter.x,
      y: displayCenter.y + handleOffset,
      center: originalCenter, // Use original center (single shape OR group center) for rotation calculations
      displayCenter: displayCenter // Use display center for visual positioning
    };
  }, [targetShape, globalDragState, selectedShapeIds, shapes, elements]); // isMultiRotation calculated inside

  // Handle pointer events
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!dragState.current.isDragging || !targetShape || !rotationHandlePosition || 
        (dragState.current.pointerId !== null && event.pointerId !== dragState.current.pointerId)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const mousePoint: Point2D = { x: intersection.x, y: intersection.z };
      const currentMouseAngle = calculateAngle(rotationHandlePosition.center, mousePoint);
      
      // Mark that actual dragging has occurred (not just a click)
      hasDraggedRef.current = true;

      // Calculate rotation angle relative to start
      let rotationAngle = currentMouseAngle - dragState.current.startMouseAngle;
      rotationAngle = normalizeAngle(rotationAngle);

      // Apply snapping if Shift is pressed - snap to nearest 45-degree increment
      // Use the original rotation from the store (captured when rotation started)
      const originalAngle = originalRotation?.angle || 0;
      const finalAngle = originalAngle + rotationAngle;
      let angleToUse = finalAngle;
      
      // Use ref for immediate shift state (not stale closure)
      const currentlyShiftPressed = shiftPressedRef.current;
      
      if (currentlyShiftPressed) {
        // Snap to nearest 45-degree increment: 0°, ±45°, ±90°, ±135°, 180°
        angleToUse = snapAngleToIncrement(finalAngle, 45);
        
        // Normalize the snapped angle to ensure it's in the correct range
        angleToUse = normalizeAngle(angleToUse);
      }
      
      // Update the display angle and apply to shape (live preview)
      setCurrentAngle(angleToUse);
      angleRef.current = angleToUse; // Store in ref for immediate access in callbacks
      rotateShapeLive(targetShape.id, angleToUse, rotationHandlePosition.center);
    }
  }, [targetShape, rotationHandlePosition, gl.domElement, camera, raycaster, groundPlane, isShiftPressed, rotateShapeLive]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (dragState.current.isDragging &&
        (dragState.current.pointerId === null || event.pointerId === dragState.current.pointerId)) {

      // Commit final rotation to history ONLY if actual dragging occurred
      // This prevents accidental clicks from resetting the rotation
      if (targetShape && rotationHandlePosition && hasDraggedRef.current) {
        // Use angleRef.current to get the most up-to-date angle value
        // This avoids stale closure issues with the currentAngle state
        rotateShape(targetShape.id, angleRef.current, rotationHandlePosition.center);
      }

      // Clean up drag state
      dragState.current.isDragging = false;
      dragState.current.pointerId = null;
      hasDraggedRef.current = false; // Reset drag flag for next interaction

      setIsRotating(false);
      setCursorOverride(null);

      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      document.removeEventListener('pointercancel', handlePointerUp, true);
    }
  }, [handlePointerMove, targetShape, rotationHandlePosition, rotateShape]);

  // Keyboard event handlers for Shift key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && !shiftPressedRef.current) {
        shiftPressedRef.current = true;
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && shiftPressedRef.current) {
        shiftPressedRef.current = false;
        setIsShiftPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isShiftPressed]);

  // Separate function to initialize rotation interaction (MUST be before early return)
  const initializeRotation = useCallback((eventData: { clientX: number, clientY: number, pointerId: number, currentTarget: any }) => {
    // CRITICAL FIX: Get CURRENT state, not closure state (prevents stale state after timeout)
    const currentState = useAppStore.getState();

    // Enter rotation mode if not already in it
    if (!currentState.drawing.isRotateMode) {
      enterRotateMode(targetShape.id);

      // Save history asynchronously after mode entered (non-blocking)
      requestAnimationFrame(() => {
        useAppStore.getState().saveToHistory();
      });
    }

    setIsRotating(true);

    // Calculate initial angles using stored event data
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((eventData.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((eventData.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const mousePoint: Point2D = { x: intersection.x, y: intersection.z };
      const mouseAngle = calculateAngle(rotationHandlePosition.center, mousePoint);

      // Set up drag state
      dragState.current.isDragging = true;
      dragState.current.startMouseAngle = mouseAngle;
      dragState.current.pointerId = eventData.pointerId;
      hasDraggedRef.current = false; // Reset flag - will be set to true on first move

      // Use the original rotation from the store
      const initialAngle = originalRotation?.angle || 0;
      setCurrentAngle(initialAngle);
      angleRef.current = initialAngle; // Store in ref for immediate access
      setCursorOverride('grabbing'); // Canva-style: 'grabbing' cursor during drag

      // Capture pointer (safely check if target still exists and pointer is active)
      if (eventData.currentTarget && eventData.currentTarget.setPointerCapture) {
        try {
          eventData.currentTarget.setPointerCapture(eventData.pointerId);
        } catch (error) {
          // Pointer may have already ended (e.g., when transitioning from resize mode)
          // This is safe to ignore - the rotation will still work via global listeners
          logger.log('Pointer capture failed (expected during mode transitions):', error);
        }
      }

      // Add global listeners
      document.addEventListener('pointermove', handlePointerMove, true);
      document.addEventListener('pointerup', handlePointerUp, true);
      document.addEventListener('pointercancel', handlePointerUp, true);
    }
  }, [targetShape, drawing.isRotateMode, enterRotateMode, gl.domElement, camera, raycaster, groundPlane, rotationHandlePosition, originalRotation, handlePointerMove, handlePointerUp]);

  /**
   * Cursor rotation mode: Track cursor movement for hover-to-rotate
   */
  useEffect(() => {
    if (!cursorRotationMode || !targetShape || !gl.domElement || !camera || !rotationHandlePosition) {
      return;
    }

    const canvas = gl.domElement;

    const handleCursorMove = (event: PointerEvent) => {
      // Convert screen coordinates to normalized device coordinates
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast to find cursor position in world space (on ground plane)
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const cursorPos = new THREE.Vector3();
      const intersected = raycaster.ray.intersectPlane(groundPlane, cursorPos);

      if (!intersected) return;

      // Store cursor position for guide line rendering
      cursorPositionRef.current = new THREE.Vector2(cursorPos.x, cursorPos.z);

      // Calculate rotation angle from shape center to cursor (in DEGREES like drag mode)
      const shapeCenter = rotationHandlePosition.center;
      const mousePoint: Point2D = { x: cursorPos.x, y: cursorPos.z };
      let angleDegrees = calculateAngle(shapeCenter, mousePoint);

      // Apply angle snapping if Shift is pressed
      if (shiftPressedRef.current) {
        angleDegrees = snapAngleToIncrement(angleDegrees, 45);
      }

      // Normalize angle to -180 to 180 range
      angleDegrees = normalizeAngle(angleDegrees);

      // Update state and ref (store in degrees)
      setCursorAngle(angleDegrees);
      cursorAngleRef.current = angleDegrees;

      // Apply live rotation in DEGREES (store expects degrees, not radians)
      // Check if target is text or shape
      if (targetShape.type === 'text' && (targetShape as any)._textObject) {
        // Text rotation: update text object for live preview (without saving to history)
        const textObj = (targetShape as any)._textObject;
        updateTextLive(textObj.id, { rotation: angleDegrees });
      } else {
        // Shape rotation: use existing rotateShapeLive
        rotateShapeLive(targetShape.id, angleDegrees, shapeCenter);
      }
    };

    // Throttle to 60 FPS (16ms)
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = (event: PointerEvent) => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        handleCursorMove(event);
        throttleTimeout = null;
      }, 16);
    };

    canvas.addEventListener('pointermove', throttledHandler);

    return () => {
      canvas.removeEventListener('pointermove', throttledHandler);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [
    cursorRotationMode,
    targetShape,
    camera,
    gl.domElement,
    rotationHandlePosition,
    rotateShapeLive,
    updateTextLive,
    shiftPressedRef,
    raycaster
  ]);

  /**
   * Cursor rotation mode: Track when mode was entered to prevent immediate exit
   */
  useEffect(() => {
    if (cursorRotationMode) {
      modeEnteredTimeRef.current = Date.now();
    }
  }, [cursorRotationMode]);

  /**
   * Cursor rotation mode: Handle clicks to confirm rotation
   */
  useEffect(() => {
    if (!cursorRotationMode || !targetShape || !rotationHandlePosition || !gl.domElement) {
      return;
    }

    const canvas = gl.domElement;
    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };
    let isValidClick = false;

    const handlePointerDown = (event: PointerEvent) => {
      // Ignore if dragging the rotation handle
      if (dragState.current.isDragging) return;

      // Only handle left button (button === 0)
      if (event.button !== 0) return;

      pointerDownTime = Date.now();
      pointerDownPos = { x: event.clientX, y: event.clientY };
      isValidClick = true;
    };

    const handlePointerUp = (event: PointerEvent) => {
      // Ignore if dragging the rotation handle
      if (dragState.current.isDragging) return;

      // Only handle left button
      if (event.button !== 0) return;

      // Must have a valid pointerdown first
      if (!isValidClick) return;

      // Ignore clicks that happen too soon after entering mode (prevent button click from triggering exit)
      const timeSinceEnter = Date.now() - modeEnteredTimeRef.current;
      if (timeSinceEnter < 200) {
        isValidClick = false;
        return;
      }

      // Check if this was a quick click (not a drag)
      const timeDiff = Date.now() - pointerDownTime;
      const posDiff = Math.sqrt(
        Math.pow(event.clientX - pointerDownPos.x, 2) +
        Math.pow(event.clientY - pointerDownPos.y, 2)
      );

      // Only confirm if it was a quick click with minimal movement
      if (timeDiff < 300 && posDiff < 5) {
        // Prevent any default behavior
        event.preventDefault();
        event.stopPropagation();

        // Apply rotation with history save (in DEGREES)
        // Check if target is a text object or shape
        if (targetShape.type === 'text' && (targetShape as any)._textObject) {
          // Text rotation: update text object directly
          const textObj = (targetShape as any)._textObject;
          updateText(textObj.id, { rotation: cursorAngleRef.current });
          logger.info(`Text rotation applied: ${Math.round(cursorAngleRef.current)}°`);
        } else {
          // Shape rotation: use existing applyCursorRotation
          applyCursorRotation(
            targetShape.id,
            cursorAngleRef.current,
            rotationHandlePosition.center
          );
        }

        // Exit cursor rotation mode (confirm rotation)
        exitCursorRotationMode(false);
      }

      // Reset flag
      isValidClick = false;
    };

    // Listen on canvas with capture phase to get events first
    canvas.addEventListener('pointerdown', handlePointerDown, true);
    canvas.addEventListener('pointerup', handlePointerUp, true);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown, true);
      canvas.removeEventListener('pointerup', handlePointerUp, true);
    };
  }, [cursorRotationMode, targetShape, rotationHandlePosition, applyCursorRotation, updateText, updateTextLive, gl.domElement]);

  /**
   * Cursor rotation mode: Handle ESC key to exit
   */
  useEffect(() => {
    if (!cursorRotationMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitCursorRotationMode(true); // Cancel = true, restore original rotation
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cursorRotationMode, exitCursorRotationMode]);

  /**
   * Cursor rotation mode: Exit when tool or shape selection changes
   */
  useEffect(() => {
    // Only check if currently in cursor rotation mode
    if (!cursorRotationMode) return;

    // Exit if tool changed away from select (confirm current rotation)
    if (activeTool !== 'select') {
      exitCursorRotationMode(false);
      return;
    }

    // Exit if selection changed (shape or text) (confirm current rotation)
    // Check both selectedShapeId (for shapes) and selectedTextId (for text)
    const currentSelectionId = selectedShapeId || selectedTextId;
    if (!currentSelectionId || currentSelectionId !== cursorRotationShapeId) {
      exitCursorRotationMode(false);
      return;
    }
  }, [cursorRotationMode, activeTool, selectedShapeId, selectedTextId, cursorRotationShapeId, exitCursorRotationMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  if (!targetShape || !rotationHandlePosition) {
    return null;
  }


  const handleRotationStart = (event: any) => {
    event.stopPropagation();
    event.preventDefault();

    // For React events, we need to access the native event for stopImmediatePropagation
    if (event.nativeEvent && event.nativeEvent.stopImmediatePropagation) {
      event.nativeEvent.stopImmediatePropagation();
    }

    // Defensive check: Ensure targetShape exists
    if (!targetShape) {
      logger.warn('[RotationControls]', 'Rotation handle clicked but targetShape is null');
      return;
    }

    // Store event data before potential timeout (React events get cleaned up)
    const eventData = {
      clientX: event.nativeEvent.clientX,
      clientY: event.nativeEvent.clientY,
      pointerId: event.nativeEvent.pointerId,
      currentTarget: event.currentTarget
    };

    // CRITICAL: Force exit from resize mode with proper state clearing
    if (drawing.isResizeMode) {
      const { exitResizeMode } = useAppStore.getState();
      exitResizeMode();

      // Add 1-frame delay to ensure state propagation, then initialize rotation
      setTimeout(() => {
        initializeRotation(eventData);
      }, 16);
      return; // Exit early and let timeout handle rotation start
    }

    // Normal case: directly initialize rotation
    initializeRotation(eventData);
  };

  return (
    <group>
      {/* Rotation Handle - Positioned below shape */}
      <Html
        position={[rotationHandlePosition.x, elevation + 0.3, rotationHandlePosition.y]}
        center
        sprite
        occlude={false}
        zIndexRange={[1, 0]}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
          zIndex: tokens.zIndex.scene
        }}
      >
        <div
          onPointerDown={handleRotationStart}
          onPointerEnter={() => setCursorOverride('alias')}
          onPointerLeave={() => !isRotating && setCursorOverride(null)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: drawing.isRotateMode ? 'rgba(29, 78, 216, 0.95)' : 'rgba(34, 197, 94, 0.95)',
            border: '3px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'alias', // Canva-style rotation cursor (circular arrows)
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            transform: isRotating ? 'scale(1.1)' : 'scale(1)',
          }}
          title="Drag to rotate (Shift for 45° snap)"
        >
          ↻
        </div>
      </Html>

      {/* Angle Display - Show during rotation */}
      {isRotating && (
        <Html
          position={[rotationHandlePosition.displayCenter.x, elevation + 0.8, rotationHandlePosition.displayCenter.y]}
          center
          sprite
          occlude={false}
          zIndexRange={[1, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: tokens.zIndex.scene
          }}
        >
          <div style={{
            background: 'rgba(29, 78, 216, 0.95)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            border: '2px solid rgba(255,255,255,0.9)',
          }}>
            {Math.round(currentAngle)}°
            {isShiftPressed && <span style={{ marginLeft: '8px', fontSize: '12px' }}>⇧ 45°</span>}
          </div>
        </Html>
      )}

      {/* Cursor Rotation Mode Visual Guides */}
      {cursorRotationMode && targetShape && cursorPositionRef.current && rotationHandlePosition && (
        <>
          {/* Guide line from center to cursor */}
          <Line
            points={[
              [rotationHandlePosition.center.x, elevation + 0.1, rotationHandlePosition.center.y],
              [cursorPositionRef.current.x, elevation + 0.1, cursorPositionRef.current.y]
            ]}
            color="#9333EA"
            lineWidth={2}
            dashed
            dashSize={0.2}
            gapSize={0.1}
          />

          {/* Angle display at cursor */}
          <Html
            position={[cursorPositionRef.current.x, elevation + 0.5, cursorPositionRef.current.y]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: '"Nunito Sans", sans-serif',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              {Math.round(cursorAngle)}°
              {shiftPressedRef.current && (
                <span style={{ color: '#10B981', marginLeft: '6px' }}>
                  SNAP
                </span>
              )}
            </div>
          </Html>

          {/* Snap indicator ring */}
          {shiftPressedRef.current && (
            <mesh
              position={[cursorPositionRef.current.x, elevation + 0.05, cursorPositionRef.current.y]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.8, 1.0, 32]} />
              <meshBasicMaterial
                color="#10B981"
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </>
      )}
    </group>
  );
};

export default RotationControls;