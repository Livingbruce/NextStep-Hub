import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { styles } from "../../styles/(counselor)/home";
import { useAuth } from "../_layout";

export default function CounselorDashboard() {
  const { user, logout } = useAuth();

  const [counselorFirstName, setCounselorFirstName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        Alert.alert("Authentication Error", "Please sign in again.");
        return;
      }

      // 1. Verify UID against public.profiles and fetch first_name
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, surname")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Could not fetch user profile:", profileError);
      }

      // Set first name from DB profile, fallback to user_metadata or email
      if (profileData?.first_name) {
        setCounselorFirstName(profileData.first_name);
      } else if (currentUser?.user_metadata?.first_name) {
        setCounselorFirstName(currentUser.user_metadata.first_name);
      } else if (currentUser?.email) {
        const emailPrefix = currentUser.email.split("@")[0];
        setCounselorFirstName(
          emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1),
        );
      } else {
        setCounselorFirstName("Counselor");
      }

      // 2. Fetch upcoming / scheduled appointments for this counselor
      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select(
            `
            id,
            counseling_type,
            reasons,
            other_reason,
            session_goals,
            notes,
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

      // 3. Fetch reviews submitted for this counselor's appointments
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("appointment_reviews")
        .select(
          `
          id,
          rating,
          feedback_text,
          created_at,
          appointment:appointment_id (
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
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      setSessions(appointmentsData || []);
      setReviews(reviewsData || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      Alert.alert("Error", "Could not load counselor dashboard information.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getFirstName = () => counselorFirstName || "Counselor";

  const handleJoinCall = (sessionLink) => {
    if (!sessionLink || !sessionLink.trim()) {
      Alert.alert(
        "Meeting Link Missing",
        "Please attach a virtual meeting link to this session before joining.",
        [{ text: "OK" }],
      );
      return;
    }

    Linking.openURL(sessionLink).catch(() => {
      Alert.alert("Error", "Could not open virtual room meeting URL.");
    });
  };

  const toggleExpandReview = (id) => {
    setExpandedReviewId((prev) => (prev === id ? null : id));
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    const dateObj = new Date(isoString);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeSubtitle}>{getGreeting()},</Text>
          <Text style={styles.welcomeTitle}>{getFirstName()}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => Alert.alert("Notifications", "No new alerts.")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionIconBtn, styles.logoutBtn]}
            onPress={logout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#1E3A8A"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {/* Upcoming Sessions Section */}
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            {sessions.length > 0 ? (
              sessions.map((session) => {
                const clientName = session.client
                  ? `${session.client.first_name || ""} ${session.client.surname || ""}`.trim()
                  : "Client";
                const phone = session.client?.phone_no || "N/A";
                const county = session.client?.county || "Unspecified";

                return (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {session.counseling_type}
                        </Text>
                      </View>
                      <Text style={styles.timeText}>
                        {formatDateTime(session.scheduled_start_time)}
                      </Text>
                    </View>

                    <Text style={styles.clientName}>{clientName}</Text>
                    <Text style={styles.clientMeta}>
                      Location: {county} County • Contact: {phone}
                    </Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => handleJoinCall(session.session_link)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="videocam-outline"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.joinBtnText}>
                          Join Virtual Room
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="calendar-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyStateText}>
                  No upcoming sessions scheduled.
                </Text>
              </View>
            )}

            {/* Client Reviews Section */}
            <Text style={styles.sectionTitle}>Client Reviews</Text>
            {reviews.length > 0 ? (
              reviews.map((item) => {
                const isExpanded = expandedReviewId === item.id;
                const clientObj = item.appointment?.client;
                const clientName = clientObj
                  ? `${clientObj.first_name || ""} ${clientObj.surname || ""}`.trim()
                  : "Anonymous Client";
                const sessionCategory =
                  item.appointment?.counseling_type || "General Counseling";
                const sessionDate = formatDateTime(
                  item.appointment?.scheduled_start_time,
                );
                const county = clientObj?.county || "N/A";

                return (
                  <View key={item.id} style={styles.reviewCard}>
                    <TouchableOpacity
                      style={styles.reviewHeader}
                      onPress={() => toggleExpandReview(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.reviewMainInfo}>
                        <View style={styles.reviewTopRow}>
                          <Text style={styles.reviewClientName}>
                            {clientName}
                          </Text>
                          <View style={styles.starRow}>
                            {[...Array(item.rating || 0)].map((_, i) => (
                              <Ionicons
                                key={i}
                                name="star"
                                size={14}
                                color="#F59E0B"
                              />
                            ))}
                          </View>
                        </View>
                        <Text
                          style={styles.reviewSnippet}
                          numberOfLines={isExpanded ? undefined : 2}
                        >
                          "{item.feedback_text || "No written review provided."}
                          "
                        </Text>
                      </View>

                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#64748B"
                        style={styles.chevronIcon}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.reviewDetailsDrawer}>
                        <Text style={styles.drawerTitle}>
                          Appointment Details
                        </Text>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="pricetag-outline"
                            size={15}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>
                            Category: {sessionCategory}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={15}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>
                            Date: {sessionDate}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="location-outline"
                            size={15}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>
                            County: {county} County
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={36}
                  color="#94A3B8"
                />
                <Text style={styles.emptyStateText}>
                  No client reviews recorded yet.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
