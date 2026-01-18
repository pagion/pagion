import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ContactsList } from '@/components/ContactsList';
import { ChatArea } from '@/components/ChatArea';
import { Settings } from '@/components/Settings';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Settings as SettingsIcon, Menu, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Contact {
  id: string;
  contact_user_id: string;
  profile: {
    name: string;
    uid: string;
    avatar_color: string;
  };
}

export default function Chat() {
  const { user, profile, loading } = useAuth();
  const isMobile = useIsMobile();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Logo size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-card">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Logo size="sm" />
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {profile ? (
                <UserAvatar
                  name={profile.name}
                  color={profile.avatar_color}
                  size="sm"
                />
              ) : (
                <SettingsIcon className="w-5 h-5" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-md p-0 overflow-y-auto">
            <Settings onClose={() => setSettingsOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Contacts List */}
      <ContactsList
        onSelectContact={handleSelectContact}
        selectedContactId={selectedContact?.contact_user_id || null}
      />
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        {selectedContact ? (
          <>
            {/* Mobile Chat Header with Back Button */}
            <div className="p-3 border-b border-border flex items-center gap-3 bg-card">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedContact(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <UserAvatar
                name={selectedContact.profile.name}
                color={selectedContact.profile.avatar_color}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedContact.profile.name}</p>
              </div>
            </div>
            <ChatArea contact={selectedContact} />
          </>
        ) : (
          <Sidebar />
        )}
      </div>
    );
  }

  // Desktop/Tablet Layout
  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 lg:w-96 border-r border-border flex-shrink-0">
        <Sidebar />
      </div>

      {/* Chat Area */}
      <ChatArea contact={selectedContact} />
    </div>
  );
}
