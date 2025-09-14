---
type: command
title: Execute Strategy
slug: execute
description: Implement the planned strategy with testing after each code block
argument-hint: strategy description or implementation plan
---

# Execute Strategy

Implement the strategy: $ARGUMENTS

## Implementation Rules

1. **Think hard** about the best implementation approach
2. Write **elegant, clean code** that solves the problem
3. **No backward compatibility** unless explicitly requested
4. **No Playwright MCP tools**

## Testing Cycle

After **EVERY** code block:
1. Run lint: `npm run lint`
2. Run compile: `npm run build` 
3. Write corresponding tests
4. Run tests: `npm test`
5. Fix any issues before proceeding

## Process

1. **Implement solution**
   - Write focused, elegant code
   - One feature per code block
   
2. **Verify quality**
   - Lint passes
   - Build succeeds
   - Tests pass
   
3. **Move to next block**
   - Only after all checks pass

**Important**: Complete the testing cycle for each code block before writing the next one.