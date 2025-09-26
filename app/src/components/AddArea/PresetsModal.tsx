import React, { useState, useMemo, useEffect } from 'react';
import type { AreaPreset, PresetCategory } from '../../types/presets';
import { PresetCard } from './PresetCard';
import { defaultAreaPresets, searchPresets } from '../../data/areaPresets';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: AreaPreset) => void;
  onCustomizePreset: (preset: AreaPreset) => void;
  customPresets?: AreaPreset[];
  recentPresets?: string[];
}

const categories: { key: PresetCategory; label: string; count?: number }[] = [
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'agricultural', label: 'Agricultural' },
  { key: 'mixed', label: 'Mixed Use' },
  { key: 'custom', label: 'Custom' },
];

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onCustomizePreset,
  customPresets = [],
  recentPresets = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>('residential');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Combine default presets with custom presets
  const allPresets = useMemo(() => {
    const combined = [...defaultAreaPresets];
    customPresets.forEach(preset => {
      combined.push({ ...preset, category: 'custom' as PresetCategory });
    });
    return combined;
  }, [customPresets]);

  // Filter presets based on category and search
  const filteredPresets = useMemo(() => {
    let filtered = allPresets.filter(preset => preset.category === selectedCategory);

    if (searchQuery.trim()) {
      filtered = searchPresets(searchQuery, filtered);
    }

    return filtered;
  }, [allPresets, selectedCategory, searchQuery]);

  // Get recent presets for display
  const recentPresetsData = useMemo(() => {
    return recentPresets
      .map(id => allPresets.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 5) as AreaPreset[];
  }, [recentPresets, allPresets]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    ':hover': {
      backgroundColor: '#F3F4F6',
    },
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
    ':focus': {
      borderColor: '#3B82F6',
    },
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
    ':hover': {
      color: '#3B82F6',
    },
  });

  const contentStyle: React.CSSProperties = {
    padding: '24px',
    flex: 1,
    overflow: 'auto',
  };

  const recentSectionStyle: React.CSSProperties = {
    marginBottom: '24px',
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

  const recentGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
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
    ':hover': {
      backgroundColor: '#E5E7EB',
    },
  };

  const selectedPreset = selectedPresetId ? allPresets.find(p => p.id === selectedPresetId) : null;

  return (
    <div
      className="presets-modal"
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            Area Configuration Presets
            <button
              style={closeButtonStyle}
              onClick={onClose}
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
            placeholder="Search presets by name, area, or description..."
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
            {categories.map((category) => (
              <button
                key={category.key}
                style={getTabStyle(selectedCategory === category.key)}
                onClick={() => setSelectedCategory(category.key)}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category.key) {
                    (e.target as HTMLElement).style.color = '#3B82F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category.key) {
                    (e.target as HTMLElement).style.color = '#6B7280';
                  }
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {/* Recent Presets */}
          {recentPresetsData.length > 0 && selectedCategory === 'residential' && !searchQuery && (
            <div style={recentSectionStyle}>
              <div style={sectionTitleStyle}>Recently Used</div>
              <div style={recentGridStyle}>
                {recentPresetsData.map((preset) => (
                  <PresetCard
                    key={`recent-${preset.id}`}
                    preset={preset}
                    isSelected={selectedPresetId === preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    onCustomize={() => onCustomizePreset(preset)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main Presets Grid */}
          <div style={sectionTitleStyle}>
            {categories.find(c => c.key === selectedCategory)?.label} Presets
            <span style={{ color: '#6B7280', fontWeight: '400', fontSize: '14px', marginLeft: '8px' }}>
              ({filteredPresets.length})
            </span>
          </div>

          {filteredPresets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#6B7280',
              padding: '48px 24px',
              fontSize: '16px',
            }}>
              {searchQuery ? `No presets found for "${searchQuery}"` : 'No presets in this category'}
            </div>
          ) : (
            <div style={gridStyle}>
              {filteredPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPresetId === preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  onCustomize={() => onCustomizePreset(preset)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={actionsStyle}>
          <button
            style={secondaryButtonStyle}
            onClick={onClose}
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
            disabled={!selectedPreset}
            onClick={() => selectedPreset && onSelectPreset(selectedPreset)}
            onMouseEnter={(e) => {
              if (!selectedPreset) return;
              (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)';
              (e.target as HTMLElement).style.transform = 'translateY(-1px)';
              (e.target as HTMLElement).style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              if (!selectedPreset) return;
              (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)';
              (e.target as HTMLElement).style.transform = 'translateY(0)';
              (e.target as HTMLElement).style.boxShadow = 'none';
            }}
          >
            Use Preset
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
};