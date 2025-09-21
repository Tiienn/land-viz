# Implementation Plan: Area Configuration Presets

**Spec ID**: 004
**Feature**: Area Configuration Presets
**Created**: 2025-09-18
**Plan Version**: 1.0

## Technical Overview

The Area Configuration Presets feature will be implemented as a modal-based system that integrates with the existing AddArea infrastructure. The implementation leverages the current Zustand store patterns, inline styling architecture, and AddArea modal system to provide a seamless user experience.

## Architecture Analysis

### Current State Assessment
- ✅ **Presets Button**: Already exists in `App.tsx` (line 454) but non-functional
- ✅ **AddArea System**: Fully implemented with modal, validation, and shape generation
- ✅ **Store Actions**: `createAreaShapeAdvanced` available for integration
- ✅ **Type Definitions**: `AddAreaConfig`, `AreaUnit` types already defined
- ✅ **Utilities**: Area calculation and validation utilities exist

### Integration Points
1. **Store Integration**: Extend `useAppStore` with presets state and actions
2. **Modal System**: Create new `PresetsModal` component following AddArea patterns
3. **Toolbar Integration**: Connect existing Presets button to modal functionality
4. **Data Management**: Create preset data structure and custom preset persistence

## Component Architecture

```
Area Configuration Presets
│
├── PresetsModal (Main Container)
│   ├── PresetsHeader (Title, Search, Close)
│   ├── CategoryTabs (Residential, Commercial, Agricultural, Custom)
│   ├── PresetsGrid
│   │   └── PresetCard[] (Individual preset display)
│   ├── RecentPresets (Last 5 used)
│   └── ModalActions (Use Preset, Customize, Cancel)
│
├── PresetCard (Reusable Component)
│   ├── AreaDisplay (Value + Unit)
│   ├── ShapeTypeIcon (Visual indicator)
│   ├── Description (Context info)
│   └── PreviewDimensions (Calculated size)
│
└── CustomPresetManager (Utility)
    ├── SavePreset
    ├── EditPreset
    └── DeletePreset
```

## Data Architecture

### Preset Data Structure
```typescript
interface AreaPreset {
  id: string;
  name: string;
  area: number;
  unit: AreaUnit;
  shapeType: 'square' | 'rectangle' | 'circle';
  aspectRatio?: number;
  description: string;
  category: PresetCategory;
  isCustom?: boolean;
  created?: Date;
  lastUsed?: Date;
}

type PresetCategory = 'residential' | 'commercial' | 'agricultural' | 'mixed' | 'custom';
```

### Store State Extension
```typescript
interface PresetsState {
  // Modal state
  presetsModalOpen: boolean;

  // Preset data
  defaultPresets: AreaPreset[];
  customPresets: AreaPreset[];
  recentPresets: string[]; // Preset IDs
  favoritePresets: string[]; // Preset IDs

  // UI state
  selectedCategory: PresetCategory;
  searchQuery: string;
  selectedPreset: string | null;
}
```

## File Structure Plan

```
app/src/
├── components/
│   └── AddArea/
│       ├── PresetsModal.tsx        # Main preset selection modal
│       ├── PresetCard.tsx          # Individual preset display
│       ├── CategoryTabs.tsx        # Category navigation
│       └── CustomPresetManager.tsx # Custom preset utilities
├── data/
│   └── areaPresets.ts             # Default preset definitions
├── store/
│   └── useAppStore.ts             # Extended with presets actions
├── types/
│   └── index.ts                   # Extended with preset types
└── utils/
    ├── presetStorage.ts           # Custom preset persistence
    └── presetCalculations.ts      # Preset-specific calculations
```

## Implementation Phases

### Phase 1: Foundation (2 hours)
**Goal**: Establish core data structures and types

#### 1.1 Type Definitions
- Extend `app/src/types/index.ts` with preset interfaces
- Add preset categories and validation types
- Ensure compatibility with existing `AddAreaConfig`

#### 1.2 Default Presets Dataset
- Create `app/src/data/areaPresets.ts`
- Define 20+ default presets across categories
- Include realistic area values and descriptions

