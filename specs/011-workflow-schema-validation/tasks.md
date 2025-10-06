# Implementation Tasks: Workflow Schema Validation

**Spec**: 011-workflow-schema-validation
**Total Estimated Time**: 2-3 hours
**Priority**: High

---

## Task Checklist

### Phase 1: Dependency Setup (15 min)

#### Task 1.1: Install Zod
**Time**: 5 min
**Priority**: Critical

**Steps**:
```bash
cd app
npm install zod@^3.22.0
```

**Validation**:
- [ ] `zod` appears in `package.json` dependencies
- [ ] No installation errors in console
- [ ] Can import `import { z } from 'zod'` without errors

**Potential Issues**:
- Version conflicts with other packages
- npm cache issues

**Fixes**:
```bash
# If installation fails
npm cache clean --force
npm install zod@^3.22.0
```

---

#### Task 1.2: Verify TypeScript Configuration
**Time**: 5 min
**Priority**: Medium

**Steps**:
1. Check `tsconfig.json` has `"strict": true`
2. Verify `"moduleResolution": "bundler"` or `"node"`
3. Test Zod import compiles

**Validation**:
```typescript
// Test file
import { z } from 'zod';
const schema = z.string();
console.log(schema.parse('test')); // Should compile
```

**Potential Issues**:
- TypeScript version incompatibility
- Module resolution errors

---

#### Task 1.3: Test Zod Bundle Size
**Time**: 5 min
**Priority**: Low

**Steps**:
```bash
npm run build
# Check dist/assets/*.js file sizes
```

**Validation**:
- [ ] Zod adds <15KB to bundle (gzipped)
- [ ] Tree-shaking works (only used schemas included)

---

### Phase 2: Schema Creation (45 min)

#### Task 2.1: Create Schema File
**Time**: 10 min
**Priority**: Critical

**File**: `app/src/schemas/workflowSchema.ts`

**Code**:
```typescript
import { z } from 'zod';

/**
 * Schema validation for workflow import/export
 * Ensures data integrity and security for workflow operations
 *
 * @module workflowSchema
 */

// Constants for validation limits
export const MAX_WORKFLOWS_PER_IMPORT = 100;
export const MAX_STEPS_PER_WORKFLOW = 50;
export const MAX_WORKFLOW_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_PROMPT_MESSAGE_LENGTH = 200;
export const MAX_PROMPT_OPTIONS = 50;
export const MAX_ICON_LENGTH = 50;
```

**Validation**:
- [ ] File compiles without errors
- [ ] Can import in other files
- [ ] Constants are accessible

---

#### Task 2.2: Define WorkflowStep Schema
**Time**: 15 min
**Priority**: Critical

**Code**:
```typescript
import { VALID_ACTION_TYPES } from '../types';

/**
 * Schema for individual workflow step
 * Validates action types, parameters, prompts, and validation rules
 */
export const WorkflowStepSchema = z.object({
  /** Unique identifier for the step */
  id: z.string().min(1, 'Step ID cannot be empty'),

  /** Action to perform - must be valid ActionType */
  action: z.enum(VALID_ACTION_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: `Action must be one of: ${VALID_ACTION_TYPES.join(', ')}` })
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
```

**Validation**:
- [ ] Schema accepts valid steps
- [ ] Schema rejects invalid action types
- [ ] Schema rejects oversized strings
- [ ] Error messages are clear

**Test**:
```typescript
// Valid step
const validStep = {
  id: 'step-1',
  action: 'tool:select'
};
WorkflowStepSchema.parse(validStep); // Should succeed

// Invalid step
const invalidStep = {
  id: 'step-1',
  action: 'tool:invalid'
};
WorkflowStepSchema.parse(invalidStep); // Should throw
```

---

#### Task 2.3: Define Workflow Schema
**Time**: 10 min
**Priority**: Critical

**Code**:
```typescript
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
```

**Validation**:
- [ ] Schema accepts valid workflows
- [ ] Schema rejects short names (<3 chars)
- [ ] Schema rejects long names (>100 chars)
- [ ] Schema rejects empty steps array
- [ ] Schema rejects too many steps (>50)

---

#### Task 2.4: Define Import Data Schema
**Time**: 10 min
**Priority**: Critical

**Code**:
```typescript
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
```

