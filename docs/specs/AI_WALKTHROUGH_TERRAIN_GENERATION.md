# AI-Powered Walkthrough Terrain Generation

> **Implementation Guide for Opus 4.5**
>
> Feature: Transform 2D site boundaries into immersive 3D walkthrough experiences with AI-generated terrain textures.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Overview](#feature-overview)
3. [User Experience Flow](#user-experience-flow)
4. [Technical Architecture](#technical-architecture)
5. [Phase 1: Fences & Auto-Detect Walkable Areas](#phase-1-fences--auto-detect-walkable-areas)
6. [Phase 2: Boundary Collision & Smart Terrain](#phase-2-boundary-collision--smart-terrain)
7. [Phase 3: AI Terrain Texture Generation](#phase-3-ai-terrain-texture-generation)
8. [API Specifications](#api-specifications)
9. [Performance Requirements](#performance-requirements)
10. [Testing Requirements](#testing-requirements)
11. [File Structure](#file-structure)
12. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### Problem Statement
Users draw shapes or upload site plans (via Auto-Detect), but struggle to understand the actual **scale** of their land. A 500m² site is just a number - users need to **experience** it.

### Solution
When users upload a site plan through Auto-Detect:
1. Detected boundaries become **walkable 3D areas**
2. **Fences/walls** visualize property boundaries
3. **AI-generated textures** create realistic terrain (grass, concrete, dirt)
4. Users walk through in **first-person** to feel the scale

### Key Behaviors
| Input Method | 3D Behavior | Boundary Visibility |
|--------------|-------------|---------------------|
| Draw shape (rectangle, circle, polygon) | 3D building/wall (existing) | Shape is extruded |
| Auto-Detect (upload site plan) | **Walkable area** | Fence/wall at edges |

---

## Feature Overview

### Goals
1. **Scale Understanding**: Let users experience land size in first-person
2. **Boundary Visualization**: Clear fences/walls show property limits
3. **Immersive Environment**: AI-generated textures create realistic terrain
4. **Seamless UX**: Auto-Detect → instant walkthrough world

### Non-Goals
- Full game engine (no NPCs, quests, etc.)
- Real-time AI generation (textures generated once, then cached)
- Multiplayer walkthrough

---

## User Experience Flow

### Flow 1: Auto-Detect → Walkthrough

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User clicks "Auto-Detect" in ribbon                         │
│  2. Upload site plan image (PNG/JPG/PDF)                        │
│  3. AI detects boundaries → shows preview with confidence       │
│  4. User selects boundaries to import                           │
│  5. User clicks "Generate 3D World" button (NEW)                │
│  6. System generates:                                           │
│     - Walkable terrain inside boundary                          │
│     - Fence/wall at boundary edges                              │
│     - AI-generated ground texture (Phase 3)                     │
│  7. Auto-enters walkthrough mode                                │
│  8. User walks inside boundary to experience scale              │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Manual Shape → Standard 3D

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User draws rectangle/circle/polygon                         │
│  2. Shape appears in 2D canvas                                  │
│  3. Press V twice → Walkthrough mode                            │
│  4. Shape is extruded as 3D building (EXISTING BEHAVIOR)        │
│  5. User walks AROUND the shape (not inside)                    │
└─────────────────────────────────────────────────────────────────┘
```

### UI Components (New/Modified)

1. **"Generate 3D World" Button** - In Auto-Detect preview modal
2. **Terrain Type Selector** - Dropdown: Grass, Concrete, Dirt, Gravel, Sand
3. **Fence Style Selector** - Dropdown: Wooden Fence, Metal Fence, Stone Wall, Hedge
4. **Loading Indicator** - During AI texture generation (Phase 3)

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Auto-Detect │→ │ Boundary    │→ │ WalkthroughTerrainGen   │  │
│  │ Service     │  │ Store       │  │ (NEW Component)         │  │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘  │
│                                                 │                │
│  ┌─────────────────────────────────────────────▼─────────────┐  │
│  │                  SceneManager.tsx                          │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Fence       │ │ Terrain     │ │ Boundary            │  │  │
│  │  │ Renderer    │ │ Generator   │ │ Collision           │  │  │
│  │  │ (NEW)       │ │ (Modified)  │ │ (NEW)               │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     Backend (Phase 3 Only)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ AI Texture Generation API                                   ││
│  │ - Stable Diffusion / DALL-E integration                     ││
│  │ - Texture caching (S3/CloudFlare)                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```typescript
// Boundary from Auto-Detect
interface DetectedBoundary {
  id: string;
  points: Array<{ x: number; y: number }>; // World coordinates (meters)
  area: number;        // m²
  perimeter: number;   // m
  confidence: number;  // 0-1
  isWalkable: boolean; // NEW: true for Auto-Detect, false for drawn shapes
}

// Walkthrough Terrain Configuration
interface WalkthroughTerrainConfig {
  boundary: DetectedBoundary;
  terrainType: 'grass' | 'concrete' | 'dirt' | 'gravel' | 'sand';
  fenceStyle: 'wooden' | 'metal' | 'stone' | 'hedge' | 'none';
  fenceHeight: number; // meters (default: 1.5)
  enableAITexture: boolean; // Phase 3
  aiTexturePrompt?: string; // Phase 3: "lush green grass with wildflowers"
}
```

---

## Phase 1: Fences & Auto-Detect Walkable Areas

### Scope
- Add fence/wall rendering at boundary edges
- Mark Auto-Detect boundaries as "walkable areas"
- Add "Generate 3D World" button to Auto-Detect modal

### Implementation Details

#### 1.1 New Component: `BoundaryFenceRenderer.tsx`

**Location**: `app/src/components/Scene/BoundaryFenceRenderer.tsx`

**Purpose**: Render 3D fences/walls along boundary edges

```typescript
import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface BoundaryFenceRendererProps {
  /** Boundary points in world coordinates (meters) */
  points: Array<{ x: number; y: number }>;
  /** Fence style */
  style: 'wooden' | 'metal' | 'stone' | 'hedge';
  /** Fence height in meters */
  height?: number;
  /** Post spacing in meters */
  postSpacing?: number;
}

// Fence style configurations
const FENCE_STYLES = {
  wooden: {
    postColor: '#8B4513',      // Saddle brown
    railColor: '#A0522D',      // Sienna
    postWidth: 0.1,            // 10cm posts
    railHeight: 0.05,          // 5cm rails
    railCount: 3,              // 3 horizontal rails
  },
  metal: {
    postColor: '#2F4F4F',      // Dark slate gray
    railColor: '#696969',      // Dim gray
    postWidth: 0.05,           // 5cm posts
    railHeight: 0.02,          // 2cm rails
    railCount: 4,              // 4 horizontal rails
  },
  stone: {
    postColor: '#696969',      // Dim gray
    wallColor: '#808080',      // Gray
    wallThickness: 0.3,        // 30cm thick wall
  },
  hedge: {
    color: '#228B22',          // Forest green
    width: 0.5,                // 50cm wide hedge
    leafDensity: 100,          // Leaf instances per meter
  },
};

export default function BoundaryFenceRenderer({
  points,
  style,
  height = 1.5,
  postSpacing = 2.0,
}: BoundaryFenceRendererProps) {
  // Implementation: Generate fence geometry along boundary edges
  // Use instanced meshes for performance (many posts/rails)

  const fenceGeometry = useMemo(() => {
    // For each edge (point[i] to point[i+1]):
    // 1. Calculate edge length and direction
    // 2. Place posts at postSpacing intervals
    // 3. Connect posts with rails (wooden/metal) or solid wall (stone) or hedge mesh

    // Return array of mesh data for rendering
  }, [points, style, height, postSpacing]);

  // Render based on style
  if (style === 'wooden' || style === 'metal') {
    return <PostAndRailFence {...} />;
  } else if (style === 'stone') {
    return <StoneWallFence {...} />;
  } else if (style === 'hedge') {
    return <HedgeFence {...} />;
  }
}
```

#### 1.2 Fence Geometry Generation Algorithm

```typescript
/**
 * Generate fence posts and rails along a boundary edge
 *
 * @param start - Start point {x, y} in world coordinates
 * @param end - End point {x, y} in world coordinates
 * @param postSpacing - Distance between posts (meters)
 * @param height - Fence height (meters)
 * @returns Array of post and rail positions/rotations
 */
function generateFenceSegment(
  start: { x: number; y: number },
  end: { x: number; y: number },
  postSpacing: number,
  height: number
): FenceSegmentData {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const postCount = Math.ceil(length / postSpacing) + 1;
  const actualSpacing = length / (postCount - 1);

  const posts: PostData[] = [];
  const rails: RailData[] = [];

  for (let i = 0; i < postCount; i++) {
    const t = i / (postCount - 1);
    const x = start.x + dx * t;
    const z = start.y + dy * t; // Y in 2D → Z in 3D
    const y = height / 2; // Center of post

    posts.push({
      position: [x, y, z],
      rotation: [0, angle, 0],
      height: height,
    });

    // Add rails between posts (except after last post)
    if (i < postCount - 1) {
      const railPositions = [0.3, 0.6, 0.9].map(h => h * height); // 3 rails
      railPositions.forEach(railY => {
        rails.push({
          position: [x + dx * 0.5 / (postCount - 1), railY, z + dy * 0.5 / (postCount - 1)],
          rotation: [0, angle, 0],
          length: actualSpacing,
        });
      });
    }
  }

  return { posts, rails };
}
```

#### 1.3 Modify Auto-Detect Modal

**File**: `app/src/components/BoundaryDetection/BoundaryDetectionModal.tsx`

**Changes**:
1. Add "Generate 3D World" button (primary action)
2. Add terrain type dropdown
3. Add fence style dropdown
4. Store selection in boundary data

```typescript
// Add to modal state
const [terrainType, setTerrainType] = useState<TerrainType>('grass');
const [fenceStyle, setFenceStyle] = useState<FenceStyle>('wooden');

// Add to modal footer
<button
  onClick={() => handleGenerate3DWorld()}
  className="primary-button"
>
  Generate 3D World
</button>

// Handler
const handleGenerate3DWorld = () => {
  const selectedBoundaries = boundaries.filter(b => b.selected);

  selectedBoundaries.forEach(boundary => {
    // Mark as walkable area
    boundary.isWalkable = true;
    boundary.terrainType = terrainType;
    boundary.fenceStyle = fenceStyle;
  });

  // Import boundaries
  onImport(selectedBoundaries);

  // Auto-enter walkthrough mode
  setViewMode('walkthrough');

  // Close modal
  onClose();
};
```

#### 1.4 Modify SceneManager.tsx

**Changes**:
1. Render `BoundaryFenceRenderer` for walkable boundaries
2. Conditionally render terrain inside walkable boundaries

```typescript
// In SceneManager.tsx, add to walkthrough mode rendering:

{isWalkthrough && walkableBoundaries.map(boundary => (
  <React.Fragment key={boundary.id}>
    {/* Fence around boundary */}
    <BoundaryFenceRenderer
      points={boundary.points}
      style={boundary.fenceStyle}
      height={1.5}
    />

    {/* Terrain inside boundary (Phase 2) */}
    {/* <BoundaryTerrain boundary={boundary} /> */}
  </React.Fragment>
))}
```

### Phase 1 Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| `BoundaryFenceRenderer.tsx` | NEW | Renders fences along boundaries |
| `BoundaryDetectionModal.tsx` | MODIFY | Add "Generate 3D World" button |
| `SceneManager.tsx` | MODIFY | Render fences in walkthrough |
| `useAppStore.ts` | MODIFY | Add `walkableBoundaries` state |

---

## Phase 2: Boundary Collision & Smart Terrain

### Scope
- Prevent player from walking outside boundary
- Generate terrain ONLY inside boundary
- Vegetation respects boundary edges

### Implementation Details

#### 2.1 Boundary Collision Detection

**File**: `app/src/utils/boundaryCollision.ts`

```typescript
/**
 * Check if a point is inside a polygon using ray casting algorithm
 *
 * @param point - Point to check {x, z} in world coordinates
 * @param polygon - Array of polygon vertices [{x, y}]
 * @returns true if point is inside polygon
 */
export function isPointInsidePolygon(
  point: { x: number; z: number },
  polygon: Array<{ x: number; y: number }>
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y; // y in 2D = z in 3D
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if (
      ((yi > point.z) !== (yj > point.z)) &&
      (point.x < (xj - xi) * (point.z - yi) / (yj - yi) + xi)
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Find the closest point on the boundary edge
 * Used to push player back when they try to exit
 *
 * @param point - Player position
 * @param polygon - Boundary vertices
 * @returns Closest point on boundary edge
 */
export function closestPointOnBoundary(
  point: { x: number; z: number },
  polygon: Array<{ x: number; y: number }>
): { x: number; z: number; distance: number } {
  let closestPoint = { x: 0, z: 0 };
  let minDistance = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const edge = closestPointOnLineSegment(
      point,
      { x: polygon[i].x, z: polygon[i].y },
      { x: polygon[j].x, z: polygon[j].y }
    );

    if (edge.distance < minDistance) {
      minDistance = edge.distance;
      closestPoint = { x: edge.x, z: edge.z };
    }
  }

  return { ...closestPoint, distance: minDistance };
}

/**
 * Constrain player movement to stay inside boundary
 *
 * @param currentPos - Current player position
 * @param desiredPos - Desired position after movement
 * @param boundary - Boundary polygon
 * @param margin - Distance to keep from boundary edge (meters)
 * @returns Constrained position (inside boundary)
 */
export function constrainToBoundary(
  currentPos: { x: number; z: number },
  desiredPos: { x: number; z: number },
  boundary: Array<{ x: number; y: number }>,
  margin: number = 0.5
): { x: number; z: number } {
  // If desired position is inside, allow it
  if (isPointInsidePolygon(desiredPos, boundary)) {
    // Check margin distance
    const closest = closestPointOnBoundary(desiredPos, boundary);
    if (closest.distance >= margin) {
      return desiredPos; // Safe to move
    }
    // Too close to edge, push back
    const pushDirection = {
      x: desiredPos.x - closest.x,
      z: desiredPos.z - closest.z,
    };
    const pushLength = Math.sqrt(pushDirection.x ** 2 + pushDirection.z ** 2);
    if (pushLength > 0) {
      return {
        x: closest.x + (pushDirection.x / pushLength) * margin,
        z: closest.z + (pushDirection.z / pushLength) * margin,
      };
    }
  }

  // Desired position is outside, stay at current position
  // (or slide along boundary edge for smoother feel)
  return currentPos;
}
```

#### 2.2 Integrate Collision into WalkthroughCamera.tsx

```typescript
// In WalkthroughCamera.tsx, modify the movement update:

import { constrainToBoundary } from '../../utils/boundaryCollision';

// Inside useFrame:
const handleMovement = () => {
  // ... existing movement calculation ...

  const desiredPosition = {
    x: currentPosition.x + movement.x,
    z: currentPosition.z + movement.z,
  };

  // If there's an active walkable boundary, constrain movement
  if (activeWalkableBoundary) {
    const constrainedPos = constrainToBoundary(
      { x: currentPosition.x, z: currentPosition.z },
      desiredPosition,
      activeWalkableBoundary.points,
      0.5 // 50cm margin from fence
    );

    desiredPosition.x = constrainedPos.x;
    desiredPosition.z = constrainedPos.z;
  }

  // Apply constrained position
  camera.position.x = desiredPosition.x;
  camera.position.z = desiredPosition.z;
};
```

#### 2.3 Smart Terrain Generation (Inside Boundary Only)

**File**: `app/src/components/Scene/BoundaryTerrain.tsx`

```typescript
import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface BoundaryTerrainProps {
  boundary: DetectedBoundary;
  terrainType: 'grass' | 'concrete' | 'dirt' | 'gravel' | 'sand';
  resolution?: number; // Vertices per meter
}

export default function BoundaryTerrain({
  boundary,
  terrainType,
  resolution = 2,
}: BoundaryTerrainProps) {
  const terrainGeometry = useMemo(() => {
    // 1. Create bounding box of boundary
    const bounds = getBoundingBox(boundary.points);

    // 2. Create grid of vertices
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const segmentsX = Math.ceil(width * resolution);
    const segmentsY = Math.ceil(height * resolution);

    const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const positions = geometry.attributes.position;

    // 3. For each vertex, check if inside boundary
    // If outside, mark for removal or set to boundary edge
    const insideMask: boolean[] = [];

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) + bounds.minX + width / 2;
      const y = positions.getY(i) + bounds.minY + height / 2;

      insideMask[i] = isPointInsidePolygon({ x, z: y }, boundary.points);
    }

    // 4. Create new geometry with only inside vertices
    // Or use alpha masking in shader

    return geometry;
  }, [boundary, resolution]);

  const terrainMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: TERRAIN_COLORS[terrainType],
      roughness: 0.9,
      metalness: 0.0,
    });
  }, [terrainType]);

  return (
    <mesh
      geometry={terrainGeometry}
      material={terrainMaterial}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]} // Slightly above base to prevent z-fighting
      receiveShadow
    />
  );
}

const TERRAIN_COLORS = {
  grass: '#7BC14E',
  concrete: '#A0A0A0',
  dirt: '#8B6914',
  gravel: '#808080',
  sand: '#C2B280',
};
```

#### 2.4 Vegetation Inside Boundary Only

Modify vegetation components to only spawn inside boundary:

```typescript
// In InstancedGrass.tsx, InstancedFlowers.tsx, etc.

interface VegetationProps {
  boundary?: Array<{ x: number; y: number }>; // Optional boundary constraint
  // ... other props
}

// In the position generation loop:
for (let i = 0; i < count; i++) {
  let x, z;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    x = (Math.random() - 0.5) * areaSize;
    z = (Math.random() - 0.5) * areaSize;
    attempts++;
  } while (
    boundary &&
    !isPointInsidePolygon({ x, z }, boundary) &&
    attempts < maxAttempts
  );

  if (attempts < maxAttempts) {
    // Place vegetation at (x, 0, z)
  }
}
```

### Phase 2 Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| `boundaryCollision.ts` | NEW | Point-in-polygon & collision utilities |
| `BoundaryTerrain.tsx` | NEW | Terrain mesh inside boundary only |
| `WalkthroughCamera.tsx` | MODIFY | Add boundary collision |
| `InstancedGrass.tsx` | MODIFY | Respect boundary constraint |
| `InstancedFlowers.tsx` | MODIFY | Respect boundary constraint |
| `StylizedTrees.tsx` | MODIFY | Respect boundary constraint |

---

## Phase 3: AI Terrain Texture Generation

### Scope
- Integrate AI image generation (Stable Diffusion / DALL-E)
- Generate realistic terrain textures based on site type
- Cache generated textures for performance

### Architecture Options

#### Option A: DALL-E API (Recommended for MVP)

**Pros**: No infrastructure, simple API, high quality
**Cons**: Cost ($0.04-0.08 per 1024x1024 image), requires API key

```typescript
// Backend: /api/generate-texture.ts

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateTerrainTexture(
  terrainType: string,
  style: string,
  size: '256x256' | '512x512' | '1024x1024' = '512x512'
): Promise<string> {
  const prompts = {
    grass: 'Seamless tileable grass texture, lush green lawn, top-down view, photorealistic, 8k',
    concrete: 'Seamless tileable concrete texture, gray cement floor, top-down view, photorealistic',
    dirt: 'Seamless tileable dirt texture, brown earth soil, top-down view, photorealistic',
    gravel: 'Seamless tileable gravel texture, small gray stones, top-down view, photorealistic',
    sand: 'Seamless tileable sand texture, beach sand, top-down view, photorealistic',
  };

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompts[terrainType] || prompts.grass,
    n: 1,
    size: size,
    quality: 'standard',
    response_format: 'url',
  });

  return response.data[0].url;
}
```

#### Option B: Stable Diffusion (Self-Hosted)

**Pros**: No per-image cost, full control, can run locally
**Cons**: Requires GPU server, more complex setup

```typescript
// Backend: /api/generate-texture-sd.ts

