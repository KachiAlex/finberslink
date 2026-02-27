import type { CourseDetail, Lesson } from "@/types/lms";

const buildLessons = (courseId: string): Lesson[] => [
  {
    id: `${courseId}-lesson-1`,
    title: "Foundations & mindset",
    durationMinutes: 22,
    format: "video",
    status: "completed",
    summary: "Discover the learner journey, expectations, and success roadmap.",
    resources: [
      {
        id: `${courseId}-res-1`,
        title: "Course overview deck",
        type: "slide",
        url: "https://example.com/resources/overview.pdf",
      },
    ],
  },
  {
    id: `${courseId}-lesson-2`,
    title: "Live workshop: research sprint",
    durationMinutes: 55,
    format: "live",
    status: "available",
    summary: "Participate in a live facilitated session covering discovery research.",
    resources: [
      {
        id: `${courseId}-res-2`,
        title: "Live session board",
        type: "link",
        url: "https://miro.com/app",
      },
    ],
  },
  {
    id: `${courseId}-lesson-3`,
    title: "Project brief & submission",
    durationMinutes: 35,
    format: "project",
    status: "locked",
    summary: "Review the capstone brief and upload your first iteration.",
    resources: [
      {
        id: `${courseId}-res-3`,
        title: "Capstone template",
        type: "code",
        url: "https://github.com/finbers/capstone-template",
      },
    ],
  },
];

export const getCourseById = (courseId: string) =>
  mockCourses.find((course) => course.id === courseId);

export const mockCourses: CourseDetail[] = [
  {
    id: "product-sprint",
    title: "Product Thinking Sprint",
    tagline: "Design impactful solutions with collaborative discovery",
    level: "intermediate",
    category: "Product",
    coverImage:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    progressPercentage: 62,
    lessonsCompleted: 4,
    lessonsCount: 7,
    nextLessonId: "product-sprint-lesson-2",
    instructor: {
      id: "inst-1",
      name: "Selah Ofori",
      title: "Senior Product Manager, Kivu Bank",
      avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    },
    description:
      "Dive into discovery frameworks, impact mapping, and collaborative storytelling to build solutions that resonate with real users.",
    outcomes: [
      "Apply customer discovery templates",
      "Craft measurable success metrics",
      "Facilitate team ideation rituals",
    ],
    skills: ["Discovery", "Storytelling", "Prioritization"],
    lessons: buildLessons("product-sprint"),
    certificateAvailable: true,
  },
  {
    id: "ai-career-lab",
    title: "AI Career Lab",
    tagline: "Use AI responsibly to accelerate your job hunt",
    level: "beginner",
    category: "Career",
    coverImage:
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
    progressPercentage: 28,
    lessonsCompleted: 2,
    lessonsCount: 8,
    nextLessonId: "ai-career-lab-lesson-2",
    instructor: {
      id: "inst-2",
      name: "Isabella Ruiz",
      title: "AI Tutor, FutureLaunch Labs",
      avatarUrl: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
    },
    description:
      "Learn how to co-create resumes, portfolios, and outreach messages with AI responsibly while understanding recruiter expectations.",
    outcomes: [
      "Draft branded resumes with AI",
      "Generate outreach cadences",
      "Build public profile pages",
    ],
    skills: ["AI Prompting", "Branding", "Portfolio"],
    lessons: buildLessons("ai-career-lab"),
    certificateAvailable: false,
  },
];
