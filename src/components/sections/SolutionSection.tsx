import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, MessageSquare, Calendar, BarChart3, Users, Clock, ArrowRight, CheckCircle } from "lucide-react";
const SolutionSection = () => {
  const features = [{
    icon: Zap,
    title: "Smart Lead Acquisition",
    description: "AI-powered lead capture and pre-qualification from multiple sources",
    benefits: ["Automated lead scoring", "Source attribution", "Instant notifications"]
  }, {
    icon: MessageSquare,
    title: "Automated Follow-Ups",
    description: "Intelligent SMS and email sequences that nurture leads automatically",
    benefits: ["Personalized messaging", "Optimal send times", "Response tracking"]
  }, {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "One-click appointment booking directly into agent calendars",
    benefits: ["Calendar integration", "Automatic reminders", "Reschedule handling"]
  }, {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Complete visibility into your sales pipeline and agent performance",
    benefits: ["Live dashboards", "Conversion tracking", "Revenue forecasting"]
  }, {
    icon: Users,
    title: "Team Management",
    description: "Multi-agent support with role-based access and collaboration tools",
    benefits: ["Agent performance", "Lead distribution", "Team leaderboards"]
  }, {
    icon: Clock,
    title: "Time Recovery",
    description: "Eliminate 85% of admin work so agents focus on closing deals",
    benefits: ["Automated workflows", "Document generation", "Compliance tracking"]
  }];
  return <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary border border-secondary/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>The Leadrift AI Solution</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-primary mb-4">
            Your Complete Insurance Sales{" "}
            <span className="gradient-primary bg-clip-text mx-0 text-slate-950">
              Automation Platform
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your agency with AI-powered workflows that handle everything 
            from lead capture to policy closing, automatically.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => <Card key={index} className="p-6 hover:shadow-card transition-smooth bg-white group hover:scale-105">
              <div className="space-y-4">
                <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-montserrat font-semibold text-lg text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, idx) => <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-secondary" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </div>)}
                  </div>
                </div>
              </div>
            </Card>)}
        </div>

        {/* Process Flow */}
        <div className="bg-muted/30 rounded-2xl p-8 mb-16">
          <h3 className="text-2xl font-montserrat font-bold text-primary text-center mb-8">
            How Leadrift AI Works
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[{
            step: "1",
            title: "Capture",
            desc: "Leads flow in from all sources"
          }, {
            step: "2",
            title: "Qualify",
            desc: "AI scores and prioritizes prospects"
          }, {
            step: "3",
            title: "Nurture",
            desc: "Automated follow-ups warm leads"
          }, {
            step: "4",
            title: "Close",
            desc: "Agents focus on final conversations"
          }].map((item, index) => <div key={index} className="text-center relative">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h4 className="font-montserrat font-semibold text-primary mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                {index < 3 && <ArrowRight className="hidden md:block absolute top-6 -right-3 w-6 h-6 text-accent" />}
              </div>)}
          </div>
        </div>

        {/* Results Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-montserrat font-bold text-secondary mb-2">3x</div>
            <p className="text-muted-foreground">More Appointments Booked</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-montserrat font-bold text-accent mb-2">85%</div>
            <p className="text-muted-foreground">Less Admin Work</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-montserrat font-bold text-primary mb-2">40%</div>
            <p className="text-muted-foreground">Higher Conversion Rate</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-card p-8 max-w-2xl mx-auto border border-border">
            <h3 className="text-2xl font-montserrat font-bold text-primary mb-4">
              Ready to Transform Your Agency?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join 500+ agencies already using Leadrift AI to automate their sales process 
              and close more policies with less effort.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="group">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default SolutionSection;