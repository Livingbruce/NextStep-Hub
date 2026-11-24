import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import useJoinSession from "../../components/call/useJoinSession";
import AnimatedTabs from "../../components/client/appointments/AnimatedTabs";
import AppointmentCard from "../../components/client/appointments/AppointmentCard";
import AppointmentSkeletonList from "../../components/client/appointments/AppointmentSkeleton";
import PressableScale from "../../components/client/appointments/PressableScale";
import { useIncomingCall } from "../../context/IncomingCallContext";
import { styles } from "../../styles/(client)/appointments/index";
import { ui } from "../../styles/(client)/appointments/ui";

const GAP = 16;
const MAX_CONTENT = 1100;
const H_PADDING = 20;

const ATTENDED_STATUSES = new Set(["attended", "completed"]);
const HISTORY_STATUSES = new Set([
  "completed",
  "cancelled_by_client",
  "cancelled_by_counselor",
  "cancelled",
  "not_attended",
  "missed",
  "no_show",
]);

function isHistoryAppointment(app) {
  return HISTORY_STATUSES.has((app?.status || "").toLowerCase());
}

function hasClientReview(appointment, userId) {
  const list = appointment?.reviews || [];
  return list.some(
    (r) =>
      r.reviewer_role === "client" && (!userId || r.reviewer_id === userId),
  );
}

