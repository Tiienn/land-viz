/**
 * @fileoverview Validation tests for workflow import/export functionality
 *
 * Tests comprehensive schema validation to prevent:
 * - XSS attacks via malicious workflow names/descriptions
 * - DoS attacks via oversized files or excessive workflow counts
 * - Type confusion attacks via invalid data types
 * - Runtime errors from missing or malformed fields
 *
 * @module __tests__/store/useToolHistoryStore.validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useToolHistoryStore } from '../../store/useToolHistoryStore';

describe('useToolHistoryStore - Workflow Import Validation', () => {
  beforeEach(() => {
    // Reset store state before each test
    useToolHistoryStore.setState({
      workflows: [],
      recentActions: [],
      usageStats: {},
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
    });
  });

  describe('Valid Workflow Import', () => {
    it('should successfully import valid workflow data', () => {
      const validData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'Test Workflow',
            description: 'A test workflow for validation',
            icon: '🧪',
            isBuiltIn: false,
            steps: [
              {
                id: 'step-1',
                action: 'tool:rectangle',
                params: { width: 10, height: 10 }
              }
            ]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(validData));

      expect(result).toBe(true);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(1);
      expect(useToolHistoryStore.getState().workflows[0].name).toBe('Test Workflow');
    });

    it('should import multiple workflows successfully', () => {
      const validData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'Workflow 1',
            description: 'First workflow',
            icon: '1️⃣',
            isBuiltIn: false,
            steps: [{ id: 'step-1', action: 'tool:select' }]
          },
          {
            name: 'Workflow 2',
            description: 'Second workflow',
            icon: '2️⃣',
            isBuiltIn: false,
            steps: [{ id: 'step-2', action: 'tool:circle' }]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(validData));

      expect(result).toBe(true);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(2);
    });
  });

  describe('File Size Validation (DoS Prevention)', () => {
    it('should reject files larger than 5MB', () => {
      // Create a large string (>5MB)
      const largeWorkflow = {
        name: 'X'.repeat(6 * 1024 * 1024), // 6MB of 'X' characters
        description: 'Large workflow',
        icon: '💾',
        isBuiltIn: false,
        steps: [{ id: 'step-1', action: 'tool:select' }]
      };

      const largeData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [largeWorkflow]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(largeData));

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });
  });

  describe('Invalid ActionType Rejection', () => {
    it('should reject workflows with invalid action types', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'Invalid Workflow',
            description: 'Contains invalid action',
            icon: '❌',
            isBuiltIn: false,
            steps: [
              {
                id: 'step-1',
                action: 'malicious:script', // Invalid action type
                params: {}
              }
            ]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(invalidData));

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });
  });

  describe('Missing Required Fields', () => {
    it('should reject workflows missing required name field', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            // Missing 'name' field
            description: 'Missing name',
            icon: '❌',
            isBuiltIn: false,
            steps: [{ id: 'step-1', action: 'tool:select' }]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(invalidData));

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });

    it('should reject workflows missing steps array', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'No Steps',
            description: 'Missing steps',
            icon: '❌',
            isBuiltIn: false,
            // Missing 'steps' field
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(invalidData));

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });

    it('should reject workflows with empty steps array', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'Empty Steps',
            description: 'Has empty steps array',
            icon: '❌',
            isBuiltIn: false,
            steps: [] // Empty array - must have at least 1 step
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(invalidData));

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });
  });

  describe('Workflow Count Limits', () => {
    it('should reject imports with more than 100 workflows', () => {
      // Create 101 workflows
      const tooManyWorkflows = Array.from({ length: 101 }, (_, i) => ({
        name: `Workflow ${i + 1}`,
        description: `Workflow number ${i + 1}`,
        icon: '📝',
        isBuiltIn: false,
        steps: [{ id: `step-${i}`, action: 'tool:select' }]
      }));

      const invalidData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: tooManyWorkflows
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(invalidData));

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });

    it('should accept exactly 100 workflows', () => {
      // Create exactly 100 workflows
      const maxWorkflows = Array.from({ length: 100 }, (_, i) => ({
        name: `Workflow ${i + 1}`,
        description: `Workflow number ${i + 1}`,
        icon: '📝',
        isBuiltIn: false,
        steps: [{ id: `step-${i}`, action: 'tool:select' }]
      }));

      const validData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: maxWorkflows
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(validData));

      expect(result).toBe(true);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(100);
    });
  });

  describe('Workflow Steps Limits', () => {
    it('should reject workflows with more than 50 steps', () => {
      // Create workflow with 51 steps
      const tooManySteps = Array.from({ length: 51 }, (_, i) => ({
        id: `step-${i}`,
        action: 'tool:select'
      }));

      const invalidData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'Too Many Steps',
            description: 'Has 51 steps',
            icon: '⚠️',
            isBuiltIn: false,
            steps: tooManySteps
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(invalidData));

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });

    it('should accept exactly 50 steps', () => {
      const maxSteps = Array.from({ length: 50 }, (_, i) => ({
        id: `step-${i}`,
        action: 'tool:select'
      }));

      const validData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'Max Steps',
            description: 'Has exactly 50 steps',
            icon: '✅',
            isBuiltIn: false,
            steps: maxSteps
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(validData));

      expect(result).toBe(true);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(1);
    });
  });

  describe('Name Length Validation', () => {
    it('should reject workflow names shorter than 3 characters', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'AB', // Only 2 characters
            description: 'Short name',
            icon: '❌',
            isBuiltIn: false,
            steps: [{ id: 'step-1', action: 'tool:select' }]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(invalidData));

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });

    it('should reject workflow names longer than 100 characters', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'X'.repeat(101), // 101 characters
            description: 'Too long name',
            icon: '❌',
            isBuiltIn: false,
            steps: [{ id: 'step-1', action: 'tool:select' }]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(invalidData));

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });

    it('should accept workflow names between 3 and 100 characters', () => {
      const validData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'ABC', // Minimum 3 characters
            description: 'Valid name',
            icon: '✅',
            isBuiltIn: false,
            steps: [{ id: 'step-1', action: 'tool:select' }]
          },
          {
            name: 'X'.repeat(100), // Maximum 100 characters
            description: 'Valid long name',
            icon: '✅',
            isBuiltIn: false,
            steps: [{ id: 'step-1', action: 'tool:select' }]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(validData));

      expect(result).toBe(true);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(2);
    });
  });

  describe('XSS Sanitization', () => {
    it('should sanitize workflow names containing HTML tags', () => {
      const xssData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: '<script>alert("XSS")</script>Test Workflow',
            description: 'XSS attempt in name',
            icon: '🔒',
            isBuiltIn: false,
            steps: [{ id: 'step-1', action: 'tool:select' }]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(xssData));

      expect(result).toBe(true);
      const importedWorkflow = useToolHistoryStore.getState().workflows[0];

      // Name should be sanitized (HTML tags removed)
      expect(importedWorkflow.name).not.toContain('<script>');
      expect(importedWorkflow.name).not.toContain('</script>');
    });

    it('should sanitize workflow descriptions containing HTML tags', () => {
      const xssData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'XSS Test',
            description: '<img src=x onerror="alert(1)">Malicious description',
            icon: '🔒',
            isBuiltIn: false,
            steps: [{ id: 'step-1', action: 'tool:select' }]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(xssData));

      expect(result).toBe(true);
      const importedWorkflow = useToolHistoryStore.getState().workflows[0];

      // Description should be sanitized
      expect(importedWorkflow.description).not.toContain('<img');
      expect(importedWorkflow.description).not.toContain('onerror');
    });
  });

  describe('Built-in Flag Security', () => {
    it('should force isBuiltIn to false for all imported workflows', () => {
      const maliciousData = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'Fake Built-in',
            description: 'Attempting privilege escalation',
            icon: '🔓',
            isBuiltIn: true, // Trying to set as built-in
            steps: [{ id: 'step-1', action: 'tool:select' }]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(maliciousData));

      expect(result).toBe(true);
      const importedWorkflow = useToolHistoryStore.getState().workflows[0];

      // isBuiltIn should be forced to false for security
      expect(importedWorkflow.isBuiltIn).toBe(false);
    });
  });

  describe('Invalid JSON Syntax', () => {
    it('should reject malformed JSON', () => {
      const invalidJson = '{this is not valid JSON}';

      const result = useToolHistoryStore.getState().importWorkflows(invalidJson);

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });

    it('should reject empty string', () => {
      const result = useToolHistoryStore.getState().importWorkflows('');

      expect(result).toBe(false);
      expect(useToolHistoryStore.getState().workflows).toHaveLength(0);
    });
  });

  describe('ID Generation Security', () => {
    it('should generate new unique IDs and not trust imported IDs', () => {
      const dataWithIds = {
        version: '1.0',
        exportedAt: Date.now(),
        workflows: [
          {
            name: 'Test Workflow',
            description: 'Testing ID generation',
            icon: '🔑',
            isBuiltIn: false,
            steps: [
              {
                id: 'malicious-id-1',
                action: 'tool:select'
              }
            ]
          }
        ]
      };

      const result = useToolHistoryStore.getState().importWorkflows(JSON.stringify(dataWithIds));

      expect(result).toBe(true);
      const importedWorkflow = useToolHistoryStore.getState().workflows[0];

      // ID should be regenerated with 'workflow-' prefix
      expect(importedWorkflow.id).toMatch(/^workflow-\d+-[a-z0-9]+$/);

      // Step IDs should also be regenerated with 'step-' prefix
      expect(importedWorkflow.steps[0].id).toMatch(/^step-\d+-[a-z0-9]+$/);
      expect(importedWorkflow.steps[0].id).not.toBe('malicious-id-1');
    });
  });
});
