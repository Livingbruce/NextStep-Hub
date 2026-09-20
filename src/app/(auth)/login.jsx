import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { useAuth } from "../_layout";

import { styles } from "../../styles/(auth)/login";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  // Traps all raw errors and converts them to user-friendly messages
  const getFriendlyErrorMessage = (error) => {
    if (!error) return "An unexpected error occurred. Please try again.";

    const msg = (error.message || "").toLowerCase();
    const status = error.status;

    // Network / Connectivity Issues
    if (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("connection") ||
      msg.includes("timeout") ||
      status === 0
    ) {
      return "Network connection issue. Please check your internet and try again.";
    }

    // Invalid Credentials
    if (
      msg.includes("invalid login credentials") ||
      msg.includes("invalid_credentials")
    ) {
      return "Incorrect email or password. Please check your credentials and try again.";
    }

    // Unconfirmed Email
    if (msg.includes("email not confirmed")) {
      return "Your email address has not been verified yet. Please check your inbox.";
    }

    // Rate Limiting
    if (msg.includes("too many requests") || status === 429) {
      return "Too many sign-in attempts. Please wait a moment and try again.";
    }

    // Fallback for custom or unhandled error messages
    return (
      error.message ||
      "Something went wrong while signing in. Please try again."
    );
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing Details",
        "Please enter both your email address and password.",
      );
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    setLoading(true);

    try {
      // 1. Authenticate against Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

      if (authError) throw authError;

      if (!authData?.user) {
        throw new Error(
          "Unable to locate account details. Please try signing in again.",
        );
      }

      // 2. Fetch user's profile and role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, id, full_name, approved, suspended")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("Profile record not found. Please contact support.");
      }

      // 3. Complete authentication flow
      login(cleanEmail, profile.role, profile);
    } catch (err) {
      const friendlyMessage = getFriendlyErrorMessage(err);

      Alert.alert("Unable to Sign In", friendlyMessage, [
        { text: "Cancel", style: "cancel" },
        { text: "Try Again", onPress: handleLogin },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/landing");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.authHeader}>
            <Text style={styles.brandSubtitle}>desolNurturers</Text>
            <Text style={styles.brandTitle}>NextStep</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. youth@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.formInput, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIconBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
