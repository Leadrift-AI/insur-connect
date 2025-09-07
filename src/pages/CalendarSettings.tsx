import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CalendarSettings from '@/components/calendar/CalendarSettings';

const CalendarSettingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar Settings</h1>
          <p className="text-muted-foreground">
            Manage your calendar integrations and sync preferences
          </p>
        </div>
        
        <CalendarSettings />
      </div>
    </DashboardLayout>
  );
};

export default CalendarSettingsPage;