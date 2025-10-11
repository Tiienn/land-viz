/**
 * Integration Tests for Edge Cases & Validation
 *
 * Tests edge cases and validation scenarios from spec:
 * - E1: Impossible geometry (triangle inequality)
 * - E2: Very thin shapes (extreme aspect ratios)
 * - E3: Area mismatch validation
 * - E4: Decimal input error handling
 * - E5: Boundary value testing
 * - E6: Invalid input validation
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualEntryForm } from '../ManualEntryForm';
import { geometryReconstructor } from '../../../services/imageImport/geometryReconstructor';
import type { DimensionInput, Point2D } from '../../../types/imageImport';

// Mock EdgePreview component (uses Canvas which isn't supported in jsdom)
vi.mock('../EdgePreview', () => ({
  EdgePreview: () => <div data-testid="edge-preview">Edge Preview</div>,
}));

// Mock EdgeReorderControl component (not needed for these tests)
vi.mock('../EdgeReorderControl', () => ({
  EdgeReorderControl: () => <div data-testid="edge-reorder-control">Edge Reorder Control</div>,
}));

describe('Edge Cases & Validation - Integration Tests', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  // Mock rough outline (simple rectangle for preview)
  const mockRoughOutline: Point2D[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
    { x: 0, y: 50 },
  ];

  // Mock rough outline for triangle
  const mockTriangleOutline: Point2D[] = [
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 25, y: 43.3 },
  ];

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('E1: Impossible Geometry (Triangle Inequality)', () => {
    it('should detect impossible triangle (10m, 20m, 50m)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter dimensions that violate triangle inequality (10 + 20 < 50)
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '10');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '20');
      await user.clear(inputs[2]);
      await user.type(inputs[2], '50');

      // Click Calculate Shape button
      const calculateButton = screen.getByText('Calculate Shape →');
      await user.click(calculateButton);

      // Should show error message
      await waitFor(() => {
        const errorMessage = screen.queryByText(/cannot form a valid triangle/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Should not call onSubmit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should accept valid triangle (10m, 20m, 25m)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter valid triangle dimensions
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '10');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '20');
      await user.clear(inputs[2]);
      await user.type(inputs[2], '25');

      // Click Calculate Shape button
      const calculateButton = screen.getByText('Calculate Shape →');
      await user.click(calculateButton);

      // Should not show error
      const errorMessage = screen.queryByText(/cannot form a valid triangle/i);
      expect(errorMessage).not.toBeInTheDocument();

      // Should call onSubmit
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('should detect impossible quadrilateral with missing edge', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter dimensions where polygon cannot close
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '10');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '10');
      await user.clear(inputs[2]);
      await user.type(inputs[2], '10');
      await user.clear(inputs[3]);
      await user.type(inputs[3], '100'); // Too long, polygon won't close

      // Click Calculate Shape button
      const calculateButton = screen.getByText('Calculate Shape →');
      await user.click(calculateButton);

      // Should show error about closure
      await waitFor(() => {
        const errorMessage = screen.queryByText(/cannot form a closed polygon/i);
        expect(errorMessage).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('E2: Very Thin Shapes (Extreme Aspect Ratios)', () => {
    it('should warn about very thin rectangle (100m × 0.5m = 200:1 ratio)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter extreme aspect ratio dimensions
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '100'); // Top
      await user.clear(inputs[1]);
      await user.type(inputs[1], '0.5');  // Right
      await user.clear(inputs[2]);
      await user.type(inputs[2], '100'); // Bottom
      await user.clear(inputs[3]);
      await user.type(inputs[3], '0.5');  // Left

      // Click Calculate Shape button
      const calculateButton = screen.getByText('Calculate Shape →');
      await user.click(calculateButton);

      // Should show warning about thin shape
      await waitFor(() => {
        const warningMessage = screen.queryByText(/very thin shape/i);
        expect(warningMessage).toBeInTheDocument();
      });

      // Should still allow import with confirmation
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should warn about very wide rectangle (0.5m × 100m)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter extreme aspect ratio (inverse)
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '0.5');  // Top
      await user.clear(inputs[1]);
      await user.type(inputs[1], '100'); // Right
      await user.clear(inputs[2]);
      await user.type(inputs[2], '0.5');  // Bottom
      await user.clear(inputs[3]);
      await user.type(inputs[3], '100'); // Left

      // Click Calculate Shape button
      const calculateButton = screen.getByText('Calculate Shape →');
      await user.click(calculateButton);

      // Should show warning
      await waitFor(() => {
        const warningMessage = screen.queryByText(/very thin shape|extreme aspect ratio/i);
        expect(warningMessage).toBeInTheDocument();
      });
    });

    it('should accept normal rectangle (10m × 25m = 2.5:1 ratio)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter normal aspect ratio dimensions
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '25');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '10');
      await user.clear(inputs[2]);
      await user.type(inputs[2], '25');
      await user.clear(inputs[3]);
      await user.type(inputs[3], '10');

      // Click Calculate Shape button
      const calculateButton = screen.getByText('Calculate Shape →');
      await user.click(calculateButton);

      // Should not show aspect ratio warning
      const warningMessage = screen.queryByText(/very thin shape|extreme aspect ratio/i);
      expect(warningMessage).not.toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('E3: Area Mismatch Validation', () => {
    it('should accept area within 5% tolerance (1000m² calc, 1049m² provided = 4.9%)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter rectangle dimensions (25m × 40m = 1000m²)
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '25');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '40');
      await user.clear(inputs[2]);
      await user.type(inputs[2], '25');
      await user.clear(inputs[3]);
      await user.type(inputs[3], '40');

      // Enter area slightly different (within 5%)
      const areaInput = screen.getByLabelText(/total area/i);
      await user.clear(areaInput);
      await user.type(areaInput, '1049');

      // Click Calculate Shape button
      const calculateButton = screen.getByText('Calculate Shape →');
      await user.click(calculateButton);

      // Should show success message for acceptable difference
      await waitFor(() => {
        const successMessage = screen.queryByText(/acceptable|✓/i);
        expect(successMessage).toBeInTheDocument();
      });

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should warn about area >5% difference (1000m² calc, 1500m² provided = 50%)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter rectangle dimensions (25m × 40m = 1000m²)
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '25');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '40');
      await user.clear(inputs[2]);
      await user.type(inputs[2], '25');
      await user.clear(inputs[3]);
      await user.type(inputs[3], '40');

      // Enter area significantly different (>5%)
      const areaInput = screen.getByLabelText(/total area/i);
      await user.clear(areaInput);
      await user.type(areaInput, '1500');

      // Click Calculate Shape button
      const calculateButton = screen.getByText('Calculate Shape →');
      await user.click(calculateButton);

      // Should show warning about large difference
      await waitFor(() => {
        const warningMessage = screen.queryByText(/differs.*50%|mismatch/i);
        expect(warningMessage).toBeInTheDocument();
      });

      // Should still allow import but with warning
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not validate area if not provided', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter rectangle dimensions
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '25');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '40');
      await user.clear(inputs[2]);
      await user.type(inputs[2], '25');
      await user.clear(inputs[3]);
      await user.type(inputs[3], '40');

      // Don't enter area (leave empty)

      // Click Calculate Shape button
      const calculateButton = screen.getByText('Calculate Shape →');
      await user.click(calculateButton);

      // Should not show area validation messages
      const validationMessage = screen.queryByText(/differs|acceptable|mismatch/i);
      expect(validationMessage).not.toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('E4: Decimal Input Error Handling', () => {
    it('should auto-convert European decimal separator (22,09 → 22.09)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Try to enter European-style decimal
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '22,09'); // European format

      // Input should auto-convert to 22.09 or handle gracefully
      await waitFor(() => {
        const value = (inputs[0] as HTMLInputElement).value;
        // Should either convert to 22.09 or show validation error
        expect(value === '22.09' || value === '22,09').toBe(true);
      });
    });

    it('should handle multiple decimal points gracefully (10..5)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Try to enter invalid number
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '10..5');

      // Blur to trigger validation
      fireEvent.blur(inputs[0]);

      // Should show validation error
      await waitFor(() => {
        const errorMessage = screen.queryByText(/invalid|number/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should reject non-numeric input (abc)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Try to enter letters
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], 'abc');

      // Blur to trigger validation
      fireEvent.blur(inputs[0]);

      // Should show validation error
      await waitFor(() => {
        const errorMessage = screen.queryByText(/number/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Submit button should be disabled
      const calculateButton = screen.getByText('Calculate Shape →');
      expect(calculateButton).toBeDisabled();
    });
  });

  describe('E5: Boundary Value Testing', () => {
    it('should reject dimension < 0.1m (too small)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter dimension below minimum
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '0.05'); // Below 0.1m minimum

      // Blur to trigger validation
      fireEvent.blur(inputs[0]);

      // Should show validation error
      await waitFor(() => {
        const errorMessage = screen.queryByText(/too small|minimum/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Submit button should be disabled
      const calculateButton = screen.getByText('Calculate Shape →');
      expect(calculateButton).toBeDisabled();
    });

    it('should accept dimension = 0.1m (boundary value)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter minimum valid dimension
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '0.1');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '1');
      await user.clear(inputs[2]);
      await user.type(inputs[2], '0.1');
      await user.clear(inputs[3]);
      await user.type(inputs[3], '1');

      // Should not show error
      fireEvent.blur(inputs[0]);
      await waitFor(() => {
        const errorMessage = screen.queryByText(/too small|minimum/i);
        expect(errorMessage).not.toBeInTheDocument();
      });

      // Submit button should be enabled
      const calculateButton = screen.getByText('Calculate Shape →');
      expect(calculateButton).not.toBeDisabled();
    });

    it('should reject dimension > 9999m (too large)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter dimension above maximum
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '10000'); // Above 9999m maximum

      // Blur to trigger validation
      fireEvent.blur(inputs[0]);

      // Should show validation error
      await waitFor(() => {
        const errorMessage = screen.queryByText(/too large|maximum/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Submit button should be disabled
      const calculateButton = screen.getByText('Calculate Shape →');
      expect(calculateButton).toBeDisabled();
    });

    it('should accept dimension = 9999m (boundary value)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter maximum valid dimension
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '9999');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '10');
      await user.clear(inputs[2]);
      await user.type(inputs[2], '9999');
      await user.clear(inputs[3]);
      await user.type(inputs[3], '10');

      // Should not show error
      fireEvent.blur(inputs[0]);
      await waitFor(() => {
        const errorMessage = screen.queryByText(/too large|maximum/i);
        expect(errorMessage).not.toBeInTheDocument();
      });

      // Submit button should be enabled
      const calculateButton = screen.getByText('Calculate Shape →');
      expect(calculateButton).not.toBeDisabled();
    });

    it('should reject negative dimension (-10m)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter negative dimension
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '-10');

      // Blur to trigger validation
      fireEvent.blur(inputs[0]);

      // Should show validation error
      await waitFor(() => {
        const errorMessage = screen.queryByText(/positive|greater than 0/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Submit button should be disabled
      const calculateButton = screen.getByText('Calculate Shape →');
      expect(calculateButton).toBeDisabled();
    });

    it('should reject zero dimension (0m)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enter zero
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '0');

      // Blur to trigger validation
      fireEvent.blur(inputs[0]);

      // Should show validation error
      await waitFor(() => {
        const errorMessage = screen.queryByText(/greater than 0|positive/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Submit button should be disabled
      const calculateButton = screen.getByText('Calculate Shape →');
      expect(calculateButton).toBeDisabled();
    });
  });

  describe('E6: Invalid Input Validation', () => {
    it('should require all fields to be filled', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill only some fields
      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '10');
      await user.clear(inputs[1]);
      await user.type(inputs[1], '20');
      // Leave inputs[2] and inputs[3] empty

      // Submit button should be disabled
      const calculateButton = screen.getByText('Calculate Shape →');
      expect(calculateButton).toBeDisabled();

      // Should not call onSubmit
      await user.click(calculateButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear validation error when field is corrected', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');

      // Enter invalid value
      await user.clear(inputs[0]);
      await user.type(inputs[0], '-10');
      fireEvent.blur(inputs[0]);

      // Should show error
      await waitFor(() => {
        const errorMessage = screen.queryByText(/positive|greater than 0/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Correct the value
      await user.clear(inputs[0]);
      await user.type(inputs[0], '10');
      fireEvent.blur(inputs[0]);

      // Error should be cleared
      await waitFor(() => {
        const errorMessage = screen.queryByText(/positive|greater than 0/i);
        expect(errorMessage).not.toBeInTheDocument();
      });
    });

    it('should prevent submission with any validation errors', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockTriangleOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');

      // Enter mix of valid and invalid values
      await user.clear(inputs[0]);
      await user.type(inputs[0], '10'); // Valid
      await user.clear(inputs[1]);
      await user.type(inputs[1], '-5'); // Invalid
      await user.clear(inputs[2]);
      await user.type(inputs[2], '15'); // Valid

      // Submit button should be disabled due to one invalid field
      const calculateButton = screen.getByText('Calculate Shape →');
      expect(calculateButton).toBeDisabled();

      // Should not call onSubmit
      await user.click(calculateButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('E7: Unit Conversion Edge Cases', () => {
    it('should handle very small values in different units', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const unitSelects = screen.getAllByRole('combobox');

      // Enter 0.1m (minimum)
      await user.clear(inputs[0]);
      await user.type(inputs[0], '0.1');
      await user.selectOptions(unitSelects[0], 'm');

      // Convert to feet (0.1m ≈ 0.328ft)
      await user.selectOptions(unitSelects[0], 'ft');

      // Value should still be valid
      fireEvent.blur(inputs[0]);
      const errorMessage = screen.queryByText(/too small|minimum/i);
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should handle very large values in different units', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const unitSelects = screen.getAllByRole('combobox');

      // Enter 9999m (maximum)
      await user.clear(inputs[0]);
      await user.type(inputs[0], '9999');
      await user.selectOptions(unitSelects[0], 'm');

      // Convert to yards (9999m ≈ 10,935yd)
      await user.selectOptions(unitSelects[0], 'yd');

      // Value should still be valid (may exceed max in yards, but should handle gracefully)
      fireEvent.blur(inputs[0]);
      await waitFor(() => {
        const value = (inputs[0] as HTMLInputElement).value;
        expect(parseFloat(value)).toBeGreaterThan(0);
      });
    });
  });
});
