import React from 'react';
import type { PropertyTemplate } from '../../types/template';

/**
 * Template Card Component
 * Displays a single template with thumbnail and metadata
 */

interface TemplateCardProps {
  template: PropertyTemplate;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function TemplateCard({ template, onClick, onContextMenu }: TemplateCardProps): React.JSX.Element {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'pointer',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        transition: 'all 150ms ease-in-out',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '100%',
          height: '150px',
          backgroundColor: '#f3f4f6',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            No Preview
          </div>
        )}

        {/* Favorite indicator */}
        {template.isFavorite && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              padding: '4px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '14px' }}>⭐</span>
          </div>
        )}

        {/* Built-in badge */}
        {template.author === 'built-in' && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.9)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}
          >
            Built-in
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {template.name}
        </h3>

        {/* Category */}
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '12px',
            color: '#6b7280',
            textTransform: 'capitalize',
          }}
        >
          {template.category}
        </p>

        {/* Description */}
        {template.description && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '11px',
              color: '#9ca3af',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {template.description}
          </p>
        )}

        {/* Metadata */}
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            gap: '8px',
            fontSize: '11px',
            color: '#9ca3af',
          }}
        >
          <span title="Times used">⭐ {template.usageCount}</span>
          <span>•</span>
          <span>{template.data.shapes.length} shapes</span>
        </div>
      </div>
    </div>
  );
}
