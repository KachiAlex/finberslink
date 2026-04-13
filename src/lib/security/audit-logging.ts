/**
 * Audit Logging Service
 * Logs all API access and sensitive operations for compliance and security
 */

import { NextRequest } from "next/server";
import { Logger } from "@/lib/logger";

const logger = new Logger("AuditLogging");

export enum AuditEventType {
  // Authentication events
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  AUTH_FAILED = "AUTH_FAILED",

  // Resume operations
  RESUME_CREATED = "RESUME_CREATED",
  RESUME_UPDATED = "RESUME_UPDATED",
  RESUME_DELETED = "RESUME_DELETED",
  RESUME_EXPORTED = "RESUME_EXPORTED",
  RESUME_PUBLISHED = "RESUME_PUBLISHED",
  RESUME_UNPUBLISHED = "RESUME_UNPUBLISHED",

  // Analytics operations
  ANALYTICS_VIEWED = "ANALYTICS_VIEWED",
  ANALYTICS_EXPORTED = "ANALYTICS_EXPORTED",

  // AI operations
  AI_SUGGESTIONS_GENERATED = "AI_SUGGESTIONS_GENERATED",
  AI_SUGGESTIONS_APPROVED = "AI_SUGGESTIONS_APPROVED",
  AI_SUGGESTIONS_REJECTED = "AI_SUGGESTIONS_REJECTED",

  // Security operations
  API_KEY_CREATED = "API_KEY_CREATED",
  API_KEY_REVOKED = "API_KEY_REVOKED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Admin operations
  ADMIN_ACTION = "ADMIN_ACTION",
  SETTINGS_CHANGED = "SETTINGS_CHANGED",
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  apiKeyId?: string;
  resourceId?: string;
  resourceType?: string;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

/**
 * Extract client IP address from request
 */
export function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Extract user agent from request
 */
export function extractUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  entry: Omit<AuditLogEntry, "id" | "timestamp">
): Promise<AuditLogEntry> {
  const auditEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    ...entry,
  };

  // Log to console/file
  const logLevel = entry.success ? "info" : "warn";
  logger[logLevel as keyof Logger](
    `[${entry.eventType}] ${entry.action} - User: ${entry.userId || "unknown"}, Resource: ${entry.resourceId || "N/A"}, Status: ${entry.statusCode}`,
    {
      eventType: entry.eventType,
      userId: entry.userId,
      resourceId: entry.resourceId,
      statusCode: entry.statusCode,
      metadata: entry.metadata,
    }
  );

  // In production, persist to database
  // await prisma.auditLog.create({ data: auditEntry });

  return auditEntry;
}

/**
 * Log API access
 */
export async function logApiAccess(
  request: NextRequest,
  statusCode: number,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const method = request.method;
  const path = new URL(request.url).pathname;
  const ipAddress = extractClientIp(request);
  const userAgent = extractUserAgent(request);

  await createAuditLog({
    eventType: AuditEventType.ADMIN_ACTION,
    userId,
    action: `${method} ${path}`,
    method,
    path,
    statusCode,
    ipAddress,
    userAgent,
    metadata,
    success: statusCode >= 200 && statusCode < 300,
  });
}

/**
 * Log resume export
 */
export async function logResumeExport(
  userId: string,
  resumeId: string,
  template: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await createAuditLog({
    eventType: AuditEventType.RESUME_EXPORTED,
    userId,
    resourceId: resumeId,
    resourceType: "Resume",
    action: `Exported resume with template: ${template}`,
    method: "POST",
    path: "/api/resume/export",
    statusCode: success ? 200 : 500,
    metadata: { template },
    success,
    errorMessage,
  });
}

/**
 * Log resume publication
 */
export async function logResumePublication(
  userId: string,
  resumeId: string,
  published: boolean,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await createAuditLog({
    eventType: published
      ? AuditEventType.RESUME_PUBLISHED
      : AuditEventType.RESUME_UNPUBLISHED,
    userId,
    resourceId: resumeId,
    resourceType: "Resume",
    action: `${published ? "Published" : "Unpublished"} resume`,
    method: "POST",
    path: "/api/resume/publish",
    statusCode: success ? 200 : 500,
    metadata: { published },
    success,
    errorMessage,
  });
}

