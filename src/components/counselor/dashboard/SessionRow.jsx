import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { cd } from "../../../styles/(counselor)/dashboardUi";
import PressableScale from "../../client/appointments/PressableScale";
import { relativeLabel } from "../../client/home/time";
import {
  clientNameOf,
  clientOf,
  getAction,
  initialsOf,
  phoneOf,
} from "./sessionAction";

const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SessionRow({
  session,
  index = 0,
  now,
  onPrimary,
  onOpen,
}) {
  const name = clientNameOf(session);
  const action = getAction(session);
  const phone = session.session_mode === "phone";
  const county = clientOf(session)?.county;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 60)
        .duration(380)
        .springify()
        .damping(18)}
      layout={LinearTransition.duration(260)}
    >
      <PressableScale scaleTo={0.985} haptic onPress={onOpen} style={cd.row}>
        <View style={cd.rowTop}>
          <View style={cd.avatar}>
            <Text style={cd.avatarText}>{initialsOf(name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cd.rowName} numberOfLines={1}>
              {name}
            </Text>
            <Text style={cd.rowSub} numberOfLines={1}>
              {session.counseling_type} session ·{" "}
              {timeOf(session.scheduled_start_time)}
            </Text>
          </View>
          <View style={cd.timeChip}>
            <Text style={cd.timeChipText}>
              {relativeLabel(session.scheduled_start_time, now)}
            </Text>
          </View>
        </View>

        <View style={cd.chips}>
          <View style={cd.chip}>
            <Ionicons name="hourglass-outline" size={12} color="#475569" />
            <Text style={cd.chipText}>
              {session.duration_minutes || 50} min
            </Text>
          </View>
          <View style={cd.chip}>
            <Ionicons
              name={phone ? "call-outline" : "videocam-outline"}
              size={12}
              color="#475569"
            />
            <Text style={cd.chipText}>
              {phone ? `Call ${phoneOf(session) || "N/A"}` : "Online"}
            </Text>
          </View>
          {!!county && (
            <View style={cd.chip}>
              <Ionicons name="location-outline" size={12} color="#475569" />
              <Text style={cd.chipText}>{county}</Text>
            </View>
          )}
        </View>

        <PressableScale
          haptic
          style={[
            cd.rowBtn,
            {
              backgroundColor:
                action.kind === "link"
                  ? "#64748B"
                  : phone
                    ? "#16A34A"
                    : "#1E3A8A",
            },
          ]}
          onPress={onPrimary}
        >
          <Ionicons name={action.icon} size={17} color="#FFFFFF" />
          <Text style={cd.rowBtnText}>{action.label}</Text>
        </PressableScale>
      </PressableScale>
    </Animated.View>
  );
}
