import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RtcSurfaceView } from "react-native-agora";
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { useCall, useCallTimer } from "../../context/CallContext";
import { cs } from "../../styles/call";
import PressableScale from "../client/appointments/PressableScale";

export const initials = (name = "") =>
  name
    .replace(/^Counselor\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "•";

export function SignalBars({ quality }) {
  // Agora: 1-2 good, 3-4 fair, 5-6 poor
  const level = quality === 0 ? 0 : quality <= 2 ? 3 : quality <= 4 ? 2 : 1;
  const color = level === 3 ? "#4ADE80" : level === 2 ? "#FACC15" : "#F87171";

  return (
    <View style={cs.bars}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            cs.bar,
            {
              height: 5 + i * 3,
              backgroundColor: i <= level ? color : "rgba(255,255,255,0.25)",
            },
          ]}
        />
      ))}
    </View>
  );
}

function Pulse({ color }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withRepeat(
        withTiming(1, {
          duration: 1800,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false,
      ),
    );
  }, [t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 1], [0.55, 0]),
    transform: [{ scale: interpolate(t.get(), [0, 1], [1, 1.9]) }],
  }));

  return <Animated.View style={[cs.pulse, { borderColor: color }, style]} />;
}

function Ctrl({ icon, label, on, onPress }) {
  return (
    <View style={cs.ctrl}>
      <PressableScale
        haptic
        scaleTo={0.9}
        style={[cs.ctrlBtn, on && cs.ctrlBtnOn]}
        onPress={onPress}
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={22} color={on ? "#0B1220" : "#FFFFFF"} />
      </PressableScale>
      <Text style={cs.ctrlLabel}>{label}</Text>
    </View>
  );
}

