SELECT table_name FROM information_schema.tables WHERE table_name IN ('Course','Resume','ResumeEducation') ORDER BY table_name;
SELECT count(*) AS course_count FROM "Course";
SELECT count(*) AS resume_count FROM "Resume";
SELECT count(*) AS resume_edu_count FROM "ResumeEducation";
SELECT id, title, slug FROM "Course" ORDER BY id LIMIT 5;
SELECT id, slug, "ownerId" FROM "Resume" ORDER BY id LIMIT 5;
