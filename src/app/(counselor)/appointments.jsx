import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "../../../libs/notifications";
import { supabase } from "../../../libs/supabase";
import AnimatedTabs from "../../components/client/appointments/AnimatedTabs";
import PressableScale from "../../components/client/appointments/PressableScale";
import { useNow } from "../../components/client/home/time";
import ActionModal from "../../components/counselor/appointments/ActionModal";
import ActiveSessionCard from "../../components/counselor/appointments/ActiveSessionCard";
import AppointmentsSkeleton from "../../components/counselor/appointments/AppointmentsSkeleton";
import HistoryCard from "../../components/counselor/appointments/HistoryCard";
import { ca } from "../../styles/(counselor)/appointmentsUi";

const CLOSED = [
  "completed",
  "cancelled_by_client",
  "cancelled_by_counselor",
  "rescheduled_requested",
  "no_show",
];
const GAP = 16;

const toMarked = (dates) => {
  const out = {};
  dates.forEach((d) => {
    out[d] = { selected: true, selectedColor: "#EF4444" };
  });
  return out;
};

function Availability({ blocked, saving, open, onToggle, onDayPress }) {
  const count = Object.keys(blocked).length;
  const rot = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    rot.set(withTiming(open ? 1 : 0, { duration: 220 }));
  }, [open, rot]);
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.get() * 180}deg` }],
  }));

  return (
    <Animated.View layout={LinearTransition.duration(260)} style={ca.calCard}>
      <PressableScale scaleTo={0.985} onPress={onToggle} style={ca.calHead}>
        <View style={ca.calIcon}>
          <Ionicons name="calendar-clear-outline" size={19} color="#EF4444" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ca.calTitle}>Availability</Text>
          <Text style={ca.calSub}>
            {count === 0
              ? "No absent days marked"
              : `${count} absent ${count === 1 ? "day" : "days"} marked`}
          </Text>
        </View>
        {saving && <ActivityIndicator size="small" color="#EF4444" />}
        <Animated.View style={chevron}>
          <Ionicons name="chevron-down" size={18} color="#94A3B8" />
        </Animated.View>
      </PressableScale>

      {open && (
        <Animated.View entering={FadeIn.duration(240)} style={ca.calBody}>
          <Text style={ca.calHint}>
            Tap weekdays to mark them unavailable. Clients can't book those
            days. Saved to your profile automatically.
          </Text>
          <Calendar
            minDate={new Date().toISOString().slice(0, 10)}
            onDayPress={onDayPress}
            markedDates={blocked}
            theme={{
              todayTextColor: "#1E3A8A",
              arrowColor: "#1E3A8A",
              textDisabledColor: "#CBD5E1",
            }}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function Empty({ icon, title, text }) {
  return (
    <View style={ca.empty}>
      <Animated.View
        entering={ZoomIn.duration(400).springify().damping(12)}
        style={ca.emptyCircle}
      >
        <Ionicons name={icon} size={40} color="#1E3A8A" />
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(150)} style={ca.emptyTitle}>
        {title}
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(220)} style={ca.emptyText}>
        {text}
      </Animated.Text>
    </View>
  );
}

export default function AppointmentsScreen() {
  const { width } = useWindowDimensions();
  const now = useNow();

  const twoCol = width >= 900;
  const cols = width >= 720 && !twoCol ? 2 : 1;
  const itemWidth = cols === 2 ? "48.5%" : "100%";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingLinkId, setSavingLinkId] = useState(null);
  const [blocked, setBlocked] = useState({});
  const [savingAbsent, setSavingAbsent] = useState(false);
  const [calOpen, setCalOpen] = useState(twoCol);
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState("current");
  const [modal, setModal] = useState(null); // { type, session }
  const hasLoaded = useRef(false);

  const buzz = (t) => Haptics.notificationAsync(t).catch(() => {});

  /* ------------------------------- data ------------------------------- */
  const fetchAbsentDays = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("absent_days")
        .eq("id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      if (Array.isArray(data?.absent_days))
        setBlocked(toMarked(data.absent_days));
    } catch (e) {
      console.error("Failed to load absent days:", e);
    }
  };

  const fetchAppointments = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Authentication error", "Please sign in as a counselor.");
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id, counseling_type, duration_minutes, session_mode, client_call_phone,
          reasons, other_reason, session_goals, had_therapy_before, agreed_terms,
          notes, session_link, scheduled_start_time, scheduled_end_time, status,
          payment_status, payment_amount, currency, action_reason, action_by_role,
          client:client_id (
            id, first_name, middle_name, surname, phone_no, alt_phone_no, gender,
            county, emergency_phone, emergency_relationship, age,
            relationship_status, religion, avatar_url
          ),
          reviews:appointment_reviews (
            id, reviewer_id, reviewer_role, counselor_notes, feedback_text, rating
          )
        `,
        )
        .eq("counselor_id", user.id)
        .order("scheduled_start_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
      hasLoaded.current = true;
    } catch (e) {
      console.error("Error fetching counselor appointments:", e);
      Alert.alert("Couldn't load appointments", "Pull down to try again.");
    }
  };

  const loadAll = async () => {
    if (!hasLoaded.current) setLoading(true);
    await Promise.all([fetchAbsentDays(), fetchAppointments()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, []);

  /* ------------------------------ derived ------------------------------ */
  const active = useMemo(
    () => appointments.filter((a) => !CLOSED.includes(a.status)),
    [appointments],
  );
  const history = useMemo(
    () =>
      appointments
        .filter((a) => CLOSED.includes(a.status))
        .sort(
          (a, b) =>
            new Date(b.scheduled_start_time) - new Date(a.scheduled_start_time),
        ),
    [appointments],
  );

  const tabs = [
    { key: "current", label: "Current", count: active.length },
    { key: "history", label: "History", count: history.length },
  ];

  /* ---------------------------- availability ---------------------------- */
  const saveAbsent = async (next) => {
    try {
      setSavingAbsent(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ absent_days: Object.keys(next) })
        .eq("id", user.id);
      if (error) throw error;
    } catch (e) {
      console.error("Error updating absent days:", e);
      Alert.alert("Error", "Could not save absent days.");
    } finally {
      setSavingAbsent(false);
    }
  };

  const handleDayPress = (day) => {
    const dow = new Date(day.timestamp).getUTCDay();
    if (dow === 0 || dow === 6) {
      Alert.alert("Weekend", "Weekends are non-working days by default.");
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    const next = { ...blocked };
    if (next[day.dateString]) delete next[day.dateString];
    else next[day.dateString] = { selected: true, selectedColor: "#EF4444" };
    setBlocked(next);
    saveAbsent(next);
  };

  /* ------------------------------ link/call ------------------------------ */
  const handleSaveLink = async (id, link) => {
    const trimmed = link.trim();
    try {
      setSavingLinkId(id);
      const { error } = await supabase
        .from("appointments")
        .update({ session_link: trimmed })
        .eq("id", id);
      if (error) throw error;

      const session = appointments.find((a) => a.id === id);
      const clientId = Array.isArray(session?.client)
        ? session.client[0]?.id
        : session?.client?.id;
      if (clientId) {
        await createNotification({
          recipientId: clientId,
          type: NOTIFICATION_TYPES.LINK_UPDATED,
          title: "Meeting Link Updated",
          body: "Your counselor added/updated the virtual meeting link for your session.",
          data: { appointmentId: id },
        });
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, session_link: trimmed } : a)),
      );
      buzz(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Error updating session link:", e);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e.message || "Failed to update session link.");
    } finally {
      setSavingLinkId(null);
    }
  };

  const handleJoin = (url) => {
    if (!url?.trim()) {
      Alert.alert("No link", "Please save a session link first.");
      return;
    }
    const full = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(full).catch(() =>
      Alert.alert("Error", "Unable to open meeting link."),
    );
  };

  const handleCall = (phone) => {
    const n = (phone || "").replace(/[^0-9+]/g, "");
    if (!n) {
      Alert.alert("No phone number", "No contact number for this client.");
      return;
    }
    Linking.openURL(`tel:${n}`).catch(() =>
      Alert.alert("Error", "Unable to open the dialer."),
    );
  };

  /* ------------------------------ actions ------------------------------ */
  const closeModal = () => setModal(null);

  const handleModalSubmit = async ({ input, postponeDate }) => {
    if (!modal) return;
    const { type, session } = modal;
    const text = input.trim();

    if (type === "postpone" && !postponeDate.trim()) {
      Alert.alert("Required", "Please provide a proposed new date or time.");
      return;
    }

    try {
      setActionLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const meta = {
        action_by_role: "counselor",
        action_at: new Date().toISOString(),
      };
      let update;

      if (type === "cancel")
        update = {
          status: "cancelled_by_counselor",
          action_reason: text || "Cancelled by counselor",
          ...meta,
        };
      else if (type === "noshow")
        update = {
          status: "no_show",
          action_reason: text || "Client did not show up",
          ...meta,
        };
      else if (type === "transfer")
        update = {
          status: "rescheduled_requested",
          action_reason: text || "Transferred back to queue",
          ...meta,
        };
      else if (type === "postpone")
        update = {
          status: "rescheduled",
          action_reason: text || `Postponed: ${postponeDate.trim()}`,
          ...meta,
        };
      else update = { status: "completed", notes: text || session.notes };

      const { error } = await supabase
        .from("appointments")
        .update(update)
        .eq("id", session.id);
      if (error) throw error;

      if (type === "attended" && text && user) {
        const { data: existing } = await supabase
          .from("appointment_reviews")
          .select("id")
          .eq("appointment_id", session.id)
          .eq("reviewer_id", user.id)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("appointment_reviews")
            .update({ counselor_notes: text })
            .eq("id", existing.id);
        } else {
          await supabase.from("appointment_reviews").insert({
            appointment_id: session.id,
            reviewer_id: user.id,
            reviewer_role: "counselor",
            counselor_notes: text,
          });
        }
      }

      buzz(Haptics.NotificationFeedbackType.Success);
      setExpandedId(null);
      closeModal();
      await fetchAppointments();
    } catch (e) {
      console.error("Error processing action:", e);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Action failed", e.message || "Could not process request.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ------------------------------ render ------------------------------ */
  const changeTab = (k) => {
    setExpandedId(null);
    setTab(k);
  };

  const list =
    tab === "current" ? (
      active.length === 0 ? (
        <Empty
          key="c-empty"
          icon="calendar-clear-outline"
          title="No active appointments"
          text="New bookings from clients will appear here."
        />
      ) : (
        <View key="current" style={[ca.grid, { gap: GAP }]}>
          {active.map((s, i) => (
            <ActiveSessionCard
              key={s.id}
              session={s}
              index={i}
              now={now}
              style={{ width: itemWidth }}
              expanded={expandedId === s.id}
              onToggle={() => setExpandedId((p) => (p === s.id ? null : s.id))}
              onSaveLink={handleSaveLink}
              savingLink={savingLinkId === s.id}
              onJoin={handleJoin}
              onCall={handleCall}
              onAction={(type, session) => setModal({ type, session })}
            />
          ))}
        </View>
      )
    ) : history.length === 0 ? (
      <Empty
        key="h-empty"
        icon="time-outline"
        title="No history yet"
        text="Completed, cancelled and transferred sessions will show up here."
      />
    ) : (
      <View key="history" style={[ca.grid, { gap: GAP }]}>
        {history.map((s, i) => (
          <HistoryCard
            key={s.id}
            session={s}
            index={i}
            style={{ width: itemWidth }}
          />
        ))}
      </View>
    );

  const availability = (
    <Availability
      blocked={blocked}
      saving={savingAbsent}
      open={calOpen}
      onToggle={() => setCalOpen((v) => !v)}
      onDayPress={handleDayPress}
    />
  );

  const sessions = (
    <>
      <AnimatedTabs tabs={tabs} active={tab} onChange={changeTab} />
      {loading ? (
        <AppointmentsSkeleton count={cols * 2} itemWidth={itemWidth} />
      ) : (
        list
      )}
    </>
  );

  return (
    <SafeAreaView style={ca.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ca.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1E3A8A"
            colors={["#1E3A8A"]}
          />
        }
      >
        <View style={ca.content}>
          <Text style={ca.title}>Appointments & schedule</Text>
          <Text style={ca.subtitle}>
            Manage sessions, meeting links and your availability
          </Text>

          {twoCol ? (
            <View style={ca.twoCol}>
              <View style={ca.colSide}>{availability}</View>
              <View style={ca.colMain}>{sessions}</View>
            </View>
          ) : (
            <>
              {availability}
              {sessions}
            </>
          )}
        </View>
      </ScrollView>

      <ActionModal
        type={modal?.type}
        loading={actionLoading}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
    </SafeAreaView>
  );
}
