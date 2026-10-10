import { useEffect } from "react";
import { View } from "react-native";
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ca } from "../../../styles/(counselor)/appointmentsUi";
import { Box } from "../../client/appointments/AppointmentSkeleton";

export default function AppointmentsSkeleton({
  count = 3,
  itemWidth = "100%",
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
      style={[ca.grid, { gap: 16 }]}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[ca.card, { width: itemWidth }]}>
          <View style={ca.top}>
            <Box progress={progress} width={44} height={44} radius={22} />
            <View style={{ flex: 1, gap: 8 }}>
              <Box progress={progress} width="55%" height={15} />
              <Box progress={progress} width="35%" height={11} />
            </View>
            <Box progress={progress} width={64} height={22} radius={10} />
          </View>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
            <Box progress={progress} width={60} height={22} radius={8} />
            <Box progress={progress} width={70} height={22} radius={8} />
            <Box progress={progress} width={80} height={22} radius={8} />
          </View>
          <Box
            progress={progress}
            width={170}
            height={13}
            style={{ marginTop: 16 }}
          />
          <Box
            progress={progress}
            height={44}
            radius={14}
            style={{ marginTop: 14 }}
          />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            <Box progress={progress} width={84} height={34} radius={12} />
            <Box progress={progress} width={84} height={34} radius={12} />
            <Box progress={progress} width={84} height={34} radius={12} />
          </View>
        </View>
      ))}
    </View>
  );
}
