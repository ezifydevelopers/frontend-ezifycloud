// Presence indicator component - Shows active viewers and editors

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  cellId?: string;
  columnId?: string;
}

interface PresenceIndicatorProps {
  viewers?: ActiveUser[];
  editors?: ActiveUser[];
  cellEditors?: ActiveUser[];
  className?: string;
  maxVisible?: number;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  viewers = [],
  editors = [],
  cellEditors = [],
  className,
  maxVisible = 3,
}) => {
  const hasPresence = viewers.length > 0 || editors.length > 0 || cellEditors.length > 0;

  if (!hasPresence) {
    return null;
  }

  const visibleViewers = viewers.slice(0, maxVisible);
  const remainingViewers = viewers.length - maxVisible;
  const visibleEditors = editors.slice(0, maxVisible);
  const remainingEditors = editors.length - maxVisible;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Viewers */}
      {visibleViewers.length > 0 && (
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3 text-muted-foreground" />
          <div className="flex items-center -space-x-2">
            {visibleViewers.map((viewer) => (
              <Avatar
                key={viewer.userId}
                className="h-6 w-6 border-2 border-background"
                title={viewer.userName}
              >
                <AvatarImage src={viewer.userAvatar} alt={viewer.userName} />
                <AvatarFallback className="text-xs">
                  {viewer.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {remainingViewers > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{remainingViewers}
            </Badge>
          )}
        </div>
      )}

      {/* Editors */}
      {visibleEditors.length > 0 && (
        <div className="flex items-center gap-1">
          <Edit className="h-3 w-3 text-orange-500" />
          <div className="flex items-center -space-x-2">
            {visibleEditors.map((editor) => (
              <Avatar
                key={editor.userId}
                className="h-6 w-6 border-2 border-orange-500 border-background"
                title={`${editor.userName} (editing)`}
              >
                <AvatarImage src={editor.userAvatar} alt={editor.userName} />
                <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                  {editor.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {remainingEditors > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{remainingEditors}
            </Badge>
          )}
        </div>
      )}

      {/* Cell-specific editors */}
      {cellEditors.length > 0 && (
        <div className="flex items-center gap-1">
          <Edit className="h-3 w-3 text-red-500" />
          <span className="text-xs text-muted-foreground">
            {cellEditors.length} editing this cell
          </span>
        </div>
      )}
    </div>
  );
};

