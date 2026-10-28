import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useCall, useCallTimer } from "../../../context/CallContext";
import { cc } from "../../../styles/(counselor)/callCenter";
import PressableScale from "../../client/appointments/PressableScale";

export default function LiveCallBanner() {
  const { session, status, startedAt, expand } = useCall();
  const timer = useCallTimer(startedAt);
  if (!session) return null;
  const live = status === "live";
  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <PressableScale haptic onPress={expand}>
        <LinearGradient
          colors={["#DC2626", "#B91C1C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cc.live}
        >
          <View style={cc.liveIcon}>
            <Ionicons name="radio" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cc.liveTitle}>
              {live ? "Session in progress" : "Waiting for client"}
            </Text>
            <Text style={cc.liveSub} numberOfLines={1}>
              {session.peerName} · {live ? timer : "not joined yet"}
            </Text>
          </View>
          <View style={cc.liveBtn}>
            <Text style={cc.liveBtnText}>Return</Text>
          </View>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}
