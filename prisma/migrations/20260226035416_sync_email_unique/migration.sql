-- Placeholder migration: 20260226035416_sync_email_unique
-- This migration was applied directly to the database and the original SQL is missing locally.
-- We add a harmless placeholder so Prisma's migration history can be reconciled.

-- No-op: ensure we don't attempt to re-create existing objects.
DO $$
BEGIN
  RAISE NOTICE 'Placeholder migration: no changes applied.';
END$$;
