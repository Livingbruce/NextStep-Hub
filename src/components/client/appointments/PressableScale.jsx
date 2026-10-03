import * as Haptics from "expo-haptics";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// Spring "press-in" feedback (the Magic UI / Motion `whileTap` pattern).
export default function PressableScale({
  children,
  onPress,
  style,
  containerStyle,
  scaleTo = 0.97,
  haptic = false,
  ...rest
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View style={[anim, containerStyle]}>
      <Pressable
        accessibilityRole="button"
        onPressIn={() =>
          scale.set(withSpring(scaleTo, { damping: 15, stiffness: 320 }))
        }
        onPressOut={() =>
          scale.set(withSpring(1, { damping: 12, stiffness: 260 }))
        }
        onPress={(e) => {
          if (haptic) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => {},
            );
          }
          onPress?.(e);
        }}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
