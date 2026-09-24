import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const ORANGE = "#F05A2B";

// Label floats up when focused or filled; border and glow animate on focus.
export default function FloatingInput({
  label,
  value,
  onChangeText,
  icon,
  right,
  inputRef,
  error = false,
  editable = true,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);
  const lift = useSharedValue(0);
  const hasValue = value.length > 0;
  const multiline = !!inputProps.multiline;

  useEffect(() => {
    focus.set(withTiming(focused ? 1 : 0, { duration: 220 }));
  }, [focused, focus]);

  useEffect(() => {
    lift.set(
      withTiming(focused || hasValue ? 1 : 0, {
        duration: 180,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [focused, hasValue, lift]);

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.get(), [0, 1], ["#E2E8F0", ORANGE]),
    backgroundColor: interpolateColor(
      focus.get(),
      [0, 1],
      ["#F8FAFC", "#FFFFFF"],
    ),
    shadowOpacity: interpolate(focus.get(), [0, 1], [0, 0.2]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(lift.get(), [0, 1], [0, -11]) },
      { scale: interpolate(lift.get(), [0, 1], [1, 0.78]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.box,
        multiline && styles.boxMulti,
        boxStyle,
        error && styles.boxError,
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color={error ? "#EF4444" : focused ? ORANGE : "#94A3B8"}
        style={[styles.icon, multiline && { marginTop: 20 }]}
      />

      <View style={[styles.field, multiline && styles.fieldMulti]}>
        <Animated.Text
          pointerEvents="none"
          numberOfLines={1}
          style={[
            styles.label,
            focused && { color: ORANGE },
            error && { color: "#EF4444" },
            multiline && { top: 18 },
            labelStyle,
          ]}
        >
          {label}
        </Animated.Text>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={ORANGE}
          placeholderTextColor="#94A3B8"
          style={[styles.input, multiline && styles.inputMulti]}
          {...inputProps}
        />
      </View>

      {right}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  boxMulti: {
    height: undefined,
    minHeight: 120,
    alignItems: "flex-start",
  },
  fieldMulti: {
    height: undefined,
    minHeight: 118,
    justifyContent: "flex-start",
  },
  inputMulti: {
    minHeight: 100,
    paddingTop: 30,
    textAlignVertical: "top",
  },
  boxError: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  icon: { marginRight: 10 },
  field: { flex: 1, height: "100%", justifyContent: "center" },
  label: {
    position: "absolute",
    left: 0,
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "500",
    transformOrigin: "left center",
  },
  input: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    paddingTop: 18,
    paddingBottom: 4,
    paddingHorizontal: 0,
  },
});
