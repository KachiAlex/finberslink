-- WARNING: Review this file before running. This script drops tables identified
-- as non-app (from another project). Only run if you are sure these tables are
-- safe to remove from this database. Backups should exist before running.

-- Example usage (PowerShell):
-- psql $env:DATABASE_URL -f .\scripts\drop-non-app-tables.sql

-- Drop unrelated property/investment/mortgage tables
DROP TABLE IF EXISTS "properties" CASCADE;
DROP TABLE IF EXISTS "property_alerts" CASCADE;
DROP TABLE IF EXISTS "property_inquiries" CASCADE;
DROP TABLE IF EXISTS "saved_properties" CASCADE;

-- Drop unrelated payments/subscriptions tables
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "subscription_payments" CASCADE;
DROP TABLE IF EXISTS "subscription_plans" CASCADE;
DROP TABLE IF EXISTS "subscriptions" CASCADE;

-- Drop unrelated investment/escrow/mortgage tables
DROP TABLE IF EXISTS "investments" CASCADE;
DROP TABLE IF EXISTS "user_investments" CASCADE;
DROP TABLE IF EXISTS "escrow_transactions" CASCADE;
DROP TABLE IF EXISTS "mortgages" CASCADE;
DROP TABLE IF EXISTS "mortgage_applications" CASCADE;
DROP TABLE IF EXISTS "mortgage_banks" CASCADE;

-- Drop unrelated marketplace/support tables
DROP TABLE IF EXISTS "admin_settings" CASCADE;
DROP TABLE IF EXISTS "blog_posts" CASCADE;
DROP TABLE IF EXISTS "conversations" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "support_inquiries" CASCADE;
DROP TABLE IF EXISTS "inspection_requests" CASCADE;
DROP TABLE IF EXISTS "dispute_resolutions" CASCADE;

-- Drop tables that may conflict with our naming (lowercase duplicates)
-- NOTE: Confirm which one your app uses before running these.
-- DROP TABLE IF EXISTS "users" CASCADE;
-- DROP TABLE IF EXISTS "notifications" CASCADE;

-- End of script
