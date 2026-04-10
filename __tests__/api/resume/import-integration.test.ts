import { NextRequest } from "next/server";

// Mock all dependencies BEFORE importing routes
jest.mock("@/lib/auth/session");
jest.mock("@/lib/prisma");
jest.mock("@/features/dashboard/service");
jest.mock("@/features/resume/service");
jest.mock("@/lib/resume/parser");

import { POST as parsePost } from "@/app/api/resume/parse/route";
import { POST as importPost } from "@/app/api/resume/import/route";
import * as authLib from "@/lib/auth/session";
import * as prismaLib from "@/lib/prisma";
import * as dashboardLib from "@/features/dashboard/service";
import * as resumeServiceLib from "@/features/resume/service";
import * as parserLib from "@/lib/resume/parser";

describe("Resume Import Integration Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should complete full flow: parse -> extract -> create resume", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const resumeText = `
John Doe
Senior Software Engineer

Professional Experience

Senior Developer at Tech Corp
2020 - 2023
Led development of microservices
Managed team of 5 engineers

Education

Massachusetts Institute of Technology
Bachelor of Science in Computer Science
2014 - 2018

Skills: JavaScript, React, Node.js, PostgreSQL
`;

    (parserLib.parseResumeFile as jest.Mock).mockResolvedValue(resumeText);

    const file = new File([resumeText], "resume.txt", { type: "text/plain" });
    const parseFormData = new FormData();
    parseFormData.append("file", file);

    const parseRequest = new NextRequest("http://localhost:3000/api/resume/parse", {
      method: "POST",
      body: parseFormData,
    });

    const parseResponse = await parsePost(parseRequest);
    const parseData = await parseResponse.json();

    expect(parseResponse.status).toBe(200);
    expect(parseData.success).toBe(true);
    expect(parseData.text).toContain("John Doe");

    // Step 2: Create resume with extracted data
    const mockResume = {
      id: "resume-1",
      slug: "senior-software-engineer",
      title: "Senior Software Engineer",
      userId: "user-123",
      shareSlug: "abc123def456",
      personaName: "John Doe",
      location: "",
      summary: resumeText.substring(0, 500),
      visibility: "PRIVATE",
      template: "modern",
      skills: ["JavaScript", "React", "Node.js", "PostgreSQL"],
    };

    (prismaLib.prisma.resume.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValue(mockResume);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValue(undefined);
    (resumeServiceLib.createResumeExperience as jest.Mock).mockResolvedValue(undefined);
    (resumeServiceLib.createResumeEducation as jest.Mock).mockResolvedValue(undefined);

    const importRequest = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Senior Software Engineer",
        personaName: "John Doe",
        rawContent: parseData.text,
      }),
    });

    const importResponse = await importPost(importRequest);
    const importData = await importResponse.json();

    expect(importResponse.status).toBe(200);
    expect(importData.success).toBe(true);
    expect(importData.resume.id).toBe("resume-1");
    expect(importData.resume.title).toBe("Senior Software Engineer");
  });

  it("should handle PDF file parsing and import", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const pdfText = "Jane Smith\nProduct Manager\nExperience: 8 years";
    (parserLib.parseResumeFile as jest.Mock).mockResolvedValue(pdfText);

    const file = new File(["pdf content"], "resume.pdf", { type: "application/pdf" });
    const parseFormData = new FormData();
    parseFormData.append("file", file);

    const parseRequest = new NextRequest("http://localhost:3000/api/resume/parse", {
      method: "POST",
      body: parseFormData,
    });

    const parseResponse = await parsePost(parseRequest);
    const parseData = await parseResponse.json();

    expect(parseResponse.status).toBe(200);
    expect(parseData.text).toBe(pdfText);

    // Now import the parsed content
    const mockResume = {
      id: "resume-2",
      slug: "product-manager",
      title: "Product Manager Resume",
      userId: "user-123",
      shareSlug: "xyz789",
      personaName: "Jane Smith",
      location: "",
      summary: pdfText,
      visibility: "PRIVATE",
      template: "modern",
      skills: [],
    };

    (prismaLib.prisma.resume.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValue(mockResume);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValue(undefined);

    const importRequest = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Product Manager Resume",
        personaName: "Jane Smith",
        rawContent: parseData.text,
      }),
    });

    const importResponse = await importPost(importRequest);
    const importData = await importResponse.json();

    expect(importResponse.status).toBe(200);
    expect(importData.success).toBe(true);
  });

  it("should handle multiple resumes with same title by generating unique slugs", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    // First resume
    (prismaLib.prisma.resume.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const mockResume1 = {
      id: "resume-1",
      slug: "my-resume",
      title: "My Resume",
      userId: "user-123",
      shareSlug: "slug1",
      personaName: "",
      location: "",
      summary: "",
      visibility: "PRIVATE",
      template: "modern",
      skills: [],
    };

    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValueOnce(mockResume1);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValueOnce(undefined);

    const importRequest1 = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Resume",
        rawContent: "First resume content",
      }),
    });

    const importResponse1 = await importPost(importRequest1);
    const importData1 = await importResponse1.json();

    expect(importResponse1.status).toBe(200);
    expect(importData1.resume.slug).toBe("my-resume");

    // Second resume with same title
    (prismaLib.prisma.resume.findUnique as jest.Mock)
      .mockResolvedValueOnce({ slug: "my-resume" })
      .mockResolvedValueOnce(null);

    const mockResume2 = {
      id: "resume-2",
      slug: "my-resume-1",
      title: "My Resume",
      userId: "user-123",
      shareSlug: "slug2",
      personaName: "",
      location: "",
      summary: "",
      visibility: "PRIVATE",
      template: "modern",
      skills: [],
    };

    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValueOnce(mockResume2);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValueOnce(undefined);

    const importRequest2 = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Resume",
        rawContent: "Second resume content",
      }),
    });

    const importResponse2 = await importPost(importRequest2);
    const importData2 = await importResponse2.json();

    expect(importResponse2.status).toBe(200);
    expect(importData2.resume.slug).toBe("my-resume-1");
  });

  it("should extract all sections from complex resume", async () => {
    const mockSession = { sub: "user-123" };
    (authLib.requireSession as jest.Mock).mockResolvedValue(mockSession);

    const complexResume = `
JOHN SMITH
john@example.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced full-stack developer with 10+ years in web development

PROFESSIONAL EXPERIENCE

Senior Software Engineer at TechCorp
2021 - Present
- Led development of microservices architecture
- Managed team of 8 engineers
- Improved system performance by 50%

Software Engineer at StartupXYZ
2018 - 2021
- Built REST APIs using Node.js
- Developed React components
- Implemented CI/CD pipelines

EDUCATION

Massachusetts Institute of Technology
Bachelor of Science in Computer Science
2014 - 2018

CERTIFICATIONS

AWS Certified Solutions Architect - Professional
Google Cloud Professional Data Engineer
Kubernetes Application Developer (CKAD)

SKILLS
JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, MongoDB, Docker, Kubernetes, AWS, GCP
`;

    const mockResume = {
      id: "resume-1",
      slug: "john-smith",
      title: "John Smith Resume",
      userId: "user-123",
      shareSlug: "complex123",
      personaName: "John Smith",
      location: "",
      summary: complexResume.substring(0, 500),
      visibility: "PRIVATE",
      template: "modern",
      skills: [
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "Python",
        "PostgreSQL",
        "MongoDB",
        "Docker",
        "Kubernetes",
        "AWS",
        "GCP",
      ],
    };

    (prismaLib.prisma.resume.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaLib.prisma.resume.create as jest.Mock).mockResolvedValue(mockResume);
    (dashboardLib.invalidateDashboardInsights as jest.Mock).mockResolvedValue(undefined);
    (resumeServiceLib.createResumeExperience as jest.Mock).mockResolvedValue(undefined);
    (resumeServiceLib.createResumeEducation as jest.Mock).mockResolvedValue(undefined);

    const importRequest = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "John Smith Resume",
        personaName: "John Smith",
        rawContent: complexResume,
      }),
    });

    const importResponse = await importPost(importRequest);
    const importData = await importResponse.json();

    expect(importResponse.status).toBe(200);
    expect(importData.success).toBe(true);
    expect(importData.resume.skills.length).toBeGreaterThan(0);
    expect(resumeServiceLib.createResumeExperience).toHaveBeenCalled();
    expect(resumeServiceLib.createResumeEducation).toHaveBeenCalled();
  });

  it("should require authentication for both parse and import", async () => {
    const authError = new Error("Unauthorized");
    (authLib.requireSession as jest.Mock).mockRejectedValue(authError);

    // Test parse endpoint
    const file = new File(["content"], "resume.txt", { type: "text/plain" });
    const parseFormData = new FormData();
    parseFormData.append("file", file);

    const parseRequest = new NextRequest("http://localhost:3000/api/resume/parse", {
      method: "POST",
      body: parseFormData,
    });

    const parseResponse = await parsePost(parseRequest);
    expect(parseResponse.status).toBe(500);

    // Test import endpoint
    (authLib.requireSession as jest.Mock).mockRejectedValue(authError);

    const importRequest = new NextRequest("http://localhost:3000/api/resume/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Resume",
        rawContent: "Some content",
      }),
    });

    const importResponse = await importPost(importRequest);
    expect(importResponse.status).toBe(500);
  });
});
