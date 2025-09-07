import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Phone, Mail, Edit, Trash2, CheckCircle, XCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import EditAppointmentDialog from './EditAppointmentDialog';

interface Appointment {
  id: string;
  lead_id: string;
  scheduled_at: string;
  status: string;
  notes: string;
  calendar_event_id?: string;
  leads?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface AppointmentsListProps {
  appointments: Appointment[];
  onRefresh: () => void;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'no-show':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const AppointmentsList = ({ appointments, onRefresh }: AppointmentsListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();
  const { syncAppointment, syncAllAppointments, deleteCalendarEvent } = useCalendarSync();

  const filteredAppointments = appointments.filter(apt => 
    statusFilter === 'all' || apt.status === statusFilter
  );

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error updating appointment:', error);
        toast({
          title: "Error",
          description: "Failed to update appointment status",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Appointment status updated successfully"
        });
        
        // Sync updated appointment to calendar
        await syncAppointment(appointmentId);
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      // First delete from calendar if it exists
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment?.calendar_event_id) {
        await deleteCalendarEvent(appointment.calendar_event_id);
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Error deleting appointment:', error);
        toast({
          title: "Error",
          description: "Failed to delete appointment",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Appointment deleted successfully"
        });
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleSyncAppointment = async (appointmentId: string) => {
    setSyncing(prev => new Set(prev).add(appointmentId));
    try {
      await syncAppointment(appointmentId);
    } finally {
      setSyncing(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleSyncAllAppointments = async () => {
    const appointmentIds = filteredAppointments.map(apt => apt.id);
    setSyncing(new Set(appointmentIds));
    try {
      await syncAllAppointments(appointmentIds);
    } finally {
      setSyncing(new Set());
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Appointments</CardTitle>
            <CardDescription>
              Manage your scheduled appointments ({filteredAppointments.length} total)
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAllAppointments}
              disabled={syncing.size > 0 || filteredAppointments.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing.size > 0 ? 'animate-spin' : ''}`} />
              Sync All to Calendar
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No appointments found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'all' 
                ? 'Schedule your first appointment to get started' 
                : `No appointments with status "${statusFilter}"`
              }
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Calendar</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {appointment.leads?.full_name || 'Unknown Lead'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(appointment.scheduled_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(appointment.scheduled_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status || 'scheduled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {appointment.leads?.email && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{appointment.leads.email}</span>
                          </div>
                        )}
                        {appointment.leads?.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{appointment.leads.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">
                        {appointment.notes || 'No notes'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {appointment.calendar_event_id ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Synced
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Not synced
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSyncAppointment(appointment.id)}
                          disabled={syncing.has(appointment.id)}
                          title="Sync to calendar"
                        >
                          <RefreshCw className={`h-4 w-4 ${syncing.has(appointment.id) ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAppointment(appointment)}
                          title="Edit appointment"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        {appointment.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            title="Mark as completed"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {appointment.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            title="Cancel appointment"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAppointment(appointment.id)}
                          title="Delete appointment"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <EditAppointmentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        appointment={selectedAppointment}
        onSuccess={() => {
          setEditDialogOpen(false);
          onRefresh();
        }}
      />
    </Card>
  );
};

export default AppointmentsList;