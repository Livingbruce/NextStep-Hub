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
import PressableScale from "../../components/client/appointments/PressableScale";
import { useNow } from "../../components/client/home/time";
import CounselorSkeleton from "../../components/counselor/dashboard/CounselorSkeleton";
import NextSessionHero from "../../components/counselor/dashboard/NextSessionHero";
import ReviewCard from "../../components/counselor/dashboard/ReviewCard";
import {
  dayLabel,
  getAction,
  phoneOf,
} from "../../components/counselor/dashboard/sessionAction";
import SessionRow from "../../components/counselor/dashboard/SessionRow";
import NotificationBell from "../../components/NotificationBell";
import { cd } from "../../styles/(counselor)/dashboardUi";
import { useAuth } from "../_layout";

const APPOINTMENTS_ROUTE = "/(counselor)/appointments";

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

export default function CounselorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const now = useNow();

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
      // Skeleton only on the very first load; later focuses refresh quietly.
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
      else if (currentUser.user_metadata?.first_name)
        setFirstName(currentUser.user_metadata.first_name);
      else if (currentUser.email) {
        const p = currentUser.email.split("@")[0];
        setFirstName(p.charAt(0).toUpperCase() + p.slice(1));
      }

      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select(
            `
          id,
          counseling_type,
          duration_minutes,
          session_mode,
          client_call_phone,
          session_link,
          scheduled_start_time,
          scheduled_end_time,
          status,
          client:client_id (
            id,
            first_name,
            surname,
            phone_no,
            county
          )
        `,
          )
          .eq("counselor_id", currentUser.id)
          .in("status", ["scheduled", "rescheduled", "pending_payment"])
          .order("scheduled_start_time", { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Only reviews on THIS counselor's sessions (the old query returned every client review).
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("appointment_reviews")
        .select(
          `
          id,
          rating,
          feedback_text,
          created_at,
          appointment:appointment_id!inner (
            counselor_id,
            counseling_type,
            scheduled_start_time,
            client:client_id (
              first_name,
              surname,
              county
            )
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
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, [now]);

  // ---- Derived data ----
  const { upcoming, needsAction } = useMemo(() => {
    const up = [];
    const late = [];
    sessions.forEach((s) => {
      const end = new Date(
        s.scheduled_end_time || s.scheduled_start_time,
      ).getTime();
      (end < now ? late : up).push(s);
    });
    return { upcoming: up, needsAction: late };
  }, [sessions, now]);

  const hero = upcoming[0];
  const rest = upcoming.slice(1);

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

  // ---- Actions ----
  const goToAppointments = () => router.push(APPOINTMENTS_ROUTE);

  const runAction = (session) => {
    const action = getAction(session);

    if (action.kind === "call") {
      const number = phoneOf(session).replace(/[^0-9+]/g, "");
      if (!number) {
        Alert.alert(
          "No phone number",
          "No contact number is available for this client.",
        );
        return;
      }
      Linking.openURL(`tel:${number}`).catch(() =>
        Alert.alert("Error", "Could not open the phone dialer."),
      );
    } else if (action.kind === "join") {
      Linking.openURL(session.session_link).catch(() =>
        Alert.alert("Error", "Could not open the meeting link."),
      );
    } else {
      goToAppointments();
    }
  };

  // ---- Sections ----
  const sessionsSection = (
    <View style={twoCol ? cd.colMain : undefined}>
      {hero ? (
        <NextSessionHero
          session={hero}
          now={now}
          onPrimary={() => runAction(hero)}
          onDetails={goToAppointments}
        />
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={cd.empty}>
          <Ionicons name="calendar-outline" size={34} color="#94A3B8" />
          <Text style={cd.emptyText}>No upcoming sessions scheduled.</Text>
        </Animated.View>
      )}

      {grouped.length > 0 && (
        <>
          <View style={cd.sectionRow}>
            <Text style={cd.sectionTitle}>Coming up</Text>
            <PressableScale onPress={goToAppointments}>
              <Text style={cd.seeAll}>See all</Text>
            </PressableScale>
          </View>
          {grouped.map((g, gi) => (
            <View key={g.label}>
              <Text style={cd.dayLabel}>{g.label}</Text>
              {g.items.map((s, i) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  index={gi * 3 + i}
                  now={now}
                  onPrimary={() => runAction(s)}
                  onOpen={goToAppointments}
                />
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );

  const reviewsSection = (
    <View style={twoCol ? cd.colSide : undefined}>
      <View style={[cd.sectionRow, twoCol && { marginTop: 0 }]}>
        <Text style={cd.sectionTitle}>Client reviews</Text>
        {rated.length > 0 && (
          <View style={cd.ratingBox}>
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
          {/* Header */}
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

              {needsAction.length > 0 && (
                <Animated.View entering={FadeInDown.duration(350)}>
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

              {twoCol ? (
                <View style={cd.twoCol}>
                  {sessionsSection}
                  {reviewsSection}
                </View>
              ) : (
                <>
                  {sessionsSection}
                  {reviewsSection}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
