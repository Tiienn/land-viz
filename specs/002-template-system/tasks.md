# Task Breakdown: Template System
**Spec ID:** 002
**Tasks Version:** 1.0
**Total Estimated Time:** 16-20 hours

---

## Phase 1: Foundation & Storage (6 hours)

### Task 1.1: Type Definitions
**Time:** 30 minutes
**File:** `app/src/types/template.ts`

```typescript
// Create comprehensive type definitions
export type TemplateCategory = 'residential' | 'commercial' | 'agricultural' | 'industrial' | 'custom';

export interface PropertyTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  author: 'built-in' | 'user';
  createdAt: number;
  updatedAt: number;
  version: number;
  tags: string[];
  thumbnail: string;
  usageCount: number;
  isFavorite: boolean;
  data: TemplateData;
}

export interface TemplateData {
  shapes: Shape[];
  layers: Layer[];
  metadata: TemplateMetadata;
}

export interface TemplateMetadata {
  defaultUnit: UnitType;
  gridSize: number;
  gridEnabled: boolean;
  bounds: { width: number; height: number };
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: TemplateCategory;
  tags?: string[];
}

export interface TemplateFilter {
  category?: TemplateCategory;
  searchQuery?: string;
  showBuiltIn?: boolean;
  showUserTemplates?: boolean;
  showFavorites?: boolean;
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateExportFormat {
  version: '1.0';
  template: PropertyTemplate;
  exportedAt: number;
  exportedBy: string;
}
```

**Validation Criteria:**
- [ ] All types compile without errors
- [ ] Types match existing Shape and Layer interfaces
- [ ] Proper TypeScript strict mode compliance

---

### Task 1.2: Template Storage Service
**Time:** 2 hours
**File:** `app/src/services/templateStorage.ts`

**Subtasks:**
1. Set up IndexedDB with localforage (30 min)
   ```typescript
   this.store = localforage.createInstance({
     name: 'land-visualizer',
     storeName: 'templates',
     driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
   });
   ```

2. Implement CRUD operations (60 min)
   - `saveTemplate(template: PropertyTemplate): Promise<void>`
   - `loadTemplate(id: string): Promise<PropertyTemplate | null>`
   - `getAllTemplates(): Promise<PropertyTemplate[]>`
   - `deleteTemplate(id: string): Promise<void>`

3. Add storage quota checking (15 min)
   ```typescript
   const estimate = await navigator.storage.estimate();
   const usageInMB = (estimate.usage || 0) / (1024 * 1024);
   ```

4. Implement import/export (15 min)
   - `exportTemplate(template: PropertyTemplate): void`
   - `importTemplate(file: File): Promise<PropertyTemplate>`

**Validation Criteria:**
- [ ] Templates save to IndexedDB successfully
- [ ] Templates load without corruption
- [ ] Built-in templates cannot be deleted
- [ ] Storage quota warnings work
- [ ] Export generates valid JSON
- [ ] Import validates file format

**Test File:** `app/src/__tests__/unit/templateStorage.test.ts`

---

### Task 1.3: Built-in Templates
**Time:** 1.5 hours
**File:** `app/src/data/builtInTemplates.ts`

**Create 5 templates:**

1. **Residential Standard Lot** (15 min)
   - 25m × 40m rectangle
   - Single shape, centered

2. **Corner Lot with Setbacks** (20 min)
   - L-shaped polyline (outer boundary)
   - Inner setback line
   - 30m × 35m

3. **Commercial Parking Layout** (25 min)
   - Building footprint (30m × 15m)
   - 20 parking space rectangles
   - Access road/driveway

4. **Farm Property** (20 min)
   - Large boundary (200m × 300m)
   - Farmhouse rectangle
   - Barn rectangle

5. **Subdivision Block** (20 min)
   - 6 residential lots
   - Central access road
   - 100m × 150m

**Validation Criteria:**
- [ ] Each template renders correctly in 3D scene
- [ ] All shapes have valid coordinates
- [ ] Thumbnails auto-generate
- [ ] Templates appear in correct categories

---

### Task 1.4: Thumbnail Generator
**Time:** 1.5 hours
**File:** `app/src/services/thumbnailGenerator.ts`

