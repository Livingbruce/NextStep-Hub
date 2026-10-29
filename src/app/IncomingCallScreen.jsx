import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Modal, StyleSheet, Text, Vibration, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { initials } from "../components/call/CallModal";
import PressableScale from "../components/client/appointments/PressableScale";

function Ring({ delay }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
          -1,
          false,
        ),
      ),
    );
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 1], [0.5, 0]),
    transform: [{ scale: interpolate(t.get(), [0, 1], [1, 2.2]) }],
  }));
  return <Animated.View style={[s.ring, style]} />;
}

function Action({ color, icon, label, onPress, rotate }) {
  return (
    <View style={s.actionWrap}>
      <PressableScale
        haptic
        scaleTo={0.92}
        style={[s.actionBtn, { backgroundColor: color }]}
        onPress={onPress}
        accessibilityLabel={label}
      >
        <Ionicons
          name={icon}
          size={32}
          color="#FFFFFF"
          style={rotate ? { transform: [{ rotate: "135deg" }] } : null}
        />
      </PressableScale>
      <Text style={s.actionLabel}>{label}</Text>
    </View>
  );
}

export default function IncomingCallScreen({ incoming, onAccept, onDecline }) {
  const insets = useSafeAreaInsets();
  const visible = !!incoming;

  useEffect(() => {
    if (!visible) return;
    Vibration.vibrate([0, 700, 500], true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
    return () => Vibration.cancel();
  }, [visible]);

  if (!incoming) return null;
  const video = incoming.mode === "video";

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={["#052E16", "#0B1220", "#0B1220"]}
        style={[
          s.root,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <Animated.View entering={FadeIn.duration(300)} style={s.top}>
          <View style={s.chip}>
            <Ionicons
              name={video ? "videocam" : "call"}
              size={14}
              color="#86EFAC"
            />
            <Text style={s.chipText}>
              NextStep Hub · Incoming {video ? "video" : "audio"} session
            </Text>
          </View>
        </Animated.View>

        <View style={s.center}>
          <View style={s.avatarWrap}>
            <Ring delay={0} />
            <Ring delay={700} />
            <Ring delay={1400} />
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(incoming.name)}</Text>
            </View>
          </View>
          <Text style={s.name} numberOfLines={2}>
            {incoming.name}
          </Text>
          <Text style={s.sub}>
            {incoming.type || "Counseling"} session · is calling you
          </Text>
        </View>

        <View style={s.actions}>
          <Action
            color="#EF4444"
            icon="call"
            label="Decline"
            onPress={onDecline}
            rotate
          />
          <Action
            color="#16A34A"
            icon={video ? "videocam" : "call"}
            label="Join"
            onPress={onAccept}
          />
        </View>
      </LinearGradient>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  top: { alignItems: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(134,239,172,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  chipText: { fontSize: 12, fontWeight: "700", color: "#BBF7D0" },
  center: { alignItems: "center", gap: 10 },
  avatarWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  ring: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#4ADE80",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 42, fontWeight: "800", color: "#FFFFFF" },
  name: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  sub: { fontSize: 15, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  actions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  actionWrap: { alignItems: "center", gap: 10 },
  actionBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
});
