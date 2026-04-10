# Student Courses Dashboard Tab - Design Document

## Overview

The Student Courses Dashboard Tab provides a unified interface for students to discover, manage, and track their learning journey. The design organizes courses into three distinct sections: Discover (admin-approved courses), Assigned (courses assigned by administrators), and Learning Pathway (enrolled courses). This three-section layout creates a clear mental model for students to understand their course options and progress.

The implementation leverages existing UI components from the Finbers design system, maintains consistency with the current dashboard aesthetic, and provides responsive layouts across all device sizes.

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Student Courses Dashboard                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Frontend (React/Next.js)                    │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  CoursesTab Component                           │    │   │
│  │  │  - State Management (React Hooks)               │    │   │
│  │  │  - Search & Filter Logic                        │    │   │
│  │  │  - Section Rendering                            │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                        │                                  │   │
│  │  ┌─────────────────────┼─────────────────────────┐      │   │
│  │  │                     │                         │      │   │
│  │  ▼                     ▼                         ▼      │   │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │ │DiscoverSec  │  │AssignedSec   │  │LearningPath  │  │   │
│  │ │ - Cards      │  │ - Cards      │  │ - Cards      │  │   │
│  │ │ - Filters    │  │ - Actions    │  │ - Progress   │  │   │
│  │ │ - Pagination │  │ - Pagination │  │ - Pagination │  │   │
│  │ └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Approved     │ │ Assigned     │ │ Enrolled     │
        │ Courses API  │ │ Courses API  │ │ Courses API  │
        └──────────────┘ └──────────────┘ └──────────────┘
                │             │             │
                └─────────────┼─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Prisma ORM      │
                    │   Database Layer  │
                    └───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  PostgreSQL DB    │
                    │  - Courses        │
                    │  - Enrollments    │
                    │  - Assignments    │
                    │  - Users          │
                    └───────────────────┘
```

### Data Flow

1. **Initial Load**: Component mounts and fetches data from three endpoints in parallel
2. **Search/Filter**: User input triggers client-side filtering with optional API calls for pagination
3. **Actions**: User enrolls/accepts/declines courses, triggering API mutations
4. **Updates**: Successful mutations update local state and refresh affected sections
5. **Error Handling**: Failed requests display error states with retry options

## Components and Interfaces

### Component Hierarchy

```
CoursesTab (Main Container)
├── SearchBar
│   ├── SearchInput
│   └── FilterDropdowns
│       ├── CategoryFilter
│       ├── LevelFilter
│       └── ClearFiltersButton
├── DiscoverSection
│   ├── SectionHeader
│   ├── CourseGrid
│   │   └── CourseCard[] (with Enroll button)
│   ├── EmptyState
│   └── Pagination
├── AssignedSection
│   ├── SectionHeader
│   ├── CourseGrid
│   │   └── CourseCard[] (with Accept/Decline buttons)
│   ├── EmptyState
│   └── Pagination
└── LearningPathwaySection
    ├── SectionHeader
    ├── CourseGrid
    │   └── CourseCard[] (with Continue button)
    ├── EmptyState
    └── Pagination
