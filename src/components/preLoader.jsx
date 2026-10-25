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
const LOGO = require("../../assets/images/logoimage-removebg.png");
const LOGO_WIDTH = 220;
const { width: srcW, height: srcH } = Image.resolveAssetSource(LOGO);
const LOGO_HEIGHT = LOGO_WIDTH * (srcH / srcW);

const MIN_SPLASH_MS = 350;
const EXIT_MS = 250;

export default function Preloader({ onFinish, isReady = false }) {
  const { width, height } = useWindowDimensions();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const exit = useSharedValue(1);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const handleLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!minTimeElapsed || !isReady) return;

    exit.set(
      withTiming(0, { duration: EXIT_MS, easing: Easing.out(Easing.cubic) }),
    );
    const id = setTimeout(() => {
      onFinishRef.current?.();
    }, EXIT_MS);
    return () => clearTimeout(id);
  }, [minTimeElapsed, isReady, exit]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: exit.get(),
  }));

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[styles.root, rootStyle]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={["#090D16", "#1A1022", "#2A1410"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.blobsContainer} pointerEvents="none">
        <AuroraBlobs width={width} height={height} />
      </View>

      <View style={styles.logoContainer} pointerEvents="none">
        <Image
          source={LOGO}
          style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BG,
    zIndex: 9999,
    elevation: 100,
    overflow: "hidden",
  },
  blobsContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
