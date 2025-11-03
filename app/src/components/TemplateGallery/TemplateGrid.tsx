import React from 'react';
import type { PropertyTemplate } from '../../types/template';
import { TemplateCard } from './TemplateCard';
import { templateService } from '../../services/templateService';
import { useTemplateStore } from '../../store/useTemplateStore';

/**
 * Template Grid Component
 * Displays templates in a responsive grid layout
 */

interface TemplateGridProps {
  templates: PropertyTemplate[];
  selectedTemplateId?: string | null;
  onSelectTemplate?: (templateId: string) => void;
}

export function TemplateGrid({
  templates,
  selectedTemplateId = null,
  onSelectTemplate
}: TemplateGridProps): React.JSX.Element {
  const closeGallery = useTemplateStore((state) => state.closeGallery);
  const [contextMenuTemplate, setContextMenuTemplate] = React.useState<PropertyTemplate | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = React.useState<{ x: number; y: number } | null>(null);

  const handleLoadTemplate = async (templateId: string) => {
    try {
      await templateService.loadTemplate(templateId);
      closeGallery();
    } catch (error: any) {
      alert(`Failed to load template: ${error.message}`);
    }
  };

  const handleClick = (templateId: string) => {
    if (onSelectTemplate) {
      onSelectTemplate(templateId);
    } else {
      handleLoadTemplate(templateId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, template: PropertyTemplate) => {
    e.preventDefault();
    setContextMenuTemplate(template);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenuTemplate(null);
    setContextMenuPosition(null);
  };

  // Close context menu on click outside
  React.useEffect(() => {
    if (contextMenuTemplate) {
      document.addEventListener('click', handleCloseContextMenu);
      return () => {
        document.removeEventListener('click', handleCloseContextMenu);
      };
    }
  }, [contextMenuTemplate]);

  if (templates.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          color: '#6b7280',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}
        >
          📄
        </div>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#374151' }}>
          No templates found
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: '14px', textAlign: 'center' }}>
          Try adjusting your filters or create a new template from your current drawing
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplateId === template.id}
            onClick={() => handleClick(template.id)}
            onContextMenu={(e) => handleContextMenu(e, template)}
          />
        ))}
      </div>

      {/* Simple Context Menu */}
      {contextMenuTemplate && contextMenuPosition && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            padding: '4px',
            zIndex: 10000,
            minWidth: '180px',
          }}
        >
          <button
            onClick={async () => {
              await handleLoadTemplate(contextMenuTemplate.id);
              handleCloseContextMenu();
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#374151',
              transition: 'background-color 100ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Load Template
          </button>

          <button
            onClick={async () => {
              await useTemplateStore.getState().toggleFavorite(contextMenuTemplate.id);
              handleCloseContextMenu();
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#374151',
              transition: 'background-color 100ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {contextMenuTemplate.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>

          <button
            onClick={async () => {
              try {
                await templateService.duplicateTemplate(contextMenuTemplate.id);
                handleCloseContextMenu();
              } catch (error: any) {
                alert(`Failed to duplicate: ${error.message}`);
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#374151',
              transition: 'background-color 100ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Duplicate
          </button>

          <button
            onClick={() => {
              const { exportTemplate } = require('../../services/templateStorage');
              exportTemplate(contextMenuTemplate);
              handleCloseContextMenu();
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#374151',
              transition: 'background-color 100ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Export as JSON
          </button>

          {contextMenuTemplate.author === 'user' && (
            <>
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
              <button
                onClick={async () => {
                  if (window.confirm(`Delete template "${contextMenuTemplate.name}"?`)) {
                    try {
                      await useTemplateStore.getState().deleteTemplate(contextMenuTemplate.id);
                      handleCloseContextMenu();
                    } catch (error: any) {
                      alert(`Failed to delete: ${error.message}`);
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#ef4444',
                  transition: 'background-color 100ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