export async function generateTerrainTextureSD(
  terrainType: string,
  options: {
    width?: number;
    height?: number;
    steps?: number;
  } = {}
): Promise<Buffer> {
  const { width = 512, height = 512, steps = 20 } = options;

  const prompts = {
    grass: 'seamless tileable grass texture, lush green, top down, 8k, photorealistic',
    // ... other prompts
  };

  const response = await fetch(process.env.STABLE_DIFFUSION_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompts[terrainType],
      negative_prompt: 'blurry, low quality, watermark, text',
      width,
      height,
      steps,
      cfg_scale: 7,
      sampler_name: 'DPM++ 2M Karras',
    }),
  });

  const result = await response.json();
  return Buffer.from(result.images[0], 'base64');
}
```

#### Option C: Replicate API (Balanced)

**Pros**: Pay-per-use, many models available, no server management
**Cons**: Slightly slower than self-hosted

```typescript
// Backend: /api/generate-texture-replicate.ts

import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function generateTerrainTextureReplicate(
  terrainType: string
): Promise<string> {
  const output = await replicate.run(
    'stability-ai/stable-diffusion:latest',
    {
      input: {
        prompt: `seamless tileable ${terrainType} texture, top-down view, photorealistic, 8k`,
        negative_prompt: 'blurry, watermark, text',
        width: 512,
        height: 512,
        num_inference_steps: 25,
      },
    }
  );

  return output[0]; // URL to generated image
}
```

### 3.1 Frontend Integration

**File**: `app/src/services/aiTextureService.ts`

```typescript
interface GenerateTextureOptions {
  terrainType: 'grass' | 'concrete' | 'dirt' | 'gravel' | 'sand' | 'custom';
  customPrompt?: string;
  size?: '256' | '512' | '1024';
}

