/**
 * Security module barrel export
 */

export {
  createRateLimit,
  rateLimitPresets,
  clearRateLimits,
  getRateLimitStats,
  type RateLimitConfig,
} from "@/lib/security/rate-limit";

export {
  generateCsrfToken,
  createCsrfProtection,
  initializeCsrfToken,
  getCsrfTokenEndpoint,
  getCsrfStats,
  clearAllCsrfTokens,
  type CsrfProtectionConfig,
} from "@/lib/security/csrf";

export {
  verifyResumeOwnership,
  verifyAnalyticsAccess,
  verifyPublishAccess,
  verifyExportAccess,
  createOwnershipVerificationMiddleware,
  extractUserId,
  verifyUserRole,
  verifyAdminAccess,
  verifySuperAdminAccess,
  AuthorizationError,
} from "@/lib/security/authorization";

export {
  sanitizeHtml,
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
  sanitizeMetadata,
  validateResumeData,
  validateSuggestionData,
  validateAnalyticsEventData,
  ValidationError,
} from "@/lib/security/input-validation";

export {
  generateSignature,
  verifySignature,
  createSignedPayload,
  verifySignedPayload,
  generateSignatureHeader,
  verifySignatureHeader,
  createWebhookSignature,
  verifyWebhookSignature,
  generateOneTimeToken,
  verifyOneTimeToken,
  SignatureError,
} from "@/lib/security/request-signing";

export {
  generateApiKey,
  hashApiKey,
  createApiKey,
  validateApiKey,
  extractApiKey,
  createApiKeyAuthMiddleware,
  createApiKeyAuthResponse,
  revokeApiKey,
  listApiKeys,
  rotateApiKey,
  trackApiKeyUsage,
  ApiKeyError,
} from "@/lib/security/api-key-auth";

export {
  createAuditLog,
  logApiAccess,
  logResumeExport,
  logResumePublication,
  logAnalyticsAccess,
  logAiSuggestions,
  logUnauthorizedAccess,
  logRateLimitExceeded,
  logApiKeyCreated,
  logApiKeyRevoked,
  queryAuditLogs,
  exportAuditLogs,
  extractClientIp,
  extractUserAgent,
  AuditEventType,
  type AuditLogEntry,
} from "@/lib/security/audit-logging";
