import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Designed on a fixed 220 x 180 canvas, then scaled to fit any device.
export const HERO_BASE_WIDTH = 220;
export const HERO_BASE_HEIGHT = 180;

/** Loops 0 -> 1 -> 0 forever. Used for floating and twinkling. */
function useLoop(duration, delay = 0) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      ),
    );
  }, [duration, delay, t]);
  return t;
}

/** A badge that bobs up and down, and bounces (with haptics) when tapped. */
function FloatingBadge({ emoji, color, position, delay, amplitude = 7 }) {
  const t = useLoop(2400 + delay * 0.6, delay);
  const pop = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.get(), [0, 1], [amplitude, -amplitude]) },
      { rotate: `${interpolate(t.get(), [0, 1], [-6, 6])}deg` },
      { scale: pop.get() },
    ],
  }));

  const onPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    pop.set(withSequence(withSpring(1.4, { damping: 6 }), withSpring(1)));
  };

  return (
    <Animated.View
      entering={ZoomIn.delay(500 + delay)
        .springify()
        .damping(9)}
      style={[styles.badgeWrap, position]}
    >
      <Pressable onPress={onPress} hitSlop={10}>
        <Animated.View
          style={[styles.badge, { backgroundColor: color }, style]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function Cloud({ position, width, drift, duration }) {
  const t = useLoop(duration);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.get(), [0, 1], [-drift, drift]) }],
  }));
  return (
    <Animated.View
      entering={FadeIn.delay(700).duration(800)}
      style={[styles.cloud, position, { width }, style]}
    />
  );
}

function Sparkle({ position, delay }) {
  const t = useLoop(1400, delay);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(t.get(), [0, 1], [0.7, 1.3]) }],
  }));
  return (
    <Animated.Text style={[styles.sparkle, position, style]}>✦</Animated.Text>
  );
}

export default function HeroIllustration({ scale = 1 }) {
  return (
    // Outer box reserves the scaled size so layout stays correct.
    <View
      style={{
        width: HERO_BASE_WIDTH * scale,
        height: HERO_BASE_HEIGHT * scale,
      }}
    >
      <View
        style={{
          width: HERO_BASE_WIDTH,
          height: HERO_BASE_HEIGHT,
          transform: [{ scale }],
          transformOrigin: "top left",
        }}
      >
        <Animated.View
          entering={ZoomIn.delay(150).springify().damping(14)}
          style={styles.arch}
        />

        <Cloud
          position={{ bottom: 28, left: 0 }}
          width={75}
          drift={8}
          duration={5200}
        />
        <Cloud
          position={{ bottom: 18, right: -10 }}
          width={75}
          drift={10}
          duration={6400}
        />

        <FloatingBadge
          emoji="😊"
          color="#FACC15"
          position={{ top: 25, left: 28 }}
          delay={0}
        />
        <FloatingBadge
          emoji="🙂"
          color="#86EFAC"
          position={{ right: 18, top: 88 }}
          delay={250}
          amplitude={9}
        />
        <FloatingBadge
          emoji="🥺"
          color="#C084FC"
          position={{ bottom: 22, left: 65 }}
          delay={500}
          amplitude={6}
        />

        <Sparkle position={{ top: 30, right: 35 }} delay={0} />
        <Sparkle position={{ bottom: 25, left: 35 }} delay={700} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arch: {
    position: "absolute",
    bottom: 0,
    left: (HERO_BASE_WIDTH - 140) / 2,
    width: 140,
    height: 140,
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    backgroundColor: "#E14B1F",
  },
  badgeWrap: { position: "absolute" },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  emoji: { fontSize: 18 },
  cloud: {
    position: "absolute",
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAF8",
  },
  sparkle: {
    position: "absolute",
    color: "#FFFFFF",
    fontSize: 12,
  },
});
