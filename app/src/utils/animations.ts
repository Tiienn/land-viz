/**
 * Micro-Animation Utilities
 *
 * Canva-inspired animation system for smooth, delightful interactions
 * Based on design system: docs/project/canva-design-system.md
 */

/**
 * Animation timing constants
 * - Quick feedback: 100ms (immediate)
 * - Transitions: 200ms (smooth)
 * - Animations: 300ms (noticeable)
 * - Celebrations: 600ms (memorable)
 */
export const ANIMATION_TIMING = {
  QUICK: '0.1s',
  SMOOTH: '0.2s',
  NOTICEABLE: '0.3s',
  CELEBRATION: '0.6s',
} as const;

/**
 * Easing functions for smooth transitions
 */
export const EASING = {
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  EASE: 'ease',
} as const;

/**
 * Button hover animation: Subtle elevation
 * Usage: Apply to button style, add onMouseEnter/Leave handlers
 */
export const buttonHoverStyle = {
  transition: `all ${ANIMATION_TIMING.SMOOTH} ${EASING.EASE}`,
} as const;

export const applyButtonHover = (element: HTMLElement) => {
  element.style.transform = 'translateY(-1px)';
  element.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
};

export const removeButtonHover = (element: HTMLElement) => {
  element.style.transform = 'translateY(0)';
  element.style.boxShadow = 'none';
};

/**
 * Tool selection animation: Scale pulse
 * Usage: Call on tool button click
 */
export const animateToolSelection = (element: HTMLElement) => {
  // Reset animation if already running
  element.style.animation = 'none';

  // Force reflow to restart animation
  void element.offsetHeight;

  // Apply scale pulse animation
  element.style.animation = `toolSelectPulse ${ANIMATION_TIMING.SMOOTH} ${EASING.EASE_OUT}`;

  // Remove animation after completion
  setTimeout(() => {
    element.style.animation = '';
  }, 200);
};

/**
 * Success feedback animation: Green pulse
 * Usage: Call on successful save/export actions
 */
export const animateSuccess = (element: HTMLElement) => {
  element.style.animation = `successPulse ${ANIMATION_TIMING.CELEBRATION} ${EASING.EASE_OUT}`;

  setTimeout(() => {
    element.style.animation = '';
  }, 600);
};

/**
 * Error feedback animation: Red shake
 * Usage: Call on error/validation failure
 */
export const animateError = (element: HTMLElement) => {
  element.style.animation = `errorShake ${ANIMATION_TIMING.NOTICEABLE} ${EASING.EASE_OUT}`;

  setTimeout(() => {
    element.style.animation = '';
  }, 300);
};

/**
 * Primary button style with animations
 */
export const primaryButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: '500',
  transition: `all ${ANIMATION_TIMING.SMOOTH} ${EASING.EASE}`,
  boxShadow: '0 2px 4px rgba(0, 196, 204, 0.15)',
  border: 'none',
  cursor: 'pointer',
};

/**
 * Secondary button style with animations
 */
export const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#3F3F46',
  border: '1px solid #E4E4E7',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: '500',
  transition: `all ${ANIMATION_TIMING.SMOOTH} ${EASING.EASE}`,
  cursor: 'pointer',
};

/**
 * Tool button style with animations
 */
export const toolButtonStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: '4px',
  minWidth: '65px',
  height: '60px',
  border: isActive ? '1px solid #67E8F9' : '1px solid #e5e7eb',
  cursor: 'pointer',
  background: isActive
    ? 'linear-gradient(135deg, #ECFEFF 0%, #F3E8FF 100%)'
    : '#ffffff',
  color: isActive ? '#0891B2' : '#000000',
  transition: `all ${ANIMATION_TIMING.SMOOTH} ${EASING.EASE}`,
  fontSize: '11px',
  fontWeight: '500',
  boxShadow: isActive ? '0 0 0 2px rgba(8, 145, 178, 0.1)' : 'none',
});

/**
 * CSS keyframes for animations
 * Insert into global stylesheet or style tag
 */
export const animationKeyframes = `
@keyframes toolSelectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes successPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  100% {
    box-shadow: 0 0 0 20px rgba(34, 197, 94, 0);
  }
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Week 3: Shimmer loading effect */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Week 3: Celebration effect */
@keyframes celebrate {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

/* Week 3: Smooth panel transitions */
@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}
`;

/**
 * Hover handlers for buttons with elevation effect
 */
export const createHoverHandlers = (isActive: boolean = false) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    if (!isActive) {
      applyButtonHover(e.currentTarget);
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    if (!isActive) {
      removeButtonHover(e.currentTarget);
    }
  },
});

/**
 * Click handler with selection animation
 */
export const createClickAnimationHandler = (onClick: () => void) => (
  e: React.MouseEvent<HTMLElement>
) => {
  animateToolSelection(e.currentTarget);
  onClick();
};

/**
 * Week 3 Enhancement: Loading shimmer animation
 * Usage: Apply to loading placeholders and skeleton screens
 */
export const animateShimmer = (element: HTMLElement) => {
  element.style.animation = `shimmer 2s infinite linear`;
  element.style.backgroundSize = '200% 100%';
  element.style.backgroundImage = 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)';
};

/**
 * Week 3 Enhancement: Celebration confetti effect
 * Usage: Call on major achievements (successful export, etc.)
 */
export const celebrateSuccess = (element: HTMLElement) => {
  // Add success pulse + celebration animation
  element.style.animation = `successPulse ${ANIMATION_TIMING.CELEBRATION} ${EASING.EASE_OUT}, celebrate 0.8s ${EASING.EASE_OUT}`;

  setTimeout(() => {
    element.style.animation = '';
  }, 800);
};

/**
 * Week 3 Enhancement: Smooth panel slide transitions
 * Usage: Apply to collapsible panels
 */
export const animatePanelOpen = (element: HTMLElement) => {
  element.style.animation = `slideIn ${ANIMATION_TIMING.NOTICEABLE} ${EASING.EASE_OUT}`;
  element.style.opacity = '1';

  setTimeout(() => {
    element.style.animation = '';
  }, 300);
};

export const animatePanelClose = (element: HTMLElement) => {
  element.style.animation = `fadeOut ${ANIMATION_TIMING.SMOOTH} ${EASING.EASE}`;

  setTimeout(() => {
    element.style.animation = '';
    element.style.opacity = '0';
  }, 200);
};
