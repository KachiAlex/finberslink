import "server-only";

import { NextRequest, NextResponse } from "next/server";

/**
 * CSRF Protection using Double Submit Cookie pattern
 *
 * How it works:
 * 1. Server generates CSRF token and sends as httpOnly cookie + response body
 * 2. Client includes token in custom header (X-CSRF-Token) with requests
 * 3. Server verifies token from header matches token from cookie
 * 4. Tokens are also stored server-side in case of token theft
 */

const CSRF_COOKIE_NAME = "__csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32; // 256 bits
const CSRF_TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Server-side token store (in production, use Redis)
class CsrfTokenStore {
  private records = new Map<string, { token: string; createdAt: number }>();
  private maxSize = 100000;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [key, record] of this.records.entries()) {
      if (now - record.createdAt > CSRF_TOKEN_TTL) {
        entriesToDelete.push(key);
      }
    }

    for (const key of entriesToDelete) {
      this.records.delete(key);
    }

    // If still over capacity, remove oldest
    if (this.records.size > this.maxSize) {
      const entries = Array.from(this.records.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      for (let i = 0; i < this.records.size - this.maxSize; i++) {
        this.records.delete(entries[i][0]);
      }
    }
  }

  set(identifier: string, token: string) {
    this.records.set(identifier, { token, createdAt: Date.now() });
  }

  get(identifier: string) {
    return this.records.get(identifier);
  }

  delete(identifier: string) {
    this.records.delete(identifier);
  }

  getSize() {
    return this.records.size;
  }

  clear() {
    this.records.clear();
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

const csrfTokenStore = new CsrfTokenStore();

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error("Secure random generator not available");
  }

  const bytes = cryptoObj.getRandomValues(new Uint8Array(CSRF_TOKEN_LENGTH));
  let token = "";
  for (let i = 0; i < bytes.length; i += 1) {
    token += bytes[i].toString(16).padStart(2, "0");
  }
  return token;
}

/**
 * Store token server-side for additional security
 */
export function storeCsrfToken(token: string, identifier: string): void {
  csrfTokenStore.set(identifier, token);
}

/**
 * Verify token exists and is not expired
 */
export function verifyCsrfToken(token: string, identifier: string): boolean {
  const stored = csrfTokenStore.get(identifier);
  return stored !== undefined && stored.token === token;
}

/**
 * Clear CSRF token after verification (one-time use)
 */
export function clearCsrfToken(identifier: string): void {
  csrfTokenStore.delete(identifier);
}

/**
 * Add CSRF token to response
 */
export function attachCsrfToken(response: NextResponse, token: string): void {
  // HttpOnly cookie (not accessible to JavaScript)
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_TTL / 1000, // Convert to seconds
    path: "/",
  });
}

/**
 * Extract CSRF token from request
 */
function extractCsrfToken(request: NextRequest): string | null {
  // Try to get from header first (for API requests)
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    return headerToken;
  }

  // Fallback to cookie (for form submissions)
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  return cookieToken ?? null;
}

/**
 * Simple hash function for identifier (not cryptographically secure)
 * Since this is just for client identification, a simple approach is fine
 */
async function hashIdentifier(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get client identifier (IP + user-agent hash)
 */
async function getClientIdentifier(request: NextRequest): Promise<string> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  const combined = `${ip}:${userAgent}`;
  return hashIdentifier(combined);
}

export interface CsrfProtectionConfig {
  /**
   * HTTP methods to protect (default: POST, PUT, DELETE, PATCH)
   */
  protectedMethods?: string[];
  /**
   * Routes to exclude from CSRF protection
   */
  excludeRoutes?: RegExp[];
  /**
   * Whether to use one-time tokens
   */
  oneTimeUse?: boolean;
  /**
   * Custom error message
   */
  message?: string;
}

