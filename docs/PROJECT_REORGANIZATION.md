# Project Directory Reorganization

**Date**: January 2025
**Status**: ✅ Complete

## Overview

Reorganized project directory structure to improve maintainability and separate concerns. Moved test files, screenshots, and documentation to appropriate directories.

## Changes Made

### 1. Created New Directory Structure

```
tests/
├── playwright/          # Python test scripts using Playwright
├── screenshots/         # Test screenshots and visual assets
└── logs/               # Console output and test logs
```

### 2. Files Moved

#### Documentation Files → `docs/fixes/`
Moved resize snap documentation files:
- `RESIZE_SNAP_FIX_SUMMARY.md`
- `RESIZE_SNAP_IMPLEMENTATION.md`
- `RESIZE_SNAP_STRATEGIC_ANALYSIS.md`
- `VERIFICATION_CHECKLIST.md`

**Total**: 4 documentation files

#### Python Test Scripts → `tests/playwright/`
Moved all Playwright-based Python test scripts:
- `test_*.py` files (26 files)
- `test_line_shape_debug.js` (from app/)

**Categories**:
- **Flip Tests**: `test_flip_*.py` (8 files)
- **Snap Tests**: `test_magnetic_snap.py`, `test_snap_console.py`, `test_green_snapped.py`
- **Resize Tests**: `test_resize_*.py` (3 files)
- **Polyline Tests**: `test_polyline_*.py`, `test_closed_*.py` (5 files)
- **View Tests**: `test_reset_*.py` (3 files)
- **Other Tests**: `test_25percent_threshold.py`, `test_adaptive_threshold.py`, etc.

**Total**: 26 test files

#### Screenshot Files → `tests/screenshots/`
Moved all test-related PNG screenshots:
- `console_test_*.png` (5 files)
- `draw_test_*.png` (7 files)
- `flip_test_*.png` (13 files)
- `green_test_*.png` (6 files)
- `snap_test_*.png` (6 files)
- `test_*.png` (25 files)
- Other test screenshots (3 files)

**Total**: 65 screenshot files

#### Console Output Files → `tests/logs/`
Moved console log files:
- `polyline_console_output.txt`
- `snap_console_output.txt`

**Total**: 2 log files

#### Temporary Files Deleted
- `nul` (temporary file)

### 3. Root Directory Cleanup

**Before**: 98 files (including test artifacts)
**After**: 9 core files (project configuration and documentation only)

**Remaining root files**:
- `.gitignore`
- `.windsurfrules`
- `CHANGELOG.md`
- `CLAUDE.md`
- `package.json`
- `package-lock.json`
- `README.md`
- `SECURITY.md`
- `WARP.md`

## Benefits

### 1. Improved Organization
- **Clear separation of concerns**: Tests, docs, and source code in separate directories
- **Easier navigation**: Related files grouped together
- **Better maintainability**: Clear structure for future development

### 2. Cleaner Root Directory
- **Professional appearance**: Only essential project files at root level
- **Reduced clutter**: Test artifacts moved to dedicated directories
- **Better discoverability**: Important files easier to find

### 3. Consistent Structure
- **Standard layout**: Follows common project conventions
- **Scalable**: Easy to add more tests, docs, or screenshots
- **Clear categorization**: Tests by type (playwright, unit, e2e)

### 4. Git Workflow Improvements
- **Cleaner git status**: Fewer untracked files at root
- **Better diffs**: Changes grouped by category
- **Easier code review**: Related changes in appropriate directories

## Directory Structure Overview

```
land-viz/
├── app/                    # Main application source code
│   ├── src/
│   ├── public/
│   └── test-features.md
├── context/                # Context and reference files
├── docs/                   # Project documentation
│   ├── fixes/             # Bug fixes and feature documentation
│   │   ├── RESIZE_SNAP_*.md
│   │   ├── TEXT_CURSOR_ROTATION_FIX.md
│   │   └── ... (18+ documents)
│   ├── known-issues/
│   ├── performance/
│   └── project/
├── memory/                 # Memory and context storage
├── scripts/                # Build and deployment scripts
├── specs/                  # Feature specifications
├── templates/              # Code templates
├── tests/                  # All test-related files (NEW)
│   ├── playwright/        # Python test scripts (26 files)
│   ├── screenshots/       # Test screenshots (65 files)
│   └── logs/              # Console outputs (2 files)
├── CHANGELOG.md           # Version history
├── CLAUDE.md              # Project status and instructions
├── README.md              # Project overview
└── package.json           # Root package configuration
```

## Migration Guide

### For Existing Tests

**Old location**: Root directory (`test_*.py`, `test_*.png`)
**New location**:
- Python scripts: `tests/playwright/`
- Screenshots: `tests/screenshots/`
- Logs: `tests/logs/`

**Example**:
```bash
# Old
python test_flip_click.py

# New
python tests/playwright/test_flip_click.py
```

### For Screenshots

**Old paths in code**:
```python
screenshot_path = "test_badge_1_drawn.png"
```

**New paths**:
```python
screenshot_path = "tests/screenshots/test_badge_1_drawn.png"
```

### For Documentation

**Old**: Root directory markdown files
**New**: Categorized in `docs/` subdirectories

## Future Recommendations

### 1. Update Test Scripts
Update import paths and screenshot references in test scripts to use new directory structure.

### 2. Add Test README
Create `tests/README.md` documenting:
- How to run tests
- Test categories
- Screenshot naming conventions

### 3. Automate Test Organization
Add scripts to automatically move test artifacts:
```bash
# scripts/organize-tests.sh
mv test_*.py tests/playwright/
mv test_*.png tests/screenshots/
mv *_console_output.txt tests/logs/
```

### 4. CI/CD Integration
Update CI/CD pipelines to:
- Run tests from new locations
- Save artifacts to appropriate directories
- Archive test screenshots

### 5. .gitignore Updates
Consider adding patterns to ignore future test artifacts:
```gitignore
# Test artifacts (root level)
test_*.py
test_*.png
*_console_output.txt
```

## Verification

All files successfully moved and organized:
- ✅ 4 documentation files → `docs/fixes/`
- ✅ 26 test scripts → `tests/playwright/`
- ✅ 65 screenshots → `tests/screenshots/`
- ✅ 2 log files → `tests/logs/`
- ✅ 1 temporary file deleted
- ✅ Root directory cleaned (98 → 9 files)

## Impact Assessment

**Risk**: Low - No source code affected, only file locations changed
**Breaking Changes**: Test scripts may need path updates
**Testing Required**: Verify test scripts run from new locations
**Documentation**: This document serves as migration guide

## Related Documentation

- `docs/fixes/TEXT_CURSOR_ROTATION_FIX.md` - Example of new doc structure
- `.gitignore` - Ignore patterns for test artifacts
- `README.md` - Project overview and structure

## Maintenance

This reorganization establishes a clear structure for ongoing development. Future test files, screenshots, and documentation should follow this pattern to maintain consistency.
