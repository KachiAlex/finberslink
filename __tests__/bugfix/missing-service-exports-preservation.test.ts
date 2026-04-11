/**
 * Preservation Property Tests
 * 
 * These tests verify that existing exports continue to work correctly
 * after the fix is applied. They test the baseline behavior that must be preserved.
 * 
 * Validates: Requirements 3.1, 3.2, 3.3
 * 
 * EXPECTED OUTCOME ON UNFIXED CODE: Tests PASS
 * This confirms baseline behavior to preserve.
 */

import { requireAdminUser, archiveCourse, restoreCourse, approveCourseEdit, rejectCourseEdit } from '@/features/admin/service';
import { requireAuth, handleAuthError, AuthError } from '@/lib/auth/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { NextRequest } from 'next/server';

describe('Preservation: Existing Exports Continue to Work', () => {
  
  describe('Admin Service Exports', () => {
    it('should export requireAdminUser function', () => {
      expect(typeof requireAdminUser).toBe('function');
    });

    it('should export archiveCourse function', () => {
      expect(typeof archiveCourse).toBe('function');
    });

    it('should export restoreCourse function', () => {
      expect(typeof restoreCourse).toBe('function');
    });

    it('should export approveCourseEdit function', () => {
      expect(typeof approveCourseEdit).toBe('function');
    });

    it('should export rejectCourseEdit function', () => {
      expect(typeof rejectCourseEdit).toBe('function');
    });
  });

  describe('Auth Guards Exports', () => {
    it('should export requireAuth function', () => {
      expect(typeof requireAuth).toBe('function');
    });

    it('should export handleAuthError function', () => {
      expect(typeof handleAuthError).toBe('function');
    });

    it('should export AuthError class', () => {
      expect(typeof AuthError).toBe('function');
      expect(new AuthError()).toBeInstanceOf(Error);
    });

    it('should create AuthError with default message', () => {
      const error = new AuthError();
      expect(error.message).toBe('Unauthorized');
      expect(error.name).toBe('AuthError');
    });

    it('should create AuthError with custom message', () => {
      const error = new AuthError('Custom error');
      expect(error.message).toBe('Custom error');
    });
  });

  describe('Rate Limit Exports', () => {
    it('should export checkRateLimit function', () => {
      expect(typeof checkRateLimit).toBe('function');
    });

    it('should return boolean from checkRateLimit', async () => {
      const result = await checkRateLimit('test-key');
      expect(typeof result).toBe('boolean');
    });

    it('should accept custom limit parameter', async () => {
      const result = await checkRateLimit('test-key', 50);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Preservation: Existing Behavior Unchanged', () => {
    it('should preserve AuthError instanceof check', () => {
      const error = new AuthError('Test');
      expect(error instanceof AuthError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should preserve AuthError name property', () => {
      const error = new AuthError('Test error');
      expect(error.name).toBe('AuthError');
    });

    it('should preserve checkRateLimit default limit behavior', async () => {
      const result = await checkRateLimit('key1');
      expect(result).toBe(true);
    });

    it('should preserve checkRateLimit with custom limit', async () => {
      const result = await checkRateLimit('key2', 200);
      expect(result).toBe(true);
    });
  });
});
