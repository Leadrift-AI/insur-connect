import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock, User, Phone, Mail } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

interface Appointment {
  id: string;
  lead_id: string;
  scheduled_at: string;
  status: string;
  notes: string;
  leads?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface AppointmentsCalendarProps {
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

const AppointmentsCalendar = ({ appointments, onRefresh }: AppointmentsCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.scheduled_at), date)
    );
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(day => {
              const dayAppointments = getAppointmentsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    ${isToday(day) ? 'ring-2 ring-secondary' : ''}
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                  `}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isSelected ? 'text-primary-foreground' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {dayAppointments.length > 0 && (
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map(apt => (
                        <div
                          key={apt.id}
                          className={`text-xs p-1 rounded text-center ${
                            isSelected 
                              ? 'bg-primary-foreground text-primary' 
                              : getStatusColor(apt.status)
                          }`}
                        >
                          {format(new Date(apt.scheduled_at), 'HH:mm')}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className={`text-xs text-center ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>
              {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select a date'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            <div className="space-y-4">
              {selectedDateAppointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No appointments scheduled for this date
                </p>
              ) : (
                selectedDateAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {apt.leads?.full_name || 'Unknown Lead'}
                        </span>
                      </div>
                      <Badge className={getStatusColor(apt.status)}>
                        {apt.status || 'scheduled'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(apt.scheduled_at), 'h:mm a')}</span>
                      </div>
                      
                      {apt.leads?.email && (
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="h-3 w-3" />
                          <span>{apt.leads.email}</span>
                        </div>
                      )}
                      
                      {apt.leads?.phone && (
                        <div className="flex items-center space-x-2 mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{apt.leads.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {apt.notes && (
                      <div className="text-sm">
                        <strong>Notes:</strong> {apt.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Click on a date to view appointments
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsCalendar;