import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ca } from "../../../styles/(counselor)/appointmentsUi";
import PressableScale from "../../client/appointments/PressableScale";
import { formatWhen, relativeLabel } from "../../client/home/time";
import {
  clientNameOf,
  clientOf,
  initialsOf,
  phoneOf,
} from "../dashboard/sessionAction";

const ACTIONS = [
  {
    type: "attended",
    label: "Attended",
    icon: "checkmark-circle",
    bg: "#DCFCE7",
    fg: "#15803D",
  },
  {
    type: "noshow",
    label: "No show",
    icon: "eye-off",
    bg: "#FFEDD5",
    fg: "#C2410C",
  },
  {
    type: "postpone",
    label: "Postpone",
    icon: "time",
    bg: "#FEF3C7",
    fg: "#B45309",
  },
  {
    type: "transfer",
    label: "Transfer",
    icon: "swap-horizontal",
    bg: "#E0F2FE",
    fg: "#0369A1",
  },
  {
    type: "cancel",
    label: "Cancel",
    icon: "close-circle",
    bg: "#FEE2E2",
    fg: "#B91C1C",
  },
];

function Row({ icon, label, children }) {
  return (
    <View style={ca.intakeRow}>
      <Ionicons
        name={icon}
        size={14}
        color="#64748B"
        style={{ marginTop: 2 }}
      />
      <Text style={ca.intakeValue}>
        <Text style={ca.intakeLabel}>{label} </Text>
        {children}
      </Text>
    </View>
  );
}

