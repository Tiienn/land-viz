# Detailed Implementation Tasks: Area Configuration Presets

**Spec ID**: 004
**Feature**: Area Configuration Presets
**Total Estimated Time**: 10 hours
**Created**: 2025-09-18
**Task Breakdown Version**: 2.0 (Enhanced)

## Prerequisites Checklist

Before starting implementation, ensure:

- [ ] Development environment is set up (`cd app && npm install`)
- [ ] Current codebase is working (`npm run dev` starts successfully)
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] Existing AddArea feature is functional
- [ ] Git branch created for presets feature

### Quick Test Commands

```bash
# Verify environment
cd app
npm run type-check
npm run lint
npm test
npm run dev

# Create feature branch
git checkout -b feature/area-presets
```

---

## Phase 1: Foundation (2 hours)

### Task 1.1: Extend Type Definitions (30 minutes)
**File**: `app/src/types/index.ts`
**Priority**: Critical
**Dependencies**: None

**Action Items**:
- [ ] Add preset category enum
- [ ] Create AreaPreset interface
- [ ] Add preset filter types
- [ ] Create preset modal state interface
- [ ] Validate TypeScript compilation

**Implementation**:
```typescript
// Add to app/src/types/index.ts after existing types

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
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] All new types are properly exported
- [ ] Interfaces include comprehensive JSDoc documentation
- [ ] No breaking changes to existing types

### Task 1.2: Create Default Presets Dataset (60 minutes)
**File**: `app/src/data/areaPresets.ts`
**Priority**: High
**Dependencies**: Task 1.1

**Action Items**:
- [ ] Create new data directory if needed
- [ ] Define 18+ industry-standard presets
- [ ] Organize presets by category
- [ ] Add utility functions for preset operations
- [ ] Validate preset data integrity

**Implementation**:
```typescript
// Create app/src/data/areaPresets.ts
import type { AreaPreset } from '@/types';

/**
 * Default area presets organized by category
 */
