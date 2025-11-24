/**
 * Walkthrough Sky Panel
 *
 * Controls for sky/atmosphere settings during walkthrough mode
 * Allows changing time of day, clouds, stars, and fog
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export type SkyType = 'day' | 'sunset' | 'night' | 'overcast';

export interface SkySettings {
  skyType: SkyType;
  enableClouds: boolean;
  cloudDensity: number;
  enableStars: boolean;
  sunElevation: number;
  fogDensity: number;
}

// Default sky settings
const DEFAULT_SKY_SETTINGS: SkySettings = {
  skyType: 'day',
  enableClouds: true,
  cloudDensity: 0.5,
  enableStars: true,
  sunElevation: 45,
  fogDensity: 0.5,
};

// Sky type presets with descriptions
const SKY_PRESETS: Record<SkyType, { label: string; icon: string; description: string }> = {
  day: { label: 'Day', icon: '☀️', description: 'Bright sunny day' },
  sunset: { label: 'Sunset', icon: '🌅', description: 'Golden hour' },
  night: { label: 'Night', icon: '🌙', description: 'Starry night' },
  overcast: { label: 'Overcast', icon: '☁️', description: 'Cloudy weather' },
};

// Global sky settings (stored outside component for persistence)
let globalSkySettings: SkySettings = { ...DEFAULT_SKY_SETTINGS };

// Event for sky settings changes
export function getSkySettings(): SkySettings {
  return globalSkySettings;
}

export function dispatchSkySettingsChange(settings: SkySettings): void {
  globalSkySettings = settings;
  window.dispatchEvent(new CustomEvent('sky-settings-change', { detail: settings }));
}

export default function WalkthroughSkyPanel() {
  const viewMode = useAppStore(state => state.viewState?.viewMode);

  const [isExpanded, setIsExpanded] = useState(false);
  const [settings, setSettings] = useState<SkySettings>(globalSkySettings);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Only handle in walkthrough mode
      if (viewMode !== '3d-walkthrough') return;

      switch (e.code) {
        case 'KeyY': // Y for skY settings
          e.preventDefault();
          setIsExpanded(prev => !prev);
          break;
        // Quick time-of-day presets when panel is open
        case 'Digit6':
          if (isExpanded) {
            e.preventDefault();
            updateSetting('skyType', 'day');
          }
          break;
        case 'Digit7':
          if (isExpanded) {
            e.preventDefault();
            updateSetting('skyType', 'sunset');
          }
          break;
        case 'Digit8':
          if (isExpanded) {
            e.preventDefault();
            updateSetting('skyType', 'night');
          }
          break;
        case 'Digit9':
          if (isExpanded) {
            e.preventDefault();
            updateSetting('skyType', 'overcast');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, viewMode]);

  // Release pointer lock when panel expands
  useEffect(() => {
    if (isExpanded) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      document.body.setAttribute('data-sky-panel-open', 'true');
    } else {
      document.body.removeAttribute('data-sky-panel-open');
    }

    return () => {
      document.body.removeAttribute('data-sky-panel-open');
    };
  }, [isExpanded]);

  const updateSetting = <K extends keyof SkySettings>(key: K, value: SkySettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    dispatchSkySettingsChange(newSettings);
  };

  // Don't render if not in walkthrough mode
  if (viewMode !== '3d-walkthrough') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
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
            ? 'linear-gradient(135deg, #FF6B35 0%, #4A9EFF 100%)'
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
        <span>🌤️</span>
        <span>Sky</span>
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
            minWidth: '240px',
          }}
        >
          <div style={{ marginBottom: '12px', fontWeight: 600, color: '#333', fontSize: '14px' }}>
            Sky & Atmosphere
          </div>

          {/* Time of Day Presets */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '6px' }}>
              Time of Day
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {(Object.entries(SKY_PRESETS) as [SkyType, typeof SKY_PRESETS[SkyType]][]).map(([type, preset]) => (
                <button
                  key={type}
                  onClick={() => updateSetting('skyType', type)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: settings.skyType === type ? '2px solid #4A9EFF' : '1px solid #ddd',
                    background: settings.skyType === type ? 'rgba(74, 158, 255, 0.1)' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{preset.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 500 }}>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Clouds Toggle */}
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
                checked={settings.enableClouds}
                onChange={(e) => updateSetting('enableClouds', e.target.checked)}
                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span>☁️ Clouds</span>
            </label>
          </div>

          {/* Cloud Density Slider */}
          {settings.enableClouds && (
            <div style={{ marginBottom: '12px', paddingLeft: '22px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                Cloud Density: {Math.round(settings.cloudDensity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.cloudDensity}
                onChange={(e) => updateSetting('cloudDensity', parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          )}

          {/* Stars Toggle (only for sunset/night) */}
          {(settings.skyType === 'sunset' || settings.skyType === 'night') && (
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
                  checked={settings.enableStars}
                  onChange={(e) => updateSetting('enableStars', e.target.checked)}
                  style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                />
                <span>✨ Stars</span>
              </label>
            </div>
          )}

          {/* Sun Elevation Slider */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              Sun Height: {settings.sunElevation}°
            </label>
            <input
              type="range"
              min="5"
              max="85"
              step="5"
              value={settings.sunElevation}
              onChange={(e) => updateSetting('sunElevation', parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Fog Density Slider */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              Fog: {Math.round(settings.fogDensity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.fogDensity}
              onChange={(e) => updateSetting('fogDensity', parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Shortcuts Help */}
          <div style={{ fontSize: '10px', color: '#666', marginTop: '10px', padding: '8px', background: '#f5f5f5', borderRadius: '6px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Shortcuts:</div>
            <div>Y - Toggle panel</div>
            <div>6-9 - Quick sky presets</div>
          </div>
          <div style={{ fontSize: '9px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
            Click scene to resume walking
          </div>
        </div>
      )}
    </div>
  );
}
