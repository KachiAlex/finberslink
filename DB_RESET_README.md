# Database Reset Instructions

If the courses tab is still showing "column does not exist" errors after deployment, the database needs to be completely reset (excluding user data).

## Option 1: Using the TypeScript Reset Script (Recommended)

Run this command in your production environment or locally with a connection to the production database:

```bash
npm run db:reset-courses
```

This will:
1. Drop all non-user tables (Course, Lesson, Exam, ChatSpace, Forum, etc.)
2. Preserve all User, Profile, and authentication data
3. Recreate all tables from the Prisma schema
4. Apply schema changes with `prisma db push`

## Option 2: Manual SQL Reset

If the TypeScript script doesn't work, you can manually run the SQL script:

```bash
psql $DATABASE_URL < scripts/reset-db-exclude-users.sql
npx prisma db push --force
```

## Option 3: Direct PostgreSQL Command

Connect to your production database and run:

```sql
-- Drop all tables EXCEPT User-related ones
DROP TABLE IF EXISTS "Course" CASCADE;
DROP TABLE IF EXISTS "Lesson" CASCADE;
DROP TABLE IF EXISTS "Enrollment" CASCADE;
DROP TABLE IF EXISTS "Exam" CASCADE;
DROP TABLE IF EXISTS "ChatSpace" CASCADE;
DROP TABLE IF EXISTS "ChatThread" CASCADE;
DROP TABLE IF EXISTS "ChatMessage" CASCADE;
DROP TABLE IF EXISTS "ForumThread" CASCADE;
DROP TABLE IF EXISTS "ForumPost" CASCADE;
DROP TABLE IF EXISTS "Job" CASCADE;
DROP TABLE IF EXISTS "VolunteerOpportunity" CASCADE;
-- ... (see scripts/reset-db-exclude-users.sql for complete list)

-- Then run in your application:
npx prisma db push --force
next build
```

## What Gets Preserved

✅ User table and all user data
✅ Profile table
✅ Authentication data (PasswordResetToken, sessions, etc.)
✅ Tenant data (if applicable)

## What Gets Reset

🗑️ All Course, Lesson, Exam data
🗑️ All Enrollment records
🗑️ All Chat and Forum data
🗑️ All Job and Volunteer data
🗑️ All enums and custom types (recreated automatically)

## After Reset

1. The schema will be completely in sync with Prisma schema
2. The courses tab will load without database errors
3. No more "column does not exist" errors
4. All user accounts remain intact

## For Production Deployment

If courses still fail to load after Vercel rebuilds:
1. Go to your production database
2. Run `scripts/reset-db-exclude-users.sql`
3. Redeploy the application
4. Courses tab should now work
