import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { styles } from "../../styles/(auth)/signup";
import { checkPassword } from "./passwordPolicy";

const LEVELS = [
  null,
  { label: "Weak, doesn't meet all requirements", color: "#EF4444" },
  { label: "Acceptable, longer is stronger", color: "#F59E0B" },
  { label: "Good", color: "#84CC16" },
  { label: "Strong", color: "#16A34A" },
];

export function getStrength(pw, ctx = {}) {
  if (!pw) return 0;
  if (!checkPassword(pw, ctx).valid) return 1;
  if (pw.length >= 16) return 4;
  if (pw.length >= 12) return 3;
  return 2;
}

function Segment({ active, color }) {
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.set(withTiming(active ? 1 : 0, { duration: 220 }));
  }, [active, fill]);
  const style = useAnimatedStyle(() => ({
    opacity: fill.get(),
    transform: [{ scaleX: fill.get() }],
    backgroundColor: color,
  }));
  return (
    <View style={styles.strengthSegment}>
      <Animated.View style={[styles.strengthFill, style]} />
    </View>
  );
}

function Row({ ok, label, danger }) {
  const color = ok ? "#16A34A" : danger ? "#DC2626" : "#94A3B8";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
      }}
    >
      <Ionicons
        name={
          ok ? "checkmark-circle" : danger ? "close-circle" : "ellipse-outline"
        }
        size={14}
        color={color}
      />
      <Text
        style={{ fontSize: 12, color, fontWeight: ok ? "600" : "500", flex: 1 }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PasswordStrength({ password, email }) {
  const ctx = { email };
  const score = getStrength(password, ctx);
  if (!score) return null;
  const level = LEVELS[score];
  const result = checkPassword(password, ctx);
  const allRulesOk = result.rules.every((r) => r.ok);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.strengthWrap}
    >
      <View style={styles.strengthRow}>
        {[1, 2, 3, 4].map((i) => (
          <Segment key={i} active={score >= i} color={level.color} />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: level.color }]}>
        {level.label}
      </Text>

      <View style={{ marginTop: 4 }}>
        {result.rules.map((r) => (
          <Row key={r.id} ok={r.ok} label={r.label} />
        ))}
        {allRulesOk && result.message && (
          <Row ok={false} danger label={result.message} />
        )}
      </View>
    </Animated.View>
  );
}
