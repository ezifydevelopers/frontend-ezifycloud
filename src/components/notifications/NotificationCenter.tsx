// Notification center component

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useWebSocket, WebSocketEventType } from '@/hooks/useWebSocket';
import { notificationAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isConnected, on, off } = useWebSocket({ enabled: true });

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data as Notification[]);
        const unread = (response.data as Notification[]).filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount((response.data as { count: number }).count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationAPI.markAllAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast({
          title: 'All notifications marked as read',
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await notificationAPI.deleteNotification(notificationId);
      if (response.success) {
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId);
          if (notification && !notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          return prev.filter(n => n.id !== notificationId);
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  // Listen for new notifications via WebSocket
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = on(WebSocketEventType.NOTIFICATION_NEW, (message) => {
      const payload = message.payload as { notification: Notification };
      setNotifications(prev => [payload.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast({
        title: payload.notification.title,
        description: payload.notification.message,
        onClick: () => {
          setOpen(true);
          if (payload.notification.link) {
            window.location.href = payload.notification.link;
          }
        },
      });
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, on, off, toast]);

  // Fetch notifications on mount and when sheet opens
  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    } else {
      fetchUnreadCount();
    }
  }, [open]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval_requested':
      case 'approval_approved':
      case 'approval_rejected':
        return '✓';
      case 'mention':
        return '@';
      case 'assignment':
        return '👤';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval_requested':
        return 'bg-blue-100 text-blue-800';
      case 'approval_approved':
        return 'bg-green-100 text-green-800';
      case 'approval_rejected':
        return 'bg-red-100 text-red-800';
      case 'mention':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All caught up!'}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors',
                    !notification.read && 'bg-blue-50 border-blue-200'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                            getNotificationColor(notification.type)
                          )}
                        >
                          {getNotificationIcon(notification.type)}
                        </span>
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
