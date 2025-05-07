import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Notification } from '@shared/schema';

export function useNotifications() {
  // Get unread notification count
  const { 
    data: unreadCount = 0, 
    isLoading: isLoadingCount,
    refetch: refetchCount
  } = useQuery({
    queryKey: ['/api/notifications/count'],
    select: (data) => data?.count || 0,
  });

  // Get all notifications
  const {
    data: notifications = [],
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  // Mark a notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    }
  });

  // Mark a notification as dismissed
  const markAsDismissed = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('PUT', `/api/notifications/${notificationId}/dismiss`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    }
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', '/api/notifications/read-all');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    }
  });

  // Delete a notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('DELETE', `/api/notifications/${notificationId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    }
  });

  const refetchAll = () => {
    refetchCount();
    refetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications || isLoadingCount,
    markAsRead,
    markAsDismissed,
    markAllAsRead,
    deleteNotification,
    refetchAll
  };
}