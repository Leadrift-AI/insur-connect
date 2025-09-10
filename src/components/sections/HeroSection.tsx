import { Button } from "@/components/ui/button";
import { ArrowRight, Play, TrendingUp, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-insurance.jpg";
import { useState } from "react";
const HeroSection = () => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  return <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-leadrift-white via-background to-muted/20 -z-10" />
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 bg-gradient-to-l from-accent to-transparent -z-10" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary border border-secondary/20 rounded-full px-4 py-2 text-sm font-medium animate-fade-in-up">
              <Zap className="w-4 h-4 animate-pulse-subtle" />
              <span>AI-Powered Insurance Sales Platform</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-montserrat font-bold text-primary leading-tight animate-fade-in-up" style={{
              animationDelay: '0.2s'
            }}>
                Free Your Agents From{" "}
                <span className="gradient-primary bg-clip-text mx-0 animate-shimmer bg-[length:200%_100%] text-slate-950">
                  Busywork
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed animate-fade-in-up" style={{
              animationDelay: '0.4s'
            }}>
                Close More Families. Build More Wealth.
              </p>
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl animate-fade-in-up" style={{
            animationDelay: '0.6s'
          }}>
              Leadrift AI handles your entire lead nurturing pipeline from A–Z, 
              removing admin work and empowering your agents to sell more policies.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 animate-fade-in-up" style={{
            animationDelay: '0.8s'
          }}>
              <div className="flex items-center space-x-2 group">
                <TrendingUp className="w-5 h-5 text-secondary group-hover:animate-bounce-subtle transition-colors" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">3x</span> More Appointments
                </span>
              </div>
              <div className="flex items-center space-x-2 group">
                <Users className="w-5 h-5 text-secondary group-hover:animate-bounce-subtle transition-colors" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">85%</span> Less Admin Work
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{
            animationDelay: '1s'
          }}>
              <Button variant="hero" size="xl" className="group hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300" onClick={() => navigate('/auth')} aria-label="Start your free trial of Leadrift AI">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button variant="outline" size="xl" className="group hover:shadow-card hover:-translate-y-0.5 transition-all duration-300" aria-label="Watch Leadrift AI demo video">
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-border animate-fade-in-up" style={{
            animationDelay: '1.2s'
          }}>
              <p className="text-sm text-muted-foreground mb-4">
                Trusted by 500+ life insurance agencies
              </p>
              <div className="flex items-center space-x-6 opacity-60">
                <div className="text-sm font-semibold hover:opacity-100 transition-opacity">Agency A</div>
                <div className="text-sm font-semibold hover:opacity-100 transition-opacity">Agency B</div>
                <div className="text-sm font-semibold hover:opacity-100 transition-opacity">Agency C</div>
                <div className="text-sm font-semibold hover:opacity-100 transition-opacity">Agency D</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative animate-slide-in-right" style={{
          animationDelay: '0.5s'
        }}>
            <div className="relative rounded-2xl overflow-hidden shadow-elegant group">
              <img src={heroImage} alt="Insurance agent using Leadrift AI dashboard showing leads management interface" className={`w-full h-auto object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} onLoad={() => setImageLoaded(true)} loading="eager" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent group-hover:from-primary/30 transition-colors duration-300" />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-card p-4 border border-border animate-fade-in hover:shadow-elegant hover:-translate-y-1 transition-all duration-300" style={{
            animationDelay: '1.5s'
          }}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse-subtle" />
                <span className="text-sm font-medium">Live Leads</span>
              </div>
              <p className="text-2xl font-bold text-primary mt-1">+47</p>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-card p-4 border border-border animate-fade-in hover:shadow-elegant hover:-translate-y-1 transition-all duration-300" style={{
            animationDelay: '1.7s'
          }}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle" />
                <span className="text-sm font-medium">Appointments Set</span>
              </div>
              <p className="text-2xl font-bold text-primary mt-1">+23</p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;