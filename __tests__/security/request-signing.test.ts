/**
 * Tests for Request Signing
 */

import { describe, it, expect } from "vitest";
import {
  generateSignature,
  verifySignature,
  createSignedPayload,
  verifySignedPayload,
  generateSignatureHeader,
  verifySignatureHeader,
  generateOneTimeToken,
  verifyOneTimeToken,
} from "@/lib/security/request-signing";

describe("Request Signing", () => {
  const secret = "test-secret-key";

  describe("generateSignature", () => {
    it("should generate consistent signatures", () => {
      const payload = "test-payload";
      const sig1 = generateSignature(payload, secret);
      const sig2 = generateSignature(payload, secret);

      expect(sig1).toBe(sig2);
    });

    it("should generate different signatures for different payloads", () => {
      const sig1 = generateSignature("payload1", secret);
      const sig2 = generateSignature("payload2", secret);

      expect(sig1).not.toBe(sig2);
    });

    it("should generate different signatures for different secrets", () => {
      const payload = "test-payload";
      const sig1 = generateSignature(payload, "secret1");
      const sig2 = generateSignature(payload, "secret2");

      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifySignature", () => {
    it("should verify correct signatures", () => {
      const payload = "test-payload";
      const signature = generateSignature(payload, secret);

      const result = verifySignature(payload, signature, secret);
      expect(result).toBe(true);
    });

    it("should reject incorrect signatures", () => {
      const payload = "test-payload";
      const signature = generateSignature(payload, secret);

      const result = verifySignature(payload, "invalid-signature", secret);
      expect(result).toBe(false);
    });

    it("should reject signatures with wrong secret", () => {
      const payload = "test-payload";
      const signature = generateSignature(payload, secret);

      const result = verifySignature(payload, signature, "wrong-secret");
      expect(result).toBe(false);
    });

    it("should reject signatures for modified payloads", () => {
      const payload = "test-payload";
      const signature = generateSignature(payload, secret);

      const result = verifySignature("modified-payload", signature, secret);
      expect(result).toBe(false);
    });
  });

  describe("createSignedPayload", () => {
    it("should create signed payload with timestamp", () => {
      const data = { userId: "user-123", action: "export" };
      const result = createSignedPayload(data, secret);

      expect(result).toHaveProperty("payload");
      expect(result).toHaveProperty("signature");
      expect(result).toHaveProperty("timestamp");

      const parsed = JSON.parse(result.payload);
      expect(parsed.userId).toBe("user-123");
      expect(parsed.action).toBe("export");
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe("verifySignedPayload", () => {
    it("should verify valid signed payload", () => {
      const data = { userId: "user-123", action: "export" };
      const { payload, signature } = createSignedPayload(data, secret);

      const result = verifySignedPayload(payload, signature, secret);
      expect(result.valid).toBe(true);
      expect(result.data?.userId).toBe("user-123");
    });

    it("should reject invalid signatures", () => {
      const data = { userId: "user-123", action: "export" };
      const { payload } = createSignedPayload(data, secret);

      const result = verifySignedPayload(payload, "invalid-sig", secret);
      expect(result.valid).toBe(false);
    });

    it("should reject expired payloads", () => {
      const data = { userId: "user-123", action: "export" };
      const { payload, signature } = createSignedPayload(data, secret);

      // Wait a bit and verify with very short maxAge
      const result = verifySignedPayload(payload, signature, secret, 1);
      expect(result.valid).toBe(false);
    });

    it("should accept payloads within maxAge", () => {
      const data = { userId: "user-123", action: "export" };
      const { payload, signature } = createSignedPayload(data, secret);

      const result = verifySignedPayload(payload, signature, secret, 60000);
      expect(result.valid).toBe(true);
    });
  });

  describe("generateSignatureHeader", () => {
    it("should generate signature headers", () => {
      const result = generateSignatureHeader(
        "POST",
        "/api/resume/export",
        '{"resumeId":"123"}',
        secret
      );

      expect(result).toHaveProperty("X-Signature");
      expect(result).toHaveProperty("X-Timestamp");
      expect(result["X-Signature"]).toBeTruthy();
      expect(result["X-Timestamp"]).toBeTruthy();
    });
  });

  describe("verifySignatureHeader", () => {
    it("should verify valid signature headers", () => {
      const method = "POST";
      const path = "/api/resume/export";
      const body = '{"resumeId":"123"}';

      const headers = generateSignatureHeader(method, path, body, secret);

      const result = verifySignatureHeader(
        method,
        path,
        body,
        headers["X-Signature"],
        headers["X-Timestamp"],
        secret
      );

      expect(result).toBe(true);
    });

    it("should reject invalid signature headers", () => {
      const method = "POST";
      const path = "/api/resume/export";
      const body = '{"resumeId":"123"}';

      const result = verifySignatureHeader(
        method,
        path,
        body,
        "invalid-signature",
        Date.now().toString(),
        secret
      );

      expect(result).toBe(false);
    });

    it("should reject expired signature headers", () => {
      const method = "POST";
      const path = "/api/resume/export";
      const body = '{"resumeId":"123"}';

      const oldTimestamp = (Date.now() - 10 * 60 * 1000).toString(); // 10 minutes ago
      const headers = generateSignatureHeader(method, path, body, secret);

      const result = verifySignatureHeader(
        method,
        path,
        body,
        headers["X-Signature"],
        oldTimestamp,
        secret,
        5 * 60 * 1000 // 5 minute max age
      );

      expect(result).toBe(false);
    });
  });

  describe("generateOneTimeToken", () => {
    it("should generate one-time tokens", () => {
      const result = generateOneTimeToken("user-123", "export", secret);

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("expiresAt");
      expect(result.token).toBeTruthy();
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe("verifyOneTimeToken", () => {
    it("should verify valid one-time tokens", () => {
      const userId = "user-123";
      const operation = "export";
      const { token, expiresAt } = generateOneTimeToken(userId, operation, secret);

      const result = verifyOneTimeToken(token, userId, operation, secret, expiresAt);
      expect(result).toBe(true);
    });

    it("should reject expired one-time tokens", () => {
      const userId = "user-123";
      const operation = "export";
      const expiredTime = Date.now() - 1000; // 1 second ago

      const { token } = generateOneTimeToken(userId, operation, secret);

      const result = verifyOneTimeToken(token, userId, operation, secret, expiredTime);
      expect(result).toBe(false);
    });

    it("should reject tokens with wrong user ID", () => {
      const userId = "user-123";
      const operation = "export";
      const { token, expiresAt } = generateOneTimeToken(userId, operation, secret);

      const result = verifyOneTimeToken(token, "user-456", operation, secret, expiresAt);
      expect(result).toBe(false);
    });

    it("should reject tokens with wrong operation", () => {
      const userId = "user-123";
      const operation = "export";
      const { token, expiresAt } = generateOneTimeToken(userId, operation, secret);

      const result = verifyOneTimeToken(token, userId, "publish", secret, expiresAt);
      expect(result).toBe(false);
    });
  });
});
