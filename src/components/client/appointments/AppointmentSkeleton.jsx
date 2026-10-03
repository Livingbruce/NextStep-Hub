import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/appointments/index";

// One block with a light sweep passing across it. All blocks share the same
// `progress` value, so the whole skeleton shimmers in sync.
export function Box({
  progress,
  width = "100%",
  height = 12,
  radius = 6,
  style,
}) {
  const [w, setW] = useState(0);
  const sweep = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.get(), [0, 1], [-w, w * 1.2]) },
    ],
  }));

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: "#E8EDF3",
          overflow: "hidden",
        },
        style,
      ]}
    >
      {w > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: "absolute", top: 0, bottom: 0, width: w * 0.6 },
            sweep,
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.75)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

function SkeletonCard({ progress, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <View style={styles.counselorInfo}>
          <Box progress={progress} width={40} height={40} radius={20} />
          <View style={{ flex: 1, gap: 8 }}>
            <Box progress={progress} width="62%" height={14} />
            <Box progress={progress} width="38%" height={11} />
          </View>
        </View>
        <Box progress={progress} width={74} height={24} radius={12} />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <Box progress={progress} width={92} height={13} />
        <Box progress={progress} width={64} height={13} />
      </View>
    </View>
  );
}

export default function AppointmentSkeletonList({
  count = 3,
  itemWidth = "100%",
  gap = 16,
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.set(
      withRepeat(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [reduceMotion, progress]);

  return (
    <View
      accessibilityLabel="Loading appointments"
      style={{ flexDirection: "row", flexWrap: "wrap", gap }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard
          key={i}
          progress={progress}
          style={{ width: itemWidth }}
        />
      ))}
    </View>
  );
}
