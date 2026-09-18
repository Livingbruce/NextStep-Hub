import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const MIN_DISPLAY_MS = 2600;

export default function Preloader({ onFinish, isReady = true }) {
  const introProgress = useRef(new Animated.Value(0)).current;
  const idlePulse = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  const [introDone, setIntroDone] = useState(false);
  const readyRef = useRef(isReady);
  const minTimeElapsedRef = useRef(false);
  const idleLoopRef = useRef(null);
  const finishedRef = useRef(false);

  const tryFinish = () => {
    if (finishedRef.current) return;
    if (!introDone) return;
    if (!minTimeElapsedRef.current) return;
    if (!readyRef.current) return;

    finishedRef.current = true;
    idleLoopRef.current?.stop();

    Animated.timing(exitOpacity, {
      toValue: 0,
      duration: 420,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onFinish?.();
    });
  };

  // One-shot intro animation, plus the minimum display timer.
  useEffect(() => {
    Animated.timing(introProgress, {
      toValue: 1,
      duration: 2600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIntroDone(true));

    const minTimer = setTimeout(() => {
      minTimeElapsedRef.current = true;
      tryFinish();
    }, MIN_DISPLAY_MS);

    return () => clearTimeout(minTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track isReady changes without restarting the intro.
  useEffect(() => {
    readyRef.current = isReady;
    tryFinish();
  }, [isReady]);

  useEffect(() => {
    if (!introDone) return;

    idleLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(idlePulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idlePulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    idleLoopRef.current.start();

    tryFinish();

    return () => idleLoopRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone]);

  // --- INTERPOLATIONS ---

  // Stage A (0 – 0.55): "NSM" appears, holds, then fades as expansion begins
  const nsmOpacity = introProgress.interpolate({
    inputRange: [0, 0.15, 0.4, 0.55],
    outputRange: [0, 1, 1, 0],
    extrapolate: "clamp",
  });
  const nsmScale = introProgress.interpolate({
    inputRange: [0, 0.15, 0.55],
    outputRange: [0.85, 1, 1.08],
    extrapolate: "clamp",
  });

  // Stage B (0.45 – 1): expands into "NextStep Mentorship" and settles
  const fullTextOpacity = introProgress.interpolate({
    inputRange: [0.45, 0.6, 1],
    outputRange: [0, 1, 1],
    extrapolate: "clamp",
  });
  const fullTextScale = introProgress.interpolate({
    inputRange: [0.45, 0.65, 1],
    outputRange: [0.9, 1, 1],
    extrapolate: "clamp",
  });

  // Background glow, active throughout, plus a subtle idle breathing add-on
  const rayOpacity = introProgress.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.3, 0.75, 0.55],
    extrapolate: "clamp",
  });
  const rayScale = Animated.add(
    introProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 1.15, 1.35],
      extrapolate: "clamp",
    }),
    idlePulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
  );

  // Stage C (0.5 – 1): sprout grows in step with the text settling
  const shootTranslateY = introProgress.interpolate({
    inputRange: [0.5, 0.75, 1],
    outputRange: [40, 0, -6],
    extrapolate: "clamp",
  });
  const shootScaleY = introProgress.interpolate({
    inputRange: [0.5, 0.7, 0.85, 1],
    outputRange: [0.15, 1.2, 0.95, 1],
    extrapolate: "clamp",
  });
  const shootScaleX = introProgress.interpolate({
    inputRange: [0.5, 0.75, 1],
    outputRange: [0.3, 1.1, 1],
    extrapolate: "clamp",
  });
  const shootOpacity = introProgress.interpolate({
    inputRange: [0.5, 0.62, 1],
    outputRange: [0, 1, 1],
    extrapolate: "clamp",
  });

  const idleScale = idlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <Animated.View
        style={[
          styles.rayGlow,
          { opacity: rayOpacity, transform: [{ scale: rayScale }] },
        ]}
      />

      <View style={styles.textContainer}>
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

        <Animated.Text
          style={[
            styles.titleText,
            styles.fullText,
            {
              opacity: fullTextOpacity,
              transform: [
                { scale: Animated.multiply(fullTextScale, idleScale) },
              ],
            },
          ]}
        >
          NextStep Mentorship
        </Animated.Text>
      </View>

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
        <View style={styles.stem} />
        <Ionicons name="leaf" size={44} color="#4ADE80" />
      </Animated.View>
    </Animated.View>
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
