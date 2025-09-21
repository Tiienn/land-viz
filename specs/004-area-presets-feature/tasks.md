# Implementation Tasks: Area Configuration Presets

**Spec ID**: 004
**Feature**: Area Configuration Presets
**Total Estimated Time**: 10 hours
**Created**: 2025-09-18

## Task Overview

This document breaks down the Area Configuration Presets feature into detailed, actionable tasks with time estimates, validation criteria, and code examples.

---

## Phase 1: Foundation (2 hours)

### Task 1.1: Extend Type Definitions (0.5 hours)
**File**: `app/src/types/index.ts`
**Priority**: High
**Dependencies**: None

**Implementation**:
```typescript
// Add after existing types

/**
 * Category classification for area presets
 */
export type PresetCategory = 'residential' | 'commercial' | 'agricultural' | 'mixed' | 'custom';

/**
 * Individual area preset configuration
 */
export interface AreaPreset {
  /** Unique identifier */
  id: string;
  /** Display name for the preset */
  name: string;
  /** Area value */
  area: number;
  /** Area unit */
  unit: AreaUnit;
  /** Shape type for generated area */
  shapeType: 'square' | 'rectangle' | 'circle';
  /** Aspect ratio for rectangles (width/height) */
  aspectRatio?: number;
  /** Human-readable description */
  description: string;
  /** Preset category for organization */
  category: PresetCategory;
  /** Whether this is a user-created preset */
  isCustom?: boolean;
  /** Creation timestamp for custom presets */
  created?: Date;
  /** Last usage timestamp for recent presets */
  lastUsed?: Date;
}

/**
 * Preset search and filter configuration
 */
export interface PresetFilters {
  /** Search query string */
  query: string;
  /** Selected category filter */
  category: PresetCategory | 'all';
  /** Area range filter */
  areaRange?: {
    min: number;
    max: number;
    unit: AreaUnit;
  };
}

/**
 * Presets modal state
 */
export interface PresetsModalState {
  /** Modal visibility */
  isOpen: boolean;
  /** Currently selected preset */
  selectedPreset: string | null;
  /** Search and filter state */
  filters: PresetFilters;
  /** UI loading state */
  isLoading: boolean;
}
```

**Validation Criteria**:
- [ ] All types compile without errors
- [ ] Types integrate with existing `AddAreaConfig` and `AreaUnit`
- [ ] JSDoc documentation complete
- [ ] No breaking changes to existing types

### Task 1.2: Create Default Presets Dataset (1 hour)
**File**: `app/src/data/areaPresets.ts`
**Priority**: High
**Dependencies**: Task 1.1

