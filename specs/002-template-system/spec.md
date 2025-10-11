# Feature Specification: Template System
**Spec ID:** 002
**Status:** Draft
**Created:** October 2025
**Last Updated:** October 2025
**Owner:** Development Team

---

## 1. Overview

### 1.1 Feature Summary
A comprehensive template system that allows users to save, load, and share pre-configured property layouts, dramatically reducing the time-to-first-drawing from 5 minutes to 10 seconds.

### 1.2 Problem Statement
**Current Pain Points:**
- New users face a blank canvas with no guidance
- Users repeatedly create similar property layouts from scratch
- No way to save frequently used configurations
- Learning curve prevents quick productivity

**User Quotes:**
> "I draw the same residential lot every day - wish I could save it as a template"
> "It takes me 5 minutes to set up before I can start working"
> "I'd love to start with an example and modify it"

### 1.3 Success Metrics
- **Adoption Rate:** 60% of users use at least 1 template within first session
- **Time-to-First-Drawing:** Reduced from 5 minutes to <10 seconds
- **User Retention:** 30% increase in day-2 retention
- **Template Usage:** Average 2.5 templates used per user per week

### 1.4 User Stories

**As a real estate agent**, I want to save my standard residential lot template so I can quickly create property visualizations for clients.

**As a landscape architect**, I want to load pre-made templates for common property types so I can focus on customization rather than basic setup.

**As a land surveyor**, I want to share my custom templates with team members so we maintain consistency across projects.

**As a new user**, I want to explore example templates so I can learn the tool's capabilities without starting from scratch.

**As a developer**, I want to save my subdivision layout template so I can reuse it across multiple projects.

---

## 2. Functional Requirements

### 2.1 Core Features

#### F1: Template Creation
- **F1.1** User can save current drawing state as a new template
- **F1.2** User provides template name, description, and category
- **F1.3** System automatically generates thumbnail preview
- **F1.4** User can add custom tags for searchability
- **F1.5** Template captures: shapes, layers, grid settings, default unit

#### F2: Template Gallery
- **F2.1** Display built-in templates (5 starter templates)
- **F2.2** Display user-created templates
- **F2.3** Category tabs: Residential, Commercial, Agricultural, Industrial, Custom
- **F2.4** Search functionality by name, description, or tags
- **F2.5** Grid view with thumbnail previews
- **F2.6** Template details on hover: name, description, author, creation date

#### F3: Template Loading
- **F3.1** One-click template loading from gallery
- **F3.2** Confirmation dialog if current drawing has unsaved changes
- **F3.3** Template loads all shapes, layers, and settings
- **F3.4** Undo/redo support for template loading
- **F3.5** Template appears in recent templates list

#### F4: Template Management
- **F4.1** Edit template metadata (name, description, category, tags)
- **F4.2** Update template with current drawing state
- **F4.3** Delete user templates (with confirmation)
- **F4.4** Duplicate template for variations
- **F4.5** Mark templates as favorites

#### F5: Template Import/Export
- **F5.1** Export template as JSON file
- **F5.2** Import template from JSON file
- **F5.3** Batch import multiple templates
- **F5.4** Validation of imported template format
- **F5.5** Error handling for corrupted files

#### F6: Built-in Templates
- **F6.1** Residential Standard Lot (25m × 40m)
- **F6.2** Corner Lot with Setbacks (30m × 35m)
- **F6.3** Commercial Parking Layout (50m × 80m)
- **F6.4** Farm Property (200m × 300m)
- **F6.5** Subdivision Block (100m × 150m)

### 2.2 Non-Functional Requirements

#### Performance
- **NFR-P1:** Template gallery loads <500ms
- **NFR-P2:** Template loading completes <1 second
- **NFR-P3:** Search results update <100ms
- **NFR-P4:** Support 100+ templates without performance degradation

#### Storage
- **NFR-S1:** Templates stored locally using IndexedDB
- **NFR-S2:** Each template <2MB storage
- **NFR-S3:** Total template storage quota: 50MB
- **NFR-S4:** Automatic cleanup of oldest templates if quota exceeded

