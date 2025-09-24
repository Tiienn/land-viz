/**
 * Simple Alignment Guides Component for 3D Scene
 * Displays purple dashed lines for shape alignment (Canva-style)
 */

import React, { useMemo } from 'react';
import { Line, Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '../../store/useAppStore';
import type { AlignmentGuide, SpacingMeasurement } from '../../services/simpleAlignment';

interface SimpleAlignmentGuidesProps {
  guides?: AlignmentGuide[];
}

export const SimpleAlignmentGuides: React.FC<SimpleAlignmentGuidesProps> = ({ guides: propGuides }) => {
  const { camera } = useThree();

  // Get guides and spacings from store if not provided as props
  const storeGuides = useAppStore(state => state.drawing.alignment?.activeGuides || []);
  const storeSpacings = useAppStore(state => state.drawing.alignment?.activeSpacings || []);
  const snapPosition = useAppStore(state => state.drawing.alignment?.snapPosition);
  const isDragging = useAppStore(state => state.dragState.isDragging);
  const guides = propGuides || storeGuides;

  // Calculate scale factor based on camera distance for consistent sizing (same as ShapeDimensions)
  const scaleInfo = useMemo(() => {
    // Get camera distance from ground plane
    const cameraHeight = camera.position.y;

    // Base sizes that look good at reference distance
    const baseFontSize = 14;
    const referenceHeight = 30; // Reference camera height

    // Scale inversely with camera height (higher = smaller text)
    // Use smooth scaling to prevent jarring transitions
    const scale = Math.max(0.4, Math.min(2.0, referenceHeight / cameraHeight));

    return {
      fontSize: Math.round(baseFontSize * scale),
      padding: Math.max(3, Math.round(4 * scale))
    };
  }, [camera.position.y]); // Only depend on Y position for consistent scaling

  if (!guides || guides.length === 0) {
    // Only show spacings if we have them but no guides
    if (storeSpacings.length === 0) return null;
  }

  return (
    <group>
      {/* Render alignment guide lines */}
      {guides?.map(guide => {
        // Convert 2D screen coordinates to 3D world coordinates
        // For now, we'll draw on the ground plane (y=0.1 to be slightly above ground)
        const y = 0.1; // Slightly above the ground

        if (guide.type === 'vertical') {
          // Vertical line: fixed X position, line from start Z to end Z
          const points = [
            [guide.position, y, guide.start],
            [guide.position, y, guide.end]
          ];

          return (
            <Line
              key={guide.id}
              points={points}
              color="#8B5CF6" // Purple color like Canva
              lineWidth={2}
              dashed={true}
              dashScale={5}
              dashSize={2}
              dashOffset={0}
              gapSize={2}
            />
          );
        } else {
          // Horizontal line: line from start X to end X, fixed Z position
          const points = [
            [guide.start, y, guide.position],
            [guide.end, y, guide.position]
          ];

          return (
            <Line
              key={guide.id}
              points={points}
              color="#8B5CF6" // Purple color like Canva
              lineWidth={2}
              dashed={true}
              dashScale={5}
              dashSize={2}
              dashOffset={0}
              gapSize={2}
            />
          );
        }
      })}

      {/* Render spacing measurement badges */}
      {storeSpacings?.map(spacing => (
        <Html
          key={spacing.id}
          position={[spacing.position.x, 0.5, spacing.position.y]} // Slightly higher than guides
          center
          sprite
          occlude={false}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: spacing.isEqualDistribution
                ? 'rgba(139, 92, 246, 0.95)' // Purple for equal distribution
                : spacing.isSnappable
                  ? 'rgba(59, 130, 246, 0.9)' // Blue when close to equal
                  : 'rgba(30, 30, 30, 0.85)', // Default dark
              color: 'white',
              padding: `${scaleInfo.padding}px ${scaleInfo.padding * 2}px`,
              borderRadius: `${Math.max(4, scaleInfo.padding)}px`,
              fontSize: `${scaleInfo.fontSize}px`,
              fontWeight: '700',
              whiteSpace: 'nowrap',
              boxShadow: spacing.isEqualDistribution
                ? '0 4px 16px rgba(139, 92, 246, 0.5)' // Purple glow
                : '0 3px 12px rgba(0,0,0,0.4)',
              border: spacing.isEqualDistribution
                ? '2px solid #a78bfa' // Light purple border
                : spacing.isSnappable
                  ? '2px solid #60a5fa' // Light blue border
                  : '2px solid rgba(255,255,255,0.2)',
              opacity: spacing.isEqualDistribution ? 1 : 0.9,
              transform: spacing.isEqualDistribution ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }}
          >
            {Math.round(spacing.distance)}m
            {spacing.targetSpacing && !spacing.isEqualDistribution && (
              <span style={{
                fontSize: `${Math.round(scaleInfo.fontSize * 0.8)}px`,
                opacity: 0.8,
                marginLeft: '4px'
              }}>
                (→{Math.round(spacing.targetSpacing)}m)
              </span>
            )}
          </div>
        </Html>
      ))}

      {/* Phase 4: Preview snap position guide */}
      {snapPosition && isDragging && (
        <group>
          {/* Snap position indicator - small cross */}
          <Line
            points={[
              [snapPosition.x - 1, 0.15, snapPosition.y],
              [snapPosition.x + 1, 0.15, snapPosition.y]
            ]}
            color="#10B981" // Green color for snap preview
            lineWidth={3}
            transparent
            opacity={0.8}
          />
          <Line
            points={[
              [snapPosition.x, 0.15, snapPosition.y - 1],
              [snapPosition.x, 0.15, snapPosition.y + 1]
            ]}
            color="#10B981" // Green color for snap preview
            lineWidth={3}
            transparent
            opacity={0.8}
          />

          {/* Snap position badge */}
          <Html
            position={[snapPosition.x, 0.6, snapPosition.y]}
            center
            sprite
            occlude={false}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 1100
            }}
          >
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.95)', // Green background
                color: 'white',
                padding: `${scaleInfo.padding}px ${scaleInfo.padding * 2}px`,
                borderRadius: `${Math.max(4, scaleInfo.padding)}px`,
                fontSize: `${scaleInfo.fontSize}px`,
                fontWeight: '700',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.5)',
                border: '2px solid #34d399',
                transform: 'scale(1.1)',
                transition: 'all 0.2s ease'
              }}
            >
              SNAP
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};

export default SimpleAlignmentGuides;