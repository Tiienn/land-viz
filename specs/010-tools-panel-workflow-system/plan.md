# Implementation Plan: Tools Panel with Smart Workflow System

**Feature:** Tools Panel with Smart Workflow System
**Specification:** [spec.md](./spec.md)
**Date:** 2025-01-05
**Estimated Duration:** 3-4 weeks
**Priority:** High

---

## Technical Context

### Current Architecture
- **Framework:** React 18 + TypeScript + Vite
- **3D Engine:** Three.js + React Three Fiber + Drei
- **State Management:** Zustand (domain-specific stores)
- **Styling:** Inline styles only (constitutional requirement)
- **Testing:** Vitest + React Testing Library + jest-axe
- **Storage:** localStorage for persistence

### Existing Components to Integrate With
- `App.tsx` - Left sidebar with Tools button (line ~1907-1941)
- `useAppStore.ts` - Main application state store
- Other panels: `LayerPanel`, `ComparisonPanel`, `ConvertPanel`
- All existing tool activation points

### Dependencies Needed
- [x] **No new external dependencies required**
- [x] Uses built-in localStorage API
- [x] Uses existing Zustand patterns
- [x] Leverages existing Icon component

---

## Implementation Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         User Interaction Layer                  │
│  (ToolsPanel component, workflow dialogs)       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         State Management Layer                  │
│  (useToolHistoryStore - Zustand)                │
│  - Recent actions tracking                      │
│  - Frequency counting                           │
│  - Workflow storage                             │
│  - Recording state                              │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           Service Layer                         │
│  (workflowEngine.ts, workflowStorage.ts)        │
│  - Workflow execution logic                     │
│  - Action recording                             │
│  - localStorage persistence                     │
│  - Validation & error handling                  │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│        Integration Layer                        │
│  (Action interceptors in useAppStore)           │
│  - Track all tool activations                   │
│  - Increment usage counters                     │
│  - Trigger workflow steps                       │
└─────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Week 1)

### Goal
Set up core data structures, state management, and basic UI shell

### 1.1 Define Type System

**File:** `src/types/index.ts` (append to existing file)

```typescript
// Tool History Types
export type ActionType =
  | 'tool:select'
  | 'tool:line'
  | 'tool:rectangle'
  | 'tool:circle'
  | 'tool:polyline'
  | 'tool:measure'
  | 'tool:rotate'
  | 'edit:mode'
  | 'panel:compare'
  | 'panel:convert'
  | 'panel:calculator'
  | 'panel:layers'
  | 'shape:duplicate'
  | 'shape:delete'
  | 'view:toggle2d';

export interface TrackedAction {
  id: string;
  type: ActionType;
  timestamp: number;
  label: string; // Human-readable name
  icon?: string; // Icon name from Icon component
  params?: Record<string, any>; // Additional context
}

export interface ToolUsageStats {
  [key: string]: {
    actionType: ActionType;
    count: number;
    lastUsed: number;
    isPinned: boolean;
  };
}

// Workflow Types
export interface WorkflowStep {
  id: string;
  action: ActionType;
  params?: Record<string, any>;
  prompt?: {
    message: string;
    type: 'number' | 'text' | 'select';
    options?: string[];
    defaultValue?: any;
  };
  validation?: {
    requiresSelection?: boolean;
    requiresShape?: boolean;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  isBuiltIn: boolean;
  steps: WorkflowStep[];
  createdAt: number;
  lastUsed?: number;
  usageCount: number;
}

export interface WorkflowExecutionState {
  workflowId: string | null;
  currentStep: number;
  isExecuting: boolean;
  isPaused: boolean;
  executionHistory: string[]; // Step IDs completed
  error?: string;
}

export interface RecordingState {
  isRecording: boolean;
  recordedSteps: WorkflowStep[];
  startTime: number;
  isPaused: boolean;
}
```

**Validation:**
- [ ] All types compile without errors
- [ ] Types export correctly from index.ts
- [ ] No conflicts with existing types

