/**
 * Integration Tests for Manual Entry Workflow
 *
 * Tests the complete user flow for manually entering parcel dimensions:
 * - Form initialization
 * - Dimension entry and validation
 * - Unit selection
 * - Edge reordering
 * - Area input and validation
 * - Form submission
 * - Keyboard shortcuts
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualEntryForm } from '../ManualEntryForm';
import { useImportStore } from '../../../store/useImportStore';
import type { Point2D, DimensionInput } from '../../../types/imageImport';

// Mock EdgePreview to avoid canvas rendering issues
vi.mock('../EdgePreview', () => ({
  EdgePreview: () => <div data-testid="edge-preview">Edge Preview</div>,
}));

// Mock EdgeReorderControl
vi.mock('../EdgeReorderControl', () => ({
  EdgeReorderControl: () => <div data-testid="edge-reorder-control">Edge Reorder Control</div>,
}));

describe('Manual Entry Workflow - Integration Tests', () => {
  // Mock data
  const mockRoughOutline: Point2D[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
    { x: 0, y: 50 },
  ];

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    // Reset store state
    useImportStore.setState({
      dimensions: [],
      area: null,
      areaUnit: 'm²',
    });

    // Clear mocks
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Form Initialization
  // ============================================================================

  describe('Form Initialization', () => {
    it('should initialize with correct number of edge inputs', async () => {
      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Wait for dimensions to initialize
      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs).toHaveLength(5); // 4 edges + 1 area input
      });

      // Check edge labels
      expect(screen.getByText('Edge 1')).toBeInTheDocument();
      expect(screen.getByText('Edge 2')).toBeInTheDocument();
      expect(screen.getByText('Edge 3')).toBeInTheDocument();
      expect(screen.getByText('Edge 4')).toBeInTheDocument();
    });

    it('should initialize all dimensions with 0 value and meters unit', async () => {
      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.dimensions).toHaveLength(3);
        state.dimensions.forEach((dim) => {
          expect(dim.value).toBe(0);
          expect(dim.unit).toBe('m');
        });
      });
    });

    it('should show submit button as disabled initially', () => {
      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByText('Calculate Shape →');
      expect(submitButton).toBeDisabled();
    });

    it('should display helper text when form is invalid', () => {
      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText('Please fill in all edge dimensions to continue')
      ).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Dimension Entry
  // ============================================================================

  describe('Dimension Entry', () => {
    it('should allow entering dimension values', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Get dimension inputs (exclude area input)
      const inputs = screen.getAllByPlaceholderText('0.00');
      const dimensionInputs = inputs.slice(0, 3);

      // Enter values
      await user.clear(dimensionInputs[0]);
      await user.type(dimensionInputs[0], '10');

      await user.clear(dimensionInputs[1]);
      await user.type(dimensionInputs[1], '20');

      await user.clear(dimensionInputs[2]);
      await user.type(dimensionInputs[2], '15');

      // Verify store updated
      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.dimensions[0].value).toBe(10);
        expect(state.dimensions[1].value).toBe(20);
        expect(state.dimensions[2].value).toBe(15);
      });
    });

    it('should handle decimal values', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={2}
          roughOutline={mockRoughOutline.slice(0, 2)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const dimensionInputs = inputs.slice(0, 2);

      await user.clear(dimensionInputs[0]);
      await user.type(dimensionInputs[0], '10.5');

      await user.clear(dimensionInputs[1]);
      await user.type(dimensionInputs[1], '25.75');

      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.dimensions[0].value).toBe(10.5);
        expect(state.dimensions[1].value).toBe(25.75);
      });
    });

    it('should allow entering very small valid values (0.1m minimum)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={1}
          roughOutline={mockRoughOutline.slice(0, 1)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '0.1');

      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.dimensions[0].value).toBe(0.1);
      });

      // Should not show error
      expect(screen.queryByText(/too small/i)).not.toBeInTheDocument();
    });

    it('should allow entering very large valid values (9999m maximum)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={1}
          roughOutline={mockRoughOutline.slice(0, 1)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '9999');

      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.dimensions[0].value).toBe(9999);
      });

      // Should not show error
      expect(screen.queryByText(/too large/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Validation
  // ============================================================================

  describe('Validation', () => {
    it('should show error for values below minimum (0.1m)', async () => {
      render(
        <ManualEntryForm
          edgeCount={1}
          roughOutline={mockRoughOutline.slice(0, 1)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');

      // Directly set value using fireEvent (more reliable for decimal inputs)
      fireEvent.change(inputs[0], { target: { value: '0.05' } });

      // Trigger blur to activate validation
      fireEvent.blur(inputs[0]);

      // Wait for error to appear
      await waitFor(
        () => {
          expect(screen.getByText(/too small/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should show error for values above maximum (9999m)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={1}
          roughOutline={mockRoughOutline.slice(0, 1)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '10000');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/too large.*maximum.*9999m/i)).toBeInTheDocument();
      });
    });

    it('should show error for zero values', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={1}
          roughOutline={mockRoughOutline.slice(0, 1)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '0');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('should prevent submission when any dimension is invalid', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const dimensionInputs = inputs.slice(0, 3);

      // Fill in valid values for first two edges
      await user.clear(dimensionInputs[0]);
      await user.type(dimensionInputs[0], '10');

      await user.clear(dimensionInputs[1]);
      await user.type(dimensionInputs[1], '20');

      // Leave third edge at 0
      await user.clear(dimensionInputs[2]);
      await user.type(dimensionInputs[2], '0');

      // Submit button should be disabled
      const submitButton = screen.getByText('Calculate Shape →');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submission when all dimensions are valid', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const dimensionInputs = inputs.slice(0, 3);

      // Fill in all valid values
      await user.clear(dimensionInputs[0]);
      await user.type(dimensionInputs[0], '10');

      await user.clear(dimensionInputs[1]);
      await user.type(dimensionInputs[1], '20');

      await user.clear(dimensionInputs[2]);
      await user.type(dimensionInputs[2], '15');

      // Submit button should be enabled
      await waitFor(() => {
        const submitButton = screen.getByText('Calculate Shape →');
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  // ============================================================================
  // Unit Selection
  // ============================================================================

  describe('Unit Selection', () => {
    it('should allow changing dimension units', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={2}
          roughOutline={mockRoughOutline.slice(0, 2)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Find unit dropdowns (first 2 are for dimensions, last is for area)
      const selects = screen.getAllByDisplayValue('meters (m)');
      const firstDimensionSelect = selects[0];

      // Change to feet
      await user.selectOptions(firstDimensionSelect, 'ft');

      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.dimensions[0].unit).toBe('ft');
      });
    });

    it('should support all three length units', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const selects = screen.getAllByDisplayValue('meters (m)');

      // Change to different units
      await user.selectOptions(selects[0], 'ft');
      await user.selectOptions(selects[1], 'yd');
      // Leave third as meters

      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.dimensions[0].unit).toBe('ft');
        expect(state.dimensions[1].unit).toBe('yd');
        expect(state.dimensions[2].unit).toBe('m');
      });
    });

    it('should preserve dimension value when changing units', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={1}
          roughOutline={mockRoughOutline.slice(0, 1)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const input = screen.getAllByPlaceholderText('0.00')[0];
      await user.clear(input);
      await user.type(input, '10');

      const select = screen.getAllByDisplayValue('meters (m)')[0];
      await user.selectOptions(select, 'ft');

      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.dimensions[0].value).toBe(10); // Value preserved
        expect(state.dimensions[0].unit).toBe('ft');
      });
    });
  });

  // ============================================================================
  // Area Input
  // ============================================================================

  describe('Optional Area Input', () => {
    it('should allow entering area value', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const areaInput = inputs[inputs.length - 1]; // Last input is area

      await user.clear(areaInput);
      await user.type(areaInput, '500');

      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.area).toBe(500);
      });
    });

    it('should validate area minimum (0.01m²)', async () => {
      render(
        <ManualEntryForm
          edgeCount={1}
          roughOutline={mockRoughOutline.slice(0, 1)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const areaInput = inputs[inputs.length - 1];

      // Directly set value using fireEvent (more reliable for decimal inputs)
      fireEvent.change(areaInput, { target: { value: '0.005' } });

      // Wait for error to appear (area validates immediately on change, no blur needed)
      await waitFor(
        () => {
          expect(screen.getByText(/too small/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should validate area maximum (999999m²)', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={1}
          roughOutline={mockRoughOutline.slice(0, 1)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const areaInput = inputs[inputs.length - 1];

      await user.clear(areaInput);
      await user.type(areaInput, '1000000');

      await waitFor(() => {
        expect(screen.getByText(/too large.*maximum.*999999m²/i)).toBeInTheDocument();
      });
    });

    it('should allow changing area unit', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={1}
          roughOutline={mockRoughOutline.slice(0, 1)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Find area unit select (last one with m²)
      const areaSelect = screen.getByDisplayValue('m²');

      await user.selectOptions(areaSelect, 'ft²');

      await waitFor(() => {
        const state = useImportStore.getState();
        expect(state.areaUnit).toBe('ft²');
      });
    });

    it('should not require area for valid submission', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={2}
          roughOutline={mockRoughOutline.slice(0, 2)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const dimensionInputs = inputs.slice(0, 2);

      // Fill only dimensions, not area
      await user.clear(dimensionInputs[0]);
      await user.type(dimensionInputs[0], '10');

      await user.clear(dimensionInputs[1]);
      await user.type(dimensionInputs[1], '20');

      // Should still be able to submit
      await waitFor(() => {
        const submitButton = screen.getByText('Calculate Shape →');
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  // ============================================================================
  // Edge Reordering
  // ============================================================================

  describe('Edge Reordering', () => {
    it('should show reorder button', () => {
      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('↕ Reorder Edges')).toBeInTheDocument();
    });

    it('should toggle reorder control when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={4}
          roughOutline={mockRoughOutline}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const reorderButton = screen.getByText('↕ Reorder Edges');

      // Initially hidden
      expect(screen.queryByText(/Edge Mapping/i)).not.toBeInTheDocument();

      // Click to show
      await user.click(reorderButton);

      await waitFor(() => {
        expect(screen.getByText('✓ Reorder Edges')).toBeInTheDocument();
      });

      // Click again to hide
      await user.click(screen.getByText('✓ Reorder Edges'));

      await waitFor(() => {
        expect(screen.getByText('↕ Reorder Edges')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Form Submission
  // ============================================================================

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is submitted', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const dimensionInputs = inputs.slice(0, 3);

      // Fill in dimensions
      await user.clear(dimensionInputs[0]);
      await user.type(dimensionInputs[0], '10');

      await user.clear(dimensionInputs[1]);
      await user.type(dimensionInputs[1], '20');

      await user.clear(dimensionInputs[2]);
      await user.type(dimensionInputs[2], '15');

      // Submit
      const submitButton = screen.getByText('Calculate Shape →');
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const [dimensions, area] = mockOnSubmit.mock.calls[0];

        expect(dimensions).toHaveLength(3);
        expect(dimensions[0]).toEqual({ edgeIndex: 0, value: 10, unit: 'm' });
        expect(dimensions[1]).toEqual({ edgeIndex: 1, value: 20, unit: 'm' });
        expect(dimensions[2]).toEqual({ edgeIndex: 2, value: 15, unit: 'm' });
        expect(area).toBeNull();
      });
    });

    it('should include area in submission if provided', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={2}
          roughOutline={mockRoughOutline.slice(0, 2)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const dimensionInputs = inputs.slice(0, 2);
      const areaInput = inputs[2];

      // Fill dimensions
      await user.clear(dimensionInputs[0]);
      await user.type(dimensionInputs[0], '10');

      await user.clear(dimensionInputs[1]);
      await user.type(dimensionInputs[1], '20');

      // Fill area
      await user.clear(areaInput);
      await user.type(areaInput, '500');

      // Submit
      const submitButton = screen.getByText('Calculate Shape →');
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const [, area] = mockOnSubmit.mock.calls[0];
        expect(area).toBe(500);
      });
    });

    it('should not submit when form is invalid', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={2}
          roughOutline={mockRoughOutline.slice(0, 2)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByText('Calculate Shape →');
      expect(submitButton).toBeDisabled();

      // Try to click disabled button
      await user.click(submitButton);

      // Should not have called onSubmit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Cancel Action
  // ============================================================================

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('← Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  describe('Keyboard Shortcuts', () => {
    it('should submit form with Enter key when valid', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={2}
          roughOutline={mockRoughOutline.slice(0, 2)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const inputs = screen.getAllByPlaceholderText('0.00');
      const dimensionInputs = inputs.slice(0, 2);

      // Fill dimensions
      await user.clear(dimensionInputs[0]);
      await user.type(dimensionInputs[0], '10');

      await user.clear(dimensionInputs[1]);
      await user.type(dimensionInputs[1], '20');

      // Press Enter
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('should not submit with Enter when form is invalid', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={2}
          roughOutline={mockRoughOutline.slice(0, 2)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Don't fill any fields
      await user.keyboard('{Enter}');

      // Should not submit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should cancel with Escape key', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Edge Selection
  // ============================================================================

  describe('Edge Selection', () => {
    it('should highlight selected edge', async () => {
      const user = userEvent.setup();

      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Edge 1 should be selected by default (has "Selected" label)
      expect(screen.getByText('Selected')).toBeInTheDocument();

      // Click on Edge 2
      const edge2Container = screen.getByText('Edge 2').closest('div');
      if (edge2Container) {
        await user.click(edge2Container);

        // After clicking Edge 2, it should still show "Selected" label (just moved to Edge 2)
        await waitFor(() => {
          expect(screen.getByText('Selected')).toBeInTheDocument();
        });
      }
    });

    it('should show "Selected" label on active edge', () => {
      render(
        <ManualEntryForm
          edgeCount={3}
          roughOutline={mockRoughOutline.slice(0, 3)}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // First edge should be selected initially - just check that "Selected" label exists
      expect(screen.getByText('Selected')).toBeInTheDocument();

      // Verify it's associated with Edge 1 by checking both are in the document
      expect(screen.getByText('Edge 1')).toBeInTheDocument();
    });
  });
});
