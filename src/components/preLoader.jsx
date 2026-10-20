import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const BG = "#090D16";
const LOGO = require("../../assets/images/logoimage-removebg.png");
const LOGO_WIDTH = 220;
const { width: srcW, height: srcH } = Image.resolveAssetSource(LOGO);
const LOGO_HEIGHT = LOGO_WIDTH * (srcH / srcW);

const MIN_SPLASH_MS = 350;
const EXIT_MS = 250;

export default function Preloader({ onFinish, isReady = false }) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const exit = useSharedValue(1);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const handleLogoLoad = useCallback(() => {
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
    <Animated.View style={[styles.root, rootStyle]} pointerEvents="none">
      <View style={styles.center}>
        <Image
          source={LOGO}
          onLoad={handleLogoLoad}
          style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
