import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  ZoomIn,
  ZoomOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ACCENT, styles } from "../../styles/(auth)/signup";

// Option chip: colour cross-fades, springs on press, check icon pops in.
export default function SelectChip({ label, selected, onPress, disabled }) {
  const sel = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    sel.set(withTiming(selected ? 1 : 0, { duration: 180 }));
  }, [selected, sel]);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      sel.get(),
      [0, 1],
      ["#F8FAFC", "#FFF3EE"],
    ),
    borderColor: interpolateColor(sel.get(), [0, 1], ["#E2E8F0", ACCENT]),
    transform: [{ scale: press.get() }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() =>
        press.set(withSpring(0.94, { damping: 15, stiffness: 320 }))
      }
      onPressOut={() =>
        press.set(withSpring(1, { damping: 12, stiffness: 260 }))
      }
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      <Animated.View style={[styles.chip, style]}>
        {selected && (
          <Animated.View
            entering={ZoomIn.duration(160)}
            exiting={ZoomOut.duration(120)}
          >
            <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
          </Animated.View>
        )}
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
