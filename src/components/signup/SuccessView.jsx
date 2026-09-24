import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { styles } from "../../styles/(auth)/signup";
import ShimmerButton from "../landing/Shimmerbutton";

const COLORS = [
  "#F05A2B",
  "#FACC15",
  "#86EFAC",
  "#C084FC",
  "#38BDF8",
  "#FB7185",
];
const PIECES = Array.from({ length: 20 }, (_, i) => ({
  angle: (i / 20) * Math.PI * 2 + (i % 3) * 0.15,
  dist: 80 + (i % 4) * 24,
  color: COLORS[i % COLORS.length],
  size: 6 + (i % 3) * 3,
  round: i % 2 === 0,
  delay: (i % 5) * 40,
}));

function Piece({ angle, dist, color, size, round, delay }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(
      withDelay(
        350 + delay,
        withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }),
      ),
    );
  }, [delay, p]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.get(), [0, 0.1, 0.75, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: Math.cos(angle) * dist * p.get() },
      { translateY: Math.sin(angle) * dist * p.get() + 50 * p.get() * p.get() },
      { rotate: `${p.get() * 540}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: size,
          height: round ? size : size * 1.8,
          borderRadius: round ? size / 2 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export default function SuccessView({ role, firstName, onContinue }) {
  const isClient = role === "Client";
  return (
    <View style={styles.successWrap}>
      <View style={styles.successBadgeBox}>
        {PIECES.map((p, i) => (
          <Piece key={i} {...p} />
        ))}
        <Animated.View
          entering={ZoomIn.delay(100).springify().damping(9)}
          style={styles.successBadge}
        >
          <LinearGradient
            colors={["#4ADE80", "#16A34A"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <Ionicons name="checkmark" size={52} color="#FFFFFF" />
        </Animated.View>
      </View>

      <Animated.Text
        entering={FadeInDown.delay(500).duration(500)}
        style={styles.successTitle}
      >
        {isClient ? `Welcome, ${firstName}!` : `Thanks, ${firstName}!`}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(600).duration(500)}
        style={styles.successBody}
      >
        {isClient
          ? "Your account is ready. Sign in to book your first session and take your next step."
          : "Your account has been created. An administrator will review your details before you can sign in."}
      </Animated.Text>

      {!isClient && (
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={styles.successNotice}
        >
          <Ionicons name="time-outline" size={20} color="#B45309" />
          <Text style={styles.successNoticeText}>
            You can sign in at any time to check your approval status. Full
            access starts once you're approved.
          </Text>
        </Animated.View>
      )}

      <Animated.View
        entering={FadeInDown.delay(800).duration(500)}
        style={{ width: "100%", marginTop: 6 }}
      >
        <ShimmerButton label="Continue to sign in" onPress={onContinue} />
      </Animated.View>
    </View>
  );
}
