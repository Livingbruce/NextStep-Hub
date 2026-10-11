import { useEffect } from "react";
import { View } from "react-native";
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { pf } from "../../../styles/(counselor)/profileUi";
import { Box } from "../../client/appointments/AppointmentSkeleton";

export default function ProfileSkeleton({ twoCol = false }) {
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
    <View key={key} style={pf.card}>
      <Box
        progress={progress}
        width={130}
        height={15}
        style={{ marginBottom: 18 }}
      />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ marginBottom: 16, gap: 8 }}>
          <Box progress={progress} width={80} height={11} />
          <Box progress={progress} width="60%" height={15} />
        </View>
      ))}
    </View>
  );

  const left = (
    <View style={twoCol ? pf.column : { gap: 16 }}>
      {card(3, "a")}
      {card(4, "b")}
    </View>
  );
  const right = (
    <View style={twoCol ? pf.column : { gap: 16, marginTop: 16 }}>
      {card(2, "c")}
      {card(2, "d")}
    </View>
  );

  return (
    <View accessibilityLabel="Loading profile">
      <View style={{ alignItems: "center", marginBottom: 20, gap: 10 }}>
        <Box progress={progress} width={104} height={104} radius={52} />
        <Box progress={progress} width={170} height={18} />
        <Box progress={progress} width={100} height={12} />
      </View>
      <Box
        progress={progress}
        height={64}
        radius={16}
        style={{ marginBottom: 16 }}
      />
      {twoCol ? (
        <View style={pf.columns}>
          {left}
          {right}
        </View>
      ) : (
        <>
          {left}
          {right}
        </>
      )}
    </View>
  );
}
