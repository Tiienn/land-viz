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

  // PERFORMANCE OPTIMIZATION: Select individual values to avoid object creation
  // This prevents the "getSnapshot should be cached" warning and infinite loops
  const isEditMode = useAppStore(state => state.drawing.isEditMode);
  const editingShapeId = useAppStore(state => state.drawing.editingShapeId);
  const shapes = useAppStore(state => state.shapes);
  const selectedCornerIndex = useAppStore(state => state.drawing.selectedCornerIndex);

  const selectCorner = useAppStore(state => state.selectCorner);
  const updateShapePointLive = useAppStore(state => state.updateShapePointLive);
  const convertRectangleToPolygonLive = useAppStore(state => state.convertRectangleToPolygonLive);
  const saveToHistory = useAppStore(state => state.saveToHistory);

  // Find the shape being edited
  const editingShape = useMemo(() => {
    if (!isEditMode || !editingShapeId) return null;
    return shapes.find(shape => shape.id === editingShapeId) || null;
  }, [shapes, isEditMode, editingShapeId]);

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

  // Track cleanup function to prevent memory leaks
  const cleanupRef = useRef<(() => void) | null>(null);

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  const handlePointerMove = useCallback((event: PointerEvent | MouseEvent) => {
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

      // Clean up event listeners
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      cleanupRef.current = null; // Clear cleanup ref
    }
  }, [handlePointerMove, saveToHistory]);

  // MEMORY LEAK FIX: Cleanup on unmount using ref
  React.useEffect(() => {
    return () => {
      // Call cleanup if it exists (removes listeners added during drag)
      cleanupRef.current?.();
    };
  }, []);


  if (!isEditMode || !editingShape || !cornerPoints.length) {
    return null;
  }

  return (
    <group>
      {/* Simple Corner Handles */}
      {cornerPoints.map((point, index) => {
        const isSelected = selectedCornerIndex === index;
        
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

                // Add event listeners
                document.addEventListener('pointermove', handlePointerMove);
                document.addEventListener('pointerup', handlePointerUp);

                // MEMORY LEAK FIX: Store cleanup function for unmount
                cleanupRef.current = () => {
                  document.removeEventListener('pointermove', handlePointerMove);
                  document.removeEventListener('pointerup', handlePointerUp);
                };
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