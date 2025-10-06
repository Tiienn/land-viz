# Spec 011: Workflow Schema Validation

**Status**: 🟡 Draft
**Priority**: High
**Category**: Security, Data Integrity
**Created**: 2025-10-05
**Updated**: 2025-10-05

---

## Executive Summary

Implement comprehensive schema validation for workflow import/export functionality to prevent security vulnerabilities, data corruption, and runtime errors caused by malformed or malicious workflow data.

**Problem**: Currently, `useToolHistoryStore.importWorkflows()` only validates that the imported data contains a `workflows` array, with no validation of workflow structure, data types, or content. This creates multiple security and reliability risks.

**Solution**: Add Zod-based schema validation with size limits, type checking, and comprehensive error handling to ensure all imported workflows conform to expected structure before being added to the store.

---

## Background

### Current State

The workflow import function (line 466-495 in `useToolHistoryStore.ts`) has minimal validation:

```typescript
importWorkflows: (data: string) => {
  try {
    const parsed = JSON.parse(data);

    // ❌ ONLY validates array existence
    if (!parsed.workflows || !Array.isArray(parsed.workflows)) {
      console.error('Invalid workflow data format');
      return false;
    }

    // ❌ No validation of workflow properties
    // ❌ No type checking
    // ❌ No size limits
    set((state) => {
      const newWorkflows = parsed.workflows.map((w: any) => ({ // ❌ any type
        ...w,
        id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isBuiltIn: false,
        createdAt: Date.now(),
      }));
      // ...
    });
  }
}
```

### Security Vulnerabilities

1. **XSS Injection**: Malicious workflow names/descriptions could execute scripts
2. **Type Confusion**: Invalid data types could cause runtime crashes
3. **DoS Attack**: Massive JSON files could freeze the browser
4. **Data Corruption**: Missing required fields cause undefined behavior
5. **Circular References**: Could hang JSON.parse or create memory leaks

### Real-World Attack Scenarios

**Scenario 1: XSS via Workflow Name**
```json
{
  "workflows": [{
    "name": "<img src=x onerror='alert(document.cookie)'>",
    "description": "Steals cookies when rendered"
  }]
}
```

**Scenario 2: DoS via Large Payload**
```json
{
  "workflows": [/* 1 million workflows */]
}
```

**Scenario 3: Type Confusion**
```json
{
  "workflows": [{
    "steps": "not-an-array", // Runtime error when mapping
    "icon": { "malicious": "object" } // Type mismatch
  }]
}
```

---

## Requirements

### Functional Requirements

#### FR-1: Schema Validation
- **MUST** validate all workflow properties against strict schema
- **MUST** reject imports that fail validation
- **MUST** provide clear error messages for validation failures
- **MUST** validate nested structures (steps, prompts, validations)

#### FR-2: Security Controls
- **MUST** enforce file size limits (max 5MB)
- **MUST** enforce workflow count limits (max 100 workflows per import)
- **MUST** enforce string length limits (names, descriptions)
- **MUST** validate ActionType enums match allowed values

#### FR-3: Type Safety
- **MUST** validate all data types before store mutation
- **MUST** reject workflows with invalid ActionTypes
- **MUST** validate step parameters are valid objects
- **MUST** ensure all required fields are present

#### FR-4: Error Handling
- **MUST** log validation errors with details
- **MUST** return false on validation failure
- **MUST** not mutate store state on validation failure
- **MUST** provide user-friendly error messages

### Non-Functional Requirements

#### NFR-1: Performance
- **MUST** validate large imports within 500ms
- **MUST** not block UI during validation
- **SHOULD** provide progress feedback for large imports

#### NFR-2: Maintainability
- **MUST** use declarative schema definitions
- **MUST** be extensible for future workflow fields
- **SHOULD** co-locate schema with type definitions

#### NFR-3: Developer Experience
- **MUST** provide TypeScript type inference from schemas
- **MUST** provide detailed validation error messages
- **SHOULD** include examples of valid workflow data

---

## User Stories

