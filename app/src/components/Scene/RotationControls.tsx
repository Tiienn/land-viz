import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import type { Point2D } from '@/types';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

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

const RotationControls: React.FC<RotationControlsProps> = ({ elevation = 0.01 }) => {
  const { camera, raycaster, gl } = useThree();
  
  // Get rotation state from store
  const drawing = useAppStore(state => state.drawing);
  const shapes = useAppStore(state => state.shapes);
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const selectedShapeId = useAppStore(state => state.selectedShapeId);
  const enterRotateMode = useAppStore(state => state.enterRotateMode);
  const rotateShape = useAppStore(state => state.rotateShape);
  
  // Get global drag state to handle shape dragging transforms
  const globalDragState = useAppStore(state => state.dragState);
  
  // Local state for rotation interaction
  const [isRotating, setIsRotating] = React.useState(false);
  const [currentAngle, setCurrentAngle] = React.useState(0);
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);
  const [cursorOverride, setCursorOverride] = React.useState<string | null>(null);
  
  // Use ref to track shift state immediately (avoids stale closure issues)
  const shiftPressedRef = useRef(false);
  
  // Dragging state
  const dragState = useRef({
    isDragging: false,
    startAngle: 0,
    startMouseAngle: 0,
    originalRotation: 0,
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

  // Find the shape being rotated or show rotation handle for selected shape
  const targetShape = useMemo(() => {
    if (drawing.isRotateMode && drawing.rotatingShapeId) {
      return shapes.find(shape => shape.id === drawing.rotatingShapeId) || null;
    }
    
    // Show rotation handle for selected shape (when not in edit or drawing modes)
    if (selectedShapeId && activeTool === 'select' && 
        !drawing.isEditMode && !drawing.isDrawing) {
      return shapes.find(shape => shape.id === selectedShapeId) || null;
    }
    
    return null;
  }, [shapes, drawing.isRotateMode, drawing.rotatingShapeId, selectedShapeId, activeTool, drawing.isEditMode, drawing.isDrawing]);

  // Calculate rotation handle position with transforms applied
  const rotationHandlePosition = useMemo(() => {
    if (!targetShape) return null;
    
    // Apply the same transform logic as ShapeRenderer
    let renderPoints = targetShape.points;
    if (targetShape.type === 'rectangle' && targetShape.points.length === 2) {
      // Convert 2-point format to 4-point format for center calculation
      const [topLeft, bottomRight] = targetShape.points;
      renderPoints = [
        { x: topLeft.x, y: topLeft.y },      // Top left
        { x: bottomRight.x, y: topLeft.y },  // Top right
        { x: bottomRight.x, y: bottomRight.y }, // Bottom right
        { x: topLeft.x, y: bottomRight.y }   // Bottom left
      ];
    }
    
    // SIMPLIFIED: Apply transforms in correct order: rotate first, then drag
    let transformedPoints = renderPoints;
    
    // Apply drag offset if shape is being dragged
    const isBeingDragged = globalDragState.isDragging && globalDragState.draggedShapeId === targetShape.id;
    if (isBeingDragged && globalDragState.startPosition && globalDragState.currentPosition) {
      const offsetX = globalDragState.currentPosition.x - globalDragState.startPosition.x;
      const offsetY = globalDragState.currentPosition.y - globalDragState.startPosition.y;
      
      // First apply rotation to original points (if any)
      let rotatedPoints = renderPoints;
      if (targetShape.rotation && targetShape.rotation.angle !== 0) {
        const { angle, center } = targetShape.rotation;
        const angleRadians = (angle * Math.PI) / 180;
        const cos = Math.cos(angleRadians);
        const sin = Math.sin(angleRadians);
        
        rotatedPoints = renderPoints.map(point => {
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
        
        transformedPoints = renderPoints.map(point => {
          const dx = point.x - center.x;
          const dy = point.y - center.y;
          
          return {
            x: center.x + (dx * cos - dy * sin),
            y: center.y + (dx * sin + dy * cos)
          };
        });
      } else {
        transformedPoints = renderPoints;
      }
    }
    
    const center = calculateShapeCenter({...targetShape, points: transformedPoints});
    
    // Position handle below the shape and area text
    const handleOffset = 4.0; // Distance below shape center (increased to clear area text)
    return {
      x: center.x,
      y: center.y + handleOffset,
      center: center
    };
  }, [targetShape, globalDragState]);

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
      
      // Calculate rotation angle relative to start
      let rotationAngle = currentMouseAngle - dragState.current.startMouseAngle;
      rotationAngle = normalizeAngle(rotationAngle);
      
      // Apply snapping if Shift is pressed - snap to nearest 45-degree increment
      const finalAngle = dragState.current.originalRotation + rotationAngle;
      let angleToUse = finalAngle;
      
      // Use ref for immediate shift state (not stale closure)
      const currentlyShiftPressed = shiftPressedRef.current;
      
      if (currentlyShiftPressed) {
        // Snap to nearest 45-degree increment: 0°, ±45°, ±90°, ±135°, 180°
        angleToUse = snapAngleToIncrement(finalAngle, 45);
        
        // Normalize the snapped angle to ensure it's in the correct range
        angleToUse = normalizeAngle(angleToUse);
      }
      
      // Update the display angle and apply to shape
      setCurrentAngle(angleToUse);
      rotateShape(targetShape.id, angleToUse, rotationHandlePosition.center);
    }
  }, [targetShape, rotationHandlePosition, gl.domElement, camera, raycaster, groundPlane, isShiftPressed, rotateShape]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (dragState.current.isDragging && 
        (dragState.current.pointerId === null || event.pointerId === dragState.current.pointerId)) {
      
      // Clean up drag state
      dragState.current.isDragging = false;
      dragState.current.pointerId = null;
      
      setIsRotating(false);
      setCursorOverride(null);
      
      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      document.removeEventListener('pointercancel', handlePointerUp, true);
    }
  }, [handlePointerMove]);

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
    
    // Enter rotation mode if not already in it
    if (!drawing.isRotateMode) {
      enterRotateMode(targetShape.id);
    }
    
    setIsRotating(true);
    
    // Calculate initial angles
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
      dragState.current.originalRotation = targetShape.rotation?.angle || 0;
      dragState.current.pointerId = event.nativeEvent.pointerId;
      
      setCurrentAngle(dragState.current.originalRotation);
      setCursorOverride('grab');
      
      // Capture pointer
      event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
      
      // Add global listeners
      document.addEventListener('pointermove', handlePointerMove, true);
      document.addEventListener('pointerup', handlePointerUp, true);
      document.addEventListener('pointercancel', handlePointerUp, true);
    }
  };

  return (
    <group>
      {/* Rotation Handle - Positioned below shape */}
      <Html
        position={[rotationHandlePosition.x, elevation + 0.3, rotationHandlePosition.y]}
        center
        sprite
        occlude={false}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
          zIndex: 1000
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
            backgroundColor: drawing.isRotateMode ? 'rgba(29, 78, 216, 0.95)' : 'rgba(34, 197, 94, 0.95)',
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
          title="Drag to rotate shape"
        >
          ↻
        </div>
      </Html>

      {/* Angle Display - Show during rotation */}
      {isRotating && (
        <Html
          position={[rotationHandlePosition.center.x, elevation + 0.8, rotationHandlePosition.center.y]}
          center
          sprite
          occlude={false}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1001
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
    </group>
  );
};

export default RotationControls;