### Phase 2: Core Components (3.5 hours)
**Goal**: Build the preset selection interface

#### 2.1 PresetsModal Component
- Modal container with category-based organization
- Search and filter functionality
- Integration with existing modal patterns

#### 2.2 PresetCard Component
- Individual preset display with hover effects
- Area conversion displays
- Shape type visualization

#### 2.3 CategoryTabs Component
- Tab-based navigation between categories
- Active state management
- Responsive design

### Phase 3: Store Integration (1.5 hours)
**Goal**: Connect components to state management

#### 3.1 Store Actions
- `openPresetsModal` / `closePresetsModal`
- `selectPreset` / `createShapeFromPreset`
- `saveCustomPreset` / `deleteCustomPreset`

#### 3.2 Custom Preset Persistence
- localStorage integration for custom presets
- Migration and versioning strategy
- Error handling for storage limitations

### Phase 4: System Integration (2 hours)
**Goal**: Connect to existing application flow

#### 4.1 Toolbar Integration
- Connect Presets button in `App.tsx`
- Modal state management
- Integration with existing area creation workflow

#### 4.2 AddArea Integration
- "Customize" option to pre-fill AddArea modal
- Seamless workflow between presets and customization
- Maintain existing AddArea functionality

### Phase 5: Polish & Testing (1 hour)
**Goal**: Refine user experience and ensure quality

#### 5.1 UI Polish
- Responsive design implementation
- Animation and transition effects
- Error state handling

#### 5.2 Integration Testing
- End-to-end preset selection workflow
- Area calculation accuracy verification
- Performance optimization

## Technical Implementation Details

### Store Actions Implementation
```typescript
// Preset modal management
openPresetsModal: () => set({ presetsModalOpen: true }),
closePresetsModal: () => set({ presetsModalOpen: false }),

// Preset selection and usage
selectPreset: (presetId: string) => set({ selectedPreset: presetId }),
createShapeFromPreset: (preset: AreaPreset) => {
  // Convert preset to AddAreaConfig
  const config: AddAreaConfig = {
    area: preset.area,
    unit: preset.unit,
    shapeType: preset.shapeType,
    aspectRatio: preset.aspectRatio
  };

  // Use existing createAreaShapeAdvanced
  get().createAreaShapeAdvanced(config);

  // Update recent presets
  get().addToRecentPresets(preset.id);
},

// Custom preset management
saveCustomPreset: (preset: Omit<AreaPreset, 'id' | 'isCustom'>) => {
  const customPreset: AreaPreset = {
    ...preset,
    id: generateId(),
    isCustom: true,
    created: new Date()
  };

  set(state => ({
    customPresets: [...state.customPresets, customPreset]
  }));

  // Persist to localStorage
  saveToLocalStorage(get().customPresets);
}
```

### Modal Integration Pattern
```typescript
// In App.tsx - Connect existing button
<button
  onClick={() => openPresetsModal()}  // New action
  style={{
    // Existing styles maintained
  }}
>
  <svg>...</svg>
  <span>Presets</span>
</button>

// Conditional modal rendering
{presetsModalOpen && (
  <PresetsModal
    isOpen={presetsModalOpen}
    onClose={closePresetsModal}
    onSelectPreset={createShapeFromPreset}
    onCustomize={(preset) => {
      // Open AddArea modal with preset values
      setAddAreaConfig(presetToConfig(preset));
      openAddAreaModal();
      closePresetsModal();
    }}
  />
)}
```

### Preset Card Implementation
```typescript
const PresetCard: React.FC<PresetCardProps> = ({ preset, onSelect, onCustomize }) => {
  const dimensions = useMemo(() =>
    calculateShapePreview(preset.area, preset.unit, preset.shapeType, preset.aspectRatio),
    [preset]
  );

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      // Inline styles following project patterns
    }}>
      <div style={{ /* Area display */ }}>
        {preset.area} {preset.unit}
      </div>
      <div style={{ /* Shape type icon */ }}>
        {getShapeIcon(preset.shapeType)}
      </div>
      <div style={{ /* Description */ }}>
        {preset.description}
      </div>
      <div style={{ /* Preview dimensions */ }}>
        {formatDimensions(dimensions)}
      </div>
    </div>
  );
};
```