function SpeakerPanel({ programId }) {
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    if (!programId) return;

    const { data, error } = await supabase
      .from("program_participants")
      .select("client_id, can_speak, profile:client_id ( first_name, surname )")
      .eq("program_id", programId);

    if (error) {
      console.warn("Could not load program attendees:", error.message);
      return;
    }

    setRows(data || []);
  }, [programId]);

  useEffect(() => {
    load();

    if (!programId) return;

    const ch = supabase
      .channel(`panel-${programId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "program_participants",
          filter: `program_id=eq.${programId}`,
        },
        load,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [programId, load]);

  const toggle = async (r) => {
    const { error } = await supabase.rpc("set_can_speak", {
      p_program_id: programId,
      p_client_id: r.client_id,
      p_can: !r.can_speak,
    });

    if (error) {
      Alert.alert("Couldn't update", error.message);
    }
  };

  return (
    <View style={cs.notesPanel}>
      <Text style={cs.notesHead}>Attendees ({rows.length})</Text>

      <ScrollView
        style={{ maxHeight: 180 }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {rows.length === 0 ? (
          <Text style={{ color: "rgba(255,255,255,0.6)", paddingVertical: 8 }}>
            No attendees have joined this program yet.
          </Text>
        ) : (
          rows.map((r) => {
            const p = Array.isArray(r.profile) ? r.profile[0] : r.profile;

            const name =
              [p?.first_name, p?.surname].filter(Boolean).join(" ") ||
              "Attendee";

            return (
              <View
                key={r.client_id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: "#fff",
                    fontSize: 14,
                    marginRight: 8,
                  }}
                  numberOfLines={1}
                >
                  {name}
                </Text>

                <PressableScale
                  haptic
                  onPress={() => toggle(r)}
                  style={[
                    cs.notesToggle,
                    {
                      marginBottom: 0,
                      paddingVertical: 7,
                    },
                  ]}
                >
                  <Ionicons
                    name={r.can_speak ? "mic" : "mic-off"}
                    size={14}
                    color="#fff"
                  />
                  <Text style={cs.notesToggleText}>
                    {r.can_speak ? "Speaking" : "Allow to speak"}
                  </Text>
                </PressableScale>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

export default function CallModal() {
  const insets = useSafeAreaInsets();

  const {
    clientResponse,
    ringAgain,
    session,
    expanded,
    status,
    remoteUid,
    remoteVideoOn,
    muted,
    cameraOn,
    speakerOn,
    canPublish,
    startedAt,
    quality,
    minimize,
    endCall,
    toggleMute,
    toggleCamera,
    flipCamera,
    toggleSpeaker,
  } = useCall();

  const timer = useCallTimer(startedAt);

  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(session?.initialNotes || "");
    setNotesOpen(false);
  }, [session?.appointmentId, session?.roomId]);

  if (!session) return null;

  const counselor = session.role === "counselor";
  const appointment = session.kind === "appointment";
  const program = session.kind === "program";
  const video = !!session.video;

  const accent = counselor ? "#2563EB" : "#16A34A";
  const live = status === "live";

  const showRemoteVideo = video && remoteUid != null && remoteVideoOn;

  const programId = session.programId ?? (program ? session.roomId : null);

  const noAnswer =
    appointment &&
    counselor &&
    !live &&
    (clientResponse === "declined" || clientResponse === "missed");

  const finish = async () => {
    const s = session;
    const text = notes.trim();

    await endCall();

    // Events/programs must not run appointment attendance handling.
    if (s.role !== "counselor" || s.kind !== "appointment") return;

    if (text) {
      const { error } = await supabase
        .from("appointments")
        .update({ notes: text })
        .eq("id", s.appointmentId);

      if (error) {
        Alert.alert("Notes not saved", error.message);
      }
    }

    Alert.alert("Session ended", "Mark this session as attended?", [
      { text: "Later", style: "cancel" },
      {
        text: "Mark attended",
        onPress: async () => {
          const { error } = await supabase
            .from("appointments")
            .update({ status: "completed" })
            .eq("id", s.appointmentId);

          if (error) {
            Alert.alert("Couldn't update session", error.message);
          }
        },
      },
    ]);
  };

  const confirmEnd = () =>
    Alert.alert(
      counselor ? "End session?" : "Leave session?",
      counselor
        ? "This ends the call for everyone."
        : "You can rejoin while your counselor is still in the session.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: counselor ? "End session" : "Leave",
          style: "destructive",
          onPress: finish,
        },
      ],
    );

  const hint =
    status === "reconnecting"
      ? "Reconnecting…"
      : !counselor && !canPublish && live
        ? "You're listening. The host can invite you to speak."
        : !live
          ? counselor
            ? clientResponse === "declined"
              ? `${session.peerName} declined the call`
              : clientResponse === "missed"
                ? `${session.peerName} didn't answer`
                : `Calling ${session.peerName}…`
            : "Connecting…"
          : video
            ? `${session.peerName}'s camera is off`
            : "Audio call in progress";

  return (
    <Modal
      visible={expanded}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={minimize}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={cs.root}>
          {showRemoteVideo ? (
            <RtcSurfaceView
              style={StyleSheet.absoluteFill}
              canvas={{ uid: remoteUid }}
            />
          ) : (
            <LinearGradient
              colors={["#0B1220", "#111C33", "#0B1220"]}
              style={cs.stage}
            >
              <View style={cs.avatarWrap}>
                {!live && <Pulse color={accent} />}

                <View style={[cs.avatar, { backgroundColor: accent }]}>
                  <Text style={cs.avatarText}>
                    {initials(session.peerName)}
                  </Text>
                </View>
              </View>

              <Text style={cs.stageName}>{session.peerName}</Text>
              <Text style={cs.stageHint}>{hint}</Text>

              {noAnswer && (
                <PressableScale
                  haptic
                  style={[cs.notesToggle, { marginTop: 18 }]}
                  onPress={ringAgain}
                >
                  <Ionicons name="call" size={15} color="#FFFFFF" />
                  <Text style={cs.notesToggleText}>Ring again</Text>
                </PressableScale>
              )}
            </LinearGradient>
          )}

          {/* Top bar */}
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent"]}
            style={[cs.topBar, { paddingTop: insets.top + 10 }]}
            pointerEvents="box-none"
          >
            <PressableScale
              haptic
              style={cs.roundBtn}
              onPress={minimize}
              accessibilityLabel="Minimize call"
            >
              <Ionicons name="chevron-down" size={22} color="#FFFFFF" />
            </PressableScale>

            <View style={cs.topMid}>
              <Text style={cs.topName} numberOfLines={1}>
                {session.peerName}
              </Text>

              <View style={cs.topSub}>
                <View
                  style={[
                    cs.dot,
                    { backgroundColor: live ? "#4ADE80" : "#FACC15" },
                  ]}
                />

                <Text style={cs.topSubText}>
                  {live
                    ? timer
                    : status === "reconnecting"
                      ? "Reconnecting"
                      : "Waiting"}{" "}
                  · {session.subtitle}
                </Text>
              </View>
            </View>

            <SignalBars quality={quality} />

            <Ionicons
              name="lock-closed"
              size={16}
              color="rgba(255,255,255,0.7)"
            />
          </LinearGradient>

          {/* Reconnection banner */}
          {status === "reconnecting" && (
            <Animated.View
              entering={FadeInDown}
              exiting={FadeOut}
              style={[cs.banner, { top: insets.top + 70 }]}
            >
              <Ionicons name="wifi-outline" size={14} color="#451A03" />
              <Text style={cs.bannerText}>Poor connection, reconnecting…</Text>
            </Animated.View>
          )}

          {/* Local video preview: publishers only */}
          {video && canPublish && (
            <View style={[cs.pip, { top: insets.top + 78 }]}>
              {cameraOn ? (
                <RtcSurfaceView
                  style={StyleSheet.absoluteFill}
                  canvas={{ uid: 0 }}
                  zOrderMediaOverlay
                />
              ) : (
                <>
                  <Ionicons
                    name="videocam-off"
                    size={26}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={cs.pipOffText}>Camera off</Text>
                </>
              )}
            </View>
          )}

          {/* Bottom: notes, speaker panel and controls */}
          <View style={[cs.bottom, { paddingBottom: insets.bottom + 14 }]}>
            {/* Appointment-only private notes */}
            {counselor && appointment && (
              <>
                {notesOpen && (
                  <Animated.View
                    entering={FadeInDown.duration(220)}
                    exiting={FadeOut.duration(120)}
                    style={cs.notesPanel}
                  >
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                    >
                      {!!session.intake?.reasons?.length && (
                        <>
                          <Text style={cs.notesHead}>Reasons for session</Text>

                          <View style={cs.notesTags}>
                            {session.intake.reasons.map((r) => (
                              <View key={r} style={cs.notesTag}>
                                <Text style={cs.notesTagText}>{r}</Text>
                              </View>
                            ))}
                          </View>
                        </>
                      )}

                      {!!session.intake?.goals && (
                        <>
                          <Text style={cs.notesHead}>Client goals</Text>
                          <Text style={cs.notesGoal}>
                            {session.intake.goals}
                          </Text>
                        </>
                      )}

                      <Text style={cs.notesHead}>Private session notes</Text>

                      <TextInput
                        style={cs.notesInput}
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Only you can see these. Saved when the session ends."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        selectionColor="#93C5FD"
                      />
                    </ScrollView>
                  </Animated.View>
                )}

                <PressableScale
                  style={cs.notesToggle}
                  onPress={() => setNotesOpen((v) => !v)}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={15}
                    color="#FFFFFF"
                  />
                  <Text style={cs.notesToggleText}>
                    {notesOpen ? "Hide notes" : "Client info & notes"}
                  </Text>
                </PressableScale>
              </>
            )}

            {/* Program host attendee controls */}
            {counselor && program && programId && (
              <SpeakerPanel programId={programId} />
            )}

            {/* Call controls */}
            <View style={cs.controls}>
              {canPublish && (
                <Ctrl
                  icon={muted ? "mic-off" : "mic"}
                  label={muted ? "Unmute" : "Mute"}
                  on={muted}
                  onPress={toggleMute}
                />
              )}

              {canPublish && video && (
                <Ctrl
                  icon={cameraOn ? "videocam" : "videocam-off"}
                  label="Camera"
                  on={!cameraOn}
                  onPress={toggleCamera}
                />
              )}

              <View style={cs.ctrl}>
                <PressableScale
                  haptic
                  scaleTo={0.9}
                  style={cs.ctrlEnd}
                  onPress={confirmEnd}
                  accessibilityLabel={counselor ? "End call" : "Leave call"}
                >
                  <Ionicons
                    name="call"
                    size={26}
                    color="#FFFFFF"
                    style={{ transform: [{ rotate: "135deg" }] }}
                  />
                </PressableScale>

                <Text style={cs.ctrlLabel}>{counselor ? "End" : "Leave"}</Text>
              </View>

              {canPublish && video && (
                <Ctrl icon="camera-reverse" label="Flip" onPress={flipCamera} />
              )}

              <Ctrl
                icon={speakerOn ? "volume-high" : "ear"}
                label={speakerOn ? "Speaker" : "Earpiece"}
                on={speakerOn}
                onPress={toggleSpeaker}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
