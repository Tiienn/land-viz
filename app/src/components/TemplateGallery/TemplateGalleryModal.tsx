import React, { useEffect, useMemo } from 'react';
import { useTemplateStore } from '../../store/useTemplateStore';
import { TemplateGrid } from './TemplateGrid';
import type { TemplateCategory } from '../../types/template';

/**
 * Template Gallery Modal
 * Main interface for browsing and loading templates
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
    openSaveDialog,
  } = useTemplateStore();

  // Load templates on mount
  useEffect(() => {
    if (isGalleryOpen) {
      loadAllTemplates();
    }
  }, [isGalleryOpen, loadAllTemplates]);

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

  return (
    <div
      onClick={closeGallery}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '1000px',
          maxHeight: '85vh',
          width: '90%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📄
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                Template Gallery
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <button
            onClick={closeGallery}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'background-color 150ms',
              fontSize: '20px',
              color: '#6b7280',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 32px', borderBottom: '1px solid #e5e7eb' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '12px',
                fontSize: '18px',
                color: '#9ca3af',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 150ms',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            padding: '16px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {categories.map((category) => {
            const isActive =
              category.value === 'all'
                ? !activeFilter.category
                : activeFilter.category === category.value;

            return (
              <button
                key={category.value}
                onClick={() =>
                  setFilter({
                    category: category.value === 'all' ? undefined : (category.value as TemplateCategory),
                  })
                }
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor: isActive ? '#3b82f6' : '#f3f4f6',
                  color: isActive ? '#ffffff' : '#374151',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Template Grid */}
        <div
          style={{
            padding: '32px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <TemplateGrid templates={filteredTemplates} />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 32px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {templates.filter((t) => t.author === 'built-in').length} built-in • {templates.filter((t) => t.author === 'user').length} custom
          </div>
          <button
            onClick={() => {
              closeGallery();
              openSaveDialog();
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Create New Template
          </button>
        </div>
      </div>
    </div>
  );
}