#### Usability
- **NFR-U1:** Template gallery accessible via main toolbar
- **NFR-U2:** Clear visual hierarchy in gallery
- **NFR-U3:** Keyboard shortcuts for quick access (Ctrl+Shift+T)
- **NFR-U4:** Mobile-responsive template selection

#### Reliability
- **NFR-R1:** Template saves are atomic (all or nothing)
- **NFR-R2:** Automatic backup of templates to localStorage fallback
- **NFR-R3:** Graceful degradation if IndexedDB unavailable
- **NFR-R4:** Template validation on load prevents corruption

---

## 3. User Interface Requirements

### 3.1 Template Gallery Modal

**Location:** Triggered by toolbar button "Templates" or Ctrl+Shift+T

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Templates                                    [×]    │
├─────────────────────────────────────────────────────┤
│  [🔍 Search templates...]                           │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ [Built-in] [My Templates] [Favorites]        │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Residential                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │[IMG] │ │[IMG] │ │[IMG] │ │[IMG] │              │
│  │25×40m│ │Corner│ │Narrow│ │Large │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                      │
│  Commercial                                          │
│  ┌──────┐ ┌──────┐                                 │
│  │[IMG] │ │[IMG] │                                 │
│  │Retail│ │Office│                                 │
│  └──────┘ └──────┘                                 │
│                                                      │
│  [+ Create New Template]                            │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Click thumbnail → Load template (with unsaved changes confirmation)
- Right-click template → Context menu (Edit, Duplicate, Delete, Export)
- Hover thumbnail → Show detailed info tooltip
- Drag & drop → Reorder templates (user templates only)

### 3.2 Save Template Dialog

**Trigger:** "Save as Template" button in toolbar

**Fields:**
- **Name** (required, max 50 chars)
- **Description** (optional, max 200 chars)
- **Category** (dropdown: Residential, Commercial, Agricultural, Industrial, Custom)
- **Tags** (comma-separated, max 5 tags)
- **Preview** (auto-generated thumbnail, 200×150px)

**Actions:**
- [Save] - Creates template
- [Cancel] - Closes dialog

### 3.3 Template Card Component

**Design:**
```
┌──────────────────┐
│                  │
│   [Thumbnail]    │  ← 200×150px preview
│                  │
├──────────────────┤
│ Template Name    │  ← Bold, 14px
│ Category         │  ← Gray, 12px
│ ⭐ 24 · 👤 You   │  ← Uses count & author
└──────────────────┘
```

**States:**
- Default: White background, subtle border
- Hover: Light blue background, scale(1.02)
- Active: Blue border, scale(1.02)
- Loading: Skeleton loading animation

### 3.4 Toolbar Integration

**New Button:** "Templates" icon next to existing tools
- **Icon:** 📄 (template/document icon)
- **Tooltip:** "Load Template (Ctrl+Shift+T)"
- **Position:** Between "Export" and "Settings"

---

## 4. Data Requirements

### 4.1 Template Data Structure

```typescript
interface PropertyTemplate {
  // Identity
  id: string;                    // UUID
  name: string;                  // User-provided name
  description: string;           // Optional description
  category: TemplateCategory;    // Classification

  // Metadata
  author: string;                // "Built-in" or "User"
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last modification
  version: number;               // Template version (for migration)

  // Discovery
  tags: string[];                // Searchable tags
  thumbnail: string;             // Base64 PNG or data URL
  usageCount: number;            // Times loaded

  // Drawing Data
  data: {
    shapes: Shape[];             // All shapes with positions/sizes
    layers: Layer[];             // Layer configuration
    metadata: {
      defaultUnit: UnitType;     // Preferred unit
      gridSize: number;          // Grid snap size
      bounds: {
        width: number;
        height: number;
      };
    };
  };
}

type TemplateCategory =
  | 'residential'
  | 'commercial'
  | 'agricultural'
  | 'industrial'
  | 'custom';
```

