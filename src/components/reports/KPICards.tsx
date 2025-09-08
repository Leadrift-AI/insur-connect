import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign,
  Activity,
  Percent,
  BarChart3
} from 'lucide-react';
import { ReportsData } from '@/hooks/useReportsData';

interface KPICardsProps {
  data: ReportsData;
  isRealtime: boolean;
  lastUpdate: Date;
}

export const KPICards: React.FC<KPICardsProps> = ({ data, isRealtime, lastUpdate }) => {
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const kpis = [
    {
      title: 'ROAS',
      value: `${data.roas.toFixed(1)}x`,
      icon: TrendingUp,
      description: 'Return on Ad Spend',
      trend: data.roas > 3 ? 'up' : 'down',
      trendValue: '+8.2%',
      color: data.roas > 3 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      icon: DollarSign,
      description: '+12% from last month',
      trend: 'up',
      trendValue: '+12%',
      color: 'text-green-600'
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(data.conversionRate),
      icon: Target,
      description: 'Lead to policy conversion',
      trend: data.conversionRate > 10 ? 'up' : 'down',
      trendValue: data.conversionRate > 10 ? '+2.1%' : '-1.3%',
      color: data.conversionRate > 10 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Total Policies',
      value: data.totalPolicies.toString(),
      icon: Users,
      description: 'Sold this period',
      trend: 'up',
      trendValue: '+5.4%',
      color: 'text-green-600'
    },
    {
      title: 'Total Leads',
      value: data.totalLeads.toString(),
      icon: Activity,
      description: 'Generated leads',
      trend: 'up',
      trendValue: '+18%',
      color: 'text-green-600'
    },
    {
      title: 'Ad Spend',
      value: formatCurrency(data.totalSpend),
      icon: BarChart3,
      description: 'Total advertising cost',
      trend: 'up',
      trendValue: '+3.7%',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
        <div className="flex items-center gap-2">
          <Badge variant={isRealtime ? 'default' : 'secondary'}>
            {isRealtime ? 'Live' : 'Static'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex items-center gap-1 ${kpi.color}`}>
                    <TrendIcon className="h-3 w-3" />
                    <span className="text-xs font-medium">{kpi.trendValue}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.description}
                </p>
              </CardContent>
              {isRealtime && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};