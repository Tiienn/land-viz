import type { AreaPreset } from '../types/presets';
import { logger } from './logger';

const STORAGE_KEY = 'landviz-custom-presets';
const STORAGE_VERSION = '1.0';

interface StorageData {
  version: string;
  presets: AreaPreset[];
  metadata: {
    created: string;
    lastModified: string;
    count: number;
  };
}

/**
 * Load custom presets from localStorage
 */
export const loadCustomPresets = (): AreaPreset[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const data: StorageData = JSON.parse(stored);

    // Version compatibility check
    if (data.version !== STORAGE_VERSION) {
      logger.warn('Custom presets version mismatch, migrating...', {
        stored: data.version,
        current: STORAGE_VERSION
      });
      return migratePresets(data.presets || []);
    }

    // Validate preset data
    const validPresets = data.presets.filter(validatePreset);

    if (validPresets.length !== data.presets.length) {
      logger.warn('Some custom presets were invalid and skipped', {
        total: data.presets.length,
        valid: validPresets.length
      });
    }

    logger.log('Custom presets loaded successfully', {
      count: validPresets.length
    });

    return validPresets;

  } catch (error) {
    logger.error('Failed to load custom presets from localStorage', error);
    return [];
  }
};

/**
 * Save custom presets to localStorage
 */
export const saveCustomPresets = (presets: AreaPreset[]): boolean => {
  try {
    const data: StorageData = {
      version: STORAGE_VERSION,
      presets,
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        count: presets.length
      }
    };

    const serialized = JSON.stringify(data);

    // Check storage size (warn if over 1MB)
    if (serialized.length > 1048576) {
      logger.warn('Custom presets storage is getting large', {
        size: serialized.length,
        presetCount: presets.length
      });
    }

    localStorage.setItem(STORAGE_KEY, serialized);

    logger.log('Custom presets saved successfully', {
      count: presets.length,
      size: serialized.length
    });

    return true;

  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      logger.error('localStorage quota exceeded while saving presets', error);
      // Attempt cleanup
      return attemptStorageCleanup(presets);
    } else {
      logger.error('Failed to save custom presets to localStorage', error);
      return false;
    }
  }
};

/**
 * Clear all custom presets from localStorage
 */
export const clearCustomPresets = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    logger.log('Custom presets cleared from localStorage');
    return true;
  } catch (error) {
    logger.error('Failed to clear custom presets', error);
    return false;
  }
};

/**
 * Get storage statistics
 */
export const getStorageStats = (): {
  hasData: boolean;
  presetCount: number;
  storageSize: number;
  version: string;
} => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        hasData: false,
        presetCount: 0,
        storageSize: 0,
        version: STORAGE_VERSION
      };
    }

    const data: StorageData = JSON.parse(stored);
    return {
      hasData: true,
      presetCount: data.presets?.length || 0,
      storageSize: stored.length,
      version: data.version || 'unknown'
    };

  } catch (error) {
    logger.error('Failed to get storage stats', error);
    return {
      hasData: false,
      presetCount: 0,
      storageSize: 0,
      version: 'error'
    };
  }
};

/**
 * Validate a preset object
 */
const validatePreset = (preset: any): preset is AreaPreset => {
  return (
    preset &&
    typeof preset.id === 'string' &&
    typeof preset.name === 'string' &&
    typeof preset.area === 'number' &&
    preset.area > 0 &&
    ['sqm', 'sqft', 'acres', 'hectares', 'sqkm'].includes(preset.unit) &&
    ['square', 'rectangle', 'circle'].includes(preset.shapeType) &&
    typeof preset.description === 'string' &&
    ['residential', 'commercial', 'agricultural', 'mixed', 'custom'].includes(preset.category)
  );
};

/**
 * Migrate presets from older versions
 */
const migratePresets = (oldPresets: any[]): AreaPreset[] => {
  return oldPresets
    .map(preset => {
      // Add any migration logic here for future versions
      return {
        ...preset,
        category: preset.category || 'custom',
        isCustom: true,
        created: preset.created ? new Date(preset.created) : new Date(),
      };
    })
    .filter(validatePreset);
};

/**
 * Attempt to free up storage space when quota is exceeded
 */
const attemptStorageCleanup = (currentPresets: AreaPreset[]): boolean => {
  try {
    // Remove oldest presets if we have more than 50
    if (currentPresets.length > 50) {
      const sortedByDate = [...currentPresets].sort((a, b) => {
        const aDate = a.created ? new Date(a.created).getTime() : 0;
        const bDate = b.created ? new Date(b.created).getTime() : 0;
        return bDate - aDate; // Newest first
      });

      const trimmedPresets = sortedByDate.slice(0, 50);

      logger.warn('Trimming old presets to free storage space', {
        original: currentPresets.length,
        trimmed: trimmedPresets.length
      });

      return saveCustomPresets(trimmedPresets);
    }

    return false;
  } catch (error) {
    logger.error('Failed to cleanup storage', error);
    return false;
  }
};

/**
 * Export presets to JSON file
 */
export const exportPresetsToFile = (presets: AreaPreset[]): void => {
  try {
    const data = {
      version: STORAGE_VERSION,
      exported: new Date().toISOString(),
      presets
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `landviz-presets-${new Date().toISOString().split('T')[0]}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    logger.log('Presets exported to file', {
      count: presets.length
    });

  } catch (error) {
    logger.error('Failed to export presets to file', error);
    throw error;
  }
};

/**
 * Import presets from JSON file
 */
export const importPresetsFromFile = (file: File): Promise<AreaPreset[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        const presets = data.presets || data; // Support both wrapped and unwrapped formats
        const validPresets = Array.isArray(presets)
          ? presets.filter(validatePreset)
          : [];

        if (validPresets.length === 0) {
          reject(new Error('No valid presets found in file'));
          return;
        }

        logger.log('Presets imported from file', {
          total: Array.isArray(presets) ? presets.length : 0,
          valid: validPresets.length
        });

        resolve(validPresets);

      } catch (error) {
        logger.error('Failed to parse preset file', error);
        reject(new Error('Invalid preset file format'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read preset file'));
    };

    reader.readAsText(file);
  });
};