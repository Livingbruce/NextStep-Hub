import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationBell({ userId, color = "#0F172A", route }) {
  const { unreadCount } = useNotifications(userId);
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(route)}
      activeOpacity={0.7}
      style={{ position: "relative" }}
    >
      <Ionicons name="notifications-outline" size={22} color={color} />
      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            backgroundColor: "#EF4444",
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
