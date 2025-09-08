import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Zap } from 'lucide-react';

interface AgencySetupProps {
  onComplete: () => void;
}

export const AgencySetup = ({ onComplete }: AgencySetupProps) => {
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !agencyName.trim()) return;

    setLoading(true);
    try {
      // Create agency
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: agencyName.trim(),
          created_by: user.id,
          owner_user_id: user.id
        })
        .select()
        .single();

      if (agencyError) throw agencyError;

      // Add user as agency member (owner)
      const { error: memberError } = await supabase
        .from('agency_members')
        .insert({
          agency_id: agency.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // Add to memberships table
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          agency_id: agency.id,
          user_id: user.id,
          role: 'owner'
        });

      if (membershipError) throw membershipError;

      // Update user profile with agency_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ agency_id: agency.id })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Welcome to Leadrift AI!",
        description: "Your agency has been set up successfully.",
      });

      onComplete();
    } catch (error: any) {
      console.error('Error setting up agency:', error);
      toast({
        title: "Setup Error",
        description: error.message || "Failed to set up your agency. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Leadrift AI</CardTitle>
          <p className="text-muted-foreground">
            Let's set up your agency to get started
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="agencyName">Agency Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="agencyName"
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Enter your agency name"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading || !agencyName.trim()}>
              {loading ? "Setting up..." : "Create Agency"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your agency will be created</li>
              <li>• You'll be set as the owner</li>
              <li>• You can invite team members</li>
              <li>• Start managing leads and campaigns</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};