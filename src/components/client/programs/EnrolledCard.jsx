import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { pg } from "../../../styles/(client)/programsUi";
import PressableScale from "../appointments/PressableScale";
import { formatWhen, relativeLabel } from "../home/time";

const LOCATION = {
  virtual: {
    icon: "videocam-outline",
    label: "Online",
    action: "Join meeting",
    actionIcon: "videocam",
    color: "#0284C7",
  },
  phone: {
    icon: "call-outline",
    label: "By phone",
    action: "Join call",
    actionIcon: "call",
    color: "#2563EB",
  },
  physical: {
    icon: "location-outline",
    label: "In person",
    action: "View venue",
    actionIcon: "location",
    color: "#475569",
  },
};

export default function EnrolledCard({
  program,
  status,
  past = false,
  index = 0,
  onOpen,
  onAction,
  style,
}) {
  const loc = LOCATION[program.location_type] || LOCATION.physical;
  const date = new Date(program.starts_at);
  const attended = status === "participated";
  const fee = program.is_paid
    ? `${program.currency || "KES"} ${Number(program.amount).toLocaleString()}`
    : "Free";

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 70)
        .duration(400)
        .springify()
        .damping(18)}
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(260)}
      style={style}
    >
      <PressableScale
        scaleTo={0.985}
        haptic
        onPress={onOpen}
        accessibilityLabel={`${program.title}, ${loc.label}`}
        style={[pg.card, past && pg.cardPast]}
      >
        {!!program.poster_url && (
          <Image
            source={{ uri: program.poster_url }}
            style={pg.poster}
            resizeMode="cover"
          />
        )}

        <View style={pg.cardBody}>
          <View style={pg.cardHead}>
            <View style={pg.dateBlock}>
              <Text style={pg.dateDay}>{date.getDate()}</Text>
              <Text style={pg.dateMonth}>
                {date.toLocaleString("en-US", { month: "short" }).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={pg.badge}>
                <Text style={pg.badgeText} numberOfLines={1}>
                  {program.category || "Program"}
                </Text>
              </View>
              <Text style={pg.cardTitle} numberOfLines={2}>
                {program.title}
              </Text>
            </View>
          </View>

          {!!program.description && (
            <Text style={pg.cardDesc} numberOfLines={2}>
              {program.description}
            </Text>
          )}

          <View style={pg.metaWrap}>
            <View style={pg.pill}>
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text style={pg.pillText}>{formatWhen(program.starts_at)}</Text>
            </View>
            <View style={pg.pill}>
              <Ionicons name={loc.icon} size={13} color="#64748B" />
              <Text style={pg.pillText}>{loc.label}</Text>
            </View>
            <View
              style={[pg.pill, program.is_paid ? pg.pillPaid : pg.pillFree]}
            >
              <Text
                style={[
                  pg.pillText,
                  {
                    color: program.is_paid ? "#B45309" : "#15803D",
                    fontWeight: "800",
                  },
                ]}
              >
                {fee}
              </Text>
            </View>
          </View>

          <View style={pg.cardFoot}>
            {past ? (
              <View style={[pg.statusChip, attended && pg.statusChipOk]}>
                <Text style={[pg.statusText, attended && pg.statusTextOk]}>
                  {attended ? "Attended" : "Ended"}
                </Text>
              </View>
            ) : (
              <View style={pg.whenChip}>
                <Text style={pg.whenText}>
                  {relativeLabel(program.starts_at, Date.now())}
                </Text>
              </View>
            )}

            {!past && (
              <PressableScale
                haptic
                containerStyle={{ flexShrink: 1 }}
                style={[pg.action, { backgroundColor: loc.color }]}
                onPress={() =>
                  onAction(program.location_type, program.location_details)
                }
              >
                <Ionicons name={loc.actionIcon} size={15} color="#FFFFFF" />
                <Text style={pg.actionText} numberOfLines={1}>
                  {program.location_type === "physical" &&
                  program.location_details
                    ? `Venue: ${program.location_details}`
                    : loc.action}
                </Text>
              </PressableScale>
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}