### 4.2 Storage Schema

**IndexedDB Database:** `land-visualizer`
**Object Store:** `templates`
**Key Path:** `id`
**Indexes:**
- `category` (non-unique)
- `author` (non-unique)
- `createdAt` (non-unique)
- `tags` (multiEntry, non-unique)

### 4.3 Built-in Template Data

See `plan.md` Section 3.2 for complete built-in template definitions.

---

## 5. Acceptance Criteria

### AC1: Template Creation
- [ ] User can save current drawing as template
- [ ] All form fields validate correctly
- [ ] Thumbnail auto-generates from current view
- [ ] Template appears in "My Templates" immediately
- [ ] Duplicate names show warning

### AC2: Template Gallery
- [ ] Gallery opens via toolbar or Ctrl+Shift+T
- [ ] All built-in templates display correctly
- [ ] Category tabs filter templates
- [ ] Search works on name, description, tags
- [ ] Mobile view shows 1 column, desktop shows 3-4 columns

### AC3: Template Loading
- [ ] Click template → loads in <1 second
- [ ] Confirmation shown if current drawing unsaved
- [ ] All shapes render correctly
- [ ] Layers maintain proper configuration
- [ ] Grid settings restore correctly
- [ ] Undo reverts template load

### AC4: Template Management
- [ ] Edit metadata via context menu
- [ ] Delete requires confirmation
- [ ] Duplicate creates copy with " (Copy)" suffix
- [ ] Favorite toggle works instantly

### AC5: Import/Export
- [ ] Export generates valid JSON file
- [ ] Import validates file format
- [ ] Invalid files show clear error message
- [ ] Batch import processes all valid files

### AC6: Error Handling
- [ ] Storage quota exceeded shows clear message
- [ ] Corrupted templates skip gracefully
- [ ] Network offline doesn't break functionality
- [ ] Unsupported browser shows fallback message

---

## 6. Edge Cases & Ambiguities

### Edge Cases

**EC1: Empty Drawing Save**
- **Scenario:** User tries to save template with no shapes
- **Handling:** Show warning "Template must contain at least 1 shape"

**EC2: Identical Template Names**
- **Scenario:** User saves template with existing name
- **Handling:** Append " (2)", " (3)", etc. automatically

**EC3: Storage Quota Exceeded**
- **Scenario:** User hits 50MB storage limit
- **Handling:**
  1. Show quota warning
  2. Offer to delete oldest templates
  3. Prevent save until space freed

**EC4: Large Templates (>100 shapes)**
- **Scenario:** Template contains complex subdivision with 200+ shapes
- **Handling:**
  1. Show loading spinner during save/load
  2. Optimize thumbnail generation (render subset)
  3. Consider template size warning

**EC5: Template with Deleted Layers**
- **Scenario:** Template references layers that no longer exist
- **Handling:** Create missing layers automatically on load

**EC6: Version Migration**
- **Scenario:** Old template format loaded in new app version
- **Handling:**
  1. Detect version mismatch
  2. Run migration function
  3. Update version number
  4. Save migrated template

### Ambiguities

**AMBIGUITY-1:** Should templates store camera position/zoom?
- **Options:**
  A. Yes - Restore exact view user saved
  B. No - Auto-fit template to viewport
- **Recommendation:** Option B (auto-fit) for better UX
- **Decision Needed:** Product team

**AMBIGUITY-2:** Should users be able to share templates online?
- **Options:**
  A. Phase 1: Local only (JSON export/import)
  B. Phase 2: Online template marketplace
- **Recommendation:** Start with A, plan for B
- **Decision Needed:** Product roadmap

**AMBIGUITY-3:** What happens to measurements when loading template?
- **Options:**
  A. Clear all measurements
  B. Keep measurements from template
  C. User choice via checkbox
- **Recommendation:** Option A (clear) for simplicity
- **Decision Needed:** UX team

