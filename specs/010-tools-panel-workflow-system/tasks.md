# Task List: Tools Panel with Smart Workflow System

**Feature:** Tools Panel with Smart Workflow System
**Plan:** [plan.md](./plan.md)
**Specification:** [spec.md](./spec.md)
**Date:** 2025-01-05
**Total Estimated Time:** 80-100 hours (2-3 weeks for 1 developer)

---

## Prerequisites

- [x] Development environment ready
- [x] All dependencies installed (no new ones needed)
- [x] Tests passing on main branch
- [x] Spec and plan approved
- [x] Understanding of existing Zustand patterns
- [x] Familiarity with inline styles requirement

---

## Phase 1: Foundation Tasks (Week 1: 20-25 hours)

### Task 1.1: Define Type System
**File:** `src/types/index.ts`
**Estimated Time:** 2 hours
**Priority:** Critical

**Subtasks:**
- [ ] Add `ActionType` union type (all possible actions)
- [ ] Add `TrackedAction` interface
- [ ] Add `ToolUsageStats` interface
- [ ] Add `WorkflowStep` interface with validation and prompt support
- [ ] Add `Workflow` interface
- [ ] Add `WorkflowExecutionState` interface
- [ ] Add `RecordingState` interface
- [ ] Export all new types

**Code to Add:**
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
  label: string;
  icon?: string;
  params?: Record<string, any>;
}

export interface ToolUsageStats {
  [key: string]: {
    actionType: ActionType;
    count: number;
    lastUsed: number;
    isPinned: boolean;
  };
}

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
  executionHistory: string[];
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
- [ ] TypeScript compiles without errors
- [ ] All types are exported correctly
- [ ] No conflicts with existing types
- [ ] VSCode autocomplete works for new types

---

### Task 1.2: Create Tool History Store
**File:** `src/store/useToolHistoryStore.ts` (new file)
**Estimated Time:** 5 hours
**Priority:** Critical
**Dependencies:** Task 1.1

**Subtasks:**
- [ ] Create store file structure
- [ ] Add initial state interfaces
- [ ] Implement `trackAction` action
- [ ] Implement `clearHistory` action
- [ ] Implement `pinTool` / `unpinTool` actions
- [ ] Implement workflow CRUD actions (add, update, delete, duplicate)
- [ ] Implement recording actions (start, stop, pause, resume)
- [ ] Add localStorage persistence with `persist` middleware
- [ ] Add partialize config (exclude execution state)
- [ ] Add import/export functions
- [ ] Test store in isolation