---

### 1.2 Create Tool History Store

**File:** `src/store/useToolHistoryStore.ts` (new file)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TrackedAction,
  ToolUsageStats,
  Workflow,
  WorkflowExecutionState,
  RecordingState,
  ActionType
} from '../types';

interface ToolHistoryState {
  // Recent Actions
  recentActions: TrackedAction[];
  maxRecentActions: number;

  // Usage Statistics
  usageStats: ToolUsageStats;

  // Workflows
  workflows: Workflow[];
  workflowExecution: WorkflowExecutionState;
  recording: RecordingState;

  // Actions
  trackAction: (action: TrackedAction) => void;
  clearHistory: () => void;
  pinTool: (actionType: ActionType) => void;
  unpinTool: (actionType: ActionType) => void;

  // Workflow Management
  addWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'usageCount'>) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => void;

  // Workflow Execution
  startWorkflow: (id: string) => Promise<void>;
  pauseWorkflow: () => void;
  resumeWorkflow: () => Promise<void>;
  stopWorkflow: () => void;
  executeNextStep: () => Promise<boolean>;

  // Recording
  startRecording: () => void;
  stopRecording: (name?: string, description?: string) => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  addRecordedStep: (step: Omit<WorkflowStep, 'id'>) => void;
  deleteLastStep: () => void;

  // Import/Export
  exportWorkflows: () => string;
  importWorkflows: (data: string) => boolean;
}