export const DEFAULT_PRESETS: AreaPreset[] = [
  // Residential Category (5 presets)
  {
    id: 'res-small-suburban',
    name: 'Small Suburban Lot',
    area: 0.25,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.5,
    description: 'Typical small suburban residential lot (10,890 sqft)',
    category: 'residential'
  },
  {
    id: 'res-standard-suburban',
    name: 'Standard Suburban Lot',
    area: 0.5,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.3,
    description: 'Standard suburban residential lot (21,780 sqft)',
    category: 'residential'
  },
  {
    id: 'res-large-lot',
    name: 'Large Residential Lot',
    area: 1,
    unit: 'acres',
    shapeType: 'rectangle',
    aspectRatio: 1.2,
    description: 'Large residential lot with space for gardens (43,560 sqft)',
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

  // Commercial Category (5 presets)
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

  // Agricultural Category (5 presets)
  {
    id: 'agr-small-farm',
    name: 'Small Farm Plot',
    area: 1,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.2,
    description: 'Small agricultural plot (2.47 acres)',
    category: 'agricultural'
  },
  {
    id: 'agr-medium-farm',
    name: 'Medium Farm Parcel',
    area: 5,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.5,
    description: 'Medium agricultural parcel (12.35 acres)',
    category: 'agricultural'
  },
  {
    id: 'agr-large-farm',
    name: 'Large Agricultural Plot',
    area: 10,
    unit: 'hectares',
    shapeType: 'rectangle',
    aspectRatio: 1.3,
    description: 'Large agricultural development (24.7 acres)',
    category: 'agricultural'
  },
  {
    id: 'agr-quarter-section',
    name: 'Quarter Section',
    area: 160,
    unit: 'acres',
    shapeType: 'square',
    description: 'US agricultural quarter section',
    category: 'agricultural'
  },
  {
    id: 'agr-section',
    name: 'Full Section',
    area: 640,
    unit: 'acres',
    shapeType: 'square',
    description: 'US agricultural full section (1 square mile)',
    category: 'agricultural'
  },

  // Mixed Use Category (3 presets)
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
 * Get all preset categories with counts
 */
export const getPresetCategories = (): Array<{ category: PresetCategory; count: number }> => {
  const categories: PresetCategory[] = ['residential', 'commercial', 'agricultural', 'mixed'];
  return categories.map(category => ({
    category,
    count: getPresetsByCategory(category).length
  }));
};

/**
 * Search presets by name or description
 */
export const searchPresets = (query: string, presets: AreaPreset[] = DEFAULT_PRESETS): AreaPreset[] => {
  if (!query.trim()) return presets;

  const searchTerm = query.toLowerCase();
  return presets.filter(preset =>
    preset.name.toLowerCase().includes(searchTerm) ||
    preset.description.toLowerCase().includes(searchTerm) ||
    preset.area.toString().includes(searchTerm) ||
    preset.unit.toLowerCase().includes(searchTerm)
  );
};

/**
 * Validate preset data integrity
 */
export const validatePresetData = (): boolean => {
  const ids = new Set<string>();

  for (const preset of DEFAULT_PRESETS) {
    // Check for duplicate IDs
    if (ids.has(preset.id)) {
      console.error(`Duplicate preset ID: ${preset.id}`);
      return false;
    }
    ids.add(preset.id);

    // Validate required fields
    if (!preset.name || !preset.description || preset.area <= 0) {
      console.error(`Invalid preset data: ${preset.id}`);
      return false;
    }

    // Validate aspect ratio for rectangles
    if (preset.shapeType === 'rectangle' && (!preset.aspectRatio || preset.aspectRatio <= 0)) {
      console.error(`Invalid aspect ratio for rectangle preset: ${preset.id}`);
      return false;
    }
  }

  return true;
};
```

**Validation Criteria**:
- [ ] 18+ presets across 4 categories
- [ ] All presets have unique IDs
- [ ] Realistic area values and descriptions
- [ ] Proper aspect ratios for rectangular presets
- [ ] Search function works correctly
- [ ] Data validation passes

### Task 1.3: Create Preset Storage Utilities (30 minutes)
**File**: `app/src/utils/presetStorage.ts`
**Priority**: Medium
**Dependencies**: Task 1.1

**Action Items**:
- [ ] Create storage utilities for custom presets
- [ ] Implement localStorage persistence
- [ ] Add error handling for storage limitations
- [ ] Create preset validation functions
- [ ] Add migration/versioning support

**Implementation**:
```typescript
// Create app/src/utils/presetStorage.ts
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

    const serialized = JSON.stringify(storage);

    // Check storage size
    if (serialized.length > 2 * 1024 * 1024) { // 2MB limit
      throw new Error('Custom presets exceed storage limit');
    }

    localStorage.setItem(CUSTOM_PRESETS_KEY, serialized);
    logger.log('Custom presets saved:', storage.presets.length);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      logger.error('Storage quota exceeded - cleaning up old presets');
      // Implement cleanup strategy
      await cleanupOldPresets();
      // Retry with fewer presets
      const reducedPresets = presets.slice(0, Math.floor(presets.length * 0.8));
      return saveCustomPresets(reducedPresets);
    }
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
      logger.log('Preset storage version mismatch, migrating data');
      return await migratePresetStorage(storage);
    }

    // Validate each preset
    const validPresets = storage.presets.filter(validatePreset);
    if (validPresets.length !== storage.presets.length) {
      logger.warn('Some custom presets were invalid and removed');
      await saveCustomPresets(validPresets);
    }

    return validPresets;
  } catch (error) {
    logger.error('Failed to load custom presets:', error);
    // Clear corrupted data
    localStorage.removeItem(CUSTOM_PRESETS_KEY);
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
  try {
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
      typeof preset.category === 'string' &&
      (preset.aspectRatio === undefined || (typeof preset.aspectRatio === 'number' && preset.aspectRatio > 0))
    );
  } catch {
    return false;
  }
};

/**
 * Clean up old custom presets
 */
const cleanupOldPresets = async (): Promise<void> => {
  try {
    const presets = await loadCustomPresets();

    // Sort by last used, keep most recent 10
    const sortedPresets = presets
      .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
      .slice(0, 10);

    await saveCustomPresets(sortedPresets);
    logger.log('Cleaned up old presets, kept:', sortedPresets.length);
  } catch (error) {
    logger.error('Failed to cleanup old presets:', error);
  }
};

