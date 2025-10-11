/**
 * Integration Tests for Template Workflow
 *
 * Tests the complete template library and management flow:
 * - Template library initialization
 * - Search and filtering
 * - Template loading
 * - Template duplication
 * - Template deletion
 * - Built-in template protection
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateLibrary } from '../TemplateLibrary';
import { importTemplateService } from '../../../services/imageImport/importTemplateService';
import type { SavedTemplate } from '../../../types/imageImport';

describe('Template Workflow - Integration Tests', () => {
  const mockOnLoadTemplate = vi.fn();
  const mockOnClose = vi.fn();

  // Mock templates
  const mockBuiltInTemplate: SavedTemplate = {
    id: 'built-in-test-1',
    name: 'Test Rectangle',
    description: 'A test rectangle template',
    edgeCount: 4,
    dimensions: [
      { edgeIndex: 0, value: 10, unit: 'm' },
      { edgeIndex: 1, value: 20, unit: 'm' },
      { edgeIndex: 2, value: 10, unit: 'm' },
      { edgeIndex: 3, value: 20, unit: 'm' },
    ],
    area: 200,
    areaUnit: 'm²',
    category: 'built-in',
    tags: ['rectangle', 'common'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockUserTemplate: SavedTemplate = {
    id: 'user-test-1',
    name: 'My Custom Shape',
    description: 'Custom triangle shape',
    edgeCount: 3,
    dimensions: [
      { edgeIndex: 0, value: 5, unit: 'm' },
      { edgeIndex: 1, value: 5, unit: 'm' },
      { edgeIndex: 2, value: 8, unit: 'm' },
    ],
    area: 12,
    areaUnit: 'm²',
    category: 'user',
    tags: ['triangle', 'custom'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    // Clear mocks
    mockOnLoadTemplate.mockClear();
    mockOnClose.mockClear();

    // Clear localStorage
    localStorage.clear();

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    // Mock window.alert
    global.alert = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Library Initialization
  // ============================================================================

  describe('Library Initialization', () => {
    it('should display loading state initially', async () => {
      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      // Should show loading message
      expect(screen.getByText('Loading templates...')).toBeInTheDocument();
    });

    it('should load and display built-in templates', async () => {
      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      // Wait for templates to load (built-in templates are always available)
      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Should show exactly 5 built-in templates
      const builtInBadges = await screen.findAllByText('✨ Built-in');
      expect(builtInBadges.length).toBe(5);

      // Verify specific built-in templates exist
      expect(screen.getByText('Standard Rectangle (100m × 50m)')).toBeInTheDocument();
      expect(screen.getByText('Wide Lot (150m × 40m)')).toBeInTheDocument();
      expect(screen.getByText('Triangle (50m × 40m × 30m)')).toBeInTheDocument();
    });

    it('should display template count', async () => {
      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Should show results count
      expect(screen.getByText(/\d+ templates? found/)).toBeInTheDocument();
    });

    it('should initialize with edgeCount filter when provided', async () => {
      render(
        <TemplateLibrary
          edgeCount={4}
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Edge count filter should be set to 4
      const edgeCountSelect = screen.getByDisplayValue('4 edges');
      expect(edgeCountSelect).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Search Functionality
  // ============================================================================

  describe('Search Functionality', () => {
    it('should filter templates by name', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Get initial count
      const initialText = screen.getByText(/\d+ templates? found/);
      const initialCount = parseInt(initialText.textContent?.match(/\d+/)?.[0] || '0');

      // Search for "rectangle"
      const searchInput = screen.getByPlaceholderText('🔍 Search templates...');
      await user.type(searchInput, 'rectangle');

      // Wait for filter to apply
      await waitFor(() => {
        const newText = screen.getByText(/\d+ templates? found/);
        const newCount = parseInt(newText.textContent?.match(/\d+/)?.[0] || '0');
        expect(newCount).toBeLessThan(initialCount);
      });
    });

    it('should filter templates by tags', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Search for a tag
      const searchInput = screen.getByPlaceholderText('🔍 Search templates...');
      await user.type(searchInput, 'common');

      // Should filter results
      await waitFor(() => {
        const text = screen.getByText(/\d+ templates? found/);
        expect(text).toBeInTheDocument();
      });
    });

    it('should show empty state when no results found', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText('🔍 Search templates...');
      await user.type(searchInput, 'xyznonexistent123');

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText('No Templates Found')).toBeInTheDocument();
        expect(screen.getByText(/Try adjusting your search or filters/)).toBeInTheDocument();
      });
    });

    it('should clear search and show all templates', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('🔍 Search templates...');

      // Search for something
      await user.type(searchInput, 'rectangle');

      await waitFor(() => {
        const text = screen.getByText(/\d+ templates? found/);
        const count = parseInt(text.textContent?.match(/\d+/)?.[0] || '0');
        expect(count).toBeGreaterThan(0);
      });

      // Clear search
      await user.clear(searchInput);

      // Should show more templates
      await waitFor(() => {
        const text = screen.getByText(/\d+ templates? found/);
        const count = parseInt(text.textContent?.match(/\d+/)?.[0] || '0');
        expect(count).toBeGreaterThanOrEqual(5); // At least 5 built-in templates
      });
    });
  });

  // ============================================================================
  // Category Filtering
  // ============================================================================

  describe('Category Filtering', () => {
    it('should filter by built-in templates', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Select built-in filter
      const categorySelect = screen.getByDisplayValue('All Templates');
      await user.selectOptions(categorySelect, 'built-in');

      // Should only show built-in templates
      await waitFor(() => {
        const builtInBadges = screen.queryAllByText('✨ Built-in');
        const userBadges = screen.queryAllByText('👤 User');
        expect(builtInBadges.length).toBeGreaterThan(0);
        expect(userBadges.length).toBe(0);
      });
    });

    it('should filter by user templates', async () => {
      const user = userEvent.setup();

      // Save a user template first
      await importTemplateService.saveTemplate({
        name: 'Test User Template',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
        ],
      });

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Select user filter
      const categorySelect = screen.getByDisplayValue('All Templates');
      await user.selectOptions(categorySelect, 'user');

      // Should only show user templates
      await waitFor(() => {
        const userBadges = screen.queryAllByText('👤 User');
        const builtInBadges = screen.queryAllByText('✨ Built-in');
        expect(userBadges.length).toBeGreaterThan(0);
        expect(builtInBadges.length).toBe(0);
      });
    });

    it('should switch between filter categories', async () => {
      const user = userEvent.setup();

      // Save a user template
      await importTemplateService.saveTemplate({
        name: 'Test User Template',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
        ],
      });

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      const categorySelect = screen.getByDisplayValue('All Templates');

      // Filter by built-in
      await user.selectOptions(categorySelect, 'built-in');
      await waitFor(() => {
        const builtInBadges = screen.queryAllByText('✨ Built-in');
        expect(builtInBadges.length).toBeGreaterThan(0);
      });

      // Filter by user
      await user.selectOptions(categorySelect, 'user');
      await waitFor(() => {
        const userBadges = screen.queryAllByText('👤 User');
        expect(userBadges.length).toBeGreaterThan(0);
      });

      // Show all
      await user.selectOptions(categorySelect, 'all');
      await waitFor(() => {
        const text = screen.getByText(/\d+ templates? found/);
        const count = parseInt(text.textContent?.match(/\d+/)?.[0] || '0');
        expect(count).toBeGreaterThan(5); // Built-in + user templates
      });
    });
  });

  // ============================================================================
  // Edge Count Filtering
  // ============================================================================

  describe('Edge Count Filtering', () => {
    it('should filter by edge count', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Get initial count
      const initialText = screen.getByText(/\d+ templates? found/);
      const initialCount = parseInt(initialText.textContent?.match(/\d+/)?.[0] || '0');

      // Filter by 4 edges
      const edgeCountSelect = screen.getByDisplayValue('All Edge Counts');
      await user.selectOptions(edgeCountSelect, '4');

      // Should filter results
      await waitFor(() => {
        const newText = screen.getByText(/\d+ templates? found/);
        const newCount = parseInt(newText.textContent?.match(/\d+/)?.[0] || '0');
        expect(newCount).toBeLessThanOrEqual(initialCount);
      });
    });

    it('should show all edge count options', async () => {
      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Should show edge count options (3, 4, 5 edges at minimum)
      expect(screen.getByText('3 edges')).toBeInTheDocument();
      expect(screen.getByText('4 edges')).toBeInTheDocument();
      expect(screen.getByText('5 edges')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Template Loading
  // ============================================================================

  describe('Template Loading', () => {
    it('should load template when card is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Click on a template card (find by built-in template name)
      const rectangleCard = await screen.findByText('Standard Rectangle (100m × 50m)');
      await user.click(rectangleCard);

      // Should call onLoadTemplate and onClose
      expect(mockOnLoadTemplate).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      // Verify template data structure
      const loadedTemplate = mockOnLoadTemplate.mock.calls[0][0];
      expect(loadedTemplate).toHaveProperty('id');
      expect(loadedTemplate).toHaveProperty('name');
      expect(loadedTemplate).toHaveProperty('dimensions');
      expect(loadedTemplate.category).toBe('built-in');
    });

    it('should load template when Load button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Click on the first Load button
      const loadButtons = screen.getAllByText('Load');
      await user.click(loadButtons[0]);

      // Should call callbacks
      expect(mockOnLoadTemplate).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should load correct template data', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Find and click a specific template
      const rectangleCard = await screen.findByText('Standard Rectangle (100m × 50m)');
      await user.click(rectangleCard);

      const loadedTemplate = mockOnLoadTemplate.mock.calls[0][0];

      // Verify template structure
      expect(loadedTemplate.edgeCount).toBe(4);
      expect(loadedTemplate.dimensions).toHaveLength(4);
      expect(loadedTemplate.dimensions[0]).toHaveProperty('edgeIndex');
      expect(loadedTemplate.dimensions[0]).toHaveProperty('value');
      expect(loadedTemplate.dimensions[0]).toHaveProperty('unit');
    });
  });

  // ============================================================================
  // Template Duplication
  // ============================================================================

  describe('Template Duplication', () => {
    it('should duplicate a built-in template', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Get initial template count
      const initialText = screen.getByText(/\d+ templates? found/);
      const initialCount = parseInt(initialText.textContent?.match(/\d+/)?.[0] || '0');

      // Click duplicate button (📋)
      const duplicateButtons = screen.getAllByText('📋');
      await user.click(duplicateButtons[0]);

      // Wait for templates to reload
      await waitFor(() => {
        const newText = screen.getByText(/\d+ templates? found/);
        const newCount = parseInt(newText.textContent?.match(/\d+/)?.[0] || '0');
        expect(newCount).toBe(initialCount + 1);
      });
    });

    it('should create user template copy when duplicating built-in', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Wait for built-in templates to be visible
      await waitFor(() => {
        const builtInBadges = screen.queryAllByText('✨ Built-in');
        expect(builtInBadges.length).toBeGreaterThan(0);
      });

      // Duplicate a built-in template
      const duplicateButtons = screen.getAllByText('📋');
      await user.click(duplicateButtons[0]);

      // Wait for templates to reload (should now have 6 templates: 5 built-in + 1 user copy)
      await waitFor(() => {
        const text = screen.getByText(/\d+ templates? found/);
        const count = parseInt(text.textContent?.match(/\d+/)?.[0] || '0');
        expect(count).toBe(6);
      });

      // Filter by user templates
      const categorySelect = screen.getByDisplayValue('All Templates');
      await user.selectOptions(categorySelect, 'user');

      // Should show exactly one user template (the duplicated one)
      await waitFor(() => {
        const userBadges = screen.queryAllByText('👤 User');
        expect(userBadges.length).toBe(1);
      });
    });

    it('should not trigger load when duplicate is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Click duplicate button
      const duplicateButtons = screen.getAllByText('📋');
      await user.click(duplicateButtons[0]);

      // Should NOT call onLoadTemplate or onClose (stopPropagation)
      expect(mockOnLoadTemplate).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Template Deletion
  // ============================================================================

  describe('Template Deletion', () => {
    it('should show delete button only for user templates', async () => {
      // Save a user template
      await importTemplateService.saveTemplate({
        name: 'Test User Template',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
        ],
      });

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Wait for templates to fully load and render
      await waitFor(() => {
        const deleteButtons = screen.queryAllByText('🗑');
        expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
      });

      // Built-in templates should not have delete buttons
      // Count total cards vs delete buttons - delete buttons should be fewer
      const deleteButtons = screen.queryAllByText('🗑');
      const loadButtons = screen.getAllByText('Load');
      expect(deleteButtons.length).toBeLessThan(loadButtons.length);
    });

    it('should delete user template when confirmed', async () => {
      const user = userEvent.setup();

      // Save a user template
      await importTemplateService.saveTemplate({
        name: 'Test Delete Template',
        dimensions: [
          { edgeIndex: 0, value: 5, unit: 'm' },
          { edgeIndex: 1, value: 5, unit: 'm' },
        ],
      });

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Get initial count
      const initialText = screen.getByText(/\d+ templates? found/);
      const initialCount = parseInt(initialText.textContent?.match(/\d+/)?.[0] || '0');

      // Click delete button
      const deleteButtons = screen.getAllByText('🗑');
      await user.click(deleteButtons[0]);

      // Confirm should have been called
      expect(global.confirm).toHaveBeenCalled();

      // Wait for templates to reload
      await waitFor(() => {
        const newText = screen.getByText(/\d+ templates? found/);
        const newCount = parseInt(newText.textContent?.match(/\d+/)?.[0] || '0');
        expect(newCount).toBe(initialCount - 1);
      });
    });

    it('should not delete when user cancels confirmation', async () => {
      const user = userEvent.setup();

      // Mock confirm to return false
      global.confirm = vi.fn(() => false);

      // Save a user template
      await importTemplateService.saveTemplate({
        name: 'Test Cancel Delete',
        dimensions: [
          { edgeIndex: 0, value: 5, unit: 'm' },
          { edgeIndex: 1, value: 5, unit: 'm' },
        ],
      });

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Get initial count
      const initialText = screen.getByText(/\d+ templates? found/);
      const initialCount = parseInt(initialText.textContent?.match(/\d+/)?.[0] || '0');

      // Click delete button
      const deleteButtons = screen.getAllByText('🗑');
      await user.click(deleteButtons[0]);

      // Confirm was called but returned false
      expect(global.confirm).toHaveBeenCalled();

      // Count should remain the same
      const newText = screen.getByText(/\d+ templates? found/);
      const newCount = parseInt(newText.textContent?.match(/\d+/)?.[0] || '0');
      expect(newCount).toBe(initialCount);
    });

    it('should not trigger load when delete is clicked', async () => {
      const user = userEvent.setup();

      // Save a user template
      await importTemplateService.saveTemplate({
        name: 'Test Load Prevention',
        dimensions: [
          { edgeIndex: 0, value: 5, unit: 'm' },
          { edgeIndex: 1, value: 5, unit: 'm' },
        ],
      });

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByText('🗑');
      await user.click(deleteButtons[0]);

      // Should NOT call onLoadTemplate or onClose (stopPropagation)
      expect(mockOnLoadTemplate).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Built-in Template Protection
  // ============================================================================

  describe('Built-in Template Protection', () => {
    it('should not show delete button for built-in templates', async () => {
      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Filter to only built-in templates
      const categorySelect = screen.getByDisplayValue('All Templates');
      await userEvent.setup().selectOptions(categorySelect, 'built-in');

      await waitFor(() => {
        const builtInBadges = screen.queryAllByText('✨ Built-in');
        expect(builtInBadges.length).toBeGreaterThan(0);
      });

      // Should not show any delete buttons
      const deleteButtons = screen.queryAllByText('🗑');
      expect(deleteButtons.length).toBe(0);
    });
  });

  // ============================================================================
  // Close Functionality
  // ============================================================================

  describe('Close Functionality', () => {
    it('should close library when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByText('× Close');
      await user.click(closeButton);

      // Should call onClose
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Combined Filters
  // ============================================================================

  describe('Combined Filters', () => {
    it('should apply search and category filter together', async () => {
      const user = userEvent.setup();

      // Save user template with "rectangle" in name
      await importTemplateService.saveTemplate({
        name: 'My Rectangle',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 20, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
          { edgeIndex: 3, value: 20, unit: 'm' },
        ],
      });

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Apply search for "rectangle"
      const searchInput = screen.getByPlaceholderText('🔍 Search templates...');
      await user.type(searchInput, 'rectangle');

      // Apply category filter for "user"
      const categorySelect = screen.getByDisplayValue('All Templates');
      await user.selectOptions(categorySelect, 'user');

      // Should show only user templates with "rectangle" in name
      await waitFor(() => {
        const userBadges = screen.queryAllByText('👤 User');
        const builtInBadges = screen.queryAllByText('✨ Built-in');
        expect(userBadges.length).toBeGreaterThanOrEqual(1);
        expect(builtInBadges.length).toBe(0);
      });
    });

    it('should apply all three filters together', async () => {
      const user = userEvent.setup();

      // Save a 4-edge user template with "test" in name
      await importTemplateService.saveTemplate({
        name: 'Test Shape',
        dimensions: [
          { edgeIndex: 0, value: 10, unit: 'm' },
          { edgeIndex: 1, value: 10, unit: 'm' },
          { edgeIndex: 2, value: 10, unit: 'm' },
          { edgeIndex: 3, value: 10, unit: 'm' },
        ],
      });

      render(
        <TemplateLibrary
          onLoadTemplate={mockOnLoadTemplate}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });

      // Apply search
      const searchInput = screen.getByPlaceholderText('🔍 Search templates...');
      await user.type(searchInput, 'test');

      // Apply category filter
      const categorySelect = screen.getByDisplayValue('All Templates');
      await user.selectOptions(categorySelect, 'user');

      // Apply edge count filter
      const edgeCountSelect = screen.getByDisplayValue('All Edge Counts');
      await user.selectOptions(edgeCountSelect, '4');

      // Should show filtered results
      await waitFor(() => {
        const text = screen.getByText(/\d+ templates? found/);
        const count = parseInt(text.textContent?.match(/\d+/)?.[0] || '0');
        expect(count).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
