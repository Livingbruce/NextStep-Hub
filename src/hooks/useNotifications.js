import { useCallback, useEffect, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "../../libs/notifications";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setNotifications(await fetchNotifications(userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const initialize = async () => {
      setLoading(true);

      const initialNotifications = await fetchNotifications(userId);

      if (mounted) {
        setNotifications(initialNotifications);
        setLoading(false);
      }
    };

    initialize();

    const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
      if (!mounted) return;

      setNotifications((prev) => {
        // Avoid duplicates if the notification was already loaded
        if (prev.some((n) => n.id === newNotification.id)) {
          return prev;
        }

        return [newNotification, ...prev];
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await markNotificationRead(id);
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsRead(userId);
  };

  return {
    notifications,
    loading,
    unreadCount,
    refresh: load,
    markRead,
    markAllRead,
  };
}