/**
 * Log analytics access
 */
export async function logAnalyticsAccess(
  userId: string,
  resumeId: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await createAuditLog({
    eventType: AuditEventType.ANALYTICS_VIEWED,
    userId,
    resourceId: resumeId,
    resourceType: "Resume",
    action: "Viewed analytics",
    method: "GET",
    path: `/api/resume/analytics/${resumeId}`,
    statusCode: success ? 200 : 500,
    success,
    errorMessage,
  });
}

/**
 * Log AI suggestions
 */
export async function logAiSuggestions(
  userId: string,
  resumeId: string,
  action: "generated" | "approved" | "rejected",
  count: number,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const eventTypeMap = {
    generated: AuditEventType.AI_SUGGESTIONS_GENERATED,
    approved: AuditEventType.AI_SUGGESTIONS_APPROVED,
    rejected: AuditEventType.AI_SUGGESTIONS_REJECTED,
  };

  await createAuditLog({
    eventType: eventTypeMap[action],
    userId,
    resourceId: resumeId,
    resourceType: "Resume",
    action: `${action.charAt(0).toUpperCase() + action.slice(1)} ${count} AI suggestions`,
    method: "POST",
    path: `/api/resume/ai/suggestions/${action}`,
    statusCode: success ? 200 : 500,
    metadata: { count, action },
    success,
    errorMessage,
  });
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  request: NextRequest,
  userId?: string,
  reason?: string
): Promise<void> {
  const method = request.method;
  const path = new URL(request.url).pathname;
  const ipAddress = extractClientIp(request);
  const userAgent = extractUserAgent(request);

  await createAuditLog({
    eventType: AuditEventType.UNAUTHORIZED_ACCESS,
    userId,
    action: `Unauthorized access attempt: ${reason || "Unknown"}`,
    method,
    path,
    statusCode: 403,
    ipAddress,
    userAgent,
    metadata: { reason },
    success: false,
  });
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  request: NextRequest,
  userId?: string,
  endpoint?: string
): Promise<void> {
  const method = request.method;
  const path = new URL(request.url).pathname;
  const ipAddress = extractClientIp(request);

  await createAuditLog({
    eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
    userId,
    action: `Rate limit exceeded on ${endpoint || path}`,
    method,
    path,
    statusCode: 429,
    ipAddress,
    metadata: { endpoint },
    success: false,
  });
}

/**
 * Log API key creation
 */
export async function logApiKeyCreated(
  userId: string,
  apiKeyId: string,
  name: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await createAuditLog({
    eventType: AuditEventType.API_KEY_CREATED,
    userId,
    apiKeyId,
    action: `Created API key: ${name}`,
    method: "POST",
    path: "/api/admin/api-keys",
    statusCode: success ? 201 : 500,
    metadata: { name },
    success,
    errorMessage,
  });
}

/**
 * Log API key revocation
 */
export async function logApiKeyRevoked(
  userId: string,
  apiKeyId: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await createAuditLog({
    eventType: AuditEventType.API_KEY_REVOKED,
    userId,
    apiKeyId,
    action: "Revoked API key",
    method: "DELETE",
    path: `/api/admin/api-keys/${apiKeyId}`,
    statusCode: success ? 200 : 500,
    success,
    errorMessage,
  });
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(
  filters: {
    userId?: string;
    eventType?: AuditEventType;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<AuditLogEntry[]> {
  // In production, query database with filters
  logger.info("Querying audit logs", filters);
  return [];
}

/**
 * Export audit logs
 */
export async function exportAuditLogs(
  filters: {
    startDate?: Date;
    endDate?: Date;
    format?: "csv" | "json";
  }
): Promise<string> {
  // In production, generate export file
  logger.info("Exporting audit logs", filters);
  return "";
}
