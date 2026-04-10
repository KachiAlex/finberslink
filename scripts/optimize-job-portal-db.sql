-- Job Portal Database Optimization Script
-- This script adds missing indexes and optimizes the database for better performance

-- ========================================
-- JOB OPPORTUNITY INDEXES
-- ========================================

-- Composite index for search functionality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_search_composite 
ON "JobOpportunity" (isActive, featured, createdAt DESC, jobType, remoteOption);

-- Full-text search index (if using PostgreSQL)
-- Note: This requires the pg_trgm extension
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_fulltext 
-- ON "JobOpportunity" USING gin(to_tsvector('english', title || ' ' || company || ' ' || coalesce(description, '')));

-- Index for salary range filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_range 
ON "JobOpportunity" (salaryRange) WHERE salaryRange IS NOT NULL;

-- Index for advanced filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_experience_level 
ON "JobOpportunity" (experienceLevel) WHERE experienceLevel IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_size 
ON "JobOpportunity" (companySize) WHERE companySize IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_industry 
ON "JobOpportunity" (industry) WHERE industry IS NOT NULL;

-- GIN index for array fields (benefits, tags)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_benefits_gin 
ON "JobOpportunity" USING gin(benefits) WHERE array_length(benefits, 1) > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_tags_gin 
ON "JobOpportunity" USING gin(tags) WHERE array_length(tags, 1) > 0;

-- Index for company and location search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_location 
ON "JobOpportunity" (company, location, country);

-- Index for posted within queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at 
ON "JobOpportunity" (createdAt DESC);

-- ========================================
-- JOB APPLICATION INDEXES
-- ========================================

-- Composite index for user applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_status 
ON "JobApplication" (userId, status, submittedAt DESC);

-- Index for job applications with status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_status 
ON "JobApplication" (jobOpportunityId, status, submittedAt DESC);

-- Index for application tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_submitted_at 
ON "JobApplication" (submittedAt DESC);

-- ========================================
-- JOB SAVE INDEXES
-- ========================================

-- Index for user saved jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saves_user_created 
ON "JobSave" (userId, createdAt DESC);

-- Index for job popularity (save count)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saves_job_count 
ON "JobSave" (jobOpportunityId);

-- ========================================
-- APPLICATION DRAFT INDEXES
-- ========================================

-- Composite index for user drafts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drafts_user_last_saved 
ON "ApplicationDraft" (userId, lastSavedAt DESC);

