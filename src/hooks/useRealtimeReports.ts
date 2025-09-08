import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useReportsData, ReportsData } from './useReportsData';

export const useRealtimeReports = (initialFilters: { timeRange: string }) => {
  const { reportsData, loading, error, refetch } = useReportsData(initialFilters);
  const [isRealtime, setIsRealtime] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!isRealtime) return;

    // Set up realtime subscriptions for leads and campaigns
    const leadsChannel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          setLastUpdate(new Date());
          refetch();
        }
      )
      .subscribe();

    const campaignsChannel = supabase
      .channel('campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns'
        },
        () => {
          setLastUpdate(new Date());
          refetch();
        }
      )
      .subscribe();

    // Auto-refresh every 30 seconds for simulated real-time updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate minor data fluctuations for demo purposes
      refetch();
    }, 30000);

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(campaignsChannel);
      clearInterval(interval);
    };
  }, [isRealtime, refetch]);

  const toggleRealtime = () => {
    setIsRealtime(!isRealtime);
  };

  return {
    reportsData,
    loading,
    error,
    refetch,
    isRealtime,
    lastUpdate,
    toggleRealtime,
  };
};