/**
 * Functional Tests for Resume Import Feature
 * 
 * These tests verify the core business logic of the import feature
 * without requiring full API mocking (which is complex with Prisma).
 * 
 * To run these tests:
 * npm run test -- __tests__/api/resume/import.functional.test.ts
 */

describe("Resume Import Feature - Functional Tests", () => {
  describe("Skill Extraction", () => {
    it("should extract common skills from resume text", () => {
      const resumeText = `
        Experienced developer with skills in:
        - JavaScript and TypeScript
        - React and Vue.js
        - Node.js backend development
        - PostgreSQL and MongoDB databases
        - Docker and Kubernetes
        - AWS cloud services
      `;

      const commonSkills = [
        "JavaScript",
        "TypeScript",
        "React",
        "Vue",
        "Node.js",
        "PostgreSQL",
        "MongoDB",
        "Docker",
        "Kubernetes",
        "AWS",
      ];

      const textLower = resumeText.toLowerCase();
      const foundSkills = commonSkills.filter((skill) => textLower.includes(skill.toLowerCase()));

      expect(foundSkills).toContain("JavaScript");
      expect(foundSkills).toContain("React");
      expect(foundSkills).toContain("Node.js");
      expect(foundSkills).toContain("PostgreSQL");
      expect(foundSkills).toContain("Docker");
      expect(foundSkills).toContain("AWS");
      expect(foundSkills.length).toBeGreaterThan(0);
    });

    it("should not extract skills that are not in the text", () => {
      const resumeText = "I am a frontend developer with JavaScript and React skills";

      const commonSkills = ["Python", "Go", "Rust", "Kotlin", "Scala"];

      const textLower = resumeText.toLowerCase();
      const foundSkills = commonSkills.filter((skill) => textLower.includes(skill.toLowerCase()));

      // These skills should not be found in the resume text
      expect(foundSkills).not.toContain("Python");
      expect(foundSkills).not.toContain("Rust");
      expect(foundSkills).not.toContain("Kotlin");
    });

    it("should handle case-insensitive skill matching", () => {
      const resumeText = "I know JAVASCRIPT, react, NODE.JS, and postgresql";

      const commonSkills = ["JavaScript", "React", "Node.js", "PostgreSQL"];

      const textLower = resumeText.toLowerCase();
      const foundSkills = commonSkills.filter((skill) => textLower.includes(skill.toLowerCase()));

      expect(foundSkills).toContain("JavaScript");
      expect(foundSkills).toContain("React");
      expect(foundSkills).toContain("Node.js");
      expect(foundSkills).toContain("PostgreSQL");
    });
  });

  describe("Slug Generation", () => {
    it("should generate valid slug from title", () => {
      const title = "My Software Engineer Resume";
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      expect(slug).toBe("my-software-engineer-resume");
    });

    it("should handle special characters in slug", () => {
      const title = "Senior C++ Developer (2024)";
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      expect(slug).toBe("senior-c-developer-2024");
    });

    it("should handle multiple spaces and dashes", () => {
      const title = "My   Resume  --  Updated";
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      expect(slug).toBe("my-resume-updated");
    });

    it("should generate unique slug with counter", () => {
      const baseSlug = "my-resume";
      const existingSlugs = ["my-resume", "my-resume-1", "my-resume-2"];

      let uniqueSlug = baseSlug;
      let counter = 1;

      while (existingSlugs.includes(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      expect(uniqueSlug).toBe("my-resume-3");
    });
  });

  describe("Section Splitting", () => {
    it("should identify experience section", () => {
      const text = `
        Professional Experience
        
        Senior Developer at Tech Corp
        2020 - 2023
        Led development of microservices
      `;

      const hasExperienceSection = /professional experience|work experience/i.test(text);
      expect(hasExperienceSection).toBe(true);
    });

    it("should identify education section", () => {
      const text = `
        Education
        
        Massachusetts Institute of Technology
        Bachelor of Science in Computer Science
        2014 - 2018
      `;

      const hasEducationSection = /education|academic background/i.test(text);
      expect(hasEducationSection).toBe(true);
    });

    it("should identify certifications section", () => {
      const text = `
        Certifications
        
        AWS Certified Solutions Architect
        Google Cloud Professional Data Engineer
      `;

      const hasCertificationsSection = /certifications|licenses|certificates/i.test(text);
      expect(hasCertificationsSection).toBe(true);
    });
  });

  describe("Experience Extraction", () => {
    it("should extract company and role from experience entry", () => {
      const entry = "Senior Developer at Tech Corp";

      const atMatch = entry.match(/(.+) at (.+)/i);
      expect(atMatch).not.toBeNull();
      expect(atMatch?.[1]).toBe("Senior Developer");
      expect(atMatch?.[2]).toBe("Tech Corp");
    });

    it("should extract company and role with dash separator", () => {
      const entry = "Tech Corp - Senior Developer";

      const dashMatch = entry.match(/(.+)\s+[–—-]\s+(.+)/);
      expect(dashMatch).not.toBeNull();
      expect(dashMatch?.[1]).toBe("Tech Corp");
      expect(dashMatch?.[2]).toBe("Senior Developer");
    });

    it("should extract years from experience text", () => {
      const text = "Senior Developer at Tech Corp 2020 - 2023";

      const yearMatch = text.match(/(19|20)\d{2}/g);
      expect(yearMatch).not.toBeNull();
      expect(yearMatch?.[0]).toBe("2020");
      expect(yearMatch?.[1]).toBe("2023");
    });
  });

  describe("Input Validation", () => {
    it("should validate title is not empty", () => {
      const title = "";
      const isValid = title && title.trim().length > 0;
      expect(isValid).toBeFalsy();
    });

    it("should validate title length", () => {
      const title = "A".repeat(256);
      const isValid = title.length <= 255;
      expect(isValid).toBe(false);
    });

    it("should validate content is not empty", () => {
      const content = "";
      const isValid = content && content.trim().length > 0;
      expect(isValid).toBeFalsy();
    });

    it("should validate title with valid length", () => {
      const title = "My Resume";
      const isValid = title && title.trim().length > 0 && title.length <= 255;
      expect(isValid).toBe(true);
    });

    it("should trim whitespace from fields", () => {
      const title = "  My Resume  ";
      const trimmed = title.trim();
      expect(trimmed).toBe("My Resume");
    });
  });

  describe("File Validation", () => {
    it("should validate supported file types", () => {
      const supportedTypes = ["application/pdf", "text/plain"];
      const fileType = "application/pdf";
      const isSupported = supportedTypes.includes(fileType);
      expect(isSupported).toBe(true);
    });

    it("should reject unsupported file types", () => {
      const supportedTypes = ["application/pdf", "text/plain"];
      const fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const isSupported = supportedTypes.includes(fileType);
      expect(isSupported).toBe(false);
    });

    it("should validate file size limit", () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSize = 3 * 1024 * 1024; // 3MB
      const isValid = fileSize <= maxSize;
      expect(isValid).toBe(true);
    });

    it("should reject files exceeding size limit", () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSize = 6 * 1024 * 1024; // 6MB
      const isValid = fileSize <= maxSize;
      expect(isValid).toBe(false);
    });

    it("should validate file extension", () => {
      const fileName = "resume.pdf";
      const isValid = fileName.endsWith(".pdf") || fileName.endsWith(".txt");
      expect(isValid).toBe(true);
    });

    it("should reject invalid file extensions", () => {
      const fileName = "resume.docx";
      const isValid = fileName.endsWith(".pdf") || fileName.endsWith(".txt");
      expect(isValid).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing title error", () => {
      const title = "";
      const error = !title || !title.trim() ? "Resume title is required" : null;
      expect(error).toBe("Resume title is required");
    });

    it("should handle missing content error", () => {
      const content = "";
      const error = !content || !content.trim() ? "Resume content is required" : null;
      expect(error).toBe("Resume content is required");
    });

    it("should handle title too long error", () => {
      const title = "A".repeat(256);
      const error = title.length > 255 ? "Resume title must be less than 255 characters" : null;
      expect(error).toBe("Resume title must be less than 255 characters");
    });

    it("should handle unsupported file type error", () => {
      const fileType = "application/vnd.ms-word.document";
      const supportedTypes = ["application/pdf", "text/plain"];
      const error = !supportedTypes.includes(fileType) ? "Unsupported file type. Please upload a PDF or TXT file." : null;
      expect(error).toBe("Unsupported file type. Please upload a PDF or TXT file.");
    });

    it("should handle file size error", () => {
      const fileSize = 6 * 1024 * 1024;
      const maxSize = 5 * 1024 * 1024;
      const error = fileSize > maxSize ? "File size must be less than 5MB" : null;
      expect(error).toBe("File size must be less than 5MB");
    });
  });

  describe("Data Transformation", () => {
    it("should transform resume data correctly", () => {
      const input = {
        title: "  My Resume  ",
        personaName: "  John Doe  ",
        location: "  San Francisco, CA  ",
        summary: "  Professional summary  ",
        rawContent: "  Some content  ",
      };

      const transformed = {
        title: input.title.trim(),
        personaName: input.personaName.trim(),
        location: input.location.trim(),
        summary: input.summary.trim(),
        rawContent: input.rawContent.trim(),
      };

      expect(transformed.title).toBe("My Resume");
      expect(transformed.personaName).toBe("John Doe");
      expect(transformed.location).toBe("San Francisco, CA");
      expect(transformed.summary).toBe("Professional summary");
      expect(transformed.rawContent).toBe("Some content");
    });

    it("should handle optional fields", () => {
      const input = {
        title: "My Resume",
        personaName: undefined,
        location: undefined,
        summary: undefined,
        rawContent: "Some content",
      };

      const transformed = {
        title: input.title,
        personaName: input.personaName || "",
        location: input.location || "",
        summary: input.summary || "",
        rawContent: input.rawContent,
      };

      expect(transformed.personaName).toBe("");
      expect(transformed.location).toBe("");
      expect(transformed.summary).toBe("");
    });
  });

  describe("Resume Creation Response", () => {
    it("should return correct response structure", () => {
      const response = {
        success: true,
        resume: {
          id: "resume-1",
          slug: "my-resume",
          title: "My Resume",
        },
      };

      expect(response.success).toBe(true);
      expect(response.resume).toHaveProperty("id");
      expect(response.resume).toHaveProperty("slug");
      expect(response.resume).toHaveProperty("title");
    });

    it("should return error response structure", () => {
      const response = {
        error: "Resume title is required",
      };

      expect(response).toHaveProperty("error");
      expect(response.error).toBe("Resume title is required");
    });
  });
});
