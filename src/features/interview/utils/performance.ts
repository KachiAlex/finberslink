/**
 * Performance optimization utilities for the interview studio
 */

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Lazy load a component
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.LazyExoticComponent<T> {
  return React.lazy(importFunc);
}

/**
 * Measure performance of a function
 */
export async function measurePerformance<T>(
  name: string,
  func: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await func();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`[Performance] ${name} failed: ${(end - start).toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Request idle callback polyfill
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  const start = Date.now();
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    } as IdleDeadline);
  }, 1) as unknown as number;
}

/**
 * Cancel idle callback
 */
export function cancelIdleCallback(id: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
): boolean {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isVisible;
}

/**
 * Virtual list utilities for rendering large lists
 */
export const virtualList = {
  /**
   * Calculate visible items in a virtual list
   */
  getVisibleItems: (
    items: any[],
    itemHeight: number,
    containerHeight: number,
    scrollTop: number
  ) => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
    return {
      startIndex: Math.max(0, startIndex),
      endIndex: Math.min(items.length, endIndex),
      visibleItems: items.slice(
        Math.max(0, startIndex),
        Math.min(items.length, endIndex)
      ),
    };
  },

  /**
   * Calculate offset for virtual list
   */
  getOffset: (startIndex: number, itemHeight: number) => startIndex * itemHeight,
};

/**
 * Cache utilities
 */
export const cache = {
  /**
   * Simple in-memory cache with TTL
   */
  createCache: <T>(ttl: number = 5 * 60 * 1000) => {
    const store = new Map<string, { value: T; expiry: number }>();

    return {
      get: (key: string): T | null => {
        const item = store.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
          store.delete(key);
          return null;
        }
        return item.value;
      },
      set: (key: string, value: T) => {
        store.set(key, {
          value,
          expiry: Date.now() + ttl,
        });
      },
      clear: () => store.clear(),
      delete: (key: string) => store.delete(key),
    };
  },

  /**
   * LocalStorage cache with TTL
   */
  createLocalStorageCache: <T>(prefix: string = 'cache_', ttl: number = 5 * 60 * 1000) => {
    return {
      get: (key: string): T | null => {
        try {
          const item = localStorage.getItem(`${prefix}${key}`);
          if (!item) return null;
          const { value, expiry } = JSON.parse(item);
          if (Date.now() > expiry) {
            localStorage.removeItem(`${prefix}${key}`);
            return null;
          }
          return value;
        } catch {
          return null;
        }
      },
      set: (key: string, value: T) => {
        try {
          localStorage.setItem(
            `${prefix}${key}`,
            JSON.stringify({
              value,
              expiry: Date.now() + ttl,
            })
          );
        } catch {
          console.warn('Failed to set cache item');
        }
      },
      clear: () => {
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(prefix)) {
              localStorage.removeItem(key);
            }
          });
        } catch {
          console.warn('Failed to clear cache');
        }
      },
      delete: (key: string) => {
        try {
          localStorage.removeItem(`${prefix}${key}`);
        } catch {
          console.warn('Failed to delete cache item');
        }
      },
    };
  },
};

/**
 * Web Vitals measurement
 */
export const webVitals = {
  /**
   * Measure Largest Contentful Paint (LCP)
   */
  measureLCP: (callback: (lcp: number) => void) => {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          callback(lastEntry.renderTime || lastEntry.loadTime);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        console.warn('LCP measurement not supported');
      }
    }
  },

  /**
   * Measure First Input Delay (FID)
   */
  measureFID: (callback: (fid: number) => void) => {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            callback(entry.processingDuration);
          });
        });
        observer.observe({ entryTypes: ['first-input'] });
      } catch {
        console.warn('FID measurement not supported');
      }
    }
  },

  /**
   * Measure Cumulative Layout Shift (CLS)
   */
  measureCLS: (callback: (cls: number) => void) => {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              callback(clsValue);
            }
          });
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch {
        console.warn('CLS measurement not supported');
      }
    }
  },
};

// Import React for lazy loading
import React from 'react';
