import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export default function Marquee({
  children,
  speed = 28, // pixels per second
  gap = 8,
  fadeColor = "#FFFFFF",
}) {
  const { width: screenWidth } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!contentWidth) return;
    cancelAnimation(x);
    x.set(0);
    x.set(
      withRepeat(
        withTiming(-contentWidth, {
          duration: (contentWidth / speed) * 1000,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(x);
  }, [contentWidth, speed, x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));

  const copies = contentWidth ? Math.ceil(screenWidth / contentWidth) + 1 : 2;
  const rowStyle = { flexDirection: "row", gap, paddingRight: gap };

  return (
    <View style={{ overflow: "hidden", alignSelf: "stretch" }}>
      <Animated.View
        style={[{ flexDirection: "row", alignSelf: "flex-start" }, style]}
      >
        <View
          style={rowStyle}
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
        >
          {children}
        </View>
        {Array.from({ length: copies }).map((_, i) => (
          <View key={i} style={rowStyle}>
            {children}
          </View>
        ))}
      </Animated.View>

      {/* Edge fades */}
      <LinearGradient
        pointerEvents="none"
        colors={[fadeColor, `${fadeColor}00`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 28 }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${fadeColor}00`, fadeColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 28 }}
      />
    </View>
  );
}
