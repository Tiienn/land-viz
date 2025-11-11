/**
 * Live Distance Label Component
 * Spec 013: Direct Dimension Input
 *
 * Displays distance from start point while dragging shapes
 *
 * PERFORMANCE OPTIMIZED: Shared RAF scheduler for cursor tracking
 */

import React, { useState, useEffect } from 'react';
import { useDimensionStore } from '@/store/useDimensionStore';
import { formatDistance } from '@/services/dimensionFormatter';
import { useRAFEventThrottle } from '@/hooks/useRAFThrottle';

const LiveDistanceLabel: React.FC = () => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const { isShowingDistance, distanceFromStart } = useDimensionStore(
    state => state.liveDistance
  );
  const { displayPrecision, preferredUnit } = useDimensionStore(
    state => state.precision
  );

  // Use shared RAF scheduler for cursor tracking (max 60fps)
  const handleMouseMove = useRAFEventThrottle<MouseEvent>(
    'live-distance-label-cursor',
    (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    },
    'normal' // Normal priority for UI feedback
  );

  // Add event listener
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  if (!isShowingDistance) return null;

  // Calculate position with offset (right and below cursor)
  const offset = { x: 20, y: 20 };
  let labelX = cursorPos.x + offset.x;
  let labelY = cursorPos.y + offset.y;

  // Clamp to viewport bounds
  const labelWidth = 100; // Approximate width
  const labelHeight = 30; // Approximate height

  if (labelX + labelWidth > window.innerWidth) {
    labelX = cursorPos.x - offset.x - labelWidth; // Show to left of cursor
  }

  if (labelY + labelHeight > window.innerHeight) {
    labelY = cursorPos.y - offset.y - labelHeight; // Show above cursor
  }

  // Ensure minimum distance from edges
  labelX = Math.max(10, Math.min(window.innerWidth - labelWidth - 10, labelX));
  labelY = Math.max(10, Math.min(window.innerHeight - labelHeight - 10, labelY));

  // Canva-inspired styling
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${labelX}px`,
    top: `${labelY}px`,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    color: '#FFFFFF',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'Nunito Sans, sans-serif',
    fontWeight: 600,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'none',
    zIndex: 10000,
    animation: 'fadeIn 150ms ease-in-out',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '14px'
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    letterSpacing: '0.3px'
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div style={containerStyle}>
        <span style={iconStyle}>📏</span>
        <span style={valueStyle}>
          {formatDistance(distanceFromStart, displayPrecision, preferredUnit)}
        </span>
      </div>
    </>
  );
};

export default LiveDistanceLabel;
