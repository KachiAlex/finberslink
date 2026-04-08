SELECT id,migration_name,started_at,finished_at,applied_steps_count
FROM "_prisma_migrations"
WHERE migration_name = '20260325_add_all_missing_course_columns';
