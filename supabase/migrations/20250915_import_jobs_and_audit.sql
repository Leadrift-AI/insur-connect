-- Migration: Import Jobs, Audit Logging, and Seat Management
-- Created: 2025-09-15

-- Create import_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
    total_rows INTEGER NOT NULL DEFAULT 0,
    processed_rows INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    entity TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_id UUID,
    diff JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add row_hash column to leads table for idempotent imports
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'row_hash') THEN
        ALTER TABLE leads ADD COLUMN row_hash TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'import_job_id') THEN
        ALTER TABLE leads ADD COLUMN import_job_id UUID REFERENCES import_jobs(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create unique index for idempotent imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_import_dedup
ON leads (import_job_id, row_hash)
WHERE import_job_id IS NOT NULL AND row_hash IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_jobs_agency_id ON import_jobs(agency_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_agency_id ON audit_log(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Create RLS policies for import_jobs
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see import jobs from their agency
CREATE POLICY "Users can view import jobs from their agency" ON import_jobs
    FOR SELECT USING (
        agency_id IN (
            SELECT p.agency_id
            FROM profiles p
            WHERE p.user_id = auth.uid()
        )
    );

-- Policy: Users can create import jobs for their agency
CREATE POLICY "Users can create import jobs for their agency" ON import_jobs
    FOR INSERT WITH CHECK (
        agency_id IN (
            SELECT p.agency_id
            FROM profiles p
            WHERE p.user_id = auth.uid()
        )
    );

-- Policy: Users can update import jobs from their agency
CREATE POLICY "Users can update import jobs from their agency" ON import_jobs
    FOR UPDATE USING (
        agency_id IN (
            SELECT p.agency_id
            FROM profiles p
            WHERE p.user_id = auth.uid()
        )
    );

-- Create RLS policies for audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see audit logs from their agency
CREATE POLICY "Users can view audit logs from their agency" ON audit_log
    FOR SELECT USING (
        agency_id IN (
            SELECT p.agency_id
            FROM profiles p
            WHERE p.user_id = auth.uid()
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for import_jobs updated_at
DROP TRIGGER IF EXISTS update_import_jobs_updated_at ON import_jobs;
CREATE TRIGGER update_import_jobs_updated_at
    BEFORE UPDATE ON import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get seat usage with advisory locking support
CREATE OR REPLACE FUNCTION get_agency_seat_usage(agency_uuid UUID)
RETURNS TABLE(
    total_seats INTEGER,
    active_agents BIGINT,
    pending_invitations BIGINT,
    available_seats INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH agency_info AS (
        SELECT a.seats as total_seats
        FROM agencies a
        WHERE a.id = agency_uuid
    ),
    agent_count AS (
        SELECT COUNT(*) as active_agents
        FROM agency_members am
        WHERE am.agency_id = agency_uuid
    ),
    invitation_count AS (
        SELECT COUNT(*) as pending_invitations
        FROM user_invitations ui
        WHERE ui.agency_id = agency_uuid
          AND ui.accepted_at IS NULL
          AND ui.expires_at > NOW()
    )
    SELECT
        ai.total_seats,
        ac.active_agents,
        ic.pending_invitations,
        GREATEST(0, ai.total_seats - (ac.active_agents + ic.pending_invitations)::INTEGER) as available_seats
    FROM agency_info ai, agent_count ac, invitation_count ic;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON import_jobs TO authenticated;
GRANT SELECT ON audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_agency_seat_usage(UUID) TO authenticated;

-- Update leads table RLS to allow import job insertions
DROP POLICY IF EXISTS "Service role can insert leads" ON leads;
CREATE POLICY "Service role can insert leads" ON leads
    FOR INSERT WITH CHECK (true);

-- Grant service role access to audit_log for edge functions
GRANT INSERT ON audit_log TO service_role;

COMMENT ON TABLE import_jobs IS 'Tracks CSV import job progress and status';
COMMENT ON TABLE audit_log IS 'Audit trail for sensitive operations';
COMMENT ON FUNCTION get_agency_seat_usage(UUID) IS 'Get current seat usage for an agency with locking support';