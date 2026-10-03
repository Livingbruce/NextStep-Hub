import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/Profile";
import { pui } from "../../../styles/(client)/profile/ui";
import PressableScale from "../appointments/PressableScale";

// Read-only value that swaps to an input in edit mode. The input border
// animates to green on focus.
export function ProfileField({
  label,
  value,
  editing,
  onChangeText,
  readOnlyHint,
  placeholder,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);

  useEffect(() => {
    focus.set(withTiming(focused ? 1 : 0, { duration: 180 }));
  }, [focused, focus]);

  const box = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.get(), [0, 1], ["#CBD5E1", "#16A34A"]),
    backgroundColor: interpolateColor(
      focus.get(),
      [0, 1],
      ["#F8FAFC", "#FFFFFF"],
    ),
  }));

  return (
    <View style={pui.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing && onChangeText ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[pui.inputBox, box]}
        >
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            selectionColor="#16A34A"
            style={pui.input}
            {...inputProps}
          />
        </Animated.View>
      ) : (
        <Text style={[styles.fieldValue, !value && pui.muted]}>
          {value || "Not provided"}
        </Text>
      )}
      {editing && readOnlyHint ? (
        <Text style={pui.hint}>{readOnlyHint}</Text>
      ) : null}
    </View>
  );
}

// Tap-to-select chips (edit mode) / plain text (view mode).
export function OptionChips({ label, options, value, onChange, editing }) {
  return (
    <View style={pui.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing ? (
        <Animated.View entering={FadeIn.duration(200)} style={pui.chips}>
          {options.map((o) => {
            const selected = value === o;
            return (
              <PressableScale
                key={o}
                scaleTo={0.94}
                accessibilityState={{ selected }}
                style={[pui.chip, selected && pui.chipSelected]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onChange(o);
                }}
              >
                <Text style={[pui.chipText, selected && pui.chipTextSelected]}>
                  {o}
                </Text>
              </PressableScale>
            );
          })}
        </Animated.View>
      ) : (
        <Text style={[styles.fieldValue, !value && pui.muted]}>
          {value || "Not provided"}
        </Text>
      )}
    </View>
  );
}