**Implementation**:
```typescript
import type { AreaPreset } from '@/types';

/**
 * Default area presets organized by category
 */
export const DEFAULT_PRESETS: AreaPreset[] = [
  // Residential Category
  {
    id: 'res-small-suburban',
    name: 'Small Suburban Lot',
    area: 0.25,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.5,
    description: 'Typical small suburban residential lot',
    category: 'residential'
  },
  {
    id: 'res-standard-suburban',
    name: 'Standard Suburban Lot',
    area: 0.5,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.3,
    description: 'Standard suburban residential lot',
    category: 'residential'
  },
  {
    id: 'res-large-lot',
    name: 'Large Residential Lot',
    area: 1,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.2,
    description: 'Large residential lot with space for gardens',
    category: 'residential'
  },
  {
    id: 'res-urban-townhouse',
    name: 'Urban Townhouse Lot',
    area: 5000,
    unit: 'sqft',
    shapeType: 'rectangle',
    aspectRatio: 2.0,
    description: 'Narrow urban townhouse lot',
    category: 'residential'
  },
  {
    id: 'res-european-standard',
    name: 'European Residential Standard',
    area: 2000,
    unit: 'sqm',
    shapeType: 'square',
    description: 'Standard European residential plot',
    category: 'residential'
  },

  // Commercial Category
  {
    id: 'com-small-retail',
    name: 'Small Retail Space',
    area: 5000,
    unit: 'sqft',
    shapeType: 'rectangle',
    aspectRatio: 1.5,
    description: 'Small retail or office space',
    category: 'commercial'
  },
  {
    id: 'com-medium-plot',
    name: 'Medium Commercial Plot',
    area: 10000,
    unit: 'sqft',
    shapeType: 'rectangle',
    aspectRatio: 1.3,
    description: 'Medium-sized commercial development',
    category: 'commercial'
  },
  {
    id: 'com-large-development',
    name: 'Large Commercial Development',
    area: 1,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.2,
    description: 'Large commercial or industrial development',
    category: 'commercial'
  },
  {
    id: 'com-shopping-center',
    name: 'Shopping Center Plot',
    area: 2500,
    unit: 'sqm',
    shapeType: 'rectangle',
    aspectRatio: 1.8,
    description: 'Standard shopping center plot',
    category: 'commercial'
  },
  {
    id: 'com-warehouse',
    name: 'Warehouse Plot',
    area: 50000,
    unit: 'sqft',
    shapeType: 'rectangle',
    aspectRatio: 2.5,
    description: 'Industrial warehouse plot',
    category: 'commercial'
  },

  // Agricultural Category
  {
    id: 'agr-small-farm',
    name: 'Small Farm Plot',
    area: 1,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.2,
    description: 'Small agricultural plot',
    category: 'agricultural'
  },
  {
    id: 'agr-medium-farm',
    name: 'Medium Farm Parcel',
    area: 5,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.5,
    description: 'Medium agricultural parcel',
    category: 'agricultural'
  },
  {
    id: 'agr-large-farm',
    name: 'Large Agricultural Plot',
    area: 10,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.3,
    description: 'Large agricultural development',
    category: 'agricultural'
  },
  {
    id: 'agr-quarter-section',
    name: 'Quarter Section',
    area: 40,
    unit: 'acres',
    shapeType: 'square',
    description: 'US agricultural quarter section (160 acres)',
    category: 'agricultural'
  },
  {
    id: 'agr-section',
    name: 'Full Section',
    area: 160,
    unit: 'acres',
    shapeType: 'square',
    description: 'US agricultural full section (640 acres)',
    category: 'agricultural'
  },

  // Mixed Use Category
  {
    id: 'mix-mixed-development',
    name: 'Mixed Use Development',
    area: 2,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.4,
    description: 'Mixed residential/commercial development',
    category: 'mixed'
  },
  {
    id: 'mix-planned-community',
    name: 'Planned Community',
    area: 100,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.3,
    description: 'Large planned community development',
    category: 'mixed'
  },
  {
    id: 'mix-sports-complex',
    name: 'Sports Complex',
    area: 15000,
    unit: 'sqm',
    shapeType: 'rectangle',
    aspectRatio: 1.6,
    description: 'Sports and recreation complex',
    category: 'mixed'
  }
];

/**
 * Get presets by category
 */
export const getPresetsByCategory = (category: PresetCategory): AreaPreset[] => {
  return DEFAULT_PRESETS.filter(preset => preset.category === category);
};

/**
 * Get all preset categories
 */
export const getPresetCategories = (): PresetCategory[] => {
  return ['residential', 'commercial', 'agricultural', 'mixed'];
};

/**
 * Search presets by name or description
 */
export const searchPresets = (query: string, presets: AreaPreset[] = DEFAULT_PRESETS): AreaPreset[] => {
  if (!query.trim()) return presets;

  const searchTerm = query.toLowerCase();
  return presets.filter(preset =>
    preset.name.toLowerCase().includes(searchTerm) ||
    preset.description.toLowerCase().includes(searchTerm)
  );
};
```

**Validation Criteria**:
- [ ] At least 18 default presets across 4 categories
- [ ] Realistic area values and descriptions
- [ ] Proper aspect ratios for rectangular presets
- [ ] All presets have unique IDs
- [ ] Search functionality works correctly

### Task 1.3: Create Preset Utilities (0.5 hours)
**File**: `app/src/utils/presetStorage.ts`
**Priority**: Medium
**Dependencies**: Task 1.1

