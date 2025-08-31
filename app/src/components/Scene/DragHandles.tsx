import React, { useCallback, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Html } from '@react-three/drei';
import type { Shape } from '@/types';

interface DragHandlesProps {
  shape: Shape;
  elevation?: number;
  isSelected: boolean;
}

const DragHandles: React.FC<DragHandlesProps> = ({ shape, elevation = 0.01, isSelected }) => {
  const updateShape = useAppStore(state => state.updateShape);
  const [isDragging, setIsDragging] = useState<number | null>(null);

  const handlePointerDown = useCallback((pointIndex: number, event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(pointIndex);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((pointIndex: number, event: React.PointerEvent) => {
    if (isDragging !== pointIndex) return;
    
    event.preventDefault();
    
    // Simple grid-based position update (we'll improve this with proper raycasting later)
    const sensitivity = 0.1;
    const deltaX = event.movementX * sensitivity;
    const deltaY = -event.movementY * sensitivity; // Invert Y for 3D space
    
    // Update the point position
    const newPoints = [...shape.points];
    newPoints[pointIndex] = { 
      x: newPoints[pointIndex].x + deltaX, 
      y: newPoints[pointIndex].y + deltaY 
    };
    
    updateShape(shape.id, { points: newPoints });
  }, [isDragging, shape.points, shape.id, updateShape]);

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (isDragging !== null) {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
      setIsDragging(null);
    }
  }, [isDragging]);

  // Only show handles for selected shapes with editable points
  if (!isSelected || !shape.points || shape.points.length === 0) {
    return null;
  }

  // Create handles for each point
  const handles = shape.points.map((point, index) => {
    const isCornerDragging = isDragging === index;
    
    return (
      <Html
        key={`handle-${index}`}
        position={[point.x, elevation + 0.1, point.y]}
        center
        distanceFactor={8}
        occlude="blending"
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            background: isCornerDragging ? '#ef4444' : '#3b82f6',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'grab',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: 'white',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            transform: isCornerDragging ? 'scale(1.3)' : 'scale(1)',
            zIndex: 1000
          }}
          onPointerDown={(e) => handlePointerDown(index, e)}
          onPointerMove={(e) => handlePointerMove(index, e)}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title={`Drag corner ${index + 1}`}
        >
          {index + 1}
        </div>
      </Html>
    );
  });

  // Add center handle for moving entire shape
  const centerPoint = shape.points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
  centerPoint.x /= shape.points.length;
  centerPoint.y /= shape.points.length;

  const centerHandle = (
    <Html
      key="center-handle"
      position={[centerPoint.x, elevation + 0.15, centerPoint.y]}
      center
      distanceFactor={10}
      occlude="blending"
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          background: 'rgba(59, 130, 246, 0.9)',
          border: '2px solid white',
          borderRadius: '4px',
          cursor: 'move',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: 'white',
          fontWeight: '600',
          transition: 'all 0.2s ease'
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // TODO: Implement whole shape dragging
        }}
        title="Move entire shape"
      >
        ⊕
      </div>
    </Html>
  );

  // Add resize handles for rectangles
  const resizeHandles = shape.type === 'rectangle' && shape.points.length === 2 ? (
    <>
      {/* Edge midpoint handles for resizing */}
      {(() => {
        const [p1, p2] = shape.points;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        return [
          // Top edge
          <Html
            key="resize-top"
            position={[midX, elevation + 0.12, minY]}
            center
            distanceFactor={6}
          >
            <div
              style={{
                width: '12px',
                height: '8px',
                background: '#10b981',
                border: '1px solid white',
                borderRadius: '2px',
                cursor: 'ns-resize',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
              }}
              title="Resize height"
            />
          </Html>,
          
          // Right edge
          <Html
            key="resize-right"
            position={[maxX, elevation + 0.12, midY]}
            center
            distanceFactor={6}
          >
            <div
              style={{
                width: '8px',
                height: '12px',
                background: '#10b981',
                border: '1px solid white',
                borderRadius: '2px',
                cursor: 'ew-resize',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
              }}
              title="Resize width"
            />
          </Html>,
          
          // Bottom edge
          <Html
            key="resize-bottom"
            position={[midX, elevation + 0.12, maxY]}
            center
            distanceFactor={6}
          >
            <div
              style={{
                width: '12px',
                height: '8px',
                background: '#10b981',
                border: '1px solid white',
                borderRadius: '2px',
                cursor: 'ns-resize',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
              }}
              title="Resize height"
            />
          </Html>,
          
          // Left edge
          <Html
            key="resize-left"
            position={[minX, elevation + 0.12, midY]}
            center
            distanceFactor={6}
          >
            <div
              style={{
                width: '8px',
                height: '12px',
                background: '#10b981',
                border: '1px solid white',
                borderRadius: '2px',
                cursor: 'ew-resize',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
              }}
              title="Resize width"
            />
          </Html>
        ];
      })()}
    </>
  ) : null;

  return (
    <group>
      {handles}
      {centerHandle}
      {resizeHandles}
    </group>
  );
};

export default DragHandles;