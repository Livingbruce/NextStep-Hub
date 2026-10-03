import { useEffect } from "react";
import { View } from "react-native";
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/Profile";
import { Box } from "../appointments/AppointmentSkeleton";

function FieldRows({ progress, rows }) {
  return Array.from({ length: rows }).map((_, i) => (
    <View key={i} style={{ marginBottom: 16, gap: 8 }}>
      <Box progress={progress} width={80} height={11} />
      <Box progress={progress} width="60%" height={15} />
    </View>
  ));
}

export default function ProfileSkeleton({ columns = 1, itemWidth = "100%" }) {
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

  const card = (rows, key) => (
    <View key={key} style={[styles.sectionCard, { width: itemWidth }]}>
      <Box
        progress={progress}
        width={120}
        height={15}
        style={{ marginBottom: 18 }}
      />
      <FieldRows progress={progress} rows={rows} />
    </View>
  );

  return (
    <View accessibilityLabel="Loading profile">
      <View style={{ alignItems: "center", marginBottom: 24, gap: 10 }}>
        <Box progress={progress} width={100} height={100} radius={50} />
        <Box progress={progress} width={160} height={18} />
        <Box progress={progress} width={90} height={12} />
      </View>

      <Box
        progress={progress}
        height={64}
        radius={16}
        style={{ marginBottom: 16 }}
      />

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {card(2, "a")}
        {card(4, "b")}
        {columns === 1 && card(2, "c")}
      </View>
    </View>
  );
}
