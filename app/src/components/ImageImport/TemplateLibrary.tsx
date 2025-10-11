/**
 * Template Library Component
 *
 * Displays saved dimension templates for the hybrid image import feature.
 * Users can browse, search, load, and manage templates.
 *
 * FEATURES:
 * - Grid view of templates with preview cards
 * - Search by name/tags
 * - Filter by edge count and category
 * - Load template into manual entry form
 * - Duplicate templates
 * - Delete user templates (built-in templates cannot be deleted)
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <TemplateLibrary
 *   edgeCount={4}
 *   onLoadTemplate={(template) => loadIntoForm(template)}
 *   onClose={() => setShowLibrary(false)}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  importTemplateService,
  type CreateImportTemplateInput,
} from '../../services/imageImport/importTemplateService';
import type { SavedTemplate } from '../../types/imageImport';
import { logger } from '../../utils/logger';

export interface TemplateLibraryProps {
  /** Current edge count (for filtering) */
  edgeCount?: number;
  /** Callback when template is selected */
  onLoadTemplate: (template: SavedTemplate) => void;
  /** Callback when library should close */
  onClose: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  edgeCount,
  onLoadTemplate,
  onClose,
}) => {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SavedTemplate[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'built-in' | 'user'
  >('all');
  const [edgeCountFilter, setEdgeCountFilter] = useState<number | 'all'>(
    edgeCount || 'all'
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [templates, searchQuery, categoryFilter, edgeCountFilter]);

  /**
   * Load all templates
   */
  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const allTemplates = await importTemplateService.getAllTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      logger.error('[TemplateLibrary] Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply search and filters
   */
  const applyFilters = () => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(query);
        const descMatch = t.description?.toLowerCase().includes(query);
        const tagMatch = t.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        return nameMatch || descMatch || tagMatch;
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    // Edge count filter
    if (edgeCountFilter !== 'all') {
      filtered = filtered.filter((t) => t.edgeCount === edgeCountFilter);
    }

    setFilteredTemplates(filtered);
  };

  /**
   * Handle template selection
   */
  const handleLoadTemplate = (template: SavedTemplate) => {
    onLoadTemplate(template);
    onClose();
  };

  /**
   * Handle template duplication
   */
  const handleDuplicate = async (
    template: SavedTemplate,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      await importTemplateService.duplicateTemplate(template.id);
      await loadTemplates();
    } catch (error) {
      alert(`Failed to duplicate template: ${error}`);
    }
  };

  /**
   * Handle template deletion
   */
  const handleDelete = async (template: SavedTemplate, e: React.MouseEvent) => {
    e.stopPropagation();

    if (template.category === 'built-in') {
      alert('Cannot delete built-in templates');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${template.name}"?`
    );
    if (!confirmed) return;

    try {
      await importTemplateService.deleteTemplate(template.id);
      await loadTemplates();
    } catch (error) {
      alert(`Failed to delete template: ${error}`);
    }
  };

  /**
   * Get unique edge counts from templates
   */
  const getUniqueEdgeCounts = (): number[] => {
    const counts = new Set(templates.map((t) => t.edgeCount));
    return Array.from(counts).sort((a, b) => a - b);
  };

  return (
    <div
      style={{
        fontFamily: 'Nunito Sans, sans-serif',
        padding: '20px',
        maxHeight: '600px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: '#1F2937',
            }}
          >
            📚 Template Library
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
            Load a saved template or start from a common shape
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#6B7280',
            backgroundColor: '#F3F4F6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E5E7EB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F3F4F6';
          }}
        >
          × Close
        </button>
      </div>

      {/* Search and Filters */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px 12px',
            fontSize: '14px',
            border: '2px solid #D1D5DB',
            borderRadius: '6px',
            color: '#374151',
            outline: 'none',
          }}
        />

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | 'built-in' | 'user')
            }
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '8px 12px',
              fontSize: '14px',
              border: '2px solid #D1D5DB',
              borderRadius: '6px',
              color: '#374151',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Templates</option>
            <option value="built-in">Built-in</option>
            <option value="user">My Templates</option>
          </select>

          {/* Edge Count Filter */}
          <select
            value={edgeCountFilter}
            onChange={(e) =>
              setEdgeCountFilter(
                e.target.value === 'all' ? 'all' : parseInt(e.target.value)
              )
            }
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '8px 12px',
              fontSize: '14px',
              border: '2px solid #D1D5DB',
              borderRadius: '6px',
              color: '#374151',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Edge Counts</option>
            {getUniqueEdgeCounts().map((count) => (
              <option key={count} value={count}>
                {count} edges
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '12px', fontSize: '13px', color: '#6B7280' }}>
        {filteredTemplates.length} template
        {filteredTemplates.length !== 1 ? 's' : ''} found
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          Loading templates...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTemplates.length === 0 && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '2px dashed #D1D5DB',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            No Templates Found
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            {searchQuery || categoryFilter !== 'all' || edgeCountFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No templates available yet'}
          </div>
        </div>
      )}

      {/* Template Grid */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleLoadTemplate(template)}
              style={{
                padding: '16px',
                backgroundColor: 'white',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Template Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#1F2937',
                      marginBottom: '4px',
                    }}
                  >
                    {template.name}
                  </div>
                  {template.description && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6B7280',
                        lineHeight: '1.4',
                      }}
                    >
                      {template.description}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: template.category === 'built-in' ? '#10B981' : '#3B82F6',
                    backgroundColor:
                      template.category === 'built-in' ? '#D1FAE5' : '#DBEAFE',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {template.category === 'built-in' ? '✨ Built-in' : '👤 User'}
                </div>
              </div>

              {/* Template Info */}
              <div
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: '#6B7280' }}>Edges:</span>{' '}
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>
                      {template.edgeCount}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Area:</span>{' '}
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>
                      {template.area ? `${template.area.toLocaleString()} ${template.areaUnit}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}
                  >
                    {template.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          fontSize: '11px',
                          color: '#6B7280',
                          backgroundColor: '#F3F4F6',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadTemplate(template);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'white',
                    backgroundColor: '#3B82F6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3B82F6';
                  }}
                >
                  Load
                </button>
                <button
                  onClick={(e) => handleDuplicate(template, e)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280',
                    backgroundColor: '#F3F4F6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  title="Duplicate template"
                >
                  📋
                </button>
                {template.category === 'user' && (
                  <button
                    onClick={(e) => handleDelete(template, e)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#EF4444',
                      backgroundColor: '#FEE2E2',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FECACA';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FEE2E2';
                    }}
                    title="Delete template"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
