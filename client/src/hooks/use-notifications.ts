import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user notifications
  const { 
    data: notifications = [], 
    isLoading, 
    error 
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  // Fetch unread count
  const { 
    data: unreadCount = 0, 
    isLoading: isLoadingCount 
  } = useQuery<number>({
    queryKey: ['/api/notifications/unread-count'],
  });

  // Mark notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to mark notification as read",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  // Mark notification as dismissed
  const { mutate: markAsDismissed } = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/notifications/${id}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to dismiss notification",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  // Mark all notifications as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/notifications/mark-all-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: "All notifications marked as read",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to mark all notifications as read",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    isLoadingCount,
    error,
    markAsRead,
    markAsDismissed,
    markAllAsRead,
  };
}