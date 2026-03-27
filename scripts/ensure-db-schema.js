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
    // Ensure Course columns used by admin/tutor workflows exist.
    await client.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "pendingEdit" JSONB');
    await client.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "hasPendingEdit" BOOLEAN NOT NULL DEFAULT FALSE');
    await client.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3)');

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
  ) AS has_archived_at
`);

    const row = verify.rows[0] || {};
    if (!row.course_assignment_table || !row.has_pending_edit || !row.has_pending_flag || !row.has_archived_at) {
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
