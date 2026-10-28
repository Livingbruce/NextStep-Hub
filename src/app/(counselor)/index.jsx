import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkAppointmentReminders } from "../../../libs/appointmentsReminder";
import { supabase } from "../../../libs/supabase";
import useJoinSession from "../../components/call/useJoinSession";
import PressableScale from "../../components/client/appointments/PressableScale";
import { useNow } from "../../components/client/home/time";
import CallCenterHero from "../../components/counselor/dashboard/CallCenterHero";
import CounselorSkeleton from "../../components/counselor/dashboard/CounselorSkeleton";
import LiveCallBanner from "../../components/counselor/dashboard/LiveCallBanner";
import QueueRow from "../../components/counselor/dashboard/QueueRow";
import ReviewCard from "../../components/counselor/dashboard/ReviewCard";
import {
  clientNameOf,
  dayLabel,
} from "../../components/counselor/dashboard/sessionAction";
import NotificationBell from "../../components/NotificationBell";
import { useCall } from "../../context/CallContext";
import { cc } from "../../styles/(counselor)/callCenter";
import { cd } from "../../styles/(counselor)/dashboardUi";
import { useAuth } from "../_layout";

const QUICK = [
  {
    title: "Bookings",
    sub: "Manage appointments",
    icon: "calendar",
    bg: "#EFF6FF",
    fg: "#2563EB",
    route: "/(counselor)/appointments",
  },
  {
    title: "Availability",
    sub: "Block absent days",
    icon: "calendar-clear",
    bg: "#FEF2F2",
    fg: "#EF4444",
    route: "/(counselor)/appointments",
  },
  {
    title: "Programs",
    sub: "Workshops & events",
    icon: "briefcase",
    bg: "#F0FDF4",
    fg: "#16A34A",
    route: "/(counselor)/programs",
  },
  {
    title: "My profile",
    sub: "Bio & specialties",
    icon: "person",
    bg: "#FAF5FF",
    fg: "#9333EA",
    route: "/(counselor)/profile",
  },
];

