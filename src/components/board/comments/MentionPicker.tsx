import React, { useState, useEffect, useRef } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface MentionPickerProps {
  open: boolean;
  query: string;
  users: User[];
  selectedIndex: number;
  onSelect: (user: User) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export const MentionPicker: React.FC<MentionPickerProps> = ({
  open,
  query,
  users,
  selectedIndex,
  onSelect,
  onClose,
  position,
}) => {
  const filteredUsers = React.useMemo(() => {
    if (!query) return users;
    const lowerQuery = query.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    );
  }, [users, query]);

  if (!open || filteredUsers.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={onClose}>
      <PopoverContent
        className="w-[300px] p-0"
        align="start"
        side="bottom"
        style={position ? { position: 'fixed', top: position.top, left: position.left } : undefined}
      >
        <Command>
          <CommandInput placeholder="Search users..." value={query} />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user, index) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => onSelect(user)}
                  className={cn(
                    'cursor-pointer',
                    index === selectedIndex && 'bg-accent'
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
    </Popover>
  );
};

