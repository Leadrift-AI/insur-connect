-- Add user activity tracking and status management

-- Create user activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_agency_id ON public.user_activity_logs(agency_id);
CREATE INDEX idx_user_activity_logs_action ON public.user_activity_logs(action);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);

-- Enable RLS on user activity logs
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user activity logs
CREATE POLICY "Agency members can view activity logs" 
ON public.user_activity_logs 
FOR SELECT 
USING (is_agency_member(agency_id));

CREATE POLICY "Users can create activity logs" 
ON public.user_activity_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add status and last_seen fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add invitation management fields
ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS resent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMP WITH TIME ZONE;

-- Create function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_id UUID;
  user_agency_id UUID;
BEGIN
  -- Get user's agency
  SELECT agency_id INTO user_agency_id
  FROM profiles
  WHERE user_id = auth.uid();

  IF user_agency_id IS NULL THEN
    RAISE EXCEPTION 'User has no agency assigned';
  END IF;

  -- Insert activity log
  INSERT INTO user_activity_logs (
    user_id,
    agency_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    user_agency_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$;

-- Create function to update user last seen
CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET last_seen_at = now() 
  WHERE user_id = auth.uid();
END;
$$;