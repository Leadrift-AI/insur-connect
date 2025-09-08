import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Filter, ArrowDown } from 'lucide-react';
import { ReportsData } from '@/hooks/useReportsData';

interface ConversionFunnelProps {
  data: ReportsData['conversionFunnel'];
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ data }) => {
  const getStageColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDropoffRate = (currentStage: number, nextStage: number | undefined) => {
    if (!nextStage) return null;
    const dropoff = ((currentStage - nextStage) / currentStage) * 100;
    return dropoff.toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Conversion Funnel Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track your lead conversion journey from initial contact to closed sale
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((stage, index) => {
            const nextStage = data[index + 1];
            const dropoffRate = nextStage ? getDropoffRate(stage.count, nextStage.count) : null;
            const isLastStage = index === data.length - 1;

            return (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getStageColor(stage.percentage)}`} />
                    <h4 className="font-medium">{stage.stage}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {stage.count} leads
                    </Badge>
                    <Badge variant="secondary">
                      {stage.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <Progress 
                    value={stage.percentage} 
                    className="h-3"
                  />
                </div>

                <div className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">{stage.count}</span> out of {data[0].count} total leads ({stage.percentage.toFixed(1)}%)
                </div>

                {!isLastStage && dropoffRate && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1">
                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {dropoffRate}% drop-off
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium mb-2">Funnel Insights</h5>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Overall conversion rate: <span className="font-medium text-foreground">{data[data.length - 1]?.percentage.toFixed(1)}%</span></p>
            <p>• Biggest drop-off: <span className="font-medium text-foreground">Qualified → Proposals stage</span></p>
            <p>• Best performing stage: <span className="font-medium text-foreground">Negotiations → Closed Won</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};