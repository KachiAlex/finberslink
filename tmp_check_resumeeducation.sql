SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = 'ResumeEducation' OR table_name = 'resumeeducation' OR table_name ILIKE '%resumeeducation%';
SELECT count(*) AS resume_count FROM "Resume"; SELECT count(*) AS resumeeducation_count FROM "ResumeEducation";
