-- =====================================================
-- Anchor PostgreSQL Triggers and Functions
-- Automated data maintenance and privacy compliance
-- =====================================================

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION anchor.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate actual task duration
CREATE OR REPLACE FUNCTION anchor.calculate_task_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate actual duration when task is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.actual_duration = (
            SELECT COALESCE(SUM(actual_duration), 0)
            FROM anchor.focus_sessions
            WHERE task_id = NEW.id AND status = 'completed'
        );
        NEW.completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate session duration on completion
CREATE OR REPLACE FUNCTION anchor.calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate actual duration when session ends
    IF NEW.status IN ('completed', 'abandoned') AND OLD.status NOT IN ('completed', 'abandoned') THEN
        NEW.ended_at = NOW();
        
        IF NEW.started_at IS NOT NULL THEN
            NEW.actual_duration = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60; -- Convert to minutes
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit log function for privacy-safe tracking
CREATE OR REPLACE FUNCTION anchor_audit.audit_operation()
RETURNS TRIGGER AS $$
DECLARE
    operation_type TEXT;
    user_id_val UUID;
BEGIN
    -- Determine operation type
    IF TG_OP = 'DELETE' THEN
        operation_type = 'DELETE';
        -- Extract user_id if available
        IF OLD ? 'user_id' THEN
            user_id_val = (OLD->>'user_id')::UUID;
        END IF;
        
        PERFORM anchor_audit.log_operation(
            TG_TABLE_SCHEMA,
            TG_TABLE_NAME,
            operation_type,
            OLD.id,
            user_id_val,
            row_to_json(OLD)::jsonb
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        operation_type = 'UPDATE';
        -- Extract user_id if available
        IF NEW ? 'user_id' THEN
            user_id_val = (NEW->>'user_id')::UUID;
        END IF;
        
        PERFORM anchor_audit.log_operation(
            TG_TABLE_SCHEMA,
            TG_TABLE_NAME,
            operation_type,
            NEW.id,
            user_id_val,
            jsonb_build_object(
                'old', row_to_json(OLD)::jsonb,
                'new', row_to_json(NEW)::jsonb
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        operation_type = 'INSERT';
        -- Extract user_id if available
        IF NEW ? 'user_id' THEN
            user_id_val = (NEW->>'user_id')::UUID;
        END IF;
        
        PERFORM anchor_audit.log_operation(
            TG_TABLE_SCHEMA,
            TG_TABLE_NAME,
            operation_type,
            NEW.id,
            user_id_val,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Generate daily metrics function
CREATE OR REPLACE FUNCTION anchor_analytics.generate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Generate metrics for each user
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM anchor.focus_sessions 
        WHERE DATE(started_at) = target_date
    LOOP
        INSERT INTO anchor_analytics.daily_user_metrics (
            user_hash,
            metric_date,
            total_focus_time_minutes,
            number_of_sessions,
            average_session_duration,
            total_interruptions,
            tasks_created,
            tasks_completed,
            tasks_cancelled,
            average_focus_rating,
            average_completion_rate,
            average_mood_before,
            average_mood_after,
            average_energy_before,
            average_energy_after
        )
        SELECT 
            anchor.generate_user_hash(user_record.user_id),
            target_date,
            COALESCE(SUM(fs.actual_duration), 0) as total_focus_time,
            COUNT(fs.id) as session_count,
            COALESCE(AVG(fs.actual_duration), 0) as avg_duration,
            COALESCE(SUM(fs.interruption_count), 0) as total_interruptions,
            COALESCE(task_stats.created_count, 0) as tasks_created,
            COALESCE(task_stats.completed_count, 0) as tasks_completed,
            COALESCE(task_stats.cancelled_count, 0) as tasks_cancelled,
            AVG(fs.focus_rating) as avg_focus_rating,
            AVG(fs.completion_percentage) as avg_completion_rate,
            AVG(fs.mood_before) as avg_mood_before,
            AVG(fs.mood_after) as avg_mood_after,
            AVG(fs.energy_before) as avg_energy_before,
            AVG(fs.energy_after) as avg_energy_after
        FROM anchor.focus_sessions fs
        LEFT JOIN (
            SELECT 
                user_id,
                COUNT(*) FILTER (WHERE DATE(created_at) = target_date) as created_count,
                COUNT(*) FILTER (WHERE DATE(completed_at) = target_date) as completed_count,
                COUNT(*) FILTER (WHERE status = 'cancelled' AND DATE(updated_at) = target_date) as cancelled_count
            FROM anchor.tasks
            WHERE user_id = user_record.user_id
            GROUP BY user_id
        ) task_stats ON fs.user_id = task_stats.user_id
        WHERE fs.user_id = user_record.user_id
        AND DATE(fs.started_at) = target_date
        GROUP BY user_record.user_id, task_stats.created_count, task_stats.completed_count, task_stats.cancelled_count
        ON CONFLICT (user_hash, metric_date) DO UPDATE SET
            total_focus_time_minutes = EXCLUDED.total_focus_time_minutes,
            number_of_sessions = EXCLUDED.number_of_sessions,
            average_session_duration = EXCLUDED.average_session_duration,
            total_interruptions = EXCLUDED.total_interruptions,
            tasks_created = EXCLUDED.tasks_created,
            tasks_completed = EXCLUDED.tasks_completed,
            tasks_cancelled = EXCLUDED.tasks_cancelled,
            average_focus_rating = EXCLUDED.average_focus_rating,
            average_completion_rate = EXCLUDED.average_completion_rate,
            average_mood_before = EXCLUDED.average_mood_before,
            average_mood_after = EXCLUDED.average_mood_after,
            average_energy_before = EXCLUDED.average_energy_before,
            average_energy_after = EXCLUDED.average_energy_after;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON anchor_identity.users
    FOR EACH ROW EXECUTE FUNCTION anchor.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON anchor_identity.user_preferences
    FOR EACH ROW EXECUTE FUNCTION anchor.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON anchor.tasks
    FOR EACH ROW EXECUTE FUNCTION anchor.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON anchor_config.feature_flags
    FOR EACH ROW EXECUTE FUNCTION anchor.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON anchor_config.app_settings
    FOR EACH ROW EXECUTE FUNCTION anchor.update_updated_at_column();

-- Duration calculation triggers
CREATE TRIGGER calculate_task_duration_trigger
    BEFORE UPDATE ON anchor.tasks
    FOR EACH ROW EXECUTE FUNCTION anchor.calculate_task_duration();

CREATE TRIGGER calculate_session_duration_trigger
    BEFORE UPDATE ON anchor.focus_sessions
    FOR EACH ROW EXECUTE FUNCTION anchor.calculate_session_duration();

-- Audit triggers (privacy-safe)
CREATE TRIGGER audit_tasks_trigger
    AFTER INSERT OR UPDATE OR DELETE ON anchor.tasks
    FOR EACH ROW EXECUTE FUNCTION anchor_audit.audit_operation();

CREATE TRIGGER audit_focus_sessions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON anchor.focus_sessions
    FOR EACH ROW EXECUTE FUNCTION anchor_audit.audit_operation();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON anchor_identity.users
    FOR EACH ROW EXECUTE FUNCTION anchor_audit.audit_operation();

-- =====================================================
-- SCHEDULED JOBS (via pg_cron if available)
-- =====================================================

-- Note: These would need pg_cron extension to be enabled
-- For now, these are documented for manual or application-level scheduling

/*
-- Generate daily metrics every day at 1 AM
SELECT cron.schedule('generate-daily-metrics', '0 1 * * *', 'SELECT anchor_analytics.generate_daily_metrics(CURRENT_DATE - INTERVAL ''1 day'');');

-- Clean up old audit logs (keep 90 days)
SELECT cron.schedule('cleanup-audit-logs', '0 2 * * 0', 'DELETE FROM anchor_audit.operation_logs WHERE created_at < NOW() - INTERVAL ''90 days'';');

-- Clean up old analytics data (keep 1 year)
SELECT cron.schedule('cleanup-analytics', '0 3 * * 0', 'DELETE FROM anchor_analytics.daily_user_metrics WHERE metric_date < CURRENT_DATE - INTERVAL ''1 year'';');
*/

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_focus_sessions_user_date 
    ON anchor.focus_sessions (user_id, DATE(started_at));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_status_priority 
    ON anchor.tasks (user_id, status, priority) 
    WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interruptions_session_type 
    ON anchor.session_interruptions (session_id, interruption_type);

-- Partial indexes for active data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_tasks 
    ON anchor.tasks (user_id, created_at) 
    WHERE status IN ('pending', 'in_progress') AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_sessions 
    ON anchor.focus_sessions (user_id, started_at) 
    WHERE status = 'active';

-- =====================================================
-- COMPLETION LOG
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Anchor PostgreSQL triggers and functions created successfully';
    RAISE NOTICE 'Automated duration calculations, audit logging, and metrics generation enabled';
    RAISE NOTICE 'Performance indexes created for common query patterns';
END
$$;