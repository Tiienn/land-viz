import type { Workflow } from '../types';

/**
 * Pre-built workflows that ship with the application.
 * These cannot be modified directly but can be duplicated for customization.
 *
 * @module defaultWorkflows
 */

/**
 * Default workflows array (without id, createdAt, usageCount)
 * These fields will be added when workflows are initialized in the store
 */
export const DEFAULT_WORKFLOWS: Omit<Workflow, 'id' | 'createdAt' | 'usageCount'>[] = [
  // ================================
  // 1. QUICK PROPERTY SURVEY
  // ================================
  {
    name: 'Quick Property Survey',
    description: 'Complete property analysis in one click',
    icon: 'zap',
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

  // ================================
  // 2. SUBDIVISION PLANNER
  // ================================
  {
    name: 'Subdivision Planner',
    description: 'Create subdivision layout from existing parcel',
    icon: 'subdivision',
    isBuiltIn: true,
    steps: [
      {
        id: 'step-1',
        action: 'tool:select',
        validation: {
          requiresSelection: true,
        },
      },
      {
        id: 'step-2',
        action: 'shape:duplicate',
        params: { count: 4 },
        validation: {
          requiresSelection: true,
        },
      },
    ],
  },

  // ================================
  // 3. BEFORE & AFTER COMPARISON
  // ================================
  {
    name: 'Before & After',
    description: 'Compare current vs. proposed sizes',
    icon: 'chartBar',
    isBuiltIn: true,
    steps: [
      {
        id: 'step-1',
        action: 'tool:select',
        validation: {
          requiresSelection: true,
        },
      },
      {
        id: 'step-2',
        action: 'shape:duplicate',
        params: { offsetX: 20, offsetY: 0 },
        validation: {
          requiresSelection: true,
        },
      },
      {
        id: 'step-3',
        action: 'panel:compare',
        params: { autoOpen: true },
      },
    ],
  },

  // ================================
  // 4. EXPORT PACKAGE
  // ================================
  {
    name: 'Export Package',
    description: 'Generate complete deliverable package',
    icon: 'packageBox',
    isBuiltIn: true,
    steps: [
      {
        id: 'step-1',
        action: 'panel:layers',
        params: { action: 'exportAll' },
      },
    ],
  },

  // ================================
  // 5. PRECISION SETUP
  // ================================
  {
    name: 'Precision Setup',
    description: 'Configure CAD-style precision environment',
    icon: 'target',
    isBuiltIn: true,
    steps: [
      {
        id: 'step-1',
        action: 'view:toggle2d',
        params: { mode: '2d' },
      },
      {
        id: 'step-2',
        action: 'tool:measure',
        params: { activate: true },
      },
    ],
  },
];

/**
 * Get a default workflow by name
 * @param name - Name of the workflow to retrieve
 * @returns The workflow template or undefined if not found
 */
export function getDefaultWorkflow(name: string): Omit<Workflow, 'id' | 'createdAt' | 'usageCount'> | undefined {
  return DEFAULT_WORKFLOWS.find(w => w.name === name);
}

/**
 * Get all workflow names
 * @returns Array of workflow names
 */
export function getDefaultWorkflowNames(): string[] {
  return DEFAULT_WORKFLOWS.map(w => w.name);
}

/**
 * Check if a workflow name is a default workflow
 * @param name - Name to check
 * @returns True if the name matches a default workflow
 */
export function isDefaultWorkflow(name: string): boolean {
  return DEFAULT_WORKFLOWS.some(w => w.name === name);
}
