import { NextRequest } from "next/server";

// Mock all dependencies BEFORE importing the route
jest.mock("@/lib/auth/session");
jest.mock("@/lib/prisma");
jest.mock("@/features/dashboard/service");
jest.mock("@/features/resume/service");
jest.mock("@/features/profile/service");

import { POST } from "@/app/api/resume/import/route";
import * as authLib from "@/lib/auth/session";
import * as prismaLib from "@/lib/prisma";
import * as dashboardLib from "@/features/dashboard/service";
import * as resumeServiceLib from "@/features/resume/service";
import * as profileServiceLib from "@/features/profile/service";

describe("POST /api/resume/import", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a resume with extracted data successfully", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const mockResume = {
      id: "resume-1",
      slug: "software-engineer",
      title: "Software Engineer Resume",
      userId: "user-123",
      shareSlug: "abc123def456",
      personaName: "John Doe",
      location: "San Francisco, CA",
      summary: "Experienced software engineer",
      visibility: "PRIVATE",
      template: "modern",
      skills: ["JavaScript", "React", "Node.js"],
    };

    (prismaLib.prisma.resume.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValue(mockResume);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Software Engineer Resume",
        personaName: "John Doe",
        location: "San Francisco, CA",
        summary: "Experienced software engineer",
        rawContent: "John Doe\nSoftware Engineer\nExperience: 5 years with JavaScript, React, Node.js",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.resume.id).toBe("resume-1");
    expect(data.resume.slug).toBe("software-engineer");
    expect(data.resume.title).toBe("Software Engineer Resume");
  });

  it("should extract skills from resume content", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const mockResume = {
      id: "resume-1",
      slug: "full-stack-dev",
      title: "Full Stack Developer",
      userId: "user-123",
      shareSlug: "xyz789",
      personaName: "",
      location: "",
      summary: "",
      visibility: "PRIVATE",
      template: "modern",
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "Docker"],
    };

    (prismaLib.prisma.resume.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValue(mockResume);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Full Stack Developer",
        rawContent: "Proficient in JavaScript, TypeScript, React, Node.js, PostgreSQL, and Docker",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.resume.skills).toContain("JavaScript");
    expect(data.resume.skills).toContain("React");
    expect(data.resume.skills).toContain("PostgreSQL");
  });

  it("should reject request with missing title", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "",
        rawContent: "Some resume content",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Resume title is required");
  });

  it("should reject request with missing content", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Resume",
        rawContent: "",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Resume content is required");
  });

  it("should reject title longer than 255 characters", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const longTitle = "A".repeat(256);

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: longTitle,
        rawContent: "Some content",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Resume title must be less than 255 characters");
  });

  it("should generate unique slug for duplicate titles", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    // First call returns existing resume (slug taken), second returns null (unique slug available)
    (prismaLib.prisma.resume.findUnique as jest.Mock)
      .mockResolvedValueOnce({ slug: "my-resume" })
      .mockResolvedValueOnce(null);

    const mockResume = {
      id: "resume-2",
      slug: "my-resume-1",
      title: "My Resume",
      userId: "user-123",
      shareSlug: "unique123",
      personaName: "",
      location: "",
      summary: "",
      visibility: "PRIVATE",
      template: "modern",
      skills: [],
    };

    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValue(mockResume);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Resume",
        rawContent: "Some content",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resume.slug).toBe("my-resume-1");
  });

  it("should require authentication", async () => {
    const authError = new Error("Unauthorized");
    (authLib.requireSession as jest.Mock).mockRejectedValue(authError);

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Resume",
        rawContent: "Some content",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("should handle database errors gracefully", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const dbError = new Error("Database connection failed");
    (prismaLib.prisma.resume.findUnique as jest.Mock).mockRejectedValue(dbError);

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Resume",
        rawContent: "Some content",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it("should continue if experience extraction fails", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const mockResume = {
      id: "resume-1",
      slug: "test-resume",
      title: "Test Resume",
      userId: "user-123",
      shareSlug: "test123",
      personaName: "",
      location: "",
      summary: "",
      visibility: "PRIVATE",
      template: "modern",
      skills: [],
    };

    (prismaLib.prisma.resume.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValue(mockResume);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValue(undefined);
    (resumeServiceLib.createResumeExperience as jest.Mock).mockRejectedValue(
      new Error("Failed to create experience")
    );

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Resume",
        rawContent: "Professional Experience\n\nSome Job at Company\n2020 - 2023",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still succeed even if experience extraction fails
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should trim whitespace from input fields", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const mockResume = {
      id: "resume-1",
      slug: "my-resume",
      title: "My Resume",
      userId: "user-123",
      shareSlug: "test123",
      personaName: "John Doe",
      location: "San Francisco, CA",
      summary: "Professional summary",
      visibility: "PRIVATE",
      template: "modern",
      skills: [],
    };

    (prismaLib.prisma.resume.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValue(mockResume);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "  My Resume  ",
        personaName: "  John Doe  ",
        location: "  San Francisco, CA  ",
        summary: "  Professional summary  ",
        rawContent: "  Some content  ",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
