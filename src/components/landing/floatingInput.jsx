import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const ORANGE = "#F05A2B";

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

  useEffect(() => {
    focus.set(
      withTiming(focused ? 1 : 0, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      }),
    );
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
      {
        translateY: interpolate(lift.get(), [0, 1], [0, -11]),
      },
      {
        scale: interpolate(lift.get(), [0, 1], [1, 0.78]),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.box, boxStyle, error && styles.boxError]}>
      <Ionicons
        name={icon}
        size={19}
        color={error ? "#EF4444" : focused ? ORANGE : "#94A3B8"}
        style={styles.icon}
      />

      <View style={styles.field}>
        {/* Floating label wrapper */}
        <Animated.View
          pointerEvents="none"
          style={[styles.labelWrapper, labelStyle]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              focused && styles.labelFocused,
              error && styles.labelError,
            ]}
          >
            {label}
          </Text>
        </Animated.View>

        {/* Actual text input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={ORANGE}
          placeholderTextColor="#94A3B8"
          style={styles.input}
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 12,
    elevation: 0,
  },

  boxError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  icon: {
    marginRight: 10,
  },

  field: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
  },

  labelWrapper: {
    position: "absolute",
    left: 0,

    transformOrigin: "left center",

    zIndex: 2,
  },

  label: {
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "500",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 2,
  },

  labelFocused: {
    color: ORANGE,
    backgroundColor: "#FFFFFF",
  },

  labelError: {
    color: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  input: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",

    paddingTop: 18,
    paddingBottom: 4,
    paddingHorizontal: 0,

    minHeight: 52,
  },
});
