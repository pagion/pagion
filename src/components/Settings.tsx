import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw, Moon, Sun, LogOut, Settings as SettingsIcon, Check } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const { profile, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleSaveName = async () => {
    if (!profile || !name.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update name.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Name updated',
        description: 'Your name has been updated successfully.',
      });
      refreshProfile();
    }
    setSaving(false);
  };

  const handleRegenerateUid = async () => {
    if (!profile) return;
    setRegenerating(true);

    const newUid = Math.random().toString(36).substring(2, 10);

    const { error } = await supabase
      .from('profiles')
      .update({ uid: newUid })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate UID.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'UID regenerated',
        description: 'Your new UID is ready to share.',
      });
      refreshProfile();
    }
    setRegenerating(false);
  };

  const handleCopyUid = () => {
    if (profile?.uid) {
      navigator.clipboard.writeText(profile.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'UID copied to clipboard.',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    setLogoutDialogOpen(false);
    onClose();
  };

  if (!profile) return null;

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-5 h-5" />
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <UserAvatar name={profile.name} color={profile.avatar_color} size="lg" />
            <div>
              <CardTitle className="text-lg">{profile.name}</CardTitle>
              <CardDescription>Manage your profile</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Button
                onClick={handleSaveName}
                disabled={saving || name === profile.name}
                className="pagion-gradient"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UID Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your UID</CardTitle>
          <CardDescription>Share this with friends so they can add you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-lg">
            <span className="flex-1">{profile.uid}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyUid}
              className="h-8 w-8"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleRegenerateUid}
            disabled={regenerating}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate UID
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Customize how Pagion looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <span>Dark Mode</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setLogoutDialogOpen(true)}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Log out
      </Button>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to log out?</DialogTitle>
            <DialogDescription>
              You'll need to sign in again to access your messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
