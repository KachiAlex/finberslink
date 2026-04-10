/**
 * Resume Completion Feature Error Handling
 * 
 * Comprehensive error types and handlers for all resume services
 */

/**
 * Base error class for resume operations
 */
export class ResumeError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ResumeError';
  }
}

/**
 * PDF Generation Errors
 */
export class PDFGenerationError extends ResumeError {
  constructor(message: string, details?: Record<string, any>) {
    super('PDF_GENERATION_ERROR', message, 500, details);
    this.name = 'PDFGenerationError';
  }
}

export class InvalidResumeDataError extends ResumeError {
  constructor(message: string, details?: Record<string, any>) {
    super('INVALID_RESUME_DATA', message, 400, details);
    this.name = 'InvalidResumeDataError';
  }
}

export class TemplateNotFoundError extends ResumeError {
  constructor(template: string) {
    super('TEMPLATE_NOT_FOUND', `Template not found: ${template}`, 400, { template });
    this.name = 'TemplateNotFoundError';
  }
}

export class FileSizeExceededError extends ResumeError {
  constructor(size: number, maxSize: number) {
    super('FILE_SIZE_EXCEEDED', `File size ${size} exceeds maximum ${maxSize}`, 413, { size, maxSize });
    this.name = 'FileSizeExceededError';
  }
}

export class PDFGenerationTimeoutError extends ResumeError {
  constructor() {
    super('PDF_GENERATION_TIMEOUT', 'PDF generation timed out', 504);
    this.name = 'PDFGenerationTimeoutError';
  }
}

/**
 * Sharing Errors
 */
export class SharingError extends ResumeError {
  constructor(message: string, details?: Record<string, any>) {
    super('SHARING_ERROR', message, 500, details);
    this.name = 'SharingError';
  }
}

export class InvalidEmailError extends ResumeError {
  constructor(email: string) {
    super('INVALID_EMAIL', `Invalid email address: ${email}`, 400, { email });
    this.name = 'InvalidEmailError';
  }
}

export class ShareLinkExpiredError extends ResumeError {
  constructor(expiresAt: Date) {
    super('SHARE_LINK_EXPIRED', 'This resume link has expired', 403, { expiresAt });
    this.name = 'ShareLinkExpiredError';
  }
}

export class ShareLinkRevokedError extends ResumeError {
  constructor() {
    super('SHARE_LINK_REVOKED', 'This resume link has been revoked', 403);
    this.name = 'ShareLinkRevokedError';
  }
}

export class TooManyRecipientsError extends ResumeError {
  constructor(count: number, maxCount: number = 50) {
    super('TOO_MANY_RECIPIENTS', `Too many recipients (${count}). Maximum is ${maxCount}`, 400, { count, maxCount });
    this.name = 'TooManyRecipientsError';
  }
}

export class EmailServiceUnavailableError extends ResumeError {
  constructor(provider: string) {
    super('EMAIL_SERVICE_UNAVAILABLE', `Email service unavailable: ${provider}`, 503, { provider });
    this.name = 'EmailServiceUnavailableError';
  }
}

/**
 * Versioning Errors
 */
export class VersioningError extends ResumeError {
  constructor(message: string, details?: Record<string, any>) {
    super('VERSIONING_ERROR', message, 500, details);
    this.name = 'VersioningError';
  }
}

export class VersionNotFoundError extends ResumeError {
  constructor(versionId: string) {
    super('VERSION_NOT_FOUND', `Version not found: ${versionId}`, 404, { versionId });
    this.name = 'VersionNotFoundError';
  }
}

export class ResumeLockError extends ResumeError {
  constructor() {
    super('RESUME_LOCKED', 'Resume is locked during restoration', 409);
    this.name = 'ResumeLockError';
  }
}

export class RestorationFailedError extends ResumeError {
  constructor(message: string, details?: Record<string, any>) {
    super('RESTORATION_FAILED', `Restoration failed: ${message}`, 500, details);
    this.name = 'RestorationFailedError';
  }
}

/**
 * Analytics Errors
 */
export class AnalyticsError extends ResumeError {
  constructor(message: string, details?: Record<string, any>) {
    super('ANALYTICS_ERROR', message, 500, details);
    this.name = 'AnalyticsError';
  }
}

export class InvalidShareTokenError extends ResumeError {
  constructor(token: string) {
    super('INVALID_SHARE_TOKEN', `Invalid share token: ${token}`, 404, { token });
    this.name = 'InvalidShareTokenError';
  }
}

export class AnalyticsDataCorruptedError extends ResumeError {
  constructor(details?: Record<string, any>) {
    super('ANALYTICS_DATA_CORRUPTED', 'Analytics data is corrupted', 500, details);
    this.name = 'AnalyticsDataCorruptedError';
  }
}

/**
 * Notification Errors
 */
export class NotificationError extends ResumeError {
  constructor(message: string, details?: Record<string, any>) {
    super('NOTIFICATION_ERROR', message, 500, details);
    this.name = 'NotificationError';
  }
}

export class UserNotFoundError extends ResumeError {
  constructor(userId: string) {
    super('USER_NOT_FOUND', `User not found: ${userId}`, 404, { userId });
    this.name = 'UserNotFoundError';
  }
}

/**
 * Generic Errors
 */
export class ResumeNotFoundError extends ResumeError {
  constructor(resumeId: string) {
    super('RESUME_NOT_FOUND', `Resume not found: ${resumeId}`, 404, { resumeId });
    this.name = 'ResumeNotFoundError';
  }
}

export class UnauthorizedError extends ResumeError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 403);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends ResumeError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Error handler utility
 */
export function handleResumeError(error: unknown): { statusCode: number; message: string; code: string; details?: Record<string, any> } {
  if (error instanceof ResumeError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      message: error.message,
      code: 'INTERNAL_SERVER_ERROR',
    };
  }

  return {
    statusCode: 500,
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Validate resume data
 */
export function validateResumeData(resume: any): void {
  if (!resume) {
    throw new InvalidResumeDataError('Resume data is required');
  }

  if (!resume.id) {
    throw new InvalidResumeDataError('Resume ID is required');
  }

  if (!resume.userId) {
    throw new InvalidResumeDataError('User ID is required');
  }
}

/**
 * Validate email address
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new InvalidEmailError(email);
  }
}

/**
 * Validate template
 */
export function validateTemplate(template: string): void {
  const validTemplates = ['modern', 'classic', 'minimal'];
  if (!validTemplates.includes(template)) {
    throw new TemplateNotFoundError(template);
  }
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number = 5 * 1024 * 1024): void {
  if (size > maxSize) {
    throw new FileSizeExceededError(size, maxSize);
  }
}

/**
 * Validate recipient count
 */
export function validateRecipientCount(count: number, maxCount: number = 50): void {
  if (count > maxCount) {
    throw new TooManyRecipientsError(count, maxCount);
  }
}
