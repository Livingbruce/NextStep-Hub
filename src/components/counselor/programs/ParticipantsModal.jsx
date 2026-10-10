import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
  ZoomIn,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { cp } from "../../../styles/(counselor)/programsUi";
import PressableScale from "../../client/appointments/PressableScale";
import { initialsOf } from "../dashboard/sessionAction";

function Person({ p, index, onMark, onRemove }) {
  const [open, setOpen] = useState(false);
  const attended = p.status === "Participated";

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 60)
        .duration(380)
        .springify()
        .damping(18)}
      layout={LinearTransition.duration(260)}
      style={cp.person}
    >
      <PressableScale scaleTo={0.985} onPress={() => setOpen((v) => !v)}>
        <View style={cp.personTop}>
          <View style={cp.avatar}>
            <Text style={cp.avatarText}>{initialsOf(p.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cp.personName} numberOfLines={1}>
              {p.name}
            </Text>
            <Text style={[cp.status, attended && cp.statusOk]}>{p.status}</Text>
          </View>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={20}
            color="#64748B"
          />
        </View>
      </PressableScale>

      {open && (
        <Animated.View entering={FadeIn.duration(220)} style={cp.details}>
          <View style={cp.detailRow}>
            <Ionicons name="mail-outline" size={15} color="#64748B" />
            <Text style={cp.detailText}>{p.email}</Text>
          </View>
          <View style={cp.detailRow}>
            <Ionicons name="call-outline" size={15} color="#64748B" />
            <Text style={cp.detailText}>{p.phone}</Text>
          </View>
          <View style={cp.detailRow}>
            <Ionicons name="location-outline" size={15} color="#64748B" />
            <Text style={cp.detailText}>County: {p.county}</Text>
          </View>
        </Animated.View>
      )}

      <View style={cp.pActions}>
        <PressableScale
          haptic
          disabled={attended}
          containerStyle={{ flex: 1 }}
          style={[
            cp.pBtn,
            { backgroundColor: attended ? "#F1F5F9" : "#DCFCE7" },
          ]}
          onPress={() => onMark(p.id)}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={attended ? "#94A3B8" : "#15803D"}
          />
          <Text
            style={[cp.pBtnText, { color: attended ? "#94A3B8" : "#15803D" }]}
          >
            {attended ? "Attended" : "Mark participated"}
          </Text>
        </PressableScale>
        <PressableScale
          haptic
          containerStyle={{ flex: 1 }}
          style={[cp.pBtn, { backgroundColor: "#FEE2E2" }]}
          onPress={() => onRemove(p.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#B91C1C" />
          <Text style={[cp.pBtnText, { color: "#B91C1C" }]}>Remove</Text>
        </PressableScale>
      </View>
    </Animated.View>
  );
}

export default function ParticipantsModal({
  program,
  visible,
  onClose,
  onMark,
  onRemove,
}) {
  const list = program?.participants || [];
  const attended = list.filter((p) => p.status === "Participated").length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={cp.full}>
        <View style={cp.mHeader}>
          <PressableScale
            haptic
            style={cp.iconBtn}
            onPress={onClose}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color="#0F172A" />
          </PressableScale>
          <View style={{ flex: 1 }}>
            <Text style={cp.mTitle} numberOfLines={1}>
              {program?.title}
            </Text>
            <Text style={cp.mSub}>Registered participants</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={cp.mList}
          showsVerticalScrollIndicator={false}
        >
          <View style={cp.mMax}>
            <View style={cp.summary}>
              <View style={cp.sumBox}>
                <Text style={cp.sumNum}>{list.length}</Text>
                <Text style={cp.sumLabel}>Registered</Text>
              </View>
              <View style={cp.sumBox}>
                <Text style={[cp.sumNum, { color: "#16A34A" }]}>
                  {attended}
                </Text>
                <Text style={cp.sumLabel}>Participated</Text>
              </View>
            </View>

            {list.length === 0 ? (
              <View style={cp.empty}>
                <Animated.View
                  entering={ZoomIn.duration(400).springify().damping(12)}
                  style={cp.emptyCircle}
                >
                  <Ionicons name="people-outline" size={40} color="#1E3A8A" />
                </Animated.View>
                <Text style={cp.emptyTitle}>No participants yet</Text>
                <Text style={cp.emptyText}>
                  Clients who register for this program will appear here.
                </Text>
              </View>
            ) : (
              list.map((p, i) => (
                <Person
                  key={p.id}
                  p={p}
                  index={i}
                  onMark={onMark}
                  onRemove={onRemove}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
