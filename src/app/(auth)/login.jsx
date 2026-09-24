import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  SlideInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../../../libs/supabase";
import AuroraBlobs from "../../components/landing/AuroraBlobs";
import FloatingInput from "../../components/landing/floatingInput";
import HeroIllustration, {
  HERO_BASE_HEIGHT,
  HERO_BASE_WIDTH,
} from "../../components/landing/Heroillustration";
import ShimmerButton from "../../components/landing/Shimmerbutton";
import {
  PROFILE_MISSING,
  SUPPORT_EMAIL,
  getLoginError,
} from "../../components/loginErrors";
import { useAuth } from "../_layout";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null); // { message, action }
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const passwordRef = useRef(null);
  const emailRef = useRef(null);

  // ---- Responsive sizing ------------------------------------------------
  const isTablet = Math.min(width, height) >= 600;
  const headerFull = insets.top + Math.min(height * 0.26, 250);
  const headerCompact = insets.top + 60;
  const heroScale = Math.min(
    1.5,
    Math.max(
      0.7,
      Math.min(
        (width * 0.5) / HERO_BASE_WIDTH,
        (headerFull - insets.top - 64) / HERO_BASE_HEIGHT,
      ),
    ),
  );

  // ---- Keyboard: collapse the hero so the form always has room -----------
  const collapse = useSharedValue(0);
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s = Keyboard.addListener(showEvt, () => {
      setKeyboardOpen(true);
      collapse.set(withTiming(1, { duration: 250 }));
    });
    const h = Keyboard.addListener(hideEvt, () => {
      setKeyboardOpen(false);
      collapse.set(withTiming(0, { duration: 250 }));
    });
    return () => {
      s.remove();
      h.remove();
    };
  }, [collapse]);

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(collapse.get(), [0, 1], [headerFull, headerCompact]),
  }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: 1 - collapse.get(),
    transform: [
      {
        scale: interpolate(collapse.get(), [0, 1], [1, 0.6]),
      },
    ],
  }));

  // ---- Shake on error ------------------------------------------------------
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.get() }],
  }));

  const fail = (fields, form = null) => {
    setFieldErrors(fields);
    setFormError(form);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {},
    );
    shake.set(
      withSequence(
        withTiming(-10, { duration: 60 }),
        withRepeat(withTiming(10, { duration: 110 }), 4, true),
        withTiming(0, { duration: 60 }),
      ),
    );
  };

  // ---- Submit -------------------------------------------------------------
  const handleLogin = async () => {
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    const errors = {};

    if (!cleanEmail) errors.email = "Enter your email address.";
    else if (!EMAIL_REGEX.test(cleanEmail))
      errors.email = "That doesn't look like a valid email address.";
    if (!password) errors.password = "Enter your password.";

    if (errors.email || errors.password) {
      fail(errors);
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    Keyboard.dismiss();
    setFieldErrors({});
    setFormError(null);
    setLoading(true);

    try {
      // 1. Authenticate
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
      if (authError) throw authError;
      if (!authData?.user) throw new Error("No user returned");

      // 2. Load the profile (maybeSingle: a missing row is not a crash)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, id, full_name, approved, suspended")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }

      if (!profile) {
        // Auth account exists but sign-up never created the profile row.
        await supabase.auth.signOut();
        const missing = new Error("Profile not found");
        missing.name = PROFILE_MISSING;
        throw missing;
      }

      // 3. Hand over to the root layout, which routes by role/approval.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      await login(cleanEmail, profile.role, profile);
    } catch (err) {
      console.error("Login error:", err); // for developers only
      fail({}, getLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => router.replace("/(auth)/signup");

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/landing");
  };

  const bottomPad = (keyboardOpen ? 0 : insets.bottom) + 20;

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <LinearGradient
        colors={["#FF7A45", "#F05A2B", "#E14B1F"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AuroraBlobs width={width} height={height} />

      {/* ---- Header: brand + mini illustration ---- */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Animated.Text
          entering={FadeInDown.duration(550)}
          style={[styles.brand, { marginTop: insets.top + 12 }]}
        >
          NextStep Hub
        </Animated.Text>

        <Animated.View style={[styles.heroWrap, heroStyle]}>
          <HeroIllustration scale={heroScale} />
        </Animated.View>

        <Pressable
          onPress={handleBack}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={[
            styles.backButton,
            { top: insets.top + 6, left: Math.max(insets.left, 0) + 16 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>
      </Animated.View>

      {/* ---- Sheet ---- */}
      <Animated.View
        entering={SlideInDown.duration(700).springify().damping(20)}
        style={styles.sheet}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.sheetContent,
            {
              paddingBottom: bottomPad,
              paddingLeft: Math.max(insets.left, 0) + 24,
              paddingRight: Math.max(insets.right, 0) + 24,
            },
          ]}
        >
          <View style={styles.column}>
            <Animated.View entering={FadeInDown.delay(250).duration(500)}>
              <Text style={[styles.title, isTablet && { fontSize: 32 }]}>
                Welcome back
              </Text>
              <Text style={styles.subtitle}>
                Sign in to pick up your next step.
              </Text>
            </Animated.View>

            {/* Friendly, actionable error banner */}
            {formError && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                exiting={FadeOutUp.duration(200)}
                style={styles.errorBanner}
                accessibilityRole="alert"
              >
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorText}>{formError.message}</Text>

                  {formError.action === "signup" && (
                    <Pressable onPress={goToSignup} hitSlop={8}>
                      <Text style={styles.errorAction}>
                        Create an account →
                      </Text>
                    </Pressable>
                  )}
                  {formError.action === "support" && (
                    <Pressable
                      onPress={() =>
                        Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(
                          () => {},
                        )
                      }
                      hitSlop={8}
                    >
                      <Text style={styles.errorAction}>Email support →</Text>
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(350).duration(500)}>
              <Animated.View style={[styles.form, shakeStyle]}>
                <View>
                  <FloatingInput
                    inputRef={emailRef}
                    label="Email address"
                    icon="mail-outline"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (fieldErrors.email || formError) {
                        setFieldErrors((p) => ({ ...p, email: undefined }));
                        setFormError(null);
                      }
                    }}
                    error={!!fieldErrors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    editable={!loading}
                  />
                  {fieldErrors.email && (
                    <Animated.Text
                      entering={FadeIn}
                      exiting={FadeOut}
                      style={styles.fieldError}
                    >
                      {fieldErrors.email}
                    </Animated.Text>
                  )}
                </View>

                <View>
                  <FloatingInput
                    inputRef={passwordRef}
                    label="Password"
                    icon="lock-closed-outline"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (fieldErrors.password || formError) {
                        setFieldErrors((p) => ({ ...p, password: undefined }));
                        setFormError(null);
                      }
                    }}
                    error={!!fieldErrors.password}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    editable={!loading}
                    right={
                      <Pressable
                        onPress={() => setShowPassword((v) => !v)}
                        hitSlop={10}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? "Hide password" : "Show password"
                        }
                        style={styles.eye}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-outline" : "eye-off-outline"
                          }
                          size={22}
                          color="#64748B"
                        />
                      </Pressable>
                    }
                  />
                  {fieldErrors.password && (
                    <Animated.Text
                      entering={FadeIn}
                      exiting={FadeOut}
                      style={styles.fieldError}
                    >
                      {fieldErrors.password}
                    </Animated.Text>
                  )}
                </View>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(450).duration(500)}>
              <ShimmerButton
                label="Sign in"
                onPress={handleLogin}
                loading={loading}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(550).duration(500)}
              style={styles.footer}
            >
              <Text style={styles.footerText}>New to NextStep Hub?</Text>
              <Pressable onPress={goToSignup} disabled={loading} hitSlop={8}>
                <Text style={styles.footerLink}>Create an account</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F05A2B" },

  header: { alignItems: "center", overflow: "hidden" },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  heroWrap: { marginTop: 8, alignItems: "center" },
  backButton: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  sheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
  },
  sheetContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 28,
  },
  column: { width: "100%", maxWidth: 460, gap: 18 },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: { marginTop: 4, fontSize: 14, color: "#64748B" },

  form: { gap: 14 },
  fieldError: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  eye: { padding: 4 },

  errorBanner: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#991B1B",
    fontWeight: "500",
  },
  errorAction: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  footerText: { fontSize: 14, color: "#64748B" },
  footerLink: { fontSize: 14, fontWeight: "800", color: "#F05A2B" },
});
