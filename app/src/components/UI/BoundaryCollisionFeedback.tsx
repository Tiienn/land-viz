/**
 * Boundary Collision Feedback
 *
 * Phase 2: Visual feedback when player hits walkable boundary edge
 * Shows a red vignette/flash effect at screen edges
 */

import { useState, useEffect } from 'react';

export default function BoundaryCollisionFeedback() {
  const [isColliding, setIsColliding] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleCollision = (event: Event) => {
      const customEvent = event as CustomEvent<{ wasConstrained: boolean }>;
      if (customEvent.detail.wasConstrained) {
        setIsColliding(true);
        setOpacity(0.4); // Flash intensity

        // Fade out
        setTimeout(() => setOpacity(0.2), 50);
        setTimeout(() => setOpacity(0.1), 100);
        setTimeout(() => {
          setOpacity(0);
          setIsColliding(false);
        }, 200);
      }
    };

    window.addEventListener('walkthrough-boundary-collision', handleCollision);
    return () => window.removeEventListener('walkthrough-boundary-collision', handleCollision);
  }, []);

  if (!isColliding && opacity === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        // Red vignette effect from edges
        background: `
          radial-gradient(
            ellipse at center,
            transparent 50%,
            rgba(239, 68, 68, ${opacity}) 100%
          )
        `,
        transition: 'opacity 100ms ease-out',
      }}
      aria-hidden="true"
    />
  );
}
