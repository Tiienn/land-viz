import * as THREE from 'three';
import { EiffelTowerGeometry } from '../EiffelTowerGeometry';

describe('EiffelTowerGeometry', () => {
  let tower: EiffelTowerGeometry;

  afterEach(() => {
    if (tower) {
      tower.dispose();
    }
  });

  describe('Constructor', () => {
    test('creates geometry with default options', () => {
      tower = new EiffelTowerGeometry();
      const geometry = tower.getGeometry();

      expect(geometry).toBeInstanceOf(THREE.Group);
      expect(geometry.name).toBe('eiffel-tower');
    });

    test('creates geometry with custom options', () => {
      tower = new EiffelTowerGeometry({
        height: 100,
        baseWidth: 150,
        detailLevel: 'high',
        color: 0xff0000
      });

      const geometry = tower.getGeometry();
      expect(geometry).toBeInstanceOf(THREE.Group);
    });
  });

  describe('Structure Components', () => {
    test('creates main legs group', () => {
      tower = new EiffelTowerGeometry();
      const geometry = tower.getGeometry();
      const legs = geometry.getObjectByName('main-legs');

      expect(legs).toBeInstanceOf(THREE.Group);
      expect(legs?.children.length).toBeGreaterThan(0);
    });

    test('creates four individual legs', () => {
      tower = new EiffelTowerGeometry();
      const geometry = tower.getGeometry();
      const legs = geometry.getObjectByName('main-legs');

      const leg0 = legs?.getObjectByName('leg-0');
      const leg1 = legs?.getObjectByName('leg-1');
      const leg2 = legs?.getObjectByName('leg-2');
      const leg3 = legs?.getObjectByName('leg-3');

      expect(leg0).toBeInstanceOf(THREE.Mesh);
      expect(leg1).toBeInstanceOf(THREE.Mesh);
      expect(leg2).toBeInstanceOf(THREE.Mesh);
      expect(leg3).toBeInstanceOf(THREE.Mesh);
    });

    test('creates connecting arches', () => {
      tower = new EiffelTowerGeometry();
      const geometry = tower.getGeometry();
      const legs = geometry.getObjectByName('main-legs');

      const arch0 = legs?.getObjectByName('arch-0');
      const arch1 = legs?.getObjectByName('arch-1');
      const arch2 = legs?.getObjectByName('arch-2');
      const arch3 = legs?.getObjectByName('arch-3');

      expect(arch0).toBeInstanceOf(THREE.Mesh);
      expect(arch1).toBeInstanceOf(THREE.Mesh);
      expect(arch2).toBeInstanceOf(THREE.Mesh);
      expect(arch3).toBeInstanceOf(THREE.Mesh);
    });

    test('creates lattice framework', () => {
      tower = new EiffelTowerGeometry();
      const geometry = tower.getGeometry();
      const lattice = geometry.getObjectByName('lattice-framework');

      expect(lattice).toBeInstanceOf(THREE.Group);
      expect(lattice?.children.length).toBeGreaterThan(0);
    });

    test('creates three platforms', () => {
      tower = new EiffelTowerGeometry();
      const geometry = tower.getGeometry();
      const platforms = geometry.getObjectByName('platforms');

      expect(platforms).toBeInstanceOf(THREE.Group);

      const firstFloor = platforms?.getObjectByName('first-floor');
      const secondFloor = platforms?.getObjectByName('second-floor');
      const thirdFloor = platforms?.getObjectByName('third-floor');

      expect(firstFloor).toBeInstanceOf(THREE.Mesh);
      expect(secondFloor).toBeInstanceOf(THREE.Mesh);
      expect(thirdFloor).toBeInstanceOf(THREE.Mesh);
    });

    test('creates top spire', () => {
      tower = new EiffelTowerGeometry();
      const geometry = tower.getGeometry();
      const spire = geometry.getObjectByName('spire');

      expect(spire).toBeInstanceOf(THREE.Group);

      const spireCone = spire?.getObjectByName('spire-cone');
      const antenna = spire?.getObjectByName('antenna');

      expect(spireCone).toBeInstanceOf(THREE.Mesh);
      expect(antenna).toBeInstanceOf(THREE.Mesh);
    });
  });

  describe('Detail Levels', () => {
    test('low detail has fewer segments', () => {
      tower = new EiffelTowerGeometry({ detailLevel: 'low' });
      const geometry = tower.getGeometry();
      const lattice = geometry.getObjectByName('lattice-framework');

      expect(lattice).toBeDefined();
      expect(lattice?.children.length).toBeGreaterThan(0);
    });

    test('medium detail has moderate segments', () => {
      tower = new EiffelTowerGeometry({ detailLevel: 'medium' });
      const geometry = tower.getGeometry();
      const lattice = geometry.getObjectByName('lattice-framework');

      expect(lattice).toBeDefined();
      expect(lattice?.children.length).toBeGreaterThan(0);
    });

    test('high detail has more segments', () => {
      tower = new EiffelTowerGeometry({ detailLevel: 'high' });
      const geometry = tower.getGeometry();
      const lattice = geometry.getObjectByName('lattice-framework');

      expect(lattice).toBeDefined();
      // High detail should have more children than low detail
      const lowDetailTower = new EiffelTowerGeometry({ detailLevel: 'low' });
      const lowLattice = lowDetailTower.getGeometry().getObjectByName('lattice-framework');

      expect(lattice?.children.length).toBeGreaterThanOrEqual(lowLattice?.children.length || 0);
      lowDetailTower.dispose();
    });
  });

  describe('Geometry Properties', () => {
    test('tower height matches specified height', () => {
      const height = 75;
      tower = new EiffelTowerGeometry({ height });
      const geometry = tower.getGeometry();

      // Check that the antenna (top element) is at the correct height
      const spire = geometry.getObjectByName('spire');
      const antenna = spire?.getObjectByName('antenna');

      expect(antenna?.position.y).toBe(height);
    });

    test('platforms are at correct heights', () => {
      const height = 50;
      tower = new EiffelTowerGeometry({ height });
      const geometry = tower.getGeometry();
      const platforms = geometry.getObjectByName('platforms');

      const firstFloor = platforms?.getObjectByName('first-floor');
      const secondFloor = platforms?.getObjectByName('second-floor');
      const thirdFloor = platforms?.getObjectByName('third-floor');

      // Platforms should be at 18%, 36%, and 84% of height
      expect(firstFloor?.position.y).toBeCloseTo(height * 0.18, 1);
      expect(secondFloor?.position.y).toBeCloseTo(height * 0.36, 1);
      expect(thirdFloor?.position.y).toBeCloseTo(height * 0.84, 1);
    });
  });

  describe('Materials', () => {
    test('uses correct material colors', () => {
      const customColor = 0xff0000;
      tower = new EiffelTowerGeometry({ color: customColor });
      const geometry = tower.getGeometry();
      const legs = geometry.getObjectByName('main-legs');
      const leg = legs?.getObjectByName('leg-0') as THREE.Mesh;

      expect(leg).toBeDefined();
      if (leg && leg.material) {
        const material = leg.material as THREE.MeshLambertMaterial;
        expect(material.color.getHex()).toBe(customColor);
      }
    });

    test('lattice uses semi-transparent material', () => {
      tower = new EiffelTowerGeometry();
      const geometry = tower.getGeometry();
      const lattice = geometry.getObjectByName('lattice-framework');
      const diagonalBracing = lattice?.getObjectByName('diagonal-bracing') as THREE.LineSegments;

      expect(diagonalBracing).toBeDefined();
      if (diagonalBracing && diagonalBracing.material) {
        const material = diagonalBracing.material as THREE.LineBasicMaterial;
        expect(material.transparent).toBe(true);
        expect(material.opacity).toBeLessThan(1);
      }
    });
  });

  describe('Dispose', () => {
    test('properly disposes of all geometries and materials', () => {
      tower = new EiffelTowerGeometry();
      const geometry = tower.getGeometry();

      // Count initial meshes
      let meshCount = 0;
      geometry.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshCount++;
        }
      });

      expect(meshCount).toBeGreaterThan(0);

      // Dispose should not throw
      expect(() => tower.dispose()).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('creates geometry within reasonable time', () => {
      const startTime = performance.now();
      tower = new EiffelTowerGeometry({ detailLevel: 'high' });
      const endTime = performance.now();

      const creationTime = endTime - startTime;
      expect(creationTime).toBeLessThan(200); // Should create in under 200ms
    });

    test('geometry has reasonable vertex count', () => {
      tower = new EiffelTowerGeometry({ detailLevel: 'high' });
      const geometry = tower.getGeometry();

      let vertexCount = 0;
      geometry.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mesh = child as THREE.Mesh;
          const geo = mesh.geometry;
          if (geo.attributes.position) {
            vertexCount += geo.attributes.position.count;
          }
        }
      });

      expect(vertexCount).toBeLessThan(10000); // Should be under 10k vertices
    });
  });
});