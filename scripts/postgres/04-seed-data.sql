-- =====================================================
-- WorkFlo PostgreSQL Seed Data Script
-- Development and testing data with privacy-first examples
-- =====================================================

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

INSERT INTO workflo_config.feature_flags (flag_name, is_enabled, description, rollout_percentage) VALUES
('task-management', true, 'Enable task creation and management features', 100),
('session-management', true, 'Enable focus session tracking', 100),
('progressive-nudging', false, 'Enable progressive nudging system for focus', 0),
('real-time-sync', false, 'Enable real-time synchronization across devices', 25),
('ai-assistance', false, 'Enable AI-powered task breakdown and suggestions', 10),
('analytics-dashboard', true, 'Enable analytics and insights dashboard', 100),
('hyperfocus-protection', true, 'Enable hyperfocus detection and protection', 100),
('mood-energy-tracking', true, 'Enable mood and energy level tracking', 100),
('task-complexity-scoring', false, 'Enable automatic task complexity analysis', 50),
('email-notifications', false, 'Enable email notification system', 0)
ON CONFLICT (flag_name) DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    description = EXCLUDED.description,
    rollout_percentage = EXCLUDED.rollout_percentage,
    updated_at = NOW();

-- =====================================================
-- APPLICATION SETTINGS
-- =====================================================

INSERT INTO workflo_config.app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('default_session_duration', '25', 'number', 'Default Pomodoro session duration in minutes', true),
('default_break_duration', '5', 'number', 'Default break duration in minutes', true),
('max_session_duration', '120', 'number', 'Maximum allowed session duration in minutes', true),
('min_session_duration', '5', 'number', 'Minimum allowed session duration in minutes', true),
('nudge_escalation_levels', '4', 'number', 'Number of nudge escalation levels', false),
('analytics_retention_days', '365', 'number', 'Number of days to retain analytics data', false),
('audit_retention_days', '90', 'number', 'Number of days to retain audit logs', false),
('session_auto_pause_minutes', '10', 'number', 'Minutes of inactivity before auto-pause', true),
('hyperfocus_warning_minutes', '90', 'number', 'Minutes before hyperfocus warning', true),
('daily_focus_goal_minutes', '240', 'number', 'Default daily focus time goal in minutes', true),
('enable_weekend_goals', 'true', 'boolean', 'Enable focus goals on weekends', true),
('theme_options', '["light", "dark", "auto"]', 'json', 'Available theme options', true),
('notification_types', '["desktop", "mobile", "email"]', 'json', 'Available notification types', true),
('task_priority_levels', '["very_low", "low", "medium", "high", "urgent"]', 'json', 'Available task priority levels', true),
('energy_level_descriptions', '{"1": "Very Low", "2": "Low", "3": "Medium", "4": "High", "5": "Very High"}', 'json', 'Energy level descriptions', true)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = NOW();

-- =====================================================
-- DEMO USER DATA (for development/testing)
-- =====================================================

-- Create demo users (using hashed emails for privacy)
INSERT INTO workflo_identity.users (
    id, 
    email_hash, 
    password_hash, 
    email_verified, 
    created_at
) VALUES
-- Demo user 1 (email: demo1@workflo.local)
(
    '550e8400-e29b-41d4-a716-446655440001',
    encode(digest('demo1@workflo.local', 'sha256'), 'hex'),
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewifMtUztkKIop22', -- password: "demo123!"
    true,
    NOW() - INTERVAL '7 days'
),
-- Demo user 2 (email: demo2@workflo.local)
(
    '550e8400-e29b-41d4-a716-446655440002',
    encode(digest('demo2@workflo.local', 'sha256'), 'hex'),
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewifMtUztkKIop22', -- password: "demo123!"
    true,
    NOW() - INTERVAL '14 days'
)
ON CONFLICT (id) DO NOTHING;

