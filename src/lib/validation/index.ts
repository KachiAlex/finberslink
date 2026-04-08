/**
 * Validation module barrel export
 */

export {
  // Common schemas
  idSchema,
  emailSchema,
  slugSchema,
  urlSchema,
  phoneSchema,
  passwordSchema,
  weakPasswordSchema,
  // User & Auth
  userNameSchema,
  roleSchema,
  userStatusSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  // Profile & Content
  bioSchema,
  descriptionSchema,
  tagsSchema,
  profileSchema,
  // Course & Learning
  courseLevel,
  courseSchema,
  lessonSchema,
  // Job & Opportunity
  jobSchema,
  jobApplicationSchema,
  // News & Communication
  newsSchema,
  commentSchema,
  // Admin
  updateUserSchema,
  bulkActionSchema,
  // Pagination & Filtering
  paginationSchema,
  searchSchema,
  filterSchema,
  // Helpers
  validateInput,
  parseInput,
  createSelectSchema,
  validators,
  // Types
  type RegisterInput,
  type LoginInput,
  type ChangePasswordInput,
  type ProfileInput,
  type CourseInput,
  type LessonInput,
  type JobInput,
  type JobApplicationInput,
  type NewsInput,
  type CommentInput,
  type UpdateUserInput,
  type BulkActionInput,
  type PaginationInput,
  type SearchInput,
  type FilterInput,
} from "@/lib/validation/schemas";
