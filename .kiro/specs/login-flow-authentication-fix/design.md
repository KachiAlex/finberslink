# Login Flow Authentication System Design

## Overview

This design implements a complete, production-ready authentication system with real JWT token generation, password hashing, rate limiting, and security best practices. The system uses the `jose` library for JWT operations (edge-safe), bcrypt for password hashing, and implements account lockout mechanisms.

## Architecture

### Token Generation & Verification

**JWT Implementation:**
- Use `SignJWT` from `jose` library to generate tokens with HS256 algorithm
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Both tokens include user ID, email, role, and tenant ID in payload
- Tokens are signed with JWT_ACCESS_SECRET and JWT_REFRESH_SECRET

**Token Verification:**
- Use `jwtVerify` from `jose` library to verify token signatures
- Reject tokens with invalid signatures or expired timestamps
- Extract and validate user claims from verified token

### Password Security

**Password Hashing:**
- Use bcrypt with 12 salt rounds for password hashing
- Hash passwords before storing in database
- Never store plain text passwords

**Password Verification:**
- Use bcrypt to compare submitted password with stored hash
- Return generic error on mismatch to prevent user enumeration

### Rate Limiting & Account Lockout

**Failed Login Tracking:**
- Store failed login attempts in database with timestamp
- Track attempts per email address
- Clean up old attempts (older than 15 minutes)

**Lockout Mechanism:**
- Lock account after 5 failed attempts within 15 minutes
- Locked accounts cannot attempt login for 30 minutes
- Return generic error message during lockout period

### Session Management

**Cookie Configuration:**
- Access token: HTTP-only, Secure, SameSite=None, 15 minute expiry
- Refresh token: HTTP-only, Secure, SameSite=None, 7 day expiry
- Secure flag determined by environment (HTTPS in production)

**Token Refresh:**
- Implement refresh endpoint to generate new access token using refresh token
- Validate refresh token before issuing new access token
- Rotate refresh tokens on each refresh for enhanced security

## Implementation Details

### Files to Modify

**1. src/lib/auth/jwt.ts**
- Implement `generateAccessToken()` using `SignJWT` from jose
- Implement `generateRefreshToken()` using `SignJWT` from jose
- Implement `verifyAccessToken()` using `jwtVerify` from jose
- Implement `verifyRefreshToken()` using `jwtVerify` from jose
- Export token generation and verification functions

**2. src/lib/auth/password.ts**
- Implement `hashPassword()` using bcrypt with 12 salt rounds
- Implement `verifyPassword()` using bcrypt compare
- Export password functions

**3. src/features/auth/service.ts**
- Rewrite `loginUser()` to:
  - Find user by email
  - Check if account is locked
  - Verify password using bcrypt
  - Generate real JWT tokens
  - Clear failed login attempts on success
  - Return tokens and user data
- Rewrite `registerUser()` to:
  - Hash password before storing
  - Create user in database
  - Generate initial tokens
- Implement `refreshSession()` to:
  - Verify refresh token
  - Generate new access token
  - Return new tokens

**4. src/app/api/auth/login/route.ts**
- Update to use real `loginUser()` function
- Improve error handling
- Return generic error messages
- Set auth cookies with real tokens

**5. src/app/api/auth/refresh/route.ts** (new)
- Implement token refresh endpoint
- Verify refresh token
- Generate new access token
- Return new tokens

**6. src/middleware.ts**
- Update to use real `verifyAccessToken()` function
- Properly handle token verification errors
- Redirect to login on invalid tokens

### Database Schema Updates

**Add to User model (prisma/schema.prisma):**
- `passwordHash: String` - Store bcrypt hash instead of plain password
- `lastFailedLoginAt: DateTime?` - Track last failed login attempt
- `failedLoginCount: Int @default(0)` - Count failed attempts
- `lockedUntil: DateTime?` - Account lockout expiration

**Create LoginAttempt model:**
- `id: String @id @default(cuid())`
- `email: String`
- `attemptedAt: DateTime @default(now())`
- `success: Boolean`

## Correctness Properties

**Property 1: Real Token Generation**
For any valid login attempt with correct credentials, the system SHALL generate a real JWT access token signed with JWT_ACCESS_SECRET that can be verified by the middleware.

**Property 2: Password Verification**
For any login attempt with an incorrect password, the system SHALL reject the attempt and return a generic error message without revealing whether the email exists.

**Property 3: Account Lockout**
For any email with 5 failed login attempts within 15 minutes, the system SHALL lock the account and reject all login attempts for 30 minutes.

**Property 4: Token Expiration**
For any access token older than 15 minutes, the middleware SHALL reject the token and redirect to login.

**Property 5: Preservation**
For any authenticated user with a valid token, the system SHALL CONTINUE TO redirect them to the correct dashboard based on their role.

## Testing Strategy

### Exploratory Tests (Should Fail on Unfixed Code)
- Test that login with correct credentials generates a real JWT token
- Test that token can be verified by middleware
- Test that login with incorrect password is rejected
- Test that account locks after 5 failed attempts
- Test that locked account cannot log in for 30 minutes

### Preservation Tests (Should Pass on Unfixed Code)
- Test that authenticated users are redirected to correct dashboard
- Test that protected routes require authentication
- Test that logout clears session

### Fix Validation Tests
- Test token signature verification
- Test password hashing and verification
- Test rate limiting and account lockout
- Test token refresh functionality
- Test error messages don't leak information