### US-1: Secure Import
**As a** user
**I want** workflow imports to be validated for security
**So that** I'm protected from malicious or corrupted workflow files

**Acceptance Criteria:**
- [ ] Malicious workflow names are rejected
- [ ] Oversized files are rejected with clear error
- [ ] Invalid workflow structures show helpful error messages
- [ ] Import succeeds only with 100% valid data

### US-2: Data Integrity
**As a** developer
**I want** strict type checking on imported workflows
**So that** runtime errors from bad data are impossible

**Acceptance Criteria:**
- [ ] All ActionTypes are validated against enum
- [ ] All nested objects match expected structure
- [ ] Missing required fields cause validation failure
- [ ] Type mismatches are caught before store mutation

### US-3: Clear Error Messages
**As a** user
**I want** clear explanations when imports fail
**So that** I can fix the issue or report the problem

**Acceptance Criteria:**
- [ ] Error messages indicate which workflow failed
- [ ] Error messages explain what validation rule was violated
- [ ] Error messages are logged for debugging
- [ ] User sees friendly alert with actionable message

---

## Technical Specification

### Data Model

#### Validated Types

```typescript
// All ActionTypes that can appear in workflows
type ValidActionType =
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
```

#### Workflow Schema Structure

```typescript
WorkflowStep {
  id: string (required)
  action: ValidActionType (required)
  params?: Record<string, any>
  prompt?: {
    message: string (max 200 chars)
    type: 'number' | 'text' | 'select'
    options?: string[] (max 50 items)
    defaultValue?: any
  }
  validation?: {
    requiresSelection?: boolean
    requiresShape?: boolean
  }
}

Workflow {
  name: string (min 3, max 100 chars)
  description: string (max 500 chars)
  icon: string (max 50 chars)
  isBuiltIn: boolean
  steps: WorkflowStep[] (min 1, max 50 steps)
}

ImportData {
  version: string
  exportedAt: number (timestamp)
  workflows: Workflow[] (max 100 workflows)
}
```

### Validation Rules

#### Size Limits
- **File size**: Max 5MB (prevents DoS)
- **Workflow count**: Max 100 per import
- **Steps per workflow**: Max 50 steps
- **String lengths**:
  - Name: 3-100 characters
  - Description: 0-500 characters
  - Icon: 0-50 characters
  - Prompt message: 0-200 characters

#### Type Validation
- **action**: Must be in ValidActionType enum
- **params**: Must be object or undefined
- **prompt.type**: Must be 'number', 'text', or 'select'
- **steps**: Must be non-empty array

#### Content Validation
- **Names**: No HTML tags (sanitized)
- **Descriptions**: No script tags (sanitized)
- **ActionTypes**: Must exist in current application version

---

## Dependencies

### New Dependencies
- **zod** (^3.22.0) - Schema validation library
  - Zero dependencies
  - TypeScript-first
  - 13KB gzipped
  - Tree-shakeable

### Modified Files
- `app/package.json` - Add zod dependency
- `app/src/store/useToolHistoryStore.ts` - Add validation
- `app/src/types/index.ts` - Export ActionType array
- `app/src/utils/validation.ts` - Already has sanitization functions

### New Files
- `app/src/schemas/workflowSchema.ts` - Zod schemas

---

## Edge Cases

### EC-1: Empty Workflows Array
**Input**: `{ workflows: [] }`
**Expected**: Reject with error "No workflows to import"

### EC-2: Missing Required Fields
**Input**: Workflow missing `name` field
**Expected**: Reject with error "Workflow name is required"

### EC-3: Invalid ActionType
**Input**: `{ action: 'tool:invalid' }`
**Expected**: Reject with error "Invalid action type: tool:invalid"

### EC-4: Circular Reference
**Input**: Workflow with circular object reference
**Expected**: JSON.parse fails, caught by try/catch

### EC-5: Unicode/Emoji in Names
**Input**: `{ name: "🚀 My Workflow" }`
**Expected**: Accept (valid UTF-8)

