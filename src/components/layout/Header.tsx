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
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-foreground hover:text-accent transition-smooth">
            Features
          </a>
          <a href="#pricing" className="text-foreground hover:text-accent transition-smooth">
            Pricing
          </a>
          <a href="#about" className="text-foreground hover:text-accent transition-smooth">
            About
          </a>
          <a href="#contact" className="text-foreground hover:text-accent transition-smooth">
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
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-smooth"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-border shadow-card">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-foreground hover:text-accent transition-smooth">
                Features
              </a>
              <a href="#pricing" className="text-foreground hover:text-accent transition-smooth">
                Pricing
              </a>
              <a href="#about" className="text-foreground hover:text-accent transition-smooth">
                About
              </a>
              <a href="#contact" className="text-foreground hover:text-accent transition-smooth">
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