export const useToolHistoryStore = create<ToolHistoryState>()(
  persist(
    (set, get) => ({
      // Initial State
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

      // Actions Implementation
      trackAction: (action) => {
        set((state) => {
          // Add to recent actions (FIFO)
          const newRecentActions = [action, ...state.recentActions].slice(
            0,
            state.maxRecentActions
          );

          // Update usage stats
          const newUsageStats = { ...state.usageStats };
          if (!newUsageStats[action.type]) {
            newUsageStats[action.type] = {
              actionType: action.type,
              count: 0,
              lastUsed: 0,
              isPinned: false,
            };
          }
          newUsageStats[action.type].count += 1;
          newUsageStats[action.type].lastUsed = action.timestamp;

          // If recording, add to recorded steps
          const newRecording = { ...state.recording };
          if (state.recording.isRecording && !state.recording.isPaused) {
            newRecording.recordedSteps = [
              ...state.recording.recordedSteps,
              {
                id: `step-${Date.now()}`,
                action: action.type,
                params: action.params,
              },
            ];
          }

          return {
            recentActions: newRecentActions,
            usageStats: newUsageStats,
            recording: newRecording,
          };
        });
      },

      clearHistory: () => {
        set({ recentActions: [] });
      },

      pinTool: (actionType) => {
        set((state) => {
          const newStats = { ...state.usageStats };
          if (newStats[actionType]) {
            newStats[actionType].isPinned = true;
          }
          return { usageStats: newStats };
        });
      },

      unpinTool: (actionType) => {
        set((state) => {
          const newStats = { ...state.usageStats };
          if (newStats[actionType]) {
            newStats[actionType].isPinned = false;
          }
          return { usageStats: newStats };
        });
      },

      // Workflow Management
      addWorkflow: (workflow) => {
        set((state) => ({
          workflows: [
            ...state.workflows,
            {
              ...workflow,
              id: `workflow-${Date.now()}`,
              createdAt: Date.now(),
              usageCount: 0,
            },
          ],
        }));
      },

      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      deleteWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
        }));
      },

      duplicateWorkflow: (id) => {
        set((state) => {
          const original = state.workflows.find((w) => w.id === id);
          if (!original) return state;

          return {
            workflows: [
              ...state.workflows,
              {
                ...original,
                id: `workflow-${Date.now()}`,
                name: `${original.name} (Copy)`,
                isBuiltIn: false,
                createdAt: Date.now(),
                usageCount: 0,
              },
            ],
          };
        });
      },

      // Workflow Execution (simplified for Phase 1)
      startWorkflow: async (id) => {
        const workflow = get().workflows.find((w) => w.id === id);
        if (!workflow) return;

        set({
          workflowExecution: {
            workflowId: id,
            currentStep: 0,
            isExecuting: true,
            isPaused: false,
            executionHistory: [],
          },
        });

        // Execute first step
        await get().executeNextStep();
      },

      pauseWorkflow: () => {
        set((state) => ({
          workflowExecution: {
            ...state.workflowExecution,
            isPaused: true,
          },
        }));
      },

      resumeWorkflow: async () => {
        set((state) => ({
          workflowExecution: {
            ...state.workflowExecution,
            isPaused: false,
          },
        }));
        await get().executeNextStep();
      },

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

      executeNextStep: async () => {
        // Implementation in Phase 2 (workflow engine)
        return true;
      },

      // Recording
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

      stopRecording: (name, description) => {
        const { recordedSteps } = get().recording;

        if (recordedSteps.length > 0 && name) {
          get().addWorkflow({
            name,
            description: description || `Custom workflow with ${recordedSteps.length} steps`,
            icon: '⚡',
            isBuiltIn: false,
            steps: recordedSteps,
          });
        }

        set({
          recording: {
            isRecording: false,
            recordedSteps: [],
            startTime: 0,
            isPaused: false,
          },
        });
      },

      pauseRecording: () => {
        set((state) => ({
          recording: { ...state.recording, isPaused: true },
        }));
      },

      resumeRecording: () => {
        set((state) => ({
          recording: { ...state.recording, isPaused: false },
        }));
      },

      addRecordedStep: (step) => {
        set((state) => ({
          recording: {
            ...state.recording,
            recordedSteps: [
              ...state.recording.recordedSteps,
              { ...step, id: `step-${Date.now()}` },
            ],
          },
        }));
      },

      deleteLastStep: () => {
        set((state) => ({
          recording: {
            ...state.recording,
            recordedSteps: state.recording.recordedSteps.slice(0, -1),
          },
        }));
      },

      // Import/Export
      exportWorkflows: () => {
        const { workflows } = get();
        return JSON.stringify(workflows, null, 2);
      },

      importWorkflows: (data) => {
        try {
          const imported = JSON.parse(data);
          if (!Array.isArray(imported)) return false;

          set((state) => ({
            workflows: [...state.workflows, ...imported],
          }));
          return true;
        } catch {
          return false;
        }
      },
    }),
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
```

**Validation:**
- [ ] Store compiles without errors
- [ ] localStorage persistence works
- [ ] All actions update state correctly
- [ ] No memory leaks from event listeners

---

### 1.3 Create Built-in Workflows

**File:** `src/services/defaultWorkflows.ts` (new file)

```typescript
import type { Workflow } from '../types';

