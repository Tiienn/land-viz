import * as THREE from 'three';

export interface StatueOfLibertyOptions {
  height?: number;
  baseWidth?: number;
  detailLevel?: 'low' | 'medium' | 'high';
  color?: number;
}

export class StatueOfLibertyGeometry {
  private options: Required<StatueOfLibertyOptions>;
  private geometry: THREE.Group;
  private materials: { [key: string]: THREE.Material } = {};

  constructor(options: StatueOfLibertyOptions = {}) {
    this.options = {
      height: options.height || 47, // Scaled height for visualization (actual is 93m with pedestal)
      baseWidth: options.baseWidth || 65, // Base dimensions from reference objects
      detailLevel: options.detailLevel || 'medium',
      color: options.color || 0x2e8b57 // Sea green color representing patina
    };

    this.geometry = new THREE.Group();
    this.geometry.name = 'statue-of-liberty';
    this.build();
  }

  private build(): void {
    this.createMaterials();
    this.createPedestal();
    this.createStatueBase();
    this.createStatueBody();
    this.createArms();
    this.createHead();
    this.createCrown();
    this.createTorch();
    this.createTablet();
    this.createDraping();
  }

  private createMaterials(): void {
    const baseColor = new THREE.Color(this.options.color);
    const lightColor = new THREE.Color(this.options.color).multiplyScalar(1.2);
    const darkColor = new THREE.Color(this.options.color).multiplyScalar(0.8);

    // Copper patina material (main statue)
    this.materials.statue = new THREE.MeshLambertMaterial({
      color: baseColor,
      transparent: false,
      side: THREE.DoubleSide
    });

    // Darker material for shadows and recesses
    this.materials.shadow = new THREE.MeshLambertMaterial({
      color: darkColor,
      transparent: false
    });

    // Lighter material for highlights
    this.materials.highlight = new THREE.MeshLambertMaterial({
      color: lightColor,
      transparent: false
    });

    // Pedestal material (stone)
    this.materials.pedestal = new THREE.MeshLambertMaterial({
      color: 0x8c7853, // Stone color
      transparent: false
    });

    // Torch flame material
    this.materials.flame = new THREE.MeshLambertMaterial({
      color: 0xffd700, // Gold color
      transparent: true,
      opacity: 0.8
    });
  }

  private createPedestal(): void {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.name = 'pedestal';

    // Pedestal height is about 47% of total height
    const pedestalHeight = this.options.height * 0.47;
    const topWidth = this.options.baseWidth * 0.6; // Truncated pyramid

    // Main pedestal - truncated pyramid
    const pedestalGeometry = new THREE.CylinderGeometry(
      topWidth / 2,
      this.options.baseWidth / 2,
      pedestalHeight,
      8 // Octagonal base
    );

    const pedestal = new THREE.Mesh(pedestalGeometry, this.materials.pedestal);
    pedestal.position.y = pedestalHeight / 2;
    pedestal.name = 'main-pedestal';
    pedestalGroup.add(pedestal);

    // Pedestal details - base platform
    const baseGeometry = new THREE.CylinderGeometry(
      this.options.baseWidth / 2 + 2,
      this.options.baseWidth / 2 + 3,
      2,
      8
    );
    const base = new THREE.Mesh(baseGeometry, this.materials.pedestal);
    base.position.y = 1;
    base.name = 'pedestal-base';
    pedestalGroup.add(base);

    this.geometry.add(pedestalGroup);
  }

  private createStatueBase(): void {
    const baseGroup = new THREE.Group();
    baseGroup.name = 'statue-base';

    const pedestalHeight = this.options.height * 0.47;
    const statueHeight = this.options.height * 0.53;
    const baseHeight = statueHeight * 0.15;

    // Statue base platform
    const baseGeometry = new THREE.CylinderGeometry(
      this.options.baseWidth * 0.25,
      this.options.baseWidth * 0.3,
      baseHeight,
      16
    );

    const base = new THREE.Mesh(baseGeometry, this.materials.statue);
    base.position.y = pedestalHeight + baseHeight / 2;
    base.name = 'statue-platform';
    baseGroup.add(base);

    this.geometry.add(baseGroup);
  }