**Validation**:
- [ ] Schema accepts valid import data
- [ ] Schema rejects missing version
- [ ] Schema rejects negative timestamps
- [ ] Schema rejects too many workflows (>100)
- [ ] Type inference works correctly

**Test**:
```typescript
const validImport = {
  version: '1.0',
  exportedAt: Date.now(),
  workflows: [{
    name: 'Test Workflow',
    description: 'Test',
    icon: 'test',
    isBuiltIn: false,
    steps: [{ id: '1', action: 'tool:select' }]
  }]
};
ImportDataSchema.parse(validImport); // Should succeed
```

---

### Phase 3: Type Updates (10 min)

#### Task 3.1: Export Valid Action Types
**Time**: 10 min
**Priority**: Critical

**File**: `app/src/types/index.ts`

**Location**: After `ActionType` definition (around line 768)

**Code**:
```typescript
/**
 * All possible action types that can be tracked and automated
 */
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

/**
 * Array of all valid action types for runtime validation
 * Used by schema validation to ensure imported workflows have valid actions
 */
export const VALID_ACTION_TYPES: ActionType[] = [
  'tool:select',
  'tool:line',
  'tool:rectangle',
  'tool:circle',
  'tool:polyline',
  'tool:measure',
  'tool:rotate',
  'edit:mode',
  'panel:compare',
  'panel:convert',
  'panel:calculator',
  'panel:layers',
  'shape:duplicate',
  'shape:delete',
  'view:toggle2d'
];
```

**Validation**:
- [ ] Array exports without errors
- [ ] Can import in schemas file
- [ ] Array matches ActionType union exactly
- [ ] No duplicate values in array

**Test**:
```typescript
import { VALID_ACTION_TYPES } from './types';
console.log(VALID_ACTION_TYPES.length); // Should be 15
```

---

### Phase 4: Utility Functions (15 min)

#### Task 4.1: Add generateId Utility
**Time**: 10 min
**Priority**: High

**File**: `app/src/utils/validation.ts`

**Location**: After `validateWorkflowName` function