**Implementation**:
```typescript
import type { AreaPreset } from '@/types';
import { logger } from './logger';

const CUSTOM_PRESETS_KEY = 'land-viz-custom-presets';
const RECENT_PRESETS_KEY = 'land-viz-recent-presets';
const PRESET_STORAGE_VERSION = '1.0';

/**
 * Custom preset storage interface
 */
interface CustomPresetStorage {
  version: string;
  presets: AreaPreset[];
  lastUpdated: string;
}

/**
 * Recent presets storage interface
 */
interface RecentPresetsStorage {
  version: string;
  presetIds: string[];
  lastUpdated: string;
}

/**
 * Save custom presets to localStorage
 */
export const saveCustomPresets = async (presets: AreaPreset[]): Promise<void> => {
  try {
    const storage: CustomPresetStorage = {
      version: PRESET_STORAGE_VERSION,
      presets: presets.filter(p => p.isCustom),
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(storage));
    logger.log('Custom presets saved:', storage.presets.length);
  } catch (error) {
    logger.error('Failed to save custom presets:', error);
    throw new Error('Failed to save custom presets');
  }
};

/**
 * Load custom presets from localStorage
 */
export const loadCustomPresets = async (): Promise<AreaPreset[]> => {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!stored) return [];

    const storage: CustomPresetStorage = JSON.parse(stored);

    // Version compatibility check
    if (storage.version !== PRESET_STORAGE_VERSION) {
      logger.log('Preset storage version mismatch, clearing old data');
      localStorage.removeItem(CUSTOM_PRESETS_KEY);
      return [];
    }

    return storage.presets;
  } catch (error) {
    logger.error('Failed to load custom presets:', error);
    return [];
  }
};

/**
 * Save recent preset IDs to localStorage
 */
export const saveRecentPresets = async (presetIds: string[]): Promise<void> => {
  try {
    const storage: RecentPresetsStorage = {
      version: PRESET_STORAGE_VERSION,
      presetIds: presetIds.slice(0, 5), // Keep only 5 most recent
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(RECENT_PRESETS_KEY, JSON.stringify(storage));
  } catch (error) {
    logger.error('Failed to save recent presets:', error);
  }
};

/**
 * Load recent preset IDs from localStorage
 */
export const loadRecentPresets = async (): Promise<string[]> => {
  try {
    const stored = localStorage.getItem(RECENT_PRESETS_KEY);
    if (!stored) return [];

    const storage: RecentPresetsStorage = JSON.parse(stored);
    return storage.presetIds;
  } catch (error) {
    logger.error('Failed to load recent presets:', error);
    return [];
  }
};

/**
 * Generate unique ID for custom presets
 */
export const generatePresetId = (): string => {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate preset data structure
 */
export const validatePreset = (preset: any): preset is AreaPreset => {
  return (
    typeof preset.id === 'string' &&
    typeof preset.name === 'string' &&
    typeof preset.area === 'number' &&
    preset.area > 0 &&
    typeof preset.unit === 'string' &&
    ['sqm', 'sqft', 'acres', 'hectares'].includes(preset.unit) &&
    typeof preset.shapeType === 'string' &&
    ['square', 'rectangle', 'circle'].includes(preset.shapeType) &&
    typeof preset.description === 'string' &&
    typeof preset.category === 'string'
  );
};
```

**Validation Criteria**:
- [ ] Custom presets save and load correctly
- [ ] Recent presets track last 5 used items
- [ ] Storage handles quota exceeded gracefully
- [ ] Validation prevents corrupted preset data
- [ ] Version compatibility system works

---

## Phase 2: Core Components (3.5 hours)

### Task 2.1: Create PresetsModal Component (1.5 hours)
**File**: `app/src/components/AddArea/PresetsModal.tsx`
**Priority**: High
**Dependencies**: Tasks 1.1, 1.2

