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

const LEVELS = [
  null,
  { label: "Weak, try adding more characters", color: "#EF4444" },
  { label: "Okay, could be stronger", color: "#F59E0B" },
  { label: "Good", color: "#84CC16" },
  { label: "Strong", color: "#16A34A" },
];

export function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 6) return 1;
  return Math.max(1, score);
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

export default function PasswordStrength({ password }) {
  const score = getStrength(password);
  if (!score) return null;
  const level = LEVELS[score];
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
    </Animated.View>
  );
}