**Subtasks:**
1. Create Canvas 2D renderer (45 min)
   - Calculate shape bounding box
   - Scale shapes to fit 200×150px canvas
   - Draw shapes with proper styling

2. Implement shape drawing (30 min)
   - Draw rectangles
   - Draw circles
   - Draw polylines

3. Add placeholder thumbnail (15 min)
   - Simple house icon for empty templates

**Code Example:**
```typescript
generateFromShapes(shapes: Shape[]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = '#F9FAFB';
  ctx.fillRect(0, 0, 200, 150);

  // Calculate bounds and scale
  const bounds = this.calculateBounds(shapes);
  const scale = Math.min(180 / bounds.width, 130 / bounds.height);

  // Draw each shape
  shapes.forEach(shape => this.drawShape(ctx, shape, scale));

  return canvas.toDataURL('image/png');
}
```

**Validation Criteria:**
- [ ] Thumbnails generate in <200ms
- [ ] Shapes are properly centered
- [ ] Colors match design system
- [ ] Empty templates show placeholder

---

### Task 1.5: Template Validator
**Time:** 30 minutes
**File:** `app/src/services/templateValidator.ts`

**Implement validation rules:**
```typescript
export function validateTemplate(template: PropertyTemplate): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!template.name || template.name.length > 50) {
    errors.push('Name is required and must be ≤50 characters');
  }

  // Shapes validation
  if (template.data.shapes.length === 0) {
    errors.push('Template must contain at least 1 shape');
  }

  // Thumbnail size check
  if (template.thumbnail && template.thumbnail.length > 500000) {
    warnings.push('Thumbnail is large (>500KB)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

**Validation Criteria:**
- [ ] Catches missing required fields
- [ ] Validates shape data integrity
- [ ] Checks storage size limits

---

## Phase 2: State Management & Business Logic (4 hours)

### Task 2.1: Template Zustand Store
**Time:** 1.5 hours
**File:** `app/src/store/useTemplateStore.ts`

**Implement store:**
```typescript
interface TemplateState {
  templates: PropertyTemplate[];
  isGalleryOpen: boolean;
  isSaveDialogOpen: boolean;
  selectedTemplateId: string | null;
  searchQuery: string;
  activeFilter: TemplateFilter;

  // Actions
  loadAllTemplates: () => Promise<void>;
  openGallery: () => void;
  closeGallery: () => void;
  openSaveDialog: () => void;
  closeSaveDialog: () => void;
  selectTemplate: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: Partial<TemplateFilter>) => void;
  toggleFavorite: (id: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}
