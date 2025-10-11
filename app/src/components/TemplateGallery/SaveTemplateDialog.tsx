import React from 'react';
import type { CreateTemplateInput, TemplateCategory } from '../../types/template';
import { useTemplateStore } from '../../store/useTemplateStore';
import { templateService } from '../../services/templateService';
import { validateTemplateName, validateTemplateDescription, validateTemplateTags } from '../../services/templateValidator';

/**
 * Save Template Dialog
 * Form for creating a new template from current drawing
 */

export function SaveTemplateDialog(): React.JSX.Element | null {
  const { isSaveDialogOpen, closeSaveDialog } = useTemplateStore();

  const [formData, setFormData] = React.useState<CreateTemplateInput>({
    name: '',
    description: '',
    category: 'custom',
    tags: [],
  });

  const [tagInput, setTagInput] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    // Validate name
    const nameValidation = validateTemplateName(formData.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error!;
    }

    // Validate description
    if (formData.description) {
      const descValidation = validateTemplateDescription(formData.description);
      if (!descValidation.valid) {
        newErrors.description = descValidation.error!;
      }
    }

    // Validate tags
    const tagsValidation = validateTemplateTags(formData.tags || []);
    if (!tagsValidation.valid) {
      newErrors.tags = tagsValidation.error!;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      await templateService.saveTemplate(formData);
      closeSaveDialog();
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'custom',
        tags: [],
      });
      setTagInput('');
      setErrors({});
      alert('Template saved successfully!');
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && (formData.tags || []).length < 5) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((_, i) => i !== index),
    });
  };

  if (!isSaveDialogOpen) return null;

  return (
    <div
      onClick={closeSaveDialog}
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
          maxWidth: '500px',
          width: '90%',
          maxHeight: '85vh',
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
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            Save as Template
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
            Save your current drawing as a reusable template
          </p>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '24px 32px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* General error */}
          {errors.general && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
              }}
            >
              {errors.general}
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              placeholder="e.g., My Residential Lot"
              maxLength={50}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 150ms',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {errors.name && (
                <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.name}</span>
              )}
              <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
                {formData.name.length}/50
              </span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) {
                  setErrors({ ...errors, description: '' });
                }
              }}
              placeholder="Brief description of this template..."
              maxLength={200}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.description ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {errors.description && (
                <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.description}</span>
              )}
              <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
                {formData.description.length}/200
              </span>
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TemplateCategory })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="agricultural">Agricultural</option>
              <option value="industrial">Industrial</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Tags (max 5)
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                maxLength={20}
                disabled={(formData.tags || []).length >= 5}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddTag}
                disabled={(formData.tags || []).length >= 5 || !tagInput.trim()}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (formData.tags || []).length >= 5 || !tagInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: (formData.tags || []).length >= 5 || !tagInput.trim() ? 0.5 : 1,
                }}
              >
                Add
              </button>
            </div>
            {/* Tag list */}
            {(formData.tags || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(formData.tags || []).map((tag, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#374151',
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(index)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: '#9ca3af',
                        fontSize: '16px',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.tags && (
              <span style={{ fontSize: '12px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                {errors.tags}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 32px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={closeSaveDialog}
            disabled={isSaving}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 150ms',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.name.trim()}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSaving || !formData.name.trim() ? 'not-allowed' : 'pointer',
              opacity: isSaving || !formData.name.trim() ? 0.5 : 1,
              transition: 'all 150ms',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
