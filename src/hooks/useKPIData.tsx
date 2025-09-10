import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAgency } from '@/hooks/useAgency';

interface KPIData {
  newLeads: number;
  appointments: number;
  conversionRate: number;
  policiesSold: number;
  commissions: number;
  averageDealSize: number;
  totalRevenue: number;
  campaignSpend: number;
  roas: number;
}

export const useKPIData = (dateRange: { from?: Date; to?: Date } = {}) => {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agencyId } = useAgency();

  const fetchKPIData = async () => {
    if (!agencyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fromDate = dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = dateRange.to || new Date();

      // Fetch leads data
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());

      if (leadsError) throw leadsError;

      // Fetch appointments data
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());

      if (appointmentsError) throw appointmentsError;

      // Fetch policies data
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());

      if (policiesError) throw policiesError;

      // Fetch campaign data for spend calculation
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('budget')
        .eq('agency_id', agencyId)
        .eq('status', 'active');

      if (campaignsError) throw campaignsError;

      // Calculate KPIs
      const newLeads = leads?.filter(l => l.status === 'new').length || 0;
      const totalAppointments = appointments?.length || 0;
      const totalLeads = leads?.length || 0;
      const conversionRate = totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0;
      
      const activePolicies = policies?.filter(p => p.status === 'active') || [];
      const policiesSold = activePolicies.length;
      
      const totalRevenue = activePolicies.reduce((sum, policy) => 
        sum + (Number(policy.premium_amount) || 0), 0
      );
      
      const commissions = activePolicies.reduce((sum, policy) => 
        sum + (Number(policy.commission_amount) || 0), 0
      );
      
      const averageDealSize = policiesSold > 0 ? totalRevenue / policiesSold : 0;
      
      const campaignSpend = campaigns?.reduce((sum, campaign) => 
        sum + (Number(campaign.budget) || 0), 0
      ) || 0;
      
      const roas = campaignSpend > 0 ? (totalRevenue / campaignSpend) : 0;

      setData({
        newLeads,
        appointments: totalAppointments,
        conversionRate: Math.round(conversionRate),
        policiesSold,
        commissions: Math.round(commissions),
        averageDealSize: Math.round(averageDealSize),
        totalRevenue: Math.round(totalRevenue),
        campaignSpend: Math.round(campaignSpend),
        roas: Math.round(roas * 100) / 100
      });
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch KPI data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agencyId) {
      fetchKPIData();
    }
  }, [agencyId, dateRange.from, dateRange.to]);

  return {
    data,
    loading,
    error,
    refetch: fetchKPIData
  };
};