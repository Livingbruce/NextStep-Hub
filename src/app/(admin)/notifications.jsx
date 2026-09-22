import { SafeAreaView } from "react-native-safe-area-context";
import NotificationsList from "../../components/NotificationsList";
import { useAuth } from "../_layout";

export default function ClientNotifications() {
  const { user } = useAuth();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      edges={["top"]}
    >
      <NotificationsList userId={user?.id} />
    </SafeAreaView>
  );
}
