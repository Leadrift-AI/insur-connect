import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, Cell } from 'recharts';
import { ChartSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3, TrendingUp } from 'lucide-react';

interface FunnelData {
  total: number;
  new_count: number;
  contacted_count: number;
  booked_count: number;
  showed_count: number;
  won_count: number;
  lost_count: number;
}

interface DashboardChartsProps {
  funnelData: FunnelData | null;
  loading?: boolean;
  error?: string;
}

const DashboardCharts = ({ funnelData, loading = false, error }: DashboardChartsProps) => {
  // Mock data for appointments trend - in real app this would come from props
  const appointmentTrend = [
    { name: 'Mon', appointments: 12 },
    { name: 'Tue', appointments: 19 },
    { name: 'Wed', appointments: 15 },
    { name: 'Thu', appointments: 22 },
    { name: 'Fri', appointments: 18 },
    { name: 'Sat', appointments: 8 },
    { name: 'Sun', appointments: 5 }
  ];

  // Convert funnel data for chart
  const funnelChartData = funnelData ? [
    { name: 'New Leads', value: funnelData.new_count, fill: '#0072F5' },
    { name: 'Contacted', value: funnelData.contacted_count, fill: '#00BFA6' },
    { name: 'Appointments', value: funnelData.booked_count, fill: '#0A2540' },
    { name: 'Showed Up', value: funnelData.showed_count, fill: '#5C677D' },
    { name: 'Policies Sold', value: funnelData.won_count, fill: '#F9FAFB' }
  ] : [];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <EmptyState
              icon={BarChart3}
              title="Failed to load chart data"
              description={error}
            />
          </CardContent>
        </Card>
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <EmptyState
              icon={TrendingUp}
              title="Failed to load chart data"
              description={error}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="animate-fade-in group hover:shadow-elegant transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
            <BarChart3 className="h-5 w-5" />
            Lead Funnel
          </CardTitle>
          <CardDescription>
            Conversion rates through your sales pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {funnelChartData.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No funnel data available"
              description="Start adding leads to see your conversion funnel"
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip 
                  formatter={(value: number) => [value, 'Leads']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Funnel
                  dataKey="value"
                  data={funnelChartData}
                  isAnimationActive
                  animationDuration={800}
                >
                  {funnelChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="animate-fade-in group hover:shadow-elegant transition-all duration-300" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
            <TrendingUp className="h-5 w-5" />
            Weekly Appointments
          </CardTitle>
          <CardDescription>
            Appointments scheduled this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Appointments']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
              />
              <Bar 
                dataKey="appointments" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;