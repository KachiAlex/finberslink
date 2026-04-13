# Security Integration Guide

## Overview

This guide explains how to integrate the security hardening components into your API endpoints. The security implementation provides a comprehensive set of tools for protecting sensitive operations.

## Quick Start

### 1. Basic Endpoint Protection

For a simple endpoint that requires authentication and ownership verification:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyResumeOwnership } from "@/lib/security/authorization";
import { validateResumeId } from "@/lib/security/input-validation";
import { logApiAccess } from "@/lib/security/audit-logging";

export async function GET(request: NextRequest) {
  try {
    // Extract user ID from session
    const userId = "user-123"; // Get from session

    // Extract resource ID from URL
    const resumeId = request.nextUrl.pathname.split("/").pop();

    // Validate resource ID
    if (!validateResumeId(resumeId)) {
      return NextResponse.json(
        { error: "Invalid resume ID" },
        { status: 400 }
      );
    }

    // Verify ownership
    const isOwner = await verifyResumeOwnership(resumeId, userId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Your endpoint logic here
    const data = await fetchResumeData(resumeId);

    // Log access
    await logApiAccess(request, 200, userId);

    return NextResponse.json(data);
  } catch (error) {
    await logApiAccess(request, 500, userId);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 2. Endpoint with Rate Limiting

For endpoints that need rate limiting:

```typescript
import { checkRateLimit, RATE_LIMIT_CONFIGS, addRateLimitHeaders } from "@/lib/rate-limiting";

export async function POST(request: NextRequest) {
  const userId = "user-123";

  // Check rate limit
  const key = `export:${userId}`;
  const result = checkRateLimit(key, RATE_LIMIT_CONFIGS.export);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Your endpoint logic here
  const response = NextResponse.json({ success: true });

  // Add rate limit headers
  return addRateLimitHeaders(
    response,
    "export",
    result.remaining,
    result.resetTime,
    RATE_LIMIT_CONFIGS.export
  );
}
```

### 3. Endpoint with CSRF Protection

For state-changing operations:

```typescript
import { createCsrfProtection } from "@/lib/security/csrf";

const csrfProtection = createCsrfProtection({
  protectedMethods: ["POST", "PUT", "DELETE"],
});

async function handleRequest(request: NextRequest) {
  // Your endpoint logic here
  return NextResponse.json({ success: true });
}

export const POST = csrfProtection(handleRequest);
export const PUT = csrfProtection(handleRequest);
export const DELETE = csrfProtection(handleRequest);
```

### 4. Endpoint with Input Validation

For endpoints that accept user input:

```typescript
import { validateResumeData, sanitizeText } from "@/lib/security/input-validation";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate input
  const validation = validateResumeData(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.errors },
      { status: 400 }
    );
  }

  // Sanitize input
  const sanitized = {
    firstName: sanitizeText(body.firstName),
    lastName: sanitizeText(body.lastName),
    email: body.email, // Already validated
  };

  // Your endpoint logic here
  return NextResponse.json({ success: true });
}
```

### 5. Endpoint with API Key Authentication

For external integrations:

```typescript
import { extractApiKey, validateApiKey } from "@/lib/security/api-key-auth";

export async function GET(request: NextRequest) {
  // Extract API key
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 401 }
    );
  }

  // Validate API key
  const validation = await validateApiKey(apiKey);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401 }
    );
  }

  // Your endpoint logic here
  return NextResponse.json({ success: true });
}
```

## Advanced Patterns

### 1. Comprehensive Security Middleware

For endpoints requiring multiple security measures:

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
    return request.nextUrl.pathname.split("/").pop() || null;
  },
});

async function handleExport(request: NextRequest) {
  // Your endpoint logic here
  return NextResponse.json({ success: true });
}

export const POST = secureHandler(handleExport);
```

### 2. Request Signing for Webhooks

For webhook endpoints that need to verify request authenticity:

```typescript
import { verifySignatureHeader } from "@/lib/security/request-signing";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-signature");
  const timestamp = request.headers.get("x-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json(
      { error: "Missing signature headers" },
      { status: 401 }
    );
  }

  const body = await request.text();
  const secret = process.env.WEBHOOK_SECRET!;

  const isValid = verifySignatureHeader(
    "POST",
    request.nextUrl.pathname,
    body,
    signature,
    timestamp,
    secret
  );

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // Your webhook logic here
  return NextResponse.json({ success: true });
}
```

### 3. Audit Logging for Sensitive Operations

For operations that need detailed audit trails:

```typescript
import { logResumeExport, logUnauthorizedAccess } from "@/lib/security/audit-logging";

