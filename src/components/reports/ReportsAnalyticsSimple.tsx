import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, FileText, Download, Filter, RefreshCw } from 'lucide-react';
import { useKPIData } from '@/hooks/useKPIData';
import { ExportControls } from '@/components/reports/ExportControls';
import { formatCurrency, formatDate } from '@/utils/exportHelpers';

export const ReportsAnalytics = () => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  
  const { data: kpiData, loading, error, refetch } = useKPIData(dateRange);

  const handleRefresh = () => {
    refetch();
  };

  const mockReportsData = {
    leads: kpiData ? Array.from({ length: 10 }, (_, i) => ({
      id: `lead-${i}`,
      name: `Lead ${i + 1}`,
      email: `lead${i + 1}@example.com`,
      status: ['new', 'contacted', 'booked', 'won'][Math.floor(Math.random() * 4)],
      source: ['Website', 'Referral', 'Social Media'][Math.floor(Math.random() * 3)],
      created_at: formatDate(new Date(Date.now() - i * 24 * 60 * 60 * 1000))
    })) : [],
    
    campaigns: kpiData ? Array.from({ length: 5 }, (_, i) => ({
      id: `campaign-${i}`,
      name: `Campaign ${i + 1}`,
      spend: Math.floor(Math.random() * 5000) + 1000,
      revenue: Math.floor(Math.random() * 15000) + 5000,
      leads: Math.floor(Math.random() * 50) + 10,
      roas: Math.random() * 3 + 1
    })) : []
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading reports data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading reports: {error}</p>
            <Button onClick={handleRefresh} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your agency's performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpiData?.totalRevenue || 0)}</div>
            <Badge variant="secondary" className="mt-1">
              ROAS: {kpiData?.roas || 0}x
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Spend</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpiData?.campaignSpend || 0)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpiData?.commissions || 0)}</div>
            <p className="text-xs text-muted-foreground">Commission earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpiData?.averageDealSize || 0)}</div>
            <p className="text-xs text-muted-foreground">Per policy sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Reports */}
      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Lead Reports</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lead Performance Report</CardTitle>
              <ExportControls
                data={mockReportsData.leads}
                title="Lead Performance Report"
                filename="lead-performance"
                headers={['Name', 'Email', 'Status', 'Source', 'Created Date']}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{kpiData?.newLeads || 0}</div>
                    <div className="text-sm text-muted-foreground">New Leads</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{kpiData?.appointments || 0}</div>
                    <div className="text-sm text-muted-foreground">Appointments</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{kpiData?.conversionRate || 0}%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Campaign ROI Analysis</CardTitle>
              <ExportControls
                data={mockReportsData.campaigns}
                title="Campaign Performance Report"
                filename="campaign-performance"
                headers={['Campaign', 'Spend', 'Revenue', 'Leads', 'ROAS']}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportsData.campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <p className="text-sm text-muted-foreground">{campaign.leads} leads generated</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(campaign.revenue)}</div>
                      <div className="text-sm text-muted-foreground">
                        ROAS: {campaign.roas.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenue Breakdown</CardTitle>
              <ExportControls
                data={[{
                  metric: 'Total Revenue',
                  value: kpiData?.totalRevenue || 0,
                  commissions: kpiData?.commissions || 0,
                  policies_sold: kpiData?.policiesSold || 0,
                  avg_deal_size: kpiData?.averageDealSize || 0
                }]}
                title="Revenue Analysis Report"
                filename="revenue-analysis"
              />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Revenue Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-medium">{formatCurrency(kpiData?.totalRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Commissions:</span>
                      <span className="font-medium">{formatCurrency(kpiData?.commissions || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Policies Sold:</span>
                      <span className="font-medium">{kpiData?.policiesSold || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Performance Indicators</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>ROAS:</span>
                      <span className="font-medium">{kpiData?.roas || 0}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Deal Size:</span>
                      <span className="font-medium">{formatCurrency(kpiData?.averageDealSize || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Campaign Spend:</span>
                      <span className="font-medium">{formatCurrency(kpiData?.campaignSpend || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};