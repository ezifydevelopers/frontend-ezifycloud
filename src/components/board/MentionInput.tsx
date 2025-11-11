import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  users,
  placeholder = 'Type @ to mention someone...',
  rows = 3,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);

  useEffect(() => {
    if (!textareaRef.current) return;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      const position = target.selectionStart || 0;
      setCursorPosition(position);

      const text = target.value;
      const textBeforeCursor = text.substring(0, position);
      
      // Find @ mention
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      
      if (mentionMatch) {
        const query = mentionMatch[1].toLowerCase();
        setMentionQuery(query);
        setMentionStart(position - query.length - 1);
        setShowMentions(true);
        setSelectedUserIndex(0);
      } else {
        setShowMentions(false);
        setMentionStart(null);
      }
    };

    const textarea = textareaRef.current;
    textarea.addEventListener('input', handleInput);

    return () => {
      textarea.removeEventListener('input', handleInput);
    };
  }, []);

  useEffect(() => {
    if (!textareaRef.current || !showMentions) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const filtered = users.filter((user) =>
          user.name.toLowerCase().includes(mentionQuery) ||
          user.email.toLowerCase().includes(mentionQuery)
        );
        setSelectedUserIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedUserIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const filtered = users.filter((user) =>
          user.name.toLowerCase().includes(mentionQuery) ||
          user.email.toLowerCase().includes(mentionQuery)
        );
        if (filtered.length > 0 && selectedUserIndex < filtered.length) {
          insertMention(filtered[selectedUserIndex] || filtered[0]);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    };

    const textarea = textareaRef.current;
    textarea.addEventListener('keydown', handleKeyDown);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMentions, mentionQuery, selectedUserIndex, users, insertMention]);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionQuery) ||
    user.email.toLowerCase().includes(mentionQuery)
  );

  const insertMention = React.useCallback((user: User) => {
    if (!textareaRef.current || mentionStart === null) return;

    const text = value;
    const beforeMention = text.substring(0, mentionStart);
    const afterMention = text.substring(cursorPosition);
    const newText = `${beforeMention}@${user.name} ${afterMention}`;

    onChange(newText);
    setShowMentions(false);
    setMentionStart(null);
    setMentionQuery('');

    // Set cursor position after mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = mentionStart + user.name.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  }, [value, mentionStart, cursorPosition, onChange]);

  const highlightMentions = (text: string) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), type: 'text' });
      }
      parts.push({
        text: match[0],
        type: 'mention',
        userName: match[1],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), type: 'text' });
    }

    return parts;
  };

  const getMentionedUserIds = (text: string): string[] => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const userIds: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const userName = match[1];
      const user = users.find((u) => u.name === userName);
      if (user) {
        userIds.push(user.id);
      }
    }

    return [...new Set(userIds)]; // Remove duplicates
  };


  return (
    <div className="relative">
      <Popover open={showMentions} onOpenChange={setShowMentions}>
        <PopoverTrigger asChild>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={cn('resize-none', className)}
          />
        </PopoverTrigger>
        {showMentions && filteredUsers.length > 0 && (
          <PopoverContent
            className="w-[300px] p-0"
            align="start"
            side="bottom"
          >
            <Command>
              <CommandInput placeholder="Search users..." value={mentionQuery} />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {filteredUsers.map((user, index) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => insertMention(user)}
                      className={cn(
                        'cursor-pointer',
                        index === selectedUserIndex && 'bg-accent'
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.profilePicture} />
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
};

// Helper function to extract mentioned user IDs from text
export const extractMentionedUserIds = (text: string, users: User[]): string[] => {
  const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
  const userIds: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const userName = match[1];
    const user = users.find((u) => u.name === userName);
    if (user) {
      userIds.push(user.id);
    }
  }

  return [...new Set(userIds)];
};

