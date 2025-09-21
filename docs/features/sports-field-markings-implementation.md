# Sports Field Markings Implementation Plan

## Overview
This document outlines the implementation plan for adding realistic field markings (lines, circles, penalty boxes, etc.) to sports field reference objects in the Land Visualizer 3D scene.

## Goal
Transform plain colored rectangles into realistic sports fields with accurate markings when reference objects like soccer fields, basketball courts, and tennis courts are spawned in the 3D scene.

## Current State
- Sports fields render as simple colored rectangles (e.g., green for soccer field)
- No visual markings or lines present
- Reference objects defined in `app/src/data/referenceObjects.ts`
- Rendering handled by `app/src/components/Scene/ReferenceObjectRenderer.tsx`

## Technical Approach

### Strategy: Dynamic Texture Generation
Generate field markings dynamically using HTML Canvas API and apply as textures to 3D meshes.

**Workflow:**
```
User selects sports field → Generate marking texture → Apply to 3D mesh → Cache for reuse
```

### Why This Approach?
- **No external assets required** - All markings generated programmatically
- **Perfect scaling** - Crisp lines at any zoom level
- **Flexible** - Easy to modify colors, styles, or add new sports
- **Performant** - Single texture per field type, cached after first generation

## Implementation Phases

### Phase 1: Foundation Setup (2 days)

#### 1.1 Create Field Markings Configuration
**File:** `app/src/data/fieldMarkingsConfig.ts`

Define specifications for each sport:
```typescript
interface FieldMarkingConfig {
  sport: 'soccer' | 'basketball' | 'tennis' | 'football';
  dimensions: { length: number; width: number };
  markings: {
    lines: LineMarking[];
    circles: CircleMarking[];
    arcs: ArcMarking[];
    rectangles: RectangleMarking[];
  };
  colors: {
    lines: string;
    background?: string;
  };
}
```

#### 1.2 Build Field Markings Service
**File:** `app/src/services/FieldMarkingsService.ts`

Core service responsibilities:
- Generate textures for different sports
- Handle Canvas drawing operations
- Manage texture caching
- Provide texture disposal methods

#### 1.3 Implement Texture Cache
**File:** `app/src/utils/TextureCache.ts`

Caching system to avoid regenerating textures:
- Store generated textures by sport type and dimensions
- Implement LRU cache with size limits
- Handle texture disposal for memory management

### Phase 2: Soccer Field Implementation (2 days)

#### 2.1 Soccer Field Specifications
Based on FIFA standards (105m × 68m field):

**Required Markings:**
- **Boundary lines** - Touchlines and goal lines
- **Halfway line** - Divides field in half vertically
- **Center circle** - 9.15m radius from center point
- **Center spot** - Small circle at field center
- **Penalty areas** - 16.5m × 40.32m boxes at each end
- **Goal areas** - 5.5m × 18.32m boxes at each end
- **Penalty spots** - 11m from each goal
- **Penalty arcs** - 9.15m radius arcs outside penalty boxes
- **Corner arcs** - 1m radius at each corner

#### 2.2 Canvas Drawing Implementation
```typescript
class SoccerFieldDrawer {
  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Scale calculations
    const scale = width / 105; // Based on FIFA standard length
    const lineWidth = 0.12 * scale; // 12cm line width

    // Configure canvas
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = '#FFFFFF';

    // Draw markings...
  }
}
```

#### 2.3 Integration with ReferenceObjectRenderer
Update `ReferenceObjectRenderer.tsx` to:
1. Detect sports field objects
2. Request appropriate texture from FieldMarkingsService
3. Apply texture to material with proper UV mapping

### Phase 3: Extended Sports Support (3 days)

#### 3.1 Basketball Court
**Markings Required:**
- Court boundary lines
- Three-point line (6.75m from basket)
- Free throw lane (key)
- Free throw line
- Center circle
- Half-court line

#### 3.2 Tennis Court
**Markings Required:**
- Singles and doubles sidelines
- Baselines
- Service boxes
- Center service line
- Center mark
- Net line indicator

#### 3.3 American Football Field
**Markings Required:**
- Sidelines and end lines
- Yard lines every 5 yards
- Yard numbers every 10 yards
- Hash marks
- End zones
- Goal line

### Phase 4: Optimization & Polish (2 days)

#### 4.1 Performance Optimization
- Implement texture resolution scaling based on device capabilities
- Add texture compression for mobile devices
- Optimize Canvas drawing operations
- Implement progressive texture loading

#### 4.2 Visual Enhancements
- Add optional grass texture patterns
- Implement mowed stripe effects
- Add slight line imperfections for realism
- Support for weather-worn appearance

## Technical Implementation Details

### File Structure
```
app/src/
├── services/
│   ├── FieldMarkingsService.ts        # Main texture generation service
│   └── fieldDrawers/
│       ├── SoccerFieldDrawer.ts       # Soccer-specific drawing
│       ├── BasketballCourtDrawer.ts   # Basketball-specific drawing
│       └── TennisCourtDrawer.ts       # Tennis-specific drawing
├── utils/
│   ├── TextureCache.ts                # Texture caching system
│   └── canvasHelpers.ts               # Canvas drawing utilities
├── data/
│   └── fieldMarkingsConfig.ts         # Field specifications
├── types/
│   └── fieldMarkings.ts               # TypeScript interfaces
└── components/Scene/
    └── ReferenceObjectRenderer.tsx    # Updated to use textures
```

