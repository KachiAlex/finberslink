/**
 * Input Validation and Sanitization Utilities
 * Validates and sanitizes all user input for security
 */

import { Logger } from "@/lib/logger";
import DOMPurify from "isomorphic-dompurify";

const logger = new Logger("InputValidation");

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  try {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [
        "b",
        "i",
        "em",
        "strong",
        "a",
        "p",
        "br",
        "ul",
        "ol",
        "li",
      ],
      ALLOWED_ATTR: ["href", "title"],
      KEEP_CONTENT: true,
    });
  } catch (error) {
    logger.error("Error sanitizing HTML", error);
    return "";
  }
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 10000); // Limit length
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

/**
 * Validate date format (ISO 8601)
 */
export function validateDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate resume ID format
 */
export function validateResumeId(id: string): boolean {
  // Assuming UUID or similar format
  return /^[a-zA-Z0-9\-_]+$/.test(id) && id.length > 0 && id.length <= 255;
}

/**
 * Validate template name
 */
export function validateTemplate(template: string): boolean {
  const validTemplates = ["Modern", "Classic", "Minimal"];
  return validTemplates.includes(template);
}

/**
 * Validate event type
 */
export function validateEventType(eventType: string): boolean {
  const validTypes = ["view", "download", "share", "export"];
  return validTypes.includes(eventType);
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): boolean {
  if (!validateDate(startDate) || !validateDate(endDate)) {
    return false;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  return start <= end;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  limit?: number,
  offset?: number
): { limit: number; offset: number } {
  const validLimit = Math.min(Math.max(limit || 10, 1), 100);
  const validOffset = Math.max(offset || 0, 0);

  return { limit: validLimit, offset: validOffset };
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // API keys should be alphanumeric and at least 32 characters
  return /^[a-zA-Z0-9]{32,}$/.test(apiKey);
}

/**
 * Sanitize metadata object
 */
export function sanitizeMetadata(
  metadata: Record<string, any>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Validate key
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      logger.warn(`Invalid metadata key: ${key}`);
      continue;
    }

    // Sanitize value based on type
    if (typeof value === "string") {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === "number") {
      sanitized[key] = value;
    } else if (typeof value === "boolean") {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value
        .filter((v) => typeof v === "string" || typeof v === "number")
        .map((v) => (typeof v === "string" ? sanitizeText(v) : v));
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize resume data
 */
export function validateResumeData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    errors.push("Resume data is required");
    return { valid: false, errors };
  }

  // Validate required fields
  if (!data.firstName || typeof data.firstName !== "string") {
    errors.push("First name is required and must be a string");
  }

  if (!data.lastName || typeof data.lastName !== "string") {
    errors.push("Last name is required and must be a string");
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push("Valid email is required");
  }

  // Validate optional fields
  if (data.phone && !validatePhoneNumber(data.phone)) {
    errors.push("Invalid phone number format");
  }

  if (data.summary && typeof data.summary !== "string") {
    errors.push("Summary must be a string");
  }

  // Validate arrays
  if (data.experiences && !Array.isArray(data.experiences)) {
    errors.push("Experiences must be an array");
  }

  if (data.education && !Array.isArray(data.education)) {
    errors.push("Education must be an array");
  }

  if (data.projects && !Array.isArray(data.projects)) {
    errors.push("Projects must be an array");
  }

  if (data.skills && !Array.isArray(data.skills)) {
    errors.push("Skills must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate suggestion data
 */
export function validateSuggestionData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    errors.push("Suggestion data is required");
    return { valid: false, errors };
  }

  if (!data.originalText || typeof data.originalText !== "string") {
    errors.push("Original text is required");
  }

  if (!data.suggestedText || typeof data.suggestedText !== "string") {
    errors.push("Suggested text is required");
  }

  if (!data.category || typeof data.category !== "string") {
    errors.push("Category is required");
  }

  const validCategories = ["summary", "achievement", "skill", "experience"];
  if (!validCategories.includes(data.category)) {
    errors.push(
      `Category must be one of: ${validCategories.join(", ")}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate analytics event data
 */
export function validateAnalyticsEventData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    errors.push("Event data is required");
    return { valid: false, errors };
  }

  if (!data.resumeId || !validateResumeId(data.resumeId)) {
    errors.push("Valid resume ID is required");
  }

  if (!data.eventType || !validateEventType(data.eventType)) {
    errors.push("Valid event type is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
