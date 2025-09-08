import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useUserActivity } from '@/hooks/useUserActivity';
import { supabase } from '@/integrations/supabase/client';
import { UserSearch } from './UserSearch';
import { BulkInvitations } from './BulkInvitations';
import { UserActivityLog } from './UserActivityLog';
import { UserProfile } from './UserProfile';
import { UserStatusManager } from './UserStatusManager';
import { Plus, Mail, Users, Shield, UserCheck, Eye, Trash2, RefreshCw, MoreHorizontal, Clock, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TeamMember {
  user_id: string;
  role: UserRole;
  created_at: string;
  email?: string;
  full_name?: string;
  status?: string;
  last_seen_at?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  invited_by: string;
  resent_count?: number;
  last_resent_at?: string;
}

export const UserManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('agent');
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { agencyId, canManageUsers } = useUserRole();
  const { logActivity } = useUserActivity();
  
  // Search and filtering
  const { 
    filters, 
    filteredAndSortedMembers, 
    updateFilter, 
    resetFilters 
  } = useUserSearch(teamMembers);

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
          profiles!inner(email, full_name, status, last_seen_at)
        `)
        .eq('agency_id', agencyId);

      if (error) throw error;

      const members = data?.map(member => ({
        user_id: member.user_id,
        role: member.role as UserRole,
        created_at: member.created_at,
        email: (member.profiles as any)?.email,
        full_name: (member.profiles as any)?.full_name,
        status: (member.profiles as any)?.status || 'active',
        last_seen_at: (member.profiles as any)?.last_seen_at
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchTeamMembers(), fetchPendingInvitations()]);
      toast({
        title: "Data refreshed",
        description: "Team member data has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
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

      await logActivity('user_invited', 'invitation', null, { email: inviteEmail, role: inviteRole });

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

  const resendInvitation = async (invitationId: string, email: string) => {
    if (!agencyId) return;

    try {
      // Update invitation
      const { error } = await supabase
        .from('user_invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          resent_count: (pendingInvitations.find(inv => inv.id === invitationId)?.resent_count || 0) + 1,
          last_resent_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;

      await logActivity('invitation_resent', 'invitation', invitationId, { email });

      toast({
        title: "Invitation resent",
        description: `Invitation resent to ${email}`,
      });

      fetchPendingInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive"
      });
    }
  };

  const cancelInvitation = async (invitationId: string, email: string) => {
    if (!agencyId) return;

    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      await logActivity('invitation_cancelled', 'invitation', invitationId, { email });

      toast({
        title: "Invitation cancelled",
        description: `Invitation for ${email} has been cancelled`,
      });

      fetchPendingInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invitation",
        variant: "destructive"
      });
    }
  };

  const updateMemberRole = async (userId: string, newRole: UserRole) => {
    if (!agencyId) return;

    try {
      const oldRole = teamMembers.find(m => m.user_id === userId)?.role;
      
      const { error } = await supabase
        .from('agency_members')
        .update({ role: newRole })
        .eq('agency_id', agencyId)
        .eq('user_id', userId);

      if (error) throw error;

      await logActivity('role_updated', 'user', userId, { old_role: oldRole, new_role: newRole });

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
      const member = teamMembers.find(m => m.user_id === userId);
      
      const { error } = await supabase
        .from('agency_members')
        .delete()
        .eq('agency_id', agencyId)
        .eq('user_id', userId);

      if (error) throw error;

      await logActivity('member_removed', 'user', userId, { 
        email: member?.email, 
        name: member?.full_name 
      });

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
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <BulkInvitations onInvitationsSent={fetchPendingInvitations} />
          
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
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Team Members ({teamMembers.length})</TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations ({pendingInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Search and Filters */}
          <UserSearch
            filters={filters}
            onFilterChange={updateFilter}
            onResetFilters={resetFilters}
            totalResults={filteredAndSortedMembers.length}
          />

          {/* Team Members Table */}
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
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedMembers.map((member) => {
                    const RoleIcon = getRoleIcon(member.role);
                    return (
                      <TableRow key={member.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {(member.full_name || member.email || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.full_name || 'No name set'}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(member.role)}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <UserStatusManager
                            userId={member.user_id}
                            currentStatus={member.status || 'active'}
                            userName={member.full_name || member.email || 'Unknown'}
                            onStatusChanged={fetchTeamMembers}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {member.last_seen_at 
                              ? formatDistanceToNow(new Date(member.last_seen_at), { addSuffix: true })
                              : 'Never'
                            }
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserProfile userId={member.user_id} />
                            
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
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => removeMember(member.user_id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Remove Member
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {/* Pending Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending invitations
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{invitation.email}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Role: {invitation.role}</span>
                          <span>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                          {invitation.resent_count && invitation.resent_count > 0 && (
                            <span>Resent: {invitation.resent_count} times</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          Pending
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => resendInvitation(invitation.id, invitation.email)}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Resend Invitation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => cancelInvitation(invitation.id, invitation.email)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancel Invitation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <UserActivityLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};