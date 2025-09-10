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

      // Use the efficient RPC function
      const { data: kpiData, error } = await supabase.rpc('kpis_for_range', {
        aid: agencyId,
        from_ts: fromDate.toISOString(),
        to_ts: toDate.toISOString()
      });

      if (error) throw error;
      if (!kpiData || kpiData.length === 0) throw new Error('No KPI data returned');

      const result = kpiData[0];
      
      setData({
        newLeads: result.new_leads || 0,
        appointments: result.appointments || 0,
        conversionRate: Number(result.conversion_rate) || 0,
        policiesSold: result.policies_sold || 0,
        commissions: Number(result.commissions) || 0,
        averageDealSize: Number(result.average_deal_size) || 0,
        totalRevenue: Number(result.total_revenue) || 0,
        campaignSpend: Number(result.campaign_spend) || 0,
        roas: Number(result.roas) || 0
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