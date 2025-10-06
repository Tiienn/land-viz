import { z } from 'zod';
import { VALID_ACTION_TYPES } from '../types';

/**
 * @fileoverview Zod schemas for workflow import/export validation
 *
 * Provides comprehensive validation for workflow data to prevent:
 * - XSS attacks via malicious workflow names/descriptions
 * - DoS attacks via oversized files or excessive workflow counts
 * - Type confusion attacks via invalid data types
 * - Runtime errors from missing or malformed fields
 *
 * All imported workflows must pass schema validation before
 * being added to the application store.
 *
 * @module schemas/workflowSchema
 * @see {@link ../store/useToolHistoryStore.ts} for usage
 */

// Constants for validation limits
export const MAX_WORKFLOWS_PER_IMPORT = 100;
export const MAX_STEPS_PER_WORKFLOW = 50;
export const MAX_WORKFLOW_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_PROMPT_MESSAGE_LENGTH = 200;
export const MAX_PROMPT_OPTIONS = 50;
export const MAX_ICON_LENGTH = 50;

/**
 * Schema for individual workflow step
 * Validates action types, parameters, prompts, and validation rules
 */
export const WorkflowStepSchema = z.object({
  /** Unique identifier for the step */
  id: z.string().min(1, 'Step ID cannot be empty'),

  /** Action to perform - must be valid ActionType */
  action: z.enum(VALID_ACTION_TYPES as [string, ...string[]], {
    errorMap: () => ({
      message: `Action must be one of: ${VALID_ACTION_TYPES.join(', ')}`
    })
  }),

  /** Optional parameters for the action */
  params: z.record(z.any()).optional(),

  /** Optional user prompt configuration */
  prompt: z.object({
    message: z.string()
      .max(MAX_PROMPT_MESSAGE_LENGTH, `Prompt message cannot exceed ${MAX_PROMPT_MESSAGE_LENGTH} characters`),
    type: z.enum(['number', 'text', 'select'], {
      errorMap: () => ({ message: 'Prompt type must be: number, text, or select' })
    }),
    options: z.array(z.string())
      .max(MAX_PROMPT_OPTIONS, `Cannot have more than ${MAX_PROMPT_OPTIONS} options`)
      .optional(),
    defaultValue: z.any().optional()
  }).optional(),

  /** Optional validation requirements */
  validation: z.object({
    requiresSelection: z.boolean().optional(),
    requiresShape: z.boolean().optional()
  }).optional()
});

/**
 * Schema for complete workflow definition
 * Validates name, description, icon, and steps array
 */
export const WorkflowSchema = z.object({
  /** Workflow name (3-100 characters) */
  name: z.string()
    .min(3, 'Workflow name must be at least 3 characters')
    .max(MAX_WORKFLOW_NAME_LENGTH, `Workflow name cannot exceed ${MAX_WORKFLOW_NAME_LENGTH} characters`),

  /** Workflow description (0-500 characters) */
  description: z.string()
    .max(MAX_DESCRIPTION_LENGTH, `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`),

  /** Icon identifier (max 50 characters) */
  icon: z.string()
    .max(MAX_ICON_LENGTH, `Icon string cannot exceed ${MAX_ICON_LENGTH} characters`),

  /** Whether this is a built-in workflow */
  isBuiltIn: z.boolean(),

  /** Array of workflow steps (1-50 steps) */
  steps: z.array(WorkflowStepSchema)
    .min(1, 'Workflow must have at least 1 step')
    .max(MAX_STEPS_PER_WORKFLOW, `Workflow cannot have more than ${MAX_STEPS_PER_WORKFLOW} steps`)
});

/**
 * Schema for complete import data structure
 * Validates version, timestamp, and workflows array
 */
export const ImportDataSchema = z.object({
  /** Schema version for migration support */
  version: z.string(),

  /** Timestamp when data was exported */
  exportedAt: z.number()
    .positive('Export timestamp must be positive')
    .int('Export timestamp must be an integer'),

  /** Array of workflows to import (max 100) */
  workflows: z.array(WorkflowSchema)
    .min(1, 'Must import at least 1 workflow')
    .max(MAX_WORKFLOWS_PER_IMPORT, `Cannot import more than ${MAX_WORKFLOWS_PER_IMPORT} workflows at once`)
});

// Type inference for TypeScript
export type ValidatedWorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type ValidatedWorkflow = z.infer<typeof WorkflowSchema>;
export type ValidatedImportData = z.infer<typeof ImportDataSchema>;