  private createStatueBody(): void {
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'statue-body';

    const pedestalHeight = this.options.height * 0.47;
    const statueHeight = this.options.height * 0.53;
    const baseHeight = statueHeight * 0.15;
    const bodyHeight = statueHeight * 0.55;

    // Main body - tapered cylinder representing draped figure
    const bodyGeometry = new THREE.CylinderGeometry(
      this.options.baseWidth * 0.12, // Top radius (shoulders)
      this.options.baseWidth * 0.2,  // Bottom radius (base of robe)
      bodyHeight,
      16
    );

    const body = new THREE.Mesh(bodyGeometry, this.materials.statue);
    body.position.y = pedestalHeight + baseHeight + bodyHeight / 2;
    body.name = 'main-body';
    bodyGroup.add(body);

    // Add body details based on detail level
    if (this.options.detailLevel !== 'low') {
      this.addBodyDetails(bodyGroup, pedestalHeight + baseHeight, bodyHeight);
    }

    this.geometry.add(bodyGroup);
  }

  private addBodyDetails(parent: THREE.Group, baseY: number, bodyHeight: number): void {
    // Add robe folds and details
    const foldCount = this.options.detailLevel === 'high' ? 8 : 4;

    for (let i = 0; i < foldCount; i++) {
      const angle = (i / foldCount) * Math.PI * 2;
      const radius = this.options.baseWidth * 0.18;

      const foldGeometry = new THREE.CylinderGeometry(
        0.5, 1, bodyHeight * 0.8, 6
      );

      const fold = new THREE.Mesh(foldGeometry, this.materials.shadow);
      fold.position.x = Math.cos(angle) * radius;
      fold.position.z = Math.sin(angle) * radius;
      fold.position.y = baseY + bodyHeight / 2;
      fold.rotation.y = angle;
      fold.name = `robe-fold-${i}`;

      parent.add(fold);
    }
  }

  private createArms(): void {
    const armsGroup = new THREE.Group();
    armsGroup.name = 'arms';

    const pedestalHeight = this.options.height * 0.47;
    const statueHeight = this.options.height * 0.53;
    const baseHeight = statueHeight * 0.15;
    const bodyHeight = statueHeight * 0.55;
    const armBaseY = pedestalHeight + baseHeight + bodyHeight * 0.7;

    // Right arm (raised with torch)
    this.createRightArm(armsGroup, armBaseY);

    // Left arm (holding tablet)
    this.createLeftArm(armsGroup, armBaseY);

    this.geometry.add(armsGroup);
  }

  private createRightArm(parent: THREE.Group, baseY: number): void {
    const armGroup = new THREE.Group();
    armGroup.name = 'right-arm';

    const armLength = this.options.height * 0.25;
    const armRadius = this.options.baseWidth * 0.03;

    // Upper arm
    const upperArmGeometry = new THREE.CylinderGeometry(armRadius, armRadius * 0.8, armLength * 0.6, 8);
    const upperArm = new THREE.Mesh(upperArmGeometry, this.materials.statue);
    upperArm.position.x = this.options.baseWidth * 0.1;
    upperArm.position.y = baseY + armLength * 0.3;
    upperArm.rotation.z = -Math.PI / 6; // Angle upward
    upperArm.name = 'upper-arm-right';
    armGroup.add(upperArm);

    // Forearm
    const forearmGeometry = new THREE.CylinderGeometry(armRadius * 0.8, armRadius * 0.7, armLength * 0.5, 8);
    const forearm = new THREE.Mesh(forearmGeometry, this.materials.statue);
    forearm.position.x = this.options.baseWidth * 0.15;
    forearm.position.y = baseY + armLength * 0.8;
    forearm.rotation.z = -Math.PI / 4; // More angled for torch position
    forearm.name = 'forearm-right';
    armGroup.add(forearm);

    parent.add(armGroup);
  }

  private createLeftArm(parent: THREE.Group, baseY: number): void {
    const armGroup = new THREE.Group();
    armGroup.name = 'left-arm';

    const armLength = this.options.height * 0.2;
    const armRadius = this.options.baseWidth * 0.03;

    // Left arm holding tablet
    const leftArmGeometry = new THREE.CylinderGeometry(armRadius, armRadius * 0.8, armLength, 8);
    const leftArm = new THREE.Mesh(leftArmGeometry, this.materials.statue);
    leftArm.position.x = -this.options.baseWidth * 0.08;
    leftArm.position.y = baseY + armLength / 2;
    leftArm.rotation.z = Math.PI / 8; // Slight outward angle
    leftArm.name = 'left-arm-main';
    armGroup.add(leftArm);

    parent.add(armGroup);
  }