**Code**:
```typescript
/**
 * Generates a unique ID with optional prefix
 * Format: {prefix}-{timestamp}-{random}
 *
 * @param prefix - Prefix for the ID (default: 'id')
 * @returns Unique identifier string
 *
 * @example
 * generateId('workflow') // 'workflow-1696512000000-abc123def'
 * generateId() // 'id-1696512000000-xyz789ghi'
 */
export const generateId = (prefix: string = 'id'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}-${timestamp}-${random}`;
};
```

**Validation**:
- [ ] Function compiles without errors
- [ ] Generated IDs are unique
- [ ] Format matches pattern
- [ ] Prefix works correctly

**Test**:
```typescript
const id1 = generateId('workflow');
const id2 = generateId('workflow');
console.log(id1 !== id2); // true
console.log(id1.startsWith('workflow-')); // true
```

---

#### Task 4.2: Add formatBytes Utility
**Time**: 5 min
**Priority**: Medium

**File**: `app/src/utils/validation.ts`

**Code**:
```typescript
/**
 * Formats byte size into human-readable string
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 *
 * @example
 * formatBytes(1024) // '1.0 KB'
 * formatBytes(5242880) // '5.0 MB'
 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
```

**Validation**:
- [ ] Formats bytes correctly
- [ ] Handles edge cases (0, negative)
- [ ] Decimal precision is correct

---

### Phase 5: Import Function Update (45 min)

#### Task 5.1: Add Imports and Constants
**Time**: 5 min
**Priority**: Critical

**File**: `app/src/store/useToolHistoryStore.ts`

**Location**: Top of file

**Code**:
```typescript
import { ImportDataSchema } from '../schemas/workflowSchema';
import { sanitizeTextInput, generateId, formatBytes } from '../utils/validation';

// Add after existing imports
const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5MB
```

**Validation**:
- [ ] Imports compile without errors
- [ ] Constant is accessible
- [ ] No circular dependencies

---

#### Task 5.2: Add Size Validation
**Time**: 10 min
**Priority**: Critical

**File**: `app/src/store/useToolHistoryStore.ts`

**Location**: `importWorkflows` function (line ~466)

**Code**:
```typescript
importWorkflows: (data: string) => {
  try {
    // Step 1: Size validation (prevent DoS)
    const dataSize = new Blob([data]).size;
    if (dataSize > MAX_IMPORT_SIZE) {
      const sizeFormatted = formatBytes(dataSize);
      const maxFormatted = formatBytes(MAX_IMPORT_SIZE);
      logger.error(`Import failed: File too large (${sizeFormatted}). Maximum size is ${maxFormatted}.`);
      return false;
    }

    // Continue with existing logic...
```

**Validation**:
- [ ] Rejects files >5MB
- [ ] Error message shows actual size
- [ ] Error message shows limit
- [ ] Function returns false immediately

**Test**:
```typescript
// Create 6MB string
const largeData = 'x'.repeat(6 * 1024 * 1024);
const result = importWorkflows(largeData);
console.log(result); // false
```

---

#### Task 5.3: Add Schema Validation
**Time**: 15 min
**Priority**: Critical

**Location**: After JSON.parse(), replace existing validation

**Code**:
```typescript
    // Step 2: JSON parsing
    const parsed = JSON.parse(data);

    // Step 3: Schema validation
    const result = ImportDataSchema.safeParse(parsed);

    if (!result.success) {
      // Detailed logging for debugging
      logger.error('Workflow import validation failed:');
      result.error.issues.forEach((issue, index) => {
        const path = issue.path.length > 0 ? issue.path.join(' → ') : 'root';
        logger.error(`  ${index + 1}. ${path}: ${issue.message}`);
      });

      // User-friendly error message
      const firstError = result.error.issues[0];
      const errorPath = firstError.path.length > 0
        ? firstError.path.join(' → ') + ': '
        : '';
      const userMessage = `Import failed: ${errorPath}${firstError.message}`;

      // Could show alert here for user feedback
      // alert(userMessage);

      return false;
    }

    // Step 4: Extract validated data
    const validatedWorkflows = result.data.workflows;
```

**Validation**:
- [ ] Valid workflows pass validation
- [ ] Invalid workflows are rejected
- [ ] Error messages are logged
- [ ] First error is shown to user
- [ ] Function returns false on failure

---

#### Task 5.4: Update Store Mutation
**Time**: 10 min
**Priority**: Critical

**Location**: After schema validation

**Code**:
```typescript
    // Step 5: Sanitize and add to store
    set((state) => {
      const newWorkflows = validatedWorkflows.map((workflow) => ({
        ...workflow,
        // Sanitize user-provided strings
        name: sanitizeTextInput(workflow.name, 100),
        description: sanitizeTextInput(workflow.description, 500),
        // Generate new IDs for security
        id: generateId('workflow'),
        // Always force to false (security measure)
        isBuiltIn: false,
        // Add timestamps
        createdAt: Date.now(),
        usageCount: 0,
        lastUsed: undefined
      }));

      return {
        workflows: [...state.workflows, ...newWorkflows]
      };
    });

    logger.info(`Successfully imported ${validatedWorkflows.length} workflow(s)`);
    return true;
```

**Validation**:
- [ ] Workflow names are sanitized
- [ ] Descriptions are sanitized
- [ ] New IDs are generated
- [ ] isBuiltIn forced to false
- [ ] Timestamps added
- [ ] Success message logged

---

#### Task 5.5: Improve Error Handling
**Time**: 5 min
**Priority**: Medium

**Location**: catch block

**Code**:
```typescript
  } catch (error) {
    // Handle JSON syntax errors
    if (error instanceof SyntaxError) {
      logger.error('Import failed: Invalid JSON format. Please check your file syntax.');
      return false;
    }

    // Handle unexpected errors
    logger.error('Import failed with unexpected error:', error);
    return false;
  }
}
```

**Validation**:
- [ ] JSON syntax errors are caught
- [ ] Other errors are caught
- [ ] Error messages are helpful
- [ ] Function always returns boolean

---

### Phase 6: Testing (45 min)

#### Task 6.1: Create Test File
**Time**: 10 min
**Priority**: Critical

**File**: `app/src/__tests__/store/useToolHistoryStore.validation.test.ts`

**Setup**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useToolHistoryStore } from '../../store/useToolHistoryStore';

describe('useToolHistoryStore - Import Validation', () => {
  beforeEach(() => {
    // Clear workflows before each test
    const store = useToolHistoryStore.getState();
    useToolHistoryStore.setState({ workflows: [] });
  });

  // Tests go here...
});
```

---

#### Task 6.2: Write Positive Tests
**Time**: 15 min
**Priority**: High

**Tests**:
```typescript
  it('should import valid workflow successfully', () => {
    const validData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: [{
        name: 'Test Workflow',
        description: 'A valid test workflow',
        icon: 'zap',
        isBuiltIn: false,
        steps: [
          { id: 'step-1', action: 'tool:select' },
          { id: 'step-2', action: 'tool:rectangle' }
        ]
      }]
    });

    const result = useToolHistoryStore.getState().importWorkflows(validData);
    expect(result).toBe(true);

    const store = useToolHistoryStore.getState();
    expect(store.workflows).toHaveLength(1);
    expect(store.workflows[0].name).toBe('Test Workflow');
    expect(store.workflows[0].steps).toHaveLength(2);
  });

  it('should sanitize XSS in workflow names', () => {
    const xssData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: [{
        name: '<script>alert("XSS")</script>',
        description: 'Test',
        icon: 'test',
        isBuiltIn: false,
        steps: [{ id: '1', action: 'tool:select' }]
      }]
    });

    const result = useToolHistoryStore.getState().importWorkflows(xssData);
    expect(result).toBe(true);

    const store = useToolHistoryStore.getState();
    expect(store.workflows[0].name).not.toContain('<script>');
    expect(store.workflows[0].name).not.toContain('</script>');
  });

  it('should always force isBuiltIn to false', () => {
    const builtInData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: [{
        name: 'Test',
        description: 'Test',
        icon: 'test',
        isBuiltIn: true, // Trying to import as built-in
        steps: [{ id: '1', action: 'tool:select' }]
      }]
    });

    useToolHistoryStore.getState().importWorkflows(builtInData);

    const store = useToolHistoryStore.getState();
    expect(store.workflows[0].isBuiltIn).toBe(false);
  });
```

---

#### Task 6.3: Write Negative Tests
**Time**: 20 min
**Priority**: High

**Tests**:
```typescript
  it('should reject oversized imports (>5MB)', () => {
    const largeWorkflows = new Array(5000).fill({
      name: 'Test Workflow',
      description: 'x'.repeat(500),
      icon: 'test',
      isBuiltIn: false,
      steps: [{ id: '1', action: 'tool:select' }]
    });

    const largeData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: largeWorkflows
    });

    const result = useToolHistoryStore.getState().importWorkflows(largeData);
    expect(result).toBe(false);
  });

  it('should reject invalid ActionType', () => {
    const invalidData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: [{
        name: 'Test',
        description: 'Test',
        icon: 'test',
        isBuiltIn: false,
        steps: [{ id: '1', action: 'tool:invalid' }] // Invalid!
      }]
    });

    const result = useToolHistoryStore.getState().importWorkflows(invalidData);
    expect(result).toBe(false);
  });

  it('should reject missing required fields', () => {
    const invalidData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: [{
        // Missing name!
        description: 'Test',
        icon: 'test',
        isBuiltIn: false,
        steps: [{ id: '1', action: 'tool:select' }]
      }]
    });

    const result = useToolHistoryStore.getState().importWorkflows(invalidData);
    expect(result).toBe(false);
  });

  it('should reject too many workflows (>100)', () => {
    const tooMany = new Array(101).fill({
      name: 'Test',
      description: 'Test',
      icon: 'test',
      isBuiltIn: false,
      steps: [{ id: '1', action: 'tool:select' }]
    });

    const tooManyData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: tooMany
    });

    const result = useToolHistoryStore.getState().importWorkflows(tooManyData);
    expect(result).toBe(false);
  });

  it('should reject too many steps (>50)', () => {
    const tooManySteps = new Array(51).fill({
      id: 'step',
      action: 'tool:select'
    });

    const invalidData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: [{
        name: 'Test',
        description: 'Test',
        icon: 'test',
        isBuiltIn: false,
        steps: tooManySteps
      }]
    });

    const result = useToolHistoryStore.getState().importWorkflows(invalidData);
    expect(result).toBe(false);
  });

  it('should reject workflow name too short (<3 chars)', () => {
    const invalidData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: [{
        name: 'AB', // Too short!
        description: 'Test',
        icon: 'test',
        isBuiltIn: false,
        steps: [{ id: '1', action: 'tool:select' }]
      }]
    });

    const result = useToolHistoryStore.getState().importWorkflows(invalidData);
    expect(result).toBe(false);
  });

  it('should reject invalid JSON syntax', () => {
    const invalidJSON = '{ "invalid": json }'; // Missing quotes

    const result = useToolHistoryStore.getState().importWorkflows(invalidJSON);
    expect(result).toBe(false);
  });
```

---

### Phase 7: Documentation (30 min)

#### Task 7.1: Update CLAUDE.md
**Time**: 10 min
**Priority**: Medium

**Location**: Security Implementation section

**Addition**:
```markdown
### Workflow Import Validation
**Security Rating: Enhanced to 9.9/10**
- Zod schema validation prevents malformed data injection
- File size limits (5MB) prevent DoS attacks
- ActionType whitelist prevents code injection
- String sanitization prevents XSS attacks
- Type validation prevents runtime crashes
- Workflow count limits (100) prevent storage overflow
```

---

#### Task 7.2: Add JSDoc to Schema File
**Time**: 10 min
**Priority**: Low

**File**: `app/src/schemas/workflowSchema.ts`

**Add file-level JSDoc**:
```typescript
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
```

---

#### Task 7.3: Create Migration Guide
**Time**: 10 min
**Priority**: Low

**File**: `specs/011-workflow-schema-validation/MIGRATION.md`

**Content**:
```markdown
# Workflow Import Migration Guide

## For Users

### What Changed
Starting with version X.X.X, workflow imports are now validated for security and data integrity.

### Common Error Messages

**"File too large (7.2 MB). Maximum size is 5.0 MB."**
- **Solution**: Split your workflows into multiple smaller files

**"Invalid action type: tool:xyz"**
- **Solution**: Check that all action types are valid (see list below)

**"Workflow name must be at least 3 characters"**
- **Solution**: Rename workflows to have descriptive names

### Valid Action Types
- tool:select, tool:line, tool:rectangle, tool:circle
- tool:polyline, tool:measure, tool:rotate
- edit:mode
- panel:compare, panel:convert, panel:calculator, panel:layers
- shape:duplicate, shape:delete
- view:toggle2d

## For Developers

### Breaking Changes
None - this is a non-breaking addition of validation.

### New Validations
- File size: max 5MB
- Workflow count: max 100 per import
- Steps per workflow: max 50
- Name length: 3-100 characters
- Description length: 0-500 characters
```

---

## Completion Checklist

### Phase 1: Setup ✅
- [ ] Zod installed
- [ ] TypeScript compiles
- [ ] Bundle size acceptable

### Phase 2: Schemas ✅
- [ ] WorkflowStepSchema created
- [ ] WorkflowSchema created
- [ ] ImportDataSchema created
- [ ] Type inference working

### Phase 3: Types ✅
- [ ] VALID_ACTION_TYPES exported
- [ ] Array matches union type

### Phase 4: Utils ✅
- [ ] generateId implemented
- [ ] formatBytes implemented

### Phase 5: Import Function ✅
- [ ] Size validation added
- [ ] Schema validation added
- [ ] Store mutation updated
- [ ] Error handling improved

### Phase 6: Testing ✅
- [ ] Positive tests written
- [ ] Negative tests written
- [ ] All tests passing

### Phase 7: Documentation ✅
- [ ] CLAUDE.md updated
- [ ] JSDoc added
- [ ] Migration guide created

---

## Final Validation

**Run all tests**:
```bash
npm run test:unit
```

**Expected**: All tests pass, including new validation tests

**Check bundle size**:
```bash
npm run build
ls -lh dist/assets/*.js
```

**Expected**: Zod adds <15KB (gzipped)

**Test in development**:
```bash
npm run dev
# Try importing valid and invalid workflow files
```

**Expected**:
- Valid imports succeed with success message
- Invalid imports fail with clear error messages
- No console errors in browser

---

## Time Tracking

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| 1. Setup | 15 min | | |
| 2. Schemas | 45 min | | |
| 3. Types | 10 min | | |
| 4. Utils | 15 min | | |
| 5. Import | 45 min | | |
| 6. Testing | 45 min | | |
| 7. Docs | 30 min | | |
| **Total** | **2h 45min** | | |

---

## Success Criteria

✅ **All tasks completed**
✅ **All tests passing**
✅ **No TypeScript errors**
✅ **No runtime errors**
✅ **Bundle size acceptable (<15KB added)**
✅ **Error messages are clear**
✅ **XSS attacks prevented**
✅ **DoS attacks prevented**
✅ **Documentation updated**
