import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Send, MoreVertical, Reply, Pencil, Trash2, X, Check } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  reply_to_id: string | null;
  is_edited: boolean;
  created_at: string;
  reply_to?: {
    content: string;
    sender_name: string;
  };
}

interface Contact {
  id: string;
  contact_user_id: string;
  profile: {
    name: string;
    uid: string;
    avatar_color: string;
  };
}

interface ChatAreaProps {
  contact: Contact | null;
}

export function ChatArea({ contact }: ChatAreaProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const MESSAGE_COOLDOWN = 500; // 500ms between messages

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user || !contact) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contact.contact_user_id}),and(sender_id.eq.${contact.contact_user_id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const messagesWithReplies = await Promise.all(
        data.map(async (msg) => {
          if (msg.reply_to_id) {
            const { data: replyData } = await supabase
              .from('messages')
              .select('content, sender_id')
              .eq('id', msg.reply_to_id)
              .maybeSingle();

            if (replyData) {
              const senderName = replyData.sender_id === user.id 
                ? profile?.name || 'You' 
                : contact.profile.name;
              return { ...msg, reply_to: { content: replyData.content, sender_name: senderName } };
            }
          }
          return msg;
        })
      );
      setMessages(messagesWithReplies);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user, contact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !contact) return;

    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, contact]);

  const handleSendMessage = async () => {
    if (!user || !contact || !newMessage.trim()) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastMessageTime < MESSAGE_COOLDOWN) {
      return; // Silently ignore rapid messages
    }

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: contact.contact_user_id,
      content: newMessage.trim(),
      reply_to_id: replyTo?.id || null,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } else {
      setLastMessageTime(now);
      setNewMessage('');
      setReplyTo(null);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    const { error } = await supabase
      .from('messages')
      .update({ content: editContent.trim(), is_edited: true })
      .eq('id', editingMessage.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to edit message.',
        variant: 'destructive',
      });
    } else {
      setEditingMessage(null);
      setEditContent('');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message.',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Send className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
          <p className="text-muted-foreground text-sm">Choose a contact to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border glass-effect flex items-center gap-3">
        <UserAvatar
          name={contact.profile.name}
          color={contact.profile.avatar_color}
          size="md"
        />
        <div>
          <h3 className="font-semibold">{contact.profile.name}</h3>
          <p className="text-xs text-muted-foreground">UID: {contact.profile.uid}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.map((message) => {
          const isSent = message.sender_id === user?.id;
          const isEditing = editingMessage?.id === message.id;

          return (
            <div
              key={message.id}
              className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-[75%] ${isSent ? 'order-2' : ''}`}>
                {message.reply_to && (
                  <div className={`text-xs p-2 rounded-t-lg border-l-2 ${
                    isSent 
                      ? 'bg-primary/20 border-primary ml-auto' 
                      : 'bg-muted border-muted-foreground'
                  } max-w-full`}>
                    <p className="font-medium text-[10px] mb-0.5">{message.reply_to.sender_name}</p>
                    <p className="truncate opacity-70">{message.reply_to.content}</p>
                  </div>
                )}
                
                <div className={`group flex items-end gap-2 ${isSent ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`px-4 py-2 ${
                      isSent ? 'message-bubble-sent' : 'message-bubble-received'
                    } ${message.reply_to ? 'rounded-t-none' : ''}`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-7 text-sm bg-transparent border-0 p-0 focus-visible:ring-0"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={handleEditMessage}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setEditingMessage(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : ''}`}>
                      <span className="text-[10px] opacity-60">
                        {formatTime(message.created_at)}
                      </span>
                      {message.is_edited && (
                        <span className="text-[10px] opacity-60">(edited)</span>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isSent ? 'end' : 'start'}>
                        <DropdownMenuItem onClick={() => setReplyTo(message)}>
                          <Reply className="w-4 h-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        {isSent && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setEditingMessage(message);
                              setEditContent(message.content);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center gap-2">
          <Reply className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">
              Replying to {replyTo.sender_id === user?.id ? 'yourself' : contact.profile.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setReplyTo(null)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border glass-effect">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="h-11"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="h-11 w-11 pagion-gradient"
            size="icon"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
