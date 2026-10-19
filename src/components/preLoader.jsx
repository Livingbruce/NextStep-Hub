import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import AuroraBlobs from "./landing/AuroraBlobs";

const BG = "#090D16";
const LOGO_SIZE = 200;
const MIN_DISPLAY_MS = 2200;
const EXIT_MS = 400;

export default function Preloader({ onFinish, isReady = true }) {
  const { width, height } = useWindowDimensions();

  const [introDone, setIntroDone] = useState(false);
  const exit = useSharedValue(1);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const handleLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setIntroDone(true), MIN_DISPLAY_MS);
    return () => clearTimeout(id);
  }, []);

  // Leave only when the minimum time has passed AND the session is restored.
  useEffect(() => {
    if (!introDone || !isReady) return;
    exit.set(
      withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.cubic) }),
    );
    const id = setTimeout(() => onFinishRef.current?.(), EXIT_MS);
    return () => clearTimeout(id);
  }, [introDone, isReady, exit]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: exit.get() }));

  return (
    <Animated.View onLayout={handleLayout} style={[styles.root, rootStyle]}>
      <LinearGradient
        colors={["#090D16", "#1A1022", "#2A1410"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AuroraBlobs width={width} height={height} />

      <View style={styles.center} pointerEvents="none">
        <Image
          source={require("../../assets/images/logoimage-removebg.png")}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    overflow: "hidden",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