```

**Validation Criteria:**
- [ ] Store initializes with empty state
- [ ] Actions update state correctly
- [ ] Async actions handle errors
- [ ] Store integrates with storage service

**Test File:** `app/src/__tests__/unit/useTemplateStore.test.ts`

---

### Task 2.2: Template Service (Business Logic)
**Time:** 2 hours
**File:** `app/src/services/templateService.ts`

**Implement orchestration layer:**

1. **Save Template with Thumbnail** (45 min)
   ```typescript
   async saveTemplate(input: CreateTemplateInput): Promise<PropertyTemplate> {
     // Get current drawing state
     const shapes = useDrawingStore.getState().shapes;
     const layers = useLayerStore.getState().layers;

     // Generate thumbnail
     const thumbnail = thumbnailGenerator.generateFromShapes(shapes);

     // Create template object
     const template: PropertyTemplate = {
       id: crypto.randomUUID(),
       ...input,
       author: 'user',
       createdAt: Date.now(),
       updatedAt: Date.now(),
       version: 1,
       thumbnail,
       usageCount: 0,
       isFavorite: false,
       data: { shapes, layers, metadata: { ... } },
     };

     // Validate
     const validation = validateTemplate(template);
     if (!validation.valid) {
       throw new Error(validation.errors.join(', '));
     }

     // Save to storage
     await templateStorage.saveTemplate(template);

     return template;
   }
   ```

2. **Load Template into Scene** (45 min)
   ```typescript
   async loadTemplate(id: string): Promise<void> {
     const template = await templateStorage.loadTemplate(id);
     if (!template) throw new Error('Template not found');

     // Check for unsaved changes
     const hasUnsavedChanges = useDrawingStore.getState().shapes.length > 0;
     if (hasUnsavedChanges) {
       const confirmed = await confirmDialog('Unsaved changes will be lost. Continue?');
       if (!confirmed) return;
     }

     // Load shapes into drawing store
     useDrawingStore.getState().setShapes(template.data.shapes);

     // Load layers
     useLayerStore.getState().setLayers(template.data.layers);

     // Apply metadata
     useDrawingStore.getState().setGridSize(template.data.metadata.gridSize);

     // Add to undo history
     useDrawingStore.getState().addToHistory('Load template');
   }
   ```

3. **Duplicate Template** (15 min)
4. **Update Template** (15 min)

**Validation Criteria:**
- [ ] Save captures all current state
- [ ] Load restores scene correctly
- [ ] Unsaved changes warning appears
- [ ] Undo/redo works after load

---

### Task 2.3: Keyboard Shortcut Integration
**Time:** 30 minutes
**File:** `app/src/hooks/useKeyboardShortcuts.ts`

**Add shortcut:**
```typescript
{
  id: 'open-template-gallery',
  key: 't',
  ctrl: true,
  shift: true,
  description: 'Open Template Gallery',
  category: 'tools',
  action: () => {
    useTemplateStore.getState().openGallery();
  },
}
```

**Validation Criteria:**
- [ ] Ctrl+Shift+T opens gallery
- [ ] Shortcut appears in help overlay (?)
- [ ] No conflicts with existing shortcuts

---

## Phase 3: UI Components (6-8 hours)

### Task 3.1: Template Card Component
**Time:** 1 hour
**File:** `app/src/components/TemplateGallery/TemplateCard.tsx`

**Component structure:**
```typescript
interface TemplateCardProps {
  template: PropertyTemplate;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function TemplateCard({ template, onClick, onContextMenu }: TemplateCardProps) {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        cursor: 'pointer',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        transition: 'all 150ms',
      }}
    >
      {/* Thumbnail */}
      <img
        src={template.thumbnail}
        alt={template.name}
        style={{
          width: '100%',
          height: '150px',
          objectFit: 'cover',
          backgroundColor: '#f3f4f6',
        }}
      />

      {/* Info */}
      <div style={{ padding: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
          {template.name}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
          {template.category}
        </p>
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', fontSize: '12px', color: '#9ca3af' }}>
          <span>⭐ {template.usageCount}</span>
          <span>👤 {template.author}</span>
        </div>
      </div>
    </div>
  );
}
```

**Validation Criteria:**
- [ ] Card displays thumbnail correctly
- [ ] Hover state shows scale effect
- [ ] Click triggers load action
- [ ] Right-click opens context menu

---

### Task 3.2: Template Grid Component
**Time:** 30 minutes
**File:** `app/src/components/TemplateGallery/TemplateGrid.tsx`

**Responsive grid:**
```typescript
export function TemplateGrid({ templates }: { templates: PropertyTemplate[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}
    >
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onClick={() => handleLoadTemplate(template.id)}
          onContextMenu={(e) => handleContextMenu(e, template)}
        />
      ))}
    </div>
  );
}
```

**Validation Criteria:**
- [ ] Grid adapts to screen size
- [ ] Mobile shows 1 column
- [ ] Desktop shows 3-4 columns
- [ ] Empty state shows message

---

### Task 3.3: Save Template Dialog
**Time:** 1.5 hours
**File:** `app/src/components/TemplateGallery/SaveTemplateDialog.tsx`

**Form fields:**
1. Name (required, max 50 chars)
2. Description (optional, max 200 chars)
3. Category (dropdown)
4. Tags (comma-separated, max 5)
5. Thumbnail preview (auto-generated)

**Validation:**
- Real-time character count
- Required field indicators
- Duplicate name warning

**Code snippet:**
```typescript
const [formData, setFormData] = useState<CreateTemplateInput>({
  name: '',
  description: '',
  category: 'custom',
  tags: [],
});

const [errors, setErrors] = useState<Record<string, string>>({});

