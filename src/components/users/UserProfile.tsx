import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { User, Edit, Camera, Mail, Calendar, Shield } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface UserProfileProps {
  userId: string;
  trigger?: React.ReactNode;
}

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  status: string;
  last_seen_at: string | null;
  created_at: string;
  role: UserRole;
}

export const UserProfile = ({ userId, trigger }: UserProfileProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    avatar_url: ''
  });
  
  const { toast } = useToast();
  const { agencyId, canManageUsers } = useUserRole();

  useEffect(() => {
    if (dialogOpen && userId) {
      fetchUserProfile();
    }
  }, [dialogOpen, userId]);

  const fetchUserProfile = async () => {
    if (!agencyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          full_name,
          avatar_url,
          bio,
          status,
          last_seen_at,
          created_at,
          agency_members!inner(role)
        `)
        .eq('user_id', userId)
        .eq('agency_members.agency_id', agencyId)
        .single();

      if (error) throw error;

      const profileData = {
        ...data,
        role: (data.agency_members as any)?.role
      };

      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || ''
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          bio: formData.bio || null,
          avatar_url: formData.avatar_url || null
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "User profile updated successfully",
      });

      setEditing(false);
      fetchUserProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <User className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        {loading && !profile ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {editing && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-6 w-6 p-0"
                      >
                        <Camera className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {profile.full_name || 'No name set'}
                        </h3>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {profile.email}
                        </p>
                      </div>
                      
                      {canManageUsers && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(!editing)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {editing ? 'Cancel' : 'Edit'}
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className={getRoleBadgeColor(profile.role)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {profile.role}
                      </Badge>
                      
                      <Badge className={getStatusColor(profile.status)}>
                        {profile.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {profile.bio && !editing && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{profile.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Form */}
            {editing && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Enter bio"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="avatar_url">Avatar URL</Label>
                    <Input
                      id="avatar_url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      placeholder="Enter avatar image URL"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateProfile} disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Joined</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(profile.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Seen</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.last_seen_at 
                          ? formatDistanceToNow(new Date(profile.last_seen_at), { addSuffix: true })
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Profile not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};