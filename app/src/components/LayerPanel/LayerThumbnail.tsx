/**
 * LayerThumbnail Component
 *
 * Displays a 40×40px thumbnail preview of a layer's content.
 * - Automatically generates thumbnail on mount
 * - Shows loading placeholder while generating
 * - Caches thumbnails for performance
 */

import React, { useState, useEffect } from 'react';
import { getLayerThumbnail, getLayerThumbnailSync } from '../../services/thumbnailService';
import type { Layer } from '../../types';

interface LayerThumbnailProps {
  layer: Layer;
  size?: number;
}

const LayerThumbnail: React.FC<LayerThumbnailProps> = ({ layer, size = 40 }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if thumbnail is already in Layer object
    if (layer.thumbnail) {
      setThumbnail(layer.thumbnail);
      setLoading(false);
      return;
    }

    // Check if thumbnail is cached
    const cached = getLayerThumbnailSync(layer.id);
    if (cached) {
      setThumbnail(cached);
      setLoading(false);
      return;
    }

    // Generate thumbnail asynchronously
    setLoading(true);
    setError(false);

    getLayerThumbnail(layer.id)
      .then(dataUrl => {
        setThumbnail(dataUrl);
        setLoading(false);
      })
      .catch(err => {
        setError(true);
        setLoading(false);
      });
  }, [layer.id, layer.thumbnail]);

  // Re-generate if layer was modified recently
  useEffect(() => {
    if (!layer.modified) return;

    const modifiedTime = layer.modified.getTime();
    const thumbnailTime = layer.thumbnailUpdated?.getTime() || 0;

    // Regenerate if layer was modified after thumbnail
    if (modifiedTime > thumbnailTime) {
      setLoading(true);
      getLayerThumbnail(layer.id)
        .then(dataUrl => {
          setThumbnail(dataUrl);
          setLoading(false);
        })
        .catch(err => {
          setError(true);
          setLoading(false);
        });
    }
  }, [layer.id, layer.modified, layer.thumbnailUpdated]);

  if (error) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        title="Failed to generate thumbnail"
      >
        <span style={{ fontSize: `${size * 0.4}px`, color: '#d1d5db' }}>?</span>
      </div>
    );
  }

  if (loading || !thumbnail) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        title="Generating thumbnail..."
      >
        {/* Simple loading animation */}
        <div
          style={{
            width: `${size * 0.5}px`,
            height: `${size * 0.5}px`,
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    );
  }

  return (
    <img
      src={thumbnail}
      alt={`${layer.name} thumbnail`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        flexShrink: 0,
        objectFit: 'cover',
      }}
      title={layer.name}
    />
  );
};

// Add keyframe animation for loading spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default LayerThumbnail;
