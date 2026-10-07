import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { cd } from "../../../styles/(counselor)/dashboardUi";
import PressableScale from "../../client/appointments/PressableScale";
import { initialsOf } from "./sessionAction";

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

export default function ReviewCard({ review, index = 0, expanded, onToggle }) {
  const appt = Array.isArray(review.appointment)
    ? review.appointment[0]
    : review.appointment;
  const c = Array.isArray(appt?.client) ? appt.client[0] : appt?.client;
  const name = c
    ? `${c.first_name || ""} ${c.surname || ""}`.trim()
    : "Anonymous client";

  const rot = useSharedValue(0);
  useEffect(() => {
    rot.set(withTiming(expanded ? 1 : 0, { duration: 220 }));
  }, [expanded, rot]);
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.get() * 180}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 60)
        .duration(380)
        .springify()
        .damping(18)}
      layout={LinearTransition.duration(260)}
    >
      <PressableScale
        scaleTo={0.985}
        haptic
        onPress={onToggle}
        style={cd.review}
      >
        <View style={cd.reviewTop}>
          <View
            style={[cd.avatar, { width: 36, height: 36, borderRadius: 18 }]}
          >
            <Text style={[cd.avatarText, { fontSize: 12 }]}>
              {initialsOf(name)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cd.reviewName} numberOfLines={1}>
              {name}
            </Text>
            {!!review.rating && (
              <View style={cd.stars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < review.rating ? "star" : "star-outline"}
                    size={13}
                    color="#F59E0B"
                  />
                ))}
              </View>
            )}
          </View>
          <Animated.View style={chevron}>
            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
          </Animated.View>
        </View>

        <Text style={cd.reviewText} numberOfLines={expanded ? undefined : 2}>
          "{review.feedback_text || "No written review provided."}"
        </Text>

        {expanded && (
          <Animated.View
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(120)}
            style={cd.reviewDrawer}
          >
            <View style={cd.detailRow}>
              <Ionicons name="pricetag-outline" size={14} color="#64748B" />
              <Text style={cd.detailText}>
                {appt?.counseling_type || "General"} session
              </Text>
            </View>
            <View style={cd.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={cd.detailText}>
                {fmt(appt?.scheduled_start_time)}
              </Text>
            </View>
            {!!c?.county && (
              <View style={cd.detailRow}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={cd.detailText}>{c.county} County</Text>
              </View>
            )}
          </Animated.View>
        )}
      </PressableScale>
    </Animated.View>
  );
}
