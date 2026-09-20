import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(auth)/statusScreen";
import { useAuth } from "../_layout";

export default function PendingApprovalScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { checkStatus, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      setLoading(true);
      if (typeof logout === "function") {
        await logout();
      }
      router.replace("/(auth)/landing");
    } catch (error) {
      Alert.alert("Sign Out Error", error?.message || "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      if (typeof checkStatus === "function") {
        const updatedUser = await checkStatus();

        // If user is now approved, trigger navigation manually or let layout guard handle it
        if (updatedUser?.approved) {
          Alert.alert("Approved!", "Your account has been approved.");
        } else {
          Alert.alert("Status", "Your account is still pending approval.");
        }
      }
    } catch (error) {
      Alert.alert(
        "Refresh Error",
        error?.message || "Could not check approval status.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, styles.pendingIconCircle]}>
          <Ionicons name="time-outline" size={56} color="#D97706" />
        </View>

        <Text style={styles.title}>Account Pending Approval</Text>
        <Text style={styles.description}>
          Your account registration was successful! An administrator is
          reviewing your details. You will gain full access once approved.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>What happens next?</Text>
          <Text style={styles.cardText}>
            • Admin verifies your credentials and role assignment.
          </Text>
          <Text style={styles.cardText}>
            • You can press refresh below to re-check your status.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Check Approval Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#64748B" />
          <Text style={styles.secondaryBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
