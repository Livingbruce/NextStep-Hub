import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { clientJoinState } from "../../call/callWindow";
import { useNow } from "../home/time";
import PressableScale from "./PressableScale";

export default function JoinSessionButton({ apt, live, onJoin, compact }) {
  const now = useNow();
  const st = clientJoinState(apt, now, live);
  const on = st.state === "live";

  const t = useSharedValue(0);
  useEffect(() => {
    if (on)
      t.set(
        withRepeat(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          -1,
          true,
        ),
      );
    else t.set(0);
  }, [on, t]);
  const glow = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.get(), [0, 1], [1, 1.02]) }],
    shadowOpacity: interpolate(t.get(), [0, 1], [0.1, 0.45]),
  }));

  if (!["scheduled", "rescheduled", "pending_payment"].includes(apt.status))
    return null;

  return (
    <Animated.View
      style={[
        {
          marginTop: 12,
          shadowColor: "#16A34A",
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: on ? 6 : 0,
        },
        glow,
      ]}
    >
      <PressableScale
        haptic
        disabled={!on}
        onPress={onJoin}
        accessibilityLabel={st.label}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: compact ? 11 : 14,
          borderRadius: 14,
          backgroundColor: on ? "#16A34A" : "#F1F5F9",
        }}
      >
        <Ionicons
          name={on ? "videocam" : "time-outline"}
          size={17}
          color={on ? "#FFFFFF" : "#64748B"}
        />
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: on ? "#FFFFFF" : "#64748B",
          }}
        >
          {on ? "Counselor is live · Join now" : st.label}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}
