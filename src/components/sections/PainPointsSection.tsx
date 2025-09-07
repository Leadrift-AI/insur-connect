import { Card } from "@/components/ui/card";
import { Clock, PhoneCall, FileText, Target, AlertCircle, TrendingDown } from "lucide-react";

const PainPointsSection = () => {
  const painPoints = [
    {
      icon: Clock,
      title: "Endless Admin Work",
      description: "Agents spend 70% of their time on paperwork instead of selling policies",
      impact: "Lost Revenue: $150K/year per agent"
    },
    {
      icon: PhoneCall,
      title: "Missed Follow-Ups",
      description: "30% of qualified leads slip through the cracks due to poor follow-up systems",
      impact: "Conversion Rate: Only 12%"
    },
    {
      icon: FileText,
      title: "Manual Lead Tracking",
      description: "Spreadsheets and sticky notes lead to confusion and lost opportunities",
      impact: "Lead Loss: 40% annually"
    },
    {
      icon: Target,
      title: "No Pipeline Visibility",
      description: "Agency owners can't see which agents need help or where deals stand",
      impact: "Management Blind Spots"
    },
    {
      icon: AlertCircle,
      title: "Inconsistent Process",
      description: "Each agent has their own system, leading to unpredictable results",
      impact: "Revenue Volatility"
    },
    {
      icon: TrendingDown,
      title: "Low Closing Rates",
      description: "Without proper nurturing, only 1 in 10 leads convert to policies",
      impact: "Wasted Marketing Spend"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-primary mb-4">
            The Hidden Cost of Manual Processes
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Life insurance agencies lose millions in revenue every year due to inefficient 
            lead management and manual workflows that drain agent productivity.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <Card key={index} className="p-6 hover:shadow-card transition-smooth border-l-4 border-l-destructive/50 bg-white">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <point.icon className="w-6 h-6 text-destructive" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-montserrat font-semibold text-lg text-primary">
                    {point.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {point.description}
                  </p>
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-destructive">
                      {point.impact}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-card p-8 max-w-2xl mx-auto border border-border">
            <h3 className="text-2xl font-montserrat font-bold text-primary mb-4">
              Sound Familiar?
            </h3>
            <p className="text-muted-foreground mb-6">
              If your agency is struggling with any of these challenges, 
              you're losing money every single day. But there's a better way.
            </p>
            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
              <p className="text-secondary font-semibold">
                Leadrift AI eliminates these pain points completely with intelligent automation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;