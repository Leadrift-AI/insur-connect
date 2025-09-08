import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReportsData {
  roas: number;
  totalRevenue: number;
  totalSpend: number;
  conversionRate: number;
  totalLeads: number;
  totalPolicies: number;
  roasHistory: Array<{
    date: string;
    roas: number;
    revenue: number;
    spend: number;
  }>;
  agentPerformance: Array<{
    name: string;
    leads: number;
    policies: number;
    revenue: number;
    conversionRate: number;
  }>;
  policyTypes: Array<{
    type: string;
    count: number;
    revenue: number;
    color: string;
  }>;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  campaignROI: Array<{
    campaign: string;
    spend: number;
    revenue: number;
    roi: number;
    status: 'active' | 'paused' | 'completed';
  }>;
}

export interface FilterOptions {
  timeRange: string;
  agentId?: string;
  campaignType?: string;
  dateFrom?: string;
  dateTo?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#FF8042', '#00C49F', '#FFBB28'];

export const useReportsData = (filters: FilterOptions) => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) {
        throw new Error('Agency not found');
      }

      // Fetch real data from database
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('agency_id', profile.agency_id);

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('agency_id', profile.agency_id);

      // Enhanced mock data with more realistic metrics
      const totalLeads = leads?.length || 0;
      const totalPolicies = Math.floor(totalLeads * 0.125);
      const totalRevenue = totalPolicies * 2500; // Average policy value
      const totalSpend = totalRevenue * 0.25; // 25% ad spend ratio

      const mockReportsData: ReportsData = {
        roas: totalRevenue / Math.max(totalSpend, 1),
        totalRevenue,
        totalSpend,
        conversionRate: totalLeads > 0 ? (totalPolicies / totalLeads) * 100 : 0,
        totalLeads,
        totalPolicies,
        roasHistory: generateROASHistory(filters.timeRange),
        agentPerformance: generateAgentPerformance(),
        policyTypes: [
          { type: 'Auto Insurance', count: Math.floor(totalPolicies * 0.4), revenue: totalRevenue * 0.35, color: COLORS[0] },
          { type: 'Home Insurance', count: Math.floor(totalPolicies * 0.25), revenue: totalRevenue * 0.3, color: COLORS[1] },
          { type: 'Life Insurance', count: Math.floor(totalPolicies * 0.2), revenue: totalRevenue * 0.25, color: COLORS[2] },
          { type: 'Health Insurance', count: Math.floor(totalPolicies * 0.1), revenue: totalRevenue * 0.07, color: COLORS[3] },
          { type: 'Business Insurance', count: Math.floor(totalPolicies * 0.05), revenue: totalRevenue * 0.03, color: COLORS[4] },
        ],
        conversionFunnel: [
          { stage: 'Leads', count: totalLeads, percentage: 100 },
          { stage: 'Qualified', count: Math.floor(totalLeads * 0.6), percentage: 60 },
          { stage: 'Proposals', count: Math.floor(totalLeads * 0.3), percentage: 30 },
          { stage: 'Negotiations', count: Math.floor(totalLeads * 0.2), percentage: 20 },
          { stage: 'Closed Won', count: totalPolicies, percentage: (totalPolicies / Math.max(totalLeads, 1)) * 100 },
        ],
        campaignROI: generateCampaignROI(campaigns?.length || 0),
      };

      setReportsData(mockReportsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reports data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateROASHistory = (timeRange: string) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const baseROAS = 3.5 + Math.sin(i / 7) * 0.5; // Weekly cycle
      return {
        date: date.toISOString().split('T')[0],
        roas: Math.max(1, baseROAS + (Math.random() - 0.5) * 1),
        revenue: 2500 + Math.random() * 2000,
        spend: 600 + Math.random() * 400,
      };
    });
  };

  const generateAgentPerformance = () => {
    const agents = [
      'Sarah Johnson', 'Mike Chen', 'Emma Davis', 'Alex Rodriguez', 'Lisa Wang',
      'David Kim', 'Maria Garcia', 'James Wilson', 'Anna Taylor', 'Chris Brown'
    ];

    return agents.map(name => {
      const leads = 20 + Math.floor(Math.random() * 40);
      const conversionRate = 15 + Math.random() * 20;
      const policies = Math.floor(leads * (conversionRate / 100));
      const revenue = policies * (2000 + Math.random() * 2000);

      return {
        name,
        leads,
        policies,
        revenue,
        conversionRate,
      };
    }).sort((a, b) => b.policies - a.policies);
  };

  const generateCampaignROI = (campaignCount: number) => {
    const campaigns = [
      'Auto Insurance - Facebook', 'Home Insurance - Google', 'Life Insurance - LinkedIn',
      'Health Insurance - Instagram', 'Business Insurance - YouTube', 'Renters Insurance - TikTok'
    ];

    return campaigns.slice(0, Math.max(6, campaignCount)).map(campaign => {
      const spend = 5000 + Math.random() * 15000;
      const revenue = spend * (2 + Math.random() * 3); // 2x to 5x return
      const roi = (revenue - spend) / spend * 100;
      const statuses = ['active', 'paused', 'completed'] as const;

      return {
        campaign,
        spend,
        revenue,
        roi,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      };
    }).sort((a, b) => b.roi - a.roi);
  };

  useEffect(() => {
    fetchReportsData();
  }, [filters.timeRange, filters.agentId, filters.campaignType, filters.dateFrom, filters.dateTo]);

  const refetch = () => {
    fetchReportsData();
  };

  return {
    reportsData,
    loading,
    error,
    refetch,
  };
};