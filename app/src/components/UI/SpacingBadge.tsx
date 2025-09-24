import React, { useState, useEffect } from 'react';

interface SpacingBadgeProps {
  distance: number;
  unit: string;
}

export const SpacingBadge: React.FC<SpacingBadgeProps> = ({
  distance,
  unit
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const badgeStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    background: '#8B5CF6',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontFamily: 'Nunito Sans, sans-serif',
    fontWeight: 600,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    opacity: visible ? 1 : 0,
    transform: `scale(${visible ? 1 : 0.8})`,
    transition: 'all 200ms ease-out',
    userSelect: 'none',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 1000
  };

  // Format distance with appropriate precision
  const formatDistance = (value: number): string => {
    if (value < 0.01) return value.toExponential(2);
    if (value < 1) return value.toFixed(3);
    if (value < 10) return value.toFixed(2);
    if (value < 100) return value.toFixed(1);
    return value.toFixed(0);
  };

  return (
    <div style={badgeStyle}>
      {formatDistance(distance)}{unit}
    </div>
  );
};