const handleSave = async () => {
  const newErrors: Record<string, string> = {};

  if (!formData.name.trim()) {
    newErrors.name = 'Name is required';
  }

  if (formData.name.length > 50) {
    newErrors.name = 'Name must be ≤50 characters';
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  try {
    await templateService.saveTemplate(formData);
    useTemplateStore.getState().closeSaveDialog();
    useTemplateStore.getState().loadAllTemplates();
  } catch (error) {
    setErrors({ general: error.message });
  }
};
```

**Validation Criteria:**
- [ ] Form validates on submit
- [ ] Shows error messages
- [ ] Thumbnail previews correctly
- [ ] Save button disabled when invalid
- [ ] Dialog closes on successful save

---

### Task 3.4: Template Gallery Modal
**Time:** 2 hours
**File:** `app/src/components/TemplateGallery/TemplateGalleryModal.tsx`

**Features:**
1. Search bar (debounced, 300ms)
2. Category tabs with filters
3. Template grid display
4. Filter controls (built-in, user, favorites)
5. Empty states

**Layout:**
```
┌─────────────────────────────────────────┐
│ 📄 Template Gallery          [×]        │
├─────────────────────────────────────────┤
│ [🔍 Search templates...]                │
├─────────────────────────────────────────┤
│ [All] [Residential] [Commercial] ...    │
├─────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │ Card │ │ Card │ │ Card │ │ Card │   │
│ └──────┘ └──────┘ └──────┘ └──────┘   │
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │ Card │ │ Card │ │ Card │             │
│ └──────┘ └──────┘ └──────┘             │
├─────────────────────────────────────────┤
│        [+ Create New Template]          │
└─────────────────────────────────────────┘
```

**Search implementation:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery]);

const filteredTemplates = useMemo(() => {
  if (!debouncedQuery) return templates;

  const query = debouncedQuery.toLowerCase();
  return templates.filter(t =>
    t.name.toLowerCase().includes(query) ||
    t.description.toLowerCase().includes(query) ||
    t.tags.some(tag => tag.toLowerCase().includes(query))
  );
}, [templates, debouncedQuery]);
```

**Validation Criteria:**
- [ ] Modal opens with Ctrl+Shift+T
- [ ] Search updates smoothly (debounced)
- [ ] Category tabs filter correctly
- [ ] Mobile responsive layout
- [ ] Loads all templates on open

---

### Task 3.5: Template Context Menu
**Time:** 45 minutes
**File:** `app/src/components/TemplateGallery/TemplateContextMenu.tsx`

**Menu items:**
- Load Template
- Edit Metadata
- Duplicate
- Toggle Favorite
- Export as JSON
- Delete (user templates only)

**Implementation:**
```typescript
const menuItems = useMemo(() => {
  const items: ContextMenuItem[] = [
    {
      label: 'Load Template',
      icon: 'download',
      onClick: () => handleLoadTemplate(template.id),
    },
    {
      label: template.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: 'star',
      onClick: () => handleToggleFavorite(template.id),
    },
    {
      label: 'Duplicate',
      icon: 'copy',
      onClick: () => handleDuplicate(template.id),
    },
    {
      label: 'Export as JSON',
      icon: 'export',
      onClick: () => templateStorage.exportTemplate(template),
    },
  ];

  if (template.author === 'user') {
    items.push({
      label: 'Delete',
      icon: 'delete',
      onClick: () => handleDelete(template.id),
      danger: true,
    });
  }

  return items;
}, [template]);
```

**Validation Criteria:**
- [ ] Context menu opens on right-click
- [ ] Menu closes on action or outside click
- [ ] Built-in templates hide "Delete"
- [ ] Actions execute correctly

---

### Task 3.6: Toolbar Integration
**Time:** 1 hour
**Files:**
- `app/src/components/Toolbar/TemplateButton.tsx` (new)
- `app/src/components/Toolbar/Toolbar.tsx` (modify)

**Add template button:**
```typescript
// TemplateButton.tsx
export function TemplateButton() {
  const { openGallery } = useTemplateStore();

  return (
    <button
      onClick={openGallery}
      title="Templates (Ctrl+Shift+T)"
      style={{
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 150ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f3f4f6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff';
      }}
    >
      <Icon name="template" size={18} color="#374151" />
      <span style={{ fontSize: '14px', fontWeight: '500' }}>Templates</span>
    </button>
  );
}

// Toolbar.tsx (add between Export and Settings)
<TemplateButton />
```

**Validation Criteria:**
- [ ] Button appears in toolbar
- [ ] Click opens gallery
- [ ] Tooltip shows shortcut
- [ ] Styling matches existing buttons

---

### Task 3.7: Unsaved Changes Dialog
**Time:** 30 minutes
**File:** `app/src/components/TemplateGallery/UnsavedChangesDialog.tsx`

**Confirmation dialog:**
```typescript
export function UnsavedChangesDialog({ onConfirm, onCancel }: Props) {
  return (
    <div style={{ /* modal backdrop */ }}>
      <div style={{ /* modal content */ }}>
        <Icon name="warning" size={48} color="#f59e0b" />
        <h3>Unsaved Changes</h3>
        <p>You have unsaved changes. Loading a template will discard them.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm} style={{ backgroundColor: '#ef4444' }}>
            Discard & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Validation Criteria:**
- [ ] Shows when loading template with unsaved changes
- [ ] "Discard & Continue" loads template
- [ ] "Cancel" closes dialog
- [ ] ESC key closes dialog

---

## Phase 4: Testing & Polish (4-6 hours)

### Task 4.1: Unit Tests
**Time:** 2 hours

**Test files to create:**

1. **`templateStorage.test.ts`** (45 min)
   - Test save/load/delete operations
   - Test storage quota checking
   - Test import/export functionality

2. **`templateService.test.ts`** (45 min)
   - Test saveTemplate with validation
   - Test loadTemplate into scene
   - Test duplicate template

3. **`thumbnailGenerator.test.ts`** (30 min)
   - Test thumbnail generation
   - Test scaling and centering
   - Test placeholder generation

**Coverage target:** 75%+

---

### Task 4.2: Integration Tests
**Time:** 1.5 hours

**Test scenarios:**

1. **Complete workflow test** (45 min)
   ```typescript
   test('user can save, search, and load template', async () => {
     // Draw shapes
     // Open save dialog
     // Fill form and save
     // Open gallery
     // Search for template
     // Load template
     // Verify shapes loaded
   });
   ```

2. **Filter and search test** (30 min)
3. **Import/export test** (15 min)

---

### Task 4.3: Performance Optimization
**Time:** 1 hour

**Optimizations:**

1. **Virtualized template list** (30 min)
   - Use `react-window` for 100+ templates
   - Lazy load thumbnails

2. **Debounced search** (15 min)
   - Already implemented, test at scale

3. **Thumbnail caching** (15 min)
   - Cache generated thumbnails in memory

**Performance targets:**
- Gallery load: <500ms
- Search update: <100ms
- Template load: <1s

---

### Task 4.4: Error Handling & Edge Cases
**Time:** 1 hour

**Handle edge cases:**

1. **Storage quota exceeded** (15 min)
   - Show clear error message
   - Offer to delete old templates

2. **Corrupted template file** (15 min)
   - Validate on import
   - Skip corrupted templates gracefully

3. **Empty drawing save** (15 min)
   - Show warning "Template must contain at least 1 shape"

4. **Duplicate template names** (15 min)
   - Auto-append " (2)", " (3)", etc.

---

### Task 4.5: Accessibility & Mobile
**Time:** 30 minutes

**Accessibility:**
- [ ] Keyboard navigation through gallery
- [ ] ARIA labels on all interactive elements
- [ ] Focus management in modals
- [ ] Screen reader announcements

**Mobile:**
- [ ] Touch-friendly card sizes
- [ ] Swipe gestures (optional)
- [ ] Responsive grid (1 column on <640px)

---

### Task 4.6: Documentation
**Time:** 30 minutes

**Update files:**

1. **README.md** (15 min)
   - Add Template System to feature list
   - Update screenshots with gallery
   - Add usage examples

2. **CLAUDE.md** (10 min)
   - Mark template system as complete
   - Update implementation status

3. **User Guide** (5 min, optional)
   - How to save templates
   - How to use template gallery
   - How to import/export

---

## Validation Checklist (Final QA)

### Functionality
- [ ] User can save current drawing as template
- [ ] User can load template from gallery
- [ ] User can search and filter templates
- [ ] User can import/export templates
- [ ] User can edit template metadata
- [ ] User can delete user templates
- [ ] User can favorite templates
- [ ] Built-in templates load correctly

### Performance
- [ ] Gallery loads in <500ms
- [ ] Search updates in <100ms
- [ ] Template loading in <1s
- [ ] Smooth scrolling with 100+ templates

### UI/UX
- [ ] Gallery matches Canva-inspired design
- [ ] Thumbnails generate correctly
- [ ] Hover states work smoothly
- [ ] Mobile responsive layout
- [ ] Keyboard shortcuts work
- [ ] Context menus function properly

### Data Integrity
- [ ] Templates save without data loss
- [ ] Templates load shapes correctly
- [ ] Layers restore properly
- [ ] Grid settings apply correctly
- [ ] Undo/redo works after load

### Error Handling
- [ ] Storage quota warnings appear
- [ ] Import validation works
- [ ] Corrupted files handled gracefully
- [ ] Empty drawing save prevented
- [ ] Network errors caught

### Testing
- [ ] Unit tests pass (75%+ coverage)
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] Accessibility checks pass
- [ ] Manual QA completed

---

## Time Breakdown Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1: Foundation** | Types, Storage, Built-ins, Thumbnail, Validator | 6 hours |
| **Phase 2: Business Logic** | Store, Service, Shortcuts | 4 hours |
| **Phase 3: UI Components** | Card, Grid, Dialogs, Modal, Context Menu, Toolbar | 6-8 hours |
| **Phase 4: Testing & Polish** | Unit tests, Integration, Performance, Documentation | 4-6 hours |
| **Total** | | **20-24 hours** |

---

## Implementation Order (Recommended)

**Week 1 (8 hours):**
1. Task 1.1 - Type Definitions
2. Task 1.2 - Template Storage Service
3. Task 1.3 - Built-in Templates
4. Task 1.4 - Thumbnail Generator
5. Task 1.5 - Template Validator
6. Task 2.1 - Template Zustand Store

**Week 2 (8 hours):**
7. Task 2.2 - Template Service
8. Task 3.1 - Template Card Component
9. Task 3.2 - Template Grid Component
10. Task 3.3 - Save Template Dialog
11. Task 3.4 - Template Gallery Modal

**Week 3 (8 hours):**
12. Task 3.5 - Template Context Menu
13. Task 3.6 - Toolbar Integration
14. Task 3.7 - Unsaved Changes Dialog
15. Task 2.3 - Keyboard Shortcut
16. Task 4.1-4.6 - Testing & Polish

---

## Dependencies Graph

```
Task 1.1 (Types)
  ├─→ Task 1.2 (Storage)
  ├─→ Task 1.3 (Built-ins)
  ├─→ Task 1.4 (Thumbnail)
  └─→ Task 1.5 (Validator)

Task 1.2 (Storage)
  └─→ Task 2.1 (Store)
      └─→ Task 2.2 (Service)
          ├─→ Task 3.3 (Save Dialog)
          └─→ Task 3.4 (Gallery Modal)

Task 3.1 (Card)
  └─→ Task 3.2 (Grid)
      └─→ Task 3.4 (Gallery Modal)

Task 3.4 (Gallery Modal)
  ├─→ Task 3.5 (Context Menu)
  ├─→ Task 3.6 (Toolbar)
  └─→ Task 3.7 (Unsaved Changes)

All Components
  └─→ Task 4.1-4.6 (Testing & Polish)
```

---

## Next Steps

1. **Review this task breakdown** with team
2. **Assign tasks** to developers
3. **Set up project board** (Trello/GitHub Projects)
4. **Begin Phase 1** with type definitions
5. **Daily standups** to track progress
6. **Weekly demos** to stakeholders

---

**Tasks Status:** ✅ Ready for Implementation
**Total Tasks:** 26 tasks across 4 phases
**Estimated Completion:** 3 weeks (part-time) or 1 week (full-time)
