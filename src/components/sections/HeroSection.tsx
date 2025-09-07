import { Button } from "@/components/ui/button";
import { ArrowRight, Play, TrendingUp, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-insurance.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-leadrift-white via-background to-muted/20 -z-10" />
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 bg-gradient-to-l from-accent to-transparent -z-10" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary border border-secondary/20 rounded-full px-4 py-2 text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>AI-Powered Insurance Sales Platform</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-montserrat font-bold text-primary leading-tight">
                Free Your Agents From{" "}
                <span className="gradient-primary bg-clip-text text-transparent">
                  Busywork
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Close More Families. Build More Wealth.
              </p>
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Leadrift AI handles your entire lead nurturing pipeline from A–Z, 
              removing admin work and empowering your agents to sell more policies.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">3x</span> More Appointments
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-secondary" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">85%</span> Less Admin Work
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="xl" 
                className="group"
                onClick={() => navigate('/auth')}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl" className="group">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Trusted by 500+ life insurance agencies
              </p>
              <div className="flex items-center space-x-6 opacity-60">
                <div className="text-sm font-semibold">Agency A</div>
                <div className="text-sm font-semibold">Agency B</div>
                <div className="text-sm font-semibold">Agency C</div>
                <div className="text-sm font-semibold">Agency D</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img
                src={heroImage}
                alt="Insurance agent using Leadrift AI dashboard"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-card p-4 border border-border">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-sm font-medium">Live Leads</span>
              </div>
              <p className="text-2xl font-bold text-primary mt-1">+47</p>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-card p-4 border border-border">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-sm font-medium">Appointments Set</span>
              </div>
              <p className="text-2xl font-bold text-primary mt-1">+23</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;