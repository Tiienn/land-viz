import React, { useEffect, useMemo, useState } from 'react';
import { useTemplateStore } from '../../store/useTemplateStore';
import { TemplateGrid } from './TemplateGrid';
import type { TemplateCategory } from '../../types/template';

/**
 * Template Gallery Modal
 * Main interface for browsing and loading templates
 * Design matches PresetsModal for consistency
 */

export function TemplateGalleryModal(): React.JSX.Element | null {
  const {
    isGalleryOpen,
    closeGallery,
    templates,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setFilter,
    loadAllTemplates,
    loadTemplate,
  } = useTemplateStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    if (isGalleryOpen) {
      loadAllTemplates();
    }
  }, [isGalleryOpen, loadAllTemplates]);

  // Set data attribute for ShapeDimensions to hide when modal is open
  useEffect(() => {
    if (isGalleryOpen) {
      document.body.setAttribute('data-modal-open', 'true');
    } else {
      document.body.removeAttribute('data-modal-open');
    }

    return () => {
      document.body.removeAttribute('data-modal-open');
    };
  }, [isGalleryOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isGalleryOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeGallery();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, closeGallery]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Filter by author type
    if (!activeFilter.showBuiltIn) {
      result = result.filter((t) => t.author !== 'built-in');
    }
    if (!activeFilter.showUserTemplates) {
      result = result.filter((t) => t.author !== 'user');
    }

    // Filter by favorites
    if (activeFilter.showFavorites) {
      result = result.filter((t) => t.isFavorite);
    }

    // Filter by category
    if (activeFilter.category) {
      result = result.filter((t) => t.category === activeFilter.category);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [templates, activeFilter, searchQuery]);

  if (!isGalleryOpen) return null;

  const categories: Array<{ value: TemplateCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'agricultural', label: 'Agricultural' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'custom', label: 'Custom' },
  ];

  const selectedCategory = activeFilter.category || 'all';
  const selectedTemplate = selectedTemplateId ? templates.find(t => t.id === selectedTemplateId) : null;

  // Styles matching PresetsModal
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    padding: '20px',
    animation: 'fadeIn 0.2s ease-out',
    isolation: 'isolate' as any,
    willChange: 'transform'
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontFamily: 'Nunito Sans, sans-serif',
    animation: 'slideIn 0.2s ease-out',
    position: 'relative'
  };

  const headerStyle: React.CSSProperties = {
    padding: '24px 24px 0 24px',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: '16px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6B7280',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
  };

  const searchStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Nunito Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginTop: '16px',
    borderBottom: '1px solid #E5E7EB',
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? '#3B82F6' : '#6B7280',
    fontWeight: isActive ? '600' : '500',
    fontSize: '14px',
    fontFamily: 'Nunito Sans, sans-serif',
    cursor: 'pointer',
    borderBottom: `2px solid ${isActive ? '#3B82F6' : 'transparent'}`,
    transition: 'all 0.2s ease',
  });

  const contentStyle: React.CSSProperties = {
    padding: '24px',
    flex: 1,
    overflow: 'auto',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '12px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
  };

  const actionsStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'Nunito Sans, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    color: '#FFFFFF',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#F3F4F6',
    color: '#374151',
  };

  const handleLoadTemplate = async () => {
    if (!selectedTemplate) return;
    await loadTemplate(selectedTemplate.id);
    closeGallery();
  };

  return (
    <div
      className="template-gallery-modal"
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && closeGallery()}
    >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            Template Gallery
            <button
              style={closeButtonStyle}
              onClick={closeGallery}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search templates by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchStyle}
            onFocus={(e) => {
              (e.target as HTMLElement).style.borderColor = '#3B82F6';
            }}
            onBlur={(e) => {
              (e.target as HTMLElement).style.borderColor = '#E5E7EB';
            }}
          />

          {/* Category Tabs */}
          <div style={tabsStyle}>
            {categories.map((category) => {
              const isActive =
                category.value === 'all'
                  ? !activeFilter.category
                  : activeFilter.category === category.value;

              return (
                <button
                  key={category.value}
                  style={getTabStyle(isActive)}
                  onClick={() =>
                    setFilter({
                      category: category.value === 'all' ? undefined : (category.value as TemplateCategory),
                    })
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.color = '#3B82F6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.color = '#6B7280';
                    }
                  }}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {/* Main Templates Grid */}
          <div style={sectionTitleStyle}>
            {categories.find(c => c.value === selectedCategory)?.label} Templates
            <span style={{ color: '#6B7280', fontWeight: '400', fontSize: '14px', marginLeft: '8px' }}>
              ({filteredTemplates.length})
            </span>
          </div>

          {filteredTemplates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#6B7280',
              padding: '48px 24px',
              fontSize: '16px',
            }}>
              {searchQuery ? `No templates found for "${searchQuery}"` : 'No templates in this category'}
            </div>
          ) : (
            <div style={gridStyle}>
              <TemplateGrid
                templates={filteredTemplates}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={setSelectedTemplateId}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={actionsStyle}>
          <button
            style={secondaryButtonStyle}
            onClick={closeGallery}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#E5E7EB';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#F3F4F6';
            }}
          >
            Cancel
          </button>
          <button
            style={primaryButtonStyle}
            disabled={!selectedTemplate}
            onClick={handleLoadTemplate}
            onMouseEnter={(e) => {
              if (!selectedTemplate) return;
              (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)';
              (e.target as HTMLElement).style.transform = 'translateY(-1px)';
              (e.target as HTMLElement).style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              if (!selectedTemplate) return;
              (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)';
              (e.target as HTMLElement).style.transform = 'translateY(0)';
              (e.target as HTMLElement).style.boxShadow = 'none';
            }}
          >
            Load Template
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateY(-20px) scale(0.95); }
          to { transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
