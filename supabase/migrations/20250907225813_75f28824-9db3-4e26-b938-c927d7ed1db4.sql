-- Create campaigns table for agencies to track their marketing efforts
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL, -- 'facebook_ads', 'google_ads', 'linkedin', 'referral', 'website', 'email', 'other'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'draft'
  budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  target_audience TEXT,
  campaign_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT auth.uid()
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns
CREATE POLICY "Campaigns manage own" 
ON public.campaigns 
FOR ALL 
USING (is_agency_member(agency_id))
WITH CHECK (is_agency_member(agency_id));

CREATE POLICY "Campaigns view own" 
ON public.campaigns 
FOR SELECT 
USING (is_agency_member(agency_id));

-- Add campaign_id to leads table and enhance source tracking
ALTER TABLE public.leads 
ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id),
ADD COLUMN source_details JSONB, -- Store additional source-specific data
ADD COLUMN utm_source TEXT,
ADD COLUMN utm_medium TEXT,
ADD COLUMN utm_campaign TEXT,
ADD COLUMN utm_content TEXT,
ADD COLUMN utm_term TEXT,
ADD COLUMN referrer_url TEXT,
ADD COLUMN landing_page TEXT;

-- Create campaign performance materialized view
CREATE MATERIALIZED VIEW public.mv_campaign_performance AS
SELECT 
  c.id as campaign_id,
  c.agency_id,
  c.name as campaign_name,
  c.campaign_type,
  c.status,
  c.budget,
  COUNT(l.id) as total_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'new') as new_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'contacted') as contacted_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'booked') as booked_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'showed') as showed_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'won') as won_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'lost') as lost_leads,
  CASE 
    WHEN COUNT(l.id) > 0 
    THEN ROUND((COUNT(l.id) FILTER (WHERE l.status = 'won')::DECIMAL / COUNT(l.id) * 100), 2)
    ELSE 0 
  END as conversion_rate,
  CASE 
    WHEN c.budget > 0 AND COUNT(l.id) > 0 
    THEN ROUND((c.budget / COUNT(l.id)), 2)
    ELSE 0 
  END as cost_per_lead,
  c.created_at,
  c.updated_at
FROM public.campaigns c
LEFT JOIN public.leads l ON c.id = l.campaign_id
GROUP BY c.id, c.agency_id, c.name, c.campaign_type, c.status, c.budget, c.created_at, c.updated_at;

-- Create indexes for better performance
CREATE INDEX idx_campaigns_agency_id ON public.campaigns(agency_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_type ON public.campaigns(campaign_type);
CREATE INDEX idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_utm_source ON public.leads(utm_source);

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_mv_campaign_performance_campaign_id ON public.mv_campaign_performance(campaign_id);

-- Create function to refresh campaign performance
CREATE OR REPLACE FUNCTION public.refresh_campaign_performance()
RETURNS void
LANGUAGE sql
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_campaign_performance;
$$;

-- Create trigger to update campaigns updated_at
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();