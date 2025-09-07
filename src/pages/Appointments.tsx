import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AppointmentsCalendar from '@/components/appointments/AppointmentsCalendar';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import CreateAppointmentDialog from '@/components/appointments/CreateAppointmentDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, List, Loader2 } from 'lucide-react';

interface Appointment {
  id: string;
  lead_id: string;
  scheduled_at: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  leads?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

const Appointments = () => {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Get user's agency
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.agency_id) {
        console.log('No agency found for user');
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Fetch appointments with lead details
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          leads (
            full_name,
            email,
            phone
          )
        `)
        .eq('agency_id', profile.agency_id)
        .order('scheduled_at', { ascending: true });

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Appointments</h1>
            <p className="text-muted-foreground">
              Manage and schedule appointments with your leads
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Calendar View</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <List className="h-4 w-4" />
              <span>List View</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <AppointmentsCalendar 
              appointments={appointments} 
              onRefresh={fetchAppointments}
            />
          </TabsContent>

          <TabsContent value="list">
            <AppointmentsList 
              appointments={appointments} 
              onRefresh={fetchAppointments}
            />
          </TabsContent>
        </Tabs>

        <CreateAppointmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            setCreateDialogOpen(false);
            fetchAppointments();
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Appointments;