import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import LeadsTable from '@/components/dashboard/LeadsTable';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Eye, Shield, TrendingUp, Users } from 'lucide-react';

interface DashboardData {
  totalLeads: number;
  newLeads: number;
  totalAppointments: number;
  conversionRate: number;
  leads: any[];
  funnelData: any[];
}

export const ReadOnlyDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { agencyId, userRole } = useUserRole();

  useEffect(() => {
    if (agencyId) {
      fetchDashboardData();
    }
  }, [agencyId]);

  const fetchDashboardData = async () => {
    if (!agencyId) return;

    try {
      setLoading(true);

      // Fetch leads data
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      // Fetch appointments data
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('agency_id', agencyId);

      // Fetch funnel data
      const { data: funnelData } = await supabase
        .from('v_lead_funnel_counts')
        .select('*')
        .eq('agency_id', agencyId)
        .single();

      // Calculate KPIs
      const totalLeads = leads?.length || 0;
      const newLeads = leads?.filter(lead => lead.status === 'new').length || 0;
      const totalAppointments = appointments?.length || 0;
      const wonLeads = leads?.filter(lead => lead.status === 'won').length || 0;
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

      const processedFunnelData = funnelData ? [
        { name: 'New', value: funnelData.new_count || 0 },
        { name: 'Contacted', value: funnelData.contacted_count || 0 },
        { name: 'Booked', value: funnelData.booked_count || 0 },
        { name: 'Showed', value: funnelData.showed_count || 0 },
        { name: 'Won', value: funnelData.won_count || 0 },
      ] : [];

      setData({
        totalLeads,
        newLeads,
        totalAppointments,
        conversionRate,
        leads: leads || [],
        funnelData: processedFunnelData
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Read-only banner */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-medium text-orange-800">Read-Only Dashboard</h3>
              <p className="text-sm text-orange-600">
                You have {userRole} access. Contact your administrator for additional permissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key metrics summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.newLeads || 0} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">Total scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Lead to close ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
              {userRole?.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Read-only access</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Read-only */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.funnelData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ 
                            width: `${data.totalLeads > 0 ? (item.value / data.totalLeads) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent leads table - Read-only */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads (Read-Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsTable 
              leads={data.leads.slice(0, 10)} 
              onRefresh={() => {}}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};