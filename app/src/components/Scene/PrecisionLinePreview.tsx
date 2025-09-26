import React, { useMemo, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Vector3 } from 'three';
import { Line } from '@react-three/drei';
import { calculateDirection, applyDistance } from '../../utils/precisionMath';
import type { Point2D } from '@/types';

export const PrecisionLinePreview: React.FC = () => {
  const lineToolState = useAppStore(state => state.drawing.lineTool);
  const gridSize = useAppStore(state => state.drawing.gridSize);

  // Don't render if line tool is not active or not drawing
  if (!lineToolState.isActive || !lineToolState.isDrawing || !lineToolState.startPoint) {
    return null;
  }

  const startPoint3D = new Vector3(lineToolState.startPoint.x, 0, lineToolState.startPoint.y);

  // Calculate end point based on distance input or cursor position
  let endPoint3D: Vector3;

  if (lineToolState.currentDistance && lineToolState.currentDistance > 0 && lineToolState.previewEndPoint) {
    // Use precise distance calculation
    const direction = calculateDirection(lineToolState.startPoint, lineToolState.previewEndPoint);
    const preciseEndPoint = applyDistance(lineToolState.startPoint, direction, lineToolState.currentDistance);
    endPoint3D = new Vector3(preciseEndPoint.x, 0, preciseEndPoint.y);
  } else if (lineToolState.previewEndPoint) {
    // Use cursor position
    endPoint3D = new Vector3(lineToolState.previewEndPoint.x, 0, lineToolState.previewEndPoint.y);
  } else {
    // Default to start point (no preview)
    return null;
  }

  // Check if we're in multi-segment mode and close to the first point for closing preview
  let isNearFirstPoint = false;
  let firstPoint3D: Vector3 | null = null;

  if (lineToolState.isMultiSegment && lineToolState.segments.length >= 2 && lineToolState.previewEndPoint) {
    const firstPoint = lineToolState.segments.length > 0
      ? lineToolState.segments[0].startPoint
      : lineToolState.startPoint;

    if (firstPoint) {
      firstPoint3D = new Vector3(firstPoint.x, 0, firstPoint.y);
      const cursorPoint = new Vector3(lineToolState.previewEndPoint.x, 0, lineToolState.previewEndPoint.y);
      const distanceToFirst = cursorPoint.distanceTo(firstPoint3D);
      const closeThreshold = Math.max(gridSize * 2.0, 4.0);
      isNearFirstPoint = distanceToFirst < closeThreshold;
    }
  }

  return (
    <group>
      {/* Render completed segments in multi-segment mode */}
      {lineToolState.isMultiSegment && lineToolState.segments.map((segment, index) => {
        const startPoint3D = new Vector3(segment.startPoint.x, 0, segment.startPoint.y);
        const endPoint3D = new Vector3(segment.endPoint.x, 0, segment.endPoint.y);

        return (
          <group key={segment.id}>
            {/* Completed segment line - solid green */}
            <Line
              points={[startPoint3D, endPoint3D]}
              color="#10b981"
              lineWidth={3}
              transparent
              opacity={0.8}
            />

            {/* Segment end point indicator */}
            <mesh position={[endPoint3D.x, endPoint3D.y + 0.15, endPoint3D.z]}>
              <sphereGeometry attach="geometry" args={[0.12, 8, 6]} />
              <meshBasicMaterial attach="material" color="#10b981" transparent opacity={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Show closing preview when near first point */}
      {isNearFirstPoint && firstPoint3D ? (
        <group>
          {/* Current line to cursor - dashed */}
          <Line
            points={[startPoint3D, endPoint3D]}
            color="#3b82f6"
            lineWidth={2}
            transparent
            opacity={0.6}
            dashed
            dashSize={0.3}
            gapSize={0.2}
          />
          {/* Closing line preview - dashed */}
          <Line
            points={[endPoint3D, firstPoint3D]}
            color="#3b82f6"
            lineWidth={2}
            transparent
            opacity={0.6}
            dashed
            dashSize={0.3}
            gapSize={0.2}
          />
          {/* First point highlight when close */}
          <mesh position={[firstPoint3D.x, firstPoint3D.y + 0.15, firstPoint3D.z]}>
            <sphereGeometry attach="geometry" args={[0.15, 8, 6]} />
            <meshBasicMaterial attach="material" color="#f59e0b" transparent opacity={0.8} />
          </mesh>
        </group>
      ) : (
        /* Normal preview line - dashed */
        <Line
          points={[startPoint3D, endPoint3D]}
          color="#3b82f6"
          lineWidth={2}
          transparent
          opacity={0.6}
          dashed
          dashSize={0.3}
          gapSize={0.2}
        />
      )}

      {/* Start point indicator */}
      <mesh position={[startPoint3D.x, startPoint3D.y + 0.1, startPoint3D.z]}>
        <sphereGeometry attach="geometry" args={[0.1, 8, 6]} />
        <meshBasicMaterial attach="material" color="#3b82f6" transparent opacity={0.8} />
      </mesh>

      {/* End point indicator (cursor position) - only if not showing closing preview */}
      {!isNearFirstPoint && (
        <mesh position={[endPoint3D.x, endPoint3D.y + 0.1, endPoint3D.z]}>
          <sphereGeometry attach="geometry" args={[0.08, 8, 6]} />
          <meshBasicMaterial attach="material" color="#ef4444" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

export default PrecisionLinePreview;