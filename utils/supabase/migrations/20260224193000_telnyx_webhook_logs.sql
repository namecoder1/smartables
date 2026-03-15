-- Create telnyx_webhook_logs table
CREATE TABLE IF NOT EXISTS telnyx_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type TEXT,
    payload JSONB,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_telnyx_webhook_logs_location_id ON telnyx_webhook_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_telnyx_webhook_logs_organization_id ON telnyx_webhook_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_telnyx_webhook_logs_event_type ON telnyx_webhook_logs(event_type);
