import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Users, DollarSign, Eye, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalLeads: number;
  avgConversionRate: number;
  avgCostPerLead: number;
  performanceTrend: Array<{
    date: string;
    leads: number;
    conversions: number;
    spend: number;
  }>;
  campaignTypes: Array<{
    type: string;
    count: number;
    leads: number;
    budget: number;
  }>;
  topCampaigns: Array<{
    name: string;
    type: string;
    leads: number;
    conversionRate: number;
    costPerLead: number;
  }>;
}

const COLORS = ['hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--primary))', '#FF8042', '#00C49F', '#FFBB28'];

export const CampaignAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) return;

      // Fetch campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('agency_id', profile.agency_id);

      // Fetch performance data
      const { data: performance } = await supabase
        .from('mv_campaign_performance')
        .select('*')
        .eq('agency_id', profile.agency_id);

      if (campaigns && performance) {
        // Calculate analytics
        const totalCampaigns = campaigns.length;
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
        const totalLeads = performance.reduce((sum, p) => sum + p.total_leads, 0);
        const avgConversionRate = performance.length > 0 
          ? performance.reduce((sum, p) => sum + p.conversion_rate, 0) / performance.length
          : 0;
        const avgCostPerLead = performance.length > 0
          ? performance.reduce((sum, p) => sum + p.cost_per_lead, 0) / performance.length
          : 0;

        // Mock performance trend data (in real app, this would come from time-series data)
        const performanceTrend = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          leads: Math.floor(Math.random() * 50) + 10,
          conversions: Math.floor(Math.random() * 10) + 2,
          spend: Math.floor(Math.random() * 1000) + 200,
        }));

        // Campaign types breakdown
        const typeGroups = campaigns.reduce((acc, campaign) => {
          const type = campaign.campaign_type;
          if (!acc[type]) {
            acc[type] = { type, count: 0, leads: 0, budget: 0 };
          }
          acc[type].count++;
          acc[type].budget += campaign.budget || 0;
          
          // Add leads from performance data
          const perf = performance.find(p => p.campaign_id === campaign.id);
          if (perf) {
            acc[type].leads += perf.total_leads;
          }
          
          return acc;
        }, {} as Record<string, any>);

        const campaignTypes = Object.values(typeGroups);

        // Top performing campaigns
        const topCampaigns = performance
          .sort((a, b) => b.total_leads - a.total_leads)
          .slice(0, 5)
          .map(p => {
            const campaign = campaigns.find(c => c.id === p.campaign_id);
            return {
              name: campaign?.name || 'Unknown',
              type: campaign?.campaign_type || 'unknown',
              leads: p.total_leads,
              conversionRate: p.conversion_rate,
              costPerLead: p.cost_per_lead
            };
          });

        setAnalyticsData({
          totalCampaigns,
          activeCampaigns,
          totalBudget,
          totalLeads,
          avgConversionRate,
          avgCostPerLead,
          performanceTrend,
          campaignTypes,
          topCampaigns
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analyticsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.activeCampaigns} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Generated to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost Per Lead</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.avgCostPerLead.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.avgConversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance Trend</TabsTrigger>
          <TabsTrigger value="breakdown">Campaign Breakdown</TabsTrigger>
          <TabsTrigger value="top">Top Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <p className="text-sm text-muted-foreground">
                Leads generated and conversions over the last 30 days
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Performance charts coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Distribution charts coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leads by Campaign Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Lead charts coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ranked by total leads generated
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topCampaigns.map((campaign, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {campaign.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{campaign.leads}</p>
                        <p className="text-muted-foreground">Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{campaign.conversionRate.toFixed(1)}%</p>
                        <p className="text-muted-foreground">CVR</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">${campaign.costPerLead.toFixed(2)}</p>
                        <p className="text-muted-foreground">CPL</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};