**Key Implementation:**
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
    (set, get) => ({
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

      // Implementation details in plan.md
      trackAction: (action) => {
        // Full implementation
      },

      // ... rest of actions
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
- [ ] Store compiles without TypeScript errors
- [ ] localStorage persistence works (check browser DevTools)
- [ ] State updates correctly for all actions
- [ ] No console warnings/errors
- [ ] Test with manual store calls in console

---

### Task 1.3: Create Default Workflows
**File:** `src/services/defaultWorkflows.ts` (new file)
**Estimated Time:** 3 hours
**Priority:** High
**Dependencies:** Task 1.1

**Subtasks:**
- [ ] Create file structure
- [ ] Define "Quick Property Survey" workflow
- [ ] Define "Subdivision Planner" workflow
- [ ] Define "Before & After" workflow
- [ ] Define "Export Package" workflow
- [ ] Define "Precision Setup" workflow
- [ ] Export DEFAULT_WORKFLOWS array
- [ ] Add JSDoc documentation

**Code:**
```typescript
import type { Workflow } from '../types';

/**
 * Pre-built workflows that ship with the application.
 * These cannot be modified directly but can be duplicated.
 */
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
          message: 'Enter property area (m²)',
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
  // ... 4 more workflows
];
```

**Validation:**
- [ ] All workflows have unique IDs
- [ ] Step actions reference valid ActionType values
- [ ] Icons render correctly (test with emoji support)
- [ ] Descriptions are clear and helpful

---

### Task 1.4: Initialize Store with Defaults
**File:** `src/store/useToolHistoryStore.ts` (modification)
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** Tasks 1.2, 1.3

**Subtasks:**
- [ ] Import DEFAULT_WORKFLOWS
- [ ] Add initialization function
- [ ] Check if workflows array is empty
- [ ] Load defaults on first run only
- [ ] Ensure persistence doesn't override

**Code:**
```typescript
import { DEFAULT_WORKFLOWS } from '../services/defaultWorkflows';

// Inside store, after creation
const initializeDefaultWorkflows = () => {
  const { workflows, addWorkflow } = get();

  // Only add if no workflows exist (first run)
  if (workflows.length === 0) {
    DEFAULT_WORKFLOWS.forEach(workflow => {
      addWorkflow(workflow);
    });
  }
};

// Auto-initialize on mount
if (typeof window !== 'undefined') {
  setTimeout(initializeDefaultWorkflows, 0);
}
```

**Validation:**
- [ ] Defaults load on first app run
- [ ] Defaults don't re-load on subsequent runs
- [ ] localStorage persists user workflows
- [ ] Check in browser DevTools → Application → localStorage

---

### Task 1.5: Write Store Unit Tests
**File:** `src/__tests__/useToolHistoryStore.test.ts` (new file)
**Estimated Time:** 4 hours
**Priority:** High
**Dependencies:** Task 1.2

**Test Cases:**
- [ ] trackAction adds to recent actions
- [ ] trackAction increments usage stats
- [ ] Recent actions limited to maxRecentActions (8)
- [ ] pinTool marks tool as pinned
- [ ] unpinTool removes pin
- [ ] addWorkflow creates new workflow with ID
- [ ] updateWorkflow modifies existing workflow
- [ ] deleteWorkflow removes workflow
- [ ] duplicateWorkflow creates copy with "(Copy)" suffix
- [ ] clearHistory empties recent actions
- [ ] Recording adds steps to recordedSteps
- [ ] stopRecording saves workflow
- [ ] exportWorkflows returns valid JSON
- [ ] importWorkflows parses and adds workflows
- [ ] localStorage persistence works

**Sample Test:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useToolHistoryStore } from '../store/useToolHistoryStore';

describe('useToolHistoryStore', () => {
  beforeEach(() => {
    // Reset store
    useToolHistoryStore.setState({
      recentActions: [],
      usageStats: {},
      workflows: [],
    });
  });

  it('should track actions and add to recent', () => {
    const { result } = renderHook(() => useToolHistoryStore());

    act(() => {
      result.current.trackAction({
        id: 'test-1',
        type: 'tool:rectangle',
        timestamp: Date.now(),
        label: 'Rectangle',
      });
    });

    expect(result.current.recentActions).toHaveLength(1);
    expect(result.current.recentActions[0].type).toBe('tool:rectangle');
  });

  it('should limit recent actions to maxRecentActions', () => {
    const { result } = renderHook(() => useToolHistoryStore());

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.trackAction({
          id: `test-${i}`,
          type: 'tool:select',
          timestamp: Date.now(),
          label: 'Select',
        });
      }
    });

    expect(result.current.recentActions).toHaveLength(8);
  });

  // ... more tests
});
```

**Validation:**
- [ ] All tests pass
- [ ] Coverage >70%
- [ ] No console errors
- [ ] Tests run quickly (<1s)

---

### Task 1.6: Integration Testing Preparation
**Estimated Time:** 2 hours
**Priority:** Medium

**Subtasks:**
- [ ] Document test scenarios
- [ ] Prepare test data
- [ ] Set up test utilities
- [ ] Create mock workflows for testing

---

## Phase 2: UI Components (Week 2: 25-30 hours)

### Task 2.1: Create ToolsPanel Component
**File:** `src/components/ToolsPanel/index.tsx` (new file)
**Estimated Time:** 3 hours
**Priority:** Critical
**Dependencies:** Phase 1 complete

**Subtasks:**
- [ ] Create component directory
- [ ] Set up component structure
- [ ] Add header with title and close button
- [ ] Add scrollable content area
- [ ] Add footer with action buttons
- [ ] Implement panel open/close animation
- [ ] Add proper z-index layering
- [ ] Style according to design system

**Component Structure:**
```typescript
import React from 'react';
import { useToolHistoryStore } from '../../store/useToolHistoryStore';
import Icon from '../Icon';