export default function AppointmentScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [currentUserId, setCurrentUserId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [skippedReviewIds, setSkippedReviewIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [expandedId, setExpandedId] = useState(null);
  const hasLoaded = useRef(false);

  const joinInApp = useJoinSession();
  const { liveMap } = useIncomingCall();

  // ---- Responsive grid: 1 column on phones, 2 on tablets / landscape ----
  const columns = width >= 720 ? 2 : 1;
  const contentWidth = Math.min(width, MAX_CONTENT) - H_PADDING * 2;
  const itemWidth = columns === 1 ? "100%" : (contentWidth - GAP) / columns;

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, []),
  );

  const fetchAppointments = async () => {
    try {
      if (!hasLoaded.current) setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          "Sign in required",
          "Please sign in to view your appointments.",
        );
        return;
      }
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          counseling_type,
          reasons,
          other_reason,
          session_goals,
          had_therapy_before,
          session_link,
          scheduled_start_time,
          scheduled_end_time,
          status,
          payment_status,
          payment_amount,
          currency,
          action_reason,
          call_status,
          session_mode,
          counselor:counselor_id (
            first_name,
            surname,
            avatar_url
          ),
          reviews:appointment_reviews (
            id,
            reviewer_id,
            reviewer_role,
            rating,
            feedback_text
          )
        `,
        )
        .eq("client_id", user.id)
        .order("scheduled_start_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
      hasLoaded.current = true;
    } catch (err) {
      console.error("Error fetching appointments:", err);
      Alert.alert("Couldn't load appointments", "Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, []);

  const buzz = (type) => Haptics.notificationAsync(type).catch(() => {});

  // ---- Actions ----
  const handleCancel = async (id, reason) => {
    if (!reason.trim()) {
      return Alert.alert(
        "Reason needed",
        "Please tell us why you are cancelling.",
      );
    }
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled_by_client",
          action_reason: reason.trim(),
          action_by_role: "client",
          action_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      buzz(Haptics.NotificationFeedbackType.Success);
      setExpandedId(null);
      await fetchAppointments();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Couldn't cancel", err.message || "Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (id, text) => {
    if (!text.trim()) {
      return Alert.alert(
        "Review needed",
        "Write a few words before submitting.",
      );
    }
    try {
      setActionLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You're not signed in.");

      const { error } = await supabase.from("appointment_reviews").insert([
        {
          appointment_id: id,
          reviewer_id: user.id,
          reviewer_role: "client",
          feedback_text: text.trim(),
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          throw new Error("You've already reviewed this session.");
        }
        throw error;
      }

      buzz(Haptics.NotificationFeedbackType.Success);
      setExpandedId(null);
      await fetchAppointments();
    } catch (err) {
      console.error("Error submitting review:", err);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Couldn't submit review", err.message || "Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipReview = (id) => {
    setSkippedReviewIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setExpandedId((prev) => (prev === id ? null : prev));
  };

  const handleJoin = (item) =>
    joinInApp({
      appointmentId: item.id,
      role: "client",
      peerName:
        `Counselor ${item.counselor?.first_name || ""} ${item.counselor?.surname || ""}`.trim(),
      subtitle: `${item.counseling_type} session`,
      video: true,
    });

  const canMoveToHistory = useCallback(
    (item) => {
      if (!isHistoryAppointment(item)) return false;
      if (!ATTENDED_STATUSES.has((item.status || "").toLowerCase())) {
        return true;
      }
      return (
        hasClientReview(item, currentUserId) || skippedReviewIds.has(item.id)
      );
    },
    [currentUserId, skippedReviewIds],
  );

  // ---- Derived lists ----
  const upcoming = useMemo(
    () => appointments.filter((a) => !canMoveToHistory(a)),
    [appointments, canMoveToHistory],
  );
  const history = useMemo(
    () =>
      appointments
        .filter(canMoveToHistory)
        .sort(
          (a, b) =>
            new Date(b.scheduled_start_time) - new Date(a.scheduled_start_time),
        ),
    [appointments, canMoveToHistory],
  );

  const displayed = activeTab === "upcoming" ? upcoming : history;

  const tabs = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "history", label: "History", count: history.length },
  ];

  const goToBooking = () => router.push("/appointments/newAppointments");

  const changeTab = (key) => {
    setExpandedId(null);
    setActiveTab(key);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#936D9A"
            colors={["#936D9A"]}
          />
        }
      >
        <View style={ui.content}>
          {/* Header */}
          <View style={ui.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={ui.title}>Your appointments</Text>
              {!loading && (
                <Animated.Text
                  entering={FadeIn.duration(300)}
                  style={ui.subtitle}
                >
                  {upcoming.length === 0
                    ? "Nothing scheduled right now"
                    : `${upcoming.length} upcoming ${
                        upcoming.length === 1 ? "session" : "sessions"
                      }`}
                </Animated.Text>
              )}
            </View>

            <PressableScale
              haptic
              style={ui.newBtn}
              onPress={goToBooking}
              accessibilityLabel="Book a new appointment"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={ui.newBtnText}>Book</Text>
            </PressableScale>
          </View>

          <AnimatedTabs tabs={tabs} active={activeTab} onChange={changeTab} />

          {/* Body */}
          {loading ? (
            <AppointmentSkeletonList
              count={columns * 3}
              itemWidth={itemWidth}
              gap={GAP}
            />
          ) : displayed.length > 0 ? (
            <View key={activeTab} style={[ui.grid, { gap: GAP }]}>
              {displayed.map((item, index) => {
                const isAttended = ATTENDED_STATUSES.has(
                  (item.status || "").toLowerCase(),
                );
                const reviewed = hasClientReview(item, currentUserId);
                const safeItem = {
                  ...item,
                  notes: null,
                  reviews: (item.reviews || []).filter(
                    (r) =>
                      r.reviewer_role === "client" &&
                      r.reviewer_id === currentUserId,
                  ),
                };

                return (
                  <AppointmentCard
                    key={item.id}
                    item={safeItem}
                    index={index}
                    style={{ width: itemWidth }}
                    expanded={expandedId === item.id}
                    onToggle={() =>
                      setExpandedId((prev) =>
                        prev === item.id ? null : item.id,
                      )
                    }
                    onCancel={handleCancel}
                    onReview={handleReview}
                    onSkipReview={() => handleSkipReview(item.id)}
                    pendingReview={isAttended && !reviewed}
                    isHistoryView={activeTab === "history"}
                    busy={actionLoading && expandedId === item.id}
                    live={liveMap[item.id] ?? item.call_status === "live"}
                    onJoin={() => handleJoin(item)}
                  />
                );
              })}
            </View>
          ) : (
            <View key={activeTab} style={ui.empty}>
              <Animated.View
                entering={ZoomIn.duration(400).springify().damping(12)}
                style={ui.emptyCircle}
              >
                <Ionicons
                  name={
                    activeTab === "upcoming"
                      ? "calendar-outline"
                      : "time-outline"
                  }
                  size={44}
                  color="#936D9A"
                />
              </Animated.View>
              <Animated.Text entering={FadeIn.delay(150)} style={ui.emptyTitle}>
                {activeTab === "upcoming"
                  ? "No upcoming sessions"
                  : "No past sessions yet"}
              </Animated.Text>
              <Animated.Text entering={FadeIn.delay(220)} style={ui.emptyText}>
                {activeTab === "upcoming"
                  ? "Book a session with a counselor to take your next step."
                  : "Completed and cancelled sessions will show up here."}
              </Animated.Text>
              {activeTab === "upcoming" && (
                <PressableScale
                  haptic
                  style={styles.bookButton}
                  onPress={goToBooking}
                >
                  <Text style={styles.bookButtonText}>Book appointment</Text>
                </PressableScale>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