interface GenerateTextureResult {
  textureUrl: string;
  cached: boolean;
  generationTime: number; // ms
}

/**
 * Generate or retrieve cached AI terrain texture
 */
export async function generateTerrainTexture(
  options: GenerateTextureOptions
): Promise<GenerateTextureResult> {
  const cacheKey = `terrain-${options.terrainType}-${options.size || '512'}`;

  // Check local cache first
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    return {
      textureUrl: cached,
      cached: true,
      generationTime: 0,
    };
  }

  // Generate new texture via API
  const startTime = Date.now();

  const response = await fetch('/api/generate-texture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error('Failed to generate texture');
  }

  const result = await response.json();

  // Cache the result
  localStorage.setItem(cacheKey, result.textureUrl);

  return {
    textureUrl: result.textureUrl,
    cached: false,
    generationTime: Date.now() - startTime,
  };
}
```

### 3.2 Apply AI Texture to Terrain

```typescript
// In BoundaryTerrain.tsx, modify to use AI texture:

const [texture, setTexture] = useState<THREE.Texture | null>(null);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  if (enableAITexture) {
    setIsLoading(true);
    generateTerrainTexture({ terrainType, size: '512' })
      .then(result => {
        const loader = new THREE.TextureLoader();
        loader.load(result.textureUrl, tex => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(10, 10); // Tile the texture
          setTexture(tex);
          setIsLoading(false);
        });
      })
      .catch(err => {
        console.error('AI texture generation failed:', err);
        setIsLoading(false);
      });
  }
}, [terrainType, enableAITexture]);

