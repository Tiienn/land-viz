import React, { useMemo, useRef, useCallback } from 'react';
import { Sphere } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import type { Point2D } from '@/types';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { logger } from '../../utils/logger';

interface EditableShapeControlsProps {
  elevation?: number;
}

const EditableShapeControls: React.FC<EditableShapeControlsProps> = ({ elevation = 0.01 }) => {
  const { camera, raycaster, gl } = useThree();
  
  // Get edit state from store
  const { drawing, shapes, selectCorner, updateShapePointLive, convertRectangleToPolygonLive, saveToHistory } = useAppStore();

  // Find the shape being edited
  const editingShape = useMemo(() => {
    if (!drawing.isEditMode || !drawing.editingShapeId) return null;
    return shapes.find(shape => shape.id === drawing.editingShapeId) || null;
  }, [shapes, drawing.isEditMode, drawing.editingShapeId]);

  // Simple corner points for editing
  const cornerPoints = useMemo(() => {
    if (!editingShape || !editingShape.points) return [];
    
    // For rectangles, expand to 4 corners
    if (editingShape.type === 'rectangle' && editingShape.points.length === 2) {
      const [topLeft, bottomRight] = editingShape.points;
      return [
        { x: topLeft.x, y: topLeft.y },      // Top left
        { x: bottomRight.x, y: topLeft.y },  // Top right
        { x: bottomRight.x, y: bottomRight.y }, // Bottom right
        { x: topLeft.x, y: bottomRight.y }   // Bottom left
      ];
    }
    
    return editingShape.points;
  }, [editingShape]);

  // Persistent dragging state using useRef to survive re-renders
  const dragState = useRef({ 
    isDragging: false, 
    dragCornerIndex: null as number | null,
    originalPoints: null as Point2D[] | null 
  });
  
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!dragState.current.isDragging || dragState.current.dragCornerIndex === null) return;

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const newPoint: Point2D = { x: intersection.x, y: intersection.z };
      
      // Get fresh state and update WITHOUT saving to history during drag
      const state = useAppStore.getState();
      const currentShape = state.shapes.find(s => s.id === state.drawing.editingShapeId);
      
      if (currentShape && dragState.current.originalPoints) {
        const newPoints = [...dragState.current.originalPoints];
        newPoints[dragState.current.dragCornerIndex] = newPoint;
        
        // Use live update actions for real-time feedback
        logger.log('🔥 Live updating shape:', currentShape.id, 'point:', dragState.current.dragCornerIndex, 'new point:', newPoint);
        if (currentShape.type === 'rectangle' && currentShape.points.length === 2) {
          // For rectangles, convert to polygon with new points (live update)
          convertRectangleToPolygonLive(currentShape.id, newPoints);
        } else {
          // For polygons, update the specific point (live update)
          updateShapePointLive(currentShape.id, dragState.current.dragCornerIndex, newPoint);
        }
        logger.log('🔥 Live update complete for:', currentShape.id);
      }
    }
  }, [gl.domElement, raycaster, camera, groundPlane]);

  const handlePointerUp = useCallback(() => {
    if (dragState.current.isDragging) {
      // Save to history once at the end of drag operation
      saveToHistory();
      
      dragState.current.isDragging = false;
      dragState.current.dragCornerIndex = null;
      dragState.current.originalPoints = null;
      document.removeEventListener('pointermove', handlePointerMove as any);
      document.removeEventListener('pointerup', handlePointerUp as any);
    }
  }, [handlePointerMove, saveToHistory]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove as any);
      document.removeEventListener('pointerup', handlePointerUp as any);
    };
  }, []);


  if (!drawing.isEditMode || !editingShape || !cornerPoints.length) {
    return null;
  }

  return (
    <group>
      {/* Simple Corner Handles */}
      {cornerPoints.map((point, index) => {
        const isSelected = drawing.selectedCornerIndex === index;
        
        return (
          <Sphere
            key={`corner-${index}`}
            position={[point.x, elevation + 0.3, point.y]}
            args={[0.4]}
            onClick={(event) => {
              event.stopPropagation();
              selectCorner(isSelected ? null : index);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              selectCorner(index);
              
              // Store original points for drag operation
              if (editingShape) {
                let originalPoints = editingShape.points;
                
                // Expand rectangle to 4 corners if needed
                if (editingShape.type === 'rectangle' && editingShape.points.length === 2) {
                  const [topLeft, bottomRight] = editingShape.points;
                  originalPoints = [
                    { x: topLeft.x, y: topLeft.y },
                    { x: bottomRight.x, y: topLeft.y },
                    { x: bottomRight.x, y: bottomRight.y },
                    { x: topLeft.x, y: bottomRight.y }
                  ];
                }
                
                dragState.current.isDragging = true;
                dragState.current.dragCornerIndex = index;
                dragState.current.originalPoints = [...originalPoints];
                document.addEventListener('pointermove', handlePointerMove as any);
                document.addEventListener('pointerup', handlePointerUp as any);
              }
            }}
          >
            <meshBasicMaterial
              color={isSelected ? '#ff4444' : '#4488ff'}
              transparent
              opacity={0.8}
            />
          </Sphere>
        );
      })}
    </group>
  );
};

export default EditableShapeControls;