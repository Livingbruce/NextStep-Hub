import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { checkAppointmentReminders } from "../../../libs/appointmentsReminder";
import { supabase } from "../../../libs/supabase";
import { CATEGORIES } from "../../components/client/Dashboard";
import AuroraBlobs from "../../components/landing/AuroraBlobs";
import ShimmerButton from "../../components/landing/Shimmerbutton";
import NotificationBell from "../../components/NotificationBell";
import { styles } from "../../styles/(client)/Dashboard";
import { useAuth } from "../_layout";

// 1. Rotating Text Component
function RotatingText({ phrases, interval = 2800 }) {
  const [index, setIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, interval);
    return () => clearInterval(timer);
  }, [phrases.length, interval]);

  return (
    <View style={{ height: 28, overflow: "hidden" }}>
      <Animated.Text
        key={phrases[index]}
        entering={FadeInDown.duration(400)}
        exiting={FadeOutUp.duration(300)}
        style={styles.heroHighlightText}
      >
        {phrases[index]}
      </Animated.Text>
    </View>
  );
}

// 2. Interactive Mood Check-In Widget (Spacious 2x2 Bento Grid Layout)
const MOODS = [
  { id: "seeking", emoji: "🌱", label: "Growing", desc: "Open to guidance" },
  { id: "hopeful", emoji: "✨", label: "Hopeful", desc: "Feeling positive" },
  { id: "anxious", emoji: "🌧️", label: "Overwhelmed", desc: "Need support" },
  { id: "ready", emoji: "🚀", label: "Ready", desc: "Set for action" },
];

