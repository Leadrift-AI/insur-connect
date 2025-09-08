-- Update campaigns table RLS policies for role-based access control
-- Drop existing policies
DROP POLICY IF EXISTS "Campaigns manage own" ON public.campaigns;
DROP POLICY IF EXISTS "Campaigns view own" ON public.campaigns;

-- Create new role-based policies
-- Only owners and admins can create campaigns
CREATE POLICY "Team can create campaigns" ON public.campaigns
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agency_members am 
    WHERE am.agency_id = campaigns.agency_id 
    AND am.user_id = auth.uid() 
    AND am.role IN ('owner', 'admin')
  )
);

-- Only owners and admins can update campaigns
CREATE POLICY "Team can update campaigns" ON public.campaigns
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members am 
    WHERE am.agency_id = campaigns.agency_id 
    AND am.user_id = auth.uid() 
    AND am.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agency_members am 
    WHERE am.agency_id = campaigns.agency_id 
    AND am.user_id = auth.uid() 
    AND am.role IN ('owner', 'admin')
  )
);

-- Only owners and admins can delete campaigns
CREATE POLICY "Team can delete campaigns" ON public.campaigns
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members am 
    WHERE am.agency_id = campaigns.agency_id 
    AND am.user_id = auth.uid() 
    AND am.role IN ('owner', 'admin')
  )
);

-- All agency members can view campaigns and analytics
CREATE POLICY "Agency members can view campaigns" ON public.campaigns
FOR SELECT 
USING (is_agency_member(agency_id));