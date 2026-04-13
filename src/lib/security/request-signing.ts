/**
 * Request Signing for Sensitive Operations
 * Implements HMAC-SHA256 signing for request verification
 */

import { Logger } from "@/lib/logger";
import crypto from "crypto";

const logger = new Logger("RequestSigning");

export class SignatureError extends Error {
  constructor(message: string = "Signature verification failed") {
    super(message);
    this.name = "SignatureError";
  }
}

/**
 * Generate a signature for a request
 */
export function generateSignature(
  payload: string,
  secret: string
): string {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    return hmac.digest("hex");
  } catch (error) {
    logger.error("Error generating signature", error);
    throw new SignatureError("Failed to generate signature");
  }
}

/**
 * Verify a request signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = generateSignature(payload, secret);
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.warn("Signature verification failed", error);
    return false;
  }
}

/**
 * Create a signed request payload
 */
export function createSignedPayload(
  data: Record<string, any>,
  secret: string
): {
  payload: string;
  signature: string;
  timestamp: number;
} {
  const timestamp = Date.now();
  const payload = JSON.stringify({
    ...data,
    timestamp,
  });

  const signature = generateSignature(payload, secret);

  return {
    payload,
    signature,
    timestamp,
  };
}

/**
 * Verify a signed payload
 */
export function verifySignedPayload(
  payload: string,
  signature: string,
  secret: string,
  maxAge?: number
): { valid: boolean; data?: Record<string, any>; error?: string } {
  try {
    // Verify signature
    if (!verifySignature(payload, signature, secret)) {
      return {
        valid: false,
        error: "Invalid signature",
      };
    }

    // Parse payload
    const data = JSON.parse(payload);

    // Check timestamp if maxAge is specified
    if (maxAge) {
      const age = Date.now() - data.timestamp;
      if (age > maxAge) {
        return {
          valid: false,
          error: "Payload expired",
        };
      }
    }

    return {
      valid: true,
      data,
    };
  } catch (error) {
    logger.error("Error verifying signed payload", error);
    return {
      valid: false,
      error: "Failed to verify payload",
    };
  }
}

/**
 * Generate a request signature header
 */
export function generateSignatureHeader(
  method: string,
  path: string,
  body: string,
  secret: string
): {
  "X-Signature": string;
  "X-Timestamp": string;
} {
  const timestamp = Date.now().toString();
  const payload = `${method}:${path}:${body}:${timestamp}`;
  const signature = generateSignature(payload, secret);

  return {
    "X-Signature": signature,
    "X-Timestamp": timestamp,
  };
}

/**
 * Verify a request signature header
 */
export function verifySignatureHeader(
  method: string,
  path: string,
  body: string,
  signature: string,
  timestamp: string,
  secret: string,
  maxAge: number = 5 * 60 * 1000 // 5 minutes
): boolean {
  try {
    // Check timestamp
    const requestTime = parseInt(timestamp, 10);
    const age = Date.now() - requestTime;

    if (age > maxAge) {
      logger.warn("Request signature expired");
      return false;
    }

    // Verify signature
    const payload = `${method}:${path}:${body}:${timestamp}`;
    return verifySignature(payload, signature, secret);
  } catch (error) {
    logger.error("Error verifying signature header", error);
    return false;
  }
}

/**
 * Create a webhook signature (for external integrations)
 */
export function createWebhookSignature(
  payload: string,
  secret: string
): string {
  return generateSignature(payload, secret);
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  return verifySignature(payload, signature, secret);
}

/**
 * Generate a one-time token for sensitive operations
 */
export function generateOneTimeToken(
  userId: string,
  operation: string,
  secret: string
): {
  token: string;
  expiresAt: number;
} {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  const payload = `${userId}:${operation}:${expiresAt}`;
  const token = generateSignature(payload, secret);

  return {
    token,
    expiresAt,
  };
}

/**
 * Verify a one-time token
 */
export function verifyOneTimeToken(
  token: string,
  userId: string,
  operation: string,
  secret: string,
  expiresAt: number
): boolean {
  try {
    // Check expiration
    if (Date.now() > expiresAt) {
      logger.warn("One-time token expired");
      return false;
    }

    // Verify token
    const payload = `${userId}:${operation}:${expiresAt}`;
    return verifySignature(payload, token, secret);
  } catch (error) {
    logger.error("Error verifying one-time token", error);
    return false;
  }
}
