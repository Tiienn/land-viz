import * as THREE from 'three';

export interface EiffelTowerOptions {
  height?: number;
  baseWidth?: number;
  detailLevel?: 'low' | 'medium' | 'high';
  color?: number;
}

/**
 * Procedurally generates a 3D Eiffel Tower geometry
 * Based on mathematical curves and engineering specifications
 */
export class EiffelTowerGeometry {
  private group: THREE.Group;
  private options: Required<EiffelTowerOptions>;
  private materials: {
    main: THREE.MeshStandardMaterial;
    lattice: THREE.LineBasicMaterial;
    platform: THREE.MeshStandardMaterial;
  };

  constructor(options: EiffelTowerOptions = {}) {
    this.options = {
      height: options.height || 50,
      baseWidth: options.baseWidth || 125,
      detailLevel: options.detailLevel || 'medium',
      color: options.color || 0x8b4513
    };

    this.group = new THREE.Group();
    this.group.name = 'eiffel-tower';

    // Initialize materials
    this.materials = this.createMaterials();

    // Build the tower structure
    this.build();
  }

  /**
   * Create materials for different tower components
   * Enhanced with metallic properties for realistic iron appearance
   */
  private createMaterials() {
    return {
      main: new THREE.MeshStandardMaterial({
        color: 0xB87333, // Copper/bronze metallic color (more vibrant than brown)
        metalness: 0.7,   // High metalness for iron/steel appearance
        roughness: 0.4,   // Moderate roughness for realistic metal
        side: THREE.DoubleSide,
        emissive: 0x3d2817, // Subtle warm glow
        emissiveIntensity: 0.1
      }),
      lattice: new THREE.LineBasicMaterial({
        color: 0xD4A574, // Lighter bronze for lattice contrast
        opacity: 0.8,
        transparent: true,
        linewidth: 2
      }),
      platform: new THREE.MeshStandardMaterial({
        color: 0x708090,  // Slate gray for platforms
        metalness: 0.5,   // Less metallic than main structure
        roughness: 0.3,   // Smoother for modern platform look
        opacity: 0.95,
        transparent: true,
        emissive: 0x404040, // Subtle gray glow
        emissiveIntensity: 0.05
      })
    };
  }

  /**
   * Build the complete tower structure
   */
  private build(): void {
    this.createMainStructure();
    this.createLatticeFramework();
    this.createPlatforms();
    this.createTopSpire();
  }

  /**
   * Create the four main legs of the tower
   */
  private createMainStructure(): void {
    const legGroup = new THREE.Group();
    legGroup.name = 'main-legs';

    // Position of the four legs
    const legPositions = [
      { x: 1, z: 1 },   // Northeast
      { x: 1, z: -1 },  // Southeast
      { x: -1, z: 1 },  // Northwest
      { x: -1, z: -1 }  // Southwest
    ];

    legPositions.forEach((pos, index) => {
      const leg = this.createLeg(pos.x, pos.z, index);
      legGroup.add(leg);
    });

    // Add connecting arches between legs at first level
    this.createArches(legGroup);

    this.group.add(legGroup);
  }

  /**
   * Create a single tower leg with proper curvature
   */
  private createLeg(xMultiplier: number, zMultiplier: number, index: number): THREE.Mesh {
    // Calculate leg curve points based on exponential function
    const points: THREE.Vector3[] = [];
    const segments = this.getSegmentCount();

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = this.options.height * t;

      // Width decreases exponentially with height
      const widthFactor = Math.exp(-2.5 * t);
      const x = xMultiplier * (this.options.baseWidth / 2) * widthFactor;
      const z = zMultiplier * (this.options.baseWidth / 2) * widthFactor;

      points.push(new THREE.Vector3(x, y, z));
    }

