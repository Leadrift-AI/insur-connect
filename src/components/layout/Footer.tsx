import { Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-montserrat font-bold">
                Leadrift AI
              </span>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              Free your agents from busywork. Close more families. Build more wealth.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-montserrat font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#features" className="hover:text-secondary transition-smooth">Features</a></li>
              <li><a href="#pricing" className="hover:text-secondary transition-smooth">Pricing</a></li>
              <li><a href="#integrations" className="hover:text-secondary transition-smooth">Integrations</a></li>
              <li><a href="#api" className="hover:text-secondary transition-smooth">API</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-montserrat font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#about" className="hover:text-secondary transition-smooth">About</a></li>
              <li><a href="#careers" className="hover:text-secondary transition-smooth">Careers</a></li>
              <li><a href="#contact" className="hover:text-secondary transition-smooth">Contact</a></li>
              <li><a href="#blog" className="hover:text-secondary transition-smooth">Blog</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-montserrat font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#help" className="hover:text-secondary transition-smooth">Help Center</a></li>
              <li><a href="#docs" className="hover:text-secondary transition-smooth">Documentation</a></li>
              <li><a href="#status" className="hover:text-secondary transition-smooth">Status</a></li>
              <li><a href="#security" className="hover:text-secondary transition-smooth">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 Leadrift AI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#privacy" className="text-primary-foreground/60 hover:text-secondary text-sm transition-smooth">
              Privacy Policy
            </a>
            <a href="#terms" className="text-primary-foreground/60 hover:text-secondary text-sm transition-smooth">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;