```

### Component Specifications

#### CoursesTab (Main Container)
- **Purpose**: Orchestrates data fetching, state management, and section rendering
- **Props**: `userId: string`
- **State**:
  - `discoverCourses: Course[]`
  - `assignedCourses: AssignedCourse[]`
  - `enrolledCourses: EnrolledCourse[]`
  - `searchQuery: string`
  - `selectedCategory: string | null`
  - `selectedLevel: CourseLevel | null`
  - `loading: { discover, assigned, enrolled }`
  - `error: { discover, assigned, enrolled }`
  - `pagination: { discover, assigned, enrolled }`

#### SearchBar
- **Purpose**: Provides search and filter UI
- **Props**: 
  - `onSearch: (query: string) => void`
  - `onCategoryChange: (category: string | null) => void`
  - `onLevelChange: (level: CourseLevel | null) => void`
  - `onClearFilters: () => void`
  - `categories: string[]`
- **Features**:
  - Real-time search input with debouncing
  - Category dropdown with "All Categories" option
  - Level filter with Beginner/Intermediate/Advanced options
  - Clear filters button (visible when filters active)

#### CourseCard
- **Purpose**: Displays individual course information
- **Props**:
  - `course: Course | AssignedCourse | EnrolledCourse`
  - `section: 'discover' | 'assigned' | 'enrolled'`
  - `onAction: (action: 'enroll' | 'accept' | 'decline' | 'continue') => void`
  - `loading?: boolean`
- **Features**:
  - Course cover image with gradient overlay
  - Title, description, level badge, category
  - Instructor information
  - Section-specific metadata (enrollment count, progress %, assignment date, etc.)
  - Call-to-action button appropriate to section
  - Hover effects with scale and shadow transitions
  - Responsive image sizing

#### SectionHeader
- **Purpose**: Displays section title and description
- **Props**:
  - `title: string`
  - `description: string`
  - `count: number`
- **Features**:
  - Clear section title
  - Descriptive subtitle
  - Course count badge

#### EmptyState
- **Purpose**: Displays message when section has no courses
- **Props**:
  - `section: 'discover' | 'assigned' | 'enrolled'`
  - `hasFilters: boolean`
- **Features**:
  - Contextual messaging based on section
  - Illustration or icon
  - Call-to-action when appropriate

#### Pagination
- **Purpose**: Handles pagination controls
- **Props**:
  - `currentPage: number`
  - `totalPages: number`
  - `onPageChange: (page: number) => void`
  - `loading?: boolean`
- **Features**:
  - Previous/Next buttons
  - Page number display
  - Disabled state during loading

## Data Models

### Course (Base Model)
```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  tagline: string;
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  coverImage: string;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  enrollmentCount: number;
  rating?: number;
  approvalStatus: "APPROVED";
}
```

### DiscoverCourse (Extends Course)
```typescript
interface DiscoverCourse extends Course {
  enrollmentCount: number;
  rating?: number;
  isEnrolled: boolean;
}
```

### AssignedCourse (Extends Course)
```typescript
interface AssignedCourse extends Course {
  assignmentId: string;
  assignedAt: Date;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  notes?: string;
  assignedBy: {
    firstName: string;
    lastName: string;
  };
  isEnrolled: boolean;
}
```

### EnrolledCourse (Extends Course)
```typescript
interface EnrolledCourse extends Course {
  enrollmentId: string;
  enrolledAt: Date;
  progressPercentage: number;
  completedAt?: Date;
  lessonsCount: number;
  lessonsCompleted: number;
  nextLessonId?: string;
}
```

### API Response Structures

#### GET /api/dashboard/courses/discover
```typescript
interface DiscoverCoursesResponse {
  data: DiscoverCourse[];
  pagination: {
    skip: number;
    take: number;
    total: number;
    pages: number;
  };
  filters: {
    categories: string[];
    levels: CourseLevel[];
  };
}
```

#### GET /api/dashboard/courses/assigned
```typescript
interface AssignedCoursesResponse {
  data: AssignedCourse[];
  pagination: {
    skip: number;
    take: number;
    total: number;
    pages: number;
  };
}
```

#### GET /api/dashboard/courses/enrolled
```typescript
interface EnrolledCoursesResponse {
  data: EnrolledCourse[];
  pagination: {
    skip: number;
    take: number;
    total: number;
    pages: number;
  };
}
```

## UI/UX Design

### Wireframe Descriptions

#### Discover Section Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Discover Courses                                             │
│ Explore admin-approved courses and expand your skills       │
│                                                              │
│ [Search...] [Category ▼] [Level ▼] [Clear Filters]        │
│                                                              │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ [Image]      │  │ [Image]      │  │ [Image]      │       │
│ │ Course Title │  │ Course Title │  │ Course Title │       │
│ │ Description  │  │ Description  │  │ Description  │       │
│ │ Level Badge  │  │ Level Badge  │  │ Level Badge  │       │
│ │ 234 enrolled │  │ 156 enrolled │  │ 89 enrolled  │       │
│ │ ★★★★★ 4.8   │  │ ★★★★☆ 4.5   │  │ ★★★★☆ 4.3   │       │
│ │ Instructor   │  │ Instructor   │  │ Instructor   │       │
│ │ [Enroll]     │  │ [Enroll]     │  │ [Enroll]     │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│ ◀ 1 2 3 4 5 ▶                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Assigned Section Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Assigned Courses                                             │
│ Courses assigned by your administrator                      │
│                                                              │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ [Image]      │  │ [Image]      │  │ [Image]      │       │
│ │ Course Title │  │ Course Title │  │ Course Title │       │
│ │ Description  │  │ Description  │  │ Description  │       │
│ │ Level Badge  │  │ Level Badge  │  │ Level Badge  │       │
│ │ Assigned by: │  │ Assigned by: │  │ Assigned by: │       │
│ │ Admin Name   │  │ Admin Name   │  │ Admin Name   │       │
│ │ Assigned: 5d │  │ Assigned: 2w │  │ Assigned: 1m │       │
│ │ [Accept]     │  │ [Accept]     │  │ [Accept]     │       │
│ │ [Decline]    │  │ [Decline]    │  │ [Decline]    │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│ ◀ 1 2 ▶                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Learning Pathway Section Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Learning Pathway                                             │
│ Courses you're actively learning                            │
│                                                              │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ [Image]      │  │ [Image]      │  │ [Image]      │       │
│ │ Course Title │  │ Course Title │  │ Course Title │       │
│ │ Description  │  │ Description  │  │ Description  │       │
│ │ Level Badge  │  │ Level Badge  │  │ Level Badge  │       │
│ │ Progress:    │  │ Progress:    │  │ Progress:    │       │
│ │ ████░░░░ 45% │  │ ██████░░ 65% │  │ ████████░ 85%│       │
│ │ 5/12 lessons │  │ 8/12 lessons │  │ 10/12 lessons│       │
│ │ Instructor   │  │ Instructor   │  │ Instructor   │       │
│ │ [Continue]   │  │ [Continue]   │  │ [Continue]   │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│ ◀ 1 2 3 ▶                                                   │
└─────────────────────────────────────────────────────────────┘
```