function InteractiveMoodWidget() {
  const [selectedMood, setSelectedMood] = useState(null);

  const handleSelect = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedMood((prev) => (prev === id ? null : id));
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(500)}
      style={styles.moodWidgetCard}
    >
      <View style={styles.moodHeaderRow}>
        <View style={styles.moodTitleContainer}>
          <View style={styles.pulseDot} />
          <Text style={styles.moodTitle}>How are you feeling today?</Text>
        </View>
        <Text style={styles.moodSub}>Daily Check-in</Text>
      </View>

      <View style={styles.moodGrid}>
        {MOODS.map((m) => {
          const isSelected = selectedMood === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => handleSelect(m.id)}
              style={({ pressed }) => [
                styles.moodTile,
                isSelected && styles.moodTileActive,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View
                style={[
                  styles.moodEmojiCircle,
                  isSelected && styles.moodEmojiCircleActive,
                ]}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
              </View>
              <View style={styles.moodTextGroup}>
                <Text
                  style={[
                    styles.moodLabel,
                    isSelected && styles.moodLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
                <Text
                  style={[styles.moodDesc, isSelected && styles.moodDescActive]}
                  numberOfLines={1}
                >
                  {m.desc}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

// 3. Category Tile with Spring Animation
function CategoryTile({ item, routerPath }) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 14, stiffness: 280 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 250 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push("programs/" + routerPath);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.categoryItem, animatedStyle]}>
        <LinearGradient
          colors={["#DCFCE7", "#F0FDF4"]}
          style={styles.categoryIconCircle}
        >
          <Ionicons name={item.icon} size={24} color="#15803D" />
        </LinearGradient>
        <Text style={styles.categoryLabel} numberOfLines={2}>
          {item.title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// Main Client Dashboard Component
export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [firstName, setFirstName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [upcomingPrograms, setUpcomingPrograms] = useState([]);
  const [registeredProgramIds, setRegisteredProgramIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchDashboardData();
      }
    }, [user?.id]),
  );

  useFocusEffect(
    useCallback(() => {
      checkAppointmentReminders();
    }, []),
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, first_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        const derivedFirstName =
          profile.first_name ||
          (profile.full_name ? profile.full_name.split(" ")[0] : "Friend");
        setFirstName(derivedFirstName);
      }

      // 2. Fetch Active/Pending Appointments
      const { data: aptData, error: aptError } = await supabase
        .from("appointments")
        .select(
          `
          id,
          scheduled_start_time,
          status,
          counseling_type,
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

      if (!aptError && aptData) {
        const formattedApts = aptData.map((item) => {
          const counselorName = item.counselor?.full_name
            ? `with ${item.counselor.full_name}`
            : `(${item.counseling_type || "Session"})`;

          return {
            id: item.id,
            title: `Counseling Session ${counselorName}`,
            dateTime: item.scheduled_start_time
              ? new Date(item.scheduled_start_time).toLocaleString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "To be scheduled",
            status: item.status,
          };
        });
        setAppointments(formattedApts);
      }

      // 3. Fetch Upcoming Programs
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
    }
  };

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

  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return { bg: "#DCFCE7", text: "#15803D" };
      case "rescheduled":
      case "rescheduled_requested":
        return { bg: "#E0F2FE", text: "#0369A1" };
      case "pending_payment":
        return { bg: "#FEF3C7", text: "#B45309" };
      default:
        return { bg: "#F1F5F9", text: "#475569" };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          {/* Header Banner */}
          <View style={styles.heroWrapper}>
            <LinearGradient
              colors={["#FEF3C7", "#ECFDF5", "#F0FDF4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <AuroraBlobs width={width} height={height * 0.28} />

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

                <RotatingText
                  phrases={[
                    "Find your next mentor",
                    "Book verified counseling",
                    "Track life transitions",
                  ]}
                />

                <Text style={styles.welcomeSubtitle}>
                  You don't have to navigate life transitions alone. Share your
                  journey with verified mentors and counselors.
                </Text>
              </Animated.View>
            </View>
          </View>

          {/* Interactive Mood Widget */}
          <View style={styles.moodWidgetWrapper}>
            <InteractiveMoodWidget />
          </View>

          {/* Main Content Sections */}
          <View style={styles.sectionContainer}>
            {/* Guidance Category Grid */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              style={styles.sectionBlock}
            >
              <Text style={styles.sectionHeader}>
                What guidance do you need today?
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((item) => (
                  <CategoryTile
                    key={item.id}
                    item={item}
                    routerPath={item.routerPath}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Upcoming Events Block */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Upcoming Events</Text>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : upcomingPrograms.length > 0 ? (
                upcomingPrograms.map((program, idx) => {
                  const isUserRegistered = registeredProgramIds.has(program.id);

                  return (
                    <Animated.View
                      key={program.id}
                      entering={FadeInRight.delay(200 + idx * 100).duration(
                        400,
                      )}
                      style={[styles.cardContainer, { marginBottom: 14 }]}
                    >
                      <View style={styles.cardHeaderRow}>
                        <LinearGradient
                          colors={["#DCFCE7", "#F0FDF4"]}
                          style={styles.iconTag}
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#15803D"
                          />
                        </LinearGradient>
                        <View style={styles.badgeTag}>
                          <Text style={styles.badgeText}>
                            {program.category || "Event"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.cardTitle}>{program.title}</Text>
                      <Text style={styles.cardSubText} numberOfLines={2}>
                        {program.description}
                      </Text>

                      <View style={styles.timeRow}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text style={styles.timeText}>
                          {new Date(program.starts_at).toLocaleString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>

                      <View style={{ marginTop: 14 }}>
                        {isUserRegistered ? (
                          <ShimmerButton
                            label={
                              program.location_type === "virtual"
                                ? "Join Meeting"
                                : program.location_type === "phone"
                                  ? "Join Call"
                                  : program.location_details
                                    ? `Venue: ${program.location_details}`
                                    : "Registered (Physical Venue)"
                            }
                            onPress={() =>
                              openLocationAction(
                                program.location_type,
                                program.location_details,
                              )
                            }
                          />
                        ) : (
                          <ShimmerButton
                            label="Register Now"
                            onPress={() =>
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
                          />
                        )}
                      </View>
                    </Animated.View>
                  );
                })
              ) : (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyTitle}>No Upcoming Events</Text>
                  <Text style={styles.emptySubtitle}>
                    Check back later for new programs and workshops.
                  </Text>
                </View>
              )}
            </View>

            {/* Appointments Block */}
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
                <ActivityIndicator size="small" color="#16A34A" />
              ) : appointments.length > 0 ? (
                appointments.map((apt, idx) => {
                  const statusStyle = getStatusBadgeStyle(apt.status);
                  return (
                    <Animated.View
                      key={apt.id}
                      entering={FadeInDown.delay(200 + idx * 100).duration(400)}
                      style={[styles.appointmentCard, { marginBottom: 12 }]}
                    >
                      <View style={styles.appointmentIconWrapper}>
                        <Ionicons
                          name="person-outline"
                          size={22}
                          color="#0F172A"
                        />
                      </View>
                      <View style={styles.appointmentContent}>
                        <View style={styles.aptHeaderRow}>
                          <Text style={[styles.cardTitle, { flex: 1 }]}>
                            {apt.title}
                          </Text>
                          <View
                            style={[
                              styles.badgeTag,
                              { backgroundColor: statusStyle.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                { color: statusStyle.text },
                              ]}
                            >
                              {apt.status}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.timeRow}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#64748B"
                          />
                          <Text style={styles.timeText}>{apt.dateTime}</Text>
                        </View>

                        <Pressable
                          style={styles.secondaryButton}
                          onPress={() => router.push("appointment")}
                        >
                          <Text style={styles.secondaryBtnText}>
                            View Session Details
                          </Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })
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
                  <View style={{ width: "100%", marginTop: 16 }}>
                    <ShimmerButton
                      label="Book a Session"
                      onPress={() => router.push("appointment")}
                    />
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
