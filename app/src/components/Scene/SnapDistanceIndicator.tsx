import React from 'react';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';

/**
 * Shows distance to active snap point with visual preview line
 * Provides precision feedback during drawing/editing
 */
export const SnapDistanceIndicator: React.FC = () => {
  const snapping = useAppStore(state => state.drawing.snapping);
  const cursorPosition = useAppStore(state => state.drawing.cursorPosition);
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);
  const dragState = useAppStore(state => state.dragState);
  const liveResizePoints = useAppStore(state => state.drawing.liveResizePoints);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);

  // CRITICAL FIX: Show during active drag/resize/draw operations
  // For resize: only show when actively dragging a resize handle (liveResizePoints !== null)
  // This prevents the badge from appearing on hover over handles
  const isActivelyResizing = liveResizePoints !== null;
  const isActiveOperation = isDrawing || dragState.isDragging || isActivelyResizing;
  if (!isActiveOperation) return null;

  // Only show for active snap points (not grid)
  const activeSnapPoint = snapping.config.enabled &&
                          snapping.activeSnapPoint &&
                          snapping.activeSnapPoint.type !== 'grid' &&
                          snapping.config.activeTypes?.has?.(snapping.activeSnapPoint.type)
    ? snapping.activeSnapPoint
    : null;

  // Don't show if no active snap
  if (!activeSnapPoint) return null;

  // Use drag position if dragging, otherwise cursor position
  const referencePosition = dragState.isDragging && dragState.currentPosition
    ? dragState.currentPosition
    : cursorPosition;

  if (!referencePosition) return null;

  // Calculate distance
  const distance = Math.sqrt(
    Math.pow(activeSnapPoint.position.x - referencePosition.x, 2) +
    Math.pow(activeSnapPoint.position.y - referencePosition.y, 2)
  );

  // Only show distance label if meaningful (> 0.1 units)
  const showDistanceLabel = distance > 0.1;

  // Format distance with appropriate precision
  const formattedDistance = distance < 10
    ? distance.toFixed(2)
    : distance.toFixed(1);

  // Get snap type label
  const typeLabel = activeSnapPoint.type.charAt(0).toUpperCase() + activeSnapPoint.type.slice(1);

  // Determine indicator color based on snap state
  // Green when actively snapped (distance < 0.1), teal when nearby
  const isSnapped = distance < 0.1;
  const indicatorColor = isSnapped ? 'rgba(34, 197, 94, 0.95)' : 'rgba(0, 196, 204, 0.95)';
  const indicatorText = isSnapped ? 'SNAPPED' : typeLabel;

  return (
    <>
      {/* Distance label (only show if not snapped) - ENLARGED FOR VISIBILITY */}
      {showDistanceLabel && (
        <Html
          position={[activeSnapPoint.position.x, is2DMode ? 0.01 : 0.05, activeSnapPoint.position.y]}
          center
          distanceFactor={is2DMode ? 0.3 : 10}
          zIndexRange={[100, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: indicatorColor,
              color: '#ffffff',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '28px',
              fontFamily: '"Nunito Sans", system-ui, sans-serif',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              transform: 'translateY(-60px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              border: '4px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Distance */}
            <div style={{ fontSize: '32px', fontWeight: 900 }}>
              {formattedDistance}m
            </div>
            {/* Snap type */}
            <div style={{ fontSize: '18px', opacity: 0.95, textTransform: 'uppercase', letterSpacing: '2px' }}>
              {indicatorText}
            </div>
          </div>
        </Html>
      )}

      {/* Snap confirmation indicator (always show when active) - ENLARGED FOR VISIBILITY */}
      {isSnapped && (
        <Html
          position={[activeSnapPoint.position.x, is2DMode ? 0.01 : 0.05, activeSnapPoint.position.y]}
          center
          distanceFactor={is2DMode ? 0.3 : 10}
          zIndexRange={[100, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.98)',  // Bright green for snapped
              color: '#ffffff',
              padding: '20px 40px',
              borderRadius: '16px',
              fontSize: '36px',
              fontFamily: '"Nunito Sans", system-ui, sans-serif',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.6)',
              transform: 'translateY(-80px)',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              animation: 'pulse 1s ease-in-out infinite',
              border: '5px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            ✓ {indicatorText}
          </div>
        </Html>
      )}
    </>
  );
};