## Performance Considerations

### 1. Modal Loading
- **Optimization**: Lazy load preset calculations
- **Target**: < 100ms modal open time
- **Strategy**: Pre-calculate common dimensions

### 2. Search Performance
- **Optimization**: Debounced search with local filtering
- **Target**: < 50ms search result updates
- **Strategy**: In-memory filtering of preset array

### 3. Custom Preset Storage
- **Optimization**: Efficient localStorage operations
- **Target**: No blocking operations
- **Strategy**: Async storage with error handling

## Integration Requirements

### 1. Existing AddArea Compatibility
- Maintain all existing AddArea functionality
- Reuse validation and calculation utilities
- Preserve modal interaction patterns

### 2. Store Pattern Consistency
- Follow existing Zustand store patterns
- Maintain action naming conventions
- Preserve state management architecture

### 3. Styling Architecture
- Use inline styles exclusively (no CSS files)
- Follow existing component styling patterns
- Maintain Canva-inspired design consistency

## Error Handling Strategy

### 1. Preset Loading Errors
```typescript
const loadPresets = async () => {
  try {
    const customPresets = await loadFromLocalStorage();
    set({ customPresets });
  } catch (error) {
    logger.error('Failed to load custom presets:', error);
    // Graceful degradation - continue with default presets only
  }
};
```

### 2. Storage Limitations
```typescript
const saveCustomPreset = (preset: AreaPreset) => {
  try {
    const updated = [...get().customPresets, preset];
    saveToLocalStorage(updated);
    set({ customPresets: updated });
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // Implement preset cleanup strategy
      cleanupOldPresets();
      retry();
    }
  }
};
```

### 3. Invalid Preset Data
```typescript
const validatePreset = (preset: AreaPreset): boolean => {
  return (
    preset.area > 0 &&
    ['sqm', 'sqft', 'acres', 'hectares'].includes(preset.unit) &&
    ['square', 'rectangle', 'circle'].includes(preset.shapeType)
  );
};
```

## Testing Strategy

### 1. Unit Testing
- Preset validation functions
- Area calculation utilities
- Custom preset storage operations

### 2. Component Testing
- Modal open/close behavior
- Preset selection interactions
- Search and filter functionality

### 3. Integration Testing
- End-to-end preset to shape creation
- AddArea modal integration
- Store action chains

### 4. Performance Testing
- Modal load time measurement
- Search performance under load
- Memory usage with large preset collections

## Migration Strategy

### Phase 1: Non-breaking Addition
- Add new components without affecting existing functionality
- Preset button initially opens modal but doesn't interfere with other features

### Phase 2: Gradual Enhancement
- Add custom preset saving from AddArea modal
- Introduce recent presets and favorites

### Phase 3: Full Integration
- Complete preset management features
- Advanced search and organization

## Risk Mitigation

### Risk 1: Performance Impact
**Mitigation**: Lazy loading, virtual scrolling for large preset lists

### Risk 2: Storage Limitations
**Mitigation**: Preset cleanup policies, graceful degradation

### Risk 3: User Confusion
**Mitigation**: Clear categorization, progressive disclosure, tooltips

### Risk 4: Integration Conflicts
**Mitigation**: Thorough testing of existing AddArea workflows

## Success Criteria

### Technical Criteria
- [ ] Modal opens in < 100ms consistently
- [ ] No performance regression in existing features
- [ ] All preset shapes generate with exact area values
- [ ] Custom presets persist across browser sessions

### User Experience Criteria
- [ ] Intuitive preset discovery and selection
- [ ] Seamless integration with existing workflows
- [ ] Clear visual feedback and state indication
- [ ] Responsive design across device sizes

### Code Quality Criteria
- [ ] Follows existing architectural patterns
- [ ] Comprehensive error handling
- [ ] TypeScript strict mode compliance
- [ ] Inline styling consistency

---

**Implementation Owner**: Development Team
**Technical Review**: Required before Phase 1
**Estimated Completion**: 10 hours over 3-4 days