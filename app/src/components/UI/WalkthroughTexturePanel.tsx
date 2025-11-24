/**
 * Walkthrough Texture Panel
 *
 * Phase 3: AI Texture controls available during walkthrough mode
 * Allows changing terrain textures in real-time while exploring
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { TerrainType } from '@/services/boundaryDetection/types';

export default function WalkthroughTexturePanel() {
  const walkableBoundaries = useAppStore(state => state.walkableBoundaries);
  const updateWalkableBoundary = useAppStore(state => state.updateWalkableBoundary);

  const [isExpanded, setIsExpanded] = useState(false);
  const [terrainType, setTerrainType] = useState<TerrainType>('grass');
  const [enableAITexture, setEnableAITexture] = useState(false);
  const [aiTexturePrompt, setAITexturePrompt] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Release pointer lock when panel expands so user can interact with mouse
  // Also set a global flag to prevent PointerLockControls from re-locking on click
  useEffect(() => {
    if (isExpanded) {
      // Release pointer lock
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      // Set global flag to prevent pointer lock while panel is open
      document.body.setAttribute('data-texture-panel-open', 'true');
    } else {
      // Remove flag when panel closes
      document.body.removeAttribute('data-texture-panel-open');
    }

    return () => {
      // Cleanup on unmount
      document.body.removeAttribute('data-texture-panel-open');
    };
  }, [isExpanded]);

  // Sync state from first walkable boundary
  useEffect(() => {
    if (walkableBoundaries && walkableBoundaries.length > 0) {
      const boundary = walkableBoundaries[0];
      setTerrainType(boundary.terrainType);
      setEnableAITexture(boundary.enableAITexture);
      setAITexturePrompt(boundary.aiTexturePrompt || '');
    }
  }, [walkableBoundaries]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // But allow Enter to apply when in textarea
        if (e.code === 'Enter' && e.target instanceof HTMLTextAreaElement && isExpanded) {
          e.preventDefault();
          handleApply();
        }
        return;
      }

      switch (e.code) {
        case 'KeyT':
          e.preventDefault();
          setIsExpanded(prev => !prev);
          break;
        case 'Enter':
          if (isExpanded) {
            e.preventDefault();
            handleApply();
          }
          break;
        // Quick terrain type selection with number keys when panel is open
        case 'Digit1':
          if (isExpanded) {
            e.preventDefault();
            setTerrainType('grass');
          }
          break;
        case 'Digit2':
          if (isExpanded) {
            e.preventDefault();
            setTerrainType('concrete');
          }
          break;
        case 'Digit3':
          if (isExpanded) {
            e.preventDefault();
            setTerrainType('dirt');
          }
          break;
        case 'Digit4':
          if (isExpanded) {
            e.preventDefault();
            setTerrainType('gravel');
          }
          break;
        case 'Digit5':
          if (isExpanded) {
            e.preventDefault();
            setTerrainType('sand');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleApply = () => {
    if (!walkableBoundaries || walkableBoundaries.length === 0) return;

    setIsApplying(true);

    // Update all walkable boundaries with new texture settings
    walkableBoundaries.forEach(boundary => {
      updateWalkableBoundary(boundary.id, {
        terrainType,
        enableAITexture,
        aiTexturePrompt: enableAITexture ? aiTexturePrompt : undefined,
      });
    });

    // Brief feedback
    setTimeout(() => setIsApplying(false), 500);
  };

  // Don't render if no walkable boundaries
  if (!walkableBoundaries || walkableBoundaries.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        fontFamily: 'Nunito Sans, sans-serif',
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '10px 14px',
          borderRadius: '10px',
          border: 'none',
          background: isExpanded
            ? 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)'
            : 'rgba(255, 255, 255, 0.9)',
          color: isExpanded ? 'white' : '#333',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
        }}
      >
        <span>🎨</span>
        <span>Texture</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div
          style={{
            marginTop: '8px',
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            minWidth: '220px',
          }}
        >
          <div style={{ marginBottom: '12px', fontWeight: 600, color: '#333', fontSize: '14px' }}>
            Terrain Settings
          </div>

          {/* Terrain Type */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              Terrain Type
            </label>
            <select
              value={terrainType}
              onChange={(e) => setTerrainType(e.target.value as TerrainType)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '12px',
                background: 'white',
              }}
            >
              <option value="grass">🌿 Grass</option>
              <option value="concrete">🏗️ Concrete</option>
              <option value="dirt">🟤 Dirt</option>
              <option value="gravel">⚫ Gravel</option>
              <option value="sand">🏖️ Sand</option>
            </select>
          </div>

          {/* AI Texture Toggle */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#333',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={enableAITexture}
                onChange={(e) => setEnableAITexture(e.target.checked)}
                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span>✨ AI Texture</span>
              <span style={{ fontSize: '9px', color: '#999', marginLeft: 'auto' }}>Beta</span>
            </label>
          </div>

          {/* AI Texture Prompt */}
          {enableAITexture && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                Describe terrain
              </label>
              <textarea
                value={aiTexturePrompt}
                onChange={(e) => setAITexturePrompt(e.target.value)}
                placeholder="e.g., lush meadow with flowers..."
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '11px',
                  minHeight: '50px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {/* Apply Button */}
          <button
            onClick={handleApply}
            disabled={isApplying}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: isApplying
                ? '#ccc'
                : 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)',
              color: 'white',
              fontWeight: 600,
              cursor: isApplying ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            {isApplying ? '✓ Applied!' : '🔄 Apply Changes'}
          </button>

          <div style={{ fontSize: '10px', color: '#666', marginTop: '10px', padding: '8px', background: '#f5f5f5', borderRadius: '6px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Shortcuts:</div>
            <div>T - Close panel & resume walking</div>
            <div>1-5 - Quick terrain select</div>
            <div>Enter - Apply changes</div>
          </div>
          <div style={{ fontSize: '9px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
            Click scene to resume walking
          </div>
        </div>
      )}
    </div>
  );
}
