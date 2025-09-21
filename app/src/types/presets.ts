import type { AreaUnit } from './index';

// Area Presets Feature Types
export type PresetCategory = 'residential' | 'commercial' | 'agricultural' | 'mixed' | 'custom';

export interface AreaPreset {
  id: string;
  name: string;
  area: number;
  unit: AreaUnit;
  shapeType: 'square' | 'rectangle' | 'circle';
  aspectRatio?: number;
  description: string;
  category: PresetCategory;
  isCustom?: boolean;
  created?: Date;
  lastUsed?: Date;
}

export interface PresetsModalState {
  isOpen: boolean;
  selectedCategory: PresetCategory;
  searchQuery: string;
  selectedPreset: string | null;
  isLoading: boolean;
}

export interface PresetsState {
  // Modal state
  presetsModal: PresetsModalState;

  // Preset data
  defaultPresets: AreaPreset[];
  customPresets: AreaPreset[];
  recentPresets: string[]; // Preset IDs
  favoritePresets: string[]; // Preset IDs
}