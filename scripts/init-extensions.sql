-- PostgreSQL extensions setup for Anchor application
-- This script runs during container initialization

-- Enable pg_cron extension for scheduled data cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pgcrypto for hashing functions (privacy compliance)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable btree_gin for better indexing on JSONB columns
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Grant necessary permissions for pg_cron
GRANT USAGE ON SCHEMA cron TO anchor_app;

-- Log successful extension initialization
DO $$
BEGIN
    RAISE NOTICE 'Anchor PostgreSQL extensions initialized successfully:';
    RAISE NOTICE '  - pg_cron: Enabled for automatic data cleanup';
    RAISE NOTICE '  - pgcrypto: Enabled for privacy-compliant hashing';
    RAISE NOTICE '  - uuid-ossp: Enabled for UUID generation';
    RAISE NOTICE '  - btree_gin: Enabled for JSONB indexing optimization';
END $$;