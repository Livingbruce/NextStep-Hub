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
import Timetable from "./Timetable";
import { fmtTimeOnly, getSlots } from "./schedule";

export const LOCATION_TYPES = [
  {
    value: "physical",
    label: "Physical",
    icon: "location-outline",
    placeholder: "Venue / address",
  },
  {
    value: "virtual",
    label: "Online meeting",
    icon: "link-outline",
    placeholder: "Meeting link (Zoom, Google Meet, etc.)",
  },
  {
    value: "in_app_video",
    label: "In-app video",
    icon: "videocam-outline",
    placeholder: "",
  },
  {
    value: "in_app_audio",
    label: "In-app audio",
    icon: "call-outline",
    placeholder: "",
  },
];

export default function CounselorProgramCard({
  program,
  index = 0,
  past = false,
  onEdit,
  onDelete,
  onViewParticipants,
  onGoLive,
  style,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const [showTable, setShowTable] = useState(false);
  const multiDay = (program.totalDays || 1) > 1;
  const slots = getSlots(program);

  const date = new Date(program.startsAt);
  const loc = LOCATION_TYPES.find((l) => l.value === program.locationType);
  const attended = program.participants.filter(
    (p) => p.status === "Participated",
  ).length;

  const inApp = ["in_app_video", "in_app_audio"].includes(program.locationType);

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
        <PressableScale onPress={() => setModalVisible(true)}>
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

          {multiDay && (
            <View
              style={[
                cp.pill,
                { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
              ]}
            >
              <Ionicons name="layers-outline" size={13} color="#1E3A8A" />
              <Text
                style={[cp.pillText, { color: "#1E3A8A", fontWeight: "800" }]}
              >
                {program.totalDays} days
              </Text>
            </View>
          )}

          <View style={cp.pill}>
            <Ionicons
              name={loc?.icon || "location-outline"}
              size={13}
              color="#64748B"
            />
            <Text style={cp.pillText} numberOfLines={1}>
              {loc?.label || "Physical"}
              {program.locationDetails ? `: ${program.locationDetails}` : ""}
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
                {program.moderators.length} moderator(s)
              </Text>
            </View>
          )}
        </View>

        {multiDay && (
          <>
            <PressableScale
              onPress={() => setShowTable((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 12,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "800", color: "#2563EB" }}
              >
                {showTable
                  ? "Hide timetable"
                  : `View timetable (${fmtTimeOnly(slots[0].start)} – ${fmtTimeOnly(slots[0].end)})`}
              </Text>
              <Ionicons
                name={showTable ? "chevron-up" : "chevron-down"}
                size={14}
                color="#2563EB"
              />
            </PressableScale>
            {showTable && <Timetable program={program} />}
          </>
        )}

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

          {!past && inApp && (
            <PressableScale
              haptic
              style={[
                cp.iconBtn,
                { backgroundColor: "#DCFCE7", paddingHorizontal: 12 },
              ]}
              onPress={onGoLive}
              accessibilityLabel="Start or rejoin in-app session"
            >
              <Ionicons
                name={
                  program.locationType === "in_app_video" ? "videocam" : "call"
                }
                size={18}
                color="#15803D"
              />
              <Text
                style={{ color: "#15803D", fontWeight: "800", fontSize: 12 }}
              >
                {program.locationType === "in_app_video"
                  ? "Go live"
                  : "Start call"}
              </Text>
            </PressableScale>
          )}

          <PressableScale haptic style={cp.iconBtn} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={18} color="#0284C7" />
          </PressableScale>

          <PressableScale haptic style={cp.iconBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </PressableScale>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.92)",
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
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </PressableScale>

          <Image
            source={{ uri: program.posterUrl }}
            style={{ width: "100%", height: "85%" }}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </Animated.View>
  );
}
