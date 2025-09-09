-- Fix RLS policies for agencies table to allow agency creation
-- Remove the overly broad "Agencies manage own" policy that blocks inserts
DROP POLICY IF EXISTS "Agencies manage own" ON public.agencies;

-- Create separate policies for different operations
CREATE POLICY "Users can create agencies" 
ON public.agencies 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Agency members can update agencies" 
ON public.agencies 
FOR UPDATE 
USING (is_agency_member(id))
WITH CHECK (is_agency_member(id));

CREATE POLICY "Agency members can delete agencies" 
ON public.agencies 
FOR DELETE 
USING (is_agency_member(id));