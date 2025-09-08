import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Calendar, 
  CreditCard,
  FileText, 
  Home, 
  LogOut, 
  Menu, 
  Settings, 
  Target, 
  Users, 
  Zap,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    { name: 'Leads', href: '/leads', icon: Users, current: false },
    { name: 'Campaigns', href: '/campaigns', icon: Target, current: false },
    { name: 'Appointments', href: '/appointments', icon: Calendar, current: false },
    { name: 'Calendar Settings', href: '/calendar-settings', icon: Settings, current: false },
    { name: 'Reports', href: '/reports', icon: BarChart3, current: false },
    { name: 'Billing', href: '/billing', icon: CreditCard, current: false },
    { name: 'Policies', href: '/policies', icon: FileText, current: false },
    { name: 'Goals', href: '/goals', icon: Target, current: false },
    { name: 'Settings', href: '/settings', icon: Settings, current: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl border-r border-border">
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-montserrat font-bold text-primary">
                  Leadrift AI
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="mt-4 px-4 space-y-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">{user?.email}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="mt-2 w-full justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-border shadow-card">
          <div className="flex h-16 items-center px-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-montserrat font-bold text-primary">
                Leadrift AI
              </span>
            </div>
          </div>
          <nav className="mt-4 flex-1 px-4 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">{user?.email}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="mt-2 w-full justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="flex h-16 items-center gap-x-4 bg-white border-b border-border px-4 shadow-sm lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Page content */}
        <main className="py-8 px-4 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;