**AMBIGUITY-4:** Should built-in templates be editable?
- **Options:**
  A. Read-only (can duplicate to edit)
  B. Editable (creates user version)
- **Recommendation:** Option A (prevents confusion)
- **Decision Needed:** UX team

**AMBIGUITY-5:** How to handle template thumbnail updates?
- **Options:**
  A. Manual regenerate button
  B. Auto-update when template edited
  C. Never update (preserve original)
- **Recommendation:** Option B (auto-update)
- **Decision Needed:** Product team

---

## 7. Dependencies & Constraints

### External Dependencies
- **IndexedDB API** - Browser support required (all modern browsers ✅)
- **localforage** - Library for IndexedDB abstraction (already in use ✅)
- **File System Access API** - For import/export (polyfill for older browsers)

### Internal Dependencies
- **Zustand stores** - Integration with existing state management
- **Shape types** - Must support all current shape types
- **Layer system** - Existing layer management
- **Unit system** - Current unit conversion logic
- **Export system** - JSON serialization already implemented

### Technical Constraints
- **Storage Limit:** 50MB total (browser quota)
- **Template Size:** Max 2MB per template
- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Performance:** <1s load time for templates with <100 shapes
- **Mobile:** Touch-optimized gallery for tablets/phones

### Design Constraints
- **UI Consistency:** Must match Canva-inspired design system
- **Inline Styles:** All styling via inline styles (no CSS files)
- **Accessibility:** WCAG 2.1 AA compliance
- **Responsive:** Works on 375px (mobile) to 1920px (desktop)

---

## 8. Out of Scope (Phase 2+)

### Future Enhancements
1. **Online Template Marketplace**
   - Cloud storage for templates
   - Public template sharing
   - User ratings/reviews
   - Template preview before download

2. **Advanced Template Features**
   - Template variables (e.g., lot size parameter)
   - Template inheritance (base template + variations)
   - Smart templates with conditional logic
   - Template versioning with change history

3. **Collaboration**
   - Team template libraries
   - Template permission management
   - Real-time template syncing
   - Template comments/annotations

4. **AI-Powered Templates**
   - Auto-suggest templates based on drawing
   - Generate template from description
   - Smart template recommendations
   - Template optimization suggestions

5. **Enterprise Features**
   - Template approval workflows
   - Centralized template management
   - Template usage analytics
   - Compliance template enforcement

---

## 9. Open Questions

1. **Q1:** Should templates include comparison panel state?
   - **Impact:** Affects template data size and complexity
   - **Blocker:** No
   - **Decision By:** Sprint planning

2. **Q2:** How to handle template conflicts during import?
   - **Impact:** User experience for duplicate imports
   - **Blocker:** No
   - **Decision By:** Implementation phase

3. **Q3:** Should we implement template preview before loading?
   - **Impact:** Development time +4 hours
   - **Blocker:** No
   - **Decision By:** UX review

4. **Q4:** What's the ideal number of built-in templates?
   - **Impact:** Initial download size and user choice
   - **Blocker:** No
   - **Decision By:** Product team

5. **Q5:** Should templates support custom icons/colors?
   - **Impact:** Enhanced visual organization
   - **Blocker:** No
   - **Decision By:** Design review

---

## 10. Approval & Sign-off

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Owner | TBD | Pending | - |
| Tech Lead | TBD | Pending | - |
| UX Designer | TBD | Pending | - |
| QA Lead | TBD | Pending | - |

---

## 11. References

- **SmartDraw Feature Analysis:** `SMARTDRAW_FEATURE_ANALYSIS.md`
- **Project Constitution:** `CLAUDE.md`
- **Existing Export System:** `app/src/utils/exportUtils.ts`
- **Layer Management:** `app/src/store/useLayerStore.ts`
- **Shape Types:** `app/src/types/index.ts`
- **Storage Examples:** `app/src/utils/localStorageUtils.ts`

---

**Document Version:** 1.0
**Last Review:** October 2025
**Next Review:** After implementation
