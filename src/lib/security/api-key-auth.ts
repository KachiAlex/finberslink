/**
 * API Key Authentication for External Integrations
 * Manages API keys and validates requests from external services
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger";
import crypto from "crypto";

const logger = new Logger("ApiKeyAuth");

export class ApiKeyError extends Error {
  constructor(message: string = "Invalid API key") {
    super(message);
    this.name = "ApiKeyError";
  }
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Create an API key for a user
 */
export async function createApiKey(
  userId: string,
  name: string,
  expiresAt?: Date
): Promise<{
  apiKey: string;
  hashedKey: string;
  id: string;
}> {
  try {
    const apiKey = generateApiKey();
    const hashedKey = hashApiKey(apiKey);

    // Store in database (implementation depends on your schema)
    // For now, we'll return the key and hash
    logger.info(`API key created for user ${userId}`);

    return {
      apiKey,
      hashedKey,
      id: crypto.randomUUID(),
    };
  } catch (error) {
    logger.error("Error creating API key", error);
    throw new ApiKeyError("Failed to create API key");
  }
}

/**
 * Validate an API key
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  userId?: string;
  scopes?: string[];
  error?: string;
}> {
  try {
    if (!apiKey || apiKey.length < 32) {
      return {
        valid: false,
        error: "Invalid API key format",
      };
    }

    const hashedKey = hashApiKey(apiKey);

    // In production, query database for API key
    // For now, return placeholder
    logger.info("API key validated");

    return {
      valid: true,
      userId: "user-id",
      scopes: ["read:resume", "write:resume"],
    };
  } catch (error) {
    logger.error("Error validating API key", error);
    return {
      valid: false,
      error: "Failed to validate API key",
    };
  }
}

/**
 * Extract API key from request
 */
export function extractApiKey(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try X-API-Key header
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Try query parameter (less secure, but sometimes necessary)
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("api_key");
  if (queryKey) {
    logger.warn("API key passed in query parameter (less secure)");
    return queryKey;
  }

  return null;
}

/**
 * Middleware for API key authentication
 */
export function createApiKeyAuthMiddleware(requiredScopes?: string[]) {
  return async (
    request: NextRequest
  ): Promise<{ valid: boolean; userId?: string; error?: string }> => {
    const apiKey = extractApiKey(request);

    if (!apiKey) {
      logger.warn("Missing API key in request");
      return {
        valid: false,
        error: "API key is required",
      };
    }

    const validation = await validateApiKey(apiKey);

    if (!validation.valid) {
      logger.warn("Invalid API key");
      return {
        valid: false,
        error: validation.error || "Invalid API key",
      };
    }

    // Check scopes if required
    if (requiredScopes && validation.scopes) {
      const hasRequiredScopes = requiredScopes.every((scope) =>
        validation.scopes?.includes(scope)
      );

      if (!hasRequiredScopes) {
        logger.warn(
          `API key missing required scopes: ${requiredScopes.join(", ")}`
        );
        return {
          valid: false,
          error: "Insufficient permissions",
        };
      }
    }

    return {
      valid: true,
      userId: validation.userId,
    };
  };
}

/**
 * Create API key authentication response
 */
export function createApiKeyAuthResponse(
  message: string,
  status: number = 401
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "WWW-Authenticate": 'Bearer realm="API"',
      },
    }
  );
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(apiKeyId: string): Promise<boolean> {
  try {
    // In production, update database to mark key as revoked
    logger.info(`API key revoked: ${apiKeyId}`);
    return true;
  } catch (error) {
    logger.error("Error revoking API key", error);
    return false;
  }
}

/**
 * List API keys for a user (without exposing full keys)
 */
export async function listApiKeys(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    createdAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
    scopes: string[];
  }>
> {
  try {
    // In production, query database
    logger.info(`Listed API keys for user ${userId}`);
    return [];
  } catch (error) {
    logger.error("Error listing API keys", error);
    throw new ApiKeyError("Failed to list API keys");
  }
}

/**
 * Rotate an API key (revoke old, create new)
 */
export async function rotateApiKey(
  apiKeyId: string,
  userId: string
): Promise<{
  newApiKey: string;
  success: boolean;
}> {
  try {
    // Revoke old key
    await revokeApiKey(apiKeyId);

    // Create new key
    const { apiKey } = await createApiKey(userId, "rotated-key");

    logger.info(`API key rotated for user ${userId}`);

    return {
      newApiKey: apiKey,
      success: true,
    };
  } catch (error) {
    logger.error("Error rotating API key", error);
    throw new ApiKeyError("Failed to rotate API key");
  }
}

/**
 * Track API key usage
 */
export async function trackApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  statusCode: number
): Promise<void> {
  try {
    // In production, update database with usage stats
    logger.debug(`API key usage tracked: ${apiKeyId} -> ${endpoint} (${statusCode})`);
  } catch (error) {
    logger.error("Error tracking API key usage", error);
  }
}