### Course Card Component Design

**Card Structure**:
- **Header**: Course cover image (16:9 aspect ratio) with gradient overlay
- **Title Area**: Course title and level badge overlaid on image
- **Content Area**: Description, metadata, instructor info, CTA button
- **Metadata Row**: Section-specific information (enrollment count, progress %, etc.)

**Visual Hierarchy**:
1. Course image (draws attention)
2. Course title (primary text)
3. Level badge (secondary indicator)
4. Description (supporting text)
5. Metadata (tertiary information)
6. Instructor (supporting information)
7. CTA button (action)

**Hover States**:
- Scale: 1.02x
- Shadow: Increased elevation
- Button: Color shift and slight animation
- Background: Subtle gradient overlay

### Search and Filter UI

**Search Input**:
- Placeholder: "Search courses by title or description..."
- Icon: Search icon on left
- Clear button: Appears when text entered
- Debounce: 300ms delay before filtering

**Category Filter**:
- Dropdown with "All Categories" as default
- Options populated from API response
- Shows selected category

**Level Filter**:
- Dropdown with "All Levels" as default
- Options: Beginner, Intermediate, Advanced
- Shows selected level

**Clear Filters Button**:
- Visible only when filters are active
- Resets all filters to defaults
- Positioned right of filters

### Loading and Error States

**Loading State**:
- Skeleton cards with shimmer animation
- 3 skeleton cards per section
- Maintains layout to prevent CLS
- Skeleton height matches card height

**Error State**:
- Error icon and message
- Descriptive error text
- Retry button
- Does not block other sections