function Stat({ icon, value, label, index }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(380)}
      style={cd.stat}
    >
      <View style={cd.statIcon}>
        <Ionicons name={icon} size={16} color="#1E3A8A" />
      </View>
      <Text style={cd.statValue}>{value}</Text>
      <Text style={cd.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function SectionHead({ title, count, action, onAction }) {
  return (
    <View style={cc.secRow}>
      <View style={cc.secLeft}>
        <Text style={cc.secTitle}>{title}</Text>
        {count != null && (
          <View style={cc.count}>
            <Text style={cc.countText}>{count}</Text>
          </View>
        )}
      </View>
      {!!action && (
        <PressableScale onPress={onAction}>
          <Text style={cd.seeAll}>{action}</Text>
        </PressableScale>
      )}
    </View>
  );
}

export default function CounselorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const now = useNow();
  const call = useCall();
  const join = useJoinSession();

  const [firstName, setFirstName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const hasLoaded = useRef(false);

  const twoCol = width >= 900;

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      checkAppointmentReminders();
    }, []),
  );

  const fetchDashboardData = async () => {
    try {
      if (!hasLoaded.current) setLoading(true);
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        Alert.alert("Authentication Error", "Please sign in again.");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (profileData?.first_name) setFirstName(profileData.first_name);
      else if (currentUser.email) {
        const p = currentUser.email.split("@")[0];
        setFirstName(p.charAt(0).toUpperCase() + p.slice(1));
      }

      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select(
            `
          id, counseling_type, duration_minutes, session_mode, client_call_phone,
          session_link, scheduled_start_time, scheduled_end_time, status, call_status,
          reasons, other_reason, session_goals, had_therapy_before, notes,
          client:client_id ( id, first_name, surname, phone_no, county )
        `,
          )
          .eq("counselor_id", currentUser.id)
          .in("status", ["scheduled", "rescheduled", "pending_payment"])
          .order("scheduled_start_time", { ascending: true });
      if (appointmentsError) throw appointmentsError;

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("appointment_reviews")
        .select(
          `
          id, rating, feedback_text, created_at,
          appointment:appointment_id!inner (
            counselor_id, counseling_type, scheduled_start_time,
            client:client_id ( first_name, surname, county )
          )
        `,
        )
        .eq("reviewer_role", "client")
        .eq("appointment.counselor_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (reviewsError) throw reviewsError;

      setSessions(appointmentsData || []);
      setReviews(reviewsData || []);
      hasLoaded.current = true;
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      Alert.alert("Couldn't load dashboard", "Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const greeting = useMemo(() => {
    const h = new Date(now).getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }, [now]);

  const { upcoming, needsAction } = useMemo(() => {
    const up = [],
      late = [];
    sessions.forEach((s) => {
      const end = new Date(
        s.scheduled_end_time || s.scheduled_start_time,
      ).getTime();
      (end < now ? late : up).push(s);
    });
    return { upcoming: up, needsAction: late };
  }, [sessions, now]);

  // The session being run takes the hero spot, otherwise the next one.
  const activeId = call.session?.appointmentId;
  const hero = sessions.find((s) => s.id === activeId) || upcoming[0];
  const rest = upcoming.filter((s) => s.id !== hero?.id);

  const grouped = useMemo(() => {
    const out = [];
    rest.forEach((s) => {
      const label = dayLabel(s.scheduled_start_time);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(s);
      else out.push({ label, items: [s] });
    });
    return out;
  }, [rest]);

  const todayCount = upcoming.filter(
    (s) => dayLabel(s.scheduled_start_time) === "Today",
  ).length;
  const rated = reviews.filter((r) => r.rating);
  const avg = rated.length
    ? (rated.reduce((a, r) => a + r.rating, 0) / rated.length).toFixed(1)
    : "–";

  /* ----------------------------- actions ----------------------------- */
  const goToAppointments = () => router.push("/(counselor)/appointments");

  const startSession = (s, video) =>
    join({
      appointmentId: s.id,
      role: "counselor",
      peerName: clientNameOf(s),
      subtitle: `${s.counseling_type} session`,
      video,
      intake: { reasons: s.reasons || [], goals: s.session_goals || "" },
      notes: s.notes || "",
    });

  const dial = (phone) => {
    const n = (phone || "").replace(/[^0-9+]/g, "");
    if (!n)
      return Alert.alert(
        "No phone number",
        "No contact number is available for this client.",
      );
    Linking.openURL(`tel:${n}`).catch(() =>
      Alert.alert("Error", "Could not open the phone dialer."),
    );
  };

  /* ----------------------------- sections ----------------------------- */
  const main = (
    <View style={twoCol ? cd.colMain : undefined}>
      {hero ? (
        <CallCenterHero
          session={hero}
          now={now}
          isActive={hero.id === activeId}
          busy={call.connecting}
          onVideo={() => startSession(hero, true)}
          onAudio={() => startSession(hero, false)}
          onDial={dial}
          onReturn={call.expand}
          onDetails={goToAppointments}
        />
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={cd.empty}>
          <Ionicons name="calendar-outline" size={34} color="#94A3B8" />
          <Text style={cd.emptyText}>
            No upcoming sessions. New bookings will appear here.
          </Text>
        </Animated.View>
      )}

      {needsAction.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(350)}
          style={{ marginTop: 16 }}
        >
          <PressableScale
            haptic
            style={cd.attention}
            onPress={goToAppointments}
          >
            <Ionicons name="alert-circle" size={22} color="#D97706" />
            <Text style={cd.attentionText}>
              {needsAction.length === 1
                ? "1 past session still needs an update."
                : `${needsAction.length} past sessions still need an update.`}
            </Text>
            <Text style={cd.attentionLink}>Review</Text>
          </PressableScale>
        </Animated.View>
      )}

      {grouped.length > 0 && (
        <>
          <SectionHead
            title="Session queue"
            count={rest.length}
            action="See all"
            onAction={goToAppointments}
          />
          {grouped.map((g, gi) => (
            <View key={g.label}>
              <Text style={cd.dayLabel}>{g.label}</Text>
              {g.items.map((s, i) => (
                <QueueRow
                  key={s.id}
                  session={s}
                  index={gi * 3 + i}
                  now={now}
                  onStart={() =>
                    s.session_mode === "phone"
                      ? dial(s.client_call_phone || s.client?.phone_no)
                      : startSession(s, true)
                  }
                  onOpen={goToAppointments}
                />
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );

  const side = (
    <View style={twoCol ? cd.colSide : undefined}>
      <SectionHead title="Booking tools" />
      <View style={cc.qaGrid}>
        {QUICK.map((q, i) => (
          <Animated.View
            key={q.title}
            entering={FadeInDown.delay(i * 60).duration(350)}
            style={{ flexBasis: "48%", flexGrow: 1 }}
          >
            <PressableScale
              haptic
              style={cc.qaTile}
              onPress={() => router.push(q.route)}
            >
              <View style={[cc.qaIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon} size={20} color={q.fg} />
              </View>
              <Text style={cc.qaTitle}>{q.title}</Text>
              <Text style={cc.qaSub}>{q.sub}</Text>
            </PressableScale>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  // Reviews live at the very bottom, full width.
  const reviewsSection = (
    <View style={cc.reviewsWrap}>
      <View style={cc.secRow}>
        <View style={cc.secLeft}>
          <Text style={cc.secTitle}>Client reviews</Text>
          {reviews.length > 0 && (
            <View style={cc.count}>
              <Text style={cc.countText}>{reviews.length}</Text>
            </View>
          )}
        </View>
        {rated.length > 0 && (
          <View style={cc.reviewsSummary}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={cd.ratingText}>{avg}</Text>
          </View>
        )}
      </View>
      {reviews.length > 0 ? (
        reviews.map((r, i) => (
          <ReviewCard
            key={r.id}
            review={r}
            index={i}
            expanded={expandedReviewId === r.id}
            onToggle={() =>
              setExpandedReviewId((p) => (p === r.id ? null : r.id))
            }
          />
        ))
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={cd.empty}>
          <Ionicons name="chatbox-ellipses-outline" size={34} color="#94A3B8" />
          <Text style={cd.emptyText}>No client reviews yet.</Text>
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={cd.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={cd.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1E3A8A"
            colors={["#1E3A8A"]}
          />
        }
      >
        <View style={cd.content}>
          <View style={cd.header}>
            <View>
              <Text style={cd.greet}>{greeting},</Text>
              <Text style={cd.name}>{firstName || "Counselor"}</Text>
            </View>
            <View style={cd.headerActions}>
              <View style={cd.iconBtn}>
                <NotificationBell
                  userId={user?.id}
                  color="#0F172A"
                  route="/notifications"
                />
              </View>
              <PressableScale
                haptic
                style={[cd.iconBtn, cd.logoutBtn]}
                onPress={logout}
                accessibilityLabel="Log out"
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </PressableScale>
            </View>
          </View>

          <LiveCallBanner />

          {loading ? (
            <CounselorSkeleton twoCol={twoCol} />
          ) : (
            <>
              <View style={cd.stats}>
                <Stat
                  index={0}
                  icon="today-outline"
                  value={todayCount}
                  label="Today"
                />
                <Stat
                  index={1}
                  icon="calendar-outline"
                  value={upcoming.length}
                  label="Upcoming"
                />
                <Stat
                  index={2}
                  icon="star-outline"
                  value={avg}
                  label="Avg rating"
                />
              </View>

              {twoCol ? (
                <View style={cd.twoCol}>
                  {main}
                  {side}
                </View>
              ) : (
                <>
                  {main}
                  {side}
                </>
              )}

              {reviewsSection}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
