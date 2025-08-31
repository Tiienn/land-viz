import { describe, it, expect } from 'vitest';
import { professionalExportEngine, type ExportOptions } from './professionalExport';
import type { Shape, Point2D } from '@/types';

describe('ProfessionalExportEngine', () => {
  // Helper function to create test shapes
  const createTestShape = (
    points: Point2D[], 
    id: string = 'test-shape', 
    name: string = 'Test Property'
  ): Shape => ({
    id,
    type: 'polygon',
    points,
    name,
    color: '#3B82F6',
    visible: true,
    layerId: 'default-layer',
    created: new Date('2024-01-01T00:00:00Z'),
    modified: new Date('2024-01-01T00:00:00Z')
  });

  const defaultExportOptions: ExportOptions = {
    format: 'excel',
    includeCalculations: true,
    coordinateSystem: 'local',
    units: 'metric',
    precision: 2
  };

  const testShapes: Shape[] = [
    createTestShape([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ], 'square-1', 'Square Property'),
    createTestShape([
      { x: 15, y: 5 },
      { x: 25, y: 5 },
      { x: 25, y: 15 },
      { x: 15, y: 15 }
    ], 'square-2', 'Rectangle Property')
  ];

  describe('Excel Export', () => {
    it('should export shapes to CSV format', async () => {
      const result = await professionalExportEngine.exportToExcel(testShapes, defaultExportOptions);

      expect(result.success).toBe(true);
      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toMatch(/land-visualizer-export-.*\.csv/);
      expect(typeof result.data).toBe('string');
      
      const csvData = result.data as string;
      expect(csvData).toContain('"ID","Name","Type"');
      expect(csvData).toContain('Square Property');
      expect(csvData).toContain('Rectangle Property');
      expect(csvData).toContain('100.00'); // Area of first square
    });

    it('should include all required columns', async () => {
      const result = await professionalExportEngine.exportToExcel(testShapes, defaultExportOptions);
      
      const csvData = result.data as string;
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      expect(headers).toContain('ID');
      expect(headers).toContain('Name');
      expect(headers).toContain('Type');
      expect(headers).toContain('Area (m²)');
      expect(headers).toContain('Area (ft²)');
      expect(headers).toContain('Perimeter (m)');
      expect(headers).toContain('Centroid X');
      expect(headers).toContain('Centroid Y');
      expect(headers).toContain('Coordinates');
    });

    it('should handle empty shapes array', async () => {
      const result = await professionalExportEngine.exportToExcel([], defaultExportOptions);

      expect(result.success).toBe(true);
      expect(result.data).toContain('"ID","Name","Type"'); // Headers only
    });
  });

  describe('DXF Export', () => {
    it('should export shapes to DXF format', async () => {
      const options: ExportOptions = { ...defaultExportOptions, format: 'dxf' };
      const result = await professionalExportEngine.exportToDXF(testShapes, options);

      expect(result.success).toBe(true);
      expect(result.contentType).toBe('application/dxf');
      expect(result.filename).toMatch(/land-visualizer-.*\.dxf/);
      
      const dxfData = result.data as string;
      expect(dxfData).toContain('SECTION');
      expect(dxfData).toContain('HEADER');
      expect(dxfData).toContain('ENTITIES');
      expect(dxfData).toContain('LWPOLYLINE');
      expect(dxfData).toContain('LAND_BOUNDARIES');
    });

    it('should include measurements when requested', async () => {
      const options: ExportOptions = { 
        ...defaultExportOptions, 
        format: 'dxf', 
        includeCalculations: true 
      };
      const result = await professionalExportEngine.exportToDXF(testShapes, options);

      const dxfData = result.data as string;
      expect(dxfData).toContain('TEXT');
      expect(dxfData).toContain('Area:');
    });

    it('should handle different shape types', async () => {
      const shapes = [
        { ...testShapes[0], type: 'polygon' as const },
        { ...testShapes[1], type: 'line' as const },
        createTestShape([
          { x: 0, y: 0 }, { x: 5, y: 0 }
        ], 'circle-1', 'Circle Property')
      ];
      shapes[2].type = 'circle';

      const options: ExportOptions = { ...defaultExportOptions, format: 'dxf' };
      const result = await professionalExportEngine.exportToDXF(shapes, options);

      expect(result.success).toBe(true);
      const dxfData = result.data as string;
      expect(dxfData).toContain('LWPOLYLINE'); // Polygon
      expect(dxfData).toContain('LINE'); // Line
      expect(dxfData).toContain('CIRCLE'); // Circle
    });
  });

  describe('GeoJSON Export', () => {
    it('should export shapes to GeoJSON format', async () => {
      const options: ExportOptions = { ...defaultExportOptions, format: 'geojson' };
      const result = await professionalExportEngine.exportToGeoJSON(testShapes, options);

      expect(result.success).toBe(true);
      expect(result.contentType).toBe('application/geo+json');
      expect(result.filename).toMatch(/land-visualizer-.*\.geojson/);
      
      const geoJsonData = JSON.parse(result.data as string);
      expect(geoJsonData.type).toBe('FeatureCollection');
      expect(geoJsonData.features).toHaveLength(2);
      expect(geoJsonData.crs.properties.name).toBe('EPSG:3857');
    });

    it('should include all shape properties', async () => {
      const options: ExportOptions = { ...defaultExportOptions, format: 'geojson' };
      const result = await professionalExportEngine.exportToGeoJSON(testShapes, options);

      const geoJsonData = JSON.parse(result.data as string);
      const feature = geoJsonData.features[0];
      
      expect(feature.properties.id).toBe('square-1');
      expect(feature.properties.name).toBe('Square Property');
      expect(feature.properties.type).toBe('polygon');
      expect(feature.properties.area_m2).toBe(100);
      expect(feature.properties).toHaveProperty('area_ft2');
      expect(feature.properties).toHaveProperty('area_acres');
      expect(feature.properties).toHaveProperty('perimeter_m');
      expect(feature.properties).toHaveProperty('centroid_x');
      expect(feature.properties).toHaveProperty('centroid_y');
    });

    it('should handle different coordinate systems', async () => {
      const options: ExportOptions = { 
        ...defaultExportOptions, 
        format: 'geojson',
        coordinateSystem: 'wgs84'
      };
      const result = await professionalExportEngine.exportToGeoJSON(testShapes, options);

      const geoJsonData = JSON.parse(result.data as string);
      expect(geoJsonData.crs.properties.name).toBe('EPSG:4326');
    });

    it('should create proper geometries for different shapes', async () => {
      const shapes = [
        { ...testShapes[0], type: 'polygon' as const },
        { ...testShapes[1], type: 'line' as const },
        createTestShape([
          { x: 0, y: 0 }, { x: 5, y: 0 }
        ], 'circle-1', 'Circle Property')
      ];
      shapes[2].type = 'circle';

      const options: ExportOptions = { ...defaultExportOptions, format: 'geojson' };
      const result = await professionalExportEngine.exportToGeoJSON(shapes, options);

      const geoJsonData = JSON.parse(result.data as string);
      expect(geoJsonData.features[0].geometry.type).toBe('Polygon');
      expect(geoJsonData.features[1].geometry.type).toBe('LineString');
      expect(geoJsonData.features[2].geometry.type).toBe('Point');
    });
  });

  describe('PDF Export', () => {
    it('should export shapes to PDF report format', async () => {
      const options: ExportOptions = { ...defaultExportOptions, format: 'pdf' };
      const result = await professionalExportEngine.exportToPDF(testShapes, options);

      expect(result.success).toBe(true);
      expect(result.contentType).toBe('text/plain'); // Would be 'application/pdf' in real implementation
      expect(result.filename).toMatch(/land-report-.*\.txt/);
      
      const pdfData = result.data as string;
      expect(pdfData).toContain('LAND VISUALIZATION REPORT');
      expect(pdfData).toContain('Square Property');
      expect(pdfData).toContain('Rectangle Property');
      expect(pdfData).toContain('Total Properties: 2');
    });

    it('should include detailed measurements', async () => {
      const options: ExportOptions = { ...defaultExportOptions, format: 'pdf' };
      const result = await professionalExportEngine.exportToPDF(testShapes, options);

      const pdfData = result.data as string;
      expect(pdfData).toContain('Area: 100.00 m²');
      expect(pdfData).toContain('Perimeter:');
      expect(pdfData).toContain('Centroid:');
      expect(pdfData).toContain('Boundary Coordinates:');
    });

    it('should include summary statistics', async () => {
      const options: ExportOptions = { ...defaultExportOptions, format: 'pdf' };
      const result = await professionalExportEngine.exportToPDF(testShapes, options);

      const pdfData = result.data as string;
      expect(pdfData).toContain('SUMMARY:');
      expect(pdfData).toContain('Total Area:');
      expect(pdfData).toContain('Average Area:');
    });
  });

  describe('Export Options', () => {
    it('should respect precision setting', async () => {
      const highPrecisionOptions: ExportOptions = {
        ...defaultExportOptions,
        precision: 6
      };

      const result = await professionalExportEngine.exportToExcel(testShapes, highPrecisionOptions);
      const csvData = result.data as string;
      
      // Should include coordinates with 6 decimal places
      expect(csvData).toMatch(/\d+\.\d{6}/);
    });

    it('should handle different units', async () => {
      const imperialOptions: ExportOptions = {
        ...defaultExportOptions,
        units: 'imperial'
      };

      const result = await professionalExportEngine.exportToExcel(testShapes, imperialOptions);
      expect(result.success).toBe(true);
      
      // The export should still work (unit conversion logic would be in a full implementation)
      expect(result.data).toBeTruthy();
    });

    it('should toggle calculation inclusion', async () => {
      const noCalcOptions: ExportOptions = {
        ...defaultExportOptions,
        includeCalculations: false,
        format: 'dxf'
      };

      const result = await professionalExportEngine.exportToDXF(testShapes, noCalcOptions);
      const dxfData = result.data as string;
      
      // Should not include TEXT elements with measurements
      expect(dxfData).not.toContain('TEXT');
    });
  });

  describe('Error Handling', () => {
    it('should handle export failures gracefully', async () => {
      // Create a malformed shape that might cause export issues
      const malformedShape = createTestShape([], 'bad-shape', 'Bad Shape');

      const result = await professionalExportEngine.exportToExcel([malformedShape], defaultExportOptions);
      
      // Should either succeed or fail gracefully without throwing
      expect(typeof result.success).toBe('boolean');
    });

    it('should generate unique timestamps', async () => {
      const result1 = await professionalExportEngine.exportToExcel(testShapes, defaultExportOptions);
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay
      const result2 = await professionalExportEngine.exportToExcel(testShapes, defaultExportOptions);

      expect(result1.filename).not.toBe(result2.filename);
      expect(result1.timestamp.getTime()).toBeLessThan(result2.timestamp.getTime());
    });
  });

  describe('File Download', () => {
    it('should have download method available', () => {
      // Test that the method exists
      expect(typeof professionalExportEngine.downloadFile).toBe('function');
    });
  });
});