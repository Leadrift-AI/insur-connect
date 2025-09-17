import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withSentry } from "../_shared/sentry.ts";
import { auditLog } from "../_shared/audit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  role: string;
  emails?: string[]; // For bulk invites
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[INVITE-USER] ${step}${detailsStr}`);
};

const acquireSeatLock = async (supabaseClient: any, agencyId: string): Promise<boolean> => {
  try {
    // Use PostgreSQL advisory lock for atomic seat checking
    const lockId = parseInt(agencyId.replace(/\D/g, '').substring(0, 10)) || 12345;

    const { data, error } = await supabaseClient
      .rpc('pg_try_advisory_lock', { lockid: lockId });

    if (error) {
      logStep("Failed to acquire advisory lock", { error: error.message });
      return false;
    }

    return data === true;
  } catch (error) {
    logStep("Exception acquiring seat lock", { error: error.message });
    return false;
  }
};

const releaseSeatLock = async (supabaseClient: any, agencyId: string): Promise<void> => {
  try {
    const lockId = parseInt(agencyId.replace(/\D/g, '').substring(0, 10)) || 12345;

    await supabaseClient
      .rpc('pg_advisory_unlock', { lockid: lockId });
  } catch (error) {
    logStep("Exception releasing seat lock", { error: error.message });
  }
};

const checkSeatAvailability = async (
  supabaseClient: any,
  agencyId: string,
  requestedInvites: number
): Promise<{ canProceed: boolean; availableSeats: number; details: string }> => {

  try {
    // Use the new RPC function for atomic seat checking
    const { data, error } = await supabaseClient
      .rpc('enforce_seat_limit_for_invitations', {
        p_agency: agencyId,
        p_new_invitations: requestedInvites
      });

    if (error) {
      logStep("Error checking seat availability", { error: error.message });
      throw new Error(`Failed to check seat availability: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No seat availability data returned');
    }

    const result = data[0];
    return {
      canProceed: result.can_invite,
      availableSeats: result.available_seats,
      details: result.usage_details
    };
  } catch (error) {
    logStep("Exception in seat availability check", { error: error.message });
    throw error;
  }
};

const inviteUserHandler = async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client with service role key
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  let lockAcquired = false;
  let agencyId = '';

  try {
    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Get user's agency and verify permissions
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.agency_id) {
      throw new Error('User not associated with an agency');
    }

    agencyId = profile.agency_id;

    // Check if user has permission to invite (admin or owner)
    const { data: membership, error: membershipError } = await supabaseClient
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      throw new Error('Insufficient permissions to invite users');
    }

    const body: InviteRequest = await req.json();
    const { email, emails, role } = body;

    // Normalize to email array
    const emailList = emails || (email ? [email] : []);

    if (emailList.length === 0) {
      throw new Error('No email addresses provided');
    }

    // Validate role
    const validRoles = ['admin', 'agent', 'staff', 'manager'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
    }

    logStep("Processing invitations", {
      agencyId,
      inviterUserId: user.id,
      emailCount: emailList.length,
      role
    });

    // Acquire seat lock for atomic checking
    lockAcquired = await acquireSeatLock(supabaseClient, agencyId);
    if (!lockAcquired) {
      throw new Error('Unable to acquire seat lock, please try again');
    }

    // Check seat availability
    const seatCheck = await checkSeatAvailability(supabaseClient, agencyId, emailList.length);

    logStep("Seat availability check", seatCheck);

    if (!seatCheck.canProceed) {
      throw new Error(
        `Seat limit exceeded. ${seatCheck.details}. Increase seats in Billing to invite more agents.`
      );
    }

    // Check for existing invitations or users
    const { data: existingInvitations } = await supabaseClient
      .from('user_invitations')
      .select('email')
      .eq('agency_id', agencyId)
      .in('email', emailList)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());

    const existingEmails = existingInvitations?.map(inv => inv.email) || [];

    // Check for existing agency members
    const { data: existingUsers } = await supabaseClient
      .from('profiles')
      .select('email')
      .in('email', emailList);

    const existingUserEmails = existingUsers?.map(u => u.email).filter(Boolean) || [];

    // Filter out already invited/existing users
    const newEmails = emailList.filter(
      e => !existingEmails.includes(e) && !existingUserEmails.includes(e)
    );

    if (newEmails.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'All provided email addresses are already invited or are existing users',
          details: {
            alreadyInvited: existingEmails,
            existingUsers: existingUserEmails
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Final atomic seat limit enforcement before creating invitations
    try {
      await supabaseClient.rpc('enforce_seat_limit', { p_agency: agencyId });
      logStep("Seat limit enforcement passed", { agencyId, newInvitations: newEmails.length });
    } catch (seatError) {
      logStep("Seat limit enforcement failed", { error: seatError.message });
      throw new Error(`Seat limit check failed: ${seatError.message}`);
    }

    // Create invitations
    const invitations = newEmails.map(emailAddr => ({
      agency_id: agencyId,
      email: emailAddr,
      role: role,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }));

    const { data: createdInvitations, error: inviteError } = await supabaseClient
      .from('user_invitations')
      .insert(invitations)
      .select();

    if (inviteError) {
      logStep("Failed to create invitations", { error: inviteError.message });
      throw new Error(`Failed to create invitations: ${inviteError.message}`);
    }

    // Log audit trail for each invitation
    for (const invitation of createdInvitations || []) {
      await auditLog(supabaseClient, {
        actor_id: user.id,
        agency_id: agencyId,
        entity: 'user_invitation',
        action: 'created',
        entity_id: invitation.id,
        diff: {
          email: invitation.email,
          role: invitation.role,
          invited_count: newEmails.length
        }
      });
    }

    logStep("Invitations created successfully", {
      created: newEmails.length,
      skipped: emailList.length - newEmails.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        created: newEmails.length,
        skipped: emailList.length - newEmails.length,
        details: {
          createdInvitations: newEmails,
          alreadyInvited: existingEmails,
          existingUsers: existingUserEmails,
          seatUsage: seatCheck.details
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in invite-user", { message: errorMessage });

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  } finally {
    // Always release the lock
    if (lockAcquired && agencyId) {
      await releaseSeatLock(supabaseClient, agencyId);
    }
  }
};

serve(withSentry(inviteUserHandler, 'invite-user'));