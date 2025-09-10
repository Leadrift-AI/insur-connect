-- Fix security issues from previous migration

-- Add RLS policy for billing_events table
CREATE POLICY "Service role can manage billing events" ON billing_events
  FOR ALL USING (true);

-- Fix function search paths for existing functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token text)
RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.log_user_activity(p_action text, p_resource_type text DEFAULT NULL::text, p_resource_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.handle_owner_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    NEW.owner_user_id := NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.kpis_for_range(aid uuid, from_ts timestamp with time zone, to_ts timestamp with time zone)
RETURNS TABLE(new_leads integer, appointments integer, conversion_rate numeric, policies_sold integer, commissions numeric, average_deal_size numeric, total_revenue numeric, campaign_spend numeric, roas numeric)
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

CREATE OR REPLACE FUNCTION public.create_lead(p_agency_id uuid, p jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.is_agency_member(p_agency_id) THEN
    RAISE EXCEPTION 'not a member of this agency';
  END IF;
  INSERT INTO public.leads (
    id, agency_id, full_name, first_name, last_name, email, phone, source, status
  ) VALUES (
    gen_random_uuid(),
    p_agency_id,
    coalesce(p->>'full_name', concat_ws(' ', p->>'first_name', p->>'last_name')),
    p->>'first_name',
    p->>'last_name',
    p->>'email',
    p->>'phone',
    coalesce(p->>'source', 'portal'),
    'new'
  ) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_member(aid uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.agency_id = aid
      AND m.user_id   = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_agency_id uuid;
  agency_name text;
  user_name text;
BEGIN
  -- Set defaults
  new_agency_id := gen_random_uuid();
  user_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User');
  agency_name := user_name || '''s Agency';
  
  -- Create agency
  INSERT INTO public.agencies (id, name, created_by, owner_user_id)
  VALUES (new_agency_id, agency_name, NEW.id, NEW.id);

  -- Create memberships
  INSERT INTO public.agency_members (agency_id, user_id, role)
  VALUES (new_agency_id, NEW.id, 'owner');
  
  INSERT INTO public.memberships (agency_id, user_id, role)
  VALUES (new_agency_id, NEW.id, 'owner');

  -- Create profile
  INSERT INTO public.profiles (id, user_id, email, full_name, agency_id)
  VALUES (NEW.id, NEW.id, NEW.email, user_name, new_agency_id);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Signup failed: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_lead_status(p_lead uuid, p_to text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.leads l
    SET status = p_to
  WHERE l.id = p_lead
    AND public.is_member(l.agency_id);
$$;

CREATE OR REPLACE FUNCTION public.is_agency_member(aid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members am
    WHERE am.agency_id = aid
      AND am.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(aid uuid, roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members am
    WHERE am.agency_id = aid
      AND am.user_id = auth.uid()
      AND am.role = ANY(roles)
  );
$$;

-- Add function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_agent_performance()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_agent_performance;
$$;

-- Remove materialized view from API access (make it not accessible via PostgREST)
REVOKE ALL ON mv_agent_performance FROM anon, authenticated;
REVOKE ALL ON mv_campaign_performance FROM anon, authenticated;
REVOKE ALL ON mv_kpi_agency_daily FROM anon, authenticated;