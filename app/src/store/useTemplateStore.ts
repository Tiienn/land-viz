import { create } from 'zustand';
import type { PropertyTemplate, TemplateFilter } from '../types/template';
import { templateStorage } from '../services/templateStorage';

/**
 * Template Store
 * Manages template state and user interactions
 */

interface TemplateState {
  // Data
  templates: PropertyTemplate[];
  activeFilter: TemplateFilter;
  isGalleryOpen: boolean;
  isSaveDialogOpen: boolean;
  selectedTemplateId: string | null;
  searchQuery: string;

  // Actions
  loadAllTemplates: () => Promise<void>;
  openGallery: () => void;
  closeGallery: () => void;
  openSaveDialog: () => void;
  closeSaveDialog: () => void;
  selectTemplate: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: Partial<TemplateFilter>) => void;
  toggleFavorite: (id: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  // Initial state
  templates: [],
  activeFilter: {
    showBuiltIn: true,
    showUserTemplates: true,
    showFavorites: false,
  },
  isGalleryOpen: false,
  isSaveDialogOpen: false,
  selectedTemplateId: null,
  searchQuery: '',

  // Load all templates from storage
  loadAllTemplates: async () => {
    try {
      const templates = await templateStorage.getAllTemplates();
      set({ templates });
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  },

  // Gallery control
  openGallery: () => {
    get().loadAllTemplates(); // Refresh on open
    set({ isGalleryOpen: true });
  },

  closeGallery: () => {
    set({ isGalleryOpen: false, selectedTemplateId: null });
  },

  // Save dialog control
  openSaveDialog: () => {
    set({ isSaveDialogOpen: true });
  },

  closeSaveDialog: () => {
    set({ isSaveDialogOpen: false });
  },

  // Template selection
  selectTemplate: (id) => {
    set({ selectedTemplateId: id });
  },

  // Search
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // Filter
  setFilter: (filter) => {
    set((state) => ({
      activeFilter: { ...state.activeFilter, ...filter },
    }));
  },

  // Toggle favorite
  toggleFavorite: async (id) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return;

    try {
      await templateStorage.updateTemplateMetadata(id, {
        isFavorite: !template.isFavorite,
      });
      await get().loadAllTemplates();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  },

  // Delete template
  deleteTemplate: async (id) => {
    try {
      await templateStorage.deleteTemplate(id);
      await get().loadAllTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  },
}));
