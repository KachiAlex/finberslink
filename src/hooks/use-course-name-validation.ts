/**
 * Course Name Validation Hook
 * Client-side validation for duplicate course names
 */

import { useState, useCallback } from 'react';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  message?: string;
  duplicates?: Array<{
    id: string;
    title: string;
    instructor: string;
    status: string;
    created: string;
  }>;
}

interface UseCourseNameValidationOptions {
  courseId?: string;
  instructorId?: string;
  debounceMs?: number;
}

export function useCourseNameValidation(options: UseCourseNameValidationOptions = {}) {
  const { courseId, instructorId, debounceMs = 500 } = options;
  
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true
  });
  const [isValidating, setIsValidating] = useState(false);

  const validateCourseName = useCallback(async (title: string) => {
    if (!title || title.trim().length === 0) {
      setValidationResult({ isValid: false, error: "Course title is required" });
      return false;
    }

    if (title.trim().length < 3) {
      setValidationResult({ isValid: false, error: "Course title must be at least 3 characters" });
      return false;
    }

    setIsValidating(true);
    
    try {
      const response = await fetch('/api/admin/courses/validate-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          courseId,
          instructorId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setValidationResult({
          isValid: data.isValid,
          error: data.error,
          message: data.message,
          duplicates: data.duplicates
        });
        return data.isValid;
      } else {
        setValidationResult({
          isValid: false,
          error: data.error || 'Validation failed'
        });
        return false;
      }
    } catch (error) {
      console.error('Course name validation error:', error);
      setValidationResult({
        isValid: false,
        error: 'Network error during validation'
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [courseId, instructorId]);

  // Debounced validation
  const debouncedValidate = useCallback(
    debounce(validateCourseName, debounceMs),
    [validateCourseName, debounceMs]
  );

  return {
    validationResult,
    isValidating,
    validateCourseName: debouncedValidate,
    clearValidation: () => setValidationResult({ isValid: true })
  };
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
