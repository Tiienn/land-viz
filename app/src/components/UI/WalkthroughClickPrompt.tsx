import React, { useState, useEffect } from 'react';

/**
 * Visual prompt that appears when entering walkthrough mode
 * Instructs user to click to activate pointer lock
 */
export default function WalkthroughClickPrompt() {
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Listen directly to pointer lock changes for reliable hiding
  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement !== null;
      setIsPointerLocked(locked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Check initial state
    handlePointerLockChange();

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  // Hide when pointer is locked
  if (isPointerLocked) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '24px 32px',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '600',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        border: '2px solid rgba(0, 196, 204, 0.5)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        animation: 'pulse 2s ease-in-out infinite',
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖱️</div>
      <div>Click to activate</div>
      <div style={{ fontSize: '14px', fontWeight: '400', marginTop: '8px', opacity: 0.8 }}>
        Press ESC to exit
      </div>
    </div>
  );
}