  private createHead(): void {
    const headGroup = new THREE.Group();
    headGroup.name = 'head';

    const pedestalHeight = this.options.height * 0.47;
    const statueHeight = this.options.height * 0.53;
    const baseHeight = statueHeight * 0.15;
    const bodyHeight = statueHeight * 0.55;
    const headY = pedestalHeight + baseHeight + bodyHeight + statueHeight * 0.1;

    const headRadius = this.options.baseWidth * 0.06;
    const headHeight = this.options.height * 0.08;

    // Main head
    const headGeometry = new THREE.SphereGeometry(headRadius, 16, 12);
    const head = new THREE.Mesh(headGeometry, this.materials.statue);
    head.position.y = headY;
    head.name = 'main-head';
    headGroup.add(head);

    // Facial features (simplified)
    if (this.options.detailLevel !== 'low') {
      // Nose
      const noseGeometry = new THREE.ConeGeometry(headRadius * 0.1, headRadius * 0.2, 6);
      const nose = new THREE.Mesh(noseGeometry, this.materials.highlight);
      nose.position.z = headRadius * 0.8;
      nose.position.y = headY;
      nose.rotation.x = Math.PI / 2;
      nose.name = 'nose';
      headGroup.add(nose);
    }

    this.geometry.add(headGroup);
  }

  private createCrown(): void {
    const crownGroup = new THREE.Group();
    crownGroup.name = 'crown';

    const pedestalHeight = this.options.height * 0.47;
    const statueHeight = this.options.height * 0.53;
    const baseHeight = statueHeight * 0.15;
    const bodyHeight = statueHeight * 0.55;
    const headY = pedestalHeight + baseHeight + bodyHeight + statueHeight * 0.1;
    const headRadius = this.options.baseWidth * 0.06;

    // Crown base
    const crownBaseGeometry = new THREE.CylinderGeometry(
      headRadius * 1.1,
      headRadius * 1.05,
      headRadius * 0.3,
      16
    );
    const crownBase = new THREE.Mesh(crownBaseGeometry, this.materials.highlight);
    crownBase.position.y = headY + headRadius + headRadius * 0.15;
    crownBase.name = 'crown-base';
    crownGroup.add(crownBase);

    // Crown spikes (7 rays representing the 7 continents and seas)
    const spikeCount = 7;
    const spikeHeight = this.options.height * 0.06;
    const spikeRadius = headRadius * 0.05;

    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2;
      const radius = headRadius * 1.1;

      const spikeGeometry = new THREE.ConeGeometry(spikeRadius, spikeHeight, 6);
      const spike = new THREE.Mesh(spikeGeometry, this.materials.highlight);

      spike.position.x = Math.cos(angle) * radius;
      spike.position.z = Math.sin(angle) * radius;
      spike.position.y = headY + headRadius + headRadius * 0.3 + spikeHeight / 2;
      spike.name = `crown-spike-${i}`;

      crownGroup.add(spike);
    }

