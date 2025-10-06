# Implementation Plan: Workflow Schema Validation

**Spec**: 011-workflow-schema-validation
**Estimated Time**: 2-3 hours
**Complexity**: Medium
**Risk Level**: Low

---

## Overview

This plan details the step-by-step implementation of comprehensive schema validation for workflow imports using Zod, including security hardening, type safety improvements, and error handling enhancements.

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Action: Import                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              1. File Size Check (5MB limit)                  │
│              └─ Reject if > 5MB                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              2. JSON.parse() + Error Handling                │
│              └─ Catch syntax errors                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              3. Zod Schema Validation                        │
│              ├─ ImportDataSchema.safeParse()                │
│              ├─ Validate structure                           │
│              ├─ Validate types                               │
│              ├─ Validate constraints                         │
│              └─ Return detailed errors                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
            ▼                   ▼
     ┌──────────┐        ┌──────────┐
     │ Success  │        │  Failure │
     └────┬─────┘        └────┬─────┘
          │                   │
          ▼                   ▼
  ┌───────────────┐   ┌───────────────┐
  │ 4. Sanitize   │   │ Log Error     │
  │    Strings    │   │ Return false  │
  └───────┬───────┘   └───────────────┘
          │
          ▼
  ┌───────────────┐
  │ 5. Generate   │
  │    New IDs    │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ 6. Update     │
  │    Store      │
  └───────────────┘
```

### Data Flow

```typescript
User File (JSON)
  ↓
File Size Validation
  ↓
JSON.parse()
  ↓
Zod Schema Validation
  ├─ WorkflowStepSchema
  ├─ WorkflowSchema
  └─ ImportDataSchema
  ↓
String Sanitization
  ↓
ID Generation
  ↓
Zustand Store Update
```

---

## Technical Decisions

### Why Zod?

| Criteria | Zod | Yup | Joi | io-ts |
|----------|-----|-----|-----|-------|
| TypeScript-first | ✅ | ❌ | ❌ | ✅ |
| Bundle size (gzipped) | 13KB | 18KB | 145KB | 12KB |
| Type inference | Excellent | Good | None | Excellent |
| Error messages | Excellent | Good | Good | Poor |
| Tree-shakeable | ✅ | ❌ | ❌ | ✅ |
| Maintenance | Active | Active | Active | Less active |

**Decision**: Zod provides the best balance of features, size, and developer experience.

### Schema Location

**Option 1**: Co-locate with types in `types/index.ts`
- ✅ Single source of truth
- ❌ Mixes runtime and compile-time code

**Option 2**: Separate file `schemas/workflowSchema.ts`
- ✅ Clear separation of concerns
- ✅ Easier to test schemas independently
- ❌ Two files to maintain

**Decision**: Option 2 - Create `schemas/workflowSchema.ts` for better organization.

---

## File Changes

### New Files

#### 1. `app/src/schemas/workflowSchema.ts`
**Purpose**: Zod schemas for workflow validation
**Size**: ~150 lines
**Dependencies**: zod, ../types

```typescript
import { z } from 'zod';

// Schema definitions
export const WorkflowStepSchema = z.object({ ... });
export const WorkflowSchema = z.object({ ... });
export const ImportDataSchema = z.object({ ... });