/**
 * Migrate preset storage to new version
 */
const migratePresetStorage = async (oldStorage: any): Promise<AreaPreset[]> => {
  // For now, just clear old data and start fresh
  // In future versions, implement actual migration logic
  logger.log('Migrating preset storage - clearing old data');
  localStorage.removeItem(CUSTOM_PRESETS_KEY);
  return [];
};
```

**Validation Criteria**:
- [ ] Custom presets save and load correctly
- [ ] Storage quota exceeded handled gracefully
- [ ] Data validation prevents corrupted presets
- [ ] Recent presets track correctly
- [ ] Error handling covers all edge cases

---

## Phase 2: Core Components (3.5 hours)

### Task 2.1: Create PresetCard Component (60 minutes)
**File**: `app/src/components/AddArea/PresetCard.tsx`
**Priority**: High
**Dependencies**: Task 1.1, 1.2

**Action Items**:
- [ ] Create PresetCard component file
- [ ] Implement preset data display
- [ ] Add shape type icons
- [ ] Create hover and selection states
- [ ] Add responsive design
- [ ] Implement action callbacks

**Implementation**:
```typescript
// Create app/src/components/AddArea/PresetCard.tsx
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
    } catch (error) {
      console.warn('Failed to calculate preview for preset:', preset.id, error);
      return null;
    }
  }, [preset]);

  // Shape type icon
  const getShapeIcon = (shapeType: string) => {
    const iconStyle = { width: '20px', height: '20px' };

    switch (shapeType) {
      case 'square':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        );
      case 'rectangle':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="6" width="18" height="12" rx="2" ry="2"></rect>
          </svg>
        );
      case 'circle':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    if (!preview) return 'Calculating...';

    if (preset.shapeType === 'circle') {
      return `Radius: ${preview.radius?.toFixed(1)}m`;
    } else {
      return `${preview.width?.toFixed(1)}m × ${preview.height?.toFixed(1)}m`;
    }
  };

  const cardStyle: React.CSSProperties = {
    position: 'relative',
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
  };

  return (
    <div
      style={cardStyle}
      onClick={onSelect}
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
        marginBottom: isCompact ? '4px' : '8px',
        lineHeight: '1.3'
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
      <div style={{
        fontSize: '11px',
        color: '#9ca3af',
        fontWeight: '500'
      }}>
        {formatDimensions()}
      </div>

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
              fontFamily: 'Nunito Sans, sans-serif',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
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
              fontFamily: 'Nunito Sans, sans-serif',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
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
- [ ] Responsive design works on different screen sizes

### Task 2.2: Create PresetsModal Component (90 minutes)
**File**: `app/src/components/AddArea/PresetsModal.tsx`
**Priority**: High
**Dependencies**: Task 1.1, 1.2, 2.1

**Action Items**:
- [ ] Create modal container with overlay
- [ ] Implement category-based navigation
- [ ] Add search functionality
- [ ] Create preset grid layout
- [ ] Add recent presets section
- [ ] Implement modal actions

**Implementation**:
```typescript
// Create app/src/components/AddArea/PresetsModal.tsx
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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedPreset(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const categories: { id: PresetCategory | 'all'; label: string; count?: number }[] = [
    { id: 'all', label: 'All Presets', count: allPresets.length },
    { id: 'residential', label: 'Residential', count: getPresetsByCategory('residential').length },
    { id: 'commercial', label: 'Commercial', count: getPresetsByCategory('commercial').length },
    { id: 'agricultural', label: 'Agricultural', count: getPresetsByCategory('agricultural').length },
    { id: 'mixed', label: 'Mixed Use', count: getPresetsByCategory('mixed').length },
    { id: 'custom', label: 'My Presets', count: customPresets.length }
  ];

  if (!isOpen) return null;

  return (
    <div
      style={{
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
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Nunito Sans, sans-serif'
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
            color: '#1f2937'
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
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b7280';
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
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
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
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category.id) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category.id) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {category.label} {category.count !== undefined && `(${category.count})`}
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
              color: '#6b7280'
            }}>
              Recently Used
            </h3>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {recentPresetItems.map((preset) => (
                <div key={preset.id} style={{ minWidth: '120px', flexShrink: 0 }}>
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
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📐</div>
              <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
                No presets found
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                {searchQuery
                  ? `Try adjusting your search for "${searchQuery}"`
                  : 'Try selecting a different category'
                }
              </p>
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
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
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
- [ ] Keyboard navigation works (Tab, Escape)
- [ ] Clicking outside modal closes it

### Task 2.3: Extend Store with Preset Actions (60 minutes)
**File**: `app/src/store/useAppStore.ts`
**Priority**: High
**Dependencies**: Task 1.1, 1.3

**Action Items**:
- [ ] Add preset state to store interface
- [ ] Implement preset modal actions
- [ ] Add custom preset management
- [ ] Create preset to shape conversion
- [ ] Add recent presets tracking
- [ ] Implement storage integration

**Implementation**:
```typescript
// Add to app/src/store/useAppStore.ts

// Add imports at the top
import {
  loadCustomPresets,
  saveCustomPresets,
  loadRecentPresets,
  saveRecentPresets,
  generatePresetId
} from '@/utils/presetStorage';
import type { AreaPreset, PresetCategory } from '@/types';

// Add to AppStore interface (around line 48)
  // Presets modal state
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

// Add to actions section (around line 800)
  // Presets modal management
  openPresetsModal: () => set({ presetsModalOpen: true }),
  closePresetsModal: () => set({ presetsModalOpen: false }),

  // Custom presets management
  loadCustomPresets: async () => {
    try {
      const customPresets = await loadCustomPresets();
      const recentPresets = await loadRecentPresets();
      set({ customPresets, recentPresets });
      logger.log('Loaded custom presets:', customPresets.length);
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
    logger.log('Saved custom preset:', preset.name);
  },

  deleteCustomPreset: (presetId) => {
    set(state => ({
      customPresets: state.customPresets.filter(p => p.id !== presetId),
      recentPresets: state.recentPresets.filter(id => id !== presetId),
      favoritePresets: state.favoritePresets.filter(id => id !== presetId)
    }));

    get().persistCustomPresets();
    logger.log('Deleted custom preset:', presetId);
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
    try {
      const config: AddAreaConfig = {
        area: preset.area,
        unit: preset.unit,
        shapeType: preset.shapeType,
        aspectRatio: preset.aspectRatio
      };

      // Validate config before creating shape
      const validation = validateAddAreaConfig(config);
      if (!validation.isValid) {
        logger.error('Invalid preset configuration:', validation.errors);
        return;
      }

      // Use existing createAreaShapeAdvanced
      get().createAreaShapeAdvanced(config);

      // Update recent presets
      get().addToRecentPresets(preset.id);

      // Close modal
      get().closePresetsModal();

      logger.log('Created shape from preset:', preset.name);
    } catch (error) {
      logger.error('Failed to create shape from preset:', error);
    }
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

**Validation Criteria**:
- [ ] Modal state management works correctly
- [ ] Custom presets save and load from localStorage
- [ ] Recent presets track last 5 used items
- [ ] Preset to shape creation works seamlessly
- [ ] All store actions follow existing patterns
- [ ] No breaking changes to existing functionality
- [ ] Error handling covers edge cases

---

## Phase 3: Integration (2 hours)

### Task 3.1: Connect Presets Button in App.tsx (60 minutes)
**File**: `app/src/App.tsx`
**Priority**: High
**Dependencies**: Task 2.2, 2.3

**Action Items**:
- [ ] Import PresetsModal component
- [ ] Connect store actions to existing button
- [ ] Add modal to component tree
- [ ] Implement preset customization handler
- [ ] Add preset initialization
- [ ] Test integration

**Implementation**:
```typescript
// Add to imports in app/src/App.tsx (around line 16)
import PresetsModal from './components/AddArea/PresetsModal';
import type { AreaPreset } from './types';

// Add to store hooks (around line 70)
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

  // Set initial config for AddArea modal
  setAddAreaInitialConfig(config);
  openAddAreaModal();
  closePresetsModal();
};

// Add state for initial config (around line 50)
const [addAreaInitialConfig, setAddAreaInitialConfig] = useState<Partial<AddAreaConfig> | undefined>();

// Add useEffect for loading custom presets (around line 300)
useEffect(() => {
  // Load custom presets on app initialization
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

// Update AddAreaModal rendering to accept initial config
{addAreaModalOpen && (
  <AddAreaModal
    isOpen={addAreaModalOpen}
    onClose={() => {
      closeAddAreaModal();
      setAddAreaInitialConfig(undefined); // Clear initial config
    }}
    initialConfig={addAreaInitialConfig}  // Pass initial config
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

### Task 3.2: Enhance AddArea Modal for Preset Integration (60 minutes)
**File**: `app/src/components/AddArea/AddAreaModal.tsx`
**Priority**: Medium
**Dependencies**: Task 3.1

**Action Items**:
- [ ] Add initialConfig prop to AddAreaModal
- [ ] Update modal to accept preset values
- [ ] Add save as preset functionality
- [ ] Implement config reset on modal open
- [ ] Test preset integration

**Implementation**:
```typescript
// Update AddAreaModalProps interface in app/src/components/AddArea/AddAreaModal.tsx
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
    ...initialConfig // Override with preset values if provided
  }));

  // Store hook for saving custom presets
  const { saveCustomPreset } = useAppStore();

  // Reset config when modal opens with new initial config
  useEffect(() => {
    if (isOpen && initialConfig) {
      setConfig(prev => ({
        ...prev,
        ...initialConfig
      }));
    } else if (isOpen && !initialConfig) {
      // Reset to defaults if no initial config
      setConfig({
        unit: 'sqm',
        shapeType: 'square',
        aspectRatio: 1.5
      });
    }
  }, [isOpen, initialConfig]);

  // Add save as preset functionality
  const handleSaveAsPreset = () => {
    if (!validation.isValid || !config.area || !config.unit || !config.shapeType) {
      return;
    }

    const presetName = prompt('Enter a name for this preset:');
    if (!presetName?.trim()) return;

    const presetData = {
      name: presetName.trim(),
      area: config.area,
      unit: config.unit,
      shapeType: config.shapeType,
      aspectRatio: config.aspectRatio,
      description: `Custom preset: ${config.area} ${config.unit} ${config.shapeType}`,
      category: 'custom' as const
    };

    try {
      saveCustomPreset(presetData);

      // Show success feedback
      const successMessage = document.createElement('div');
      successMessage.textContent = 'Preset saved successfully!';
      successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-family: Nunito Sans, sans-serif;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
      `;

      document.body.appendChild(successMessage);
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      alert('Failed to save preset. Please try again.');
    }
  };

  // Add CSS animation for success message
  useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isOpen]);

  // In the modal footer section, add "Save as Preset" button before existing buttons
  // Find the modal footer and update it:
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
        fontFamily: 'Nunito Sans, sans-serif',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (validation.isValid) {
          e.currentTarget.style.backgroundColor = '#059669';
        }
      }}
      onMouseLeave={(e) => {
        if (validation.isValid) {
          e.currentTarget.style.backgroundColor = '#10b981';
        }
      }}
    >
      💾 Save as Preset
    </button>

    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        onClick={onClose}
        style={{
          padding: '10px 20px',
          backgroundColor: '#f3f4f6',
          color: '#374151',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          fontFamily: 'Nunito Sans, sans-serif'
        }}
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={!validation.isValid || isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: validation.isValid && !isLoading ? '#3b82f6' : '#d1d5db',
          color: validation.isValid && !isLoading ? 'white' : '#9ca3af',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: validation.isValid && !isLoading ? 'pointer' : 'not-allowed',
          fontFamily: 'Nunito Sans, sans-serif'
        }}
      >
        {isLoading ? 'Creating...' : 'Create Area'}
      </button>
    </div>
  </div>
```

**Validation Criteria**:
- [ ] AddArea modal accepts initial configuration from presets
- [ ] Save as Preset functionality works correctly
- [ ] Modal resets properly when opening with preset values
- [ ] Custom presets appear in presets modal
- [ ] No regression in existing AddArea functionality
- [ ] Success feedback shows when preset is saved

---

## Phase 4: Testing and Polish (1 hour)

### Task 4.1: Create Test Files (30 minutes)
**File**: `app/src/test/presets.test.ts`
**Priority**: Medium
**Dependencies**: All previous tasks

**Action Items**:
- [ ] Create preset functionality tests
- [ ] Test store integration
- [ ] Test component rendering
- [ ] Test error handling
- [ ] Test performance requirements

**Implementation**:
```typescript
// Create app/src/test/presets.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_PRESETS } from '@/data/areaPresets';
import PresetsModal from '@/components/AddArea/PresetsModal';
import PresetCard from '@/components/AddArea/PresetCard';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Presets Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.getState().clearAll();
  });

  describe('Store Integration', () => {
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
      expect(result.current.presetsModalOpen).toBe(false);
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
      expect(result.current.customPresets[0].isCustom).toBe(true);
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

    it('should limit recent presets to 5 items', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        for (let i = 1; i <= 7; i++) {
          result.current.addToRecentPresets(`preset-${i}`);
        }
      });

      expect(result.current.recentPresets).toHaveLength(5);
      expect(result.current.recentPresets[0]).toBe('preset-7');
    });
  });

  describe('PresetCard Component', () => {
    const mockPreset = DEFAULT_PRESETS[0];
    const mockOnSelect = vi.fn();
    const mockOnCustomize = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render preset information correctly', () => {
      render(
        <PresetCard
          preset={mockPreset}
          onSelect={mockOnSelect}
          onCustomize={mockOnCustomize}
        />
      );

      expect(screen.getByText(mockPreset.name)).toBeInTheDocument();
      expect(screen.getByText(mockPreset.description)).toBeInTheDocument();
    });

    it('should call onSelect when card is clicked', () => {
      render(
        <PresetCard
          preset={mockPreset}
          onSelect={mockOnSelect}
          onCustomize={mockOnCustomize}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /use preset/i }));
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onCustomize when customize button is clicked', () => {
      render(
        <PresetCard
          preset={mockPreset}
          onSelect={mockOnSelect}
          onCustomize={mockOnCustomize}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /customize/i }));
      expect(mockOnCustomize).toHaveBeenCalledTimes(1);
    });

    it('should display custom badge for custom presets', () => {
      const customPreset = { ...mockPreset, isCustom: true };
      render(
        <PresetCard
          preset={customPreset}
          onSelect={mockOnSelect}
          onCustomize={mockOnCustomize}
        />
      );

      expect(screen.getByText('CUSTOM')).toBeInTheDocument();
    });
  });

  describe('PresetsModal Component', () => {
    const mockOnClose = vi.fn();
    const mockOnSelectPreset = vi.fn();
    const mockOnCustomize = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render modal when open', () => {
      render(
        <PresetsModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPreset={mockOnSelectPreset}
          onCustomize={mockOnCustomize}
        />
      );

      expect(screen.getByText('Area Presets')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search presets...')).toBeInTheDocument();
    });

    it('should filter presets by search query', async () => {
      render(
        <PresetsModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPreset={mockOnSelectPreset}
          onCustomize={mockOnCustomize}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search presets...');
      fireEvent.change(searchInput, { target: { value: 'Small' } });

      await waitFor(() => {
        const smallSuburbanPreset = DEFAULT_PRESETS.find(p => p.name.includes('Small'));
        if (smallSuburbanPreset) {
          expect(screen.getByText(smallSuburbanPreset.name)).toBeInTheDocument();
        }
      });
    });

    it('should filter presets by category', () => {
      render(
        <PresetsModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPreset={mockOnSelectPreset}
          onCustomize={mockOnCustomize}
        />
      );

      fireEvent.click(screen.getByText(/residential/i));

      const residentialPresets = DEFAULT_PRESETS.filter(p => p.category === 'residential');
      residentialPresets.forEach(preset => {
        expect(screen.getByText(preset.name)).toBeInTheDocument();
      });
    });

    it('should close modal when escape key is pressed', () => {
      render(
        <PresetsModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPreset={mockOnSelectPreset}
          onCustomize={mockOnCustomize}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of presets efficiently', () => {
      const startTime = performance.now();

      const largePresetList = Array.from({ length: 1000 }, (_, i) => ({
        ...DEFAULT_PRESETS[0],
        id: `preset-${i}`,
        name: `Preset ${i}`,
        area: 1000 + i
      }));

      // Simulate search operation
      const searchResults = largePresetList.filter(p => p.name.includes('100'));

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      expect(searchTime).toBeLessThan(50); // Should complete in under 50ms
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const { result } = renderHook(() => useAppStore());

      expect(() => {
        act(() => {
          result.current.saveCustomPreset({
            name: 'Test',
            area: 1000,
            unit: 'sqm',
            shapeType: 'square',
            description: 'Test',
            category: 'custom'
          });
        });
      }).not.toThrow();
    });

    it('should handle corrupted preset data', async () => {
      localStorageMock.getItem.mockReturnValue('{"invalid": "json}');

      const { result } = renderHook(() => useAppStore());

      await act(async () => {
        await result.current.loadCustomPresets();
      });

      expect(result.current.customPresets).toEqual([]);
    });
  });
});
```

**Validation Criteria**:
- [ ] All tests pass
- [ ] Test coverage > 80% for preset-related code
- [ ] Performance tests meet requirements
- [ ] Error handling scenarios covered
- [ ] Component rendering tests work

### Task 4.2: Manual Testing and Polish (30 minutes)
**Priority**: High
**Dependencies**: All previous tasks

**Action Items**:
- [ ] Test complete workflow end-to-end
- [ ] Verify responsive design
- [ ] Test error scenarios
- [ ] Performance validation
- [ ] Polish UI interactions

**Manual Testing Checklist**:

**Basic Functionality**:
- [ ] Presets button opens modal
- [ ] All categories display correct presets
- [ ] Search filters presets correctly
- [ ] Recent presets show last used items
- [ ] Preset selection creates accurate shapes
- [ ] Customize option pre-fills AddArea modal
- [ ] Custom presets save and persist
- [ ] Modal closes with Escape key
- [ ] Clicking outside modal closes it

**Performance Testing**:
- [ ] Modal opens in < 100ms
- [ ] Search responds in real-time
- [ ] No lag with large preset lists
- [ ] Memory usage remains stable

**Responsive Design**:
- [ ] Works on mobile (375px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1440px width)
- [ ] Grid layout adapts properly
- [ ] Text remains readable at all sizes

**Error Scenarios**:
- [ ] localStorage disabled
- [ ] Corrupted preset data
- [ ] Network errors (if applicable)
- [ ] Invalid preset configurations

**Browser Compatibility**:
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest (if available)
- [ ] Edge latest

**Accessibility**:
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Proper focus management
- [ ] Color contrast sufficient

**Integration Testing**:
- [ ] No errors in browser console
- [ ] No TypeScript compilation errors
- [ ] No regression in existing functionality
- [ ] AddArea integration works seamlessly

---

## Completion Checklist

### Before Starting
- [ ] Development environment set up
- [ ] Current codebase working
- [ ] Feature branch created
- [ ] Dependencies verified

### Phase 1 Complete
- [ ] Type definitions added and compiling
- [ ] Default presets dataset created
- [ ] Storage utilities implemented
- [ ] All tests pass for foundation

### Phase 2 Complete
- [ ] PresetCard component renders correctly
- [ ] PresetsModal component functional
- [ ] Store actions integrated
- [ ] Components work together

### Phase 3 Complete
- [ ] Presets button connected
- [ ] AddArea modal enhanced
- [ ] End-to-end workflow working
- [ ] No breaking changes

### Phase 4 Complete
- [ ] All tests written and passing
- [ ] Manual testing checklist completed
- [ ] Performance requirements met
- [ ] Ready for production

### Final Validation
- [ ] Code follows project conventions
- [ ] TypeScript strict mode compliance
- [ ] Inline styling consistency
- [ ] No external dependencies added
- [ ] Documentation updated if needed

---

**Total Estimated Time**: 10 hours
**Recommended Timeline**: 2-3 days
**Success Criteria**: All validation checkboxes completed

This task breakdown provides a clear, step-by-step implementation path for the Area Configuration Presets feature with comprehensive testing and validation at each step.