**Empty State**:
- Illustration or icon
- Contextual message based on section
- Call-to-action when appropriate
- Different messaging for "no courses" vs "no results from filters"

### Responsive Design Breakpoints

**Mobile (< 640px)**:
- Single column layout
- Full-width cards
- Stacked filters
- Simplified header

**Tablet (640px - 1024px)**:
- 2-column grid
- Adjusted padding
- Horizontal filter layout
- Compact header

**Desktop (> 1024px)**:
- 3-column grid
- Full padding
- Horizontal filter layout
- Full header with descriptions

**Extra Large (> 1280px)**:
- 4-column grid (optional)
- Maximum width container
- Full spacing

### Color Scheme and Typography

**Color Palette** (aligned with Finbers theme):
- **Primary**: `#3B82F6` (Blue) - CTAs, highlights
- **Secondary**: `#06B6D4` (Cyan) - Accents, hover states
- **Success**: `#10B981` (Emerald) - Positive actions
- **Warning**: `#F59E0B` (Amber) - Caution states
- **Destructive**: `#EF4444` (Red) - Decline actions
- **Background**: `#F8FAFC` (Slate 50) - Page background
- **Card**: `#FFFFFF` (White) - Card backgrounds
- **Text Primary**: `#0F172A` (Slate 900) - Main text
- **Text Secondary**: `#64748B` (Slate 500) - Supporting text
- **Border**: `#E2E8F0` (Slate 200) - Dividers

**Typography**:
- **Headings**: Inter, Bold (700), 24px-32px
- **Subheadings**: Inter, Semibold (600), 16px-20px
- **Body**: Inter, Regular (400), 14px-16px
- **Small**: Inter, Regular (400), 12px-13px
- **Buttons**: Inter, Medium (500), 14px

### Interaction Patterns and Animations

**Hover Effects**:
- Card scale: 1.02x with smooth transition (300ms)
- Shadow elevation: Increased depth
- Button color shift: Primary to darker shade
- Icon rotation: Slight rotation on hover

**Click Feedback**:
- Button press: Scale 0.98x
- Ripple effect: Optional ripple animation
- Loading state: Button disabled with spinner

**Transitions**:
- All transitions: 300ms ease-out
- Page transitions: 200ms fade
- Loading animations: Shimmer effect (1.5s loop)

**Micro-interactions**:
- Success toast: Slide in from top, auto-dismiss after 3s
- Error toast: Slide in from top, persistent with close button
- Filter changes: Smooth fade transition
- Pagination: Smooth scroll to top

## State Management Approach

### React Hooks Strategy

**Component State**:
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [selectedLevel, setSelectedLevel] = useState<CourseLevel | null>(null);
const [discoverCourses, setDiscoverCourses] = useState<DiscoverCourse[]>([]);
const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
const [loading, setLoading] = useState({
  discover: true,
  assigned: true,
  enrolled: true,
});
const [error, setError] = useState({
  discover: null as string | null,
  assigned: null as string | null,
  enrolled: null as string | null,
});
const [pagination, setPagination] = useState({
  discover: { page: 1, pageSize: 12 },
  assigned: { page: 1, pageSize: 12 },
  enrolled: { page: 1, pageSize: 12 },
});
```

**Effects**:
- `useEffect` for initial data fetch on mount
- `useEffect` for search/filter debounced API calls
- `useEffect` for pagination changes
- `useCallback` for memoized handlers

**Custom Hooks** (optional):
- `useCourseData`: Manages course fetching and caching
- `useSearchFilter`: Handles search and filter logic
- `usePagination`: Manages pagination state

### Data Fetching Strategy

**Parallel Fetching**:
- Fetch all three sections in parallel on mount
- Use `Promise.all()` for concurrent requests
- Independent error handling per section

**Caching**:
- Cache data in component state
- Invalidate cache on mutations (enroll, accept, decline)
- Optional: Use React Query or SWR for advanced caching

**Pagination**:
- Fetch new page on pagination change
- Maintain scroll position or scroll to top
- Show loading state for new page

## Error Handling

### Error Types and Responses

**Network Errors**:
- Display: "Unable to load courses. Please check your connection."
- Action: Retry button
- Logging: Log error details for debugging

**API Errors**:
- 400 Bad Request: "Invalid request. Please try again."
- 401 Unauthorized: Redirect to login
- 403 Forbidden: "You don't have permission to view this."
- 404 Not Found: "Courses not found."
- 500 Server Error: "Server error. Please try again later."

**Mutation Errors**:
- Enroll failure: "Failed to enroll. Please try again."
- Accept failure: "Failed to accept assignment. Please try again."
- Decline failure: "Failed to decline assignment. Please try again."

### Error Recovery

**Automatic Retry**:
- Retry failed requests after 3 seconds
- Maximum 3 retry attempts
- Exponential backoff: 3s, 6s, 12s

**Manual Retry**:
- Retry button on error state
- User-initiated retry
- Clears previous error message

**Partial Failures**:
- One section failure doesn't block others
- Show error only for affected section
- Other sections load normally

## Testing Strategy

### Unit Tests

**Component Tests**:
- CourseCard renders with correct props
- SearchBar filters trigger callbacks
- Pagination controls work correctly
- Empty states display appropriately
- Loading states show skeleton loaders

**Hook Tests**:
- `useCourseData` fetches data correctly
- `useSearchFilter` filters courses correctly
- `usePagination` manages page state

**Utility Tests**:
- Filter logic combines filters correctly
- Search query matches courses
- Pagination calculations are correct

### Integration Tests

**API Integration**:
- Fetch approved courses endpoint
- Fetch assigned courses endpoint
- Fetch enrolled courses endpoint
- Enroll in course mutation
- Accept assignment mutation
- Decline assignment mutation

**User Flows**:
- Student discovers and enrolls in course
- Student accepts assigned course
- Student declines assigned course
- Student searches and filters courses
- Student navigates between pages

### E2E Tests

**Critical Paths**:
- Complete discover → enroll → learning pathway flow
- Complete assigned → accept → learning pathway flow
- Search and filter functionality
- Error recovery and retry

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Enrolled courses excluded from discover

*For any* student and any course, if the student is enrolled in that course, it SHALL NOT appear in the Discover section.

**Validates: Requirements 1.8**

### Property 2: Enrolled courses excluded from assigned

*For any* student and any assigned course, if the student is enrolled in that course, it SHALL NOT appear in the Assigned section.

**Validates: Requirements 2.8**

### Property 3: Assigned courses filter excludes revoked

*For any* student, the Assigned section SHALL NOT display CourseAssignment records with status REVOKED.

**Validates: Requirements 5.7**

### Property 4: Enrollment count accuracy

*For any* course in the Discover section, the enrollment count displayed SHALL match the actual number of active enrollments for that course.

**Validates: Requirements 1.4**

### Property 5: Progress percentage accuracy

*For any* enrolled course, the progress percentage displayed SHALL equal (lessonsCompleted / lessonsCount) * 100.

**Validates: Requirements 3.4**

### Property 6: Search filters combine with AND logic

*For any* search query and selected filters, the displayed courses SHALL match ALL criteria (title/description contains query AND category matches AND level matches).

**Validates: Requirements 8.4**

### Property 7: Filter state preservation

*For any* section, when the student navigates away and returns, the search and filter state SHALL be preserved within that section.

**Validates: Requirements 8.8**

### Property 8: Pagination state consistency

*For any* section, the pagination state SHALL remain consistent when filters are applied or cleared.

**Validates: Requirements 8.7**

### Property 9: Assignment status reflects database

*For any* assigned course, the displayed status (PENDING, ACCEPTED, DECLINED) SHALL match the status in the CourseAssignment record.

**Validates: Requirements 2.4**

### Property 10: Enrollment creation on accept

*For any* accepted assignment, an Enrollment record SHALL be created with status ACTIVE and progressPercentage = 0.

**Validates: Requirements 12.2, 12.6**