export default function ActiveSessionCard({
  session,
  index = 0,
  now,
  expanded,
  onToggle,
  onSaveLink,
  onJoin,
  onCall,
  onAction,
  savingLink,
  style,
}) {
  const client = clientOf(session);
  const name = clientNameOf(session);
  const phoneMode = session.session_mode === "phone";
  const isLate = new Date(session.scheduled_start_time).getTime() < now;
  const [draft, setDraft] = useState(session.session_link || "");
  const dirty = draft.trim() !== (session.session_link || "").trim();

  useEffect(() => {
    setDraft(session.session_link || "");
  }, [session.session_link]);

  const rot = useSharedValue(0);
  useEffect(() => {
    rot.set(withTiming(expanded ? 1 : 0, { duration: 220 }));
  }, [expanded, rot]);
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.get() * 180}deg` }],
  }));

  const callNumber = phoneOf(session);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 70)
        .duration(400)
        .springify()
        .damping(18)}
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(260)}
      style={[ca.card, isLate && ca.cardLate, style]}
    >
      <View
        style={[ca.accent, { backgroundColor: isLate ? "#F59E0B" : "#1E3A8A" }]}
      />

      <View style={ca.top}>
        <View style={ca.avatar}>
          <Text style={ca.avatarText}>{initialsOf(name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ca.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={ca.sub} numberOfLines={1}>
            {session.counseling_type} session ·{" "}
            {formatWhen(session.scheduled_start_time)}
          </Text>
        </View>
        <View style={[ca.whenChip, isLate && ca.whenChipLate]}>
          <Text style={[ca.whenText, isLate && ca.whenTextLate]}>
            {isLate
              ? "Action needed"
              : relativeLabel(session.scheduled_start_time, now)}
          </Text>
        </View>
      </View>

      <View style={ca.chips}>
        <View style={ca.chip}>
          <Ionicons name="hourglass-outline" size={12} color="#475569" />
          <Text style={ca.chipText}>{session.duration_minutes || 50} min</Text>
        </View>
        <View style={ca.chip}>
          <Ionicons
            name={phoneMode ? "call-outline" : "videocam-outline"}
            size={12}
            color="#475569"
          />
          <Text style={ca.chipText}>{phoneMode ? "Phone" : "Online"}</Text>
        </View>
        {!!client?.county && (
          <View style={ca.chip}>
            <Ionicons name="location-outline" size={12} color="#475569" />
            <Text style={ca.chipText}>{client.county}</Text>
          </View>
        )}
        {!!client?.phone_no && (
          <View style={ca.chip}>
            <Ionicons name="call-outline" size={12} color="#475569" />
            <Text style={ca.chipText}>{client.phone_no}</Text>
          </View>
        )}
      </View>

      <PressableScale scaleTo={0.97} onPress={onToggle} style={ca.toggle}>
        <Text style={ca.toggleText}>
          {expanded ? "Hide intake details" : "View client & intake details"}
        </Text>
        <Animated.View style={chevron}>
          <Ionicons name="chevron-down" size={14} color="#2563EB" />
        </Animated.View>
      </PressableScale>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(240)}
          exiting={FadeOut.duration(120)}
          style={ca.intake}
        >
          <Text style={ca.intakeHead}>Client profile</Text>
          <Row icon="person-outline" label="Demographics:">
            {client?.age ? `${client.age} yrs` : "Age N/A"} |{" "}
            {client?.gender || "Gender N/A"} |{" "}
            {client?.relationship_status || "Single"}
          </Row>
          {!!client?.emergency_phone && (
            <Row icon="alert-circle-outline" label="Emergency contact:">
              {client.emergency_phone}
              {client.emergency_relationship
                ? ` (${client.emergency_relationship})`
                : ""}
            </Row>
          )}

          <Text style={[ca.intakeHead, { marginTop: 4 }]}>Session intake</Text>
          {session.reasons?.length > 0 && (
            <View>
              <Text style={ca.intakeLabel}>Reasons for counseling</Text>
              <View style={ca.tags}>
                {session.reasons.map((r, i) => (
                  <View key={i} style={ca.tag}>
                    <Text style={ca.tagText}>{r}</Text>
                  </View>
                ))}
                {!!session.other_reason && (
                  <View style={ca.tag}>
                    <Text style={ca.tagText}>
                      Other: {session.other_reason}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          {!!session.session_goals && (
            <Row icon="flag-outline" label="Goals:">
              {session.session_goals}
            </Row>
          )}
          <Row icon="medical-outline" label="Had therapy before:">
            {session.had_therapy_before ? "Yes" : "No"}
          </Row>
          <View style={ca.intakeRow}>
            <Ionicons name="card-outline" size={14} color="#64748B" />
            <Text style={ca.intakeLabel}>Payment:</Text>
            <View style={ca.paid}>
              <Text style={ca.paidText}>
                {session.payment_status?.toUpperCase()} ({session.currency}{" "}
                {session.payment_amount})
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      <View style={ca.connect}>
        {phoneMode ? (
          <>
            <View style={ca.phoneBox}>
              <Ionicons name="call" size={16} color="#0284C7" />
              <Text style={ca.phoneText}>
                Call {name} on{" "}
                <Text style={{ fontWeight: "800" }}>{callNumber || "N/A"}</Text>
              </Text>
            </View>
            <PressableScale
              haptic
              style={[ca.primary, { backgroundColor: "#16A34A" }]}
              onPress={() => onCall(callNumber)}
            >
              <Ionicons name="call" size={17} color="#FFFFFF" />
              <Text style={ca.primaryText}>Call client</Text>
            </PressableScale>
          </>
        ) : (
          <>
            <View style={ca.linkRow}>
              <TextInput
                style={ca.linkInput}
                placeholder="Add Google Meet or Zoom link..."
                placeholderTextColor="#94A3B8"
                value={draft}
                onChangeText={setDraft}
                autoCapitalize="none"
                keyboardType="url"
                selectionColor="#1E3A8A"
              />
              <PressableScale
                haptic
                disabled={!dirty || savingLink}
                containerStyle={{ opacity: dirty ? 1 : 0.4 }}
                style={ca.saveBtn}
                onPress={() => onSaveLink(session.id, draft)}
                accessibilityLabel="Save meeting link"
              >
                {savingLink ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </PressableScale>
            </View>
            <PressableScale
              haptic
              style={[
                ca.primary,
                {
                  backgroundColor: session.session_link?.trim()
                    ? "#1E3A8A"
                    : "#94A3B8",
                },
              ]}
              onPress={() => onJoin(session.session_link)}
            >
              <Ionicons name="videocam" size={17} color="#FFFFFF" />
              <Text style={ca.primaryText}>Join virtual room</Text>
            </PressableScale>
          </>
        )}
      </View>

      <View style={ca.actions}>
        {ACTIONS.map((a) => (
          <PressableScale
            key={a.type}
            haptic
            scaleTo={0.94}
            style={[ca.action, { backgroundColor: a.bg }]}
            onPress={() => onAction(a.type, session)}
          >
            <Ionicons name={a.icon} size={14} color={a.fg} />
            <Text style={[ca.actionText, { color: a.fg }]}>{a.label}</Text>
          </PressableScale>
        ))}
      </View>
    </Animated.View>
  );
}
