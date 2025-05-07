import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'wouter';
import { Badge } from '@/components/ui/badge';

export function NotificationsMenu() {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAsDismissed, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if dropdown is open and close it if clicked outside
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    markAsRead.mutate(notification.id);
    
    // Navigate based on notification type and related item
    if (notification.relatedItemType && notification.relatedItemId) {
      switch (notification.relatedItemType) {
        case 'work_order':
          navigate(`/work-orders/${notification.relatedItemId}`);
          break;
        case 'work_request':
          navigate(`/work-requests/${notification.relatedItemId}`);
          break;
        case 'pm':
          navigate(`/maintenance/${notification.relatedItemId}`);
          break;
        case 'inventory':
          navigate(`/inventory/${notification.relatedItemId}`);
          break;
        default:
          // No specific navigation
          break;
      }
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to mark notifications as read',
        });
        console.error(error);
      }
    });
  };

  const handleDismissNotification = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation(); // Prevent triggering notification click handler
    
    markAsDismissed.mutate(notificationId, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Notification dismissed',
        });
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to dismiss notification',
        });
        console.error(error);
      }
    });
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation(); // Prevent triggering notification click handler
    
    deleteNotification.mutate(notificationId, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Notification deleted',
        });
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete notification',
        });
        console.error(error);
      }
    });
  };

  return (
    <div ref={menuRef} className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
              >
                Mark all as read
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications && notifications.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.map((notification: any) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-3 cursor-pointer ${
                    notification.status === 'unread' ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between w-full">
                    <div className="font-medium">{notification.title}</div>
                    <div className="flex gap-1">
                      {notification.status === 'unread' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleDismissNotification(e, notification.id)}
                          disabled={markAsDismissed.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        disabled={deleteNotification.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}