    this.geometry.add(crownGroup);
  }

  private createTorch(): void {
    const torchGroup = new THREE.Group();
    torchGroup.name = 'torch';

    const pedestalHeight = this.options.height * 0.47;
    const statueHeight = this.options.height * 0.53;
    const baseHeight = statueHeight * 0.15;
    const bodyHeight = statueHeight * 0.55;
    const armBaseY = pedestalHeight + baseHeight + bodyHeight * 0.7;

    // Torch position (end of raised right arm)
    const torchX = this.options.baseWidth * 0.18;
    const torchY = armBaseY + this.options.height * 0.35;
    const torchZ = 0;

    // Torch handle
    const handleGeometry = new THREE.CylinderGeometry(
      this.options.baseWidth * 0.01,
      this.options.baseWidth * 0.012,
      this.options.height * 0.08,
      8
    );
    const handle = new THREE.Mesh(handleGeometry, this.materials.statue);
    handle.position.set(torchX, torchY - this.options.height * 0.04, torchZ);
    handle.name = 'torch-handle';
    torchGroup.add(handle);

    // Torch bowl
    const bowlGeometry = new THREE.SphereGeometry(this.options.baseWidth * 0.025, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const bowl = new THREE.Mesh(bowlGeometry, this.materials.statue);
    bowl.position.set(torchX, torchY, torchZ);
    bowl.name = 'torch-bowl';
    torchGroup.add(bowl);

    // Flame
    const flameGeometry = new THREE.ConeGeometry(
      this.options.baseWidth * 0.02,
      this.options.height * 0.06,
      8
    );
    const flame = new THREE.Mesh(flameGeometry, this.materials.flame);
    flame.position.set(torchX, torchY + this.options.height * 0.03, torchZ);
    flame.name = 'torch-flame';
    torchGroup.add(flame);

    this.geometry.add(torchGroup);
  }

  private createTablet(): void {
    const tabletGroup = new THREE.Group();
    tabletGroup.name = 'tablet';

    const pedestalHeight = this.options.height * 0.47;
    const statueHeight = this.options.height * 0.53;
    const baseHeight = statueHeight * 0.15;
    const bodyHeight = statueHeight * 0.55;
    const armBaseY = pedestalHeight + baseHeight + bodyHeight * 0.7;

    // Tablet position (held in left arm)
    const tabletX = -this.options.baseWidth * 0.12;
    const tabletY = armBaseY + this.options.height * 0.1;
    const tabletZ = 0;

    // Tablet dimensions (scaled from actual: 23'7" x 13'7")
    const tabletWidth = this.options.height * 0.08;
    const tabletHeight = this.options.height * 0.12;
    const tabletDepth = this.options.height * 0.01;

    const tabletGeometry = new THREE.BoxGeometry(tabletWidth, tabletHeight, tabletDepth);
    const tablet = new THREE.Mesh(tabletGeometry, this.materials.highlight);
    tablet.position.set(tabletX, tabletY, tabletZ);
    tablet.rotation.x = Math.PI / 12; // Slight tilt
    tablet.name = 'declaration-tablet';
    tabletGroup.add(tablet);

    // Add inscribed date "JULY IV MDCCLXXVI" if high detail
    if (this.options.detailLevel === 'high') {
      const textGeometry = new THREE.BoxGeometry(tabletWidth * 0.8, tabletHeight * 0.1, tabletDepth * 0.1);
      const text = new THREE.Mesh(textGeometry, this.materials.shadow);
      text.position.set(tabletX, tabletY - tabletHeight * 0.2, tabletZ + tabletDepth);
      text.name = 'tablet-inscription';
      tabletGroup.add(text);
    }

    this.geometry.add(tabletGroup);
  }

  private createDraping(): void {
    if (this.options.detailLevel === 'low') return;

    const drapingGroup = new THREE.Group();
    drapingGroup.name = 'draping';

    const pedestalHeight = this.options.height * 0.47;
    const statueHeight = this.options.height * 0.53;
    const baseHeight = statueHeight * 0.15;
    const bodyHeight = statueHeight * 0.55;
    const bodyBaseY = pedestalHeight + baseHeight;

    // Add flowing robe details
    const drapeCount = this.options.detailLevel === 'high' ? 12 : 6;

    for (let i = 0; i < drapeCount; i++) {
      const angle = (i / drapeCount) * Math.PI * 2;
      const radius = this.options.baseWidth * 0.15;
      const waveHeight = Math.sin(angle * 3) * this.options.height * 0.02;

      const drapeGeometry = new THREE.CylinderGeometry(
        0.3, 0.8, bodyHeight * 0.6, 4
      );

      const drape = new THREE.Mesh(drapeGeometry, this.materials.shadow);
      drape.position.x = Math.cos(angle) * radius;
      drape.position.z = Math.sin(angle) * radius;
      drape.position.y = bodyBaseY + bodyHeight * 0.4 + waveHeight;
      drape.rotation.x = Math.sin(angle * 2) * 0.2;
      drape.rotation.z = Math.cos(angle * 2) * 0.1;
      drape.name = `drape-${i}`;

      drapingGroup.add(drape);
    }

    this.geometry.add(drapingGroup);
  }

  public getGeometry(): THREE.Group {
    return this.geometry.clone();
  }

  public dispose(): void {
    // Dispose of all materials
    Object.values(this.materials).forEach(material => {
      material.dispose();
    });

    // Dispose of all geometries
    this.geometry.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });

    // Clear the geometry
    this.geometry.clear();
  }
}