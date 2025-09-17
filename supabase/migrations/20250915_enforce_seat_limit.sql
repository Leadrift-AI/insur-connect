-- Migration: Add enforce_seat_limit RPC function for atomic seat checking
-- Created: 2025-09-15

-- Function to enforce seat limits atomically
CREATE OR REPLACE FUNCTION enforce_seat_limit(p_agency UUID)
RETURNS VOID AS $$
DECLARE
    v_total_seats INTEGER;
    v_active_agents BIGINT;
    v_pending_invitations BIGINT;
    v_used_seats INTEGER;
    v_available_seats INTEGER;
BEGIN
    -- Get agency seat limit
    SELECT seats INTO v_total_seats
    FROM agencies
    WHERE id = p_agency;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agency not found: %', p_agency;
    END IF;

    -- Count active agents
    SELECT COUNT(*) INTO v_active_agents
    FROM agency_members
    WHERE agency_id = p_agency;

    -- Count pending invitations (not expired)
    SELECT COUNT(*) INTO v_pending_invitations
    FROM user_invitations
    WHERE agency_id = p_agency
      AND accepted_at IS NULL
      AND expires_at > NOW();

    -- Calculate usage
    v_used_seats := v_active_agents + v_pending_invitations;
    v_available_seats := v_total_seats - v_used_seats;

    -- Log the check for debugging
    RAISE NOTICE 'Seat check for agency %: total=%, active=%, pending=%, used=%, available=%',
        p_agency, v_total_seats, v_active_agents, v_pending_invitations, v_used_seats, v_available_seats;

    -- Enforce the limit
    IF v_available_seats <= 0 THEN
        RAISE EXCEPTION 'Seat limit exceeded. Agency % has % total seats, % in use (% active agents + % pending invitations). Increase seats in Billing to invite more agents.',
            p_agency, v_total_seats, v_used_seats, v_active_agents, v_pending_invitations;
    END IF;

    -- Success - seats are available
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION enforce_seat_limit(UUID) TO service_role;

-- Enhanced version that also supports checking for N new invitations
CREATE OR REPLACE FUNCTION enforce_seat_limit_for_invitations(p_agency UUID, p_new_invitations INTEGER DEFAULT 1)
RETURNS TABLE(
    available_seats INTEGER,
    can_invite BOOLEAN,
    usage_details TEXT
) AS $$
DECLARE
    v_total_seats INTEGER;
    v_active_agents BIGINT;
    v_pending_invitations BIGINT;
    v_used_seats INTEGER;
    v_available_seats INTEGER;
    v_can_invite BOOLEAN;
    v_usage_details TEXT;
BEGIN
    -- Get agency seat limit
    SELECT seats INTO v_total_seats
    FROM agencies
    WHERE id = p_agency;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agency not found: %', p_agency;
    END IF;

    -- Count active agents
    SELECT COUNT(*) INTO v_active_agents
    FROM agency_members
    WHERE agency_id = p_agency;

    -- Count pending invitations (not expired)
    SELECT COUNT(*) INTO v_pending_invitations
    FROM user_invitations
    WHERE agency_id = p_agency
      AND accepted_at IS NULL
      AND expires_at > NOW();

    -- Calculate usage
    v_used_seats := v_active_agents + v_pending_invitations;
    v_available_seats := v_total_seats - v_used_seats;
    v_can_invite := v_available_seats >= p_new_invitations;

    -- Create usage details string
    v_usage_details := format('%s/%s seats used (%s active + %s pending), %s available, requesting %s',
        v_used_seats, v_total_seats, v_active_agents, v_pending_invitations, v_available_seats, p_new_invitations);

    -- Return the results
    RETURN QUERY SELECT v_available_seats, v_can_invite, v_usage_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role and authenticated users
GRANT EXECUTE ON FUNCTION enforce_seat_limit_for_invitations(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION enforce_seat_limit_for_invitations(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION enforce_seat_limit(UUID) IS 'Enforces seat limits atomically, throws exception if limit exceeded';
COMMENT ON FUNCTION enforce_seat_limit_for_invitations(UUID, INTEGER) IS 'Checks seat availability for N new invitations, returns detailed info';