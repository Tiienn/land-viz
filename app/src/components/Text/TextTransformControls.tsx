/**
 * TextTransformControls Component
 *
 * Phase 5: Text as Layers - Complete Transform Controls for Text Objects
 *
 * Provides drag-to-move, resize handles (8), and rotation handle for selected text.
 * Adapted from TextResizeControls and TextRotationControls to work with TextObject + useTextStore.
 *
 * Features:
 * - Drag-to-move: Click and drag text to reposition
 * - Resize: 4 corner handles (proportional) + 4 edge handles (dimensional)
 * - Rotate: Green handle above text with live preview and Shift snapping
 */

import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Html } from '@react-three/drei';
import { useTextStore } from '../../store/useTextStore';
import { useAppStore } from '../../store/useAppStore';
import type { TextObject, Point2D } from '../../types';
import { useThree } from '@react-three/fiber';
import { applyAxisLockConstraint } from '../../utils/shapeConstraints';
import * as THREE from 'three';
import { logger } from '../../utils/logger';
import { tokens } from '../../styles/tokens';

// Font size constraints
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 200;

interface TextTransformControlsProps {
  text: TextObject;
  elevation?: number;
}

// Helper functions for rotation
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

// Helper function to measure actual text box dimensions INCLUDING padding (matches TextObject.tsx rendering)
function measureTextDimensions(text: TextObject, is2DMode: boolean, isSelected: boolean): { width: number; height: number } {
  // Create temporary DOM element with EXACT same styles as rendered text
  const measureDiv = document.createElement('div');
  measureDiv.style.position = 'absolute';
  measureDiv.style.visibility = 'hidden';
  measureDiv.style.pointerEvents = 'none';
  measureDiv.style.left = '-9999px';
  measureDiv.style.top = '-9999px';

  // Apply exact text styles from TextObject.tsx
  measureDiv.style.fontFamily = text.fontFamily || 'Nunito Sans, sans-serif';
  measureDiv.style.fontSize = `${text.fontSize}px`;
  measureDiv.style.fontWeight = text.bold ? 'bold' : 'normal';
  measureDiv.style.fontStyle = text.italic ? 'italic' : 'normal';
  measureDiv.style.textDecoration = text.underline ? 'underline' : 'none';
  measureDiv.style.textTransform = text.uppercase ? 'uppercase' : 'none';
  measureDiv.style.letterSpacing = `${text.letterSpacing / 100}em`;
  measureDiv.style.lineHeight = `${text.lineHeight}`;
  measureDiv.style.textAlign = text.alignment as 'left' | 'center' | 'right';
  measureDiv.style.margin = '0';

  // CRITICAL: Apply padding BEFORE measuring (matches TextObject.tsx)
  measureDiv.style.padding = text.backgroundColor ? '8px 12px' : '0';

  // CRITICAL: Apply border BEFORE measuring if selected
  measureDiv.style.border = isSelected ? '2px solid #3B82F6' : 'none';
  measureDiv.style.boxSizing = 'content-box'; // Match default browser behavior

  // CRITICAL: Different wrapping behavior for 2D vs 3D mode (matches TextObject.tsx)
  if (is2DMode) {
    measureDiv.style.whiteSpace = 'nowrap';  // 2D mode: no wrapping
    measureDiv.style.maxWidth = 'none';      // 2D mode: no width limit
    measureDiv.style.writingMode = 'horizontal-tb'; // 2D mode: horizontal text
  } else {
    measureDiv.style.whiteSpace = 'pre-wrap'; // 3D mode: wrapping allowed
    measureDiv.style.wordWrap = 'break-word';
    measureDiv.style.maxWidth = '400px';     // 3D mode: width limit
    measureDiv.style.overflowWrap = 'break-word';
    measureDiv.style.wordBreak = 'break-word';
  }

  measureDiv.textContent = text.content;

  // Add to DOM, measure, then remove
  document.body.appendChild(measureDiv);
  const width = measureDiv.offsetWidth;  // With border-box, this includes padding + border
  const height = measureDiv.offsetHeight; // With border-box, this includes padding + border
  document.body.removeChild(measureDiv);

  return { width, height };
}

// Calculate text bounding box accounting for distanceFactor and multi-line content
function calculateTextBounds(text: TextObject, is2DMode: boolean, isSelected: boolean = true) {
  // distanceFactor controls CSS pixel → world unit conversion
  // 2D mode: 2.5 (smaller scaling), 3D mode: 20 (larger scaling)
  const distanceFactor = is2DMode ? 2.5 : 20;

  // Measure actual text box dimensions INCLUDING padding and border
  // This gives us the EXACT rendered box size in CSS pixels
  const measured = measureTextDimensions(text, is2DMode, isSelected);
  let cssWidth = measured.width;
  let cssHeight = measured.height;

  // Convert CSS pixels to world units using distanceFactor
  // World units = CSS pixels / distanceFactor
  // No need to add padding/border - already included in measurement!
  let worldWidth = cssWidth / distanceFactor;
  let worldHeight = cssHeight / distanceFactor;

  const left = text.position.x - worldWidth / 2;
  const top = text.position.z - worldHeight / 2;

  return {
    left,
    top,
    width: worldWidth,
    height: worldHeight,
    center: { x: text.position.x, y: text.position.z },
    minX: left,
    minY: top,
    maxX: left + worldWidth,
    maxY: top + worldHeight,
  };
}

// Calculate handle positions
function calculateHandlePositions(bounds: ReturnType<typeof calculateTextBounds>, rotationDegrees: number = 0) {
  const { minX, maxX, minY, maxY } = bounds;

  // Calculate center point for rotation
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Handles are positioned exactly at the bounds corners (no offset)
  // Bounds include text dimensions + background padding + selection border

  // Helper function to rotate a point around the center
  const rotatePoint = (x: number, y: number): Point2D => {
    if (rotationDegrees === 0) return { x, y };

    const angleRad = (rotationDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Translate to origin
    const dx = x - centerX;
    const dy = y - centerY;

    // Rotate
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;

    // Translate back
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY,
    };
  };

  const corners = [
    rotatePoint(minX, minY), // Top-left
    rotatePoint(maxX, minY), // Top-right
    rotatePoint(maxX, maxY), // Bottom-right
    rotatePoint(minX, maxY), // Bottom-left
  ];

  return { corners };
}

