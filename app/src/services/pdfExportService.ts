import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Shape } from '../types';
import type { ExportFilters } from '../types/export';

/**
 * Export shapes to PDF document
 * Generates a professional multi-page report with shape data based on selected filters
 * Page 1: Full-page drawing preview (if provided) with summary
 * Page 2+: Detailed data table
 *
 * @param shapes - Array of shapes to export
 * @param filters - Export filters for column selection
 * @param sceneImageDataURL - Optional scene snapshot (PNG data URL) for visual preview
 */
export async function exportToPDF(
  shapes: Shape[],
  filters: ExportFilters,
  sceneImageDataURL?: string
): Promise<Blob> {
  // Validate input
  if (!shapes || shapes.length === 0) {
    throw new Error('No shapes to export');
  }

  // Validate at least one filter is enabled
  const hasAnyFilter = filters.basicInfo || filters.dimensions || filters.position || filters.visual || filters.metadata;
  if (!hasAnyFilter) {
    throw new Error('Please select at least one property to export');
  }

  // Create PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Brand colors
  const tealColor = rgb(0, 196 / 255, 204 / 255); // #00C4CC
  const blackColor = rgb(0, 0, 0);
  const grayColor = rgb(0.4, 0.4, 0.4);

  // Layout constants
  const PAGE_WIDTH = 612; // Letter size width
  const PAGE_HEIGHT = 792; // Letter size height
  const MARGIN = 50;
  const FOOTER_HEIGHT = 50;
  const ROW_HEIGHT = 20;

  // Try to embed the scene image
  let hasImage = false;
  let imageWidth = 0;
  let imageHeight = 0;
  let pngImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;

  if (sceneImageDataURL) {
    try {
      // Extract base64 data (remove "data:image/png;base64," prefix if present)
      const base64Data = sceneImageDataURL.includes(',')
        ? sceneImageDataURL.split(',')[1]
        : sceneImageDataURL;

      // Validate base64 data before embedding
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Base64 data is empty');
      }

      // Check if base64 data contains only valid characters
      // Valid base64: A-Z, a-z, 0-9, +, /, = (padding)
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      if (!base64Regex.test(base64Data)) {
        throw new Error('Invalid base64 format: contains invalid characters');
      }

      // Check minimum length (PNG header is ~100 bytes base64-encoded)
      // A 1x1 PNG is ~68 bytes raw, ~92 bytes base64
      if (base64Data.length < 80) {
        throw new Error(`Base64 data too short (${base64Data.length} chars), likely corrupted`);
      }

      // Check for PNG signature in decoded data (optional but recommended)
      // PNG files start with: 89 50 4E 47 0D 0A 1A 0A (hex)
      // In base64, this starts with: iVBORw0KGgo
      if (!base64Data.startsWith('iVBORw0KGgo')) {
        console.warn('[PDF Export] Warning: Base64 data does not start with PNG signature, may not be a valid PNG');
        // Don't throw - pdf-lib will handle invalid format gracefully
      }

      pngImage = await pdfDoc.embedPng(base64Data);

      // Calculate dimensions to fit full page (maximize size while maintaining aspect ratio)
      const maxWidth = PAGE_WIDTH - (MARGIN * 2); // 512pt usable width
      const maxHeight = 650; // Use most of the vertical space (yPos ~644, footer at 30)

      const imgAspect = pngImage.width / pngImage.height;

      // Try both width-constrained and height-constrained scaling, pick the larger
      const widthConstrainedHeight = maxWidth / imgAspect;
      const heightConstrainedWidth = maxHeight * imgAspect;

      if (widthConstrainedHeight <= maxHeight) {
        // Width is the limiting factor
        imageWidth = maxWidth;
        imageHeight = widthConstrainedHeight;
      } else {
        // Height is the limiting factor
        imageWidth = heightConstrainedWidth;
        imageHeight = maxHeight;
      }

      hasImage = true;
    } catch (error) {
      console.error('Failed to embed scene preview:', error);
      // Continue without image - graceful degradation
    }
  }

  // Calculate shape type breakdown
  const shapeTypeCounts = shapes.reduce((acc, shape) => {
    const type = shape.type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalArea = shapes.reduce((sum, shape) => {
    const area = calculateArea(shape);
    return sum + area;
  }, 0);

  // Build table headers based on selected filters
  const headers: string[] = [];
  const columnWidths: number[] = [];

  // Determine which columns to include based on filters (reduced widths to fit page)
  if (filters.includeShapeType) {
    headers.push('Type');
    columnWidths.push(60);
  }
  if (filters.includeShapeName) {
    headers.push('Name');
    columnWidths.push(80);
  }
  if (filters.includeShapeId) {
    headers.push('ID');
    columnWidths.push(70);
  }
  if (filters.includeWidth) {
    headers.push('W (m)');
    columnWidths.push(50);
  }
  if (filters.includeHeight) {
    headers.push('H (m)');
    columnWidths.push(50);
  }
  if (filters.includeArea) {
    headers.push('Area');
    columnWidths.push(60);
  }
  if (filters.includePerimeter) {
    headers.push('Perim');
    columnWidths.push(55);
  }
  if (filters.includeColor) {
    headers.push('Color');
    columnWidths.push(60);
  }
  if (filters.includeVisibility) {
    headers.push('Vis');
    columnWidths.push(35);
  }
  if (filters.includeRotation) {
    headers.push('Rot');
    columnWidths.push(40);
  }
  if (filters.includeLayer) {
    headers.push('Layer');
    columnWidths.push(55);
  }
  if (filters.includeGroup) {
    headers.push('Group');
    columnWidths.push(55);
  }
  if (filters.includeLocked) {
    headers.push('Lock');
    columnWidths.push(35);
  }
  if (filters.includeTimestamps) {
    headers.push('Created');
    columnWidths.push(65);
  }

  // If no columns selected, show a minimum set
  if (headers.length === 0) {
    headers.push('Type', 'Name');
    columnWidths.push(80, 120);
  }

  const tableWidth = columnWidths.reduce((a, b) => a + b, 0) + 20;

  // Helper function to draw table header
  const drawTableHeader = (page: ReturnType<typeof pdfDoc.addPage>, yPos: number) => {
    // Header row background with subtle border
    page.drawRectangle({
      x: MARGIN,
      y: yPos - 5,
      width: tableWidth,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
    });

    headers.forEach((header, i) => {
      const xPos = MARGIN + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5;
      page.drawText(header, {
        x: xPos,
        y: yPos,
        size: 11,
        font: boldFont,
        color: blackColor,
      });
    });

    return yPos - 25;
  };

  // Helper function to draw a table row
  const drawTableRow = (
    page: ReturnType<typeof pdfDoc.addPage>,
    shape: Shape,
    index: number,
    yPos: number,
    isAlternate: boolean
  ) => {
    // Alternate row colors with subtle borders
    if (isAlternate) {
      page.drawRectangle({
        x: MARGIN,
        y: yPos - 5,
        width: tableWidth,
        height: ROW_HEIGHT,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    // Build row data based on selected filters
    const row: string[] = [];
    if (filters.includeShapeType) {
      row.push(shape.type || 'Unknown');
    }
    if (filters.includeShapeName) {
      row.push((shape.name || `Shape ${index + 1}`).substring(0, 15));
    }
    if (filters.includeShapeId) {
      row.push(shape.id.substring(0, 8));
    }
    if (filters.includeWidth) {
      row.push(getShapeWidth(shape));
    }
    if (filters.includeHeight) {
      row.push(getShapeHeight(shape));
    }
    if (filters.includeArea) {
      row.push(calculateArea(shape).toFixed(2));
    }
    if (filters.includePerimeter) {
      row.push(calculatePerimeter(shape).toFixed(2));
    }
    if (filters.includeColor) {
      // eslint-disable-next-line no-restricted-syntax
      row.push(shape.color || '#000000');
    }
    if (filters.includeVisibility) {
      row.push(shape.visible ? 'Yes' : 'No');
    }
    if (filters.includeRotation) {
      row.push(shape.rotation ? `${shape.rotation.angle.toFixed(1)}°` : '0°');
    }
    if (filters.includeLayer) {
      row.push(shape.layerId?.substring(0, 8) || 'N/A');
    }
    if (filters.includeGroup) {
      row.push(shape.groupId?.substring(0, 8) || 'N/A');
    }
    if (filters.includeLocked) {
      row.push(shape.locked ? 'Yes' : 'No');
    }
    if (filters.includeTimestamps) {
      row.push(new Date(shape.created).toLocaleDateString());
    }

    // Fallback if no filters selected
    if (row.length === 0) {
      row.push(shape.type || 'Unknown', (shape.name || `Shape ${index + 1}`).substring(0, 15));
    }

    row.forEach((cell, i) => {
      const xPos = MARGIN + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5;
      page.drawText(cell.toString(), {
        x: xPos,
        y: yPos,
        size: 10,
        font: font,
        color: blackColor,
      });
    });

    return yPos - ROW_HEIGHT;
  };

  // Date string (used in multiple places)
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Breakdown string for summary
  const breakdown = Object.entries(shapeTypeCounts)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');

  // ===== PAGE 1: DRAWING PREVIEW + SUMMARY =====
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPos = PAGE_HEIGHT - MARGIN;

  // Page 1 Header
  page1.drawText('Land Visualizer Export Report', {
    x: MARGIN,
    y: yPos,
    size: 20,
    font: boldFont,
    color: tealColor,
  });
  yPos -= 25;

  page1.drawText(`Export Date: ${now}`, {
    x: MARGIN,
    y: yPos,
    size: 12,
    font: font,
    color: grayColor,
  });
  yPos -= 25;

  // Summary section
  page1.drawText(`Summary: ${shapes.length} shapes, ${totalArea.toFixed(2)} m²`, {
    x: MARGIN,
    y: yPos,
    size: 11,
    font: boldFont,
    color: blackColor,
  });
  yPos -= 18;

  page1.drawText(`Breakdown: ${breakdown}`, {
    x: MARGIN,
    y: yPos,
    size: 10,
    font: font,
    color: grayColor,
  });
  yPos -= 30;

  // Draw scene image (if available)
  if (hasImage && pngImage) {
    // Center the image horizontally
    const xOffset = (PAGE_WIDTH - imageWidth) / 2;

    page1.drawImage(pngImage, {
      x: xOffset,
      y: yPos - imageHeight,
      width: imageWidth,
      height: imageHeight,
    });

    yPos -= imageHeight + 10;
  }

  // Page 1 Footer
  page1.drawText('Generated by Land Visualizer', {
    x: MARGIN,
    y: 30,
    size: 10,
    font: font,
    color: grayColor,
  });

  // Calculate total pages (page 1 + table pages)
  const rowsPerPage = Math.floor((PAGE_HEIGHT - MARGIN - 80 - FOOTER_HEIGHT) / ROW_HEIGHT) - 1; // -1 for header
  const totalTablePages = Math.ceil(shapes.length / rowsPerPage);
  const totalPages = 1 + totalTablePages; // Page 1 + table pages

  page1.drawText(`Page 1 of ${totalPages}`, {
    x: PAGE_WIDTH - 100,
    y: 30,
    size: 10,
    font: font,
    color: grayColor,
  });

  // ===== PAGE 2+: DATA TABLE =====
  for (let tablePageNum = 0; tablePageNum < totalTablePages; tablePageNum++) {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const actualPageNum = tablePageNum + 2; // Page 2, 3, 4...
    let yPosition = PAGE_HEIGHT - MARGIN;

    // Page header (simplified for table pages)
    page.drawText('Land Visualizer Export Report', {
      x: MARGIN,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: tealColor,
    });
    yPosition -= 20;

    page.drawText(`Export Date: ${now}`, {
      x: MARGIN,
      y: yPosition,
      size: 10,
      font: font,
      color: grayColor,
    });
    yPosition -= 40;

    // Draw table header
    yPosition = drawTableHeader(page, yPosition);

    // Calculate which shapes to show on this page
    const startIdx = tablePageNum * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, shapes.length);
    const pageShapes = shapes.slice(startIdx, endIdx);

    // Draw rows for this page
    pageShapes.forEach((shape, localIndex) => {
      const globalIndex = startIdx + localIndex;
      const isAlternate = globalIndex % 2 === 0;
      yPosition = drawTableRow(page, shape, globalIndex, yPosition, isAlternate);
    });

    // Page footer
    page.drawText('Generated by Land Visualizer', {
      x: MARGIN,
      y: 30,
      size: 10,
      font: font,
      color: grayColor,
    });

    page.drawText(`Page ${actualPageNum} of ${totalPages}`, {
      x: PAGE_WIDTH - 100,
      y: 30,
      size: 10,
      font: font,
      color: grayColor,
    });
  }

  // Save PDF - returns Uint8Array which we wrap in a Blob
  const pdfBytes = await pdfDoc.save();

  // Ensure we have a valid Uint8Array
  if (!pdfBytes || !(pdfBytes instanceof Uint8Array)) {
    throw new Error('PDF generation failed: invalid byte array');
  }

  // Create blob from Uint8Array - use the buffer property for better compatibility
  const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });

  return blob;
}

/**
 * Get shape width as string
 */
function getShapeWidth(shape: Shape): string {
  // For shapes with width property
  if ('width' in shape && typeof shape.width === 'number') {
    return shape.width.toFixed(2);
  }

  // Calculate from points if available
  if (shape.points && shape.points.length >= 2) {
    const xs = shape.points.map(p => p.x);
    const width = Math.max(...xs) - Math.min(...xs);
    return width.toFixed(2);
  }

  return 'N/A';
}

/**
 * Get shape height as string
 */
function getShapeHeight(shape: Shape): string {
  // For shapes with height property
  if ('height' in shape && typeof shape.height === 'number') {
    return shape.height.toFixed(2);
  }

  // Calculate from points if available
  if (shape.points && shape.points.length >= 2) {
    const ys = shape.points.map(p => p.y);
    const height = Math.max(...ys) - Math.min(...ys);
    return height.toFixed(2);
  }

  return 'N/A';
}

/**
 * Calculate shape area in square meters
 */
function calculateArea(shape: Shape): number {
  if (!shape.points || shape.points.length < 3) {
    return 0;
  }

  // For circles
  if (shape.type === 'circle' && shape.points.length >= 2) {
    const center = shape.points[0];
    const radiusPoint = shape.points[1];
    const radius = Math.sqrt(
      Math.pow(radiusPoint.x - center.x, 2) + Math.pow(radiusPoint.y - center.y, 2)
    );
    return Math.PI * radius * radius;
  }

  // For polygons (using shoelace formula)
  let area = 0;
  const n = shape.points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += shape.points[i].x * shape.points[j].y;
    area -= shape.points[j].x * shape.points[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Calculate shape perimeter in meters
 */
function calculatePerimeter(shape: Shape): number {
  if (!shape.points || shape.points.length < 2) {
    return 0;
  }

  // For circles
  if (shape.type === 'circle' && shape.points.length >= 2) {
    const center = shape.points[0];
    const radiusPoint = shape.points[1];
    const radius = Math.sqrt(
      Math.pow(radiusPoint.x - center.x, 2) + Math.pow(radiusPoint.y - center.y, 2)
    );
    return 2 * Math.PI * radius;
  }

  // For polygons and polylines
  let perimeter = 0;
  const n = shape.points.length;
  const isClosed = shape.type === 'polygon' || shape.type === 'rectangle';

  for (let i = 0; i < n - 1; i++) {
    const dx = shape.points[i + 1].x - shape.points[i].x;
    const dy = shape.points[i + 1].y - shape.points[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }

  // Close the shape if needed
  if (isClosed && n > 2) {
    const dx = shape.points[0].x - shape.points[n - 1].x;
    const dy = shape.points[0].y - shape.points[n - 1].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }

  return perimeter;
}