// In material:
const terrainMaterial = useMemo(() => {
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: texture ? '#FFFFFF' : TERRAIN_COLORS[terrainType],
    roughness: 0.9,
    metalness: 0.0,
  });
}, [texture, terrainType]);
```

### 3.3 Loading UI During Generation

```typescript
// In Generate3DWorld button handler:

const [isGenerating, setIsGenerating] = useState(false);
const [generationProgress, setGenerationProgress] = useState('');

const handleGenerate3DWorld = async () => {
  setIsGenerating(true);
  setGenerationProgress('Generating terrain texture...');

  try {
    // Pre-generate texture before entering walkthrough
    if (enableAITexture) {
      await generateTerrainTexture({ terrainType, size: '512' });
    }

    setGenerationProgress('Building 3D world...');

    // ... rest of generation logic

    setViewMode('walkthrough');
  } catch (error) {
    toast.error('Failed to generate 3D world');
  } finally {
    setIsGenerating(false);
  }
};

// In modal:
{isGenerating && (
  <div className="generation-overlay">
    <Spinner />
    <p>{generationProgress}</p>
  </div>
)}
```

### Phase 3 Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| `/api/generate-texture.ts` | NEW (Backend) | AI texture generation endpoint |
| `aiTextureService.ts` | NEW | Frontend API client + caching |
| `BoundaryTerrain.tsx` | MODIFY | Apply AI textures |
| `BoundaryDetectionModal.tsx` | MODIFY | Loading UI during generation |
| Environment variables | NEW | `OPENAI_API_KEY` or equivalent |

---

## API Specifications

### Backend Endpoint: Generate Texture

**POST /api/generate-texture**

Request:
```json
{
  "terrainType": "grass",
  "customPrompt": "lush green grass with small wildflowers",
  "size": "512"
}
```

Response:
```json
{
  "success": true,
  "textureUrl": "https://cdn.example.com/textures/abc123.png",
  "generationTime": 2340,
  "cached": false
}
```

Errors:
```json
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

