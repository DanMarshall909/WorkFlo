CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'workflo_config') THEN
        CREATE SCHEMA workflo_config;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'workflo_analytics') THEN
        CREATE SCHEMA workflo_analytics;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'workflo') THEN
        CREATE SCHEMA workflo;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'workflo_identity') THEN
        CREATE SCHEMA workflo_identity;
    END IF;
END $EF$;

CREATE TABLE workflo_config.app_settings (
    id uuid NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value jsonb NOT NULL,
    setting_type character varying(20) NOT NULL DEFAULT 'string',
    description text,
    is_public boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT "PK_app_settings" PRIMARY KEY (id)
);

CREATE TABLE workflo_analytics.daily_user_metrics (
    id uuid NOT NULL,
    user_hash character varying(64) NOT NULL,
    metric_date date NOT NULL,
    total_focus_time_minutes integer NOT NULL,
    number_of_sessions integer NOT NULL,
    average_session_duration numeric(8,2),
    total_interruptions integer NOT NULL,
    tasks_created integer NOT NULL,
    tasks_completed integer NOT NULL,
    tasks_cancelled integer NOT NULL,
    average_focus_rating numeric(3,2),
    average_completion_rate numeric(5,2),
    average_mood_before numeric(3,2),
    average_mood_after numeric(3,2),
    average_energy_before numeric(3,2),
    average_energy_after numeric(3,2),
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT "PK_daily_user_metrics" PRIMARY KEY (id)
);

CREATE TABLE workflo_config.feature_flags (
    id uuid NOT NULL,
    flag_name character varying(100) NOT NULL,
    is_enabled boolean NOT NULL,
    description text,
    rollout_percentage integer NOT NULL,
    target_user_groups text[],
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT "PK_feature_flags" PRIMARY KEY (id),
    CONSTRAINT chk_rollout_percentage CHECK (rollout_percentage BETWEEN 0 AND 100)
);

CREATE TABLE workflo_identity.users (
    id uuid NOT NULL,
    email_hash character varying(64) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email_verified boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    last_login_at timestamp with time zone,
    is_active boolean NOT NULL,
    data_retention_until timestamp with time zone,
    CONSTRAINT "PK_users" PRIMARY KEY (id)
);

CREATE TABLE workflo.tasks (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    status character varying(20) NOT NULL DEFAULT 'pending',
    priority integer NOT NULL,
    estimated_duration integer,
    actual_duration integer,
    complexity_score numeric(3,2),
    energy_level_required integer,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tags text[],
    external_id character varying(255),
    deleted_at timestamp with time zone,
    CONSTRAINT "PK_tasks" PRIMARY KEY (id),
    CONSTRAINT chk_task_complexity CHECK (complexity_score BETWEEN 1.00 AND 10.00),
    CONSTRAINT chk_task_energy CHECK (energy_level_required BETWEEN 1 AND 5),
    CONSTRAINT chk_task_priority CHECK (priority BETWEEN 1 AND 5),
    CONSTRAINT "FK_tasks_users_user_id" FOREIGN KEY (user_id) REFERENCES workflo_identity.users (id) ON DELETE CASCADE
);

CREATE TABLE workflo_identity.user_preferences (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    default_session_duration integer NOT NULL,
    break_reminder_interval integer NOT NULL,
    nudge_intensity_level integer NOT NULL,
    enable_desktop_notifications boolean NOT NULL,
    enable_mobile_notifications boolean NOT NULL,
    enable_email_notifications boolean NOT NULL,
    enable_hyperfocus_protection boolean NOT NULL,
    maximum_hyperfocus_duration integer NOT NULL,
    enable_analytics boolean NOT NULL,
    enable_ai_assistance boolean NOT NULL,
    theme_preference character varying(20) NOT NULL DEFAULT 'auto',
    ui_density character varying(20) NOT NULL DEFAULT 'comfortable',
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT "PK_user_preferences" PRIMARY KEY (id),
    CONSTRAINT chk_nudge_intensity CHECK (nudge_intensity_level BETWEEN 1 AND 5),
    CONSTRAINT chk_session_duration CHECK (default_session_duration BETWEEN 5 AND 180),
    CONSTRAINT "FK_user_preferences_users_user_id" FOREIGN KEY (user_id) REFERENCES workflo_identity.users (id) ON DELETE CASCADE
);

CREATE TABLE workflo.focus_sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    task_id uuid,
    planned_duration integer NOT NULL,
    actual_duration integer,
    session_type character varying(20) NOT NULL DEFAULT 'pomodoro',
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    paused_at timestamp with time zone,
    interruption_count integer NOT NULL,
    focus_rating integer,
    completion_percentage numeric(5,2) NOT NULL,
    mood_before integer,
    mood_after integer,
    energy_before integer,
    energy_after integer,
    notes text,
    status character varying(20) NOT NULL DEFAULT 'active',
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT "PK_focus_sessions" PRIMARY KEY (id),
    CONSTRAINT chk_completion_pct CHECK (completion_percentage BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_focus_rating CHECK (focus_rating BETWEEN 1 AND 10),
    CONSTRAINT "FK_focus_sessions_tasks_task_id" FOREIGN KEY (task_id) REFERENCES workflo.tasks (id) ON DELETE SET NULL,
    CONSTRAINT "FK_focus_sessions_users_user_id" FOREIGN KEY (user_id) REFERENCES workflo_identity.users (id) ON DELETE CASCADE
);

