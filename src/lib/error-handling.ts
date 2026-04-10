/**
 * Error Handling and Logging for Resume Completion Feature
 * Task 68-70: Implement comprehensive error handling and logging
 */

import { NextResponse } from "next/server";

export enum ErrorCode {
  // PDF Generation Errors
  INVALID_RESUME_DATA = "INVALID_RESUME_DATA",
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  PDF_GENERATION_FAILED = "PDF_GENERATION_FAILED",
  FILE_SIZE_EXCEEDED = "FILE_SIZE_EXCEEDED",

  // Sharing Errors
  INVALID_EMAIL = "INVALID_EMAIL",
  TOO_MANY_RECIPIENTS = "TOO_MANY_RECIPIENTS",
  SHARE_LINK_EXPIRED = "SHARE_LINK_EXPIRED",
  SHARE_LINK_REVOKED = "SHARE_LINK_REVOKED",

  // Versioning Errors
  VERSION_NOT_FOUND = "VERSION_NOT_FOUND",
  RESUME_LOCKED = "RESUME_LOCKED",
  RESTORATION_FAILED = "RESTORATION_FAILED",

  // Analytics Errors
  INVALID_SHARE_TOKEN = "INVALID_SHARE_TOKEN",
  ANALYTICS_DATA_CORRUPTED = "ANALYTICS_DATA_CORRUPTED",

  // Notification Errors
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_SERVICE_UNAVAILABLE = "EMAIL_SERVICE_UNAVAILABLE",

  // General Errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export class ResumeCompletionError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ResumeCompletionError";
  }
}

/**
 * Error factory functions
 */
export const Errors = {
  invalidResumeData: (details?: any) =>
    new ResumeCompletionError(
      ErrorCode.INVALID_RESUME_DATA,
      400,
      "Invalid resume data provided",
      details
    ),

  templateNotFound: (template: string) =>
    new ResumeCompletionError(
      ErrorCode.TEMPLATE_NOT_FOUND,
      400,
      `Template not found: ${template}`
    ),

  pdfGenerationFailed: (reason: string) =>
    new ResumeCompletionError(
      ErrorCode.PDF_GENERATION_FAILED,
      500,
      `PDF generation failed: ${reason}`
    ),

  fileSizeExceeded: (size: number, limit: number) =>
    new ResumeCompletionError(
      ErrorCode.FILE_SIZE_EXCEEDED,
      413,
      `File size ${size} bytes exceeds limit of ${limit} bytes`
    ),

  invalidEmail: (email: string) =>
    new ResumeCompletionError(
      ErrorCode.INVALID_EMAIL,
      400,
      `Invalid email address: ${email}`
    ),

  tooManyRecipients: (count: number, limit: number) =>
    new ResumeCompletionError(
      ErrorCode.TOO_MANY_RECIPIENTS,
      400,
      `Too many recipients: ${count} (limit: ${limit})`
    ),

  shareLinkExpired: () =>
    new ResumeCompletionError(
      ErrorCode.SHARE_LINK_EXPIRED,
      403,
      "This resume link has expired"
    ),

  shareLinkRevoked: () =>
    new ResumeCompletionError(
      ErrorCode.SHARE_LINK_REVOKED,
      403,
      "This resume link has been revoked"
    ),

  versionNotFound: (versionId: string) =>
    new ResumeCompletionError(
      ErrorCode.VERSION_NOT_FOUND,
      404,
      `Version not found: ${versionId}`
    ),

  resumeLocked: () =>
    new ResumeCompletionError(
      ErrorCode.RESUME_LOCKED,
      409,
      "Resume is locked during restoration"
    ),

  restorationFailed: (reason: string) =>
    new ResumeCompletionError(
      ErrorCode.RESTORATION_FAILED,
      500,
      `Version restoration failed: ${reason}`
    ),

  invalidShareToken: () =>
    new ResumeCompletionError(
      ErrorCode.INVALID_SHARE_TOKEN,
      404,
      "Invalid share token"
    ),

  analyticsDataCorrupted: () =>
    new ResumeCompletionError(
      ErrorCode.ANALYTICS_DATA_CORRUPTED,
      500,
      "Analytics data is corrupted"
    ),

  userNotFound: (userId: string) =>
    new ResumeCompletionError(
      ErrorCode.USER_NOT_FOUND,
      404,
      `User not found: ${userId}`
    ),

  emailServiceUnavailable: () =>
    new ResumeCompletionError(
      ErrorCode.EMAIL_SERVICE_UNAVAILABLE,
      503,
      "Email service is temporarily unavailable"
    ),

  unauthorized: () =>
    new ResumeCompletionError(
      ErrorCode.UNAUTHORIZED,
      401,
      "Unauthorized access"
    ),

  forbidden: () =>
    new ResumeCompletionError(
      ErrorCode.FORBIDDEN,
      403,
      "Access forbidden"
    ),

  notFound: (resource: string) =>
    new ResumeCompletionError(
      ErrorCode.NOT_FOUND,
      404,
      `${resource} not found`
    ),

  internalServerError: (reason?: string) =>
    new ResumeCompletionError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      reason || "Internal server error"
    ),

  rateLimitExceeded: (retryAfter: number) =>
    new ResumeCompletionError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      "Rate limit exceeded",
      { retryAfter }
    ),
};

/**
 * Error logger
 */
export class ErrorLogger {
  static log(
    error: Error | ResumeCompletionError,
    context: {
      endpoint?: string;
      userId?: string;
      resumeId?: string;
      requestId?: string;
    }
  ): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    };

    if (error instanceof ResumeCompletionError) {
      errorInfo["code"] = error.code;
      errorInfo["statusCode"] = error.statusCode;
      errorInfo["details"] = error.details;
    }

    console.error("[ResumeCompletionError]", JSON.stringify(errorInfo));
  }

  static logWarning(
    message: string,
    context: {
      endpoint?: string;
      userId?: string;
      resumeId?: string;
    }
  ): void {
    const timestamp = new Date().toISOString();
    console.warn("[ResumeCompletionWarning]", {
      timestamp,
      message,
      ...context,
    });
  }

  static logInfo(
    message: string,
    context: {
      endpoint?: string;
      userId?: string;
      resumeId?: string;
    }
  ): void {
    const timestamp = new Date().toISOString();
    console.log("[ResumeCompletionInfo]", {
      timestamp,
      message,
      ...context,
    });
  }
}

/**
 * Convert error to HTTP response
 */
export function errorToResponse(
  error: Error | ResumeCompletionError,
  requestId?: string
): NextResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof ResumeCompletionError) {
    const response: ErrorResponse = {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp,
      requestId,
    };

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Generic error
  const response: ErrorResponse = {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: error.message || "Internal server error",
    statusCode: 500,
    timestamp,
    requestId,
  };

  return NextResponse.json(response, { status: 500 });
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate resume data
 */
export function validateResumeData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== "string") {
    errors.push("Resume title is required and must be a string");
  }

  if (!data.userId || typeof data.userId !== "string") {
    errors.push("User ID is required and must be a string");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate template
 */
export function validateTemplate(template: string): boolean {
  const validTemplates = ["Modern", "Classic", "Minimal", "ATS"];
  return validTemplates.includes(template);
}
