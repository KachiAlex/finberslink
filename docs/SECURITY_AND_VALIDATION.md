# Security & Validation Guide

## Rate Limiting

Rate limiting protects your API from abuse and DDoS attacks by limiting the number of requests from a single IP/user within a time window.

### Basic Usage

```typescript
import { createRateLimit, rateLimitPresets } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

// Auth endpoint with 5 attempts per minute
export const POST = createRateLimit(rateLimitPresets.auth)(
  async (request: NextRequest) => {
    return NextResponse.json({ success: true });
  }
);
```

### Available Presets

```typescript
rateLimitPresets = {
  auth: { windowMs: 60s, maxRequests: 5 },      // Login attempts
  api: { windowMs: 60s, maxRequests: 100 },     // General API
  public: { windowMs: 60s, maxRequests: 1000 }, // Public endpoints
  strict: { windowMs: 1s, maxRequests: 1 },     // Strict (1 per second)
  passwordReset: { windowMs: 1h, maxRequests: 3 },    // Password resets
  fileUpload: { windowMs: 60s, maxRequests: 10 },     // File uploads
};
```

### Custom Configuration

```typescript
export const POST = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: "Please wait before making another request",
  
  // Custom key generator (default: IP + pathname)
  keyGenerator: (request) => {
    const userId = request.headers.get("user-id");
    return userId || request.headers.get("x-forwarded-for") || "unknown";
  },
  
  // Skip rate limiting on successful responses
  skipSuccessfulRequests: false,
  
  // Skip successful responses (don't count the hit)
  skipFailedRequests: true,
})(handler);
```

### Response Headers

Rate-limited endpoints return additional headers:

```
X-RateLimit-Limit: 100        // Max requests
X-RateLimit-Remaining: 45     // Requests remaining
X-RateLimit-Reset: 1710345600 // Epoch timestamp when limit resets
Retry-After: 30               // Seconds to wait (on 429 response)
```

### Testing

```typescript
import { clearRateLimits, getRateLimitStats } from "@/lib/security";

// In tests, clear before each test
beforeEach(() => {
  clearRateLimits();
});

// Check memory usage
console.log(getRateLimitStats());
// { stored: 45, maxSize: 10000 }
```

### Notes

- **Storage**: Currently uses in-memory LRU cache (suitable for single-server deployments)
- **For distributed systems**: Use Redis with a library like `redis-rate-limit`
- **Keys don't expire automatically**: Use Redis with TTL for cluster deployments

---

## CSRF Protection

CSRF (Cross-Site Request Forgery) protection using the **Double Submit Cookie** pattern.

### How It Works

1. Server generates token → sent as httpOnly cookie + in response body
2. Client includes token in custom header with mutation requests
3. Server verifies header token matches cookie token
4. Tokens stored server-side for enhanced security

### Setup

```typescript
// Initialize endpoint (GET /api/csrf)
import { getCsrfTokenEndpoint } from "@/lib/security";

export const GET = getCsrfTokenEndpoint();

// Response:
// {
//   "csrfToken": "a1b2c3d4..."
// }
// Cookie: __csrf-token=a1b2c3d4...; HttpOnly; Secure; SameSite=Strict
```

### Protect Endpoints

```typescript
import { createCsrfProtection } from "@/lib/security";

export const POST = createCsrfProtection({
  protectedMethods: ["POST", "PUT", "DELETE", "PATCH"],
  excludeRoutes: [/^\/api\/public\//],
  oneTimeUse: true, // Invalidate token after use
  message: "Invalid security token",
})(
  async (request: NextRequest) => {
    return NextResponse.json({ success: true });
  }
);
```

### Client-Side Usage

```typescript
// 1. Fetch CSRF token on app load
async function initializeCsrf() {
  const res = await fetch("/api/csrf", {
    credentials: "include",
  });
  const { csrfToken } = await res.json();
  return csrfToken;
}

// 2. Include token with mutations
async function deleteUser(userId: string, csrfToken: string) {
  const res = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
    headers: {
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
  });
  return res.json();
}

// 3. Wrap in React hook (recommended)
function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/csrf", { credentials: "include" })
      .then(r => r.json())
      .then(data => setToken(data.csrfToken));
  }, []);

  return token;
}

export function DeleteButton({ userId }: { userId: string }) {
  const csrfToken = useCsrfToken();

  async function handleDelete() {
    if (!csrfToken) return;
    await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { "x-csrf-token": csrfToken },
      credentials: "include",
    });
  }

  return <button onClick={handleDelete}>Delete</button>;
}
```

### Config Options

```typescript
interface CsrfProtectionConfig {
  protectedMethods?: string[];      // Default: POST, PUT, DELETE, PATCH
  excludeRoutes?: RegExp[];         // Routes to skip protection
  oneTimeUse?: boolean;             // Invalidate token after use
  message?: string;                 // Custom error message
}
```

### Advanced: Get Token via Form

```typescript
import { initializeCsrfToken } from "@/lib/security";

// Initialize token for forms
export const GET = initializeCsrfToken(async (request) => {
  const token = getCsrfTokenFromRequest(request);
  return render(
    <form method="POST">
      <input type="hidden" name="_csrf" value={token} />
      {/* Form fields */}
    </form>
  );
});
```

### Notes

