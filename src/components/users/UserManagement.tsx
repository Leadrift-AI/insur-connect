import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Mail, Users, Shield, UserCheck, Eye, Trash2 } from 'lucide-react';

interface TeamMember {
  user_id: string;
  role: UserRole;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  invited_by: string;
}

export const UserManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('agent');
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { agencyId, canManageUsers } = useUserRole();

  useEffect(() => {
    if (agencyId && canManageUsers) {
      fetchTeamMembers();
      fetchPendingInvitations();
    }
  }, [agencyId, canManageUsers]);

  const fetchTeamMembers = async () => {
    if (!agencyId) return;

    try {
      const { data, error } = await supabase
        .from('agency_members')
        .select(`
          user_id,
          role,
          created_at,
          profiles!inner(email, full_name)
        `)
        .eq('agency_id', agencyId);

      if (error) throw error;

      const members = data?.map(member => ({
        user_id: member.user_id,
        role: member.role as UserRole,
        created_at: member.created_at,
        email: (member.profiles as any)?.email,
        full_name: (member.profiles as any)?.full_name
      })) || [];

      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive"
      });
    }
  };

  const fetchPendingInvitations = async () => {
    if (!agencyId) return;

    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('agency_id', agencyId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  const sendInvitation = async () => {
    if (!agencyId || !inviteEmail || !inviteRole) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_invitations')
        .insert({
          agency_id: agencyId,
          email: inviteEmail,
          role: inviteRole,
          invited_by: (await supabase.auth.getUser()).data.user?.id!
        });

      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteEmail}`,
      });

      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('agent');
      fetchPendingInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateMemberRole = async (userId: string, newRole: UserRole) => {
    if (!agencyId) return;

    try {
      const { error } = await supabase
        .from('agency_members')
        .update({ role: newRole })
        .eq('agency_id', agencyId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "Team member role updated successfully",
      });

      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (userId: string) => {
    if (!agencyId) return;

    try {
      const { error } = await supabase
        .from('agency_members')
        .delete()
        .eq('agency_id', agencyId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Team member removed successfully",
      });

      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin': return 'bg-red-100 text-red-800 border-red-300';
      case 'agent': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'staff': return 'bg-green-100 text-green-800 border-green-300';
      case 'manager': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return Shield;
      case 'admin': return UserCheck;
      case 'agent': return Users;
      case 'staff': return Users;
      case 'manager': return Eye;
      default: return Users;
    }
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">You don't have permission to manage users.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">Manage your agency team members and their roles</p>
        </div>
        
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                    <SelectItem value="agent">Agent - Lead management</SelectItem>
                    <SelectItem value="staff">Staff - Limited access</SelectItem>
                    <SelectItem value="manager">Manager - Read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={sendInvitation} disabled={submitting} className="w-full">
                {submitting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited as {invitation.role} • Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => {
                const RoleIcon = getRoleIcon(member.role);
                return (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">
                      {member.full_name || 'No name set'}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.role)}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {member.role !== 'owner' && (
                          <>
                            <Select
                              value={member.role}
                              onValueChange={(value) => updateMemberRole(member.user_id, value as UserRole)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeMember(member.user_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};