### EC-6: Extremely Long Description
**Input**: Description with 10,000 characters
**Expected**: Reject with error "Description too long (max 500)"

### EC-7: Built-in Workflow Import
**Input**: Workflow with `isBuiltIn: true`
**Expected**: Override to `false` (security measure)

### EC-8: Duplicate Workflow IDs
**Input**: Two workflows with same ID
**Expected**: Accept (new IDs generated)

---

## UI/UX Requirements

### Import Success
```
✅ Successfully imported 3 workflows
```

### Import Failure - Size Limit
```
❌ Import failed: File too large (7.2MB). Maximum size is 5MB.
```

### Import Failure - Invalid Schema
```
❌ Import failed: Workflow "My Workflow" has invalid action type "tool:invalid"

Expected one of: select, line, rectangle, circle, polyline, measure, rotate
```

### Import Failure - Missing Field
```
❌ Import failed: Workflow at index 2 is missing required field "name"
```

---

## Testing Requirements

### Unit Tests Required

1. **Valid workflow import** - Should succeed
2. **Oversized file** - Should reject
3. **Invalid ActionType** - Should reject
4. **Missing required fields** - Should reject
5. **Too many workflows** - Should reject (>100)
6. **Too many steps** - Should reject (>50)
7. **String length violations** - Should reject
8. **Malicious HTML in names** - Should sanitize
9. **Empty workflows array** - Should reject
10. **Valid minimal workflow** - Should succeed

### Integration Tests Required

1. **Export then import** - Round-trip should preserve data
2. **Import multiple times** - Should not create duplicates
3. **Import with recording active** - Should not interfere

---

## Security Considerations

### Threat Model

| Threat | Mitigation |
|--------|------------|
| XSS via workflow names | Sanitize all strings before storage |
| DoS via large files | Enforce 5MB size limit |
| Type confusion attacks | Validate all types with Zod |
| Circular reference DoS | Let JSON.parse fail naturally |
| localStorage overflow | Limit workflow count to 100 |

### Security Checklist
- [ ] File size checked before JSON.parse
- [ ] All strings sanitized before storage
- [ ] ActionTypes validated against whitelist
- [ ] Built-in flag always forced to false on import
- [ ] Workflow count limited to prevent storage overflow

---

## Performance Impact

### Before Validation
- Import time: ~10ms for 10 workflows
- Memory: Unbounded
- Risk: High (crashes, XSS, DoS)

### After Validation
- Import time: ~50-100ms for 10 workflows (5-10x slower)
- Memory: Bounded (5MB max)
- Risk: Low (validated, sanitized)

**Trade-off**: Small performance cost for significant security gain.

---

## Rollout Plan

### Phase 1: Schema Definition (1 hour)
- Install Zod dependency
- Create workflow schemas
- Define validation rules

### Phase 2: Import Validation (1 hour)
- Add size check before parse
- Add schema validation
- Update error handling

### Phase 3: Testing (1 hour)
- Write unit tests
- Test edge cases
- Verify error messages

### Phase 4: Documentation (30 min)
- Update README with validation rules
- Document error messages
- Add migration guide

---

## Success Metrics

- [ ] 100% of imports are validated
- [ ] Zero XSS vulnerabilities in workflow data
- [ ] Zero runtime errors from malformed workflows
- [ ] Clear error messages for all validation failures
- [ ] Import time < 500ms for 100 workflows

---

## Open Questions

**Q1**: Should we validate `params` object structure?
**A**: Not initially - params are workflow-specific. Future enhancement.

**Q2**: Should we support schema versioning for backwards compatibility?
**A**: Not initially - all imports forced to current schema. Future enhancement.

**Q3**: Should we allow importing built-in workflows?
**A**: No - always override `isBuiltIn` to false for security.

---

## References

- [Zod Documentation](https://zod.dev)
- [OWASP: Input Validation](https://owasp.org/www-project-proactive-controls/v3/en/c5-validate-inputs)
- Code Review Report (2025-10-05) - Priority Item #6
- `useToolHistoryStore.ts` lines 466-495 (current implementation)
