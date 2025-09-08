import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Play, 
  Pause, 
  CheckCircle,
  DollarSign,
  Target,
  BarChart3
} from 'lucide-react';
import { ReportsData } from '@/hooks/useReportsData';

interface CampaignROIProps {
  data: ReportsData['campaignROI'];
}

export const CampaignROI: React.FC<CampaignROIProps> = ({ data }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getROIColor = (roi: number) => {
    if (roi >= 300) return 'text-green-600';
    if (roi >= 200) return 'text-blue-600';
    if (roi >= 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const averageROI = data.reduce((sum, campaign) => sum + campaign.roi, 0) / data.length;
  const totalSpend = data.reduce((sum, campaign) => sum + campaign.spend, 0);
  const totalRevenue = data.reduce((sum, campaign) => sum + campaign.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Campaign ROI Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Return on investment for each marketing campaign
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-lg font-bold">${totalSpend.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Spend</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Revenue</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold">{averageROI.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Avg ROI</div>
          </div>
        </div>

        {/* Campaign List */}
        <div className="space-y-4">
          {data.map((campaign, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{campaign.campaign}</h4>
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1"
                    >
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
                      {getStatusIcon(campaign.status)}
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Spend: ${campaign.spend.toLocaleString()} • Revenue: ${campaign.revenue.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold flex items-center gap-1 ${getROIColor(campaign.roi)}`}>
                    {campaign.roi >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {campaign.roi.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">ROI</div>
                </div>
              </div>

              {/* ROI Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Performance</span>
                  <span>{campaign.roi.toFixed(1)}% ROI</span>
                </div>
                <Progress 
                  value={Math.min(100, Math.max(0, campaign.roi / 5))} 
                  className="h-2"
                />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Revenue/Spend Ratio:</span>
                  <span className="ml-1 font-medium">
                    {(campaign.revenue / campaign.spend).toFixed(2)}x
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Net Profit:</span>
                  <span className="ml-1 font-medium">
                    ${(campaign.revenue - campaign.spend).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium mb-2">Campaign Insights</h5>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Top performer: <span className="font-medium text-foreground">{data[0]?.campaign}</span> with {data[0]?.roi.toFixed(1)}% ROI</p>
            <p>• Average campaign ROI: <span className="font-medium text-foreground">{averageROI.toFixed(1)}%</span></p>
            <p>• Total profit generated: <span className="font-medium text-foreground">${(totalRevenue - totalSpend).toLocaleString()}</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};