-- Create user preferences for demo users
INSERT INTO workflo_identity.user_preferences (
    user_id,
    default_session_duration,
    break_reminder_interval,
    nudge_intensity_level,
    enable_hyperfocus_protection,
    maximum_hyperfocus_duration,
    enable_analytics,
    enable_ai_assistance,
    theme_preference
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    25, -- Standard Pomodoro
    5,
    2,
    true,
    120,
    true,
    false,
    'auto'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    50, -- Longer sessions for deep work
    10,
    3,
    true,
    180,
    true,
    true,
    'dark'
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- DEMO TASKS
-- =====================================================

INSERT INTO workflo.tasks (
    id,
    user_id,
    title,
    description,
    status,
    priority,
    estimated_duration,
    complexity_score,
    energy_level_required,
    due_date,
    tags,
    created_at
) VALUES
-- User 1 tasks
(
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Review quarterly reports',
    'Analyze Q3 performance metrics and prepare summary for leadership team',
    'pending',
    4,
    90,
    6.5,
    4,
    NOW() + INTERVAL '3 days',
    ARRAY['work', 'analysis', 'quarterly'],
    NOW() - INTERVAL '2 days'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Update project documentation',
    'Document new API endpoints and update developer guide',
    'in_progress',
    3,
    60,
    4.0,
    3,
    NOW() + INTERVAL '1 week',
    ARRAY['documentation', 'api', 'development'],
    NOW() - INTERVAL '1 day'
),
(
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'Organize desk workspace',
    'Clean and organize physical workspace for better focus',
    'completed',
    2,
    30,
    2.0,
    2,
    NULL,
    ARRAY['organization', 'personal', 'adhd-friendly'],
    NOW() - INTERVAL '3 days'
),
-- User 2 tasks
(
    '660e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    'Learn new programming framework',
    'Complete online course and build sample project',
    'pending',
    3,
    480, -- 8 hours
    8.5,
    5,
    NOW() + INTERVAL '2 weeks',
    ARRAY['learning', 'programming', 'skill-development'],
    NOW() - INTERVAL '1 day'
),
(
    '660e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440002',
    'Plan weekend hiking trip',
    'Research trails, check weather, and pack gear',
    'pending',
    2,
    45,
    3.5,
    3,
    NOW() + INTERVAL '2 days',
    ARRAY['personal', 'planning', 'outdoors'],
    NOW() - INTERVAL '4 hours'
)
ON CONFLICT (id) DO NOTHING;

-- Update completed task
UPDATE workflo.tasks 
SET completed_at = NOW() - INTERVAL '2 hours',
    actual_duration = 35
WHERE id = '660e8400-e29b-41d4-a716-446655440003';

-- =====================================================
-- DEMO TASK BREAKDOWNS
-- =====================================================

INSERT INTO workflo.task_breakdowns (
    task_id,
    step_title,
    step_description,
    estimated_minutes,
    step_order,
    difficulty_level,
    requires_deep_focus,
    is_completed
) VALUES
-- Breakdown for "Review quarterly reports"
(
    '660e8400-e29b-41d4-a716-446655440001',
    'Gather all Q3 reports',
    'Collect reports from sales, marketing, and operations teams',
    15,
    1,
    2,
    false,
    true
),
(
    '660e8400-e29b-41d4-a716-446655440001',
    'Analyze sales performance',
    'Review sales metrics, trends, and compare to targets',
    30,
    2,
    4,
    true,
    false
),
(
    '660e8400-e29b-41d4-a716-446655440001',
    'Create executive summary',
    'Write 2-page summary with key insights and recommendations',
    45,
    3,
    5,
    true,
    false
),
-- Breakdown for "Learn new programming framework"
(
    '660e8400-e29b-41d4-a716-446655440004',
    'Watch introduction videos',
    'Complete first 3 modules of online course',
    120,
    1,
    3,
    true,
    false
),
(
    '660e8400-e29b-41d4-a716-446655440004',
    'Set up development environment',
    'Install framework and configure development tools',
    60,
    2,
    4,
    false,
    false
),
(
    '660e8400-e29b-41d4-a716-446655440004',
    'Build sample application',
    'Create a simple todo app following course guidelines',
    180,
    3,
    5,
    true,
    false
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- DEMO FOCUS SESSIONS
-- =====================================================

INSERT INTO workflo.focus_sessions (
    id,
    user_id,
    task_id,
    planned_duration,
    actual_duration,
    session_type,
    started_at,
    ended_at,
    status,
    interruption_count,
    focus_rating,
    completion_percentage,
    mood_before,
    mood_after,
    energy_before,
    energy_after,
    notes
) VALUES
-- Completed sessions
(
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440003',
    25,
    28,
    'pomodoro',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours 32 minutes',
    'completed',
    1,
    8,
    95.0,
    6,
    7,
    4,
    5,
    'Good focus session, only one interruption from email'
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440002',
    50,
    45,
    'deep_work',
    NOW() - INTERVAL '1 day 2 hours',
    NOW() - INTERVAL '1 day 1 hour 15 minutes',
    'completed',
    2,
    7,
    80.0,
    7,
    6,
    5,
    4,
    'Started strong but energy dropped toward the end'
),
-- Active session
(
    '770e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440004',
    60,
    NULL,
    'deep_work',
    NOW() - INTERVAL '30 minutes',
    NULL,
    'active',
    0,
    NULL,
    NULL,
    8,
    NULL,
    5,
    NULL,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DEMO SESSION INTERRUPTIONS
-- =====================================================

INSERT INTO workflo.session_interruptions (
    session_id,
    interruption_type,
    interruption_source,
    duration_seconds,
    occurred_at,
    was_handled,
    notes
) VALUES
(
    '770e8400-e29b-41d4-a716-446655440001',
    'external',
    'email',
    45,
    NOW() - INTERVAL '2 hours 45 minutes',
    true,
    'Urgent email from client, handled quickly'
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    'internal',
    'thought',
    120,
    NOW() - INTERVAL '1 day 1 hour 45 minutes',
    false,
    'Started thinking about weekend plans'
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    'external',
    'slack',
    180,
    NOW() - INTERVAL '1 day 1 hour 30 minutes',
    true,
    'Team discussion about project deadline'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- GENERATE DEMO ANALYTICS
-- =====================================================

-- Generate analytics for the past few days
SELECT workflo_analytics.generate_daily_metrics(CURRENT_DATE);
SELECT workflo_analytics.generate_daily_metrics(CURRENT_DATE - INTERVAL '1 day');
SELECT workflo_analytics.generate_daily_metrics(CURRENT_DATE - INTERVAL '2 days');

-- =====================================================
-- COMPLETION LOG
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'WorkFlo PostgreSQL seed data inserted successfully';
    RAISE NOTICE 'Demo users, tasks, sessions, and analytics created';
    RAISE NOTICE 'Feature flags and application settings configured';
    RAISE NOTICE 'Ready for development and testing';
END
$$;