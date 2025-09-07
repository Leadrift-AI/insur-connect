import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, DollarSign, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CampaignPerformance {
  campaign_id: string;
  agency_id: string;
  campaign_name: string;
  campaign_type: string;
  status: string;
  budget: number | null;
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  booked_leads: number;
  showed_leads: number;
  won_leads: number;
  lost_leads: number;
  conversion_rate: number;
  cost_per_lead: number;
  created_at: string;
  updated_at: string;
}

export const CampaignPerformance: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<CampaignPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) return;

      // First, refresh the materialized view to get latest data
      await supabase.rpc('refresh_campaign_performance');

      const { data, error } = await supabase
        .from('mv_campaign_performance')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .order('total_leads', { ascending: false });

      if (error) throw error;
      setPerformanceData(data || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign performance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCampaignType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConversionRateColor = (rate: number) => {
    if (rate >= 15) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (rate: number) => {
    if (rate >= 10) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  // Calculate totals
  const totals = performanceData.reduce(
    (acc, campaign) => ({
      totalLeads: acc.totalLeads + campaign.total_leads,
      wonLeads: acc.wonLeads + campaign.won_leads,
      totalBudget: acc.totalBudget + (campaign.budget || 0),
    }),
    { totalLeads: 0, wonLeads: 0, totalBudget: 0 }
  );

  const overallConversionRate = totals.totalLeads > 0 
    ? (totals.wonLeads / totals.totalLeads * 100) 
    : 0;

  const avgCostPerLead = totals.totalLeads > 0 
    ? (totals.totalBudget / totals.totalLeads) 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading performance data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.wonLeads}</div>
            <p className="text-xs text-muted-foreground">
              Successfully converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Cost Per Lead</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${avgCostPerLead.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across active campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
            {getTrendIcon(overallConversionRate)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConversionRateColor(overallConversionRate)}`}>
              {overallConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Lead to customer rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed performance metrics for each campaign
          </p>
        </CardHeader>
        <CardContent>
          {performanceData.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No performance data</h3>
              <p className="text-muted-foreground">
                Create campaigns and generate leads to see performance metrics.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Funnel Progress</TableHead>
                  <TableHead>Conversion</TableHead>
                  <TableHead>Cost/Lead</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.map((campaign) => (
                  <TableRow key={campaign.campaign_id}>
                    <TableCell>
                      <div className="font-medium">{campaign.campaign_name}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatCampaignType(campaign.campaign_type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{campaign.total_leads} total</div>
                        <div className="text-muted-foreground">
                          {campaign.won_leads} won
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>New → Won</span>
                          <span>{campaign.won_leads}/{campaign.total_leads}</span>
                        </div>
                        <Progress 
                          value={campaign.total_leads > 0 ? (campaign.won_leads / campaign.total_leads) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${getConversionRateColor(campaign.conversion_rate)}`}>
                        {campaign.conversion_rate}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {campaign.cost_per_lead > 0 ? `$${campaign.cost_per_lead}` : '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};