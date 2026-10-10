import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { ca } from "../../../styles/(counselor)/appointmentsUi";
import { formatWhen } from "../../client/home/time";
import { clientNameOf, clientOf, initialsOf } from "../dashboard/sessionAction";

const STATUS = {
  completed: { label: "Attended", color: "#16A34A" },
  cancelled_by_client: { label: "Cancelled by client", color: "#EF4444" },
  cancelled_by_counselor: { label: "Cancelled", color: "#EF4444" },
  rescheduled_requested: { label: "Transferred", color: "#0284C7" },
  no_show: { label: "No show", color: "#EA580C" },
};

export default function HistoryCard({ session, index = 0, style }) {
  const meta = STATUS[session.status] || {
    label: session.status,
    color: "#64748B",
  };
  const name = clientNameOf(session);
  const client = clientOf(session);
  const counselorReview = session.reviews?.find(
    (r) => r.reviewer_role === "counselor",
  );
  const clientReview = session.reviews?.find(
    (r) => r.reviewer_role === "client",
  );

  const note = session.notes
    ? `Session notes: "${session.notes}"`
    : counselorReview?.counselor_notes
      ? `Clinical summary: "${counselorReview.counselor_notes}"`
      : session.action_reason
        ? `Reason: "${session.action_reason}"`
        : null;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 60)
        .duration(380)
        .springify()
        .damping(18)}
      layout={LinearTransition.duration(260)}
      style={[ca.card, style]}
    >
      <View style={[ca.accent, { backgroundColor: meta.color }]} />
      <View style={ca.top}>
        <View style={[ca.avatar, { backgroundColor: "#F1F5F9" }]}>
          <Text style={[ca.avatarText, { color: "#475569" }]}>
            {initialsOf(name)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ca.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={ca.sub} numberOfLines={1}>
            {session.counseling_type} ·{" "}
            {formatWhen(session.scheduled_start_time)}
          </Text>
        </View>
        <Text style={[ca.hStatus, { color: meta.color }]}>{meta.label}</Text>
      </View>

      {!!client?.county && (
        <View style={ca.chips}>
          <View style={ca.chip}>
            <Ionicons name="location-outline" size={12} color="#475569" />
            <Text style={ca.chipText}>{client.county}</Text>
          </View>
        </View>
      )}

      {!!note && <Text style={ca.note}>{note}</Text>}

      {!!clientReview?.feedback_text && (
        <Text style={[ca.note, { color: "#0369A1" }]}>
          Client feedback: "{clientReview.feedback_text}"
        </Text>
      )}
      {!!clientReview?.rating && (
        <View style={ca.stars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < clientReview.rating ? "star" : "star-outline"}
              size={13}
              color="#F59E0B"
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}