export const DEFAULT_WORKFLOWS: Omit<Workflow, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: 'Quick Property Survey',
    description: 'Complete property analysis in one click',
    icon: '⚡',
    isBuiltIn: true,
    steps: [
      {
        id: 'step-1',
        action: 'tool:rectangle',
        prompt: {
          message: 'Enter property area',
          type: 'number',
          defaultValue: 1000,
        },
        params: { promptForArea: true },
      },
      {
        id: 'step-2',
        action: 'tool:measure',
        params: { autoMeasureAllSides: true },
      },
      {
        id: 'step-3',
        action: 'panel:compare',
        params: { autoSelectObject: 'house' },
      },
    ],
  },
  {
    name: 'Subdivision Planner',
    description: 'Create subdivision layout from existing parcel',
    icon: '🏘️',
    isBuiltIn: true,
    steps: [
      {
        id: 'step-1',
        action: 'shape:duplicate',
        validation: { requiresSelection: true },
        params: { count: 4 },
      },
      {
        id: 'step-2',
        action: 'tool:measure',
        params: { measureEach: true },
      },
    ],
  },
  {
    name: 'Before & After',
    description: 'Compare current vs. proposed sizes',
    icon: '📊',
    isBuiltIn: true,
    steps: [
      {
        id: 'step-1',
        action: 'shape:duplicate',
        validation: { requiresSelection: true },
      },
      {
        id: 'step-2',
        action: 'tool:rectangle',
        prompt: {
          message: 'Enter proposed area',
          type: 'number',
          defaultValue: 2000,
        },
      },
    ],
  },
  {
    name: 'Export Package',
    description: 'Generate complete deliverable package',
    icon: '📦',
    isBuiltIn: true,
    steps: [
      {
        id: 'step-1',
        action: 'tool:screenshot',
        params: { format: 'png' },
      },
      // Add remaining export steps
    ],
  },
  {
    name: 'Precision Setup',
    description: 'Configure CAD-style precision environment',
    icon: '🎯',
    isBuiltIn: true,
    steps: [
      {
        id: 'step-1',
        action: 'tool:gridSnap',
        params: { enabled: true, distance: 1 },
      },
      {
        id: 'step-2',
        action: 'view:toggle2d',
        params: { to2D: true },
      },
    ],
  },
];
```

---

### 1.4 Initialize Store with Defaults

**File:** `src/store/useToolHistoryStore.ts` (update)

Add initialization logic to load default workflows on first run:

```typescript
// Inside the store creation
const initializeDefaultWorkflows = () => {
  const { workflows } = get();

  // Only add defaults if no workflows exist
  if (workflows.length === 0) {
    DEFAULT_WORKFLOWS.forEach(workflow => {
      get().addWorkflow(workflow);
    });
  }
};

// Call on mount
if (typeof window !== 'undefined') {
  initializeDefaultWorkflows();
}
```

---

## Phase 2: UI Components (Week 2)

### Goal
Build the complete Tools Panel UI with all sections

### 2.1 Create ToolsPanel Component

**File:** `src/components/ToolsPanel/index.tsx` (new file)

```typescript
import React from 'react';
import { useToolHistoryStore } from '../../store/useToolHistoryStore';
import Icon from '../Icon';
import RecentActions from './RecentActions';
import FrequentlyUsed from './FrequentlyUsed';
import QuickWorkflows from './QuickWorkflows';

interface ToolsPanelProps {
  isExpanded: boolean;
  onClose: () => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ isExpanded, onClose }) => {
  const { clearHistory, exportWorkflows, importWorkflows } = useToolHistoryStore();

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const success = importWorkflows(content);
          // Show notification
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExport = () => {
    const data = exportWorkflows();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflows-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isExpanded) return null;

  return (
    <div style={{
      position: 'absolute',
      left: '80px',
      top: '60px',
      bottom: '20px',
      width: '320px',
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="quickTools" size={20} color="#1f2937" />
          <span style={{ fontWeight: '600', fontSize: '16px', color: '#1f2937' }}>
            Tools
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <Icon name="close" size={16} color="#6b7280" />
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
      }}>
        <RecentActions />
        <FrequentlyUsed />
        <QuickWorkflows />
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
      }}>
        <button
          onClick={() => {
            if (confirm('Clear all history?')) {
              clearHistory();
            }
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            color: '#6b7280',
          }}
        >
          Clear History
        </button>
        <button
          onClick={handleImport}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            color: '#6b7280',
          }}
        >
          Import
        </button>
        <button
          onClick={handleExport}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            color: '#6b7280',
          }}
        >
          Export
        </button>
      </div>
    </div>
  );
};
```

---

### 2.2 Create Sub-components

**Files:**
- `src/components/ToolsPanel/RecentActions.tsx`
- `src/components/ToolsPanel/FrequentlyUsed.tsx`
- `src/components/ToolsPanel/QuickWorkflows.tsx`
- `src/components/ToolsPanel/WorkflowRecorder.tsx`
- `src/components/ToolsPanel/WorkflowEditor.tsx`

(Detailed component code in tasks.md)

---

### 2.3 Integrate into App.tsx

**File:** `src/App.tsx` (modifications)

```typescript
// Add import
import { ToolsPanel } from './components/ToolsPanel';

