-- CUP Solidale - GoHighLevel Sync Database Schema
-- PostgreSQL database schema for managing API integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mappings between CUP Solidale entities and GoHighLevel entities
CREATE TABLE entity_mappings (
    id SERIAL PRIMARY KEY,
    cup_type VARCHAR(20) NOT NULL CHECK (cup_type IN ('sede', 'dottore', 'prestazione')),
    cup_id VARCHAR(100) NOT NULL,
    ghl_calendar_id VARCHAR(100),
    ghl_user_id VARCHAR(100),
    mapping_data JSONB, -- Store additional mapping information
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(cup_type, cup_id)
);

-- Index for faster lookups
CREATE INDEX idx_entity_mappings_cup ON entity_mappings(cup_type, cup_id);
CREATE INDEX idx_entity_mappings_ghl_calendar ON entity_mappings(ghl_calendar_id);
CREATE INDEX idx_entity_mappings_ghl_user ON entity_mappings(ghl_user_id);
CREATE INDEX idx_entity_mappings_active ON entity_mappings(active);

-- Sync operation logs
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('cup_to_ghl', 'ghl_to_cup')),
    entity_type VARCHAR(20) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sync')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'pending', 'retry')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    request_payload JSONB,
    response_payload JSONB,
    execution_time_ms INTEGER,
    processed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for sync logs
CREATE INDEX idx_sync_logs_sync_type ON sync_logs(sync_type);
CREATE INDEX idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_processed_at ON sync_logs(processed_at);

-- Cache for CUP Solidale prenotazioni to avoid duplications
CREATE TABLE prenotazioni_cache (
    cup_prenotazione_id INTEGER PRIMARY KEY,
    ghl_event_id VARCHAR(100) UNIQUE,
    data_prestazione TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    checksum VARCHAR(64), -- MD5 hash of prenotazione data for change detection
    sync_data JSONB, -- Store original prenotazione data
    last_sync TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for prenotazioni cache
CREATE INDEX idx_prenotazioni_cache_ghl_event ON prenotazioni_cache(ghl_event_id);
CREATE INDEX idx_prenotazioni_cache_data_prestazione ON prenotazioni_cache(data_prestazione);
CREATE INDEX idx_prenotazioni_cache_status ON prenotazioni_cache(status);
CREATE INDEX idx_prenotazioni_cache_last_sync ON prenotazioni_cache(last_sync);

-- Cache for indisponibilità created from GoHighLevel events
CREATE TABLE indisponibilita_cache (
    ghl_event_id VARCHAR(100) PRIMARY KEY,
    cup_indisponibilita_id VARCHAR(100) UNIQUE,
    cup_dottore_id VARCHAR(100) NOT NULL,
    cup_sede_id VARCHAR(100) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    event_data JSONB, -- Store original GHL event data
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for indisponibilità cache
CREATE INDEX idx_indisponibilita_cache_cup_id ON indisponibilita_cache(cup_indisponibilita_id);
CREATE INDEX idx_indisponibilita_cache_dottore ON indisponibilita_cache(cup_dottore_id);
CREATE INDEX idx_indisponibilita_cache_sede ON indisponibilita_cache(cup_sede_id);
CREATE INDEX idx_indisponibilita_cache_time_range ON indisponibilita_cache(start_time, end_time);

-- Configuration table for system settings
CREATE TABLE sync_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configuration values
INSERT INTO sync_config (config_key, config_value, description) VALUES
('sync_interval_minutes', '5', 'Interval in minutes for automatic sync'),
('max_retry_attempts', '3', 'Maximum number of retry attempts for failed syncs'),
('batch_size', '100', 'Number of items to process in each batch'),
('cleanup_logs_days', '30', 'Number of days to keep sync logs'),
('enable_auto_sync', 'true', 'Enable automatic synchronization'),
('webhook_timeout_seconds', '30', 'Timeout for webhook processing');

-- Queue table for async processing
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_type VARCHAR(20) NOT NULL CHECK (queue_type IN ('prenotazione_sync', 'indisponibilita_sync', 'mapping_update')),
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_for TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for queue
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_priority ON sync_queue(priority DESC);
CREATE INDEX idx_sync_queue_scheduled_for ON sync_queue(scheduled_for);
CREATE INDEX idx_sync_queue_type ON sync_queue(queue_type);

-- Webhook events log
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(20) NOT NULL CHECK (source IN ('gohighlevel', 'cupsolidale')),
    event_type VARCHAR(50) NOT NULL,
    event_id VARCHAR(100),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for webhook events
CREATE INDEX idx_webhook_events_source ON webhook_events(source);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- System status table for monitoring
CREATE TABLE system_status (
    id SERIAL PRIMARY KEY,
    component VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    last_check TIMESTAMP DEFAULT NOW(),
    error_message TEXT,
    metadata JSONB
);

-- Insert default system components
INSERT INTO system_status (component, status) VALUES
('cup_solidale_api', 'healthy'),
('gohighlevel_api', 'healthy'),
('database', 'healthy'),
('redis', 'healthy'),
('sync_scheduler', 'healthy');

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_entity_mappings_updated_at
    BEFORE UPDATE ON entity_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indisponibilita_cache_updated_at
    BEFORE UPDATE ON indisponibilita_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_config_updated_at
    BEFORE UPDATE ON sync_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Views for monitoring and reporting
CREATE VIEW sync_status_summary AS
SELECT
    sync_type,
    entity_type,
    action,
    status,
    COUNT(*) as count,
    MAX(processed_at) as last_occurrence
FROM sync_logs
WHERE processed_at >= NOW() - INTERVAL '24 hours'
GROUP BY sync_type, entity_type, action, status;

CREATE VIEW recent_errors AS
SELECT
    sync_type,
    entity_type,
    entity_id,
    action,
    error_message,
    retry_count,
    processed_at
FROM sync_logs
WHERE status = 'error'
    AND processed_at >= NOW() - INTERVAL '24 hours'
ORDER BY processed_at DESC;

CREATE VIEW queue_status AS
SELECT
    queue_type,
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_item,
    MAX(created_at) as newest_item
FROM sync_queue
GROUP BY queue_type, status;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
DECLARE
    cleanup_days INTEGER;
BEGIN
    -- Get cleanup configuration
    SELECT config_value::INTEGER INTO cleanup_days
    FROM sync_config
    WHERE config_key = 'cleanup_logs_days';

    IF cleanup_days IS NULL THEN
        cleanup_days := 30;
    END IF;

    -- Clean up old sync logs
    DELETE FROM sync_logs
    WHERE processed_at < NOW() - INTERVAL '1 day' * cleanup_days;

    -- Clean up old webhook events
    DELETE FROM webhook_events
    WHERE created_at < NOW() - INTERVAL '1 day' * cleanup_days;

    -- Clean up completed queue items older than 7 days
    DELETE FROM sync_queue
    WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '7 days';

    -- Clean up old prenotazioni cache (keep only last 90 days)
    DELETE FROM prenotazioni_cache
    WHERE data_prestazione < NOW() - INTERVAL '90 days';

END;
$$ LANGUAGE plpgsql;