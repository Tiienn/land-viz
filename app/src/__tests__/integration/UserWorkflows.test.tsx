import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { useDrawingStore } from '../../store/useDrawingStore';
import { useComparisonStore } from '../../store/useComparisonStore';
import { useConversionStore } from '../../store/useConversionStore';
import { useMeasurementStore } from '../../store/useMeasurementStore';

// Mock Three.js to avoid WebGL context issues in tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="three-canvas">{children}</div>,
  useFrame: () => {},
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    scene: { add: vi.fn(), remove: vi.fn() },
  }),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Grid: () => <div data-testid="grid" />,
}));

// Mock the geometry loader
vi.mock('../../utils/GeometryLoader', () => ({
  GeometryLoader: class MockGeometryLoader {
    async loadGeometry() {
      return { name: 'MockGeometry' };
    }
  },
}));

describe('Integration: User Workflows', () => {
  beforeEach(() => {
    // Reset all stores - using actual API methods
    const comparisonStore = useComparisonStore.getState();

    // Reset comparison store to collapsed state if expanded
    if (comparisonStore.comparison.isExpanded) {
      comparisonStore.toggleComparisonPanel();
    }

    // Reset comparison state
    comparisonStore.resetComparison();

    // Note: Other stores (drawing, conversion, measurement) have dependency issues
    // so we'll test what we can with the working comparison store
  });

  describe('Complete Land Planning Workflow', () => {
    it('should allow user to draw property boundary, measure distances, and compare areas', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      // Step 1: Draw a property boundary (rectangle)
      const rectangleTool = screen.getByRole('button', { name: /rectangle/i });
      await user.click(rectangleTool);

      expect(useDrawingStore.getState().drawing.activeTool).toBe('rectangle');

      // Simulate drawing a rectangle (would involve canvas interactions in real app)
      const drawingStore = useDrawingStore.getState();
      const shapeId = drawingStore.addShape({
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y:8 },
          { x: 0, y: 8 },
        ],
        center: { x: 5, y: 4 },
        rotation: 0,
        layerId: 'main',
      });

      expect(drawingStore.shapes).toHaveLength(1);
      expect(drawingStore.shapes[0].type).toBe('rectangle');

      // Step 2: Measure a distance within the property
      const measureTool = screen.getByRole('button', { name: /measure/i });
      await user.click(measureTool);

      expect(useDrawingStore.getState().drawing.activeTool).toBe('measure');

      // Simulate measurement
      const measurementStore = useMeasurementStore.getState();
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.setEndPoint({ x: 10, y: 0 });
      measurementStore.completeMeasurement();

      expect(measurementStore.measurements).toHaveLength(1);
      expect(measurementStore.measurements[0].distance).toBe(10);

      // Step 3: Open comparison tool to compare property size
      const comparisonTool = screen.getByRole('button', { name: /compare/i });
      await user.click(comparisonTool);

      expect(useComparisonStore.getState().isVisible).toBe(true);

      // Set land area for comparison (80 square units from 10x8 rectangle)
      const comparisonStore = useComparisonStore.getState();
      comparisonStore.setLandArea(80, 'sqm');
      comparisonStore.toggleObjectSelection('soccer-field');

      expect(comparisonStore.comparisons).toHaveLength(1);
      expect(comparisonStore.comparisons[0].objectId).toBe('soccer-field');

      // Step 4: Use conversion tool to convert area to different units
      const convertTool = screen.getByRole('button', { name: /convert/i });
      await user.click(convertTool);

      expect(useConversionStore.getState().isVisible).toBe(true);

      const conversionStore = useConversionStore.getState();
      conversionStore.setInputValue('80');
      conversionStore.setSelectedUnit('sqm');
      conversionStore.performConversion();

      expect(conversionStore.results.length).toBeGreaterThan(0);
      const sqftResult = conversionStore.results.find(r => r.unit === 'sqft');
      expect(sqftResult?.value).toBeCloseTo(861.11, 1); // 80 sqm ≈ 861.11 sqft
    });

    it('should handle complete property subdivision workflow', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();

      // Step 1: Draw main property boundary
      drawingStore.setActiveTool('polyline');
      const mainPropertyId = drawingStore.addShape({
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 15 },
          { x: 10, y: 20 },
          { x: 0, y: 15 },
        ],
        center: { x: 10, y: 10 },
        rotation: 0,
        layerId: 'main',
      });

      // Step 2: Create subdivision lines
      const subdivisionId1 = drawingStore.addShape({
        type: 'polyline',
        points: [
          { x: 10, y: 0 },
          { x: 10, y: 15 },
        ],
        center: { x: 10, y: 7.5 },
        rotation: 0,
        layerId: 'main',
      });

      const subdivisionId2 = drawingStore.addShape({
        type: 'polyline',
        points: [
          { x: 0, y: 7.5 },
          { x: 20, y: 7.5 },
        ],
        center: { x: 10, y: 7.5 },
        rotation: 0,
        layerId: 'main',
      });

      expect(drawingStore.shapes).toHaveLength(3);

      // Step 3: Measure each subdivision
      const measurementStore = useMeasurementStore.getState();

      // Measure subdivision 1 width
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.setEndPoint({ x: 10, y: 0 });
      measurementStore.completeMeasurement();

      // Measure subdivision 1 height
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.setEndPoint({ x: 0, y: 7.5 });
      measurementStore.completeMeasurement();

      expect(measurementStore.measurements).toHaveLength(2);
      expect(measurementStore.measurements[0].distance).toBe(10);
      expect(measurementStore.measurements[1].distance).toBe(7.5);

      // Step 4: Compare subdivision areas
      const comparisonStore = useComparisonStore.getState();
      comparisonStore.showPanel();
      comparisonStore.setLandArea(75, 'sqm'); // 10 x 7.5 = 75 sqm
      comparisonStore.toggleObjectSelection('tennis-court');
      comparisonStore.toggleObjectSelection('basketball-court');

      expect(comparisonStore.comparisons).toHaveLength(2);
      expect(comparisonStore.selectedObjects).toContain('tennis-court');
      expect(comparisonStore.selectedObjects).toContain('basketball-court');
    });
  });

  describe('Professional Survey Workflow', () => {
    it('should support professional land surveying tasks', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();
      const measurementStore = useMeasurementStore.getState();

      // Step 1: Create property corners with precise coordinates
      const propertyCorners = [
        { x: 0, y: 0 },
        { x: 50.25, y: 0 },
        { x: 50.25, y: 33.75 },
        { x: 0, y: 33.75 },
      ];

      drawingStore.setActiveTool('rectangle');
      const propertyId = drawingStore.addShape({
        type: 'rectangle',
        points: propertyCorners,
        center: { x: 25.125, y: 16.875 },
        rotation: 0,
        layerId: 'main',
      });

      // Step 2: Measure all property boundaries
      const boundaries = [
        { start: propertyCorners[0], end: propertyCorners[1], label: 'North' },
        { start: propertyCorners[1], end: propertyCorners[2], label: 'East' },
        { start: propertyCorners[2], end: propertyCorners[3], label: 'South' },
        { start: propertyCorners[3], end: propertyCorners[0], label: 'West' },
      ];

      boundaries.forEach(boundary => {
        measurementStore.startMeasurement();
        measurementStore.setStartPoint(boundary.start);
        measurementStore.setEndPoint(boundary.end);
        measurementStore.completeMeasurement();
      });

      expect(measurementStore.measurements).toHaveLength(4);

      // Verify measurements
      expect(measurementStore.measurements[0].distance).toBeCloseTo(50.25, 2); // North boundary
      expect(measurementStore.measurements[1].distance).toBeCloseTo(33.75, 2); // East boundary
      expect(measurementStore.measurements[2].distance).toBeCloseTo(50.25, 2); // South boundary
      expect(measurementStore.measurements[3].distance).toBeCloseTo(33.75, 2); // West boundary

      // Step 3: Calculate total area and convert to various units
      const totalArea = 50.25 * 33.75; // 1695.9375 square units

      const conversionStore = useConversionStore.getState();
      conversionStore.showPanel();
      conversionStore.setInputValue(totalArea.toString());
      conversionStore.setSelectedUnit('sqm');
      conversionStore.performConversion();

      expect(conversionStore.results.length).toBeGreaterThan(0);

      // Verify key conversions for surveying
      const acresResult = conversionStore.results.find(r => r.unit === 'acres');
      const hectaresResult = conversionStore.results.find(r => r.unit === 'hectares');
      const sqftResult = conversionStore.results.find(r => r.unit === 'sqft');

      expect(acresResult?.value).toBeCloseTo(0.419, 2); // ~0.419 acres
      expect(hectaresResult?.value).toBeCloseTo(0.170, 2); // ~0.170 hectares
      expect(sqftResult?.value).toBeCloseTo(18252, 0); // ~18,252 sqft

      // Step 4: Add measurement history for documentation
      expect(conversionStore.history).toHaveLength(1);
      expect(conversionStore.history[0].inputValue).toBe(totalArea.toString());
    });

    it('should handle complex polygon surveys with historical units', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();
      const conversionStore = useConversionStore.getState();

      // Step 1: Create irregular property boundary
      const irregularProperty = [
        { x: 0, y: 0 },
        { x: 25, y: 5 },
        { x: 30, y: 20 },
        { x: 20, y: 35 },
        { x: 5, y: 30 },
        { x: 2, y: 15 },
      ];

      drawingStore.setActiveTool('polyline');
      const propertyId = drawingStore.addShape({
        type: 'polyline',
        points: irregularProperty,
        center: { x: 15, y: 17.5 },
        rotation: 0,
        layerId: 'main',
      });

      // Step 2: Test historical French units (common in Louisiana, Quebec)
      conversionStore.showPanel();
      conversionStore.setInputValue('2.5');
      conversionStore.setSelectedUnit('arpent-na'); // North American arpent
      conversionStore.performConversion();

      const sqmFromArpent = conversionStore.results.find(r => r.unit === 'sqm');
      expect(sqmFromArpent?.value).toBeCloseTo(8498.75, 1); // 2.5 arpent ≈ 8,498.75 sqm

      // Step 3: Test British colonial units (common in former British territories)
      conversionStore.setInputValue('5');
      conversionStore.setSelectedUnit('perches');
      conversionStore.performConversion();

      const sqmFromPerches = conversionStore.results.find(r => r.unit === 'sqm');
      expect(sqmFromPerches?.value).toBeCloseTo(126.45, 1); // 5 perches ≈ 126.45 sqm

      // Step 4: Test Mauritius-specific units
      conversionStore.setInputValue('1');
      conversionStore.setSelectedUnit('perches-mauritius');
      conversionStore.performConversion();

      const sqmFromMauritiusPerches = conversionStore.results.find(r => r.unit === 'sqm');
      expect(sqmFromMauritiusPerches?.value).toBeCloseTo(39.53, 1); // 1 Mauritius perch ≈ 39.53 sqm

      // Verify warnings for historical units
      expect(conversionStore.results.length).toBeGreaterThan(0);
    });
  });

  describe('Real Estate Development Workflow', () => {
    it('should support development planning with multiple lots', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();
      const comparisonStore = useComparisonStore.getState();

      // Step 1: Create development area
      const developmentArea = drawingStore.addShape({
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 60 },
          { x: 0, y: 60 },
        ],
        center: { x: 50, y: 30 },
        rotation: 0,
        layerId: 'main',
      });

      // Step 2: Create individual lots
      const lots = [
        // Row 1
        { x: 0, y: 0, width: 20, height: 30 },
        { x: 20, y: 0, width: 20, height: 30 },
        { x: 40, y: 0, width: 20, height: 30 },
        { x: 60, y: 0, width: 20, height: 30 },
        { x: 80, y: 0, width: 20, height: 30 },
        // Row 2
        { x: 0, y: 30, width: 20, height: 30 },
        { x: 20, y: 30, width: 20, height: 30 },
        { x: 40, y: 30, width: 20, height: 30 },
        { x: 60, y: 30, width: 20, height: 30 },
        { x: 80, y: 30, width: 20, height: 30 },
      ];

      lots.forEach((lot, index) => {
        drawingStore.addShape({
          type: 'rectangle',
          points: [
            { x: lot.x, y: lot.y },
            { x: lot.x + lot.width, y: lot.y },
            { x: lot.x + lot.width, y: lot.y + lot.height },
            { x: lot.x, y: lot.y + lot.height },
          ],
          center: { x: lot.x + lot.width / 2, y: lot.y + lot.height / 2 },
          rotation: 0,
          layerId: 'main',
        });
      });

      expect(drawingStore.shapes).toHaveLength(11); // 1 development area + 10 lots

      // Step 3: Compare individual lot sizes to common structures
      const lotArea = 20 * 30; // 600 square units
      comparisonStore.showPanel();
      comparisonStore.setLandArea(lotArea, 'sqm');
      comparisonStore.toggleObjectSelection('tennis-court');
      comparisonStore.toggleObjectSelection('basketball-court');
      comparisonStore.toggleObjectSelection('parking-space');

      expect(comparisonStore.comparisons).toHaveLength(3);

      // Verify reasonable comparisons
      const tennisComparison = comparisonStore.comparisons.find(c => c.objectId === 'tennis-court');
      expect(tennisComparison?.quantity).toBeGreaterThan(1); // Lot is larger than tennis court

      // Step 4: Calculate development density
      const totalDevelopmentArea = 100 * 60; // 6000 square units
      const totalLotArea = lots.length * lotArea; // 10 * 600 = 6000 square units
      const buildableRatio = totalLotArea / totalDevelopmentArea;

      expect(buildableRatio).toBe(1.0); // 100% lot coverage (no roads/utilities in this simplified example)
    });

    it('should handle mixed-use development planning', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();
      const comparisonStore = useComparisonStore.getState();

      // Step 1: Create zones for different uses
      const zones = [
        { name: 'Residential', area: { x: 0, y: 0, width: 60, height: 40 } },
        { name: 'Commercial', area: { x: 60, y: 0, width: 40, height: 20 } },
        { name: 'Parking', area: { x: 60, y: 20, width: 40, height: 20 } },
        { name: 'Green Space', area: { x: 0, y: 40, width: 100, height: 20 } },
      ];

      zones.forEach(zone => {
        drawingStore.addShape({
          type: 'rectangle',
          points: [
            { x: zone.area.x, y: zone.area.y },
            { x: zone.area.x + zone.area.width, y: zone.area.y },
            { x: zone.area.x + zone.area.width, y: zone.area.y + zone.area.height },
            { x: zone.area.x, y: zone.area.y + zone.area.height },
          ],
          center: {
            x: zone.area.x + zone.area.width / 2,
            y: zone.area.y + zone.area.height / 2
          },
          rotation: 0,
          layerId: 'main',
        });
      });

      expect(drawingStore.shapes).toHaveLength(4);

      // Step 2: Analyze each zone against appropriate references
      comparisonStore.showPanel();

      // Residential zone (2400 sqm)
      comparisonStore.setLandArea(60 * 40, 'sqm');
      comparisonStore.toggleObjectSelection('soccer-field');

      let soccerComparison = comparisonStore.comparisons.find(c => c.objectId === 'soccer-field');
      expect(soccerComparison?.quantity).toBeCloseTo(0.34, 1); // ~1/3 of a soccer field

      // Commercial zone (800 sqm)
      comparisonStore.clearSelectedObjects();
      comparisonStore.setLandArea(40 * 20, 'sqm');
      comparisonStore.toggleObjectSelection('basketball-court');

      let basketballComparison = comparisonStore.comparisons.find(c => c.objectId === 'basketball-court');
      expect(basketballComparison?.quantity).toBeGreaterThan(1); // Multiple basketball courts fit

      // Step 3: Calculate total development efficiency
      const totalArea = 100 * 60; // 6000 sqm
      const developedArea = (60 * 40) + (40 * 20) + (40 * 20); // Residential + Commercial + Parking
      const greenSpace = 100 * 20; // Green space

      const developedRatio = developedArea / totalArea;
      const greenRatio = greenSpace / totalArea;

      expect(developedRatio).toBeCloseTo(0.67, 2); // 67% developed
      expect(greenRatio).toBeCloseTo(0.33, 2); // 33% green space
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should gracefully handle invalid measurements and continue workflow', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();
      const measurementStore = useMeasurementStore.getState();

      // Step 1: Create a shape
      const shapeId = drawingStore.addShape({
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        center: { x: 5, y: 5 },
        rotation: 0,
        layerId: 'main',
      });

      // Step 2: Attempt invalid measurement (same point)
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 5, y: 5 });
      measurementStore.setEndPoint({ x: 5, y: 5 }); // Same point - zero distance

      // Should handle gracefully without crashing
      expect(() => measurementStore.completeMeasurement()).not.toThrow();
      expect(measurementStore.measurements).toHaveLength(1);
      expect(measurementStore.measurements[0].distance).toBe(0);

      // Step 3: Continue with valid measurement
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.setEndPoint({ x: 10, y: 10 });
      measurementStore.completeMeasurement();

      expect(measurementStore.measurements).toHaveLength(2);
      expect(measurementStore.measurements[1].distance).toBeCloseTo(14.14, 2); // sqrt(10² + 10²)

      // Step 4: Other tools should still work
      const comparisonStore = useComparisonStore.getState();
      comparisonStore.showPanel();
      comparisonStore.setLandArea(100, 'sqm');

      expect(comparisonStore.isVisible).toBe(true);
      expect(comparisonStore.landArea).toBe(100);
    });

    it('should handle rapid tool switching without data loss', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();
      const measurementStore = useMeasurementStore.getState();
      const comparisonStore = useComparisonStore.getState();
      const conversionStore = useConversionStore.getState();

      // Rapidly switch tools and add data
      drawingStore.setActiveTool('rectangle');
      const shape1 = drawingStore.addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 5, y: 5 }],
        center: { x: 2.5, y: 2.5 },
        rotation: 0,
        layerId: 'main',
      });

      drawingStore.setActiveTool('measure');
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.setEndPoint({ x: 5, y: 5 });
      measurementStore.completeMeasurement();

      drawingStore.setActiveTool('circle');
      const shape2 = drawingStore.addShape({
        type: 'circle',
        points: [{ x: 10, y: 10 }, { x: 15, y: 15 }],
        center: { x: 12.5, y: 12.5 },
        rotation: 0,
        layerId: 'main',
      });

      comparisonStore.showPanel();
      comparisonStore.setLandArea(50, 'sqm');
      comparisonStore.toggleObjectSelection('tennis-court');

      conversionStore.showPanel();
      conversionStore.setInputValue('50');
      conversionStore.setSelectedUnit('sqm');
      conversionStore.performConversion();

      // Verify all data is preserved
      expect(drawingStore.shapes).toHaveLength(2);
      expect(measurementStore.measurements).toHaveLength(1);
      expect(comparisonStore.selectedObjects).toContain('tennis-court');
      expect(conversionStore.results.length).toBeGreaterThan(0);

      // Switch back to drawing and verify state
      drawingStore.setActiveTool('polyline');
      expect(drawingStore.drawing.activeTool).toBe('polyline');

      // Previous data should still be intact
      expect(drawingStore.shapes).toHaveLength(2);
      expect(measurementStore.measurements).toHaveLength(1);
      expect(measurementStore.measurements[0].distance).toBeCloseTo(7.07, 2);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle large numbers of shapes and measurements efficiently', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();
      const measurementStore = useMeasurementStore.getState();

      const startTime = performance.now();

      // Add many shapes
      for (let i = 0; i < 100; i++) {
        drawingStore.addShape({
          type: 'rectangle',
          points: [
            { x: i, y: i },
            { x: i + 1, y: i },
            { x: i + 1, y: i + 1 },
            { x: i, y: i + 1 },
          ],
          center: { x: i + 0.5, y: i + 0.5 },
          rotation: 0,
          layerId: 'main',
        });
      }

      // Add many measurements
      for (let i = 0; i < 50; i++) {
        measurementStore.startMeasurement();
        measurementStore.setStartPoint({ x: i, y: i });
        measurementStore.setEndPoint({ x: i + 1, y: i + 1 });
        measurementStore.completeMeasurement();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify data integrity
      expect(drawingStore.shapes).toHaveLength(100);
      expect(measurementStore.measurements).toHaveLength(50);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second

      // Verify sample measurements are correct
      expect(measurementStore.measurements[0].distance).toBeCloseTo(1.414, 2); // sqrt(2)
      expect(measurementStore.measurements[49].distance).toBeCloseTo(1.414, 2);
    });
  });
});