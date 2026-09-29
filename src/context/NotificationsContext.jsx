import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "../../libs/notifications";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ userId, children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setNotifications(await fetchNotifications(userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    fetchNotifications(userId).then((list) => {
      if (mounted) {
        setNotifications(list);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToNotifications(userId, (n) => {
      if (!mounted) return;
      setNotifications((prev) =>
        prev.some((x) => x.id === n.id) ? prev : [n, ...prev],
      );
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId]);

  const markRead = async (id) => {
    setNotifications((p) =>
      p.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await markNotificationRead(id);
  };

  const markAllRead = async () => {
    setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsRead(userId);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        loading,
        unreadCount,
        refresh,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotificationsContext = () => useContext(NotificationsContext);
