import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();
const prisma = new PrismaClient();

interface MigrationStats {
  users: number;
  profiles: number;
  jobs: number;
  applications: number;
  courses: number;
  notifications: number;
  errors: string[];
}

const stats: MigrationStats = {
  users: 0,
  profiles: 0,
  jobs: 0,
  applications: 0,
  courses: 0,
  notifications: 0,
  errors: [],
};

async function migrateUsers() {
  console.log('Starting user migration...');
  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
    });

    for (const user of users) {
      try {
        await db.collection('users').doc(user.id).set({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        if (user.profile) {
          await db.collection('profiles').doc(user.profile.id).set({
            id: user.profile.id,
            userId: user.id,
            headline: user.profile.headline || '',
            bio: user.profile.bio || '',
            location: user.profile.location || '',
            skills: user.profile.skills || [],
            interests: user.profile.interests || [],
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          });
          stats.profiles++;
        }

        stats.users++;
      } catch (error) {
        stats.errors.push(`Error migrating user ${user.id}: ${error}`);
      }
    }

    console.log(`✓ Migrated ${stats.users} users and ${stats.profiles} profiles`);
  } catch (error) {
    stats.errors.push(`User migration failed: ${error}`);
    console.error('User migration error:', error);
  }
}

async function migrateJobs() {
  console.log('Starting job migration...');
  try {
    const jobs = await prisma.jobOpportunity.findMany();

    for (const job of jobs) {
      try {
        await db.collection('jobs').doc(job.id).set({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          country: job.country,
          jobType: job.jobType,
          remoteOption: job.remoteOption,
          description: job.description,
          requirements: job.requirements || [],
          tags: job.tags || [],
          salaryRange: job.salaryRange,
          featured: job.featured,
          isActive: job.isActive,
          postedById: job.postedById,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        });

        stats.jobs++;
      } catch (error) {
        stats.errors.push(`Error migrating job ${job.id}: ${error}`);
      }
    }

    console.log(`✓ Migrated ${stats.jobs} jobs`);
  } catch (error) {
    stats.errors.push(`Job migration failed: ${error}`);
    console.error('Job migration error:', error);
  }
}

async function migrateApplications() {
  console.log('Starting job application migration...');
  try {
    const applications = await prisma.jobApplication.findMany();

    for (const app of applications) {
      try {
        await db.collection('jobApplications').doc(app.id).set({
          id: app.id,
          userId: app.userId,
          jobOpportunityId: app.jobOpportunityId,
          resumeId: app.resumeId,
          coverLetter: app.coverLetter,
          status: app.status,
          submittedAt: app.submittedAt,
          updatedAt: app.updatedAt,
        });

        stats.applications++;
      } catch (error) {
        stats.errors.push(`Error migrating application ${app.id}: ${error}`);
      }
    }

    console.log(`✓ Migrated ${stats.applications} job applications`);
  } catch (error) {
    stats.errors.push(`Application migration failed: ${error}`);
    console.error('Application migration error:', error);
  }
}

async function migrateCourses() {
  console.log('Starting course migration...');
  try {
    const courses = await prisma.course.findMany({
      include: {
        lessons: true,
        enrollments: true,
      },
    });

    for (const course of courses) {
      try {
        await db.collection('courses').doc(course.id).set({
          id: course.id,
          title: course.title,
          slug: course.slug,
          tagline: course.tagline,
          description: course.description,
          category: course.category,
          level: course.level,
          coverImage: course.coverImage,
          instructorId: course.instructorId,
          outcomes: course.outcomes || [],
          skills: course.skills || [],
          certificateAvailable: course.certificateAvailable,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        });

        stats.courses++;
      } catch (error) {
        stats.errors.push(`Error migrating course ${course.id}: ${error}`);
      }
    }

    console.log(`✓ Migrated ${stats.courses} courses`);
  } catch (error) {
    stats.errors.push(`Course migration failed: ${error}`);
    console.error('Course migration error:', error);
  }
}

async function migrateNotifications() {
  console.log('Starting notification migration...');
  try {
    const notifications = await prisma.notification.findMany();

    for (const notification of notifications) {
      try {
        await db.collection('notifications').doc(notification.id).set({
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          payload: notification.payload,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
        });

        stats.notifications++;
      } catch (error) {
        stats.errors.push(`Error migrating notification ${notification.id}: ${error}`);
      }
    }

    console.log(`✓ Migrated ${stats.notifications} notifications`);
  } catch (error) {
    stats.errors.push(`Notification migration failed: ${error}`);
    console.error('Notification migration error:', error);
  }
}

async function runMigration() {
  console.log('🚀 Starting Firestore migration...\n');

  try {
    await migrateUsers();
    await migrateJobs();
    await migrateApplications();
    await migrateCourses();
    await migrateNotifications();

    console.log('\n📊 Migration Summary:');
    console.log(`  Users: ${stats.users}`);
    console.log(`  Profiles: ${stats.profiles}`);
    console.log(`  Jobs: ${stats.jobs}`);
    console.log(`  Applications: ${stats.applications}`);
    console.log(`  Courses: ${stats.courses}`);
    console.log(`  Notifications: ${stats.notifications}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`);
      stats.errors.forEach((error) => console.log(`  - ${error}`));
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(stats.errors.length > 0 ? 1 : 0);
  }
}

runMigration();
