import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import LeadsTable from '@/components/dashboard/LeadsTable';
import { ReadOnlyDashboard } from '@/components/dashboard/ReadOnlyDashboard';
import { AgencySetup } from '@/components/onboarding/AgencySetup';
import { Loader2 } from 'lucide-react';

interface DashboardData {
  kpis: {
    newLeads: number;
    appointments: number;
    conversionRate: number;
    policiesSold: number;
    commissions: number;
    averageDealSize: number;
  };
  leads: any[];
  funnelData: any;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isReadOnly, loading: roleLoading, canViewDashboard, needsAgencySetup } = useUserRole();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !isReadOnly && !needsAgencySetup) {
      fetchDashboardData();
    }
  }, [user, isReadOnly, needsAgencySetup]);

  const fetchDashboardData = async () => {
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
        setData({
          kpis: {
            newLeads: 0,
            appointments: 0,
            conversionRate: 0,
            policiesSold: 0,
            commissions: 0,
            averageDealSize: 0
          },
          leads: [],
          funnelData: null
        });
        setLoading(false);
        return;
      }

      // Fetch leads
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch funnel data
      const { data: funnelData } = await supabase
        .from('v_lead_funnel_counts')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .single();

      // Fetch appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('agency_id', profile.agency_id);

      // Calculate KPIs
      const totalLeads = leads?.length || 0;
      const totalAppointments = appointments?.length || 0;
      const conversionRate = totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0;

      setData({
        kpis: {
          newLeads: funnelData?.new_count || 0,
          appointments: totalAppointments,
          conversionRate: Math.round(conversionRate),
          policiesSold: funnelData?.won_count || 0,
          commissions: (funnelData?.won_count || 0) * 1500, // Estimate
          averageDealSize: 1500 // Estimate
        },
        leads: leads || [],
        funnelData
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show agency setup for authenticated users without agencies
  if (needsAgencySetup) {
    return <AgencySetup onComplete={() => window.location.reload()} />;
  }

  // Show read-only dashboard for managers
  if (isReadOnly) {
    return (
      <DashboardLayout>
        <ReadOnlyDashboard />
      </DashboardLayout>
    );
  }

  if (!data && !needsAgencySetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your leads.
          </p>
        </div>
        
        <DashboardStats kpis={data.kpis} />
        <DashboardCharts funnelData={data.funnelData} />
        <LeadsTable leads={data.leads} onRefresh={fetchDashboardData} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;