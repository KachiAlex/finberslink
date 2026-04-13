/**
 * Tests for Authorization Middleware
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  verifyResumeOwnership,
  verifyAnalyticsAccess,
  verifyPublishAccess,
  verifyExportAccess,
  verifyUserRole,
  verifyAdminAccess,
  verifySuperAdminAccess,
} from "@/lib/security/authorization";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma");

describe("Authorization Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyResumeOwnership", () => {
    it("should return true when user owns the resume", async () => {
      const resumeId = "resume-123";
      const userId = "user-123";

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: resumeId,
        userId,
      } as any);

      const result = await verifyResumeOwnership(resumeId, userId);
      expect(result).toBe(true);
    });

    it("should return false when user does not own the resume", async () => {
      const resumeId = "resume-123";
      const userId = "user-123";
      const ownerId = "user-456";

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: resumeId,
        userId: ownerId,
      } as any);

      const result = await verifyResumeOwnership(resumeId, userId);
      expect(result).toBe(false);
    });

    it("should return false when resume does not exist", async () => {
      const resumeId = "resume-123";
      const userId = "user-123";

      vi.mocked(prisma.resume.findUnique).mockResolvedValue(null);

      const result = await verifyResumeOwnership(resumeId, userId);
      expect(result).toBe(false);
    });

    it("should throw error on database error", async () => {
      const resumeId = "resume-123";
      const userId = "user-123";

      vi.mocked(prisma.resume.findUnique).mockRejectedValue(
        new Error("Database error")
      );

      await expect(verifyResumeOwnership(resumeId, userId)).rejects.toThrow();
    });
  });

  describe("verifyAnalyticsAccess", () => {
    it("should verify analytics access using ownership check", async () => {
      const resumeId = "resume-123";
      const userId = "user-123";

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: resumeId,
        userId,
      } as any);

      const result = await verifyAnalyticsAccess(resumeId, userId);
      expect(result).toBe(true);
    });
  });

  describe("verifyPublishAccess", () => {
    it("should verify publish access using ownership check", async () => {
      const resumeId = "resume-123";
      const userId = "user-123";

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: resumeId,
        userId,
      } as any);

      const result = await verifyPublishAccess(resumeId, userId);
      expect(result).toBe(true);
    });
  });

  describe("verifyExportAccess", () => {
    it("should verify export access using ownership check", async () => {
      const resumeId = "resume-123";
      const userId = "user-123";

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: resumeId,
        userId,
      } as any);

      const result = await verifyExportAccess(resumeId, userId);
      expect(result).toBe(true);
    });
  });

  describe("verifyUserRole", () => {
    it("should return true when user has required role", async () => {
      const userId = "user-123";
      const role = "ADMIN";

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        role,
      } as any);

      const result = await verifyUserRole(userId, role);
      expect(result).toBe(true);
    });

    it("should return false when user does not have required role", async () => {
      const userId = "user-123";

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        role: "USER",
      } as any);

      const result = await verifyUserRole(userId, "ADMIN");
      expect(result).toBe(false);
    });

    it("should return false when user does not exist", async () => {
      const userId = "user-123";

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await verifyUserRole(userId, "ADMIN");
      expect(result).toBe(false);
    });
  });

  describe("verifyAdminAccess", () => {
    it("should return true when user is admin", async () => {
      const userId = "user-123";

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        role: "ADMIN",
      } as any);

      const result = await verifyAdminAccess(userId);
      expect(result).toBe(true);
    });

    it("should return false when user is not admin", async () => {
      const userId = "user-123";

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        role: "USER",
      } as any);

      const result = await verifyAdminAccess(userId);
      expect(result).toBe(false);
    });
  });

  describe("verifySuperAdminAccess", () => {
    it("should return true when user is superadmin", async () => {
      const userId = "user-123";

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        role: "SUPER_ADMIN",
      } as any);

      const result = await verifySuperAdminAccess(userId);
      expect(result).toBe(true);
    });

    it("should return false when user is not superadmin", async () => {
      const userId = "user-123";

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        role: "ADMIN",
      } as any);

      const result = await verifySuperAdminAccess(userId);
      expect(result).toBe(false);
    });
  });
});
