import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(auth)/statusScreen";
import { useAuth } from "../_layout";

export default function SuspendedScreen() {
  const router = useRouter();
  const auth = useAuth();
  const logout = auth?.logout;

  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await logout();

      router.replace("/(auth)/landing");
    } catch (error) {
      Alert.alert("Sign Out Error", error?.message || "Failed to sign out.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, styles.suspendedIconCircle]}>
          <Ionicons name="ban-outline" size={56} color="#DC2626" />
        </View>

        <Text style={styles.title}>Account Suspended</Text>
        <Text style={styles.description}>
          Your account has been temporarily suspended by an administrator.
          Access to application features is restricted.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Need Assistance?</Text>
          <Text style={styles.cardText}>
            If you believe this is an error or need to request account
            reinstatement, please contact support:
          </Text>
          <Text style={styles.contactEmail}>support@nextstep.org</Text>
        </View>

        <TouchableOpacity
          style={[styles.secondaryBtn, loading && { opacity: 0.6 }]}
          onPress={handleSignOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#64748B" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color="#64748B" />
              <Text style={styles.secondaryBtnText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