---

## Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Fence rendering | < 2ms per frame | 60+ FPS with 500m perimeter |
| Collision detection | < 0.5ms per check | Point-in-polygon with 100 vertices |
| AI texture generation | < 10s | End-to-end including network |
| Texture cache hit rate | > 90% | After first generation |
| Memory usage | < 50MB | Walkthrough mode total |

### Optimization Strategies

1. **Fence Rendering**: Use instanced meshes for posts/rails
2. **Collision**: Spatial hashing for large boundaries (>50 vertices)
3. **Textures**: Compress to WebP, use 512x512 for tiling
4. **Vegetation**: LOD system - reduce detail at distance

---

## Testing Requirements

### Phase 1 Tests

```typescript
// tests/unit/BoundaryFenceRenderer.test.ts

describe('BoundaryFenceRenderer', () => {
  it('should render correct number of posts for given spacing', () => {
    const boundary = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    // 4 edges, 10m each, 2m spacing = 5 posts per edge = 20 posts total
  });

  it('should handle non-rectangular boundaries', () => {
    const triangleBoundary = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 8.66 },
    ];
    // Should render fence along all 3 edges
  });

  it('should render different fence styles correctly', () => {
    // Test wooden, metal, stone, hedge styles
  });
});
```

### Phase 2 Tests

