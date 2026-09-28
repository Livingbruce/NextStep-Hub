import { useEffect } from "react";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/Dashboard";

export default function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  style,
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [t]);
  const anim = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 1], [0.5, 1]),
  }));
  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius: radius },
        anim,
        style,
      ]}
    />
  );
}
