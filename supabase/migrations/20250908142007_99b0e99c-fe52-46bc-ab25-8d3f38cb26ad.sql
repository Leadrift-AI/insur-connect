-- Update agency members table to support new role system
-- First, let's see what roles currently exist and add the new ones
-- Adding support for Admin, Agent, Staff, and Manager (read-only) roles

-- Create enum for standardized roles
CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'agent', 'staff', 'manager');

-- Add a constraint to ensure valid roles (for now, keep it flexible with text)
-- We'll use a check constraint instead of enum to allow for future flexibility
ALTER TABLE public.agency_members 
DROP CONSTRAINT IF EXISTS valid_role_check;

ALTER TABLE public.agency_members 
ADD CONSTRAINT valid_role_check 
CHECK (role IN ('owner', 'admin', 'agent', 'staff', 'manager'));

-- Create a user invitations table for managing team member invites
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_invitation_role_check CHECK (role IN ('admin', 'agent', 'staff', 'manager'))
);

-- Enable RLS for user invitations
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for user invitations
CREATE POLICY "Agency admins can manage invitations" 
ON public.user_invitations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members am 
    WHERE am.agency_id = user_invitations.agency_id 
    AND am.user_id = auth.uid() 
    AND am.role IN ('owner', 'admin')
  )
);

-- Create a function to accept invitations
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record user_invitations;
  user_id UUID;
BEGIN
  -- Get the current user
  user_id := auth.uid();
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Find the invitation
  SELECT * INTO invitation_record
  FROM user_invitations
  WHERE invite_token = invitation_token
    AND expires_at > now()
    AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired invitation');
  END IF;

  -- Check if user email matches invitation email
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND email = invitation_record.email
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Email does not match invitation');
  END IF;

  -- Add user to agency
  INSERT INTO agency_members (agency_id, user_id, role)
  VALUES (invitation_record.agency_id, user_id, invitation_record.role)
  ON CONFLICT (agency_id, user_id) DO UPDATE SET role = invitation_record.role;

  -- Update profile with agency_id if not set
  UPDATE profiles 
  SET agency_id = invitation_record.agency_id
  WHERE user_id = user_id AND agency_id IS NULL;

  -- Mark invitation as accepted
  UPDATE user_invitations
  SET accepted_at = now(), accepted_by = user_id
  WHERE invite_token = invitation_token;

  RETURN jsonb_build_object('success', true, 'message', 'Invitation accepted successfully');
END;
$$;