// Add state
const [toolsPanelExpanded, setToolsPanelExpanded] = useState(false);

// Update Tools button (around line 1907)
<button
  onClick={() => {
    if (toolsPanelExpanded) {
      setToolsPanelExpanded(false);
      setLeftPanelExpanded(false);
    } else {
      // Close other panels
      setLayersExpanded(false);
      setComparisonExpanded(false);
      setConvertExpanded(false);
      setCalculatorExpanded(false);

      if (!leftPanelExpanded) {
        setLeftPanelExpanded(true);
      }
      setToolsPanelExpanded(true);
    }
  }}
  style={{
    padding: '8px',
    borderRadius: '8px',
    background: toolsPanelExpanded ? '#3b82f6' : 'transparent',
    // ... rest of styles
  }}
>
  <Icon
    name="quickTools"
    size={20}
    color={toolsPanelExpanded ? "#ffffff" : "#000000"}
  />
  <span>Tools</span>
</button>

// Add panel render
{toolsPanelExpanded && (
  <ToolsPanel
    isExpanded={toolsPanelExpanded}
    onClose={() => {
      setToolsPanelExpanded(false);
      setLeftPanelExpanded(false);
    }}
  />
)}
```

---

## Phase 3: Workflow Engine (Week 3)

### Goal
Implement workflow execution and recording logic

### 3.1 Create Workflow Engine

**File:** `src/services/workflowEngine.ts` (new file)

```typescript
import type { Workflow, WorkflowStep } from '../types';
import { useAppStore } from '../store/useAppStore';

export class WorkflowEngine {
  private workflow: Workflow | null = null;
  private currentStepIndex: number = 0;
  private executionLog: string[] = [];

  async execute(workflow: Workflow): Promise<void> {
    this.workflow = workflow;
    this.currentStepIndex = 0;
    this.executionLog = [];

    for (const step of workflow.steps) {
      const success = await this.executeStep(step);
      if (!success) {
        throw new Error(`Workflow step failed: ${step.id}`);
      }
    }
  }

  private async executeStep(step: WorkflowStep): Promise<boolean> {
    // Validate prerequisites
    if (step.validation) {
      const isValid = this.validateStep(step);
      if (!isValid) {
        throw new Error('Step validation failed');
      }
    }

    // Handle prompts
    if (step.prompt) {
      const userInput = await this.promptUser(step.prompt);
      if (userInput === null) {
        return false; // User canceled
      }
      step.params = { ...step.params, userInput };
    }

    // Execute action
    return this.dispatchAction(step);
  }

  private validateStep(step: WorkflowStep): boolean {
    const store = useAppStore.getState();

    if (step.validation?.requiresSelection && !store.selectedShapeId) {
      alert('Please select a shape first');
      return false;
    }

    return true;
  }

  private async promptUser(prompt: any): Promise<any> {
    // Show dialog and return user input
    return new Promise((resolve) => {
      // Implementation using browser prompt or custom dialog
      const value = window.prompt(prompt.message, prompt.defaultValue);
      resolve(value);
    });
  }

  private async dispatchAction(step: WorkflowStep): Promise<boolean> {
    const store = useAppStore.getState();

    switch (step.action) {
      case 'tool:rectangle':
        store.setActiveTool('rectangle');
        // Additional logic
        return true;

      case 'tool:measure':
        store.activateMeasurementTool();
        return true;

      case 'panel:compare':
        // Open comparison panel
        return true;

      // ... handle all action types

      default:
        console.warn(`Unknown action type: ${step.action}`);
        return false;
    }
  }
}
```

---

### 3.2 Integrate Action Tracking

**File:** `src/store/useAppStore.ts` (modifications)

Add tracking interceptor to all tool activation actions:

```typescript
import { useToolHistoryStore } from './useToolHistoryStore';

