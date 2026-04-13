# Security Hardening Implementation - Task 6.4

## Overview

This document describes the comprehensive security hardening implementation for the Resume Features Completion system. The implementation includes authorization middleware, rate limiting, CSRF protection, input validation, request signing, API key authentication, and audit logging.

## Components Implemented

### 1. Authorization Middleware (`src/lib/security/authorization.ts`)

**Purpose**: Verify user ownership before allowing access to sensitive operations.

**Key Functions**:
- `verifyResumeOwnership(resumeId, userId)` - Checks if user owns a resume
- `verifyAnalyticsAccess(resumeId, userId)` - Verifies analytics access
- `verifyPublishAccess(resumeId, userId)` - Verifies publication access
- `verifyExportAccess(resumeId, userId)` - Verifies export access
- `verifyUserRole(userId, role)` - Checks user role
- `verifyAdminAccess(userId)` - Checks admin access
- `verifySuperAdminAccess(userId)` - Checks superadmin access

**Usage Example**:
```typescript
import { verifyResumeOwnership } from "@/lib/security/authorization";

// In API endpoint
const isOwner = await verifyResumeOwnership(resumeId, userId);
if (!isOwner) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### 2. Rate Limiting (`src/lib/rate-limiting.ts`)

**Purpose**: Implement rate limiting on all API endpoints to prevent abuse.

**Configured Limits**:
- Export: 10 per hour per user
- Share: 50 per hour per user
- Analytics: 100 per hour per user
- View: 1000 per hour per resume

**Usage Example**:
```typescript
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiting";

const key = `export:${userId}`;
const result = checkRateLimit(key, RATE_LIMIT_CONFIGS.export);

if (!result.allowed) {
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    { status: 429 }
  );
}
```

### 3. CSRF Protection (`src/lib/security/csrf.ts`)

**Purpose**: Implement CSRF protection for state-changing operations using double-submit cookies.

**Key Functions**:
- `generateCsrfToken()` - Generate a new CSRF token
- `createCsrfProtection(config)` - Middleware for CSRF protection
- `initializeCsrfToken(handler)` - Initialize CSRF token for GET requests
- `getCsrfTokenEndpoint()` - API endpoint to fetch CSRF token

**Usage Example**:
```typescript
import { createCsrfProtection } from "@/lib/security/csrf";

const csrfProtection = createCsrfProtection({
  protectedMethods: ["POST", "PUT", "DELETE", "PATCH"],
  oneTimeUse: false,
});

export const POST = csrfProtection(async (request) => {
  // Handler code
});
```

### 4. Input Validation and Sanitization (`src/lib/security/input-validation.ts`)

**Purpose**: Validate and sanitize all user input to prevent injection attacks.

**Key Functions**:
- `sanitizeHtml(input)` - Sanitize HTML content
- `sanitizeText(input)` - Sanitize plain text
- `validateEmail(email)` - Validate email format
- `validateUrl(url)` - Validate URL format
- `validatePhoneNumber(phone)` - Validate phone format
- `validateDate(date)` - Validate ISO 8601 date
- `validateResumeId(id)` - Validate resume ID format
- `validateTemplate(template)` - Validate template name
- `validateEventType(eventType)` - Validate event type
- `validateDateRange(start, end)` - Validate date range
- `validateResumeData(data)` - Validate complete resume data
- `validateSuggestionData(data)` - Validate suggestion data
- `validateAnalyticsEventData(data)` - Validate analytics event data

**Usage Example**:
```typescript
import { validateResumeData, sanitizeText } from "@/lib/security/input-validation";

const validation = validateResumeData(resumeData);
if (!validation.valid) {
  return NextResponse.json(
    { error: "Invalid resume data", errors: validation.errors },
    { status: 400 }
  );
}

