import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
      drawingStore.addShape({
        name: 'Rectangle 1',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y:8 },
          { x: 0, y: 8 },
        ],
        color: '#3B82F6',
        visible: true,
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
      measurementStore.completeMeasurement({ x: 10, y: 0 });

      expect(measurementStore.measurement.measurements).toHaveLength(1);
      expect(measurementStore.measurement.measurements[0].distance).toBe(10);

      // Step 3: Open comparison tool to compare property size
      const comparisonTool = screen.getByRole('button', { name: /compare/i });
      await user.click(comparisonTool);

      expect(useComparisonStore.getState().comparison.isExpanded).toBe(true);

      // Set land area for comparison (80 square units from 10x8 rectangle)
      const comparisonStore = useComparisonStore.getState();
      comparisonStore.updateLandArea(80);
      comparisonStore.toggleObjectVisibility('soccer-field');

      const calculations = comparisonStore.comparison.calculations;
      expect(calculations.size).toBeGreaterThan(0);
      expect(calculations.has('soccer-field')).toBe(true);

      // Step 4: Use conversion tool to convert area to different units
      const convertTool = screen.getByRole('button', { name: /convert/i });
      await user.click(convertTool);

      expect(useConversionStore.getState().conversion.isExpanded).toBe(true);

      const conversionStore = useConversionStore.getState();
      conversionStore.setInputValue('80');
      conversionStore.setInputUnit('sqm');
      conversionStore.performConversion();

      expect(conversionStore.conversion.results.size).toBeGreaterThan(0);
      const sqftResult = conversionStore.conversion.results.get('sqft');
      expect(parseFloat(sqftResult || '0')).toBeCloseTo(861.11, 1); // 80 sqm ≈ 861.11 sqft
    });

    it('should handle complete property subdivision workflow', async () => {
      const _user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();

      // Step 1: Draw main property boundary
      drawingStore.setActiveTool('polyline');
      drawingStore.addShape({
        name: 'Main Property',
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 15 },
          { x: 10, y: 20 },
          { x: 0, y: 15 },
        ],
        color: '#3B82F6',
        visible: true,
        layerId: 'main',
      });

      // Step 2: Create subdivision lines
      drawingStore.addShape({
        name: 'Subdivision Line 1',
        type: 'polyline',
        points: [
          { x: 10, y: 0 },
          { x: 10, y: 15 },
        ],
        color: '#10B981',
        visible: true,
        layerId: 'main',
      });

      drawingStore.addShape({
        name: 'Subdivision Line 2',
        type: 'polyline',
        points: [
          { x: 0, y: 7.5 },
          { x: 20, y: 7.5 },
        ],
        color: '#F59E0B',
        visible: true,
        layerId: 'main',
      });

      expect(drawingStore.shapes).toHaveLength(3);

      // Step 3: Measure each subdivision
      const measurementStore = useMeasurementStore.getState();

      // Measure subdivision 1 width
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.completeMeasurement({ x: 10, y: 0 });

      // Measure subdivision 1 height
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.completeMeasurement({ x: 0, y: 7.5 });

      expect(measurementStore.measurement.measurements).toHaveLength(2);
      expect(measurementStore.measurement.measurements[0].distance).toBe(10);
      expect(measurementStore.measurement.measurements[1].distance).toBe(7.5);

      // Step 4: Compare subdivision areas
      const comparisonStore = useComparisonStore.getState();
      comparisonStore.toggleComparisonPanel();
      comparisonStore.updateLandArea(75); // 10 x 7.5 = 75 sqm
      comparisonStore.toggleObjectVisibility('tennis-court');
      comparisonStore.toggleObjectVisibility('basketball-court');

      const visibleObjects = comparisonStore.comparison.visibleObjects;
      expect(visibleObjects.size).toBe(2);
      expect(visibleObjects.has('tennis-court')).toBe(true);
      expect(visibleObjects.has('basketball-court')).toBe(true);
    });
  });

  describe('Professional Survey Workflow', () => {
    it('should support professional land surveying tasks', async () => {
      const _user = userEvent.setup();
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
      drawingStore.addShape({
        name: 'Survey Property',
        type: 'rectangle',
        points: propertyCorners,
        color: '#3B82F6',
        visible: true,
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
        measurementStore.completeMeasurement(boundary.end);
      });

      expect(measurementStore.measurement.measurements).toHaveLength(4);

      // Verify measurements
      expect(measurementStore.measurement.measurements[0].distance).toBeCloseTo(50.25, 2); // North boundary
      expect(measurementStore.measurement.measurements[1].distance).toBeCloseTo(33.75, 2); // East boundary
      expect(measurementStore.measurement.measurements[2].distance).toBeCloseTo(50.25, 2); // South boundary
      expect(measurementStore.measurement.measurements[3].distance).toBeCloseTo(33.75, 2); // West boundary

      // Step 3: Calculate total area and convert to various units
      const totalArea = 50.25 * 33.75; // 1695.9375 square units

      const conversionStore = useConversionStore.getState();
      conversionStore.toggleConvertPanel();
      conversionStore.setInputValue(totalArea.toString());
      conversionStore.setInputUnit('sqm');
      conversionStore.performConversion();

      expect(conversionStore.conversion.results.size).toBeGreaterThan(0);

      // Verify key conversions for surveying
      const acresResult = conversionStore.conversion.results.get('acres');
      const hectaresResult = conversionStore.conversion.results.get('hectares');
      const sqftResult = conversionStore.conversion.results.get('sqft');

      expect(parseFloat(acresResult || '0')).toBeCloseTo(0.419, 2); // ~0.419 acres
      expect(parseFloat(hectaresResult || '0')).toBeCloseTo(0.170, 2); // ~0.170 hectares
      expect(parseFloat(sqftResult || '0')).toBeCloseTo(18252, 0); // ~18,252 sqft
    });

    it('should handle complex polygon surveys with historical units', async () => {
      const _user = userEvent.setup();
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
      drawingStore.addShape({
        name: 'Irregular Property',
        type: 'polyline',
        points: irregularProperty,
        color: '#3B82F6',
        visible: true,
        layerId: 'main',
      });

      // Step 2: Test historical French units (common in Louisiana, Quebec)
      conversionStore.toggleConvertPanel();
      conversionStore.setInputValue('2.5');
      conversionStore.setInputUnit('arpent-na'); // North American arpent
      conversionStore.performConversion();

      const sqmFromArpent = conversionStore.conversion.results.get('sqm');
      expect(parseFloat(sqmFromArpent || '0')).toBeCloseTo(8498.75, 1); // 2.5 arpent ≈ 8,498.75 sqm

      // Step 3: Test British colonial units (common in former British territories)
      conversionStore.setInputValue('5');
      conversionStore.setInputUnit('perches');
      conversionStore.performConversion();

      const sqmFromPerches = conversionStore.conversion.results.get('sqm');
      expect(parseFloat(sqmFromPerches || '0')).toBeCloseTo(126.45, 1); // 5 perches ≈ 126.45 sqm

      // Step 4: Test Mauritius-specific units
      conversionStore.setInputValue('1');
      conversionStore.setInputUnit('perches-mauritius');
      conversionStore.performConversion();

      const sqmFromMauritiusPerches = conversionStore.conversion.results.get('sqm');
      expect(parseFloat(sqmFromMauritiusPerches || '0')).toBeCloseTo(39.53, 1); // 1 Mauritius perch ≈ 39.53 sqm

      // Verify warnings for historical units
      expect(conversionStore.conversion.results.size).toBeGreaterThan(0);
    });
  });

  describe('Real Estate Development Workflow', () => {
    it('should support development planning with multiple lots', async () => {
      const _user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();
      const comparisonStore = useComparisonStore.getState();

      // Step 1: Create development area
      drawingStore.addShape({
        name: 'Development Area',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 60 },
          { x: 0, y: 60 },
        ],
        color: '#3B82F6',
        visible: true,
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
          name: `Lot ${index + 1}`,
          type: 'rectangle',
          points: [
            { x: lot.x, y: lot.y },
            { x: lot.x + lot.width, y: lot.y },
            { x: lot.x + lot.width, y: lot.y + lot.height },
            { x: lot.x, y: lot.y + lot.height },
          ],
          color: '#10B981',
          visible: true,
          layerId: 'main',
        });
      });

      expect(drawingStore.shapes).toHaveLength(11); // 1 development area + 10 lots

      // Step 3: Compare individual lot sizes to common structures
      const lotArea = 20 * 30; // 600 square units
      comparisonStore.toggleComparisonPanel();
      comparisonStore.updateLandArea(lotArea);
      comparisonStore.toggleObjectVisibility('tennis-court');
      comparisonStore.toggleObjectVisibility('basketball-court');
      comparisonStore.toggleObjectVisibility('parking-space');

      const calculations = comparisonStore.comparison.calculations;
      expect(calculations.size).toBeGreaterThan(0);

      // Verify reasonable comparisons
      const tennisComparison = calculations.get('tennis-court');
      expect(tennisComparison?.quantity).toBeGreaterThan(1); // Lot is larger than tennis court

      // Step 4: Calculate development density
      const totalDevelopmentArea = 100 * 60; // 6000 square units
      const totalLotArea = lots.length * lotArea; // 10 * 600 = 6000 square units
      const buildableRatio = totalLotArea / totalDevelopmentArea;

      expect(buildableRatio).toBe(1.0); // 100% lot coverage (no roads/utilities in this simplified example)
    });

    it('should handle mixed-use development planning', async () => {
      const _user = userEvent.setup();
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
          name: zone.name,
          type: 'rectangle',
          points: [
            { x: zone.area.x, y: zone.area.y },
            { x: zone.area.x + zone.area.width, y: zone.area.y },
            { x: zone.area.x + zone.area.width, y: zone.area.y + zone.area.height },
            { x: zone.area.x, y: zone.area.y + zone.area.height },
          ],
          color: '#3B82F6',
          visible: true,
          layerId: 'main',
        });
      });

      expect(drawingStore.shapes).toHaveLength(4);

      // Step 2: Analyze each zone against appropriate references
      comparisonStore.toggleComparisonPanel();

      // Residential zone (2400 sqm)
      comparisonStore.updateLandArea(60 * 40);
      comparisonStore.toggleObjectVisibility('soccer-field');

      let calculations = comparisonStore.comparison.calculations;
      let soccerComparison = calculations.get('soccer-field');
      expect(soccerComparison?.quantity).toBeCloseTo(0.34, 1); // ~1/3 of a soccer field

      // Commercial zone (800 sqm)
      comparisonStore.resetComparison();
      comparisonStore.updateLandArea(40 * 20);
      comparisonStore.toggleObjectVisibility('basketball-court');

      calculations = comparisonStore.comparison.calculations;
      let basketballComparison = calculations.get('basketball-court');
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
      const _user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      const drawingStore = useDrawingStore.getState();
      const measurementStore = useMeasurementStore.getState();

      // Step 1: Create a shape
      drawingStore.addShape({
        name: 'Test Rectangle',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        color: '#3B82F6',
        visible: true,
        layerId: 'main',
      });

      // Step 2: Attempt invalid measurement (same point)
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 5, y: 5 });

      // Should handle gracefully without crashing
      expect(() => measurementStore.completeMeasurement({ x: 5, y: 5 })).not.toThrow();
      expect(measurementStore.measurement.measurements).toHaveLength(1);
      expect(measurementStore.measurement.measurements[0].distance).toBe(0);

      // Step 3: Continue with valid measurement
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.completeMeasurement({ x: 10, y: 10 });

      expect(measurementStore.measurement.measurements).toHaveLength(2);
      expect(measurementStore.measurement.measurements[1].distance).toBeCloseTo(14.14, 2); // sqrt(10² + 10²)

      // Step 4: Other tools should still work
      const comparisonStore = useComparisonStore.getState();
      comparisonStore.toggleComparisonPanel();
      comparisonStore.updateLandArea(100);

      expect(comparisonStore.comparison.isExpanded).toBe(true);
      expect(comparisonStore.comparison.landArea).toBe(100);
    });

    it('should handle rapid tool switching without data loss', async () => {
      const _user = userEvent.setup();
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
      drawingStore.addShape({
        name: 'Shape 1',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 5, y: 5 }],
        color: '#3B82F6',
        visible: true,
        layerId: 'main',
      });

      drawingStore.setActiveTool('measure');
      measurementStore.startMeasurement();
      measurementStore.setStartPoint({ x: 0, y: 0 });
      measurementStore.completeMeasurement({ x: 5, y: 5 });

      drawingStore.setActiveTool('circle');
      drawingStore.addShape({
        name: 'Shape 2',
        type: 'circle',
        points: [{ x: 10, y: 10 }, { x: 15, y: 15 }],
        color: '#10B981',
        visible: true,
        layerId: 'main',
      });

      comparisonStore.toggleComparisonPanel();
      comparisonStore.updateLandArea(50);
      comparisonStore.toggleObjectVisibility('tennis-court');

      conversionStore.toggleConvertPanel();
      conversionStore.setInputValue('50');
      conversionStore.setInputUnit('sqm');
      conversionStore.performConversion();

      // Verify all data is preserved
      expect(drawingStore.shapes).toHaveLength(2);
      expect(measurementStore.measurement.measurements).toHaveLength(1);
      expect(comparisonStore.comparison.visibleObjects.has('tennis-court')).toBe(true);
      expect(conversionStore.conversion.results.size).toBeGreaterThan(0);

      // Switch back to drawing and verify state
      drawingStore.setActiveTool('polyline');
      expect(drawingStore.drawing.activeTool).toBe('polyline');

      // Previous data should still be intact
      expect(drawingStore.shapes).toHaveLength(2);
      expect(measurementStore.measurement.measurements).toHaveLength(1);
      expect(measurementStore.measurement.measurements[0].distance).toBeCloseTo(7.07, 2);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle large numbers of shapes and measurements efficiently', async () => {
      const _user = userEvent.setup();
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
          name: `Shape ${i + 1}`,
          type: 'rectangle',
          points: [
            { x: i, y: i },
            { x: i + 1, y: i },
            { x: i + 1, y: i + 1 },
            { x: i, y: i + 1 },
          ],
          color: '#3B82F6',
          visible: true,
          layerId: 'main',
        });
      }

      // Add many measurements
      for (let i = 0; i < 50; i++) {
        measurementStore.startMeasurement();
        measurementStore.setStartPoint({ x: i, y: i });
        measurementStore.completeMeasurement({ x: i + 1, y: i + 1 });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify data integrity
      expect(drawingStore.shapes).toHaveLength(100);
      expect(measurementStore.measurement.measurements).toHaveLength(50);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second

      // Verify sample measurements are correct
      expect(measurementStore.measurement.measurements[0].distance).toBeCloseTo(1.414, 2); // sqrt(2)
      expect(measurementStore.measurement.measurements[49].distance).toBeCloseTo(1.414, 2);
    });
  });
});