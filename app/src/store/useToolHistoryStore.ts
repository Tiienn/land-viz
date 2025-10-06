import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TrackedAction,
  ToolUsageStats,
  Workflow,
  WorkflowExecutionState,
  RecordingState,
  ActionType,
  WorkflowStep
} from '../types';
import { DEFAULT_WORKFLOWS } from '../services/defaultWorkflows';
import { sanitizeTextInput, generateId, formatBytes } from '../utils/validation';
import { logger } from '../utils/logger';
import { ImportDataSchema } from '../schemas/workflowSchema';

// Maximum file size for imports: 5MB
const MAX_IMPORT_SIZE = 5 * 1024 * 1024;

interface ToolHistoryState {
  // State properties
  recentActions: TrackedAction[];
  maxRecentActions: number;
  usageStats: ToolUsageStats;
  workflows: Workflow[];
  workflowExecution: WorkflowExecutionState;
  recording: RecordingState;

  // Actions
  trackAction: (action: TrackedAction) => void;
  clearHistory: () => void;
  pinTool: (actionType: ActionType) => void;
  unpinTool: (actionType: ActionType) => void;
  addWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'usageCount'>) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => void;
  startWorkflow: (id: string) => Promise<void>;
  pauseWorkflow: () => void;
  resumeWorkflow: () => Promise<void>;
  stopWorkflow: () => void;
  executeNextStep: () => Promise<boolean>;
  startRecording: () => void;
  stopRecording: (name?: string, description?: string) => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  addRecordedStep: (step: Omit<WorkflowStep, 'id'>) => void;
  deleteLastStep: () => void;
  exportWorkflows: () => string;
  importWorkflows: (data: string) => boolean;
}