**Implementation**:
```typescript
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_PRESETS, getPresetsByCategory, searchPresets } from '@/data/areaPresets';
import type { AreaPreset, PresetCategory } from '@/types';
import PresetCard from './PresetCard';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: AreaPreset) => void;
  onCustomize: (preset: AreaPreset) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onCustomize
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const {
    customPresets,
    recentPresets,
    addToRecentPresets
  } = useAppStore();

  // Combine default and custom presets
  const allPresets = useMemo(() => {
    return [...DEFAULT_PRESETS, ...customPresets];
  }, [customPresets]);

  // Filter presets based on category and search
  const filteredPresets = useMemo(() => {
    let filtered = allPresets;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(preset => preset.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = searchPresets(searchQuery, filtered);
    }

    return filtered;
  }, [allPresets, selectedCategory, searchQuery]);

  // Get recent presets for display
  const recentPresetItems = useMemo(() => {
    return recentPresets
      .map(id => allPresets.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 5) as AreaPreset[];
  }, [recentPresets, allPresets]);

  const handlePresetSelect = (preset: AreaPreset) => {
    setSelectedPreset(preset.id);
    onSelectPreset(preset);
    addToRecentPresets(preset.id);
    onClose();
  };

  const handleCustomize = (preset: AreaPreset) => {
    onCustomize(preset);
    addToRecentPresets(preset.id);
    onClose();
  };

  const categories: { id: PresetCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Presets' },
    { id: 'residential', label: 'Residential' },
    { id: 'commercial', label: 'Commercial' },
    { id: 'agricultural', label: 'Agricultural' },
    { id: 'mixed', label: 'Mixed Use' },
    { id: 'custom', label: 'My Presets' }
  ];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937',
            fontFamily: 'Nunito Sans, sans-serif'
          }}>
            Area Presets
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Search and Categories */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <input
            type="text"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '16px',
              fontFamily: 'Nunito Sans, sans-serif'
            }}
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '20px',
                  background: selectedCategory === category.id ? '#3b82f6' : 'white',
                  color: selectedCategory === category.id ? 'white' : '#374151',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Nunito Sans, sans-serif'
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Presets */}
        {recentPresetItems.length > 0 && selectedCategory === 'all' && !searchQuery && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280',
              fontFamily: 'Nunito Sans, sans-serif'
            }}>
              Recently Used
            </h3>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {recentPresetItems.map((preset) => (
                <div key={preset.id} style={{ minWidth: '120px' }}>
                  <PresetCard
                    preset={preset}
                    isCompact={true}
                    onSelect={() => handlePresetSelect(preset)}
                    onCustomize={() => handleCustomize(preset)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Presets Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {filteredPresets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280',
              fontFamily: 'Nunito Sans, sans-serif'
            }}>
              <p>No presets found matching your criteria.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {filteredPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPreset === preset.id}
                  onSelect={() => handlePresetSelect(preset)}
                  onCustomize={() => handleCustomize(preset)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'Nunito Sans, sans-serif'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresetsModal;
```

**Validation Criteria**:
- [ ] Modal opens and closes smoothly
- [ ] Category filtering works correctly
- [ ] Search functionality filters presets in real-time
- [ ] Recent presets display properly
- [ ] Responsive grid layout adapts to screen size
- [ ] All preset selections trigger correct actions

### Task 2.2: Create PresetCard Component (1 hour)
**File**: `app/src/components/AddArea/PresetCard.tsx`
**Priority**: High
**Dependencies**: Task 1.1, 1.2

**Implementation**:
```typescript
import React, { useMemo } from 'react';
import { calculateShapePreview } from '@/utils/areaCalculations';
import type { AreaPreset } from '@/types';

interface PresetCardProps {
  preset: AreaPreset;
  isSelected?: boolean;
  isCompact?: boolean;
  onSelect: () => void;
  onCustomize?: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isSelected = false,
  isCompact = false,
  onSelect,
  onCustomize
}) => {
  // Calculate preview dimensions
  const preview = useMemo(() => {
    try {
      return calculateShapePreview(preset.area, preset.unit, preset.shapeType, preset.aspectRatio);
    } catch {
      return null;
    }
  }, [preset]);

  // Shape type icon
  const getShapeIcon = (shapeType: string) => {
    switch (shapeType) {
      case 'square':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        );
      case 'rectangle':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="6" width="18" height="12" rx="2" ry="2"></rect>
          </svg>
        );
      case 'circle':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9"></circle>
          </svg>
        );
      default:
        return null;
    }
  };

  // Format area display
  const formatAreaDisplay = () => {
    const formattedArea = preset.area < 1
      ? preset.area.toFixed(2)
      : preset.area.toLocaleString();

    return `${formattedArea} ${preset.unit}`;
  };

  // Format dimensions display
  const formatDimensions = () => {
    if (!preview) return '';

    if (preset.shapeType === 'circle') {
      return `Radius: ${preview.radius?.toFixed(1)}m`;
    } else {
      return `${preview.width?.toFixed(1)}m × ${preview.height?.toFixed(1)}m`;
    }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: '8px',
        padding: isCompact ? '12px' : '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: isSelected ? '#eff6ff' : 'white',
        boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
        fontFamily: 'Nunito Sans, sans-serif',
        ...(isCompact && {
          minHeight: '100px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        })
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.backgroundColor = 'white';
        }
      }}
    >
      {/* Header with area and shape type */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isCompact ? '8px' : '12px'
      }}>
        <div style={{
          fontSize: isCompact ? '14px' : '16px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          {formatAreaDisplay()}
        </div>
        <div style={{
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center'
        }}>
          {getShapeIcon(preset.shapeType)}
        </div>
      </div>

      {/* Preset name */}
      <div style={{
        fontSize: isCompact ? '12px' : '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: isCompact ? '4px' : '8px'
      }}>
        {preset.name}
      </div>

      {/* Description (hidden in compact mode) */}
      {!isCompact && (
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '8px',
          lineHeight: '1.4'
        }}>
          {preset.description}
        </div>
      )}

      {/* Preview dimensions */}
      {preview && (
        <div style={{
          fontSize: '11px',
          color: '#9ca3af',
          fontWeight: '500'
        }}>
          {formatDimensions()}
        </div>
      )}

      {/* Custom preset indicator */}
      {preset.isCustom && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: '#10b981',
          color: 'white',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: '600'
        }}>
          CUSTOM
        </div>
      )}

      {/* Action buttons (non-compact mode) */}
      {!isCompact && onCustomize && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'Nunito Sans, sans-serif'
            }}
          >
            Use Preset
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCustomize();
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'Nunito Sans, sans-serif'
            }}
          >
            Customize
          </button>
        </div>
      )}
    </div>
  );
};

export default PresetCard;
```

