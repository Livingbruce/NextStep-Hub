import { useEffect } from "react";
import { View } from "react-native";
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cd } from "../../../styles/(counselor)/dashboardUi";
import { Box } from "../../client/appointments/AppointmentSkeleton";

export default function CounselorSkeleton({ twoCol = false }) {
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

  const sessionCard = (i) => (
    <View key={i} style={cd.row}>
      <View style={cd.rowTop}>
        <Box progress={progress} width={42} height={42} radius={21} />
        <View style={{ flex: 1, gap: 8 }}>
          <Box progress={progress} width="55%" height={14} />
          <Box progress={progress} width="35%" height={11} />
        </View>
        <Box progress={progress} width={64} height={22} radius={10} />
      </View>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 12 }}>
        <Box progress={progress} width={62} height={22} radius={8} />
        <Box progress={progress} width={72} height={22} radius={8} />
      </View>
      <Box
        progress={progress}
        height={42}
        radius={12}
        style={{ marginTop: 12 }}
      />
    </View>
  );

  const reviewCard = (i) => (
    <View key={i} style={cd.review}>
      <View style={cd.reviewTop}>
        <Box progress={progress} width={36} height={36} radius={18} />
        <View style={{ flex: 1, gap: 8 }}>
          <Box progress={progress} width="45%" height={13} />
          <Box progress={progress} width={80} height={11} />
        </View>
      </View>
      <View style={{ gap: 8, marginTop: 12 }}>
        <Box progress={progress} height={11} />
        <Box progress={progress} width="70%" height={11} />
      </View>
    </View>
  );

  const main = (
    <View style={twoCol ? cd.colMain : undefined}>
      <Box progress={progress} height={190} radius={24} />
      <Box
        progress={progress}
        width={160}
        height={18}
        style={{ marginTop: 24, marginBottom: 14 }}
      />
      {[0, 1].map(sessionCard)}
    </View>
  );
  const side = (
    <View style={twoCol ? cd.colSide : undefined}>
      <Box
        progress={progress}
        width={140}
        height={18}
        style={{ marginTop: twoCol ? 0 : 12, marginBottom: 14 }}
      />
      {[0, 1].map(reviewCard)}
    </View>
  );

  return (
    <View accessibilityLabel="Loading dashboard">
      <View style={cd.stats}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={cd.stat}>
            <Box
              progress={progress}
              width={30}
              height={30}
              radius={10}
              style={{ marginBottom: 8 }}
            />
            <Box progress={progress} width={36} height={20} />
            <Box
              progress={progress}
              width={56}
              height={11}
              style={{ marginTop: 6 }}
            />
          </View>
        ))}
      </View>
      {twoCol ? (
        <View style={cd.twoCol}>
          {main}
          {side}
        </View>
      ) : (
        <>
          {main}
          {side}
        </>
      )}
    </View>
  );
}
