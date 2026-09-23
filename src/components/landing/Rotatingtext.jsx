import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

export default function RotatingText({
  words,
  interval = 2400,
  lineHeight = 28,
  style,
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % words.length),
      interval,
    );
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <View
      style={{ height: lineHeight, overflow: "hidden", alignSelf: "stretch" }}
    >
      <Animated.Text
        key={words[index]}
        entering={FadeInDown.duration(420)}
        exiting={FadeOutUp.duration(300)}
        numberOfLines={1}
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            lineHeight,
          },
          style,
        ]}
      >
        {words[index]}
      </Animated.Text>
    </View>
  );
}
