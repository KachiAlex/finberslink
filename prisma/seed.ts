// Prisma seed file - not used with Firestore migration
// This file is kept for reference but is no longer executed
// Firestore seeding should be done through the migration script instead

/*
async function seedUsers() {
  const passwordHash = "$argon2id$v=19$m=65536,t=3,p=4$demo$FinbersSeed";

  const admin = await prisma.user.upsert({
    where: { email: "admin@finbers.com" },
    update: {},
    create: {
      id: "user_admin",
      email: "admin@finbers.com",
      passwordHash,
      firstName: "Amara",
      lastName: "Okafor",
      role: "ADMIN",
      profile: {
        create: {
          headline: "Finbers Link Super Admin",
          location: "Lagos, Nigeria",
          skills: ["Governance", "Strategy"],
        },
      },
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@finbers.com" },
    update: {},
    create: {
      id: "user_instructor",
      email: "instructor@finbers.com",
      passwordHash,
      firstName: "Kwame",
      lastName: "Mensah",
      role: "TUTOR",
      profile: {
        create: {
          headline: "Product Strategist @ Impact CoLab",
          location: "Accra, Ghana",
          skills: ["Product Strategy", "Design Research", "Systems Thinking"],
        },
      },
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@finbers.com" },
    update: {},
    create: {
      id: "user_student",
      email: "student@finbers.com",
      passwordHash,
      firstName: "Leila",
      lastName: "Adekunle",
      role: "STUDENT",
      profile: {
        create: {
          headline: "Service Design Fellow",
          location: "Nairobi, Kenya",
          skills: ["UX Research", "Prototyping"],
        },
      },
    },
  });

  const employer = await prisma.user.upsert({
    where: { email: "employer@finbers.com" },
    update: {},
    create: {
      id: "user_employer",
      email: "employer@finbers.com",
      passwordHash,
      firstName: "Carmen",
      lastName: "Blake",
      role: "EMPLOYER",
      profile: {
        create: {
          headline: "Talent Lead @ Equinox Impact",
          location: "Toronto, Canada",
          skills: ["Talent Acquisition", "Coaching"],
        },
      },
    },
  });

  return { admin, instructor, student, employer };
}

async function seedCourse(instructorId: string) {
  return prisma.course.upsert({
    where: { slug: "product-strategy-lab" },
    update: {
      title: "Product Strategy Lab",
      tagline: "Design bold services that launch careers",
      description:
        "A five-week studio where fellows learn to translate research into outcome-driven roadmaps, stakeholder stories, and launch experiments.",
      level: CourseLevel.INTERMEDIATE,
      category: "Product & Service Design",
      coverImage:
        "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
      certificateAvailable: true,
      outcomes: {
        set: [
          "Apply customer discovery templates",
          "Craft measurable success metrics",
          "Facilitate team ideation rituals",
        ],
      },
      skills: {
        set: ["Discovery", "Storytelling", "Prioritization"],
      },
      instructorId,
    },
    create: {
      id: "course_product_strategy_lab",
      slug: "product-strategy-lab",
      title: "Product Strategy Lab",
      tagline: "Design bold services that launch careers",
      description:
        "A five-week studio where fellows learn to translate research into outcome-driven roadmaps, stakeholder stories, and launch experiments.",
      level: CourseLevel.INTERMEDIATE,
      category: "Product & Service Design",
      coverImage:
        "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
      certificateAvailable: true,
      outcomes: [
        "Apply customer discovery templates",
        "Craft measurable success metrics",
        "Facilitate team ideation rituals",
      ],
      skills: ["Discovery", "Storytelling", "Prioritization"],
      instructorId,
    },
  });
}

async function seedLessons(courseId: string) {
  const lessonData = [
    {
      id: "lesson_discovery_canvas",
      slug: "discovery-sprint-canvas",
      title: "Discovery Sprint Canvas",
      order: 1,
      durationMinutes: 38,
      format: LessonFormat.VIDEO,
      summary:
        "Move from raw interviews to a discovery map using the Finbers Sprint Canvas and stakeholder signatures.",
      content:
        "We explore how to cluster interviews, synthesize signal, and convert uncertainty into design sprints that matter.",
      videoUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
      resources: [
        {
          title: "Sprint Canvas Template",
          type: ResourceType.PDF,
          url: "https://assets.finbers.link/resources/sprint-canvas.pdf",
        },
        {
          title: "Interview Insight Board",
          type: ResourceType.SLIDE,
          url: "https://assets.finbers.link/resources/insight-board.fig",
        },
      ],
    },
    {
      id: "lesson_value_story",
      slug: "value-story-toolkit",
      title: "Value Story Toolkit",
      order: 2,
      durationMinutes: 42,
      format: LessonFormat.TEXT,
      summary:
        "Turn research hunches into value propositions that investors, mentors, and hiring partners can react to quickly.",
      content:
        "We outline the four-part Finbers value story and run through examples from employment accelerators across Africa.",
      videoUrl: null,
      resources: [
        {
          title: "Value Story Workspace",
          type: ResourceType.LINK,
          url: "https://finbers.notion.site/value-story",
        },
      ],
    },
    {
      id: "lesson_experiment_arc",
      slug: "experiment-arc",
      title: "Experiment Arc",
      order: 3,
      durationMinutes: 50,
      format: LessonFormat.LIVE,
      summary: "Design multi-week experiments and establish accountability rituals with employers and mentors.",
      content:
        "We craft experiment arcs with measurable hiring outcomes, identify risks, and build break-glass recovery plans.",
      videoUrl: null,
      resources: [
        {
          title: "Experiment Arc Brief",
          type: ResourceType.PDF,
          url: "https://assets.finbers.link/resources/experiment-arc.pdf",
        },
      ],
    },
  ];

  for (const lesson of lessonData) {
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {
        courseId,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
        format: lesson.format,
        summary: lesson.summary,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        resources: {
          deleteMany: {},
          create: lesson.resources.map((resource, index) => ({
            id: `${lesson.id}_resource_${index}`,
            title: resource.title,
            type: resource.type,
            url: resource.url,
          })),
        },
      },
      create: {
        id: lesson.id,
        courseId,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
        format: lesson.format,
        summary: lesson.summary,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        resources: {
          create: lesson.resources.map((resource, index) => ({
            id: `${lesson.id}_resource_${index}`,
            title: resource.title,
            type: resource.type,
            url: resource.url,
          })),
        },
      },
    });
  }
}

async function seedEnrollment(courseId: string, studentId: string) {
  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: studentId, courseId } },
    update: {
      status: EnrollmentStatus.ACTIVE,
      progressPercentage: 30,
    },
    create: {
      id: "enrollment_student_course",
      userId: studentId,
      courseId,
      status: EnrollmentStatus.ACTIVE,
      progressPercentage: 30,
    },
  });

  const lessons = await prisma.lesson.findMany({ where: { courseId }, orderBy: { order: "asc" } });
  for (const [index, lesson] of lessons.entries()) {
    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
      update: {
        status: index === 0 ? LessonProgressStatus.COMPLETED : LessonProgressStatus.IN_PROGRESS,
        completedAt: index === 0 ? new Date() : null,
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
        status: index === 0 ? LessonProgressStatus.COMPLETED : LessonProgressStatus.IN_PROGRESS,
        completedAt: index === 0 ? new Date() : null,
      },
    });
  }
}

async function seedForum(courseId: string, instructorId: string, studentId: string) {
  const thread = await prisma.forumThread.upsert({
    where: { id: "thread_course_launch" },
    update: {
      title: "Kickoff reflections",
      courseId,
      authorId: instructorId,
    },
    create: {
      id: "thread_course_launch",
      title: "Kickoff reflections",
      courseId,
      authorId: instructorId,
    },
  });

  await prisma.forumPost.upsert({
    where: { id: "post_instructor_intro" },
    update: {
      content: "Welcome to the lab! Drop your sprint canvas screenshots below.",
    },
    create: {
      id: "post_instructor_intro",
      threadId: thread.id,
      authorId: instructorId,
      content: "Welcome to the lab! Drop your sprint canvas screenshots below.",
    },
  });

  await prisma.forumPost.upsert({
    where: { id: "post_student_reply" },
    update: {
      content: "Sharing my interview clusters—would love feedback before the office hours.",
    },
    create: {
      id: "post_student_reply",
      threadId: thread.id,
      authorId: studentId,
      content: "Sharing my interview clusters—would love feedback before the office hours.",
      parentId: "post_instructor_intro",
    },
  });
}

async function seedResume(studentId: string) {
  const resume = await prisma.resume.upsert({
    where: { slug: "leila-product-story" },
    update: {
      summary: "Product storyteller focused on inclusive labor platforms across Africa.",
    },
    create: {
      id: "resume_leila",
      userId: studentId,
      title: "Leila Adekunle — Product Story",
      slug: "leila-product-story",
      summary: "Product storyteller focused on inclusive labor platforms across Africa.",
      skills: ["Service Design", "Qualitative Research", "Pitch Narratives"],
      visibility: ResumeVisibility.NETWORK,
      experiences: {
        create: [
          {
            id: "experience_collective",
            company: "Collective Credit",
            role: "Community Strategist",
            startDate: new Date("2023-01-01"),
            endDate: null,
            description: "Led partner discovery sprints across 4 labor innovation hubs.",
            achievements: ["Raised 200k USD in employer co-investment"],
            order: 0,
          },
        ],
      },
      projects: {
        create: [
          {
            id: "project_gig_portal",
            name: "Gig Safety Portal",
            summary: "Codeveloped a reporting loop for platform workers across East Africa.",
            techStack: ["Next.js", "Supabase", "Mapbox"],
            order: 0,
          },
        ],
      },
    },
  });

  return resume;
}

async function seedOpportunities(employerId: string, studentId: string, resumeId: string) {
  const job = await prisma.jobOpportunity.upsert({
    where: { id: "job_service_designer" },
    update: {
      postedById: employerId,
    },
    create: {
      id: "job_service_designer",
      slug: "service-designer-youth-employability",
      title: "Service Designer, Youth Employability",
      company: "Equinox Impact",
      location: "Hybrid — Nairobi / Remote",
      country: "Kenya",
      jobType: JobType.FULL_TIME,
      remoteOption: RemoteOption.HYBRID,
      salaryRange: "$55k - $65k",
      description: "Lead research sprints with employers and fellows launching service blueprints.",
      requirements: [
        "3+ years in service design",
        "Experience facilitating workshops",
      ],
      tags: ["Service Design", "Employment"],
      postedById: employerId,
    },
  });

  await prisma.jobApplication.upsert({
    where: { id: "job_app_student" },
    update: {
      status: JobApplicationStatus.REVIEWING,
    },
    create: {
      id: "job_app_student",
      userId: studentId,
      jobOpportunityId: job.id,
      resumeId,
      status: JobApplicationStatus.SUBMITTED,
    },
  });

  const volunteer = await prisma.volunteerOpportunity.upsert({
    where: { id: "volunteer_story_coach" },
    update: {
      postedById: employerId,
    },
    create: {
      id: "volunteer_story_coach",
      title: "Story Coach, Inclusive Hiring Studio",
      organization: "Amplify Futures",
      location: "Virtual",
      country: "Global",
      description: "Coach fellows on value storytelling ahead of the talent summit.",
      commitment: "5 weeks, 4hrs/week",
      skills: ["Coaching", "Storytelling"],
      isRemote: true,
      postedById: employerId,
    },
  });

  await prisma.volunteerApplication.upsert({
    where: { id: "volunteer_app_student" },
    update: {
      status: VolunteerApplicationStatus.CONFIRMED,
    },
    create: {
      id: "volunteer_app_student",
      userId: studentId,
      volunteerOpportunityId: volunteer.id,
      status: VolunteerApplicationStatus.SUBMITTED,
    },
  });
}

async function seedNotifications(studentId: string) {
  await prisma.notification.createMany({
    data: [
      {
        id: "notification_lesson_release",
        userId: studentId,
        type: NotificationType.LESSON_RELEASE,
        payload: { courseSlug: "product-strategy-lab", lessonSlug: "experiment-arc" },
      },
      {
        id: "notification_application",
        userId: studentId,
        type: NotificationType.APPLICATION_STATUS,
        payload: { jobTitle: "Service Designer", status: JobApplicationStatus.REVIEWING },
      },
    ],
    skipDuplicates: true,
  });
}

async function main() {
  const { instructor, student, employer } = await seedUsers();
  const course = await seedCourse(instructor.id);
  await seedLessons(course.id);
  await seedEnrollment(course.id, student.id);
  await seedForum(course.id, instructor.id, student.id);
  const resume = await seedResume(student.id);
  await seedOpportunities(employer.id, student.id, resume.id);
  await seedNotifications(student.id);
}

main()
  .then(() => {
    console.log("Seed data loaded successfully");
  })
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
*/

// Placeholder for Firestore seeding
console.log("Prisma seed file is disabled. Use migration script instead.");