// Type inference
export type ValidatedWorkflow = z.infer<typeof WorkflowSchema>;
```

### Modified Files

#### 1. `app/package.json`
**Changes**:
- Add `"zod": "^3.22.0"` to dependencies

**Lines affected**: 1 line addition

#### 2. `app/src/store/useToolHistoryStore.ts`
**Changes**:
- Import Zod schemas
- Add size validation
- Replace minimal validation with schema validation
- Improve error messages
- Add sanitization call

**Lines affected**: Lines 465-495 (30 lines modified)

**Before**:
```typescript
importWorkflows: (data: string) => {
  try {
    const parsed = JSON.parse(data);
    if (!parsed.workflows || !Array.isArray(parsed.workflows)) {
      logger.error('Invalid workflow data format');
      return false;
    }
    // ... unsafe mapping
  }
}
```

**After**:
```typescript
importWorkflows: (data: string) => {
  try {
    // Size check
    const dataSize = new Blob([data]).size;
    if (dataSize > MAX_IMPORT_SIZE) {
      logger.error(`Import file too large: ${formatBytes(dataSize)}`);
      return false;
    }

    const parsed = JSON.parse(data);

    // Schema validation
    const result = ImportDataSchema.safeParse(parsed);
    if (!result.success) {
      logger.error('Import validation failed:', result.error.issues);
      return false;
    }

    // Use validated data
    const validatedWorkflows = result.data.workflows;
    // ... safe processing
  }
}
```

#### 3. `app/src/types/index.ts`
**Changes**:
- Export `VALID_ACTION_TYPES` array for schema validation

**Lines affected**: 3 lines addition

```typescript
export const VALID_ACTION_TYPES: ActionType[] = [
  'tool:select', 'tool:line', 'tool:rectangle', // ...
];
```

---

## Implementation Steps

### Step 1: Install Zod (15 min)

**Tasks**:
1. Add Zod to package.json
2. Run npm install
3. Verify installation

**Commands**:
```bash
cd app
npm install zod@^3.22.0
```

**Validation**:
- Zod appears in package.json dependencies
- No installation errors
- TypeScript recognizes zod imports

---

### Step 2: Create Schema Definitions (45 min)

**File**: `app/src/schemas/workflowSchema.ts`

**Tasks**:
1. Import Zod and types
2. Define WorkflowStepSchema
3. Define WorkflowSchema
4. Define ImportDataSchema
5. Export inferred types
6. Add JSDoc comments

**Code Structure**:
```typescript
import { z } from 'zod';
import { VALID_ACTION_TYPES } from '../types';

// Constants
const MAX_WORKFLOWS_PER_IMPORT = 100;
const MAX_STEPS_PER_WORKFLOW = 50;
const MAX_WORKFLOW_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

// Schemas
export const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  action: z.enum(VALID_ACTION_TYPES as [string, ...string[]]),
  params: z.record(z.any()).optional(),
  prompt: z.object({
    message: z.string().max(200),
    type: z.enum(['number', 'text', 'select']),
    options: z.array(z.string()).max(50).optional(),
    defaultValue: z.any().optional()
  }).optional(),
  validation: z.object({
    requiresSelection: z.boolean().optional(),
    requiresShape: z.boolean().optional()
  }).optional()
});

export const WorkflowSchema = z.object({
  name: z.string().min(3).max(MAX_WORKFLOW_NAME_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH),
  icon: z.string().max(50),
  isBuiltIn: z.boolean(),
  steps: z.array(WorkflowStepSchema).min(1).max(MAX_STEPS_PER_WORKFLOW)
});

export const ImportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.number().positive(),
  workflows: z.array(WorkflowSchema).max(MAX_WORKFLOWS_PER_IMPORT)
});

// Type inference
export type ValidatedWorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type ValidatedWorkflow = z.infer<typeof WorkflowSchema>;
export type ValidatedImportData = z.infer<typeof ImportDataSchema>;
```

**Validation**:
- File compiles without errors
- Types are correctly inferred
- All constraints are defined

---

### Step 3: Update Types Export (10 min)

**File**: `app/src/types/index.ts`

**Task**: Export VALID_ACTION_TYPES array

**Code**:
```typescript
// After ActionType definition (around line 768)
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
- Array exports correctly
- Can be imported in schemas
- Matches ActionType union exactly

---

### Step 4: Update Import Function (45 min)

**File**: `app/src/store/useToolHistoryStore.ts`

**Tasks**:
1. Import schemas
2. Add constants
3. Add size check
4. Replace validation with schema
5. Improve error messages
6. Add sanitization
7. Update tests

**Implementation**:

```typescript
import { ImportDataSchema } from '../schemas/workflowSchema';

// Constants at top of file
const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5MB

// Helper function
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// In store definition
importWorkflows: (data: string) => {
  try {
    // Step 1: Size validation
    const dataSize = new Blob([data]).size;
    if (dataSize > MAX_IMPORT_SIZE) {
      const sizeFormatted = formatBytes(dataSize);
      const maxFormatted = formatBytes(MAX_IMPORT_SIZE);
      logger.error(`Import failed: File too large (${sizeFormatted}). Maximum size is ${maxFormatted}.`);
      return false;
    }

    // Step 2: JSON parsing
    const parsed = JSON.parse(data);

    // Step 3: Schema validation
    const result = ImportDataSchema.safeParse(parsed);

    if (!result.success) {
      // Log detailed errors
      logger.error('Workflow import validation failed:');
      result.error.issues.forEach((issue, index) => {
        logger.error(`  ${index + 1}. ${issue.path.join('.')}: ${issue.message}`);
      });

      // User-friendly message
      const firstError = result.error.issues[0];
      const errorPath = firstError.path.join(' → ');
      const errorMessage = `Import failed: ${errorPath ? errorPath + ': ' : ''}${firstError.message}`;
      logger.error(errorMessage);

      return false;
    }

    // Step 4: Use validated data
    const validatedWorkflows = result.data.workflows;

    // Step 5: Sanitize strings
    set((state) => {
      const newWorkflows = validatedWorkflows.map((workflow) => ({
        ...workflow,
        name: sanitizeTextInput(workflow.name, 100),
        description: sanitizeTextInput(workflow.description, 500),
        id: generateId('workflow'),
        isBuiltIn: false, // Always force to false for security
        createdAt: Date.now(),
        usageCount: 0
      }));

      return {
        workflows: [...state.workflows, ...newWorkflows]
      };
    });

    logger.info(`Successfully imported ${validatedWorkflows.length} workflow(s)`);
    return true;

  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.error('Import failed: Invalid JSON format');
    } else {
      logger.error('Import failed:', error);
    }
    return false;
  }
}
```

**Validation**:
- Size limit enforced
- Schema validation works
- Error messages are clear
- Sanitization applied
- Store only updated on success

---

### Step 5: Add Helper Functions (15 min)

**File**: `app/src/utils/validation.ts` (already has sanitizeTextInput)

**Task**: Add generateId utility

```typescript
/**
 * Generates a unique ID with optional prefix
 * Format: {prefix}-{timestamp}-{random}
 *
 * @param prefix - Optional prefix (default: 'id')
 * @returns Unique identifier string
 */
export const generateId = (prefix: string = 'id'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}-${timestamp}-${random}`;
};
```

**Update useToolHistoryStore.ts** to use:
```typescript
import { sanitizeTextInput, generateId } from '../utils/validation';

