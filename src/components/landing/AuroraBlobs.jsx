import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

function Blob({ size, color, top, left, drift, duration, delay = 0 }) {
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
  }, [delay, duration, t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (t.get() - 0.5) * 2 * drift },
      { translateY: (0.5 - t.get()) * 1.4 * drift },
      { scale: 1 + t.get() * 0.18 },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        style,
      ]}
    />
  );
}

export default function AuroraBlobs({ width, height }) {
  const base = Math.max(width, 360);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Blob
        size={base * 0.9}
        color="rgba(255, 190, 120, 0.35)"
        top={-base * 0.35}
        left={-base * 0.3}
        drift={base * 0.08}
        duration={7000}
      />
      <Blob
        size={base * 0.7}
        color="rgba(192, 132, 252, 0.28)"
        top={height * 0.06}
        left={width - base * 0.45}
        drift={base * 0.07}
        duration={9000}
        delay={600}
      />
      <Blob
        size={base * 0.6}
        color="rgba(255, 255, 255, 0.16)"
        top={height * 0.24}
        left={-base * 0.2}
        drift={base * 0.06}
        duration={8000}
        delay={1200}
      />
    </View>
  );
}
