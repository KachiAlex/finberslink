/**
 * Accessibility utilities for the interview studio
 */

/**
 * Generate ARIA labels for common interview elements
 */
export const ariaLabels = {
  recordButton: 'Start recording your response',
  stopButton: 'Stop recording',
  playButton: 'Play audio response',
  pauseButton: 'Pause audio playback',
  uploadButton: 'Upload recorded audio',
  deleteButton: 'Delete this response',
  nextQuestion: 'Move to next question',
  previousQuestion: 'Move to previous question',
  submitSession: 'Submit interview session',
  viewAnalytics: 'View your analytics dashboard',
  selectRole: 'Select interview role',
  selectQuestions: 'Select interview questions',
  filterQuestions: 'Filter questions by difficulty or category',
  sortQuestions: 'Sort questions',
  expandDetails: 'Show more details',
  collapseDetails: 'Hide details',
};

/**
 * Keyboard event handlers for accessibility
 */
export const keyboardHandlers = {
  /**
   * Handle Enter key press
   */
  handleEnter: (callback: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle Escape key press
   */
  handleEscape: (callback: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle Space key press
   */
  handleSpace: (callback: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle Arrow keys
   */
  handleArrowKeys: (
    onUp?: () => void,
    onDown?: () => void,
    onLeft?: () => void,
    onRight?: () => void
  ) => (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onRight?.();
        break;
    }
  },
};

/**
 * Announce messages to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Focus an element with optional scroll
   */
  focus: (element: HTMLElement | null, scroll = true) => {
    if (element) {
      if (scroll) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      element.focus();
    }
  },

  /**
   * Trap focus within a container
   */
  trapFocus: (container: HTMLElement, e: KeyboardEvent) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  },

  /**
   * Restore focus to a previously focused element
   */
  restoreFocus: (element: HTMLElement | null) => {
    if (element) {
      setTimeout(() => {
        element.focus();
      }, 0);
    }
  },
};

/**
 * Color contrast utilities for WCAG compliance
 */
export const colorContrast = {
  /**
   * Check if contrast ratio meets WCAG AA standard (4.5:1 for normal text)
   */
  meetsWCAGAA: (ratio: number): boolean => ratio >= 4.5,

  /**
   * Check if contrast ratio meets WCAG AAA standard (7:1 for normal text)
   */
  meetsWCAGAAA: (ratio: number): boolean => ratio >= 7,

  /**
   * Common accessible color pairs
   */
  accessiblePairs: {
    primary: { bg: '#ffffff', fg: '#000000', ratio: 21 },
    success: { bg: '#ffffff', fg: '#065f46', ratio: 8.59 },
    warning: { bg: '#ffffff', fg: '#92400e', ratio: 7.65 },
    error: { bg: '#ffffff', fg: '#7f1d1d', ratio: 8.59 },
    info: { bg: '#ffffff', fg: '#1e3a8a', ratio: 8.59 },
  },
};

/**
 * Semantic HTML utilities
 */
export const semanticHTML = {
  /**
   * Create a semantic heading with proper hierarchy
   */
  heading: (level: 1 | 2 | 3 | 4 | 5 | 6, text: string, id?: string) => {
    const tag = `h${level}`;
    return { tag, text, id };
  },

  /**
   * Create a semantic list
   */
  list: (items: string[], ordered = false) => {
    return {
      tag: ordered ? 'ol' : 'ul',
      items,
    };
  },

  /**
   * Create a semantic form group
   */
  formGroup: (label: string, inputId: string, required = false) => {
    return {
      label,
      inputId,
      required,
    };
  },
};

/**
 * ARIA live region utilities
 */
export const ariaLiveRegions = {
  /**
   * Create a polite live region for non-urgent announcements
   */
  polite: (id: string) => ({
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    id,
  }),

  /**
   * Create an assertive live region for urgent announcements
   */
  assertive: (id: string) => ({
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
    id,
  }),
};
