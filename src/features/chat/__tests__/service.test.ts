import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ensureMembership,
  listChatSpacesForUser,
  ensureChatSpace,
  upsertChatMembership,
  listChatThreads,
  createChatThread,
  listThreadMessages,
  sendChatMessage,
  markThreadRead,
  listChatNotifications,
  markChatNotificationsSeen,
} from "../service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    chatSpace: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    chatMembership: { findFirst: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    chatThread: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    chatMessage: { findMany: vi.fn(), create: vi.fn() },
    chatReadReceipt: { upsert: vi.fn(), findFirst: vi.fn() },
    chatNotification: { findMany: vi.fn(), updateMany: vi.fn() },
  },
}));

describe("chat service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ensureMembership", () => {
    it("throws if no membership found", async () => {
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue(null);
      await expect(
        ensureMembership({ chatSpaceId: "s1", userId: "u1" })
      ).rejects.toThrow("NOT_MEMBER");
    });

    it("returns membership if found", async () => {
      const membership = { id: "m1", role: "STUDENT" };
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue(membership as any);
      const res = await ensureMembership({ chatSpaceId: "s1", userId: "u1" });
      expect(res).toEqual(membership);
    });
  });

  describe("listChatSpacesForUser", () => {
    it("returns spaces for tenant user", async () => {
      const spaces = [{ id: "s1", title: "Space 1" }];
      vi.mocked(prisma.chatSpace.findMany).mockResolvedValue(spaces as any);
      const res = await listChatSpacesForUser({ tenantId: "t1", userId: "u1" });
      expect(res).toEqual(spaces);
      expect(prisma.chatSpace.findMany).toHaveBeenCalledWith({
        where: { tenantId: "t1", memberships: { some: { userId: "u1" } } },
        include: { memberships: { where: { userId: "u1" }, select: { role: true } } },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("ensureChatSpace", () => {
    it("creates space if not exists", async () => {
      vi.mocked(prisma.chatSpace.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.chatSpace.create).mockResolvedValue({ id: "s1" } as any);
      const res = await ensureChatSpace({
        tenantId: "t1",
        slug: "general",
        title: "General",
      });
      expect(res).toEqual({ id: "s1" });
      expect(prisma.chatSpace.create).toHaveBeenCalledWith({
        data: { tenantId: "t1", slug: "general", title: "General" },
      });
    });

    it("returns existing space", async () => {
      const space = { id: "s1" };
      vi.mocked(prisma.chatSpace.findUnique).mockResolvedValue(space as any);
      const res = await ensureChatSpace({
        tenantId: "t1",
        slug: "general",
        title: "General",
      });
      expect(res).toEqual(space);
      expect(prisma.chatSpace.create).not.toHaveBeenCalled();
    });
  });

  describe("upsertChatMembership", () => {
    it("upserts membership", async () => {
      vi.mocked(prisma.chatMembership.upsert).mockResolvedValue({ id: "m1" } as any);
      const res = await upsertChatMembership({
        chatSpaceId: "s1",
        userId: "u1",
        role: "STUDENT",
      });
      expect(res).toEqual({ id: "m1" });
      expect(prisma.chatMembership.upsert).toHaveBeenCalledWith({
        where: { chatSpaceId_userId: { chatSpaceId: "s1", userId: "u1" } },
        update: { role: "STUDENT" },
        create: { chatSpaceId: "s1", userId: "u1", role: "STUDENT" },
      });
    });
  });

  describe("listChatThreads", () => {
    it("returns threads for space", async () => {
      const threads = [{ id: "th1", title: "Thread 1" }];
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue({ role: "STUDENT" } as any);
      vi.mocked(prisma.chatThread.findMany).mockResolvedValue(threads as any);
      const res = await listChatThreads({ chatSpaceId: "s1", userId: "u1" });
      expect(res).toEqual(threads);
    });

    it("throws if not member", async () => {
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue(null);
      await expect(
        listChatThreads({ chatSpaceId: "s1", userId: "u1" })
      ).rejects.toThrow("NOT_MEMBER");
    });
  });

  describe("createChatThread", () => {
    it("creates thread if member", async () => {
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue({ role: "TUTOR" } as any);
      vi.mocked(prisma.chatThread.create).mockResolvedValue({ id: "th1" } as any);
      const res = await createChatThread({
        chatSpaceId: "s1",
        title: "New Thread",
        createdById: "u1",
      });
      expect(res).toEqual({ id: "th1" });
    });

    it("throws if not member", async () => {
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue(null);
      await expect(
        createChatThread({ chatSpaceId: "s1", title: "New Thread", createdById: "u1" })
      ).rejects.toThrow("NOT_MEMBER");
    });
  });

  describe("listThreadMessages", () => {
    it("returns messages for thread", async () => {
      const messages = [{ id: "m1", content: "Hi" }];
      vi.mocked(prisma.chatThread.findUnique).mockResolvedValue({ chatSpaceId: "s1" } as any);
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue({ role: "STUDENT" } as any);
      vi.mocked(prisma.chatMessage.findMany).mockResolvedValue(messages as any);
      const res = await listThreadMessages({ threadId: "th1", userId: "u1" });
      expect(res).toEqual(messages);
    });

    it("throws if thread not found", async () => {
      vi.mocked(prisma.chatThread.findUnique).mockResolvedValue(null);
      await expect(
        listThreadMessages({ threadId: "th1", userId: "u1" })
      ).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("sendChatMessage", () => {
    it("sends message if member", async () => {
      vi.mocked(prisma.chatThread.findUnique).mockResolvedValue({ chatSpaceId: "s1" } as any);
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue({ role: "STUDENT" } as any);
      vi.mocked(prisma.chatMessage.create).mockResolvedValue({ id: "m1" } as any);
      const res = await sendChatMessage({
        threadId: "th1",
        content: "Hello",
        authorId: "u1",
      });
      expect(res).toEqual({ id: "m1" });
    });

    it("throws if not member", async () => {
      vi.mocked(prisma.chatThread.findUnique).mockResolvedValue({ chatSpaceId: "s1" } as any);
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue(null);
      await expect(
        sendChatMessage({ threadId: "th1", content: "Hello", authorId: "u1" })
      ).rejects.toThrow("NOT_MEMBER");
    });
  });

  describe("markThreadRead", () => {
    it("upserts read receipt", async () => {
      vi.mocked(prisma.chatThread.findUnique).mockResolvedValue({ chatSpaceId: "s1" } as any);
      vi.mocked(prisma.chatMembership.findFirst).mockResolvedValue({ role: "STUDENT" } as any);
      vi.mocked(prisma.chatReadReceipt.upsert).mockResolvedValue({ id: "r1" } as any);
      await markThreadRead({ threadId: "th1", userId: "u1" });
      expect(prisma.chatReadReceipt.upsert).toHaveBeenCalled();
    });
  });

  describe("listChatNotifications", () => {
    it("returns notifications for user", async () => {
      const notifications = [{ id: "n1" }];
      vi.mocked(prisma.chatNotification.findMany).mockResolvedValue(notifications as any);
      const res = await listChatNotifications({ userId: "u1" });
      expect(res).toEqual(notifications);
    });
  });

  describe("markChatNotificationsSeen", () => {
    it("marks notifications seen", async () => {
      vi.mocked(prisma.chatNotification.updateMany).mockResolvedValue({ count: 2 } as any);
      const res = await markChatNotificationsSeen("u1", ["n1", "n2"]);
      expect(res).toEqual({ count: 2 });
      expect(prisma.chatNotification.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1", "n2"] }, userId: "u1" },
        data: { seenAt: expect.any(Date) },
      });
    });
  });
});
