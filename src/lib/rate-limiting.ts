/**
 * Rate Limiting Implementation for Resume Completion Feature
 * Task 56: Add rate limiting to all endpoints
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  export: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  share: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  analytics: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  view: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour per resume
};

/**
 * Create a rate limit key for a user/resource combination
 */
function createRateLimitKey(
  userId: string,
  endpoint: string,
  resourceId?: string
): string {
  if (resourceId) {
    return `${endpoint}:${userId}:${resourceId}`;
  }
  return `${endpoint}:${userId}`;
}

/**
 * Check if a request is within rate limits
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry
    const newEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
  };
}

/**
 * Middleware for rate limiting
 */
export function createRateLimitMiddleware(
  endpoint: string,
  config?: RateLimitConfig
) {
  const finalConfig = config || RATE_LIMIT_CONFIGS[endpoint];

  if (!finalConfig) {
    throw new Error(`No rate limit config found for endpoint: ${endpoint}`);
  }

  return async (
    request: NextRequest,
    userId: string,
    resourceId?: string
  ): Promise<NextResponse | null> => {
    const key = createRateLimitKey(userId, endpoint, resourceId);
    const result = checkRateLimit(key, finalConfig);

    if (!result.allowed) {
      const resetDate = new Date(result.resetTime);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          resetTime: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000)
              .toString(),
            "X-RateLimit-Limit": finalConfig.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetTime.toString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    return null; // Middleware will add headers
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  endpoint: string,
  remaining: number,
  resetTime: number,
  config?: RateLimitConfig
): NextResponse {
  const finalConfig = config || RATE_LIMIT_CONFIGS[endpoint];

  response.headers.set(
    "X-RateLimit-Limit",
    finalConfig.maxRequests.toString()
  );
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", resetTime.toString());

  return response;
}

/**
 * Clean up old rate limit entries (run periodically)
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Reset rate limit for a specific key (admin function)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(
  key: string,
  config: RateLimitConfig
): { count: number; remaining: number; resetTime: number; isLimited: boolean } {
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      isLimited: false,
    };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
    isLimited: entry.count >= config.maxRequests,
  };
}