export const useToolHistoryStore = create<ToolHistoryState>()(
  persist(
    (set, get) => {
      // Initialize default workflows on first run
      const initializeDefaults = () => {
        const state = get();

        // Only add defaults if workflows array is empty (first run)
        if (state.workflows.length === 0) {
          const defaultWorkflows = DEFAULT_WORKFLOWS.map(workflow => ({
            ...workflow,
            id: `workflow-default-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            usageCount: 0,
          }));

          set({ workflows: defaultWorkflows });
        }
      };

      // Schedule initialization after store creation
      if (typeof window !== 'undefined') {
        setTimeout(initializeDefaults, 0);
      }

      return {
        // Initial state
        recentActions: [],
        maxRecentActions: 8,
        usageStats: {},
        workflows: [],
        workflowExecution: {
          workflowId: null,
          currentStep: 0,
          isExecuting: false,
          isPaused: false,
          executionHistory: [],
        },
        recording: {
          isRecording: false,
          recordedSteps: [],
          startTime: 0,
          isPaused: false,
        },

      // Track action in recent history and update usage stats
      trackAction: (action: TrackedAction) => {
        set((state) => {
          // Add to recent actions (FIFO, max 8)
          const newRecentActions = [action, ...state.recentActions];

          // Remove duplicates of consecutive same actions
          const filteredRecentActions = newRecentActions.filter((curr, index) => {
            if (index === 0) return true;
            const prev = newRecentActions[index - 1];
            return curr.type !== prev.type;
          });

          // Keep only the last maxRecentActions
          const trimmedRecentActions = filteredRecentActions.slice(0, state.maxRecentActions);

          // Update usage stats
          const key = action.type;
          const currentStats = state.usageStats[key] || {
            actionType: action.type,
            count: 0,
            lastUsed: 0,
            isPinned: false,
          };

          const newUsageStats = {
            ...state.usageStats,
            [key]: {
              ...currentStats,
              count: currentStats.count + 1,
              lastUsed: action.timestamp,
            },
          };

          // If recording, add to recorded steps
          let newRecording = state.recording;
          if (state.recording.isRecording && !state.recording.isPaused) {
            const recordedStep: WorkflowStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              action: action.type,
              params: action.params,
            };

            newRecording = {
              ...state.recording,
              recordedSteps: [...state.recording.recordedSteps, recordedStep],
            };
          }

          return {
            recentActions: trimmedRecentActions,
            usageStats: newUsageStats,
            recording: newRecording,
          };
        });
      },

      // Clear recent actions history
      clearHistory: () => {
        set({ recentActions: [] });
      },

      // Pin a tool to frequently used
      pinTool: (actionType: ActionType) => {
        set((state) => {
          const key = actionType;
          const currentStats = state.usageStats[key] || {
            actionType,
            count: 0,
            lastUsed: Date.now(),
            isPinned: false,
          };

          // Check if we already have 3 pinned items
          const pinnedCount = Object.values(state.usageStats).filter(s => s.isPinned).length;
          if (pinnedCount >= 3 && !currentStats.isPinned) {
            logger.warn('Maximum 3 pinned tools allowed');
            return state;
          }

          return {
            usageStats: {
              ...state.usageStats,
              [key]: {
                ...currentStats,
                isPinned: true,
              },
            },
          };
        });
      },

      // Unpin a tool
      unpinTool: (actionType: ActionType) => {
        set((state) => {
          const key = actionType;
          const currentStats = state.usageStats[key];
          if (!currentStats) return state;

          return {
            usageStats: {
              ...state.usageStats,
              [key]: {
                ...currentStats,
                isPinned: false,
              },
            },
          };
        });
      },

      // Add a new workflow
      addWorkflow: (workflow) => {
        set((state) => {
          // Generate unique ID
          const id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const newWorkflow: Workflow = {
            ...workflow,
            id,
            createdAt: Date.now(),
            usageCount: 0,
          };

          return {
            workflows: [...state.workflows, newWorkflow],
          };
        });
      },

      // Update existing workflow
      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map(w =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      // Delete a workflow
      deleteWorkflow: (id) => {
        set((state) => {
          const workflow = state.workflows.find(w => w.id === id);
          if (workflow?.isBuiltIn) {
            logger.warn('Cannot delete built-in workflows');
            return state;
          }

          return {
            workflows: state.workflows.filter(w => w.id !== id),
          };
        });
      },

      // Duplicate a workflow
      duplicateWorkflow: (id) => {
        set((state) => {
          const workflow = state.workflows.find(w => w.id === id);
          if (!workflow) {
            logger.error('Workflow not found:', id);
            return state;
          }

          // Create copy with new ID and updated name
          const newId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const copyNumber = state.workflows.filter(w => w.name.startsWith(workflow.name)).length;

          const newWorkflow: Workflow = {
            ...workflow,
            id: newId,
            name: `${workflow.name} (${copyNumber + 1})`,
            isBuiltIn: false, // Copies are never built-in
            createdAt: Date.now(),
            usageCount: 0,
            lastUsed: undefined,
          };

          return {
            workflows: [...state.workflows, newWorkflow],
          };
        });
      },

      // Start workflow execution (implementation in Phase 3)
      startWorkflow: async (id: string) => {
        const workflow = get().workflows.find(w => w.id === id);
        if (!workflow) {
          logger.error('Workflow not found:', id);
          return;
        }

        set({
          workflowExecution: {
            workflowId: id,
            currentStep: 0,
            isExecuting: true,
            isPaused: false,
            executionHistory: [],
          },
        });

        // Execution logic will be added in Phase 3
        logger.info('Workflow execution started:', workflow.name);
      },

      // Pause workflow execution
      pauseWorkflow: () => {
        set((state) => ({
          workflowExecution: {
            ...state.workflowExecution,
            isPaused: true,
          },
        }));
      },

      // Resume workflow execution
      resumeWorkflow: async () => {
        set((state) => ({
          workflowExecution: {
            ...state.workflowExecution,
            isPaused: false,
          },
        }));

        // Continue execution (implementation in Phase 3)
      },

      // Stop workflow execution
      stopWorkflow: () => {
        set({
          workflowExecution: {
            workflowId: null,
            currentStep: 0,
            isExecuting: false,
            isPaused: false,
            executionHistory: [],
          },
        });
      },

      // Execute next step (implementation in Phase 3)
      executeNextStep: async () => {
        // Will be implemented in Phase 3 with WorkflowEngine
        return false;
      },

      // Start recording a workflow
      startRecording: () => {
        set({
          recording: {
            isRecording: true,
            recordedSteps: [],
            startTime: Date.now(),
            isPaused: false,
          },
        });
      },

      // Stop recording and save as workflow
      stopRecording: (name, description) => {
        const state = get();

        if (state.recording.recordedSteps.length === 0) {
          logger.warn('No steps recorded');
          set({
            recording: {
              isRecording: false,
              recordedSteps: [],
              startTime: 0,
              isPaused: false,
            },
          });
          return;
        }

        // Sanitize user input to prevent XSS attacks
        const defaultName = `Recorded Workflow ${new Date().toLocaleString()}`;
        const defaultDescription = `Recorded on ${new Date().toLocaleString()}`;

        const workflowName = sanitizeTextInput(name || defaultName, 100);
        const workflowDescription = sanitizeTextInput(description || defaultDescription, 500);

        get().addWorkflow({
          name: workflowName,
          description: workflowDescription,
          icon: '🎬',
          isBuiltIn: false,
          steps: state.recording.recordedSteps,
        });

        // Clear recording state
        set({
          recording: {
            isRecording: false,
            recordedSteps: [],
            startTime: 0,
            isPaused: false,
          },
        });
      },

      // Pause recording
      pauseRecording: () => {
        set((state) => ({
          recording: {
            ...state.recording,
            isPaused: true,
          },
        }));
      },

      // Resume recording
      resumeRecording: () => {
        set((state) => ({
          recording: {
            ...state.recording,
            isPaused: false,
          },
        }));
      },

      // Manually add a step to recording
      addRecordedStep: (step) => {
        set((state) => {
          if (!state.recording.isRecording) {
            logger.warn('Not currently recording');
            return state;
          }

          const newStep: WorkflowStep = {
            ...step,
            id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };

          return {
            recording: {
              ...state.recording,
              recordedSteps: [...state.recording.recordedSteps, newStep],
            },
          };
        });
      },

      // Delete last recorded step
      deleteLastStep: () => {
        set((state) => {
          if (!state.recording.isRecording || state.recording.recordedSteps.length === 0) {
            return state;
          }

          return {
            recording: {
              ...state.recording,
              recordedSteps: state.recording.recordedSteps.slice(0, -1),
            },
          };
        });
      },

      // Export workflows as JSON
      exportWorkflows: () => {
        const state = get();
        const exportData = {
          version: '1.0',
          exportedAt: Date.now(),
          workflows: state.workflows.filter(w => !w.isBuiltIn), // Don't export built-in workflows
        };

        return JSON.stringify(exportData, null, 2);
      },

      // Import workflows from JSON with comprehensive validation
      importWorkflows: (data: string) => {
        try {
          // 1. Size validation - prevent DoS via oversized files
          const byteSize = new Blob([data]).size;
          if (byteSize > MAX_IMPORT_SIZE) {
            logger.error(`Import file too large: ${formatBytes(byteSize)} (max: ${formatBytes(MAX_IMPORT_SIZE)})`);
            return false;
          }

          // 2. Parse JSON with error handling
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (parseError) {
            logger.error('Invalid JSON syntax in import file:', parseError);
            return false;
          }

          // 3. Schema validation using Zod
          const validationResult = ImportDataSchema.safeParse(parsed);

          if (!validationResult.success) {
            // Log detailed validation errors
            const errorMessages = validationResult.error.errors.map(err =>
              `${err.path.join('.')}: ${err.message}`
            ).join(', ');

            logger.error('Import validation failed:', errorMessages);
            logger.error('Validation errors:', validationResult.error.errors);
            return false;
          }

          // 4. Extract validated data
          const validatedData = validationResult.data;

          // 5. Add imported workflows with security measures
          set((state) => {
            const newWorkflows: Workflow[] = validatedData.workflows.map((w) => ({
              ...w,
              // Security: Generate new unique IDs (don't trust imported IDs)
              id: generateId('workflow'),

              // Security: Force isBuiltIn to false (prevent privilege escalation)
              isBuiltIn: false,

              // Security: Sanitize text fields to prevent XSS
              name: sanitizeTextInput(w.name, 100),
              description: sanitizeTextInput(w.description, 500),

              // Set metadata
              createdAt: Date.now(),
              usageCount: 0,
              lastUsed: undefined,

              // Sanitize workflow steps
              steps: w.steps.map(step => ({
                ...step,
                id: generateId('step'),
                // Note: params are validated by schema but not sanitized
                // as they contain structured data, not user-facing strings
              }))
            }));

            logger.info(`Successfully imported ${newWorkflows.length} workflow(s)`);

            return {
              workflows: [...state.workflows, ...newWorkflows],
            };
          });

          return true;
        } catch (error) {
          logger.error('Unexpected error during workflow import:', error);
          return false;
        }
      },
    };
  },
    {
      name: 'tool-history-storage',
      partialize: (state) => ({
        recentActions: state.recentActions,
        usageStats: state.usageStats,
        workflows: state.workflows,
      }),
    }
  )
);
