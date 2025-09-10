import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReportsAnalytics } from '@/components/reports/ReportsAnalyticsSimple';

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ReportsAnalytics />
      </div>
    </DashboardLayout>
  );
}