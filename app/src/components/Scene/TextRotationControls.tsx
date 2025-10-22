/**
 * TextRotationControls Component
 *
 * Phase 4C: Text as Layers - Text Element Rotation Operations
 *
 * Renders rotation handle for text elements with:
 * - Visual rotation handle (green circle above text, same as shapes)
 * - Drag to rotate around text center
 * - Shift key snaps to 45° increments
 * - Live preview during rotation
 * - Stores rotation in TextElement.rotation (0-360 degrees)
 */

import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Html, Line } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import type { TextElement, Point2D } from '@/types';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { logger } from '@/utils/logger';

interface TextRotationControlsProps {
  element: TextElement;
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

export const TextRotationControls: React.FC<TextRotationControlsProps> = ({
  element,
  elevation = 0.01,
}) => {
  const { camera, raycaster, gl } = useThree();

  // Store actions
  const updateElement = useAppStore(state => state.updateElement);
  const saveToHistory = useAppStore(state => state.saveToHistory);
  const selectedElementIds = useAppStore(state => state.selectedElementIds);
  const activeTool = useAppStore(state => state.drawing.activeTool);

  // Local state for rotation interaction
  const [isRotating, setIsRotating] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(element.rotation || 0);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [cursorOverride, setCursorOverride] = useState<string | null>(null);

  // Refs for immediate access
  const shiftPressedRef = useRef(false);
  const angleRef = useRef(element.rotation || 0);
  const hasDraggedRef = useRef(false);

  // Drag state
  const dragState = useRef({
    isDragging: false,
    startAngle: 0,
    startMouseAngle: 0,
    pointerId: null as number | null,
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

  // Check if this element is selected and select tool is active
  const isActive = useMemo(() => {
    return selectedElementIds.includes(element.id) && activeTool === 'select';
  }, [selectedElementIds, element.id, activeTool]);

  // Calculate rotation handle position (above the text center)
  const rotationHandlePosition = useMemo(() => {
    const textCenter = element.position;
    const handleOffset = 4.0; // Distance above text center

    return {
      x: textCenter.x,
      y: textCenter.y - handleOffset, // Negative because Y increases downward in 2D
      center: textCenter, // Use text position as rotation center
    };
  }, [element.position]);

  /**
   * Pointer move handler for live rotation
   */
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (
      !dragState.current.isDragging ||
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
      const mousePoint: Point2D = { x: intersection.x, y: intersection.z };
      const currentMouseAngle = calculateAngle(rotationHandlePosition.center, mousePoint);

      // Mark that actual dragging has occurred
      hasDraggedRef.current = true;

      // Calculate rotation angle relative to start
      let rotationAngle = currentMouseAngle - dragState.current.startMouseAngle;
      rotationAngle = normalizeAngle(rotationAngle);

      // Apply to original angle
      const originalAngle = element.rotation || 0;
      let finalAngle = originalAngle + rotationAngle;

      // Apply snapping if Shift is pressed
      if (shiftPressedRef.current) {
        finalAngle = snapAngleToIncrement(finalAngle, 45);
        finalAngle = normalizeAngle(finalAngle);
      }

      // Update display angle
      setCurrentAngle(finalAngle);
      angleRef.current = finalAngle;

      // Live preview: Update element rotation
      updateElement(element.id, { rotation: finalAngle });
    }
  }, [
    camera,
    raycaster,
    gl.domElement,
    groundPlane,
    rotationHandlePosition,
    element.id,
    element.rotation,
    updateElement,
  ]);

  /**
   * Pointer up handler to finish rotation
   */
  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (
      dragState.current.isDragging &&
      (dragState.current.pointerId === null || event.pointerId === dragState.current.pointerId)
    ) {
      // Commit final rotation to history ONLY if actual dragging occurred
      if (hasDraggedRef.current) {
        logger.info('[TextRotationControls] Finishing rotation', {
          elementId: element.id,
          oldAngle: element.rotation,
          newAngle: angleRef.current,
        });

        // Update element with final rotation and save to history
        updateElement(element.id, { rotation: angleRef.current });
        saveToHistory();
      }

      // Clean up drag state
      dragState.current.isDragging = false;
      dragState.current.pointerId = null;
      hasDraggedRef.current = false;

      setIsRotating(false);
      setCursorOverride(null);

      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      document.removeEventListener('pointercancel', handlePointerUp, true);
    }
  }, [handlePointerMove, element.id, element.rotation, updateElement, saveToHistory]);

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

  // Don't render if element is not selected or tool is not select
  if (!isActive) {
    return null;
  }

  /**
   * Start rotation on pointer down
   */
  const handleRotationStart = (event: any) => {
    event.stopPropagation();
    event.preventDefault();

    logger.info('[TextRotationControls] Starting rotation', {
      elementId: element.id,
      currentRotation: element.rotation,
    });

    setIsRotating(true);

    // Calculate initial mouse angle
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.nativeEvent.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const mousePoint: Point2D = { x: intersection.x, y: intersection.z };
      const mouseAngle = calculateAngle(rotationHandlePosition.center, mousePoint);

      // Set up drag state
      dragState.current.isDragging = true;
      dragState.current.startMouseAngle = mouseAngle;
      dragState.current.startAngle = element.rotation || 0;
      dragState.current.pointerId = event.nativeEvent.pointerId;
      hasDraggedRef.current = false;

      // Save initial state to history
      saveToHistory();

      // Set cursor
      setCursorOverride('grab');

      // Capture pointer
      try {
        event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
      } catch (error) {
        logger.warn('[TextRotationControls] Failed to capture pointer:', error);
      }

      // Add global listeners
      document.addEventListener('pointermove', handlePointerMove, true);
      document.addEventListener('pointerup', handlePointerUp, true);
      document.addEventListener('pointercancel', handlePointerUp, true);
    }
  };

  return (
    <group name="text-rotation-controls">
      {/* Rotation Handle - Positioned above text */}
      <Html
        position={[rotationHandlePosition.x, elevation + 0.3, rotationHandlePosition.y]}
        center
        sprite
        occlude={false}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
          zIndex: 1000,
        }}
      >
        <div
          onPointerDown={handleRotationStart}
          onPointerEnter={() => setCursorOverride('grab')}
          onPointerLeave={() => !isRotating && setCursorOverride(null)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isRotating
              ? 'rgba(29, 78, 216, 0.95)'
              : 'rgba(34, 197, 94, 0.95)', // Green like shapes
            border: '3px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            transform: isRotating ? 'scale(1.1)' : 'scale(1)',
          }}
          title="Drag to rotate text"
        >
          ↻
        </div>
      </Html>

      {/* Angle Display - Show during rotation */}
      {isRotating && (
        <Html
          position={[element.position.x, elevation + 0.8, element.position.y]}
          center
          sprite
          occlude={false}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1001,
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

export default TextRotationControls;