const sanitized = sanitizeText(userInput);
```

### 5. Request Signing (`src/lib/security/request-signing.ts`)

**Purpose**: Implement HMAC-SHA256 signing for sensitive operations.

**Key Functions**:
- `generateSignature(payload, secret)` - Generate HMAC-SHA256 signature
- `verifySignature(payload, signature, secret)` - Verify signature
- `createSignedPayload(data, secret)` - Create signed payload with timestamp
- `verifySignedPayload(payload, signature, secret, maxAge)` - Verify signed payload
- `generateSignatureHeader(method, path, body, secret)` - Generate signature headers
- `verifySignatureHeader(method, path, body, signature, timestamp, secret, maxAge)` - Verify signature headers
- `generateOneTimeToken(userId, operation, secret)` - Generate one-time token
- `verifyOneTimeToken(token, userId, operation, secret, expiresAt)` - Verify one-time token

**Usage Example**:
```typescript
import { generateSignatureHeader, verifySignatureHeader } from "@/lib/security/request-signing";

// Generate signature for request
const headers = generateSignatureHeader("POST", "/api/resume/export", body, secret);

// Verify signature in handler
const isValid = verifySignatureHeader(
  "POST",
  "/api/resume/export",
  body,
  signature,
  timestamp,
  secret
);
```

### 6. API Key Authentication (`src/lib/security/api-key-auth.ts`)

**Purpose**: Implement API key authentication for external integrations.

**Key Functions**:
- `generateApiKey()` - Generate a new API key
- `hashApiKey(apiKey)` - Hash API key for storage
- `createApiKey(userId, name, expiresAt)` - Create API key for user
- `validateApiKey(apiKey)` - Validate API key
- `extractApiKey(request)` - Extract API key from request
- `createApiKeyAuthMiddleware(requiredScopes)` - Middleware for API key auth
- `revokeApiKey(apiKeyId)` - Revoke API key
- `rotateApiKey(apiKeyId, userId)` - Rotate API key
- `trackApiKeyUsage(apiKeyId, endpoint, statusCode)` - Track API key usage

**Usage Example**:
```typescript
import { extractApiKey, validateApiKey } from "@/lib/security/api-key-auth";

const apiKey = extractApiKey(request);
const validation = await validateApiKey(apiKey);

if (!validation.valid) {
  return NextResponse.json(
    { error: "Invalid API key" },
    { status: 401 }
  );
}
```

### 7. Audit Logging (`src/lib/security/audit-logging.ts`)

**Purpose**: Log all API access and sensitive operations for compliance and security.

**Key Functions**:
- `createAuditLog(entry)` - Create audit log entry
- `logApiAccess(request, statusCode, userId, metadata)` - Log API access
- `logResumeExport(userId, resumeId, template, success, errorMessage)` - Log export
- `logResumePublication(userId, resumeId, published, success, errorMessage)` - Log publication
- `logAnalyticsAccess(userId, resumeId, success, errorMessage)` - Log analytics access
- `logAiSuggestions(userId, resumeId, action, count, success, errorMessage)` - Log AI suggestions
- `logUnauthorizedAccess(request, userId, reason)` - Log unauthorized access
- `logRateLimitExceeded(request, userId, endpoint)` - Log rate limit exceeded
- `logApiKeyCreated(userId, apiKeyId, name, success, errorMessage)` - Log API key creation
- `logApiKeyRevoked(userId, apiKeyId, success, errorMessage)` - Log API key revocation
- `queryAuditLogs(filters)` - Query audit logs
- `exportAuditLogs(filters)` - Export audit logs

**Usage Example**:
```typescript
import { logResumeExport, logUnauthorizedAccess } from "@/lib/security/audit-logging";

// Log successful export
await logResumeExport(userId, resumeId, "Modern", true);

// Log unauthorized access
await logUnauthorizedAccess(request, userId, "Ownership verification failed");
```

### 8. Security Middleware (`src/lib/security/middleware.ts`)

**Purpose**: Comprehensive security middleware combining all security measures.

**Key Functions**:
- `createSecureApiHandler(config)` - Create secure API handler with all security measures
- `createResumeExportMiddleware()` - Middleware for export endpoint
- `createAnalyticsMiddleware()` - Middleware for analytics endpoint
- `createPublishingMiddleware()` - Middleware for publishing endpoint
- `createViewTrackingMiddleware()` - Middleware for view tracking endpoint

**Usage Example**:
```typescript
import { createSecureApiHandler } from "@/lib/security/middleware";

const secureHandler = createSecureApiHandler({
  requireAuth: true,
  requireOwnership: true,
  rateLimit: "export",
  csrfProtection: true,
  validateInput: true,
  auditLog: true,
  getResourceId: (request) => {
    // Extract resource ID from request
  },
});

