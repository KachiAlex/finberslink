import {
  PrismaClient,
  CourseLevel,
  LessonFormat,
  ResourceType,
  EnrollmentStatus,
  ResumeVisibility,
  JobType,
  RemoteOption,
  TenantPlanTier,
  TenantStatus,
  NotificationType,
  JobApplicationStatus,
  VolunteerApplicationStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function seedTenant() {
  return prisma.tenant.upsert({
    where: { slug: "finbers-link" },
    update: {
      contactName: "Finbers Operations",
      contactEmail: "ops@finberslink.com",
      updatedAt: new Date(),
    },
    create: {
      id: "tenant_finbers",
      name: "Finbers Link",
      slug: "finbers-link",
      contactName: "Finbers Operations",
      contactEmail: "ops@finberslink.com",
      planTier: TenantPlanTier.PROFESSIONAL,
      status: TenantStatus.ACTIVE,
      settings: {
        create: {
          featureFlags: {
            aiCourseQa: true,
            jobAutoSync: true,
            guardianMode: false,
          },
        },
      },
    },
    include: { settings: true },
  });
}

async function seedUsers(tenantId: string) {
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
      role: "SUPER_ADMIN",
      profile: {
        create: {
          headline: "Finbers Link Super Admin",
          location: "Lagos, Nigeria",
          skills: ["Governance", "Strategy"],
        },
      },
      tenantId,
    },
  });

  const adminOps = await prisma.user.upsert({
    where: { email: "ops@finbers.com" },
    update: {},
    create: {
      id: "user_admin_ops",
      email: "ops@finbers.com",
      passwordHash,
      firstName: "Farida",
      lastName: "Bello",
      role: "ADMIN",
      profile: {
        create: {
          headline: "Operations Lead",
          location: "Abuja, Nigeria",
          skills: ["Ops", "QA"],
        },
      },
      tenantId,
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
      tenantId,
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
      tenantId,
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
      tenantId,
    },
  });

  return { admin, adminOps, instructor, student, employer };
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

async function seedLessons(courseId: string) { /* same as before */ }
```
