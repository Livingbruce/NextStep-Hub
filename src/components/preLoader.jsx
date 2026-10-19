// File: src/components/preLoader.jsx
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import AuroraBlobs from "./landing/AuroraBlobs";

const BG = "#090D16";
const MIN_DISPLAY_MS = 2600;
const EXIT_MS = 400;

// Expanding ring that fades out, repeated behind the logo.
function PulseRing({ size, delay }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
          -1,
          false,
        ),
      ),
    );
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 0.2, 1], [0, 0.45, 0]),
    transform: [{ scale: interpolate(t.get(), [0, 1], [0.8, 1.9]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: "#F05A2B",
        },
        style,
      ]}
    />
  );
}

// Three dots that pulse one after another.
function Dot({ delay }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      ),
    );
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(t.get(), [0, 1], [0.8, 1.2]) }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export default function Preloader({ onFinish, isReady = true }) {
  const { width, height } = useWindowDimensions();
  const logoSize = Math.min(width * 0.5, 220);

  const [introDone, setIntroDone] = useState(false);
  const exit = useSharedValue(1);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  // Hide the native splash once our first frame is on screen.
  const handleLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Minimum display time.
  useEffect(() => {
    const id = setTimeout(() => setIntroDone(true), MIN_DISPLAY_MS);
    return () => clearTimeout(id);
  }, []);

  // Leave only when the minimum time has passed AND the session is restored.
  useEffect(() => {
    if (!introDone || !isReady) return;
    exit.set(
      withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.cubic) }),
    );
    const id = setTimeout(() => onFinishRef.current?.(), EXIT_MS);
    return () => clearTimeout(id);
  }, [introDone, isReady, exit]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: exit.get() }));

  return (
    <Animated.View onLayout={handleLayout} style={[styles.root, rootStyle]}>
      {/* Background: dark gradient + floating aurora blobs */}
      <LinearGradient
        colors={["#090D16", "#1A1022", "#2A1410"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AuroraBlobs width={width} height={height} />

      {/* Logo with pulse rings */}
      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <PulseRing size={logoSize} delay={0} />
          <PulseRing size={logoSize} delay={900} />

          <Animated.View
            entering={ZoomIn.duration(700).springify().damping(12)}
          >
            <Image
              source={require("../../assets/images/logoimage-removebg.png")}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Animated.Text
          entering={FadeInDown.delay(500).duration(600)}
          style={styles.title}
        >
          NextStep Hub
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(800).duration(500)}
          style={styles.dots}
        >
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    overflow: "hidden",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 28,
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F05A2B",
  },
});