**Validation Criteria**:
- [ ] Card displays all preset information correctly
- [ ] Shape type icons render properly
- [ ] Hover and selection states work smoothly
- [ ] Compact mode displays appropriately
- [ ] Action buttons trigger correct callbacks
- [ ] Custom preset indicator shows when applicable

### Task 2.3: Store Integration (1 hour)
**File**: `app/src/store/useAppStore.ts`
**Priority**: High
**Dependencies**: Tasks 1.1, 1.3

**Implementation**:
```typescript
// Add to existing useAppStore interface and implementation

// Add to interface (around line 48)
  // Presets modal actions
  presetsModalOpen: boolean;
  openPresetsModal: () => void;
  closePresetsModal: () => void;

  // Custom presets management
  customPresets: AreaPreset[];
  recentPresets: string[];
  favoritePresets: string[];
  loadCustomPresets: () => Promise<void>;
  saveCustomPreset: (preset: Omit<AreaPreset, 'id' | 'isCustom' | 'created'>) => void;
  deleteCustomPreset: (presetId: string) => void;
  addToRecentPresets: (presetId: string) => void;
  toggleFavoritePreset: (presetId: string) => void;

  // Preset actions
  createShapeFromPreset: (preset: AreaPreset) => void;

// Add to initial state (around line 200)
  presetsModalOpen: false,
  customPresets: [],
  recentPresets: [],
  favoritePresets: [],

// Add to actions (around line 800)
  // Presets modal management
  openPresetsModal: () => set({ presetsModalOpen: true }),
  closePresetsModal: () => set({ presetsModalOpen: false }),

  // Custom presets management
  loadCustomPresets: async () => {
    try {
      const customPresets = await loadCustomPresets();
      const recentPresets = await loadRecentPresets();
      set({ customPresets, recentPresets });
    } catch (error) {
      logger.error('Failed to load custom presets:', error);
    }
  },

  saveCustomPreset: (presetData) => {
    const preset: AreaPreset = {
      ...presetData,
      id: generatePresetId(),
      isCustom: true,
      created: new Date()
    };

    set(state => ({
      customPresets: [...state.customPresets, preset]
    }));

    // Persist to storage
    get().persistCustomPresets();
  },

  deleteCustomPreset: (presetId) => {
    set(state => ({
      customPresets: state.customPresets.filter(p => p.id !== presetId),
      recentPresets: state.recentPresets.filter(id => id !== presetId),
      favoritePresets: state.favoritePresets.filter(id => id !== presetId)
    }));

    get().persistCustomPresets();
  },

  addToRecentPresets: (presetId) => {
    set(state => {
      const filtered = state.recentPresets.filter(id => id !== presetId);
      const updated = [presetId, ...filtered].slice(0, 5);

      // Persist to storage
      saveRecentPresets(updated);

      return { recentPresets: updated };
    });
  },

  toggleFavoritePreset: (presetId) => {
    set(state => ({
      favoritePresets: state.favoritePresets.includes(presetId)
        ? state.favoritePresets.filter(id => id !== presetId)
        : [...state.favoritePresets, presetId]
    }));
  },

  // Create shape from preset
  createShapeFromPreset: (preset) => {
    const config: AddAreaConfig = {
      area: preset.area,
      unit: preset.unit,
      shapeType: preset.shapeType,
      aspectRatio: preset.aspectRatio
    };

    // Use existing createAreaShapeAdvanced
    get().createAreaShapeAdvanced(config);

    // Update recent presets
    get().addToRecentPresets(preset.id);

    // Close modal
    get().closePresetsModal();
  },

  // Helper method to persist custom presets
  persistCustomPresets: async () => {
    try {
      await saveCustomPresets(get().customPresets);
    } catch (error) {
      logger.error('Failed to persist custom presets:', error);
    }
  }
```