```typescript
// tests/unit/boundaryCollision.test.ts

describe('isPointInsidePolygon', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it('should return true for point inside', () => {
    expect(isPointInsidePolygon({ x: 5, z: 5 }, square)).toBe(true);
  });

  it('should return false for point outside', () => {
    expect(isPointInsidePolygon({ x: 15, z: 5 }, square)).toBe(false);
  });

  it('should handle edge cases (on boundary)', () => {
    expect(isPointInsidePolygon({ x: 0, z: 5 }, square)).toBe(true); // On edge
  });

  it('should handle concave polygons', () => {
    const lShape = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(isPointInsidePolygon({ x: 7, z: 7 }, lShape)).toBe(false);
    expect(isPointInsidePolygon({ x: 2, z: 7 }, lShape)).toBe(true);
  });
});

describe('constrainToBoundary', () => {
  it('should allow movement inside boundary', () => {
    // Test that valid movement is not constrained
  });

  it('should block movement outside boundary', () => {
    // Test that movement past edge is stopped
  });

  it('should slide along boundary edge', () => {
    // Test smooth movement along fence
  });
});
```

### Phase 3 Tests

```typescript
// tests/integration/aiTexture.test.ts

describe('AI Texture Generation', () => {
  it('should generate texture within timeout', async () => {
    const result = await generateTerrainTexture({ terrainType: 'grass' });
    expect(result.textureUrl).toMatch(/^https?:\/\//);
    expect(result.generationTime).toBeLessThan(15000);
  });

  it('should cache generated textures', async () => {
    // First call - generates
    const first = await generateTerrainTexture({ terrainType: 'grass' });
    expect(first.cached).toBe(false);

    // Second call - cached
    const second = await generateTerrainTexture({ terrainType: 'grass' });
    expect(second.cached).toBe(true);
    expect(second.generationTime).toBe(0);
  });

  it('should handle API failures gracefully', async () => {
    // Mock API failure
    // Should fall back to procedural texture
  });
});
```

