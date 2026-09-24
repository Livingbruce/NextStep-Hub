import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function ShimmerButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}) {
  const isPrimary = variant === "primary";
  const [width, setWidth] = useState(0);
  const shimmer = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    if (!isPrimary) return;
    // Sweep for 1.3s, rest for 1.6s, repeat.
    shimmer.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1600 }),
        ),
        -1,
        false,
      ),
    );
  }, [isPrimary, shimmer]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.get() }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.get(), [0, 1], [-width * 0.5, width]) },
      { skewX: "-20deg" },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.shadow(isPrimary),
        containerStyle,
        (disabled || loading) && { opacity: 0.85 },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        disabled={disabled || loading}
        onPressIn={() =>
          press.set(withSpring(0.96, { damping: 15, stiffness: 300 }))
        }
        onPressOut={() =>
          press.set(withSpring(1, { damping: 12, stiffness: 260 }))
        }
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          onPress?.();
        }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[styles.button, !isPrimary && styles.secondary]}
      >
        {isPrimary && (
          <LinearGradient
            colors={["#FF7A45", "#F05A2B", "#E14B1F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {isPrimary && (
          <Animated.View
            pointerEvents="none"
            style={[styles.sweep, sweepStyle]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.4)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        {loading ? (
          <ActivityIndicator color={isPrimary ? "#FFFFFF" : "#0F172A"} />
        ) : (
          <Text style={[styles.label, !isPrimary && styles.secondaryLabel]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = {
  shadow: (isPrimary) => ({
    width: "100%",
    borderRadius: 26,
    ...(isPrimary
      ? {
          shadowColor: "#F05A2B",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 6,
        }
      : {}),
  }),
  ...StyleSheet.create({
    button: {
      minHeight: 52,
      borderRadius: 26,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    secondary: { backgroundColor: "#F1F5F9" },
    sweep: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 70,
    },
    label: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    secondaryLabel: { color: "#0F172A" },
  }),
};
