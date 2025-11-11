// People cell renderer (with avatars)

import React from 'react';
import { Column } from '@/types/workspace';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface PeopleCellProps {
  value: unknown;
  column: Column;
  onClick: () => void;
  workspaceMembers: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
}

export const PeopleCell: React.FC<PeopleCellProps> = ({ 
  value, 
  column, 
  onClick, 
  workspaceMembers 
}) => {
  const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
  const isMultiple = peopleSettings?.peopleType === 'multiple';
  const userIds = Array.isArray(value) 
    ? value.map(id => String(id))
    : value 
    ? [String(value)]
    : [];

  if (userIds.length === 0) {
    return (
      <span 
        className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
        onClick={onClick}
        title="Click to edit"
      >
        —
      </span>
    );
  }

  const users = workspaceMembers.filter(m => userIds.includes(m.id));

  return (
    <div 
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded flex items-center gap-1 flex-wrap"
      onClick={onClick}
      title="Click to edit"
    >
      {users.map((user, idx) => (
        <div key={user.id} className="flex items-center gap-1">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.profilePicture} />
            <AvatarFallback className="text-xs">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isMultiple && idx === 0 && (
            <span className="text-sm">{user.name}</span>
          )}
        </div>
      ))}
      {isMultiple && users.length > 0 && (
        <span className="text-xs text-muted-foreground">({users.length})</span>
      )}
    </div>
  );
};

