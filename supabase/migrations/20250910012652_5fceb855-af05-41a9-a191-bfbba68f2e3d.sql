-- Create policies table for tracking sold insurance policies and commissions
CREATE TABLE public.policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  policy_number TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  premium_amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  effective_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT auth.uid()
);

-- Enable Row Level Security
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Create policies for agency access
CREATE POLICY "Agency members can view policies" 
ON public.policies 
FOR SELECT 
USING (is_agency_member(agency_id));

CREATE POLICY "Agency members can create policies" 
ON public.policies 
FOR INSERT 
WITH CHECK (is_agency_member(agency_id));

CREATE POLICY "Agency members can update policies" 
ON public.policies 
FOR UPDATE 
USING (is_agency_member(agency_id))
WITH CHECK (is_agency_member(agency_id));

CREATE POLICY "Agency members can delete policies" 
ON public.policies 
FOR DELETE 
USING (is_agency_member(agency_id));

-- Create trigger for updated_at
CREATE TRIGGER update_policies_updated_at
BEFORE UPDATE ON public.policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_policies_agency_id ON public.policies(agency_id);
CREATE INDEX idx_policies_lead_id ON public.policies(lead_id);
CREATE INDEX idx_policies_status ON public.policies(status);
CREATE INDEX idx_policies_effective_date ON public.policies(effective_date);

-- Update leads table to add more status tracking
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_agent_id UUID;