**Add imports at top of file**:
```typescript
import {
  loadCustomPresets,
  saveCustomPresets,
  loadRecentPresets,
  saveRecentPresets,
  generatePresetId
} from '@/utils/presetStorage';
import type { AreaPreset } from '@/types';
```

**Validation Criteria**:
- [ ] Modal state management works correctly
- [ ] Custom presets save and load from localStorage
- [ ] Recent presets track last 5 used items
- [ ] Preset to shape creation works seamlessly
- [ ] All store actions follow existing patterns
- [ ] No breaking changes to existing functionality

---

## Phase 3: System Integration (2 hours)

### Task 3.1: Connect Presets Button in App.tsx (1 hour)
**File**: `app/src/App.tsx`
**Priority**: High
**Dependencies**: Tasks 2.1, 2.3

**Implementation**:
```typescript
// Add to imports (around line 16)
import PresetsModal from './components/AddArea/PresetsModal';

// Add to App component after existing store hooks (around line 70)
const {
  presetsModalOpen,
  openPresetsModal,
  closePresetsModal,
  createShapeFromPreset,
  loadCustomPresets
} = useAppStore();

// Add after existing handlers (around line 180)
const handlePresetCustomize = (preset: AreaPreset) => {
  // Pre-fill AddArea modal with preset values
  const config: Partial<AddAreaConfig> = {
    area: preset.area,
    unit: preset.unit,
    shapeType: preset.shapeType,
    aspectRatio: preset.aspectRatio
  };

  // Open AddArea modal with preset values
  openAddAreaModal();
  // Note: AddArea modal will need to accept initial config
};

// Add useEffect for loading custom presets (around line 300)
useEffect(() => {
  loadCustomPresets();
}, [loadCustomPresets]);

// Update existing Presets button (around line 435-455)
<button
  onClick={openPresetsModal}  // Changed from no action to openPresetsModal
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '4px',
    minWidth: '70px',
    height: '60px',
    color: '#000000',
    background: 'white',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = '#f3f4f6';
    e.currentTarget.style.borderColor = '#d1d5db';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'white';
    e.currentTarget.style.borderColor = '#e5e7eb';
  }}
  title="Select from area presets"
>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
  </svg>
  <span style={{ marginTop: '4px' }}>Presets</span>
</button>

// Add PresetsModal before closing divs (around line 2000)
{presetsModalOpen && (
  <PresetsModal
    isOpen={presetsModalOpen}
    onClose={closePresetsModal}
    onSelectPreset={createShapeFromPreset}
    onCustomize={handlePresetCustomize}
  />
)}
```

**Validation Criteria**:
- [ ] Presets button opens modal correctly
- [ ] Modal integrates with existing UI without layout issues
- [ ] Custom presets load on app initialization
- [ ] Preset selection creates shapes correctly
- [ ] Customize option works with AddArea modal
- [ ] No conflicts with existing functionality

### Task 3.2: Enhance AddArea Modal for Preset Integration (1 hour)
**File**: `app/src/components/AddArea/AddAreaModal.tsx`
**Priority**: Medium
**Dependencies**: Task 3.1