### Key Classes and Methods

#### FieldMarkingsService
```typescript
class FieldMarkingsService {
  private cache: TextureCache;
  private drawers: Map<SportType, FieldDrawer>;

  generateFieldTexture(sport: SportType, dimensions: Dimensions): THREE.Texture {
    // Check cache
    const cacheKey = this.getCacheKey(sport, dimensions);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Generate new texture
    const canvas = this.createCanvas(dimensions);
    const drawer = this.drawers.get(sport);
    drawer.draw(canvas.getContext('2d'), dimensions);

    // Convert to Three.js texture
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(cacheKey, texture);

    return texture;
  }
}
```

#### Integration in ReferenceObjectRenderer
```typescript
// In ReferenceObjectMesh component
const material = useMemo(() => {
  // Check if this is a sports field that needs markings
  if (object.category === 'sports' && SPORTS_WITH_MARKINGS.includes(object.id)) {
    const texture = fieldMarkingsService.generateFieldTexture(
      object.sportType,
      object.dimensions
    );

    return new THREE.MeshLambertMaterial({
      color: object.material.color,
      map: texture,
      transparent: true,
      opacity: opacity
    });
  }

  // Default material for non-sports objects
  return new THREE.MeshLambertMaterial({
    color: object.material.color,
    transparent: true,
    opacity: opacity
  });
}, [object, opacity]);
```

## Testing Strategy

### Unit Tests
- Field marking calculations and positioning
- Texture generation for each sport type
- Cache operations (set, get, eviction)
- Canvas drawing operations

### Integration Tests
- Texture application to 3D meshes
- Multiple fields rendering simultaneously
- Cache hit/miss scenarios
- Memory cleanup on unmount

### Visual Tests
- Manual verification of marking accuracy
- Comparison with reference images
- Performance testing with multiple fields
- Mobile device testing

### Performance Benchmarks
- Texture generation: < 100ms per field
- Cache retrieval: < 5ms
- Memory usage: < 50MB for all cached textures
- Frame rate: Maintain 60 FPS with 10+ fields

## Implementation Timeline

### Week 1
- **Day 1-2:** Foundation setup (configurations, service structure, cache)
- **Day 3-4:** Soccer field complete implementation
- **Day 5:** Integration and testing

### Week 2
- **Day 1-2:** Basketball and tennis court implementations
- **Day 3:** American football field
- **Day 4:** Performance optimization
- **Day 5:** Final testing and documentation

## Success Criteria

- ✅ Soccer field displays all FIFA-standard markings accurately
- ✅ Basketball court shows proper court lines and three-point arc
- ✅ Tennis court includes all service boxes and lines
- ✅ Textures generate in under 100ms
- ✅ Cache effectively reduces redundant generation
- ✅ Performance remains at 60 FPS with multiple fields
- ✅ System is extensible for adding new sports
- ✅ Code is well-documented and maintainable

## Future Enhancements

### Phase 5 (Future)
- **Dynamic line colors** - Team-specific colors for home/away
- **Animated effects** - Pulsing lines for tutorials or highlights
- **Weather effects** - Wet field appearance, snow coverage
- **Wear patterns** - Realistic worn areas near goals
- **Night mode** - Stadium lighting effects
- **3D elements** - Goal posts, nets, corner flags

### Phase 6 (Future)
- **Other sports** - Hockey rink, baseball diamond, rugby field
- **Custom fields** - User-defined marking patterns
- **Historical fields** - Vintage field marking styles
- **Training grids** - Practice drill markings

## Dependencies

### External Libraries
- Three.js (existing)
- No additional dependencies required

### Internal Dependencies
- `ReferenceObjectRenderer.tsx` - Needs modification
- `referenceObjects.ts` - Add sport type field
- `types/referenceObjects.ts` - Extend interfaces

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|---------|------------|
| Texture generation performance | High | Implement caching and resolution scaling |
| Memory usage with many textures | Medium | LRU cache with size limits |
| Browser Canvas API limitations | Low | Fallback to simpler markings |
| Mobile device compatibility | Medium | Lower resolution textures for mobile |

## Appendix

### A. FIFA Soccer Field Specifications
- Field: 105m × 68m (international standard)
- Goal: 7.32m × 2.44m
- Penalty area: 16.5m deep × 40.32m wide
- Goal area: 5.5m deep × 18.32m wide
- Center circle radius: 9.15m
- Penalty spot: 11m from goal
- Corner arc radius: 1m
- Line width: 12cm maximum

### B. Canvas Texture Best Practices
- Use power-of-2 dimensions when possible (1024, 2048)
- Clear canvas before drawing
- Use `imageSmoothingEnabled = false` for crisp lines
- Dispose textures when no longer needed
- Consider device pixel ratio for retina displays

### C. Three.js Texture Optimization
- Set appropriate min/mag filters
- Disable mipmapping for UI textures
- Use `needsUpdate` flag sparingly
- Consider texture atlasing for multiple fields

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Author: Land Visualizer Development Team*