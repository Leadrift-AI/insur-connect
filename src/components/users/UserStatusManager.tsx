import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { UserX, UserCheck, Shield, AlertTriangle } from 'lucide-react';

interface UserStatusManagerProps {
  userId: string;
  currentStatus: string;
  userName: string;
  onStatusChanged: () => void;
}

export const UserStatusManager = ({ 
  userId, 
  currentStatus, 
  userName, 
  onStatusChanged 
}: UserStatusManagerProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { canManageUsers } = useUserRole();

  const updateUserStatus = async (newStatus: string) => {
    if (!canManageUsers) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the activity
      await supabase.rpc('log_user_activity', {
        p_action: `status_changed_to_${newStatus}`,
        p_resource_type: 'user',
        p_resource_id: userId,
        p_details: { previous_status: currentStatus, new_status: newStatus }
      });

      toast({
        title: "Status updated",
        description: `${userName}'s status changed to ${newStatus}`,
      });

      onStatusChanged();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return UserCheck;
      case 'inactive': return UserX;
      case 'suspended': return Shield;
      default: return UserCheck;
    }
  };

  if (!canManageUsers) {
    const StatusIcon = getStatusIcon(currentStatus);
    return (
      <Badge className={getStatusColor(currentStatus)}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {currentStatus}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={currentStatus} 
        onValueChange={updateUserStatus} 
        disabled={loading}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">
            <div className="flex items-center gap-2">
              <UserCheck className="w-3 h-3 text-green-600" />
              Active
            </div>
          </SelectItem>
          <SelectItem value="inactive">
            <div className="flex items-center gap-2">
              <UserX className="w-3 h-3 text-gray-600" />
              Inactive
            </div>
          </SelectItem>
          <SelectItem value="suspended">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-red-600" />
              Suspended
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {currentStatus === 'active' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Suspend
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend User Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to suspend {userName}? This will prevent them from accessing the system until their account is reactivated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => updateUserStatus('suspended')}
                className="bg-red-600 hover:bg-red-700"
              >
                Suspend Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};