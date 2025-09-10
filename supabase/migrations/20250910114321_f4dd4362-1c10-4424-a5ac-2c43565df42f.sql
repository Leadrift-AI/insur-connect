-- P0: Add agency plan and billing columns
ALTER TABLE agencies 
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS seats integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- P0: Billing events for webhook idempotency
CREATE TABLE IF NOT EXISTS billing_events (
  id text PRIMARY KEY,  -- stripe event id
  type text NOT NULL,
  received_at timestamptz DEFAULT now()
);

-- P1: Agency demo mode and import jobs
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS demo_mode boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending','running','succeeded','failed')) DEFAULT 'pending',
  total_rows integer DEFAULT 0,
  success_rows integer DEFAULT 0,
  error_rows integer DEFAULT 0,
  log_url text,
  created_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

-- P1: Communication hub tables
ALTER TABLE leads ADD COLUMN IF NOT EXISTS opted_out boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_contacted_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  provider text CHECK (provider IN ('twilio','sendgrid')) NOT NULL,
  encrypted_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, provider)
);

CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  channel text CHECK (channel IN ('sms','email')) NOT NULL,
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  delay_minutes integer NOT NULL,
  template_id uuid NOT NULL REFERENCES message_templates(id),
  stop_on_status text[] DEFAULT '{booked,won,lost}',
  UNIQUE(sequence_id, order_index)
);

CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  current_step integer DEFAULT 0,
  status text CHECK (status IN ('active','paused','completed','stopped')) DEFAULT 'active',
  enrolled_at timestamptz DEFAULT now(),
  next_send_at timestamptz,
  UNIQUE(lead_id, sequence_id)
);

CREATE TABLE IF NOT EXISTS outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel text CHECK (channel IN ('sms','email')) NOT NULL,
  to_address text NOT NULL,
  subject text,
  body text NOT NULL,
  provider_message_id text,
  status text CHECK (status IN ('queued','sent','failed')) DEFAULT 'queued',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  error_message text
);

-- P2: Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  diff jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- P2: Agent performance materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_agent_performance AS
SELECT
  l.agency_id,
  l.owner_id as agent_id,
  COUNT(*) as leads_count,
  AVG(EXTRACT(epoch FROM (l.first_contacted_at - l.created_at))) FILTER (WHERE l.first_contacted_at IS NOT NULL) as first_response_seconds,
  COUNT(a.*) as appointments_count,
  COUNT(a.*) FILTER (WHERE a.status = 'completed') as appointments_completed,
  COUNT(p.*) as policies_count,
  COALESCE(SUM(p.premium_amount), 0) as total_premium,
  COALESCE(SUM(p.commission_amount), 0) as total_commission,
  CURRENT_TIMESTAMP as last_updated
FROM leads l
LEFT JOIN appointments a ON a.lead_id = l.id
LEFT JOIN policies p ON p.lead_id = l.id
WHERE l.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY l.agency_id, l.owner_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS mv_agent_performance_idx ON mv_agent_performance (agency_id, agent_id);

-- Enable RLS on new tables
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agency members can view import jobs" ON import_jobs
  FOR SELECT USING (is_agency_member(agency_id));

CREATE POLICY "Agency members can manage import jobs" ON import_jobs
  FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Agency members can view provider credentials" ON provider_credentials
  FOR SELECT USING (is_agency_member(agency_id));

CREATE POLICY "Agency admins can manage provider credentials" ON provider_credentials
  FOR ALL USING (has_role(agency_id, ARRAY['owner', 'admin']));

CREATE POLICY "Agency members can view message templates" ON message_templates
  FOR SELECT USING (is_agency_member(agency_id));

CREATE POLICY "Agency members can manage message templates" ON message_templates
  FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Agency members can view sequences" ON sequences
  FOR SELECT USING (is_agency_member(agency_id));

CREATE POLICY "Agency members can manage sequences" ON sequences
  FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Agency members can view sequence steps" ON sequence_steps
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM sequences s WHERE s.id = sequence_id AND is_agency_member(s.agency_id)
  ));

CREATE POLICY "Agency members can manage sequence steps" ON sequence_steps
  FOR ALL USING (EXISTS (
    SELECT 1 FROM sequences s WHERE s.id = sequence_id AND is_agency_member(s.agency_id)
  ));

CREATE POLICY "Agency members can view sequence enrollments" ON sequence_enrollments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM leads l WHERE l.id = lead_id AND is_agency_member(l.agency_id)
  ));

CREATE POLICY "Agency members can manage sequence enrollments" ON sequence_enrollments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM leads l WHERE l.id = lead_id AND is_agency_member(l.agency_id)
  ));

CREATE POLICY "Agency members can view outbox" ON outbox
  FOR SELECT USING (is_agency_member(agency_id));

CREATE POLICY "Service role can manage outbox" ON outbox
  FOR ALL USING (true);

CREATE POLICY "Agency members can view audit log" ON audit_log
  FOR SELECT USING (is_agency_member(agency_id));

CREATE POLICY "Service role can create audit log" ON audit_log
  FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_jobs_agency_status ON import_jobs(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_outbox_scheduled ON outbox(scheduled_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_next_send ON sequence_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_audit_log_agency_created ON audit_log(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id) WHERE owner_id IS NOT NULL;