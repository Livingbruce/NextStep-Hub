import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNotifications } from "../hooks/useNotifications";

const ICONS = {
  new_appointment: "calendar",
  appointment_reminder_24h: "time-outline",
  appointment_reminder_1h: "alarm-outline",
  link_updated: "link-outline",
  counselor_signup: "person-add-outline",
  new_program: "briefcase-outline",
  new_appointment_admin: "calendar-outline",
};

export default function NotificationsList({ userId }) {
  const {
    notifications,
    loading,
    refresh,
    markRead,
    markAllRead,
    unreadCount,
  } = useNotifications(userId);

  return (
    <View style={{ flex: 1 }}>
      {unreadCount > 0 && (
        <TouchableOpacity
          onPress={markAllRead}
          style={{ padding: 12, alignItems: "flex-end" }}
        >
          <Text style={{ color: "#2563EB", fontWeight: "600", fontSize: 13 }}>
            Mark all as read
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Ionicons
                name="notifications-off-outline"
                size={40}
                color="#CBD5E1"
              />
              <Text style={{ color: "#94A3B8", marginTop: 8 }}>
                No notifications yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => !item.is_read && markRead(item.id)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                gap: 12,
                padding: 14,
                borderRadius: 12,
                backgroundColor: item.is_read ? "#FFFFFF" : "#EFF6FF",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Ionicons
                name={ICONS[item.type] || "notifications-outline"}
                size={20}
                color="#1E3A8A"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                  {item.title}
                </Text>
                {item.body ? (
                  <Text
                    style={{ color: "#475569", marginTop: 2, fontSize: 13 }}
                  >
                    {item.body}
                  </Text>
                ) : null}
                <Text style={{ color: "#94A3B8", marginTop: 4, fontSize: 11 }}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
              {!item.is_read && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#2563EB",
                    marginTop: 4,
                  }}
                />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
