-- =====================================================
-- Anchor PostgreSQL Table Creation Script
-- Privacy-first table structure with schema separation
-- =====================================================

-- =====================================================
-- ANCHOR_IDENTITY SCHEMA - User Management
-- =====================================================

-- Users table (minimal PII, privacy-first)
CREATE TABLE IF NOT EXISTS anchor_identity.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_hash TEXT NOT NULL UNIQUE, -- Hashed email for privacy
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Privacy compliance
    data_retention_until TIMESTAMP WITH TIME ZONE, -- For GDPR compliance
    
    -- Indexes
    INDEX idx_users_email_hash (email_hash),
    INDEX idx_users_created_at (created_at),
    INDEX idx_users_active (is_active) WHERE is_active = TRUE
);

-- User preferences (non-PII)
CREATE TABLE IF NOT EXISTS anchor_identity.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES anchor_identity.users(id) ON DELETE CASCADE,
    
    -- ADHD-specific preferences
    default_session_duration INTEGER DEFAULT 25, -- minutes
    break_reminder_interval INTEGER DEFAULT 5,   -- minutes
    nudge_intensity_level INTEGER DEFAULT 2,     -- 1-5 scale
    
    -- Notification preferences
    enable_desktop_notifications BOOLEAN DEFAULT TRUE,
    enable_mobile_notifications BOOLEAN DEFAULT TRUE,
    enable_email_notifications BOOLEAN DEFAULT FALSE,
    
    -- Focus preferences
    enable_hyperfocus_protection BOOLEAN DEFAULT TRUE,
    maximum_hyperfocus_duration INTEGER DEFAULT 120, -- minutes
    
    -- Privacy preferences
    enable_analytics BOOLEAN DEFAULT TRUE,
    enable_ai_assistance BOOLEAN DEFAULT TRUE,
    
    -- Theme and UI
    theme_preference TEXT DEFAULT 'auto', -- 'light', 'dark', 'auto'
    ui_density TEXT DEFAULT 'comfortable', -- 'compact', 'comfortable', 'spacious'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_session_duration CHECK (default_session_duration BETWEEN 5 AND 180),
    CONSTRAINT chk_nudge_intensity CHECK (nudge_intensity_level BETWEEN 1 AND 5),
    CONSTRAINT chk_theme CHECK (theme_preference IN ('light', 'dark', 'auto')),
    CONSTRAINT chk_ui_density CHECK (ui_density IN ('compact', 'comfortable', 'spacious')),
    
    -- Indexes
    INDEX idx_user_preferences_user_id (user_id)
);

-- =====================================================
-- ANCHOR SCHEMA - Core Application Data
-- =====================================================

-- Tasks (privacy-safe, no PII in content)
CREATE TABLE IF NOT EXISTS anchor.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES anchor_identity.users(id) ON DELETE CASCADE,
    
    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 3, -- 1-5 scale
    
    -- ADHD-specific fields
    estimated_duration INTEGER, -- minutes
    actual_duration INTEGER,    -- minutes (calculated)
    complexity_score DECIMAL(3,2), -- 1.00-10.00
    energy_level_required INTEGER, -- 1-5 scale
    
    -- Time tracking
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    tags TEXT[], -- Array of tags for categorization
    external_id TEXT, -- For sync with external systems
    
    -- Soft delete for privacy
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_task_priority CHECK (priority BETWEEN 1 AND 5),
    CONSTRAINT chk_task_energy CHECK (energy_level_required BETWEEN 1 AND 5),
    CONSTRAINT chk_task_complexity CHECK (complexity_score BETWEEN 1.00 AND 10.00),
    CONSTRAINT chk_task_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    
    -- Indexes
    INDEX idx_tasks_user_id (user_id),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_due_date (due_date),
    INDEX idx_tasks_created_at (created_at),
    INDEX idx_tasks_tags USING GIN (tags),
    INDEX idx_tasks_active (user_id, status) WHERE deleted_at IS NULL
);

-- Task breakdown (for complex tasks)
CREATE TABLE IF NOT EXISTS anchor.task_breakdowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES anchor.tasks(id) ON DELETE CASCADE,
    parent_step_id UUID REFERENCES anchor.task_breakdowns(id), -- For nested steps
    
    -- Step details
    step_title TEXT NOT NULL,
    step_description TEXT,
    estimated_minutes INTEGER DEFAULT 15,
    step_order INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- ADHD helpers
    difficulty_level INTEGER DEFAULT 3, -- 1-5 scale
    requires_deep_focus BOOLEAN DEFAULT FALSE,
    can_be_interrupted BOOLEAN DEFAULT TRUE,
    
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_step_difficulty CHECK (difficulty_level BETWEEN 1 AND 5),
    CONSTRAINT chk_step_order CHECK (step_order > 0),
    
    -- Indexes
    INDEX idx_task_breakdowns_task_id (task_id),
    INDEX idx_task_breakdowns_parent (parent_step_id),
    INDEX idx_task_breakdowns_order (task_id, step_order)
);

