import React, { useMemo } from 'react';
import { Sphere } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import type { Point2D } from '@/types';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface EditableShapeControlsProps {
  elevation?: number;
}

const EditableShapeControls: React.FC<EditableShapeControlsProps> = ({ elevation = 0.01 }) => {
  const { camera, raycaster, gl } = useThree();
  
  // Get edit state from store
  const { drawing, shapes, selectCorner } = useAppStore();

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

  // Dragging state and handlers - completely imperative approach
  let dragState = { isDragging: false, dragCornerIndex: null as number | null };
  
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragState.isDragging || dragState.dragCornerIndex === null) return;

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const newPoint: Point2D = { x: intersection.x, y: intersection.z };
      
      // Get fresh state and update
      const state = useAppStore.getState();
      const currentShape = state.shapes.find(s => s.id === state.drawing.editingShapeId);
      
      if (currentShape) {
        if (currentShape.type === 'rectangle' && currentShape.points.length === 2) {
          // Convert to polygon for free-form editing
          const [topLeft, bottomRight] = currentShape.points;
          const currentPoints = [
            { x: topLeft.x, y: topLeft.y },
            { x: bottomRight.x, y: topLeft.y },
            { x: bottomRight.x, y: bottomRight.y },
            { x: topLeft.x, y: bottomRight.y }
          ];
          currentPoints[dragState.dragCornerIndex] = newPoint;
          state.convertRectangleToPolygon(currentShape.id, currentPoints);
        } else {
          // Direct point update for polygons
          state.updateShapePoint(currentShape.id, dragState.dragCornerIndex, newPoint);
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (dragState.isDragging) {
      dragState.isDragging = false;
      dragState.dragCornerIndex = null;
      document.removeEventListener('pointermove', handlePointerMove as any);
      document.removeEventListener('pointerup', handlePointerUp as any);
    }
  };

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
              dragState.isDragging = true;
              dragState.dragCornerIndex = index;
              document.addEventListener('pointermove', handlePointerMove as any);
              document.addEventListener('pointerup', handlePointerUp as any);
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