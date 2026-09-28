import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { checkAppointmentReminders } from "../../../libs/appointmentsReminder";
import { supabase } from "../../../libs/supabase";
import { CATEGORIES } from "../../components/client/Dashboard";
import CategoryTile from "../../components/client/home/Categorytile";
import EventCard from "../../components/client/home/EventCard";
import NextSessionCard from "../../components/client/home/NextSessionCard";
import SessionCard from "../../components/client/home/sessionCard";
import Skeleton from "../../components/client/home/Skeleton";
import { useNow } from "../../components/client/home/time";
import AuroraBlobs from "../../components/landing/AuroraBlobs";
import RotatingText from "../../components/landing/Rotatingtext";
import NotificationBell from "../../components/NotificationBell";
import { styles } from "../../styles/(client)/Dashboard";
import { useAuth } from "../_layout";

const ROTATING_PHRASES = [
  "Find your next mentor",
  "Book verified counseling",
  "Track life transitions",
  "Get guided, not guessed",
];

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const now = useNow();

  const isTablet = width >= 600;

  const [firstName, setFirstName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [upcomingPrograms, setUpcomingPrograms] = useState([]);
  const [registeredProgramIds, setRegisteredProgramIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchDashboardData();
    }, [user?.id]),
  );

  useFocusEffect(
    useCallback(() => {
      checkAppointmentReminders();
    }, []),
  );

  const fetchDashboardData = async () => {
    try {
      setLoading((prev) => prev && true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, first_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFirstName(
          profile.first_name ||
            (profile.full_name ? profile.full_name.split(" ")[0] : "Friend"),
        );
      }

      const { data: aptData, error: aptError } = await supabase
        .from("appointments")
        .select(
          `
          id,
          scheduled_start_time,
          status,
          counseling_type,
          session_link,
          counselor:counselor_id (full_name)
        `,
        )
        .eq("client_id", user.id)
        .in("status", [
          "pending_payment",
          "scheduled",
          "rescheduled",
          "rescheduled_requested",
        ])
        .order("scheduled_start_time", { ascending: true });

      if (aptError) {
        console.error("Error fetching appointments:", aptError);
      } else if (aptData) {
        setAppointments(
          aptData.map((item) => {
            const counselorName = item.counselor?.full_name || "";
            return {
              id: item.id,
              title: counselorName
                ? `Session with ${counselorName}`
                : `${item.counseling_type || "Counseling"} session`,
              counselorName,
              type: item.counseling_type,
              dateTime: item.scheduled_start_time,
              status: item.status,
              link: item.session_link,
            };
          }),
        );
      }

      const { data: programData, error: programError } = await supabase
        .from("programs")
        .select(
          "id, title, category, description, starts_at, location_type, location_details, is_paid, amount, currency",
        )
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(3);

      if (!programError && programData) {
        setUpcomingPrograms(programData);

        const programIds = programData.map((p) => p.id);
        if (programIds.length > 0) {
          const { data: userRegs } = await supabase
            .from("program_participants")
            .select("program_id")
            .eq("client_id", user.id)
            .in("program_id", programIds);

          if (userRegs) {
            setRegisteredProgramIds(new Set(userRegs.map((r) => r.program_id)));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [user?.id]);

  const openLocationAction = (locationType, locationDetails) => {
    if (!locationDetails) {
      Alert.alert("Notice", "Meeting details are not yet available.");
      return;
    }
    if (locationType === "virtual") {
      const url = locationDetails.startsWith("http")
        ? locationDetails
        : `https://${locationDetails}`;
      Linking.openURL(url).catch(() =>
        Alert.alert("Error", "Could not open meeting link."),
      );
    } else if (locationType === "phone") {
      const cleanPhone = locationDetails.replace(/[^0-9+]/g, "");
      Linking.openURL(`tel:${cleanPhone}`).catch(() =>
        Alert.alert("Error", "Could not initiate call."),
      );
    } else {
      Alert.alert("Venue Location", locationDetails);
    }
  };

  const joinSession = (session) => {
    if (!session.link) {
      Alert.alert(
        "Link Missing",
        "Your counselor hasn't added a meeting link yet. Check back closer to your session.",
      );
      return;
    }
    Linking.openURL(session.link).catch(() =>
      Alert.alert("Error", "Could not open the meeting link."),
    );
  };

  // Responsive category grid
  const columns = width >= 900 ? 8 : isTablet ? 6 : 4;
  const gridGap = 12;
  const tileWidth = gridWidth
    ? (gridWidth - gridGap * (columns - 1)) / columns
    : undefined;
  const circleSize = isTablet ? 62 : 54;

  const [heroSession, ...restAppointments] = appointments;
  const heroHeight = Math.min(height * 0.3, 260);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#16A34A"
            />
          }
        >
          {/* Header banner */}
          <View style={[styles.heroWrapper, { minHeight: heroHeight }]}>
            <LinearGradient
              colors={["#FEF3C7", "#ECFDF5", "#F0FDF4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <AuroraBlobs width={width} height={heroHeight} />

            <View style={styles.headerOverlay}>
              <View style={styles.topRow}>
                <View style={styles.locationBadge}>
                  <Ionicons name="location-sharp" size={14} color="#15803D" />
                  <Text style={styles.locationText}>Kenya</Text>
                </View>

                <View style={styles.headerActions}>
                  <NotificationBell
                    userId={user?.id}
                    color="#0F172A"
                    route="/notifications"
                  />
                  <Pressable
                    style={styles.logoutButton}
                    onPress={logout}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Log out"
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={18}
                      color="#DC2626"
                    />
                  </Pressable>
                </View>
              </View>

              <Animated.View
                entering={FadeInDown.duration(600).springify()}
                style={styles.welcomeContainer}
              >
                <Text style={styles.welcomeTitle}>
                  Karibu, {firstName || "Friend"}!
                </Text>

                <View style={styles.rotatingRow}>
                  <Text style={styles.rotatingLabel}>—</Text>
                  <RotatingText
                    words={ROTATING_PHRASES}
                    lineHeight={20}
                    style={styles.rotatingHighlight}
                  />
                </View>

                <Text style={styles.welcomeSubtitle}>
                  You don't have to navigate life transitions alone. Share your
                  journey with verified mentors and counselors.
                </Text>
              </Animated.View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            {/* Guidance category grid */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              style={styles.sectionBlock}
            >
              <Text style={styles.sectionHeader}>
                What guidance do you need today?
              </Text>
              <View
                style={styles.categoryGrid}
                onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
              >
                {gridWidth > 0 &&
                  CATEGORIES.map((item, index) => (
                    <CategoryTile
                      key={item.id}
                      item={item}
                      index={index}
                      tileWidth={tileWidth}
                      circle={circleSize}
                      iconSize={isTablet ? 26 : 22}
                      onPress={() => router.push("programs/" + item.routerPath)}
                    />
                  ))}
              </View>
            </Animated.View>

            {/* Upcoming events */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Upcoming Events</Text>
              {loading ? (
                <View style={{ gap: 12 }}>
                  <Skeleton height={150} radius={22} />
                </View>
              ) : upcomingPrograms.length > 0 ? (
                <View style={{ gap: 14 }}>
                  {upcomingPrograms.map((program, index) => (
                    <EventCard
                      key={program.id}
                      program={program}
                      registered={registeredProgramIds.has(program.id)}
                      index={index}
                      onRegister={() =>
                        router.push({
                          pathname: "programs/regPrograms",
                          params: {
                            programId: program.id,
                            title: program.title,
                            description: program.description,
                            starts_at: program.starts_at,
                            is_paid: program.is_paid,
                            amount: program.amount,
                          },
                        })
                      }
                      onOpenLocation={() =>
                        openLocationAction(
                          program.location_type,
                          program.location_details,
                        )
                      }
                    />
                  ))}
                </View>
              ) : (
                <Animated.View
                  entering={FadeInDown.duration(400)}
                  style={styles.emptyStateCard}
                >
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name="calendar-outline"
                      size={26}
                      color="#64748B"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>No Upcoming Events</Text>
                  <Text style={styles.emptySubtitle}>
                    Check back later for new programs and workshops.
                  </Text>
                </Animated.View>
              )}
            </View>

            {/* Appointments */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Pending Appointments</Text>
                {appointments.length > 0 && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => router.push("appointment")}
                  >
                    <Text style={styles.seeAllText}>See All</Text>
                  </Pressable>
                )}
              </View>

              {loading ? (
                <Skeleton height={110} radius={20} />
              ) : appointments.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {heroSession && (
                    <NextSessionCard
                      session={heroSession}
                      now={now}
                      onJoin={() => joinSession(heroSession)}
                      onDetails={() => router.push("appointment")}
                    />
                  )}
                  {restAppointments.map((apt, index) => (
                    <SessionCard
                      key={apt.id}
                      apt={apt}
                      index={index}
                      onPress={() => router.push("appointment")}
                    />
                  ))}
                </View>
              ) : (
                <Animated.View
                  entering={FadeInDown.duration(400)}
                  style={styles.emptyStateCard}
                >
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name="calendar-clear-outline"
                      size={28}
                      color="#64748B"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>No Pending Appointments</Text>
                  <Text style={styles.emptySubtitle}>
                    Connect with a mentor or counselor to help guide your next
                    step.
                  </Text>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => router.push("appointment")}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryBtnText}>Book a Session</Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
