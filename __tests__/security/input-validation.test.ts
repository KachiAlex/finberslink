/**
 * Tests for Input Validation and Sanitization
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  validateEmail,
  validateUrl,
  validatePhoneNumber,
  validateDate,
  validateResumeId,
  validateTemplate,
  validateEventType,
  validateDateRange,
  validatePagination,
  validateApiKey,
  validateResumeData,
  validateSuggestionData,
  validateAnalyticsEventData,
} from "@/lib/security/input-validation";

describe("Input Validation and Sanitization", () => {
  describe("sanitizeText", () => {
    it("should remove angle brackets", () => {
      const input = "Hello <script>alert('xss')</script> World";
      const result = sanitizeText(input);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("should trim whitespace", () => {
      const input = "  Hello World  ";
      const result = sanitizeText(input);
      expect(result).toBe("Hello World");
    });

    it("should limit length to 10000 characters", () => {
      const input = "a".repeat(20000);
      const result = sanitizeText(input);
      expect(result.length).toBeLessThanOrEqual(10000);
    });

    it("should handle non-string input", () => {
      const result = sanitizeText(null as any);
      expect(result).toBe("");
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email format", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("test.user@example.co.uk")).toBe(true);
    });

    it("should reject invalid email format", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("should validate correct URL format", () => {
      expect(validateUrl("https://example.com")).toBe(true);
      expect(validateUrl("http://example.com/path")).toBe(true);
    });

    it("should reject invalid URL format", () => {
      expect(validateUrl("not a url")).toBe(false);
      expect(validateUrl("example.com")).toBe(false);
    });
  });

  describe("validatePhoneNumber", () => {
    it("should validate correct phone number format", () => {
      expect(validatePhoneNumber("123-456-7890")).toBe(true);
      expect(validatePhoneNumber("+1 (123) 456-7890")).toBe(true);
      expect(validatePhoneNumber("1234567890")).toBe(true);
    });

    it("should reject invalid phone number format", () => {
      expect(validatePhoneNumber("123")).toBe(false);
      expect(validatePhoneNumber("abc-def-ghij")).toBe(false);
    });
  });

  describe("validateDate", () => {
    it("should validate correct ISO 8601 date format", () => {
      expect(validateDate("2024-01-15")).toBe(true);
      expect(validateDate("2024-12-31")).toBe(true);
    });

    it("should reject invalid date format", () => {
      expect(validateDate("01/15/2024")).toBe(false);
      expect(validateDate("2024-13-01")).toBe(false);
      expect(validateDate("not-a-date")).toBe(false);
    });
  });

  describe("validateResumeId", () => {
    it("should validate correct resume ID format", () => {
      expect(validateResumeId("resume-123")).toBe(true);
      expect(validateResumeId("abc123def456")).toBe(true);
      expect(validateResumeId("resume_123")).toBe(true);
    });

    it("should reject invalid resume ID format", () => {
      expect(validateResumeId("")).toBe(false);
      expect(validateResumeId("resume@123")).toBe(false);
      expect(validateResumeId("a".repeat(256))).toBe(false);
    });
  });

  describe("validateTemplate", () => {
    it("should validate correct template names", () => {
      expect(validateTemplate("Modern")).toBe(true);
      expect(validateTemplate("Classic")).toBe(true);
      expect(validateTemplate("Minimal")).toBe(true);
    });

    it("should reject invalid template names", () => {
      expect(validateTemplate("Invalid")).toBe(false);
      expect(validateTemplate("modern")).toBe(false);
    });
  });

  describe("validateEventType", () => {
    it("should validate correct event types", () => {
      expect(validateEventType("view")).toBe(true);
      expect(validateEventType("download")).toBe(true);
      expect(validateEventType("share")).toBe(true);
      expect(validateEventType("export")).toBe(true);
    });

    it("should reject invalid event types", () => {
      expect(validateEventType("invalid")).toBe(false);
      expect(validateEventType("VIEW")).toBe(false);
    });
  });

  describe("validateDateRange", () => {
    it("should validate correct date ranges", () => {
      expect(validateDateRange("2024-01-01", "2024-12-31")).toBe(true);
      expect(validateDateRange("2024-01-01", "2024-01-01")).toBe(true);
    });

    it("should reject invalid date ranges", () => {
      expect(validateDateRange("2024-12-31", "2024-01-01")).toBe(false);
      expect(validateDateRange("invalid", "2024-01-01")).toBe(false);
    });
  });

  describe("validatePagination", () => {
    it("should validate and normalize pagination parameters", () => {
      const result = validatePagination(50, 10);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(10);
    });

    it("should enforce maximum limit", () => {
      const result = validatePagination(1000, 0);
      expect(result.limit).toBe(100);
    });

    it("should enforce minimum limit", () => {
      const result = validatePagination(0, 0);
      expect(result.limit).toBe(1);
    });

    it("should enforce non-negative offset", () => {
      const result = validatePagination(10, -5);
      expect(result.offset).toBe(0);
    });
  });

  describe("validateApiKey", () => {
    it("should validate correct API key format", () => {
      const validKey = "a".repeat(32);
      expect(validateApiKey(validKey)).toBe(true);
    });

    it("should reject invalid API key format", () => {
      expect(validateApiKey("short")).toBe(false);
      expect(validateApiKey("invalid@key")).toBe(false);
    });
  });

  describe("validateResumeData", () => {
    it("should validate complete resume data", () => {
      const data = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        summary: "Professional summary",
        experiences: [],
        education: [],
        projects: [],
        skills: [],
      };

      const result = validateResumeData(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject resume data with missing required fields", () => {
      const data = {
        firstName: "John",
        email: "john@example.com",
      };

      const result = validateResumeData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject resume data with invalid email", () => {
      const data = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
      };

      const result = validateResumeData(data);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateSuggestionData", () => {
    it("should validate complete suggestion data", () => {
      const data = {
        originalText: "Original text",
        suggestedText: "Suggested text",
        category: "summary",
      };

      const result = validateSuggestionData(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject suggestion data with invalid category", () => {
      const data = {
        originalText: "Original text",
        suggestedText: "Suggested text",
        category: "invalid",
      };

      const result = validateSuggestionData(data);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateAnalyticsEventData", () => {
    it("should validate complete analytics event data", () => {
      const data = {
        resumeId: "resume-123",
        eventType: "view",
      };

      const result = validateAnalyticsEventData(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject analytics event data with invalid event type", () => {
      const data = {
        resumeId: "resume-123",
        eventType: "invalid",
      };

      const result = validateAnalyticsEventData(data);
      expect(result.valid).toBe(false);
    });
  });
});
