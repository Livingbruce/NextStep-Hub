import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { cc } from "../../../styles/(counselor)/callCenter";
import { joinState } from "../../call/callWindow";
import PressableScale from "../../client/appointments/PressableScale";
import { relativeLabel } from "../../client/home/time";
import { clientNameOf, clientOf } from "./sessionAction";

const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

export default function QueueRow({ session, index = 0, now, onStart, onOpen }) {
  const win = joinState(session, now);
  const open = win.state === "open";
  const phone = session.session_mode === "phone";
  const county = clientOf(session)?.county;
  const lineColor = open
    ? "#16A34A"
    : win.state === "payment"
      ? "#F59E0B"
      : "#CBD5E1";

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 60)
        .duration(380)
        .springify()
        .damping(18)}
      layout={LinearTransition.duration(260)}
    >
      <PressableScale scaleTo={0.985} onPress={onOpen} style={cc.qRow}>
        <View style={cc.qTime}>
          <Text style={cc.qTimeText}>
            {timeOf(session.scheduled_start_time)}
          </Text>
          <Text style={cc.qDur}>{session.duration_minutes || 50} min</Text>
        </View>
        <View style={[cc.qLine, { backgroundColor: lineColor }]} />
        <View style={cc.qBody}>
          <Text style={cc.qName} numberOfLines={1}>
            {clientNameOf(session)}
          </Text>
          <Text style={cc.qSub} numberOfLines={1}>
            {session.counseling_type} ·{" "}
            {relativeLabel(session.scheduled_start_time, now)}
          </Text>
          <View style={cc.qBadges}>
            <View style={cc.qBadge}>
              <Ionicons
                name={phone ? "call-outline" : "videocam-outline"}
                size={11}
                color="#475569"
              />
              <Text style={cc.qBadgeText}>{phone ? "Phone" : "Video"}</Text>
            </View>
            {!!county && (
              <View style={cc.qBadge}>
                <Ionicons name="location-outline" size={11} color="#475569" />
                <Text style={cc.qBadgeText}>{county}</Text>
              </View>
            )}
          </View>
        </View>
        <PressableScale
          haptic
          disabled={!open}
          style={[
            cc.qBtn,
            open
              ? { backgroundColor: phone ? "#16A34A" : "#1E3A8A" }
              : cc.qBtnOff,
          ]}
          onPress={onStart}
          accessibilityLabel={open ? "Start session" : win.label}
        >
          <Ionicons
            name={open ? (phone ? "call" : "videocam") : "lock-closed-outline"}
            size={19}
            color={open ? "#FFFFFF" : "#94A3B8"}
          />
        </PressableScale>
      </PressableScale>
    </Animated.View>
  );
}
