# Login Flow Authentication System - Implementation Tasks

## Phase 1: Database Schema Updates

### Task 1: Update Prisma schema for authentication

- [x] 1.1 Add passwordHash field to User model (String, required)
- [x] 1.2 Add lastFailedLoginAt field to User model (DateTime, optional)
- [x] 1.3 Add failedLoginCount field to User model (Int, default 0)
- [x] 1.4 Add lockedUntil field to User model (DateTime, optional)
- [x] 1.5 Create LoginAttempt model with id, email, attemptedAt, success fields
- [x] 1.6 Run prisma migrate to apply schema changes
- [ ] 1.7 Update existing users with hashed passwords (migration script)

## Phase 2: Core Authentication Functions

### Task 2: Implement JWT token generation and verification

- [x] 2.1 Implement generateAccessToken() in src/lib/auth/jwt.ts
  - Use SignJWT from jose
  - Include user ID, email, role, tenantId in payload
  - Sign with JWT_ACCESS_SECRET
  - Set expiration to 15 minutes
- [x] 2.2 Implement generateRefreshToken() in src/lib/auth/jwt.ts
  - Use SignJWT from jose
  - Include user ID in payload
  - Sign with JWT_REFRESH_SECRET
  - Set expiration to 7 days
- [x] 2.3 Implement verifyAccessToken() in src/lib/auth/jwt.ts
  - Use jwtVerify from jose
  - Verify signature with JWT_ACCESS_SECRET
  - Return decoded payload
  - Throw error on invalid token
- [x] 2.4 Implement verifyRefreshToken() in src/lib/auth/jwt.ts
  - Use jwtVerify from jose
  - Verify signature with JWT_REFRESH_SECRET
  - Return decoded payload
  - Throw error on invalid token

### Task 3: Implement password hashing and verification

- [x] 3.1 Implement hashPassword() in src/lib/auth/password.ts
  - Use bcrypt with 12 salt rounds
  - Return hashed password
- [x] 3.2 Implement verifyPassword() in src/lib/auth/password.ts
  - Use bcrypt compare
  - Compare submitted password with stored hash
  - Return boolean result

### Task 4: Implement rate limiting and account lockout

- [x] 4.1 Implement recordFailedLogin() in src/features/auth/service.ts
  - Record failed login attempt in database
  - Increment failedLoginCount
  - Update lastFailedLoginAt
- [x] 4.2 Implement clearFailedLogins() in src/features/auth/service.ts
  - Clear failed login attempts on successful login
  - Reset failedLoginCount to 0
- [x] 4.3 Implement isAccountLocked() in src/features/auth/service.ts
  - Check if lockedUntil is in the future
  - Return boolean
- [x] 4.4 Implement lockAccount() in src/features/auth/service.ts
  - Set lockedUntil to 30 minutes from now
  - Called after 5 failed attempts

## Phase 3: Authentication Service

### Task 5: Rewrite loginUser() function

- [x] 5.1 Find user by email in database
- [ ] 5.2 Check if account is locked using isAccountLocked()
- [ ] 5.3 Return generic error if locked
- [ ] 5.4 Verify password using verifyPassword()
- [ ] 5.5 Return generic error if password invalid
- [ ] 5.6 Record failed login if password invalid
- [ ] 5.7 Generate access token using generateAccessToken()
- [ ] 5.8 Generate refresh token using generateRefreshToken()
- [ ] 5.9 Clear failed logins on success
- [ ] 5.10 Return tokens and user data

### Task 6: Rewrite registerUser() function

- [x] 6.1 Hash password using hashPassword()
- [ ] 6.2 Create user with hashed password in database
- [ ] 6.3 Generate access token
- [ ] 6.4 Generate refresh token
- [ ] 6.5 Return tokens and user data

### Task 7: Implement refreshSession() function

- [x] 7.1 Verify refresh token using verifyRefreshToken()
- [ ] 7.2 Find user by ID from token payload
- [ ] 7.3 Generate new access token
- [ ] 7.4 Generate new refresh token (rotate)
- [ ] 7.5 Return new tokens

## Phase 4: API Endpoints

### Task 8: Update login endpoint

- [x] 8.1 Update src/app/api/auth/login/route.ts to use real loginUser()
- [ ] 8.2 Improve error handling for all failure cases
- [ ] 8.3 Return generic error messages
- [ ] 8.4 Set auth cookies with real tokens
- [ ] 8.5 Add logging for debugging

### Task 9: Create refresh endpoint

- [x] 9.1 Create src/app/api/auth/refresh/route.ts
- [ ] 9.2 Implement POST handler
- [ ] 9.3 Extract refresh token from cookies
- [ ] 9.4 Call refreshSession()
- [ ] 9.5 Set new auth cookies
- [ ] 9.6 Return new tokens

### Task 10: Update middleware

- [ ] 10.1 Update src/middleware.ts to use real verifyAccessToken()
- [ ] 10.2 Properly handle token verification errors
- [ ] 10.3 Redirect to login on invalid tokens
- [ ] 10.4 Extract user claims from verified token

## Phase 5: Testing

### Task 11: Write exploratory tests

- [ ] 11.1 Test login with correct credentials generates real JWT
- [ ] 11.2 Test token can be verified by middleware
- [ ] 11.3 Test login with incorrect password is rejected
- [ ] 11.4 Test account locks after 5 failed attempts
- [ ] 11.5 Test locked account cannot log in for 30 minutes
- [ ] 11.6 Test error messages don't leak information

### Task 12: Write preservation tests

- [ ] 12.1 Test authenticated users redirect to correct dashboard
- [ ] 12.2 Test protected routes require authentication
- [ ] 12.3 Test logout clears session
- [ ] 12.4 Test role-based access control

### Task 13: Integration testing

- [ ] 13.1 Test complete login flow end-to-end
- [ ] 13.2 Test token refresh flow
- [ ] 13.3 Test account lockout flow
- [ ] 13.4 Test logout flow
- [ ] 13.5 Test role-based redirects

## Phase 6: Deployment

### Task 14: Final verification

- [ ] 14.1 Verify all tests pass
- [ ] 14.2 Verify no regressions in existing functionality
- [ ] 14.3 Verify security best practices implemented
- [ ] 14.4 Verify error handling is robust
- [ ] 14.5 Deploy to staging environment
- [ ] 14.6 Test on Vercel deployment