-- Index for draft cleanup (old drafts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drafts_last_saved_at 
ON "ApplicationDraft" (lastSavedAt ASC);

-- ========================================
-- JOB VIEW INDEXES
-- ========================================

-- Composite index for view tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_job_timestamp 
ON "JobView" (jobId, timestamp DESC);

-- Index for user view history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_user_timestamp 
ON "JobView" (userId, timestamp DESC) WHERE userId IS NOT NULL;

-- ========================================
-- USER PROFILE INDEXES
-- ========================================

-- Index for profile skills (for job matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_skills_gin 
ON "Profile" USING gin(skills) WHERE array_length(skills, 1) > 0;

-- Index for profile location
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_location 
ON "Profile" (location) WHERE location IS NOT NULL;

-- ========================================
-- RESUME INDEXES
-- ========================================

-- Index for resume skills (for job matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_skills_gin 
ON "Resume" USING gin(skills) WHERE array_length(skills, 1) > 0;

-- Index for resume target roles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_target_roles_gin 
ON "Resume" USING gin(targetRoles) WHERE array_length(targetRoles, 1) > 0;

-- Index for resume experience level
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_years_experience 
ON "Resume" (yearsExperience) WHERE yearsExperience IS NOT NULL;

-- ========================================
-- JOB ALERT INDEXES
-- ========================================

-- Composite index for active job alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_user_active 
ON "JobAlert" (userId, isActive) WHERE isActive = true;

-- GIN index for alert keywords
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_keywords_gin 
ON "JobAlert" USING gin(keywords) WHERE array_length(keywords, 1) > 0;

-- ========================================
-- PERFORMANCE OPTIMIZATION
-- ========================================

-- Update table statistics for better query planning
ANALYZE "JobOpportunity";
ANALYZE "JobApplication";
ANALYZE "JobSave";
ANALYZE "ApplicationDraft";
ANALYZE "JobView";
ANALYZE "Profile";
ANALYZE "Resume";
ANALYZE "JobAlert";

-- ========================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ========================================

-- Index for active jobs only (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_only 
ON "JobOpportunity" (createdAt DESC) WHERE isActive = true;

-- Index for featured jobs only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_featured_only 
ON "JobOpportunity" (createdAt DESC) WHERE featured = true AND isActive = true;

-- Index for recent applications (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_recent 
ON "JobApplication" (submittedAt DESC) WHERE submittedAt > NOW() - INTERVAL '30 days';

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for active jobs with application counts
CREATE OR REPLACE VIEW active_jobs_with_stats AS
SELECT 
    jo.*,
    COUNT(ja.id) as application_count,
    COUNT(jv.id) as view_count
FROM "JobOpportunity" jo
LEFT JOIN "JobApplication" ja ON jo.id = ja.jobOpportunityId
LEFT JOIN "JobView" jv ON jo.id = jv.jobId
WHERE jo.isActive = true
GROUP BY jo.id;

-- View for user job activity
CREATE OR REPLACE VIEW user_job_activity AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT ja.id) as applications_submitted,
    COUNT(DISTINCT js.id) as jobs_saved,
    COUNT(DISTINCT ad.id) as drafts_created,
    MAX(ja.submittedAt) as last_application_date
FROM "User" u
LEFT JOIN "JobApplication" ja ON u.id = ja.userId
LEFT JOIN "JobSave" js ON u.id = js.userId
LEFT JOIN "ApplicationDraft" ad ON u.id = ad.userId
GROUP BY u.id, u.email;

-- ========================================
-- TRIGGERS FOR MAINTENANCE
-- ========================================

-- Trigger to update application count on job opportunity
CREATE OR REPLACE FUNCTION update_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "JobOpportunity" 
        SET applicationCount = applicationCount + 1 
        WHERE id = NEW.jobOpportunityId;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "JobOpportunity" 
        SET applicationCount = applicationCount - 1 
        WHERE id = OLD.jobOpportunityId;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_application_count'
    ) THEN
        CREATE TRIGGER trigger_update_application_count
        AFTER INSERT OR DELETE ON "JobApplication"
        FOR EACH ROW EXECUTE FUNCTION update_application_count();
    END IF;
END
$$;

-- ========================================
-- CLEANUP FUNCTIONS
-- ========================================

-- Function to clean up old drafts (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "ApplicationDraft" 
    WHERE lastSavedAt < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old job views (older than 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_job_views()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "JobView" 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- MONITORING QUERIES
-- ========================================

-- Query to check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
ORDER BY idx_scan DESC;

-- Query to check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Query to check slow queries (requires pg_stat_statements extension)
-- SELECT query, calls, total_time, mean_time, rows
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE 'Job Portal Database Optimization Complete!';
    RAISE NOTICE 'Created indexes for:';
    RAISE NOTICE '  - JobOpportunity table (search, filters, arrays)';
    RAISE NOTICE '  - JobApplication table (user queries, status tracking)';
    RAISE NOTICE '  - ApplicationDraft table (user drafts, cleanup)';
    RAISE NOTICE '  - JobView table (analytics, tracking)';
    RAISE NOTICE '  - Supporting tables (Profile, Resume, JobAlert)';
    RAISE NOTICE '';
    RAISE NOTICE 'Added performance optimizations:';
    RAISE NOTICE '  - Partial indexes for common queries';
    RAISE NOTICE '  - Views for complex aggregations';
    RAISE NOTICE '  - Triggers for maintaining counts';
    RAISE NOTICE '  - Cleanup functions for maintenance';
    RAISE NOTICE '';
    RAISE NOTICE 'Remember to:';
    RAISE NOTICE '  1. Run ANALYZE after large data imports';
    RAISE NOTICE '  2. Monitor index usage with provided queries';
    RAISE NOTICE '  3. Schedule regular cleanup of old data';
    RAISE NOTICE '  4. Consider partitioning for very large tables';
END $$;