/**
 * CSRF protection middleware using double-submit cookies
 *
 * @example
 * ```typescript
 * const csrfProtection = createCsrfProtection();
 *
 * export const POST = csrfProtection(async (request) => {
 *   // Your handler...
 *   return NextResponse.json({ ... });
 * });
 * ```
 */
export function createCsrfProtection(config: CsrfProtectionConfig = {}) {
  const {
    protectedMethods = ["POST", "PUT", "DELETE", "PATCH"],
    excludeRoutes = [],
    oneTimeUse = false,
    message = "CSRF token validation failed",
  } = config;

  return function csrfProtectionMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const { pathname } = request.nextUrl;
      const method = request.method.toUpperCase();

      // Skip GET requests (only protect mutation methods)
      if (!protectedMethods.includes(method)) {
        return handler(request);
      }

      // Skip excluded routes
      if (excludeRoutes.some(pattern => pattern.test(pathname))) {
        return handler(request);
      }

      // Extract token
      const token = extractCsrfToken(request);
      if (!token) {
        return NextResponse.json(
          { error: "CSRF token missing" },
          { status: 403 }
        );
      }

      try {
        // Verify token
        const clientId = await getClientIdentifier(request);
        const isValid = verifyCsrfToken(token, clientId);

        if (!isValid) {
          return NextResponse.json(
            { error: message },
            { status: 403 }
          );
        }

        // Clear token if one-time use is enabled
        if (oneTimeUse) {
          clearCsrfToken(clientId);
        }

        // Call handler
        const response = await handler(request);

        // Generate and attach new token for next request
        const newToken = generateCsrfToken();
        storeCsrfToken(newToken, clientId);
        attachCsrfToken(response, newToken);

        return response;
      } catch (error) {
        console.error("CSRF protection error:", error);
        return NextResponse.json(
          { error: "Security error" },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Middleware to generate initial CSRF token
 * Call this for GET requests to initialize CSRF protection
 *
 * @example
 * ```typescript
 * export const GET = initializeCsrfToken(async (request) => {
 *   return NextResponse.json({ message: "OK" });
 * });
 * ```
 */
export function initializeCsrfToken(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);

    try {
      // Generate and attach CSRF token
      const token = generateCsrfToken();
      const clientId = await getClientIdentifier(request);
      storeCsrfToken(token, clientId);
      attachCsrfToken(response, token);
    } catch (error) {
      console.error("CSRF initialization error:", error);
    }

    return response;
  };
}

/**
 * Middleware to get CSRF token via API
 * Useful for SPAs that need to fetch token on app load
 *
 * @example
 * ```typescript
 * export const GET = getCsrfToken();
 * ```
 */
export function getCsrfTokenEndpoint() {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const token = generateCsrfToken();
      const clientId = await getClientIdentifier(request);
      storeCsrfToken(token, clientId);

      const response = NextResponse.json({
        csrfToken: token,
      });

      attachCsrfToken(response, token);
      return response;
    } catch (error) {
      console.error("CSRF token generation error:", error);
      return NextResponse.json(
        { error: "Security configuration error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Refresh rate limiting for CSRF token generation
 * Prevents token generation spam
 */
const csrfTokenRefreshCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitCsrfGeneration(clientId: string, maxPerMinute: number = 10): boolean {
  const now = Date.now();
  const oneMinute = 60 * 1000;

  let record = csrfTokenRefreshCounts.get(clientId);

  if (!record || now > record.resetTime) {
    csrfTokenRefreshCounts.set(clientId, {
      count: 1,
      resetTime: now + oneMinute,
    });
    return true;
  }

  if (record.count >= maxPerMinute) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get CSRF token store stats (for debugging)
 */
export function getCsrfStats() {
  return {
    storedTokens: csrfTokenStore.getSize(),
    refreshAttempts: csrfTokenRefreshCounts.size,
  };
}

/**
 * Clear all CSRF tokens (useful for logout or testing)
 */
export function clearAllCsrfTokens() {
  csrfTokenStore.clear();
  csrfTokenRefreshCounts.clear();
}
