// Notification center component

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Mail,
  Building2,
  Clock,
  Loader2,
  ArrowRight,
  Users
} from 'lucide-react';
import { useWebSocket, WebSocketEventType } from '@/hooks/useWebSocket';
import { notificationAPI } from '@/lib/api';
import { adminAPI } from '@/lib/api/adminAPI';
import { managerAPI } from '@/lib/api/managerAPI';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'approvals' | 'other'>('all');
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
      navigate(notification.link);
      setOpen(false);
    }
  };

  // Handle approve user from notification
  const handleApproveUser = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    const userId = notification.metadata?.userId as string;
    if (!userId) return;

    try {
      setProcessing(notification.id);
      const response = user?.role === 'admin'
        ? await adminAPI.approveUserAccess(userId)
        : await managerAPI.approveUserAccess(userId);
      
      if (response.success) {
        toast({
          title: 'User Approved',
          description: 'User access has been approved successfully.',
        });
        markAsRead(notification.id);
        fetchNotifications();
      } else {
        throw new Error(response.message || 'Failed to approve user');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve user',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  // Handle reject user from notification
  const handleRejectUser = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    const userId = notification.metadata?.userId as string;
    if (!userId) return;

    try {
      setProcessing(notification.id);
      const response = user?.role === 'admin'
        ? await adminAPI.rejectUserAccess(userId, 'Rejected from notification')
        : await managerAPI.rejectUserAccess(userId, 'Rejected from notification');
      
      if (response.success) {
        toast({
          title: 'User Rejected',
          description: 'User access has been rejected.',
        });
        markAsRead(notification.id);
        fetchNotifications();
      } else {
        throw new Error(response.message || 'Failed to reject user');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject user',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
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

  // Filter notifications by tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'approvals') {
      return notifications.filter(n => 
        n.type === 'approval_requested' || 
        n.type === 'approval_approved' || 
        n.type === 'approval_rejected'
      );
    }
    return notifications.filter(n => 
      n.type !== 'approval_requested' && 
      n.type !== 'approval_approved' && 
      n.type !== 'approval_rejected'
    );
  }, [notifications, activeTab]);

  const approvalCount = useMemo(() => 
    notifications.filter(n => 
      n.type === 'approval_requested' || 
      n.type === 'approval_approved' || 
      n.type === 'approval_rejected'
    ).length,
    [notifications]
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval_requested':
        return <Shield className="h-4 w-4" />;
      case 'approval_approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'approval_rejected':
        return <XCircle className="h-4 w-4" />;
      case 'mention':
        return '@';
      case 'assignment':
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval_requested':
        return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
      case 'approval_approved':
        return 'bg-gradient-to-br from-green-500 to-green-600 text-white';
      case 'approval_rejected':
        return 'bg-gradient-to-br from-red-500 to-red-600 text-white';
      case 'mention':
        return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-[20px]">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals
              {approvalCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-[20px]">
                  {approvalCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="other">
              Other
              {notifications.length - approvalCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-[20px]">
                  {notifications.length - approvalCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No {activeTab === 'all' ? '' : activeTab} notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => {
                    const isApprovalRequest = notification.type === 'approval_requested';
                    const userName = notification.metadata?.userName as string || '';
                    const userEmail = notification.metadata?.userEmail as string || '';
                    const userRole = notification.metadata?.userRole as string || '';
                    const department = notification.metadata?.department as string || '';

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'group relative p-4 rounded-xl border transition-all duration-200',
                          !notification.read 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-xl shadow-sm flex-shrink-0',
                            getNotificationColor(notification.type)
                          )}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm text-gray-900">{notification.title}</h4>
                                  {!notification.read && (
                                    <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                
                                {/* User details for approval requests */}
                                {isApprovalRequest && userName && (
                                  <div className="mt-3 p-3 bg-white/60 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 border-2 border-blue-100">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                          {getInitials(userName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">{userName}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <div className="flex items-center gap-1">
                                            <Mail className="h-3 w-3 text-gray-400" />
                                            <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                                          </div>
                                          {userRole && (
                                            <Badge variant="outline" className="text-xs">
                                              {userRole}
                                            </Badge>
                                          )}
                                          {department && (
                                            <>
                                              <Building2 className="h-3 w-3 text-gray-400" />
                                              <p className="text-xs text-gray-600 truncate">{department}</p>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions for Approval Requests */}
                            {isApprovalRequest && notification.metadata?.userId && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                <Button
                                  size="sm"
                                  onClick={(e) => handleApproveUser(e, notification)}
                                  disabled={processing === notification.id}
                                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                >
                                  {processing === notification.id ? (
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 mr-2" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => handleRejectUser(e, notification)}
                                  disabled={processing === notification.id}
                                  className="flex-1"
                                >
                                  {processing === notification.id ? (
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-2" />
                                  )}
                                  Reject
                                </Button>
                                {notification.link && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationClick(notification);
                                    }}
                                    className="flex-shrink-0"
                                  >
                                    View
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* Regular notification actions */}
                            {!isApprovalRequest && (
                              <div className="flex items-center gap-2 mt-3">
                                {notification.link && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationClick(notification);
                                    }}
                                    className="text-xs"
                                  >
                                    View Details
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
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
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