interface ToolsPanelProps {
  isExpanded: boolean;
  onClose: () => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ isExpanded, onClose }) => {
  const { clearHistory, exportWorkflows, importWorkflows } = useToolHistoryStore();

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
      animation: 'slideIn 0.2s ease-out',
    }}>
      {/* Header, Content, Footer */}
    </div>
  );
};
```

**Validation:**
- [ ] Panel renders without errors
- [ ] Open/close animation smooth
- [ ] Matches other panels (LayerPanel, ComparisonPanel)
- [ ] Responsive on different screen sizes
- [ ] Close button works

---

### Task 2.2: Create RecentActions Component
**File:** `src/components/ToolsPanel/RecentActions.tsx` (new file)
**Estimated Time:** 3 hours
**Priority:** High

**Subtasks:**
- [ ] Create component file
- [ ] Connect to useToolHistoryStore
- [ ] Map recentActions to UI list
- [ ] Add action icons
- [ ] Add click handlers to re-activate tools
- [ ] Add hover states
- [ ] Handle empty state
- [ ] Add timestamps (optional)

**Code:**
```typescript
import React from 'react';
import { useToolHistoryStore } from '../../store/useToolHistoryStore';
import { useAppStore } from '../../store/useAppStore';
import Icon from '../Icon';