CREATE TABLE workflo.task_breakdowns (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    parent_step_id uuid,
    step_title character varying(300) NOT NULL,
    step_description text,
    estimated_minutes integer NOT NULL,
    step_order integer NOT NULL,
    is_completed boolean NOT NULL,
    difficulty_level integer NOT NULL,
    requires_deep_focus boolean NOT NULL,
    can_be_interrupted boolean NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT "PK_task_breakdowns" PRIMARY KEY (id),
    CONSTRAINT chk_step_difficulty CHECK (difficulty_level BETWEEN 1 AND 5),
    CONSTRAINT chk_step_order CHECK (step_order > 0),
    CONSTRAINT "FK_task_breakdowns_task_breakdowns_parent_step_id" FOREIGN KEY (parent_step_id) REFERENCES workflo.task_breakdowns (id) ON DELETE RESTRICT,
    CONSTRAINT "FK_task_breakdowns_tasks_task_id" FOREIGN KEY (task_id) REFERENCES workflo.tasks (id) ON DELETE CASCADE
);

CREATE TABLE workflo.session_interruptions (
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    interruption_type character varying(20) NOT NULL,
    interruption_source character varying(100),
    duration_seconds integer,
    occurred_at timestamp with time zone NOT NULL,
    was_handled boolean NOT NULL,
    notes text,
    CONSTRAINT "PK_session_interruptions" PRIMARY KEY (id),
    CONSTRAINT "FK_session_interruptions_focus_sessions_session_id" FOREIGN KEY (session_id) REFERENCES workflo.focus_sessions (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_app_settings_key ON workflo_config.app_settings (setting_key);

CREATE INDEX idx_app_settings_public ON workflo_config.app_settings (is_public) WHERE is_public = true;

CREATE INDEX idx_daily_metrics_date ON workflo_analytics.daily_user_metrics (metric_date);

CREATE UNIQUE INDEX idx_daily_metrics_user_date ON workflo_analytics.daily_user_metrics (user_hash, metric_date);

CREATE INDEX idx_daily_metrics_user_hash ON workflo_analytics.daily_user_metrics (user_hash);

CREATE INDEX idx_feature_flags_enabled ON workflo_config.feature_flags (is_enabled);

CREATE UNIQUE INDEX idx_feature_flags_name ON workflo_config.feature_flags (flag_name);

CREATE INDEX idx_focus_sessions_active ON workflo.focus_sessions (user_id, status) WHERE status = 'active';

CREATE INDEX idx_focus_sessions_started_at ON workflo.focus_sessions (started_at);

CREATE INDEX idx_focus_sessions_status ON workflo.focus_sessions (status);

CREATE INDEX idx_focus_sessions_task_id ON workflo.focus_sessions (task_id);

CREATE INDEX idx_focus_sessions_user_date ON workflo.focus_sessions (user_id, started_at);

CREATE INDEX idx_focus_sessions_user_id ON workflo.focus_sessions (user_id);

CREATE INDEX idx_interruptions_occurred_at ON workflo.session_interruptions (occurred_at);

CREATE INDEX idx_interruptions_session_id ON workflo.session_interruptions (session_id);

CREATE INDEX idx_interruptions_type ON workflo.session_interruptions (interruption_type);

CREATE INDEX idx_task_breakdowns_order ON workflo.task_breakdowns (task_id, step_order);

CREATE INDEX idx_task_breakdowns_parent ON workflo.task_breakdowns (parent_step_id);

CREATE INDEX idx_task_breakdowns_task_id ON workflo.task_breakdowns (task_id);

CREATE INDEX idx_tasks_active ON workflo.tasks (user_id, status) WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_created_at ON workflo.tasks (created_at);

CREATE INDEX idx_tasks_due_date ON workflo.tasks (due_date);

CREATE INDEX idx_tasks_priority ON workflo.tasks (priority);

CREATE INDEX idx_tasks_status ON workflo.tasks (status);

CREATE INDEX idx_tasks_user_id ON workflo.tasks (user_id);

CREATE INDEX idx_tasks_user_status_priority ON workflo.tasks (user_id, status, priority) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_user_preferences_user_id ON workflo_identity.user_preferences (user_id);

CREATE INDEX idx_users_active ON workflo_identity.users (is_active) WHERE is_active = true;

CREATE INDEX idx_users_created_at ON workflo_identity.users (created_at);

CREATE UNIQUE INDEX idx_users_email_hash ON workflo_identity.users (email_hash);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250705061039_InitialCreate', '9.0.6');

COMMIT;

