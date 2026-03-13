import { z } from "zod";

/**
 * Common Zod schemas and validation helpers
 * Reusable across the application
 */

// ============================================================================
// Common Types
// ============================================================================

export const idSchema = z.string().cuid("Invalid ID").or(z.string().uuid("Invalid ID"));
export const emailSchema = z.string().email("Invalid email address").toLowerCase().trim();
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(255, "Slug too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens");
export const urlSchema = z.string().url("Invalid URL");
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
  .optional();

// Password: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    "Password must contain at least one uppercase letter"
  )
  .refine(
    (pwd) => /[a-z]/.test(pwd),
    "Password must contain at least one lowercase letter"
  )
  .refine(
    (pwd) => /[0-9]/.test(pwd),
    "Password must contain at least one number"
  )
  .refine(
    (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    "Password must contain at least one special character"
  );

// Weak password (for optional password fields)
export const weakPasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password too long");

// ============================================================================
// User & Auth Schemas
// ============================================================================

export const userNameSchema = z
  .string()
  .min(1, "Name required")
  .max(100, "Name too long")
  .trim()
  .transform((val) => val.replace(/\s+/g, " ")); // Normalize whitespace

export const roleSchema = z.enum(["STUDENT", "TUTOR", "EMPLOYER", "ADMIN", "SUPER_ADMIN"]);
export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "INVITED"]);

export const registerSchema = z.object({
  firstName: userNameSchema,
  lastName: userNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema.default("STUDENT"),
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to terms and conditions"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
  rememberMe: z.boolean().default(false),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmation required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// ============================================================================
// Profile & Content Schemas
// ============================================================================

export const bioSchema = z
  .string()
  .max(500, "Bio must be 500 characters or less")
  .optional()
  .transform((val) => val || undefined);

export const descriptionSchema = z
  .string()
  .min(10, "Description must be at least 10 characters")
  .max(5000, "Description must be 5000 characters or less")
  .trim();

export const tagsSchema = z
  .array(z.string().min(1).max(50).trim())
  .min(0, "At least one tag")
  .max(10, "Maximum 10 tags");

export const profileSchema = z.object({
  bio: bioSchema,
  headline: userNameSchema.optional(),
  location: z.string().max(100, "Location too long").optional(),
  skills: tagsSchema,
  interests: tagsSchema,
  avatarUrl: urlSchema.optional(),
});

// ============================================================================
// Course & Learning Schemas
// ============================================================================

export const courseLevel = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const courseSchema = z.object({
  title: z.string().min(5, "Title too short").max(200, "Title too long").trim(),
  slug: slugSchema,
  description: descriptionSchema,
  tagline: z.string().min(10, "Tagline too short").max(200, "Tagline too long").trim(),
  level: courseLevel,
  category: z.string().min(1, "Category required"),
  coverImage: urlSchema,
  outcomes: tagsSchema,
  skills: tagsSchema,
  certificateAvailable: z.boolean().default(false),
});

export const lessonSchema = z.object({
  title: z.string().min(3, "Title too short").max(200, "Title too long").trim(),
  description: z.string().min(10, "Description too short").max(1000),
  order: z.number().int().positive("Order must be positive"),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute").max(480, "Max 8 hours"),
  format: z.enum(["VIDEO", "TEXT", "QUIZ", "INTERACTIVE"]),
  content: z.string().optional(),
  videoUrl: urlSchema.optional(),
});

// ============================================================================
// Job & Opportunity Schemas
// ============================================================================

export const jobSchema = z.object({
  title: z.string().min(3, "Title too short").max(200, "Title too long").trim(),
  slug: slugSchema,
  description: descriptionSchema,
  companyName: z.string().min(1, "Company required").max(200).trim(),
  location: z.string().min(1, "Location required").max(200).trim(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY", "INTERNSHIP"]),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  tags: tagsSchema,
  featured: z.boolean().default(false),
  expiresAt: z.date().optional(),
});

export const jobApplicationSchema = z.object({
  resumeUrl: urlSchema,
  coverLetter: z.string().min(50, "Cover letter too short").max(2000, "Cover letter too long").optional(),
  email: emailSchema,
  phone: phoneSchema,
});

// ============================================================================
// News & Communication Schemas
// ============================================================================

export const newsSchema = z.object({
  title: z.string().min(3, "Title too short").max(300, "Title too long").trim(),
  slug: slugSchema,
  content: descriptionSchema,
  excerpt: z.string().max(500, "Excerpt too long").optional(),
  featured: z.boolean().default(false),
  publishedAt: z.date().optional(),
});

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment required")
    .max(1000, "Comment too long")
    .trim(),
});

// ============================================================================
// Admin Schemas
// ============================================================================

export const updateUserSchema = z.object({
  firstName: userNameSchema.optional(),
  lastName: userNameSchema.optional(),
  email: emailSchema.optional(),
  role: roleSchema.optional(),
  status: userStatusSchema.optional(),
});

export const bulkActionSchema = z.object({
  action: z.enum(["suspend", "activate", "delete", "changeRole"]),
  userIds: z.array(idSchema).min(1, "At least one user required"),
  newRole: roleSchema.optional(),
});

// ============================================================================
// Pagination & Filtering
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSchema = z.object({
  query: z.string().min(1, "Search query required").max(200, "Query too long").trim(),
  ...paginationSchema.shape,
});

export const filterSchema = z.object({
  category: z.string().optional(),
  level: courseLevel.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  ...paginationSchema.shape,
});

// ============================================================================
// Type Exports
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type NewsInput = z.infer<typeof newsSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type FilterInput = z.infer<typeof filterSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate input and return typed data or errors
 */
export function validateInput<T extends z.ZodSchema>(schema: T, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
      data: null,
    };
  }
  return {
    success: true,
    errors: null,
    data: result.data as z.infer<T>,
  };
}

/**
 * Parse with error throwing (for server-only use)
 */
export function parseInput<T extends z.ZodSchema>(schema: T, input: unknown): z.infer<T> {
  return schema.parse(input);
}

/**
 * Create custom validation schema with common patterns
 */
export function createSelectSchema<T extends readonly string[]>(options: T) {
  return z.enum(options as unknown as [string, ...string[]]);
}

/**
 * Validation helpers for common patterns
 */
export const validators = {
  isStrongPassword: (pwd: string) => passwordSchema.safeParse(pwd).success,
  isValidEmail: (email: string) => emailSchema.safeParse(email).success,
  isValidSlug: (slug: string) => slugSchema.safeParse(slug).success,
  isValidUrl: (url: string) => urlSchema.safeParse(url).success,
  isValidPhone: (phone: string) => phoneSchema.safeParse(phone).success,
};