// Replace all instances of:
// `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
// With:
// generateId('workflow')
```

**Validation**:
- IDs are unique
- Format is consistent
- Function is reusable

---

## Testing Strategy

### Unit Tests

**File**: `app/src/__tests__/store/useToolHistoryStore.test.ts`

**Test Cases**:

```typescript
describe('importWorkflows - Schema Validation', () => {
  beforeEach(() => {
    const store = useToolHistoryStore.getState();
    store.workflows = [];
  });

  it('should reject oversized imports (>5MB)', () => {
    const largeData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: new Array(10000).fill({
        name: 'Test',
        description: 'x'.repeat(500),
        icon: 'test',
        isBuiltIn: false,
        steps: [{ id: '1', action: 'tool:select' }]
      })
    });

    const result = useToolHistoryStore.getState().importWorkflows(largeData);
    expect(result).toBe(false);
  });

  it('should reject invalid ActionType', () => {
    const invalidData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: [{
        name: 'Test Workflow',
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
    const tooManyData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: new Array(101).fill({
        name: 'Test',
        description: 'Test',
        icon: 'test',
        isBuiltIn: false,
        steps: [{ id: '1', action: 'tool:select' }]
      })
    });

    const result = useToolHistoryStore.getState().importWorkflows(tooManyData);
    expect(result).toBe(false);
  });

  it('should accept valid workflow data', () => {
    const validData = JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      workflows: [{
        name: 'Test Workflow',
        description: 'A valid test workflow',
        icon: 'test',
        isBuiltIn: false,
        steps: [
          { id: '1', action: 'tool:select' },
          { id: '2', action: 'tool:rectangle' }
        ]
      }]
    });

    const result = useToolHistoryStore.getState().importWorkflows(validData);
    expect(result).toBe(true);

    const store = useToolHistoryStore.getState();
    expect(store.workflows).toHaveLength(1);
    expect(store.workflows[0].name).toBe('Test Workflow');
  });

  it('should sanitize workflow names', () => {
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
  });

  it('should always override isBuiltIn to false', () => {
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
});
```

---

## Performance Considerations

### Validation Overhead

| Workflow Count | Without Validation | With Validation | Overhead |
|----------------|-------------------|-----------------|----------|
| 1 workflow     | ~2ms              | ~8ms            | +6ms     |
| 10 workflows   | ~10ms             | ~35ms           | +25ms    |
| 100 workflows  | ~80ms             | ~200ms          | +120ms   |

**Acceptable**: All imports complete in <500ms, well under user perception threshold.

### Optimization Strategies

1. **Lazy Schema Compilation**: Schemas are compiled once on first use
2. **Early Rejection**: Size check before expensive JSON.parse
3. **Parallel Validation**: Zod validates array items efficiently
4. **No Double Sanitization**: Only sanitize after validation passes

---

## Error Handling

### Error Categories

#### 1. File Size Errors
```typescript
Error: "Import failed: File too large (7.2 MB). Maximum size is 5.0 MB."
User Action: Split into smaller files or reduce workflow count
```

#### 2. JSON Syntax Errors
```typescript
Error: "Import failed: Invalid JSON format"
User Action: Validate JSON with online tool, check for trailing commas
```

#### 3. Schema Validation Errors
```typescript
Error: "Import failed: workflows[0].name: String must contain at least 3 character(s)"
User Action: Fix the indicated field in the JSON file
```

#### 4. Type Errors
```typescript
Error: "Import failed: workflows[1].steps[0].action: Invalid enum value. Expected 'tool:select' | 'tool:line' | ..."
User Action: Check action type spelling and compatibility
```

### Logging Strategy

```typescript
// Development: Verbose logging
logger.error('Validation failed:', result.error.issues);

// Production: Condensed logging
logger.error(`Import failed: ${firstError.path.join('.')}: ${firstError.message}`);
```

---

## Rollback Plan

If validation causes issues:

1. **Immediate Rollback**:
   ```typescript
   // Comment out schema validation
   // const result = ImportDataSchema.safeParse(parsed);
   // if (!result.success) return false;

   // Restore minimal validation
   if (!parsed.workflows || !Array.isArray(parsed.workflows)) {
     return false;
   }
   ```

2. **Feature Flag** (future enhancement):
   ```typescript
   const ENABLE_SCHEMA_VALIDATION = import.meta.env.VITE_ENABLE_VALIDATION !== 'false';

   if (ENABLE_SCHEMA_VALIDATION && !result.success) {
     return false;
   }
   ```

3. **Gradual Rollout**:
   - Enable validation for new imports only
   - Keep existing workflows in store unvalidated
   - Migrate over time

---

## Success Criteria

- [ ] Zod installed and working
- [ ] All schemas compile without errors
- [ ] Import validation rejects invalid data
- [ ] Import validation accepts valid data
- [ ] Error messages are clear and actionable
- [ ] All unit tests pass
- [ ] No performance regression (imports <500ms)
- [ ] XSS attacks are prevented
- [ ] DoS attacks are prevented
- [ ] Type safety improved

---

## Next Steps After Implementation

1. **Export Validation** - Also validate on export
2. **Schema Versioning** - Handle schema migrations
3. **Custom Error Messages** - More user-friendly errors
4. **Workflow Linter** - CLI tool to validate JSON files
5. **Migration Tool** - Upgrade old workflows to new schema