// In setActiveTool action
setActiveTool: (tool) => {
  set((state) => ({
    drawing: {
      ...state.drawing,
      activeTool: tool,
    },
  }));

  // Track action
  useToolHistoryStore.getState().trackAction({
    id: `action-${Date.now()}`,
    type: `tool:${tool}` as ActionType,
    timestamp: Date.now(),
    label: tool.charAt(0).toUpperCase() + tool.slice(1),
    icon: tool,
  });
},

// Apply to all relevant actions:
// - enterEditMode
// - activateMeasurementTool
// - toggleViewMode
// - etc.
```

---

## Phase 4: Testing & Polish (Week 4)

### Goal
Comprehensive testing and UX refinements

### 4.1 Unit Tests

**File:** `src/__tests__/useToolHistoryStore.test.ts`

Test all store actions, persistence, edge cases

### 4.2 Component Tests

**File:** `src/__tests__/ToolsPanel.test.tsx`

Test UI rendering, user interactions, workflow execution

### 4.3 Integration Tests

**File:** `src/__tests__/integration/workflowExecution.test.ts`

Test complete workflow scenarios end-to-end

### 4.4 Performance Testing

- Measure panel open/close time (<100ms)
- Test with 50 workflows (no lag)
- localStorage size monitoring

### 4.5 Visual Polish

- Smooth animations (200ms transitions)
- Loading states for workflow execution
- Success/error notifications
- Keyboard shortcuts (Ctrl+T for toggle)

---

## File Structure

```
app/src/
├── components/
│   └── ToolsPanel/
│       ├── index.tsx                    # Main panel component
│       ├── RecentActions.tsx            # Recent actions section
│       ├── FrequentlyUsed.tsx           # Frequently used section
│       ├── QuickWorkflows.tsx           # Workflows section
│       ├── WorkflowRecorder.tsx         # Recording UI
│       ├── WorkflowEditor.tsx           # Editor UI
│       └── WorkflowItem.tsx             # Individual workflow item
├── services/
│   ├── workflowEngine.ts                # Execution logic
│   ├── defaultWorkflows.ts              # Built-in workflows
│   └── workflowStorage.ts               # localStorage helpers
├── store/
│   └── useToolHistoryStore.ts           # Zustand store (NEW)
├── types/
│   └── index.ts                         # Type additions
└── __tests__/
    ├── useToolHistoryStore.test.ts
    ├── ToolsPanel.test.tsx
    └── integration/
        └── workflowExecution.test.ts