### E2E Tests

```typescript
// tests/e2e/walkthrough-terrain.spec.ts

describe('Walkthrough Terrain Generation', () => {
  it('should generate walkable area from Auto-Detect', async () => {
    // 1. Upload site plan
    // 2. Detect boundaries
    // 3. Click "Generate 3D World"
    // 4. Verify walkthrough mode activates
    // 5. Verify fence is visible
    // 6. Verify player cannot walk outside boundary
  });
});
```

---

## File Structure

```
app/src/
├── components/
│   ├── BoundaryDetection/
│   │   ├── BoundaryDetectionModal.tsx    # MODIFY: Add Generate 3D World button
│   │   └── ...
│   └── Scene/
│       ├── BoundaryFenceRenderer.tsx     # NEW: Render fences
│       ├── BoundaryTerrain.tsx           # NEW: Terrain inside boundary
│       ├── SceneManager.tsx              # MODIFY: Integrate new components
│       └── WalkthroughCamera.tsx         # MODIFY: Add collision
├── services/
│   └── aiTextureService.ts               # NEW: AI texture API client
├── utils/
│   └── boundaryCollision.ts              # NEW: Collision utilities
├── store/
│   └── useAppStore.ts                    # MODIFY: Add walkable boundary state
└── types/
    └── index.ts                          # MODIFY: Add new types

api/ (Backend - Phase 3)
├── generate-texture.ts                   # NEW: AI generation endpoint
└── ...

docs/specs/
└── AI_WALKTHROUGH_TERRAIN_GENERATION.md  # This file
```

