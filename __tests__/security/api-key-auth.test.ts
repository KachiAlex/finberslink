/**
 * Tests for API Key Authentication
 */

import { describe, it, expect } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  validateApiKey,
  extractApiKey,
  revokeApiKey,
  rotateApiKey,
} from "@/lib/security/api-key-auth";
import { NextRequest } from "next/server";

describe("API Key Authentication", () => {
  describe("generateApiKey", () => {
    it("should generate unique API keys", () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();

      expect(key1).not.toBe(key2);
      expect(key1.length).toBeGreaterThan(0);
      expect(key2.length).toBeGreaterThan(0);
    });

    it("should generate keys with sufficient length", () => {
      const key = generateApiKey();
      expect(key.length).toBeGreaterThanOrEqual(64); // 32 bytes = 64 hex chars
    });
  });

  describe("hashApiKey", () => {
    it("should hash API keys consistently", () => {
      const key = generateApiKey();
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different keys", () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();

      const hash1 = hashApiKey(key1);
      const hash2 = hashApiKey(key2);

      expect(hash1).not.toBe(hash2);
    });

    it("should produce SHA256 hashes", () => {
      const key = generateApiKey();
      const hash = hashApiKey(key);

      // SHA256 produces 64 character hex strings
      expect(hash.length).toBe(64);
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    });
  });

  describe("validateApiKey", () => {
    it("should validate API keys", async () => {
      const key = generateApiKey();
      const result = await validateApiKey(key);

      expect(result.valid).toBe(true);
      expect(result.userId).toBeDefined();
    });

    it("should reject short API keys", async () => {
      const result = await validateApiKey("short");

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject empty API keys", async () => {
      const result = await validateApiKey("");

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("extractApiKey", () => {
    it("should extract API key from Authorization header", () => {
      const key = generateApiKey();
      const request = new NextRequest("http://localhost/api/test", {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      const extracted = extractApiKey(request);
      expect(extracted).toBe(key);
    });

    it("should extract API key from X-API-Key header", () => {
      const key = generateApiKey();
      const request = new NextRequest("http://localhost/api/test", {
        headers: {
          "X-API-Key": key,
        },
      });

      const extracted = extractApiKey(request);
      expect(extracted).toBe(key);
    });

    it("should extract API key from query parameter", () => {
      const key = generateApiKey();
      const request = new NextRequest(
        `http://localhost/api/test?api_key=${key}`
      );

      const extracted = extractApiKey(request);
      expect(extracted).toBe(key);
    });

    it("should return null when no API key is present", () => {
      const request = new NextRequest("http://localhost/api/test");

      const extracted = extractApiKey(request);
      expect(extracted).toBeNull();
    });

    it("should prioritize Authorization header over other sources", () => {
      const authKey = generateApiKey();
      const headerKey = generateApiKey();
      const queryKey = generateApiKey();

      const request = new NextRequest(
        `http://localhost/api/test?api_key=${queryKey}`,
        {
          headers: {
            Authorization: `Bearer ${authKey}`,
            "X-API-Key": headerKey,
          },
        }
      );

      const extracted = extractApiKey(request);
      expect(extracted).toBe(authKey);
    });
  });

  describe("revokeApiKey", () => {
    it("should revoke API keys", async () => {
      const result = await revokeApiKey("key-123");
      expect(result).toBe(true);
    });
  });

  describe("rotateApiKey", () => {
    it("should rotate API keys", async () => {
      const oldKeyId = "key-123";
      const userId = "user-123";

      const result = await rotateApiKey(oldKeyId, userId);

      expect(result.success).toBe(true);
      expect(result.newApiKey).toBeDefined();
      expect(result.newApiKey.length).toBeGreaterThan(0);
    });
  });
});
