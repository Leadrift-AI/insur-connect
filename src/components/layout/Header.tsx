import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-montserrat font-bold text-primary">
            Leadrift AI
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
          <a 
            href="#features" 
            className="text-foreground hover:text-accent transition-smooth relative py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
            aria-label="View features section"
          >
            Features
          </a>
          <a 
            href="#pricing" 
            className="text-foreground hover:text-accent transition-smooth relative py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
            aria-label="View pricing information"
          >
            Pricing
          </a>
          <a 
            href="#about" 
            className="text-foreground hover:text-accent transition-smooth relative py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
            aria-label="Learn about us"
          >
            About
          </a>
          <a 
            href="#contact" 
            className="text-foreground hover:text-accent transition-smooth relative py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
            aria-label="Contact us"
          >
            Contact
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="font-montserrat"
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
          <Button 
            variant="hero" 
            className="font-montserrat"
            onClick={() => navigate('/auth')}
          >
            Start Free Trial
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-smooth focus:outline-none focus:ring-2 focus:ring-accent/50"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          id="mobile-menu"
          className="md:hidden bg-white border-t border-border shadow-card animate-fade-in"
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            <nav className="flex flex-col space-y-4" role="navigation" aria-label="Mobile navigation">
              <a 
                href="#features" 
                className="text-foreground hover:text-accent transition-smooth py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                onClick={() => setIsMenuOpen(false)}
                aria-label="View features section"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-foreground hover:text-accent transition-smooth py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                onClick={() => setIsMenuOpen(false)}
                aria-label="View pricing information"
              >
                Pricing
              </a>
              <a 
                href="#about" 
                className="text-foreground hover:text-accent transition-smooth py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Learn about us"
              >
                About
              </a>
              <a 
                href="#contact" 
                className="text-foreground hover:text-accent transition-smooth py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Contact us"
              >
                Contact
              </a>
            </nav>
            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
              <Button 
                variant="ghost" 
                className="font-montserrat w-full"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
              <Button 
                variant="hero" 
                className="font-montserrat w-full"
                onClick={() => navigate('/auth')}
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;