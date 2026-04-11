/**
 * Preservation Property Tests
 * 
 * This test verifies that existing exports continue to work correctly
 * and are not broken by the fix. These tests are written BEFORE implementing
 * the fix to establish baseline behavior that must be preserved.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * Property 2: Preservation - Existing Exports Continue to Work
 * For any import statement where the bug condition does NOT hold (module exists
 * and exports the required function), the fixed codebase SHALL produce exactly
 * the same exports and behavior as the original code.
 */

import {
  requireAdminUser,
  archiveCourse,
  restoreCourse,
  approveCourseEdit,
  rejectCourseEdit,
} from '@/features/admin/service';

import {
  requireAuth,
  handleAuthError,
  AuthError,
  withAuth,
} from '@/lib/auth/guards';

import {
  checkRateLimit,
  createRateLimit,
  rateLimitPresets,
} from '@/lib/security/rate-limit';

describe('Preservation Property Tests: Existing Exports', () => {
  describe('Admin Service Exports', () => {
    /**
     * Property: requireAdminUser export exists and is callable
     * This tests that the existing requireAdminUser export continues to work
     */
    it('should preserve requireAdminUser export from admin service', () => {
      expect(typeof requireAdminUser).toBe('function');
      expect(requireAdminUser.name).toBe('requireAdminUser');
    });

    /**
     * Property: archiveCourse export exists and is callable
     * This tests that the existing archiveCourse export continues to work
     */
    it('should preserve archiveCourse export from admin service', () => {
      expect(typeof archiveCourse).toBe('function');
      expect(archiveCourse.name).toBe('archiveCourse');
    });

    /**
     * Property: restoreCourse export exists and is callable
     * This tests that the existing restoreCourse export continues to work
     */
    it('should preserve restoreCourse export from admin service', () => {
      expect(typeof restoreCourse).toBe('function');
      expect(restoreCourse.name).toBe('restoreCourse');
    });

    /**
     * Property: approveCourseEdit export exists and is callable
     * This tests that the existing approveCourseEdit export continues to work
     */
    it('should preserve approveCourseEdit export from admin service', () => {
      expect(typeof approveCourseEdit).toBe('function');
      expect(approveCourseEdit.name).toBe('approveCourseEdit');
    });

    /**
     * Property: rejectCourseEdit export exists and is callable
     * This tests that the existing rejectCourseEdit export continues to work
     */
    it('should preserve rejectCourseEdit export from admin service', () => {
      expect(typeof rejectCourseEdit).toBe('function');
      expect(rejectCourseEdit.name).toBe('rejectCourseEdit');
    });
  });

  describe('Auth Guards Exports', () => {
    /**
     * Property: requireAuth export exists and is callable
     * This tests that the existing requireAuth export continues to work
     */
    it('should preserve requireAuth export from auth guards', () => {
      expect(typeof requireAuth).toBe('function');
      expect(requireAuth.name).toBe('requireAuth');
    });

    /**
     * Property: handleAuthError export exists and is callable
     * This tests that the existing handleAuthError export continues to work
     */
    it('should preserve handleAuthError export from auth guards', () => {
      expect(typeof handleAuthError).toBe('function');
      expect(handleAuthError.name).toBe('handleAuthError');
    });

    /**
     * Property: AuthError export exists and is a class
     * This tests that the existing AuthError export continues to work
     */
    it('should preserve AuthError export from auth guards', () => {
      expect(typeof AuthError).toBe('function');
      expect(AuthError.name).toBe('AuthError');
      const error = new AuthError('Test error');
      expect(error instanceof AuthError).toBe(true);
      expect(error.message).toBe('Test error');
    });

    /**
     * Property: withAuth export exists and is callable
     * This tests that the existing withAuth export continues to work
     */
    it('should preserve withAuth export from auth guards', () => {
      expect(typeof withAuth).toBe('function');
      expect(withAuth.name).toBe('withAuth');
    });
  });

  describe('Rate Limit Exports', () => {
    /**
     * Property: checkRateLimit export exists and is callable
     * This tests that the existing checkRateLimit export continues to work
     */
    it('should preserve checkRateLimit export from rate-limit', () => {
      expect(typeof checkRateLimit).toBe('function');
      expect(checkRateLimit.name).toBe('checkRateLimit');
    });

    /**
     * Property: createRateLimit export exists and is callable
     * This tests that the existing createRateLimit export continues to work
     */
    it('should preserve createRateLimit export from rate-limit', () => {
      expect(typeof createRateLimit).toBe('function');
      expect(createRateLimit.name).toBe('createRateLimit');
    });

    /**
     * Property: rateLimitPresets export exists and has expected structure
     * This tests that the existing rateLimitPresets export continues to work
     */
    it('should preserve rateLimitPresets export from rate-limit', () => {
      expect(typeof rateLimitPresets).toBe('object');
      expect(rateLimitPresets).toHaveProperty('strict');
      expect(rateLimitPresets).toHaveProperty('moderate');
      expect(rateLimitPresets).toHaveProperty('relaxed');
      expect(rateLimitPresets.strict).toHaveProperty('limit');
      expect(rateLimitPresets.strict).toHaveProperty('windowMs');
    });
  });

  describe('Preservation of Export Behavior', () => {
    /**
     * Property: Admin service functions maintain their signatures
     * This tests that the existing functions have the correct signatures
     */
    it('should maintain correct function signatures for admin service', () => {
      // These functions should accept the expected parameters
      expect(requireAdminUser.length).toBeGreaterThan(0);
      expect(archiveCourse.length).toBeGreaterThan(0);
      expect(restoreCourse.length).toBeGreaterThan(0);
    });

    /**
     * Property: Auth guard functions maintain their signatures
     * This tests that the existing functions have the correct signatures
     */
    it('should maintain correct function signatures for auth guards', () => {
      // These functions should accept the expected parameters
      expect(requireAuth.length).toBeGreaterThan(0);
      expect(handleAuthError.length).toBeGreaterThan(0);
    });

    /**
     * Property: Rate limit functions maintain their signatures
     * This tests that the existing functions have the correct signatures
     */
    it('should maintain correct function signatures for rate-limit', () => {
      // These functions should accept the expected parameters
      expect(checkRateLimit.length).toBeGreaterThan(0);
      expect(createRateLimit.length).toBeGreaterThan(0);
    });
  });
});
