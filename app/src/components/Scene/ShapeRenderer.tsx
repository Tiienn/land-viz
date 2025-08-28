import React, { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Line } from '@react-three/drei';
import { Vector3, Color } from 'three';
import type { Shape, Point2D } from '@/types';

interface ShapeRendererProps {
  elevation?: number;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({ elevation = 0.01 }) => {
  const shapes = useAppStore(state => state.shapes);
  const currentShape = useAppStore(state => state.drawing.currentShape);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);

  // Convert 2D points to 3D vectors for Three.js
  const convertPoints = (points: Point2D[]): Vector3[] => {
    return points.map(point => new Vector3(point.x, elevation, point.y));
  };

  // Render completed shapes
  const completedShapes = useMemo(() => {
    return shapes.map((shape: Shape) => {
      if (!shape.points || shape.points.length < 2) return null;

      const points3D = convertPoints(shape.points);
      const color = new Color(shape.color || '#3B82F6');

      // Close the shape if it's a polygon or rectangle
      if (shape.type === 'polygon' || shape.type === 'rectangle') {
        points3D.push(points3D[0]); // Close the shape
      }

      return (
        <Line
          key={shape.id}
          points={points3D}
          color={color}
          lineWidth={2}
          transparent
          opacity={shape.visible ? 1 : 0.3}
        />
      );
    }).filter(Boolean);
  }, [shapes, elevation]);

  // Render current shape being drawn
  const currentShapeRender = useMemo(() => {
    if (!isDrawing || !currentShape?.points || currentShape.points.length < 2) {
      return null;
    }

    const points3D = convertPoints(currentShape.points);
    const color = new Color(currentShape.color || '#3B82F6');

    return (
      <Line
        points={points3D}
        color={color}
        lineWidth={3}
        transparent
        opacity={0.7}
        dashed
        dashSize={0.5}
        gapSize={0.3}
      />
    );
  }, [isDrawing, currentShape, elevation]);

  return (
    <group>
      {completedShapes}
      {currentShapeRender}
    </group>
  );
};

export default ShapeRenderer;