---

## Implementation Checklist

### Phase 1 (Fences & Auto-Detect Walkable Areas)

- [ ] Create `BoundaryFenceRenderer.tsx` component
- [ ] Implement fence geometry generation algorithm
- [ ] Add fence style configurations (wooden, metal, stone, hedge)
- [ ] Modify `BoundaryDetectionModal.tsx` with "Generate 3D World" button
- [ ] Add terrain type dropdown to modal
- [ ] Add fence style dropdown to modal
- [ ] Modify `useAppStore.ts` to track walkable boundaries
- [ ] Integrate fence rendering in `SceneManager.tsx`
- [ ] Auto-enter walkthrough mode after generation
- [ ] Write unit tests for fence rendering
- [ ] Manual testing: verify fences appear correctly

### Phase 2 (Boundary Collision & Smart Terrain)

- [ ] Create `boundaryCollision.ts` utility
- [ ] Implement `isPointInsidePolygon()` function
- [ ] Implement `closestPointOnBoundary()` function
- [ ] Implement `constrainToBoundary()` function
- [ ] Integrate collision in `WalkthroughCamera.tsx`
- [ ] Create `BoundaryTerrain.tsx` component
- [ ] Modify vegetation components to respect boundary
- [ ] Write unit tests for collision detection
- [ ] Manual testing: verify player cannot exit boundary

### Phase 3 (AI Terrain Texture Generation)

- [ ] Choose AI provider (DALL-E / Stable Diffusion / Replicate)
- [ ] Set up backend endpoint `/api/generate-texture`
- [ ] Create `aiTextureService.ts` frontend client
- [ ] Implement texture caching (localStorage + CDN)
- [ ] Add loading UI during generation
- [ ] Apply AI textures to `BoundaryTerrain.tsx`
- [ ] Implement fallback to procedural textures
- [ ] Write integration tests for AI generation
- [ ] Performance optimization (compression, caching)
- [ ] Cost monitoring and rate limiting

---

## Appendix: Visual Reference

### Fence Styles

```
WOODEN FENCE:
  |     |     |     |
--|-----|-----|-----|--
  |     |     |     |
--|-----|-----|-----|--
  |     |     |     |

METAL FENCE:
  │     │     │     │
──┼─────┼─────┼─────┼──
──┼─────┼─────┼─────┼──
──┼─────┼─────┼─────┼──
  │     │     │     │

STONE WALL:
┌─────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└─────────────────────┘

HEDGE:
  ☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘
  ☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘
  ☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘☘
```

### Walkthrough View (Concept)

```
┌─────────────────────────────────────────┐
│  SKY (blue with clouds)                  │
├─────────────────────────────────────────┤
│        ┌──────────────────┐             │
│        │   FENCE LINE     │             │
│  TREES │   ╔═══════════╗  │  TREES      │
│   🌳   │   ║  TERRAIN  ║  │   🌳        │
│   🌳   │   ║  (grass)  ║  │   🌳        │
│        │   ║     👤     ║  │             │
│        │   ║  (player) ║  │             │
│        │   ╚═══════════╝  │             │
│        └──────────────────┘             │
│  GRASS GROUND                            │
└─────────────────────────────────────────┘
```

---

## Questions for Implementation

1. **Backend Choice**: Does the project already have a backend? If not, what framework should be used (Next.js API routes, Express, etc.)?

2. **AI Provider**: Which AI provider is preferred for texture generation?
   - DALL-E (OpenAI) - Simplest, highest quality, ~$0.04/image
   - Stable Diffusion (self-hosted) - No per-image cost, requires GPU
   - Replicate - Balance of cost and simplicity

3. **Fence Customization**: Should users be able to customize fence height, color, or material beyond the presets?

4. **Multiple Boundaries**: If multiple boundaries are detected, should they each become separate walkable areas, or should they be merged?

5. **Performance Budget**: What's the target device for walkthrough mode? (Desktop only, or also mobile/tablet?)

---

*Document Version: 1.0*
*Created: November 2024*
*Author: Claude (Sonnet 4.5)*
*For Implementation By: Claude (Opus 4.5)*