**Implementation**:
```typescript
// Add to AddAreaModalProps interface
interface AddAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: Partial<AddAreaConfig>; // New prop for preset values
}

// Update component to accept initial config
export const AddAreaModal: React.FC<AddAreaModalProps> = ({
  isOpen,
  onClose,
  initialConfig
}) => {
  // Initialize config with preset values if provided
  const [config, setConfig] = useState<Partial<AddAreaConfig>>(() => ({
    unit: 'sqm',
    shapeType: 'square',
    aspectRatio: 1.5,
    ...initialConfig // Override with preset values
  }));

  // Reset config when modal opens with new initial config
  useEffect(() => {
    if (isOpen && initialConfig) {
      setConfig(prev => ({
        ...prev,
        ...initialConfig
      }));
    }
  }, [isOpen, initialConfig]);

  // Add save as preset functionality
  const { saveCustomPreset } = useAppStore();

  const handleSaveAsPreset = () => {
    if (!validation.isValid || !config.area || !config.unit || !config.shapeType) {
      return;
    }

    const presetName = prompt('Enter a name for this preset:');
    if (!presetName) return;

    const presetData = {
      name: presetName,
      area: config.area,
      unit: config.unit,
      shapeType: config.shapeType,
      aspectRatio: config.aspectRatio,
      description: `Custom preset: ${config.area} ${config.unit} ${config.shapeType}`,
      category: 'custom' as const
    };

    saveCustomPreset(presetData);
    alert('Preset saved successfully!');
  };

  // Add "Save as Preset" button in modal footer (before existing buttons)
  // In the modal footer section, add:
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px'
  }}>
    <button
      onClick={handleSaveAsPreset}
      disabled={!validation.isValid}
      style={{
        padding: '10px 16px',
        backgroundColor: validation.isValid ? '#10b981' : '#d1d5db',
        color: validation.isValid ? 'white' : '#9ca3af',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: validation.isValid ? 'pointer' : 'not-allowed',
        fontFamily: 'Nunito Sans, sans-serif'
      }}
    >
      Save as Preset
    </button>

    <div style={{ display: 'flex', gap: '12px' }}>
      {/* Existing Cancel and Create buttons */}
    </div>
  </div>
```

**Update App.tsx handlePresetCustomize**:
```typescript
const handlePresetCustomize = (preset: AreaPreset) => {
  const config: Partial<AddAreaConfig> = {
    area: preset.area,
    unit: preset.unit,
    shapeType: preset.shapeType,
    aspectRatio: preset.aspectRatio
  };

  setAddAreaInitialConfig(config); // New state for initial config
  openAddAreaModal();
  closePresetsModal();
};

// Add state for initial config
const [addAreaInitialConfig, setAddAreaInitialConfig] = useState<Partial<AddAreaConfig> | undefined>();

// Update AddAreaModal rendering
{addAreaModalOpen && (
  <AddAreaModal
    isOpen={addAreaModalOpen}
    onClose={() => {
      closeAddAreaModal();
      setAddAreaInitialConfig(undefined); // Clear initial config
    }}
    initialConfig={addAreaInitialConfig}
  />
)}
```

**Validation Criteria**:
- [ ] AddArea modal accepts initial configuration from presets
- [ ] Save as Preset functionality works correctly
- [ ] Modal resets properly when opening with preset values
- [ ] Custom presets appear in presets modal
- [ ] No regression in existing AddArea functionality

---

## Phase 4: Polish & Testing (1 hour)

### Task 4.1: UI Polish and Responsive Design (0.5 hours)
**Files**: All component files
**Priority**: Medium
**Dependencies**: All previous tasks

**Implementation**:
```typescript
// Add responsive breakpoints utility
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

// Update PresetsModal for mobile responsiveness
const { isMobile } = useResponsive();

// Update modal container styles
<div style={{
  backgroundColor: 'white',
  borderRadius: isMobile ? '12px 12px 0 0' : '12px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  maxWidth: isMobile ? '100%' : '800px',
  width: isMobile ? '100%' : '90%',
  maxHeight: isMobile ? '90vh' : '80vh',
  position: isMobile ? 'fixed' : 'relative',
  bottom: isMobile ? 0 : 'auto',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}}>

// Update presets grid for mobile
<div style={{
  display: 'grid',
  gridTemplateColumns: isMobile
    ? 'repeat(auto-fill, minmax(150px, 1fr))'
    : 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: isMobile ? '12px' : '16px'
}}>

// Add loading states and animations
const [isLoading, setIsLoading] = useState(false);

const handlePresetSelect = async (preset: AreaPreset) => {
  setIsLoading(true);
  try {
    await onSelectPreset(preset);
  } finally {
    setIsLoading(false);
  }
};

// Add loading spinner component
const LoadingSpinner = () => (
  <div style={{
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '50%',
    borderTopColor: '#3b82f6',
    animation: 'spin 1s linear infinite'
  }} />
);
```