    // Ensure we have at least 2 points for the curve
    if (points.length < 2) {
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(0, this.options.height, 0));
    }

    // Create a curve from the points - need at least 2 points
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);

    // Create tube geometry along the curve
    const tubeRadius = this.options.baseWidth * 0.015; // 1.5% of base width
    const radialSegments = 8;
    const geometry = new THREE.TubeGeometry(
      curve,
      segments * 2, // More segments for smoother curve
      tubeRadius,
      radialSegments,
      false
    );

    const mesh = new THREE.Mesh(geometry, this.materials.main);
    mesh.name = `leg-${index}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  /**
   * Create arches between legs at the first level
   */
  private createArches(group: THREE.Group): void {
    const archHeight = this.options.height * 0.25; // Arches at 25% height
    const archWidth = this.options.baseWidth * 0.5;

    // Create four arches connecting the legs
    const archPairs = [
      { start: [1, 1], end: [1, -1] },   // East arch
      { start: [1, -1], end: [-1, -1] }, // South arch
      { start: [-1, -1], end: [-1, 1] }, // West arch
      { start: [-1, 1], end: [1, 1] }    // North arch
    ];

    archPairs.forEach((pair, index) => {
      const arch = this.createArch(
        pair.start[0] * archWidth,
        pair.start[1] * archWidth,
        pair.end[0] * archWidth,
        pair.end[1] * archWidth,
        archHeight
      );
      arch.name = `arch-${index}`;
      group.add(arch);
    });
  }

  /**
   * Create a single arch between two points
   */
  private createArch(x1: number, z1: number, x2: number, z2: number, height: number): THREE.Mesh {
    const points: THREE.Vector3[] = [];
    const segments = 10;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const z = z1 + (z2 - z1) * t;

      // Create arch curve
      const archCurve = Math.sin(t * Math.PI) * 0.2;
      const y = height + archCurve * this.options.height * 0.05;

      points.push(new THREE.Vector3(x, y, z));
    }

    // Ensure we have at least 2 points
    if (points.length < 2) {
      points.push(new THREE.Vector3(x1, height, z1));
      points.push(new THREE.Vector3(x2, height, z2));
    }

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const geometry = new THREE.TubeGeometry(
      curve,
      segments * 2,
      this.options.baseWidth * 0.01,
      6,
      false
    );

    return new THREE.Mesh(geometry, this.materials.main);
  }

  /**
   * Create the lattice framework
   */
  private createLatticeFramework(): void {
    const latticeGroup = new THREE.Group();
    latticeGroup.name = 'lattice-framework';

    const complexity = this.getComplexity();

    // Add diagonal cross-bracing
    this.addDiagonalBracing(latticeGroup, complexity);

    // Add horizontal rings
    this.addHorizontalRings(latticeGroup, complexity);

    this.group.add(latticeGroup);
  }

  /**
   * Add diagonal bracing to the lattice structure
   */
  private addDiagonalBracing(group: THREE.Group, complexity: any): void {
    const geometry = new THREE.BufferGeometry();
    const points: THREE.Vector3[] = [];

    // Create X-pattern braces between legs at different heights
    for (let level = 1; level < complexity.divisions; level++) {
      const y = (level / complexity.divisions) * this.options.height;
      const width = this.calculateWidthAtHeight(y);

      // Create crossing diagonal lines
      // Northeast to Southwest
      points.push(
        new THREE.Vector3(width / 2, y, width / 2),
        new THREE.Vector3(-width / 2, y + this.options.height / complexity.divisions, -width / 2)
      );

      // Northwest to Southeast
      points.push(
        new THREE.Vector3(-width / 2, y, width / 2),
        new THREE.Vector3(width / 2, y + this.options.height / complexity.divisions, -width / 2)
      );
    }

    geometry.setFromPoints(points);
    const lines = new THREE.LineSegments(geometry, this.materials.lattice);
    lines.name = 'diagonal-bracing';
    group.add(lines);
  }

  /**
   * Add horizontal ring supports
   */
  private addHorizontalRings(group: THREE.Group, complexity: any): void {
    for (let level = 1; level < complexity.divisions; level++) {
      const y = (level / complexity.divisions) * this.options.height;
      const radius = this.calculateWidthAtHeight(y) / 2;

      const curve = new THREE.EllipseCurve(
        0, 0,
        radius, radius,
        0, 2 * Math.PI,
        false,
        0
      );

      const points = curve.getPoints(32);
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, y, p.y))
      );

      const ring = new THREE.LineLoop(geometry, this.materials.lattice);
      ring.name = `ring-${level}`;
      group.add(ring);
    }
  }

  /**
   * Create observation platforms at three levels
   */
  private createPlatforms(): void {
    const platformGroup = new THREE.Group();
    platformGroup.name = 'platforms';

    const platformData = [
      { height: 0.18, size: 0.7, name: 'first-floor' },   // First floor at 18%
      { height: 0.36, size: 0.5, name: 'second-floor' },  // Second floor at 36%
      { height: 0.84, size: 0.3, name: 'third-floor' }    // Third floor at 84%
    ];

    platformData.forEach(platform => {
      const y = platform.height * this.options.height;
      const width = this.calculateWidthAtHeight(y) * platform.size;

      const geometry = new THREE.BoxGeometry(width, 0.5, width);
      const mesh = new THREE.Mesh(geometry, this.materials.platform);
      mesh.position.y = y;
      mesh.name = platform.name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      platformGroup.add(mesh);
    });

    this.group.add(platformGroup);
  }

  /**
   * Create the top spire and antenna
   */
  private createTopSpire(): void {
    const spireGroup = new THREE.Group();
    spireGroup.name = 'spire';

    // Main spire cone
    const spireHeight = this.options.height * 0.15;
    const spireRadius = this.calculateWidthAtHeight(this.options.height * 0.85) * 0.1;

    const spireGeometry = new THREE.ConeGeometry(spireRadius, spireHeight, 8);
    const spireMesh = new THREE.Mesh(spireGeometry, this.materials.main);
    spireMesh.position.y = this.options.height * 0.925;
    spireMesh.name = 'spire-cone';

    // Antenna on top
    const antennaGeometry = new THREE.CylinderGeometry(
      spireRadius * 0.1,
      spireRadius * 0.1,
      spireHeight * 0.5,
      4
    );
    const antennaMesh = new THREE.Mesh(antennaGeometry, this.materials.main);
    antennaMesh.position.y = this.options.height;
    antennaMesh.name = 'antenna';

    spireGroup.add(spireMesh);
    spireGroup.add(antennaMesh);

    this.group.add(spireGroup);
  }

  /**
   * Calculate tower width at a given height using exponential curve
   */
  private calculateWidthAtHeight(height: number): number {
    const t = height / this.options.height;
    return this.options.baseWidth * Math.exp(-2.5 * t);
  }

  /**
   * Get segment count based on detail level
   */
  private getSegmentCount(): number {
    const segments = {
      low: 10,
      medium: 20,
      high: 30
    };
    return segments[this.options.detailLevel];
  }

  /**
   * Get complexity settings based on detail level
   */
  private getComplexity() {
    const settings = {
      low: { divisions: 4, crossBraces: 2 },
      medium: { divisions: 8, crossBraces: 4 },
      high: { divisions: 16, crossBraces: 8 }
    };
    return settings[this.options.detailLevel];
  }

  /**
   * Get the complete tower geometry group
   */
  public getGeometry(): THREE.Group {
    return this.group;
  }

  /**
   * Dispose of all geometries and materials
   */
  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    Object.values(this.materials).forEach(material => material.dispose());
  }
}