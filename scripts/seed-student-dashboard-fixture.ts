import {
  PrismaClient,
  Prisma,
  EnrollmentStatus,
  JobApplicationStatus,
  ResumeVisibility,
  CourseLevel,
  JobType,
  RemoteOption,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const student = await prisma.user.findUnique({ where: { email: "student@finberslink.com" } });
  if (!student) {
    throw new Error("Student user student@finberslink.com not found");
  }

  const instructor =
    (await prisma.user.findFirst({ where: { role: "TUTOR" }, select: { id: true } })) ??
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } })) ??
    { id: student.id };

  const course = await prisma.course.upsert({
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
      instructorId: instructor.id,
    },
    create: {
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
      instructorId: instructor.id,
    },
  });

  const skillSnapshot: Prisma.InputJsonValue = {
    hardSkills: ["Product Strategy", "User Research", "Experimentation", "Roadmapping"],
    softSkills: ["Stakeholder Management", "Storytelling", "Facilitation"],
    suggestedSkills: ["SQL", "Service Blueprinting", "Growth Analytics"],
    prioritySkills: ["Product Strategy", "Experimentation", "Stakeholder Management"],
  };

  const resume = await prisma.resume.upsert({
    where: { slug: "student-product-strategist" },
    update: {
      summary:
        "Product strategist blending UX research with lean experiments to launch student-focused services across Africa.",
      skills: ["Product Strategy", "User Research", "Storytelling", "Figma", "SQL"],
      topSkills: ["Product Strategy", "User Research", "Storytelling"],
      targetRoles: ["Product Strategist", "Service Designer"],
      targetIndustry: "Edtech",
      personaName: "Momentum Builder",
      skillAnalysisSnapshot: skillSnapshot,
    },
    create: {
      slug: "student-product-strategist",
      title: "Product Strategist Resume",
      userId: student.id,
      summary:
        "Product strategist blending UX research with lean experiments to launch student-focused services across Africa.",
      skills: ["Product Strategy", "User Research", "Storytelling", "Figma", "SQL"],
      topSkills: ["Product Strategy", "User Research", "Storytelling"],
      targetRoles: ["Product Strategist", "Service Designer"],
      targetIndustry: "Edtech",
      personaName: "Momentum Builder",
      visibility: ResumeVisibility.NETWORK,
      skillAnalysisSnapshot: skillSnapshot,
    },
  });

  await prisma.resumeExperience.deleteMany({ where: { resumeId: resume.id } });

  await prisma.resumeExperience.createMany({
    data: [
      {
        resumeId: resume.id,
        company: "Campus Launch Lab",
        role: "Product Strategist",
        description:
          "Led service blueprinting and pilot launches for a peer-coaching product used by 1.2k students across 5 universities.",
        achievements: [
          "Increased NPS from 21 to 54 by introducing weekly reflection sprints",
          "Reduced onboarding drop-off by 30% via async micro-lessons",
        ],
        startDate: new Date("2024-01-01"),
        endDate: null,
        order: 0,
      },
      {
        resumeId: resume.id,
        company: "Equinox Impact",
        role: "Product Operations Fellow",
        description:
          "Coordinated insight synthesis and go-to-market experiments for career accelerators in Lagos and Nairobi.",
        achievements: [
          "Launched a referral engine that drove 18% week-over-week growth",
          "Packaged hiring stories that unlocked 4 partner employers",
        ],
        startDate: new Date("2022-06-01"),
        endDate: new Date("2023-12-01"),
        order: 1,
      },
    ],
  });

  const enrollment = await prisma.enrollment.upsert({
    where: { id: "enrollment_student_strategy_lab" },
    update: {
      progressPercentage: 32,
      status: EnrollmentStatus.ACTIVE,
    },
    create: {
      id: "enrollment_student_strategy_lab",
      userId: student.id,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
      progressPercentage: 32,
    },
  });

  const job = await prisma.jobOpportunity.upsert({
    where: { slug: "nextgen-service-designer" },
    update: {
      title: "NextGen Service Designer",
      company: "Orbit Labs",
      country: "Nigeria",
      location: "Remote",
      jobType: JobType.FULL_TIME,
      remoteOption: RemoteOption.HYBRID,
      description: "Design and scale learning services for early-career talent cohorts.",
      requirements: ["Service blueprinting", "Experimentation", "Stakeholder workshops"],
      tags: ["Product", "Strategy"],
    },
    create: {
      id: "job_nextgen_service_designer",
      slug: "nextgen-service-designer",
      title: "NextGen Service Designer",
      company: "Orbit Labs",
      country: "Nigeria",
      location: "Remote",
      jobType: "FULL_TIME",
      remoteOption: "HYBRID",
      description: "Design and scale learning services for early-career talent cohorts.",
      requirements: ["Service blueprinting", "Experimentation", "Stakeholder workshops"],
      tags: ["Product", "Strategy"],
    },
  });

  await prisma.jobApplication.upsert({
    where: { id: "application_student_orbit" },
    update: {
      status: JobApplicationStatus.INTERVIEW,
      updatedAt: new Date(),
      resumeId: resume.id,
    },
    create: {
      id: "application_student_orbit",
      userId: student.id,
      jobOpportunityId: job.id,
      resumeId: resume.id,
      status: JobApplicationStatus.INTERVIEW,
    },
  });

  console.log("Seeded student resume, experiences, enrollment, and job pipeline.");
}

main()
  .catch((error) => {
    console.error("Failed seeding student fixture", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
