import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  ZoomIn,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ACCENT, INK, styles } from "../../styles/(auth)/signup";

const STEPS = ["Account", "About you", "Background"];

function Node({ index, label, progress, step, onPress }) {
  const n = index + 1;
  const done = step > n;

  const nodeStyle = useAnimatedStyle(() => {
    const active = 1 - Math.min(1, Math.abs(progress.get() - n));
    return {
      backgroundColor: interpolateColor(
        progress.get(),
        [index, n],
        ["rgba(255,255,255,0.28)", "#FFFFFF"],
      ),
      transform: [{ scale: 1 + 0.16 * active }],
    };
  });
  const numberStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [index, n], [INK, ACCENT]),
  }));

  return (
    <Pressable
      disabled={!done}
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={done ? `Go back to ${label}` : label}
      style={styles.stepNodeWrap}
    >
      <Animated.View style={[styles.stepNode, nodeStyle]}>
        {done ? (
          <Animated.View entering={ZoomIn.duration(220)}>
            <Ionicons name="checkmark" size={18} color={ACCENT} />
          </Animated.View>
        ) : (
          <Animated.Text style={[styles.stepNodeText, numberStyle]}>
            {n}
          </Animated.Text>
        )}
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        style={[styles.stepLabel, step === n && styles.stepLabelActive]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function Line({ index, progress }) {
  const fill = useAnimatedStyle(() => ({
    width: `${interpolate(
      progress.get(),
      [index + 1, index + 2],
      [0, 100],
      Extrapolation.CLAMP,
    )}%`,
  }));
  return (
    <View style={styles.stepLine}>
      <Animated.View style={[styles.stepLineFill, fill]} />
    </View>
  );
}

// step: 1..3 (4 = everything complete). Tap a finished step to go back to it.
export default function StepIndicator({ step, onStepPress }) {
  const progress = useSharedValue(step);
  useEffect(() => {
    progress.set(
      withTiming(step, { duration: 450, easing: Easing.out(Easing.cubic) }),
    );
  }, [step, progress]);

  return (
    <View style={styles.stepper}>
      {STEPS.map((label, i) => (
        <View
          key={label}
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: i < STEPS.length - 1 ? 1 : 0,
          }}
        >
          <Node
            index={i}
            label={label}
            progress={progress}
            step={step}
            onPress={() => onStepPress?.(i + 1)}
          />
          {i < STEPS.length - 1 && <Line index={i} progress={progress} />}
        </View>
      ))}
    </View>
  );
}
