"use client";

import { useState, useEffect } from "react";
import { useCourseNameValidation } from "../hooks/use-course-name-validation";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { SafeImage } from "../ui/safe-image";
import { X, Save, AlertTriangle } from "lucide-react";
import type { CourseApprovalStatus, CourseLevel } from "@prisma/client";

// Modal overlay component
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        {children}
      </div>
    </div>
  );
};

// Define Course type locally since it's not exported from admin service
interface Course {
  id: string;
  title: string;
  description: string | null;
  tagline: string | null;
  category: string;
  level: CourseLevel;
  coverImage: string | null;
  instructorId: string;
  instructor: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approvalStatus: CourseApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  _count: {
    enrollments: number;
  };
  hasPendingEdit: boolean;
}

interface CourseEditModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Partial<Course>) => void;
}

export function CourseEditModal({ course, isOpen, onClose, onSave }: CourseEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: course.title || "",
    description: course.description || "",
    tagline: course.tagline || "",
    category: course.category || "",
    level: course.level || "BEGINNER",
    coverImage: course.coverImage || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use course name validation hook
  const { validationResult, isValidating, validateCourseName, clearValidation } = useCourseNameValidation({
    courseId: course.id,
    instructorId: course.instructorId,
    debounceMs: 500
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }
    
    if (formData.coverImage && !formData.coverImage.match(/^https?:\/\/.+/)) {
      newErrors.coverImage = "Invalid URL format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if course name validation passed
    if (!validationResult.isValid && validationResult.error) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save course:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Trigger validation when title changes
    if (field === 'title') {
      validateCourseName(value);
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        tagline: course.tagline || "",
        category: course.category || "",
        level: course.level || "BEGINNER",
        coverImage: course.coverImage || "",
      });
      setErrors({});
      clearValidation();
    }
  }, [isOpen, course, clearValidation]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Edit Course</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter course title"
                className="w-full"
                required
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
              
              {/* Course Name Validation */}
              {formData.title && (
                <div className="mt-2">
                  {isValidating && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                      Checking for duplicate titles...
                    </div>
                  )}
                  
                  {validationResult.isValid === false && validationResult.error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800">Duplicate Course Title</p>
                        <p className="text-red-700 mt-1">{validationResult.error}</p>
                        {validationResult.existingCourses && validationResult.existingCourses.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-red-600 font-medium">Existing courses with this title:</p>
                            <ul className="mt-1 space-y-1">
                              {validationResult.existingCourses.map((existingCourse) => (
                                <li key={existingCourse.id} className="text-xs text-red-600">
                                  {existingCourse.title} - {existingCourse.category} ({existingCourse.level})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {validationResult.isValid === true && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <div className="h-4 w-4 rounded-full bg-green-600"></div>
                      Course title is available
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="A catchy tagline for the course"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe what students will learn in this course"
                className="w-full min-h-[100px]"
                required
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programming">Programming</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="data-science">Data Science</SelectItem>
                    <SelectItem value="web-development">Web Development</SelectItem>
                    <SelectItem value="mobile">Mobile Development</SelectItem>
                    <SelectItem value="devops">DevOps</SelectItem>
                    <SelectItem value="ai-ml">AI & Machine Learning</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select value={formData.level} onValueChange={(value: CourseLevel) => handleChange("level", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-sm text-red-600">{errors.level}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => handleChange("coverImage", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full"
                  />
                  {errors.coverImage && (
                    <p className="text-sm text-red-600">{errors.coverImage}</p>
                  )}
                </div>
                
                {/* Cover Image Preview */}
                <div className="flex-shrink-0">
                  <SafeImage
                    src={formData.coverImage}
                    alt="Course cover preview"
                    className="rounded-lg border-2 border-slate-200"
                    width={120}
                    height={80}
                    fallback="/finbers-logo.png"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isValidating || (validationResult.isValid === false && !!validationResult.error)}
              >
                {isSubmitting ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isValidating ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (validationResult.isValid === false && !!validationResult.error) ? (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Fix Issues
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Modal>
  );
}
