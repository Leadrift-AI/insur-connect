-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_agency_created ON public.leads(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_agency_created ON public.appointments(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policies_agency_created ON public.policies(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_agency_status ON public.campaigns(agency_id, status);

-- Add google_event_id to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Extend agencies table for Stripe
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 1;

-- Create KPI RPC function for efficient querying
CREATE OR REPLACE FUNCTION public.kpis_for_range(
  aid UUID,
  from_ts TIMESTAMPTZ,
  to_ts TIMESTAMPTZ
)
RETURNS TABLE(
  new_leads INTEGER,
  appointments INTEGER,
  conversion_rate NUMERIC,
  policies_sold INTEGER,
  commissions NUMERIC,
  average_deal_size NUMERIC,
  total_revenue NUMERIC,
  campaign_spend NUMERIC,
  roas NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  leads_count INTEGER;
  appointments_count INTEGER;
  policies_count INTEGER;
  total_commissions NUMERIC;
  total_premium NUMERIC;
  total_spend NUMERIC;
BEGIN
  -- Check agency membership
  IF NOT is_agency_member(aid) THEN
    RAISE EXCEPTION 'Not authorized for this agency';
  END IF;

  -- Get leads count (new status within date range)
  SELECT COUNT(*) INTO leads_count
  FROM public.leads l
  WHERE l.agency_id = aid 
    AND l.status = 'new'
    AND l.created_at >= from_ts 
    AND l.created_at <= to_ts;

  -- Get appointments count within date range
  SELECT COUNT(*) INTO appointments_count
  FROM public.appointments a
  WHERE a.agency_id = aid
    AND a.created_at >= from_ts 
    AND a.created_at <= to_ts;

  -- Get policies data within date range
  SELECT 
    COUNT(*),
    COALESCE(SUM(p.commission_amount), 0),
    COALESCE(SUM(p.premium_amount), 0)
  INTO policies_count, total_commissions, total_premium
  FROM public.policies p
  WHERE p.agency_id = aid
    AND p.status = 'active'
    AND p.created_at >= from_ts 
    AND p.created_at <= to_ts;

  -- Get campaign spend for active campaigns
  SELECT COALESCE(SUM(c.budget), 0) INTO total_spend
  FROM public.campaigns c
  WHERE c.agency_id = aid
    AND c.status = 'active';

  -- Return calculated KPIs
  RETURN QUERY SELECT
    leads_count as new_leads,
    appointments_count as appointments,
    CASE 
      WHEN leads_count > 0 THEN ROUND((appointments_count::NUMERIC / leads_count::NUMERIC) * 100, 2)
      ELSE 0::NUMERIC
    END as conversion_rate,
    policies_count as policies_sold,
    COALESCE(total_commissions, 0) as commissions,
    CASE 
      WHEN policies_count > 0 THEN ROUND(total_premium / policies_count, 2)
      ELSE 0::NUMERIC
    END as average_deal_size,
    COALESCE(total_premium, 0) as total_revenue,
    COALESCE(total_spend, 0) as campaign_spend,
    CASE 
      WHEN total_spend > 0 THEN ROUND((total_premium / total_spend) * 100, 2)
      ELSE 0::NUMERIC
    END as roas;
END;
$$;