import { supabase } from "@/integrations/supabase/client";

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export interface CalendarIntegration {
  id: string;
  user_id: string;
  provider: string; // Allow any string to match database types
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  calendar_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class CalendarService {
  private readonly GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

  async initGoogleAuth(): Promise<string> {
    // Get the client ID from environment (this should be a public key)
    const clientId = '264336951291-hcjcqagon99s6muce1hf12qnd513pqoc.apps.googleusercontent.com';
    
    const redirectUri = `https://qjfsxniavmgckkgaifmf.supabase.co/functions/v1/calendar-oauth`;
    const scope = 'https://www.googleapis.com/auth/calendar';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    return authUrl;
  }

  async createEvent(integration: CalendarIntegration, event: CalendarEvent): Promise<string> {
    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${integration.calendar_id || 'primary'}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create calendar event: ${response.statusText}`);
    }

    const createdEvent = await response.json();
    return createdEvent.id;
  }

  async updateEvent(integration: CalendarIntegration, eventId: string, event: CalendarEvent): Promise<void> {
    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${integration.calendar_id || 'primary'}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update calendar event: ${response.statusText}`);
    }
  }

  async deleteEvent(integration: CalendarIntegration, eventId: string): Promise<void> {
    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${integration.calendar_id || 'primary'}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete calendar event: ${response.statusText}`);
    }
  }

  async deleteCalendarEvent(calendarEventId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    // Get the user's active calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (integrationError || !integration) {
      console.log('No active calendar integration found for event deletion');
      return;
    }

    await this.deleteEvent(integration, calendarEventId);
  }

  async updateCalendarEvent(appointmentId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        leads (
          full_name,
          email,
          phone
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment || !appointment.calendar_event_id) {
      throw new Error('Failed to fetch appointment details or no calendar event ID');
    }

    // Get the user's active calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (integrationError || !integration) {
      console.log('No active calendar integration found for event update');
      return;
    }

    const scheduledAt = new Date(appointment.scheduled_at);
    const endTime = new Date(scheduledAt.getTime() + 60 * 60 * 1000); // 1 hour duration

    const calendarEvent: CalendarEvent = {
      summary: `Appointment with ${appointment.leads?.full_name || 'Client'}`,
      description: appointment.notes || 'Insurance consultation appointment',
      start: {
        dateTime: scheduledAt.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: appointment.leads?.email ? [{
        email: appointment.leads.email,
        displayName: appointment.leads.full_name,
      }] : undefined,
    };

    await this.updateEvent(integration, appointment.calendar_event_id, calendarEvent);
  }

  async syncAppointmentToCalendar(appointmentId: string): Promise<void> {
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        leads (
          full_name,
          email,
          phone
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Failed to fetch appointment details');
    }

    // Get the user's profile to find their user_id from the agency
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('agency_id', appointment.agency_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Failed to fetch user profile');
    }

    const { data: integration, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (integrationError || !integration) {
      console.log('No active calendar integration found');
      return;
    }

    const scheduledAt = new Date(appointment.scheduled_at);
    const endTime = new Date(scheduledAt.getTime() + 60 * 60 * 1000); // 1 hour duration

    const calendarEvent: CalendarEvent = {
      summary: `Appointment with ${appointment.leads?.full_name || 'Client'}`,
      description: appointment.notes || 'Insurance consultation appointment',
      start: {
        dateTime: scheduledAt.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: appointment.leads?.email ? [{
        email: appointment.leads.email,
        displayName: appointment.leads.full_name,
      }] : undefined,
    };

    try {
      // If appointment already has a calendar event ID, update it; otherwise create new
      if (appointment.calendar_event_id) {
        await this.updateEvent(integration, appointment.calendar_event_id, calendarEvent);
      } else {
        const calendarEventId = await this.createEvent(integration, calendarEvent);
        
        // Store the calendar event ID in the appointment
        await supabase
          .from('appointments')
          .update({ calendar_event_id: calendarEventId })
          .eq('id', appointmentId);
      }
    } catch (error) {
      console.error('Failed to sync appointment to calendar:', error);
      throw error;
    }
  }

  async getIntegrations(userId: string): Promise<CalendarIntegration[]> {
    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch calendar integrations: ${error.message}`);
    }

    return data || [];
  }

  async toggleIntegration(integrationId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('calendar_integrations')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', integrationId);

    if (error) {
      throw new Error(`Failed to toggle integration: ${error.message}`);
    }
  }
}

export const calendarService = new CalendarService();