export const RecentActions: React.FC = () => {
  const recentActions = useToolHistoryStore(state => state.recentActions);
  const setActiveTool = useAppStore(state => state.setActiveTool);

  const handleActionClick = (action: TrackedAction) => {
    // Re-activate the tool/action
    if (action.type.startsWith('tool:')) {
      const tool = action.type.replace('tool:', '');
      setActiveTool(tool);
    }
    // Handle panel actions, etc.
  };

  if (recentActions.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>
        No recent actions
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        📝 Recent Actions ({recentActions.length})
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {recentActions.map(action => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '13px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Icon name={action.icon || 'quickTools'} size={16} color="#6b7280" />
            <span style={{ flex: 1, textAlign: 'left', color: '#1f2937' }}>
              {action.label}
            </span>
            <Icon name="play" size={14} color="#9ca3af" />
          </button>
        ))}
      </div>
    </div>
  );
};
```

**Validation:**
- [ ] Displays last 8 actions
- [ ] Icons render correctly
- [ ] Click re-activates tool
- [ ] Hover effects work
- [ ] Empty state shows properly

---

### Task 2.3: Create FrequentlyUsed Component
**File:** `src/components/ToolsPanel/FrequentlyUsed.tsx` (new file)
**Estimated Time:** 3 hours
**Priority:** High

**Subtasks:**
- [ ] Create component file
- [ ] Connect to useToolHistoryStore
- [ ] Sort usageStats by count (top 3)
- [ ] Display tool name, count, pin status
- [ ] Add pin/unpin toggle
- [ ] Add click to activate
- [ ] Handle empty state

**Code:**
```typescript
export const FrequentlyUsed: React.FC = () => {
  const usageStats = useToolHistoryStore(state => state.usageStats);
  const pinTool = useToolHistoryStore(state => state.pinTool);
  const unpinTool = useToolHistoryStore(state => state.unpinTool);

  // Get top 3 most used OR all pinned
  const topTools = Object.entries(usageStats)
    .sort((a, b) => {
      // Pinned first, then by count
      if (a[1].isPinned && !b[1].isPinned) return -1;
      if (!a[1].isPinned && b[1].isPinned) return 1;
      return b[1].count - a[1].count;
    })
    .slice(0, 5);

  if (topTools.length === 0) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>
      Use tools to see frequently used
    </div>;
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
        ⭐ Frequently Used
      </h3>

      {topTools.map(([actionType, stats]) => (
        <div key={actionType} style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => /* activate tool */}>
            {actionType} ({stats.count} uses)
          </button>
          <button onClick={() => stats.isPinned ? unpinTool(actionType) : pinTool(actionType)}>
            {stats.isPinned ? '📌' : '📍'}
          </button>
        </div>
      ))}
    </div>
  );
};
```

**Validation:**
- [ ] Shows top 3 or all pinned
- [ ] Usage counts accurate
- [ ] Pin/unpin works
- [ ] Sorting correct

---

### Task 2.4: Create QuickWorkflows Component
**File:** `src/components/ToolsPanel/QuickWorkflows.tsx` (new file)
**Estimated Time:** 4 hours
**Priority:** Critical

**Subtasks:**
- [ ] Create component file
- [ ] Display all workflows (built-in + custom)
- [ ] Add workflow icons and names
- [ ] Add play button to execute
- [ ] Add menu button (⋯) for edit/delete/duplicate
- [ ] Add "Record New Workflow" button
- [ ] Handle workflow execution trigger
- [ ] Show execution progress

**Code:**
```typescript
export const QuickWorkflows: React.FC = () => {
  const workflows = useToolHistoryStore(state => state.workflows);
  const startWorkflow = useToolHistoryStore(state => state.startWorkflow);
  const deleteWorkflow = useToolHistoryStore(state => state.deleteWorkflow);
  const duplicateWorkflow = useToolHistoryStore(state => state.duplicateWorkflow);

  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>⚡ Quick Workflows</h3>
        <button onClick={() => /* start recording */}>+ Record</button>
      </div>

      {workflows.map(workflow => (
        <div key={workflow.id}>
          <button onClick={() => startWorkflow(workflow.id)}>
            ▶️ {workflow.name}
          </button>
          <button onClick={() => setMenuOpen(workflow.id)}>⋯</button>

          {menuOpen === workflow.id && (
            <div>
              <button onClick={() => duplicateWorkflow(workflow.id)}>Duplicate</button>
              {!workflow.isBuiltIn && (
                <button onClick={() => deleteWorkflow(workflow.id)}>Delete</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

**Validation:**
- [ ] All workflows display
- [ ] Play button triggers execution
- [ ] Menu opens/closes
- [ ] Built-in workflows can't be deleted
- [ ] Duplicate creates copy

---

### Task 2.5: Create WorkflowRecorder Component
**File:** `src/components/ToolsPanel/WorkflowRecorder.tsx` (new file)
**Estimated Time:** 4 hours
**Priority:** High

**Subtasks:**
- [ ] Create modal/overlay component
- [ ] Add recording indicator (red dot)
- [ ] Display recorded steps in real-time
- [ ] Add pause/resume/stop buttons
- [ ] Add "delete last step" button
- [ ] Show step count
- [ ] Add naming dialog on stop
- [ ] Handle save workflow

**Validation:**
- [ ] Recording starts correctly
- [ ] Steps appear as recorded
- [ ] Pause/resume works
- [ ] Stop prompts for name
- [ ] Workflow saved to list

---

### Task 2.6: Integrate ToolsPanel into App.tsx
**File:** `src/App.tsx` (modification)
**Estimated Time:** 2 hours
**Priority:** Critical
**Dependencies:** Tasks 2.1-2.4

**Subtasks:**
- [ ] Import ToolsPanel component
- [ ] Add `toolsPanelExpanded` state
- [ ] Update Tools button click handler
- [ ] Add panel close logic
- [ ] Ensure exclusive panel behavior (close others when opening)
- [ ] Add panel render with conditional
- [ ] Test integration

**Code Changes:**
```typescript
// Add import at top
import { ToolsPanel } from './components/ToolsPanel';

// Add state (around line 68)
const [toolsPanelExpanded, setToolsPanelExpanded] = useState(false);

// Update Tools button onClick (around line 1907-1941)
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
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '100%',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    color: toolsPanelExpanded ? '#ffffff' : '#374151'
  }}
  title="Quick Tools"
>
  <Icon
    name="quickTools"
    size={20}
    color={toolsPanelExpanded ? "#ffffff" : "#000000"}
  />
  <span style={{
    fontSize: '10px',
    fontWeight: '500',
    color: toolsPanelExpanded ? '#ffffff' : '#374151',
    lineHeight: '1'
  }}>
    Tools
  </span>
</button>

// Add panel render (after other panels around line 2500+)
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

**Validation:**
- [ ] Tools button toggles panel
- [ ] Panel appears in correct position
- [ ] Other panels close when Tools opens
- [ ] Close button works
- [ ] Active state styling correct
- [ ] No console errors

---

## Phase 3: Workflow Engine (Week 3: 20-25 hours)

### Task 3.1: Create Workflow Engine Service
**File:** `src/services/workflowEngine.ts` (new file)
**Estimated Time:** 6 hours
**Priority:** Critical

**Subtasks:**
- [ ] Create WorkflowEngine class
- [ ] Implement `execute(workflow)` method
- [ ] Implement `executeStep(step)` method
- [ ] Add step validation logic
- [ ] Add user prompt handling
- [ ] Add action dispatching
- [ ] Add error handling
- [ ] Add execution logging

**Code:**
```typescript
import type { Workflow, WorkflowStep } from '../types';
import { useAppStore } from '../store/useAppStore';

export class WorkflowEngine {
  private workflow: Workflow | null = null;
  private currentStepIndex: number = 0;
  private executionLog: string[] = [];
  private onProgress?: (step: number, total: number) => void;

  constructor(onProgress?: (step: number, total: number) => void) {
    this.onProgress = onProgress;
  }

  async execute(workflow: Workflow): Promise<void> {
    this.workflow = workflow;
    this.currentStepIndex = 0;
    this.executionLog = [];

    for (let i = 0; i < workflow.steps.length; i++) {
      this.currentStepIndex = i;
      this.onProgress?.(i + 1, workflow.steps.length);

      const success = await this.executeStep(workflow.steps[i]);
      if (!success) {
        throw new Error(`Workflow step ${i + 1} failed: ${workflow.steps[i].id}`);
      }
    }

    this.executionLog.push(`Workflow "${workflow.name}" completed successfully`);
  }

  private async executeStep(step: WorkflowStep): Promise<boolean> {
    // Validate prerequisites
    if (step.validation) {
      const isValid = this.validateStep(step);
      if (!isValid) {
        return false;
      }
    }

    // Handle user prompts
    let userInput: any = null;
    if (step.prompt) {
      userInput = await this.promptUser(step.prompt);
      if (userInput === null) {
        // User canceled
        return false;
      }
    }

    // Dispatch action
    return this.dispatchAction(step, userInput);
  }

  private validateStep(step: WorkflowStep): boolean {
    const store = useAppStore.getState();

    if (step.validation?.requiresSelection && !store.selectedShapeId) {
      alert('This step requires a shape to be selected. Please select a shape first.');
      return false;
    }

    if (step.validation?.requiresShape && store.shapes.length === 0) {
      alert('This step requires at least one shape on the canvas.');
      return false;
    }

    return true;
  }

  private async promptUser(prompt: any): Promise<any> {
    return new Promise((resolve) => {
      // Use browser prompt for Phase 1 (replace with custom dialog in Phase 2)
      const message = `${prompt.message}${prompt.defaultValue ? ` (default: ${prompt.defaultValue})` : ''}`;
      const value = window.prompt(message, prompt.defaultValue?.toString() || '');

      if (value === null) {
        resolve(null); // User canceled
        return;
      }

      // Type conversion
      if (prompt.type === 'number') {
        const num = parseFloat(value);
        resolve(isNaN(num) ? prompt.defaultValue : num);
      } else {
        resolve(value);
      }
    });
  }

  private async dispatchAction(step: WorkflowStep, userInput: any): Promise<boolean> {
    const store = useAppStore.getState();

    try {
      switch (step.action) {
        case 'tool:select':
          store.setActiveTool('select');
          break;

        case 'tool:line':
          store.setActiveTool('line');
          break;

        case 'tool:rectangle':
          store.setActiveTool('rectangle');
          if (userInput && step.params?.promptForArea) {
            // Create rectangle with specific area
            store.createShapeFromArea(userInput, 'm²');
          }
          break;

        case 'tool:circle':
          store.setActiveTool('circle');
          break;

        case 'tool:polyline':
          store.setActiveTool('polyline');
          break;

        case 'tool:measure':
          store.activateMeasurementTool();
          // TODO: Auto-measure logic if params.autoMeasureAllSides
          break;

        case 'tool:rotate':
          if (store.selectedShapeId) {
            store.enterRotateMode(store.selectedShapeId);
          }
          break;

        case 'edit:mode':
          if (store.selectedShapeId) {
            store.enterEditMode(store.selectedShapeId);
          }
          break;

        case 'panel:compare':
          // TODO: Open comparison panel programmatically
          // This requires updating App.tsx to expose panel controls
          break;

        case 'panel:convert':
          // TODO: Open convert panel
          break;

        case 'panel:calculator':
          // TODO: Open calculator panel
          break;

        case 'panel:layers':
          // TODO: Open layers panel
          break;

        case 'shape:duplicate':
          if (store.selectedShapeId) {
            const shape = store.shapes.find(s => s.id === store.selectedShapeId);
            if (shape) {
              // Duplicate logic
              const count = step.params?.count || 1;
              for (let i = 0; i < count; i++) {
                // TODO: Implement duplicate with offset
              }
            }
          }
          break;

        case 'shape:delete':
          if (store.selectedShapeId) {
            store.deleteShape(store.selectedShapeId);
          }
          break;

        case 'view:toggle2d':
          store.toggleViewMode();
          break;

        default:
          console.warn(`Unknown workflow action: ${step.action}`);
          return false;
      }

      this.executionLog.push(`Step ${this.currentStepIndex + 1}: ${step.action} completed`);
      return true;

    } catch (error) {
      console.error(`Error executing step:`, error);
      this.executionLog.push(`Step ${this.currentStepIndex + 1}: ERROR - ${error}`);
      return false;
    }
  }

  getLog(): string[] {
    return [...this.executionLog];
  }
}
```

**Validation:**
- [ ] Engine executes simple workflows
- [ ] Validation checks work
- [ ] Prompts appear and accept input
- [ ] Actions dispatch correctly
- [ ] Error handling robust
- [ ] Execution log accurate

---

### Task 3.2: Integrate Action Tracking
**File:** `src/store/useAppStore.ts` (modifications)
**Estimated Time:** 4 hours
**Priority:** High

**Subtasks:**
- [ ] Import useToolHistoryStore
- [ ] Add trackAction call to `setActiveTool`
- [ ] Add trackAction to `enterEditMode`
- [ ] Add trackAction to `activateMeasurementTool`
- [ ] Add trackAction to `toggleViewMode`
- [ ] Add trackAction to all relevant actions
- [ ] Test tracking in browser

**Example Modification:**
```typescript
import { useToolHistoryStore } from './useToolHistoryStore';

// In useAppStore

setActiveTool: (tool) => {
  set((state) => ({
    drawing: {
      ...state.drawing,
      activeTool: tool,
      isDrawing: false,
      isResizeMode: false,
      isRotateMode: false,
      isCursorRotationMode: false,
    },
  }));

  // Track action
  useToolHistoryStore.getState().trackAction({
    id: `action-${Date.now()}`,
    type: `tool:${tool}` as ActionType,
    timestamp: Date.now(),
    label: tool.charAt(0).toUpperCase() + tool.slice(1) + ' Tool',
    icon: tool,
  });
},

// Similarly for other actions:
enterEditMode: (shapeId) => {
  // ... existing logic

  // Track action
  useToolHistoryStore.getState().trackAction({
    id: `action-${Date.now()}`,
    type: 'edit:mode',
    timestamp: Date.now(),
    label: 'Edit Mode',
    icon: 'edit',
  });
},
```

**Validation:**
- [ ] All tool activations tracked
- [ ] Recent actions update in UI
- [ ] Usage stats increment
- [ ] No performance degradation
- [ ] Recording captures actions

---

### Task 3.3: Update Store for Workflow Execution
**File:** `src/store/useToolHistoryStore.ts` (modification)
**Estimated Time:** 3 hours
**Priority:** High

**Subtasks:**
- [ ] Implement `executeNextStep` method
- [ ] Integrate WorkflowEngine
- [ ] Add progress tracking
- [ ] Add error state handling
- [ ] Update workflow usage count
- [ ] Add execution notifications

**Code:**
```typescript
import { WorkflowEngine } from '../services/workflowEngine';

// In useToolHistoryStore

startWorkflow: async (id) => {
  const workflow = get().workflows.find(w => w.id === id);
  if (!workflow) {
    console.error('Workflow not found:', id);
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

  try {
    const engine = new WorkflowEngine((step, total) => {
      // Update progress
      set((state) => ({
        workflowExecution: {
          ...state.workflowExecution,
          currentStep: step,
        },
      }));
    });

    await engine.execute(workflow);

    // Increment usage count
    get().updateWorkflow(id, {
      usageCount: workflow.usageCount + 1,
      lastUsed: Date.now(),
    });

    // Success notification
    alert(`Workflow "${workflow.name}" completed successfully!`);

  } catch (error) {
    console.error('Workflow execution failed:', error);
    set((state) => ({
      workflowExecution: {
        ...state.workflowExecution,
        error: error.message,
      },
    }));
    alert(`Workflow failed: ${error.message}`);

  } finally {
    set({
      workflowExecution: {
        workflowId: null,
        currentStep: 0,
        isExecuting: false,
        isPaused: false,
        executionHistory: [],
      },
    });
  }
},
```

**Validation:**
- [ ] Workflows execute successfully
- [ ] Progress updates in real-time
- [ ] Usage count increments
- [ ] Errors handled gracefully
- [ ] Notifications appear

---

### Task 3.4: Add Recording Logic
**File:** `src/store/useToolHistoryStore.ts` (modification)
**Estimated Time:** 3 hours
**Priority:** Medium

**Subtasks:**
- [ ] Update `trackAction` to add to recording
- [ ] Implement recorded step deduplication
- [ ] Add step parameter extraction
- [ ] Test recording full workflow
- [ ] Handle edge cases (empty recording, cancel)

**Validation:**
- [ ] Recording captures all actions
- [ ] Steps saved with correct parameters
- [ ] Stop creates workflow
- [ ] Cancel discards recording

---

### Task 3.5: Write Workflow Engine Tests
**File:** `src/__tests__/workflowEngine.test.ts` (new file)
**Estimated Time:** 4 hours
**Priority:** High

**Test Cases:**
- [ ] Engine executes workflow steps in order
- [ ] Validation prevents execution if prerequisites not met
- [ ] Prompts return user input
- [ ] Actions dispatch correctly
- [ ] Error handling stops execution
- [ ] Log captures all steps

**Validation:**
- [ ] All tests pass
- [ ] Edge cases covered
- [ ] Error scenarios tested

---

## Phase 4: Testing & Polish (Week 4: 15-20 hours)

### Task 4.1: Component Testing
**File:** `src/__tests__/ToolsPanel.test.tsx` (new file)
**Estimated Time:** 4 hours
**Priority:** High

**Test Cases:**
- [ ] ToolsPanel renders when expanded
- [ ] ToolsPanel hidden when not expanded
- [ ] Close button closes panel
- [ ] RecentActions displays correct items
- [ ] FrequentlyUsed shows top 3
- [ ] QuickWorkflows lists all workflows
- [ ] Workflow execution triggers on click
- [ ] Recording mode activates

**Validation:**
- [ ] All component tests pass
- [ ] No rendering errors
- [ ] User interactions work

---

### Task 4.2: Integration Testing
**File:** `src/__tests__/integration/toolsWorkflow.test.ts` (new file)
**Estimated Time:** 5 hours
**Priority:** High

**Test Scenarios:**
- [ ] User opens Tools panel
- [ ] User clicks recent action → tool activates
- [ ] User executes pre-built workflow
- [ ] User records custom workflow
- [ ] User edits and deletes workflow
- [ ] User imports/exports workflows
- [ ] localStorage persistence across refresh

**Validation:**
- [ ] All integration tests pass
- [ ] Real user flows work
- [ ] No race conditions

---

### Task 4.3: Performance Testing
**Estimated Time:** 3 hours
**Priority:** Medium

**Metrics to Measure:**
- [ ] Panel open time (<100ms)
- [ ] Workflow execution time (<500ms for 10 steps)
- [ ] Recording overhead (<5ms per action)
- [ ] localStorage size (<1MB for 50 workflows)
- [ ] FPS during panel interactions (maintain 60)

**Validation:**
- [ ] All performance budgets met
- [ ] No memory leaks
- [ ] Smooth animations

---

### Task 4.4: Visual Polish
**Estimated Time:** 3 hours
**Priority:** Medium

**Subtasks:**
- [ ] Smooth animations (200ms ease-out)
- [ ] Consistent spacing (8px increments)
- [ ] Proper hover states
- [ ] Focus indicators for accessibility
- [ ] Loading states during workflow execution
- [ ] Success/error notifications
- [ ] Empty states with helpful messaging

**Validation:**
- [ ] UI matches design system
- [ ] Animations smooth
- [ ] Consistent with other panels

---

### Task 4.5: Accessibility Audit
**Estimated Time:** 2 hours
**Priority:** High

**Checks:**
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] ARIA labels on all interactive elements
- [ ] Focus management in dialogs
- [ ] Screen reader friendly
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets ≥44px on mobile

**Validation:**
- [ ] Passes axe accessibility audit
- [ ] Keyboard-only navigation works
- [ ] Screen reader announces correctly

---

### Task 4.6: Documentation
**Estimated Time:** 2 hours
**Priority:** Medium

**Subtasks:**
- [ ] Update CLAUDE.md with Tools panel info
- [ ] Add JSDoc comments to all public APIs
- [ ] Create user guide in docs/
- [ ] Add inline code comments
- [ ] Document workflow creation process

**Validation:**
- [ ] Documentation complete
- [ ] Examples accurate
- [ ] Easy to understand

---

### Task 4.7: Final Testing & Bug Fixes
**Estimated Time:** 3 hours
**Priority:** Critical

**Activities:**
- [ ] Manual testing of all features
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS, Android)
- [ ] Fix any discovered bugs
- [ ] Final code review
- [ ] Prepare for merge

**Validation:**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Passes all tests
- [ ] Ready for production

---

## Validation Checklist

### Before Starting
- [x] Spec is approved
- [x] Plan is reviewed
- [x] No blocking dependencies
- [x] Development environment ready

### After Each Phase
- [ ] Phase 1: Store and types working
- [ ] Phase 2: UI components integrated
- [ ] Phase 3: Workflows executing
- [ ] Phase 4: All tests passing

### Before Completion
- [ ] All tasks complete
- [ ] All tests pass (70%+ coverage)
- [ ] Performance budgets met
- [ ] Accessibility audit passed
- [ ] Documentation updated
- [ ] Constitution compliance verified
- [ ] Code reviewed
- [ ] Ready for production

---

## Time Breakdown Summary

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 1: Foundation | 6 tasks | 20-25 hours |
| Phase 2: UI Components | 6 tasks | 25-30 hours |
| Phase 3: Workflow Engine | 5 tasks | 20-25 hours |
| Phase 4: Testing & Polish | 7 tasks | 15-20 hours |
| **Total** | **24 tasks** | **80-100 hours** |

**For 1 Developer:** 2-3 weeks (full-time)
**For 2 Developers:** 1.5-2 weeks (parallel work)

---

## Notes

### Remember
- **Use inline styles only** - No CSS files
- **Test frequently** - Don't wait until the end
- **Commit after each phase** - Keep git history clean
- **Track progress** - Update this task list as you go

### Helpful Commands
```bash
# Development
npm run dev

# Testing
npm run test:unit
npm run test:watch

# Type checking
npx tsc --noEmit

# Build
npm run build

# Check bundle size
npm run build && npx vite-bundle-visualizer
```

### Tips
- Start with Phase 1 completely before moving to Phase 2
- Test store in browser console during development
- Use React DevTools to inspect component state
- Check localStorage in DevTools → Application tab
- Profile performance with Chrome DevTools

---

**Task List Status:** ✅ Ready for Implementation

**Next Step:** Begin Task 1.1 - Define Type System

---

**Document Version:** 1.0
**Last Updated:** 2025-01-05
**Author:** Claude Code
