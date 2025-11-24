import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { tokens } from '@/styles/tokens';

/**
 * WalkthroughAccessibilityPanel - Comfort and accessibility settings for walkthrough mode
 *
 * Features:
 * - Movement speed control (0.5x - 2.0x)
 * - Mouse sensitivity adjustment
 * - Motion reduction toggle
 * - Jump height adjustment
 * - Settings persist to localStorage
 */

export interface WalkthroughAccessibilitySettings {
  movementSpeedMultiplier: number; // 0.5 - 2.0
  mouseSensitivity: number; // 0.5 - 2.0
  reduceMotion: boolean;
  jumpHeightMultiplier: number; // 0.5 - 2.0
}

const DEFAULT_SETTINGS: WalkthroughAccessibilitySettings = {
  movementSpeedMultiplier: 1.0,
  mouseSensitivity: 1.0,
  reduceMotion: false,
  jumpHeightMultiplier: 1.0,
};

// Load settings from localStorage
function loadSettings(): WalkthroughAccessibilitySettings {
  try {
    const stored = localStorage.getItem('walkthrough-accessibility');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load walkthrough accessibility settings:', error);
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: WalkthroughAccessibilitySettings) {
  try {
    localStorage.setItem('walkthrough-accessibility', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save walkthrough accessibility settings:', error);
  }
}

export default function WalkthroughAccessibilityPanel() {
  const viewMode = useAppStore(state => state.viewState?.viewMode);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<WalkthroughAccessibilitySettings>(loadSettings());

  // Don't render if not in walkthrough mode
  if (viewMode !== '3d-walkthrough') return null;

  const updateSetting = <K extends keyof WalkthroughAccessibilitySettings>(
    key: K,
    value: WalkthroughAccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);

    // Dispatch event for WalkthroughCamera to listen to
    window.dispatchEvent(new CustomEvent('walkthrough-settings-change', {
      detail: newSettings
    }));
  };

  // Minimized button
  if (!isOpen) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: '140px',
          left: '20px',
          background: 'rgba(30, 30, 30, 0.9)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          border: '2px solid rgba(34, 197, 94, 0.5)',
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
          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(30, 30, 30, 0.9)';
          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
        }}
      >
        <span style={{ fontSize: '18px' }}>⚙️</span>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Settings</span>
      </div>
    );
  }

  // Full panel
  return (
    <div
      style={{
        position: 'fixed',
        top: '140px',
        left: '20px',
        background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        border: '2px solid rgba(34, 197, 94, 0.6)',
        zIndex: 1000,
        minWidth: '320px',
        maxWidth: '400px',
        backdropFilter: 'blur(10px)',
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
            background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ⚙️ Accessibility Settings
        </h3>
        <button
          onClick={() => setIsOpen(false)}
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
        >
          −
        </button>
      </div>

      {/* Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Movement Speed */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            🏃 Movement Speed: {settings.movementSpeedMultiplier.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.movementSpeedMultiplier}
            onChange={(e) => updateSetting('movementSpeedMultiplier', parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#22c55e',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '4px',
            }}
          >
            <span>Slow (0.5x)</span>
            <span>Normal (1.0x)</span>
            <span>Fast (2.0x)</span>
          </div>
        </div>

        {/* Mouse Sensitivity */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            🖱️ Mouse Sensitivity: {settings.mouseSensitivity.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.mouseSensitivity}
            onChange={(e) => updateSetting('mouseSensitivity', parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#22c55e',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '4px',
            }}
          >
            <span>Low (0.5x)</span>
            <span>Normal (1.0x)</span>
            <span>High (2.0x)</span>
          </div>
        </div>

        {/* Jump Height */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            ⬆️ Jump Height: {settings.jumpHeightMultiplier.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.jumpHeightMultiplier}
            onChange={(e) => updateSetting('jumpHeightMultiplier', parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#22c55e',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '4px',
            }}
          >
            <span>Low (0.5x)</span>
            <span>Normal (1.0x)</span>
            <span>High (2.0x)</span>
          </div>
        </div>

        {/* Reduce Motion */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#22c55e',
                cursor: 'pointer',
              }}
            />
            <span>
              🌊 Reduce Motion (Comfort Mode)
            </span>
          </label>
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '8px 0 0 30px',
            }}
          >
            Reduces camera shake and sudden movements for motion comfort
          </p>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            setSettings(DEFAULT_SETTINGS);
            saveSettings(DEFAULT_SETTINGS);
            window.dispatchEvent(new CustomEvent('walkthrough-settings-change', {
              detail: DEFAULT_SETTINGS
            }));
          }}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: 'white',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
        >
          🔄 Reset to Defaults
        </button>
      </div>
    </div>
  );
}

// Export settings loader for use in WalkthroughCamera
export { loadSettings as loadWalkthroughSettings };
