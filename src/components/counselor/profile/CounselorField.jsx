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
import { pf } from "../../../styles/(counselor)/profileUi";
import PressableScale from "../../client/appointments/PressableScale";

export function Field({
  label,
  value,
  editing,
  onChangeText,
  hint,
  placeholder,
  multiline,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);

  useEffect(() => {
    focus.set(withTiming(focused ? 1 : 0, { duration: 180 }));
  }, [focused, focus]);

  const box = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.get(), [0, 1], ["#CBD5E1", "#1E3A8A"]),
    backgroundColor: interpolateColor(
      focus.get(),
      [0, 1],
      ["#F8FAFC", "#FFFFFF"],
    ),
  }));

  return (
    <View style={pf.field}>
      {!!label && <Text style={pf.label}>{label}</Text>}
      {editing && onChangeText ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[pf.inputBox, box]}
        >
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            selectionColor="#1E3A8A"
            multiline={multiline}
            style={[pf.input, multiline && pf.area]}
            {...inputProps}
          />
        </Animated.View>
      ) : multiline ? (
        <Text style={[pf.bio, !value && pf.muted]}>
          {value || "Nothing added yet."}
        </Text>
      ) : (
        <Text style={[pf.value, !value && pf.muted]}>
          {value || "Not provided"}
        </Text>
      )}
      {editing && hint ? <Text style={pf.hint}>{hint}</Text> : null}
    </View>
  );
}

// Single-select chips (edit) / plain text (view).
export function OptionChips({ label, options, value, onChange, editing }) {
  const list =
    value && !options.includes(value) ? [...options, value] : options;
  return (
    <View style={pf.field}>
      <Text style={pf.label}>{label}</Text>
      {editing ? (
        <Animated.View entering={FadeIn.duration(200)} style={pf.chips}>
          {list.map((o) => {
            const on = value === o;
            return (
              <PressableScale
                key={o}
                scaleTo={0.94}
                accessibilityState={{ selected: on }}
                style={[pf.chip, on && pf.chipOn]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onChange(on ? "" : o);
                }}
              >
                <Text style={[pf.chipText, on && pf.chipTextOn]}>{o}</Text>
              </PressableScale>
            );
          })}
        </Animated.View>
      ) : (
        <Text style={[pf.value, !value && pf.muted]}>
          {value || "Not provided"}
        </Text>
      )}
    </View>
  );
}