- **Token Storage**: Server-side LRU cache (Redis in production)
- **Token TTL**: 24 hours by default
- **Client Identifier**: Based on IP + User-Agent hash
- **One-time Tokens**: Optional, set `oneTimeUse: true` for high security
- **Cookie Settings**: HttpOnly, Secure, SameSite=Strict

---

## Input Validation with Zod

Comprehensive Zod schemas for all data validation needs.

### Common Schemas

```typescript
import {
  emailSchema,
  passwordSchema,
  slugSchema,
  urlSchema,
  phoneSchema,
} from "@/lib/validation";

// Reusable schemas
const email = emailSchema; // email address
const password = passwordSchema; // 8+ chars, 1 upper, 1 lower, 1 number, 1 special
const slug = slugSchema; // URL-safe slug
const url = urlSchema; // Valid URL
const phone = phoneSchema; // E.164 format
```

### Form Validation

```typescript
import {
  registerSchema,
  loginSchema,
  validateInput,
  type RegisterInput,
} from "@/lib/validation";

// Register
function handleRegister(formData: FormData) {
  const result = validateInput(registerSchema, {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    agreeToTerms: formData.get("agreeToTerms") === "on",
  });

  if (!result.success) {
    // result.errors contains field-level errors
    console.error(result.errors);
    return;
  }

  // result.data is typed as RegisterInput
  const { firstName, lastName, email, password } = result.data;
  // ... register user
}

// Login
export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = validateInput(loginSchema, body);

  if (!result.success) {
    return NextResponse.json(
      { errors: result.errors },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
```

### Content Validation

```typescript
import {
  courseSchema,
  jobSchema,
  newsSchema,
  parseInput,
} from "@/lib/validation";

// Server action - throws on error
export async function createCourse(input: unknown) {
  "use server";
  
  const course = parseInput(courseSchema, input);
  
  // course is now fully typed
  await db.course.create({ data: course });
}
```

### Pagination & Filtering

```typescript
import { searchSchema, filterSchema } from "@/lib/validation";

// Search API
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = validateInput(searchSchema, params);

  if (!result.success) {
    return NextResponse.json(
      { errors: result.errors },
      { status: 400 }
    );
  }

  const { query, page, limit, sort, order } = result.data;
  
  // Perform search with validated params
  return NextResponse.json({ results: [] });
}

// Course filtering
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = validateInput(filterSchema, params);

  if (!result.success) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const { category, level, minPrice, maxPrice, page, limit } = result.data;
  
  // Query with filters
  const courses = await db.course.findMany({
    where: {
      category,
      level,
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({ courses });
}
```

### Validation Helpers

```typescript
import { validators } from "@/lib/validation";

// Quick validation checks
if (!validators.isStrongPassword(input.password)) {
  throw new Error("Weak password");
}

if (!validators.isValidEmail(email)) {
  throw new Error("Invalid email");
}

if (!validators.isValidSlug(slug)) {
  throw new Error("Invalid slug format");
}

if (!validators.isValidUrl(url)) {
  throw new Error("Invalid URL");
}
```

### Custom Schemas

```typescript
import { z, createSelectSchema } from "@/lib/validation";

// Enum validation
const statusSchema = createSelectSchema([
  "active",
  "inactive",
  "pending",
] as const);

// Custom combined schema
const commentSchema = z.object({
  text: z.string().min(1).max(1000),
  rating: z.number().min(1).max(5),
  authorEmail: emailSchema,
});

// Type inference
type Comment = z.infer<typeof commentSchema>;
```

### Advanced: Async Validation

```typescript
import { z, "next/server" } from "@/lib/validation";

const uniqueEmailSchema = z.string().email().refine(
  async (email) => {
    const existing = await db.user.findUnique({ where: { email } });
    return !existing;
  },
  { message: "Email already registered" }
);

// Use with .parseAsync() or .safeParseAsync()
const result = await uniqueEmailSchema.safeParseAsync(email);
```

### Type Safety

All schemas export TypeScript types:

```typescript
import {
  registerSchema,
  loginSchema,
  courseSchema,
  jobSchema,
  type RegisterInput,
  type LoginInput,
  type CourseInput,
  type JobInput,
} from "@/lib/validation";

// Full type inference
const user: RegisterInput = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "Secure123!@",
  role: "STUDENT",
  agreeToTerms: true,
};
```

---

## Summary

| Feature | Purpose | Key File |
|---------|---------|----------|
| **Rate Limiting** | Prevent abuse & DDoS | `src/lib/security/rate-limit.ts` |
| **CSRF Protection** | Prevent cross-site forgery | `src/lib/security/csrf.ts` |
| **Input Validation** | Type-safe data validation | `src/lib/validation/schemas.ts` |
| **Security Module** | Unified security exports | `src/lib/security/index.ts` |
| **Validation Module** | Unified validation exports | `src/lib/validation/index.ts` |

### Easy Imports

```typescript
// Security
import { createRateLimit, createCsrfProtection } from "@/lib/security";

// Validation
import { registerSchema, validators } from "@/lib/validation";
```

### Production Checklist

- [ ] Enable rate limiting on all mutation endpoints
- [ ] Enable CSRF protection on forms and API endpoints
- [ ] Validate all user inputs with Zod schemas
- [ ] Use httpOnly, secure cookies in production
- [ ] Set SameSite=Strict for CSRF cookies
- [ ] Monitor rate limit stats for abuse patterns
- [ ] Implement Redis for distributed rate limiting
- [ ] Add request logging and error tracking