**Validation Criteria**:
- [ ] Modal is fully responsive on mobile devices
- [ ] Loading states provide clear feedback
- [ ] Animations are smooth and purposeful
- [ ] Touch interactions work properly on mobile
- [ ] Accessibility features are implemented

### Task 4.2: Integration Testing and Validation (0.5 hours)
**Priority**: High
**Dependencies**: All previous tasks

**Test Cases**:
```typescript
// Create test file: app/src/test/presets.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_PRESETS } from '@/data/areaPresets';

describe('Presets Feature', () => {
  beforeEach(() => {
    useAppStore.getState().clearAll();
  });

  it('should open and close presets modal', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.openPresetsModal();
    });

    expect(result.current.presetsModalOpen).toBe(true);

    act(() => {
      result.current.closePresetsModal();
    });

    expect(result.current.presetsModalOpen).toBe(false);
  });

  it('should create shape from preset', () => {
    const { result } = renderHook(() => useAppStore());
    const preset = DEFAULT_PRESETS[0];

    act(() => {
      result.current.createShapeFromPreset(preset);
    });

    expect(result.current.shapes).toHaveLength(1);
    expect(result.current.recentPresets).toContain(preset.id);
  });

  it('should save and load custom presets', async () => {
    const { result } = renderHook(() => useAppStore());

    const customPreset = {
      name: 'Test Preset',
      area: 1000,
      unit: 'sqm' as const,
      shapeType: 'square' as const,
      description: 'Test description',
      category: 'custom' as const
    };

    act(() => {
      result.current.saveCustomPreset(customPreset);
    });

    expect(result.current.customPresets).toHaveLength(1);
    expect(result.current.customPresets[0].name).toBe('Test Preset');
  });

  it('should track recent presets correctly', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.addToRecentPresets('preset-1');
      result.current.addToRecentPresets('preset-2');
      result.current.addToRecentPresets('preset-1'); // Duplicate should move to top
    });

    expect(result.current.recentPresets[0]).toBe('preset-1');
    expect(result.current.recentPresets[1]).toBe('preset-2');
    expect(result.current.recentPresets).toHaveLength(2);
  });
});
```

**Manual Testing Checklist**:
- [ ] Presets button opens modal
- [ ] All categories display correct presets
- [ ] Search filters presets correctly
- [ ] Recent presets show last used items
- [ ] Preset selection creates accurate shapes
- [ ] Customize option pre-fills AddArea modal
- [ ] Custom presets save and persist
- [ ] Modal is responsive on mobile
- [ ] No errors in browser console
- [ ] Performance meets targets (< 100ms modal load)

**Validation Criteria**:
- [ ] All automated tests pass
- [ ] Manual testing checklist completed
- [ ] No regression in existing functionality
- [ ] Performance targets met
- [ ] Code follows project conventions

---

## Summary

### Total Implementation Time: 10 hours

**Phase 1 (2 hours)**: Foundation
- Type definitions and data structures
- Default presets dataset
- Storage utilities

**Phase 2 (3.5 hours)**: Core Components
- PresetsModal with search and categories
- PresetCard with responsive design
- Store integration

**Phase 3 (2 hours)**: System Integration
- Connect to existing toolbar
- AddArea modal enhancement
- End-to-end workflow

**Phase 4 (1 hour)**: Polish & Testing
- Responsive design and animations
- Comprehensive testing

### Deliverables
- [ ] 18+ categorized area presets
- [ ] Fully functional presets modal
- [ ] Custom preset creation and management
- [ ] Seamless AddArea integration
- [ ] Responsive mobile design
- [ ] Comprehensive test coverage

### Success Metrics
- Modal load time < 100ms
- Zero regression in existing features
- Intuitive user experience
- Professional visual design
- Code quality meets project standards

---

**Document Owner**: Development Team
**Implementation Start**: 2025-09-18
**Estimated Completion**: 2025-09-20