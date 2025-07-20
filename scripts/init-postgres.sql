-- =====================================================
-- WorkFlo PostgreSQL Docker Initialization Script
-- Combines all schema creation scripts for Docker setup
-- =====================================================

-- This file is executed when the PostgreSQL container starts
-- It runs all the schema creation scripts in order

\i /docker-entrypoint-initdb.d/postgres/01-create-schemas.sql
\i /docker-entrypoint-initdb.d/postgres/02-create-tables.sql
\i /docker-entrypoint-initdb.d/postgres/03-create-triggers.sql
\i /docker-entrypoint-initdb.d/postgres/04-seed-data.sql

-- Final completion message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'WorkFlo PostgreSQL database initialization complete';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Schemas: workflo, workflo_identity, workflo_analytics, workflo_audit, workflo_config';
    RAISE NOTICE 'Users: workflo_app, workflo_analytics, workflo_backup';
    RAISE NOTICE 'Demo data: 2 users, 5 tasks, 3 sessions with analytics';
    RAISE NOTICE 'Ready for application connection';
    RAISE NOTICE '=================================================';
END
$$;