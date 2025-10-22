/**
 * Import Store - State Management for Hybrid Image Import
 *
 * Manages the complete hybrid import workflow:
 * - File upload
 * - Boundary detection results
 * - OCR results (with timeout support)
 * - Manual dimension entry
 * - Reconstructed shape geometry
 * - Template library
 *
 * WORKFLOW:
 * 1. Upload file → boundary detection + OCR (5s timeout)
 * 2. If OCR fails → manual entry
 * 3. User enters dimensions → geometry reconstruction
 * 4. Preview shape → confirm import
 *
 * @example
 * ```typescript
 * const { setUploadedFile, setDimension, dimensions } = useImportStore();
 *
 * // Upload file
 * setUploadedFile(file);
 *
 * // Manual entry
 * setDimension(0, { edgeIndex: 0, value: 21.45, unit: 'm' });
 * ```
 */

import { create } from 'zustand';
import type {
  SimpleBoundaryDetection,
  OcrDetectionResult,
  DimensionInput,
  ReconstructedShape,
  SavedTemplate,
} from '../types/imageImport';
import { logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Current step in import workflow
 */
export type ImportStep =
  | 'upload'           // File selection
  | 'detection'        // Running boundary detection + OCR
  | 'manual_entry'     // User entering dimensions
  | 'preview'          // Previewing reconstructed shape
  | 'complete';        // Import finished

/**
 * Import store state
 */
interface ImportState {
  // ===== Upload =====
  /** Uploaded file */
  uploadedFile: File | null;
  /** Image URL for preview */
  imageUrl: string | null;

  // ===== Detection Results =====
  /** Boundary detection result */
  boundaryDetection: SimpleBoundaryDetection | null;
  /** OCR detection result (may timeout) */
  ocrDetection: OcrDetectionResult | null;

  // ===== Manual Entry =====
  /** Dimension inputs (one per edge) */
  dimensions: DimensionInput[];
  /** Optional area for validation */
  area: number | null;
  /** Area unit */
  areaUnit: 'm²' | 'ft²' | 'yd²';
  /** Custom edge labels (edgeIndex → label) */
  edgeLabels: Record<number, string>;

  // ===== Geometry Reconstruction =====
  /** Reconstructed shape from dimensions */
  reconstructedShape: ReconstructedShape | null;

  // ===== Templates =====
  /** Saved shape templates */
  templates: SavedTemplate[];

  // ===== UI State =====
  /** Current workflow step */
  currentStep: ImportStep;
  /** Error message (if any) */
  error: string | null;
  /** Whether processing is in progress */
  isProcessing: boolean;
}

/**
 * Import store actions
 */
interface ImportActions {
  // ===== Upload =====
  setUploadedFile: (file: File | null) => void;
  setImageUrl: (url: string | null) => void;

  // ===== Detection =====
  setBoundaryDetection: (result: SimpleBoundaryDetection) => void;
  setOcrDetection: (result: OcrDetectionResult) => void;

  // ===== Manual Entry =====
  setDimension: (index: number, dimension: DimensionInput) => void;
  setAllDimensions: (dimensions: DimensionInput[]) => void;
  setArea: (area: number | null) => void;
  setAreaUnit: (unit: 'm²' | 'ft²' | 'yd²') => void;
  setEdgeLabel: (edgeIndex: number, label: string) => void;

  // ===== Geometry Reconstruction =====
  setReconstructedShape: (shape: ReconstructedShape | null) => void;

  // ===== Templates =====
  addTemplate: (template: SavedTemplate) => void;
  removeTemplate: (templateId: string) => void;
  loadTemplate: (templateId: string) => void;
  setTemplates: (templates: SavedTemplate[]) => void;

  // ===== Navigation =====
  goToStep: (step: ImportStep) => void;
  setError: (error: string | null) => void;
  setIsProcessing: (processing: boolean) => void;

  // ===== Reset =====
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: ImportState = {
  // Upload
  uploadedFile: null,
  imageUrl: null,

  // Detection
  boundaryDetection: null,
  ocrDetection: null,

  // Manual Entry
  dimensions: [],
  area: null,
  areaUnit: 'm²',
  edgeLabels: {},

  // Geometry
  reconstructedShape: null,

  // Templates
  templates: [],

  // UI State
  currentStep: 'upload',
  error: null,
  isProcessing: false,
};

// ============================================================================
// Store
// ============================================================================

export const useImportStore = create<ImportState & ImportActions>((set, get) => ({
  // ===== State =====
  ...initialState,

  // ===== Upload Actions =====
  setUploadedFile: (file) => {
    set({ uploadedFile: file });

    // Create object URL for preview
    if (file) {
      const url = URL.createObjectURL(file);
      set({ imageUrl: url });
    } else {
      set({ imageUrl: null });
    }
  },

  setImageUrl: (url) => set({ imageUrl: url }),

  // ===== Detection Actions =====
  setBoundaryDetection: (result) => {
    set({ boundaryDetection: result });

    // Initialize dimensions array based on edge count
    if (result.status === 'success' && result.edgeCount > 0) {
      const dimensions: DimensionInput[] = Array.from(
        { length: result.edgeCount },
        (_, i) => ({
          edgeIndex: i,
          value: 0,
          unit: 'm',
        })
      );
      set({ dimensions });
    }
  },

  setOcrDetection: (result) => set({ ocrDetection: result }),

  // ===== Manual Entry Actions =====
  setDimension: (index, dimension) => {
    const { dimensions } = get();
    const updated = [...dimensions];
    updated[index] = dimension;
    set({ dimensions: updated });
  },

  setAllDimensions: (dimensions) => set({ dimensions }),

  setArea: (area) => set({ area }),

  setAreaUnit: (unit) => set({ areaUnit: unit }),

  setEdgeLabel: (edgeIndex, label) => {
    const { edgeLabels } = get();
    set({
      edgeLabels: {
        ...edgeLabels,
        [edgeIndex]: label,
      },
    });
  },

  // ===== Geometry Actions =====
  setReconstructedShape: (shape) => set({ reconstructedShape: shape }),

  // ===== Template Actions =====
  addTemplate: (template) => {
    const { templates } = get();
    set({ templates: [...templates, template] });

    // Persist to localStorage
    try {
      localStorage.setItem(
        'land-viz-import-templates',
        JSON.stringify([...templates, template])
      );
    } catch (error) {
      logger.error('[ImportStore]', 'Failed to save template to localStorage:', error);
    }
  },

  removeTemplate: (templateId) => {
    const { templates } = get();
    const filtered = templates.filter((t) => t.id !== templateId);
    set({ templates: filtered });

    // Persist to localStorage
    try {
      localStorage.setItem('land-viz-import-templates', JSON.stringify(filtered));
    } catch (error) {
      logger.error('[ImportStore]', 'Failed to remove template from localStorage:', error);
    }
  },

  loadTemplate: (templateId) => {
    const { templates } = get();
    const template = templates.find((t) => t.id === templateId);

    if (!template) {
      logger.error('[ImportStore]', `Template ${templateId} not found`);
      return;
    }

    // Load template dimensions
    const dimensions: DimensionInput[] = template.dimensions.map((value, index) => ({
      edgeIndex: index,
      value,
      unit: 'm', // Templates always stored in meters
    }));

    set({
      dimensions,
      area: template.area || null,
      areaUnit: 'm²',
    });
  },

  setTemplates: (templates) => set({ templates }),

  // ===== Navigation Actions =====
  goToStep: (step) => set({ currentStep: step }),

  setError: (error) => set({ error }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  // ===== Reset Action =====
  reset: () => {
    // Cleanup image URL
    const { imageUrl } = get();
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    set(initialState);
  },
}));

/**
 * Load templates from localStorage on store initialization
 */
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('land-viz-import-templates');
    if (stored) {
      const templates = JSON.parse(stored) as SavedTemplate[];
      useImportStore.setState({ templates });
    }
  } catch (error) {
    logger.error('[ImportStore]', 'Failed to load templates from localStorage:', error);
  }
}

export default useImportStore;
