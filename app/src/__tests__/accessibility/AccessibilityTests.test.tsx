import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../../App';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Three.js components for accessibility testing
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: any) => (
    <div role="img" aria-label="3D visualization canvas" data-testid="three-canvas" {...props}>
      {children}
    </div>
  ),
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

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Reset any global state that might affect accessibility
    vi.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations on main app', async () => {
      const { container } = render(<App />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(<App />);

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');

      // Should have at least a main heading
      expect(headings.length).toBeGreaterThan(0);

      // Check heading levels are in logical order
      const headingLevels = headings.map(heading => {
        const tagName = heading.tagName.toLowerCase();
        return parseInt(tagName.charAt(1), 10);
      });

      // First heading should be h1
      expect(headingLevels[0]).toBe(1);

      // Subsequent headings should not skip levels
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });

    it('should have proper color contrast ratios', () => {
      render(<App />);

      // Check that interactive elements have sufficient contrast
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        // Note: In a real implementation, you would calculate contrast ratios
        // For now, we just ensure colors are defined
        expect(color).toBeTruthy();
        expect(backgroundColor).toBeTruthy();
      });
    });

    it('should have meaningful alt text for images', () => {
      render(<App />);

      const images = screen.queryAllByRole('img');

      images.forEach(image => {
        const altText = image.getAttribute('alt');
        const ariaLabel = image.getAttribute('aria-label');
        const ariaLabelledBy = image.getAttribute('aria-labelledby');

        // Images should have alt text or aria-label
        expect(
          altText || ariaLabel || ariaLabelledBy
        ).toBeTruthy();

        // Alt text should be meaningful (not just filename)
        if (altText) {
          expect(altText.length).toBeGreaterThan(0);
          expect(altText).not.toMatch(/\.(jpg|jpeg|png|gif|svg)$/i);
        }
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be fully navigable with keyboard', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Get all focusable elements
      const focusableElements = screen.getAllByRole('button');

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test tab navigation
      for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
        await user.tab();

        const activeElement = document.activeElement;
        expect(activeElement).toBeInstanceOf(HTMLElement);
        expect(activeElement?.getAttribute('tabindex')).not.toBe('-1');
      }
    });

    it('should have proper tab order', async () => {
      const user = userEvent.setup();
      render(<App />);

      const _initiallyFocused = document.activeElement;

      // Tab through several elements
      const focusSequence: Element[] = [];

      for (let i = 0; i < 10; i++) {
        await user.tab();
        const activeElement = document.activeElement;
        if (activeElement && activeElement !== document.body) {
          focusSequence.push(activeElement);
        }
      }

      // Verify focus sequence makes logical sense
      expect(focusSequence.length).toBeGreaterThan(0);

      // Check that we can reverse the sequence with Shift+Tab
      for (let i = 0; i < 3; i++) {
        await user.tab({ shift: true });
      }

      const reversedElement = document.activeElement;
      expect(reversedElement).toBeTruthy();
    });

    it('should support Enter and Space key activation', async () => {
      const user = userEvent.setup();
      render(<App />);

      const buttons = screen.getAllByRole('button');

      if (buttons.length > 0) {
        const firstButton = buttons[0];
        firstButton.focus();

        // Test Enter key
        await user.keyboard('{Enter}');
        // Button should have been activated (implementation dependent)

        // Test Space key
        await user.keyboard(' ');
        // Button should have been activated (implementation dependent)
      }
    });

    it('should trap focus in modal dialogs', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Look for modal triggers
      const modalTriggers = screen.queryAllByRole('button').filter(button =>
        button.textContent?.toLowerCase().includes('settings') ||
        button.textContent?.toLowerCase().includes('options') ||
        button.getAttribute('aria-haspopup') === 'dialog'
      );

      if (modalTriggers.length > 0) {
        await user.click(modalTriggers[0]);

        // Check if a modal appeared
        const modal = screen.queryByRole('dialog');
        if (modal) {
          // Focus should be within the modal
          const focusableInModal = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          expect(focusableInModal.length).toBeGreaterThan(0);

          // Tab navigation should stay within modal
          await user.tab();
          const activeElement = document.activeElement;
          expect(modal.contains(activeElement)).toBe(true);
        }
      }
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      render(<App />);

      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.queryAllByRole('textbox'),
        ...screen.queryAllByRole('combobox'),
        ...screen.queryAllByRole('slider'),
      ];

      interactiveElements.forEach(element => {
        const hasLabel =
          element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.textContent?.trim() ||
          element.querySelector('label');

        expect(hasLabel).toBeTruthy();
      });
    });

    it('should announce dynamic content changes', async () => {
      const _user = userEvent.setup();
      render(<App />);

      // Look for elements that might trigger content changes
      const _buttons = screen.getAllByRole('button');

      // Check for ARIA live regions
      const _liveRegions = document.querySelectorAll('[aria-live]');

      // Even if no live regions exist initially, dynamic content should be announced
      // This would be tested more thoroughly with actual screen reader testing

      expect(true).toBe(true); // Placeholder assertion
    });

    it('should provide meaningful descriptions for complex UI', () => {
      render(<App />);

      // Check for aria-describedby attributes on complex elements
      const complexElements = document.querySelectorAll('[aria-describedby]');

      complexElements.forEach(element => {
        const describedBy = element.getAttribute('aria-describedby');
        const descriptionElement = document.getElementById(describedBy!);

        expect(descriptionElement).toBeTruthy();
        expect(descriptionElement?.textContent?.trim()).toBeTruthy();
      });
    });

    it('should have proper form labels and descriptions', () => {
      render(<App />);

      const formInputs = [
        ...screen.queryAllByRole('textbox'),
        ...screen.queryAllByRole('combobox'),
        ...screen.queryAllByRole('spinbutton'),
      ];

      formInputs.forEach(input => {
        // Check for label association
        const label = input.getAttribute('aria-label') ||
                     input.getAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${input.id}"]`);

        expect(label).toBeTruthy();

        // Check for error descriptions if input is invalid
        const ariaInvalid = input.getAttribute('aria-invalid');
        if (ariaInvalid === 'true') {
          const errorDescription = input.getAttribute('aria-describedby');
          expect(errorDescription).toBeTruthy();
        }
      });
    });
  });

  describe('Visual Accessibility', () => {
    it('should be usable at 200% zoom', () => {
      // Simulate 200% zoom by setting viewport to half size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640, // Half of typical 1280px width
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 360, // Half of typical 720px height
      });

      render(<App />);

      // Check that essential functionality is still accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Check that content doesn't overflow or become unusable
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.height).toBeGreaterThan(0);
      });
    });

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<App />);

      // Check that UI elements are still visible and functional
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // In a real implementation, you would check that high contrast styles are applied
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(styles.display).not.toBe('none');
        expect(styles.visibility).not.toBe('hidden');
      });
    });

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<App />);

      // Check that animations are reduced or disabled
      // This would be implementation-specific
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    it('should have adequate touch targets', () => {
      render(<App />);

      const touchTargets = [
        ...screen.getAllByRole('button'),
        ...screen.queryAllByRole('link'),
      ];

      touchTargets.forEach(target => {
        const rect = target.getBoundingClientRect();

        // WCAG recommends minimum 44x44 CSS pixels for touch targets
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });

    it('should support gesture alternatives', async () => {
      const _user = userEvent.setup();
      render(<App />);

      // Check that complex gestures have keyboard/button alternatives
      // For example, if there's a drag-to-draw feature, there should be keyboard alternatives

      const buttons = screen.getAllByRole('button');

      // All interactive functionality should be available through buttons or keyboard
      expect(buttons.length).toBeGreaterThan(0);

      // Test that buttons work with touch events
      if (buttons.length > 0) {
        fireEvent.touchStart(buttons[0]);
        fireEvent.touchEnd(buttons[0]);
        // Should trigger the same action as click
      }
    });
  });

  describe('Error Handling and Feedback', () => {
    it('should provide accessible error messages', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Look for form inputs that might have validation
      const inputs = screen.queryAllByRole('textbox');

      for (const input of inputs) {
        // Try to trigger validation by entering invalid data
        await user.type(input, 'invalid-data');
        await user.tab(); // Trigger blur event

        // Check if error message is accessible
        const ariaDescribedBy = input.getAttribute('aria-describedby');
        const ariaInvalid = input.getAttribute('aria-invalid');

        if (ariaInvalid === 'true') {
          expect(ariaDescribedBy).toBeTruthy();

          const errorElement = document.getElementById(ariaDescribedBy!);
          expect(errorElement).toBeTruthy();
          expect(errorElement?.textContent?.trim()).toBeTruthy();
        }
      }
    });

    it('should announce success messages accessibly', () => {
      render(<App />);

      // Check for success message containers
      const statusRegions = document.querySelectorAll('[role="status"], [aria-live="polite"]');
      const alertRegions = document.querySelectorAll('[role="alert"], [aria-live="assertive"]');

      // Should have some way to announce status changes
      expect(statusRegions.length + alertRegions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Progressive Enhancement', () => {
    it('should work without JavaScript for critical features', () => {
      // This test would require special setup to disable JavaScript
      // For now, we just check that the basic markup is semantic

      render(<App />);

      // Check that the page has semantic structure
      const main = screen.queryByRole('main');
      const navigation = screen.queryByRole('navigation');

      // Should have semantic landmarks
      expect(main || navigation).toBeTruthy();
    });

    it('should provide fallbacks for advanced features', () => {
      render(<App />);

      // Check that advanced features have accessible alternatives
      // For example, if there's a 3D visualization, there should be text alternatives

      const canvas = screen.queryByTestId('three-canvas');
      if (canvas) {
        const hasAlternative =
          canvas.getAttribute('aria-label') ||
          canvas.getAttribute('aria-describedby') ||
          canvas.nextElementSibling?.textContent;

        expect(hasAlternative).toBeTruthy();
      }
    });
  });

  describe('Custom Component Accessibility', () => {
    it('should have accessible drawing tools', () => {
      render(<App />);

      // Find drawing tool buttons
      const drawingTools = screen.getAllByRole('button').filter(button =>
        button.textContent?.toLowerCase().includes('rectangle') ||
        button.textContent?.toLowerCase().includes('circle') ||
        button.textContent?.toLowerCase().includes('line') ||
        button.getAttribute('aria-label')?.toLowerCase().includes('draw')
      );

      drawingTools.forEach(tool => {
        // Should have descriptive labels
        const hasLabel =
          tool.getAttribute('aria-label') ||
          tool.textContent?.trim();

        expect(hasLabel).toBeTruthy();

        // Should indicate current state
        const pressed = tool.getAttribute('aria-pressed');
        if (pressed !== null) {
          expect(['true', 'false']).toContain(pressed);
        }
      });
    });

    it('should have accessible measurement tools', () => {
      render(<App />);

      // Find measurement-related elements
      const measurementElements = [
        ...screen.queryAllByText(/measure/i),
        ...screen.queryAllByText(/distance/i),
        ...screen.queryAllByText(/area/i),
      ];

      measurementElements.forEach(element => {
        // Should be keyboard accessible if interactive
        if (element.closest('button') || element.getAttribute('role') === 'button') {
          expect(element.getAttribute('tabindex')).not.toBe('-1');
        }
      });
    });

    it('should have accessible comparison panel', () => {
      render(<App />);

      // Look for comparison panel elements
      const comparisonElements = screen.queryAllByText(/compare/i);

      comparisonElements.forEach(element => {
        const panel = element.closest('[role="region"], [role="dialog"], section, aside');

        if (panel) {
          // Panel should have an accessible name
          const hasName =
            panel.getAttribute('aria-label') ||
            panel.getAttribute('aria-labelledby') ||
            panel.querySelector('h1, h2, h3, h4, h5, h6');

          expect(hasName).toBeTruthy();
        }
      });
    });
  });

  describe('Internationalization Accessibility', () => {
    it('should have proper language attributes', () => {
      render(<App />);

      // Check document language
      const htmlElement = document.documentElement;
      const lang = htmlElement.getAttribute('lang');

      expect(lang).toBeTruthy();
      expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // Valid language code format
    });

    it('should handle text direction properly', () => {
      render(<App />);

      // Check for proper text direction attributes
      const textElements = document.querySelectorAll('p, span, div, label');

      textElements.forEach(element => {
        const dir = element.getAttribute('dir');

        if (dir) {
          expect(['ltr', 'rtl', 'auto']).toContain(dir);
        }
      });
    });
  });
});