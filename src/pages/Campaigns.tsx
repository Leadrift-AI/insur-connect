import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CreateCampaignDialog } from '@/components/campaigns/CreateCampaignDialog';
import { CampaignsList } from '@/components/campaigns/CampaignsList';
import { CampaignPerformance } from '@/components/campaigns/CampaignPerformance';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
const Campaigns: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const {
    toast
  } = useToast();
  const {
    canManageCampaigns
  } = useUserRole();
  const handleCampaignCreated = () => {
    setIsCreateDialogOpen(false);
    toast({
      title: "Campaign Created",
      description: "Your campaign has been created successfully."
    });
  };
  return <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campaign Results</h1>
            <p className="text-muted-foreground mt-2">
              {canManageCampaigns ? "Create and track your marketing campaigns across multiple channels" : "View campaign analytics and performance data"}
            </p>
          </div>
          {canManageCampaigns && <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>}
        </div>

        {/* Campaign Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Badge variant="secondary">Live</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Generated Leads</CardTitle>
              <Badge variant="outline">All Time</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foregreen">+15% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Cost Per Lead</CardTitle>
              <Badge variant="outline">30 Days</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45.60</div>
              <p className="text-xs text-muted-foreground">-8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Badge variant="outline">30 Days</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.4%</div>
              <p className="text-xs text-muted-foreground">+3.2% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">All Campaigns</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <CampaignsList />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <CampaignPerformance />
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Source Attribution</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track where your leads are coming from across all channels
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[{
                  source: 'Facebook Ads',
                  leads: 456,
                  color: 'bg-blue-500'
                }, {
                  source: 'Google Ads',
                  leads: 321,
                  color: 'bg-green-500'
                }, {
                  source: 'LinkedIn',
                  leads: 123,
                  color: 'bg-blue-600'
                }, {
                  source: 'Website',
                  leads: 234,
                  color: 'bg-purple-500'
                }, {
                  source: 'Referrals',
                  leads: 100,
                  color: 'bg-orange-500'
                }].map(item => <div key={item.source} className="text-center">
                      <div className={`w-12 h-12 ${item.color} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold`}>
                        {item.leads}
                      </div>
                      <h3 className="font-medium">{item.source}</h3>
                      <p className="text-sm text-muted-foreground">leads</p>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Campaign Dialog */}
        <CreateCampaignDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onCampaignCreated={handleCampaignCreated} />
      </div>
    </DashboardLayout>;
};
export default Campaigns;