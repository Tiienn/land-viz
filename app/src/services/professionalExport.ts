import type { Shape } from '@/types';
import { precisionCalculator } from './precisionCalculations';
import { logger } from '../utils/logger';

export interface ExportOptions {
  format: 'excel' | 'dxf' | 'pdf' | 'geojson' | 'csv';
  includeCalculations: boolean;
  coordinateSystem: 'local' | 'utm' | 'wgs84';
  units: 'metric' | 'imperial';
  precision: number;
}

export interface ExportResult {
  success: boolean;
  data: string | Uint8Array;
  filename: string;
  contentType: string;
  timestamp: Date;
}

export class ProfessionalExportEngine {
  private static instance: ProfessionalExportEngine;
  
  public static getInstance(): ProfessionalExportEngine {
    if (!ProfessionalExportEngine.instance) {
      ProfessionalExportEngine.instance = new ProfessionalExportEngine();
    }
    return ProfessionalExportEngine.instance;
  }

  /**
   * Export shapes to Excel format with calculations
   */
  public async exportToExcel(shapes: Shape[], options: ExportOptions): Promise<ExportResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Create Excel-compatible CSV format
      const headers = [
        'ID',
        'Name', 
        'Type',
        'Area (m²)',
        'Area (ft²)', 
        'Area (acres)',
        'Perimeter (m)',
        'Perimeter (ft)',
        'Centroid X',
        'Centroid Y',
        'Created',
        'Coordinates'
      ];

      const rows: string[][] = [headers];
      
      for (const shape of shapes) {
        const measurements = precisionCalculator.calculateShapeMeasurements(shape);
        const coordsStr = shape.points.map(p => `(${p.x.toFixed(options.precision)},${p.y.toFixed(options.precision)})`).join(';');
        
        const row = [
          shape.id,
          shape.name,
          shape.type,
          measurements.area.squareMeters,
          measurements.area.squareFeet,
          measurements.area.acres,
          measurements.perimeter.meters,
          measurements.perimeter.feet,
          measurements.centroid.x.toFixed(options.precision),
          measurements.centroid.y.toFixed(options.precision),
          shape.created.toISOString(),
          coordsStr
        ];
        
        rows.push(row);
      }

