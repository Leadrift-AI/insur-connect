import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Users, Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface BulkInvitationsProps {
  onInvitationsSent: () => void;
}

interface ParsedEmail {
  email: string;
  valid: boolean;
  error?: string;
}

export const BulkInvitations = ({ onInvitationsSent }: BulkInvitationsProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailList, setEmailList] = useState('');
  const [defaultRole, setDefaultRole] = useState<UserRole>('agent');
  const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { agencyId } = useUserRole();
  const [inviteCap, setInviteCap] = useState<{allowed: boolean, used: number, cap: number} | null>(null);

  const parseEmails = () => {
    const emails = emailList
      .split(/[\n,;]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const parsed: ParsedEmail[] = emails.map(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        email,
        valid: emailRegex.test(email),
        error: emailRegex.test(email) ? undefined : 'Invalid email format'
      };
    });

    setParsedEmails(parsed);
  };

  const refreshInviteCap = async () => {
    if (!agencyId) return;
    try {
      const res = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL || ''}/functions/v1/invite-cap-check?agency_id=${agencyId}`, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
      });
      const json = await res.json();
      setInviteCap(json);
    } catch {}
  };

  React.useEffect(() => {
    refreshInviteCap();
  }, [agencyId, dialogOpen]);

  const sendBulkInvitations = async () => {
    if (!agencyId) return;

    const validEmails = parsedEmails.filter(pe => pe.valid);
    if (validEmails.length === 0) {
      toast({
        title: "No valid emails",
        description: "Please add valid email addresses",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      await refreshInviteCap();
      if (inviteCap && !inviteCap.allowed) {
        toast({ title: 'Invite limit reached', description: `You have used ${inviteCap.used}/${inviteCap.cap} seats.`, variant: 'destructive' });
        return;
      }
      const currentUser = await supabase.auth.getUser();
      const invitations = validEmails.map(pe => ({
        agency_id: agencyId,
        email: pe.email,
        role: defaultRole,
        invited_by: currentUser.data.user?.id!
      }));

      const { error } = await supabase
        .from('user_invitations')
        .insert(invitations);

      if (error) throw error;

      toast({
        title: "Invitations sent",
        description: `${validEmails.length} invitations sent successfully`,
      });

      setDialogOpen(false);
      setEmailList('');
      setParsedEmails([]);
      onInvitationsSent();
      refreshInviteCap();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = parsedEmails.filter(pe => pe.valid).length;
  const invalidCount = parsedEmails.filter(pe => !pe.valid).length;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="w-4 h-4 mr-2" />
          Bulk Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Invite Team Members</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label htmlFor="emails">Email Addresses</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Enter email addresses separated by commas, semicolons, or new lines
            </p>
            <Textarea
              id="emails"
              value={emailList}
              onChange={(e) => setEmailList(e.target.value)}
              onBlur={parseEmails}
              placeholder="john@example.com, jane@example.com&#10;bob@example.com"
              className="min-h-32"
            />
          </div>

          <div>
            <Label htmlFor="role">Default Role</Label>
            <Select value={defaultRole} onValueChange={(value) => setDefaultRole(value as UserRole)}>
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

          {parsedEmails.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Email Validation</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">{validCount} valid</span>
                    </div>
                    {invalidCount > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">{invalidCount} invalid</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {parsedEmails.map((pe, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{pe.email}</span>
                      <Badge variant={pe.valid ? "default" : "destructive"}>
                        {pe.valid ? "Valid" : pe.error}
                      </Badge>
                    </div>
                  ))}
                </div>

                {validCount > 0 && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      <span>
                        Ready to send {validCount} invitations as <strong>{defaultRole}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={sendBulkInvitations}
              disabled={submitting || validCount === 0}
            >
              {submitting ? "Sending..." : `Send ${validCount} Invitations`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};