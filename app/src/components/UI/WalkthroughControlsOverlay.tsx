import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { tokens } from '@/styles/tokens';

/**
 * WalkthroughControlsOverlay - Shows controls and instructions for walkthrough mode
 *
 * Features:
 * - Displays WASD movement controls
 * - Shows mouse look, jump, sprint instructions
 * - Auto-fades after 8 seconds (or on user interaction)
 * - Can be toggled on/off with H key
 * - Stores visibility preference in localStorage
 */

interface ControlItem {
  key: string;
  description: string;
  icon?: string;
}

const CONTROLS: ControlItem[] = [
  { key: 'W A S D', description: 'Move forward/left/backward/right', icon: '⌨️' },
  { key: 'Mouse', description: 'Look around (click to activate)', icon: '🖱️' },
  { key: 'Space', description: 'Jump', icon: '⬆️' },
  { key: 'Shift', description: 'Sprint (2x speed)', icon: '🏃' },
  { key: 'T', description: 'Toggle texture panel', icon: '🎨' },
  { key: 'Y', description: 'Toggle sky/atmosphere panel', icon: '🌤️' },
  { key: 'H', description: 'Toggle this help overlay', icon: '❓' },
  { key: 'ESC', description: 'Exit walkthrough mode', icon: '🚪' },
];

export default function WalkthroughControlsOverlay() {
  const viewMode = useAppStore(state => state.viewState?.viewMode);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [shouldAutoHide, setShouldAutoHide] = useState(true);

  // Check if user has seen this before
  useEffect(() => {
    const hasSeenBefore = localStorage.getItem('walkthrough-controls-seen');
    if (hasSeenBefore === 'true') {
      // Auto-minimize if user has seen before
      setIsMinimized(true);
      setShouldAutoHide(false);
    } else {
      // Mark as seen
      localStorage.setItem('walkthrough-controls-seen', 'true');
    }
  }, []);

  // Auto-hide after 8 seconds (only on first view)
  useEffect(() => {
    if (!shouldAutoHide || isMinimized) return;

    const timer = setTimeout(() => {
      setIsMinimized(true);
    }, 8000); // 8 seconds

    return () => clearTimeout(timer);
  }, [shouldAutoHide, isMinimized]);

  // Keyboard shortcut: H to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use e.code for consistent behavior during pointer lock
      if (e.code === 'KeyH') {
        // Don't toggle if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        e.preventDefault();

        // Toggle between expanded and minimized
        if (isMinimized) {
          setIsMinimized(false);
        } else {
          setIsMinimized(true);
        }
        setShouldAutoHide(false); // Disable auto-hide after manual toggle
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMinimized]);

  // Reset when entering walkthrough mode
  useEffect(() => {
    if (viewMode === '3d-walkthrough') {
      setIsVisible(true);
      const hasSeenBefore = localStorage.getItem('walkthrough-controls-seen') === 'true';
      if (!hasSeenBefore) {
        setIsMinimized(false);
        setShouldAutoHide(true);
      }
    }
  }, [viewMode]);

  // Don't render if not in walkthrough mode
  if (viewMode !== '3d-walkthrough') return null;

  // Don't render if explicitly hidden
  if (!isVisible) return null;

  // Minimized view (small button in top-left)
  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          top: '80px',
          left: '20px',
          background: 'rgba(30, 30, 30, 0.9)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          border: '2px solid rgba(124, 58, 237, 0.5)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(40, 40, 40, 0.95)';
          e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(30, 30, 30, 0.9)';
          e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)';
        }}
      >
        <span style={{ fontSize: '18px' }}>❓</span>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Controls (H)</span>
      </div>
    );
  }

  // Full overlay
  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '20px',
        background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        border: '2px solid rgba(124, 58, 237, 0.6)',
        zIndex: 1000,
        minWidth: '320px',
        maxWidth: '400px',
        backdropFilter: 'blur(10px)',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          🎮 Walkthrough Controls
        </h3>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
          title="Minimize (H)"
        >
          −
        </button>
      </div>

      {/* Controls List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {CONTROLS.map((control, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: '20px', minWidth: '24px' }}>{control.icon}</span>

            {/* Key */}
            <div
              style={{
                background: 'rgba(124, 58, 237, 0.2)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                minWidth: '70px',
                textAlign: 'center',
                fontFamily: 'monospace',
              }}
            >
              {control.key}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                flex: 1,
              }}
            >
              {control.description}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
        }}
      >
        {shouldAutoHide ? 'This message will auto-hide in a few seconds' : 'Press H to toggle this overlay'}
      </div>

      {/* Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