      // Convert to CSV format
      const csvContent = rows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      return {
        success: true,
        data: csvContent,
        filename: `land-visualizer-export-${timestamp}.csv`,
        contentType: 'text/csv',
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Excel export failed:', error);
      return {
        success: false,
        data: '',
        filename: '',
        contentType: '',
        timestamp: new Date()
      };
    }
  }

  /**
   * Export shapes to DXF format for CAD software
   */
  public async exportToDXF(shapes: Shape[], options: ExportOptions): Promise<ExportResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Build DXF content
      let dxfContent = '';
      
      // DXF Header
      dxfContent += '0\nSECTION\n2\nHEADER\n';
      dxfContent += '9\n$ACADVER\n1\nAC1015\n'; // AutoCAD 2000 format
      dxfContent += '0\nENDSEC\n';

      // Tables section
      dxfContent += '0\nSECTION\n2\nTABLES\n';
      
      // Layer table
      dxfContent += '0\nTABLE\n2\nLAYER\n70\n1\n';
      dxfContent += '0\nLAYER\n2\nLAND_BOUNDARIES\n70\n0\n6\nCONTINUOUS\n62\n7\n';
      dxfContent += '0\nENDTAB\n';
      
      dxfContent += '0\nENDSEC\n';

      // Entities section
      dxfContent += '0\nSECTION\n2\nENTITIES\n';

      for (const shape of shapes) {
        if (shape.type === 'polygon' || shape.type === 'rectangle') {
          // Create LWPOLYLINE
          dxfContent += '0\nLWPOLYLINE\n';
          dxfContent += '8\nLAND_BOUNDARIES\n'; // Layer
          dxfContent += '90\n' + shape.points.length + '\n'; // Vertex count
          dxfContent += '70\n1\n'; // Closed polyline
          
          for (const point of shape.points) {
            dxfContent += '10\n' + point.x.toFixed(options.precision) + '\n';
            dxfContent += '20\n' + point.y.toFixed(options.precision) + '\n';
          }
        } else if (shape.type === 'polyline') {
          // Create LINE entities
          for (let i = 0; i < shape.points.length - 1; i++) {
            const p1 = shape.points[i];
            const p2 = shape.points[i + 1];
            
            dxfContent += '0\nLINE\n';
            dxfContent += '8\nLAND_BOUNDARIES\n';
            dxfContent += '10\n' + p1.x.toFixed(options.precision) + '\n';
            dxfContent += '20\n' + p1.y.toFixed(options.precision) + '\n';
            dxfContent += '11\n' + p2.x.toFixed(options.precision) + '\n';
            dxfContent += '21\n' + p2.y.toFixed(options.precision) + '\n';
          }
        } else if (shape.type === 'circle' && shape.points.length >= 2) {
          // Create CIRCLE
          const center = shape.points[0];
          const radiusPoint = shape.points[1];
          const radius = Math.sqrt(
            Math.pow(radiusPoint.x - center.x, 2) + 
            Math.pow(radiusPoint.y - center.y, 2)
          );
          
          dxfContent += '0\nCIRCLE\n';
          dxfContent += '8\nLAND_BOUNDARIES\n';
          dxfContent += '10\n' + center.x.toFixed(options.precision) + '\n';
          dxfContent += '20\n' + center.y.toFixed(options.precision) + '\n';
          dxfContent += '40\n' + radius.toFixed(options.precision) + '\n';
        }

        // Add text label with measurements
        if (options.includeCalculations) {
          const measurements = precisionCalculator.calculateShapeMeasurements(shape);
          const labelText = `${shape.name}\\PArea: ${measurements.area.squareMeters}m²`;
          const centroid = measurements.centroid;
          
          dxfContent += '0\nTEXT\n';
          dxfContent += '8\nLAND_BOUNDARIES\n';
          dxfContent += '10\n' + centroid.x.toFixed(options.precision) + '\n';
          dxfContent += '20\n' + centroid.y.toFixed(options.precision) + '\n';
          dxfContent += '40\n1.0\n'; // Text height
          dxfContent += '1\n' + labelText + '\n';
        }
      }

      dxfContent += '0\nENDSEC\n';
      dxfContent += '0\nEOF\n';

      return {
        success: true,
        data: dxfContent,
        filename: `land-visualizer-${timestamp}.dxf`,
        contentType: 'application/dxf',
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('DXF export failed:', error);
      return {
        success: false,
        data: '',
        filename: '',
        contentType: '',
        timestamp: new Date()
      };
    }
  }

  /**
   * Export shapes to GeoJSON format for GIS systems
   */
  public async exportToGeoJSON(shapes: Shape[], options: ExportOptions): Promise<ExportResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      const features = shapes.map(shape => {
        const measurements = precisionCalculator.calculateShapeMeasurements(shape);
        let geometry: unknown;

        switch (shape.type) {
          case 'polygon':
          case 'rectangle': {
            // Close the polygon if needed
            const coords = [...shape.points];
            if (coords[0].x !== coords[coords.length - 1].x || coords[0].y !== coords[coords.length - 1].y) {
              coords.push(coords[0]);
            }
            geometry = {
              type: 'Polygon',
              coordinates: [coords.map(p => [p.x, p.y])]
            };
            break;
          }
          
          case 'line':
            geometry = {
              type: 'LineString',
              coordinates: shape.points.map(p => [p.x, p.y])
            };
            break;
          
          case 'circle': {
            if (shape.points.length >= 2) {
              const center = shape.points[0];
              geometry = {
                type: 'Point',
                coordinates: [center.x, center.y]
              };
            }
            break;
          }
        }

        return {
          type: 'Feature',
          properties: {
            id: shape.id,
            name: shape.name,
            type: shape.type,
            area_m2: parseFloat(measurements.area.squareMeters),
            area_ft2: parseFloat(measurements.area.squareFeet),
            area_acres: parseFloat(measurements.area.acres),
            perimeter_m: parseFloat(measurements.perimeter.meters),
            perimeter_ft: parseFloat(measurements.perimeter.feet),
            centroid_x: measurements.centroid.x,
            centroid_y: measurements.centroid.y,
            created: shape.created.toISOString(),
            color: shape.color,
            visible: shape.visible
          },
          geometry
        };
      });

      const geoJson = {
        type: 'FeatureCollection',
        crs: {
          type: 'name',
          properties: {
            name: options.coordinateSystem === 'wgs84' ? 'EPSG:4326' : 'EPSG:3857'
          }
        },
        features
      };

      return {
        success: true,
        data: JSON.stringify(geoJson, null, 2),
        filename: `land-visualizer-${timestamp}.geojson`,
        contentType: 'application/geo+json',
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('GeoJSON export failed:', error);
      return {
        success: false,
        data: '',
        filename: '',
        contentType: '',
        timestamp: new Date()
      };
    }
  }

  /**
   * Export shapes to PDF report
   */
  public async exportToPDF(shapes: Shape[], options: ExportOptions): Promise<ExportResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Create a simple PDF-like text report (in a real implementation, you'd use a PDF library)
      let pdfContent = `LAND VISUALIZATION REPORT\n`;
      pdfContent += `Generated: ${new Date().toLocaleString()}\n`;
      pdfContent += `Coordinate System: ${options.coordinateSystem.toUpperCase()}\n`;
      pdfContent += `Units: ${options.units}\n`;
      pdfContent += `Precision: ${options.precision} decimal places\n\n`;
      
      let totalArea = 0;
      
      shapes.forEach((shape, index) => {
        const measurements = precisionCalculator.calculateShapeMeasurements(shape);
        totalArea += parseFloat(measurements.area.squareMeters);
        
        pdfContent += `PARCEL ${index + 1}: ${shape.name}\n`;
        pdfContent += `Type: ${shape.type.toUpperCase()}\n`;
        pdfContent += `Area: ${measurements.area.squareMeters} m² (${measurements.area.squareFeet} ft², ${measurements.area.acres} acres)\n`;
        pdfContent += `Perimeter: ${measurements.perimeter.meters} m (${measurements.perimeter.feet} ft)\n`;
        pdfContent += `Centroid: (${measurements.centroid.x.toFixed(options.precision)}, ${measurements.centroid.y.toFixed(options.precision)})\n`;
        pdfContent += `Created: ${shape.created.toLocaleString()}\n`;
        
        pdfContent += `Boundary Coordinates:\n`;
        shape.points.forEach((point, i) => {
          pdfContent += `  Point ${i + 1}: (${point.x.toFixed(options.precision)}, ${point.y.toFixed(options.precision)})\n`;
        });
        pdfContent += `\n`;
      });
      
      pdfContent += `SUMMARY:\n`;
      pdfContent += `Total Properties: ${shapes.length}\n`;
      pdfContent += `Total Area: ${totalArea.toFixed(2)} m²\n`;
      pdfContent += `Average Area: ${(totalArea / shapes.length).toFixed(2)} m²\n\n`;
      
      pdfContent += `Generated by Land Visualizer - Professional 3D Land Analysis Tool\n`;

      return {
        success: true,
        data: pdfContent,
        filename: `land-report-${timestamp}.txt`, // In real implementation, this would be .pdf
        contentType: 'text/plain', // In real implementation, this would be 'application/pdf'
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('PDF export failed:', error);
      return {
        success: false,
        data: '',
        filename: '',
        contentType: '',
        timestamp: new Date()
      };
    }
  }

  /**
   * Download export result as file
   */
  public downloadFile(result: ExportResult): void {
    try {
      let blob: Blob;
      
      if (typeof result.data === 'string') {
        blob = new Blob([result.data], { type: result.contentType });
      } else {
        blob = new Blob([result.data], { type: result.contentType });
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Download failed:', error);
    }
  }
}

// Export singleton instance
export const professionalExportEngine = ProfessionalExportEngine.getInstance();