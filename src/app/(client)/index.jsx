import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkAppointmentReminders } from "../../../libs/appointmentsReminder";
import { supabase } from "../../../libs/supabase";
import { CATEGORIES } from "../../components/client/Dashboard";
import NotificationBell from "../../components/NotificationBell";
import { styles } from "../../styles/(client)/Dashboard";
import { useAuth } from "../_layout";

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

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

      // 1. Fetch First Name from Profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, first_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        const derivedFirstName =
          profile.first_name ||
          (profile.full_name ? profile.full_name.split(" ")[0] : "User");
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

      if (aptError) {
        console.error("Error fetching appointments:", aptError);
      } else if (aptData) {
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

        // 4. Check user's registered program IDs
        const programIds = programData.map((p) => p.id);
        if (programIds.length > 0) {
          const { data: userRegs } = await supabase
            .from("program_participants")
            .select("program_id")
            .eq("client_id", user.id)
            .in("program_id", programIds);

          if (userRegs) {
            const regSet = new Set(userRegs.map((r) => r.program_id));
            setRegisteredProgramIds(regSet);
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
        return { bg: "#DCFCE7", text: "#15803D" }; // Green
      case "rescheduled":
      case "rescheduled_requested":
        return { bg: "#E0F2FE", text: "#0369A1" }; // Blue
      case "pending_payment":
        return { bg: "#FEF3C7", text: "#B45309" }; // Amber/Yellow
      default:
        return { bg: "#F1F5F9", text: "#475569" };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Banner */}
          <ImageBackground
            source={require("../../../assets/images/client/header.jpg")}
            style={styles.headerBannerImage}
            resizeMode="cover"
          >
            <View style={styles.headerOverlay}>
              <View style={styles.topRow}>
                <View style={styles.locationBadge}>
                  <Ionicons name="location-sharp" size={14} color="#FFFFFF" />
                  <Text style={styles.locationText}>Kenya</Text>
                </View>

                <View style={styles.headerActions}>
                  <NotificationBell
                    userId={user?.id}
                    color="#FFFFFF"
                    route="/notifications"
                  />

                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={logout}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={18}
                      color="#FFD1D1"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>
                  Karibu {firstName || "Friend"}!
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  You don't have to navigate life transitions alone. Share your
                  journey with verified mentors and counselors.
                </Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.sectionContainer}>
            {/* Guidance Tracks Category Grid */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>
                What guidance do you need today?
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.categoryItem}
                    activeOpacity={0.7}
                    onPress={() => router.push("programs/" + item.routerPath)}
                  >
                    <View style={styles.categoryIconCircle}>
                      <Ionicons name={item.icon} size={22} color="#16A34A" />
                    </View>
                    <Text style={styles.categoryLabel} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Upcoming Events Block */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Upcoming Events</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : upcomingPrograms.length > 0 ? (
                upcomingPrograms.map((program) => {
                  const isUserRegistered = registeredProgramIds.has(program.id);

                  return (
                    <View
                      key={program.id}
                      style={[styles.cardContainer, { marginBottom: 12 }]}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.iconTag}>
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#16A34A"
                          />
                        </View>
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

                      {/* Action Button: Conditional Rendering based on Registration */}
                      {isUserRegistered ? (
                        program.location_type === "virtual" ? (
                          <TouchableOpacity
                            style={[
                              styles.primaryButton,
                              { backgroundColor: "#0284C7" },
                            ]}
                            activeOpacity={0.8}
                            onPress={() =>
                              openLocationAction(
                                program.location_type,
                                program.location_details,
                              )
                            }
                          >
                            <Ionicons
                              name="videocam"
                              size={16}
                              color="#FFFFFF"
                            />
                            <Text style={styles.primaryBtnText}>
                              Join Meeting
                            </Text>
                          </TouchableOpacity>
                        ) : program.location_type === "phone" ? (
                          <TouchableOpacity
                            style={[
                              styles.primaryButton,
                              { backgroundColor: "#2563EB" },
                            ]}
                            activeOpacity={0.8}
                            onPress={() =>
                              openLocationAction(
                                program.location_type,
                                program.location_details,
                              )
                            }
                          >
                            <Ionicons name="call" size={16} color="#FFFFFF" />
                            <Text style={styles.primaryBtnText}>Join Call</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.primaryButton,
                              { backgroundColor: "#475569" },
                            ]}
                            activeOpacity={0.8}
                            onPress={() =>
                              openLocationAction(
                                program.location_type,
                                program.location_details,
                              )
                            }
                          >
                            <Ionicons
                              name="location"
                              size={16}
                              color="#FFFFFF"
                            />
                            <Text style={styles.primaryBtnText}>
                              {program.location_details
                                ? `Venue: ${program.location_details}`
                                : "Registered (Physical Venue)"}
                            </Text>
                          </TouchableOpacity>
                        )
                      ) : (
                        <TouchableOpacity
                          style={styles.primaryButton}
                          activeOpacity={0.8}
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
                        >
                          <Text style={styles.primaryBtnText}>
                            Register Now
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyTitle}>No Upcoming Events</Text>
                  <Text style={styles.emptySubtitle}>
                    Check back later for new programs.
                  </Text>
                </View>
              )}
            </View>

            {/* Appointments Block */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Pending Appointments</Text>
                {appointments.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push("appointment")}
                  >
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : appointments.length > 0 ? (
                appointments.map((apt) => {
                  const statusStyle = getStatusBadgeStyle(apt.status);
                  return (
                    <View
                      key={apt.id}
                      style={[styles.appointmentCard, { marginBottom: 10 }]}
                    >
                      <View style={styles.appointmentIconWrapper}>
                        <Ionicons
                          name="person-outline"
                          size={24}
                          color="#0F172A"
                        />
                      </View>
                      <View style={styles.appointmentContent}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
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
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          activeOpacity={0.8}
                          onPress={() => router.push("appointment")}
                        >
                          <Text style={styles.secondaryBtnText}>
                            View Session Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyStateCard}>
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
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.8}
                    onPress={() => router.push("appointment")}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryBtnText}>Book a Session</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
