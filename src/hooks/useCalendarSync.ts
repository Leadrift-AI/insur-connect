import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { calendarService } from '@/services/calendar';

export const useCalendarSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const syncAppointment = useCallback(async (appointmentId: string) => {
    if (!user) {
      console.warn('No user authenticated for calendar sync');
      return;
    }

    try {
      await calendarService.syncAppointmentToCalendar(appointmentId);
      
      toast({
        title: "Calendar Synced",
        description: "Appointment has been added to your calendar",
      });
    } catch (error) {
      console.error('Calendar sync failed:', error);
      
      // Don't show error toast for missing integrations (expected behavior)
      if (error instanceof Error && !error.message.includes('No active calendar integration')) {
        toast({
          title: "Sync Failed",
          description: "Could not sync appointment to calendar",
          variant: "destructive",
        });
      }
    }
  }, [user, toast]);

  const syncAllAppointments = useCallback(async (appointmentIds: string[]) => {
    if (!user) {
      console.warn('No user authenticated for calendar sync');
      return;
    }

    const results = await Promise.allSettled(
      appointmentIds.map(id => calendarService.syncAppointmentToCalendar(id))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.length - successful;

    if (successful > 0) {
      toast({
        title: "Sync Complete",
        description: `${successful} appointment(s) synced to calendar${failed > 0 ? `, ${failed} failed` : ''}`,
      });
    } else if (failed > 0) {
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${failed} appointment(s)`,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  return {
    syncAppointment,
    syncAllAppointments,
  };
};