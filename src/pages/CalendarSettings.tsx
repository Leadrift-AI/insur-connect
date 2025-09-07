import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CalendarSettings from '@/components/calendar/CalendarSettings';
import CalendarIntegrationTest from '@/components/calendar/CalendarIntegrationTest';

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
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <CalendarSettings />
          <CalendarIntegrationTest />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarSettingsPage;