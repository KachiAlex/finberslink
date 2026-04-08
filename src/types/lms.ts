export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type LessonFormat = "video" | "live" | "text" | "project";

export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
}

export interface Resource {
  id: string;
  title: string;
  type: "pdf" | "slide" | "link" | "code" | "video" | "sheet";
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  format: LessonFormat;
  status: "locked" | "available" | "completed";
  summary: string;
  resources: Resource[];
  content?: string;
  videoUrl?: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  tagline: string;
  level: CourseLevel;
  category: string;
  coverImage: string;
  progressPercentage: number;
  lessonsCompleted: number;
  lessonsCount: number;
  nextLessonId?: string;
  instructor: Instructor;
}

export interface CourseDetail extends CourseSummary {
  description: string;
  outcomes: string[];
  skills: string[];
  lessons: Lesson[];
  certificateAvailable: boolean;
}
