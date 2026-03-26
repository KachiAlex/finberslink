UPDATE "_prisma_migrations"
SET checksum = 'manual-applied',
    finished_at = now(),
    applied_steps_count = 1
WHERE migration_name = '20260325_add_all_missing_course_columns';
