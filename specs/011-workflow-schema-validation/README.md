# Spec 011: Workflow Schema Validation

**Status**: 🟡 Ready for Implementation
**Priority**: High (Security)
**Estimated Time**: 2-3 hours
**Risk**: Low

---

## Quick Summary

Add Zod-based schema validation to workflow imports to prevent security vulnerabilities (XSS, DoS) and data corruption.

**Problem**: Current import only checks if `workflows` is an array - no type checking, no size limits, no validation.

**Solution**: Comprehensive Zod validation with:
- ✅ File size limits (5MB max)
- ✅ Type validation (ActionTypes, objects, arrays)
- ✅ String length limits (names, descriptions)
- ✅ Workflow count limits (100 max)
- ✅ XSS protection (sanitization)
- ✅ Clear error messages

---

## What You Get

### Security Improvements
- **XSS Prevention**: Malicious workflow names are sanitized
- **DoS Prevention**: File size and count limits enforced
- **Type Safety**: All data validated before store mutation
- **No Runtime Crashes**: Invalid data rejected at import

### Developer Experience
- **TypeScript Inference**: Validated types automatically inferred
- **Clear Errors**: Detailed validation error messages
- **Maintainable**: Declarative schemas easy to update

---

## Files to Create/Modify

### New Files (1)
- `app/src/schemas/workflowSchema.ts` (~150 lines)

### Modified Files (3)
- `app/package.json` - Add `zod` dependency
- `app/src/store/useToolHistoryStore.ts` - Add validation (lines 465-495)
- `app/src/types/index.ts` - Export `VALID_ACTION_TYPES` array
- `app/src/utils/validation.ts` - Add `generateId()` and `formatBytes()`

### Test Files (1)
- `app/src/__tests__/store/useToolHistoryStore.validation.test.ts` (new)

---

## Implementation Steps

1. **Install Zod** (5 min)
   ```bash
   npm install zod@^3.22.0
   ```

2. **Create Schemas** (45 min)
   - Define WorkflowStep schema
   - Define Workflow schema
   - Define ImportData schema

3. **Update Types** (10 min)
   - Export VALID_ACTION_TYPES array

4. **Add Utilities** (15 min)
   - generateId() function
   - formatBytes() function

5. **Update Import Function** (45 min)
   - Add size check
   - Add schema validation
   - Improve error handling

6. **Write Tests** (45 min)
   - Positive tests (valid data)
   - Negative tests (invalid data)

7. **Documentation** (30 min)
   - Update CLAUDE.md
   - Add JSDoc comments

**Total**: 2 hours 45 minutes

---

## Testing Checklist

**Valid Imports** ✅
- [x] Valid workflow with all fields
- [x] Workflow with optional fields omitted
- [x] Multiple workflows in one file

**Invalid Imports** ❌
- [x] File >5MB (rejected)
- [x] Invalid ActionType (rejected)
- [x] Missing required field (rejected)
- [x] Name too short <3 chars (rejected)
- [x] Name too long >100 chars (rejected)
- [x] >100 workflows (rejected)
- [x] >50 steps (rejected)
- [x] XSS attempt in name (sanitized)

---

## Success Metrics

- ✅ 100% of imports validated
- ✅ Zero XSS vulnerabilities
- ✅ Zero runtime errors from bad data
- ✅ Clear error messages
- ✅ Import time <500ms for 100 workflows
- ✅ Bundle size increase <15KB

---

## Next Steps

Ready to implement? Start with:

```bash
# 1. Read the spec
cat specs/011-workflow-schema-validation/spec.md

# 2. Review implementation plan
cat specs/011-workflow-schema-validation/plan.md

# 3. Follow task checklist
cat specs/011-workflow-schema-validation/tasks.md

# 4. Begin implementation
cd app
npm install zod@^3.22.0
```

Or use the `/execute` command:
```
/execute specs/011-workflow-schema-validation/plan.md
```

---

## Documents

- **[spec.md](./spec.md)** - Full feature specification with requirements
- **[plan.md](./plan.md)** - Technical implementation plan with architecture
- **[tasks.md](./tasks.md)** - Step-by-step task breakdown with code examples

---

## Questions?

**Q: Will this break existing workflows?**
A: No - existing workflows in the store are unaffected. Only new imports are validated.

**Q: Can I still export workflows?**
A: Yes - export is unchanged. Only import has added validation.

**Q: What if I have a workflow that fails validation?**
A: Fix the workflow JSON file to meet requirements, or contact support.

**Q: Will this slow down imports?**
A: Minimal - adds ~50-100ms for 10 workflows, well under user perception.

---

**Ready to implement?** Follow the tasks in `tasks.md` for step-by-step guidance.