```

---

## Testing Strategy

### Unit Tests
- ✅ Store actions (trackAction, addWorkflow, etc.)
- ✅ Workflow validation logic
- ✅ localStorage persistence
- ✅ Import/export functionality

### Component Tests
- ✅ ToolsPanel renders correctly
- ✅ Recent actions display
- ✅ Workflow execution triggers
- ✅ Recording mode toggles

### Integration Tests
- ✅ Complete workflow execution
- ✅ Action tracking across app
- ✅ Storage persistence on refresh
- ✅ Error handling scenarios

### Performance Tests
- ✅ Panel open: <100ms
- ✅ 50 workflows: no lag
- ✅ Recording overhead: <5ms
- ✅ localStorage: <1MB

---

## Performance Considerations

### Bundle Size Impact
- Estimated addition: ~15KB (minified + gzipped)
- No external dependencies
- Uses existing Zustand patterns

### Rendering Performance
- Memoized components with React.memo
- Virtualized workflow list if >20 items (Phase 2+)
- Debounced search if implemented

### Memory Usage
- Maximum 8 recent actions (small footprint)
- Workflow limit: 50 (configurable)
- Auto-cleanup old execution logs

### 60 FPS Maintenance
- All animations use CSS transitions
- No layout thrashing
- Efficient re-renders with Zustand selectors

---

## Security Considerations

### Input Validation
```typescript
const validateWorkflowName = (name: string): boolean => {
  // No script tags
  if (/<script|javascript:|onerror=/i.test(name)) {
    return false;
  }
  // Max length
  if (name.length > 100) {
    return false;
  }
  return true;
};
```

### Import Validation
```typescript
const validateImportedWorkflows = (data: any): boolean => {
  if (!Array.isArray(data)) return false;

  for (const workflow of data) {
    if (!workflow.id || !workflow.name || !workflow.steps) {
      return false;
    }
    if (!Array.isArray(workflow.steps)) {
      return false;
    }
  }
  return true;
};
```

### Storage Safety
- JSON parse with try/catch
- Schema version checking
- Migration strategy for future changes
- No eval() or Function() constructor

---

## Constitution Compliance

✅ **Article 1:** Inline styles only
- All components use inline styling
- No CSS files imported

✅ **Article 2:** TypeScript strict mode
- Full type coverage
- No `any` types (except where necessary)

✅ **Article 3:** Zustand state management
- New store follows existing patterns
- Domain-specific store architecture

✅ **Article 4:** React best practices
- Functional components
- Proper hooks usage
- Memoization where needed

✅ **Article 5:** 3D rendering standards
- No impact on 3D performance
- No Three.js modifications

✅ **Article 6:** Testing requirements
- 70%+ coverage target
- Unit + integration tests

✅ **Article 7:** Security first
- Input sanitization
- XSS prevention
- Safe JSON handling

✅ **Article 8:** Development practices
- Prefer editing existing files (App.tsx)
- Minimal new file creation
- Clear code organization

✅ **Article 9:** Professional UX
- Canva-inspired design
- Smooth animations (200ms)
- Consistent with existing panels

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| localStorage quota exceeded | Medium | Medium | Implement quota monitoring, auto-cleanup |
| Workflow execution bugs | Medium | High | Comprehensive testing, error boundaries |
| Performance degradation | Low | Medium | Performance budgets, profiling |
| User confusion with complex workflows | Medium | Low | Clear UI, helpful defaults, documentation |
| State synchronization issues | Low | High | Atomic operations, state validation |
| Browser compatibility | Low | Low | Use standard APIs, test in all browsers |

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Types defined in `src/types/index.ts`
- [ ] useToolHistoryStore created
- [ ] Default workflows configured
- [ ] localStorage persistence working
- [ ] Store unit tests passing

### Phase 2: UI Components
- [ ] ToolsPanel component created
- [ ] RecentActions component
- [ ] FrequentlyUsed component
- [ ] QuickWorkflows component
- [ ] Integration in App.tsx
- [ ] UI matches design spec

### Phase 3: Workflow Engine
- [ ] WorkflowEngine class implemented
- [ ] Action tracking integrated
- [ ] Workflow execution working
- [ ] Recording mode functional
- [ ] Error handling robust

### Phase 4: Testing & Polish
- [ ] Unit tests: 70%+ coverage
- [ ] Component tests complete
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Visual polish complete
- [ ] Documentation updated

---

## Success Metrics

### Functional
- ✅ All acceptance criteria met
- ✅ 5 pre-built workflows working
- ✅ Recording and playback functional
- ✅ Import/export working

### Performance
- ✅ Panel opens in <100ms
- ✅ Workflow execution <500ms
- ✅ No FPS drops
- ✅ <5MB localStorage usage

### Quality
- ✅ 70%+ test coverage
- ✅ Zero console errors
- ✅ Passes accessibility audit
- ✅ Works on all target browsers

### User Experience
- ✅ Intuitive workflow creation
- ✅ Clear error messages
- ✅ Helpful default workflows
- ✅ Smooth animations

---

**Plan Status:** ✅ Ready for Task Breakdown

**Next Steps:**
1. Create detailed task list (`tasks.md`)
2. Assign time estimates
3. Begin Phase 1 implementation
4. Daily progress tracking

---

**Document Version:** 1.0
**Last Updated:** 2025-01-05
**Author:** Claude Code
**Review Status:** Pending
