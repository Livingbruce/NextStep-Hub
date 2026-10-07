import { useEffect } from "react";
import { View } from "react-native";
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { pg } from "../../../styles/(client)/programsUi";
import { Box } from "../appointments/AppointmentSkeleton";

export default function ProgramsSkeleton({
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
      accessibilityLabel="Loading programs"
      style={{ flexDirection: "row", flexWrap: "wrap", gap }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[pg.card, { width: itemWidth }]}>
          <View style={pg.cardBody}>
            <View style={pg.cardHead}>
              <Box progress={progress} width={50} height={54} radius={14} />
              <View style={{ flex: 1, gap: 8 }}>
                <Box progress={progress} width={70} height={18} radius={9} />
                <Box progress={progress} width="75%" height={16} />
              </View>
            </View>
            <View style={{ gap: 8, marginTop: 14 }}>
              <Box progress={progress} height={12} />
              <Box progress={progress} width="60%" height={12} />
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              <Box progress={progress} width={90} height={24} radius={10} />
              <Box progress={progress} width={64} height={24} radius={10} />
            </View>
            <Box
              progress={progress}
              width={120}
              height={36}
              radius={12}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