export async function POST(request: NextRequest) {
  const userId = "user-123";
  const resumeId = "resume-123";

  try {
    // Verify ownership
    const isOwner = await verifyResumeOwnership(resumeId, userId);
    if (!isOwner) {
      await logUnauthorizedAccess(
        request,
        userId,
        "Ownership verification failed"
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Your operation logic here
    const result = await exportResume(resumeId);

    // Log successful operation
    await logResumeExport(userId, resumeId, "Modern", true);

    return NextResponse.json(result);
  } catch (error) {
    // Log failed operation
    await logResumeExport(
      userId,
      resumeId,
      "Modern",
      false,
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Integration Checklist

When integrating security into an endpoint, follow this checklist:

- [ ] **Authentication**: Verify user is authenticated
- [ ] **Authorization**: Verify user has permission to access resource
- [ ] **Input Validation**: Validate all user input
- [ ] **Input Sanitization**: Sanitize user input to prevent injection attacks
- [ ] **Rate Limiting**: Implement rate limiting for abuse prevention
- [ ] **CSRF Protection**: Add CSRF protection for state-changing operations
- [ ] **Request Signing**: Sign sensitive requests for verification
- [ ] **Audit Logging**: Log all sensitive operations
- [ ] **Error Handling**: Handle errors gracefully without exposing sensitive info
- [ ] **Response Headers**: Add security headers (rate limit, etc.)

## Common Patterns

### Pattern 1: Read-Only Endpoint

```typescript
export async function GET(request: NextRequest) {
  // 1. Authenticate
  const userId = extractUserId(request);
  if (!userId) return unauthorized();

  // 2. Authorize (if needed)
  const resourceId = getResourceId(request);
  if (!await verifyResumeOwnership(resourceId, userId)) {
    return forbidden();
  }

  // 3. Validate input
  if (!validateResumeId(resourceId)) return badRequest();

  // 4. Execute logic
  const data = await fetchData(resourceId);

  // 5. Log access
  await logApiAccess(request, 200, userId);

  return NextResponse.json(data);
}
```

### Pattern 2: Write Endpoint

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate
  const userId = extractUserId(request);
  if (!userId) return unauthorized();

  // 2. Parse and validate input
  const body = await request.json();
  const validation = validateResumeData(body);
  if (!validation.valid) return badRequest(validation.errors);

  // 3. Check rate limit
  const rateLimitKey = `export:${userId}`;
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.export);
  if (!rateLimitResult.allowed) return rateLimitExceeded();

  // 4. Authorize (if needed)
  if (!await verifyResumeOwnership(body.resumeId, userId)) {
    await logUnauthorizedAccess(request, userId, "Ownership check failed");
    return forbidden();
  }

  // 5. Sanitize input
  const sanitized = sanitizeInput(body);

  // 6. Execute logic
  const result = await processData(sanitized);

  // 7. Log operation
  await logResumeExport(userId, body.resumeId, body.template, true);

  // 8. Return response with rate limit headers
  const response = NextResponse.json(result);
  return addRateLimitHeaders(
    response,
    "export",
    rateLimitResult.remaining,
    rateLimitResult.resetTime,
    RATE_LIMIT_CONFIGS.export
  );
}
```

### Pattern 3: Admin Endpoint

```typescript
export async function DELETE(request: NextRequest) {
  // 1. Authenticate
  const userId = extractUserId(request);
  if (!userId) return unauthorized();

  // 2. Check admin access
  if (!await verifyAdminAccess(userId)) {
    await logUnauthorizedAccess(request, userId, "Admin access required");
    return forbidden();
  }

  // 3. Validate input
  const resourceId = getResourceId(request);
  if (!validateResumeId(resourceId)) return badRequest();

  // 4. Execute logic
  await deleteResource(resourceId);

  // 5. Log operation
  await logApiAccess(request, 200, userId, { action: "delete", resourceId });

  return NextResponse.json({ success: true });
}
```

## Testing Security

### Unit Tests

```typescript
import { verifyResumeOwnership } from "@/lib/security/authorization";

describe("Authorization", () => {
  it("should verify resume ownership", async () => {
    const result = await verifyResumeOwnership("resume-123", "user-123");
    expect(result).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe("Secure Export Endpoint", () => {
  it("should reject unauthorized users", async () => {
    const response = await fetch("/api/resume/export", {
      method: "POST",
      body: JSON.stringify({ resumeId: "123", template: "Modern" }),
    });

    expect(response.status).toBe(401);
  });

  it("should enforce rate limits", async () => {
    // Make 11 requests (limit is 10)
    for (let i = 0; i < 11; i++) {
      const response = await fetch("/api/resume/export", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeId: "123", template: "Modern" }),
      });

      if (i < 10) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });
});
```

## Troubleshooting

### Issue: Rate limit not working

**Solution**: Ensure you're using the same key format for all requests:
```typescript
const key = `export:${userId}`; // Consistent format
```

### Issue: CSRF token validation failing

**Solution**: Ensure CSRF token is being sent in the correct header:
```typescript
// Client-side
fetch("/api/endpoint", {
  method: "POST",
  headers: {
    "X-CSRF-Token": csrfToken,
  },
});
```

### Issue: Ownership verification failing

**Solution**: Ensure the resume exists and belongs to the user:
```typescript
// Debug: Check resume ownership
const resume = await prisma.resume.findUnique({
  where: { id: resumeId },
  select: { userId: true },
});
console.log("Resume owner:", resume?.userId, "Current user:", userId);
```

## Performance Considerations

1. **Rate Limiting**: In-memory store is suitable for single-server deployments. Use Redis for distributed systems.

2. **Audit Logging**: Logging is asynchronous to avoid blocking requests. Consider batching logs for high-traffic endpoints.

3. **Input Validation**: Validation is performed server-side. Consider caching validation results for repeated inputs.

4. **Database Queries**: Ownership verification requires a database query. Consider caching for frequently accessed resources.

## Security Best Practices

1. **Always validate on the server side** - Never trust client-side validation
2. **Use HTTPS** - All API endpoints should use HTTPS
3. **Implement proper error handling** - Don't expose sensitive information in error messages
4. **Log security events** - Maintain audit trails for compliance
5. **Keep dependencies updated** - Regularly update security-related packages
6. **Use environment variables** - Store secrets in environment variables, not in code
7. **Implement monitoring** - Monitor for suspicious activity and security events
8. **Regular security audits** - Conduct regular security reviews and penetration testing

## Support

For questions or issues, refer to:
- `SECURITY_HARDENING.md` - Detailed security documentation
- `src/lib/security/` - Security implementation files
- `__tests__/security/` - Security test examples
