-- =====================================================
-- WorkFlo PostgreSQL Schema Creation Script
-- Privacy-first, ADHD-focused task management schemas
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- SCHEMA DEFINITIONS
-- =====================================================

-- Core application data (tasks, sessions)
CREATE SCHEMA IF NOT EXISTS workflo;

-- User management and authentication 
CREATE SCHEMA IF NOT EXISTS workflo_identity;

-- Analytics and metrics (privacy-aware)
CREATE SCHEMA IF NOT EXISTS workflo_analytics;

-- Audit and operational logs
CREATE SCHEMA IF NOT EXISTS workflo_audit;

-- Configuration and system settings
CREATE SCHEMA IF NOT EXISTS workflo_config;

-- =====================================================
-- USER ROLES AND PERMISSIONS
-- =====================================================

-- Application service account
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'workflo_app') THEN
        CREATE ROLE workflo_app WITH LOGIN PASSWORD 'workflo_app_secure_password_2024!';
    END IF;
END
$$;

-- Read-only analytics account
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'workflo_analytics') THEN
        CREATE ROLE workflo_analytics WITH LOGIN PASSWORD 'workflo_analytics_read_2024!';
    END IF;
END
$$;

-- Backup account
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'workflo_backup') THEN
        CREATE ROLE workflo_backup WITH LOGIN PASSWORD 'workflo_backup_secure_2024!';
    END IF;
END
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Application account - Full access to core schemas
GRANT USAGE ON SCHEMA workflo TO workflo_app;
GRANT USAGE ON SCHEMA workflo_identity TO workflo_app;
GRANT USAGE ON SCHEMA workflo_analytics TO workflo_app;
GRANT USAGE ON SCHEMA workflo_audit TO workflo_app;
GRANT USAGE ON SCHEMA workflo_config TO workflo_app;

GRANT CREATE ON SCHEMA workflo TO workflo_app;
GRANT CREATE ON SCHEMA workflo_identity TO workflo_app;
GRANT CREATE ON SCHEMA workflo_analytics TO workflo_app;
GRANT CREATE ON SCHEMA workflo_audit TO workflo_app;
GRANT CREATE ON SCHEMA workflo_config TO workflo_app;

-- Analytics account - Read-only access
GRANT USAGE ON SCHEMA workflo_analytics TO workflo_analytics;
GRANT USAGE ON SCHEMA workflo_audit TO workflo_analytics;

-- Backup account - Read access to all schemas
GRANT USAGE ON SCHEMA workflo TO workflo_backup;
GRANT USAGE ON SCHEMA workflo_identity TO workflo_backup;
GRANT USAGE ON SCHEMA workflo_analytics TO workflo_backup;
GRANT USAGE ON SCHEMA workflo_audit TO workflo_backup;
GRANT USAGE ON SCHEMA workflo_config TO workflo_backup;

-- =====================================================
-- COMMON FUNCTIONS
-- =====================================================

-- Function to generate privacy-safe user hashes
CREATE OR REPLACE FUNCTION workflo.generate_user_hash(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(user_id::text || current_date::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION workflo_audit.log_operation(
    schema_name TEXT,
    table_name TEXT,
    operation TEXT,
    entity_id UUID,
    user_id UUID DEFAULT NULL,
    additional_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO workflo_audit.operation_logs (
        schema_name,
        table_name,
        operation,
        entity_id,
        user_hash,
        additional_data,
        created_at
    ) VALUES (
        schema_name,
        table_name,
        operation,
        entity_id,
        CASE WHEN user_id IS NOT NULL THEN workflo.generate_user_hash(user_id) ELSE NULL END,
        additional_data,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEMA COMMENTS
-- =====================================================

COMMENT ON SCHEMA workflo IS 'Core application data: tasks, sessions, and focus management';
COMMENT ON SCHEMA workflo_identity IS 'User identity and authentication data (minimal PII)';
COMMENT ON SCHEMA workflo_analytics IS 'Privacy-aware analytics and metrics (no direct PII)';
COMMENT ON SCHEMA workflo_audit IS 'Audit logs and operational tracking';
COMMENT ON SCHEMA workflo_config IS 'Application configuration and feature flags';

-- =====================================================
-- COMPLETION LOG
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'WorkFlo PostgreSQL schemas created successfully';
    RAISE NOTICE 'Schemas: workflo, workflo_identity, workflo_analytics, workflo_audit, workflo_config';
    RAISE NOTICE 'Roles: workflo_app, workflo_analytics, workflo_backup';
END
$$;