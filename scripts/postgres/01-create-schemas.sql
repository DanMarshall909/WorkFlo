-- =====================================================
-- Anchor PostgreSQL Schema Creation Script
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
CREATE SCHEMA IF NOT EXISTS anchor;

-- User management and authentication 
CREATE SCHEMA IF NOT EXISTS anchor_identity;

-- Analytics and metrics (privacy-aware)
CREATE SCHEMA IF NOT EXISTS anchor_analytics;

-- Audit and operational logs
CREATE SCHEMA IF NOT EXISTS anchor_audit;

-- Configuration and system settings
CREATE SCHEMA IF NOT EXISTS anchor_config;

-- =====================================================
-- USER ROLES AND PERMISSIONS
-- =====================================================

-- Application service account
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anchor_app') THEN
        CREATE ROLE anchor_app WITH LOGIN PASSWORD 'anchor_app_secure_password_2024!';
    END IF;
END
$$;

-- Read-only analytics account
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anchor_analytics') THEN
        CREATE ROLE anchor_analytics WITH LOGIN PASSWORD 'anchor_analytics_read_2024!';
    END IF;
END
$$;

-- Backup account
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anchor_backup') THEN
        CREATE ROLE anchor_backup WITH LOGIN PASSWORD 'anchor_backup_secure_2024!';
    END IF;
END
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Application account - Full access to core schemas
GRANT USAGE ON SCHEMA anchor TO anchor_app;
GRANT USAGE ON SCHEMA anchor_identity TO anchor_app;
GRANT USAGE ON SCHEMA anchor_analytics TO anchor_app;
GRANT USAGE ON SCHEMA anchor_audit TO anchor_app;
GRANT USAGE ON SCHEMA anchor_config TO anchor_app;

GRANT CREATE ON SCHEMA anchor TO anchor_app;
GRANT CREATE ON SCHEMA anchor_identity TO anchor_app;
GRANT CREATE ON SCHEMA anchor_analytics TO anchor_app;
GRANT CREATE ON SCHEMA anchor_audit TO anchor_app;
GRANT CREATE ON SCHEMA anchor_config TO anchor_app;

-- Analytics account - Read-only access
GRANT USAGE ON SCHEMA anchor_analytics TO anchor_analytics;
GRANT USAGE ON SCHEMA anchor_audit TO anchor_analytics;

-- Backup account - Read access to all schemas
GRANT USAGE ON SCHEMA anchor TO anchor_backup;
GRANT USAGE ON SCHEMA anchor_identity TO anchor_backup;
GRANT USAGE ON SCHEMA anchor_analytics TO anchor_backup;
GRANT USAGE ON SCHEMA anchor_audit TO anchor_backup;
GRANT USAGE ON SCHEMA anchor_config TO anchor_backup;

-- =====================================================
-- COMMON FUNCTIONS
-- =====================================================

-- Function to generate privacy-safe user hashes
CREATE OR REPLACE FUNCTION anchor.generate_user_hash(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(user_id::text || current_date::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION anchor_audit.log_operation(
    schema_name TEXT,
    table_name TEXT,
    operation TEXT,
    entity_id UUID,
    user_id UUID DEFAULT NULL,
    additional_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO anchor_audit.operation_logs (
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
        CASE WHEN user_id IS NOT NULL THEN anchor.generate_user_hash(user_id) ELSE NULL END,
        additional_data,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEMA COMMENTS
-- =====================================================

COMMENT ON SCHEMA anchor IS 'Core application data: tasks, sessions, and focus management';
COMMENT ON SCHEMA anchor_identity IS 'User identity and authentication data (minimal PII)';
COMMENT ON SCHEMA anchor_analytics IS 'Privacy-aware analytics and metrics (no direct PII)';
COMMENT ON SCHEMA anchor_audit IS 'Audit logs and operational tracking';
COMMENT ON SCHEMA anchor_config IS 'Application configuration and feature flags';

-- =====================================================
-- COMPLETION LOG
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Anchor PostgreSQL schemas created successfully';
    RAISE NOTICE 'Schemas: anchor, anchor_identity, anchor_analytics, anchor_audit, anchor_config';
    RAISE NOTICE 'Roles: anchor_app, anchor_analytics, anchor_backup';
END
$$;