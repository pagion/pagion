import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Search, UserPlus, X } from 'lucide-react';

interface Contact {
  id: string;
  contact_user_id: string;
  profile: {
    name: string;
    uid: string;
    avatar_color: string;
  };
}

interface ContactsListProps {
  onSelectContact: (contact: Contact) => void;
  selectedContactId: string | null;
}

export function ContactsList({ onSelectContact, selectedContactId }: ContactsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchUid, setSearchUid] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchContacts = async () => {
    if (!user) return;

    // First fetch contacts
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('id, contact_user_id')
      .eq('user_id', user.id);

    if (contactsError || !contactsData || contactsData.length === 0) {
      setContacts([]);
      return;
    }

    // Then fetch profiles for those contacts
    const contactUserIds = contactsData.map(c => c.contact_user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, uid, avatar_color')
      .in('user_id', contactUserIds);

    if (profilesError || !profilesData) {
      setContacts([]);
      return;
    }

    // Combine the data
    const formattedContacts = contactsData.map((c) => {
      const profile = profilesData.find(p => p.user_id === c.contact_user_id);
      return {
        id: c.id,
        contact_user_id: c.contact_user_id,
        profile: profile || { name: 'Unknown', uid: '????????', avatar_color: '#888888' },
      };
    });
    setContacts(formattedContacts);
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const handleAddContact = async () => {
    if (!user || !searchUid.trim()) return;
    
    const trimmedUid = searchUid.trim();
    
    // Validate UID format (8 alphanumeric characters)
    if (trimmedUid.length !== 8) {
      toast({
        title: 'Invalid UID',
        description: 'UID must be exactly 8 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);

    // Use secure RPC function for UID lookup (minimal data exposure)
    const { data: foundProfiles, error: findError } = await supabase
      .rpc('lookup_profile_by_uid', { p_uid: trimmedUid });

    const foundProfile = foundProfiles?.[0];

    if (findError || !foundProfile) {
      toast({
        title: 'User not found',
        description: 'No user exists with that UID.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (foundProfile.user_id === user.id) {
      toast({
        title: 'Invalid UID',
        description: "You can't add yourself as a contact.",
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const existing = contacts.find(c => c.contact_user_id === foundProfile.user_id);
    if (existing) {
      toast({
        title: 'Already added',
        description: 'This user is already in your contacts.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('contacts')
      .insert({ user_id: user.id, contact_user_id: foundProfile.user_id });

    if (insertError) {
      toast({
        title: 'Error',
        description: 'Failed to add contact.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Contact added',
        description: `${foundProfile.name} has been added to your contacts.`,
      });
      setSearchUid('');
      setAddDialogOpen(false);
      fetchContacts();
    }
    setLoading(false);
  };

  const handleRemoveContact = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (!error) {
      setContacts(contacts.filter(c => c.id !== contactId));
      toast({
        title: 'Contact removed',
        description: 'Contact has been removed from your list.',
      });
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.profile.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="pagion-gradient h-9 w-9">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add Contact
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter user UID</label>
                  <Input
                    placeholder="e.g., a1b2c3d4"
                    value={searchUid}
                    onChange={(e) => setSearchUid(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask your friend for their UID from their settings page.
                  </p>
                </div>
                <Button
                  onClick={handleAddContact}
                  disabled={loading || !searchUid.trim()}
                  className="w-full pagion-gradient"
                >
                  {loading ? 'Adding...' : 'Add Contact'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <UserPlus className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              {contacts.length === 0 
                ? 'No contacts yet. Add someone using their UID!' 
                : 'No contacts match your search.'}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors group ${
                selectedContactId === contact.contact_user_id ? 'bg-muted' : ''
              }`}
            >
              <UserAvatar
                name={contact.profile.name}
                color={contact.profile.avatar_color}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{contact.profile.name}</p>
                <p className="text-xs text-muted-foreground">UID: {contact.profile.uid}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => handleRemoveContact(contact.id, e)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