export const POST = secureHandler(async (request) => {
  // Handler code
});
```

## Integration with Existing Endpoints

### Resume Export Endpoint

The existing export endpoint at `src/app/api/resume/export/route.ts` already includes:
- User authentication verification
- Resume ownership verification
- Input validation
- Error handling
- Analytics event tracking

### Recommended Enhancements

1. Add CSRF protection for POST requests
2. Implement rate limiting (10 per hour per user)
3. Add audit logging for all exports
4. Enhance input validation with sanitization

## Security Best Practices

### 1. Authentication
- Always verify user authentication before processing requests
- Use JWT tokens with proper expiration
- Implement token refresh mechanisms

### 2. Authorization
- Verify user ownership before allowing access to resources
- Implement role-based access control (RBAC)
- Check permissions for sensitive operations

### 3. Rate Limiting
- Implement rate limiting on all API endpoints
- Use different limits for different operations
- Return proper HTTP 429 status with Retry-After header

### 4. CSRF Protection
- Use double-submit cookies for CSRF protection
- Implement one-time tokens for sensitive operations
- Validate CSRF tokens on all state-changing operations

### 5. Input Validation
- Validate all user input on the server side
- Sanitize HTML content to prevent XSS attacks
- Use whitelisting for allowed values
- Limit input length to prevent buffer overflows

### 6. Request Signing
- Sign sensitive requests with HMAC-SHA256
- Include timestamp in signatures to prevent replay attacks
- Use constant-time comparison for signature verification

### 7. API Key Authentication
- Generate strong API keys (at least 32 bytes)
- Hash API keys before storage
- Implement API key rotation
- Track API key usage for monitoring

### 8. Audit Logging
- Log all API access with timestamp and user information
- Log all sensitive operations (export, publish, etc.)
- Log unauthorized access attempts
- Retain audit logs for compliance purposes

## Testing

Comprehensive test suites have been created for all security components:

- `__tests__/security/authorization.test.ts` - Authorization tests
- `__tests__/security/input-validation.test.ts` - Input validation tests
- `__tests__/security/request-signing.test.ts` - Request signing tests
- `__tests__/security/api-key-auth.test.ts` - API key authentication tests

Run tests with:
```bash
npm test -- __tests__/security --run
```

## Configuration

### Rate Limiting Configuration

Edit `src/lib/rate-limiting.ts` to adjust rate limits:

```typescript
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  export: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  share: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  analytics: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  view: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour
};
```

### CSRF Protection Configuration

```typescript
const csrfProtection = createCsrfProtection({
  protectedMethods: ["POST", "PUT", "DELETE", "PATCH"],
  excludeRoutes: [/^\/api\/public\//],
  oneTimeUse: false,
  message: "CSRF token validation failed",
});
```

## Production Deployment

### Prerequisites
1. Set up Redis for distributed rate limiting (optional but recommended)
2. Configure database for audit logging
3. Set up monitoring and alerting for security events
4. Configure HTTPS for all API endpoints

### Environment Variables
```
CSRF_TOKEN_TTL=86400000
RATE_LIMIT_WINDOW=3600000
API_KEY_EXPIRY=2592000000
AUDIT_LOG_RETENTION=7776000000
```

### Monitoring
- Monitor rate limit violations
- Track unauthorized access attempts
- Monitor API key usage
- Review audit logs regularly

## Compliance

This implementation helps meet the following compliance requirements:
- OWASP Top 10 security practices
- GDPR data protection requirements
- SOC 2 audit logging requirements
- PCI DSS security standards

## Future Enhancements

1. Implement distributed rate limiting with Redis
2. Add IP-based rate limiting
3. Implement WAF (Web Application Firewall) rules
4. Add encryption for sensitive data at rest
5. Implement API request signing for webhooks
6. Add security headers (CSP, X-Frame-Options, etc.)
7. Implement DDoS protection
8. Add security event alerting

## Support

For questions or issues related to security hardening, please refer to:
- Security documentation: `SECURITY_HARDENING.md`
- API documentation: `API.md`
- Testing guide: `TESTING.md`
