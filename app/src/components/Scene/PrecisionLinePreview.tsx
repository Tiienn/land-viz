import React, { useMemo, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Vector3 } from 'three';
import { Line } from '@react-three/drei';
import { calculateDirection, applyDistance } from '../../utils/precisionMath';
import { applyAngleConstraint } from '@/utils/shapeConstraints';
import type { Point2D } from '@/types';

export const PrecisionLinePreview: React.FC = () => {
  const lineToolState = useAppStore(state => state.drawing.lineTool);
  const gridSize = useAppStore(state => state.drawing.gridSize);
  const isShiftPressed = useAppStore(state => state.drawing.isShiftKeyPressed);

  // Match elevation with other drawing tools (DrawingFeedback.tsx uses 0.05)
  const elevation = 0.05;

  // Don't render if line tool is not active or not drawing
  if (!lineToolState.isActive || !lineToolState.isDrawing || !lineToolState.startPoint) {
    return null;
  }

  const startPoint3D = new Vector3(lineToolState.startPoint.x, elevation, lineToolState.startPoint.y);

  // Calculate end point based on distance input or cursor position
  let endPoint3D: Vector3;

  if (lineToolState.currentDistance && lineToolState.currentDistance > 0 && lineToolState.previewEndPoint) {
    // Use precise distance calculation
    let previewPoint = lineToolState.previewEndPoint;

    // Feature 017: Apply angle constraint if Shift is held
    if (isShiftPressed) {
      previewPoint = applyAngleConstraint(lineToolState.startPoint, lineToolState.previewEndPoint);
    }

    const direction = calculateDirection(lineToolState.startPoint, previewPoint);
    const preciseEndPoint = applyDistance(lineToolState.startPoint, direction, lineToolState.currentDistance);
    endPoint3D = new Vector3(preciseEndPoint.x, elevation, preciseEndPoint.y);
  } else if (lineToolState.previewEndPoint) {
    // Use cursor position
    let previewPoint = lineToolState.previewEndPoint;

    // Feature 017: Apply angle constraint if Shift is held
    if (isShiftPressed) {
      previewPoint = applyAngleConstraint(lineToolState.startPoint, lineToolState.previewEndPoint);
    }

    endPoint3D = new Vector3(previewPoint.x, elevation, previewPoint.y);
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
      firstPoint3D = new Vector3(firstPoint.x, elevation, firstPoint.y);
      const cursorPoint = new Vector3(lineToolState.previewEndPoint.x, elevation, lineToolState.previewEndPoint.y);
      const distanceToFirst = cursorPoint.distanceTo(firstPoint3D);
      const closeThreshold = Math.max(gridSize * 2.0, 4.0);
      isNearFirstPoint = distanceToFirst < closeThreshold;
    }
  }

  return (
    <group>
      {/* Render completed segments in multi-segment mode */}
      {lineToolState.isMultiSegment && lineToolState.segments.map((segment, index) => {
        const segmentStartPoint3D = new Vector3(segment.startPoint.x, elevation, segment.startPoint.y);
        const segmentEndPoint3D = new Vector3(segment.endPoint.x, elevation, segment.endPoint.y);

        // Calculate midpoint for the segment
        const midX = (segmentStartPoint3D.x + segmentEndPoint3D.x) / 2;
        const midZ = (segmentStartPoint3D.z + segmentEndPoint3D.z) / 2;
        const midpoint3D = new Vector3(midX, elevation, midZ);

        return (
          <group key={segment.id}>
            {/* Completed segment line - solid green, Canva-inspired */}
            <Line
              points={[segmentStartPoint3D, segmentEndPoint3D]}
              color="#22C55E"
              lineWidth={3}
              transparent
              opacity={0.95}
            />

            {/* Segment start point indicator */}
            {index === 0 && (
              <mesh position={[segmentStartPoint3D.x, segmentStartPoint3D.y + 0.2, segmentStartPoint3D.z]}>
                <sphereGeometry attach="geometry" args={[0.40, 32, 24]} />
                <meshBasicMaterial attach="material" color="#22C55E" transparent opacity={0.95} />
              </mesh>
            )}

            {/* Segment midpoint indicator */}
            <mesh position={[midpoint3D.x, midpoint3D.y + 0.2, midpoint3D.z]}>
              <sphereGeometry attach="geometry" args={[0.30, 32, 24]} />
              <meshBasicMaterial attach="material" color="#22C55E" transparent opacity={0.85} />
            </mesh>

            {/* Segment end point indicator - bigger and smoother */}
            <mesh position={[segmentEndPoint3D.x, segmentEndPoint3D.y + 0.2, segmentEndPoint3D.z]}>
              <sphereGeometry attach="geometry" args={[0.40, 32, 24]} />
              <meshBasicMaterial attach="material" color="#22C55E" transparent opacity={0.95} />
            </mesh>
          </group>
        );
      })}

      {/* Show closing preview when near first point */}
      {isNearFirstPoint && firstPoint3D ? (
        <group>
          {/* Current line to cursor - dashed, Canva-inspired */}
          <Line
            points={[startPoint3D, endPoint3D]}
            color="#00C4CC"
            lineWidth={3}
            transparent
            opacity={0.95}
            dashed
            dashSize={1.5}
            gapSize={1.2}
          />
          {/* Closing line preview - dashed, refined */}
          <Line
            points={[endPoint3D, firstPoint3D]}
            color="#00C4CC"
            lineWidth={3}
            transparent
            opacity={0.85}
            dashed
            dashSize={1.5}
            gapSize={1.2}
          />
          {/* First point highlight when close - larger with warning color */}
          <mesh position={[firstPoint3D.x, firstPoint3D.y + 0.2, firstPoint3D.z]}>
            <sphereGeometry attach="geometry" args={[0.55, 32, 24]} />
            <meshBasicMaterial attach="material" color="#F59E0B" transparent opacity={0.95} />
          </mesh>
        </group>
      ) : (
        /* Normal preview line - dashed, Canva-inspired */
        <Line
          points={[startPoint3D, endPoint3D]}
          color="#00C4CC"
          lineWidth={3}
          transparent
          opacity={0.95}
          dashed
          dashSize={1.5}
          gapSize={1.2}
        />
      )}

      {/* Start point indicator - bigger and smoother */}
      <mesh position={[startPoint3D.x, startPoint3D.y + 0.2, startPoint3D.z]}>
        <sphereGeometry attach="geometry" args={[0.45, 32, 24]} />
        <meshBasicMaterial attach="material" color="#00C4CC" transparent opacity={0.95} />
      </mesh>

      {/* End point indicator (cursor position) - bigger and visible */}
      {!isNearFirstPoint && (
        <mesh position={[endPoint3D.x, endPoint3D.y + 0.2, endPoint3D.z]}>
          <sphereGeometry attach="geometry" args={[0.35, 32, 24]} />
          <meshBasicMaterial attach="material" color="#EF4444" transparent opacity={0.95} />
        </mesh>
      )}
    </group>
  );
};

export default PrecisionLinePreview;