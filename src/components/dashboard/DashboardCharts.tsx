import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, Cell } from 'recharts';

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
}

const DashboardCharts = ({ funnelData }: DashboardChartsProps) => {
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel</CardTitle>
          <CardDescription>
            Conversion rates through your sales pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip 
                formatter={(value: number) => [value, 'Leads']}
                labelStyle={{ color: '#0A2540' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Funnel
                dataKey="value"
                data={funnelChartData}
                isAnimationActive
              >
                {funnelChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Appointments</CardTitle>
          <CardDescription>
            Appointments scheduled this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Appointments']}
                labelStyle={{ color: '#0A2540' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="appointments" 
                fill="#0072F5"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;