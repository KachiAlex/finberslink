#!/usr/bin/env node

const { Client } = require('pg');

async function ensureDbSchema() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    // Ensure Profile phone and address columns exist.
    await client.query('ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "phone" TEXT');
    await client.query('ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "address" TEXT');
    await client.query('ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "certifications" JSONB DEFAULT \'[]\'');
    await client.query('ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "education" JSONB');
    await client.query('ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "skills" TEXT[] DEFAULT ARRAY[]::TEXT[]');
    await client.query('ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "interests" TEXT[] DEFAULT ARRAY[]::TEXT[]');

    // Ensure Course columns used by admin/tutor workflows exist.
    await client.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "pendingEdit" JSONB');
    await client.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "hasPendingEdit" BOOLEAN NOT NULL DEFAULT FALSE');
    await client.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3)');

    // Ensure enrollment uniqueness used by application logic when data allows it.
    await client.query(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Enrollment_userId_courseId_key'
  ) THEN
    CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");
  END IF;
EXCEPTION
  WHEN unique_violation THEN NULL;
END
$$;
`);

    // Ensure enum exists for assignment table.
    await client.query(`
DO $$
BEGIN
  CREATE TYPE "CourseAssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
`);

    // Ensure assignment table exists.
    await client.query(`
CREATE TABLE IF NOT EXISTS "CourseAssignment" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "assignedById" TEXT NOT NULL,
  "status" "CourseAssignmentStatus" NOT NULL DEFAULT 'PENDING',
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "CourseAssignment_pkey" PRIMARY KEY ("id")
);
`);

    await client.query('CREATE INDEX IF NOT EXISTS "CourseAssignment_courseId_idx" ON "CourseAssignment"("courseId")');
    await client.query('CREATE INDEX IF NOT EXISTS "CourseAssignment_studentId_idx" ON "CourseAssignment"("studentId")');

    await client.query(`
DO $$
BEGIN
  ALTER TABLE "CourseAssignment"
    ADD CONSTRAINT "CourseAssignment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN SQLSTATE '42830' THEN NULL;
END
$$;
`);

    await client.query(`
DO $$
BEGIN
  ALTER TABLE "CourseAssignment"
    ADD CONSTRAINT "CourseAssignment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN SQLSTATE '42830' THEN NULL;
END
$$;
`);

    await client.query(`
DO $$
BEGIN
  ALTER TABLE "CourseAssignment"
    ADD CONSTRAINT "CourseAssignment_assignedById_fkey"
    FOREIGN KEY ("assignedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN SQLSTATE '42830' THEN NULL;
END
$$;
`);

    const verify = await client.query(`
SELECT
  to_regclass('public."CourseAssignment"')::text AS course_assignment_table,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Course' AND column_name='pendingEdit'
  ) AS has_pending_edit,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Course' AND column_name='hasPendingEdit'
  ) AS has_pending_flag,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Course' AND column_name='archivedAt'
  ) AS has_archived_at,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Profile' AND column_name='phone'
  ) AS has_phone_column,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Profile' AND column_name='address'
  ) AS has_address_column,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Profile' AND column_name='certifications'
  ) AS has_certifications_column,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Profile' AND column_name='education'
  ) AS has_education_column,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Profile' AND column_name='skills'
  ) AS has_skills_column,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Profile' AND column_name='interests'
  ) AS has_interests_column
`);

    const row = verify.rows[0] || {};
    if (!row.course_assignment_table || !row.has_pending_edit || !row.has_pending_flag || !row.has_archived_at || 
        !row.has_phone_column || !row.has_address_column || !row.has_certifications_column || 
        !row.has_education_column || !row.has_skills_column || !row.has_interests_column) {
      throw new Error('Schema verification failed after ensure step.');
    }

    console.log('Schema ensure complete:', row);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  ensureDbSchema().catch((error) => {
    console.error('Schema ensure failed:', error.message);
    process.exit(1);
  });
}

module.exports = { ensureDbSchema };
