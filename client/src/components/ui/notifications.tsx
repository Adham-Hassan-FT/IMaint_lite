import { ReactNode, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Notification as NotificationType } from "@shared/schema";
import { useNotifications } from "@/hooks/use-notifications";
import { Check, X, Bell, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationsDropdownProps {
  children: ReactNode;
}

export function NotificationsDropdown({ children }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const { notifications, markAsRead, markAsDismissed, markAllAsRead } = useNotifications();

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {notifications.some(n => n.status === "unread") && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs h-8"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center h-[100px]">
              <Bell className="h-10 w-10 text-muted-foreground mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="grid gap-1 p-1">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onRead={markAsRead}
                  onDismiss={markAsDismissed}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: NotificationType;
  onRead: any;
  onDismiss: any;
}

function NotificationItem({ notification, onRead, onDismiss }: NotificationItemProps) {
  const isUnread = notification.status === "unread";
  
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "work_order_assigned":
        return <div className="bg-blue-100 text-blue-700 p-2 rounded-full"><Check className="h-4 w-4" /></div>;
      case "work_order_due":
      case "pm_due":
        return <div className="bg-amber-100 text-amber-700 p-2 rounded-full"><Clock className="h-4 w-4" /></div>;
      case "work_request_created":
      case "work_request_converted":
        return <div className="bg-green-100 text-green-700 p-2 rounded-full"><Bell className="h-4 w-4" /></div>;
      case "inventory_low":
        return <div className="bg-red-100 text-red-700 p-2 rounded-full"><Bell className="h-4 w-4" /></div>;
      default:
        return <div className="bg-gray-100 text-gray-700 p-2 rounded-full"><Bell className="h-4 w-4" /></div>;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className={`flex items-start gap-4 p-3 rounded-md transition-colors ${isUnread ? 'bg-muted' : ''} hover:bg-muted/80`}>
      {getNotificationIcon()}
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium leading-none">{notification.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(new Date(notification.createdAt))}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isUnread && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => onRead(notification.id)}
              >
                <Check className="h-3 w-3" />
                <span className="sr-only">Mark as read</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => onDismiss(notification.id)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
        <p className="text-xs">{notification.message}</p>
      </div>
    </div>
  );
}