export const TextTransformControls: React.FC<TextTransformControlsProps> = ({
  text,
  elevation = 0.01,
}) => {
  const { camera, raycaster, gl } = useThree();

  // Store actions
  const updateText = useTextStore(state => state.updateText);
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const saveToHistory = useAppStore(state => state.saveToHistory);
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);
  const cursorRotationMode = useAppStore(state => state.drawing.cursorRotationMode);

  // Local state
  const [hoveredHandle, setHoveredHandle] = useState<{ type: 'corner' | 'rotate' | 'drag'; index?: number } | null>(null);
  const [cursorOverride, setCursorOverride] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(text.rotation || 0);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Check if controls would overlap with panels
  const [shouldHideControls, setShouldHideControls] = useState(false);
  const { size } = useThree();

  // Panel dimensions
  const PANEL_WIDTH = 320;
  const HANDLE_BUFFER = 150; // Extra space needed for handles

  // Refs for drag state
  const shiftPressedRef = useRef(false);
  const angleRef = useRef(text.rotation || 0);
  const hasDraggedRef = useRef(false);

  const dragState = useRef({
    isDragging: false,
    dragType: null as 'move' | 'resize-corner' | 'rotate' | null,
    handleIndex: null as number | null,
    startPosition: null as Point2D | null,
    originalFontSize: text.fontSize,
    originalBounds: null as ReturnType<typeof calculateTextBounds> | null,
    startMouseAngle: 0,
    pointerId: null as number | null,
    lockedAxis: null as 'horizontal' | 'vertical' | null, // Feature 017: Shift axis-lock
  });

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  // Apply cursor to canvas
  useEffect(() => {
    if (cursorOverride) {
      gl.domElement.style.cursor = cursorOverride;
    } else {
      gl.domElement.style.cursor = '';
    }
    return () => {
      gl.domElement.style.cursor = '';
    };
  }, [cursorOverride, gl.domElement]);

  // Check if this text is selected and select tool is active
  const isActive = useMemo(() => {
    return selectedTextId === text.id && activeTool === 'select';
  }, [selectedTextId, text.id, activeTool]);

  // Calculate current text bounds (accounting for 2D/3D mode distanceFactor and selection border)
  // NOTE: Since bounds are ESTIMATED (not DOM-measured), we only recalculate when text properties change.
  // Camera position doesn't affect estimated bounds. See TEXT_BOUNDS_ESTIMATION_ISSUE.md for details.
  const textBounds = useMemo(() => {
    return calculateTextBounds(text, is2DMode, true);
  }, [
    text.position.x,
    text.position.z,
    text.fontSize,
    text.content,
    text.lineHeight,
    text.letterSpacing,
    text.backgroundColor,
    is2DMode
  ]);

  // Calculate handle positions (rotated based on text rotation)
  const handles = useMemo(() => calculateHandlePositions(textBounds, text.rotation || 0), [textBounds, text.rotation]);

  // Calculate rotation handle position (below textbox bounds, accounting for rotation)
  const rotationHandlePosition = useMemo(() => {
    const rotationHandleGap = 4.0; // Distance below bottom edge handle
    const centerX = (textBounds.minX + textBounds.maxX) / 2;
    const centerY = (textBounds.minY + textBounds.maxY) / 2;
    const bottomY = textBounds.maxY; // Bottom edge of text box

    // Rotate the handle position to follow the text rotation
    const rotation = text.rotation || 0;
    if (rotation !== 0) {
      const angleRad = (rotation * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);

      // Point below center (unrotated)
      const dx = 0; // Directly below center horizontally
      const dy = (bottomY - centerY) + rotationHandleGap; // Distance from center to below bottom edge

      // Rotate around center
      const rotatedX = dx * cos - dy * sin;
      const rotatedY = dx * sin + dy * cos;

      return {
        x: centerX + rotatedX,
        y: centerY + rotatedY,
        center: { x: centerX, y: centerY },
      };
    }

    // No rotation - simple positioning
    return {
      x: centerX,
      y: bottomY + rotationHandleGap,
      center: { x: centerX, y: centerY },
    };
  }, [textBounds, text.rotation]);

  /**
   * Pointer move handler for all transforms
   */
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (
      !dragState.current.isDragging ||
      !dragState.current.dragType ||
      (dragState.current.pointerId !== null && event.pointerId !== dragState.current.pointerId)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Convert mouse position to world coordinates
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const worldPoint: Point2D = { x: intersection.x, y: intersection.z };

      hasDraggedRef.current = true;

      // Handle different drag types
      if (dragState.current.dragType === 'move') {
        // Drag-to-move
        let targetX = worldPoint.x;
        let targetZ = worldPoint.y;  // worldPoint.y is Three.js Z (vertical on screen)

        // Feature 017: Apply axis-lock constraint if Shift is held
        if (dragState.current.startPosition && shiftPressedRef.current) {
          const offsetX = worldPoint.x - dragState.current.startPosition.x;
          const offsetY = worldPoint.y - dragState.current.startPosition.y;
          const absX = Math.abs(offsetX);
          const absY = Math.abs(offsetY);

          // Determine locked axis ONCE when movement exceeds threshold
          const threshold = 5; // 5 world units (meters)
          if (dragState.current.lockedAxis === null && (absX >= threshold || absY >= threshold)) {
            // First time exceeding threshold - determine which axis to lock
            dragState.current.lockedAxis = absX >= absY ? 'horizontal' : 'vertical';
          }

          // Apply axis-lock based on stored locked axis
          if (dragState.current.lockedAxis === 'horizontal') {
            // Horizontal movement - lock vertical axis
            targetZ = dragState.current.startPosition.y;
          } else if (dragState.current.lockedAxis === 'vertical') {
            // Vertical movement - lock horizontal axis
            targetX = dragState.current.startPosition.x;
          }
        }

        updateText(text.id, {
          position: {
            ...text.position,
            x: targetX,
            z: targetZ,
          }
        });
      } else if (dragState.current.dragType === 'resize-corner' && dragState.current.originalBounds) {
        // Corner resize - proportional scaling
        const dragDiagonal = Math.sqrt(
          Math.pow(worldPoint.x - dragState.current.originalBounds.center.x, 2) +
          Math.pow(worldPoint.y - dragState.current.originalBounds.center.y, 2)
        );
        const originalDiagonal = Math.sqrt(
          Math.pow(dragState.current.originalBounds.width / 2, 2) +
          Math.pow(dragState.current.originalBounds.height / 2, 2)
        );
        const scaleFactor = dragDiagonal / originalDiagonal;
        const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, dragState.current.originalFontSize * scaleFactor));
        updateText(text.id, { fontSize: newFontSize });
      } else if (dragState.current.dragType === 'rotate') {
        // Rotation
        const currentMouseAngle = calculateAngle(rotationHandlePosition.center, worldPoint);
        let rotationAngle = currentMouseAngle - dragState.current.startMouseAngle;
        rotationAngle = normalizeAngle(rotationAngle);

        const originalAngle = text.rotation || 0;
        let finalAngle = originalAngle + rotationAngle;

        if (shiftPressedRef.current) {
          finalAngle = snapAngleToIncrement(finalAngle, 45);
          finalAngle = normalizeAngle(finalAngle);
        }

        setCurrentAngle(finalAngle);
        angleRef.current = finalAngle;
        updateText(text.id, { rotation: finalAngle });
      }
    }
  }, [
    camera,
    raycaster,
    gl.domElement,
    groundPlane,
    text.id,
    text.position,
    text.rotation,
    rotationHandlePosition,
    updateText,
  ]);

  /**
   * Pointer up handler to finish drag
   */
  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (
      !dragState.current.isDragging ||
      (dragState.current.pointerId !== null && event.pointerId !== dragState.current.pointerId)
    ) {
      return;
    }

    if (hasDraggedRef.current) {
      logger.info('[TextTransformControls] Finishing transform', {
        textId: text.id,
        dragType: dragState.current.dragType,
      });

      // Save to history
      saveToHistory();
    }

    // Clean up drag state
    dragState.current.isDragging = false;
    dragState.current.dragType = null;
    dragState.current.handleIndex = null;
    dragState.current.originalBounds = null;
    dragState.current.pointerId = null;
    dragState.current.lockedAxis = null; // Feature 017: Reset axis-lock
    hasDraggedRef.current = false;

    setIsRotating(false);
    setCursorOverride(null);

    // Remove event listeners
    document.removeEventListener('pointermove', handlePointerMove, true);
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('pointercancel', handlePointerUp, true);
  }, [handlePointerMove, text.id, saveToHistory]);

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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Check overlap with panels on every frame
  useEffect(() => {
    const checkOverlap = () => {
      // TEMPORARY FIX: Disable overlap check in 2D mode
      // The aggressive buffer (470px each side) was hiding controls for most text positions
      if (is2DMode) {
        setShouldHideControls(false);
        return;
      }

      // Project 3D position to 2D screen coordinates
      const vector = new THREE.Vector3(text.position.x, text.position.y, text.position.z);
      vector.project(camera);

      // Behind camera
      if (vector.z > 1) {
        setShouldHideControls(true);
        return;
      }

      const screenX = (vector.x * 0.5 + 0.5) * size.width;

      // Check if too close to left edge (LayerPanel area)
      if (screenX < PANEL_WIDTH + HANDLE_BUFFER) {
        setShouldHideControls(true);
        return;
      }

      // Check if too close to right edge (PropertiesPanel area)
      if (screenX > size.width - (PANEL_WIDTH + HANDLE_BUFFER)) {
        setShouldHideControls(true);
        return;
      }

      setShouldHideControls(false);
    };

    checkOverlap();
    const interval = setInterval(checkOverlap, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [text.position, camera, size.width, is2DMode]);

  // Don't render if text is not selected, tool is not select, or would overlap panels
  if (!isActive || text.locked || shouldHideControls) {
    return null;
  }

  /**
   * Start drag-to-move
   */
  const startDrag = (event: any) => {
    event.stopPropagation();

    // For React events, access native event if available, otherwise use event directly
    const clientX = event.nativeEvent?.clientX ?? event.clientX;
    const clientY = event.nativeEvent?.clientY ?? event.clientY;
    const pointerId = event.nativeEvent?.pointerId ?? event.pointerId;

    logger.info('[TextTransformControls] Starting drag', { textId: text.id });

    // Capture start position in world coordinates for axis-lock calculation
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      dragState.current.startPosition = { x: intersection.x, y: intersection.z };
    }

    saveToHistory();

    dragState.current.isDragging = true;
    dragState.current.dragType = 'move';
    dragState.current.pointerId = pointerId;
    dragState.current.lockedAxis = null; // Feature 017: Reset axis-lock for new drag
    hasDraggedRef.current = false;

    setCursorOverride('grabbing');

    try {
      event.currentTarget.setPointerCapture(pointerId);
    } catch (error) {
      logger.warn('[TextTransformControls] Failed to capture pointer:', error);
    }

    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointercancel', handlePointerUp, true);
  };

  /**
   * Start corner resize
   */
  const startCornerResize = (index: number) => (event: any) => {
    event.stopPropagation();

    // For React events, access native event if available, otherwise use event directly
    const pointerId = event.nativeEvent?.pointerId ?? event.pointerId;

    logger.info('[TextTransformControls] Starting corner resize', {
      textId: text.id,
      handleIndex: index,
    });

    saveToHistory();

    dragState.current.isDragging = true;
    dragState.current.dragType = 'resize-corner';
    dragState.current.handleIndex = index;
    dragState.current.originalFontSize = text.fontSize;
    dragState.current.originalBounds = textBounds;
    dragState.current.pointerId = pointerId;
    hasDraggedRef.current = false;

    const cornerCursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize'];
    setCursorOverride(cornerCursors[index]);

    try {
      event.currentTarget.setPointerCapture(pointerId);
    } catch (error) {
      logger.warn('[TextTransformControls] Failed to capture pointer:', error);
    }

    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointercancel', handlePointerUp, true);
  };

  /**
   * Start rotation
   */
  const startRotation = (event: any) => {
    event.stopPropagation();
    event.preventDefault();

    // For React events, access native event if available, otherwise use event directly
    const clientX = event.nativeEvent?.clientX ?? event.clientX;
    const clientY = event.nativeEvent?.clientY ?? event.clientY;
    const pointerId = event.nativeEvent?.pointerId ?? event.pointerId;

    logger.info('[TextTransformControls] Starting rotation', {
      textId: text.id,
      currentRotation: text.rotation,
    });

    setIsRotating(true);

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const mousePoint: Point2D = { x: intersection.x, y: intersection.z };
      const mouseAngle = calculateAngle(rotationHandlePosition.center, mousePoint);

      saveToHistory();

      dragState.current.isDragging = true;
      dragState.current.dragType = 'rotate';
      dragState.current.startMouseAngle = mouseAngle;
      dragState.current.pointerId = pointerId;
      hasDraggedRef.current = false;

      setCursorOverride('grab');

      try {
        event.currentTarget.setPointerCapture(pointerId);
      } catch (error) {
        logger.warn('[TextTransformControls] Failed to capture pointer:', error);
      }

      document.addEventListener('pointermove', handlePointerMove, true);
      document.addEventListener('pointerup', handlePointerUp, true);
      document.addEventListener('pointercancel', handlePointerUp, true);
    }
  };

  return (
    <group name="text-transform-controls">
      {/* Drag area - Html overlay for text dragging (Html renders on top of meshes) */}
      <Html
        position={[text.position.x, elevation + 0.1, text.position.z]}
        center
        occlude={false}
        distanceFactor={is2DMode ? 2.5 : 20}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
          zIndex: tokens.zIndex.scene - 10, // Lower than handles
        }}
      >
        {(() => {
          // Calculate drag area dimensions (shrink slightly to avoid handle overlap)
          const distanceFactor = is2DMode ? 2.5 : 20;
          const handleSizePx = 4 + 1 + 1; // 4px diameter + 1px border on each side = 6px
          const shrinkPx = handleSizePx * 2; // Shrink by handle size on each side
          const dragWidth = Math.max(10, textBounds.width * distanceFactor - shrinkPx);
          const dragHeight = Math.max(10, textBounds.height * distanceFactor - shrinkPx);

          return (
            <div
              onPointerDown={startDrag}
              onPointerEnter={() => {
                // Only show grab cursor if not hovering over a handle
                if (!dragState.current.isDragging && !hoveredHandle) {
                  setCursorOverride('grab');
                }
              }}
              onPointerLeave={() => {
                if (!dragState.current.isDragging && !hoveredHandle) {
                  setCursorOverride(null);
                }
              }}
              style={{
                width: `${dragWidth}px`,
                height: `${dragHeight}px`,
                cursor: dragState.current.isDragging ? 'grabbing' : 'grab',
                // Invisible drag area
                backgroundColor: 'transparent',
                border: 'none',
                zIndex: 1, // Base layer
              }}
            />
          );
        })()}
      </Html>

      {/* Corner Handles - Proportional Scaling (Html for consistent sizing) */}
      {handles.corners.map((point, index) => {
        const isHovered = hoveredHandle?.type === 'corner' && hoveredHandle?.index === index;
        const cornerCursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize'];

        return (
          <Html
            key={`text-resize-corner-${index}`}
            position={[point.x, elevation + 0.35, point.y]}
            center // Center the HTML element at the position
            occlude={false}
            distanceFactor={is2DMode ? 2.5 : 20}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              zIndex: tokens.zIndex.scene,
            }}
          >
            <div
              onPointerDown={startCornerResize(index)}
              onPointerEnter={() => {
                setHoveredHandle({ type: 'corner', index });
                if (!dragState.current.isDragging) {
                  setCursorOverride(cornerCursors[index]);
                }
              }}
              onPointerLeave={() => {
                setHoveredHandle(null);
                if (!dragState.current.isDragging) {
                  setCursorOverride(null);
                }
              }}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isHovered ? '#CCCCCC' : '#FFFFFF',
                border: '2px solid #3B82F6',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                cursor: cornerCursors[index],
                transition: 'background-color 0.15s ease',
                zIndex: 10, // Above drag area
              }}
            />
          </Html>
        );
      })}

      {/* Rotation Handle - Hide when cursor rotation mode is active (RotationControls handles it) */}
      {!cursorRotationMode && (
        <Html
          position={[rotationHandlePosition.x, elevation + 0.4, rotationHandlePosition.y]}
          center // Always use center for handles (not sprite) for correct positioning
          occlude={false}
          distanceFactor={is2DMode ? 2.5 : 20}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            zIndex: tokens.zIndex.scene,
          }}
        >
          <div
            onPointerDown={startRotation}
            onPointerEnter={() => setCursorOverride('grab')}
            onPointerLeave={() => !isRotating && setCursorOverride(null)}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isRotating ? 'rgba(29, 78, 216, 0.95)' : 'rgba(34, 197, 94, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '8px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              transform: isRotating ? 'scale(1.1)' : 'scale(1)',
              zIndex: 10, // Above drag area
            }}
            title="Drag to rotate text"
          >
            ↻
          </div>
        </Html>
      )}

      {/* Angle Display - Show during rotation */}
      {isRotating && (
        <Html
          position={[text.position.x, elevation + 0.8, text.position.z]}
          center // Always use center for correct positioning
          occlude={false}
          distanceFactor={is2DMode ? 2.5 : 20}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: tokens.zIndex.scene,
          }}
        >
          <div
            style={{
              background: 'rgba(29, 78, 216, 0.95)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              border: '2px solid rgba(255,255,255,0.9)',
            }}
          >
            {Math.round(currentAngle)}°
            {isShiftPressed && (
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>⇧ 45°</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default TextTransformControls;