-- Focus sessions
CREATE TABLE IF NOT EXISTS anchor.focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES anchor_identity.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES anchor.tasks(id) ON DELETE SET NULL,
    
    -- Session details
    planned_duration INTEGER NOT NULL, -- minutes
    actual_duration INTEGER, -- calculated on completion
    session_type TEXT DEFAULT 'pomodoro', -- 'pomodoro', 'deep_work', 'review'
    
    -- Time tracking
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    
    -- Session quality metrics
    interruption_count INTEGER DEFAULT 0,
    focus_rating INTEGER, -- 1-10 scale (self-reported)
    completion_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0.00-100.00
    
    -- ADHD-specific tracking
    mood_before INTEGER, -- 1-10 scale
    mood_after INTEGER,  -- 1-10 scale
    energy_before INTEGER, -- 1-10 scale
    energy_after INTEGER,  -- 1-10 scale
    
    -- Session notes (optional)
    notes TEXT,
    
    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'abandoned'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_session_type CHECK (session_type IN ('pomodoro', 'deep_work', 'review', 'break')),
    CONSTRAINT chk_session_status CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    CONSTRAINT chk_focus_rating CHECK (focus_rating BETWEEN 1 AND 10),
    CONSTRAINT chk_mood_before CHECK (mood_before BETWEEN 1 AND 10),
    CONSTRAINT chk_mood_after CHECK (mood_after BETWEEN 1 AND 10),
    CONSTRAINT chk_energy_before CHECK (energy_before BETWEEN 1 AND 10),
    CONSTRAINT chk_energy_after CHECK (energy_after BETWEEN 1 AND 10),
    CONSTRAINT chk_completion_pct CHECK (completion_percentage BETWEEN 0.00 AND 100.00),
    
    -- Indexes
    INDEX idx_focus_sessions_user_id (user_id),
    INDEX idx_focus_sessions_task_id (task_id),
    INDEX idx_focus_sessions_started_at (started_at),
    INDEX idx_focus_sessions_status (status),
    INDEX idx_focus_sessions_active (user_id, status) WHERE status = 'active'
);

-- Session interruptions (for ADHD pattern analysis)
CREATE TABLE IF NOT EXISTS anchor.session_interruptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES anchor.focus_sessions(id) ON DELETE CASCADE,
    
    -- Interruption details
    interruption_type TEXT NOT NULL, -- 'external', 'internal', 'system'
    interruption_source TEXT, -- 'email', 'slack', 'thought', 'notification'
    duration_seconds INTEGER, -- How long the interruption lasted
    
    -- Context
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    was_handled BOOLEAN DEFAULT FALSE, -- Did user handle it or ignore it?
    notes TEXT,
    
    -- Constraints
    CONSTRAINT chk_interruption_type CHECK (interruption_type IN ('external', 'internal', 'system')),
    
    -- Indexes
    INDEX idx_interruptions_session_id (session_id),
    INDEX idx_interruptions_occurred_at (occurred_at),
    INDEX idx_interruptions_type (interruption_type)
);

-- =====================================================
-- ANCHOR_ANALYTICS SCHEMA - Privacy-Safe Analytics
-- =====================================================

-- Daily aggregated metrics (no direct user PII)
CREATE TABLE IF NOT EXISTS anchor_analytics.daily_user_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash TEXT NOT NULL, -- Generated from user_id + date
    metric_date DATE NOT NULL,
    
    -- Focus metrics
    total_focus_time_minutes INTEGER DEFAULT 0,
    number_of_sessions INTEGER DEFAULT 0,
    average_session_duration DECIMAL(8,2),
    total_interruptions INTEGER DEFAULT 0,
    
    -- Task metrics
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_cancelled INTEGER DEFAULT 0,
    
    -- Quality metrics
    average_focus_rating DECIMAL(3,2),
    average_completion_rate DECIMAL(5,2),
    
    -- Mood/energy tracking
    average_mood_before DECIMAL(3,2),
    average_mood_after DECIMAL(3,2),
    average_energy_before DECIMAL(3,2),
    average_energy_after DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(user_hash, metric_date),
    
    -- Indexes
    INDEX idx_daily_metrics_user_hash (user_hash),
    INDEX idx_daily_metrics_date (metric_date),
    INDEX idx_daily_metrics_user_date (user_hash, metric_date)
);

-- =====================================================
-- ANCHOR_AUDIT SCHEMA - Audit and Compliance
-- =====================================================

-- Operation audit log
CREATE TABLE IF NOT EXISTS anchor_audit.operation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Operation details
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    entity_id UUID,
    
    -- Privacy-safe user tracking
    user_hash TEXT, -- Hashed user ID for privacy
    
    -- Additional context
    additional_data JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_operation_logs_created_at (created_at),
    INDEX idx_operation_logs_operation (operation),
    INDEX idx_operation_logs_schema_table (schema_name, table_name),
    INDEX idx_operation_logs_entity_id (entity_id),
    INDEX idx_operation_logs_user_hash (user_hash)
);

-- =====================================================
-- ANCHOR_CONFIG SCHEMA - Configuration
-- =====================================================

-- Feature flags
CREATE TABLE IF NOT EXISTS anchor_config.feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    description TEXT,
    rollout_percentage INTEGER DEFAULT 0, -- 0-100
    target_user_groups TEXT[], -- Array of user group identifiers
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_rollout_percentage CHECK (rollout_percentage BETWEEN 0 AND 100),
    
    -- Indexes
    INDEX idx_feature_flags_name (flag_name),
    INDEX idx_feature_flags_enabled (is_enabled)
);

-- Application configuration
CREATE TABLE IF NOT EXISTS anchor_config.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Can be exposed to frontend
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_app_settings_key (setting_key),
    INDEX idx_app_settings_public (is_public) WHERE is_public = TRUE
);

-- =====================================================
-- COMPLETION LOG
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Anchor PostgreSQL tables created successfully';
    RAISE NOTICE 'Tables created across 5 schemas with privacy-first design';
    RAISE NOTICE 'ADHD-specific features and metrics included';
END
$$;