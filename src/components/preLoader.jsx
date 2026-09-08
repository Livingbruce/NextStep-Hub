import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export default function Preloader({ onFinish }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 5500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  // --- INTERPOLATIONS ---

  // SCENE 1: "NSM" initial appearance (0.0 - 0.22)
  const nsmOpacity = progress.interpolate({
    inputRange: [0, 0.1, 0.22, 0.72, 0.85, 0.95],
    outputRange: [0, 1, 0, 0, 1, 0],
  });

  const nsmScale = progress.interpolate({
    inputRange: [0, 0.22, 0.72, 0.92],
    outputRange: [0.85, 1, 1, 0.95],
  });

  // SCENE 2: Expansion to "NextStep Mentorship" (0.22 - 0.72)
  const fullTextOpacity = progress.interpolate({
    inputRange: [0, 0.2, 0.32, 0.62, 0.75, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  });

  const fullTextScale = progress.interpolate({
    inputRange: [0.22, 0.38, 0.62, 0.75],
    outputRange: [0.8, 1, 1.05, 0.9],
  });

  // SCENE 2 & 3: Background Light Rays (0.18 - 0.82)
  const rayOpacity = progress.interpolate({
    inputRange: [0, 0.18, 0.45, 0.7, 0.88, 1],
    outputRange: [0, 0.25, 0.85, 0.7, 0.2, 0],
  });

  const rayScale = progress.interpolate({
    inputRange: [0.18, 0.5, 0.88],
    outputRange: [0.5, 1.3, 1.7],
  });

  // SCENE 3 & 4: Sprouting Plant Motion
  const shootTranslateY = progress.interpolate({
    inputRange: [0, 0.38, 0.68, 0.88, 1],
    outputRange: [100, 100, 0, -10, -10],
  });

  // Scale starts tiny (0.1) as a sprout seed, grows vertically, then expands broad
  const shootScaleX = progress.interpolate({
    inputRange: [0, 0.38, 0.52, 0.72, 0.88, 1],
    outputRange: [0.1, 0.1, 0.4, 1.2, 1.4, 1],
  });

  const shootScaleY = progress.interpolate({
    inputRange: [0, 0.38, 0.58, 0.72, 0.88, 1],
    outputRange: [0.1, 0.1, 1.3, 1.1, 1.2, 1],
  });

  const shootOpacity = progress.interpolate({
    inputRange: [0, 0.38, 0.45, 0.9, 0.98],
    outputRange: [0, 0, 1, 1, 0],
  });

  return (
    <View style={styles.container}>
      {/* Background Light Ray Aura */}
      <Animated.View
        style={[
          styles.rayGlow,
          {
            opacity: rayOpacity,
            transform: [{ scale: rayScale }],
          },
        ]}
      />

      {/* Center Text Container */}
      <View style={styles.textContainer}>
        {/* Short Text: NSM */}
        <Animated.Text
          style={[
            styles.titleText,
            {
              opacity: nsmOpacity,
              transform: [{ scale: nsmScale }],
              position: "absolute",
            },
          ]}
        >
          NSM
        </Animated.Text>

        {/* Full Expanded Text: NextStep Mentorship */}
        <Animated.Text
          style={[
            styles.titleText,
            styles.fullText,
            {
              opacity: fullTextOpacity,
              transform: [{ scale: fullTextScale }],
            },
          ]}
        >
          NextStep Mentorship
        </Animated.Text>
      </View>

      {/* Sprouting Shoot & Leaves */}
      <Animated.View
        style={[
          styles.shootContainer,
          {
            opacity: shootOpacity,
            transform: [
              { translateY: shootTranslateY },
              { scaleX: shootScaleX },
              { scaleY: shootScaleY },
            ],
          },
        ]}
      >
        {/* Sprout Stem Base */}
        <View style={styles.stem} />
        {/* Broad Leaves */}
        <Ionicons name="leaf" size={44} color="#4ADE80" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
    alignItems: "center",
    justifyContent: "center",
  },
  rayGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(147, 109, 154, 0.3)",
    shadowColor: "#C084FC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 60,
    elevation: 20,
  },
  textContainer: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 3,
  },
  fullText: {
    fontSize: 22,
    letterSpacing: 1.5,
    color: "#F8FAFC",
  },
  shootContainer: {
    position: "absolute",
    bottom: "35%",
    alignItems: "center",
  },
  stem: {
    width: 3,
    height: 18,
    backgroundColor: "#22C55E",
    borderRadius: 2,
    marginBottom: -6,
  },
});
