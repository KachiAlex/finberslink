import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful responses
  skipFailedRequests?: boolean; // Don't count failed responses (5xx, 4xx)
  message?: string; // Error message
}

/**
 * Simple in-memory rate limit store
 * For distributed rate limiting, use Redis
 */
class RateLimitStore {
  private records = new Map<string, { count: number; resetTime: number }>();
  private maxSize = 10000;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [key, record] of this.records.entries()) {
      if (now > record.resetTime) {
        entriesToDelete.push(key);
      }
    }

    for (const key of entriesToDelete) {
      this.records.delete(key);
    }

    // If still over capacity, remove oldest
    if (this.records.size > this.maxSize) {
      const entries = Array.from(this.records.entries())
        .sort((a, b) => a[1].resetTime - b[1].resetTime);
      
      for (let i = 0; i < this.records.size - this.maxSize; i++) {
        this.records.delete(entries[i][0]);
      }
    }
  }

  increment(key: string, windowMs: number): { count: number; remaining: number; resetTime: number } {
    const now = Date.now();
    let record = this.records.get(key);

    // Initialize or reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      record.count += 1;
    }

    this.records.set(key, record);

    return {
      count: record.count,
      remaining: Math.max(0, record.count - 1),
      resetTime: record.resetTime,
    };
  }

  clear() {
    this.records.clear();
  }

  getStats() {
    return {
      stored: this.records.size,
      maxSize: this.maxSize,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

const rateLimitStore = new RateLimitStore();

/**
 * Default key generator: uses IP address + endpoint
 */
function defaultKeyGenerator(request: NextRequest): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `${ip}:${request.nextUrl.pathname}`;
}

/**
 * Create a rate limit middleware
 *
 * @example
 * ```typescript
 * const rateLimit = createRateLimit({
 *   windowMs: 60 * 1000,     // 1 minute
 *   maxRequests: 30,         // 30 requests per minute
 * });
 *
 * export const POST = rateLimit(async (request) => {
 *   return NextResponse.json({ ... });
 * });
 * ```
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = "Too many requests, please try again later.",
  } = config;

  return function rateLimitMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const key = keyGenerator(request);
      const { count, resetTime } = rateLimitStore.increment(key, windowMs);

      // Check if limit exceeded
      if (count > maxRequests) {
        return NextResponse.json(
          { error: message },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
              "X-RateLimit-Limit": maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": resetTime.toString(),
            },
          }
        );
      }

      // Call handler
      let response: NextResponse;
      try {
        response = await handler(request);
      } catch (error) {
        // On error, don't consume rate limit if configured
        if (skipFailedRequests) {
          rateLimitStore.increment(key, -windowMs);
        }
        throw error;
      }

      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", maxRequests.toString());
      response.headers.set("X-RateLimit-Remaining", Math.max(0, maxRequests - count).toString());
      response.headers.set("X-RateLimit-Reset", resetTime.toString());

      // Remove from cache if successful and configured
      if (skipSuccessfulRequests && response.status < 400) {
        rateLimitStore.increment(key, -windowMs);
      }

      return response;
    };
  };
}

/**
 * Predefined rate limit configs
 */
export const rateLimitPresets = {
  // Auth endpoints: 5 attempts per minute
  auth: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: "Too many login attempts. Please try again later.",
  },

  // API endpoints: 100 requests per minute
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },

  // Public endpoints: 1000 requests per minute
  public: {
    windowMs: 60 * 1000,
    maxRequests: 1000,
  },

  // Strict: 1 request per second
  strict: {
    windowMs: 1000,
    maxRequests: 1,
  },

  // Password reset: 3 attempts per hour
  passwordReset: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: "Too many password reset attempts. Please try again later.",
  },

  // File upload: 10 uploads per minute
  fileUpload: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
};

/**
 * Clear rate limit store (useful for testing)
 */
export function clearRateLimits() {
  rateLimitStore.clear();
}

/**
 * Memory status for debugging
 */
export function getRateLimitStats() {
  return rateLimitStore.getStats();
}
