import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { cp } from "../../../styles/(counselor)/programsUi";
import PressableScale from "../../client/appointments/PressableScale";
import { formatWhen, relativeLabel } from "../../client/home/time";

export const LOCATION_TYPES = [
  {
    value: "physical",
    label: "Physical",
    icon: "location-outline",
    placeholder: "Venue / address",
  },
  {
    value: "virtual",
    label: "Virtual",
    icon: "videocam-outline",
    placeholder: "Meeting link (Google Meet, Zoom...)",
  },
  {
    value: "phone",
    label: "Via Phone",
    icon: "call-outline",
    placeholder: "Phone number or dial-in details",
  },
];

export default function CounselorProgramCard({
  program,
  index = 0,
  past = false,
  onEdit,
  onDelete,
  onViewParticipants,
  style,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const date = new Date(program.startsAt);
  const loc = LOCATION_TYPES.find((l) => l.value === program.locationType);
  const attended = program.participants.filter(
    (p) => p.status === "Participated",
  ).length;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 70)
        .duration(400)
        .springify()
        .damping(18)}
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(260)}
      style={[cp.card, past && cp.cardPast, style]}
    >
      {!!program.posterUrl && (
        <PressableScale
          onPress={(e) => {
            e.stopPropagation?.();
            setModalVisible(true);
          }}
        >
          <Image
            source={{ uri: program.posterUrl }}
            style={cp.poster}
            resizeMode="cover"
          />
        </PressableScale>
      )}

      <View style={cp.body}>
        <View style={cp.head}>
          <View style={cp.dateBlock}>
            <Text style={cp.dateDay}>{date.getDate()}</Text>
            <Text style={cp.dateMonth}>
              {date.toLocaleString("en-US", { month: "short" }).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={cp.badge}>
              <Text style={cp.badgeText} numberOfLines={1}>
                {program.category}
              </Text>
            </View>
            <Text style={cp.cardTitle} numberOfLines={2}>
              {program.title}
            </Text>
          </View>
        </View>

        {!!program.description && (
          <Text style={cp.desc} numberOfLines={2}>
            {program.description}
          </Text>
        )}

        <View style={cp.meta}>
          <View style={cp.pill}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={cp.pillText}>
              {past
                ? formatWhen(program.startsAt)
                : `${formatWhen(program.startsAt)} · ${relativeLabel(program.startsAt, Date.now())}`}
            </Text>
          </View>
          <View style={cp.pill}>
            <Ionicons name={loc?.icon} size={13} color="#64748B" />
            <Text style={cp.pillText} numberOfLines={1}>
              {loc?.label}: {program.locationDetails}
            </Text>
          </View>
          <View style={[cp.pill, program.isPaid ? cp.pillPaid : cp.pillFree]}>
            <Text
              style={[
                cp.pillText,
                {
                  color: program.isPaid ? "#B45309" : "#15803D",
                  fontWeight: "800",
                },
              ]}
            >
              {program.isPaid
                ? `${program.currency} ${Number(program.amount).toLocaleString()}`
                : "Free"}
            </Text>
          </View>
          {program.moderators.length > 0 && (
            <View style={cp.pill}>
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color="#64748B"
              />
              <Text style={cp.pillText}>
                {program.moderators.length}{" "}
                {program.moderators.length === 1 ? "moderator" : "moderators"}
              </Text>
            </View>
          )}
        </View>

        <View style={cp.foot}>
          <PressableScale
            haptic
            containerStyle={{ flex: 1 }}
            style={cp.viewBtn}
            onPress={onViewParticipants}
          >
            <Ionicons name="people-outline" size={16} color="#FFFFFF" />
            <Text style={cp.viewText} numberOfLines={1}>
              {past
                ? `Participants (${attended}/${program.participants.length})`
                : `Participants (${program.participants.length})`}
            </Text>
          </PressableScale>
          <PressableScale
            haptic
            style={cp.iconBtn}
            onPress={onEdit}
            accessibilityLabel="Edit program"
          >
            <Ionicons name="pencil-outline" size={18} color="#0284C7" />
          </PressableScale>
          <PressableScale
            haptic
            style={cp.iconBtn}
            onPress={onDelete}
            accessibilityLabel="Delete program"
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </PressableScale>
        </View>
      </View>

      {/* Full Screen Poster Preview Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PressableScale
            onPress={() => setModalVisible(false)}
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </PressableScale>

          <Image
            source={{ uri: program.posterUrl }}
            style={{
              width: "100%",
              height: "85%",
            }}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </Animated.View>
  );
}
