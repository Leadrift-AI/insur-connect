import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CALENDAR-SYNC] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get request body
    const body = await req.json();
    const { appointmentId, action } = body;

    if (!appointmentId || !action) {
      throw new Error('Missing appointmentId or action');
    }

    logStep("Processing appointment", { appointmentId, action });

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        leads (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error(`Failed to fetch appointment: ${appointmentError?.message}`);
    }

    logStep("Appointment fetched", { 
      leadName: `${appointment.leads?.first_name} ${appointment.leads?.last_name}`,
      scheduledAt: appointment.scheduled_at 
    });

    // Get user's calendar integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', appointment.created_by || appointment.agency_id) // Fallback to agency_id if no created_by
      .eq('provider', 'google')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (integrationError || !integration) {
      logStep("No active calendar integration found");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No active calendar integration found' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    logStep("Calendar integration found", { provider: integration.provider });

    // Check if access token is expired and refresh if needed
    let accessToken = integration.access_token;
    
    if (integration.expires_at && new Date(integration.expires_at) <= new Date()) {
      logStep("Access token expired, refreshing");
      
      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') ?? '',
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      
      // Update the integration with new token
      await supabaseClient
        .from('calendar_integrations')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
        })
        .eq('id', integration.id);

      logStep("Access token refreshed");
    }

    if (action === 'create' || action === 'update') {
      // Create or update Google Calendar event
      const eventData: GoogleCalendarEvent = {
        summary: `Appointment with ${appointment.leads?.first_name} ${appointment.leads?.last_name}`,
        description: appointment.notes || 'Leadrift appointment',
        start: {
          dateTime: appointment.scheduled_at,
          timeZone: 'America/New_York', // You might want to make this configurable
        },
        end: {
          dateTime: new Date(new Date(appointment.scheduled_at).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
          timeZone: 'America/New_York',
        },
      };

      if (appointment.leads?.email) {
        eventData.attendees = [{
          email: appointment.leads.email,
          displayName: `${appointment.leads.first_name} ${appointment.leads.last_name}`,
        }];
      }

      let googleEventId = appointment.google_event_id;
      let apiUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      let method = 'POST';

      // If updating existing event
      if (action === 'update' && googleEventId) {
        apiUrl += `/${googleEventId}`;
        method = 'PUT';
      }

      logStep(`${action === 'create' ? 'Creating' : 'Updating'} Google Calendar event`);

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Calendar API error: ${response.status} - ${errorText}`);
      }

      const eventResponse = await response.json();
      googleEventId = eventResponse.id;

      logStep("Google Calendar event created/updated", { eventId: googleEventId });

      // Update appointment with Google event ID
      const { error: updateError } = await supabaseClient
        .from('appointments')
        .update({ google_event_id: googleEventId })
        .eq('id', appointmentId);

      if (updateError) {
        logStep("Failed to update appointment with Google event ID", { error: updateError });
      }

    } else if (action === 'delete' && appointment.google_event_id) {
      // Delete Google Calendar event
      logStep("Deleting Google Calendar event", { eventId: appointment.google_event_id });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.google_event_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        logStep("Failed to delete Google Calendar event", { error: errorText });
      } else {
        logStep("Google Calendar event deleted successfully");
        
        // Clear Google event ID from appointment
        await supabaseClient
          .from('appointments')
          .update({ google_event_id: null })
          .eq('id', appointmentId);
      }
    }

    return new Response(
      JSON.stringify({ success: true, googleEventId: appointment.google_event_id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in calendar-sync", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});